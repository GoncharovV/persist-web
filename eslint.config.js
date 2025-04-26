import globals from 'globals';
import { eslintConfig, eslintConfigReact } from '@vg/eslint-config';


/** @type {import('eslint').Linter.Config[]} */
export default [
  ...eslintConfig,
  ...eslintConfigReact,

  { languageOptions: { globals: { ...globals.browser } } },

  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@stylistic/newline-per-chained-call': 'off',
    },
  },
];
