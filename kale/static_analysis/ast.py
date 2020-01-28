import ast

from collections import deque

# TODO: Get this list dynamically
_BUILT_INS_ = ["abs", "delattr", "hash", "memoryview", "set",
               "all", "dict", "help", "min", "setattr",
               "any", "dir", "hex", "next", "slice",
               "ascii", "divmod", "id", "object", "sorted",
               "bin", "enumerate", "input", "oct", "staticmethod",
               "bool", "eval", "int", "open", "str",
               "breakpoint", "exec", "isinstance", "ord", "sum",
               "bytearray", "filter", "issubclass", "pow", "super",
               "bytes", "float", "iter", "print", "tuple",
               "callable", "format", "len", "property", "type",
               "chr", "frozenset", "list", "range", "vars",
               "classmethod", "getattr", "locals", "repr", "zip",
               "compile", "globals", "map", "reversed", "__import__",
               "complex", "hasattr", "max", "round"]


def walk(node, skip_nodes=tuple()):
    """Walk through the children of an ast node.

    Args:
        node: an ast node
        skip_nodes: stop traversing through these nodes

    Returns: a generator of ast nodes

    """
    todo = deque([node])
    while todo:
        node = todo.popleft()
        if not isinstance(node, skip_nodes):
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


def get_all_names(code):
    """Get all matching nodes from the ast of the input code block.

    Matching nodes:

        - ast.Name
        - ast.FunctionDef
        - ast.ClassDef
        - ast.Import
        - ast.ImportFrom
        - ast.Tuple

    This function is just used to make a cross reference with the missing names
    detected by the Flakes report. It is not used to arbitrary detect variable
    dependencies.

    Known missing detections:

        - Function and Class parameters

    Args:
        code: multiple string representing Python code

    Returns: a list of string names
    """
    names = set()
    tree = ast.parse(code)
    for block in tree.body:
        for node in walk(block):
            if isinstance(node, (ast.Name,)):
                names.add(node.id)
            if isinstance(node, (ast.FunctionDef, ast.ClassDef,)):
                names.add(node.name)
            if isinstance(node, (ast.Import, ast.ImportFrom,)):
                for _n in node.names:
                    if _n.asname is None:
                        names.add(_n.name)
                    else:
                        names.add(_n.asname)
            if isinstance(node, (ast.Tuple, ast.List)):
                names.update(get_list_tuple_names(node))
    return names


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
        if isinstance(targets[0], (ast.Tuple, ast.List, )) or len(targets) > 1:
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
