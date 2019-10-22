import argparse
import nbformat as nb

from argparse import RawTextHelpFormatter

from kale.core import Kale


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

METADATA_GROUP_DESC = """
Override the arguments provided in the Kale metadata section of the source Notebook
"""


def main():
    parser = argparse.ArgumentParser(description=ARGS_DESC, formatter_class=RawTextHelpFormatter)
    general_group = parser.add_argument_group('General')
    general_group.add_argument('--nb', type=str, help='Path to source JupyterNotebook', required=True)
    # use store_const instead of store_true because we None instead of False in case the flag is missing
    general_group.add_argument('--upload_pipeline', action='store_const', const=True)
    general_group.add_argument('--run_pipeline', action='store_const', const=True)
    general_group.add_argument('--debug', action='store_true')

    metadata_group = parser.add_argument_group('Notebook Metadata Overrides', METADATA_GROUP_DESC)
    metadata_group.add_argument('--experiment_name', type=str, help='Name of the created experiment')
    metadata_group.add_argument('--pipeline_name', type=str, help='Name of the deployed pipeline')
    metadata_group.add_argument('--pipeline_description', type=str, help='Description of the deployed pipeline')
    metadata_group.add_argument('--docker_image', type=str, help='Docker base image used to build the pipeline steps')
    metadata_group.add_argument('--kfp_dns', type=str, help='KFP endpoint. Provide address as <host>:<port>.')

    args = parser.parse_args()

    kale = Kale(
        source_notebook_path=args.nb,
        notebook_metadata_overrides=args.metadata,
        debug=args.debug
    )
    pipeline_graph, pipeline_parameters = kale.notebook_to_graph()
    script_path = kale.generate_kfp_executable(pipeline_graph, pipeline_parameters)
    # deploy pipeline to KFP instance
    if args.upload_pipeline or args.run_pipeline:
        return kale.deploy_pipeline_to_kfp(script_path)


if __name__ == "__main__":
    main()
