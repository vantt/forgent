// fgos-merge-next-idle-turn.test.mjs — an idle `merge next` turn must stay
// an idle turn.
//
// `merge next` reaches `approve`/`sync-root` only when it actually has
// something to merge. Before the use-case split it therefore parsed THEIR
// flags only on that path: a turn that found nothing ready returned
// `{picked: null, reason: 'nothing ready to merge'}` at exit 0 no matter
// what other flags were on the command line. Building both option bags
// eagerly in the adapter turned a stale or malformed `--wait`/`--timeout`
// into a hard exit-4 refusal on that same idle turn — which breaks the
// pool-empty shape merge-loop's own stop rule reads (SKILL.md step 4), so
// an unattended driver stops on an error instead of stopping cleanly.
import { test } from 'node:test';
import { assert, initGitCwdMain, run } from './helpers/fgos-cli-harness.mjs';

const IDLE = /"picked": null/;

test('merge next with nothing ready ignores a malformed --wait and still reports an empty pool (tsk-2fx)', () => {
  const cwd = initGitCwdMain();

  const res = run(cwd, ['merge', 'next', '--wait', '0']);

  assert.equal(res.status, 0, `expected an idle turn, got exit ${res.status}: ${res.stderr}`);
  assert.match(res.stdout, IDLE);
});

test('merge next with nothing ready ignores a malformed --timeout and still reports an empty pool (tsk-2fx)', () => {
  const cwd = initGitCwdMain();

  const res = run(cwd, ['merge', 'next', '--timeout', 'abc']);

  assert.equal(res.status, 0, `expected an idle turn, got exit ${res.status}: ${res.stderr}`);
  assert.match(res.stdout, IDLE);
});

test('approve still refuses a malformed --wait itself — laziness moved the parse, it did not remove it (tsk-2fx)', () => {
  const cwd = initGitCwdMain();

  const res = run(cwd, ['approve', 'no-such-item', '--wait', '0']);

  assert.notEqual(res.status, 0);
  assert.match(res.stderr, /approve --wait must be a positive number of milliseconds/);
});

test('sync-root refusing an unknown id names the item, not a --wait typo — its guards run first (tsk-2fx)', () => {
  const cwd = initGitCwdMain();

  const res = run(cwd, ['sync-root', 'no-such-item', '--wait', '0']);

  assert.notEqual(res.status, 0);
  assert.match(res.stderr, /work "no-such-item" not found/);
});
