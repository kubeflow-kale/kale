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

import * as React from 'react';
import TextField, { BaseTextFieldProps } from '@mui/material/TextField';
import { MenuItem, Zoom } from '@mui/material';
import { styled } from '@mui/material/styles';
import { LightTooltip } from './LightTooltip';

export interface ISelectOption {
  label: string;
  value: string;
  tooltip?: React.ReactNode;
  invalid?: boolean;
}

// Styled TextField component with custom CSS variables
const StyledTextField = styled(TextField)(({ theme }) => ({
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
  },
  '& .MuiPaper-root': {
    backgroundColor: 'var(--jp-layout-color1)',
    color: 'var(--jp-ui-font-color1)',
  },
}));

interface ISelectProps extends BaseTextFieldProps {
  index: number;
  values: ISelectOption[];
  variant?: 'filled' | 'standard' | 'outlined';
  updateValue: (value: string, index: number) => void;
}

export const Select: React.FC<ISelectProps> = props => {
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

  const getOptionClassNames = (option: ISelectOption) => {
    const classNames: string[] = [];
    if (option.tooltip) {
      classNames.push('menu-item-tooltip');
    }
    return classNames.join(' ');
  };

  return (
    <StyledTextField
      select
      {...rest}
      margin="dense"
      value={value || ''}
      variant={variant}
      helperText={helperText}
      onChange={evt =>
        updateValue((evt.target as HTMLInputElement).value, index)
      }
      InputLabelProps={{
        shrink: value !== '',
      }}
      slotProps={{
        select: {
          MenuProps: {
            PaperProps: {
              sx: {
                backgroundColor: 'var(--jp-layout-color1)',
                color: 'var(--jp-ui-font-color1)',
              },
            },
          },
        },
      }}
    >
      {values.map((option: ISelectOption) => (
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
              TransitionComponent={Zoom}
              slotProps={{
                popper: {
                  modifiers: [
                    {
                      name: 'offset',
                      options: {
                        offset: [0, -14],
                      },
                    },
                  ],
                },
              }}
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
    </StyledTextField>
  );
};
