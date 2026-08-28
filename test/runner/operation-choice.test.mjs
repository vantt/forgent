import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  chooseStageOperation,
  executeDriverOperationChoice,
  hasPlanMd,
  interpretAssignmentRunResult,
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
  const payloadStr = JSON.stringify({
    status: 'done',
    summary: 'Plan is feasible',
    verdict: 'READY',
    ...payloadOverrides,
  });
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
        fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Review Report\\nPlan holds up under reality check.\\n');
        fs.writeFileSync(resultPath, ${JSON.stringify(payloadStr)});
        if (${Boolean(payloadOverrides.appendConstraintsToPlan)}) {
          const cwd = process.cwd();
          const planFiles = fs.readdirSync(cwd, { recursive: true }).filter((f) => String(f).endsWith('plan.md'));
          for (const pf of planFiles) {
            const full = path.join(cwd, pf);
            try {
              const old = fs.readFileSync(full, 'utf8');
              fs.writeFileSync(full, old + '\\n## Constraints\\n- Must complete in 1 iteration\\n');
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
  const executorScript = writeNoEvidenceExecutor(tempDir);

  const runnerConfig = {
    executor: {
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
    repoRoot: PROJECT_ROOT,
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
  const executorScript = writeFailingExecutor(tempDir);

  const runnerConfig = {
    executor: {
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
    repoRoot: PROJECT_ROOT,
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
  const executorScript = writeFakeExecutor(tempDir, { status: 'done', verdict: 'READY', summary: 'Feasible' });

  const runnerConfig = {
    executor: {
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
    repoRoot: PROJECT_ROOT,
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
  const work = { id: 'tsk-not-ready', stage: 'planning', domain: 'coding' };
  const lastRunResult = {
    status: 'done',
    confidence: 'reported',
    agentClaim: { status: 'done', verdict: 'NOT READY - RETURN TO PLANNING', summary: 'Gaps found' },
  };

  const choice = chooseStageOperation({
    work,
    lastRunResult,
    contextSignals: { hasPlan: true },
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
  const lastRunResult = {
    status: 'done',
    confidence: 'reported',
    agentClaim: {
      status: 'done',
      verdict: 'READY WITH CONSTRAINTS',
      summary: 'Proceed only after constraints are captured',
    },
  };

  const blocked = interpretAssignmentRunResult({
    choice: { operation: 'validate-plan' },
    runResult: lastRunResult,
  });
  assert.equal(blocked.canAdvanceEdge, false);
  assert.equal(blocked.stop, true);

  const accepted = interpretAssignmentRunResult({
    choice: { operation: 'validate-plan' },
    runResult: lastRunResult,
    contextSignals: { constraintsWritten: true },
  });
  assert.equal(accepted.canAdvanceEdge, true);
  assert.equal(accepted.stop, false);
});

test('Step 06 planning.validate-plan bare done claim without verdict cannot advance Work', () => {
  const choice = chooseStageOperation({
    work: { id: 'tsk-weak-result', stage: 'planning', domain: 'coding' },
    contextSignals: { hasPlan: true },
    lastRunResult: {
      status: 'done',
      confidence: 'reported',
      agentClaim: { status: 'done', summary: 'Looks acceptable' },
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
  seedTaskSpecs(tempDir, ['review-item']);
  const executorScript = writeFakeExecutor(tempDir, {
    status: 'done',
    verdict: 'REJECT',
    summary: 'REJECT: verify failure needs a fix',
  });
  const work = { id: 'tsk-step06-review', status: 'doing', stage: 'executing', domain: 'coding' };
  const choice = chooseStageOperation({
    work,
    contextSignals: { secondaryOperation: 'review-item' },
  });

  const outcome = await executeDriverOperationChoice(work, choice, {
    cwd: tempDir,
    repoRoot: tempDir,
    runnerConfig: runnerConfigFor(executorScript),
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
  const interpreted = interpretAssignmentRunResult({
    choice: { operation: 'review-item' },
    runResult: {
      status: 'done',
      confidence: 'reported',
      agentClaim: { status: 'done', verdict: 'APPROVED', summary: 'APPROVED' },
    },
  });

  assert.equal(interpreted.canProceed, true);
  assert.equal(interpreted.canAdvanceEdge, false);
  assert.equal(interpreted.stop, false);
  assert.equal(interpreted.reason, 'review-item-approved');
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

test('driver loop runOnce: validate-plan with READY + agentClaim.verdict "decompose" materializes child items (Finding 1)', async () => {
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
  assert.equal(rootItem.stage, 'executing');

  const childItems = Object.values(view.work).filter((w) => w.id.startsWith('tsk-driver-decomp-'));
  assert.equal(childItems.length, 2);
  assert.equal(childItems[0].title, 'Subtask A');
  assert.equal(childItems[1].title, 'Subtask B');
});

test('driver loop runOnce: validate-plan with READY + agentClaim.verdict "need-human" parks in awaiting-human (Finding 1)', async () => {
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
  assert.equal(item.status, 'awaiting-human');
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

test('driver loop runOnce: validate-plan with READY WITH CONSTRAINTS and VERIFIED recorded plan.md constraints ADVANCES to executing (Finding P2 fix)', async () => {
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
  assert.equal(item.stage, 'executing');
});

test('interpretAssignmentRunResult maps REJECTED verdict to NOT READY - RETURN TO PLANNING (Finding 3)', () => {
  const res = interpretAssignmentRunResult({
    choice: { operation: 'validate-plan' },
    runResult: {
      status: 'done',
      confidence: 'reported',
      agentClaim: { status: 'done', verdict: 'REJECTED', summary: 'Plan rejected' },
    },
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

test('Step 06 governance-blocked or failed executor returns a stop without advancing Work', async () => {
  const tempDir = mkTempDir();
  seedTaskSpecs(tempDir, ['review-item']);
  const executorScript = writeFailingExecutor(tempDir);
  const work = { id: 'tsk-step06-fail', status: 'doing', stage: 'executing', domain: 'coding' };
  const choice = chooseStageOperation({
    work,
    contextSignals: { secondaryOperation: 'review-item' },
  });

  const outcome = await executeDriverOperationChoice(work, choice, {
    cwd: tempDir,
    repoRoot: tempDir,
    runnerConfig: runnerConfigFor(executorScript),
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
  const resWithHerdr = interpretAssignmentRunResult({
    choice: { operation: 'validate-plan' },
    runResult: {
      status: 'done',
      confidence: 'reported',
      agentClaim: {
        status: 'done',
        verdict: 'READY',
        summary: 'Plan validated',
        herdrStatus: 'active',
        herdrPane: 'pane-42',
        visibility: 'internal',
      },
    },
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
    agentClaim: {
      status: 'done',
      verdict: 'READY WITH CONSTRAINTS',
      summary: 'Plan ready with constraints',
    },
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


