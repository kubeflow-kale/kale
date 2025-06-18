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

# import argparse
import os
import sys
import nbformat
import re
import warnings
from typing import Dict, List, Any, Optional, Set, Tuple
from textwrap import indent
from argparse import RawTextHelpFormatter

from backend.kale import NotebookProcessor
from backend.kale.compiler import Compiler
from backend.kale.common import kfputils

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


# def main():
#     """Entry-point of CLI command."""
#     parser = argparse.ArgumentParser(description=ARGS_DESC,
#                                      formatter_class=RawTextHelpFormatter)
#     general_group = parser.add_argument_group('General')
#     general_group.add_argument('--nb', type=str,
#                                help='Path to source JupyterNotebook',
#                                required=True)
#     # use store_const instead of store_true because we None instead of
#     # False in case the flag is missing
#     general_group.add_argument('--upload_pipeline', action='store_const',
#                                const=True)
#     general_group.add_argument('--run_pipeline', action='store_const',
#                                const=True)
#     general_group.add_argument('--debug', action='store_true')

#     metadata_group = parser.add_argument_group('Notebook Metadata Overrides',
#                                                METADATA_GROUP_DESC)
#     metadata_group.add_argument('--experiment_name', type=str,
#                                 help='Name of the created experiment')
#     metadata_group.add_argument('--pipeline_name', type=str,
#                                 help='Name of the deployed pipeline')
#     metadata_group.add_argument('--pipeline_description', type=str,
#                                 help='Description of the deployed pipeline')
#     metadata_group.add_argument('--docker_image', type=str,
#                                 help='Docker base image used to build the '
#                                      'pipeline steps')
#     metadata_group.add_argument('--kfp_host', type=str,
#                                 help='KFP endpoint. Provide address as '
#                                      '<host>:<port>.')
#     metadata_group.add_argument('--storage-class-name', type=str,
#                                 help='The storage class name for the created'
#                                      ' volumes')
#     metadata_group.add_argument('--volume-access-mode', type=str,
#                                 help='The access mode for the created volumes')

#     args = parser.parse_args()

#     # get the notebook metadata args group
#     mt_overrides_group = next(
#         filter(lambda x: x.title == 'Notebook Metadata Overrides',
#                parser._action_groups))
#     # get the single args of that group
#     mt_overrides_group_dict = {a.dest: getattr(args, a.dest, None)
#                                for a in mt_overrides_group._group_actions
#                                if getattr(args, a.dest, None) is not None}

#     # FIXME: We are removing the `debug` arg. This shouldn't be an issue
#     processor = NotebookProcessor(args.nb, mt_overrides_group_dict)
#     pipeline = processor.run()
#     dsl_script_path = Compiler(pipeline).compile()
#     pipeline_name = pipeline.config.pipeline_name
#     pipeline_package_path = kfputils.compile_pipeline(dsl_script_path,
#                                                       pipeline_name)

#     if args.upload_pipeline or args.run_pipeline:
#         pipeline_id, version_id = kfputils.upload_pipeline(
#             pipeline_package_path=pipeline_package_path,
#             pipeline_name=pipeline_name,
#             host=pipeline.config.kfp_host
#         )

#         if args.run_pipeline:
#             kfputils.run_pipeline(
#                 experiment_name=pipeline.config.experiment_name,
#                 pipeline_id=pipeline_id,
#                 version_id=version_id,
#                 host=pipeline.config.kfp_host
#             )


# KALE_VOLUMES_DESCRIPTION = """
# Call kale-volumes to get information about Rok volumes currently mounted on
# your Notebook Server.
# """


# def kale_volumes():
#     """This function handles kale-volumes CLI command."""
#     import logging
#     import os
#     import sys
#     import tabulate
#     from pathlib import Path
#     import json
#     from backend.common import podutils

#     # Add logger
#     # Log to stdout. Set logging level according to --debug flag
#     # Log to file ./kale-volumes.log. Logging level == DEBUG
#     logger = logging.getLogger("kubeflow-kale")
#     formatter = logging.Formatter(
#         "%(asctime)s | %(name)s | %(levelname)s: %(message)s",
#         datefmt="%m-%d %H:%M"
#     )
#     logger.setLevel(logging.DEBUG)

#     log_dir_path = Path(".")
#     file_handler = logging.FileHandler(
#         filename=log_dir_path / 'kale-volumes.log',
#         mode='a'
#     )
#     file_handler.setFormatter(formatter)
#     file_handler.setLevel(logging.DEBUG)

#     stream_handler = logging.StreamHandler()
#     stream_handler.setLevel(logging.INFO)

#     logger.addHandler(file_handler)
#     logger.addHandler(stream_handler)

#     def list_volumes(args, logger):
#         """This function gets invoked by the sub-command 'list'."""
#         volumes = podutils.list_volumes()

#         if args.output == "table":
#             headers = ["Mount Path", "Volume Name", "PVC Name", "Volume Size"]
#             data = [(path, volume.name,
#                      volume.persistent_volume_claim.claim_name, size)
#                     for path, volume, size in volumes]
#             logger.info(tabulate.tabulate(data, headers=headers))
#         else:
#             volumes_out = [{"type": "clone",
#                             "name": volume.name,
#                             "mount_point": path,
#                             "size": size,
#                             "size_type": "",
#                             "snapshot": False}
#                            for path, volume, size in volumes]
#             print(json.dumps(volumes_out,
#                              sort_keys=True,
#                              indent=3,
#                              separators=(",", ": ")))

#     parser = argparse.ArgumentParser(description=KALE_VOLUMES_DESCRIPTION)
#     parser.add_argument(
#         "--output",
#         "-o",
#         choices=["table", "json"],
#         default="table",
#         nargs="?",
#         type=str,
#         help="Output format - Default: 'table'"
#     )
#     parser.add_argument('--debug', action='store_true')
#     subparsers = parser.add_subparsers(
#         dest="subcommand",
#         help="kale-volumes sub-commands"
#     )

#     parser_list = subparsers.add_parser("list",
#                                         help="List Rok volumes currently "
#                                              "mounted on the Notebook "
#                                              "Server")
#     parser_list.set_defaults(func=list_volumes)

#     args = parser.parse_args()

#     if args.debug:
#         stream_handler.setLevel(logging.DEBUG)

#     if not os.getenv("NB_PREFIX"):
#         logger.error("You may run this command only inside a Notebook Server.")
#         sys.exit(1)

#     args.func(args, logger)
# Bypass Kale's installation check
os.environ['KALE_DEV_MODE'] = '1'
KALE_AVAILABLE = True
# Suppress the installation warning
warnings.filterwarnings('ignore', message="Importing 'kale' outside a proper installation.")

# def convert_notebook_to_kfp(notebook_path: str, output_path: Optional[str] = None, 
#                               config: Optional[Dict[str, Any]] = None) -> str:
#     """
#     Convert notebook using Kale's core functions
    
#     Args:
#         notebook_path: Path to notebook
#         output_path: Output file path
#         config: Configuration dict
        
#     Returns:
#         Generated KFP code
#     """
#     # converter = NotebookToKFPConverter(config)
#     # return converter.convert_notebook(notebook_path, output_path)
#     return "test"


# def analyze_notebook_annotations(notebook_path: str) -> Dict[str, Any]:
#     """
#     Analyze notebook using Kale's functions if available
#     """
#     if not KALE_AVAILABLE:
#         return {
#             'kale_processor_success': False,
#             'error': 'Kale not available',
#             'fallback_needed': True
#         }
    
#     try:
#         # Use Kale's NotebookProcessor to analyze with proper config
#         notebook_config = {
#             'experiment_name': 'analysis_experiment',
#             'pipeline_name': 'analysis_pipeline',
#             'pipeline_description': 'Analysis pipeline',
#             'docker_image': 'python:3.9',
#             'volumes': [],
#             'steps_defaults': []
#         }
        
#         processor = NotebookProcessor(
#             nb_path=notebook_path,
#             nb_metadata_overrides=notebook_config,
#             skip_validation=True
#         )
        
#         # Parse the notebook to get basic structure
#         try:
#             params_source, metrics_source, imports_functions = processor.parse_notebook()
#             pipeline = processor.pipeline
            
#             analysis = {
#                 'pipeline_steps': len(pipeline.steps),
#                 'step_names': [step.name for step in pipeline.steps],
#                 'has_dependencies': len(pipeline.edges) > 0,
#                 'has_pipeline_parameters': bool(params_source.strip()),
#                 'has_pipeline_metrics': bool(metrics_source.strip()),
#                 'has_imports_functions': bool(imports_functions.strip()),
#                 'kale_processor_success': True
#             }
            
#             return analysis
            
#         except Exception as parse_error:
#             print(f"Parse notebook failed: {parse_error}")
#             # Fallback to just checking if processor was created
#             return {
#                 'pipeline_steps': 0,
#                 'step_names': [],
#                 'has_dependencies': False,
#                 'has_pipeline_parameters': False,
#                 'has_pipeline_metrics': False,
#                 'has_imports_functions': False,
#                 'kale_processor_success': True,
#                 'note': 'Processor created but parsing failed'
#             }
        
#     except Exception as e:
#         return {
#             'kale_processor_success': False,
#             'error': str(e),
#             'fallback_needed': True
#         }

def main():
    """Command line interface"""
    import argparse
    
    # parser = argparse.ArgumentParser(description="Simple Kale-based Notebook Converter")
    # parser.add_argument("--notebook", help="Input notebook (.ipynb)")
    # parser.add_argument("-o", "--output", help="Output Python file")
    # parser.add_argument("-a", "--analyze", action="store_true", help="Analyze only")
    # parser.add_argument("--experiment", default="Kale_Pipeline", help="Experiment name for KFP")
    # args = parser.parse_args()
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
    metadata_group.add_argument('--experiment_name', type=str, default="Kale-Pipeline-Experiment",
                                help='Name of the created experiment')
    metadata_group.add_argument('--pipeline_name', type=str, default="kale-pipeline",
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

    # FIXME: We are removing the `debug` arg. This shouldn't be an issue
    processor = NotebookProcessor(args.nb, mt_overrides_group_dict)
    pipeline = processor.run()
    print(f"pipeline: {pipeline}")
    print(f"processor: {processor}")
    dsl_script_path = Compiler(pipeline).compile()
    pipeline_name = pipeline.config.pipeline_name
    print(f"dsl_script_path: {dsl_script_path}")
    print(f"pipeline_config: {pipeline.config}")

    # Compiling with a specific script path for testing
    dsl_v2_script_path = ".kale/kale-test-pipeline.kale.py"
    pipeline_package_path = kfputils.compile_pipeline(dsl_v2_script_path,pipeline_name)
    print(f"pipeline_package_path: {pipeline_package_path}")
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
                pipeline_package_path = pipeline_package_path
            )
    # try:
    #     if args.analyze:
    #         print("🔍 Analyzing with Kale...")
    #         analysis = analyze_notebook_annotations(args.notebook)
            
    #         if analysis.get('kale_processor_success'):
    #             print(f"✅ Kale processor succeeded")
    #             print(f"📊 Pipeline steps: {analysis['pipeline_steps']}")
    #             print(f"📝 Step names: {analysis['step_names']}")
    #             print(f"🔗 Has dependencies: {analysis['has_dependencies']}")
    #             if 'has_pipeline_parameters' in analysis:
    #                 print(f"📋 Has pipeline parameters: {analysis['has_pipeline_parameters']}")
    #             if 'has_pipeline_metrics' in analysis:
    #                 print(f"📊 Has pipeline metrics: {analysis['has_pipeline_metrics']}")
    #             if 'note' in analysis:
    #                 print(f"📝 Note: {analysis['note']}")
    #         else:
    #             print(f"❌ Kale processor failed: {analysis.get('error')}")
    #             print(f"🔄 Fallback parsing would be needed")
    #     else:
    #         print("🔄 Converting with Kale functions...")
            
    #         # Set output path
    #         if not args.output:
    #             base_name = os.path.splitext(args.notebook)[0]
    #             args.output = f"{base_name}_kale_pipeline.py"
    #          # Create config with experiment name
    #         config = {
    #             'experiment_name': args.experiment
    #         }
            
    #         kfp_code = convert_notebook_to_kfp(args.notebook, args.output, config)
            
    #         print(f"✅ Conversion completed!")
    #         print(f"📄 Generated: {args.output}")
    #         print(f"📏 Code length: {len(kfp_code)} characters")
    #         print(f"🔧 Kale integration: {'enabled' if KALE_AVAILABLE else 'fallback mode'}")
            
    #         print(f"\n💡 To use the generated pipeline:")
    #         print(f"   python {args.output} --compile")
    #         print(f"   python {args.output} --kfp-host http://127.0.0.1:8080")
            
    # except Exception as e:
    #     print(f"❌ Error: {e}")
    #     import traceback
    #     traceback.print_exc()
    #     sys.exit(1)
if __name__ == "__main__":
    main()
