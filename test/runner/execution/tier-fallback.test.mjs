// test/runner/execution/tier-fallback.test.mjs -- the walk of a failed seat: the failed family's
// remaining tier-cell entries first, then the families runner.tierFallback.<tier> declares (limited
// to the families `prefer` names), never leaving the tier; a family with no cell at the tier is
// skipped and recorded; a pool no account can serve gives no candidate.

import '../../helpers/process-tmp-root.mjs';
import { committedRunnerConfig } from '../../helpers/committed-config.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';

import { bind, bindingIdentity, explainSeat } from '../../../src/runner/execution/bind.mjs';
import { seedFileLocalBwrapRegistry } from '../confinement-registry-fixture.helper.mjs';
import { seedStubAgentClis } from '../../helpers/agent-clis.mjs';

seedFileLocalBwrapRegistry();
seedStubAgentClis('alpha-bin', 'beta-bin', 'gamma-bin', 'delta-bin', 'claude', 'codex', 'omp', 'pi');

const FAMILIES = ['alpha', 'beta', 'gamma', 'delta'];
const executor = (family) => ({
  kind: 'agent',
  providerModel: family,
  command: `${family}-bin`,
  invocations: [{
    id: `${family}-cli`,
    via: 'cli',
    adapter: 'cli-spawn',
    command: `${family}-bin`,
    confinement: { backend: 'bwrap' },
    credentialStore: { use: family, homeEnv: `${family.toUpperCase()}_HOME`, files: ['login'] },
  }],
});
const cells = (family, cell) => ({ nano: cell ?? `${family}-s`, standard: cell ?? `${family}-m`, advanced: cell ?? `${family}-m`, flagship: cell ?? `${family}-l`, frontier: cell ?? `${family}-l` });

function config({ prefer = FAMILIES, tier, tierFallback, modelPolicies = {}, llmAccounts, extra = {} } = {}) {
  return {
    defaults: { tier: 'standard' }, patterns: { seatBinding: { schema: 1 } },
    modelPolicies: { ...Object.fromEntries(FAMILIES.map((family) => [family, cells(family)])), ...modelPolicies },
    ...(tierFallback ? { tierFallback } : {}),
    ...(llmAccounts ? { llmAccounts } : {}),
    capabilities: { 'docs:write': { prefer: prefer.map((name) => ({ executor: name })), ...(tier ? { tier } : {}) } },
    executors: Object.fromEntries(FAMILIES.map((family) => [family, executor(family)])),
    ...extra,
  };
}

const ask = { unit: { id: 'u', capability: 'docs:write', writes: [] }, role: 'producer', readOnly: true };
const ctx = (runnerConfig) => ({ runnerConfig, session: { headless: true } });

test('explaining a seat with the fallback walk off still ranks every candidate and walks no chain', () => {
  const cfg = config({
    modelPolicies: { alpha: cells('alpha', ['alpha-m@alpha', 'alpha-via-router@router']) },
    llmAccounts: { router: { r1: { credentialStore: { alpha: '/nonexistent/r1' } } } },
  });
  const full = explainSeat(ask, ctx(cfg));
  const bare = explainSeat(ask, ctx(cfg), { chain: false });
  assert.deepEqual(bare.ranked.candidates, full.ranked.candidates);
  assert.deepEqual(bare.walk, []);
  assert.deepEqual(bare.binding, full.binding);
  assert.ok(full.walk.length > 1);
});

test('the executor model is no longer a fallthrough for a missing cell', () => {
  const cfg = config({ prefer: ['alpha'] });
  delete cfg.modelPolicies.alpha.standard;
  cfg.executors.alpha.model = 'executor-model';
  assert.equal(bind(ask, ctx(cfg)).refused.reason, 'tier-cell-missing');
});

test('the walk state is the earlier bindings: binding N+1 from the recorded ones equals the one the walk made', () => {
  const cfg = config({
    modelPolicies: { alpha: cells('alpha', ['alpha-m@alpha', 'alpha-via-router@router']) },
    llmAccounts: { router: { r1: { credentialStore: { alpha: '/nonexistent/r1' } } } },
    tierFallback: { standard: ['gamma', 'alpha', 'beta', 'delta'] },
  });
  const walk = explainSeat(ask, ctx(cfg)).walk;
  assert.equal(new Set(walk.map(bindingIdentity)).size, walk.length, 'a candidate is never visited twice');
  walk.forEach((binding, index) => {
    const recomputed = bind(ask, ctx(cfg), { walk: { tried: JSON.parse(JSON.stringify(walk.slice(0, index))) } });
    assert.deepEqual(recomputed, binding, `step ${index}`);
  });
  assert.ok(bind(ask, ctx(cfg), { walk: { tried: walk } }).refused, 'with every candidate tried nothing is left');
});

test('a committed-config walk stays in its tier and keeps each family to its own tier cell', () => {
  const committed = committedRunnerConfig();
  const DOER = ['gemini', 'deepseek', 'z-ai', 'claude', 'openai'];
  const PREMIUM = ['claude', 'openai', 'gemini', 'xai'];
  const withTier = (tier) => ({
    ...committed,
    governance: undefined,
    maxTier: undefined,
    tierFallback: { nano: DOER, standard: DOER, advanced: DOER, flagship: PREMIUM, frontier: PREMIUM },
    // The tier is declared by the config, per capability, the way a project declares it.
    capabilities: { ...committed.capabilities, 'marketing:research': { ...committed.capabilities['marketing:research'], tier } },
  });
  const familyOf = (id) => committed.executors[id].providerModel ?? committed.executors[id].provider;
  for (const [tier, order] of [['nano', DOER], ['standard', DOER], ['advanced', DOER], ['flagship', PREMIUM], ['frontier', PREMIUM]]) {
    const runnerConfig = withTier(tier);
    const tierAsk = { unit: { id: 'u', capability: 'marketing:research', writes: [] }, role: 'reviewer' };
    const walk = explainSeat(tierAsk, { runnerConfig, session: { headless: true } }).walk;
    assert.ok(walk.length > 1, `${tier}: a chain exists`);
    assert.ok(walk.every((b) => b.tier === tier), `${tier}: the chain stays in the tier`);
    const chain = walk.map((b) => familyOf(b.executor));
    for (const [index, family] of chain.entries()) {
      assert.ok(runnerConfig.modelPolicies[family]?.[tier] !== undefined, `${tier}: ${family} has a cell`);
      if (index > 0) assert.ok(order.includes(family), `${tier}: ${family} is on the tier's list`);
    }
    const listed = chain.slice(1);
    assert.deepEqual(listed, order.filter((family) => listed.includes(family)), `${tier}: the walk follows the declared order`);
    if (tier === 'flagship' || tier === 'frontier') {
      assert.ok(!chain.slice(1).some((family) => ['deepseek', 'z-ai'].includes(family)), `${tier}: no doer-only family in the chain`);
    }
  }
});
