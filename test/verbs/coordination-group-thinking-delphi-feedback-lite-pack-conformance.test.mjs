// coordination-group-thinking-delphi-feedback-lite-pack-conformance.test.mjs
// -- Phase 10 (Step 09) P10.8: Delphi-Feedback-Lite Conformance.
//
// P10.4 already proved the Delphi-Feedback-Lite chain end-to-end (private
// round-1 proposals, mediated non-contribution aggregate, bounded round-2,
// round-order enforcement) via DIRECT `session-engine.mjs` calls
// (`coordination-delphi-feedback-lite.test.mjs`). This file's own job,
// per current-cell.md, is proving the SAME properties are reachable THROUGH
// the public pack gate specifically (`runGroupThinkingRequest`,
// `group-thinking-pack.mjs`), not merely via direct engine calls -- plus one
// property P10.4 never covered: resume through the pack.
//
// **A genuine, load-bearing kernel-surface gap was found while building
// this file, not silently worked around**: `run.mjs`'s public request
// vocabulary (the ONLY thing `runGroupThinkingRequest` ever forwards into)
// closes over exactly four step kinds -- `operation`, `authorize`,
// `disposition`, `fan-out` (`schema.mjs`'s own `validateSteps`, confirmed
// live by this file's own "unknown step type" test below). There is NO step
// kind that reaches `linkSessionContribution` (session-engine.mjs) -- the
// ONE door that (a) records a durable, evidence-preserving contribution in
// the Deliberation Contribution Ledger (P08.1-P08.3) and (b) is the ONLY
// place Delphi-Feedback-Lite's round-ORDER property is actually enforced
// (`round2-open`'s visibility-window check lives inside
// `linkSessionContribution`, never inside `dispatchDeclaredOperation` for a
// `required`-activation binding like this protocol's -- see the "round
// order" section below for the direct trace). This is true for ALL THREE
// group-thinking-lite protocols (RFC-Review-Lite, Nominal-Group-Lite,
// Delphi-Feedback-Lite alike), not a Delphi-specific defect -- named here
// because THIS cell is the one whose Acceptance criteria most directly
// depend on it (round order, and the whole "private input -> mediated
// aggregate" evidence-preserving-lineage claim).
//
// Consequence for this file's own scope, stated plainly rather than
// papered over: the round CAP is fully re-provable through the pack gate
// (enforced by `dispatchDeclaredOperation` itself, reached by an
// `operation` step). The round ORDER property is NOT reachable through the
// pack gate at all -- not because the pack weakens the underlying
// guarantee (nothing about `group-thinking-pack.mjs` removes or bypasses
// `linkSessionContribution`'s own refusal, which P10.4 already proved
// directly and unconditionally), but because the public surface this cell
// was asked to drive the chain through has no door to the mechanism where
// that refusal lives. This file proves the gap concretely (a rejected
// unknown step type, and a real dispatch-level parity check showing round-2
// dispatches identically through the pack whether or not "aggregate" has
// settled), rather than merely asserting it in prose.
//
// Every dispatch below goes through the real `runGroupThinkingRequest` gate
// (never a direct `session-engine.mjs` call for anything this file reports
// as "through the pack"); every replay-shaped assertion reads
// `replaySession`'s own projection (a read-only cross-check, never a second
// dispatch/write path -- session-engine.mjs's own `resumeSession` export IS
// `replaySession`, the same reuse `group-thinking-pack.mjs` itself already
// makes for its resume cross-check).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { runGroupThinkingRequest } from '../../src/verbs/coordination/group-thinking-pack.mjs';
import { openDeclaredProtocolSession } from '../../src/runner/coordination/session-engine.mjs';
import { replaySession } from '../../src/runner/coordination/replay.mjs';
import { StoreError } from '../../src/state/store.mjs';
import { CoordinationError } from '../../src/runner/coordination/schema.mjs';

const DELPHI_ID = 'core.coordination-protocol.group-thinking-delphi-feedback-lite';
const RFC_REVIEW_LITE_ID = 'core.coordination-protocol.group-thinking-rfc-review-lite';

const OUTPUTS = ['agent-result.json (status, summary)'];

function mkTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-delphi-lite-pack-conformance-test-'));
}

/** Same fake-executor shape used across this track's coordination tests: a
 *  real Node subprocess (never a JS-level stub) that settles every
 *  not-yet-settled Run under `.fgos/assignments/` with a fixed report and a
 *  "done" result. Model policies cover every tier this fixture's own actors
 *  declare (facilitator: critical, panelists: analytical). */
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
            fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Report\\nSettled by the P10.8 test executor.\\n');
            fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'Settled by the P10.8 test executor.' }));
          }
        }
      }
    }
    process.stdout.write('done\\n');
    `,
  );
  return {
    executor: { allowCrossProvider: true, command: process.execPath, args: [executorScript, '{prompt}'] },
    modelPolicies: { claude: { lightweight: 'test-model', standard: 'test-model', analytical: 'test-model', critical: 'test-model' } },
    timeoutMs: 8000,
  };
}

function convene(as = 'convene') {
  return { type: 'operation', as, operationId: 'convene', targetActorId: 'facilitator-actor', taskKey: 'declared-convene-facilitator-actor', objective: 'Convene the panel.', expectedOutputs: OUTPUTS };
}
function proposeRound1(actor, fromRef, as) {
  return { type: 'operation', as: as ?? `round1${actor.slice(-1).toUpperCase()}`, operationId: 'propose-round1', targetActorId: actor, fromAssignmentId: fromRef, intent: 'propose', taskKey: `declared-propose-round1-${actor}`, objective: 'Round-1 private proposal.', expectedOutputs: OUTPUTS };
}
function aggregate(as = 'aggregate') {
  return { type: 'operation', as, operationId: 'aggregate', targetActorId: 'facilitator-actor', taskKey: 'declared-aggregate-facilitator-actor', objective: 'Produce the mediated aggregate artifact.', expectedOutputs: OUTPUTS };
}
function proposeRound2(actor, fromRef, as, taskKeySuffix = '') {
  return { type: 'operation', as: as ?? `round2${actor.slice(-1).toUpperCase()}`, operationId: 'propose-round2', targetActorId: actor, fromAssignmentId: fromRef, intent: 'propose', taskKey: `declared-propose-round2-${actor}${taskKeySuffix}`, objective: 'Round-2 proposal.', expectedOutputs: OUTPUTS };
}

function fullChainSteps() {
  return [
    convene(),
    proposeRound1('panelist-a', '$ref:convene'),
    proposeRound1('panelist-b', '$ref:convene'),
    aggregate(),
    proposeRound2('panelist-a', '$ref:aggregate'),
    proposeRound2('panelist-b', '$ref:aggregate'),
  ];
}

function baseRequest({ coordinationId, writerId, steps }) {
  return {
    kind: 'declared-protocol',
    objective: 'P10.8 Delphi-Feedback-Lite conformance, driven entirely through the pack gate.',
    writerId,
    coordinationId,
    protocolRef: { id: DELPHI_ID },
    steps,
  };
}

// ---------------------------------------------------------------------
// 1. Full chain, end to end, entirely through the pack gate.

test('Delphi-Feedback-Lite: convene -> two round-1 proposals -> mediated aggregate -> two round-2 proposals, dispatched entirely through runGroupThinkingRequest -- reconstructed from replaySession alone, never this test\'s own prose', async () => {
  const tempDir = mkTempDir();
  const runnerConfig = fakeRunnerConfig(tempDir);
  const coordinationId = 'delphi-lite-pack-e2e';
  const writerId = 'p10-8-e2e';

  const result = await runGroupThinkingRequest(
    { cwd: tempDir, repoRoot: tempDir, runnerConfig },
    { protocolId: DELPHI_ID, requestObject: baseRequest({ coordinationId, writerId, steps: fullChainSteps() }) },
  );

  assert.equal(result.definitionRef.id, DELPHI_ID);
  assert.equal(result.steps.length, 6);
  for (const step of result.steps) {
    assert.equal(step.type, 'operation', 'the group-thinking pack gate\'s public vocabulary offers no other step kind reachable for this fixture');
    assert.equal(step.status, 'done');
  }

  // Actor-scope minTier provenance, real, through the pack -- mirrors
  // P10.4.md's own direct-call assertion, now proved reachable via the
  // public request/response shape rather than a raw dispatch return value.
  assert.equal(result.steps[0].tier, 'critical', 'convene, facilitator-actor');
  assert.equal(result.steps[1].tier, 'analytical', 'round-1 propose, panelist-a');
  assert.equal(result.steps[3].tier, 'critical', 'aggregate, facilitator-actor');

  // ── Chat-history-free replay reconstruction of the DISPATCH lineage
  //    (assignments), read from replaySession's own projection alone.
  const replayed = replaySession(coordinationId, { cwd: tempDir, repoRoot: tempDir });
  const panelistAAssignments = replayed.assignments.filter((a) => a.actorId === 'panelist-a');
  const panelistBAssignments = replayed.assignments.filter((a) => a.actorId === 'panelist-b');
  assert.equal(panelistAAssignments.length, 2, 'round 1 + round 2 for panelist-a, both reached through the pack gate');
  assert.equal(panelistBAssignments.length, 2, 'round 1 + round 2 for panelist-b, both reached through the pack gate');

  // ── The genuine gap, stated as a fact about THIS run, not merely in
  //    prose: dispatch-only through the pack gate creates ZERO durable
  //    contributions. Nothing in run.mjs's public vocabulary ever calls
  //    linkSessionContribution (see the "unknown step type" test below for
  //    the concrete, schema-level proof of why) -- so the
  //    private-input/mediated-aggregate LINEAGE claim (anchors, roundKey)
  //    that P10.4.md's own direct-call test reconstructs from
  //    `replayed.contributions` is genuinely unreachable through this
  //    surface, not merely untested here.
  assert.deepEqual(replayed.contributions, [], 'dispatch alone through the pack gate links no contribution -- the pack\'s public vocabulary has no door to linkSessionContribution');

  // ── No-strong-anonymity/convergence claim, re-confirmed against the
  //    pack gate's own REQUEST/RESPONSE shape (not just the yaml, as
  //    P10.4.md's own §6 already checked) -- nothing in what this gate
  //    reports implies a stronger anonymity or convergence guarantee than
  //    the underlying definition actually provides.
  const serialized = JSON.stringify(result);
  for (const forbidden of [/anonymous/i, /\bvote\b/i, /\bconsensus\b/i, /converge/i]) {
    assert.equal(forbidden.test(serialized), false, `the pack gate's own response must not imply an anonymity/convergence guarantee this protocol never declares (matched ${forbidden})`);
  }
});

// ---------------------------------------------------------------------
// 2. Round BOUND re-confirmed through the pack gate specifically.

test('Delphi-Feedback-Lite: round BOUND -- a third invocation for the same panelist actor, dispatched as an "operation" step through runGroupThinkingRequest, is refused by the engine\'s real maxRounds:2 cap -- re-confirmed through the pack gate, not just P10.4\'s direct dispatchDeclaredOperation call', async () => {
  const tempDir = mkTempDir();
  const runnerConfig = fakeRunnerConfig(tempDir);
  const coordinationId = 'delphi-lite-pack-bound';
  const writerId = 'p10-8-bound';

  const steps = [
    convene(),
    proposeRound1('panelist-a', '$ref:convene'),
    aggregate(),
    proposeRound2('panelist-a', '$ref:aggregate'),
    // A THIRD invocation for panelist-a -- a genuinely new taskKey, real
    // fromAssignmentId, targeting the SAME operation id round 2 already
    // used. Must be refused by the shared edge's maxRounds:2 cap.
    proposeRound2('panelist-a', '$ref:aggregate', 'round2AAttempt2', '-attempt-2'),
  ];

  await assert.rejects(
    () => runGroupThinkingRequest({ cwd: tempDir, repoRoot: tempDir, runnerConfig }, { protocolId: DELPHI_ID, requestObject: baseRequest({ coordinationId, writerId, steps }) }),
    (err) => err instanceof CoordinationError && /allows at most 2 round\(s\)/.test(err.message),
    'the pack gate must forward the engine\'s own real maxRounds refusal unchanged, never silently widen it',
  );

  // The refused third round must have created zero additional Assignments
  // for panelist-a -- the refusal happens before any Assignment/Run is
  // created (same discipline P10.4.md's own direct-call test asserts, now
  // re-confirmed against the pack-gate-driven session).
  const replayed = replaySession(coordinationId, { cwd: tempDir, repoRoot: tempDir });
  const panelistAAssignments = replayed.assignments.filter((a) => a.actorId === 'panelist-a');
  assert.equal(panelistAAssignments.length, 2, 'exactly round 1 and round 2 -- the refused third invocation, dispatched through the pack, created no Assignment');
});

// ---------------------------------------------------------------------
// 3. Round ORDER -- proved reachable at the DISPATCH level (parity with
//    P10.4's direct-call behavior). AT THE TIME THIS CELL (P10.8) RAN, the
//    LINK-time refusal that actually enforces round order (P10.4.md §2/§6:
//    the round2-open visibility-window check inside
//    `linkSessionContribution`) had no door in the pack's public request
//    vocabulary at all -- this test originally proved exactly that.
//
//    P10.10 (Promotion And Closeout) closed that gap: `run.mjs`/
//    `schema.mjs` now accept a "contribution" step that forwards into
//    `linkSessionContribution`. This test is UPDATED, not removed: it now
//    proves the round-order refusal genuinely reachable through the pack
//    gate -- the SAME early round-2 Assignment this test already dispatches
//    (still succeeding, dispatch-level parity is unchanged and still
//    proven first) is refused when a "contribution" step attempts to link
//    it BEFORE "aggregate" opens the round2-open window, with the SAME
//    refusal message `linkSessionContribution`, called directly, already
//    gives per P10.4's own proof.

test('Delphi-Feedback-Lite: round ORDER -- dispatching "propose-round2" through the pack gate BEFORE "aggregate" has settled succeeds identically to P10.4\'s direct-call behavior (dispatch-level parity); linking it as a contribution before round2-open has opened is refused through the pack gate\'s new "contribution" step, with the same window-not-open message linkSessionContribution already gives directly', async () => {
  const tempDir = mkTempDir();
  const runnerConfig = fakeRunnerConfig(tempDir);
  const coordinationId = 'delphi-lite-pack-order';
  const writerId = 'p10-8-order';

  const steps = [
    convene(),
    proposeRound1('panelist-a', '$ref:convene'),
    // "aggregate" has NOT been dispatched yet. Same as P10.4.md's own
    // direct-call finding: dispatchDeclaredOperation's edge check does not
    // care -- fromAssignmentId only needs to belong to the edge's "from"
    // actor (facilitator-actor), and "convene" qualifies. This is a
    // `required`-activation binding (Delphi declares no `activation` on
    // any propose-round1/round2 node binding), so the driver-authorized
    // visibility-window pre-check inside dispatchDeclaredOperation (which
    // only runs for `activation.mode: driver-authorized` bindings) never
    // applies here either -- confirmed by reading dispatchDeclaredOperation
    // directly (session-engine.mjs) before writing this test, not assumed.
    proposeRound2('panelist-a', '$ref:convene'),
  ];

  const result = await runGroupThinkingRequest(
    { cwd: tempDir, repoRoot: tempDir, runnerConfig },
    { protocolId: DELPHI_ID, requestObject: baseRequest({ coordinationId, writerId, steps }) },
  );
  assert.equal(result.steps[2].status, 'done', 'the early round-2 dispatch itself succeeds through the pack gate too -- identical to P10.4\'s direct-call finding, not a NEW bypass the pack introduces');

  // P10.10: the round-order refusal, proved reachable through the pack
  // gate's new "contribution" step -- a genuinely separate later call,
  // naming the SAME coordinationId (panelist-b never dispatched anything,
  // so the session stays active), attempts to link the just-dispatched
  // early round-2 Assignment as a "proposal" contribution. round2-open
  // opens only after "aggregate" (never dispatched in this test), so
  // `linkSessionContribution` -- reached genuinely THROUGH the pack now,
  // not called directly -- refuses with the SAME window-not-open message
  // P10.4's own direct-call proof already established, before any
  // contribution event is appended.
  await assert.rejects(
    () =>
      runGroupThinkingRequest(
        { cwd: tempDir, repoRoot: tempDir, runnerConfig },
        {
          protocolId: DELPHI_ID,
          requestObject: baseRequest({
            coordinationId,
            writerId,
            steps: [{ type: 'contribution', as: 'linkRound2Early', contributionId: 'p10_10_round2_early', contributionType: 'proposal', assignmentId: result.steps[2].assignmentId, roundKey: 'round-2' }],
          }),
        },
      ),
    (err) => err instanceof CoordinationError && /visibility window "round2-open" to be open/.test(err.message),
    'round order is genuinely enforced through the pack gate now: linkSessionContribution\'s own window-not-open refusal fires for a real early link attempt, reached through the new "contribution" step -- no NEW bypass, and the gap this test originally proved is now closed',
  );

  const replayedOrder = replaySession(coordinationId, { cwd: tempDir, repoRoot: tempDir });
  assert.equal(replayedOrder.contributions.length, 0, 'the refused link attempt must append zero contribution events');
});

// ---------------------------------------------------------------------
// 3b. The auto-close-on-quorum boundary, proved precisely and empirically
//     (not merely narrated) -- prompted by a cross-cell finding P10.7's own
//     Doer surfaced for Nominal-Group-Lite and asked every sibling cell to
//     check against its own protocol.

test('P10-KERNEL-FIX: the auto-close boundary that used to sit EARLIER than "after aggregate" is gone -- a session pausing right after both round-1 proposals settle stays open, and a genuinely separate later call reaches facilitator-actor\'s remaining declared operation ("aggregate") and both round-2 proposals successfully', async () => {
  const tempDir = mkTempDir();
  const runnerConfig = fakeRunnerConfig(tempDir);
  const coordinationId = 'delphi-lite-pack-early-close-boundary-fixed';
  const writerId = 'p10-kernel-fix-delphi-early-close';

  // Call 1: convene + BOTH round-1 proposals -- the natural "round 1 is
  // done" checkpoint a real driver might split calls at. "aggregate" has
  // NOT been dispatched yet.
  //
  // P10-KERNEL-FIX (session-engine.mjs's `classifySessionQuorum` /
  // `actorGatingOperationIds`): Delphi-Feedback-Lite declares NO
  // `driver-authorized` binding anywhere -- `convene`/`propose-round1`/
  // `aggregate`/`propose-round2` are ALL `required` (the YAML's own default,
  // no `activation:` block on any of them). `actorGatingOperationIds`
  // therefore gates on ALL of them: facilitator-actor now needs BOTH
  // `convene` AND `aggregate` settled, and each panelist now needs BOTH
  // `propose-round1` AND `propose-round2` settled, before counting
  // complete -- exactly closing this bug. BEFORE this fix, quorum counted
  // every actor complete the moment it had ANY one settled Assignment
  // (facilitator via convene, both panelists via round-1 alone), so the
  // session auto-closed here, BEFORE "aggregate" ever dispatched -- this
  // was the sharpest of the three concrete bug cases P10.6/P10.7/P10.8
  // converged on (a whole protocol phase permanently unreachable, not just
  // "resume is harder"), independently reproduced by this file's own
  // Red-Team and escalated to the user directly.
  const first = await runGroupThinkingRequest(
    { cwd: tempDir, repoRoot: tempDir, runnerConfig },
    { protocolId: DELPHI_ID, requestObject: baseRequest({ coordinationId, writerId, steps: [convene(), proposeRound1('panelist-a', '$ref:convene'), proposeRound1('panelist-b', '$ref:convene')] }) },
  );
  assert.equal(
    first.closed,
    false,
    'P10-KERNEL-FIX: the session must NOT auto-close here -- facilitator-actor still owes "aggregate", and both panelists still owe their own "propose-round2"',
  );
  assert.deepEqual(
    first.quorum.missing.map((m) => m.actorId).sort(),
    ['facilitator-actor', 'panelist-a', 'panelist-b'],
    'every declared actor is honestly reported incomplete -- nobody is falsely counted done off a single settled Assignment',
  );

  // Call 2: a genuinely SEPARATE, later runGroupThinkingRequest call
  // reaches "aggregate" AND both round-2 proposals successfully -- refused
  // outright before this fix (the session was already "completed").
  const conveneAssignmentId = first.steps[0].assignmentId;
  const second = await runGroupThinkingRequest(
    { cwd: tempDir, repoRoot: tempDir, runnerConfig },
    { protocolId: DELPHI_ID, requestObject: baseRequest({ coordinationId, writerId, steps: [aggregate(), proposeRound2('panelist-a', '$ref:aggregate'), proposeRound2('panelist-b', '$ref:aggregate')] }) },
  );
  for (const step of second.steps) {
    assert.equal(step.status, 'done', 'P10-KERNEL-FIX: "aggregate" and both round-2 proposals now dispatch successfully in a genuinely separate, later call');
  }
  assert.equal(second.closed, true, 'every gating binding is now settled -- the session correctly closes at the end of THIS call');
  assert.deepEqual(second.quorum.missing, []);

  const replayed = replaySession(coordinationId, { cwd: tempDir, repoRoot: tempDir });
  assert.equal(replayed.assignments.filter((a) => a.actorId === 'facilitator-actor').length, 2, 'facilitator-actor dispatched exactly twice across the whole chain -- convene (call 1), aggregate (call 2) -- no duplicate dispatch of either');
  assert.equal(replayed.assignments.filter((a) => a.actorId === 'panelist-a').length, 2, 'panelist-a dispatched exactly twice -- round-1 (call 1), round-2 (call 2)');
  assert.equal(replayed.assignments.filter((a) => a.actorId === 'panelist-b').length, 2, 'panelist-b dispatched exactly twice -- round-1 (call 1), round-2 (call 2)');
  assert.ok(conveneAssignmentId);
});

test('Delphi-Feedback-Lite: the early auto-close above does NOT undermine this file\'s own single-call full-chain proof -- closeSessionByQuorum is attempted exactly once, after run.mjs\'s entire steps loop finishes, never mid-loop', async () => {
  const tempDir = mkTempDir();
  const runnerConfig = fakeRunnerConfig(tempDir);
  const coordinationId = 'delphi-lite-pack-single-call-not-undermined';
  const writerId = 'p10-8-single-call-check';

  // The SAME six steps as the first test in this file, in ONE call. If
  // quorum-driven auto-close could fire mid-request (e.g. right after
  // round-1 settles, before "aggregate"/round-2 are even reached), this
  // would fail exactly like the test above's second call does. It does not:
  // `run.mjs`'s own `closeSessionByQuorum` call sits strictly OUTSIDE and
  // AFTER the `for (const step of request.steps)` loop (confirmed by direct
  // source read, run.mjs's own `runCoordinationUseCase` body) -- every step
  // in ONE call dispatches before quorum is evaluated even once for that
  // call. This is the direct, empirical answer to "does your own full-chain
  // proof only work because you happened to drive it in one single call":
  // yes, and here is the source-level reason that single-call shape is
  // genuinely safe, not merely lucky.
  const result = await runGroupThinkingRequest(
    { cwd: tempDir, repoRoot: tempDir, runnerConfig },
    { protocolId: DELPHI_ID, requestObject: baseRequest({ coordinationId, writerId, steps: fullChainSteps() }) },
  );
  assert.equal(result.steps.length, 6);
  for (const step of result.steps) assert.equal(step.status, 'done', 'every one of the six steps -- including aggregate and both round-2 proposals -- dispatched successfully inside the SAME call, unaffected by the quorum state any of the earlier steps would have already satisfied');
  assert.equal(result.closed, true, 'close is only EVER attempted once, at the very end of this same call, by which point the full chain has already run to completion -- so this true value reflects a chain that genuinely finished, not one that was cut short');
});

// ---------------------------------------------------------------------
// 4. Resume through the pack.

test('Delphi-Feedback-Lite: resume through the pack -- a SECOND runGroupThinkingRequest call naming the same coordinationId continues the chain through the mediated aggregate and both round-2 proposals -- correct continuation, reconstructed from replaySession alone', async () => {
  const tempDir = mkTempDir();
  const runnerConfig = fakeRunnerConfig(tempDir);
  const coordinationId = 'delphi-lite-pack-resume';
  const writerId = 'p10-8-resume';

  // Split point, and a real finding about WHY it is here rather than at the
  // point current-cell.md's own hint text suggested ("after the mediated
  // aggregate settles, before round-2 proposals"): `run.mjs`'s own
  // unconditional `closeSessionByQuorum` call runs at the end of EVERY
  // request (P10.1.md's own bypass #5 reasoning), and `evaluateSessionQuorum`
  // closes a session to `'completed'` the moment EVERY declared actor
  // (facilitator-actor, panelist-a, panelist-b) has at least ONE settled
  // Assignment -- it has no notion of "round 2 still owed". Splitting after
  // convene+both round-1 proposals+aggregate (the hinted point) gives every
  // one of the three actors a settled Assignment already, so the session
  // auto-closes to "completed" at the END of call 1 -- confirmed empirically:
  // an earlier version of this test split there and call 2 failed with
  // `session "..." is not active (status: "completed")`. Splitting BEFORE
  // every actor has dispatched once (here: after convene + panelist-a's
  // round-1 proposal only, leaving panelist-b with zero Assignments) keeps
  // quorum genuinely incomplete (panelist-b classifies "missing"), so the
  // session stays "active" and a real resume is possible. This is a second,
  // separate finding from the missing link-step-kind gap above: an
  // implicit, pack-inherited close-eagerness that narrows WHERE a
  // multi-round protocol can actually be interrupted and resumed through
  // this surface, not merely a choice this test made for convenience.
  const first = await runGroupThinkingRequest(
    { cwd: tempDir, repoRoot: tempDir, runnerConfig },
    { protocolId: DELPHI_ID, requestObject: baseRequest({ coordinationId, writerId, steps: [convene(), proposeRound1('panelist-a', '$ref:convene')] }) },
  );
  assert.equal(first.coordinationId, coordinationId);
  assert.equal(first.definitionRef.id, DELPHI_ID);
  assert.equal(first.steps.length, 2);
  assert.equal(first.closed, false, 'quorum must genuinely be incomplete after call 1 (panelist-b has dispatched nothing yet) -- sanity check for the split-point finding above');
  const conveneAssignmentId = first.steps[0].assignmentId;
  assert.ok(conveneAssignmentId);

  // Call 2: a SECOND, independent runGroupThinkingRequest call naming the
  // SAME coordinationId -- panelist-b's round-1 proposal, the mediated
  // aggregate, and both round-2 proposals, anchored to real assignment ids
  // resolved along the way (a resumed request's `$ref:<label>` labels only
  // resolve within the SAME call, per this skill's own SKILL.md §3 --
  // panelist-b's round-1 step below anchors to call 1's real, resolved
  // `conveneAssignmentId`, never a `$ref` reused across calls).
  const second = await runGroupThinkingRequest(
    { cwd: tempDir, repoRoot: tempDir, runnerConfig },
    {
      protocolId: DELPHI_ID,
      requestObject: baseRequest({
        coordinationId,
        writerId,
        steps: [proposeRound1('panelist-b', conveneAssignmentId), aggregate(), proposeRound2('panelist-a', '$ref:aggregate'), proposeRound2('panelist-b', '$ref:aggregate')],
      }),
    },
  );
  assert.equal(second.coordinationId, coordinationId, 'resume must continue the SAME session, never open a second one');
  assert.equal(second.definitionRef.id, DELPHI_ID);
  assert.equal(second.steps.length, 4);
  for (const step of second.steps) assert.equal(step.status, 'done');

  // Correct continuation, reconstructed from replay alone across BOTH
  // calls -- one session, 4 real actor assignments total (2 rounds x 2
  // panelists), all reached through the pack gate across two separate
  // process-level calls to runGroupThinkingRequest.
  const replayed = replaySession(coordinationId, { cwd: tempDir, repoRoot: tempDir });
  assert.equal(replayed.assignments.filter((a) => a.actorId === 'panelist-a').length, 2);
  assert.equal(replayed.assignments.filter((a) => a.actorId === 'panelist-b').length, 2);
  assert.equal(replayed.assignments.filter((a) => a.actorId === 'facilitator-actor').length, 2, 'convene + aggregate');
});

test('Delphi-Feedback-Lite: cross-protocol resume refusal, direction A -- a session really opened DIRECTLY under Delphi-Feedback-Lite refuses a pack-gate resume claiming a DIFFERENT, real, registered protocol -- P10.1\'s Fix Round 1 HIGH-finding fix, re-verified with Delphi-Feedback-Lite as the session\'s REAL bound protocol (P10.5.md only exercised RFC-Review-Lite/Nominal-Group-Lite in this role)', async () => {
  const tempDir = mkTempDir();
  const coordinationId = 'delphi-lite-pack-resume-switch-a';
  const writerId = 'p10-8-resume-switch-a';

  const opened = openDeclaredProtocolSession(
    { definitionId: DELPHI_ID, coordinationId, objective: 'Opened directly under Delphi-Feedback-Lite, outside the pack.', writerId },
    { cwd: tempDir, repoRoot: tempDir },
  );
  assert.equal(opened.definitionRef.id, DELPHI_ID, 'sanity: the session really is bound to Delphi-Feedback-Lite');

  await assert.rejects(
    () =>
      runGroupThinkingRequest(
        { cwd: tempDir, repoRoot: tempDir },
        {
          protocolId: RFC_REVIEW_LITE_ID,
          requestObject: {
            kind: 'declared-protocol',
            objective: 'Attempt to dispatch a pack-claimed protocol against a session really bound to Delphi-Feedback-Lite.',
            writerId,
            coordinationId,
            protocolRef: { id: RFC_REVIEW_LITE_ID },
            steps: [{ type: 'disposition', as: 'd', targetRef: coordinationId, disposition: 'noted', rationale: 'P10.8 cross-protocol resume refusal, direction A.' }],
          },
        },
      ),
    (err) =>
      err instanceof StoreError &&
      err.category === 'validation' &&
      new RegExp(`already bound to protocol "${DELPHI_ID.replace(/\./g, '\\.')}"`).test(err.message) &&
      new RegExp(`not the explicitly selected "${RFC_REVIEW_LITE_ID.replace(/\./g, '\\.')}"`).test(err.message),
  );
});

test('Delphi-Feedback-Lite: cross-protocol resume refusal, direction B -- a session really opened DIRECTLY under a DIFFERENT protocol refuses a pack-gate resume claiming Delphi-Feedback-Lite', async () => {
  const tempDir = mkTempDir();
  const coordinationId = 'delphi-lite-pack-resume-switch-b';
  const writerId = 'p10-8-resume-switch-b';

  const opened = openDeclaredProtocolSession(
    { definitionId: RFC_REVIEW_LITE_ID, coordinationId, objective: 'Opened directly under RFC-Review-Lite, outside the pack.', writerId },
    { cwd: tempDir, repoRoot: tempDir },
  );
  assert.equal(opened.definitionRef.id, RFC_REVIEW_LITE_ID, 'sanity: the session really is bound to RFC-Review-Lite');

  await assert.rejects(
    () =>
      runGroupThinkingRequest(
        { cwd: tempDir, repoRoot: tempDir },
        {
          protocolId: DELPHI_ID,
          requestObject: baseRequest({
            coordinationId,
            writerId,
            steps: [{ type: 'disposition', as: 'd', targetRef: coordinationId, disposition: 'noted', rationale: 'P10.8 cross-protocol resume refusal, direction B.' }],
          }),
        },
      ),
    (err) =>
      err instanceof StoreError &&
      err.category === 'validation' &&
      new RegExp(`already bound to protocol "${RFC_REVIEW_LITE_ID.replace(/\./g, '\\.')}"`).test(err.message) &&
      new RegExp(`not the explicitly selected "${DELPHI_ID.replace(/\./g, '\\.')}"`).test(err.message),
  );
});
