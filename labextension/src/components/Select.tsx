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
import TextField, { BaseTextFieldProps } from '@material-ui/core/TextField';
import { MenuItem, Zoom } from '@material-ui/core';
import { createStyles, makeStyles } from '@material-ui/core/styles';
import { LightTooltip } from './LightTooltip';

export interface ISelectOption {
  label: string;
  value: string;
  tooltip?: any;
  invalid?: boolean;
}

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
    menu: {
      backgroundColor: 'var(--jp-layout-color1)',
      color: 'var(--jp-ui-font-color1)',
    },
    helperLabel: {
      color: 'var(--jp-info-color0)',
    },
  }),
);

interface SelectProps extends BaseTextFieldProps {
  index: number;
  values: ISelectOption[];
  variant?: 'filled' | 'standard' | 'outlined';
  updateValue: Function;
}

export const Select: React.FunctionComponent<SelectProps> = props => {
  const classes = useStyles({});

  const {
    index,
    value,
    values,
    helperText = null,
    variant = 'outlined',
    updateValue,
    ...rest
  } = props;

  const disableMenuItem = (event: React.MouseEvent, invalidOption: boolean) => {
    if (invalidOption) {
      event.stopPropagation();
    }
  };

  const getOptionClassNames = (option: any) => {
    const classNames: string[] = [];
    if (option.tooltip) {
      classNames.push('menu-item-tooltip');
    }
    return classNames.join(' ');
  };

  return (
    // @ts-ignore
    <TextField
      select
      {...rest}
      margin="dense"
      value={value}
      variant={variant}
      className={classes.textField}
      onChange={evt =>
        updateValue((evt.target as HTMLInputElement).value, index)
      }
      InputLabelProps={{
        classes: { root: classes.label },
        shrink: value !== '',
      }}
      InputProps={{ classes: { root: classes.input } }}
      SelectProps={{ MenuProps: { PaperProps: { className: classes.menu } } }}
      FormHelperTextProps={{ classes: { root: classes.helperLabel } }}
    >
      {values.map((option: any) => (
        <MenuItem
          key={option.value}
          value={option.value}
          disabled={!!option.invalid}
          className={getOptionClassNames(option)}
        >
          {option.tooltip ? (
            <LightTooltip
              title={option.tooltip}
              placement="top-start"
              interactive={!(typeof option.tooltip === 'string')}
              TransitionComponent={Zoom}
            >
              <div
                className="menu-item-label"
                onClick={ev => disableMenuItem(ev, !!option.invalid)}
              >
                {option.label}
              </div>
            </LightTooltip>
          ) : (
            option.label
          )}
        </MenuItem>
      ))}
    </TextField>
  );
};
