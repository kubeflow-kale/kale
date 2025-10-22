# SPDX-License-Identifier: Apache-2.0
# Copyright (c) 2019–2025 The Kale Contributors.

import os
import pytest

from unittest import mock

from kale import Compiler, NotebookProcessor

THIS_DIR = os.path.dirname(os.path.abspath(__file__))
EXAMPLES_DIR = os.path.join(THIS_DIR, "../../../../examples/")


@pytest.mark.parametrize("notebook_path,dsl_path", [
    (os.path.join(EXAMPLES_DIR, "serving/sklearn/iris.ipynb"),
     os.path.join(THIS_DIR, "../assets/kfp_dsl/", "iris.py")),
    (os.path.join(THIS_DIR,
                  "../assets/notebooks/pipeline_parameters_and_metrics.ipynb"),
     os.path.join(THIS_DIR, "../assets/kfp_dsl/",
                  "pipeline_parameters_and_metrics.py")),
])
@mock.patch("kale.compiler.KALE_VERSION", new="0+unknown")
@mock.patch("kale.common.utils.random_string")
def test_notebook_to_dsl(random_string, notebook_path, dsl_path):
    """Test code generation end to end from notebook to DSL."""
    random_string.return_value = "rnd"

    overrides = {"abs_working_dir": "/kale"}
    processor = NotebookProcessor(notebook_path, overrides)
    pipeline = processor.run()
    imports_and_functions = processor.get_imports_and_functions()

    dsl_script_path = Compiler(pipeline, imports_and_functions).compile()

    expected_result = open(dsl_path).read()
    result = open(dsl_script_path).read()
    assert result == expected_result
