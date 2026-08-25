import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { addWork, moveWork, FsmError, resolveWriterLogPath, rebuild } from '../../src/state/store.mjs';
import { appendEvent } from '../../src/state/events.mjs';

// The OLD stage-based "compound-learn done-gate" (RUL50) is RETIRED by
// work-item-status-delivered-retrospective-cleanup D1/D4/D11 — done is no
// longer reached directly from doing/awaiting-approval at all (see
// fsm.test.mjs's full edge-table sweep for that), so a gate keyed on
// `to==='done'` checking the OLD compound-learn *stage* no longer applies.
// This file now covers what replaces it: the sequential
// delivered->retrospective->cleanup->done status chain, and composeLearning
// (RUL21, "câu-6 tự động") still firing correctly on done's one remaining
// door in (cleanup->done). The cleanup->done harness itself (verifying
// merge-on-main + real retrospective content, D8) is a separate module,
// not yet built at this point in the sequence — these tests exercise only
// the FSM/store layer's own shape, unconditionally allowing cleanup->done
// once the chain is walked.

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
    risk: 'light',
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
    risk: 'light',
    refs: [],
    verify: 'npm test',
    domain: 'synthetic',
  });
}

// tsk-40m (docs/architect/doing-coordination-redesign.md): `todo -> doing`
// is retired -- nothing durably writes INTO `doing` anymore. This file's
// own tests need a durably-'doing' item purely as a PRECONDITION for
// exercising a later moveWork(..., expectedStatus: 'doing') call — a raw
// event write, bypassing transitionWork's own edge validation, is the
// direct, honest way to get there (same technique test/state/store.test.mjs
// uses).
function moveToDurableDoingForTest(dir, id, from = 'todo') {
  appendEvent(resolveWriterLogPath(dir), { type: 'work.move', payload: { id, from, to: 'doing' } }, dir);
  rebuild(dir);
}

// Walk doing -> delivered -> retrospective -> cleanup -> done for `id`,
// returning the final { event, view }. `blocked` stands in for `doing` as
// the in-progress precondition (`blocked -> delivered` is an equally legal
// edge) — this helper's own tests never assert the intermediate status.
function walkToDone(dir, id) {
  moveWork(dir, { id, to: 'blocked', expectedStatus: 'todo' });
  moveWork(dir, { id, to: 'delivered', expectedStatus: 'blocked' });
  moveWork(dir, { id, to: 'retrospective', expectedStatus: 'delivered' });
  moveWork(dir, { id, to: 'cleanup', expectedStatus: 'retrospective' });
  return moveWork(dir, { id, to: 'done', expectedStatus: 'cleanup', role: 'human' });
}

test('a coding item walks the full delivered->retrospective->cleanup->done chain and reaches done', () => {
  const dir = tmpDir();
  addCoding(dir, 'gate-allowed');
  const { view } = walkToDone(dir, 'gate-allowed');
  assert.equal(view.work['gate-allowed'].status, 'done');
});

test("composeLearning (RUL21) still fires on done's one remaining door in (cleanup->done)", () => {
  const dir = tmpDir();
  addCoding(dir, 'gate-learning');
  const { event, view } = walkToDone(dir, 'gate-learning');
  assert.ok(event.payload.learning, 'the close event still carries the composed learning record');
  assert.ok(view.learnings?.['gate-learning'], 'a learning record was folded for the closed item');
});

test('done is unreachable by skipping any step of the chain (doing->done, delivered->done are all gone)', () => {
  const dir = tmpDir();
  addCoding(dir, 'gate-no-skip');
  moveToDurableDoingForTest(dir, 'gate-no-skip');
  assert.throws(
    () => moveWork(dir, { id: 'gate-no-skip', to: 'done', expectedStatus: 'doing' }),
    (err) => err instanceof FsmError && err.category === 'precondition',
  );
  moveWork(dir, { id: 'gate-no-skip', to: 'delivered', expectedStatus: 'doing' });
  assert.throws(
    () => moveWork(dir, { id: 'gate-no-skip', to: 'done', expectedStatus: 'delivered' }),
    (err) => err instanceof FsmError && err.category === 'precondition',
  );
});

test('a synthetic-domain item (no compound-learn stage, no worktree) walks the SAME status chain, domain-agnostic per D5', () => {
  const dir = tmpDir();
  addSynthetic(dir, 'exempt-item');
  const { view } = walkToDone(dir, 'exempt-item');
  assert.equal(view.work['exempt-item'].status, 'done');
});

test('a stale expectedStatus mid-chain still yields conflict, not precondition — CAS ordering is preserved', () => {
  const dir = tmpDir();
  addCoding(dir, 'cas-order');
  moveToDurableDoingForTest(dir, 'cas-order');
  moveWork(dir, { id: 'cas-order', to: 'delivered', expectedStatus: 'doing' });

  // The item is already at delivered — a stale --expect targeting doing
  // must be caught FIRST as a conflict, before the (also-illegal) edge
  // lookup for delivered->done gets a chance to report precondition.
  assert.throws(
    () => moveWork(dir, { id: 'cas-order', to: 'done', expectedStatus: 'doing' }),
    (err) => err instanceof FsmError && err.category === 'conflict',
  );
});
