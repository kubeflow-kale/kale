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

import logging
import os
import types

from kale import NotebookProcessor, marshal
from kale.common import serveutils, utils
import kfserving

log = logging.getLogger(__name__)


class KaleTransformer(kfserving.KFModel):
    """Run a KFServing transformer server."""

    def __init__(self, model_name: str, predictor_host: str):
        log.info("Initializing KaleTransformer...")
        super().__init__(model_name)
        self.predictor_host = predictor_host
        self.assets = {}
        self.init_code = None
        # load everything during bootstrap, so that when the user hits the
        # prediction endpoint the response delay is influenced just by
        # computation time.
        self._load_transformer_assets()

    def _load_transformer_assets(self):
        marshal.set_data_dir(serveutils.TRANSFORMER_ASSETS_DIR)
        log.info("Loading transformer function...")
        _fn = marshal.load(serveutils.TRANSFORMER_FN_ASSET_NAME)
        # create a new function monkey patching the original function's
        # __globals__. The marshalled function would not be scoped under
        # the current module, thus its __globals__ dict would be empty.
        # In this way we create the same function but binding it to the
        # module's globals().
        self.fn = types.FunctionType(
            _fn.__code__, globals(), _fn.__name__, _fn.__defaults__, _fn.__closure__
        )

        log.info("Processing source notebook for imports and functions...")
        processor = NotebookProcessor(
            nb_path=os.path.join(
                serveutils.TRANSFORMER_ASSETS_DIR, serveutils.TRANSFORMER_SRC_NOTEBOOK_NAME
            ),
            skip_validation=True,
        )
        self.init_code = processor.get_imports_and_functions()
        log.info(f"Initialization code:\n{self.init_code}")
        log.info("Running initialization code...")
        exec(self.init_code, globals())

        log.info("Loading transformer's assets...")
        for file in os.listdir(serveutils.TRANSFORMER_ASSETS_DIR):
            if file in [
                serveutils.TRANSFORMER_SRC_NOTEBOOK_NAME,
                serveutils.TRANSFORMER_FN_ASSET_NAME,
            ]:
                continue
            # The marshal mechanism works by looking at the name of the files
            # without extensions.
            basename = os.path.splitext(file)[0]  # remove extension
            self.assets[basename] = marshal.load(basename)
        log.info(f"Assets successfully loaded: {self.assets.keys()}")
        log.info("Initializing assets...")
        for asset_name, asset_value in self.assets.items():
            globals()[asset_name] = asset_value

    def preprocess(self, inputs: dict) -> dict:
        """Preprocess input data."""
        log.info("Starting inputs preprocessing...")
        log.info(f"Input data: {utils.shorten_long_string(inputs)}")
        res = self._run_transformer(inputs)
        log.info("Processed data: {}".format(utils.shorten_long_string(res["instances"])))
        return {**inputs, **res}

    def _run_transformer(self, inputs: dict):
        """Run the transformer function.

        This function needs to loads the assets in `locals` with their
        original variable names, so that the function can resolve them
        """
        log.info("Running preprocessing function...")
        res = []
        for instance in inputs["instances"]:
            res.append(self.fn(instance))
        return {"instances": res}

    def postprocess(self, inputs: list) -> list:
        """Postprocess input data."""
        return inputs
