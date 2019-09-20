import argparse
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
REQUIRED_ARGUMENTS = ['experiment_name', 'run_name', 'pipeline_name', 'docker_image']


def main():
    parser = argparse.ArgumentParser(description=ARGS_DESC, formatter_class=RawTextHelpFormatter)
    parser.add_argument('--nb', type=str, help='Path to source JupyterNotebook', required=True)
    parser.add_argument('--experiment_name', type=str, help='Name of the created experiment')
    parser.add_argument('--run_name', type=str, help='Name of the new run')
    parser.add_argument('--pipeline_name', type=str, help='Name of the deployed pipeline')
    parser.add_argument('--pipeline_description', type=str, help='Description of the deployed pipeline')
    parser.add_argument('--docker_image', type=str, help='Docker base image used to build the pipeline steps')
    parser.add_argument('--volumes', type=str, nargs='*',
                        help='Volume (PVC) mount points. Write as `<pvc_name>;<path_to_mount_point>`')
    parser.add_argument('--deploy', action='store_true')
    # TODO: Remove port arg?
    parser.add_argument('--kfp_port', type=int, default=8080,
                        help='Local port map to remote KFP instance. KFP assumed to be at localhost:<port>/pipeline')
    parser.add_argument('--jupyter_args', type=str, help='YAML file with Jupyter parameters as defined by Papermill')

    args = parser.parse_args()

    notebook_metadata = nb.read(args.nb, as_version=nb.NO_CONVERT).metadata.get(KALE_NOTEBOOK_METADATA_KEY, dict())
    metadata_arguments = {**notebook_metadata, **vars(args)}
    for r in REQUIRED_ARGUMENTS:
        if r not in metadata_arguments:
            raise ValueError(f"Required argument not found: {r}")

    # if jupyter_args is set, generate first a set of temporary notebooks
    # based on the input yml parameters (via Papermill)
    if metadata_arguments['jupyter_args'] is not None:
        generated_notebooks = generate_notebooks_from_yml(input_nb_path=args.nb,
                                                          yml_parameters_path=metadata_arguments['jupyter_args'])

        # Run KaleCore over each generated notebook
        for n, params in generated_notebooks:
            Kale(
                source_notebook_path=n,
                experiment_name=metadata_arguments['experiment_name'] + params,
                run_name=metadata_arguments['run_name'] + params,
                pipeline_name=metadata_arguments['pipeline_name'] + params,
                pipeline_descr=metadata_arguments['pipeline_description'] + " params" + params,
                docker_image=metadata_arguments['docker_image'],
                auto_deploy=metadata_arguments['deploy'],
                kfp_port=metadata_arguments['kfp_port'],
                volumes=metadata_arguments['volumes']
            ).run()
    else:
        Kale(
            source_notebook_path=args.nb,
            experiment_name=metadata_arguments['experiment_name'],
            run_name=metadata_arguments['run_name'],
            pipeline_name=metadata_arguments['pipeline_name'],
            pipeline_descr=metadata_arguments['pipeline_description'],
            docker_image=metadata_arguments['docker_image'],
            auto_deploy=metadata_arguments['deploy'],
            kfp_port=metadata_arguments['kfp_port'],
            volumes=metadata_arguments['volumes']
        ).run()


if __name__ == "__main__":
    main()
