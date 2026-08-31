import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
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

  // 6. inferred when external evidence exists without structured claim for mutating operations
  const inferredRes = classifyRunEvidence({
    exitCode: 0,
    agentClaim: null,
    changedFiles: ['src/index.js'],
    isReadOnlyOperation: false,
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
      allowCrossProvider: true,
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
      allowCrossProvider: true,
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
      allowCrossProvider: true,
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

test('mutating assignment with uncommitted modified file captures real changedFiles and classifies as verified/inferred', async () => {
  const tempDir = mkTempDir();

  // Initialize a real git repo in tempDir
  execFileSync('git', ['init'], { cwd: tempDir, stdio: 'ignore' });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: tempDir, stdio: 'ignore' });
  execFileSync('git', ['config', 'user.name', 'Tester'], { cwd: tempDir, stdio: 'ignore' });
  fs.writeFileSync(path.join(tempDir, 'tracked.txt'), 'initial content\n');
  execFileSync('git', ['add', '.'], { cwd: tempDir, stdio: 'ignore' });
  execFileSync('git', ['commit', '-m', 'initial'], { cwd: tempDir, stdio: 'ignore' });

  // Worker script that modifies tracked.txt without committing
  const executorScript = path.join(tempDir, 'mutator-executor.mjs');
  fs.writeFileSync(
    executorScript,
    `
    import fs from 'node:fs';
    import path from 'node:path';
    fs.writeFileSync(path.join(process.cwd(), 'tracked.txt'), 'modified content\\n');
    fs.writeFileSync(path.join(process.cwd(), 'new-file.txt'), 'new file\\n');
    process.stdout.write("Code modified.\\n");
    process.exit(0);
    `,
  );

  const runnerConfig = {
    executors: {
      claude: {
        kind: 'agent',
        command: process.execPath,
        args: [executorScript, '{prompt}'],
        allowCrossProvider: true,
      },
    },
    modelPolicies: {
      claude: { standard: 'test-model' },
    },
    timeoutMs: 5000,
  };

  const assignment = buildAssignment({
    workId: 'tsk-mutate-test',
    stage: 'executing',
    operation: 'implement-item',
  });

  const result = await executeAssignment(assignment, {
    cwd: tempDir,
    repoRoot: tempDir,
    runnerConfig,
  });

  assert.equal(result.status, 'done');
  assert.equal(result.confidence, 'inferred');
  assert.ok(result.evidence.changedFiles.includes('tracked.txt'));
  assert.ok(result.evidence.changedFiles.includes('new-file.txt'));
});

test('executeAssignment allocates next run attempt monotonically when gaps exist in runs directory', async () => {
  const tempDir = mkTempDir();

  const executorScript = path.join(tempDir, 'echo.mjs');
  fs.writeFileSync(executorScript, 'process.exit(0);');

  const runnerConfig = {
    executor: {
      allowCrossProvider: true,
      command: process.execPath,
      args: [executorScript, '{prompt}'],
    },
    models: { standard: 'test-model' },
    timeoutMs: 5000,
  };

  const assignment = buildAssignment({
    workId: 'tsk-gap-test',
    stage: 'planning',
    operation: 'validate-plan',
  });

  const asgnDir = path.join(tempDir, '.fgos', 'assignments', assignment.assignmentId);
  const runsDir = path.join(asgnDir, 'runs');
  fs.mkdirSync(path.join(runsDir, '01'), { recursive: true });
  fs.mkdirSync(path.join(runsDir, '03'), { recursive: true });
  fs.writeFileSync(path.join(runsDir, '03', 'marker.txt'), 'do not overwrite');

  const result = await executeAssignment(assignment, {
    cwd: tempDir,
    repoRoot: tempDir,
    runnerConfig,
  });

  assert.equal(result.runId, `run_${assignment.assignmentId}_04`);
  assert.ok(fs.existsSync(path.join(runsDir, '04', 'run.json')));
  assert.equal(fs.readFileSync(path.join(runsDir, '03', 'marker.txt'), 'utf8'), 'do not overwrite');
});

test('executeAssignment reads and respects persisted assignment.json as immutable source of truth', async () => {
  const tempDir = mkTempDir();

  const executorScript = path.join(tempDir, 'echo.mjs');
  fs.writeFileSync(executorScript, 'process.exit(0);');

  const runnerConfig = {
    executor: {
      allowCrossProvider: true,
      command: process.execPath,
      args: [executorScript, '{prompt}'],
    },
    models: { standard: 'test-model' },
    timeoutMs: 5000,
  };

  const assignment = buildAssignment({
    workId: 'tsk-persist-truth',
    stage: 'planning',
    operation: 'validate-plan',
    objective: 'Original persisted objective',
  });

  // Pre-write assignment.json to disk
  const asgnDir = path.join(tempDir, '.fgos', 'assignments', assignment.assignmentId);
  fs.mkdirSync(asgnDir, { recursive: true });
  fs.writeFileSync(path.join(asgnDir, 'assignment.json'), JSON.stringify(assignment, null, 2));

  // Modify in-memory assignment object
  const tamperedMemoryAssignment = {
    ...assignment,
    objective: 'Tampered in-memory objective',
  };

  const result2 = await executeAssignment(tamperedMemoryAssignment, {
    cwd: tempDir,
    repoRoot: tempDir,
    runnerConfig,
  });

  assert.ok(fs.existsSync(path.join(asgnDir, 'runs', '01', 'run.json')));
  const storedResult = JSON.parse(fs.readFileSync(path.join(asgnDir, 'runs', '01', 'result.json'), 'utf8'));
  assert.equal(storedResult.assignmentId, assignment.assignmentId);
  void result2; // result is checked via stored file
});

// ─── Step 04 Tests ───────────────────────────────────────────────────────────

test('classifyRunEvidence claimInvalid=true produces failed/failed regardless of other inputs (Step 04 §5.2)', () => {
  // Malformed claim with zero exit must still fail closed
  const result = classifyRunEvidence({
    exitCode: 0,
    isTimeout: false,
    claimInvalid: true,
    agentClaim: null,
    workerArtifacts: ['runs/01/agent-report.md'],
    changedFiles: [],
    isReadOnlyOperation: true,
  });
  assert.deepEqual(result, { status: 'failed', confidence: 'failed' });

  // Malformed claim with external evidence must also fail closed
  const resultWithEvidence = classifyRunEvidence({
    exitCode: 0,
    isTimeout: false,
    claimInvalid: true,
    agentClaim: null,
    workerArtifacts: [],
    changedFiles: ['src/file.mjs'],
    isReadOnlyOperation: false,
  });
  assert.deepEqual(resultWithEvidence, { status: 'failed', confidence: 'failed' });
});

test('executeAssignment fails closed on malformed agent-result.json (Step 04 §5.2)', async () => {
  const tempDir = mkTempDir();

  const executorScript = path.join(tempDir, 'malformed-claim-executor.mjs');
  fs.writeFileSync(
    executorScript,
    `
    import fs from 'node:fs';
    import path from 'node:path';
    const cwd = process.cwd();
    const runsDir = path.join(cwd, '.fgos', 'assignments');
    if (fs.existsSync(runsDir)) {
      for (const asgn of fs.readdirSync(runsDir)) {
        const runDir = path.join(runsDir, asgn, 'runs', '01');
        if (fs.existsSync(runDir)) {
          fs.writeFileSync(path.join(runDir, 'agent-result.json'), 'THIS IS NOT JSON {{{{');
        }
      }
    }
    process.stdout.write("Done.\\n");
    process.exit(0);
    `,
  );

  const runnerConfig = {
    executor: { allowCrossProvider: true, command: process.execPath, args: [executorScript, '{prompt}'] },
    models: { standard: 'test-model' },
    timeoutMs: 5000,
  };

  const assignment = buildAssignment({
    workId: 'tsk-malformed-claim',
    stage: 'planning',
    operation: 'validate-plan',
  });

  const result = await executeAssignment(assignment, { cwd: tempDir, repoRoot: tempDir, runnerConfig });

  assert.equal(result.status, 'failed', 'malformed agent-result.json must produce status: failed');
  assert.equal(result.confidence, 'failed', 'malformed agent-result.json must produce confidence: failed');
  assert.match(result.agentClaim.summary, /schema validation/i);
});

test('executeAssignment fails closed on invalid agent-result.json schema (Step 04 §5.2)', async () => {
  const tempDir = mkTempDir();

  const executorScript = path.join(tempDir, 'invalid-schema-executor.mjs');
  fs.writeFileSync(
    executorScript,
    `
    import fs from 'node:fs';
    import path from 'node:path';
    const cwd = process.cwd();
    const runsDir = path.join(cwd, '.fgos', 'assignments');
    if (fs.existsSync(runsDir)) {
      for (const asgn of fs.readdirSync(runsDir)) {
        const runDir = path.join(runsDir, asgn, 'runs', '01');
        if (fs.existsSync(runDir)) {
          fs.writeFileSync(path.join(runDir, 'agent-result.json'),
            JSON.stringify({ status: 'success', summary: 'All done' }));
        }
      }
    }
    process.exit(0);
    `,
  );

  const runnerConfig = {
    executor: { allowCrossProvider: true, command: process.execPath, args: [executorScript, '{prompt}'] },
    models: { standard: 'test-model' },
    timeoutMs: 5000,
  };

  const assignment = buildAssignment({
    workId: 'tsk-invalid-schema',
    stage: 'planning',
    operation: 'validate-plan',
  });

  const result = await executeAssignment(assignment, { cwd: tempDir, repoRoot: tempDir, runnerConfig });

  assert.equal(result.status, 'failed', 'invalid schema must produce status: failed');
  assert.equal(result.confidence, 'failed', 'invalid schema must produce confidence: failed');
});

test('executeAssignment does not count pre-existing dirty files as run evidence (Step 04 §5.3)', async () => {
  const tempDir = mkTempDir();

  execFileSync('git', ['init'], { cwd: tempDir, stdio: 'ignore' });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: tempDir, stdio: 'ignore' });
  execFileSync('git', ['config', 'user.name', 'Tester'], { cwd: tempDir, stdio: 'ignore' });
  fs.writeFileSync(path.join(tempDir, 'committed.txt'), 'initial\n');
  execFileSync('git', ['add', '.'], { cwd: tempDir, stdio: 'ignore' });
  execFileSync('git', ['commit', '-m', 'initial'], { cwd: tempDir, stdio: 'ignore' });
  // Make a file dirty BEFORE the run
  fs.writeFileSync(path.join(tempDir, 'preexisting-dirty.txt'), 'dirty before run\n');

  const executorScript = path.join(tempDir, 'noop-executor.mjs');
  fs.writeFileSync(executorScript, 'process.exit(0);');

  const runnerConfig = {
    executor: { allowCrossProvider: true, command: process.execPath, args: [executorScript, '{prompt}'] },
    models: { standard: 'test-model' },
    timeoutMs: 5000,
  };

  const assignment = buildAssignment({ workId: 'tsk-dirty-before', stage: 'planning', operation: 'validate-plan' });

  const result = await executeAssignment(assignment, { cwd: tempDir, repoRoot: tempDir, runnerConfig });

  assert.ok(!result.evidence.changedFiles.includes('preexisting-dirty.txt'),
    'pre-existing dirty file must not be counted as run evidence');
  assert.equal(result.status, 'no-evidence');
  assert.equal(result.confidence, 'no-evidence');
});

test('executeAssignment counts only new dirty files as run evidence (Step 04 §5.3)', async () => {
  const tempDir = mkTempDir();

  execFileSync('git', ['init'], { cwd: tempDir, stdio: 'ignore' });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: tempDir, stdio: 'ignore' });
  execFileSync('git', ['config', 'user.name', 'Tester'], { cwd: tempDir, stdio: 'ignore' });
  fs.writeFileSync(path.join(tempDir, 'tracked.txt'), 'initial\n');
  execFileSync('git', ['add', '.'], { cwd: tempDir, stdio: 'ignore' });
  execFileSync('git', ['commit', '-m', 'initial'], { cwd: tempDir, stdio: 'ignore' });
  fs.writeFileSync(path.join(tempDir, 'old-dirty.txt'), 'was already dirty\n');

  const executorScript = path.join(tempDir, 'new-file-executor.mjs');
  fs.writeFileSync(
    executorScript,
    `
    import fs from 'node:fs';
    import path from 'node:path';
    fs.writeFileSync(path.join(process.cwd(), 'new-during-run.txt'), 'created by run\\n');
    process.exit(0);
    `,
  );

  const runnerConfig = {
    executor: { allowCrossProvider: true, command: process.execPath, args: [executorScript, '{prompt}'] },
    models: { standard: 'test-model' },
    timeoutMs: 5000,
  };

  const assignment = buildAssignment({ workId: 'tsk-new-dirty', stage: 'executing', operation: 'implement-item' });

  const result = await executeAssignment(assignment, { cwd: tempDir, repoRoot: tempDir, runnerConfig });

  assert.ok(result.evidence.changedFiles.includes('new-during-run.txt'),
    'file created during run must be in changedFiles');
  assert.ok(!result.evidence.changedFiles.includes('old-dirty.txt'),
    'pre-existing dirty file must NOT be in changedFiles');
});

test('executeAssignment evidence.json contains dirtyBefore, dirtyAfter, changedFileReasons (Step 04 §5.5)', async () => {
  const tempDir = mkTempDir();

  const executorScript = path.join(tempDir, 'echo-exit.mjs');
  fs.writeFileSync(executorScript, 'process.exit(0);');

  const runnerConfig = {
    executor: { allowCrossProvider: true, command: process.execPath, args: [executorScript, '{prompt}'] },
    models: { standard: 'test-model' },
    timeoutMs: 5000,
  };

  const assignment = buildAssignment({ workId: 'tsk-evidence-shape', stage: 'planning', operation: 'validate-plan' });

  await executeAssignment(assignment, { cwd: tempDir, repoRoot: tempDir, runnerConfig });

  const evidencePath = path.join(
    tempDir, '.fgos', 'assignments', assignment.assignmentId, 'runs', '01', 'evidence.json',
  );
  assert.ok(fs.existsSync(evidencePath), 'evidence.json must exist');
  const evidence = JSON.parse(fs.readFileSync(evidencePath, 'utf8'));

  assert.ok('dirtyBefore' in evidence, 'evidence.json must have dirtyBefore');
  assert.ok('dirtyAfter' in evidence, 'evidence.json must have dirtyAfter');
  assert.ok('changedFileReasons' in evidence, 'evidence.json must have changedFileReasons');
  assert.ok('operationMutability' in evidence, 'evidence.json must have operationMutability');
  assert.ok('changedFiles' in evidence, 'evidence.json must preserve changedFiles for compatibility');
  assert.ok(Array.isArray(evidence.dirtyBefore), 'dirtyBefore must be an array');
  assert.ok(Array.isArray(evidence.dirtyAfter), 'dirtyAfter must be an array');
  assert.ok(typeof evidence.changedFileReasons === 'object', 'changedFileReasons must be an object');
});

test('classifyRunEvidence: read-only operation cannot be reported without a companion report artifact (self-attested evidenceRefs never substitute)', () => {
  // 1. Read-only with bare agent-result.json path in workerArtifacts but no evidenceRefs and no companion report => no-evidence
  const resultBareClaim = classifyRunEvidence({
    exitCode: 0,
    agentClaim: { status: 'done', summary: 'Checked' },
    workerArtifacts: ['runs/01/agent-result.json'],
    changedFiles: [],
    isReadOnlyOperation: true,
  });
  assert.deepEqual(resultBareClaim, { status: 'no-evidence', confidence: 'no-evidence' },
    'bare agent-result.json without evidenceRefs or companion report artifact must produce no-evidence');

  // 2. Read-only with claim + string-only evidenceRefs => no-evidence.
    // The worker fully controls agent-result.json, so string-only
    // evidenceRefs (even refs pointing at real files) can never satisfy the
    // worker-report requirement — only a companion report artifact the
    // runner detected in the run dir may produce `reported`.
  const resultWithEvidenceRefs = classifyRunEvidence({
    exitCode: 0,
    agentClaim: { status: 'done', summary: 'Checked', evidenceRefs: ['docs/plan.md'] },
    workerArtifacts: ['runs/01/agent-result.json'],
    changedFiles: [],
    isReadOnlyOperation: true,
  });
  assert.deepEqual(resultWithEvidenceRefs, { status: 'no-evidence', confidence: 'no-evidence' });

  // 3. Read-only with claim + companion agent-report.md => reported
  const resultWithReport = classifyRunEvidence({
    exitCode: 0,
    agentClaim: { status: 'done', summary: 'Checked' },
    workerArtifacts: ['runs/01/agent-report.md', 'runs/01/agent-result.json'],
    changedFiles: [],
    isReadOnlyOperation: true,
  });
  assert.deepEqual(resultWithReport, { status: 'done', confidence: 'reported' });

  // 4. Read-only operation with accidental changed files MUST fail closed (status: failed, confidence: failed)
  const resultMutatedReadOnly = classifyRunEvidence({
    exitCode: 0,
    agentClaim: { status: 'done', summary: 'Scouted' },
    workerArtifacts: ['runs/01/agent-report.md', 'runs/01/agent-result.json'],
    changedFiles: ['src/unintended.mjs'],
    isReadOnlyOperation: true,
  });
  assert.deepEqual(resultMutatedReadOnly, { status: 'failed', confidence: 'failed' },
    'read-only operation that mutates repo files must fail closed with status: failed and confidence: failed');
});

test('classifyRunEvidence: a self-reported "blocked" status must not escape the read-only fail-closed check when the op mutated a pre-existing dirty file (Cell 6.7 Bug A)', () => {
  // A read-only worker (reviewer/researcher/advisor) that mutates a
  // pre-existing dirty file and reports status: 'blocked' in
  // agent-result.json must still settle failed/failed -- the read-only
  // contract violation is what happened, regardless of what status the
  // agent self-reports. Before the fix, the `blocked` short-circuit
  // returned before this fail-closed check ever ran.
  const resultBlockedMutatedReadOnly = classifyRunEvidence({
    exitCode: 0,
    agentClaim: { status: 'blocked', summary: 'Could not proceed' },
    hasDirtyBeforeMutation: true,
    changedFiles: [],
    isReadOnlyOperation: true,
  });
  assert.deepEqual(resultBlockedMutatedReadOnly, { status: 'failed', confidence: 'failed' },
    'a read-only op that mutated a pre-existing dirty file must fail closed even when the worker self-reports blocked');
});

test('classifyRunEvidence: prefixed string evidenceRefs without any companion report artifact never classify reported (red-team)', () => {
  // A forged claim: prefixed refs (evidence:/diff:/verify:/doc:/...) pass
  // string checks without any file existing on disk. The worker fully
  // controls agent-result.json, so string-only evidenceRefs must never
  // satisfy the worker-report requirement — only a companion report
  // artifact the runner detected in the run dir may produce `reported`.
  const resultForgedRefs = classifyRunEvidence({
    exitCode: 0,
    agentClaim: {
      status: 'done',
      summary: 'Validated',
      evidenceRefs: ['evidence:plan-validated', 'verify:all-checks-passed', 'doc:plan.md'],
    },
    workerArtifacts: ['runs/01/agent-result.json'],
    changedFiles: [],
    isReadOnlyOperation: true,
    cwd: '/nonexistent-cwd-for-red-team-test',
  });
  assert.deepEqual(resultForgedRefs, { status: 'no-evidence', confidence: 'no-evidence' },
    'string-only evidenceRefs must never substitute for an on-disk companion report');
});

test('classifyRunEvidence: mutating operation cannot be verified without post-run external evidence (Step 04 §5.4)', () => {
  // Mutating with claim but no changed files => no-evidence
  const resultNoEvidence = classifyRunEvidence({
    exitCode: 0,
    agentClaim: { status: 'done' },
    workerArtifacts: ['runs/01/agent-report.md'],
    changedFiles: [],
    isReadOnlyOperation: false,
  });
  assert.deepEqual(resultNoEvidence, { status: 'no-evidence', confidence: 'no-evidence' });

  // Mutating with claim AND changed files => verified
  const resultVerified = classifyRunEvidence({
    exitCode: 0,
    agentClaim: { status: 'done' },
    workerArtifacts: [],
    changedFiles: ['src/impl.mjs'],
    isReadOnlyOperation: false,
  });
  assert.deepEqual(resultVerified, { status: 'done', confidence: 'verified' });
});

// P1 regression: no-op executor + pre-existing dirty file must NOT produce inferred/done
test('executeAssignment with no-op executor and pre-existing dirty file must produce no-evidence, not inferred (P1)', async () => {
  const tempDir = mkTempDir();

  execFileSync('git', ['init'], { cwd: tempDir, stdio: 'ignore' });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: tempDir, stdio: 'ignore' });
  execFileSync('git', ['config', 'user.name', 'Tester'], { cwd: tempDir, stdio: 'ignore' });
  fs.writeFileSync(path.join(tempDir, 'tracked.txt'), 'initial\n');
  execFileSync('git', ['add', '.'], { cwd: tempDir, stdio: 'ignore' });
  execFileSync('git', ['commit', '-m', 'initial'], { cwd: tempDir, stdio: 'ignore' });

  // Pre-existing dirty files before the run starts
  fs.writeFileSync(path.join(tempDir, 'preexisting.txt'), 'dirty before run\n');

  // No-op executor: does nothing — no file writes, just exit 0
  const noopScript = path.join(tempDir, 'noop.mjs');
  fs.writeFileSync(noopScript, 'process.exit(0);');

  const runnerConfig = {
    executor: { allowCrossProvider: true, command: process.execPath, args: [noopScript, '{prompt}'] },
    models: { standard: 'test-model' },
    timeoutMs: 5000,
  };

  const assignment = buildAssignment({ workId: 'tsk-noop-preexisting', stage: 'executing', operation: 'implement-item' });

  const result = await executeAssignment(assignment, { cwd: tempDir, repoRoot: tempDir, runnerConfig });

  // The no-op executor did nothing; preexisting.txt was dirty BEFORE the run.
  // changedFiles must be empty, so this must be no-evidence — NOT inferred or done.
  assert.ok(!result.evidence.changedFiles.includes('preexisting.txt'),
    'pre-existing dirty file must NOT appear in changedFiles');
  assert.equal(result.confidence, 'no-evidence',
    'no-op executor with pre-existing dirty file must produce no-evidence, not inferred');
  assert.equal(result.status, 'no-evidence');
});

// P2 regression: corrupt assignment.json must throw RunnerConfigError, not silently fallback to in-memory object
test('executeAssignment with corrupt persisted assignment.json must throw RunnerConfigError (P2)', async () => {
  const tempDir = mkTempDir();

  const noopScript = path.join(tempDir, 'noop.mjs');
  fs.writeFileSync(noopScript, 'process.exit(0);');

  const runnerConfig = {
    executor: { allowCrossProvider: true, command: process.execPath, args: [noopScript, '{prompt}'] },
    models: { standard: 'test-model' },
    timeoutMs: 5000,
  };

  const assignment = buildAssignment({ workId: 'tsk-corrupt-json', stage: 'planning', operation: 'validate-plan' });

  // Pre-create a corrupt (invalid JSON) assignment.json
  const asgnDir = path.join(tempDir, '.fgos', 'assignments', assignment.assignmentId);
  fs.mkdirSync(asgnDir, { recursive: true });
  fs.writeFileSync(path.join(asgnDir, 'assignment.json'), '{bad json: not valid');

  // Must throw, not silently execute with in-memory object
  await assert.rejects(
    () => executeAssignment(assignment, { cwd: tempDir, repoRoot: tempDir, runnerConfig }),
    (err) => {
      assert.ok(err.message.includes('corrupt'), `expected "corrupt" in message, got: ${err.message}`);
      return true;
    },
    'corrupt assignment.json must throw RunnerConfigError',
  );
});

test('executeAssignment with bare agent-result.json (no evidenceRefs, no companion report) produces no-evidence (P1)', async () => {
  const tempDir = mkTempDir();

  const executorScript = path.join(tempDir, 'bare-claim-executor.mjs');
  fs.writeFileSync(
    executorScript,
    `
    import fs from 'node:fs';
    import path from 'node:path';
    const cwd = process.cwd();
    const runsDir = path.join(cwd, '.fgos', 'assignments');
    if (fs.existsSync(runsDir)) {
      for (const asgn of fs.readdirSync(runsDir)) {
        const runDir = path.join(runsDir, asgn, 'runs', '01');
        if (fs.existsSync(runDir)) {
          // Write bare agent-result.json with status done but NO evidenceRefs and NO agent-report.md
          fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'Bare claim without evidence' }));
        }
      }
    }
    process.exit(0);
    `,
  );

  const runnerConfig = {
    executor: { allowCrossProvider: true, command: process.execPath, args: [executorScript, '{prompt}'] },
    models: { standard: 'test-model' },
    timeoutMs: 5000,
  };

  const assignment = buildAssignment({ workId: 'tsk-bare-claim', stage: 'planning', operation: 'validate-plan' });

  const result = await executeAssignment(assignment, { cwd: tempDir, repoRoot: tempDir, runnerConfig });

  // Must NOT produce reported! Bare claim without evidenceRefs or companion report is no-evidence.
  assert.equal(result.status, 'no-evidence', 'bare agent-result.json must produce status: no-evidence');
  assert.equal(result.confidence, 'no-evidence', 'bare agent-result.json must produce confidence: no-evidence');
});

test('executeAssignment with malformed evidenceRefs: [""] fails closed with status: failed (P1)', async () => {
  const tempDir = mkTempDir();

  const executorScript = path.join(tempDir, 'malformed-refs-executor.mjs');
  fs.writeFileSync(
    executorScript,
    `
    import fs from 'node:fs';
    import path from 'node:path';
    const cwd = process.cwd();
    const runsDir = path.join(cwd, '.fgos', 'assignments');
    if (fs.existsSync(runsDir)) {
      for (const asgn of fs.readdirSync(runsDir)) {
        const runDir = path.join(runsDir, asgn, 'runs', '01');
        if (fs.existsSync(runDir)) {
          // Write agent-result.json with malformed evidenceRefs containing empty string
          fs.writeFileSync(path.join(runDir, 'agent-result.json'),
            JSON.stringify({ status: 'done', summary: 'Claim only', evidenceRefs: [''] }));
        }
      }
    }
    process.exit(0);
    `,
  );

  const runnerConfig = {
    executor: { allowCrossProvider: true, command: process.execPath, args: [executorScript, '{prompt}'] },
    models: { standard: 'test-model' },
    timeoutMs: 5000,
  };

  const assignment = buildAssignment({ workId: 'tsk-bad-refs', stage: 'planning', operation: 'validate-plan' });

  const result = await executeAssignment(assignment, { cwd: tempDir, repoRoot: tempDir, runnerConfig });

  // Must fail closed because evidenceRefs items must be non-empty strings!
  assert.equal(result.status, 'failed', 'malformed evidenceRefs must produce status: failed');
  assert.equal(result.confidence, 'failed', 'malformed evidenceRefs must produce confidence: failed');
});

test('executeAssignment with placeholder report text (TODO/N/A/keyword-only) produces no-evidence', async () => {
  const tempDir = mkTempDir();

  const executorScript = path.join(tempDir, 'placeholder-report-executor.mjs');
  fs.writeFileSync(
    executorScript,
    `
    import fs from 'node:fs';
    import path from 'node:path';
    const cwd = process.cwd();
    const runsDir = path.join(cwd, '.fgos', 'assignments');
    if (fs.existsSync(runsDir)) {
      for (const asgn of fs.readdirSync(runsDir)) {
        const runDir = path.join(runsDir, asgn, 'runs', '01');
        if (fs.existsSync(runDir)) {
          fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Validation Report\\nTODO\\n');
          fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'Done' }));
        }
      }
    }
    process.exit(0);
    `,
  );

  const runnerConfig = {
    executor: { allowCrossProvider: true, command: process.execPath, args: [executorScript, '{prompt}'] },
    models: { standard: 'test-model' },
    timeoutMs: 5000,
  };

  const assignment = buildAssignment({ workId: 'tsk-todo-report', stage: 'planning', operation: 'validate-plan' });
  const result = await executeAssignment(assignment, { cwd: tempDir, repoRoot: tempDir, runnerConfig });

  assert.equal(result.status, 'no-evidence', 'placeholder TODO report text must produce status: no-evidence');
  assert.equal(result.confidence, 'no-evidence', 'placeholder TODO report text must produce confidence: no-evidence');
});

test('executeAssignment with placeholder evidenceRefs (TODO/N/A/fabricated path) produces no-evidence', async () => {
  const tempDir = mkTempDir();

  const executorScript = path.join(tempDir, 'placeholder-ref-executor.mjs');
  fs.writeFileSync(
    executorScript,
    `
    import fs from 'node:fs';
    import path from 'node:path';
    const cwd = process.cwd();
    const runsDir = path.join(cwd, '.fgos', 'assignments');
    if (fs.existsSync(runsDir)) {
      for (const asgn of fs.readdirSync(runsDir)) {
        const runDir = path.join(runsDir, asgn, 'runs', '01');
        if (fs.existsSync(runDir)) {
          fs.writeFileSync(path.join(runDir, 'agent-result.json'),
            JSON.stringify({ status: 'done', summary: 'Done', evidenceRefs: ['TODO', 'fake_fabricated_file.txt'] }));
        }
      }
    }
    process.exit(0);
    `,
  );

  const runnerConfig = {
    executor: { allowCrossProvider: true, command: process.execPath, args: [executorScript, '{prompt}'] },
    models: { standard: 'test-model' },
    timeoutMs: 5000,
  };

  const assignment = buildAssignment({ workId: 'tsk-placeholder-ref', stage: 'planning', operation: 'validate-plan' });
  const result = await executeAssignment(assignment, { cwd: tempDir, repoRoot: tempDir, runnerConfig });

  assert.equal(result.status, 'no-evidence', 'placeholder evidenceRefs must produce status: no-evidence');
  assert.equal(result.confidence, 'no-evidence', 'placeholder evidenceRefs must produce confidence: no-evidence');
});

test('executeAssignment with real substantive report text produces confidence: reported', async () => {
  const tempDir = mkTempDir();

  const executorScript = path.join(tempDir, 'real-report-executor.mjs');
  fs.writeFileSync(
    executorScript,
    `
    import fs from 'node:fs';
    import path from 'node:path';
    const cwd = process.cwd();
    const runsDir = path.join(cwd, '.fgos', 'assignments');
    if (fs.existsSync(runsDir)) {
      for (const asgn of fs.readdirSync(runsDir)) {
        const runDir = path.join(runsDir, asgn, 'runs', '01');
        if (fs.existsSync(runDir)) {
          fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Validation Report\\nPlan is sound and verified against codebase.\\n');
          fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'Plan sound' }));
        }
      }
    }
    process.exit(0);
    `,
  );

  const runnerConfig = {
    executor: { allowCrossProvider: true, command: process.execPath, args: [executorScript, '{prompt}'] },
    models: { standard: 'test-model' },
    timeoutMs: 5000,
  };

  const assignment = buildAssignment({ workId: 'tsk-real-report', stage: 'planning', operation: 'validate-plan' });
  const result = await executeAssignment(assignment, { cwd: tempDir, repoRoot: tempDir, runnerConfig });

  assert.equal(result.status, 'done', 'real report text must produce status: done');
  assert.equal(result.confidence, 'reported', 'real report text must produce confidence: reported');
});


