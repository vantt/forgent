import { test } from 'node:test';
import { resolveFgosFile, FGOS_FILE } from '../../src/state/fgos-file-registry.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// tsk-jgs -- reproduces and closes the bug this item was filed against:
// `fgos resync-worktree` run bare (no --dir) from inside a stale linked
// worktree -- exactly what `.githooks/pre-commit`'s own refusal message
// instructs -- used to fail to resolve the main checkout and error with a
// misleading "could not read HEAD reflog" message instead of performing
// the repair. Only `test/runner/worktree.test.mjs`'s own unit tests
// exercised `resyncWorktree()` directly (always with an explicit, correct
// `repoRoot`), and the sibling e2e file's own tsk-1d7 tests only assert the
// hook's refusal message NAMES this command -- neither ever actually ran
// the real CLI subprocess bare from inside a worktree, which is the exact
// path this file covers.

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../..');
const FGOS_BIN = path.join(REPO_ROOT, 'bin/fgos.mjs');

function mkTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

/** Builds a plain main checkout + a linked worktree on branch `fgw/tsk-jgs-
 * repro` (no hook installed -- this file is about the repair verb itself,
 * not the hook that names it). Returns { mainRoot, worktreeRoot }. */
function initMainAndWorktree() {
  const mainRoot = mkTempDir('fgos-tsk-jgs-main-');
  execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: mainRoot });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: mainRoot });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: mainRoot });
  fs.writeFileSync(path.join(mainRoot, 'seed.txt'), 'seed\n');
  // A real main checkout always carries a `.fgos/` (ADR0020 only strips it
  // from a linked worktree) -- present here so this fixture matches that
  // shape, rather than accidentally testing "does .fgos/ exist at all"
  // instead of the actual bug (which repoRoot resyncWorktree receives).
  fs.mkdirSync(path.join(mainRoot, '.fgos'), { recursive: true });
  const stateJsonPath = resolveFgosFile(path.join(mainRoot, '.fgos'), FGOS_FILE.STATE);
  fs.mkdirSync(path.dirname(stateJsonPath), { recursive: true });
  fs.writeFileSync(stateJsonPath, '{}\n');
  execFileSync('git', ['add', 'seed.txt', '.fgos/cache/state.json'], { cwd: mainRoot });
  execFileSync('git', ['commit', '-q', '-m', 'root commit'], { cwd: mainRoot });

  const worktreeParent = mkTempDir('fgos-tsk-jgs-worktree-parent-');
  const worktreeRoot = path.join(worktreeParent, 'worktree');
  execFileSync('git', ['worktree', 'add', '-b', 'fgw/tsk-jgs-repro', worktreeRoot], { cwd: mainRoot });
  // ADR0020: a real `fgos pick`/`createWorktree` strips `.fgos/` right
  // after `git worktree add` (`finishWorktreeSetup`) -- a linked worktree
  // never carries its own `.fgos/`. Plain `git worktree add` alone (this
  // fixture, no fgOS in the loop) still checks out whatever `.fgos/` the
  // branch tracked, so strip it by hand here too -- without this, `dir`
  // (`<worktreePath>/.fgos`) would exist on disk and the bug this test
  // covers (repoRoot pointing at a nonexistent cwd) would never reproduce.
  fs.rmSync(path.join(worktreeRoot, '.fgos'), { recursive: true, force: true });

  return { mainRoot, worktreeRoot };
}

/** Establishes a real `lastSynced` inside the worktree (its own HEAD
 * reflog gains an entry), same precondition the sibling tsk-1d7 e2e tests
 * set up before force-moving a branch. */
function commitInWorktree(worktreeRoot) {
  const fileName = `change-${Date.now()}.txt`;
  fs.writeFileSync(path.join(worktreeRoot, fileName), 'change\n');
  execFileSync('git', ['add', fileName], { cwd: worktreeRoot });
  execFileSync('git', ['commit', '-q', '-m', 'change'], { cwd: worktreeRoot });
}

/** Force-moves `branch` forward from OUTSIDE the worktree (a detached
 * ephemeral checkout, then `git branch -f`) without ever touching the
 * worktree's own files/index -- same shape as an `approve` leaf->root
 * merge, and the same helper shape the sibling tsk-1d7 e2e tests use. */
function forceMoveBranchForward(mainRoot, branch) {
  const mergeDir = mkTempDir('fgos-tsk-jgs-force-move-');
  execFileSync('git', ['worktree', 'add', '--detach', mergeDir, branch], { cwd: mainRoot });
  const fileName = `external-${Date.now()}.txt`;
  fs.writeFileSync(path.join(mergeDir, fileName), 'external change\n');
  execFileSync('git', ['add', fileName], { cwd: mergeDir });
  execFileSync('git', ['commit', '-q', '-m', 'external change landed via force-move'], { cwd: mergeDir });
  const newTip = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: mergeDir, encoding: 'utf8' }).trim();
  execFileSync('git', ['branch', '-f', branch, newTip], { cwd: mainRoot });
  execFileSync('git', ['worktree', 'remove', '--force', mergeDir], { cwd: mainRoot });
  return newTip;
}

test('tsk-jgs: `fgos resync-worktree` run bare (no --dir) from inside a stale worktree resolves the main checkout and repairs it', () => {
  const { mainRoot, worktreeRoot } = initMainAndWorktree();

  commitInWorktree(worktreeRoot);
  forceMoveBranchForward(mainRoot, 'fgw/tsk-jgs-repro');

  const result = spawnSync(process.execPath, [FGOS_BIN, 'resync-worktree'], {
    cwd: worktreeRoot,
    encoding: 'utf8',
  });

  assert.equal(
    result.status,
    0,
    `bare resync-worktree from inside the stale worktree must succeed -- got status ${result.status}, stderr:\n${result.stderr}`,
  );
  const envelope = JSON.parse(result.stdout);
  assert.equal(envelope.data.resynced, true, `expected a real repair, got: ${result.stdout}`);
});

test('tsk-jgs: `fgos resync-worktree --dir <mainRoot>` still works explicitly (unchanged behavior)', () => {
  const { mainRoot, worktreeRoot } = initMainAndWorktree();

  commitInWorktree(worktreeRoot);
  forceMoveBranchForward(mainRoot, 'fgw/tsk-jgs-repro');

  const result = spawnSync(process.execPath, [FGOS_BIN, 'resync-worktree', '--dir', mainRoot], {
    cwd: worktreeRoot,
    encoding: 'utf8',
  });

  assert.equal(
    result.status,
    0,
    `explicit --dir resync-worktree must still succeed -- got status ${result.status}, stderr:\n${result.stderr}`,
  );
  const envelope = JSON.parse(result.stdout);
  assert.equal(envelope.data.resynced, true, `expected a real repair, got: ${result.stdout}`);
});
