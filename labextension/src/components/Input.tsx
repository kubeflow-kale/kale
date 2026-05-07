// Copyright 2026 The Kubeflow Authors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import React, { useState } from 'react';
import TextField, { TextFieldProps } from '@mui/material/TextField';
import { styled } from '@mui/material/styles';

const StyledTextField = styled(TextField)({
  width: '100%',
  '& .MuiInputLabel-root': {
    color: 'var(--jp-input-border-color)',
    fontSize: 'var(--jp-ui-font-size2)',
  },
  '& .MuiInputBase-input': {
    color: 'var(--jp-ui-font-color1)',
  },
  '& .MuiFormHelperText-root': {
    color: 'var(--jp-info-color0)',
    wordBreak: 'break-word',
  },
});

export interface IInputProps extends Omit<
  TextFieldProps,
  'onChange' | 'value' | 'InputProps'
> {
  value: string | number;
  regex?: string;
  regexErrorMsg?: string;
  maxLength?: number;
  maxLengthErrorMsg?: string;
  inputIndex?: number;
  helperText?: string;
  readOnly?: boolean;
  validation?: 'int' | 'double';
  variant?: 'standard' | 'outlined' | 'filled';
  updateValue: (value: string, index: number) => void;
  onBeforeUpdate?: (value: string) => boolean;
}

export const Input: React.FunctionComponent<IInputProps> = props => {
  const {
    value: propsValue,
    className,
    helperText = null,
    regex,
    regexErrorMsg,
    maxLength,
    maxLengthErrorMsg,
    validation,
    placeholder,
    inputIndex,
    readOnly = false,
    variant = 'outlined',
    updateValue,
    onBeforeUpdate,
    ...rest
  } = props;

  const [beforeUpdateError, setBeforeUpdateError] = useState(false);

  const getRegex = (): string | RegExp | undefined => {
    if (regex) {
      return regex;
    }
    if (validation === 'int') {
      return /^(-\d)?\d*$/;
    }
    if (validation === 'double') {
      return /^(-\d)?\d*(\.\d)?\d*$/;
    }
    return undefined;
  };

  const getRegexMessage = (): string | undefined => {
    if (regexErrorMsg) {
      return regexErrorMsg;
    }
    if (validation === 'int') {
      return 'Integer value required';
    }
    if (validation === 'double') {
      return 'Double value required';
    }
    return undefined;
  };

  const value = String(propsValue);
  const regexPattern = getRegex();
  const regexError =
    regexPattern !== undefined && value !== ''
      ? !new RegExp(regexPattern).test(value)
      : false;
  const maxLengthError =
    maxLength !== undefined ? value.length > maxLength : false;
  const error = regexError || maxLengthError || beforeUpdateError;

  const getErrorMessage = (): string | undefined => {
    if (maxLengthError) {
      return (
        maxLengthErrorMsg ??
        `Must be ${maxLength} characters or fewer (currently ${value.length})`
      );
    }
    return getRegexMessage();
  };

  const handleChange = (evt: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = evt.target.value;
    if (onBeforeUpdate) {
      const hasError = onBeforeUpdate(newValue);
      setBeforeUpdateError(hasError);
    }
    updateValue(newValue, inputIndex || 0);
  };

  return (
    <StyledTextField
      {...rest}
      variant={variant}
      className={className}
      error={error}
      sx={
        error
          ? {
              '& .MuiInputLabel-root': { color: 'error.main' },
              '& .MuiInputBase-input': { color: 'error.main' },
              '& .MuiFormHelperText-root': { color: 'error.main' },
            }
          : undefined
      }
      value={value}
      margin="dense"
      placeholder={placeholder}
      spellCheck={false}
      helperText={error ? getErrorMessage() : helperText}
      slotProps={{
        input: {
          readOnly: readOnly,
        },
        inputLabel: {
          shrink: !!placeholder || value !== '',
        },
      }}
      onChange={handleChange}
    />
  );
};
