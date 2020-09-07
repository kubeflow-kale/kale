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

import os
import re
import warnings

import nbformat as nb

from kale.config import Field
from kale import Pipeline, Step, PipelineConfig
from kale.static_analysis import dependencies, ast

# fixme: Change the name of this key to `kale_metadata`
KALE_NB_METADATA_KEY = 'kubeflow_notebook'

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
_segment = "[a-zA-Z0-9]+([a-zA-Z0-9-_.]*[a-zA-Z0-9])?"
K8S_ANNOTATION_KEY = "%s([/]%s)?" % (_segment, _segment)
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


def get_annotation_or_label_from_tag(tag_parts):
    """Get the key and value from an annotation or label tag.

    Args:
        tag_parts: annotation or label notebook tag

    Returns (tuple): key (annotation or label name), values
    """
    # Since value can be anything, merge together everything that's left.
    return tag_parts[0], "".join(tag_parts[1:])


def get_limit_from_tag(tag_parts):
    """Get the key and value from a notebook limit tag.

    Args:
        tag_parts: annotation or label notebook tag

    Returns (tuple): key (limit name), values
    """
    return tag_parts.pop(0), tag_parts.pop(0)


class NotebookConfig(PipelineConfig):
    """Config store for a notebook.

    This config extends the base pipeline config to take into account some
    small differences in the handling of a notebook.
    """
    notebook_path = Field(type=str, required=True)
    # FIXME: Probably this can be removed. The labextension passes both
    #  'experiment_name' and 'experiment', but the latter is not used in the
    #  backend.
    experiment = Field(type=dict)
    # Used in the UI to keep per-notebook state of the volumes snapshot toggle
    snapshot_volumes = Field(type=bool, default=False)
    # override from PipelineConfig: set the default value to False
    autosnapshot = Field(type=bool, default=False)

    @property
    def source_path(self):
        """Get the path to the source notebook."""
        return self.notebook_path

    def _preprocess(self, kwargs):
        k = "steps_defaults"
        kwargs[k] = self._parse_steps_defaults(kwargs.get(k))

    def _parse_steps_defaults(self, steps_defaults):
        """Parse common step configuration defined in the metadata."""
        result = dict()

        if not isinstance(steps_defaults, list):
            return steps_defaults

        for c in steps_defaults:
            if any(re.match(_c, c)
                   for _c in _STEPS_DEFAULTS_LANGUAGE) is False:
                raise ValueError("Unrecognized common step configuration:"
                                 " {}".format(c))

            parts = c.split(":")

            conf_type = parts.pop(0)
            if conf_type in ["annotation", "label"]:
                result_key = "{}s".format(conf_type)
                if result_key not in result:
                    result[result_key] = dict()
                key, value = get_annotation_or_label_from_tag(
                    parts)
                result[result_key][key] = value

            if conf_type == "limit":
                if "limits" not in result:
                    result["limits"] = dict()
                key, value = get_limit_from_tag(parts)
                result["limits"][key] = value
        return result


class NotebookProcessor:
    """Convert a Notebook to a Pipeline object."""

    def __init__(self,
                 nb_path: str,
                 nb_metadata_overrides: dict = None,
                 ignore_nb_config: bool = False):
        """Instantiate a new NotebookProcessor.

        Args:
            nb_path: Path to source notebook
            nb_metadata_overrides: Override notebook config settings
            ignore_nb_config: Set to True in order to skip the notebook's
                metadata validation. This is useful in case the
                NotebookProcessor is used to parse a part of the notebook
                (e.g. retrieve pipeline metrics) and the notebook config
                (for pipeline generation) might still be invalid.
        """
        self.nb_path = os.path.expanduser(nb_path)
        self.notebook = self._read_notebook()

        nb_metadata = self.notebook.metadata.get(KALE_NB_METADATA_KEY, dict())

        # fixme: needed?
        nb_metadata.update({"notebook_path": nb_path})
        if nb_metadata_overrides:
            nb_metadata.update(nb_metadata_overrides)
        # validate and populate defaults
        # FIXME: Maybe improve this by implementing a "skip_validation" flag
        #  in the config class
        self.config = None
        if not ignore_nb_config:
            self.config = NotebookConfig(**nb_metadata)
        self.pipeline = Pipeline(self.config)

    def _read_notebook(self):
        if not os.path.exists(self.nb_path):
            raise ValueError("NotebookProcessor could not find a notebook at"
                             " path %s" % self.nb_path)
        return nb.read(self.nb_path, as_version=nb.NO_CONVERT)

    def to_pipeline(self):
        """Convert an annotated Notebook to a Pipeline object."""
        (pipeline_parameters_source,
         pipeline_metrics_source,
         imports_and_functions) = self.parse_notebook()

        self.parse_pipeline_parameters(pipeline_parameters_source)
        self.pipeline.set_volume_pipeline_parameters()

        # get a list of variables that need to be logged as pipeline metrics
        pipeline_metrics = ast.parse_metrics_print_statements(
            pipeline_metrics_source)

        # run static analysis over the source code
        dependencies.dependencies_detection(
            self.pipeline,
            imports_and_functions=imports_and_functions
        )
        dependencies.assign_metrics(self.pipeline, pipeline_metrics)

        # if there are multiple DAG leaves, add an empty step at the end of the
        # pipeline for final snapshot
        leaf_steps = self.pipeline.get_leaf_steps()
        if self.config.autosnapshot and len(leaf_steps) > 1:
            _name = "final_auto_snapshot"
            self.pipeline.add_step(Step(name=_name, source=[]))
            # add a link from all the last steps of the pipeline to
            # the final auto snapshot one.
            for step in leaf_steps:
                self.pipeline.add_edge(step.name, _name)

        # FIXME: Move this to a base class Processor, to be executed by default
        #  after `to_pipeline`, so that it is agnostic to the type of
        #  processor.
        for step in self.pipeline.steps:
            step.config.update(self.pipeline.config.steps_defaults,
                               patch=False)

        # TODO: Additional action required:
        #  Run a static analysis over every step to check that pipeline
        #  parameters are not assigned with new values.
        return self.pipeline

    def parse_pipeline_parameters(self, source: str):
        """Get pipeline parameters from source code."""
        pipeline_parameters = ast.parse_assignments_expressions(source)
        for name, (v_type, v_value) in pipeline_parameters.items():
            pipeline_parameters[name] = ast.PipelineParam(v_type, v_value)
        self.pipeline.pipeline_parameters = pipeline_parameters

    def parse_notebook(self):
        """Creates a NetworkX graph based on the input notebook's tags.

        Cell's source code are embedded into the graph as node attributes.
        """
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

        for c in self.notebook.cells:
            if c.cell_type != "code":
                continue

            tags = self.parse_cell_metadata(c.metadata)

            if len(tags['step_names']) > 1:
                raise NotImplementedError("Kale does not yet support multiple"
                                          " step names in a single notebook"
                                          " cell. One notebook cell was found"
                                          " with %s  step names"
                                          % tags['step_names'])

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
                    self.pipeline.merge_code(prev_step_name, c.source)
            else:
                # in this branch we are sure that we are reading a code cell
                # with a step tag, so we must not allow for pipeline-metrics
                if prev_step_name == 'pipeline-metrics':
                    raise ValueError("Tag pipeline-metrics must be placed on a"
                                     " cell at the end of the Notebook."
                                     " Pipeline metrics should be considered"
                                     " as a result of the pipeline execution"
                                     " and not of single steps.")
                # add node to DAG, adding tags and source code of notebook cell
                if step_name not in self.pipeline.nodes:
                    step = Step(name=step_name, source=[c.source],
                                ins=set(), outs=set(),
                                limits=tags.get("limits", {}),
                                labels=tags.get("labels", {}),
                                annotations=tags.get("annotations", {}))
                    self.pipeline.add_step(step)
                    for _prev_step in tags['prev_steps']:
                        if _prev_step not in self.pipeline.nodes:
                            raise ValueError("Step %s does not exist. It was "
                                             "defined as previous step of %s"
                                             % (
                                                 _prev_step,
                                                 tags['step_names']))
                        self.pipeline.add_edge(_prev_step, step_name)
                else:
                    self.pipeline.merge_code(step_name, c.source)

                prev_step_name = step_name

        # Prepend any `imports` and `functions` cells to every Pipeline step
        for step in self.pipeline.steps:
            step.source = imports_block + functions_block + step.source

        # merge together pipeline parameters
        pipeline_parameters = '\n'.join(pipeline_parameters)
        # merge together pipeline metrics
        pipeline_metrics = '\n'.join(pipeline_metrics)

        imports_and_functions = "\n".join(imports_block + functions_block)
        return pipeline_parameters, pipeline_metrics, imports_and_functions

    def parse_cell_metadata(self, metadata):
        """Parse a notebook's cell's metadata field.

        The Kale UI writes specific tags inside the 'tags' field, as a list
        of string tags. Supported tags are defined by _TAGS_LANGUAGE.

        Args:
            metadata (dict): a dict containing a notebook's cell's metadata

        Returns (dict): parsed tags based on Kale tagging language

        """
        parsed_tags = dict()

        # `step_names` is a list because a notebook cell might be assigned to
        # more than one Pipeline step.
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
            #       parameters. The cell must contain only assignment
            #       expressions
            #  - pipeline-metrics: use the cell to populate Pipeline metrics.
            #       The cell must contain only variable names
            #  - imports: the code of the corresponding cell(s) will be
            #       prepended to every Pipeline step
            #  - functions: same as imports, but the corresponding code is
            #       placed **after** `imports`
            special_tags = ['skip', 'pipeline-parameters', 'pipeline-metrics',
                            'imports', 'functions']
            if t in special_tags:
                parsed_tags['step_names'] = [t]
                return parsed_tags

            # now only `block|step` and `prev` tags remain to be parsed.
            tag_parts = t.split(':')
            tag_name = tag_parts.pop(0)

            if tag_name == "annotation":
                key, value = get_annotation_or_label_from_tag(tag_parts)
                cell_annotations.update({key: value})

            if tag_name == "label":
                key, value = get_annotation_or_label_from_tag(tag_parts)
                cell_labels.update({key: value})

            if tag_name == "limit":
                key, value = get_limit_from_tag(tag_parts)
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
            raise ValueError(
                "A cell can not provide `prev` annotations without "
                "providing a `block` or `step` annotation as well")

        if cell_annotations:
            if not parsed_tags['step_names']:
                raise ValueError(
                    "A cell can not provide Pod annotations in a cell"
                    " that does not declare a step name.")
            parsed_tags['annotations'] = cell_annotations

        if cell_limits:
            if not parsed_tags['step_names']:
                raise ValueError(
                    "A cell can not provide Pod resource limits in a"
                    " cell that does not declare a step name.")
            parsed_tags['limits'] = cell_limits
        return parsed_tags

    def get_pipeline_parameters_source(self):
        """Get just pipeline parameters cells from the notebook.

        Returns (str): pipeline parameters source code
        """
        return self._get_reserved_tag_source(PIPELINE_PARAMETERS_TAG)

    def get_pipeline_metrics_source(self):
        """Get just pipeline metrics cells from the notebook.

        Returns (str): pipeline metrics source code
        """
        # check that the pipeline metrics tag is only assigned to cells at
        # the end of the notebook
        detected = False
        tags = _TAGS_LANGUAGE[:]
        tags.remove(PIPELINE_METRICS_TAG)

        for c in self.notebook.cells:
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
            if (detected
                and 'tags' in c.metadata
                and len(c.metadata['tags']) > 0
                and any([any(re.match(tag, t) for t in c.metadata['tags'])
                         for tag in tags])):
                raise ValueError(
                    "Tag pipeline-metrics tag must be placed on a "
                    "cell at the end of the Notebook."
                    " Pipeline metrics should be considered as a"
                    " result of the pipeline execution and not of"
                    " single steps.")
        return self._get_reserved_tag_source(PIPELINE_METRICS_TAG)

    def _get_reserved_tag_source(self, search_tag):
        """Get just the specific tag's source code.

        When searching for tag x, will return all cells that are tagged with x
        and, if untagged, follow cells with tag x. The result is a multiline
        string containing all the python code associated to x.

        Note: This is designed for 'special' tags, as the STEP_TAG is excluded
              from the match.

        Args:
            search_tag (str): the target tag

        Returns: the unified code of all the cells belonging to `search_tag`
        """
        detected = False
        source = ''

        language = _TAGS_LANGUAGE[:]
        language.remove(search_tag)

        for c in self.notebook.cells:
            # parse only source code cells
            if c.cell_type != "code":
                continue
            # in case the previous cell was a `search_tag` cell and this
            # cell is not any other tag of the tag language:
            if (detected
                and (('tags' not in c.metadata
                      or len(c.metadata['tags']) == 0)
                     or all([not any(re.match(tag, t)
                                     for t in c.metadata['tags'])
                            for tag in language]))):
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
