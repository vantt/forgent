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

// tsk-539 D11: `ask` must contain two Markdown headings ("## Context",
// "## Why this matters") each with >=20 characters of content — every
// literal ask text in this file must satisfy that shape now.
const VALID_ASK = '## Context\n\nWe need to decide the login mechanism for the new API.\n\n## Why this matters\n\nThe choice determines the SDK dependencies: OAuth or password?';
const VALID_ASK_FIRST = '## Context\n\nFirst round of this decision, still open.\n\n## Why this matters\n\nThe first open question in this round.';
const VALID_ASK_SECOND = '## Context\n\nSecond round of this decision, still open.\n\n## Why this matters\n\nThe second open question in this round.';

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
    risk: 'light',
    refs: [],
    verify: 'npm test',
    ...overrides,
  });
}

test('putInAwaiting then rebuild -> status awaiting-human + gates[id].ask', () => {
  const dir = tmpDir();
  addSampleWork(dir);

  const { view } = putInAwaiting(dir, { id: 'item-x', ask: VALID_ASK, expectedStatus: 'todo' });
  assert.equal(view.work['item-x'].status, 'awaiting-human');
  // askHistory (tsk-25g D1): additive alongside `ask`'s own unchanged
  // single-slot overwrite — see replay.test.mjs for the dedicated
  // accumulation coverage.
  assert.deepEqual(view.gates['item-x'], { ask: VALID_ASK, askHistory: [VALID_ASK] });

  const rebuilt = listWork(dir);
  assert.equal(rebuilt.work['item-x'].status, 'awaiting-human');
  assert.deepEqual(rebuilt.gates['item-x'], { ask: VALID_ASK, askHistory: [VALID_ASK] });
});

test('answerAwaiting then rebuild -> status todo + gates[id]={ask,answer}', () => {
  const dir = tmpDir();
  addSampleWork(dir);
  putInAwaiting(dir, { id: 'item-x', ask: VALID_ASK, expectedStatus: 'todo' });

  const { view } = answerAwaiting(dir, { id: 'item-x', answer: 'OAuth', expectedStatus: 'awaiting-human' });
  assert.equal(view.work['item-x'].status, 'todo');
  assert.deepEqual(view.gates['item-x'], { ask: VALID_ASK, answer: 'OAuth', askHistory: [VALID_ASK] });

  const rebuilt = listWork(dir);
  assert.equal(rebuilt.work['item-x'].status, 'todo');
  assert.deepEqual(rebuilt.gates['item-x'], { ask: VALID_ASK, answer: 'OAuth', askHistory: [VALID_ASK] });
});

test('putInAwaiting with a stale expectedStatus -> conflict, no event appended', () => {
  const dir = tmpDir();
  addSampleWork(dir);
  moveWork(dir, { id: 'item-x', to: 'doing', expectedStatus: 'todo' });

  const before = listWork(dir);
  assert.throws(
    () => putInAwaiting(dir, { id: 'item-x', ask: VALID_ASK, expectedStatus: 'todo' }),
    (err) => categoryOf(err) === 'conflict',
  );

  const after = listWork(dir);
  assert.deepEqual(after, before);
  assert.equal(after.work['item-x'].status, 'doing');
});

test('answerAwaiting with a stale expectedStatus -> conflict, no event appended', () => {
  const dir = tmpDir();
  addSampleWork(dir);
  putInAwaiting(dir, { id: 'item-x', ask: VALID_ASK, expectedStatus: 'todo' });

  const before = listWork(dir);
  assert.throws(
    () => answerAwaiting(dir, { id: 'item-x', answer: 'OAuth', expectedStatus: 'todo' }),
    (err) => categoryOf(err) === 'conflict',
  );

  const after = listWork(dir);
  assert.deepEqual(after, before);
  assert.equal(after.work['item-x'].status, 'awaiting-human');
});

// str61 D2/D3 — parent-anchor snapshot stamped at ask-time, folded into the
// same gates[id] map ask/answer already live on.
test('putInAwaiting with a parentSnapshotAtAsk -> gates[id].parentSnapshotAtAsk on rebuild', () => {
  const dir = tmpDir();
  addSampleWork(dir, { id: 'parent-x', title: 'Parent goal', status: 'todo' });
  addSampleWork(dir, { id: 'item-x', parent: 'parent-x' });

  const snapshot = { id: 'parent-x', title: 'Parent goal', status: 'todo' };
  const { view } = putInAwaiting(dir, {
    id: 'item-x',
    ask: VALID_ASK,
    expectedStatus: 'todo',
    parentSnapshotAtAsk: snapshot,
  });
  assert.deepEqual(view.gates['item-x'], { ask: VALID_ASK, parentSnapshotAtAsk: snapshot, askHistory: [VALID_ASK] });

  const rebuilt = listWork(dir);
  assert.deepEqual(rebuilt.gates['item-x'], { ask: VALID_ASK, parentSnapshotAtAsk: snapshot, askHistory: [VALID_ASK] });
});

test('putInAwaiting with no parentSnapshotAtAsk -> no such key on gates[id] at all', () => {
  const dir = tmpDir();
  addSampleWork(dir);

  const { view } = putInAwaiting(dir, { id: 'item-x', ask: VALID_ASK, expectedStatus: 'todo' });
  assert.deepEqual(view.gates['item-x'], { ask: VALID_ASK, askHistory: [VALID_ASK] });
  assert.ok(!('parentSnapshotAtAsk' in view.gates['item-x']));

  const rebuilt = listWork(dir);
  assert.ok(!('parentSnapshotAtAsk' in rebuilt.gates['item-x']));
});

test('a second ask after an answer overwrites the prior parentSnapshotAtAsk, never merges', () => {
  const dir = tmpDir();
  addSampleWork(dir, { id: 'parent-x', title: 'Parent goal', status: 'todo' });
  addSampleWork(dir, { id: 'item-x', parent: 'parent-x' });

  const firstSnapshot = { id: 'parent-x', title: 'Parent goal', status: 'todo' };
  putInAwaiting(dir, { id: 'item-x', ask: VALID_ASK, expectedStatus: 'todo', parentSnapshotAtAsk: firstSnapshot });
  answerAwaiting(dir, { id: 'item-x', answer: 'OAuth', expectedStatus: 'awaiting-human' });

  const secondSnapshot = { id: 'parent-x', title: 'Parent goal (renamed)', status: 'doing' };
  const { view } = putInAwaiting(dir, {
    id: 'item-x',
    ask: VALID_ASK_SECOND,
    expectedStatus: 'todo',
    parentSnapshotAtAsk: secondSnapshot,
  });

  // Scoped to this cell's concern (the snapshot, not the pre-existing
  // ask/answer accumulation shape, which is unrelated and untouched here):
  // the fresh ask's own `ask` text and `parentSnapshotAtAsk` must be the NEW
  // values, never the first ask's.
  assert.equal(view.gates['item-x'].ask, VALID_ASK_SECOND);
  assert.deepEqual(view.gates['item-x'].parentSnapshotAtAsk, secondSnapshot);

  const rebuilt = listWork(dir);
  assert.equal(rebuilt.gates['item-x'].ask, VALID_ASK_SECOND);
  assert.deepEqual(rebuilt.gates['item-x'].parentSnapshotAtAsk, secondSnapshot);
});

// claim-lock §5.1 — statusAtAsk snapshot + answerAwaiting's dynamic resume
// target. Mirrors the parentSnapshotAtAsk block above exactly, one field
// over: the item's OWN status at ask-time, folded into the same gates[id]
// map, read back by answerAwaiting instead of always falling to 'todo'.

test('putInAwaiting with a statusAtAsk -> gates[id].statusAtAsk on rebuild', () => {
  const dir = tmpDir();
  addSampleWork(dir);
  moveWork(dir, { id: 'item-x', to: 'doing', expectedStatus: 'todo' });

  const { view } = putInAwaiting(dir, {
    id: 'item-x',
    ask: VALID_ASK,
    expectedStatus: 'doing',
    statusAtAsk: 'doing',
  });
  assert.deepEqual(view.gates['item-x'], { ask: VALID_ASK, statusAtAsk: 'doing', askHistory: [VALID_ASK] });

  const rebuilt = listWork(dir);
  assert.deepEqual(rebuilt.gates['item-x'], { ask: VALID_ASK, statusAtAsk: 'doing', askHistory: [VALID_ASK] });
});

test('putInAwaiting with no statusAtAsk -> no such key on gates[id] at all', () => {
  const dir = tmpDir();
  addSampleWork(dir);

  const { view } = putInAwaiting(dir, { id: 'item-x', ask: VALID_ASK, expectedStatus: 'todo' });
  assert.ok(!('statusAtAsk' in view.gates['item-x']));

  const rebuilt = listWork(dir);
  assert.ok(!('statusAtAsk' in rebuilt.gates['item-x']));
});

test('answerAwaiting resumes to statusAtAsk ("doing") instead of hardcoded "todo" — a claim held through the ask survives the answer', () => {
  const dir = tmpDir();
  addSampleWork(dir);
  moveWork(dir, { id: 'item-x', to: 'doing', expectedStatus: 'todo', role: 'session', headAtTake: 'deadbeef' });
  putInAwaiting(dir, { id: 'item-x', ask: VALID_ASK, expectedStatus: 'doing', statusAtAsk: 'doing' });

  const { view } = answerAwaiting(dir, { id: 'item-x', answer: 'OAuth', expectedStatus: 'awaiting-human', role: 'human' });
  assert.equal(view.work['item-x'].status, 'doing');
  // The resume is not a fresh claim — the original claimant/head survive
  // untouched (replay.mjs's from !== 'awaiting-human' guard).
  assert.equal(view.work['item-x'].claimRole, 'session');
  assert.equal(view.work['item-x'].headAtTake, 'deadbeef');

  const rebuilt = listWork(dir);
  assert.equal(rebuilt.work['item-x'].status, 'doing');
});

test('answerAwaiting with no statusAtAsk on the gate falls back to "todo" (backward-compat, byte-identical to the pre-§5.1 behavior)', () => {
  const dir = tmpDir();
  addSampleWork(dir);
  putInAwaiting(dir, { id: 'item-x', ask: VALID_ASK, expectedStatus: 'todo' });

  const { view } = answerAwaiting(dir, { id: 'item-x', answer: 'OAuth', expectedStatus: 'awaiting-human' });
  assert.equal(view.work['item-x'].status, 'todo');
});

test('a second ask after an answer overwrites the prior statusAtAsk, never merges', () => {
  const dir = tmpDir();
  addSampleWork(dir);
  moveWork(dir, { id: 'item-x', to: 'doing', expectedStatus: 'todo' });
  putInAwaiting(dir, { id: 'item-x', ask: VALID_ASK_FIRST, expectedStatus: 'doing', statusAtAsk: 'doing' });
  answerAwaiting(dir, { id: 'item-x', answer: 'first answer', expectedStatus: 'awaiting-human' });

  putInAwaiting(dir, { id: 'item-x', ask: VALID_ASK_SECOND, expectedStatus: 'doing', statusAtAsk: 'doing' });
  const { view } = answerAwaiting(dir, { id: 'item-x', answer: 'second answer', expectedStatus: 'awaiting-human' });
  assert.equal(view.gates['item-x'].ask, VALID_ASK_SECOND);
  assert.equal(view.work['item-x'].status, 'doing');
});

// tsk-63c D1/D3 (decision-schema-rationale-alternatives-source), REVISED by
// tsk-19zm D2: rationale/alternatives/source passed to `putInAwaiting` now
// land on gates[id]'s askRationale/askAlternatives/askSource instead — the
// agent's checkpoint distillate as of THIS ask, kept separate from
// answerAwaiting's own rationale/alternatives/source (still the
// authoritative answer-side trio, unchanged below) so a later answer never
// overwrites it. Same guarded-spread pattern as parentSnapshotAtAsk/
// statusAtAsk above.
test('putInAwaiting with rationale/alternatives/source -> all three land on gates[id] as askRationale/askAlternatives/askSource', () => {
  const dir = tmpDir();
  addSampleWork(dir);

  const { view } = putInAwaiting(dir, {
    id: 'item-x',
    ask: VALID_ASK,
    expectedStatus: 'todo',
    rationale: 'OAuth avoids storing a password hash at all',
    alternatives: 'password auth was considered, rejected for storage risk',
    source: 'session',
  });
  assert.equal(view.gates['item-x'].askRationale, 'OAuth avoids storing a password hash at all');
  assert.equal(view.gates['item-x'].askAlternatives, 'password auth was considered, rejected for storage risk');
  assert.equal(view.gates['item-x'].askSource, 'session');
  assert.ok(!('rationale' in view.gates['item-x']));
  assert.ok(!('alternatives' in view.gates['item-x']));
  assert.ok(!('source' in view.gates['item-x']));

  const rebuilt = listWork(dir);
  assert.equal(rebuilt.gates['item-x'].askRationale, 'OAuth avoids storing a password hash at all');
});

test('putInAwaiting with no rationale/alternatives/source -> none of the ask-checkpoint keys appear on gates[id]', () => {
  const dir = tmpDir();
  addSampleWork(dir);

  const { view } = putInAwaiting(dir, { id: 'item-x', ask: VALID_ASK, expectedStatus: 'todo' });
  assert.ok(!('askRationale' in view.gates['item-x']));
  assert.ok(!('askAlternatives' in view.gates['item-x']));
  assert.ok(!('askSource' in view.gates['item-x']));
});

test('answerAwaiting with rationale/source -> both land on gates[id] alongside the answer', () => {
  const dir = tmpDir();
  addSampleWork(dir);
  putInAwaiting(dir, { id: 'item-x', ask: VALID_ASK, expectedStatus: 'todo' });

  const { view } = answerAwaiting(dir, {
    id: 'item-x',
    answer: 'OAuth',
    expectedStatus: 'awaiting-human',
    role: 'human',
    rationale: 'the team already has an OIDC provider available',
    source: 'human',
  });
  assert.equal(view.gates['item-x'].ask, VALID_ASK);
  assert.equal(view.gates['item-x'].answer, 'OAuth');
  assert.equal(view.gates['item-x'].rationale, 'the team already has an OIDC provider available');
  assert.equal(view.gates['item-x'].source, 'human');
});

test('putInAwaiting then answerAwaiting, both carrying rationale -> checkpoint and answer coexist, neither overwrites the other (tsk-19zm D2)', () => {
  const dir = tmpDir();
  addSampleWork(dir);
  putInAwaiting(dir, {
    id: 'item-x',
    ask: VALID_ASK,
    expectedStatus: 'todo',
    rationale: 'leaning OAuth: fewer support tickets historically',
    source: 'session',
  });

  const { view } = answerAwaiting(dir, {
    id: 'item-x',
    answer: 'OAuth',
    expectedStatus: 'awaiting-human',
    role: 'human',
    rationale: 'confirmed OAuth per compliance requirement',
    source: 'human',
  });
  // Answer's own trio, still authoritative.
  assert.equal(view.gates['item-x'].rationale, 'confirmed OAuth per compliance requirement');
  assert.equal(view.gates['item-x'].source, 'human');
  // The agent's original checkpoint from the ask is untouched.
  assert.equal(view.gates['item-x'].askRationale, 'leaning OAuth: fewer support tickets historically');
  assert.equal(view.gates['item-x'].askSource, 'session');
});
