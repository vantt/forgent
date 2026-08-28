import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { buildAssignment } from '../../src/runner/dispatch/assignment.mjs';
import {
  executeAssignment,
  classifyRunEvidence,
} from '../../src/runner/dispatch/assignment-runner.mjs';

function mkTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-asgn-runresult-test-'));
}

test('classifyRunEvidence classifies evidence confidence ladder correctly', () => {
  // 1. failed on nonzero exit
  const failRes = classifyRunEvidence({ exitCode: 1 });
  assert.deepEqual(failRes, { status: 'failed', confidence: 'failed' });

  // 2. failed on timeout
  const timeoutRes = classifyRunEvidence({ isTimeout: true });
  assert.deepEqual(timeoutRes, { status: 'failed', confidence: 'failed' });

  // 3. verified when agentClaim done + workerArtifacts present
  const verifiedRes = classifyRunEvidence({
    exitCode: 0,
    agentClaim: { status: 'done' },
    workerArtifacts: ['runs/01/agent-report.md'],
    isReadOnlyOperation: true,
  });
  assert.deepEqual(verifiedRes, { status: 'done', confidence: 'verified' });

  // 4. reported for read-only consult/review with structured claim
  const reportedRes = classifyRunEvidence({
    exitCode: 0,
    agentClaim: { status: 'done' },
    isReadOnlyOperation: true,
  });
  assert.deepEqual(reportedRes, { status: 'done', confidence: 'reported' });

  // 5. inferred when external evidence exists without structured claim
  const inferredRes = classifyRunEvidence({
    exitCode: 0,
    agentClaim: null,
    changedFiles: ['src/index.js'],
  });
  assert.deepEqual(inferredRes, { status: 'done', confidence: 'inferred' });

  // 6. no-evidence when zero exit but no artifacts/claim on mutating work
  const noEvRes = classifyRunEvidence({
    exitCode: 0,
    agentClaim: null,
    workerArtifacts: [],
    changedFiles: [],
    isReadOnlyOperation: false,
  });
  assert.deepEqual(noEvRes, { status: 'no-evidence', confidence: 'no-evidence' });
});

test('executeAssignment persists storage layout: assignment.json, run.json, stdout.log, stderr.log, exit.json, evidence.json, result.json', async () => {
  const tempDir = mkTempDir();

  const executorScript = path.join(tempDir, 'reporter-executor.mjs');
  fs.writeFileSync(
    executorScript,
    `
    import fs from 'node:fs';
    import path from 'node:path';
    process.stdout.write("Validation completed.\\n");
    process.exit(0);
    `,
  );

  const runnerConfig = {
    executor: {
      command: process.execPath,
      args: [executorScript, '{prompt}'],
    },
    models: { standard: 'test-model' },
    timeoutMs: 5000,
  };

  const assignment = buildAssignment({
    workId: 'tsk-store-test',
    stage: 'planning',
    operation: 'validate-plan',
  });

  const result = await executeAssignment(assignment, {
    cwd: tempDir,
    repoRoot: tempDir,
    runnerConfig,
  });

  const assignmentDir = path.join(tempDir, '.fgos', 'assignments', assignment.assignmentId);
  assert.ok(fs.existsSync(path.join(assignmentDir, 'assignment.json')));

  const runDir = path.join(assignmentDir, 'runs', '01');
  assert.ok(fs.existsSync(path.join(runDir, 'run.json')));
  assert.ok(fs.existsSync(path.join(runDir, 'stdout.log')));
  assert.ok(fs.existsSync(path.join(runDir, 'stderr.log')));
  assert.ok(fs.existsSync(path.join(runDir, 'exit.json')));
  assert.ok(fs.existsSync(path.join(runDir, 'evidence.json')));
  assert.ok(fs.existsSync(path.join(runDir, 'result.json')));

  const exitData = JSON.parse(fs.readFileSync(path.join(runDir, 'exit.json'), 'utf8'));
  assert.equal(exitData.exitCode, 0);

  const storedResult = JSON.parse(fs.readFileSync(path.join(runDir, 'result.json'), 'utf8'));
  assert.equal(storedResult.runId, 'run_' + assignment.assignmentId + '_01');
  assert.equal(storedResult.status, 'done');
});

test('failure still writes all storage files including exit.json, evidence.json, and result.json', async () => {
  const tempDir = mkTempDir();

  const executorScript = path.join(tempDir, 'fail-script.mjs');
  fs.writeFileSync(
    executorScript,
    `
    process.stderr.write("Fatal error in assignment\\n");
    process.exit(3);
    `,
  );

  const runnerConfig = {
    executor: {
      command: process.execPath,
      args: [executorScript, '{prompt}'],
    },
    models: { standard: 'test-model' },
    timeoutMs: 5000,
  };

  const assignment = buildAssignment({
    workId: 'tsk-store-fail-test',
    stage: 'planning',
    operation: 'validate-plan',
  });

  const result = await executeAssignment(assignment, {
    cwd: tempDir,
    repoRoot: tempDir,
    runnerConfig,
  });

  assert.equal(result.status, 'failed');
  assert.equal(result.confidence, 'failed');

  const runDir = path.join(tempDir, '.fgos', 'assignments', assignment.assignmentId, 'runs', '01');
  assert.ok(fs.existsSync(path.join(runDir, 'run.json')));
  assert.ok(fs.existsSync(path.join(runDir, 'stdout.log')));
  assert.ok(fs.existsSync(path.join(runDir, 'stderr.log')));
  assert.ok(fs.existsSync(path.join(runDir, 'exit.json')));
  assert.ok(fs.existsSync(path.join(runDir, 'evidence.json')));
  assert.ok(fs.existsSync(path.join(runDir, 'result.json')));

  const exitData = JSON.parse(fs.readFileSync(path.join(runDir, 'exit.json'), 'utf8'));
  assert.equal(exitData.exitCode, 3);
});
