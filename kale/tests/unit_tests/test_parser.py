import pytest

import networkx as nx

from kale.nbparser.parser import merge_code, parse_metadata


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
    ({'tags': ['prev:step2']},
     {'step_names': [], 'prev_steps': ['step2']}),
])
def test_parse_metadata(metadata, target):
    """Test parse_metadata function."""
    assert target == parse_metadata(metadata)


@pytest.mark.parametrize("metadata", [
    ({'tags': ["random_value"]}),
    ({'tags': [0]}),
])
def test_parse_metadata_exc(metadata):
    """Test parse_metadata exception cases."""
    with pytest.raises(ValueError):
        parse_metadata(metadata)
