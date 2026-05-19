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
} from '@mui/material';
import { Input } from '../../../components/Input';
interface IBaseImageDialogProps {
  open: boolean;
  onClose: () => void;
  baseImage?: string;
  resolvedDefaultBaseImage: string;
  onUpdateBaseImage: (value: string) => void;
}

export const BaseImageDialog: React.FC<IBaseImageDialogProps> = ({
  open,
  onClose,
  baseImage,
  resolvedDefaultBaseImage,
  onUpdateBaseImage,
}) => {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Base Image for Step</DialogTitle>
      <DialogContent>
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
      </DialogContent>
      <DialogActions>
        <Button
          onClick={() => {
            onUpdateBaseImage('');
            onClose();
          }}
          color="secondary"
        >
          Reset to Default
        </Button>
        <Button onClick={onClose} color="primary">
          Ok
        </Button>
      </DialogActions>
    </Dialog>
  );
};
