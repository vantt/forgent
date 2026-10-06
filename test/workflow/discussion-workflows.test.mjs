// test/workflow/discussion-workflows.test.mjs — Integration tests for discussion Workflows (P4 Wave B Phase 5)

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
  const tmp = makeFixtureDir('fgos-disc-wf-test-');
  execFileSync('git', ['init', '-b', 'main'], { cwd: tmp, stdio: 'ignore' });
  execFileSync('git', ['config', 'user.name', 'Workflow Test'], { cwd: tmp, stdio: 'ignore' });
  execFileSync('git', ['config', 'user.email', 'wf@test.local'], { cwd: tmp, stdio: 'ignore' });

  fs.writeFileSync(path.join(tmp, 'README.md'), '# Discussion Workflows Test\n');
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
      fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Discussion Report\\nCompleted finding.\\n');
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
        'delphi:propose': { prefer: [{ executor: 'test-node' }], rigor: 'standard' },
        'delphi:synthesize': { prefer: [{ executor: 'test-node' }], rigor: 'standard' },
        'nominal-group:generate': { prefer: [{ executor: 'test-node' }], rigor: 'standard' },
        'nominal-group:share': { prefer: [{ executor: 'test-node' }], rigor: 'standard' },
        'nominal-group:vote': { prefer: [{ executor: 'test-node' }], rigor: 'standard' },
        'nominal-group:rank': { prefer: [{ executor: 'test-node' }], rigor: 'standard' },
        'group-cognition:explore': { prefer: [{ executor: 'test-node' }], rigor: 'standard' },
        'group-cognition:critique': { prefer: [{ executor: 'test-node' }], rigor: 'standard' },
        'group-cognition:synthesize': { prefer: [{ executor: 'test-node' }], rigor: 'standard' },
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

test('delphi.yaml schema validation & discovery', () => {
  const filePath = path.resolve('core/workflows/delphi.yaml');
  assert.ok(fs.existsSync(filePath), 'core/workflows/delphi.yaml must exist');

  const content = fs.readFileSync(filePath, 'utf8');
  const raw = YAML.parse(content);
  const wf = validateWorkflow(raw);

  assert.equal(wf.id, 'delphi');
  assert.equal(wf.steps.length, 4);

  const stepIds = wf.steps.map((s) => s.id);
  assert.deepEqual(stepIds, [
    'blind-proposals',
    'feedback-synthesis',
    'second-round',
    'final-consensus',
  ]);

  // Check step dependencies
  assert.deepEqual(wf.steps[0].dependsOn, []);
  assert.deepEqual(wf.steps[1].dependsOn, ['blind-proposals']);
  assert.deepEqual(wf.steps[2].dependsOn, ['feedback-synthesis']);
  assert.deepEqual(wf.steps[3].dependsOn, ['second-round']);

  // Check capabilities and patterns
  assert.equal(wf.steps[0].units[0].template.capability, 'delphi:propose');
  assert.equal(wf.steps[0].units[0].template.pattern, 'panel');

  assert.equal(wf.steps[1].units[0].template.capability, 'delphi:synthesize');
  assert.equal(wf.steps[1].units[0].template.pattern, 'solo');

  assert.equal(wf.steps[2].units[0].template.capability, 'delphi:propose');
  assert.equal(wf.steps[2].units[0].template.pattern, 'panel');

  assert.equal(wf.steps[3].units[0].template.capability, 'delphi:synthesize');
  assert.equal(wf.steps[3].units[0].template.pattern, 'solo');

  // Round 2 hands each panelist the group summary and its own round 1 proposal only.
  assert.deepEqual(wf.steps[2].units[0].template.inputs, [
    { step: 'feedback-synthesis', label: 'group summary' },
    { step: 'blind-proposals', sameSeat: true, label: 'your own previous proposal' },
  ]);
  assert.equal(wf.steps[3].units[0].template.inputs, undefined);

  // Check discovery from core directory
  const discovered = discoverWorkflows();
  assert.ok(discovered.has('delphi'));
  const loaded = loadWorkflow('delphi');
  assert.equal(loaded.id, 'delphi');
});

test('nominal-group.yaml schema validation & discovery', () => {
  const filePath = path.resolve('core/workflows/nominal-group.yaml');
  assert.ok(fs.existsSync(filePath), 'core/workflows/nominal-group.yaml must exist');

  const content = fs.readFileSync(filePath, 'utf8');
  const raw = YAML.parse(content);
  const wf = validateWorkflow(raw);

  assert.equal(wf.id, 'nominal-group');
  assert.equal(wf.steps.length, 4);

  const stepIds = wf.steps.map((s) => s.id);
  assert.deepEqual(stepIds, [
    'silent-generation',
    'round-robin-sharing',
    'voting-ranking',
    'final-ranking',
  ]);

  // Check step dependencies
  assert.deepEqual(wf.steps[0].dependsOn, []);
  assert.deepEqual(wf.steps[1].dependsOn, ['silent-generation']);
  assert.deepEqual(wf.steps[2].dependsOn, ['round-robin-sharing']);
  assert.deepEqual(wf.steps[3].dependsOn, ['voting-ranking']);

  // Step 1: silent-generation (panel)
  assert.equal(wf.steps[0].units[0].template.capability, 'nominal-group:generate');
  assert.equal(wf.steps[0].units[0].template.pattern, 'panel');

  // Step 2: round-robin-sharing (synthesizer)
  assert.equal(wf.steps[1].units[0].template.capability, 'nominal-group:share');
  assert.equal(wf.steps[1].units[0].template.pattern, 'solo');

  // Step 3: voting-ranking (gate: human or evaluation)
  assert.ok(wf.steps[2].gate, 'voting-ranking step must declare a gate');
  assert.equal(wf.steps[2].gate.kind, 'human');

  // Step 4: final-ranking (synthesizer)
  assert.equal(wf.steps[3].units[0].template.capability, 'nominal-group:rank');
  assert.equal(wf.steps[3].units[0].template.pattern, 'solo');

  // Check discovery from core directory
  const discovered = discoverWorkflows();
  assert.ok(discovered.has('nominal-group'));
  const loaded = loadWorkflow('nominal-group');
  assert.equal(loaded.id, 'nominal-group');
});

test('group-cognition.yaml schema validation & discovery', () => {
  const filePath = path.resolve('core/workflows/group-cognition.yaml');
  assert.ok(fs.existsSync(filePath), 'core/workflows/group-cognition.yaml must exist');

  const content = fs.readFileSync(filePath, 'utf8');
  const raw = YAML.parse(content);
  const wf = validateWorkflow(raw);

  assert.equal(wf.id, 'group-cognition');
  assert.equal(wf.steps.length, 3);

  const stepIds = wf.steps.map((s) => s.id);
  assert.deepEqual(stepIds, [
    'sense-making',
    'dialectical-inquiry',
    'action-synthesis',
  ]);

  // Check step dependencies
  assert.deepEqual(wf.steps[0].dependsOn, []);
  assert.deepEqual(wf.steps[1].dependsOn, ['sense-making']);
  assert.deepEqual(wf.steps[2].dependsOn, ['dialectical-inquiry']);

  // Step 1: sense-making (researcher panel)
  assert.equal(wf.steps[0].units[0].template.capability, 'group-cognition:explore');
  assert.equal(wf.steps[0].units[0].template.pattern, 'panel');

  // Step 2: dialectical-inquiry (reviewed with red-team)
  assert.equal(wf.steps[1].units[0].template.capability, 'group-cognition:critique');
  assert.equal(wf.steps[1].units[0].template.pattern, 'reviewed');

  // Step 3: action-synthesis (synthesizer)
  assert.equal(wf.steps[2].units[0].template.capability, 'group-cognition:synthesize');
  assert.equal(wf.steps[2].units[0].template.pattern, 'solo');

  // Check discovery from core directory
  const discovered = discoverWorkflows();
  assert.ok(discovered.has('group-cognition'));
  const loaded = loadWorkflow('group-cognition');
  assert.equal(loaded.id, 'group-cognition');
});

test('runner: executes delphi workflow end-to-end', async () => {
  const tmp = setupTestRepo();

  const loaded = loadWorkflow('delphi');
  const state = await startWorkflow({
    workflow: loaded,
    repoRoot: tmp,
    cwd: tmp,
  });

  assert.equal(state.status, 'completed');
  assert.equal(state.outcome, 'pass');

  // Verify all 4 steps completed
  assert.equal(state.steps['blind-proposals'].status, 'completed');
  assert.equal(state.steps['feedback-synthesis'].status, 'completed');
  assert.equal(state.steps['second-round'].status, 'completed');
  assert.equal(state.steps['final-consensus'].status, 'completed');

  const readState = statusWorkflow(state.workflowRunId, { repoRoot: tmp });
  assert.equal(readState.status, 'completed');
  assert.equal(readState.workflowId, 'delphi');
});

test('runner: executes nominal-group workflow with human gate', async () => {
  const tmp = setupTestRepo();

  const loaded = loadWorkflow('nominal-group');
  let state = await startWorkflow({
    workflow: loaded,
    repoRoot: tmp,
    cwd: tmp,
  });

  // Steps before human gate should complete, and runner should park at voting-ranking!
  assert.equal(state.status, 'parked');
  assert.equal(state.questions.length, 1);
  assert.equal(state.questions[0].stepId, 'voting-ranking');
  assert.equal(state.steps['silent-generation'].status, 'completed');
  assert.equal(state.steps['round-robin-sharing'].status, 'completed');

  // Answer human gate
  state = await answerWorkflow(state.workflowRunId, {
    stepId: 'voting-ranking',
    answer: 'Rankings approved: Option A (1), Option B (2), Option C (3)',
    repoRoot: tmp,
    cwd: tmp,
  });

  // After gate answered, workflow should complete final-ranking
  assert.equal(state.status, 'completed');
  assert.equal(state.outcome, 'pass');
  assert.equal(state.steps['voting-ranking'].status, 'completed');
  assert.equal(state.steps['final-ranking'].status, 'completed');
});

test('runner: executes group-cognition workflow end-to-end', async () => {
  const tmp = setupTestRepo();

  const loaded = loadWorkflow('group-cognition');
  const state = await startWorkflow({
    workflow: loaded,
    repoRoot: tmp,
    cwd: tmp,
  });

  assert.equal(state.status, 'completed');
  assert.equal(state.outcome, 'pass');

  // Verify all 3 steps completed
  assert.equal(state.steps['sense-making'].status, 'completed');
  assert.equal(state.steps['dialectical-inquiry'].status, 'completed');
  assert.equal(state.steps['action-synthesis'].status, 'completed');

  const readState = statusWorkflow(state.workflowRunId, { repoRoot: tmp });
  assert.equal(readState.status, 'completed');
  assert.equal(readState.workflowId, 'group-cognition');
});

test('CLI: fgos workflow start and status for discussion workflows', () => {
  const tmp = setupTestRepo();

  // Test delphi CLI
  const startDelphi = execFileSync(
    process.execPath,
    [BIN_FGOS, 'workflow', 'start', 'delphi', '--dir', tmp, '--foreground'],
    { cwd: tmp, encoding: 'utf8' },
  );
  assert.ok(startDelphi.includes('wf-run-'), 'start should print workflowRunId');
  const matchDelphi = /"workflowRunId":\s*"([^"]+)"/.exec(startDelphi);
  assert.ok(matchDelphi, 'must capture workflowRunId');

  const statusDelphi = execFileSync(
    process.execPath,
    [BIN_FGOS, 'workflow', 'status', matchDelphi[1], '--dir', tmp],
    { cwd: tmp, encoding: 'utf8' },
  );
  assert.ok(statusDelphi.includes('completed'), 'delphi status should show completed');

  // Test nominal-group CLI (parks at human gate)
  const startNominal = execFileSync(
    process.execPath,
    [BIN_FGOS, 'workflow', 'start', 'nominal-group', '--dir', tmp, '--foreground'],
    { cwd: tmp, encoding: 'utf8' },
  );
  const matchNominal = /"workflowRunId":\s*"([^"]+)"/.exec(startNominal);
  assert.ok(matchNominal, 'must capture nominal workflowRunId');

  const statusNominal = execFileSync(
    process.execPath,
    [BIN_FGOS, 'workflow', 'status', matchNominal[1], '--dir', tmp],
    { cwd: tmp, encoding: 'utf8' },
  );
  assert.ok(statusNominal.includes('parked'), 'nominal-group status should show parked');

  // Answer nominal-group gate via CLI
  const answerNominal = execFileSync(
    process.execPath,
    [BIN_FGOS, 'workflow', 'answer', matchNominal[1], '--step', 'voting-ranking', '--answer', 'Priority 1,2,3', '--dir', tmp, '--foreground'],
    { cwd: tmp, encoding: 'utf8' },
  );
  assert.ok(answerNominal.includes('completed'), 'workflow answer should resume and complete');
});

test('skills: fgos-panel and fgos-group-thinking route to named discussion workflows', () => {
  const panelSkill = fs.readFileSync(path.resolve('core/skills/fgos-panel/SKILL.md'), 'utf8');
  assert.ok(panelSkill.includes('delphi'), 'fgos-panel must reference delphi');
  assert.ok(panelSkill.includes('nominal-group'), 'fgos-panel must reference nominal-group');
  assert.ok(panelSkill.includes('group-cognition'), 'fgos-panel must reference group-cognition');
  assert.ok(!panelSkill.includes('core.coordination-protocol.deliberation-delphi-chain'), 'must not route to old protocol id');
  assert.ok(!panelSkill.includes('core.coordination-protocol.deliberation-nominal-group-chain'), 'must not route to old protocol id');

  const groupThinkingSkill = fs.readFileSync(path.resolve('core/skills/fgos-group-thinking/SKILL.md'), 'utf8');
  assert.ok(groupThinkingSkill.includes('delphi'), 'fgos-group-thinking must reference delphi');
  assert.ok(groupThinkingSkill.includes('nominal-group'), 'fgos-group-thinking must reference nominal-group');
  assert.ok(groupThinkingSkill.includes('group-cognition'), 'fgos-group-thinking must reference group-cognition');
  assert.ok(groupThinkingSkill.includes('fgos workflow start'), 'must reference fgos workflow start');
});

test('the independent panel steps of the council-like workflows run blind and nothing else does', () => {
  const blindUnits = (id) =>
    loadWorkflow(id).steps.flatMap((s) => s.units.filter((u) => u.template.blind === true).map((u) => u.id));
  assert.deepEqual(blindUnits('delphi'), ['propose-round-1', 'propose-round-2']);
  assert.deepEqual(blindUnits('nominal-group'), ['generate-ideas']);
  assert.deepEqual(blindUnits('group-cognition'), ['sense-making-panel']);
  assert.deepEqual(blindUnits('architecture-advisory'), ['shape-proposals']);
  assert.deepEqual(blindUnits('business-discussion'), ['explore-perspectives']);
});
