// The workflow handoff is a raise door too: the overrides it implies name no origin that says a person typed them,
// and a persona a person chose for a seat (`workflow start --seats @name`) whose tier is above what the seat resolves
// to without it is refused by name, while `--effort`, `--timeout` and `--account` keep working.

import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';

import { unitOverridesOf } from '../../src/workflow/unit-handoff.mjs';
import { simulateUnitBindings } from '../../src/runner/execution/dry-bind.mjs';
import { seedFileLocalBwrapRegistry } from '../runner/confinement-registry-fixture.helper.mjs';

seedFileLocalBwrapRegistry();

const FAMILIES = ['claude', 'openai', 'gemini'];
// The command is a CLI whose reasoning-effort control fgOS knows, so an effort override can be rendered.
const COMMAND = { claude: 'claude', openai: 'codex', gemini: 'agy' };
const executor = (family) => ({
  kind: 'agent',
  providerModel: family,
  command: COMMAND[family],
  invocations: [{
    id: `${family}-cli`, via: 'cli', adapter: 'cli-spawn', command: COMMAND[family], confinement: { backend: 'bwrap' },
    credentialStore: { use: family, homeEnv: `${family.toUpperCase()}_HOME`, files: ['login'] },
  }],
});
const cell = (family) => Object.fromEntries(['nano', 'mini', 'standard', 'advanced', 'flagship', 'frontier'].map((tier) => [tier, `${family}-${tier}`]));

const runnerConfig = (personaTier) => ({
  defaults: { tier: 'standard' },
  maxTier: 'frontier',
  modelPolicies: Object.fromEntries(FAMILIES.map((family) => [family, cell(family)])),
  capabilities: {
    'business:perspectives': {
      prefer: FAMILIES,
      ...(personaTier ? { personas: { sage: { tier: personaTier } } } : {}),
    },
  },
  executors: Object.fromEntries(FAMILIES.map((family) => [family, executor(family)])),
});

// A panel unit as the workflow runner hands it over: three members and a synthesizer.
const unit = {
  id: 'explore-perspectives',
  capability: 'business:perspectives',
  pattern: 'panel',
  writes: [],
  seats: [
    { seat: 'member-1', role: 'producer' },
    { seat: 'member-2', role: 'producer' },
    { seat: 'member-3', role: 'producer' },
    { seat: 'synthesis', role: 'synthesizer' },
  ],
};
const seatPersonas = [{ seat: 'member-1', name: 'sage', digest: 'd', text: 't', identity: 'workspace:fgos/agents/sage' }];

test('the overrides a workflow start implies carry no origin that claims a person typed them', () => {
  const overrides = unitOverridesOf(unit, seatPersonas, { effort: 'high', timeoutMs: 60_000, account: 'openai/work' });
  const fallback = overrides.at(-1);
  assert.deepEqual(fallback, { reasoningEffort: 'high', timeoutMs: 60_000, account: 'openai/work', origin: 'workflow' }, 'the run-level account is marked as the workflow\'s');
  assert.equal(overrides.some((override) => override.origin === 'human-cli'), false);
  assert.equal(unitOverridesOf(unit, [], { effort: 'high' }).at(-1).origin, undefined, 'an override without an account names no origin');
});

test('a persona chosen for a seat at the door that lifts the seat above its tier is refused by name; the other seats bind', async () => {
  const overrides = unitOverridesOf({ ...unit, template: { pattern: 'panel' } }, seatPersonas, { loopOf: (p) => p === 'panel' ? 'panel' : 'solo' });
  const refused = await simulateUnitBindings(unit, runnerConfig('frontier'), { overrides, session: { headless: true } });
  const member = refused.seats.find((seat) => seat.seat === 'member-1');
  assert.equal(member.refused.reason, 'tier-escalation-unauthorized');
  assert.match(member.refused.detail, /persona/);
  assert.equal(refused.seats.filter((seat) => !seat.refused).length >= 1, true, 'seats the choice does not touch still bind');
});

test('the same persona at or below the tier the seat resolves to is not a raise, and an authorized door may make the choice', async () => {
  const overrides = unitOverridesOf({ ...unit, template: { pattern: 'panel' } }, seatPersonas, { loopOf: (p) => p === 'panel' ? 'panel' : 'solo' });
  const same = await simulateUnitBindings(unit, runnerConfig('standard'), { overrides, session: { headless: true } });
  assert.equal(same.seats.every((seat) => !seat.refused), true, JSON.stringify(same.seats.filter((seat) => seat.refused)));
  const authorized = await simulateUnitBindings(unit, runnerConfig('frontier'), { overrides, session: { headless: true }, raiseAuthorized: true });
  assert.equal(authorized.seats.every((seat) => !seat.refused), true, JSON.stringify(authorized.seats.filter((seat) => seat.refused)));
});

test('--effort, --timeout and --account reach every seat as overrides that raise no tier', async () => {
  const overrides = unitOverridesOf({ ...unit, template: { pattern: 'panel' } }, [], { effort: 'high', timeoutMs: 60_000, loopOf: (p) => p === 'panel' ? 'panel' : 'solo' });
  const result = await simulateUnitBindings(unit, runnerConfig('frontier'), { overrides, session: { headless: true } });
  assert.equal(result.seats.every((seat) => !seat.refused), true, JSON.stringify(result.seats.filter((seat) => seat.refused)));
});

test('--effort, --timeout and --account are one fallback no seat or origin narrows; a unit that carries its own timeout keeps it', () => {
  const soloUnit = { id: 'u', capability: 'docs:write' };
  for (const options of [undefined, null, {}, { effort: null, timeoutMs: null, account: null }]) {
    assert.deepEqual(unitOverridesOf(soloUnit, [], options), [], 'a run started with none of them adds no override');
  }
  assert.deepEqual(unitOverridesOf(soloUnit, [], { effort: 'high' }), [{ reasoningEffort: 'high' }], 'no scope and no origin that claims a person typed it');
  assert.deepEqual(unitOverridesOf(soloUnit, [], { timeoutMs: 5_400_000 }), [{ timeoutMs: 5_400_000 }]);
  assert.deepEqual(unitOverridesOf(soloUnit, [], { account: 'node/acct' }), [{ account: 'node/acct', origin: 'workflow' }]);

  // The unit's own timeout wins over the run's, wherever the unit carries it; the other two still apply.
  for (const own of [{ ...soloUnit, timeoutMs: 120_000 }, { ...soloUnit, template: { timeoutMs: 120_000 } }]) {
    assert.deepEqual(unitOverridesOf(own, [], { effort: 'low', timeoutMs: 5_400_000 }), [{ reasoningEffort: 'low' }]);
    assert.deepEqual(unitOverridesOf(own, [], { timeoutMs: 5_400_000 }), [], 'the run timeout alone is dropped for such a unit');
  }
});

test('a persona chosen for a seat is an override of that seat alone, with the pinned text, and carries the run options; no other seat has one', () => {
  const personas = [
    { seat: 'member-2', name: 'finance-controller', digest: 'd2', text: 't2', identity: 'workspace:fgos/agents/finance-controller' },
    { seat: 'member-3', name: 'council-assumptions', digest: 'd3', text: 't3' },
  ];
  const loopOf = (pattern) => (pattern === 'panel' ? 'panel' : 'solo');
  const panel = { ...unit, template: { pattern: 'panel' } };

  const named = unitOverridesOf(panel, personas, { loopOf });
  assert.deepEqual(named.map((o) => [o.scope.unit, o.scope.seat, o.persona, o.origin]), [
    ['explore-perspectives', 'member-2', 'finance-controller', 'workflow'],
    ['explore-perspectives', 'member-3', 'council-assumptions', 'workflow'],
  ], 'no fallback without a run option; the lens seat and the synthesizer have no override');
  assert.deepEqual(named[0].personaPin, { name: 'finance-controller', digest: 'd2', text: 't2', identity: 'workspace:fgos/agents/finance-controller' });
  assert.deepEqual(named[1].personaPin, { name: 'council-assumptions', digest: 'd3', text: 't3' }, 'a persona with no identity pins none');

  const withOptions = unitOverridesOf(panel, personas, { loopOf, effort: 'high', timeoutMs: 60_000, account: 'openai/work' });
  assert.equal(withOptions.length, 3, 'one override per named seat and one fallback');
  for (const seatOverride of withOptions.slice(0, 2)) {
    assert.deepEqual([seatOverride.reasoningEffort, seatOverride.timeoutMs, seatOverride.account], ['high', 60_000, 'openai/work']);
  }
  assert.equal(withOptions[2].scope, undefined);

  // A pattern that is not a panel, or a door that cannot say what a pattern is, takes no seat persona.
  assert.deepEqual(unitOverridesOf({ ...unit, template: { pattern: 'solo' } }, personas, { loopOf }), []);
  assert.deepEqual(unitOverridesOf(panel, personas), []);
});
