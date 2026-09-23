import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  acquireFullSuiteQueue,
  isPidAlive,
  QUEUE_HELD_ENV,
  QUEUE_SWITCH_ENV,
} from '../../scripts/lib/full-suite-queue.mjs';
import { runTests } from '../../scripts/run-tests.mjs';

function tmpLockPath() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'full-suite-queue-test-'));
  return path.join(dir, 'queue.lock');
}

function deadPid() {
  return spawnSync(process.execPath, ['-e', 'process.stdout.write(String(process.pid))'], { encoding: 'utf8' }).stdout * 1;
}

const quiet = { log: () => {}, env: {} };

test('acquires a free queue, records the owner, and release removes the lock', () => {
  const lockPath = tmpLockPath();
  const release = acquireFullSuiteQueue({ ...quiet, lockPath, cwd: '/some/worktree' });
  const holder = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
  assert.equal(holder.pid, process.pid);
  assert.equal(holder.cwd, '/some/worktree');
  release();
  assert.equal(fs.existsSync(lockPath), false);
  release(); // idempotent
});

test('waits while a live run holds the queue, announcing the holder once, then takes it when freed', () => {
  const lockPath = tmpLockPath();
  fs.writeFileSync(lockPath, JSON.stringify({ pid: 424242, cwd: '/other/worktree', startedAt: 'earlier' }));
  const logs = [];
  let sleeps = 0;
  const release = acquireFullSuiteQueue({
    lockPath,
    env: {},
    isAlive: (pid) => pid === 424242,
    log: (msg) => logs.push(msg),
    sleep: () => {
      sleeps += 1;
      if (sleeps === 3) fs.unlinkSync(lockPath); // the other run finishes
    },
  });
  assert.equal(sleeps, 3);
  assert.equal(logs.filter((m) => m.includes('pid 424242')).length, 1, 'holder announced once, not every poll');
  assert.match(logs[0], /\/other\/worktree/);
  assert.equal(JSON.parse(fs.readFileSync(lockPath, 'utf8')).pid, process.pid);
  release();
});

test('reclaims a stale lock left by a dead run without waiting', () => {
  const lockPath = tmpLockPath();
  fs.writeFileSync(lockPath, JSON.stringify({ pid: deadPid(), cwd: '/crashed', startedAt: 'earlier' }));
  let slept = false;
  const release = acquireFullSuiteQueue({ ...quiet, lockPath, sleep: () => { slept = true; } });
  assert.equal(slept, false);
  assert.equal(JSON.parse(fs.readFileSync(lockPath, 'utf8')).pid, process.pid);
  release();
});

test('never takes the lock when switched off or when a parent run already holds it', () => {
  for (const env of [{ [QUEUE_SWITCH_ENV]: 'off' }, { [QUEUE_HELD_ENV]: '1' }]) {
    const lockPath = tmpLockPath();
    fs.writeFileSync(lockPath, JSON.stringify({ pid: process.ppid, cwd: '/parent', startedAt: 'earlier' }));
    const release = acquireFullSuiteQueue({ lockPath, env, log: () => {}, sleep: () => assert.fail('must not wait') });
    release();
    assert.equal(JSON.parse(fs.readFileSync(lockPath, 'utf8')).cwd, '/parent', 'the other holder\'s lock is untouched');
  }
});

test('isPidAlive: true for this process, false for an exited one', () => {
  assert.equal(isPidAlive(process.pid), true);
  assert.equal(isPidAlive(deadPid()), false);
});

test('runTests takes the queue only when there are files to run, marks the child env, and releases after', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'full-suite-queue-runtests-'));
  let acquired = 0;
  let released = 0;
  const queue = () => { acquired += 1; return () => { released += 1; }; };

  const empty = runTests({ root, queue });
  assert.equal(empty.status, 1);
  assert.equal(acquired, 0, 'a refused empty run never queues');

  fs.writeFileSync(path.join(root, 'a.test.mjs'), '');
  let childEnv;
  const result = runTests({
    root,
    cwd: root,
    queue,
    env: {},
    spawn: (_exec, _argv, opts) => { childEnv = opts.env; return { status: 0 }; },
  });
  assert.equal(result.status, 0);
  assert.equal(acquired, 1);
  assert.equal(released, 1);
  assert.equal(childEnv[QUEUE_HELD_ENV], '1');
});
