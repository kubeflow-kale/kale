# Copyright 2026 The Kubeflow Authors.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""AST-based import parsing and package name resolution.

This module provides utilities for parsing Python import statements using AST
and resolving import names to their corresponding PyPI package names.

The key components are:
- STDLIB_MODULES: Set of Python standard library module names
- PACKAGE_NAME_MAP: Mapping from import names to PyPI package names
- parse_imports_ast(): Parse import statements from code using AST
- get_packages_to_install(): Get pip-installable package names from code
"""

import ast
from dataclasses import dataclass

# Python standard library modules (should not be pip installed)
# This is a comprehensive list for Python 3.10+
STDLIB_MODULES: set[str] = {
    # Built-in modules
    "abc",
    "aifc",
    "argparse",
    "array",
    "ast",
    "asynchat",
    "asyncio",
    "asyncore",
    "atexit",
    "audioop",
    "base64",
    "bdb",
    "binascii",
    "binhex",
    "bisect",
    "builtins",
    "bz2",
    "calendar",
    "cgi",
    "cgitb",
    "chunk",
    "cmath",
    "cmd",
    "code",
    "codecs",
    "codeop",
    "collections",
    "colorsys",
    "compileall",
    "concurrent",
    "configparser",
    "contextlib",
    "contextvars",
    "copy",
    "copyreg",
    "cProfile",
    "crypt",
    "csv",
    "ctypes",
    "curses",
    "dataclasses",
    "datetime",
    "dbm",
    "decimal",
    "difflib",
    "dis",
    "distutils",
    "doctest",
    "email",
    "encodings",
    "enum",
    "errno",
    "faulthandler",
    "fcntl",
    "filecmp",
    "fileinput",
    "fnmatch",
    "fractions",
    "ftplib",
    "functools",
    "gc",
    "getopt",
    "getpass",
    "gettext",
    "glob",
    "graphlib",
    "grp",
    "gzip",
    "hashlib",
    "heapq",
    "hmac",
    "html",
    "http",
    "idlelib",
    "imaplib",
    "imghdr",
    "imp",
    "importlib",
    "inspect",
    "io",
    "ipaddress",
    "itertools",
    "json",
    "keyword",
    "lib2to3",
    "linecache",
    "locale",
    "logging",
    "lzma",
    "mailbox",
    "mailcap",
    "marshal",
    "math",
    "mimetypes",
    "mmap",
    "modulefinder",
    "multiprocessing",
    "netrc",
    "nis",
    "nntplib",
    "numbers",
    "operator",
    "optparse",
    "os",
    "ossaudiodev",
    "pathlib",
    "pdb",
    "pickle",
    "pickletools",
    "pipes",
    "pkgutil",
    "platform",
    "plistlib",
    "poplib",
    "posix",
    "posixpath",
    "pprint",
    "profile",
    "pstats",
    "pty",
    "pwd",
    "py_compile",
    "pyclbr",
    "pydoc",
    "queue",
    "quopri",
    "random",
    "re",
    "readline",
    "reprlib",
    "resource",
    "rlcompleter",
    "runpy",
    "sched",
    "secrets",
    "select",
    "selectors",
    "shelve",
    "shlex",
    "shutil",
    "signal",
    "site",
    "smtpd",
    "smtplib",
    "sndhdr",
    "socket",
    "socketserver",
    "spwd",
    "sqlite3",
    "ssl",
    "stat",
    "statistics",
    "string",
    "stringprep",
    "struct",
    "subprocess",
    "sunau",
    "symtable",
    "sys",
    "sysconfig",
    "syslog",
    "tabnanny",
    "tarfile",
    "telnetlib",
    "tempfile",
    "termios",
    "test",
    "textwrap",
    "threading",
    "time",
    "timeit",
    "tkinter",
    "token",
    "tokenize",
    "trace",
    "traceback",
    "tracemalloc",
    "tty",
    "turtle",
    "turtledemo",
    "types",
    "typing",
    "unicodedata",
    "unittest",
    "urllib",
    "uu",
    "uuid",
    "venv",
    "warnings",
    "wave",
    "weakref",
    "webbrowser",
    "winreg",
    "winsound",
    "wsgiref",
    "xdrlib",
    "xml",
    "xmlrpc",
    "zipapp",
    "zipfile",
    "zipimport",
    "zlib",
    "zoneinfo",
    # Common submodules that might be imported directly
    "os.path",
    "urllib.parse",
    "urllib.request",
    "collections.abc",
    "typing_extensions",  # Not stdlib but often bundled
}


# Mapping from Python import names to PyPI package names.
# - If the import name matches the PyPI name, it doesn't need to be here
# - If the value is None, the package should be skipped (e.g., stdlib)
# - Add new mappings here as needed
PACKAGE_NAME_MAP: dict[str, str | None] = {
    # Common packages where import name differs from PyPI name
    "sklearn": "scikit-learn",
    "cv2": "opencv-python",
    "PIL": "pillow",
    "yaml": "pyyaml",
    "bs4": "beautifulsoup4",
    "skimage": "scikit-image",
    "dateutil": "python-dateutil",
    "dotenv": "python-dotenv",
    "jwt": "pyjwt",
    "magic": "python-magic",
    "serial": "pyserial",
    "usb": "pyusb",
    "git": "gitpython",
    "Bio": "biopython",
    "OpenSSL": "pyopenssl",
    "Crypto": "pycryptodome",
    "google.protobuf": "protobuf",
    "google.cloud": "google-cloud-core",
}


@dataclass
class ImportInfo:
    """Structured import information extracted from AST parsing.

    Attributes:
        module: The full module path (e.g., "sklearn.ensemble")
        names: List of imported names (e.g., ["RandomForestClassifier"])
        alias: The alias if used (e.g., "rf" from "import x as rf")
        is_from: True if this is a "from X import Y" statement
        line_number: Source line number for error reporting
    """

    module: str
    names: list[str]
    alias: str | None
    is_from: bool
    line_number: int

    @property
    def top_level_package(self) -> str:
        """Get the top-level package name (before the first dot)."""
        return self.module.split(".")[0]

    def get_pypi_package(self) -> str | None:
        """Get the PyPI package name for this import.

        Returns:
            The PyPI package name, or None if this is a stdlib module.
        """
        top_level = self.top_level_package

        # Check if it's a stdlib module
        if top_level in STDLIB_MODULES or self.module in STDLIB_MODULES:
            return None

        # Check for explicit mapping (try full module path first, then top-level)
        if self.module in PACKAGE_NAME_MAP:
            return PACKAGE_NAME_MAP[self.module]
        if top_level in PACKAGE_NAME_MAP:
            return PACKAGE_NAME_MAP[top_level]

        # Default: assume import name matches PyPI package name
        return top_level


def parse_imports_ast(code: str) -> list[ImportInfo]:
    """Parse all import statements from Python code using AST.

    This function properly handles all Python import forms:
    - import foo
    - import foo.bar
    - import foo as f
    - from foo import bar
    - from foo.bar import baz
    - from foo import bar, baz
    - from foo import (bar, baz)
    - from foo import bar as b

    Args:
        code: Python source code as a string

    Returns:
        List of ImportInfo objects representing each import statement

    Raises:
        SyntaxError: If the code cannot be parsed
    """
    imports: list[ImportInfo] = []

    try:
        tree = ast.parse(code)
    except SyntaxError:
        # If we can't parse the code, return empty list
        # The caller can decide how to handle this
        return imports

    for node in ast.walk(tree):
        if isinstance(node, ast.Import):
            # Handle: import foo, import foo.bar, import foo as f
            for alias in node.names:
                imports.append(
                    ImportInfo(
                        module=alias.name,
                        names=[alias.name.split(".")[-1]],
                        alias=alias.asname,
                        is_from=False,
                        line_number=node.lineno,
                    )
                )
        elif isinstance(node, ast.ImportFrom) and node.module is not None:
            # Handle: from foo import bar, from foo import bar as b
            # Skip relative imports like "from . import x" as they won't need pip install
            imports.append(
                ImportInfo(
                    module=node.module,
                    names=[a.name for a in node.names],
                    alias=node.names[0].asname if len(node.names) == 1 else None,
                    is_from=True,
                    line_number=node.lineno,
                )
            )

    return imports


def get_packages_to_install(code: str) -> set[str]:
    """Extract pip-installable package names from Python code.

    This function parses the import statements in the code and returns
    the set of PyPI package names that would need to be installed.

    Standard library modules are automatically filtered out.

    Args:
        code: Python source code as a string

    Returns:
        Set of PyPI package names to install
    """
    packages: set[str] = set()

    for imp in parse_imports_ast(code):
        pkg = imp.get_pypi_package()
        if pkg is not None:
            packages.add(pkg)

    return packages


def is_stdlib_module(module_name: str) -> bool:
    """Check if a module name is part of the Python standard library.

    Args:
        module_name: The module name to check (can be dotted like "os.path")

    Returns:
        True if the module is part of stdlib, False otherwise
    """
    top_level = module_name.split(".")[0]
    return top_level in STDLIB_MODULES or module_name in STDLIB_MODULES
