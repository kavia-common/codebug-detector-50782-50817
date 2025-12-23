import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default [
  // Base JS recommended
  js.configs.recommended,

  // TypeScript support
  ...tseslint.configs.recommended,

  // Global ignores for generated/build files to avoid parsing errors and node-only checks on browser bundles
  {
    ignores: [
      '.astro/**',
      'dist/**',
      'node_modules/**',
      // Astro content types (generated)
      '.astro/content.d.ts',
      // Build artefacts possibly outside src
      '**/*.min.js',
    ],
  },

  // TypeScript project files
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        // Do not use project mode to avoid requiring all generated d.ts to exist
        ecmaVersion: 2022,
        sourceType: 'module',
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn'],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/no-explicit-any': 'off', // relaxed for frontend utility code
      '@typescript-eslint/ban-ts-comment': [
        'warn',
        { 'ts-expect-error': 'allow-with-description' },
      ],
    },
  },

  // JS files config
  {
    files: ['**/*.js', '**/*.jsx'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-console': 'off',
      'eqeqeq': ['error', 'always'],
    },
  },
];
