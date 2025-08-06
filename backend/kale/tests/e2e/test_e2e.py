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

import os
import pytest
import argparse

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


_prfx = "kale.sdk.api."


@pytest.mark.skip(reason="This test is currently not working.")
@pytest.mark.parametrize("py_path,dsl_path", [
    (os.path.join(THIS_DIR, "../assets/sdk/", "simple_data_passing.py"),
     os.path.join(THIS_DIR, "../assets/kfp_dsl/", "simple_data_passing.py")),
    (os.path.join(THIS_DIR, "../assets/sdk/", "pipeline_parameters.py"),
     os.path.join(THIS_DIR, "../assets/kfp_dsl/", "pipeline_parameters.py")),
])
@mock.patch("kale.pipeline.utils.abs_working_dir")
@mock.patch(_prfx + "utils.main_source_lives_in_cwd")
@mock.patch(_prfx + "_parse_cli_args")
@mock.patch("kale.common.utils.random_string")
def test_python_to_dsl(random_string,
                       _parse_cli_args,
                       main_source_lives_in_cwd,
                       abs_working_dir,
                       py_path,
                       dsl_path):
    """Test code generation enf to enf from python sdk to DSL."""
    random_string.return_value = "test"
    _parse_cli_args.return_value = argparse.Namespace(kfp=True, dry_run=True)
    main_source_lives_in_cwd.return_value = True
    abs_working_dir.return_value = "/test"

    import importlib.util
    spec = importlib.util.spec_from_file_location("test_kfp", py_path)
    foo = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(foo)
    script_path = foo.mypipeline()

    expected_result = open(dsl_path).read()
    result = open(script_path).read()
    os.remove(script_path)
    assert result == expected_result
