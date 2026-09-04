// Phase 08 (MVP8) cell P08.2: deliberation contribution ledger, replay, and
// visibility.
//
// Three layers, in the same order P07.3's aggregation cell proved its own:
//   1. event    -- the `deliberation-contribution-linked` payload shape, and
//                  what it structurally CANNOT carry (artifact content, a
//                  mutable status, a recipient, a sessionId);
//   2. ledger   -- the store door, replay's refusals, the disposition door's
//                  new contribution-ownership check, and the DERIVED
//                  open/resolved views;
//   3. runtime  -- a REAL dispatched session where every legality-relevant
//                  value is derived from the session itself, including MVP6
//                  window legality through `deriveVisibilityWindowState`.
//
// The runtime layer drives real Node subprocesses through the real
// `dispatchDeclaredOperation` path -- the same fake-executor pattern
// `coordination-aggregation.test.mjs` and
// `coordination-visibility-window-fixture.test.mjs` use, never a JS-level stub.
// The protocol under test is written into a temp PROJECT tier, so no committed
// fixture under `core/` is touched.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  openDeclaredProtocolSession,
  dispatchDeclaredOperation,
  linkSessionContribution,
  retrySessionTask,
} from '../../src/runner/coordination/session-engine.mjs';
import {
  openSession,
  createSessionAssignment,
  linkResult,
  appendEvent,
  transitionSessionStatus,
  recordContributionLink,
  recordDriverDisposition,
  recordRunRetry,
  resolveSessionPaths,
} from '../../src/runner/coordination/store.mjs';
import { replaySession } from '../../src/runner/coordination/replay.mjs';
import { CoordinationError, validateEventPayload, CONTRIBUTION_REF_PREFIX } from '../../src/runner/coordination/schema.mjs';
import { CONTRIBUTION_TYPES } from '../../src/runner/deliberation/schema.mjs';
import { showCoordinationUseCase } from '../../src/verbs/coordination/show.mjs';

const PROTOCOL_ID = 'project.coordination-protocol.deliberation-under-test';
const WINDOW_ID = 'post-research';

function mkTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-deliberation-test-'));
}

function driver() {
  return { type: 'driver', id: 'coordinator-1' };
}

// ─── Layer 1: the deliberation-contribution-linked event ───────────────────

function eventPayload(overrides = {}) {
  return {
    contributionId: 'contrib_1',
    operationRef: 'deliberate',
    type: 'proposal',
    assignmentId: 'asgn_a',
    runId: 'run_asgn_a_01',
    artifactRef: 'agent-report.md',
    revision: 'a'.repeat(64),
    roundKey: 'round-1',
    visibilityWindowRef: WINDOW_ID,
    linkedBy: driver(),
    ...overrides,
  };
}

test('event: a well-formed deliberation-contribution-linked payload validates, with and without lineage', () => {
  assert.doesNotThrow(() => validateEventPayload('deliberation-contribution-linked', eventPayload()));
  assert.doesNotThrow(() =>
    validateEventPayload(
      'deliberation-contribution-linked',
      eventPayload({ contributionId: 'contrib_2', type: 'response', respondsTo: 'contrib_1', anchors: ['contrib_1'] }),
    ),
  );
});

test('event: type is the closed MVP8 enum -- all six pass, a seventh does not', () => {
  for (const type of CONTRIBUTION_TYPES) {
    const payload = eventPayload({ type, ...(type === 'response' ? { respondsTo: 'contrib_0' } : {}) });
    assert.doesNotThrow(() => validateEventPayload('deliberation-contribution-linked', payload), `expected "${type}" to validate`);
  }
  assert.throws(
    () => validateEventPayload('deliberation-contribution-linked', eventPayload({ type: 'vote' })),
    (err) => err instanceof CoordinationError && /payload.type must be one of/.test(err.message),
  );
});

test('event: no mailbox-shaped or content-bearing field is representable at all', () => {
  // The whole Non-Negotiable Deferrals list, closed by the payload whitelist
  // rather than by naming each one in a check: a field that cannot be
  // represented cannot be persisted, replayed, or mutated later.
  for (const field of ['body', 'content', 'text', 'recipient', 'delivery', 'unread', 'status', 'resolved']) {
    assert.throws(
      () => validateEventPayload('deliberation-contribution-linked', eventPayload({ [field]: 'anything' })),
      (err) => err instanceof CoordinationError && new RegExp(`unknown field "${field}"`).test(err.message),
      `expected "${field}" to be rejected as an unknown payload field`,
    );
  }
});

test('event: sessionId cannot be smuggled onto the payload -- the log IS the session', () => {
  // Refused twice over: the payload whitelist gets there first, and the
  // ADR-008 Decision 5 deep scan would refuse it at any nesting depth even if
  // the whitelist ever admitted it.
  assert.throws(
    () => validateEventPayload('deliberation-contribution-linked', eventPayload({ sessionId: 'other-session' })),
    (err) => err instanceof CoordinationError && /unknown field "sessionId"/.test(err.message),
  );
  assert.throws(
    () => validateEventPayload('deliberation-contribution-linked', eventPayload({ linkedBy: { ...driver(), sessionId: 'other-session' } })),
    (err) => err instanceof CoordinationError && /forbidden field "sessionId"/.test(err.message),
  );
});

test('event: linkedBy must be driver-shaped, exactly as validatedBy/authorizedBy are', () => {
  for (const linkedBy of [{ type: 'actor', id: 'researcher-a' }, { id: 'coordinator-1' }, 'coordinator-1']) {
    assert.throws(
      () => validateEventPayload('deliberation-contribution-linked', eventPayload({ linkedBy })),
      (err) => err instanceof CoordinationError,
      `expected linkedBy ${JSON.stringify(linkedBy)} to be refused`,
    );
  }
});

test('event: a "response" with nothing to respond to, a self-response, and a self-anchor are all refused', () => {
  assert.throws(
    () => validateEventPayload('deliberation-contribution-linked', eventPayload({ type: 'response' })),
    (err) => err instanceof CoordinationError && /must set respondsTo/.test(err.message),
  );
  assert.throws(
    () => validateEventPayload('deliberation-contribution-linked', eventPayload({ type: 'response', respondsTo: 'contrib_1' })),
    (err) => err instanceof CoordinationError && /responds to itself/.test(err.message),
  );
  assert.throws(
    () => validateEventPayload('deliberation-contribution-linked', eventPayload({ anchors: ['contrib_1'] })),
    (err) => err instanceof CoordinationError && /anchors itself/.test(err.message),
  );
});

// ─── Layer 2: the store door, replay, and the derived open/resolved views ──

function inlineContract() {
  return {
    objective: 'Deliberate on the collected research.',
    contextRefs: [],
    constraints: [],
    expectedOutputs: ['agent-result.json (status, summary)'],
    mutation: 'read-only',
    evidence: { required: 'reported' },
    role: 'researcher',
    budget: { timeoutMs: 60000, maxRuns: 1 },
  };
}

/** A session with `count` settled, linked Assignments, built through the
 *  ordinary store doors -- the minimum a contribution can legally cite. */
function sessionWithLinkedAssignments(coordinationId, count = 1, tempDir = mkTempDir()) {
  const opts = { cwd: tempDir, repoRoot: tempDir };
  openSession({ coordinationId, objective: 'Deliberate.', provenanceRoot: { writerId: 'coordinator-1' } }, opts);
  const assignmentIds = Array.from({ length: count }, (_, i) => {
    const created = createSessionAssignment(
      { coordinationId, taskKey: `deliberate-${i}`, contract: inlineContract(), caller: { writerId: 'coordinator-1' } },
      opts,
    );
    linkResult(coordinationId, { assignmentId: created.assignmentId, runId: `run_${created.assignmentId}_01` }, opts);
    return created.assignmentId;
  });
  return { tempDir, opts, assignmentIds };
}

function storePayload(assignmentId, overrides = {}) {
  return eventPayload({ assignmentId, runId: `run_${assignmentId}_01`, ...overrides });
}

test('store door: appends once, is an idempotent no-op on a byte-identical repeat, and refuses a different payload under the same contributionId', () => {
  const { coordinationId, opts, assignmentIds } = { coordinationId: 'delib-store-1', ...sessionWithLinkedAssignments('delib-store-1') };
  const [assignmentId] = assignmentIds;

  const first = recordContributionLink(coordinationId, storePayload(assignmentId), opts);
  assert.equal(first.appended, true);
  const repeat = recordContributionLink(coordinationId, storePayload(assignmentId), opts);
  assert.equal(repeat.appended, false, 'a byte-identical repeat must self-heal, not append twice');
  assert.equal(replaySession(coordinationId, opts).contributions.length, 1);

  assert.throws(
    () => recordContributionLink(coordinationId, storePayload(assignmentId, { type: 'objection' }), opts),
    (err) => err instanceof CoordinationError && err.category === 'duplicate-ref',
    'one contributionId may never carry two different contents',
  );
});

test('store door: provenance must be this session\'s own -- a foreign Assignment and a mis-shaped runId are both refused', () => {
  const coordinationId = 'delib-store-2';
  const { opts, assignmentIds } = sessionWithLinkedAssignments(coordinationId);
  const [assignmentId] = assignmentIds;

  assert.throws(
    () => recordContributionLink(coordinationId, storePayload('asgn_never_existed'), opts),
    (err) => err instanceof CoordinationError && err.category === 'foreign-ref',
  );
  assert.throws(
    () => recordContributionLink(coordinationId, storePayload(assignmentId, { runId: `run_${assignmentId}_../../../../tmp/evil` }), opts),
    (err) => err instanceof CoordinationError && err.category === 'foreign-ref',
    'a same-prefix, malicious-suffix runId must be refused by the full-shape check, not accepted by a prefix test',
  );
});

test('store door: linking is driver-authored, and refused once the session has closed', () => {
  const coordinationId = 'delib-store-3';
  const { opts, assignmentIds } = sessionWithLinkedAssignments(coordinationId);
  const [assignmentId] = assignmentIds;

  assert.throws(
    () => recordContributionLink(coordinationId, storePayload(assignmentId, { linkedBy: { type: 'driver', id: 'researcher-a' } }), opts),
    (err) => err instanceof CoordinationError && /linkedBy\.id .* is not the driver identity/.test(err.message),
  );

  transitionSessionStatus(coordinationId, 'completed', {}, opts);
  assert.throws(
    () => recordContributionLink(coordinationId, storePayload(assignmentId), opts),
    (err) => err instanceof CoordinationError && /is not active/.test(err.message),
  );
});

test('store door: lineage must resolve inside this session -- a dangling anchor or respondsTo is refused, and a self-reference is dangling by construction', () => {
  const coordinationId = 'delib-store-4';
  const { opts, assignmentIds } = sessionWithLinkedAssignments(coordinationId);
  const [assignmentId] = assignmentIds;

  assert.throws(
    () => recordContributionLink(coordinationId, storePayload(assignmentId, { anchors: ['contrib_nope'] }), opts),
    (err) => err instanceof CoordinationError && err.category === 'dangling-ref' && /dangling-anchor/.test(err.message),
  );
  assert.throws(
    () => recordContributionLink(coordinationId, storePayload(assignmentId, { type: 'response', respondsTo: 'contrib_nope' }), opts),
    (err) => err instanceof CoordinationError && err.category === 'dangling-ref' && /dangling-response/.test(err.message),
  );

  // A cycle needs a back edge, and an append-only ledger has none: every
  // lineage ref must ALREADY be linked, and a contribution's own id is never
  // in the ledger when it is validated. So the strongest cycle shape available
  // -- a self-response -- degrades to a dangling ref here, and the two-node
  // shape cannot be built at all: the first contribution would have to name
  // the second before the second exists.
  recordContributionLink(coordinationId, storePayload(assignmentId, { contributionId: 'contrib_a' }), opts);
  assert.throws(
    () =>
      recordContributionLink(
        coordinationId,
        storePayload(assignmentId, { contributionId: 'contrib_b', type: 'response', respondsTo: 'contrib_c' }),
        opts,
      ),
    (err) => err instanceof CoordinationError && /does not resolve to a known contribution/.test(err.message),
  );
  assert.doesNotThrow(() =>
    recordContributionLink(
      coordinationId,
      storePayload(assignmentId, { contributionId: 'contrib_b', type: 'response', respondsTo: 'contrib_a', anchors: ['contrib_a'] }),
      opts,
    ),
  );
});

test('round trip: replay reconstructs a contribution from ref+revision alone -- no artifact content ever reaches the log', () => {
  const coordinationId = 'delib-roundtrip';
  const { opts, assignmentIds } = sessionWithLinkedAssignments(coordinationId);
  const [assignmentId] = assignmentIds;
  const REVISION = 'b'.repeat(64);

  recordContributionLink(
    coordinationId,
    storePayload(assignmentId, { contributionId: 'contrib_1', artifactRef: 'agent-report.md', revision: REVISION }),
    opts,
  );
  const replayed = replaySession(coordinationId, opts);
  assert.equal(replayed.contributions.length, 1);
  const [record] = replayed.contributions;

  assert.deepEqual(Object.keys(record).sort(), [
    'artifactRef',
    'assignmentId',
    'contributionId',
    'linkedBy',
    'operationRef',
    'revision',
    'roundKey',
    'runId',
    'ts',
    'type',
    'visibilityWindowRef',
  ]);
  assert.equal(record.artifactRef, 'agent-report.md');
  assert.equal(record.revision, REVISION);
  assert.ok(record.ts, 'the Candidate Contract timestamp comes off the event envelope');

  const { sessionDir } = resolveSessionPaths(coordinationId, opts);
  const raw = fs.readFileSync(path.join(sessionDir, 'events.jsonl'), 'utf8');
  assert.ok(raw.includes(REVISION), 'the revision pin is persisted');
  assert.ok(!/"status"|"resolved"|"body"|"content"/.test(raw), 'no mutable status or content field reached the log');
});

/** Append a raw, un-mediated event, the way a hand-written or corrupted log
 *  would carry one. This is how every replay refusal below is exercised. */
function forge(coordinationId, opts, payload) {
  const { sessionDir, eventsPath } = resolveSessionPaths(coordinationId, opts);
  appendEvent(eventsPath, { type: 'deliberation-contribution-linked', payload }, sessionDir);
}

test('replay: refuses a duplicate contributionId, a foreign linker, and a contribution citing a Run that had not settled yet', () => {
  const coordinationId = 'delib-replay-1';
  const { opts, assignmentIds } = sessionWithLinkedAssignments(coordinationId);
  const [assignmentId] = assignmentIds;

  recordContributionLink(coordinationId, storePayload(assignmentId), opts);
  forge(coordinationId, opts, storePayload(assignmentId, { type: 'objection' }));
  assert.throws(
    () => replaySession(coordinationId, opts),
    (err) => err instanceof CoordinationError && err.category === 'duplicate-ref',
  );

  const second = 'delib-replay-2';
  const ctx2 = sessionWithLinkedAssignments(second);
  forge(second, ctx2.opts, storePayload(ctx2.assignmentIds[0], { linkedBy: { type: 'driver', id: 'researcher-a' } }));
  assert.throws(
    () => replaySession(second, ctx2.opts),
    (err) => err instanceof CoordinationError && err.category === 'foreign-ref' && /not this session's driver identity/.test(err.message),
  );

  // Third: an Assignment that exists but never linked a result. Built by
  // creating one and NOT linking it.
  const third = 'delib-replay-3';
  const ctx3 = sessionWithLinkedAssignments(third);
  const unsettled = createSessionAssignment(
    { coordinationId: third, taskKey: 'unsettled', contract: inlineContract(), caller: { writerId: 'coordinator-1' } },
    ctx3.opts,
  ).assignmentId;
  forge(third, ctx3.opts, storePayload(unsettled, { runId: `run_${unsettled}_01` }));
  assert.throws(
    () => replaySession(third, ctx3.opts),
    (err) => err instanceof CoordinationError && err.category === 'out-of-order-ref' && /no accepted "result-linked" event before it/.test(err.message),
  );
});

test('replay: a lineage ref that only appears LATER in the log is refused -- which is why a cycle cannot be replayed at all', () => {
  const coordinationId = 'delib-replay-cycle';
  const { opts, assignmentIds } = sessionWithLinkedAssignments(coordinationId);
  const [assignmentId] = assignmentIds;

  // contrib_a responds to contrib_b, which is only linked afterwards -- the
  // only way to write a two-node cycle into a log at all.
  forge(coordinationId, opts, storePayload(assignmentId, { contributionId: 'contrib_a', type: 'response', respondsTo: 'contrib_b' }));
  forge(coordinationId, opts, storePayload(assignmentId, { contributionId: 'contrib_b', type: 'response', respondsTo: 'contrib_a' }));
  assert.throws(
    () => replaySession(coordinationId, opts),
    (err) => err instanceof CoordinationError && /dangling-response/.test(err.message),
  );
});

test('replay: a post-terminal contribution is neutralized into ignoredContributions, never silently dropped and never a throw', () => {
  const coordinationId = 'delib-post-terminal';
  const { opts, assignmentIds } = sessionWithLinkedAssignments(coordinationId);
  const [assignmentId] = assignmentIds;

  recordContributionLink(coordinationId, storePayload(assignmentId, { contributionId: 'contrib_live' }), opts);
  transitionSessionStatus(coordinationId, 'completed', {}, opts);
  forge(coordinationId, opts, storePayload(assignmentId, { contributionId: 'contrib_late' }));

  const replayed = replaySession(coordinationId, opts);
  assert.deepEqual(replayed.contributions.map((c) => c.contributionId), ['contrib_live']);
  assert.deepEqual(replayed.ignoredContributions.map((c) => c.contributionId), ['contrib_late']);
  assert.deepEqual(replayed.openContributionIds, ['contrib_live']);
});

test('disposition: targetRef may name a contribution of THIS session, and may not name an unknown one or one belonging to another session', () => {
  const coordinationId = 'delib-disp-a';
  const { tempDir, opts, assignmentIds } = sessionWithLinkedAssignments(coordinationId);
  const [assignmentId] = assignmentIds;
  recordContributionLink(coordinationId, storePayload(assignmentId, { contributionId: 'contrib_mine' }), opts);

  // A second session in the SAME workspace, with its own contribution.
  const otherId = 'delib-disp-b';
  const other = sessionWithLinkedAssignments(otherId, 1, tempDir);
  recordContributionLink(otherId, storePayload(other.assignmentIds[0], { contributionId: 'contrib_theirs' }), other.opts);

  const disposition = (targetRef) => ({
    targetRef,
    disposition: 'accepted',
    rationale: 'Reviewed and accepted.',
    evidenceRefs: [],
    authorizedBy: driver(),
  });

  assert.doesNotThrow(() => recordDriverDisposition(coordinationId, disposition(`${CONTRIBUTION_REF_PREFIX}contrib_mine`), opts));
  assert.throws(
    () => recordDriverDisposition(coordinationId, disposition(`${CONTRIBUTION_REF_PREFIX}contrib_nope`), opts),
    (err) => err instanceof CoordinationError && err.category === 'dangling-ref',
  );
  assert.throws(
    () => recordDriverDisposition(coordinationId, disposition(`${CONTRIBUTION_REF_PREFIX}contrib_theirs`), opts),
    (err) => err instanceof CoordinationError && err.category === 'dangling-ref' && /never linked/.test(err.message),
    'a contribution of another session is not this session\'s to dispose of',
  );
  assert.throws(
    () =>
      recordDriverDisposition(
        coordinationId,
        { ...disposition('some-artifact'), evidenceRefs: [`${CONTRIBUTION_REF_PREFIX}contrib_theirs`] },
        opts,
      ),
    (err) => err instanceof CoordinationError && err.category === 'dangling-ref',
    'evidenceRefs are scoped by the same rule as targetRef',
  );
});

test('show: the read-side ownership mirror agrees with the write door about a contribution: ref', () => {
  const coordinationId = 'delib-show-mirror';
  const { tempDir, opts, assignmentIds } = sessionWithLinkedAssignments(coordinationId);
  const [assignmentId] = assignmentIds;
  recordContributionLink(coordinationId, storePayload(assignmentId, { contributionId: 'contrib_mine' }), opts);

  const { sessionDir, eventsPath } = resolveSessionPaths(coordinationId, opts);
  const disposition = (targetRef) => ({
    targetRef,
    disposition: 'accepted',
    rationale: 'Reviewed.',
    evidenceRefs: [],
    authorizedBy: driver(),
  });
  recordDriverDisposition(coordinationId, disposition(`${CONTRIBUTION_REF_PREFIX}contrib_mine`), opts);
  // Appended raw, bypassing the write door entirely -- the exact shape `show`
  // exists to MARK rather than reject.
  appendEvent(eventsPath, { type: 'driver-disposition-recorded', payload: disposition(`${CONTRIBUTION_REF_PREFIX}contrib_forged`) }, sessionDir);

  const shown = showCoordinationUseCase({ cwd: tempDir, repoRoot: tempDir }, { id: coordinationId });
  assert.deepEqual(
    shown.dispositions.map((d) => [d.targetRef, d.targetRefOwnedBySession]),
    [
      [`${CONTRIBUTION_REF_PREFIX}contrib_mine`, true],
      [`${CONTRIBUTION_REF_PREFIX}contrib_forged`, false],
    ],
  );
});

test('open/resolved is DERIVED at replay time from immutable events -- disposing one contribution moves it, and nothing on disk changes shape', () => {
  const coordinationId = 'delib-derived';
  const { opts, assignmentIds } = sessionWithLinkedAssignments(coordinationId);
  const [assignmentId] = assignmentIds;

  recordContributionLink(coordinationId, storePayload(assignmentId, { contributionId: 'contrib_1' }), opts);
  recordContributionLink(coordinationId, storePayload(assignmentId, { contributionId: 'contrib_2', type: 'objection' }), opts);

  let replayed = replaySession(coordinationId, opts);
  assert.deepEqual(replayed.openContributionIds, ['contrib_1', 'contrib_2']);
  assert.deepEqual(replayed.resolvedContributionIds, []);

  const { sessionDir } = resolveSessionPaths(coordinationId, opts);
  const eventsPath = path.join(sessionDir, 'events.jsonl');
  const beforeDisposition = fs.readFileSync(eventsPath, 'utf8');

  recordDriverDisposition(
    coordinationId,
    {
      targetRef: `${CONTRIBUTION_REF_PREFIX}contrib_1`,
      disposition: 'accepted',
      rationale: 'The proposal stands.',
      evidenceRefs: [],
      authorizedBy: driver(),
    },
    opts,
  );

  replayed = replaySession(coordinationId, opts);
  assert.deepEqual(replayed.resolvedContributionIds, ['contrib_1']);
  assert.deepEqual(replayed.openContributionIds, ['contrib_2']);

  // The contribution events themselves are untouched: resolution is a
  // derivation over later events, never a mutation of an earlier one.
  const after = fs.readFileSync(eventsPath, 'utf8');
  assert.ok(after.startsWith(beforeDisposition), 'the ledger is append-only -- no earlier line was rewritten');
  assert.ok(
    replayed.contributions.every((record) => !('resolved' in record) && !('status' in record)),
    'no stored status field exists on a contribution record',
  );
});

/** Append a raw, un-mediated `driver-disposition-recorded` event -- the
 *  hand-written-log shape the write door itself would refuse. */
function forgeDisposition(coordinationId, opts, overrides = {}) {
  const { sessionDir, eventsPath } = resolveSessionPaths(coordinationId, opts);
  appendEvent(
    eventsPath,
    {
      type: 'driver-disposition-recorded',
      payload: {
        targetRef: 'some-artifact',
        disposition: 'accepted',
        rationale: 'Forged.',
        evidenceRefs: [],
        authorizedBy: driver(),
        ...overrides,
      },
    },
    sessionDir,
  );
}

test('replay: a disposition that resolves a contribution must carry THIS session\'s driver identity', () => {
  const coordinationId = 'delib-resolve-identity';
  const { opts, assignmentIds } = sessionWithLinkedAssignments(coordinationId);
  recordContributionLink(coordinationId, storePayload(assignmentIds[0], { contributionId: 'contrib_1' }), opts);
  assert.deepEqual(replaySession(coordinationId, opts).openContributionIds, ['contrib_1']);

  // The write door pins `authorizedBy.id` to the session's driver, so this
  // shape only reaches disk on a hand-written log -- exactly the threat model
  // replay exists to refuse, and the same check the contribution branch itself
  // already performs on `linkedBy`.
  forgeDisposition(coordinationId, opts, {
    targetRef: `${CONTRIBUTION_REF_PREFIX}contrib_1`,
    authorizedBy: { type: 'driver', id: 'researcher-a' },
  });
  assert.throws(
    () => replaySession(coordinationId, opts),
    (err) => err instanceof CoordinationError && err.category === 'foreign-ref' && /not this session's driver identity/.test(err.message),
    'a worker-authored disposition must not flip a contribution open -> resolved',
  );
});

test('replay: a disposition appended BEFORE its target contribution resolves nothing -- the same ordering the write door enforces', () => {
  const coordinationId = 'delib-resolve-order';
  const { opts, assignmentIds } = sessionWithLinkedAssignments(coordinationId);
  const [assignmentId] = assignmentIds;

  // Disposition first, link second. The write door refuses this ordering
  // outright (a `contribution:` ref for an id nothing has linked yet is a
  // dangling ref), so replay must not accept a resolution it would refuse.
  forgeDisposition(coordinationId, opts, { targetRef: `${CONTRIBUTION_REF_PREFIX}contrib_future` });
  recordContributionLink(coordinationId, storePayload(assignmentId, { contributionId: 'contrib_future' }), opts);

  const replayed = replaySession(coordinationId, opts);
  assert.deepEqual(replayed.openContributionIds, ['contrib_future']);
  assert.deepEqual(replayed.resolvedContributionIds, []);
});

test('disposition: a BARE contribution id is refused with the prefixed form named, instead of silently resolving nothing', () => {
  const coordinationId = 'delib-bare-ref';
  const { tempDir, opts, assignmentIds } = sessionWithLinkedAssignments(coordinationId);
  recordContributionLink(coordinationId, storePayload(assignmentIds[0], { contributionId: 'contrib_mine' }), opts);

  assert.throws(
    () =>
      recordDriverDisposition(
        coordinationId,
        { targetRef: 'contrib_mine', disposition: 'accepted', rationale: 'Reviewed.', evidenceRefs: [], authorizedBy: driver() },
        opts,
      ),
    (err) => err instanceof CoordinationError && new RegExp(`write "${CONTRIBUTION_REF_PREFIX}contrib_mine"`).test(err.message),
    'a near-miss that would be accepted, rendered, and resolve nothing is refused instead',
  );

  // The read-side mirror agrees: a bare id of an own contribution is not an
  // owned ref, because it targets nothing.
  forgeDisposition(coordinationId, opts, { targetRef: 'contrib_mine' });
  const shown = showCoordinationUseCase({ cwd: tempDir, repoRoot: tempDir }, { id: coordinationId });
  assert.deepEqual(
    shown.dispositions.map((d) => [d.targetRef, d.targetRefOwnedBySession]),
    [['contrib_mine', false]],
  );
});

test('store door: a contributionId may not carry a path separator, "..", or the reserved ref prefix', () => {
  const coordinationId = 'delib-id-shape';
  const { opts, assignmentIds } = sessionWithLinkedAssignments(coordinationId);
  const [assignmentId] = assignmentIds;

  for (const contributionId of ['../../../../etc/passwd', 'a\\b', 'x/y', `${CONTRIBUTION_REF_PREFIX}ghost`]) {
    assert.throws(
      () => recordContributionLink(coordinationId, storePayload(assignmentId, { contributionId }), opts),
      (err) => err instanceof CoordinationError && err.category === 'validation' && /path separator/.test(err.message),
      `"${contributionId}" must not be mintable as a contribution id`,
    );
  }
  // The namespace itself stays free -- only separators and the reserved
  // prefix are refused, not a naming convention.
  assert.doesNotThrow(() =>
    recordContributionLink(coordinationId, storePayload(assignmentId, { contributionId: 'Any.Free-Form_Id:42' }), opts),
  );
});

test('mediated door: roundKey and contributionId are length-bounded, exactly as the sibling mediated door bounds its own free text', () => {
  const coordinationId = 'delib-bounds';
  const { opts, assignmentIds } = sessionWithLinkedAssignments(coordinationId);
  const tooLong = 'x'.repeat(2001);

  assert.throws(
    () =>
      linkSessionContribution(
        coordinationId,
        { contributionId: tooLong, type: 'proposal', assignmentId: assignmentIds[0], roundKey: 'round-1', linkedBy: driver() },
        opts,
      ),
    (err) => err instanceof CoordinationError && /contributionId must be a non-empty, bounded string/.test(err.message),
  );
  assert.throws(
    () =>
      linkSessionContribution(
        coordinationId,
        { contributionId: 'contrib_1', type: 'proposal', assignmentId: assignmentIds[0], roundKey: tooLong, linkedBy: driver() },
        opts,
      ),
    (err) => err instanceof CoordinationError && /roundKey must be a non-empty, bounded string/.test(err.message),
    'an artifact body does not need a "content" field -- it needs a long roundKey',
  );
});

test('boundary: the raw store door accepts an operation/window pair the mediated door would refuse -- precedent parity, not a defect', () => {
  // `recordContributionLink` sits BELOW `session-engine.mjs` in the import
  // graph and holds no FlowDefinition, so it structurally cannot ask whether
  // `operationRef` is declared or whether `visibilityWindowRef` names an open
  // window -- exactly the boundary `recordAggregationValidation` shipped with
  // in P07.3. This test pins that boundary so a later cell adding a caller
  // cannot mistake the raw door for the enforced one. It asserts current,
  // intended behavior; it is not a bug report.
  const coordinationId = 'delib-raw-boundary';
  const { opts, assignmentIds } = sessionWithLinkedAssignments(coordinationId);
  const [assignmentId] = assignmentIds;

  const written = recordContributionLink(
    coordinationId,
    storePayload(assignmentId, {
      contributionId: 'contrib_unmediated',
      operationRef: 'no-such-declared-operation',
      visibilityWindowRef: 'no-such-window',
    }),
    opts,
  );
  assert.equal(written.appended, true, 'the raw door has no definition to judge either value against');
  assert.deepEqual(replaySession(coordinationId, opts).contributions.map((c) => c.operationRef), ['no-such-declared-operation']);

  // The mediated door refuses the same session outright: it has no bound
  // protocol at all, so there is no declared operation or window to judge
  // against and nothing gets written.
  assert.throws(
    () =>
      linkSessionContribution(
        coordinationId,
        { contributionId: 'contrib_mediated', type: 'proposal', assignmentId, roundKey: 'round-1', linkedBy: driver() },
        opts,
      ),
    (err) => err instanceof CoordinationError && /has no declared protocol bound/.test(err.message),
  );
});

// ─── Layer 3: a REAL dispatched session, with real window legality ─────────

function protocolDoc() {
  return {
    apiVersion: 'fgos.dev/v1alpha1',
    kind: 'FlowDefinition',
    metadata: { id: PROTOCOL_ID, version: '1.0.0' },
    spec: {
      profile: {
        kind: 'CoordinationProtocol',
        topology: {
          contextVisibility: 'isolated-until-fan-in',
          visibilityWindows: [
            {
              id: WINDOW_ID,
              opensAfter: { milestone: 'listed-results-linked', operationRefs: ['research'] },
              permits: { sourceOperationRefs: ['research'], delivery: 'artifact-refs' },
            },
          ],
        },
      },
      roles: ['coordinator', 'researcher'],
      actors: [
        { id: 'coordinator-actor', role: 'coordinator' },
        { id: 'researcher-a', role: 'researcher' },
        { id: 'researcher-b', role: 'researcher' },
      ],
      operations: [
        { id: 'research', role: 'researcher', result: { kind: 'advisory', evidenceRequired: 'reported' } },
        {
          id: 'deliberate',
          role: 'coordinator',
          result: { kind: 'advisory', evidenceRequired: 'reported' },
          // P08.3: `declaredOperations` now reads the REAL per-operation
          // declaration instead of the closed MVP8 enum wholesale, so this
          // fixture must declare which types `deliberate` actually produces
          // -- every type this file's runtime layer links through it.
          contributions: { allowedTypes: ['proposal', 'objection'] },
        },
      ],
      graph: {
        entry: 'phase-research',
        nodes: [
          {
            id: 'phase-research',
            operations: [
              { ref: 'research', actor: 'researcher-a' },
              { ref: 'research', actor: 'researcher-b' },
            ],
            transitions: ['phase-deliberate'],
          },
          {
            id: 'phase-deliberate',
            operations: [{ ref: 'deliberate', actor: 'coordinator-actor', contextAccess: { visibilityWindowRef: WINDOW_ID } }],
            transitions: [],
          },
        ],
      },
    },
  };
}

const REPORT_BODY = 'The observed p99 latency regressed by 14% in the eu-west region after the cache change.';

function fakeRunnerConfig(tempDir) {
  const executorScript = path.join(tempDir, `fake-delib-executor-${Math.random().toString(36).slice(2)}.mjs`);
  fs.writeFileSync(
    executorScript,
    `
    import fs from 'node:fs';
    import path from 'node:path';
    const assignmentsRoot = path.join(process.cwd(), '.fgos', 'assignments');
    if (fs.existsSync(assignmentsRoot)) {
      for (const asgn of fs.readdirSync(assignmentsRoot)) {
        const runsDir = path.join(assignmentsRoot, asgn, 'runs');
        if (!fs.existsSync(runsDir)) continue;
        for (const run of fs.readdirSync(runsDir)) {
          const runDir = path.join(runsDir, run);
          if (fs.existsSync(runDir) && !fs.existsSync(path.join(runDir, 'agent-result.json'))) {
            fs.writeFileSync(path.join(runDir, 'agent-report.md'), ${JSON.stringify(`# Report\n${REPORT_BODY}\n`)});
            fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'Settled by the test executor.' }));
          }
        }
      }
    }
    process.stdout.write('done\\n');
    `,
  );
  return {
    executor: { allowCrossProvider: true, command: process.execPath, args: [executorScript, '{prompt}'] },
    modelPolicies: { claude: { lightweight: 'test-model', standard: 'test-model' } },
    timeoutMs: 8000,
  };
}

function openDeliberationSession(coordinationId) {
  const tempDir = mkTempDir();
  const protocolsDir = path.join(tempDir, '.fgos', 'coordination-protocols');
  fs.mkdirSync(protocolsDir, { recursive: true });
  fs.writeFileSync(path.join(protocolsDir, 'deliberation-under-test.json'), JSON.stringify(protocolDoc(), null, 2));
  const opts = { cwd: tempDir, repoRoot: tempDir };
  openDeclaredProtocolSession(
    { definitionId: PROTOCOL_ID, coordinationId, objective: 'Deliberate over two independent research passes.', writerId: 'coordinator-1' },
    opts,
  );
  return { tempDir, opts, runnerConfig: fakeRunnerConfig(tempDir) };
}

async function dispatch(coordinationId, ctx, operationId, targetActorId) {
  await dispatchDeclaredOperation(
    coordinationId,
    {
      operationId,
      targetActorId,
      taskKey: `declared:${operationId}:${targetActorId}`,
      objective: `${operationId} pass for ${targetActorId}.`,
      expectedOutputs: ['agent-result.json (status, summary)'],
      writerId: 'coordinator-1',
    },
    { ...ctx.opts, runnerConfig: ctx.runnerConfig },
  );
  // Read the id back off an independent replay, never off the dispatch return
  // value, so every assertion downstream rests on the durable event log.
  const replayed = replaySession(coordinationId, ctx.opts);
  const created = [...replayed.assignments].reverse().find((entry) => entry.actorId === targetActorId);
  assert.ok(created, `expected an assignment-created event for "${targetActorId}"`);
  return created.assignmentId;
}

test('runtime: a contribution whose reasoning PREDATES the window is refused, both while the window is closed and after it later opens', async () => {
  const coordinationId = 'delib-runtime-order';
  const ctx = openDeliberationSession(coordinationId);

  // Only ONE of the window's two source bindings has settled, so the window is
  // closed. The `deliberate` binding is `required`, so dispatch itself does not
  // gate on the window (that gate is driver-authorized-only) -- which makes the
  // link door the real enforcement point for this shape: the Run executes and
  // settles with the window still closed.
  await dispatch(coordinationId, ctx, 'research', 'researcher-a');
  const deliberateAssignmentId = await dispatch(coordinationId, ctx, 'deliberate', 'coordinator-actor');

  assert.throws(
    () =>
      linkSessionContribution(
        coordinationId,
        { contributionId: 'contrib_1', type: 'proposal', assignmentId: deliberateAssignmentId, roundKey: 'round-1', linkedBy: driver() },
        ctx.opts,
      ),
    (err) => err instanceof CoordinationError && new RegExp(`visibility window "${WINDOW_ID}" to be open`).test(err.message),
    'a contribution may not enter the ledger while its binding\'s window is closed',
  );
  assert.equal(replaySession(coordinationId, ctx.opts).contributions.length, 0, 'nothing was written by the refused call');

  // The second binding settles and the window opens -- but the `deliberate`
  // Run never re-ran. Its reasoning demonstrably could not have seen
  // researcher-b's output, which did not exist when it settled. "The window is
  // open now" is not "this reasoning was produced under an open window", so the
  // link stays refused rather than recording a window-provenance claim the Run
  // could never have witnessed.
  await dispatch(coordinationId, ctx, 'research', 'researcher-b');
  assert.throws(
    () =>
      linkSessionContribution(
        coordinationId,
        { contributionId: 'contrib_1', type: 'proposal', assignmentId: deliberateAssignmentId, roundKey: 'round-1', linkedBy: driver() },
        ctx.opts,
      ),
    (err) =>
      err instanceof CoordinationError &&
      /was authorized at log position \d+, not after visibility window "post-research" opened at log position \d+/.test(err.message),
    'a Run that settled before the window opened carries no provenance for that window',
  );
  assert.equal(replaySession(coordinationId, ctx.opts).contributions.length, 0, 'still nothing was written');
});

test('runtime: a contribution is linked once its binding\'s window is open and its reasoning was produced under it, and every legality-relevant value is derived from the session', async () => {
  const coordinationId = 'delib-runtime';
  const ctx = openDeliberationSession(coordinationId);

  // Both window sources settle FIRST, so the window is already open when the
  // `deliberate` Run executes: its reasoning really was produced under the
  // window whose ref the contribution then records.
  await dispatch(coordinationId, ctx, 'research', 'researcher-a');
  await dispatch(coordinationId, ctx, 'research', 'researcher-b');
  const deliberateAssignmentId = await dispatch(coordinationId, ctx, 'deliberate', 'coordinator-actor');

  const linked = linkSessionContribution(
    coordinationId,
    { contributionId: 'contrib_1', type: 'proposal', assignmentId: deliberateAssignmentId, roundKey: 'round-1', linkedBy: driver() },
    ctx.opts,
  );
  assert.equal(linked.appended, true);

  // Every one of these came off the session or its bound definition -- none is
  // a parameter of `linkSessionContribution`.
  assert.equal(linked.operationRef, 'deliberate', 'the operation came from the Assignment\'s own protocol-operation stamp');
  assert.equal(linked.visibilityWindowRef, WINDOW_ID, 'the window came from the node binding, not the caller');
  assert.equal(linked.runId, `run_${deliberateAssignmentId}_01`, 'the run came from the latest result-linked event');
  assert.match(linked.revision, /^[0-9a-f]{64}$/, 'the revision pin is the settle-report sha256');

  const { sessionDir } = resolveSessionPaths(coordinationId, ctx.opts);
  const raw = fs.readFileSync(path.join(sessionDir, 'events.jsonl'), 'utf8');
  assert.ok(!raw.includes(REPORT_BODY), 'the artifact\'s own content never reaches the session log -- only its ref and revision');

  // Open, then resolved, both derived from the same immutable events.
  let replayed = replaySession(coordinationId, ctx.opts);
  assert.deepEqual(replayed.openContributionIds, ['contrib_1']);
  recordDriverDisposition(
    coordinationId,
    {
      targetRef: `${CONTRIBUTION_REF_PREFIX}contrib_1`,
      disposition: 'accepted',
      rationale: 'Accepted into the round.',
      evidenceRefs: [],
      authorizedBy: driver(),
    },
    ctx.opts,
  );
  replayed = replaySession(coordinationId, ctx.opts);
  assert.deepEqual(replayed.resolvedContributionIds, ['contrib_1']);
  assert.deepEqual(replayed.openContributionIds, []);
});

/** Leave the exact disk state a crashed retry leaves behind: the retry is
 *  DECLARED on the log and its run has really settled on disk, but the process
 *  died before `linkResult`. Built by copying the already-settled attempt 01
 *  (real artifacts, real settle-report sha) into attempt 02 and renaming its
 *  runId -- never a synthesized result whose pin would not match its bytes. */
function crashedRetryOnDisk(ctx, assignmentId, coordinationId, previousRunId) {
  recordRunRetry(
    coordinationId,
    { assignmentId, reason: 'Executor crashed before the result was linked.', previousRunId, maxRetries: 1 },
    ctx.opts,
  );
  const runsDir = path.join(ctx.tempDir, '.fgos', 'assignments', assignmentId, 'runs');
  fs.cpSync(path.join(runsDir, '01'), path.join(runsDir, '02'), { recursive: true });
  const resultPath = path.join(runsDir, '02', 'result.json');
  const result = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
  result.runId = `run_${assignmentId}_02`;
  fs.writeFileSync(resultPath, JSON.stringify(result, null, 2));
  return result.runId;
}

test('runtime: a crash-resumed Run that executed under a CLOSED window is refused, even though its result is linked after the window opens', async () => {
  const coordinationId = 'delib-crash-resume';
  const ctx = openDeliberationSession(coordinationId);

  // 1-2. Only researcher-a has settled, so the window is closed when the
  //      `deliberate` Run executes.
  await dispatch(coordinationId, ctx, 'research', 'researcher-a');
  const deliberateAssignmentId = await dispatch(coordinationId, ctx, 'deliberate', 'coordinator-actor');

  // 3. A retry is declared and its Run settles on disk -- still with the window
  //    closed -- and the process dies before `linkResult`. This is precisely
  //    the crash window `retrySessionTask`'s self-heal branch exists to recover.
  const retriedRunId = crashedRetryOnDisk(ctx, deliberateAssignmentId, coordinationId, `run_${deliberateAssignmentId}_01`);

  // 4. researcher-b settles; the window opens.
  await dispatch(coordinationId, ctx, 'research', 'researcher-b');

  // 5. The self-heal resumes and links that closed-window Run NOW, at a fresh
  //    log position well after the window opened.
  const resumed = await retrySessionTask(
    coordinationId,
    { assignmentId: deliberateAssignmentId, reason: 'Resume the crashed retry.' },
    { ...ctx.opts, runnerConfig: ctx.runnerConfig },
  );
  assert.deepEqual(
    { retried: resumed.retried, resumed: resumed.resumed, runId: resumed.runResult.runId },
    { retried: false, resumed: true, runId: retriedRunId },
    'the fixture must exercise the self-heal branch, not a fresh retry dispatch',
  );

  // The link position genuinely postdates the window opening -- so a check that
  // compared `result-linked` positions would accept this. The reasoning position
  // does not, and that is what is compared.
  const events = replaySession(coordinationId, ctx.opts).events;
  const resumedLink = events.find((e) => e.type === 'result-linked' && e.payload.runId === retriedRunId);
  const windowOpened = events.filter((e) => e.type === 'result-linked').map((e) => e.seq)[1];
  assert.ok(resumedLink.seq > windowOpened, 'fixture precondition: the resumed link lands after the window opened');

  // 6. Refused: the Run was authorized (and ran) while the window was closed.
  assert.throws(
    () =>
      linkSessionContribution(
        coordinationId,
        { contributionId: 'contrib_crash', type: 'proposal', assignmentId: deliberateAssignmentId, roundKey: 'round-1', linkedBy: driver() },
        ctx.opts,
      ),
    (err) =>
      err instanceof CoordinationError &&
      /was authorized at log position \d+, not after visibility window "post-research" opened at log position \d+/.test(err.message),
  );
  assert.equal(replaySession(coordinationId, ctx.opts).contributions.length, 0);
});

test('runtime: retrying an already-satisfied window SOURCE does not move when the window opened, so an honest link is neither invalidated nor refused', async () => {
  const coordinationId = 'delib-source-retry';
  const ctx = openDeliberationSession(coordinationId);

  const researchAssignmentId = await dispatch(coordinationId, ctx, 'research', 'researcher-a');
  await dispatch(coordinationId, ctx, 'research', 'researcher-b');
  const deliberateAssignmentId = await dispatch(coordinationId, ctx, 'deliberate', 'coordinator-actor');

  const linked = linkSessionContribution(
    coordinationId,
    { contributionId: 'contrib_1', type: 'proposal', assignmentId: deliberateAssignmentId, roundKey: 'round-1', linkedBy: driver() },
    ctx.opts,
  );
  assert.equal(linked.appended, true);

  // Retry a window SOURCE that was already satisfied. Windows are monotone
  // closed -> open and satisfaction is sticky, so this appends a second
  // `result-linked` for that source without the window ever having re-closed:
  // the position at which it OPENED cannot move.
  const retried = await retrySessionTask(
    coordinationId,
    { assignmentId: researchAssignmentId, reason: 'Re-run the research pass with fresh inputs.' },
    { ...ctx.opts, runnerConfig: ctx.runnerConfig },
  );
  assert.equal(retried.retried, true, 'the fixture must exercise a real retry dispatch of a window source');

  // The earlier link stands, and replay still reconstructs it.
  const replayed = replaySession(coordinationId, ctx.opts);
  assert.deepEqual(replayed.contributions.map((c) => c.contributionId), ['contrib_1']);

  // And an honest link in the same state still succeeds -- reading the LATEST
  // `result-linked` per source instead of the earliest satisfying one would
  // refuse this, with a message asserting a window-opening position that never
  // happened.
  const second = linkSessionContribution(
    coordinationId,
    { contributionId: 'contrib_2', type: 'objection', assignmentId: deliberateAssignmentId, roundKey: 'round-1', linkedBy: driver() },
    ctx.opts,
  );
  assert.equal(second.appended, true);
  assert.equal(second.visibilityWindowRef, WINDOW_ID);
});

test('runtime: an artifact edited after settle can no longer be linked -- the pin must still match the bytes', async () => {
  const coordinationId = 'delib-stale';
  const ctx = openDeliberationSession(coordinationId);
  await dispatch(coordinationId, ctx, 'research', 'researcher-a');
  await dispatch(coordinationId, ctx, 'research', 'researcher-b');
  const deliberateAssignmentId = await dispatch(coordinationId, ctx, 'deliberate', 'coordinator-actor');

  const reportPath = path.join(ctx.tempDir, '.fgos', 'assignments', deliberateAssignmentId, 'runs', '01', 'agent-report.md');
  fs.appendFileSync(reportPath, '\nEdited after settle.\n');

  assert.throws(
    () =>
      linkSessionContribution(
        coordinationId,
        { contributionId: 'contrib_stale', type: 'proposal', assignmentId: deliberateAssignmentId, roundKey: 'round-1', linkedBy: driver() },
        ctx.opts,
      ),
    (err) => err instanceof CoordinationError && /edited after settle/.test(err.message),
  );
});

test('runtime: an Assignment that performed no declared operation can back no contribution', async () => {
  const coordinationId = 'delib-unstamped';
  const ctx = openDeliberationSession(coordinationId);
  await dispatch(coordinationId, ctx, 'research', 'researcher-a');
  await dispatch(coordinationId, ctx, 'research', 'researcher-b');

  // An Assignment created through the raw store door: real member of the
  // session, real linked result, but it carries no `protocol-operation:` stamp
  // because no declared-dispatch door materialized it.
  const adhoc = createSessionAssignment(
    { coordinationId, taskKey: 'ad-hoc', contract: inlineContract(), caller: { writerId: 'coordinator-1' } },
    ctx.opts,
  ).assignmentId;
  linkResult(coordinationId, { assignmentId: adhoc, runId: `run_${adhoc}_01` }, ctx.opts);

  assert.throws(
    () =>
      linkSessionContribution(
        coordinationId,
        { contributionId: 'contrib_adhoc', type: 'proposal', assignmentId: adhoc, roundKey: 'round-1', linkedBy: driver() },
        ctx.opts,
      ),
    (err) => err instanceof CoordinationError && /carries no declared-operation provenance stamp/.test(err.message),
  );
});

test('runtime: the FlowDefinition is resolved from the session, never from the caller -- a drifted definition is refused', async () => {
  const coordinationId = 'delib-drift';
  const ctx = openDeliberationSession(coordinationId);
  await dispatch(coordinationId, ctx, 'research', 'researcher-a');
  await dispatch(coordinationId, ctx, 'research', 'researcher-b');
  const deliberateAssignmentId = await dispatch(coordinationId, ctx, 'deliberate', 'coordinator-actor');

  // Republish the protocol at a new version AFTER the session was opened. If
  // the definition were reconstructed (or accepted from a caller) rather than
  // resolved from `manifest.definitionRef`, this would go unnoticed.
  const republished = protocolDoc();
  republished.metadata.version = '2.0.0';
  fs.writeFileSync(
    path.join(ctx.tempDir, '.fgos', 'coordination-protocols', 'deliberation-under-test.json'),
    JSON.stringify(republished, null, 2),
  );

  assert.throws(
    () =>
      linkSessionContribution(
        coordinationId,
        { contributionId: 'contrib_drift', type: 'proposal', assignmentId: deliberateAssignmentId, roundKey: 'round-1', linkedBy: driver() },
        ctx.opts,
      ),
    (err) => err instanceof CoordinationError && /drifted definition/.test(err.message),
  );
  assert.equal(replaySession(coordinationId, ctx.opts).contributions.length, 0);
});

test('static: linkSessionContribution takes no definition, no visibility-window, and no revision parameter', () => {
  const source = fs.readFileSync(
    path.join(path.dirname(new URL(import.meta.url).pathname), '../../src/runner/coordination/session-engine.mjs'),
    'utf8',
  );
  const signature = source.slice(source.indexOf('export function linkSessionContribution'));
  // The WHOLE parameter list, through the closing `)` -- not just the
  // destructured object. An `opts.definition` would be exactly the same
  // caller-supplied-config bypass, and a capture that stops at the first `}`
  // would never see it.
  const params = signature.slice(signature.indexOf('('), signature.indexOf(') {') + 1);
  assert.ok(/\bopts\b/.test(params), 'the capture must reach the whole parameter list, opts included');
  for (const forbidden of ['definition', 'visibilityWindowRef', 'operationRef', 'revision', 'artifactRef', 'declaredOperations']) {
    assert.ok(
      !new RegExp(`\\b${forbidden}\\b`).test(params),
      `"${forbidden}" must never be a caller-supplied parameter -- it is a legality-relevant value and must be derived from the session (params were: ${params})`,
    );
  }
});
