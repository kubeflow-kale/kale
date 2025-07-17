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
const core_1 = require("@material-ui/core");
const ColorUtils_1 = __importDefault(require("../../lib/ColorUtils"));
const Input_1 = require("../../components/Input");
const Select_1 = require("../../components/Select");
const GPU_TYPES = [
    { value: 'nvidia.com/gpu', label: 'Nvidia' },
    { value: 'amd.com/gpu', label: 'AMD' },
];
const DEFAULT_GPU_TYPE = GPU_TYPES[0].value;
exports.CellMetadataEditorDialog = props => {
    const handleClose = () => {
        props.toggleDialog();
    };
    const limitAction = (action, limitKey, limitValue = null) => {
        return {
            action,
            limitKey,
            limitValue,
        };
    };
    // intersect the current limits and the GPU_TYPES. Assume there is at most 1.
    const gpuType = Object.keys(props.limits).filter(x => GPU_TYPES.map(t => t.value).includes(x))[0] || undefined;
    const gpuCount = props.limits[gpuType] || undefined;
    return (React.createElement(core_1.Dialog, { open: props.open, onClose: handleClose, fullWidth: true, maxWidth: 'sm', scroll: "paper", "aria-labelledby": "scroll-dialog-title", "aria-describedby": "scroll-dialog-description" },
        React.createElement(core_1.DialogTitle, { id: "scroll-dialog-title" },
            React.createElement(core_1.Grid, { container: true, direction: "row", justify: "space-between", alignItems: "center" },
                React.createElement(core_1.Grid, { item: true, xs: 9 },
                    React.createElement(core_1.Grid, { container: true, direction: "row", justify: "flex-start", alignItems: "center" },
                        React.createElement("p", null, "Require GPU for step "),
                        React.createElement(core_1.Chip, { className: 'kale-chip', style: {
                                marginLeft: '10px',
                                backgroundColor: `#${ColorUtils_1.default.getColor(props.stepName)}`,
                            }, key: props.stepName, label: props.stepName }))),
                React.createElement(core_1.Grid, { item: true, xs: 3 },
                    React.createElement(core_1.Grid, { container: true, direction: "row", justify: "flex-end", alignItems: "center" },
                        React.createElement(core_1.Switch, { checked: gpuType !== undefined, onChange: c => {
                                if (c.target.checked) {
                                    // default value
                                    props.updateLimits([
                                        limitAction('update', DEFAULT_GPU_TYPE, '1'),
                                    ]);
                                }
                                else {
                                    props.updateLimits([limitAction('delete', gpuType)]);
                                }
                            }, color: "primary", name: "enableKale", inputProps: { 'aria-label': 'primary checkbox' }, classes: { root: 'material-switch' } }))))),
        React.createElement(core_1.DialogContent, { dividers: true, style: { paddingTop: 0 } },
            React.createElement(core_1.Grid, { container: true, direction: "column", justify: "center", alignItems: "center" },
                React.createElement(core_1.Grid, { container: true, direction: "row", justify: "space-between", alignItems: "center", style: { marginTop: '15px' } },
                    React.createElement(core_1.Grid, { item: true, xs: 6 },
                        React.createElement(Input_1.Input, { disabled: gpuType === undefined, variant: "outlined", label: "GPU Count", value: gpuCount || 1, updateValue: (v) => props.updateLimits([limitAction('update', gpuType, v)]), style: { width: '95%' } })),
                    React.createElement(core_1.Grid, { item: true, xs: 6 },
                        React.createElement(Select_1.Select, { disabled: gpuType === undefined, updateValue: (v) => {
                                props.updateLimits([
                                    limitAction('delete', gpuType),
                                    limitAction('update', v, gpuCount),
                                ]);
                            }, values: GPU_TYPES, value: gpuType || DEFAULT_GPU_TYPE, label: "GPU Type", index: 0, variant: "outlined" }))))),
        React.createElement(core_1.DialogActions, null,
            React.createElement(core_1.Button, { onClick: handleClose, color: "primary" }, "Ok"))));
};
