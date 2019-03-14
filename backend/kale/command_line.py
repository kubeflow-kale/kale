import argparse

from .converter import KaleCore


def main():
    parser = argparse.ArgumentParser(description='MAP-Elites')
    parser.add_argument('--nb', type=str, help='Path to source JupyterNotebook', required=True)
    parser.add_argument('--deploy', action='store_true')
    parser.add_argument('--kfp_port', type=int, default=8000, help='Local port map to remote KFP instance. KFP assumed to be at localhost:<port>/pipeline')
    parser.add_argument('--pipeline_name', type=str, help='Name of the deployed pipeline')
    parser.add_argument('--pipeline_descr', type=str, help='Description of the deployed pipeline')
    parser.add_argument('--docker_image', type=str, help='Docker base image used to build the pipeline steps')

    args = parser.parse_args()

    kale_core = KaleCore(
        source_notebook_path=args.nb,
        pipeline_name=args.pipeline_name,
        pipeline_descr=args.pipeline_descr,
        docker_image=args.docker_image,
        auto_deploy=args.deploy,
        kfp_port=args.kfp_port
    )
