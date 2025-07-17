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
const Input_1 = require("./Input");
const RokInput_1 = require("./RokInput");
const core_1 = require("@material-ui/core");
const Delete_1 = __importDefault(require("@material-ui/icons/Delete"));
exports.AnnotationInput = props => {
    const [annotation, setAnnotation] = React.useState({ key: '', value: '' });
    React.useEffect(() => {
        // need this to set the annotation when the notebook is loaded
        // and the metadata is updated
        setAnnotation(Object.assign({}, props.annotation));
    }, [props.annotation]);
    const updateKey = (key) => {
        props.updateValue(Object.assign(Object.assign({}, props.annotation), { key: key }), props.volumeIdx, props.annotationIdx);
    };
    const updateValue = (value) => {
        props.updateValue(Object.assign(Object.assign({}, props.annotation), { value: value }), props.volumeIdx, props.annotationIdx);
    };
    const valueField = props.rokAvailable && props.annotation.key === 'rok/origin' ? (React.createElement(RokInput_1.RokInput, { updateValue: updateValue, value: props.annotation.value, label: "Rok URL", inputIndex: props.volumeIdx, annotationIdx: props.annotationIdx })) : (React.createElement(Input_1.Input, { updateValue: updateValue, value: props.annotation.value, label: "Value", inputIndex: props.volumeIdx, variant: "standard" }));
    return (React.createElement("div", { className: "toolbar" },
        React.createElement("div", { style: { marginRight: '10px', width: '50%' } },
            React.createElement(Input_1.Input, { updateValue: updateKey, value: props.annotation.key, label: "Key", inputIndex: props.volumeIdx, readOnly: props.cannotBeDeleted || false, variant: "standard" })),
        React.createElement("div", { style: { width: '50%' } }, valueField),
        !props.cannotBeDeleted ? (React.createElement("div", { className: "delete-button" },
            React.createElement(core_1.Button, { variant: "contained", size: "small", title: "Remove Annotation", onClick: _ => props.deleteValue(props.volumeIdx, props.annotationIdx), style: { transform: 'scale(0.9)' } },
                React.createElement(Delete_1.default, null)))) : null));
};
