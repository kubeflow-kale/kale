#  Copyright 2020 The Kale Authors
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

import networkx as nx

from pyflakes import api as pyflakes_api
from pyflakes import reporter as pyflakes_reporter

from kale.common import utils, graphutils
from kale.static_analysis import ast as kale_ast


class StreamList:
    """Simulate a file object to store Flakes' report streams."""

    def __init__(self):
        self.out = list()

    def write(self, text):
        """Write to stream list."""
        self.out.append(text)

    def reset(self):
        """Clean the stream list."""
        self.out = list()
        return self

    def __call__(self):
        """Return the stream list."""
        return self.out


def pyflakes_report(code):
    """Inspect code using PyFlakes to detect any 'missing name' report.

    Args:
        code: A multiline string representing Python code

    Returns: a list of names that have been reported missing by Flakes
    """
    flakes_stdout = StreamList()
    flakes_stderr = StreamList()
    rep = pyflakes_reporter.Reporter(
        flakes_stdout.reset(),
        flakes_stderr.reset())
    pyflakes_api.check(code, filename="kale", reporter=rep)

    # the stderr stream should be used just for compilation error, so if any
    # message is found in the stderr stream, raise an exception
    if rep._stderr():
        raise RuntimeError("Flakes reported the following error:"
                           "\n{}".format('\t' + '\t'.join(rep._stderr())))

    # Match names
    p = r"'(.+?)'"

    out = rep._stdout()
    # Using a `set` to avoid repeating the same var names in case they are
    # reported missing multiple times by flakes
    undef_vars = set()
    # iterate over all the flakes report output, keeping only lines
    # with 'undefined name' reports
    for line in filter(lambda a: a != '\n' and 'undefined name' in a, out):
        var_search = re.search(p, line)
        undef_vars.add(var_search.group(1))
    return undef_vars


def detect_in_dependencies(source_code: str,
                           pipeline_parameters: dict = None):
    """Detect missing names from one pipeline step source code.

    Args:
        source_code: Multiline Python source code
        pipeline_parameters: Pipeline parameters dict
    """
    commented_source_code = utils.comment_magic_commands(source_code)
    ins = pyflakes_report(code=commented_source_code)

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


def detect_fns_free_variables(source_code, imports_and_functions="",
                              step_parameters=None):
    """Return the function's free variables.

    Free variable: _If a variable is used in a code block but not defined
    there, it is a free variable._

    An Example:

    ```
    x = 5
    def foo():
        print(x)
    ```

    In the example above, `x` is a free variable for function `foo`, because
    it is defined outside of the context of `foo`.

    Here we run the PyFlakes report over the function body to get all the
    missing names (i.e. free variables), excluding the function arguments.

    Args:
        source_code: Multiline Python source code
        imports_and_functions: Multiline Python source that is prepended
            to every pipeline step. It should contain the code cells that
            where tagged as `import` and `functions`. We prepend this code to
            the function body because it will always be present in any pipeline
            step.
        step_parameters: Step parameters names. The step parameters
            are removed from the pyflakes report, as these names will always
            be available in the step's context.

    Returns (dict): A dictionary with the name of the function as key and
        a list of variables names + consumed pipeline parameters as values.
    """
    fns_free_vars = dict()
    # now check the functions' bodies for free variables. fns is a
    # dict function_name -> function_source
    fns = kale_ast.parse_functions(source_code)
    for fn_name, fn in fns.items():
        code = imports_and_functions + "\n" + fn
        free_vars = pyflakes_report(code=code)
        # the pipeline parameters that are used in the function
        consumed_params = {}
        if step_parameters:
            consumed_params = free_vars.intersection(step_parameters.keys())
            # remove the used parameters form the free variables, as they
            # need to be handled differently.
            free_vars.difference_update(consumed_params)
        fns_free_vars[fn_name] = (free_vars, consumed_params)
    return fns_free_vars


def dependencies_detection(nb_graph: nx.DiGraph,
                           pipeline_parameters: dict = None,
                           imports_and_functions: str = ""):
    """Detect the data dependencies between nodes in the graph.

    The data dependencies detection algorithm roughly works as follows:

    1. Traversing the graph in topological order, for every node `step` do
    2. Detect the `ins` of current `step` by running PyFlakes on the source
     code. During this action the pipeline parameters are taken into
     consideration
    3. Parse `step`'s global function definitions to get free variables
     (i.e. variables that would need to be marshalled in other steps that call
     these functions) - in this action pipeline parameters are taken into
     consideration.
    4. Get all the function that `step` calls
    5. For every `step`'s ancestor `anc` do
        - Get all the potential names (objects, functions, ...) of `anc` that
         could be marshalled (saved)
        - Intersect this with the `step`'s `ins` (from action 2) and add the
         result to `anc`'s `outs`.
        - for every `step`'s function call (action 4), check if this function
         was defined in `anc` and if it has free variables (action 3). If so,
         add to `step`'s `ins` and to `anc`'s `outs` these free variables.

    Args:
        nb_graph: nx DiGraph with pipeline code blocks
        pipeline_parameters: Pipeline parameters dict
        imports_and_functions: Multiline Python source that is prepended to
            every pipeline step

    Returns: annotated graph
    """
    # resolve the data dependencies between steps, looping through the graph
    for step in nx.topological_sort(nb_graph):
        step_data = nb_graph.nodes(data=True)[step]

        # detect the INS dependencies of the CURRENT node----------------------
        step_source_code = '\n'.join(step_data['source'])
        # get the variables that this step is missing and the pipeline
        # parameters that it actually needs.
        ins, parameters = detect_in_dependencies(
            source_code=step_source_code,
            pipeline_parameters=pipeline_parameters)
        fns_free_variables = detect_fns_free_variables(
            step_source_code, imports_and_functions, pipeline_parameters)

        # Get all the function calls. This will be used below to check if any
        # of the ancestors declare any of these functions. Is that is so, the
        # free variables of those functions will have to be loaded.
        fn_calls = kale_ast.get_function_calls(step_source_code)

        # add OUT dependencies annotations in the PARENT nodes-----------------
        # Intersect the missing names of this father's child with all
        # the father's names. The intersection is the list of variables
        # that the father need to serialize
        # The ancestors are the the nodes that have a path to `step`, ordered
        # by path length.
        ins_left = ins.copy()
        for anc in (graphutils.get_ordered_ancestors(nb_graph, step)):
            if not ins_left:
                # if there are no more variables that need to be marshalled,
                # stop the graph traverse
                break
            anc_data = nb_graph.nodes(data=True)[anc]
            anc_source = '\n'.join(anc_data['source'])
            # get all the marshal candidates from father's source and intersect
            # with the required names of the current node
            marshal_candidates = kale_ast.get_marshal_candidates(anc_source)
            outs = ins_left.intersection(marshal_candidates)
            # Remove the ins that have already been assigned to an ancestor.
            ins_left.difference_update(outs)
            # Include free variables
            to_remove = set()
            for fn_call in fn_calls:
                anc_fns_free_vars = anc_data.get("fns_free_variables", {})
                if fn_call in anc_fns_free_vars.keys():
                    # the current step needs to load these variables
                    fn_free_vars, used_params = anc_fns_free_vars[fn_call]
                    # search if this function calls other functions (i.e. if
                    # its free variables are found in the free variables dict)
                    _left = list(fn_free_vars)
                    while _left:
                        _cur = _left.pop(0)
                        # if the free var is itself a fn with free vars
                        if _cur in anc_fns_free_vars:
                            fn_free_vars.update(anc_fns_free_vars[_cur][0])
                            _left = _left + list(anc_fns_free_vars[_cur][0])
                    ins.update(fn_free_vars)
                    # the current ancestor needs to save these variables
                    outs.update(fn_free_vars)
                    # add the parameters used by the function to the list
                    # of pipeline parameters used by the step
                    for param in used_params:
                        parameters[param] = pipeline_parameters[param]
                    # Remove this function as it has been served. We don't want
                    # other ancestors to save free variables for this function.
                    # Using the helper to_remove because the set can not be
                    # resized during iteration.
                    to_remove.add(fn_call)
                    # add the function and its free variables to the current
                    # step as well. This is useful in case *another* function
                    # will call this one (`fn_call`) in a child step. In this
                    # way we can track the calls up to the last free variable.
                    # (refer to test `test_dependencies_detection_recursive`)
                    fns_free_variables[fn_call] = anc_fns_free_vars[fn_call]
            fn_calls.difference_update(to_remove)
            # Add to ancestor the new outs annotations. First merge the current
            # outs present in the anc with the new ones
            outs.update(anc_data.get('outs', []))
            nx.set_node_attributes(nb_graph, {anc: {'outs': sorted(outs)}})

        new_data = {'ins': sorted(ins),
                    'fns_free_variables': fns_free_variables,
                    'parameters': parameters}
        nx.set_node_attributes(nb_graph, {step: new_data})


METRICS_TEMPLATE = '''\
from kale.common import kfputils as _kale_kfputils
_kale_kfp_metrics = {
%s
}
_kale_kfputils.generate_mlpipeline_metrics(_kale_kfp_metrics)\
'''


def assign_metrics(nb_graph: nx.DiGraph, pipeline_metrics: dict):
    """Assign pipeline metrics to specific pipeline steps.

    This assignment follows a similar logic to the detection of `out`
    dependencies. Starting from a temporary step - child of all the leaf nodes,
    all the nodes in the pipelines are traversed in reversed topological order.
    When a step shows one of the metrics as part of its code, then that metric
    is assigned to the step.

    Args:
        nb_graph: nx DiGraph with pipeline code blocks
        pipeline_metrics (dict): a dict of pipeline metrics where the key is
            the KFP sanitized name and the value the name of the original
            variable.
    """
    # create a temporary step at the end of the pipeline to simplify the
    # iteration from the leaf steps
    tmp_step = "_tmp"
    leaf_steps = graphutils.get_leaf_nodes(nb_graph)
    if not leaf_steps:
        return
    [nb_graph.add_edge(node, tmp_step) for node in leaf_steps]

    # pipeline_metrics is a dict having sanitized variable names as keys and
    # the corresponding variable names as values. Here we need to refer to
    # the sanitized names using the python variables.
    # XXX: We could change parse_metrics_print_statements() to return the
    # XXX: reverse dictionary, but that would require changing either
    # XXX: rpc.nb.get_pipeline_metrics() or change in the JupyterLab Extension
    # XXX: parsing of the RPC result
    rev_pipeline_metrics = {v: k for k, v in pipeline_metrics.items()}
    metrics_left = set(rev_pipeline_metrics.keys())
    for anc in graphutils.get_ordered_ancestors(nb_graph, tmp_step):
        if not metrics_left:
            break

        anc_data = nb_graph.nodes(data=True)[anc]
        anc_source = '\n'.join(anc_data['source'])
        # get all the marshal candidates from father's source and intersect
        # with the metrics that have not been matched yet
        marshal_candidates = kale_ast.get_marshal_candidates(anc_source)
        assigned_metrics = metrics_left.intersection(marshal_candidates)
        # Remove the metrics that have already been assigned.
        metrics_left.difference_update(assigned_metrics)
        # Generate code to produce the metrics artifact in the current step
        if assigned_metrics:
            code = METRICS_TEMPLATE % ("    " + ",\n    ".join(
                ['"%s": %s' % (rev_pipeline_metrics[x], x)
                 for x in sorted(assigned_metrics)]))
            anc_data['source'].append(code)
        # need to have a `metrics` flag set to true in order to set the
        # metrics output artifact in the pipeline template
        nx.set_node_attributes(nb_graph, {anc: {'metrics': True}})

    nb_graph.remove_node(tmp_step)
