import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickNextRetrospectiveItem } from '../../src/state/retro-pool.mjs';

// Pure lib — every view/rawEvents here is a literal; no fs, no mkdtemp, no
// `.fgos/` writes anywhere in this file (same convention as
// cleanup-pool.test.mjs/discover-pool.test.mjs).
function item(id, status, extra = {}) {
  return { id, title: id, kind: 'task', stage: 'executing', status, deps: [], risk: 'light', refs: [], verify: 'true', ...extra };
}

function retrospectiveEntry(id, ts) {
  return { type: 'work.move', payload: { id, to: 'retrospective' }, ts };
}

test('pickNextRetrospectiveItem on an empty view returns null', () => {
  assert.equal(pickNextRetrospectiveItem({ work: {} }, []), null);
});

test('pickNextRetrospectiveItem on a view with no work key returns null', () => {
  assert.equal(pickNextRetrospectiveItem({}, []), null);
});

test('a status:retrospective item with no delivered->retrospective event in rawEvents is excluded', () => {
  const view = { work: { a: item('a', 'retrospective') } };
  assert.equal(pickNextRetrospectiveItem(view, []), null);
});

test('a status:retrospective item with a matching event is picked', () => {
  const view = { work: { a: item('a', 'retrospective') } };
  const rawEvents = [retrospectiveEntry('a', '2026-01-01T00:00:00.000Z')];
  assert.deepEqual(pickNextRetrospectiveItem(view, rawEvents), { id: 'a' });
});

test('a non-retrospective-status item is never picked, even with a matching event in rawEvents', () => {
  const view = { work: { a: item('a', 'doing') } };
  const rawEvents = [retrospectiveEntry('a', '2026-01-01T00:00:00.000Z')];
  assert.equal(pickNextRetrospectiveItem(view, rawEvents), null);
});

test('two candidates: the earlier delivered->retrospective entry wins (FIFO)', () => {
  const view = {
    work: {
      a: item('a', 'retrospective'),
      b: item('b', 'retrospective'),
    },
  };
  const rawEvents = [
    retrospectiveEntry('a', '2026-01-02T00:00:00.000Z'),
    retrospectiveEntry('b', '2026-01-01T00:00:00.000Z'),
  ];
  assert.deepEqual(pickNextRetrospectiveItem(view, rawEvents), { id: 'b' });
});

test('only the specific latest delivered->retrospective event for the id is read', () => {
  const view = { work: { a: item('a', 'retrospective') } };
  const rawEvents = [
    retrospectiveEntry('a', '2026-01-14T00:00:00.000Z'), // the real, latest entry
    retrospectiveEntry('a', '2025-01-01T00:00:00.000Z'), // a much older, superseded entry, listed after
  ];
  assert.deepEqual(pickNextRetrospectiveItem(view, rawEvents), { id: 'a' });
});

test('a retrospective->cleanup event for the same id is never mistaken for a delivered->retrospective entry', () => {
  const view = { work: { a: item('a', 'retrospective') } };
  const rawEvents = [{ type: 'work.move', payload: { id: 'a', to: 'cleanup' }, ts: '2026-01-01T00:00:00.000Z' }];
  assert.equal(pickNextRetrospectiveItem(view, rawEvents), null);
});
