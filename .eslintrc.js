module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    // Code style - chỉ những rule quan trọng
    semi: ['warn', 'always'],
    quotes: 'off', // Cho phép cả single và double quotes
    indent: 'off', // Tắt indent checking
    'comma-dangle': 'off', // Cho phép trailing comma
    'no-trailing-spaces': 'off',
    'eol-last': 'off',

    // Best practices - chỉ những lỗi nghiêm trọng
    'no-console': 'off', // Cho phép console trong development
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
    'no-unused-vars': [
      'warn',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        ignoreRestSiblings: true
      }
    ],
    'no-var': 'error', // Bắt buộc dùng let/const
    'prefer-const': 'warn',
    'prefer-arrow-callback': 'off',

    // Error prevention - chỉ những lỗi thực sự quan trọng
    'no-undef': 'error',
    'no-unreachable': 'error',
    'no-duplicate-imports': 'warn',
    'no-self-compare': 'error',
    'no-constant-condition': 'warn',
    'no-empty': 'warn',

    // Node.js specific
    'no-process-exit': 'warn',
    'handle-callback-err': 'off' // Deprecated rule
  },
  globals: {
    process: 'readonly',
    __dirname: 'readonly',
    __filename: 'readonly',
    module: 'readonly',
    require: 'readonly',
    exports: 'readonly',
    global: 'readonly',
    Buffer: 'readonly'
  },
  settings: {
    'import/resolver': {
      alias: {
        map: [
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
