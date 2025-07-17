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
Object.defineProperty(exports, "__esModule", { value: true });
const React = __importStar(require("react"));
const Input_1 = require("./Input");
const core_1 = require("@material-ui/core");
const styles_1 = require("@material-ui/core/styles");
exports.AdvancedSettings = props => {
    const [collapsed, setCollapsed] = React.useState(true);
    const theme = styles_1.useTheme();
    return (React.createElement("div", { className: '' + (!collapsed && 'jp-Collapse-open') },
        React.createElement("div", { className: "jp-Collapse-header kale-header", onClick: _ => setCollapsed(!collapsed), style: { color: theme.kale.headers.main } }, props.title),
        React.createElement("div", { className: 'input-container lm-Panel jp-Collapse-contents ' +
                (collapsed && 'p-mod-hidden') },
            React.createElement(Input_1.Input, { label: "Docker image", updateValue: props.dockerChange, value: props.dockerImageValue, placeholder: props.dockerImageDefaultValue, variant: "standard" }),
            React.createElement("div", { className: "toolbar", style: { padding: '12px 4px 0 4px' } },
                React.createElement("div", { className: "switch-label" }, "Debug"),
                React.createElement(core_1.Switch, { checked: props.debug, onChange: _ => props.changeDebug(), color: "primary", name: "enableKale", inputProps: { 'aria-label': 'primary checkbox' } })),
            React.createElement("div", { className: "kale-component", key: "kale-component-volumes" },
                React.createElement("div", { className: "kale-header-switch" },
                    React.createElement("p", { className: "kale-header", style: { color: theme.kale.headers.main } }, "Volumes")),
                props.volsPanel))));
};
