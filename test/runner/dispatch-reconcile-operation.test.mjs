import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { invokeDispatchReconcileOperation, DispatchReconcileError } from '../../src/verbs/dispatch/reconcile.mjs';
import {
  providerCapacityStatePaths,
  quarantineProviderAccount,
} from '../../src/runner/dispatch/provider-capacity.mjs';

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
// Real production per-cwd dispatch lock path/shape (see
// reconciliation-planner.mjs's own lockFile/cwdLockHolder doc comments).
function lockPathFor(dir, cwd = dir) { return path.join(dir, '.fgos', `dispatch--${encodeURIComponent(cwd)}.lock`); }
function deadLock(dir, cwd = dir) {
  const ts = Date.now();
  fs.writeFileSync(lockPathFor(dir, cwd), JSON.stringify({ pid: `99999999:${ts}:deadfixture`, ts }));
}

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
  const result = invokeDispatchReconcileOperation({ operationId: 'dispatch.runtime.reconcile', effect: 'write', ctx, payload: { cwd: dir } });
  assert.equal(result.outcome, 'planned');
});

test('invokeDispatchReconcileOperation with payload.apply routes to the real apply path and mutates the guard', () => {
  const dir = root();
  deadLock(dir);
  const ctx = { repoRoot: dir };
  const plan = invokeDispatchReconcileOperation({ operationId: 'dispatch.runtime.reconcile', effect: 'write', ctx, payload: { cwd: dir } });
  assert.equal(plan.outcome, 'planned');
  const applied = invokeDispatchReconcileOperation({ operationId: 'dispatch.runtime.reconcile', effect: 'write', ctx, payload: { apply: true, plan } });
  assert.equal(applied.outcome, 'applied');
  assert.equal(fs.existsSync(lockPathFor(dir)), false);
});

test('invokeDispatchReconcileOperation ignores a forged now/ttlMs in payload for both plan and apply (F6)', () => {
  const dir = root();
  deadLock(dir);
  const ctx = { repoRoot: dir };
  const forgedFuture = '2099-01-01T00:00:00.000Z';
  const plan = invokeDispatchReconcileOperation({
    operationId: 'dispatch.runtime.reconcile', effect: 'write', ctx,
    payload: { cwd: dir, now: forgedFuture, ttlMs: 999999999 },
  });
  assert.equal(plan.outcome, 'planned');
  // A forged now/ttlMs must never reach planReconciliation: expiresAt has
  // to be derived from the real wall clock plus the real default ttlMs
  // (5 minutes), never anywhere near the forged future timestamp.
  const expectedExpiresAtMs = Date.now() + 5 * 60 * 1000;
  assert.ok(
    Math.abs(Date.parse(plan.snapshot.expiresAt) - expectedExpiresAtMs) < 10000,
    `expiresAt (${plan.snapshot.expiresAt}) must track the real wall clock's default TTL, not the forged now/ttlMs`,
  );
  assert.ok(Date.parse(plan.snapshot.expiresAt) < Date.parse(forgedFuture));
  // A forged PAST now on apply must never make a still-fresh real plan look
  // expired.
  const applied = invokeDispatchReconcileOperation({
    operationId: 'dispatch.runtime.reconcile', effect: 'write', ctx,
    payload: { apply: true, plan, now: '1970-01-01T00:00:00.000Z' },
  });
  assert.equal(applied.outcome, 'applied');
});

test('dispatch reconcile provider-capacity clear-quarantine validates global inventory and writes audit', () => {
  const dir = root();
  const globalConfigPath = path.join(dir, 'global-config.json');
  const runtimeDir = path.join(dir, 'runtime');
  const runnerConfig = {
    runner: {
      providers: {
        'openai-codex': {
          accounts: {
            tetnu: {
              label: 'Tetnu',
              credentialSource: { kind: 'codex-home', home: path.join(dir, 'codex-tetnu') },
            },
          },
        },
      },
    },
  };
  fs.writeFileSync(globalConfigPath, `${JSON.stringify(runnerConfig, null, 2)}\n`);

  const ctx = { repoRoot: dir, actor: 'test-operator' };
  const unknown = invokeDispatchReconcileOperation({
    operationId: 'dispatch.runtime.reconcile', effect: 'write', ctx,
    payload: {
      providerCapacity: {
        action: 'clear-quarantine',
        provider: 'openai-codex',
        account: 'missing',
        reason: 'token refreshed',
        globalConfigPath,
        runtimeDir,
      },
    },
  });
  assert.equal(unknown.status, 'refused');
  assert.equal(unknown.reasonCode, 'unknown-account');

  const notQuarantined = invokeDispatchReconcileOperation({
    operationId: 'dispatch.runtime.reconcile', effect: 'write', ctx,
    payload: {
      providerCapacity: {
        action: 'clear-quarantine',
        provider: 'openai-codex',
        account: 'tetnu',
        reason: 'token refreshed',
        globalConfigPath,
        runtimeDir,
      },
    },
  });
  assert.equal(notQuarantined.status, 'refused');
  assert.equal(notQuarantined.reasonCode, 'not-quarantined');

  quarantineProviderAccount({
    runnerConfig,
    provider: 'openai-codex',
    accountId: 'tetnu',
    reasonCode: 'auth-token-expired',
    manualClear: true,
    runtimeDir,
    evidence: { runId: 'run_provider_capacity_clear_test' },
  });

  const cleared = invokeDispatchReconcileOperation({
    operationId: 'dispatch.runtime.reconcile', effect: 'write', ctx,
    payload: {
      providerCapacity: {
        action: 'clear-quarantine',
        provider: 'openai-codex',
        account: 'tetnu',
        reason: 'token refreshed',
        globalConfigPath,
        runtimeDir,
      },
    },
  });
  assert.equal(cleared.status, 'cleared');
  assert.equal(cleared.provider, 'openai-codex');
  assert.equal(cleared.accountId, 'tetnu');
  const state = JSON.parse(fs.readFileSync(providerCapacityStatePaths(runtimeDir).statePath, 'utf8'));
  assert.equal(state.providers['openai-codex'].accounts.tetnu.quarantine, null);
  assert.equal(state.audit.at(-1).action, 'clear-quarantine');
  assert.equal(state.audit.at(-1).actor, 'test-operator');
});
