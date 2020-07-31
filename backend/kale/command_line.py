#  Copyright 2019-2020 The Kale Authors
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

import argparse

from argparse import RawTextHelpFormatter

from kale.core import Kale
from kale.common import kfputils

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
Override the arguments of the source Notebook's Kale metadata section
"""


def main():
    """Entry-point of CLI command."""
    parser = argparse.ArgumentParser(description=ARGS_DESC,
                                     formatter_class=RawTextHelpFormatter)
    general_group = parser.add_argument_group('General')
    general_group.add_argument('--nb', type=str,
                               help='Path to source JupyterNotebook',
                               required=True)
    # use store_const instead of store_true because we None instead of
    # False in case the flag is missing
    general_group.add_argument('--upload_pipeline', action='store_const',
                               const=True)
    general_group.add_argument('--run_pipeline', action='store_const',
                               const=True)
    general_group.add_argument('--debug', action='store_true')

    metadata_group = parser.add_argument_group('Notebook Metadata Overrides',
                                               METADATA_GROUP_DESC)
    metadata_group.add_argument('--experiment_name', type=str,
                                help='Name of the created experiment')
    metadata_group.add_argument('--pipeline_name', type=str,
                                help='Name of the deployed pipeline')
    metadata_group.add_argument('--pipeline_description', type=str,
                                help='Description of the deployed pipeline')
    metadata_group.add_argument('--docker_image', type=str,
                                help='Docker base image used to build the '
                                     'pipeline steps')
    metadata_group.add_argument('--kfp_host', type=str,
                                help='KFP endpoint. Provide address as '
                                     '<host>:<port>.')

    args = parser.parse_args()

    # get the notebook metadata args group
    mt_overrides_group = next(
        filter(lambda x: x.title == 'Notebook Metadata Overrides',
               parser._action_groups))
    # get the single args of that group
    mt_overrides_group_dict = {a.dest: getattr(args, a.dest, None)
                               for a in mt_overrides_group._group_actions
                               if getattr(args, a.dest, None) is not None}

    kale = Kale(
        source_notebook_path=args.nb,
        notebook_metadata_overrides=mt_overrides_group_dict,
        debug=args.debug
    )
    pipeline_graph, pipeline_parameters = kale.notebook_to_graph()
    script_path = kale.generate_kfp_executable(pipeline_graph,
                                               pipeline_parameters)
    # compile the pipeline to kfp tar package
    pipeline_name = kale.pipeline_metadata['pipeline_name']
    pipeline_package_path = kfputils.compile_pipeline(script_path,
                                                      pipeline_name)

    if args.upload_pipeline:
        kfputils.upload_pipeline(
            pipeline_package_path=pipeline_package_path,
            pipeline_name=kale.pipeline_metadata['pipeline_name'],
            host=kale.pipeline_metadata.get('kfp_host', None)
        )

    if args.run_pipeline:
        run_name = kfputils.generate_run_name(
            kale.pipeline_metadata['pipeline_name'])
        kfputils.run_pipeline(
            run_name=run_name,
            experiment_name=kale.pipeline_metadata['experiment_name'],
            pipeline_package_path=pipeline_package_path,
            host=kale.pipeline_metadata.get('kfp_host', None)
        )


KALE_VOLUMES_DESCRIPTION = """
Call kale-volumes to get information about Rok volumes currently mounted on
your Notebook Server.
"""


def kale_volumes():
    """This function handles kale-volumes CLI command."""
    import logging
    import os
    import sys
    import tabulate
    from pathlib import Path
    import json
    from kale.common import podutils

    # Add logger
    # Log to stdout. Set logging level according to --debug flag
    # Log to file ./kale-volumes.log. Logging level == DEBUG
    logger = logging.getLogger("kubeflow-kale")
    formatter = logging.Formatter(
        "%(asctime)s | %(name)s | %(levelname)s: %(message)s",
        datefmt="%m-%d %H:%M"
    )
    logger.setLevel(logging.DEBUG)

    log_dir_path = Path(".")
    file_handler = logging.FileHandler(
        filename=log_dir_path / 'kale-volumes.log',
        mode='a'
    )
    file_handler.setFormatter(formatter)
    file_handler.setLevel(logging.DEBUG)

    stream_handler = logging.StreamHandler()
    stream_handler.setLevel(logging.INFO)

    logger.addHandler(file_handler)
    logger.addHandler(stream_handler)

    def list_volumes(args, logger):
        """This function gets invoked by the sub-command 'list'."""
        volumes = podutils.list_volumes()

        if args.output == "table":
            headers = ["Mount Path", "Volume Name", "PVC Name", "Volume Size"]
            data = [(path, volume.name,
                     volume.persistent_volume_claim.claim_name, size)
                    for path, volume, size in volumes]
            logger.info(tabulate.tabulate(data, headers=headers))
        else:
            volumes_out = [{"type": "clone",
                            "name": volume.name,
                            "mount_point": path,
                            "size": size,
                            "size_type": "",
                            "snapshot": False}
                           for path, volume, size in volumes]
            print(json.dumps(volumes_out,
                             sort_keys=True,
                             indent=3,
                             separators=(",", ": ")))

    parser = argparse.ArgumentParser(description=KALE_VOLUMES_DESCRIPTION)
    parser.add_argument(
        "--output",
        "-o",
        choices=["table", "json"],
        default="table",
        nargs="?",
        type=str,
        help="Output format - Default: 'table'"
    )
    parser.add_argument('--debug', action='store_true')
    subparsers = parser.add_subparsers(
        dest="subcommand",
        help="kale-volumes sub-commands"
    )

    parser_list = subparsers.add_parser("list",
                                        help="List Rok volumes currently "
                                             "mounted on the Notebook "
                                             "Server")
    parser_list.set_defaults(func=list_volumes)

    args = parser.parse_args()

    if args.debug:
        stream_handler.setLevel(logging.DEBUG)

    if not os.getenv("NB_PREFIX"):
        logger.error("You may run this command only inside a Notebook Server.")
        sys.exit(1)

    args.func(args, logger)


if __name__ == "__main__":
    main()
