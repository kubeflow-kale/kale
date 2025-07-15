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

from backend.kale import Pipeline, Step, Compiler, NotebookConfig


THIS_DIR = os.path.dirname(os.path.abspath(__file__))

DUMMY_NB_CONFIG = {
    "notebook_path": "/path/to/nb",
    "pipeline_name": "test",
    "experiment_name": "test"
}


@mock.patch.object(NotebookConfig, "_randomize_pipeline_name")
@pytest.mark.parametrize('step_name,source,ins,outs,metadata,target', [
    ('test', [], {}, {}, dict(), 'func01.out.py'),
    # ---
    ('test', [], {}, {},
     {'marshal_path': '/path', 'autosnapshot': True}, 'func03.out.py'),
    # ---
    ('test', [], {'v1'}, {}, dict(), 'func04.out.py'),
    # ---
    ('test', ['v1 = "Hello"', 'print(v1)'], {}, {'v1'}, dict(),
     'func05.out.py'),
    # ---
    ('test', ['print("hello")'], {}, {}, dict(), 'func06.out.py'),
    # ---
    ('final_auto_snapshot', [], {}, {},
     {'autosnapshot': True}, 'func07.out.py')
])
def test_generate_function(_nb_config_mock, notebook_processor, step_name,
                           source, ins, outs, metadata, target):
    """Test that python code is generated correctly."""
    pipeline = Pipeline(NotebookConfig(**{**DUMMY_NB_CONFIG, **metadata}))
    pipeline.processor = notebook_processor
    step = Step(name=step_name, source=source, ins=ins, outs=outs)
    compiler = Compiler(pipeline)
    res = compiler.generate_lightweight_component(step)
    target = open(os.path.join(THIS_DIR, "../assets/functions", target)).read()
    assert res.strip() == target.strip()
