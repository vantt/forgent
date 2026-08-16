// fgos-review-pr-precedence.test.mjs — a flag typo must not outrank the
// guards that name the real problem.
//
// `review`'s `--pr` validation belongs inside the verb, after its
// found/status preconditions and inside the `--github` branch — where the
// original `case 'review'` block did it. Hoisting it into the CLI adapter
// made a bare `--pr` win over a nonexistent id, and would have turned a
// stray `--pr` without `--github` (silently ignored before) into a new
// refusal. `approve` keeps its own `--pr` check inside its use case for the
// same reason.
import { test } from 'node:test';
import { assert, initGitCwdMain, makeRunnerProposedItem, run } from './helpers/fgos-cli-harness.mjs';

test('review on an unknown id reports the item, not the bare --pr flag (tsk-h6r)', () => {
  const cwd = initGitCwdMain();

  const res = run(cwd, ['review', 'no-such-item', '--github', '--pr']);

  assert.notEqual(res.status, 0);
  assert.match(res.stderr, /review: work "no-such-item" not found/);
});

test('review still refuses a bare --pr once every guard ahead of it has passed (tsk-h6r)', () => {
  const cwd = initGitCwdMain();
  // Runner-sourced on purpose: the `--pr` check sits behind the
  // classifySource guard too, so a legacy item would be refused for its
  // source before `--pr` is ever looked at.
  makeRunnerProposedItem(cwd, 'pr-flag-guard');

  const res = run(cwd, ['review', 'pr-flag-guard', '--github', '--pr']);

  assert.notEqual(res.status, 0);
  assert.match(res.stderr, /review --github --pr requires a PR number: --pr <n>/);
});

test('a stray --pr without --github stays ignored on the local review path (tsk-h6r)', () => {
  const cwd = initGitCwdMain();

  const res = run(cwd, ['review', 'no-such-item', '--pr']);

  assert.notEqual(res.status, 0);
  assert.match(res.stderr, /review: work "no-such-item" not found/);
});
