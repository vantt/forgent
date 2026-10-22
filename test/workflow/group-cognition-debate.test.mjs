import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { loadWorkflow, startWorkflow } from '../../src/workflow/index.mjs';
import { setupWorkflowFixtureRepo } from '../helpers/workflow-fixture-repo.mjs';
import { seedFileLocalBwrapRegistry } from '../runner/confinement-registry-fixture.helper.mjs';
import { writeProjectConfig } from '../helpers/config-fixture.mjs';

seedFileLocalBwrapRegistry();

function setupRepo() {
  return setupWorkflowFixtureRepo({
    prefix: 'fgos-gc-debate-',
    readme: '# Group cognition debate',
    gitName: 'Debate Test',
    capabilities: ['group-cognition:explore', 'group-cognition:critique', 'group-cognition:synthesize'],
    workerBody: `
      const role = prompt.includes('judge of a debate') ? 'judge'
        : prompt.includes('answer the other side') ? 'thesis-rebuttal'
        : prompt.includes('answer the original position') ? 'antithesis-rebuttal'
        : prompt.includes('argue the opposing side') ? 'antithesis'
        : prompt.includes('argue one side') ? 'thesis' : 'other';
      fs.writeFileSync(path.join(runDir, 'agent-report.md'), 'ROLE-REPORT ' + role + '\\n');
      fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'said ' + role }));
    `,
  });
}

/** Keep only the first `count` executors in every capability's pool, so the pool has that many families. */
function limitFamilies(root, count) {
  const file = path.join(root, '.fgos', 'config.json');
  const cfg = JSON.parse(fs.readFileSync(file, 'utf8'));
  for (const capability of Object.values(cfg.runner.capabilities)) capability.prefer = capability.prefer.slice(0, count);
  writeProjectConfig(root, cfg);
}

const debateUnit = (state) => state.steps['dialectical-inquiry'].units['dialectical-critique'];
const familyOf = (root, result) => {
  const cfg = JSON.parse(fs.readFileSync(path.join(root, '.fgos', 'config.json'), 'utf8'));
  return cfg.runner.executors[result.runResult.executorId].providerModel;
};

test('group-cognition debate step: both sides argue, answer each other, and an independent judge rules for the synthesis', async () => {
  const root = setupRepo();
  const state = await startWorkflow({ workflow: loadWorkflow('group-cognition'), repoRoot: root, cwd: root });

  assert.equal(state.status, 'completed');
  const unit = debateUnit(state);
  assert.equal(unit.outcome, 'pass');
  const seats = unit.results.map((r) => `${r.seat}/${r.round ?? 1}`).sort();
  assert.deepEqual(seats, ['antithesis/1', 'antithesis/2', 'judge/1', 'thesis/1', 'thesis/2']);

  const families = (role) => new Set(unit.results.filter((r) => r.seat === role).map((r) => familyOf(root, r)));
  const [judgeFamily] = families('judge');
  assert.ok(!families('thesis').has(judgeFamily), 'the judge differs in family from the thesis side');
  assert.ok(!families('antithesis').has(judgeFamily), 'the judge differs in family from the antithesis side');

  const assignment = (stepUnit, role, round = 1) => JSON.parse(fs.readFileSync(path.join(root, '.fgos', 'assignments',
    stepUnit.unitRunId, role, String(round), 'assignment.json'), 'utf8'));
  const text = (refs) => refs.map((ref) => fs.readFileSync(ref, 'utf8')).join('\n');

  const rebuttal = text(assignment(unit, 'thesis', 2).contextRefs.filter((ref) => ref.startsWith(root) || path.isAbsolute(ref)).filter((ref) => ref.includes(unit.unitRunId)));
  assert.match(rebuttal, /ROLE-REPORT antithesis/, 'the thesis rebuttal reads the antithesis argument');
  assert.doesNotMatch(rebuttal, /ROLE-REPORT thesis/, 'and nothing of its own');

  const ruling = text(assignment(unit, 'judge').contextRefs.filter((ref) => ref.includes(unit.unitRunId)));
  assert.match(ruling, /ROLE-REPORT thesis/);
  assert.match(ruling, /ROLE-REPORT antithesis/);

  const synthesis = state.steps['action-synthesis'].units['synthesize-action'];
  const judgeRefs = assignment(synthesis, 'producer').contextRefs.filter((ref) => ref.includes(`/${unit.unitRunId}/judge/`));
  assert.ok(judgeRefs.length > 0, 'the synthesis receives the judge ruling');
  assert.match(text(judgeRefs), /ROLE-REPORT judge/);
});

test('group-cognition debate step: a pool of two families cannot seat an independent judge and is refused by name', async () => {
  const root = setupRepo();
  limitFamilies(root, 2);
  const state = await startWorkflow({ workflow: loadWorkflow('group-cognition'), repoRoot: root, cwd: root });

  const unit = debateUnit(state);
  assert.notEqual(state.status, 'completed');
  assert.equal(unit.outcome, 'policy-refusal');
  const judge = unit.results.find((r) => r.seat === 'judge');
  assert.equal(judge.refused?.reason ?? judge.runResult?.refused?.reason, 'independence-unsatisfiable');
  assert.equal(state.steps['action-synthesis'].units['synthesize-action'], undefined, 'no synthesis runs on an unruled debate');
});
