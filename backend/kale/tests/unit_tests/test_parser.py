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

import nbformat
import pytest

from kale import NotebookConfig, Pipeline, Step


def test_merge_code(dummy_nb_config):
    """Test the merge code functionality."""
    pipeline = Pipeline(NotebookConfig(**dummy_nb_config))
    pipeline.add_step(Step(name="test", source=["test1"]))
    pipeline.get_step("test").merge_code("test2")

    assert pipeline.get_step("test").source == ["test1", "test2"]


_EMPTY_TAG = {"step_names": [], "prev_steps": []}


@pytest.mark.parametrize(
    "metadata,target",
    [
        ({}, _EMPTY_TAG),
        ({"tags": []}, _EMPTY_TAG),
        ({"other_field": None}, _EMPTY_TAG),
        # test special tags
        ({"tags": ["imports"]}, {"step_names": ["imports"], "prev_steps": []}),
        (
            {"tags": ["pipeline-parameters"]},
            {"step_names": ["pipeline-parameters"], "prev_steps": []},
        ),
        ({"tags": ["functions"]}, {"step_names": ["functions"], "prev_steps": []}),
        # test skip tag
        ({"tags": ["skip"]}, {"step_names": ["skip"], "prev_steps": []}),
        ({"tags": ["skip", "step:other"]}, {"step_names": ["skip"], "prev_steps": []}),
        # test that prev tag is ignored when having a special tag
        ({"tags": ["imports", "prev:step1"]}, {"step_names": ["imports"], "prev_steps": []}),
        ({"tags": ["functions", "prev:step1"]}, {"step_names": ["functions"], "prev_steps": []}),
        (
            {"tags": ["pipeline-parameters", "prev:step1"]},
            {"step_names": ["pipeline-parameters"], "prev_steps": []},
        ),
        # when specifying multiple steps, only the special step tag name
        # is returned
        ({"tags": ["imports", "step:step1"]}, {"step_names": ["imports"], "prev_steps": []}),
        ({"tags": ["functions", "step:step1"]}, {"step_names": ["functions"], "prev_steps": []}),
        (
            {"tags": ["pipeline-parameters", "step:step1"]},
            {"step_names": ["pipeline-parameters"], "prev_steps": []},
        ),
    ],
)
def test_parse_metadata_success(notebook_processor, metadata, target):
    """Test parse_metadata function."""
    notebook_processor.parse_cell_metadata(metadata)


@pytest.mark.parametrize(
    "metadata",
    [
        ({"tags": ["random_value"]}),
        ({"tags": [0]}),
        ({"tags": ["prev:step2"]}),
    ],
)
def test_parse_metadata_exc(notebook_processor, metadata):
    """Test parse_metadata exception cases."""
    with pytest.raises(ValueError):
        notebook_processor.parse_cell_metadata(metadata)


def test_get_pipeline_parameters_source_simple(notebook_processor):
    """Test that the function gets the correct pipeline parameters source."""
    notebook = nbformat.v4.new_notebook()
    cells = [
        ("0", {}),
        ("0", {"tags": []}),
        ("1", {"tags": ["pipeline-parameters"]}),
        ("1", {}),
    ]
    notebook.cells = [nbformat.v4.new_code_cell(source=s, metadata=m) for (s, m) in cells]
    notebook_processor.notebook = notebook
    assert notebook_processor.get_pipeline_parameters_source() == "1\n1"


def test_get_pipeline_parameters_source_with_step(notebook_processor):
    """Test that the function gets the correct pipeline parameters source."""
    notebook = nbformat.v4.new_notebook()
    cells = [
        ("1", {"tags": ["pipeline-parameters"]}),
        ("0", {"tags": ["step:test"]}),
        ("1", {"tags": ["pipeline-parameters"]}),
    ]
    notebook.cells = [nbformat.v4.new_code_cell(source=s, metadata=m) for (s, m) in cells]
    notebook_processor.notebook = notebook
    assert notebook_processor.get_pipeline_parameters_source() == "1\n1"


def test_get_pipeline_parameters_source_skip(notebook_processor):
    """Test that the function gets the correct pipeline parameters source."""
    notebook = nbformat.v4.new_notebook()
    cells = [
        ("1", {"tags": ["pipeline-parameters"]}),
        ("0", {"tags": ["skip"]}),
        ("1", {"tags": ["pipeline-parameters"]}),
        ("1", {"tags": []}),
    ]
    notebook.cells = [nbformat.v4.new_code_cell(source=s, metadata=m) for (s, m) in cells]
    notebook_processor.notebook = notebook
    assert notebook_processor.get_pipeline_parameters_source() == "1\n1\n1"


def test_get_pipeline_parameters_source_followed_reserved(notebook_processor):
    """Test that the function gets the correct pipeline parameters source."""
    notebook = nbformat.v4.new_notebook()
    cells = [
        ("1", {"tags": ["pipeline-parameters"]}),
        ("0", {"tags": ["imports"]}),
        ("1", {"tags": ["pipeline-parameters"]}),
        ("1", {"tags": []}),
    ]
    notebook.cells = [nbformat.v4.new_code_cell(source=s, metadata=m) for (s, m) in cells]
    notebook_processor.notebook = notebook
    assert notebook_processor.get_pipeline_parameters_source() == "1\n1\n1"


def test_get_pipeline_metrics_source_raises(notebook_processor):
    """Test exception when pipeline metrics isn't at the end of notebook."""
    notebook = nbformat.v4.new_notebook()
    cells = [
        ("1", {"tags": ["pipeline-metrics"]}),
        ("0", {"tags": ["imports"]}),
    ]
    notebook.cells = [nbformat.v4.new_code_cell(source=s, metadata=m) for (s, m) in cells]
    with pytest.raises(
        ValueError,
        match=r"Tag pipeline-metrics tag must be"
        r" placed on a cell at the end of"
        r" the Notebook\..*",
    ):
        notebook_processor.notebook = notebook
        notebook_processor.get_pipeline_metrics_source()
