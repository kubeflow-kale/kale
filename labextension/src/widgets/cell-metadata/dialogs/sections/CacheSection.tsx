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
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
} from '@mui/material';

type CachingValue = 'default' | 'enabled' | 'disabled';

interface ICacheSectionProps {
  enableCaching?: boolean;
  onUpdateCaching: (value: boolean | undefined) => void;
}

export const CacheSection: React.FC<ICacheSectionProps> = ({
  enableCaching,
  onUpdateCaching,
}) => {
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
      <FormControl
        component="fieldset"
        sx={{
          '& .MuiRadio-root:not(.Mui-checked)': {
            color: 'var(--jp-ui-font-color2)',
          },
        }}
      >
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
