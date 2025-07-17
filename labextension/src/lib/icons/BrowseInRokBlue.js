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
class BrowseInRokBLue extends React.Component {
    render() {
        return (React.createElement("svg", { xmlns: "http://www.w3.org/2000/svg", xmlnsXlink: "http://www.w3.org/1999/xlink", style: this.props.style, width: "24", height: "24", viewBox: "0 0 24 24" },
            React.createElement("defs", null,
                React.createElement("path", { id: "a", d: "M15.99 8.404A8 8 0 116.005.251a6.5 6.5 0 008.321 6.49l1.664 1.663z" })),
            React.createElement("g", { fill: "none", fillRule: "evenodd", transform: "translate(-3234 -2346)" },
                React.createElement("g", { transform: "translate(3237 2352)" },
                    React.createElement("mask", { id: "b", fill: "#fff" },
                        React.createElement("use", { xlinkHref: "#a" })),
                    React.createElement("use", { fill: "#4990E2", xlinkHref: "#a" }),
                    React.createElement("path", { fill: "#FFF", fillRule: "nonzero", d: "M3 3v10h10V3H3zM2 2h12v12H2V2z", mask: "url(#b)" }),
                    React.createElement("path", { fill: "#FFF", fillRule: "nonzero", d: "M6 10h4V6H6v4zM5 5h6v6H5V5z", mask: "url(#b)" })),
                React.createElement("path", { fill: "#4990E2", fillRule: "nonzero", d: "M3249.5 2355a2.5 2.5 0 100-5 2.5 2.5 0 000 5zm0 2a4.5 4.5 0 110-9 4.5 4.5 0 010 9z" }),
                React.createElement("path", { fill: "#4990E2", fillRule: "nonzero", d: "M0.793 2.207L4.328 5.743 5.743 4.328 2.207 0.793z", transform: "translate(3251 2354)" }))));
    }
}
exports.default = BrowseInRokBLue;
