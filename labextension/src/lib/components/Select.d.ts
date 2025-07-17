import * as React from 'react';
import { BaseTextFieldProps } from '@material-ui/core/TextField';
export interface ISelectOption {
    label: string;
    value: string;
    tooltip?: any;
    invalid?: boolean;
}
interface SelectProps extends BaseTextFieldProps {
    index: number;
    values: ISelectOption[];
    variant?: 'filled' | 'standard' | 'outlined';
    updateValue: Function;
}
export declare const Select: React.FunctionComponent<SelectProps>;
export {};
