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

// Constants shared with the backend, which reads this very same file (see
// kale/shared_constants.py). Change a value in kale/shared_constants.json, never
// by adding a second copy here.
import sharedConstants from '../../../kale/shared_constants.json';

/** RPC error codes, as returned by the backend in `code`. */
export const RPC_ERROR_CODES: { [name: string]: number } =
  sharedConstants.rpc.error_codes;

/**
 * Plain-language explanation of each RPC error code. Shown to the user instead
 * of leaving them with just a number and a stack trace.
 */
export const RPC_ERROR_EXPLANATIONS: { [name: string]: string } =
  sharedConstants.rpc.error_explanations;

/** Cell names Kale reserves for itself, e.g. `imports` or `skip`. */
export const RESERVED_CELL_NAMES: string[] =
  sharedConstants.cells.reserved_names;

/** Prefixes of the parameterized cell tags, e.g. `step:` or `prev:`. */
export const CELL_TAG_PREFIXES = sharedConstants.cells.tag_prefixes;

/** The two values the `cache:` and `report:` tags accept. */
export const TAG_ENABLED_VALUE = sharedConstants.cells.tag_enabled_value;
export const TAG_DISABLED_VALUE = sharedConstants.cells.tag_disabled_value;

/**
 * A step name has to be a valid Python identifier, because that is what it
 * becomes in the generated pipeline. An empty name is accepted so the field can
 * be cleared while typing.
 */
export const STEP_NAME_REGEX = `^(${sharedConstants.cells.step_name_pattern})?$`;

/** Key under which Kale stores its configuration in a notebook's metadata. */
export const NB_METADATA_KEY = sharedConstants.notebook.metadata_key;

/** Base image the backend falls back to when nothing else is configured. */
export const DEFAULT_BASE_IMAGE = sharedConstants.pipeline.default_base_image;

/** The backend's name for a code, e.g. 5 -> 'SERVICE_UNAVAILABLE'. */
export const getRpcCodeName = (code: number): string =>
  Object.keys(RPC_ERROR_CODES).find(name => RPC_ERROR_CODES[name] === code) ||
  'UNKNOWN_ERROR';

/**
 * What a code means in plain language, so a dialog can tell the user what
 * happened instead of only which code the backend returned. `OK` is not a
 * failure, so it has no explanation.
 */
export const getRpcErrorExplanation = (code: number): string | undefined =>
  RPC_ERROR_EXPLANATIONS[getRpcCodeName(code)];
