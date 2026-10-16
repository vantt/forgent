// Borrowing through real git: the holder's description goes to git at slot
// 3, a hook inside git passes the borrower test, a background process the
// hook leaves behind (still holding the description) is killed before
// runBorrowed returns, gc.auto=1 with loose objects does not start a gc
// daemon, a sibling that opened the file itself is refused, and no
// ordinary child of the holder ever sees the lock's inode.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolveActiveHostBin } from '../../src/util/host-bin-path.mjs';
import { acquireSync, probe, runBorrowed, lockHolders, createLockScope, HolderLockError } from '../../src/holder-lock/index.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const FACADE_URL = pathToFileURL(path.join(root, 'src', 'holder-lock', 'index.mjs')).href;
const { bin: HOST_BIN } = resolveActiveHostBin({ fgosDir: path.join(root, '.fgos') });
const GIT_PRESENT = spawnSync('git', ['--version'], { encoding: 'utf8' }).status === 0;
const SKIP = !HOST_BIN
  ? 'no fgos host binary: set FGOS_HOST_BIN to a host built with the internal lock-fd route'
  : process.platform !== 'linux'
    ? 'reads /proc to list description holders'
    : !GIT_PRESENT ? 'git is not on PATH' : false;
const LOCK = 'main-checkout';

function git(cwd, args) {
  const res = spawnSync('git', args, { cwd, encoding: 'utf8', env: { ...process.env, GIT_CONFIG_NOSYSTEM: '1', HOME: cwd } });
  assert.equal(res.status, 0, `git ${args.join(' ')} failed: ${res.stderr}`);
  return res.stdout;
}

function initRepo(repo) {
  fs.mkdirSync(repo, { recursive: true });
  git(repo, ['init', '-q']);
  git(repo, ['config', 'user.email', 'holder-lock@example.invalid']);
  git(repo, ['config', 'user.name', 'holder-lock test']);
  git(repo, ['config', 'commit.gpgsign', 'false']);
  for (let i = 0; i < 3; i += 1) {
    fs.writeFileSync(path.join(repo, `file-${i}.txt`), `${i}\n`);
    git(repo, ['add', '.']);
    git(repo, ['commit', '-q', '-m', `commit ${i}`]);
  }
  // Set after the setup commits so they do not trigger a gc of their own.
  git(repo, ['config', 'gc.auto', '1']);
}

function looseObjectCount(repo) {
  const objects = path.join(repo, '.git', 'objects');
  return fs.readdirSync(objects)
    .filter((entry) => /^[0-9a-f]{2}$/.test(entry))
    .reduce((count, entry) => count + fs.readdirSync(path.join(objects, entry)).length, 0);
}

function installHook(repo, { hookScript, leftoverPidFile }) {
  const hook = path.join(repo, '.git', 'hooks', 'pre-commit');
  fs.writeFileSync(hook, [
    '#!/bin/sh',
    `${JSON.stringify(process.execPath)} ${JSON.stringify(hookScript)}`,
    // A background process the hook leaves behind inherits the borrowed
    // description (slot 3) and would keep the lock after git exits.
    `sleep 30 >/dev/null 2>&1 &`,
    `echo $! > ${JSON.stringify(leftoverPidFile)}`,
    'exit 0',
    '',
  ].join('\n'));
  fs.chmodSync(hook, 0o755);
}

function writeScript(dir, name, body) {
  const file = path.join(dir, name);
  fs.writeFileSync(file, `import * as lock from ${JSON.stringify(FACADE_URL)};\nimport fs from 'node:fs';\n${body}`);
  return file;
}

function pidGone(pid) {
  try {
    return /\) [ZX] /.test(fs.readFileSync(`/proc/${pid}/stat`, 'utf8'));
  } catch {
    return true;
  }
}

test('runBorrowed hands the description to git only, kills what the hook left behind, and leaves the lock free on release', { skip: SKIP }, () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'holder-lock-borrow-'));
  const fgosDir = path.join(dir, '.fgos');
  const repo = path.join(dir, 'repo');
  try {
    initRepo(repo);
    assert.ok(looseObjectCount(repo) > 0, 'the fixture has loose objects for gc.auto=1 to act on');
    const hookResult = path.join(dir, 'hook-result.json');
    const leftoverPidFile = path.join(dir, 'leftover.pid');
    const hookScript = writeScript(dir, 'hook.mjs', `
const result = lock.checkBorrowedDescription(process.env.LOCK_PATH);
fs.writeFileSync(process.env.HOOK_RESULT, JSON.stringify(result));
`);
    installHook(repo, { hookScript, leftoverPidFile });

    const scope = createLockScope('owner');
    const taken = acquireSync(scope, LOCK, { fgosDir });
    assert.equal(taken.result, 'acquired');
    const { handle } = taken;

    // An ordinary child of the holder never sees the lock's inode: the
    // description is close-on-exec everywhere except inside runBorrowed.
    const plainChild = spawnSync(process.execPath, ['-e', `
      const fs = require('node:fs');
      const targets = fs.readdirSync('/proc/self/fd').map((fd) => { try { return fs.readlinkSync('/proc/self/fd/' + fd); } catch { return ''; } });
      process.stdout.write(JSON.stringify(targets));
    `], { encoding: 'utf8' });
    assert.equal(plainChild.status, 0, plainChild.stderr);
    assert.ok(!JSON.parse(plainChild.stdout).some((target) => target.startsWith(fs.realpathSync(handle.path))), 'a plain child inherited the lock description');

    fs.writeFileSync(path.join(repo, 'borrowed.txt'), 'borrowed\n');
    git(repo, ['add', 'borrowed.txt']);
    const started = Date.now();
    const borrowed = runBorrowed(handle, {
      command: 'git',
      args: ['commit', '-q', '-m', 'borrowed commit'],
      cwd: repo,
      env: { ...process.env, GIT_CONFIG_NOSYSTEM: '1', HOME: repo, FGOS_HOST_BIN: HOST_BIN, LOCK_PATH: handle.path, HOOK_RESULT: hookResult },
    });
    const elapsed = Date.now() - started;
    assert.equal(borrowed.exit, 0, `git commit failed: ${borrowed.stderr}`);
    assert.equal(borrowed.signal, null);
    assert.ok(elapsed < 10_000, `runBorrowed took ${elapsed} ms: it waited on the background process instead of killing it`);

    assert.deepEqual(JSON.parse(fs.readFileSync(hookResult, 'utf8')), { result: 'borrower', name: LOCK }, 'the hook inside git is the borrower');

    const leftoverPid = Number(fs.readFileSync(leftoverPidFile, 'utf8').trim());
    assert.ok(Number.isInteger(leftoverPid) && leftoverPid > 0, 'the hook recorded its background process');
    assert.equal(borrowed.leftoversKilled, 1, 'exactly the hook\'s background process was killed (no gc daemon ran)');
    assert.ok(pidGone(leftoverPid), `background process ${leftoverPid} survived runBorrowed`);
    assert.deepEqual(lockHolders(LOCK, { fgosDir }), { kind: 'list', pids: [process.pid] }, 'only the holder keeps the description');

    // A sibling with the same env that opens the file itself is not a borrower.
    const sibling = writeScript(dir, 'sibling.mjs', `
const fd = fs.openSync(process.env.LOCK_PATH, 'r+');
const result = lock.checkBorrowedDescription(process.env.LOCK_PATH, { env: { ...process.env, FGOS_LOCK_FD: 'main-checkout:' + fd } });
process.stdout.write(JSON.stringify(result));
`);
    const siblingRun = spawnSync(process.execPath, [sibling], { encoding: 'utf8', env: { ...process.env, FGOS_HOST_BIN: HOST_BIN, LOCK_PATH: handle.path } });
    assert.equal(siblingRun.status, 0, siblingRun.stderr);
    const siblingResult = JSON.parse(siblingRun.stdout);
    assert.equal(siblingResult.result, 'not-borrower');
    assert.equal(siblingResult.reason, 'lock-not-held-by-description');

    assert.deepEqual(probe(LOCK, { fgosDir }), { result: 'held' }, 'the owner still holds');
    handle.release();
    assert.deepEqual(probe(LOCK, { fgosDir }), { result: 'free' }, 'free the moment git and the owner have closed');
    assert.deepEqual(lockHolders(LOCK, { fgosDir }), { kind: 'list', pids: [] });
    assert.match(git(repo, ['log', '--oneline', '-1']), /borrowed commit/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('runBorrowed prepends the gc guards to git only, refuses a released handle, and release waits for an async borrow', { skip: SKIP }, async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'holder-lock-borrow-async-'));
  const fgosDir = path.join(dir, '.fgos');
  try {
    const scope = createLockScope('owner');
    const { handle } = acquireSync(scope, LOCK, { fgosDir });
    const seen = runBorrowed(handle, {
      command: process.execPath,
      args: ['-e', 'process.stdout.write(JSON.stringify({ env: process.env.FGOS_LOCK_FD, argv: process.argv.slice(2) }))', 'a', 'b'],
      env: { ...process.env },
    });
    assert.equal(seen.exit, 0, seen.stderr);
    assert.deepEqual(JSON.parse(seen.stdout), { env: 'main-checkout:3', argv: ['a', 'b'] }, 'a non-git command keeps its argv and sees the slot name');

    const child = runBorrowed(handle, { command: process.execPath, args: ['-e', 'setTimeout(() => {}, 300)'], env: { ...process.env } }, { sync: false });
    assert.throws(() => handle.release(), (err) => err instanceof HolderLockError && err.code === 'lock-release-while-borrowed');
    const settled = await child.borrowed;
    assert.equal(settled.exit, 0);
    assert.equal(settled.leftoversKilled, 0);
    assert.equal(handle.release(), true);
    assert.throws(() => runBorrowed(handle, { command: 'true' }), (err) => err.code === 'lock-handle-released');
    assert.deepEqual(probe(LOCK, { fgosDir }), { result: 'free' });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
