import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickNextCleanupItem } from '../../src/state/cleanup-pool.mjs';

// Pure lib — every view/rawEvents here is a literal; no fs, no mkdtemp, no
// `.fgos/` writes anywhere in this file (same convention as
// discover-pool.test.mjs).
function item(id, status, extra = {}) {
  return { id, title: id, kind: 'task', stage: 'executing', status, deps: [], risk: 'low', refs: [], verify: 'true', ...extra };
}

function cleanupEntry(id, ts) {
  return { type: 'work.move', payload: { id, to: 'cleanup' }, ts };
}

const TTL_DAYS = 7;
const NOW = new Date('2026-01-15T00:00:00.000Z').getTime();

test('pickNextCleanupItem on an empty view returns null', () => {
  assert.equal(pickNextCleanupItem({ work: {} }, [], { ttlDays: TTL_DAYS, now: NOW }), null);
});

test('pickNextCleanupItem on a view with no work key returns null', () => {
  assert.equal(pickNextCleanupItem({}, [], { ttlDays: TTL_DAYS, now: NOW }), null);
});

test('a status:cleanup item with no retrospective->cleanup event in rawEvents is excluded', () => {
  const view = { work: { a: item('a', 'cleanup') } };
  assert.equal(pickNextCleanupItem(view, [], { ttlDays: TTL_DAYS, now: NOW }), null);
});

test('a status:cleanup item whose TTL has not elapsed is excluded', () => {
  const view = { work: { a: item('a', 'cleanup') } };
  const rawEvents = [cleanupEntry('a', '2026-01-14T00:00:00.000Z')]; // 1 day ago, TTL is 7
  assert.equal(pickNextCleanupItem(view, rawEvents, { ttlDays: TTL_DAYS, now: NOW }), null);
});

test('a status:cleanup item whose TTL has elapsed is picked', () => {
  const view = { work: { a: item('a', 'cleanup') } };
  const rawEvents = [cleanupEntry('a', '2026-01-01T00:00:00.000Z')]; // 14 days ago, TTL is 7
  assert.deepEqual(pickNextCleanupItem(view, rawEvents, { ttlDays: TTL_DAYS, now: NOW }), { id: 'a' });
});

test('a non-cleanup-status item is never picked, even with a matching event in rawEvents', () => {
  const view = { work: { a: item('a', 'doing') } };
  const rawEvents = [cleanupEntry('a', '2026-01-01T00:00:00.000Z')];
  assert.equal(pickNextCleanupItem(view, rawEvents, { ttlDays: TTL_DAYS, now: NOW }), null);
});

test('two TTL-elapsed candidates: the earlier retrospective->cleanup entry wins (D1 FIFO)', () => {
  const view = {
    work: {
      a: item('a', 'cleanup'),
      b: item('b', 'cleanup'),
    },
  };
  const rawEvents = [
    cleanupEntry('a', '2026-01-02T00:00:00.000Z'),
    cleanupEntry('b', '2026-01-01T00:00:00.000Z'),
  ];
  assert.deepEqual(pickNextCleanupItem(view, rawEvents, { ttlDays: TTL_DAYS, now: NOW }), { id: 'b' });
});

test('only the specific latest retrospective->cleanup event for the id is read, per cleanup-harness.mjs\'s own contract', () => {
  const view = { work: { a: item('a', 'cleanup') } };
  const rawEvents = [
    cleanupEntry('a', '2025-01-01T00:00:00.000Z'), // a much older, superseded entry
    cleanupEntry('a', '2026-01-14T00:00:00.000Z'), // the real, latest entry: 1 day ago, TTL not elapsed
  ];
  assert.equal(pickNextCleanupItem(view, rawEvents, { ttlDays: TTL_DAYS, now: NOW }), null);
});
