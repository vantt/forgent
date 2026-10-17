// The full-suite queue on the real `full-suite` kernel lock, with real
// processes and the real host route. Every case passes its own lockRoot:
// the suite running these tests holds the machine's queue itself.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolveActiveHostBin } from '../../src/util/host-bin-path.mjs';
import { probe } from '../../src/holder-lock/index.mjs';
import {
  acquireFullSuiteQueue,
  POLL_MS,
  QUEUE_HELD_ENV,
  QUEUE_SWITCH_ENV,
} from '../../scripts/lib/full-suite-queue.mjs';
import { runTests } from '../../scripts/run-tests.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const QUEUE_URL = pathToFileURL(path.join(root, 'scripts', 'lib', 'full-suite-queue.mjs')).href;
const { bin: HOST_BIN } = resolveActiveHostBin({ fgosDir: path.join(root, '.fgos') });
const NEEDS_HOST = HOST_BIN ? false : 'no fgos host binary: set FGOS_HOST_BIN to a host built with the internal lock-fd route';
const NEEDS_HOST_POSIX = NEEDS_HOST || (process.platform === 'win32' && 'SIGKILL is POSIX-only');

const dirs = [];
const children = [];
after(() => {
  for (const child of children) {
    try {
      process.kill(child, 'SIGKILL');
    } catch {
      // already gone
    }
  }
  for (const dir of dirs) fs.rmSync(dir, { recursive: true, force: true });
});

function tmpDir(prefix) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  dirs.push(dir);
  return dir;
}

const quiet = { log: () => {}, env: {} };

// A process that takes the queue through the real lib, starts a long-lived
// child of its own (as the suite's children are), prints both pids, and
// holds until killed.
const HOLDER = `
import { spawn } from 'node:child_process';
const { acquireFullSuiteQueue } = await import(process.env.QUEUE_URL);
acquireFullSuiteQueue({ env: {}, lockRoot: process.env.LOCK_ROOT, log: () => {} });
const child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { stdio: 'ignore' });
process.stdout.write(JSON.stringify({ pid: process.pid, childPid: child.pid }) + '\\n');
setInterval(() => {}, 1000);
`;

// A process that waits for the queue with the real poll and reports when it got it.
const WAITER = `
const { acquireFullSuiteQueue } = await import(process.env.QUEUE_URL);
acquireFullSuiteQueue({ env: {}, lockRoot: process.env.LOCK_ROOT });
process.stdout.write(JSON.stringify({ acquiredAt: Date.now() }) + '\\n');
`;

function childEnv(extra) {
  return { ...process.env, FGOS_HOST_BIN: HOST_BIN, QUEUE_URL, ...extra };
}

function startNode(body, env) {
  const child = spawn(process.execPath, ['--input-type=module', '-e', body], { env, stdio: ['ignore', 'pipe', 'pipe'] });
  children.push(child.pid);
  const out = { stdout: '', stderr: '' };
  child.stdout.on('data', (chunk) => { out.stdout += chunk; });
  child.stderr.on('data', (chunk) => { out.stderr += chunk; });
  const exited = new Promise((resolve) => child.on('exit', (code, signal) => resolve({ code, signal })));
  return { child, out, exited };
}

async function waitFor(check, what, timeoutMs = 20_000) {
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const value = check();
    if (value) return value;
    if (Date.now() > deadline) throw new Error(`timed out waiting for ${what}`);
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

function firstLine(text) {
  const line = text.split('\n').find((l) => l.trim() !== '');
  return line ? JSON.parse(line) : null;
}

test('acquires a free queue as a kernel lock under lockRoot; release frees it and is idempotent', { skip: NEEDS_HOST }, () => {
  const lockRoot = tmpDir('full-suite-queue-');
  const release = acquireFullSuiteQueue({ ...quiet, lockRoot });
  assert.equal(probe('full-suite', { lockRoot }).result, 'held');
  release();
  assert.equal(probe('full-suite', { lockRoot }).result, 'free');
  release();
  assert.equal(probe('full-suite', { lockRoot }).result, 'free');
});

test('a second run waits on a live holder, announcing its pid once; the holder SIGKILLed lets it in within one poll, and the holder\'s own child never kept the queue', { skip: NEEDS_HOST_POSIX }, async () => {
  const lockRoot = tmpDir('full-suite-queue-');
  const holder = startNode(HOLDER, childEnv({ LOCK_ROOT: lockRoot }));
  const { pid, childPid } = await waitFor(() => firstLine(holder.out.stdout), 'the holder to take the queue');
  children.push(childPid);

  const waiter = startNode(WAITER, childEnv({ LOCK_ROOT: lockRoot }));
  await waitFor(() => /another full-suite run holds/.test(waiter.out.stderr), 'the waiter to announce the holder');
  assert.match(waiter.out.stderr, new RegExp(`\\(pid ${pid}\\)`), 'the announced holder is the run, not its child');

  // Two more polls go by: still waiting, still announced once.
  await new Promise((resolve) => setTimeout(resolve, POLL_MS * 2));
  assert.equal(waiter.out.stdout, '', 'waits while the holder lives');
  assert.equal(waiter.out.stderr.match(/another full-suite run holds/g).length, 1, 'holder announced once, not every poll');

  const killedAt = Date.now();
  process.kill(pid, 'SIGKILL');
  assert.equal((await holder.exited).signal, 'SIGKILL');
  const { acquiredAt } = await waitFor(() => firstLine(waiter.out.stdout), 'the waiter to take the queue');
  // The holder's child is still alive here, so the lock was never its.
  assert.doesNotThrow(() => process.kill(childPid, 0), 'the holder\'s child outlived it');
  assert.ok(acquiredAt - killedAt <= POLL_MS + 1000, `waiter entered ${acquiredAt - killedAt} ms after the kill, more than one ${POLL_MS} ms poll`);
  assert.match(waiter.out.stderr, /queue acquired after \d+s/);
  assert.equal((await waiter.exited).code, 0);
  assert.equal(probe('full-suite', { lockRoot }).result, 'free', 'the waiter released on exit');
});

test('never takes the lock when switched off or when a parent run already holds it', { skip: NEEDS_HOST_POSIX }, async () => {
  const lockRoot = tmpDir('full-suite-queue-');
  const holder = startNode(HOLDER, childEnv({ LOCK_ROOT: lockRoot }));
  const { pid, childPid } = await waitFor(() => firstLine(holder.out.stdout), 'the holder to take the queue');
  children.push(childPid);
  for (const env of [{ [QUEUE_SWITCH_ENV]: 'off' }, { [QUEUE_HELD_ENV]: '1' }]) {
    const release = acquireFullSuiteQueue({ env, lockRoot, log: () => {}, sleep: () => assert.fail('must not wait') });
    release();
    assert.equal(probe('full-suite', { lockRoot }).result, 'held', 'the other holder still has the queue');
  }
  process.kill(pid, 'SIGKILL');
  await holder.exited;
});

test('without a host binary the queue stops with lock-driver-unavailable and names the way to run unqueued', () => {
  const cwd = tmpDir('full-suite-queue-nohost-');
  const env = { ...process.env, QUEUE_URL, FGOS_HOST_BIN: path.join(cwd, 'no-such-fgos') };
  delete env.FGOS_STATE_ROOT;
  const body = `
const { acquireFullSuiteQueue } = await import(process.env.QUEUE_URL);
try {
  acquireFullSuiteQueue({ env: {} });
  process.stdout.write(JSON.stringify({ acquired: true }) + '\\n');
} catch (err) {
  process.stdout.write(JSON.stringify({ code: err.code, message: err.message }) + '\\n');
}
`;
  const res = spawnSync(process.execPath, ['--input-type=module', '-e', body], { cwd, env, encoding: 'utf8', timeout: 20_000 });
  const line = firstLine(res.stdout);
  assert.ok(line, `no answer from the child: ${res.stderr}`);
  assert.equal(line.code, 'lock-driver-unavailable');
  assert.match(line.message, new RegExp(`${QUEUE_SWITCH_ENV}=off`));
});

test('runTests takes the queue only when there are files to run, marks the child env, and releases after', () => {
  const dir = tmpDir('full-suite-queue-runtests-');
  let acquired = 0;
  let released = 0;
  const queue = () => { acquired += 1; return () => { released += 1; }; };

  const empty = runTests({ root: dir, queue });
  assert.equal(empty.status, 1);
  assert.equal(acquired, 0, 'a refused empty run never queues');

  fs.writeFileSync(path.join(dir, 'a.test.mjs'), '');
  let childEnvSeen;
  const result = runTests({
    root: dir,
    cwd: dir,
    queue,
    env: {},
    spawn: (_exec, _argv, opts) => { childEnvSeen = opts.env; return { status: 0 }; },
  });
  assert.equal(result.status, 0);
  assert.equal(acquired, 1);
  assert.equal(released, 1);
  assert.equal(childEnvSeen[QUEUE_HELD_ENV], '1');
});
