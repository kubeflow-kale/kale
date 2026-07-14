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

import { styled } from '@mui/material/styles';
import * as React from 'react';
import { Input, MenuItem, Select } from '@mui/material';
import OutlinedInput from '@mui/material/OutlinedInput';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Chip from '@mui/material/Chip';
import ColorUtils from '../lib/ColorUtils';

const StyledFormControl = styled(FormControl)({
  width: '100%',
  '& .MuiInputLabel-root': {
    backgroundColor: 'var(--jp-layout-color1)',
    color: 'var(--jp-input-border-color)',
    fontSize: 'var(--jp-ui-font-size2)',
  },
  '& .MuiInputBase-input': {
    fontSize: 'var(--jp-ui-font-size2)',
  },
});

const ChipsContainer = styled('div')({
  display: 'flex',
  flexWrap: 'wrap',
  gap: '4px',
});

const StyledChip = styled(Chip)({
  // Additional chip styling can go here if needed
});

interface ISelectMultiProps {
  id: string;
  label: string;
  style?: React.CSSProperties;
  selected: string[];
  disabled?: boolean;
  options: { value: string; color: string }[];
  variant?: 'filled' | 'standard' | 'outlined';
  updateSelected: (value: string[]) => void;
}

export const SelectMulti: React.FunctionComponent<
  ISelectMultiProps
> = props => {
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

  const getInputComponent = () => {
    if (variant === 'outlined') {
      return <OutlinedInput margin="dense" id={id} />;
    }
    return <Input margin="dense" id={id} />;
  };

  return (
    <StyledFormControl
      margin="dense"
      style={style}
      variant={variant}
      disabled={disabled}
    >
      <InputLabel htmlFor={id}>{label}</InputLabel>
      <Select
        multiple
        value={selected}
        onChange={evt => updateSelected(evt.target.value as string[])}
        input={getInputComponent()}
        MenuProps={{
          PaperProps: {
            sx: {
              color: 'var(--jp-ui-font-color1)',
              fontSize: 'var(--jp-ui-font-size2)',
            },
          },
        }}
        renderValue={selectedValues => (
          <ChipsContainer>
            {(selectedValues as string[]).map(value => (
              <StyledChip
                key={value}
                label={value}
                className="kale-chip kale-chip-select"
                sx={{
                  backgroundColor: `#${ColorUtils.getColor(value)}`,
                }}
              />
            ))}
          </ChipsContainer>
        )}
      >
        {options.map(option => (
          <MenuItem key={option.value} value={option.value}>
            {option.value}
          </MenuItem>
        ))}
      </Select>
    </StyledFormControl>
  );
};
