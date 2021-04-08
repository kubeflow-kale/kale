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

from unittest import mock

from kale import Compiler, NotebookProcessor

THIS_DIR = os.path.dirname(os.path.abspath(__file__))
EXAMPLES_DIR = os.path.join(THIS_DIR, "../../../../examples/")


@pytest.mark.parametrize("notebook_path,dsl_path", [
    (os.path.join(EXAMPLES_DIR, "titanic-ml-dataset/titanic_dataset_ml.ipynb"),
     os.path.join(THIS_DIR, "../assets/kfp_dsl/", "titanic.py")),
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
    pipeline = NotebookProcessor(notebook_path, overrides).run()
    dsl_script_path = Compiler(pipeline).compile()

    expected_result = open(dsl_path).read()
    result = open(dsl_script_path).read()
    assert result == expected_result
