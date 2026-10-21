// test/runner/execution/account-rotation.test.mjs -- the pure decisions behind provider failover:
// whether a failed seat has another account to rotate to, which pools a walk must avoid, how the
// seat's earlier bindings are read back from its attempts, and how bind() excludes the pools.

import '../../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { bind } from '../../../src/runner/execution/bind.mjs';
import { credentialFaultPools, inspectAccountRotation, keptBindingOf, mayRotateAccount, triedBindingsOf, walkStateOf } from '../../../src/runner/execution/account-rotation.mjs';
import { quarantineProviderAccount } from '../../../src/runner/dispatch/provider-capacity.mjs';
import { makeFixtureDir } from '../../helpers/fixture-dir.mjs';
import { seedFileLocalBwrapRegistry } from '../confinement-registry-fixture.helper.mjs';

seedFileLocalBwrapRegistry();

const executor = (family) => ({
  kind: 'agent',
  providerModel: family,
  command: `${family}-bin`,
  args: ['{prompt}'],
  invocations: [{ id: 'cli', via: 'cli', adapter: 'cli-spawn', confinement: { backend: 'bwrap' }, command: `${family}-bin`, args: ['{prompt}'] }],
});

const runnerConfig = (prefer, providers = {}) => ({
  defaults: { tier: 'standard' }, patterns: { seatBinding: { schema: 1 } },
  modelPolicies: { alpha: { standard: 'm' }, beta: { standard: 'm' }, gamma: { standard: 'm' } },
  executors: { alpha: executor('alpha'), 'alpha-lite': executor('alpha'), beta: executor('beta'), gamma: executor('gamma') },
  capabilities: { 'docs:write': { prefer: prefer.map((name) => ({ executor: name })), rigor: 'standard' } },
  providers,
});

const ask = { unit: { id: 'u', capability: 'docs:write', writes: [] }, role: 'producer', readOnly: true };
const ctx = (cfg) => ({ runnerConfig: cfg, session: { headless: true } });

test('a retry needs a usable account and never exceeds the accounts the provider has', () => {
  assert.equal(mayRotateAccount(null, 0), false, 'no inventory, nothing to rotate to');
  assert.equal(mayRotateAccount({ total: 2, healthy: 0 }, 0), false, 'every account is out');
  assert.equal(mayRotateAccount({ total: 1, healthy: 1 }, 0), false, 'a single account is the one that just failed');
  assert.equal(mayRotateAccount({ total: 2, healthy: 1 }, 0), true);
  assert.equal(mayRotateAccount({ total: 2, healthy: 1 }, 1), false, 'one retry per other account');
  assert.equal(mayRotateAccount({ total: 3, healthy: 2 }, 1), true);
  assert.equal(mayRotateAccount({ total: 3, healthy: 2 }, 2), false);
  // Failures that are not quarantined leave every account "healthy": the bound still holds.
  assert.equal(mayRotateAccount({ total: 2, healthy: 2 }, 1), false);
});

test('the rotation state counts the enabled accounts of the pool and drops the quarantined ones', () => {
  const home = makeFixtureDir('fgos-rotation-');
  try {
    const providers = {
      alpha: {
        accounts: {
          a1: { credentialSource: { kind: 'home-files', home, files: ['login'] } },
          a2: { credentialSource: { kind: 'home-files', home, files: ['login'] } },
        },
      },
    };
    const cfg = runnerConfig(['alpha', 'beta'], providers);
    const runtimeDir = path.join(home, 'capacity');
    fs.mkdirSync(runtimeDir, { recursive: true });
    assert.deepEqual(inspectAccountRotation({ runnerConfig: cfg, pool: 'alpha', runtimeDir }), { pool: 'alpha', total: 2, healthy: 2 });
    assert.equal(inspectAccountRotation({ runnerConfig: cfg, pool: 'beta', runtimeDir }), null, 'a pool without inventory has nothing to rotate');
    quarantineProviderAccount({ provider: 'alpha', accountId: 'a1', reasonCode: 'auth-token', quarantineKind: 'manual-clear', runtimeDir });
    assert.deepEqual(inspectAccountRotation({ runnerConfig: cfg, pool: 'alpha', runtimeDir }), { pool: 'alpha', total: 2, healthy: 1 });
  } finally {
    fs.rmSync(home, { recursive: true, force: true });
  }
});

test('a disabled account of a declared pool is not one to rotate to', () => {
  const home = makeFixtureDir('fgos-rotation-');
  try {
    const cfg = runnerConfig(['alpha']);
    cfg.executors.alpha.invocations[0].credentialStore = { use: 'alpha', homeEnv: 'ALPHA_HOME', files: ['login'] };
    cfg.llmAccounts = { alpha: { a1: { credentialStore: { alpha: home } }, a2: { credentialStore: { alpha: home }, disabled: true } } };
    const runtimeDir = path.join(home, 'capacity');
    fs.mkdirSync(runtimeDir, { recursive: true });
    assert.deepEqual(inspectAccountRotation({ runnerConfig: cfg, pool: 'alpha', runtimeDir }), { pool: 'alpha', total: 1, healthy: 1 });
  } finally {
    fs.rmSync(home, { recursive: true, force: true });
  }
});

test('a walk step skips a pool the caller excludes and says it walked to the next candidate', () => {
  const cfg = runnerConfig(['alpha', 'alpha-lite', 'beta']);
  const first = bind(ask, ctx(cfg));
  assert.equal(first.executor, 'alpha');
  const plain = bind(ask, ctx(cfg), { walk: { tried: [first] } });
  assert.equal(plain.executor, 'alpha-lite');
  assert.equal(plain.provenance.fallbackFrom.kind, 'next-candidate');
  assert.equal(plain.provenance.fallbackFrom.walk, 'entry', 'another executor of the same family is a step within the family');
  const excluded = bind(ask, ctx(cfg), { walk: { tried: [first], excludePools: ['alpha'] } });
  assert.equal(excluded.executor, 'beta');
  assert.equal(excluded.provenance.fallbackFrom.walk, 'family');
  const pair = ctx(runnerConfig(['alpha', 'alpha-lite']));
  const none = bind(ask, pair, { walk: { tried: [bind(ask, pair)], excludePools: ['alpha'] } });
  assert.equal(none.refused.reason, 'pool-excluded');
});

test('the walk keeps preferring a family the sibling seats did not use', () => {
  const cfg = runnerConfig(['alpha', 'beta', 'gamma']);
  const spreadAsk = { ...ask, preferIndependentOf: [{ role: 'sibling', executor: 'beta' }] };
  const first = bind(spreadAsk, ctx(cfg));
  assert.equal(first.executor, 'alpha');
  const next = bind(spreadAsk, ctx(cfg), { walk: { tried: [first] } });
  assert.equal(next.executor, 'gamma', 'beta is in use by a sibling and gamma is not');
});

test('a retry on another account is the same binding with provenance saying so', () => {
  const cfg = runnerConfig(['alpha', 'beta']);
  const first = bind(ask, ctx(cfg));
  const retry = bind(ask, ctx(cfg), { walk: { continuity: first, from: first, rotation: true, detail: { accountsHealthy: 1 } } });
  assert.equal(retry.executor, first.executor);
  assert.equal(retry.invocation, first.invocation);
  assert.equal(retry.pool, first.pool);
  assert.equal(retry.model, first.model);
  assert.deepEqual(retry.provenance.fallbackFrom, {
    executor: 'alpha', invocation: first.invocation, transport: first.transport, pool: 'alpha', reason: 'provider-limit', kind: 'account-rotation', accountsHealthy: 1,
  });
  assert.equal(first.provenance.fallbackFrom, undefined, 'the original binding is left as it was');
});

test('the pools to avoid are rebuilt from the attempts: only logins that failed and were walked away from', () => {
  const unitRecord = {
    bindings: {
      'producer/1': [
        { binding: { executor: 'alpha', pool: 'alpha' }, outcome: 'provider-limit', failureCause: 'credential', boundAt: '2026-10-11T00:00:00.000Z' },
        { binding: { executor: 'beta', pool: 'beta' }, outcome: 'provider-limit', fallbackFrom: { kind: 'next-candidate' }, boundAt: '2026-10-11T00:00:01.000Z' },
        { binding: { executor: 'gamma', pool: 'gamma' }, outcome: 'pass', fallbackFrom: { kind: 'next-candidate' }, boundAt: '2026-10-11T00:00:02.000Z' },
      ],
      'other/1': [
        { binding: { executor: 'gamma', pool: 'router' }, outcome: 'provider-limit', failureCause: 'credential', boundAt: '2026-10-11T00:00:03.000Z' },
        { binding: { executor: 'gamma', pool: 'router' }, outcome: 'pass', fallbackFrom: { kind: 'account-rotation' }, boundAt: '2026-10-11T00:00:04.000Z' },
      ],
      'old/1': [
        { binding: { executor: 'alpha', candidateIndex: 0 }, outcome: 'provider-limit', failureCause: 'credential', boundAt: '2026-10-11T00:00:05.000Z' },
        { binding: { executor: 'beta', candidateIndex: 1 }, outcome: 'pass', fallbackFrom: { kind: 'next-candidate' }, boundAt: '2026-10-11T00:00:06.000Z' },
      ],
    },
  };
  assert.deepEqual([...credentialFaultPools(unitRecord)], ['alpha'], 'beta failed on a quota not a login, a rotation did not leave router, and a record without a pool is unreadable');
  assert.deepEqual([...credentialFaultPools(unitRecord, { boundBefore: Date.parse('2026-10-11T00:00:00.500Z') })], [], 'a walk made after the attempt was bound is not known to it');
  assert.deepEqual([...credentialFaultPools(unitRecord, { boundBefore: Date.parse('2026-10-11T00:00:01.000Z') })], ['alpha']);
  assert.deepEqual([...credentialFaultPools({})], []);
});

test('the walk state of an attempt is the bindings before it, without the attempts a rotation repeats or a record that carries no pool', () => {
  const attempt = (executor, pool, extra = {}) => ({ binding: pool === undefined ? { executor } : { executor, invocation: 'cli', pool, model: 'm' }, ...extra });
  const attempts = [attempt('alpha', 'alpha'), attempt('alpha', 'alpha'), attempt('beta', 'beta'), attempt('gamma', undefined)];
  assert.deepEqual(triedBindingsOf(attempts, 0), []);
  assert.deepEqual(triedBindingsOf(attempts, 1).map((b) => b.executor), [], 'a rotation retry resumes where the attempt it retries did');
  assert.deepEqual(triedBindingsOf(attempts, 2).map((b) => b.executor), ['alpha', 'alpha'], 'the walk step sees every attempt before it');
  assert.deepEqual(triedBindingsOf(attempts, 3).map((b) => b.executor), ['alpha', 'alpha', 'beta']);
  assert.deepEqual(triedBindingsOf(attempts, 4).map((b) => b.executor), ['alpha', 'alpha', 'beta'], 'an old record (no pool) is not walk state, the walk restarts at the primary for it');
  assert.deepEqual(triedBindingsOf(undefined, 2), []);
});

test('a seat in a later round keeps the binding its earlier round ended on, and the write gate recomputes with it', () => {
  const first = { executor: 'alpha', pool: 'alpha', model: 'alpha-m', invocation: 'alpha-cli', mechanism: 'out-of-process' };
  const fallback = { executor: 'beta', pool: 'beta', model: 'beta-m', invocation: 'beta-cli', mechanism: 'out-of-process' };
  const unitRecord = {
    bindings: {
      'side/1': [{ assignmentId: 'u/side/1', binding: first }, { assignmentId: 'u/side/1-fb1', binding: fallback }],
      'side/2': [{ assignmentId: 'u/side/2', binding: fallback }],
      'other/1': [{ assignmentId: 'u/other/1', binding: first }],
    },
  };
  assert.equal(keptBindingOf(unitRecord, 'side', 1), null, 'a first round keeps nothing');
  assert.deepEqual(keptBindingOf(unitRecord, 'side', 2), fallback, 'the last attempt of the earlier round, not its first');
  assert.equal(keptBindingOf(unitRecord, 'other', 2), first, 'only the same seat is kept');
  assert.deepEqual(walkStateOf(unitRecord, { seat: 'side', round: '2', assignmentId: 'u/side/2' }).continuity, fallback);
  assert.equal(walkStateOf(unitRecord, { seat: 'side', round: '1', assignmentId: 'u/side/1' }).continuity, undefined);
});
