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

import {
  DEFAULT_BASE_IMAGE,
  getRpcCodeName,
  getRpcErrorExplanation,
  RESERVED_CELL_NAMES,
  RPC_ERROR_CODES,
  STEP_NAME_REGEX,
} from './sharedConstants';
import { resolveDefaultBaseImage } from './resolveDefaultBaseImage';
import {
  CELL_TYPES,
  KALE_TAG_PREFIXES,
} from '../widgets/cell-metadata/constants';

describe('RPC error codes', () => {
  it('names a known code the way the backend does', () => {
    expect(getRpcCodeName(RPC_ERROR_CODES.SERVICE_UNAVAILABLE)).toBe(
      'SERVICE_UNAVAILABLE',
    );
  });

  it('does not pretend to know a code it has never seen', () => {
    expect(getRpcCodeName(4242)).toBe('UNKNOWN_ERROR');
  });

  it('explains every failure in plain language', () => {
    const failures = Object.keys(RPC_ERROR_CODES).filter(
      name => name !== 'OK',
    );
    failures.forEach(name => {
      const explanation = getRpcErrorExplanation(RPC_ERROR_CODES[name]);
      expect(explanation).toBeDefined();
      expect((explanation as string).trim().length).toBeGreaterThan(0);
    });
  });

  it('has nothing to explain about a successful call', () => {
    expect(getRpcErrorExplanation(RPC_ERROR_CODES.OK)).toBeUndefined();
  });
});

describe('cell tags', () => {
  // Pinned, because these prefixes decide which tags Kale claims as its own
  // and wipes off a cell.
  it('claims exactly the Kale-owned tags', () => {
    expect(KALE_TAG_PREFIXES).toEqual([
      'step:',
      'prev:',
      'limit:',
      'image:',
      'cache:',
      'report:',
      'imports',
      'functions',
      'pipeline-parameters',
      'pipeline-metrics',
      'skip',
    ]);
  });

  it('offers a cell type for every reserved name', () => {
    const reservedCellTypes = CELL_TYPES.map(t => t.value).filter(
      value => value !== 'step',
    );
    expect(reservedCellTypes.sort()).toEqual([...RESERVED_CELL_NAMES].sort());
  });
});

describe('step name validation', () => {
  const matches = (name: string) => new RegExp(STEP_NAME_REGEX).test(name);

  it.each(['my_step', '_private', 'step2', ''])('accepts %p', name => {
    expect(matches(name)).toBe(true);
  });

  it.each(['My_Step', 'my-step', '1step', 'my step'])('rejects %p', name => {
    expect(matches(name)).toBe(false);
  });
});

describe('default base image', () => {
  it('falls back to the default the backend applies', () => {
    expect(resolveDefaultBaseImage(undefined, undefined)).toBe(
      DEFAULT_BASE_IMAGE,
    );
  });

  it('prefers the JupyterLab setting over everything else', () => {
    expect(resolveDefaultBaseImage('my/image:1', 'env/image:1')).toBe(
      'my/image:1',
    );
  });
});
