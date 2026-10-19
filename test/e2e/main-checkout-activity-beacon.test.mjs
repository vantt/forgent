import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { acquireSync, runBorrowed, createLockScope } from '../../src/holder-lock/index.mjs';
import { beaconPath } from '../../src/runner/main-checkout-activity.mjs';
import { holdLockInChild } from '../helpers/hold-lock-in-child.mjs';
import { git, initRepoWithHook, commitAsSession, sessionEnv, HOOK_TEST_SKIP } from '../helpers/main-checkout-hook-repo.mjs';

// The pre-commit hook leaves a commit-activity beacon in its own file and
// takes no lock, so a commit on main never blocks a claim or a land. The
// beacon is skipped for fgOS's own commit (a borrower of the main-checkout
// mutex) and a commit is refused outright while fgOS holds main. Every test
// builds a disposable git repo with a copy of the real hook.

const skip = HOOK_TEST_SKIP;
const WINDOW = { FGOS_MAIN_CHECKOUT_LOCK_TTL_MS: String(15 * 60 * 1000) };

function log(repoRoot) {
  return git(repoRoot, ['log', '--format=%s']);
}

function readBeaconFile(repoRoot) {
  return JSON.parse(fs.readFileSync(beaconPath(path.join(repoRoot, '.fgos')), 'utf8'));
}

test('a commit on main leaves a beacon and no lock record behind, so main is free right after', { skip }, () => {
  const repoRoot = initRepoWithHook();
  const fgosDir = path.join(repoRoot, '.fgos');

  const commit = commitAsSession(repoRoot, { FGOS_SESSION_ID: 'session-a' });
  assert.equal(commit.status, 0, commit.stderr);
  assert.equal(readBeaconFile(repoRoot).writer.id, 'session-a');

  const res = acquireSync(createLockScope('claim'), 'main-checkout', { fgosDir });
  assert.equal(res.result, 'acquired', 'the hook must not keep the main-checkout mutex');
  res.handle.release();
});

test('the same writer commits again inside its window; another writer is refused; a refused commit writes no beacon', { skip }, () => {
  const repoRoot = initRepoWithHook();

  assert.equal(commitAsSession(repoRoot, { FGOS_SESSION_ID: 'session-a', ...WINDOW }).status, 0);
  const first = readBeaconFile(repoRoot);
  const again = commitAsSession(repoRoot, { FGOS_SESSION_ID: 'session-a', ...WINDOW });
  assert.equal(again.status, 0, again.stderr);

  const before = log(repoRoot);
  const rival = commitAsSession(repoRoot, { FGOS_SESSION_ID: 'session-b', ...WINDOW });
  assert.notEqual(rival.status, 0);
  assert.match(rival.stderr, /commit refused: another session committed in this checkout/);
  assert.equal(log(repoRoot), before);
  const after = readBeaconFile(repoRoot);
  assert.equal(after.writer.id, 'session-a', 'the refused writer must not overwrite the beacon');
  assert.ok(after.writtenAt >= first.writtenAt);
});

test('a commit refused by an earlier guard (a staged .fgos deletion) never writes the beacon', { skip }, () => {
  const repoRoot = initRepoWithHook();
  fs.mkdirSync(path.join(repoRoot, '.fgos'), { recursive: true });
  fs.writeFileSync(path.join(repoRoot, '.fgos', 'tracked.json'), '{}\n');
  git(repoRoot, ['add', '.fgos/tracked.json']);
  assert.equal(spawnSync('git', ['commit', '-q', '-m', 'track'], { cwd: repoRoot, env: sessionEnv({ FGOS_SESSION_ID: 'session-a' }) }).status, 0);
  fs.rmSync(beaconPath(path.join(repoRoot, '.fgos')));

  git(repoRoot, ['rm', '-q', '.fgos/tracked.json']);
  const refused = spawnSync('git', ['commit', '-q', '-m', 'delete'], { cwd: repoRoot, encoding: 'utf8', env: sessionEnv({ FGOS_SESSION_ID: 'session-b' }) });
  assert.notEqual(refused.status, 0);
  assert.match(refused.stderr, /stages a deletion under "\.fgos\/"/);
  assert.equal(fs.existsSync(beaconPath(path.join(repoRoot, '.fgos'))), false);
});

test('an fgOS commit under the mutex it holds neither checks nor writes the beacon', { skip }, () => {
  const repoRoot = initRepoWithHook();
  const fgosDir = path.join(repoRoot, '.fgos');
  assert.equal(commitAsSession(repoRoot, { FGOS_SESSION_ID: 'session-a', ...WINDOW }).status, 0);
  const beaconBefore = fs.readFileSync(beaconPath(fgosDir), 'utf8');

  const res = acquireSync(createLockScope('land'), 'main-checkout', { fgosDir });
  assert.equal(res.result, 'acquired');
  try {
    fs.writeFileSync(path.join(repoRoot, 'land.txt'), 'land\n');
    git(repoRoot, ['add', 'land.txt']);
    // session-b would be refused by the beacon of session-a: the borrow is what lets it through.
    const own = runBorrowed(res.handle, { command: 'git', args: ['commit', '-q', '-m', 'land'], cwd: repoRoot, env: sessionEnv({ FGOS_SESSION_ID: 'session-b' }) });
    assert.equal(own.exit, 0, own.stderr);
  } finally {
    res.handle.release();
  }
  assert.equal(fs.readFileSync(beaconPath(fgosDir), 'utf8'), beaconBefore);
  assert.match(log(repoRoot), /land/);
});

test('a commit is refused while fgOS holds main, without waiting, and writes no beacon', { skip }, async () => {
  const repoRoot = initRepoWithHook();
  const fgosDir = path.join(repoRoot, '.fgos');
  const holder = await holdLockInChild('main-checkout', { fgosDir });
  try {
    const startedAt = Date.now();
    const result = commitAsSession(repoRoot, { FGOS_SESSION_ID: 'session-a' });
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /fgOS is writing the main checkout right now/);
    assert.ok(Date.now() - startedAt < 5000, 'the hook never waits for the lock');
    assert.equal(fs.existsSync(beaconPath(fgosDir)), false);
  } finally {
    holder.child.kill('SIGKILL');
    await holder.exited;
  }
});
