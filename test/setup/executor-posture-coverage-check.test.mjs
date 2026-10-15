import { test } from 'node:test';
import assert from 'node:assert/strict';

import { DOCTOR_CHECKS } from '../../src/setup/checks.mjs';
import { checkExecutorPostureCoverage } from '../../src/setup/executor-posture-coverage.mjs';
import { seedFileLocalBwrapRegistry } from '../runner/confinement-registry-fixture.helper.mjs';

seedFileLocalBwrapRegistry();

const cliBwrap = (id, command) => ({
  id,
  via: 'cli',
  adapter: 'cli-spawn',
  command,
  args: ['-p', '{prompt}'],
  confinement: { backend: 'bwrap' },
});

test('executor-posture-coverage doctor check is registered and visible in DOCTOR_CHECKS', () => {
  const check = DOCTOR_CHECKS.find((c) => c.id === 'executor-posture-coverage');
  assert.ok(check, 'executor-posture-coverage must be registered in DOCTOR_CHECKS');
  assert.match(check.description, /core capabilities/);
});

test('executor-posture-coverage passes when all core capabilities have bwrap-capable executors', async () => {
  const runnerConfig = {
    executors: {
      claude: {
        kind: 'agent',
        providerModel: 'claude',
        invocations: [cliBwrap('claude-cli-bwrap', 'claude')],
      },
      gemini: {
        kind: 'agent',
        providerModel: 'gemini',
        invocations: [cliBwrap('gemini-cli-bwrap', 'gemini')],
      },
    },
    capabilities: {
      execute: { prefer: 'claude' },
      'code:implement': { prefer: [{ executor: 'gemini' }] },
    },
  };

  const result = await checkExecutorPostureCoverage(process.cwd(), {
    runnerConfig,
  });

  assert.equal(result.passed, true, `Expected pass, got: ${result.message}`);
  assert.match(result.message, /execute -> claude/);
  assert.match(result.message, /code:implement -> gemini/);
});

test('executor-posture-coverage fails and suggests remediation when an executor lacks bwrap sandbox', async () => {
  // mcp-skill-hub failure mode: legacy agent executor has no bwrap invocation or confinement
  const runnerConfig = {
    executors: {
      openai: {
        kind: 'agent',
        providerModel: 'openai',
        command: 'openai',
        args: ['-p', '{prompt}'],
      },
      claude: {
        kind: 'agent',
        providerModel: 'claude',
        invocations: [cliBwrap('claude-cli-bwrap', 'claude')],
      },
    },
    capabilities: {
      execute: { prefer: 'openai' },
      'code:implement': { prefer: 'claude' },
    },
  };

  const result = await checkExecutorPostureCoverage(process.cwd(), {
    runnerConfig,
  });

  assert.equal(result.passed, false, `Expected failure, got: ${result.message}`);
  assert.match(result.message, /posture-unavailable/);
  assert.match(result.message, /sandbox\.backend "bwrap"/);
  assert.match(result.message, /remove project-level executors\.<id> overrides/);
});

test('executor-posture-coverage passes when executors are native agents (in-process exemption)', async () => {
  const runnerConfig = {
    executors: {
      nativeClaude: {
        agentType: 'claude',
        providerModel: 'claude',
      },
    },
    capabilities: {
      execute: { prefer: 'nativeClaude' },
      'code:implement': { prefer: 'nativeClaude' },
    },
  };

  const result = await checkExecutorPostureCoverage(process.cwd(), {
    runnerConfig,
  });

  assert.equal(result.passed, true, `Expected pass for native agent, got: ${result.message}`);
  assert.match(result.message, /execute -> nativeClaude/);
  assert.match(result.message, /code:implement -> nativeClaude/);
});

test('executor-posture-coverage handles runner config loading failure gracefully', async () => {
  const result = await checkExecutorPostureCoverage('/nonexistent/path', {
    loadRunnerConfig: () => {
      throw new Error('cannot read config');
    },
  });

  assert.equal(result.passed, true);
  assert.match(result.message, /runner config not loadable here, executor posture coverage not evaluated: cannot read config/);
});

test('executor-posture-coverage only inspects core capabilities and capabilities declaring a pool', async () => {
  const runnerConfig = {
    executors: {
      claude: {
        kind: 'agent',
        providerModel: 'claude',
        invocations: [cliBwrap('claude-cli-bwrap', 'claude')],
      },
    },
    capabilities: {
      execute: { prefer: 'claude' },
      'code:implement': { prefer: 'claude' },
      'custom:no-pool': { description: 'description only without prefer' },
      'custom:empty-pool': { prefer: [] },
      'custom:with-pool': { prefer: ['claude'] },
    },
  };

  const result = await checkExecutorPostureCoverage(process.cwd(), {
    runnerConfig,
  });

  assert.equal(result.passed, true, `Expected pass, got: ${result.message}`);
  assert.match(result.message, /custom:with-pool -> claude/);
  assert.doesNotMatch(result.message, /custom:no-pool/);
  assert.doesNotMatch(result.message, /custom:empty-pool/);
});

test('executor-posture-coverage skips tool-only capabilities that do not use agent postures', async () => {
  const runnerConfig = {
    executors: {
      claude: {
        kind: 'agent',
        providerModel: 'claude',
        invocations: [cliBwrap('claude-cli-bwrap', 'claude')],
      },
      toolExecutor: {
        kind: 'tool',
        description: 'Tool executor',
        invocations: [{ via: 'mcp', command: 'mcp:tool' }],
      },
    },
    capabilities: {
      execute: { prefer: 'claude' },
      'code:implement': { prefer: 'claude' },
      'tool:capability': { prefer: 'toolExecutor' },
    },
  };

  const result = await checkExecutorPostureCoverage(process.cwd(), {
    runnerConfig,
  });

  assert.equal(result.passed, true, `Expected pass, got: ${result.message}`);
  assert.doesNotMatch(result.message, /tool:capability/);
});

test('executor-posture-coverage passes with real bind() on bwrap config fixture', async () => {
  const runnerConfig = {
    executors: {
      sandboxed: {
        kind: 'agent',
        providerModel: 'claude',
        invocations: [cliBwrap('sandboxed-bwrap', 'claude')],
      },
    },
    capabilities: {
      execute: { prefer: 'sandboxed' },
      'code:implement': { prefer: 'sandboxed' },
    },
  };

  const result = await checkExecutorPostureCoverage(process.cwd(), {
    runnerConfig,
  });

  assert.equal(result.passed, true, `Expected pass with bwrap, got: ${result.message}`);
  assert.match(result.message, /execute -> sandboxed/);
  assert.match(result.message, /code:implement -> sandboxed/);
});

test('executor-posture-coverage fails posture-unavailable with real bind() on unconfined invocation config fixture', async () => {
  const runnerConfig = {
    executors: {
      unconfined: {
        kind: 'agent',
        providerModel: 'claude',
        invocations: [{
          id: 'unconfined-cli',
          via: 'cli',
          adapter: 'cli-spawn',
          command: 'claude',
          args: ['-p', '{prompt}'],
        }],
      },
    },
    capabilities: {
      execute: { prefer: 'unconfined' },
      'code:implement': { prefer: 'unconfined' },
    },
  };

  const result = await checkExecutorPostureCoverage(process.cwd(), {
    runnerConfig,
  });

  assert.equal(result.passed, false, `Expected failure, got: ${result.message}`);
  assert.match(result.message, /posture-unavailable/);
  assert.match(result.message, /sandbox\.backend "bwrap"/);
});

test('executor-posture-coverage warns and provides pool configuration guidance on headless-no-executor / no-candidate', async () => {
  const runnerConfig = {
    executors: {
      claude: {
        kind: 'agent',
        providerModel: 'claude',
        invocations: [cliBwrap('claude-cli-bwrap', 'claude')],
      },
    },
    capabilities: {
      execute: { prefer: [] },
      'code:implement': { prefer: 'claude' },
    },
  };

  const result = await checkExecutorPostureCoverage(process.cwd(), {
    runnerConfig,
  });

  assert.equal(result.passed, true, `Expected warning (passed: true), got: ${result.message}`);
  assert.match(result.message, /^warning:/);
  assert.match(result.message, /runner\.capabilities\.<cap>\.prefer/);
  assert.doesNotMatch(result.message, /global pool/);
  assert.doesNotMatch(result.message, /sandbox\.backend "bwrap"/);
});

test('executor-posture-coverage groups failures by reason when both posture and candidate failures occur', async () => {
  const runnerConfig = {
    executors: {
      unconfinedExec: {
        kind: 'agent',
        providerModel: 'unconfined',
        command: 'unconfined',
        args: ['-p', '{prompt}'],
      },
    },
    capabilities: {
      execute: { prefer: 'unconfinedExec' },
      'code:implement': { prefer: [] },
    },
  };

  const result = await checkExecutorPostureCoverage(process.cwd(), {
    runnerConfig,
  });

  assert.equal(result.passed, false, `Expected failure, got: ${result.message}`);
  assert.match(result.message, /executors lack required posture confinement: execute/);
  assert.match(result.message, /sandbox\.backend "bwrap"/);
  assert.match(result.message, /no candidate executor available: code:implement/);
  assert.match(result.message, /runner\.capabilities\.<cap>\.prefer/);
});
