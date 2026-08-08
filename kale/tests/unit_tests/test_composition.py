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
"""Tests for notebooks that reference other notebooks."""

import logging

import nbformat as nbf
import pytest
import yaml

from kale.common import kfputils
from kale.compiler import MODULE_PREFIX, Compiler
from kale.processors import NotebookProcessor
from kale.step import SubPipeline


def _write_nb(path, name, cells):
    """Write a notebook. Cells are ``(tags, source)`` or ``(tags, source, metadata)``."""
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


def _ref(name, path):
    """A `notebook:` reference cell."""
    return ([f"notebook:{name}"], "", {"notebook_path": path})


def _process(path, name="root"):
    """Process a notebook the way every compile path does."""
    processor = NotebookProcessor(str(path), {"pipeline_name": name, "experiment_name": "test"})
    return processor, processor.run()


def _compile(path, name="root"):
    """Process and compile, returning (pipeline, dsl path)."""
    processor, pipeline = _process(path, name)
    return pipeline, Compiler(pipeline, processor.get_imports_and_functions()).compile()


def _module(tmp_path, name):
    """Source of the DSL module generated for a referenced notebook."""
    return open(tmp_path / ".kale" / f"{MODULE_PREFIX}{name}.py").read()


def _producer_consumer(tmp_path):
    """The canonical pair: one notebook defines `dataset`, another consumes it."""
    _write_nb(
        tmp_path / "producer.ipynb",
        "producer",
        [
            (["step:load"], "raw = [1, 2, 3]"),
            (["step:transform", "prev:load"], "dataset = raw * 2"),
        ],
    )
    _write_nb(tmp_path / "consumer.ipynb", "consumer", [(["step:consume"], "print(len(dataset))")])


def test_reference_becomes_a_subpipeline_node(tmp_path, monkeypatch):
    """A `notebook:` cell is processed into a SubPipeline node holding the
    referenced notebook's own steps."""
    _producer_consumer(tmp_path)
    root = tmp_path / "root.ipynb"
    _write_nb(root, "root", [_ref("producer", "./producer.ipynb")])

    monkeypatch.chdir(tmp_path)
    _, pipeline = _process(root)

    node = pipeline.get_step("producer")
    assert isinstance(node, SubPipeline)
    assert [s.name for s in node.pipeline.steps] == ["load", "transform"]


def test_order_and_data_are_inferred_between_notebooks(tmp_path, monkeypatch):
    """Two referenced notebooks are ordered by the variable they share, and the
    boundary is resolved onto the steps that produce and consume it."""
    _producer_consumer(tmp_path)
    root = tmp_path / "root.ipynb"
    _write_nb(
        root,
        "root",
        [_ref("consumer", "./consumer.ipynb"), _ref("producer", "./producer.ipynb")],
    )

    monkeypatch.chdir(tmp_path)
    _, pipeline = _process(root)

    # declared consumer-first, but ordered by the data
    assert pipeline.steps_names == ["producer", "consumer"]
    producer, consumer = pipeline.get_step("producer"), pipeline.get_step("consumer")
    assert producer.outs == ["dataset"]
    assert consumer.ins == ["dataset"]
    # and pushed down to the steps that actually produce and consume it
    assert producer.produced_by["dataset"] == "transform"
    assert [s.name for s in producer.pipeline.steps if "dataset" in s.outs] == ["transform"]
    assert [s.name for s in consumer.pipeline.steps if "dataset" in s.ins] == ["consume"]


def test_variables_cross_between_steps_and_notebooks(tmp_path, monkeypatch):
    """A root step feeds a referenced notebook and another root step consumes
    its output, so variables cross the step/notebook boundary both ways."""
    _write_nb(tmp_path / "trainer.ipynb", "trainer", [(["step:fit"], "model = sum(dataset)")])
    root = tmp_path / "root.ipynb"
    _write_nb(
        root,
        "root",
        [
            (["step:prepare"], "dataset = [1, 2, 3]"),
            _ref("trainer", "./trainer.ipynb"),
            (["step:report"], "print(model)"),
        ],
    )

    monkeypatch.chdir(tmp_path)
    _, pipeline = _process(root)

    assert pipeline.steps_names == ["prepare", "trainer", "report"]
    assert pipeline.get_step("prepare").outs == ["dataset"]
    assert pipeline.get_step("trainer").ins == ["dataset"]
    assert pipeline.get_step("trainer").outs == ["model"]
    assert pipeline.get_step("report").ins == ["model"]


def test_root_steps_run_in_reading_order(tmp_path, monkeypatch):
    """A root step runs after everything above it and before everything below,
    even when no data flows between them."""
    _write_nb(tmp_path / "sub.ipynb", "sub", [(["step:work"], "result = 42")])
    root = tmp_path / "root.ipynb"
    _write_nb(
        root,
        "root",
        [
            (["step:prepare"], "print('preparing')"),
            _ref("sub", "./sub.ipynb"),
            (["step:report"], "print('done')"),
        ],
    )

    monkeypatch.chdir(tmp_path)
    _, pipeline = _process(root)

    assert pipeline.steps_names == ["prepare", "sub", "report"]


def test_independent_notebooks_stay_parallel(tmp_path, monkeypatch):
    """Two references with nothing between them get no ordering edge, so
    unrelated notebooks still run in parallel."""
    _write_nb(tmp_path / "alpha.ipynb", "alpha", [(["step:a"], "first = 1")])
    _write_nb(tmp_path / "beta.ipynb", "beta", [(["step:b"], "second = 2")])
    root = tmp_path / "root.ipynb"
    _write_nb(root, "root", [_ref("alpha", "./alpha.ipynb"), _ref("beta", "./beta.ipynb")])

    monkeypatch.chdir(tmp_path)
    _, pipeline = _process(root)

    assert set(pipeline.edges) == set()


def test_untagged_cell_after_a_reference_belongs_to_the_next_step(tmp_path, monkeypatch):
    """A reference breaks the merge chain: the untagged cell after it belongs to
    the next step, not to a step above the reference."""
    _write_nb(tmp_path / "sub.ipynb", "sub", [(["step:work"], "result = 42")])
    root = tmp_path / "root.ipynb"
    _write_nb(
        root,
        "root",
        [
            (["step:first"], "x = 1"),
            _ref("sub", "./sub.ipynb"),
            ([], 'note = "held"'),
            (["step:second"], "print(note)"),
        ],
    )

    monkeypatch.chdir(tmp_path)
    _, pipeline = _process(root)

    assert "note = " not in "\n".join(pipeline.get_step("first").source)
    assert 'note = "held"' in "\n".join(pipeline.get_step("second").source)


def test_orphan_code_after_a_reference_raises(tmp_path, monkeypatch):
    """Untagged code with no step to own it would be dropped, so it raises."""
    _write_nb(tmp_path / "sub.ipynb", "sub", [(["step:work"], "result = 42")])
    root = tmp_path / "root.ipynb"
    _write_nb(root, "root", [_ref("sub", "./sub.ipynb"), ([], "y = 2")])

    monkeypatch.chdir(tmp_path)
    with pytest.raises(ValueError, match="must be followed by"):
        _process(root)


def test_reference_without_a_path_raises(tmp_path, monkeypatch):
    """The referenced notebook's path lives in the cell metadata."""
    root = tmp_path / "root.ipynb"
    _write_nb(root, "root", [(["notebook:sub"], "")])

    monkeypatch.chdir(tmp_path)
    with pytest.raises(ValueError, match="notebook_path"):
        _process(root)


def test_reference_cycle_raises(tmp_path, monkeypatch):
    """A notebook cannot reference itself.

    An indirect cycle cannot be reached while nested references are rejected,
    so a self-reference is the case left to guard.
    """
    root = tmp_path / "root.ipynb"
    _write_nb(root, "root", [(["step:x"], "v = 1"), _ref("root", "./root.ipynb")])

    monkeypatch.chdir(tmp_path)
    with pytest.raises(ValueError, match="reference cycle"):
        _process(root)


def test_step_above_the_notebook_it_consumes_raises(tmp_path, monkeypatch):
    """Reading order and data flow must agree: a step placed above the notebook
    whose output it uses is a contradiction."""
    _write_nb(tmp_path / "sub.ipynb", "sub", [(["step:work"], "result = 42")])
    root = tmp_path / "root.ipynb"
    _write_nb(root, "root", [(["step:use"], "y = result + 1"), _ref("sub", "./sub.ipynb")])

    monkeypatch.chdir(tmp_path)
    with pytest.raises(ValueError, match="Cycle detected"):
        _process(root)


def test_variable_defined_twice_raises(tmp_path, monkeypatch):
    """An ambiguous producer is an error rather than a silent choice."""
    _write_nb(tmp_path / "one.ipynb", "one", [(["step:a"], "dataset = [1]")])
    _write_nb(tmp_path / "two.ipynb", "two", [(["step:b"], "dataset = [2]")])
    _write_nb(tmp_path / "use.ipynb", "use", [(["step:c"], "print(len(dataset))")])
    root = tmp_path / "root.ipynb"
    _write_nb(
        root,
        "root",
        [
            _ref("one", "./one.ipynb"),
            _ref("two", "./two.ipynb"),
            _ref("use", "./use.ipynb"),
        ],
    )

    monkeypatch.chdir(tmp_path)
    with pytest.raises(ValueError, match="defined in multiple"):
        _process(root)


def test_each_referenced_notebook_becomes_its_own_module(tmp_path, monkeypatch):
    """Every referenced notebook compiles to an importable module of its own,
    and the pipeline that references them imports those modules."""
    _producer_consumer(tmp_path)
    root = tmp_path / "root.ipynb"
    _write_nb(
        root,
        "root",
        [_ref("producer", "./producer.ipynb"), _ref("consumer", "./consumer.ipynb")],
    )

    monkeypatch.chdir(tmp_path)
    _, dsl_path = _compile(root)

    producer_module = _module(tmp_path, "producer")
    assert f"def {MODULE_PREFIX}producer_pipeline(" in producer_module
    assert "@kfp_dsl.component(" in producer_module
    consumer_module = _module(tmp_path, "consumer")
    assert "dataset_input_artifact: Input[Dataset]" in consumer_module

    dsl = open(dsl_path).read()
    assert f"from {MODULE_PREFIX}producer import {MODULE_PREFIX}producer_pipeline" in dsl
    assert f"dataset_input_artifact={MODULE_PREFIX}producer_task.output" in dsl


def test_referenced_notebook_keeps_its_pipeline_parameters(tmp_path, monkeypatch):
    """A referenced notebook's parameters reach the steps that use them, so a
    step does not lose a name it relies on by being composed rather than
    compiled on its own."""
    _write_nb(
        tmp_path / "child.ipynb",
        "child",
        [
            (["pipeline-parameters"], "factor = 3"),
            (["step:scale"], "dataset = [i * factor for i in range(4)]"),
        ],
    )
    root = tmp_path / "root.ipynb"
    _write_nb(
        root,
        "root",
        [_ref("child", "./child.ipynb"), (["step:show"], "print(dataset)")],
    )

    monkeypatch.chdir(tmp_path)
    _compile(root)

    module = _module(tmp_path, "child")
    assert "def scale_step(" in module and "factor: int = 3" in module
    assert "factor = {factor}" in module
    assert f"def {MODULE_PREFIX}child_pipeline(factor: int = 3)" in module
    assert "scale_step(factor=factor)" in module


def test_step_config_a_composition_drops_is_reported(tmp_path, monkeypatch, caplog):
    """Step configuration a composition does not carry over yet is reported,
    so it is never dropped without a trace."""
    _write_nb(
        tmp_path / "child.ipynb",
        "child",
        [(["step:work", "limit:nvidia.com/gpu:2"], "dataset = [1, 2, 3]")],
    )
    root = tmp_path / "root.ipynb"
    _write_nb(root, "root", [_ref("child", "./child.ipynb")])

    monkeypatch.chdir(tmp_path)
    # Kale's logger does not propagate, so capture on it directly
    logger = logging.getLogger("kale.compiler")
    logger.addHandler(caplog.handler)
    try:
        _compile(root)
    finally:
        logger.removeHandler(caplog.handler)

    assert "drops step configuration" in caplog.text
    assert "work: limits" in caplog.text


def test_reference_inside_a_referenced_notebook_raises(tmp_path, monkeypatch):
    """Nested references are not supported yet, so they raise rather than
    compile to something that silently drops a level of nesting."""
    _write_nb(tmp_path / "leaf.ipynb", "leaf", [(["step:make"], "base = [1, 2, 3]")])
    _write_nb(
        tmp_path / "middle.ipynb",
        "middle",
        [_ref("leaf", "./leaf.ipynb"), (["step:grow"], "dataset = base * 2")],
    )
    root = tmp_path / "root.ipynb"
    _write_nb(root, "root", [_ref("middle", "./middle.ipynb")])

    monkeypatch.chdir(tmp_path)
    with pytest.raises(ValueError, match="Nested references are not supported"):
        _process(root)


def test_notebook_named_like_a_module_is_safe(tmp_path, monkeypatch):
    """The module prefix keeps a notebook named after a standard-library module
    from shadowing it."""
    _write_nb(tmp_path / "json.ipynb", "json-nb", [(["step:a"], "dataset = [1]")])
    root = tmp_path / "root.ipynb"
    _write_nb(root, "root", [_ref("json", "./json.ipynb")])

    monkeypatch.chdir(tmp_path)
    _, dsl_path = _compile(root)

    assert (tmp_path / ".kale" / f"{MODULE_PREFIX}json.py").exists()
    assert f"from {MODULE_PREFIX}json import" in open(dsl_path).read()


def test_ui_compile_path_composes(tmp_path, monkeypatch):
    """R1 (kubeflow/kale#867 review): the RPC path the Kale panel uses is
    NotebookProcessor plus Compiler, with no CLI involved. It must compose the
    referenced notebooks rather than silently dropping them."""
    _producer_consumer(tmp_path)
    story1 = tmp_path / "root.ipynb"
    _write_nb(
        story1,
        "root",
        [_ref("producer", "./producer.ipynb"), _ref("consumer", "./consumer.ipynb")],
    )
    story2 = tmp_path / "root_mixed.ipynb"
    _write_nb(
        story2,
        "root-mixed",
        [
            _ref("producer", "./producer.ipynb"),
            _ref("consumer", "./consumer.ipynb"),
            (["step:final"], "print('done')"),
        ],
    )

    monkeypatch.chdir(tmp_path)
    _, pipeline1 = _process(story1)
    assert pipeline1.steps_names == ["producer", "consumer"]
    _, pipeline2 = _process(story2, name="root-mixed")
    assert pipeline2.steps_names == ["producer", "consumer", "final"]


def test_composition_compiles_with_kfp_compiler(tmp_path, monkeypatch):
    """A composition compiles to a valid KFP package whose root DAG holds one
    nested sub-DAG per referenced notebook."""
    _producer_consumer(tmp_path)
    root = tmp_path / "root.ipynb"
    _write_nb(
        root,
        "root",
        [_ref("producer", "./producer.ipynb"), _ref("consumer", "./consumer.ipynb")],
    )

    monkeypatch.chdir(tmp_path)
    _, dsl_path = _compile(root)
    spec = next(yaml.safe_load_all(open(kfputils.compile_pipeline(dsl_path, "root"))))

    assert set(spec["root"]["dag"]["tasks"]) == {"producer", "consumer"}
    assert sorted(spec["components"]["comp-producer"]["dag"]["tasks"]) == [
        "load-step",
        "transform-step",
    ]
    assert "dag" in spec["components"]["comp-consumer"]


def test_mixed_composition_compiles_with_kfp_compiler(tmp_path, monkeypatch):
    """A root notebook's own step compiles to a top-level component next to the
    nested sub-pipelines."""
    _write_nb(tmp_path / "loader.ipynb", "loader", [(["step:load"], "value = 41")])
    root = tmp_path / "root.ipynb"
    _write_nb(
        root,
        "root",
        [_ref("loader", "./loader.ipynb"), (["step:report"], "print(value + 1)")],
    )

    monkeypatch.chdir(tmp_path)
    _, dsl_path = _compile(root)
    spec = next(yaml.safe_load_all(open(kfputils.compile_pipeline(dsl_path, "root"))))

    assert set(spec["root"]["dag"]["tasks"]) == {"loader", "report-step"}
    assert "dag" in spec["components"]["comp-loader"]
    # the root's own step is a container component, not a sub-DAG
    assert "dag" not in spec["components"]["comp-report-step"]


def test_a_notebook_without_references_is_unaffected(tmp_path, monkeypatch):
    """A plain notebook keeps Kale's explicit `prev:` semantics: no edges are
    inferred between its steps."""
    plain = tmp_path / "plain.ipynb"
    _write_nb(
        plain,
        "plain",
        [(["step:one"], "shared = 1"), (["step:two"], "print(shared)")],
    )

    monkeypatch.chdir(tmp_path)
    _, pipeline = _process(plain, name="plain")

    assert set(pipeline.edges) == set()
    assert pipeline.get_step("one").outs == []
