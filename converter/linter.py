import re

from pyflakes import api, reporter


class MyStreamList:

    def __init__(self):
        self.out = list()

    def write(self, text):
        self.out.append(text)

    def reset(self):
        self.out = list()
        return self

    def __call__(self):
        return self.out


class CodeInspectorLinter:

    def __init__(self):
        self.flakes_stdout = MyStreamList()
        self.flakes_stderr = MyStreamList()
        self.global_code_blocks = list()

    def register_global_names(self, code_blocks):
        """
        Collect global code blocks that will be injected at the beginning of
        every code inspection. This is useful to avoid any `missing` detection
        for global imports, functions and variables.

        Args:
            code_blocks: A list of code blocks or a single string block
        """
        if not isinstance(code_blocks, list):
            if isinstance(code_blocks, str):
                code_blocks = [code_blocks]
            else:
                raise ValueError("register_global_names: code_blocks arg must be either `list` or `str`")

        self.global_code_blocks = code_blocks

    def _append_globals(self, code):
        """

        Args:
            code: A multiline string representing a code block

        Returns:

        """
        return '\n'.join(self.global_code_blocks + [code])

    def inspect_code(self, code):
        code = self._append_globals(code)
        rep = reporter.Reporter(self.flakes_stdout.reset(), self.flakes_stderr.reset())
        api.check(code, filename="block", reporter=rep)

        # Match names
        p = r"'(.+?)'"

        out = rep._stdout()
        # Using set to avoid repeating same entry if same missing name is called multiple times
        undef_vars = set()
        for l in list(filter(lambda a: a != '\n' and 'undefined name' in a, out)):
            var_search = re.search(p, l)
            undef_vars.add(var_search.group(1))

        return set(undef_vars)
