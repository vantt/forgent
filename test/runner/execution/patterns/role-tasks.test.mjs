// A role of a Unit run is told its own task: the unit's objective is wrapped by what that role is for.

import test from 'node:test';
import assert from 'node:assert/strict';

import { DEFAULT_ROLE_TASKS, roleUnit } from '../../../../src/runner/execution/patterns/role-tasks.mjs';

const unit = Object.freeze({ id: 'u1', capability: 'docs:write', objective: 'Replace the placeholder line in AGENTS.md', writes: ['AGENTS.md'] });

test('a role with no task gets the very same unit back', () => {
  assert.equal(roleUnit(unit, { role: 'panelist-1' }), unit);
  assert.equal(roleUnit(unit, { role: 'producer' }), unit);
  assert.equal(roleUnit(unit, { role: 'verifier' }), unit);
});

test('the reviewer is told to review, with the original task quoted and nothing else about the unit changed', () => {
  const out = roleUnit(unit, { role: 'reviewer' });
  assert.notEqual(out, unit);
  assert.match(out.objective, /reviewer/i);
  assert.match(out.objective, /do not change any file/i);
  assert.ok(out.objective.includes(unit.objective), 'the original objective is part of what the reviewer is told');
  assert.deepEqual({ ...out, objective: unit.objective }, unit, 'only the objective differs');
});

test('red-team and synthesizer have their own tasks, and they differ', () => {
  const tasks = ['reviewer', 'red-team', 'synthesizer'].map((role) => roleUnit(unit, { role }).objective);
  assert.equal(new Set(tasks).size, 3);
  assert.match(tasks[2], /each panelist/i);
  for (const t of tasks) assert.ok(t.includes(unit.objective));
});

test('params.roleTasks replaces the default text for a role, and {objective} stands for the original', () => {
  const out = roleUnit(unit, { role: 'reviewer', params: { roleTasks: { reviewer: 'Audit only. Task was: {objective}' } } });
  assert.equal(out.objective, `Audit only. Task was: ${unit.objective}`);
});

test('a task for a role the pattern does not know can be supplied by params', () => {
  const out = roleUnit(unit, { role: 'verifier', params: { roleTasks: { verifier: 'Run the checks. {objective}' } } });
  assert.equal(out.objective, `Run the checks. ${unit.objective}`);
});

test('a role task without the placeholder still carries the original objective', () => {
  const out = roleUnit(unit, { role: 'reviewer', params: { roleTasks: { reviewer: 'Audit only.' } } });
  assert.ok(out.objective.startsWith('Audit only.'));
  assert.ok(out.objective.includes(unit.objective));
});

test('kind lets a differently named role use a default task', () => {
  const out = roleUnit(unit, { role: 'chairman', kind: 'synthesizer' });
  assert.equal(out.objective, roleUnit(unit, { role: 'synthesizer' }).objective);
});

test('earlier findings are listed for the producer, so a second round says what to fix', () => {
  const out = roleUnit(unit, { role: 'producer', findings: ['AGENTS.md line 3 still has the comment marker', 'README untouched but edited'] });
  assert.ok(out.objective.startsWith(unit.objective));
  assert.match(out.objective, /previous round/i);
  assert.match(out.objective, /- AGENTS\.md line 3 still has the comment marker/);
  assert.match(out.objective, /- README untouched but edited/);
});

test('no findings means the producer keeps its unit untouched', () => {
  assert.equal(roleUnit(unit, { role: 'producer', findings: [] }), unit);
});

test('the default tasks are data: plain strings, frozen', () => {
  assert.ok(Object.isFrozen(DEFAULT_ROLE_TASKS));
  for (const text of Object.values(DEFAULT_ROLE_TASKS)) assert.equal(typeof text, 'string');
});
