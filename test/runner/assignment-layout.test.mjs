import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { assignmentDir, findRunDir, listAssignmentRuns, scanAssignmentLayout } from '../../src/runner/dispatch/assignment-layout.mjs';
import { allRuns, inspectDispatchRuntime, withRunsCache } from '../../src/runner/dispatch/runtime-inspection.mjs';
import { showRunUseCase, readRunSnapshot } from '../../src/verbs/dispatch/show-run.mjs';
import { watchRunUseCase } from '../../src/verbs/dispatch/watch.mjs';

const fixture = JSON.parse(fs.readFileSync(new URL('../fixtures/run-layout/expected.json', import.meta.url), 'utf8'));
const writeJson = (file, value) => { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, JSON.stringify(value)); };
function temp(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-layout-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return { root, fgosDir: path.join(root, '.fgos'), base: path.join(root, '.fgos', 'assignments') };
}
function materialize(t) {
  const env = temp(t);
  for (const entry of fixture.entries) {
    const dir = path.join(env.base, entry.assignmentId);
    const runDir = path.join(dir, 'runs', entry.attempt);
    fs.mkdirSync(runDir, { recursive: true });
    if (entry.assignmentJson !== false) writeJson(path.join(dir, 'assignment.json'), { assignmentId: entry.assignmentId, role: entry.role ?? null });
    const result = { ...(entry.runId ? { runId: entry.runId } : {}), ...(entry.unitRunId ? { unitRunId: entry.unitRunId } : {}), ...(entry.skip === 'no-timestamp' ? {} : { timestamp: fixture.timestamp }), status: 'done', confidence: 'reported' };
    fs.writeFileSync(path.join(runDir, 'result.json'), entry.skip === 'unparseable' ? '{ invalid' : JSON.stringify(result));
    if (entry.runId) writeJson(path.join(runDir, 'run.json'), { runId: entry.runId, assignmentId: entry.assignmentId, status: 'settled' });
  }
  const link = path.join(env.base, fixture.symlink.path);
  fs.mkdirSync(path.dirname(link), { recursive: true });
  fs.symlinkSync(path.join(env.base, fixture.symlink.target), link);
  writeJson(path.join(env.base, fixture.planted.path, 'run.json'), { runId: fixture.planted.runId, status: 'running' });
  return env;
}

test('shared layout fixture yields every safe directory candidate, never worker descendants or symlink attempts', (t) => {
  const { root, fgosDir, base } = materialize(t);
  const scan = scanAssignmentLayout(fgosDir);
  assert.equal(scan.runDirsSeen, fixture.runDirsSeen);
  assert.deepEqual(scan.skipped, { symlink: fixture.skipped.symlink });
  assert.deepEqual(scan.runs.map(({ assignmentId, attempt }) => `${assignmentId}/runs/${attempt}`).sort(), fixture.entries.map((e) => `${e.assignmentId}/runs/${e.attempt}`).sort());
  const observed = new Set();
  for (const { runDir } of listAssignmentRuns(fgosDir)) {
    let result;
    try { result = JSON.parse(fs.readFileSync(path.join(runDir, 'result.json'), 'utf8')); } catch { continue; }
    if (typeof result.runId !== 'string' || !result.runId) continue;
    if (!Number.isFinite(Date.parse(result.settledAt ?? result.timestamp))) continue;
    observed.add(result.runId);
  }
  assert.deepEqual([...observed].sort(), fixture.observedRunIds);
  assert.equal(scan.runs.find((r) => r.assignmentId === 'without-assignment').hasAssignmentJson, false);
  assert.equal(findRunDir(fgosDir, fixture.planted.runId), null);
  for (const entry of fixture.entries.filter((e) => e.runId && e.skip !== 'duplicate-run-id')) {
    assert.equal(findRunDir(fgosDir, entry.runId), path.join(base, entry.assignmentId, 'runs', entry.attempt));
  }
  assert.equal(allRuns(root).length, fixture.entries.length, 'inspection retains malformed/unsettled candidates');
});

test('nested runs without assignment metadata are discoverable by inspection, show-run and watch', async (t) => {
  const { root, fgosDir, base } = temp(t);
  const id = 'unit-run-example/panelist-1/1-fb1';
  const runDir = path.join(base, id, 'runs', '02');
  const runId = `run_${id}_02`;
  writeJson(path.join(runDir, 'run.json'), { runId, assignmentId: id, status: 'running', cwd: root });
  assert.equal(findRunDir(fgosDir, runId), runDir);
  assert.equal(showRunUseCase({ repoRoot: root }, { runId }).settled, false);
  assert.deepEqual(inspectDispatchRuntime(root, { run: runId }).links.assignmentIds, [id]);
  const active = inspectDispatchRuntime(root, { cwd: root }).observations[0].value.activeRunIds;
  assert.ok(active.includes(runId), 'nested orphan participates in the existing cwd guard');
  writeJson(path.join(runDir, 'result.json'), { runId, assignmentId: id, status: 'done', confidence: 'reported', timestamp: fixture.timestamp });
  const shown = showRunUseCase({ repoRoot: root }, { runId });
  assert.equal(shown.settled, true);
  assert.equal(shown.result.runId, runId);
  const ticks = [];
  const watched = await watchRunUseCase({ repoRoot: root }, { runId, maxTicks: 1, onTick: (tick) => ticks.push(tick) });
  assert.deepEqual(ticks.map((tick) => ({ runId: tick.run.runId, settled: tick.settled, resultRunId: tick.result?.runId })), [{ runId, settled: true, resultRunId: runId }]);
  assert.equal(watched.stoppedBecause, 'terminal');
});

test('lookup falls back to result identity but never reads a symlinked result', (t) => {
  const { root, fgosDir, base } = temp(t);
  const dir = path.join(base, 'legacy', 'runs', '01');
  writeJson(path.join(dir, 'result.json'), { runId: 'result-only', timestamp: fixture.timestamp });
  assert.equal(findRunDir(fgosDir, 'result-only'), dir);
  const other = path.join(base, 'other', 'runs', '01');
  fs.mkdirSync(other, { recursive: true });
  fs.symlinkSync(path.join(dir, 'result.json'), path.join(other, 'result.json'));
  fs.rmSync(path.join(dir, 'result.json'));
  assert.equal(findRunDir(fgosDir, 'result-only'), null);
  writeJson(path.join(dir, 'result.json'), { runId: 'result-only', timestamp: fixture.timestamp });
  writeJson(path.join(other, 'run.json'), { runId: 'other', status: 'running' });
  assert.equal(readRunSnapshot(other).resultCorrupt, true);
  assert.equal(readRunSnapshot(other).settled, false);
  assert.equal(inspectDispatchRuntime(root, { run: 'other' }).runObservation.evidenceCompleteness.result, 'corrupt');
});

test('walk recognizes runs at the depth boundary and counts deeper barriers without traversing', (t) => {
  const { fgosDir, base } = temp(t);
  const id = Array.from({ length: fixture.maxDepth }, (_, i) => `level-${i}`).join('/');
  writeJson(path.join(base, id, 'runs', '01', 'run.json'), { runId: 'boundary' });
  writeJson(path.join(base, id, 'too-deep', 'runs', '01', 'run.json'), { runId: 'hidden' });
  const scan = scanAssignmentLayout(fgosDir);
  assert.equal(scan.runs.length, 1);
  assert.equal(scan.runs[0].assignmentId, id);
  assert.deepEqual(scan.skipped, { depth: 1 });
  assert.equal(scan.runDirsSeen, 2);
  assert.equal(findRunDir(fgosDir, 'hidden'), null);
});

test('assignment containment checks real ancestors including missing descendants and shared fgos roots', (t) => {
  const { root, fgosDir, base } = temp(t);
  fs.mkdirSync(base, { recursive: true });
  const outside = path.join(root, 'outside');
  fs.mkdirSync(outside);
  fs.symlinkSync(outside, path.join(base, 'escape'));
  assert.equal(assignmentDir(fgosDir, 'escape/missing'), null);
  assert.equal(assignmentDir(fgosDir, '../outside'), null);
  assert.equal(assignmentDir(fgosDir, outside), null);
  assert.equal(assignmentDir(fgosDir, 'unit/producer/1'), path.join(base, 'unit', 'producer', '1'));
  writeJson(path.join(outside, 'assignment.json'), { assignmentId: 'escape' });
  assert.equal(inspectDispatchRuntime(root, { assignment: 'escape' }).inspectionStatus, 'not-found');
  const sharedRoot = path.join(root, 'session');
  fs.mkdirSync(sharedRoot);
  fs.symlinkSync(fgosDir, path.join(sharedRoot, '.fgos'));
  assert.equal(assignmentDir(path.join(sharedRoot, '.fgos'), 'unit/producer/1'), path.join(sharedRoot, '.fgos', 'assignments', 'unit', 'producer', '1'));
});

test('verb-local run cache retains nested membership and bypass sees new candidates', (t) => {
  const { root, base } = temp(t);
  writeJson(path.join(base, 'unit/producer/1/runs/01/run.json'), { runId: 'first' });
  withRunsCache(() => {
    assert.equal(allRuns(root).length, 1);
    writeJson(path.join(base, 'unit/reviewer/1/runs/01/run.json'), { runId: 'second' });
    assert.equal(allRuns(root).length, 1);
    assert.equal(allRuns(root, { bypassCache: true }).length, 2);
  });
});
