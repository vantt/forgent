// Phase 10 (P10.4) cell: proof for the REAL, committed, opt-in
// Delphi-Feedback-Lite protocol,
// `core/coordination-protocols/group-thinking-delphi-feedback-lite.yaml`.
//
// Shape: private round-1 proposals -> a mediated, non-contribution
// aggregate artifact -> bounded ("at most 2 rounds ever") round-2
// proposals anchored to round 1. Two independently enforced properties,
// proved by two separate negative tests:
//   - round ORDER: a round-2 proposal cannot be linked as a durable
//     contribution before "aggregate" settles (the MVP6 visibility-window
//     mechanism, same as Phase 08's deliberation-delphi-chain.yaml).
//   - round BOUND: a genuinely new round is refused by the engine's own
//     `topology.edges[].maxRounds` enforcement in `dispatchDeclaredOperation`
//     -- a real, testable ceiling, not merely the absence of a third graph
//     node. The cap is keyed by ACTOR (edge.to), not by operation id, so a
//     third invocation for the same panelist actor is refused even though
//     it targets the SAME operation id (`propose-round2`) round 2 already
//     used.
//
// Every dispatch goes through the real `dispatchDeclaredOperation` path
// (fake-executor pattern shared with
// coordination-deliberation-method-chains.test.mjs and
// coordination-declared-consult.test.mjs), every contribution through the
// real mediated `linkSessionContribution` door, and the end-to-end test
// reconstructs the whole chain from `replaySession`'s projection alone --
// no reference to any prose this file wrote (this track's own "no chat
// history, no hidden driver-only prose" discipline).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  openDeclaredProtocolSession,
  dispatchDeclaredOperation,
  linkSessionContribution,
} from '../../src/runner/coordination/session-engine.mjs';
import { replaySession } from '../../src/runner/coordination/replay.mjs';
import { CoordinationError } from '../../src/runner/coordination/schema.mjs';

const DEFINITION_ID = 'core.coordination-protocol.group-thinking-delphi-feedback-lite';

function mkTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-delphi-feedback-lite-test-'));
}

function driver() {
  return { type: 'driver', id: 'coordinator-1' };
}

/** Same fake-executor shape used across this track's coordination tests: a
 *  real Node subprocess (never a JS-level stub) that settles every
 *  not-yet-settled Run under `.fgos/assignments/` with a fixed report and a
 *  "done" result. */
function fakeRunnerConfig(tempDir) {
  const executorScript = path.join(tempDir, `fake-delphi-lite-executor-${Math.random().toString(36).slice(2)}.mjs`);
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
    modelPolicies: { claude: { lightweight: 'test-model', standard: 'test-model', analytical: 'test-model', critical: 'test-model' } },
    timeoutMs: 8000,
  };
}

function openSession(coordinationId) {
  const tempDir = mkTempDir();
  const opts = { cwd: tempDir, repoRoot: tempDir };
  openDeclaredProtocolSession({ definitionId: DEFINITION_ID, coordinationId, objective: 'Run one Delphi-Feedback-Lite panel.', writerId: 'coordinator-1' }, opts);
  return { tempDir, opts, runnerConfig: fakeRunnerConfig(tempDir) };
}

function link(coordinationId, ctx, params) {
  return linkSessionContribution(coordinationId, { linkedBy: driver(), ...params }, ctx.opts);
}

test('Delphi-Feedback-Lite: convene -> two round-1 private proposals -> mediated aggregate -> two round-2 proposals anchored to round 1 -- reconstructed from replay alone', async () => {
  const coordinationId = 'delphi-lite-e2e';
  const ctx = openSession(coordinationId);

  const convene = await dispatchDeclaredOperation(
    coordinationId,
    { operationId: 'convene', targetActorId: 'facilitator-actor', objective: 'Convene the panel.', expectedOutputs: ['agent-result.json (status, summary)'], writerId: 'coordinator-1' },
    { ...ctx.opts, runnerConfig: ctx.runnerConfig },
  );
  const conveneId = convene.assignment.assignmentId;

  const round1A = await dispatchDeclaredOperation(
    coordinationId,
    { operationId: 'propose-round1', targetActorId: 'panelist-a', fromAssignmentId: conveneId, intent: 'propose', taskKey: 'declared:propose-round1:panelist-a', objective: 'Round-1 private proposal.', expectedOutputs: ['agent-result.json (status, summary)'], writerId: 'coordinator-1' },
    { ...ctx.opts, runnerConfig: ctx.runnerConfig },
  );
  const round1B = await dispatchDeclaredOperation(
    coordinationId,
    { operationId: 'propose-round1', targetActorId: 'panelist-b', fromAssignmentId: conveneId, intent: 'propose', taskKey: 'declared:propose-round1:panelist-b', objective: 'Round-1 private proposal.', expectedOutputs: ['agent-result.json (status, summary)'], writerId: 'coordinator-1' },
    { ...ctx.opts, runnerConfig: ctx.runnerConfig },
  );
  assert.equal(round1A.resumed, false);
  assert.equal(round1B.resumed, false);

  // Actor-scope minTier proof: panelist-a's dispatch resolves tier
  // "analytical", sourced to scope "actor" (id "panelist-a") -- the
  // definition's own `propose-round1` operation template declares no
  // policy of its own, so this value can only have come from
  // spec.actors[].policy. ("analytical", not "standard": a tier exactly
  // equal to resolveAssignmentDispatchPolicy's own hardcoded default floor
  // ties its strict `>` provenance-update check and never attributes to
  // "actor", even though the VALUE still resolves correctly -- see the
  // fixture's own header comment.)
  const round1AProvenance = round1A.runResult.policy.provenance.tier;
  assert.equal(round1AProvenance.value, 'analytical');
  assert.deepEqual(round1AProvenance.source, { scope: 'actor', id: 'panelist-a' });

  const round1LinkA = link(coordinationId, ctx, { contributionId: 'delphi_lite_r1_a', type: 'proposal', assignmentId: round1A.assignment.assignmentId, roundKey: 'round-1' });
  const round1LinkB = link(coordinationId, ctx, { contributionId: 'delphi_lite_r1_b', type: 'proposal', assignmentId: round1B.assignment.assignmentId, roundKey: 'round-1' });
  assert.equal(round1LinkA.appended, true);
  assert.equal(round1LinkB.appended, true);

  // "aggregate" is a plain declared operation -- it produces the mediated,
  // non-contribution artifact this protocol is named for. Its own dispatch
  // resolves tier "critical", sourced to actor "facilitator-actor".
  const aggregate = await dispatchDeclaredOperation(
    coordinationId,
    { operationId: 'aggregate', targetActorId: 'facilitator-actor', objective: 'Produce the mediated aggregate artifact.', expectedOutputs: ['agent-result.json (status, summary)'], writerId: 'coordinator-1' },
    { ...ctx.opts, runnerConfig: ctx.runnerConfig },
  );
  const aggregateId = aggregate.assignment.assignmentId;
  assert.equal(aggregate.runResult.policy.provenance.tier.value, 'critical');
  assert.deepEqual(aggregate.runResult.policy.provenance.tier.source, { scope: 'actor', id: 'facilitator-actor' });

  const round2A = await dispatchDeclaredOperation(
    coordinationId,
    { operationId: 'propose-round2', targetActorId: 'panelist-a', fromAssignmentId: aggregateId, intent: 'propose', taskKey: 'declared:propose-round2:panelist-a', objective: 'Round-2 proposal, informed by the mediated aggregate.', expectedOutputs: ['agent-result.json (status, summary)'], writerId: 'coordinator-1' },
    { ...ctx.opts, runnerConfig: ctx.runnerConfig },
  );
  const round2B = await dispatchDeclaredOperation(
    coordinationId,
    { operationId: 'propose-round2', targetActorId: 'panelist-b', fromAssignmentId: aggregateId, intent: 'propose', taskKey: 'declared:propose-round2:panelist-b', objective: 'Round-2 proposal, informed by the mediated aggregate.', expectedOutputs: ['agent-result.json (status, summary)'], writerId: 'coordinator-1' },
    { ...ctx.opts, runnerConfig: ctx.runnerConfig },
  );
  assert.equal(round2A.resumed, false);
  assert.equal(round2B.resumed, false);
  assert.notEqual(round2A.assignment.assignmentId, round1A.assignment.assignmentId, 'round 2 must be a genuinely new Assignment, not a resume of round 1');

  const round2LinkA = link(coordinationId, ctx, {
    contributionId: 'delphi_lite_r2_a',
    type: 'proposal',
    assignmentId: round2A.assignment.assignmentId,
    roundKey: 'round-2',
    anchors: ['delphi_lite_r1_a', 'delphi_lite_r1_b'],
  });
  const round2LinkB = link(coordinationId, ctx, {
    contributionId: 'delphi_lite_r2_b',
    type: 'proposal',
    assignmentId: round2B.assignment.assignmentId,
    roundKey: 'round-2',
    anchors: ['delphi_lite_r1_a', 'delphi_lite_r1_b'],
  });
  assert.equal(round2LinkA.appended, true);
  assert.equal(round2LinkB.appended, true);

  // ── Chat-history-free replay reconstruction: everything asserted below
  //    comes from replaySession's own projection, never this test's prose.
  const replayed = replaySession(coordinationId, ctx.opts);
  const round1 = replayed.contributions.filter((c) => c.operationRef === 'propose-round1');
  const round2 = replayed.contributions.filter((c) => c.operationRef === 'propose-round2');
  assert.equal(round1.length, 2);
  assert.equal(round2.length, 2);
  for (const r2 of round2) {
    assert.deepEqual([...r2.anchors].sort(), round1.map((r) => r.contributionId).sort(), 'replay alone must show each round-2 proposal anchors BOTH round-1 proposals');
    assert.equal(r2.roundKey, 'round-2');
    assert.equal(r2.visibilityWindowRef, 'round2-open');
  }
  for (const r1 of round1) {
    assert.equal(r1.roundKey, 'round-1');
    assert.equal(r1.visibilityWindowRef, 'round1-open');
  }
  assert.equal(replayed.contributions.some((c) => c.assignmentId === aggregateId), false, 'the mediated aggregate itself is never a contribution');
  assert.equal(replayed.contributions.some((c) => c.assignmentId === conveneId), false, 'convene backs no contribution');
  assert.deepEqual(new Set(replayed.openContributionIds), new Set(['delphi_lite_r1_a', 'delphi_lite_r1_b', 'delphi_lite_r2_a', 'delphi_lite_r2_b']), 'no driver disposition was recorded, so every linked contribution stays open');

  // Every Assignment reached panelist-a/panelist-b via the SAME declared
  // edge (facilitator-actor -> panelist-*), across BOTH operation ids --
  // exactly 2 assignment-created events per panelist actor, matching
  // maxRounds: 2 on that shared edge.
  const roundEventsA = replayed.assignments.filter((a) => a.actorId === 'panelist-a');
  const roundEventsB = replayed.assignments.filter((a) => a.actorId === 'panelist-b');
  assert.equal(roundEventsA.length, 2);
  assert.equal(roundEventsB.length, 2);
});

test('Delphi-Feedback-Lite: round order -- a round-2 proposal dispatched (and even Assignment-settled) before "aggregate" cannot be linked as a durable contribution', async () => {
  const coordinationId = 'delphi-lite-order';
  const ctx = openSession(coordinationId);

  const convene = await dispatchDeclaredOperation(
    coordinationId,
    { operationId: 'convene', targetActorId: 'facilitator-actor', objective: 'Convene the panel.', expectedOutputs: ['agent-result.json (status, summary)'], writerId: 'coordinator-1' },
    { ...ctx.opts, runnerConfig: ctx.runnerConfig },
  );
  const conveneId = convene.assignment.assignmentId;

  await dispatchDeclaredOperation(
    coordinationId,
    { operationId: 'propose-round1', targetActorId: 'panelist-a', fromAssignmentId: conveneId, intent: 'propose', taskKey: 'declared:propose-round1:panelist-a', objective: 'Round-1 private proposal.', expectedOutputs: ['agent-result.json (status, summary)'], writerId: 'coordinator-1' },
    { ...ctx.opts, runnerConfig: ctx.runnerConfig },
  );
  await dispatchDeclaredOperation(
    coordinationId,
    { operationId: 'propose-round1', targetActorId: 'panelist-b', fromAssignmentId: conveneId, intent: 'propose', taskKey: 'declared:propose-round1:panelist-b', objective: 'Round-1 private proposal.', expectedOutputs: ['agent-result.json (status, summary)'], writerId: 'coordinator-1' },
    { ...ctx.opts, runnerConfig: ctx.runnerConfig },
  );

  // "aggregate" has NOT been dispatched yet. The declared edge does not
  // care -- fromAssignmentId only needs to belong to the edge's "from"
  // actor (facilitator-actor), and "convene" qualifies -- so this dispatch
  // (still within maxRounds: 2 on the shared edge) is structurally
  // reachable and settles normally. Only the LINK, gated by "round2-open"
  // (opensAfter: [aggregate]), is refused.
  const round2A = await dispatchDeclaredOperation(
    coordinationId,
    { operationId: 'propose-round2', targetActorId: 'panelist-a', fromAssignmentId: conveneId, intent: 'propose', taskKey: 'declared:propose-round2:panelist-a', objective: 'Round-2 proposal, dispatched early.', expectedOutputs: ['agent-result.json (status, summary)'], writerId: 'coordinator-1' },
    { ...ctx.opts, runnerConfig: ctx.runnerConfig },
  );
  assert.equal(round2A.resumed, false, 'the early round-2 dispatch itself must succeed -- only linking it as a contribution is refused');

  assert.throws(
    () => link(coordinationId, ctx, { contributionId: 'delphi_lite_early_r2', type: 'proposal', assignmentId: round2A.assignment.assignmentId, roundKey: 'round-2' }),
    (err) => err instanceof CoordinationError && /visibility window "round2-open" to be open/.test(err.message),
    'round 2 cannot be linked as a durable contribution before the mediated aggregate operation has settled',
  );
  assert.equal(replaySession(coordinationId, ctx.opts).contributions.length, 0, 'the refused link must write nothing');
});

test("Delphi-Feedback-Lite: round bound -- a third invocation for the same panelist actor is refused by the declared edge's maxRounds: 2 cap, a real enforced ceiling keyed by actor, not by operation id", async () => {
  const coordinationId = 'delphi-lite-bound';
  const ctx = openSession(coordinationId);

  const convene = await dispatchDeclaredOperation(
    coordinationId,
    { operationId: 'convene', targetActorId: 'facilitator-actor', objective: 'Convene the panel.', expectedOutputs: ['agent-result.json (status, summary)'], writerId: 'coordinator-1' },
    { ...ctx.opts, runnerConfig: ctx.runnerConfig },
  );
  const conveneId = convene.assignment.assignmentId;

  await dispatchDeclaredOperation(
    coordinationId,
    { operationId: 'propose-round1', targetActorId: 'panelist-a', fromAssignmentId: conveneId, intent: 'propose', taskKey: 'declared:propose-round1:panelist-a', objective: 'Round-1 private proposal.', expectedOutputs: ['agent-result.json (status, summary)'], writerId: 'coordinator-1' },
    { ...ctx.opts, runnerConfig: ctx.runnerConfig },
  );

  const aggregate = await dispatchDeclaredOperation(
    coordinationId,
    { operationId: 'aggregate', targetActorId: 'facilitator-actor', objective: 'Produce the mediated aggregate artifact.', expectedOutputs: ['agent-result.json (status, summary)'], writerId: 'coordinator-1' },
    { ...ctx.opts, runnerConfig: ctx.runnerConfig },
  );
  const aggregateId = aggregate.assignment.assignmentId;

  const round2A = await dispatchDeclaredOperation(
    coordinationId,
    { operationId: 'propose-round2', targetActorId: 'panelist-a', fromAssignmentId: aggregateId, intent: 'propose', taskKey: 'declared:propose-round2:panelist-a', objective: 'Round-2 proposal.', expectedOutputs: ['agent-result.json (status, summary)'], writerId: 'coordinator-1' },
    { ...ctx.opts, runnerConfig: ctx.runnerConfig },
  );
  assert.equal(round2A.resumed, false);

  // A THIRD invocation for the same panelist actor -- a genuinely new,
  // never-before-used taskKey, real fromAssignmentId, targeting the SAME
  // operation id round 2 already used (propose-round2) -- is refused by the
  // engine's own edge/maxRounds accounting, which counts Assignments by
  // ACTOR (edge.to), not by operation id: 2 rounds are already used for
  // panelist-a via this edge, so a third is rejected regardless of which
  // declared operation it targets. Not merely undispatchable because no
  // round-3 graph node exists -- there IS a real dispatch path to
  // propose-round2 a second time, and the engine itself refuses it.
  await assert.rejects(
    dispatchDeclaredOperation(
      coordinationId,
      { operationId: 'propose-round2', targetActorId: 'panelist-a', fromAssignmentId: aggregateId, intent: 'propose', taskKey: 'declared:propose-round2:panelist-a:attempt-2', objective: 'A third round, must be refused.', expectedOutputs: ['agent-result.json (status, summary)'], writerId: 'coordinator-1' },
      { ...ctx.opts, runnerConfig: ctx.runnerConfig },
    ),
    (err) => err instanceof CoordinationError && /allows at most 2 round\(s\)/.test(err.message),
  );

  // A rejected third round must dispatch zero additional runs for that
  // actor -- the refusal happens before any Assignment/Run is created.
  const replayed = replaySession(coordinationId, ctx.opts);
  const panelistAAssignments = replayed.assignments.filter((a) => a.actorId === 'panelist-a');
  assert.equal(panelistAAssignments.length, 2, 'exactly round 1 and round 2 -- the refused third invocation created no Assignment');
});
