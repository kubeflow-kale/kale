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
const Input_1 = require("./Input");
const Select_1 = require("./Select");
const LeftPanel_1 = require("../widgets/LeftPanel");
const regex = '^[a-z]([-a-z0-9]*[a-z0-9])?$';
const regexErrorMsg = 'Experiment name may consist of alphanumeric ' +
    "characters, '-', and must start with a lowercase character and end with " +
    'a lowercase alphanumeric character.';
exports.ExperimentInput = props => {
    const getName = (x) => {
        const filtered = props.options.filter(o => o.id === x);
        return filtered.length === 0 ? '' : filtered[0].name;
    };
    const updateSelected = (selected, idx) => {
        let value = selected === LeftPanel_1.NEW_EXPERIMENT.id ? '' : getName(selected);
        const experiment = { id: selected, name: value };
        props.updateValue(experiment);
    };
    const updateValue = (value, idx) => {
        const experiment = { name: value, id: LeftPanel_1.NEW_EXPERIMENT.id };
        props.updateValue(experiment);
    };
    const options = props.options.map(o => {
        return { label: o.name, value: o.id };
    });
    return (React.createElement("div", null,
        React.createElement(Select_1.Select, { variant: "standard", label: "Select experiment", values: options, value: props.selected, index: -1, updateValue: updateSelected, helperText: props.loading ? 'Loading...' : null }),
        props.selected === LeftPanel_1.NEW_EXPERIMENT.id ? (React.createElement("div", null,
            React.createElement(Input_1.Input, { updateValue: updateValue, value: props.value, label: "Experiment Name", regex: regex, regexErrorMsg: regexErrorMsg, variant: "standard" }))) : null));
};
