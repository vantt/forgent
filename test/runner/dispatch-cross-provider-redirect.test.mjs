// test/runner/dispatch-cross-provider-redirect.test.mjs — R6 cross-provider redirect contract tests
// (Phase 05 / Unit I06 governance hardening).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import {
  RunnerConfigError,
  normalizePreferCandidates,
} from '../../src/runner/dispatch/config.mjs';
import {
  readOnlyRedirectPool,
  readOnlyRedirectEntryFor,
  readOnlyRedirectInvocationFor,
} from '../../src/runner/dispatch/placement-policy.mjs';
import { executeAssignment } from '../../src/runner/dispatch/assignment-runner.mjs';
import { buildAssignment } from '../../src/runner/dispatch/assignment.mjs';

function mkTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-cross-provider-redirect-test-'));
}

function writeRecordingWorker(tempDir, name) {
  const scriptPath = path.join(tempDir, `${name}-worker.mjs`);
  const capturePath = path.join(tempDir, `${name}-argv.json`);
  fs.writeFileSync(
    scriptPath,
    `
    import fs from 'node:fs';
    import path from 'node:path';
    fs.writeFileSync(${JSON.stringify(capturePath)}, JSON.stringify(process.argv.slice(2)));
    const prompt = process.argv.slice(2).join(' ');
    const match = /Write structured JSON to (\\S+agent-result\\.json)/.exec(prompt);
    if (match) {
      const runDir = path.dirname(match[1]);
      fs.mkdirSync(runDir, { recursive: true });
      fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Report\\nAssignment execution completed successfully with substantive content.\\n');
      fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ status: 'done', summary: '${name} completed successfully' }));
    }
    process.exit(0);
    `,
  );
  return { scriptPath, capturePath };
}

function buildBaseRunnerConfig(tempDir, { worker, reviewer, codex, redirectPool, allowCrossProvider = true } = {}) {
  return {
    placementPolicy: {
      readOnlyRedirects: {
        claude: {
          operations: {
            'shape-plan': redirectPool,
          },
        },
      },
    },
    executors: {
      claude: {
        command: process.execPath,
        args: [worker.scriptPath, '{prompt}', '--model', '{model}'],
        providerModel: 'claude',
        allowCrossProvider: true,
      },
      'claude-reviewer': {
        command: process.execPath,
        args: [reviewer.scriptPath, '{prompt}', '--model', '{model}'],
        providerModel: 'claude',
        allowCrossProvider: true,
      },
      'codex-bwrap': {
        command: process.execPath,
        args: [codex.scriptPath, '{prompt}', '--model', '{model}'],
        providerModel: 'openai-codex',
        allowCrossProvider,
      },
    },
    modelPolicies: {
      claude: {
        standard: 'claude-3-5-sonnet',
      },
      'openai-codex': {
        standard: 'gpt-4o',
      },
    },
  };
}

// ─── 1. Schema & Normalization Tests ──────────────────────────────────────────

test('R6 schema: normalizePreferCandidates accepts string, object with invocation, and object with crossProvider', () => {
  assert.deepEqual(normalizePreferCandidates('codex-bwrap', 'test'), [
    { executor: 'codex-bwrap', invocation: undefined },
  ]);

  assert.deepEqual(
    normalizePreferCandidates([{ executor: 'codex-bwrap', crossProvider: true }], 'test'),
    [{ executor: 'codex-bwrap', invocation: undefined, crossProvider: true }],
  );

  assert.deepEqual(
    normalizePreferCandidates([{ executor: 'codex-bwrap', crossProvider: false }], 'test'),
    [{ executor: 'codex-bwrap', invocation: undefined, crossProvider: false }],
  );

  assert.deepEqual(
    normalizePreferCandidates([{ executor: 'codex-bwrap', invocation: 'bwrap-1' }], 'test'),
    [{ executor: 'codex-bwrap', invocation: 'bwrap-1' }],
  );
});

test('R6 schema: normalizePreferCandidates rejects non-boolean crossProvider and unknown keys', () => {
  assert.throws(
    () => normalizePreferCandidates([{ executor: 'codex-bwrap', crossProvider: 'true' }], 'test'),
    (err) => err instanceof RunnerConfigError && /"crossProvider" must be a boolean when present/.test(err.message),
  );

  assert.throws(
    () => normalizePreferCandidates([{ executor: 'codex-bwrap', crossProvider: 1 }], 'test'),
    (err) => err instanceof RunnerConfigError && /"crossProvider" must be a boolean when present/.test(err.message),
  );

  assert.throws(
    () => normalizePreferCandidates([{ executor: 'codex-bwrap', unauthorizedKey: true }], 'test'),
    (err) => err instanceof RunnerConfigError && /contains unknown key "unauthorizedKey"/.test(err.message),
  );
});

// ─── 2. PlacementPolicy Helper Tests ──────────────────────────────────────────

test('R6 helpers: readOnlyRedirectEntryFor resolves normalized descriptor with crossProvider', () => {
  const cfg = {
    placementPolicy: {
      readOnlyRedirects: {
        claude: {
          default: ['claude-reviewer'],
          operations: {
            'shape-plan': [
              { executor: 'codex-bwrap', invocation: 'cli-bwrap', crossProvider: true },
              'fallback-same-provider',
            ],
          },
        },
      },
    },
  };

  const entry1 = readOnlyRedirectEntryFor(cfg, 'claude', 'shape-plan', 'codex-bwrap');
  assert.deepEqual(entry1, {
    executor: 'codex-bwrap',
    invocation: 'cli-bwrap',
    crossProvider: true,
  });

  const entry2 = readOnlyRedirectEntryFor(cfg, 'claude', 'shape-plan', 'fallback-same-provider');
  assert.deepEqual(entry2, {
    executor: 'fallback-same-provider',
    invocation: undefined,
    crossProvider: false,
  });

  const missing = readOnlyRedirectEntryFor(cfg, 'claude', 'shape-plan', 'unknown-executor');
  assert.equal(missing, null);
});

// ─── 3. Cross-Provider Refusal vs Opt-In ───────────────────────────────────────

test('R6 governance: cross-provider redirect without crossProvider: true throws typed refusal redirect.cross-provider-not-permitted', async () => {
  const tempDir = mkTempDir();
  const worker = writeRecordingWorker(tempDir, 'worker');
  const reviewer = writeRecordingWorker(tempDir, 'reviewer');
  const codex = writeRecordingWorker(tempDir, 'codex');

  const runnerConfig = buildBaseRunnerConfig(tempDir, {
    worker,
    reviewer,
    codex,
    redirectPool: ['codex-bwrap'], // No crossProvider: true!
  });

  const work = { id: 'tsk-cross-provider-refusal', status: 'todo', stage: 'planning', domain: 'coding' };
  const assignment = buildAssignment({ work, stage: 'planning', operation: 'shape-plan' });

  await assert.rejects(
    executeAssignment(assignment, { cwd: tempDir, repoRoot: tempDir, runnerConfig }),
    (err) => {
      assert.ok(err instanceof RunnerConfigError);
      assert.equal(err.code, 'redirect.cross-provider-not-permitted');
      assert.ok(err.message.includes('crosses provider family without explicit opt-in'));
      return true;
    },
  );

  assert.equal(fs.existsSync(codex.capturePath), false, 'target worker must never spawn on refusal');
});

test('R6 governance: cross-provider redirect with crossProvider: true succeeds, recomputes model, and records full provenance', async () => {
  const tempDir = mkTempDir();
  const worker = writeRecordingWorker(tempDir, 'worker');
  const reviewer = writeRecordingWorker(tempDir, 'reviewer');
  const codex = writeRecordingWorker(tempDir, 'codex');

  const runnerConfig = buildBaseRunnerConfig(tempDir, {
    worker,
    reviewer,
    codex,
    redirectPool: [{ executor: 'codex-bwrap', crossProvider: true }],
  });

  const work = { id: 'tsk-cross-provider-optin', status: 'todo', stage: 'planning', domain: 'coding' };
  const assignment = buildAssignment({ work, stage: 'planning', operation: 'shape-plan' });

  const result = await executeAssignment(assignment, { cwd: tempDir, repoRoot: tempDir, runnerConfig });

  assert.equal(result.status, 'done');
  assert.equal(result.executorId, 'codex-bwrap');
  assert.equal(result.executorRedirected, true);
  assert.equal(result.policy.providerModel, 'openai-codex');
  assert.equal(result.policy.model, 'gpt-4o');

  // Verify persisted provenance in dispatch-plan.json
  const runDir = path.join(tempDir, '.fgos', 'assignments', assignment.assignmentId, 'runs', '01');
  const planPath = path.join(runDir, 'dispatch-plan.json');
  assert.ok(fs.existsSync(planPath), 'dispatch-plan.json must exist');

  const dispatchPlan = JSON.parse(fs.readFileSync(planPath, 'utf8'));
  assert.ok(dispatchPlan.redirectDecision, 'redirectDecision must be persisted');
  assert.deepEqual(dispatchPlan.redirectDecision, {
    sourceExecutorId: 'claude',
    sourceProvider: 'claude',
    pool: ['codex-bwrap'],
    seed: `shape-plan:${assignment.assignmentId}`,
    chosen: 'codex-bwrap',
    selectedProvider: 'openai-codex',
    invocation: null,
    crossProvider: true,
  });
});

test('R6 compatibility: same-provider redirect succeeds without crossProvider: true', async () => {
  const tempDir = mkTempDir();
  const worker = writeRecordingWorker(tempDir, 'worker');
  const reviewer = writeRecordingWorker(tempDir, 'reviewer');
  const codex = writeRecordingWorker(tempDir, 'codex');

  const runnerConfig = buildBaseRunnerConfig(tempDir, {
    worker,
    reviewer,
    codex,
    redirectPool: ['claude-reviewer'], // Same provider (claude)
  });

  const work = { id: 'tsk-same-provider-compat', status: 'todo', stage: 'planning', domain: 'coding' };
  const assignment = buildAssignment({ work, stage: 'planning', operation: 'shape-plan' });

  const result = await executeAssignment(assignment, { cwd: tempDir, repoRoot: tempDir, runnerConfig });

  assert.equal(result.status, 'done');
  assert.equal(result.executorId, 'claude-reviewer');
  assert.equal(result.executorRedirected, true);
  assert.equal(result.policy.providerModel, 'claude');
  assert.equal(result.policy.model, 'claude-3-5-sonnet');
});

// ─── 4. Invariants & Policy Enforcement ───────────────────────────────────────

test('R6 invariant: crossProvider: true does NOT bypass disallowedProviders governance', async () => {
  const tempDir = mkTempDir();
  const worker = writeRecordingWorker(tempDir, 'worker');
  const reviewer = writeRecordingWorker(tempDir, 'reviewer');
  const codex = writeRecordingWorker(tempDir, 'codex');

  const runnerConfig = buildBaseRunnerConfig(tempDir, {
    worker,
    reviewer,
    codex,
    redirectPool: [{ executor: 'codex-bwrap', crossProvider: true }],
  });

  const work = { id: 'tsk-disallowed-provider', status: 'todo', stage: 'planning', domain: 'coding' };
  const assignment = buildAssignment({ work, stage: 'planning', operation: 'shape-plan' });

  await assert.rejects(
    executeAssignment(assignment, {
      cwd: tempDir,
      repoRoot: tempDir,
      runnerConfig,
      options: { disallowedProviders: ['openai-codex'] },
    }),
    (err) => /governance gate rejected provider "openai-codex"/.test(err.message),
  );
});

test('R6 invariant: crossProvider: true does NOT bypass disallowedExecutors governance', async () => {
  const tempDir = mkTempDir();
  const worker = writeRecordingWorker(tempDir, 'worker');
  const reviewer = writeRecordingWorker(tempDir, 'reviewer');
  const codex = writeRecordingWorker(tempDir, 'codex');

  const runnerConfig = buildBaseRunnerConfig(tempDir, {
    worker,
    reviewer,
    codex,
    redirectPool: [{ executor: 'codex-bwrap', crossProvider: true }],
  });

  const work = { id: 'tsk-disallowed-executor', status: 'todo', stage: 'planning', domain: 'coding' };
  const assignment = buildAssignment({ work, stage: 'planning', operation: 'shape-plan' });

  await assert.rejects(
    executeAssignment(assignment, {
      cwd: tempDir,
      repoRoot: tempDir,
      runnerConfig,
      options: { disallowedExecutors: ['codex-bwrap'] },
    }),
    (err) => /governance gate rejected executor "codex-bwrap"/.test(err.message),
  );
});

test('R6 invariant: crossProvider: true does NOT bypass allowCrossProvider egress check on target executor', async () => {
  const tempDir = mkTempDir();
  const worker = writeRecordingWorker(tempDir, 'worker');
  const reviewer = writeRecordingWorker(tempDir, 'reviewer');
  const codex = writeRecordingWorker(tempDir, 'codex');

  const runnerConfig = buildBaseRunnerConfig(tempDir, {
    worker,
    reviewer,
    codex,
    redirectPool: [{ executor: 'codex-bwrap', crossProvider: true }],
    allowCrossProvider: false, // Target does not permit egress!
  });

  const work = { id: 'tsk-egress-check', status: 'todo', stage: 'planning', domain: 'coding' };
  const assignment = buildAssignment({ work, stage: 'planning', operation: 'shape-plan' });

  await assert.rejects(
    executeAssignment(assignment, { cwd: tempDir, repoRoot: tempDir, runnerConfig }),
    (err) => /resolves to cross-provider redirect target without allowCrossProvider: true/.test(err.message),
  );
});

// ─── 5. Refusal for Empty / Unknown Pool Entries ───────────────────────────────

test('R6 failure mode: explicitly configured empty pool fails with typed refusal redirect.empty-pool', async () => {
  const tempDir = mkTempDir();
  const worker = writeRecordingWorker(tempDir, 'worker');
  const reviewer = writeRecordingWorker(tempDir, 'reviewer');
  const codex = writeRecordingWorker(tempDir, 'codex');

  const runnerConfig = buildBaseRunnerConfig(tempDir, {
    worker,
    reviewer,
    codex,
    redirectPool: [], // Explicitly empty pool
  });

  const work = { id: 'tsk-empty-pool', status: 'todo', stage: 'planning', domain: 'coding' };
  const assignment = buildAssignment({ work, stage: 'planning', operation: 'shape-plan' });

  await assert.rejects(
    executeAssignment(assignment, { cwd: tempDir, repoRoot: tempDir, runnerConfig }),
    (err) => {
      assert.ok(err instanceof RunnerConfigError);
      assert.equal(err.code, 'redirect.empty-pool');
      return true;
    },
  );
});

test('R6 failure mode: configured pool referencing unknown executor fails with typed refusal redirect.unknown-executor', async () => {
  const tempDir = mkTempDir();
  const worker = writeRecordingWorker(tempDir, 'worker');
  const reviewer = writeRecordingWorker(tempDir, 'reviewer');
  const codex = writeRecordingWorker(tempDir, 'codex');

  const runnerConfig = buildBaseRunnerConfig(tempDir, {
    worker,
    reviewer,
    codex,
    redirectPool: ['non-existent-executor-id'],
  });

  const work = { id: 'tsk-unknown-executor', status: 'todo', stage: 'planning', domain: 'coding' };
  const assignment = buildAssignment({ work, stage: 'planning', operation: 'shape-plan' });

  await assert.rejects(
    executeAssignment(assignment, { cwd: tempDir, repoRoot: tempDir, runnerConfig }),
    (err) => {
      assert.ok(err instanceof RunnerConfigError);
      assert.equal(err.code, 'redirect.unknown-executor');
      assert.ok(err.message.includes('non-existent-executor-id'));
      return true;
    },
  );
});
