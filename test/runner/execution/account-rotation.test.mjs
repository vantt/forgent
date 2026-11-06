// test/runner/execution/account-rotation.test.mjs -- the pure decisions behind provider failover:
// whether a failed seat has another account to rotate to, which pools a walk must avoid, how the
// seat's earlier bindings are read back from its attempts, and how bind() excludes the pools.

import '../../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { bind } from '../../../src/runner/execution/bind.mjs';
import { answerProviderLimit } from '../../../src/runner/execution/run.mjs';
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

// What a seat does after a provider limit, as a table over the pure answer. The runner performs the answer;
// the launch proofs in run-provider-failover.test.mjs keep one real run of each way a limit can end.
const LIMIT = (cause) => ({ runResult: { classification: { failure: { code: 'provider-limit', cause } } } });
const LEASE_CONFLICT = { runResult: { classification: { failure: { code: 'provider-capacity-lease-conflict' } } } };
const BOUND = { executor: 'alpha', invocation: 'cli', transport: 'cli', pool: 'alpha', model: 'm' };
const PINNED = { ...BOUND, account: { pool: 'alpha', id: 'a1' } };
const limited = (account, extra = {}) => ({ binding: { ...BOUND, leaseAccount: account }, outcome: 'provider-limit', ...extra });
const rotated = (account) => limited(account, { fallbackFrom: { kind: 'account-rotation' } });
const TWO_ACCOUNTS = { total: 2, healthy: 1 };

test('a dead login with another healthy account of the pool is retried on it, and the pool is marked failed for the walk', () => {
  const answer = answerProviderLimit({ result: LIMIT('credential'), bound: BOUND, attempts: [limited('a1')], attemptNo: 0, rotation: TWO_ACCOUNTS, changed: null });
  assert.deepEqual(answer.walk.rotation, { continuity: BOUND, from: BOUND, rotation: true, failedAccounts: [{ pool: 'alpha', account: 'a1' }], detail: { accountsHealthy: 1 } });
  assert.equal(answer.walk.faultPool, 'alpha', 'a credential fault excludes the pool from the walk step after the rotation');
  assert.equal(answer.walk.step.from, BOUND);
});

test('a usage limit rotates the same way but does not mark the pool as a dead login', () => {
  const answer = answerProviderLimit({ result: LIMIT('quota'), bound: BOUND, attempts: [limited('a1')], attemptNo: 0, rotation: TWO_ACCOUNTS, changed: null });
  assert.ok(answer.walk.rotation);
  assert.equal(answer.walk.faultPool, undefined);
});

test('a provider with one account, no inventory, or no healthy account goes straight to the walk step', () => {
  for (const rotation of [{ total: 1, healthy: 0 }, { total: 2, healthy: 0 }, null]) {
    const answer = answerProviderLimit({ result: LIMIT('quota'), bound: BOUND, attempts: [limited('a1')], attemptNo: 0, rotation, changed: null });
    assert.equal(answer.walk.rotation, undefined, JSON.stringify(rotation));
    assert.deepEqual(answer.walk.step.tried.map((b) => b.leaseAccount), ['a1'], 'the walk step sees the attempt it follows');
  }
});

test('rotation stops after the accounts the provider has, and the step reports how many rotations were spent', () => {
  const attempts = [limited('a1'), rotated('a2')];
  const answer = answerProviderLimit({ result: LIMIT('credential'), bound: BOUND, attempts, attemptNo: 1, rotation: { total: 2, healthy: 1 }, changed: null });
  assert.equal(answer.walk.rotation, undefined);
  assert.equal(answer.walk.accountRotations, 1);
  assert.equal(answerProviderLimit({ result: LIMIT('credential'), bound: BOUND, attempts: [limited('a1')], attemptNo: 0, rotation: { total: 3, healthy: 2 }, changed: null }).walk.accountRotations, undefined);
});

test('a pinned account ends the seat on its limit: no rotation, no walk, the stop names the account', () => {
  const answer = answerProviderLimit({ result: LIMIT('credential'), bound: PINNED, attempts: [limited('a1')], attemptNo: 0, rotation: TWO_ACCOUNTS, changed: null });
  assert.equal(answer.walk, undefined);
  assert.equal(answer.stop.retryStopped.reason, 'account-pinned');
  assert.equal(answer.stop.fallbackExhausted.reason, 'account-pinned');
  assert.match(answer.stop.fallbackExhausted.detail, /alpha\/a1/);
  assert.deepEqual(answer.stop.fallbackExhausted.from, { executor: 'alpha', invocation: 'cli', transport: 'cli' });
});

test('a lease that could not take the named account rebinds from a view that excludes the accounts that failed, and starts no walk step', () => {
  const attempts = [limited('a1', { leaseConflict: true })];
  const answer = answerProviderLimit({ result: LEASE_CONFLICT, bound: BOUND, attempts, attemptNo: 0 });
  assert.deepEqual(answer, { rebind: { from: BOUND, reason: 'lease-conflict', failedAccounts: [{ pool: 'alpha', account: 'a1' }] } });
});

test('a lease conflict on a pinned account stops the seat naming the pin, and one repeated past the cap refuses the seat', () => {
  const pinned = answerProviderLimit({ result: LEASE_CONFLICT, bound: PINNED, attempts: [limited('a1', { leaseConflict: true })], attemptNo: 0 });
  assert.equal(pinned.stop.fallbackExhausted.reason, 'account-pinned');
  assert.equal(pinned.stop.retryStopped, undefined, 'nothing ran, so there is no retry to stop');
  const conflicts = (n) => Array.from({ length: n }, () => limited('a1', { leaseConflict: true }));
  assert.ok(answerProviderLimit({ result: LEASE_CONFLICT, bound: BOUND, attempts: conflicts(8), attemptNo: 7 }).rebind, 'eight conflicts in a row still rebind');
  const spent = answerProviderLimit({ result: LEASE_CONFLICT, bound: BOUND, attempts: conflicts(9), attemptNo: 8 });
  assert.equal(spent.stop.refused.reason, 'lease-conflict');
});

test('a seat that changed the worktree before its limit is not run again: it stops naming the paths, before any pin or rotation is considered', () => {
  const changed = { paths: ['README.md', 'notes.txt'], headMoved: false };
  const stop = answerProviderLimit({ result: LIMIT('quota'), bound: BOUND, attempts: [limited('a1')], attemptNo: 0, rotation: TWO_ACCOUNTS, changed });
  assert.equal(stop.stop.fallbackExhausted.reason, 'partial-writes');
  assert.deepEqual(stop.stop.fallbackExhausted.paths, changed.paths);
  assert.deepEqual(stop.stop.retryStopped.paths, changed.paths, 'the stop is recorded on the attempt');
  const pinned = answerProviderLimit({ result: LIMIT('quota'), bound: PINNED, attempts: [limited('a1')], attemptNo: 0, rotation: TWO_ACCOUNTS, changed });
  assert.equal(pinned.stop.fallbackExhausted.reason, 'partial-writes', 'a pinned seat names what it changed, not only the pin');
  assert.equal(pinned.stop.fallbackExhausted.accountPinned, 'alpha/a1');
  const moved = answerProviderLimit({ result: LIMIT('quota'), bound: BOUND, attempts: [limited('a1')], attemptNo: 0, rotation: TWO_ACCOUNTS, changed: { paths: [], headMoved: true } });
  assert.match(moved.stop.fallbackExhausted.detail, /HEAD moved/);
});

test('a seat whose changes cannot be told is not run again by itself; one that changed nothing, or took no baseline, still rotates', () => {
  const unknown = answerProviderLimit({ result: LIMIT('quota'), bound: BOUND, attempts: [limited('a1')], attemptNo: 0, rotation: TWO_ACCOUNTS, changed: { error: 'git failed' } });
  assert.equal(unknown.stop.fallbackExhausted.reason, 'partial-writes');
  assert.match(unknown.stop.fallbackExhausted.detail, /git failed/);
  for (const changed of [{ paths: [], headMoved: false }, null]) {
    assert.ok(answerProviderLimit({ result: LIMIT('quota'), bound: BOUND, attempts: [limited('a1')], attemptNo: 0, rotation: TWO_ACCOUNTS, changed }).walk.rotation, JSON.stringify(changed));
  }
});
