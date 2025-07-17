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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const React = __importStar(require("react"));
const core_1 = require("@material-ui/core");
const Close_1 = __importDefault(require("@material-ui/icons/Close"));
const Launch_1 = __importDefault(require("@material-ui/icons/Launch"));
const Error_1 = __importDefault(require("@material-ui/icons/Error"));
const Help_1 = __importDefault(require("@material-ui/icons/Help"));
const Schedule_1 = __importDefault(require("@material-ui/icons/Schedule"));
const SkipNext_1 = __importDefault(require("@material-ui/icons/SkipNext"));
const CheckCircle_1 = __importDefault(require("@material-ui/icons/CheckCircle"));
const Cancel_1 = __importDefault(require("@material-ui/icons/Cancel"));
const statusRunning_1 = __importDefault(require("../../icons/statusRunning"));
const statusTerminated_1 = __importDefault(require("../../icons/statusTerminated"));
const DeployUtils_1 = __importDefault(require("./DeployUtils"));
const KatibProgress_1 = require("./KatibProgress");
// From kubeflow/pipelines repo
var PipelineStatus;
(function (PipelineStatus) {
    PipelineStatus["ERROR"] = "Error";
    PipelineStatus["FAILED"] = "Failed";
    PipelineStatus["PENDING"] = "Pending";
    PipelineStatus["RUNNING"] = "Running";
    PipelineStatus["SKIPPED"] = "Skipped";
    PipelineStatus["SUCCEEDED"] = "Succeeded";
    PipelineStatus["TERMINATING"] = "Terminating";
    PipelineStatus["TERMINATED"] = "Terminated";
    PipelineStatus["UNKNOWN"] = "Unknown";
})(PipelineStatus || (PipelineStatus = {}));
exports.DeployProgress = props => {
    const getSnapshotLink = (task) => {
        if (!task.result || !task.result.event) {
            return '#';
        }
        const link = `${window.location.origin}/_/rok/buckets/${task.bucket}/files/${task.result.event.object}/versions/${task.result.event.version}`;
        return props.namespace ? `${link}?ns=${props.namespace}` : link;
    };
    const getTaskLink = (task) => {
        const link = `${window.location.origin}/_/rok/buckets/${task.bucket}/tasks/${task.id}`;
        return props.namespace ? `${link}?ns=${props.namespace}` : link;
    };
    const getUploadLink = (pipeline) => {
        // link: /_/pipeline/#/pipelines/details/<id>
        // id = uploadPipeline.pipeline.id
        if (!pipeline.pipeline || !pipeline.pipeline.pipelineid) {
            return '#';
        }
        const link = `${window.location.origin}/_/pipeline/#/pipelines/details/${pipeline.pipeline.pipelineid}/version/${pipeline.pipeline.versionid}`;
        return props.namespace
            ? link.replace('#', `?ns=${props.namespace}#`)
            : link;
    };
    const getRunLink = (run) => {
        // link: /_/pipeline/#/runs/details/<id>
        // id = runPipeline.id
        if (!run.id) {
            return '#';
        }
        const link = `${window.location.origin}/_/pipeline/#/runs/details/${run.id}`;
        return props.namespace
            ? link.replace('#', `?ns=${props.namespace}#`)
            : link;
    };
    const getRunText = (pipeline) => {
        switch (pipeline.status) {
            case null:
            case 'Running':
                return 'View';
            case 'Terminating':
            case 'Failed':
                return pipeline.status;
            default:
                return 'Done';
        }
    };
    const getRunComponent = (pipeline) => {
        let title = 'Unknown status';
        let IconComponent = Help_1.default;
        let iconColor = '#5f6368';
        switch (pipeline.status) {
            case PipelineStatus.ERROR:
                IconComponent = Error_1.default;
                iconColor = DeployUtils_1.default.color.errorText;
                // title = 'Error';
                break;
            case PipelineStatus.FAILED:
                IconComponent = Error_1.default;
                iconColor = DeployUtils_1.default.color.errorText;
                // title = 'Failed';
                break;
            case PipelineStatus.PENDING:
                IconComponent = Schedule_1.default;
                iconColor = DeployUtils_1.default.color.weak;
                // title = 'Pendig';
                break;
            case PipelineStatus.RUNNING:
                IconComponent = statusRunning_1.default;
                iconColor = DeployUtils_1.default.color.blue;
                // title = 'Running';
                break;
            case PipelineStatus.TERMINATING:
                IconComponent = statusRunning_1.default;
                iconColor = DeployUtils_1.default.color.blue;
                // title = 'Terminating';
                break;
            case PipelineStatus.SKIPPED:
                IconComponent = SkipNext_1.default;
                // title = 'Skipped';
                break;
            case PipelineStatus.SUCCEEDED:
                IconComponent = CheckCircle_1.default;
                iconColor = DeployUtils_1.default.color.success;
                // title = 'Succeeded';
                break;
            case PipelineStatus.TERMINATED:
                IconComponent = statusTerminated_1.default;
                iconColor = DeployUtils_1.default.color.terminated;
                // title = 'Terminated';
                break;
            case PipelineStatus.UNKNOWN:
                break;
            default:
                console.error('pipeline status:', pipeline.status);
        }
        return (React.createElement(React.Fragment, null,
            getRunText(pipeline),
            React.createElement(IconComponent, { style: { color: iconColor, height: 18, width: 18 } })));
    };
    const getKatibKfpExperimentLink = (experimentId) => {
        // link: /_/pipeline/#/experiments/details/<ud>
        if (!experimentId) {
            return '#';
        }
        const link = `${window.location.origin}/_/pipeline/#/experiments/details/${experimentId}`;
        return props.namespace
            ? link.replace('#', `?ns=${props.namespace}#`)
            : link;
    };
    const getSnapshotTpl = () => {
        if (!props.task) {
            return (React.createElement(React.Fragment, null,
                "Unknown status",
                React.createElement(Help_1.default, { style: {
                        color: DeployUtils_1.default.color.terminated,
                        height: 18,
                        width: 18,
                    } })));
        }
        if (!['success', 'error', 'canceled'].includes(props.task.status)) {
            const progress = props.task.progress || 0;
            return (React.createElement(core_1.LinearProgress, { variant: "determinate", color: "primary", value: progress }));
        }
        let getLink = () => '#';
        let message = props.task.message;
        let IconComponent = Help_1.default;
        let iconColor = DeployUtils_1.default.color.blue;
        switch (props.task.status) {
            case 'success':
                getLink = getSnapshotLink;
                message = 'Done';
                IconComponent = Launch_1.default;
                break;
            case 'error':
                getLink = getTaskLink;
                IconComponent = Error_1.default;
                iconColor = DeployUtils_1.default.color.errorText;
                break;
            case 'canceled':
                IconComponent = Cancel_1.default;
                getLink = getTaskLink;
                iconColor = DeployUtils_1.default.color.canceled;
                break;
        }
        return (React.createElement(React.Fragment, null,
            React.createElement("a", { href: getLink(props.task), target: "_blank", rel: "noopener noreferrer" },
                message,
                React.createElement(IconComponent, { style: { color: iconColor, height: 18, width: 18 } }))));
    };
    let validationTpl;
    if (props.notebookValidation === true) {
        validationTpl = (React.createElement(React.Fragment, null,
            React.createElement(CheckCircle_1.default, { style: { color: DeployUtils_1.default.color.success, height: 18, width: 18 } })));
    }
    else if (props.notebookValidation === false) {
        validationTpl = (React.createElement(React.Fragment, null,
            React.createElement(Error_1.default, { style: { color: DeployUtils_1.default.color.errorText, height: 18, width: 18 } })));
    }
    else {
        validationTpl = React.createElement(core_1.LinearProgress, { color: "primary" });
    }
    let compileTpl;
    if (props.compiledPath && props.compiledPath !== 'error') {
        compileTpl = (React.createElement(React.Fragment, null,
            React.createElement("a", { onClick: _ => props.docManager.openOrReveal(props.compiledPath) },
                "Done",
                React.createElement(CheckCircle_1.default, { style: { color: DeployUtils_1.default.color.success, height: 18, width: 18 } }))));
    }
    else if (props.compiledPath === 'error') {
        compileTpl = (React.createElement(React.Fragment, null,
            React.createElement(Error_1.default, { style: { color: DeployUtils_1.default.color.errorText, height: 18, width: 18 } })));
    }
    else {
        compileTpl = React.createElement(core_1.LinearProgress, { color: "primary" });
    }
    let uploadTpl;
    if (props.pipeline) {
        uploadTpl = (React.createElement(React.Fragment, null,
            React.createElement("a", { href: getUploadLink(props.pipeline), target: "_blank", rel: "noopener noreferrer" },
                "Done",
                React.createElement(Launch_1.default, { style: { height: 18, width: 18 } }))));
    }
    else if (props.pipeline === false) {
        uploadTpl = (React.createElement(React.Fragment, null,
            React.createElement(Error_1.default, { style: { color: DeployUtils_1.default.color.errorText, height: 18, width: 18 } })));
    }
    else {
        uploadTpl = React.createElement(core_1.LinearProgress, { color: "primary" });
    }
    let runTpl;
    if (props.runPipeline) {
        runTpl = (React.createElement(React.Fragment, null,
            React.createElement("a", { href: getRunLink(props.runPipeline), target: "_blank", rel: "noopener noreferrer" }, getRunComponent(props.runPipeline))));
    }
    else if (props.runPipeline == false) {
        runTpl = (React.createElement(React.Fragment, null,
            React.createElement(Error_1.default, { style: { color: DeployUtils_1.default.color.errorText, height: 18, width: 18 } })));
    }
    else {
        runTpl = React.createElement(core_1.LinearProgress, { color: "primary" });
    }
    let katibKfpExpTpl;
    if (!props.katibKFPExperiment) {
        katibKfpExpTpl = React.createElement(core_1.LinearProgress, { color: "primary" });
    }
    else if (props.katibKFPExperiment.id !== 'error') {
        katibKfpExpTpl = (React.createElement(React.Fragment, null,
            React.createElement("a", { href: getKatibKfpExperimentLink(props.katibKFPExperiment.id), target: "_blank", rel: "noopener noreferrer" },
                "Done",
                React.createElement(Launch_1.default, { style: { fontSize: '1rem' } }))));
    }
    else {
        katibKfpExpTpl = (React.createElement(React.Fragment, null,
            React.createElement(Error_1.default, { style: { color: DeployUtils_1.default.color.errorText, height: 18, width: 18 } })));
    }
    return (React.createElement("div", { className: "deploy-progress" },
        React.createElement("div", { style: {
                justifyContent: 'flex-end',
                textAlign: 'right',
                paddingRight: '4px',
                height: '1rem',
            } },
            React.createElement(Close_1.default, { style: { fontSize: '1rem', cursor: 'pointer' }, onClick: _ => props.onRemove() })),
        props.showValidationProgress ? (React.createElement("div", { className: "deploy-progress-row" },
            React.createElement("div", { className: "deploy-progress-label" }, "Validating notebook..."),
            React.createElement("div", { className: "deploy-progress-value" },
                validationTpl,
                DeployUtils_1.default.getWarningBadge('Validation Warnings', props.validationWarnings)))) : null,
        props.showSnapshotProgress ? (React.createElement("div", { className: "deploy-progress-row" },
            React.createElement("div", { className: "deploy-progress-label" }, "Taking snapshot..."),
            React.createElement("div", { className: "deploy-progress-value" },
                getSnapshotTpl(),
                ' ',
                DeployUtils_1.default.getWarningBadge('Snapshot Warnings', props.snapshotWarnings)))) : null,
        props.showCompileProgress ? (React.createElement("div", { className: "deploy-progress-row" },
            React.createElement("div", { className: "deploy-progress-label" }, "Compiling notebook..."),
            React.createElement("div", { className: "deploy-progress-value" },
                compileTpl,
                DeployUtils_1.default.getWarningBadge('Compile Warnings', props.compileWarnings)))) : null,
        props.showUploadProgress ? (React.createElement("div", { className: "deploy-progress-row" },
            React.createElement("div", { className: "deploy-progress-label" }, "Uploading pipeline..."),
            React.createElement("div", { className: "deploy-progress-value" },
                uploadTpl,
                DeployUtils_1.default.getWarningBadge('Upload Warnings', props.uploadWarnings)))) : null,
        props.showRunProgress ? (React.createElement("div", { className: "deploy-progress-row" },
            React.createElement("div", { className: "deploy-progress-label" }, "Running pipeline..."),
            React.createElement("div", { className: "deploy-progress-value" },
                runTpl,
                DeployUtils_1.default.getWarningBadge('Run Warnings', props.runWarnings)))) : null,
        props.showKatibKFPExperiment ? (React.createElement("div", { className: "deploy-progress-row" },
            React.createElement("div", { className: "deploy-progress-label" }, "Creating KFP experiment..."),
            React.createElement("div", { className: "deploy-progress-value" }, katibKfpExpTpl))) : null,
        props.showKatibProgress ? (React.createElement(KatibProgress_1.KatibProgress, { experiment: props.katib })) : null));
};
