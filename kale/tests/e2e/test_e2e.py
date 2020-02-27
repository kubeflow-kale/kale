import os

from unittest import mock

from kale.core import Kale
from urllib.request import urlretrieve

THIS_DIR = os.path.dirname(os.path.abspath(__file__))
EX_REPO = "https://raw.githubusercontent.com/kubeflow-kale/examples/master/"


@mock.patch('kale.core.utils.get_abs_working_dir')
@mock.patch('kale.utils.metadata_utils.random_string')
def test_pipeline_generation_from_gtihub(random_string, abs_working_dir):
    """Test code generation end to end from notebook to DSL."""
    abs_working_dir.return_value = '/kale'
    random_string.return_value = 'rnd'
    notebook_url = EX_REPO + "titanic-ml-dataset/titanic_dataset_ml.ipynb"
    # download notebook to tmp dir
    notebook_path, response = urlretrieve(notebook_url)

    kale = Kale(source_notebook_path=notebook_path)
    pipeline_graph, pipeline_parameters = kale.notebook_to_graph()
    script_path = kale.generate_kfp_executable(pipeline_graph,
                                               pipeline_parameters,
                                               save_to_tmp=True)
    # TODO: Need to suppress log generation when running tests
    os.remove(os.path.join(os.getcwd(), 'kale.log'))

    target_asset = os.path.join(THIS_DIR,
                                '../assets/kfp_dsl/',
                                'titanic.py')
    expected_result = open(target_asset).read()
    result = open(script_path).read()
    assert result == expected_result


@mock.patch('kale.core.utils.get_abs_working_dir')
@mock.patch('kale.utils.metadata_utils.random_string')
def test_pipeline_generation_from_local(random_string, abs_working_dir):
    """Test code generation end to end from notebook to DSL."""
    abs_working_dir.return_value = '/kale'
    random_string.return_value = 'rnd'
    notebook_path = "../assets/notebooks/pipeline_parameters_and_metrics.ipynb"
    notebook_path = os.path.join(THIS_DIR, notebook_path)

    kale = Kale(source_notebook_path=notebook_path)
    pipeline_graph, pipeline_parameters = kale.notebook_to_graph()
    script_path = kale.generate_kfp_executable(pipeline_graph,
                                               pipeline_parameters,
                                               save_to_tmp=True)
    # TODO: Need to suppress log generation when running tests
    os.remove(os.path.join(os.getcwd(), 'kale.log'))

    target_asset = os.path.join(THIS_DIR,
                                '../assets/kfp_dsl/',
                                'pipeline_parameters_and_metrics.py')
    expected_result = open(target_asset).read()
    result = open(script_path).read()
    assert result == expected_result
