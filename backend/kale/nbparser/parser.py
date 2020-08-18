#  Copyright 2019-2020 The Kale Authors
#
#  Licensed under the Apache License, Version 2.0 (the "License");
#  you may not use this file except in compliance with the License.
#  You may obtain a copy of the License at
#
#       http://www.apache.org/licenses/LICENSE-2.0
#
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.

import re
import warnings

from typing import List

import networkx as nx

SKIP_TAG = r'^skip$'
IMPORT_TAG = r'^imports$'
FUNCTIONS_TAG = r'^functions$'
PREV_TAG = r'^prev:[_a-z]([_a-z0-9]*)?$'
# `step` has the same functionality as `block` and is
# supposed to be the new name
STEP_TAG = r'^step:([_a-z]([_a-z0-9]*)?)?$'
# Extension may end up with 'block:' as a tag. We handle
# that as if it was empty.
# TODO: Deprecate `block` tag in future release
BLOCK_TAG = r'^block:([_a-z]([_a-z0-9]*)?)?$'
PIPELINE_PARAMETERS_TAG = r'^pipeline-parameters$'
PIPELINE_METRICS_TAG = r'^pipeline-metrics$'
# Annotations map to actual pod annotations that can be set via KFP SDK
segment = "[a-zA-Z0-9]+([a-zA-Z0-9-_.]*[a-zA-Z0-9])?"
K8S_ANNOTATION_KEY = "%s([/]%s)?" % (segment, segment)
ANNOTATION_TAG = r'^annotation:%s:(.*)$' % K8S_ANNOTATION_KEY
LABEL_TAG = r'^label:%s:(.*)$' % K8S_ANNOTATION_KEY
# Limits map to K8s limits, like CPU, Mem, GPU, ...
# E.g.: limit:nvidia.com/gpu:2
LIMITS_TAG = r'^limit:([_a-z-\.\/]+):([_a-zA-Z0-9\.]+)$'

_TAGS_LANGUAGE = [SKIP_TAG,
                  IMPORT_TAG,
                  FUNCTIONS_TAG,
                  PREV_TAG,
                  BLOCK_TAG,
                  STEP_TAG,
                  PIPELINE_PARAMETERS_TAG,
                  PIPELINE_METRICS_TAG,
                  ANNOTATION_TAG,
                  LABEL_TAG,
                  LIMITS_TAG]
# These tags are applied to every step of the pipeline
_STEPS_DEFAULTS_LANGUAGE = [ANNOTATION_TAG,
                            LABEL_TAG,
                            LIMITS_TAG]


def parse_metadata(metadata):
    """Parse a notebook's cell's metadata field.

    The Kale UI writes Kale specific tags inside the 'tags' field, as a list
    of string tags. Supported tags are defined by _TAGS_LANGUAGE.

    Args:
        metadata (dict): a dictionary containing a notebook's cell's metadata

    Returns (dict): parsed tags based on Kale tagging language

    """
    parsed_tags = dict()

    # `step_names` is a list because a notebook cell might be assigned to more
    # than one Pipeline step.
    parsed_tags['step_names'] = list()
    parsed_tags['prev_steps'] = list()
    # define intermediate variables so that dicts are not added to a steps
    # when they are empty
    cell_annotations = dict()
    cell_labels = dict()
    cell_limits = dict()

    # the notebook cell was not tagged
    if 'tags' not in metadata or len(metadata['tags']) == 0:
        return parsed_tags

    for t in metadata['tags']:
        if not isinstance(t, str):
            raise ValueError("Tags must be string. Found tag %s of type %s"
                             % (t, type(t)))
        # Check that the tag is defined by the Kale tagging language
        if any(re.match(_t, t) for _t in _TAGS_LANGUAGE) is False:
            raise ValueError("Unrecognized tag: {}".format(t))

        # Special tags have a specific effect on the cell they belong to.
        # Specifically:
        #  - skip: ignore the notebook cell
        #  - pipeline-parameters: use the cell to populate Pipeline
        #       parameters. The cell must contain only assignment expressions
        #  - pipeline-metrics: use the cell to populate Pipeline metrics.
        #       The cell must contain only variable names
        #  - imports: the code of the corresponding cell(s) will be prepended
        #       to every Pipeline step
        #  - functions: same as imports, but the corresponding code is placed
        #       **after** `imports`
        special_tags = ['skip', 'pipeline-parameters', 'pipeline-metrics',
                        'imports', 'functions']
        if t in special_tags:
            parsed_tags['step_names'] = [t]
            return parsed_tags

        # now only `block|step` and `prev` tags remain to be parsed.
        tag_parts = t.split(':')
        tag_name = tag_parts.pop(0)

        if tag_name == "annotation":
            key, value = _get_annotation_or_label_from_tag_parts(tag_parts)
            cell_annotations.update({key: value})

        if tag_name == "label":
            key, value = _get_annotation_or_label_from_tag_parts(tag_parts)
            cell_labels.update({key: value})

        if tag_name == "limit":
            key, value = _get_limit_from_tag_parts(tag_parts)
            cell_limits.update({key: value})

        # name of the future Pipeline step
        # TODO: Deprecate `block` in future release
        if tag_name in ["block", "step"]:
            if tag_name == "block":
                warnings.warn("`block` tag will be deprecated in a future"
                              " version, use `step` tag instead",
                              DeprecationWarning)
            step_name = tag_parts.pop(0)
            parsed_tags['step_names'].append(step_name)
        # name(s) of the father Pipeline step(s)
        if tag_name == "prev":
            prev_step_name = tag_parts.pop(0)
            parsed_tags['prev_steps'].append(prev_step_name)

    if not parsed_tags['step_names'] and parsed_tags['prev_steps']:
        raise ValueError("A cell can not provide `prev` annotations without "
                         "providing a `block` or `step` annotation as well")

    if cell_annotations:
        if not parsed_tags['step_names']:
            raise ValueError("A cell can not provide Pod annotations in a cell"
                             " that does not declare a step name.")
        parsed_tags['annotations'] = cell_annotations

    if cell_limits:
        if not parsed_tags['step_names']:
            raise ValueError("A cell can not provide Pod resource limits in a"
                             " cell that does not declare a step name.")
        parsed_tags['limits'] = cell_limits
    return parsed_tags


def merge_code(nb_graph, dst, code):
    """Add a new code block to an existing graph node.

    Note: Updates inplace the input graph.

    Args:
        nb_graph (nx.DiGraph): Pipeline graph
        dst (str): Name id of the destination node
        code (str): Python source code to be appended to dst node
    """
    source_code = nb_graph.nodes(data=True)[dst]["source"]
    # update pipeline block source code
    nx.set_node_attributes(nb_graph, {dst: {"source": source_code + [code]}})


def _get_reserved_tag_source(notebook, search_tag):
    """Get just the specific tag's source code.

    When searching for tag x, will return all cells that are tagged with x
    and, if untagged, follow cells with tag x. The result is a multiline
    string containing all the python code associated to x.
    Note: This is designed for `special` tags, as the STEP_TAG and BLOCK_TAG
    are excluded from the match.

    Args:
        notebook: Notebook object
        search_tag (str): the target tag

    Returns: the unified code of all the cells belonging to `search_tag`
    """
    detected = False
    source = ''

    language = _TAGS_LANGUAGE[:]
    language.remove(search_tag)

    for c in notebook.cells:
        # parse only source code cells
        if c.cell_type != "code":
            continue
        # in case the previous cell was a `search_tag` cell and this
        # cell is not any other tag of the tag language:
        if ((('tags' not in c.metadata
              or len(c.metadata['tags']) == 0)
             or all([not any(re.match(tag, t) for t in c.metadata['tags'])
                     for tag in language]))
                and detected):
            source += '\n' + c.source
        elif (('tags' in c.metadata
               and len(c.metadata['tags']) > 0
               and any(re.match(search_tag, t)
                       for t in c.metadata['tags']))):
            source += '\n' + c.source
            detected = True
        else:
            detected = False
    return source.strip()


def get_pipeline_parameters_source(notebook):
    """Get just pipeline parameters cells from the notebook.

    Args (nbformat.notebook): Notebook object

    Returns (str): pipeline parameters source code
    """
    return _get_reserved_tag_source(notebook, PIPELINE_PARAMETERS_TAG)


def get_pipeline_metrics_source(notebook):
    """Get just pipeline metrics cells from the notebook.

    Args (nbformat.notebook): Notebook object

    Returns (str): pipeline metrics source code
    """
    # check that the pipeline metrics tag is only assigned to cells at
    # the end of the notebook
    detected = False
    tags = _TAGS_LANGUAGE[:]
    tags.remove(PIPELINE_METRICS_TAG)

    for c in notebook.cells:
        # parse only source code cells
        if c.cell_type != "code":
            continue

        # if we see a pipeline-metrics tag, set the flag
        if (('tags' in c.metadata
             and len(c.metadata['tags']) > 0
             and any(re.match(PIPELINE_METRICS_TAG, t)
                     for t in c.metadata['tags']))):
            detected = True
            continue

        # if we have the flag set and we detect any other tag from the tags
        # language, then raise error
        if ('tags' in c.metadata
                and len(c.metadata['tags']) > 0
                and any([any(re.match(tag, t) for t in c.metadata['tags'])
                         for tag in tags])
                and detected):
            raise ValueError("Tag pipeline-metrics tag must be placed on a "
                             "cell at the end of the Notebook."
                             " Pipeline metrics should be considered as a"
                             " result of the pipeline execution and not of"
                             " single steps.")
    return _get_reserved_tag_source(notebook, PIPELINE_METRICS_TAG)


def parse_notebook(notebook, metadata):
    """Creates a NetworkX graph based on the input notebook's tags.

    Cell's source code are embedded into the graph as node attributes.

    Args:
        notebook (nbformat.notebook): Notebook object
        metadata (dict): The parsed notebook metadata
    """
    # output graph
    nb_graph = nx.DiGraph()

    # will be assigned at the end of each for loop
    prev_step_name = None

    # All the code cells that have to be pre-pended to every pipeline step
    # (i.e., imports and functions) are merged here
    imports_block = list()
    functions_block = list()

    # Variables that will become pipeline parameters
    pipeline_parameters = list()
    # Variables that will become pipeline metrics
    pipeline_metrics = list()

    # Default step configurations
    step_defaults = parse_steps_defaults(metadata.get("steps_defaults", []))

    # iterate over the notebook cells, from first to last
    for c in notebook.cells:
        # parse only source code cells
        if c.cell_type != "code":
            continue

        tags = parse_metadata(c.metadata)

        if len(tags['step_names']) > 1:
            raise NotImplementedError("Kale does not yet support multiple "
                                      "step names in a single notebook cell. "
                                      "One notebook cell was found with %s "
                                      "step names" % tags['step_names'])

        step_name = (tags['step_names'][0]
                     if 0 < len(tags['step_names'])
                     else None)

        if step_name == 'skip':
            # when the cell is skipped, don't store `skip` as the previous
            # active cell
            continue
        if step_name == 'pipeline-parameters':
            pipeline_parameters.append(c.source)
            prev_step_name = step_name
            continue
        if step_name == 'imports':
            imports_block.append(c.source)
            prev_step_name = step_name
            continue
        if step_name == 'functions':
            functions_block.append(c.source)
            prev_step_name = step_name
            continue
        if step_name == 'pipeline-metrics':
            pipeline_metrics.append(c.source)
            prev_step_name = step_name
            continue

        # if none of the above apply, then we are parsing a code cell with
        # a block names and (possibly) some dependencies
        cell_annotations = dict(**step_defaults.get("annotations", {}),
                                **tags.get("annotations", {}))
        cell_labels = dict(**step_defaults.get("labels", {}),
                           **tags.get("labels", {}))
        cell_limits = dict(**step_defaults.get("limits", {}),
                           **tags.get("limits", {}))

        # if the cell was not tagged with a step name,
        # add the code to the previous cell
        if not step_name:
            if prev_step_name == 'imports':
                imports_block.append(c.source)
            elif prev_step_name == 'functions':
                functions_block.append(c.source)
            elif prev_step_name == 'pipeline-parameters':
                pipeline_parameters.append(c.source)
            elif prev_step_name == 'pipeline-metrics':
                pipeline_metrics.append(c.source)
            # current_block might be None in case the first cells of the
            # notebooks have not been tagged.
            elif prev_step_name:
                # this notebook cell will be merged to a previous one that
                # specified a step name
                merge_code(nb_graph, prev_step_name, c.source)
        else:
            # in this branch we are sure that we are reading a code cell with
            # a step tag, so we must not allow for pipeline-metrics
            if prev_step_name == 'pipeline-metrics':
                raise ValueError("Tag pipeline-metrics must be placed on a"
                                 " cell at the end of the Notebook."
                                 " Pipeline metrics should be considered as a"
                                 " result of the pipeline execution and not of"
                                 " single steps.")
            # add node to DAG, adding tags and source code of notebook cell
            if step_name not in nb_graph.nodes:
                nb_graph.add_node(step_name, source=[c.source],
                                  ins=set(), outs=set(),
                                  annotations=cell_annotations,
                                  labels=cell_labels,
                                  limits=cell_limits)
                for _prev_step in tags['prev_steps']:
                    if _prev_step not in nb_graph.nodes:
                        raise ValueError("Step %s does not exist. It was "
                                         "defined as previous step of %s"
                                         % (_prev_step, tags['step_names']))
                    nb_graph.add_edge(_prev_step, step_name)
            else:
                merge_code(nb_graph, step_name, c.source)

            prev_step_name = step_name

    # Prepend any `imports` and `functions` cells to every Pipeline step
    for step in nb_graph:
        step_source = nb_graph.nodes(data=True)[step]['source']
        step_source = imports_block + functions_block + step_source
        nx.set_node_attributes(nb_graph, {step: {'source': step_source}})

    # merge together pipeline parameters
    pipeline_parameters = '\n'.join(pipeline_parameters)
    # merge together pipeline metrics
    pipeline_metrics = '\n'.join(pipeline_metrics)

    imports_and_functions = "\n".join(imports_block + functions_block)
    return (nb_graph, pipeline_parameters, pipeline_metrics,
            imports_and_functions)


def _get_annotation_or_label_from_tag_parts(tag_parts):
    # Since value can be anything, merge together everything that's left.
    return tag_parts[0], "".join(tag_parts[1:])


def _get_limit_from_tag_parts(tag_parts):
    return tag_parts.pop(0), tag_parts.pop(0)


def parse_steps_defaults(conf: List[str] = None):
    """Parse common step configuration defined in notebook metadata."""
    result = dict()
    if not conf:
        return result

    for c in conf:
        if any(re.match(_c, c) for _c in _STEPS_DEFAULTS_LANGUAGE) is False:
            raise ValueError("Unrecognized common step configuration:"
                             " {}".format(c))

        parts = c.split(":")

        conf_type = parts.pop(0)
        if conf_type in ["annotation", "label"]:
            result_key = "{}s".format(conf_type)
            if result_key not in result:
                result[result_key] = dict()
            key, value = _get_annotation_or_label_from_tag_parts(parts)
            result[result_key][key] = value

        if conf_type == "limit":
            if "limits" not in result:
                result["limits"] = dict()
            key, value = _get_limit_from_tag_parts(parts)
            result["limits"][key] = value

    return result
