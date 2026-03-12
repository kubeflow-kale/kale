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

"""Unit tests for the imports module."""

import pytest

from kale.common.imports import (
    PACKAGE_NAME_MAP,
    STDLIB_MODULES,
    ImportInfo,
    get_packages_to_install,
    is_stdlib_module,
    parse_imports_ast,
)


class TestStdlibModules:
    """Tests for STDLIB_MODULES set."""

    @pytest.mark.parametrize(
        "module",
        [
            "os",
            "sys",
            "re",
            "json",
            "random",
            "collections",
            "typing",
            "pathlib",
            "datetime",
            "functools",
            "itertools",
            "math",
            "subprocess",
            "threading",
            "multiprocessing",
        ],
    )
    def test_common_stdlib_modules_included(self, module):
        """Verify common stdlib modules are in the set."""
        assert module in STDLIB_MODULES

    @pytest.mark.parametrize(
        "module",
        [
            "numpy",
            "pandas",
            "sklearn",
            "tensorflow",
            "torch",
            "requests",
            "flask",
            "django",
            "pytest",
        ],
    )
    def test_third_party_modules_not_included(self, module):
        """Verify third-party modules are not in stdlib set."""
        assert module not in STDLIB_MODULES


class TestPackageNameMap:
    """Tests for PACKAGE_NAME_MAP dictionary."""

    @pytest.mark.parametrize(
        "import_name,pypi_name",
        [
            ("sklearn", "scikit-learn"),
            ("cv2", "opencv-python"),
            ("PIL", "pillow"),
            ("yaml", "pyyaml"),
            ("bs4", "beautifulsoup4"),
            ("skimage", "scikit-image"),
        ],
    )
    def test_common_mappings_exist(self, import_name, pypi_name):
        """Verify common import-to-PyPI mappings are correct."""
        assert PACKAGE_NAME_MAP.get(import_name) == pypi_name


class TestImportInfo:
    """Tests for ImportInfo dataclass."""

    def test_top_level_package_simple(self):
        """Test top_level_package with simple module."""
        info = ImportInfo(module="numpy", names=["array"], alias=None, is_from=True, line_number=1)
        assert info.top_level_package == "numpy"

    def test_top_level_package_nested(self):
        """Test top_level_package with nested module."""
        info = ImportInfo(
            module="sklearn.ensemble",
            names=["RandomForestClassifier"],
            alias=None,
            is_from=True,
            line_number=1,
        )
        assert info.top_level_package == "sklearn"

    def test_get_pypi_package_direct_mapping(self):
        """Test get_pypi_package with direct mapping."""
        info = ImportInfo(
            module="sklearn", names=["sklearn"], alias=None, is_from=False, line_number=1
        )
        assert info.get_pypi_package() == "scikit-learn"

    def test_get_pypi_package_nested_mapping(self):
        """Test get_pypi_package with nested module mapping."""
        info = ImportInfo(
            module="sklearn.ensemble",
            names=["RandomForestClassifier"],
            alias=None,
            is_from=True,
            line_number=1,
        )
        assert info.get_pypi_package() == "scikit-learn"

    def test_get_pypi_package_stdlib_returns_none(self):
        """Test get_pypi_package returns None for stdlib."""
        info = ImportInfo(module="os", names=["path"], alias=None, is_from=True, line_number=1)
        assert info.get_pypi_package() is None

    def test_get_pypi_package_no_mapping(self):
        """Test get_pypi_package with no mapping (uses import name)."""
        info = ImportInfo(module="numpy", names=["array"], alias=None, is_from=True, line_number=1)
        assert info.get_pypi_package() == "numpy"


class TestParseImportsAst:
    """Tests for parse_imports_ast function."""

    def test_empty_code(self):
        """Test parsing empty code."""
        result = parse_imports_ast("")
        assert result == []

    def test_simple_import(self):
        """Test parsing simple import statement."""
        code = "import numpy"
        result = parse_imports_ast(code)
        assert len(result) == 1
        assert result[0].module == "numpy"
        assert result[0].is_from is False

    def test_import_with_alias(self):
        """Test parsing import with alias."""
        code = "import numpy as np"
        result = parse_imports_ast(code)
        assert len(result) == 1
        assert result[0].module == "numpy"
        assert result[0].alias == "np"
        assert result[0].is_from is False

    def test_from_import(self):
        """Test parsing from import statement."""
        code = "from sklearn import ensemble"
        result = parse_imports_ast(code)
        assert len(result) == 1
        assert result[0].module == "sklearn"
        assert result[0].names == ["ensemble"]
        assert result[0].is_from is True

    def test_from_import_multiple_names(self):
        """Test parsing from import with multiple names."""
        code = "from os import path, getcwd, listdir"
        result = parse_imports_ast(code)
        assert len(result) == 1
        assert result[0].module == "os"
        assert sorted(result[0].names) == sorted(["path", "getcwd", "listdir"])
        assert result[0].is_from is True

    def test_from_import_nested_module(self):
        """Test parsing from import with nested module."""
        code = "from sklearn.ensemble import RandomForestClassifier"
        result = parse_imports_ast(code)
        assert len(result) == 1
        assert result[0].module == "sklearn.ensemble"
        assert result[0].names == ["RandomForestClassifier"]
        assert result[0].is_from is True

    def test_multiple_imports(self):
        """Test parsing multiple import statements."""
        code = """
import os
import numpy as np
from pandas import DataFrame, Series
from sklearn.ensemble import RandomForestClassifier
"""
        result = parse_imports_ast(code)
        assert len(result) == 4

        modules = [r.module for r in result]
        assert "os" in modules
        assert "numpy" in modules
        assert "pandas" in modules
        assert "sklearn.ensemble" in modules

    def test_import_with_parentheses(self):
        """Test parsing from import with parentheses."""
        code = """from collections import (
    OrderedDict,
    defaultdict,
    Counter
)"""
        result = parse_imports_ast(code)
        assert len(result) == 1
        assert result[0].module == "collections"
        assert sorted(result[0].names) == sorted(["OrderedDict", "defaultdict", "Counter"])

    def test_dotted_import(self):
        """Test parsing dotted import."""
        code = "import os.path"
        result = parse_imports_ast(code)
        assert len(result) == 1
        assert result[0].module == "os.path"
        assert result[0].is_from is False

    def test_invalid_code_returns_empty(self):
        """Test that invalid code returns empty list."""
        code = "def foo(\n    pass"  # Invalid syntax
        result = parse_imports_ast(code)
        assert result == []

    def test_code_with_imports_and_other_statements(self):
        """Test parsing code with mixed statements."""
        code = """
import numpy as np

x = 5
y = np.array([1, 2, 3])

from pandas import DataFrame

df = DataFrame({'a': [1, 2, 3]})
"""
        result = parse_imports_ast(code)
        assert len(result) == 2
        modules = [r.module for r in result]
        assert "numpy" in modules
        assert "pandas" in modules

    def test_line_numbers(self):
        """Test that line numbers are captured."""
        code = """import os
import sys
from json import loads"""
        result = parse_imports_ast(code)
        assert result[0].line_number == 1
        assert result[1].line_number == 2
        assert result[2].line_number == 3


class TestGetPackagesToInstall:
    """Tests for get_packages_to_install function."""

    def test_empty_code(self):
        """Test with empty code."""
        result = get_packages_to_install("")
        assert result == set()

    def test_stdlib_only(self):
        """Test code with only stdlib imports."""
        code = """
import os
import sys
import json
from collections import defaultdict
"""
        result = get_packages_to_install(code)
        assert result == set()

    def test_single_package(self):
        """Test code with single third-party package."""
        code = "import numpy"
        result = get_packages_to_install(code)
        assert result == {"numpy"}

    def test_multiple_packages(self):
        """Test code with multiple third-party packages."""
        code = """
import numpy
import pandas
from sklearn.ensemble import RandomForestClassifier
"""
        result = get_packages_to_install(code)
        assert result == {"numpy", "pandas", "scikit-learn"}

    def test_mixed_stdlib_and_third_party(self):
        """Test code with mixed stdlib and third-party imports."""
        code = """
import os
import sys
import numpy as np
from json import loads
from pandas import DataFrame
"""
        result = get_packages_to_install(code)
        assert result == {"numpy", "pandas"}

    def test_package_name_mapping(self):
        """Test that package name mapping is applied."""
        code = """
import sklearn
from cv2 import imread
import PIL
import yaml
"""
        result = get_packages_to_install(code)
        expected = {"scikit-learn", "opencv-python", "pillow", "pyyaml"}
        assert result == expected

    def test_deduplication(self):
        """Test that duplicate packages are deduplicated."""
        code = """
import numpy
import numpy as np
from numpy import array
from numpy.random import rand
"""
        result = get_packages_to_install(code)
        assert result == {"numpy"}

    def test_real_world_data_science_imports(self):
        """Test with realistic data science imports."""
        code = """
import os
import sys
import json
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
import matplotlib.pyplot as plt
import seaborn as sns
"""
        result = get_packages_to_install(code)
        expected = {"numpy", "pandas", "scikit-learn", "matplotlib", "seaborn"}
        assert result == expected


class TestIsStdlibModule:
    """Tests for is_stdlib_module function."""

    @pytest.mark.parametrize(
        "module",
        [
            "os",
            "sys",
            "re",
            "json",
            "random",
            "os.path",
            "collections.abc",
            "urllib.parse",
        ],
    )
    def test_stdlib_modules(self, module):
        """Test that stdlib modules are correctly identified."""
        assert is_stdlib_module(module) is True

    @pytest.mark.parametrize(
        "module",
        [
            "numpy",
            "pandas",
            "sklearn",
            "tensorflow",
            "numpy.random",
            "pandas.core",
        ],
    )
    def test_non_stdlib_modules(self, module):
        """Test that non-stdlib modules are correctly identified."""
        assert is_stdlib_module(module) is False
