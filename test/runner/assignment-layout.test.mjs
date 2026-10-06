import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { assignmentDir, findRunDir, RunLookupError, listAssignmentRuns, scanAssignmentLayout, projectRunEligibility } from '../../src/runner/dispatch/assignment-layout.mjs';
import { allRuns, inspectDispatchRuntime, withRunsCache } from '../../src/runner/dispatch/runtime-inspection.mjs';
import { showRunUseCase, readRunSnapshot, DispatchObserveError } from '../../src/verbs/dispatch/show-run.mjs';
import { watchRunUseCase } from '../../src/verbs/dispatch/watch.mjs';
import { recoverObserveUseCase, recoverApplyUseCase, RecoveryError } from '../../src/verbs/dispatch/recover.mjs';

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
    const result = { ...(entry.runId ? { runId: entry.runId } : {}), ...(entry.unitRunId ? { unitRunId: entry.unitRunId } : {}), ...(entry.skip === 'no-timestamp' ? {} : { timestamp: fixture.timestamp }), status: 'done', confidence: 'reported', ...entry.result };
    if (entry.skip !== 'missing-result') {
      fs.writeFileSync(path.join(runDir, 'result.json'), entry.skip === 'unparseable' ? '{ invalid' : JSON.stringify(result));
    }
    if (entry.runId || entry.run) writeJson(path.join(runDir, 'run.json'), { runId: entry.runId, assignmentId: entry.assignmentId, status: 'settled', ...entry.run });
  }
  const link = path.join(env.base, fixture.symlink.path);
  fs.mkdirSync(path.dirname(link), { recursive: true });
  fs.symlinkSync(path.join(env.base, fixture.symlink.target), link);
  writeJson(path.join(env.base, fixture.planted.path, 'run.json'), { runId: fixture.planted.runId, status: 'running' });
  for (const entry of fixture.entries) fs.utimesSync(path.join(env.base, entry.assignmentId, 'runs', entry.attempt), 1, 1);
  return env;
}

test('shared layout fixture yields every safe directory candidate, never worker descendants or symlink attempts', (t) => {
  const { root, fgosDir, base } = materialize(t);
  const scan = scanAssignmentLayout(fgosDir);
  assert.equal(scan.runDirsSeen, fixture.runDirsSeen);
  assert.deepEqual(scan.skipped, { symlink: fixture.skipped.symlink });
  assert.deepEqual(scan.runs.map(({ assignmentId, attempt }) => `${assignmentId}/runs/${attempt}`).sort(), fixture.entries.map((e) => `${e.assignmentId}/runs/${e.attempt}`).sort());
  const eligible = projectRunEligibility(scan);
  assert.deepEqual(eligible.runs.map((run) => run.runId).sort(), fixture.observedRunIds);
  assert.deepEqual(eligible.skipped, fixture.skipped);
  assert.equal(eligible.observed + Object.values(eligible.skipped).reduce((sum, count) => sum + count, 0), scan.runDirsSeen);
  assert.deepEqual([...listAssignmentRuns(fgosDir)], scan.runs);
  assert.equal(scan.runs.find((r) => r.assignmentId === 'without-assignment').hasAssignmentJson, false);
  assert.equal(findRunDir(fgosDir, fixture.planted.runId), null);
  for (const entry of fixture.entries.filter((e) => e.runId)) {
    const matches = fixture.entries.filter((e) => e.runId === entry.runId);
    if (matches.length > 1) {
      assert.throws(() => findRunDir(fgosDir, entry.runId), (err) => err instanceof RunLookupError && err.code === 'run-ambiguous');
    } else {
      assert.equal(findRunDir(fgosDir, entry.runId), path.join(base, entry.assignmentId, 'runs', entry.attempt));
    }
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
  const eligible = projectRunEligibility(scan);
  assert.equal(eligible.observed, 0);
  assert.deepEqual(eligible.skipped, { depth: 1, 'missing-result': 1 });
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

for (const identities of [['metadata', 'metadata'], ['result', 'result'], ['metadata', 'result']]) {
  test(`duplicate ${identities.join('/')} identities refuse every explicit run door without mutation`, async (t) => {
    const { root, fgosDir, base } = temp(t);
    const runId = 'duplicate';
    const locations = ['aaa', 'zzz'].map((id, i) => {
      const dir = path.join(base, id, 'runs', '01');
      writeJson(path.join(dir, identities[i] === 'metadata' ? 'run.json' : 'result.json'), { runId, assignmentId: id, status: 'running' });
      writeJson(path.join(base, id, 'dispatch.claim'), { runId });
      return dir;
    });
    const before = locations.map((dir) => ({
      files: fs.readdirSync(dir),
      contents: fs.readdirSync(dir).map((name) => fs.readFileSync(path.join(dir, name), 'utf8')),
      claim: fs.readFileSync(path.join(path.dirname(path.dirname(dir)), 'dispatch.claim'), 'utf8'),
    }));
    const ambiguous = (ErrorType) => (err) => {
      assert.ok(err instanceof ErrorType);
      assert.equal(err.code, 'run-ambiguous');
      if (ErrorType !== RunLookupError) assert.equal(err.category, 'precondition');
      assert.deepEqual(err.locations, locations);
      return true;
    };
    assert.throws(() => findRunDir(fgosDir, runId), ambiguous(RunLookupError));
    assert.throws(() => showRunUseCase({ repoRoot: root }, { runId }), ambiguous(DispatchObserveError));
    let ticks = 0;
    await assert.rejects(watchRunUseCase({ repoRoot: root }, { runId, maxTicks: 1, onTick: () => ticks++ }), ambiguous(DispatchObserveError));
    assert.equal(ticks, 0);
    assert.throws(() => recoverObserveUseCase({ repoRoot: root }, { runId }), ambiguous(RecoveryError));
    assert.throws(() => recoverApplyUseCase({ repoRoot: root }, {
      runId, action: { type: 'resume-driver' }, expectedSnapshot: 'snapshot',
      expectedControlEpoch: 0, expectedExpiresAt: fixture.timestamp, actionKey: 'action',
    }), ambiguous(RecoveryError));
    locations.forEach((dir, i) => {
      assert.deepEqual(fs.readdirSync(dir), before[i].files);
      assert.deepEqual(fs.readdirSync(dir).map((name) => fs.readFileSync(path.join(dir, name), 'utf8')), before[i].contents);
      assert.equal(fs.readFileSync(path.join(path.dirname(path.dirname(dir)), 'dispatch.claim'), 'utf8'), before[i].claim);
    });
  });
}

test('lookup keeps metadata identity authoritative over a different result identity', (t) => {
  const { fgosDir, base } = temp(t);
  const dir = path.join(base, 'owner', 'runs', '01');
  writeJson(path.join(dir, 'run.json'), { runId: 'owner-id' });
  writeJson(path.join(dir, 'result.json'), { runId: 'result-id' });
  assert.equal(findRunDir(fgosDir, 'owner-id'), dir);
  assert.equal(findRunDir(fgosDir, 'result-id'), null);
});

test('eligibility uses actual settlement precedence without parsing nonblank timestamps', (t) => {
  const { fgosDir, base } = temp(t);
  const cases = [
    ['settled', { settledAt: 'result-settled', timestamp: 'result-time' }, { settledAt: 'owner-settled' }, 'result-settled'],
    ['timestamp', { settledAt: ' ', timestamp: 'result-time' }, { settledAt: 'owner-settled' }, 'result-time'],
    ['owner', { settledAt: null, timestamp: null }, { settledAt: 'owner-settled' }, 'owner-settled'],
    ['started', {}, { startedAt: fixture.timestamp }, null],
    ['created', {}, {}, null],
    ['preserved', { timestamp: ' non-date ', runId: ' padded ' }, {}, ' non-date '],
  ];
  for (const [id, result, run] of cases) {
    const dir = path.join(base, id, 'runs', '01');
    writeJson(path.join(base, id, 'assignment.json'), { createdAt: fixture.timestamp });
    writeJson(path.join(dir, 'result.json'), { runId: id, ...result });
    writeJson(path.join(dir, 'run.json'), run);
  }
  const eligible = projectRunEligibility(scanAssignmentLayout(fgosDir));
  assert.deepEqual(eligible.runs.map(({ assignmentId, timestamp }) => [assignmentId, timestamp]), cases.filter(([, , , time]) => time).map(([id, , , time]) => [id, time]).sort());
  assert.equal(eligible.runs.find((run) => run.assignmentId === 'preserved').runId, ' padded ');
  assert.deepEqual(eligible.skipped, { 'no-timestamp': 2 });
});

test('eligibility classifies missing, invalid, nonregular and symlink results separately', (t) => {
  const { fgosDir, base } = temp(t);
  for (const id of ['missing', 'invalid', 'nonregular', 'linked', 'blank-id', 'blank-inline', 'inline', 'scalar']) {
    fs.mkdirSync(path.join(base, id, 'runs', '01'), { recursive: true });
  }
  const resultPath = (id) => path.join(base, id, 'runs', '01', 'result.json');
  fs.writeFileSync(resultPath('invalid'), '{invalid');
  fs.mkdirSync(resultPath('nonregular'));
  fs.symlinkSync(resultPath('invalid'), resultPath('linked'));
  writeJson(resultPath('blank-id'), { runId: '  ', timestamp: fixture.timestamp });
  writeJson(resultPath('blank-inline'), { unitRunId: '  ' });
  writeJson(resultPath('inline'), { unitRunId: 'inline-id' });
  writeJson(resultPath('scalar'), null);
  const eligible = projectRunEligibility(scanAssignmentLayout(fgosDir));
  assert.equal(eligible.observed, 0);
  assert.deepEqual(eligible.skipped, { 'missing-result': 1, unparseable: 2, symlink: 1, 'no-run-id': 3, 'inline-record': 1 });
  assert.equal(Object.values(eligible.skipped).reduce((sum, count) => sum + count, 0), eligible.runDirsSeen);
});

test('eligibility ignores nonregular owner metadata and reserves duplicate identity for eligible results', (t) => {
  const { fgosDir, base } = temp(t);
  for (const id of ['aaa-undated', 'bbb-valid', 'ccc-duplicate', 'invalid-owner', 'directory-owner', 'symlink-owner']) {
    writeJson(path.join(base, id, 'runs', '01', 'result.json'), { runId: id.endsWith('owner') ? id : 'same', ...(id === 'bbb-valid' || id === 'ccc-duplicate' ? { timestamp: fixture.timestamp } : {}) });
  }
  fs.writeFileSync(path.join(base, 'invalid-owner/runs/01/run.json'), '{invalid');
  fs.mkdirSync(path.join(base, 'directory-owner/runs/01/run.json'));
  const owner = path.join(base, 'owner.json');
  writeJson(owner, { settledAt: fixture.timestamp });
  fs.symlinkSync(owner, path.join(base, 'symlink-owner/runs/01/run.json'));
  const eligible = projectRunEligibility(scanAssignmentLayout(fgosDir));
  assert.deepEqual(eligible.runs.map(({ assignmentId, runId }) => [assignmentId, runId]), [['bbb-valid', 'same']]);
  assert.deepEqual(eligible.skipped, { 'no-timestamp': 4, 'duplicate-run-id': 1 });
});

test('eligibility preserves lexical component traversal when duplicate paths share a prefix', (t) => {
  const { fgosDir, base } = temp(t);
  for (const id of ['a-', 'a']) {
    writeJson(path.join(base, id, 'runs', '01', 'result.json'), { runId: 'same', timestamp: fixture.timestamp });
  }
  const eligible = projectRunEligibility(scanAssignmentLayout(fgosDir));
  assert.deepEqual(eligible.runs.map((run) => run.assignmentId), ['a']);
  assert.deepEqual(eligible.skipped, { 'duplicate-run-id': 1 });
});

test('eligibility selects the same Unicode duplicate in UTF-8 component order', (t) => {
  const { fgosDir, base } = temp(t);
  for (const [name, timestamp] of [['\u{10000}', '2026-10-05T11:00:00Z'], ['\uE000', '2026-10-05T10:00:00Z']]) {
    writeJson(path.join(base, name, 'runs', '01', 'result.json'), { runId: 'same', timestamp });
  }
  const eligible = projectRunEligibility(scanAssignmentLayout(fgosDir));
  assert.deepEqual(eligible.runs.map(({ assignmentId, timestamp }) => [assignmentId, timestamp]), [['\uE000', '2026-10-05T10:00:00Z']]);
  assert.deepEqual(eligible.skipped, { 'duplicate-run-id': 1 });
});
