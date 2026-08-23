// fgos-merge-next-no-config-write.test.mjs — the merge cluster's verify
// timeout must stay lazy.
//
// `resolveVerifyTimeoutMs` (bin/fgos.mjs) falls through to
// `ensureRunnerConfigForDir`, which WRITES a default runner block into
// `.fgos/config.json` and warns on stderr when none exists yet. Before the
// use-case split, `sync-root` resolved its timeout only AFTER its
// item/worktree/branch/Iron-Law guards, and `merge next` only ever resolved
// one by actually reaching `approve`/`sync-root` — so a refusal, or a
// nothing-ready turn, wrote nothing. Building the options object eagerly
// moved that write ahead of every guard; these cases pin the old ordering.
import { test } from 'node:test';
import { assert, fs, path, initGitCwdMain, run } from './helpers/fgos-cli-harness.mjs';

function configPath(cwd) {
  return path.join(cwd, '.fgos', 'config.json');
}

/** Remove the runner config a previous verb may have written, so each case
 * starts from the "no runner config yet" state the regression needs. */
function clearRunnerConfig(cwd) {
  fs.rmSync(configPath(cwd), { force: true });
}

test('merge next with nothing ready writes no runner config — its outcome is a pure read (tsk-55f)', () => {
  const cwd = initGitCwdMain();
  clearRunnerConfig(cwd);

  const res = run(cwd, ['merge', 'next']);

  assert.equal(res.status, 0, res.stderr);
  assert.match(res.stdout, /"picked": null/);
  assert.equal(
    fs.existsSync(configPath(cwd)),
    false,
    'merge next resolved a verify timeout before deciding anything, writing a default runner config',
  );
});

test('sync-root refusing an unknown id writes no runner config — the refusal is side-effect-free (tsk-55f)', () => {
  const cwd = initGitCwdMain();
  clearRunnerConfig(cwd);

  const res = run(cwd, ['sync-root', 'no-such-item']);

  assert.notEqual(res.status, 0);
  assert.match(res.stderr, /work "no-such-item" not found/);
  assert.equal(
    fs.existsSync(configPath(cwd)),
    false,
    'sync-root resolved its verify timeout before the item guard, writing a default runner config',
  );
});
