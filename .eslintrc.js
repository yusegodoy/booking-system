module.exports = {
  extends: [
    'react-app',
    'react-app/jest'
  ],
  rules: {
    // Disable problematic rules for production build
    '@typescript-eslint/no-unused-vars': 'warn',
    'react-hooks/exhaustive-deps': 'warn',
    'no-useless-escape': 'warn'
  },
  env: {
    browser: true,
    es6: true,
    node: true
  }
};
