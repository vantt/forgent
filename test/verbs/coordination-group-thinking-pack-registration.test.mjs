// coordination-group-thinking-pack-registration.test.mjs -- Phase 10
// (Step 09) P10.5: Integration And Usability Proof, run against the NOW
// POPULATED `core/protocol-packs/group-thinking.json` (P10.1 shipped it
// empty by design; this cell registers all three group-thinking-lite
// definitions into it through one writer -- the registry edit itself,
// verified here, never re-derived).
//
// What this file proves, and only this (P10.1.md's own suite already
// covers the pack's structural behavior against a synthetic empty/partial
// pack -- this file extends it against the real, now-registered pack, it
// does not re-derive that proof):
//
// 1. Registration is correct: the real, committed pack lists exactly the
//    three group-thinking-lite protocols, each resolvable through
//    `resolvePackProtocol` with no version drift.
// 2. CLI/headless request-path parity for a real registered protocol: the
//    SAME RFC-Review-Lite request dispatched through `runGroupThinkingRequest`
//    (the skill's own "CLI-equivalent" invocation pattern -- see the Design
//    Notes in P10.5.md for why there is no separate `bin/fgos.mjs`
//    subcommand to compare against) and through `runCoordinationHeadless`
//    (`src/runner/coordination/headless-adapter.mjs`, R4's real headless
//    entry point) produces byte-identical resulting session state (even
//    `assignmentId`, since both paths derive it deterministically from
//    `writerId` + dispatch order, never from `coordinationId`).
// 3. P10.1's Fix Round 1 HIGH-finding fix (the resume-path protocol
//    cross-check against `manifest.definitionRef.id`) re-verified against
//    TWO REAL, registered protocols -- P10.1's own PoC used a synthetic
//    non-pack protocol because no group-thinking-lite definition existed
//    yet at that cell's close time; this is the real-world shape the fix
//    actually has to hold against now that one exists.
// 4. Bypasses #2 (bypass grants) / #3 (validate its own aggregate) / #4
//    (authorize a specialist) re-confirmed against a REAL registered
//    protocol's real, persisted event log -- not merely re-reasoned from
//    `run.mjs`'s unchanged step-type vocabulary (P10.1.md Section 5 already
//    did that structurally; this adds an empirical check against real data).
//    Bypass #5 (close a session directly) is not separately re-tested here:
//    nothing about registering real protocols changes `run.mjs`'s single,
//    unconditional `closeSessionByQuorum` call (P10.1.md Section 5, #5),
//    and every dispatch test in this file and P10.1's own suite exercises
//    that exact automatic-close path already.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  loadProtocolPack,
  resolvePackProtocol,
  runGroupThinkingRequest,
} from '../../src/verbs/coordination/group-thinking-pack.mjs';
import { runCoordinationHeadless } from '../../src/runner/coordination/headless-adapter.mjs';
import { openDeclaredProtocolSession } from '../../src/runner/coordination/session-engine.mjs';
import { StoreError } from '../../src/state/store.mjs';
import { buildMasterLoopRequest, MASTER_LOOP_PROTOCOL_ID } from '../../src/verbs/coordination/launch-master-loop.mjs';

const RFC_REVIEW_LITE_ID = 'core.coordination-protocol.group-thinking-rfc-review-lite';
const NOMINAL_GROUP_LITE_ID = 'core.coordination-protocol.group-thinking-nominal-group-lite';
const DELPHI_FEEDBACK_LITE_ID = 'core.coordination-protocol.group-thinking-delphi-feedback-lite';
const MASTER_COORDINATION_LOOP_ID = 'core.coordination-protocol.standalone-master-coordination-loop';

const OUTPUTS = ['agent-result.json (status, summary)'];

function mkTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-group-thinking-pack-registration-test-'));
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

/** Same fake-executor shape as
 *  test/runner/coordination-group-thinking-rfc-review-lite.test.mjs's own
 *  `fakeRunnerConfig` (P10.2) -- a real Node subprocess, never a JS-level
 *  stub, that settles every not-yet-settled Run under `.fgos/assignments/`
 *  with a fixed report and a "done" result. Passed via `ctx.runnerConfig`
 *  (not a `.fgos/config.json` file) specifically because it carries a
 *  `critical` tier entry -- RFC-Review-Lite's objector actors declare
 *  `policy.minTier: critical`, exactly as P10.2's own proof does. */
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
            fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Report\\nSettled by the P10.5 test executor.\\n');
            fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'Settled by the P10.5 test executor.' }));
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

// ---------------------------------------------------------------------
// 1. Registration correctness -- the real, committed pack, not a synthetic
//    fixture (no `packPath` override anywhere in this section).

test('all three group-thinking-lite protocols are registered in the real, committed pack, alongside standalone-master-coordination-loop (Step 09 Phase 02 R1) and no other entry', () => {
  const pack = loadProtocolPack();
  const registeredIds = new Set(pack.members.map((m) => m.id));
  assert.deepEqual(
    registeredIds,
    new Set([RFC_REVIEW_LITE_ID, NOMINAL_GROUP_LITE_ID, DELPHI_FEEDBACK_LITE_ID, MASTER_COORDINATION_LOOP_ID]),
    'the real pack must list exactly RFC-Review-Lite, Nominal-Group-Lite, Delphi-Feedback-Lite, and standalone-master-coordination-loop -- no more, no fewer',
  );
  assert.equal(pack.members.length, 4, 'no duplicate member entries');
});

test('resolvePackProtocol resolves each of the three real, registered protocols against the real pack, with no version drift -- not just refusing correctly against an empty pack (P10.1\'s own proof)', () => {
  for (const id of [RFC_REVIEW_LITE_ID, NOMINAL_GROUP_LITE_ID, DELPHI_FEEDBACK_LITE_ID]) {
    const resolved = resolvePackProtocol(id);
    assert.equal(resolved.id, id);
    assert.equal(resolved.definition.metadata.id, id);
    assert.equal(
      resolved.version,
      resolved.definition.metadata.version,
      `the pack-pinned version for "${id}" must not have drifted from the real, committed FlowDefinition`,
    );
    assert.equal(resolved.definition.spec.profile.kind, 'CoordinationProtocol');
  }
});

// ---------------------------------------------------------------------
// 2. CLI/headless request-path parity for a real registered protocol.

function rfcReviewOpeningSteps() {
  return [
    {
      type: 'operation',
      as: 'convene',
      operationId: 'convene',
      targetActorId: 'coordinator-actor',
      taskKey: 'declared-convene-coordinator-actor',
      objective: 'Open the RFC-Review-Lite round.',
      expectedOutputs: OUTPUTS,
    },
    {
      type: 'operation',
      as: 'propose',
      operationId: 'propose',
      targetActorId: 'proposer-actor',
      taskKey: 'declared-propose-proposer-actor',
      objective: 'Propose the change under review.',
      expectedOutputs: OUTPUTS,
    },
  ];
}

test('the SAME RFC-Review-Lite request dispatches to structurally identical session state through runGroupThinkingRequest (the skill\'s own CLI-equivalent invocation path) and runCoordinationHeadless (headless-adapter.mjs) -- CLI/headless request-path parity for a real registered protocol', async () => {
  const cliDir = mkTempDir();
  const headlessDir = mkTempDir();
  const cliRunnerConfig = fakeRunnerConfig(cliDir);
  const headlessRunnerConfig = fakeRunnerConfig(headlessDir);

  const buildRequest = (coordinationId) => ({
    kind: 'declared-protocol',
    objective: 'Prove CLI/headless request-path parity for RFC-Review-Lite.',
    writerId: 'p10-5-parity-test',
    coordinationId,
    protocolRef: { id: RFC_REVIEW_LITE_ID },
    steps: rfcReviewOpeningSteps(),
  });

  // "CLI-equivalent" path: runGroupThinkingRequest -- the ONE function
  // core/skills/fgos-group-thinking/SKILL.md's own step-4 `node -e
  // "import(...)"` invocation calls (this repo's established convention,
  // matching fgos-routing/SKILL.md, for a verb with no dedicated
  // bin/fgos.mjs subcommand -- see P10.1.md's own Design Notes, "No new CLI
  // verb"). This is the real "how an interactive/CLI-style caller reaches
  // group-thinking" path in this codebase today.
  const cliResult = await runGroupThinkingRequest(
    { cwd: cliDir, repoRoot: cliDir, runnerConfig: cliRunnerConfig },
    { protocolId: RFC_REVIEW_LITE_ID, requestObject: buildRequest('coord_p10_5_parity_cli') },
  );

  // Headless path: runCoordinationHeadless (src/runner/coordination/
  // headless-adapter.mjs) -- R4's real headless entry point, called DIRECTLY
  // here (no pack gate in front of it) with the IDENTICAL request shape.
  // This is deliberate, not an oversight: the pack gate (group-thinking-pack.mjs)
  // adds nothing to what actually executes but a membership/identity check
  // BEFORE forwarding -- once a request clears that gate it reaches the
  // exact same `runCoordinationUseCase` (run.mjs) door
  // `runCoordinationHeadless` already calls directly (both modules import it
  // from the identical file, `src/verbs/coordination/run.mjs`; confirmed by
  // reading both import lists -- P10.1.md Section 1's own table). So the
  // real parity question this test answers is: does the pack gate's own
  // forwarding step introduce ANY divergence in what executes? This proves
  // it does not.
  const headlessResult = await runCoordinationHeadless(buildRequest('coord_p10_5_parity_headless'), {
    ctx: { cwd: headlessDir, repoRoot: headlessDir, runnerConfig: headlessRunnerConfig },
  });

  assert.equal(cliResult.kind, headlessResult.kind);
  assert.deepEqual(cliResult.definitionRef, headlessResult.definitionRef);
  assert.deepEqual(cliResult.steps, headlessResult.steps, 'both paths must produce byte-identical step results, including assignmentId (see the note below)');
  assert.equal(cliResult.closed, headlessResult.closed);
  assert.equal(cliResult.status, headlessResult.status);
  assert.deepEqual(cliResult.quorum, headlessResult.quorum);

  // assignmentId is real, not merely excluded from the comparison above --
  // confirmed present on both. It is derived from `writerId` plus a
  // per-session dispatch sequence number (never from `coordinationId` or a
  // random id), so the two INDEPENDENT temp-dir sessions above -- same
  // writerId, same step order -- legitimately produce the SAME assignmentId
  // string in each; that identical id lives in two disjoint session stores
  // (`cliDir`/`headlessDir`), so this is not a collision, it is one more
  // confirmation that both paths drive the identical deterministic naming
  // scheme, not merely a coincidentally-matching shape.
  assert.ok(cliResult.steps[0].assignmentId && headlessResult.steps[0].assignmentId);
  assert.equal(cliResult.steps[0].assignmentId, headlessResult.steps[0].assignmentId);
});

// ---------------------------------------------------------------------
// 3. P10.1's Fix Round 1 HIGH-finding fix (resume-path protocol
//    cross-check), re-verified against two REAL, registered protocols.

test('runGroupThinkingRequest refuses to resume a session really opened under a DIFFERENT, real, registered group-thinking protocol -- P10.1 Fix Round 1 HIGH-finding fix re-verified against real, resumable sessions, not just P10.1\'s original synthetic non-pack PoC', async () => {
  const tempDir = mkTempDir();
  const coordinationId = 'coord_p10_5_resume_real_protocol_switch';
  const writerId = 'p10-5-resume-switch-test';

  // Opened DIRECTLY, bypassing the pack entirely, under RFC-Review-Lite -- a
  // REAL, now pack-registered protocol. (P10.1's own PoC could only use a
  // synthetic non-pack protocol, because no group-thinking-lite definition
  // existed yet at that cell's close time; this is the real-world shape the
  // fix actually has to hold against now that one does.)
  const opened = openDeclaredProtocolSession(
    { definitionId: RFC_REVIEW_LITE_ID, coordinationId, objective: 'Opened directly under RFC-Review-Lite, outside the pack.', writerId },
    { cwd: tempDir, repoRoot: tempDir },
  );
  assert.equal(opened.definitionRef.id, RFC_REVIEW_LITE_ID, 'sanity: the session really is bound to RFC-Review-Lite');
  const baselineEventCount = countEventLines(tempDir, coordinationId);
  assert.ok(baselineEventCount > 0, 'sanity: opening the session really wrote events');

  // Dispatch through the pack gate against the SAME coordinationId, claiming
  // Nominal-Group-Lite -- a DIFFERENT real, ALSO pack-registered protocol.
  // Self-consistent by the caller's own claim (protocolId === protocolRef.id,
  // both real pack members) -- exactly the shape the fix must still refuse.
  // A `disposition` step, matching P10.1's own PoC shape, since disposition
  // has no protocol-binding check of its own inside run.mjs.
  await assert.rejects(
    () =>
      runGroupThinkingRequest(
        { cwd: tempDir, repoRoot: tempDir },
        {
          protocolId: NOMINAL_GROUP_LITE_ID,
          requestObject: {
            kind: 'declared-protocol',
            objective: 'Attempt to dispatch a pack-claimed protocol against a session really bound to a different, real, ALSO pack-registered protocol.',
            writerId,
            coordinationId,
            protocolRef: { id: NOMINAL_GROUP_LITE_ID },
            steps: [{ type: 'disposition', as: 'd', targetRef: coordinationId, disposition: 'noted', rationale: 'P10.5 re-verification of P10.1 Fix Round 1, against two real registered protocols.' }],
          },
        },
      ),
    (err) =>
      err instanceof StoreError &&
      err.category === 'validation' &&
      new RegExp(`already bound to protocol "${RFC_REVIEW_LITE_ID.replace(/\./g, '\\.')}"`).test(err.message) &&
      new RegExp(`not the explicitly selected "${NOMINAL_GROUP_LITE_ID.replace(/\./g, '\\.')}"`).test(err.message),
  );

  assert.equal(
    countEventLines(tempDir, coordinationId),
    baselineEventCount,
    'zero new events written by the refused cross-protocol resume attempt -- refuse before any mutation',
  );
});

test('runGroupThinkingRequest resuming an existing session under the SAME real protocol it was really opened with still succeeds -- the resume cross-check does not false-positive against legitimate same-protocol resume for a real registered protocol', async () => {
  const tempDir = mkTempDir();
  const runnerConfig = fakeRunnerConfig(tempDir);
  const coordinationId = 'coord_p10_5_resume_real_protocol_match';
  const writerId = 'p10-5-resume-match-test';

  const first = await runGroupThinkingRequest(
    { cwd: tempDir, repoRoot: tempDir, runnerConfig },
    {
      protocolId: RFC_REVIEW_LITE_ID,
      requestObject: {
        kind: 'declared-protocol',
        objective: 'Open under RFC-Review-Lite, first step only.',
        writerId,
        coordinationId,
        protocolRef: { id: RFC_REVIEW_LITE_ID },
        steps: [rfcReviewOpeningSteps()[0]],
      },
    },
  );
  assert.equal(first.definitionRef.id, RFC_REVIEW_LITE_ID);

  const second = await runGroupThinkingRequest(
    { cwd: tempDir, repoRoot: tempDir, runnerConfig },
    {
      protocolId: RFC_REVIEW_LITE_ID,
      requestObject: {
        kind: 'declared-protocol',
        objective: 'Resume under the same real protocol.',
        writerId,
        coordinationId,
        protocolRef: { id: RFC_REVIEW_LITE_ID },
        steps: [rfcReviewOpeningSteps()[1]],
      },
    },
  );
  assert.equal(second.coordinationId, coordinationId);
  assert.equal(second.definitionRef.id, RFC_REVIEW_LITE_ID);
});

// ---------------------------------------------------------------------
// 4. Bypasses #2/#3/#4 re-confirmed against a real registered protocol's
//    real, persisted event log.

test('a full RFC-Review-Lite chain (including an authorize step) dispatched entirely through the pack gate never writes an aggregation-validated or specialist-authorized event, and every reported step type is one of the four run.mjs exposes -- bypasses #2/#3/#4 re-confirmed against real data, not just P10.1\'s structural reasoning', async () => {
  const tempDir = mkTempDir();
  const runnerConfig = fakeRunnerConfig(tempDir);
  const coordinationId = 'coord_p10_5_rfc_full_chain';
  const writerId = 'p10-5-full-chain-test';

  const request = {
    kind: 'declared-protocol',
    objective: 'Full RFC-Review-Lite round through the pack gate.',
    writerId,
    coordinationId,
    protocolRef: { id: RFC_REVIEW_LITE_ID },
    steps: [
      { type: 'operation', as: 'convene', operationId: 'convene', targetActorId: 'coordinator-actor', taskKey: 'declared-convene-coordinator-actor', objective: 'Convene.', expectedOutputs: OUTPUTS },
      { type: 'operation', as: 'propose', operationId: 'propose', targetActorId: 'proposer-actor', taskKey: 'declared-propose-proposer-actor', objective: 'Propose.', expectedOutputs: OUTPUTS },
      { type: 'operation', as: 'objectA', operationId: 'object', targetActorId: 'objector-a-actor', taskKey: 'declared-object-objector-a-actor', objective: 'Object A.', expectedOutputs: OUTPUTS },
      { type: 'operation', as: 'objectB', operationId: 'object', targetActorId: 'objector-b-actor', taskKey: 'declared-object-objector-b-actor', objective: 'Object B.', expectedOutputs: OUTPUTS },
      {
        type: 'authorize',
        as: 'authRespond',
        operationId: 'respond',
        targetActorId: 'proposer-actor',
        authorizationId: 'auth_p10_5_respond',
        invocationKey: 'p10-5-respond:1',
        reason: 'Reveal both independent objections for a driver-authorized response.',
        grantedContextRefs: ['$ref:objectA', '$ref:objectB'],
      },
      { type: 'operation', as: 'respond', operationId: 'respond', targetActorId: 'proposer-actor', taskKey: 'declared-respond-proposer-actor', objective: 'Respond.', expectedOutputs: OUTPUTS },
    ],
  };

  const result = await runGroupThinkingRequest(
    { cwd: tempDir, repoRoot: tempDir, runnerConfig },
    { protocolId: RFC_REVIEW_LITE_ID, requestObject: request },
  );

  assert.equal(result.steps.length, 6);
  for (const step of result.steps) {
    assert.ok(
      ['operation', 'authorize', 'disposition', 'fan-out'].includes(step.type),
      `unexpected step type "${step.type}" -- run.mjs's request vocabulary should be closed to exactly these four kinds`,
    );
  }
  assert.equal(result.steps[4].type, 'authorize');
  assert.equal(result.steps[4].appended, true, 'the authorize step must have really reached the mediated grant door (bypass #2), not merely echoed a no-op');
  assert.equal(result.steps[5].status, 'done', 'the driver-authorized respond operation only succeeds because the authorize step really recorded a live grant this gate never bypassed');

  const eventTypes = readEventTypes(tempDir, coordinationId);
  assert.ok(eventTypes.includes('operation-authorized'), 'the real grant door really wrote its own event -- bypass #2 (bypass grants) confirmed against real, persisted data');
  assert.equal(eventTypes.includes('aggregation-validated'), false, 'bypass #3 (validate its own aggregate) -- no such event exists in this session\'s real log');
  assert.equal(eventTypes.includes('specialist-authorized'), false, 'bypass #4 (authorize a specialist) -- no such event exists in this session\'s real log');
});

// ---------------------------------------------------------------------
// Step 09 Phase 02 R1/Tests First #5-#6: `standalone-master-coordination-loop`
// registered as the pack's fourth member, dispatchable through the SAME
// gate the three group-thinking-lite protocols above already use.

test('standalone-master-coordination-loop is registered in the real, committed pack, resolvable with no version drift', () => {
  const pack = loadProtocolPack();
  const registeredIds = new Set(pack.members.map((m) => m.id));
  assert.ok(registeredIds.has(MASTER_COORDINATION_LOOP_ID), 'the real pack must list standalone-master-coordination-loop as a member');
  assert.equal(pack.members.length, 4, 'exactly the three group-thinking-lite protocols plus standalone-master-coordination-loop -- no forgotten fifth entry');

  const resolved = resolvePackProtocol(MASTER_COORDINATION_LOOP_ID);
  assert.equal(resolved.id, MASTER_COORDINATION_LOOP_ID);
  assert.equal(resolved.definition.metadata.id, MASTER_COORDINATION_LOOP_ID);
  assert.equal(resolved.version, resolved.definition.metadata.version, 'the pack-pinned version must not have drifted from the real, committed FlowDefinition');
  assert.equal(resolved.definition.spec.profile.kind, 'CoordinationProtocol');
});

test('a request naming standalone-master-coordination-loop dispatches successfully through runGroupThinkingRequest -- the SAME gate the three group-thinking-lite protocols already use -- proving the registration is real, not just a JSON edit that looks right', async () => {
  const tempDir = mkTempDir();
  const planPath = path.join(tempDir, 'plan.md');
  fs.writeFileSync(planPath, '# Plan\nProve the pack registration is real.\n');

  const runnerConfig = {
    executor: { allowCrossProvider: true, command: process.execPath, args: [path.join(tempDir, 'fake-executor.mjs'), '{prompt}'] },
    modelPolicies: { claude: { lightweight: 'test-model', standard: 'test-model', analytical: 'test-model' } },
    timeoutMs: 8000,
  };
  fs.writeFileSync(
    path.join(tempDir, 'fake-executor.mjs'),
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
            fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Report\\nSettled by the P02.1 registration test executor.\\n');
            fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'Settled by the P02.1 registration test executor.' }));
          }
        }
      }
    }
    process.stdout.write('done\\n');
    `,
  );

  const requestObject = buildMasterLoopRequest({ cwd: tempDir }, { planPath, objective: 'Prove pack registration is real.', writerId: 'p02-1-pack-registration-test' });
  assert.equal(requestObject.protocolRef.id, MASTER_LOOP_PROTOCOL_ID);
  assert.equal(MASTER_LOOP_PROTOCOL_ID, MASTER_COORDINATION_LOOP_ID, 'launch-master-loop.mjs\'s own protocol id constant must name the SAME fixture this pack member registers');

  const result = await runGroupThinkingRequest(
    { cwd: tempDir, repoRoot: tempDir, runnerConfig },
    { protocolId: MASTER_COORDINATION_LOOP_ID, requestObject },
  );

  assert.equal(result.kind, 'declared-protocol');
  assert.equal(result.definitionRef.id, MASTER_COORDINATION_LOOP_ID);
  assert.deepEqual(result.steps.map((s) => s.as), ['produce', 'review', 'red-team']);
  assert.ok(result.steps.every((s) => s.status === 'done'), 'every required first-pass step must have really dispatched and settled through the real engine');
});
