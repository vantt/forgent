// test/runner/execution/unit-run-record.test.mjs — owning proof of the Unit-run record port: what a Unit run's
// directory says (exists, settled, controller, worktree, resumable) and why one may or may not be removed

import '../../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { UNIT_RUN_RECORD_CONTRACT, judgeUnitRun, removeUnitRun, unitRunFacts } from '../../../src/runner/execution/unit-run-record.mjs';
import { releasedUnitRunSettle, UNIT_RUN_RESULT_CONTRACT } from '../../../src/runner/execution/case-admission-port.mjs';
import { acquireUnitControl } from '../../../src/runner/execution/unit-control.mjs';
import { acquireDispatchCwdLock } from '../../../src/run-supervisor/cwd-lock.mjs';
import { makeFixtureDir } from '../../helpers/fixture-dir.mjs';

const CASE = 'case-1';

function fixture() {
  const root = makeFixtureDir('fgos-unit-record-');
  const fgosDir = path.join(root, '.fgos');
  fs.mkdirSync(path.join(fgosDir, 'assignments'), { recursive: true });
  return { root, fgosDir };
}

/** A Unit run directory: a record (unless `record` is false), and a summary unless it is meant to be unsettled. */
function plant(fgosDir, unitRunId, { record = {}, summary = { outcome: 'pass' } } = {}) {
  const dir = path.join(fgosDir, 'assignments', unitRunId);
  fs.mkdirSync(path.join(dir, 'outbox'), { recursive: true });
  if (record !== false) fs.writeFileSync(path.join(dir, 'unit.json'), JSON.stringify({ workflow: { caseId: CASE }, ...record }));
  if (summary) fs.writeFileSync(path.join(dir, 'unit-summary.json'), JSON.stringify(summary));
  return dir;
}

test('facts of a Unit run say whether its record exists, is settled, has a controller and can be resumed', () => {
  const { root, fgosDir } = fixture();
  const worktree = path.join(root, 'wt');
  fs.mkdirSync(worktree);
  plant(fgosDir, 'u-open', { record: { execution: { status: 'running' }, worktree, writeScope: ['src/a'] } });
  plant(fgosDir, 'u-settled', { record: { execution: { status: 'settled' }, worktree: path.join(root, 'gone') } });
  plant(fgosDir, 'u-garbled', { record: false });
  fs.writeFileSync(path.join(fgosDir, 'assignments', 'u-garbled', 'unit.json'), '{"execution": ');

  assert.deepEqual(unitRunFacts(fgosDir, 'u-open'), {
    contract: UNIT_RUN_RECORD_CONTRACT, exists: true, settled: false, controllerHeld: false, worktree, writeScope: ['src/a'], resumable: true, caseId: CASE,
  });
  const settled = unitRunFacts(fgosDir, 'u-settled');
  assert.equal(settled.settled, true);
  assert.equal(settled.resumable, false, 'its worktree is gone');
  const garbled = unitRunFacts(fgosDir, 'u-garbled');
  assert.deepEqual([garbled.exists, garbled.settled, garbled.resumable, garbled.worktree], [true, false, false, null]);
  for (const missing of ['nope', '../escape', '', null]) {
    const facts = unitRunFacts(fgosDir, missing);
    assert.deepEqual([facts.exists, facts.settled, facts.controllerHeld, facts.resumable], [false, false, false, false], String(missing));
  }
});

test('a Unit run with a live controller reports it held', () => {
  const { fgosDir } = fixture();
  const dir = plant(fgosDir, 'u-run', { record: { execution: { status: 'settled' } } });
  const control = acquireUnitControl(dir, 'u-run');
  try {
    assert.equal(unitRunFacts(fgosDir, 'u-run').controllerHeld, true);
  } finally {
    control.release();
  }
  assert.equal(unitRunFacts(fgosDir, 'u-run').controllerHeld, false);
});

test('a Unit run stays for the first keep reason that fires, and a removable one goes', () => {
  const { root, fgosDir } = fixture();
  const worktree = path.join(root, 'wt');
  fs.mkdirSync(worktree);
  const controlled = plant(fgosDir, 'u-controlled', { record: { worktree } });
  plant(fgosDir, 'u-custody', { record: { worktree } });
  plant(fgosDir, 'u-unsettled', { summary: null });
  plant(fgosDir, 'u-no-record', { record: false });
  plant(fgosDir, 'u-theirs', { record: { workflow: { caseId: 'other' } } });
  plant(fgosDir, 'u-named', {});
  const ok = plant(fgosDir, 'u-ok', {});
  const control = acquireUnitControl(controlled, 'u-controlled');
  const custody = acquireDispatchCwdLock(fgosDir, worktree);
  try {
    const judge = (id) => judgeUnitRun(fgosDir, id, { caseId: CASE, unless: new Set(['u-named']) });
    assert.deepEqual(judge('u-controlled'), { keep: 'controller-held', blocks: true });
    assert.deepEqual(judge('u-custody'), { keep: 'custody-held', blocks: true });
    assert.deepEqual(judge('u-unsettled'), { keep: 'unsettled', blocks: true });
    assert.deepEqual(judge('u-no-record'), { keep: 'unit-record-missing', blocks: true });
    assert.deepEqual(judge('u-theirs'), { keep: 'names-other-case', blocks: false });
    assert.deepEqual(judge('u-named'), { keep: 'named-by-other-case', blocks: false });
    assert.deepEqual(judge('u-absent'), { gone: true });
    assert.deepEqual(judge('u-ok'), { dir: fs.realpathSync(ok) });
    assert.deepEqual(judge('../u-ok'), { keep: 'unsafe-path', blocks: true });
  } finally {
    control.release();
    custody.release();
  }
});

test('removeUnitRun deletes only a run that judges removable and never follows a link', () => {
  const { root, fgosDir } = fixture();
  const ok = plant(fgosDir, 'u-ok', {});
  const unsettled = plant(fgosDir, 'u-unsettled', { summary: null });
  const target = path.join(root, 'target');
  fs.mkdirSync(target);
  fs.writeFileSync(path.join(target, 'precious.txt'), 'keep');
  fs.symlinkSync(target, path.join(fgosDir, 'assignments', 'u-link'));

  assert.deepEqual(removeUnitRun(fgosDir, 'u-unsettled', { caseId: CASE }), { keep: 'unsettled', blocks: true });
  assert.deepEqual(removeUnitRun(fgosDir, 'u-link', { caseId: CASE }), { keep: 'link', blocks: true });
  assert.deepEqual(removeUnitRun(fgosDir, 'u-ok', { caseId: CASE }), { removed: true });
  assert.equal(fs.existsSync(ok), false);
  assert.equal(fs.existsSync(unsettled), true);
  assert.equal(fs.readFileSync(path.join(target, 'precious.txt'), 'utf8'), 'keep');
});

test('the settle of a released reservation is the Unit shape of a run that never started', () => {
  const settle = releasedUnitRunSettle('case-1');
  assert.deepEqual(settle.contract, UNIT_RUN_RESULT_CONTRACT);
  assert.equal(settle.caseId, 'case-1');
  assert.equal(settle.outcome, 'not-started');
  assert.equal(settle.unitRunId, null);
  assert.equal(settle.infrastructure, true);
  assert.deepEqual(settle.started, { value: false, reason: 'reservation-released' });
  assert.equal(settle.seatLaunchesUsed, 0);
  assert.equal(settle.frameExhausted, false);
});
