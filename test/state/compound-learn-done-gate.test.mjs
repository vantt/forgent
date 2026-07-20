import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { addWork, moveWork, moveStage, StoreError, FsmError } from '../../src/state/store.mjs';

// The FSM done-gate (D3): a work item whose domain declares a Compound-learn
// stage can never reach status `done` without first passing through that
// stage — the synthesis layer is enforced, never left to a reflex that can be
// silently lost. Enforcement lives in store.mjs's moveWork (the single product
// door into `done`), AFTER transitionWork's CAS/precondition checks and BEFORE
// the close side-effect, so error ordering (conflict before precondition) is
// preserved and nothing persists on a refusal. Domains without a Compound-learn
// stage (synthetic) are exempt — coding-only.

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-done-gate-'));
}

function addCoding(dir, id) {
  addWork(dir, {
    id,
    title: `Title ${id}`,
    kind: 'task',
    status: 'todo',
    deps: [],
    risk: 'low',
    refs: [],
    verify: 'npm test',
  });
}

function addSynthetic(dir, id) {
  addWork(dir, {
    id,
    title: `Title ${id}`,
    kind: 'task',
    status: 'todo',
    deps: [],
    risk: 'low',
    refs: [],
    verify: 'npm test',
    domain: 'synthetic',
  });
}

test('a coding item at stage executing is refused proposed->done — it must pass through compound-learn first (D3)', () => {
  const dir = tmpDir();
  addCoding(dir, 'gate-proposed');
  moveWork(dir, { id: 'gate-proposed', to: 'doing', expectedStatus: 'todo' });
  moveWork(dir, { id: 'gate-proposed', to: 'proposed', expectedStatus: 'doing' });

  assert.throws(
    () => moveWork(dir, { id: 'gate-proposed', to: 'done', expectedStatus: 'proposed' }),
    (err) => err instanceof StoreError && err.category === 'precondition' && /compound-learn/.test(err.message),
  );
  // Nothing persisted: the item is still proposed after the refusal.
  const { view } = moveWork(dir, { id: 'gate-proposed', to: 'todo', expectedStatus: 'proposed', reason: 'reopen' });
  assert.equal(view.work['gate-proposed'].status, 'todo');
});

test('a coding item at stage executing is refused the doing->done shortcut too (both doors are gated, D3)', () => {
  const dir = tmpDir();
  addCoding(dir, 'gate-doing');
  moveWork(dir, { id: 'gate-doing', to: 'doing', expectedStatus: 'todo' });

  assert.throws(
    () => moveWork(dir, { id: 'gate-doing', to: 'done', expectedStatus: 'doing' }),
    (err) => err instanceof StoreError && err.category === 'precondition',
  );
});

test('a coding item at stage compound-learn is allowed to reach done, and the close composes a learning record', () => {
  const dir = tmpDir();
  addCoding(dir, 'gate-allowed');
  moveWork(dir, { id: 'gate-allowed', to: 'doing', expectedStatus: 'todo' });
  moveWork(dir, { id: 'gate-allowed', to: 'proposed', expectedStatus: 'doing' });
  moveStage(dir, { id: 'gate-allowed', to: 'compound-learn' });

  const { event, view } = moveWork(dir, { id: 'gate-allowed', to: 'done', expectedStatus: 'proposed', actor: 'human' });
  assert.equal(view.work['gate-allowed'].status, 'done');
  // composeLearning preserved: the close event still carries the learning field.
  assert.ok(event.payload.learning, 'the close event carries the composed learning record');
  assert.ok(view.learnings?.['gate-allowed'], 'a learning record was folded for the closed item');
});

test('a synthetic-domain item (no Compound-learn stage) reaches done unchanged — the gate is coding-only', () => {
  const dir = tmpDir();
  addSynthetic(dir, 'exempt-item');
  moveWork(dir, { id: 'exempt-item', to: 'doing', expectedStatus: 'todo' });

  const { view } = moveWork(dir, { id: 'exempt-item', to: 'done', expectedStatus: 'doing', actor: 'human' });
  assert.equal(view.work['exempt-item'].status, 'done');
});

test('a stale expectedStatus on a not-yet-compound coding item still yields conflict, not precondition — CAS ordering is preserved', () => {
  const dir = tmpDir();
  addCoding(dir, 'cas-order');
  moveWork(dir, { id: 'cas-order', to: 'doing', expectedStatus: 'todo' });
  moveWork(dir, { id: 'cas-order', to: 'proposed', expectedStatus: 'doing' });

  // The item is proposed at stage executing — the done-gate WOULD refuse it as
  // precondition, but a stale --expect must be caught FIRST as a conflict,
  // proving the gate sits after transitionWork's CAS check.
  assert.throws(
    () => moveWork(dir, { id: 'cas-order', to: 'done', expectedStatus: 'todo' }),
    (err) => err instanceof FsmError && err.category === 'conflict',
  );
});
