import '../helpers/process-tmp-root.mjs';
import { activateGitFixture } from './worktree-native-fixture.helper.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  createClaimWorktree,
  createVerifyCheckout,
  removeWorktree,
  createDispatchWorktree,
  removeDispatchWorktree,
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

// --- claim-isolate -----------------------------------------------------

test('createClaimWorktree is a passthrough to createWorktree (branch, path, baseRef honored)', () => {
  const repoRoot = initTempRepo();
  const worktreeDir = mkWorktreeDir();

  const wt = createClaimWorktree(repoRoot, 'claim-item', { worktreeDir });

  assert.equal(wt.branch, 'fgw/claim-item');
  assert.equal(wt.reused, false);
  assert.ok(fs.existsSync(path.join(wt.path, 'seed.txt')));
  // claim-isolate never tears the worktree down itself — the caller (claim-port.mjs)
  // owns teardown at return/reject time, so the checkout must still be live here.
  assert.ok(fs.existsSync(wt.path));
});

// --- verification checkout ---------------------------------------------

test('createVerifyCheckout checks out the exact commit detached, and removeWorktree removes only the checkout', () => {
  const repoRoot = initTempRepo();
  execFileSync('git', ['branch', branchNameFor('verify-item'), 'HEAD'], { cwd: repoRoot });
  const tip = execFileSync('git', ['rev-parse', branchNameFor('verify-item')], { cwd: repoRoot, encoding: 'utf8' }).trim();

  const checkout = createVerifyCheckout(repoRoot, tip);
  assert.equal(execFileSync('git', ['rev-parse', 'HEAD'], { cwd: checkout, encoding: 'utf8' }).trim(), tip);
  assert.throws(() => execFileSync('git', ['symbolic-ref', '-q', 'HEAD'], { cwd: checkout, stdio: 'pipe' }), 'detached at the commit, never a checkout of the branch ref');

  removeWorktree(repoRoot, checkout, { force: true });
  assert.equal(fs.existsSync(checkout), false);
  // the branch itself survives teardown — only the checkout is disposable.
  const branches = execFileSync('git', ['branch', '--list', 'fgw/verify-item'], { cwd: repoRoot, encoding: 'utf8' });
  assert.match(branches, /fgw\/verify-item/);
});

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

// --- runner-dispatch -----------------------------------------------------

test('createDispatchWorktree is a passthrough to createWorktree (worktreeDir/baseRef honored)', () => {
  const repoRoot = initTempRepo();
  const worktreeDir = mkWorktreeDir();
  const initialBranch = execFileSync('git', ['symbolic-ref', '--short', 'HEAD'], { cwd: repoRoot, encoding: 'utf8' }).trim();
  execFileSync('git', ['branch', 'root-branch', 'HEAD'], { cwd: repoRoot });
  execFileSync('git', ['checkout', 'root-branch'], { cwd: repoRoot });
  fs.writeFileSync(path.join(repoRoot, 'seed.txt'), 'seed on root\n');
  execFileSync('git', ['commit', '-aq', '-m', 'root-only commit'], { cwd: repoRoot });
  activateGitFixture(repoRoot);
  execFileSync('git', ['checkout', initialBranch], { cwd: repoRoot });

  const wt = createDispatchWorktree(repoRoot, 'leaf-item', { worktreeDir, baseRef: 'root-branch' });

  assert.equal(wt.branch, 'fgw/leaf-item');
  assert.ok(fs.existsSync(path.join(wt.path, 'seed.txt')));
  assert.equal(fs.readFileSync(path.join(wt.path, 'seed.txt'), 'utf8').replaceAll('\r\n', '\n'), 'seed on root\n');
});

test('removeDispatchWorktree removes a real checkout silently (no log call)', () => {
  const repoRoot = initTempRepo();
  const worktreeDir = mkWorktreeDir();
  const wt = createDispatchWorktree(repoRoot, 'dispatch-item', { worktreeDir });

  const logCalls = [];
  removeDispatchWorktree(repoRoot, wt.path, (msg) => logCalls.push(msg));

  assert.equal(fs.existsSync(wt.path), false);
  assert.deepEqual(logCalls, []);
});

test('removeDispatchWorktree never throws on a failed removal — it logs and swallows', () => {
  const repoRoot = initTempRepo();
  const worktreeDir = mkWorktreeDir();
  const wt = createDispatchWorktree(repoRoot, 'dispatch-item-2', { worktreeDir });
  // Remove the directory out from under git first so the real removeWorktree
  // call inside fails in a way that surfaces as a thrown git error.
  fs.rmSync(wt.path, { recursive: true, force: true });
  execFileSync('git', ['worktree', 'prune'], { cwd: repoRoot });

  const logCalls = [];
  assert.doesNotThrow(() => {
    removeDispatchWorktree(repoRoot, wt.path, (msg) => logCalls.push(msg));
  });

  assert.equal(logCalls.length, 1);
  assert.match(logCalls[0], /worktree cleanup failed/);
});
