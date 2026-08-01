import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  checkMergeStillResolves,
  checkRetrospectiveContent,
  checkCleanupTTLElapsed,
  assessCleanupReadiness,
} from '../../src/state/cleanup-harness.mjs';

// Every test here creates its own disposable git repo (mirrors
// merge.test.mjs's own initRepo) — never this repo's own checkout.
function initRepo() {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-cleanup-harness-test-'));
  execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: repoRoot });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: repoRoot });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: repoRoot });
  fs.writeFileSync(path.join(repoRoot, 'seed.txt'), 'seed\n');
  execFileSync('git', ['add', 'seed.txt'], { cwd: repoRoot });
  execFileSync('git', ['commit', '-q', '-m', 'seed'], { cwd: repoRoot });
  return repoRoot;
}

function headSha(repoRoot) {
  return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repoRoot, encoding: 'utf8' }).trim();
}

function commitFile(repoRoot, name) {
  fs.writeFileSync(path.join(repoRoot, name), 'content\n');
  execFileSync('git', ['add', name], { cwd: repoRoot });
  execFileSync('git', ['commit', '-q', '-m', `add ${name}`], { cwd: repoRoot });
  return headSha(repoRoot);
}

// --- checkMergeStillResolves -----------------------------------------

test('checkMergeStillResolves: ok when the recorded commit is still an ancestor of HEAD', () => {
  const repoRoot = initRepo();
  const sha = commitFile(repoRoot, 'merged.txt');
  commitFile(repoRoot, 'later.txt');
  const result = checkMergeStillResolves(repoRoot, { branchHeadAtReturn: sha });
  assert.equal(result.ok, true);
  assert.match(result.detail, new RegExp(sha));
});

test('checkMergeStillResolves: not ok when the recorded commit is no longer reachable (force-pushed away)', () => {
  const repoRoot = initRepo();
  const sha = commitFile(repoRoot, 'to-be-erased.txt');
  // Simulate a force-push/history-rewrite that drops the commit: hard
  // reset main back to before it, as if the branch had been rewritten.
  execFileSync('git', ['reset', '--hard', 'HEAD~1'], { cwd: repoRoot });
  const result = checkMergeStillResolves(repoRoot, { branchHeadAtReturn: sha });
  assert.equal(result.ok, false);
  assert.match(result.detail, /no longer reachable/);
});

test('checkMergeStillResolves: prefers branchHeadAtReturn, then headAtReturn, then the *AtTake pair', () => {
  const repoRoot = initRepo();
  const sha = commitFile(repoRoot, 'preferred.txt');
  const result = checkMergeStillResolves(repoRoot, {
    branchHeadAtReturn: sha,
    headAtReturn: 'not-a-real-sha',
    headAtTake: 'also-not-real',
  });
  assert.equal(result.ok, true, 'must use branchHeadAtReturn, not the other fields');
});

test('checkMergeStillResolves: ok (nothing to check) when no commit field is recorded at all', () => {
  const repoRoot = initRepo();
  const result = checkMergeStillResolves(repoRoot, {});
  assert.equal(result.ok, true);
  assert.match(result.detail, /nothing to check/);
});

// --- checkRetrospectiveContent -----------------------------------------

test('checkRetrospectiveContent: not ok when no outcome or decision record exists for the item', () => {
  const result = checkRetrospectiveContent({}, 'no-content-item');
  assert.equal(result.ok, false);
  assert.match(result.detail, /no outcome or decision record/);
});

test('checkRetrospectiveContent: ok when an outcome record (actual) exists', () => {
  const view = { outcomes: { 'has-outcome': { actual: { outcome: 'pass' } } } };
  const result = checkRetrospectiveContent(view, 'has-outcome');
  assert.equal(result.ok, true);
});

test('checkRetrospectiveContent: ok when an outcome record (predicted only) exists', () => {
  const view = { outcomes: { 'has-predicted': { predicted: { tier: 'standard' } } } };
  const result = checkRetrospectiveContent(view, 'has-predicted');
  assert.equal(result.ok, true);
});

test('checkRetrospectiveContent: ok when at least one decision record exists, even with no outcome', () => {
  const view = { decisionsById: { 'has-decision': [{ text: 'x', rationale: 'y' }] } };
  const result = checkRetrospectiveContent(view, 'has-decision');
  assert.equal(result.ok, true);
});

test('checkRetrospectiveContent: not ok when decisionsById exists for the id but is an empty array', () => {
  const view = { decisionsById: { 'empty-decisions': [] } };
  const result = checkRetrospectiveContent(view, 'empty-decisions');
  assert.equal(result.ok, false);
});

// --- checkCleanupTTLElapsed ---------------------------------------------

test('checkCleanupTTLElapsed: not ok when the item never entered cleanup at all', () => {
  const result = checkCleanupTTLElapsed([], 'never-entered', { ttlDays: 7 });
  assert.equal(result.ok, false);
  assert.match(result.detail, /never actually entered cleanup/);
});

test('checkCleanupTTLElapsed: not ok when TTL has not yet elapsed', () => {
  const now = Date.now();
  const enteredAt = new Date(now - 2 * 86400000).toISOString(); // 2 days ago
  const rawEvents = [{ type: 'work.move', payload: { id: 'x', to: 'cleanup' }, ts: enteredAt }];
  const result = checkCleanupTTLElapsed(rawEvents, 'x', { ttlDays: 7, now });
  assert.equal(result.ok, false);
  assert.match(result.detail, /not ready yet/);
});

test('checkCleanupTTLElapsed: ok when TTL has fully elapsed', () => {
  const now = Date.now();
  const enteredAt = new Date(now - 8 * 86400000).toISOString(); // 8 days ago
  const rawEvents = [{ type: 'work.move', payload: { id: 'x', to: 'cleanup' }, ts: enteredAt }];
  const result = checkCleanupTTLElapsed(rawEvents, 'x', { ttlDays: 7, now });
  assert.equal(result.ok, true);
});

test('checkCleanupTTLElapsed: anchors to the SPECIFIC retrospective->cleanup event, never a later unrelated event for the same id', () => {
  const now = Date.now();
  const enteredAt = new Date(now - 8 * 86400000).toISOString(); // 8 days ago -- TTL-elapsed
  const laterUnrelated = new Date(now - 1 * 86400000).toISOString(); // a decision logged 1 day ago
  const rawEvents = [
    { type: 'work.move', payload: { id: 'x', to: 'cleanup' }, ts: enteredAt },
    { type: 'decision', payload: { id: 'x', text: 'unrelated note' }, ts: laterUnrelated },
  ];
  const result = checkCleanupTTLElapsed(rawEvents, 'x', { ttlDays: 7, now });
  assert.equal(result.ok, true, 'an unrelated later event must never reset the TTL clock');
});

test('checkCleanupTTLElapsed: uses the LATEST cleanup entry if an item somehow re-entered cleanup more than once', () => {
  const now = Date.now();
  const firstEntry = new Date(now - 20 * 86400000).toISOString();
  const secondEntry = new Date(now - 1 * 86400000).toISOString(); // most recent, TTL not elapsed
  const rawEvents = [
    { type: 'work.move', payload: { id: 'x', to: 'cleanup' }, ts: firstEntry },
    { type: 'work.move', payload: { id: 'x', to: 'blocked' }, ts: new Date(now - 15 * 86400000).toISOString() },
    { type: 'work.move', payload: { id: 'x', to: 'delivered' }, ts: new Date(now - 10 * 86400000).toISOString() },
    { type: 'work.move', payload: { id: 'x', to: 'cleanup' }, ts: secondEntry },
  ];
  const result = checkCleanupTTLElapsed(rawEvents, 'x', { ttlDays: 7, now });
  assert.equal(result.ok, false, 'must use the LATEST cleanup entry, not the first');
});

// --- assessCleanupReadiness (combined) -----------------------------------

test('assessCleanupReadiness: ready:true with empty reasons when all checks pass', () => {
  const repoRoot = initRepo();
  const sha = commitFile(repoRoot, 'ok.txt');
  const now = Date.now();
  const rawEvents = [{ type: 'work.move', payload: { id: 'good-item', to: 'cleanup' }, ts: new Date(now - 8 * 86400000).toISOString() }];
  const view = {
    work: { 'good-item': { branchHeadAtReturn: sha } },
    outcomes: { 'good-item': { actual: { outcome: 'pass' } } },
  };
  const result = assessCleanupReadiness({ view, rawEvents, id: 'good-item', repoRoot, worktreeBacked: true, ttlDays: 7, now });
  assert.equal(result.ready, true);
  assert.deepEqual(result.reasons, []);
});

test('assessCleanupReadiness: ready:false lists EVERY failing check, not just the first', () => {
  const repoRoot = initRepo();
  const now = Date.now();
  const rawEvents = []; // never entered cleanup -> TTL check fails
  const view = { work: { 'bad-item': {} }, outcomes: {} }; // no content -> content check fails
  const result = assessCleanupReadiness({ view, rawEvents, id: 'bad-item', repoRoot, worktreeBacked: true, ttlDays: 7, now });
  assert.equal(result.ready, false);
  assert.equal(result.reasons.length, 2, 'both the TTL and content failures must be listed');
});

test('assessCleanupReadiness: skips the merge-resolves check entirely when worktreeBacked is false (synthetic domain, D5)', () => {
  const now = Date.now();
  const rawEvents = [{ type: 'work.move', payload: { id: 'synth-item', to: 'cleanup' }, ts: new Date(now - 8 * 86400000).toISOString() }];
  const view = {
    work: { 'synth-item': { branchHeadAtReturn: 'not-a-real-sha-would-fail-if-checked' } },
    outcomes: { 'synth-item': { actual: { outcome: 'pass' } } },
  };
  // No repoRoot passed at all -- if the merge check ran, it would throw on a missing cwd.
  const result = assessCleanupReadiness({ view, rawEvents, id: 'synth-item', repoRoot: undefined, worktreeBacked: false, ttlDays: 7, now });
  assert.equal(result.ready, true, 'must not attempt the merge-resolves check for a non-worktree-backed domain');
});
