import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { acquireSync, acquire, probe, runBorrowed, createLockScope } from '../../src/holder-lock/index.mjs';
import { holdLockInChild } from '../helpers/hold-lock-in-child.mjs';
import { git, mkTempDir, initRepo, installHook, initRepoWithHook, commitAsSession, commitCount, sessionEnv, HOOK_TEST_SKIP } from '../helpers/main-checkout-hook-repo.mjs';

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

function subjects(repoRoot) {
  return git(repoRoot, ['log', '--format=%s']);
}

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
