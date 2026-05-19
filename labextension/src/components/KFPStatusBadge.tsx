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
import CircularProgress from '@mui/material/CircularProgress';

export type KfpStatus = 'checking' | 'connected' | 'disconnected';

interface IProps {
  status: KfpStatus;
}

export const KFPStatusBadge: React.FunctionComponent<IProps> = ({ status }) => {
  let label: React.ReactNode;
  let description: string;

  switch (status) {
    case 'connected':
      label = (
        <span className="kfp-status-text kfp-status-text-connected">
          Connected ✅
        </span>
      );
      description = 'KFP is reachable. You can compile and run pipelines.';
      break;
    case 'disconnected':
      label = (
        <span className="kfp-status-text kfp-status-text-disconnected">
          Disconnected ⚠️
        </span>
      );
      description =
        'KFP is not reachable. You can still compile notebooks, but cannot upload or run pipelines.';
      break;
    case 'checking':
    default:
      label = (
        <span className="kfp-status-text kfp-status-text-checking">
          <CircularProgress
            size={10}
            thickness={5}
            className="kfp-status-spinner"
          />
          Checking KFP...
        </span>
      );
      description = 'Checking KFP connection status...';
  }

  return (
    <div className="kfp-status-wrapper">
      <div className="kfp-status-badge">{label}</div>
      <p className="kfp-status-description">{description}</p>
    </div>
  );
};
