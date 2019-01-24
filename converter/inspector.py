import ast

from collections import deque

class CodeInspector:

    def walk(self, node):
        # Attribute: node that defined a method call or an object attribute
        # Skip for now, might be necessary to use this in case the attribute belongs to object from previous step
        skip_nodes = (ast.FunctionDef, ast.Attribute, )
        todo = deque([node])
        while todo:
            node = todo.popleft()
            next_nodes = ast.iter_child_nodes(node)
            for n in next_nodes():
                if not isinstance(n, skip_nodes):
                    todo.extend([n])
            yield node

    def inspect_code(self, code):
        # variables that have been found on the left side of an assignment
        assigned = set()
        ins = set()
        # outs will be another matter. I will have to understand what are the outputs of a block once I have
        # all the ins of all the blocks. Then I will resolve the dependency graph and see where to find the
        # ins of the following blocks
        # outs = dict()

        tree = ast.parse(code)
        for block in tree.body:
            for node in self.walk(block):
                if isinstance(node, ast.Assign):
                    for t in node.targets:
                        assert isinstance(t, ast.Name)
                        assigned.add(t.id)
                if isinstance(node, ast.Name) and node.id not in assigned:
                    # if this variable name was not seen before the we should read it from storage
                    ins.add(node.id)

    def variables_inspection(self, code):
        ins = dict()
        outs = dict()

        tree = ast.parse(code)
        for node in tree.body:
            assigned = None
            # a variable assignment
            if isinstance(node, ast.Assign):
                assigned = [n.id for n in node.targets]
            if isinstance(node, ast.AnnAssign):
                raise NotImplementedError
            if isinstance(node, ast.AugAssign):
                # es.: a += 1
                assigned = [node.target.id]
            if assigned:
                print(assigned)

        return ins, outs