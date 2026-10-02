import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { transitionStep } from '../../src/state/step-fsm.mjs';
import { FsmError } from '../../src/state/status-fsm.mjs';
import { addWork, moveStep, addDiscovery, listWork, categoryOf, readRawEvents } from '../../src/state/store.mjs';

function work(workflowStep, overrides = {}) {
  return { id: 'w1', ...(workflowStep !== undefined ? { workflowStep } : {}), ...overrides };
}

// Store-level round trips (moveStep/addDiscovery) live here: there is no
// dedicated store test for them, same precedent as awaiting.test.mjs for
// putInAwaiting/answerAwaiting.
function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-step-'));
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
    // `discovery` is the first step of coding/feature, the real entry point a
    // fresh item starts at.
    workflowStep: 'discovery',
    ...overrides,
  });
}

// The legal moves are the `transitions` of domains/coding/workflows/feature.yaml.
test('transitionStep allows exactly the moves the coding Workflow declares', () => {
  const legal = [
    ['discovery', 'exploring'],
    ['discovery', 'planning'],
    ['exploring', 'planning'],
    ['planning', 'executing'],
  ];
  for (const [from, to] of legal) {
    assert.deepEqual(
      transitionStep({ work: work(from), to }),
      { type: 'work.step', payload: { id: 'w1', from, to } },
      `${from}->${to} must be legal`,
    );
  }
});

test('transitionStep refuses every other pair as precondition', () => {
  const illegalPairs = [
    ['executing', 'discovery'],
    ['executing', 'executing'],
    ['discovery', 'discovery'],
    ['discovery', 'executing'],
    ['exploring', 'discovery'],
    ['exploring', 'executing'],
    ['planning', 'discovery'],
    ['planning', 'exploring'],
    ['planning', 'planning'],
    ['executing', 'planning'],
  ];
  for (const [from, to] of illegalPairs) {
    assert.throws(
      () => transitionStep({ work: work(from), to }),
      (err) => err instanceof FsmError && err.category === 'precondition',
      `expected ${from}->${to} to be refused as precondition`,
    );
  }
});

test('transitionStep refuses a step the Workflow never declared (the retired clarify/decompose names)', () => {
  for (const to of ['clarify', 'decompose', 'bogus']) {
    assert.throws(
      () => transitionStep({ work: work('discovery'), to }),
      (err) => err instanceof FsmError && err.category === 'precondition',
    );
  }
});

test('transitionStep reads a missing step as the execute step (lazy default)', () => {
  // The lazy default is `executing`, from which no move is legal.
  assert.throws(
    () => transitionStep({ work: work(undefined), to: 'executing' }),
    (err) => err instanceof FsmError && err.category === 'precondition',
  );
});

test('transitionStep reads a record that still carries the older name "decompose" as the plan step', () => {
  // Replay maps the name forward, so a Work item built from an old record already says
  // `planning`; the FSM resolves an alias that reaches it directly too.
  const event = transitionStep({ work: work('decompose'), to: 'executing' });
  assert.deepEqual(event, { type: 'work.step', payload: { id: 'w1', from: 'planning', to: 'executing' } });
});

test('transitionStep carries verify in the payload when supplied, and omits it when not', () => {
  const withVerify = transitionStep({ work: work('discovery'), to: 'exploring', verify: 'npm test -- discovered' });
  assert.deepEqual(withVerify, {
    type: 'work.step',
    payload: { id: 'w1', from: 'discovery', to: 'exploring', verify: 'npm test -- discovered' },
  });

  const withoutVerify = transitionStep({ work: work('discovery'), to: 'exploring' });
  assert.equal('verify' in withoutVerify.payload, false);
});

test('transitionStep CAS: matching expectedStep proceeds normally', () => {
  const event = transitionStep({ work: work('discovery'), to: 'exploring', expectedStep: 'discovery' });
  assert.equal(event.payload.from, 'discovery');
  assert.equal(event.payload.to, 'exploring');
});

test('transitionStep CAS: mismatched expectedStep is refused as conflict, not precondition', () => {
  assert.throws(
    () => transitionStep({ work: work('discovery'), to: 'exploring', expectedStep: 'executing' }),
    (err) => err instanceof FsmError && err.category === 'conflict',
  );
});

test('transitionStep CAS mismatch takes priority over table lookup (conflict, not precondition, even for a bogus target)', () => {
  assert.throws(
    () => transitionStep({ work: work('discovery'), to: 'bogus', expectedStep: 'executing' }),
    (err) => err instanceof FsmError && err.category === 'conflict',
  );
});

test('transitionStep CAS treats a missing step as the execute step against expectedStep', () => {
  // expectedStep: 'executing' matches a step-less item's lazy default, so CAS passes — the
  // failure that follows is precondition (no such edge), proving the lazy default is what
  // fed the CAS check, not a conflict.
  assert.throws(
    () => transitionStep({ work: work(undefined), to: 'planning', expectedStep: 'executing' }),
    (err) => err instanceof FsmError && err.category === 'precondition',
  );
  assert.throws(
    () => transitionStep({ work: work(undefined), to: 'planning', expectedStep: 'discovery' }),
    (err) => err instanceof FsmError && err.category === 'conflict',
  );
});

test('transitionStep requires a work object', () => {
  assert.throws(
    () => transitionStep({ to: 'executing' }),
    (err) => err instanceof FsmError && err.category === 'precondition',
  );
});

test('transitionStep requires a non-empty "to"', () => {
  assert.throws(
    () => transitionStep({ work: work('discovery') }),
    (err) => err instanceof FsmError && err.category === 'precondition',
  );
  assert.throws(
    () => transitionStep({ work: work('discovery'), to: '' }),
    (err) => err instanceof FsmError && err.category === 'precondition',
  );
});

test('moveStep then rebuild -> step executing + verify replaced (one event does both)', () => {
  const dir = tmpDir();
  addSampleWork(dir, { workflowStep: 'planning' });

  const { view } = moveStep(dir, { id: 'item-x', to: 'executing', expectedStep: 'planning', verify: 'npm test -- item-x' });
  assert.equal(view.work['item-x'].workflowStep, 'executing');
  assert.equal(view.work['item-x'].verify, 'npm test -- item-x');

  const rebuilt = listWork(dir);
  assert.equal(rebuilt.work['item-x'].workflowStep, 'executing');
  assert.equal(rebuilt.work['item-x'].verify, 'npm test -- item-x');
});

test('moveStep carries an item exploring -> planning -> executing (the live chain a new item walks)', () => {
  const dir = tmpDir();
  addSampleWork(dir, { workflowStep: 'exploring' });

  const planned = moveStep(dir, { id: 'item-x', to: 'planning', expectedStep: 'exploring' });
  assert.equal(planned.view.work['item-x'].workflowStep, 'planning');

  const { view } = moveStep(dir, { id: 'item-x', to: 'executing', expectedStep: 'planning' });
  assert.equal(view.work['item-x'].workflowStep, 'executing');

  const rebuilt = listWork(dir);
  assert.equal(rebuilt.work['item-x'].workflowStep, 'executing');
});

test('moveStep appends a work.step event and the item never carries a "stage" field', () => {
  const dir = tmpDir();
  addSampleWork(dir);
  moveStep(dir, { id: 'item-x', to: 'exploring', expectedStep: 'discovery' });

  const raw = readRawEvents(dir);
  assert.equal(raw.at(-1).type, 'work.step');
  assert.equal(Object.hasOwn(listWork(dir).work['item-x'], 'stage'), false);
});

test('moveStep with a stale expectedStep -> conflict, no event appended', () => {
  const dir = tmpDir();
  addSampleWork(dir);

  const before = listWork(dir);
  const rawBefore = readRawEvents(dir);
  assert.throws(
    () => moveStep(dir, { id: 'item-x', to: 'executing', expectedStep: 'executing' }),
    (err) => categoryOf(err) === 'conflict',
  );

  const after = listWork(dir);
  const rawAfter = readRawEvents(dir);
  assert.deepEqual(after, before);
  assert.equal(rawAfter.length, rawBefore.length);
});

// --- domain-aware: transitionStep looks up its transition table via the item's own
// domain, defaulting to 'coding' ---

test('transitionStep behaves identically with an explicit domain: "coding" as with no domain at all', () => {
  const explicit = transitionStep({ work: work('discovery', { domain: 'coding' }), to: 'exploring' });
  const implicit = transitionStep({ work: work('discovery'), to: 'exploring' });
  assert.deepEqual(explicit, implicit);
});

test('transitionStep folds an unrecognized work.domain to "coding" and never throws for that reason alone', () => {
  const event = transitionStep({ work: work('discovery', { domain: 'bogus-domain' }), to: 'exploring' });
  assert.deepEqual(event, { type: 'work.step', payload: { id: 'w1', from: 'discovery', to: 'exploring' } });
});

test('transitionStep with an unrecognized work.domain warns once via console.warn (fail-safe, not silent)', () => {
  const original = console.warn;
  const calls = [];
  console.warn = (...args) => calls.push(args);
  try {
    transitionStep({ work: work('discovery', { domain: 'bogus-domain' }), to: 'exploring' });
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
