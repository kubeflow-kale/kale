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
