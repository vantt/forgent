import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  createClaimWorktree,
  withMergeEphemeralWorktree,
  createDispatchWorktree,
  removeDispatchWorktree,
  branchNameFor,
} from '../../src/runner/worktree.mjs';

// Every test here creates its own disposable git repo (git init in a
// mkdtemp dir) — no test ever creates a worktree or branch in THIS repo
// (forgent itself), mirroring worktree.test.mjs's own convention.

function initTempRepo() {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-worktree-wrapper-test-repo-'));
  execFileSync('git', ['init', '-q'], { cwd: repoRoot });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: repoRoot });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: repoRoot });
  fs.writeFileSync(path.join(repoRoot, 'seed.txt'), 'seed\n');
  execFileSync('git', ['add', 'seed.txt'], { cwd: repoRoot });
  execFileSync('git', ['commit', '-q', '-m', 'init'], { cwd: repoRoot });
  return repoRoot;
}

function mkWorktreeDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-worktree-wrapper-test-dir-'));
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

// --- merge-ephemeral -----------------------------------------------------

test('withMergeEphemeralWorktree creates a worktree, runs fn, and removes the checkout on success', async () => {
  const repoRoot = initTempRepo();
  // Merge-ephemeral always targets an existing branch — create it first,
  // the same shape approve/catchup rely on.
  execFileSync('git', ['branch', branchNameFor('merge-item'), 'HEAD'], { cwd: repoRoot });
  const startCommit = execFileSync('git', ['rev-parse', branchNameFor('merge-item')], { cwd: repoRoot, encoding: 'utf8' }).trim();

  let seenPath;
  const result = await withMergeEphemeralWorktree(repoRoot, 'merge-item', async (worktree) => {
    seenPath = worktree.path;
    assert.equal(worktree.branch, 'fgw/merge-item');
    // Detached at the branch's tip commit, not a checkout of the branch
    // ref itself — see createDetachedMergeWorktree's own docstring.
    assert.equal(worktree.startCommit, startCommit);
    assert.ok(fs.existsSync(worktree.path));
    return { outcome: 'merged' };
  });

  assert.deepEqual(result, { outcome: 'merged' });
  assert.equal(fs.existsSync(seenPath), false);
  // the branch itself survives teardown — only the checkout is ephemeral.
  const branches = execFileSync('git', ['branch', '--list', 'fgw/merge-item'], { cwd: repoRoot, encoding: 'utf8' });
  assert.match(branches, /fgw\/merge-item/);
});

test('withMergeEphemeralWorktree still removes the checkout when fn throws, and propagates the error', async () => {
  const repoRoot = initTempRepo();
  execFileSync('git', ['branch', branchNameFor('merge-item-fail'), 'HEAD'], { cwd: repoRoot });

  let seenPath;
  await assert.rejects(
    withMergeEphemeralWorktree(repoRoot, 'merge-item-fail', async (worktree) => {
      seenPath = worktree.path;
      throw new Error('boom');
    }),
    /boom/,
  );

  assert.equal(fs.existsSync(seenPath), false);
});

// tsk-5yp repro: a person keeps a worktree open on the root branch
// (ExitWorktree "keep") while a child item is approved/merged into that
// same branch. withMergeEphemeralWorktree must never move or remove that
// kept-open checkout, even though it is clean — docs/history/
// merge-worktree-reclaim-clobbers-kept-checkout/CONTEXT.md D1.
test('withMergeEphemeralWorktree never touches a separate, kept-open checkout of the same branch', async () => {
  const repoRoot = initTempRepo();
  const rootBranch = branchNameFor('root-item');
  execFileSync('git', ['branch', rootBranch, 'HEAD'], { cwd: repoRoot });

  // The person's kept-open worktree, standing on the root branch — never
  // exited/removed, exactly like ExitWorktree "keep" leaves it.
  const keptPath = mkWorktreeDir();
  fs.rmdirSync(keptPath);
  execFileSync('git', ['worktree', 'add', keptPath, rootBranch], { cwd: repoRoot });

  const result = await withMergeEphemeralWorktree(repoRoot, 'root-item', async (worktree) => {
    fs.writeFileSync(path.join(worktree.path, 'merged.txt'), 'from child merge\n');
    execFileSync('git', ['add', 'merged.txt'], { cwd: worktree.path });
    execFileSync('git', ['commit', '-q', '-m', 'merge child into root'], { cwd: worktree.path });
    return { outcome: 'merged' };
  });

  assert.deepEqual(result, { outcome: 'merged' });

  // The kept-open checkout is completely untouched: still on disk, still
  // registered in `git worktree list`, still readable.
  assert.ok(fs.existsSync(keptPath), 'kept-open worktree directory must survive the merge');
  const listing = execFileSync('git', ['worktree', 'list', '--porcelain'], { cwd: repoRoot, encoding: 'utf8' });
  assert.match(listing, new RegExp(`worktree ${keptPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));

  // The merge's own commit landed on the real branch (fast-forwarded), not
  // just on the disposable ephemeral checkout.
  const rootTip = execFileSync('git', ['rev-parse', rootBranch], { cwd: repoRoot, encoding: 'utf8' }).trim();
  const rootLog = execFileSync('git', ['log', '-1', '--format=%s', rootTip], { cwd: repoRoot, encoding: 'utf8' }).trim();
  assert.equal(rootLog, 'merge child into root');
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
  execFileSync('git', ['checkout', initialBranch], { cwd: repoRoot });

  const wt = createDispatchWorktree(repoRoot, 'leaf-item', { worktreeDir, baseRef: 'root-branch' });

  assert.equal(wt.branch, 'fgw/leaf-item');
  assert.ok(fs.existsSync(path.join(wt.path, 'seed.txt')));
  assert.equal(fs.readFileSync(path.join(wt.path, 'seed.txt'), 'utf8'), 'seed on root\n');
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
