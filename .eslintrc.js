module.exports = {
  root: true,
  parser: '@typescript-eslint/parser', // 타입스크립트 파서
  parserOptions: {
    project: './tsconfig.json',
  },
  extends: [
    'airbnb',
    'airbnb-typescript',
    'plugin:react/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
  ],
  plugins: ['react', '@typescript-eslint', 'prettier'],
  rules: {
    'prettier/prettier': 'warn',
    'react/react-in-jsx-scope': 'off',
    'import/prefer-default-export': 'off',
    'react/jsx-props-no-spreading': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
  },
  settings: {
    'import/resolver': {
      typescript: {
        project: './tsconfig.json', // alias 및 paths 인식!
      },
    },
    react: {
      version: 'detect',
    },
  },
};
