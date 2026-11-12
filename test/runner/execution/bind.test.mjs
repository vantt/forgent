// test/runner/execution/bind.test.mjs

import '../../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ensureScriptAddon } from '../../../scripts/lib/git-ports.mjs';
import { askFor, bind, BIND_CONTRACT_VERSION } from '../../../src/runner/execution/bind.mjs';
import { createSeatLedger } from '../../../src/runner/execution/seat-ledger.mjs';
import { seedFileLocalBwrapRegistry } from '../confinement-registry-fixture.helper.mjs';
import { seedStubAgentClis } from '../../helpers/agent-clis.mjs';

// posture filtering consults the machine backend registry; keep it file-local
seedFileLocalBwrapRegistry();
seedStubAgentClis('claude', 'codex', 'agy', 'duo', 'pi', 'omp', 'unknown-bin');
ensureScriptAddon();

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
const POSTURE = { readOnly: false, writer: false, forceOutOfProcess: false, stance: false, verdict: false };
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

// The run and the dry bind both ask through askFor, so this is the one proof that both hold independence both ways.
test('the bind ask holds a seat to the executor of a seat bound earlier that must differ from it', () => {
  const runnerConfig = createMockRunnerConfig();
  const unit = { id: 'u1', capability: 'docs:write', writes: [] };
  const ledger = createSeatLedger();
  const seat = (id) => ({ ...CHECKER, seat: id });
  // The checker binds first and names the producer, not bound yet: nothing is excluded, it takes codex.
  const checker = bind(askFor({ seat: seat('checker'), unit, independentOf: ['producer'] }, ledger), { runnerConfig, session: {} });
  assert.equal(checker.executor, 'codex');
  ledger.note('checker', checker.executor);
  ledger.noteDependence('checker', ['producer']);
  // The producer names no independence of its own, yet it may not share the checker's family.
  const ask = askFor({ seat: seat('producer'), unit }, ledger);
  assert.deepEqual(ask.independentOf, ['codex']);
  assert.equal(bind(ask, { runnerConfig, session: {} }).executor, 'claude');
  const onlyCodex = { ...runnerConfig, capabilities: { 'docs:write': { prefer: [{ executor: 'codex', invocation: 'codex-cli' }] } } };
  assert.equal(bind(ask, { runnerConfig: onlyCodex, session: {} }).refused?.reason, 'independence-unsatisfiable');
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

test('bind: a blind role is never bound in-process, and is refused with a named reason when nothing else is left', () => {
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
          { id: 'duo-paseo', via: 'cli', adapter: 'paseo-spawn', command: 'duo', confinement: { backend: 'bwrap' } },
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

test('bind: with no invocation named, records the plain cli invocation that can carry the posture; a paseo one runs only when pinned', () => {
  const ask = { unit: { id: 'u1', capability: 'docs:write', writes: [] }, role: 'producer' };
  const result = bind(ask, { runnerConfig: twoInvocationConfig(), session: { headless: true } });
  assert.equal(result.transport, 'cli');
  assert.equal(result.invocation, 'duo-confined', 'not the executor first cli invocation, nor its herdr-spawn or paseo-spawn one');
  assert.equal(result.provenance.invocation.value, 'duo-confined');
  const pinned = bind({ ...ask, overrides: [{ executor: 'duo', invocation: 'duo-paseo', origin: 'human-cli' }] }, { runnerConfig: twoInvocationConfig(), session: { headless: true } });
  assert.equal(pinned.invocation, 'duo-paseo');
  assert.equal(pinned.transport, 'paseo');
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

test('bind spread: a family the same provider reaches through another executor counts as used', () => {
  const ctx = { runnerConfig: createMockRunnerConfig(), session: {} };
  // native-agent is also a claude-family executor
  assert.equal(bind(spreadAsk([seatOn('member-1', 'native-agent')]), ctx).executor, 'codex');
});

test('bind: the binding names its provider family once, whatever spelling the executor declares', () => {
  const runnerConfig = createMockRunnerConfig();
  runnerConfig.executors.codex.provider = 'openai-codex';
  runnerConfig.executors['codex-alias'] = { ...runnerConfig.executors.codex, provider: 'codex' };
  runnerConfig.capabilities['docs:write'].prefer = [{ executor: 'codex-alias', invocation: 'codex-cli' }];
  const unit = { id: 'u1', capability: 'docs:write', writes: [] };
  const ctx = { runnerConfig, session: {} };
  const bound = bind({ unit, role: 'producer', readOnly: true }, ctx);
  assert.equal(bound.executor, 'codex-alias');
  assert.equal(bound.family, 'openai');
  assert.equal(bound.model, 'gpt-4o', 'the cell is the family\'s, not one keyed by the declared spelling');
  // An executor that must differ from `codex` is not served by another spelling of the same family.
  assert.equal(bind({ unit, role: 'producer', readOnly: true, independentOf: ['codex'] }, ctx).refused?.reason, 'independence-unsatisfiable');
});

test('bind: a modelPolicies cell written under another spelling of the family is found for it', () => {
  const runnerConfig = createMockRunnerConfig();
  runnerConfig.modelPolicies.codex = runnerConfig.modelPolicies.openai;
  delete runnerConfig.modelPolicies.openai;
  runnerConfig.executors.codex.provider = 'openai';
  const bound = bind({ unit: { id: 'u1', capability: 'docs:write', writes: [] }, role: 'producer', readOnly: true }, { runnerConfig, session: {} });
  assert.equal(bound.executor, 'codex');
  assert.equal(bound.model, 'gpt-4o');
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

test('a later binding records where it came from and what it skipped: another entry, another family, another account, a family with no cell', () => {
  const runnerConfig = createMockRunnerConfig();
  runnerConfig.executors['claude-lite'] = structuredClone(runnerConfig.executors.claude);
  delete runnerConfig.modelPolicies.gemini.standard;
  runnerConfig.capabilities['x:walk'] = { prefer: [{ executor: 'gemini-cli' }, { executor: 'claude' }, { executor: 'claude-lite' }, { executor: 'codex' }] };
  const ask = { unit: { id: 'u1', capability: 'x:walk', writes: [] }, role: 'producer' };
  const ctx = { runnerConfig, session: {} };
  const first = bind(ask, ctx);
  assert.equal(first.executor, 'claude');
  assert.equal(first.provenance.fallbackFrom, undefined, 'a first binding came from nowhere');
  assert.deepEqual(first.provenance.skipped.map((s) => [s.family, s.reason]), [['gemini', 'tier-cell-missing']]);
  const second = bind(ask, ctx, { walk: { tried: [first] } });
  assert.equal(second.executor, 'claude-lite');
  assert.deepEqual({ kind: second.provenance.fallbackFrom.kind, walk: second.provenance.fallbackFrom.walk, executor: second.provenance.fallbackFrom.executor, reason: second.provenance.fallbackFrom.reason }, { kind: 'next-candidate', walk: 'entry', executor: 'claude', reason: 'provider-limit' });
  const third = bind(ask, ctx, { walk: { tried: [first, second] } });
  assert.equal(third.executor, 'codex');
  assert.equal(third.provenance.fallbackFrom.walk, 'family');

  const accounts = accountConfig({ a: piStore('a'), b: piStore('b') });
  const bound = bind(docsAsk, { runnerConfig: accounts, session: {} });
  const rebound = bind(docsAsk, { runnerConfig: accounts, session: {} }, { walk: { from: bound, reason: 'lease-conflict', failedAccounts: [{ pool: 'alpha', account: bound.leaseAccount }] } });
  assert.equal(rebound.provenance.fallbackFrom.kind, 'lease-conflict');
  assert.notEqual(rebound.leaseAccount, bound.leaseAccount);
  const rotated = bind(docsAsk, { runnerConfig: accounts, session: {} }, { walk: { continuity: bound, from: bound, rotation: true, failedAccounts: [{ pool: 'alpha', account: bound.leaseAccount }] } });
  assert.equal(rotated.provenance.fallbackFrom.kind, 'account-rotation');
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

test('bind persona: a locked persona that disagrees with the unit persona or an override refuses the binding', () => {
  const runnerConfig = createMockRunnerConfig();
  const refused = bind(preferAsk({ persona: 'unit-voice' }, { lockedPersona: 'locked-voice' }), { runnerConfig, session: {} });
  assert.equal(refused.refused.reason, 'locked-persona');
  const overridden = bind(preferAsk({}, { lockedPersona: 'strict-reviewer', overrides: [{ scope: { role: 'producer' }, origin: 'human-cli', persona: 'casual-reviewer' }] }), { runnerConfig, session: {} });
  assert.equal(overridden.refused.reason, 'locked-persona', 'a persona override cannot unlock it either');
  const agreed = bind(preferAsk({ persona: 'locked-voice' }, { lockedPersona: 'locked-voice' }), { runnerConfig, session: {} });
  assert.equal(agreed.persona, 'locked-voice');
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
  const byId = (id) => config.executors.duo.invocations.find((inv) => inv.id === id);
  config.executors.duo.invocations = [byId('duo-plain'), byId('duo-confined'), byId('duo-herdr')];
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
  assert.deepEqual(pinned.provenance.invocation, { value: 'duo-confined', source: 'unit-prefer' });
  assert.equal(bare.provenance.executor.source, 'unit-prefer');
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

function skillsConfig() {
  const config = createMockRunnerConfig();
  config.executors.claude.supports = { skills: ['docs-seeker', 'mermaid'] };
  config.executors.codex.supports = { skills: ['docs-seeker'] };
  return config;
}

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

test('bind: debate seats never run in-process and are not asked for the unit skills', () => {
  const runnerConfig = createMockRunnerConfig();
  const unit = { id: 'u-debate', capability: 'unknown:verb', writes: [] };
  const ctx = { runnerConfig, session: { headless: false, hasNativeAgent: true, provider: 'claude' } };
  for (const seat of ['thesis', 'antithesis', 'judge']) {
    assert.ok(bind({ unit, seat, role: seat === 'judge' ? 'judge' : 'producer', posture: DEBATE_POSTURE }, ctx).refused, `${seat} is refused when nothing serves it`);
  }
  const skilled = { id: 'u-skills', capability: 'docs:write', writes: [], skills: ['mermaid'] };
  const judge = bind({ unit: skilled, seat: 'judge', role: 'judge', posture: DEBATE_POSTURE, readOnly: true, independentOf: ['claude'] }, { runnerConfig: skillsConfig(), session: { headless: true } });
  assert.equal(judge.executor, 'codex', 'a judge is chosen on independence alone');
  assert.equal(judge.mechanism, 'out-of-process');
});

// ---- ranking owned by Seat Binding: pins, effort, continuity ----------------------------

const pinnedConfig = (entry) => {
  const runnerConfig = createMockRunnerConfig();
  runnerConfig.capabilities['code:implement'].prefer = [entry];
  return runnerConfig;
};
const implementAsk = { unit: { id: 'u1', capability: 'code:implement', writes: ['src/foo.js'] }, role: 'producer' };

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

// ---- the account the lease takes is named by the bind --------------------------------------------------

function accountConfig(accounts) {
  return {
    defaults: { tier: 'standard' }, patterns: { seatBinding: { schema: 1 } },
    modelPolicies: { alpha: { standard: 'alpha-m' } },
    capabilities: { 'docs:write': { prefer: [{ executor: 'alpha' }] } },
    executors: {
      alpha: {
        kind: 'agent', providerModel: 'alpha', command: 'pi',
        invocations: [{ id: 'alpha-cli', via: 'cli', adapter: 'cli-spawn', command: 'pi', confinement: { backend: 'bwrap' }, credentialStore: { use: 'pi', homeEnv: 'PI_HOME', files: ['auth.json'] } }],
      },
    },
    llmAccounts: { alpha: accounts },
  };
}
const piStore = (name) => ({ credentialStore: { pi: `/srv/pi/${name}` } });
const docsAsk = { unit: { id: 'u', capability: 'docs:write', writes: [] }, role: 'producer' };

test('bind names the account the lease takes: the first enabled account of the pool in declared order', () => {
  const runnerConfig = accountConfig({ off: { ...piStore('off'), disabled: true }, first: piStore('first'), second: piStore('second'), codexOnly: { credentialStore: { codex: '/srv/codex/c' } } });
  const result = bind(docsAsk, { runnerConfig, session: {} });
  assert.equal(result.leaseAccount, 'first', 'a disabled account is never named');
  assert.equal(result.account, undefined, 'naming an account is not a pin');
  assert.match(result.bindingInput.accountViewDigest, /^sha256:/);
  assert.equal(result.bindingInput.walk.tried.length, 0);
  assert.ok(result.bindingInput.hostVersion);
  assert.equal(result.bindingInput.now, undefined, 'the decision time is not part of the recorded input');
});

test('bind never names an account that holds no login store for the CLI the launch reads', () => {
  const runnerConfig = accountConfig({ codexOnly: { credentialStore: { codex: '/srv/codex/c' } } });
  const result = bind(docsAsk, { runnerConfig, session: {} });
  assert.equal(result.refused.reason, 'pool-unusable');
  assert.match(result.refused.detail, /no enabled account of pool "alpha" holds a "pi" login store/);
});

test('bind reads the lease state: a quarantined account is skipped, the account this assignment holds ranks first, a dead login is offered only when nothing else is usable', async () => {
  const { quarantineProviderAccount, providerCapacityStatePaths } = await import('../../../src/runner/dispatch/provider-capacity.mjs');
  const runtimeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-bind-accounts-'));
  const runnerConfig = accountConfig({ a: piStore('a'), b: piStore('b'), c: piStore('c') });
  const ctxFor = (assignmentId) => ({ runnerConfig, session: {}, accounts: { runtimeDir, assignmentId } });

  quarantineProviderAccount({ provider: 'alpha', accountId: 'a', reasonCode: 'quota-limit', until: new Date(Date.now() + 3_600_000).toISOString(), runtimeDir });
  assert.equal(bind(docsAsk, ctxFor('asgn')).leaseAccount, 'b', 'the quarantined account is out until its end time');

  // The account an assignment already holds ranks first (sticky), even when another comes before it.
  const { statePath } = providerCapacityStatePaths(runtimeDir);
  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  state.assignments['alpha:asgn'] = { accountId: 'c', selectedAt: new Date().toISOString() };
  fs.writeFileSync(statePath, JSON.stringify(state));
  assert.equal(bind(docsAsk, ctxFor('asgn')).leaseAccount, 'c');
  assert.equal(bind(docsAsk, ctxFor('other')).leaseAccount, 'b', 'another assignment is not held to it');

  // Every account dead: a dead login is offered (one real call may lift it) instead of refusing the seat.
  for (const accountId of ['b', 'c']) quarantineProviderAccount({ provider: 'alpha', accountId, reasonCode: 'auth-token', quarantineKind: 'manual-clear', runtimeDir });
  quarantineProviderAccount({ provider: 'alpha', accountId: 'a', reasonCode: 'auth-token', quarantineKind: 'manual-clear', runtimeDir });
  assert.ok(bind(docsAsk, ctxFor('asgn')).leaseAccount, 'a dead login is probeable, so it is offered');
  const afterProbe = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  for (const accountId of ['a', 'b', 'c']) afterProbe.providers.alpha.accounts[accountId].quarantine.probe = { attemptedAt: new Date().toISOString(), status: 'failed' };
  fs.writeFileSync(statePath, JSON.stringify(afterProbe));
  assert.equal(bind(docsAsk, ctxFor('asgn')).refused.reason, 'no-account-available', 'every login failed its probe: the seat is refused by name');
});

test('a replay (a bind without lease state) names the candidate the runner bound even after its account was quarantined', async () => {
  const { quarantineProviderAccount } = await import('../../../src/runner/dispatch/provider-capacity.mjs');
  const runtimeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-bind-replay-'));
  const runnerConfig = accountConfig({ only: piStore('only') });
  const bound = bind(docsAsk, { runnerConfig, session: {}, accounts: { runtimeDir, assignmentId: 'asgn' } });
  assert.equal(bound.leaseAccount, 'only');
  quarantineProviderAccount({ provider: 'alpha', accountId: 'only', reasonCode: 'quota-limit', until: new Date(Date.now() + 3_600_000).toISOString(), runtimeDir });
  // The runner's own bind sees the quarantine; the replay the write gate runs reads no lease state, so it still
  // arrives at the executor, pool, model and tier the seat was bound to.
  assert.equal(bind(docsAsk, { runnerConfig, session: {}, accounts: { runtimeDir, assignmentId: 'asgn' } }).refused.reason, 'no-account-available');
  const replayed = bind(docsAsk, { runnerConfig, session: {} });
  assert.deepEqual([replayed.executor, replayed.pool, replayed.model, replayed.tier], [bound.executor, bound.pool, bound.model, bound.tier]);
});

test('bind: a capability that prefers an invocation with no confinement backend is refused, never swapped for another invocation', () => {
  const runnerConfig = createMockRunnerConfig();
  runnerConfig.executors.claude.invocations.push({ id: 'claude-plain', via: 'cli', adapter: 'cli-spawn' });
  runnerConfig.capabilities['docs:write'].prefer = [{ executor: 'claude', invocation: 'claude-plain' }];
  const ask = { unit: { id: 'u-plain', capability: 'docs:write', writes: [], rigor: 'standard' }, role: 'producer', readOnly: false, independentOf: [] };
  const refused = bind(ask, { runnerConfig, session: {} });
  assert.ok(refused.refused, 'the unconfined invocation is not bound');
  assert.equal(refused.refused.reason, 'pin-unsatisfiable');
  runnerConfig.capabilities['docs:write'].prefer = [{ executor: 'claude', invocation: 'claude-cli' }];
  const bound = bind(ask, { runnerConfig, session: {} });
  assert.equal(bound.invocation, 'claude-cli', 'the confined invocation of the same executor binds');
});
