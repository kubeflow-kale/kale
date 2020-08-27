# Copyright 2020 The Kale Authors
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import os
import re
import logging
import argparse
import autopep8

from jinja2 import Environment, PackageLoader, FileSystemLoader

from kale import Pipeline, Step
from kale.common import kfputils


log = logging.getLogger(__name__)

FN_TEMPLATE = "function_template.jinja2"
PIPELINE_TEMPLATE = "pipeline_template.jinja2"


class Compiler:
    """Converts a Pipeline object into a KFP executable.

    Compiler provides the tools to convert a Pipeline object into an
    executable script that uses the KFP DSL to create and upload a
    new pipeline.

    The Pipeline object is assumed to provide all the necessary information
    (environment, configuration, etc...) for the script to be compiled.
    """
    def __init__(self, pipeline: Pipeline):
        self.pipeline = pipeline
        self.templating_env = None
        self.dsl_source = ""

    @staticmethod
    def _get_args():
        parser = argparse.ArgumentParser(
            description="Run Kale Pipeline")
        parser.add_argument("-K", "--kfp", action="store_true")
        return parser.parse_args()

    def compile(self):
        """Convert Pipeline to KFP DSL.

        Returns path to DSL script.
        """
        log.info("Compiling Pipeline into KFP DSL code")
        self.dsl_source = self.generate_dsl()
        return self._save_compiled_code()

    def generate_dsl(self):
        """Generate a Python KFP DSL executable starting from the pipeline.

        Returns (str): A Python executable script
        """
        # List of lightweight components generated code
        lightweight_components = [
            self.generate_lightweight_component(step)
            for step in self.pipeline.steps
        ]
        pipeline_code = self.generate_pipeline(lightweight_components)
        return pipeline_code

    def generate_lightweight_component(self, step: Step):
        """Generate Python code using the function template."""
        step_source_raw = step.source

        def _encode_source(s):
            # Encode line by line a multiline string
            return "\n".join([line.encode("unicode_escape").decode("utf-8")
                              for line in s.splitlines()])

        # Since the code will be wrapped in triple quotes inside the template,
        # we need to escape triple quotes as they will not be escaped by
        # encode("unicode_escape").
        step.source = [re.sub(r"'''", "\\'\\'\\'", _encode_source(s))
                       for s in step_source_raw]

        template = self._get_templating_env().get_template(FN_TEMPLATE)
        fn_code = template.render(step=step, **self.pipeline.config.to_dict())
        # fix code style using pep8 guidelines
        return autopep8.fix_code(fn_code)

    def generate_pipeline(self, lightweight_components):
        """Generate Python code using the pipeline template."""
        template = self._get_templating_env().get_template(PIPELINE_TEMPLATE)
        pipeline_code = template.render(
            pipeline=self.pipeline,
            lightweight_components=lightweight_components,
            **self.pipeline.config.to_dict()
        )
        # fix code style using pep8 guidelines
        return autopep8.fix_code(pipeline_code)

    def _get_templating_env(self, templates_path=None):
        if self.templating_env:
            return self.templating_env

        if templates_path:
            loader = FileSystemLoader(templates_path)
        else:
            loader = PackageLoader('kale', 'templates')
        template_env = Environment(loader=loader)
        # add custom filters
        template_env.filters['add_suffix'] = lambda s, suffix: s + suffix
        template_env.filters['add_prefix'] = lambda s, prefix: prefix + s
        self.templating_env = template_env
        return template_env

    def _save_compiled_code(self, path: str = None) -> str:
        if not path:
            # save the generated file in a hidden local directory
            path = os.path.join(os.getcwd(), ".kale")
            os.makedirs(path, exist_ok=True)
        log.info("Saving generated code in %s", path)
        filename = "{}.kale.py".format(self.pipeline.config.pipeline_name)
        output_path = os.path.abspath(os.path.join(path, filename))
        with open(output_path, "w") as f:
            f.write(self.dsl_source)
        log.info("Successfully saved generated code: %s", output_path)
        return output_path

    def _run_compiled_code(self, script_path: str):
        _name = self.pipeline.config.pipeline_name
        pipeline_yaml_path = kfputils.compile_pipeline(script_path, _name)
        kfputils.upload_pipeline(pipeline_yaml_path, _name)
        run_name = kfputils.generate_run_name(_name)
        kfputils.run_pipeline(
            run_name=run_name,
            experiment_name=self.pipeline.config.experiment_name,
            pipeline_package_path=pipeline_yaml_path
        )
