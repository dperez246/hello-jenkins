/* eslint-disable import/no-extraneous-dependencies */
const {
  utils: { getPackages },
} = require('@commitlint/config-lerna-scopes')

module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'header-max-length': async () => [0, 'always', 110],
    'scope-enum': async ctx => [
      2,
      'always',
      [
        ...(await getPackages(ctx)),
        'docs',
        'config',
        'storybook',
        'merge-requester',
        'release',
      ],
    ],
  },
}
