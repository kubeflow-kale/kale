import json
import kfp.dsl as kfp_dsl
from kfp.dsl import Input, Output, Dataset, HTML, Metrics, ClassificationMetrics, Artifact
from kubernetes import client as k8s_client


@kfp_dsl.component(
    base_image='python:3.10',
    packages_to_install=['dill', 'pandas', 'numpy', 'scikit-learn', 'joblib']
)
def sack(candies_param: int = 20):
    # This block populates pipeline parameters. If these are also component args,
    # then they will be overwritten by values passed as args.
    _kale_pipeline_parameters_block = '''
    CANDIES = candies_param
    '''

    from backend.kale.common import mlmdutils as _kale_mlmdutils
    _kale_mlmdutils.init_metadata()

    _kale_data_loading_block = '''
    # -----------------------DATA LOADING START--------------------------------
    from backend.kale import marshal as _kale_marshal
    _kale_marshal.set_data_dir("/marshal")
    # -----------------------DATA LOADING END----------------------------------
    '''

    _kale_block1 = '''
    import random
    '''

    _kale_block2 = '''
    def get_handful(left):
    if left == 0:
        print("There are no candies left! I want to cry :(")
        return 0
    c = random.randint(1, left)
    print("I got %s candies!" % c)
    return c
    '''

    _kale_block3 = '''
    print("Let's put in a bag %s candies and have three kids get a handful of them each" % CANDIES)
    '''

    _kale_data_saving_block = '''
    # -----------------------DATA SAVING START---------------------------------
    from backend.kale import marshal as _kale_marshal
    _kale_marshal.set_data_dir("/marshal")
    # -----------------------DATA SAVING END-----------------------------------
    '''

    # run the code blocks inside a jupyter kernel
    from backend.kale.common.jputils import run_code as _kale_run_code
    from backend.kale.common.kfputils import \
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
    with open("/sack.html", "w") as f:
        f.write(_kale_html_artifact)
    _kale_update_uimetadata('sack')

    _kale_mlmdutils.call("mark_execution_complete")


@kfp_dsl.component(
    base_image='python:3.10',
    packages_to_install=['dill', 'pandas', 'numpy', 'scikit-learn', 'joblib']
)
def kid1(kid1_output: Output[Dataset], candies_param: int = 20):
    # This block populates pipeline parameters. If these are also component args,
    # then they will be overwritten by values passed as args.
    _kale_pipeline_parameters_block = '''
    CANDIES = candies_param
    '''

    from backend.kale.common import mlmdutils as _kale_mlmdutils
    _kale_mlmdutils.init_metadata()

    _kale_data_loading_block = '''
    # -----------------------DATA LOADING START--------------------------------
    from backend.kale import marshal as _kale_marshal
    _kale_marshal.set_data_dir("/marshal")
    # -----------------------DATA LOADING END----------------------------------
    '''

    _kale_block1 = '''
    import random
    '''

    _kale_block2 = '''
    def get_handful(left):
    if left == 0:
        print("There are no candies left! I want to cry :(")
        return 0
    c = random.randint(1, left)
    print("I got %s candies!" % c)
    return c
    '''

    _kale_block3 = '''
    # kid1 gets a handful, without looking in the bad!
kid1 = get_handful(CANDIES)
    '''

    _kale_data_saving_block = '''
    # -----------------------DATA SAVING START---------------------------------
    from backend.kale import marshal as _kale_marshal
    _kale_marshal.set_data_dir("/marshal")
    # -----------------------DATA SAVING END-----------------------------------
    '''

    # run the code blocks inside a jupyter kernel
    from backend.kale.common.jputils import run_code as _kale_run_code
    from backend.kale.common.kfputils import \
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
    with open("/kid1.html", "w") as f:
        f.write(_kale_html_artifact)
    _kale_update_uimetadata('kid1')

    _kale_mlmdutils.call("mark_execution_complete")
    # Handle output artifacts by parsing execution results
    # Extract kid1 value from execution output
    import re
    match = re.search(r"I got (\d+) candies!", _kale_html_artifact)
    if match:
        kid1_count = int(match.group(1))
        with open(kid1_output.path, "w") as f:
            f.write(str(kid1_count))
    else:
        with open(kid1_output.path, "w") as f:
            f.write("0")  # Default value if not found


@kfp_dsl.component(
    base_image='python:3.10',
    packages_to_install=['dill', 'pandas', 'numpy', 'scikit-learn', 'joblib']
)
def kid2(kid1_input: Input[Dataset], kid2_output: Output[Dataset], kid1_output: Output[Dataset], candies_param: int = 20):
    # This block populates pipeline parameters. If these are also component args,
    # then they will be overwritten by values passed as args.
    _kale_pipeline_parameters_block = '''
    CANDIES = candies_param
    '''

    from backend.kale.common import mlmdutils as _kale_mlmdutils
    _kale_mlmdutils.init_metadata()

    _kale_data_loading_block = '''
    # -----------------------DATA LOADING START--------------------------------
    from backend.kale import marshal as _kale_marshal
    _kale_marshal.set_data_dir("/marshal")
    # Read kid1_input from the Dataset artifact
    with open(kid1_input.path, "r") as f:
        kid1_val = int(f.read())
    # -----------------------DATA LOADING END----------------------------------
    '''

    _kale_block1 = '''
    import random
    '''

    _kale_block2 = '''
    def get_handful(left):
    if left == 0:
        print("There are no candies left! I want to cry :(")
        return 0
    c = random.randint(1, left)
    print("I got %s candies!" % c)
    return c
    '''

    _kale_block3 = '''
    kid2 = get_handful(CANDIES - kid1)
    '''

    _kale_data_saving_block = '''
    # -----------------------DATA SAVING START---------------------------------
    from backend.kale import marshal as _kale_marshal
    _kale_marshal.set_data_dir("/marshal")
    # -----------------------DATA SAVING END-----------------------------------
    '''

    # run the code blocks inside a jupyter kernel
    from backend.kale.common.jputils import run_code as _kale_run_code
    from backend.kale.common.kfputils import \
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
    with open("/kid2.html", "w") as f:
        f.write(_kale_html_artifact)
    _kale_update_uimetadata('kid2')

    _kale_mlmdutils.call("mark_execution_complete")
    # Handle output artifacts by parsing execution results
    # Extract kid2 value from execution output
    import re
    match = re.search(r"I got (\d+) candies!", _kale_html_artifact)
    if match:
        kid2_count = int(match.group(1))
        with open(kid2_output.path, "w") as f:
            f.write(str(kid2_count))
    else:
        with open(kid2_output.path, "w") as f:
            f.write("0")  # Default value if not found
    # Extract kid1 value from execution output
    import re
    match = re.search(r"I got (\d+) candies!", _kale_html_artifact)
    if match:
        kid1_count = int(match.group(1))
        with open(kid1_output.path, "w") as f:
            f.write(str(kid1_count))
    else:
        with open(kid1_output.path, "w") as f:
            f.write("0")  # Default value if not found


@kfp_dsl.component(
    base_image='python:3.10',
    packages_to_install=['dill', 'pandas', 'numpy', 'scikit-learn', 'joblib']
)
def kid3(kid2_input: Input[Dataset], kid1_input: Input[Dataset], candies_param: int = 20):
    # This block populates pipeline parameters. If these are also component args,
    # then they will be overwritten by values passed as args.
    _kale_pipeline_parameters_block = '''
    CANDIES = candies_param
    '''

    from backend.kale.common import mlmdutils as _kale_mlmdutils
    _kale_mlmdutils.init_metadata()

    _kale_data_loading_block = '''
    # -----------------------DATA LOADING START--------------------------------
    from backend.kale import marshal as _kale_marshal
    _kale_marshal.set_data_dir("/marshal")
    # Read kid2_input from the Dataset artifact
    with open(kid2_input.path, "r") as f:
        kid2_val = int(f.read())
    # Read kid1_input from the Dataset artifact
    with open(kid1_input.path, "r") as f:
        kid1_val = int(f.read())
    # -----------------------DATA LOADING END----------------------------------
    '''

    _kale_block1 = '''
    import random
    '''

    _kale_block2 = '''
    def get_handful(left):
    if left == 0:
        print("There are no candies left! I want to cry :(")
        return 0
    c = random.randint(1, left)
    print("I got %s candies!" % c)
    return c
    '''

    _kale_block3 = '''
    kid3 = get_handful(CANDIES - kid1 - kid2)
    '''

    _kale_data_saving_block = '''
    # -----------------------DATA SAVING START---------------------------------
    from backend.kale import marshal as _kale_marshal
    _kale_marshal.set_data_dir("/marshal")
    # -----------------------DATA SAVING END-----------------------------------
    '''

    # run the code blocks inside a jupyter kernel
    from backend.kale.common.jputils import run_code as _kale_run_code
    from backend.kale.common.kfputils import \
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
    with open("/kid3.html", "w") as f:
        f.write(_kale_html_artifact)
    _kale_update_uimetadata('kid3')

    _kale_mlmdutils.call("mark_execution_complete")


@kfp_dsl.pipeline(
    name='kale-pipeline',
    description='Share some candies between three lovely kids'
)
def auto_generated_pipeline(
):
    """Auto-generated pipeline function."""

    # sack component
    sack_task = sack(
    )

    # Set display name
    sack_task.set_display_name("Sack")

    # kid1 component
    kid1_task = kid1(
    )

    # Set dependencies
    kid1_task.after(sack_task)

    # Set display name
    kid1_task.set_display_name("Kid1")

    # kid2 component
    kid2_task = kid2(
        kid1_input=kid1_task.outputs["kid1_output"]
    )

    # Set dependencies
    kid2_task.after(kid1_task)

    # Set display name
    kid2_task.set_display_name("Kid2")

    # kid3 component
    kid3_task = kid3(
        kid2_input=kid2_task.outputs["kid2_output"],
        kid1_input=kid1_task.outputs["kid1_output"]
    )

    # Set dependencies
    kid3_task.after(kid2_task)
    kid3_task.after(kid1_task)

    # Set display name
    kid3_task.set_display_name("Kid3")


if __name__ == "__main__":
    from kfp import compiler
    from kfp import Client

    pipeline_filename = auto_generated_pipeline.__name__ + '.yaml'
    compiler.Compiler().compile(auto_generated_pipeline, pipeline_filename)

    print(f"Pipeline compiled to {pipeline_filename}")
    print("To run, upload this YAML to your KFP v2 instance or use kfp.Client().create_run_from_pipeline_func.")
