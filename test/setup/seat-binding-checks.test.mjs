// The two doctor rows of the seat-binding wave: `seat-binding-config` and `seat-binding-drain`.
// The rows are read through the registry, the way `fgos doctor` runs them.

import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { DOCTOR_CHECKS } from '../../src/setup/checks.mjs';
import { acquireUnitControl } from '../../src/runner/execution/unit-control.mjs';
import { createSeatBindingClient } from '../../src/seat-binding/client.mjs';
import { ladderCommentLines } from '../../src/setup/seat-binding-conversion.mjs';

const row = (id) => DOCTOR_CHECKS.find((check) => check.id === id).check;
const mkProject = () => fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-seat-checks-'));
const writeConfig = (dir, config) => {
  fs.mkdirSync(path.join(dir, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(dir, '.fgos', 'config.json'), JSON.stringify(config));
};

// ---- seat-binding-config --------------------------------------------------------------------------

test('the config row fails a project runner that still carries rigorToTier, naming setup and the rollback pair', () => {
  const dir = mkProject();
  writeConfig(dir, { runner: { rigorToTier: { low: 'nano' }, patterns: { seatBinding: { schema: 1 } } } });
  const { passed, message } = row('seat-binding-config')(dir);
  assert.equal(passed, false);
  assert.match(message, /still carries "rigorToTier"/);
  assert.match(message, /fgos setup/);
  assert.match(message, /pre-seat-binding-<time>/);
  assert.match(message, /previous release/);
});

test('the config row fails a project runner with no schema marker, and one whose marker is not the schema this release writes', () => {
  const dir = mkProject();
  writeConfig(dir, { runner: { timeoutMs: 1 } });
  assert.match(row('seat-binding-config')(dir).message, /no runner\.patterns\.seatBinding\.schema/);
  writeConfig(dir, { runner: { patterns: { seatBinding: { schema: 2 } } } });
  const newer = row('seat-binding-config')(dir);
  assert.equal(newer.passed, false);
  assert.match(newer.message, /its schema is 2/);
});

test('the config row passes a converted runner, a project with no runner yet, and reports a $comment that differs from the tier ladder without failing', () => {
  const dir = mkProject();
  writeConfig(dir, {});
  assert.equal(row('seat-binding-config')(dir).passed, true);

  writeConfig(dir, { runner: { patterns: { seatBinding: { schema: 1 } } } });
  assert.equal(row('seat-binding-config')(dir).passed, true);

  const ladder = ladderCommentLines(createSeatBindingClient().tierLadder().definitions);
  writeConfig(dir, { runner: { $comment: ladder, patterns: { seatBinding: { schema: 1 } } } });
  const same = row('seat-binding-config')(dir);
  assert.equal(same.passed, true);
  assert.doesNotMatch(same.message, /differs/);

  writeConfig(dir, { runner: { $comment: ['stale'], patterns: { seatBinding: { schema: 1 } } } });
  const stale = row('seat-binding-config')(dir);
  assert.equal(stale.passed, true);
  assert.match(stale.message, /\$comment differs from the tier ladder/);
});

// ---- seat-binding-drain ---------------------------------------------------------------------------

function writeUnit(dir, unitRunId, record, { summary } = {}) {
  const unitDir = path.join(dir, '.fgos', 'assignments', unitRunId);
  fs.mkdirSync(path.join(unitDir, 'producer', '1', 'runs', '01'), { recursive: true });
  fs.writeFileSync(path.join(unitDir, 'unit.json'), JSON.stringify({ createdAt: new Date().toISOString(), ...record }));
  if (summary) fs.writeFileSync(path.join(unitDir, 'unit-summary.json'), JSON.stringify(summary));
  return unitDir;
}

const heldControllers = [];
test.after(() => { for (const control of heldControllers) control.release(); });
const holdController = (unitDir, unitRunId) => {
  const control = acquireUnitControl(unitDir, unitRunId);
  assert.equal(control.status, 'acquired');
  heldControllers.push(control);
};

test('the drain row fails on a unit run written before seats existed whose controller is alive, listing its path, unit run, age and controller', () => {
  const dir = mkProject();
  const unitDir = writeUnit(dir, 'unit-run-1-aaaa', { execution: { status: 'running' }, bindings: {} });
  holdController(unitDir, 'unit-run-1-aaaa');

  const { passed, message } = row('seat-binding-drain')(dir);

  assert.equal(passed, false);
  assert.match(message, /1 unit run\(s\) written before seats existed still have a controller/);
  assert.ok(message.includes(unitDir));
  assert.match(message, /unit run unit-run-1-aaaa, 0 min old, controller unit-run-1-aaaa:controller:\d+/);
});

test('the drain row fails on a live pre-seat record whatever its execution status, and one with no execution field at all', () => {
  for (const execution of [{ status: 'settled' }, { status: 'pending' }, undefined]) {
    const dir = mkProject();
    const unitDir = writeUnit(dir, 'unit-run-2-bbbb', execution ? { execution } : {});
    holdController(unitDir, 'unit-run-2-bbbb');
    assert.equal(row('seat-binding-drain')(dir).passed, false, JSON.stringify(execution));
  }
});

test('the drain row passes with an info line on pre-seat records nobody drives, naming the refusal each gets and the legacy read path', () => {
  const dir = mkProject();
  writeUnit(dir, 'unit-run-3-awaiting', { execution: { status: 'running' } });
  writeUnit(dir, 'unit-run-4-legacy', {});

  const { passed, message } = row('seat-binding-drain')(dir);

  assert.equal(passed, true);
  assert.match(message, /info: 2 unit run\(s\) written before seats existed have no controller and no summary \(unit-run-3-awaiting; unit-run-4-legacy\)/);
  assert.match(message, /record-predates-seat-binding/);
  assert.match(message, /legacy read path/);
});

test('the drain row is silent about seat-keyed records, however alive, and about settled pre-seat records', () => {
  const dir = mkProject();
  const seatKeyed = writeUnit(dir, 'unit-run-5-new', { seatSchema: 1, execution: { status: 'running' } });
  holdController(seatKeyed, 'unit-run-5-new');
  writeUnit(dir, 'unit-run-6-settled', { execution: { status: 'settled' } }, { summary: { outcome: 'pass' } });
  writeUnit(dir, 'unit-run-7-failed', {}, { summary: { outcome: 'failed' } });

  assert.deepEqual(row('seat-binding-drain')(dir), { passed: true, message: 'no pre-seat unit run has a live controller' });
});

test('the drain row lists open workflow runs as information, a parked gate included, and a completed run not at all', () => {
  const dir = mkProject();
  const writeRun = (id, events) => {
    const runDir = path.join(dir, '.fgos', 'workflow-runs', id);
    fs.mkdirSync(runDir, { recursive: true });
    fs.writeFileSync(path.join(runDir, 'events.jsonl'), `${events.map((event, i) => JSON.stringify({ seq: i + 1, ts: '2026-10-21T00:00:00.000Z', ...event })).join('\n')}\n`);
  };
  const start = { type: 'workflow.start', payload: { workflowId: 'wf', workflowRunId: 'x', workflow: { steps: [{ id: 'close' }] } } };
  writeRun('wf-run-parked', [start, { type: 'gate.park', payload: { stepId: 'close', question: 'ok?' } }]);
  writeRun('wf-run-running', [start]);
  writeRun('wf-run-done', [start, { type: 'workflow.complete', payload: { outcome: 'pass' } }]);

  const { passed, message } = row('seat-binding-drain')(dir);

  assert.equal(passed, true);
  assert.match(message, /info: 2 workflow run\(s\) are still open \(wf-run-parked parked; wf-run-running running\)/);
  assert.doesNotMatch(message, /wf-run-done/);
});

test('the drain row reads records only: it runs on a workspace with no runner config and on one with no assignments', () => {
  const dir = mkProject();
  assert.deepEqual(row('seat-binding-drain')(dir), { passed: true, message: 'no pre-seat unit run has a live controller' });
  writeConfig(dir, { runner: { rigorToTier: { low: 'nano' } } });
  assert.equal(row('seat-binding-drain')(dir).passed, true);
});
