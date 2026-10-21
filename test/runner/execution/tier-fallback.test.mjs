// test/runner/execution/tier-fallback.test.mjs -- the walk of a failed seat: the failed family's
// remaining tier-cell entries first, then the families runner.tierFallback.<tier> declares (limited
// to the families `prefer` names), never leaving the tier; a family with no cell at the tier is
// skipped and recorded; a pool no account can serve gives no candidate.

import '../../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { bind, bindingIdentity, explainSeat } from '../../../src/runner/execution/bind.mjs';
import { seedFileLocalBwrapRegistry } from '../confinement-registry-fixture.helper.mjs';

seedFileLocalBwrapRegistry();

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
const families = (bindings) => bindings.map((b) => b.executor);

test('the primary follows prefer order; after a failure the walk follows the tier order, narrowed to prefer', () => {
  const cfg = config({ tierFallback: { standard: ['gamma', 'beta', 'delta', 'alpha'] } });
  assert.equal(bind(ask, ctx(cfg)).executor, 'alpha', 'prefer order picks the primary, not the tier order');
  assert.deepEqual(families(explainSeat(ask, ctx(cfg)).walk), ['alpha', 'gamma', 'beta', 'delta']);

  const narrow = config({ prefer: ['alpha', 'gamma'], tierFallback: { standard: ['gamma', 'beta', 'delta', 'alpha'] } });
  assert.deepEqual(families(explainSeat(ask, ctx(narrow)).walk), ['alpha', 'gamma'], 'a listed family prefer does not name is never reached');

  const widerPrefer = config({ prefer: ['alpha', 'beta', 'delta'], tierFallback: { standard: ['gamma'] } });
  assert.deepEqual(families(explainSeat(ask, ctx(widerPrefer)).walk), ['alpha'], 'a prefer family absent from the list is not a fallback target');
});

test('with no tier list the walk is the prefer order after the failed candidate', () => {
  const cfg = config();
  assert.deepEqual(families(explainSeat(ask, ctx(cfg)).walk), ['alpha', 'beta', 'gamma', 'delta']);
  const otherTier = config({ tierFallback: { flagship: ['delta', 'alpha'] } });
  assert.deepEqual(families(explainSeat(ask, ctx(otherTier)).walk), ['alpha', 'beta', 'gamma', 'delta'], 'a list for another tier does not apply');
});

test('the walk never leaves the tier it started at', () => {
  // The capability declares its tier; a unit's rigor says how careful it is and never moves the tier.
  const cfg = config({ tier: 'flagship', tierFallback: { flagship: ['delta', 'gamma'] } });
  const high = { ...ask, unit: { ...ask.unit, rigor: 'high' } };
  const walk = explainSeat(high, ctx(cfg)).walk;
  assert.deepEqual(families(walk), ['alpha', 'delta', 'gamma']);
  assert.ok(walk.every((b) => b.tier === 'flagship'));
  assert.deepEqual(walk.map((b) => b.model), ['alpha-l', 'delta-l', 'gamma-l'], 'each family runs its own cell at that tier');
});

test('two entries of one cell are two candidates in cell order, taken before the next family', () => {
  const cfg = config({
    modelPolicies: { alpha: cells('alpha', ['alpha-m@alpha', 'alpha-via-router@router']) },
    llmAccounts: { router: { r1: { credentialStore: { alpha: '/nonexistent/r1' } } } },
  });
  const walk = explainSeat(ask, ctx(cfg)).walk;
  assert.deepEqual(walk.map((b) => [b.executor, b.pool, b.model]), [
    ['alpha', 'alpha', 'alpha-m'],
    ['alpha', 'router', 'alpha-via-router'],
    ['beta', 'beta', 'beta-m'],
    ['gamma', 'gamma', 'gamma-m'],
    ['delta', 'delta', 'delta-m'],
  ]);
  const second = bind(ask, ctx(cfg), { walk: { tried: [walk[0]] } });
  assert.equal(second.provenance.fallbackFrom.walk, 'entry');
  assert.equal(second.provenance.fallbackFrom.pool, 'alpha');
  const third = bind(ask, ctx(cfg), { walk: { tried: walk.slice(0, 2) } });
  assert.equal(third.provenance.fallbackFrom.walk, 'family');
});

test('a fault excludes one pool and keeps the other pool of the same family', () => {
  const cfg = config({
    modelPolicies: { alpha: cells('alpha', ['alpha-m@alpha', 'alpha-via-router@router']) },
    llmAccounts: { router: { r1: { credentialStore: { alpha: '/nonexistent/r1' } } } },
  });
  const first = bind(ask, ctx(cfg));
  const next = bind(ask, ctx(cfg), { walk: { tried: [first], excludePools: ['alpha'] } });
  assert.deepEqual([next.executor, next.pool], ['alpha', 'router']);
  const none = bind(ask, ctx(config({ prefer: ['alpha'] })), { walk: { excludePools: ['alpha'] } });
  assert.equal(none.refused.reason, 'pool-excluded');
});

test('a pool no account can serve gives no candidate, and explain material says why', () => {
  const cfg = config({
    prefer: ['alpha'],
    modelPolicies: { alpha: cells('alpha', ['alpha-via-router@router', 'alpha-m']) },
    llmAccounts: { router: { r1: { credentialStore: { other: '/nonexistent/r1' } }, r2: { credentialStore: { alpha: '/nonexistent/r2' }, disabled: true } } },
  });
  const { ranked } = explainSeat(ask, ctx(cfg));
  assert.deepEqual(ranked.candidates.map((c) => c.pool), ['alpha']);
  assert.deepEqual(ranked.skipped.map((s) => [s.pool, s.reason]), [['router', 'pool-unusable']]);
  assert.match(ranked.skipped[0].detail, /no enabled account of pool "router" holds a "alpha" login store/);
  const bound = bind(ask, ctx(cfg));
  assert.equal(bound.pool, 'alpha');
  assert.equal(bound.provenance.skipped[0].pool, 'router');
  assert.equal(bound.provenance.skipped[0].reason, 'pool-unusable');
});

test('a missing tier cell refuses by name for an out-of-process agent seat', () => {
  const cfg = config({ prefer: ['alpha'] });
  delete cfg.modelPolicies.alpha.standard;
  const refused = bind(ask, ctx(cfg));
  assert.equal(refused.refused.reason, 'tier-cell-missing');
  assert.match(refused.refused.detail, /no allowed executor has a cell; change capabilities\."docs:write"\.prefer or set /);
  assert.equal(refused.refused.config, 'capabilities."docs:write".prefer', 'the refusal names the config line to change');

  const noPolicies = config({ prefer: ['alpha'] });
  delete noPolicies.modelPolicies.alpha;
  assert.equal(bind(ask, ctx(noPolicies)).refused.reason, 'tier-cell-missing');
});

test('the executor model is no longer a fallthrough for a missing cell', () => {
  const cfg = config({ prefer: ['alpha'] });
  delete cfg.modelPolicies.alpha.standard;
  cfg.executors.alpha.model = 'executor-model';
  assert.equal(bind(ask, ctx(cfg)).refused.reason, 'tier-cell-missing');
});

test('in a walk a family with no cell is skipped and recorded, and the skipped family names the cell to configure', () => {
  const cfg = config({ prefer: ['alpha', 'beta', 'gamma'] });
  delete cfg.modelPolicies.beta.standard;
  const first = bind(ask, ctx(cfg));
  const next = bind(ask, ctx(cfg), { walk: { tried: [first] } });
  assert.equal(next.executor, 'gamma');
  assert.deepEqual(next.provenance.skipped.map((s) => [s.family, s.reason]), [['beta', 'tier-cell-missing']]);
  const last = bind(ask, ctx(cfg), { walk: { tried: [first, next] } });
  assert.equal(last.refused.reason, 'no-candidate', 'nothing is left after the last candidate');

  const only = config({ prefer: ['alpha', 'beta'] });
  delete only.modelPolicies.beta.standard;
  const walk = { tried: [bind(ask, ctx(only))] };
  assert.equal(bind(ask, ctx(only), { walk }).refused.reason, 'no-candidate');
  const { ranked } = explainSeat(ask, ctx(only), { walk });
  assert.deepEqual(ranked.skipped.map((s) => [s.family, s.reason, s.config]), [['beta', 'tier-cell-missing', 'modelPolicies.beta.standard']], 'the skipped family names the cell to configure');
});

test('a seat that needs no model is not refused for a missing cell', () => {
  const cfg = config({ prefer: ['alpha'] });
  delete cfg.modelPolicies.alpha.standard;
  cfg.executors.alpha = { kind: 'agent', providerModel: 'alpha', agentType: 'generalist' };
  const bound = bind(ask, { runnerConfig: cfg, session: { headless: true, hasNativeAgent: true } });
  assert.equal(bound.refused, undefined, JSON.stringify(bound.refused));
  assert.equal(bound.mechanism, 'in-process');
  assert.equal(bound.pool, null);
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
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
  const committed = JSON.parse(fs.readFileSync(path.join(root, '.fgos', 'config.json'), 'utf8')).runner;
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
