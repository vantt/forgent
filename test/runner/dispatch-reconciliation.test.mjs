import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { planReconciliation, applyReconciliation } from '../../src/runner/dispatch/reconciliation-planner.mjs';

function root() { const out = fs.mkdtempSync(path.join(os.tmpdir(), 'dispatch-reconcile-')); fs.mkdirSync(path.join(out, '.fgos'), { recursive: true }); return out; }
function deadLock(dir, extra = {}) { fs.writeFileSync(path.join(dir, '.fgos', 'dispatch.lock'), JSON.stringify({ pid: 99999999, startTime: '1', ...extra })); }

test('reconcile clears only a dead-proven cwd lock and replay is idempotent', () => {
  const dir = root(); deadLock(dir); const plan = planReconciliation(dir, { now: '2026-09-15T00:00:00.000Z' });
  assert.equal(plan.outcome, 'planned'); assert.match(plan.snapshot.resourceIncarnation, /^pid:/);
  assert.equal(applyReconciliation(dir, plan, { now: '2026-09-15T00:00:01.000Z' }).outcome, 'applied');
  assert.equal(fs.existsSync(path.join(dir, '.fgos', 'dispatch.lock')), false);
  assert.equal(applyReconciliation(dir, plan, { now: '2026-09-15T00:00:02.000Z' }).outcome, 'already-applied');
});

test('reconcile refuses ttl-only or live/ambiguous proof and never unlinks a successor', () => {
  const dir = root(); fs.writeFileSync(path.join(dir, '.fgos', 'dispatch.lock'), JSON.stringify({ pid: process.pid, startTime: 'wrong', expiresAt: '2000-01-01T00:00:00.000Z' }));
  // Reused/mismatched incarnation is dead proof, but successor replacement is CAS-stale.
  const plan = planReconciliation(dir, { now: '2026-09-15T00:00:00.000Z' }); assert.equal(plan.outcome, 'planned');
  fs.writeFileSync(path.join(dir, '.fgos', 'dispatch.lock'), JSON.stringify({ pid: process.pid, startTime: 'other' }));
  assert.equal(applyReconciliation(dir, plan, { now: '2026-09-15T00:00:01.000Z' }).outcome, 'plan-stale');
  assert.equal(fs.existsSync(path.join(dir, '.fgos', 'dispatch.lock')), true);
  assert.equal(planReconciliation(dir, { action: 'kill-process' }).outcome, 'refused');
});

test('planReconciliation refuses a live holder (real resource-incarnation match) and never produces a plan', () => {
  const dir = root();
  const actualStart = fs.readFileSync(`/proc/${process.pid}/stat`, 'utf8').trim().split(' ')[21];
  fs.writeFileSync(path.join(dir, '.fgos', 'dispatch.lock'), JSON.stringify({ pid: process.pid, startTime: actualStart }));
  const plan = planReconciliation(dir, { now: '2026-09-15T00:00:00.000Z' });
  assert.equal(plan.outcome, 'refused');
  assert.match(plan.reason, /live/);
});

test('apply detects a controlEpoch change on the still-dead holder between planning and apply as plan-stale', () => {
  const dir = root();
  fs.writeFileSync(path.join(dir, '.fgos', 'dispatch.lock'), JSON.stringify({ pid: 99999999, startTime: '1', controlEpoch: 1 }));
  const plan = planReconciliation(dir, { now: '2026-09-15T00:00:00.000Z' });
  assert.equal(plan.outcome, 'planned');
  assert.equal(plan.snapshot.controlEpoch, 1);
  fs.writeFileSync(path.join(dir, '.fgos', 'dispatch.lock'), JSON.stringify({ pid: 99999999, startTime: '1', controlEpoch: 2 }));
  const result = applyReconciliation(dir, plan, { now: '2026-09-15T00:00:01.000Z' });
  assert.equal(result.outcome, 'plan-stale');
  assert.equal(fs.existsSync(path.join(dir, '.fgos', 'dispatch.lock')), true);
});

test('apply against a dead holder proves plan-stale when a successor guard replaces it, and the successor bytes survive intact', () => {
  const dir = root(); deadLock(dir);
  const lockPath = path.join(dir, '.fgos', 'dispatch.lock');
  const plan = planReconciliation(dir, { now: '2026-09-15T00:00:00.000Z' });
  assert.equal(plan.outcome, 'planned');
  const successorBytes = JSON.stringify({ pid: 12345, startTime: 'successor-incarnation' });
  fs.writeFileSync(lockPath, successorBytes);
  const result = applyReconciliation(dir, plan, { now: '2026-09-15T00:00:01.000Z' });
  assert.equal(result.outcome, 'plan-stale');
  assert.equal(fs.readFileSync(lockPath, 'utf8'), successorBytes, "successor's own bytes must survive intact");
});

test('a cwd lock removed by a concurrent cleanup before apply\'s final re-read returns plan-stale, not a throw', () => {
  const dir = root(); deadLock(dir);
  const lockPath = path.join(dir, '.fgos', 'dispatch.lock');
  const plan = planReconciliation(dir, { now: '2026-09-15T00:00:00.000Z' });
  assert.equal(plan.outcome, 'planned');
  const original = fs.readFileSync;
  // applyReconciliation reads lockPath 3 times before its own explicit
  // final re-read: twice inside the internal `fresh = planReconciliation(...)`
  // re-verify (its own `raw` read, then `json(file)`'s internal read), and
  // once more inside `inspectDispatchRuntime`'s cwd-evidence lookup. Only the
  // 4th read is the actual target this test races against -- delete the
  // file BEFORE that read runs (not after, which would let the read still
  // succeed and only make the later unlink hit ENOENT instead, a different,
  // already-tolerated branch), so the read itself genuinely throws ENOENT.
  let lockPathReads = 0;
  fs.readFileSync = function patchedReadFileSync(file, ...rest) {
    if (file === lockPath) {
      lockPathReads += 1;
      if (lockPathReads === 4) fs.unlinkSync(lockPath); // simulate a concurrent cleanup racing the final re-read
    }
    return original.call(fs, file, ...rest);
  };
  let result;
  try {
    result = applyReconciliation(dir, plan, { now: '2026-09-15T00:00:01.000Z' });
  } finally {
    fs.readFileSync = original;
  }
  assert.equal(result.outcome, 'plan-stale');
  assert.match(result.reason, /already removed/);
  assert.equal(fs.existsSync(lockPath), false);
});

test('apply blocks a dead-holder cleanup when an active assignment Run is still bound to this cwd', () => {
  const dir = root(); deadLock(dir);
  const plan = planReconciliation(dir, { now: '2026-09-15T00:00:00.000Z' });
  assert.equal(plan.outcome, 'planned');
  const runDir = path.join(dir, '.fgos', 'assignments', 'asgn-x', 'runs', '01');
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(path.join(runDir, 'run.json'), JSON.stringify({ runId: 'run-x', assignmentId: 'asgn-x', cwd: dir }));
  const result = applyReconciliation(dir, plan, { now: '2026-09-15T00:00:01.000Z' });
  assert.equal(result.outcome, 'blocked');
  assert.match(result.reason, /active Run/);
  assert.equal(fs.existsSync(path.join(dir, '.fgos', 'dispatch.lock')), true);
});

test('apply blocks a dead-holder cleanup when a pending (unsettled) dispatch launch is still bound to this cwd', () => {
  const dir = root(); deadLock(dir);
  const plan = planReconciliation(dir, { now: '2026-09-15T00:00:00.000Z' });
  assert.equal(plan.outcome, 'planned');
  const runDir = path.join(dir, '.fgos', 'dispatch-runs', 'fanout-group-x', '01');
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(path.join(runDir, 'run.json'), JSON.stringify({ runId: 'run-launch-x', cwd: dir }));
  // No result.json yet: this launch was admitted but has not settled.
  const result = applyReconciliation(dir, plan, { now: '2026-09-15T00:00:01.000Z' });
  assert.equal(result.outcome, 'blocked');
  assert.match(result.reason, /active Run/);
  assert.equal(fs.existsSync(path.join(dir, '.fgos', 'dispatch.lock')), true);
});
