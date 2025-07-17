import * as React from 'react';
interface SelectMultiProps {
    id: string;
    label: string;
    style?: unknown;
    selected: string[];
    disabled?: boolean;
    options: {
        value: string;
        color: string;
    }[];
    variant?: 'filled' | 'standard' | 'outlined';
    updateSelected: Function;
}
export declare const SelectMulti: React.FunctionComponent<SelectMultiProps>;
export {};
