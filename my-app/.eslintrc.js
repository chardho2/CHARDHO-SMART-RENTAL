module.exports = {
  root: true,
  extends: ['expo'],
  ignorePatterns: ['dist/*'],
  settings: {
    'import/resolver': {
      typescript: {
        project: './tsconfig.json',
      },
    },
  },
};
