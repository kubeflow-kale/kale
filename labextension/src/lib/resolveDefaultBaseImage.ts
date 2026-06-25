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

export const FALLBACK_DEFAULT_BASE_IMAGE = 'python:3.12';

/**
 * Resolve the default base image for pipeline steps.
 *
 * Precedence: JupyterLab setting > env (from backend RPC) > hardcoded fallback.
 */
export function resolveDefaultBaseImage(
  setting: string | undefined,
  envFromBackend: string | undefined,
): string {
  const trimmed = setting?.trim();
  if (trimmed) {
    return trimmed;
  }
  const envTrimmed = envFromBackend?.trim();
  if (envTrimmed) {
    return envTrimmed;
  }
  return FALLBACK_DEFAULT_BASE_IMAGE;
}
