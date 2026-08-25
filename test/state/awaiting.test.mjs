// test/state/awaiting.test.mjs — async-human-gate D2/D5 store round-trip:
// putInAwaiting/answerAwaiting write through the store and rebuild back into
// the expected status + gates[id] shape. There is no store.test.mjs; store
// is otherwise tested through the CLI (see plan.md Slice — Cell 2).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { addWork, moveWork, putInAwaiting, answerAwaiting, listWork, categoryOf, resolveWriterLogPath, rebuild } from '../../src/state/store.mjs';
import { appendEvent } from '../../src/state/events.mjs';
import { acquireClaim, readClaim } from '../../src/state/runtime-coordination.mjs';

// tsk-40m (docs/architect/doing-coordination-redesign.md): `todo -> doing`
// is retired from status-fsm.mjs's TRANSITIONS table — nothing durably
// writes INTO `doing` anymore. This file's own tests need a durably-'doing'
// item purely as a PRECONDITION for exercising putInAwaiting/answerAwaiting's
// own 'doing'-resume behavior (the actual subject under test) — a raw event
// write, bypassing transitionWork's own edge validation, is the direct,
// honest way to get there (same technique test/state/store.test.mjs's own
// moveToDurableDoingForTest uses).
function moveToDurableDoingForTest(dir, id, from = 'todo', extra = {}) {
  appendEvent(resolveWriterLogPath(dir), { type: 'work.move', payload: { id, from, to: 'doing', ...extra } }, dir);
  rebuild(dir);
}

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
  // accumulation coverage. durableStatusAtAsk (tsk-40m P1 fix): always
  // stamped now, from the trusted durable status at ask-time ('todo' here
  // — no claim involved).
  assert.deepEqual(view.gates['item-x'], { ask: VALID_ASK, askHistory: [VALID_ASK], durableStatusAtAsk: 'todo' });

  const rebuilt = listWork(dir);
  assert.equal(rebuilt.work['item-x'].status, 'awaiting-human');
  assert.deepEqual(rebuilt.gates['item-x'], { ask: VALID_ASK, askHistory: [VALID_ASK], durableStatusAtAsk: 'todo' });
});

test('answerAwaiting then rebuild -> status todo + gates[id]={ask,answer}', () => {
  const dir = tmpDir();
  addSampleWork(dir);
  putInAwaiting(dir, { id: 'item-x', ask: VALID_ASK, expectedStatus: 'todo' });

  const { view } = answerAwaiting(dir, { id: 'item-x', answer: 'OAuth', expectedStatus: 'awaiting-human' });
  assert.equal(view.work['item-x'].status, 'todo');
  // durableStatusAtAsk survives the answer -- only the `ask` event itself
  // ever carries it, and the fold is additive (never cleared by a later
  // answer event that doesn't repeat it).
  assert.deepEqual(view.gates['item-x'], { ask: VALID_ASK, answer: 'OAuth', askHistory: [VALID_ASK], durableStatusAtAsk: 'todo' });

  const rebuilt = listWork(dir);
  assert.equal(rebuilt.work['item-x'].status, 'todo');
  assert.deepEqual(rebuilt.gates['item-x'], { ask: VALID_ASK, answer: 'OAuth', askHistory: [VALID_ASK], durableStatusAtAsk: 'todo' });
});

test('putInAwaiting with a stale expectedStatus -> conflict, no event appended', () => {
  const dir = tmpDir();
  addSampleWork(dir);
  moveToDurableDoingForTest(dir, 'item-x');

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
  assert.deepEqual(view.gates['item-x'], { ask: VALID_ASK, parentSnapshotAtAsk: snapshot, askHistory: [VALID_ASK], durableStatusAtAsk: 'todo' });

  const rebuilt = listWork(dir);
  assert.deepEqual(rebuilt.gates['item-x'], { ask: VALID_ASK, parentSnapshotAtAsk: snapshot, askHistory: [VALID_ASK], durableStatusAtAsk: 'todo' });
});

test('putInAwaiting with no parentSnapshotAtAsk -> no such key on gates[id] at all', () => {
  const dir = tmpDir();
  addSampleWork(dir);

  const { view } = putInAwaiting(dir, { id: 'item-x', ask: VALID_ASK, expectedStatus: 'todo' });
  assert.deepEqual(view.gates['item-x'], { ask: VALID_ASK, askHistory: [VALID_ASK], durableStatusAtAsk: 'todo' });
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

// claim-lock §5.1, tsk-40m P1 fix (docs/architect/doing-coordination-
// redesign.md) — statusAtAsk/durableStatusAtAsk snapshot + answerAwaiting's
// dynamic resume target. Two SEPARATE fields now, never conflated:
// `statusAtAsk` is informational/audit only (whatever the caller reports,
// possibly the EFFECTIVE view); `durableStatusAtAsk` is the ONLY one
// answerAwaiting trusts to resume, always self-computed from a fresh
// durable read regardless of caller input.

test('putInAwaiting with a statusAtAsk -> gates[id] carries both statusAtAsk (informational) and durableStatusAtAsk (trusted) on rebuild', () => {
  const dir = tmpDir();
  addSampleWork(dir);
  // A genuinely legacy durable-doing item (no claim at all) -- here
  // statusAtAsk and durableStatusAtAsk legitimately agree ('doing'), since
  // there is no claim overlay to diverge from the durable truth.
  moveToDurableDoingForTest(dir, 'item-x');

  const { view } = putInAwaiting(dir, {
    id: 'item-x',
    ask: VALID_ASK,
    expectedStatus: 'doing',
    statusAtAsk: 'doing',
  });
  assert.deepEqual(view.gates['item-x'], { ask: VALID_ASK, statusAtAsk: 'doing', durableStatusAtAsk: 'doing', askHistory: [VALID_ASK] });

  const rebuilt = listWork(dir);
  assert.deepEqual(rebuilt.gates['item-x'], { ask: VALID_ASK, statusAtAsk: 'doing', durableStatusAtAsk: 'doing', askHistory: [VALID_ASK] });
});

test('putInAwaiting with no statusAtAsk -> durableStatusAtAsk is still always stamped, but no statusAtAsk key', () => {
  const dir = tmpDir();
  addSampleWork(dir);

  const { view } = putInAwaiting(dir, { id: 'item-x', ask: VALID_ASK, expectedStatus: 'todo' });
  assert.ok(!('statusAtAsk' in view.gates['item-x']));
  assert.equal(view.gates['item-x'].durableStatusAtAsk, 'todo');

  const rebuilt = listWork(dir);
  assert.ok(!('statusAtAsk' in rebuilt.gates['item-x']));
  assert.equal(rebuilt.gates['item-x'].durableStatusAtAsk, 'todo');
});

// The P1 repro this fix closes (found by independent review): `take` on a
// durable-todo item, then `ask`, then `answer` used to durably write
// awaiting-human -> doing with NO backing claim at all (statusAtAsk was
// computed from the EFFECTIVE view, which reads 'doing' for a claimed
// item, and answerAwaiting trusted it verbatim as the resume target).
test('putInAwaiting on an item under an ACTIVE claim releases the claim and settles DIRECTLY to awaiting-human — never a durable doing', () => {
  const dir = tmpDir();
  addSampleWork(dir);
  acquireClaim(dir, { id: 'item-x', actor: 'session', preClaimStatus: 'todo', claimRole: 'session' });
  assert.equal(listWork(dir).work['item-x'].status, 'doing', 'effective status is doing via the claim overlay before ask');

  const { view, event } = putInAwaiting(dir, { id: 'item-x', ask: VALID_ASK, statusAtAsk: 'doing' });
  assert.equal(event.payload.from, 'todo', 'settles DIRECTLY from the claim\'s own preClaimStatus, never through a doing leg');
  assert.equal(event.payload.to, 'awaiting-human');
  assert.equal(view.work['item-x'].status, 'awaiting-human');
  assert.equal(readClaim(dir, 'item-x'), null, 'the claim is released, not left to silently orphan');
  // statusAtAsk (informational) still honestly records the effective
  // status at ask-time; durableStatusAtAsk (trusted) records the claim's
  // own preClaimStatus -- the safe resume target.
  assert.equal(view.gates['item-x'].statusAtAsk, 'doing');
  assert.equal(view.gates['item-x'].durableStatusAtAsk, 'todo');

  const rebuilt = listWork(dir);
  assert.equal(rebuilt.work['item-x'].status, 'awaiting-human');
});

test('answerAwaiting after a claim-releasing ask resumes to the durable base status, never doing — reacquiring is a separate explicit step', () => {
  const dir = tmpDir();
  addSampleWork(dir);
  acquireClaim(dir, { id: 'item-x', actor: 'session', preClaimStatus: 'todo', claimRole: 'session' });
  putInAwaiting(dir, { id: 'item-x', ask: VALID_ASK, statusAtAsk: 'doing' });

  const { view } = answerAwaiting(dir, { id: 'item-x', answer: 'OAuth', expectedStatus: 'awaiting-human', role: 'human' });
  assert.equal(view.work['item-x'].status, 'todo', 'resumes to the durable base, not a phantom doing');
  assert.equal(readClaim(dir, 'item-x'), null, 'answering does not resurrect a claim on its own');

  const rebuilt = listWork(dir);
  assert.equal(rebuilt.work['item-x'].status, 'todo');

  // Reacquiring is the caller's own explicit step -- durable status stays
  // 'todo', effective status becomes 'doing' again via the fresh claim,
  // same as any other take. No special "resume" plumbing needed at all.
  acquireClaim(dir, { id: 'item-x', actor: 'session', preClaimStatus: 'todo', claimRole: 'session' });
  assert.equal(listWork(dir).work['item-x'].status, 'doing');
});

test('answerAwaiting with no durableStatusAtAsk/statusAtAsk on the gate falls back to "todo" (backward-compat, byte-identical to the pre-§5.1 behavior)', () => {
  const dir = tmpDir();
  addSampleWork(dir);
  putInAwaiting(dir, { id: 'item-x', ask: VALID_ASK, expectedStatus: 'todo' });

  const { view } = answerAwaiting(dir, { id: 'item-x', answer: 'OAuth', expectedStatus: 'awaiting-human' });
  assert.equal(view.work['item-x'].status, 'todo');
});

// Hard-cut (docs/architect/doing-coordination-redesign.md): awaiting-human
// -> doing is retired from status-fsm.mjs's TRANSITIONS table entirely — a
// durableStatusAtAsk of 'doing' can only ever be a truthful historical
// record of a genuinely legacy pre-migration item (no active claim
// involved), never a valid resume target anymore. answerAwaiting clamps it
// to 'todo' instead of attempting an edge that no longer exists.
test('answerAwaiting clamps a legacy durableStatusAtAsk of "doing" to "todo" — awaiting-human -> doing is retired, never resumed even for old data', () => {
  const dir = tmpDir();
  addSampleWork(dir);
  moveToDurableDoingForTest(dir, 'item-x');
  putInAwaiting(dir, { id: 'item-x', ask: VALID_ASK, expectedStatus: 'doing', statusAtAsk: 'doing' });
  assert.equal(listWork(dir).gates['item-x'].durableStatusAtAsk, 'doing');

  const { view } = answerAwaiting(dir, { id: 'item-x', answer: 'OAuth', expectedStatus: 'awaiting-human' });
  assert.equal(view.work['item-x'].status, 'todo');
});

test('a second ask/answer round trip (each preceded by its own claim) overwrites the prior gate snapshot, never merges', () => {
  const dir = tmpDir();
  addSampleWork(dir);
  acquireClaim(dir, { id: 'item-x', actor: 'session', preClaimStatus: 'todo', claimRole: 'session' });
  putInAwaiting(dir, { id: 'item-x', ask: VALID_ASK_FIRST, statusAtAsk: 'doing' });
  answerAwaiting(dir, { id: 'item-x', answer: 'first answer', expectedStatus: 'awaiting-human' });

  acquireClaim(dir, { id: 'item-x', actor: 'session', preClaimStatus: 'todo', claimRole: 'session' });
  putInAwaiting(dir, { id: 'item-x', ask: VALID_ASK_SECOND, statusAtAsk: 'doing' });
  const { view } = answerAwaiting(dir, { id: 'item-x', answer: 'second answer', expectedStatus: 'awaiting-human' });
  assert.equal(view.gates['item-x'].ask, VALID_ASK_SECOND);
  assert.equal(view.work['item-x'].status, 'todo', 'never a phantom doing across either round');
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
