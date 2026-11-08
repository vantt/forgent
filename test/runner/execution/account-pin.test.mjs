// test/runner/execution/account-pin.test.mjs -- an override may pin the account a seat runs on,
// written pool/account. bind() pins it on a seat whose first choice is served by that pool and records
// where the pin came from; any other seat binds unpinned, with the reason recorded (the seat-binding
// golden vectors own the rule that a pin never moves a seat to another pool). A bare or malformed id is refused.

import '../../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';

import { bind } from '../../../src/runner/execution/bind.mjs';
import { parseAccountPin, runnerConfigForBinding } from '../../../src/runner/execution/account-pin.mjs';
import { seedFileLocalBwrapRegistry } from '../confinement-registry-fixture.helper.mjs';

seedFileLocalBwrapRegistry();

const account = (id) => ({ label: id, credentialSource: { kind: 'home-files', home: `/nonexistent/${id}`, files: ['login'] } });
const agent = (family) => ({
  kind: 'agent',
  providerModel: family,
  command: `${family}-bin`,
  invocations: [{ id: `${family}-cli`, via: 'cli', adapter: 'cli-spawn', confinement: { backend: 'bwrap' }, credentialStore: { use: family, homeEnv: `${family.toUpperCase()}_HOME`, files: ['login'] } }],
});
const tiers = (cell) => ({ nano: cell, standard: cell, advanced: cell, flagship: cell, frontier: cell });

const runnerConfig = {
  executors: { alpha: agent('alpha'), beta: agent('beta'), delta: agent('delta'), gamma: agent('gamma'), probe: { ...agent('alpha'), kind: 'tool' } },
  modelPolicies: {
    alpha: tiers(['alpha-model', 'alpha-via-router@router']),
    beta: tiers('beta-model'),
    gamma: tiers('gamma-model'),
    delta: tiers('delta-via-router@router'),
  },
  capabilities: {
    'docs:write': { prefer: [{ executor: 'alpha' }, { executor: 'beta' }] },
    'docs:delta': { prefer: [{ executor: 'delta' }] },
    'docs:gamma': { prefer: [{ executor: 'gamma' }] },
    'docs:tool': { prefer: [{ executor: 'probe' }] },
  },
  providers: {
    alpha: { accounts: { a1: account('a1'), a2: account('a2') } },
    beta: { accounts: { b1: account('b1') } },
  },
  llmAccounts: {
    router: { r1: { credentialStore: { alpha: '/nonexistent/r1', delta: '/nonexistent/r1' } }, r2: { credentialStore: { alpha: '/nonexistent/r2', delta: '/nonexistent/r2' }, disabled: true } },
  },
};

const ask = (overrides, capability = 'docs:write') => ({
  unit: { id: 'u', capability, writes: [] },
  role: 'producer',
  overrides,
});
const ctx = { runnerConfig, session: { headless: true } };

test('an account of the pool serving the chosen entry is pinned and its source recorded', () => {
  const bound = bind(ask([{ origin: 'human-cli', account: 'alpha/a2' }]), ctx);
  assert.equal(bound.refused, undefined, JSON.stringify(bound.refused));
  assert.equal(bound.executor, 'alpha');
  assert.equal(bound.pool, 'alpha');
  assert.deepEqual(bound.account, { pool: 'alpha', id: 'a2' });
  assert.deepEqual(bound.provenance.account, { value: 'alpha/a2', source: 'override:human-cli' });
});

test('a seat whose first choice is an entry another pool serves is pinned on that pool', () => {
  const bound = bind(ask([{ origin: 'human-cli', account: 'router/r1' }], 'docs:delta'), ctx);
  assert.equal(bound.refused, undefined, JSON.stringify(bound.refused));
  assert.equal(bound.executor, 'delta');
  assert.equal(bound.pool, 'router');
  assert.equal(bound.model, 'delta-via-router');
  assert.deepEqual(bound.account, { pool: 'router', id: 'r1' });
});

test('a binding without a pinned account carries no account at all', () => {
  const bound = bind(ask([{ origin: 'human-cli', reasoningEffort: undefined }]), ctx);
  assert.equal(bound.account, undefined);
  assert.equal(bound.provenance.account, undefined);
});

test('a seat none of whose entries the pinned pool serves binds unpinned and says why', () => {
  const bound = bind(ask([{ origin: 'human-cli', account: 'router/r1' }], 'docs:gamma'), ctx);
  assert.equal(bound.refused, undefined);
  assert.equal(bound.executor, 'gamma');
  assert.equal(bound.account, undefined);
  assert.equal(bound.provenance.account.value, null);
  assert.equal(bound.provenance.account.skipped.reason, 'account-pin-other-pool');
  assert.match(bound.provenance.account.skipped.detail, /"router\/r1".*pool "router"/);
});

test('a pin that names an account of a pool with no account list is refused, naming the list to add', () => {
  const bound = bind(ask([{ origin: 'human-cli', account: 'gamma/g1' }], 'docs:gamma'), ctx);
  assert.equal(bound.refused.reason, 'account-pin-no-inventory');
  assert.match(bound.refused.detail, /account "gamma\/g1" cannot be pinned: pool "gamma" has no account list/);
});

test('an unknown account of the seat\'s own pool is refused, naming the pool\'s accounts', () => {
  const bound = bind(ask([{ origin: 'human-cli', account: 'alpha/a9' }]), ctx);
  assert.equal(bound.refused.reason, 'account-pin-unknown');
  assert.match(bound.refused.detail, /"alpha\/a9".*pool "alpha".*a1, a2/);
});

test('a disabled account of the seat\'s own pool is refused', () => {
  const bound = bind(ask([{ origin: 'human-cli', account: 'router/r2' }], 'docs:delta'), ctx);
  assert.equal(bound.refused.reason, 'account-pin-disabled');
});

test('a tool executor is not an agent seat, so no pin applies and the seat is refused by name', () => {
  const bound = bind(ask([{ origin: 'human-cli', account: 'alpha/a1' }], 'docs:tool'), ctx);
  assert.equal(bound.refused.reason, 'not-an-agent-seat');
});

test('an account that is not pool/account is refused, a bare id with the form to write', () => {
  for (const value of ['', 7, null, 'a2', '/a2', 'alpha/']) {
    const bound = bind(ask([{ origin: 'human-cli', account: value }]), ctx);
    assert.equal(bound.refused?.reason, 'account-pin-invalid', `account ${JSON.stringify(value)}`);
  }
  assert.match(parseAccountPin('a2').refused.detail, /pool\/account \(for example openai\/work\), got "a2"/);
});

test('an inherited object key is not an account', () => {
  for (const id of ['constructor', '__proto__', 'toString']) {
    const bound = bind(ask([{ origin: 'human-cli', account: `alpha/${id}` }]), ctx);
    assert.equal(bound.refused?.reason, 'account-pin-unknown', id);
  }
});

test('the pin follows the override scope: a role the override does not name binds freely', () => {
  const overrides = [{ origin: 'human-cli', scope: { role: 'producer' }, account: 'alpha/a1' }];
  const reviewer = bind({ ...ask(overrides), role: 'reviewer', readOnly: true }, ctx);
  assert.equal(reviewer.account, undefined);
});

test('the dispatch config of a pinned binding lists only the pinned account of its pool', () => {
  const bound = bind(ask([{ origin: 'human-cli', account: 'alpha/a2' }]), ctx);
  const pinned = runnerConfigForBinding(runnerConfig, bound);
  assert.deepEqual(Object.keys(pinned.providers.alpha.accounts), ['a2']);
  assert.deepEqual(Object.keys(pinned.providers.beta.accounts), ['b1'], 'other pools are untouched');
  assert.equal(runnerConfigForBinding(runnerConfig, { executor: 'alpha' }), runnerConfig, 'an unpinned binding keeps the config as it is');

  const viaRouter = runnerConfigForBinding(runnerConfig, bind(ask([{ origin: 'human-cli', account: 'router/r1' }], 'docs:delta'), ctx));
  assert.deepEqual(Object.keys(viaRouter.llmAccounts.router), ['r1']);
});

test('a pinned account launches through the invocation whose login store it holds, and one holding none is refused', () => {
  const store = (use) => ({ use, homeEnv: `${use.toUpperCase()}_HOME`, files: ['login'] });
  const twoClis = {
    ...runnerConfig,
    executors: {
      ...runnerConfig.executors,
      alpha: {
        ...agent('alpha'),
        invocations: [
          { id: 'alpha-omp', via: 'cli', adapter: 'cli-spawn', command: 'omp', confinement: { backend: 'bwrap' }, credentialStore: store('omp') },
          { id: 'alpha-agy', via: 'cli', adapter: 'cli-spawn', command: 'agy', confinement: { backend: 'bwrap' }, credentialStore: store('agy') },
        ],
      },
    },
    providers: {
      ...runnerConfig.providers,
      alpha: { accounts: {
        both: { label: 'both', credentialSources: { omp: account('both').credentialSource, agy: account('both').credentialSource } },
        agyOnly: { label: 'agyOnly', credentialSources: { agy: account('agyOnly').credentialSource } },
        none: { label: 'none', credentialSources: { codex: account('none').credentialSource } },
      } },
    },
  };
  const pinned = bind(ask([{ origin: 'human-cli', account: 'alpha/agyOnly' }]), { ...ctx, runnerConfig: twoClis });
  assert.equal(pinned.refused, undefined, JSON.stringify(pinned.refused));
  assert.equal(pinned.invocation, 'alpha-agy');
  assert.deepEqual(pinned.account, { pool: 'alpha', id: 'agyOnly' });
  const refused = bind(ask([{ origin: 'human-cli', account: 'alpha/none' }]), { ...ctx, runnerConfig: twoClis });
  assert.equal(refused.refused?.reason, 'account-pin-no-login');
});
