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

// Regression pin (per discovery-context P30 / validation-s1.md's corrected
// assumption): `work.add`'s fold is a SPREAD of the whole payload (see
// applyEvent's `case 'work.add'` above), so an additive field like
// `description` survives rebuild with no fold-logic change at all — unlike
// `work.move`'s destructure-based fields, which need an explicit allowlist
// entry (critical-patterns fold-allowlist) to survive. This test pins that
// behavior so a future change from spread to destructure on work.add would
// be caught here.
test('foldEvents survives an additive work.add field (description) through rebuild via spread — no allowlist edit needed', () => {
  const events = [
    {
      seq: 1,
      ts: '2026-07-17T00:00:00.000Z',
      type: 'work.add',
      payload: { id: 'a', title: 'A', status: 'todo', description: 'The full text the submitter typed.' },
    },
  ];
  const view = foldEvents(events);
  assert.equal(view.work.a.description, 'The full text the submitter typed.');
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

// --- claim attribution (stage-decompose S2-pull D1/cell action (4)) --------
//
// `claimActor` + `headAtTake` fold onto the item itself (not a settlement)
// from a `work.move` claim (`to: 'doing'`) that carries them — this is what
// lets startupReap tell a pull-door claim (human/session, never auto-reaped)
// apart from a runner claim, and lets `fgos return` measure real progress
// against the HEAD recorded at take time.

test('foldEvents folds claimActor + headAtTake onto the item from a doing claim that carries them (pull-door take)', () => {
  const events = [
    { seq: 1, ts: '2026-07-16T00:00:00.000Z', type: 'work.add', payload: { id: 'a', title: 'A', status: 'todo' }, v: 2 },
    { seq: 2, ts: '2026-07-16T00:00:01.000Z', type: 'work.move', payload: { id: 'a', from: 'todo', to: 'doing', actor: 'human', headAtTake: 'deadbeef' }, v: 2 },
  ];
  const view = foldEvents(events);
  assert.equal(view.work.a.claimActor, 'human');
  assert.equal(view.work.a.headAtTake, 'deadbeef');
});

test('foldEvents folds the latest move reason onto the item (reject loop feedback), lazily', () => {
  const events = [
    { seq: 1, ts: '2026-07-17T00:00:00.000Z', type: 'work.add', payload: { id: 'a', title: 'A', status: 'todo' }, v: 2 },
    { seq: 2, ts: '2026-07-17T00:00:01.000Z', type: 'work.move', payload: { id: 'a', from: 'todo', to: 'doing', actor: 'runner' }, v: 2 },
    { seq: 3, ts: '2026-07-17T00:00:02.000Z', type: 'work.move', payload: { id: 'a', from: 'doing', to: 'proposed' }, v: 2 },
    { seq: 4, ts: '2026-07-17T00:00:03.000Z', type: 'work.move', payload: { id: 'a', from: 'proposed', to: 'todo', reason: 'first objection' }, v: 2 },
    { seq: 5, ts: '2026-07-17T00:00:04.000Z', type: 'work.move', payload: { id: 'a', from: 'todo', to: 'doing', actor: 'runner' }, v: 2 },
    { seq: 6, ts: '2026-07-17T00:00:05.000Z', type: 'work.move', payload: { id: 'a', from: 'doing', to: 'proposed' }, v: 2 },
    { seq: 7, ts: '2026-07-17T00:00:06.000Z', type: 'work.move', payload: { id: 'a', from: 'proposed', to: 'todo', reason: 'second objection wins' }, v: 2 },
  ];
  const view = foldEvents(events);
  assert.equal(view.work.a.reason, 'second objection wins');
});

test('foldEvents leaves no reason key on items whose moves never carried one', () => {
  const events = [
    { seq: 1, ts: '2026-07-17T00:00:00.000Z', type: 'work.add', payload: { id: 'a', title: 'A', status: 'todo' }, v: 2 },
    { seq: 2, ts: '2026-07-17T00:00:01.000Z', type: 'work.move', payload: { id: 'a', from: 'todo', to: 'doing', actor: 'runner' }, v: 2 },
  ];
  const view = foldEvents(events);
  assert.ok(!('reason' in view.work.a));
});

test('foldEvents folds claimActor "runner" with no headAtTake for a plain runner claim (runner claims never carry a headAtTake)', () => {
  const events = [
    { seq: 1, ts: '2026-07-16T00:00:00.000Z', type: 'work.add', payload: { id: 'a', title: 'A', status: 'todo' }, v: 2 },
    { seq: 2, ts: '2026-07-16T00:00:01.000Z', type: 'work.move', payload: { id: 'a', from: 'todo', to: 'doing', actor: 'runner' }, v: 2 },
  ];
  const view = foldEvents(events);
  assert.equal(view.work.a.claimActor, 'runner');
  assert.equal('headAtTake' in view.work.a, false);
});

test('foldEvents leaves claimActor/headAtTake absent from the item for a legacy doing claim with no actor at all (backward-compat)', () => {
  const events = [
    { seq: 1, ts: '2026-07-14T00:00:00.000Z', type: 'work.add', payload: { id: 'a', title: 'A', status: 'todo' } },
    { seq: 2, ts: '2026-07-14T00:00:01.000Z', type: 'work.move', payload: { id: 'a', from: 'todo', to: 'doing' } },
  ];
  const view = foldEvents(events);
  assert.equal('claimActor' in view.work.a, false);
  assert.equal('headAtTake' in view.work.a, false);
});

test('foldEvents ignores claimActor/headAtTake on a doing move for an id that was never added — ghost id stays a true no-op', () => {
  const events = [
    { seq: 1, ts: '2026-07-16T00:00:00.000Z', type: 'work.move', payload: { id: 'ghost', from: 'todo', to: 'doing', actor: 'human', headAtTake: 'deadbeef' }, v: 2 },
  ];
  assert.doesNotThrow(() => foldEvents(events));
  const view = foldEvents(events);
  assert.equal('ghost' in view.work, false);
});

test('foldEvents does not fold claimActor/headAtTake on a non-doing move even when the payload carries them (only the doing edge sets them)', () => {
  const events = [
    { seq: 1, ts: '2026-07-16T00:00:00.000Z', type: 'work.add', payload: { id: 'a', title: 'A', status: 'todo' }, v: 2 },
    { seq: 2, ts: '2026-07-16T00:00:01.000Z', type: 'work.move', payload: { id: 'a', from: 'todo', to: 'doing', actor: 'human', headAtTake: 'aaa' }, v: 2 },
    { seq: 3, ts: '2026-07-16T00:00:02.000Z', type: 'work.move', payload: { id: 'a', from: 'doing', to: 'proposed', actor: 'human', headAtTake: 'ignored-on-this-edge' }, v: 2 },
  ];
  const view = foldEvents(events);
  assert.equal(view.work.a.claimActor, 'human', 'the doing edge already set claimActor — a later non-doing move never touches it');
  assert.equal(view.work.a.headAtTake, 'aaa', 'the proposed move carries headAtTake in its payload but it is not the doing edge, so it is never read');
});

// --- return marker (pr-lifecycle D3/D4, mirrors headAtTake above) ---------
//
// `headAtReturn` folds onto the item from a `work.move` return (`to:
// 'proposed'`) that carries it — together with the claim's own `headAtTake`
// this gives the review gate an honest diff range for a pull-door proposal.

test('foldEvents folds headAtReturn onto the item from a proposed move that carries it (pull-door return)', () => {
  const events = [
    { seq: 1, ts: '2026-07-16T00:00:00.000Z', type: 'work.add', payload: { id: 'a', title: 'A', status: 'todo' }, v: 2 },
    { seq: 2, ts: '2026-07-16T00:00:01.000Z', type: 'work.move', payload: { id: 'a', from: 'todo', to: 'doing', actor: 'human', headAtTake: 'deadbeef' }, v: 2 },
    { seq: 3, ts: '2026-07-16T00:00:02.000Z', type: 'work.move', payload: { id: 'a', from: 'doing', to: 'proposed', headAtReturn: 'c0ffee' }, v: 2 },
  ];
  const view = foldEvents(events);
  assert.equal(view.work.a.headAtTake, 'deadbeef');
  assert.equal(view.work.a.headAtReturn, 'c0ffee');
});

test('foldEvents leaves headAtReturn absent for a runner proposal (doing -> proposed with no headAtReturn)', () => {
  const events = [
    { seq: 1, ts: '2026-07-16T00:00:00.000Z', type: 'work.add', payload: { id: 'a', title: 'A', status: 'todo' }, v: 2 },
    { seq: 2, ts: '2026-07-16T00:00:01.000Z', type: 'work.move', payload: { id: 'a', from: 'todo', to: 'doing', actor: 'runner' }, v: 2 },
    { seq: 3, ts: '2026-07-16T00:00:02.000Z', type: 'work.move', payload: { id: 'a', from: 'doing', to: 'proposed' }, v: 2 },
  ];
  const view = foldEvents(events);
  assert.equal('headAtReturn' in view.work.a, false);
});

test('foldEvents ignores headAtReturn on a non-proposed move even when the payload carries it (only the proposed edge sets it)', () => {
  const events = [
    { seq: 1, ts: '2026-07-16T00:00:00.000Z', type: 'work.add', payload: { id: 'a', title: 'A', status: 'todo' }, v: 2 },
    { seq: 2, ts: '2026-07-16T00:00:01.000Z', type: 'work.move', payload: { id: 'a', from: 'todo', to: 'doing', actor: 'human', headAtReturn: 'ignored-on-this-edge' }, v: 2 },
  ];
  const view = foldEvents(events);
  assert.equal('headAtReturn' in view.work.a, false);
});

test('foldEvents ignores headAtReturn on a proposed move for an id that was never added — ghost id stays a true no-op', () => {
  const events = [
    { seq: 1, ts: '2026-07-16T00:00:00.000Z', type: 'work.move', payload: { id: 'ghost', from: 'doing', to: 'proposed', headAtReturn: 'c0ffee' }, v: 2 },
  ];
  assert.doesNotThrow(() => foldEvents(events));
  const view = foldEvents(events);
  assert.equal('ghost' in view.work, false);
});

// --- branch-source take/return markers (human-rounds D2) -------------------
//
// `branchHeadAtTake`/`branchHeadAtReturn` fold onto the item on the SAME
// `to: 'doing'`/`to: 'proposed'` edges as headAtTake/headAtReturn above, but
// are a strict addition — never a rewrite — of the main-based pair: a
// branch-source take/return never carries headAtTake/headAtReturn at all
// (CẤM per D2), so the two marker pairs are always mutually exclusive on a
// real item, though the fold itself imposes no such check.

test('foldEvents folds branchHeadAtTake onto the item from a blocked -> doing claim that carries it (branch take)', () => {
  const events = [
    { seq: 1, ts: '2026-07-17T00:00:00.000Z', type: 'work.add', payload: { id: 'a', title: 'A', status: 'blocked' }, v: 2 },
    { seq: 2, ts: '2026-07-17T00:00:01.000Z', type: 'work.move', payload: { id: 'a', from: 'blocked', to: 'doing', actor: 'human', branchHeadAtTake: 'branch-deadbeef' }, v: 2 },
  ];
  const view = foldEvents(events);
  assert.equal(view.work.a.claimActor, 'human');
  assert.equal(view.work.a.branchHeadAtTake, 'branch-deadbeef');
  assert.equal('headAtTake' in view.work.a, false, 'a branch take never carries the main-based headAtTake');
});

test('foldEvents ignores branchHeadAtTake on a non-doing move even when the payload carries it (only the doing edge sets it)', () => {
  const events = [
    { seq: 1, ts: '2026-07-17T00:00:00.000Z', type: 'work.add', payload: { id: 'a', title: 'A', status: 'todo' }, v: 2 },
    { seq: 2, ts: '2026-07-17T00:00:01.000Z', type: 'work.move', payload: { id: 'a', from: 'todo', to: 'doing', actor: 'human', branchHeadAtTake: 'aaa' }, v: 2 },
    { seq: 3, ts: '2026-07-17T00:00:02.000Z', type: 'work.move', payload: { id: 'a', from: 'doing', to: 'proposed', branchHeadAtTake: 'ignored-on-this-edge' }, v: 2 },
  ];
  const view = foldEvents(events);
  assert.equal(view.work.a.branchHeadAtTake, 'aaa', 'the proposed move carries branchHeadAtTake in its payload but it is not the doing edge, so it is never read');
});

test('foldEvents ignores branchHeadAtTake on a doing move for an id that was never added — ghost id stays a true no-op', () => {
  const events = [
    { seq: 1, ts: '2026-07-17T00:00:00.000Z', type: 'work.move', payload: { id: 'ghost', from: 'blocked', to: 'doing', actor: 'human', branchHeadAtTake: 'deadbeef' }, v: 2 },
  ];
  assert.doesNotThrow(() => foldEvents(events));
  const view = foldEvents(events);
  assert.equal('ghost' in view.work, false);
});

test('foldEvents folds branchHeadAtReturn onto the item from a proposed move that carries it (branch return), never headAtReturn', () => {
  const events = [
    { seq: 1, ts: '2026-07-17T00:00:00.000Z', type: 'work.add', payload: { id: 'a', title: 'A', status: 'blocked' }, v: 2 },
    { seq: 2, ts: '2026-07-17T00:00:01.000Z', type: 'work.move', payload: { id: 'a', from: 'blocked', to: 'doing', actor: 'human', branchHeadAtTake: 'branch-deadbeef' }, v: 2 },
    { seq: 3, ts: '2026-07-17T00:00:02.000Z', type: 'work.move', payload: { id: 'a', from: 'doing', to: 'proposed', branchHeadAtReturn: 'branch-c0ffee' }, v: 2 },
  ];
  const view = foldEvents(events);
  assert.equal(view.work.a.branchHeadAtTake, 'branch-deadbeef');
  assert.equal(view.work.a.branchHeadAtReturn, 'branch-c0ffee');
  assert.equal('headAtReturn' in view.work.a, false, 'a branch return never carries the main-based headAtReturn (D2 CẤM)');
});

test('foldEvents ignores branchHeadAtReturn on a non-proposed move even when the payload carries it (only the proposed edge sets it)', () => {
  const events = [
    { seq: 1, ts: '2026-07-17T00:00:00.000Z', type: 'work.add', payload: { id: 'a', title: 'A', status: 'blocked' }, v: 2 },
    { seq: 2, ts: '2026-07-17T00:00:01.000Z', type: 'work.move', payload: { id: 'a', from: 'blocked', to: 'doing', actor: 'human', branchHeadAtReturn: 'ignored-on-this-edge' }, v: 2 },
  ];
  const view = foldEvents(events);
  assert.equal('branchHeadAtReturn' in view.work.a, false);
});

test('foldEvents ignores branchHeadAtReturn on a proposed move for an id that was never added — ghost id stays a true no-op', () => {
  const events = [
    { seq: 1, ts: '2026-07-17T00:00:00.000Z', type: 'work.move', payload: { id: 'ghost', from: 'doing', to: 'proposed', branchHeadAtReturn: 'branch-c0ffee' }, v: 2 },
  ];
  assert.doesNotThrow(() => foldEvents(events));
  const view = foldEvents(events);
  assert.equal('ghost' in view.work, false);
});
