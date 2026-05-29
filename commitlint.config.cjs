/**
 * Commitlint config — håndhæver conventional commits + Colas-specifikke scopes.
 *
 * Format: type(scope): subject
 *
 * Eksempler:
 *   feat(formand): add ProductBoxV2
 *   fix(vognmand): correct disponering-state
 *   feat(formand/asfaltbestilling): add SendBekraeftelsesModal
 *   docs: update CONTRIBUTING with branch-strategi
 *   chore(workflow): B8 git-agent upgrade
 */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'refactor', 'test', 'docs', 'chore', 'style', 'perf', 'ci', 'build', 'revert'],
    ],
    'scope-empty': [0], // scope is optional
    'subject-case': [0], // allow danish chars + mixed case
    'subject-max-length': [2, 'always', 100],
    'header-max-length': [2, 'always', 120],
    'body-leading-blank': [2, 'always'],
    'footer-leading-blank': [2, 'always'],
  },
}
