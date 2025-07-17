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
const styles_1 = require("@material-ui/core/styles");
const React = __importStar(require("react"));
const react_dom_1 = require("react-dom");
const core_1 = require("@material-ui/core");
const OutlinedInput_1 = __importDefault(require("@material-ui/core/OutlinedInput"));
const FormControl_1 = __importDefault(require("@material-ui/core/FormControl"));
const InputLabel_1 = __importDefault(require("@material-ui/core/InputLabel"));
const Chip_1 = __importDefault(require("@material-ui/core/Chip"));
const ColorUtils_1 = __importDefault(require("../lib/ColorUtils"));
const useStyles = styles_1.makeStyles(() => styles_1.createStyles({
    menu: {
        color: 'var(--jp-ui-font-color1)',
        fontSize: 'var(--jp-ui-font-size2)',
    },
    chips: {
        display: 'flex',
        flexWrap: 'wrap',
    },
    chip: {},
    selectMultiForm: {
        width: '100%',
    },
    label: {
        backgroundColor: 'var(--jp-layout-color1)',
        color: 'var(--jp-input-border-color)',
        fontSize: 'var(--jp-ui-font-size2)',
    },
    input: {
        fontSize: 'var(--jp-ui-font-size2)',
    },
}));
exports.SelectMulti = props => {
    const classes = useStyles({});
    const [inputLabelRef, setInputLabelRef] = React.useState(undefined);
    const labelOffsetWidth = inputLabelRef
        ? react_dom_1.findDOMNode(inputLabelRef).offsetWidth
        : 0;
    const { id, label, options, selected, disabled = false, variant = 'outlined', style = {}, updateSelected, } = props;
    let inputComponent = React.createElement(core_1.Input, { margin: "dense", id: id });
    if (!variant || variant === 'outlined') {
        inputComponent = (React.createElement(OutlinedInput_1.default, { margin: "dense", labelWidth: labelOffsetWidth, id: id }));
    }
    return (React.createElement(FormControl_1.default, { margin: "dense", style: style, variant: variant, disabled: disabled, className: classes.selectMultiForm },
        React.createElement(InputLabel_1.default, { ref: ref => {
                setInputLabelRef(ref);
            }, htmlFor: id, className: classes.label }, label),
        React.createElement(core_1.Select, { multiple: true, MenuProps: { PaperProps: { className: classes.menu } }, onChange: evt => updateSelected(evt.target.value), margin: "dense", variant: variant, input: inputComponent, value: selected, renderValue: elements => (React.createElement("div", { className: classes.chips }, elements.map(value => {
                return (React.createElement(Chip_1.default, { style: { backgroundColor: `#${ColorUtils_1.default.getColor(value)}` }, key: value, label: value, className: `kale-chip kale-chip-select ${classes.chip}` }));
            }))) }, options.map(option => (React.createElement(core_1.MenuItem, { key: option.value, value: option.value }, option.value))))));
};
