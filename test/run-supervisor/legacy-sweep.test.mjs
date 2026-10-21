// Runs from before the run supervisor, left `running` with no attempt lock: settled as abandoned-legacy only
// on proof that every recorded process is dead and no version-1 home is left; anything else is kept with its
// reason. Fixture layout follows the runs of the controller-crash spike (herdr pane and cli supervisor).
// The settle goes through the real recover door, so it needs a host built from this checkout (FGOS_HOST_BIN).
import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeFixtureDir } from '../helpers/fixture-dir.mjs';
import { selfRecord } from '../../src/runner/dispatch/process-identity.mjs';
import { recoverApplyUseCase, recoverObserveUseCase } from '../../src/verbs/dispatch/recover.mjs';
import { findLegacyStuck, judgeLegacyHolders, settleLegacy, sweepLegacy } from '../../src/run-supervisor/legacy-sweep.mjs';

const HOST = process.env.FGOS_HOST_BIN;
const skip = HOST && fs.existsSync(HOST) ? false : 'FGOS_HOST_BIN does not name a host built from this checkout';

const FIXTURE = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'fixtures', 'run-layout', 'legacy-stuck', 'assignments');
const HERDR = 'unit-run-herdr/producer/1/runs/01';
const CLI = 'unit-run-cli/producer/1/runs/01';

/** A project root holding a copy of the fixture runs; `confinementRoot` is empty (no home left). */
function project() {
  const root = makeFixtureDir('legacy-sweep-');
  const assignmentsRoot = path.join(root, '.fgos', 'assignments');
  fs.cpSync(FIXTURE, assignmentsRoot, { recursive: true });
  const confinementRoot = path.join(root, 'confinement');
  fs.mkdirSync(confinementRoot);
  const runDir = (rel) => path.join(assignmentsRoot, rel);
  return { root, assignmentsRoot, confinementRoot, runDir, options: { repoRoot: root, confinementRoot, door: { observe: recoverObserveUseCase, apply: recoverApplyUseCase } } };
}

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const statusOf = (dir) => readJson(path.join(dir, 'run.json'));

/** Point the controller record of a run at a process that is really running (this one). */
function holdByThisProcess(dir, { withStartTime = true } = {}) {
  const file = path.join(dir, 'control', 'generations', '0000000001.json');
  const record = readJson(file);
  record.holder = { id: 'live', pid: process.pid, ...(withStartTime ? { processStartTime: selfRecord().startTime } : {}) };
  fs.writeFileSync(file, JSON.stringify(record));
}

test('finds the runs left running without an attempt lock or a v3 envelope, and only those', () => {
  const p = project();
  const closed = p.runDir('unit-run-cli/producer/1/runs/02');
  fs.mkdirSync(closed);
  fs.writeFileSync(path.join(closed, 'run.json'), JSON.stringify({ runId: 'r-closed', status: 'running' }));
  fs.writeFileSync(path.join(closed, 'closed.json'), '{}');
  const supervised = p.runDir('unit-run-cli/producer/1/runs/03');
  fs.mkdirSync(supervised);
  fs.writeFileSync(path.join(supervised, 'run.json'), JSON.stringify({ runId: 'r-supervised', status: 'running' }));
  fs.writeFileSync(path.join(supervised, 'attempt.lock'), '');
  fs.writeFileSync(path.join(supervised, 'envelope.json'), JSON.stringify({ v: 3 }));
  const lockOnly = p.runDir('unit-run-cli/producer/1/runs/05');
  fs.mkdirSync(lockOnly);
  fs.writeFileSync(path.join(lockOnly, 'run.json'), JSON.stringify({ runId: 'r-old-envelope', status: 'running' }));
  fs.writeFileSync(path.join(lockOnly, 'attempt.lock'), '');
  fs.writeFileSync(path.join(lockOnly, 'envelope.json'), JSON.stringify({ v: 2 }));
  const settled = p.runDir('unit-run-cli/producer/1/runs/04');
  fs.mkdirSync(settled);
  fs.writeFileSync(path.join(settled, 'run.json'), JSON.stringify({ runId: 'r-settled', status: 'died' }));

  const found = findLegacyStuck({ assignmentsRoot: p.assignmentsRoot }).map((entry) => entry.runDir).sort();
  assert.deepEqual(found, [p.runDir(CLI), lockOnly, p.runDir(HERDR)].sort());
});

test('every recorded process dead settles abandoned-legacy, and a second sweep changes nothing', { skip }, () => {
  const p = project();
  const first = sweepLegacy({ assignmentsRoot: p.assignmentsRoot, ...p.options });
  assert.deepEqual(first.kept, []);
  assert.deepEqual(first.settled.sort(), [p.runDir(CLI), p.runDir(HERDR)].sort());
  for (const rel of [HERDR, CLI]) {
    const run = statusOf(p.runDir(rel));
    assert.equal(run.status, 'died');
    assert.equal(run.settlement, 'abandoned-legacy');
    assert.ok(fs.existsSync(path.join(p.runDir(rel), 'protected')), 'the run directory is kept');
  }
  const before = fs.readFileSync(path.join(p.runDir(CLI), 'run.json'), 'utf8');
  const second = sweepLegacy({ assignmentsRoot: p.assignmentsRoot, ...p.options });
  assert.deepEqual(second, { settled: [], kept: [] });
  assert.equal(fs.readFileSync(path.join(p.runDir(CLI), 'run.json'), 'utf8'), before);
});

test('a recorded process that is alive keeps the run with pid-alive', { skip }, () => {
  const p = project();
  holdByThisProcess(p.runDir(HERDR));
  const verdict = judgeLegacyHolders(p.runDir(HERDR), p.options);
  assert.equal(verdict.allDead, false);
  assert.match(verdict.reason, /^pid-alive/);
  const swept = sweepLegacy({ assignmentsRoot: p.assignmentsRoot, ...p.options });
  assert.deepEqual(swept.settled, [p.runDir(CLI)]);
  assert.equal(swept.kept.length, 1);
  assert.match(swept.kept[0].reason, /^pid-alive/);
  assert.equal(statusOf(p.runDir(HERDR)).status, 'running');
  assert.deepEqual(settleLegacy(p.runDir(HERDR), p.options).settled, false);
  assert.equal(statusOf(p.runDir(HERDR)).status, 'running');
});

test('a live pid recorded without a start time is unknown and keeps the run', { skip }, () => {
  const p = project();
  holdByThisProcess(p.runDir(HERDR), { withStartTime: false });
  const verdict = judgeLegacyHolders(p.runDir(HERDR), p.options);
  assert.equal(verdict.allDead, false);
  assert.match(verdict.reason, /^pid-unknown/);
  assert.equal(settleLegacy(p.runDir(HERDR), p.options).settled, false);
  assert.equal(statusOf(p.runDir(HERDR)).status, 'running');
});

test('a version-1 home still present keeps the run even when every process is dead', { skip }, () => {
  const p = project();
  const home = path.join(p.confinementRoot, 'disp_legacy_cli', 'home');
  fs.mkdirSync(home, { recursive: true });
  fs.writeFileSync(path.join(home, '.fgos-confinement-owner.json'), JSON.stringify({ contract: 'confinement-resource-ownership.v1', dispatchId: 'disp_legacy_cli', pid: 2147483000 }));
  const verdict = judgeLegacyHolders(p.runDir(CLI), p.options);
  assert.equal(verdict.allDead, false);
  assert.match(verdict.reason, /^home-present/);
  const result = settleLegacy(p.runDir(CLI), p.options);
  assert.equal(result.settled, false);
  assert.equal(statusOf(p.runDir(CLI)).status, 'running');
  assert.ok(fs.existsSync(home), 'the home is never removed');
  fs.rmSync(path.join(p.confinementRoot, 'disp_legacy_cli'), { recursive: true });
  assert.equal(settleLegacy(p.runDir(CLI), p.options).settled, true);
});

test('a run that recorded no process at all is kept, not guessed dead', () => {
  const p = project();
  const dir = p.runDir(CLI);
  fs.rmSync(path.join(dir, 'control'), { recursive: true });
  fs.rmSync(path.join(dir, 'protected', 'supervisor-binding'), { recursive: true });
  assert.deepEqual(judgeLegacyHolders(dir, p.options), { allDead: false, reason: 'no-recorded-holders' });
});
