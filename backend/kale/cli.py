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
# import os
# import warnings

from argparse import RawTextHelpFormatter
from kale.processors import NotebookProcessor
from kale.compiler import Compiler
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
    """Command line interface."""
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
                                default="Kale-Pipeline-Experiment",
                                help='Name of the created experiment')
    metadata_group.add_argument('--pipeline_name', type=str,
                                default="kale-pipeline",
                                help='Name of the deployed pipeline')
    metadata_group.add_argument('--pipeline_description', type=str,
                                help='Description of the deployed pipeline')
    metadata_group.add_argument('--docker_image', type=str,
                                help='Docker base image used to build the '
                                     'pipeline steps')
    metadata_group.add_argument('--kfp_host', type=str,
                                help='KFP endpoint. Provide address as '
                                     '<host>:<port>.')
    metadata_group.add_argument('--storage-class-name', type=str,
                                help='The storage class name for the created'
                                     ' volumes')
    metadata_group.add_argument('--volume-access-mode', type=str,
                                help='The access mode for the created volumes')
    args = parser.parse_args()

    # get the notebook metadata args group
    mt_overrides_group = next(
        filter(lambda x: x.title == 'Notebook Metadata Overrides',
               parser._action_groups))
    # get the single args of that group
    mt_overrides_group_dict = {a.dest: getattr(args, a.dest, None)
                               for a in mt_overrides_group._group_actions
                               if getattr(args, a.dest, None) is not None}
    print(f"mt_overrides_group_dict: {mt_overrides_group_dict}")
    processor = NotebookProcessor(args.nb, mt_overrides_group_dict)
    pipeline = processor.run()
    imports_and_functions = processor.get_imports_and_functions()
    dsl_script_path = Compiler(pipeline, imports_and_functions).compile()
    pipeline_name = pipeline.config.pipeline_name
    print(f"dsl_script_path: {dsl_script_path}")

    pipeline_package_path = kfputils.compile_pipeline(dsl_script_path,
                                                      pipeline_name)
    if args.upload_pipeline or args.run_pipeline:
        pipeline_id, version_id = kfputils.upload_pipeline(
            pipeline_package_path=pipeline_package_path,
            pipeline_name=pipeline_name,
            host=pipeline.config.kfp_host
        )
        print(f"pipeline_id: {pipeline_id}, version_id: {version_id}")
        if args.run_pipeline:
            kfputils.run_pipeline(
                experiment_name=pipeline.config.experiment_name,
                pipeline_id=pipeline_id,
                version_id=version_id,
                host=pipeline.config.kfp_host,
                pipeline_package_path=pipeline_package_path
            )


if __name__ == "__main__":
    main()
