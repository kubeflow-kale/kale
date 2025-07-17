"use strict";
/*
 * Copyright 2020 The Kale Authors
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
const yaml = __importStar(require("js-yaml"));
const core_1 = require("@material-ui/core");
const Help_1 = __importDefault(require("@material-ui/icons/Help"));
const Error_1 = __importDefault(require("@material-ui/icons/Error"));
const CheckCircle_1 = __importDefault(require("@material-ui/icons/CheckCircle"));
const statusRunning_1 = __importDefault(require("../../icons/statusRunning"));
const LightTooltip_1 = require("../../components/LightTooltip");
const DeployUtils_1 = __importDefault(require("./DeployUtils"));
const Utils_1 = require("../../lib/Utils");
var KatibExperimentStatus;
(function (KatibExperimentStatus) {
    KatibExperimentStatus["CREATED"] = "Created";
    KatibExperimentStatus["RUNNING"] = "Running";
    KatibExperimentStatus["RESTARTING"] = "Restarting";
    KatibExperimentStatus["SUCCEEDED"] = "Succeeded";
    KatibExperimentStatus["FAILED"] = "Failed";
    KatibExperimentStatus["UNKNOWN"] = "Unknown";
})(KatibExperimentStatus || (KatibExperimentStatus = {}));
var KatibExperimentStatusReason;
(function (KatibExperimentStatusReason) {
    KatibExperimentStatusReason["CREATED"] = "ExperimentCreated";
    KatibExperimentStatusReason["RUNNING"] = "ExperimentRunning";
    KatibExperimentStatusReason["RESTARTING"] = "ExperimentRestarting";
    KatibExperimentStatusReason["GOAL_REACHED"] = "ExperimentGoalReached";
    KatibExperimentStatusReason["MAX_TRIALS_REACHED"] = "ExperimentMaxTrialsReached";
    KatibExperimentStatusReason["SUGGESTION_END_REACHED"] = "ExperimentSuggestionEndReached";
    KatibExperimentStatusReason["FAILED"] = "ExperimentFailed";
    KatibExperimentStatusReason["KILLED"] = "ExperimentKilled";
})(KatibExperimentStatusReason || (KatibExperimentStatusReason = {}));
var KatibExperimentStatusMessage;
(function (KatibExperimentStatusMessage) {
    KatibExperimentStatusMessage["SUGGESTION_EXHAUSTED"] = "Suggestion is exhausted";
})(KatibExperimentStatusMessage || (KatibExperimentStatusMessage = {}));
exports.KatibProgress = props => {
    // Katib controller sets experiment's status, along with a reason and
    // message for the status. If the experiment is 'Succeeded' or 'Failed' and
    // the reason is 'MaxTrialsReached' or 'SuggestionEndReached' or there's a
    // message regarding Suggestion exhaustion, then we can derive that the goal
    // was not reached.
    const isKatibGoalNotReached = (experiment) => {
        const isSucceedOrFailed = experiment.status === KatibExperimentStatus.SUCCEEDED ||
            experiment.status === KatibExperimentStatus.FAILED;
        const isMaxTrialsOrEndReached = experiment.reason === KatibExperimentStatusReason.MAX_TRIALS_REACHED ||
            experiment.reason === KatibExperimentStatusReason.SUGGESTION_END_REACHED;
        const isExhausted = experiment.message === KatibExperimentStatusMessage.SUGGESTION_EXHAUSTED;
        return isSucceedOrFailed && (isMaxTrialsOrEndReached || isExhausted);
    };
    const getKatibBestResultInfo = (experiment) => {
        let optimal = experiment ? experiment.currentOptimalTrial : null;
        // currentOptimalTrial is _never_ null,
        // so if there's no best trial so far we don't show the object
        return optimal && optimal.bestTrialName
            ? [yaml.safeDump(optimal)]
            : [
                'There are no results yet',
                'To have a result, there must be at least one successful trial',
            ];
    };
    const getKatibBestResultBadge = (experiment) => {
        return (React.createElement(LightTooltip_1.LightTooltip, { title: 'Show current best result', placement: "top-start", TransitionComponent: core_1.Zoom }, DeployUtils_1.default.getInfoBadge('Katib current best result', getKatibBestResultInfo(experiment))));
    };
    const getText = (experiment) => {
        switch (experiment.status) {
            case KatibExperimentStatus.FAILED:
                return isKatibGoalNotReached(experiment) ? 'GoalNotReached' : 'Failed';
            case KatibExperimentStatus.SUCCEEDED:
                return 'Done';
            default:
                return 'View';
        }
    };
    const getStatusWarningBadge = (experiment, tooltip) => {
        const title = experiment.status === KatibExperimentStatus.SUCCEEDED
            ? 'Experiment succeeded!'
            : 'Experiment failed!';
        return (React.createElement(LightTooltip_1.LightTooltip, { title: tooltip, placement: "top-start", TransitionComponent: core_1.Zoom }, DeployUtils_1.default.getWarningBadge(title, [
            tooltip,
            `Status: ${experiment.status}`,
            `Reason: ${experiment.reason}`,
            `Message: ${experiment.message}`,
        ])));
    };
    const getComponent = (experiment) => {
        let tooltipSet = false;
        let styles = { color: '#5f6368', height: 18, width: 18 };
        let IconComponent = React.createElement(Help_1.default, { style: styles });
        switch (experiment.status) {
            case KatibExperimentStatus.SUCCEEDED:
            case KatibExperimentStatus.FAILED:
                isKatibGoalNotReached(experiment)
                    ? (() => {
                        tooltipSet = true;
                        IconComponent = getStatusWarningBadge(experiment, 'The experiment has completed but the goal was not reached');
                    })()
                    : (IconComponent =
                        experiment.status === KatibExperimentStatus.SUCCEEDED ? (React.createElement(CheckCircle_1.default, { style: Object.assign(Object.assign({}, styles), { color: DeployUtils_1.default.color.success }) })) : (React.createElement(Error_1.default, { style: Object.assign(Object.assign({}, styles), { color: DeployUtils_1.default.color.errorText }) })));
                break;
            case KatibExperimentStatus.CREATED:
            case KatibExperimentStatus.RUNNING:
            case KatibExperimentStatus.RESTARTING:
                IconComponent = (React.createElement(statusRunning_1.default, { style: Object.assign(Object.assign({}, styles), { color: DeployUtils_1.default.color.blue }) }));
                break;
            default:
                break;
        }
        return tooltipSet ? (React.createElement(React.Fragment, null,
            React.createElement(KatibExperimentLink, { experiment: experiment }, getText(experiment)),
            IconComponent)) : (React.createElement(React.Fragment, null,
            React.createElement(KatibExperimentLink, { experiment: experiment },
                getText(experiment),
                IconComponent)));
    };
    let katibTpl;
    if (!props.experiment) {
        katibTpl = React.createElement(core_1.LinearProgress, { color: "primary" });
    }
    else if (props.experiment.status == 'error') {
        katibTpl = (React.createElement(React.Fragment, null,
            React.createElement(Error_1.default, { style: { color: DeployUtils_1.default.color.errorText, height: 18, width: 18 } })));
    }
    else {
        katibTpl = getComponent(props.experiment);
    }
    let katibRunsTpl = undefined;
    if (!props.experiment || props.experiment.trials === 0) {
        katibRunsTpl = (React.createElement(React.Fragment, null,
            React.createElement("div", { className: "deploy-progress-label" }, "Gathering suggestions..."),
            React.createElement("div", { className: "deploy-progress-value" },
                React.createElement(core_1.LinearProgress, { color: "primary" }))));
    }
    else if (props.experiment.status !== 'error') {
        // we have some katib trials
        katibRunsTpl = (React.createElement(React.Fragment, null,
            React.createElement("div", { className: "deploy-progress-label labels-indented" },
                React.createElement("p", null,
                    "Running: ",
                    props.experiment.trialsRunning),
                React.createElement("p", null,
                    "Succeeded: ",
                    props.experiment.trialsSucceeded),
                React.createElement("p", null,
                    "Failed: ",
                    props.experiment.trialsFailed))));
    }
    return (React.createElement("div", null,
        React.createElement("div", { className: "deploy-progress-row", style: { borderBottom: 'transparent', paddingBottom: 0 } },
            React.createElement("div", { className: "deploy-progress-label" }, "Running Katib experiment..."),
            React.createElement("div", { className: "deploy-progress-value" },
                katibTpl,
                getKatibBestResultBadge(props.experiment))),
        React.createElement("div", { className: "deploy-progress-row" }, katibRunsTpl)));
};
const KatibExperimentLink = ({ experiment, children }) => {
    var _a;
    const [link, setLink] = React.useState('#');
    React.useEffect(() => {
        updateLink(experiment);
    });
    const updateLink = (experiment) => {
        if (!experiment || !experiment.name || !experiment.namespace) {
            return;
        }
        // Initialize link to KWA. If it is not available, point to legacy Katib UI
        const kwaLink = `/katib/experiment/${experiment.name}?ns=${experiment.namespace}`;
        const legacyLink = `/katib/?ns=${experiment.namespace}#/katib/hp_monitor/${experiment.namespace}/${experiment.name}`;
        Utils_1.headURL(kwaLink)
            .then(res => {
            if (res && res.status >= 200 && res.status < 400) {
                setLink(kwaLink);
            }
            else {
                setLink(legacyLink);
            }
        })
            .catch(() => {
            setLink(legacyLink);
        });
    };
    return (React.createElement("a", { href: link, target: "_blank", rel: "noopener noreferrer" }, children || ((_a = experiment) === null || _a === void 0 ? void 0 : _a.name)));
};
