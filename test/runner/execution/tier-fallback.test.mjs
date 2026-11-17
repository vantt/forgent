// test/runner/execution/tier-fallback.test.mjs -- the walk of a failed seat on the committed config: it stays in
// its tier and keeps each family to its own tier cell. How a walk ranks candidates, skips a family with no cell and
// binds the next one is owned by packages/execution/contracts/bind.v1.json.

import '../../helpers/process-tmp-root.mjs';
import { committedRunnerConfig } from '../../helpers/committed-config.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';

import { explainSeat } from '../../../src/runner/execution/bind.mjs';
import { seedFileLocalBwrapRegistry } from '../confinement-registry-fixture.helper.mjs';
import { seedStubAgentClis } from '../../helpers/agent-clis.mjs';

seedFileLocalBwrapRegistry();
seedStubAgentClis('claude', 'codex', 'omp', 'pi');

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
