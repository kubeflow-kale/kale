# SPDX-License-Identifier: Apache-2.0
# Copyright (c) 2019–2025 The Kale Contributors.

import re

from pyflakes import reporter as pyflakes_reporter, api as pyflakes_api


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
