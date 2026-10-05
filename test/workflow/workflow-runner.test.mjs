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

// Worktrees created in the default location outlive the test unless removed here.
const worktreeDirs = [];
after(() => {
  for (const dir of worktreeDirs) fs.rmSync(dir, { recursive: true, force: true });
});

seedFileLocalBwrapRegistry();
// bwrap mounts a tmpfs over /tmp, so confined workers can only see fixtures elsewhere.
const FIXTURE_ROOT = fs.existsSync('/var/tmp') ? '/var/tmp' : os.tmpdir();

const BIN_FGOS = path.resolve('bin/fgos.mjs');

function setupTestRepo() {
  const tmp = fs.mkdtempSync(path.join(FIXTURE_ROOT, 'fgos-wf-test-'));
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

  // Answer gate
  appendWorkflowEvent({
    repoRoot: tmp,
    workflowRunId,
    event: { type: 'gate.answer', payload: { stepId: 's2', answer: 'yes' } },
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
  const tmp = fs.mkdtempSync(path.join(FIXTURE_ROOT, 'plan-trans-'));
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

  // Answer human gate
  state = await answerWorkflow(state.workflowRunId, {
    stepId: 'step-gate',
    answer: 'approved',
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
  state = await answerWorkflow(state.workflowRunId, { stepId: 'vote', answer, repoRoot: tmp, cwd: tmp, worktree: tmp });
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
      [BIN_FGOS, 'workflow', 'answer', parked.workflowRunId, '--step', 'step-gate', '--answer', 'yes', '--dir', tmp],
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
  const answer = { stepId: 'step-gate', answer: 'yes', ...opts };

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

  const origin = fs.mkdtempSync(path.join(FIXTURE_ROOT, 'fgos-wf-origin-'));
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

// Executors of distinct provider families, so a panel can bind every seat.
function useDistinctFamilies(tmp, names) {
  const cfgPath = path.join(tmp, '.fgos', 'config.json');
  const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
  const script = path.join(tmp, 'echo-worker.mjs');
  cfg.runner.executors = {};
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
