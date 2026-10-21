// The tier a seat runs at, composed the way docs/specs/seat-binding.md section 5.4 and 6.3 say, on the config of
// section 10.1: the project wins, the workflow's seat tier is a recommendation that only the project's seat,
// persona and role keys beat, `maxTier` lowers a tier visibly, and nothing lowers it silently.
// The crate decides (golden vectors own the cases); these tests prove the Node side hands it the right
// question and carries the answer onto the binding, the evidence and `explain`.

import '../../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';

import { bind } from '../../../src/runner/execution/bind.mjs';
import { workflowTierOf } from '../../../src/runner/execution/seat-resolver.mjs';
import { seedFileLocalBwrapRegistry } from '../confinement-registry-fixture.helper.mjs';

seedFileLocalBwrapRegistry();

const FAMILIES = ['claude', 'openai', 'gemini', 'xai', 'deepseek'];
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
// deepseek serves no flagship or frontier cell, as in the spec's ladder.
const cells = (family) => (family === 'deepseek'
  ? { nano: `${family}-s`, mini: `${family}-s`, standard: `${family}-m`, advanced: `${family}-m` }
  : Object.fromEntries(['nano', 'mini', 'standard', 'advanced', 'flagship', 'frontier'].map((tier) => [tier, `${family}-${tier}`])));

// Spec 10.1, as the project would write it.
function specConfig(patch = {}) {
  return {
    defaults: { tier: 'standard' },
    maxTier: 'flagship',
    modelPolicies: Object.fromEntries(FAMILIES.map((family) => [family, cells(family)])),
    capabilities: {
      'architecture:*': {
        tier: 'flagship',
        rigor: 'high',
        prefer: ['claude', 'openai', 'gemini', 'xai', 'deepseek'],
        roles: { 'red-team': { prefer: ['xai'] } },
      },
      'architecture:shape': { rigor: 'critical', maxTier: 'frontier', seats: { system: { prefer: ['claude', 'openai'] } } },
      'architecture:critique': { maxTier: 'frontier', seats: { producer: { tier: 'frontier' } } },
      'architecture:synthesize': { rigor: 'critical', maxTier: 'frontier', seats: { producer: { tier: 'frontier' } } },
      ...patch.capabilities,
    },
    executors: Object.fromEntries(FAMILIES.map((family) => [family, executor(family)])),
    ...Object.fromEntries(Object.entries(patch).filter(([key]) => key !== 'capabilities')),
  };
}

const POSTURE = { readOnly: true, writer: false, forceOutOfProcess: true, inlineAllowed: false, stance: false, verdict: false };
const session = { headless: true };
const unitOf = (capability, rigor) => ({ id: 'unit', capability, writes: [], ...(rigor ? { rigor } : {}) });
const recommendation = (tier, seat, unit = 'shape-proposals') => ({ tier, source: `workflow:architecture-advisory/${unit}/${seat}` });
const seatAsk = (capability, seat, role, extra = {}) => ({ unit: unitOf(capability), seat, role, posture: POSTURE, ...extra });
const tierOf = (ask, config) => {
  const result = bind(ask, { runnerConfig: config, session });
  assert.equal(result.refused, undefined, JSON.stringify(result.refused));
  return result;
};

test('spec 10.2: each seat of architecture-advisory runs at the tier of the table, from the line the table names', () => {
  const config = specConfig();
  const rows = [
    // [capability, seat, role, workflow recommendation, tier, source, the maxTier line that applied]
    ['architecture:frame', 'producer', 'producer', undefined, 'flagship', 'capabilities."architecture:*".tier', 'maxTier'],
    ['architecture:shape', 'system', 'producer', recommendation('frontier', 'system'), 'frontier', 'workflow:architecture-advisory/shape-proposals/system', 'capabilities."architecture:shape".maxTier'],
    ['architecture:shape', 'alternative', 'producer', undefined, 'flagship', 'capabilities."architecture:*".tier', 'capabilities."architecture:shape".maxTier'],
    ['architecture:shape', 'synthesis', 'synthesizer', undefined, 'flagship', 'capabilities."architecture:*".tier', 'capabilities."architecture:shape".maxTier'],
    ['architecture:critique', 'producer', 'producer', undefined, 'frontier', 'capabilities."architecture:critique".seats.producer.tier', 'capabilities."architecture:critique".maxTier'],
    ['architecture:critique', 'reviewer', 'reviewer', undefined, 'flagship', 'capabilities."architecture:*".tier', 'capabilities."architecture:critique".maxTier'],
    ['architecture:critique', 'red-team', 'red-team', undefined, 'flagship', 'capabilities."architecture:*".tier', 'capabilities."architecture:critique".maxTier'],
    ['architecture:synthesize', 'producer', 'producer', undefined, 'frontier', 'capabilities."architecture:synthesize".seats.producer.tier', 'capabilities."architecture:synthesize".maxTier'],
    ['architecture:synthesize', 'reviewer', 'reviewer', undefined, 'flagship', 'capabilities."architecture:*".tier', 'capabilities."architecture:synthesize".maxTier'],
    ['architecture:explain', 'producer', 'producer', undefined, 'flagship', 'capabilities."architecture:*".tier', 'maxTier'],
  ];
  for (const [capability, seat, role, workflowTier, tier, source, maxTierLine] of rows) {
    const result = tierOf(seatAsk(capability, seat, role, workflowTier ? { workflowTier } : {}), config);
    const label = `${capability} / ${seat}`;
    assert.equal(result.tier, tier, label);
    assert.equal(result.provenance.tier.source, source, label);
    assert.equal(result.provenance.tier.maxTier.source, maxTierLine, label);
    assert.equal(result.provenance.tier.maxTier.applied, false, `${label}: nothing is lowered in the base config`);
    assert.equal(result.provenance.tier.loweredFrom, undefined, label);
  }
});

test('the workflow recommendation beats the capability tier and its prefix tier, and says what it beat', () => {
  const rec = recommendation('frontier', 'system');
  const viaCapability = tierOf(
    seatAsk('code:review', 'system', 'producer', { workflowTier: rec }),
    specConfig({ maxTier: 'frontier', capabilities: { 'code:review': { tier: 'standard', prefer: ['claude'] } } }),
  );
  assert.equal(viaCapability.tier, 'frontier');
  assert.equal(viaCapability.provenance.tier.source, rec.source);
  const viaPrefix = tierOf(
    seatAsk('code:review', 'system', 'producer', { workflowTier: rec }),
    specConfig({ maxTier: 'frontier', capabilities: { 'code:*': { tier: 'mini', prefer: ['claude'] } } }),
  );
  assert.equal(viaPrefix.tier, 'frontier');
  assert.equal(viaPrefix.provenance.tier.source, rec.source);
});

test('the project seat, persona and role keys each beat the workflow recommendation; the chosen tier carries the recommendation', () => {
  const rec = recommendation('frontier', 'system');
  const keyed = (key) => specConfig({
    maxTier: 'frontier',
    capabilities: { 'code:review': { prefer: ['claude'], tier: 'advanced', ...key } },
  });
  const check = (key, extraAsk, source) => {
    const result = tierOf(seatAsk('code:review', 'system', 'producer', { workflowTier: rec, ...extraAsk }), keyed(key));
    assert.equal(result.tier, 'flagship', source);
    assert.equal(result.provenance.tier.source, source);
    assert.deepEqual(result.provenance.tier.recommendation, rec, `${source}: the recommendation it overrode is named`);
  };
  check({ seats: { system: { tier: 'flagship' } } }, {}, 'capabilities."code:review".seats.system.tier');
  check({ personas: { critic: { tier: 'flagship' } } }, { persona: 'critic' }, 'capabilities."code:review".personas.critic.tier');
  check({ roles: { producer: { tier: 'flagship' } } }, {}, 'capabilities."code:review".roles.producer.tier');
});

test('a seat key beats a persona key, which beats a role key', () => {
  const config = specConfig({
    maxTier: 'frontier',
    capabilities: { 'code:review': { prefer: ['claude'], seats: { system: { tier: 'mini' } }, personas: { critic: { tier: 'advanced' } }, roles: { producer: { tier: 'flagship' } } } },
  });
  const ask = (seat, persona) => seatAsk('code:review', seat, 'producer', persona ? { persona } : {});
  assert.equal(tierOf(ask('system', 'critic'), config).tier, 'mini');
  assert.equal(tierOf(ask('other', 'critic'), config).tier, 'advanced');
  assert.equal(tierOf(ask('other'), config).tier, 'flagship');
});

test('variant A: a capability default tier does not lower a seat that has a workflow recommendation, as long as maxTier allows it', () => {
  const config = specConfig({ capabilities: { 'architecture:*': { tier: 'standard', prefer: ['claude', 'openai'] } } });
  const system = tierOf(seatAsk('architecture:shape', 'system', 'producer', { workflowTier: recommendation('frontier', 'system') }), config);
  assert.equal(system.tier, 'frontier');
  assert.equal(system.provenance.tier.source, 'workflow:architecture-advisory/shape-proposals/system');
  const other = tierOf(seatAsk('architecture:shape', 'alternative', 'producer'), config);
  assert.equal(other.tier, 'standard');
  assert.equal(other.provenance.tier.source, 'capabilities."architecture:*".tier');
});

test('variant B: with no capability maxTier the recommendation is lowered to the global maxTier, visibly (max-tier-cap)', () => {
  const config = specConfig({ capabilities: { 'architecture:shape': undefined } });
  delete config.capabilities['architecture:shape'];
  const result = tierOf(seatAsk('architecture:shape', 'system', 'producer', { workflowTier: recommendation('frontier', 'system') }), config);
  assert.equal(result.tier, 'flagship');
  assert.equal(result.provenance.tier.source, 'maxTier');
  assert.deepEqual(result.provenance.tier.loweredFrom, {
    from: 'frontier',
    fromSource: 'workflow:architecture-advisory/shape-proposals/system',
    reason: 'max-tier-cap',
  });
  assert.deepEqual(result.provenance.tier.maxTier, { value: 'flagship', source: 'maxTier', applied: true });
  assert.equal(result.model, 'claude-flagship', 'the cell is read at the tier the seat was lowered to');
});

test('variant C: when the cap lowers a seat to a tier that its prefer list has no cell for, the seat is refused, not lowered further', () => {
  const config = specConfig({ capabilities: { 'architecture:shape': { seats: { system: { prefer: ['deepseek'] } } } } });
  const result = bind(
    seatAsk('architecture:shape', 'system', 'producer', { workflowTier: recommendation('frontier', 'system') }),
    { runnerConfig: config, session },
  );
  assert.equal(result.refused.reason, 'tier-cell-missing');
  assert.match(result.refused.detail, /flagship/);
  assert.match(result.refused.detail, /no allowed executor has a cell/);
  assert.equal(result.refused.config, 'capabilities."architecture:shape".seats.system.prefer', 'the refusal names the config line to change');
});

test('a tier override at the resolved tier is taken; above it, the seat is refused (override above the resolved tier)', () => {
  const config = specConfig();
  const ask = (tier) => seatAsk('architecture:frame', 'producer', 'producer', { overrides: [{ tier }] });
  assert.equal(tierOf(ask('standard'), config).provenance.tier.source, 'override');
  const refused = bind(ask('frontier'), { runnerConfig: config, session });
  assert.equal(refused.refused.reason, 'tier-escalation-unauthorized');
});

test('a door-chosen persona that lifts the tier above what the seat resolves to without it is a raise, refused by name', () => {
  const config = specConfig({
    capabilities: { 'code:review': { prefer: ['claude'], personas: { sage: { tier: 'frontier' } } } },
    maxTier: 'frontier',
  });
  const selected = { selectors: { persona: 'sage' }, overrides: [{ persona: 'sage' }] };
  const refused = bind(seatAsk('code:review', 'producer', 'producer', selected), { runnerConfig: config, session });
  assert.equal(refused.refused.reason, 'tier-escalation-unauthorized');
  assert.match(refused.refused.detail, /persona/);
  // The same persona named by the workflow itself, not chosen at the door, is the project's own taste.
  const own = tierOf(seatAsk('code:review', 'producer', 'producer', { persona: 'sage' }), config);
  assert.equal(own.tier, 'frontier');
  // A door that is authorized may make the choice.
  const authorized = tierOf(seatAsk('code:review', 'producer', 'producer', { ...selected, raiseAuthorized: true }), config);
  assert.equal(authorized.tier, 'frontier');
  assert.equal(authorized.provenance.tier.raisedBy, 'selector:persona');
});

test('a workflow seat recommendation names the workflow, the unit and the seat, and drops the workflow when the run does not know it', () => {
  const seat = { seat: 'system', tier: 'frontier' };
  assert.deepEqual(workflowTierOf(seat, { id: 'shape-proposals' }, 'architecture-advisory'), recommendation('frontier', 'system'));
  assert.deepEqual(workflowTierOf(seat, { id: 'shape-proposals' }), { tier: 'frontier', source: 'workflow:shape-proposals/system' });
  assert.equal(workflowTierOf({ seat: 'system' }, { id: 'shape-proposals' }, 'architecture-advisory'), undefined);
});
