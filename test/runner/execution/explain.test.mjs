// fgos dispatch explain: the binding a run would get for a capability, laid beside the tier cell and
// the accounts of the pools on the walk. It binds through bind() and reads nothing else that decides.

import '../../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { explainCapability } from '../../../src/runner/execution/explain.mjs';
import { bind } from '../../../src/runner/execution/bind.mjs';
import { loadRunnerConfigFromDir } from '../../../src/runner/dispatch/config.mjs';
import { seedFileLocalBwrapRegistry } from '../confinement-registry-fixture.helper.mjs';

seedFileLocalBwrapRegistry();

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const headless = { headless: true, herdrPresent: false };

function deepseekConfig() {
  return {
    rigorToTier: { low: 'nano', standard: 'standard', high: 'flagship', critical: 'frontier' },
    modelPolicies: { deepseek: { standard: ['deepseek-v4-flash@deepseek-api', 'deepseek/deepseek-v4-flash'] } },
    capabilities: { research: { prefer: [{ executor: 'deepseek' }] } },
    executors: {
      deepseek: {
        kind: 'agent',
        providerModel: 'deepseek',
        command: 'pi',
        invocations: [{ id: 'pi-cli-bwrap', via: 'cli', adapter: 'cli-spawn', command: 'pi', args: ['--model', '{model}', '-p', '{prompt}'], confinement: { backend: 'bwrap' }, credentialStore: { use: 'pi', homeEnv: 'PI_CODING_AGENT_DIR', files: ['auth.json'] } }],
      },
    },
    providers: { deepseek: { accounts: { openrouter: { credentialSource: { kind: 'home-files', home: '/srv/pi-openrouter', files: ['auth.json'] } } } } },
    llmAccounts: {
      deepseek: { direct: { credentialStore: { pi: '/srv/pi-deepseek' } } },
      'deepseek-api': { key1: { credentialStore: { pi: '/srv/pi-deepseek-api' } } },
    },
  };
}

test('explain reports the entry that runs, the entries that follow it and the pools of the walk', () => {
  const result = explainCapability(deepseekConfig(), { capability: 'research', session: headless });
  assert.equal(result.family, 'deepseek');
  assert.equal(result.executor.id, 'deepseek');
  assert.equal(result.executor.source, 'capability:research');
  assert.equal(result.invocation, 'pi-cli-bwrap');
  assert.deepEqual(result.credentialStore, { use: 'pi', homeEnv: 'PI_CODING_AGENT_DIR', files: ['auth.json'], source: 'declared' });
  assert.deepEqual(result.tier, { value: 'standard', source: 'rigor:standard', ceiling: null });
  assert.equal(result.model.value, 'deepseek-v4-flash', 'the first entry of the cell whose pool can run it');
  assert.equal(result.pool, 'deepseek-api');
  assert.deepEqual(result.cell.entries, [
    { model: 'deepseek-v4-flash', pool: 'deepseek-api', status: 'used' },
    { model: 'deepseek/deepseek-v4-flash', pool: 'deepseek', status: 'fallback' },
  ]);
  assert.deepEqual(result.walk.map((step) => [step.pool, step.model, step.store]), [
    ['deepseek-api', 'deepseek-v4-flash', 'pi'],
    ['deepseek', 'deepseek/deepseek-v4-flash', 'pi'],
  ]);
});

test('explain names why an entry is out: a pool with no account holding the CLI\'s store', () => {
  const cfg = deepseekConfig();
  delete cfg.llmAccounts['deepseek-api'];
  const result = explainCapability(cfg, { capability: 'research', session: headless });
  assert.equal(result.model.value, 'deepseek/deepseek-v4-flash');
  assert.deepEqual(result.cell.entries.map((e) => [e.pool, e.status]), [['deepseek-api', 'unusable'], ['deepseek', 'used']]);
  assert.match(result.cell.entries[0].reason, /pool "deepseek-api" has no account/);
  const out = result.candidates.find((c) => c.pool === 'deepseek-api');
  assert.equal(out.state, 'out');
  assert.equal(out.reason, 'pool-unusable');
});

test('explain names the store an older config implies, and none for an invocation that reads no store', () => {
  const cfg = deepseekConfig();
  const [inv] = cfg.executors.deepseek.invocations;
  delete cfg.llmAccounts;
  delete inv.credentialStore;
  inv.resourceBindings = [{ resource: 'private-home', target: { kind: 'env', name: 'PI_CODING_AGENT_DIR' } }];
  assert.deepEqual(explainCapability(cfg, { capability: 'research', session: headless }).credentialStore, { use: 'pi', homeEnv: 'PI_CODING_AGENT_DIR', source: 'inferred' });
  delete inv.resourceBindings;
  assert.equal(explainCapability(cfg, { capability: 'research', session: headless }).credentialStore, null);
});

test('explain lists the accounts of each pool on the walk in declared order, with what keeps one from running', () => {
  const cfg = deepseekConfig();
  cfg.llmAccounts['deepseek-api'] = {
    key1: { credentialStore: { pi: '/srv/pi-a' } },
    key2: { credentialStore: { pi: '/srv/pi-b' }, disabled: true },
    key3: { credentialStore: { omp: '/srv/omp-c' } },
  };
  const { accounts } = explainCapability(cfg, { capability: 'research', session: headless });
  assert.deepEqual(accounts.map((a) => a.pool), ['deepseek-api', 'deepseek']);
  assert.equal(accounts[0].source, 'llmAccounts');
  assert.deepEqual(accounts[0].accounts, [
    { id: 'key1', usable: true },
    { id: 'key2', usable: false, reason: 'disabled' },
    { id: 'key3', usable: false, reason: 'no "pi" login store' },
  ]);
  assert.deepEqual(accounts[1].accounts, [{ id: 'direct', usable: true }]);
});

test('explain carries a refusal instead of a binding', () => {
  const config = deepseekConfig();
  config.capabilities.research.prefer = [];
  const result = explainCapability(config, { capability: 'research', session: headless });
  assert.ok(result.refused);
  assert.equal(result.family, undefined);
});

test('explain on the committed config agrees with bind() for every capability', () => {
  const runnerConfig = loadRunnerConfigFromDir(repoRoot);
  for (const capability of Object.keys(runnerConfig.capabilities)) {
    for (const session of [headless, { headless: true, herdrPresent: true }]) {
      const explained = explainCapability(runnerConfig, { capability, session });
      const bound = bind({ unit: { id: 'explain', capability, writes: [] }, role: 'producer' }, { runnerConfig, session });
      if (bound.refused) {
        assert.deepEqual(explained.refused, bound.refused, capability);
        continue;
      }
      assert.equal(explained.executor.id, bound.executor, capability);
      assert.equal(explained.invocation, bound.invocation, capability);
      assert.equal(explained.model.value, bound.model, capability);
      assert.equal(explained.tier.value, bound.tier, capability);
      assert.equal(explained.pool, bound.pool, capability);
      if (explained.cell.entries.length > 0) assert.ok(explained.cell.entries.some((e) => e.status === 'used' && e.model === bound.model), `${capability}: the model that runs is marked used`);
    }
  }
});
