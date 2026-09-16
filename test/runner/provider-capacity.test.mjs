import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  acquireProviderAccountLease,
  clearProviderAccountQuarantine,
  classifyProviderCapacityFault,
  inspectProviderCapacity,
  providerCapacityStatePaths,
  quarantineProviderAccount,
  rankProviderAccounts,
  releaseProviderAccountLease,
  stableHash,
  validateProviderAccountInventory,
} from '../../src/runner/dispatch/provider-capacity.mjs';

function mkTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-provider-capacity-test-'));
}

function runnerConfig() {
  return {
    executor: { command: 'claude', args: ['{prompt}'] },
    modelPolicies: { claude: { standard: 'sonnet' } },
    timeoutMs: 1000,
    providers: {
      'openai-codex': {
        accounts: {
          a: { label: 'codex/a', credentialSource: { kind: 'codex-home', home: '/tmp/a' } },
          b: { label: 'codex/b', credentialSource: { kind: 'codex-home', home: '/tmp/b' } },
          c: { label: 'codex/c', credentialSource: { kind: 'codex-home', home: '/tmp/c' } },
        },
      },
    },
  };
}

test('selector ranks by open leases, lastSelectedAt, then stable hash', () => {
  const inventory = validateProviderAccountInventory(runnerConfig());
  const state = {
    providers: {
      'openai-codex': {
        accounts: {
          a: { lastSelectedAt: '2026-09-16T01:00:00.000Z', leases: { run1: { pid: process.pid } } },
          b: { lastSelectedAt: '2026-09-16T02:00:00.000Z', leases: {} },
          c: { lastSelectedAt: '2026-09-16T03:00:00.000Z', leases: {} },
        },
      },
    },
    assignments: {},
  };
  assert.deepEqual(
    rankProviderAccounts({ provider: 'openai-codex', inventory, state, seed: 'seed' }).slice(0, 3),
    ['b', 'c', 'a'],
  );

  const hashSorted = rankProviderAccounts({
    provider: 'openai-codex',
    inventory,
    state: { providers: { 'openai-codex': { accounts: { a: { leases: {} }, b: { leases: {} }, c: { leases: {} } } } }, assignments: {} },
    seed: 'tie-seed',
  });
  assert.deepEqual(
    hashSorted,
    ['a', 'b', 'c'].sort((left, right) => stableHash('tie-seed', left).localeCompare(stableHash('tie-seed', right))),
  );
});

test('sticky assignment is honored only while account is present and not quarantined', () => {
  const inventory = validateProviderAccountInventory(runnerConfig());
  const state = {
    providers: {
      'openai-codex': {
        accounts: {
          a: { leases: {}, quarantine: { kind: 'manual-clear', reasonCode: 'auth-token' } },
          b: { leases: {}, lastSelectedAt: '2026-09-16T00:00:00.000Z' },
          c: { leases: {}, lastSelectedAt: '2026-09-16T01:00:00.000Z' },
        },
      },
    },
    assignments: { 'openai-codex:asgn1': { accountId: 'a' } },
  };
  assert.equal(rankProviderAccounts({ provider: 'openai-codex', inventory, state, assignmentId: 'asgn1', seed: 's' })[0], 'b');
  state.assignments['openai-codex:asgn1'] = { accountId: 'b' };
  assert.equal(rankProviderAccounts({ provider: 'openai-codex', inventory, state, assignmentId: 'asgn1', seed: 's' })[0], 'b');
});

test('lease acquire/release uses runId and does not reclaim by elapsed time alone', () => {
  const runtimeDir = mkTempDir();
  const first = acquireProviderAccountLease({
    runnerConfig: runnerConfig(),
    provider: 'openai-codex',
    assignmentId: 'asgn1',
    runId: 'run_asgn1_01',
    seed: 's',
    runtimeDir,
    now: new Date('2026-09-16T00:00:00.000Z'),
  });
  assert.equal(first.status, 'selected');
  const second = acquireProviderAccountLease({
    runnerConfig: runnerConfig(),
    provider: 'openai-codex',
    assignmentId: 'asgn2',
    runId: 'run_asgn2_01',
    seed: 's',
    runtimeDir,
    now: new Date('2026-09-20T00:00:00.000Z'),
  });
  assert.notEqual(second.accountId, first.accountId);

  const inspected = inspectProviderCapacity({ runnerConfig: runnerConfig(), runtimeDir });
  assert.equal(inspected.providers['openai-codex'].accounts[first.accountId].openLeases[0].runId, 'run_asgn1_01');
  assert.equal(releaseProviderAccountLease({ provider: 'openai-codex', accountId: first.accountId, runId: 'run_asgn1_01', runtimeDir }), true);
  assert.equal(inspectProviderCapacity({ runnerConfig: runnerConfig(), runtimeDir }).providers['openai-codex'].accounts[first.accountId].openLeases.length, 0);
});

test('lease reclaim requires dead-run proof', () => {
  const runtimeDir = mkTempDir();
  const { statePath } = providerCapacityStatePaths(runtimeDir);
  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  fs.writeFileSync(statePath, JSON.stringify({
    contract: 'provider-capacity-state.v1',
    providers: {
      'openai-codex': {
        accounts: {
          a: { leases: { deadRun: { runId: 'deadRun', pid: process.pid } } },
          b: { leases: {} },
          c: { leases: {} },
        },
      },
    },
    assignments: {},
    audit: [],
  }));

  const selected = acquireProviderAccountLease({
    runnerConfig: runnerConfig(),
    provider: 'openai-codex',
    assignmentId: 'asgn',
    runId: 'run_asgn_01',
    seed: 's',
    runtimeDir,
    runIsDead: (runId) => runId === 'deadRun',
  });
  assert.equal(selected.accountId, 'a');
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  assert.equal(state.providers['openai-codex'].accounts.a.leases.deadRun, undefined);
});

test('classifier quarantines only high-confidence stderr/provider outcomes', () => {
  assert.equal(classifyProviderCapacityFault({ provider: 'openai-codex', stderr: "ERROR: You've hit your usage limit" }).reasonCode, 'quota-limit');
  assert.equal(classifyProviderCapacityFault({ provider: 'openai-codex', stderr: 'No API key found for the selected model. Use /login.' }).reasonCode, 'auth-token');
  assert.equal(classifyProviderCapacityFault({ provider: 'openai-codex', stderr: '', adapterOutcome: 'paused-limit' }).reasonCode, 'quota-limit');
  assert.equal(classifyProviderCapacityFault({ provider: 'openai-codex', stderr: '', structuredAgent: { stopReason: 'paused-limit' } }).reasonCode, 'quota-limit');
  assert.equal(classifyProviderCapacityFault({ provider: 'openai-codex', stderr: 'tests mention quota in a report' }).action, 'evidence-only');
});

test('manual clear refuses unknown and non-quarantined accounts unless forced, then writes audit', () => {
  const runtimeDir = mkTempDir();
  assert.throws(() => clearProviderAccountQuarantine({
    runnerConfig: runnerConfig(), provider: 'openai-codex', accountId: 'missing', reason: 'x', runtimeDir,
  }), /unknown provider\/account/);
  assert.throws(() => clearProviderAccountQuarantine({
    runnerConfig: runnerConfig(), provider: 'openai-codex', accountId: 'a', reason: 'x', runtimeDir,
  }), /not quarantined/);

  quarantineProviderAccount({ provider: 'openai-codex', accountId: 'a', reasonCode: 'auth-token', quarantineKind: 'manual-clear', runtimeDir });
  const audit = clearProviderAccountQuarantine({
    runnerConfig: runnerConfig(), provider: 'openai-codex', accountId: 'a', reason: 'token refreshed', runtimeDir, caller: 'tester',
  });
  assert.equal(audit.action, 'clear-quarantine');
  assert.equal(audit.previousQuarantine.reasonCode, 'auth-token');
  assert.equal(inspectProviderCapacity({ runnerConfig: runnerConfig(), runtimeDir }).providers['openai-codex'].accounts.a.quarantine, null);
});
