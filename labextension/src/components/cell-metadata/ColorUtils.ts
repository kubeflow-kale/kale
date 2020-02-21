import {RESERVED_CELL_NAMES_CHIP_COLOR} from './CellMetadataEditor'

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
            const c = (i & 0x00FFFFFF)
                .toString(16)
                .toUpperCase();
            return "00000".substring(0, 6 - c.length) + c;
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

    public static getColorIndex(value: string): number  {
        return this.hashString(value) % colorPool.length;
    }

    public static getColor(value: string): string {
        if (!value) {
            return '';
        }

        if (value in RESERVED_CELL_NAMES_CHIP_COLOR){
            return  RESERVED_CELL_NAMES_CHIP_COLOR[value];
        }
        return this.intToRGB(this.hashString(value))
    }

}