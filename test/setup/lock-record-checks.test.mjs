// `lock-record-unreadable` on a real workspace directory: garbage records
// warn with the path and the fence command, a record of a live process (or a
// young unjudgeable one) passes.
import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { checkLockRecordUnreadable, UNKNOWN_JUDGE_GRACE_MS } from '../../src/setup/lock-record-checks.mjs';
import { getBootId, getPidNs, getProcessStartTime } from '../../src/runner/dispatch/process-identity.mjs';

let root;
let locks;
beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-lock-record-checks-'));
  locks = path.join(root, '.fgos', 'locks');
  fs.mkdirSync(locks, { recursive: true });
});
afterEach(() => fs.rmSync(root, { recursive: true, force: true }));

const recordPath = (resource) => path.join(locks, `${resource}.hot`);

test('no record: passes', () => {
  const result = checkLockRecordUnreadable(root);
  assert.equal(result.passed, true);
  assert.match(result.message, /absent or judgeable/);
});

test('a record of a live process with its full tuple passes', () => {
  fs.writeFileSync(recordPath('state'), JSON.stringify({
    v: 1, pid: process.pid, startTime: getProcessStartTime(process.pid), bootId: getBootId(), pidNs: getPidNs(),
  }));
  assert.match(checkLockRecordUnreadable(root).message, /absent or judgeable/);
});

test('a record that does not parse warns with its path and the fence command, for the right resource only', () => {
  fs.writeFileSync(recordPath('porting-events'), '{"v":1,"pid":');
  const result = checkLockRecordUnreadable(root);
  assert.equal(result.passed, true);
  assert.match(result.message, /^warning: /);
  assert.ok(result.message.includes(recordPath('porting-events')), result.message);
  assert.match(result.message, /fgos lock fence porting-events/);
  assert.doesNotMatch(result.message, /fgos lock fence state/);
});

test('a record without a pid is unreadable', () => {
  fs.writeFileSync(recordPath('state'), JSON.stringify({ v: 1 }));
  assert.match(checkLockRecordUnreadable(root).message, /fgos lock fence state/);
});

test('a record naming a live pid in a foreign namespace warns only after the grace', () => {
  // The recorded namespace differs from ours, so the judge cannot place the live pid.
  fs.writeFileSync(recordPath('state'), JSON.stringify({
    v: 1, pid: process.pid, startTime: getProcessStartTime(process.pid), bootId: getBootId(), pidNs: 'pid:[0]',
  }));
  const young = checkLockRecordUnreadable(root);
  const old = checkLockRecordUnreadable(root, { now: Date.now() + UNKNOWN_JUDGE_GRACE_MS + 60_000 });
  assert.match(young.message, /absent or judgeable/);
  assert.match(old.message, /cannot be judged here/);
  assert.match(old.message, /fgos lock fence state/);
});
