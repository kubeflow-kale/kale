# Copyright 2026 The Kubeflow Authors.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import argparse
from argparse import RawTextHelpFormatter
import contextlib
import os
import sys
import tempfile

import kfp

from kale.common import kfputils
from kale.compiler import Compiler
from kale.processors import NotebookProcessor

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
    parser = argparse.ArgumentParser(description=ARGS_DESC, formatter_class=RawTextHelpFormatter)
    general_group = parser.add_argument_group("General")
    general_group.add_argument(
        "--nb", type=str, help="Path to source JupyterNotebook", required=True
    )
    # use store_const instead of store_true because we None instead of
    # False in case the flag is missing
    general_group.add_argument("--upload_pipeline", action="store_const", const=True)
    general_group.add_argument("--run_pipeline", action="store_const", const=True)
    general_group.add_argument(
        "--kubernetes-manifest-format",
        action="store_const",
        const=True,
        help=(
            "Compile to native Kubernetes manifests (Pipeline/PipelineVersion "
            "CRs) instead of a KFP IR package for upload. Cannot be combined "
            "with --upload_pipeline/--run_pipeline."
        ),
    )
    general_group.add_argument(
        "--kubernetes-namespace",
        type=str,
        help="Namespace to set on the generated Kubernetes manifests.",
    )
    general_group.add_argument(
        "--pipeline-display-name",
        type=str,
        help="Display name for the Pipeline manifest.",
    )
    general_group.add_argument(
        "--pipeline-version-name",
        type=str,
        help="Name for the PipelineVersion manifest.",
    )
    general_group.add_argument(
        "--pipeline-version-display-name",
        type=str,
        help="Display name for the PipelineVersion manifest.",
    )
    general_group.add_argument(
        "--no-include-pipeline-manifest",
        action="store_const",
        const=True,
        help=(
            "Emit only the PipelineVersion (and workload) manifests, "
            "omitting the Pipeline manifest."
        ),
    )
    general_group.add_argument(
        "--output",
        type=str,
        help=(
            "Path to write the Kubernetes manifest YAML to. Only valid with "
            "--kubernetes-manifest-format. Defaults to "
            "'.kale/<pipeline_name>.pipeline.k8s.yaml'."
        ),
    )
    general_group.add_argument(
        "--stdout",
        action="store_const",
        const=True,
        help=(
            "Print the Kubernetes manifest YAML to stdout instead of "
            "writing it to disk. Only valid with --kubernetes-manifest-format, "
            "and cannot be combined with --output."
        ),
    )
    general_group.add_argument("--debug", action="store_true")
    general_group.add_argument(
        "--dev",
        action="store_true",
        help="Bake local dev index (devpi) into generated components.",
    )
    general_group.add_argument(
        "--pip-index-urls",
        type=str,
        help=(
            "Comma-separated PEP 503 simple indexes to bake into components."
            "Overrides --dev/KALE_DEV_MODE. Example: "
            '"http://127.0.0.1:3141/root/dev/+simple/,'
            'https://pypi.org/simple"'
        ),
    )
    general_group.add_argument(
        "--devpi-simple-url",
        type=str,
        default=None,
        help=(
            "Devpi simple URL to use when --dev is set. "
            "Default: http://127.0.0.1:3141/root/dev/+simple/"
        ),
    )

    metadata_group = parser.add_argument_group("Notebook Metadata Overrides", METADATA_GROUP_DESC)
    metadata_group.add_argument(
        "--experiment_name",
        type=str,
        default="Kale-Pipeline-Experiment",
        help="Name of the created experiment",
    )
    metadata_group.add_argument(
        "--pipeline_name", type=str, default="kale-pipeline", help="Name of the deployed pipeline"
    )
    metadata_group.add_argument(
        "--pipeline_description", type=str, help="Description of the deployed pipeline"
    )
    metadata_group.add_argument(
        "--docker_image", type=str, help="Docker base image used to build the pipeline steps"
    )
    metadata_group.add_argument(
        "--kfp_host", type=str, help="KFP endpoint. Provide address as <host>:<port>."
    )
    metadata_group.add_argument(
        "--storage-class-name", type=str, help="The storage class name for the created volumes"
    )
    metadata_group.add_argument(
        "--volume-access-mode", type=str, help="The access mode for the created volumes"
    )
    metadata_group.add_argument(
        "--output_path",
        type=str,
        help=(
            "Relative path (from the notebook directory) where the compiled "
            "KFP DSL Python script will be saved. Defaults to '.kale/'."
        ),
    )
    args = parser.parse_args()

    if args.kubernetes_manifest_format and (args.upload_pipeline or args.run_pipeline):
        parser.error(
            "--kubernetes-manifest-format cannot be combined with "
            "--upload_pipeline/--run_pipeline. Deploy the manifest with "
            "`kubectl apply -f` or a GitOps controller instead."
        )

    if args.output and not args.kubernetes_manifest_format:
        parser.error("--output is only valid with --kubernetes-manifest-format.")

    if args.stdout and not args.kubernetes_manifest_format:
        parser.error("--stdout is only valid with --kubernetes-manifest-format.")

    if args.stdout and args.output:
        parser.error("--stdout cannot be combined with --output.")

    if args.pip_index_urls:
        os.environ["KALE_PIP_INDEX_URLS"] = args.pip_index_urls
    elif args.dev:
        os.environ["KALE_DEV_MODE"] = "1"
        if args.devpi_simple_url:
            os.environ["KALE_DEVPI_SIMPLE_URL"] = args.devpi_simple_url

    # get the notebook metadata args group
    mt_overrides_group = next(
        filter(lambda x: x.title == "Notebook Metadata Overrides", parser._action_groups)
    )
    # get the single args of that group
    mt_overrides_group_dict = {
        a.dest: getattr(args, a.dest, None)
        for a in mt_overrides_group._group_actions
        if getattr(args, a.dest, None) is not None
    }
    processor = NotebookProcessor(args.nb, mt_overrides_group_dict)
    pipeline = processor.run()
    imports_and_functions = processor.get_imports_and_functions()
    dsl_script_path = Compiler(pipeline, imports_and_functions).compile()
    pipeline_name = pipeline.config.pipeline_name
    # In --stdout mode, only the manifest YAML may go to stdout so it can be
    # piped/redirected cleanly by CI; route diagnostics to stderr instead.
    diag_stream = sys.stderr if (args.kubernetes_manifest_format and args.stdout) else sys.stdout
    print(f"dsl_script_path: {dsl_script_path}", file=diag_stream)

    if args.kubernetes_manifest_format:
        manifest_options = kfp.compiler.KubernetesManifestOptions(
            pipeline_name=pipeline_name,
            pipeline_display_name=args.pipeline_display_name,
            pipeline_version_name=args.pipeline_version_name,
            pipeline_version_display_name=args.pipeline_version_display_name,
            namespace=args.kubernetes_namespace,
            include_pipeline_manifest=not args.no_include_pipeline_manifest,
        )
        if args.stdout:
            fd, tmp_manifest_path = tempfile.mkstemp(suffix=".pipeline.k8s.yaml")
            os.close(fd)
            try:
                kfputils.compile_pipeline_to_manifests(
                    dsl_script_path, pipeline_name, manifest_options, output_path=tmp_manifest_path
                )
                with open(tmp_manifest_path) as manifest_file:
                    print(manifest_file.read(), end="")
            finally:
                # Never let cleanup mask a compilation/read error above.
                with contextlib.suppress(FileNotFoundError):
                    os.remove(tmp_manifest_path)
            return

        manifest_path = kfputils.compile_pipeline_to_manifests(
            dsl_script_path, pipeline_name, manifest_options, output_path=args.output
        )
        print(f"manifest_path: {manifest_path}")
        return

    pipeline_package_path = kfputils.compile_pipeline(dsl_script_path, pipeline_name)
    if args.upload_pipeline or args.run_pipeline:
        pipeline_id, version_id = kfputils.upload_pipeline(
            pipeline_package_path=pipeline_package_path,
            pipeline_name=pipeline_name,
            host=pipeline.config.kfp_host,
        )
        print(f"pipeline_id: {pipeline_id}, version_id: {version_id}")
        if args.run_pipeline:
            kfputils.run_pipeline(
                experiment_name=pipeline.config.experiment_name,
                pipeline_id=pipeline_id,
                version_id=version_id,
                host=pipeline.config.kfp_host,
                pipeline_package_path=pipeline_package_path,
            )


if __name__ == "__main__":
    main()
