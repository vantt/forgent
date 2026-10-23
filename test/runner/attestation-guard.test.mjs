import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { checkDispatchAttestation } from '../../src/runner/attestation-guard.mjs';
import { appendWorkEvent } from '../helpers/work-event-fixture.mjs';
import { initializeWorkRepository } from '../helpers/work-store-release.mjs';
import { prepareWorkStore } from '../../src/state/work-event-store.mjs';

function git(dir, args) {
  return execFileSync('git', args, { cwd: dir, encoding: 'utf8', shell: false }).trim();
}

function setupTestRepo() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-attest-test-'));
  const fgosDir = initializeWorkRepository(tmpDir);
  fs.writeFileSync(path.join(tmpDir, 'README.md'), '# Test Repo\n');
  git(tmpDir, ['add', 'README.md']);
  git(tmpDir, ['commit', '-m', 'initial commit']);

  return { tmpDir, fgosDir };
}

function cleanupTestRepo(tmpDir) {
  try {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  } catch {
    // best-effort cleanup
  }
}

test('checkDispatchAttestation: returns skipped when no executor.dispatch event exists', () => {
  const { tmpDir, fgosDir } = setupTestRepo();
  try {
    const res = checkDispatchAttestation(fgosDir, tmpDir, 'tsk-1', 'fgw/tsk-1');
    assert.deepEqual(res, { ok: true, skipped: true });
  } finally {
    cleanupTestRepo(tmpDir);
  }
});

test('checkDispatchAttestation: returns skipped when baseCommit or headRef is null (in-session dispatch)', () => {
  const { tmpDir, fgosDir } = setupTestRepo();
  try {
    appendWorkEvent(fgosDir, {
      type: 'executor.dispatch',
      payload: { id: 'tsk-1', executorId: 'session', baseCommit: null, headRef: null },
    });

    const res = checkDispatchAttestation(fgosDir, tmpDir, 'tsk-1', 'fgw/tsk-1');
    assert.deepEqual(res, { ok: true, skipped: true });
  } finally {
    cleanupTestRepo(tmpDir);
  }
});

test('checkDispatchAttestation: returns ok when headRef matches and branch tip is descendant of baseCommit', () => {
  const { tmpDir, fgosDir } = setupTestRepo();
  try {
    const baseCommit = git(tmpDir, ['rev-parse', 'HEAD']);
    const branch = 'fgw/tsk-1';
    git(tmpDir, ['checkout', '-b', branch]);
    fs.writeFileSync(path.join(tmpDir, 'work.txt'), 'work');
    git(tmpDir, ['add', 'work.txt']);
    git(tmpDir, ['commit', '-m', 'worker commit']);

    appendWorkEvent(fgosDir, {
      type: 'executor.dispatch',
      payload: { id: 'tsk-1', executorId: 'cli', baseCommit, headRef: branch },
    });

    const res = checkDispatchAttestation(fgosDir, tmpDir, 'tsk-1', branch);
    assert.equal(res.ok, true);
    assert.equal(res.baseCommit, baseCommit);
    assert.equal(res.headRef, branch);
  } finally {
    cleanupTestRepo(tmpDir);
  }
});

test('checkDispatchAttestation: reads LAST matching event across retries', () => {
  const { tmpDir, fgosDir } = setupTestRepo();
  try {
    const baseCommit1 = git(tmpDir, ['rev-parse', 'HEAD']);
    const branch = 'fgw/tsk-retry';

    // First event: old/stale event pointing to main as headRef
    appendWorkEvent(fgosDir, {
      type: 'executor.dispatch',
      payload: { id: 'tsk-retry', executorId: 'cli', baseCommit: baseCommit1, headRef: 'main' },
    });

    git(tmpDir, ['checkout', '-b', branch]);
    fs.writeFileSync(path.join(tmpDir, 'work.txt'), 'retry work');
    git(tmpDir, ['add', 'work.txt']);
    git(tmpDir, ['commit', '-m', 'retry commit']);

    const baseCommit2 = baseCommit1;
    // Second event (retry): correct branch headRef
    appendWorkEvent(fgosDir, {
      type: 'executor.dispatch',
      payload: { id: 'tsk-retry', executorId: 'cli', baseCommit: baseCommit2, headRef: branch },
    });

    const res = checkDispatchAttestation(fgosDir, tmpDir, 'tsk-retry', branch);
    assert.equal(res.ok, true); // Picks second event, so ok is true
  } finally {
    cleanupTestRepo(tmpDir);
  }
});

test('checkDispatchAttestation: halts when recorded headRef diverges from actual branch name (tsk-43z shape)', () => {
  const { tmpDir, fgosDir } = setupTestRepo();
  try {
    const baseCommit = git(tmpDir, ['rev-parse', 'HEAD']);
    const branch = 'fgw/tsk-43z-shape';
    git(tmpDir, ['checkout', '-b', branch]);

    // Worker recorded headRef as 'main' instead of 'fgw/tsk-43z-shape'
    appendWorkEvent(fgosDir, {
      type: 'executor.dispatch',
      payload: { id: 'tsk-43z-shape', executorId: 'cli', baseCommit, headRef: 'main' },
    });

    const res = checkDispatchAttestation(fgosDir, tmpDir, 'tsk-43z-shape', branch);
    assert.equal(res.ok, false);
    assert.equal(res.reason, 'attestation-mismatch');
    assert.match(res.detail, /recorded headRef "main" does not match branch "fgw\/tsk-43z-shape"/);
  } finally {
    cleanupTestRepo(tmpDir);
  }
});

test('checkDispatchAttestation: halts when branch tip is NOT a descendant of baseCommit', () => {
  const { tmpDir, fgosDir } = setupTestRepo();
  try {
    const baseCommit = git(tmpDir, ['rev-parse', 'HEAD']);
    const branch = 'fgw/tsk-diverged';

    // Create an unrelated commit on orphan branch or forced commit detached from baseCommit
    git(tmpDir, ['checkout', '--orphan', branch]);
    fs.writeFileSync(path.join(tmpDir, 'unrelated.txt'), 'unrelated');
    git(tmpDir, ['add', 'unrelated.txt']);
    git(tmpDir, ['commit', '-m', 'unrelated commit']);

    appendWorkEvent(fgosDir, {
      type: 'executor.dispatch',
      payload: { id: 'tsk-diverged', executorId: 'cli', baseCommit, headRef: branch },
    });

    const res = checkDispatchAttestation(fgosDir, tmpDir, 'tsk-diverged', branch);
    assert.equal(res.ok, false);
    assert.equal(res.reason, 'attestation-mismatch');
    assert.match(res.detail, /is not a descendant of recorded baseCommit/);
  } finally {
    cleanupTestRepo(tmpDir);
  }
});

const dispatched = (fgosDir, tmpDir, id, branch) => appendWorkEvent(fgosDir, {
  type: 'executor.dispatch',
  payload: { id, executorId: 'cli', baseCommit: git(tmpDir, ['rev-parse', 'HEAD']), headRef: branch },
});

test('checkDispatchAttestation: fails closed on a history whose stored bytes were altered', () => {
  const { tmpDir, fgosDir } = setupTestRepo();
  try {
    dispatched(fgosDir, tmpDir, 'tsk-1', 'main');
    assert.equal(checkDispatchAttestation(fgosDir, tmpDir, 'tsk-1', 'main').ok, true);

    const active = path.join(tmpDir, '.git/fgos/events/project/active.jsonl');
    fs.writeFileSync(active, fs.readFileSync(active, 'utf8').replace('executor.dispatch', 'executor.tampered'));
    assert.throws(() => checkDispatchAttestation(fgosDir, tmpDir, 'tsk-1', 'main'));
  } finally {
    cleanupTestRepo(tmpDir);
  }
});

test('checkDispatchAttestation: refuses an incomplete history instead of passing on what it could read', () => {
  const { tmpDir, fgosDir } = setupTestRepo();
  try {
    dispatched(fgosDir, tmpDir, 'tsk-1', 'main');
    // An event whose writer had seen history this clone does not hold: the read is incomplete.
    prepareWorkStore(fgosDir, fgosDir).store.append('project',
      [{ eventType: 'executor.dispatch', schemaVersion: 1, payload: { id: 'tsk-1' }, ts: new Date().toISOString() }],
      { 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa:project': 1 }, 'fixture', []);
    assert.throws(() => checkDispatchAttestation(fgosDir, tmpDir, 'tsk-1', 'main'), { code: 'event-store-incomplete-history' });
  } finally {
    cleanupTestRepo(tmpDir);
  }
});
