// test/state/awaiting.test.mjs — async-human-gate D2/D5 store round-trip:
// putInAwaiting/answerAwaiting write through the store and rebuild back into
// the expected status + gates[id] shape. There is no store.test.mjs; store
// is otherwise tested through the CLI (see plan.md Slice — Cell 2).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { addWork, moveWork, putInAwaiting, answerAwaiting, listWork, categoryOf } from '../../src/state/store.mjs';

// Every test gets its own mkdtemp dir — never touch the repo's .fgos/.
function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-awaiting-'));
}

function addSampleWork(dir, overrides = {}) {
  addWork(dir, {
    id: 'item-x',
    title: 'Produce the output file',
    kind: 'feature',
    status: 'todo',
    deps: [],
    risk: 'low',
    refs: [],
    verify: 'npm test',
    ...overrides,
  });
}

test('putInAwaiting then rebuild -> status awaiting-human + gates[id].ask', () => {
  const dir = tmpDir();
  addSampleWork(dir);

  const { view } = putInAwaiting(dir, { id: 'item-x', ask: 'OAuth or password?', expectedStatus: 'todo' });
  assert.equal(view.work['item-x'].status, 'awaiting-human');
  assert.deepEqual(view.gates['item-x'], { ask: 'OAuth or password?' });

  const rebuilt = listWork(dir);
  assert.equal(rebuilt.work['item-x'].status, 'awaiting-human');
  assert.deepEqual(rebuilt.gates['item-x'], { ask: 'OAuth or password?' });
});

test('answerAwaiting then rebuild -> status todo + gates[id]={ask,answer}', () => {
  const dir = tmpDir();
  addSampleWork(dir);
  putInAwaiting(dir, { id: 'item-x', ask: 'OAuth or password?', expectedStatus: 'todo' });

  const { view } = answerAwaiting(dir, { id: 'item-x', answer: 'OAuth', expectedStatus: 'awaiting-human' });
  assert.equal(view.work['item-x'].status, 'todo');
  assert.deepEqual(view.gates['item-x'], { ask: 'OAuth or password?', answer: 'OAuth' });

  const rebuilt = listWork(dir);
  assert.equal(rebuilt.work['item-x'].status, 'todo');
  assert.deepEqual(rebuilt.gates['item-x'], { ask: 'OAuth or password?', answer: 'OAuth' });
});

test('putInAwaiting with a stale expectedStatus -> conflict, no event appended', () => {
  const dir = tmpDir();
  addSampleWork(dir);
  moveWork(dir, { id: 'item-x', to: 'doing', expectedStatus: 'todo' });

  const before = listWork(dir);
  assert.throws(
    () => putInAwaiting(dir, { id: 'item-x', ask: 'OAuth or password?', expectedStatus: 'todo' }),
    (err) => categoryOf(err) === 'conflict',
  );

  const after = listWork(dir);
  assert.deepEqual(after, before);
  assert.equal(after.work['item-x'].status, 'doing');
});

test('answerAwaiting with a stale expectedStatus -> conflict, no event appended', () => {
  const dir = tmpDir();
  addSampleWork(dir);
  putInAwaiting(dir, { id: 'item-x', ask: 'OAuth or password?', expectedStatus: 'todo' });

  const before = listWork(dir);
  assert.throws(
    () => answerAwaiting(dir, { id: 'item-x', answer: 'OAuth', expectedStatus: 'todo' }),
    (err) => categoryOf(err) === 'conflict',
  );

  const after = listWork(dir);
  assert.deepEqual(after, before);
  assert.equal(after.work['item-x'].status, 'awaiting-human');
});
