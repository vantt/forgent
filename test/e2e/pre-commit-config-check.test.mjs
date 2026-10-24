import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { git, mkTempDir, initRepo, installHook, initRepoWithHook, sessionEnv, commitCount, HOOK_TEST_SKIP } from '../helpers/main-checkout-hook-repo.mjs';

// The real pre-commit hook and the real host: a staged `.fgos/config.yaml` is checked with
// `fgos config check` before it is committed (docs/platform/config/spec.md section 11).

const skip = HOOK_TEST_SKIP;

/** Stages `text` as the project config of `repoRoot` and commits it as one session with an empty home. */
function commitConfig(repoRoot, text, overlay = {}) {
  fs.mkdirSync(path.join(repoRoot, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(repoRoot, '.fgos', 'config.yaml'), text);
  git(repoRoot, ['add', '.fgos/config.yaml']);
  const home = mkTempDir('fgos-hook-config-home-');
  return spawnSync('git', ['commit', '-q', '-m', 'config'], { cwd: repoRoot, encoding: 'utf8', env: sessionEnv({ HOME: home, FGOS_SESSION_ID: 'session-config', ...overlay }) });
}

/** A linked worktree committing under the main checkout's hook: the hook runs away from home there. */
function linkedWorktree() {
  const mainRoot = initRepo('fgos-hook-config-main-');
  installHook(mainRoot, { absolute: true });
  const worktreeRoot = path.join(mkTempDir('fgos-hook-config-parent-'), 'worktree');
  git(mainRoot, ['worktree', 'add', '--detach', worktreeRoot]);
  return worktreeRoot;
}

test('a commit that stages a config file the host refuses is refused, naming the file and position and no value', { skip }, () => {
  const repoRoot = initRepoWithHook('fgos-hook-config-bad-');
  const before = commitCount(repoRoot);

  const result = commitConfig(repoRoot, 'gateBypass:\n  level: [unclosed\n');

  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /commit refused: "fgos config check" fails/);
  assert.match(result.stderr, /config-parse project:config\.yaml:\d+:\d+/);
  assert.doesNotMatch(result.stderr, /config-machine-files/);
  assert.match(result.stderr, /working-tree config file/);
  assert.equal(commitCount(repoRoot), before);
});

test('a commit that stages a clean config file passes the check', { skip }, () => {
  const repoRoot = initRepoWithHook('fgos-hook-config-clean-');

  const result = commitConfig(repoRoot, 'gateBypass:\n  level: light\n');

  assert.equal(result.status, 0, result.stderr);
  assert.doesNotMatch(result.stderr, /config check|was not checked/);
});

test('a commit that stages no config file never runs the check', { skip }, () => {
  const repoRoot = initRepoWithHook('fgos-hook-config-none-');
  fs.writeFileSync(path.join(repoRoot, 'note.txt'), 'x\n');
  fs.mkdirSync(path.join(repoRoot, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(repoRoot, '.fgos', 'config.yaml'), 'gateBypass:\n  level: [unclosed\n');
  git(repoRoot, ['add', 'note.txt']);

  const result = spawnSync('git', ['commit', '-q', '-m', 'note'], { cwd: repoRoot, encoding: 'utf8', env: sessionEnv({ FGOS_SESSION_ID: 'session-config' }) });

  assert.equal(result.status, 0, result.stderr);
});

test('without a host binary the staged config file is not checked: a warning, and the commit goes on', { skip }, () => {
  const worktreeRoot = linkedWorktree();

  const result = commitConfig(worktreeRoot, 'gateBypass:\n  level: [unclosed\n', { FGOS_HOST_BIN: path.join(worktreeRoot, 'no-such-host') });

  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stderr, /warning: \.fgos\/config\.yaml was not checked \(no fgos host binary found\)/);
});
