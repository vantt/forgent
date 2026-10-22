// The state hot lock on Windows, with real processes and the real host binary
// (FGOS_HOST_BIN): a holder killed inside the critical section is reclaimed by
// the next process within the five second wait, and a live holder never is.
// The judge reads the holder's creation time through the host's process facts.
// Needs win32.
import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveActiveHostBin } from '../../src/util/host-bin-path.mjs';
import { IDENTITY_ENV_KEYS } from '../helpers/identity-env.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const { bin: HOST_BIN } = resolveActiveHostBin({ fgosDir: path.join(root, '.fgos') });
const SKIP = process.platform !== 'win32'
  ? 'the Windows hot lock runs on win32 only'
  : (HOST_BIN ? false : 'no fgos host binary: set FGOS_HOST_BIN to a host built from this checkout');
const HOT_LOCK_URL = new URL('../../src/state/hot-lock.mjs', import.meta.url).href;
const WRITER = JSON.stringify('windows-hot-lock-test');

const stateRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-windows-hot-state-'));

function fixture() {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-windows-hot-')));
  const fgosDir = path.join(dir, '.fgos');
  fs.mkdirSync(fgosDir, { recursive: true });
  return { dir, fgosDir, cleanup: () => fs.rmSync(dir, { recursive: true, force: true }) };
}

function runChild(script, args) {
  const env = { ...process.env, FGOS_STATE_ROOT: stateRoot };
  for (const key of IDENTITY_ENV_KEYS) delete env[key];
  const child = spawn(process.execPath, ['--input-type=module', '-e', script, ...args], { env, stdio: ['ignore', 'pipe', 'pipe'] });
  let stdout = '';
  let stderr = '';
  child.stdout.on('data', (chunk) => { stdout += chunk; });
  child.stderr.on('data', (chunk) => { stderr += chunk; });
  const done = new Promise((resolve) => child.on('exit', (code, signal) => resolve({ code, signal, stdout, stderr })));
  return { child, done };
}

async function waitFor(check, what, timeoutMs = 10000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (check()) return;
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  assert.fail(`timed out waiting for ${what}`);
}

const HOLDER = (readyFile, exit) => `
  const { withStateTx } = await import(${JSON.stringify(HOT_LOCK_URL)});
  const fs = await import('node:fs');
  withStateTx(process.argv[1], () => {
    fs.writeFileSync(${JSON.stringify(readyFile)}, String(process.pid));
    ${exit}
  }, { prefetched: { writer: ${WRITER} } });
`;

test('the record of a holder carries its creation time', { skip: SKIP }, async () => {
  const f = fixture();
  try {
    const ready = path.join(f.dir, 'ready');
    const release = path.join(f.dir, 'release');
    const holder = runChild(HOLDER(ready, `while (!fs.existsSync(${JSON.stringify(release)})) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 20);`), [f.fgosDir]);
    await waitFor(() => fs.existsSync(ready), 'the holder to enter');
    const record = JSON.parse(fs.readFileSync(path.join(f.fgosDir, 'locks', 'state.hot'), 'utf8'));
    assert.equal(record.pid, Number(fs.readFileSync(ready, 'utf8')));
    assert.match(String(record.startTime), /^\d+$/, 'a Windows creation time (FILETIME), so the judge can tell the holder from a reused pid');
    fs.writeFileSync(release, 'go');
    const finished = await holder.done;
    assert.equal(finished.code, 0, finished.stderr);
  } finally {
    f.cleanup();
  }
});

test('a holder killed inside withStateTx is reclaimed by a second process within the wait', { skip: SKIP }, async () => {
  const f = fixture();
  try {
    const ready = path.join(f.dir, 'victim-ready');
    const victim = runChild(HOLDER(ready, `process.kill(process.pid, 'SIGKILL');`), [f.fgosDir]);
    const dead = await victim.done;
    assert.notEqual(dead.code, 0, 'the victim must not leave normally');
    assert.equal(fs.existsSync(path.join(f.fgosDir, 'locks', 'state.hot')), true, 'the victim left its record behind');

    const started = Date.now();
    const next = runChild(`
      const { withStateTx } = await import(${JSON.stringify(HOT_LOCK_URL)});
      withStateTx(process.argv[1], () => {}, { prefetched: { writer: ${WRITER} } });
    `, [f.fgosDir]);
    const result = await next.done;
    assert.equal(result.code, 0, result.stderr);
    assert.ok(Date.now() - started < 5000 + 3000, `reclaimed within the wait, took ${Date.now() - started} ms`);
    assert.equal(fs.existsSync(path.join(f.fgosDir, 'locks', 'state.hot')), false);
  } finally {
    f.cleanup();
  }
});

test('a live holder is never reclaimed, and a second process times out instead', { skip: SKIP }, async () => {
  const f = fixture();
  try {
    const ready = path.join(f.dir, 'ready');
    const release = path.join(f.dir, 'release');
    const holder = runChild(HOLDER(ready, `while (!fs.existsSync(${JSON.stringify(release)})) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 20);`), [f.fgosDir]);
    await waitFor(() => fs.existsSync(ready), 'the holder to enter');
    const recordBefore = fs.readFileSync(path.join(f.fgosDir, 'locks', 'state.hot'), 'utf8');

    const waiter = runChild(`
      const { withStateTx } = await import(${JSON.stringify(HOT_LOCK_URL)});
      try {
        withStateTx(process.argv[1], () => {}, { prefetched: { writer: ${WRITER} } });
        process.stdout.write('entered');
      } catch (err) {
        process.stdout.write(err.code);
      }
    `, [f.fgosDir]);
    const answered = await waiter.done;
    assert.equal(answered.stdout, 'hot-lock-timeout', answered.stderr);
    assert.equal(fs.readFileSync(path.join(f.fgosDir, 'locks', 'state.hot'), 'utf8'), recordBefore, 'the live holder keeps its record');

    fs.writeFileSync(release, 'go');
    const finished = await holder.done;
    assert.equal(finished.code, 0, finished.stderr);
  } finally {
    f.cleanup();
  }
});

// A process that opens `file` with no sharing, which is what makes another process's read or unlink of it fail
// with a sharing violation. It retries until the file exists, then keeps the handle for `seconds`.
function holdOpenWithoutSharing(file, seconds) {
  const script = `$p = ${JSON.stringify(file).replace(/"/g, "'")}; $h = $null;`
    + ' while (-not $h) { try { $h = [System.IO.File]::Open($p, "Open", "Read", "None") } catch { Start-Sleep -Milliseconds 5 } };'
    + ` Start-Sleep -Seconds ${seconds}; $h.Close()`;
  return spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], { stdio: 'ignore' });
}

test('a record another process holds open is waited on to the timeout, named, and never spun on or reclaimed', { skip: SKIP }, async () => {
  const f = fixture();
  let holder;
  try {
    const record = path.join(f.fgosDir, 'locks', 'state.hot');
    fs.mkdirSync(path.dirname(record), { recursive: true });
    fs.writeFileSync(record, JSON.stringify({ v: 1, pid: 1 }));
    holder = holdOpenWithoutSharing(record, 9);
    await new Promise((resolve) => setTimeout(resolve, 500));
    const started = Date.now();
    const run = runChild(`
      const { withStateTx } = await import(${JSON.stringify(HOT_LOCK_URL)});
      try {
        withStateTx(process.argv[1], () => 'entered', { prefetched: { writer: ${WRITER} } });
        console.log('ENTERED');
      } catch (err) {
        console.log(JSON.stringify({ code: err.code, message: err.message }));
      }
    `, [f.fgosDir]);
    const result = await run.done;
    const answer = JSON.parse(result.stdout.trim());
    assert.equal(answer.code, 'hot-lock-timeout');
    assert.match(answer.message, /open by another process/);
    assert.match(answer.message, /fgos lock fence state/);
    assert.ok(Date.now() - started >= 4500, 'waited out the timeout');
  } finally {
    holder?.kill();
    f.cleanup();
  }
});

test('a release whose unlink stays sharing-blocked throws hot-lock-release-stuck and leaves the record', { skip: SKIP }, async () => {
  const f = fixture();
  let holder;
  try {
    const record = path.join(f.fgosDir, 'locks', 'state.hot');
    holder = holdOpenWithoutSharing(record, 6);
    const run = runChild(`
      const { withStateTx } = await import(${JSON.stringify(HOT_LOCK_URL)});
      try {
        withStateTx(process.argv[1], () => {
          // the record is linked; wait until the other process has it open without sharing
          Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1500);
        }, { prefetched: { writer: ${WRITER} } });
        console.log('RELEASED');
      } catch (err) {
        console.log(JSON.stringify({ code: err.code, path: err.path }));
      }
    `, [f.fgosDir]);
    const result = await run.done;
    const answer = JSON.parse(result.stdout.trim());
    assert.equal(answer.code, 'hot-lock-release-stuck');
    assert.ok(fs.existsSync(record), 'the record stays');
  } finally {
    holder?.kill();
    f.cleanup();
  }
});
