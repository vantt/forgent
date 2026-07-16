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

test('foldEvents merges predicted (claim) and actual (close) work.outcome events by id — never replaces', () => {
  const events = [
    { seq: 1, ts: '2026-07-15T00:00:00.000Z', type: 'work.outcome', payload: { id: 'a', predicted: { tier: 'standard' } } },
    { seq: 2, ts: '2026-07-15T00:00:01.000Z', type: 'work.outcome', payload: { id: 'a', actual: { passed: true, attempts: 1 } } },
  ];
  const view = foldEvents(events);
  assert.deepEqual(view.outcomes.a.predicted, { tier: 'standard' });
  assert.deepEqual(view.outcomes.a.actual, { passed: true, attempts: 1 });
});

test('foldEvents on a log with no work.outcome events yields a view with no "outcomes" key', () => {
  const events = [
    { seq: 1, ts: '2026-07-14T00:00:00.000Z', type: 'work.add', payload: { id: 'a', title: 'A', status: 'todo' } },
    { seq: 2, ts: '2026-07-14T00:00:01.000Z', type: 'decision', payload: { text: 'no outcomes yet' } },
  ];
  const view = foldEvents(events);
  assert.equal('outcomes' in view, false);
});

test('foldEvents APPENDS work.friction records per id — two frictions on one id both survive, in order (never merged, never replaced)', () => {
  const events = [
    { seq: 1, ts: '2026-07-16T00:00:00.000Z', type: 'work.friction', payload: { id: 'a', disposition: 'parked', errorClass: 'verify-miss', layer: 'verification', attempts: 2, detail: 'first' } },
    { seq: 2, ts: '2026-07-16T00:00:01.000Z', type: 'work.friction', payload: { id: 'a', disposition: 'halted', errorClass: 'worker-timeout', layer: 'environment', attempts: 1, detail: 'second' } },
  ];
  const view = foldEvents(events);
  assert.equal(view.frictions.a.length, 2);
  assert.equal(view.frictions.a[0].detail, 'first');
  assert.equal(view.frictions.a[1].detail, 'second');
  assert.equal(view.frictions.a[1].layer, 'environment');
  // event ts rides along for recency display (fgos check cap)
  assert.equal(view.frictions.a[0].ts, '2026-07-16T00:00:00.000Z');
});

test('foldEvents on a log with no work.friction events yields a view with no "frictions" key (lazy key, backward-compat)', () => {
  const events = [
    { seq: 1, ts: '2026-07-14T00:00:00.000Z', type: 'work.add', payload: { id: 'a', title: 'A', status: 'todo' } },
    { seq: 2, ts: '2026-07-14T00:00:01.000Z', type: 'work.outcome', payload: { id: 'a', predicted: { tier: 'standard' } } },
  ];
  const view = foldEvents(events);
  assert.equal('frictions' in view, false);
});

test('foldEvents folds an ask-then-answer work.move pair into one gates[id]={ask,answer} — merge, never replace', () => {
  const events = [
    { seq: 1, ts: '2026-07-15T00:00:00.000Z', type: 'work.add', payload: { id: 'a', title: 'A', status: 'todo' } },
    {
      seq: 2,
      ts: '2026-07-15T00:00:01.000Z',
      type: 'work.move',
      payload: { id: 'a', from: 'todo', to: 'awaiting-human', ask: 'OAuth or password?' },
    },
    {
      seq: 3,
      ts: '2026-07-15T00:00:02.000Z',
      type: 'work.move',
      payload: { id: 'a', from: 'awaiting-human', to: 'todo', answer: 'OAuth' },
    },
  ];
  const view = foldEvents(events);
  assert.deepEqual(view.gates.a, { ask: 'OAuth or password?', answer: 'OAuth' });
  assert.equal(view.work.a.status, 'todo');
});

test('foldEvents on a log with no gate (ask/answer) events yields a view with no "gates" key', () => {
  const events = [
    { seq: 1, ts: '2026-07-14T00:00:00.000Z', type: 'work.add', payload: { id: 'a', title: 'A', status: 'todo' } },
    { seq: 2, ts: '2026-07-14T00:00:01.000Z', type: 'work.move', payload: { id: 'a', from: 'todo', to: 'doing' } },
  ];
  const view = foldEvents(events);
  assert.equal('gates' in view, false);
});

test('foldEvents applies work.stage to set item.stage (per stage-clarify D1)', () => {
  const events = [
    { seq: 1, ts: '2026-07-16T00:00:00.000Z', type: 'work.add', payload: { id: 'a', title: 'A', status: 'todo', stage: 'clarify' } },
    { seq: 2, ts: '2026-07-16T00:00:01.000Z', type: 'work.stage', payload: { id: 'a', from: 'clarify', to: 'executing' } },
  ];
  const view = foldEvents(events);
  assert.equal(view.work.a.stage, 'executing');
});

test('foldEvents work.stage also sets item.verify when the event carries one (per D10 — one event does both)', () => {
  const events = [
    { seq: 1, ts: '2026-07-16T00:00:00.000Z', type: 'work.add', payload: { id: 'a', title: 'A', status: 'todo', stage: 'clarify', verify: 'P15 will fill this in' } },
    { seq: 2, ts: '2026-07-16T00:00:01.000Z', type: 'work.stage', payload: { id: 'a', from: 'clarify', to: 'executing', verify: 'npm test -- a' } },
  ];
  const view = foldEvents(events);
  assert.equal(view.work.a.stage, 'executing');
  assert.equal(view.work.a.verify, 'npm test -- a');
});

test('foldEvents work.stage without a verify leaves item.verify untouched', () => {
  const events = [
    { seq: 1, ts: '2026-07-16T00:00:00.000Z', type: 'work.add', payload: { id: 'a', title: 'A', status: 'todo', stage: 'clarify', verify: 'original verify' } },
    { seq: 2, ts: '2026-07-16T00:00:01.000Z', type: 'work.stage', payload: { id: 'a', from: 'clarify', to: 'executing' } },
  ];
  const view = foldEvents(events);
  assert.equal(view.work.a.verify, 'original verify');
});

test('foldEvents applies work.stage to set item.stage to "decompose" (per stage-decompose D2)', () => {
  const events = [
    { seq: 1, ts: '2026-07-16T00:00:00.000Z', type: 'work.add', payload: { id: 'a', title: 'A', status: 'todo', stage: 'clarify' } },
    { seq: 2, ts: '2026-07-16T00:00:01.000Z', type: 'work.stage', payload: { id: 'a', from: 'clarify', to: 'decompose' } },
  ];
  const view = foldEvents(events);
  assert.equal(view.work.a.stage, 'decompose');
});

test('foldEvents ignores a work.stage for an id that was never added', () => {
  const events = [
    { seq: 1, ts: '2026-07-16T00:00:00.000Z', type: 'work.stage', payload: { id: 'ghost', from: 'clarify', to: 'executing' } },
  ];
  assert.doesNotThrow(() => foldEvents(events));
  assert.deepEqual(foldEvents(events), { work: {}, decisions: [] });
});

test('foldEvents APPENDS work.discovery records per id — two verdicts on one id both survive, in order (never merged, never replaced)', () => {
  const events = [
    { seq: 1, ts: '2026-07-16T00:00:00.000Z', type: 'work.discovery', payload: { id: 'a', passed: false, question: 'which auth?' } },
    { seq: 2, ts: '2026-07-16T00:00:01.000Z', type: 'work.discovery', payload: { id: 'a', passed: true, verify: 'npm test -- a' } },
  ];
  const view = foldEvents(events);
  assert.equal(view.discovery.a.length, 2);
  assert.equal(view.discovery.a[0].passed, false);
  assert.equal(view.discovery.a[1].passed, true);
  assert.equal(view.discovery.a[0].ts, '2026-07-16T00:00:00.000Z');
});

test('foldEvents on a log with no work.discovery events yields a view with no "discovery" key (lazy key, backward-compat)', () => {
  const events = [
    { seq: 1, ts: '2026-07-14T00:00:00.000Z', type: 'work.add', payload: { id: 'a', title: 'A', status: 'todo' } },
  ];
  const view = foldEvents(events);
  assert.equal('discovery' in view, false);
});

// --- settlement channel (phase-3-compound-learning-5, S3-closeout) --------
//
// Three settling kinds derived from EXISTING event types (no new event type,
// per D3/R3): 'clarify-pass' (work.stage -> executing), 'answer' (work.move
// carrying an answer), 'close' (work.move -> done). `actor` rides on the
// SAME event's payload (additive, optional) rather than a separate write.

test('foldEvents derives a clarify-pass settlement from work.stage -> executing, carrying actor + verify as detail', () => {
  const events = [
    { seq: 1, ts: '2026-07-16T00:00:00.000Z', type: 'work.add', payload: { id: 'a', title: 'A', status: 'todo', stage: 'clarify' }, v: 2 },
    { seq: 2, ts: '2026-07-16T00:00:01.000Z', type: 'work.stage', payload: { id: 'a', from: 'clarify', to: 'executing', verify: 'npm test -- a', actor: 'runner' }, v: 2 },
  ];
  const view = foldEvents(events);
  assert.equal(view.settlements.a.length, 1);
  assert.deepEqual(view.settlements.a[0], { kind: 'clarify-pass', actor: 'runner', ts: '2026-07-16T00:00:01.000Z', detail: 'npm test -- a' });
});

test('foldEvents derives a clarify-pass settlement from work.stage clarify -> decompose too (re-guard per stage-decompose D2: settlement keys off leaving clarify, not landing on executing)', () => {
  const events = [
    { seq: 1, ts: '2026-07-16T00:00:00.000Z', type: 'work.add', payload: { id: 'a', title: 'A', status: 'todo', stage: 'clarify' }, v: 2 },
    { seq: 2, ts: '2026-07-16T00:00:01.000Z', type: 'work.stage', payload: { id: 'a', from: 'clarify', to: 'decompose', verify: 'npm test -- a', actor: 'runner' }, v: 2 },
  ];
  const view = foldEvents(events);
  assert.equal(view.settlements.a.length, 1);
  assert.deepEqual(view.settlements.a[0], { kind: 'clarify-pass', actor: 'runner', ts: '2026-07-16T00:00:01.000Z', detail: 'npm test -- a' });
});

test('foldEvents does NOT derive a settlement from work.stage decompose -> executing (it never leaves clarify)', () => {
  const events = [
    { seq: 1, ts: '2026-07-16T00:00:00.000Z', type: 'work.add', payload: { id: 'a', title: 'A', status: 'todo', stage: 'decompose' }, v: 2 },
    { seq: 2, ts: '2026-07-16T00:00:01.000Z', type: 'work.stage', payload: { id: 'a', from: 'decompose', to: 'executing' }, v: 2 },
  ];
  const view = foldEvents(events);
  assert.equal('settlements' in view, false);
});

test('foldEvents derives an answer settlement from a work.move carrying answer, with the answer text as detail', () => {
  const events = [
    { seq: 1, ts: '2026-07-15T00:00:00.000Z', type: 'work.add', payload: { id: 'a', title: 'A', status: 'todo' }, v: 2 },
    { seq: 2, ts: '2026-07-15T00:00:01.000Z', type: 'work.move', payload: { id: 'a', from: 'todo', to: 'awaiting-human', ask: 'OAuth or password?' }, v: 2 },
    { seq: 3, ts: '2026-07-15T00:00:02.000Z', type: 'work.move', payload: { id: 'a', from: 'awaiting-human', to: 'todo', answer: 'OAuth', actor: 'human' }, v: 2 },
  ];
  const view = foldEvents(events);
  assert.equal(view.settlements.a.length, 1);
  assert.deepEqual(view.settlements.a[0], { kind: 'answer', actor: 'human', ts: '2026-07-15T00:00:02.000Z', detail: 'OAuth' });
});

test('foldEvents derives a close settlement from a work.move -> done, with a null detail and actor', () => {
  const events = [
    { seq: 1, ts: '2026-07-15T00:00:00.000Z', type: 'work.add', payload: { id: 'a', title: 'A', status: 'todo' }, v: 2 },
    { seq: 2, ts: '2026-07-15T00:00:01.000Z', type: 'work.move', payload: { id: 'a', from: 'doing', to: 'done', actor: 'human' }, v: 2 },
  ];
  const view = foldEvents(events);
  assert.equal(view.settlements.a.length, 1);
  assert.deepEqual(view.settlements.a[0], { kind: 'close', actor: 'human', ts: '2026-07-15T00:00:01.000Z', detail: null });
});

test('foldEvents settlement APPENDS across multiple settling transitions on the same id — none erase a prior one', () => {
  const events = [
    { seq: 1, ts: '2026-07-15T00:00:00.000Z', type: 'work.add', payload: { id: 'a', title: 'A', status: 'todo', stage: 'clarify' }, v: 2 },
    { seq: 2, ts: '2026-07-15T00:00:01.000Z', type: 'work.stage', payload: { id: 'a', from: 'clarify', to: 'executing', verify: 'npm test', actor: 'runner' }, v: 2 },
    { seq: 3, ts: '2026-07-15T00:00:02.000Z', type: 'work.move', payload: { id: 'a', from: 'todo', to: 'awaiting-human', ask: 'sure?' }, v: 2 },
    { seq: 4, ts: '2026-07-15T00:00:03.000Z', type: 'work.move', payload: { id: 'a', from: 'awaiting-human', to: 'todo', answer: 'yes', actor: 'human' }, v: 2 },
    { seq: 5, ts: '2026-07-15T00:00:04.000Z', type: 'work.move', payload: { id: 'a', from: 'doing', to: 'done', actor: 'human' }, v: 2 },
  ];
  const view = foldEvents(events);
  assert.equal(view.settlements.a.length, 3);
  assert.deepEqual(view.settlements.a.map((r) => r.kind), ['clarify-pass', 'answer', 'close']);
});

test('foldEvents settlement records fold with actor null when the event carries none (additive, actor optional)', () => {
  const events = [
    { seq: 1, ts: '2026-07-15T00:00:00.000Z', type: 'work.add', payload: { id: 'a', title: 'A', status: 'todo' }, v: 2 },
    { seq: 2, ts: '2026-07-15T00:00:01.000Z', type: 'work.move', payload: { id: 'a', from: 'doing', to: 'done' }, v: 2 },
  ];
  const view = foldEvents(events);
  assert.equal(view.settlements.a[0].actor, null);
});

test('foldEvents on a log with no settling transitions yields a view with no "settlements" key (lazy key, backward-compat)', () => {
  const events = [
    { seq: 1, ts: '2026-07-14T00:00:00.000Z', type: 'work.add', payload: { id: 'a', title: 'A', status: 'todo' } },
    { seq: 2, ts: '2026-07-14T00:00:01.000Z', type: 'work.move', payload: { id: 'a', from: 'todo', to: 'doing' } },
  ];
  const view = foldEvents(events);
  assert.equal('settlements' in view, false);
});

test('foldEvents ignores a settling work.move (-> done) for an id that was never added — ghost id stays a true no-op', () => {
  const events = [
    { seq: 1, ts: '2026-07-16T00:00:00.000Z', type: 'work.move', payload: { id: 'ghost', from: 'doing', to: 'done' }, v: 2 },
  ];
  assert.doesNotThrow(() => foldEvents(events));
  assert.equal('settlements' in foldEvents(events), false);
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
