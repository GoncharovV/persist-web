import globals from 'globals';
import { eslintConfig, eslintConfigReact } from '@goncharovv/eslint-config';


/** @type {import('eslint').Linter.Config[]} */
export default [
  ...eslintConfig,
  ...eslintConfigReact,

  { languageOptions: { globals: { ...globals.browser } } },

  {
    ignores: ['.tsup'],
  },

  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@stylistic/newline-per-chained-call': 'off',
    },
  },
];
