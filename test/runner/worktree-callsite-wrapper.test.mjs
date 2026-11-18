import '../helpers/process-tmp-root.mjs';
import { activateGitFixture } from './worktree-native-fixture.helper.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  createVerifyCheckout,
  removeWorktree,
  branchNameFor,
} from '../../src/runner/worktree.mjs';

// Every test here creates its own disposable git repo (git init in a
// mkdtemp dir) — no test ever creates a worktree or branch in THIS repo
// (forgent itself), mirroring worktree.test.mjs's own convention.

function initTempRepo() {
  const repoRoot = fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-worktree-wrapper-test-repo-')));
  execFileSync('git', ['init', '-q'], { cwd: repoRoot });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: repoRoot });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: repoRoot });
  fs.writeFileSync(path.join(repoRoot, 'seed.txt'), 'seed\n');
  execFileSync('git', ['add', 'seed.txt'], { cwd: repoRoot });
  execFileSync('git', ['commit', '-q', '-m', 'init'], { cwd: repoRoot });
  activateGitFixture(repoRoot);
  return repoRoot;
}

function mkWorktreeDir() {
  return fs.realpathSync.native(fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-worktree-wrapper-test-dir-')));
}

// --- verification checkout ---------------------------------------------

// tsk-5yp repro: a person keeps a worktree open on the root branch
// (ExitWorktree "keep") while a child item's landed tree is verified.
// The verification checkout must never move or remove that kept-open
// checkout, even though it is clean — docs/history/
// merge-worktree-reclaim-clobbers-kept-checkout/CONTEXT.md D1.
test('createVerifyCheckout never touches a separate, kept-open checkout of the same branch', () => {
  const repoRoot = initTempRepo();
  const rootBranch = branchNameFor('root-item');
  execFileSync('git', ['branch', rootBranch, 'HEAD'], { cwd: repoRoot });

  // The person's kept-open worktree, standing on the root branch — never
  // exited/removed, exactly like ExitWorktree "keep" leaves it.
  const keptPath = mkWorktreeDir();
  fs.rmdirSync(keptPath);
  execFileSync('git', ['worktree', 'add', keptPath, rootBranch], { cwd: repoRoot });
  const rootTip = execFileSync('git', ['rev-parse', rootBranch], { cwd: repoRoot, encoding: 'utf8' }).trim();

  const checkout = createVerifyCheckout(repoRoot, rootTip);
  removeWorktree(repoRoot, checkout, { force: true });

  // The kept-open checkout is completely untouched: still on disk, still
  // registered in `git worktree list`, still on the branch's same tip.
  assert.ok(fs.existsSync(keptPath), 'kept-open worktree directory must survive');
  const listing = execFileSync('git', ['worktree', 'list', '--porcelain'], { cwd: repoRoot, encoding: 'utf8' }).replaceAll('\\', '/');
  const normalizedKeptPath = keptPath.replaceAll('\\', '/');
  assert.match(listing, new RegExp(`worktree ${normalizedKeptPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
  assert.equal(execFileSync('git', ['rev-parse', 'HEAD'], { cwd: keptPath, encoding: 'utf8' }).trim(), rootTip);
});
