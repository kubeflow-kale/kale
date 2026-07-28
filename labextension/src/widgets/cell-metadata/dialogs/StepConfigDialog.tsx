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
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  Radio,
  RadioGroup,
  Switch,
  Tab,
  Tabs,
} from '@mui/material';
import ColorUtils from '../../../lib/ColorUtils';
import { Input } from '../../../components/Input';
import { Select } from '../../../components/Select';

const disabledFieldSx = {
  '& .MuiInputBase-input.Mui-disabled': {
    WebkitTextFillColor: 'rgba(255,255,255,0.38)',
  },
};

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

type CachingValue = 'default' | 'enabled' | 'disabled';

interface IStepConfigDialogProps {
  open: boolean;
  onClose: () => void;
  stepName: string;
  // Base image
  baseImage?: string;
  resolvedDefaultBaseImage: string;
  onUpdateBaseImage: (value: string) => void;
  // GPU / limits
  limits: { [id: string]: string };
  updateLimits: (actions: ILimitAction[]) => void;
  // Caching
  enableCaching?: boolean;
  onUpdateCaching: (value: boolean | undefined) => void;
}

const BaseImageSection: React.FC<
  Pick<
    IStepConfigDialogProps,
    'baseImage' | 'resolvedDefaultBaseImage' | 'onUpdateBaseImage' | 'onClose'
  >
> = ({ baseImage, resolvedDefaultBaseImage, onUpdateBaseImage, onClose }) => (
  <>
    <p style={{ margin: '8px 0' }}>
      Default: <strong>{resolvedDefaultBaseImage}</strong>
    </p>
    <Input
      variant="outlined"
      label="Custom Base Image"
      value={baseImage || ''}
      updateValue={(v: string) => onUpdateBaseImage(v)}
      placeholder={resolvedDefaultBaseImage}
      style={{ width: '100%', marginTop: '8px' }}
    />
    <Button
      onClick={() => {
        onUpdateBaseImage('');
        onClose();
      }}
      color="secondary"
      style={{ marginTop: '8px' }}
    >
      Reset to Default
    </Button>
  </>
);

const GpuSection: React.FC<
  Pick<IStepConfigDialogProps, 'stepName' | 'limits' | 'updateLimits'>
> = ({ stepName, limits, updateLimits }) => {
  const limitAction = (
    action: ILimitAction['action'],
    limitKey: ILimitAction['limitKey'],
    limitValue: ILimitAction['limitValue'] = undefined,
  ) => ({ action, limitKey, limitValue });

  // intersect the current limits and the GPU_TYPES. Assume there is at most 1.
  const gpuType =
    Object.keys(limits).filter(x =>
      GPU_TYPES.map(t => t.value).includes(x),
    )[0] || undefined;
  const gpuCount = gpuType && limits[gpuType];

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
            <p>Require GPU for step </p>
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
              checked={gpuType !== undefined}
              onChange={c => {
                if (c.target.checked) {
                  // default value
                  updateLimits([limitAction('update', DEFAULT_GPU_TYPE, '1')]);
                } else if (gpuType) {
                  updateLimits([limitAction('delete', gpuType)]);
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
            sx={disabledFieldSx}
            value={gpuCount || 1}
            updateValue={(v: string) => {
              if (gpuType) {
                updateLimits([limitAction('update', gpuType, v)]);
              }
            }}
            style={{ width: '95%' }}
          />
        </Grid>
        <Grid size={{ xs: 6 }}>
          <Select
            disabled={gpuType === undefined}
            sx={disabledFieldSx}
            updateValue={(v: string) => {
              const actions = [];
              if (gpuType) {
                actions.push(limitAction('delete', gpuType));
              }
              actions.push(limitAction('update', v, gpuCount));
              updateLimits(actions);
            }}
            values={GPU_TYPES}
            value={gpuType || DEFAULT_GPU_TYPE}
            label="GPU Type"
            index={0}
            variant="outlined"
          />
        </Grid>
      </Grid>
    </>
  );
};

const CacheSection: React.FC<
  Pick<IStepConfigDialogProps, 'enableCaching' | 'onUpdateCaching'>
> = ({ enableCaching, onUpdateCaching }) => {
  // Derived directly from the prop - no local state/effect needed, so there's
  // nothing to resync and no stale-value flash when this section (re)mounts.
  const cachingValue: CachingValue =
    enableCaching === undefined
      ? 'default'
      : enableCaching
        ? 'enabled'
        : 'disabled';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value as CachingValue;
    onUpdateCaching(val === 'default' ? undefined : val === 'enabled');
  };

  return (
    <>
      <p style={{ margin: '0 0 16px' }}>
        Control whether this step's results are cached. When enabled, Kubeflow
        Pipelines will reuse previous execution results if inputs haven't
        changed.
      </p>
      <FormControl component="fieldset">
        <RadioGroup value={cachingValue} onChange={handleChange}>
          <FormControlLabel
            value="default"
            control={<Radio />}
            label="Use Pipeline Default"
          />
          <FormControlLabel
            value="enabled"
            control={<Radio />}
            label="Enable Caching"
          />
          <FormControlLabel
            value="disabled"
            control={<Radio />}
            label="Disable Caching"
          />
        </RadioGroup>
      </FormControl>
    </>
  );
};

/**
 * Single "Configure Step" dialog consolidating per-step options (base image,
 * GPU, caching, ...) behind tabs instead of one button/dialog per option.
 * See https://github.com/kubeflow/kale/issues/894 - add new sections here by
 * appending a {label, render} entry to `tabs`, instead of a new standalone
 * dialog/button.
 */
export const StepConfigDialog: React.FC<IStepConfigDialogProps> = props => {
  const [activeTab, setActiveTab] = React.useState(0);

  // Always open on the first tab rather than whichever tab was last viewed.
  React.useEffect(() => {
    if (props.open) {
      setActiveTab(0);
    }
  }, [props.open]);

  const tabs: { label: string; render: () => React.ReactNode }[] = [
    {
      label: 'Base Image',
      render: () => (
        <BaseImageSection
          baseImage={props.baseImage}
          resolvedDefaultBaseImage={props.resolvedDefaultBaseImage}
          onUpdateBaseImage={props.onUpdateBaseImage}
          onClose={props.onClose}
        />
      ),
    },
    {
      label: 'GPU',
      render: () => (
        <GpuSection
          stepName={props.stepName}
          limits={props.limits}
          updateLimits={props.updateLimits}
        />
      ),
    },
    {
      label: 'Caching',
      render: () => (
        <CacheSection
          enableCaching={props.enableCaching}
          onUpdateCaching={props.onUpdateCaching}
        />
      ),
    },
  ];

  return (
    <Dialog
      open={props.open}
      onClose={props.onClose}
      fullWidth
      maxWidth="sm"
      scroll="paper"
      aria-labelledby="step-config-dialog-title"
      aria-describedby="step-config-dialog-description"
    >
      <DialogTitle id="step-config-dialog-title">Configure Step</DialogTitle>
      <Tabs
        value={activeTab}
        onChange={(_, v) => setActiveTab(v)}
        variant="fullWidth"
      >
        {tabs.map(tab => (
          <Tab key={tab.label} label={tab.label} />
        ))}
      </Tabs>
      <DialogContent
        dividers
        id="step-config-dialog-description"
        style={{ minHeight: '220px' }}
      >
        <Box sx={{ paddingTop: '16px' }}>{tabs[activeTab].render()}</Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={props.onClose} color="primary">
          Ok
        </Button>
      </DialogActions>
    </Dialog>
  );
};
