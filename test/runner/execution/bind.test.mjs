// test/runner/execution/bind.test.mjs

import test from 'node:test';
import assert from 'node:assert/strict';
import { bind, nextCandidate, BIND_CONTRACT_VERSION } from '../../../src/runner/execution/bind.mjs';
import { seedFileLocalBwrapRegistry } from '../confinement-registry-fixture.helper.mjs';

// posture filtering consults the machine backend registry; keep it file-local
seedFileLocalBwrapRegistry();

function createMockRunnerConfig() {
  return {
    modelPolicies: {
      claude: {
        nano: 'claude-3-haiku',
        mini: 'claude-3-haiku',
        standard: 'claude-3-5-sonnet',
        advanced: 'claude-3-5-sonnet',
        flagship: 'claude-3-opus',
        frontier: 'claude-3-opus',
      },
      openai: {
        nano: 'gpt-4o-mini',
        mini: 'gpt-4o-mini',
        standard: 'gpt-4o',
        advanced: 'gpt-4o',
        flagship: 'o3',
        frontier: 'o3',
      },
      gemini: {
        nano: 'gemini-1.5-flash',
        mini: 'gemini-1.5-flash',
        standard: 'gemini-1.5-pro',
        advanced: 'gemini-1.5-pro',
        flagship: 'gemini-2.0-pro',
        frontier: 'gemini-2.0-pro',
      },
    },
    rigorToTier: {
      low: 'nano',
      standard: 'standard',
      high: 'flagship',
      critical: 'frontier',
    },
    capabilities: {
      'code:implement': {
        description: 'Implement code changes',
        prefer: [
          { executor: 'claude', invocation: 'claude-cli' },
          { executor: 'codex', invocation: 'codex-cli' },
          { executor: 'gemini-cli', invocation: 'gemini-spawn' },
        ],
        rigor: 'standard',
        persona: 'code-author',
      },
      'docs:write': {
        description: 'Write docs',
        prefer: [
          { executor: 'codex', invocation: 'codex-cli' },
          { executor: 'claude', invocation: 'claude-cli' },
        ],
      },
      implement: {
        description: 'Fallback verb implement',
        prefer: [{ executor: 'claude' }],
      },
    },
    executors: {
      claude: {
        kind: 'agent',
        provider: 'claude',
        command: 'claude',
        invocations: [
          { id: 'claude-cli', via: 'cli', adapter: 'cli-spawn', confinement: { backend: 'bwrap' } },
          { id: 'claude-herdr', via: 'cli', adapter: 'herdr-spawn', confinement: { backend: 'bwrap' } },
        ],
      },
      codex: {
        kind: 'agent',
        provider: 'openai',
        command: 'codex',
        invocations: [
          { id: 'codex-cli', via: 'cli', adapter: 'cli-spawn', confinement: { backend: 'bwrap' } },
          { id: 'codex-herdr', via: 'cli', adapter: 'herdr-spawn', confinement: { backend: 'bwrap' } },
        ],
      },
      'gemini-cli': {
        kind: 'agent',
        provider: 'gemini',
        command: 'agy',
        invocations: [
          { id: 'gemini-spawn', via: 'cli', adapter: 'cli-spawn', confinement: { backend: 'bwrap' } },
        ],
      },
      'native-agent': {
        kind: 'agent',
        provider: 'claude',
        // No command or adapter, agentType only -> in-process when live task access
        agentType: 'generalist',
      },
    },
  };
}

test('bind: successfully binds producer with herdr transport when herdrPresent is true', () => {
  const runnerConfig = createMockRunnerConfig();
  const unit = {
    id: 'u1',
    capability: 'code:implement',
    writes: ['src/foo.js'],
    rigor: 'standard',
  };
  const ask = {
    unit,
    role: 'producer',
    readOnly: false,
    independentOf: [],
  };
  const ctx = {
    runnerConfig,
    session: { herdrPresent: true, hasNativeAgent: true },
  };

  const result = bind(ask, ctx);
  assert.equal(result.contractVersion, BIND_CONTRACT_VERSION);
  assert.equal(result.executor, 'claude');
  assert.equal(result.transport, 'herdr');
  assert.equal(result.mechanism, 'out-of-process'); // CLI executor is always out-of-process
  assert.equal(result.posture, 'workspace-write');
  assert.equal(result.tier, 'standard');
  assert.equal(result.model, 'claude-3-5-sonnet');
  assert.equal(result.persona, 'code-author');
  assert.ok(result.provenance.transport.source.includes('herdr'));
  // The invocation that runs is the executor's herdr-spawn one, not the prefer entry's cli one.
  assert.equal(result.invocation, 'claude-herdr');
  assert.equal(result.provenance.invocation.value, 'claude-herdr');
});

test('bind: a herdr invocation that cannot carry the posture leaves the transport on cli, and says why', () => {
  const runnerConfig = createMockRunnerConfig();
  runnerConfig.executors.claude.invocations[1] = { id: 'claude-herdr', via: 'cli', adapter: 'herdr-spawn' };
  const result = bind(
    { unit: { id: 'u1', capability: 'code:implement', writes: ['src/foo.js'], rigor: 'standard' }, role: 'producer', independentOf: [] },
    { runnerConfig, session: { herdrPresent: true, hasNativeAgent: true } },
  );
  assert.equal(result.transport, 'cli');
  assert.equal(result.invocation, 'claude-cli');
  assert.equal(result.provenance.transport.source, 'cli:herdr-invocation-cannot-apply-posture');
});

test('bind: without herdr the transport is cli and the prefer invocation is kept', () => {
  const result = bind(
    { unit: { id: 'u1', capability: 'code:implement', writes: ['src/foo.js'], rigor: 'standard' }, role: 'producer', independentOf: [] },
    { runnerConfig: createMockRunnerConfig(), session: { herdrPresent: false, headless: true } },
  );
  assert.equal(result.transport, 'cli');
  assert.equal(result.invocation, 'claude-cli');
});

test('bind: a human override that pins an invocation is not moved to herdr', () => {
  const result = bind(
    {
      unit: { id: 'u1', capability: 'code:implement', writes: ['src/foo.js'], rigor: 'standard' },
      role: 'producer',
      independentOf: [],
      overrides: [{ executor: 'claude', invocation: 'claude-cli', origin: 'human-cli' }],
    },
    { runnerConfig: createMockRunnerConfig(), session: { herdrPresent: true, hasNativeAgent: true } },
  );
  assert.equal(result.transport, 'cli');
  assert.equal(result.invocation, 'claude-cli');
});

test('bind: transports fallback to cli when session.herdrPresent is false', () => {
  const runnerConfig = createMockRunnerConfig();
  const unit = {
    id: 'u1',
    capability: 'code:implement',
    writes: ['src/foo.js'],
  };
  const ask = {
    unit,
    role: 'producer',
    readOnly: false,
  };
  const ctx = {
    runnerConfig,
    session: { herdrPresent: false },
  };

  const result = bind(ask, ctx);
  assert.equal(result.transport, 'cli');
});

test('bind: read-only posture is enforced when unit.writes is empty or readOnly is true', () => {
  const runnerConfig = createMockRunnerConfig();
  const unitWithNoWrites = {
    id: 'u1',
    capability: 'code:implement',
    writes: [],
  };
  const ask1 = {
    unit: unitWithNoWrites,
    role: 'producer',
    readOnly: false,
  };
  const ctx = { runnerConfig, session: {} };
  const res1 = bind(ask1, ctx);
  assert.equal(res1.posture, 'read-only');

  const unitWithWrites = {
    id: 'u2',
    capability: 'code:implement',
    writes: ['src/foo.js'],
  };
  const ask2 = {
    unit: unitWithWrites,
    role: 'reviewer',
    readOnly: true,
  };
  const res2 = bind(ask2, ctx);
  assert.equal(res2.posture, 'read-only');
});

test('bind: independence filter selects candidate of different provider family', () => {
  const runnerConfig = createMockRunnerConfig();
  const unit = {
    id: 'u1',
    capability: 'code:implement',
    writes: [],
  };
  const ask = {
    unit,
    role: 'reviewer',
    readOnly: true,
    independentOf: ['claude'], // Must differ from claude
  };
  const ctx = { runnerConfig, session: {} };

  const result = bind(ask, ctx);
  // Claude was candidate 0; codex (openai) is candidate 1
  assert.equal(result.executor, 'codex');
  assert.equal(result.tier, 'standard');
  assert.equal(result.model, 'gpt-4o');
});

test('bind: independence violation refuses unless human-cli override has acceptDependence', () => {
  const runnerConfig = createMockRunnerConfig();
  const unit = {
    id: 'u1',
    capability: 'code:implement',
    writes: [],
  };

  // Agent override violating independence
  const askAgentOverride = {
    unit,
    role: 'reviewer',
    readOnly: true,
    independentOf: ['claude'],
    overrides: [{
      scope: { role: 'reviewer' },
      origin: 'agent',
      executor: 'claude',
      acceptDependence: true,
    }],
  };
  const resAgent = bind(askAgentOverride, { runnerConfig, session: {} });
  assert.ok(resAgent.refused);
  assert.equal(resAgent.refused.reason, 'independence');

  // Human CLI override with acceptDependence: true
  const askHumanOverride = {
    unit,
    role: 'reviewer',
    readOnly: true,
    independentOf: ['claude'],
    overrides: [{
      scope: { role: 'reviewer' },
      origin: 'human-cli',
      executor: 'claude',
      acceptDependence: true,
    }],
  };
  const resHuman = bind(askHumanOverride, { runnerConfig, session: {} });
  assert.equal(resHuman.executor, 'claude');
});

test('bind: governance rejects disallowed provider', () => {
  const runnerConfig = createMockRunnerConfig();
  runnerConfig.governance = {
    disallowedProviders: ['claude', 'openai'],
  };
  const unit = {
    id: 'u1',
    capability: 'code:implement',
    writes: [],
  };
  const ask = {
    unit,
    role: 'producer',
  };
  const ctx = { runnerConfig, session: {} };

  // Candidate 0 (claude) and candidate 1 (codex/openai) disallowed; candidate 2 is gemini-cli
  const result = bind(ask, ctx);
  assert.equal(result.executor, 'gemini-cli');
});

test('bind: locked persona prevents conflicting override', () => {
  const runnerConfig = createMockRunnerConfig();
  const unit = {
    id: 'u1',
    capability: 'code:implement',
    writes: [],
  };
  const ask = {
    unit,
    role: 'producer',
    lockedPersona: 'strict-reviewer',
    overrides: [{
      scope: { role: 'producer' },
      origin: 'human-cli',
      persona: 'casual-reviewer',
    }],
  };
  const result = bind(ask, { runnerConfig, session: {} });
  assert.ok(result.refused);
  assert.equal(result.refused.reason, 'locked-persona');
});

test('bind: headless session refuses when no candidate executor is found', () => {
  const runnerConfig = createMockRunnerConfig();
  const unit = {
    id: 'u1',
    capability: 'unknown:verb',
    writes: [],
  };
  const ask = {
    unit,
    role: 'producer',
  };
  const ctx = { runnerConfig, session: { headless: true } };

  const result = bind(ask, ctx);
  assert.ok(result.refused);
  assert.equal(result.refused.reason, 'headless-no-executor');
});

test('bind: lead session falls back to inline for producer when no candidates configured', () => {
  const runnerConfig = createMockRunnerConfig();
  const unit = {
    id: 'u1',
    capability: 'unknown:verb',
    writes: ['src/foo.js'],
  };
  const ask = {
    unit,
    role: 'producer',
  };
  const ctx = { runnerConfig, session: { headless: false, hasNativeAgent: true, provider: 'claude' } };

  const result = bind(ask, ctx);
  assert.equal(result.mechanism, 'inline');
  assert.equal(result.executor, 'claude');
});

test('bind: checker role NEVER gets inline mechanism', () => {
  const runnerConfig = createMockRunnerConfig();
  const unit = {
    id: 'u1',
    capability: 'unknown:verb',
    writes: [],
  };
  const ask = {
    unit,
    role: 'reviewer',
  };
  const ctx = { runnerConfig, session: { headless: false, hasNativeAgent: true, provider: 'claude' } };

  const result = bind(ask, ctx);
  assert.ok(result.refused); // Refuses rather than falling back to inline lead!
});

test('bind: in-process mechanism allowed for native agent without CLI', () => {
  const runnerConfig = createMockRunnerConfig();
  runnerConfig.capabilities['native:run'] = {
    prefer: [{ executor: 'native-agent' }],
  };
  const unit = {
    id: 'u1',
    capability: 'native:run',
    writes: [],
  };
  const ask = { unit, role: 'producer' };
  const ctx = { runnerConfig, session: { hasNativeAgent: true } };

  const result = bind(ask, ctx);
  assert.equal(result.executor, 'native-agent');
  assert.equal(result.mechanism, 'in-process');
});

test('bind: a blind role is never bound in-process or inline, and is refused with a named reason when nothing else is left', () => {
  const runnerConfig = createMockRunnerConfig();
  runnerConfig.capabilities['native:run'] = { prefer: [{ executor: 'native-agent' }] };
  const unit = { id: 'u1', capability: 'native:run', writes: [] };

  const refusedInProcess = bind({ unit, role: 'producer', blind: true }, { runnerConfig, session: { hasNativeAgent: true } });
  assert.equal(refusedInProcess.refused.reason, 'blind-in-process');

  // The lead's own session is not a way around it either.
  const refusedInline = bind(
    { unit: { id: 'u2', capability: 'unknown:verb', writes: ['src/foo.js'] }, role: 'producer', blind: true },
    { runnerConfig, session: { headless: false, hasNativeAgent: true, provider: 'claude' } },
  );
  assert.ok(refusedInline.refused);
});

test('bind: a blind role skips an in-process candidate for an out-of-process one, and the default binding is unchanged', () => {
  const runnerConfig = createMockRunnerConfig();
  runnerConfig.capabilities['native:run'] = { prefer: [{ executor: 'native-agent' }, { executor: 'claude', invocation: 'claude-cli' }] };
  const unit = { id: 'u1', capability: 'native:run', writes: [] };
  const ctx = { runnerConfig, session: { hasNativeAgent: true } };

  const blind = bind({ unit, role: 'producer', blind: true }, ctx);
  assert.equal(blind.executor, 'claude');
  assert.equal(blind.mechanism, 'out-of-process');

  const plain = bind({ unit, role: 'producer' }, ctx);
  assert.equal(plain.executor, 'native-agent');
  assert.equal(plain.mechanism, 'in-process');
});

test('nextCandidate: falls back to subsequent candidate on quota/provider-limit', () => {
  const runnerConfig = createMockRunnerConfig();
  const unit = {
    id: 'u1',
    capability: 'code:implement',
    writes: ['src/foo.js'],
  };
  const ask = { unit, role: 'producer' };
  const ctx = { runnerConfig, session: {} };

  const firstBinding = bind(ask, ctx);
  assert.equal(firstBinding.executor, 'claude');

  const secondBinding = nextCandidate(firstBinding, ask, ctx, 'provider-limit');
  assert.equal(secondBinding.executor, 'codex');
  assert.equal(secondBinding.provenance.fallbackFrom.executor, 'claude');
  assert.equal(secondBinding.provenance.fallbackFrom.reason, 'provider-limit');
});

test('nextCandidate: walks the prefer pool in order, never revisits a candidate, and refuses when none is left', () => {
  const runnerConfig = createMockRunnerConfig();
  runnerConfig.capabilities['code:implement'].prefer = [
    { executor: 'claude', invocation: 'claude-cli' },
    { executor: 'claude', invocation: 'claude-herdr' },
    { executor: 'codex', invocation: 'codex-cli' },
  ];
  const ask = { unit: { id: 'u1', capability: 'code:implement', writes: ['src/foo.js'] }, role: 'producer' };
  const ctx = { runnerConfig, session: {} };

  const first = bind(ask, ctx);
  assert.equal(first.candidateIndex, 0);
  const second = nextCandidate(first, ask, ctx);
  assert.equal(second.candidateIndex, 1);
  assert.equal(second.executor, 'claude');
  const third = nextCandidate(second, ask, ctx);
  assert.equal(third.candidateIndex, 2);
  assert.equal(third.executor, 'codex');
  assert.equal(third.provenance.fallbackFrom.executor, 'claude');
  const none = nextCandidate(third, ask, ctx);
  assert.ok(none.refused, 'no candidate is left, so nothing is guessed');
});

test('nextCandidate: a binding that did not come from a prefer pool has no next candidate', () => {
  const none = nextCandidate({ executor: 'lead', candidateIndex: -1 }, { unit: { capability: 'code:implement' }, role: 'producer' }, { runnerConfig: createMockRunnerConfig(), session: {} });
  assert.equal(none.refused.reason, 'no-candidate');
});

function twoInvocationConfig(extraCapabilities = {}) {
  return {
    rigorToTier: { low: 'nano', standard: 'standard', high: 'flagship', critical: 'frontier' },
    capabilities: { 'docs:write': { prefer: [{ executor: 'duo' }] }, ...extraCapabilities },
    executors: {
      duo: {
        kind: 'agent',
        provider: 'claude',
        command: 'duo',
        invocations: [
          { id: 'duo-plain', via: 'cli', adapter: 'cli-spawn', command: 'duo' },
          { id: 'duo-herdr', via: 'cli', adapter: 'herdr-spawn', command: 'duo', confinement: { backend: 'bwrap' } },
          {
            id: 'duo-confined',
            via: 'cli',
            adapter: 'cli-spawn',
            command: 'duo',
            confinement: { backend: 'bwrap' },
            resourceBindings: [{ resource: 'private-home', target: { kind: 'env', name: 'HOME' } }],
          },
        ],
      },
    },
  };
}

test('bind: with no invocation named, records the plain cli invocation that can carry the posture', () => {
  const ask = { unit: { id: 'u1', capability: 'docs:write', writes: [] }, role: 'producer' };
  const result = bind(ask, { runnerConfig: twoInvocationConfig(), session: { headless: true } });
  assert.equal(result.transport, 'cli');
  assert.equal(result.invocation, 'duo-confined', 'not the executor first cli invocation, and not its herdr-spawn one');
  assert.equal(result.provenance.invocation.value, 'duo-confined');
});

test('bind: a candidate that names an invocation keeps it', () => {
  const config = twoInvocationConfig({ 'docs:write': { prefer: [{ executor: 'duo', invocation: 'duo-herdr' }] } });
  const ask = { unit: { id: 'u1', capability: 'docs:write', writes: [] }, role: 'producer' };
  const result = bind(ask, { runnerConfig: config, session: { headless: true } });
  assert.equal(result.invocation, 'duo-herdr');
});

test('bind: inside herdr the herdr invocation is recorded; a herdr-only executor is only usable there', () => {
  const ask = { unit: { id: 'u1', capability: 'docs:write', writes: [] }, role: 'producer' };
  const inside = bind(ask, { runnerConfig: twoInvocationConfig(), session: { headless: true, herdrPresent: true } });
  assert.equal(inside.transport, 'herdr');
  assert.equal(inside.invocation, 'duo-herdr');

  const herdrOnly = twoInvocationConfig();
  herdrOnly.executors.duo.invocations = [herdrOnly.executors.duo.invocations[1]];
  const headless = bind(ask, { runnerConfig: herdrOnly, session: { headless: true } });
  assert.equal(headless.refused.reason, 'posture-unavailable');
  const withHerdr = bind(ask, { runnerConfig: herdrOnly, session: { headless: true, herdrPresent: true } });
  assert.equal(withHerdr.invocation, 'duo-herdr');
});

test('bind: a candidate with no invocation able to carry the posture is refused as posture-unavailable', () => {
  const config = twoInvocationConfig();
  config.executors.duo.invocations = [config.executors.duo.invocations[0]];
  const ask = { unit: { id: 'u1', capability: 'docs:write', writes: [] }, role: 'producer' };
  const result = bind(ask, { runnerConfig: config, session: { headless: true } });
  assert.equal(result.refused.reason, 'posture-unavailable');
});

test('bind: a description-only exact entry does not hide a bare-verb entry that has a prefer pool', () => {
  const config = twoInvocationConfig({
    'docs:plan': { description: 'slot with no prefer' },
    plan: { prefer: [{ executor: 'duo' }] },
  });
  const ask = { unit: { id: 'u1', capability: 'docs:plan', writes: [] }, role: 'producer' };
  const result = bind(ask, { runnerConfig: config, session: { headless: true } });
  assert.equal(result.executor, 'duo');
  assert.equal(result.provenance.executor.source, 'capability:plan');
});

test('bind: an exact entry with a prefer pool still wins over the bare verb', () => {
  const config = twoInvocationConfig({
    'docs:plan': { prefer: [{ executor: 'duo' }] },
    plan: { prefer: [{ executor: 'missing' }] },
  });
  const ask = { unit: { id: 'u1', capability: 'docs:plan', writes: [] }, role: 'producer' };
  assert.equal(bind(ask, { runnerConfig: config, session: { headless: true } }).provenance.executor.source, 'capability:docs:plan');
});

test('bind: with no prefer pool anywhere a headless unit is refused and its description-only entry still supplies rigor', () => {
  const config = twoInvocationConfig({ 'docs:plan': { description: 'slot', rigor: 'high' } });
  const ask = { unit: { id: 'u1', capability: 'docs:plan', writes: [] }, role: 'producer' };
  assert.equal(bind(ask, { runnerConfig: config, session: { headless: true } }).refused.reason, 'headless-no-executor');
});

// Soft spread: a seat prefers a provider family no listed seat uses, falls back to the least
// used family, and is never refused for sharing one. Pool order (claude, openai, gemini) is the
// tie-break.
const SPREAD_UNIT = { id: 'u-spread', capability: 'code:implement', writes: [] };
const seatOn = (role, executor) => ({ role, executor });
const spreadAsk = (preferIndependentOf, extra = {}) => ({
  unit: SPREAD_UNIT, role: 'panelist-9', readOnly: true, preferIndependentOf, ...extra,
});

test('bind spread: the first family in pool order that no listed seat uses is chosen', () => {
  const ctx = { runnerConfig: createMockRunnerConfig(), session: {} };
  const first = bind(spreadAsk([]), ctx);
  assert.equal(first.executor, 'claude');
  assert.equal(first.provenance.familySpread.source, 'prefer-independent-of:distinct-family', 'the first seat records that it asked for spread');
  assert.equal(bind(spreadAsk([seatOn('panelist-1', 'claude')]), ctx).executor, 'codex');
  const third = bind(spreadAsk([seatOn('panelist-1', 'claude'), seatOn('panelist-2', 'codex')]), ctx);
  assert.equal(third.executor, 'gemini-cli');
  assert.deepEqual(third.provenance.familySpread.value.sharedWith, []);
  assert.equal(third.provenance.familySpread.source, 'prefer-independent-of:distinct-family');
});

test('bind spread: seats outnumbering the families share the least used family instead of being refused', () => {
  const ctx = { runnerConfig: createMockRunnerConfig(), session: {} };
  const used = [seatOn('panelist-1', 'claude'), seatOn('panelist-2', 'codex'), seatOn('panelist-3', 'gemini-cli')];
  const fourth = bind(spreadAsk(used), ctx);
  assert.equal(fourth.refused, undefined);
  assert.equal(fourth.executor, 'claude', 'every family used once: pool order breaks the tie');
  assert.deepEqual(fourth.provenance.familySpread.value, { family: 'claude', sharedWith: ['panelist-1'] });
  assert.equal(fourth.provenance.familySpread.source, 'prefer-independent-of:no-eligible-unused-family');

  const fifth = bind(spreadAsk([...used, seatOn('panelist-4', 'claude')]), ctx);
  assert.equal(fifth.executor, 'codex', 'claude is used twice, so the least used family wins');
  assert.deepEqual(fifth.provenance.familySpread.value.sharedWith, ['panelist-2']);
});

test('bind spread: a family the same provider reaches through another executor counts as used', () => {
  const ctx = { runnerConfig: createMockRunnerConfig(), session: {} };
  // native-agent is also a claude-family executor
  assert.equal(bind(spreadAsk([seatOn('panelist-1', 'native-agent')]), ctx).executor, 'codex');
});

test('bind spread: families filtered out by governance are not candidates, so the next best is chosen', () => {
  const runnerConfig = createMockRunnerConfig();
  runnerConfig.governance = { disallowedExecutors: ['codex'] };
  const res = bind(spreadAsk([seatOn('panelist-1', 'claude')]), { runnerConfig, session: {} });
  assert.equal(res.executor, 'gemini-cli');
});

test('bind spread: never overrides the hard independence filter', () => {
  const ctx = { runnerConfig: createMockRunnerConfig(), session: {} };
  const res = bind(spreadAsk([seatOn('panelist-1', 'claude')], { independentOf: ['codex', 'gemini-cli', 'claude'] }), ctx);
  assert.equal(res.refused.reason, 'independence');
  const hardOnly = bind({ unit: SPREAD_UNIT, role: 'reviewer', readOnly: true, independentOf: ['claude'] }, ctx);
  assert.equal(hardOnly.executor, 'codex');
  assert.equal(hardOnly.provenance.familySpread, undefined, 'no spread asked: nothing recorded');
});

test('bind spread: a human-cli acceptDependence override still applies and is unaffected by spread', () => {
  const ctx = { runnerConfig: createMockRunnerConfig(), session: {} };
  const res = bind(spreadAsk([seatOn('panelist-1', 'claude')], {
    independentOf: ['claude'],
    overrides: [{ scope: { role: 'panelist-9' }, origin: 'human-cli', executor: 'claude', acceptDependence: true }],
  }), ctx);
  assert.equal(res.executor, 'claude');
});

test('bind spread: a provider-limit fallback keeps ranking the remaining candidates by family use', () => {
  const ctx = { runnerConfig: createMockRunnerConfig(), session: {} };
  const ask = spreadAsk([seatOn('panelist-1', 'claude')]);
  const first = bind(ask, ctx);
  assert.equal(first.executor, 'codex');
  assert.equal(nextCandidate(first, ask, ctx).executor, 'gemini-cli');
});

test('architecture guard: bind.mjs does NOT import src/state or src/runner/coordination', async () => {
  const fs = await import('node:fs/promises');
  const content = await fs.readFile(new URL('../../../src/runner/execution/bind.mjs', import.meta.url), 'utf8');

  assert.doesNotMatch(content, /from\s+['"][^'"]*\/state\//);
  assert.doesNotMatch(content, /from\s+['"][^'"]*\/runner\/coordination\//);
  assert.doesNotMatch(content, /from\s+['"][^'"]*worktree/);
  assert.doesNotMatch(content, /from\s+['"][^'"]*merge/);
});

// A unit's own `prefer` is a soft preference: its candidates go ahead of the capability's pool and
// pass every filter the capability's candidates pass; each candidate carries where it came from.
const preferAsk = (unit, extra = {}) => ({ unit: { id: 'u1', capability: 'code:implement', writes: [], ...unit }, role: 'producer', ...extra });

test('bind prefer: a unit-preferred executor is chosen ahead of the capability pool and says so', () => {
  const result = bind(preferAsk({ prefer: ['gemini-cli'] }), { runnerConfig: createMockRunnerConfig(), session: {} });
  assert.equal(result.executor, 'gemini-cli');
  assert.equal(result.candidateIndex, 0);
  assert.equal(result.provenance.executor.source, 'unit-prefer');
  assert.equal(result.provenance.invocation.source, 'unit-prefer');
});

test('bind prefer: a filtered unit candidate falls to the capability pool, whose source is the capability', () => {
  const runnerConfig = createMockRunnerConfig();
  runnerConfig.governance = { disallowedProviders: ['gemini'] };
  const result = bind(preferAsk({ prefer: ['gemini-cli'] }), { runnerConfig, session: {} });
  assert.equal(result.executor, 'claude');
  assert.equal(result.candidateIndex, 1);
  assert.equal(result.provenance.executor.source, 'capability:code:implement');
});

test('bind prefer: independence filters a unit-preferred executor of the same family', () => {
  const result = bind(
    preferAsk({ prefer: ['gemini-cli'] }, { role: 'reviewer', readOnly: true, independentOf: ['gemini'] }),
    { runnerConfig: createMockRunnerConfig(), session: {} },
  );
  assert.equal(result.executor, 'claude');
  assert.equal(result.provenance.executor.source, 'capability:code:implement');
});

test('bind prefer: a unit-preferred executor with no invocation able to carry the posture is skipped', () => {
  const runnerConfig = createMockRunnerConfig();
  runnerConfig.executors['herdr-only'] = {
    kind: 'agent',
    provider: 'gemini',
    command: 'agy',
    invocations: [{ id: 'herdr-only-spawn', via: 'cli', adapter: 'herdr-spawn', confinement: { backend: 'bwrap' } }],
  };
  const result = bind(preferAsk({ prefer: ['herdr-only'] }), { runnerConfig, session: { headless: true } });
  assert.equal(result.executor, 'claude');
});

test('bind prefer: an executor that is not registered is skipped like a filter, never thrown', () => {
  const runnerConfig = createMockRunnerConfig();
  const skipped = bind(preferAsk({ prefer: ['nope'] }), { runnerConfig, session: {} });
  assert.equal(skipped.executor, 'claude');
  assert.equal(skipped.candidateIndex, 1);

  delete runnerConfig.capabilities['code:implement'].prefer;
  delete runnerConfig.capabilities.implement;
  const refused = bind(preferAsk({ prefer: ['nope'] }), { runnerConfig, session: { headless: true } });
  assert.equal(refused.refused.reason, 'unknown-executor');
});

test('bind prefer: a human override that names an executor still pins it over the unit preference', () => {
  const result = bind(
    preferAsk({ prefer: ['gemini-cli'] }, { overrides: [{ origin: 'human-cli', executor: 'codex' }] }),
    { runnerConfig: createMockRunnerConfig(), session: {} },
  );
  assert.equal(result.executor, 'codex');
  assert.equal(result.provenance.executor.source, 'override');
});

test('bind prefer: duplicates of a unit candidate are dropped from the capability pool, order kept', () => {
  const runnerConfig = createMockRunnerConfig();
  const ask = preferAsk({ prefer: [{ executor: 'codex', invocation: 'codex-cli' }] }, { unit: { id: 'u1', capability: 'code:implement', writes: ['src/a.js'], prefer: [{ executor: 'codex', invocation: 'codex-cli' }] } });
  const ctx = { runnerConfig, session: {} };
  const walked = [];
  let bound = bind(ask, ctx);
  while (!bound.refused) {
    walked.push([bound.executor, bound.provenance.executor.source]);
    bound = nextCandidate(bound, ask, ctx);
  }
  assert.deepEqual(walked, [
    ['codex', 'unit-prefer'],
    ['claude', 'capability:code:implement'],
    ['gemini-cli', 'capability:code:implement'],
  ]);
});

test('bind prefer: nextCandidate after a unit-preferred executor walks into the capability pool', () => {
  const ctx = { runnerConfig: createMockRunnerConfig(), session: {} };
  const ask = preferAsk({ prefer: ['gemini-cli'], writes: ['src/a.js'] });
  const first = bind(ask, ctx);
  assert.equal(first.executor, 'gemini-cli');
  const second = nextCandidate(first, ask, ctx);
  assert.equal(second.executor, 'claude');
  assert.equal(second.provenance.executor.source, 'capability:code:implement');
  assert.equal(second.provenance.fallbackFrom.executor, 'gemini-cli');
});

test('bind prefer: a unit without prefer binds exactly as before', () => {
  const ctx = { runnerConfig: createMockRunnerConfig(), session: { herdrPresent: true } };
  const ask = { unit: { id: 'u1', capability: 'code:implement', writes: ['src/a.js'] }, role: 'producer' };
  const withEmpty = { ...ask, unit: { ...ask.unit, prefer: [] } };
  const result = bind(ask, ctx);
  assert.deepEqual(bind(withEmpty, ctx), result);
  assert.equal(result.executor, 'claude');
  assert.equal(result.candidateIndex, 0);
  assert.deepEqual(result.provenance.executor, { value: 'claude', source: 'capability:code:implement' });
  assert.deepEqual(result.provenance.invocation, { value: 'claude-herdr', source: 'capability:code:implement' });
});

test('bind persona: the unit persona beats the capability persona and is recorded as the unit', () => {
  const result = bind(preferAsk({ persona: 'unit-voice' }), { runnerConfig: createMockRunnerConfig(), session: {} });
  assert.equal(result.persona, 'unit-voice');
  assert.deepEqual(result.provenance.persona, { value: 'unit-voice', source: 'unit' });
});

test('bind persona: an override persona beats the unit persona', () => {
  const result = bind(
    preferAsk({ persona: 'unit-voice' }, { overrides: [{ origin: 'human-cli', persona: 'override-voice' }] }),
    { runnerConfig: createMockRunnerConfig(), session: {} },
  );
  assert.equal(result.persona, 'override-voice');
  assert.equal(result.provenance.persona.source, 'override:human-cli');
});

test('bind persona: a locked persona that disagrees with the unit persona refuses the binding', () => {
  const runnerConfig = createMockRunnerConfig();
  const refused = bind(preferAsk({ persona: 'unit-voice' }, { lockedPersona: 'locked-voice' }), { runnerConfig, session: {} });
  assert.equal(refused.refused.reason, 'locked-persona');
  const agreed = bind(preferAsk({ persona: 'locked-voice' }, { lockedPersona: 'locked-voice' }), { runnerConfig, session: {} });
  assert.equal(agreed.persona, 'locked-voice');
});

test('bind prefer: a bare unit executor id covers every capability entry of that executor, so failover never returns to it', () => {
  const ctx = { runnerConfig: createMockRunnerConfig(), session: {} };
  const ask = preferAsk({ prefer: ['codex'], writes: ['src/a.js'] });
  const walked = [];
  let bound = bind(ask, ctx);
  while (!bound.refused) {
    walked.push(bound.executor);
    bound = nextCandidate(bound, ask, ctx);
  }
  assert.deepEqual(walked, ['codex', 'claude', 'gemini-cli']);
});

test('bind: an invocation a unit names in its prefer stays bound inside herdr, while a bare executor id still takes the herdr transport', () => {
  const herdr = { headless: true, herdrPresent: true };
  const pinned = bind(preferAsk({ capability: 'docs:write', prefer: [{ executor: 'duo', invocation: 'duo-confined' }] }), { runnerConfig: twoInvocationConfig(), session: herdr });
  assert.equal(pinned.invocation, 'duo-confined');
  assert.equal(pinned.transport, 'cli');
  assert.deepEqual(pinned.provenance.invocation, { value: 'duo-confined', source: 'unit-prefer' });

  // A bare executor id leaves the transport to bind(): the herdr invocation is not something the unit named.
  const bare = bind(preferAsk({ capability: 'docs:write', prefer: ['duo'] }), { runnerConfig: twoInvocationConfig(), session: herdr });
  assert.equal(bare.invocation, 'duo-herdr');
  assert.equal(bare.transport, 'herdr');
  assert.equal(bare.provenance.executor.source, 'unit-prefer');
});
