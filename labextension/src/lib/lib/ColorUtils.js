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
Object.defineProperty(exports, "__esModule", { value: true });
const CellMetadataEditor_1 = require("../widgets/cell-metadata/CellMetadataEditor");
const colorPool = [
    '#695181',
    '#F25D5D',
    '#7C74E4',
    '#E8DD53',
    '#EA9864',
    '#888888',
    '#50D3D4',
    '#B85DAE',
    '#489781',
    '#50A9D4',
];
class ColorUtils {
    static intToRGB(i) {
        const c = (i & 0x00ffffff).toString(16).toUpperCase();
        return '00000'.substring(0, 6 - c.length) + c;
    }
    static hashString(str) {
        // Append a random string in in order to prevent generation for similar
        // hashes from similar strings which will cause nearly identical colors in
        // UI
        str = str + 'pz8';
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = char + (hash << 6) + (hash << 16) - hash;
        }
        return Math.abs(hash);
    }
    static getColorIndex(value) {
        return this.hashString(value) % colorPool.length;
    }
    static getColor(value) {
        if (!value) {
            return '';
        }
        if (value in CellMetadataEditor_1.RESERVED_CELL_NAMES_CHIP_COLOR) {
            return CellMetadataEditor_1.RESERVED_CELL_NAMES_CHIP_COLOR[value];
        }
        return this.intToRGB(this.hashString(value));
    }
}
exports.default = ColorUtils;
