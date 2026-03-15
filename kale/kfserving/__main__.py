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

"""
Entry point for the Kale KFServing Transformer server.

This script initializes and starts a KFServing server with a KaleTransformer
model. It accepts command-line arguments for the model name and predictor host.

Usage:
    python transformer.py --predictor_host <URL> [--model_name <name>]

Args:
    --model_name (str): The name the model is served under. 
                        Defaults to 'model'.
    --predictor_host (str): The URL for the model predict function. 
                            Required.

Example:
    python transformer.py --predictor_host http://localhost:8080
"""
import argparse
from kale.kfserving.transformer import KaleTransformer

import kfserving


DEFAULT_MODEL_NAME = "model"

parser = argparse.ArgumentParser(parents=[kfserving.kfserver.parser])
parser.add_argument(
    "--model_name", default=DEFAULT_MODEL_NAME, help="The name that the model is served under."
)
parser.add_argument(
    "--predictor_host", help="The URL for the model predict function", required=True
)

args, _ = parser.parse_known_args()

transformer = KaleTransformer(model_name=args.model_name, predictor_host=args.predictor_host)
kfserver = kfserving.KFServer()
kfserver.start(models=[transformer])
