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

import ast
from collections import deque
import keyword
import os
import sys

from kale.common import flakeutils


def _names_in_target(target):
    """Assignment target names, descending into tuple/list unpacking."""
    if isinstance(target, ast.Name):
        return {target.id}
    if isinstance(target, (ast.Tuple, ast.List)):
        names = set()
        for elt in target.elts:
            names |= _names_in_target(elt)
        return names
    return set()


def _defined_names(code):
    """Names bound at module top level, not inside function or class bodies.

    Only ``ast.parse(code).body`` is scanned (not ``ast.walk``), so a name
    assigned inside a ``def`` or ``class`` does not leak out as a boundary
    variable. This matches how Kale detects cell-to-cell dependencies.
    """
    names = set()
    for node in ast.parse(code).body:
        if isinstance(node, ast.Assign):
            for target in node.targets:
                names |= _names_in_target(target)
        elif isinstance(node, (ast.AugAssign, ast.AnnAssign)) and isinstance(node.target, ast.Name):
            names.add(node.target.id)
    return names


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
        raise ValueError("Cycle detected in the notebook dependency graph.")
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


def _defining_step(steps, var):
    """Last step (in order) whose code defines ``var``."""
    found = None
    for step in steps:
        if var in _defined_names("\n".join(step.source)):
            found = step
    return found or steps[-1]


def _using_steps(steps, var):
    """Every step whose code references ``var`` without defining it.

    Returns all consumers (not just the first) so a boundary variable used by
    more than one step in a notebook is wired into each of them.
    """
    return [step for step in steps if var in flakeutils.pyflakes_report("\n".join(step.source))]


def _producer_step(steps, var, consumer):
    """Upstream step that lists ``var`` among its outputs."""
    producer = None
    for step in steps:
        if step.name == consumer.name:
            break
        if var in step.outs:
            producer = step
    return producer or consumer


def extract_notebook_references(parent_path):
    """Ordered ``(name, resolved_path)`` for each ``notebook:`` cell in a notebook.

    A ``notebook:`` cell references another notebook as a sub-pipeline. Its path
    is read from the cell's ``notebook_path`` metadata and resolved relative to
    the parent notebook's directory. Returns ``[]`` for a regular notebook with
    no ``notebook:`` cells, which is how the CLI tells composition apart from the
    single-notebook path. Both tag forms are accepted (``notebook:<name>`` and
    the UI-written ``step:notebook:<name>``, see ``NOTEBOOK_TAG``).

    A composition notebook cannot also carry executable code: mixed
    ``step:``/``notebook:`` compositions are not supported yet, and dropping the
    code silently would compile a pipeline that is missing user code. Any
    non-empty code cell that is not a ``notebook:`` reference (and not tagged
    ``skip``) raises.
    """
    import re

    import nbformat

    from kale.processors.nbprocessor import NOTEBOOK_TAG

    parent_dir = os.path.dirname(os.path.abspath(parent_path))
    refs = []
    stray_cells = []
    for cell in nbformat.read(parent_path, 4).cells:
        if cell.get("cell_type") != "code":
            continue
        tags = cell.get("metadata", {}).get("tags", [])
        for tag in tags:
            if re.match(NOTEBOOK_TAG, tag):
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
        if "skip" in tags:
            continue
        if "".join(cell.get("source") or "").strip():
            stray_cells.append(f"`{tags[0]}`" if tags else "untagged")
    if refs and stray_cells:
        raise ValueError(
            "A composition notebook cannot mix code cells with `notebook:` references "
            f"yet (found code in {len(stray_cells)} cell(s): {', '.join(stray_cells)}). "
            "Move the code into a referenced notebook, or tag the cell with `skip`."
        )
    return refs


def compose_notebooks_as_subpipelines(
    notebook_paths,
    pipeline_name="kale-workflow",
    experiment_name="Kale-Workflow-Experiment",
    base_image="",
    pipeline_description=None,
):
    """Compose notebooks into one pipeline, each notebook a KFP sub-pipeline.

    Runs Kale's NotebookProcessor and Compiler per notebook so each notebook's
    internal steps form a nested sub-DAG, then wires the sub-pipelines together
    by matching the data each notebook produces and consumes.

    Writes one DSL module per notebook (``.kale/<name>.py``) plus the
    orchestrating DSL script that imports them. Returns ``(dsl_script_path,
    order)`` where ``dsl_script_path`` is the orchestrator.
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
        notebooks[name] = {
            "pipeline": pipeline,
            "imports_and_functions": proc.get_imports_and_functions(),
            "defined": _defined_names(step_code),
            "needed": flakeutils.pyflakes_report(step_code),
            "display": name.replace("_", "-"),
        }

    # var -> every notebook that defines it, so an ambiguous producer is caught
    # instead of being resolved silently to whichever notebook came first.
    producers = {}
    for name, nb in notebooks.items():
        for var in nb["defined"]:
            producers.setdefault(var, []).append(name)

    producer = {}
    boundary_needs = {name: [] for name in notebooks}
    boundary_provides = {name: [] for name in notebooks}
    edges = []
    for name, nb in notebooks.items():
        for var in sorted(nb["needed"]):
            sources = [s for s in producers.get(var, []) if s != name]
            if not sources:
                continue
            if len(sources) > 1:
                raise ValueError(
                    f"Notebook '{name}' consumes '{var}', but it is defined in "
                    f"multiple notebooks ({', '.join(sorted(sources))}). Rename it "
                    f"so a single notebook produces the value."
                )
            src = sources[0]
            producer[var] = src
            boundary_needs[name].append(var)
            if var not in boundary_provides[src]:
                boundary_provides[src].append(var)
            edges.append((src, name))

    order = _topo_sort(list(notebooks), edges)

    # Mark each boundary variable on its producing/consuming step so Kale's
    # component generator exposes it as an input/output artifact.
    produces_var = {}
    for name, nb in notebooks.items():
        steps = list(nb["pipeline"].steps)
        for var in boundary_provides[name]:
            step = _defining_step(steps, var)
            if var not in step.outs:
                step.outs.append(var)
            produces_var[(name, var)] = step.name
        for var in boundary_needs[name]:
            for step in _using_steps(steps, var) or [steps[0]]:
                if var not in step.ins:
                    step.ins.append(var)

    subpipelines = []
    for name in order:
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

    toplevel_calls = []
    for name in order:
        inputs, after = [], []
        for var in sorted(boundary_needs[name]):
            src = producer[var]
            # One boundary output is reachable as `.output`; several become a
            # NamedTuple addressed by field name.
            if len(boundary_provides[src]) > 1:
                ref = f'{src}_task.outputs["{var}"]'
            else:
                ref = f"{src}_task.output"
            inputs.append({"arg": f"{var}_input_artifact", "ref": ref})
            after.append(f"{src}_task")
        toplevel_calls.append(
            {
                "task_var": f"{name}_task",
                "fn": f"{name}_pipeline",
                "inputs": inputs,
                "after": sorted(set(after)),
                "display": notebooks[name]["display"],
            }
        )

    env = Compiler(notebooks[order[0]]["pipeline"], "")._get_templating_env()
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
        modules=order,
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
