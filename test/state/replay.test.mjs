import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { appendEvent } from '../../src/state/events.mjs';
import { foldEvents, rebuildView } from '../../src/state/replay.mjs';

// Every test gets its own mkdtemp dir — never touch the repo's .fgos/.
function tmpLogPath() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-replay-'));
  return path.join(dir, 'events.jsonl');
}

test('foldEvents on an empty log yields an empty view', () => {
  assert.deepEqual(foldEvents([]), { work: {}, decisions: [] });
});

test('foldEvents applies work.add then work.move to build current status', () => {
  const events = [
    { seq: 1, ts: '2026-07-14T00:00:00.000Z', type: 'work.add', payload: { id: 'a', title: 'A', status: 'todo' } },
    { seq: 2, ts: '2026-07-14T00:00:01.000Z', type: 'work.move', payload: { id: 'a', from: 'todo', to: 'doing' } },
  ];
  const view = foldEvents(events);
  assert.equal(view.work.a.status, 'doing');
  assert.equal(view.work.a.title, 'A');
});

test('foldEvents folds multiple work items independently', () => {
  const events = [
    { seq: 1, ts: '2026-07-14T00:00:00.000Z', type: 'work.add', payload: { id: 'a', status: 'todo' } },
    { seq: 2, ts: '2026-07-14T00:00:01.000Z', type: 'work.add', payload: { id: 'b', status: 'todo' } },
    { seq: 3, ts: '2026-07-14T00:00:02.000Z', type: 'work.move', payload: { id: 'b', from: 'todo', to: 'doing' } },
  ];
  const view = foldEvents(events);
  assert.equal(view.work.a.status, 'todo');
  assert.equal(view.work.b.status, 'doing');
});

test('foldEvents collects decision events into view.decisions, preserving the event ts', () => {
  const events = [
    { seq: 1, ts: '2020-01-01T00:00:00.000Z', type: 'decision', payload: { text: 'chose fgos as CLI name' } },
  ];
  const view = foldEvents(events);
  assert.deepEqual(view.decisions, [{ text: 'chose fgos as CLI name', ts: '2020-01-01T00:00:00.000Z' }]);
});

test('foldEvents ignores unknown event types instead of throwing', () => {
  const events = [{ seq: 1, ts: '2026-07-14T00:00:00.000Z', type: 'something.future', payload: { whatever: true } }];
  assert.doesNotThrow(() => foldEvents(events));
  assert.deepEqual(foldEvents(events), { work: {}, decisions: [] });
});

test('foldEvents ignores a work.move for an id that was never added', () => {
  const events = [
    { seq: 1, ts: '2026-07-14T00:00:00.000Z', type: 'work.move', payload: { id: 'ghost', from: 'todo', to: 'doing' } },
  ];
  assert.doesNotThrow(() => foldEvents(events));
  assert.deepEqual(foldEvents(events), { work: {}, decisions: [] });
});

test('rebuildView reads through events.mjs readEvents and returns [] work for an uninitialized log', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-replay-'));
  const view = rebuildView(path.join(dir, 'missing.jsonl'));
  assert.deepEqual(view, { work: {}, decisions: [] });
});

test('rebuildView twice from the same log produces deep-equal views (D3 determinism)', () => {
  const logPath = tmpLogPath();
  appendEvent(logPath, { type: 'work.add', payload: { id: 'a', title: 'A', status: 'todo' } });
  appendEvent(logPath, { type: 'work.move', payload: { id: 'a', from: 'todo', to: 'doing' } });
  appendEvent(logPath, { type: 'decision', payload: { text: 'locked D5' } });

  const first = rebuildView(logPath);
  const second = rebuildView(logPath);
  assert.deepEqual(first, second);
  assert.equal(first.work.a.status, 'doing');
  assert.equal(first.decisions.length, 1);
});

test('rebuildView preserves the historical ts from each event, never the current wall-clock time', () => {
  const logPath = tmpLogPath();
  // A ts far in the past — if replay ever called Date.now() instead of using
  // event.ts, this assertion would fail against "now".
  const pastTs = '2001-01-01T00:00:00.000Z';
  fs.writeFileSync(
    logPath,
    `${JSON.stringify({ seq: 1, ts: pastTs, type: 'decision', payload: { text: 'old decision' } })}\n`,
    'utf8',
  );

  const view = rebuildView(logPath);
  assert.equal(view.decisions[0].ts, pastTs);
});
