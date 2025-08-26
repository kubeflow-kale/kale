import json
import kfp.dsl as kfp_dsl
from kfp.dsl import Input, Output, Dataset, HTML, Metrics, ClassificationMetrics, Artifact, Model


@kfp_dsl.component(
    base_image='python:3.10',
    packages_to_install=['kfp>=2.0.0', 'kubeflow-kale==1.0.0.dev13', 'numpy'],
    pip_index_urls=['https://test.pypi.org/simple', 'https://pypi.org/simple'],
)
def create_matrix_step(create_matrix_html_report: Output[HTML], rnd_matrix_artifact: Output[Dataset], d1: int = 5, d2: int = 6, booltest: bool = True, strtest: str = 'test'):
    _kale_pipeline_parameters_block = '''
        d1 = 5
        d2 = 6
        booltest = True
        strtest = test
    '''
    # from kale.common import mlmdutils as _kale_mlmdutils
    # _kale_mlmdutils.init_metadata()

    _kale_data_loading_block = '''
    # -----------------------DATA LOADING START--------------------------------
    from kale import marshal as _kale_marshal
    _kale_marshal.set_data_dir("/marshal")
    # -----------------------DATA LOADING END----------------------------------
    '''

    _kale_block1 = '''
    import numpy as np
    '''

    _kale_block2 = '''
    rnd_matrix = np.random.rand(d1, d2)
    '''

    _kale_block3 = '''
    from kale.common import kfputils as _kale_kfputils
    _kale_kfp_metrics = {
        "d1": d1,
        "d2": d2
    }
    _kale_kfputils.generate_mlpipeline_metrics(_kale_kfp_metrics)
    '''

    _kale_data_saving_block = '''
    # -----------------------DATA SAVING START---------------------------------
    from kale import marshal as _kale_marshal
    _kale_marshal.set_data_dir("/marshal")
    # Save rnd_matrix to output artifact
    _kale_marshal.save(rnd_matrix, "rnd_matrix_artifact")
    # -----------------------DATA SAVING END-----------------------------------
    '''

    # run the code blocks inside a jupyter kernel
    from kale.common.jputils import run_code as _kale_run_code
    from kale.common.kfputils import \
        update_uimetadata as _kale_update_uimetadata

    _kale_blocks = (
        _kale_pipeline_parameters_block,
        _kale_data_loading_block,

        _kale_block1,
        _kale_block2,
        _kale_block3,
        _kale_data_saving_block
    )

    _kale_html_artifact = _kale_run_code(_kale_blocks)
    with open(create_matrix_html_report.path, "w") as f:
        f.write(_kale_html_artifact)
    _kale_update_uimetadata('create_matrix_html_report')

    # _kale_mlmdutils.call("mark_execution_complete")


@kfp_dsl.component(
    base_image='python:3.10',
    packages_to_install=['kfp>=2.0.0', 'kubeflow-kale==1.0.0.dev13', 'numpy'],
    pip_index_urls=['https://test.pypi.org/simple', 'https://pypi.org/simple'],
)
def sum_matrix_step(sum_matrix_html_report: Output[HTML], rnd_matrix_artifact: Input[Dataset], d1: int = 5, d2: int = 6, booltest: bool = True, strtest: str = 'test'):
    _kale_pipeline_parameters_block = '''
        d1 = 5
        d2 = 6
        booltest = True
        strtest = test
    '''
    # from kale.common import mlmdutils as _kale_mlmdutils
    # _kale_mlmdutils.init_metadata()

    _kale_data_loading_block = '''
    # -----------------------DATA LOADING START--------------------------------
    from kale import marshal as _kale_marshal
    _kale_marshal.set_data_dir("/marshal")
    # Load rnd_matrix_artifact from input artifact
    rnd_matrix = _kale_marshal.load("rnd_matrix_artifact")
    # -----------------------DATA LOADING END----------------------------------
    '''

    _kale_block1 = '''
    import numpy as np
    '''

    _kale_block2 = '''
    sum_result = rnd_matrix.sum()
    '''

    _kale_block3 = '''
    from kale.common import kfputils as _kale_kfputils
    _kale_kfp_metrics = {
        "sum-result": sum_result
    }
    _kale_kfputils.generate_mlpipeline_metrics(_kale_kfp_metrics)
    '''

    _kale_data_saving_block = '''
    # -----------------------DATA SAVING START---------------------------------
    from kale import marshal as _kale_marshal
    _kale_marshal.set_data_dir("/marshal")
    # -----------------------DATA SAVING END-----------------------------------
    '''

    # run the code blocks inside a jupyter kernel
    from kale.common.jputils import run_code as _kale_run_code
    from kale.common.kfputils import \
        update_uimetadata as _kale_update_uimetadata

    _kale_blocks = (
        _kale_pipeline_parameters_block,
        _kale_data_loading_block,

        _kale_block1,
        _kale_block2,
        _kale_block3,
        _kale_data_saving_block
    )

    _kale_html_artifact = _kale_run_code(_kale_blocks)
    with open(sum_matrix_html_report.path, "w") as f:
        f.write(_kale_html_artifact)
    _kale_update_uimetadata('sum_matrix_html_report')

    # _kale_mlmdutils.call("mark_execution_complete")


@kfp_dsl.pipeline(
    name='hp-test',
    description=''
)
def auto_generated_pipeline(
    d1: int = 5,
    d2: int = 6,
    booltest: bool = True,
    strtest: str = "test"
):
    """Auto-generated pipeline function."""

    create_matrix_task = create_matrix_step(
        d1=d1,
        d2=d2,
        booltest=booltest,
        strtest=strtest
    )

    create_matrix_task.set_display_name("create-matrix-step")

    sum_matrix_task = sum_matrix_step(
        rnd_matrix_artifact=create_matrix_task.outputs["rnd_matrix_artifact"],
        d1=d1,
        d2=d2,
        booltest=booltest,
        strtest=strtest
    )

    sum_matrix_task.after(create_matrix_task)

    sum_matrix_task.set_display_name("sum-matrix-step")


if __name__ == "__main__":
    from kfp import compiler

    pipeline_filename = auto_generated_pipeline.__name__ + '.yaml'
    compiler.Compiler().compile(auto_generated_pipeline, pipeline_filename)

    print(f"Pipeline compiled to {pipeline_filename}")
    print("To run, upload this YAML to your KFP v2 instance or use kfp.Client().create_run_from_pipeline_func.")
