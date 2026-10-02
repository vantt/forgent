// test/workflow/workflow-runner.test.mjs — Integration tests for Workflow runner & sequencer (P3a)

import test from 'node:test';
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
  cleanupWorkflowWorktree,
  translatePlanToWorkflow,
  startWorkflow,
  statusWorkflow,
  answerWorkflow,
  resumeWorkflow,
} from '../../src/workflow/index.mjs';

const BIN_FGOS = path.resolve('bin/fgos.mjs');

function setupTestRepo() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-wf-test-'));
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
      runDir = path.dirname(match[1]);
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
          invocations: [{ id: 'cli-default', via: 'cli', adapter: 'cli-spawn', command: process.execPath, args: [echoScript, '{prompt}'] }],
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
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'plan-trans-'));
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

test('CLI: fgos workflow start, status, answer, and legacy operations', () => {
  const tmp = setupTestRepo();
  const planDir = path.join(tmp, 'my-plan');
  fs.mkdirSync(planDir);
  fs.writeFileSync(path.join(planDir, 'plan.md'), '---\ntitle: "CLI Plan"\n---\n');
  fs.writeFileSync(path.join(planDir, 'phase-01-start.md'), '---\nphase: 1\ntitle: "Start Phase"\ndependencies: []\n---\n');

  // 1. fgos workflow start --plan
  const startOut = execFileSync(
    process.execPath,
    [BIN_FGOS, 'workflow', 'start', '--plan', planDir, '--dir', tmp],
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
  // Outside the repo: a worker that writes into the checkout would trip the read-only guard.
  const promptsLog = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-wf-prompts-')), 'prompts.log');
  // Worker that records the prompt it was given into a file the test can read back.
  const spy = path.join(tmp, 'spy-worker.mjs');
  fs.writeFileSync(
    spy,
    `
    import fs from 'node:fs';
    import path from 'node:path';
    const prompt = process.argv.slice(2).join(' ');
    fs.appendFileSync(${JSON.stringify(promptsLog)}, prompt.replace(/\\n/g, ' ') + '\\n---\\n');
    const match = /Write structured JSON to (\\S+agent-result\\.json)/.exec(prompt);
    if (match) {
      const runDir = path.dirname(match[1]);
      fs.mkdirSync(runDir, { recursive: true });
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

  const prompts = fs.readFileSync(promptsLog, 'utf8').split('---\n').filter(Boolean);
  assert.equal(prompts.length, 2);
  assert.match(prompts[0], /Do the first thing/);
  assert.match(prompts[0], /Ship the pricing page by Friday/);
  assert.doesNotMatch(prompts[0], /FINDING-FROM-FIRST-STEP/);
  assert.match(prompts[1], /Ship the pricing page by Friday/);
  assert.match(prompts[1], /first step summary/);
  assert.match(prompts[1], /FINDING-FROM-FIRST-STEP/);
});
