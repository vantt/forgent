// The Node door to process facts, against real processes. The judgement table is `judge_vectors.rs`
// (`packages/process/rust/tests/judge_vectors.rs`, which reads the shared vector file) and the reuse rule is
// `signal_identity.rs`; this file proves only the wiring across the door, and the one policy the adapter owns:
// a record this observer cannot disprove is held, never reclaimed.

import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { judge, observe, resolveHolderLiveness, selfRecord, signalByIdentity } from '../../src/runner/dispatch/process-identity.mjs';

test('the door judges one live and one unknown record as the table says', () => {
  const self = selfRecord();
  assert.equal(judge(self), 'alive');
  assert.equal(judge({ ...self, host: 'another-host' }), 'unknown');
  assert.equal(judge({ ...self, startTime: 'not-the-real-start-time' }), 'dead');
});

test('resolveHolderLiveness: a record without a pid is held, never dead', () => {
  assert.equal(resolveHolderLiveness({ id: 'no-pid' }), 'held');
  assert.equal(resolveHolderLiveness({ id: 'no-pid', pid: null }), 'held');
  assert.equal(resolveHolderLiveness({ id: 'corrupt', pid: 'abc' }), 'held');
  assert.equal(resolveHolderLiveness(null), 'held');
  assert.equal(resolveHolderLiveness(undefined), 'held');
  assert.equal(resolveHolderLiveness(selfRecord()), 'held');
});

test('signalByIdentity refuses a reused pid with identity-mismatch and sends nothing', async (t) => {
  const child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { stdio: 'ignore' });
  t.after(() => child.kill('SIGKILL'));
  await new Promise((resolve) => child.once('spawn', resolve));
  const recorded = observe(child.pid);
  assert.equal(recorded.kind, 'live');
  assert.equal(signalByIdentity({ ...recorded, startTime: '1' }, 'term'), 'identity-mismatch');
  await new Promise((resolve) => { setTimeout(resolve, 50); });
  assert.equal(observe(child.pid).kind, 'live', 'the child is still running');
  assert.equal(signalByIdentity(recorded, 'term'), 'sent');
});

test('selfRecord names this host, boot, namespace, pid and start time', () => {
  const self = selfRecord();
  assert.equal(self.host, os.hostname());
  assert.equal(self.pid, process.pid);
  assert.equal(typeof self.startTime, 'string');
  assert.deepEqual(observe(process.pid), { kind: 'live', ...self });
  if (process.platform === 'linux') {
    assert.match(self.pidNs, /^pid:\[\d+\]$/);
    assert.equal(typeof self.bootId, 'string');
  }
});
