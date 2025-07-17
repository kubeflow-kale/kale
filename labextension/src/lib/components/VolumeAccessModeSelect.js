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
const Select_1 = require("./Select");
const VOLUME_ACCESS_MODE_ROM = {
    label: 'ReadOnlyMany',
    value: 'rom',
};
const VOLUME_ACCESS_MODE_RWO = {
    label: 'ReadWriteOnce',
    value: 'rwo',
};
const VOLUME_ACCESS_MODE_RWM = {
    label: 'ReadWriteMany',
    value: 'rwm',
};
const VOLUME_ACCESS_MODES = [
    VOLUME_ACCESS_MODE_ROM,
    VOLUME_ACCESS_MODE_RWO,
    VOLUME_ACCESS_MODE_RWM,
];
exports.VolumeAccessModeSelect = props => {
    return (React.createElement(Select_1.Select, { variant: "standard", label: "Volume access mode", index: -1, values: VOLUME_ACCESS_MODES, value: props.value, updateValue: props.updateValue }));
};
