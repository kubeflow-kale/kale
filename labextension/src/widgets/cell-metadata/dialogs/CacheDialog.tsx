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
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
} from '@mui/material';

type CachingValue = 'default' | 'enabled' | 'disabled';

interface ICacheDialogProps {
  open: boolean;
  onClose: () => void;
  enableCaching?: boolean;
  onUpdateCaching: (value: boolean | undefined) => void;
}

export const CacheDialog: React.FC<ICacheDialogProps> = ({
  open,
  onClose,
  enableCaching,
  onUpdateCaching,
}) => {
  const [cachingValue, setCachingValue] =
    React.useState<CachingValue>('default');

  React.useEffect(() => {
    if (open) {
      setCachingValue(
        enableCaching === undefined
          ? 'default'
          : enableCaching
            ? 'enabled'
            : 'disabled',
      );
    }
  }, [open, enableCaching]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value as CachingValue;
    setCachingValue(val);
    onUpdateCaching(val === 'default' ? undefined : val === 'enabled');
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Step Caching Control</DialogTitle>
      <DialogContent>
        <p style={{ margin: '8px 0 16px 0' }}>
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
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Ok
        </Button>
      </DialogActions>
    </Dialog>
  );
};
