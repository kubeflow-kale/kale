import argparse

from kale.core import Kale
from kale.notebook_hp import generate_notebooks_from_yml


def main():
    parser = argparse.ArgumentParser(description='MAP-Elites')
    parser.add_argument('--nb', type=str, help='Path to source JupyterNotebook', required=True)
    parser.add_argument('--deploy', action='store_true')
    parser.add_argument('--kfp_port', type=int, default=8000, help='Local port map to remote KFP instance. KFP assumed to be at localhost:<port>/pipeline')
    parser.add_argument('--pipeline_name', type=str, help='Name of the deployed pipeline')
    parser.add_argument('--pipeline_descr', type=str, help='Description of the deployed pipeline')
    parser.add_argument('--docker_image', type=str, help='Docker base image used to build the pipeline steps')
    parser.add_argument('--jupyter_args', type=str, help='YAML file with Jupyter parameters as defined by Papermill')

    args = parser.parse_args()

    # if jupyter_args is set, generate first a set of temporary notebooks
    # based on the input yml parameters (via Papermill)
    if args.jupyter_args is not None:
        generated_notebooks = generate_notebooks_from_yml(input_nb_path=args.nb,
                                                          yml_parameters_path=args.jupyter_args)

        # # Run KaleCore over each generated notebook
        for n, params in generated_notebooks:
            Kale(
                source_notebook_path=n,
                pipeline_name=args.pipeline_name + params,
                pipeline_descr=args.pipeline_descr + " params" + params,
                docker_image=args.docker_image,
                auto_deploy=args.deploy,
                kfp_port=args.kfp_port
            )
    else:
        Kale(
            source_notebook_path=args.nb,
            pipeline_name=args.pipeline_name,
            pipeline_descr=args.pipeline_descr,
            docker_image=args.docker_image,
            auto_deploy=args.deploy,
            kfp_port=args.kfp_port
        )


if __name__ == "__main__":
    main()
