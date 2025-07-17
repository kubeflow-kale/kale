import * as React from 'react';
import { OutlinedTextFieldProps } from '@material-ui/core/TextField';
export interface InputProps extends OutlinedTextFieldProps {
    value: string | number;
    regex?: string;
    regexErrorMsg?: string;
    inputIndex?: number;
    helperText?: string;
    readOnly?: boolean;
    validation?: 'int' | 'double';
    variant?: 'standard' | 'outlined' | 'filled';
    updateValue: Function;
    onBeforeUpdate?: (value: string) => boolean;
}
export declare const Input: React.FunctionComponent<InputProps>;
