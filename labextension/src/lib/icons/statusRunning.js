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
// import { CSSProperties } from 'jss/css';
class StatusRunning extends React.Component {
    render() {
        const { style } = this.props;
        return (React.createElement("svg", { width: style.width, height: style.height, viewBox: "0 0 18 18" },
            React.createElement("g", { transform: "translate(-450, -307)", fill: style.color, fillRule: "nonzero" },
                React.createElement("g", { transform: "translate(450, 266)" },
                    React.createElement("g", { transform: "translate(0, 41)" },
                        React.createElement("path", { d: "M9,4 C6.23857143,4 4,6.23857143 4,9 C4,11.7614286 6.23857143,14 9,14\r\n                C11.7614286,14 14,11.7614286 14,9 C14,8.40214643 13.8950716,7.8288007\r\n                13.702626,7.29737398 L15.2180703,5.78192967 C15.7177126,6.74539838\r\n                16,7.83973264 16,9 C16,12.866 12.866,16 9,16 C5.134,16 2,12.866 2,9 C2,5.134\r\n                5.134,2 9,2 C10.933,2 12.683,2.7835 13.94975,4.05025 L12.7677679,5.23223214\r\n                L9,9 L9,4 Z" }))))));
    }
}
exports.default = StatusRunning;
