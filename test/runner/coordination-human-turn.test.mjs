// Phase 03.1 (Architecture Advisory Panel track): the `human-turn-recorded`
// event, its write door (`recordHumanTurn`, store.mjs), and the
// `human-turn:` ref namespace on `driver-disposition-recorded` --
// the trusted external-input/human-decision provenance door named by
// P02.1's BL4 row (docs/architect/agent-coordination/verification/
// architecture-advisory-panel/P02.1.md, Table 4).
//
// Store-level only, matching coordination-recheck-disposition.test.mjs's
// own R3 disposition tests: `recordHumanTurn`, like `recordDriverDisposition`,
// is definition-blind ledger state -- no FlowDefinition/dispatch is needed
// to exercise it, so this file opens a bare `openSession` (never a declared
// protocol) and calls the store door directly.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { openSession, recordHumanTurn, recordDriverDisposition, readSessionEvents, transitionSessionStatus } from '../../src/runner/coordination/store.mjs';
import { CoordinationError, validateEventPayload } from '../../src/runner/coordination/schema.mjs';
import { replaySession } from '../../src/runner/coordination/replay.mjs';

function mkTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-human-turn-test-'));
}

const WRITER_ID = 'coordinator-1';

function setup(coordinationId) {
  const tempDir = mkTempDir();
  openSession(
    {
      coordinationId,
      objective: 'Prove the human-turn trusted-input/decision provenance door.',
      provenanceRoot: { writerId: WRITER_ID },
      actors: [
        { id: 'reviewer', role: 'reviewer' },
        { id: 'doer', role: 'doer' },
      ],
    },
    { cwd: tempDir },
  );
  return { tempDir, opts: { cwd: tempDir, repoRoot: tempDir } };
}

function humanTurn(overrides = {}) {
  return {
    turnId: 'turn_1',
    turnOrdinal: 1,
    channel: 'claude-code-chat',
    artifactRef: 'human/1-person.md',
    revision: `sha256:${'a'.repeat(64)}`,
    externalRef: 'claude-code-transcript:sess-1:uuid-1',
    attributedTo: { type: 'person', id: 'the-user' },
    recordedBy: { type: 'driver', id: WRITER_ID },
    ...overrides,
  };
}

function disposition(overrides = {}) {
  return {
    targetRef: 'human-turn:turn_1',
    disposition: 'accepted',
    rationale: 'The person confirmed the direction.',
    evidenceRefs: [],
    authorizedBy: { type: 'driver', id: WRITER_ID },
    ...overrides,
  };
}

// ─── Happy path + idempotent replay ────────────────────────────────────────

test('recordHumanTurn appends human-turn-recorded, and replay reconstructs it in humanTurns', () => {
  const ctx = setup('coord_ht_happy');
  const result = recordHumanTurn('coord_ht_happy', humanTurn(), ctx.opts);
  assert.equal(result.appended, true);

  const recorded = readSessionEvents('coord_ht_happy', ctx.opts).filter((e) => e.type === 'human-turn-recorded');
  assert.equal(recorded.length, 1);
  assert.equal(recorded[0].payload.turnId, 'turn_1');
  assert.equal(recorded[0].payload.turnOrdinal, 1);
  assert.deepEqual(recorded[0].payload.attributedTo, { type: 'person', id: 'the-user' });
  assert.deepEqual(recorded[0].payload.recordedBy, { type: 'driver', id: WRITER_ID });
  assert.ok(recorded[0].ts, 'the event log stamps ts on every event');

  const replayed = replaySession('coord_ht_happy', ctx.opts);
  assert.equal(replayed.humanTurns.length, 1);
  assert.equal(replayed.humanTurns[0].turnId, 'turn_1');
  assert.equal(replayed.humanTurns[0].channel, 'claude-code-chat');
  assert.equal(replayed.ignoredHumanTurns.length, 0);
});

test('recordHumanTurn is idempotent on a byte-identical repeat of the same turnId', () => {
  const ctx = setup('coord_ht_idempotent');
  assert.equal(recordHumanTurn('coord_ht_idempotent', humanTurn(), ctx.opts).appended, true);
  assert.equal(recordHumanTurn('coord_ht_idempotent', humanTurn(), ctx.opts).appended, false);
  assert.equal(readSessionEvents('coord_ht_idempotent', ctx.opts).filter((e) => e.type === 'human-turn-recorded').length, 1);

  // Idempotent replay: the resulting log replays cleanly, with exactly one
  // reconstructed turn -- a repeat call must never appear as a second record.
  const replayed = replaySession('coord_ht_idempotent', ctx.opts);
  assert.equal(replayed.humanTurns.length, 1);
});

test('recordHumanTurn refuses to mutate an already-recorded turnId with different content (immutability)', () => {
  const ctx = setup('coord_ht_immutable');
  recordHumanTurn('coord_ht_immutable', humanTurn(), ctx.opts);
  assert.throws(
    () => recordHumanTurn('coord_ht_immutable', humanTurn({ channel: 'relay' }), ctx.opts),
    (err) => err instanceof CoordinationError && err.category === 'duplicate-ref' && /already recorded with different content/.test(err.message),
  );
  assert.equal(readSessionEvents('coord_ht_immutable', ctx.opts).filter((e) => e.type === 'human-turn-recorded').length, 1);
});

// ─── T1: driver-authored artifacts/actors cannot occupy the human slot ─────

test('recordHumanTurn refuses attributedTo.id === recordedBy.id (a driver cannot attribute a turn to itself)', () => {
  const ctx = setup('coord_ht_self_attrib');
  assert.throws(
    () => recordHumanTurn('coord_ht_self_attrib', humanTurn({ attributedTo: { type: 'person', id: WRITER_ID } }), ctx.opts),
    (err) => err instanceof CoordinationError && /cannot attribute a human turn to itself/.test(err.message),
  );
  assert.equal(readSessionEvents('coord_ht_self_attrib', ctx.opts).filter((e) => e.type === 'human-turn-recorded').length, 0);
});

test('recordHumanTurn refuses attributedTo.id naming a declared panel actor', () => {
  const ctx = setup('coord_ht_panel_actor');
  assert.throws(
    () => recordHumanTurn('coord_ht_panel_actor', humanTurn({ attributedTo: { type: 'person', id: 'reviewer' } }), ctx.opts),
    (err) => err instanceof CoordinationError && /declared panel actor/.test(err.message),
  );
});

test('recordHumanTurn refuses attributedTo.id shaped like an Assignment id ("asgn_" prefix)', () => {
  const ctx = setup('coord_ht_asgn_shape');
  assert.throws(
    () => recordHumanTurn('coord_ht_asgn_shape', humanTurn({ attributedTo: { type: 'person', id: 'asgn_deadbeef01' } }), ctx.opts),
    (err) => err instanceof CoordinationError && /shaped like a driver-authored ref/.test(err.message),
  );
});

test('recordHumanTurn refuses attributedTo.id shaped like a "contribution:" ref', () => {
  const ctx = setup('coord_ht_contribution_shape');
  assert.throws(
    () => recordHumanTurn('coord_ht_contribution_shape', humanTurn({ attributedTo: { type: 'person', id: 'contribution:c1' } }), ctx.opts),
    (err) => err instanceof CoordinationError && /shaped like a driver-authored ref/.test(err.message),
  );
});

test('recordHumanTurn refuses attributedTo.id shaped like a "human-turn:" ref', () => {
  const ctx = setup('coord_ht_humanturn_shape');
  assert.throws(
    () => recordHumanTurn('coord_ht_humanturn_shape', humanTurn({ attributedTo: { type: 'person', id: 'human-turn:t1' } }), ctx.opts),
    (err) => err instanceof CoordinationError && /shaped like a driver-authored ref/.test(err.message),
  );
});

// ─── Ordinal games ──────────────────────────────────────────────────────────

test('recordHumanTurn refuses a turnOrdinal that skips ahead (a gap)', () => {
  const ctx = setup('coord_ht_ordinal_gap');
  recordHumanTurn('coord_ht_ordinal_gap', humanTurn(), ctx.opts); // ordinal 1
  assert.throws(
    () =>
      recordHumanTurn(
        'coord_ht_ordinal_gap',
        humanTurn({ turnId: 'turn_3', turnOrdinal: 3, externalRef: 'claude-code-transcript:sess-1:uuid-3' }),
        ctx.opts,
      ),
    (err) => err instanceof CoordinationError && /no gaps, no ordinal reuse/.test(err.message),
  );
});

test('recordHumanTurn refuses reusing an already-used turnOrdinal for a different turnId', () => {
  const ctx = setup('coord_ht_ordinal_reuse');
  recordHumanTurn('coord_ht_ordinal_reuse', humanTurn(), ctx.opts); // ordinal 1
  assert.throws(
    () =>
      recordHumanTurn(
        'coord_ht_ordinal_reuse',
        humanTurn({ turnId: 'turn_2', turnOrdinal: 1, externalRef: 'claude-code-transcript:sess-1:uuid-2' }),
        ctx.opts,
      ),
    (err) => err instanceof CoordinationError && /no gaps, no ordinal reuse/.test(err.message),
  );
});

test('recordHumanTurn admits ordinals 1, 2, 3 in order with no gaps', () => {
  const ctx = setup('coord_ht_ordinal_sequence');
  recordHumanTurn('coord_ht_ordinal_sequence', humanTurn(), ctx.opts);
  recordHumanTurn(
    'coord_ht_ordinal_sequence',
    humanTurn({ turnId: 'turn_2', turnOrdinal: 2, externalRef: 'claude-code-transcript:sess-1:uuid-2' }),
    ctx.opts,
  );
  recordHumanTurn(
    'coord_ht_ordinal_sequence',
    humanTurn({ turnId: 'turn_3', turnOrdinal: 3, externalRef: 'claude-code-transcript:sess-1:uuid-3' }),
    ctx.opts,
  );
  assert.equal(readSessionEvents('coord_ht_ordinal_sequence', ctx.opts).filter((e) => e.type === 'human-turn-recorded').length, 3);
  assert.equal(replaySession('coord_ht_ordinal_sequence', ctx.opts).humanTurns.length, 3);
});

// ─── Fabricated-but-well-formed externalRef / replay ───────────────────────

test('recordHumanTurn refuses an externalRef already used by a prior turn (no replaying one real turn as two)', () => {
  const ctx = setup('coord_ht_external_reuse');
  recordHumanTurn('coord_ht_external_reuse', humanTurn(), ctx.opts);
  assert.throws(
    () => recordHumanTurn('coord_ht_external_reuse', humanTurn({ turnId: 'turn_2', turnOrdinal: 2 }), ctx.opts),
    (err) => err instanceof CoordinationError && err.category === 'duplicate-ref' && /may back at most one real human turn/.test(err.message),
  );
});

// ─── Worker-path / identity refusals ───────────────────────────────────────

test('recordHumanTurn refuses recordedBy.id that is not this session\'s own driver identity', () => {
  const ctx = setup('coord_ht_foreign_driver');
  assert.throws(
    () => recordHumanTurn('coord_ht_foreign_driver', humanTurn({ recordedBy: { type: 'driver', id: 'someone-else' } }), ctx.opts),
    (err) => err instanceof CoordinationError && /is not the driver identity of session/.test(err.message),
  );
});

test('recordHumanTurn refuses once the session has left active', () => {
  const ctx = setup('coord_ht_terminal');
  transitionSessionStatus('coord_ht_terminal', 'completed', {}, ctx.opts);
  assert.throws(
    () => recordHumanTurn('coord_ht_terminal', humanTurn(), ctx.opts),
    (err) => err instanceof CoordinationError && /cannot be recorded into a session that has already closed/.test(err.message),
  );
});

// ─── Schema-level shape refusals ───────────────────────────────────────────

test('validateEventPayload refuses attributedTo.type other than "person"', () => {
  assert.throws(
    () => validateEventPayload('human-turn-recorded', humanTurn({ attributedTo: { type: 'driver', id: WRITER_ID } })),
    (err) => err instanceof CoordinationError && /attributedTo\.type must be "person"/.test(err.message),
  );
});

test('validateEventPayload refuses attributedTo.type "worker"/any actor-role-shaped value, not just "driver"', () => {
  assert.throws(
    () => validateEventPayload('human-turn-recorded', humanTurn({ attributedTo: { type: 'reviewer', id: 'the-user' } })),
    (err) => err instanceof CoordinationError && /attributedTo\.type must be "person"/.test(err.message),
  );
});

test('validateEventPayload refuses an attributedTo carrying any classification field beyond {type, id}', () => {
  assert.throws(
    () => validateEventPayload('human-turn-recorded', humanTurn({ attributedTo: { type: 'person', id: 'the-user', kind: 'decision' } })),
    (err) => err instanceof CoordinationError && /unknown field "kind"/.test(err.message),
  );
});

test('validateEventPayload refuses a human-turn-recorded event missing any required field, one message each', () => {
  for (const field of ['turnId', 'turnOrdinal', 'channel', 'artifactRef', 'revision', 'externalRef', 'attributedTo', 'recordedBy']) {
    const payload = humanTurn();
    delete payload[field];
    assert.throws(
      () => validateEventPayload('human-turn-recorded', payload),
      (err) => err instanceof CoordinationError,
      `expected a refusal for a missing ${field}`,
    );
  }
});

// ─── respondsToRefs ownership ───────────────────────────────────────────────

test('recordHumanTurn accepts respondsToRefs naming a prior human turn of this session', () => {
  const ctx = setup('coord_ht_responds_valid');
  recordHumanTurn('coord_ht_responds_valid', humanTurn(), ctx.opts); // turn_1
  const second = recordHumanTurn(
    'coord_ht_responds_valid',
    humanTurn({
      turnId: 'turn_2',
      turnOrdinal: 2,
      externalRef: 'claude-code-transcript:sess-1:uuid-2',
      respondsToRefs: ['human-turn:turn_1'],
    }),
    ctx.opts,
  );
  assert.equal(second.appended, true);
  assert.deepEqual(second.respondsToRefs, ['human-turn:turn_1']);
});

test('recordHumanTurn refuses a respondsToRefs entry naming a human turn this session never recorded', () => {
  const ctx = setup('coord_ht_responds_dangling');
  assert.throws(
    () => recordHumanTurn('coord_ht_responds_dangling', humanTurn({ respondsToRefs: ['human-turn:turn_nope'] }), ctx.opts),
    (err) => err instanceof CoordinationError && err.category === 'dangling-ref' && /never recorded/.test(err.message),
  );
});

test('recordHumanTurn refuses a bare (unprefixed) respondsToRefs id that names a prior turn as a near-miss', () => {
  const ctx = setup('coord_ht_responds_bare');
  recordHumanTurn('coord_ht_responds_bare', humanTurn(), ctx.opts); // turn_1
  assert.throws(
    () =>
      recordHumanTurn(
        'coord_ht_responds_bare',
        humanTurn({ turnId: 'turn_2', turnOrdinal: 2, externalRef: 'claude-code-transcript:sess-1:uuid-2', respondsToRefs: ['turn_1'] }),
        ctx.opts,
      ),
    (err) => err instanceof CoordinationError && /targets nothing -- write "human-turn:turn_1"/.test(err.message),
  );
});

// ─── driver-disposition-recorded may cite a human-turn: ref ────────────────

test('recordDriverDisposition may cite a human-turn: ref as its decision basis', () => {
  const ctx = setup('coord_ht_disposition_basis');
  recordHumanTurn('coord_ht_disposition_basis', humanTurn(), ctx.opts);
  const result = recordDriverDisposition('coord_ht_disposition_basis', disposition(), ctx.opts);
  assert.equal(result.appended, true);

  const replayed = replaySession('coord_ht_disposition_basis', ctx.opts);
  assert.equal(replayed.dispositions.length, 1);
  assert.equal(replayed.dispositions[0].targetRef, 'human-turn:turn_1');
});

test('recordDriverDisposition refuses a targetRef naming a human turn this session never recorded', () => {
  const ctx = setup('coord_ht_disposition_dangling');
  assert.throws(
    () => recordDriverDisposition('coord_ht_disposition_dangling', disposition({ targetRef: 'human-turn:turn_nope' }), ctx.opts),
    (err) => err instanceof CoordinationError && err.category === 'dangling-ref' && /never recorded/.test(err.message),
  );
});

test('recordDriverDisposition refuses an evidenceRefs entry naming a human turn this session never recorded', () => {
  const ctx = setup('coord_ht_disposition_evidence_dangling');
  recordHumanTurn('coord_ht_disposition_evidence_dangling', humanTurn(), ctx.opts);
  assert.throws(
    () =>
      recordDriverDisposition(
        'coord_ht_disposition_evidence_dangling',
        disposition({ evidenceRefs: ['human-turn:turn_nope'] }),
        ctx.opts,
      ),
    (err) => err instanceof CoordinationError && err.category === 'dangling-ref' && /never recorded/.test(err.message),
  );
});
