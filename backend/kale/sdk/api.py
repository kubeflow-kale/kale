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
import contextlib
import logging
import os
import sys

from kale import Artifact, Compiler, PipelineConfig, PythonProcessor, Step, StepConfig
from kale.common import utils

log = logging.getLogger(__name__)


def step(**kwargs):
    """Decorator used to declare a pipeline step."""
    config = StepConfig(**kwargs)

    def _step(func):
        return Step(source=func, **config.to_dict())

    return _step


def pipeline(**kwargs):
    """Decorator used to declare a pipeline."""
    # XXX: Translate some of the input arguments because the PipelineConfig
    #  field names reflect the metadata passed by the Notebook. Here we want
    #  to provide a more user friendly API with simpler argument names.
    _map = {
        "name": "pipeline_name",
        "experiment": "experiment_name",
        "description": "pipeline_description",
    }
    for old, new in _map.items():
        with contextlib.suppress(KeyError):
            kwargs[new] = kwargs.pop(old)

    def _pipeline(func):
        # do_kwargs correspond to pipeline parameters
        def _do(*args, **do_kwargs):
            if not utils.main_source_lives_in_cwd():
                # XXX: See arrikto/dev#671 for more details
                raise RuntimeError(
                    "Kale does not yet support running a pipeline when"
                    " Python's current working directory is different from the"
                    " location of the source script. You are now running"
                    f" `python {sys.argv[0]}`. Consider moving into the source script"
                    f" directory with `cd {os.path.dirname(sys.argv[0])}` and running `python {os.path.basename(sys.argv[0])}`,"
                    " instead.\nPlease reach out to the Arrikto team in case"
                    " you need more information and assistance."
                )

            if args:
                raise RuntimeError(
                    "Positional arguments found in pipeline"
                    f" function call `{func.__name__}`. Please provide just"
                    " keyword arguments."
                )

            cli_args = _parse_cli_args()

            config = PipelineConfig(**kwargs)

            processor = PythonProcessor(func, config)
            pipeline_obj = processor.run()
            pipeline_obj.override_pipeline_parameters_from_kwargs(**do_kwargs)

            if cli_args.kfp:
                if cli_args.dry_run:
                    return Compiler(pipeline_obj).compile()
                else:
                    return Compiler(pipeline_obj).compile_and_run()
            else:  # run the pipeline locally
                return pipeline_obj.run()

        return _do

    return _pipeline


def _parse_cli_args():
    """Parse CLI arguments."""
    parser = argparse.ArgumentParser(description="Run Kale Pipeline")
    parser.add_argument(
        "-K", "--kfp", action="store_true", help="Compile the pipeline to KFP DSL and deploy it"
    )
    parser.add_argument(
        "-D",
        "--dry-run",
        action="store_true",
        help=("Compile the pipeline to KFP DSL. Requires --kfp."),
    )
    return parser.parse_args()


def artifact(name: str, path: str):
    """Decorate a step to create a KFP HTML artifact.

    Apply this decorator to a step to create a Kubeflow Pipelines artifact
    (https://www.kubeflow.org/docs/pipelines/sdk/output-viewer/).
    In case the path does not point to a valid file, the step will fail with
    an error.

    To generate more than one artifact per step, apply the same decorator
    multiple time, as shown in the example below.

    ```python
    @artifact(name="artifact1", path="./figure.html")
    @artifact(name="artifact2", path="./plot.html")
    @step(name="artifact-generator")
    def foo():
        # ...
        # save something to plot.html and figure.html
        # ...
    ```

    **Note**: Currently the only supported format is HTML.

    Args:
        name: Artifact name
        path: Absolute path to an HTML file
    """

    def _(step: Step):
        if not isinstance(step, Step):
            raise ValueError(
                "You should decorate functions that are decorated with the @step decorator!"
            )
        step.artifacts.append(Artifact(name, path))
        return step

    return _
