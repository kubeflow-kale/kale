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
Object.defineProperty(exports, "__esModule", { value: true });
exports.wait = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};
exports.removeIdxFromArray = (index, arr) => {
    return arr.slice(0, index).concat(arr.slice(index + 1, arr.length));
};
exports.updateIdxInArray = (element, index, arr) => {
    return arr
        .slice(0, index)
        .concat([element])
        .concat(arr.slice(index + 1, arr.length));
};
function fetchTimeout(url, ms, _a = {}) {
    var options = __rest(_a, []);
    const controller = new AbortController();
    const promise = fetch(url, Object.assign({ signal: controller.signal }, options));
    const timeout = setTimeout(() => controller.abort(), ms);
    return promise.then(r => r, () => clearTimeout(timeout));
}
function headURL(href, origin = window.location.origin, timeout = 1500) {
    return fetchTimeout(new URL(href, origin).toString(), timeout, {
        method: 'HEAD',
    });
}
exports.headURL = headURL;
