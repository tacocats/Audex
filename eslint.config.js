import js from '@eslint/js'
import globals from 'globals'
import prettierConfig from 'eslint-config-prettier'
import importPlugin from 'eslint-plugin-import-x'

export default [
  js.configs.recommended,
  prettierConfig,
  {
    plugins: {
      import: importPlugin
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node
      }
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'import/no-unresolved': 'error'
    }
  }
]
