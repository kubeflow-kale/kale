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
"""Tests for multi-notebook composition (kale.processors.workflow)."""

import nbformat as nbf

from kale.processors.workflow import (
    _defined_names,
    _topo_sort,
    _type_for,
    compose_notebooks_as_subpipelines,
    extract_notebook_references,
)


def _write_nb(path, name, cells):
    nb = nbf.v4.new_notebook()
    nb.metadata["kubeflow_notebook"] = {
        "pipeline_name": name,
        "experiment_name": "test",
        "volumes": [],
    }
    for tags, src in cells:
        cell = nbf.v4.new_code_cell(source=src)
        cell.metadata["tags"] = tags
        nb.cells.append(cell)
    nbf.write(nb, str(path))


def _module(tmp_path, name):
    """Source of the generated per-notebook DSL module."""
    return open(tmp_path / ".kale" / f"{name}.py").read()


def test_topo_sort_orders_by_dependency():
    """Order is derived from edges, not input order."""
    assert _topo_sort(["c", "a", "b"], [("a", "b"), ("b", "c")]) == ["a", "b", "c"]


def test_topo_sort_detects_cycle():
    """A cyclic dependency graph is rejected."""
    import pytest

    with pytest.raises(ValueError):
        _topo_sort(["a", "b"], [("a", "b"), ("b", "a")])


def test_type_for_name_heuristic():
    """Artifact type matches the compiler's name heuristic."""
    assert _type_for("model") == "Model"
    assert _type_for("my_model") == "Model"
    assert _type_for("dataset") == "Dataset"
    assert _type_for("anything_else") == "Dataset"


def test_compose_infers_order_and_builds_subpipelines(tmp_path, monkeypatch):
    """Order is inferred from shared variable names, and each notebook becomes a
    wired sub-pipeline, regardless of the order the notebooks are passed in."""
    a = tmp_path / "notebook_a.ipynb"
    b = tmp_path / "notebook_b.ipynb"
    c = tmp_path / "notebook_c.ipynb"
    _write_nb(a, "notebook-a", [(["step:gen"], "dataset = [1, 2, 3]")])
    _write_nb(b, "notebook-b", [(["step:fit"], "model = sum(dataset)")])
    _write_nb(c, "notebook-c", [(["step:pred"], "prediction = model + 1")])

    monkeypatch.chdir(tmp_path)
    # Pass them out of order on purpose: order must be inferred, not positional.
    dsl_path, order = compose_notebooks_as_subpipelines(
        [str(c), str(a), str(b)], pipeline_name="seq"
    )

    assert order == ["notebook_a", "notebook_b", "notebook_c"]

    # One independent DSL module per notebook, with the inferred typed
    # boundary I/O in its sub-pipeline signature.
    assert "def notebook_a_pipeline(" in _module(tmp_path, "notebook_a")
    nb_b = _module(tmp_path, "notebook_b")
    assert "def notebook_b_pipeline(" in nb_b
    assert "dataset_input_artifact: Input[Dataset]" in nb_b
    nb_c = _module(tmp_path, "notebook_c")
    assert "def notebook_c_pipeline(" in nb_c
    assert "model_input_artifact: Input[Model]" in nb_c

    # The orchestrator imports the modules and wires each producer's output to
    # the next consumer.
    dsl = open(dsl_path).read()
    assert "from notebook_a import notebook_a_pipeline" in dsl
    assert "from notebook_b import notebook_b_pipeline" in dsl
    assert "from notebook_c import notebook_c_pipeline" in dsl
    assert "def auto_generated_pipeline(" in dsl
    assert "dataset_input_artifact=notebook_a_task.output" in dsl
    assert "model_input_artifact=notebook_b_task.output" in dsl


def test_compose_handles_multiple_outputs_from_one_notebook(tmp_path, monkeypatch):
    """A notebook producing >1 boundary output returns a NamedTuple, and the
    consumer references each output by name."""
    a = tmp_path / "notebook_a.ipynb"
    b = tmp_path / "notebook_b.ipynb"
    _write_nb(a, "notebook-a", [(["step:gen"], "dataset = [1, 2, 3]\nmodel = {'w': 2}")])
    _write_nb(b, "notebook-b", [(["step:use"], "prediction = sum(dataset) * model['w']")])

    monkeypatch.chdir(tmp_path)
    dsl_path, order = compose_notebooks_as_subpipelines([str(a), str(b)], pipeline_name="multi")
    assert order == ["notebook_a", "notebook_b"]

    # producer module returns a NamedTuple of both outputs
    nb_a = _module(tmp_path, "notebook_a")
    assert "-> NamedTuple('Outputs'" in nb_a
    assert "return NamedTuple('Outputs'" in nb_a
    # the orchestrator references each output by name (not the ambiguous `.output`)
    dsl = open(dsl_path).read()
    assert 'notebook_a_task.outputs["dataset"]' in dsl
    assert 'notebook_a_task.outputs["model"]' in dsl


def test_untagged_cell_is_not_treated_as_a_boundary_variable(tmp_path, monkeypatch):
    """A variable defined in an untagged cell is not part of any step, so it
    must not be injected as a step output (which crashed compilation before)."""
    a = tmp_path / "notebook_a.ipynb"
    b = tmp_path / "notebook_b.ipynb"
    # `scratch` lives in an untagged cell; only `dataset` is a real step output.
    nb = nbf.v4.new_notebook()
    nb.metadata["kubeflow_notebook"] = {"pipeline_name": "notebook-a", "volumes": []}
    c0 = nbf.v4.new_code_cell(source='scratch = "x"')  # no tags
    c1 = nbf.v4.new_code_cell(source="dataset = [1, 2, 3]")
    c1.metadata["tags"] = ["step:gen"]
    nb.cells = [c0, c1]
    nbf.write(nb, str(a))
    _write_nb(b, "notebook-b", [(["step:use"], "total = sum(dataset)")])

    monkeypatch.chdir(tmp_path)
    dsl_path, _ = compose_notebooks_as_subpipelines([str(a), str(b)], pipeline_name="ut")
    # `scratch` must never be saved/loaded as a pipeline artifact, in any
    # generated file
    generated = open(dsl_path).read() + _module(tmp_path, "notebook_a")
    assert "scratch" not in generated
    # the real step output is still wired
    assert "dataset_output_artifact" in _module(tmp_path, "notebook_a")


def test_defined_names_ignores_function_and_class_bodies():
    """Only module-top-level assignments are boundary variables; names bound
    inside a def or class body must not leak out."""
    code = "dataset = [1]\ndef f():\n    local = 1\nclass C:\n    attr = 2\n"
    assert _defined_names(code) == {"dataset"}


def test_defined_names_handles_tuple_unpacking():
    """Tuple/list unpacking targets are all captured."""
    assert _defined_names("a, b = 1, 2") == {"a", "b"}


def test_name_collision_across_notebooks_raises(tmp_path, monkeypatch):
    """A consumed variable defined by two notebooks is ambiguous and must raise,
    not silently pick the first producer."""
    import pytest

    a = tmp_path / "notebook_a.ipynb"
    b = tmp_path / "notebook_b.ipynb"
    c = tmp_path / "notebook_c.ipynb"
    _write_nb(a, "notebook-a", [(["step:g1"], "dataset = [1]")])
    _write_nb(b, "notebook-b", [(["step:g2"], "dataset = [2]")])
    _write_nb(c, "notebook-c", [(["step:use"], "total = sum(dataset)")])

    monkeypatch.chdir(tmp_path)
    with pytest.raises(ValueError, match="multiple notebooks"):
        compose_notebooks_as_subpipelines([str(a), str(b), str(c)], pipeline_name="col")


def test_boundary_variable_wired_into_all_consumers(tmp_path, monkeypatch):
    """A boundary variable used by more than one step in the consumer notebook is
    wired into every consumer, not just the first (fan-out within a notebook)."""
    a = tmp_path / "notebook_a.ipynb"
    b = tmp_path / "notebook_b.ipynb"
    _write_nb(a, "notebook-a", [(["step:gen"], "dataset = [1, 2, 3]")])
    _write_nb(
        b,
        "notebook-b",
        [(["step:first"], "total = sum(dataset)"), (["step:second"], "count = len(dataset)")],
    )

    monkeypatch.chdir(tmp_path)
    compose_notebooks_as_subpipelines([str(a), str(b)], pipeline_name="fan")
    # both steps receive `dataset`; before the fix only the first one did.
    nb_b = _module(tmp_path, "notebook_b")
    assert nb_b.count("dataset_input_artifact=dataset_input_artifact") == 2


def test_each_notebook_gets_an_independent_dsl_module(tmp_path, monkeypatch):
    """Each notebook compiles to its own importable DSL module with a __main__
    compile hook, and the orchestrator imports them instead of embedding them."""
    a = tmp_path / "notebook_a.ipynb"
    b = tmp_path / "notebook_b.ipynb"
    _write_nb(a, "notebook-a", [(["step:gen"], "dataset = [1, 2, 3]")])
    _write_nb(b, "notebook-b", [(["step:use"], "total = sum(dataset)")])

    monkeypatch.chdir(tmp_path)
    dsl_path, order = compose_notebooks_as_subpipelines([str(a), str(b)], pipeline_name="mods")

    for name in order:
        module = _module(tmp_path, name)
        # component code lives in the module, standalone-compilable
        assert "@kfp_dsl.component(" in module
        assert f"compiler.Compiler().compile({name}_pipeline" in module
    # the orchestrator holds no component code, only imports and wiring
    dsl = open(dsl_path).read()
    assert "@kfp_dsl.component(" not in dsl
    assert "from notebook_a import notebook_a_pipeline" in dsl
    assert "sys.path" in dsl  # modules resolve relative to the orchestrator


def test_notebook_named_like_a_stdlib_module_raises(tmp_path, monkeypatch):
    """A notebook whose module name would shadow the standard library (which
    the generated code imports) is rejected with a rename hint."""
    import pytest

    a = tmp_path / "json.ipynb"
    b = tmp_path / "notebook_b.ipynb"
    _write_nb(a, "json-nb", [(["step:gen"], "dataset = [1]")])
    _write_nb(b, "notebook-b", [(["step:use"], "total = sum(dataset)")])

    monkeypatch.chdir(tmp_path)
    with pytest.raises(ValueError, match="standard-library"):
        compose_notebooks_as_subpipelines([str(a), str(b)], pipeline_name="std")


def test_bare_notebook_tag_without_name_raises(tmp_path):
    """A `notebook:` tag with no name is malformed and must fail fast with a
    specific message, not slide through with an empty name."""
    import pytest

    main = tmp_path / "main.ipynb"
    nb = nbf.v4.new_notebook()
    nb.metadata["kubeflow_notebook"] = {"pipeline_name": "m", "volumes": []}
    ref = nbf.v4.new_code_cell(source="")
    ref.metadata["tags"] = ["notebook:"]
    ref.metadata["notebook_path"] = "./nb_a.ipynb"
    nb.cells = [ref]
    nbf.write(nb, str(main))

    with pytest.raises(ValueError, match="missing the notebook name"):
        extract_notebook_references(str(main))


def test_notebook_name_not_a_valid_identifier_raises(tmp_path, monkeypatch):
    """A filename that is not a valid Python module name (here: leading digit)
    cannot become a DSL module and must be rejected up front."""
    import pytest

    a = tmp_path / "2train.ipynb"
    b = tmp_path / "notebook_b.ipynb"
    _write_nb(a, "two-train", [(["step:gen"], "dataset = [1]")])
    _write_nb(b, "notebook-b", [(["step:use"], "total = sum(dataset)")])

    monkeypatch.chdir(tmp_path)
    with pytest.raises(ValueError, match="valid Python module name"):
        compose_notebooks_as_subpipelines([str(a), str(b)], pipeline_name="ident")


def test_notebook_named_kfp_raises(tmp_path, monkeypatch):
    """A notebook named after a package the generated DSL imports (kfp) would
    shadow it once the output directory is on sys.path; reject it."""
    import pytest

    a = tmp_path / "kfp.ipynb"
    b = tmp_path / "notebook_b.ipynb"
    _write_nb(a, "kfp-nb", [(["step:gen"], "dataset = [1]")])
    _write_nb(b, "notebook-b", [(["step:use"], "total = sum(dataset)")])

    monkeypatch.chdir(tmp_path)
    with pytest.raises(ValueError, match="reserved module name"):
        compose_notebooks_as_subpipelines([str(a), str(b)], pipeline_name="shadow")


def test_two_notebooks_with_the_same_name_raise(tmp_path, monkeypatch):
    """Two notebooks from different directories with the same file name would
    fight over one module file; that must be an error, not an overwrite."""
    import pytest

    (tmp_path / "d1").mkdir()
    (tmp_path / "d2").mkdir()
    a = tmp_path / "d1" / "nb.ipynb"
    b = tmp_path / "d2" / "nb.ipynb"
    _write_nb(a, "nb-one", [(["step:gen"], "x = 1")])
    _write_nb(b, "nb-two", [(["step:gen"], "y = 2")])

    monkeypatch.chdir(tmp_path)
    with pytest.raises(ValueError, match="share the name"):
        compose_notebooks_as_subpipelines([str(a), str(b)], pipeline_name="dup")


def test_extract_references_accepts_both_tag_forms(tmp_path):
    """`notebook:<name>` and the UI-written `step:notebook:<name>` are both
    notebook references; a plain step tag is not."""
    main = tmp_path / "main.ipynb"
    nb = nbf.v4.new_notebook()
    nb.metadata["kubeflow_notebook"] = {"pipeline_name": "m", "volumes": []}
    for tag, path in [
        ("notebook:nb_a", "./nb_a.ipynb"),
        ("step:notebook:nb_b", "./nb_b.ipynb"),  # what the Kale UI cell editor writes
    ]:
        c = nbf.v4.new_code_cell(source="")
        c.metadata["tags"] = [tag]
        c.metadata["notebook_path"] = path
        nb.cells.append(c)
    plain = nbf.v4.new_code_cell(source="")  # empty: code would make it a mixed cell
    plain.metadata["tags"] = ["step:regular"]
    nb.cells.append(plain)
    nbf.write(nb, str(main))

    refs = extract_notebook_references(str(main))
    assert [name for name, _ in refs] == ["nb_a", "nb_b"]
    assert all(p.endswith(".ipynb") for _, p in refs)


def _write_composition_nb(path, extra_cells):
    """A composition notebook with one valid `notebook:` reference plus extras."""
    nb = nbf.v4.new_notebook()
    nb.metadata["kubeflow_notebook"] = {"pipeline_name": "m", "volumes": []}
    ref = nbf.v4.new_code_cell(source="")
    ref.metadata["tags"] = ["notebook:nb_a"]
    ref.metadata["notebook_path"] = "./nb_a.ipynb"
    nb.cells = [ref] + extra_cells
    nbf.write(nb, str(path))


def _write_mixed_nb(path, name, cells):
    """A notebook mixing step:, notebook: and untagged cells.

    ``cells`` items are ``(tags, source)`` or ``(tags, source, extra_metadata)``.
    """
    nb = nbf.v4.new_notebook()
    nb.metadata["kubeflow_notebook"] = {
        "pipeline_name": name,
        "experiment_name": "test",
        "volumes": [],
    }
    for spec in cells:
        cell = nbf.v4.new_code_cell(source=spec[1])
        cell.metadata["tags"] = spec[0]
        if len(spec) > 2:
            cell.metadata.update(spec[2])
        nb.cells.append(cell)
    nbf.write(nb, str(path))


def test_story2_mixed_steps_and_notebook(tmp_path, monkeypatch):
    """The KEP-0812 Story 2 example: the composition notebook's own steps
    become top-level components wired around the sub-pipeline, with data
    crossing the step/notebook boundary like any step/step boundary."""
    trainer = tmp_path / "trainer.ipynb"
    _write_nb(trainer, "trainer", [(["step:fit"], "model = sum(dataset)")])
    main = tmp_path / "main.ipynb"
    _write_mixed_nb(
        main,
        "mixed",
        [
            (["step:preprocess"], "dataset = [1, 2, 3]"),
            (["notebook:trainer"], "", {"notebook_path": "./trainer.ipynb"}),
            (["step:evaluate"], "result = model + 1\nprint(result)"),
        ],
    )

    monkeypatch.chdir(tmp_path)
    dsl_path, order = compose_notebooks_as_subpipelines(
        [str(trainer)], pipeline_name="mixed", parent_path=str(main)
    )

    assert order == ["preprocess", "trainer", "evaluate"]
    dsl = open(dsl_path).read()
    # parent steps are components in the orchestrator itself
    assert "def preprocess_step(" in dsl
    assert "def evaluate_step(" in dsl
    # step -> notebook: the sub-pipeline consumes the component's artifact
    assert 'dataset_input_artifact=preprocess_task.outputs["dataset_output_artifact"]' in dsl
    # notebook -> step: the component consumes the sub-pipeline's output
    assert "model_input_artifact=trainer_task.output" in dsl
    # top-level component tasks get the same runtime config as sub-DAG tasks
    assert "security_context.set_security_context(task=preprocess_task" in dsl
    # the referenced notebook still gets its own module
    assert "def trainer_pipeline(" in _module(tmp_path, "trainer")


def test_untagged_after_reference_attaches_to_next_step(tmp_path):
    """KEP-0812 caveat #5: a notebook: cell breaks the merge chain, so a
    following untagged cell belongs to the NEXT step, not the previous one."""
    from kale.processors import NotebookProcessor

    main = tmp_path / "main.ipynb"
    _write_mixed_nb(
        main,
        "merge-rule",
        [
            (["step:first"], "x = 1"),
            (["notebook:sub"], "", {"notebook_path": "./sub.ipynb"}),
            ([], 'note = "held"'),
            (["step:second"], "print(note)"),
        ],
    )

    pipeline = NotebookProcessor(
        str(main), {"pipeline_name": "merge-rule", "experiment_name": "t"}
    ).run()
    assert "note = " not in "\n".join(pipeline.get_step("first").source)
    assert 'note = "held"' in "\n".join(pipeline.get_step("second").source)


def test_orphan_code_after_reference_raises(tmp_path):
    """Untagged code after a notebook: cell with no step to own it would be
    silently dropped; the parser must refuse it."""
    import pytest

    from kale.processors import NotebookProcessor

    main = tmp_path / "main.ipynb"
    _write_mixed_nb(
        main,
        "orphan",
        [
            (["step:first"], "x = 1"),
            (["notebook:sub"], "", {"notebook_path": "./sub.ipynb"}),
            ([], "y = 2"),
        ],
    )

    with pytest.raises(ValueError, match="must be followed by"):
        NotebookProcessor(str(main), {"pipeline_name": "orphan", "experiment_name": "t"}).run()


def test_reference_cell_with_code_raises(tmp_path):
    """Code inside a notebook: reference cell never executes, so it is an
    error, not a silent drop."""
    import pytest

    main = tmp_path / "main.ipynb"
    _write_mixed_nb(main, "m", [(["notebook:nb_a"], "x = 1", {"notebook_path": "./nb_a.ipynb"})])

    with pytest.raises(ValueError, match="must be empty"):
        extract_notebook_references(str(main))


def test_parent_step_name_collides_with_notebook_raises(tmp_path, monkeypatch):
    """A parent step named like a referenced notebook would collide on task
    variable names; reject it."""
    import pytest

    trainer = tmp_path / "trainer.ipynb"
    _write_nb(trainer, "trainer", [(["step:fit"], "model = sum(dataset)")])
    main = tmp_path / "main.ipynb"
    _write_mixed_nb(
        main,
        "clash",
        [
            (["step:trainer"], "dataset = [1]"),
            (["notebook:trainer"], "", {"notebook_path": "./trainer.ipynb"}),
        ],
    )

    monkeypatch.chdir(tmp_path)
    with pytest.raises(ValueError, match="same name"):
        compose_notebooks_as_subpipelines(
            [str(trainer)], pipeline_name="clash", parent_path=str(main)
        )


def test_skip_tagged_code_cell_in_composition_is_allowed(tmp_path):
    """`skip` is the explicit opt-out: a skip-tagged code cell never runs in any
    Kale pipeline, so it may coexist with `notebook:` references."""
    skipped = nbf.v4.new_code_cell(source="print('debug only')")
    skipped.metadata["tags"] = ["skip"]
    main = tmp_path / "main.ipynb"
    _write_composition_nb(main, [skipped])

    refs = extract_notebook_references(str(main))
    assert [name for name, _ in refs] == ["nb_a"]


def test_mixed_units_run_in_notebook_order(tmp_path, monkeypatch):
    """A mixed composition runs the way it reads: parent steps act as barriers,
    ordering units by cell position even when no data flows between them."""
    sub = tmp_path / "sub.ipynb"
    _write_nb(sub, "sub", [(["step:work"], "result = 42\nprint(result)")])
    main = tmp_path / "main.ipynb"
    _write_mixed_nb(
        main,
        "order",
        [
            (["step:prepare"], "print('preparing')"),
            (["notebook:sub"], "", {"notebook_path": "./sub.ipynb"}),
            (["step:report"], "print('reporting done')"),
        ],
    )

    monkeypatch.chdir(tmp_path)
    dsl_path, order = compose_notebooks_as_subpipelines(
        [str(sub)], pipeline_name="order", parent_path=str(main)
    )

    assert order == ["prepare", "sub", "report"]
    dsl = open(dsl_path).read()
    assert "sub_task.after(prepare_task)" in dsl
    assert "report_task.after(sub_task)" in dsl


def test_barriers_keep_unrelated_notebooks_parallel(tmp_path, monkeypatch):
    """Reference-only pairs get no positional edge: independent notebooks
    between barriers still run in parallel (Story 1 semantics preserved)."""
    a = tmp_path / "notebook_a.ipynb"
    b = tmp_path / "notebook_b.ipynb"
    _write_nb(a, "notebook-a", [(["step:ga"], "alpha = 1")])
    _write_nb(b, "notebook-b", [(["step:gb"], "beta = 2")])
    main = tmp_path / "main.ipynb"
    _write_mixed_nb(
        main,
        "par",
        [
            (["notebook:notebook_a"], "", {"notebook_path": "./notebook_a.ipynb"}),
            (["notebook:notebook_b"], "", {"notebook_path": "./notebook_b.ipynb"}),
            (["step:last"], "print('after both')"),
        ],
    )

    monkeypatch.chdir(tmp_path)
    dsl_path, _ = compose_notebooks_as_subpipelines(
        [str(a), str(b)], pipeline_name="par", parent_path=str(main)
    )

    dsl = open(dsl_path).read()
    # no positional edge between the two references
    assert "notebook_b_task.after(notebook_a_task)" not in dsl
    assert "notebook_a_task.after(notebook_b_task)" not in dsl
    # but the trailing step waits for both
    assert "last_task.after(notebook_a_task)" in dsl
    assert "last_task.after(notebook_b_task)" in dsl


def test_step_above_its_producer_raises_cycle(tmp_path, monkeypatch):
    """A parent step placed above the reference whose output it consumes is a
    contradiction between reading order and data flow, and must raise."""
    import pytest

    sub = tmp_path / "sub.ipynb"
    _write_nb(sub, "sub", [(["step:work"], "result = 42")])
    main = tmp_path / "main.ipynb"
    _write_mixed_nb(
        main,
        "cyc",
        [
            (["step:use"], "y = result + 1"),
            (["notebook:sub"], "", {"notebook_path": "./sub.ipynb"}),
        ],
    )

    monkeypatch.chdir(tmp_path)
    with pytest.raises(ValueError, match="Cycle"):
        compose_notebooks_as_subpipelines([str(sub)], pipeline_name="cyc", parent_path=str(main))


def test_variables_pass_between_parent_steps(tmp_path, monkeypatch):
    """Two parent steps share a variable across an intervening reference: the
    value is wired step-to-step as a top-level artifact."""
    sub = tmp_path / "sub.ipynb"
    _write_nb(sub, "sub", [(["step:work"], "result = 42")])
    main = tmp_path / "main.ipynb"
    _write_mixed_nb(
        main,
        "sts",
        [
            (["step:one"], "x = 1"),
            (["notebook:sub"], "", {"notebook_path": "./sub.ipynb"}),
            (["step:two"], "print(x)"),
        ],
    )

    monkeypatch.chdir(tmp_path)
    dsl_path, order = compose_notebooks_as_subpipelines(
        [str(sub)], pipeline_name="sts", parent_path=str(main)
    )

    assert order == ["one", "sub", "two"]
    dsl = open(dsl_path).read()
    assert 'x_input_artifact=one_task.outputs["x_output_artifact"]' in dsl
