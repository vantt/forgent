// fgos-gate-approve.test.mjs -- the `gate-approve` verb's CLI-level surface.
// Bộ đồ nghề dùng chung nằm ở ./helpers/fgos-cli-harness.mjs.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addOk, eventLines, run, stateView, tmpCwd } from './helpers/fgos-cli-harness.mjs';

test('gate-approve rejects the retired "planApprove" gate name, exit 4 (validation), no event written (tsk-4vz)', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'gate-approve-plan-retired');
  const before = eventLines(cwd).length;
  const result = run(cwd, ['gate-approve', 'gate-approve-plan-retired', '--gate', 'planApprove', '--actor', 'human', '--verify', 'npm test']);
  assert.equal(result.status, 4);
  assert.match(result.stderr, /planApprove.*retired/);
  assert.equal(eventLines(cwd).length, before, 'no event should be written on a rejected gate name');
});

test('gate-approve still accepts "validateApprove", the live merged gate, exit 0', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'gate-approve-validate-ok');
  const before = eventLines(cwd).length;
  const result = run(cwd, ['gate-approve', 'gate-approve-validate-ok', '--gate', 'validateApprove', '--actor', 'bypass', '--verify', 'npm test']);
  assert.equal(result.status, 0);
  assert.equal(eventLines(cwd).length, before + 1);
  const view = stateView(cwd);
  assert.equal(view.gates['gate-approve-validate-ok'].validateApprove.actor, 'bypass');
});

test('gate-approve still accepts "contextApprove", the live exploring gate, exit 0', () => {
  const cwd = tmpCwd();
  addOk(cwd, 'gate-approve-context-ok');
  const result = run(cwd, ['gate-approve', 'gate-approve-context-ok', '--gate', 'contextApprove', '--actor', 'human', '--verify', 'npm test']);
  assert.equal(result.status, 0);
  const view = stateView(cwd);
  assert.equal(view.gates['gate-approve-context-ok'].contextApprove.actor, 'human');
});
