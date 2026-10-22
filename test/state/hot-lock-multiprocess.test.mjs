// Hot lock under real processes: the cleanup schedule that used to give two
// holders, a stress run with holders killed inside the critical section,
// zombie / unreadable / unjudgeable records, a foreign pid namespace, and the
// cost of the uncontended fast path against the lock this one replaced.
//
// Needs FGOS_HOST_BIN: cleaning a dead holder takes the reclaim kernel lock
// through the holder-lock facade, which runs the host helper.

import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { hotPaths, judgeHotRecord, readHotRecord, withStateTx } from '../../src/state/hot-lock.mjs';
import { observe } from '../../src/runner/dispatch/process-identity.mjs';
import { resolveWriterIdentity, IDENTITY_ENV_KEYS } from '../../src/util/session-identity.mjs';
import { uniqueTmpTag } from '../../src/util/unique-tmp-tag.mjs';
import { makeFixtureDir } from '../helpers/fixture-dir.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const HOT_LOCK_URL = new URL('../../src/state/hot-lock.mjs', import.meta.url).href;
const HOLDER_LOCK_URL = new URL('../../src/holder-lock/index.mjs', import.meta.url).href;
const LINUX = process.platform === 'linux';

function fixture(label) {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), `fgos-hot-${label}-`)));
  const fgosDir = path.join(dir, '.fgos');
  fs.mkdirSync(fgosDir, { recursive: true });
  return { dir, fgosDir, cleanup: () => fs.rmSync(dir, { recursive: true, force: true }) };
}

function childEnv(extra = {}) {
  const env = { ...process.env, ...extra };
  for (const key of IDENTITY_ENV_KEYS) delete env[key];
  return env;
}

function runChild(script, args = [], extraEnv = {}) {
  const child = spawn(process.execPath, ['--input-type=module', '-e', script, ...args], {
    env: childEnv(extraEnv),
    stdio: ['ignore', 'pipe', 'pipe'],
  });
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
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  assert.fail(`timed out waiting for ${what}`);
}

/** A pid that existed and is gone: its record is judged dead (absent). */
function deadRecord() {
  const result = spawnSync(process.execPath, ['-e', 'process.stdout.write(String(process.pid))'], { encoding: 'utf8' });
  const pid = Number(result.stdout);
  return { v: 1, pid, startTime: '1' };
}

function writeRecord(fgosDir, resource, record) {
  const { dir, record: file } = hotPaths(fgosDir, resource);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(file, typeof record === 'string' ? record : JSON.stringify(record), 'utf8');
  return file;
}

const WRITER = JSON.stringify('mp-test');

test('cleanup schedule: a second process cannot enter while the first cleaner holds the reclaim lock between reading and unlinking', async () => {
  const f = fixture('a1');
  try {
    const recordFile = writeRecord(f.fgosDir, 'state', deadRecord());
    const flags = (name) => path.join(f.dir, name);
    const cleaner = runChild(`
      const { readHotRecord, unlinkRecordIfUnchanged, hotPaths } = await import(${JSON.stringify(HOT_LOCK_URL)});
      const { acquireSync, createLockScope } = await import(${JSON.stringify(HOLDER_LOCK_URL)});
      const fs = await import('node:fs');
      const fgosDir = process.argv[1];
      const attempt = acquireSync(createLockScope('r1'), 'state', { fgosDir }, { waitMs: 3000 });
      if (attempt.result !== 'acquired') throw new Error('r1 did not get the reclaim lock');
      const seen = readHotRecord(hotPaths(fgosDir).record);
      fs.writeFileSync(${JSON.stringify(flags('r1-read'))}, 'read');
      while (!fs.existsSync(${JSON.stringify(flags('r1-go'))})) Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 10);
      unlinkRecordIfUnchanged(hotPaths(fgosDir).record, seen.raw);
      attempt.handle.release();
      fs.writeFileSync(${JSON.stringify(flags('r1-done'))}, 'done');
    `, [f.fgosDir]);
    await waitFor(() => fs.existsSync(flags('r1-read')), 'r1 to read the record');

    const entrant = runChild(`
      const { withStateTx } = await import(${JSON.stringify(HOT_LOCK_URL)});
      const fs = await import('node:fs');
      withStateTx(process.argv[1], () => {
        fs.appendFileSync(${JSON.stringify(flags('order'))}, fs.existsSync(${JSON.stringify(flags('r1-done'))}) ? 'r2-in-after-r1\\n' : 'r2-in-BEFORE-r1\\n');
      }, { prefetched: { writer: ${WRITER} } });
    `, [f.fgosDir]);
    await new Promise((resolve) => setTimeout(resolve, 600));
    assert.equal(fs.existsSync(flags('order')), false, 'r2 entered while r1 held the reclaim lock');

    fs.writeFileSync(flags('r1-go'), 'go');
    const [first, second] = await Promise.all([cleaner.done, entrant.done]);
    assert.equal(first.code, 0, first.stderr);
    assert.equal(second.code, 0, second.stderr);
    assert.equal(fs.readFileSync(flags('order'), 'utf8'), 'r2-in-after-r1\n');
    assert.equal(fs.existsSync(recordFile), false);
  } finally {
    f.cleanup();
  }
});

test('stress: 8 processes x 60 rounds with 10 holders killed inside the critical section never overlap', async () => {
  const f = fixture('stress');
  try {
    const marks = path.join(f.dir, 'marks.log');
    const worker = (victim) => runChild(`
      const { withStateTx } = await import(${JSON.stringify(HOT_LOCK_URL)});
      const fs = await import('node:fs');
      const victim = process.argv[2] === 'victim';
      const rounds = victim ? 1 : 60;
      for (let i = 0; i < rounds; i += 1) {
        withStateTx(process.argv[1], () => {
          fs.appendFileSync(${JSON.stringify(marks)}, 'in ' + process.pid + '\\n');
          if (victim) process.kill(process.pid, 'SIGKILL');
          fs.appendFileSync(${JSON.stringify(marks)}, 'out ' + process.pid + '\\n');
        }, { prefetched: { writer: ${WRITER} } });
      }
    `, [f.fgosDir, victim ? 'victim' : 'steady']);

    const steady = Array.from({ length: 8 }, () => worker(false));
    const victims = [];
    for (let i = 0; i < 10; i += 1) {
      victims.push(worker(true));
      await new Promise((resolve) => setTimeout(resolve, 30));
    }
    const steadyResults = await Promise.all(steady.map((w) => w.done));
    const victimResults = await Promise.all(victims.map((w) => w.done));
    steadyResults.forEach((r, i) => assert.equal(r.code, 0, `steady ${i}: ${r.stderr}`));
    victimResults.forEach((r, i) => assert.equal(r.signal, 'SIGKILL', `victim ${i}: ${r.stderr}`));

    const killed = new Set(victims.map((w) => String(w.child.pid)));
    let current = null;
    let outs = 0;
    const violations = [];
    for (const line of fs.readFileSync(marks, 'utf8').trim().split('\n')) {
      const [kind, pid] = line.split(' ');
      if (kind === 'in') {
        if (current !== null && !killed.has(current)) violations.push(`${pid} entered while ${current} was inside`);
        current = pid;
      } else {
        outs += 1;
        if (current !== pid) violations.push(`${pid} left while ${current} was inside`);
        current = null;
      }
    }
    assert.deepEqual(violations, []);
    assert.equal(outs, 8 * 60);
    // The last victim may still own the record when nobody was left to clean it.
    const left = readHotRecord(hotPaths(f.fgosDir).record);
    assert.ok(left.state === 'absent' || killed.has(String(left.record.pid)), 'only a killed holder may leave its record behind');
  } finally {
    f.cleanup();
  }
});

test('a zombie holder counts as dead and its record is cleaned', { skip: !LINUX && 'needs /proc' }, async () => {
  const f = fixture('zombie');
  let parent;
  try {
    // A python parent that never reaps leaves its finished child a zombie.
    parent = spawn('python3', ['-c', 'import subprocess,sys,time\np=subprocess.Popen(["true"])\nprint(p.pid,flush=True)\ntime.sleep(60)'], { stdio: ['ignore', 'pipe', 'ignore'] });
    let out = '';
    parent.stdout.on('data', (chunk) => { out += chunk; });
    await waitFor(() => /\d+\n/.test(out), 'the zombie pid');
    const pid = Number(out.trim());
    const stat = (() => { for (let i = 0; i < 100; i += 1) { const s = fs.readFileSync(`/proc/${pid}/stat`, 'utf8'); if (s.slice(s.lastIndexOf(')') + 2, s.lastIndexOf(')') + 3) === 'Z') return s; } return null; })();
    assert.ok(stat, 'the child became a zombie');
    const startTime = stat.slice(stat.lastIndexOf(')') + 2).split(' ')[19];
    writeRecord(f.fgosDir, 'state', { v: 1, pid, startTime });
    assert.equal(withStateTx(f.fgosDir, () => 'entered', { prefetched: { writer: 'mp-test' } }), 'entered');
  } finally {
    parent?.kill('SIGKILL');
    f.cleanup();
  }
});

test('a record that cannot be read or judged is never cleaned: the waiter times out as lock-record-unreadable, naming fgos lock fence, and the bytes stay', async () => {
  const cases = {
    garbage: '{"v":1,"pid":',
    noPid: JSON.stringify({ v: 1 }),
    // a live pid with no start time: nothing proves it dead
    unjudgeable: JSON.stringify({ v: 1, pid: process.pid }),
  };
  const runs = Object.entries(cases).map(async ([name, bytes]) => {
    const f = fixture(`held-${name}`);
    try {
      const file = writeRecord(f.fgosDir, 'state', bytes);
      const started = Date.now();
      const run = runChild(`
        const { withStateTx } = await import(${JSON.stringify(HOT_LOCK_URL)});
        try {
          withStateTx(process.argv[1], () => 'entered', { prefetched: { writer: ${WRITER} } });
          console.log('ENTERED');
        } catch (err) {
          console.log(JSON.stringify({ code: err.code, category: err.category, reason: err.reason ?? null, message: err.message }));
        }
      `, [f.fgosDir]);
      const result = await run.done;
      assert.equal(result.code, 0, `${name}: ${result.stderr}`);
      const answer = JSON.parse(result.stdout.trim());
      assert.equal(answer.code, 'hot-lock-timeout', name);
      assert.equal(answer.category, 'lock-timeout', name);
      assert.equal(answer.reason, 'lock-record-unreadable', name);
      assert.match(answer.message, /fgos lock fence/, `${name}: the timeout names the way out`);
      assert.ok(Date.now() - started >= 4500, `${name}: waited out the timeout`);
      assert.equal(fs.readFileSync(file, 'utf8'), bytes, `${name}: record untouched`);
    } finally {
      f.cleanup();
    }
  });
  await Promise.all(runs);
});

test('an observer in a foreign pid namespace never judges a record that has no namespace', { skip: !LINUX && 'needs /proc' }, (t) => {
  const f = fixture('n4');
  try {
    const script = `
      import { judge } from ${JSON.stringify(new URL('../../src/runner/dispatch/process-identity.mjs', import.meta.url).href)};
      const record = JSON.parse(process.argv[1]);
      process.stdout.write(judge(record));
    `;
    const record = JSON.stringify(deadRecord());
    const outside = spawnSync(process.execPath, ['--input-type=module', '-e', script, record], { encoding: 'utf8' });
    assert.equal(outside.stdout, 'dead');
    const inside = spawnSync('unshare', ['--user', '--map-root-user', '--pid', '--fork', '--mount-proc', process.execPath, '--input-type=module', '-e', script, record], { encoding: 'utf8' });
    if (inside.status !== 0) return t.skip(`not measured: this machine refuses unshare (${(inside.stderr || '').trim().slice(0, 120)})`);
    assert.equal(inside.stdout, 'unknown');
  } finally {
    f.cleanup();
  }
});

test('fast path: an uncontended acquire and release costs at most twice the raw file steps it is built on', (t) => {
  // On disk, where a project's .fgos lives: on tmpfs the syscalls are so cheap that the fixed JS
  // cost of a transaction dominates and the comparison stops saying anything about the mutex.
  const dir0 = makeFixtureDir('fgos-hot-bench-');
  const f = { fgosDir: path.join(dir0, '.fgos'), cleanup: () => fs.rmSync(dir0, { recursive: true, force: true }) };
  fs.mkdirSync(f.fgosDir, { recursive: true });
  try {
    resolveWriterIdentity(f.fgosDir); // prime the identity cache once, outside the timings
    withStateTx(f.fgosDir, () => {}); // creates the locks directory the raw steps share
    const { dir } = hotPaths(f.fgosDir);
    const rawRecord = path.join(dir, 'bench-raw.hot');
    const recordBytes = JSON.stringify({ v: 1, pid: process.pid, startTime: '1234567890', bootId: 'b'.repeat(36), writer: 'w'.repeat(40), at: new Date().toISOString() });
    // The steps the fast path cannot avoid: write the record beside its name, link it in, drop the
    // temporary name, and unlink the record on release.
    const runRaw = () => {
      const rawTmp = path.join(dir, `.bench-raw.tmp-${uniqueTmpTag()}`);
      fs.writeFileSync(rawTmp, recordBytes, 'utf8');
      fs.linkSync(rawTmp, rawRecord);
      fs.unlinkSync(rawTmp);
      fs.unlinkSync(rawRecord);
    };
    const runNow = () => withStateTx(f.fgosDir, () => {});

    const p50 = (samples) => samples.sort((a, b) => a - b)[Math.floor(samples.length / 2)];
    const time = (run) => {
      const t0 = process.hrtime.bigint();
      run();
      return Number(process.hrtime.bigint() - t0);
    };
    // The two sides alternate call by call, each going first half the time, so a burst of
    // machine load lands on both sides instead of on whichever block it happened to hit.
    const measure = (n) => {
      const raw = [];
      const now = [];
      for (let i = 0; i < n; i += 1) {
        if (i % 2 === 0) { raw.push(time(runRaw)); now.push(time(runNow)); } else { now.push(time(runNow)); raw.push(time(runRaw)); }
      }
      return { raw: p50(raw), now: p50(now) };
    };
    const rounds = [];
    for (let r = 0; r < 5; r += 1) rounds.push(measure(400));
    const median = (key) => rounds.map((round) => round[key]).sort((a, b) => a - b)[2];
    const ratio = median('now') / median('raw');
    t.diagnostic(`p50 raw steps ${median('raw')}ns, withStateTx ${median('now')}ns, ratio ${ratio.toFixed(3)}`);
    assert.ok(ratio <= 2, `fast path costs ${ratio.toFixed(3)}x its raw file steps, more than 2x`);
  } finally {
    f.cleanup();
  }
});

// The hot lock judges a holder's record through the process door, the same on every platform.
test('judgeHotRecord: a live holder with its recorded start time is alive, another start time is a reused pid, a killed holder is dead, a live holder without a start time stays unknown', async () => {
  const child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { stdio: 'ignore' });
  const exited = new Promise((resolve) => child.on('exit', resolve));
  try {
    const { pid, startTime, bootId, pidNs } = observe(child.pid);
    const record = { v: 1, pid, startTime, bootId, pidNs };
    assert.equal(judgeHotRecord(record), 'alive');
    assert.equal(judgeHotRecord({ ...record, startTime: `${startTime}0` }), 'dead');
    assert.equal(judgeHotRecord({ v: 1, pid }), 'unknown');
    child.kill('SIGKILL');
    await exited;
    assert.equal(judgeHotRecord(record), 'dead');
  } finally {
    child.kill('SIGKILL');
  }
});
