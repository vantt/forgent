// coordination-group-thinking-rfc-review-lite-pack-conformance.test.mjs --
// Phase 10 (Step 09) cell P10.6: RFC-Review-Lite Conformance, proven through
// the REAL public pack gate (`runGroupThinkingRequest`,
// src/verbs/coordination/group-thinking-pack.mjs) -- the surface an actual
// user/skill invocation goes through -- never via a direct
// authorizeDeclaredOperation/dispatchDeclaredOperation/linkSessionContribution
// call a test author has full internal access to. P10.2 already proved the
// SAME chain end to end via DIRECT engine calls
// (test/runner/coordination-group-thinking-rfc-review-lite.test.mjs); this
// file does not duplicate that proof, it extends it through the pack door,
// plus a property P10.2 never covered: RESUME.
//
// A genuine, structural finding surfaced while building this file, verified
// by direct code read before writing a single assertion around it (never
// assumed), AT THE TIME THIS CELL (P10.6) RAN: `run.mjs`'s entire request
// step vocabulary was closed to four kinds -- "operation" | "authorize" |
// "disposition" | "fan-out" (run.mjs's own step-loop). None of the four
// ever called `linkSessionContribution` (session-engine.mjs) -- the only
// callers anywhere in this codebase were test files (P08's/P10.2's own
// suites). `deriveVisibilityWindowState`/`resolveBindingOutcome`
// (session-engine.mjs:1411-1490) derive every visibility window's
// open/closed state purely from `assignment-created` + Run-settlement
// events -- never from `deliberation-contribution-linked` events -- so the
// real REVEAL privacy gate (the property this protocol exists to prove) is
// fully reachable and provable through the pack gate regardless. But the
// CONTRIBUTION-typed ledger records themselves (proposal/objection/
// response, with `anchors`/`respondsTo` lineage) -- the specific artifacts
// P10.2's own replay assertions read -- could, at the time, only ever be
// created by a DIRECT `linkSessionContribution` call; there was no
// request-step shape that reached that door. Out of P10.6's own May-Touch
// scope to fix (`run.mjs`/`schema.mjs` were not on this cell's May-Touch
// list) -- named explicitly, and proven empirically (not merely asserted in
// prose) by this file's own `replayed.contributions.length === 0` assertion
// below, after driving the protocol's full window-gated chain end to end
// through nothing but the pack gate.
//
// **P10.10 (Promotion And Closeout) closed this gap**, classified
// "implementation bug" (in-scope, pack-layer wiring gap, not a "shared
// missing primitive" -- `linkSessionContribution` already existed and was
// already fully proven; only the request vocabulary reaching it was
// missing): `run.mjs`/`schema.mjs` now accept a fifth step kind,
// "contribution", that forwards into `linkSessionContribution` exactly the
// way "authorize"/"disposition" already forward into their own mediated
// doors, adding no new trust (see `run.mjs`'s own "contribution" branch and
// `schema.mjs`'s `validateContributionStep`). The assertion below is
// UNCHANGED and still accurate: THIS test's own request never uses the new
// step, so it still produces zero contribution records -- what changed is
// only that "can never exist through the pack gate, for any request" is no
// longer true as a categorical claim. The new positive test immediately
// below this one proves the door open, driving the SAME protocol's
// proposal/objection/response contributions end to end through nothing but
// `runGroupThinkingRequest`.
//
// What IS proven end to end through the pack gate, entirely from
// `replaySession`'s projection: the real "independent objections before
// controlled reveal" privacy gate (refusal with one objector settled,
// success once both have, zero side effects on refusal); a genuine
// interrupt-then-RESUME boundary spanning FOUR separate
// `runGroupThinkingRequest` calls against the same coordinationId (never
// one shot); a real, protocol-specific instance of the cross-protocol
// resume refusal (P10.1's Fix Round 1 fix, re-verified generically by
// P10.5) fired against THIS cell's own richer, mid-chain, real RFC-Review-
// Lite session rather than a bare disposition-only PoC; and a driver
// disposition against the response operation's own real, session-owned
// assignment ref (the one artifact-backed target actually reachable
// without a contribution record).
//
// A second real finding, also verified empirically rather than assumed:
// `classifySessionQuorum` (session-engine.mjs:3104) requires every actor
// DECLARED on the manifest to have completed something -- not every
// "required" operation. RFC-Review-Lite's 4 actors mean the SAME moment
// objector-b settles (the only moment "reveal" can legally open, since
// "respond" is driver-authorized, never required) is ALSO the moment
// quorum is met, so `closeSessionByQuorum` (called unconditionally at the
// end of every request) closes the session at the end of THAT SAME call.
// There is structurally no window for "authorize granted in one call, a
// genuinely later separate call still finds the session open to
// re-authorize it" -- so "no re-authorization of an already-settled step"
// is proven two ways below: a same-call repeat of the identical authorize
// step is a truthful idempotent no-op (run.mjs's own documented
// idempotent-authorize path), and a genuinely separate, later call
// attempting the same re-authorization is refused outright once the
// session has naturally closed -- never a silent second grant either way.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { runGroupThinkingRequest } from '../../src/verbs/coordination/group-thinking-pack.mjs';
import { replaySession } from '../../src/runner/coordination/replay.mjs';
import { CoordinationError } from '../../src/runner/coordination/schema.mjs';
import { StoreError } from '../../src/state/store.mjs';

const RFC_REVIEW_LITE_ID = 'core.coordination-protocol.group-thinking-rfc-review-lite';
const NOMINAL_GROUP_LITE_ID = 'core.coordination-protocol.group-thinking-nominal-group-lite';

const OUTPUTS = ['agent-result.json (status, summary)'];

function mkTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-p10-6-rfc-review-lite-pack-'));
}

function eventsPath(tempDir, coordinationId) {
  return path.join(tempDir, '.fgos', 'coordination', 'sessions', coordinationId, 'events.jsonl');
}

function countEventLines(tempDir, coordinationId) {
  const p = eventsPath(tempDir, coordinationId);
  if (!fs.existsSync(p)) return 0;
  return fs.readFileSync(p, 'utf8').split('\n').filter((line) => line.trim() !== '').length;
}

/** Same fake-executor shape P10.2/P10.5's own suites use for this fixture:
 *  a real Node subprocess, never a JS-level stub, that settles every
 *  not-yet-settled Run under `.fgos/assignments/` with a fixed report and a
 *  "done" result -- carries a `critical` tier entry since RFC-Review-Lite's
 *  objector actors declare `policy.minTier: critical`. */
function fakeRunnerConfig(tempDir) {
  const executorScript = path.join(tempDir, `fake-executor-${Math.random().toString(36).slice(2)}.mjs`);
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
            fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Report\\nSettled by the P10.6 test executor.\\n');
            fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'Settled by the P10.6 test executor.' }));
          }
        }
      }
    }
    process.stdout.write('done\\n');
    `,
  );
  return {
    executor: { allowCrossProvider: true, command: process.execPath, args: [executorScript, '{prompt}'] },
    modelPolicies: { claude: { lightweight: 'test-model', standard: 'test-model', critical: 'test-model' } },
    timeoutMs: 8000,
  };
}

function opStep(as, operationId, targetActorId) {
  return {
    type: 'operation',
    as,
    operationId,
    targetActorId,
    taskKey: `p10-6-${operationId}-${targetActorId}`,
    objective: `${operationId} pass for ${targetActorId}, dispatched through the pack gate.`,
    expectedOutputs: OUTPUTS,
  };
}

function assignmentIdFor(result, as) {
  const step = result.steps.find((s) => s.as === as);
  assert.ok(step, `expected a step result labeled "${as}"`);
  assert.ok(step.assignmentId, `expected step "${as}" to carry an assignmentId`);
  return step.assignmentId;
}

test('RFC-Review-Lite through the real pack gate: interrupt-then-resume across FOUR separate runGroupThinkingRequest calls, the real privacy-gate refusal, a real protocol-specific cross-protocol resume refusal on THIS session, and full reconstruction from replaySession alone', async () => {
  const tempDir = mkTempDir();
  const runnerConfig = fakeRunnerConfig(tempDir);
  const ctx = { cwd: tempDir, repoRoot: tempDir, runnerConfig };
  const coordinationId = 'coord_p10_6_rfc_full_chain';
  const writerId = 'p10-6-rfc-driver';

  // ── Call 1: open the session through the pack, convene, propose, and only
  //    ONE of the two independent objectors settles -- the interrupt point.
  const call1 = await runGroupThinkingRequest(ctx, {
    protocolId: RFC_REVIEW_LITE_ID,
    requestObject: {
      kind: 'declared-protocol',
      objective: 'Open one RFC-Review-Lite round entirely through the pack gate.',
      writerId,
      coordinationId,
      protocolRef: { id: RFC_REVIEW_LITE_ID },
      steps: [opStep('convene', 'convene', 'coordinator-actor'), opStep('propose', 'propose', 'proposer-actor'), opStep('objectA', 'object', 'objector-a-actor')],
    },
  });
  assert.equal(call1.definitionRef.id, RFC_REVIEW_LITE_ID);
  assert.equal(call1.closed, false, 'quorum cannot be met with only 3 of 4 declared actors having produced a result yet');
  const objectAId = assignmentIdFor(call1, 'objectA');
  const eventsAfterCall1 = countEventLines(tempDir, coordinationId);
  assert.ok(eventsAfterCall1 > 0, 'sanity: call 1 really wrote events');

  // ── Call 2: still through the pack, the SAME real privacy gate P10.2
  //    proved via direct engine calls -- "reveal" opensAfter EVERY binding
  //    of "object", so a single settled objector cannot authorize the
  //    driver-authorized "respond". Refused BEFORE any mutation.
  await assert.rejects(
    () =>
      runGroupThinkingRequest(ctx, {
        protocolId: RFC_REVIEW_LITE_ID,
        requestObject: {
          kind: 'declared-protocol',
          objective: 'Attempt the reveal-gated authorization with only one objector settled.',
          writerId,
          coordinationId,
          protocolRef: { id: RFC_REVIEW_LITE_ID },
          steps: [
            {
              type: 'authorize',
              as: 'authRespond',
              operationId: 'respond',
              targetActorId: 'proposer-actor',
              authorizationId: 'auth_p10_6_respond',
              invocationKey: 'p10-6-respond:1',
              reason: 'Reveal both independent objections for a driver-authorized response.',
              grantedContextRefs: [objectAId],
            },
          ],
        },
      }),
    (err) => err instanceof CoordinationError && /visibility window "reveal" to be open/.test(err.message),
    'the pack gate must refuse the SAME reveal-window authorization P10.2 already proved refused via direct engine calls -- the real privacy gate, reachable through the real request/step vocabulary, not bypassed by it',
  );
  assert.equal(countEventLines(tempDir, coordinationId), eventsAfterCall1, 'the refused authorization attempt must write zero new events');

  // ── Call 3: a real, protocol-specific instance of P10.1's Fix Round 1
  //    resume cross-check (already re-verified generically by P10.5 against
  //    a bare, disposition-only session) -- attempted here against THIS
  //    cell's own richer, real, mid-chain RFC-Review-Lite session, claiming
  //    a DIFFERENT real, ALSO pack-registered protocol.
  await assert.rejects(
    () =>
      runGroupThinkingRequest(ctx, {
        protocolId: NOMINAL_GROUP_LITE_ID,
        requestObject: {
          kind: 'declared-protocol',
          objective: 'Attempt to resume a real, in-progress RFC-Review-Lite session under a different, also-registered protocol.',
          writerId,
          coordinationId,
          protocolRef: { id: NOMINAL_GROUP_LITE_ID },
          steps: [{ type: 'disposition', as: 'd', targetRef: coordinationId, disposition: 'noted', rationale: 'P10.6 protocol-specific cross-protocol resume refusal check.' }],
        },
      }),
    (err) =>
      err instanceof StoreError &&
      err.category === 'validation' &&
      new RegExp(`already bound to protocol "${RFC_REVIEW_LITE_ID.replace(/\./g, '\\.')}"`).test(err.message) &&
      new RegExp(`not the explicitly selected "${NOMINAL_GROUP_LITE_ID.replace(/\./g, '\\.')}"`).test(err.message),
    'a session really opened under RFC-Review-Lite through the pack must refuse a resume claiming Nominal-Group-Lite, even mid-chain with real accumulated state',
  );
  assert.equal(countEventLines(tempDir, coordinationId), eventsAfterCall1, 'the refused cross-protocol resume attempt must write zero new events either');

  // ── Call 4: the REAL resume -- correct continuation from where call 1
  //    left off. objectB settles (the second, independent objector), the
  //    SAME authorization that was refused in call 2 now succeeds (mixing a
  //    LITERAL ref carried over from call 1 with a fresh "$ref:" label from
  //    THIS call -- proving resolveRef's own documented "advanced/resume
  //    use case" for a literal id), the proposer responds, and the driver
  //    dispositions the response's own assignment (the real, session-owned,
  //    artifact-backed target reachable without a contribution record --
  //    see this file's header comment for why a `contribution:` ref is not
  //    reachable through this door). NO re-dispatch of convene/propose/
  //    objectA -- resume never needs to redo call 1's already-settled work.
  const call4 = await runGroupThinkingRequest(ctx, {
    protocolId: RFC_REVIEW_LITE_ID,
    requestObject: {
      kind: 'declared-protocol',
      objective: 'Resume the same session under its own real protocol and complete the round.',
      writerId,
      coordinationId,
      protocolRef: { id: RFC_REVIEW_LITE_ID },
      steps: [
        opStep('objectB', 'object', 'objector-b-actor'),
        {
          type: 'authorize',
          as: 'authRespond',
          operationId: 'respond',
          targetActorId: 'proposer-actor',
          authorizationId: 'auth_p10_6_respond',
          invocationKey: 'p10-6-respond:1',
          reason: 'Reveal both independent objections for a driver-authorized response.',
          grantedContextRefs: [objectAId, '$ref:objectB'],
        },
        opStep('respond', 'respond', 'proposer-actor'),
        { type: 'disposition', as: 'disposeResponse', targetRef: '$ref:respond', disposition: 'accepted', rationale: 'The response satisfactorily addresses both independent objections.', evidenceRefs: [] },
      ],
    },
  });
  assert.equal(call4.definitionRef.id, RFC_REVIEW_LITE_ID, 'the earlier refused cross-protocol attempt must have left the session\'s real bound protocol untouched');
  assert.equal(call4.steps.find((s) => s.as === 'authRespond').appended, true, 'the SAME authorization refused in call 2 must now genuinely succeed once resumed with both objectors settled');
  assert.equal(call4.steps.find((s) => s.as === 'respond').status, 'done');
  assert.equal(call4.steps.find((s) => s.as === 'disposeResponse').appended, true);
  const respondId = assignmentIdFor(call4, 'respond');
  assert.equal(call4.steps.find((s) => s.as === 'disposeResponse').targetRef, respondId, 'the "$ref:respond" label resolved to the real response assignment, not an unresolved placeholder');

  // ── Chat-history-free replay: reconstruct the WHOLE 4-call chain from
  //    replaySession's own projection alone -- proving resume across
  //    independent process-level calls leaves one coherent, single-session
  //    ledger, not four disjoint fragments.
  const replayed = replaySession(coordinationId, { cwd: tempDir, repoRoot: tempDir });
  const actorIdsWithAssignments = new Set(replayed.assignments.map((a) => a.actorId));
  assert.deepEqual(
    actorIdsWithAssignments,
    new Set(['coordinator-actor', 'proposer-actor', 'objector-a-actor', 'objector-b-actor']),
    'replay alone must show all four actors dispatched across all four separate pack-gate calls, not just the ones from the final call',
  );
  assert.equal(replayed.assignments.filter((a) => a.actorId === 'objector-a-actor').length, 1, 'objector-a must have been dispatched exactly ONCE across the whole interrupt-then-resume chain -- resume never re-dispatches call 1\'s already-settled objection');
  assert.equal(replayed.assignments.filter((a) => a.actorId === 'proposer-actor').length, 2, 'the proposer is bound twice (propose in call 1, respond in call 4) -- both, and only those two, reconstructable from replay');

  assert.equal(replayed.authorizations.length, 1, 'exactly one authorization was ever appended -- the refused call-2 attempt wrote none, matching the event-count assertions above');
  assert.equal(replayed.authorizations[0].authorizationId, 'auth_p10_6_respond');
  assert.deepEqual(new Set(replayed.authorizations[0].grantedContextRefs), new Set([objectAId, assignmentIdFor(call4, 'objectB')]), 'replay alone must show the grant reveals BOTH independent objections, one carried over literally from call 1 and one resolved via "$ref:" inside call 4');

  assert.equal(replayed.dispositions.length, 1);
  assert.equal(replayed.dispositions[0].targetRef, respondId);
  assert.equal(replayed.dispositions[0].disposition, 'accepted');

  // This request never uses the "contribution" step (P10.10 added it after
  // this test was first written -- see this file's header comment), so it
  // still produces zero deliberation-ledger contribution records here, even
  // though every window-gating/authorization/disposition property those
  // records would eventually back is itself fully proven above. The
  // positive test immediately below this one proves the door is genuinely
  // open when a request DOES use it.
  assert.equal(replayed.contributions.length, 0, 'this request never attempts a "contribution" step, so it produces zero contribution records -- see the positive test below for the door itself');
  assert.deepEqual(replayed.resolvedContributionIds, []);
  assert.deepEqual(replayed.openContributionIds, []);
});

// P10.10 (Promotion And Closeout): the positive proof that the gap named
// above is genuinely closed -- the SAME RFC-Review-Lite chain the test
// above proves through nothing but the pack gate, this time also using the
// new "contribution" step to record the real proposal/objection/response
// lineage (`anchors`/`respondsTo`, the exact shape P10.2's own DIRECT
// engine-call test proves), reconstructed from `replaySession` alone.
test('P10.10: RFC-Review-Lite\'s full proposal/objection/response contribution lineage is now reachable through the real pack gate via the new "contribution" step -- reconstructed from replaySession alone', async () => {
  const tempDir = mkTempDir();
  const runnerConfig = fakeRunnerConfig(tempDir);
  const ctx = { cwd: tempDir, repoRoot: tempDir, runnerConfig };
  const coordinationId = 'coord_p10_10_rfc_contribution_lineage';
  const writerId = 'p10-10-rfc-driver';

  function contributionStep(as, overrides = {}) {
    return { type: 'contribution', as, roundKey: 'round-1', ...overrides };
  }

  // Call 1 deliberately stops BEFORE authorizing/dispatching "respond" --
  // the SAME interrupt point the "P10-KERNEL-FIX" test immediately below
  // this one already establishes (proposer-actor's own gated "respond"
  // binding is what keeps the session genuinely open across the call
  // boundary), so a genuinely separate LATER call can still link a
  // contribution while the session is still active.
  const call1 = await runGroupThinkingRequest(ctx, {
    protocolId: RFC_REVIEW_LITE_ID,
    requestObject: {
      kind: 'declared-protocol',
      objective: 'Settle both objectors and their contribution lineage through the pack gate; stop before authorizing or dispatching "respond".',
      writerId,
      coordinationId,
      protocolRef: { id: RFC_REVIEW_LITE_ID },
      steps: [
        opStep('convene', 'convene', 'coordinator-actor'),
        opStep('propose', 'propose', 'proposer-actor'),
        contributionStep('linkProposal', { contributionId: 'p10_10_proposal', contributionType: 'proposal', assignmentId: '$ref:propose' }),
        opStep('objectA', 'object', 'objector-a-actor'),
        contributionStep('linkObjectionA', { contributionId: 'p10_10_objection_a', contributionType: 'objection', assignmentId: '$ref:objectA', anchors: ['p10_10_proposal'] }),
        opStep('objectB', 'object', 'objector-b-actor'),
        contributionStep('linkObjectionB', { contributionId: 'p10_10_objection_b', contributionType: 'objection', assignmentId: '$ref:objectB', anchors: ['p10_10_proposal'] }),
      ],
    },
  });

  const linkProposal = call1.steps.find((s) => s.as === 'linkProposal');
  const linkObjectionA = call1.steps.find((s) => s.as === 'linkObjectionA');
  const linkObjectionB = call1.steps.find((s) => s.as === 'linkObjectionB');

  assert.equal(linkProposal.type, 'contribution');
  assert.equal(linkProposal.contributionType, 'proposal');
  assert.equal(linkProposal.appended, true);
  assert.equal(linkObjectionA.appended, true);
  assert.equal(linkObjectionB.appended, true);
  assert.equal(
    call1.closed,
    false,
    'proposer-actor still owes its own gated "respond" binding -- the session must genuinely still be active when call 2 starts',
  );

  // Call 2: a genuinely SEPARATE, later call, naming the SAME
  // coordinationId, while the session is still active. Repeats the
  // identical proposal contribution link (a truthful idempotent no-op,
  // matching "authorize"'s own documented idempotent path) and attempts to
  // smuggle a caller-declared "linkedBy" (refused at the request boundary,
  // driver provenance always derived from the session's own writerId).
  const call2 = await runGroupThinkingRequest(ctx, {
    protocolId: RFC_REVIEW_LITE_ID,
    requestObject: {
      kind: 'declared-protocol',
      objective: 'Repeat the identical proposal contribution link in a genuinely separate later call.',
      writerId,
      coordinationId,
      protocolRef: { id: RFC_REVIEW_LITE_ID },
      steps: [{ type: 'contribution', as: 'linkProposalRepeat', contributionId: 'p10_10_proposal', contributionType: 'proposal', assignmentId: linkProposal.assignmentId, roundKey: 'round-1' }],
    },
  });
  assert.equal(call2.steps.find((s) => s.as === 'linkProposalRepeat').appended, false, 'an identical repeat of an already-linked contributionId must be a truthful no-op, never a second link');

  await assert.rejects(
    () =>
      runGroupThinkingRequest(ctx, {
        protocolId: RFC_REVIEW_LITE_ID,
        requestObject: {
          kind: 'declared-protocol',
          objective: 'Attempt to smuggle a caller-declared linkedBy identity.',
          writerId,
          coordinationId,
          protocolRef: { id: RFC_REVIEW_LITE_ID },
          steps: [{ type: 'contribution', as: 'linkForged', contributionId: 'p10_10_forged', contributionType: 'proposal', assignmentId: linkProposal.assignmentId, roundKey: 'round-1', linkedBy: { type: 'driver', id: 'someone-else' } }],
        },
      }),
    /declares "linkedBy"/,
    'a request may never name its own "linkedBy" -- driver provenance is pinned to the session\'s own writerId',
  );

  // Call 3: a THIRD, genuinely separate call finishes the round -- authorize
  // + dispatch "respond", link its own response contribution (anchors both
  // objections, responds to objection A), and record the driver's
  // disposition. Every gating binding is now settled, so the session
  // correctly closes at the end of THIS call.
  const call3 = await runGroupThinkingRequest(ctx, {
    protocolId: RFC_REVIEW_LITE_ID,
    requestObject: {
      kind: 'declared-protocol',
      objective: 'Finish the round: authorize+dispatch respond, link its response contribution, and dispose it.',
      writerId,
      coordinationId,
      protocolRef: { id: RFC_REVIEW_LITE_ID },
      steps: [
        {
          type: 'authorize',
          as: 'authRespond',
          operationId: 'respond',
          targetActorId: 'proposer-actor',
          authorizationId: 'auth_p10_10_respond',
          invocationKey: 'p10-10-respond:1',
          reason: 'Reveal both independent objections for a driver-authorized response.',
          grantedContextRefs: [linkObjectionA.assignmentId, linkObjectionB.assignmentId],
        },
        opStep('respond', 'respond', 'proposer-actor'),
        contributionStep('linkResponse', {
          contributionId: 'p10_10_response',
          contributionType: 'response',
          assignmentId: '$ref:respond',
          respondsTo: 'p10_10_objection_a',
          anchors: ['p10_10_objection_a', 'p10_10_objection_b'],
        }),
        { type: 'disposition', as: 'disposeResponse', targetRef: '$ref:respond', disposition: 'accepted', rationale: 'The response satisfactorily addresses both independent objections.', evidenceRefs: [] },
      ],
    },
  });
  const linkResponse = call3.steps.find((s) => s.as === 'linkResponse');
  assert.equal(linkResponse.appended, true);
  assert.equal(linkResponse.contributionType, 'response');
  assert.deepEqual(new Set(linkResponse.anchors), new Set(['p10_10_objection_a', 'p10_10_objection_b']));
  assert.equal(linkResponse.respondsTo, 'p10_10_objection_a');
  assert.equal(call3.closed, true, 'every gating binding is now settled -- the session correctly closes at the end of this call');

  // Chat-history-free replay: the WHOLE contribution-typed lineage
  // reconstructed from replaySession alone, across three separate pack-gate
  // calls -- proving this is a real, durable ledger record, not a
  // request-scoped echo.
  const replayed = replaySession(coordinationId, { cwd: tempDir, repoRoot: tempDir });
  assert.equal(replayed.contributions.length, 4, 'proposal + 2 objections + response, reconstructed from replay alone');
  const byId = Object.fromEntries(replayed.contributions.map((c) => [c.contributionId, c]));
  assert.equal(byId.p10_10_proposal.type, 'proposal');
  assert.equal(byId.p10_10_objection_a.type, 'objection');
  assert.deepEqual(byId.p10_10_objection_a.anchors, ['p10_10_proposal']);
  assert.equal(byId.p10_10_objection_b.type, 'objection');
  assert.deepEqual(byId.p10_10_objection_b.anchors, ['p10_10_proposal']);
  assert.equal(byId.p10_10_response.type, 'response');
  assert.equal(byId.p10_10_response.respondsTo, 'p10_10_objection_a');
  assert.deepEqual(new Set(byId.p10_10_response.anchors), new Set(['p10_10_objection_a', 'p10_10_objection_b']));
  assert.equal(byId.p10_10_proposal.operationRef, 'propose', 'each contribution\'s own operationRef is derived by the engine from the backing Assignment\'s stamp, never accepted from the request');
  assert.equal(byId.p10_10_response.operationRef, 'respond');
});

test('P10-KERNEL-FIX: a genuinely SEPARATE later runGroupThinkingRequest call reaches proposer-actor\'s remaining declared operation ("respond") successfully -- the exact bug this fix corrects -- and no re-authorization of an already-settled step is possible once the session has naturally closed', async () => {
  const tempDir = mkTempDir();
  const runnerConfig = fakeRunnerConfig(tempDir);
  const ctx = { cwd: tempDir, repoRoot: tempDir, runnerConfig };
  const coordinationId = 'coord_p10_kernel_fix_rfc_resume';
  const writerId = 'p10-kernel-fix-rfc-driver';

  // Design note (P10-KERNEL-FIX, session-engine.mjs's `classifySessionQuorum`
  // / `actorGatingOperationIds`): BEFORE this fix, quorum counted
  // `proposer-actor` complete the instant `propose` (its FIRST-ever
  // assignment) settled -- ignoring that `respond` is a real, later,
  // still-pending phase of the SAME actor's own work, gated by the SAME
  // "reveal" visibility window this call also opens. That made the session
  // auto-close at the end of THIS call, before the driver ever got a
  // chance to authorize+dispatch "respond" in a genuinely later, separate
  // call -- RFC-Review-Lite's own normal "objections raised now, proposer
  // responds later" flow, silently and permanently refused (P10.7's own
  // Red-Team finding, reproduced live against this exact, already-closed
  // P10.6 protocol). AFTER this fix, `respond` is a GATING binding for
  // proposer-actor (driver-authorized + `contextAccess.visibilityWindowRef`
  // declared) -- proposer-actor stays incomplete, and the session stays
  // open, until it too settles.
  const call1 = await runGroupThinkingRequest(ctx, {
    protocolId: RFC_REVIEW_LITE_ID,
    requestObject: {
      kind: 'declared-protocol',
      objective: 'Settle both objectors through the pack gate; stop before authorizing or dispatching "respond".',
      writerId,
      coordinationId,
      protocolRef: { id: RFC_REVIEW_LITE_ID },
      steps: [
        opStep('convene', 'convene', 'coordinator-actor'),
        opStep('propose', 'propose', 'proposer-actor'),
        opStep('objectA', 'object', 'objector-a-actor'),
        opStep('objectB', 'object', 'objector-b-actor'),
      ],
    },
  });
  const objectAId = assignmentIdFor(call1, 'objectA');
  const objectBId = assignmentIdFor(call1, 'objectB');
  assert.equal(
    call1.closed,
    false,
    'P10-KERNEL-FIX: the session must NOT auto-close here -- proposer-actor still owes its own gated "respond" binding, even though "propose" (its first-ever assignment) already settled',
  );
  assert.deepEqual(
    call1.quorum.missing.map((m) => m.actorId),
    ['proposer-actor'],
    'proposer-actor, and only proposer-actor, is reported incomplete -- coordinator/objector-a/objector-b have no further gating binding and are correctly complete already',
  );
  const eventsAfterCall1 = countEventLines(tempDir, coordinationId);
  assert.equal(replaySession(coordinationId, { cwd: tempDir, repoRoot: tempDir }).manifest.status, 'active', 'the session must genuinely still be active -- not prematurely closed -- when call 2 starts');

  // ── Call 2: a genuinely SEPARATE, later runGroupThinkingRequest call,
  //    naming the SAME coordinationId. Authorizes "respond" (twice --
  //    proving the same-call idempotent no-op still holds), dispatches it,
  //    and records the driver's disposition -- THE scenario silently,
  //    permanently refused before this fix.
  const authorizeStep = {
    type: 'authorize',
    as: 'authRespondFirst',
    operationId: 'respond',
    targetActorId: 'proposer-actor',
    authorizationId: 'auth_p10_kernel_fix_respond',
    invocationKey: 'p10-kernel-fix-respond:1',
    reason: 'Reveal both independent objections for a driver-authorized response, in a genuinely separate later call.',
    grantedContextRefs: [objectAId, objectBId],
  };
  const call2 = await runGroupThinkingRequest(ctx, {
    protocolId: RFC_REVIEW_LITE_ID,
    requestObject: {
      kind: 'declared-protocol',
      objective: 'Resume the same session, authorize (twice) and dispatch "respond", then record the driver\'s disposition.',
      writerId,
      coordinationId,
      protocolRef: { id: RFC_REVIEW_LITE_ID },
      steps: [
        authorizeStep,
        // Same authorizationId + invocationKey, repeated within THIS
        // (genuinely separate) request -- run.mjs's own documented
        // idempotent-authorize path (readSessionEvents fallback on
        // appended:false, run.mjs:433-446) must report the REAL,
        // already-persisted grant back, never a second live authorization.
        { ...authorizeStep, as: 'authRespondRepeat' },
        opStep('respond', 'respond', 'proposer-actor'),
        { type: 'disposition', as: 'disposeResponse', targetRef: '$ref:respond', disposition: 'accepted', rationale: 'The response satisfactorily addresses both independent objections.', evidenceRefs: [] },
      ],
    },
  });
  const firstGrant = call2.steps.find((s) => s.as === 'authRespondFirst');
  const repeatGrant = call2.steps.find((s) => s.as === 'authRespondRepeat');
  assert.equal(firstGrant.appended, true, 'the FIRST authorize step, in this genuinely separate call, really granted a new authorization');
  assert.equal(repeatGrant.appended, false, 'the immediate, same-call repeat of the identical authorizationId is a truthful no-op, not a fresh grant');
  assert.equal(repeatGrant.authorizationId, firstGrant.authorizationId);
  assert.deepEqual(new Set(repeatGrant.grantedContextRefs), new Set(firstGrant.grantedContextRefs), 'the idempotent read-back must report the REAL persisted grant, byte-identical to the first');
  assert.equal(
    call2.steps.find((s) => s.as === 'respond').status,
    'done',
    'P10-KERNEL-FIX: "respond" now dispatches successfully in a genuinely separate, later call -- refused outright before this fix (session already "completed")',
  );
  assert.equal(call2.steps.find((s) => s.as === 'disposeResponse').appended, true);
  const respondId = assignmentIdFor(call2, 'respond');
  assert.equal(call2.steps.find((s) => s.as === 'disposeResponse').targetRef, respondId);
  assert.equal(call2.closed, true, 'every gating binding is now settled -- the session correctly closes at the end of THIS call');

  const replayedAfterCall2 = replaySession(coordinationId, { cwd: tempDir, repoRoot: tempDir });
  assert.equal(replayedAfterCall2.authorizations.length, 1, 'replay alone must show exactly ONE authorization ever took effect, even after call 2\'s own same-call repeat');
  assert.equal(replayedAfterCall2.assignments.filter((a) => a.actorId === 'proposer-actor').length, 2, 'the proposer is bound twice (propose in call 1, respond in call 2) -- both, and only those two, reconstructable from replay');

  // ── Call 3: a genuinely SEPARATE, THIRD call, attempting to re-authorize
  //    the identical, already-settled step AFTER the session has naturally
  //    closed. Must be refused outright -- never a silent second grant.
  const eventsAfterCall2 = countEventLines(tempDir, coordinationId);
  await assert.rejects(
    () =>
      runGroupThinkingRequest(ctx, {
        protocolId: RFC_REVIEW_LITE_ID,
        requestObject: {
          kind: 'declared-protocol',
          objective: 'Attempt to re-authorize the identical, already-settled step after the session has naturally closed.',
          writerId,
          coordinationId,
          protocolRef: { id: RFC_REVIEW_LITE_ID },
          steps: [{ ...authorizeStep, as: 'authRespondFirst' }],
        },
      }),
    (err) => err instanceof CoordinationError && /is not active \(status: "completed"\)/.test(err.message),
    'a genuinely separate, later call attempting to re-authorize an already-settled step must be refused outright once the session has closed -- never a silent second grant',
  );
  assert.equal(countEventLines(tempDir, coordinationId), eventsAfterCall2, 'the refused later call must write zero new events');
  assert.ok(eventsAfterCall1 < eventsAfterCall2, 'sanity: call 2 really appended new events on top of call 1');

  const replayedFinal = replaySession(coordinationId, { cwd: tempDir, repoRoot: tempDir });
  assert.equal(replayedFinal.authorizations.length, 1, 'replay alone must still show exactly ONE authorization ever took effect, after the same-call repeat and the later post-close refusal');
});
