# Copyright 2019-2020 The Kale Authors
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import os
import re
import warnings

from typing import Any, Dict

import nbformat as nb

from kale.config import Field
from kale import Pipeline, Step, PipelineConfig, PipelineParam
from kale.common import astutils, flakeutils, graphutils, utils

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


METRICS_TEMPLATE = '''\
from kale.common import kfputils as _kale_kfputils
_kale_kfp_metrics = {
%s
}
_kale_kfputils.generate_mlpipeline_metrics(_kale_kfp_metrics)\
'''


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
        kwargs["steps_defaults"] = self._parse_steps_defaults(
            kwargs.get("steps_defaults"))

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
                 nb_metadata_overrides: Dict[str, Any] = None,
                 skip_validation: bool = False):
        """Instantiate a new NotebookProcessor.

        Args:
            nb_path: Path to source notebook
            nb_metadata_overrides: Override notebook config settings
            skip_validation: Set to True in order to skip the notebook's
                metadata validation. This is useful in case the
                NotebookProcessor is used to parse a part of the notebook
                (e.g., retrieve pipeline metrics) and the notebook config (for
                pipeline generation) might still be invalid.
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
        if not skip_validation:
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
        pipeline_metrics = astutils.parse_metrics_print_statements(
            pipeline_metrics_source)

        # run static analysis over the source code
        self.dependencies_detection(imports_and_functions)
        self.assign_metrics(pipeline_metrics)

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
            step.config.update(self.pipeline.config.steps_defaults)

        # TODO: Additional action required:
        #  Run a static analysis over every step to check that pipeline
        #  parameters are not assigned with new values.
        return self.pipeline

    def parse_pipeline_parameters(self, source: str):
        """Get pipeline parameters from source code."""
        pipeline_parameters = astutils.parse_assignments_expressions(source)
        for name, (v_type, v_value) in pipeline_parameters.items():
            pipeline_parameters[name] = PipelineParam(v_type, v_value)
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
                    self.pipeline.get_step(prev_step_name).merge_code(c.source)
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
                    self.pipeline.get_step(step_name).merge_code(c.source)

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

    def get_imports_and_functions(self):
        """Get the global code that runs at the beginning of every step."""
        return "\n".join([self._get_reserved_tag_source(IMPORT_TAG),
                          self._get_reserved_tag_source(FUNCTIONS_TAG)])

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

    def assign_metrics(self, pipeline_metrics: dict):
        """Assign pipeline metrics to specific pipeline steps.

        This assignment follows a similar logic to the detection of `out`
        dependencies. Starting from a temporary step - child of all the leaf
        nodes, all the nodes in the pipelines are traversed in reversed
        topological order. When a step shows one of the metrics as part of its
        code, then that metric is assigned to the step.

        Args:
            pipeline_metrics (dict): a dict of pipeline metrics where the key
                always the KFP sanitized name and the value the name of the
                original variable.
        """
        # create a temporary step at the end of the pipeline to simplify the
        # iteration from the leaf steps
        tmp_step_name = "_tmp"
        leaf_steps = self.pipeline.get_leaf_steps()
        if not leaf_steps:
            return
        [self.pipeline.add_edge(step.name, tmp_step_name)
         for step in leaf_steps]

        # pipeline_metrics is a dict having sanitized variable names as keys
        # and the corresponding variable names as values. Here we need to refer
        # to the sanitized names using the python variables.
        # XXX: We could change parse_metrics_print_statements() to return the
        # XXX: reverse dictionary, but that would require changing either
        # XXX: rpc.nb.get_pipeline_metrics() or change in the JupyterLab
        # XXX: Extension parsing of the RPC result
        rev_pipeline_metrics = {v: k for k, v in pipeline_metrics.items()}
        metrics_left = set(rev_pipeline_metrics.keys())
        for anc in graphutils.get_ordered_ancestors(self.pipeline,
                                                    tmp_step_name):
            if not metrics_left:
                break

            anc_step = self.pipeline.get_step(anc)
            anc_source = '\n'.join(anc_step.source)
            # get all the marshal candidates from father's source and intersect
            # with the metrics that have not been matched yet
            marshal_candidates = astutils.get_marshal_candidates(anc_source)
            assigned_metrics = metrics_left.intersection(marshal_candidates)
            # Remove the metrics that have already been assigned.
            metrics_left.difference_update(assigned_metrics)
            # Generate code to produce the metrics artifact in the current step
            if assigned_metrics:
                code = METRICS_TEMPLATE % ("    " + ",\n    ".join(
                    ['"%s": %s' % (rev_pipeline_metrics[x], x)
                     for x in sorted(assigned_metrics)]))
                anc_step.source.append(code)
            # need to have a `metrics` flag set to true in order to set the
            # metrics output artifact in the pipeline template
            anc_step.metrics = True

        self.pipeline.remove_node(tmp_step_name)

    def dependencies_detection(self, imports_and_functions: str = ""):
        """Detect the data dependencies between nodes in the graph.

        The data dependencies detection algorithm roughly works as follows:

        1. Traversing the graph in topological order, for every node `step` do
        2. Detect the `ins` of current `step` by running PyFlakes on the source
         code. During this action the pipeline parameters are taken into
         consideration
        3. Parse `step`'s global function definitions to get free variables
         (i.e. variables that would need to be marshalled in other steps that
         call these functions) - in this action pipeline parameters are taken
         into consideration.
        4. Get all the function that `step` calls
        5. For every `step`'s ancestor `anc` do
            - Get all the potential names (objects, functions, ...) of `anc`
             that could be marshalled (saved)
            - Intersect this with the `step`'s `ins` (from action 2) and add
             the result to `anc`'s `outs`.
            - for every `step`'s function call (action 4), check if this
             function was defined in `anc` and if it has free variables
             (action 3). If so, add to `step`'s `ins` and to `anc`'s `outs`
             these free variables.

        Args:
            imports_and_functions: Multiline Python source that is prepended to
                every pipeline step

        Returns: annotated graph
        """
        # resolve the data dependencies between steps, looping through the
        # graph
        for step in self.pipeline.steps:
            # detect the INS dependencies of the CURRENT node------------------
            step_source = '\n'.join(step.source)
            # get the variables that this step is missing and the pipeline
            # parameters that it actually needs.
            ins, parameters = self._detect_in_dependencies(
                source_code=step_source,
                pipeline_parameters=self.pipeline.pipeline_parameters)
            fns_free_variables = self._detect_fns_free_variables(
                step_source, imports_and_functions,
                self.pipeline.pipeline_parameters)

            # Get all the function calls. This will be used below to check if
            # any of the ancestors declare any of these functions. Is that is
            # so, the free variables of those functions will have to be loaded.
            fn_calls = astutils.get_function_calls(step_source)

            # add OUT dependencies annotations in the PARENT nodes-------------
            # Intersect the missing names of this father's child with all
            # the father's names. The intersection is the list of variables
            # that the father need to serialize
            # The ancestors are the the nodes that have a path to `step`,
            # ordered by path length.
            ins_left = ins.copy()
            for anc in (graphutils.get_ordered_ancestors(self.pipeline,
                                                         step.name)):
                if not ins_left:
                    # if there are no more variables that need to be
                    # marshalled, stop the graph traverse
                    break
                anc_step = self.pipeline.get_step(anc)
                anc_source = '\n'.join(anc_step.source)
                # get all the marshal candidates from father's source and
                # intersect with the required names of the current node
                marshal_candidates = astutils.get_marshal_candidates(
                    anc_source)
                outs = ins_left.intersection(marshal_candidates)
                # Remove the ins that have already been assigned to an ancestor
                ins_left.difference_update(outs)
                # Include free variables
                to_remove = set()
                for fn_call in fn_calls:
                    anc_fns_free_vars = anc_step.fns_free_variables
                    if fn_call in anc_fns_free_vars.keys():
                        # the current step needs to load these variables
                        fn_free_vars, used_params = anc_fns_free_vars[fn_call]
                        # search if this function calls other functions (i.e.
                        # if its free variables are found in the free variables
                        # dict)
                        _left = list(fn_free_vars)
                        while _left:
                            _cur = _left.pop(0)
                            # if the free var is itself a fn with free vars
                            if _cur in anc_fns_free_vars:
                                fn_free_vars.update(anc_fns_free_vars[_cur][0])
                                _left = _left + list(
                                    anc_fns_free_vars[_cur][0])
                        ins.update(fn_free_vars)
                        # the current ancestor needs to save these variables
                        outs.update(fn_free_vars)
                        # add the parameters used by the function to the list
                        # of pipeline parameters used by the step
                        _pps = self.pipeline.pipeline_parameters
                        for param in used_params:
                            parameters[param] = _pps[param]

                        # Remove this function as it has been served. We don't
                        # want other ancestors to save free variables for this
                        # function. Using the helper to_remove because the set
                        # can not be resized during iteration.
                        to_remove.add(fn_call)
                        # add the function and its free variables to the
                        # current step as well. This is useful in case
                        # *another* function will call this one (`fn_call`) in
                        # a child step. In this way we can track the calls up
                        # to the last free variable. (refer to test
                        # `test_dependencies_detection_recursive`)
                        fns_free_variables[fn_call] = anc_fns_free_vars[
                            fn_call]
                fn_calls.difference_update(to_remove)
                # Add to ancestor the new outs annotations. First merge the
                # current outs present in the anc with the new ones
                anc_step.outs.update(outs)

            step.ins = sorted(ins)
            step.parameters = parameters
            step.fns_free_variables = fns_free_variables

    def _detect_in_dependencies(self,
                                source_code: str,
                                pipeline_parameters: dict = None):
        """Detect missing names from one pipeline step source code.

        Args:
            source_code: Multiline Python source code
            pipeline_parameters: Pipeline parameters dict
        """
        commented_source_code = utils.comment_magic_commands(source_code)
        ins = flakeutils.pyflakes_report(code=commented_source_code)

        # Pipeline parameters will be part of the names that are missing,
        # but of course we don't want to marshal them in as they will be
        # present as parameters
        relevant_parameters = set()
        if pipeline_parameters:
            # Not all pipeline parameters are needed in every pipeline step,
            # these are the parameters that are actually needed by this step.
            relevant_parameters = ins.intersection(pipeline_parameters.keys())
            ins.difference_update(relevant_parameters)
        step_params = {k: pipeline_parameters[k] for k in relevant_parameters}
        return ins, step_params

    def _detect_fns_free_variables(self,
                                   source_code: str,
                                   imports_and_functions: str = "",
                                   step_parameters: dict = None):
        """Return the function's free variables.

        Free variable: _If a variable is used in a code block but not defined
        there, it is a free variable._

        An Example:

        ```
        x = 5
        def foo():
            print(x)
        ```

        In the example above, `x` is a free variable for function `foo`,
        because it is defined outside of the context of `foo`.

        Here we run the PyFlakes report over the function body to get all the
        missing names (i.e. free variables), excluding the function arguments.

        Args:
            source_code: Multiline Python source code
            imports_and_functions: Multiline Python source that is prepended
                to every pipeline step. It should contain the code cells that
                where tagged as `import` and `functions`. We prepend this code
                to the function body because it will always be present in any
                pipeline step.
            step_parameters: Step parameters names. The step parameters
                are removed from the pyflakes report, as these names will
                always be available in the step's context.

        Returns (dict): A dictionary with the name of the function as key and
            a list of variables names + consumed pipeline parameters as values.
        """
        fns_free_vars = dict()
        # now check the functions' bodies for free variables. fns is a
        # dict function_name -> function_source
        fns = astutils.parse_functions(source_code)
        for fn_name, fn in fns.items():
            code = imports_and_functions + "\n" + fn
            free_vars = flakeutils.pyflakes_report(code=code)
            # the pipeline parameters that are used in the function
            consumed_params = {}
            if step_parameters:
                consumed_params = free_vars.intersection(
                    step_parameters.keys())
                # remove the used parameters form the free variables, as they
                # need to be handled differently.
                free_vars.difference_update(consumed_params)
            fns_free_vars[fn_name] = (free_vars, consumed_params)
        return fns_free_vars
