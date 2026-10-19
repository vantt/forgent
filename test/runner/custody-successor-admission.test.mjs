import '../helpers/process-tmp-root.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { acquireSync, createLockScope, predecessorState, probe, resolveLock } from '../../src/holder-lock/index.mjs';
import { admitSuccessor, recordCustodyHandoff } from '../../src/runner/dispatch/cwd-lock.mjs';
import { acquireAttemptLocks } from '../../src/run-supervisor/direct-launch.mjs';

const skip = process.platform !== 'linux' ? 'real Linux flock/process identity vectors' : false;
const identity = new URL('../../src/runner/dispatch/process-identity.mjs', import.meta.url).href;

function fixture(t) {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-custody-admit-'));
  t.after(() => fs.rmSync(cwd, { recursive: true, force: true }));
  const fgosDir = path.join(cwd, '.fgos');
  const params = { fgosDir, cwd };
  const lockPath = resolveLock('dispatch-cwd', params).v3Path;
  fs.mkdirSync(path.dirname(lockPath), { recursive: true });
  return { cwd, fgosDir, params, lockPath, record: `${lockPath}.predecessor.json` };
}

for (const kind of ['linux-pgroup', 'macos-tree']) {
  test(`a dead ${kind} predecessor remains unknown and its record is preserved`, { skip }, (t) => {
    const f = fixture(t);
    const raw = { v: 1, domainKind: kind, domainId: { host: 'other', bootId: 'old-boot', pidNs: 'old-ns', pid: 2147483647, startTime: '0' } };
    fs.writeFileSync(f.record, JSON.stringify(raw));
    assert.throws(() => admitSuccessor(createLockScope('successor'), f.fgosDir, f.cwd), { code: 'custody-predecessor-unknown' });
    assert.deepEqual(JSON.parse(fs.readFileSync(f.record)), raw);
    assert.equal(probe('dispatch-cwd', f.params).result, 'free');
    // This is the under-lock check too: ordinary cleanup must not erase a record
    // written between a contender's read-only observation and its acquire.
    assert.throws(() => acquireSync(createLockScope('atomic-policy'), 'dispatch-cwd', { ...f.params, predecessorKinds: ['linux-gate', 'windows-job'] }), { code: 'lock-predecessor-domain-not-empty' });
    assert.deepEqual(JSON.parse(fs.readFileSync(f.record)), raw);
  });
}

test('an unreadable or unknown predecessor refuses without deleting evidence', { skip }, (t) => {
  const f = fixture(t);
  fs.writeFileSync(f.record, 'broken');
  assert.throws(() => admitSuccessor(createLockScope('unknown'), f.fgosDir, f.cwd), { code: 'custody-predecessor-unknown' });
  assert.equal(fs.readFileSync(f.record, 'utf8'), 'broken');
});

test('twenty successor generations never overlap; failover attempts reuse the same lease', { skip }, (t) => {
  const f = fixture(t);
  for (let n = 0; n < 20; n += 1) {
    const custody = admitSuccessor(createLockScope(`unit-${n}`), f.fgosDir, f.cwd);
    try {
      for (let attempt = 1; attempt <= 2; attempt += 1) {
        const locks = acquireAttemptLocks({ ...f, assignmentDir: path.join(f.cwd, `assignment-${n}`), attemptStr: String(attempt).padStart(2, '0'), mutating: true, custody });
        assert.equal(locks.cwdLease, custody);
        locks.releaseAttempt();
        locks.release();
        assert.equal(custody.released, false);
        assert.throws(() => admitSuccessor(createLockScope('contender'), f.fgosDir, f.cwd), { code: 'dispatch-in-flight' });
      }
      custody.clearDomain();
    } finally { custody.release(); }
    assert.equal(probe('dispatch-cwd', f.params).result, 'free');
  }
});

test('clearDomain cannot erase a live domain, then records handoff after it exits', { skip }, async (t) => {
  const f = fixture(t);
  const handle = admitSuccessor(createLockScope('holder'), f.fgosDir, f.cwd);
  const child = spawn(process.execPath, ['--input-type=module', '-e', `
    import { localObserver, getProcessStartTime } from ${JSON.stringify(identity)};
    process.stdout.write(JSON.stringify({ ...localObserver(), pid: process.pid, startTime: getProcessStartTime(process.pid) }) + '\\n');
    process.stdin.resume();
  `], { stdio: ['pipe', 'pipe', 'inherit'], detached: true });
  t.after(() => { child.kill('SIGKILL'); if (!handle.released) handle.release(); });
  const [data] = await once(child.stdout, 'data');
  const tuple = JSON.parse(String(data));
  fs.writeFileSync(f.record, JSON.stringify({ v: 1, domainKind: 'linux-pgroup', domainId: tuple }));
  assert.throws(() => handle.clearDomain());
  const committed = { outcome: 'pass', commit: { status: 'committed', sha: 'already-recorded' } };
  recordCustodyHandoff(handle, committed);
  assert.equal(committed.outcome, 'pass');
  assert.equal(committed.commit.status, 'committed');
  assert.equal(committed.warnings[0].code, 'custody-handoff-not-recorded');
  assert.ok(fs.existsSync(f.record));
  child.stdin.end();
  await once(child, 'exit');
  handle.clearDomain();
  assert.equal(predecessorState(f.lockPath, { fgosDir: f.fgosDir }).state, 'absent');
  handle.release();
  assert.throws(() => handle.clearDomain(), { code: 'lock-handle-invalid' });
});

test('controller death with a setsid escapee keeps an unconfined worktree inadmissible', { skip }, async (t) => {
  const f = fixture(t);
  const actor = spawn(process.execPath, ['--input-type=module', '-e', `
    import fs from 'node:fs';
    import { spawn } from 'node:child_process';
    import { localObserver, getProcessStartTime } from ${JSON.stringify(identity)};
    import { admitSuccessor, recordCustodyHandoff } from ${JSON.stringify(new URL('../../src/runner/dispatch/cwd-lock.mjs', import.meta.url).href)};
    import { createLockScope } from ${JSON.stringify(new URL('../../src/holder-lock/index.mjs', import.meta.url).href)};
    const custody = admitSuccessor(createLockScope('controller'), ${JSON.stringify(f.fgosDir)}, ${JSON.stringify(f.cwd)});
    const child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { detached: true, stdio: 'ignore' });
    child.unref();
    fs.writeFileSync(${JSON.stringify(f.record)}, JSON.stringify({ v: 1, domainKind: 'linux-pgroup', domainId: { ...localObserver(), pid: process.pid, startTime: getProcessStartTime(process.pid) } }));
    process.stdout.write(String(child.pid) + '\\n');
    setInterval(() => {}, 1000);
  `], { stdio: ['ignore', 'pipe', 'inherit'], detached: true });
  const exited = once(actor, 'exit');
  const [data] = await once(actor.stdout, 'data');
  const escapedPid = Number(String(data).trim());
  t.after(() => { actor.kill('SIGKILL'); try { process.kill(escapedPid, 'SIGKILL'); } catch {} });
  actor.kill('SIGKILL'); await exited;
  assert.equal(probe('dispatch-cwd', f.params).result, 'free');
  process.kill(escapedPid, 0);
  assert.throws(() => admitSuccessor(createLockScope('successor'), f.fgosDir, f.cwd), (error) => {
    assert.equal(error.code, 'custody-predecessor-unknown');
    assert.equal(error.recovery.disposition, 'preserve');
    return true;
  });
  assert.ok(fs.existsSync(f.record));
});

test('an unsupervised mutating executor is refused before its process starts', { skip }, async (t) => {
  const f = fixture(t);
  const { executeExecutorCli } = await import('../../src/runner/dispatch/cli.mjs');
  fs.mkdirSync(f.fgosDir, { recursive: true });
  const marker = path.join(f.cwd, 'must-not-start');
  const runnerConfig = {
    executors: { fake: { kind: 'agent', command: process.execPath, args: ['-e', `require('fs').writeFileSync(${JSON.stringify(marker)}, 'started')`], allowCrossProvider: true, providerModel: 'fake' } },
    capabilities: { execute: { serves: { outputKind: 'change', mutates: true } } },
    modelPolicies: { fake: { standard: 'fake-standard' } },
    rigorToTier: { standard: 'standard' }, timeoutMs: 5000,
  };
  await assert.rejects(() => executeExecutorCli('fake', { cwd: f.cwd, repoRoot: f.cwd, runnerConfig, for: 'execute' }), (err) => {
    assert.equal(err.code, 'custody-domain-required');
    assert.equal(err.cwd, f.cwd);
    assert.equal(err.executorId, 'fake');
    assert.equal(err.capability, 'execute');
    return true;
  });
  assert.equal(fs.existsSync(marker), false);
});

test('an invalid handed custody lease reports the attempted producer context', { skip }, (t) => {
  const f = fixture(t);
  assert.throws(() => acquireAttemptLocks({ ...f, assignmentDir: path.join(f.cwd, 'assignment'), attemptStr: '01', mutating: true,
    custody: { released: true }, executorId: 'fake', capability: 'execute',
  }), (err) => {
    assert.equal(err.code, 'custody-required');
    assert.deepEqual(err.data, { cwd: f.cwd, executorId: 'fake', capability: 'execute' });
    return true;
  });
});

test('cwd identity includes birth time and cannot inherit a record keyed only by a recycled inode', { skip }, (t) => {
  const f = fixture(t);
  const stat = fs.statSync(f.cwd, { bigint: true });
  const inodeOnly = path.join(path.dirname(f.lockPath), `dispatch-cwd--${stat.dev}-${stat.ino}.lock`);
  fs.writeFileSync(`${inodeOnly}.predecessor.json`, 'stranded old generation');
  assert.notEqual(f.lockPath, inodeOnly);
  assert.ok(f.lockPath.includes(`${stat.dev}-${stat.ino}-${stat.birthtimeNs}`));
  const held = admitSuccessor(createLockScope('new-directory'), f.fgosDir, f.cwd);
  held.release();
  assert.equal(fs.readFileSync(`${inodeOnly}.predecessor.json`, 'utf8'), 'stranded old generation');
  const alias = path.join(f.cwd, 'alias');
  fs.symlinkSync(f.cwd, alias);
  assert.equal(resolveLock('dispatch-cwd', { ...f.params, cwd: alias }).v3Path, f.lockPath);
});

test('fd borrow capture honors a 64 MiB per-call limit and refuses overflow', { skip }, async (t) => {
  const { runBorrowed } = await import('../../src/holder-lock/index.mjs');
  const f = fixture(t);
  const held = admitSuccessor(createLockScope('capture'), f.fgosDir, f.cwd);
  try {
    const spec = { command: process.execPath, args: ['-e', "process.stdout.write('a'.repeat(17 * 1024 * 1024) + '\\0')"] };
    const answer = runBorrowed(held, { ...spec, maxOutputBytes: 64 * 1024 * 1024 });
    assert.equal(answer.exit, 0);
    assert.equal(answer.stdout.length, 17 * 1024 * 1024 + 1);
    assert.equal(answer.stdout.at(-1), '\0');
    assert.throws(() => runBorrowed(held, { ...spec, maxOutputBytes: 1024 }), { code: 'borrow-spawn-failed' });
  } finally { held.release(); }
});

test('best-effort handoff limitation: live controller clears a linux-pgroup record after a successful producer leaves a setsid escapee', { skip }, async (t) => {
  const f = fixture(t);
  const custody = admitSuccessor(createLockScope('live-controller'), f.fgosDir, f.cwd);
  const producer = spawn(process.execPath, ['--input-type=module', '-e', `
    import { spawn } from 'node:child_process';
    import { localObserver, getProcessStartTime } from ${JSON.stringify(identity)};
    const escapee = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { detached: true, stdio: 'ignore' });
    escapee.unref();
    process.stdout.write(JSON.stringify({ escapedPid: escapee.pid, tuple: { ...localObserver(), pid: process.pid, startTime: getProcessStartTime(process.pid) } }) + '\\n');
    process.stdin.resume();
  `], { detached: true, stdio: ['pipe', 'pipe', 'inherit'] });
  const [data] = await once(producer.stdout, 'data');
  const { escapedPid, tuple } = JSON.parse(String(data));
  t.after(() => { producer.kill('SIGKILL'); try { process.kill(escapedPid, 'SIGKILL'); } catch {} if (!custody.released) custody.release(); });
  fs.writeFileSync(f.record, JSON.stringify({ v: 1, domainKind: 'linux-pgroup', domainId: tuple }));
  const exit = once(producer, 'exit');
  producer.stdin.end();
  assert.deepEqual(await exit, [0, null]);
  process.kill(escapedPid, 0);
  const result = { outcome: 'pass' };
  recordCustodyHandoff(custody, result);
  assert.equal(result.warnings, undefined);
  assert.equal(predecessorState(f.lockPath, { fgosDir: f.fgosDir }).state, 'absent');
  process.kill(escapedPid, 0);
  custody.release();
  const successor = admitSuccessor(createLockScope('successor'), f.fgosDir, f.cwd);
  successor.release();
});

test('recreating a directory with a reused inode gets a new custody record key', { skip }, (t) => {
  const f = fixture(t);
  const directory = path.join(f.cwd, 'recreated');
  const seen = new Map();
  // Birth time is read from the kernel's timestamp clock, which on some kernels and filesystems
  // only advances every few milliseconds. Two generations created inside one tick are
  // indistinguishable by any birth-time key, so each generation waits past a tick: the invariant
  // under test is that a reused inode born at a later time gets a different key.
  const pause = new Int32Array(new SharedArrayBuffer(4));
  for (let generation = 0; generation < 128; generation += 1) {
    fs.mkdirSync(directory);
    const stat = fs.statSync(directory, { bigint: true });
    const key = `${stat.dev}-${stat.ino}`;
    const lockPath = resolveLock('dispatch-cwd', { fgosDir: f.fgosDir, cwd: directory }).v3Path;
    const previous = seen.get(key);
    if (previous) {
      assert.notEqual(lockPath, previous, 'birth time separates real inode reuse');
      return;
    }
    seen.set(key, lockPath);
    fs.rmdirSync(directory);
    Atomics.wait(pause, 0, 0, 20);
  }
  t.diagnostic('filesystem did not reuse a directory inode in 128 creations; deterministic birth-time and legacy-record checks cover the key');
});
