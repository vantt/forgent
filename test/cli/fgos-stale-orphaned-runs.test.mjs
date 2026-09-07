// CLI coverage for the orphaned-run half of `fgos stale`: runs whose run.json
// still says "running" though nothing is left to finish them.
//
// The point being pinned here is the read/write split. `stale` documents
// itself as advisory, so the scan reports and changes nothing until
// `--reconcile` asks for the write. A run that a plain `stale` silently
// rewrote would make every other advisory line in this verb suspect.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FGOS = path.resolve(__dirname, '../../bin/fgos.mjs');

function run(cwd, args) {
  return spawnSync(process.execPath, [FGOS, ...args], { cwd, encoding: 'utf8' });
}

function tmpCwd() {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-stale-runs-'));
  assert.equal(run(cwd, ['init']).status, 0, 'tmpCwd(): "fgos init" failed to bootstrap .fgos/');
  return cwd;
}

function envelopeData(stdout) {
  return JSON.parse(stdout).data;
}

/** A run directory left behind mid-flight, in either of the two layouts. */
function plantRun(cwd, rel, { status = 'running', withResult = false } = {}) {
  const dir = path.join(cwd, '.fgos', rel);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'run.json'), JSON.stringify({ runId: path.basename(rel), status }, null, 2));
  if (withResult) {
    fs.mkdirSync(path.join(dir, 'outbox'), { recursive: true });
    fs.writeFileSync(path.join(dir, 'outbox', 'result-1.json'), JSON.stringify({ status: 'settled' }));
  }
  return dir;
}

const statusOf = (dir) => JSON.parse(fs.readFileSync(path.join(dir, 'run.json'), 'utf8')).status;

test('a plain stale reports an orphaned run and leaves it exactly as it found it', () => {
  const cwd = tmpCwd();
  const dir = plantRun(cwd, 'assignments/asgn_x/runs/01', { withResult: true });

  const result = run(cwd, ['stale']);
  assert.equal(result.status, 0, result.stderr);
  const data = envelopeData(result.stdout);

  assert.equal(data.reconciled, false);
  const row = data.orphanedRuns.find((r) => r.runId === '01');
  assert.ok(row, 'the abandoned run must show up in the advisory');
  assert.equal(row.wouldBecome, 'settled', 'the worker left a result, so it finished');
  assert.equal(row.hasWorkerResult, true);
  assert.equal(statusOf(dir), 'running', 'reporting is not permission to rewrite');
});

test('--reconcile is the ask that actually writes the outcome back', () => {
  const cwd = tmpCwd();
  const dir = plantRun(cwd, 'assignments/asgn_x/runs/01', { withResult: true });

  const data = envelopeData(run(cwd, ['stale', '--reconcile']).stdout);
  assert.equal(data.reconciled, true);
  assert.equal(data.orphanedRuns.find((r) => r.runId === '01').reconciled, true);
  assert.equal(statusOf(dir), 'settled');

  // Once written back the run is no longer orphaned, so the next scan is quiet.
  assert.deepEqual(envelopeData(run(cwd, ['stale']).stdout).orphanedRuns, []);
});

test('a run nobody can account for reads as unknown, never as dead', () => {
  // `stale` holds no herdr client and starts none, so it never looks at the
  // worker process. Calling that death would be an assertion about something
  // nobody observed.
  const cwd = tmpCwd();
  const dir = plantRun(cwd, 'dispatch-runs/tsk-x/1700000000000');

  const data = envelopeData(run(cwd, ['stale']).stdout);
  const row = data.orphanedRuns.find((r) => r.runId === '1700000000000');
  assert.ok(row, 'the flat dispatch-runs layout is scanned too, not just assignment runs');
  assert.equal(row.wouldBecome, 'unknown');
  assert.equal(row.hasWorkerResult, false);

  run(cwd, ['stale', '--reconcile']);
  assert.equal(statusOf(dir), 'unknown');
});

test('a run that already settled is not an orphan and is left out of the report', () => {
  const cwd = tmpCwd();
  plantRun(cwd, 'assignments/asgn_x/runs/01', { status: 'settled', withResult: true });

  assert.deepEqual(envelopeData(run(cwd, ['stale']).stdout).orphanedRuns, []);
});

test('a run being driven right now is left alone, even by --reconcile', () => {
  const cwd = tmpCwd();
  const dir = plantRun(cwd, 'dispatch-runs/tsk-live/1700000000001');
  // The adapter stamps this every ten seconds for as long as it is driving.
  fs.writeFileSync(path.join(dir, 'visibility.json'), JSON.stringify({
    status: 'briefed', lastSeenAt: new Date().toISOString(),
  }));

  assert.deepEqual(envelopeData(run(cwd, ['stale']).stdout).orphanedRuns, [],
    'a busy run is not an orphan');
  run(cwd, ['stale', '--reconcile']);
  assert.equal(statusOf(dir), 'running', 'and --reconcile does not stop it either');
});
