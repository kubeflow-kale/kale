"use strict";
/*
 * Copyright 2019-2020 The Kale Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const React = __importStar(require("react"));
const DeployProgress_1 = require("./DeployProgress");
exports.DeploysProgress = props => {
    const [items, setItems] = React.useState([]);
    const getItems = (_deploys) => {
        return Object.entries(_deploys)
            .filter((dp) => !dp[1].deleted)
            .map((dp) => {
            const index = dp[0];
            const dpState = dp[1];
            return (React.createElement(DeployProgress_1.DeployProgress, { key: `d-${index}`, showValidationProgress: dpState.showValidationProgress, notebookValidation: dpState.notebookValidation, validationWarnings: dpState.validationWarnings, showSnapshotProgress: dpState.showSnapshotProgress, task: dpState.task, snapshotWarnings: dpState.snapshotWarnings, showCompileProgress: dpState.showCompileProgress, compiledPath: dpState.compiledPath, compileWarnings: dpState.compileWarnings, showUploadProgress: dpState.showUploadProgress, pipeline: dpState.pipeline, uploadWarnings: dpState.uploadWarnings, showRunProgress: dpState.showRunProgress, runPipeline: dpState.runPipeline, runWarnings: dpState.runWarnings, showKatibProgress: dpState.showKatibProgress, katib: dpState.katib, showKatibKFPExperiment: dpState.showKatibKFPExperiment, katibKFPExperiment: dpState.katibKFPExperiment, onRemove: _onPanelRemove(+index), docManager: dpState.docManager, namespace: dpState.namespace }));
        });
    };
    const _onPanelRemove = (index) => {
        return () => {
            console.log('remove', index);
            props.onPanelRemove(index);
        };
    };
    React.useEffect(() => {
        setItems(getItems(props.deploys));
    }, [props.deploys]); // Only re-run the effect if props.deploys changes
    return React.createElement("div", { className: "deploys-progress" }, items);
};
