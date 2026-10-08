// test/workflow/workflow-runner.test.mjs — Integration tests for Workflow runner & sequencer (P3a)

import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';

import {
  validateWorkflow,
  createWorkflowRun,
  appendWorkflowEvent,
  readWorkflowEvents,
  projectWorkflowState,
  createWorkflowWorktree,
  mergeWorkflowBranch,
  resolveIntegrationTarget,
  cleanupWorkflowWorktree,
  translatePlanToWorkflow,
  startWorkflow,
  statusWorkflow,
  answerWorkflow,
  resumeWorkflow,
  answerWorkflowDetached,
  resumeWorkflowDetached,
} from '../../src/workflow/index.mjs';
import { seedFileLocalBwrapRegistry } from '../runner/confinement-registry-fixture.helper.mjs';
import { normalizeContextRefs } from '../../src/workflow/definition.mjs';
import { withProviderFamilies } from '../helpers/provider-families.mjs';

// Worktrees created in the default location outlive the test unless removed here.
const worktreeDirs = [];
after(() => {
  for (const dir of worktreeDirs) fs.rmSync(dir, { recursive: true, force: true });
});

seedFileLocalBwrapRegistry();
// bwrap mounts a tmpfs over /tmp, so confined workers can only see fixtures elsewhere.
import { makeFixtureDir } from '../helpers/fixture-dir.mjs';

const BIN_FGOS = path.resolve('bin/fgos.mjs');

function setupTestRepo() {
  const tmp = makeFixtureDir('fgos-wf-test-');
  execFileSync('git', ['init', '-b', 'main'], { cwd: tmp, stdio: 'ignore' });
  execFileSync('git', ['config', 'user.name', 'Workflow Test'], { cwd: tmp, stdio: 'ignore' });
  execFileSync('git', ['config', 'user.email', 'wf@test.local'], { cwd: tmp, stdio: 'ignore' });

  fs.writeFileSync(path.join(tmp, 'README.md'), '# Workflow Test\n');
  execFileSync('git', ['add', 'README.md'], { cwd: tmp, stdio: 'ignore' });
  execFileSync('git', ['commit', '-m', 'initial commit'], { cwd: tmp, stdio: 'ignore' });

  // Create fake echo script
  const echoScript = path.join(tmp, 'echo-worker.mjs');
  fs.writeFileSync(
    echoScript,
    `
    import fs from 'node:fs';
    import path from 'node:path';
    const prompt = process.argv.slice(2).join(' ');
    const match = /Write structured JSON to (\\S+agent-result\\.json)/.exec(prompt);
    let runDir;
    if (match) {
      runDir = (() => { const d = path.dirname(match[1]); const o = path.join(d, 'worker-output', 'outbox'); return fs.existsSync(o) ? o : d; })();
      fs.mkdirSync(runDir, { recursive: true });
      fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Report\\nAssignment execution completed successfully with full report content.\\n');
      fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'Done' }));
    }
    `,
  );

  const fgosDir = path.join(tmp, '.fgos');
  fs.mkdirSync(fgosDir, { recursive: true });

  const cfg = {
    runner: {
      defaultExecutor: 'test-node',
      rigorToTier: { low: 'nano', standard: 'standard', high: 'flagship', critical: 'frontier' },
      modelPolicies: { node: { standard: 'node-std' } },
      executors: {
        'test-node': {
          kind: 'agent',
          description: 'Test node executor',
          allowCrossProvider: true,
          command: process.execPath,
          args: [echoScript, '{prompt}'],
          providerModel: 'node',
          invocations: [{ id: 'cli-default', via: 'cli', adapter: 'cli-spawn', confinement: { backend: 'bwrap' }, command: process.execPath, args: [echoScript, '{prompt}'] }],
        },
      },
      capabilities: {
        'docs:write': { prefer: [{ executor: 'test-node' }], rigor: 'standard' },
        'code:implement': { prefer: [{ executor: 'test-node' }], rigor: 'standard' },
      },
      patterns: {
        defaultRule: { mutatingMinRigor: 'standard' },
        reviewed: { maxRounds: 2, checkersByRigor: { standard: ['reviewer'] } },
      },
    },
  };
  fs.writeFileSync(path.join(fgosDir, 'config.json'), JSON.stringify(cfg, null, 2));

  return tmp;
}

test('validateWorkflow enforces schema and rejects G2 infrastructure fields', () => {
  const valid = {
    id: 'test/simple',
    title: 'Simple workflow',
    steps: [
      {
        id: 'step-1',
        units: [{ template: { capability: 'docs:write' } }],
      },
    ],
  };
  const normalized = validateWorkflow(valid);
  assert.equal(normalized.id, 'test/simple');
  assert.equal(normalized.steps.length, 1);

  // G2: reject executor
  assert.throws(
    () => validateWorkflow({ ...valid, executor: 'claude' }),
    /G2 constraint/,
  );

  // G2: reject model in step
  assert.throws(
    () => validateWorkflow({ ...valid, steps: [{ id: 's1', model: 'gpt-4' }] }),
    /G2 constraint/,
  );
});

test('workflow store: append and project state accurately', () => {
  const tmp = setupTestRepo();
  const workflow = {
    id: 'test/store-wf',
    steps: [
      { id: 's1', dependsOn: [] },
      { id: 's2', dependsOn: ['s1'], gate: { kind: 'human', question: 'Continue?' } },
    ],
  };

  const { workflowRunId } = createWorkflowRun({
    repoRoot: tmp,
    workflowId: 'test/store-wf',
    workflow,
  });

  let events = readWorkflowEvents({ repoRoot: tmp, workflowRunId });
  assert.equal(events.length, 1);
  let state = projectWorkflowState(events);
  assert.equal(state.status, 'running');
  assert.equal(state.steps.s1.status, 'pending');

  // Step 1 starts and completes
  appendWorkflowEvent({ repoRoot: tmp, workflowRunId, event: { type: 'step.start', payload: { stepId: 's1' } } });
  appendWorkflowEvent({ repoRoot: tmp, workflowRunId, event: { type: 'step.complete', payload: { stepId: 's1', outcome: 'pass' } } });

  // Gate parks step 2
  appendWorkflowEvent({
    repoRoot: tmp,
    workflowRunId,
    event: { type: 'gate.park', payload: { stepId: 's2', question: 'Continue?' } },
  });

  state = projectWorkflowState(readWorkflowEvents({ repoRoot: tmp, workflowRunId }));
  assert.equal(state.status, 'parked');
  assert.equal(state.questions.length, 1);
  assert.equal(state.questions[0].question, 'Continue?');

  // Answer gate with approval
  appendWorkflowEvent({
    repoRoot: tmp,
    workflowRunId,
    event: { type: 'gate.answer', payload: { stepId: 's2', answer: 'yes', approved: true } },
  });

  state = projectWorkflowState(readWorkflowEvents({ repoRoot: tmp, workflowRunId }));
  assert.equal(state.status, 'running');
  assert.equal(state.questions.length, 0);
  assert.equal(state.steps.s2.answer, 'yes');
});

test('integrate helpers: create worktree, merge branch, and cleanup', () => {
  const tmp = setupTestRepo();
  const branchName = 'test-feat-branch';

  // 1. Create worktree
  const { worktreePath, branch } = createWorkflowWorktree({
    repoRoot: tmp,
    branch: branchName,
  });
  worktreeDirs.push(worktreePath);
  assert.ok(fs.existsSync(worktreePath));
  assert.equal(branch, branchName);

  // Make a commit in worktree
  fs.writeFileSync(path.join(worktreePath, 'feature.txt'), 'new feature\n');
  execFileSync('git', ['add', 'feature.txt'], { cwd: worktreePath, stdio: 'ignore' });
  execFileSync('git', ['commit', '-m', 'add feature'], { cwd: worktreePath, stdio: 'ignore' });

  // 2. Merge branch into main
  const mergeRes = mergeWorkflowBranch({
    repoRoot: tmp,
    sourceBranch: branchName,
    targetBranch: 'main',
    commitMessage: 'integrate: merge test feature',
  });
  assert.equal(mergeRes.merged, true);

  // Verify file in main
  assert.ok(fs.existsSync(path.join(tmp, 'feature.txt')));

  // 3. Cleanup worktree and branch
  cleanupWorkflowWorktree({
    repoRoot: tmp,
    worktreePath,
    branch: branchName,
    deleteBranch: true,
  });
  assert.equal(fs.existsSync(worktreePath), false);
});

test('translatePlanToWorkflow translates multi-phase plan into DAG Workflow', () => {
  const tmp = makeFixtureDir('plan-trans-');
  fs.writeFileSync(
    path.join(tmp, 'plan.md'),
    `---
title: "My Feature Plan"
---
# Overview
`,
  );
  fs.writeFileSync(
    path.join(tmp, 'phase-01-core.md'),
    `---
phase: 1
title: "Core"
dependencies: []
---
`,
  );
  fs.writeFileSync(
    path.join(tmp, 'phase-02-api.md'),
    `---
phase: 2
title: "API"
dependencies: [1]
requiresReview: true
---
`,
  );

  const wf = translatePlanToWorkflow(tmp);
  assert.equal(wf.id.startsWith('plan/'), true);
  assert.equal(wf.steps.length, 2);
  assert.equal(wf.steps[0].id, 'phase-01');
  assert.equal(wf.steps[1].id, 'phase-02');
  assert.deepEqual(wf.steps[1].dependsOn, ['phase-01']);
  assert.ok(wf.steps[1].gate);
  assert.equal(wf.steps[1].gate.kind, 'human');
});

test('runner: executes workflow with parallel steps and parks at human gate', async () => {
  const tmp = setupTestRepo();

  const workflow = {
    id: 'test/dag-runner',
    steps: [
      {
        id: 'step-a',
        dependsOn: [],
        units: [{ id: 'u-a', template: { capability: 'docs:write' } }],
      },
      {
        id: 'step-b',
        dependsOn: [],
        units: [{ id: 'u-b', template: { capability: 'docs:write' } }],
      },
      {
        id: 'step-gate',
        dependsOn: ['step-a', 'step-b'],
        gate: { kind: 'human', question: 'Ready to proceed?' },
      },
      {
        id: 'step-c',
        dependsOn: ['step-gate'],
        units: [{ id: 'u-c', template: { capability: 'docs:write' } }],
      },
    ],
  };

  // Start workflow
  let state = await startWorkflow({
    workflow,
    repoRoot: tmp,
    cwd: tmp,
  });

  // Step A and B should complete, and runner should park at step-gate!
  assert.equal(state.status, 'parked');
  assert.equal(state.questions.length, 1);
  assert.equal(state.questions[0].stepId, 'step-gate');
  assert.equal(state.steps['step-a'].status, 'completed');
  assert.equal(state.steps['step-b'].status, 'completed');

  // Answer human gate with approval
  state = await answerWorkflow(state.workflowRunId, {
    stepId: 'step-gate',
    answer: 'approved',
    approved: true,
    repoRoot: tmp,
    cwd: tmp,
  });

  // Now step-gate was answered and step-c should execute to complete the workflow!
  assert.equal(state.status, 'completed');
  assert.equal(state.outcome, 'pass');
  assert.equal(state.steps['step-c'].status, 'completed');
});

test('a human gate answer reaches the units of the gated step and of every step that depends on it, as a context ref', async () => {
  const tmp = setupTestRepo();
  const unit = (id, objective) => ({ id, template: { capability: 'docs:write', pattern: 'solo', objective, writes: [] } });
  const workflow = validateWorkflow({
    id: 'gate-answer-flows-through',
    steps: [
      { id: 'prep', units: [unit('u-prep', 'Prepare the options')] },
      { id: 'vote', dependsOn: ['prep'], gate: { kind: 'human', question: 'Which option do you pick?' }, units: [unit('u-vote', 'Tally the votes')] },
      { id: 'side', dependsOn: ['prep'], units: [unit('u-side', 'Work that never depends on the vote')] },
      { id: 'final', dependsOn: ['vote'], units: [unit('u-final', 'Rank the options')] },
      { id: 'after', dependsOn: ['final'], units: [unit('u-after', 'Write the outcome')] },
    ],
  });
  let state = await startWorkflow({ workflow, repoRoot: tmp, cwd: tmp, worktree: tmp });
  assert.equal(state.status, 'parked', JSON.stringify(state.steps));
  assert.equal(state.steps.side.status, 'completed');

  const answer = `Option B first. ${'because of cost '.repeat(20)}END-OF-ANSWER`;
  state = await answerWorkflow(state.workflowRunId, { stepId: 'vote', answer, approved: true, repoRoot: tmp, cwd: tmp, worktree: tmp });
  assert.equal(state.status, 'completed', JSON.stringify(state.steps));

  // The answer is written once, with the question and the time of the answer, in the run directory.
  const answerFile = path.join(tmp, '.fgos', 'workflow-runs', state.workflowRunId, 'gate-answers', 'vote.md');
  const text = fs.readFileSync(answerFile, 'utf8');
  assert.ok(text.includes('Which option do you pick?'));
  assert.ok(text.includes(answer));
  assert.match(text, /\b20\d\d-\d\d-\d\dT/);

  const assignmentOf = (stepId, unitId) =>
    JSON.parse(fs.readFileSync(path.join(tmp, '.fgos', 'assignments', state.steps[stepId].units[unitId].unitRunId, 'producer', '1', 'assignment.json'), 'utf8'));
  const note = `owner's answer at the "vote" gate`;
  for (const [stepId, unitId] of [['vote', 'u-vote'], ['final', 'u-final'], ['after', 'u-after']]) {
    const assignment = assignmentOf(stepId, unitId);
    assert.ok(assignment.contextRefs.includes(answerFile), `${stepId}: ${JSON.stringify(assignment.contextRefs)}`);
    assert.ok(assignment.objective.toLowerCase().includes(note), `${stepId}: ${assignment.objective}`);
    // One line, the first 200 characters of the answer; the rest is in the file.
    assert.ok(assignment.objective.includes(answer.slice(0, 200).trimEnd()), assignment.objective);
    assert.ok(!assignment.objective.includes('END-OF-ANSWER'));
  }

  // Steps that do not depend on the gate, and steps that ran before it, get nothing of it.
  for (const [stepId, unitId] of [['prep', 'u-prep'], ['side', 'u-side']]) {
    const assignment = assignmentOf(stepId, unitId);
    assert.ok(!assignment.contextRefs.includes(answerFile), stepId);
    assert.ok(!assignment.objective.includes('Option B first'), stepId);
  }
});

test('a gate answer that cannot be written is refused before the answer is recorded', async () => {
  const tmp = setupTestRepo();
  const workflow = validateWorkflow({
    id: 'gate-answer-unsafe-step',
    steps: [{ id: 'vote', gate: { kind: 'human', question: 'Pick?' }, units: [{ id: 'u', template: { capability: 'docs:write', pattern: 'solo', objective: 'x', writes: [] } }] }],
  });
  const state = await startWorkflow({ workflow, repoRoot: tmp, cwd: tmp, worktree: tmp });
  assert.equal(state.status, 'parked');
  await assert.rejects(
    () => answerWorkflow(state.workflowRunId, { stepId: '../vote', answer: 'yes', repoRoot: tmp, cwd: tmp, worktree: tmp }),
    /gate answer/i,
  );
  assert.equal(statusWorkflow(state.workflowRunId, { repoRoot: tmp, cwd: tmp }).status, 'parked');
});

test('CLI: fgos workflow start, status, answer, and legacy operations', () => {
  const tmp = setupTestRepo();
  const planDir = path.join(tmp, 'my-plan');
  fs.mkdirSync(planDir);
  fs.writeFileSync(path.join(planDir, 'plan.md'), '---\ntitle: "CLI Plan"\n---\n');
  fs.writeFileSync(path.join(planDir, 'phase-01-start.md'), '---\nphase: 1\ntitle: "Start Phase"\ndependencies: []\n---\n');

  // 1. fgos workflow start --plan
  const startOut = execFileSync(
    process.execPath,
    [BIN_FGOS, 'workflow', 'start', '--plan', planDir, '--dir', tmp, '--foreground'],
    { cwd: tmp, encoding: 'utf8' },
  );
  assert.ok(startOut.includes('wf-run-'));

  const match = /"workflowRunId":\s*"([^"]+)"/.exec(startOut);
  assert.ok(match, 'must print workflowRunId');
  const wfRunId = match[1];

  // 2. fgos workflow status
  const statusOut = execFileSync(
    process.execPath,
    [BIN_FGOS, 'workflow', 'status', wfRunId, '--dir', tmp],
    { cwd: tmp, encoding: 'utf8' },
  );
  assert.ok(statusOut.includes(wfRunId));

  // 3. Legacy operations inspection remains working
  const opsOut = execFileSync(
    process.execPath,
    [BIN_FGOS, 'workflow', 'operations', '--step', 'planning', '--dir', tmp],
    { cwd: tmp, encoding: 'utf8' },
  );
  assert.ok(opsOut.includes('validate-plan') || opsOut.includes('operations'));
});

test('CLI: fgos workflow start returns the run id at once and a detached process finishes the run', async () => {
  const tmp = setupTestRepo();
  const planDir = path.join(tmp, 'detached-plan');
  fs.mkdirSync(planDir);
  fs.writeFileSync(path.join(planDir, 'plan.md'), '---\ntitle: "Detached Plan"\n---\n');
  fs.writeFileSync(path.join(planDir, 'phase-01-start.md'), '---\nphase: 1\ntitle: "Start Phase"\ndependencies: []\n---\n');

  const startOut = execFileSync(
    process.execPath,
    [BIN_FGOS, 'workflow', 'start', '--plan', planDir, '--dir', tmp],
    { cwd: tmp, encoding: 'utf8' },
  );
  const wfRunId = /"workflowRunId":\s*"([^"]+)"/.exec(startOut)?.[1];
  assert.ok(wfRunId, 'start must print the workflowRunId');
  assert.ok(startOut.includes(`fgos workflow status ${wfRunId}`), 'start must say where to read progress');
  const logPath = path.join(tmp, '.fgos', 'workflow-runs', wfRunId, 'advance.log');
  assert.ok(fs.existsSync(logPath), 'the detached process log must exist from the start');

  // The detached process advances the run; it is read back through the status verb.
  let status = null;
  for (let i = 0; i < 100 && status !== 'completed'; i += 1) {
    status = statusWorkflow(wfRunId, { repoRoot: tmp, cwd: tmp }).status;
    if (status !== 'completed') await new Promise((r) => setTimeout(r, 200));
  }
  assert.equal(status, 'completed', 'the detached process must finish the run');
});

// A gate-only workflow needs no worker: it parks at the gate and, once answered, completes.
const GATE_WORKFLOW = {
  id: 'test/gate-only',
  steps: [
    { id: 'step-gate', dependsOn: [], gate: { kind: 'human', question: 'Ready to proceed?' } },
    { id: 'step-after', dependsOn: ['step-gate'] },
  ],
};

// The CLI wraps its result in a contract envelope; the run state is under `data`.
function parseCliData(stdout) {
  return JSON.parse(stdout).data;
}

async function waitForStatus(wfRunId, repoRoot, wanted) {
  let status = null;
  for (let i = 0; i < 100 && status !== wanted; i += 1) {
    status = statusWorkflow(wfRunId, { repoRoot, cwd: repoRoot }).status;
    if (status !== wanted) await new Promise((r) => setTimeout(r, 200));
  }
  return status;
}

test('CLI: fgos workflow answer records the answer, returns at once and a detached process finishes the run', async () => {
  const tmp = setupTestRepo();
  const parked = await startWorkflow({ workflow: validateWorkflow(GATE_WORKFLOW), repoRoot: tmp, cwd: tmp });
  assert.equal(parked.status, 'parked');

  const out = parseCliData(
    execFileSync(
      process.execPath,
      [BIN_FGOS, 'workflow', 'answer', parked.workflowRunId, '--step', 'step-gate', '--answer', 'yes', '--approve', '--dir', tmp],
      { cwd: tmp, encoding: 'utf8' },
    ),
  );
  assert.equal(out.workflowRunId, parked.workflowRunId);
  assert.equal(out.detached.statusCommand, `fgos workflow status ${parked.workflowRunId}`);
  const types = readWorkflowEvents({ repoRoot: tmp, workflowRunId: parked.workflowRunId }).map((e) => e.type);
  assert.ok(types.includes('gate.answer'), 'the answer is recorded before the command returns');
  assert.equal(await waitForStatus(parked.workflowRunId, tmp, 'completed'), 'completed');
});

test('CLI: fgos workflow resume returns at once and a detached process advances the run once', async () => {
  const tmp = setupTestRepo();
  const workflow = validateWorkflow({ id: 'test/no-gate', steps: [{ id: 'only', dependsOn: [] }] });
  const { workflowRunId } = createWorkflowRun({ repoRoot: tmp, workflowId: workflow.id, workflow });

  const out = parseCliData(
    execFileSync(process.execPath, [BIN_FGOS, 'workflow', 'resume', workflowRunId, '--dir', tmp], {
      cwd: tmp,
      encoding: 'utf8',
    }),
  );
  assert.equal(out.detached.statusCommand, `fgos workflow status ${workflowRunId}`);
  assert.ok(out.detached.pid > 0);
  assert.equal(await waitForStatus(workflowRunId, tmp, 'completed'), 'completed');
  const completions = readWorkflowEvents({ repoRoot: tmp, workflowRunId }).filter((e) => e.type === 'workflow.complete');
  assert.equal(completions.length, 1, 'the detached child advances in the foreground and does not spawn another advance');
});

test('a run already being advanced by a live process refuses a second advance and records nothing', async () => {
  const tmp = setupTestRepo();
  const parked = await startWorkflow({ workflow: validateWorkflow(GATE_WORKFLOW), repoRoot: tmp, cwd: tmp });
  const id = parked.workflowRunId;
  const lockPath = path.join(tmp, '.fgos', 'workflow-runs', id, 'advance.lock');
  assert.equal(fs.existsSync(lockPath), false, 'the lock is released when an advance ends');

  // This test process stands in for the live advancing process.
  fs.writeFileSync(lockPath, String(process.pid));
  const eventCount = () => readWorkflowEvents({ repoRoot: tmp, workflowRunId: id }).length;
  const before = eventCount();
  const opts = { repoRoot: tmp, cwd: tmp };
  const answer = { stepId: 'step-gate', answer: 'yes', approved: true, ...opts };

  assert.throws(() => resumeWorkflowDetached(id, opts), /already being advanced/);
  assert.throws(() => answerWorkflowDetached(id, answer), /already being advanced/);
  await assert.rejects(resumeWorkflow(id, opts), /already being advanced/);
  await assert.rejects(answerWorkflow(id, answer), /already being advanced/);
  assert.equal(eventCount(), before, 'a refused advance must not record the gate answer');
  assert.equal(fs.readFileSync(lockPath, 'utf8'), String(process.pid), 'a refused advance leaves the holder lock alone');

  // A lock left by a process that is gone is taken over.
  const dead = execFileSync(process.execPath, ['-e', 'process.stdout.write(String(process.pid))'], { encoding: 'utf8' });
  fs.writeFileSync(lockPath, dead);
  const state = await answerWorkflow(id, answer);
  assert.equal(state.status, 'completed');
  assert.equal(fs.existsSync(lockPath), false);
});

function writeRunLog(tmp, id, text) {
  fs.writeFileSync(path.join(tmp, '.fgos', 'workflow-runs', id, 'advance.log'), text);
}

// Rewrites every event timestamp so a run looks as if nothing was recorded for `ageMs`.
function ageRunEvents(tmp, id, ageMs) {
  const file = path.join(tmp, '.fgos', 'workflow-runs', id, 'events.jsonl');
  const ts = new Date(Date.now() - ageMs).toISOString();
  const lines = fs.readFileSync(file, 'utf8').trim().split('\n').map((l) => JSON.stringify({ ...JSON.parse(l), ts }));
  fs.writeFileSync(file, lines.join('\n') + '\n');
}

test('status reports a live advance holder and the tail of the advance log', async () => {
  const tmp = setupTestRepo();
  const parked = await startWorkflow({ workflow: validateWorkflow(GATE_WORKFLOW), repoRoot: tmp, cwd: tmp });
  const id = parked.workflowRunId;
  const opts = { repoRoot: tmp, cwd: tmp };
  const runDir = path.join(tmp, '.fgos', 'workflow-runs', id);

  const idle = statusWorkflow(id, opts).advance;
  assert.equal(idle.running, false);
  assert.equal(idle.pid, null);
  assert.equal(idle.logPath, path.join(runDir, 'advance.log'));
  assert.equal(idle.lastLines, undefined, 'an empty or absent log has nothing to tail');
  assert.equal(idle.hint, undefined, 'a parked run is waiting for an answer, not for a restart');

  // This test process stands in for the live advancing process.
  fs.writeFileSync(path.join(runDir, 'advance.lock'), String(process.pid));
  const lines = Array.from({ length: 30 }, (_, i) => `line-${i + 1} ${'x'.repeat(i === 29 ? 500 : 0)}`);
  writeRunLog(tmp, id, lines.join('\n') + '\n');

  const live = statusWorkflow(id, opts).advance;
  assert.equal(live.running, true);
  assert.equal(live.pid, process.pid);
  assert.equal(live.lastLines.length, 20, 'the tail is the last 20 lines');
  assert.ok(live.lastLines[0].startsWith('line-11'));
  assert.equal(live.lastLines[19].length, 300, 'each line is capped at 300 characters');
  assert.equal(live.hint, undefined);
});

test('status says a running run has no live advance and names resume once the last event is old', async () => {
  const tmp = setupTestRepo();
  const workflow = validateWorkflow({ id: 'test/no-gate', steps: [{ id: 'only', dependsOn: [] }] });
  const { workflowRunId: id } = createWorkflowRun({ repoRoot: tmp, workflowId: workflow.id, workflow });
  const opts = { repoRoot: tmp, cwd: tmp };
  const lockPath = path.join(tmp, '.fgos', 'workflow-runs', id, 'advance.lock');

  const fresh = statusWorkflow(id, opts);
  assert.equal(fresh.status, 'running');
  assert.equal(fresh.advance.running, false);
  assert.equal(fresh.advance.hint, undefined, 'a just-recorded run may still be starting its advance');

  ageRunEvents(tmp, id, 10 * 60 * 1000);
  writeRunLog(tmp, id, 'Error: spawn failed\n');
  const dead = execFileSync(process.execPath, ['-e', 'process.stdout.write(String(process.pid))'], { encoding: 'utf8' });
  fs.writeFileSync(lockPath, dead);

  const stale = statusWorkflow(id, opts).advance;
  assert.equal(stale.running, false, 'a lock left by a dead process is not a live advance');
  assert.equal(stale.pid, null);
  assert.match(stale.hint, /not running/);
  assert.ok(stale.hint.includes(`fgos workflow resume ${id}`));
  assert.deepEqual(stale.lastLines, ['Error: spawn failed'], 'whatever the dead child printed stays readable');

  // A live holder means the run is being advanced, however old the last event.
  fs.writeFileSync(lockPath, String(process.pid));
  const held = statusWorkflow(id, opts).advance;
  assert.equal(held.running, true);
  assert.equal(held.hint, undefined);
});

test('status shows no log tail for a completed run', async () => {
  const tmp = setupTestRepo();
  const state = await startWorkflow({
    workflow: validateWorkflow({ id: 'test/no-gate', steps: [{ id: 'only', dependsOn: [] }] }),
    repoRoot: tmp,
    cwd: tmp,
  });
  assert.equal(state.status, 'completed');
  writeRunLog(tmp, state.workflowRunId, 'step only completed\n');
  const advance = statusWorkflow(state.workflowRunId, { repoRoot: tmp, cwd: tmp }).advance;
  assert.equal(advance.lastLines, undefined);
  assert.equal(advance.hint, undefined);
});

test('CLI: the detached child logs a line per step start and end, and workflow status prints the advance block', async () => {
  const tmp = setupTestRepo();
  const planDir = path.join(tmp, 'progress-plan');
  fs.mkdirSync(planDir);
  fs.writeFileSync(path.join(planDir, 'plan.md'), '---\ntitle: "Progress Plan"\n---\n');
  fs.writeFileSync(path.join(planDir, 'phase-01-start.md'), '---\nphase: 1\ntitle: "Start Phase"\ndependencies: []\n---\n');

  const wfRunId = parseCliData(
    execFileSync(process.execPath, [BIN_FGOS, 'workflow', 'start', '--plan', planDir, '--dir', tmp], { cwd: tmp, encoding: 'utf8' }),
  ).workflowRunId;
  assert.equal(await waitForStatus(wfRunId, tmp, 'completed'), 'completed');
  const stepId = Object.keys(statusWorkflow(wfRunId, { repoRoot: tmp, cwd: tmp }).steps)[0];

  const log = fs.readFileSync(path.join(tmp, '.fgos', 'workflow-runs', wfRunId, 'advance.log'), 'utf8');
  const stepLines = log.split('\n').filter((l) => l.includes(`step ${stepId}`));
  assert.equal(stepLines.length, 2, `one line when the step starts and one when it ends, got: ${log}`);
  assert.match(stepLines[0], /started/);
  assert.match(stepLines[1], /completed/);

  const status = parseCliData(
    execFileSync(process.execPath, [BIN_FGOS, 'workflow', 'status', wfRunId, '--dir', tmp], { cwd: tmp, encoding: 'utf8' }),
  );
  assert.equal(status.advance.running, false);
  assert.ok(status.advance.logPath.endsWith('advance.log'));
});

test('a foreground advance writes no log file; an explicit onLog receives the progress lines', async () => {
  const tmp = setupTestRepo();
  const lines = [];
  const state = await startWorkflow({
    workflow: validateWorkflow({ id: 'test/no-gate', steps: [{ id: 'only', dependsOn: [] }] }),
    repoRoot: tmp,
    cwd: tmp,
    onLog: (line) => lines.push(line),
  });
  assert.equal(state.status, 'completed');
  assert.equal(lines.length, 2, 'one line when the step starts and one when it ends');
  assert.equal(fs.existsSync(path.join(tmp, '.fgos', 'workflow-runs', state.workflowRunId, 'advance.log')), false);
});

test('a unit refused by policy fails its step and the workflow; dependent steps never run', async () => {
  const tmp = setupTestRepo();
  const workflow = validateWorkflow({
    id: 'refusal-stops-run',
    steps: [
      {
        id: 'first',
        units: [{ id: 'u1', template: { capability: 'unconfigured:capability', pattern: 'solo', objective: 'no executor serves this' } }],
      },
      {
        id: 'second',
        dependsOn: ['first'],
        units: [{ id: 'u2', template: { capability: 'docs:write', pattern: 'solo', objective: 'must never start' } }],
      },
    ],
  });

  const state = await startWorkflow({ workflow, repoRoot: tmp, cwd: tmp, worktree: tmp });

  assert.equal(state.status, 'failed');
  assert.equal(state.outcome, 'policy-refusal');
  assert.equal(state.steps.first.status, 'failed');
  assert.match(state.steps.first.reason, /unconfigured:capability/);
  assert.equal(state.steps.second.status, 'pending');
  assert.deepEqual(state.steps.second.units, {});

  // Resuming a failed run must not start the dependent step either.
  const resumed = await resumeWorkflow(state.workflowRunId, { repoRoot: tmp, cwd: tmp, worktree: tmp });
  assert.equal(resumed.status, 'failed');
  assert.equal(resumed.steps.second.status, 'pending');
  const types = readWorkflowEvents({ repoRoot: tmp, workflowRunId: state.workflowRunId }).map((e) => e.type);
  assert.ok(!types.includes('step.complete'));
  assert.deepEqual(types.filter((t) => t === 'step.fail' || t === 'workflow.fail'), ['step.fail', 'workflow.fail']);
});

test('a unit that throws instead of returning fails its step and the workflow with the reason recorded', async () => {
  const tmp = setupTestRepo();
  const workflow = validateWorkflow({
    id: 'throw-stops-run',
    steps: [
      {
        id: 'first',
        units: [{ id: 'u1', template: { capability: 'docs:write', pattern: 'no-such-pattern', objective: 'cannot be dispatched' } }],
      },
      {
        id: 'second',
        dependsOn: ['first'],
        units: [{ id: 'u2', template: { capability: 'docs:write', pattern: 'solo', objective: 'must never start' } }],
      },
    ],
  });

  const state = await startWorkflow({ workflow, repoRoot: tmp, cwd: tmp, worktree: tmp });

  assert.equal(state.status, 'failed');
  assert.equal(state.outcome, 'execution-failure');
  assert.equal(state.steps.first.status, 'failed');
  assert.match(state.steps.first.reason, /unit u1 could not run: .*no-such-pattern/);
  assert.equal(state.steps.first.units.u1.status, 'completed');
  assert.equal(state.steps.first.units.u1.outcome, 'execution-failure');
  assert.equal(state.steps.second.status, 'pending');
  const types = readWorkflowEvents({ repoRoot: tmp, workflowRunId: state.workflowRunId }).map((e) => e.type);
  assert.deepEqual(types.filter((t) => t === 'step.fail' || t === 'workflow.fail'), ['step.fail', 'workflow.fail']);
});

test('the owner request and earlier step output reach each unit objective', async () => {
  const tmp = setupTestRepo();
  // Worker that records the prompt it was given into its outbox, the one place a confined
  // worker may write; the test reads those files back from the run store.
  const spy = path.join(tmp, 'spy-worker.mjs');
  fs.writeFileSync(
    spy,
    `
    import fs from 'node:fs';
    import path from 'node:path';
    const prompt = process.argv.slice(2).join(' ');
    const match = /Write structured JSON to (\\S+agent-result\\.json)/.exec(prompt);
    if (match) {
      const runDir = (() => { const d = path.dirname(match[1]); const o = path.join(d, 'worker-output', 'outbox'); return fs.existsSync(o) ? o : d; })();
      fs.mkdirSync(runDir, { recursive: true });
      fs.writeFileSync(path.join(runDir, 'prompt.txt'), prompt);
      fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Report\\nFINDING-FROM-FIRST-STEP is the finding the second step must see in full detail.\\n');
      fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'first step summary' }));
    }
    `,
  );
  const cfgPath = path.join(tmp, '.fgos', 'config.json');
  const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
  cfg.runner.executors['test-node'].args = [spy, '{prompt}'];
  cfg.runner.executors['test-node'].invocations[0].args = [spy, '{prompt}'];
  fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2));

  const workflow = validateWorkflow({
    id: 'request-flows-through',
    steps: [
      { id: 'one', units: [{ id: 'u1', template: { capability: 'docs:write', pattern: 'solo', objective: 'Do the first thing', writes: [] } }] },
      { id: 'two', dependsOn: ['one'], units: [{ id: 'u2', template: { capability: 'docs:write', pattern: 'solo', objective: 'Do the second thing', writes: [] } }] },
    ],
  });
  const state = await startWorkflow({ workflow, repoRoot: tmp, cwd: tmp, worktree: tmp, request: 'Ship the pricing page by Friday' });
  assert.equal(state.request, 'Ship the pricing page by Friday');
  assert.equal(state.status, 'completed', JSON.stringify(state.steps));

  const assignmentsDir = path.join(tmp, '.fgos', 'assignments');
  const promptFiles = [];
  const collect = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) collect(full);
      else if (entry.name === 'prompt.txt') promptFiles.push(full);
    }
  };
  collect(assignmentsDir);
  const prompts = promptFiles
    .sort((a, b) => fs.statSync(a).mtimeMs - fs.statSync(b).mtimeMs)
    .map((f) => fs.readFileSync(f, 'utf8'));
  assert.equal(prompts.length, 2);
  assert.match(prompts[0], /Do the first thing/);
  assert.match(prompts[0], /Ship the pricing page by Friday/);
  assert.doesNotMatch(prompts[0], /FINDING-FROM-FIRST-STEP/);
  assert.match(prompts[1], /Ship the pricing page by Friday/);
  // The earlier report travels as a context ref, not as pasted text.
  assert.match(prompts[1], /first step summary/);
  assert.match(prompts[1], /unit run unit-run-/);
  assert.doesNotMatch(prompts[1], /FINDING-FROM-FIRST-STEP/);
  const firstRunId = state.steps.one.units.u1.unitRunId;
  const refPaths = prompts[1].match(new RegExp(`/\\S+/assignments/${firstRunId}/producer/\\S+report\\S*\\.md`, 'g')) ?? [];
  assert.equal(refPaths.length, 1, `one report path of the first unit run in the second prompt, got ${refPaths}`);
  assert.match(fs.readFileSync(refPaths[0], 'utf8'), /FINDING-FROM-FIRST-STEP/);
});

test('a step after a panel step is handed the report of every panelist and of the synthesizer', async () => {
  const tmp = setupTestRepo();
  const cfgPath = path.join(tmp, '.fgos', 'config.json');
  const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
  const script = path.join(tmp, 'echo-worker.mjs');
  // A panel needs one provider family per member plus one for the synthesizer.
  cfg.runner.executors = {};
  for (const name of ['alpha', 'beta', 'gamma', 'delta']) {
    const command = path.join(tmp, `${name}-bin`);
    fs.symlinkSync(process.execPath, command);
    cfg.runner.executors[name] = {
      kind: 'agent',
      allowCrossProvider: true,
      command,
      args: [script, '{prompt}'],
      providerModel: name,
      invocations: [{ id: 'cli-default', via: 'cli', adapter: 'cli-spawn', confinement: { backend: 'bwrap' }, command, args: [script, '{prompt}'] }],
    };
  }
  cfg.runner.defaultExecutor = 'alpha';
  for (const capability of Object.values(cfg.runner.capabilities)) {
    capability.prefer = ['alpha', 'beta', 'gamma', 'delta'].map((executor) => ({ executor }));
  }
  fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2));

  const workflow = validateWorkflow({
    id: 'panel-then-solo',
    steps: [
      { id: 'panel', units: [{ id: 'p', template: { capability: 'docs:write', pattern: 'panel', objective: 'Review the design', writes: [] } }] },
      { id: 'after', dependsOn: ['panel'], units: [{ id: 's', template: { capability: 'docs:write', pattern: 'solo', objective: 'Decide', writes: [] } }] },
    ],
  });
  const state = await startWorkflow({ workflow, repoRoot: tmp, cwd: tmp, worktree: tmp });
  assert.equal(state.status, 'completed', JSON.stringify(state.steps));

  const panelRunId = state.steps.panel.units.p.unitRunId;
  const soloRunId = state.steps.after.units.s.unitRunId;
  const refs = JSON.parse(
    fs.readFileSync(path.join(tmp, '.fgos', 'assignments', soloRunId, 'producer', '1', 'assignment.json'), 'utf8'),
  ).contextRefs;
  assert.equal(refs.length, 4, `refs: ${JSON.stringify(refs)}`);
  for (const role of ['panelist-1', 'panelist-2', 'panelist-3', 'synthesizer']) {
    const ref = refs.find((r) => r.includes(`/assignments/${panelRunId}/${role}/`));
    assert.ok(ref && path.isAbsolute(ref) && fs.existsSync(ref), `${role} report is listed: ${JSON.stringify(refs)}`);
  }
});

test('anonymizeInputs hands a later unit neutral copies and a brief that names no step, unit, run or role', async () => {
  const tmp = setupTestRepo();
  const cfgPath = path.join(tmp, '.fgos', 'config.json');
  const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
  const script = path.join(tmp, 'echo-worker.mjs');
  cfg.runner.executors = {};
  for (const name of ['alpha', 'beta', 'gamma', 'delta']) {
    const command = path.join(tmp, `${name}-bin`);
    fs.symlinkSync(process.execPath, command);
    cfg.runner.executors[name] = {
      kind: 'agent',
      allowCrossProvider: true,
      command,
      args: [script, '{prompt}'],
      providerModel: name,
      invocations: [{ id: 'cli-default', via: 'cli', adapter: 'cli-spawn', confinement: { backend: 'bwrap' }, command, args: [script, '{prompt}'] }],
    };
  }
  cfg.runner.defaultExecutor = 'alpha';
  for (const capability of Object.values(cfg.runner.capabilities)) {
    capability.prefer = ['alpha', 'beta', 'gamma', 'delta'].map((executor) => ({ executor }));
  }
  fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2));

  const workflow = validateWorkflow({
    id: 'panel-then-anonymous-solo',
    steps: [
      { id: 'independent-opinions', units: [{ id: 'p', template: { capability: 'docs:write', pattern: 'panel', objective: 'Review the design', writes: [] } }] },
      { id: 'cross-examine', dependsOn: ['independent-opinions'], units: [{ id: 'x', template: { capability: 'docs:write', pattern: 'solo', objective: 'Cross-examine', writes: [], anonymizeInputs: true } }] },
    ],
  });
  const state = await startWorkflow({ workflow, repoRoot: tmp, cwd: tmp, worktree: tmp });
  assert.equal(state.status, 'completed', JSON.stringify(state.steps));

  const panelRunId = state.steps['independent-opinions'].units.p.unitRunId;
  const xRunId = state.steps['cross-examine'].units.x.unitRunId;
  const xDir = path.join(tmp, '.fgos', 'assignments', xRunId);
  const assignment = JSON.parse(fs.readFileSync(path.join(xDir, 'producer', '1', 'assignment.json'), 'utf8'));

  assert.deepEqual(
    assignment.contextRefs,
    ['A', 'B', 'C', 'D'].map((letter) => path.join(xDir, 'inputs', `seat-${letter}.md`)),
  );
  for (const ref of assignment.contextRefs) assert.ok(fs.existsSync(ref), ref);
  assert.match(assignment.objective, /### seat-A/);
  assert.match(assignment.objective, /### seat-D/);
  for (const leak of [panelRunId, 'independent-opinions', 'panelist', 'synthesizer', 'unit run']) {
    assert.ok(!assignment.objective.includes(leak), `objective names ${leak}`);
    assert.ok(!assignment.contextRefs.join('\n').includes(leak), `context refs name ${leak}`);
  }

  // The mapping is kept for the owner, in unit.json only.
  const { inputMap } = JSON.parse(fs.readFileSync(path.join(xDir, 'unit.json'), 'utf8'));
  assert.deepEqual(
    inputMap.map((m) => m.input),
    ['panelist-1', 'panelist-2', 'panelist-3', 'synthesizer'].map((role) => `unit-run:${panelRunId}/${role}`),
  );
});

test('a unit template that declares inputs gets only those steps, and its own seat\'s result of a same-seat step', async () => {
  const tmp = setupTestRepo();
  const cfgPath = path.join(tmp, '.fgos', 'config.json');
  const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
  const script = path.join(tmp, 'echo-worker.mjs');
  cfg.runner.executors = {};
  for (const name of ['alpha', 'beta', 'gamma', 'delta']) {
    const command = path.join(tmp, `${name}-bin`);
    fs.symlinkSync(process.execPath, command);
    cfg.runner.executors[name] = {
      kind: 'agent',
      allowCrossProvider: true,
      command,
      args: [script, '{prompt}'],
      providerModel: name,
      invocations: [{ id: 'cli-default', via: 'cli', adapter: 'cli-spawn', confinement: { backend: 'bwrap' }, command, args: [script, '{prompt}'] }],
    };
  }
  cfg.runner.defaultExecutor = 'alpha';
  for (const capability of Object.values(cfg.runner.capabilities)) {
    capability.prefer = ['alpha', 'beta', 'gamma', 'delta'].map((executor) => ({ executor }));
  }
  fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2));

  const panel = (extra = {}) => ({ capability: 'docs:write', pattern: 'panel', writes: [], ...extra });
  const workflow = validateWorkflow({
    id: 'own-seat-round',
    steps: [
      { id: 'round-1', units: [{ id: 'p1', template: panel({ objective: 'Propose' }) }] },
      { id: 'summary', dependsOn: ['round-1'], units: [{ id: 's', template: { capability: 'docs:write', pattern: 'solo', objective: 'Summarize', writes: [], anonymizeInputs: true } }] },
      {
        id: 'round-2',
        dependsOn: ['summary'],
        units: [{
          id: 'p2',
          template: panel({
            objective: 'Revise',
            anonymizeInputs: true,
            inputs: [{ step: 'summary', label: 'group summary' }, { step: 'round-1', sameSeat: true, label: 'your own previous proposal' }],
          }),
        }],
      },
      { id: 'after', dependsOn: ['round-2'], units: [{ id: 'a', template: { capability: 'docs:write', pattern: 'solo', objective: 'Wrap up', writes: [] } }] },
    ],
  });
  const state = await startWorkflow({ workflow, repoRoot: tmp, cwd: tmp, worktree: tmp });
  assert.equal(state.status, 'completed', JSON.stringify(state.steps));

  const runId = (step, unit) => state.steps[step].units[unit].unitRunId;
  const assignment = (id, role) => JSON.parse(fs.readFileSync(path.join(tmp, '.fgos', 'assignments', id, role, '1', 'assignment.json'), 'utf8'));
  const r2Dir = path.join(tmp, '.fgos', 'assignments', runId('round-2', 'p2'));

  for (const role of ['panelist-1', 'panelist-2', 'panelist-3']) {
    const { contextRefs, objective } = assignment(runId('round-2', 'p2'), role);
    assert.deepEqual(contextRefs, [path.join(r2Dir, 'inputs', 'seat-A.md'), path.join(r2Dir, role, '1', 'inputs', 'own-previous.md')], role);
    const own = state.steps['round-1'].units.p1.results.find((r) => r.role === role).runResult.settleReports[0].path;
    assert.ok(fs.readFileSync(contextRefs[1]).equals(fs.readFileSync(path.join(tmp, own))), `${role} gets its own round 1 report`);
    assert.match(objective, /### seat-A \(group summary\)/);
    assert.match(objective, /### your own previous proposal\nIt is the file named "own-previous"/);
    for (const leak of [runId('round-1', 'p1'), 'round-1', 'panelist', 'synthesizer', 'seat-B']) {
      assert.ok(!objective.includes(leak), `objective names ${leak}`);
    }
  }

  // A step with no declaration still gets every report of every step it builds on.
  const afterRefs = assignment(runId('after', 'a'), 'producer').contextRefs;
  for (const id of [runId('round-1', 'p1'), runId('summary', 's'), runId('round-2', 'p2')]) {
    assert.ok(afterRefs.some((ref) => ref.includes(`/assignments/${id}/`)), `${id} is still handed over: ${JSON.stringify(afterRefs)}`);
  }
});

test('validateWorkflow checks a unit template\'s inputs: known earlier steps only, with a clear error', () => {
  const wf = (inputs, extraStep = {}) => ({
    id: 'test/inputs',
    steps: [
      { id: 'a', units: [{ id: 'ua', template: { capability: 'docs:write' } }] },
      { id: 'b', dependsOn: ['a'], units: [{ id: 'ub', template: { capability: 'docs:write' } }] },
      { id: 'c', dependsOn: ['b'], units: [{ id: 'uc', template: { capability: 'docs:write', inputs } }] },
      { id: 'side', ...extraStep, units: [{ id: 'us', template: { capability: 'docs:write' } }] },
    ],
  });
  const ok = validateWorkflow(wf([{ step: 'a', sameSeat: true, label: 'mine' }, { step: 'b' }]));
  assert.deepEqual(ok.steps[2].units[0].template.inputs, [{ step: 'a', sameSeat: true, label: 'mine' }, { step: 'b' }]);
  assert.equal(ok.steps[1].units[0].template.inputs, undefined);

  assert.throws(() => validateWorkflow(wf([{ step: 'nope' }])), /step "c" unit "uc" inputs\[0\] names undeclared step "nope"/);
  assert.throws(() => validateWorkflow(wf([{ step: 'side' }])), /inputs\[0\] names step "side", which this step does not depend on/);
  assert.throws(() => validateWorkflow(wf([{ step: 'c' }])), /names step "c", which this step does not depend on/);
  assert.throws(() => validateWorkflow(wf('a')), /inputs must be an array/);
  assert.throws(() => validateWorkflow(wf(['a'])), /inputs\[0\] must be an object/);
  assert.throws(() => validateWorkflow(wf([{}])), /requires "step"/);
  assert.throws(() => validateWorkflow(wf([{ step: 'a', 'same-seat': true }])), /unknown key "same-seat"/);
  assert.throws(() => validateWorkflow(wf([{ step: 'a', sameSeat: 'yes' }])), /sameSeat must be true or false/);
});

test('a completed unit keeps the id of the Unit run that produced it', () => {
  const tmp = setupTestRepo();
  const workflow = validateWorkflow({
    id: 'unit-run-id-projection',
    steps: [{ id: 's1', units: [{ id: 'u1', template: { capability: 'docs:write', objective: 'x' } }] }],
  });
  const { workflowRunId } = createWorkflowRun({ repoRoot: tmp, workflowId: workflow.id, workflow });
  const append = (type, payload) => appendWorkflowEvent({ repoRoot: tmp, workflowRunId, event: { type, payload } });
  const unitOf = () => projectWorkflowState(readWorkflowEvents({ repoRoot: tmp, workflowRunId })).steps.s1.units.u1;

  append('unit.scheduled', { stepId: 's1', unitId: 'u1' });
  assert.equal(unitOf().unitRunId, undefined, 'a scheduled unit has no Unit run id yet');
  append('unit.complete', { stepId: 's1', unitId: 'u1', unitRunId: 'unit-run-123-abcd', outcome: 'pass', results: [] });
  assert.equal(unitOf().unitRunId, 'unit-run-123-abcd');
});

function seedRunWithUnitWorktrees(tmp, { terminal, trunk = 'main' }) {
  const workflow = validateWorkflow({
    id: 'test/cleanup',
    title: 'Cleanup',
    steps: [
      {
        id: 's1',
        units: [
          { id: 'merged', template: { capability: 'docs:write', writes: ['a.txt'] } },
          { id: 'unmerged', template: { capability: 'docs:write', writes: ['b.txt'] } },
          { id: 'dirty', template: { capability: 'docs:write', writes: ['c.txt'] } },
          { id: 'broken', template: { capability: 'docs:write', writes: ['d.txt'] } },
        ],
      },
    ],
  });
  const { workflowRunId } = createWorkflowRun({ repoRoot: tmp, workflowId: workflow.id, workflow });
  const units = {};
  for (const id of ['merged', 'unmerged', 'dirty', 'broken']) {
    const branch = `wf/${workflowRunId}/${id}`;
    const wt = createWorkflowWorktree({ repoRoot: tmp, branch });
    worktreeDirs.push(wt.worktreePath);
    units[id] = { branch, worktreePath: wt.worktreePath };
    appendWorkflowEvent({
      repoRoot: tmp,
      workflowRunId,
      event: { type: 'unit.scheduled', payload: { stepId: 's1', unitId: id, worktreePath: wt.worktreePath, branch } },
    });
  }
  const commitIn = (id, file) => {
    fs.writeFileSync(path.join(units[id].worktreePath, file), `${id}\n`);
    execFileSync('git', ['add', file], { cwd: units[id].worktreePath, stdio: 'ignore' });
    execFileSync('git', ['-c', 'user.name=T', '-c', 'user.email=t@t.local', 'commit', '-m', id], { cwd: units[id].worktreePath, stdio: 'ignore' });
  };
  commitIn('merged', 'a.txt');
  mergeWorkflowBranch({ repoRoot: tmp, sourceBranch: units.merged.branch, targetBranch: trunk });
  commitIn('unmerged', 'b.txt');
  fs.writeFileSync(path.join(units.dirty.worktreePath, 'scratch.txt'), 'uncommitted\n');
  for (const id of ['merged', 'unmerged', 'dirty']) {
    appendWorkflowEvent({ repoRoot: tmp, workflowRunId, event: { type: 'unit.complete', payload: { stepId: 's1', unitId: id, outcome: 'pass' } } });
  }
  appendWorkflowEvent({ repoRoot: tmp, workflowRunId, event: { type: 'unit.complete', payload: { stepId: 's1', unitId: 'broken', outcome: 'execution-failure' } } });
  appendWorkflowEvent({ repoRoot: tmp, workflowRunId, event: { type: terminal, payload: { outcome: terminal === 'workflow.fail' ? 'execution-failure' : 'pass' } } });
  return { workflowRunId, units };
}

test('a finished workflow removes integrated unit worktrees and keeps the others with their paths in the run event', async () => {
  const tmp = setupTestRepo();
  const { workflowRunId, units } = seedRunWithUnitWorktrees(tmp, { terminal: 'workflow.complete' });

  const state = await resumeWorkflow(workflowRunId, { repoRoot: tmp, cwd: tmp });

  assert.equal(fs.existsSync(units.merged.worktreePath), false, 'integrated unit worktree should be removed');
  assert.equal(execFileSync('git', ['branch', '--list', units.merged.branch], { cwd: tmp, encoding: 'utf8' }).trim(), '');
  for (const id of ['unmerged', 'dirty', 'broken']) {
    assert.equal(fs.existsSync(units[id].worktreePath), true, `${id} worktree must stay`);
  }
  assert.deepEqual(state.worktrees.removed.map((e) => e.unitId), ['merged']);
  const kept = Object.fromEntries(state.worktrees.kept.map((e) => [e.unitId, e]));
  assert.equal(kept.broken.worktreePath, units.broken.worktreePath);
  assert.match(kept.broken.reason, /execution-failure/);
  assert.match(kept.unmerged.reason, /not integrated/);
  assert.match(kept.dirty.reason, /uncommitted/);
  const logged = readWorkflowEvents({ repoRoot: tmp, workflowRunId }).filter((e) => e.type === 'workflow.worktrees');
  assert.equal(logged.length, 1);

  // A second pass over the finished run changes nothing and logs nothing more.
  await resumeWorkflow(workflowRunId, { repoRoot: tmp, cwd: tmp });
  assert.equal(readWorkflowEvents({ repoRoot: tmp, workflowRunId }).filter((e) => e.type === 'workflow.worktrees').length, 1);
});

test('a failed workflow cleans up the same way', async () => {
  const tmp = setupTestRepo();
  const { workflowRunId, units } = seedRunWithUnitWorktrees(tmp, { terminal: 'workflow.fail' });
  const state = await resumeWorkflow(workflowRunId, { repoRoot: tmp, cwd: tmp });
  assert.equal(state.status, 'failed');
  assert.equal(fs.existsSync(units.merged.worktreePath), false);
  assert.equal(fs.existsSync(units.broken.worktreePath), true);
});

test('a repository whose trunk is "master" still gets its integrated unit worktrees removed', async () => {
  const tmp = setupTestRepo();
  execFileSync('git', ['branch', '-m', 'main', 'master'], { cwd: tmp, stdio: 'ignore' });
  const { workflowRunId, units } = seedRunWithUnitWorktrees(tmp, { terminal: 'workflow.complete', trunk: 'master' });

  const state = await resumeWorkflow(workflowRunId, { repoRoot: tmp, cwd: tmp });

  assert.equal(fs.existsSync(units.merged.worktreePath), false, 'a unit merged into master is integrated');
  assert.deepEqual(state.worktrees.removed.map((e) => e.unitId), ['merged']);
  assert.match(state.worktrees.kept.find((e) => e.unitId === 'unmerged').reason, /not integrated/);
});

test('integration target: declared step target, then origin/HEAD, then the checkout branch', () => {
  const tmp = setupTestRepo();
  execFileSync('git', ['branch', '-m', 'main', 'trunk'], { cwd: tmp, stdio: 'ignore' });
  const plain = { steps: [{ id: 'i', kind: 'integrate' }] };
  assert.equal(resolveIntegrationTarget({ repoRoot: tmp, workflow: plain }), 'trunk', 'local-only repo: its own branch');

  const origin = makeFixtureDir('fgos-wf-origin-');
  execFileSync('git', ['init', '--bare', '-b', 'develop', origin], { stdio: 'ignore' });
  execFileSync('git', ['remote', 'add', 'origin', origin], { cwd: tmp, stdio: 'ignore' });
  execFileSync('git', ['push', '-q', 'origin', 'trunk:develop'], { cwd: tmp, stdio: 'ignore' });
  execFileSync('git', ['fetch', '-q', 'origin'], { cwd: tmp, stdio: 'ignore' });
  execFileSync('git', ['remote', 'set-head', 'origin', 'develop'], { cwd: tmp, stdio: 'ignore' });
  assert.equal(resolveIntegrationTarget({ repoRoot: tmp, workflow: plain }), 'develop', "remote's default branch wins over the checkout");

  const declared = { steps: [{ id: 'i', kind: 'integrate', target: 'release' }] };
  assert.equal(resolveIntegrationTarget({ repoRoot: tmp, workflow: declared }), 'release', 'declared target wins over everything');
});

test('a step target is accepted on integrate steps only', () => {
  const base = { id: 'test/target', title: 'T' };
  const unit = { id: 'u', template: { capability: 'docs:write', writes: ['a.txt'] } };
  const ok = validateWorkflow({ ...base, steps: [{ id: 's1', units: [unit] }, { id: 'i', kind: 'integrate', dependsOn: ['s1'], target: 'release' }] });
  assert.equal(ok.steps[1].target, 'release');
  assert.throws(() => validateWorkflow({ ...base, steps: [{ id: 's1', target: 'release', units: [unit] }] }), /only valid on a step of kind "integrate"/);
});

test('validateWorkflow keeps a unit template persona and params and rejects params that are not an object', () => {
  const base = { id: 'test/persona-params', steps: [{ id: 's1', units: [{ id: 'u1', template: { capability: 'docs:write', pattern: 'panel', persona: ' panelist ', params: { members: 2 } } }] }] };
  const template = validateWorkflow(base).steps[0].units[0].template;
  assert.equal(template.persona, 'panelist');
  assert.deepEqual(template.params, { members: 2 });

  for (const bad of ['x', ['a'], 3]) {
    const workflow = { ...base, steps: [{ id: 's1', units: [{ id: 'u1', template: { capability: 'docs:write', params: bad } }] }] };
    assert.throws(() => validateWorkflow(workflow), /params must be an object/);
  }
});

test('validateWorkflow keeps anonymizeInputs only when true and rejects a non-boolean', () => {
  const withFlag = (anonymizeInputs) => ({ id: 'test/anon', steps: [{ id: 's1', units: [{ id: 'u1', template: { capability: 'docs:write', anonymizeInputs } }] }] });
  assert.equal(validateWorkflow(withFlag(true)).steps[0].units[0].template.anonymizeInputs, true);
  assert.equal(validateWorkflow(withFlag(undefined)).steps[0].units[0].template.anonymizeInputs, undefined);
  assert.throws(() => validateWorkflow(withFlag('yes')), /anonymizeInputs must be true or false/);
});

test('validateWorkflow keeps blind only when true and rejects a non-boolean', () => {
  const withFlag = (blind) => ({ id: 'test/blind', steps: [{ id: 's1', units: [{ id: 'u1', template: { capability: 'docs:write', blind } }] }] });
  assert.equal(validateWorkflow(withFlag(true)).steps[0].units[0].template.blind, true);
  assert.equal(validateWorkflow(withFlag(undefined)).steps[0].units[0].template.blind, undefined);
  assert.equal(validateWorkflow(withFlag(false)).steps[0].units[0].template.blind, undefined);
  assert.throws(() => validateWorkflow(withFlag('yes')), /blind must be true or false/);
});

// Executors of distinct provider families, so a panel can bind every seat.
//
// Each executor command is a symlink to the node binary (over 100 MB). Left as
// untracked files, every seat's dispatch hashes each of them as a pre-existing
// dirty file, once before launch and again at settlement. The hash streams the
// file, so memory stays flat, but reading 100 MB per seat is still slow work
// that a test of seat wiring does not need. The symlinks are excluded from git
// so they are not part of the worktree the dispatch snapshots.
//
// `runner.timeoutMs` is bounded so a seat whose worker never answers fails the
// run within a minute, naming the seat, instead of after the 35-minute default.
const FIXTURE_SEAT_TIMEOUT_MS = 45_000;
function useDistinctFamilies(tmp, names) {
  const cfgPath = path.join(tmp, '.fgos', 'config.json');
  const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
  const script = path.join(tmp, 'echo-worker.mjs');
  cfg.runner.executors = {};
  cfg.runner.timeoutMs = FIXTURE_SEAT_TIMEOUT_MS;
  fs.mkdirSync(path.join(tmp, '.git', 'info'), { recursive: true });
  fs.appendFileSync(path.join(tmp, '.git', 'info', 'exclude'),names.map((name) => `/${name}-bin\n`).join(''));
  for (const name of names) {
    const command = path.join(tmp, `${name}-bin`);
    fs.symlinkSync(process.execPath, command);
    cfg.runner.executors[name] = {
      kind: 'agent',
      allowCrossProvider: true,
      command,
      args: [script, '{prompt}'],
      providerModel: name,
      invocations: [{ id: 'cli-default', via: 'cli', adapter: 'cli-spawn', confinement: { backend: 'bwrap' }, command, args: [script, '{prompt}'] }],
    };
  }
  cfg.runner.defaultExecutor = names[0];
  for (const capability of Object.values(cfg.runner.capabilities)) {
    capability.prefer = names.map((executor) => ({ executor }));
  }
  fs.writeFileSync(cfgPath, JSON.stringify(cfg, null, 2));
}

test('a unit template persona and params reach the binding and the per-role objective like a CLI override', async () => {
  const tmp = setupTestRepo();
  useDistinctFamilies(tmp, ['alpha', 'beta', 'gamma']);

  const workflow = validateWorkflow({
    id: 'persona-params',
    steps: [
      {
        id: 'panel',
        units: [
          {
            id: 'p',
            template: {
              capability: 'docs:write',
              pattern: 'panel',
              persona: 'panelist',
              params: { members: 2, roleTasks: { synthesizer: 'WORKFLOW-SYNTH-TASK for: {objective}' } },
              objective: 'Review the design',
              writes: [],
            },
          },
        ],
      },
      { id: 'plain', dependsOn: ['panel'], units: [{ id: 's', template: { capability: 'docs:write', pattern: 'solo', objective: 'Decide', writes: [] } }] },
    ],
  });
  const state = await startWorkflow({ workflow, repoRoot: tmp, cwd: tmp, worktree: tmp });
  assert.equal(state.status, 'completed', JSON.stringify(state.steps));

  const runDir = (runId) => path.join(tmp, '.fgos', 'assignments', runId);
  const readAssignment = (runId, role) => JSON.parse(fs.readFileSync(path.join(runDir(runId), role, '1', 'assignment.json'), 'utf8'));
  const panelRunId = state.steps.panel.units.p.unitRunId;

  // params.members reached the pattern: two panelists, not the default three.
  assert.ok(fs.existsSync(path.join(runDir(panelRunId), 'panelist-2')));
  assert.ok(!fs.existsSync(path.join(runDir(panelRunId), 'panelist-3')));
  // params.roleTasks reached roleUnit: the synthesizer was given the workflow's own task text.
  assert.match(readAssignment(panelRunId, 'synthesizer').objective, /^WORKFLOW-SYNTH-TASK for: Review the design/);

  // persona reached bind() as an override scoped to the unit, so its seats carry the persona.
  for (const role of ['panelist-1', 'panelist-2']) {
    assert.equal(readAssignment(panelRunId, role).policy.preferPersona, 'panelist', role);
  }
  const unitRecord = JSON.parse(fs.readFileSync(path.join(runDir(panelRunId), 'unit.json'), 'utf8'));
  assert.equal(unitRecord.overrides[0].origin, 'workflow');
  assert.deepEqual(unitRecord.overrides[0].scope, { unit: 'p' });

  // a unit that declares no persona gets none from the workflow.
  const soloRunId = state.steps.plain.units.s.unitRunId;
  assert.notEqual(readAssignment(soloRunId, 'producer').policy.preferPersona, 'panelist');
});

// Two CLI runs of three seats each; alone it takes seconds. The bounds below are
// backstops only: a seat that never answers is failed by FIXTURE_SEAT_TIMEOUT_MS.
const STANCE_CLI_CALL_TIMEOUT_MS = 60_000;
test('workflow and unit CLI options reach the actually dispatched prompts and drive settled stance behavior', { timeout: 3 * STANCE_CLI_CALL_TIMEOUT_MS }, (t) => {
  const tmp = setupTestRepo();
  t.after(() => fs.rmSync(tmp, { recursive: true, force: true }));
  useDistinctFamilies(tmp, ['alpha', 'beta', 'gamma', 'delta']);
  const runFgos = (label, args) => {
    try {
      return parseCliData(execFileSync(process.execPath, [BIN_FGOS, ...args], { cwd: tmp, encoding: 'utf8', timeout: STANCE_CLI_CALL_TIMEOUT_MS }));
    } catch (error) {
      const how = error.signal ? `was killed by ${error.signal} (still running after ${STANCE_CLI_CALL_TIMEOUT_MS} ms)` : `exited ${error.status}`;
      throw new Error(`waiting for ${label}: the CLI ${how}; seat directories under ${path.join(tmp, '.fgos', 'assignments')}\nstderr:\n${error.stderr ?? ''}`, { cause: error });
    }
  };
  // cli-spawn delivers the brief in argv, not herdr's brief-N.md file. The worker answers only from
  // what it was actually told: it votes for the second declared choice, and only when asked.
  fs.writeFileSync(path.join(tmp, 'echo-worker.mjs'), String.raw`
    import fs from 'node:fs';
    import path from 'node:path';
    const prompt = process.argv.slice(2).join(' ');
    const target = /Write structured JSON to (\S+agent-result\.json)/.exec(prompt)?.[1];
    if (!target) throw new Error('worker received no claim destination');
    const choices = /Declared choices: (\[[^\n]+?\]);/.exec(prompt);
    const claim = { status: 'done', summary: 'Completed the assigned question analysis.' };
    if (choices) {
      const options = JSON.parse(choices[1]);
      if (options.length < 2) throw new Error('worker received fewer than two options');
      claim.stance = { choice: options[1], confidence: target.includes('/panelist-2/') ? 'malformed' : 0.9 };
    }
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(path.join(path.dirname(target), 'agent-report.md'), '# Report\nThe second strategy favors a simpler implementation and bounded rebuild cost. Review correctness against the stated workload.\n');
    fs.writeFileSync(target, JSON.stringify(claim));
  `);
  const dispatchedPrompt = (dir, role) => {
    const envelope = JSON.parse(fs.readFileSync(path.join(dir, role, '1', 'runs', '01', 'protected', 'launch-envelope.json'), 'utf8'));
    const prompt = envelope.invocation.args.find((arg) => arg.includes('Write structured JSON to'));
    assert.equal(typeof prompt, 'string', 'the real CLI launch envelope contains the delivered brief');
    return prompt;
  };
  const workflow = {
    id: 'stance-cli',
    steps: [{ id: 'opinions', units: [{ id: 'question', template: {
      capability: 'docs:write', pattern: 'panel', params: { members: 2 },
      objective: 'Choose incremental or full rebuilding', writes: [],
    } }] }],
  };
  fs.mkdirSync(path.join(tmp, 'core', 'workflows'), { recursive: true });
  fs.writeFileSync(path.join(tmp, 'core', 'workflows', 'stance.json'), JSON.stringify(workflow));
  const state = runFgos('`fgos workflow start stance-cli --foreground`', [
    'workflow', 'start', 'stance-cli', '--request', 'Assess correctness', '--stance-options', 'incremental|full',
    '--dir', tmp, '--foreground',
  ]);
  assert.equal(state.status, 'completed', `the workflow did not complete; its steps: ${JSON.stringify(state.steps)}`);
  assert.deepEqual(state.stanceOptions, ['incremental', 'full']);
  const unitRunId = state.steps.opinions.units.question.unitRunId;
  const unitDir = path.join(tmp, '.fgos', 'assignments', unitRunId);
  const unitRecord = JSON.parse(fs.readFileSync(path.join(unitDir, 'unit.json'), 'utf8'));
  const summary = JSON.parse(fs.readFileSync(path.join(unitDir, 'unit-summary.json'), 'utf8'));
  const expectedLink = { runId: state.workflowRunId, stepId: 'opinions', unitId: 'question' };
  assert.deepEqual(unitRecord.workflow, expectedLink);
  assert.deepEqual(summary.workflow, expectedLink);
  assert.deepEqual(summary.stanceOptions, ['incremental', 'full']);
  assert.equal(summary.outcome, 'pass', 'malformed optional stance never fails a seat');
  for (const role of ['panelist-1', 'panelist-2']) {
    const brief = dispatchedPrompt(unitDir, role);
    assert.match(brief, /Assess correctness/);
    assert.match(brief, /Declared choices: \["incremental","full"\]/);
    assert.match(brief, /"stance": \{"choice"/);
    const seat = summary.seats.find((entry) => entry.role === role);
    assert.equal(seat.kind, 'panelist');
    assert.deepEqual(seat.final.stance, role === 'panelist-1'
      ? { status: 'valid', choice: 'full', confidence: 0.9 }
      : { status: 'invalid', reason: 'confidence-out-of-range' });
  }
  assert.doesNotMatch(dispatchedPrompt(unitDir, 'synthesizer'), /Declared choices|Passive stance measurement/);
  assert.deepEqual(summary.seats.find((seat) => seat.role === 'synthesizer').final.stance, { status: 'missing' },
    'the synthesizer was never asked, so it never voted');
  // The same labels have a direct-unit CLI door and do not acquire a workflow link.
  const unitFile = path.join(tmp, 'unit.json');
  fs.writeFileSync(unitFile, JSON.stringify({ id: 'direct-question', capability: 'docs:write', pattern: 'panel', objective: 'Choose rebuilding strategy', writes: [] }));
  const direct = runFgos('`fgos run --unit`', [
    'run', '--unit', unitFile, '--stance-options', 'incremental|full', '--dir', tmp,
  ]);
  const directDir = path.join(tmp, '.fgos', 'assignments', direct.unitRunId);
  const directRecord = JSON.parse(fs.readFileSync(path.join(directDir, 'unit.json'), 'utf8'));
  const directSummary = JSON.parse(fs.readFileSync(path.join(directDir, 'unit-summary.json'), 'utf8'));
  assert.equal(directRecord.workflow, null);
  assert.equal(directSummary.workflow, null);
  assert.deepEqual(directSummary.stanceOptions, ['incremental', 'full']);
  assert.match(dispatchedPrompt(directDir, 'panelist-1'), /Declared choices: \["incremental","full"\]/);
  assert.equal(directSummary.outcome, 'pass');
  assert.deepEqual(directSummary.seats.find((seat) => seat.role === 'panelist-1').final.stance, { status: 'valid', choice: 'full', confidence: 0.9 });
});

test('workflow template option labels normalize without accepting malformed sets', () => {
  const make = (stanceOptions) => ({ id: 'options', steps: [{ id: 's', units: [{ id: 'u', template: { capability: 'docs:write', stanceOptions } }] }] });
  assert.deepEqual(validateWorkflow(make([' a ', 'b'])).steps[0].units[0].template.stanceOptions, ['a', 'b']);
  for (const value of ['a|b', [''], ['a', 'a'], ['other']]) assert.throws(() => validateWorkflow(make(value)), /stanceOptions/);
});

test('human consent gate: answering without --approve leaves gate parked with clarification note, and answering with --approve releases it', async () => {
  const tmp = setupTestRepo();
  const unit = (id, objective) => ({ id, template: { capability: 'docs:write', pattern: 'solo', objective, writes: [] } });
  const workflow = validateWorkflow({
    id: 'consent-gate-roundtrip',
    steps: [
      { id: 'prep', units: [unit('u-prep', 'Prepare proposal')] },
      { id: 'gate-step', dependsOn: ['prep'], gate: { kind: 'human', question: 'Authorize scope change?' } },
      { id: 'exec', dependsOn: ['gate-step'], units: [unit('u-exec', 'Execute approved scope')] },
    ],
  });

  let state = await startWorkflow({ workflow, repoRoot: tmp, cwd: tmp });
  const runId = state.workflowRunId;
  const runDir = path.join(tmp, '.fgos', 'workflow-runs', runId);

  // Runner parks at gate-step
  assert.equal(state.status, 'parked');
  assert.equal(state.questions.length, 1);
  assert.equal(state.questions[0].stepId, 'gate-step');
  assert.equal(state.steps['gate-step'].status, 'parked');

  // Round 1: Clarification only (no --approve)
  state = await answerWorkflow(runId, {
    stepId: 'gate-step',
    answer: 'chưa rõ, giải thích thêm ngân sách',
    approved: false,
    repoRoot: tmp,
    cwd: tmp,
  });

  // Step and run MUST stay parked!
  assert.equal(state.status, 'parked');
  assert.equal(state.questions.length, 1);
  assert.equal(state.questions[0].stepId, 'gate-step');
  assert.equal(state.steps['gate-step'].status, 'parked');
  assert.equal(state.steps['gate-step'].lastClarification, 'chưa rõ, giải thích thêm ngân sách');

  // Verify answer file has recorded clarification round
  const answerFile = path.join(runDir, 'gate-answers', 'gate-step.md');
  assert.ok(fs.existsSync(answerFile));
  let answerContent = fs.readFileSync(answerFile, 'utf8');
  assert.ok(answerContent.includes('Clarification'));
  assert.ok(answerContent.includes('chưa rõ, giải thích thêm ngân sách'));

  // Round 2: Explicit approval
  state = await answerWorkflow(runId, {
    stepId: 'gate-step',
    answer: 'đồng ý triển khai',
    approved: true,
    repoRoot: tmp,
    cwd: tmp,
  });

  // Now gate is released and workflow completes!
  assert.equal(state.status, 'completed');
  assert.equal(state.outcome, 'pass');
  assert.equal(state.steps['gate-step'].status, 'completed');
  assert.equal(state.steps['gate-step'].approved, true);

  // Answer file contains both clarification and approval rounds!
  answerContent = fs.readFileSync(answerFile, 'utf8');
  assert.ok(answerContent.includes('Clarification'));
  assert.ok(answerContent.includes('Approved'));
  assert.ok(answerContent.includes('đồng ý triển khai'));
});

test('human input gate (mode: input): answering without --approve releases the gate directly', async () => {
  const tmp = setupTestRepo();
  const unit = (id, objective) => ({ id, template: { capability: 'docs:write', pattern: 'solo', objective, writes: [] } });
  const workflow = validateWorkflow({
    id: 'input-gate-roundtrip',
    steps: [
      { id: 'prep', units: [unit('u-prep', 'Collect ideas')] },
      { id: 'vote-step', dependsOn: ['prep'], gate: { kind: 'human', mode: 'input', question: 'Submit vote ranking' } },
      { id: 'tally', dependsOn: ['vote-step'], units: [unit('u-tally', 'Tally votes')] },
    ],
  });

  let state = await startWorkflow({ workflow, repoRoot: tmp, cwd: tmp });
  const runId = state.workflowRunId;

  assert.equal(state.status, 'parked');
  assert.equal(state.questions.length, 1);
  assert.equal(state.questions[0].stepId, 'vote-step');

  // Answer input gate without approved flag
  state = await answerWorkflow(runId, {
    stepId: 'vote-step',
    answer: 'Option A (1), Option B (2)',
    repoRoot: tmp,
    cwd: tmp,
  });

  // Released directly, workflow completes!
  assert.equal(state.status, 'completed');
  assert.equal(state.outcome, 'pass');
  assert.equal(state.steps['vote-step'].status, 'completed');
});

test('workflow context refs and reviewed outcome contracts refuse unsafe inputs', () => {
  const make = (template) => ({ id: 'contract', steps: [{ id: 'root', units: [{ template: { capability: 'docs:write', ...template } }] }] });
  for (const contextRefs of [null, 'notes.md', [true], ['../notes'], ['/tmp/notes'], ['a\\b'], ['unit-run:../producer'], ['gate-answer:wf/..']]) {
    assert.throws(() => validateWorkflow(make({ contextRefs })), /contextRefs/);
    assert.throws(() => normalizeContextRefs(contextRefs), /contextRefs/);
  }
  const refs = ['notes.md', 'unit-run:unit-1/producer', 'gate-answer:wf-1/approve'];
  assert.deepEqual(validateWorkflow(make({ contextRefs: refs })).steps[0].units[0].template.contextRefs, refs);
  for (const pattern of ['solo', 'panel', 'reviewed']) {
    const normalized = validateWorkflow(make({ pattern }));
    assert.deepEqual(validateWorkflow(normalized), normalized, 'a loader-normalized workflow remains valid when started');
  }
  assert.deepEqual(validateWorkflow(make({ pattern: 'reviewed', acceptOutcomes: ['pass', 'findings'] })).steps[0].units[0].template.acceptOutcomes, ['pass', 'findings']);
  for (const acceptOutcomes of [[], ['execution-failure'], ['pass', 'pass'], 'pass', null]) {
    assert.throws(() => validateWorkflow(make({ pattern: 'reviewed', acceptOutcomes })), /acceptOutcomes/);
  }
  assert.throws(() => validateWorkflow(make({ pattern: 'solo', acceptOutcomes: ['pass'] })), /reviewed/);
});

test('workflow root context refs persist and reach only root Units across resume', async (t) => {
  const tmp = setupTestRepo();
  t.after(() => fs.rmSync(tmp, { recursive: true, force: true }));
  fs.writeFileSync(path.join(tmp, 'owner.txt'), 'Owner context');
  fs.writeFileSync(path.join(tmp, 'template.txt'), 'Template context');
  const workflow = { id: 'context-root', steps: [
    { id: 'root', gate: { kind: 'human', mode: 'input', question: 'Start?' }, units: [
      { id: 'first', template: { capability: 'docs:write', contextRefs: ['template.txt'] } },
      { id: 'dependent-root', dependsOn: ['first'], template: { capability: 'docs:write' } },
    ] },
    { id: 'later', dependsOn: ['root'], units: [{ id: 'second', template: { capability: 'docs:write', contextRefs: ['template.txt'] } }] },
  ] };
  const parked = await startWorkflow({ workflow, repoRoot: tmp, cwd: tmp, contextRefs: ['owner.txt'] });
  assert.deepEqual(parked.contextRefs, ['owner.txt']);
  assert.deepEqual(readWorkflowEvents({ repoRoot: tmp, workflowRunId: parked.workflowRunId })[0].payload.contextRefs, ['owner.txt']);
  const completed = await answerWorkflow(parked.workflowRunId, { repoRoot: tmp, cwd: tmp, stepId: 'root', answer: 'yes' });
  assert.equal(completed.status, 'completed');
  const inputs = (step, unit) => JSON.parse(fs.readFileSync(path.join(tmp, '.fgos', 'assignments', completed.steps[step].units[unit].unitRunId, 'unit.json'), 'utf8')).unit.inputs;
  assert.ok(inputs('root', 'first').includes('owner.txt'));
  assert.ok(inputs('root', 'first').includes('template.txt'));
  assert.ok(inputs('root', 'dependent-root').includes('owner.txt'));
  assert.ok(!inputs('later', 'second').includes('owner.txt'));
  assert.ok(inputs('later', 'second').includes('template.txt'));
  const resumed = await resumeWorkflow(parked.workflowRunId, { repoRoot: tmp, cwd: tmp });
  assert.deepEqual(resumed.contextRefs, ['owner.txt']);
});

test('producer expertise gate parks clearly on malformed packets and remains answerable across resume', async (t) => {
  const validPackets = [{ 'missing expertise': ['database sizing', 'security review'] }, { 'missing expertise': [] }];
  const invalidPackets = [{}, { 'missing expertise': '' }, { 'missing expertise': 'security' }, { 'missing expertise': [''] }, { 'missing expertise': [' '] }];
  for (const packet of [...validPackets, ...invalidPackets, '```json\n{"missing expertise":[]}\n```', '# Advice\n{"missing expertise":[]}', 'Here is the recommendation: {"missing expertise":[]}']) {
    const tmp = setupTestRepo();
    t.after(() => fs.rmSync(tmp, { recursive: true, force: true }));
    fs.writeFileSync(path.join(tmp, 'echo-worker.mjs'), `
      import fs from 'node:fs'; import path from 'node:path';
      const target = /Write structured JSON to (\\S+agent-result\\.json)/.exec(process.argv.slice(2).join(' '))?.[1];
      if (!target) process.exit(1);
      const base = path.dirname(target), outbox = path.join(base, 'worker-output', 'outbox');
      const dir = fs.existsSync(outbox) ? outbox : base;
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'agent-report.md'), ${JSON.stringify(typeof packet === 'string' ? packet : JSON.stringify({ recommendation: 'Bound the design to its approved scope', ...packet }))});
      fs.writeFileSync(path.join(dir, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'Recommendation packet settled' }));
    `);
    const workflow = { id: 'gate-report', steps: [
      { id: 'synthesis', units: [{ id: 'synthesize-recommendation', template: { capability: 'docs:write' } }] },
      { id: 'close', dependsOn: ['synthesis'], gate: { kind: 'human', mode: 'input', question: 'Bring in {{report:synthesis/synthesize-recommendation:missing expertise}} or not?' } },
      { id: 'check-sha', dependsOn: ['close'], gate: { kind: 'human', mode: 'input', question: '{{report:synthesis/synthesize-recommendation:missing expertise}}' } },
    ] };
    const state = await startWorkflow({ workflow, repoRoot: tmp, cwd: tmp });
    assert.equal(state.status, 'parked');
    assert.equal(state.steps.close.status, 'parked');
    const resumed = await resumeWorkflow(state.workflowRunId, { repoRoot: tmp, cwd: tmp });
    assert.equal(resumed.status, 'parked');
    assert.deepEqual(resumed.questions, state.questions);
    if (validPackets.includes(packet)) {
      assert.equal(state.questions[0].question, `Bring in ${JSON.stringify(packet['missing expertise'])} or not?`);
      const settled = state.steps.synthesis.units['synthesize-recommendation'].results.find((record) => record.role === 'producer').runResult.settleReports[0];
      fs.appendFileSync(path.resolve(tmp, settled.path), 'tampered');
      const unreadable = await answerWorkflow(state.workflowRunId, { repoRoot: tmp, cwd: tmp, stepId: 'close', answer: 'yes' });
      assert.equal(unreadable.status, 'parked');
      assert.equal(unreadable.questions[0].stepId, 'check-sha');
      assert.match(unreadable.questions[0].question, /report-changed-after-settle/);
      assert.equal((await resumeWorkflow(state.workflowRunId, { repoRoot: tmp, cwd: tmp })).status, 'parked');
      assert.equal((await answerWorkflow(state.workflowRunId, { repoRoot: tmp, cwd: tmp, stepId: 'check-sha', answer: 'Acknowledge the changed packet; no expertise decision inferred.' })).status, 'completed');
    } else {
      assert.match(state.questions[0].question, /Cannot read settled producer "missing expertise"/);
      const next = await answerWorkflow(state.workflowRunId, { repoRoot: tmp, cwd: tmp, stepId: 'close', answer: 'No expertise decision can be inferred; retain this limitation.' });
      assert.equal(next.status, 'parked');
      assert.equal((await answerWorkflow(state.workflowRunId, { repoRoot: tmp, cwd: tmp, stepId: 'check-sha', answer: 'Retain the unreadable-report limitation and close.' })).status, 'completed');
    }
  }
});

test('reviewed findings acceptance proceeds while default and execution failure stop', async (t) => {
  for (const [accepted, failed] of [[true, false], [false, false], [true, true]]) {
    const tmp = setupTestRepo();
    t.after(() => fs.rmSync(tmp, { recursive: true, force: true }));
    const configPath = path.join(tmp, '.fgos', 'config.json');
    fs.writeFileSync(configPath, JSON.stringify(withProviderFamilies(JSON.parse(fs.readFileSync(configPath, 'utf8')))));
    fs.writeFileSync(path.join(tmp, 'echo-worker.mjs'), `
      import fs from 'node:fs'; import path from 'node:path';
      const target = /Write structured JSON to (\\S+agent-result\\.json)/.exec(process.argv.slice(2).join(' '))?.[1];
      if (!target || ${failed}) process.exit(1);
      const base = path.dirname(target), outbox = path.join(base, 'worker-output', 'outbox');
      const dir = fs.existsSync(outbox) ? outbox : base;
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'agent-report.md'), '# Review\\nThe recommendation has a substantive correctness issue requiring owner consideration.\\n');
      fs.writeFileSync(path.join(dir, 'agent-result.json'), JSON.stringify(target.includes('/reviewer/') ?
        { status: 'done', summary: 'Review found a correctness issue', assessment: { verdict: 'findings' }, findings: ['Correctness issue'] } :
        { status: 'done', summary: 'Producer completed' }));
    `);
    const state = await startWorkflow({ repoRoot: tmp, cwd: tmp, workflow: { id: 'accept-findings', steps: [
      { id: 'review', units: [{ id: 'advice', template: { capability: 'docs:write', pattern: 'reviewed', ...(accepted ? { acceptOutcomes: ['pass', 'findings'] } : {}) } }] },
      { id: 'close', dependsOn: ['review'], gate: { kind: 'human', mode: 'input', question: 'Continue?' } },
    ] } });
    assert.equal(state.status, accepted && !failed ? 'parked' : 'failed', state.steps.review.reason);
    if (!failed) assert.equal(state.steps.review.units.advice.outcome, 'findings');
    if (failed) assert.notEqual(state.steps.review.units.advice.outcome, 'pass');
  }
});

test('an absent producer parks a recoverable expertise gate rather than wedging the run', async (t) => {
  const tmp = setupTestRepo();
  t.after(() => fs.rmSync(tmp, { recursive: true, force: true }));
  const state = await startWorkflow({ repoRoot: tmp, cwd: tmp, workflow: {
    id: 'absent-producer', steps: [{ id: 'close', gate: { kind: 'human', mode: 'input', question: '{{report:synthesis/synthesize-recommendation:missing expertise}}' } }],
  } });
  assert.equal(state.status, 'parked');
  assert.match(state.questions[0].question, /producer is not settled/);
  assert.equal((await resumeWorkflow(state.workflowRunId, { repoRoot: tmp, cwd: tmp })).status, 'parked');
  assert.equal((await answerWorkflow(state.workflowRunId, { repoRoot: tmp, cwd: tmp, stepId: 'close', answer: 'Acknowledge absent producer evidence; close without inferred expertise.' })).status, 'completed');
});

test('cross-repo workflows reject plain context paths before recording a run, but consume state-root unit reports', async (t) => {
  const stateRoot = setupTestRepo();
  const workerRoot = setupTestRepo();
  t.after(() => {
    fs.rmSync(stateRoot, { recursive: true, force: true });
    fs.rmSync(workerRoot, { recursive: true, force: true });
  });
  const template = { capability: 'docs:write' };
  const workflow = { id: 'cross-context', steps: [{ id: 'read', units: [{ id: 'reader', template }] }] };
  for (const params of [
    { workflow, contextRefs: ['README.md'] },
    { workflow: { ...workflow, steps: [{ id: 'read', units: [{ id: 'reader', template: { ...template, contextRefs: ['README.md'] } }] }] } },
  ]) {
    await assert.rejects(startWorkflow({ ...params, repoRoot: stateRoot, cwd: workerRoot }), /plain paths across repositories; use unit-run:<id>\/<role>/);
    assert.ok(!fs.existsSync(path.join(stateRoot, '.fgos', 'workflow-runs')), 'ambiguous context must fail before durable run creation');
  }
  await assert.rejects(startWorkflow({ workflow, contextRefs: ['README.md'], repoRoot: stateRoot, cwd: stateRoot, worktree: workerRoot }), /plain paths across repositories/);
  const parent = await startWorkflow({ workflow, repoRoot: stateRoot, cwd: stateRoot });
  const parentRef = `unit-run:${parent.steps.read.units.reader.unitRunId}/producer`;
  const child = await startWorkflow({ workflow, contextRefs: [parentRef], repoRoot: stateRoot, cwd: workerRoot, worktree: workerRoot });
  assert.equal(child.status, 'completed', 'settled state-root reports remain usable outside their repository');
  assert.equal(child.steps.read.units.reader.results[0].runResult.classification.execution.status, 'completed');
  const linked = path.join(path.dirname(stateRoot), `${path.basename(stateRoot)}-context-linked`);
  execFileSync('git', ['worktree', 'add', '-b', 'context-linked', linked], { cwd: stateRoot, stdio: 'ignore' });
  t.after(() => fs.rmSync(linked, { recursive: true, force: true }));
  const sameRepo = await startWorkflow({
    workflow: { id: 'linked-context', steps: [{ id: 'owner', gate: { kind: 'human', question: 'Start?' } }] },
    contextRefs: ['README.md'], repoRoot: stateRoot, cwd: linked,
  });
  assert.equal(sameRepo.status, 'parked', 'linked worktrees are not different repositories');
});
