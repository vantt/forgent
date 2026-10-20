// Borrowing through the Node facade on Windows: `runBorrowed` on the hold
// transport, with real git, a real job and the real host binary
// (FGOS_HOST_BIN), and the ChildProcess-shaped async result as the credential
// probe uses it. Everything needs win32; the file protocol itself is covered
// on every platform by hold-transport-borrow.test.mjs.
import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolveActiveHostBin } from '../../src/util/host-bin-path.mjs';
import { acquireSync, runBorrowed, createLockScope, checkBorrowedDescription } from '../../src/holder-lock/index.mjs';
import { acquireAccountLock } from '../../src/runner/dispatch/provider-capacity.mjs';
import { runCredentialProbe } from '../../src/runner/dispatch/provider-credential-probe.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const { bin: HOST_BIN } = resolveActiveHostBin({ fgosDir: path.join(root, '.fgos') });
const GIT_PRESENT = spawnSync('git', ['--version'], { encoding: 'utf8' }).status === 0;
const SKIP = process.platform !== 'win32'
  ? 'the lock-hold transport runs on win32 only'
  : !HOST_BIN ? 'no fgos host binary: set FGOS_HOST_BIN to a host built from this checkout' : !GIT_PRESENT ? 'git is not on PATH' : false;
const LOCK = 'main-checkout';
const GIT_DIR = '.git';

function makeProject() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'holder-lock-windows-borrow-'));
  return { dir, fgosDir: path.join(dir, '.fgos') };
}

const shPath = (file) => file.replaceAll('\\', '/');

function git(cwd, args) {
  const res = spawnSync('git', args, { cwd, encoding: 'utf8', env: { ...process.env, GIT_CONFIG_NOSYSTEM: '1' } });
  assert.equal(res.status, 0, `git ${args.join(' ')} failed: ${res.stderr}`);
  return res.stdout;
}

function initRepo(repo) {
  fs.mkdirSync(repo, { recursive: true });
  git(repo, ['init', '-q']);
  git(repo, ['config', 'user.email', 'holder-lock@example.invalid']);
  git(repo, ['config', 'user.name', 'holder-lock test']);
  git(repo, ['config', 'commit.gpgsign', 'false']);
  fs.writeFileSync(path.join(repo, 'base.txt'), 'base\n');
  git(repo, ['add', '.']);
  git(repo, ['commit', '-q', '-m', 'base']);
}

const alive = (pid) => {
  try {
    process.kill(pid, 0);
    return true;
  } catch (err) {
    return err.code === 'EPERM';
  }
};

function waitFor(predicate, what, boundMs = 5000) {
  const deadline = Date.now() + boundMs;
  while (!predicate()) {
    assert.ok(Date.now() < deadline, `${what} did not happen within ${boundMs} ms`);
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 10);
  }
}

test('a sync borrow returns exit, stdout and stderr in the POSIX shape', { skip: SKIP }, () => {
  const { dir, fgosDir } = makeProject();
  const handle = acquireSync(createLockScope('test'), LOCK, { fgosDir }).handle;
  try {
    const out = runBorrowed(handle, { command: process.execPath, args: ['-e', "process.stdout.write('hello out'); process.stderr.write('hello err'); process.exit(4)"] });
    assert.deepEqual({ exit: out.exit, signal: out.signal, stdout: out.stdout, stderr: out.stderr }, { exit: 4, signal: null, stdout: 'hello out', stderr: 'hello err' });
    assert.equal(typeof out.leftoversKilled, 'number');
  } finally {
    handle.release();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('a borrowed git commit ends the background process its hook left, and a hook can prove it is a borrower', { skip: SKIP }, () => {
  const { dir, fgosDir } = makeProject();
  const repo = path.join(dir, 'repo');
  initRepo(repo);
  const pidFile = path.join(dir, 'sleep.pid');
  const marker = path.join(dir, 'borrower.json');
  const hostRoute = `'${shPath(HOST_BIN)}' internal lock-fd --protocol 2 --borrowed-check`;
  const handle = acquireSync(createLockScope('test'), LOCK, { fgosDir }).handle;
  fs.writeFileSync(path.join(repo, GIT_DIR, 'hooks', 'pre-commit'), [
    '#!/bin/sh',
    'sleep 30 >/dev/null 2>&1 </dev/null &',
    `echo $(cat /proc/$!/winpid) > '${shPath(pidFile)}'`,
    `${hostRoute} '${shPath(handle.path)}' > '${shPath(marker)}'`,
    'exit 0',
    '',
  ].join('\n'));
  try {
    const out = runBorrowed(handle, { command: 'git', args: ['-C', repo, 'commit', '-q', '--allow-empty', '-m', 'borrowed'], cwd: repo });
    assert.equal(out.exit, 0, out.stderr);
    assert.ok(out.leftoversKilled >= 1);
    const sleeper = Number(fs.readFileSync(pidFile, 'utf8').trim());
    assert.ok(Number.isInteger(sleeper) && sleeper > 0);
    assert.equal(alive(sleeper), false, "the hook's background process is gone when runBorrowed returns");
    assert.equal(JSON.parse(fs.readFileSync(marker, 'utf8')).result, 'borrower');
    // Outside any borrow the same process is not a borrower.
    assert.equal(checkBorrowedDescription(handle.path, { fgosDir, env: { ...process.env } }).result, 'not-borrower');
  } finally {
    handle.release();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

const FAKE_PROVIDER = `
console.log('login ok');
console.error('provider note');
setTimeout(() => process.exit(0), 100);
`;

test('the credential probe works through spawnHolding: streams, close, and a judged answer', { skip: SKIP }, async () => {
  const { dir } = makeProject();
  const script = path.join(dir, 'fake-provider.mjs');
  fs.writeFileSync(script, FAKE_PROVIDER);
  const account = await acquireAccountLock({ runtimeDir: dir, provider: 'prov', accountId: 'acct', waitMs: 2000 });
  try {
    const streamed = await new Promise((resolve, reject) => {
      const child = account.spawnHolding(process.execPath, [script], { env: process.env, stdio: ['ignore', 'pipe', 'pipe'], detached: true });
      assert.ok(Number.isInteger(child.pid));
      let text = '';
      child.stdout.on('data', (c) => { text += c; });
      child.stderr.on('data', (c) => { text += c; });
      child.on('error', reject);
      child.on('close', (code) => child.borrowed.then(() => resolve({ code, text }), reject));
    });
    assert.equal(streamed.code, 0);
    assert.match(streamed.text, /login ok/);
    assert.match(streamed.text, /provider note/);

    const answer = await runCredentialProbe({ command: process.execPath, args: [script], env: {} }, { spawnFn: account.spawnHolding, timeoutMs: 10_000 });
    assert.deepEqual(answer, { ok: true });
  } finally {
    account.release();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('kill() cancels a blocked borrowed child within a second, and a probe timeout ends it', { skip: SKIP }, async () => {
  const { dir } = makeProject();
  const script = path.join(dir, 'blocked-provider.mjs');
  fs.writeFileSync(script, "console.log('started'); setInterval(() => {}, 1000);");
  const account = await acquireAccountLock({ runtimeDir: dir, provider: 'prov', accountId: 'blocked', waitMs: 2000 });
  try {
    const child = account.spawnHolding(process.execPath, [script], { env: process.env, stdio: ['ignore', 'pipe', 'pipe'] });
    child.stdout.resume();
    child.stderr.resume();
    const started = Date.now();
    child.kill();
    await new Promise((resolve) => child.once('close', resolve));
    await child.borrowed;
    assert.ok(Date.now() - started < 1000, `cancelled in ${Date.now() - started} ms`);
    waitFor(() => !alive(child.pid), 'the cancelled child to be gone', 1000);

    const judged = await runCredentialProbe({ command: process.execPath, args: [script], env: {} }, { spawnFn: account.spawnHolding, timeoutMs: 600 });
    assert.deepEqual(judged, { ok: false, detail: 'the call did not finish in time' });
  } finally {
    account.release();
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
