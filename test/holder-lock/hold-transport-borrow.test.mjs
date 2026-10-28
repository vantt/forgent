// The Node half of borrowing on the hold transport, against the file protocol
// of `internal-route.lock-hold.v1.json`. The helper here is a small Node
// process that answers `borrow` and `cancel` requests with real child
// processes and the same files the Rust helper writes, so this runs on every
// platform. The Rust half (job, keeper, release rule) is covered by the
// Windows tests (`windows-borrow.test.mjs`, `apps/fgos/tests/windows_borrow.rs`).
import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { borrowSync, borrowAsync, removeWorkDir, probeSharedSync } from '../../src/holder-lock/hold-transport.mjs';

const RESPONDER = `
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const work = process.argv[1];
const seen = new Set();
const running = new Map();
const write = (name, body) => { fs.writeFileSync(path.join(work, name + '.tmp'), JSON.stringify(body)); fs.renameSync(path.join(work, name + '.tmp'), path.join(work, name)); };
setInterval(() => {
  for (const name of fs.readdirSync(work)) {
    const m = /^req-(\\d+)\\.json$/.exec(name);
    if (!m || seen.has(m[1])) continue;
    seen.add(m[1]);
    const n = Number(m[1]);
    const req = JSON.parse(fs.readFileSync(path.join(work, name), 'utf8'));
    if (req.op === 'cancel') { running.get(req.n)?.kill(); continue; }
    if (running.size > 0) { write('result-' + n + '.json', { error: 'borrow-busy' }); continue; }
    const out = fs.openSync(path.join(work, 'out-' + n + '.log'), 'a');
    const err = fs.openSync(path.join(work, 'err-' + n + '.log'), 'a');
    const [program, ...args] = req.argv;
    let child;
    try {
      child = spawn(program, args, { cwd: req.cwd ?? undefined, env: req.env, stdio: ['ignore', out, err] });
    } catch (e) { write('result-' + n + '.json', { error: 'borrow-spawn-failed', message: e.message }); continue; }
    child.on('error', (e) => write('result-' + n + '.json', { error: 'borrow-spawn-failed', message: e.message }));
    if (child.pid) write('started-' + n + '.json', { pid: child.pid });
    running.set(n, child);
    child.on('exit', (code) => { running.delete(n); write('result-' + n + '.json', { exit: code ?? 1, leftoversKilled: 0 }); });
  }
}, 5);
`;

function makeHold() {
  const work = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-lock-hold-test-'));
  const child = spawn(process.execPath, ['-e', RESPONDER, work], { stdio: 'ignore' });
  child.unref();
  return { child, pid: child.pid, work, requests: 0 };
}

function endHold(hold) {
  hold.child.kill();
  removeWorkDir(hold.work);
}

const node = (script) => ({ command: process.execPath, args: ['-e', script], env: process.env });

test('sync borrow returns exit, stdout and stderr like the POSIX shape and removes its files', () => {
  const hold = makeHold();
  try {
    const answer = borrowSync(hold, node("process.stdout.write('out-text'); process.stderr.write('err-text'); process.exit(3)"), { killWaitMs: 2000 });
    assert.equal(answer.result.exit, 3);
    assert.equal(answer.result.error, undefined);
    assert.equal(answer.stdout, 'out-text');
    assert.equal(answer.stderr, 'err-text');
    assert.deepEqual(fs.readdirSync(hold.work).filter((f) => /^(req|started|out|err|result)-/.test(f)), []);
  } finally {
    endHold(hold);
  }
});

test('a timeout sends a cancel and the borrow returns the helper answer', () => {
  const hold = makeHold();
  try {
    const started = Date.now();
    const answer = borrowSync(hold, { ...node('setInterval(() => {}, 1000)'), timeoutMs: 300 }, { killWaitMs: 2000 });
    assert.ok(Date.now() - started < 3000, 'the cancel ended the child');
    assert.equal(answer.result.exit, 1);
  } finally {
    endHold(hold);
  }
});

test('a second borrow while one runs is answered borrow-busy', async () => {
  const hold = makeHold();
  try {
    const first = borrowAsync(hold, node('setTimeout(() => {}, 400)'), { killWaitMs: 2000, onResult: () => {} });
    const second = borrowSync(hold, node('0'), { killWaitMs: 2000 });
    assert.equal(second.result.error, 'borrow-busy');
    await new Promise((resolve) => first.once('close', resolve));
  } finally {
    endHold(hold);
  }
});

test('async borrow is ChildProcess-shaped: pid, streams, spawn, exit, close, kill', async () => {
  const hold = makeHold();
  try {
    const results = [];
    const child = borrowAsync(hold, node("console.log('first'); setTimeout(() => console.error('second'), 150); setTimeout(() => process.exit(0), 300)"), { killWaitMs: 2000, onResult: (r) => results.push(r) });
    assert.ok(Number.isInteger(child.pid) && child.pid > 0, 'the pid is known before the object is handed back');
    const events = [];
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (c) => { stdout += c; });
    child.stderr.on('data', (c) => { stderr += c; });
    child.on('spawn', () => events.push('spawn'));
    child.on('exit', (code, signal) => events.push(`exit:${code}:${signal}`));
    const closed = await new Promise((resolve) => child.on('close', (code, signal) => resolve(`${code}:${signal}`)));
    events.push(`close:${closed}`);
    assert.deepEqual(events, ['spawn', 'exit:0:null', 'close:0:null']);
    assert.match(stdout, /first/);
    assert.match(stderr, /second/);
    assert.equal(results.length, 1);
  } finally {
    endHold(hold);
  }
});

test('kill() cancels a blocked child within a second', async () => {
  const hold = makeHold();
  try {
    const child = borrowAsync(hold, node('setInterval(() => {}, 1000)'), { killWaitMs: 2000, onResult: () => {} });
    const started = Date.now();
    child.stdout.resume();
    child.stderr.resume();
    assert.equal(child.kill(), true);
    const code = await new Promise((resolve) => child.on('close', (c) => resolve(c)));
    assert.ok(Date.now() - started < 1000, `cancelled in ${Date.now() - started} ms`);
    assert.equal(code, 1);
    assert.equal(child.kill(), false, 'kill after the end does nothing');
  } finally {
    endHold(hold);
  }
});

test('a child that cannot start is reported as an error event, not a pid', async () => {
  const hold = makeHold();
  try {
    const results = [];
    const child = borrowAsync(hold, { command: path.join(hold.work, 'no-such-program'), args: [], env: process.env }, { killWaitMs: 2000, onResult: (r) => results.push(r) });
    const err = await new Promise((resolve) => child.once('error', resolve));
    assert.equal(err.code, 'borrow-spawn-failed');
    assert.equal(child.pid, undefined);
    assert.equal(results[0].error, 'borrow-spawn-failed');
  } finally {
    endHold(hold);
  }
});

test('sync hold capture honors per-call limits and refuses oversized path lists', () => {
  const hold = makeHold();
  try {
    const script = "process.stdout.write('a'.repeat(17 * 1024 * 1024) + '\\0')";
    const answer = borrowSync(hold, { ...node(script), maxOutputBytes: 64 * 1024 * 1024 }, { killWaitMs: 2000 });
    assert.equal(answer.stdout.length, 17 * 1024 * 1024 + 1);
    assert.equal(answer.stdout.at(-1), '\0');
    assert.throws(() => borrowSync(hold, { ...node(script), maxOutputBytes: 1024 }, { killWaitMs: 2000 }), { code: 'borrow-output-limit' });
    assert.deepEqual(fs.readdirSync(hold.work).filter((f) => /^(req|started|out|err|result)-/.test(f)), []);
  } finally { endHold(hold); }
});

// A stand-in host binary for the shared try: it records its argv, answers the
// way `lock-hold` does through ready.json, and stays alive like a holder until
// it is terminated.
function fakeHoldHost(dir, answer) {
  const bin = path.join(dir, 'fake-host');
  const body = `#!${process.execPath}
const fs = require('node:fs');
const path = require('node:path');
const argv = process.argv.slice(2);
const work = argv[argv.indexOf('--work') + 1];
fs.writeFileSync(path.join(${JSON.stringify(dir)}, 'argv.json'), JSON.stringify(argv));
fs.writeFileSync(path.join(work, 'ready.tmp'), JSON.stringify(Object.assign({ v: 2, protocol: 2 }, ${JSON.stringify(answer)})));
fs.renameSync(path.join(work, 'ready.tmp'), path.join(work, 'ready.json'));
if (${JSON.stringify(answer.result)} === 'acquired') setInterval(() => {}, 1000);
`;
  fs.writeFileSync(bin, body, { mode: 0o755 });
  return bin;
}

for (const [answer, expected] of [[{ result: 'acquired' }, 'free'], [{ result: 'held', reason: 'kernel-lock-held' }, 'held'], [{ result: 'unavailable', reason: 'unsupported-platform' }, 'unavailable']]) {
  test(`a shared try through the hold helper reads ${answer.result} as ${expected} and leaves no helper or directory`, () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-probe-shared-'));
    try {
      const lockPath = path.join(dir, 'main-checkout.lock');
      fs.writeFileSync(lockPath, '');
      const probed = probeSharedSync({ bin: fakeHoldHost(dir, answer), lockPath, env: process.env });
      assert.equal(probed.result, expected);
      const argv = JSON.parse(fs.readFileSync(path.join(dir, 'argv.json'), 'utf8'));
      assert.deepEqual([argv[argv.indexOf('--mode') + 1], argv.includes('--try')], ['sh', true]);
      assert.equal(fs.existsSync(argv[argv.indexOf('--work') + 1]), false);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
}
