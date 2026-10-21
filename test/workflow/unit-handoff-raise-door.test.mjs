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
const executor = (family) => ({
  kind: 'agent',
  providerModel: family,
  command: `${family}-bin`,
  invocations: [{
    id: `${family}-cli`, via: 'cli', adapter: 'cli-spawn', command: `${family}-bin`, confinement: { backend: 'bwrap' },
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
  assert.equal(fallback.origin, undefined, 'the trailing unscoped override names no origin');
  assert.deepEqual(fallback, { reasoningEffort: 'high', timeoutMs: 60_000, account: 'openai/work' });
  assert.equal(overrides.some((override) => override.origin === 'human-cli'), false);
});

test('a persona chosen for a seat at the door that lifts the seat above its tier is refused by name; the other seats bind', async () => {
  const overrides = unitOverridesOf({ ...unit, template: { pattern: 'panel' } }, seatPersonas, {});
  const refused = await simulateUnitBindings(unit, runnerConfig('frontier'), { overrides, session: { headless: true } });
  const member = refused.seats.find((seat) => seat.seat === 'member-1');
  assert.equal(member.refused.reason, 'tier-escalation-unauthorized');
  assert.match(member.refused.detail, /persona/);
  assert.equal(refused.seats.filter((seat) => !seat.refused).length >= 1, true, 'seats the choice does not touch still bind');
});

test('the same persona at or below the tier the seat resolves to is not a raise, and an authorized door may make the choice', async () => {
  const overrides = unitOverridesOf({ ...unit, template: { pattern: 'panel' } }, seatPersonas, {});
  const same = await simulateUnitBindings(unit, runnerConfig('standard'), { overrides, session: { headless: true } });
  assert.equal(same.seats.every((seat) => !seat.refused), true, JSON.stringify(same.seats.filter((seat) => seat.refused)));
  const authorized = await simulateUnitBindings(unit, runnerConfig('frontier'), { overrides, session: { headless: true }, raiseAuthorized: true });
  assert.equal(authorized.seats.every((seat) => !seat.refused), true, JSON.stringify(authorized.seats.filter((seat) => seat.refused)));
});

test('--effort, --timeout and --account reach every seat as overrides that raise no tier', async () => {
  const overrides = unitOverridesOf({ ...unit, template: { pattern: 'panel' } }, [], { effort: 'high', timeoutMs: 60_000 });
  const result = await simulateUnitBindings(unit, runnerConfig('frontier'), { overrides, session: { headless: true } });
  assert.equal(result.seats.every((seat) => !seat.refused), true, JSON.stringify(result.seats.filter((seat) => seat.refused)));
});
