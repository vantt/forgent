// test/runner/dispatch-governance-provider-denylist.test.mjs
// Verifies canonical provider family governance across direct and read-only redirect dispatch gates.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { executeAssignment } from '../../src/runner/dispatch/assignment-runner.mjs';
import { resolveAssignmentDispatchPolicy } from '../../src/runner/dispatch/assignment-policy.mjs';
import { buildAssignment } from '../../src/runner/dispatch/assignment.mjs';
import { RunnerConfigError } from '../../src/runner/dispatch/config.mjs';
import {
  normalizeProviderFamily,
  normalizeDisallowedProviders,
  checkProviderDisallowed,
  isProviderDisallowed,
} from '../../src/runner/dispatch/provider-adapter.mjs';

function mkTempDir(prefix = 'fgos-gov-denylist-') {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function writeRecordingWorker(dir, name) {
  const scriptPath = path.join(dir, `${name}.mjs`);
  const markerPath = path.join(dir, `${name}-marker.json`);
  const content = `
import fs from 'node:fs';
fs.writeFileSync(${JSON.stringify(markerPath)}, JSON.stringify({ spawned: true, argv: process.argv.slice(2), time: Date.now() }));
process.exit(0);
`;
  fs.writeFileSync(scriptPath, content);
  return { scriptPath, markerPath };
}

// ─── Unit: Canonical Provider Vocabulary Helpers ─────────────────────────────

test('provider-adapter canonicalizes provider families and deny lists symmetrically', () => {
  // Aliases mapping to canonical families
  assert.equal(normalizeProviderFamily('openai'), 'openai-codex');
  assert.equal(normalizeProviderFamily('codex'), 'openai-codex');
  assert.equal(normalizeProviderFamily('openai-codex'), 'openai-codex');
  assert.equal(normalizeProviderFamily('glm'), 'z-ai');
  assert.equal(normalizeProviderFamily('z-ai'), 'z-ai');
  assert.equal(normalizeProviderFamily('agy'), 'gemini');
  assert.equal(normalizeProviderFamily('gemini'), 'gemini');
  assert.equal(normalizeProviderFamily('claude'), 'claude');
  assert.equal(normalizeProviderFamily('deepseek'), 'deepseek');
  assert.equal(normalizeProviderFamily('custom-vendor'), 'custom-vendor');

  // Declared vendor takes precedence over CLI harness command
  assert.equal(normalizeProviderFamily('openai', 'pi'), 'openai-codex');
  assert.equal(normalizeProviderFamily('deepseek', 'pi'), 'deepseek');
  assert.equal(normalizeProviderFamily('z-ai', 'claude'), 'z-ai');

  // Normalizing deny list
  const denySet = normalizeDisallowedProviders(['openai', 'glm', 'agy', 'deepseek']);
  assert.ok(denySet.has('openai-codex'));
  assert.ok(denySet.has('z-ai'));
  assert.ok(denySet.has('gemini'));
  assert.ok(denySet.has('deepseek'));

  // Disallowed evaluation
  assert.equal(isProviderDisallowed(['openai'], 'openai'), true);
  assert.equal(isProviderDisallowed(['openai-codex'], 'openai'), true);
  assert.equal(isProviderDisallowed(['openai'], 'openai-codex'), true);
  assert.equal(isProviderDisallowed(['codex'], 'openai'), true);
  assert.equal(isProviderDisallowed(['glm'], 'z-ai'), true);
  assert.equal(isProviderDisallowed(['z-ai'], 'glm'), true);
  assert.equal(isProviderDisallowed(['agy'], 'gemini'), true);
  assert.equal(isProviderDisallowed(['gemini'], 'agy'), true);
  assert.equal(isProviderDisallowed(['claude'], 'openai'), false);
});

// ─── Direct Gate: OpenAI Family Alias Governance ─────────────────────────────

test('direct dispatch gate enforces canonical provider matching for OpenAI family aliases', () => {
  const runnerConfig = {
    executor: { command: 'claude', args: [] },
    modelPolicies: {
      claude: { standard: 'claude-3-7-sonnet' },
      openai: { standard: 'gpt-4o' },
      'openai-codex': { standard: 'gpt-4o' },
    },
    executors: {
      'exec-openai': {
        command: 'codex',
        providerModel: 'openai',
        allowCrossProvider: true,
      },
      'exec-openai-codex': {
        command: 'codex',
        providerModel: 'openai-codex',
        allowCrossProvider: true,
      },
    },
  };

  const assignmentOpenAI = buildAssignment({
    work: { id: 'w-direct-openai', status: 'todo', stage: 'planning', domain: 'coding' },
    assignmentId: 'asgn-direct-openai',
    role: 'planner',
    stage: 'planning',
    operation: 'shape-plan',
    policy: { preferExecutor: 'exec-openai' },
  });

  const assignmentCodex = buildAssignment({
    work: { id: 'w-direct-codex', status: 'todo', stage: 'planning', domain: 'coding' },
    assignmentId: 'asgn-direct-codex',
    role: 'planner',
    stage: 'planning',
    operation: 'shape-plan',
    policy: { preferExecutor: 'exec-openai-codex' },
  });

  // 1. deny 'openai' blocks declared 'openai'
  assert.throws(
    () => resolveAssignmentDispatchPolicy({
      assignment: assignmentOpenAI,
      runnerConfig,
      options: { disallowedProviders: ['openai'] },
    }),
    (err) => err instanceof RunnerConfigError && /governance gate rejected provider "openai-codex"/.test(err.message),
  );

  // 2. deny 'openai-codex' blocks declared 'openai'
  assert.throws(
    () => resolveAssignmentDispatchPolicy({
      assignment: assignmentOpenAI,
      runnerConfig,
      options: { disallowedProviders: ['openai-codex'] },
    }),
    (err) => err instanceof RunnerConfigError && /governance gate rejected provider "openai-codex"/.test(err.message),
  );

  // 3. deny 'codex' blocks declared 'openai-codex'
  assert.throws(
    () => resolveAssignmentDispatchPolicy({
      assignment: assignmentCodex,
      runnerConfig,
      options: { disallowedProviders: ['codex'] },
    }),
    (err) => err instanceof RunnerConfigError && /governance gate rejected provider "openai-codex"/.test(err.message),
  );
});

// ─── Redirect Gate: OpenAI Family Alias Governance ───────────────────────────

test('read-only redirect gate enforces canonical provider matching for OpenAI family aliases', async () => {
  const tempDir = mkTempDir();
  const workerSource = writeRecordingWorker(tempDir, 'source-worker');
  const workerTarget = writeRecordingWorker(tempDir, 'target-worker');

  const runnerConfig = {
    executor: { command: 'claude', args: [] },
    placementPolicy: {
      readOnlyRedirects: {
        claude: {
          operations: {
            'shape-plan': [{ executor: 'target-openai', crossProvider: true }],
          },
        },
      },
    },
    modelPolicies: {
      claude: { standard: 'claude-3-7-sonnet' },
      openai: { standard: 'gpt-4o' },
      'openai-codex': { standard: 'gpt-4o' },
    },
    executors: {
      claude: {
        command: process.execPath,
        args: [workerSource.scriptPath],
        providerModel: 'claude',
        allowCrossProvider: true,
      },
      'target-openai': {
        command: process.execPath,
        args: [workerTarget.scriptPath],
        providerModel: 'openai',
        allowCrossProvider: true,
      },
    },
  };

  const assignment = buildAssignment({
    work: { id: 'w-redir-openai', status: 'todo', stage: 'planning', domain: 'coding' },
    assignmentId: 'asgn-redir-openai',
    role: 'planner',
    stage: 'planning',
    operation: 'shape-plan',
    policy: { preferExecutor: 'claude' },
    mutation: 'read-only',
  });

  // 1. deny 'openai' blocks redirect target declared 'openai'
  await assert.rejects(
    executeAssignment(assignment, {
      cwd: tempDir,
      repoRoot: tempDir,
      runnerConfig,
      options: { disallowedProviders: ['openai'] },
    }),
    (err) => /governance gate rejected provider "openai-codex"/.test(err.message) && /readOnlyRedirect/.test(err.message),
  );
  assert.equal(fs.existsSync(workerTarget.markerPath), false, 'target worker must not spawn on deny openai');

  // 2. deny 'openai-codex' blocks redirect target declared 'openai'
  await assert.rejects(
    executeAssignment(assignment, {
      cwd: tempDir,
      repoRoot: tempDir,
      runnerConfig,
      options: { disallowedProviders: ['openai-codex'] },
    }),
    (err) => /governance gate rejected provider "openai-codex"/.test(err.message) && /readOnlyRedirect/.test(err.message),
  );
  assert.equal(fs.existsSync(workerTarget.markerPath), false, 'target worker must not spawn on deny openai-codex');

  fs.rmSync(tempDir, { recursive: true, force: true });
});

// ─── Z-AI Family Alias Governance (Direct & Redirect) ────────────────────────

test('governance gates enforce canonical provider matching for Z-AI family aliases across direct and redirect', async () => {
  const tempDir = mkTempDir();
  const workerSource = writeRecordingWorker(tempDir, 'z-source-worker');
  const workerGlm = writeRecordingWorker(tempDir, 'glm-worker');
  const workerZai = writeRecordingWorker(tempDir, 'zai-worker');

  const runnerConfig = {
    executor: { command: 'claude', args: [] },
    placementPolicy: {
      readOnlyRedirects: {
        claude: {
          operations: {
            'shape-plan': [{ executor: 'target-glm', crossProvider: true }],
            'validate-plan': [{ executor: 'target-zai', crossProvider: true }],
          },
        },
      },
    },
    modelPolicies: {
      claude: { standard: 'claude-3-7-sonnet' },
      'z-ai': { standard: 'glm-4.6' },
      glm: { standard: 'glm-4.6' },
    },
    executors: {
      claude: {
        command: process.execPath,
        args: [workerSource.scriptPath],
        providerModel: 'claude',
        allowCrossProvider: true,
      },
      'target-glm': {
        command: process.execPath,
        args: [workerGlm.scriptPath],
        providerModel: 'glm',
        allowCrossProvider: true,
      },
      'target-zai': {
        command: process.execPath,
        args: [workerZai.scriptPath],
        providerModel: 'z-ai',
        allowCrossProvider: true,
      },
    },
  };

  // Direct: deny 'glm' blocks declared 'z-ai'
  const asgnDirectZai = buildAssignment({
    work: { id: 'w-direct-zai', status: 'todo', stage: 'planning', domain: 'coding' },
    assignmentId: 'asgn-direct-zai',
    role: 'planner',
    stage: 'planning',
    operation: 'shape-plan',
    policy: { preferExecutor: 'target-zai' },
  });
  assert.throws(
    () => resolveAssignmentDispatchPolicy({
      assignment: asgnDirectZai,
      runnerConfig,
      options: { disallowedProviders: ['glm'] },
    }),
    (err) => err instanceof RunnerConfigError && /governance gate rejected provider "z-ai"/.test(err.message),
  );

  // Direct: deny 'z-ai' blocks declared 'glm'
  const asgnDirectGlm = buildAssignment({
    work: { id: 'w-direct-glm', status: 'todo', stage: 'planning', domain: 'coding' },
    assignmentId: 'asgn-direct-glm',
    role: 'planner',
    stage: 'planning',
    operation: 'shape-plan',
    policy: { preferExecutor: 'target-glm' },
  });
  assert.throws(
    () => resolveAssignmentDispatchPolicy({
      assignment: asgnDirectGlm,
      runnerConfig,
      options: { disallowedProviders: ['z-ai'] },
    }),
    (err) => err instanceof RunnerConfigError && /governance gate rejected provider "z-ai"/.test(err.message),
  );

  // Redirect: deny 'glm' blocks redirect target declared 'z-ai'
  const asgnRedirZai = buildAssignment({
    work: { id: 'w-redir-zai', status: 'todo', stage: 'planning', domain: 'coding' },
    assignmentId: 'asgn-redir-zai',
    role: 'planner',
    stage: 'planning',
    operation: 'validate-plan',
    policy: { preferExecutor: 'claude' },
    mutation: 'read-only',
  });
  await assert.rejects(
    executeAssignment(asgnRedirZai, {
      cwd: tempDir,
      repoRoot: tempDir,
      runnerConfig,
      options: { disallowedProviders: ['glm'] },
    }),
    (err) => /governance gate rejected provider "z-ai"/.test(err.message) && /readOnlyRedirect/.test(err.message),
  );
  assert.equal(fs.existsSync(workerZai.markerPath), false, 'target z-ai worker must not spawn on deny glm');

  // Redirect: deny 'z-ai' blocks redirect target declared 'glm'
  const asgnRedirGlm = buildAssignment({
    work: { id: 'w-redir-glm', status: 'todo', stage: 'planning', domain: 'coding' },
    assignmentId: 'asgn-redir-glm',
    role: 'planner',
    stage: 'planning',
    operation: 'shape-plan',
    policy: { preferExecutor: 'claude' },
    mutation: 'read-only',
  });
  await assert.rejects(
    executeAssignment(asgnRedirGlm, {
      cwd: tempDir,
      repoRoot: tempDir,
      runnerConfig,
      options: { disallowedProviders: ['z-ai'] },
    }),
    (err) => /governance gate rejected provider "z-ai"/.test(err.message) && /readOnlyRedirect/.test(err.message),
  );
  assert.equal(fs.existsSync(workerGlm.markerPath), false, 'target glm worker must not spawn on deny z-ai');

  fs.rmSync(tempDir, { recursive: true, force: true });
});

// ─── Gemini Family Alias Governance (Direct & Redirect) ──────────────────────

test('governance gates enforce canonical provider matching for Gemini family aliases across direct and redirect', async () => {
  const tempDir = mkTempDir();
  const workerSource = writeRecordingWorker(tempDir, 'gemini-source-worker');
  const workerAgy = writeRecordingWorker(tempDir, 'agy-worker');
  const workerGemini = writeRecordingWorker(tempDir, 'gemini-worker');

  const runnerConfig = {
    executor: { command: 'claude', args: [] },
    placementPolicy: {
      readOnlyRedirects: {
        claude: {
          operations: {
            'shape-plan': [{ executor: 'target-gemini', crossProvider: true }],
            'validate-plan': [{ executor: 'target-agy', crossProvider: true }],
          },
        },
      },
    },
    modelPolicies: {
      claude: { standard: 'claude-3-7-sonnet' },
      gemini: { standard: 'gemini-3.8-flash' },
      agy: { standard: 'gemini-3.8-flash' },
    },
    executors: {
      claude: {
        command: process.execPath,
        args: [workerSource.scriptPath],
        providerModel: 'claude',
        allowCrossProvider: true,
      },
      'target-gemini': {
        command: process.execPath,
        args: [workerGemini.scriptPath],
        providerModel: 'gemini',
        allowCrossProvider: true,
      },
      'target-agy': {
        command: process.execPath,
        args: [workerAgy.scriptPath],
        providerModel: 'agy',
        allowCrossProvider: true,
      },
    },
  };

  // Direct: deny 'agy' blocks declared 'gemini'
  const asgnDirectGemini = buildAssignment({
    work: { id: 'w-direct-gemini', status: 'todo', stage: 'planning', domain: 'coding' },
    assignmentId: 'asgn-direct-gemini',
    role: 'planner',
    stage: 'planning',
    operation: 'shape-plan',
    policy: { preferExecutor: 'target-gemini' },
  });
  assert.throws(
    () => resolveAssignmentDispatchPolicy({
      assignment: asgnDirectGemini,
      runnerConfig,
      options: { disallowedProviders: ['agy'] },
    }),
    (err) => err instanceof RunnerConfigError && /governance gate rejected provider "gemini"/.test(err.message),
  );

  // Direct: deny 'gemini' blocks declared 'agy'
  const asgnDirectAgy = buildAssignment({
    work: { id: 'w-direct-agy', status: 'todo', stage: 'planning', domain: 'coding' },
    assignmentId: 'asgn-direct-agy',
    role: 'planner',
    stage: 'planning',
    operation: 'shape-plan',
    policy: { preferExecutor: 'target-agy' },
  });
  assert.throws(
    () => resolveAssignmentDispatchPolicy({
      assignment: asgnDirectAgy,
      runnerConfig,
      options: { disallowedProviders: ['gemini'] },
    }),
    (err) => err instanceof RunnerConfigError && /governance gate rejected provider "gemini"/.test(err.message),
  );

  // Redirect: deny 'agy' blocks redirect target declared 'gemini'
  const asgnRedirGemini = buildAssignment({
    work: { id: 'w-redir-gemini', status: 'todo', stage: 'planning', domain: 'coding' },
    assignmentId: 'asgn-redir-gemini',
    role: 'planner',
    stage: 'planning',
    operation: 'shape-plan',
    policy: { preferExecutor: 'claude' },
    mutation: 'read-only',
  });
  await assert.rejects(
    executeAssignment(asgnRedirGemini, {
      cwd: tempDir,
      repoRoot: tempDir,
      runnerConfig,
      options: { disallowedProviders: ['agy'] },
    }),
    (err) => /governance gate rejected provider "gemini"/.test(err.message) && /readOnlyRedirect/.test(err.message),
  );
  assert.equal(fs.existsSync(workerGemini.markerPath), false, 'target gemini worker must not spawn on deny agy');

  // Redirect: deny 'gemini' blocks redirect target declared 'agy'
  const asgnRedirAgy = buildAssignment({
    work: { id: 'w-redir-agy', status: 'todo', stage: 'planning', domain: 'coding' },
    assignmentId: 'asgn-redir-agy',
    role: 'planner',
    stage: 'planning',
    operation: 'validate-plan',
    policy: { preferExecutor: 'claude' },
    mutation: 'read-only',
  });
  await assert.rejects(
    executeAssignment(asgnRedirAgy, {
      cwd: tempDir,
      repoRoot: tempDir,
      runnerConfig,
      options: { disallowedProviders: ['gemini'] },
    }),
    (err) => /governance gate rejected provider "gemini"/.test(err.message) && /readOnlyRedirect/.test(err.message),
  );
  assert.equal(fs.existsSync(workerAgy.markerPath), false, 'target agy worker must not spawn on deny gemini');

  fs.rmSync(tempDir, { recursive: true, force: true });
});

// ─── Negative Controls & Invariants ──────────────────────────────────────────

test('governance negative controls: unrelated providers are allowed, disallowedExecutors is independent, and pre-spawn refusal creates no artifacts', async () => {
  const tempDir = mkTempDir();
  const workerSource = writeRecordingWorker(tempDir, 'ctrl-source');
  const workerTarget = writeRecordingWorker(tempDir, 'ctrl-target');

  const runnerConfig = {
    executor: { command: 'claude', args: [] },
    placementPolicy: {
      readOnlyRedirects: {
        claude: {
          operations: {
            'shape-plan': [{ executor: 'target-openai', crossProvider: true }],
          },
        },
      },
    },
    modelPolicies: {
      claude: { standard: 'claude-3-7-sonnet' },
      openai: { standard: 'gpt-4o' },
      'openai-codex': { standard: 'gpt-4o' },
    },
    executors: {
      claude: {
        command: process.execPath,
        args: [workerSource.scriptPath],
        providerModel: 'claude',
        allowCrossProvider: true,
      },
      'target-openai': {
        command: process.execPath,
        args: [workerTarget.scriptPath],
        providerModel: 'openai',
        allowCrossProvider: true,
      },
    },
  };

  // 1. Unrelated provider is NOT blocked
  const asgnUnrelated = buildAssignment({
    work: { id: 'w-unrelated', status: 'todo', stage: 'planning', domain: 'coding' },
    assignmentId: 'asgn-unrelated',
    role: 'planner',
    stage: 'planning',
    operation: 'shape-plan',
    policy: { preferExecutor: 'claude' },
    mutation: 'read-only',
  });
  const unrelatedRes = await executeAssignment(asgnUnrelated, {
    cwd: tempDir,
    repoRoot: tempDir,
    runnerConfig,
    options: { disallowedProviders: ['deepseek'] },
  });
  assert.ok(unrelatedRes);
  assert.equal(fs.existsSync(workerTarget.markerPath), true, 'worker must spawn when unrelated provider is disallowed');

  // Clean marker for next check
  fs.unlinkSync(workerTarget.markerPath);

  // 2. disallowedExecutors functions independently
  const asgnExecBlock = buildAssignment({
    work: { id: 'w-exec-block', status: 'todo', stage: 'planning', domain: 'coding' },
    assignmentId: 'asgn-exec-block',
    role: 'planner',
    stage: 'planning',
    operation: 'shape-plan',
    policy: { preferExecutor: 'claude' },
    mutation: 'read-only',
  });
  await assert.rejects(
    executeAssignment(asgnExecBlock, {
      cwd: tempDir,
      repoRoot: tempDir,
      runnerConfig,
      options: { disallowedExecutors: ['target-openai'] },
    }),
    (err) => /governance gate rejected executor "target-openai"/.test(err.message),
  );
  assert.equal(fs.existsSync(workerTarget.markerPath), false, 'target worker must not spawn on disallowedExecutors');

  // 3. Intra-family redirect does NOT require crossProvider: true
  const runnerConfigIntra = {
    placementPolicy: {
      readOnlyRedirects: {
        claude: {
          operations: {
            'shape-plan': ['codex-target'], // crossProvider is false/absent
          },
        },
      },
    },
    modelPolicies: {
      openai: { standard: 'gpt-4o' },
      'openai-codex': { standard: 'gpt-4o' },
    },
    executors: {
      claude: {
        command: process.execPath,
        args: [workerSource.scriptPath],
        providerModel: 'openai',
        allowCrossProvider: true,
      },
      'codex-target': {
        command: process.execPath,
        args: [workerTarget.scriptPath],
        providerModel: 'openai-codex',
        allowCrossProvider: true,
      },
    },
  };
  const asgnIntra = buildAssignment({
    work: { id: 'w-intra', status: 'todo', stage: 'planning', domain: 'coding' },
    assignmentId: 'asgn-intra',
    role: 'planner',
    stage: 'planning',
    operation: 'shape-plan',
    policy: { preferExecutor: 'claude', providerModel: 'openai' },
    mutation: 'read-only',
  });
  const intraRes = await executeAssignment(asgnIntra, {
    cwd: tempDir,
    repoRoot: tempDir,
    runnerConfig: runnerConfigIntra,
  });
  assert.ok(intraRes);
  assert.equal(fs.existsSync(workerTarget.markerPath), true, 'intra-family redirect executes without crossProvider opt-in');

  fs.unlinkSync(workerTarget.markerPath);

  // 4. Cross-family redirect without opt-in fails closed
  const runnerConfigNoOptIn = {
    placementPolicy: {
      readOnlyRedirects: {
        claude: {
          operations: {
            'shape-plan': ['target-openai'], // no crossProvider: true
          },
        },
      },
    },
    modelPolicies: {
      claude: { standard: 'claude-3-7-sonnet' },
      openai: { standard: 'gpt-4o' },
      'openai-codex': { standard: 'gpt-4o' },
    },
    executors: {
      claude: {
        command: process.execPath,
        args: [workerSource.scriptPath],
        providerModel: 'claude',
        allowCrossProvider: true,
      },
      'target-openai': {
        command: process.execPath,
        args: [workerTarget.scriptPath],
        providerModel: 'openai',
        allowCrossProvider: true,
      },
    },
  };
  const asgnNoOptIn = buildAssignment({
    work: { id: 'w-no-opt-in', status: 'todo', stage: 'planning', domain: 'coding' },
    assignmentId: 'asgn-no-opt-in',
    role: 'planner',
    stage: 'planning',
    operation: 'shape-plan',
    policy: { preferExecutor: 'claude' },
    mutation: 'read-only',
  });
  await assert.rejects(
    executeAssignment(asgnNoOptIn, {
      cwd: tempDir,
      repoRoot: tempDir,
      runnerConfig: runnerConfigNoOptIn,
    }),
    (err) => err instanceof RunnerConfigError && err.code === 'redirect.cross-provider-not-permitted',
  );

  // 5. Rejection creates NO run evidence directory
  const asgnPreSpawnDeny = buildAssignment({
    work: { id: 'w-prespawn', status: 'todo', stage: 'planning', domain: 'coding' },
    assignmentId: 'asgn-prespawn-check',
    role: 'planner',
    stage: 'planning',
    operation: 'shape-plan',
    policy: { preferExecutor: 'claude' },
    mutation: 'read-only',
  });
  await assert.rejects(
    executeAssignment(asgnPreSpawnDeny, {
      cwd: tempDir,
      repoRoot: tempDir,
      runnerConfig,
      options: { disallowedProviders: ['openai'] },
    }),
  );
  const runsDir = path.join(tempDir, '.fgos', 'assignments', 'asgn-prespawn-check', 'runs');
  assert.equal(fs.existsSync(runsDir), false, 'runs directory must not exist when governance refuses pre-spawn');

  fs.rmSync(tempDir, { recursive: true, force: true });
});
