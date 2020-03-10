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

import { RESERVED_CELL_NAMES_CHIP_COLOR } from './CellMetadataEditor';

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

export default class ColorUtils {
  public static intToRGB(i: number) {
    const c = (i & 0x00ffffff).toString(16).toUpperCase();
    return '00000'.substring(0, 6 - c.length) + c;
  }

  public static hashString(str: string): number {
    // http://erlycoder.com/49/javascript-hash-functions-to-convert-string-into-integer-hash-
    // #a9a9a9  skip
    // #008000  imports
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = char + (hash << 6) + (hash << 16) - hash;
    }
    return Math.abs(hash);
  }

  public static getColorIndex(value: string): number {
    return this.hashString(value) % colorPool.length;
  }

  public static getColor(value: string): string {
    if (!value) {
      return '';
    }

    if (value in RESERVED_CELL_NAMES_CHIP_COLOR) {
      return RESERVED_CELL_NAMES_CHIP_COLOR[value];
    }
    return this.intToRGB(this.hashString(value));
  }
}
