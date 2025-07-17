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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
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
const use_debounce_1 = require("use-debounce");
const TextField_1 = __importDefault(require("@material-ui/core/TextField"));
const styles_1 = require("@material-ui/core/styles");
const useStyles = styles_1.makeStyles(() => styles_1.createStyles({
    label: {
        color: 'var(--jp-input-border-color)',
        fontSize: 'var(--jp-ui-font-size2)',
    },
    input: {
        color: 'var(--jp-ui-font-color1)',
    },
    textField: {
        width: '100%',
    },
    helperLabel: {
        color: 'var(--jp-info-color0)',
    },
}));
exports.Input = props => {
    const [value, setValue] = React.useState('');
    const [error, updateError] = React.useState(false);
    const classes = useStyles({});
    const { value: propsValue, className, helperText = null, regex, regexErrorMsg, validation, placeholder, inputIndex, readOnly = false, variant = 'outlined', InputProps, updateValue, onBeforeUpdate = undefined } = props, rest = __rest(props, ["value", "className", "helperText", "regex", "regexErrorMsg", "validation", "placeholder", "inputIndex", "readOnly", "variant", "InputProps", "updateValue", "onBeforeUpdate"]);
    const getRegex = () => {
        if (regex) {
            return regex;
        }
        else if (validation && validation == 'int') {
            return /^(-\d)?\d*$/;
        }
        else if (validation && validation == 'double') {
            return /^(-\d)?\d*(\.\d)?\d*$/;
        }
        else {
            return undefined;
        }
    };
    const getRegexMessage = () => {
        if (regexErrorMsg) {
            return regexErrorMsg;
        }
        else if (validation && validation == 'int') {
            return 'Integer value required';
        }
        else if (validation && validation == 'double') {
            return 'Double value required';
        }
        else {
            return undefined;
        }
    };
    const onChange = (value, index) => {
        // if the input domain is restricted by a regex
        if (!getRegex()) {
            updateValue(value, index);
            return;
        }
        let re = new RegExp(getRegex());
        if (!re.test(value)) {
            updateError(true);
        }
        else {
            updateError(false);
            updateValue(value, index);
        }
    };
    React.useEffect(() => {
        // need this to set the value when the notebook is loaded and the metadata
        // is updated
        setValue(propsValue);
    }, [propsValue]); // Only re-run the effect if propsValue changes
    const [debouncedCallback] = use_debounce_1.useDebouncedCallback(
    // function
    (value, idx) => {
        onChange(value, idx);
    }, 
    // delay in ms
    500);
    return (
    // @ts-ignore
    React.createElement(TextField_1.default, Object.assign({}, rest, { variant: variant, className: classes.textField, error: error, value: value, margin: "dense", placeholder: placeholder, spellCheck: false, helperText: error ? getRegexMessage() : helperText, InputProps: Object.assign({ classes: { root: classes.input }, readOnly: readOnly }, InputProps), InputLabelProps: {
            classes: { root: classes.label },
            shrink: !!placeholder || value !== '',
        }, FormHelperTextProps: { classes: { root: classes.helperLabel } }, onChange: evt => {
            setValue(evt.target.value);
            if (!onBeforeUpdate) {
                debouncedCallback(evt.target.value, inputIndex);
            }
            else {
                const r = onBeforeUpdate(evt.target.value);
                if (r) {
                    updateError(true);
                }
                else {
                    updateError(false);
                    debouncedCallback(evt.target.value, inputIndex);
                }
            }
        } })));
};
