// test/runner/execution/bind.test.mjs

import '../../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { bind, BIND_CONTRACT_VERSION } from '../../../src/runner/execution/bind.mjs';
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

// Seats as the resolver describes them: the posture, not the role name, decides how a seat may run.
const POSTURE = { readOnly: false, writer: false, forceOutOfProcess: false, inlineAllowed: false, stance: false, verdict: false };
const CHECKER = { seat: 'reviewer', role: 'reviewer', posture: { ...POSTURE, readOnly: true, forceOutOfProcess: true, verdict: true } };
const PANEL_MEMBER = { seat: 'member-9', role: 'producer', posture: { ...POSTURE, readOnly: true, forceOutOfProcess: true, stance: true } };
const DEBATE_POSTURE = { ...POSTURE, readOnly: true, forceOutOfProcess: true };

test('bind: successfully binds producer with herdr transport when herdrPresent is true', () => {
  const runnerConfig = createMockRunnerConfig();
  // An entry that names no invocation leaves the transport to bind(); a named one is a hard pin.
  runnerConfig.capabilities['code:implement'].prefer[0] = { executor: 'claude' };
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

test('bind: a capability prefer entry that names an invocation is a hard pin, so herdr never swaps it', () => {
  const result = bind(
    { unit: { id: 'u1', capability: 'code:implement', writes: ['src/foo.js'], rigor: 'standard' }, role: 'producer', independentOf: [] },
    { runnerConfig: createMockRunnerConfig(), session: { herdrPresent: true, hasNativeAgent: true } },
  );
  assert.equal(result.invocation, 'claude-cli');
  assert.equal(result.transport, 'cli');
  assert.equal(result.provenance.transport.source, 'prefer-pinned-invocation');
});

test('bind: a herdr invocation that cannot carry the posture leaves the transport on cli, and says why', () => {
  const runnerConfig = createMockRunnerConfig();
  runnerConfig.capabilities['code:implement'].prefer[0] = { executor: 'claude' };
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
    ...CHECKER,
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
    ...CHECKER,
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

test('bind: independence violation refuses, and accepting the dependence needs an authorized door', () => {
  const runnerConfig = createMockRunnerConfig();
  const unit = {
    id: 'u1',
    capability: 'code:implement',
    writes: [],
  };
  const accepting = (origin) => ({
    unit,
    ...CHECKER,
    readOnly: true,
    independentOf: ['claude'],
    overrides: [{ scope: { role: 'reviewer' }, ...(origin ? { origin } : {}), executor: 'claude', acceptDependence: true }],
  });

  // An override that accepts the dependence is ignored whatever origin it claims: the door is not authorized.
  for (const origin of ['agent', 'human-cli', undefined]) {
    const refused = bind(accepting(origin), { runnerConfig, session: {} });
    assert.ok(refused.refused, `origin ${origin}`);
    assert.equal(refused.refused.reason, 'independence-unsatisfiable');
  }

  // A door that was authorized may accept it.
  const accepted = bind({ ...accepting(), raiseAuthorized: true }, { runnerConfig, session: {} });
  assert.equal(accepted.executor, 'claude');
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

test('bind: a seat whose posture forces it out of process NEVER gets inline mechanism', () => {
  const runnerConfig = createMockRunnerConfig();
  const unit = {
    id: 'u1',
    capability: 'unknown:verb',
    writes: [],
  };
  const ask = {
    unit,
    ...CHECKER,
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

test('a walk step falls back to the subsequent candidate on quota/provider-limit', () => {
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

  const secondBinding = bind(ask, ctx, { walk: { tried: [firstBinding] } });
  assert.equal(secondBinding.executor, 'codex');
  assert.equal(secondBinding.provenance.fallbackFrom.executor, 'claude');
  assert.equal(secondBinding.provenance.fallbackFrom.reason, 'provider-limit');
});

test('the walk visits the prefer pool in order, never revisits a candidate, and refuses when none is left', () => {
  const runnerConfig = createMockRunnerConfig();
  runnerConfig.capabilities['code:implement'].prefer = [
    { executor: 'claude', invocation: 'claude-cli' },
    { executor: 'claude', invocation: 'claude-herdr' },
    { executor: 'codex', invocation: 'codex-cli' },
  ];
  const ask = { unit: { id: 'u1', capability: 'code:implement', writes: ['src/foo.js'] }, role: 'producer' };
  const ctx = { runnerConfig, session: {} };

  const first = bind(ask, ctx);
  assert.equal(first.invocation, 'claude-cli');
  const second = bind(ask, ctx, { walk: { tried: [first] } });
  assert.equal(second.invocation, 'claude-herdr');
  assert.equal(second.executor, 'claude');
  const third = bind(ask, ctx, { walk: { tried: [first, second] } });
  assert.equal(third.invocation, 'codex-cli');
  assert.equal(third.executor, 'codex');
  assert.equal(third.provenance.fallbackFrom.executor, 'claude');
  const none = bind(ask, ctx, { walk: { tried: [first, second, third] } });
  assert.ok(none.refused, 'no candidate is left, so nothing is guessed');
});

function twoInvocationConfig(extraCapabilities = {}) {
  return {
    defaults: { tier: 'standard' }, patterns: { seatBinding: { schema: 1 } },
    modelPolicies: { claude: { nano: 'duo-s', standard: 'duo-m', advanced: 'duo-m', flagship: 'duo-l', frontier: 'duo-l' } },
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

test('bind: the bare verb of a capability is not a lookup key, so a description-only exact entry supplies no pool', () => {
  const config = twoInvocationConfig({
    'docs:plan': { description: 'slot with no prefer' },
    plan: { prefer: [{ executor: 'duo' }] },
  });
  const ask = { unit: { id: 'u1', capability: 'docs:plan', writes: [] }, role: 'producer' };
  const result = bind(ask, { runnerConfig: config, session: { headless: true } });
  assert.equal(result.refused.reason, 'headless-no-executor');
});

test('bind: an exact entry with a prefer pool wins over its prefix entry, and the prefix entry serves a capability with no pool of its own', () => {
  const config = twoInvocationConfig({
    'docs:plan': { prefer: [{ executor: 'duo' }] },
    'docs:*': { prefer: [{ executor: 'missing' }] },
    'docs:outline': { description: 'slot with no prefer' },
  });
  const ask = (capability) => ({ unit: { id: 'u1', capability, writes: [] }, role: 'producer' });
  const exact = bind(ask('docs:plan'), { runnerConfig: config, session: { headless: true } });
  assert.equal(exact.provenance.executor.source, 'capabilities."docs:plan".prefer');
  config.capabilities['docs:*'] = { prefer: [{ executor: 'duo' }] };
  const viaPrefix = bind(ask('docs:outline'), { runnerConfig: config, session: { headless: true } });
  assert.equal(viaPrefix.executor, 'duo');
  assert.equal(viaPrefix.provenance.executor.source, 'capabilities."docs:*".prefer');
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
const seatOn = (seat, executor) => ({ seat, executor });
const spreadAsk = (preferIndependentOf, extra = {}) => ({
  unit: SPREAD_UNIT, ...PANEL_MEMBER, readOnly: true, preferIndependentOf, ...extra,
});

test('bind spread: the first family in pool order that no listed seat uses is chosen', () => {
  const ctx = { runnerConfig: createMockRunnerConfig(), session: {} };
  const first = bind(spreadAsk([]), ctx);
  assert.equal(first.executor, 'claude');
  assert.equal(first.provenance.familySpread.source, 'prefer-independent-of:distinct-family', 'the first seat records that it asked for spread');
  assert.equal(bind(spreadAsk([seatOn('member-1', 'claude')]), ctx).executor, 'codex');
  const third = bind(spreadAsk([seatOn('member-1', 'claude'), seatOn('member-2', 'codex')]), ctx);
  assert.equal(third.executor, 'gemini-cli');
  assert.deepEqual(third.provenance.familySpread.value.sharedWith, []);
  assert.equal(third.provenance.familySpread.source, 'prefer-independent-of:distinct-family');
});

test('bind spread: seats outnumbering the families share the least used family instead of being refused', () => {
  const ctx = { runnerConfig: createMockRunnerConfig(), session: {} };
  const used = [seatOn('member-1', 'claude'), seatOn('member-2', 'codex'), seatOn('member-3', 'gemini-cli')];
  const fourth = bind(spreadAsk(used), ctx);
  assert.equal(fourth.refused, undefined);
  assert.equal(fourth.executor, 'claude', 'every family used once: pool order breaks the tie');
  assert.deepEqual(fourth.provenance.familySpread.value, { family: 'claude', sharedWith: ['member-1'] });
  assert.equal(fourth.provenance.familySpread.source, 'prefer-independent-of:no-eligible-unused-family');

  const fifth = bind(spreadAsk([...used, seatOn('member-4', 'claude')]), ctx);
  assert.equal(fifth.executor, 'codex', 'claude is used twice, so the least used family wins');
  assert.deepEqual(fifth.provenance.familySpread.value.sharedWith, ['member-2']);
});

test('bind spread: a family the same provider reaches through another executor counts as used', () => {
  const ctx = { runnerConfig: createMockRunnerConfig(), session: {} };
  // native-agent is also a claude-family executor
  assert.equal(bind(spreadAsk([seatOn('member-1', 'native-agent')]), ctx).executor, 'codex');
});

test('bind spread: families filtered out by governance are not candidates, so the next best is chosen', () => {
  const runnerConfig = createMockRunnerConfig();
  runnerConfig.governance = { disallowedExecutors: ['codex'] };
  const res = bind(spreadAsk([seatOn('member-1', 'claude')]), { runnerConfig, session: {} });
  assert.equal(res.executor, 'gemini-cli');
});

test('bind spread: never overrides the hard independence filter', () => {
  const ctx = { runnerConfig: createMockRunnerConfig(), session: {} };
  const res = bind(spreadAsk([seatOn('member-1', 'claude')], { independentOf: ['codex', 'gemini-cli', 'claude'] }), ctx);
  assert.equal(res.refused.reason, 'independence-unsatisfiable');
  const hardOnly = bind({ unit: SPREAD_UNIT, ...CHECKER, readOnly: true, independentOf: ['claude'] }, ctx);
  assert.equal(hardOnly.executor, 'codex');
  assert.equal(hardOnly.provenance.familySpread, undefined, 'no spread asked: nothing recorded');
});

test('bind spread: an acceptDependence override from an authorized door still applies and is unaffected by spread', () => {
  const ctx = { runnerConfig: createMockRunnerConfig(), session: {} };
  const res = bind(spreadAsk([seatOn('member-1', 'claude')], {
    independentOf: ['claude'],
    raiseAuthorized: true,
    overrides: [{ scope: { seat: 'member-9' }, executor: 'claude', acceptDependence: true }],
  }), ctx);
  assert.equal(res.executor, 'claude');
});

test('bind spread: a provider-limit fallback keeps ranking the remaining candidates by family use', () => {
  const ctx = { runnerConfig: createMockRunnerConfig(), session: {} };
  const ask = spreadAsk([seatOn('member-1', 'claude')]);
  const first = bind(ask, ctx);
  assert.equal(first.executor, 'codex');
  assert.equal(bind(ask, ctx, { walk: { tried: [first] } }).executor, 'gemini-cli');
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
  assert.equal(result.pool, 'gemini');
  assert.equal(result.provenance.executor.source, 'unit-prefer');
  assert.equal(result.provenance.invocation.source, 'unit-prefer');
});

test('bind prefer: a filtered unit candidate falls to the capability pool, whose source is the capability', () => {
  const runnerConfig = createMockRunnerConfig();
  runnerConfig.governance = { disallowedProviders: ['gemini'] };
  const result = bind(preferAsk({ prefer: ['gemini-cli'] }), { runnerConfig, session: {} });
  assert.equal(result.executor, 'claude');
  assert.equal(result.provenance.executor.source, 'capabilities."code:implement".prefer');
});

test('bind prefer: independence filters a unit-preferred executor of the same family', () => {
  const result = bind(
    preferAsk({ prefer: ['gemini-cli'] }, { ...CHECKER, readOnly: true, independentOf: ['gemini'] }),
    { runnerConfig: createMockRunnerConfig(), session: {} },
  );
  assert.equal(result.executor, 'claude');
  assert.equal(result.provenance.executor.source, 'capabilities."code:implement".prefer');
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
  const tried = [];
  let bound = bind(ask, ctx);
  while (!bound.refused) {
    walked.push([bound.executor, bound.provenance.executor.source]);
    tried.push(bound);
    bound = bind(ask, ctx, { walk: { tried: [...tried] } });
  }
  assert.deepEqual(walked, [
    ['codex', 'unit-prefer'],
    ['claude', 'capabilities."code:implement".prefer'],
    ['gemini-cli', 'capabilities."code:implement".prefer'],
  ]);
});

test('bind prefer: a walk step after a unit-preferred executor walks into the capability pool', () => {
  const ctx = { runnerConfig: createMockRunnerConfig(), session: {} };
  const ask = preferAsk({ prefer: ['gemini-cli'], writes: ['src/a.js'] });
  const first = bind(ask, ctx);
  assert.equal(first.executor, 'gemini-cli');
  const second = bind(ask, ctx, { walk: { tried: [first] } });
  assert.equal(second.executor, 'claude');
  assert.equal(second.provenance.executor.source, 'capabilities."code:implement".prefer');
  assert.equal(second.provenance.fallbackFrom.executor, 'gemini-cli');
});

test('bind prefer: a unit without prefer binds exactly as before', () => {
  const ctx = { runnerConfig: createMockRunnerConfig(), session: { herdrPresent: true } };
  const ask = { unit: { id: 'u1', capability: 'code:implement', writes: ['src/a.js'] }, role: 'producer' };
  const withEmpty = { ...ask, unit: { ...ask.unit, prefer: [] } };
  const result = bind(ask, ctx);
  assert.deepEqual(bind(withEmpty, ctx), result);
  assert.equal(result.executor, 'claude');
  assert.equal(result.pool, 'claude');
  assert.deepEqual(result.provenance.executor, { value: 'claude', source: 'capabilities."code:implement".prefer' });
  assert.deepEqual(result.provenance.invocation, { value: 'claude-cli', source: 'capabilities."code:implement".prefer' });
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
  const tried = [];
  let bound = bind(ask, ctx);
  while (!bound.refused) {
    walked.push(bound.executor);
    tried.push(bound);
    bound = bind(ask, ctx, { walk: { tried: [...tried] } });
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

test('bind: a run timeout comes from an override, else the unit, else nothing (the config default stands)', () => {
  const ctx = { runnerConfig: createMockRunnerConfig(), session: { herdrPresent: false, headless: true } };
  const unit = { id: 'u1', capability: 'code:implement', writes: ['src/foo.js'], rigor: 'standard' };
  const none = bind({ unit, role: 'producer', independentOf: [] }, ctx);
  assert.equal(none.timeoutMs, null);
  assert.deepEqual(none.provenance.timeoutMs, { value: null, source: 'none' });

  const fromUnit = bind({ unit: { ...unit, timeoutMs: 5400000 }, role: 'producer', independentOf: [] }, ctx);
  assert.equal(fromUnit.timeoutMs, 5400000);
  assert.deepEqual(fromUnit.provenance.timeoutMs, { value: 5400000, source: 'unit' });

  const fromOverride = bind({ unit: { ...unit, timeoutMs: 5400000 }, role: 'producer', independentOf: [], overrides: [{ origin: 'human-cli', timeoutMs: 7200000 }] }, ctx);
  assert.equal(fromOverride.timeoutMs, 7200000);
  assert.deepEqual(fromOverride.provenance.timeoutMs, { value: 7200000, source: 'override:human-cli' });

  const refused = bind({ unit, role: 'producer', independentOf: [], overrides: [{ origin: 'human-cli', timeoutMs: 999999999 }] }, ctx);
  assert.equal(refused.refused?.reason, 'run-timeout');
});

test('bind: a bare executor in a unit prefer takes the herdr transport even when a confined cli invocation is listed first', () => {
  const config = twoInvocationConfig();
  const [plain, herdrInv, confined] = config.executors.duo.invocations;
  config.executors.duo.invocations = [plain, confined, herdrInv];
  const herdr = { headless: true, herdrPresent: true };
  const bare = bind(preferAsk({ capability: 'docs:write', prefer: ['duo'] }), { runnerConfig: config, session: herdr });
  assert.equal(bare.invocation, 'duo-herdr');
  assert.equal(bare.transport, 'herdr');
  assert.equal(bare.provenance.transport.source, 'herdr-invocation-present');
  // The capability pool binds the same way.
  const pool = bind(preferAsk({ capability: 'docs:write' }), { runnerConfig: config, session: herdr });
  assert.equal(pool.invocation, 'duo-herdr');
  // An invocation the unit names is still kept.
  const pinned = bind(preferAsk({ capability: 'docs:write', prefer: [{ executor: 'duo', invocation: 'duo-confined' }] }), { runnerConfig: config, session: herdr });
  assert.equal(pinned.invocation, 'duo-confined');
  assert.equal(pinned.transport, 'cli');
});

test('bind: a unit rigor never selects a tier: a low rigor binds the default tier', () => {
  const result = bind(
    { unit: { id: 'u1', capability: 'docs:write', writes: ['docs/a.md'], rigor: 'low' }, role: 'producer', independentOf: [] },
    { runnerConfig: createMockRunnerConfig(), session: { herdrPresent: false, headless: true } },
  );
  assert.equal(result.tier, 'standard');
  assert.equal(result.model, 'gpt-4o');
  assert.equal(result.provenance.tier.source, 'defaults.tier');
});

test('bind: a capability rigor never selects a tier either: the seat binds the tier the config declares, else the default', () => {
  const rigorOnly = bind(
    { unit: { id: 'u1', capability: 'code:implement', writes: ['src/foo.js'], rigor: 'low' }, role: 'producer', independentOf: [] },
    { runnerConfig: createMockRunnerConfig(), session: { herdrPresent: false, headless: true } },
  );
  assert.equal(rigorOnly.tier, 'standard');
  const config = createMockRunnerConfig();
  config.capabilities['code:implement'].tier = 'flagship';
  const declared = bind(
    { unit: { id: 'u1', capability: 'code:implement', writes: ['src/foo.js'], rigor: 'low' }, role: 'producer', independentOf: [] },
    { runnerConfig: config, session: { herdrPresent: false, headless: true } },
  );
  assert.equal(declared.tier, 'flagship');
  assert.equal(declared.provenance.tier.source, 'capabilities."code:implement".tier');
});

// runner.maxTier caps every seat and a lowering is never silent: the tier source becomes the maxTier line
// and the binding names the tier it was lowered from. A capability may declare its own maxTier, above or
// below the global one. Rigor and overrides never raise a tier.
function ceilingConfig() {
  const config = createMockRunnerConfig();
  config.maxTier = 'advanced';
  config.capabilities.synthesize = { prefer: [{ executor: 'claude', invocation: 'claude-cli' }], tier: 'frontier', maxTier: 'frontier' };
  config.capabilities.frame = { prefer: [{ executor: 'claude', invocation: 'claude-cli' }], tier: 'flagship', maxTier: 'flagship' };
  config.capabilities.lavish = { prefer: [{ executor: 'claude', invocation: 'claude-cli' }], tier: 'frontier' };
  return config;
}
const ceilingCtx = () => ({ runnerConfig: ceilingConfig(), session: { headless: true } });
const ceilingAsk = (capability, extra = {}) => ({ unit: { id: 'u', capability, writes: [], ...extra }, role: 'producer', independentOf: [] });

test('bind: a tier above the global maxTier is lowered to it, and the lowering names its source (max-tier-cap)', () => {
  const result = bind(ceilingAsk('lavish'), ceilingCtx());
  assert.equal(result.tier, 'advanced');
  assert.equal(result.model, 'claude-3-5-sonnet');
  assert.equal(result.provenance.tier.source, 'maxTier');
  assert.deepEqual(result.provenance.tier.loweredFrom, { from: 'frontier', fromSource: 'capabilities."lavish".tier', reason: 'max-tier-cap' });
  assert.deepEqual(result.provenance.tier.maxTier, { value: 'advanced', source: 'maxTier', applied: true });
});

test('bind: a capability maxTier above the global one lets that capability keep its tier, others stay capped', () => {
  const synth = bind(ceilingAsk('synthesize'), ceilingCtx());
  assert.equal(synth.tier, 'frontier');
  assert.equal(synth.model, 'claude-3-opus');
  assert.equal(synth.provenance.tier.source, 'capabilities."synthesize".tier');
  assert.deepEqual(synth.provenance.tier.maxTier, { value: 'frontier', source: 'capabilities."synthesize".maxTier', applied: false });
  assert.equal(synth.provenance.tier.loweredFrom, undefined);

  const other = bind(ceilingAsk('lavish'), ceilingCtx());
  assert.equal(other.tier, 'advanced');
});

test('bind: a unit rigor never lifts a seat to a tier: rigor critical on a capability with no tier binds the default', () => {
  const result = bind(ceilingAsk('implement', { rigor: 'critical' }), ceilingCtx());
  assert.equal(result.tier, 'standard');
  assert.equal(result.provenance.tier.source, 'defaults.tier');
});

test('bind: a tier override above the resolved tier is refused (tier-escalation-unauthorized), at the capability maxTier or not', () => {
  const ask = { ...ceilingAsk('implement'), overrides: [{ tier: 'frontier' }] };
  const refused = bind(ask, ceilingCtx());
  assert.equal(refused.refused.reason, 'tier-escalation-unauthorized');
  assert.match(refused.refused.detail, /frontier/);
  const framed = bind({ ...ceilingAsk('frame'), overrides: [{ tier: 'frontier' }] }, ceilingCtx());
  assert.equal(framed.refused.reason, 'tier-escalation-unauthorized');
});

test('bind: a tier override at or below the resolved tier is taken and says so', () => {
  const result = bind({ ...ceilingAsk('frame'), overrides: [{ tier: 'nano' }] }, ceilingCtx());
  assert.equal(result.tier, 'nano');
  assert.equal(result.provenance.tier.source, 'override');
  assert.equal(result.model, 'claude-3-haiku');
});

test('bind: without runner.maxTier there is no ceiling at all', () => {
  const config = ceilingConfig();
  delete config.maxTier;
  const result = bind(ceilingAsk('lavish'), { runnerConfig: config, session: { headless: true } });
  assert.equal(result.tier, 'frontier');
  assert.equal(result.provenance.tier.maxTier, undefined);
  assert.equal(result.provenance.tier.loweredFrom, undefined);
});

test('bind: a capability maxTier below the global cap lowers its seats further, naming its own line', () => {
  const config = ceilingConfig();
  config.capabilities.implement = { prefer: [{ executor: 'claude', invocation: 'claude-cli' }], tier: 'advanced', maxTier: 'standard' };
  const result = bind(ceilingAsk('implement'), { runnerConfig: config, session: { headless: true } });
  assert.equal(result.tier, 'standard');
  assert.equal(result.provenance.tier.source, 'capabilities."implement".maxTier');
  assert.deepEqual(result.provenance.tier.maxTier, { value: 'standard', source: 'capabilities."implement".maxTier', applied: true });
});

function skillsConfig() {
  const config = createMockRunnerConfig();
  config.executors.claude.supports = { skills: ['docs-seeker', 'mermaid'] };
  config.executors.codex.supports = { skills: ['docs-seeker'] };
  return config;
}

test('bind skills: only executors declaring every required skill bind, in pool order', () => {
  const unit = { id: 'u-skills', capability: 'docs:write', writes: ['README.md'], skills: ['docs-seeker', 'mermaid'] };
  const result = bind({ unit, role: 'producer', independentOf: [] }, { runnerConfig: skillsConfig(), session: { headless: true } });
  // docs:write lists codex first; it lacks "mermaid", so claude binds.
  assert.equal(result.executor, 'claude');

  const oneSkill = bind({ unit: { ...unit, skills: ['docs-seeker'] }, role: 'producer', independentOf: [] }, { runnerConfig: skillsConfig(), session: { headless: true } });
  assert.equal(oneSkill.executor, 'codex');
});

test('bind skills: refuses with skills-unavailable, naming the missing skills, when no executor declares them', () => {
  const unit = { id: 'u-skills', capability: 'docs:write', writes: ['README.md'], skills: ['kubectl'] };
  const result = bind({ unit, role: 'producer', independentOf: [] }, { runnerConfig: skillsConfig(), session: { headless: true } });
  assert.equal(result.refused.reason, 'skills-unavailable');
  assert.match(result.refused.detail, /\[kubectl\]/);
});

test('bind skills: an executor with no supports.skills declares none, and a unit without skills binds as before', () => {
  const config = createMockRunnerConfig();
  const unit = { id: 'u-skills', capability: 'docs:write', writes: ['README.md'], skills: ['docs-seeker'] };
  assert.equal(bind({ unit, role: 'producer', independentOf: [] }, { runnerConfig: config, session: { headless: true } }).refused.reason, 'skills-unavailable');
  const plain = bind({ unit: { ...unit, skills: undefined }, role: 'producer', independentOf: [] }, { runnerConfig: config, session: { headless: true } });
  assert.equal(plain.executor, 'codex');
});

test('bind skills: a live session lead never takes over a unit that needs skills', () => {
  const unit = { id: 'u-skills', capability: 'docs:write', writes: ['README.md'], skills: ['kubectl'] };
  const ctx = { runnerConfig: skillsConfig(), session: { headless: false, provider: 'claude', hasNativeAgent: true } };
  assert.equal(bind({ unit, role: 'producer', independentOf: [] }, ctx).refused.reason, 'skills-unavailable');
  // without the requirement the lead still takes the inline fallback when no candidate fits
  const noPool = { ...ctx, runnerConfig: { ...skillsConfig(), capabilities: {} } };
  assert.equal(bind({ unit: { ...unit, skills: undefined }, role: 'producer', independentOf: [] }, noPool).mechanism, 'inline');
});

test('bind skills: checker and panel seats are chosen on independence, not on the producer skills', () => {
  const unit = { id: 'u-skills', capability: 'docs:write', writes: [], skills: ['mermaid'] };
  const reviewer = bind({ unit, ...CHECKER, readOnly: true, independentOf: ['claude'] }, { runnerConfig: skillsConfig(), session: { headless: true } });
  assert.equal(reviewer.executor, 'codex');
});

test('bind: debate seats never run inline or in-process and are not asked for the unit skills', () => {
  const runnerConfig = createMockRunnerConfig();
  const unit = { id: 'u-debate', capability: 'unknown:verb', writes: [] };
  const ctx = { runnerConfig, session: { headless: false, hasNativeAgent: true, provider: 'claude' } };
  for (const seat of ['thesis', 'antithesis', 'judge']) {
    assert.ok(bind({ unit, seat, role: seat === 'judge' ? 'judge' : 'producer', posture: DEBATE_POSTURE }, ctx).refused, `${seat} is refused rather than falling back to the lead inline`);
  }
  const skilled = { id: 'u-skills', capability: 'docs:write', writes: [], skills: ['mermaid'] };
  const judge = bind({ unit: skilled, seat: 'judge', role: 'judge', posture: DEBATE_POSTURE, readOnly: true, independentOf: ['claude'] }, { runnerConfig: skillsConfig(), session: { headless: true } });
  assert.equal(judge.executor, 'codex', 'a judge is chosen on independence alone');
  assert.equal(judge.mechanism, 'out-of-process');
});

// ---- ranking owned by Seat Binding: pins, effort, inline lead, continuity ----------------------------

const pinnedConfig = (entry) => {
  const runnerConfig = createMockRunnerConfig();
  runnerConfig.capabilities['code:implement'].prefer = [entry];
  return runnerConfig;
};
const implementAsk = { unit: { id: 'u1', capability: 'code:implement', writes: ['src/foo.js'] }, role: 'producer' };

test('bind: a hard pin to an invocation the executor does not have refuses the seat by name, and never swaps another invocation in', () => {
  const result = bind(implementAsk, { runnerConfig: pinnedConfig({ executor: 'claude', invocation: 'claude-missing' }), session: { herdrPresent: true } });
  assert.equal(result.refused.reason, 'pin-unsatisfiable');
  assert.match(result.refused.detail, /claude-missing/);
});

test('bind: a cell effort is carried into the binding as the cell\'s promise and named as such', () => {
  const runnerConfig = createMockRunnerConfig();
  runnerConfig.modelPolicies.claude.standard = [{ model: 'claude-3-5-sonnet', effort: 'high' }];
  const result = bind(implementAsk, { runnerConfig, session: {} });
  assert.equal(result.reasoningEffort, 'high');
  assert.deepEqual(result.provenance.reasoningEffort, { value: 'high', source: 'cell' });
  assert.equal(bind({ ...implementAsk, overrides: [{ reasoningEffort: 'max' }] }, { runnerConfig, session: {} }).reasoningEffort, 'max', 'an override may raise the cell\'s effort');
});

test('bind: a cell without an effort records the invocation default, which is not a promise', () => {
  const result = bind(implementAsk, { runnerConfig: createMockRunnerConfig(), session: {} });
  assert.equal(result.reasoningEffort, null);
  assert.deepEqual(result.provenance.reasoningEffort, { value: null, source: 'invocation-default' });
});

test('bind: an override effort below the cell\'s cannot claim the tier', () => {
  const runnerConfig = createMockRunnerConfig();
  runnerConfig.modelPolicies.claude.standard = [{ model: 'claude-3-5-sonnet', effort: 'high' }];
  const result = bind({ ...implementAsk, overrides: [{ reasoningEffort: 'low' }] }, { runnerConfig: pinnedConfig({ executor: 'claude' }), session: {} });
  assert.equal(result.reasoningEffort, 'low', 'a cell that promises no effort is lowered by nothing: the override is taken');
  runnerConfig.capabilities['code:implement'].prefer = [{ executor: 'claude' }];
  const refused = bind({ ...implementAsk, overrides: [{ reasoningEffort: 'low' }] }, { runnerConfig, session: {} });
  assert.equal(refused.refused.reason, 'effort-below-cell');
});

test('bind: an effort the executor does not declare, or its CLI cannot render, refuses the seat and lists what is rendered', () => {
  const limited = createMockRunnerConfig();
  limited.executors.claude.supports = { reasoningEffort: ['low', 'medium'] };
  limited.capabilities['code:implement'].prefer = [{ executor: 'claude' }];
  const declared = bind({ ...implementAsk, overrides: [{ reasoningEffort: 'high' }] }, { runnerConfig: limited, session: {} });
  assert.equal(declared.refused.reason, 'effort-unsupported');
  assert.deepEqual(declared.refused.rendered, ['low', 'medium']);

  const blind = createMockRunnerConfig();
  blind.executors.claude.command = 'unknown-bin';
  blind.capabilities['code:implement'].prefer = [{ executor: 'claude' }];
  blind.modelPolicies.claude.standard = [{ model: 'claude-3-5-sonnet', effort: 'high' }];
  const cannot = bind(implementAsk, { runnerConfig: blind, session: {} });
  assert.equal(cannot.refused.reason, 'effort-unsupported', 'the cell promises an effort no launch of this CLI can render');
});

test('bind: with a lead present and every configured candidate refused the seat is refused by name, never run inline', () => {
  const runnerConfig = createMockRunnerConfig();
  runnerConfig.governance = { disallowedExecutors: ['claude', 'codex', 'gemini-cli'] };
  const result = bind({ ...implementAsk, posture: { ...POSTURE, writer: true, inlineAllowed: true } }, { runnerConfig, session: { headless: false, hasNativeAgent: true, provider: 'claude' } });
  assert.equal(result.refused.reason, 'governance');
  assert.equal(result.mechanism, undefined);
});

test('bind: a seat that keeps its candidate keeps executor, model and effort; a failure then refuses it instead of moving it', () => {
  const ctx = { runnerConfig: createMockRunnerConfig(), session: {} };
  const first = bind(implementAsk, ctx);
  const again = bind(implementAsk, ctx, { walk: { continuity: first } });
  assert.deepEqual([again.executor, again.model, again.reasoningEffort], [first.executor, first.model, first.reasoningEffort]);
  const walked = bind(implementAsk, ctx, { walk: { continuity: first, tried: [first] } });
  assert.equal(walked.refused.reason, 'seat-continuity-unavailable');
  const retired = createMockRunnerConfig();
  retired.modelPolicies.claude.standard = 'claude-retired';
  assert.equal(bind(implementAsk, { runnerConfig: retired, session: {} }, { walk: { continuity: first } }).refused.reason, 'seat-continuity-unavailable', 'a kept model the config no longer offers');
});
