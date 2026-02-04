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
import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Switch,
  Box,
} from '@mui/material';
import ColorUtils from '../../lib/ColorUtils';
import { Input } from '../../components/Input';
import { Select } from '../../components/Select';

const GPU_TYPES = [
  { value: 'nvidia.com/gpu', label: 'Nvidia' },
  { value: 'amd.com/gpu', label: 'AMD' },
];
const DEFAULT_GPU_TYPE = GPU_TYPES[0].value;

export interface ILimitAction {
  action: 'update' | 'delete';
  limitKey: string;
  limitValue?: string;
}

interface ICellMetadataEditorDialog {
  open: boolean;
  stepName: string;
  limits: { [id: string]: string };
  updateLimits: (actions: ILimitAction[]) => void;
  toggleDialog: () => void;
}

export const CellMetadataEditorDialog: React.FunctionComponent<
  ICellMetadataEditorDialog
> = props => {
  const handleClose = () => {
    props.toggleDialog();
  };

  const limitAction = (
    action: ILimitAction['action'],
    limitKey: ILimitAction['limitKey'],
    limitValue: ILimitAction['limitValue'] = undefined,
  ) => {
    return {
      action,
      limitKey,
      limitValue,
    };
  };

  // intersect the current limits and the GPU_TYPES. Assume there is at most 1.
  const gpuType =
    Object.keys(props.limits).filter(x =>
      GPU_TYPES.map(t => t.value).includes(x),
    )[0] || undefined;
  const gpuCount = gpuType && props.limits[gpuType];

  return (
    <Dialog
      open={props.open}
      onClose={handleClose}
      fullWidth={true}
      maxWidth={'sm'}
      scroll="paper"
      aria-labelledby="scroll-dialog-title"
      aria-describedby="scroll-dialog-description"
    >
      <DialogTitle id="scroll-dialog-title">
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
              <p>Require GPU for step </p>
              <Chip
                className={'kale-chip'}
                style={{
                  marginLeft: '10px',
                  backgroundColor: `#${ColorUtils.getColor(props.stepName)}`,
                }}
                key={props.stepName}
                label={props.stepName}
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
                checked={gpuType !== undefined}
                onChange={c => {
                  if (c.target.checked) {
                    // default value
                    props.updateLimits([
                      limitAction('update', DEFAULT_GPU_TYPE, '1'),
                    ]);
                  } else {
                    if (gpuType) {
                      props.updateLimits([limitAction('delete', gpuType)]);
                    }
                  }
                }}
                color="primary"
                name="enableKale"
                inputProps={{ 'aria-label': 'primary checkbox' }}
                classes={{ root: 'material-switch' }}
              />
            </Box>
          </Grid>
        </Grid>
      </DialogTitle>
      <DialogContent dividers={true} style={{ paddingTop: 0 }}>
        <Grid
          container
          sx={{
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
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
                disabled={gpuType === undefined}
                variant="outlined"
                label="GPU Count"
                value={gpuCount || 1}
                updateValue={(v: string) => {
                  if (gpuType) {
                    props.updateLimits([limitAction('update', gpuType, v)]);
                  }
                }}
                style={{ width: '95%' }}
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <Select
                disabled={gpuType === undefined}
                updateValue={(v: string) => {
                  const actions = [];
                  if (gpuType) {
                    actions.push(limitAction('delete', gpuType));
                  }
                  actions.push(limitAction('update', v, gpuCount));
                  props.updateLimits(actions);
                }}
                values={GPU_TYPES}
                value={gpuType || DEFAULT_GPU_TYPE}
                label="GPU Type"
                index={0}
                variant="outlined"
              />
            </Grid>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} color="primary">
          Ok
        </Button>
      </DialogActions>
    </Dialog>
  );
};
