// The Node judge against the shared vector file, the same file the cargo
// test `packages/process/rust/tests/judge_vectors.rs` reads, so there is one
// judgement table. Plus the adapter every lock calls (`resolveHolderLiveness`)
// against real processes: a record without a pid is held, a zombie is dead.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  getBootId,
  getPidNs,
  getProcessStartTime,
  judge,
  localObserver,
  observeProcess,
  pidExists,
  resolveHolderLiveness,
} from '../../src/runner/dispatch/process-identity.mjs';

const root = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
const VECTOR_FILE = path.join(root, 'packages/process/contracts/process-facts.judge.v1.json');
const vectorDoc = JSON.parse(fs.readFileSync(VECTOR_FILE, 'utf8'));

const HAS_PROC = getProcessStartTime(process.pid) !== null;
// A record without a namespace is only judged from the initial namespace;
// records of this process carry its namespace so the real-process tests hold
// inside a sandbox too, and the legacy-shape tests expect what that sandbox
// must answer.
const PID_NS = getPidNs();
const IN_INIT_NS = localObserver().inInitPidNs;

/** `observeProcess`'s answer for the world one vector describes. */
function observedFrom(procWorld) {
  if (procWorld.state === 'absent') return { kind: 'absent' };
  if (procWorld.state === 'Z' || procWorld.state === 'X') return { kind: 'zombie' };
  if (procWorld.startTimeReadable) return { kind: 'live', startTime: procWorld.startTime };
  return { kind: 'unreadable', cause: procWorld.unreadableCause ?? 'driver-missing' };
}

/** The process table of one vector: the record's pid as `world.proc` says,
 * the anchor's pid so that judging the anchor gives `anchorJudge`. */
function observeFor(vector) {
  const { record, world } = vector;
  const table = new Map();
  if (Number.isInteger(record.pid) && record.pid > 0) table.set(record.pid, observedFrom(world.proc));
  if (record.anchor) {
    const seen = world.anchorJudge === 'alive'
      ? { kind: 'live', startTime: record.anchor.startTime }
      : world.anchorJudge === 'dead' ? { kind: 'absent' } : { kind: 'unreadable', cause: 'driver-missing' };
    table.set(record.anchor.pid, seen);
  }
  return (pid) => table.get(pid) ?? { kind: 'absent' };
}

test('the vector file is the one judgement table, and every rule in it has a vector', () => {
  assert.deepEqual(vectorDoc.contract, { id: 'process-facts-judge', version: 1 });
  assert.ok(vectorDoc.vectors.length > 0);
  const rows = new Set(vectorDoc.vectors.map((v) => v.row));
  for (const rule of vectorDoc.rules) assert.ok(rows.has(rule.id), `rule ${rule.id} has no vector`);
});

for (const vector of vectorDoc.vectors) {
  test(`judge vector ${vector.name} (${vector.row}) -> ${vector.expect}`, () => {
    assert.equal(judge(vector.record, { observer: vector.observer, observe: observeFor(vector) }), vector.expect);
  });
}

test('resolveHolderLiveness: a record without a pid is held, never dead', () => {
  assert.equal(resolveHolderLiveness({ id: 'no-pid' }, true), 'held');
  assert.equal(resolveHolderLiveness({ id: 'no-pid', pid: null }, false), 'held');
  assert.equal(resolveHolderLiveness({ id: 'corrupt', pid: 'abc' }), 'held');
  assert.equal(resolveHolderLiveness(null), 'held');
  assert.equal(resolveHolderLiveness(undefined, false), 'held');
});

test('resolveHolderLiveness: this process is held by its own identity, and dead under a wrong start time or boot id', () => {
  const self = { pid: process.pid, host: os_hostname(), bootId: getBootId(), pidNs: PID_NS, processStartTime: getProcessStartTime(process.pid) };
  assert.equal(resolveHolderLiveness(self), 'held');
  assert.equal(resolveHolderLiveness(self, true), 'held');
  assert.equal(resolveHolderLiveness({ ...self, processStartTime: 'not-the-real-start-time' }), HAS_PROC ? 'dead' : 'held');
  assert.equal(resolveHolderLiveness({ ...self, bootId: 'another-boot' }), getBootId() === 'unknown-boot' ? 'held' : 'dead');
  assert.equal(resolveHolderLiveness({ ...self, bootId: 'unknown-boot' }), 'held', 'a writer that could not read its boot id named no boot');
  assert.equal(resolveHolderLiveness({ ...self, host: 'another-host' }), 'held', 'another host is unknown, so held');
  assert.equal(resolveHolderLiveness({ ...self, pid: 2 ** 32 }), 'held', 'a number no pid can have proves nothing');
});

function os_hostname() {
  return localObserver().host;
}

test('resolveHolderLiveness: a legacy record (pid only) stays held while the pid lives; the caller’s isAlive=false is dead only where the record may be judged', () => {
  assert.equal(resolveHolderLiveness({ pid: process.pid }), 'held');
  // No namespace on the record: an observer outside the initial namespace
  // may not judge it, whatever the caller says about the pid.
  assert.equal(resolveHolderLiveness({ pid: process.pid }, false), IN_INIT_NS ? 'dead' : 'held');
  assert.equal(resolveHolderLiveness({ pid: process.pid, pidNs: PID_NS }, false), 'dead');
});

test('resolveHolderLiveness: the caller’s isAlive speaks for the holder pid only, never for an anchor', () => {
  // A record from another namespace whose anchor is this live process: the
  // caller's "not alive" verdict about the holder pid must not make the
  // anchor read as absent (that would reclaim a live namespace's lock).
  const anchor = { pid: process.pid, host: os_hostname(), bootId: getBootId(), pidNs: PID_NS, processStartTime: getProcessStartTime(process.pid) };
  const record = { host: os_hostname(), bootId: getBootId(), pidNs: 'pid:[1]', pid: 12, startTime: '1', anchor };
  if (PID_NS === 'pid:[1]') return;
  assert.equal(resolveHolderLiveness(record, false), 'held');
});

test('resolveHolderLiveness: a pid that no longer exists is dead', () => {
  const gone = spawnSync(process.execPath, ['-e', 'process.exit(0)']);
  assert.equal(resolveHolderLiveness({ pid: gone.pid, pidNs: PID_NS, processStartTime: '12345' }), 'dead');
  assert.equal(resolveHolderLiveness({ pid: gone.pid, processStartTime: '12345' }), IN_INIT_NS ? 'dead' : 'held');
  assert.equal(pidExists(gone.pid), false);
  assert.equal(pidExists(process.pid), true);
});

test('resolveHolderLiveness: a pid the caller reports alive but whose stat is unreadable is held', () => {
  // Nothing proves the holder gone when its stat cannot be read.
  assert.equal(resolveHolderLiveness({ pid: 999999999, processStartTime: 'x' }, true), 'held');
  assert.deepEqual(observeProcess(999999999, true), { kind: 'unreadable', cause: 'permission' });
});

test('localObserver names this host, boot and namespace', () => {
  const observer = localObserver();
  assert.equal(typeof observer.host, 'string');
  assert.equal(observer.pidNs, getPidNs());
  if (process.platform === 'linux' && observer.pidNs !== 'unknown') assert.match(observer.pidNs, /^pid:\[\d+\]$/);
  assert.equal(typeof observer.inInitPidNs, 'boolean');
});

test('a real zombie is dead to the judge even though signal 0 still reaches it', { skip: process.platform !== 'linux' }, async (t) => {
  // `true` exits at once; `exec sleep` keeps its parent pid alive without
  // ever waiting, so `true` stays a zombie owned by that pid.
  const shell = spawn('sh', ['-c', 'true & echo $!; exec sleep 300'], { stdio: ['ignore', 'pipe', 'inherit'] });
  t.after(() => shell.kill('SIGKILL'));
  const zombiePid = Number(await new Promise((resolve, reject) => {
    let out = '';
    shell.stdout.on('data', (chunk) => {
      out += chunk;
      if (out.includes('\n')) resolve(out.trim());
    });
    shell.once('exit', (code) => reject(new Error(`shell exited (${code}) before printing the pid`)));
  }));
  assert.ok(Number.isInteger(zombiePid) && zombiePid > 0);
  const deadline = Date.now() + 10_000;
  while (observeProcess(zombiePid).kind !== 'zombie') {
    assert.ok(Date.now() < deadline, `pid ${zombiePid} never became a zombie: ${JSON.stringify(observeProcess(zombiePid))}`);
    await new Promise((resolve) => { setTimeout(resolve, 10); });
  }
  assert.equal(pidExists(zombiePid), true, 'signal 0 still succeeds for a zombie');
  assert.equal(resolveHolderLiveness({ pid: zombiePid, pidNs: PID_NS, processStartTime: getProcessStartTime(zombiePid) }, true), 'dead');
  assert.equal(judge({ pid: zombiePid, pidNs: PID_NS, processStartTime: getProcessStartTime(zombiePid) }), 'dead');
});
