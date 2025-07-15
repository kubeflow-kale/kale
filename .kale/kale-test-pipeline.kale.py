import json
import kfp.dsl as kfp_dsl
from kfp.dsl import Input, Output, Dataset, HTML, Metrics, ClassificationMetrics, Artifact
from kubernetes import client as k8s_client # Still useful for specific k8s configurations

# NOTE: The 'backend.kale' imports and utilities (mlmdutils, marshal, jputils, kfputils)
# are assumed to be available within the component's container environment or
# replaced with KFP v2 native equivalents if their functionality is to be managed
# by KFP directly (e.g., KFP's built-in metadata tracking).
# For this conversion, I'm keeping them as-is within the component code blocks,
# assuming they are handled by the `packages_to_install` or are part of the base_image.


@kfp_dsl.component(
    base_image='python:3.10',
    packages_to_install=['dill', 'pandas', 'numpy', 'scikit-learn', 'joblib']
)
def sack(candies_param: int): # Changed CANDIES to candies_param for clarity as a component input
    # This block populates pipeline parameters. If these are also component args,
    # then they will be overwritten by values passed as args.
    _kale_pipeline_parameters_block = f'''
    CANDIES = {candies_param} # Use the passed parameter
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
    with open("/sack.html", "w") as f: # This file will be an output artifact if declared
        f.write(_kale_html_artifact)
    _kale_update_uimetadata('sack')

    _kale_mlmdutils.call("mark_execution_complete")

    # In KFP v2, if you want an HTML artifact, you need to return it
    # However, since sack() doesn't have an HTML output declared,
    # this part would need to be modified if you want to expose the HTML.
    # For now, it's just writing to a local file within the container.


@kfp_dsl.component(
    base_image='python:3.10',
    packages_to_install=['dill', 'pandas', 'numpy', 'scikit-learn', 'joblib']
)
def kid1(candies_in_sack: int, kid1_handful: Output[Dataset]):
    _kale_pipeline_parameters_block = f'''
    CANDIES = {candies_in_sack}
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
    kid1_val = get_handful(CANDIES)
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

    # To pass the value as a Dataset artifact, write it to the artifact's path
    # For a simple integer, you might save it to a text file within the Dataset.
    # In a real scenario, a Dataset would typically contain more structured data.
    import re
    match = re.search(r"I got (\d+) candies!", _kale_html_artifact)
    if match:
        handful_count = int(match.group(1))
        with open(kid1_handful.path, "w") as f:
            f.write(str(handful_count))
    else:
        # Handle case where the value isn't found in the output.
        # This is a simplification; in production, you'd parse more robustly.
        with open(kid1_handful.path, "w") as f:
            f.write("0") # Default to 0 if not found


@kfp_dsl.component(
    base_image='python:3.10',
    packages_to_install=['dill', 'pandas', 'numpy', 'scikit-learn', 'joblib']
)
def kid2(candies_in_sack: int, kid1_handful: Input[Dataset], kid2_handful: Output[Dataset]):
    # Read kid1's handful from the Dataset artifact
    with open(kid1_handful.path, "r") as f:
        kid1_val = int(f.read())

    _kale_pipeline_parameters_block = f'''
    CANDIES = {candies_in_sack}
    kid1 = {kid1_val}
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
    kid2_val = get_handful(CANDIES - kid1)
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

    import re
    match = re.search(r"I got (\d+) candies!", _kale_html_artifact)
    if match:
        handful_count = int(match.group(1))
        with open(kid2_handful.path, "w") as f:
            f.write(str(handful_count))
    else:
        with open(kid2_handful.path, "w") as f:
            f.write("0")


@kfp_dsl.component(
    base_image='python:3.10',
    packages_to_install=['dill', 'pandas', 'numpy', 'scikit-learn', 'joblib']
)
def kid3(candies_in_sack: int, kid1_handful: Input[Dataset], kid2_handful: Input[Dataset]):
    # Read kid1's and kid2's handfuls from Dataset artifacts
    with open(kid1_handful.path, "r") as f:
        kid1_val = int(f.read())
    with open(kid2_handful.path, "r") as f:
        kid2_val = int(f.read())

    _kale_pipeline_parameters_block = f'''
    CANDIES = {candies_in_sack}
    kid1 = {kid1_val}
    kid2 = {kid2_val}
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
    kid3_val = get_handful(CANDIES - kid1 - kid2)
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

    # kid3 doesn't have an output declared in the original KFP v1 code,
    # so no explicit output artifact is created here.
    # If you want kid3's handful as an output, add it as an Output[Dataset] parameter.


@kfp_dsl.pipeline(
    name='kale-pipeline',
    description='Share some candies between three lovely kids'
)
def auto_generated_pipeline(candies: int = 20):
    """Auto-generated pipeline function."""

    # In KFP v2, you call components directly like functions.
    # KFP automatically manages the passing of artifacts.

    # sack component doesn't have outputs, so it's a standalone step.
    sack_task = sack(candies_param=candies)

    # kid1 takes CANDIES as input and produces kid1_handful
    kid1_task = kid1(candies_in_sack=candies)
    # .after() is still available for explicit dependencies, but
    # data dependencies (e.g., kid2 needing kid1_handful) are inferred.
    kid1_task.after(sack_task)

    # kid2 takes CANDIES and kid1_handful as input and produces kid2_handful
    kid2_task = kid2(candies_in_sack=candies,
                     kid1_handful=kid1_task.outputs["kid1_handful"])
    kid2_task.after(kid1_task) # Explicit dependency for clarity

    # kid3 takes CANDIES, kid1_handful, and kid2_handful as input
    kid3_task = kid3(candies_in_sack=candies,
                     kid1_handful=kid1_task.outputs["kid1_handful"],
                     kid2_handful=kid2_task.outputs["kid2_handful"])
    kid3_task.after(kid2_task) # Explicit dependency for clarity

    # You can add Kubernetes configurations directly to the task
    sack_task.set_display_name("Put Candies in Sack")
    kid1_task.set_display_name("Kid 1 takes candies")
    kid2_task.set_display_name("Kid 2 takes candies")
    kid3_task.set_display_name("Kid 3 takes candies")

    # Example of setting resource requests (optional)
    # sack_task.add_node_selector_constraint("kubernetes.io/hostname", "your-node-name")
    # sack_task.set_memory_request("1Gi")
    # sack_task.set_cpu_limit("1")

    # Working directory and security context are generally managed by KFP runtime
    # or defined in the component definition (e.g., in the base image Dockerfile).
    # If explicit K8s client configuration is still needed, it might be applied
    # at a higher level (e.g., custom launcher or during compilation if supported).
    # For common settings, KFP v2 offers more direct methods.
    # Example:
    # sack_task.set_security_context(k8s_client.V1SecurityContext(run_as_user=0))


if __name__ == "__main__":
    from kfp import compiler
    from kfp import Client

    pipeline_filename = auto_generated_pipeline.__name__ + '.yaml' # KFP v2 typically uses YAML
    compiler.Compiler().compile(auto_generated_pipeline, pipeline_filename)

    # The client-side submission logic remains similar, but ensure you are using
    # a KFP SDK v2 compatible client.
    # client = Client()
    # experiment = client.create_experiment(name='Kale-Pipeline-Experiment-V2')
    #
    # # For KFP v2, you generally upload the compiled YAML directly
    # # or create a run from the compiled YAML file.
    # # The kfputils.upload_pipeline might be specific to Kale's interaction with KFP v1.
    # # A standard KFP v2 submission would look more like this:
    #
    # run_result = client.create_run_from_pipeline_func(
    #     auto_generated_pipeline,
    #     arguments={"candies": 25}, # Pass pipeline parameters here
    #     experiment_name='Kale-Pipeline-Experiment-V2',
    #     pipeline_root='gs://your-artifact-bucket/pipelines' # Specify an artifact store
    # )
    # print(f"Pipeline run submitted: {run_result.run_id}")

    print(f"Pipeline compiled to {pipeline_filename}")
    print("To run, upload this YAML to your KFP v2 instance or use kfp.Client().create_run_from_pipeline_func.")