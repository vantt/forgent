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

test('classifyRunEvidence classifies evidence confidence ladder correctly per Step 01 §11 & Step 03 §5.1', () => {
  // 1. failed on nonzero exit
  const failRes = classifyRunEvidence({ exitCode: 1 });
  assert.deepEqual(failRes, { status: 'failed', confidence: 'failed' });

  // 2. failed on timeout
  const timeoutRes = classifyRunEvidence({ isTimeout: true });
  assert.deepEqual(timeoutRes, { status: 'failed', confidence: 'failed' });

  // 3. failed when explicit agentClaim says failed
  const claimFailRes = classifyRunEvidence({
    exitCode: 0,
    agentClaim: { status: 'failed' },
  });
  assert.deepEqual(claimFailRes, { status: 'failed', confidence: 'failed' });

  // 4. verified when agentClaim done + external evidence (such as git delta)
  const verifiedRes = classifyRunEvidence({
    exitCode: 0,
    agentClaim: { status: 'done' },
    changedFiles: ['src/state/store.mjs'],
    workerArtifacts: ['runs/01/agent-report.md'],
    isReadOnlyOperation: false,
  });
  assert.deepEqual(verifiedRes, { status: 'done', confidence: 'verified' });

  // 5. reported for read-only consult/review with structured claim + worker-produced report artifact
  const reportedRes = classifyRunEvidence({
    exitCode: 0,
    agentClaim: { status: 'done' },
    workerArtifacts: ['runs/01/agent-report.md'],
    isReadOnlyOperation: true,
  });
  assert.deepEqual(reportedRes, { status: 'done', confidence: 'reported' });

  // 6. inferred when external evidence exists without structured claim
  const inferredRes = classifyRunEvidence({
    exitCode: 0,
    agentClaim: null,
    changedFiles: ['src/index.js'],
  });
  assert.deepEqual(inferredRes, { status: 'done', confidence: 'inferred' });

  // 7. no-evidence when process exits zero with NO worker report and NO external proof (P1 guard: zero exit alone is never success)
  const noEvReadOnly = classifyRunEvidence({
    exitCode: 0,
    agentClaim: null,
    workerArtifacts: [],
    changedFiles: [],
    isReadOnlyOperation: true,
  });
  assert.deepEqual(noEvReadOnly, { status: 'no-evidence', confidence: 'no-evidence' });

  const noEvMutating = classifyRunEvidence({
    exitCode: 0,
    agentClaim: null,
    workerArtifacts: [],
    changedFiles: [],
    isReadOnlyOperation: false,
  });
  assert.deepEqual(noEvMutating, { status: 'no-evidence', confidence: 'no-evidence' });
});

test('executeAssignment produces status: done and confidence: reported when worker produces agent-report.md artifact', async () => {
  const tempDir = mkTempDir();

  const executorScript = path.join(tempDir, 'reporter-executor.mjs');
  fs.writeFileSync(
    executorScript,
    `
    import fs from 'node:fs';
    import path from 'node:path';
    const cwd = process.cwd();
    // Simulate worker writing report to runs/01/agent-report.md
    const runsDir = path.join(cwd, '.fgos', 'assignments');
    if (fs.existsSync(runsDir)) {
      const asgnDirs = fs.readdirSync(runsDir);
      for (const asgn of asgnDirs) {
        const runDir = path.join(runsDir, asgn, 'runs', '01');
        if (fs.existsSync(runDir)) {
          fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Validation Report\\nPlan is sound.\\n');
          fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'Plan sound' }));
        }
      }
    }
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

  assert.equal(result.assignmentId, assignment.assignmentId);
  assert.equal(result.status, 'done');
  assert.equal(result.confidence, 'reported');
  assert.equal(result.agentClaim.status, 'done');

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
  assert.equal(storedResult.confidence, 'reported');
});

test('executeAssignment produces status: no-evidence when executor exits zero without producing report artifacts', async () => {
  const tempDir = mkTempDir();

  const executorScript = path.join(tempDir, 'silent-zero-executor.mjs');
  fs.writeFileSync(
    executorScript,
    `
    process.stdout.write("Narration only, no artifacts created.\\n");
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
    workId: 'tsk-no-ev-test',
    stage: 'planning',
    operation: 'validate-plan',
  });

  const result = await executeAssignment(assignment, {
    cwd: tempDir,
    repoRoot: tempDir,
    runnerConfig,
  });

  // Must not mark success only because process exited zero!
  assert.equal(result.status, 'no-evidence');
  assert.equal(result.confidence, 'no-evidence');
  assert.equal(result.runtime.exitCode, 0);
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
