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
