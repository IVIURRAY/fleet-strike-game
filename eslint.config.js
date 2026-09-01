import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/coverage/**',
      '**/node_modules/**',
      '**/.turbo/**',
      '**/*.config.*',
      '**/build.mjs',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-function-return-type': 'warn',
      '@typescript-eslint/consistent-type-imports': 'warn',
      // Underscore-prefixed parameters are the conventional way to satisfy an
      // interface without using the argument.
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'max-lines': ['warn', { max: 200, skipBlankLines: true, skipComments: true }],
      'no-var': 'error',
      'prefer-const': 'error',
    },
  },
  {
    // The 200-line limit exists to keep single-responsibility source modules
    // small. Test files legitimately grow with the number of cases they cover,
    // and splitting them purely to satisfy a line count would obscure which
    // behaviours are tested together. Inferred return types on local fixture
    // helpers are also clearer than spelling out large literal shapes.
    files: ['**/*.test.ts'],
    rules: {
      'max-lines': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
    },
  },
  {
    // Pure data tables. These are balance figures transcribed from the design
    // docs, not logic; splitting a stat block across files to satisfy a line
    // count would make the numbers harder to review against the source
    // document, which is the opposite of the rule's intent.
    files: ['**/config/src/ships.ts', '**/config/src/buildings-*.ts'],
    rules: {
      'max-lines': 'off',
    },
  },
  {
    // Development-only harness. It is a single linear script whose value is in
    // reading top to bottom, so the module-size rule does not apply.
    files: ['**/playtest.ts'],
    rules: {
      'max-lines': 'off',
      'no-console': 'off',
    },
  }
);
