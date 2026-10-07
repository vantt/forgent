// test/workflow/architecture-advisory-workflow.test.mjs — Integration tests for Architecture Advisory Workflow (P4 Wave B Phase 3)

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { withProviderFamilies } from '../helpers/provider-families.mjs';
import YAML from 'yaml';

import {
  validateWorkflow,
  startWorkflow,
  statusWorkflow,
  answerWorkflow,
  resumeWorkflow,
  loadWorkflow,
  discoverWorkflows,
} from '../../src/workflow/index.mjs';
import { seedFileLocalBwrapRegistry } from '../runner/confinement-registry-fixture.helper.mjs';

seedFileLocalBwrapRegistry();
// bwrap mounts a tmpfs over /tmp, so confined workers can only see fixtures elsewhere.
import { makeFixtureDir } from '../helpers/fixture-dir.mjs';

const BIN_FGOS = path.resolve('bin/fgos.mjs');

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
      fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Architecture Advisory Report\\nExecution completed with findings.\\n');
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
        'architecture:frame': { prefer: [{ executor: 'test-node' }], rigor: 'standard' },
        'architecture:shape': { prefer: [{ executor: 'test-node' }], rigor: 'standard' },
        'architecture:critique': { prefer: [{ executor: 'test-node' }], rigor: 'standard' },
        'architecture:synthesize': { prefer: [{ executor: 'test-node' }], rigor: 'standard' },
        'architecture:explain': { prefer: [{ executor: 'test-node' }], rigor: 'standard' },
      },
      patterns: {
        defaultRule: { mutatingMinRigor: 'standard' },
        reviewed: { maxRounds: 1, checkersByRigor: { standard: ['reviewer'] } },
      },
    },
  };
  fs.writeFileSync(path.join(fgosDir, 'config.json'), JSON.stringify(withProviderFamilies(cfg), null, 2));

  return tmp;
}

test('architecture-advisory.yaml schema validation & discovery', () => {
  const filePath = path.resolve('core/workflows/architecture-advisory.yaml');
  assert.ok(fs.existsSync(filePath), 'core/workflows/architecture-advisory.yaml must exist');

  const content = fs.readFileSync(filePath, 'utf8');
  const raw = YAML.parse(content);
  const wf = validateWorkflow(raw);

  assert.equal(wf.id, 'architecture-advisory');
  assert.equal(wf.steps.length, 5);

  const stepIds = wf.steps.map((s) => s.id);
  assert.deepEqual(stepIds, ['framing', 'shaping', 'critique', 'synthesis', 'explanation']);

  // Check step dependencies
  assert.deepEqual(wf.steps[0].dependsOn, []);
  assert.deepEqual(wf.steps[1].dependsOn, ['framing']);
  assert.deepEqual(wf.steps[2].dependsOn, ['shaping']);
  assert.deepEqual(wf.steps[3].dependsOn, ['critique']);
  assert.deepEqual(wf.steps[4].dependsOn, ['synthesis']);

  // Check capabilities and patterns
  assert.equal(wf.steps[0].units[0].template.capability, 'architecture:frame');
  assert.equal(wf.steps[0].units[0].template.pattern, 'solo');

  assert.equal(wf.steps[1].units[0].template.capability, 'architecture:shape');
  assert.equal(wf.steps[1].units[0].template.pattern, 'panel');

  assert.equal(wf.steps[2].units[0].template.capability, 'architecture:critique');
  assert.equal(wf.steps[2].units[0].template.pattern, 'reviewed');

  assert.equal(wf.steps[3].units[0].template.capability, 'architecture:synthesize');
  assert.equal(wf.steps[3].units[0].template.pattern, 'solo');

  assert.equal(wf.steps[4].units[0].template.capability, 'architecture:explain');
  assert.equal(wf.steps[4].units[0].template.pattern, 'solo');

  // Check discovery from core directory
  const discovered = discoverWorkflows();
  assert.ok(discovered.has('architecture-advisory'));
  const loaded = loadWorkflow('architecture-advisory');
  assert.equal(loaded.id, 'architecture-advisory');
});

test('runner: executes architecture-advisory workflow end-to-end', async () => {
  const tmp = setupTestRepo();

  const loaded = loadWorkflow('architecture-advisory');
  let state = await startWorkflow({
    workflow: loaded,
    repoRoot: tmp,
    cwd: tmp,
  });

  assert.equal(state.status, 'completed');
  assert.equal(state.outcome, 'pass');

  // Verify all 5 steps completed
  assert.equal(state.steps['framing'].status, 'completed');
  assert.equal(state.steps['shaping'].status, 'completed');
  assert.equal(state.steps['critique'].status, 'completed');
  assert.equal(state.steps['synthesis'].status, 'completed');
  assert.equal(state.steps['explanation'].status, 'completed');

  // Verify statusWorkflow reads state
  const readState = statusWorkflow(state.workflowRunId, { repoRoot: tmp });
  assert.equal(readState.status, 'completed');
  assert.equal(readState.workflowId, 'architecture-advisory');
});

test('CLI: fgos workflow start architecture-advisory and status', () => {
  const tmp = setupTestRepo();

  // Copy core/workflows into tmp if testing isolated packageRoot or use repoRoot with core/workflows
  // Since loader resolves from packageRoot (which defaults to process.cwd() / git root),
  // running fgos from tmp will find core/workflows at the root of forgentX if dir points to tmp.
  const startOut = execFileSync(
    process.execPath,
    [BIN_FGOS, 'workflow', 'start', 'architecture-advisory', '--dir', tmp, '--foreground'],
    { cwd: tmp, encoding: 'utf8' },
  );

  assert.ok(startOut.includes('wf-run-'), 'start should print workflowRunId');
  const match = /"workflowRunId":\s*"([^"]+)"/.exec(startOut);
  assert.ok(match, 'must capture workflowRunId');
  const wfRunId = match[1];

  const statusOut = execFileSync(
    process.execPath,
    [BIN_FGOS, 'workflow', 'status', wfRunId, '--dir', tmp],
    { cwd: tmp, encoding: 'utf8' },
  );

  assert.ok(statusOut.includes(wfRunId), 'status must display run id');
  assert.ok(statusOut.includes('completed') || statusOut.includes('framing'), 'status must display step info');
});
