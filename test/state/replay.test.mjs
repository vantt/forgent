import '../helpers/process-tmp-root.mjs';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { foldEvents, viewRevision, serializeView } from '../../src/state/replay.mjs';

const TS = '2026-07-15T00:00:00.000Z';
const ev = (type, payload, ts = TS) => ({ ts, type, payload });

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

test('foldEvents twice over the same events produces deep-equal views (determinism)', () => {
  const events = [
    ev('work.add', { id: 'a', title: 'A', status: 'todo' }),
    ev('work.move', { id: 'a', from: 'todo', to: 'doing' }),
    ev('decision', { text: 'locked D5' }),
  ];
  const first = foldEvents(events);
  const second = foldEvents(events);
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

test('foldEvents applies work.step to set item.workflowStep', () => {
  const events = [
    { seq: 1, ts: '2026-07-16T00:00:00.000Z', type: 'work.add', payload: { id: 'a', title: 'A', status: 'todo', workflowStep: 'clarify' } },
    { seq: 2, ts: '2026-07-16T00:00:01.000Z', type: 'work.step', payload: { id: 'a', from: 'clarify', to: 'executing' } },
  ];
  const view = foldEvents(events);
  assert.equal(view.work.a.workflowStep, 'executing');
});

test('foldEvents work.step also sets item.verify when the event carries one (one event does both)', () => {
  const events = [
    { seq: 1, ts: '2026-07-16T00:00:00.000Z', type: 'work.add', payload: { id: 'a', title: 'A', status: 'todo', workflowStep: 'clarify', verify: 'P15 will fill this in' } },
    { seq: 2, ts: '2026-07-16T00:00:01.000Z', type: 'work.step', payload: { id: 'a', from: 'clarify', to: 'executing', verify: 'npm test -- a' } },
  ];
  const view = foldEvents(events);
  assert.equal(view.work.a.workflowStep, 'executing');
  assert.equal(view.work.a.verify, 'npm test -- a');
});

test('foldEvents work.step without a verify leaves item.verify untouched', () => {
  const events = [
    { seq: 1, ts: '2026-07-16T00:00:00.000Z', type: 'work.add', payload: { id: 'a', title: 'A', status: 'todo', workflowStep: 'clarify', verify: 'original verify' } },
    { seq: 2, ts: '2026-07-16T00:00:01.000Z', type: 'work.step', payload: { id: 'a', from: 'clarify', to: 'executing' } },
  ];
  const view = foldEvents(events);
  assert.equal(view.work.a.verify, 'original verify');
});

test('foldEvents maps the older step name "decompose" onto the plan step "planning"', () => {
  const events = [
    { seq: 1, ts: '2026-07-16T00:00:00.000Z', type: 'work.add', payload: { id: 'a', title: 'A', status: 'todo', workflowStep: 'discovery' } },
    { seq: 2, ts: '2026-07-16T00:00:01.000Z', type: 'work.step', payload: { id: 'a', from: 'discovery', to: 'decompose' } },
  ];
  const view = foldEvents(events);
  assert.equal(view.work.a.workflowStep, 'planning');
});

// --- the single read path for records written before the rename ---

test('foldEvents folds an older work.add carrying `stage` into workflowStep and never leaves `stage` on the item', () => {
  const view = foldEvents([
    { seq: 1, ts: '2026-07-16T00:00:00.000Z', type: 'work.add', payload: { id: 'a', title: 'A', status: 'todo', stage: 'decompose' } },
  ]);
  assert.equal(view.work.a.workflowStep, 'planning');
  assert.equal(Object.hasOwn(view.work.a, 'stage'), false);
});

test('foldEvents folds a work.stage event (written by a binary from before the rename) exactly like work.step', () => {
  const base = { seq: 1, ts: '2026-07-16T00:00:00.000Z', type: 'work.add', payload: { id: 'a', title: 'A', status: 'todo', workflowStep: 'discovery' } };
  const viaStage = foldEvents([base, { seq: 2, ts: '2026-07-16T00:00:01.000Z', type: 'work.stage', payload: { id: 'a', from: 'discovery', to: 'planning', verify: 'npm test' } }]);
  const viaStep = foldEvents([base, { seq: 2, ts: '2026-07-16T00:00:01.000Z', type: 'work.step', payload: { id: 'a', from: 'discovery', to: 'planning', verify: 'npm test' } }]);
  assert.deepEqual(viaStage, viaStep);
  assert.equal(viaStage.work.a.workflowStep, 'planning');
  assert.equal(viaStage.work.a.verify, 'npm test');
});

test('foldEvents folds a work.edit patch carrying `stage` into workflowStep', () => {
  const view = foldEvents([
    { seq: 1, ts: '2026-07-16T00:00:00.000Z', type: 'work.add', payload: { id: 'a', title: 'A', status: 'todo', workflowStep: 'discovery' } },
    { seq: 2, ts: '2026-07-16T00:00:01.000Z', type: 'work.edit', payload: { id: 'a', patch: { stage: 'exploring' } } },
  ]);
  assert.equal(view.work.a.workflowStep, 'exploring');
  assert.equal(Object.hasOwn(view.work.a, 'stage'), false);
});

test('foldEvents ignores a work.step for an id that was never added', () => {
  const events = [
    { seq: 1, ts: '2026-07-16T00:00:00.000Z', type: 'work.step', payload: { id: 'ghost', from: 'clarify', to: 'executing' } },
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
// per D3/R3): 'clarify-pass' (work.step -> executing), 'answer' (work.move
// carrying an answer), 'close' (work.move -> done). `role` rides on the
// SAME event's payload (additive, optional) rather than a separate write.
//
// tsk-qod D1/D2: the settlement gate itself moved from `from === 'clarify'`
// to `from === 'discovery'` (replay.mjs) — `discovery` (`stages[0]`) is now
// the coding domain's own entry stage, since `clarify` retired entirely.
// The settlement `kind` string stays the literal 'clarify-pass' (a stable,
// already-persisted event-history label, never renamed retroactively).

test('foldEvents derives a clarify-pass settlement from work.step -> exploring, carrying role + verify as detail', () => {
  const events = [
    { seq: 1, ts: '2026-07-16T00:00:00.000Z', type: 'work.add', payload: { id: 'a', title: 'A', status: 'todo', workflowStep: 'discovery' }, v: 2 },
    { seq: 2, ts: '2026-07-16T00:00:01.000Z', type: 'work.step', payload: { id: 'a', from: 'discovery', to: 'exploring', verify: 'npm test -- a', role: 'runner' }, v: 2 },
  ];
  const view = foldEvents(events);
  assert.equal(view.settlements.a.length, 1);
  assert.deepEqual(view.settlements.a[0], { kind: 'clarify-pass', role: 'runner', ts: '2026-07-16T00:00:01.000Z', detail: 'npm test -- a' });
});

test('foldEvents derives a clarify-pass settlement from work.step discovery -> planning too (settlement keys off leaving the entry stage, not landing on executing)', () => {
  const events = [
    { seq: 1, ts: '2026-07-16T00:00:00.000Z', type: 'work.add', payload: { id: 'a', title: 'A', status: 'todo', workflowStep: 'discovery' }, v: 2 },
    { seq: 2, ts: '2026-07-16T00:00:01.000Z', type: 'work.step', payload: { id: 'a', from: 'discovery', to: 'planning', verify: 'npm test -- a', role: 'runner' }, v: 2 },
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
// `resolveDiscovery` call appends immediately BEFORE its `moveStep`
// (discovery.mjs), so the fold can read it with no new payload field and no
// change to already-written events.

test('foldEvents does NOT derive a clarify-pass settlement when the discovery verdict that drove the discovery -> exploring move was unclear', () => {
  const events = [
    { seq: 1, ts: '2026-08-12T00:00:00.000Z', type: 'work.add', payload: { id: 'a', title: 'A', status: 'todo', workflowStep: 'discovery' }, v: 2 },
    { seq: 2, ts: '2026-08-12T00:00:01.000Z', type: 'work.discovery', payload: { id: 'a', clear: false, question: 'Which auth provider?' }, v: 2 },
    { seq: 3, ts: '2026-08-12T00:00:02.000Z', type: 'work.step', payload: { id: 'a', from: 'discovery', to: 'exploring', verify: 'chưa xác định — bổ sung thủ công', role: 'session' }, v: 2 },
  ];
  const view = foldEvents(events);
  assert.equal('settlements' in view, false);
});

test('foldEvents still derives a clarify-pass settlement when the discovery verdict that drove the move was clear', () => {
  const events = [
    { seq: 1, ts: '2026-08-12T00:00:00.000Z', type: 'work.add', payload: { id: 'a', title: 'A', status: 'todo', workflowStep: 'discovery' }, v: 2 },
    { seq: 2, ts: '2026-08-12T00:00:01.000Z', type: 'work.discovery', payload: { id: 'a', clear: true }, v: 2 },
    { seq: 3, ts: '2026-08-12T00:00:02.000Z', type: 'work.step', payload: { id: 'a', from: 'discovery', to: 'planning', verify: 'npm test -- a', role: 'session' }, v: 2 },
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
    { seq: 1, ts: '2026-08-12T00:00:00.000Z', type: 'work.add', payload: { id: 'a', title: 'A', status: 'todo', workflowStep: 'discovery' }, v: 2 },
    { seq: 2, ts: '2026-08-12T00:00:01.000Z', type: 'work.step', payload: { id: 'a', from: 'discovery', to: 'exploring', verify: 'npm test -- a', role: 'runner' }, v: 2 },
  ];
  const view = foldEvents(events);
  assert.equal(view.settlements.a.length, 1);
  assert.equal(view.settlements.a[0].kind, 'clarify-pass');
});

test('foldEvents does NOT derive a settlement from work.step exploring -> planning (it never leaves discovery)', () => {
  const events = [
    { seq: 1, ts: '2026-07-16T00:00:00.000Z', type: 'work.add', payload: { id: 'a', title: 'A', status: 'todo', workflowStep: 'exploring' }, v: 2 },
    { seq: 2, ts: '2026-07-16T00:00:01.000Z', type: 'work.step', payload: { id: 'a', from: 'exploring', to: 'planning' }, v: 2 },
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
    { seq: 1, ts: '2026-07-15T00:00:00.000Z', type: 'work.add', payload: { id: 'a', title: 'A', status: 'todo', workflowStep: 'discovery' }, v: 2 },
    { seq: 2, ts: '2026-07-15T00:00:01.000Z', type: 'work.step', payload: { id: 'a', from: 'discovery', to: 'exploring', verify: 'npm test', role: 'runner' }, v: 2 },
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

test('foldEvents preserves the historical ts from each event, never the current wall-clock time', () => {
  // A ts far in the past — if replay ever called Date.now() instead of using
  // event.ts, this assertion would fail against "now".
  const pastTs = '2001-01-01T00:00:00.000Z';
  const view = foldEvents([{ seq: 1, ts: pastTs, type: 'decision', payload: { text: 'old decision' } }]);
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

const ADD_A = ev('work.add', { id: 'a', title: 'A', status: 'todo' });
const MOVE_A = ev('work.move', { id: 'a', from: 'todo', to: 'doing' });

test('serializeView returns serialized JSON string and matching revision hash (tsk-37d)', () => {
  const view = foldEvents([ADD_A]);

  const { viewStr, revision } = serializeView(view);
  assert.equal(typeof viewStr, 'string');
  assert.equal(revision, viewRevision(view));
  assert.deepEqual(JSON.parse(viewStr), view);
});

test('viewRevision is deterministic: folding the same events twice yields byte-identical revisions', () => {
  const r1 = viewRevision(foldEvents([ADD_A, MOVE_A]));
  const r2 = viewRevision(foldEvents([ADD_A, MOVE_A]));
  assert.equal(r1, r2);
  assert.match(r1, /^[0-9a-f]{64}$/, 'sha256 hex, same shape as the C1 data_hash');
});

test('viewRevision is sensitive: a new event changes the revision', () => {
  const before = viewRevision(foldEvents([ADD_A]));
  const after = viewRevision(foldEvents([ADD_A, MOVE_A]));

  assert.notEqual(before, after, 'a state mutation must move the fingerprint');
});

test('viewRevision does NOT leak into the fold return: foldEvents still returns the pure {work, decisions, ...} shape', () => {
  const view = foldEvents([ADD_A]);

  viewRevision(view); // computing the hash must not mutate the view
  assert.equal('revision' in view, false, 'the revision is a persisted sibling, never part of the fold return');
  assert.deepEqual(foldEvents([ADD_A]), view, 'fold return unchanged by the revision primitive');
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

test("foldEvents folds writer onto the item across work.move, work.edit and work.step, latest write wins", () => {
  const base = { seq: 1, ts: "2026-07-27T00:00:00.000Z", type: "work.add", payload: { id: "a", title: "A", status: "todo" } };
  const writerA = { id: "sess-1", source: "env" };
  const writerB = { id: "sess-2", source: "registry" };
  const writerC = { id: 4242, source: "pid" };
  const moveEvent = { seq: 2, ts: "2026-07-27T00:00:01.000Z", type: "work.move", payload: { id: "a", to: "doing", writer: writerA } };
  const editEvent = { seq: 3, ts: "2026-07-27T00:00:02.000Z", type: "work.edit", payload: { id: "a", patch: { title: "A2" }, writer: writerB } };
  const stageEvent = { seq: 4, ts: "2026-07-27T00:00:03.000Z", type: "work.step", payload: { id: "a", from: "executing", to: "decompose", writer: writerC } };

  const steps = [
    { events: [base, moveEvent], expected: writerA, label: "work.move" },
    { events: [base, moveEvent, editEvent], expected: writerB, label: "work.edit" },
    { events: [base, moveEvent, editEvent, stageEvent], expected: writerC, label: "work.step" },
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

// ─── folding onto a seed view (an incremental refold from a cursor) ──────────

test('foldEvents onto a seed view equals one fold of all the events and never mutates the seed', () => {
  const head = [ADD_A, MOVE_A];
  const tail = [ev('work.edit', { id: 'a', patch: { priority: 7 } }), ev('decision', { text: 'later' })];
  const seed = foldEvents(head);
  const seedBefore = structuredClone(seed);

  const incremental = foldEvents(tail, seed);
  assert.deepEqual(incremental, foldEvents([...head, ...tail]));
  assert.equal(incremental.work.a.priority, 7);
  assert.deepEqual(seed, seedBefore, 'the seed view is the caller\'s: folding must leave it untouched');

  incremental.decisions.push({ text: 'mutated by caller, must not leak' });
  incremental.work.a.priority = 999;
  assert.deepEqual(seed, seedBefore, 'mutating the result must not reach the seed either');
});

test('work.handoff replay normalizes the retired human-advisor literal to advisor (tsk-397 D16 rename) -- an append-only history already carrying pre-rename events must not strand an item with a holder the current vocabulary rejects', () => {
  // Raw pre-rename event shape, exactly as a history written before D16 has it -- never re-authored to the new
  // literal, since the whole point is proving replay heals an already-written retired value.
  const events = [
    ADD_A,
    MOVE_A,
    ev('work.handoff', { id: 'a', from: 'implementer', to: 'human-advisor', reason: 'advise', mode: 'async' }),
  ];
  const view = foldEvents(events);
  assert.equal(view.work.a.holder, 'advisor');
  assert.equal(view.callThreads.a.at(-1).to, 'advisor');
});
