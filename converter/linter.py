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

    def inspect_code(self, code):
        rep = reporter.Reporter(self.flakes_stdout.reset(), self.flakes_stderr.reset())
        api.check(code, filename="block", reporter=rep)

        # Match names
        p = r"'(.+?)'"

        out = rep._stdout()
        undef_vars = list()
        for l in list(filter(lambda a: a != '\n' and 'undefined name' in a, out)):
            var_search = re.search(p, l)
            undef_vars.append(var_search.group(1))

        return undef_vars
