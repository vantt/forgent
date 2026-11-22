import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { assignmentDir, findRunDir, RunLookupError, listAssignmentRuns, scanAssignmentLayout } from '../../src/runner/dispatch/assignment-layout-twin.mjs';
import { findRunningRuns } from '../../src/runner/dispatch/visibility-session.mjs';
import { RUN_DIRS_VECTORS, buildRunDirsTree, relativeTo } from '../helpers/run-dirs-fixture.mjs';

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
});

test('nested runs without assignment metadata are discoverable by the run lookup and the running-run reconciler', (t) => {
  const { root, fgosDir, base } = temp(t);
  const id = 'unit-run-example/member-1/1-fb1';
  const runDir = path.join(base, id, 'runs', '02');
  const runId = `run_${id}_02`;
  writeJson(path.join(runDir, 'run.json'), { runId, assignmentId: id, status: 'running', cwd: root });
  assert.equal(findRunDir(fgosDir, runId), runDir);
  const running = findRunningRuns(fgosDir);
  assert.deepEqual(running.map((run) => ({ runDir: run.runDir, runId: run.runId, assignmentId: run.assignmentId })), [{ runDir, runId, assignmentId: id }]);
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
  const sharedRoot = path.join(root, 'session');
  fs.mkdirSync(sharedRoot);
  fs.symlinkSync(fgosDir, path.join(sharedRoot, '.fgos'));
  assert.equal(assignmentDir(path.join(sharedRoot, '.fgos'), 'unit/producer/1'), path.join(sharedRoot, '.fgos', 'assignments', 'unit', 'producer', '1'));
});

for (const identities of [['metadata', 'metadata'], ['result', 'result'], ['metadata', 'result']]) {
  test(`duplicate ${identities.join('/')} identities refuse the run lookup without mutation`, (t) => {
    const { fgosDir, base } = temp(t);
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
    assert.throws(() => findRunDir(fgosDir, runId), (err) => {
      assert.ok(err instanceof RunLookupError);
      assert.equal(err.code, 'run-ambiguous');
      assert.deepEqual(err.locations, locations);
      return true;
    });
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

test('the assignment lister yields what the shared run-directory fixture says for every tree (the host lists the same)', () => {
  assert.ok(RUN_DIRS_VECTORS.length >= 10);
  for (const vector of RUN_DIRS_VECTORS) {
    const { fgosDir, cleanup } = buildRunDirsTree(vector);
    try {
      assert.deepEqual(relativeTo(fgosDir, scanAssignmentLayout(fgosDir).runs.map((run) => run.runDir)), vector.expect.assignmentRuns, vector.name);
    } finally {
      cleanup();
    }
  }
});
