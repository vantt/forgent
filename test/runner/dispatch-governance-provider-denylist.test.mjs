// test/runner/dispatch-governance-provider-denylist.test.mjs
// Verifies canonical provider family governance across the direct resolution and execution-door gates.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { executeAssignment } from '../../src/runner/dispatch/assignment-runner.mjs';
import { resolveAssignmentDispatchPolicy } from '../../src/runner/dispatch/assignment-policy.mjs';
import { buildAssignment } from '../helpers/declared-assignment.mjs';
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

// ─── Execution door: governance refuses before any worker spawns ─────────────
// The read-only redirect mechanism is retired; the executor an Assignment runs
// on is now the one it declares (or that bind() selected), so the family
// matching below is exercised through executeAssignment itself.

const DOOR_FAMILY_CASES = [
  { name: 'OpenAI (declared openai, deny openai-codex)', providerModel: 'openai', deny: ['openai-codex'], canonical: 'openai-codex' },
  { name: 'OpenAI (declared openai-codex, deny codex)', providerModel: 'openai-codex', deny: ['codex'], canonical: 'openai-codex' },
  { name: 'Z-AI (declared z-ai, deny glm)', providerModel: 'z-ai', deny: ['glm'], canonical: 'z-ai' },
  { name: 'Z-AI (declared glm, deny z-ai)', providerModel: 'glm', deny: ['z-ai'], canonical: 'z-ai' },
  { name: 'Gemini (declared gemini, deny agy)', providerModel: 'gemini', deny: ['agy'], canonical: 'gemini' },
  { name: 'Gemini (declared agy, deny gemini)', providerModel: 'agy', deny: ['gemini'], canonical: 'gemini' },
];

for (const c of DOOR_FAMILY_CASES) {
  test(`executeAssignment refuses before spawn on canonical family match: ${c.name}`, async () => {
    const tempDir = mkTempDir();
    const worker = writeRecordingWorker(tempDir, 'door-worker');
    const runnerConfig = {
      executor: { command: 'claude', args: [] },
      modelPolicies: { claude: { standard: 'claude-3-7-sonnet' }, [c.providerModel]: { standard: 'door-model' } },
      executors: {
        'door-target': {
          command: process.execPath,
          args: [worker.scriptPath],
          providerModel: c.providerModel,
          allowCrossProvider: true,
        },
      },
    };
    const asgnId = 'asgn-door-' + c.providerModel + '-' + c.deny[0];
    const assignment = buildAssignment({
      work: { id: 'w-door', status: 'todo', domain: 'coding' },
      assignmentId: asgnId,
      role: 'planner',
      stage: 'planning',
      operation: 'shape-plan',
      policy: { preferExecutor: 'door-target' },
      mutation: 'read-only',
    });
    await assert.rejects(
      executeAssignment(assignment, {
        cwd: tempDir,
        repoRoot: tempDir,
        runnerConfig,
        options: { disallowedProviders: c.deny },
      }),
      (err) => err instanceof RunnerConfigError
        && new RegExp(`governance gate rejected provider "${c.canonical}"`).test(err.message),
    );
    assert.equal(fs.existsSync(worker.markerPath), false, 'worker must not spawn when governance refuses');
    assert.equal(
      fs.existsSync(path.join(tempDir, '.fgos', 'assignments', asgnId, 'runs')),
      false,
      'runs directory must not exist when governance refuses pre-spawn',
    );
    fs.rmSync(tempDir, { recursive: true, force: true });
  });
}


// ─── Z-AI Family Alias Governance (Direct & Redirect) ────────────────────────

test('governance gates enforce canonical provider matching for Z-AI family aliases (direct gate)', async () => {
  const tempDir = mkTempDir();
  const workerSource = writeRecordingWorker(tempDir, 'z-source-worker');
  const workerGlm = writeRecordingWorker(tempDir, 'glm-worker');
  const workerZai = writeRecordingWorker(tempDir, 'zai-worker');

  const runnerConfig = {
    executor: { command: 'claude', args: [] },
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


  fs.rmSync(tempDir, { recursive: true, force: true });
});

// ─── Gemini Family Alias Governance (Direct & Redirect) ──────────────────────

test('governance gates enforce canonical provider matching for Gemini family aliases (direct gate)', async () => {
  const tempDir = mkTempDir();
  const workerSource = writeRecordingWorker(tempDir, 'gemini-source-worker');
  const workerAgy = writeRecordingWorker(tempDir, 'agy-worker');
  const workerGemini = writeRecordingWorker(tempDir, 'gemini-worker');

  const runnerConfig = {
    executor: { command: 'claude', args: [] },
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


  fs.rmSync(tempDir, { recursive: true, force: true });
});

// ─── Negative Controls & Invariants ──────────────────────────────────────────

test('governance negative controls: unrelated providers are allowed, disallowedExecutors is independent, cross-provider needs opt-in', async () => {
  const tempDir = mkTempDir();
  const workerOpenai = writeRecordingWorker(tempDir, 'ctrl-openai');

  const baseExecutors = {
    'target-openai': {
      command: process.execPath,
      args: [workerOpenai.scriptPath],
      providerModel: 'openai',
      allowCrossProvider: true,
    },
  };
  const runnerConfig = {
    executor: { command: 'claude', args: [] },
    modelPolicies: {
      claude: { standard: 'claude-3-7-sonnet' },
      openai: { standard: 'gpt-4o' },
      'openai-codex': { standard: 'gpt-4o' },
    },
    executors: baseExecutors,
  };
  const make = (id, executor) => buildAssignment({
    work: { id: 'w-' + id, status: 'todo', domain: 'coding' },
    assignmentId: 'asgn-' + id,
    role: 'planner',
    stage: 'planning',
    operation: 'shape-plan',
    policy: { preferExecutor: executor },
    mutation: 'read-only',
  });

  // 1. Unrelated provider is NOT blocked
  const unrelatedRes = await executeAssignment(make('unrelated', 'target-openai'), {
    cwd: tempDir,
    repoRoot: tempDir,
    runnerConfig,
    options: { disallowedProviders: ['deepseek'] },
  });
  assert.ok(unrelatedRes);
  assert.equal(fs.existsSync(workerOpenai.markerPath), true, 'worker must spawn when unrelated provider is disallowed');
  fs.unlinkSync(workerOpenai.markerPath);

  // 2. disallowedExecutors functions independently of disallowedProviders
  await assert.rejects(
    executeAssignment(make('exec-block', 'target-openai'), {
      cwd: tempDir,
      repoRoot: tempDir,
      runnerConfig,
      options: { disallowedExecutors: ['target-openai'] },
    }),
    (err) => /governance gate rejected executor "target-openai"/.test(err.message),
  );
  assert.equal(fs.existsSync(workerOpenai.markerPath), false, 'worker must not spawn on disallowedExecutors');

  // 3. Cross-provider egress without allowCrossProvider fails closed before spawn
  const noOptIn = {
    ...runnerConfig,
    executors: { 'target-openai': { ...baseExecutors['target-openai'], allowCrossProvider: false } },
  };
  await assert.rejects(
    executeAssignment(make('no-opt-in', 'target-openai'), { cwd: tempDir, repoRoot: tempDir, runnerConfig: noOptIn }),
    (err) => err instanceof RunnerConfigError && /cross-provider egress target/.test(err.message) && /allowCrossProvider/.test(err.message),
  );
  assert.equal(fs.existsSync(workerOpenai.markerPath), false, 'worker must not spawn without cross-provider opt-in');

  fs.rmSync(tempDir, { recursive: true, force: true });
});
