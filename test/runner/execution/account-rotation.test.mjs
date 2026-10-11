// test/runner/execution/account-rotation.test.mjs -- the pure decisions behind provider failover:
// whether a failed seat has another account to rotate to, which families a walk must avoid, and how
// bind() excludes them.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { bind, nextCandidate, retrySameCandidate } from '../../../src/runner/execution/bind.mjs';
import { credentialFaultFamilies, inspectAccountRotation, mayRotateAccount } from '../../../src/runner/execution/account-rotation.mjs';
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
  rigorToTier: { standard: 'standard' },
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

test('the rotation state counts the accounts of the executor\'s provider and drops the quarantined ones', () => {
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
    assert.deepEqual(inspectAccountRotation({ runnerConfig: cfg, executorId: 'alpha', runtimeDir }), { provider: 'alpha', total: 2, healthy: 2 });
    assert.equal(inspectAccountRotation({ runnerConfig: cfg, executorId: 'beta', runtimeDir }), null, 'a provider without inventory has nothing to rotate');
    quarantineProviderAccount({ provider: 'alpha', accountId: 'a1', reasonCode: 'auth-token', quarantineKind: 'manual-clear', runtimeDir });
    assert.deepEqual(inspectAccountRotation({ runnerConfig: cfg, executorId: 'alpha', runtimeDir }), { provider: 'alpha', total: 2, healthy: 1 });
  } finally {
    fs.rmSync(home, { recursive: true, force: true });
  }
});

test('nextCandidate skips a family the caller excludes and says it walked to the next candidate', () => {
  const cfg = runnerConfig(['alpha', 'alpha-lite', 'beta']);
  const first = bind(ask, ctx(cfg));
  assert.equal(first.executor, 'alpha');
  const plain = nextCandidate(first, ask, ctx(cfg));
  assert.equal(plain.executor, 'alpha-lite');
  assert.equal(plain.provenance.fallbackFrom.kind, 'next-candidate');
  const excluded = nextCandidate(first, ask, ctx(cfg), 'provider-limit', { excludeFamilies: ['Alpha'] });
  assert.equal(excluded.executor, 'beta');
  assert.equal(excluded.candidateIndex, 2);
  const none = nextCandidate(bind(ask, ctx(runnerConfig(['alpha', 'alpha-lite']))), ask, ctx(runnerConfig(['alpha', 'alpha-lite'])), 'provider-limit', { excludeFamilies: ['alpha'] });
  assert.equal(none.refused.reason, 'family-excluded');
});

test('the walk keeps preferring a family the sibling seats did not use', () => {
  const cfg = runnerConfig(['alpha', 'beta', 'gamma']);
  const spreadAsk = { ...ask, preferIndependentOf: [{ role: 'sibling', executor: 'beta' }] };
  const first = bind(spreadAsk, ctx(cfg));
  assert.equal(first.executor, 'alpha');
  const next = nextCandidate(first, spreadAsk, ctx(cfg));
  assert.equal(next.executor, 'gamma', 'beta is in use by a sibling and gamma is not');
});

test('a retry on another account is the same binding with provenance saying so', () => {
  const cfg = runnerConfig(['alpha', 'beta']);
  const first = bind(ask, ctx(cfg));
  const retry = retrySameCandidate(first, { provider: 'alpha', accountsHealthy: 1 });
  assert.equal(retry.executor, first.executor);
  assert.equal(retry.invocation, first.invocation);
  assert.equal(retry.candidateIndex, first.candidateIndex);
  assert.deepEqual(retry.provenance.fallbackFrom, {
    executor: 'alpha', invocation: first.invocation, transport: first.transport, reason: 'provider-limit', kind: 'account-rotation', provider: 'alpha', accountsHealthy: 1,
  });
  assert.equal(first.provenance.fallbackFrom, undefined, 'the original binding is left as it was');
});

test('the families to avoid are rebuilt from the attempts: only logins that failed and were walked away from', () => {
  const cfg = runnerConfig(['alpha', 'beta', 'gamma']);
  const unitRecord = {
    configSnapshot: { runner: cfg },
    bindings: {
      'producer/1': [
        { binding: { executor: 'alpha' }, outcome: 'provider-limit', failureCause: 'credential', boundAt: '2026-10-11T00:00:00.000Z' },
        { binding: { executor: 'beta' }, outcome: 'provider-limit', fallbackFrom: { kind: 'next-candidate' }, boundAt: '2026-10-11T00:00:01.000Z' },
        { binding: { executor: 'gamma' }, outcome: 'pass', fallbackFrom: { kind: 'next-candidate' }, boundAt: '2026-10-11T00:00:02.000Z' },
      ],
      'other/1': [
        { binding: { executor: 'gamma' }, outcome: 'provider-limit', failureCause: 'credential', boundAt: '2026-10-11T00:00:03.000Z' },
        { binding: { executor: 'gamma' }, outcome: 'pass', fallbackFrom: { kind: 'account-rotation' }, boundAt: '2026-10-11T00:00:04.000Z' },
      ],
    },
  };
  assert.deepEqual([...credentialFaultFamilies(unitRecord)], ['alpha'], 'beta failed on a quota not a login, and a rotation did not leave gamma');
  assert.deepEqual([...credentialFaultFamilies(unitRecord, { boundBefore: Date.parse('2026-10-11T00:00:00.500Z') })], [], 'a walk made after the attempt was bound is not known to it');
  assert.deepEqual([...credentialFaultFamilies(unitRecord, { boundBefore: Date.parse('2026-10-11T00:00:01.000Z') })], ['alpha']);
  assert.deepEqual([...credentialFaultFamilies({})], []);
});
