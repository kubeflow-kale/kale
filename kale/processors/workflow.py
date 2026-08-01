# Copyright 2026 The Kubeflow Authors.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
"""Compose multiple notebooks into a single Kubeflow pipeline.

Each notebook is compiled into its own KFP sub-pipeline by reusing Kale's
per-notebook processing and component generation. The sub-pipelines are wired
together by matching the variables one notebook defines to those another
consumes, the same name-based detection Kale uses between cells, one level up.
The single-notebook path is untouched.

Each notebook produces its own independent DSL module (``.kale/<name>.py``,
importable and independently compilable), and the orchestrating DSL file
imports those modules as dependencies. This mirrors the recursive shape of the
processing and gives every notebook ownership of its own configuration.
"""

from collections import deque
import keyword
import os
import sys

from kale.common import astutils, flakeutils


def _missing_names(code):
    """Names the code uses but does not define, via PyFlakes.

    The same detection ``dependencies_detection`` runs between cells, here
    applied to a whole unit (a notebook's step code, or a single step of the
    root notebook).
    """
    return set(flakeutils.pyflakes_report(code=code))


def _provided_names(code, missing):
    """Names a unit can hand to another unit.

    Kale's own :func:`astutils.get_marshal_candidates`, the scanner the
    cell-level dependency detection uses to pick what an ancestor marshals out,
    minus the names the unit is itself missing. The subtraction is what orients
    an edge: a variable a unit consumes is not one it provides.
    """
    return set(astutils.get_marshal_candidates(code)) - missing


def _topo_sort(nodes, edges):
    """Kahn topological sort. edges are (producer, consumer); raises on a cycle."""
    indeg = dict.fromkeys(nodes, 0)
    adj = {n: [] for n in nodes}
    for producer, consumer in edges:
        adj[producer].append(consumer)
        indeg[consumer] += 1
    queue = deque(sorted(n for n in nodes if indeg[n] == 0))
    order = []
    while queue:
        node = queue.popleft()
        order.append(node)
        for child in sorted(adj[node]):
            indeg[child] -= 1
            if indeg[child] == 0:
                queue.append(child)
    if len(order) != len(nodes):
        raise ValueError(
            "Cycle detected in the composition graph. If the composition notebook "
            "mixes step: and notebook: cells, each cell must appear below the "
            "cells that produce the variables it uses."
        )
    return order


def _notebook_name(path):
    base = os.path.splitext(os.path.basename(path))[0]
    return base.replace("-", "_").lower()


def _type_for(var_name):
    """KFP artifact type for a boundary variable.

    Mirrors Kale's compiler heuristic exactly (``compiler.py``: ``"Model" if
    "model" in var_name else "Dataset"``) so the sub-pipeline parameter type and
    the generated component's artifact type always agree. Metrics come from the
    ``pipeline-metrics`` tag, not name inference, so they are not mapped here;
    typed contracts are deferred to post-MVP.
    """
    return "Model" if "model" in var_name else "Dataset"


def _defining_step(steps, var, unit):
    """Last step (in order) of a notebook whose code provides ``var``."""
    found = None
    for step in steps:
        code = "\n".join(step.source)
        if var in _provided_names(code, _missing_names(code)):
            found = step
    if found is None:
        raise ValueError(
            f"'{unit}' was resolved as the producer of '{var}', but none of its "
            f"steps provides it. This is a bug in Kale's boundary detection."
        )
    return found


def _using_steps(steps, var, unit):
    """Every step of a notebook that references ``var`` without defining it.

    Returns all consumers (not just the first) so a boundary variable used by
    more than one step in a notebook is wired into each of them.
    """
    consumers = [step for step in steps if var in _missing_names("\n".join(step.source))]
    if not consumers:
        raise ValueError(
            f"'{unit}' was resolved as a consumer of '{var}', but none of its "
            f"steps requires it. This is a bug in Kale's boundary detection."
        )
    return consumers


def _producer_step(steps, var, consumer):
    """Upstream step of the same notebook that lists ``var`` among its outputs."""
    producer = None
    for step in steps:
        if step.name == consumer.name:
            break
        if var in step.outs:
            producer = step
    if producer is None:
        raise ValueError(
            f"Step '{consumer.name}' requires '{var}', but no earlier step in the "
            f"same notebook produces it. This is a bug in Kale's boundary detection."
        )
    return producer


def extract_notebook_references(parent_path):
    """Ordered ``(name, resolved_path)`` for each ``notebook:`` cell in a notebook.

    A ``notebook:`` cell references another notebook as a sub-pipeline. Its path
    is read from the cell's ``notebook_path`` metadata and resolved relative to
    the parent notebook's directory. Returns ``[]`` for a regular notebook with
    no ``notebook:`` cells, which is how the CLI tells composition apart from the
    single-notebook path. Both tag forms are accepted (``notebook:<name>`` and
    the UI-written ``step:notebook:<name>``, see ``NOTEBOOK_TAG``).

    The composition notebook may also carry its own ``step:``/``imports``/
    ``functions`` cells (KEP-0812 Story 2); those are handled by the normal
    NotebookProcessor pass over the parent. A reference cell itself must stay
    empty: its code would never execute, so it raises instead of being dropped.
    """
    import re

    import nbformat

    from kale.processors.nbprocessor import NOTEBOOK_TAG

    parent_dir = os.path.dirname(os.path.abspath(parent_path))
    refs = []
    for cell in nbformat.read(parent_path, 4).cells:
        if cell.get("cell_type") != "code":
            continue
        tags = cell.get("metadata", {}).get("tags", [])
        is_ref = False
        for tag in tags:
            if re.match(NOTEBOOK_TAG, tag):
                is_ref = True
                name = tag.split("notebook:", 1)[1]
                if not name:
                    raise ValueError(
                        f"`{tag}` cell is missing the notebook name; use `notebook:<name>`."
                    )
                rel = cell.get("metadata", {}).get("notebook_path")
                if not rel:
                    raise ValueError(
                        f"`notebook:{name}` cell is missing a 'notebook_path' in its cell metadata."
                    )
                refs.append((name, os.path.normpath(os.path.join(parent_dir, rel))))
        if is_ref and "".join(cell.get("source") or "").strip():
            raise ValueError(
                f"A `notebook:` reference cell must be empty (found code in the "
                f"`{tags[0]}` cell). Move the code to its own `step:` cell or "
                f"into the referenced notebook."
            )
    return refs


def _composition_spine(parent_path):
    """The composition notebook's units in cell order: ``(kind, name)`` pairs.

    ``kind`` is ``"step"`` for the notebook's own ``step:`` cells and
    ``"notebook"`` for its references. Cell position is what makes a mixed
    composition run the way it reads (see the reading-order barriers below).
    """
    import re

    import nbformat

    from kale.processors.nbprocessor import NOTEBOOK_TAG, STEP_TAG

    spine = []
    for cell in nbformat.read(parent_path, 4).cells:
        if cell.get("cell_type") != "code":
            continue
        for tag in cell.get("metadata", {}).get("tags", []):
            if re.match(NOTEBOOK_TAG, tag):
                rel = cell.get("metadata", {}).get("notebook_path")
                if rel:
                    spine.append(("notebook", _notebook_name(rel)))
                break
            if re.match(STEP_TAG, tag):
                name = tag.split(":", 1)[1]
                # a repeated step: tag merges into the first occurrence
                if name and ("step", name) not in spine:
                    spine.append(("step", name))
                break
    return spine


def compose_notebooks_as_subpipelines(
    notebook_paths,
    pipeline_name="kale-workflow",
    experiment_name="Kale-Workflow-Experiment",
    base_image="",
    pipeline_description=None,
    parent_path=None,
):
    """Compose notebooks into one pipeline, each notebook a KFP sub-pipeline.

    Runs Kale's NotebookProcessor and Compiler per notebook so each notebook's
    internal steps form a nested sub-DAG, then wires the sub-pipelines together
    by matching the data each notebook produces and consumes.

    When ``parent_path`` is given and that notebook carries its own ``step:``
    cells around the ``notebook:`` references (KEP-0812 Story 2), each such
    step becomes a top-level component, participating in the same name-based
    inference as the referenced notebooks: variables cross the step/notebook
    boundary the same way they cross step/step boundaries.

    Writes one DSL module per notebook (``.kale/<name>.py``) plus the
    orchestrating DSL script that imports them (and holds the composition
    notebook's own components, if any). Returns ``(dsl_script_path, order)``
    where ``dsl_script_path`` is the orchestrator and ``order`` interleaves
    notebook and step units in inferred topological order.
    """
    import autopep8

    from kale.compiler import Compiler
    from kale.processors import NotebookProcessor

    overrides = {"experiment_name": experiment_name}
    if base_image:
        overrides["base_image"] = base_image

    notebooks = {}
    for path in notebook_paths:
        name = _notebook_name(path)
        # Each notebook becomes an importable DSL module named after it, so the
        # names must be unique and must not shadow a standard-library module
        # (the generated code itself imports from the standard library).
        if name in notebooks:
            raise ValueError(
                f"Two notebooks share the name '{name}'. Rename one of them: each "
                f"notebook becomes its own DSL module."
            )
        if not name.isidentifier() or keyword.iskeyword(name):
            raise ValueError(
                f"Notebook name '{name}' is not a valid Python module name. Rename "
                f"the notebook: each notebook becomes its own importable DSL module."
            )
        if name in sys.stdlib_module_names or name in ("kfp", "kale"):
            raise ValueError(
                f"Notebook name '{name}' collides with a reserved module name "
                f"(Python standard-library, 'kfp' or 'kale'). Rename the notebook: "
                f"each notebook becomes its own importable DSL module."
            )
        proc = NotebookProcessor(path, {**overrides, "pipeline_name": name.replace("_", "-")})
        pipeline = proc.run()
        # Only code that runs as a step counts. Untagged cells never become a
        # step, so scanning raw cells would invent variables no step produces.
        step_code = "\n".join("\n".join(s.source) for s in pipeline.steps)
        missing = _missing_names(step_code)
        notebooks[name] = {
            "pipeline": pipeline,
            "imports_and_functions": proc.get_imports_and_functions(),
            "defined": _provided_names(step_code, missing),
            "needed": missing,
            "display": name.replace("_", "-"),
        }

    # Story 2 (KEP-0812): the composition notebook may carry its own `step:`
    # cells around the `notebook:` references. Each such step is a unit of its
    # own in the inference below (one unit for the whole parent would deadlock:
    # a step can run before one referenced notebook and after another).
    parent_steps = {}
    parent_compiler = None
    parent_edges = []
    if parent_path:
        parent_proc = NotebookProcessor(
            parent_path,
            {**overrides, "pipeline_name": pipeline_name},
            allow_notebook_references=True,
        )
        parent_pipeline = parent_proc.run()
        for step in parent_pipeline.steps:
            if step.name in notebooks:
                raise ValueError(
                    f"Step '{step.name}' in the composition notebook has the same "
                    f"name as a referenced notebook. Rename one of them."
                )
            code = "\n".join(step.source)
            missing = _missing_names(code)
            parent_steps[step.name] = {
                "step": step,
                "defined": _provided_names(code, missing),
                "needed": missing,
            }
        # explicit `prev:` edges between parent steps order them even when no
        # data flows between them
        parent_edges = list(parent_pipeline.edges)
        if parent_steps:
            parent_compiler = Compiler(parent_pipeline, parent_proc.get_imports_and_functions())

    # var -> every unit (notebook or parent step) that defines it, so an
    # ambiguous producer is caught instead of resolved silently to whichever
    # unit came first.
    units = {**notebooks, **parent_steps}

    # Reading-order barriers: a parent step waits for every unit above it in
    # the composition notebook and blocks every unit below it, so a mixed
    # composition runs the way it reads. Reference-only pairs get no edge,
    # which keeps Story 1's parallelism between independent notebooks intact.
    barrier_edges = []
    if parent_steps:
        spine = [(kind, name) for kind, name in _composition_spine(parent_path) if name in units]
        for i, (kind_i, name_i) in enumerate(spine):
            for kind_j, name_j in spine[i + 1 :]:
                if "step" in (kind_i, kind_j):
                    barrier_edges.append((name_i, name_j))
    barrier_preds = {}
    for src, dst in barrier_edges:
        barrier_preds.setdefault(dst, set()).add(src)

    producers = {}
    for name, unit in units.items():
        for var in unit["defined"]:
            producers.setdefault(var, []).append(name)

    producer = {}
    boundary_needs = {name: [] for name in units}
    boundary_provides = {name: [] for name in units}
    edges = list(parent_edges) + barrier_edges
    for name, unit in units.items():
        for var in sorted(unit["needed"]):
            sources = [s for s in producers.get(var, []) if s != name]
            if not sources:
                continue
            if len(sources) > 1:
                raise ValueError(
                    f"'{name}' consumes '{var}', but it is defined in multiple "
                    f"notebooks/steps ({', '.join(sorted(sources))}). Rename it "
                    f"so a single unit produces the value."
                )
            src = sources[0]
            producer[var] = src
            boundary_needs[name].append(var)
            if var not in boundary_provides[src]:
                boundary_provides[src].append(var)
            edges.append((src, name))

    order = _topo_sort(list(units), edges)

    # Mark each boundary variable on its producing/consuming step so Kale's
    # component generator exposes it as an input/output artifact.
    produces_var = {}
    for name, nb in notebooks.items():
        steps = list(nb["pipeline"].steps)
        for var in boundary_provides[name]:
            step = _defining_step(steps, var, name)
            if var not in step.outs:
                step.outs.append(var)
            produces_var[(name, var)] = step.name
        for var in boundary_needs[name]:
            for step in _using_steps(steps, var, name):
                if var not in step.ins:
                    step.ins.append(var)
    for name, ps in parent_steps.items():
        for var in boundary_provides[name]:
            if var not in ps["step"].outs:
                ps["step"].outs.append(var)
        for var in boundary_needs[name]:
            if var not in ps["step"].ins:
                ps["step"].ins.append(var)

    subpipelines = []
    for name in order:
        if name in parent_steps:
            continue
        nb = notebooks[name]
        steps = list(nb["pipeline"].steps)
        compiler = Compiler(nb["pipeline"], nb["imports_and_functions"])
        components = []

        params = [
            {"name": f"{v}_input_artifact", "type": _type_for(v)}
            for v in sorted(boundary_needs[name])
        ]
        outputs = [
            {
                "var": v,
                "type": _type_for(v),
                "ref": f'{produces_var[(name, v)]}_task.outputs["{v}_output_artifact"]',
            }
            for v in sorted(boundary_provides[name])
        ]

        tasks = []
        for step in steps:
            # Capture the wiring first: generate_lightweight_component mutates
            # step.source.
            inputs, after = [], []
            for var in sorted(step.ins):
                if var in boundary_needs[name]:
                    ref = f"{var}_input_artifact"
                else:
                    anc = _producer_step(steps, var, step)
                    ref = f'{anc.name}_task.outputs["{var}_output_artifact"]'
                    after.append(f"{anc.name}_task")
                inputs.append({"arg": f"{var}_input_artifact", "ref": ref})
            tasks.append(
                {
                    "task_var": f"{step.name}_task",
                    "fn": f"{step.name}_step",
                    "inputs": inputs,
                    "after": sorted(set(after)),
                    "display": step.name,
                }
            )
            components.append(compiler.generate_lightweight_component(step))

        subpipelines.append(
            {
                "name": name,
                "display": nb["display"],
                "params": params,
                "outputs": outputs,
                "tasks": tasks,
                "components": components,
            }
        )

    def _toplevel_ref(var):
        """(producing unit, task-output reference) for a boundary variable."""
        src = producer.get(var)
        if src is None:
            raise ValueError(
                f"Cannot resolve the producer of '{var}' at the top level. This is "
                f"a bug in Kale's boundary detection."
            )
        if src in parent_steps:
            # a component task exposes each output artifact by parameter name
            return src, f'{src}_task.outputs["{var}_output_artifact"]'
        # One sub-pipeline output is reachable as `.output`; several become a
        # NamedTuple addressed by field name.
        if len(boundary_provides[src]) > 1:
            return src, f'{src}_task.outputs["{var}"]'
        return src, f"{src}_task.output"

    parent_components = []
    toplevel_calls = []
    for name in order:
        inputs, after = [], []
        if name in parent_steps:
            step = parent_steps[name]["step"]
            # Capture the wiring first: generate_lightweight_component mutates
            # step.source. step.ins covers both cross-unit boundaries (injected
            # above) and flows wired by the parent's own `prev:` dependencies.
            for var in sorted(step.ins):
                src, ref = _toplevel_ref(var)
                inputs.append({"arg": f"{var}_input_artifact", "ref": ref})
                after.append(f"{src}_task")
            after.extend(f"{p}_task" for p in barrier_preds.get(name, ()))
            toplevel_calls.append(
                {
                    "kind": "step",
                    "task_var": f"{name}_task",
                    "fn": f"{name}_step",
                    "inputs": inputs,
                    "after": sorted(set(after)),
                    "display": name,
                }
            )
            parent_components.append(
                autopep8.fix_code(parent_compiler.generate_lightweight_component(step))
            )
            continue
        for var in sorted(boundary_needs[name]):
            src, ref = _toplevel_ref(var)
            inputs.append({"arg": f"{var}_input_artifact", "ref": ref})
            after.append(f"{src}_task")
        after.extend(f"{p}_task" for p in barrier_preds.get(name, ()))
        toplevel_calls.append(
            {
                "kind": "pipeline",
                "task_var": f"{name}_task",
                "fn": f"{name}_pipeline",
                "inputs": inputs,
                "after": sorted(set(after)),
                "display": notebooks[name]["display"],
            }
        )

    env = Compiler(next(iter(notebooks.values()))["pipeline"], "")._get_templating_env()
    out_dir = os.path.join(os.getcwd(), ".kale")
    os.makedirs(out_dir, exist_ok=True)

    # One independent DSL module per notebook, importable by the orchestrator
    # below and compilable on its own through its __main__ hook.
    for sp in subpipelines:
        module_code = autopep8.fix_code(
            env.get_template("subpipeline_template.jinja2").render(sp=sp)
        )
        with open(os.path.join(out_dir, f"{sp['name']}.py"), "w") as f:
            f.write(module_code)

    # No autopep8 here: it would hoist the module imports above the sys.path
    # bootstrap that makes them resolvable. The orchestrator is fully
    # template-controlled (no embedded user code), so it needs no reformatting.
    dsl = env.get_template("workflow_template.jinja2").render(
        modules=[name for name in order if name in notebooks],
        components=parent_components,
        toplevel_calls=toplevel_calls,
        pipeline_name=pipeline_name,
        pipeline_description=(
            pipeline_description or "Composed sub-pipelines: " + " -> ".join(order)
        ),
    )
    dsl_path = os.path.abspath(os.path.join(out_dir, f"{pipeline_name}.workflow.py"))
    with open(dsl_path, "w") as f:
        f.write(dsl)
    return dsl_path, order
