// test/state/store.test.mjs — câu-6 tự động (Phase 3 S3-closeout (c)):
// moveWork composes a learning record MECHANICALLY the moment an item
// reaches `done` via EITHER entry door (doing->done, proposed->done — both
// converge on this one moveWork call), from data the view already folded
// for the item (outcome/friction/settlement channels). No model call, no
// second write door (per this cell's must_haves).
//
// Store is otherwise tested through the CLI (see test/state/awaiting.test.mjs
// — "There is no store.test.mjs"); this file exists because asserting the
// exact composed learning content is cheaper directly against moveWork's
// returned `view` than round-tripping through the CLI's stdout formatting.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { addWork, moveWork, addOutcome, addFriction, listWork } from '../../src/state/store.mjs';

// Every test gets its own mkdtemp dir — never touch the repo's .fgos/.
function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-store-learning-'));
}

function addSampleWork(dir, id, overrides = {}) {
  addWork(dir, {
    id,
    title: `Title ${id}`,
    kind: 'task',
    status: 'todo',
    deps: [],
    risk: 'low',
    refs: [],
    verify: 'npm test',
    ...overrides,
  });
}

test('moveWork doing->done composes a learning record reflecting the item\'s actual outcome, friction (by layer), and settlement (by kind/actor)', () => {
  const dir = tmpDir();
  addSampleWork(dir, 'learn-doing');
  moveWork(dir, { id: 'learn-doing', to: 'doing', expectedStatus: 'todo' });

  addOutcome(dir, { id: 'learn-doing', predicted: { tier: 'standard', deps: 0, priorVisits: 0 } });
  addOutcome(dir, {
    id: 'learn-doing',
    actual: { outcome: 'pass', passed: true, attempts: 2, errorClass: null, aheadCount: 0, visits: 1 },
  });
  addFriction(dir, {
    id: 'learn-doing',
    disposition: 'parked',
    errorClass: 'verify-miss',
    layer: 'verification',
    attempts: 1,
    detail: 'first miss',
  });

  const { view } = moveWork(dir, { id: 'learn-doing', to: 'done', expectedStatus: 'doing', actor: 'human' });

  assert.ok(view.learnings, 'learnings key must exist once an item has closed');
  const records = view.learnings['learn-doing'];
  assert.equal(records.length, 1);
  const record = records[0];
  assert.deepEqual(record.outcome, { disposition: 'pass', attempts: 2, errorClass: null });
  assert.deepEqual(record.frictions, { verification: 1 });
  assert.deepEqual(record.settlements, { 'close/human': 1 });
  assert.equal(typeof record.ts, 'string');
});

test('moveWork proposed->done (the SECOND door into done) also composes a learning record — not only doing->done', () => {
  const dir = tmpDir();
  addSampleWork(dir, 'learn-proposed');
  moveWork(dir, { id: 'learn-proposed', to: 'doing', expectedStatus: 'todo' });
  moveWork(dir, { id: 'learn-proposed', to: 'proposed', expectedStatus: 'doing' });

  const { view } = moveWork(dir, { id: 'learn-proposed', to: 'done', expectedStatus: 'proposed', actor: 'human' });

  assert.ok(view.learnings?.['learn-proposed'], 'proposed->done must also produce a learning record');
  assert.equal(view.learnings['learn-proposed'].length, 1);
  assert.deepEqual(view.learnings['learn-proposed'][0].settlements, { 'close/human': 1 });
});

test('moveWork to done for an item with no outcome and no friction still produces a minimal (not skipped) learning record', () => {
  const dir = tmpDir();
  addSampleWork(dir, 'learn-empty');
  moveWork(dir, { id: 'learn-empty', to: 'doing', expectedStatus: 'todo' });

  const { view } = moveWork(dir, { id: 'learn-empty', to: 'done', expectedStatus: 'doing', actor: 'human' });

  const record = view.learnings['learn-empty'][0];
  assert.equal(record.outcome, null, 'no outcome recorded -> null, never fabricated');
  assert.deepEqual(record.frictions, {}, 'no friction -> empty group, not omitted');
  // The close transition itself IS a settlement (per phase-3-compound-learning-5)
  // — it is never possible for `settlements` to be empty on a learning
  // record, since reaching `done` always settles at least the close.
  assert.deepEqual(record.settlements, { 'close/human': 1 });
});

test('the learning record rides the SAME work.move event that closes the item — single write door, no extra event, no extra file, and rebuild is deterministic', () => {
  const dir = tmpDir();
  addSampleWork(dir, 'learn-rebuild');
  moveWork(dir, { id: 'learn-rebuild', to: 'doing', expectedStatus: 'todo' });

  const logPath = path.join(dir, 'events.jsonl');
  const filesBefore = fs.readdirSync(dir).sort();
  const eventsBefore = fs.readFileSync(logPath, 'utf8').split('\n').filter(Boolean).length;

  const { event } = moveWork(dir, { id: 'learn-rebuild', to: 'done', expectedStatus: 'doing', actor: 'human' });

  const filesAfter = fs.readdirSync(dir).sort();
  assert.deepEqual(filesAfter, filesBefore, 'no new file appears — the learning record rides the events.jsonl append that already happens');

  const lines = fs.readFileSync(logPath, 'utf8').split('\n').filter(Boolean);
  assert.equal(lines.length, eventsBefore + 1, 'exactly ONE event appended for the close — not two');
  const types = lines.map((l) => JSON.parse(l).type);
  assert.deepEqual(types, ['work.add', 'work.move', 'work.move']);
  assert.equal(event.type, 'work.move');
  assert.ok(event.payload.learning, 'the returned move event itself carries the learning field');

  const rebuiltOnce = listWork(dir);
  const rebuiltTwice = listWork(dir);
  assert.deepEqual(rebuiltTwice, rebuiltOnce, 'rebuilding the same log twice must be deep-equal (determinism)');
});

// --- branch-source take/return write-side stamp (human-rounds D2) ---------
//
// moveWork's destructure is a FIXED field list (never a `...rest` spread,
// per the fold-allowlist critical pattern) — a caller passing a new field
// that this facade does not also destructure gets it silently dropped
// before the event is ever appended. This asserts the write side directly
// (the exact gap a reviewer caught during validating): branchHeadAtTake/
// branchHeadAtReturn must land on the appended event's own payload, not
// only on replay.mjs's later fold.

test('moveWork stamps branchHeadAtTake onto the appended event payload for a blocked -> doing move that carries it', () => {
  const dir = tmpDir();
  addSampleWork(dir, 'branch-take', { status: 'blocked' });

  const { event } = moveWork(dir, { id: 'branch-take', to: 'doing', expectedStatus: 'blocked', actor: 'human', branchHeadAtTake: 'branch-deadbeef' });

  assert.equal(event.payload.branchHeadAtTake, 'branch-deadbeef');
  assert.equal('headAtTake' in event.payload, false, 'a branch take never also stamps the main-based headAtTake');
});

test('moveWork stamps branchHeadAtReturn onto the appended event payload for a doing -> proposed move that carries it, never headAtReturn', () => {
  const dir = tmpDir();
  addSampleWork(dir, 'branch-return', { status: 'blocked' });
  moveWork(dir, { id: 'branch-return', to: 'doing', expectedStatus: 'blocked', actor: 'human', branchHeadAtTake: 'branch-deadbeef' });

  const { event } = moveWork(dir, { id: 'branch-return', to: 'proposed', expectedStatus: 'doing', branchHeadAtReturn: 'branch-c0ffee' });

  assert.equal(event.payload.branchHeadAtReturn, 'branch-c0ffee');
  assert.equal('headAtReturn' in event.payload, false, 'a branch return never also stamps the main-based headAtReturn (D2 CẤM)');
});

test('moveWork omits branchHeadAtTake/branchHeadAtReturn entirely from the event payload when the caller never supplies them (byte-identical to the pre-D2 shape)', () => {
  const dir = tmpDir();
  addSampleWork(dir, 'branch-absent');

  const { event } = moveWork(dir, { id: 'branch-absent', to: 'doing', expectedStatus: 'todo', actor: 'human', headAtTake: 'main-deadbeef' });

  assert.equal('branchHeadAtTake' in event.payload, false);
  assert.equal('branchHeadAtReturn' in event.payload, false);
});
