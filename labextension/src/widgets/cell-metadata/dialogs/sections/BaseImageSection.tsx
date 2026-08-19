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
import { Autocomplete, Button, TextField } from '@mui/material';

interface IBaseImageSectionProps {
  baseImage?: string;
  resolvedDefaultBaseImage: string;
  runtimeImages: string[];
  onUpdateBaseImage: (value: string) => void;
}

export const BaseImageSection: React.FC<IBaseImageSectionProps> = ({
  baseImage,
  resolvedDefaultBaseImage,
  runtimeImages,
  onUpdateBaseImage,
}) => {
  const [inputValue, setInputValue] = React.useState(baseImage || '');

  React.useEffect(() => {
    setInputValue(baseImage || '');
  }, [baseImage]);

  return (
    <>
      <p style={{ margin: '8px 0' }}>
        Default: <strong>{resolvedDefaultBaseImage}</strong>
      </p>

      <Autocomplete
        freeSolo
        fullWidth
        options={runtimeImages}
        value={baseImage || null}
        inputValue={inputValue}
        onInputChange={(_, value) => {
          setInputValue(value);
          onUpdateBaseImage(value);
        }}
        onChange={(_, value) => {
          const image = value || '';
          setInputValue(image);
          onUpdateBaseImage(image);
        }}
        renderInput={params => (
          <TextField
            {...params}
            label="Base Image"
            placeholder={resolvedDefaultBaseImage}
            variant="outlined"
          />
        )}
      />

      <Button
        onClick={() => {
          setInputValue('');
          onUpdateBaseImage('');
        }}
        color="secondary"
        style={{ marginTop: '8px' }}
      >
        Reset to Default
      </Button>
    </>
  );
};
