// test/workflow/architecture-advisory-workflow.test.mjs — Integration tests for Architecture Advisory Workflow (P4 Wave B Phase 3)

import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import {
  startWorkflow,
  statusWorkflow,
  answerWorkflow,
  loadWorkflow,
} from '../../src/workflow/index.mjs';
import { seedFileLocalBwrapRegistry } from '../runner/confinement-registry-fixture.helper.mjs';
import { setupWorkflowFixtureRepo } from '../helpers/workflow-fixture-repo.mjs';

seedFileLocalBwrapRegistry();


function setupTestRepo() {
  return setupWorkflowFixtureRepo({
    prefix: 'fgos-arch-wf-test-',
    readme: '# Architecture Advisory Workflow Test',
    gitName: 'Workflow Test',
    capabilities: ['architecture:frame', 'architecture:shape', 'architecture:critique', 'architecture:synthesize', 'architecture:explain'],
    modelPolicies: { node: { standard: 'node-std', flagship: 'node-high', frontier: 'node-top' } },
    reviewed: { maxRounds: 1, checkersByRigor: { standard: ['reviewer'], high: ['reviewer', 'red-team'] } },
    workerBody: `
      fs.writeFileSync(path.join(runDir, 'agent-report.md'), JSON.stringify({
        verdict: 'Reversible advisory recommendation with dissent preserved',
        evidence: ['The fixed fixture report, not a production architecture judgement'],
        'missing expertise': ['authorization boundaries'],
      }));
      fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'Advisory report settled', assessment: { verdict: 'pass' } }));
    `,
  });
}


test('registered advisory parks on producer expertise and closes only after the owner answers', async () => {
  const tmp = setupTestRepo();

  const loaded = loadWorkflow('architecture-advisory');
  let state = await startWorkflow({
    workflow: loaded,
    repoRoot: tmp,
    cwd: tmp,
  });

  assert.equal(state.status, 'parked');
  assert.equal(state.steps.close.status, 'parked');
  assert.ok(state.questions.find((q) => q.stepId === 'close').question.includes('["authorization boundaries"]'));

  assert.equal(state.steps['framing'].status, 'completed');
  assert.equal(state.steps['shaping'].status, 'completed');
  assert.equal(state.steps['critique'].status, 'completed');
  assert.equal(state.steps['synthesis'].status, 'completed');
  assert.equal(state.steps['explanation'].status, 'completed');

  // Verify statusWorkflow reads state
  const readState = statusWorkflow(state.workflowRunId, { repoRoot: tmp });
  assert.equal(readState.status, 'parked');
  assert.equal(readState.workflowId, 'architecture-advisory');
  const closed = await answerWorkflow(state.workflowRunId, { repoRoot: tmp, cwd: tmp, stepId: 'close', answer: 'Do not bring in the named expertise; keep the limitation explicit.' });
  assert.equal(closed.status, 'completed');
  assert.equal(closed.steps.close.answer, 'Do not bring in the named expertise; keep the limitation explicit.');
});

