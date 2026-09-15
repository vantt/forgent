import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { invokeDispatchReconcileOperation, DispatchReconcileError } from '../../src/verbs/dispatch/reconcile.mjs';

// invokeDispatchReconcileOperation had zero direct tests before this file --
// every prior test exercised planReconciliation/applyReconciliation
// directly, or bin/fgos.mjs's CLI handler, which (per this round's own
// production-route audit) calls reconcilePlanUseCase/reconcileApplyUseCase
// directly and never goes through this envelope function at all. This file
// proves the envelope itself refuses correctly, independent of whether any
// caller currently routes production traffic through it.

function root() {
  const out = fs.mkdtempSync(path.join(os.tmpdir(), 'dispatch-reconcile-op-'));
  fs.mkdirSync(path.join(out, '.fgos'), { recursive: true });
  return out;
}
function deadLock(dir) { fs.writeFileSync(path.join(dir, '.fgos', 'dispatch.lock'), JSON.stringify({ pid: 99999999, startTime: '1' })); }

test('invokeDispatchReconcileOperation refuses a mismatched operationId or effect, and never a read effect', () => {
  const ctx = { repoRoot: root() };
  assert.throws(() => invokeDispatchReconcileOperation({ operationId: 'dispatch.runtime.inspect', effect: 'write', ctx, payload: {} }), DispatchReconcileError);
  assert.throws(() => invokeDispatchReconcileOperation({ operationId: 'dispatch.runtime.reconcile', effect: 'read', ctx, payload: {} }), DispatchReconcileError);
  assert.throws(() => invokeDispatchReconcileOperation({ ctx, payload: {} }), DispatchReconcileError);
});

test('invokeDispatchReconcileOperation refuses a forbidden/unsupported reconcile action through the real production entry point', () => {
  const ctx = { repoRoot: root() };
  const result = invokeDispatchReconcileOperation({ operationId: 'dispatch.runtime.reconcile', effect: 'write', ctx, payload: { action: 'resume-driver' } });
  assert.equal(result.outcome, 'refused');
  assert.match(result.reason, /unsupported reconciliation action/);
});

test('invokeDispatchReconcileOperation with no --apply defaults to the plan path for a real dead-holder guard', () => {
  const dir = root();
  deadLock(dir);
  const ctx = { repoRoot: dir };
  const result = invokeDispatchReconcileOperation({ operationId: 'dispatch.runtime.reconcile', effect: 'write', ctx, payload: { now: '2026-09-15T00:00:00.000Z' } });
  assert.equal(result.outcome, 'planned');
});

test('invokeDispatchReconcileOperation with payload.apply routes to the real apply path and mutates the guard', () => {
  const dir = root();
  deadLock(dir);
  const ctx = { repoRoot: dir };
  const plan = invokeDispatchReconcileOperation({ operationId: 'dispatch.runtime.reconcile', effect: 'write', ctx, payload: { now: '2026-09-15T00:00:00.000Z' } });
  assert.equal(plan.outcome, 'planned');
  const applied = invokeDispatchReconcileOperation({ operationId: 'dispatch.runtime.reconcile', effect: 'write', ctx, payload: { apply: true, plan, now: '2026-09-15T00:00:01.000Z' } });
  assert.equal(applied.outcome, 'applied');
  assert.equal(fs.existsSync(path.join(dir, '.fgos', 'dispatch.lock')), false);
});
