import pytest
import nbformat

import networkx as nx

from kale.nbparser.parser import merge_code, parse_metadata
from kale.nbparser.parser import get_pipeline_parameters_source


def test_merge_code():
    """Test the merge code functionality."""
    g = nx.DiGraph()
    g.add_node('test', source=['test1'])

    merge_code(g, 'test', 'test2')

    assert g.nodes(data=True)['test']['source'] == ['test1', 'test2']


empty_tag = {'step_names': [], 'prev_steps': []}


@pytest.mark.parametrize("metadata,target", [
    ({}, empty_tag),
    ({'tags': []}, empty_tag),
    ({'other_field': None}, empty_tag),
    # test special tags
    ({'tags': ['imports']}, {'step_names': ['imports'], 'prev_steps': []}),
    ({'tags': ['pipeline-parameters']},
     {'step_names': ['pipeline-parameters'], 'prev_steps': []}),
    ({'tags': ['functions']}, {'step_names': ['functions'], 'prev_steps': []}),
    # test skip tag
    ({'tags': ['skip']},
     {'step_names': ['skip'], 'prev_steps': []}),
    ({'tags': ['skip', 'block:other']},
     {'step_names': ['skip'], 'prev_steps': []}),
    # test that prev tag is ignored when having a special tag
    ({'tags': ['imports', 'prev:step1']},
     {'step_names': ['imports'], 'prev_steps': []}),
    ({'tags': ['functions', 'prev:step1']},
     {'step_names': ['functions'], 'prev_steps': []}),
    ({'tags': ['pipeline-parameters', 'prev:step1']},
     {'step_names': ['pipeline-parameters'], 'prev_steps': []}),
    # when specifying multiple blocks, only the special block tag name
    # is returned
    ({'tags': ['imports', 'block:step1']},
     {'step_names': ['imports'], 'prev_steps': []}),
    ({'tags': ['functions', 'block:step1']},
     {'step_names': ['functions'], 'prev_steps': []}),
    ({'tags': ['pipeline-parameters', 'block:step1']},
     {'step_names': ['pipeline-parameters'], 'prev_steps': []}),
    # test simple block names and prev step names
    ({'tags': ['block:step1']},
     {'step_names': ['step1'], 'prev_steps': []}),
    ({'tags': ['block:step1', 'block:step2']},
     {'step_names': ['step1', 'step2'], 'prev_steps': []}),
    ({'tags': ['block:step1', 'prev:step2']},
     {'step_names': ['step1'], 'prev_steps': ['step2']}),
])
def test_parse_metadata(metadata, target):
    """Test parse_metadata function."""
    assert target == parse_metadata(metadata)


@pytest.mark.parametrize("metadata", [
    ({'tags': ["random_value"]}),
    ({'tags': [0]}),
    ({'tags': ['prev:step2']}),
])
def test_parse_metadata_exc(metadata):
    """Test parse_metadata exception cases."""
    with pytest.raises(ValueError):
        parse_metadata(metadata)


def test_get_pipeline_parameters_source_simple():
    """Test that the function gets the correct pipeline parameters source."""
    notebook = nbformat.v4.new_notebook()
    cells = [
        ("0", {}),
        ("0", {"tags": []}),
        ("1", {"tags": ["pipeline-parameters"]}),
        ("1", {}),
    ]
    notebook.cells = [nbformat.v4.new_code_cell(source=s, metadata=m)
                      for (s, m) in cells]
    assert get_pipeline_parameters_source(notebook) == "1\n1"


def test_get_pipeline_parameters_source_with_step():
    """Test that the function gets the correct pipeline parameters source."""
    notebook = nbformat.v4.new_notebook()
    cells = [
        ("1", {"tags": ["pipeline-parameters"]}),
        ("0", {"tags": ["step:test"]}),
        ("1", {"tags": ["pipeline-parameters"]}),
    ]
    notebook.cells = [nbformat.v4.new_code_cell(source=s, metadata=m)
                      for (s, m) in cells]
    assert get_pipeline_parameters_source(notebook) == "1\n1"


def test_get_pipeline_parameters_source_skip():
    """Test that the function gets the correct pipeline parameters source."""
    notebook = nbformat.v4.new_notebook()
    cells = [
        ("1", {"tags": ["pipeline-parameters"]}),
        ("0", {"tags": ["skip"]}),
        ("1", {"tags": ["pipeline-parameters"]}),
        ("1", {"tags": []}),
    ]
    notebook.cells = [nbformat.v4.new_code_cell(source=s, metadata=m)
                      for (s, m) in cells]
    assert get_pipeline_parameters_source(notebook) == "1\n1\n1"
