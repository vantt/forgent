import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { initStore, addWork, listWork, readRawEvents, EXIT_CODES } from '../../src/state/store.mjs';
import { acquireRunnerLock, runOnce, EXIT_BUSY } from '../../src/runner/loop.mjs';
import { probe } from '../../src/holder-lock/index.mjs';
import { holdStateLockInChild } from '../helpers/hold-state-lock-in-child.mjs';

const LOOP_MOD_PATH = fileURLToPath(new URL('../../src/runner/loop.mjs', import.meta.url));

// Inter-process exclusivity for the runner: the `runner` kernel lock at
// `.fgos/locks/runner.lock`. Every test
// builds its own disposable git repo (git init in mkdtemp) with its own
// `.fgos/` inside it; nothing here touches THIS repo (forgent itself).

const noLog = () => {};

function initTempRepo() {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-lock-test-repo-'));
  execFileSync('git', ['init', '-q'], { cwd: repoRoot });
  execFileSync('git', ['config', 'user.email', 'test@example.com'], { cwd: repoRoot });
  execFileSync('git', ['config', 'user.name', 'Test'], { cwd: repoRoot });
  fs.writeFileSync(path.join(repoRoot, 'seed.txt'), 'seed\n');
  execFileSync('git', ['add', 'seed.txt'], { cwd: repoRoot });
  execFileSync('git', ['commit', '-q', '-m', 'init'], { cwd: repoRoot });
  return repoRoot;
}

function setup() {
  const repoRoot = initTempRepo();
  const dir = path.join(repoRoot, '.fgos');
  initStore(dir);
  const worktreeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-lock-test-wt-'));
  return { repoRoot, dir, worktreeDir };
}

function seedItem(dir, overrides = {}) {
  addWork(dir, {
    id: 'item-x',
    title: 'Produce the output file',
    kind: 'feature',
    status: 'todo',
    deps: [],
    risk: 'light',
    refs: [],
    verify: 'test -f output.txt',
    ...overrides,
  });
}

function fgwBranches(repoRoot) {
  const out = execFileSync('git', ['branch', '--list', 'fgw/*'], { cwd: repoRoot, encoding: 'utf8' });
  return out.split('\n').filter(Boolean);
}

// --- exit code contract ----------------------------------------------------

test('EXIT_BUSY collides with no existing exit code (0 ok, 1 unexpected, R4 category map)', () => {
  const taken = new Set([0, 1, ...Object.values(EXIT_CODES)]);
  assert.equal(taken.has(EXIT_BUSY), false);
});

// A held events.lock (distinct from runner.lock above) is a transient,
// documented-as-retryable condition (events.mjs's own EventLogError message:
// "another process is writing; retry the operation") — NOT an uncategorized
// bug. Before EXIT_CODES carried a 'lock-timeout' entry, categoryOf's
// undefined-exitCode fallback made claimAndDispatch/runOnce re-throw it
// exactly like a real crash: the whole drain-run aborted, losing every
// already-dispatched item's structured result (review-unreviewed-260717,
// corroborated by two independent reviewers). This proves the fix: runOnce
// returns its structured result with the distinct exit code instead of
// throwing. Real contention, not a mock — another process sits inside the state critical section while this one waits out the lock timeout.
test('a held state lock halts the drain-run gracefully (lock-timeout exit code, no throw)', async () => {
  const { repoRoot, dir, worktreeDir } = setup();
  seedItem(dir);
  const holder = await holdStateLockInChild(dir);

  try {
    const result = await runOnce({ repoRoot, dir, worktreeDir, log: noLog });
    assert.equal(result.outcome, 'drained');
    assert.equal(result.exitCode, EXIT_CODES['lock-timeout']);
    assert.equal(result.dispatched.length, 1);
    assert.equal(result.dispatched[0].outcome, 'halted');
    assert.equal(result.dispatched[0].errorClass, 'lock-timeout');
  } finally {
    await holder.release();
  }
});

// --- overlapping runs ------------------------------------------------------

test('second overlapping runOnce exits busy: zero store writes, zero worktree ops, holder lock untouched', async () => {
  const { repoRoot, dir, worktreeDir } = setup();
  seedItem(dir);
  // The "first runner" is this test process holding the runner lock for the
  // whole call — exactly what a concurrent run does for its lifetime.
  const holder = acquireRunnerLock(dir);
  assert.equal(holder.acquired, true);
  try {
    const eventsBefore = readRawEvents(dir).length;

    const result = await runOnce({ repoRoot, config: { timeoutMs: 5000 }, worktreeDir, log: noLog });

    assert.equal(result.outcome, 'busy');
    assert.equal(result.exitCode, EXIT_BUSY);
    assert.equal(result.holderPid, process.pid);
    // zero store writes: no reap, no claim — the seeded item never moved
    assert.equal(readRawEvents(dir).length, eventsBefore);
    assert.equal(listWork(dir).work['item-x'].status, 'todo');
    // zero worktree ops: no fgw branch, no checkout directory
    assert.deepEqual(fgwBranches(repoRoot), []);
    assert.deepEqual(fs.readdirSync(worktreeDir), []);
    // the live holder still holds the lock after the busy exit
    assert.equal(probe('runner', { fgosDir: dir }).result, 'held');
  } finally {
    holder.release();
  }
});

/** Start a separate Node process that takes the runner lock of `dir` and
 * keeps it until killed; resolves `{ child, exited }` once it holds it. */
async function spawnRunnerLockHolder(dir) {
  const readyPath = path.join(dir, `holder-ready-${Date.now()}`);
  const child = spawn(process.execPath, ['--input-type=module', '-e', `
    import fs from 'node:fs';
    import { acquireRunnerLock } from ${JSON.stringify(LOOP_MOD_PATH)};
    const lock = acquireRunnerLock(${JSON.stringify(dir)});
    if (!lock.acquired) process.exit(3);
    fs.writeFileSync(${JSON.stringify(readyPath)}, String(process.pid));
    setInterval(() => {}, 1000);
  `], { stdio: 'ignore' });
  const exited = new Promise((resolve) => child.once('exit', (code, signal) => resolve({ code, signal })));
  const deadline = Date.now() + 5000;
  while (!fs.existsSync(readyPath)) {
    assert.ok(Date.now() < deadline, 'holder process never acquired the runner lock');
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  return { child, exited };
}

test('a runner killed with SIGKILL releases its lock at once: the next runOnce acquires and proceeds', { skip: process.platform === 'win32' && 'SIGKILL is POSIX-only' }, async () => {
  const { repoRoot, dir, worktreeDir } = setup();
  const { child, exited } = await spawnRunnerLockHolder(dir);

  const busy = await runOnce({ repoRoot, config: { timeoutMs: 5000 }, worktreeDir, log: noLog });
  assert.equal(busy.outcome, 'busy');
  assert.equal(busy.holderPid, child.pid);

  child.kill('SIGKILL');
  assert.equal((await exited).signal, 'SIGKILL');

  // empty frontier: proceeding past the lock means reaching the idle path
  const next = await runOnce({ repoRoot, config: { timeoutMs: 5000 }, worktreeDir, log: noLog });
  assert.equal(next.outcome, 'idle');
  assert.equal(next.exitCode, 0);
  assert.equal(probe('runner', { fgosDir: dir }).result, 'free');
});

// --- acquire/release primitive --------------------------------------------

// Real separate OS processes with a shared start barrier, each holding the
// lock for a moment when it wins: at no instant do two of them hold it. A
// winner marks its critical section with an exclusive (`wx`) file; a second
// winner overlapping it would fail that create. Some racers are SIGKILLed
// while they hold, which must free the lock for the rest.
test('concurrent acquireRunnerLock from real separate OS processes: never two holders at once, including holders killed mid-hold', { skip: process.platform === 'win32' && 'SIGKILL is POSIX-only' }, async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-lock-test-dir-'));
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-lock-test-out-'));
  const insidePath = path.join(outDir, 'inside');
  const N = 16;
  const startAt = Date.now() + 500;
  const childScript = `
    const fs = require('node:fs');
    const { pathToFileURL } = require('node:url');
    const [modPath, dir, startAtArg, outFile, insidePath, dieWhileHolding] = process.argv.slice(1);
    const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
    import(pathToFileURL(modPath).href)
      .then((m) => {
        const waitMs = Number(startAtArg) - Date.now();
        if (waitMs > 0) sleep(waitMs);
        let wins = 0;
        let violations = 0;
        for (const deadline = Date.now() + 1500; Date.now() < deadline;) {
          const result = m.acquireRunnerLock(dir);
          if (!result.acquired) { sleep(5); continue; }
          wins += 1;
          try { fs.writeFileSync(insidePath, String(process.pid), { flag: 'wx' }); } catch { violations += 1; }
          sleep(10);
          if (dieWhileHolding === '1') {
            // leave the critical section, then die still holding the lock
            fs.unlinkSync(insidePath);
            process.kill(process.pid, 'SIGKILL');
          }
          try { fs.unlinkSync(insidePath); } catch {}
          result.release();
          sleep(5);
        }
        fs.writeFileSync(outFile, JSON.stringify({ wins, violations }));
      })
      .catch((e) => { fs.writeFileSync(outFile, JSON.stringify({ error: String(e && e.stack || e) })); process.exitCode = 1; });
  `;
  function forkAcquire(i) {
    const outFile = path.join(outDir, `r${i}.json`);
    const dieWhileHolding = i % 4 === 0 ? '1' : '0';
    return new Promise((resolve, reject) => {
      const child = spawn(process.execPath, ['-e', childScript, LOOP_MOD_PATH, dir, String(startAt), outFile, insidePath, dieWhileHolding], {
        stdio: ['ignore', 'ignore', 'pipe'],
      });
      let stderr = '';
      child.stderr.on('data', (d) => {
        stderr += d;
      });
      child.on('error', reject);
      child.on('exit', (code, signal) => {
        if (signal === 'SIGKILL' && dieWhileHolding === '1') {
          resolve({ killed: true });
          return;
        }
        if (code === 0) resolve(JSON.parse(fs.readFileSync(outFile, 'utf8')));
        else reject(new Error(`child exited ${code ?? signal}: ${stderr}`));
      });
    });
  }

  try {
    const results = await Promise.all(Array.from({ length: N }, (_, i) => forkAcquire(i)));
    const survivors = results.filter((r) => !r.killed);
    assert.ok(results.length > survivors.length, `at least one holder died holding the lock: ${JSON.stringify(results)}`);
    assert.equal(survivors.reduce((sum, r) => sum + r.violations, 0), 0, `two holders overlapped: ${JSON.stringify(results)}`);
    // the lock kept changing hands after the kills: the survivors won too
    assert.ok(survivors.reduce((sum, r) => sum + r.wins, 0) >= survivors.length, `the lock stopped changing hands: ${JSON.stringify(results)}`);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
    fs.rmSync(outDir, { recursive: true, force: true });
  }
});

test('acquireRunnerLock: wins once, refuses a live holder naming its pid, release frees it', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-lock-test-dir-'));
  const first = acquireRunnerLock(dir);
  assert.equal(first.acquired, true);
  assert.equal(first.lockPath, path.join(dir, 'locks', 'runner.lock'));

  const second = acquireRunnerLock(dir);
  assert.equal(second.acquired, false);
  assert.equal(second.holderPid, process.pid);

  first.release();
  // released — a new acquire succeeds again
  const third = acquireRunnerLock(dir);
  assert.equal(third.acquired, true);
  third.release();
});

test('release twice is a no-op', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-lock-test-dir-'));
  const lock = acquireRunnerLock(dir);
  lock.release();
  lock.release(); // must not throw
});
