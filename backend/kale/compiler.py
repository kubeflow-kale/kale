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
import logging
import os
import re
from typing import NamedTuple

import autopep8
from jinja2 import Environment, FileSystemLoader, PackageLoader

from kale import __version__ as KALE_VERSION
from kale.common import graphutils, kfputils, utils
from kale.pipeline import Pipeline, PipelineParam, Step

log = logging.getLogger(__name__)

PY_FN_TEMPLATE = "py_function_template.jinja2"
NB_FN_TEMPLATE = "nb_function_template.jinja2"
PIPELINE_TEMPLATE = "pipeline_template.jinja2"
PIPELINE_ORIGIN = {"nb": NB_FN_TEMPLATE, "py": PY_FN_TEMPLATE}

KFP_DSL_ARTIFACT_IMPORTS = [
    "Dataset",
    "Model",
    "Metrics",
    "ClassificationMetrics",
    "Artifact",
    "HTML",
]


class Artifact(NamedTuple):
    """A Step artifact."""

    name: str
    type: str
    is_input: bool = False


class Compiler:
    """Converts a Pipeline object into a KFP executable.

    Compiler provides the tools to convert a Pipeline object into an
    executable script that uses the KFP DSL to create and upload a
    new pipeline.

    The Pipeline object is assumed to provide all the necessary information
    (environment, configuration, etc...) for the script to be compiled.
    """

    def __init__(self, pipeline: Pipeline, imports_and_functions: str):
        self.pipeline = pipeline
        self.templating_env = None
        self.dsl_source = ""
        self.dsl_script_path = None
        self.imports_and_functions = imports_and_functions

    @staticmethod
    def _get_args():
        parser = argparse.ArgumentParser(description="Run Kale Pipeline")
        parser.add_argument("-K", "--kfp", action="store_true")
        return parser.parse_args()

    def compile_and_run(self):
        """First compile the Pipeline to DSL and then run it."""
        self.compile()
        self.run()

    def compile(self):
        """Convert Pipeline to KFP DSL.

        Returns path to DSL script.
        """
        log.info("Compiling Pipeline into KFP DSL code")
        self.dsl_source = self.generate_dsl()
        return self._save_compiled_code()

    def run(self):
        """Run the generated KFP script."""
        if not self.dsl_script_path:
            raise RuntimeError(
                "The Compiler has yet to generate a new KFP"
                " DSL script. Please run the `compile` function"
                " first."
            )
        self._run_compiled_code(self.dsl_script_path)

    def generate_dsl(self):
        """Generate a Python KFP DSL executable starting from the pipeline.

        Returns (str): A Python executable script
        """
        # List of lightweight components generated code
        lightweight_components = [
            self.generate_lightweight_component(step) for step in self.pipeline.steps
        ]
        pipeline_code = self.generate_pipeline(lightweight_components)
        return pipeline_code

    def generate_lightweight_component(self, step: Step):
        """Generate Python code using the function template."""
        step_source_raw = step.source

        def _encode_source(s):
            # Encode line by line a multiline string
            return "\n    ".join(
                [line.encode("unicode_escape").decode("utf-8") for line in s.splitlines()]
            )

        if self.pipeline.processor.id == "nb":
            # Since the code will be wrapped in triple quotes inside the
            # template, we need to escape triple quotes as they will not be
            # escaped by encode("unicode_escape").
            step.source = [re.sub(r"'''", "\\'\\'\\'", _encode_source(s)) for s in step_source_raw]

        _template_filename = PIPELINE_ORIGIN.get(self.pipeline.processor.id)
        template = self._get_templating_env().get_template(_template_filename)

        # Separate parameters with and without defaults for proper ordering
        params_without_defaults = [f"{step.name}_html_report: Output[HTML]"]
        params_with_defaults = []
        step_inputs_list, step_outputs_list = [], []
        if hasattr(step, "ins") and step.ins:
            step_inputs_list = sorted(step.ins)
            for var_name in step_inputs_list:
                # Determine the correct input type based on variable name
                input_type = "Model" if "model" in var_name else "Dataset"
                params_without_defaults.append(f"{var_name}_input_artifact: Input[{input_type}]")

        step_outputs_list = []

        if hasattr(step, "outs") and step.outs:
            step_outputs_list = sorted(step.outs)
            for var_name in step_outputs_list:
                output_type = "Model" if "model" in var_name else "Dataset"
                params_without_defaults.append(f"{var_name}_output_artifact: Output[{output_type}]")

        if hasattr(self.pipeline, "pipeline_parameters") and self.pipeline.pipeline_parameters:  # noqa: E501
            for param_name, param in self.pipeline.pipeline_parameters.items():
                if isinstance(param, PipelineParam):
                    param_type = param.param_type or "str"
                    param_value_str = repr(param.param_value)
                    clean_param_name = (
                        f"{param_name.lower()}_param" if param_name.isupper() else param_name
                    )
                    params_with_defaults.append(
                        f"{clean_param_name}: {param_type} = {param_value_str}"
                    )

        component_params_list = params_without_defaults + params_with_defaults
        component_signature_args = ", ".join(component_params_list)

        # Create pipeline parameter mapping for the template
        pipeline_params = {}
        if hasattr(self.pipeline, "pipeline_parameters") and self.pipeline.pipeline_parameters:  # noqa: E501
            for param_name, param in self.pipeline.pipeline_parameters.items():
                if isinstance(param, PipelineParam):
                    clean_param_name = (
                        f"{param_name.lower()}_param" if param_name.isupper() else param_name
                    )
                    param = {clean_param_name: param.param_value}
                    pipeline_params[param_name] = param

        # Create step artifacts info for template
        step_inputs = []
        step_outputs = []

        for var_name in step_inputs_list:
            input_type = "Model" if "model" in var_name else "Dataset"
            step_inputs.append(Artifact(name=f"{var_name}", type=input_type, is_input=True))

        for var_name in step_outputs_list:
            output_type = "Model" if "model" in var_name else "Dataset"
            step_outputs.append(Artifact(name=f"{var_name}", type=output_type, is_input=False))

        packages_list = self._get_package_list_from_imports()
        pip_index_urls = utils.compute_pip_index_urls()
        pip_trusted_hosts = utils.compute_trusted_hosts()
        fn_code = template.render(
            pip_index_urls=pip_index_urls,
            pip_trusted_hosts=pip_trusted_hosts,
            step=step,
            component_signature_args=component_signature_args,
            pipeline_params=pipeline_params,
            packages_list=packages_list,
            step_inputs=step_inputs,
            step_outputs=step_outputs,
            kfp_dsl_artifact_imports=KFP_DSL_ARTIFACT_IMPORTS,
            **self.pipeline.config.to_dict(),
        )
        return autopep8.fix_code(fn_code)

    def generate_pipeline(self, lightweight_components):
        """Generate Python code using the pipeline template."""
        template = self._get_templating_env().get_template(PIPELINE_TEMPLATE)
        step_outputs = {}
        step_inputs = {}
        step_inputs_sources = {}
        for step in self.pipeline.steps:
            if hasattr(step, "ins") and step.ins:
                step_inputs[step.name] = sorted(step.ins)

                step_inputs_sources[step.name] = {}
                ancestors = graphutils.get_ordered_ancestors(self.pipeline, step.name)
                for input_var in step_inputs[step.name]:
                    source_step_name = "UNKNOWN"
                    for anc_name in ancestors:
                        anc_step = self.pipeline.get_step(anc_name)
                        if hasattr(anc_step, "outs") and input_var in anc_step.outs:
                            source_step_name = anc_name
                            break
                    step_inputs_sources[step.name][input_var] = source_step_name

            if hasattr(step, "outs") and step.outs:
                step_outputs[step.name] = sorted(step.outs)

        pipeline_param_info = {}

        if hasattr(self.pipeline, "pipeline_parameters") and self.pipeline.pipeline_parameters:  # noqa: E501
            for param_name, param in self.pipeline.pipeline_parameters.items():
                if isinstance(param, PipelineParam):
                    clean_param_name = (
                        f"{param_name.lower()}_param" if param_name.isupper() else param_name
                    )
                    pipeline_param_info[param_name] = {
                        "clean_name": clean_param_name,
                        "type": param.param_type,
                        "default": param.param_value,
                    }
        if hasattr(self.pipeline, "steps") and self.pipeline.steps:
            # Ensure that the first step is always the pipeline entry point
            component_names = {}
            for step in self.pipeline.steps:
                component_names[step.name] = step.name.replace("_", "-")

        pipeline_code = template.render(
            pipeline=self.pipeline,
            lightweight_components=lightweight_components,
            step_outputs=step_outputs,
            step_inputs=step_inputs,
            step_inputs_sources=step_inputs_sources,
            pipeline_param_info=pipeline_param_info,
            component_names=component_names,
            **self.pipeline.config.to_dict(),
        )
        # fix code style using pep8 guidelines
        return autopep8.fix_code(pipeline_code)

    def _get_package_list_from_imports(self):
        """Extracts unique package names from the tagged imports cell.

        Args:
            imports_str: A string containing Python import statements.

        Returns:
            A list of unique top-level package names.
        """
        package_names = set()
        if KALE_VERSION != "0+unknown":
            package_names.add(f"kubeflow-kale=={KALE_VERSION}")
        else:
            package_names.add("kubeflow-kale")
        package_names.add("kfp>=2.0.0")
        lines = self.imports_and_functions.strip().split("\n")

        for line in lines:
            line = line.strip()
            if line.startswith("import "):
                # For 'import package' or 'import package as alias'
                parts = line.split(" ")
                if len(parts) > 1:
                    package_name = parts[1].split(".")[0]
                    if package_name == "random":
                        package_name = "random2"
                    if package_name == "sklearn":
                        package_name = "scikit-learn"
                    package_names.add(package_name)
            elif line.startswith("from "):
                parts = line.split(" ")
                if len(parts) > 1:
                    package_name = parts[1].split(".")[0]
                    if package_name == "sklearn":
                        package_name = "scikit-learn"
                    package_names.add(package_name)
        return sorted(package_names)

    def _get_templating_env(self, templates_path=None):
        if self.templating_env:
            return self.templating_env

        if templates_path:
            loader = FileSystemLoader(templates_path)
        else:
            loader = PackageLoader("kale", "templates")
        template_env = Environment(loader=loader)
        # add custom filters
        template_env.filters["add_suffix"] = lambda s, suffix: s + suffix
        template_env.filters["add_prefix"] = lambda s, prefix: prefix + s
        # quote a string when it is materialized in the template
        template_env.filters["quote_if_not_none"] = lambda x: (f'"{x}"' if x is not None else None)
        self.templating_env = template_env
        return template_env

    def _save_compiled_code(self, path: str = None) -> str:
        if not path:
            # save the generated file in a hidden local directory
            path = os.path.join(os.getcwd(), ".kale")
            os.makedirs(path, exist_ok=True)
        log.info("Saving generated code in %s", path)
        filename = f"{self.pipeline.config.pipeline_name}.kale.py"
        output_path = os.path.abspath(os.path.join(path, filename))
        with open(output_path, "w") as f:
            f.write(self.dsl_source)
        log.info("Successfully saved generated code: %s", output_path)
        self.dsl_script_path = output_path
        return output_path

    def _run_compiled_code(self, script_path: str):
        pipeline_name = self.pipeline.config.pipeline_name
        pipeline_yaml_path = kfputils.compile_pipeline(script_path, pipeline_name)
        pipeline_id, version_id = kfputils.upload_pipeline(pipeline_yaml_path, pipeline_name)
        kfputils.run_pipeline(
            experiment_name=self.pipeline.config.experiment_name,
            pipeline_id=pipeline_id,
            version_id=version_id,
        )
