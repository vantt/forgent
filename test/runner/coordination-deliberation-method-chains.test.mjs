// Phase 08 (MVP8) cell P08.3: method-shaped proofs, run against the three
// REAL, committed, opt-in core fixtures under `core/coordination-protocols/`
// (never a synthesized always-allow-everything context):
//   - deliberation-rfc-chain.yaml            proposal -> objection ->
//                                             response -> driver disposition
//   - deliberation-nominal-group-chain.yaml  private proposal -> controlled
//                                             reveal -> clarification ->
//                                             private rank contribution
//   - deliberation-delphi-chain.yaml         private proposal -> mediated
//                                             aggregate artifact -> next-
//                                             round proposal
//
// Every chain drives real dispatched subprocesses through the real
// `dispatchDeclaredOperation` path (same fake-executor pattern
// `coordination-deliberation-ledger.test.mjs` and
// `coordination-visibility-window-fixture.test.mjs` use), links its
// contributions through the real mediated `linkSessionContribution` door,
// and reconstructs its own lineage from `replaySession`'s projection ALONE
// -- no reference to any prose this file wrote, matching the phase's Exit
// bullet "Prove replay works without chat history or hidden driver prose."
//
// This file also closes out the Bug Taxonomy items folded into P08.3 by the
// new `contributions.allowedTypes[]` field (src/runner/definitions/schema.mjs)
// and `linkSessionContribution`'s real (no longer vacuous) narrowing of it:
// the vacuous-gate regression, the missing-field default direction, and the
// Nominal-Group privacy shape.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  openDeclaredProtocolSession,
  dispatchDeclaredOperation,
  authorizeDeclaredOperation,
  linkSessionContribution,
} from '../../src/runner/coordination/session-engine.mjs';
import { recordDriverDisposition } from '../../src/runner/coordination/store.mjs';
import { replaySession } from '../../src/runner/coordination/replay.mjs';
import { CoordinationError, CONTRIBUTION_REF_PREFIX } from '../../src/runner/coordination/schema.mjs';

const RFC_ID = 'core.coordination-protocol.deliberation-rfc-chain';
const NOMINAL_GROUP_ID = 'core.coordination-protocol.deliberation-nominal-group-chain';
const DELPHI_ID = 'core.coordination-protocol.deliberation-delphi-chain';

function mkTempDir(prefix = 'fgos-deliberation-chains-test-') {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function driver() {
  return { type: 'driver', id: 'coordinator-1' };
}

/** Same fake-executor shape as coordination-deliberation-ledger.test.mjs's
 *  `fakeRunnerConfig`: a real Node subprocess, never a JS-level stub, that
 *  settles every not-yet-settled Run under `.fgos/assignments/` with a
 *  fixed report and a "done" result. */
function fakeRunnerConfig(tempDir) {
  const executorScript = path.join(tempDir, `fake-delib-chain-executor-${Math.random().toString(36).slice(2)}.mjs`);
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
            fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Report\\nSettled by the test executor.\\n');
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

function openProtocolSession(definitionId, coordinationId, objective) {
  const tempDir = mkTempDir();
  const opts = { cwd: tempDir, repoRoot: tempDir };
  openDeclaredProtocolSession({ definitionId, coordinationId, objective, writerId: 'coordinator-1' }, opts);
  return { tempDir, opts, runnerConfig: fakeRunnerConfig(tempDir) };
}

/** Dispatch one binding and return its Assignment id, read back off an
 *  INDEPENDENT replay (never the dispatch return value) -- every assertion
 *  downstream rests on the durable event log, matching this track's own
 *  established pattern. A distinct, actor-scoped `taskKey` is always passed:
 *  the default (`declared:<operationId>`) carries no target-actor
 *  discriminator, and every chain here binds at least one operation to more
 *  than one actor.
 *
 *  Filtered by `actorId` alone, matching `coordination-deliberation-ledger
 *  .test.mjs`'s own `dispatch()` precedent: a REQUIRED (non-driver-
 *  authorized) binding's `assignment-created` event carries no `operationId`
 *  field at all (that field is driver-authorized-only, per the
 *  CoordinationSession contract's Event Log row), so the most-recent
 *  assignment for this actor -- read immediately after this call, before any
 *  later dispatch for the same actor -- is always the one this call itself
 *  just created. */
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
  const replayed = replaySession(coordinationId, ctx.opts);
  const created = [...replayed.assignments].reverse().find((entry) => entry.actorId === targetActorId);
  assert.ok(created, `expected an assignment-created event for "${targetActorId}" performing "${operationId}"`);
  return created.assignmentId;
}

function link(coordinationId, ctx, params) {
  return linkSessionContribution(coordinationId, { linkedBy: driver(), ...params }, ctx.opts);
}

// ─── RFC chain: proposal -> objection -> response -> driver disposition ────

test('RFC chain: proposal -> objection (anchoring it) -> response (answering the objection) -> driver disposition, all through the real mediated doors', async () => {
  const coordinationId = 'delib-rfc-e2e';
  const ctx = openProtocolSession(RFC_ID, coordinationId, 'Run one RFC round on the proposed approach.');

  const conveneId = await dispatch(coordinationId, ctx, 'convene', 'coordinator-actor');
  const proposeId = await dispatch(coordinationId, ctx, 'propose', 'proposer-actor');
  const objectId = await dispatch(coordinationId, ctx, 'object', 'objector-actor');
  const respondId = await dispatch(coordinationId, ctx, 'respond', 'proposer-actor');

  const proposal = link(coordinationId, ctx, { contributionId: 'rfc_proposal', type: 'proposal', assignmentId: proposeId, roundKey: 'round-1' });
  assert.equal(proposal.appended, true);

  const objection = link(coordinationId, ctx, {
    contributionId: 'rfc_objection',
    type: 'objection',
    assignmentId: objectId,
    roundKey: 'round-1',
    anchors: ['rfc_proposal'],
  });
  assert.equal(objection.appended, true);

  const response = link(coordinationId, ctx, {
    contributionId: 'rfc_response',
    type: 'response',
    assignmentId: respondId,
    roundKey: 'round-1',
    respondsTo: 'rfc_objection',
  });
  assert.equal(response.appended, true);

  // Driver disposition on the response, through the EXISTING
  // driver-disposition-recorded door and the `contribution:` ref namespace
  // P08.2 added -- no new disposition mechanism introduced here.
  const disposition = recordDriverDisposition(
    coordinationId,
    {
      targetRef: `${CONTRIBUTION_REF_PREFIX}rfc_response`,
      disposition: 'accepted',
      rationale: 'The response satisfactorily addresses the objection.',
      evidenceRefs: [],
      authorizedBy: driver(),
    },
    ctx.opts,
  );
  assert.equal(disposition.appended, true);

  // ── Chat-history-free replay: reconstruct the full lineage from
  //    replaySession's projection alone -- contributionId/type/anchors/
  //    respondsTo/operationRef and the disposition's targetRef, nothing else.
  const replayed = replaySession(coordinationId, ctx.opts);
  const byId = new Map(replayed.contributions.map((c) => [c.contributionId, c]));
  const reconstructedProposal = replayed.contributions.find((c) => c.type === 'proposal');
  const reconstructedObjection = replayed.contributions.find((c) => c.type === 'objection');
  const reconstructedResponse = replayed.contributions.find((c) => c.type === 'response');
  assert.ok(reconstructedProposal && reconstructedObjection && reconstructedResponse, 'all three contribution types must be reconstructable from replay');

  assert.deepEqual(reconstructedObjection.anchors, [reconstructedProposal.contributionId], 'replay alone must show WHAT the objection targets');
  assert.equal(reconstructedResponse.respondsTo, reconstructedObjection.contributionId, 'replay alone must show WHAT the response answers');
  assert.equal(byId.get(reconstructedResponse.respondsTo).type, 'objection');

  const resolvingDisposition = replayed.dispositions.find((d) => d.targetRef === `${CONTRIBUTION_REF_PREFIX}${reconstructedResponse.contributionId}`);
  assert.ok(resolvingDisposition, 'replay alone must show WHAT the driver disposed');
  assert.equal(resolvingDisposition.disposition, 'accepted');
  assert.deepEqual(replayed.resolvedContributionIds, [reconstructedResponse.contributionId]);
  assert.deepEqual(new Set(replayed.openContributionIds), new Set([reconstructedProposal.contributionId, reconstructedObjection.contributionId]));

  // "convene" backs no contribution and produced none here.
  assert.equal(replayed.contributions.some((c) => c.assignmentId === conveneId), false);
});

test('RFC chain -- vacuous-gate regression: "propose" declares only "proposal", so a "rank" contribution through it is genuinely rejected by the real mediated door', async () => {
  const coordinationId = 'delib-rfc-vacuous-gate';
  const ctx = openProtocolSession(RFC_ID, coordinationId, 'Probe the real per-operation narrowing.');
  await dispatch(coordinationId, ctx, 'convene', 'coordinator-actor');
  const proposeId = await dispatch(coordinationId, ctx, 'propose', 'proposer-actor');

  assert.throws(
    () => link(coordinationId, ctx, { contributionId: 'rfc_bad', type: 'rank', assignmentId: proposeId, roundKey: 'round-1' }),
    (err) => err instanceof CoordinationError && /does not declare "rank" in its contributions\.allowedTypes\[\]/.test(err.message),
    '"propose" declares contributions.allowedTypes: [proposal] only -- a "rank" must be refused, never silently legalized',
  );
  assert.equal(replaySession(coordinationId, ctx.opts).contributions.length, 0, 'the refused link must write nothing');
});

// ─── Nominal-Group chain: private proposal -> controlled reveal ────────────
// -> clarification -> private rank contribution ─────────────────────────────

async function settleBothPrivateProposals(coordinationId, ctx) {
  const a = await dispatch(coordinationId, ctx, 'private-propose', 'participant-a');
  const b = await dispatch(coordinationId, ctx, 'private-propose', 'participant-b');
  return { a, b };
}

function clarifyAuthorization(overrides = {}) {
  return {
    operationId: 'clarify',
    targetActorId: 'facilitator-actor',
    authorizationId: 'auth_clarify_1',
    invocationKey: 'clarify:1',
    authorizedBy: driver(),
    reason: 'Reveal the private proposals for facilitated clarification.',
    grantedContextRefs: [],
    ...overrides,
  };
}

test('Nominal-Group privacy shape: the facilitator cannot be GRANTED (and so cannot be dispatched) to read either private proposal before the reveal window opens -- provably not visible to another participant\'s context, the MVP6 mechanism reused, never reimplemented', async () => {
  const coordinationId = 'delib-ng-privacy';
  const ctx = openProtocolSession(NOMINAL_GROUP_ID, coordinationId, 'Run one nominal-group round.');

  // Both private proposals may link immediately -- each is a participant's
  // OWN private reasoning, freely recordable (private-propose binds to the
  // vacuously-open "private-open" window, never to "reveal" itself).
  const aId = await dispatch(coordinationId, ctx, 'private-propose', 'participant-a');
  const proposalA = link(coordinationId, ctx, { contributionId: 'ng_proposal_a', type: 'proposal', assignmentId: aId, roundKey: 'round-1' });
  assert.equal(proposalA.appended, true);

  // Only participant-a has settled -- the cohort is partial, so "reveal"
  // (opensAfter EVERY binding of private-propose) is still closed. The
  // facilitator cannot be authorized to read participant-a's proposal yet.
  assert.throws(
    () => authorizeDeclaredOperation(coordinationId, clarifyAuthorization({ grantedContextRefs: [aId] }), ctx.opts),
    (err) => err instanceof CoordinationError && /visibility window "reveal" to be open/.test(err.message),
    'the facilitator may not be granted read access to a private proposal before the whole cohort has been revealed together',
  );
  assert.equal(replaySession(coordinationId, ctx.opts).authorizations.length, 0, 'the refused authorization must write nothing');

  // The rest of the cohort settles and links -- now "reveal" opens, and the
  // SAME grant that was just refused succeeds.
  const bId = await dispatch(coordinationId, ctx, 'private-propose', 'participant-b');
  const proposalB = link(coordinationId, ctx, { contributionId: 'ng_proposal_b', type: 'proposal', assignmentId: bId, roundKey: 'round-1' });
  assert.equal(proposalB.appended, true);
  const granted = authorizeDeclaredOperation(coordinationId, clarifyAuthorization({ grantedContextRefs: [aId, bId] }), ctx.opts);
  assert.equal(granted.appended, true);
});

test('narrowing regression: "private-rank" declares only "rank", so a "proposal" through it is refused', async () => {
  const coordinationId = 'delib-ng-vacuous-gate';
  const ctx = openProtocolSession(NOMINAL_GROUP_ID, coordinationId, 'Probe the real per-operation narrowing across a second fixture.');
  const { a: proposeA } = await settleBothPrivateProposals(coordinationId, ctx);
  link(coordinationId, ctx, { contributionId: 'ng_proposal_a', type: 'proposal', assignmentId: proposeA, roundKey: 'round-1' });

  const rankA = await dispatch(coordinationId, ctx, 'private-rank', 'participant-a');
  assert.throws(
    () => link(coordinationId, ctx, { contributionId: 'ng_bad', type: 'proposal', assignmentId: rankA, roundKey: 'round-1' }),
    (err) => err instanceof CoordinationError && /does not declare "proposal" in its contributions\.allowedTypes\[\]/.test(err.message),
    '"private-rank" declares contributions.allowedTypes: [rank] only -- a "proposal" must be refused, never silently legalized',
  );
});

test('Nominal-Group chain: two private proposals, reveal, a clarification anchoring both, then two private ranks -- reconstructed from replay alone', async () => {
  const coordinationId = 'delib-ng-e2e';
  const ctx = openProtocolSession(NOMINAL_GROUP_ID, coordinationId, 'Run one nominal-group round.');

  const { a: proposeA, b: proposeB } = await settleBothPrivateProposals(coordinationId, ctx);
  link(coordinationId, ctx, { contributionId: 'ng_proposal_a', type: 'proposal', assignmentId: proposeA, roundKey: 'round-1' });
  link(coordinationId, ctx, { contributionId: 'ng_proposal_b', type: 'proposal', assignmentId: proposeB, roundKey: 'round-1' });

  authorizeDeclaredOperation(coordinationId, clarifyAuthorization({ grantedContextRefs: [proposeA, proposeB] }), ctx.opts);

  const clarifyId = await dispatch(coordinationId, ctx, 'clarify', 'facilitator-actor');
  link(coordinationId, ctx, {
    contributionId: 'ng_clarify',
    type: 'clarification',
    assignmentId: clarifyId,
    roundKey: 'round-1',
    anchors: ['ng_proposal_a', 'ng_proposal_b'],
  });

  const rankA = await dispatch(coordinationId, ctx, 'private-rank', 'participant-a');
  const rankB = await dispatch(coordinationId, ctx, 'private-rank', 'participant-b');
  link(coordinationId, ctx, { contributionId: 'ng_rank_a', type: 'rank', assignmentId: rankA, roundKey: 'round-1', anchors: ['ng_clarify'] });
  link(coordinationId, ctx, { contributionId: 'ng_rank_b', type: 'rank', assignmentId: rankB, roundKey: 'round-1', anchors: ['ng_clarify'] });

  // ── Chat-history-free replay reconstruction.
  const replayed = replaySession(coordinationId, ctx.opts);
  const proposals = replayed.contributions.filter((c) => c.type === 'proposal');
  const clarification = replayed.contributions.find((c) => c.type === 'clarification');
  const ranks = replayed.contributions.filter((c) => c.type === 'rank');

  assert.equal(proposals.length, 2, 'both private proposals must be reconstructable');
  assert.deepEqual(
    [...clarification.anchors].sort(),
    proposals.map((p) => p.contributionId).sort(),
    'replay alone must show the clarification anchors BOTH revealed proposals',
  );
  assert.equal(ranks.length, 2);
  for (const rank of ranks) {
    assert.deepEqual(rank.anchors, [clarification.contributionId], 'replay alone must show each rank is informed by the clarification');
  }
  // The two windows are reused for two different purposes: each participant's
  // own private proposal is always free to record (vacuously-open
  // "private-open"), while what depends on the whole cohort being revealed
  // together -- the clarification and both ranks -- carries the REAL "reveal"
  // gate's provenance.
  assert.deepEqual(new Set(proposals.map((c) => c.visibilityWindowRef)), new Set(['private-open']));
  assert.equal(clarification.visibilityWindowRef, 'reveal');
  assert.deepEqual(new Set(ranks.map((c) => c.visibilityWindowRef)), new Set(['reveal']));
});

// ─── Delphi chain: private proposal -> mediated aggregate artifact ─────────
// -> next-round proposal ─────────────────────────────────────────────────────

test('Delphi chain: round-1 private proposals, a mediated (non-contribution) aggregate, then round-2 proposals anchored to round 1 -- reconstructed from replay alone', async () => {
  const coordinationId = 'delib-delphi-e2e';
  const ctx = openProtocolSession(DELPHI_ID, coordinationId, 'Run two Delphi rounds.');

  const round1A = await dispatch(coordinationId, ctx, 'propose-round1', 'panelist-a');
  const round1B = await dispatch(coordinationId, ctx, 'propose-round1', 'panelist-b');
  const round1LinkA = link(coordinationId, ctx, { contributionId: 'delphi_r1_a', type: 'proposal', assignmentId: round1A, roundKey: 'round-1' });
  const round1LinkB = link(coordinationId, ctx, { contributionId: 'delphi_r1_b', type: 'proposal', assignmentId: round1B, roundKey: 'round-1' });
  assert.equal(round1LinkA.appended, true);
  assert.equal(round1LinkB.appended, true);

  // "aggregate" is a plain declared operation -- it produces the mediated
  // aggregate artifact this method is named for, but backs no contribution:
  // none of the six closed MVP8 types names "aggregate", and this cell does
  // not invent a seventh. Its settling is what opens round2-open.
  const aggregateId = await dispatch(coordinationId, ctx, 'aggregate', 'facilitator-actor');

  const round2A = await dispatch(coordinationId, ctx, 'propose-round2', 'panelist-a');
  const round2B = await dispatch(coordinationId, ctx, 'propose-round2', 'panelist-b');
  const round2LinkA = link(coordinationId, ctx, {
    contributionId: 'delphi_r2_a',
    type: 'proposal',
    assignmentId: round2A,
    roundKey: 'round-2',
    anchors: ['delphi_r1_a', 'delphi_r1_b'],
  });
  const round2LinkB = link(coordinationId, ctx, {
    contributionId: 'delphi_r2_b',
    type: 'proposal',
    assignmentId: round2B,
    roundKey: 'round-2',
    anchors: ['delphi_r1_a', 'delphi_r1_b'],
  });
  assert.equal(round2LinkA.appended, true);
  assert.equal(round2LinkB.appended, true);

  // ── Chat-history-free replay reconstruction.
  const replayed = replaySession(coordinationId, ctx.opts);
  const round1 = replayed.contributions.filter((c) => c.operationRef === 'propose-round1');
  const round2 = replayed.contributions.filter((c) => c.operationRef === 'propose-round2');
  assert.equal(round1.length, 2);
  assert.equal(round2.length, 2);
  for (const r2 of round2) {
    assert.deepEqual([...r2.anchors].sort(), round1.map((r) => r.contributionId).sort(), 'replay alone must show each round-2 proposal anchors BOTH round-1 proposals');
    assert.equal(r2.roundKey, 'round-2');
  }
  for (const r1 of round1) {
    assert.equal(r1.roundKey, 'round-1');
  }
  assert.equal(replayed.contributions.some((c) => c.assignmentId === aggregateId), false, 'the mediated aggregate itself is never a contribution');
  // Two different window provenances, one per round -- proving the SAME
  // MVP6 mechanism was reused twice for two different gates, not once.
  assert.deepEqual(new Set(round1.map((c) => c.visibilityWindowRef)), new Set(['round1-open']));
  assert.deepEqual(new Set(round2.map((c) => c.visibilityWindowRef)), new Set(['round2-open']));
});

test('Delphi chain: a round-2 proposal cannot link before the mediated aggregate settles', async () => {
  const coordinationId = 'delib-delphi-order';
  const ctx = openProtocolSession(DELPHI_ID, coordinationId, 'Probe round ordering.');
  await dispatch(coordinationId, ctx, 'propose-round1', 'panelist-a');
  await dispatch(coordinationId, ctx, 'propose-round1', 'panelist-b');
  const round2A = await dispatch(coordinationId, ctx, 'propose-round2', 'panelist-a');

  assert.throws(
    () => link(coordinationId, ctx, { contributionId: 'delphi_early_r2', type: 'proposal', assignmentId: round2A, roundKey: 'round-2' }),
    (err) => err instanceof CoordinationError && /visibility window "round2-open" to be open/.test(err.message),
    'round-2 cannot open before the mediated aggregate operation has settled',
  );
});

// ─── Missing-field default direction, second shape: an explicit empty array ─
// (the Nominal-Group "private-rank" test above already covers the
// absent-key shape against a real committed fixture; this covers the
// explicit `allowedTypes: []` shape against a minimal synthetic
// project-tier protocol, matching this track's own convention for isolating
// one schema-boundary case. The op is bound to a vacuously-open window --
// `opensAfter.operationRefs: []`, the same degenerate shape the two real
// fixtures use above -- purely so the type check itself, not the
// unrelated "no window declared" refusal, is what this test exercises.)

function emptyAllowedTypesProtocolDoc() {
  return {
    apiVersion: 'fgos.dev/v1alpha1',
    kind: 'FlowDefinition',
    metadata: { id: 'project.coordination-protocol.deliberation-empty-allowed-types', version: '1.0.0' },
    spec: {
      profile: {
        kind: 'CoordinationProtocol',
        completion: { mode: 'synthesize' },
        topology: {
          contextVisibility: 'mediated',
          visibilityWindows: [{ id: 'always-open', opensAfter: { milestone: 'listed-results-linked', operationRefs: [] }, permits: { sourceOperationRefs: [], delivery: 'artifact-refs' } }],
        },
      },
      roles: ['worker'],
      actors: [{ id: 'worker-actor', role: 'worker' }],
      operations: [
        { id: 'empty-array-op', role: 'worker', result: { kind: 'advisory', evidenceRequired: 'reported' }, contributions: { allowedTypes: [] } },
      ],
      graph: {
        entry: 'phase-only',
        nodes: [
          {
            id: 'phase-only',
            operations: [{ ref: 'empty-array-op', actor: 'worker-actor', contextAccess: { visibilityWindowRef: 'always-open' } }],
            transitions: [],
          },
        ],
      },
    },
  };
}

test('missing-field default direction, empty-array shape: an operation declaring contributions.allowedTypes: [] rejects every type, exactly like an absent key', async () => {
  const coordinationId = 'delib-empty-allowed-types';
  const tempDir = mkTempDir();
  const protocolsDir = path.join(tempDir, '.fgos', 'coordination-protocols');
  fs.mkdirSync(protocolsDir, { recursive: true });
  fs.writeFileSync(path.join(protocolsDir, 'empty-allowed-types.json'), JSON.stringify(emptyAllowedTypesProtocolDoc(), null, 2));
  const opts = { cwd: tempDir, repoRoot: tempDir };
  openDeclaredProtocolSession(
    { definitionId: 'project.coordination-protocol.deliberation-empty-allowed-types', coordinationId, objective: 'Probe the empty-array default.', writerId: 'coordinator-1' },
    opts,
  );
  const ctx = { tempDir, opts, runnerConfig: fakeRunnerConfig(tempDir) };
  const assignmentId = await dispatch(coordinationId, ctx, 'empty-array-op', 'worker-actor');

  assert.throws(
    () => link(coordinationId, ctx, { contributionId: 'empty_probe', type: 'proposal', assignmentId, roundKey: 'round-1' }),
    (err) => err instanceof CoordinationError && /does not declare "proposal" in its contributions\.allowedTypes\[\]/.test(err.message),
    'contributions.allowedTypes: [] is a legal declaration meaning "no type allowed", not an all-types-allowed default',
  );
});

// ─── Missing-field default direction, third shape: the key entirely absent ──
// (current-cell.md's Bug Taxonomy required both the empty-array shape above
// AND "one with the key entirely absent" as two separate cases -- neither the
// Nominal-Group narrowing test above nor the empty-array test actually omits
// the `contributions` key, both declare it explicitly. This is the one test
// that does: `absent-key-op` below carries no `contributions` field at all.)

function absentKeyProtocolDoc() {
  const doc = emptyAllowedTypesProtocolDoc();
  doc.metadata.id = 'project.coordination-protocol.deliberation-absent-allowed-types';
  doc.spec.operations = [
    { id: 'absent-key-op', role: 'worker', result: { kind: 'advisory', evidenceRequired: 'reported' } },
  ];
  doc.spec.graph.nodes[0].operations = [{ ref: 'absent-key-op', actor: 'worker-actor', contextAccess: { visibilityWindowRef: 'always-open' } }];
  return doc;
}

test('missing-field default direction, absent-key shape: an operation with no contributions key at all rejects every type, exactly like an explicit empty array', async () => {
  const coordinationId = 'delib-absent-allowed-types';
  const tempDir = mkTempDir();
  const protocolsDir = path.join(tempDir, '.fgos', 'coordination-protocols');
  fs.mkdirSync(protocolsDir, { recursive: true });
  fs.writeFileSync(path.join(protocolsDir, 'absent-allowed-types.json'), JSON.stringify(absentKeyProtocolDoc(), null, 2));
  const opts = { cwd: tempDir, repoRoot: tempDir };
  openDeclaredProtocolSession(
    { definitionId: 'project.coordination-protocol.deliberation-absent-allowed-types', coordinationId, objective: 'Probe the absent-key default.', writerId: 'coordinator-1' },
    opts,
  );
  const ctx = { tempDir, opts, runnerConfig: fakeRunnerConfig(tempDir) };
  const assignmentId = await dispatch(coordinationId, ctx, 'absent-key-op', 'worker-actor');

  assert.throws(
    () => link(coordinationId, ctx, { contributionId: 'absent_probe', type: 'proposal', assignmentId, roundKey: 'round-1' }),
    (err) => err instanceof CoordinationError && /does not declare "proposal" in its contributions\.allowedTypes\[\]/.test(err.message),
    'an operation with no contributions key at all must default to reject-everything, never to all-types-allowed',
  );
});
