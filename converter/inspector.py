import ast

from collections import deque


class CodeInspector:

    # TODO: Get this list dynamically
    __BUILT_INS = ["abs", "delattr", "hash", "memoryview", "set",
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

    def __init__(self):
        self.global_names = set()

    def __walk(self, node, skip_nodes=None):
        """

        Args:
            node:
            skip_nodes:

        Returns:

        """
        # Attribute: node that defined a method call or an object attribute
        # Skip for now, might be necessary to use this in case the attribute belongs to object from previous step
        if skip_nodes is not None and not isinstance(skip_nodes, tuple):
            raise ValueError("CodeInspector.__walk: skip_nodes must be a tuple")
        if skip_nodes is None:
            skip_nodes = tuple()
        todo = deque([node])
        while todo:
            node = todo.popleft()
            if not isinstance(node, skip_nodes):
                next_nodes = ast.iter_child_nodes(node)
                for n in next_nodes:
                    todo.extend([n])
            yield node

    def __left_assign_values(self, assign_node):
        assert isinstance(assign_node, (ast.Assign, ast.AnnAssign))
        values = list()
        for _t in assign_node.targets:
            if isinstance(_t, ast.Tuple):
                for target in _t.elts:
                    # this is an ast.Name instance
                    values.append(target.id)
            elif isinstance(_t, ast.Name):
                values.append(_t.id)
            elif isinstance(_t, ast.Attribute):
                # TODO: Handle this
                pass
            else:
                raise ValueError(f"__left_assign_value: Object type not recognized: {type(_t)}")
        return values

    def __get_tuple_names(self, tuple_node):
        assert isinstance(tuple_node, (ast.Tuple, ))
        names = list()
        for _n in tuple_node.elts:
            if isinstance(_n, (ast.Tuple, )):
                names.extend(self.__get_tuple_names(_n))
            elif isinstance(_n, (ast.Name, )):
                names.append(_n.id)
        return names

    def register_global_names(self, code_blocks):
        """
        Register all:

            - import nodules names and alises
            - variable names
            - function names
            - class names

        in the code blocks that will be injected in every pipelines block.
        We register there names because every time we encounter them in
        the parsing we can ignore them.

        Args:
            code_blocks:

        Returns:

        """
        if not isinstance(code_blocks, list):
            if isinstance(code_blocks, str):
                code_blocks = [code_blocks]
            else:
                raise ValueError("register_global_names: code_blocks arg must be either `list` or `str`")

        skip_nodes = (ast.FunctionDef, ast.ClassDef)
        for code in code_blocks:
            tree = ast.parse(code)
            for block in tree.body:
                for node in self.__walk(block, skip_nodes=skip_nodes):
                    # Register imports
                    if isinstance(node, (ast.Import, ast.ImportFrom, )):
                        for _n in node.names:
                            if _n.asname is None:
                                self.global_names.add(_n.name)
                            else:
                                self.global_names.add(_n.asname)
                    # Register functions and classes
                    if isinstance(node, (ast.FunctionDef, ast.ClassDef, )):
                        self.global_names.add(node.name)

                    # Register variables
                    if isinstance(node, (ast.Assign, ast.AnnAssign)):
                        self.global_names.update(self.__left_assign_values(node))

    def inspect_code(self, code):
        """

        Args:
            code:

        Returns:

        """
        # TODO: In general I should find a way to keep the context of conditions, loops and functions
        #   What I need is a way to know that I am inside a (example: loop) and forget about assignments
        #   once I get out of the loop. This could be done by calling a separate `walk` on each
        #   context block and stop from advancing the outer `walk`. Or, since `walk` is an iterator,
        #   I can call it in different parts of the code with a different logic. But I need to `walk`
        #   with a queue intialized only the context root node (e.g. For) so that when the context is
        #   exited the queue is empty

        # variables that have been found on the left side of an assignment
        assigned = set()
        ins = set()
        # outs will be another matter. I will have to understand what are the outputs of a block once I have
        # all the ins of all the blocks. Then I will resolve the dependency graph and see where to find the
        # ins of the following blocks
        # outs = dict()

        skip_nodes = (ast.FunctionDef, ast.ClassDef)
        tree = ast.parse(code)
        for block in tree.body:
            for node in self.__walk(block, skip_nodes=skip_nodes):
                if isinstance(node, (ast.Import, ast.ImportFrom,)):
                    for _n in node.names:
                        if _n.asname is None:
                            assigned.add(_n.name)
                        else:
                            assigned.add(_n.asname)
                if isinstance(node, (ast.FunctionDef, ast.ClassDef,)):
                    assigned.add(node.name)

                # Detect name assign using `with` block using `as` keyword (e.g. with open(...) as f:)
                if isinstance(node, (ast.With, )):
                    for _w in node.items:
                        assert isinstance(_w, (ast.withitem, ))
                        if _w.optional_vars is not None:
                            assert isinstance(_w.optional_vars, (ast.Name, ))
                            assigned.add(_w.optional_vars.id)

                # TODO: Now I am not registering the for loop context. So I register the variable
                #   assigned in the loop but I do not check if the variable is overwriting an outer
                #   context. So if the block uses the same name to reference a previous block variable
                #   then I loose the reference
                if isinstance(node, (ast.For, )):
                    if isinstance(node.target, (ast.Name, )):
                        assigned.add(node.target.id)
                    elif isinstance(node.target, (ast.Tuple, )):
                        assigned.update(self.__get_tuple_names(node.target))

                if isinstance(node, (ast.Assign, ast.AnnAssign)):
                    assigned.update(self.__left_assign_values(node))

                if isinstance(node, ast.Name):
                    _id = node.id
                    if _id not in assigned and \
                       _id not in self.global_names and \
                       _id not in self.__BUILT_INS:
                        ins.add(_id)
        return ins, assigned
