import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

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
  assert.equal(
    check.description,
    'core capabilities (execute, code:implement, and capabilities declaring a pool) have at least one candidate executor capable of applying read-only and workspace-write postures',
  );
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

test('executor-posture-coverage passes when a read-only capability pool only supports read-only posture', async () => {
  const runnerConfig = {
    executors: {
      claude: {
        kind: 'agent',
        providerModel: 'claude',
        invocations: [cliBwrap('claude-cli-bwrap', 'claude')],
      },
      roAgent: {
        kind: 'agent',
        providerModel: 'ro',
        invocations: [cliBwrap('ro-cli-bwrap', 'ro')],
      },
    },
    capabilities: {
      execute: { prefer: 'claude' },
      'code:implement': { prefer: 'claude' },
      'code:review': {
        description: 'Read-only review',
        prefer: ['roAgent'],
        // no serves.mutates: true
      },
    },
  };

  // Mock simulateUnitBindings to reject workspace-write on roAgent
  const simulateUnitBindings = async (unit) => {
    if (unit.capability === 'code:review' && unit.writes && unit.writes.length > 0) {
      return {
        outcome: 'policy-refusal',
        roles: [{ role: 'producer', refused: { reason: 'posture-unavailable', detail: 'Read-only executor cannot write' } }],
      };
    }
    const exec = unit.capability === 'code:review' ? 'roAgent' : 'claude';
    return {
      outcome: 'pass',
      roles: [{ role: 'producer', executor: exec, invocation: `${exec}-cli-bwrap` }],
    };
  };

  const result = await checkExecutorPostureCoverage(process.cwd(), {
    runnerConfig,
    simulateUnitBindings,
  });

  assert.equal(result.passed, true, `Expected pass, got: ${result.message}`);
  assert.match(result.message, /code:review -> roAgent/);
});

test('executor-posture-coverage demands workspace-write for capabilities with serves.mutates === true', async () => {
  const runnerConfig = {
    executors: {
      claude: {
        kind: 'agent',
        providerModel: 'claude',
        invocations: [cliBwrap('claude-cli-bwrap', 'claude')],
      },
      writerAgent: {
        kind: 'agent',
        providerModel: 'writer',
        invocations: [cliBwrap('writer-cli-bwrap', 'writer')],
      },
    },
    capabilities: {
      execute: { prefer: 'claude' },
      'code:implement': { prefer: 'claude' },
      'custom:mutating': {
        description: 'Mutating custom capability',
        prefer: ['writerAgent'],
        serves: { mutates: true },
      },
    },
  };

  const simulateUnitBindings = async (unit) => {
    if (unit.capability === 'custom:mutating' && unit.writes && unit.writes.length > 0) {
      return {
        outcome: 'policy-refusal',
        roles: [{ role: 'producer', refused: { reason: 'posture-unavailable', detail: 'Writer sandbox missing' } }],
      };
    }
    const exec = unit.capability === 'custom:mutating' ? 'writerAgent' : 'claude';
    return {
      outcome: 'pass',
      roles: [{ role: 'producer', executor: exec, invocation: `${exec}-cli-bwrap` }],
    };
  };

  const result = await checkExecutorPostureCoverage(process.cwd(), {
    runnerConfig,
    simulateUnitBindings,
  });

  assert.equal(result.passed, false, `Expected failure, got: ${result.message}`);
  assert.match(result.message, /custom:mutating \(workspace-write\): posture-unavailable/);
});

test('executor-posture-coverage fails and provides pool configuration guidance on headless-no-executor / no-candidate', async () => {
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

  assert.equal(result.passed, false, `Expected failure, got: ${result.message}`);
  assert.match(result.message, /no candidate executor available/);
  assert.match(result.message, /runner\.capabilities\.<cap>\.prefer/);
  assert.match(result.message, /global pool/);
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
