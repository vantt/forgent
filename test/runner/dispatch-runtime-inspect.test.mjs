import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { inspectDispatchRuntime, validateInspectionSelector } from '../../src/runner/dispatch/runtime-inspection.mjs';

function fixture() { return fs.mkdtempSync(path.join(os.tmpdir(), 'dispatch-inspect-')); }
function writeRun(root, assignmentId, attempt, run, result) {
  const dir = path.join(root, '.fgos', 'assignments', assignmentId, 'runs', attempt);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'run.json'), JSON.stringify(run));
  if (result) fs.writeFileSync(path.join(dir, 'result.json'), JSON.stringify(result));
  return dir;
}
function v1Result(runId, assignmentId) { return { runId, assignmentId, status: 'done', confidence: 'reported' }; }

test('inspection requires exactly one typed selector', () => {
  assert.throws(() => validateInspectionSelector({}), /exactly one selector/);
  assert.throws(() => validateInspectionSelector({ run: 'r', cwd: '/tmp' }), /exactly one selector/);
  assert.deepEqual(validateInspectionSelector({ run: 'r' }), { kind: 'run', id: 'r' });
});

test('duplicate run identities return every candidate and never first-match', () => {
  const root = fixture();
  writeRun(root, 'asgn_a', '01', { runId: 'run_same', assignmentId: 'asgn_a', status: 'running' });
  writeRun(root, 'asgn_b', '01', { runId: 'run_same', assignmentId: 'asgn_b', status: 'running' });
  const report = inspectDispatchRuntime(root, { run: 'run_same' });
  assert.equal(report.inspectionStatus, 'ambiguous');
  assert.equal(report.subject.locations.length, 2);
  assert.equal(report.recoveryAuthority, undefined);
});

test('assignment current run derives from supersession facts rather than attempt order', () => {
  const root = fixture();
  const assignmentDir = path.join(root, '.fgos', 'assignments', 'asgn_one');
  fs.mkdirSync(assignmentDir, { recursive: true });
  fs.writeFileSync(path.join(assignmentDir, 'assignment.json'), JSON.stringify({ assignmentId: 'asgn_one' }));
  writeRun(root, 'asgn_one', '01', { runId: 'run_old', assignmentId: 'asgn_one', status: 'running' });
  writeRun(root, 'asgn_one', '02', { runId: 'run_current', assignmentId: 'asgn_one', supersedesRunId: 'run_old', status: 'running' });
  const report = inspectDispatchRuntime(root, { assignment: 'asgn_one' });
  assert.equal(report.inspectionStatus, 'partial');
  assert.equal(report.runObservation.subject.runId, 'run_current');
});

test('cwd inspection aggregates lock, active, and historical runs', () => {
  const root = fixture();
  const cwd = path.join(root, 'work'); fs.mkdirSync(cwd);
  writeRun(root, 'asgn_a', '01', { runId: 'run_active', assignmentId: 'asgn_a', cwd, status: 'running' });
  writeRun(root, 'asgn_b', '01', { runId: 'run_done', assignmentId: 'asgn_b', cwd, status: 'settled' }, v1Result('run_done', 'asgn_b'));
  fs.mkdirSync(path.join(root, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(root, '.fgos', 'dispatch.lock'), JSON.stringify({ holder: 'driver' }));
  const report = inspectDispatchRuntime(root, { cwd });
  assert.deepEqual(report.observations[0].value.activeRunIds, ['run_active']);
  assert.deepEqual(report.observations[0].value.historicalRunIds, ['run_done']);
  assert.deepEqual(report.observations[0].value.lock, { holder: 'driver' });
});

test('inspection has no recovery, adapter, process-control, or Git-mutation dependency', () => {
  const source = fs.readFileSync(new URL('../../src/runner/dispatch/runtime-inspection.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /from ['"][^'"]*(recover|recovery|adapter|transport|child_process|run-lock|merge)[^'"]*['"]/);
  assert.doesNotMatch(source, /\b(?:exec|spawn|kill|signal|reset|clean|commit|writeFileSync|mkdirSync|rmSync)\s*\(/);
});
