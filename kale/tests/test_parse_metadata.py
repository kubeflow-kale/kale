import pytest

import nbformat as nb

from kale.converter import KaleCore


@pytest.fixture
def tag_parsing_notebook():
    """
    Returns a parsed Jupyter notebook using nbformat library
    """
    path = "notebooks/test_tag_parsing.ipynb"
    return nb.read(path.__str__(), as_version=4)


def test_number_of_cells(tag_parsing_notebook):
    assert len(tag_parsing_notebook.cells) == 6


def test_import_tag(tag_parsing_notebook):
    assert tag_parsing_notebook.cells[0]['metadata']['tags'][0] == "block:imports"


def test_metadata_generation(tag_parsing_notebook):
    result = [
        {'block_names': ['imports'], 'in': [], 'out': []},
        {'block_names': ['sum'], 'in': [], 'out': []},
        {'block_names': ['cumsum'], 'in': [], 'out': [], 'previous_blocks': ['sum']},
        {'block_names': [], 'in': [], 'out': []},
        {'block_names': ['imports'], 'in': [], 'out': []},
        {'block_names': ['os'], 'in': [], 'out': [], 'previous_blocks': ['sum', 'cumsum']}
    ]

    parsed_tags = list()
    for c in tag_parsing_notebook.cells:
        # parse only source code cells
        if c.cell_type != "code":
            continue

        tags = KaleCore.parse_metadata(c.metadata)
        parsed_tags.append(tags)
    pairs = zip(result, parsed_tags)
    assert all(x == y for x, y in pairs)


def test_empty_tag():
    tag =  {'metadata': {}}
    target = {'block_names': [], 'in': [], 'out': []}

    res = KaleCore.parse_metadata(tag['metadata'])
    assert target == res


def test_tag_skip():
    tag = {'metadata': {
        'tags': ['skip']
    }}
    target = None

    res = KaleCore.parse_metadata(tag['metadata'])
    assert target == res


def test_tag_block():
    tag = {'metadata': {
        'tags': ["block:processing"]
    }}
    target = {'block_names': ["processing"], 'in': [], 'out': []}

    res = KaleCore.parse_metadata(tag['metadata'])
    assert target == res


def test_tag_block_error():
    tag = {'metadata': {
        'tags': ["block:processing:dataset"]
    }}

    with pytest.raises(ValueError):
        KaleCore.parse_metadata(tag['metadata'])


