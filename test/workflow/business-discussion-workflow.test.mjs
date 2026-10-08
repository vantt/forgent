// test/workflow/business-discussion-workflow.test.mjs — Acceptance tests for business-discussion workflow (P4 Phase 4)

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { withProviderFamilies } from '../helpers/provider-families.mjs';

import { loadWorkflow } from '../../src/workflow/loader.mjs';
import { startWorkflow, answerWorkflow } from '../../src/workflow/runner.mjs';
import { seedFileLocalBwrapRegistry } from '../runner/confinement-registry-fixture.helper.mjs';

seedFileLocalBwrapRegistry();
// bwrap mounts a tmpfs over /tmp, so confined workers can only see fixtures elsewhere.
import { makeFixtureDir } from '../helpers/fixture-dir.mjs';

const BIN_FGOS = path.resolve('bin/fgos.mjs');

function setupTestRepo() {
  const tmp = makeFixtureDir('fgos-biz-wf-test-');
  execFileSync('git', ['init', '-b', 'main'], { cwd: tmp, stdio: 'ignore' });
  execFileSync('git', ['config', 'user.name', 'Biz Test'], { cwd: tmp, stdio: 'ignore' });
  execFileSync('git', ['config', 'user.email', 'biz@test.local'], { cwd: tmp, stdio: 'ignore' });

  fs.writeFileSync(path.join(tmp, 'README.md'), '# Biz Workflow Test\n');
  execFileSync('git', ['add', 'README.md'], { cwd: tmp, stdio: 'ignore' });
  execFileSync('git', ['commit', '-m', 'initial commit'], { cwd: tmp, stdio: 'ignore' });

  // Echo worker script that simulates substantive responses
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
      fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Strategic Report\\nComprehensive strategic business analysis completed with clear market viability and financial risk assessments.\\n');
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
          description: 'Test executor',
          allowCrossProvider: true,
          command: process.execPath,
          args: [echoScript, '{prompt}'],
          providerModel: 'node',
          invocations: [{ id: 'cli-default', via: 'cli', adapter: 'cli-spawn', confinement: { backend: 'bwrap' }, command: process.execPath, args: [echoScript, '{prompt}'] }],
        },
      },
      capabilities: {
        'business:frame': { prefer: [{ executor: 'test-node' }], rigor: 'standard' },
        'business:perspectives': { prefer: [{ executor: 'test-node' }], rigor: 'standard' },
        'business:critique': { prefer: [{ executor: 'test-node' }], rigor: 'standard' },
        'business:synthesize': { prefer: [{ executor: 'test-node' }], rigor: 'standard' },
        'business:plan': { prefer: [{ executor: 'test-node' }], rigor: 'standard' },
      },
      patterns: {
        defaultRule: { mutatingMinRigor: 'standard' },
        reviewed: { maxRounds: 2, checkersByRigor: { standard: ['reviewer'] } },
      },
    },
  };
  fs.writeFileSync(path.join(fgosDir, 'config.json'), JSON.stringify(withProviderFamilies(cfg), null, 2));

  return tmp;
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
