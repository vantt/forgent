// test/runner/execution/account-pin.test.mjs -- an override may pin the provider account a seat
// runs on. bind() pins it on a seat whose bound executor's provider lists it and records where the
// pin came from; any other seat binds unpinned, with the reason recorded. A malformed id is refused.

import test from 'node:test';
import assert from 'node:assert/strict';

import { bind } from '../../../src/runner/execution/bind.mjs';
import { runnerConfigForBinding } from '../../../src/runner/execution/account-pin.mjs';

const account = (id) => ({ label: id, credentialSource: { kind: 'home-files', home: `/nonexistent/${id}`, files: ['login'] } });
const agent = (family) => ({
  kind: 'agent',
  providerModel: family,
  command: `${family}-bin`,
  invocations: [{ id: `${family}-cli`, via: 'cli', adapter: 'cli-spawn', confinement: { backend: 'bwrap' } }],
});

const runnerConfig = {
  executors: { alpha: agent('alpha'), beta: agent('beta'), gamma: agent('gamma'), probe: { ...agent('alpha'), kind: 'tool' } },
  capabilities: {
    'docs:write': { prefer: [{ executor: 'alpha' }, { executor: 'beta' }] },
    'docs:gamma': { prefer: [{ executor: 'gamma' }] },
    'docs:tool': { prefer: [{ executor: 'probe' }] },
  },
  providers: {
    alpha: { accounts: { a1: account('a1'), a2: account('a2') } },
    beta: { accounts: { b1: account('b1') } },
  },
};

const ask = (overrides, capability = 'docs:write') => ({
  unit: { id: 'u', capability, writes: [] },
  role: 'producer',
  overrides,
});
const ctx = { runnerConfig, session: { headless: true } };

test('an account of the bound executor\'s provider is pinned and its source recorded', () => {
  const bound = bind(ask([{ origin: 'human-cli', account: 'a2' }]), ctx);
  assert.equal(bound.refused, undefined, JSON.stringify(bound.refused));
  assert.equal(bound.executor, 'alpha');
  assert.deepEqual(bound.account, { provider: 'alpha', id: 'a2' });
  assert.deepEqual(bound.provenance.account, { value: 'a2', source: 'override:human-cli' });
});

test('a binding without a pinned account carries no account at all', () => {
  const bound = bind(ask([{ origin: 'human-cli', reasoningEffort: undefined }]), ctx);
  assert.equal(bound.account, undefined);
  assert.equal(bound.provenance.account, undefined);
});

test('a seat whose provider does not list the account binds unpinned and says why', () => {
  const bound = bind(ask([{ origin: 'human-cli', account: 'b1' }]), ctx);
  assert.equal(bound.refused, undefined);
  assert.equal(bound.executor, 'alpha', 'the pin does not steer which executor binds');
  assert.equal(bound.account, undefined);
  assert.equal(bound.provenance.account.value, null);
  assert.equal(bound.provenance.account.skipped.reason, 'account-pin-unknown');
  assert.match(bound.provenance.account.skipped.detail, /"b1".*providers\.alpha\.accounts.*"alpha"/);
  assert.match(bound.provenance.account.skipped.detail, /a1, a2/);
});

test('an executor whose provider has no account list binds unpinned', () => {
  const bound = bind(ask([{ origin: 'human-cli', account: 'a1' }], 'docs:gamma'), ctx);
  assert.equal(bound.account, undefined);
  assert.equal(bound.provenance.account.skipped.reason, 'account-pin-no-inventory');
  assert.match(bound.provenance.account.skipped.detail, /"gamma".*no account list/);
});

test('a tool executor leases no account, so it binds unpinned', () => {
  const bound = bind(ask([{ origin: 'human-cli', account: 'a1' }], 'docs:tool'), ctx);
  assert.equal(bound.account, undefined);
  assert.equal(bound.provenance.account.skipped.reason, 'account-pin-unsupported');
});

test('an account that is not a non-empty string is refused', () => {
  for (const value of ['', 7, null]) {
    const bound = bind(ask([{ origin: 'human-cli', account: value }]), ctx);
    assert.equal(bound.refused?.reason, 'account-pin-invalid', `account ${JSON.stringify(value)}`);
  }
});

test('an inherited object key is not an account', () => {
  for (const id of ['constructor', '__proto__', 'toString']) {
    const bound = bind(ask([{ origin: 'human-cli', account: id }]), ctx);
    assert.equal(bound.account, undefined, id);
    assert.equal(bound.provenance.account.skipped.reason, 'account-pin-unknown', id);
  }
});

test('the pin follows the override scope: a role the override does not name binds freely', () => {
  const overrides = [{ origin: 'human-cli', scope: { role: 'producer' }, account: 'a1' }];
  const reviewer = bind({ ...ask(overrides), role: 'reviewer', readOnly: true }, ctx);
  assert.equal(reviewer.account, undefined);
});

test('the dispatch config of a pinned binding lists only the pinned account of its provider', () => {
  const bound = bind(ask([{ origin: 'human-cli', account: 'a2' }]), ctx);
  const pinned = runnerConfigForBinding(runnerConfig, bound);
  assert.deepEqual(Object.keys(pinned.providers.alpha.accounts), ['a2']);
  assert.deepEqual(Object.keys(pinned.providers.beta.accounts), ['b1'], 'other providers are untouched');
  assert.equal(runnerConfigForBinding(runnerConfig, { executor: 'alpha' }), runnerConfig, 'an unpinned binding keeps the config as it is');
});
