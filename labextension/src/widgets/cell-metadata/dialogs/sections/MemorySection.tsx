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
import { Box, Chip, Grid, Switch } from '@mui/material';
import ColorUtils from '../../../../lib/ColorUtils';
import { Input } from '../../../../components/Input';
import { ILimitAction } from './GpuSection';

// Scoped to this section: the shared Input/Select components don't have a
// dark-mode-aware disabled style, so override it here rather than in the
// shared components (which are used well beyond this dialog).
const disabledFieldSx = {
  '& .MuiInputBase-input.Mui-disabled': {
    WebkitTextFillColor: 'var(--jp-ui-font-color2)',
  },
  '& .MuiInputLabel-root': {
    color: 'var(--jp-ui-font-color2)',
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: 'var(--jp-input-border-color)',
  },
};

const DEFAULT_MEMORY_LIMIT = '2Gi';

interface IMemorySectionProps {
  stepName: string;
  limits: { [id: string]: string };
  updateLimits: (actions: ILimitAction[]) => void;
}

export const MemorySection: React.FC<IMemorySectionProps> = ({
  stepName,
  limits,
  updateLimits,
}) => {
  const limitAction = (
    action: ILimitAction['action'],
    limitKey: ILimitAction['limitKey'],
    limitValue: ILimitAction['limitValue'] = undefined,
  ) => ({ action, limitKey, limitValue });

  const memoryLimit = limits['memory'];
  const hasMemoryLimit = memoryLimit !== undefined;

  const [inputValue, setInputValue] = React.useState(
    memoryLimit !== undefined ? memoryLimit : DEFAULT_MEMORY_LIMIT,
  );

  React.useEffect(() => {
    if (memoryLimit !== undefined) {
      setInputValue(memoryLimit);
    } else {
      setInputValue(DEFAULT_MEMORY_LIMIT);
    }
  }, [memoryLimit]);

  return (
    <>
      <Grid
        container
        sx={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Grid size={{ xs: 9 }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'flex-start',
              alignItems: 'center',
            }}
          >
            <p>Set Memory Limit for step </p>
            <Chip
              className={'kale-chip'}
              style={{
                marginLeft: '10px',
                backgroundColor: `#${ColorUtils.getColor(stepName)}`,
              }}
              key={stepName}
              label={stepName}
            />
          </Box>
        </Grid>
        <Grid size={{ xs: 3 }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'flex-end',
              alignItems: 'center',
            }}
          >
            <Switch
              checked={hasMemoryLimit}
              onChange={c => {
                if (c.target.checked) {
                  const val = inputValue.trim() || DEFAULT_MEMORY_LIMIT;
                  setInputValue(val);
                  updateLimits([
                    limitAction('update', 'memory', val),
                  ]);
                } else {
                  updateLimits([limitAction('delete', 'memory')]);
                }
              }}
              color="primary"
              name="enableMemoryLimit"
              inputProps={{ 'aria-label': 'primary checkbox' }}
              classes={{ root: 'material-switch' }}
            />
          </Box>
        </Grid>
      </Grid>
      <Grid
        container
        sx={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: '15px',
        }}
      >
        <Grid size={{ xs: 6 }}>
          <Input
            disabled={!hasMemoryLimit}
            variant="outlined"
            label="Memory Limit (e.g., 2Gi)"
            sx={disabledFieldSx}
            value={inputValue}
            updateValue={(v: string) => {
              setInputValue(v);
              if (hasMemoryLimit) {
                updateLimits([limitAction('update', 'memory', v)]);
              }
            }}
            style={{ width: '95%' }}
          />
        </Grid>
      </Grid>
    </>
  );
};
