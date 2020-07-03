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

import * as React from 'react';
import { useDebouncedCallback } from 'use-debounce';
import TextField, { OutlinedTextFieldProps } from '@material-ui/core/TextField';
import { createStyles, makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(() =>
  createStyles({
    label: {
      color: 'var(--jp-input-border-color)',
      fontSize: 'var(--jp-ui-font-size2)',
    },
    input: {
      color: 'var(--jp-ui-font-color1)',
    },
    textField: {
      width: '100%',
    },
    helperLabel: {
      color: 'var(--jp-info-color0)',
    },
  }),
);

// @ts-ignore
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

export const Input: React.FunctionComponent<InputProps> = props => {
  const [value, setValue] = React.useState('' as any);
  const [error, updateError] = React.useState(false);
  const classes = useStyles({});

  const {
    value: propsValue,
    className,
    helperText = null,
    regex,
    regexErrorMsg,
    validation,
    placeholder,
    inputIndex,
    readOnly = false,
    variant = 'outlined',
    InputProps,
    updateValue,
    onBeforeUpdate = undefined,
    ...rest
  } = props;

  const getRegex = () => {
    if (regex) {
      return regex;
    } else if (validation && validation == 'int') {
      return /^(-\d)?\d*$/;
    } else if (validation && validation == 'double') {
      return /^(-\d)?\d*(\.\d)?\d*$/;
    } else {
      return undefined;
    }
  };

  const getRegexMessage = () => {
    if (regexErrorMsg) {
      return regexErrorMsg;
    } else if (validation && validation == 'int') {
      return 'Integer value required';
    } else if (validation && validation == 'double') {
      return 'Double value required';
    } else {
      return undefined;
    }
  };

  const onChange = (value: string, index: number) => {
    // if the input domain is restricted by a regex
    if (!getRegex()) {
      updateValue(value, index);
      return;
    }

    let re = new RegExp(getRegex());
    if (!re.test(value)) {
      updateError(true);
    } else {
      updateError(false);
      updateValue(value, index);
    }
  };

  React.useEffect(() => {
    // need this to set the value when the notebook is loaded and the metadata
    // is updated
    setValue(propsValue);
  }, [propsValue]); // Only re-run the effect if propsValue changes

  const [debouncedCallback] = useDebouncedCallback(
    // function
    (value: string, idx: number) => {
      onChange(value, idx);
    },
    // delay in ms
    500,
  );

  return (
    // @ts-ignore
    <TextField
      {...rest}
      variant={variant}
      className={classes.textField}
      error={error}
      value={value}
      margin="dense"
      spellCheck={false}
      helperText={error ? getRegexMessage() : helperText}
      InputProps={{
        classes: { root: classes.input },
        readOnly: readOnly,
        ...InputProps,
      }}
      InputLabelProps={{
        classes: { root: classes.label },
        shrink: !!placeholder || value !== '',
      }}
      FormHelperTextProps={{ classes: { root: classes.helperLabel } }}
      onChange={evt => {
        setValue(evt.target.value);
        if (!onBeforeUpdate) {
          debouncedCallback(evt.target.value, inputIndex);
        } else {
          const r = onBeforeUpdate(evt.target.value);
          if (r) {
            updateError(true);
          } else {
            updateError(false);
            debouncedCallback(evt.target.value, inputIndex);
          }
        }
      }}
    />
  );
};
