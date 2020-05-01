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

import { createStyles, makeStyles } from '@material-ui/core/styles';
import * as React from 'react';
import { findDOMNode } from 'react-dom';
import { Input, MenuItem, Select } from '@material-ui/core';
import OutlinedInput from '@material-ui/core/OutlinedInput';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import Chip from '@material-ui/core/Chip';
import ColorUtils from '../lib/ColorUtils';

const useStyles = makeStyles(() =>
  createStyles({
    menu: {
      color: 'var(--jp-ui-font-color1)',
      fontSize: 'var(--jp-ui-font-size2)',
    },
    chips: {
      display: 'flex',
      flexWrap: 'wrap',
    },
    chip: {},
    selectMultiForm: {
      width: '100%',
    },
    label: {
      backgroundColor: 'var(--jp-layout-color1)',
      color: 'var(--jp-input-border-color)',
      fontSize: 'var(--jp-ui-font-size2)',
    },
    input: {
      fontSize: 'var(--jp-ui-font-size2)',
    },
  }),
);

interface SelectMultiProps {
  id: string;
  label: string;
  style?: unknown;
  selected: string[];
  disabled?: boolean;
  options: { value: string; color: string }[];
  variant?: 'filled' | 'standard' | 'outlined';
  updateSelected: Function;
}

export const SelectMulti: React.FunctionComponent<SelectMultiProps> = props => {
  const classes = useStyles({});
  const [inputLabelRef, setInputLabelRef] = React.useState(undefined);
  const labelOffsetWidth = inputLabelRef
    ? (findDOMNode(inputLabelRef) as HTMLElement).offsetWidth
    : 0;

  const {
    id,
    label,
    options,
    selected,
    disabled = false,
    variant = 'outlined',
    style = {},
    updateSelected,
  } = props;

  let inputComponent = <Input margin="dense" id={id} />;

  if (!variant || variant === 'outlined') {
    inputComponent = (
      <OutlinedInput margin="dense" labelWidth={labelOffsetWidth} id={id} />
    );
  }

  return (
    <FormControl
      margin="dense"
      style={style}
      variant={variant}
      disabled={disabled}
      className={classes.selectMultiForm}
    >
      <InputLabel
        ref={ref => {
          setInputLabelRef(ref);
        }}
        htmlFor={id}
        className={classes.label}
      >
        {label}
      </InputLabel>
      <Select
        multiple
        MenuProps={{ PaperProps: { className: classes.menu } }}
        onChange={evt => updateSelected((evt.target as HTMLInputElement).value)}
        margin="dense"
        variant={variant}
        input={inputComponent}
        value={selected}
        renderValue={elements => (
          <div className={classes.chips}>
            {(elements as string[]).map(value => {
              return (
                <Chip
                  style={{ backgroundColor: `#${ColorUtils.getColor(value)}` }}
                  key={value}
                  label={value}
                  className={`kale-chip kale-chip-select ${classes.chip}`}
                />
              );
            })}
          </div>
        )}
      >
        {options.map(option => (
          <MenuItem key={option.value} value={option.value}>
            {option.value}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};
