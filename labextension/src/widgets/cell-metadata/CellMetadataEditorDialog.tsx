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
import {
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  Switch,
} from '@material-ui/core';
import ColorUtils from '../../lib/ColorUtils';
import { Input } from '../../components/Input';
import { Select } from '../../components/Select';

const GPU_TYPES = [
  { value: 'nvidia.com/gpu', label: 'Nvidia' },
  { value: 'amd.com/gpu', label: 'AMD' },
];
const DEFAULT_GPU_TYPE = GPU_TYPES[0].value;

interface ICellMetadataEditorDialog {
  open: boolean;
  stepName: string;
  limits: { [id: string]: string };
  updateLimits: Function;
  toggleDialog: Function;
}

export const CellMetadataEditorDialog: React.FunctionComponent<ICellMetadataEditorDialog> = props => {
  const handleClose = () => {
    props.toggleDialog();
  };

  const limitAction = (
    action: string,
    limitKey: string,
    limitValue: string = null,
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
  const gpuCount = props.limits[gpuType] || undefined;

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
          direction="row"
          justify="space-between"
          alignItems="center"
        >
          <Grid item xs={9}>
            <Grid
              container
              direction="row"
              justify="flex-start"
              alignItems="center"
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
            </Grid>
          </Grid>
          <Grid item xs={3}>
            <Grid
              container
              direction="row"
              justify="flex-end"
              alignItems="center"
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
                    props.updateLimits([limitAction('delete', gpuType)]);
                  }
                }}
                color="primary"
                name="enableKale"
                inputProps={{ 'aria-label': 'primary checkbox' }}
                classes={{ root: 'material-switch' }}
              />
            </Grid>
          </Grid>
        </Grid>
      </DialogTitle>
      <DialogContent dividers={true} style={{ paddingTop: 0 }}>
        <Grid container direction="column" justify="center" alignItems="center">
          <Grid
            container
            direction="row"
            justify="space-between"
            alignItems="center"
            style={{ marginTop: '15px' }}
          >
            <Grid item xs={6}>
              <Input
                disabled={gpuType === undefined}
                variant="outlined"
                label="GPU Count"
                value={gpuCount || 1}
                updateValue={(v: string) =>
                  props.updateLimits([limitAction('update', gpuType, v)])
                }
                style={{ width: '95%' }}
              />
            </Grid>
            <Grid item xs={6}>
              <Select
                disabled={gpuType === undefined}
                updateValue={(v: string) => {
                  props.updateLimits([
                    limitAction('delete', gpuType),
                    limitAction('update', v, gpuCount),
                  ]);
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
