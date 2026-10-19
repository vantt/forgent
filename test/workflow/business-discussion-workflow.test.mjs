// test/workflow/business-discussion-workflow.test.mjs — Acceptance tests for business-discussion workflow (P4 Phase 4)

import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { loadWorkflow } from '../../src/workflow/loader.mjs';
import { startWorkflow, answerWorkflow } from '../../src/workflow/index.mjs';
import { seedFileLocalBwrapRegistry } from '../runner/confinement-registry-fixture.helper.mjs';
import { setupWorkflowFixtureRepo } from '../helpers/workflow-fixture-repo.mjs';

seedFileLocalBwrapRegistry();

const BIN_FGOS = path.resolve('bin/fgos.mjs');

function setupTestRepo() {
  return setupWorkflowFixtureRepo({
    prefix: 'fgos-biz-wf-test-',
    readme: '# Biz Workflow Test',
    gitName: 'Biz Test',
    capabilities: ['business:frame', 'business:perspectives', 'business:critique', 'business:synthesize', 'business:plan'],
    reviewed: { maxRounds: 2, checkersByRigor: { standard: ['reviewer'] } },
    workerBody: `
      fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Strategic Report\\nComprehensive strategic business analysis completed with clear market viability and financial risk assessments.\\n');
      fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'Done' }));
    `,
  });
}

test('business-discussion.yaml schema validation & discovery', () => {
  const wf = loadWorkflow('business-discussion');
  assert.equal(wf.id, 'business-discussion');
  assert.equal(wf.steps.length, 6);
  assert.deepEqual(wf.steps.map((s) => s.id), [
    'framing',
    'perspectives',
    'critique',
    'synthesis',
    'approval',
    'action-plan',
  ]);
  assert.ok(wf.steps[4].gate);
  assert.equal(wf.steps[4].gate.kind, 'human');
});

test('runner: executes business-discussion workflow up to approval gate and advances to finish', async () => {
  const tmp = setupTestRepo();

  // Start workflow
  let state = await startWorkflow({
    workflowId: 'business-discussion',
    repoRoot: tmp,
    cwd: tmp,
  });

  // Steps before gate should be completed, and runner should park at approval gate
  assert.equal(state.status, 'parked');
  assert.equal(state.questions.length, 1);
  assert.equal(state.questions[0].stepId, 'approval');
  assert.equal(state.steps.framing.status, 'completed');
  assert.equal(state.steps.perspectives.status, 'completed');
  assert.equal(state.steps.critique.status, 'completed');
  assert.equal(state.steps.synthesis.status, 'completed');

  // Answer approval gate
  state = await answerWorkflow(state.workflowRunId, {
    stepId: 'approval',
    answer: 'Strategy approved for execution',
    approved: true,
    repoRoot: tmp,
    cwd: tmp,
  });

  // Action plan should execute and workflow reaches completion
  assert.equal(state.status, 'completed');
  assert.equal(state.outcome, 'pass');
  assert.equal(state.steps['action-plan'].status, 'completed');
});
