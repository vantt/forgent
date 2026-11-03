// test/runner/execution/bind.test.mjs

import '../../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { ensureScriptAddon } from '../../../scripts/lib/git-ports.mjs';
import { initFixtureRepo } from '../../helpers/git-fixture.mjs';
import { acquireDocumentationCutoverLease } from '../../../src/runner/documentation-cutover-lease.mjs';
import { checkExecutorPostureCoverage } from '../../../src/setup/executor-posture-coverage.mjs';
import { checkSeatBindingDryBind } from '../../../src/setup/seat-binding-checks.mjs';
import { bind, BIND_CONTRACT_VERSION } from '../../../src/runner/execution/bind.mjs';
import { seedFileLocalBwrapRegistry } from '../confinement-registry-fixture.helper.mjs';

// posture filtering consults the machine backend registry; keep it file-local
seedFileLocalBwrapRegistry();
ensureScriptAddon();

// Execution-door tests own lease refusal. This replaces the retired bind gate
// proof: doctor and replay only choose seats, independently of the process cwd.
test('seat choice and doctor dry binds ignore a held documentation lease in every checkout', async (t) => {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'bind-lease-'));
  t.after(() => fs.rmSync(repoRoot, { recursive: true, force: true }));
  initFixtureRepo(repoRoot, { branch: 'main', ignore: '.fgos/\n' });
  const worktreePath = path.join(repoRoot, 'holder');
  execFileSync('git', ['worktree', 'add', '-qb', 'holder', worktreePath], { cwd: repoRoot, stdio: 'ignore' });
  const ask = { unit: { id: 'read', capability: 'docs:write', writes: [] }, seat: 'producer', role: 'producer' };
  const runnerConfig = createMockRunnerConfig();
  const ctx = { runnerConfig, session: { headless: true } };
  const free = bind(ask, ctx);
  assert.equal(free.refused, undefined);
  const next = bind(ask, ctx, { walk: { tried: [free] } });
  const workflows = path.join(repoRoot, 'core/workflows');
  fs.mkdirSync(workflows, { recursive: true });
  fs.writeFileSync(path.join(workflows, 'read.json'), JSON.stringify({ id: 'read', steps: [{ id: 'read', units: [{ id: 'read', template: ask.unit }] }] }));
  const doctorOptions = { runnerConfig, session: ctx.session };
  const dryOptions = { packageRoot: repoRoot, loadRunnerConfig: () => runnerConfig };
  const before = [await checkExecutorPostureCoverage(repoRoot, doctorOptions), await checkSeatBindingDryBind(repoRoot, dryOptions)];
  assert.ok(before.every(result => result.passed), JSON.stringify(before));
  acquireDocumentationCutoverLease({ repoRoot: worktreePath });
  const cwd = process.cwd();
  try {
    for (const checkout of [repoRoot, worktreePath]) {
      process.chdir(checkout);
      assert.deepEqual(bind(ask, ctx), free);
      assert.deepEqual(bind(ask, ctx, { walk: { tried: [free] } }), next);
      assert.deepEqual(await checkExecutorPostureCoverage(repoRoot, doctorOptions), before[0]);
      assert.deepEqual(await checkSeatBindingDryBind(repoRoot, dryOptions), before[1]);
    }
  } finally { process.chdir(cwd); }
});

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

test('bind skills: checker and panel seats are chosen on independence, not on the producer skills', () => {
  const unit = { id: 'u-skills', capability: 'docs:write', writes: [], skills: ['mermaid'] };
  const reviewer = bind({ unit, ...CHECKER, readOnly: true, independentOf: ['claude'] }, { runnerConfig: skillsConfig(), session: { headless: true } });
  assert.equal(reviewer.executor, 'codex');
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

test('bind: a cell effort is carried into the binding as the cell\'s promise and named as such', () => {
  const runnerConfig = createMockRunnerConfig();
  runnerConfig.modelPolicies.claude.standard = [{ model: 'claude-3-5-sonnet', effort: 'high' }];
  const result = bind(implementAsk, { runnerConfig, session: {} });
  assert.equal(result.reasoningEffort, 'high');
  assert.deepEqual(result.provenance.reasoningEffort, { value: 'high', source: 'cell' });
  assert.equal(bind({ ...implementAsk, overrides: [{ reasoningEffort: 'max' }] }, { runnerConfig, session: {} }).reasoningEffort, 'max', 'an override may raise the cell\'s effort');
});

test('bind: an override effort on a cell that promises none is taken as given', () => {
  const result = bind({ ...implementAsk, overrides: [{ reasoningEffort: 'low' }] }, { runnerConfig: createMockRunnerConfig(), session: {} });
  assert.equal(result.reasoningEffort, 'low');
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

test('bind after a lease conflict names another account of the same candidate from the same policy', () => {
  const runnerConfig = accountConfig({ a: piStore('a'), b: piStore('b') });
  const first = bind(docsAsk, { runnerConfig, session: {} });
  assert.equal(first.leaseAccount, 'a');
  const again = bind(docsAsk, { runnerConfig, session: {} }, { walk: { from: first, reason: 'lease-conflict', failedAccounts: [{ pool: 'alpha', account: 'a' }] } });
  assert.deepEqual([again.executor, again.pool, again.leaseAccount], ['alpha', 'alpha', 'b']);
  assert.equal(again.provenance.fallbackFrom.kind, 'lease-conflict');
  const none = bind(docsAsk, { runnerConfig, session: {} }, { walk: { from: first, reason: 'lease-conflict', failedAccounts: [{ pool: 'alpha', account: 'a' }, { pool: 'alpha', account: 'b' }] } });
  assert.equal(none.refused.reason, 'no-account-available');
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
