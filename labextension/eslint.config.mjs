// Copyright 2025 The Kubeflow Authors.
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

import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/lib/**',
      '**/coverage/**',
      '**/*.d.ts',
      '**/tests/**',
      '**/__tests__/**',
      '**/ui-tests/**',
      '**/babel.config.js',
      '**/jest.config.js',
      '**/labextension/**',
      '.prettierrc.js',
      '.ipynb_checkpoints/**',

    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  // TS-only rules
  {
    files: ['**/*.{ts,tsx}'],
    rules: {
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'interface',
          format: ['PascalCase'],
          custom: { regex: '^I[A-Z]', match: true },
        },
      ],
      '@typescript-eslint/no-unused-vars': ['warn', { args: 'none' }],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/no-use-before-define': 'off',
    },
  },
  // JS/TS common stylistic rules
  {
    rules: {
      quotes: ['error', 'single', { avoidEscape: true, allowTemplateLiterals: false }],
      curly: ['error', 'all'],
      eqeqeq: 'error',
      'prefer-arrow-callback': 'error',
    },
  },
]; 
