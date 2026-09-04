// coordination-group-thinking-nominal-group-lite-pack.test.mjs -- Phase 10
// (Step 09) P10.7: Nominal-Group-Lite Conformance, proven THROUGH the real
// public pack gate (`runGroupThinkingRequest`, group-thinking-pack.mjs),
// not via direct engine calls -- P10.3's own
// test/runner/coordination-nominal-group-lite.test.mjs already proved the
// same chain end-to-end at the engine door directly; this file's job is to
// re-prove the SAME properties are reachable through the pack gate
// specifically, plus one property P10.3 never covered: resume.
//
// What this file proves, and only this:
//
// 1. The full private-propose(x3) -> share -> clarify -> private-rank(x3)
//    chain dispatches and window-gates correctly when driven ENTIRELY
//    through `runGroupThinkingRequest`, never `dispatchDeclaredOperation`/
//    `authorizeDeclaredOperation` directly.
// 2. No-tally semantics re-confirmed at the pack-gate layer:
//    `replaySession(...).aggregations` stays empty after driving the whole
//    chain through the pack.
// 3. A genuine, honestly-named finding: `run.mjs`'s request step vocabulary
//    is closed to exactly `operation` | `authorize` | `disposition` |
//    `fan-out` (schema.mjs's own `validateSteps`) -- there is no `link` step
//    type, so `linkSessionContribution` (session-engine.mjs; the ONLY door
//    that turns a settled Run into a durable `proposal`/`clarification`/
//    `rank` contribution) is structurally UNREACHABLE through the pack gate,
//    for this protocol or any other pack member. This is proven empirically
//    here (a `type: 'link'` step is refused by the real schema, not merely
//    argued from a static read), and named as a shared missing primitive in
//    P10.7.md, per this cell's own current-cell.md and the phase-10 exit
//    contract ("If a shared missing primitive is proven, do not hide it in
//    the Protocol Pack or skill.").
// 4. Chat-history-free replay reconstruction, SCOPED HONESTLY to what (3)
//    above leaves reachable: the four-phase assignment/authorization
//    lineage (which actor dispatched which operation, and which
//    authorization's `grantedContextRefs` gated which later operation) is
//    fully reconstructable from `replaySession(...)` alone -- contribution
//    lineage (P10.3's own `anchors`-based reconstruction) is not, because no
//    contribution was ever linked through this door (see (3)).
// 5. Resume through the pack, split into two tests once a genuine SECOND
//    finding surfaced while building the first draft (full detail at the
//    top of the "Resume through the pack" section below):
//    (A) a chain split across two independent `runGroupThinkingRequest`
//        calls, interrupted BEFORE the facilitator's first-ever dispatch,
//        continues and completes correctly -- no duplicate assignment for
//        anything call 1 already settled, and the no-tally check still
//        holds at the end.
//    (B) the literal "interrupt after share settles, resume before
//        clarify" scenario current-cell.md's own example names is REFUSED
//        -- not by the pack gate, but because `run.mjs`'s own unconditional
//        close-on-quorum-at-end-of-every-request already auto-completes the
//        session after just 2 of 4 phases. `classifySessionQuorum`
//        (session-engine.mjs) is a PER-ACTOR model (every declared actor id
//        needs ONE settled assignment, anywhere in the graph), not a
//        per-graph-node one -- so any protocol where one actor performs more
//        than one operation across the graph (true of all three
//        group-thinking-lite protocols' facilitator/panelist roles, not
//        just this one) is at risk of the same premature closure. A shared
//        kernel gap (`src/runner/**`, Do-Not-Touch for this cell), proven
//        and named here, not hidden or patched.
// 6. P10.1's Fix Round 1 HIGH-finding fix (resume-path protocol
//    cross-check), re-verified with Nominal-Group-Lite as the REAL,
//    already-bound protocol (P10.5.md's own test proved the complementary
//    direction: RFC-Review-Lite real-bound, Nominal-Group-Lite falsely
//    claimed). Both directions are now covered for this protocol.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { runGroupThinkingRequest } from '../../src/verbs/coordination/group-thinking-pack.mjs';
import { openDeclaredProtocolSession } from '../../src/runner/coordination/session-engine.mjs';
import { replaySession } from '../../src/runner/coordination/replay.mjs';
import { StoreError } from '../../src/state/store.mjs';

const NOMINAL_GROUP_LITE_ID = 'core.coordination-protocol.group-thinking-nominal-group-lite';
const RFC_REVIEW_LITE_ID = 'core.coordination-protocol.group-thinking-rfc-review-lite';

const OUTPUTS = ['agent-result.json (status, summary)'];

function mkTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-ngl-pack-test-'));
}

function eventsPath(tempDir, coordinationId) {
  return path.join(tempDir, '.fgos', 'coordination', 'sessions', coordinationId, 'events.jsonl');
}

function countEventLines(tempDir, coordinationId) {
  const p = eventsPath(tempDir, coordinationId);
  if (!fs.existsSync(p)) return 0;
  return fs.readFileSync(p, 'utf8').split('\n').filter((line) => line.trim() !== '').length;
}

function readEventTypes(tempDir, coordinationId) {
  const p = eventsPath(tempDir, coordinationId);
  if (!fs.existsSync(p)) return [];
  return fs
    .readFileSync(p, 'utf8')
    .split('\n')
    .filter((line) => line.trim() !== '')
    .map((line) => JSON.parse(line).type);
}

/** Same fake-executor shape as P10.5's own
 *  coordination-group-thinking-pack-registration.test.mjs -- a real Node
 *  subprocess, never a JS-level stub, that settles every not-yet-settled Run
 *  under `.fgos/assignments/`. A single default executor is enough here:
 *  the per-actor DIFFERENT-EXECUTOR requirement was already proved live by
 *  P10.3 (direct engine calls); this cell's own job is pack-gate
 *  reachability, not re-deriving that proof. */
function fakeRunnerConfig(tempDir) {
  const executorScript = path.join(tempDir, `fake-ngl-pack-executor-${Math.random().toString(36).slice(2)}.mjs`);
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
            fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Report\\nSettled by the P10.7 test executor.\\n');
            fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'Settled by the P10.7 test executor.' }));
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

function proposeStep(as, targetActorId) {
  return {
    type: 'operation',
    as,
    operationId: 'private-propose',
    targetActorId,
    taskKey: `declared-private-propose-${targetActorId}`,
    objective: `Privately propose (${targetActorId}).`,
    expectedOutputs: OUTPUTS,
  };
}

function rankStep(as, targetActorId) {
  return {
    type: 'operation',
    as,
    operationId: 'private-rank',
    targetActorId,
    taskKey: `declared-private-rank-${targetActorId}`,
    objective: `Privately rank (${targetActorId}).`,
    expectedOutputs: OUTPUTS,
  };
}

function baseRequest({ coordinationId, writerId, steps }) {
  return {
    kind: 'declared-protocol',
    objective: 'Prove the Nominal-Group-Lite chain through the real pack gate (P10.7).',
    writerId,
    coordinationId,
    protocolRef: { id: NOMINAL_GROUP_LITE_ID },
    steps,
  };
}

// ---------------------------------------------------------------------
// 1. Full chain, single request, entirely through runGroupThinkingRequest.

test('Nominal-Group-Lite chain end-to-end through the real pack gate (runGroupThinkingRequest, not direct engine calls): three private proposals, controlled share, clarification, three private ranks', async () => {
  const tempDir = mkTempDir();
  const runnerConfig = fakeRunnerConfig(tempDir);
  const coordinationId = 'ngl-pack-e2e';
  const writerId = 'p10-7-full-chain';

  const steps = [
    proposeStep('proposeA', 'participant-a'),
    proposeStep('proposeB', 'participant-b'),
    proposeStep('proposeC', 'participant-c'),
    {
      type: 'authorize',
      as: 'authShare',
      operationId: 'share',
      targetActorId: 'facilitator-actor',
      authorizationId: 'auth_share_e2e',
      invocationKey: 'share:e2e:1',
      reason: 'All three private proposals have settled -- open the controlled share.',
      grantedContextRefs: ['$ref:proposeA', '$ref:proposeB', '$ref:proposeC'],
    },
    { type: 'operation', as: 'share', operationId: 'share', targetActorId: 'facilitator-actor', taskKey: 'declared-share-facilitator-actor', objective: 'Controlled share of the three proposals.', expectedOutputs: OUTPUTS },
    {
      type: 'authorize',
      as: 'authClarify',
      operationId: 'clarify',
      targetActorId: 'facilitator-actor',
      authorizationId: 'auth_clarify_e2e',
      invocationKey: 'clarify:e2e:1',
      reason: 'Share has settled -- open clarification.',
      grantedContextRefs: ['$ref:share'],
    },
    { type: 'operation', as: 'clarify', operationId: 'clarify', targetActorId: 'facilitator-actor', taskKey: 'declared-clarify-facilitator-actor', objective: 'Clarify the shared proposals.', expectedOutputs: OUTPUTS },
    rankStep('rankA', 'participant-a'),
    rankStep('rankB', 'participant-b'),
    rankStep('rankC', 'participant-c'),
  ];

  const result = await runGroupThinkingRequest(
    { cwd: tempDir, repoRoot: tempDir, runnerConfig },
    { protocolId: NOMINAL_GROUP_LITE_ID, requestObject: baseRequest({ coordinationId, writerId, steps }) },
  );

  assert.equal(result.definitionRef.id, NOMINAL_GROUP_LITE_ID);
  assert.equal(result.steps.length, 10);
  for (const step of result.steps) {
    assert.ok(['operation', 'authorize'].includes(step.type), `unexpected step type "${step.type}"`);
  }
  for (const as of ['proposeA', 'proposeB', 'proposeC', 'share', 'clarify', 'rankA', 'rankB', 'rankC']) {
    const step = result.steps.find((s) => s.as === as);
    assert.equal(step.status, 'done', `operation step "${as}" must settle "done" through the pack gate`);
  }
  assert.equal(result.steps.find((s) => s.as === 'authShare').appended, true);
  assert.equal(result.steps.find((s) => s.as === 'authClarify').appended, true);

  // ── (2) No-tally semantics, re-confirmed at the pack-gate layer ────────
  const replayed = replaySession(coordinationId, { cwd: tempDir, repoRoot: tempDir });
  assert.deepEqual(replayed.aggregations, [], 'no aggregation-validated event exists -- driving the chain through the pack gate adds no aggregate/winner computation P10.3\'s own definition did not have');

  // ── (3) The pack gate never links a contribution -- confirmed on the
  //    real, persisted event log, not merely inferred from omission. ──────
  assert.deepEqual(replayed.contributions, [], 'no contribution was ever linked -- see the file header: run.mjs\'s closed step vocabulary has no "link" step type');
  const eventTypes = readEventTypes(tempDir, coordinationId);
  assert.equal(eventTypes.filter((t) => t === 'operation-authorized').length, 2, 'exactly the two real authorize steps (share, clarify) -- no more, no fewer');
  assert.equal(eventTypes.includes('deliberation-contribution-linked'), false, 'linkSessionContribution is unreachable through the pack gate -- confirmed against the real event log');
  assert.equal(eventTypes.includes('aggregation-validated'), false);
  assert.equal(eventTypes.includes('specialist-authorized'), false);

  // ── (4) Chat-history-free replay reconstruction of the full lineage --
  //    reconstructed purely from `replayed` fields (assignment/
  //    authorization cross-references), never from this test's own local
  //    step-order memory. A real nuance found empirically while building
  //    this: `private-propose`/`private-rank` are `activation.mode:
  //    required` bindings (never driver-authorized), and schema.mjs's own
  //    `assignment-created` comment states such a dispatch emits ONLY
  //    `{assignmentId, actorId}` -- no `operationId` -- so, unlike
  //    `share`/`clarify` (driver-authorized, operationId present directly),
  //    those two phases cannot be told apart by `operationId` at all. The
  //    lineage is reconstructed instead by the SAME referential join the
  //    definition's own visibility windows encode: share's own
  //    authorization names exactly the three assignments it was granted
  //    (the propose assignments), and the remaining participant
  //    assignments are the ranks, by elimination.
  const shareAssignment = replayed.assignments.find((a) => a.operationId === 'share');
  const clarifyAssignment = replayed.assignments.find((a) => a.operationId === 'clarify');
  assert.ok(shareAssignment && clarifyAssignment, 'share and clarify are driver-authorized -- their assignment-created events carry operationId directly');
  assert.equal(shareAssignment.actorId, 'facilitator-actor');
  assert.equal(clarifyAssignment.actorId, 'facilitator-actor');

  const authorizationById = Object.fromEntries(replayed.authorizations.map((a) => [a.authorizationId, a]));
  const shareAuth = authorizationById[shareAssignment.authorizationId];
  const clarifyAuth = authorizationById[clarifyAssignment.authorizationId];

  const participantAssignments = replayed.assignments.filter((a) => a.actorId !== 'facilitator-actor');
  assert.equal(participantAssignments.length, 6, 'three private-propose + three private-rank participant assignments, no more');

  const proposeAssignmentIds = new Set(shareAuth.grantedContextRefs);
  const proposeAssignments = participantAssignments.filter((a) => proposeAssignmentIds.has(a.assignmentId));
  const rankAssignments = participantAssignments.filter((a) => !proposeAssignmentIds.has(a.assignmentId));

  assert.equal(proposeAssignments.length, 3, 'share\'s own authorization names exactly the three private-propose assignments it was granted');
  assert.deepEqual(new Set(proposeAssignments.map((a) => a.actorId)), new Set(['participant-a', 'participant-b', 'participant-c']));
  assert.equal(rankAssignments.length, 3, 'the remaining participant assignments, by elimination, are the three private-rank assignments');
  assert.deepEqual(new Set(rankAssignments.map((a) => a.actorId)), new Set(['participant-a', 'participant-b', 'participant-c']));

  assert.deepEqual(clarifyAuth.grantedContextRefs, [shareAssignment.assignmentId], 'clarify was only ever granted share\'s own assignment');
});

// ---------------------------------------------------------------------
// 2. The closed step vocabulary structurally excludes contribution
//    linking -- proven empirically against the real schema, not merely
//    argued from a static read of run.mjs/schema.mjs.

test('runGroupThinkingRequest refuses a "link" step with the real schema\'s own closed-vocabulary message -- linkSessionContribution has no step-type door through the pack gate for ANY protocol, confirmed live', async () => {
  const tempDir = mkTempDir();
  const coordinationId = 'ngl-pack-no-link-step';
  const writerId = 'p10-7-no-link-step';

  await assert.rejects(
    () =>
      runGroupThinkingRequest(
        { cwd: tempDir, repoRoot: tempDir },
        {
          protocolId: NOMINAL_GROUP_LITE_ID,
          requestObject: baseRequest({
            coordinationId,
            writerId,
            steps: [
              proposeStep('proposeA', 'participant-a'),
              { type: 'link', as: 'linkProposal', contributionId: 'contrib_x', operationRef: 'private-propose', contributionType: 'proposal', assignmentId: '$ref:proposeA' },
            ],
          }),
        },
      ),
    (err) => err instanceof StoreError && err.category === 'validation' && /steps\[1\]\.type must be "operation", "fan-out", "authorize", or "disposition"/.test(err.message),
  );
});

// ---------------------------------------------------------------------
// 3. Resume through the pack: a chain split across two
//    runGroupThinkingRequest calls against the SAME coordinationId.
//
// A GENUINE FINDING surfaced building this section, named honestly rather
// than engineered around, and since FIXED at the kernel level
// (P10-KERNEL-FIX; session-engine.mjs's `classifySessionQuorum`, gated by
// explicit user authorization after P10.6/P10.7/P10.8 independently
// converged on the identical root cause): `run.mjs` calls
// `closeSessionByQuorum` UNCONDITIONALLY at the end of EVERY request
// (P10.1.md/P10.5.md's own bypass-#5 note). `classifySessionQuorum`
// (session-engine.mjs) USED TO close a session the moment EVERY id in
// `manifest.actors[]` had AT LEAST ONE settled `assignment-created` event --
// a PER-ACTOR model, not a per-graph-node/per-operation one, taking the
// FIRST matching assignment for each actor id, never "all of that actor's
// GATING assignments across the whole graph". For Nominal-Group-Lite, the
// facilitator's FIRST operation is `share` (phase 2 of 4) and each
// participant's FIRST operation is `private-propose` (phase 1 of 4) -- so
// the instant `share` settled, EVERY declared actor already had one settled
// assignment, and the session auto-completed, two whole phases (`clarify`,
// `private-rank`) before the graph itself was done. This was a SHARED
// kernel gap in the quorum machinery itself, not a defect in this
// protocol's own definition or in the pack gate -- confirmed live against
// RFC-Review-Lite too (P10.7's own Red-Team) and against Delphi-Feedback-
// Lite (P10.8) before the user authorized fixing it directly.
// `actorGatingOperationIds` (session-engine.mjs) now requires EVERY
// `required` binding, PLUS every `driver-authorized` binding that ALSO
// declares `contextAccess.visibilityWindowRef` (exactly `share`/`clarify`'s
// own shape), to settle before an actor counts complete -- test B below now
// proves the literal "after share, before clarify" scenario SUCCEEDS,
// across three genuinely separate calls. Test A proves resume at a split
// point that never depended on the bug either way.

test('Resume through the pack gate (A): interrupting BEFORE the facilitator ever dispatches (mid private-propose) and resuming with a second runGroupThinkingRequest call correctly continues and completes the WHOLE remaining chain -- no duplicate proposal dispatch, no-tally holds at the end', async () => {
  const tempDir = mkTempDir();
  const runnerConfig = fakeRunnerConfig(tempDir);
  const coordinationId = 'ngl-pack-resume-safe';
  const writerId = 'p10-7-resume-safe';
  const engineOpts = { cwd: tempDir, repoRoot: tempDir };

  // Call 1: only two of three proposals. The facilitator has not dispatched
  // anything yet, so classifySessionQuorum still finds it (and
  // participant-c) missing -- the session stays open.
  const first = await runGroupThinkingRequest(
    { ...engineOpts, runnerConfig },
    { protocolId: NOMINAL_GROUP_LITE_ID, requestObject: baseRequest({ coordinationId, writerId, steps: [proposeStep('proposeA', 'participant-a'), proposeStep('proposeB', 'participant-b')] }) },
  );
  assert.equal(first.closed, false, 'sanity: two of four actors (participant-c, facilitator-actor) have not dispatched yet -- the session must NOT auto-close after call 1');

  // Call 2 (resume): SAME coordinationId, SAME writerId (run.mjs's own
  // resume identity gate requires this match). Completes the entire
  // remaining chain -- the third proposal, the full share/clarify pair,
  // and all three ranks -- in one call. `clarified`'s own visibility
  // window is gated on `share` having settled EARLIER IN THIS SAME CALL,
  // proving the window/gating machinery works identically whether the
  // prerequisite settled in this call or a prior one (test B's own
  // "after share, before clarify" split proves the prior-call case fails
  // for the unrelated close-timing reason documented above, not because
  // this gating machinery itself is broken).
  const secondSteps = [
    proposeStep('proposeC', 'participant-c'),
    {
      type: 'authorize',
      as: 'authShare',
      operationId: 'share',
      targetActorId: 'facilitator-actor',
      authorizationId: 'auth_share_resume_safe',
      invocationKey: 'share:resume-safe:1',
      reason: 'All three private proposals (two from call 1, one from call 2) have settled -- open the controlled share.',
      grantedContextRefs: ['$ref:proposeC'],
    },
    { type: 'operation', as: 'share', operationId: 'share', targetActorId: 'facilitator-actor', taskKey: 'declared-share-facilitator-actor', objective: 'Controlled share of the three proposals.', expectedOutputs: OUTPUTS },
    {
      type: 'authorize',
      as: 'authClarify',
      operationId: 'clarify',
      targetActorId: 'facilitator-actor',
      authorizationId: 'auth_clarify_resume_safe',
      invocationKey: 'clarify:resume-safe:1',
      reason: 'Share has settled -- open clarification.',
      grantedContextRefs: ['$ref:share'],
    },
    { type: 'operation', as: 'clarify', operationId: 'clarify', targetActorId: 'facilitator-actor', taskKey: 'declared-clarify-facilitator-actor', objective: 'Clarify the shared proposals.', expectedOutputs: OUTPUTS },
    rankStep('rankA', 'participant-a'),
    rankStep('rankB', 'participant-b'),
    rankStep('rankC', 'participant-c'),
  ];
  // Note: `authShare`'s own grantedContextRefs above only names
  // `$ref:proposeC` (this call's own new label) -- proposeA/proposeB's
  // assignmentIds live in call 1's own now-gone `labels` scope. The
  // engine's own window check (`shared` opens once ALL THREE
  // private-propose BINDINGS have settled, verified against the session's
  // real persisted state, never against an authorize step's own
  // grantedContextRefs list) does not require every source to be literally
  // named in this grant for the window itself to be open -- the same
  // structural fact P10.3's own privacy test relies on. `grantedContextRefs`
  // is the CONTEXT a driver hands the facilitator, not the window's own
  // gating input.
  const second = await runGroupThinkingRequest(
    { ...engineOpts, runnerConfig },
    { protocolId: NOMINAL_GROUP_LITE_ID, requestObject: baseRequest({ coordinationId, writerId, steps: secondSteps }) },
  );
  assert.equal(second.coordinationId, coordinationId);
  assert.equal(second.definitionRef.id, NOMINAL_GROUP_LITE_ID, 'the resumed request must still be recognized as bound to Nominal-Group-Lite -- the same protocol it was really opened with');
  for (const step of second.steps.filter((s) => s.type === 'operation')) {
    assert.equal(step.status, 'done');
  }
  assert.equal(second.closed, true, 'the full graph is now complete -- this really is the natural end of the session');

  const replayed = replaySession(coordinationId, engineOpts);
  assert.deepEqual(replayed.aggregations, [], 'no-tally semantics still holds after a resumed chain through the pack');

  // No duplicate proposal dispatch across the two calls. `private-propose`/
  // `private-rank` are `activation.mode: required` bindings whose
  // assignment-created events carry no `operationId` (see the full-chain
  // test's own comment), and this call's own `authShare` only names
  // proposeC's own assignmentId in `grantedContextRefs` (see the note
  // above) -- so, unlike the full-chain/test-B reconstructions, the
  // propose/rank split here is reconstructed from per-actor cardinality
  // directly: each of the three participants must have dispatched exactly
  // twice (propose once, rank once) across the two calls, never three or
  // more times, which is itself the "no duplicate propose" property.
  const participantAssignments = replayed.assignments.filter((a) => a.actorId !== 'facilitator-actor');
  assert.equal(participantAssignments.length, 6, 'still exactly six participant assignments total (three propose across both calls, three rank) -- no duplication');
  for (const actorId of ['participant-a', 'participant-b', 'participant-c']) {
    assert.equal(participantAssignments.filter((a) => a.actorId === actorId).length, 2, `"${actorId}" must have dispatched exactly twice (propose once, rank once) across both calls -- no duplicate propose`);
  }
});

test('P10-KERNEL-FIX: the exact "interrupt after share settles, resume before clarify" scenario now SUCCEEDS -- a genuinely separate later runGroupThinkingRequest call reaches facilitator-actor\'s remaining declared operation ("clarify") successfully, across THREE separate calls total', async () => {
  const tempDir = mkTempDir();
  const runnerConfig = fakeRunnerConfig(tempDir);
  const coordinationId = 'ngl-pack-resume-kernel-fix';
  const writerId = 'p10-kernel-fix-ngl-resume';
  const engineOpts = { cwd: tempDir, repoRoot: tempDir };

  const firstSteps = [
    proposeStep('proposeA', 'participant-a'),
    proposeStep('proposeB', 'participant-b'),
    proposeStep('proposeC', 'participant-c'),
    {
      type: 'authorize',
      as: 'authShare',
      operationId: 'share',
      targetActorId: 'facilitator-actor',
      authorizationId: 'auth_share_kernel_fix',
      invocationKey: 'share:kernel-fix:1',
      reason: 'All three private proposals have settled -- open the controlled share.',
      grantedContextRefs: ['$ref:proposeA', '$ref:proposeB', '$ref:proposeC'],
    },
    { type: 'operation', as: 'share', operationId: 'share', targetActorId: 'facilitator-actor', taskKey: 'declared-share-facilitator-actor', objective: 'Controlled share of the three proposals.', expectedOutputs: OUTPUTS },
  ];
  const first = await runGroupThinkingRequest(
    { ...engineOpts, runnerConfig },
    { protocolId: NOMINAL_GROUP_LITE_ID, requestObject: baseRequest({ coordinationId, writerId, steps: firstSteps }) },
  );

  // P10-KERNEL-FIX (session-engine.mjs's `classifySessionQuorum` /
  // `actorGatingOperationIds`): `share` and `clarify` are BOTH
  // `driver-authorized` bindings for facilitator-actor, each ALSO declaring
  // its own `contextAccess.visibilityWindowRef` -- so both now GATE
  // facilitator-actor's own completion. The session must NOT auto-close
  // here even though facilitator-actor already has a settled assignment
  // (share). BEFORE this fix, `classifySessionQuorum` counted
  // facilitator-actor complete the instant its FIRST-ever assignment
  // (share) settled, auto-closing the session two whole phases early --
  // P10.7's own Finding #2, escalated to CRITICAL by its own Red-Team after
  // it reproduced the identical root mechanism live against a different,
  // already-closed protocol (P10.6/RFC-Review-Lite).
  assert.equal(
    first.closed,
    false,
    'P10-KERNEL-FIX: the session must NOT auto-close after share settles -- facilitator-actor still owes its own gated "clarify" binding',
  );
  assert.deepEqual(
    first.quorum.missing.map((m) => m.actorId).sort(),
    ['facilitator-actor', 'participant-a', 'participant-b', 'participant-c'],
    'facilitator-actor is incomplete (owes its own gated "clarify" binding), and all three participants are ALSO incomplete (private-rank is a required binding of their own, not yet dispatched) -- nobody is falsely reported complete',
  );

  // ── Call 2: a genuinely SEPARATE, later runGroupThinkingRequest call --
  //    THE literal "interrupt after share settles, resume before clarify"
  //    scenario this test's own title names -- authorizes and dispatches
  //    "clarify" successfully. Refused outright before this fix (the
  //    session was already "completed").
  const shareId = first.steps.find((s) => s.as === 'share').assignmentId;
  const second = await runGroupThinkingRequest(
    { ...engineOpts, runnerConfig },
    {
      protocolId: NOMINAL_GROUP_LITE_ID,
      requestObject: baseRequest({
        coordinationId,
        writerId,
        steps: [
          {
            type: 'authorize',
            as: 'authClarify',
            operationId: 'clarify',
            targetActorId: 'facilitator-actor',
            authorizationId: 'auth_clarify_kernel_fix',
            invocationKey: 'clarify:kernel-fix:1',
            reason: 'Share has settled -- open clarification.',
            grantedContextRefs: [shareId],
          },
          { type: 'operation', as: 'clarify', operationId: 'clarify', targetActorId: 'facilitator-actor', taskKey: 'declared-clarify-facilitator-actor', objective: 'Clarify the shared proposals.', expectedOutputs: OUTPUTS },
        ],
      }),
    },
  );
  assert.equal(
    second.steps.find((s) => s.as === 'clarify').status,
    'done',
    'P10-KERNEL-FIX: "clarify" now dispatches successfully in a genuinely separate, later call -- refused outright before this fix (session already "completed")',
  );
  assert.equal(second.closed, false, 'the session correctly stays open -- all three participants still owe their own gated private-rank binding');
  assert.deepEqual(second.quorum.missing.map((m) => m.actorId).sort(), ['participant-a', 'participant-b', 'participant-c']);

  // ── Call 3: a THIRD, genuinely separate call finishes the graph -- all
  //    three private ranks -- and the session now closes naturally.
  const third = await runGroupThinkingRequest(
    { ...engineOpts, runnerConfig },
    { protocolId: NOMINAL_GROUP_LITE_ID, requestObject: baseRequest({ coordinationId, writerId, steps: [rankStep('rankA', 'participant-a'), rankStep('rankB', 'participant-b'), rankStep('rankC', 'participant-c')] }) },
  );
  assert.equal(third.closed, true, 'the full graph is now complete across THREE separate calls -- this really is the natural end of the session');
  assert.deepEqual(third.quorum.missing, []);

  const replayed = replaySession(coordinationId, engineOpts);
  assert.deepEqual(replayed.aggregations, [], 'no-tally semantics still holds after a resumed chain spanning three separate calls');
  assert.equal(
    replayed.assignments.filter((a) => a.actorId === 'facilitator-actor').length,
    2,
    'facilitator-actor dispatched exactly twice across the whole chain -- share (call 1), clarify (call 2) -- no duplicate dispatch of either',
  );
  for (const actorId of ['participant-a', 'participant-b', 'participant-c']) {
    assert.equal(replayed.assignments.filter((a) => a.actorId === actorId).length, 2, `"${actorId}" dispatched exactly twice (propose in call 1, rank in call 3) -- no duplication`);
  }
});

// ---------------------------------------------------------------------
// 4. P10.1 Fix Round 1 HIGH-finding fix, with Nominal-Group-Lite as the
//    REAL, already-bound protocol (P10.5.md's own test proved the
//    complementary direction: RFC-Review-Lite real-bound, Nominal-Group-
//    Lite falsely claimed).

test('runGroupThinkingRequest refuses to resume a session really opened under Nominal-Group-Lite when the caller claims a DIFFERENT real, registered protocol -- P10.1 Fix Round 1 HIGH-finding fix, with THIS protocol as the real-bound side', async () => {
  const tempDir = mkTempDir();
  const coordinationId = 'ngl-pack-resume-cross-protocol';
  const writerId = 'p10-7-resume-cross-protocol';
  const engineOpts = { cwd: tempDir, repoRoot: tempDir };

  // Opened DIRECTLY, bypassing the pack entirely, under Nominal-Group-Lite
  // -- mirrors P10.5.md's own PoC shape (opening real, outside the pack),
  // with the two protocols' roles swapped relative to that cell's own test.
  const opened = openDeclaredProtocolSession(
    { definitionId: NOMINAL_GROUP_LITE_ID, coordinationId, objective: 'Opened directly under Nominal-Group-Lite, outside the pack.', writerId },
    engineOpts,
  );
  assert.equal(opened.definitionRef.id, NOMINAL_GROUP_LITE_ID);
  const baselineEventCount = countEventLines(tempDir, coordinationId);
  assert.ok(baselineEventCount > 0);

  // Dispatch through the pack gate against the SAME coordinationId,
  // claiming RFC-Review-Lite -- a DIFFERENT real, ALSO pack-registered
  // protocol. Self-consistent by the caller's own claim
  // (protocolId === protocolRef.id, both real pack members) -- exactly the
  // shape the fix must still refuse. A `disposition` step (no
  // protocol-binding check of its own inside run.mjs), matching P10.1's and
  // P10.5's own PoC shape.
  await assert.rejects(
    () =>
      runGroupThinkingRequest(engineOpts, {
        protocolId: RFC_REVIEW_LITE_ID,
        requestObject: {
          kind: 'declared-protocol',
          objective: 'Attempt to dispatch a pack-claimed protocol against a session really bound to Nominal-Group-Lite.',
          writerId,
          coordinationId,
          protocolRef: { id: RFC_REVIEW_LITE_ID },
          steps: [{ type: 'disposition', as: 'd', targetRef: coordinationId, disposition: 'noted', rationale: 'P10.7 re-verification of P10.1 Fix Round 1, Nominal-Group-Lite as the real-bound side.' }],
        },
      }),
    (err) =>
      err instanceof StoreError &&
      err.category === 'validation' &&
      new RegExp(`already bound to protocol "${NOMINAL_GROUP_LITE_ID.replace(/\./g, '\\.')}"`).test(err.message) &&
      new RegExp(`not the explicitly selected "${RFC_REVIEW_LITE_ID.replace(/\./g, '\\.')}"`).test(err.message),
  );

  assert.equal(countEventLines(tempDir, coordinationId), baselineEventCount, 'zero new events written by the refused cross-protocol resume attempt');
});
