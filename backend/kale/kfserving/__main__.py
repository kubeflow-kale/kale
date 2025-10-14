# SPDX-License-Identifier: Apache-2.0
# Copyright (c) 2019–2025 The Kale Contributors.

import argparse
import kfserving

from kale.kfserving.transformer import KaleTransformer

DEFAULT_MODEL_NAME = "model"

parser = argparse.ArgumentParser(parents=[kfserving.kfserver.parser])
parser.add_argument('--model_name', default=DEFAULT_MODEL_NAME,
                    help='The name that the model is served under.')
parser.add_argument('--predictor_host',
                    help='The URL for the model predict function',
                    required=True)

args, _ = parser.parse_known_args()

transformer = KaleTransformer(model_name=args.model_name,
                              predictor_host=args.predictor_host)
kfserver = kfserving.KFServer()
kfserver.start(models=[transformer])
