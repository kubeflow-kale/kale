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
import { Select, ISelectOption } from './Select';

const VOLUME_ACCESS_MODE_ROM: ISelectOption = {
  label: 'ReadOnlyMany',
  value: 'rom',
};
const VOLUME_ACCESS_MODE_RWO: ISelectOption = {
  label: 'ReadWriteOnce',
  value: 'rwo',
};
const VOLUME_ACCESS_MODE_RWM: ISelectOption = {
  label: 'ReadWriteMany',
  value: 'rwm',
};
const VOLUME_ACCESS_MODES: ISelectOption[] = [
  VOLUME_ACCESS_MODE_ROM,
  VOLUME_ACCESS_MODE_RWO,
  VOLUME_ACCESS_MODE_RWM,
];

interface VolumeAccessModeSelectProps {
  value: string;
  updateValue: Function;
}

export const VolumeAccessModeSelect: React.FunctionComponent<VolumeAccessModeSelectProps> = props => {
  return (
    <Select
      variant="standard"
      label="Volume access mode"
      index={-1}
      values={VOLUME_ACCESS_MODES}
      value={props.value}
      updateValue={props.updateValue}
    />
  );
};
