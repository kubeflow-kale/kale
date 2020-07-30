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

from kale.codegen import generate_code

THIS_DIR = os.path.dirname(os.path.abspath(__file__))


@pytest.mark.parametrize("volumes,target", [
    ([], ({})),
    # ---
    ([{
        'annotations': [{'key': 'a1', 'value': 'v1'}],
        'size': 5,
        'type': 'pv',
        'mount_point': '/'
    }], ({})),
    # ---
    ([{
        'name': 'test_volume',
        'type': 'pvc',
        'mount_point': '/'
    }], {'vol_': ('str', 'test_volume')}),
    # ---
    ([{
        'name': 'test_volume',
        'type': 'pvc',
        'mount_point': '/root'
    }], {'vol_root': ('str', 'test_volume')}),
    # ---
    ([{
        'name': 'test_volume',
        'type': 'pvc',
        'mount_point': '/root/user/'
    }], {'vol_root_user': ('str', 'test_volume')}),
    # ---
    ([{
        'name': 'test_volume',
        'type': 'new_pvc',
        'mount_point': '/',
        'annotations': {}
    }], {}),
    # ---
    ([{
        'name': 'test-volume',
        'type': 'new_pvc',
        'mount_point': '/root',
        'annotations': {'rok/origin': 'url'}
    }], {'rok_test_volume_url': ('str', 'url')}),
])
def test_get_volumes_parameters(volumes, target):
    """Tests that volumes are correctly converted from list into dict."""
    assert target == generate_code.get_volume_parameters(volumes)


@pytest.mark.parametrize("volumes", [
    ([{
        'annotations': [{'key': 'a1', 'value': 'v1'}],
        'size': 5,
        'type': 'unknown'
    }])
])
def test_get_volumes_parameters_exc(volumes):
    """Tests that volumes are correctly converted from list into dict."""
    with pytest.raises(ValueError, match="Unknown volume type: unknown"):
        generate_code.get_volume_parameters(volumes)


@pytest.mark.parametrize("args,target", [
    ((None, None, None),
     {'marshal_volume': True, 'marshal_path': '/marshal'}),
    # ---
    (('/users', [{'mount_point': '/root'}], None),
     {'marshal_volume': True, 'marshal_path': '/marshal'}),
    # ---
    (('/user/kale/test', [{'mount_point': '/user/kale'}],
      '/user/kale/test/mynb.ipynb'),
     {'marshal_volume': False,
      'marshal_path': '/user/kale/test/.mynb.ipynb.kale.marshal.dir'}),
    # ---
    (('/user/kale/', [{'mount_point': '/user/kale/test'}], None),
     {'marshal_volume': True, 'marshal_path': '/marshal'}),
])
def test_get_marshal_data(args, target):
    """Test that marshal volume path is correctly computed."""
    assert target == generate_code.get_marshal_data(*args)


def _test_args_dict(f1, f2, f3):
    return {
        'parameters_names': f1,
        'parameters_types': f2,
        'parameters_values': f3
    }


@pytest.mark.parametrize("pipeline_parameters,target", [
    ({},
     _test_args_dict([], [], [])),
    # ---
    ({'param1': ('str', 'v1')},
     _test_args_dict(["param1"], ["str"], ["v1"])),
    # ---
    ({'param1': ('int', 1)},
     _test_args_dict(["param1"], ["int"], [1])),
    # ---
    ({'p1': ('int', 1), 'p2': ('str', 'v'), 'p3': ('bool', True)},
     _test_args_dict(["p1", "p2", "p3"], ["int", "str", "bool"],
                     [1, "v", True])),
])
def test_get_args(pipeline_parameters, target):
    """Test that argument string are properly formatted."""
    assert target == generate_code.get_args(pipeline_parameters)


@pytest.fixture(scope='module')
def template():
    """Reusable function template."""
    tmpl_dir = os.path.join(THIS_DIR, '../../templates')
    env = generate_code._initialize_templating_env(tmpl_dir)
    return env.get_template('function_template.jinja2')


@pytest.mark.parametrize('step_name,source,ins,outs,nb_path,metadata,target', [
    ('test', [], '', '', '', {}, 'func01.out.py'),
    # ---
    ('test', [], '', '', '', {'parameters_names': ['arg1', 'arg2', 'arg3'],
                              'parameters_types': ['int', 'str', 'str']},
     'func02.out.py'),
    # ---
    ('test', [], '', '', '/path/to/nb',
     {'marshal_path': '/path', 'autosnapshot': True, 'pipeline_name': 'T'},
     'func03.out.py'),
    # ---
    ('test', [], ['v1'], '', '', {}, 'func04.out.py'),
    # ---
    ('test', ['v1 = "Hello"', 'print(v1)'], '', ['v1'], '', {},
     'func05.out.py'),
    # ---
    ('test', ['print("hello")'], '', '', '', {}, 'func06.out.py'),
    # ---
    ('final_auto_snapshot', [], '', '', '/path/to/nb',
     {'autosnapshot': True, 'pipeline_name': 'T'}, 'func07.out.py')
])
def test_generate_function(template, step_name, source, ins, outs, nb_path,
                           metadata, target):
    """Test python code is generated correctly."""
    component_data = {'source': source, 'ins': ins, 'outs': outs}
    res = generate_code.generate_lightweight_component(template,
                                                       step_name,
                                                       component_data,
                                                       nb_path,
                                                       metadata)
    target = open(os.path.join(THIS_DIR, "../assets/functions", target)).read()
    assert target.strip() == res.strip()
