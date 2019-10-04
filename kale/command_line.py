import argparse
import traceback
import nbformat as nb

from argparse import RawTextHelpFormatter

from kale.core import Kale
from kale.notebook_gen import generate_notebooks_from_yml
from kale.api.app import app


def server():
    app.run()


ARGS_DESC = """
KALE: Kubeflow Automated pipeLines Engine\n
\n
KALE is tool to convert JupyterNotebooks into self-contained python scripts
that define execution graph using the KubeflowPipelines Python SDK.\n
\n
The pipeline's steps are defined by the cell(s) of the Notebook. To tell Kale
how to merge multiple cells together and how to link together the steps
of the generated pipeline, you need to tag the cells using a proper
tagging language. More info at github.com/kubeflow-kale/kale.\n
\n
CLI Arguments:\n
\n
Most of the arguments that you see in this help can be embedded in the
input notebook `metadata` section. If the same argument (e.g. `pipeline_name`)
is provided both in the Notebook metadata and from CLI, the CLI parameter
will take precedence.\n
"""

KALE_NOTEBOOK_METADATA_KEY = 'kubeflow_noteobok'
REQUIRED_ARGUMENTS = ['experiment_name', 'pipeline_name', 'docker_image']


def main():
    parser = argparse.ArgumentParser(description=ARGS_DESC, formatter_class=RawTextHelpFormatter)
    parser.add_argument('--nb', type=str, help='Path to source JupyterNotebook', required=True)
    parser.add_argument('--experiment_name', type=str, help='Name of the created experiment')
    parser.add_argument('--pipeline_name', type=str, help='Name of the deployed pipeline')
    parser.add_argument('--pipeline_description', type=str, help='Description of the deployed pipeline')
    parser.add_argument('--docker_image', type=str, help='Docker base image used to build the pipeline steps')
    # important to have default=None, otherwise it would default to False and would always override notebook_metadata
    parser.add_argument('--upload_pipeline', action='store_true', default=None)
    parser.add_argument('--run_pipeline', action='store_true', default=None)
    parser.add_argument('--kfp_dns', type=str,
                        help='DNS to KFP service. Provide address as <host>:<port>. `/pipeline` will be appended automatically')
    parser.add_argument('--jupyter_args', type=str, help='YAML file with Jupyter parameters as defined by Papermill')
    parser.add_argument('--debug', action='store_true')

    args = parser.parse_args()

    notebook_metadata = nb.read(args.nb, as_version=nb.NO_CONVERT).metadata.get(KALE_NOTEBOOK_METADATA_KEY, dict())
    # convert args to dict removing all None elements, and overwrite keys into notebook_metadata
    metadata_arguments = {**notebook_metadata, **{k: v for k, v in vars(args).items() if v is not None}}
    for r in REQUIRED_ARGUMENTS:
        if r not in metadata_arguments:
            raise ValueError(f"Required argument not found: {r}")

    # if jupyter_args is set, generate first a set of temporary notebooks
    # based on the input yml parameters (via Papermill)
    if 'jupyter_args' in metadata_arguments:
        generated_notebooks = generate_notebooks_from_yml(input_nb_path=args.nb,
                                                          yml_parameters_path=metadata_arguments['jupyter_args'])

        # Run KaleCore over each generated notebook
        for n, params in generated_notebooks:
            Kale(
                source_notebook_path=n,
                experiment_name=metadata_arguments['experiment_name'] + params,
                pipeline_name=metadata_arguments['pipeline_name'] + params,
                pipeline_descr=metadata_arguments['pipeline_description'] + " params" + params,
                docker_image=metadata_arguments['docker_image'],
                upload_pipeline=metadata_arguments['upload_pipeline'],
                run_pipeline=metadata_arguments['run_pipeline'],
                volumes=metadata_arguments['volumes']
            ).run()
    else:
        try:
            res = Kale(
                source_notebook_path=args.nb,
                experiment_name=metadata_arguments['experiment_name'],
                pipeline_name=metadata_arguments['pipeline_name'],
                pipeline_descr=metadata_arguments['pipeline_description'],
                docker_image=metadata_arguments['docker_image'],
                upload_pipeline=metadata_arguments['upload_pipeline'],
                run_pipeline=metadata_arguments['run_pipeline'],
                volumes=metadata_arguments['volumes']
            ).run()
            if res is not None:
                print(res)
        except Exception as e:
            if args.debug:
                traceback.print_exc()
            else:
                print(e)
                print("\nTo see full traceback run Kale with --debug flag")


if __name__ == "__main__":
    main()
