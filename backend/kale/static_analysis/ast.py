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
import ast
import astor

from collections import deque
from kale.common import utils
from functools import lru_cache


def walk(node, stop_at=tuple(), ignore=tuple()):
    """Walk through the children of an ast node.

    Args:
        node: an ast node
        stop_at: stop traversing through these nodes, including the matching
            node
        ignore: stop traversing through these nodes, excluding the matching
            node

    Returns: a generator of ast nodes
    """
    todo = deque([node])
    while todo:
        node = todo.popleft()
        if isinstance(node, ignore):
            # dequeue next node
            continue
        if not isinstance(node, stop_at):
            next_nodes = ast.iter_child_nodes(node)
            for n in next_nodes:
                todo.extend([n])
        yield node


def get_list_tuple_names(node):
    """Get all names of a tuple or list. Recursive method.

    Args:
        node: a ast.Tuple or ast.List node

    Returns: a list of all names of the tuple

    """
    assert isinstance(node, (ast.Tuple, ast.List))
    names = list()
    for _n in node.elts:
        if isinstance(_n, (ast.Tuple, ast.List)):
            # recursive call
            names.extend(get_list_tuple_names(_n))
        elif isinstance(_n, (ast.Name,)):
            names.append(_n.id)
    return names


@lru_cache(maxsize=128)
def get_marshal_candidates(code):
    """Get all the names that could be selected as objects to be marshalled.

    This function is used by a descendant node onto its ancestors to resolve
    its missing dependencies. Example:

    +---+     +---+     +---+
    | A | --> | B | --> | C |
    +---+     +---+     +---+

    When C runs the PyFlakes report on its source code, `x` is detected as a
    missing variable. Then C runs `get_marshal_candidates` on its ancestors,
    in order, starting from B. All the marshal candidates found in B that match
    any of the missing C's names, as set as B's `outs`.

    Ast nodes that become candidates:
        - ast.Name
        - ast.Import
        - ast.ImportFrom
        - ast.Tuple

    Ast nodes that create local contexts must be excluded from the search, as
    they can crete local variables that alias global ones. These nodes include
    ast.FunctionDef, ast.ClassDef, context manager names and list and dict
    comprehensions variables.

    Args:
        code (str): multiple string representing Python code

    Returns (list(str)): a list of names
    """
    names = set()

    # Comment IPython magic commands.
    # Note #1: This is needed to correctly parse the code using AST, as it does
    #  not understand IPython magic commands.
    # Note #2: This will comment out both in-line magics and cell magics. This
    #  can lead to potential errors in case a cell magic like `%%capture out`
    #  is used. In that case, Kale would detect as missing the `out` variable
    #  declared by the magic command and will try to marshal it in at the
    #  beginning of the pipeline step. These cases should be very rare, and
    #  will be handled case by case as specific issues arise.
    # Note #3: Magic commands are preserved in the resulting Python executable,
    #  they are commented just here in order to make AST run.
    commented_code = utils.comment_magic_commands(code)
    # need to exclude all the nodes that mights *define* variables in a local
    # scope. For example, a function may define a variable x that is aliasing
    # a global variable x, and we don't want to marshal it in that step, but
    # from the step that defines the global x.
    # TODO: Search for all possible python nodes that define local vars.
    #  List comprehensions ([i for i in list])
    #  Dict comprehensions
    #  Exception handling?
    #  Decorators?
    #  Context manager (just the alias)
    contexts = (ast.FunctionDef, ast.ClassDef, )
    tree = ast.parse(commented_code)
    for block in tree.body:
        for node in walk(block, stop_at=contexts):
            if isinstance(node, contexts):
                names.add(node.name)
            if isinstance(node, (ast.Name,)):
                names.add(node.id)
            if isinstance(node, (ast.Import, ast.ImportFrom,)):
                for _n in node.names:
                    if _n.asname is None:
                        names.add(_n.name)
                    else:
                        names.add(_n.asname)
            if isinstance(node, (ast.Tuple, ast.List)):
                names.update(get_list_tuple_names(node))
    return names


def parse_functions(code):
    """Parse all the global functions present in the input code.

    Parse all the ast nodes ast.FunctionDef that are global functions in the
    source code. These also include function that are defined inside other
    Python statements, like `try`. ast.ClassDef nodes are skipped from the
    parsing so that class functions are ignored.

    Args:
        code (str): Multiline string representing Python code

    Returns (dict): A dictionary [fn_name] -> function_source
    """
    fns = dict()
    tree = ast.parse(code)
    for block in tree.body:
        for node in walk(block,
                         stop_at=(ast.FunctionDef,),
                         ignore=(ast.ClassDef,)):
            if isinstance(node, (ast.FunctionDef,)):
                fn_name = node.name
                fns[fn_name] = astor.to_source(node)
    return fns


def get_function_calls(code):
    """Get all function names that are called in the input source code.

    A function call is something like:

    ```
    foo()
    ```

    That is obviously different from:

    ```
    obj.fn()
    ```

    These are parsed from the source code as `ast.Call` nodes, where the
    `func` attribute of the `ast` node is a `ast.Name` node.
    This is guaranteed to be a 'simple' function call (first example).

    Args:
        code (str): Multiline string representing Python code

    Returns (list(str)): List of function names
    """
    fns = set()
    tree = ast.parse(code)
    for block in tree.body:
        for node in walk(block):
            # a function call. We check the attribute func to be ast.Name
            # because it could also be a ast.Attribute node, in case of
            # function calls like obj.foo()
            if (isinstance(node, (ast.Call,))
                    and isinstance(node.func, (ast.Name,))):
                fns.add(node.func.id)
    return fns


def get_function_and_class_names(code):
    """Get all function and class names of the code block.

    Inspects the code walking through its AST and returns all
    the names of nodes matching ast.FunctionDef or ast.ClassDef.

    Args:
        code: Multiline string representing Python code

    Returns: List of string names
    """
    names = set()
    tree = ast.parse(code)
    for block in tree.body:
        for node in walk(block):
            if isinstance(node, (ast.FunctionDef, ast.ClassDef,)):
                names.add(node.name)
    return names


def parse_assignments_expressions(code):
    """Parse a code block composed of variable assignments.

    Args:
        code: Multiline string representing Python code

    Returns: Dict <variable_name>: <(variable_type, variable_value)>
    """
    variables = dict()
    tree = ast.parse(code)
    for block in tree.body:
        if not isinstance(block, ast.Assign):
            raise ValueError(
                "Must provide just primitive types assignments "
                "in variables block")
        targets = block.targets
        if isinstance(targets[0], (ast.Tuple, ast.List,)) or len(targets) > 1:
            raise ValueError(
                "Must provide single variable "
                "assignments in variables block")
        target = targets[0].id
        value = block.value
        # now get the type of the variable
        if isinstance(value, ast.Num):  # [int|float]
            value = value.n
            var_type = type(value).__name__
        elif isinstance(value, ast.Str):
            value = value.s
            var_type = 'str'
        elif isinstance(value, ast.NameConstant):  # [True|False|None]
            value = value.value
            if value is None:
                raise ValueError("`None` value None is not supported in "
                                 "pipeline parameters")
            var_type = 'bool'
        else:
            raise ValueError(
                "Variables block must be comprised "
                "of primitive variables "
                "(int, float, str, bool)")
        variables[target] = (var_type, value)
    return variables


def parse_metrics_print_statements(code):
    """Parse a list of print statements that must contain a variable.

    In terms of python's ast, the print argument must be an Expr node with
    Name node as value. Any line that does not respect the `print(<name>)`
    format will raise a ValueError.

    Args:
        code: Multiline string representing Python code

    Returns: a list of variable names
    """
    err_msg = ("Must provide just print statements of variables in the metrics"
               " cell. A variable name must be 64 chars long, have lowercase"
               " characters, digits or '-', and must start with a lowercase"
               " character and end with a lowercase character or digit.")
    code = code.strip()
    # remove empty lines
    if code == "":
        return {}
    code = '\n'.join(list(filter(str.strip, code.splitlines())))

    # Note the parenthesis around the pattern, so that it becomes a group
    # The ?: will make the 2nd group not be captured when using re.find()
    # https://www.regular-expressions.info/brackets.html
    var_name_pattern = "([a-z](?:[_a-z0-9]{0,62}[a-z0-9])?)"
    match_print = re.compile(r"^print\(%s\)$" % var_name_pattern,
                             re.MULTILINE)
    if not all(re.match(match_print, c) for c in code.splitlines()):
        raise ValueError(err_msg)
    # remove the leading "print(" and ending ")"
    variables = re.findall(match_print, code)
    if not all(v.isidentifier() for v in variables):
        raise ValueError(err_msg)

    # check that every remaining statement is a Name node
    tree = ast.parse('\n'.join(variables))
    for block in tree.body:
        if (not isinstance(block, ast.Expr)
                or not isinstance(block.value, ast.Name)):
            raise ValueError(err_msg)

    return {re.sub("_", "-", v): v for v in variables}
