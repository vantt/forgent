import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { appendEvent } from '../../src/state/events.mjs';
import { foldEvents, rebuildView, viewRevision, serializeView, readAllEventsFromDir, rebuildViewFromDir, buildSnapshotFromDir } from '../../src/state/replay.mjs';
import { initStore, addWork, moveWork } from '../../src/state/store.mjs';
import { repairTruncatedLastLine } from '../../src/state/events.mjs';
import { resolveFgosFile, FGOS_FILE } from '../../src/state/fgos-file-registry.mjs';

// Every test gets its own mkdtemp dir — never touch the repo's .fgos/.
function tmpLogPath() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-replay-'));
  return path.join(dir, 'events.jsonl');
}

// tsk-49e: a full `.fgos`-shaped dir with a real state.json snapshot,
// written through store.mjs's own real write path (never hand-crafted) --
// the snapshot fast path only ever exists on disk this way in production.
function tmpFgosDir() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-replay-snapshot-'));
  initStore(dir);
  return dir;
}

// Tầng A/T2 moved store.mjs's real write path from `dir/events.jsonl`
// (baseline-0, frozen per TA-D12) to one open file per writer under
// `dir/events/` (TA-D2/TA-D11). These tests seed through store.mjs's real
// write path on purpose (per tmpFgosDir's own doc comment) and then probe
// `rebuildView`'s single-file incremental mechanism directly against
// wherever that path actually landed -- one writer per test process, so
// there is exactly one file under `events/` once anything has been added.
function logPathOf(dir) {
  const eventsDir = path.join(dir, 'events');
  try {
    const files = fs.readdirSync(eventsDir).filter((f) => f.endsWith('.jsonl'));
    if (files.length > 0) return path.join(eventsDir, files.sort().at(-1));
  } catch {
    // events/ doesn't exist yet (nothing written since initStore) -- baseline-0 is still the real file.
  }
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

// Same spread-fold guarantee as the `description` pin above, applied to the
// new `discoveredFrom` provenance field (work-graph-intelligence S2b): no
// dedicated fold code is added for it — work.add's existing spread carries
// it through rebuild for free.
test('foldEvents survives an additive work.add field (discoveredFrom) through rebuild via spread — no fold code added', () => {
  const events = [
    {
      seq: 1,
      ts: '2026-07-18T00:00:00.000Z',
      type: 'work.add',
      payload: { id: 'b', title: 'B', status: 'todo', discoveredFrom: 'a' },
    },
  ];
  const view = foldEvents(events);
  assert.equal(view.work.b.discoveredFrom, 'a');
});

test('foldEvents on a work.add with no discoveredFrom leaves the field absent (legacy/unrelated item, backward-compat)', () => {
  const events = [
    { seq: 1, ts: '2026-07-18T00:00:01.000Z', type: 'work.add', payload: { id: 'a', title: 'A', status: 'todo' } },
  ];
  const view = foldEvents(events);
  assert.equal(view.work.a.discoveredFrom, undefined);
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

// tsk-63c D1/seq 1190: an id-less decision keeps the exact pre-existing
// shape -- no decisionsById key appears at all (lazy key, same as
// discovery/frictions).
test('foldEvents leaves view.decisionsById absent for a decision with no id', () => {
  const events = [
    { seq: 1, ts: '2020-01-01T00:00:00.000Z', type: 'decision', payload: { text: 'chose fgos as CLI name', rationale: 'short and typeable' } },
  ];
  const view = foldEvents(events);
  assert.equal(view.decisionsById, undefined);
  assert.equal(view.decisions.length, 1);
});

// tsk-63c D1/seq 1190: an id-bearing decision folds into a per-id
// accumulating array (view.decisionsById), mirroring view.discovery/
// view.frictions -- WITHOUT removing it from the existing flat
// view.decisions array.
test('foldEvents folds an id-bearing decision into view.decisionsById as an accumulating array', () => {
  const events = [
    { seq: 1, ts: '2020-01-01T00:00:00.000Z', type: 'decision', payload: { text: 'D1: broad scope', rationale: 'r1', id: 'tsk-63c' } },
    { seq: 2, ts: '2020-01-01T00:00:01.000Z', type: 'decision', payload: { text: 'D2: rationale required', rationale: 'r2', id: 'tsk-63c' } },
    { seq: 3, ts: '2020-01-01T00:00:02.000Z', type: 'decision', payload: { text: 'unrelated global decision', rationale: 'r3' } },
  ];
  const view = foldEvents(events);
  assert.equal(view.decisions.length, 3);
  assert.equal(view.decisionsById['tsk-63c'].length, 2);
  assert.equal(view.decisionsById['tsk-63c'][0].text, 'D1: broad scope');
  assert.equal(view.decisionsById['tsk-63c'][1].text, 'D2: rationale required');
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

test('rebuildView twice from the same log produces deep-equal views (determinism)', () => {
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
  // askHistory (tsk-25g D1): additive alongside `ask`'s own unchanged
  // single-slot overwrite -- see the dedicated accumulation test below.
  assert.deepEqual(view.gates.a, { ask: 'OAuth or password?', answer: 'OAuth', askHistory: ['OAuth or password?'] });
  assert.equal(view.work.a.status, 'todo');
});

test('foldEvents accumulates every fresh ask into gates[id].askHistory, while gates[id].ask keeps overwriting as before (tsk-25g D1)', () => {
  const events = [
    { seq: 1, ts: '2026-07-15T00:00:00.000Z', type: 'work.add', payload: { id: 'a', title: 'A', status: 'todo' } },
    { seq: 2, ts: '2026-07-15T00:00:01.000Z', type: 'work.move', payload: { id: 'a', from: 'todo', to: 'awaiting-human', ask: 'Round 1 rejection' } },
    { seq: 3, ts: '2026-07-15T00:00:02.000Z', type: 'work.move', payload: { id: 'a', from: 'awaiting-human', to: 'todo', answer: 'Retry 1' } },
    { seq: 4, ts: '2026-07-15T00:00:03.000Z', type: 'work.move', payload: { id: 'a', from: 'todo', to: 'awaiting-human', ask: 'Round 2 rejection' } },
    { seq: 5, ts: '2026-07-15T00:00:04.000Z', type: 'work.move', payload: { id: 'a', from: 'awaiting-human', to: 'todo', answer: 'Retry 2' } },
    { seq: 6, ts: '2026-07-15T00:00:05.000Z', type: 'work.move', payload: { id: 'a', from: 'todo', to: 'awaiting-human', ask: 'Round 3 rejection' } },
  ];
  const view = foldEvents(events);
  // ask itself: still the single most-recent value, unchanged behavior.
  assert.equal(view.gates.a.ask, 'Round 3 rejection');
  // askHistory: every fresh ask accumulated in order, answers never add.
  assert.deepEqual(view.gates.a.askHistory, ['Round 1 rejection', 'Round 2 rejection', 'Round 3 rejection']);
});

test('foldEvents on a log with no gate (ask/answer) events yields a view with no "gates" key', () => {
  const events = [
    { seq: 1, ts: '2026-07-14T00:00:00.000Z', type: 'work.add', payload: { id: 'a', title: 'A', status: 'todo' } },
    { seq: 2, ts: '2026-07-14T00:00:01.000Z', type: 'work.move', payload: { id: 'a', from: 'todo', to: 'doing' } },
  ];
  const view = foldEvents(events);
  assert.equal('gates' in view, false);
});

test('foldEvents applies work.stage to set item.stage', () => {
  const events = [
    { seq: 1, ts: '2026-07-16T00:00:00.000Z', type: 'work.add', payload: { id: 'a', title: 'A', status: 'todo', stage: 'clarify' } },
    { seq: 2, ts: '2026-07-16T00:00:01.000Z', type: 'work.stage', payload: { id: 'a', from: 'clarify', to: 'executing' } },
  ];
  const view = foldEvents(events);
  assert.equal(view.work.a.stage, 'executing');
});

test('foldEvents work.stage also sets item.verify when the event carries one (one event does both)', () => {
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

test('foldEvents applies work.stage to set item.stage to "decompose"', () => {
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
// carrying an answer), 'close' (work.move -> done). `role` rides on the
// SAME event's payload (additive, optional) rather than a separate write.
//
// tsk-qod D1/D2: the settlement gate itself moved from `from === 'clarify'`
// to `from === 'discovery'` (replay.mjs) — `discovery` (`stages[0]`) is now
// the coding domain's own entry stage, since `clarify` retired entirely.
// The settlement `kind` string stays the literal 'clarify-pass' (a stable,
// already-persisted event-history label, never renamed retroactively).

test('foldEvents derives a clarify-pass settlement from work.stage -> exploring, carrying role + verify as detail', () => {
  const events = [
    { seq: 1, ts: '2026-07-16T00:00:00.000Z', type: 'work.add', payload: { id: 'a', title: 'A', status: 'todo', stage: 'discovery' }, v: 2 },
    { seq: 2, ts: '2026-07-16T00:00:01.000Z', type: 'work.stage', payload: { id: 'a', from: 'discovery', to: 'exploring', verify: 'npm test -- a', role: 'runner' }, v: 2 },
  ];
  const view = foldEvents(events);
  assert.equal(view.settlements.a.length, 1);
  assert.deepEqual(view.settlements.a[0], { kind: 'clarify-pass', role: 'runner', ts: '2026-07-16T00:00:01.000Z', detail: 'npm test -- a' });
});

test('foldEvents derives a clarify-pass settlement from work.stage discovery -> planning too (settlement keys off leaving the entry stage, not landing on executing)', () => {
  const events = [
    { seq: 1, ts: '2026-07-16T00:00:00.000Z', type: 'work.add', payload: { id: 'a', title: 'A', status: 'todo', stage: 'discovery' }, v: 2 },
    { seq: 2, ts: '2026-07-16T00:00:01.000Z', type: 'work.stage', payload: { id: 'a', from: 'discovery', to: 'planning', verify: 'npm test -- a', role: 'runner' }, v: 2 },
  ];
  const view = foldEvents(events);
  assert.equal(view.settlements.a.length, 1);
  assert.deepEqual(view.settlements.a[0], { kind: 'clarify-pass', role: 'runner', ts: '2026-07-16T00:00:01.000Z', detail: 'npm test -- a' });
});

// tsk-31lz: since tsk-30v, an UNCLEAR discovery verdict also leaves
// `discovery` (-> `exploring`) while the item parks in `awaiting-human`
// with an open question. `from === 'discovery'` alone therefore no longer
// means "settled" — the gate has to read the verdict that drove the move.
// The verdict is already in the log as the `work.discovery` event this same
// `resolveDiscovery` call appends immediately BEFORE its `moveStage`
// (discovery.mjs), so the fold can read it with no new payload field and no
// change to already-written events.

test('foldEvents does NOT derive a clarify-pass settlement when the discovery verdict that drove the discovery -> exploring move was unclear', () => {
  const events = [
    { seq: 1, ts: '2026-08-12T00:00:00.000Z', type: 'work.add', payload: { id: 'a', title: 'A', status: 'todo', stage: 'discovery' }, v: 2 },
    { seq: 2, ts: '2026-08-12T00:00:01.000Z', type: 'work.discovery', payload: { id: 'a', clear: false, question: 'Which auth provider?' }, v: 2 },
    { seq: 3, ts: '2026-08-12T00:00:02.000Z', type: 'work.stage', payload: { id: 'a', from: 'discovery', to: 'exploring', verify: 'chưa xác định — bổ sung thủ công', role: 'session' }, v: 2 },
  ];
  const view = foldEvents(events);
  assert.equal('settlements' in view, false);
});

test('foldEvents still derives a clarify-pass settlement when the discovery verdict that drove the move was clear', () => {
  const events = [
    { seq: 1, ts: '2026-08-12T00:00:00.000Z', type: 'work.add', payload: { id: 'a', title: 'A', status: 'todo', stage: 'discovery' }, v: 2 },
    { seq: 2, ts: '2026-08-12T00:00:01.000Z', type: 'work.discovery', payload: { id: 'a', clear: true }, v: 2 },
    { seq: 3, ts: '2026-08-12T00:00:02.000Z', type: 'work.stage', payload: { id: 'a', from: 'discovery', to: 'planning', verify: 'npm test -- a', role: 'session' }, v: 2 },
  ];
  const view = foldEvents(events);
  assert.equal(view.settlements.a.length, 1);
  assert.deepEqual(view.settlements.a[0], { kind: 'clarify-pass', role: 'session', ts: '2026-08-12T00:00:02.000Z', detail: 'npm test -- a' });
});

// Legacy-log guard (RUL20: the fold never silences a settlement a real
// historical log already earned). Every `from === 'discovery'` event in this
// repo's own live log predates tsk-30v, when `discovery -> exploring` WAS
// the clear path — a log line that carries no readable verdict at all must
// keep settling exactly as it did before this fix.
test('foldEvents still derives a clarify-pass settlement from discovery -> exploring when the log carries no work.discovery verdict at all (legacy log)', () => {
  const events = [
    { seq: 1, ts: '2026-08-12T00:00:00.000Z', type: 'work.add', payload: { id: 'a', title: 'A', status: 'todo', stage: 'discovery' }, v: 2 },
    { seq: 2, ts: '2026-08-12T00:00:01.000Z', type: 'work.stage', payload: { id: 'a', from: 'discovery', to: 'exploring', verify: 'npm test -- a', role: 'runner' }, v: 2 },
  ];
  const view = foldEvents(events);
  assert.equal(view.settlements.a.length, 1);
  assert.equal(view.settlements.a[0].kind, 'clarify-pass');
});

test('foldEvents does NOT derive a settlement from work.stage exploring -> planning (it never leaves discovery)', () => {
  const events = [
    { seq: 1, ts: '2026-07-16T00:00:00.000Z', type: 'work.add', payload: { id: 'a', title: 'A', status: 'todo', stage: 'exploring' }, v: 2 },
    { seq: 2, ts: '2026-07-16T00:00:01.000Z', type: 'work.stage', payload: { id: 'a', from: 'exploring', to: 'planning' }, v: 2 },
  ];
  const view = foldEvents(events);
  assert.equal('settlements' in view, false);
});

test('foldEvents derives an answer settlement from a work.move carrying answer, with the answer text as detail', () => {
  const events = [
    { seq: 1, ts: '2026-07-15T00:00:00.000Z', type: 'work.add', payload: { id: 'a', title: 'A', status: 'todo' }, v: 2 },
    { seq: 2, ts: '2026-07-15T00:00:01.000Z', type: 'work.move', payload: { id: 'a', from: 'todo', to: 'awaiting-human', ask: 'OAuth or password?' }, v: 2 },
    { seq: 3, ts: '2026-07-15T00:00:02.000Z', type: 'work.move', payload: { id: 'a', from: 'awaiting-human', to: 'todo', answer: 'OAuth', role: 'human' }, v: 2 },
  ];
  const view = foldEvents(events);
  assert.equal(view.settlements.a.length, 1);
  assert.deepEqual(view.settlements.a[0], { kind: 'answer', role: 'human', ts: '2026-07-15T00:00:02.000Z', detail: 'OAuth' });
});

test('foldEvents derives a close settlement from a work.move -> done, with a null detail and role', () => {
  const events = [
    { seq: 1, ts: '2026-07-15T00:00:00.000Z', type: 'work.add', payload: { id: 'a', title: 'A', status: 'todo' }, v: 2 },
    { seq: 2, ts: '2026-07-15T00:00:01.000Z', type: 'work.move', payload: { id: 'a', from: 'doing', to: 'done', role: 'human' }, v: 2 },
  ];
  const view = foldEvents(events);
  assert.equal(view.settlements.a.length, 1);
  assert.deepEqual(view.settlements.a[0], { kind: 'close', role: 'human', ts: '2026-07-15T00:00:01.000Z', detail: null });
});

test('foldEvents settlement APPENDS across multiple settling transitions on the same id — none erase a prior one', () => {
  const events = [
    { seq: 1, ts: '2026-07-15T00:00:00.000Z', type: 'work.add', payload: { id: 'a', title: 'A', status: 'todo', stage: 'discovery' }, v: 2 },
    { seq: 2, ts: '2026-07-15T00:00:01.000Z', type: 'work.stage', payload: { id: 'a', from: 'discovery', to: 'exploring', verify: 'npm test', role: 'runner' }, v: 2 },
    { seq: 3, ts: '2026-07-15T00:00:02.000Z', type: 'work.move', payload: { id: 'a', from: 'todo', to: 'awaiting-human', ask: 'sure?' }, v: 2 },
    { seq: 4, ts: '2026-07-15T00:00:03.000Z', type: 'work.move', payload: { id: 'a', from: 'awaiting-human', to: 'todo', answer: 'yes', role: 'human' }, v: 2 },
    { seq: 5, ts: '2026-07-15T00:00:04.000Z', type: 'work.move', payload: { id: 'a', from: 'doing', to: 'done', role: 'human' }, v: 2 },
  ];
  const view = foldEvents(events);
  assert.equal(view.settlements.a.length, 3);
  assert.deepEqual(view.settlements.a.map((r) => r.kind), ['clarify-pass', 'answer', 'close']);
});

test('foldEvents settlement records fold with role null when the event carries none (additive, role optional)', () => {
  const events = [
    { seq: 1, ts: '2026-07-15T00:00:00.000Z', type: 'work.add', payload: { id: 'a', title: 'A', status: 'todo' }, v: 2 },
    { seq: 2, ts: '2026-07-15T00:00:01.000Z', type: 'work.move', payload: { id: 'a', from: 'doing', to: 'done' }, v: 2 },
  ];
  const view = foldEvents(events);
  assert.equal(view.settlements.a[0].role, null);
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
// `claimRole` + `headAtTake` fold onto the item itself (not a settlement)
// from a `work.move` claim (`to: 'doing'`) that carries them — this is what
// lets startupReap tell a pull-door claim (human/session, never auto-reaped)
// apart from a runner claim, and lets `fgos return` measure real progress
// against the HEAD recorded at take time.

test('foldEvents folds claimRole + headAtTake onto the item from a doing claim that carries them (pull-door take)', () => {
  const events = [
    { seq: 1, ts: '2026-07-16T00:00:00.000Z', type: 'work.add', payload: { id: 'a', title: 'A', status: 'todo' }, v: 2 },
    { seq: 2, ts: '2026-07-16T00:00:01.000Z', type: 'work.move', payload: { id: 'a', from: 'todo', to: 'doing', role: 'human', headAtTake: 'deadbeef' }, v: 2 },
  ];
  const view = foldEvents(events);
  assert.equal(view.work.a.claimRole, 'human');
  assert.equal(view.work.a.headAtTake, 'deadbeef');
});

test('foldEvents folds the latest move reason onto the item (reject loop feedback), lazily', () => {
  const events = [
    { seq: 1, ts: '2026-07-17T00:00:00.000Z', type: 'work.add', payload: { id: 'a', title: 'A', status: 'todo' }, v: 2 },
    { seq: 2, ts: '2026-07-17T00:00:01.000Z', type: 'work.move', payload: { id: 'a', from: 'todo', to: 'doing', role: 'runner' }, v: 2 },
    { seq: 3, ts: '2026-07-17T00:00:02.000Z', type: 'work.move', payload: { id: 'a', from: 'doing', to: 'awaiting-approval' }, v: 2 },
    { seq: 4, ts: '2026-07-17T00:00:03.000Z', type: 'work.move', payload: { id: 'a', from: 'awaiting-approval', to: 'todo', reason: 'first objection' }, v: 2 },
    { seq: 5, ts: '2026-07-17T00:00:04.000Z', type: 'work.move', payload: { id: 'a', from: 'todo', to: 'doing', role: 'runner' }, v: 2 },
    { seq: 6, ts: '2026-07-17T00:00:05.000Z', type: 'work.move', payload: { id: 'a', from: 'doing', to: 'awaiting-approval' }, v: 2 },
    { seq: 7, ts: '2026-07-17T00:00:06.000Z', type: 'work.move', payload: { id: 'a', from: 'awaiting-approval', to: 'todo', reason: 'second objection wins' }, v: 2 },
  ];
  const view = foldEvents(events);
  assert.equal(view.work.a.reason, 'second objection wins');
});

test('foldEvents leaves no reason key on items whose moves never carried one', () => {
  const events = [
    { seq: 1, ts: '2026-07-17T00:00:00.000Z', type: 'work.add', payload: { id: 'a', title: 'A', status: 'todo' }, v: 2 },
    { seq: 2, ts: '2026-07-17T00:00:01.000Z', type: 'work.move', payload: { id: 'a', from: 'todo', to: 'doing', role: 'runner' }, v: 2 },
  ];
  const view = foldEvents(events);
  assert.ok(!('reason' in view.work.a));
});

test('foldEvents folds claimRole "runner" with no headAtTake for a plain runner claim (runner claims never carry a headAtTake)', () => {
  const events = [
    { seq: 1, ts: '2026-07-16T00:00:00.000Z', type: 'work.add', payload: { id: 'a', title: 'A', status: 'todo' }, v: 2 },
    { seq: 2, ts: '2026-07-16T00:00:01.000Z', type: 'work.move', payload: { id: 'a', from: 'todo', to: 'doing', role: 'runner' }, v: 2 },
  ];
  const view = foldEvents(events);
  assert.equal(view.work.a.claimRole, 'runner');
  assert.equal('headAtTake' in view.work.a, false);
});

test('foldEvents leaves claimRole/headAtTake absent from the item for a legacy doing claim with no role at all (backward-compat)', () => {
  const events = [
    { seq: 1, ts: '2026-07-14T00:00:00.000Z', type: 'work.add', payload: { id: 'a', title: 'A', status: 'todo' } },
    { seq: 2, ts: '2026-07-14T00:00:01.000Z', type: 'work.move', payload: { id: 'a', from: 'todo', to: 'doing' } },
  ];
  const view = foldEvents(events);
  assert.equal('claimRole' in view.work.a, false);
  assert.equal('headAtTake' in view.work.a, false);
});

test('foldEvents ignores claimRole/headAtTake on a doing move for an id that was never added — ghost id stays a true no-op', () => {
  const events = [
    { seq: 1, ts: '2026-07-16T00:00:00.000Z', type: 'work.move', payload: { id: 'ghost', from: 'todo', to: 'doing', role: 'human', headAtTake: 'deadbeef' }, v: 2 },
  ];
  assert.doesNotThrow(() => foldEvents(events));
  const view = foldEvents(events);
  assert.equal('ghost' in view.work, false);
});

test('foldEvents does not fold claimRole/headAtTake on a non-doing move even when the payload carries them (only the doing edge sets them)', () => {
  const events = [
    { seq: 1, ts: '2026-07-16T00:00:00.000Z', type: 'work.add', payload: { id: 'a', title: 'A', status: 'todo' }, v: 2 },
    { seq: 2, ts: '2026-07-16T00:00:01.000Z', type: 'work.move', payload: { id: 'a', from: 'todo', to: 'doing', role: 'human', headAtTake: 'aaa' }, v: 2 },
    { seq: 3, ts: '2026-07-16T00:00:02.000Z', type: 'work.move', payload: { id: 'a', from: 'doing', to: 'awaiting-approval', role: 'human', headAtTake: 'ignored-on-this-edge' }, v: 2 },
  ];
  const view = foldEvents(events);
  assert.equal(view.work.a.claimRole, 'human', 'the doing edge already set claimRole — a later non-doing move never touches it');
  assert.equal(view.work.a.headAtTake, 'aaa', 'the proposed move carries headAtTake in its payload but it is not the doing edge, so it is never read');
});

// claim-lock §5.1/§7: a resume out of awaiting-human onto `doing` (the new
// status-fsm.mjs edge) is NOT a fresh claim — it must never clobber the
// claimRole/headAtTake/branchHeadAtTake/claimTrigger the ORIGINAL pick/take
// already folded, no matter what `role` the answer itself carries.
test('foldEvents does not re-fold claimRole/headAtTake/claimTrigger on an awaiting-human -> doing resume (answer never overwrites the original claim)', () => {
  const events = [
    { seq: 1, ts: '2026-07-28T00:00:00.000Z', type: 'work.add', payload: { id: 'a', title: 'A', status: 'todo' }, v: 2 },
    { seq: 2, ts: '2026-07-28T00:00:01.000Z', type: 'work.move', payload: { id: 'a', from: 'todo', to: 'doing', role: 'session', headAtTake: 'deadbeef', claimTrigger: 'herdr' }, v: 2 },
    { seq: 3, ts: '2026-07-28T00:00:02.000Z', type: 'work.move', payload: { id: 'a', from: 'doing', to: 'awaiting-human', ask: 'which auth?', statusAtAsk: 'doing' }, v: 2 },
    { seq: 4, ts: '2026-07-28T00:00:03.000Z', type: 'work.move', payload: { id: 'a', from: 'awaiting-human', to: 'doing', role: 'human', answer: 'OAuth' }, v: 2 },
  ];
  const view = foldEvents(events);
  assert.equal(view.work.a.status, 'doing');
  assert.equal(view.work.a.claimRole, 'session', 'the answer carried role:"human" — must never overwrite the pick claim\'s "session"');
  assert.equal(view.work.a.headAtTake, 'deadbeef');
  assert.equal(view.work.a.claimTrigger, 'herdr');
});

// claim-lock §7: claimTrigger folds onto the item exactly like claimRole,
// on a genuine `to: 'doing'` claim (not a resume).
test('foldEvents folds claimTrigger onto the item from a doing claim that carries it', () => {
  const events = [
    { seq: 1, ts: '2026-07-28T00:00:00.000Z', type: 'work.add', payload: { id: 'a', title: 'A', status: 'todo' }, v: 2 },
    { seq: 2, ts: '2026-07-28T00:00:01.000Z', type: 'work.move', payload: { id: 'a', from: 'todo', to: 'doing', role: 'session', claimTrigger: 'herdr' }, v: 2 },
  ];
  const view = foldEvents(events);
  assert.equal(view.work.a.claimTrigger, 'herdr');
});

test('foldEvents leaves claimTrigger absent when the claim never carried one', () => {
  const events = [
    { seq: 1, ts: '2026-07-28T00:00:00.000Z', type: 'work.add', payload: { id: 'a', title: 'A', status: 'todo' }, v: 2 },
    { seq: 2, ts: '2026-07-28T00:00:01.000Z', type: 'work.move', payload: { id: 'a', from: 'todo', to: 'doing', role: 'session' }, v: 2 },
  ];
  const view = foldEvents(events);
  assert.equal('claimTrigger' in view.work.a, false);
});

// --- return marker (pr-lifecycle D3/D4, mirrors headAtTake above) ---------
//
// `headAtReturn` folds onto the item from a `work.move` return (`to:
// 'awaiting-approval'`) that carries it — together with the claim's own `headAtTake`
// this gives the review gate an honest diff range for a pull-door proposal.

test('foldEvents folds headAtReturn onto the item from a proposed move that carries it (pull-door return)', () => {
  const events = [
    { seq: 1, ts: '2026-07-16T00:00:00.000Z', type: 'work.add', payload: { id: 'a', title: 'A', status: 'todo' }, v: 2 },
    { seq: 2, ts: '2026-07-16T00:00:01.000Z', type: 'work.move', payload: { id: 'a', from: 'todo', to: 'doing', role: 'human', headAtTake: 'deadbeef' }, v: 2 },
    { seq: 3, ts: '2026-07-16T00:00:02.000Z', type: 'work.move', payload: { id: 'a', from: 'doing', to: 'awaiting-approval', headAtReturn: 'c0ffee' }, v: 2 },
  ];
  const view = foldEvents(events);
  assert.equal(view.work.a.headAtTake, 'deadbeef');
  assert.equal(view.work.a.headAtReturn, 'c0ffee');
});

test('foldEvents leaves headAtReturn absent for a runner proposal (doing -> awaiting-approval with no headAtReturn)', () => {
  const events = [
    { seq: 1, ts: '2026-07-16T00:00:00.000Z', type: 'work.add', payload: { id: 'a', title: 'A', status: 'todo' }, v: 2 },
    { seq: 2, ts: '2026-07-16T00:00:01.000Z', type: 'work.move', payload: { id: 'a', from: 'todo', to: 'doing', role: 'runner' }, v: 2 },
    { seq: 3, ts: '2026-07-16T00:00:02.000Z', type: 'work.move', payload: { id: 'a', from: 'doing', to: 'awaiting-approval' }, v: 2 },
  ];
  const view = foldEvents(events);
  assert.equal('headAtReturn' in view.work.a, false);
});

test('foldEvents ignores headAtReturn on a non-proposed move even when the payload carries it (only the proposed edge sets it)', () => {
  const events = [
    { seq: 1, ts: '2026-07-16T00:00:00.000Z', type: 'work.add', payload: { id: 'a', title: 'A', status: 'todo' }, v: 2 },
    { seq: 2, ts: '2026-07-16T00:00:01.000Z', type: 'work.move', payload: { id: 'a', from: 'todo', to: 'doing', role: 'human', headAtReturn: 'ignored-on-this-edge' }, v: 2 },
  ];
  const view = foldEvents(events);
  assert.equal('headAtReturn' in view.work.a, false);
});

test('foldEvents ignores headAtReturn on a proposed move for an id that was never added — ghost id stays a true no-op', () => {
  const events = [
    { seq: 1, ts: '2026-07-16T00:00:00.000Z', type: 'work.move', payload: { id: 'ghost', from: 'doing', to: 'awaiting-approval', headAtReturn: 'c0ffee' }, v: 2 },
  ];
  assert.doesNotThrow(() => foldEvents(events));
  const view = foldEvents(events);
  assert.equal('ghost' in view.work, false);
});

// --- branch-source take/return markers (human-rounds D2) -------------------
//
// `branchHeadAtTake`/`branchHeadAtReturn` fold onto the item on the SAME
// `to: 'doing'`/`to: 'awaiting-approval'` edges as headAtTake/headAtReturn above, but
// are a strict addition — never a rewrite — of the main-based pair: a
// branch-source take/return never carries headAtTake/headAtReturn at all
// (CẤM per D2), so the two marker pairs are always mutually exclusive on a
// real item, though the fold itself imposes no such check.

test('foldEvents folds branchHeadAtTake onto the item from a blocked -> doing claim that carries it (branch take)', () => {
  const events = [
    { seq: 1, ts: '2026-07-17T00:00:00.000Z', type: 'work.add', payload: { id: 'a', title: 'A', status: 'blocked' }, v: 2 },
    { seq: 2, ts: '2026-07-17T00:00:01.000Z', type: 'work.move', payload: { id: 'a', from: 'blocked', to: 'doing', role: 'human', branchHeadAtTake: 'branch-deadbeef' }, v: 2 },
  ];
  const view = foldEvents(events);
  assert.equal(view.work.a.claimRole, 'human');
  assert.equal(view.work.a.branchHeadAtTake, 'branch-deadbeef');
  assert.equal('headAtTake' in view.work.a, false, 'a branch take never carries the main-based headAtTake');
});

test('foldEvents ignores branchHeadAtTake on a non-doing move even when the payload carries it (only the doing edge sets it)', () => {
  const events = [
    { seq: 1, ts: '2026-07-17T00:00:00.000Z', type: 'work.add', payload: { id: 'a', title: 'A', status: 'todo' }, v: 2 },
    { seq: 2, ts: '2026-07-17T00:00:01.000Z', type: 'work.move', payload: { id: 'a', from: 'todo', to: 'doing', role: 'human', branchHeadAtTake: 'aaa' }, v: 2 },
    { seq: 3, ts: '2026-07-17T00:00:02.000Z', type: 'work.move', payload: { id: 'a', from: 'doing', to: 'awaiting-approval', branchHeadAtTake: 'ignored-on-this-edge' }, v: 2 },
  ];
  const view = foldEvents(events);
  assert.equal(view.work.a.branchHeadAtTake, 'aaa', 'the proposed move carries branchHeadAtTake in its payload but it is not the doing edge, so it is never read');
});

test('foldEvents ignores branchHeadAtTake on a doing move for an id that was never added — ghost id stays a true no-op', () => {
  const events = [
    { seq: 1, ts: '2026-07-17T00:00:00.000Z', type: 'work.move', payload: { id: 'ghost', from: 'blocked', to: 'doing', role: 'human', branchHeadAtTake: 'deadbeef' }, v: 2 },
  ];
  assert.doesNotThrow(() => foldEvents(events));
  const view = foldEvents(events);
  assert.equal('ghost' in view.work, false);
});

test('foldEvents folds branchHeadAtReturn onto the item from a proposed move that carries it (branch return), never headAtReturn', () => {
  const events = [
    { seq: 1, ts: '2026-07-17T00:00:00.000Z', type: 'work.add', payload: { id: 'a', title: 'A', status: 'blocked' }, v: 2 },
    { seq: 2, ts: '2026-07-17T00:00:01.000Z', type: 'work.move', payload: { id: 'a', from: 'blocked', to: 'doing', role: 'human', branchHeadAtTake: 'branch-deadbeef' }, v: 2 },
    { seq: 3, ts: '2026-07-17T00:00:02.000Z', type: 'work.move', payload: { id: 'a', from: 'doing', to: 'awaiting-approval', branchHeadAtReturn: 'branch-c0ffee' }, v: 2 },
  ];
  const view = foldEvents(events);
  assert.equal(view.work.a.branchHeadAtTake, 'branch-deadbeef');
  assert.equal(view.work.a.branchHeadAtReturn, 'branch-c0ffee');
  assert.equal('headAtReturn' in view.work.a, false, 'a branch return never carries the main-based headAtReturn (D2 CẤM)');
});

test('foldEvents ignores branchHeadAtReturn on a non-proposed move even when the payload carries it (only the proposed edge sets it)', () => {
  const events = [
    { seq: 1, ts: '2026-07-17T00:00:00.000Z', type: 'work.add', payload: { id: 'a', title: 'A', status: 'blocked' }, v: 2 },
    { seq: 2, ts: '2026-07-17T00:00:01.000Z', type: 'work.move', payload: { id: 'a', from: 'blocked', to: 'doing', role: 'human', branchHeadAtReturn: 'ignored-on-this-edge' }, v: 2 },
  ];
  const view = foldEvents(events);
  assert.equal('branchHeadAtReturn' in view.work.a, false);
});

test('foldEvents ignores branchHeadAtReturn on a proposed move for an id that was never added — ghost id stays a true no-op', () => {
  const events = [
    { seq: 1, ts: '2026-07-17T00:00:00.000Z', type: 'work.move', payload: { id: 'ghost', from: 'doing', to: 'awaiting-approval', branchHeadAtReturn: 'branch-c0ffee' }, v: 2 },
  ];
  assert.doesNotThrow(() => foldEvents(events));
  const view = foldEvents(events);
  assert.equal('ghost' in view.work, false);
});

// `mergedSha`/`mergedInto` (tsk-5dk) fold onto the item on the SAME
// `to: 'delivered'` edge the payload actually carries them on — never
// inferred, never re-derived from git, straight off the event exactly like
// headAtReturn/branchHeadAtReturn above.

test('foldEvents folds mergedSha and mergedInto onto the item from a delivered move that carries them', () => {
  const events = [
    { seq: 1, ts: '2026-08-12T00:00:00.000Z', type: 'work.add', payload: { id: 'a', title: 'A', status: 'awaiting-approval' }, v: 2 },
    { seq: 2, ts: '2026-08-12T00:00:01.000Z', type: 'work.move', payload: { id: 'a', from: 'awaiting-approval', to: 'delivered', role: 'human', mergedSha: 'deadbeefcafe', mergedInto: 'main' }, v: 2 },
  ];
  const view = foldEvents(events);
  assert.equal(view.work.a.mergedSha, 'deadbeefcafe');
  assert.equal(view.work.a.mergedInto, 'main');
});

test('foldEvents leaves mergedSha/mergedInto absent for a delivered move that never carried them (hand-typed move, or a verify-only pull-door delivery)', () => {
  const events = [
    { seq: 1, ts: '2026-08-12T00:00:00.000Z', type: 'work.add', payload: { id: 'a', title: 'A', status: 'awaiting-approval' }, v: 2 },
    { seq: 2, ts: '2026-08-12T00:00:01.000Z', type: 'work.move', payload: { id: 'a', from: 'awaiting-approval', to: 'delivered', role: 'human' }, v: 2 },
  ];
  const view = foldEvents(events);
  assert.equal('mergedSha' in view.work.a, false);
  assert.equal('mergedInto' in view.work.a, false);
});

test('foldEvents ignores mergedSha/mergedInto on a non-delivered move even when the payload carries them (only the delivered edge sets them)', () => {
  const events = [
    { seq: 1, ts: '2026-08-12T00:00:00.000Z', type: 'work.add', payload: { id: 'a', title: 'A', status: 'todo' }, v: 2 },
    { seq: 2, ts: '2026-08-12T00:00:01.000Z', type: 'work.move', payload: { id: 'a', from: 'todo', to: 'doing', role: 'human', mergedSha: 'ignored-on-this-edge', mergedInto: 'ignored-on-this-edge' }, v: 2 },
  ];
  const view = foldEvents(events);
  assert.equal('mergedSha' in view.work.a, false);
  assert.equal('mergedInto' in view.work.a, false);
});

// --- work-graph-intelligence S3: view revision-hash -----------------------
// A deterministic fingerprint of a folded view (C1 data_hash pattern), so a
// consumer can tell "did the folded state change?" without re-folding — and
// WITHOUT the hash leaking into the fold return shape (which whole-view
// snapshot + backward-compat tests pin).

test('serializeView returns serialized JSON string and matching revision hash (tsk-37d)', () => {
  const logPath = tmpLogPath();
  appendEvent(logPath, { type: 'work.add', payload: { id: 'a', title: 'A', status: 'todo' } });
  const view = rebuildView(logPath);

  const { viewStr, revision } = serializeView(view);
  assert.equal(typeof viewStr, 'string');
  assert.equal(revision, viewRevision(view));
  assert.deepEqual(JSON.parse(viewStr), view);
});

test('viewRevision is deterministic: rebuilding the same log twice yields byte-identical revisions', () => {
  const logPath = tmpLogPath();
  appendEvent(logPath, { type: 'work.add', payload: { id: 'a', title: 'A', status: 'todo' } });
  appendEvent(logPath, { type: 'work.move', payload: { id: 'a', from: 'todo', to: 'doing' } });

  const r1 = viewRevision(rebuildView(logPath));
  const r2 = viewRevision(rebuildView(logPath));
  assert.equal(r1, r2);
  assert.match(r1, /^[0-9a-f]{64}$/, 'sha256 hex, same shape as the C1 data_hash');
});

test('viewRevision is sensitive: a new event changes the revision', () => {
  const logPath = tmpLogPath();
  appendEvent(logPath, { type: 'work.add', payload: { id: 'a', title: 'A', status: 'todo' } });
  const before = viewRevision(rebuildView(logPath));

  appendEvent(logPath, { type: 'work.move', payload: { id: 'a', from: 'todo', to: 'doing' } });
  const after = viewRevision(rebuildView(logPath));

  assert.notEqual(before, after, 'a state mutation must move the fingerprint');
});

test('viewRevision does NOT leak into the fold return: rebuildView still returns the pure {work, decisions, ...} shape', () => {
  const logPath = tmpLogPath();
  appendEvent(logPath, { type: 'work.add', payload: { id: 'a', title: 'A', status: 'todo' } });
  const view = rebuildView(logPath);

  viewRevision(view); // computing the hash must not mutate the view
  assert.equal('revision' in view, false, 'the revision is a persisted sibling, never part of the fold return');
  assert.deepEqual(rebuildView(logPath), view, 'rebuild return unchanged by the revision primitive');
});

test('foldEvents folds a goal.focus event to view.focus === id', () => {
  const events = [
    { seq: 1, ts: '2026-07-27T00:00:00.000Z', type: 'goal.focus', payload: { id: 'goal-a' } },
  ];
  const view = foldEvents(events);
  assert.equal(view.focus, 'goal-a');
});

test('foldEvents on a log with no goal.focus events yields a view with no "focus" key (lazy key, backward-compat)', () => {
  const events = [
    { seq: 1, ts: '2026-07-27T00:00:00.000Z', type: 'work.add', payload: { id: 'a', title: 'A', status: 'todo' } },
  ];
  const view = foldEvents(events);
  assert.equal('focus' in view, false);
});

test('foldEvents folds two goal.focus events to the LAST one\'s id — overwrite, never merged', () => {
  const events = [
    { seq: 1, ts: '2026-07-27T00:00:00.000Z', type: 'goal.focus', payload: { id: 'goal-a' } },
    { seq: 2, ts: '2026-07-27T00:00:01.000Z', type: 'goal.focus', payload: { id: 'goal-b' } },
  ];
  const view = foldEvents(events);
  assert.equal(view.focus, 'goal-b');
});

test('foldEvents silently skips a malformed goal.focus payload (missing/non-string id)', () => {
  const events = [
    { seq: 1, ts: '2026-07-27T00:00:00.000Z', type: 'goal.focus', payload: { actor: 'human' } },
  ];
  assert.doesNotThrow(() => foldEvents(events));
  assert.equal('focus' in foldEvents(events), false);
});

test("foldEvents folds writer onto the item across work.move, work.edit and work.stage, latest write wins", () => {
  const base = { seq: 1, ts: "2026-07-27T00:00:00.000Z", type: "work.add", payload: { id: "a", title: "A", status: "todo" } };
  const writerA = { id: "sess-1", source: "env" };
  const writerB = { id: "sess-2", source: "registry" };
  const writerC = { id: 4242, source: "pid" };
  const moveEvent = { seq: 2, ts: "2026-07-27T00:00:01.000Z", type: "work.move", payload: { id: "a", to: "doing", writer: writerA } };
  const editEvent = { seq: 3, ts: "2026-07-27T00:00:02.000Z", type: "work.edit", payload: { id: "a", patch: { title: "A2" }, writer: writerB } };
  const stageEvent = { seq: 4, ts: "2026-07-27T00:00:03.000Z", type: "work.stage", payload: { id: "a", from: "executing", to: "decompose", writer: writerC } };

  const steps = [
    { events: [base, moveEvent], expected: writerA, label: "work.move" },
    { events: [base, moveEvent, editEvent], expected: writerB, label: "work.edit" },
    { events: [base, moveEvent, editEvent, stageEvent], expected: writerC, label: "work.stage" },
  ];
  for (const { events, expected, label } of steps) {
    const view = foldEvents(events);
    assert.deepEqual(view.work.a.writer, expected, label + ": writer must fold onto the item");
  }
});

test("foldEvents on a work.move with no writer leaves item.writer absent (legacy events, backward-compat)", () => {
  const events = [
    { seq: 1, ts: "2026-07-27T00:00:04.000Z", type: "work.add", payload: { id: "a", title: "A", status: "todo" } },
    { seq: 2, ts: "2026-07-27T00:00:05.000Z", type: "work.move", payload: { id: "a", to: "doing" } },
  ];
  const view = foldEvents(events);
  assert.equal(view.work.a.writer, undefined);
});

test("foldEvents on a log with no tool.register events yields a view with no tools key (lazy key, backward-compat)", () => {
  const view = foldEvents([{ seq: 1, ts: "2026-07-31T00:00:00.000Z", type: "work.add", payload: { id: "a", title: "A", status: "todo" } }]);
  assert.equal(Object.hasOwn(view, "tools"), false);
});

test("foldEvents skips retired tool.register/tool.remove events (tsk-in1-1 D1) — forward-compatible, never an error, never creates view.tools", () => {
  const events = [
    { seq: 1, ts: "2026-07-31T00:00:00.000Z", type: "tool.register", payload: { name: "gitnexus", kind: "mcp", capability: "impact-analysis", command: "mcp:gitnexus", scanTarget: ".gitnexus" } },
    { seq: 2, ts: "2026-07-31T00:00:01.000Z", type: "tool.remove", payload: { name: "gitnexus" } },
  ];
  const view = foldEvents(events);
  assert.equal(Object.hasOwn(view, "tools"), false);
});

// ─── tsk-49e: incremental-read snapshot fast path ──────────────────────────

// Tầng A/T2 moved store.mjs's real per-writer log to `.fgos/events/<writer
// id>.jsonl` -- no longer a SIBLING of `.fgos/state.json`, which is exactly
// what `tryIncrementalRebuild` requires (it looks up `state.json` via
// `path.dirname(logPath)`). The fast path below is therefore correctly
// UNREACHABLE for a per-writer file today -- `rebuildView` degrades to a
// full read instead of ever guessing, per the same wrong-in-doubt-costs-
// speed-not-truth guarantee tsk-49e always gave (never a wrong view, just a
// slower one). T4 (Tầng A) restores a real fast path for this file shape by
// redefining the anchor as a per-file map rather than a single sibling
// snapshot; this test asserts today's honest interim behavior, not a
// regression.
test('rebuildView falls back to a full read (never a crash) for a per-writer log path, since state.json is no longer its sibling', () => {
  const dir = tmpFgosDir();
  addWork(dir, { id: 'a', title: 'A', kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'true' });
  const logPath = logPathOf(dir);

  let readCount = 0;
  const originalReadFileSync = fs.readFileSync;
  fs.readFileSync = function patched(target, ...rest) {
    if (target === logPath) readCount++;
    return originalReadFileSync.call(fs, target, ...rest);
  };
  let view;
  try {
    view = rebuildView(logPath);
  } finally {
    fs.readFileSync = originalReadFileSync;
  }
  assert.equal(readCount, 1, 'the fast path cannot find its sibling state.json for a per-writer path, so it falls back to exactly one full read');
  assert.equal(view.work.a.status, 'todo', 'the fallback full read is still correct');
});

test('rebuildView via the zero-read fast path still returns a view deep-equal to a fresh full read', () => {
  const dir = tmpFgosDir();
  addWork(dir, { id: 'a', title: 'A', kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'true' });
  const logPath = logPathOf(dir);
  moveWork(dir, { id: 'a', to: 'doing', expectedStatus: 'todo' });

  const viaFastPath = rebuildView(logPath);
  const freshFold = foldEvents(readEventsWhole(logPath));
  assert.deepEqual(viaFastPath, freshFold);
});

test('rebuildView incrementally folds new events after the snapshot, deep-equal to a fresh full read', () => {
  const dir = tmpFgosDir();
  addWork(dir, { id: 'a', title: 'A', kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'true' });
  const logPath = logPathOf(dir);
  // state.json now snapshots the log as of the addWork above. Append MORE
  // events directly (bypassing store.mjs's own refreshView) so the log
  // genuinely outgrows the snapshot without state.json itself moving.
  appendEvent(logPath, { type: 'work.move', payload: { id: 'a', from: 'todo', to: 'doing' } });
  appendEvent(logPath, { type: 'work.edit', payload: { id: 'a', patch: { priority: 42 } } });

  const incremental = rebuildView(logPath);
  const freshFold = foldEvents(readEventsWhole(logPath));
  assert.deepEqual(incremental, freshFold);
  assert.equal(incremental.work.a.status, 'doing');
  assert.equal(incremental.work.a.priority, 42);
});

// Same T4 dependency as the fallback test above: a per-writer log's
// state.json is no longer its sibling, so `tryIncrementalRebuild` cannot
// find a snapshot to diff against at all and always falls back to one full
// read here -- correctly, not a partial/incremental one. `readEventsFromByte`
// (the actual only-new-bytes primitive) still has its OWN direct unit
// coverage elsewhere in this file; this test now asserts the honest
// end-to-end fallback shape for this file layout, not byte-range narrowing.
test('rebuildView falls back to exactly one full read for a per-writer log path when the log grows past what a real fast path would need', () => {
  const dir = tmpFgosDir();
  addWork(dir, { id: 'a', title: 'A', kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'true' });
  const logPath = logPathOf(dir);
  const sizeAtSnapshot = fs.statSync(logPath).size;
  appendEvent(logPath, { type: 'work.move', payload: { id: 'a', from: 'todo', to: 'doing' } });

  const originalReadFileSync = fs.readFileSync;
  let fullFileReadCount = 0;
  fs.readFileSync = function patched(target, ...rest) {
    if (target === logPath) fullFileReadCount++;
    return originalReadFileSync.call(fs, target, ...rest);
  };
  let view;
  try {
    view = rebuildView(logPath);
  } finally {
    fs.readFileSync = originalReadFileSync;
  }
  assert.equal(fullFileReadCount, 1, 'exactly one full read of the log, since no fast path applies for this file shape today');
  assert.equal(view.work.a.status, 'doing', 'the fallback full read still folds the newly-appended event correctly');
  assert.ok(fs.statSync(logPath).size > sizeAtSnapshot, 'sanity: the log genuinely grew past the snapshot');
});

test('rebuildView falls back to a full read when the log SHRANK since the snapshot (never trusts a smaller file)', () => {
  const dir = tmpFgosDir();
  addWork(dir, { id: 'a', title: 'A', kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'true' });
  const logPath = logPathOf(dir);
  addWork(dir, { id: 'b', title: 'B', kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'true' });
  // Truncate the log back to something SMALLER than the snapshot recorded --
  // simulates any pathological external rewrite that shrinks the file.
  const raw = fs.readFileSync(logPath, 'utf8');
  const firstLineEnd = raw.indexOf('\n') + 1;
  fs.writeFileSync(logPath, raw.slice(0, firstLineEnd), 'utf8');

  const view = rebuildView(logPath);
  const freshFold = foldEvents(readEventsWhole(logPath));
  assert.deepEqual(view, freshFold, 'must still produce a CORRECT view of the (now-shrunk) real log, never a stale cached one');
});

test('rebuildView is safe against repairTruncatedLastLine (tail-only rewrite -- prefix genuinely untouched)', () => {
  const dir = tmpFgosDir();
  addWork(dir, { id: 'a', title: 'A', kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'true' });
  const logPath = logPathOf(dir);
  // Simulate a crash mid-append: a genuinely corrupt trailing line.
  fs.appendFileSync(logPath, '{"seq":999,"type":"work.move","payload":{"id":"a"', 'utf8'); // no closing brace, no trailing \n
  repairTruncatedLastLine(logPath);

  const view = rebuildView(logPath);
  const freshFold = foldEvents(readEventsWhole(logPath));
  assert.deepEqual(view, freshFold, 'must still produce a view identical to a fresh full read of the repaired log');
  assert.ok(view.work.a, 'the item added before the corruption must still be present');
});

test('rebuildView falls back to a full read after a resort+reseq rewrite changes the fingerprint (a duplicate-seq line sorted by ts and renumbered)', () => {
  const dir = tmpFgosDir();
  addWork(dir, { id: 'a', title: 'A', kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'true' });
  const logPath = logPathOf(dir);
  // Craft a real seq duplicate directly on the log (a different `ts`, same
  // `seq` as an existing line), then manually apply the same resort-by-ts
  // + renumber-seq-1..N rewrite the retired contiguity fix used to perform
  // -- this test cares about rebuildView's fingerprint behavior on that
  // REWRITE SHAPE, not about any particular repair mechanism.
  const raw = fs.readFileSync(logPath, 'utf8');
  const lastEvent = JSON.parse(raw.trim().split('\n').pop());
  const duplicateLine = `${JSON.stringify({ ...lastEvent, ts: '2026-08-11T00:00:00.000Z' })}\n`;
  fs.appendFileSync(logPath, duplicateLine, 'utf8');

  const linesBefore = fs.readFileSync(logPath, 'utf8').trim().split('\n');
  const parsed = linesBefore.map((l) => JSON.parse(l));
  parsed.sort((a, b) => (a.ts < b.ts ? -1 : a.ts > b.ts ? 1 : 0));
  const resequenced = parsed.map((e, i) => JSON.stringify({ ...e, seq: i + 1 }));
  assert.notDeepEqual(resequenced, linesBefore, 'sanity: the crafted duplicate seq actually changed line content on resort+reseq');
  fs.writeFileSync(logPath, `${resequenced.join('\n')}\n`, 'utf8');

  const view = rebuildView(logPath);
  const freshFold = foldEvents(readEventsWhole(logPath));
  assert.deepEqual(view, freshFold, 'must still produce a view identical to a fresh full read of the resorted+resequenced log');
});

test('rebuildView falls back to a full read after a wholesale reordering rewrite (git merge=union stand-in)', () => {
  const dir = tmpFgosDir();
  addWork(dir, { id: 'a', title: 'A', kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'true' });
  const logPath = logPathOf(dir);
  appendEvent(logPath, { type: 'work.move', payload: { id: 'a', from: 'todo', to: 'doing' } });

  // Simulate what git's own docs say merge=union produces: the same lines,
  // reordered, never a targeted edit -- a real union merge could ALSO
  // reorder lines that were already part of the pre-snapshot prefix.
  const lines = fs.readFileSync(logPath, 'utf8').trim().split('\n');
  const reordered = [...lines].reverse().map((l) => `${l}\n`).join('');
  fs.writeFileSync(logPath, reordered, 'utf8');

  const view = rebuildView(logPath);
  const freshFold = foldEvents(readEventsWhole(logPath));
  assert.deepEqual(view, freshFold, 'must still produce a view identical to a fresh full read of the reordered log');
});

test('rebuildView falls back to a full read when state.json has no snapshot field at all (pre-tsk-49e state.json, or hand-edited)', () => {
  const dir = tmpFgosDir();
  addWork(dir, { id: 'a', title: 'A', kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'true' });
  const logPath = logPathOf(dir);
  const viewPath = resolveFgosFile(dir, FGOS_FILE.STATE);
  const persisted = JSON.parse(fs.readFileSync(viewPath, 'utf8'));
  delete persisted.snapshot;
  fs.writeFileSync(viewPath, JSON.stringify(persisted), 'utf8');

  const view = rebuildView(logPath);
  const freshFold = foldEvents(readEventsWhole(logPath));
  assert.deepEqual(view, freshFold);
});

test('rebuildView falls back to a full read when the snapshot sub-fields are malformed (wrong type, not absent)', () => {
  const dir = tmpFgosDir();
  addWork(dir, { id: 'a', title: 'A', kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'true' });
  const logPath = logPathOf(dir);
  const viewPath = resolveFgosFile(dir, FGOS_FILE.STATE);
  const persisted = JSON.parse(fs.readFileSync(viewPath, 'utf8'));
  persisted.snapshot.size = 'not-a-number';
  fs.writeFileSync(viewPath, JSON.stringify(persisted), 'utf8');

  const view = rebuildView(logPath);
  const freshFold = foldEvents(readEventsWhole(logPath));
  assert.deepEqual(view, freshFold);
});

test('rebuildView zero-read fast path never mutates the persisted view when a caller mutates the returned object (cloneTopLevel protects the snapshot)', () => {
  const dir = tmpFgosDir();
  addWork(dir, { id: 'a', title: 'A', kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'true' });
  const logPath = logPathOf(dir);
  appendEvent(logPath, { type: 'work.move', payload: { id: 'a', from: 'todo', to: 'doing' } });
  appendEvent(logPath, { type: 'work.edit', payload: { id: 'a', patch: { priority: 7 } } });

  const first = rebuildView(logPath); // incremental fold onto the snapshot's savedView
  first.decisions.push({ text: 'mutated by caller, must not leak' });
  first.work.a.priority = 999;

  const second = rebuildView(logPath); // same log, same snapshot -- must be unaffected by the mutation above
  assert.deepEqual(second.decisions, []);
  assert.equal(second.work.a.priority, 7);
});

test('determinism: the zero-read fast path\'s round-tripped view is deep-equal to a fresh fold for a multi-field, realistic item', () => {
  const dir = tmpFgosDir();
  addWork(dir, {
    id: 'a', title: 'A realistic item', kind: 'feature', status: 'todo', deps: [], risk: 'standard', refs: ['docs/x.md'],
    verify: 'npm test', tier: 'standard', description: 'a full description', footprint: ['src/a.mjs'],
  });
  const logPath = logPathOf(dir);
  moveWork(dir, { id: 'a', to: 'doing', expectedStatus: 'todo' });

  const viaFastPath = rebuildView(logPath); // exact-match zero-read shortcut
  const freshFold = foldEvents(readEventsWhole(logPath));
  assert.deepEqual(viaFastPath, freshFold, 'the round-trip through state.json (JSON.stringify/parse) must never drop or alter a field a fresh fold would carry');
});

test('work.handoff replay normalizes the retired human-advisor literal to advisor (tsk-397 D16 rename) -- an append-only log already carrying pre-rename events must not strand an item with a holder the current vocabulary rejects', () => {
  const dir = tmpFgosDir();
  addWork(dir, { id: 'a', title: 'A', kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'true' });
  const logPath = logPathOf(dir);
  appendEvent(logPath, { type: 'work.move', payload: { id: 'a', from: 'todo', to: 'doing' } });
  // Raw pre-rename event shape, exactly as a real log written before D16 has it
  // (.fgos/events.jsonl seq 18440, tsk-1yf) -- never re-authored to the new
  // literal, since the whole point is proving replay heals an already-written
  // retired value, not that a fresh write uses the new one.
  appendEvent(logPath, { type: 'work.handoff', payload: { id: 'a', from: 'implementer', to: 'human-advisor', reason: 'advise', mode: 'async' } });

  const view = rebuildView(logPath);
  assert.equal(view.work.a.holder, 'advisor');
  assert.equal(view.callThreads.a.at(-1).to, 'advisor');

  const freshFold = foldEvents(readEventsWhole(logPath));
  assert.deepEqual(view, freshFold, 'the snapshot fast path and a fresh full fold must normalize identically');
});

// Local helper: reads the whole log via a bypass path (never through
// rebuildView, so these tests' own "fresh full read" oracle is never
// itself affected by the snapshot fast path under test).
function readEventsWhole(logPath) {
  const raw = fs.readFileSync(logPath, 'utf8');
  return raw
    .split('\n')
    .filter((l) => l !== '')
    .map((l) => JSON.parse(l));
}

// ─── Tầng A/T3: multi-file discovery + total order + dedupe ────────────────

test('rebuildViewFromDir merges baseline-0 + per-writer files and rebuilds twice deep-equal even with a same-ts cross-file collision', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-replay-multifile-'));
  const eventsDir = path.join(dir, 'events');
  fs.mkdirSync(eventsDir, { recursive: true });

  const tiedTs = '2026-08-23T00:00:00.000Z';
  fs.writeFileSync(
    path.join(dir, 'events.jsonl'),
    `${JSON.stringify({ seq: 1, ts: '2026-08-22T00:00:00.000Z', type: 'work.add', payload: { id: 'a', title: 'A', status: 'todo' } })}\n`,
    'utf8',
  );
  fs.writeFileSync(
    path.join(eventsDir, 'writer-a-20260823T000000000Z.jsonl'),
    `${JSON.stringify({ seq: 1, ts: tiedTs, type: 'work.move', payload: { id: 'a', from: 'todo', to: 'doing' }, src: 'writer-a', h: 'aaaa000000000001' })}\n`,
    'utf8',
  );
  fs.writeFileSync(
    path.join(eventsDir, 'writer-b-20260823T000000001Z.jsonl'),
    `${JSON.stringify({ seq: 1, ts: tiedTs, type: 'work.edit', payload: { id: 'a', patch: { priority: 7 } }, src: 'writer-b', h: 'bbbb000000000002' })}\n`,
    'utf8',
  );

  const first = rebuildViewFromDir(dir);
  const second = rebuildViewFromDir(dir);
  assert.deepEqual(first, second, 'rebuilding the same multi-file set twice must be deep-equal (TA-D7 total order is deterministic even on a ts tie)');
  assert.equal(first.work.a.status, 'doing');
  assert.equal(first.work.a.priority, 7);
});

test('readAllEventsFromDir dedupes a new-format event by its own h, even if it appears in two files', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-replay-dedupe-'));
  const eventsDir = path.join(dir, 'events');
  fs.mkdirSync(eventsDir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'events.jsonl'), '', 'utf8');

  const shared = { seq: 1, ts: '2026-08-23T00:00:00.000Z', type: 'work.add', payload: { id: 'a', title: 'A', status: 'todo' }, src: 'writer-a', h: 'cccc000000000003' };
  fs.writeFileSync(path.join(eventsDir, 'writer-a-1.jsonl'), `${JSON.stringify(shared)}\n`, 'utf8');
  // Simulates a compaction-crash straddle (TA-D13): the same event surviving
  // in both an original file and a not-yet-archived baseline copy.
  fs.writeFileSync(path.join(eventsDir, 'baseline-crash-copy.jsonl'), `${JSON.stringify(shared)}\n`, 'utf8');

  const events = readAllEventsFromDir(dir);
  assert.equal(events.length, 1, 'the same h across two files is one logical event, not two');
});

test('readAllEventsFromDir dedupes a legacy (pre-hash) baseline line by its own raw content, matching events-jsonl-contiguity.mjs precedent', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-replay-legacy-dedupe-'));
  const legacyLine = JSON.stringify({ seq: 1, ts: '2026-08-23T00:00:00.000Z', type: 'work.add', payload: { id: 'a', title: 'A', status: 'todo' } });
  // Two byte-identical legacy lines in the SAME baseline file (a union-merge
  // artifact, tsk-3wq's own original failure shape) must collapse to one.
  fs.writeFileSync(path.join(dir, 'events.jsonl'), `${legacyLine}\n${legacyLine}\n`, 'utf8');

  const events = readAllEventsFromDir(dir);
  assert.equal(events.length, 1, 'two byte-identical legacy lines (no h) dedupe by raw content');
});

test('readAllEventsFromDir ignores a subdirectory under .fgos/events/ (archive/ exclusion, structural via isFile())', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-replay-archive-'));
  const eventsDir = path.join(dir, 'events');
  const archiveDir = path.join(eventsDir, 'archive');
  fs.mkdirSync(archiveDir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'events.jsonl'), '', 'utf8');
  fs.writeFileSync(
    path.join(eventsDir, 'writer-a-1.jsonl'),
    `${JSON.stringify({ seq: 1, ts: '2026-08-23T00:00:00.000Z', type: 'work.add', payload: { id: 'a', title: 'A', status: 'todo' }, src: 'writer-a', h: 'dddd000000000004' })}\n`,
    'utf8',
  );
  fs.writeFileSync(
    path.join(archiveDir, 'baseline-old.jsonl'),
    `${JSON.stringify({ seq: 1, ts: '2026-01-01T00:00:00.000Z', type: 'work.add', payload: { id: 'z', title: 'Z', status: 'todo' }, src: 'writer-z', h: 'eeee000000000005' })}\n`,
    'utf8',
  );

  const view = rebuildViewFromDir(dir);
  assert.ok(view.work.a, 'the real per-writer file is read');
  assert.equal(view.work.z, undefined, 'a file under archive/ is never discovered');
});

test('rebuildViewFromDir on the real repo events.jsonl (23K+ lines, baseline-0 only, no events/ dir) rebuilds twice deep-equal', () => {
  const realLogPath = path.resolve(fileURLToPath(import.meta.url), '../../../.fgos/events.jsonl');
  let stat;
  try {
    stat = fs.statSync(realLogPath);
  } catch {
    return; // no real log in this checkout (e.g. a fresh clone) -- nothing to prove here
  }
  if (stat.size === 0) return;

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-replay-real-log-'));
  fs.copyFileSync(realLogPath, path.join(dir, 'events.jsonl')); // read-only copy -- the real file is never opened for writing

  const first = rebuildViewFromDir(dir);
  const second = rebuildViewFromDir(dir);
  assert.deepEqual(first, second, 'rebuilding the real 23K+-line log twice through the multi-file door must still be deep-equal (D3 determinism holds at real scale)');
  assert.ok(Object.keys(first.work).length > 0, 'sanity: the real log actually folds real work items');
});

// ─── Tầng A/T4: incremental anchor restored for the multi-file shape ───────

test('rebuildViewFromDir takes the zero-read fast path when every discovered file is byte-identical to its snapshot', () => {
  const dir = tmpFgosDir();
  addWork(dir, { id: 'a', title: 'A', kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'true' });
  const logPath = logPathOf(dir);

  let readCount = 0;
  const originalReadFileSync = fs.readFileSync;
  fs.readFileSync = function patched(target, ...rest) {
    if (target === logPath) readCount++;
    return originalReadFileSync.call(fs, target, ...rest);
  };
  let view;
  try {
    view = rebuildViewFromDir(dir);
  } finally {
    fs.readFileSync = originalReadFileSync;
  }
  assert.equal(readCount, 0, 'zero reads of the writer file -- only state.json + stats, the fast path T4 restores');
  assert.equal(view.work.a.status, 'todo');
});

test('rebuildViewFromDir incrementally folds new events appended after the snapshot (bypassing store.mjs), deep-equal to a fresh full read', () => {
  const dir = tmpFgosDir();
  addWork(dir, { id: 'a', title: 'A', kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'true' });
  const logPath = logPathOf(dir);
  appendEvent(logPath, { type: 'work.move', payload: { id: 'a', from: 'todo', to: 'doing' } });
  appendEvent(logPath, { type: 'work.edit', payload: { id: 'a', patch: { priority: 9 } } });

  const incremental = rebuildViewFromDir(dir);
  const fresh = foldEvents(readAllEventsFromDir(dir));
  assert.deepEqual(incremental, fresh);
  assert.equal(incremental.work.a.status, 'doing');
  assert.equal(incremental.work.a.priority, 9);
});

test('rebuildViewFromDir falls back to a full read when a new writer file appears under .fgos/events/ since the snapshot', () => {
  const dir = tmpFgosDir();
  addWork(dir, { id: 'a', title: 'A', kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'true' });
  const eventsDir = path.join(dir, 'events');
  fs.writeFileSync(
    path.join(eventsDir, 'writer-z-1.jsonl'),
    `${JSON.stringify({ seq: 1, ts: '2026-08-23T00:00:01.000Z', type: 'work.add', payload: { id: 'b', title: 'B', status: 'todo' }, src: 'writer-z', h: 'ffff000000000006' })}\n`,
    'utf8',
  );

  const view = rebuildViewFromDir(dir);
  const fresh = foldEvents(readAllEventsFromDir(dir));
  assert.deepEqual(view, fresh, 'must still be correct via the full-read fallback');
  assert.ok(view.work.b, 'the new file IS discovered -- the fallback still reads everything');
});

test('rebuildViewFromDir falls back to a full read when a per-writer file shrank since the snapshot', () => {
  const dir = tmpFgosDir();
  addWork(dir, { id: 'a', title: 'A', kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'true' });
  moveWork(dir, { id: 'a', to: 'doing', expectedStatus: 'todo' });
  const logPath = logPathOf(dir);
  const lines = fs.readFileSync(logPath, 'utf8').split('\n').filter(Boolean);
  fs.writeFileSync(logPath, `${lines[0]}\n`, 'utf8'); // truncate back to just the add -- shrank relative to the last snapshot

  const view = rebuildViewFromDir(dir);
  assert.equal(view.work.a.status, 'todo', 'honestly reflects the shrunk file via full read, never a stale cached status');
});

test('rebuildViewFromDir falls back to a full read when a newly-read event\'s ts does not exceed maxTs (TA-D8 strict tie check)', () => {
  const dir = tmpFgosDir();
  addWork(dir, { id: 'a', title: 'A', kind: 'task', status: 'todo', deps: [], risk: 'light', refs: [], verify: 'true' });
  const logPath = logPathOf(dir);
  const priorEvent = JSON.parse(fs.readFileSync(logPath, 'utf8').trim());
  // Same ts as the already-snapshotted event -- a tie, not strictly greater.
  fs.appendFileSync(
    logPath,
    `${JSON.stringify({ ...priorEvent, seq: priorEvent.seq + 1, type: 'work.edit', payload: { id: 'a', patch: { priority: 3 } }, h: 'gggg000000000007' })}\n`,
    'utf8',
  );

  const view = rebuildViewFromDir(dir);
  assert.equal(view.work.a.priority, 3, 'still correct via the full-read fallback despite the ts tie');
});

test('buildSnapshotFromDir computes maxTs as the true maximum ts across every discovered file, not file-iteration order', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-replay-snapshot-maxts-'));
  fs.writeFileSync(
    path.join(dir, 'events.jsonl'),
    `${JSON.stringify({ seq: 1, ts: '2026-01-01T00:00:00.000Z', type: 'work.add', payload: { id: 'a', title: 'A', status: 'todo' } })}\n`,
    'utf8',
  );
  const eventsDir = path.join(dir, 'events');
  fs.mkdirSync(eventsDir);
  fs.writeFileSync(
    path.join(eventsDir, 'writer-a-1.jsonl'),
    `${JSON.stringify({ seq: 1, ts: '2026-08-23T00:00:00.000Z', type: 'work.move', payload: { id: 'a', from: 'todo', to: 'doing' }, src: 'writer-a', h: 'hhhh000000000008' })}\n`,
    'utf8',
  );
  fs.writeFileSync(
    path.join(eventsDir, 'writer-b-1.jsonl'),
    `${JSON.stringify({ seq: 1, ts: '2026-05-01T00:00:00.000Z', type: 'work.edit', payload: { id: 'a', patch: { priority: 1 } }, src: 'writer-b', h: 'iiii000000000009' })}\n`,
    'utf8',
  );

  const snapshot = buildSnapshotFromDir(dir);
  assert.equal(snapshot.maxTs, '2026-08-23T00:00:00.000Z', 'max ts must come from writer-a (most recent), regardless of readdir order');
  assert.equal(Object.keys(snapshot.files).length, 3, 'baseline (\'\') + writer-a + writer-b, one entry each');
});

test('buildSnapshotFromDir records size:0/lastLine:null for baseline-0 when it does not physically exist yet', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-replay-snapshot-nobaseline-'));
  fs.mkdirSync(path.join(dir, 'events'));
  fs.writeFileSync(
    path.join(dir, 'events', 'writer-a-1.jsonl'),
    `${JSON.stringify({ seq: 1, ts: '2026-08-23T00:00:00.000Z', type: 'work.add', payload: { id: 'a', title: 'A', status: 'todo' }, src: 'writer-a', h: 'jjjj00000000000a' })}\n`,
    'utf8',
  );

  const snapshot = buildSnapshotFromDir(dir);
  assert.deepEqual(snapshot.files[''], { size: 0, lastLine: null });
});
