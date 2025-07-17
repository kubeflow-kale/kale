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
const Button_1 = __importDefault(require("@material-ui/core/Button"));
const InputAdornment_1 = __importDefault(require("@material-ui/core/InputAdornment"));
const BrowseInRokBlue_1 = __importDefault(require("../icons/BrowseInRokBlue"));
const Input_1 = require("./Input");
let popupChooser;
exports.RokInput = props => {
    const { annotationIdx } = props, rest = __rest(props, ["annotationIdx"]);
    const state = React.useState({
        chooserId: 'vol:' + rest.inputIndex + 'annotation:' + annotationIdx,
        origin: window.location.origin,
    });
    const openFileChooser = () => {
        const mode = 'file';
        let create = false;
        if (rest.label) {
            const temp = rest.label;
        }
        const goTo = `${state[0].origin}/rok/buckets?mode=${mode}-chooser` +
            `&create=${create}` +
            `&chooser-id=${state[0].chooserId}`;
        if (popupChooser && !popupChooser.closed) {
            popupChooser.window.location.href = goTo;
            popupChooser.focus();
            return;
        }
        popupChooser = window.open(`${state[0].origin}/rok/buckets?mode=${mode}-chooser` +
            `&create=${create}` +
            `&chooser-id=${state[0].chooserId}`, 'Chooser', `height=500,width=600,menubar=0`);
    };
    React.useEffect(() => {
        const handleMessage = (event) => {
            if (event.origin !== state[0].origin) {
                return;
            }
            if (typeof event.data === 'object' &&
                event.data.hasOwnProperty('chooser') &&
                event.data.hasOwnProperty('chooserId') &&
                event.data.chooserId === state[0].chooserId) {
                rest.updateValue(event.data.chooser, rest.inputIndex);
                popupChooser.close();
            }
        };
        window.addEventListener('message', handleMessage);
        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, []);
    const InputProps = {
        endAdornment: (React.createElement(InputAdornment_1.default, { position: "end" },
            React.createElement(Button_1.default, { color: "secondary", id: "chooseRokFileBtn", onClick: openFileChooser, style: { padding: '0px', minWidth: '0px' } },
                React.createElement(BrowseInRokBlue_1.default, null)))),
    };
    return React.createElement(Input_1.Input, Object.assign({ InputProps: InputProps }, rest));
};
