import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { beaconPath, readBeacon, judgeBeacon, writeBeacon, clearBeaconIfOwn } from '../../src/runner/main-checkout-activity.mjs';

// The pre-commit hook's commit-activity beacon: a hint in its own file, with
// one duration field the writer sets. Pure filesystem; every test uses its
// own temp `.fgos/`.

function fgosDir() {
  return path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-activity-beacon-')), '.fgos');
}

test('writeBeacon records the writer, the time and the one window the writer chose', () => {
  const dir = fgosDir();
  writeBeacon(dir, { writer: { id: 'session-a', source: 'env' }, windowMs: 20_000, now: 1_000 });
  const record = JSON.parse(fs.readFileSync(beaconPath(dir), 'utf8'));
  assert.deepEqual(
    { v: record.v, kind: record.kind, writer: record.writer, writtenAt: record.writtenAt, windowMs: record.windowMs },
    { v: 1, kind: 'beacon', writer: { id: 'session-a', source: 'env' }, writtenAt: 1_000, windowMs: 20_000 },
  );
  assert.equal(record.auditPid, process.pid);
  assert.equal(path.relative(dir, beaconPath(dir)), path.join('runtime', 'main-checkout-activity.json'));
});

test('judgeBeacon: none, same writer, and an elapsed window allow; another writer inside its window is refused', () => {
  const dir = fgosDir();
  assert.equal(judgeBeacon(readBeacon(dir), 'session-b', 5_000).decision, 'allow');
  writeBeacon(dir, { writer: { id: 'session-a' }, windowMs: 20_000, now: 1_000 });
  const read = readBeacon(dir);
  assert.deepEqual(judgeBeacon(read, 'session-a', 2_000), { decision: 'allow', reason: 'same-writer' });
  assert.deepEqual(judgeBeacon(read, 'session-b', 6_000), { decision: 'refuse', reason: 'other-writer-active', ageMs: 5_000, remainingMs: 15_000 });
  assert.equal(judgeBeacon(read, 'session-b', 21_001).reason, 'expired');
});

test('a corrupt, foreign-schema or far-future beacon fails open', () => {
  const dir = fgosDir();
  fs.mkdirSync(path.dirname(beaconPath(dir)), { recursive: true });
  fs.writeFileSync(beaconPath(dir), '{not json');
  assert.deepEqual(judgeBeacon(readBeacon(dir), 'session-b'), { decision: 'allow', reason: 'corrupt' });
  fs.writeFileSync(beaconPath(dir), JSON.stringify({ v: 9, kind: 'beacon', writer: { id: 'x' }, writtenAt: Date.now(), windowMs: 1 }));
  assert.equal(judgeBeacon(readBeacon(dir), 'session-b').reason, 'corrupt');
  writeBeacon(dir, { writer: { id: 'session-a' }, windowMs: 1_000, now: 100_000 });
  assert.equal(judgeBeacon(readBeacon(dir), 'session-b', 1_000).reason, 'corrupt');
});

test('clearBeaconIfOwn removes only the caller\'s own beacon', () => {
  const dir = fgosDir();
  assert.equal(clearBeaconIfOwn(dir, 'session-a').status, 'no-beacon');
  writeBeacon(dir, { writer: { id: 'session-b' }, windowMs: 20_000 });
  assert.equal(clearBeaconIfOwn(dir, 'session-a').status, 'not-owner');
  assert.equal(fs.existsSync(beaconPath(dir)), true);
  writeBeacon(dir, { writer: { id: 'session-a' }, windowMs: 20_000 });
  assert.equal(clearBeaconIfOwn(dir, 'session-a').status, 'cleared');
  assert.equal(fs.existsSync(beaconPath(dir)), false);
});
