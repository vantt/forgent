// Borrowing through real git: the holder's description goes to git at slot
// 3, a hook inside git passes the borrower test, a background process the
// hook leaves behind (still holding the description) is killed before
// runBorrowed returns, gc.auto=1 with loose objects does not start a gc
// daemon, a sibling that opened the file itself is refused, and no
// ordinary child of the holder ever sees the lock's inode.
import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
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
  let bystander = null;
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

    // A bystander that opened the lock file itself (a waiting contender, a
    // probe, a reader) owns no lock: the leftover sweep must leave it alone.
    const bystanderReady = path.join(dir, 'bystander.ready');
    bystander = spawn(process.execPath, ['-e', `
      const fs = require('node:fs');
      fs.openSync(${JSON.stringify(handle.path)}, 'r+');
      fs.writeFileSync(${JSON.stringify(bystanderReady)}, String(process.pid));
      setInterval(() => {}, 1000);
    `], { stdio: 'ignore' });
    const readyBy = Date.now() + 10_000;
    while (!fs.existsSync(bystanderReady)) {
      assert.ok(Date.now() < readyBy, 'the bystander never opened the lock file');
      spawnSync('sleep', ['0.02']);
    }

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
    assert.equal(pidGone(bystander.pid), false, 'a process that only opened the lock file was killed by the sweep');

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
    bystander?.kill('SIGKILL');
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
      args: ['-e', 'process.stdout.write(JSON.stringify({ env: process.env.FGOS_LOCK_FD, argv: process.argv.slice(1) }))', 'a', 'b'],
      env: { ...process.env },
    });
    assert.equal(seen.exit, 0, seen.stderr);
    assert.deepEqual(JSON.parse(seen.stdout), { env: 'main-checkout:3', argv: ['a', 'b'] }, 'a non-git command keeps its argv and sees the slot name');
    // Recognised by its name alone, so a script called git shows the argv a real git would get.
    const fakeGit = path.join(dir, 'bin', 'git');
    fs.mkdirSync(path.dirname(fakeGit));
    fs.writeFileSync(fakeGit, `#!${process.execPath}\nprocess.stdout.write(JSON.stringify(process.argv.slice(2)));\n`, { mode: 0o755 });
    const gitSeen = runBorrowed(handle, { command: fakeGit, args: ['commit', '-m', 'x'], env: { ...process.env } });
    assert.equal(gitSeen.exit, 0, gitSeen.stderr);
    assert.deepEqual(JSON.parse(gitSeen.stdout), ['-c', 'gc.auto=0', '-c', 'maintenance.auto=false', 'commit', '-m', 'x'], 'git gets the gc guards in front of its own argv');

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

test('Rust drain waits for a direct pre-exec child through both Node borrow paths', { skip: SKIP }, async () => {
  const { createRequire } = await import('node:module');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'holder-pre-exec-'));
  const addon = path.join(dir, 'pre-exec.node');
  const build = spawnSync('rustc', ['--crate-type', 'cdylib', '--edition=2021', path.join(root, 'test/holder-lock/pre-exec-fixture.rs'), '-o', addon], { encoding: 'utf8' });
  assert.equal(build.status, 0, build.stderr);
  const fixture = createRequire(import.meta.url)(addon);
  try {
    for (const async of [false, true]) {
      const fgosDir = path.join(dir, async ? 'async/.fgos' : 'sync/.fgos');
      fs.mkdirSync(fgosDir, { recursive: true });
      const scope = createLockScope();
      const acquired = acquireSync(scope, LOCK, { fgosDir });
      assert.equal(acquired.result, 'acquired');
      const handle = acquired.handle;
      const pid = fixture.start();
      assert.ok(pid > 1);
      try {
        const inherited = fs.readdirSync(`/proc/${pid}/fd`).some(fd => {
          try { return fs.readlinkSync(`/proc/${pid}/fd/${fd}`) === handle.path; } catch { return false; }
        });
        assert.ok(inherited, 'fixture must expose the real inherited CLOEXEC description');
        const result = runBorrowed(handle, { command: 'git', args: ['--version'], env: { ...process.env } }, { sync: !async });
        const outcome = async ? await result.borrowed : result;
        assert.equal(outcome.exit, 0);
        assert.equal(outcome.leftoversKilled, 0);
        assert.equal(fixture.wait(pid), 0, 'pre-exec child must exec and exit normally');
      } finally { handle.release(); }
    }
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
});

test('concurrent async sibling borrows are waited on and never killed by another drain', { skip: SKIP, timeout: 15000 }, async () => {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'holder-lock-sibling-'));
  const taken=acquireSync(createLockScope(),LOCK,{fgosDir:path.join(dir,'.fgos')});
  assert.equal(taken.result,'acquired');
  const {handle}=taken;
  const children=[];
  const ready=child=>new Promise((resolve,reject)=>{child.stdout.once('data',resolve);child.once('error',reject);});
  try {
    const args=['-e',"process.stdout.write('ready');process.stdin.once('data',()=>process.exit(0));"];
    const a=runBorrowed(handle,{command:process.execPath,args,stdin:'pipe'},{sync:false});children.push(a);await ready(a);
    const b=runBorrowed(handle,{command:process.execPath,args,stdin:'pipe'},{sync:false});children.push(b);await ready(b);
    a.stdin.end('go');
    await assert.rejects(a.borrowed,err=>err.code==='borrow-leftover-not-killed');
    assert.equal(b.exitCode,null);assert.equal(b.signalCode,null);
    process.kill(b.pid,0);
    b.stdin.end('go');
    const result=await b.borrowed;assert.equal(result.exit,0);assert.equal(result.signal,null);
  } finally {
    for(const child of children) if(child.exitCode===null&&child.signalCode===null) child.kill('SIGKILL');
    await Promise.allSettled(children.map(child=>child.borrowed));
    handle.release();fs.rmSync(dir,{recursive:true,force:true});
  }
});
