import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import { activateGitFixture } from '../runner/worktree-native-fixture.helper.mjs';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { acquireSync, acquire, probe, runBorrowed, createLockScope, LockHandle } from '../../src/holder-lock/index.mjs';
import { runOpportunisticMainCheckoutChecks } from '../../src/state/events-jsonl-truncation-guard.mjs';
import { checkpointMainFgos } from '../../src/runner/main-fgos-checkpoint.mjs';
import { holdLockInChild } from '../helpers/hold-lock-in-child.mjs';
import { git, mkTempDir, initRepo, installHook, initRepoWithHook, commitAsSession, commitCount, sessionEnv, HOOK_TEST_SKIP } from '../helpers/main-checkout-hook-repo.mjs';
import { writeProjectConfig } from '../helpers/config-fixture.mjs';

// Borrowing the main-checkout mutex through real git and the real
// pre-commit hook: fgOS's own commit passes as a borrower, anybody else is
// refused while fgOS holds main, and the lock outlives its owner until git
// exits. Every test uses a disposable repo.

const skip = HOOK_TEST_SKIP;
const HOLDER_MOD = fileURLToPath(new URL('../../src/holder-lock/index.mjs', import.meta.url));
const sleep = (ms) => new Promise((resolve) => { setTimeout(resolve, ms); });

function acquireMain(fgosDir, label = 'test') {
  const res = acquireSync(createLockScope(label), 'main-checkout', { fgosDir });
  assert.equal(res.result, 'acquired');
  return res.handle;
}

/** A tracked-looking events file the checkpoint will find dirty and due. */
function makeCheckpointDue(repoRoot) {
  activateGitFixture(repoRoot);
  const fgosDir = path.join(repoRoot, '.fgos');
  fs.mkdirSync(fgosDir, { recursive: true });
  writeProjectConfig(repoRoot, { checkpoint: { fallbackIntervalSec: 0 } });
  fs.writeFileSync(path.join(fgosDir, 'events.jsonl'), '{"seq":1}\n{"seq":2}\n');
  return fgosDir;
}

function withChecksEnabled(fn) {
  const saved = process.env.FGOS_DISABLE_OPPORTUNISTIC_CHECKS;
  delete process.env.FGOS_DISABLE_OPPORTUNISTIC_CHECKS;
  try {
    return fn();
  } finally {
    if (saved !== undefined) process.env.FGOS_DISABLE_OPPORTUNISTIC_CHECKS = saved;
  }
}

function subjects(repoRoot) {
  return git(repoRoot, ['log', '--format=%s']);
}

test('checkpointMainFgos commits .fgos through the borrowed mutex: the hook sees a borrower, and main is free once the holder lets go', { skip }, () => {
  const repoRoot = initRepoWithHook();
  const fgosDir = makeCheckpointDue(repoRoot);
  const handle = acquireMain(fgosDir);
  try {
    withChecksEnabled(() => checkpointMainFgos(handle, fgosDir, repoRoot));
  } finally {
    handle.release();
  }
  assert.match(subjects(repoRoot), /chore\(\.fgos\): fallback events checkpoint/);
  assert.equal(git(repoRoot, ['status', '--porcelain', '--', '.fgos/events.jsonl']).trim(), '');
  assert.equal(probe('main-checkout', { fgosDir }).result, 'free');
});

test('checkpointMainFgos without the live main handle throws', { skip }, () => {
  const repoRoot = initRepoWithHook();
  assert.throws(() => checkpointMainFgos(undefined, path.join(repoRoot, '.fgos'), repoRoot), /needs the live main-checkout handle/);
  assert.throws(() => checkpointMainFgos({ name: 'main-checkout' }, path.join(repoRoot, '.fgos'), repoRoot), /needs the live main-checkout handle/);
  const fgosDir = path.join(repoRoot, '.fgos');
  const released = acquireMain(fgosDir);
  released.release();
  assert.throws(() => checkpointMainFgos(released, fgosDir, repoRoot), /needs the live main-checkout handle/);
  assert.ok(released instanceof LockHandle);
});

test('two children with the same FGOS_LOCK_FD env: the borrower passes, the sibling that opened the file itself is refused', { skip }, () => {
  const repoRoot = initRepoWithHook();
  const fgosDir = path.join(repoRoot, '.fgos');
  const handle = acquireMain(fgosDir);
  try {
    fs.writeFileSync(path.join(repoRoot, 'borrowed.txt'), 'b\n');
    git(repoRoot, ['add', 'borrowed.txt']);
    const borrowed = runBorrowed(handle, { command: 'git', args: ['commit', '-q', '-m', 'borrowed'], cwd: repoRoot, env: sessionEnv() });
    assert.equal(borrowed.exit, 0, borrowed.stderr);

    fs.writeFileSync(path.join(repoRoot, 'sibling.txt'), 's\n');
    git(repoRoot, ['add', 'sibling.txt']);
    const lockPath = path.join(fgosDir, 'locks', 'main-checkout.lock');
    const ownFd = fs.openSync(lockPath, fs.constants.O_RDWR);
    let sibling;
    try {
      sibling = spawnSync('git', ['commit', '-q', '-m', 'sibling'], {
        cwd: repoRoot,
        encoding: 'utf8',
        env: sessionEnv({ FGOS_LOCK_FD: 'main-checkout:3' }),
        stdio: ['ignore', 'pipe', 'pipe', ownFd],
      });
    } finally {
      fs.closeSync(ownFd);
    }
    assert.notEqual(sibling.status, 0);
    assert.match(sibling.stderr, /fgOS is writing the main checkout right now/);
    assert.doesNotMatch(subjects(repoRoot), /sibling/);
  } finally {
    handle.release();
  }
});

test('the owner is SIGKILLed right after spawning a borrowed git commit: a contender stays out while git runs, then gets in', { skip }, async () => {
  const repoRoot = initRepoWithHook();
  const fgosDir = path.join(repoRoot, '.fgos');
  // The commit finishes slowly: a hook in the same hooks dir keeps git alive after the commit object exists.
  const slow = path.join(repoRoot, '.githooks', 'post-commit');
  fs.writeFileSync(slow, '#!/bin/sh\nsleep 2\n');
  fs.chmodSync(slow, 0o755);
  fs.writeFileSync(path.join(repoRoot, 'late.txt'), 'late\n');
  git(repoRoot, ['add', 'late.txt']);
  const marker = path.join(mkTempDir('fgos-owner-marker-'), 'spawned');
  const owner = spawn(process.execPath, ['--input-type=module', '-e', `
    import fs from 'node:fs';
    import { acquireSync, runBorrowed, createLockScope } from ${JSON.stringify(HOLDER_MOD)};
    const res = acquireSync(createLockScope('owner'), 'main-checkout', { fgosDir: ${JSON.stringify(fgosDir)} });
    const child = runBorrowed(res.handle, { command: 'git', args: ['commit', '-q', '-m', 'orphaned'], cwd: ${JSON.stringify(repoRoot)}, env: process.env }, { sync: false });
    fs.writeFileSync(${JSON.stringify(marker)}, String(child.pid));
    setInterval(() => {}, 1000);
  `], { stdio: 'ignore', env: sessionEnv() });
  const deadline = Date.now() + 15_000;
  while (!fs.existsSync(marker)) {
    assert.ok(Date.now() < deadline, 'the owner never spawned git');
    await sleep(10);
  }
  const killedAt = Date.now();
  owner.kill('SIGKILL');
  await new Promise((resolve) => owner.once('exit', resolve));

  let blockedFor = 0;
  const scope = createLockScope('contender');
  let got = null;
  while (got === null) {
    assert.ok(Date.now() - killedAt < 30_000, 'the contender never got in');
    const res = await acquire(scope, 'main-checkout', { fgosDir });
    if (res.result === 'acquired') got = res.handle;
    else {
      blockedFor = Date.now() - killedAt;
      await sleep(25);
    }
  }
  try {
    assert.ok(blockedFor >= 500, `the contender was held off only ${blockedFor} ms after the owner died while git was still running`);
    assert.match(subjects(repoRoot), /orphaned/, 'git finished its commit after its owner died');
  } finally {
    got.release();
  }
});

test('a manual commit at main is refused while fgOS holds main, and passes (beacon written) when nobody holds it', { skip }, async () => {
  const repoRoot = initRepoWithHook();
  const fgosDir = path.join(repoRoot, '.fgos');
  const holder = await holdLockInChild('main-checkout', { fgosDir });
  try {
    const before = commitCount(repoRoot);
    const refused = commitAsSession(repoRoot, { FGOS_SESSION_ID: 'session-manual' });
    assert.notEqual(refused.status, 0);
    assert.match(refused.stderr, /fgOS is writing the main checkout right now/);
    assert.equal(commitCount(repoRoot), before);
    assert.equal(fs.existsSync(path.join(fgosDir, 'runtime', 'main-checkout-activity.json')), false);
  } finally {
    holder.child.kill('SIGKILL');
    await holder.exited;
  }
  const result = commitAsSession(repoRoot, { FGOS_SESSION_ID: 'session-manual' });
  assert.equal(result.status, 0, result.stderr);
  const beacon = JSON.parse(fs.readFileSync(path.join(fgosDir, 'runtime', 'main-checkout-activity.json'), 'utf8'));
  assert.equal(beacon.writer.id, 'session-manual');
});

test('a commit in another worktree never touches the main lock, even while fgOS holds main', { skip }, async () => {
  const mainRoot = initRepo('fgos-hook-away-main-');
  installHook(mainRoot, { absolute: true });
  const worktreeRoot = path.join(mkTempDir('fgos-hook-away-parent-'), 'worktree');
  git(mainRoot, ['worktree', 'add', '-b', 'fgw/away', worktreeRoot]);
  const holder = await holdLockInChild('main-checkout', { fgosDir: path.join(mainRoot, '.fgos') });
  try {
    const result = commitAsSession(worktreeRoot, { FGOS_SESSION_ID: 'session-away' });
    assert.equal(result.status, 0, result.stderr);
  } finally {
    holder.child.kill('SIGKILL');
    await holder.exited;
  }
});

test('a checkpoint whose commit fails resets the index while still holding main', { skip }, () => {
  const repoRoot = initRepoWithHook();
  const fgosDir = makeCheckpointDue(repoRoot);
  // A failing commit-msg hook makes the checkpoint's commit fail for real.
  const failing = path.join(repoRoot, '.githooks', 'commit-msg');
  fs.writeFileSync(failing, '#!/bin/sh\nexit 1\n');
  fs.chmodSync(failing, 0o755);
  const before = commitCount(repoRoot);
  const handle = acquireMain(fgosDir);
  const seen = { resetWhileHeld: null, commitFailed: false };
  try {
    const commit = (args) => {
      if (args[0] === 'reset') seen.resetWhileHeld = !handle.released && probe('main-checkout', { fgosDir }).result === 'held';
      const res = runBorrowed(handle, { command: 'git', args, cwd: repoRoot });
      if (res.exit !== 0) {
        if (args[0] === 'commit') seen.commitFailed = true;
        throw new Error(`git ${args[0]} failed`);
      }
    };
    withChecksEnabled(() => runOpportunisticMainCheckoutChecks(fgosDir, repoRoot, { commit }));
  } finally {
    handle.release();
  }
  assert.equal(seen.commitFailed, true);
  assert.equal(seen.resetWhileHeld, true, 'the reset must run while the caller still holds main');
  assert.equal(commitCount(repoRoot), before);
  assert.equal(git(repoRoot, ['diff', '--cached', '--name-only']).trim(), '', 'the failed commit left nothing staged');
});

test('a stale FGOS_LOCK_FD with no descriptor open falls through to the probe: free passes, held refuses', { skip }, async () => {
  const repoRoot = initRepoWithHook();
  const fgosDir = path.join(repoRoot, '.fgos');
  const stale = { FGOS_SESSION_ID: 'session-stale', FGOS_LOCK_FD: 'main-checkout:3' };
  const free = commitAsSession(repoRoot, stale);
  assert.equal(free.status, 0, free.stderr);

  const holder = await holdLockInChild('main-checkout', { fgosDir });
  try {
    const refused = commitAsSession(repoRoot, stale);
    assert.notEqual(refused.status, 0);
    assert.match(refused.stderr, /fgOS is writing the main checkout right now/);
  } finally {
    holder.child.kill('SIGKILL');
    await holder.exited;
  }
});

test('with no usable host binary the hook refuses the commit at the writer identity step, whether or not a holder keeps the lock', { skip }, async () => {
  const repoRoot = initRepoWithHook();
  const fgosDir = path.join(repoRoot, '.fgos');
  const holder = await holdLockInChild('main-checkout', { fgosDir });
  try {
    const refused = commitAsSession(repoRoot, { FGOS_SESSION_ID: 'session-nohost', FGOS_HOST_BIN: path.join(repoRoot, 'no-such-host') });
    assert.notEqual(refused.status, 0);
    // The lock cannot be asked of a host that is not there (no fgOS process can hold it either); the identity step is what stops the commit.
    assert.match(refused.stderr, /commit refused: cannot resolve the writer identity \(host-missing\)/);
    assert.match(refused.stderr, /FGOS_HOST_BIN=.*no-such-host/);
    assert.doesNotMatch(refused.stderr, /fgOS is writing the main checkout right now/);
  } finally {
    holder.child.kill('SIGKILL');
    await holder.exited;
  }
});
