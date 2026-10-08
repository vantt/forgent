// test/workflow/architecture-advisory-workflow.test.mjs — Integration tests for Architecture Advisory Workflow (P4 Wave B Phase 3)

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { withProviderFamilies } from '../helpers/provider-families.mjs';

import {
  startWorkflow,
  statusWorkflow,
  answerWorkflow,
  loadWorkflow,
} from '../../src/workflow/index.mjs';
import { seedFileLocalBwrapRegistry } from '../runner/confinement-registry-fixture.helper.mjs';

seedFileLocalBwrapRegistry();
// bwrap mounts a tmpfs over /tmp, so confined workers can only see fixtures elsewhere.
import { makeFixtureDir } from '../helpers/fixture-dir.mjs';


function setupTestRepo() {
  const tmp = makeFixtureDir('fgos-arch-wf-test-');
  execFileSync('git', ['init', '-b', 'main'], { cwd: tmp, stdio: 'ignore' });
  execFileSync('git', ['config', 'user.name', 'Workflow Test'], { cwd: tmp, stdio: 'ignore' });
  execFileSync('git', ['config', 'user.email', 'wf@test.local'], { cwd: tmp, stdio: 'ignore' });

  fs.writeFileSync(path.join(tmp, 'README.md'), '# Architecture Advisory Workflow Test\n');
  execFileSync('git', ['add', 'README.md'], { cwd: tmp, stdio: 'ignore' });
  execFileSync('git', ['commit', '-m', 'initial commit'], { cwd: tmp, stdio: 'ignore' });

  // Create fake echo worker that writes valid agent-result.json and agent-report.md
  const echoScript = path.join(tmp, 'echo-worker.mjs');
  fs.writeFileSync(
    echoScript,
    `
    import fs from 'node:fs';
    import path from 'node:path';
    const prompt = process.argv.slice(2).join(' ');
    const match = /Write structured JSON to (\\S+agent-result\\.json)/.exec(prompt);
    if (match) {
      const runDir = (() => { const d = path.dirname(match[1]); const o = path.join(d, 'worker-output', 'outbox'); return fs.existsSync(o) ? o : d; })();
      fs.mkdirSync(runDir, { recursive: true });
      fs.writeFileSync(path.join(runDir, 'agent-report.md'), JSON.stringify({
        verdict: 'Reversible advisory recommendation with dissent preserved',
        evidence: ['The fixed fixture report, not a production architecture judgement'],
        'missing expertise': ['authorization boundaries'],
      }));
      fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'Advisory report settled', assessment: { verdict: 'pass' } }));
    }
    `,
  );

  const fgosDir = path.join(tmp, '.fgos');
  fs.mkdirSync(fgosDir, { recursive: true });

  const cfg = {
    runner: {
      defaultExecutor: 'test-node',
      rigorToTier: { low: 'nano', standard: 'standard', high: 'flagship', critical: 'frontier' },
      modelPolicies: { node: { standard: 'node-std', flagship: 'node-high' } },
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
        'architecture:frame': { prefer: [{ executor: 'test-node' }], rigor: 'standard' },
        'architecture:shape': { prefer: [{ executor: 'test-node' }], rigor: 'standard' },
        'architecture:critique': { prefer: [{ executor: 'test-node' }], rigor: 'standard' },
        'architecture:synthesize': { prefer: [{ executor: 'test-node' }], rigor: 'standard' },
        'architecture:explain': { prefer: [{ executor: 'test-node' }], rigor: 'standard' },
      },
      patterns: {
        defaultRule: { mutatingMinRigor: 'standard' },
        reviewed: { maxRounds: 1, checkersByRigor: { standard: ['reviewer'], high: ['reviewer', 'red-team'] } },
      },
    },
  };
  fs.writeFileSync(path.join(fgosDir, 'config.json'), JSON.stringify(withProviderFamilies(cfg), null, 2));

  return tmp;
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

