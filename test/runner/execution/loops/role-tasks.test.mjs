// A seat of a Unit run is told its own task: the unit's objective is wrapped by what that seat is for.

import '../../../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';

import { DEFAULT_ROLE_TASKS, roleUnit } from '../../../../src/runner/execution/loops/role-tasks.mjs';
import { shippedCatalog } from '../../../../src/runner/dispatch/shipped-catalog.mjs';

const unit = Object.freeze({ id: 'u1', capability: 'docs:write', objective: 'Replace the placeholder line in AGENTS.md', writes: ['AGENTS.md'] });

test('a seat with no task gets the very same unit back', () => {
  assert.equal(roleUnit(unit, { seat: 'member-1' }), unit);
  assert.equal(roleUnit(unit, { seat: 'producer' }), unit);
  assert.equal(roleUnit(unit, { seat: 'verifier' }), unit);
});

test('the reviewer is told to review, with the original task quoted and nothing else about the unit changed', () => {
  const out = roleUnit(unit, { seat: 'reviewer' });
  assert.notEqual(out, unit);
  assert.match(out.objective, /reviewer/i);
  assert.match(out.objective, /do not change any file/i);
  assert.ok(out.objective.includes(unit.objective), 'the original objective is part of what the reviewer is told');
  assert.deepEqual({ ...out, objective: unit.objective }, unit, 'only the objective differs');
});

test('red-team and synthesizer have their own tasks, and they differ', () => {
  const tasks = ['reviewer', 'red-team', 'synthesizer'].map((seat) => roleUnit(unit, { seat }).objective);
  assert.equal(new Set(tasks).size, 3);
  assert.match(tasks[2], /each panelist/i);
  for (const t of tasks) assert.ok(t.includes(unit.objective));
});

test('params.roleTasks replaces the default text for a seat, and {objective} stands for the original', () => {
  const out = roleUnit(unit, { seat: 'reviewer', params: { roleTasks: { reviewer: 'Audit only. Task was: {objective}' } } });
  assert.equal(out.objective, `Audit only. Task was: ${unit.objective}`);
});

test('a task for a seat the pattern does not know can be supplied by params', () => {
  const out = roleUnit(unit, { seat: 'verifier', params: { roleTasks: { verifier: 'Run the checks. {objective}' } } });
  assert.equal(out.objective, `Run the checks. ${unit.objective}`);
});

test('a role task without the placeholder still carries the original objective', () => {
  const out = roleUnit(unit, { seat: 'reviewer', params: { roleTasks: { reviewer: 'Audit only.' } } });
  assert.ok(out.objective.startsWith('Audit only.'));
  assert.ok(out.objective.includes(unit.objective));
});

test('kind lets a differently named seat use a default task', () => {
  const out = roleUnit(unit, { seat: 'chairman', kind: 'synthesizer' });
  assert.equal(out.objective, roleUnit(unit, { seat: 'synthesizer' }).objective);
});

test('earlier findings are listed for the producer, so a second round says what to fix', () => {
  const out = roleUnit(unit, { seat: 'producer', findings: ['AGENTS.md line 3 still has the comment marker', 'README untouched but edited'] });
  assert.ok(out.objective.startsWith(unit.objective));
  assert.match(out.objective, /previous round/i);
  assert.match(out.objective, /- AGENTS\.md line 3 still has the comment marker/);
  assert.match(out.objective, /- README untouched but edited/);
});

test('no findings means the producer keeps its unit untouched', () => {
  assert.equal(roleUnit(unit, { seat: 'producer', findings: [] }), unit);
});

test('the default tasks are data: plain strings, frozen', () => {
  assert.ok(Object.isFrozen(DEFAULT_ROLE_TASKS));
  for (const text of Object.values(DEFAULT_ROLE_TASKS)) assert.equal(typeof text, 'string');
});

test('declared choices and the stance request reach a panelist only, never a synthesizer or other seat', () => {
  const measured = { ...unit, stanceOptions: ['incremental', 'full'] };
  const panelist = roleUnit(measured, { seat: 'member-2', kind: 'panelist', stance: true });
  assert.match(panelist.objective, /Declared choices: \["incremental","full"\]/);
  assert.match(panelist.objective, /"stance": \{"choice"/);
  assert.match(panelist.objective, /agent-result\.json/);
  assert.match(panelist.objective, /never changes whether your work passes/);
  assert.ok(panelist.objective.startsWith(unit.objective), 'the question itself is still what the panelist answers');
  // The posture decides, not the label: a differently named voter is asked, a seat named like one is not.
  assert.match(roleUnit(measured, { seat: 'researcher-1', kind: 'panelist', stance: true }).objective, /Declared choices/);
  assert.equal(roleUnit(measured, { seat: 'member-1' }), measured);
  for (const seat of ['synthesizer', 'reviewer', 'red-team', 'producer']) {
    const other = roleUnit(measured, { seat });
    assert.doesNotMatch(other.objective, /Declared choices|stance/i, seat);
  }
  // No declared choices means nothing to ask.
  assert.equal(roleUnit(unit, { seat: 'member-1', kind: 'panelist', stance: true }), unit);
});

test('rfc checkers are briefed on the supplied artifact and the producer report, not the latest commit', () => {
  const shipped = shippedCatalog();
  const params = { roleTasks: shipped.patterns.rfc.defaults.roleTasks };
  const rfcUnit = { id: 'u1', capability: 'advise', objective: 'Red-team the proposal in docs/pricing-v2.md' };
  for (const seat of ['reviewer', 'red-team']) {
    const { objective } = roleUnit(rfcUnit, { seat, params });
    assert.ok(objective.includes(rfcUnit.objective), `${seat} still sees the original task`);
    assert.match(objective, /Context refs/, `${seat} is pointed at the producer report`);
    assert.doesNotMatch(objective, /git log|git show/, `${seat} is not sent to the latest commit`);
    assert.match(objective, /do not change any file/i);
  }
  assert.notEqual(roleUnit(rfcUnit, { seat: 'reviewer', params }).objective, roleUnit(rfcUnit, { seat: 'red-team', params }).objective);
});
