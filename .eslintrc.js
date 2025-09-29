module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true
  },
  extends: [
    'eslint:recommended'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    // Code style
    'indent': ['error', 2],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    'comma-dangle': ['error', 'never'],
    'no-trailing-spaces': 'error',
    'eol-last': 'error',

    // Best practices
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    'no-unused-vars': ['error', { 'argsIgnorePattern': '_' }],
    'no-var': 'error',
    'prefer-const': 'error',
    'prefer-arrow-callback': 'error',

    // Error prevention
    'no-undef': 'error',
    'no-unreachable': 'error',
    'no-duplicate-imports': 'error',
    'no-self-compare': 'error',

    // Node.js specific
    'no-process-exit': 'error',
    'handle-callback-err': 'error'
  },
  globals: {
    'process': 'readonly',
    '__dirname': 'readonly',
    '__filename': 'readonly',
    'module': 'readonly',
    'require': 'readonly',
    'exports': 'readonly',
    'global': 'readonly',
    'Buffer': 'readonly'
  },
  settings: {
    'import/resolver': {
      'alias': {
        'map': [
          ['@', './src'],
          ['@/config', './src/config'],
          ['@/controllers', './src/controllers'],
          ['@/services', './src/services'],
          ['@/repositories', './src/repositories'],
          ['@/middleware', './src/middleware'],
          ['@/routes', './src/routes'],
          ['@/utils', './src/utils'],
          ['@/validators', './src/validators'],
          ['@/models', './src/database/models']
        ]
      }
    }
  }
};
