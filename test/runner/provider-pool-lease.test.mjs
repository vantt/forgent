// The lease keys state, leases and quarantine by pool and ranks a pool's accounts in the order the
// config declares them. A pool declared in runner.llmAccounts supplies its own accounts; a pool it does
// not declare keeps reading runner.providers.

import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  acquireNamedAccountLease,
  auditLeaseReceipt,
  LEASE_CONFLICT_REASON,
  inspectProviderCapacity,
  providerAccountInventory,
  providerCapacityStatePaths,
  quarantineProviderAccount,
  validateProviderAccountInventory,
} from '../../src/runner/dispatch/provider-capacity.mjs';
import { deriveLegacyInventory, legacyStateKey, readLlmAccounts } from '../../src/runner/dispatch/llm-accounts.mjs';
import { configPinnedToAccount } from '../../src/runner/dispatch/provider-account-probe.mjs';
import { loadRunnerConfigFromDir } from '../../src/runner/dispatch/config.mjs';
import { checkById } from '../setup/helpers/setup-checks-harness.mjs';
import { seedFileLocalBwrapRegistry } from './confinement-registry-fixture.helper.mjs';

seedFileLocalBwrapRegistry();

process.env.FGOS_STATE_ROOT = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-provider-pool-state-root-'));

const mkRuntimeDir = () => fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-provider-pool-'));

const PI_FILES = ['auth.json', 'models-store.json', 'settings.json'];
const piInvocation = (id) => ({ id, via: 'cli', adapter: 'cli-spawn', command: 'pi', args: ['{prompt}'], confinement: { backend: 'bwrap' }, credentialStore: { use: 'pi', homeEnv: 'PI_CODING_AGENT_DIR', files: PI_FILES } });

function config(llmAccounts, extra = {}) {
  return {
    executor: { command: 'claude', args: ['{prompt}'] },
    timeoutMs: 1000,
    modelPolicies: { claude: { standard: 'sonnet' }, openai: { standard: 'gpt' }, deepseek: { standard: 'flash' } },
    executors: {
      openai: { kind: 'agent', providerModel: 'openai', command: 'codex', args: ['{prompt}'], invocations: [piInvocation('openai-pi')] },
      deepseek: { kind: 'agent', providerModel: 'deepseek', command: 'pi', args: ['{prompt}'], invocations: [piInvocation('deepseek-pi')] },
    },
    llmAccounts,
    ...extra,
  };
}

const openrouter = {
  'or-a': { credentialStore: { pi: '/srv/pi/or-a' } },
  'or-b': { credentialStore: { pi: '/srv/pi/or-b' } },
};

test('a pool declared in llmAccounts supplies its accounts in declared order, under its legacy state key', () => {
  const inventory = providerAccountInventory(config({
    openai: { zeta: { credentialStore: { codex: '/srv/codex/zeta' } }, alpha: { credentialStore: { codex: '/srv/codex/alpha' } } },
    openrouter,
  }));
  assert.deepEqual(Object.keys(inventory), ['openai-codex', 'openrouter']);
  assert.deepEqual(Object.keys(inventory['openai-codex'].accounts), ['zeta', 'alpha']);
  assert.equal(legacyStateKey('openai'), 'openai-codex');
});

test('a pool llmAccounts declares replaces the same pool of runner.providers; other pools keep reading runner.providers', () => {
  const providers = {
    'openai-codex': { accounts: { old: { credentialSource: { kind: 'codex-home', home: '/srv/old' } } } },
    xai: { accounts: { vantt: { credentialSource: { kind: 'home-files', home: '/srv/xai', files: ['agent.db'] } } } },
  };
  const inventory = providerAccountInventory(config({ openai: { fresh: { credentialStore: { codex: '/srv/codex/fresh' } } } }, { providers }));
  assert.deepEqual(Object.keys(inventory['openai-codex'].accounts), ['fresh']);
  assert.deepEqual(Object.keys(inventory.xai.accounts), ['vantt']);
  // The legacy-only reader still shows what runner.providers declares.
  assert.deepEqual(Object.keys(validateProviderAccountInventory(config({ openai: {} }, { providers }))['openai-codex'].accounts), ['old']);
});

test('a config without llmAccounts reads runner.providers exactly as before', () => {
  const providers = { xai: { accounts: { vantt: { credentialSource: { kind: 'home-files', home: '/srv/xai', files: ['agent.db'] } } } } };
  const { llmAccounts, ...plain } = config(undefined, { providers });
  assert.equal(llmAccounts, undefined);
  assert.deepEqual(providerAccountInventory(plain), validateProviderAccountInventory(plain));
});

test('a derived account has one credential source per CLI: codex-home for codex, the declared files for any other store', () => {
  const { inventory, unusable } = deriveLegacyInventory(config({
    openai: { tetnu: { credentialStore: { codex: '/srv/codex/tetnu', pi: '/srv/pi/tetnu' }, label: 'openai/tetnu' } },
  }));
  assert.deepEqual(unusable, []);
  assert.deepEqual(inventory['openai-codex'].accounts.tetnu, {
    id: 'tetnu',
    label: 'openai/tetnu',
    disabled: false,
    credentialSources: {
      codex: { kind: 'codex-home', home: '/srv/codex/tetnu', cli: 'codex' },
      pi: { kind: 'home-files', home: '/srv/pi/tetnu', files: PI_FILES, cli: 'pi' },
    },
  });
});

test('the files of a store come from the invocations of the pool family first, then from every invocation of that store', () => {
  const omp = (files) => ({ id: 'omp-cli', via: 'cli', adapter: 'cli-spawn', command: 'omp', args: ['{prompt}'], confinement: { backend: 'bwrap' }, credentialStore: { use: 'omp', homeEnv: 'PI_CODING_AGENT_DIR', files } });
  const runner = config({
    xai: { vantt: { credentialStore: { omp: '/srv/omp/xai' } } },
    gemini: { tetcu: { credentialStore: { omp: '/srv/omp/gemini' } } },
    openrouter: { shared: { credentialStore: { omp: '/srv/omp/shared' } } },
  }, {
    modelPolicies: { xai: {}, gemini: {} },
    executors: {
      xai: { kind: 'agent', providerModel: 'xai', command: 'omp', args: ['{prompt}'], invocations: [omp(['agent.db', 'config.yml', 'models.db'])] },
      gemini: { kind: 'agent', providerModel: 'gemini', command: 'omp', args: ['{prompt}'], invocations: [omp(['agent.db', 'config.yml'])] },
    },
  });
  const { inventory } = deriveLegacyInventory(runner);
  assert.deepEqual(inventory.xai.accounts.vantt.credentialSources.omp.files, ['agent.db', 'config.yml', 'models.db']);
  assert.deepEqual(inventory.gemini.accounts.tetcu.credentialSources.omp.files, ['agent.db', 'config.yml']);
  // A pool that is no family's own (openrouter) takes the union over every invocation of the store.
  assert.deepEqual(inventory.openrouter.accounts.shared.credentialSources.omp.files, ['agent.db', 'config.yml', 'models.db']);
});

test('a store no invocation declares files for leaves that CLI out of the account and is named, never run with an empty home', () => {
  const runner = config({ openrouter: { 'or-a': { credentialStore: { pi: '/srv/pi/or-a', agy: '/srv/agy/or-a' } } } });
  const { inventory, unusable } = deriveLegacyInventory(runner);
  assert.deepEqual(Object.keys(inventory.openrouter.accounts['or-a'].credentialSources), ['pi']);
  assert.deepEqual(unusable.map((u) => `${u.pool}/${u.account}/${u.cli}`), ['openrouter/or-a/agy']);

  const runtimeDir = mkRuntimeDir();
  const refused = acquireNamedAccountLease({ runnerConfig: runner, provider: 'openrouter', accountId: 'or-a', runId: 'run1', runtimeDir, cli: 'agy' });
  assert.equal(refused.status, 'refused');
  assert.equal(refused.reason, LEASE_CONFLICT_REASON);
  assert.match(refused.detail, /holds no "agy" login store/);

  const inspected = inspectProviderCapacity({ runnerConfig: runner, runtimeDir });
  assert.equal(inspected.providers.openrouter.accounts['or-a'].unusableFor[0].cli, 'agy');
});

test('a lease receipt is audited against the provider record: the lease it granted agrees, any other account, time or assignment differs', () => {
  const runner = config({ openrouter: { ...openrouter } });
  const runtimeDir = mkRuntimeDir();
  const selected = acquireNamedAccountLease({ runnerConfig: runner, provider: 'openrouter', accountId: 'or-b', assignmentId: 'unit-run-1/producer/1', runId: 'run1', runtimeDir, cli: 'pi' });
  const audit = (receipt, assignmentId = 'unit-run-1/producer/1') => auditLeaseReceipt(receipt, { assignmentId, runtimeDir });

  assert.equal(audit(selected.leaseReceipt), null);
  assert.match(audit({ ...selected.leaseReceipt, accountId: 'or-a' }), /receipt names openrouter\/or-a .* record names or-b selected /);
  assert.match(audit({ ...selected.leaseReceipt, acquiredAt: '2026-01-01T00:00:00.000Z' }), /record names or-b selected /);
  assert.match(audit(selected.leaseReceipt, 'unit-run-1/producer/2'), /no lease for this assignment/);
});

test('a disabled account is refused by the lease and shown by inspect', () => {
  const runner = config({ openrouter: { ...openrouter, 'or-a': { ...openrouter['or-a'], disabled: true } } });
  const runtimeDir = mkRuntimeDir();
  const refused = acquireNamedAccountLease({ runnerConfig: runner, provider: 'openrouter', accountId: 'or-a', runId: 'run0', runtimeDir, cli: 'pi' });
  assert.equal(refused.reason, LEASE_CONFLICT_REASON);
  const selected = acquireNamedAccountLease({ runnerConfig: runner, provider: 'openrouter', accountId: 'or-b', runId: 'run1', runtimeDir, cli: 'pi' });
  assert.equal(selected.accountId, 'or-b');
  assert.equal(inspectProviderCapacity({ runnerConfig: runner, runtimeDir }).providers.openrouter.accounts['or-a'].disabled, true);
});

test('pools keep separate leases and quarantine: quarantining one pool leaves another usable', () => {
  const runner = config({
    openrouter: { main: { credentialStore: { pi: '/srv/pi/or-main' } } },
    deepseek: { main: { credentialStore: { pi: '/srv/pi/ds-main' } } },
  });
  const runtimeDir = mkRuntimeDir();
  quarantineProviderAccount({ provider: 'openrouter', accountId: 'main', reasonCode: 'auth-token', quarantineKind: 'manual-clear', runtimeDir });

  const blocked = acquireNamedAccountLease({ runnerConfig: runner, provider: 'openrouter', accountId: 'main', runId: 'run1', runtimeDir });
  assert.equal(blocked.status, 'refused');
  assert.equal(blocked.reason, LEASE_CONFLICT_REASON);

  const free = acquireNamedAccountLease({ runnerConfig: runner, provider: 'deepseek', accountId: 'main', runId: 'run2', runtimeDir });
  assert.equal(free.status, 'selected');
  assert.equal(free.accountId, 'main');

  const providers = inspectProviderCapacity({ runnerConfig: runner, runtimeDir }).providers;
  assert.equal(providers.openrouter.accounts.main.healthy, false);
  assert.equal(providers.deepseek.accounts.main.healthy, true);
  assert.equal(providers.deepseek.accounts.main.openLeases.length, 1);
  assert.equal(providers.openrouter.accounts.main.openLeases.length, 0);
});

test('the pool openai keeps its legacy state key, so a lease taken under the old inventory is the same account', () => {
  const runtimeDir = mkRuntimeDir();
  const oldConfig = config(undefined, { providers: { 'openai-codex': { accounts: { tetnu: { credentialSource: { kind: 'codex-home', home: '/srv/codex/tetnu' } } } } } });
  const first = acquireNamedAccountLease({ runnerConfig: oldConfig, provider: 'openai-codex', accountId: 'tetnu', assignmentId: 'asgn', runId: 'run1', runtimeDir });
  assert.equal(first.accountId, 'tetnu');
  quarantineProviderAccount({ provider: 'openai-codex', accountId: 'tetnu', reasonCode: 'quota-limit', until: '2999-01-01T00:00:00.000Z', runtimeDir });

  const newConfig = config({ openai: { tetnu: { credentialStore: { codex: '/srv/codex/tetnu' } }, spare: { credentialStore: { codex: '/srv/codex/spare' } } } });
  assert.equal(
    acquireNamedAccountLease({ runnerConfig: newConfig, provider: 'openai-codex', accountId: 'tetnu', assignmentId: 'other', runId: 'run2', runtimeDir }).reason,
    LEASE_CONFLICT_REASON,
    'the quarantine written under the old inventory still applies to tetnu',
  );
  const second = acquireNamedAccountLease({ runnerConfig: newConfig, provider: 'openai-codex', accountId: 'spare', assignmentId: 'other', runId: 'run3', runtimeDir });
  assert.equal(second.accountId, 'spare');
  const state = JSON.parse(fs.readFileSync(providerCapacityStatePaths(runtimeDir).statePath, 'utf8'));
  assert.deepEqual(Object.keys(state.providers), ['openai-codex']);
});

test('a pinned account narrows the llmAccounts pool, so the lease can take only the pinned account', () => {
  const runner = config({ openrouter, deepseek: { main: { credentialStore: { pi: '/srv/pi/ds-main' } } } });
  const pinned = configPinnedToAccount(runner, { provider: 'openrouter', accountId: 'or-b' });
  assert.deepEqual(Object.keys(pinned.llmAccounts.openrouter), ['or-b']);
  assert.deepEqual(Object.keys(pinned.llmAccounts.deepseek), ['main'], 'another pool is left alone');
  const dropped = acquireNamedAccountLease({ runnerConfig: pinned, provider: 'openrouter', accountId: 'or-a', runId: 'run0', runtimeDir: mkRuntimeDir(), cli: 'pi' });
  assert.equal(dropped.reason, LEASE_CONFLICT_REASON, 'the narrowed pool no longer lists the other accounts');
  const selected = acquireNamedAccountLease({ runnerConfig: pinned, provider: 'openrouter', accountId: 'or-b', runId: 'run1', runtimeDir: mkRuntimeDir(), cli: 'pi' });
  assert.equal(selected.accountId, 'or-b');
});

test('a digits-only account id is refused by both inventories, naming the reason', () => {
  assert.throws(
    () => validateProviderAccountInventory({ providers: { openai: { accounts: { 7: { credentialSource: { kind: 'codex-home', home: '/x' } } } } } }),
    /digits only.*declared account order/,
  );
  const { pools, problems } = readLlmAccounts({ llmAccounts: { openrouter: { 42: { credentialStore: { pi: '/x' } }, ok: { credentialStore: { pi: '/y' } } } } });
  assert.deepEqual(problems.map((p) => p.code), ['account-id']);
  assert.match(problems[0].detail, /digits only/);
  assert.deepEqual(Object.keys(pools.openrouter.accounts), ['ok']);
});

test('the declared account order survives the merge of the global config into a loaded project config', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-pool-order-'));
  const home = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-pool-order-home-'));
  fs.mkdirSync(path.join(dir, '.fgos'), { recursive: true });
  fs.mkdirSync(path.join(home, '.fgos'), { recursive: true });
  const { llmAccounts, ...projectRunner } = config({
    openrouter: {
      zulu: { credentialStore: { pi: '/srv/pi/zulu' } },
      alpha: { credentialStore: { pi: '/srv/pi/alpha' } },
      mike: { credentialStore: { pi: '/srv/pi/mike' } },
    },
  });
  fs.writeFileSync(path.join(dir, '.fgos', 'config.json'), JSON.stringify({ runner: { ...projectRunner, defaults: { tier: 'standard' }, patterns: { seatBinding: { schema: 1 } } } }));
  fs.writeFileSync(path.join(home, '.fgos', 'config.json'), JSON.stringify({ runner: { llmAccounts } }));
  const prev = process.env.HOME;
  process.env.HOME = home;
  try {
    const loaded = loadRunnerConfigFromDir(dir);
    assert.deepEqual(Object.keys(providerAccountInventory(loaded).openrouter.accounts), ['zulu', 'alpha', 'mike']);
  } finally {
    process.env.HOME = prev;
  }
});

test('doctor warns about a store no invocation declares files for, and stays quiet when every store is covered', () => {
  const runCheck = (runner) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-pool-doctor-'));
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-pool-doctor-home-'));
    fs.mkdirSync(path.join(dir, '.fgos'), { recursive: true });
    fs.mkdirSync(path.join(home, '.fgos'), { recursive: true });
    const { llmAccounts, ...projectRunner } = runner;
    fs.writeFileSync(path.join(dir, '.fgos', 'config.json'), JSON.stringify({ runner: { ...projectRunner, defaults: { tier: 'standard' }, patterns: { seatBinding: { schema: 1 } } } }));
    fs.writeFileSync(path.join(home, '.fgos', 'config.json'), JSON.stringify({ runner: { llmAccounts } }));
    const prev = process.env.HOME;
    process.env.HOME = home;
    try {
      return checkById('llm-accounts-shape').check(dir);
    } finally {
      process.env.HOME = prev;
    }
  };
  const covered = runCheck(config({ openrouter }));
  assert.equal(covered.passed, true);
  assert.match(covered.message, /declares 2 accounts in 1 pools/);

  const uncovered = runCheck(config({ openrouter: { 'or-a': { credentialStore: { agy: '/srv/agy/or-a' } } } }));
  assert.equal(uncovered.passed, true);
  assert.match(uncovered.message, /^warning: .*openrouter\/or-a \(agy\)/);
});
