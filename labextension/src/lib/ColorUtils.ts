// SPDX-License-Identifier: Apache-2.0
// Copyright (c) 2019–2025 The Kale Contributors.

import { RESERVED_CELL_NAMES_CHIP_COLOR } from '../widgets/cell-metadata/CellMetadataEditor';

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
