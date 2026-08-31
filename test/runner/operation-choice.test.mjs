import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync, execSync } from 'node:child_process';
import {
  chooseStageOperation,
  executeDriverOperationChoice,
  hasPlanMd,
  interpretAssignmentRunResult,
  deriveCandidateReviewRefs,
  hasValidReviewEvidenceRefs,
  isResolvableDiffRef,
  isResolvableVerifyRef,
} from '../../src/runner/dispatch/operation-choice.mjs';
import { operationsForStage } from '../../src/state/workflow-stage-graphs.mjs';
import { buildAssignment } from '../../src/runner/dispatch/assignment.mjs';
import { executeAssignment } from '../../src/runner/dispatch/assignment-runner.mjs';
import { runOnce } from '../../src/runner/loop.mjs';
import { initStore, addWork, listWork } from '../../src/state/store.mjs';

function mkTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-op-choice-test-'));
}

function initRepo(dir) {
  execFileSync('git', ['init', '-b', 'main'], { cwd: dir });
  execFileSync('git', ['config', 'user.name', 'test'], { cwd: dir });
  execFileSync('git', ['config', 'user.email', 'test@test'], { cwd: dir });
  fs.writeFileSync(path.join(dir, 'README.md'), '# test\n');
  execFileSync('git', ['add', '.'], { cwd: dir });
  execFileSync('git', ['commit', '-m', 'initial commit'], { cwd: dir });
}

const PROJECT_ROOT = process.cwd();

function writeFakeExecutor(dir, payloadOverrides = {}) {
  const scriptPath = path.join(dir, 'fake-reviewer-executor.mjs');
  const mainMjsPath = path.join(dir, 'src', 'main.mjs');
  if (!fs.existsSync(mainMjsPath)) {
    fs.mkdirSync(path.dirname(mainMjsPath), { recursive: true });
    fs.writeFileSync(mainMjsPath, '// main\n');
  }
  const payloadObj = {
    status: 'done',
    summary: 'Plan is feasible',
    verdict: 'READY',
    realityGate: {
      'mode-fit': 'PASS (citation: src/main.mjs:L1)',
      'repo-fit': 'PASS (citation: src/main.mjs:L1)',
      'assumptions-fit': 'PASS (citation: src/main.mjs:L1)',
      'smaller-path-fit': 'PASS (citation: src/main.mjs:L1)',
      'proof-surface-fit': 'PASS (citation: src/main.mjs:L1)',
      'impact-analysis-posture': 'PASS (citation: src/main.mjs:L1)',
    },
    feasibilityMatrix: [{ risk: 'Risk 1', rating: 'Low', citation: 'src/main.mjs:L1' }],
    ...payloadOverrides,
  };
  fs.writeFileSync(
    scriptPath,
    `
    import fs from 'node:fs';
    import path from 'node:path';
    const prompt = process.argv.slice(2).join(' ');
    let resultPath = null;
    const match = /Write structured JSON to (\\S+agent-result\\.json)/.exec(prompt);
    if (match) {
      resultPath = match[1];
    } else {
      const cwd = process.cwd();
      const asgnDir = path.join(cwd, '.fgos', 'assignments');
      if (fs.existsSync(asgnDir)) {
        const subdirs = fs.readdirSync(asgnDir)
          .map((a) => path.join(asgnDir, a, 'runs', '01'))
          .filter((p) => fs.existsSync(p));
        subdirs.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
        if (subdirs.length > 0) {
          resultPath = path.join(subdirs[0], 'agent-result.json');
        }
      }
    }
    if (resultPath) {
      const runDir = path.dirname(resultPath);
      fs.mkdirSync(runDir, { recursive: true });
      fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Reality Gate Validation & Feasibility Matrix Report\\n## Reality Gate Score\\n- Mode fit: PASS (citation: src/main.mjs:L1)\\n- Repo fit: PASS (citation: src/main.mjs:L1)\\n- Assumptions: PASS (citation: src/main.mjs:L1)\\n- Smaller path: PASS (citation: src/main.mjs:L1)\\n- Proof surface: PASS (citation: src/main.mjs:L1)\\n- Impact-analysis posture: PASS (citation: src/main.mjs:L1)\\n## Feasibility Matrix\\n- Feasibility matrix: verified (citation: src/main.mjs:L1).\\n## Review Evaluation\\n- Candidate diff: evidence:candidate-diff verified.\\n- Verify result: evidence:verify-pass evidence:verify-fail test pass confirmed.\\n- Rationale: APPROVED clean implementation.\\n## Scout Blast Radius\\n- Symbol: execute in src/core.js\\n- Search posture: active rg cross-check\\n- Callers: src/main.mjs\\n- Affected processes: none\\n- Risk read: low risk\\n## Question Resolution\\n- Answer: verified.\\n- Citations: ref: src/main.mjs:L1\\n- Verdict: clear\\n- Remaining uncertainty: None.\\nPlan holds up under reality check.\\n');
      fs.writeFileSync(resultPath, JSON.stringify(${JSON.stringify(payloadObj)}, null, 2));
      if (${Boolean(payloadOverrides.appendConstraintsToPlan)}) {
        const cwd = process.cwd();
        const planFiles = fs.readdirSync(cwd, { recursive: true }).filter((f) => String(f).endsWith('plan.md'));
        for (const pf of planFiles) {
          const full = path.join(cwd, pf);
          try {
            const old = fs.readFileSync(full, 'utf8');
            fs.writeFileSync(full, old + '\\n## Constraints\\n- Requirement 1 (citation: src/main.mjs:L1)\\n');
          } catch {}
        }
      }
    }
    process.stdout.write("All good\\n");
    process.exit(0);
    `,
  );
  return scriptPath;
}

function writeFailingExecutor(dir) {
  const scriptPath = path.join(dir, 'failing-reviewer-executor.mjs');
  fs.writeFileSync(
    scriptPath,
    `
    process.stderr.write("Review execution failed\\n");
    process.exit(1);
    `,
  );
  return scriptPath;
}

function writeNoEvidenceExecutor(dir) {
  const scriptPath = path.join(dir, 'no-evidence-executor.mjs');
  fs.writeFileSync(
    scriptPath,
    `
    // Exits zero but writes no result artifacts
    process.stdout.write("Processed without producing artifacts\\n");
    process.exit(0);
    `,
  );
  return scriptPath;
}

function runnerConfigFor(scriptPath) {
  return {
    executors: {
      claude: {
        kind: 'agent',
        command: process.execPath,
        args: [scriptPath, '{prompt}'],
        allowCrossProvider: true,
      },
    },
    modelPolicies: {
      claude: { standard: 'test-model' },
    },
    timeoutMs: 5000,
  };
}

function seedTaskSpecs(root, specs) {
  const taskSpecDir = path.join(root, 'domains', 'coding', 'task-specs');
  fs.mkdirSync(taskSpecDir, { recursive: true });
  for (const spec of specs) {
    fs.writeFileSync(path.join(taskSpecDir, `${spec}.md`), `# task-spec: ${spec}\n`);
  }
}

function assertAssignmentRunFiles(root, assignmentId) {
  const assignmentDir = path.join(root, '.fgos', 'assignments', assignmentId);
  const runDir = path.join(assignmentDir, 'runs', '01');
  assert.ok(fs.existsSync(path.join(assignmentDir, 'assignment.json')), 'assignment.json must exist');
  assert.ok(fs.existsSync(path.join(runDir, 'run.json')), 'run.json must exist');
  assert.ok(fs.existsSync(path.join(runDir, 'dispatch-plan.json')), 'dispatch-plan.json must exist');
  assert.ok(fs.existsSync(path.join(runDir, 'agent-result.json')), 'agent-result.json must exist');
  assert.ok(fs.existsSync(path.join(runDir, 'agent-report.md')), 'agent-report.md must exist');
  assert.ok(fs.existsSync(path.join(runDir, 'evidence.json')), 'evidence.json must exist');
  assert.ok(fs.existsSync(path.join(runDir, 'result.json')), 'result.json must exist');
}

test('driver chooses primary path when validation not due', () => {
  const work = { id: 'tsk-plan-1', stage: 'planning', domain: 'coding', workflow: 'feature' };
  const choice = chooseStageOperation({
    work,
    contextSignals: { hasPlan: false, validationDue: false },
  });

  assert.equal(choice.operation, 'shape-plan');
  assert.equal(choice.dispatch, 'direct-stage-skill');
  assert.equal(choice.stop, false);
  assert.equal(choice.canAdvanceEdge, false);
  assert.equal(choice.reason, 'primary-stage-owner-work');
});

test('driver chooses validate-plan when plan.md is ready', () => {
  const work = { id: 'tsk-plan-2', stage: 'planning', domain: 'coding', workflow: 'feature' };
  const choice = chooseStageOperation({
    work,
    contextSignals: { hasPlan: true, validationDue: true },
  });

  assert.equal(choice.operation, 'validate-plan');
  assert.equal(choice.dispatch, 'assignment');
  assert.equal(choice.stop, false);
  assert.equal(choice.reason, 'plan-written-needs-reality-check');
});

test('driver sees current stage and legal operations via operationsForStage', () => {
  const ops = operationsForStage('coding', 'planning', { kind: 'feature' });
  const opIds = ops.map((o) => o.id);

  assert.ok(opIds.includes('shape-plan'));
  assert.ok(opIds.includes('validate-plan'));
  assert.ok(opIds.includes('scout-blast-radius'));
  assert.ok(opIds.includes('resolve-question'));

  const choice = chooseStageOperation({
    work: { id: 'tsk-ops-test', stage: 'planning', domain: 'coding' },
    availableOperations: ops,
    contextSignals: { hasPlan: true },
  });

  assert.equal(choice.operation, 'validate-plan');
  assert.equal(choice.dispatch, 'assignment');
});

test('hasPlanMd detects presence of non-empty plan.md under docsRef', () => {
  const tempDir = mkTempDir();
  const featureDir = path.join(tempDir, 'docs', 'history', 'feat-test');
  fs.mkdirSync(featureDir, { recursive: true });

  const work = { id: 'tsk-feat-1', stage: 'planning', docsRef: 'docs/history/feat-test' };

  assert.equal(hasPlanMd({ work, repoRoot: tempDir }), false);

  fs.writeFileSync(path.join(featureDir, 'plan.md'), '# Mode: tiny\nPlan content.\n');
  assert.equal(hasPlanMd({ work, repoRoot: tempDir }), true);
});

test('validate-plan no-evidence does not move Work', async () => {
  const tempDir = mkTempDir();
  seedTaskSpecs(tempDir, ['validate-plan']);
  const executorScript = writeNoEvidenceExecutor(tempDir);

  const runnerConfig = {
    executor: {
      allowCrossProvider: true,
      command: process.execPath,
      args: [executorScript, '{prompt}'],
    },
    models: { standard: 'test-model' },
    timeoutMs: 5000,
  };

  const work = { id: 'tsk-no-ev', status: 'doing', stage: 'planning', domain: 'coding' };
  const choice = chooseStageOperation({
    work,
    contextSignals: { hasPlan: true, validationDue: true },
  });

  assert.equal(choice.operation, 'validate-plan');

  const outcome = await executeDriverOperationChoice(work, choice, {
    cwd: tempDir,
    repoRoot: tempDir,
    runnerConfig,
  });

  assert.equal(outcome.executed, true);
  assert.equal(outcome.dispatchType, 'assignment');
  assert.equal(outcome.runResult.confidence, 'no-evidence');
  assert.equal(outcome.canAdvanceEdge, false);
  assert.equal(outcome.stop, true);

  // Work object remains completely unchanged
  assert.equal(work.status, 'doing');
  assert.equal(work.stage, 'planning');
});

test('validate-plan failed does not move Work', async () => {
  const tempDir = mkTempDir();
  seedTaskSpecs(tempDir, ['validate-plan']);
  const executorScript = writeFailingExecutor(tempDir);

  const runnerConfig = {
    executor: {
      allowCrossProvider: true,
      command: process.execPath,
      args: [executorScript, '{prompt}'],
    },
    models: { standard: 'test-model' },
    timeoutMs: 5000,
  };

  const work = { id: 'tsk-fail-op', status: 'doing', stage: 'planning', domain: 'coding' };
  const choice = chooseStageOperation({
    work,
    contextSignals: { hasPlan: true, validationDue: true },
  });

  const outcome = await executeDriverOperationChoice(work, choice, {
    cwd: tempDir,
    repoRoot: tempDir,
    runnerConfig,
  });

  assert.equal(outcome.executed, true);
  assert.equal(outcome.dispatchType, 'assignment');
  assert.equal(outcome.runResult.status, 'failed');
  assert.equal(outcome.runResult.confidence, 'failed');
  assert.equal(outcome.canAdvanceEdge, false);
  assert.equal(outcome.stop, true);

  // Work object remains completely unchanged
  assert.equal(work.status, 'doing');
  assert.equal(work.stage, 'planning');
});

test('reported READY allows existing planning edge path', async () => {
  const tempDir = mkTempDir();
  seedTaskSpecs(tempDir, ['validate-plan']);
  const executorScript = writeFakeExecutor(tempDir, { status: 'done', verdict: 'READY', summary: 'Feasible' });

  const runnerConfig = {
    executor: {
      allowCrossProvider: true,
      command: process.execPath,
      args: [executorScript, '{prompt}'],
    },
    models: { standard: 'test-model' },
    timeoutMs: 5000,
  };

  const work = { id: 'tsk-ready-op', status: 'doing', stage: 'planning', domain: 'coding' };
  const choice = chooseStageOperation({
    work,
    contextSignals: { hasPlan: true, validationDue: true },
  });

  const outcome = await executeDriverOperationChoice(work, choice, {
    cwd: tempDir,
    repoRoot: tempDir,
    runnerConfig,
  });

  assert.equal(outcome.executed, true);
  assert.equal(outcome.dispatchType, 'assignment');
  assert.equal(outcome.runResult.confidence, 'reported');
  assert.equal(outcome.runResult.agentClaim.verdict, 'READY');
  assert.equal(outcome.canAdvanceEdge, true);
  assert.equal(outcome.stop, false);

  // Work object remains unchanged by assignment execution itself
  assert.equal(work.status, 'doing');
  assert.equal(work.stage, 'planning');
});

test('driver chooses shape-plan after lastRunResult returned NOT READY', () => {
  const tempDir = mkTempDir();
  const runDir = path.join(tempDir, '.fgos', 'assignments', 'asgn_val_nr', 'runs', '01');
  fs.mkdirSync(runDir, { recursive: true });
  const reportPath = path.join(runDir, 'agent-report.md');
  fs.writeFileSync(
    reportPath,
    '# Reality Gate & Feasibility Report\n' +
      '## Reality Gate Score\n' +
      '- Mode fit: PASS (citation: src/runner/dispatch/operation-choice.mjs)\n' +
      '- Repo fit: PASS (citation: src/runner/dispatch/operation-choice.mjs)\n' +
      '- Assumptions: PASS (citation: src/runner/dispatch/operation-choice.mjs)\n' +
      '- Smaller path: PASS (citation: src/runner/dispatch/operation-choice.mjs)\n' +
      '- Proof surface: PASS (citation: src/runner/dispatch/operation-choice.mjs)\n' +
      '- Impact-analysis posture: PASS (citation: src/runner/dispatch/operation-choice.mjs)\n' +
      '## Feasibility Matrix\n- Feasible (citation: src/runner/dispatch/operation-choice.mjs)\n'
  );

  const work = { id: 'tsk-not-ready', stage: 'planning', domain: 'coding' };
  const lastRunResult = {
    status: 'done',
    confidence: 'reported',
    runtime: { stdoutLog: path.join(runDir, 'stdout.log') },
    agentClaim: {
      status: 'done',
      verdict: 'NOT READY - RETURN TO PLANNING',
      summary: 'Gaps found',
      realityGate: {
        'mode-fit': 'PASS (citation: src/runner/dispatch/operation-choice.mjs)',
        'repo-fit': 'PASS (citation: src/runner/dispatch/operation-choice.mjs)',
        'assumptions-fit': 'PASS (citation: src/runner/dispatch/operation-choice.mjs)',
        'smaller-path-fit': 'PASS (citation: src/runner/dispatch/operation-choice.mjs)',
        'proof-surface-fit': 'PASS (citation: src/runner/dispatch/operation-choice.mjs)',
        'impact-analysis-posture': 'PASS (citation: src/runner/dispatch/operation-choice.mjs)',
      },
      feasibilityMatrix: [{ risk: 'low', citation: 'src/runner/dispatch/operation-choice.mjs' }],
    },
    evidence: {
      artifacts: [reportPath],
    },
  };

  const choice = chooseStageOperation({
    work,
    lastRunResult,
    contextSignals: { hasPlan: true },
    repoRoot: tempDir,
  });

  assert.equal(choice.operation, 'shape-plan');
  assert.equal(choice.dispatch, 'direct-stage-skill');
  assert.equal(choice.canAdvanceEdge, false);
  assert.equal(choice.reason, 'validation-returned-to-planning');
});

test('human-only operation is refused from auto-dispatch', () => {
  const work = { id: 'tsk-human-op', stage: 'exploring', domain: 'coding' };
  const ops = operationsForStage('coding', 'exploring', { kind: 'feature' });

  const choice = chooseStageOperation({
    work,
    availableOperations: ops,
    contextSignals: { secondaryOperation: 'answer-question' },
  });

  assert.equal(choice.operation, 'answer-question');
  assert.equal(choice.dispatch, 'human-only');
  assert.equal(choice.stop, true);
});

test('Step 06 planning.validate-plan runs as Work-attached Assignment and stores assignment/run/result files', async () => {
  const tempDir = mkTempDir();
  seedTaskSpecs(tempDir, ['validate-plan']);
  const executorScript = writeFakeExecutor(tempDir, {
    status: 'done',
    verdict: 'READY',
    summary: 'READY',
  });

  const work = {
    id: 'tsk-step06-plan',
    status: 'doing',
    stage: 'planning',
    domain: 'coding',
    workflow: 'feature',
  };
  const choice = chooseStageOperation({
    work,
    contextSignals: { hasPlan: true, validationDue: true },
  });

  const outcome = await executeDriverOperationChoice(work, choice, {
    cwd: tempDir,
    repoRoot: tempDir,
    runnerConfig: runnerConfigFor(executorScript),
  });

  assert.equal(outcome.executed, true);
  assert.equal(outcome.dispatchType, 'assignment');
  assert.equal(outcome.assignment.workId, work.id);
  assert.equal(outcome.assignment.stage, 'planning');
  assert.equal(outcome.assignment.operation, 'validate-plan');
  assert.equal(outcome.runResult.confidence, 'reported');
  assert.equal(outcome.canAdvanceEdge, true);
  assert.equal(outcome.reason, 'validate-plan-ready');
  assertAssignmentRunFiles(tempDir, outcome.assignment.assignmentId);

  assert.equal(work.status, 'doing');
  assert.equal(work.stage, 'planning');
});

test('Step 06 planning.validate-plan no-evidence stops safely and does not advance Work', async () => {
  const tempDir = mkTempDir();
  seedTaskSpecs(tempDir, ['validate-plan']);
  const executorScript = writeNoEvidenceExecutor(tempDir);
  const work = { id: 'tsk-step06-noev', status: 'doing', stage: 'planning', domain: 'coding' };
  const choice = chooseStageOperation({
    work,
    contextSignals: { hasPlan: true, validationDue: true },
  });

  const outcome = await executeDriverOperationChoice(work, choice, {
    cwd: tempDir,
    repoRoot: tempDir,
    runnerConfig: runnerConfigFor(executorScript),
  });

  assert.equal(outcome.runResult.confidence, 'no-evidence');
  assert.equal(outcome.canAdvanceEdge, false);
  assert.equal(outcome.stop, true);
  assert.equal(outcome.reason, 'assignment-validate-plan-no-evidence');
  assert.equal(work.status, 'doing');
  assert.equal(work.stage, 'planning');
});

test('Step 06 planning.validate-plan failed stops safely and does not advance Work', async () => {
  const tempDir = mkTempDir();
  seedTaskSpecs(tempDir, ['validate-plan']);
  const executorScript = writeFailingExecutor(tempDir);
  const work = { id: 'tsk-step06-failed', status: 'doing', stage: 'planning', domain: 'coding' };
  const choice = chooseStageOperation({
    work,
    contextSignals: { hasPlan: true, validationDue: true },
  });

  const outcome = await executeDriverOperationChoice(work, choice, {
    cwd: tempDir,
    repoRoot: tempDir,
    runnerConfig: runnerConfigFor(executorScript),
  });

  assert.equal(outcome.runResult.confidence, 'failed');
  assert.equal(outcome.canAdvanceEdge, false);
  assert.equal(outcome.stop, true);
  assert.equal(outcome.reason, 'assignment-validate-plan-failed');
  assert.equal(work.status, 'doing');
  assert.equal(work.stage, 'planning');
});

test('Step 06 planning.validate-plan READY WITH CONSTRAINTS requires recorded constraints before advancing edge', () => {
  const tempDir = mkTempDir();
  const runDir = path.join(tempDir, '.fgos', 'assignments', 'asgn_val_rwc', 'runs', '01');
  fs.mkdirSync(runDir, { recursive: true });
  const reportPath = path.join(runDir, 'agent-report.md');
  fs.writeFileSync(
    reportPath,
    '# Reality Gate & Feasibility Report\n' +
      '## Reality Gate Score\n' +
      '- Mode fit: PASS (citation: src/runner/dispatch/operation-choice.mjs)\n' +
      '- Repo fit: PASS (citation: src/runner/dispatch/operation-choice.mjs)\n' +
      '- Assumptions: PASS (citation: src/runner/dispatch/operation-choice.mjs)\n' +
      '- Smaller path: PASS (citation: src/runner/dispatch/operation-choice.mjs)\n' +
      '- Proof surface: PASS (citation: src/runner/dispatch/operation-choice.mjs)\n' +
      '- Impact-analysis posture: PASS (citation: src/runner/dispatch/operation-choice.mjs)\n' +
      '## Feasibility Matrix\n- Feasible (citation: src/runner/dispatch/operation-choice.mjs)\n'
  );

  const lastRunResult = {
    status: 'done',
    confidence: 'reported',
    runtime: { stdoutLog: path.join(runDir, 'stdout.log') },
    agentClaim: {
      status: 'done',
      verdict: 'READY WITH CONSTRAINTS',
      summary: 'Proceed only after constraints are captured',
      realityGate: {
        'mode-fit': 'PASS (citation: src/runner/dispatch/operation-choice.mjs)',
        'repo-fit': 'PASS (citation: src/runner/dispatch/operation-choice.mjs)',
        'assumptions-fit': 'PASS (citation: src/runner/dispatch/operation-choice.mjs)',
        'smaller-path-fit': 'PASS (citation: src/runner/dispatch/operation-choice.mjs)',
        'proof-surface-fit': 'PASS (citation: src/runner/dispatch/operation-choice.mjs)',
        'impact-analysis-posture': 'PASS (citation: src/runner/dispatch/operation-choice.mjs)',
      },
      feasibilityMatrix: [{ risk: 'low', citation: 'src/runner/dispatch/operation-choice.mjs' }],
    },
    evidence: { 
      artifacts: [reportPath],
    },
  };

  const blocked = interpretAssignmentRunResult({
    choice: { operation: 'validate-plan' },
    runResult: lastRunResult,
    repoRoot: tempDir,
  });
  assert.equal(blocked.canAdvanceEdge, false);
  assert.equal(blocked.stop, true);

  const accepted = interpretAssignmentRunResult({
    choice: { operation: 'validate-plan' },
    runResult: lastRunResult,
    contextSignals: { constraintsWritten: true },
    repoRoot: tempDir,
  });
  assert.equal(accepted.canAdvanceEdge, true);
  assert.equal(accepted.stop, false);
});

test('Step 06 planning.validate-plan bare done claim without verdict cannot advance Work', () => {
  const tempDir = mkTempDir();
  const runDir = path.join(tempDir, '.fgos', 'assignments', 'asgn_val_bare', 'runs', '01');
  fs.mkdirSync(runDir, { recursive: true });
  const reportPath = path.join(runDir, 'agent-report.md');
  fs.writeFileSync(
    reportPath,
    '# Reality Gate & Feasibility Report\n' +
      '## Reality Gate Score\n' +
      '- Mode fit: PASS (citation: src/runner/dispatch/operation-choice.mjs)\n' +
      '- Repo fit: PASS (citation: src/runner/dispatch/operation-choice.mjs)\n' +
      '- Assumptions: PASS (citation: src/runner/dispatch/operation-choice.mjs)\n' +
      '- Smaller path: PASS (citation: src/runner/dispatch/operation-choice.mjs)\n' +
      '- Proof surface: PASS (citation: src/runner/dispatch/operation-choice.mjs)\n' +
      '- Impact-analysis posture: PASS (citation: src/runner/dispatch/operation-choice.mjs)\n' +
      '## Feasibility Matrix\n- Feasible (citation: src/runner/dispatch/operation-choice.mjs)\n'
  );

  const choice = chooseStageOperation({
    work: { id: 'tsk-weak-result', stage: 'planning', domain: 'coding' },
    contextSignals: { hasPlan: true },
    repoRoot: tempDir,
    lastRunResult: {
      status: 'done',
      confidence: 'reported',
      runtime: { stdoutLog: path.join(runDir, 'stdout.log') },
      agentClaim: {
        status: 'done',
        summary: 'Looks acceptable',
        realityGate: {
          'mode-fit': 'PASS (citation: src/runner/dispatch/operation-choice.mjs)',
          'repo-fit': 'PASS (citation: src/runner/dispatch/operation-choice.mjs)',
          'assumptions-fit': 'PASS (citation: src/runner/dispatch/operation-choice.mjs)',
          'smaller-path-fit': 'PASS (citation: src/runner/dispatch/operation-choice.mjs)',
          'proof-surface-fit': 'PASS (citation: src/runner/dispatch/operation-choice.mjs)',
          'impact-analysis-posture': 'PASS (citation: src/runner/dispatch/operation-choice.mjs)',
        },
        feasibilityMatrix: [{ risk: 'low', citation: 'src/runner/dispatch/operation-choice.mjs' }],
      },
      evidence: { 
        artifacts: [reportPath],
      },
    },
  });

  assert.equal(choice.operation, 'validate-plan');
  assert.equal(choice.dispatch, 'assignment');
  assert.equal(choice.stop, true);
  assert.equal(choice.canAdvanceEdge, false);
  assert.equal(choice.reason, 'validate-plan-missing-structured-verdict');
});

test('Step 06 executing.review-item reject routes to fix operation without lifecycle movement', async () => {
  const tempDir = mkTempDir();
  fs.writeFileSync(path.join(tempDir, 'candidate-diff.patch'), 'diff --git a/src/main.js b/src/main.js\n');
  fs.writeFileSync(path.join(tempDir, 'verify.log'), 'VERIFY: FAIL\n');
  seedTaskSpecs(tempDir, ['review-item']);
  const executorScript = writeFakeExecutor(tempDir, {
    status: 'done',
    verdict: 'REJECT',
    summary: 'REJECT: verify failure needs a fix',
    evidenceRefs: ['evidence:candidate-diff', 'evidence:verify-fail'],
  });
  const work = {
    id: 'tsk-step06-review',
    status: 'doing',
    stage: 'executing',
    domain: 'coding',
    refs: ['evidence:candidate-diff', 'evidence:verify-fail'],
  };
  const choice = chooseStageOperation({
    work,
    contextSignals: { secondaryOperation: 'review-item' },
    repoRoot: tempDir,
  });

  const outcome = await executeDriverOperationChoice(work, choice, {
    cwd: tempDir,
    repoRoot: tempDir,
    runnerConfig: runnerConfigFor(executorScript),
    contextSignals: { secondaryOperation: 'review-item', candidateDiffContent: 'diff content', candidateVerifyContent: 'verify output' },
  });

  assert.equal(outcome.executed, true);
  assert.equal(outcome.dispatchType, 'assignment');
  assert.equal(outcome.assignment.operation, 'review-item');
  assert.equal(outcome.runResult.confidence, 'reported');
  assert.equal(outcome.canAdvanceEdge, false);
  assert.equal(outcome.stop, false);
  assert.equal(outcome.nextOperation, 'fix-verify-red');
  assert.equal(outcome.reason, 'review-item-rejected-route-fix');
  assertAssignmentRunFiles(tempDir, outcome.assignment.assignmentId);
  assert.equal(work.status, 'doing');
  assert.equal(work.stage, 'executing');
});

test('Step 06 executing.review-item approval is not a Work lifecycle edge', () => {
  const tempDir = mkTempDir();
  const runDir = path.join(tempDir, '.fgos', 'assignments', 'asgn_rev_appr', 'runs', '01');
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(path.join(tempDir, 'candidate-diff.patch'), 'diff --git a/src/a.js b/src/a.js\n');
  fs.writeFileSync(path.join(tempDir, 'verify.log'), 'VERIFY: PASS\n');
  const reportPath = path.join(runDir, 'agent-report.md');
  fs.writeFileSync(reportPath, '# Review Report\nAPPROVED: evidence:candidate-diff evidence:verify-pass clean evaluation\n');

  const interpreted = interpretAssignmentRunResult({
    choice: {
      operation: 'review-item',
      assignment: { contextRefs: ['evidence:candidate-diff', 'evidence:verify-pass'] },
    },
    runResult: {
      status: 'done',
      confidence: 'reported',
      runtime: { stdoutLog: path.join(runDir, 'stdout.log') },
      agentClaim: {
        status: 'done',
        verdict: 'APPROVED',
        summary: 'APPROVED',
        evidenceRefs: ['evidence:candidate-diff', 'evidence:verify-pass'],
      },
      evidence: {
        artifacts: [reportPath],
      },
    },
    repoRoot: tempDir,
  });

  assert.equal(interpreted.canAdvanceEdge, false);
  assert.equal(interpreted.stop, false);
  assert.equal(interpreted.reason, 'review-item-approved');
});

test('Step 06 executing.review-item Herdr and visibility tracking fields do not alter confidence ladder judgment', () => {
  const tempDir = mkTempDir();
  const runDir = path.join(tempDir, '.fgos', 'assignments', 'asgn_rev_herdr', 'runs', '01');
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(path.join(tempDir, 'candidate-diff.patch'), 'diff --git a/src/a.js b/src/a.js\n');
  fs.writeFileSync(path.join(tempDir, 'verify.log'), 'VERIFY: PASS\n');
  const approveReportPath = path.join(runDir, 'agent-report.md');
  fs.writeFileSync(approveReportPath, '# Review Report\nAPPROVED: evidence:candidate-diff evidence:verify-pass clean evaluation\n');

  const choice = {
    operation: 'review-item',
    assignment: { contextRefs: ['evidence:candidate-diff', 'evidence:verify-pass'] },
  };

  const interpretedApproved = interpretAssignmentRunResult({
    choice,
    runResult: {
      status: 'done',
      confidence: 'reported',
      runtime: { stdoutLog: path.join(runDir, 'stdout.log') },
      agentClaim: {
        status: 'done',
        verdict: 'APPROVED',
        summary: 'APPROVED',
        evidenceRefs: ['evidence:candidate-diff', 'evidence:verify-pass'],
        herdrStatus: 'active',
        herdrPane: 'pane-42',
        visibility: 'internal',
      },
      evidence: { artifacts: [approveReportPath] },
    },
    repoRoot: tempDir,
  });
  assert.equal(interpretedApproved.canAdvanceEdge, false);
  assert.equal(interpretedApproved.stop, false);
  assert.equal(interpretedApproved.canProceed, true);
  assert.equal(interpretedApproved.reason, 'review-item-approved');

  const rejectReportPath = path.join(runDir, 'agent-report-reject.md');
  fs.writeFileSync(rejectReportPath, '# Review Report\nREJECT: evidence:candidate-diff evidence:verify-pass finding needs work\n');

  const interpretedRejected = interpretAssignmentRunResult({
    choice,
    runResult: {
      status: 'done',
      confidence: 'reported',
      runtime: { stdoutLog: path.join(runDir, 'stdout.log') },
      agentClaim: {
        status: 'done',
        verdict: 'REJECT',
        summary: 'REJECT',
        evidenceRefs: ['evidence:candidate-diff', 'evidence:verify-pass'],
        herdrStatus: 'stale',
        herdrPane: 'pane-99',
        visibility: 'external',
      },
      evidence: { artifacts: [rejectReportPath] },
    },
    repoRoot: tempDir,
  });
  assert.equal(interpretedRejected.canAdvanceEdge, false);
  assert.equal(interpretedRejected.stop, false);
  assert.equal(interpretedRejected.nextOperation, 'fix-verify-red');
  assert.equal(interpretedRejected.reason, 'review-item-rejected-route-fix');
});

test('validate-plan and review-item require report artifact and fail closed when missing', () => {
  const tempDir = mkTempDir();
  fs.writeFileSync(path.join(tempDir, 'candidate-diff.patch'), 'diff --git a/src/a.js b/src/a.js\n');
  fs.writeFileSync(path.join(tempDir, 'verify.log'), 'VERIFY: PASS\n');

  const choiceValidate = { operation: 'validate-plan' };
  const resValidateNoArt = interpretAssignmentRunResult({
    choice: choiceValidate,
    runResult: {
      status: 'done',
      confidence: 'reported',
      agentClaim: { status: 'done', verdict: 'READY', summary: 'Feasible' },
      evidence: { artifacts: ['agent-result.json'] },
    },
  });
  assert.equal(resValidateNoArt.canAdvanceEdge, false);
  assert.equal(resValidateNoArt.stop, true);
  assert.equal(resValidateNoArt.reason, 'validate-plan-missing-report-artifact');

  const choiceReview = {
    operation: 'review-item',
    assignment: { contextRefs: ['evidence:candidate-diff', 'evidence:verify-pass'] },
  };
  const resReviewNoArt = interpretAssignmentRunResult({
    choice: choiceReview,
    runResult: {
      status: 'done',
      confidence: 'reported',
      agentClaim: {
        status: 'done',
        verdict: 'APPROVED',
        summary: 'Clean code',
        evidenceRefs: ['evidence:candidate-diff', 'evidence:verify-pass'],
      },
      evidence: { artifacts: ['agent-result.json'] },
    },
    repoRoot: tempDir,
  });
  assert.equal(resReviewNoArt.canAdvanceEdge, false);
  assert.equal(resReviewNoArt.stop, true);
  assert.equal(resReviewNoArt.reason, 'review-item-missing-report-artifact');
});

test('Step 06 executing.review-item evidenceRefs must be bound to provided contextRefs or work.refs', () => {
  const tempDir = mkTempDir();
  const runDir = path.join(tempDir, '.fgos', 'assignments', 'asgn_rev_bound', 'runs', '01');
  fs.mkdirSync(runDir, { recursive: true });
  const reportPath = path.join(runDir, 'agent-report.md');
  fs.writeFileSync(reportPath, '# Review Report\nAPPROVED: diff:custom-candidate-diff verify:custom-verify-pass clean evaluation\n');

  const choiceWithProvidedRefs = {
    operation: 'review-item',
    assignment: { contextRefs: ['diff:custom-candidate-diff', 'verify:custom-verify-pass'] },
  };

  // 1. No refs provided in claim
  const interpretedNoRefs = interpretAssignmentRunResult({
    choice: choiceWithProvidedRefs,
    runResult: {
      status: 'done',
      confidence: 'reported',
      runtime: { stdoutLog: path.join(runDir, 'stdout.log') },
      agentClaim: { status: 'done', verdict: 'APPROVED', summary: 'Clean code' },
      evidence: { artifacts: [reportPath] },
    },
    repoRoot: tempDir,
  });
  assert.equal(interpretedNoRefs.stop, true);
  assert.equal(interpretedNoRefs.reason, 'review-item-missing-evidence-refs');

  // 2. Unprovided sentinel names returned when not in assignment contextRefs
  const interpretedUnprovidedSentinels = interpretAssignmentRunResult({
    choice: choiceWithProvidedRefs,
    runResult: {
      status: 'done',
      confidence: 'reported',
      agentClaim: {
        status: 'done',
        verdict: 'APPROVED',
        summary: 'Clean code',
        evidenceRefs: ['evidence:candidate-diff', 'evidence:verify-pass'],
      },
      evidence: { artifacts: ['agent-report.md'] },
    },
  });
  assert.equal(interpretedUnprovidedSentinels.stop, true);
  assert.equal(interpretedUnprovidedSentinels.reason, 'review-item-missing-evidence-refs');

  // 3. Unrelated/fake refs
  const interpretedFakeRefs = interpretAssignmentRunResult({
    choice: choiceWithProvidedRefs,
    runResult: {
      status: 'done',
      confidence: 'reported',
      agentClaim: {
        status: 'done',
        verdict: 'APPROVED',
        summary: 'Clean code',
        evidenceRefs: ['fake-diff', 'fake-test'],
      },
      evidence: { artifacts: ['agent-report.md'] },
    },
  });
  assert.equal(interpretedFakeRefs.stop, true);
  assert.equal(interpretedFakeRefs.reason, 'review-item-missing-evidence-refs');

  // 4. Exact provided refs returned with real candidate evidence
  fs.writeFileSync(path.join(tempDir, 'custom-candidate-diff'), 'diff --git a/a.js b/a.js\n');
  fs.writeFileSync(path.join(tempDir, 'custom-verify-pass'), 'VERIFY: PASS\n');
  const interpretedValidBoundRefs = interpretAssignmentRunResult({
    choice: choiceWithProvidedRefs,
    runResult: {
      status: 'done',
      confidence: 'reported',
      runtime: { stdoutLog: path.join(runDir, 'stdout.log') },
      agentClaim: {
        status: 'done',
        verdict: 'APPROVED',
        summary: 'Clean code',
        evidenceRefs: ['diff:custom-candidate-diff', 'verify:custom-verify-pass'],
      },
      evidence: {
        artifacts: [reportPath],
      },
    },
    repoRoot: tempDir,
  });
  assert.equal(interpretedValidBoundRefs.canProceed, true);
  assert.equal(interpretedValidBoundRefs.reason, 'review-item-approved');
});

test('driver loop runOnce: validate-plan no-evidence keeps Work in planning without advancing stage', async () => {
  const tempDir = mkTempDir();
  initRepo(tempDir);
  initStore(tempDir);
  seedTaskSpecs(tempDir, ['validate-plan', 'shape-plan']);

  const docsDir = path.join(tempDir, 'docs', 'history', 'feat-noev');
  fs.mkdirSync(docsDir, { recursive: true });
  fs.writeFileSync(path.join(docsDir, 'plan.md'), '# Mode: tiny\nProposed plan.\n');

  addWork(tempDir, {
    id: 'tsk-driver-noev',
    title: 'Test no evidence driver loop',
    stage: 'planning',
    status: 'todo',
    domain: 'coding',
    workflow: 'feature',
    kind: 'feature',
    risk: 'standard',
    deps: [],
    refs: [],
    verify: 'node -e "process.exit(0)"',
    docsRef: 'docs/history/feat-noev',
  });

  const executorScript = writeNoEvidenceExecutor(tempDir);
  const cfg = runnerConfigFor(executorScript);

  await runOnce({ dir: tempDir, repoRoot: tempDir, config: cfg });

  const item = listWork(tempDir).work['tsk-driver-noev'];
  assert.equal(item.stage, 'planning');
});

test('driver loop runOnce: validate-plan failed keeps Work in planning without advancing stage', async () => {
  const tempDir = mkTempDir();
  initRepo(tempDir);
  initStore(tempDir);
  seedTaskSpecs(tempDir, ['validate-plan', 'shape-plan']);

  const docsDir = path.join(tempDir, 'docs', 'history', 'feat-fail');
  fs.mkdirSync(docsDir, { recursive: true });
  fs.writeFileSync(path.join(docsDir, 'plan.md'), '# Mode: tiny\nProposed plan.\n');

  addWork(tempDir, {
    id: 'tsk-driver-fail',
    title: 'Test failed driver loop',
    stage: 'planning',
    status: 'todo',
    domain: 'coding',
    workflow: 'feature',
    kind: 'feature',
    risk: 'standard',
    deps: [],
    refs: [],
    verify: 'node -e "process.exit(0)"',
    docsRef: 'docs/history/feat-fail',
  });

  const executorScript = writeFailingExecutor(tempDir);
  const cfg = runnerConfigFor(executorScript);

  await runOnce({ dir: tempDir, repoRoot: tempDir, config: cfg });

  const item = listWork(tempDir).work['tsk-driver-fail'];
  assert.equal(item.stage, 'planning');
});

test('driver loop runOnce: validate-plan reported READY advances Work from planning to executing', async () => {
  const tempDir = mkTempDir();
  initRepo(tempDir);
  initStore(tempDir);
  seedTaskSpecs(tempDir, ['validate-plan', 'shape-plan']);

  const docsDir = path.join(tempDir, 'docs', 'history', 'feat-ready');
  fs.mkdirSync(docsDir, { recursive: true });
  fs.writeFileSync(path.join(docsDir, 'plan.md'), '# Mode: tiny\nProposed plan.\n');

  addWork(tempDir, {
    id: 'tsk-driver-ready',
    title: 'Test ready driver loop',
    stage: 'planning',
    status: 'todo',
    domain: 'coding',
    workflow: 'feature',
    kind: 'feature',
    risk: 'standard',
    deps: [],
    refs: [],
    verify: 'node -e "process.exit(0)"',
    docsRef: 'docs/history/feat-ready',
  });

  const executorScript = writeFakeExecutor(tempDir, { status: 'done', verdict: 'READY', summary: 'Plan validated' });
  const cfg = runnerConfigFor(executorScript);

  await runOnce({ dir: tempDir, repoRoot: tempDir, config: cfg });

  const item = listWork(tempDir).work['tsk-driver-ready'];
  assert.equal(item.stage, 'executing');
});

test('buildAssignment populates contextRefs and expectedOutputs when work has docsRef (Finding 1)', () => {
  const work = {
    id: 'tsk-refs-1',
    stage: 'planning',
    domain: 'coding',
    workflow: 'feature',
    docsRef: 'docs/history/feat-refs',
    refs: ['extra-ref.txt'],
  };
  const assignment = buildAssignment({
    work,
    stage: 'planning',
    operation: 'validate-plan',
  });

  assert.ok(assignment.contextRefs.includes('docs/history/feat-refs'));
  assert.ok(assignment.contextRefs.includes(path.join('docs/history/feat-refs', 'plan.md')));
  assert.ok(assignment.contextRefs.includes(path.join('docs/history/feat-refs', 'CONTEXT.md')));
  assert.ok(assignment.contextRefs.includes('extra-ref.txt'));
  assert.ok(assignment.expectedOutputs.some((o) => o.includes('agent-result.json')));
});

test('executeAssignment rejects execution of an undeclared operation (Finding 3)', async () => {
  const tempDir = mkTempDir();
  initRepo(tempDir);
  initStore(tempDir);

  const invalidAsgn = {
    assignmentId: 'asgn_invalid_op',
    domain: 'coding',
    workflow: 'feature',
    stage: 'planning',
    operation: 'nonexistent-operation',
    dispatch: 'assignment',
    taskSpec: 'validate-plan.md',
  };

  try {
    await executeAssignment(invalidAsgn, { cwd: tempDir, repoRoot: tempDir });
    assert.fail('should have thrown');
  } catch (err) {
    assert.ok(err.message.includes('unknown operation') || err.message.includes('nonexistent-operation'), `Unexpected error: ${err.message}`);
  }
});

test('executeAssignment re-checks legality after loading persisted assignment.json (Finding 4)', async () => {
  const tempDir = mkTempDir();
  initRepo(tempDir);
  initStore(tempDir);

  const asgnId = 'asgn_persisted_check';
  const asgnDir = path.join(tempDir, '.fgos', 'assignments', asgnId);
  fs.mkdirSync(asgnDir, { recursive: true });

  const tamperedAsgn = {
    assignmentId: asgnId,
    domain: 'coding',
    workflow: 'feature',
    stage: 'exploring',
    operation: 'answer-question',
    dispatch: 'human-only',
    taskSpec: 'answer-question.md',
  };
  fs.writeFileSync(path.join(asgnDir, 'assignment.json'), JSON.stringify(tamperedAsgn, null, 2));

  const memoryAsgn = {
    assignmentId: asgnId,
    domain: 'coding',
    workflow: 'feature',
    stage: 'planning',
    operation: 'validate-plan',
    dispatch: 'assignment',
    taskSpec: 'validate-plan.md',
  };

  try {
    await executeAssignment(memoryAsgn, { cwd: tempDir, repoRoot: tempDir });
    assert.fail('should have thrown');
  } catch (err) {
    assert.ok(err.message.includes('human-only'), `Unexpected error: ${err.message}`);
  }
});

test('chooseStageOperation accepts domain passed as object without throwing or warning (Finding 5)', () => {
  const domainObj = { name: 'coding', stages: ['discovery', 'planning', 'executing'] };
  const choice = chooseStageOperation({
    work: { id: 'tsk-dom-obj', stage: 'planning' },
    stage: 'planning',
    domain: domainObj,
    workflow: 'feature',
  });

  assert.equal(choice.operation, 'shape-plan');
  assert.equal(choice.dispatch, 'direct-stage-skill');
});

test('driver loop runOnce: validate-plan with READY ignores reviewer verdictPayload "decompose" and does not create children (Finding 1 fix)', async () => {
  const tempDir = mkTempDir();
  initRepo(tempDir);
  initStore(tempDir);
  seedTaskSpecs(tempDir, ['validate-plan', 'shape-plan']);

  const docsDir = path.join(tempDir, 'docs', 'history', 'feat-decomp');
  fs.mkdirSync(docsDir, { recursive: true });
  fs.writeFileSync(path.join(docsDir, 'plan.md'), '# Mode: standard\nProposed plan with split.\n');

  addWork(tempDir, {
    id: 'tsk-driver-decomp',
    title: 'Test decompose driver loop',
    stage: 'planning',
    status: 'todo',
    domain: 'coding',
    workflow: 'feature',
    kind: 'feature',
    risk: 'standard',
    deps: [],
    refs: [],
    verify: 'node -e "process.exit(0)"',
    docsRef: 'docs/history/feat-decomp',
  });

  const children = [
    { title: 'Subtask A', verify: 'node -e "process.exit(0)"', action: 'Implement part A', footprint: ['src/a.js'] },
    { title: 'Subtask B', verify: 'node -e "process.exit(0)"', action: 'Implement part B', footprint: ['src/b.js'] },
  ];
  const executorScript = writeFakeExecutor(tempDir, {
    status: 'done',
    verdict: 'READY',
    verdictPayload: { verdict: 'decompose', reason: 'Split plan into 2 subtasks', children },
    children,
  });
  const cfg = runnerConfigFor(executorScript);

  await runOnce({ dir: tempDir, repoRoot: tempDir, config: cfg });

  const view = listWork(tempDir);
  const rootItem = view.work['tsk-driver-decomp'];
  assert.equal(rootItem.stage, 'planning');

  const childItems = Object.values(view.work).filter((w) => w.id.startsWith('tsk-driver-decomp-'));
  assert.equal(childItems.length, 0);
});

test('driver loop runOnce: validate-plan with READY ignores reviewer verdictPayload "need-human" and does not park item (Finding 1 fix)', async () => {
  const tempDir = mkTempDir();
  initRepo(tempDir);
  initStore(tempDir);
  seedTaskSpecs(tempDir, ['validate-plan', 'shape-plan']);

  const docsDir = path.join(tempDir, 'docs', 'history', 'feat-human');
  fs.mkdirSync(docsDir, { recursive: true });
  fs.writeFileSync(path.join(docsDir, 'plan.md'), '# Mode: standard\nProposed plan needing human.\n');

  addWork(tempDir, {
    id: 'tsk-driver-human',
    title: 'Test human driver loop',
    stage: 'planning',
    status: 'todo',
    domain: 'coding',
    workflow: 'feature',
    kind: 'feature',
    risk: 'standard',
    deps: [],
    refs: [],
    verify: 'node -e "process.exit(0)"',
    docsRef: 'docs/history/feat-human',
  });

  const executorScript = writeFakeExecutor(tempDir, {
    status: 'done',
    verdict: 'READY',
    verdictPayload: { verdict: 'need-human', reason: 'High risk architecture decision needed' },
  });
  const cfg = runnerConfigFor(executorScript);

  await runOnce({ dir: tempDir, repoRoot: tempDir, config: cfg });

  const item = listWork(tempDir).work['tsk-driver-human'];
  assert.equal(item.status, 'todo');
  assert.equal(item.stage, 'planning');
});

test('driver loop runOnce: validate-plan with READY WITH CONSTRAINTS and worker self-claim alone STOPS in planning (Finding P2 fix)', async () => {
  const tempDir = mkTempDir();
  initRepo(tempDir);
  initStore(tempDir);
  seedTaskSpecs(tempDir, ['validate-plan', 'shape-plan']);

  const docsDir = path.join(tempDir, 'docs', 'history', 'feat-unrecorded');
  fs.mkdirSync(docsDir, { recursive: true });
  fs.writeFileSync(path.join(docsDir, 'plan.md'), '# Mode: tiny\nPlan without constraints section.\n');

  addWork(tempDir, {
    id: 'tsk-driver-unrecorded',
    title: 'Test unrecorded constraints driver loop',
    stage: 'planning',
    status: 'todo',
    domain: 'coding',
    workflow: 'feature',
    kind: 'feature',
    risk: 'standard',
    deps: [],
    refs: [],
    verify: 'node -e "process.exit(0)"',
    docsRef: 'docs/history/feat-unrecorded',
  });

  const executorScript = writeFakeExecutor(tempDir, {
    status: 'done',
    verdict: 'READY WITH CONSTRAINTS',
    constraintsWritten: true,
    summary: 'Plan feasible with limits but unrecorded in plan.md',
  });
  const cfg = runnerConfigFor(executorScript);

  await runOnce({ dir: tempDir, repoRoot: tempDir, config: cfg });

  const item = listWork(tempDir).work['tsk-driver-unrecorded'];
  assert.equal(item.stage, 'planning');
});

test('driver loop runOnce: validate-plan modifying dirty-before plan.md fails closed and does not advance Work (Finding 2 fix)', async () => {
  const tempDir = mkTempDir();
  initRepo(tempDir);
  initStore(tempDir);
  seedTaskSpecs(tempDir, ['validate-plan', 'shape-plan']);

  const docsDir = path.join(tempDir, 'docs', 'history', 'feat-recorded');
  fs.mkdirSync(docsDir, { recursive: true });
  fs.writeFileSync(path.join(docsDir, 'plan.md'), '# Mode: tiny\nPlan with constraints.\n');

  addWork(tempDir, {
    id: 'tsk-driver-recorded',
    title: 'Test recorded constraints driver loop',
    stage: 'planning',
    status: 'todo',
    domain: 'coding',
    workflow: 'feature',
    kind: 'feature',
    risk: 'standard',
    deps: [],
    refs: [],
    verify: 'node -e "process.exit(0)"',
    docsRef: 'docs/history/feat-recorded',
  });

  const executorScript = writeFakeExecutor(tempDir, {
    status: 'done',
    verdict: 'READY WITH CONSTRAINTS',
    appendConstraintsToPlan: true,
    summary: 'Plan feasible with limits recorded in plan.md',
  });
  const cfg = runnerConfigFor(executorScript);

  await runOnce({ dir: tempDir, repoRoot: tempDir, config: cfg });

  const item = listWork(tempDir).work['tsk-driver-recorded'];
  assert.equal(item.stage, 'planning');
});

test('interpretAssignmentRunResult maps REJECTED verdict to NOT READY - RETURN TO PLANNING (Finding 3)', () => {
  const tempDir = mkTempDir();
  const runDir = path.join(tempDir, '.fgos', 'assignments', 'asgn_val_reject', 'runs', '01');
  fs.mkdirSync(runDir, { recursive: true });
  const reportPath = path.join(runDir, 'agent-report.md');
  fs.writeFileSync(
    reportPath,
    '# Reality Gate & Feasibility Report\n' +
      '## Reality Gate Score\n' +
      '- Mode fit: PASS (citation: src/runner/dispatch/operation-choice.mjs)\n' +
      '- Repo fit: PASS (citation: src/runner/dispatch/operation-choice.mjs)\n' +
      '- Assumptions: PASS (citation: src/runner/dispatch/operation-choice.mjs)\n' +
      '- Smaller path: PASS (citation: src/runner/dispatch/operation-choice.mjs)\n' +
      '- Proof surface: PASS (citation: src/runner/dispatch/operation-choice.mjs)\n' +
      '- Impact-analysis posture: PASS (citation: src/runner/dispatch/operation-choice.mjs)\n' +
      '## Feasibility Matrix\n- Feasible (citation: src/runner/dispatch/operation-choice.mjs)\n'
  );

  const res = interpretAssignmentRunResult({
    choice: { operation: 'validate-plan' },
    runResult: {
      status: 'done',
      confidence: 'reported',
      runtime: { stdoutLog: path.join(runDir, 'stdout.log') },
      agentClaim: {
        status: 'done',
        verdict: 'REJECTED',
        summary: 'Plan rejected',
        realityGate: {
          'mode-fit': 'PASS (citation: src/runner/dispatch/operation-choice.mjs)',
          'repo-fit': 'PASS (citation: src/runner/dispatch/operation-choice.mjs)',
          'assumptions-fit': 'PASS (citation: src/runner/dispatch/operation-choice.mjs)',
          'smaller-path-fit': 'PASS (citation: src/runner/dispatch/operation-choice.mjs)',
          'proof-surface-fit': 'PASS (citation: src/runner/dispatch/operation-choice.mjs)',
          'impact-analysis-posture': 'PASS (citation: src/runner/dispatch/operation-choice.mjs)',
        },
        feasibilityMatrix: [{ risk: 'low', citation: 'src/runner/dispatch/operation-choice.mjs' }],
      },
      evidence: {
        artifacts: [reportPath],
      },
    },
    repoRoot: tempDir,
  });

  assert.equal(res.canAdvanceEdge, false);
  assert.equal(res.nextOperation, 'shape-plan');
  assert.equal(res.reason, 'validate-plan-return-to-planning');
});

test('Step 06 executing.scout-blast-radius report with fake executor stores all assignment/run/result files and does not mutate Work', async () => {
  const tempDir = mkTempDir();
  seedTaskSpecs(tempDir, ['scout-blast-radius']);
  const executorScript = writeFakeExecutor(tempDir, {
    status: 'done',
    summary: 'Scouted 3 affected files and 2 exported symbols',
    findings: [{ file: 'src/core.js', symbol: 'execute' }],
  });
  const work = { id: 'tsk-step06-scout', status: 'doing', stage: 'executing', domain: 'coding' };
  const choice = chooseStageOperation({
    work,
    contextSignals: { secondaryOperation: 'scout-blast-radius' },
  });

  const outcome = await executeDriverOperationChoice(work, choice, {
    cwd: tempDir,
    repoRoot: tempDir,
    runnerConfig: runnerConfigFor(executorScript),
  });

  assert.equal(outcome.executed, true);
  assert.equal(outcome.dispatchType, 'assignment');
  assert.equal(outcome.assignment.operation, 'scout-blast-radius');
  assert.equal(outcome.runResult.confidence, 'reported');
  assert.equal(outcome.canAdvanceEdge, false);
  assert.equal(outcome.canProceed, true);
  assert.equal(outcome.reason, 'scout-blast-radius-reported');
  assertAssignmentRunFiles(tempDir, outcome.assignment.assignmentId);
  assert.equal(work.status, 'doing');
  assert.equal(work.stage, 'executing');
});

test('Step 06 executing.scout-blast-radius mutating repository state fails closed and stops driver execution', async () => {
  const tempDir = mkTempDir();
  initRepo(tempDir);
  seedTaskSpecs(tempDir, ['scout-blast-radius']);

  const executorScript = path.join(tempDir, 'mutating-scout-executor.mjs');
  fs.writeFileSync(
    executorScript,
    `
    import fs from 'node:fs';
    import path from 'node:path';
    const prompt = process.argv.slice(2).join(' ');
    const match = /Write structured JSON to (\\S+agent-result\\.json)/.exec(prompt);
    if (match) {
      const resultPath = match[1];
      const runDir = path.dirname(resultPath);
      fs.mkdirSync(runDir, { recursive: true });
      fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Scout Report\\nSymbol: chooseStageOperation in src/runner/dispatch/operation-choice.mjs\\nSearch posture: active rg cross-check\\n');
      fs.writeFileSync(resultPath, JSON.stringify({ status: 'done', summary: 'Scouted 2 symbols' }));
    }
    fs.writeFileSync(path.join(process.cwd(), 'accidental.txt'), 'unintended mutation\\n');
    process.exit(0);
    `,
  );

  const work = {
    id: 'tsk-scout-mutate',
    status: 'doing',
    stage: 'executing',
    domain: 'coding',
    secondaryOperation: 'scout-blast-radius',
  };

  const choice = chooseStageOperation({
    work,
    contextSignals: { secondaryOperation: 'scout-blast-radius' },
  });

  const outcome = await executeDriverOperationChoice(work, choice, {
    cwd: tempDir,
    repoRoot: tempDir,
    runnerConfig: runnerConfigFor(executorScript),
  });

  assert.equal(outcome.executed, true);
  assert.equal(outcome.runResult.confidence, 'failed');
  assert.equal(outcome.canAdvanceEdge, false);
  assert.equal(outcome.stop, true);
  assert.equal(outcome.reason, 'assignment-scout-blast-radius-failed');
});

test('Step 06 executing.scoped-subtask requires verified confidence (changed-file evidence) to proceed', () => {
  const reportedRes = interpretAssignmentRunResult({
    choice: { operation: 'scoped-subtask' },
    runResult: {
      status: 'done',
      confidence: 'reported',
      agentClaim: { status: 'done', summary: 'Subtask completed' },
    },
  });
  assert.equal(reportedRes.canAdvanceEdge, false);
  assert.equal(reportedRes.stop, true);
  assert.equal(reportedRes.canProceed, false);
  assert.equal(reportedRes.reason, 'scoped-subtask-requires-verified-evidence');

  const verifiedRes = interpretAssignmentRunResult({
    choice: { operation: 'scoped-subtask' },
    runResult: {
      status: 'done',
      confidence: 'verified',
      agentClaim: { status: 'done', summary: 'Subtask completed with git commit' },
    },
  });
  assert.equal(verifiedRes.canAdvanceEdge, false);
  assert.equal(verifiedRes.stop, false);
  assert.equal(verifiedRes.canProceed, true);
  assert.equal(verifiedRes.reason, 'scoped-subtask-verified');
});

test('Step 06 Cell 6.6 buildAssignment declares expectedFiles for scoped-subtask and persists it into assignment.json; omitted declaration defaults to empty array', async () => {
  const tempDir = mkTempDir();
  initRepo(tempDir);
  initStore(tempDir);
  seedTaskSpecs(tempDir, ['scoped-subtask']);

  const declared = buildAssignment({
    workId: 'tsk-scoped-declared',
    stage: 'executing',
    operation: 'scoped-subtask',
    expectedFiles: ['src/declared.mjs', 'src/other.mjs'],
    options: { repoRoot: tempDir },
  });
  assert.deepEqual(declared.expectedFiles, ['src/declared.mjs', 'src/other.mjs']);

  const undeclared = buildAssignment({
    workId: 'tsk-scoped-undeclared',
    stage: 'executing',
    operation: 'scoped-subtask',
    options: { repoRoot: tempDir },
  });
  assert.deepEqual(undeclared.expectedFiles, []);

  // Persisted verbatim into assignment.json by executeAssignment (immutable-input contract).
  const executorScript = writeFakeExecutor(tempDir, { status: 'done', summary: 'no-op subtask' });
  await executeAssignment(declared, { cwd: tempDir, repoRoot: tempDir, runnerConfig: runnerConfigFor(executorScript) });
  const persisted = JSON.parse(
    fs.readFileSync(path.join(tempDir, '.fgos', 'assignments', declared.assignmentId, 'assignment.json'), 'utf8'),
  );
  assert.deepEqual(persisted.expectedFiles, ['src/declared.mjs', 'src/other.mjs']);
});

test('Step 06 Cell 6.6 scoped-subtask refuses when helper touches an undeclared file', () => {
  const result = interpretAssignmentRunResult({
    choice: { operation: 'scoped-subtask', expectedFiles: ['src/a.mjs', 'src/b.mjs'] },
    runResult: {
      status: 'done',
      confidence: 'verified',
      agentClaim: { status: 'done', summary: 'Subtask completed' },
      evidence: { changedFiles: ['src/a.mjs', 'src/unexpected.mjs'] },
    },
  });
  assert.equal(result.canAdvanceEdge, false);
  assert.equal(result.stop, true);
  assert.equal(result.canProceed, false);
  assert.equal(result.reason, 'scoped-subtask-undeclared-files');
  assert.deepEqual(result.undeclaredFiles, ['src/unexpected.mjs']);
});

test('Step 06 Cell 6.6 scoped-subtask resolves verified when helper touches only declared files', () => {
  const result = interpretAssignmentRunResult({
    choice: { operation: 'scoped-subtask', expectedFiles: ['src/a.mjs', 'src/b.mjs'] },
    runResult: {
      status: 'done',
      confidence: 'verified',
      agentClaim: { status: 'done', summary: 'Subtask completed' },
      evidence: { changedFiles: ['src/a.mjs'] },
    },
  });
  assert.equal(result.canAdvanceEdge, false);
  assert.equal(result.stop, false);
  assert.equal(result.canProceed, true);
  assert.equal(result.reason, 'scoped-subtask-verified');
});

test('Step 06 Cell 6.6 scoped-subtask refuses when the declared footprint overlaps the caller\'s in-flight edits', () => {
  const tempDir = mkTempDir();
  const runDir = path.join(tempDir, '.fgos', 'assignments', 'asgn_overlap', 'runs', '01');
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(path.join(runDir, 'evidence.json'), JSON.stringify({ dirtyBefore: ['src/caller-dirty.mjs'] }, null, 2));

  const result = interpretAssignmentRunResult({
    choice: { operation: 'scoped-subtask', expectedFiles: ['src/caller-dirty.mjs'] },
    runResult: {
      status: 'done',
      confidence: 'verified',
      agentClaim: { status: 'done', summary: 'Subtask completed' },
      evidence: { changedFiles: [] },
      runtime: { stdoutLog: path.join(runDir, 'stdout.log') },
    },
    repoRoot: tempDir,
  });
  assert.equal(result.canAdvanceEdge, false);
  assert.equal(result.stop, true);
  assert.equal(result.canProceed, false);
  assert.equal(result.reason, 'scoped-subtask-overlaps-caller-edits');
  assert.deepEqual(result.overlappingFiles, ['src/caller-dirty.mjs']);
});

test('Step 06 Cell 6.6 scoped-subtask with no expectedFiles declared falls back to verified-confidence-only behavior', () => {
  const result = interpretAssignmentRunResult({
    choice: { operation: 'scoped-subtask' },
    runResult: {
      status: 'done',
      confidence: 'verified',
      agentClaim: { status: 'done', summary: 'Subtask completed' },
      evidence: { changedFiles: ['src/anything.mjs', 'src/whatever-else.mjs'] },
    },
  });
  assert.equal(result.stop, false);
  assert.equal(result.canProceed, true);
  assert.equal(result.reason, 'scoped-subtask-verified');
});

test('Step 06 Cell 6.6 fix-verify-red confidence check is unchanged after splitting the shared scoped-subtask/fix-verify-red branch', () => {
  const reportedRes = interpretAssignmentRunResult({
    choice: { operation: 'fix-verify-red' },
    runResult: { status: 'done', confidence: 'reported', agentClaim: { status: 'done', summary: 'Fixed' } },
  });
  assert.equal(reportedRes.canAdvanceEdge, false);
  assert.equal(reportedRes.stop, true);
  assert.equal(reportedRes.canProceed, false);
  assert.equal(reportedRes.reason, 'fix-verify-red-requires-verified-evidence');

  const verifiedRes = interpretAssignmentRunResult({
    choice: { operation: 'fix-verify-red' },
    runResult: { status: 'done', confidence: 'verified', agentClaim: { status: 'done', summary: 'Fixed with verify rerun' } },
  });
  assert.equal(verifiedRes.canAdvanceEdge, false);
  assert.equal(verifiedRes.stop, false);
  assert.equal(verifiedRes.canProceed, true);
  assert.equal(verifiedRes.reason, 'fix-verify-red-verified');

  // fix-verify-red must never apply scoped-subtask's footprint check, even when
  // expectedFiles/changedFiles happen to be present on the choice/runResult.
  const withFootprintFieldsPresent = interpretAssignmentRunResult({
    choice: { operation: 'fix-verify-red', expectedFiles: ['src/only.mjs'] },
    runResult: {
      status: 'done',
      confidence: 'verified',
      agentClaim: { status: 'done', summary: 'Fixed' },
      evidence: { changedFiles: ['src/only.mjs', 'src/unrelated.mjs'] },
    },
  });
  assert.equal(withFootprintFieldsPresent.stop, false);
  assert.equal(withFootprintFieldsPresent.canProceed, true);
  assert.equal(withFootprintFieldsPresent.reason, 'fix-verify-red-verified');
});

// The three tests below pin the real production-path shape for a
// buildAssignment-stamped Assignment (evidence.required: 'verified',
// stamped by assignment-normalizer.mjs for all three of these operations)
// reaching interpretAssignmentRunResult with confidence: 'reported'. The
// top-level confidence gate reads the stamped evidence.required and stops
// the dispatch there, so these never reach the branch-level
// '<op>-requires-verified-evidence' re-check below (that shape is reachable
// only for a bare choice with no stamped assignment, as the tests above
// exercise). This is the intended, real dispatch-path behavior, not a bug.
test('scoped-subtask: a real buildAssignment Assignment with reported confidence stops at the top-level gate, not the branch-level re-check', () => {
  const tempDir = mkTempDir();
  seedTaskSpecs(tempDir, ['scoped-subtask']);

  const assignment = buildAssignment({
    workId: 'tsk-scoped-topgate',
    stage: 'executing',
    operation: 'scoped-subtask',
    options: { repoRoot: tempDir },
  });

  const result = interpretAssignmentRunResult({
    choice: { operation: 'scoped-subtask', assignment },
    runResult: { status: 'done', confidence: 'reported' },
    repoRoot: tempDir,
  });

  assert.equal(result.canAdvanceEdge, false);
  assert.equal(result.stop, true);
  assert.equal(result.reason, 'assignment-scoped-subtask-insufficient-confidence');
  assert.equal(result.canProceed, undefined);
});

test('fix-verify-red: a real buildAssignment Assignment with reported confidence stops at the top-level gate, not the branch-level re-check', () => {
  const tempDir = mkTempDir();
  seedTaskSpecs(tempDir, ['fix-verify-red']);

  const assignment = buildAssignment({
    workId: 'tsk-fvr-topgate',
    stage: 'executing',
    operation: 'fix-verify-red',
    options: { repoRoot: tempDir },
  });

  const result = interpretAssignmentRunResult({
    choice: { operation: 'fix-verify-red', assignment },
    runResult: { status: 'done', confidence: 'reported' },
    repoRoot: tempDir,
  });

  assert.equal(result.canAdvanceEdge, false);
  assert.equal(result.stop, true);
  assert.equal(result.reason, 'assignment-fix-verify-red-insufficient-confidence');
  assert.equal(result.canProceed, undefined);
});

test('implement-item: a real buildAssignment Assignment with reported confidence stops at the top-level gate one step before the unsupported-operation catch-all', () => {
  const tempDir = mkTempDir();
  seedTaskSpecs(tempDir, ['implement-item']);

  const assignment = buildAssignment({
    workId: 'tsk-implement-topgate',
    stage: 'executing',
    operation: 'implement-item',
    options: { repoRoot: tempDir },
  });

  const result = interpretAssignmentRunResult({
    choice: { operation: 'implement-item', assignment },
    runResult: { status: 'done', confidence: 'reported' },
    repoRoot: tempDir,
  });

  assert.equal(result.canAdvanceEdge, false);
  assert.equal(result.stop, true);
  assert.equal(result.reason, 'assignment-implement-item-insufficient-confidence');
  assert.equal(result.canProceed, undefined);
});

test('Step 06 Cell 6.6 end-to-end: executeAssignment + interpretAssignmentRunResult refuse a real undeclared-file mutation and allow a fully-declared one', async () => {
  const tempDir = mkTempDir();
  initRepo(tempDir);
  initStore(tempDir);
  seedTaskSpecs(tempDir, ['scoped-subtask']);
  fs.mkdirSync(path.join(tempDir, 'src'), { recursive: true });

  const declaredFile = 'src/declared.mjs';
  const undeclaredFile = 'src/undeclared.mjs';

  // Case 1: helper touches only the declared file.
  {
    const assignment = buildAssignment({
      workId: 'tsk-scoped-ok',
      stage: 'executing',
      operation: 'scoped-subtask',
      expectedFiles: [declaredFile],
      options: { repoRoot: tempDir },
    });
    const executorScript = writeFakeExecutor(tempDir, { status: 'done', summary: 'Touched only the declared file' });
    const scriptContent = fs.readFileSync(executorScript, 'utf8');
    fs.writeFileSync(
      executorScript,
      scriptContent.replace(
        "import path from 'node:path';",
        `import path from 'node:path';\n    fs.writeFileSync('${path.join(tempDir, declaredFile)}', 'declared content');`,
      ),
    );
    const runResult = await executeAssignment(assignment, { cwd: tempDir, repoRoot: tempDir, runnerConfig: runnerConfigFor(executorScript) });
    assert.equal(runResult.confidence, 'verified');

    const interpreted = interpretAssignmentRunResult({
      choice: { operation: 'scoped-subtask', assignment },
      runResult,
      repoRoot: tempDir,
    });
    assert.equal(interpreted.stop, false);
    assert.equal(interpreted.canProceed, true);
    assert.equal(interpreted.reason, 'scoped-subtask-verified');
  }

  // Case 2: helper touches an undeclared file in addition to the declared one.
  {
    const assignment = buildAssignment({
      workId: 'tsk-scoped-bad',
      stage: 'executing',
      operation: 'scoped-subtask',
      expectedFiles: [declaredFile],
      options: { repoRoot: tempDir },
    });
    const executorScript = writeFakeExecutor(tempDir, { status: 'done', summary: 'Touched an undeclared file too' });
    const scriptContent = fs.readFileSync(executorScript, 'utf8');
    fs.writeFileSync(
      executorScript,
      scriptContent.replace(
        "import path from 'node:path';",
        `import path from 'node:path';\n    fs.writeFileSync('${path.join(tempDir, declaredFile)}', 'declared content 2');\n    fs.writeFileSync('${path.join(tempDir, undeclaredFile)}', 'undeclared content');`,
      ),
    );
    const runResult = await executeAssignment(assignment, { cwd: tempDir, repoRoot: tempDir, runnerConfig: runnerConfigFor(executorScript) });
    assert.equal(runResult.confidence, 'verified');

    const interpreted = interpretAssignmentRunResult({
      choice: { operation: 'scoped-subtask', assignment },
      runResult,
      repoRoot: tempDir,
    });
    assert.equal(interpreted.stop, true);
    assert.equal(interpreted.canProceed, false);
    assert.equal(interpreted.reason, 'scoped-subtask-undeclared-files');
    assert.ok(interpreted.undeclaredFiles.some((f) => f.includes('undeclared.mjs')));
  }
});

test('Step 06 governance-blocked or failed executor returns a stop without advancing Work', async () => {
  const tempDir = mkTempDir();
  fs.writeFileSync(path.join(tempDir, 'candidate-diff.patch'), 'diff --git a/src/main.js b/src/main.js\n');
  fs.writeFileSync(path.join(tempDir, 'verify.log'), 'VERIFY: PASS\n');
  seedTaskSpecs(tempDir, ['review-item']);
  const executorScript = writeFailingExecutor(tempDir);
  const work = { id: 'tsk-step06-fail', status: 'doing', stage: 'executing', domain: 'coding', refs: ['diff:candidate-1', 'verify:pass'] };
  const choice = chooseStageOperation({
    work,
    contextSignals: { secondaryOperation: 'review-item' },
    repoRoot: tempDir,
  });

  const outcome = await executeDriverOperationChoice(work, choice, {
    cwd: tempDir,
    repoRoot: tempDir,
    runnerConfig: runnerConfigFor(executorScript),
    contextSignals: { secondaryOperation: 'review-item', candidateDiffContent: 'diff content', candidateVerifyContent: 'verify output' },
  });

  assert.equal(outcome.executed, true);
  assert.equal(outcome.dispatchType, 'assignment');
  assert.equal(outcome.runResult.confidence, 'failed');
  assert.equal(outcome.canAdvanceEdge, false);
  assert.equal(outcome.stop, true);
  assert.equal(outcome.reason, 'assignment-review-item-failed');
  assert.equal(work.status, 'doing');
  assert.equal(work.stage, 'executing');
});

test('Step 06 Herdr and visibility tracking fields do not alter confidence ladder judgment', () => {
  const tempDir = mkTempDir();
  const runDir = path.join(tempDir, '.fgos', 'assignments', 'asgn_val_herdr', 'runs', '01');
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(
    path.join(runDir, 'agent-report.md'),
    '# Reality Gate & Feasibility Report\n' +
      '## Reality Gate Score\n' +
      '- Mode fit: PASS (citation: src/runner/dispatch/operation-choice.mjs)\n' +
      '- Repo fit: PASS (citation: src/runner/dispatch/operation-choice.mjs)\n' +
      '- Assumptions: PASS (citation: src/runner/dispatch/operation-choice.mjs)\n' +
      '- Smaller path: PASS (citation: src/runner/dispatch/operation-choice.mjs)\n' +
      '- Proof surface: PASS (citation: src/runner/dispatch/operation-choice.mjs)\n' +
      '- Impact-analysis posture: PASS (citation: src/runner/dispatch/operation-choice.mjs)\n' +
      '## Feasibility Matrix\n- Feasible (citation: src/runner/dispatch/operation-choice.mjs)\n'
  );

  const resWithHerdr = interpretAssignmentRunResult({
    choice: { operation: 'validate-plan' },
    runResult: {
      status: 'done',
      confidence: 'reported',
      runtime: { stdoutLog: path.join(runDir, 'stdout.log') },
      agentClaim: {
        status: 'done',
        verdict: 'READY',
        summary: 'Plan validated',
        realityGate: {
          'mode-fit': 'PASS (citation: src/runner/dispatch/operation-choice.mjs)',
          'repo-fit': 'PASS (citation: src/runner/dispatch/operation-choice.mjs)',
          'assumptions-fit': 'PASS (citation: src/runner/dispatch/operation-choice.mjs)',
          'smaller-path-fit': 'PASS (citation: src/runner/dispatch/operation-choice.mjs)',
          'proof-surface-fit': 'PASS (citation: src/runner/dispatch/operation-choice.mjs)',
          'impact-analysis-posture': 'PASS (citation: src/runner/dispatch/operation-choice.mjs)',
        },
        feasibilityMatrix: [{ risk: 'Risk 1', rating: 'Low', citation: 'src/runner/dispatch/operation-choice.mjs' }],
        herdrStatus: 'active',
        herdrPane: 'pane-42',
        visibility: 'internal',
      },
      evidence: {
        artifacts: [path.join(runDir, 'agent-report.md')],
      },
    },
    repoRoot: tempDir,
  });

  assert.equal(resWithHerdr.canAdvanceEdge, true);
  assert.equal(resWithHerdr.stop, false);
  assert.equal(resWithHerdr.reason, 'validate-plan-ready');
});

test('chooseStageOperation with lastRunResult READY WITH CONSTRAINTS verifies plan.md constraints via work and repoRoot (Finding P2 fix)', () => {
  const tempDir = mkTempDir();
  initRepo(tempDir);
  initStore(tempDir);

  const docsDir = path.join(tempDir, 'docs', 'history', 'feat-resume-constraints');
  fs.mkdirSync(docsDir, { recursive: true });
  fs.writeFileSync(path.join(docsDir, 'plan.md'), '# Mode: tiny\nPlan.\n\n## Constraints\n- Scope limited to 1 file\n');
  
  const runDir = path.join(tempDir, '.fgos', 'assignments', 'asgn_val_constraints', 'runs', '01');
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(
    path.join(runDir, 'agent-report.md'),
    '# Reality Gate & Feasibility Report\n' +
      '## Reality Gate Score\n' +
      '- Mode fit: PASS (citation: src/runner/dispatch/operation-choice.mjs)\n' +
      '- Repo fit: PASS (citation: src/runner/dispatch/operation-choice.mjs)\n' +
      '- Assumptions: PASS (citation: src/runner/dispatch/operation-choice.mjs)\n' +
      '- Smaller path: PASS (citation: src/runner/dispatch/operation-choice.mjs)\n' +
      '- Proof surface: PASS (citation: src/runner/dispatch/operation-choice.mjs)\n' +
      '- Impact-analysis posture: PASS (citation: src/runner/dispatch/operation-choice.mjs)\n' +
      '## Feasibility Matrix\n- Low risk (verified: src/runner/dispatch/operation-choice.mjs)\n'
  );

  const work = {
    id: 'tsk-resume-constraints',
    stage: 'planning',
    domain: 'coding',
    workflow: 'feature',
    docsRef: 'docs/history/feat-resume-constraints',
  };

  const lastRunResult = {
    status: 'done',
    confidence: 'reported',
    runtime: { stdoutLog: path.join(runDir, 'stdout.log') },
    agentClaim: {
      status: 'done',
      verdict: 'READY WITH CONSTRAINTS',
      summary: 'Plan ready with constraints',
      realityGate: {
        'mode-fit': 'PASS (citation: src/runner/dispatch/operation-choice.mjs)',
        'repo-fit': 'PASS (citation: src/runner/dispatch/operation-choice.mjs)',
        'assumptions-fit': 'PASS (citation: src/runner/dispatch/operation-choice.mjs)',
        'smaller-path-fit': 'PASS (citation: src/runner/dispatch/operation-choice.mjs)',
        'proof-surface-fit': 'PASS (citation: src/runner/dispatch/operation-choice.mjs)',
        'impact-analysis-posture': 'PASS (citation: src/runner/dispatch/operation-choice.mjs)',
      },
      feasibilityMatrix: [{ risk: 'low', citation: 'src/runner/dispatch/operation-choice.mjs' }],
    },
    evidence: { artifacts: [path.join(runDir, 'agent-report.md')] },
  };

  const choice = chooseStageOperation({
    work,
    stage: 'planning',
    domain: 'coding',
    workflow: 'feature',
    lastRunResult,
    repoRoot: tempDir,
  });

  assert.equal(choice.canAdvanceEdge, true);
  assert.equal(choice.reason, 'validation-passed-ready-for-planning-edge');
});

test('interpretAssignmentRunResult rejects out-of-protocol top-level verdict "decompose" (Finding P2 fix)', () => {
  const tempDir = mkTempDir();
  const runDir = path.join(tempDir, '.fgos', 'assignments', 'asgn_val_decomp_top', 'runs', '01');
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(
    path.join(runDir, 'agent-report.md'),
    '# Reality Gate & Feasibility Report\n' +
      '## Reality Gate Score\n' +
      '- Mode fit: PASS (citation: src/runner/dispatch/operation-choice.mjs)\n' +
      '- Repo fit: PASS (citation: src/runner/dispatch/operation-choice.mjs)\n' +
      '- Assumptions: PASS (citation: src/runner/dispatch/operation-choice.mjs)\n' +
      '- Smaller path: PASS (citation: src/runner/dispatch/operation-choice.mjs)\n' +
      '- Proof surface: PASS (citation: src/runner/dispatch/operation-choice.mjs)\n' +
      '- Impact-analysis posture: PASS (citation: src/runner/dispatch/operation-choice.mjs)\n' +
      '## Feasibility Matrix\n- Feasible (citation: src/runner/dispatch/operation-choice.mjs)\n'
  );

  const res = interpretAssignmentRunResult({
    choice: { operation: 'validate-plan' },
    runResult: {
      status: 'done',
      confidence: 'reported',
      runtime: { stdoutLog: path.join(runDir, 'stdout.log') },
      agentClaim: {
        status: 'done',
        verdict: 'decompose',
        summary: 'Invalid top-level verdict',
        realityGate: {
          'mode-fit': 'PASS (citation: src/runner/dispatch/operation-choice.mjs)',
          'repo-fit': 'PASS (citation: src/runner/dispatch/operation-choice.mjs)',
          'assumptions-fit': 'PASS (citation: src/runner/dispatch/operation-choice.mjs)',
          'smaller-path-fit': 'PASS (citation: src/runner/dispatch/operation-choice.mjs)',
          'proof-surface-fit': 'PASS (citation: src/runner/dispatch/operation-choice.mjs)',
          'impact-analysis-posture': 'PASS (citation: src/runner/dispatch/operation-choice.mjs)',
        },
        feasibilityMatrix: [{ risk: 'low', citation: 'src/runner/dispatch/operation-choice.mjs' }],
      },
      evidence: {
        artifacts: [path.join(runDir, 'agent-report.md')],
      },
    },
    repoRoot: tempDir,
  });

  assert.equal(res.canAdvanceEdge, false);
  assert.equal(res.stop, true);
  assert.equal(res.reason, 'validate-plan-missing-structured-verdict');
});

test('chooseStageOperation ignores secondaryOperation equal to primaryOp.id in planning (Finding P2 fix)', () => {
  const work = { id: 'tsk-plan-primary', stage: 'planning', domain: 'coding' };
  const choice = chooseStageOperation({
    work,
    stage: 'planning',
    domain: 'coding',
    workflow: 'feature',
    contextSignals: { secondaryOperation: 'shape-plan' },
  });

  assert.equal(choice.operation, 'shape-plan');
  assert.equal(choice.dispatch, 'direct-stage-skill');
});

test('chooseStageOperation ignores secondaryOperation equal to primaryOp.id in executing (Finding P2 fix)', () => {
  const work = { id: 'tsk-exec-primary', stage: 'executing', domain: 'coding' };
  const choice = chooseStageOperation({
    work,
    stage: 'executing',
    domain: 'coding',
    workflow: 'feature',
    contextSignals: { secondaryOperation: 'implement-item' },
  });

  assert.equal(choice.operation, 'implement-item');
  assert.equal(choice.dispatch, 'direct-stage-skill');
});

test('Negative test: validate-plan READY with only agent-result.json + evidenceRefs, no agent-report.md, must not advance', () => {
  const choice = { operation: 'validate-plan' };
  const interpreted = interpretAssignmentRunResult({
    choice,
    runResult: {
      status: 'done',
      confidence: 'reported',
      agentClaim: {
        status: 'done',
        verdict: 'READY',
        summary: 'Plan is ready',
        evidenceRefs: ['docs/history/feat/plan.md'],
      },
      evidence: {
        artifacts: ['.fgos/assignments/asgn_1/runs/01/agent-result.json'],
      },
    },
  });

  assert.equal(interpreted.canAdvanceEdge, false);
  assert.equal(interpreted.stop, true);
  assert.equal(interpreted.reason, 'validate-plan-missing-report-artifact');
});

test('Negative test: review-item APPROVED with bound diff/verify evidenceRefs, no agent-report.md, must not approve or route forward', () => {
  const tempDir = mkTempDir();
  fs.writeFileSync(path.join(tempDir, 'candidate-diff.patch'), 'diff --git a/src/a.js b/src/a.js\n');
  fs.writeFileSync(path.join(tempDir, 'verify.log'), 'VERIFY: PASS\n');
  const choice = {
    operation: 'review-item',
    assignment: { contextRefs: ['evidence:candidate-diff', 'evidence:verify-pass'] },
  };
  const interpreted = interpretAssignmentRunResult({
    choice,
    runResult: {
      status: 'done',
      confidence: 'reported',
      agentClaim: {
        status: 'done',
        verdict: 'APPROVED',
        summary: 'APPROVED',
        evidenceRefs: ['evidence:candidate-diff', 'evidence:verify-pass'],
      },
      evidence: {
        artifacts: ['.fgos/assignments/asgn_2/runs/01/agent-result.json'],
      },
    },
    repoRoot: tempDir,
  });

  assert.equal(interpreted.canAdvanceEdge, false);
  assert.equal(interpreted.stop, true);
  assert.equal(interpreted.reason, 'review-item-missing-report-artifact');
});

test('Negative test: validate-plan READY with valid agent-result.json + empty agent-report.md must stop and not advance Work', () => {
  const tempDir = mkTempDir();
  const runDir = path.join(tempDir, '.fgos', 'assignments', 'asgn_val_empty', 'runs', '01');
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(path.join(runDir, 'agent-report.md'), '   \n  \n');
  fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({
    status: 'done',
    verdict: 'READY',
    summary: 'Plan is ready',
  }));

  const interpreted = interpretAssignmentRunResult({
    choice: { operation: 'validate-plan' },
    runResult: {
      status: 'done',
      confidence: 'reported',
      runtime: { stdoutLog: path.join(runDir, 'stdout.log') },
      agentClaim: { status: 'done', verdict: 'READY', summary: 'Plan is ready' },
      evidence: { artifacts: [path.join(runDir, 'agent-report.md'), path.join(runDir, 'agent-result.json')] },
    },
    repoRoot: tempDir,
  });

  assert.equal(interpreted.canAdvanceEdge, false);
  assert.equal(interpreted.stop, true);
  assert.equal(interpreted.reason, 'validate-plan-missing-report-artifact');
});

test('Negative test: validate-plan READY with generic report without feasibility matrix/reality-gate evidence must stop', () => {
  const tempDir = mkTempDir();
  const runDir = path.join(tempDir, '.fgos', 'assignments', 'asgn_val_generic', 'runs', '01');
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Validation Report\nEverything looks fine and complete.\n');
  fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({
    status: 'done',
    verdict: 'READY',
    summary: 'Looks good',
  }));

  const interpreted = interpretAssignmentRunResult({
    choice: { operation: 'validate-plan' },
    runResult: {
      status: 'done',
      confidence: 'reported',
      runtime: { stdoutLog: path.join(runDir, 'stdout.log') },
      agentClaim: { status: 'done', verdict: 'READY', summary: 'Looks good' },
      evidence: { artifacts: [path.join(runDir, 'agent-report.md')] },
    },
    repoRoot: tempDir,
  });

  assert.equal(interpreted.canAdvanceEdge, false);
  assert.equal(interpreted.stop, true);
  assert.equal(interpreted.reason, 'validate-plan-insufficient-evidence');
});

test('Negative test: review-item APPROVED with bound refs + empty/generic agent-report.md must not approve or proceed', () => {
  const tempDir = mkTempDir();
  const runDir = path.join(tempDir, '.fgos', 'assignments', 'asgn_rev_generic', 'runs', '01');
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Review Report\nChanges look okay with implementation notes.\n');
  fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({
    status: 'done',
    verdict: 'APPROVED',
    summary: 'Approved',
    evidenceRefs: ['evidence:candidate-diff', 'evidence:verify-pass'],
  }));

  const choice = {
    operation: 'review-item',
    assignment: { contextRefs: ['evidence:candidate-diff', 'evidence:verify-pass'] },
  };

  const interpreted = interpretAssignmentRunResult({
    choice,
    runResult: {
      status: 'done',
      confidence: 'reported',
      runtime: { stdoutLog: path.join(runDir, 'stdout.log') },
      agentClaim: {
        status: 'done',
        verdict: 'APPROVED',
        summary: 'Approved',
        evidenceRefs: ['evidence:candidate-diff', 'evidence:verify-pass'],
      },
      evidence: { artifacts: [path.join(runDir, 'agent-report.md')] },
    },
    repoRoot: tempDir,
  });

  assert.equal(interpreted.canAdvanceEdge, false);
  assert.equal(interpreted.stop, true);
});

test('Negative test: scout-blast-radius reported with generic report must stop', () => {
  const tempDir = mkTempDir();
  const runDir = path.join(tempDir, '.fgos', 'assignments', 'asgn_scout_gen', 'runs', '01');
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Scout Report\nScouted codebase for blast radius.\n');

  const interpreted = interpretAssignmentRunResult({
    choice: { operation: 'scout-blast-radius' },
    runResult: {
      status: 'done',
      confidence: 'reported',
      runtime: { stdoutLog: path.join(runDir, 'stdout.log') },
      agentClaim: { status: 'done', summary: 'Done' },
      evidence: { artifacts: [path.join(runDir, 'agent-report.md')] },
    },
    repoRoot: tempDir,
  });

  assert.equal(interpreted.canAdvanceEdge, false);
  assert.equal(interpreted.stop, true);
  assert.equal(interpreted.reason, 'scout-blast-radius-insufficient-evidence');
});

test('Negative test: resolve-question reported with generic report must stop', () => {
  const tempDir = mkTempDir();
  const runDir = path.join(tempDir, '.fgos', 'assignments', 'asgn_res_gen', 'runs', '01');
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Research Report\nResearch question resolved.\n');

  const interpreted = interpretAssignmentRunResult({
    choice: { operation: 'resolve-question' },
    runResult: {
      status: 'done',
      confidence: 'reported',
      runtime: { stdoutLog: path.join(runDir, 'stdout.log') },
      agentClaim: { status: 'done', summary: 'Done' },
      evidence: { artifacts: [path.join(runDir, 'agent-report.md')] },
    },
    repoRoot: tempDir,
  });

  assert.equal(interpreted.canAdvanceEdge, false);
  assert.equal(interpreted.stop, true);
  assert.equal(interpreted.reason, 'resolve-question-insufficient-evidence');
});

test('Negative test: validate-plan READY with keyword-only report text "Plan validated and feasible" must stop', () => {
  const tempDir = mkTempDir();
  const runDir = path.join(tempDir, '.fgos', 'assignments', 'asgn_val_kw', 'runs', '01');
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Validation Report\nPlan validated and feasible.\n');
  fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({
    status: 'done',
    verdict: 'READY',
    summary: 'Plan validated and feasible',
  }));

  const interpreted = interpretAssignmentRunResult({
    choice: { operation: 'validate-plan' },
    runResult: {
      status: 'done',
      confidence: 'reported',
      runtime: { stdoutLog: path.join(runDir, 'stdout.log') },
      agentClaim: { status: 'done', verdict: 'READY', summary: 'Plan validated and feasible' },
      evidence: { artifacts: [path.join(runDir, 'agent-report.md')] },
    },
    repoRoot: tempDir,
  });

  assert.equal(interpreted.canAdvanceEdge, false);
  assert.equal(interpreted.stop, true);
  assert.equal(interpreted.reason, 'validate-plan-insufficient-evidence');
});

test('Negative test: review-item APPROVED with keyword-only report text "APPROVED: clean code" must stop', () => {
  const tempDir = mkTempDir();
  const runDir = path.join(tempDir, '.fgos', 'assignments', 'asgn_rev_kw', 'runs', '01');
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(path.join(tempDir, 'candidate-diff.patch'), 'diff --git a/src/a.js b/src/a.js\n');
  fs.writeFileSync(path.join(tempDir, 'verify.log'), 'VERIFY: PASS\n');
  fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Review Report\nAPPROVED: clean code.\n');
  fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({
    status: 'done',
    verdict: 'APPROVED',
    summary: 'APPROVED: clean code',
    evidenceRefs: ['evidence:candidate-diff', 'evidence:verify-pass'],
  }));

  const choice = {
    operation: 'review-item',
    assignment: { contextRefs: ['evidence:candidate-diff', 'evidence:verify-pass'] },
  };

  const interpreted = interpretAssignmentRunResult({
    choice,
    runResult: {
      status: 'done',
      confidence: 'reported',
      runtime: { stdoutLog: path.join(runDir, 'stdout.log') },
      agentClaim: {
        status: 'done',
        verdict: 'APPROVED',
        summary: 'APPROVED: clean code',
        evidenceRefs: ['evidence:candidate-diff', 'evidence:verify-pass'],
      },
      evidence: { artifacts: [path.join(runDir, 'agent-report.md')] },
    },
    repoRoot: tempDir,
  });

  assert.equal(interpreted.canAdvanceEdge, false);
  assert.equal(interpreted.stop, true);
  assert.equal(interpreted.reason, 'review-item-insufficient-evidence');
});

test('Negative test: scout-blast-radius report with generic impact/search words without named files/symbols and posture must stop', () => {
  const tempDir = mkTempDir();
  const runDir = path.join(tempDir, '.fgos', 'assignments', 'asgn_scout_kw', 'runs', '01');
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Scout Report\nScout blast radius impact analysis search completed.\n');

  const interpreted = interpretAssignmentRunResult({
    choice: { operation: 'scout-blast-radius' },
    runResult: {
      status: 'done',
      confidence: 'reported',
      runtime: { stdoutLog: path.join(runDir, 'stdout.log') },
      agentClaim: { status: 'done', summary: 'Scouted' },
      evidence: { artifacts: [path.join(runDir, 'agent-report.md')] },
    },
    repoRoot: tempDir,
  });

  assert.equal(interpreted.canProceed, false);
  assert.equal(interpreted.canAdvanceEdge, false);
  assert.equal(interpreted.stop, true);
  assert.equal(interpreted.reason, 'scout-blast-radius-insufficient-evidence');
});

test('Fix Round 1: scout-blast-radius posture with technique-word only (no state token) must stop', () => {
  const tempDir = mkTempDir();
  const runDir = path.join(tempDir, '.fgos', 'assignments', 'asgn_scout_posture_tech_only', 'runs', '01');
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(path.join(runDir, 'agent-report.md'),
    '# Scout Report\n' +
    'Symbol: chooseStageOperation in src/runner/dispatch/operation-choice.mjs\n' +
    'Used the dependency graph to trace callers via rg.\n' +
    'Affected callers: src/runner/loop.mjs\n' +
    'Affected processes: none\n' +
    'Risk read: low risk\n'
  );

  const interpreted = interpretAssignmentRunResult({
    choice: { operation: 'scout-blast-radius' },
    runResult: {
      status: 'done',
      confidence: 'reported',
      runtime: { stdoutLog: path.join(runDir, 'stdout.log') },
      agentClaim: { status: 'done', summary: 'Scouted' },
      evidence: { artifacts: [path.join(runDir, 'agent-report.md')] },
    },
    repoRoot: tempDir,
  });

  assert.equal(interpreted.canProceed, false);
  assert.equal(interpreted.canAdvanceEdge, false);
  assert.equal(interpreted.stop, true);
  assert.equal(interpreted.reason, 'scout-blast-radius-insufficient-evidence');
});

test('Fix Round 1: scout-blast-radius posture naming active/full without rg cross-check still passes', () => {
  const tempDir = mkTempDir();
  const runDir = path.join(tempDir, '.fgos', 'assignments', 'asgn_scout_posture_active', 'runs', '01');
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(path.join(runDir, 'agent-report.md'),
    '# Scout Report\n' +
    'Symbol: chooseStageOperation in src/runner/dispatch/operation-choice.mjs\n' +
    'Search posture: active.\n' +
    'Affected callers: src/runner/loop.mjs\n' +
    'Affected processes: none\n' +
    'Risk read: low risk\n'
  );

  const interpreted = interpretAssignmentRunResult({
    choice: { operation: 'scout-blast-radius' },
    runResult: {
      status: 'done',
      confidence: 'reported',
      runtime: { stdoutLog: path.join(runDir, 'stdout.log') },
      agentClaim: { status: 'done', summary: 'Scouted' },
      evidence: { artifacts: [path.join(runDir, 'agent-report.md')] },
    },
    repoRoot: tempDir,
  });

  assert.equal(interpreted.canProceed, true);
  assert.equal(interpreted.reason, 'scout-blast-radius-reported');
});

test('Fix Round 1: scout-blast-radius posture naming degraded/inactive WITHOUT rg cross-check now fails', () => {
  const tempDir = mkTempDir();
  const runDir = path.join(tempDir, '.fgos', 'assignments', 'asgn_scout_posture_degraded_no_rg', 'runs', '01');
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(path.join(runDir, 'agent-report.md'),
    '# Scout Report\n' +
    'Symbol: chooseStageOperation in src/runner/dispatch/operation-choice.mjs\n' +
    'Search posture: degraded.\n' +
    'Affected callers: src/runner/loop.mjs\n' +
    'Affected processes: none\n' +
    'Risk read: low risk\n'
  );

  const interpreted = interpretAssignmentRunResult({
    choice: { operation: 'scout-blast-radius' },
    runResult: {
      status: 'done',
      confidence: 'reported',
      runtime: { stdoutLog: path.join(runDir, 'stdout.log') },
      agentClaim: { status: 'done', summary: 'Scouted' },
      evidence: { artifacts: [path.join(runDir, 'agent-report.md')] },
    },
    repoRoot: tempDir,
  });

  assert.equal(interpreted.canProceed, false);
  assert.equal(interpreted.canAdvanceEdge, false);
  assert.equal(interpreted.stop, true);
  assert.equal(interpreted.reason, 'scout-blast-radius-insufficient-evidence');
});

test('Fix Round 1: scout-blast-radius posture naming degraded/inactive WITH rg cross-check still passes', () => {
  const tempDir = mkTempDir();
  const runDir = path.join(tempDir, '.fgos', 'assignments', 'asgn_scout_posture_degraded_with_rg', 'runs', '01');
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(path.join(runDir, 'agent-report.md'),
    '# Scout Report\n' +
    'Symbol: chooseStageOperation in src/runner/dispatch/operation-choice.mjs\n' +
    'Search posture: degraded, backed by an rg cross-check of direct callers.\n' +
    'Affected callers: src/runner/loop.mjs\n' +
    'Affected processes: none\n' +
    'Risk read: low risk\n'
  );

  const interpreted = interpretAssignmentRunResult({
    choice: { operation: 'scout-blast-radius' },
    runResult: {
      status: 'done',
      confidence: 'reported',
      runtime: { stdoutLog: path.join(runDir, 'stdout.log') },
      agentClaim: { status: 'done', summary: 'Scouted' },
      evidence: { artifacts: [path.join(runDir, 'agent-report.md')] },
    },
    repoRoot: tempDir,
  });

  assert.equal(interpreted.canProceed, true);
  assert.equal(interpreted.reason, 'scout-blast-radius-reported');
});

test('Negative test: resolve-question report with generic research words without answer/citation/uncertainty structure must stop', () => {
  const tempDir = mkTempDir();
  const runDir = path.join(tempDir, '.fgos', 'assignments', 'asgn_res_kw', 'runs', '01');
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Research Report\nResearch question studied and facts found.\n');

  const interpreted = interpretAssignmentRunResult({
    choice: { operation: 'resolve-question' },
    runResult: {
      status: 'done',
      confidence: 'reported',
      runtime: { stdoutLog: path.join(runDir, 'stdout.log') },
      agentClaim: { status: 'done', summary: 'Researched' },
      evidence: { artifacts: [path.join(runDir, 'agent-report.md')] },
    },
    repoRoot: tempDir,
  });

  assert.equal(interpreted.canProceed, false);
  assert.equal(interpreted.canAdvanceEdge, false);
  assert.equal(interpreted.stop, true);
  assert.equal(interpreted.reason, 'resolve-question-insufficient-evidence');
});

test('P2 fix: chooseStageOperation review-item lastRunResult with missing report artifact path does not route to fix-verify-red', () => {
  const tempDir = mkTempDir();
  initRepo(tempDir);
  fs.writeFileSync(path.join(tempDir, 'candidate-diff.patch'), 'diff --git a/src/a.js b/src/a.js\n');
  fs.writeFileSync(path.join(tempDir, 'verify.log'), 'VERIFY: PASS\n');
  const choice = chooseStageOperation({
    work: {
      id: 'tsk',
      stage: 'executing',
      domain: 'coding',
      workflow: 'feature',
      refs: ['evidence:candidate-diff', 'evidence:verify-fail'],
    },
    contextSignals: { secondaryOperation: 'review-item' },
    lastRunResult: {
      operation: 'review-item',
      status: 'done',
      confidence: 'reported',
      agentClaim: {
        status: 'done',
        verdict: 'REJECT',
        summary: 'no',
        evidenceRefs: ['evidence:candidate-diff', 'evidence:verify-fail'],
      },
      evidence: { artifacts: ['missing-agent-report.md'] },
    },
    repoRoot: tempDir,
  });

  assert.equal(choice.operation, 'review-item');
  assert.equal(choice.reason, 'review-item-missing-report-artifact');
  assert.equal(choice.stop, true);
  assert.notEqual(choice.nextOperation, 'fix-verify-red');
});

test('Positive tests: real valid reports for validate-plan, review-item, scout-blast-radius, resolve-question pass', () => {
  const tempDir = mkTempDir();
  fs.writeFileSync(path.join(tempDir, 'candidate-diff.patch'), 'diff --git a/src/a.js b/src/a.js\n');
  fs.writeFileSync(path.join(tempDir, 'verify.log'), 'VERIFY: PASS\n');

  // 1. validate-plan valid
  const valDir = path.join(tempDir, '.fgos', 'assignments', 'asgn_val_pos', 'runs', '01');
  fs.mkdirSync(valDir, { recursive: true });
  fs.writeFileSync(path.join(valDir, 'agent-report.md'),
    '# Reality Gate & Feasibility Report\n' +
    '## Reality Gate Score\n' +
    '- Mode fit: PASS (citation: src/runner/dispatch/operation-choice.mjs)\n' +
    '- Repo fit: PASS (citation: src/runner/dispatch/operation-choice.mjs)\n' +
    '- Assumptions: PASS (citation: src/runner/dispatch/operation-choice.mjs)\n' +
    '- Smaller path: PASS (citation: src/runner/dispatch/operation-choice.mjs)\n' +
    '- Proof surface: PASS (citation: src/runner/dispatch/operation-choice.mjs)\n' +
    '- Impact-analysis posture: PASS (citation: src/runner/dispatch/operation-choice.mjs)\n' +
    '## Feasibility Matrix\n- Risk 1: Low (verified: src/runner/dispatch/operation-choice.mjs)\n'
  );
  const resVal = interpretAssignmentRunResult({
    choice: { operation: 'validate-plan' },
    runResult: {
      status: 'done',
      confidence: 'reported',
      runtime: { stdoutLog: path.join(valDir, 'stdout.log') },
      agentClaim: {
        status: 'done',
        verdict: 'READY',
        summary: 'Plan is ready',
        realityGate: {
          'mode-fit': 'PASS (citation: src/runner/dispatch/operation-choice.mjs)',
          'repo-fit': 'PASS (citation: src/runner/dispatch/operation-choice.mjs)',
          'assumptions-fit': 'PASS (citation: src/runner/dispatch/operation-choice.mjs)',
          'smaller-path-fit': 'PASS (citation: src/runner/dispatch/operation-choice.mjs)',
          'proof-surface-fit': 'PASS (citation: src/runner/dispatch/operation-choice.mjs)',
          'impact-analysis-posture': 'PASS (citation: src/runner/dispatch/operation-choice.mjs)',
        },
        feasibilityMatrix: [
          { risk: 'Risk 1', rating: 'Low', citation: 'src/runner/dispatch/operation-choice.mjs' },
        ],
      },
      evidence: { artifacts: [path.join(valDir, 'agent-report.md')] },
    },
    repoRoot: tempDir,
  });
  assert.equal(resVal.canAdvanceEdge, true);
  assert.equal(resVal.reason, 'validate-plan-ready');

  // 2. review-item valid APPROVED
  const revDir = path.join(tempDir, '.fgos', 'assignments', 'asgn_rev_pos', 'runs', '01');
  fs.mkdirSync(revDir, { recursive: true });
  fs.writeFileSync(path.join(revDir, 'agent-report.md'),
    '# Review Report\n' +
    'Verdict: APPROVED\n' +
    '- Candidate diff: evidence:candidate-diff changes in src/runner/loop.mjs verified.\n' +
    '- Verify result: evidence:verify-pass 157 tests pass.\n' +
    'Rationale: Clean code implementation.\n'
  );
  const resRev = interpretAssignmentRunResult({
    choice: {
      operation: 'review-item',
      assignment: { contextRefs: ['evidence:candidate-diff', 'evidence:verify-pass'] },
    },
    runResult: {
      status: 'done',
      confidence: 'reported',
      runtime: { stdoutLog: path.join(revDir, 'stdout.log') },
      agentClaim: {
        status: 'done',
        verdict: 'APPROVED',
        summary: 'Approved',
        evidenceRefs: ['evidence:candidate-diff', 'evidence:verify-pass'],
      },
      evidence: { artifacts: [path.join(revDir, 'agent-report.md')] },
    },
    repoRoot: tempDir,
  });
  assert.equal(resRev.canProceed, true);
  assert.equal(resRev.reason, 'review-item-approved');

  // 3. scout-blast-radius valid
  const scoutDir = path.join(tempDir, '.fgos', 'assignments', 'asgn_scout_pos', 'runs', '01');
  fs.mkdirSync(scoutDir, { recursive: true });
  fs.writeFileSync(path.join(scoutDir, 'agent-report.md'),
    '# Scout Report\n' +
    'Symbol: chooseStageOperation in src/runner/dispatch/operation-choice.mjs\n' +
    'Search posture: active rg cross-check performed.\n' +
    'Affected callers: src/runner/loop.mjs\n' +
    'Affected processes: none\n' +
    'Risk read: low risk\n'
  );
  const resScout = interpretAssignmentRunResult({
    choice: { operation: 'scout-blast-radius' },
    runResult: {
      status: 'done',
      confidence: 'reported',
      runtime: { stdoutLog: path.join(scoutDir, 'stdout.log') },
      agentClaim: { status: 'done', summary: 'Scouted' },
      evidence: { artifacts: [path.join(scoutDir, 'agent-report.md')] },
    },
    repoRoot: tempDir,
  });
  assert.equal(resScout.canProceed, true);
  assert.equal(resScout.reason, 'scout-blast-radius-reported');

  // 4. resolve-question valid
  const resDir = path.join(tempDir, '.fgos', 'assignments', 'asgn_res_pos', 'runs', '01');
  fs.mkdirSync(resDir, { recursive: true });
  fs.writeFileSync(path.join(resDir, 'agent-report.md'),
    '# Question Resolution Report\n' +
    'Answer: repoRoot parameter is passed to interpretAssignmentRunResult.\n' +
    'Citations: ref: src/runner/dispatch/operation-choice.mjs:L285\n' +
    'Verdict: clear\n' +
    'Remaining uncertainty: None.\n'
  );
  const resRes = interpretAssignmentRunResult({
    choice: { operation: 'resolve-question' },
    runResult: {
      status: 'done',
      confidence: 'reported',
      runtime: { stdoutLog: path.join(resDir, 'stdout.log') },
      agentClaim: { status: 'done', summary: 'Resolved' },
      evidence: { artifacts: [path.join(resDir, 'agent-report.md')] },
    },
    repoRoot: tempDir,
  });
  assert.equal(resRes.canProceed, true);
  assert.equal(resRes.reason, 'resolve-question-reported');
});

test('Negative test: validate-plan READY + realityGate: {} + feasibilityMatrix: {} + generic report must stop with validate-plan-insufficient-evidence', () => {
  const tempDir = mkTempDir();
  const runDir = path.join(tempDir, '.fgos', 'assignments', 'asgn_val_empty_struct', 'runs', '01');
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Validation Report\nEverything looks fine.\n');

  const interpreted = interpretAssignmentRunResult({
    choice: { operation: 'validate-plan' },
    runResult: {
      status: 'done',
      confidence: 'reported',
      runtime: { stdoutLog: path.join(runDir, 'stdout.log') },
      agentClaim: {
        status: 'done',
        verdict: 'READY',
        summary: 'ok',
        realityGate: {},
        feasibilityMatrix: {},
      },
      evidence: { artifacts: [path.join(runDir, 'agent-report.md')] },
    },
    repoRoot: tempDir,
  });

  assert.equal(interpreted.canAdvanceEdge, false);
  assert.equal(interpreted.stop, true);
  assert.equal(interpreted.reason, 'validate-plan-insufficient-evidence');
});

test('Negative test: validate-plan READY + feasibilityMatrix: [] or entries with no citation/evidence must stop', () => {
  const tempDir = mkTempDir();
  const runDir = path.join(tempDir, '.fgos', 'assignments', 'asgn_val_no_cit', 'runs', '01');
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Report\nValidation done.\n');

  // Case A: feasibilityMatrix: []
  const resEmptyArr = interpretAssignmentRunResult({
    choice: { operation: 'validate-plan' },
    runResult: {
      status: 'done',
      confidence: 'reported',
      runtime: { stdoutLog: path.join(runDir, 'stdout.log') },
      agentClaim: {
        status: 'done',
        verdict: 'READY',
        summary: 'ok',
        realityGate: { modeFit: 'PASS' },
        feasibilityMatrix: [],
      },
      evidence: { artifacts: [path.join(runDir, 'agent-report.md')] },
    },
    repoRoot: tempDir,
  });
  assert.equal(resEmptyArr.canAdvanceEdge, false);
  assert.equal(resEmptyArr.stop, true);
  assert.equal(resEmptyArr.reason, 'validate-plan-insufficient-evidence');

  // Case B: feasibilityMatrix entries with no citation/evidence
  const resNoCit = interpretAssignmentRunResult({
    choice: { operation: 'validate-plan' },
    runResult: {
      status: 'done',
      confidence: 'reported',
      runtime: { stdoutLog: path.join(runDir, 'stdout.log') },
      agentClaim: {
        status: 'done',
        verdict: 'READY',
        summary: 'ok',
        realityGate: { modeFit: 'PASS' },
        feasibilityMatrix: [{ risk: 'high' }],
      },
      evidence: { artifacts: [path.join(runDir, 'agent-report.md')] },
    },
    repoRoot: tempDir,
  });
  assert.equal(resNoCit.canAdvanceEdge, false);
  assert.equal(resNoCit.stop, true);
  assert.equal(resNoCit.reason, 'validate-plan-insufficient-evidence');
});

test('Negative test: review-item APPROVED + bound diff/verify refs + findings: [{}] + generic report must stop with review-item-insufficient-evidence', () => {
  const tempDir = mkTempDir();
  const runDir = path.join(tempDir, '.fgos', 'assignments', 'asgn_rev_empty_findings', 'runs', '01');
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(path.join(tempDir, 'candidate-diff.patch'), 'diff --git a/src/a.js b/src/a.js\n');
  fs.writeFileSync(path.join(tempDir, 'verify.log'), 'VERIFY: PASS\n');
  fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Review Report\nChanges look okay with implementation notes.\n');

  const choice = {
    operation: 'review-item',
    assignment: { contextRefs: ['evidence:candidate-diff', 'evidence:verify-pass'] },
  };

  const interpreted = interpretAssignmentRunResult({
    choice,
    runResult: {
      status: 'done',
      confidence: 'reported',
      runtime: { stdoutLog: path.join(runDir, 'stdout.log') },
      agentClaim: {
        status: 'done',
        verdict: 'APPROVED',
        summary: 'ok',
        evidenceRefs: ['evidence:candidate-diff', 'evidence:verify-pass'],
        findings: [{}],
      },
      evidence: { artifacts: [path.join(runDir, 'agent-report.md')] },
    },
    repoRoot: tempDir,
  });

  assert.equal(interpreted.canAdvanceEdge, false);
  assert.equal(interpreted.stop, true);
  assert.equal(interpreted.reason, 'review-item-insufficient-evidence');
});

test('Negative test: review-item APPROVED + findings not tied to diff/verify refs must stop', () => {
  const tempDir = mkTempDir();
  const runDir = path.join(tempDir, '.fgos', 'assignments', 'asgn_rev_untied_findings', 'runs', '01');
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(path.join(tempDir, 'candidate-diff.patch'), 'diff --git a/src/a.js b/src/a.js\n');
  fs.writeFileSync(path.join(tempDir, 'verify.log'), 'VERIFY: PASS\n');
  fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Review Report\nChanges look okay with implementation notes.\n');

  const choice = {
    operation: 'review-item',
    assignment: { contextRefs: ['evidence:candidate-diff', 'evidence:verify-pass'] },
  };

  const interpreted = interpretAssignmentRunResult({
    choice,
    runResult: {
      status: 'done',
      confidence: 'reported',
      runtime: { stdoutLog: path.join(runDir, 'stdout.log') },
      agentClaim: {
        status: 'done',
        verdict: 'APPROVED',
        summary: 'ok',
        evidenceRefs: ['evidence:candidate-diff', 'evidence:verify-pass'],
        findings: [{ topic: 'formatting', comment: 'check indent' }],
      },
      evidence: { artifacts: [path.join(runDir, 'agent-report.md')] },
    },
    repoRoot: tempDir,
  });

  assert.equal(interpreted.canAdvanceEdge, false);
  assert.equal(interpreted.stop, true);
  assert.equal(interpreted.reason, 'review-item-insufficient-evidence');
});

test('Positive test: valid structured validate-plan claim with real gate rows and feasibility rows passes', () => {
  const tempDir = mkTempDir();
  const runDir = path.join(tempDir, '.fgos', 'assignments', 'asgn_val_struct_pos', 'runs', '01');
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(path.join(runDir, 'agent-report.md'),
    '# Reality Gate & Feasibility Validation Report\n' +
    '## Reality Gate Score\n' +
    '- Mode fit: PASS (citation: src/runner/loop.mjs)\n' +
    '- Repo fit: PASS (citation: src/runner/loop.mjs)\n' +
    '- Assumptions: PASS (citation: src/runner/loop.mjs)\n' +
    '- Smaller path: PASS (citation: src/runner/loop.mjs)\n' +
    '- Proof surface: PASS (citation: src/runner/loop.mjs)\n' +
    '- Impact-analysis posture: PASS (citation: src/runner/loop.mjs)\n' +
    '## Feasibility Matrix\n- Risk 1: Low (verified: src/runner/loop.mjs)\n'
  );

  const interpreted = interpretAssignmentRunResult({
    choice: { operation: 'validate-plan' },
    runResult: {
      status: 'done',
      confidence: 'reported',
      runtime: { stdoutLog: path.join(runDir, 'stdout.log') },
      agentClaim: {
        status: 'done',
        verdict: 'READY',
        summary: 'Plan validated',
        realityGate: {
          modeFit: 'PASS (citation: src/runner/loop.mjs:L100)',
          repoFit: 'PASS (citation: src/runner/loop.mjs:L100)',
          assumptions: 'PASS (citation: src/runner/loop.mjs:L100)',
          smallerPath: 'PASS (citation: src/runner/loop.mjs:L100)',
          proofSurface: 'PASS (citation: src/runner/loop.mjs:L100)',
          impactAnalysisPosture: 'PASS (citation: src/runner/loop.mjs:L100)',
        },
        feasibilityMatrix: [{ risk: 'high', citation: 'src/runner/loop.mjs:L100' }],
      },
      evidence: { artifacts: [path.join(runDir, 'agent-report.md')] },
    },
    repoRoot: tempDir,
  });

  assert.equal(interpreted.canAdvanceEdge, true);
  assert.equal(interpreted.stop, false);
  assert.equal(interpreted.reason, 'validate-plan-ready');
});

test('Positive test: valid structured review-item claim with real findings tied to provided diff/verify refs passes', () => {
  const tempDir = mkTempDir();
  const runDir = path.join(tempDir, '.fgos', 'assignments', 'asgn_rev_struct_pos', 'runs', '01');
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(path.join(tempDir, 'candidate-diff.patch'), 'diff --git a/src/a.js b/src/a.js\n');
  fs.writeFileSync(path.join(tempDir, 'verify.log'), 'VERIFY: PASS\n');
  fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Review Report\nSee structured agent-result.json claim.\n');

  const choice = {
    operation: 'review-item',
    assignment: { contextRefs: ['evidence:candidate-diff', 'evidence:verify-pass'] },
  };

  const interpreted = interpretAssignmentRunResult({
    choice,
    runResult: {
      status: 'done',
      confidence: 'reported',
      runtime: { stdoutLog: path.join(runDir, 'stdout.log') },
      agentClaim: {
        status: 'done',
        verdict: 'APPROVED',
        summary: 'Approved',
        evidenceRefs: ['evidence:candidate-diff', 'evidence:verify-pass'],
        findings: [{ diffRef: 'evidence:candidate-diff', verifyRef: 'evidence:verify-pass', comment: 'APPROVED clean code' }],
      },
      evidence: { artifacts: [path.join(runDir, 'agent-report.md')] },
    },
    repoRoot: tempDir,
  });

  assert.equal(interpreted.canProceed, true);
  assert.equal(interpreted.canAdvanceEdge, false);
  assert.equal(interpreted.stop, false);
  assert.equal(interpreted.reason, 'review-item-approved');
});

test('Finding 2: executeAssignment fails closed on read-only validate-plan mutations without running automatic rollback', async () => {
  const tempDir = mkTempDir();
  initRepo(tempDir);
  initStore(tempDir);
  seedTaskSpecs(tempDir, ['validate-plan']);

  const docsDir = path.join(tempDir, 'docs', 'history', 'feat-iso');
  fs.mkdirSync(docsDir, { recursive: true });
  const planPath = path.join(docsDir, 'plan.md');
  const originalPlanContent = '# Plan\nOriginal plan content.\n';
  fs.writeFileSync(planPath, originalPlanContent);
  execSync(`git add ${planPath} && git commit -m "initial plan"`, { cwd: tempDir, stdio: 'ignore' });

  addWork(tempDir, {
    id: 'tsk-iso-val',
    title: 'Test isolation for validate-plan',
    stage: 'planning',
    status: 'todo',
    domain: 'coding',
    workflow: 'feature',
    kind: 'feature',
    risk: 'standard',
    deps: [],
    refs: [],
    verify: 'node -e "process.exit(0)"',
    docsRef: 'docs/history/feat-iso',
  });

  const assignment = buildAssignment({
    work: listWork(tempDir).work['tsk-iso-val'],
    stage: 'planning',
    operation: 'validate-plan',
  });

  // Fake executor that misbehaves by dirtying the repo (writing a temp file and mutating plan.md)
  const dirtyTmpPath = path.join(tempDir, 'plan-validation.tmp');
  const executorScript = writeFakeExecutor(tempDir, {
    status: 'done',
    verdict: 'READY',
    summary: 'Mutating validate-plan executor',
  });

  // Inject file write into executor script after top-level imports
  const scriptContent = fs.readFileSync(executorScript, 'utf8');
  const mutatingScriptContent = scriptContent.replace(
    "import path from 'node:path';",
    "import path from 'node:path';\n    fs.writeFileSync('" + dirtyTmpPath + "', 'dirty temp data');\n    fs.writeFileSync('" + planPath + "', '# Dirty modified plan\\n');"
  );
  fs.writeFileSync(executorScript, mutatingScriptContent);

  const cfg = runnerConfigFor(executorScript);

  const runResult = await executeAssignment(assignment, {
    cwd: tempDir,
    repoRoot: tempDir,
    runnerConfig: cfg,
  });

  assert.equal(runResult.status, 'failed');
  assert.equal(runResult.confidence, 'failed');

  // Verify evidence recorded the mutations
  assert.ok(runResult.evidence.changedFiles.some((f) => f.includes('plan-validation.tmp')));
  assert.ok(runResult.evidence.changedFiles.some((f) => f.includes('plan.md')));

  // Verify files were not automatically deleted or restored (no automatic rollback)
  assert.equal(fs.existsSync(dirtyTmpPath), true, 'untracked dirty file should not be automatically removed');
  assert.equal(fs.readFileSync(planPath, 'utf8'), '# Dirty modified plan\n', 'tracked file changes should not be automatically restored');
});

test('Finding 3 negative test: validate-plan READY with headings-only report text stops', () => {
  const tempDir = mkTempDir();
  const runDir = path.join(tempDir, '.fgos', 'assignments', 'asgn_val_headings', 'runs', '01');
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(path.join(runDir, 'agent-report.md'), 'Reality gate: PASS\nFeasibility matrix: PASS\n');

  const interpreted = interpretAssignmentRunResult({
    choice: { operation: 'validate-plan' },
    runResult: {
      status: 'done',
      confidence: 'reported',
      runtime: { stdoutLog: path.join(runDir, 'stdout.log') },
      agentClaim: { status: 'done', verdict: 'READY', summary: 'Plan validated' },
      evidence: { artifacts: [path.join(runDir, 'agent-report.md')] },
    },
    repoRoot: tempDir,
  });

  assert.equal(interpreted.canAdvanceEdge, false);
  assert.equal(interpreted.stop, true);
  assert.equal(interpreted.reason, 'validate-plan-insufficient-evidence');
});

test('Finding 3 negative test: scout-blast-radius reported with whitespace string array or blank value stops', () => {
  const tempDir = mkTempDir();
  const runDir = path.join(tempDir, '.fgos', 'assignments', 'asgn_scout_blank', 'runs', '01');
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Scout Report\nScouting complete.\n');

  // Test 1: whitespace files and whitespace posture
  const interpretedWhitespace = interpretAssignmentRunResult({
    choice: { operation: 'scout-blast-radius' },
    runResult: {
      status: 'done',
      confidence: 'reported',
      runtime: { stdoutLog: path.join(runDir, 'stdout.log') },
      agentClaim: { status: 'done', files: ['   '], posture: '   ' },
      evidence: { artifacts: [path.join(runDir, 'agent-report.md')] },
    },
    repoRoot: tempDir,
  });

  assert.equal(interpretedWhitespace.canProceed, false);
  assert.equal(interpretedWhitespace.stop, true);
  assert.equal(interpretedWhitespace.reason, 'scout-blast-radius-insufficient-evidence');

  // Test 2: array containing blank values
  const interpretedBlankArray = interpretAssignmentRunResult({
    choice: { operation: 'scout-blast-radius' },
    runResult: {
      status: 'done',
      confidence: 'reported',
      runtime: { stdoutLog: path.join(runDir, 'stdout.log') },
      agentClaim: { status: 'done', files: ['src/main.js', '   '], posture: 'active' },
      evidence: { artifacts: [path.join(runDir, 'agent-report.md')] },
    },
    repoRoot: tempDir,
  });

  assert.equal(interpretedBlankArray.canProceed, false);
  assert.equal(interpretedBlankArray.stop, true);
  assert.equal(interpretedBlankArray.reason, 'scout-blast-radius-insufficient-evidence');
});

test('Finding 3 negative test: resolve-question reported with whitespace answer or citations or blank array elements stops', () => {
  const tempDir = mkTempDir();
  const runDir = path.join(tempDir, '.fgos', 'assignments', 'asgn_res_blank', 'runs', '01');
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Question Resolution\nResolved question.\n');

  // Test 1: whitespace answer and whitespace citations
  const interpretedWhitespace = interpretAssignmentRunResult({
    choice: { operation: 'resolve-question' },
    runResult: {
      status: 'done',
      confidence: 'reported',
      runtime: { stdoutLog: path.join(runDir, 'stdout.log') },
      agentClaim: { status: 'done', answer: '   ', citations: ['   '], verdict: 'clear' },
      evidence: { artifacts: [path.join(runDir, 'agent-report.md')] },
    },
    repoRoot: tempDir,
  });

  assert.equal(interpretedWhitespace.canProceed, false);
  assert.equal(interpretedWhitespace.stop, true);
  assert.equal(interpretedWhitespace.reason, 'resolve-question-insufficient-evidence');

  // Test 2: array containing blank elements in citations
  const interpretedBlankCitations = interpretAssignmentRunResult({
    choice: { operation: 'resolve-question' },
    runResult: {
      status: 'done',
      confidence: 'reported',
      runtime: { stdoutLog: path.join(runDir, 'stdout.log') },
      agentClaim: { status: 'done', answer: 'Concrete answer here', citations: ['src/a.js:L10', '  '], verdict: 'clear' },
      evidence: { artifacts: [path.join(runDir, 'agent-report.md')] },
    },
    repoRoot: tempDir,
  });

  assert.equal(interpretedBlankCitations.canProceed, false);
  assert.equal(interpretedBlankCitations.stop, true);
  assert.equal(interpretedBlankCitations.reason, 'resolve-question-insufficient-evidence');
});

test('Finding 1 regression test: valid validate-plan NOT READY RunResult causes next driver action to be shape-plan', async () => {
  const tempDir = mkTempDir();
  initRepo(tempDir);
  initStore(tempDir);
  seedTaskSpecs(tempDir, ['validate-plan', 'shape-plan']);

  const docsDir = path.join(tempDir, 'docs', 'history', 'feat-notready');
  fs.mkdirSync(docsDir, { recursive: true });
  fs.writeFileSync(path.join(docsDir, 'plan.md'), '# Mode: tiny\nProposed plan.\n');

  addWork(tempDir, {
    id: 'tsk-driver-notready',
    title: 'Test NOT READY driver loop',
    stage: 'planning',
    status: 'todo',
    domain: 'coding',
    workflow: 'feature',
    kind: 'feature',
    risk: 'standard',
    deps: [],
    refs: [],
    verify: 'node -e "process.exit(0)"',
    docsRef: 'docs/history/feat-notready',
  });

  const executorScript = writeFakeExecutor(tempDir, {
    status: 'done',
    verdict: 'NOT READY - RETURN TO PLANNING',
    summary: 'Plan has gaps',
  });
  const cfg = runnerConfigFor(executorScript);

  // First pass: runs validate-plan and stores assignment & run result
  await runOnce({ dir: tempDir, repoRoot: tempDir, config: cfg });

  const itemAfterFirst = listWork(tempDir).work['tsk-driver-notready'];
  assert.equal(itemAfterFirst.stage, 'planning', 'Work must remain in planning stage');

  // Second pass: chooseStageOperation must choose shape-plan, not validate-plan
  const choiceOnNextPass = chooseStageOperation({
    work: itemAfterFirst,
    stage: 'planning',
    domain: 'coding',
    workflow: 'feature',
    repoRoot: tempDir,
  });

  assert.equal(choiceOnNextPass.operation, 'shape-plan');
  assert.equal(choiceOnNextPass.dispatch, 'direct-stage-skill');
  assert.equal(choiceOnNextPass.canAdvanceEdge, false);
});

test('Finding 2 negative test: missing dimensions in realityGate stops with validate-plan-insufficient-evidence', () => {
  const tempDir = mkTempDir();
  const runDir = path.join(tempDir, '.fgos', 'assignments', 'asgn_val_missing_dims', 'runs', '01');
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(path.join(runDir, 'agent-report.md'), 'Report text\n');

  const interpreted = interpretAssignmentRunResult({
    choice: { operation: 'validate-plan' },
    runResult: {
      status: 'done',
      confidence: 'reported',
      runtime: { stdoutLog: path.join(runDir, 'stdout.log') },
      agentClaim: {
        status: 'done',
        verdict: 'READY',
        summary: 'Plan validated',
        realityGate: { modeFit: 'PASS (citation: src/main.js)', repoFit: 'PASS (citation: src/main.js)' },
        feasibilityMatrix: [{ risk: 'low', citation: 'src/main.js' }],
      },
      evidence: { artifacts: [path.join(runDir, 'agent-report.md')] },
    },
    repoRoot: tempDir,
  });

  assert.equal(interpreted.canAdvanceEdge, false);
  assert.equal(interpreted.stop, true);
  assert.equal(interpreted.reason, 'validate-plan-insufficient-evidence');
});

test('Finding 2 negative test: PASS-only without citation in realityGate stops with validate-plan-insufficient-evidence', () => {
  const tempDir = mkTempDir();
  const runDir = path.join(tempDir, '.fgos', 'assignments', 'asgn_val_nocite', 'runs', '01');
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(path.join(runDir, 'agent-report.md'), 'Report text\n');

  const interpreted = interpretAssignmentRunResult({
    choice: { operation: 'validate-plan' },
    runResult: {
      status: 'done',
      confidence: 'reported',
      runtime: { stdoutLog: path.join(runDir, 'stdout.log') },
      agentClaim: {
        status: 'done',
        verdict: 'READY',
        summary: 'Plan validated',
        realityGate: {
          modeFit: 'PASS',
          repoFit: 'PASS',
          assumptions: 'PASS',
          smallerPath: 'PASS',
          proofSurface: 'PASS',
          impactAnalysisPosture: 'PASS',
        },
        feasibilityMatrix: [{ risk: 'low', citation: 'src/main.js' }],
      },
      evidence: { artifacts: [path.join(runDir, 'agent-report.md')] },
    },
    repoRoot: tempDir,
  });

  assert.equal(interpreted.canAdvanceEdge, false);
  assert.equal(interpreted.stop, true);
  assert.equal(interpreted.reason, 'validate-plan-insufficient-evidence');
});

test('Finding 2 negative test: evidence-looking placeholder keys stop with validate-plan-insufficient-evidence', () => {
  const tempDir = mkTempDir();
  const runDir = path.join(tempDir, '.fgos', 'assignments', 'asgn_val_placeholder', 'runs', '01');
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(path.join(runDir, 'agent-report.md'), 'Report text\n');

  const interpreted = interpretAssignmentRunResult({
    choice: { operation: 'validate-plan' },
    runResult: {
      status: 'done',
      confidence: 'reported',
      runtime: { stdoutLog: path.join(runDir, 'stdout.log') },
      agentClaim: {
        status: 'done',
        verdict: 'READY',
        summary: 'Plan validated',
        realityGate: {
          modeFit: { status: 'PASS', citation: 'evidence-looking-key' },
          repoFit: { status: 'PASS', citation: 'placeholder' },
          assumptions: { status: 'PASS', citation: 'none' },
          smallerPath: { status: 'PASS', citation: 'todo' },
          proofSurface: { status: 'PASS', citation: 'tbd' },
          impactAnalysisPosture: { status: 'PASS', citation: 'n/a' },
        },
        feasibilityMatrix: [{ risk: 'low', citation: 'placeholder' }],
      },
      evidence: { artifacts: [path.join(runDir, 'agent-report.md')] },
    },
    repoRoot: tempDir,
  });

  assert.equal(interpreted.canAdvanceEdge, false);
  assert.equal(interpreted.stop, true);
  assert.equal(interpreted.reason, 'validate-plan-insufficient-evidence');
});

test('Finding 4 negative test: review-item evidenceRefs present but findings/report not citing those exact refs stops', () => {
  const tempDir = mkTempDir();
  const runDir = path.join(tempDir, '.fgos', 'assignments', 'asgn_rev_generic', 'runs', '01');
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(path.join(tempDir, 'candidate-diff.patch'), 'diff --git a/src/a.js b/src/a.js\n');
  fs.writeFileSync(path.join(tempDir, 'verify.log'), 'VERIFY: PASS\n');
  fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Review Report\nGeneric diff reviewed and verify passed.\n');

  const choice = {
    operation: 'review-item',
    assignment: { contextRefs: ['evidence:candidate-diff', 'evidence:verify-pass'] },
  };

  const interpreted = interpretAssignmentRunResult({
    choice,
    runResult: {
      status: 'done',
      confidence: 'reported',
      runtime: { stdoutLog: path.join(runDir, 'stdout.log') },
      agentClaim: {
        status: 'done',
        verdict: 'APPROVED',
        summary: 'Generic approval',
        evidenceRefs: ['evidence:candidate-diff', 'evidence:verify-pass'],
        findings: [{ comment: 'diff reviewed and verify passed' }],
      },
      evidence: { artifacts: [path.join(runDir, 'agent-report.md')] },
    },
    repoRoot: tempDir,
  });

  assert.equal(interpreted.canAdvanceEdge, false);
  assert.equal(interpreted.stop, true);
  assert.equal(interpreted.reason, 'review-item-insufficient-evidence');
});

test('Finding 3: chooseStageOperation ignores stale stored READY result when plan.md modified after assignment run', () => {
  const tempDir = mkTempDir();
  initRepo(tempDir);
  initStore(tempDir);
  seedTaskSpecs(tempDir, ['validate-plan', 'shape-plan']);

  const docsDir = path.join(tempDir, 'docs', 'history', 'feat-stale');
  fs.mkdirSync(docsDir, { recursive: true });
  const planPath = path.join(docsDir, 'plan.md');
  fs.writeFileSync(planPath, '# Mode: tiny\nOriginal plan.\n');

  const work = {
    id: 'tsk-stale-ready',
    stage: 'planning',
    domain: 'coding',
    workflow: 'feature',
    docsRef: 'docs/history/feat-stale',
  };

  // Create stored validate-plan READY assignment result in .fgos/assignments
  const asgnDir = path.join(tempDir, '.fgos', 'assignments', 'asgn_stale_1');
  const runDir = path.join(asgnDir, 'runs', '01');
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(path.join(asgnDir, 'assignment.json'), JSON.stringify({
    assignmentId: 'asgn_stale_1',
    workId: 'tsk-stale-ready',
    stage: 'planning',
    operation: 'validate-plan',
  }));
  fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Report\nPlan validated.\n');
  fs.writeFileSync(path.join(runDir, 'result.json'), JSON.stringify({
    status: 'done',
    confidence: 'reported',
    agentClaim: { status: 'done', verdict: 'READY', summary: 'Ready' },
  }));

  // Update plan.md timestamp to be newer than result.json
  const future = new Date(Date.now() + 5000);
  fs.utimesSync(planPath, future, future);

  const choice = chooseStageOperation({
    work,
    stage: 'planning',
    domain: 'coding',
    workflow: 'feature',
    repoRoot: tempDir,
  });

  // Stale READY result is ignored, choice dispatches validate-plan for fresh validation
  assert.equal(choice.operation, 'validate-plan');
  assert.equal(choice.reason, 'plan-written-needs-reality-check');
});

test('Finding 3: chooseStageOperation ignores stale stored READY result when plan.md modified after assignment run in worktree', () => {
  const tempDir = mkTempDir();
  initRepo(tempDir);
  initStore(tempDir);
  seedTaskSpecs(tempDir, ['validate-plan', 'shape-plan']);

  const id = 'tsk-stale-wt-ready';
  const docsRef = 'docs/history/feat-wt-stale';
  const branch = `fgw/${id}`;
  execFileSync('git', ['branch', branch], { cwd: tempDir });
  const wtDir = path.join(tempDir, 'fgw', id);
  execFileSync('git', ['worktree', 'add', wtDir, branch], { cwd: tempDir });
  const wtDocsDir = path.join(wtDir, docsRef);
  fs.mkdirSync(wtDocsDir, { recursive: true });
  const wtPlanPath = path.join(wtDocsDir, 'plan.md');
  fs.writeFileSync(wtPlanPath, '# Mode: tiny\nWorktree plan.\n');

  const work = {
    id,
    stage: 'planning',
    domain: 'coding',
    workflow: 'feature',
    docsRef,
  };

  // Create stored validate-plan READY assignment result in .fgos/assignments
  const asgnDir = path.join(tempDir, '.fgos', 'assignments', 'asgn_stale_wt_1');
  const runDir = path.join(asgnDir, 'runs', '01');
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(path.join(asgnDir, 'assignment.json'), JSON.stringify({
    assignmentId: 'asgn_stale_wt_1',
    workId: id,
    stage: 'planning',
    operation: 'validate-plan',
  }));
  fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Report\nPlan validated.\n');
  fs.writeFileSync(path.join(runDir, 'result.json'), JSON.stringify({
    status: 'done',
    confidence: 'reported',
    agentClaim: { status: 'done', verdict: 'READY', summary: 'Ready' },
  }));

  // Update worktree plan.md timestamp to be newer than result.json
  const future = new Date(Date.now() + 5000);
  fs.utimesSync(wtPlanPath, future, future);

  const choice = chooseStageOperation({
    work,
    stage: 'planning',
    domain: 'coding',
    workflow: 'feature',
    repoRoot: tempDir,
  });

  // Stale READY result is ignored because worktree plan.md was updated, dispatches validate-plan for fresh validation
  assert.equal(choice.operation, 'validate-plan');
  assert.equal(choice.reason, 'plan-written-needs-reality-check');
});

test('Finding 3: chooseStageOperation ignores latest non-validate assignment result on same Work id', () => {
  const tempDir = mkTempDir();
  initRepo(tempDir);
  initStore(tempDir);
  seedTaskSpecs(tempDir, ['validate-plan', 'shape-plan']);

  const docsDir = path.join(tempDir, 'docs', 'history', 'feat-nonval');
  fs.mkdirSync(docsDir, { recursive: true });
  fs.writeFileSync(path.join(docsDir, 'plan.md'), '# Mode: tiny\nPlan content.\n');

  const work = {
    id: 'tsk-nonval-op',
    stage: 'planning',
    domain: 'coding',
    workflow: 'feature',
    docsRef: 'docs/history/feat-nonval',
  };

  // Create stored scout-blast-radius assignment result for same workId
  const asgnDir = path.join(tempDir, '.fgos', 'assignments', 'asgn_nonval_1');
  const runDir = path.join(asgnDir, 'runs', '01');
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(path.join(asgnDir, 'assignment.json'), JSON.stringify({
    assignmentId: 'asgn_nonval_1',
    workId: 'tsk-nonval-op',
    stage: 'executing',
    operation: 'scout-blast-radius',
  }));
  fs.writeFileSync(path.join(runDir, 'result.json'), JSON.stringify({
    status: 'done',
    confidence: 'reported',
    agentClaim: { status: 'done', verdict: 'READY', summary: 'Scout done' },
  }));

  const choice = chooseStageOperation({
    work,
    stage: 'planning',
    domain: 'coding',
    workflow: 'feature',
    repoRoot: tempDir,
  });

  // Non-validate operation assignment is ignored
  assert.equal(choice.operation, 'validate-plan');
});

test('Finding 4: review-item selected without work.refs or candidate diff/verify refs stops before spawn', () => {
  const tempDir = mkTempDir();
  const work = {
    id: 'tsk-no-refs',
    stage: 'executing',
    domain: 'coding',
    workflow: 'feature',
    refs: [],
  };

  const choice = chooseStageOperation({
    work,
    stage: 'executing',
    domain: 'coding',
    workflow: 'feature',
    contextSignals: { needsReview: true, hasCandidateImplementation: false },
    repoRoot: tempDir,
  });

  assert.equal(choice.operation, 'review-item');
  assert.equal(choice.stop, true);
  assert.equal(choice.reason, 'review-item-missing-candidate-diff-and-verify-refs');
});

test('Finding 4: review-item happy path with candidate implementation signal binds candidate diff/verify refs into contextRefs', () => {
  const tempDir = mkTempDir();
  initRepo(tempDir);
  execFileSync('git', ['checkout', '-b', 'fgw/tsk-candidate-refs'], { cwd: tempDir });
  fs.writeFileSync(path.join(tempDir, 'feat.txt'), 'candidate impl\n');
  execFileSync('git', ['add', 'feat.txt'], { cwd: tempDir });
  execFileSync('git', ['commit', '-m', 'feat: candidate'], { cwd: tempDir });
  execFileSync('git', ['checkout', 'main'], { cwd: tempDir });
  const work = {
    id: 'tsk-candidate-refs',
    stage: 'executing',
    domain: 'coding',
    workflow: 'feature',
    refs: ['diff:feat-1', 'verify:pass-1'],
    verify: 'node -e "process.exit(0)"',
  };

  const choice = chooseStageOperation({
    work,
    stage: 'executing',
    domain: 'coding',
    workflow: 'feature',
    contextSignals: { hasCandidateImplementation: true },
    repoRoot: tempDir,
  });

  assert.equal(choice.operation, 'review-item');
  assert.equal(choice.stop, false);
  assert.ok(Array.isArray(choice.contextRefs));
  assert.ok(choice.contextRefs.some((r) => r.includes('diff')));
  assert.ok(choice.contextRefs.some((r) => r.includes('verify')));
});

test('Finding 5 negative test: resolve-question rejects placeholder citations in structured claims', () => {
  const tempDir = mkTempDir();
  const runDir = path.join(tempDir, '.fgos', 'assignments', 'asgn_res_ph', 'runs', '01');
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Research Report\nDetailed findings...\n');

  const placeholders = ['n/a', 'placeholder', 'none', 'todo', 'some random text without file or line ref'];

  for (const ph of placeholders) {
    const interpreted = interpretAssignmentRunResult({
      choice: { operation: 'resolve-question' },
      runResult: {
        status: 'done',
        confidence: 'reported',
        runtime: { stdoutLog: path.join(runDir, 'stdout.log') },
        agentClaim: {
          status: 'done',
          verdict: 'clear',
          answer: 'The answer is path A',
          citations: [ph],
        },
        evidence: { artifacts: [path.join(runDir, 'agent-report.md')] },
      },
      repoRoot: tempDir,
    });

    assert.equal(interpreted.canProceed, false, `Placeholder citation "${ph}" should fail canProceed`);
    assert.equal(interpreted.stop, true, `Placeholder citation "${ph}" should stop execution`);
    assert.equal(interpreted.reason, 'resolve-question-insufficient-evidence');
  }
});

test('P1 fix: review-item with hasCandidateImplementation: true but no real diff/verify refs stops before spawn', () => {
  const tempDir = mkTempDir();
  const work = {
    id: 'tsk-candidate-no-real-refs',
    stage: 'executing',
    domain: 'coding',
    workflow: 'feature',
    refs: [],
  };

  const choice = chooseStageOperation({
    work,
    stage: 'executing',
    domain: 'coding',
    workflow: 'feature',
    contextSignals: { hasCandidateImplementation: true },
    repoRoot: tempDir,
  });

  assert.equal(choice.operation, 'review-item');
  assert.equal(choice.stop, true);
  assert.equal(choice.reason, 'review-item-missing-candidate-diff-and-verify-refs');
});

test('P1 fix: review-item approval fails when only fabricated synthetic placeholder refs are supplied in approval', () => {
  const tempDir = mkTempDir();
  const work = {
    id: 'tsk-candidate-approval-fail',
    stage: 'executing',
    domain: 'coding',
    workflow: 'feature',
    refs: [],
  };

  const interpreted = interpretAssignmentRunResult({
    choice: { operation: 'review-item' },
    runResult: {
      status: 'done',
      confidence: 'reported',
      verdict: 'APPROVED',
      agentClaim: {
        status: 'done',
        verdict: 'APPROVED',
        evidenceRefs: ['evidence:candidate-diff', 'evidence:verify-pass'],
        findings: [{ text: 'APPROVED evidence:candidate-diff evidence:verify-pass' }],
      },
      evidence: { artifacts: ['agent-report.md'] },
    },
    work,
    repoRoot: tempDir,
  });

  assert.equal(interpreted.canProceed, undefined);
  assert.equal(interpreted.stop, true);
  assert.equal(interpreted.reason, 'review-item-missing-evidence-refs');
});

test('P1 fix: review-item happy path with real bound diff/verify refs still passes', () => {
  const tempDir = mkTempDir();
  initRepo(tempDir);
  execFileSync('git', ['checkout', '-b', 'fgw/tsk-real-bound-refs'], { cwd: tempDir });
  fs.writeFileSync(path.join(tempDir, 'patch.txt'), 'candidate impl\n');
  execFileSync('git', ['add', 'patch.txt'], { cwd: tempDir });
  execFileSync('git', ['commit', '-m', 'feat: candidate'], { cwd: tempDir });
  execFileSync('git', ['checkout', 'main'], { cwd: tempDir });
  const work = {
    id: 'tsk-real-bound-refs',
    stage: 'executing',
    domain: 'coding',
    workflow: 'feature',
    refs: ['diff:patch-01', 'verify:pass-01'],
    verify: 'node -e "process.exit(0)"',
  };

  const choice = chooseStageOperation({
    work,
    stage: 'executing',
    domain: 'coding',
    workflow: 'feature',
    contextSignals: { hasCandidateImplementation: true },
    repoRoot: tempDir,
  });

  assert.equal(choice.operation, 'review-item');
  assert.equal(choice.stop, false);
  assert.deepEqual(Array.from(choice.contextRefs), ['diff:patch-01', 'verify:pass-01']);
});

test('P1 fix: review-item in actual git repo with bogus refs (diff:patch-01, verify:pass-01) without real evidence fails closed', () => {
  const tempDir = mkTempDir();
  initRepo(tempDir);

  const runDir = path.join(tempDir, '.fgos', 'assignments', 'asgn_rev_bogus', 'runs', '01');
  fs.mkdirSync(runDir, { recursive: true });
  const reportPath = path.join(runDir, 'agent-report.md');
  fs.writeFileSync(reportPath, '# Review Report\nAPPROVED: diff:patch-01 verify:pass-01 clean evaluation\n');

  const work = {
    id: 'tsk-bogus-refs',
    stage: 'executing',
    verify: 'node -e "process.exit(0)"',
    refs: ['diff:patch-01', 'verify:pass-01'],
  };

  const choice = {
    operation: 'review-item',
    assignment: { contextRefs: ['diff:patch-01', 'verify:pass-01'] },
  };

  const interpreted = interpretAssignmentRunResult({
    choice,
    work,
    runResult: {
      status: 'done',
      confidence: 'reported',
      runtime: { stdoutLog: path.join(runDir, 'stdout.log') },
      agentClaim: {
        status: 'done',
        verdict: 'APPROVED',
        summary: 'Clean code',
        evidenceRefs: ['diff:patch-01', 'verify:pass-01'],
      },
      evidence: {
        artifacts: [reportPath],
      },
    },
    repoRoot: tempDir,
  });

  assert.equal(interpreted.canAdvanceEdge, false);
  assert.equal(interpreted.stop, true);
  assert.equal(interpreted.reason, 'review-item-missing-evidence-refs');
});

test('P1 fix: validate-plan with unreadable report and fake citations fails closed', () => {
  const tempDir = mkTempDir();
  const runResult = {
    status: 'done',
    confidence: 'reported',
    agentClaim: {
      status: 'done',
      verdict: 'READY',
      summary: 'Plan is ready',
      realityGate: {
        modeFit: 'PASS citation: no/such/file.mjs:L1',
        repoFit: 'PASS citation: no/such/file.mjs:L1',
        assumptionsFit: 'PASS citation: no/such/file.mjs:L1',
        smallerPathFit: 'PASS citation: no/such/file.mjs:L1',
        proofSurfaceFit: 'PASS citation: no/such/file.mjs:L1',
        impactAnalysisPosture: 'PASS citation: no/such/file.mjs:L1',
      },
      feasibilityMatrix: ['Feasible citation: no/such/file.mjs:L1'],
    },
    evidence: { artifacts: ['agent-report.md'] },
  };

  // Without repoRoot (unreadable report)
  const interpretedNoRoot = interpretAssignmentRunResult({
    choice: { operation: 'validate-plan' },
    runResult,
  });

  assert.equal(interpretedNoRoot.canAdvanceEdge, false);
  assert.equal(interpretedNoRoot.stop, true);
  assert.equal(interpretedNoRoot.reason, 'validate-plan-missing-report-artifact');

  // With repoRoot where file does not exist
  const interpretedWithRoot = interpretAssignmentRunResult({
    choice: { operation: 'validate-plan' },
    runResult,
    repoRoot: tempDir,
  });

  assert.equal(interpretedWithRoot.canAdvanceEdge, false);
  assert.equal(interpretedWithRoot.stop, true);
});

test('P2 fix: stale validate-plan check does not crash when lastRunResult is provided in-memory with existing plan.md', () => {
  const tempDir = mkTempDir();
  seedTaskSpecs(tempDir, ['validate-plan']);
  const docsDir = path.join(tempDir, 'docs', 'history', 'feat-stale-test');
  fs.mkdirSync(docsDir, { recursive: true });
  const planPath = path.join(docsDir, 'plan.md');
  fs.writeFileSync(planPath, '# Plan\nInitial content\n');

  const work = {
    id: 'tsk-stale-stat-test',
    stage: 'planning',
    domain: 'coding',
    workflow: 'feature',
    docsRef: 'docs/history/feat-stale-test',
  };

  const oldTime = new Date(Date.now() - 100000).toISOString();
  const lastRunResult = {
    operation: 'validate-plan',
    stage: 'planning',
    settledAt: oldTime,
    status: 'done',
    confidence: 'reported',
    agentClaim: { verdict: 'READY' },
  };

  // Calling chooseStageOperation must not throw ReferenceError: planStat is not defined
  assert.doesNotThrow(() => {
    const choice = chooseStageOperation({
      work,
      stage: 'planning',
      domain: 'coding',
      workflow: 'feature',
      lastRunResult,
      repoRoot: tempDir,
    });
    assert.equal(choice.operation, 'validate-plan');
    assert.equal(choice.reason, 'plan-written-needs-reality-check');
  });
});

test('Finding 1 regression test: Assignment-backed validate-plan with returned children or verdictPayload cannot create child Work', async () => {
  const tempDir = mkTempDir();
  initRepo(tempDir);
  initStore(tempDir);
  seedTaskSpecs(tempDir, ['validate-plan']);

  const docsDir = path.join(tempDir, 'docs', 'history', 'feat-val-children');
  fs.mkdirSync(docsDir, { recursive: true });
  fs.writeFileSync(path.join(docsDir, 'plan.md'), '# Mode: standard\nProposed plan.\n');

  addWork(tempDir, {
    id: 'tsk-val-no-children',
    title: 'Test validate-plan cannot decompose',
    stage: 'planning',
    status: 'todo',
    domain: 'coding',
    workflow: 'feature',
    kind: 'feature',
    risk: 'standard',
    deps: [],
    refs: [],
    verify: 'node -e "process.exit(0)"',
    docsRef: 'docs/history/feat-val-children',
  });

  const runDir = path.join(tempDir, '.fgos', 'assignments', 'asgn_val_child', 'runs', '01');
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(
    path.join(runDir, 'agent-report.md'),
    '# Reality Gate & Feasibility Report\n' +
      '## Reality Gate Score\n' +
      '- Mode fit: PASS (citation: src/runner/loop.mjs)\n' +
      '- Repo fit: PASS (citation: src/runner/loop.mjs)\n' +
      '- Assumptions: PASS (citation: src/runner/loop.mjs)\n' +
      '- Smaller path: PASS (citation: src/runner/loop.mjs)\n' +
      '- Proof surface: PASS (citation: src/runner/loop.mjs)\n' +
      '- Impact-analysis posture: PASS (citation: src/runner/loop.mjs)\n' +
      '## Feasibility Matrix\n- Risk 1: Low (verified: src/runner/loop.mjs)\n'
  );

  const executorScript = writeFakeExecutor(tempDir, {
    status: 'done',
    verdict: 'READY',
    summary: 'Validation ready with child proposal',
    children: [
      { title: 'Illegal Child Work 1', footprint: ['src/illegal1.mjs'], verify: 'node -e "process.exit(0)"' },
      { title: 'Illegal Child Work 2', footprint: ['src/illegal2.mjs'], verify: 'node -e "process.exit(0)"' },
    ],
    verdictPayload: {
      verdict: 'decompose',
      children: [
        { title: 'Illegal Child Work 1', footprint: ['src/illegal1.mjs'], verify: 'node -e "process.exit(0)"' },
      ],
    },
    realityGate: {
      'mode-fit': 'PASS (citation: src/runner/loop.mjs)',
      'repo-fit': 'PASS (citation: src/runner/loop.mjs)',
      'assumptions-fit': 'PASS (citation: src/runner/loop.mjs)',
      'smaller-path-fit': 'PASS (citation: src/runner/loop.mjs)',
      'proof-surface-fit': 'PASS (citation: src/runner/loop.mjs)',
      'impact-analysis-posture': 'PASS (citation: src/runner/loop.mjs)',
    },
    feasibilityMatrix: [{ risk: 'Risk 1', rating: 'Low', citation: 'src/runner/loop.mjs' }],
  });

  const cfg = runnerConfigFor(executorScript);
  const work = listWork(tempDir).work['tsk-val-no-children'];
  const choice = {
    operation: 'validate-plan',
    dispatch: 'assignment',
    stage: 'planning',
  };

  const outcome = await executeDriverOperationChoice(work, choice, {
    cwd: tempDir,
    repoRoot: tempDir,
    runnerConfig: cfg,
  });

  assert.equal(outcome.verdictPayload, undefined);
  assert.equal(outcome.canAdvanceEdge, true);

  // Check store state: no child work items added
  const currentStore = listWork(tempDir);
  const children = Object.values(currentStore.work).filter((w) => w.parent === 'tsk-val-no-children');
  assert.equal(children.length, 0);
});

test('Finding 2 regression test: report-only READY validate-plan without realityGate and feasibilityMatrix cannot advance', () => {
  const tempDir = mkTempDir();
  const runDir = path.join(tempDir, '.fgos', 'assignments', 'asgn_val_report_only', 'runs', '01');
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(
    path.join(runDir, 'agent-report.md'),
    '# Reality Gate & Feasibility Report\n' +
      '## Reality Gate Score\n' +
      '- Mode fit: PASS (citation: src/runner/loop.mjs)\n' +
      '- Repo fit: PASS (citation: src/runner/loop.mjs)\n' +
      '- Assumptions: PASS (citation: src/runner/loop.mjs)\n' +
      '- Smaller path: PASS (citation: src/runner/loop.mjs)\n' +
      '- Proof surface: PASS (citation: src/runner/loop.mjs)\n' +
      '- Impact-analysis posture: PASS (citation: src/runner/loop.mjs)\n' +
      '## Feasibility Matrix\n- Risk 1: Low (verified: src/runner/loop.mjs)\n'
  );

  const interpreted = interpretAssignmentRunResult({
    choice: { operation: 'validate-plan' },
    runResult: {
      status: 'done',
      confidence: 'reported',
      runtime: { stdoutLog: path.join(runDir, 'stdout.log') },
      agentClaim: { status: 'done', verdict: 'READY', summary: 'Plan ready' }, // missing realityGate + feasibilityMatrix
      evidence: { artifacts: [path.join(runDir, 'agent-report.md')] },
    },
    repoRoot: tempDir,
  });

  assert.equal(interpreted.canAdvanceEdge, false);
  assert.equal(interpreted.stop, true);
  assert.equal(interpreted.reason, 'validate-plan-insufficient-evidence');
});

test('Finding 3 regression test: citation: made-up-ref and nonexistent file references cannot advance validate-plan', () => {
  const tempDir = mkTempDir();
  const runDir = path.join(tempDir, '.fgos', 'assignments', 'asgn_val_fake_cite', 'runs', '01');
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(
    path.join(runDir, 'agent-report.md'),
    '# Reality Gate & Feasibility Report\n' +
      '## Reality Gate Score\n' +
      '- Mode fit: PASS (citation: made-up-ref)\n' +
      '- Repo fit: PASS (citation: made-up-ref)\n' +
      '- Assumptions: PASS (citation: made-up-ref)\n' +
      '- Smaller path: PASS (citation: made-up-ref)\n' +
      '- Proof surface: PASS (citation: made-up-ref)\n' +
      '- Impact-analysis posture: PASS (citation: made-up-ref)\n' +
      '## Feasibility Matrix\n- Risk 1: Low (verified: made-up-ref)\n'
  );

  // Test Case A: citation: made-up-ref
  const interpretedFakeCite = interpretAssignmentRunResult({
    choice: { operation: 'validate-plan' },
    runResult: {
      status: 'done',
      confidence: 'reported',
      runtime: { stdoutLog: path.join(runDir, 'stdout.log') },
      agentClaim: {
        status: 'done',
        verdict: 'READY',
        summary: 'Plan ready',
        realityGate: {
          'mode-fit': 'PASS (citation: made-up-ref)',
          'repo-fit': 'PASS (citation: made-up-ref)',
          'assumptions-fit': 'PASS (citation: made-up-ref)',
          'smaller-path-fit': 'PASS (citation: made-up-ref)',
          'proof-surface-fit': 'PASS (citation: made-up-ref)',
          'impact-analysis-posture': 'PASS (citation: made-up-ref)',
        },
        feasibilityMatrix: [{ risk: 'Risk 1', rating: 'Low', citation: 'citation: made-up-ref' }],
      },
      evidence: { artifacts: [path.join(runDir, 'agent-report.md')] },
    },
    repoRoot: tempDir,
  });

  assert.equal(interpretedFakeCite.canAdvanceEdge, false);
  assert.equal(interpretedFakeCite.stop, true);
  assert.equal(interpretedFakeCite.reason, 'validate-plan-insufficient-evidence');

  // Test Case B: nonexistent file reference
  const interpretedNonexistentFile = interpretAssignmentRunResult({
    choice: { operation: 'validate-plan' },
    runResult: {
      status: 'done',
      confidence: 'reported',
      runtime: { stdoutLog: path.join(runDir, 'stdout.log') },
      agentClaim: {
        status: 'done',
        verdict: 'READY',
        summary: 'Plan ready',
        realityGate: {
          'mode-fit': 'PASS (citation: src/nonexistent-file-123.mjs)',
          'repo-fit': 'PASS (citation: src/nonexistent-file-123.mjs)',
          'assumptions-fit': 'PASS (citation: src/nonexistent-file-123.mjs)',
          'smaller-path-fit': 'PASS (citation: src/nonexistent-file-123.mjs)',
          'proof-surface-fit': 'PASS (citation: src/nonexistent-file-123.mjs)',
          'impact-analysis-posture': 'PASS (citation: src/nonexistent-file-123.mjs)',
        },
        feasibilityMatrix: [{ risk: 'Risk 1', rating: 'Low', citation: 'src/nonexistent-file-123.mjs' }],
      },
      evidence: { artifacts: [path.join(runDir, 'agent-report.md')] },
    },
    repoRoot: tempDir,
  });

  assert.equal(interpretedNonexistentFile.canAdvanceEdge, false);
  assert.equal(interpretedNonexistentFile.stop, true);
  assert.equal(interpretedNonexistentFile.reason, 'validate-plan-insufficient-evidence');
});

test('Finding 4 regression test: missing agent-report.md plus inline report text cannot satisfy report artifact requirement', () => {
  const tempDir = mkTempDir();

  const interpreted = interpretAssignmentRunResult({
    choice: { operation: 'validate-plan' },
    runResult: {
      status: 'done',
      confidence: 'reported',
      agentClaim: {
        status: 'done',
        verdict: 'READY',
        summary: 'Plan ready',
        realityGate: {
          'mode-fit': 'PASS (citation: src/runner/loop.mjs)',
          'repo-fit': 'PASS (citation: src/runner/loop.mjs)',
          'assumptions-fit': 'PASS (citation: src/runner/loop.mjs)',
          'smaller-path-fit': 'PASS (citation: src/runner/loop.mjs)',
          'proof-surface-fit': 'PASS (citation: src/runner/loop.mjs)',
          'impact-analysis-posture': 'PASS (citation: src/runner/loop.mjs)',
        },
        feasibilityMatrix: [{ risk: 'Risk 1', rating: 'Low', citation: 'src/runner/loop.mjs' }],
      },
      evidence: {
        artifacts: [path.join(tempDir, 'missing-agent-report.md')],
        reportText:
          '# Reality Gate & Feasibility Report\n' +
          '## Reality Gate Score\n' +
          '- Mode fit: PASS (citation: src/runner/loop.mjs)\n' +
          '- Repo fit: PASS (citation: src/runner/loop.mjs)\n' +
          '- Assumptions: PASS (citation: src/runner/loop.mjs)\n' +
          '- Smaller path: PASS (citation: src/runner/loop.mjs)\n' +
          '- Proof surface: PASS (citation: src/runner/loop.mjs)\n' +
          '- Impact-analysis posture: PASS (citation: src/runner/loop.mjs)\n' +
          '## Feasibility Matrix\n- Risk 1: Low (verified: src/runner/loop.mjs)\n',
      },
    },
    repoRoot: tempDir,
  });

  assert.equal(interpreted.canAdvanceEdge, false);
  assert.equal(interpreted.stop, true);
  assert.equal(interpreted.reason, 'validate-plan-missing-report-artifact');
});

test('Finding 2: validate-plan matrix covering subset of medium+ risks in plan.md fails closed, covering all passes', () => {
  const tempDir = mkTempDir();
  const docsDir = path.join(tempDir, 'docs', 'feature');
  fs.mkdirSync(docsDir, { recursive: true });
  fs.writeFileSync(
    path.join(docsDir, 'plan.md'),
    '# plan.md\n\n' +
    '## Risk Map\n\n' +
    '| Risk | Level | Mitigation |\n' +
    '|---|---|---|\n' +
    '| auth | medium | ... |\n' +
    '| migration | high | ... |\n' +
    '| rollback | critical | ... |\n'
  );

  const mainFile = path.join(tempDir, 'src', 'main.mjs');
  fs.mkdirSync(path.dirname(mainFile), { recursive: true });
  fs.writeFileSync(mainFile, '// main\n');

  const reportDir = path.join(tempDir, 'run01');
  fs.mkdirSync(reportDir, { recursive: true });
  const reportPath = path.join(reportDir, 'agent-report.md');
  fs.writeFileSync(reportPath,
    '# Reality Gate Score & Feasibility Matrix Report\n' +
    'Mode fit: PASS (citation: src/main.mjs)\n' +
    'Repo fit: PASS (citation: src/main.mjs)\n' +
    'Assumptions: PASS (citation: src/main.mjs)\n' +
    'Smaller path: PASS (citation: src/main.mjs)\n' +
    'Proof surface: PASS (citation: src/main.mjs)\n' +
    'Impact-analysis posture: PASS (citation: src/main.mjs)\n' +
    'Feasibility matrix: verified.\n'
  );

  const work = { id: 'tsk-f2', docsRef: 'docs/feature' };

  // Negative test: feasibility matrix only covers "rollback", omitting "auth" and "migration".
  // Evidence scoping contract: report text is only read from a derivable run
  // dir, so these fixtures record the stdout log that locates the run dir
  // (the dir the report was physically written to).
  const resNegative = interpretAssignmentRunResult({
    choice: { operation: 'validate-plan' },
    runResult: {
      status: 'done',
      confidence: 'reported',
      agentClaim: {
        status: 'done',
        verdict: 'READY',
        realityGate: {
          'mode-fit': 'PASS (citation: src/main.mjs)',
          'repo-fit': 'PASS (citation: src/main.mjs)',
          'assumptions-fit': 'PASS (citation: src/main.mjs)',
          'smaller-path-fit': 'PASS (citation: src/main.mjs)',
          'proof-surface-fit': 'PASS (citation: src/main.mjs)',
          'impact-analysis-posture': 'PASS (citation: src/main.mjs)',
        },
        feasibilityMatrix: [{ risk: 'rollback', citation: 'src/main.mjs' }],
      },
      evidence: { artifacts: [reportPath] },
      runtime: { stdoutLog: path.join(reportDir, 'stdout.log') },
    },
    work,
    repoRoot: tempDir,
  });

  assert.equal(resNegative.canAdvanceEdge, false);
  assert.equal(resNegative.stop, true);
  assert.equal(resNegative.reason, 'validate-plan-insufficient-evidence');

  // Positive test: feasibility matrix covers all three medium+ risks ("auth", "migration", "rollback")
  const resPositive = interpretAssignmentRunResult({
    choice: { operation: 'validate-plan' },
    runResult: {
      status: 'done',
      confidence: 'reported',
      agentClaim: {
        status: 'done',
        verdict: 'READY',
        realityGate: {
          'mode-fit': 'PASS (citation: src/main.mjs)',
          'repo-fit': 'PASS (citation: src/main.mjs)',
          'assumptions-fit': 'PASS (citation: src/main.mjs)',
          'smaller-path-fit': 'PASS (citation: src/main.mjs)',
          'proof-surface-fit': 'PASS (citation: src/main.mjs)',
          'impact-analysis-posture': 'PASS (citation: src/main.mjs)',
        },
        feasibilityMatrix: [
          { risk: 'auth', citation: 'src/main.mjs' },
          { risk: 'migration', citation: 'src/main.mjs' },
          { risk: 'rollback', citation: 'src/main.mjs' },
        ],
      },
      evidence: { artifacts: [reportPath] },
      runtime: { stdoutLog: path.join(reportDir, 'stdout.log') },
    },
    work,
    repoRoot: tempDir,
  });

  assert.equal(resPositive.canAdvanceEdge, true);
  assert.equal(resPositive.stop, false);
  assert.equal(resPositive.reason, 'validate-plan-ready');
});

test('Finding 3: resolve-question report-text citation: made-up-ref without concrete citation fails closed', () => {
  const tempDir = mkTempDir();
  const reportDir = path.join(tempDir, 'run01');
  fs.mkdirSync(reportDir, { recursive: true });
  const reportPath = path.join(reportDir, 'agent-report.md');
  fs.writeFileSync(reportPath,
    '# Question Resolution Report\n' +
    'Answer: use option A\n' +
    'Citation: made-up-ref\n' +
    'Verdict: clear\n'
  );

  const res = interpretAssignmentRunResult({
    choice: { operation: 'resolve-question' },
    runResult: {
      status: 'done',
      confidence: 'reported',
      agentClaim: { status: 'done', summary: 'Answered' },
      evidence: { artifacts: [reportPath] },
      runtime: { stdoutLog: path.join(reportDir, 'stdout.log') },
    },
    repoRoot: tempDir,
  });

  assert.equal(res.canProceed, false);
  assert.equal(res.stop, true);
  assert.equal(res.reason, 'resolve-question-insufficient-evidence');
});

test('Finding 4: scout-blast-radius file-only and posture-only reports fail closed', () => {
  const tempDir = mkTempDir();
  const reportDir = path.join(tempDir, 'run01');
  fs.mkdirSync(reportDir, { recursive: true });

  // File-only report (missing posture, callers, affected, risk read)
  const reportFileOnly = path.join(reportDir, 'agent-report-file-only.md');
  fs.writeFileSync(reportFileOnly, '# Scout Report\nFiles: src/foo.mjs\n');

  const resFileOnly = interpretAssignmentRunResult({
    choice: { operation: 'scout-blast-radius' },
    runResult: {
      status: 'done',
      confidence: 'reported',
      agentClaim: { status: 'done', files: ['src/foo.mjs'] },
      evidence: { artifacts: [reportFileOnly] },
      runtime: { stdoutLog: path.join(reportDir, 'stdout.log') },
    },
    repoRoot: tempDir,
  });

  assert.equal(resFileOnly.canProceed, false);
  assert.equal(resFileOnly.stop, true);
  assert.equal(resFileOnly.reason, 'scout-blast-radius-insufficient-evidence');

  // Posture-only report (missing files/symbols, callers, affected, risk read)
  const reportPostureOnly = path.join(reportDir, 'agent-report-posture-only.md');
  fs.writeFileSync(reportPostureOnly, '# Scout Report\nSearch posture: rg checked\n');

  const resPostureOnly = interpretAssignmentRunResult({
    choice: { operation: 'scout-blast-radius' },
    runResult: {
      status: 'done',
      confidence: 'reported',
      agentClaim: { status: 'done', posture: 'rg checked' },
      evidence: { artifacts: [reportPostureOnly] },
      runtime: { stdoutLog: path.join(reportDir, 'stdout.log') },
    },
    repoRoot: tempDir,
  });

  assert.equal(resPostureOnly.canProceed, false);
  assert.equal(resPostureOnly.stop, true);
  assert.equal(resPostureOnly.reason, 'scout-blast-radius-insufficient-evidence');
});

test('Finding 1 regression tests: misspelled executing-stage markers like review-itm and fix-verfy-red stop without primary implementation dispatch', () => {
  const workReviewTypo = { id: 'tsk-1', stage: 'executing', domain: 'coding', secondaryOperation: 'review-itm' };
  const choiceReviewTypo = chooseStageOperation({ work: workReviewTypo });
  assert.equal(choiceReviewTypo.stop, true);
  assert.equal(choiceReviewTypo.dispatch, null);
  assert.equal(choiceReviewTypo.operation, 'review-itm');
  assert.equal(choiceReviewTypo.reason, 'undeclared-stage-operation-review-itm');

  const workFixTypo = { id: 'tsk-2', stage: 'executing', domain: 'coding', nextOperation: 'fix-verfy-red' };
  const choiceFixTypo = chooseStageOperation({ work: workFixTypo });
  assert.equal(choiceFixTypo.stop, true);
  assert.equal(choiceFixTypo.dispatch, null);
  assert.equal(choiceFixTypo.operation, 'fix-verfy-red');
  assert.equal(choiceFixTypo.reason, 'undeclared-stage-operation-fix-verfy-red');

  const workNoMarker = { id: 'tsk-3', stage: 'executing', domain: 'coding' };
  const choiceNoMarker = chooseStageOperation({ work: workNoMarker });
  assert.equal(choiceNoMarker.stop, false);
  assert.equal(choiceNoMarker.dispatch, 'direct-stage-skill');
  assert.equal(choiceNoMarker.operation, 'implement-item');
});

test('Finding 2 regression tests: keyword-only paths like docs/test-plan.md and docs/difficulty-notes.md cannot satisfy review evidence', () => {
  const workDiffPlusDoc = {
    id: 'tsk-rev-bind',
    stage: 'executing',
    domain: 'coding',
    refs: ['diff:candidate-1', 'docs/test-plan.md'],
  };
  const derivedDiffPlusDoc = deriveCandidateReviewRefs({ work: workDiffPlusDoc });
  assert.equal(derivedDiffPlusDoc.canProduce, false);

  const workDocPlusVerify = {
    id: 'tsk-rev-bind2',
    stage: 'executing',
    domain: 'coding',
    refs: ['docs/difficulty-notes.md', 'verify:pass'],
  };
  const derivedDocPlusVerify = deriveCandidateReviewRefs({ work: workDocPlusVerify });
  assert.equal(derivedDocPlusVerify.canProduce, false);

  const validDiffAndVerify = {
    id: 'tsk-rev-bind3',
    stage: 'executing',
    domain: 'coding',
    refs: ['diff:candidate-1', 'verify:pass'],
    verify: 'node -e "process.exit(0)"',
  };
  const validRepo = mkTempDir();
  initRepo(validRepo);
  execFileSync('git', ['checkout', '-b', 'fgw/tsk-rev-bind3'], { cwd: validRepo });
  fs.writeFileSync(path.join(validRepo, 'candidate-1.txt'), 'candidate impl\n');
  execFileSync('git', ['add', 'candidate-1.txt'], { cwd: validRepo });
  execFileSync('git', ['commit', '-m', 'feat: candidate'], { cwd: validRepo });
  execFileSync('git', ['checkout', 'main'], { cwd: validRepo });
  const derivedValid = deriveCandidateReviewRefs({
    work: validDiffAndVerify,
    repoRoot: validRepo,
  });
  assert.equal(derivedValid.canProduce, true);

  const isValidBoth = hasValidReviewEvidenceRefs(
    ['diff:candidate-1', 'verify:pass'],
    { assignment: { contextRefs: ['diff:candidate-1', 'verify:pass'] } },
    validDiffAndVerify,
    validRepo,
  );
  assert.equal(isValidBoth, true);

  const isValidDiffPlusDoc = hasValidReviewEvidenceRefs(
    ['diff:candidate-1', 'docs/test-plan.md'],
    { assignment: { contextRefs: ['diff:candidate-1', 'docs/test-plan.md'] } },
    workDiffPlusDoc,
  );
  assert.equal(isValidDiffPlusDoc, false);

  const isValidDocPlusVerify = hasValidReviewEvidenceRefs(
    ['docs/difficulty-notes.md', 'verify:pass'],
    { assignment: { contextRefs: ['docs/difficulty-notes.md', 'verify:pass'] } },
    workDocPlusVerify,
  );
  assert.equal(isValidDocPlusVerify, false);
});

test('Finding 3 regression tests: executeDriverOperationChoice stopped choices never spawn and human-only choices are non-executed', async () => {
  const tempDir = mkTempDir();
  const work = { id: 'tsk-stopped-choice', stage: 'executing', domain: 'coding' };

  const stoppedChoice = {
    operation: 'review-item',
    dispatch: 'assignment',
    stop: true,
    reason: 'review-item-missing-candidate-diff-and-verify-refs',
  };

  const outcome = await executeDriverOperationChoice(work, stoppedChoice, {
    cwd: tempDir,
    repoRoot: tempDir,
  });

  assert.equal(outcome.executed, false);
  assert.equal(outcome.stop, true);
  assert.equal(outcome.reason, 'review-item-missing-candidate-diff-and-verify-refs');
  assert.equal(fs.existsSync(path.join(tempDir, '.fgos', 'assignments')), false);

  const humanChoice = {
    operation: 'review-item',
    dispatch: 'human-only',
    stop: true,
    reason: 'human-only-operation',
  };

  const humanOutcome = await executeDriverOperationChoice(work, humanChoice, {
    cwd: tempDir,
    repoRoot: tempDir,
  });

  assert.equal(humanOutcome.executed, false);
  assert.equal(humanOutcome.dispatchType, 'human-only');
});

test('Fix validate-plan NOT READY verdict with em dash: interpretAssignmentRunResult returns shape-plan nextOperation', () => {
  const tempDir = mkTempDir();
  fs.mkdirSync(path.join(tempDir, 'src'), { recursive: true });
  fs.writeFileSync(path.join(tempDir, 'src', 'index.mjs'), '// src/index.mjs\n');

  const reportPath = path.join(tempDir, 'agent-report.md');
  fs.writeFileSync(
    reportPath,
    '# Validation Report\n## Reality gate\n- Mode fit: PASS (src/index.mjs)\n- Repo fit: PASS (src/index.mjs)\n- Assumptions: PASS (src/index.mjs)\n- Smaller path: PASS (src/index.mjs)\n- Proof surface: PASS (src/index.mjs)\n- Impact-analysis posture: PASS (src/index.mjs)\n## Feasibility matrix\n- medium risk: src/index.mjs\nValidation report notes reality gate and feasibility matrix.\n',
  );

  const runResult = {
    status: 'done',
    confidence: 'reported',
    operation: 'validate-plan',
    runDir: tempDir,
    runtime: { stdoutLog: path.join(tempDir, 'stdout.log') },
    workerArtifacts: [{ path: 'agent-report.md', kind: 'agent-report', valid: true }],
    agentClaim: {
      status: 'done',
      verdict: 'NOT READY — RETURN TO PLANNING',
      summary: 'Plan is not ready',
      realityGate: {
        modeFit: { status: 'PASS', citation: 'src/index.mjs' },
        repoFit: { status: 'PASS', citation: 'src/index.mjs' },
        assumptions: { status: 'PASS', citation: 'src/index.mjs' },
        smallerPath: { status: 'PASS', citation: 'src/index.mjs' },
        proofSurface: { status: 'PASS', citation: 'src/index.mjs' },
        impactAnalysisPosture: { status: 'PASS', citation: 'src/index.mjs' },
      },
      feasibilityMatrix: [
        { risk: 'medium risk', backing: 'src/index.mjs' },
      ],
    },
  };

  const interpreted = interpretAssignmentRunResult({
    choice: { operation: 'validate-plan' },
    runResult,
    repoRoot: tempDir,
  });

  assert.equal(interpreted.canAdvanceEdge, false);
  assert.equal(interpreted.stop, false);
  assert.equal(interpreted.nextOperation, 'shape-plan');
  assert.equal(interpreted.reason, 'validate-plan-return-to-planning');
});

test('Finding 1 fix: non-tiny/non-small plan where validate-plan returns READY and verdict is decompose creates children and advances Work', async () => {
  const tempDir = mkTempDir();
  initRepo(tempDir);
  initStore(tempDir);
  seedTaskSpecs(tempDir, ['validate-plan', 'shape-plan']);

  const docsDir = path.join(tempDir, 'docs', 'history', 'feat-med-decomp');
  fs.mkdirSync(docsDir, { recursive: true });
  fs.writeFileSync(path.join(docsDir, 'plan.md'), '# Mode: medium\nMedium split plan.\n## Locked decisions\n| ID | Decision |\n| D1 | Perform step 1 |\n');

  const children = [
    {
      title: 'Child item 1',
      verify: 'node -e "process.exit(0)"',
      action: 'Perform step 1 D1',
    },
  ];

  addWork(tempDir, {
    id: 'tsk-med-decomp',
    title: 'Test medium decompose driver loop',
    stage: 'planning',
    status: 'todo',
    domain: 'coding',
    workflow: 'feature',
    kind: 'feature',
    risk: 'standard',
    deps: [],
    refs: [],
    verify: 'node -e "process.exit(0)"',
    docsRef: 'docs/history/feat-med-decomp',
  });

  const reportPath = path.join(tempDir, 'agent-report.md');
  fs.writeFileSync(
    reportPath,
    '# Validation Report\n## Reality gate\n- Mode fit: PASS (docs/history/feat-med-decomp/plan.md)\n- Repo fit: PASS (docs/history/feat-med-decomp/plan.md)\n- Assumptions: PASS (docs/history/feat-med-decomp/plan.md)\n- Smaller path: PASS (docs/history/feat-med-decomp/plan.md)\n- Proof surface: PASS (docs/history/feat-med-decomp/plan.md)\n- Impact-analysis posture: PASS (docs/history/feat-med-decomp/plan.md)\n## Feasibility matrix\n- medium risk: docs/history/feat-med-decomp/plan.md\nValidation notes feasibility matrix.\n',
  );

  const executorScript = writeFakeExecutor(tempDir, {
    status: 'done',
    verdict: 'READY',
    summary: 'Plan validated',
    workerArtifacts: [{ path: 'agent-report.md', kind: 'agent-report', valid: true }],
    agentClaim: {
      status: 'done',
      verdict: 'READY',
      summary: 'Plan validated',
      realityGate: {
        modeFit: { status: 'PASS', citation: 'docs/history/feat-med-decomp/plan.md' },
        repoFit: { status: 'PASS', citation: 'docs/history/feat-med-decomp/plan.md' },
        assumptions: { status: 'PASS', citation: 'docs/history/feat-med-decomp/plan.md' },
        smallerPath: { status: 'PASS', citation: 'docs/history/feat-med-decomp/plan.md' },
        proofSurface: { status: 'PASS', citation: 'docs/history/feat-med-decomp/plan.md' },
        impactAnalysisPosture: { status: 'PASS', citation: 'docs/history/feat-med-decomp/plan.md' },
      },
      feasibilityMatrix: [{ risk: 'medium risk', backing: 'docs/history/feat-med-decomp/plan.md' }],
    },
  });

  const cfg = runnerConfigFor(executorScript);

  const callerVerdict = { verdict: 'decompose', reason: 'Split into subtasks', children };
  await runOnce({ dir: tempDir, repoRoot: tempDir, config: cfg, callerVerdict });

  const view = listWork(tempDir);
  const parentItem = view.work['tsk-med-decomp'];
  assert.equal(parentItem.stage, 'executing');

  const createdChildren = Object.values(view.work).filter((w) => w.parent === 'tsk-med-decomp');
  assert.equal(createdChildren.length, 1);
  assert.equal(createdChildren[0].title, 'Child item 1');
});

test('Finding 1 fix: non-tiny/non-small plan where validate-plan returns READY and verdict is pass-through advances Work', async () => {
  const tempDir = mkTempDir();
  initRepo(tempDir);
  initStore(tempDir);
  seedTaskSpecs(tempDir, ['validate-plan', 'shape-plan']);

  const docsDir = path.join(tempDir, 'docs', 'history', 'feat-med-pass');
  fs.mkdirSync(docsDir, { recursive: true });
  fs.writeFileSync(path.join(docsDir, 'plan.md'), '# Mode: medium\nMedium pass-through plan.\n');

  addWork(tempDir, {
    id: 'tsk-med-pass',
    title: 'Test medium pass-through driver loop',
    stage: 'planning',
    status: 'todo',
    domain: 'coding',
    workflow: 'feature',
    kind: 'feature',
    risk: 'standard',
    deps: [],
    refs: [],
    verify: 'node -e "process.exit(0)"',
    docsRef: 'docs/history/feat-med-pass',
  });

  const reportPath = path.join(tempDir, 'agent-report.md');
  fs.writeFileSync(
    reportPath,
    '# Validation Report\n## Reality gate\n- Mode fit: PASS (docs/history/feat-med-pass/plan.md)\n- Repo fit: PASS (docs/history/feat-med-pass/plan.md)\n- Assumptions: PASS (docs/history/feat-med-pass/plan.md)\n- Smaller path: PASS (docs/history/feat-med-pass/plan.md)\n- Proof surface: PASS (docs/history/feat-med-pass/plan.md)\n- Impact-analysis posture: PASS (docs/history/feat-med-pass/plan.md)\n## Feasibility matrix\n- medium risk: docs/history/feat-med-pass/plan.md\nValidation notes feasibility matrix.\n',
  );

  const executorScript = writeFakeExecutor(tempDir, {
    status: 'done',
    verdict: 'READY',
    summary: 'Plan validated',
    workerArtifacts: [{ path: 'agent-report.md', kind: 'agent-report', valid: true }],
    agentClaim: {
      status: 'done',
      verdict: 'READY',
      summary: 'Plan validated',
      realityGate: {
        modeFit: { status: 'PASS', citation: 'docs/history/feat-med-pass/plan.md' },
        repoFit: { status: 'PASS', citation: 'docs/history/feat-med-pass/plan.md' },
        assumptions: { status: 'PASS', citation: 'docs/history/feat-med-pass/plan.md' },
        smallerPath: { status: 'PASS', citation: 'docs/history/feat-med-pass/plan.md' },
        proofSurface: { status: 'PASS', citation: 'docs/history/feat-med-pass/plan.md' },
        impactAnalysisPosture: { status: 'PASS', citation: 'docs/history/feat-med-pass/plan.md' },
      },
      feasibilityMatrix: [{ risk: 'medium risk', backing: 'docs/history/feat-med-pass/plan.md' }],
    },
  });

  const cfg = runnerConfigFor(executorScript);

  const callerVerdict = { verdict: 'pass-through', reason: 'Single piece implementation' };
  await runOnce({ dir: tempDir, repoRoot: tempDir, config: cfg, callerVerdict });

  const parentItem = listWork(tempDir).work['tsk-med-pass'];
  assert.equal(parentItem.stage, 'executing');
});

test('Finding 2 fix: echoed sentinel refs without resolvable diff content or verify output stop review-item', () => {
  const dummyRepo = mkTempDir();
  const workSentinelsOnly = {
    id: 'tsk-sentinel-bare',
    stage: 'executing',
    domain: 'coding',
    refs: ['evidence:candidate-diff', 'evidence:verify-pass'],
  };

  const derived = deriveCandidateReviewRefs({ work: workSentinelsOnly, repoRoot: dummyRepo });
  assert.equal(derived.canProduce, false);

  const isValid = hasValidReviewEvidenceRefs(
    ['evidence:candidate-diff', 'evidence:verify-pass'],
    { contextRefs: ['evidence:candidate-diff', 'evidence:verify-pass'] },
    workSentinelsOnly,
    dummyRepo,
  );
  assert.equal(isValid, false);
});

test('review evidence gate: a tag named fgw/<id> is not a candidate branch and satisfies no gate', () => {
  const repoRoot = mkTempDir();
  initRepo(repoRoot);
  execFileSync('git', ['tag', 'fgw/tsk-rt-tag'], { cwd: repoRoot });

  const work = {
    id: 'tsk-rt-tag',
    stage: 'executing',
    domain: 'coding',
    refs: ['evidence:candidate-diff', 'evidence:verify-pass'],
    verify: 'node -e "process.exit(0)"',
  };

  assert.equal(isResolvableDiffRef('evidence:candidate-diff', { work, repoRoot }), false);
  assert.equal(isResolvableVerifyRef('evidence:verify-pass', { work, repoRoot }), false);

  const derived = deriveCandidateReviewRefs({ work, repoRoot });
  assert.equal(derived.canProduce, false);

  const choice = chooseStageOperation({
    work,
    stage: 'executing',
    domain: 'coding',
    workflow: 'feature',
    contextSignals: { secondaryOperation: 'review-item' },
    repoRoot,
  });
  assert.equal(choice.stop, true);
  assert.equal(choice.reason, 'review-item-missing-candidate-diff-and-verify-refs');
});

test('review evidence gate: an early-minted zero-commit fgw/<id> branch produces no candidate evidence', () => {
  const repoRoot = mkTempDir();
  initRepo(repoRoot);
  execFileSync('git', ['branch', 'fgw/tsk-rt-bare'], { cwd: repoRoot });

  const work = {
    id: 'tsk-rt-bare',
    stage: 'executing',
    domain: 'coding',
    refs: ['evidence:candidate-diff', 'evidence:verify-pass'],
    verify: 'node -e "process.exit(0)"',
  };

  assert.equal(isResolvableDiffRef('evidence:candidate-diff', { work, repoRoot }), false);

  const derived = deriveCandidateReviewRefs({ work, repoRoot });
  assert.equal(derived.canProduce, false);

  const choice = chooseStageOperation({
    work,
    stage: 'executing',
    domain: 'coding',
    workflow: 'feature',
    contextSignals: { secondaryOperation: 'review-item' },
    repoRoot,
  });
  assert.equal(choice.stop, true);
  assert.equal(choice.reason, 'review-item-missing-candidate-diff-and-verify-refs');
});

test('review evidence gate: a candidate branch with commits ahead of base resolves the diff gate but never the verify gate', () => {
  const repoRoot = mkTempDir();
  initRepo(repoRoot);
  execFileSync('git', ['checkout', '-b', 'fgw/tsk-rt-commits'], { cwd: repoRoot });
  fs.writeFileSync(path.join(repoRoot, 'candidate.txt'), 'candidate impl\n');
  execFileSync('git', ['add', 'candidate.txt'], { cwd: repoRoot });
  execFileSync('git', ['commit', '-m', 'feat: candidate'], { cwd: repoRoot });
  execFileSync('git', ['checkout', 'main'], { cwd: repoRoot });

  const workNoVerifyCommand = {
    id: 'tsk-rt-commits',
    stage: 'executing',
    domain: 'coding',
    refs: ['evidence:candidate-diff', 'evidence:verify-pass'],
  };

  assert.equal(isResolvableDiffRef('evidence:candidate-diff', { work: workNoVerifyCommand, repoRoot }), true);
  assert.equal(isResolvableVerifyRef('evidence:verify-pass', { work: workNoVerifyCommand, repoRoot }), false);

  const derived = deriveCandidateReviewRefs({ work: workNoVerifyCommand, repoRoot });
  assert.equal(derived.canProduce, false);
});

test('review evidence gate: repoRoot convention artifacts older than the Work item are stale and satisfy no gate', () => {
  const repoRoot = mkTempDir();
  const staleTime = new Date(Date.now() - 60 * 60 * 1000);
  fs.writeFileSync(path.join(repoRoot, 'candidate-diff.patch'), 'diff --git a/a.js b/a.js\n');
  fs.writeFileSync(path.join(repoRoot, 'verify.log'), 'VERIFY: PASS\n');
  fs.utimesSync(path.join(repoRoot, 'candidate-diff.patch'), staleTime, staleTime);
  fs.utimesSync(path.join(repoRoot, 'verify.log'), staleTime, staleTime);

  const work = {
    id: 'tsk-rt-stale',
    stage: 'executing',
    domain: 'coding',
    createdAt: new Date().toISOString(),
    refs: ['evidence:candidate-diff', 'evidence:verify-pass'],
    verify: 'node -e "process.exit(0)"',
  };

  assert.equal(isResolvableDiffRef('evidence:candidate-diff', { work, repoRoot }), false);
  assert.equal(isResolvableVerifyRef('evidence:verify-pass', { work, repoRoot }), false);

  const derived = deriveCandidateReviewRefs({ work, repoRoot });
  assert.equal(derived.canProduce, false);
});

test('review evidence gate: string-only refs and inline text claims are never evidence', () => {
  const repoRoot = mkTempDir();

  const work = {
    id: 'tsk-rt-strings',
    stage: 'executing',
    domain: 'coding',
    refs: ['evidence:candidate-diff', 'evidence:verify-pass'],
  };

  // Sentinel refs with no on-disk artifact, no git ref, no verify command.
  assert.equal(isResolvableDiffRef('evidence:candidate-diff', { work, repoRoot }), false);
  assert.equal(isResolvableVerifyRef('evidence:verify-pass', { work, repoRoot }), false);

  // Inline diff/verify text smuggled inside the ref string is not evidence.
  assert.equal(
    isResolvableDiffRef('evidence:candidate-diff\ndiff --git a/f.js b/f.js\n@@ -1 +1 @@', { work, repoRoot }),
    false,
  );
  assert.equal(isResolvableVerifyRef('verify:EXIT CODE: 0', { work, repoRoot }), false);
  assert.equal(isResolvableVerifyRef('verify:ALL 12 TESTS PASSED', { work, repoRoot }), false);

  // Report-text claims are verdict-interpretation input, not resolver evidence.
  assert.equal(
    isResolvableVerifyRef('evidence:verify-pass', { work, repoRoot, reportText: 'VERIFY: PASS EXIT CODE: 0' }),
    false,
  );

  // Caller-declared content/boolean signals are not evidence either.
  assert.equal(
    isResolvableDiffRef('evidence:candidate-diff', { work, repoRoot, contextSignals: { candidateDiffContent: 'diff --git a/x b/x', hasCandidateImplementation: true } }),
    false,
  );
  assert.equal(
    isResolvableVerifyRef('evidence:verify-pass', { work, repoRoot, contextSignals: { candidateVerifyContent: 'VERIFY: PASS', hasCandidateVerify: true } }),
    false,
  );

  const derived = deriveCandidateReviewRefs({ work, repoRoot });
  assert.equal(derived.canProduce, false);
});




// ---------------------------------------------------------------------------
// Cell 6.2: cross-pass staleness + read-back hardening for stored
// planning.validate-plan RunResults (findLatestAssignmentRunResult path).
// ---------------------------------------------------------------------------

const PLAN_V1_CONTENT = '# Mode: tiny\nOriginal plan.\n';

const SUBSTANTIVE_REPORT_TEXT =
  '# Reality Gate & Feasibility Report\n' +
  '## Reality Gate Score\n' +
  '- Mode fit: PASS (citation: src/runner/dispatch/operation-choice.mjs)\n' +
  '- Repo fit: PASS (citation: src/runner/dispatch/operation-choice.mjs)\n' +
  '- Assumptions: PASS (citation: src/runner/dispatch/operation-choice.mjs)\n' +
  '- Smaller path: PASS (citation: src/runner/dispatch/operation-choice.mjs)\n' +
  '- Proof surface: PASS (citation: src/runner/dispatch/operation-choice.mjs)\n' +
  '- Impact-analysis posture: PASS (citation: src/runner/dispatch/operation-choice.mjs)\n' +
  '## Feasibility Matrix\n- Low risk (verified: src/runner/dispatch/operation-choice.mjs)\n';

const READY_CLAIM_GATES = {
  'mode-fit': 'PASS (citation: src/runner/dispatch/operation-choice.mjs)',
  'repo-fit': 'PASS (citation: src/runner/dispatch/operation-choice.mjs)',
  'assumptions-fit': 'PASS (citation: src/runner/dispatch/operation-choice.mjs)',
  'smaller-path-fit': 'PASS (citation: src/runner/dispatch/operation-choice.mjs)',
  'proof-surface-fit': 'PASS (citation: src/runner/dispatch/operation-choice.mjs)',
  'impact-analysis-posture': 'PASS (citation: src/runner/dispatch/operation-choice.mjs)',
};

/** Hand-craft a stored validate-plan Assignment + run result the way the real
 * runner persists it: substantive report on disk, READY structured claim,
 * done/reported classification, the dispatch-time plan.md content hash the
 * runner records before the worker runs, the runner-owned dispatched-run
 * manifest in assignment.json, and the claim-bytes binding (sha256 of the
 * exact agent-result.json bytes the runner classified). */
function seedStoredValidatePlanResult(tempDir, { id, docsRef, planContent = PLAN_V1_CONTENT, withHash = false, withBinding = true, withReport = true, claimOverride = null, resultExtra = {}, manifest = ['01'], failedExit = null } = {}) {
  const docsDir = path.join(tempDir, docsRef);
  fs.mkdirSync(docsDir, { recursive: true });
  const planPath = path.join(docsDir, 'plan.md');
  fs.writeFileSync(planPath, planContent);

  const asgnDir = path.join(tempDir, '.fgos', 'assignments', `asgn_${id.replace(/[^a-z0-9_-]/gi, '_')}`);
  const runDir = path.join(asgnDir, 'runs', '01');
  fs.mkdirSync(runDir, { recursive: true });
  const asgnId = path.basename(asgnDir);
  fs.writeFileSync(path.join(asgnDir, 'assignment.json'), JSON.stringify({
    assignmentId: asgnId,
    workId: id,
    stage: 'planning',
    operation: 'validate-plan',
    dispatchedRuns: manifest,
  }));
  // Settle-report binding: the runner records every companion report artifact
  // it actually classified, with the sha256 of its exact bytes. An honest
  // no-report run records an EMPTY settle set — the binding of "the classifier
  // saw no report".
  const settleReports = [];
  if (withReport) {
    fs.writeFileSync(path.join(runDir, 'agent-report.md'), SUBSTANTIVE_REPORT_TEXT);
    settleReports.push({
      path: path.relative(tempDir, path.join(runDir, 'agent-report.md')),
      sha256: crypto.createHash('sha256').update(SUBSTANTIVE_REPORT_TEXT).digest('hex'),
    });
  }

  const agentClaim = claimOverride ?? {
    status: 'done',
    verdict: 'READY',
    summary: 'Plan validated',
    realityGate: READY_CLAIM_GATES,
    feasibilityMatrix: [{ risk: 'low', citation: 'src/runner/dispatch/operation-choice.mjs' }],
  };
  // The claim exists as worker-written bytes on disk; the binding recorded in
  // result.json is the sha256 of those exact bytes.
  const claimBytes = JSON.stringify(agentClaim);
  fs.writeFileSync(path.join(runDir, 'agent-result.json'), claimBytes);

  const resultJson = {
    runId: `run_${asgnId}_01`,
    assignmentId: asgnId,
    // failedExit != null mirrors the honest settle shape the runner records
    // for a process that exited non-zero (or timed out, exit 124) after
    // writing a valid claim + report: classified failed/failed, runtime
    // carries the recorded exitCode, the settle set still binds the report.
    status: failedExit != null ? 'failed' : 'done',
    confidence: failedExit != null ? 'failed' : (withReport ? 'reported' : 'no-evidence'),
    evidence: { artifacts: withReport ? [path.join(runDir, 'agent-report.md')] : [path.join(runDir, 'agent-result.json')], changedFiles: [], tests: [] },
    agentClaim,
    settleReports,
    ...(failedExit != null ? { runtime: { exitCode: failedExit, stdoutLog: path.relative(tempDir, path.join(runDir, 'stdout.log')), stderrLog: path.relative(tempDir, path.join(runDir, 'stderr.log')) } } : {}),
    ...(withBinding ? { claimSha256: crypto.createHash('sha256').update(claimBytes).digest('hex') } : {}),
    ...resultExtra,
  };
  if (withHash) {
    resultJson.planContentHash = crypto.createHash('sha256').update(fs.readFileSync(planPath)).digest('hex');
  }
  const resultPath = path.join(runDir, 'result.json');
  fs.writeFileSync(resultPath, JSON.stringify(resultJson));
  return { planPath, resultPath, runDir, asgnDir, asgnId };
}

function planningWorkFor(id, docsRef) {
  return { id, stage: 'planning', domain: 'coding', workflow: 'feature', docsRef };
}

function choosePlanning(tempDir, work, extra = {}) {
  return chooseStageOperation({
    work,
    stage: 'planning',
    domain: 'coding',
    workflow: 'feature',
    repoRoot: tempDir,
    ...extra,
  });
}

test('stored validate-plan result with a matching plan content hash is consumable cross-pass (same-content positive)', () => {
  const tempDir = mkTempDir();
  initRepo(tempDir);
  initStore(tempDir);
  seedTaskSpecs(tempDir, ['validate-plan', 'shape-plan']);

  const docsRef = 'docs/history/hash-consume';
  const { resultPath } = seedStoredValidatePlanResult(tempDir, {
    id: 'tsk-hash-consume',
    docsRef,
    withHash: true,
  });
  // Deterministic mtime order: result recorded strictly after plan.md.
  const future = new Date(Date.now() + 5000);
  fs.utimesSync(resultPath, future, future);

  const choice = choosePlanning(tempDir, planningWorkFor('tsk-hash-consume', docsRef));
  assert.equal(choice.canAdvanceEdge, true);
  assert.equal(choice.reason, 'validation-passed-ready-for-planning-edge');
});

test('stored validate-plan result whose plan content hash mismatches the current plan.md is never consumed cross-pass', () => {
  const tempDir = mkTempDir();
  initRepo(tempDir);
  initStore(tempDir);
  seedTaskSpecs(tempDir, ['validate-plan', 'shape-plan']);

  const docsRef = 'docs/history/hash-mismatch';
  const { planPath, resultPath } = seedStoredValidatePlanResult(tempDir, {
    id: 'tsk-hash-mismatch',
    docsRef,
    withHash: true,
  });

  // Edit plan.md AFTER the verdict settled, then hide the edit from the
  // mtime pre-filter: the worker controls mtimes, it cannot re-roll the
  // runner-recorded content hash.
  fs.writeFileSync(planPath, '# Mode: tiny\nEdited plan V2.\n');
  const future = new Date(Date.now() + 5000);
  fs.utimesSync(resultPath, future, future);

  const choice = choosePlanning(tempDir, planningWorkFor('tsk-hash-mismatch', docsRef));
  assert.equal(choice.reason, 'plan-written-needs-reality-check');
});

test('stored validate-plan result recorded without a plan content hash is not consumed when plan.md exists', () => {
  const tempDir = mkTempDir();
  initRepo(tempDir);
  initStore(tempDir);
  seedTaskSpecs(tempDir, ['validate-plan', 'shape-plan']);

  const docsRef = 'docs/history/hash-missing';
  const { resultPath } = seedStoredValidatePlanResult(tempDir, {
    id: 'tsk-hash-missing',
    docsRef,
    withHash: false,
  });
  const future = new Date(Date.now() + 5000);
  fs.utimesSync(resultPath, future, future);

  // Fail closed: without the dispatch-time content anchor there is no way to
  // prove the verdict was computed against the current plan revision.
  const choice = choosePlanning(tempDir, planningWorkFor('tsk-hash-missing', docsRef));
  assert.equal(choice.reason, 'plan-written-needs-reality-check');
});

test('tampered stored validate-plan result with a schema-broken agentClaim is never consumed cross-pass', () => {
  const tempDir = mkTempDir();
  initRepo(tempDir);
  initStore(tempDir);
  seedTaskSpecs(tempDir, ['validate-plan', 'shape-plan']);

  const docsRef = 'docs/history/hash-tampered-claim';
  const { resultPath } = seedStoredValidatePlanResult(tempDir, {
    id: 'tsk-hash-tampered-claim',
    docsRef,
    withHash: true,
    // Schema-invalid: validateAgentResultClaim requires a non-empty summary.
    // The verdict/gates stay intact so ONLY the schema re-validation can
    // reject this result.
    claimOverride: {
      status: 'done',
      verdict: 'READY',
      realityGate: READY_CLAIM_GATES,
      feasibilityMatrix: [{ risk: 'low', citation: 'src/runner/dispatch/operation-choice.mjs' }],
    },
  });
  const future = new Date(Date.now() + 5000);
  fs.utimesSync(resultPath, future, future);

  const choice = choosePlanning(tempDir, planningWorkFor('tsk-hash-tampered-claim', docsRef));
  assert.equal(choice.reason, 'plan-written-needs-reality-check');
});

test('tampered stored validate-plan result whose recorded evidence refs point at missing files is never consumed cross-pass', () => {
  const tempDir = mkTempDir();
  initRepo(tempDir);
  initStore(tempDir);
  seedTaskSpecs(tempDir, ['validate-plan', 'shape-plan']);

  const docsRef = 'docs/history/hash-dead-refs';
  const { resultPath } = seedStoredValidatePlanResult(tempDir, {
    id: 'tsk-hash-dead-refs',
    docsRef,
    withHash: true,
    // Unprefixed path refs that do not exist anywhere under repoRoot.
    claimOverride: {
      status: 'done',
      verdict: 'READY',
      summary: 'Plan validated',
      evidenceRefs: ['docs/history/hash-dead-refs/vanished-evidence.md', 'docs/vanished-proof.txt'],
      realityGate: READY_CLAIM_GATES,
      feasibilityMatrix: [{ risk: 'low', citation: 'src/runner/dispatch/operation-choice.mjs' }],
    },
  });
  const future = new Date(Date.now() + 5000);
  fs.utimesSync(resultPath, future, future);

  const choice = choosePlanning(tempDir, planningWorkFor('tsk-hash-dead-refs', docsRef));
  assert.equal(choice.reason, 'plan-written-needs-reality-check');
});

test('in-memory validate-plan result carrying a mismatched plan content hash is not consumed even when its settle time postdates the plan edit', () => {
  const tempDir = mkTempDir();
  initRepo(tempDir);
  initStore(tempDir);
  seedTaskSpecs(tempDir, ['validate-plan', 'shape-plan']);

  const docsRef = 'docs/history/hash-inmemory';
  const docsDir = path.join(tempDir, docsRef);
  fs.mkdirSync(docsDir, { recursive: true });
  const planPath = path.join(docsDir, 'plan.md');
  fs.writeFileSync(planPath, PLAN_V1_CONTENT);

  const reportDir = path.join(tempDir, 'reports', 'in-memory-u6');
  fs.mkdirSync(reportDir, { recursive: true });
  fs.writeFileSync(path.join(reportDir, 'agent-report.md'), SUBSTANTIVE_REPORT_TEXT);

  const lastRunResult = {
    status: 'done',
    confidence: 'reported',
    // Settled AFTER the (hypothetical) plan edit: the mtime/staleness branch
    // passes, so only the recorded content hash can reject this result.
    settledAt: new Date(Date.now() + 30000).toISOString(),
    planContentHash: crypto.createHash('sha256').update('# Mode: tiny\nEdited plan V2.\n').digest('hex'),
    agentClaim: {
      status: 'done',
      verdict: 'READY',
      summary: 'Plan validated',
      realityGate: READY_CLAIM_GATES,
      feasibilityMatrix: [{ risk: 'low', citation: 'src/runner/dispatch/operation-choice.mjs' }],
    },
    evidence: { artifacts: [path.join(reportDir, 'agent-report.md')] },
  };

  const choice = choosePlanning(tempDir, planningWorkFor('tsk-hash-inmemory', docsRef), { lastRunResult });
  assert.equal(choice.reason, 'plan-written-needs-reality-check');
});

// --- Fix round 1 (red-team F2c/F2d/F4b): dispatched-run membership, claim-bytes
// --- binding, run-dir-local artifacts, dead-ref tightening. All RED before the
// --- matching production change.

test('F2d(a): a phantom run dir the runner never dispatched is never consumed cross-pass even when fully self-consistent', () => {
  const tempDir = mkTempDir();
  initRepo(tempDir);
  initStore(tempDir);
  seedTaskSpecs(tempDir, ['validate-plan', 'shape-plan']);

  const docsRef = 'docs/history/f2d-phantom';
  const { planPath, asgnDir, asgnId } = seedStoredValidatePlanResult(tempDir, {
    id: 'tsk-f2d-phantom',
    docsRef,
    withHash: true,
    manifest: ['01'],
  });

  // Post-exit writer plants runs/02 beyond the dispatched set: fully
  // self-consistent (own report, own claim bytes, binding over those bytes,
  // plan hash recomputed for the edited plan, future mtime). ONLY the
  // dispatched-run manifest can reject it.
  const planV2 = `${fs.readFileSync(planPath, 'utf8')}\n<!-- V2: unvalidated edit -->\n`;
  fs.writeFileSync(planPath, planV2);
  const forgedDir = path.join(asgnDir, 'runs', '02');
  fs.mkdirSync(forgedDir, { recursive: true });
  const forgedClaim = {
    status: 'done',
    verdict: 'READY',
    summary: 'Plan validated',
    realityGate: READY_CLAIM_GATES,
    feasibilityMatrix: [{ risk: 'low', citation: 'src/runner/dispatch/operation-choice.mjs' }],
  };
  const forgedClaimBytes = JSON.stringify(forgedClaim);
  fs.writeFileSync(path.join(forgedDir, 'agent-report.md'), SUBSTANTIVE_REPORT_TEXT);
  fs.writeFileSync(path.join(forgedDir, 'agent-result.json'), forgedClaimBytes);
  const forgedResultPath = path.join(forgedDir, 'result.json');
  fs.writeFileSync(forgedResultPath, JSON.stringify({
    runId: `run_${asgnId}_02`,
    assignmentId: asgnId,
    status: 'done',
    confidence: 'reported',
    planContentHash: crypto.createHash('sha256').update(planV2).digest('hex'),
    claimSha256: crypto.createHash('sha256').update(forgedClaimBytes).digest('hex'),
    evidence: { artifacts: [path.join(forgedDir, 'agent-report.md')], changedFiles: [], tests: [] },
    agentClaim: forgedClaim,
  }));
  const future = new Date(Date.now() + 5000);
  fs.utimesSync(forgedResultPath, future, future);

  const choice = choosePlanning(tempDir, planningWorkFor('tsk-f2d-phantom', docsRef));
  assert.equal(choice.reason, 'plan-written-needs-reality-check');
});

test('F2c: a stored result recorded without the claim-bytes binding is not consumable (fail closed)', () => {
  const tempDir = mkTempDir();
  initRepo(tempDir);
  initStore(tempDir);
  seedTaskSpecs(tempDir, ['validate-plan', 'shape-plan']);

  const docsRef = 'docs/history/f2c-no-binding';
  const { resultPath } = seedStoredValidatePlanResult(tempDir, {
    id: 'tsk-f2c-no-binding',
    docsRef,
    withHash: true,
    withBinding: false,
  });
  const future = new Date(Date.now() + 5000);
  fs.utimesSync(resultPath, future, future);

  // Without the settle-time binding there is no way to prove the stored
  // claim is the claim the runner classified — same fail-closed precedent
  // as the missing plan content hash.
  const choice = choosePlanning(tempDir, planningWorkFor('tsk-f2c-no-binding', docsRef));
  assert.equal(choice.reason, 'plan-written-needs-reality-check');
});

test('F2c: a schema-valid verdict flip inside the stored result.json is never consumed cross-pass', () => {
  const tempDir = mkTempDir();
  initRepo(tempDir);
  initStore(tempDir);
  seedTaskSpecs(tempDir, ['validate-plan', 'shape-plan']);

  const docsRef = 'docs/history/f2c-flip';
  const { resultPath } = seedStoredValidatePlanResult(tempDir, {
    id: 'tsk-f2c-flip',
    docsRef,
    withHash: true,
  });

  // Schema-valid tamper: flip the stored verdict to READY without touching
  // the run's own agent-result.json bytes (whose binding still holds). Only
  // re-reading the claim and comparing it against the stored copy can catch
  // this divergence.
  const flipped = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
  flipped.agentClaim = { ...flipped.agentClaim, verdict: 'READY', summary: 'Plan sound and ready.' };
  fs.writeFileSync(resultPath, JSON.stringify(flipped, null, 2));

  const choice = choosePlanning(tempDir, planningWorkFor('tsk-f2c-flip', docsRef));
  assert.equal(choice.reason, 'plan-written-needs-reality-check');
});

test('F4b: mixed live+ghost evidence refs resolving inside the run tree are never consumed cross-pass', () => {
  const tempDir = mkTempDir();
  initRepo(tempDir);
  initStore(tempDir);
  seedTaskSpecs(tempDir, ['validate-plan', 'shape-plan']);

  const docsRef = 'docs/history/f4b-mixed';
  const asgnDir = path.join(tempDir, '.fgos', 'assignments', 'asgn_tsk-f4b-mixed');
  const runDir = path.join(asgnDir, 'runs', '01');
  const { resultPath } = seedStoredValidatePlanResult(tempDir, {
    id: 'tsk-f4b-mixed',
    docsRef,
    withHash: true,
    // The claim itself (file bytes and stored copy agree, binding holds) cites
    // one live in-tree path and one ghost in-tree path.
    claimOverride: {
      status: 'done',
      verdict: 'READY',
      summary: 'Plan validated',
      evidenceRefs: [
        path.relative(tempDir, path.join(runDir, 'agent-report.md')),
        path.relative(tempDir, path.join(asgnDir, 'runs', '01', 'ghost-evidence.md')),
      ],
      realityGate: READY_CLAIM_GATES,
      feasibilityMatrix: [{ risk: 'low', citation: 'src/runner/dispatch/operation-choice.mjs' }],
    },
  });
  const future = new Date(Date.now() + 5000);
  fs.utimesSync(resultPath, future, future);

  const choice = choosePlanning(tempDir, planningWorkFor('tsk-f4b-mixed', docsRef));
  assert.equal(choice.reason, 'plan-written-needs-reality-check');
});

test('F2d(b): interpretation never satisfies the report gate from a sibling run\'s recorded artifact path', () => {
  const tempDir = mkTempDir();
  const asgnDir = path.join(tempDir, '.fgos', 'assignments', 'asgn_f2d_sib');
  const siblingRunDir = path.join(asgnDir, 'runs', '01');
  const consumingRunDir = path.join(asgnDir, 'runs', '02');
  fs.mkdirSync(consumingRunDir, { recursive: true });
  fs.mkdirSync(siblingRunDir, { recursive: true });
  // The sibling run's REAL substantive report — the only report on disk.
  fs.writeFileSync(path.join(siblingRunDir, 'agent-report.md'), SUBSTANTIVE_REPORT_TEXT);

  const interpreted = interpretAssignmentRunResult({
    choice: { operation: 'validate-plan' },
    runResult: {
      runId: 'run_asgn_f2d_sib_02',
      assignmentId: 'asgn_f2d_sib',
      status: 'done',
      confidence: 'reported',
      runtime: { stdoutLog: path.join(consumingRunDir, 'stdout.log') },
      agentClaim: {
        status: 'done',
        verdict: 'READY',
        summary: 'Plan validated',
        realityGate: READY_CLAIM_GATES,
        feasibilityMatrix: [{ risk: 'low', citation: 'src/runner/dispatch/operation-choice.mjs' }],
      },
      // Spread-inherited sibling path: the consuming run's own dir has no report.
      evidence: { artifacts: [path.join(siblingRunDir, 'agent-report.md')] },
    },
    repoRoot: tempDir,
  });

  assert.equal(interpreted.canAdvanceEdge, false);
  assert.equal(interpreted.stop, true);
  assert.equal(interpreted.reason, 'validate-plan-missing-report-artifact');
});

test('F2d(c): a member whose runId was corrupted is skipped at the scan — a planted out-tree report never satisfies the gate', () => {
  const tempDir = mkTempDir();
  initRepo(tempDir);
  initStore(tempDir);
  seedTaskSpecs(tempDir, ['validate-plan', 'shape-plan']);

  const docsRef = 'docs/history/f2dc-spoof';
  // Honest pass 1: READY claim written by the worker, but NO report artifact
  // — the run dir has nothing for the report gate to read.
  const { resultPath } = seedStoredValidatePlanResult(tempDir, {
    id: 'tsk-f2dc-spoof',
    docsRef,
    withHash: true,
    withReport: false,
  });
  // Result.json-only tamper: agentClaim and agent-result.json are untouched,
  // so the claim-bytes binding still holds. The attacker corrupts the runId
  // (killing runId-based evidence derivation) and redirects the result's own
  // evidence fields at a substantive report planted OUTSIDE the assignment
  // tree — under stdoutLog-based scoping this relocates the report gate to
  // a file the attacker authored.
  const plantedDir = path.join(tempDir, 'docs', 'history', 'f2dc-spoof', 'planted');
  fs.mkdirSync(plantedDir, { recursive: true });
  fs.writeFileSync(path.join(plantedDir, 'agent-report.md'), SUBSTANTIVE_REPORT_TEXT);
  const tampered = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
  tampered.runId = 'spoofed-no-run-prefix';
  tampered.status = 'done';
  tampered.confidence = 'reported';
  tampered.evidence = { ...tampered.evidence, artifacts: [path.join('docs', 'history', 'f2dc-spoof', 'planted', 'agent-report.md')] };
  tampered.runtime = { stdoutLog: path.join('docs', 'history', 'f2dc-spoof', 'planted', 'run.log') };
  fs.writeFileSync(resultPath, JSON.stringify(tampered, null, 2));
  const future = new Date(Date.now() + 5000);
  fs.utimesSync(resultPath, future, future);

  const choice = choosePlanning(tempDir, planningWorkFor('tsk-f2dc-spoof', docsRef));
  assert.equal(choice.canAdvanceEdge, false, 'a result whose runId does not match the dispatched member must never be consumed');
  assert.equal(choice.reason, 'plan-written-needs-reality-check', 'the corrupted member is skipped — fresh validate-plan re-dispatch');
});

test('F2d(c): a runId-less member cannot relocate its evidence via runtime.stdoutLog — scoping stays pinned to the dispatched run dir', () => {
  const tempDir = mkTempDir();
  initRepo(tempDir);
  initStore(tempDir);
  seedTaskSpecs(tempDir, ['validate-plan', 'shape-plan']);

  const docsRef = 'docs/history/f2dc-pin';
  const { resultPath } = seedStoredValidatePlanResult(tempDir, {
    id: 'tsk-f2dc-pin',
    docsRef,
    withHash: true,
    withReport: false,
  });
  // Same tamper family, but the redirect points INSIDE the assignment tree
  // at a sibling run dir no runner dispatched (runs/02), and the attacker
  // DELETES the runId so the stdoutLog fallback is the only derivation left.
  const asgnDir = path.join(tempDir, '.fgos', 'assignments', 'asgn_tsk-f2dc-pin');
  const plantedRunDir = path.join(asgnDir, 'runs', '02');
  fs.mkdirSync(plantedRunDir, { recursive: true });
  fs.writeFileSync(path.join(plantedRunDir, 'agent-report.md'), SUBSTANTIVE_REPORT_TEXT);
  const tampered = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
  delete tampered.runId;
  tampered.status = 'done';
  tampered.confidence = 'reported';
  tampered.evidence = { ...tampered.evidence, artifacts: [path.join(plantedRunDir, 'agent-report.md')] };
  tampered.runtime = { stdoutLog: path.join(plantedRunDir, 'stdout.log') };
  fs.writeFileSync(resultPath, JSON.stringify(tampered, null, 2));
  const future = new Date(Date.now() + 5000);
  fs.utimesSync(resultPath, future, future);

  const choice = choosePlanning(tempDir, planningWorkFor('tsk-f2dc-pin', docsRef));
  assert.equal(choice.canAdvanceEdge, false, 'evidence must be read from the dispatched run dir only — the planted sibling report is ignored');
  // Assertion-contract change (round 3): with read-back re-derivation, the
  // flipped stored confidence is inert — the empty settle set re-derives
  // no-evidence, which stops BEFORE the report-artifact gate (previously
  // this asserted 'validate-plan-missing-report-artifact' with the stored
  // reported confidence still authoritative). chooseStageOperation maps the
  // interpretation's no-evidence stop to its own surface reason — same
  // stop, one level up.
  assert.equal(choice.reason, 'validation-no-evidence-do-not-advance-work', 're-derivation from the empty settle set classifies the run no-evidence — stored fields are advisory');
});

test('P4a: a planted pinned-dir report plus result.json-only field edits cannot forge a READY verdict — evidence derives from the settle-bound set', () => {
  const tempDir = mkTempDir();
  initRepo(tempDir);
  initStore(tempDir);
  seedTaskSpecs(tempDir, ['validate-plan', 'shape-plan']);

  const docsRef = 'docs/history/p4a-plant';
  // Honest pass 1: READY claim, NO report — classified no-evidence, claim
  // bytes bound, settle set empty.
  const { resultPath, runDir } = seedStoredValidatePlanResult(tempDir, {
    id: 'tsk-p4a-plant',
    docsRef,
    withHash: true,
    withReport: false,
  });
  // The P4a chain: (1) plant a substantive report INSIDE the pinned dir, (2)
  // edit plan.md to V2 tiny with a rewound mtime, (3) result.json field edits
  // ONLY — recompute the plan hash for V2, flip status/confidence, point
  // evidence.artifacts at the planted report. agentClaim and the worker's own
  // agent-result.json are untouched, so the claim-bytes binding still holds.
  fs.writeFileSync(path.join(runDir, 'agent-report.md'), SUBSTANTIVE_REPORT_TEXT);
  const planPath = path.join(tempDir, docsRef, 'plan.md');
  fs.appendFileSync(planPath, 'Mode: tiny\n');
  fs.utimesSync(planPath, new Date(Date.now() - 60000), new Date(Date.now() - 60000));
  const tampered = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
  tampered.planContentHash = crypto.createHash('sha256').update(fs.readFileSync(planPath)).digest('hex');
  tampered.status = 'done';
  tampered.confidence = 'reported';
  tampered.evidence = {
    ...tampered.evidence,
    artifacts: [path.join(runDir, 'agent-report.md'), path.join(runDir, 'agent-result.json')],
  };
  fs.writeFileSync(resultPath, JSON.stringify(tampered, null, 2));
  const future = new Date(Date.now() + 5000);
  fs.utimesSync(resultPath, future, future);

  const choice = choosePlanning(tempDir, planningWorkFor('tsk-p4a-plant', docsRef));
  assert.equal(choice.canAdvanceEdge, false, 'a report the classifier never bound at settle can never satisfy the report gate');
  // chooseStageOperation maps the interpretation's no-evidence stop to its
  // own surface reason — same stop, one level up.
  assert.equal(choice.reason, 'validation-no-evidence-do-not-advance-work', 're-derivation over the empty settle set classifies the run no-evidence — stored fields are advisory');
});

test('P4a: a settle-bound report edited after settle fails the byte binding — the member is skipped, never consumed', () => {
  const tempDir = mkTempDir();
  initRepo(tempDir);
  initStore(tempDir);
  seedTaskSpecs(tempDir, ['validate-plan', 'shape-plan']);

  const docsRef = 'docs/history/p4a-drift';
  const { runDir } = seedStoredValidatePlanResult(tempDir, {
    id: 'tsk-p4a-drift',
    docsRef,
    withHash: true,
    withReport: true,
  });
  // Post-settle drift: the bound report's bytes change after the runner
  // classified them, so the recorded settle hash no longer matches disk.
  fs.appendFileSync(path.join(runDir, 'agent-report.md'), '\nDrifted after settle.\n');

  const choice = choosePlanning(tempDir, planningWorkFor('tsk-p4a-drift', docsRef));
  assert.equal(choice.canAdvanceEdge, false, 'settle-bound evidence that no longer matches its recorded bytes must never be consumed');
  assert.equal(choice.reason, 'plan-written-needs-reality-check', 'the drift-bound member is skipped — fresh validate-plan re-dispatch');
});

test('P4a: a confidence/status flip in result.json is never authoritative — an empty settle set derives no-evidence even with a planted report present', () => {
  const tempDir = mkTempDir();
  initRepo(tempDir);
  initStore(tempDir);
  seedTaskSpecs(tempDir, ['validate-plan', 'shape-plan']);

  const docsRef = 'docs/history/p4a-flip';
  const { resultPath, runDir } = seedStoredValidatePlanResult(tempDir, {
    id: 'tsk-p4a-flip',
    docsRef,
    withHash: true,
    withReport: false,
  });
  // Field-only flip, no plan edit: plant the report in the pinned dir and
  // flip the unbound status/confidence fields. Even with the planted file
  // physically present, the settle set (empty) decides the classification.
  fs.writeFileSync(path.join(runDir, 'agent-report.md'), SUBSTANTIVE_REPORT_TEXT);
  const tampered = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
  tampered.status = 'done';
  tampered.confidence = 'reported';
  tampered.evidence = { ...tampered.evidence, artifacts: [path.join(runDir, 'agent-report.md'), path.join(runDir, 'agent-result.json')] };
  fs.writeFileSync(resultPath, JSON.stringify(tampered, null, 2));
  const future = new Date(Date.now() + 5000);
  fs.utimesSync(resultPath, future, future);

  const choice = choosePlanning(tempDir, planningWorkFor('tsk-p4a-flip', docsRef));
  assert.equal(choice.canAdvanceEdge, false, 'stored confidence fields are advisory — the settle set decides');
  // chooseStageOperation maps the interpretation's no-evidence stop to its
  // own surface reason — same stop, one level up.
  assert.equal(choice.reason, 'validation-no-evidence-do-not-advance-work', 'the empty settle set derives no-evidence regardless of the stored flip');
});

test('S3a: an exitCode field flip on a settle-classified failed run never re-derives it to done/reported — the settle verdict stands', () => {
  const tempDir = mkTempDir();
  initRepo(tempDir);
  initStore(tempDir);
  seedTaskSpecs(tempDir, ['validate-plan', 'shape-plan']);

  // Honest settle shape: the process wrote a valid READY claim + substantive
  // report, then exited 1 — classified failed/failed at settle, report bound.
  const docsRef = 'docs/history/s3a-exit-flip';
  const { resultPath } = seedStoredValidatePlanResult(tempDir, {
    id: 'tsk-s3a-exit-flip',
    docsRef,
    withHash: true,
    withReport: true,
    failedExit: 1,
  });
  // One result.json field edit: runtime.exitCode 1 -> 0. Claim bytes, settle
  // set, plan hash, stored status/confidence all honest.
  const tampered = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
  tampered.runtime = { ...tampered.runtime, exitCode: 0 };
  fs.writeFileSync(resultPath, JSON.stringify(tampered, null, 2));
  const future = new Date(Date.now() + 5000);
  fs.utimesSync(resultPath, future, future);

  const choice = choosePlanning(tempDir, planningWorkFor('tsk-s3a-exit-flip', docsRef));
  assert.equal(choice.canAdvanceEdge, false, 'a failed RunResult must never advance Work — re-derivation may not erase a recorded failure');
  assert.equal(choice.reason, 'validation-failed-do-not-advance-work', 'the settle-time failed verdict stands when the derived pair would ascend');
});

test('S3b: deleting runtime.exitCode cannot erase a settle-classified failure', () => {
  const tempDir = mkTempDir();
  initRepo(tempDir);
  initStore(tempDir);
  seedTaskSpecs(tempDir, ['validate-plan', 'shape-plan']);

  const docsRef = 'docs/history/s3b-exit-delete';
  const { resultPath } = seedStoredValidatePlanResult(tempDir, {
    id: 'tsk-s3b-exit-delete',
    docsRef,
    withHash: true,
    withReport: true,
    failedExit: 1,
  });
  const tampered = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
  delete tampered.runtime.exitCode;
  fs.writeFileSync(resultPath, JSON.stringify(tampered, null, 2));
  const future = new Date(Date.now() + 5000);
  fs.utimesSync(resultPath, future, future);

  const choice = choosePlanning(tempDir, planningWorkFor('tsk-s3b-exit-delete', docsRef));
  assert.equal(choice.canAdvanceEdge, false, 'an absence the attacker created is not the absence of a failure');
  assert.equal(choice.reason, 'validation-failed-do-not-advance-work', 'deleting the failure signal cannot upgrade the settle-time failed verdict');
});

test('S3e: a timed-out run whose exitCode flips 124 -> 0 stays failed — the timeout is never erased by one field', () => {
  const tempDir = mkTempDir();
  initRepo(tempDir);
  initStore(tempDir);
  seedTaskSpecs(tempDir, ['validate-plan', 'shape-plan']);

  const docsRef = 'docs/history/s3e-timeout';
  const { resultPath } = seedStoredValidatePlanResult(tempDir, {
    id: 'tsk-s3e-timeout',
    docsRef,
    withHash: true,
    withReport: true,
    failedExit: 124,
  });
  const tampered = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
  tampered.runtime = { ...tampered.runtime, exitCode: 0 };
  fs.writeFileSync(resultPath, JSON.stringify(tampered, null, 2));
  const future = new Date(Date.now() + 5000);
  fs.utimesSync(resultPath, future, future);

  const choice = choosePlanning(tempDir, planningWorkFor('tsk-s3e-timeout', docsRef));
  assert.equal(choice.canAdvanceEdge, false, 'a timed-out run re-written as exit 0 must not re-derive to done/reported');
  assert.equal(choice.reason, 'validation-failed-do-not-advance-work', 'the settle-time failed verdict survives the exitCode rewrite');
});

test('reviewer LOW: a stored failed result from a read-only dirty mutation never re-derives upward — the unpersisted dirty signal cannot be manufactured post-settle', () => {
  const tempDir = mkTempDir();
  initRepo(tempDir);
  initStore(tempDir);
  seedTaskSpecs(tempDir, ['validate-plan', 'shape-plan']);

  const docsRef = 'docs/history/s3-dirty-mutation';
  // Honest settle shape with ZERO tampering: exit 0, valid claim + bound
  // report, but the read-only worker mutated a pre-dirty file at run time
  // (hasDirtyBeforeMutation true) so the classifier recorded failed/failed.
  // That flag is not persisted in result.json, so plain re-derivation would
  // lose it — the settle verdict must stand instead.
  const { resultPath } = seedStoredValidatePlanResult(tempDir, {
    id: 'tsk-s3-dirty',
    docsRef,
    withHash: true,
    withReport: true,
    failedExit: 0,
  });
  // Deterministic mtime order only — no field edit: the stored pair stays
  // the honest failed/failed the runner recorded.
  const future = new Date(Date.now() + 5000);
  fs.utimesSync(resultPath, future, future);

  const choice = choosePlanning(tempDir, planningWorkFor('tsk-s3-dirty', docsRef));
  assert.equal(choice.canAdvanceEdge, false, 'a settle-classified failed run stays failed even when the derivation inputs alone would call it reported');
  assert.equal(choice.reason, 'validation-failed-do-not-advance-work', 'the lost dirty-mutation fact may not upgrade the recorded failed verdict');
});

test('R6/G3: cross-pass re-derivation reads a persisted mutatedDirtyBeforeFiles fact and correctly reports failed, not silently downgraded to no-evidence', () => {
  const tempDir = mkTempDir();
  initRepo(tempDir);
  initStore(tempDir);
  seedTaskSpecs(tempDir, ['validate-plan', 'shape-plan']);

  const docsRef = 'docs/history/r6-dirty-mutation-persisted';
  const { resultPath } = seedStoredValidatePlanResult(tempDir, {
    id: 'tsk-r6-dirty-persisted',
    docsRef,
    withHash: true,
    withReport: false,
  });

  // Honest settle shape: a read-only worker mutated a pre-existing dirty
  // file (fail-closed at settle time, exit 0, no claim was ever written, no
  // report), and the runner persisted the real mutatedDirtyBeforeFiles fact
  // this cell adds. Without R6, hasDirtyBeforeMutation is hardcoded false
  // cross-pass, so `changedFiles: [] || false` never trips the read-only
  // fail-close branch, agentClaim is null so the done/blocked branches are
  // skipped too, and the settled failed/failed verdict is silently
  // downgraded to no-evidence/no-evidence on read-back (a real bug -- see
  // this cell's safety-reasoning writeup for why this is a correctness
  // fix, not just a hardening one).
  const stored = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
  stored.status = 'failed';
  stored.confidence = 'failed';
  stored.agentClaim = null;
  delete stored.claimSha256;
  stored.settleReports = [];
  stored.runtime = { exitCode: 0, stdoutLog: 'stdout.log', stderrLog: 'stderr.log' };
  stored.evidence = {
    ...stored.evidence,
    changedFiles: [],
    mutatedDirtyBeforeFiles: [path.join(docsRef, 'preexisting-dirty.txt')],
  };
  fs.writeFileSync(resultPath, JSON.stringify(stored, null, 2));
  const future = new Date(Date.now() + 5000);
  fs.utimesSync(resultPath, future, future);

  const choice = choosePlanning(tempDir, planningWorkFor('tsk-r6-dirty-persisted', docsRef));
  assert.equal(choice.canAdvanceEdge, false);
  assert.equal(choice.reason, 'validation-failed-do-not-advance-work',
    'the persisted mutatedDirtyBeforeFiles fact must re-derive to failed, not silently downgrade to no-evidence');
});

test('R6/G3: an empty (but present) persisted mutatedDirtyBeforeFiles correctly derives false -- unchanged dirty files never block a legitimate reported verdict', () => {
  const tempDir = mkTempDir();
  initRepo(tempDir);
  initStore(tempDir);
  seedTaskSpecs(tempDir, ['validate-plan', 'shape-plan']);

  const docsRef = 'docs/history/r6-dirty-unchanged';
  const { resultPath } = seedStoredValidatePlanResult(tempDir, {
    id: 'tsk-r6-dirty-unchanged',
    docsRef,
    withHash: true,
    withReport: true,
  });

  const stored = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
  // A genuinely-unchanged pre-existing dirty file: the runner recorded an
  // EXPLICIT empty mutatedDirtyBeforeFiles, not an absent key -- this must
  // derive `false`, not just fall through to a default that happens to
  // also be false.
  stored.evidence = { ...stored.evidence, mutatedDirtyBeforeFiles: [] };
  fs.writeFileSync(resultPath, JSON.stringify(stored, null, 2));
  const future = new Date(Date.now() + 5000);
  fs.utimesSync(resultPath, future, future);

  const choice = choosePlanning(tempDir, planningWorkFor('tsk-r6-dirty-unchanged', docsRef));
  assert.equal(choice.canAdvanceEdge, true);
  assert.equal(choice.reason, 'validation-passed-ready-for-planning-edge',
    'an explicit empty mutatedDirtyBeforeFiles must derive hasDirtyBeforeMutation: false, not block a legitimate reported verdict');
});

test('R6/G3: an evidence.json written before this field existed (no mutatedDirtyBeforeFiles key) fails safe to hasDirtyBeforeMutation: false', () => {
  const tempDir = mkTempDir();
  initRepo(tempDir);
  initStore(tempDir);
  seedTaskSpecs(tempDir, ['validate-plan', 'shape-plan']);

  const docsRef = 'docs/history/r6-legacy-no-key';
  const { resultPath } = seedStoredValidatePlanResult(tempDir, {
    id: 'tsk-r6-legacy-no-key',
    docsRef,
    withHash: true,
    withReport: false,
  });

  const stored = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
  // Legacy shape: settled no-evidence (no claim, no report), and this
  // result.json predates R6 -- no mutatedDirtyBeforeFiles key at all.
  stored.status = 'no-evidence';
  stored.confidence = 'no-evidence';
  stored.agentClaim = null;
  delete stored.claimSha256;
  stored.settleReports = [];
  stored.runtime = { exitCode: 0, stdoutLog: 'stdout.log', stderrLog: 'stderr.log' };
  stored.evidence = { changedFiles: [] };
  fs.writeFileSync(resultPath, JSON.stringify(stored, null, 2));
  const future = new Date(Date.now() + 5000);
  fs.utimesSync(resultPath, future, future);

  const choice = choosePlanning(tempDir, planningWorkFor('tsk-r6-legacy-no-key', docsRef));
  assert.equal(choice.canAdvanceEdge, false);
  assert.equal(choice.reason, 'validation-no-evidence-do-not-advance-work',
    'a missing mutatedDirtyBeforeFiles key must fail safe to hasDirtyBeforeMutation: false, matching the no-evidence settle verdict');
});

test('R6/G3: a malformed (non-array) mutatedDirtyBeforeFiles fails safe to hasDirtyBeforeMutation: false rather than throwing', () => {
  const tempDir = mkTempDir();
  initRepo(tempDir);
  initStore(tempDir);
  seedTaskSpecs(tempDir, ['validate-plan', 'shape-plan']);

  const docsRef = 'docs/history/r6-malformed-field';
  const { resultPath } = seedStoredValidatePlanResult(tempDir, {
    id: 'tsk-r6-malformed-field',
    docsRef,
    withHash: true,
    withReport: true,
  });

  const stored = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
  // A tampered or corrupted result.json where mutatedDirtyBeforeFiles is
  // present but not an array (e.g. a stray boolean/string) -- the
  // Array.isArray guard must fail safe to false, never throw and never
  // coerce a truthy non-array into hasDirtyBeforeMutation: true.
  stored.evidence = { ...stored.evidence, mutatedDirtyBeforeFiles: true };
  fs.writeFileSync(resultPath, JSON.stringify(stored, null, 2));
  const future = new Date(Date.now() + 5000);
  fs.utimesSync(resultPath, future, future);

  const choice = choosePlanning(tempDir, planningWorkFor('tsk-r6-malformed-field', docsRef));
  assert.equal(choice.canAdvanceEdge, true);
  assert.equal(choice.reason, 'validation-passed-ready-for-planning-edge',
    'a non-array mutatedDirtyBeforeFiles must fail safe via Array.isArray, never throw or coerce to hasDirtyBeforeMutation: true');
});

test('ADR-006 R7 (P02.4 mutation backfill): findLatestAssignmentRunResult re-derives mutation from the operation when assignment.json predates the field -- a genuinely read-only validate-plan result is not misclassified as mutating', () => {
  const tempDir = mkTempDir();
  initRepo(tempDir);
  initStore(tempDir);
  seedTaskSpecs(tempDir, ['validate-plan', 'shape-plan']);

  const docsRef = 'docs/history/r7-mutation-backfill';
  // seedStoredValidatePlanResult's assignment.json intentionally carries no
  // `role`/`mutation` field -- the "assignment.json predates the field"
  // scenario R5 already documented for `resultKind` and this cell now closes
  // for `mutation` too. No external evidence (no changedFiles, no dirty
  // mutation) -- a genuinely read-only validate-plan result.
  const { resultPath, asgnDir } = seedStoredValidatePlanResult(tempDir, {
    id: 'tsk-r7-mutation-backfill',
    docsRef,
    withHash: true,
    withReport: true,
  });
  const asgnJson = JSON.parse(fs.readFileSync(path.join(asgnDir, 'assignment.json'), 'utf8'));
  assert.equal(asgnJson.mutation, undefined, 'fixture precondition: assignment.json carries no mutation field');
  const future = new Date(Date.now() + 5000);
  fs.utimesSync(resultPath, future, future);

  const choice = choosePlanning(tempDir, planningWorkFor('tsk-r7-mutation-backfill', docsRef));
  // Without the backfill, isReadOnlyAssignment(asgn) sees mutation ===
  // undefined and returns false (R7's own field-only read has no fallback),
  // misclassifying this genuinely read-only result as mutating --
  // classifyRunEvidence then falls into the mutating "done" branch
  // (hasExternalEvidence false) and derives no-evidence/no-evidence,
  // blocking the edge instead of advancing it. With the backfill, mutation
  // re-derives to 'read-only' for the validate-plan operation (the same
  // value assignment-normalizer.mjs would have stamped at build time), and
  // the reported claim + bound report correctly advances the edge.
  assert.equal(choice.canAdvanceEdge, true,
    'a stored validate-plan result with no persisted mutation field must still classify read-only via the operation-derived backfill');
  assert.equal(choice.reason, 'validation-passed-ready-for-planning-edge',
    'the mutation backfill must let a genuinely read-only cross-pass result advance the edge, not misclassify it as mutating no-evidence');
});

// ---------------------------------------------------------------------------
// ADR-006 R5: interpretAssignmentRunResult/findLatestAssignmentRunResult
// dispatch on the Assignment's own stamped fields, not the operation id;
// executeDriverOperationChoice's validate-plan special case becomes
// onAdvance dispatch to Phase 01's planVerdictFromPlanMd.
// ---------------------------------------------------------------------------

test('ADR-006 R5: interpretAssignmentRunResult dispatches into the validate-plan-shaped branch off the stamped resultKind "gate-verdict", independent of the operation string', () => {
  // The operation string here names an operation that has no branch of its
  // own at all ("shape-plan" falls through to the final unsupported-operation
  // catch-all when read the old way). The ONLY way the validate-plan-shaped
  // branch can fire is by reading `choice.assignment.resultKind` -- proving
  // the dispatch key genuinely changed, not merely that the five originally-
  // tested operation strings still happen to work.
  const interpreted = interpretAssignmentRunResult({
    choice: { operation: 'shape-plan', assignment: { resultKind: 'gate-verdict' } },
    runResult: {
      status: 'done',
      confidence: 'reported',
      agentClaim: { status: 'done', verdict: 'READY', summary: 'Feasible' },
      evidence: { artifacts: ['agent-result.json'] },
    },
  });
  assert.equal(interpreted.canAdvanceEdge, false);
  assert.equal(interpreted.stop, true);
  // 'validate-plan-missing-report-artifact' is a reason string that only the
  // validate-plan-shaped branch body ever returns (checked before any of that
  // branch's other logic) -- reaching it proves that branch executed, not the
  // final `assignment-shape-plan-unsupported-operation` catch-all.
  assert.equal(interpreted.reason, 'validate-plan-missing-report-artifact');
});

test('ADR-006 R5: interpretAssignmentRunResult dispatches into the review-item-shaped branch off the stamped resultKind "review-verdict", independent of the operation string', () => {
  const interpreted = interpretAssignmentRunResult({
    choice: { operation: 'not-a-real-operation', assignment: { resultKind: 'review-verdict' } },
    runResult: { status: 'done', confidence: 'reported' },
  });
  assert.equal(interpreted.canAdvanceEdge, false);
  assert.equal(interpreted.stop, true);
  // 'review-item-missing-evidence-refs' is review-item's own branch body's
  // FIRST check -- reaching it proves the review-item-shaped branch fired
  // off resultKind alone, since 'not-a-real-operation' matches no operation
  // string anywhere in the function.
  assert.equal(interpreted.reason, 'review-item-missing-evidence-refs');
});

test('ADR-006 R5: an Assignment with no stamped resultKind at all (bare choice, no assignment field) still resolves an unrecognized operation to the unsupported-operation catch-all — the fallback derivation never invents a resultKind for an operation outside the known table', () => {
  const interpreted = interpretAssignmentRunResult({
    choice: { operation: 'not-a-real-operation' },
    runResult: { status: 'done', confidence: 'reported' },
  });
  assert.equal(interpreted.stop, true);
  assert.equal(interpreted.reason, 'assignment-not-a-real-operation-unsupported-operation');
});

test('ADR-006 R5: findLatestAssignmentRunResult filters candidates by the stamped resultKind field, not the operation id (planning cross-pass path unaffected when assignment.json predates the field)', () => {
  // seedStoredValidatePlanResult (Cell 6.2 fixture, above) writes
  // assignment.json with `operation: 'validate-plan'` and no `resultKind`
  // field at all -- the exact shape an assignment.json written before this
  // ADR-006 stamp existed would have. The permissive-on-missing-field filter
  // must still surface it (same stance the old operation-based filter took).
  const tempDir = mkTempDir();
  seedTaskSpecs(tempDir, ['validate-plan', 'shape-plan']);
  const docsRef = 'docs/history/r5-resultkind-filter';
  seedStoredValidatePlanResult(tempDir, { id: 'tsk-r5-filter', docsRef, withHash: true, withReport: true });

  const choice = choosePlanning(tempDir, planningWorkFor('tsk-r5-filter', docsRef));
  assert.equal(choice.canAdvanceEdge, true, 'a stored validate-plan result with no resultKind field on disk must still be found and interpreted');
  assert.equal(choice.reason, 'validation-passed-ready-for-planning-edge');
});

test('ADR-006 R5: executeDriverOperationChoice validate-plan onAdvance dispatch derives a decompose verdictPayload from plan.md\'s own committed "## Split" section', async () => {
  const tempDir = mkTempDir();
  seedTaskSpecs(tempDir, ['validate-plan']);
  const docsRef = 'docs/history/r5-onadvance-decompose';
  const docsDir = path.join(tempDir, docsRef);
  fs.mkdirSync(docsDir, { recursive: true });
  fs.writeFileSync(
    path.join(docsDir, 'plan.md'),
    '# Mode: standard\nProposed plan.\n\n## Split\n```json\n[{"title": "Child A"}]\n```\n',
  );

  const executorScript = writeFakeExecutor(tempDir, { status: 'done', verdict: 'READY', summary: 'READY' });
  const work = { id: 'tsk-r5-onadvance', status: 'doing', stage: 'planning', domain: 'coding', workflow: 'feature', docsRef };
  const choice = chooseStageOperation({ work, contextSignals: { hasPlan: true, validationDue: true } });

  const outcome = await executeDriverOperationChoice(work, choice, {
    cwd: tempDir,
    repoRoot: tempDir,
    runnerConfig: runnerConfigFor(executorScript),
  });

  assert.equal(outcome.canAdvanceEdge, true);
  assert.equal(outcome.assignment.onAdvance, 'derive-plan-verdict-from-plan-md');
  assert.deepEqual(outcome.verdictPayload, {
    verdict: 'decompose',
    children: [{ title: 'Child A' }],
    reason: 'plan.md\'s own "## Split" section declares a split into 1 piece(s).',
  });
});

test('ADR-006 R5: executeDriverOperationChoice validate-plan onAdvance dispatch resolves verdictPayload undefined when plan.md never reaches a "## Split" section — never fabricates a verdict from silence', async () => {
  const tempDir = mkTempDir();
  seedTaskSpecs(tempDir, ['validate-plan']);
  const docsRef = 'docs/history/r5-onadvance-no-split';
  const docsDir = path.join(tempDir, docsRef);
  fs.mkdirSync(docsDir, { recursive: true });
  fs.writeFileSync(path.join(docsDir, 'plan.md'), '# Mode: standard\nProposed plan, no split section at all.\n');

  const executorScript = writeFakeExecutor(tempDir, { status: 'done', verdict: 'READY', summary: 'READY' });
  const work = { id: 'tsk-r5-onadvance-noop', status: 'doing', stage: 'planning', domain: 'coding', workflow: 'feature', docsRef };
  const choice = chooseStageOperation({ work, contextSignals: { hasPlan: true, validationDue: true } });

  const outcome = await executeDriverOperationChoice(work, choice, {
    cwd: tempDir,
    repoRoot: tempDir,
    runnerConfig: runnerConfigFor(executorScript),
  });

  assert.equal(outcome.canAdvanceEdge, true);
  assert.equal(outcome.assignment.onAdvance, 'derive-plan-verdict-from-plan-md');
  assert.equal(outcome.verdictPayload, undefined);
});
