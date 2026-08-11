import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { transitionStage } from '../../src/state/stage-fsm.mjs';
import { FsmError } from '../../src/state/status-fsm.mjs';
import { addWork, moveStage, addDiscovery, listWork, categoryOf, readRawEvents } from '../../src/state/store.mjs';

function work(stage, overrides = {}) {
  return { id: 'w1', ...(stage !== undefined ? { stage } : {}), ...overrides };
}

// Store-level round trips (moveStage/addDiscovery) live here rather than in a
// dedicated store.test.mjs — same precedent as awaiting.test.mjs for
// putInAwaiting/answerAwaiting: there is no store.test.mjs; store is
// otherwise tested through the CLI.
function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-stage-'));
}

function addSampleWork(dir, overrides = {}) {
  addWork(dir, {
    id: 'item-x',
    title: 'Produce the output file',
    kind: 'feature',
    status: 'todo',
    deps: [],
    risk: 'light',
    refs: [],
    verify: 'P15 will fill this in',
    // tsk-qod D1/D2: `clarify` is retired as a stage entirely for the
    // coding domain -- `discovery` (`stages[0]`) is the real entry point a
    // fresh item now starts at.
    stage: 'discovery',
    ...overrides,
  });
}

test('transitionStage allows the two clarify-sourced FSM-legality edges kept for historical migration (tsk-qod D1/D2): clarify -> discovery and clarify -> exploring', () => {
  const toDiscovery = transitionStage({ work: work('clarify'), to: 'discovery' });
  assert.deepEqual(toDiscovery, { type: 'work.stage', payload: { id: 'w1', from: 'clarify', to: 'discovery' } });

  const toExploring = transitionStage({ work: work('clarify'), to: 'exploring' });
  assert.deepEqual(toExploring, { type: 'work.stage', payload: { id: 'w1', from: 'clarify', to: 'exploring' } });
});

test('transitionStage refuses clarify -> executing and clarify -> decompose now that those edges are retired (tsk-qod D1/D2 — clarify carries no stages/skillMap/stepMap entry anymore, only the two FSM-legality edges above survive, kept for scripts/migrate-clarify-split.mjs)', () => {
  assert.throws(
    () => transitionStage({ work: work('clarify'), to: 'executing' }),
    (err) => err instanceof FsmError && err.category === 'precondition',
  );
  assert.throws(
    () => transitionStage({ work: work('clarify'), to: 'decompose' }),
    (err) => err instanceof FsmError && err.category === 'precondition',
  );
});

test('transitionStage allows decompose -> executing', () => {
  const event = transitionStage({ work: work('decompose'), to: 'executing' });
  assert.deepEqual(event, { type: 'work.stage', payload: { id: 'w1', from: 'decompose', to: 'executing' } });
});

test('transitionStage reads a missing stage as "executing" (lazy default)', () => {
  assert.throws(
    () => transitionStage({ work: work(undefined), to: 'executing' }),
    (err) => err instanceof FsmError && err.category === 'precondition',
  );
});

test('transitionStage carries verify in the payload when supplied, and omits it when not', () => {
  const withVerify = transitionStage({ work: work('clarify'), to: 'discovery', verify: 'npm test -- discovered' });
  assert.deepEqual(withVerify, {
    type: 'work.stage',
    payload: { id: 'w1', from: 'clarify', to: 'discovery', verify: 'npm test -- discovered' },
  });

  const withoutVerify = transitionStage({ work: work('clarify'), to: 'discovery' });
  assert.equal('verify' in withoutVerify.payload, false);
});

test('transitionStage rejects edges outside the legal ones (clarify->discovery, clarify->exploring, decompose->executing, exploring->decompose, discovery->exploring, exploring->planning, planning->executing) as precondition', () => {
  const illegalPairs = [
    ['executing', 'clarify'],
    ['executing', 'executing'],
    ['clarify', 'clarify'],
    ['decompose', 'clarify'],
    ['decompose', 'decompose'],
    ['executing', 'decompose'],
    ['planning', 'clarify'],
    ['planning', 'planning'],
    ['executing', 'planning'],
  ];
  for (const [from, to] of illegalPairs) {
    assert.throws(
      () => transitionStage({ work: work(from), to }),
      (err) => err instanceof FsmError && err.category === 'precondition',
      `expected ${from}->${to} to be refused as precondition`,
    );
  }
});

test('transitionStage CAS: matching expectedStage proceeds normally', () => {
  const event = transitionStage({ work: work('clarify'), to: 'discovery', expectedStage: 'clarify' });
  assert.equal(event.payload.from, 'clarify');
  assert.equal(event.payload.to, 'discovery');
});

test('transitionStage CAS: mismatched expectedStage is refused as conflict, not precondition', () => {
  assert.throws(
    () => transitionStage({ work: work('clarify'), to: 'discovery', expectedStage: 'executing' }),
    (err) => err instanceof FsmError && err.category === 'conflict',
  );
});

test('transitionStage CAS mismatch takes priority over table lookup (conflict, not precondition, even for a bogus target)', () => {
  assert.throws(
    () => transitionStage({ work: work('clarify'), to: 'bogus', expectedStage: 'executing' }),
    (err) => err instanceof FsmError && err.category === 'conflict',
  );
});

test('transitionStage CAS treats a missing stage as "executing" against expectedStage', () => {
  // expectedStage: 'executing' matches a stage-less item's lazy default, so
  // CAS passes — the failure that follows is precondition (no such edge),
  // proving the lazy default is what fed the CAS check, not a conflict.
  assert.throws(
    () => transitionStage({ work: work(undefined), to: 'executing', expectedStage: 'executing' }),
    (err) => err instanceof FsmError && err.category === 'precondition',
  );
  // expectedStage: 'clarify' does NOT match the lazy default, so this is a
  // conflict instead.
  assert.throws(
    () => transitionStage({ work: work(undefined), to: 'executing', expectedStage: 'clarify' }),
    (err) => err instanceof FsmError && err.category === 'conflict',
  );
});

test('transitionStage requires a work object', () => {
  assert.throws(
    () => transitionStage({ to: 'executing' }),
    (err) => err instanceof FsmError && err.category === 'precondition',
  );
});

test('transitionStage requires a non-empty "to"', () => {
  assert.throws(
    () => transitionStage({ work: work('clarify') }),
    (err) => err instanceof FsmError && err.category === 'precondition',
  );
  assert.throws(
    () => transitionStage({ work: work('clarify'), to: '' }),
    (err) => err instanceof FsmError && err.category === 'precondition',
  );
});

test('moveStage then rebuild -> stage executing + verify replaced (one event does both)', () => {
  const dir = tmpDir();
  addSampleWork(dir, { stage: 'planning' });

  const { view } = moveStage(dir, { id: 'item-x', to: 'executing', expectedStage: 'planning', verify: 'npm test -- item-x' });
  assert.equal(view.work['item-x'].stage, 'executing');
  assert.equal(view.work['item-x'].verify, 'npm test -- item-x');

  const rebuilt = listWork(dir);
  assert.equal(rebuilt.work['item-x'].stage, 'executing');
  assert.equal(rebuilt.work['item-x'].verify, 'npm test -- item-x');
});

test('moveStage carries an item exploring -> planning -> executing (tsk-qod: the live chain a new item walks now that clarify is retired)', () => {
  const dir = tmpDir();
  addSampleWork(dir, { stage: 'exploring' });

  const planned = moveStage(dir, { id: 'item-x', to: 'planning', expectedStage: 'exploring' });
  assert.equal(planned.view.work['item-x'].stage, 'planning');

  const { view } = moveStage(dir, { id: 'item-x', to: 'executing', expectedStage: 'planning' });
  assert.equal(view.work['item-x'].stage, 'executing');

  const rebuilt = listWork(dir);
  assert.equal(rebuilt.work['item-x'].stage, 'executing');
});

test('moveStage with a stale expectedStage -> conflict, no event appended (must_have)', () => {
  const dir = tmpDir();
  addSampleWork(dir);

  const before = listWork(dir);
  const rawBefore = readRawEvents(dir);
  assert.throws(
    () => moveStage(dir, { id: 'item-x', to: 'executing', expectedStage: 'executing' }),
    (err) => categoryOf(err) === 'conflict',
  );

  const after = listWork(dir);
  const rawAfter = readRawEvents(dir);
  assert.deepEqual(after, before);
  assert.equal(rawAfter.length, rawBefore.length);
});

// --- domain-aware (per base-workflow-model D2/D3): transitionStage looks up
// its transition table via the item's own domain, defaulting to 'coding' ---

test('transitionStage behaves identically with an explicit domain: "coding" as with no domain at all', () => {
  const explicit = transitionStage({ work: work('clarify', { domain: 'coding' }), to: 'discovery' });
  const implicit = transitionStage({ work: work('clarify'), to: 'discovery' });
  assert.deepEqual(explicit, implicit);
});

test('transitionStage folds an unrecognized work.domain to "coding" and never throws for that reason alone', () => {
  const event = transitionStage({ work: work('clarify', { domain: 'bogus-domain' }), to: 'discovery' });
  assert.deepEqual(event, { type: 'work.stage', payload: { id: 'w1', from: 'clarify', to: 'discovery' } });
});

test('transitionStage with an unrecognized work.domain warns once via console.warn (fail-safe, not silent)', () => {
  const original = console.warn;
  const calls = [];
  console.warn = (...args) => calls.push(args);
  try {
    transitionStage({ work: work('clarify', { domain: 'bogus-domain' }), to: 'discovery' });
    assert.equal(calls.length, 1);
    assert.match(calls[0][0], /bogus-domain/);
  } finally {
    console.warn = original;
  }
});

test('addDiscovery APPENDS a verdict record readable back through listWork', () => {
  const dir = tmpDir();
  addSampleWork(dir);

  const { view } = addDiscovery(dir, { id: 'item-x', passed: false, question: 'which auth?' });
  assert.equal(view.discovery['item-x'].length, 1);
  assert.equal(view.discovery['item-x'][0].passed, false);

  addDiscovery(dir, { id: 'item-x', passed: true, verify: 'npm test -- item-x' });
  const rebuilt = listWork(dir);
  assert.equal(rebuilt.discovery['item-x'].length, 2);
  assert.equal(rebuilt.discovery['item-x'][1].passed, true);
});

test('addDiscovery requires a non-empty id', () => {
  const dir = tmpDir();
  assert.throws(
    () => addDiscovery(dir, { passed: true }),
    (err) => categoryOf(err) === 'validation',
  );
});
