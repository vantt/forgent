// test/workflow/discussion-workflows.test.mjs — Integration tests for discussion Workflows (P4 Wave B Phase 5)

import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { parseYaml } from '../../src/util/yaml.mjs';

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
import { setupWorkflowFixtureRepo } from '../helpers/workflow-fixture-repo.mjs';

seedFileLocalBwrapRegistry();

const BIN_FGOS = path.resolve('bin/fgos.mjs');

function setupTestRepo() {
  return setupWorkflowFixtureRepo({
    prefix: 'fgos-disc-wf-test-',
    readme: '# Discussion Workflows Test',
    gitName: 'Workflow Test',
    capabilities: [
      'delphi:propose', 'delphi:synthesize',
      'nominal-group:generate', 'nominal-group:share', 'nominal-group:vote', 'nominal-group:rank',
      'group-cognition:explore', 'group-cognition:critique', 'group-cognition:synthesize',
    ],
    workerBody: `
      fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Discussion Report\\nCompleted finding.\\n');
      fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'Done' }));
    `,
  });
}

test('delphi.yaml schema validation & discovery', () => {
  const filePath = path.resolve('core/workflows/delphi.yaml');
  assert.ok(fs.existsSync(filePath), 'core/workflows/delphi.yaml must exist');

  const content = fs.readFileSync(filePath, 'utf8');
  const raw = parseYaml(content);
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
  const raw = parseYaml(content);
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
  const raw = parseYaml(content);
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

  // Step 2: dialectical-inquiry (two opposed sides ruled by an independent judge)
  assert.equal(wf.steps[1].units[0].template.capability, 'group-cognition:critique');
  assert.equal(wf.steps[1].units[0].template.pattern, 'debate');

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

test('skills: fgos-advise and fgos-group-thinking route to named discussion workflows', () => {
  const panelSkill = fs.readFileSync(path.resolve('core/skills/fgos-advise/SKILL.md'), 'utf8');
  for (const id of ['delphi', 'nominal-group', 'group-cognition', 'council-lite', 'business-discussion']) {
    assert.ok(panelSkill.includes(id), `fgos-advise must reference ${id}`);
  }
  assert.ok(panelSkill.includes('references/request-kinds-and-routes.md'), 'fgos-advise must link its route reference');
  assert.ok(fs.existsSync(path.resolve('core/skills/fgos-advise/references/request-kinds-and-routes.md')), 'route reference must exist');
  assert.ok(!fs.existsSync(path.resolve('core/skills/fgos-panel')), 'the retired fgos-panel skill must not return');
  assert.ok(!panelSkill.includes('core.coordination-protocol.deliberation-delphi-chain'), 'must not route to old protocol id');
  assert.ok(!panelSkill.includes('core.coordination-protocol.deliberation-nominal-group-chain'), 'must not route to old protocol id');

  const groupThinkingSkill = fs.readFileSync(path.resolve('core/skills/fgos-group-thinking/SKILL.md'), 'utf8');
  assert.ok(groupThinkingSkill.includes('delphi'), 'fgos-group-thinking must reference delphi');
  assert.ok(groupThinkingSkill.includes('nominal-group'), 'fgos-group-thinking must reference nominal-group');
  assert.ok(groupThinkingSkill.includes('group-cognition'), 'fgos-group-thinking must reference group-cognition');
  assert.ok(groupThinkingSkill.includes('council-lite'), 'fgos-group-thinking must reference council-lite');
  assert.ok(groupThinkingSkill.includes('business-discussion'), 'fgos-group-thinking must reference business-discussion');
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

test('critique checkers of business-discussion read the supplied artifact, not the latest commit', () => {
  const critiqueParams = (id, unitId) =>
    loadWorkflow(id).steps.flatMap((s) => s.units).find((u) => u.id === unitId).template.params;
  for (const [id, unitId] of [['business-discussion', 'challenge-assumptions']]) {
    const { roleTasks } = critiqueParams(id, unitId);
    for (const role of ['reviewer', 'red-team']) {
      const text = roleTasks[role];
      assert.match(text, /Context refs/, `${id} ${role} must point at Context refs`);
      assert.match(text, /artifact the task names/, `${id} ${role} must point at the supplied artifact`);
      assert.match(text, /Do not look at git history unless the task names a commit/, `${id} ${role} must not default to git log`);
      assert.ok(text.includes('{objective}'), `${id} ${role} must carry the unit objective`);
    }
  }
});
