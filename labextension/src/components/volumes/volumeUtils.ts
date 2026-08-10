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

/** Derive KALE_VOLUME_<SCREAMING_SNAKE_CASE> from a PVC name. */
export function deriveEnvVarName(pvcName: string): string {
  return 'KALE_VOLUME_' + pvcName.toUpperCase().replace(/[^A-Z0-9]/g, '_');
}

export interface IAddFormState {
  name: string;
  mount_point: string;
  expose_as_env_var: boolean;
}

export const EMPTY_FORM: IAddFormState = {
  name: '',
  mount_point: '',
  expose_as_env_var: false,
};

export interface INotebookVolume {
  name: string;
  mount_point: string;
}
