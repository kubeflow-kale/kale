"use strict";
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
const React = __importStar(require("react"));
const Warning_1 = __importDefault(require("@material-ui/icons/Warning"));
const Info_1 = __importDefault(require("@material-ui/icons/Info"));
const NotebookUtils_1 = __importDefault(require("../../lib/NotebookUtils"));
class DeployUtils {
    static getInfoBadge(title, content) {
        return (content && (React.createElement("a", { onClick: _ => {
                NotebookUtils_1.default.showMessage(title, content);
            } },
            React.createElement(Info_1.default, { style: { color: this.color.blue, height: 18, width: 18 } }))));
    }
    static getWarningBadge(title, content) {
        return (content && (React.createElement("a", { onClick: _ => {
                NotebookUtils_1.default.showMessage(title, content);
            } },
            React.createElement(Warning_1.default, { style: {
                    color: this.color.alert,
                    height: 18,
                    width: 18,
                } }))));
    }
}
exports.default = DeployUtils;
DeployUtils.color = {
    // From kubeflow/pipelines repo
    activeBg: '#eaf1fd',
    alert: '#f9ab00',
    background: '#fff',
    blue: '#4285f4',
    disabledBg: '#ddd',
    divider: '#e0e0e0',
    errorBg: '#fbe9e7',
    errorText: '#d50000',
    foreground: '#000',
    graphBg: '#f2f2f2',
    grey: '#5f6368',
    inactive: '#5f6368',
    lightGrey: '#eee',
    lowContrast: '#80868b',
    secondaryText: 'rgba(0, 0, 0, .88)',
    separator: '#e8e8e8',
    strong: '#202124',
    success: '#34a853',
    successWeak: '#e6f4ea',
    terminated: '#80868b',
    theme: '#1a73e8',
    themeDarker: '#0b59dc',
    warningBg: '#f9f9e1',
    warningText: '#ee8100',
    weak: '#9aa0a6',
    // From Rok repo
    canceled: '#ff992a',
};
