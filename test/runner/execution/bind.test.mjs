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

test('architecture guard: bind.mjs does NOT import src/state or src/runner/coordination', async () => {
  const fs = await import('node:fs/promises');
  const content = await fs.readFile(new URL('../../../src/runner/execution/bind.mjs', import.meta.url), 'utf8');

  assert.doesNotMatch(content, /from\s+['"][^'"]*\/state\//);
  assert.doesNotMatch(content, /from\s+['"][^'"]*\/runner\/coordination\//);
  assert.doesNotMatch(content, /from\s+['"][^'"]*worktree/);
  assert.doesNotMatch(content, /from\s+['"][^'"]*merge/);
});
