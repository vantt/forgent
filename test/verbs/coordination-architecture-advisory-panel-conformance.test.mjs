// coordination-architecture-advisory-panel-conformance.test.mjs -- Phase 03
// (Architecture Advisory Panel track), cell P03.2: conformance proof for
// `core.coordination-protocol.architecture-advisory-panel-v1`
// (core/coordination-protocols/architecture-advisory-panel-v1.yaml), through
// the real public pack gate (`runGroupThinkingRequest`,
// src/verbs/coordination/group-thinking-pack.mjs) wherever that surface
// reaches the capability under test -- the same "prove it through the real
// dispatch path, not just at the kernel level in isolation" posture
// `coordination-group-thinking-rfc-review-lite-pack-conformance.test.mjs`
// already established for its own protocol. Two capabilities have no pack
// step-vocabulary channel at all (named explicitly in the FlowDefinition's
// own header comment, not discovered here): specialist-slot authorization
// (`authorizeSpecialistSlot`) and `mutation:"mutating"` forwarding -- neither
// is exercised by this protocol, so only the former needs a direct-engine
// fallback below.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { runGroupThinkingRequest } from '../../src/verbs/coordination/group-thinking-pack.mjs';
import { runCoordinationUseCase } from '../../src/verbs/coordination/run.mjs';
import {
  openDeclaredProtocolSession,
  authorizeSpecialistSlot,
  authorizeDeclaredOperation,
  dispatchDeclaredOperation,
} from '../../src/runner/coordination/session-engine.mjs';
import { replaySession } from '../../src/runner/coordination/replay.mjs';
import { CoordinationError } from '../../src/runner/coordination/schema.mjs';
import { StoreError } from '../../src/state/store.mjs';

const PANEL_ID = 'core.coordination-protocol.architecture-advisory-panel-v1';

const OUTPUTS = ['agent-result.json (status, summary)'];

function mkTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-aap-v1-conformance-'));
}

function eventsPath(tempDir, coordinationId) {
  return path.join(tempDir, '.fgos', 'coordination', 'sessions', coordinationId, 'events.jsonl');
}

function countEventLines(tempDir, coordinationId) {
  const p = eventsPath(tempDir, coordinationId);
  if (!fs.existsSync(p)) return 0;
  return fs.readFileSync(p, 'utf8').split('\n').filter((line) => line.trim() !== '').length;
}

/** Two REGISTERED executors, provider families `family-a`/`family-b`, with
 *  `family-a` mapping "analytical" and "critical" to genuinely DIFFERENT
 *  model strings -- the fixture this suite's own heterogeneous-actor-binding
 *  case needs so a tier assertion is real (per phase-03's own text: "a tier
 *  assertion counts only when the selected executor's model policy maps
 *  that tier to a distinct model"). Same registered-executor shape
 *  `coordination-nominal-group-lite.test.mjs`'s own `fakeRunnerConfig`
 *  uses, not invented for this file. */
function writeExecutorScript(tempDir, label) {
  const executorScript = path.join(tempDir, `fake-aap-executor-${label}-${Math.random().toString(36).slice(2)}.mjs`);
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
            fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Report\\nSettled by ${label}.\\n');
            fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'Settled by ${label}.' }));
          }
        }
      }
    }
    process.stdout.write('done\\n');
    `,
  );
  return executorScript;
}

function fakeRunnerConfig(tempDir) {
  const scriptA = writeExecutorScript(tempDir, 'family-a');
  const scriptB = writeExecutorScript(tempDir, 'family-b');
  return {
    executor: { allowCrossProvider: true, command: process.execPath, args: [scriptA, '{prompt}'] },
    executors: {
      'exec-family-a': {
        kind: 'agent',
        providerModel: 'family-a',
        allowCrossProvider: true,
        invocations: [{ via: 'cli', adapter: 'cli-spawn', command: process.execPath, args: [scriptA, '{prompt}'] }],
      },
      'exec-family-b': {
        kind: 'agent',
        providerModel: 'family-b',
        allowCrossProvider: true,
        invocations: [{ via: 'cli', adapter: 'cli-spawn', command: process.execPath, args: [scriptB, '{prompt}'] }],
      },
    },
    modelPolicies: {
      claude: { standard: 'test-model', analytical: 'test-model', critical: 'test-model' },
      'family-a': { standard: 'model-a-standard', analytical: 'model-a-analytical', critical: 'model-a-critical' },
      'family-b': { standard: 'model-b-standard', analytical: 'model-b-analytical', critical: 'model-b-critical' },
    },
    timeoutMs: 8000,
  };
}

// Deliberately no explicit `taskKey`: every operation id in this
// FlowDefinition binds to exactly one static actor (or, for the specialist
// slot, is exercised via a direct engine call elsewhere), so the engine's
// own default derivation (`declared:${operationId}`, plus a per-
// authorization `:auth:<authorizationId>` suffix for a driver-authorized
// binding) is already unique per invocation -- a caller-supplied constant
// taskKey would instead make every reopen invocation collide (see the
// over-cap reopen test's own history for why this matters).
function opStep(as, operationId, targetActorId, overrides = {}) {
  return {
    type: 'operation',
    as,
    operationId,
    targetActorId,
    objective: `${operationId} pass for ${targetActorId}, dispatched through the pack gate.`,
    expectedOutputs: OUTPUTS,
    ...overrides,
  };
}

function authorizeStep(as, operationId, targetActorId, { authorizationId, invocationKey, reason, grantedContextRefs = [] }) {
  return {
    type: 'authorize',
    as,
    operationId,
    targetActorId,
    authorizationId,
    invocationKey,
    reason,
    grantedContextRefs,
  };
}

function contributionStep(as, overrides = {}) {
  return { type: 'contribution', as, roundKey: 'round-1', ...overrides };
}

function humanTurnStep(overrides = {}) {
  return {
    type: 'human-turn',
    as: 'personTurn1',
    turnId: 'turn_1',
    turnOrdinal: 1,
    channel: 'claude-code-chat',
    artifactRef: 'human/1-person.md',
    externalRef: 'claude-code-transcript:sess-1:uuid-1',
    attributedTo: { type: 'person', id: 'the-user' },
    ...overrides,
  };
}

function assignmentIdFor(result, as) {
  const step = result.steps.find((s) => s.as === as);
  assert.ok(step, `expected a step result labeled "${as}"`);
  assert.ok(step.assignmentId, `expected step "${as}" to carry an assignmentId`);
  return step.assignmentId;
}

async function run(ctx, coordinationId, writerId, steps, extra = {}) {
  return runGroupThinkingRequest(ctx, {
    protocolId: PANEL_ID,
    requestObject: {
      kind: 'declared-protocol',
      objective: 'Architecture Advisory Panel V1 conformance.',
      writerId,
      coordinationId,
      protocolRef: { id: PANEL_ID },
      steps,
      ...extra,
    },
  });
}

// ── Full happy path: independent framing, controlled reveal into critique,
//    gated synthesis, red-team, explanation, a real human turn, a bounded
//    reopen, and the driver's own explicit close-dialogue -- reconstructed
//    from replaySession alone, across SEVEN separate runGroupThinkingRequest
//    calls (crash/replay + park/resume: nothing here assumes one continuous
//    process). ────────────────────────────────────────────────────────────
test('Architecture Advisory Panel V1: full chain across seven separate calls -- independent shaping, gated critique/synthesis/red-team/explanation, a real human turn, a bounded reopen, and driver-controlled close', async () => {
  const tempDir = mkTempDir();
  const runnerConfig = fakeRunnerConfig(tempDir);
  const ctx = { cwd: tempDir, repoRoot: tempDir, runnerConfig };
  const coordinationId = 'aap_full_chain';
  const writerId = 'aap-driver';

  // Call 1: independent framing (lead advisor interpretation, blind to the
  // investigator's evidence -- neither op names the other as a contextRef)
  // plus the three isolated Phase-5 shapers. `aggregateBounds.maxRounds` is
  // raised at open time: this full chain dispatches 12 real Assignments,
  // above the default session-wide cap of 10.
  const call1 = await run(
    ctx,
    coordinationId,
    writerId,
    [
      opStep('interpret', 'interpret-request', 'lead-advisor-actor'),
      opStep('investigate', 'investigate-context', 'context-investigator-actor'),
      opStep('shapeSystem', 'shape-system-proposal', 'system-shaper-actor'),
      contributionStep('linkSystem', { contributionId: 'aap_proposal_system', contributionType: 'proposal', assignmentId: '$ref:shapeSystem' }),
      opStep('shapeAlt', 'shape-alternative-proposal', 'alternative-shaper-actor'),
      contributionStep('linkAlt', { contributionId: 'aap_proposal_alt', contributionType: 'proposal', assignmentId: '$ref:shapeAlt' }),
      opStep('shapeConstraint', 'shape-constraint-proposal', 'constraint-advocate-actor'),
      contributionStep('linkConstraint', { contributionId: 'aap_proposal_constraint', contributionType: 'proposal', assignmentId: '$ref:shapeConstraint' }),
    ],
    { aggregateBounds: { maxRounds: 20 } },
  );
  assert.equal(call1.closed, false, 'quorum cannot be met with critique/synthesis/red-team/explanation/close-dialogue all still owed');
  const interpretId = assignmentIdFor(call1, 'interpret');
  const investigateId = assignmentIdFor(call1, 'investigate');
  const shapeSystemId = assignmentIdFor(call1, 'shapeSystem');
  const shapeAltId = assignmentIdFor(call1, 'shapeAlt');
  const shapeConstraintId = assignmentIdFor(call1, 'shapeConstraint');

  // Call 2 (a genuinely separate later call -- park/resume): both
  // driver-authorized Phase-6 bindings, now legally revealed the full
  // Phase-5 trio, plus their own typed "objection" contributions.
  const call2 = await run(ctx, coordinationId, writerId, [
    authorizeStep('authCritique', 'critique-proposals', 'architecture-critic-actor', {
      authorizationId: 'auth_critique',
      invocationKey: 'ik_critique_1',
      reason: 'post-shaping-open is open: all three Phase-5 shapers have a linked result.',
      grantedContextRefs: [interpretId, investigateId, shapeSystemId, shapeAltId, shapeConstraintId],
    }),
    opStep('critique', 'critique-proposals', 'architecture-critic-actor'),
    contributionStep('linkCritique', {
      contributionId: 'aap_objection_critique',
      contributionType: 'objection',
      assignmentId: '$ref:critique',
      anchors: ['aap_proposal_system', 'aap_proposal_alt', 'aap_proposal_constraint'],
    }),
    authorizeStep('authAssess', 'assess-constraints', 'constraint-advocate-actor', {
      authorizationId: 'auth_assess',
      invocationKey: 'ik_assess_1',
      reason: 'post-shaping-open is open: all three Phase-5 shapers have a linked result.',
      grantedContextRefs: [shapeSystemId, shapeAltId, shapeConstraintId],
    }),
    opStep('assess', 'assess-constraints', 'constraint-advocate-actor'),
    contributionStep('linkAssess', {
      contributionId: 'aap_objection_assess',
      contributionType: 'objection',
      assignmentId: '$ref:assess',
      anchors: ['aap_proposal_system', 'aap_proposal_alt', 'aap_proposal_constraint'],
    }),
  ]);
  assert.equal(call2.closed, false);
  const critiqueId = assignmentIdFor(call2, 'critique');
  const assessId = assignmentIdFor(call2, 'assess');

  // Call 3: synthesis, gated on BOTH critique and assess-constraints
  // (transitively, all of Phase 5 too) -- a real graph dependency, not
  // documentation. Its own "response" contribution responds to the critic's
  // objection and anchors both Phase-6 objections.
  const call3 = await run(ctx, coordinationId, writerId, [
    authorizeStep('authSynth', 'synthesize-recommendation', 'synthesizer-actor', {
      authorizationId: 'auth_synth',
      invocationKey: 'ik_synth_1',
      reason: 'post-critique-open is open: both critique-proposals and assess-constraints have settled.',
      grantedContextRefs: [interpretId, investigateId, shapeSystemId, shapeAltId, shapeConstraintId, critiqueId, assessId],
    }),
    opStep('synth', 'synthesize-recommendation', 'synthesizer-actor'),
    contributionStep('linkSynth', {
      contributionId: 'aap_response_synth',
      contributionType: 'response',
      assignmentId: '$ref:synth',
      respondsTo: 'aap_objection_critique',
      anchors: ['aap_objection_critique', 'aap_objection_assess'],
    }),
  ]);
  assert.equal(call3.closed, false);
  const synthId = assignmentIdFor(call3, 'synth');

  // Call 4: red-team, gated on synthesis alone.
  const call4 = await run(ctx, coordinationId, writerId, [
    authorizeStep('authRedteam', 'red-team-packet', 'red-team-actor', {
      authorizationId: 'auth_redteam',
      invocationKey: 'ik_redteam_1',
      reason: 'post-synthesis-open is open: synthesize-recommendation has settled.',
      grantedContextRefs: [synthId],
    }),
    opStep('redteam', 'red-team-packet', 'red-team-actor'),
  ]);
  assert.equal(call4.closed, false);
  const redteamId = assignmentIdFor(call4, 'redteam');

  // Call 5: the lead advisor's explanation, gated on the red-team verdict.
  // The session must NOT close here even though every OTHER actor is now
  // complete -- lead-advisor-actor still owes its own third gating binding,
  // close-dialogue (see the FlowDefinition's own header comment for why).
  const call5 = await run(ctx, coordinationId, writerId, [
    authorizeStep('authExplain', 'explain-recommendation', 'lead-advisor-actor', {
      authorizationId: 'auth_explain',
      invocationKey: 'ik_explain_1',
      reason: 'post-redteam-open is open: red-team-packet has settled.',
      grantedContextRefs: [synthId, redteamId],
    }),
    opStep('explain', 'explain-recommendation', 'lead-advisor-actor'),
  ]);
  assert.equal(
    call5.closed,
    false,
    'lead-advisor-actor still owes close-dialogue -- the session must stay active for a genuinely later, real human turn',
  );
  const explainId = assignmentIdFor(call5, 'explain');
  assert.equal(replaySession(coordinationId, { cwd: tempDir, repoRoot: tempDir }).manifest.status, 'active');

  // Call 6: a genuinely separate, later call -- the real human turn (the
  // person's own words, verbatim, via the P03.1 trusted-input door) and one
  // bounded reopen of the synthesis, authorized citing that turn. Nothing
  // here is a graph concept except the reopen binding itself -- "human-turn"
  // is session-level infrastructure, legal regardless of which protocol this
  // session is bound to.
  //
  // NOT a `disposition` step citing "human-turn:turn_1" as evidence, even
  // though `assertDispositionRefOwnedBySession` (store.mjs) genuinely
  // validates that reserved namespace: a real, previously-undisclosed gap
  // found while building this test (not assumed) -- this request-schema
  // layer's own `assertSafeRefOrId` (src/verbs/coordination/schema.mjs) has
  // no exception for the reserved "human-turn:"/"contribution:" prefixes at
  // all, so ANY disposition step naming one is refused at the CHARSET check,
  // before it ever reaches the store door's real ownership logic. The one
  // legal channel today is the free-text `reason` field the "authorize" step
  // below uses -- see this cell's own doer-report.md and the FlowDefinition's
  // header comment for the full disclosure; not fixed here, per phase-03's
  // "no speculative kernel work" instruction for this cell.
  fs.mkdirSync(path.join(tempDir, 'human'), { recursive: true });
  fs.writeFileSync(path.join(tempDir, 'human', '1-person.md'), 'The person said: the schema-split direction concerns me, please revisit.\n');
  const call6 = await run(ctx, coordinationId, writerId, [
    humanTurnStep(),
    authorizeStep('authRevise1', 'revise-synthesis', 'synthesizer-actor', {
      authorizationId: 'auth_revise_1',
      invocationKey: 'ik_revise_1',
      reason: 'Bounded reopen authorized per the real human turn "turn_1" (externalRef claude-code-transcript:sess-1:uuid-1): the person raised a concern about the schema-split direction.',
      grantedContextRefs: [synthId, critiqueId, assessId],
    }),
    opStep('revise1', 'revise-synthesis', 'synthesizer-actor'),
  ]);
  assert.equal(call6.closed, false, 'the bounded reopen must not itself gate quorum -- close-dialogue is still owed and still undispatched');
  const revise1Id = assignmentIdFor(call6, 'revise1');
  assert.notEqual(revise1Id, synthId, 'a recheck/reopen must be a genuinely NEW Assignment, never a retry of the original');

  // Call 7: the driver's own explicit decision that no further reopen is
  // needed -- the ONLY thing that can bring quorum, and therefore the
  // session, to completion.
  const call7 = await run(ctx, coordinationId, writerId, [
    authorizeStep('authClose', 'close-dialogue', 'lead-advisor-actor', {
      authorizationId: 'auth_close',
      invocationKey: 'ik_close_1',
      reason: 'post-explanation-open is open and no further reopen is needed.',
      grantedContextRefs: [explainId, revise1Id],
    }),
    opStep('closeDialogue', 'close-dialogue', 'lead-advisor-actor'),
  ]);
  assert.equal(call7.closed, true, 'every gating binding, including close-dialogue, is now settled');

  // Chat-history-free replay: reconstruct the WHOLE 7-call chain from
  // replaySession's own projection alone.
  const replayed = replaySession(coordinationId, { cwd: tempDir, repoRoot: tempDir });
  assert.equal(replayed.manifest.status, 'completed');
  assert.equal(replayed.humanTurns.length, 1);
  assert.equal(replayed.humanTurns[0].turnId, 'turn_1');
  // The ORIGINAL synthesis Assignment must remain readable, unsuperseded,
  // alongside the recheck -- both are real, distinct Assignments for the
  // synthesizer actor (synth, revise1).
  assert.equal(replayed.assignments.filter((a) => a.actorId === 'synthesizer-actor').length, 2);
  assert.deepEqual(
    new Set(replayed.assignments.filter((a) => a.actorId === 'synthesizer-actor').map((a) => a.assignmentId)),
    new Set([synthId, revise1Id]),
  );
  assert.equal(replayed.contributions.length, 6, 'proposal x3 + objection x2 + response x1, reconstructed from replay alone');
});

// ── Premature reveal is refused ─────────────────────────────────────────────
test('premature reveal: critique/assess-constraints cannot be authorized until ALL THREE Phase-5 shapers have a linked result', async () => {
  const tempDir = mkTempDir();
  const runnerConfig = fakeRunnerConfig(tempDir);
  const ctx = { cwd: tempDir, repoRoot: tempDir, runnerConfig };
  const coordinationId = 'aap_premature_reveal';
  const writerId = 'aap-driver';

  const call1 = await run(ctx, coordinationId, writerId, [
    opStep('interpret', 'interpret-request', 'lead-advisor-actor'),
    opStep('investigate', 'investigate-context', 'context-investigator-actor'),
    opStep('shapeSystem', 'shape-system-proposal', 'system-shaper-actor'),
    opStep('shapeAlt', 'shape-alternative-proposal', 'alternative-shaper-actor'),
    // constraint-advocate-actor's OWN Phase-5 shaping op is deliberately
    // never dispatched in this call -- the fan-out is only 2 of 3 complete.
  ]);
  const eventsAfterCall1 = countEventLines(tempDir, coordinationId);

  await assert.rejects(
    () =>
      run(ctx, coordinationId, writerId, [
        authorizeStep('authCritique', 'critique-proposals', 'architecture-critic-actor', {
          authorizationId: 'auth_critique_early',
          invocationKey: 'ik_critique_early',
          reason: 'Attempt to reveal the shaping trio with only two of three settled.',
          grantedContextRefs: [assignmentIdFor(call1, 'shapeSystem'), assignmentIdFor(call1, 'shapeAlt')],
        }),
      ]),
    (err) => err instanceof CoordinationError && /visibility window "post-shaping-open" to be open/.test(err.message),
    'a partial Phase-5 trio must never open post-shaping-open',
  );
  assert.equal(countEventLines(tempDir, coordinationId), eventsAfterCall1, 'the refused authorization must write zero new events');

  // Completing the third shaper opens the window for real.
  const call2 = await run(ctx, coordinationId, writerId, [opStep('shapeConstraint', 'shape-constraint-proposal', 'constraint-advocate-actor')]);
  const call3 = await run(ctx, coordinationId, writerId, [
    authorizeStep('authCritique', 'critique-proposals', 'architecture-critic-actor', {
      authorizationId: 'auth_critique_late',
      invocationKey: 'ik_critique_late',
      reason: 'All three Phase-5 shapers have now settled.',
      grantedContextRefs: [
        assignmentIdFor(call1, 'shapeSystem'),
        assignmentIdFor(call1, 'shapeAlt'),
        assignmentIdFor(call2, 'shapeConstraint'),
      ],
    }),
  ]);
  assert.equal(call3.steps.find((s) => s.as === 'authCritique').appended, true, 'the identical shape of authorization now succeeds once the fan-out genuinely completes');
});

// ── Foreign/stale refs are refused ──────────────────────────────────────────
test('foreign refs: an authorization cannot grant an Assignment ref belonging to a DIFFERENT coordination session', async () => {
  const tempDir = mkTempDir();
  const runnerConfig = fakeRunnerConfig(tempDir);
  const ctx = { cwd: tempDir, repoRoot: tempDir, runnerConfig };
  const writerId = 'aap-driver';

  // A second, unrelated session in the SAME .fgos root, so its Assignment id
  // genuinely exists on disk (session-membership is checked by real disk
  // existence, not by naming convention).
  const foreign = await run(ctx, 'aap_foreign_session', writerId, [
    opStep('interpret', 'interpret-request', 'lead-advisor-actor'),
  ]);
  const foreignAssignmentId = assignmentIdFor(foreign, 'interpret');

  const coordinationId = 'aap_foreign_ref_target';
  const call1 = await run(ctx, coordinationId, writerId, [
    opStep('shapeSystem', 'shape-system-proposal', 'system-shaper-actor'),
    opStep('shapeAlt', 'shape-alternative-proposal', 'alternative-shaper-actor'),
    opStep('shapeConstraint', 'shape-constraint-proposal', 'constraint-advocate-actor'),
  ]);
  const eventsAfterCall1 = countEventLines(tempDir, coordinationId);

  await assert.rejects(
    () =>
      run(ctx, coordinationId, writerId, [
        authorizeStep('authCritique', 'critique-proposals', 'architecture-critic-actor', {
          authorizationId: 'auth_critique_foreign',
          invocationKey: 'ik_critique_foreign',
          reason: 'Attempt to smuggle a foreign session\'s Assignment ref into a grant.',
          grantedContextRefs: [assignmentIdFor(call1, 'shapeSystem'), foreignAssignmentId],
        }),
      ]),
    (err) => err instanceof CoordinationError && /resolves to an Assignment that is not a member of coordination session/.test(err.message),
    'a foreign-session Assignment ref must never become grantable, even alongside a genuinely owned one',
  );
  assert.equal(countEventLines(tempDir, coordinationId), eventsAfterCall1, 'the refused cross-session grant must write zero new events');
});

// ── Hidden dissent: critique/synthesis are not skippable ────────────────────
test('hidden dissent: synthesis cannot be authorized without critique/assess-constraints having settled first -- the critique step is not skippable', async () => {
  const tempDir = mkTempDir();
  const runnerConfig = fakeRunnerConfig(tempDir);
  const ctx = { cwd: tempDir, repoRoot: tempDir, runnerConfig };
  const coordinationId = 'aap_hidden_dissent';
  const writerId = 'aap-driver';

  const call1 = await run(ctx, coordinationId, writerId, [
    opStep('shapeSystem', 'shape-system-proposal', 'system-shaper-actor'),
    opStep('shapeAlt', 'shape-alternative-proposal', 'alternative-shaper-actor'),
    opStep('shapeConstraint', 'shape-constraint-proposal', 'constraint-advocate-actor'),
  ]);
  const shapeSystemId = assignmentIdFor(call1, 'shapeSystem');

  await assert.rejects(
    () =>
      run(ctx, coordinationId, writerId, [
        authorizeStep('authSynth', 'synthesize-recommendation', 'synthesizer-actor', {
          authorizationId: 'auth_synth_skip',
          invocationKey: 'ik_synth_skip',
          reason: 'Attempt to synthesize without ever dispatching critique-proposals or assess-constraints.',
          grantedContextRefs: [shapeSystemId],
        }),
      ]),
    (err) => err instanceof CoordinationError && /visibility window "post-critique-open" to be open/.test(err.message),
    'synthesis must be structurally unreachable while the critique and constraint findings are still missing -- they cannot be silently skipped',
  );
});

// ── Missing actors: quorum reports honestly, never closes early ────────────
test('missing actors: the session reports the real, named missing actor and never closes while any one of them is incomplete', async () => {
  const tempDir = mkTempDir();
  const runnerConfig = fakeRunnerConfig(tempDir);
  const ctx = { cwd: tempDir, repoRoot: tempDir, runnerConfig };
  const coordinationId = 'aap_missing_actors';
  const writerId = 'aap-driver';

  const call1 = await run(ctx, coordinationId, writerId, [
    opStep('interpret', 'interpret-request', 'lead-advisor-actor'),
    opStep('investigate', 'investigate-context', 'context-investigator-actor'),
    opStep('shapeSystem', 'shape-system-proposal', 'system-shaper-actor'),
    opStep('shapeAlt', 'shape-alternative-proposal', 'alternative-shaper-actor'),
    opStep('shapeConstraint', 'shape-constraint-proposal', 'constraint-advocate-actor'),
  ]);
  assert.equal(call1.closed, false);
  const missingIds = new Set(call1.quorum.missing.map((m) => m.actorId));
  for (const stillOwed of ['architecture-critic-actor', 'synthesizer-actor', 'red-team-actor', 'constraint-advocate-actor']) {
    assert.ok(missingIds.has(stillOwed), `expected "${stillOwed}" to be honestly reported missing (it still owes a later gating binding)`);
  }
  assert.ok(!missingIds.has('system-shaper-actor'), 'system-shaper-actor has no further gating binding and is genuinely complete');
});

// ── Unauthorized specialist is refused (direct engine call -- run.mjs has no
//    specialist-authorize step type; see the FlowDefinition's own header
//    comment for this named, pre-existing gap). ────────────────────────────
test('unauthorized specialist: answer-specialist-question cannot dispatch without a prior authorizeSpecialistSlot, and succeeds once authorized', async () => {
  const tempDir = mkTempDir();
  const runnerConfig = fakeRunnerConfig(tempDir);
  const opts = { cwd: tempDir, repoRoot: tempDir, runnerConfig };
  const coordinationId = 'aap_specialist';
  openDeclaredProtocolSession(
    { definitionId: PANEL_ID, coordinationId, objective: 'Specialist slot conformance.', writerId: 'aap-driver' },
    opts,
  );
  // The specialist slot's own binding is gated by "post-shaping-open" --
  // settle the Phase-5 trio first so the later authorize call below can
  // legally open it.
  for (const [operationId, targetActorId] of [
    ['shape-system-proposal', 'system-shaper-actor'],
    ['shape-alternative-proposal', 'alternative-shaper-actor'],
    ['shape-constraint-proposal', 'constraint-advocate-actor'],
  ]) {
    // eslint-disable-next-line no-await-in-loop -- sequential setup dispatch, not the behavior under test.
    await dispatchDeclaredOperation(coordinationId, { operationId, targetActorId, objective: `${operationId} setup.`, expectedOutputs: OUTPUTS, writerId: 'aap-driver' }, opts);
  }

  await assert.rejects(
    () =>
      dispatchDeclaredOperation(
        coordinationId,
        {
          operationId: 'answer-specialist-question',
          targetActorId: 'unbound-specialist',
          objective: 'Attempt to dispatch a specialist slot binding with no prior authorization.',
          expectedOutputs: OUTPUTS,
          writerId: 'aap-driver',
        },
        opts,
      ),
    (err) => err instanceof CoordinationError && /is bound to specialist slot "specialist-answer-slot" -- no specialist is currently authorized/.test(err.message),
    'a specialistSlotRef binding must refuse to materialize an Assignment for an actor never authorized into that slot -- pinned to the slot-gate\'s own message so this test cannot pass for a DIFFERENT reason (e.g. a missing operation-authorized event)',
  );

  authorizeSpecialistSlot(
    coordinationId,
    {
      slotId: 'specialist-answer-slot',
      specialistActorId: 'unbound-specialist',
      role: 'specialist',
      authorizedBy: { type: 'driver', id: 'aap-driver' },
      reason: 'Recruiting a specialist to answer one bounded question about data retention.',
      maxAssignments: 3,
      expiresAfterRound: 100,
      specialistAuthorizationId: 'auth_specialist_1',
    },
    opts,
  );
  authorizeDeclaredOperation(
    coordinationId,
    {
      operationId: 'answer-specialist-question',
      targetActorId: 'unbound-specialist',
      authorizationId: 'auth_answer_specialist_1',
      invocationKey: 'ik_answer_specialist_1',
      authorizedBy: { type: 'driver', id: 'aap-driver' },
      reason: 'Dispatch the specialist answer.',
      grantedContextRefs: [],
    },
    opts,
  );

  const dispatched = await dispatchDeclaredOperation(
    coordinationId,
    {
      operationId: 'answer-specialist-question',
      targetActorId: 'unbound-specialist',
      objective: 'Answer one bounded specialist question.',
      expectedOutputs: OUTPUTS,
      writerId: 'aap-driver',
    },
    opts,
  );
  assert.ok(dispatched.assignment.assignmentId, 'dispatch succeeds once the specialist is genuinely authorized into the declared slot');
});

// ── Over-cap reopen is refused ───────────────────────────────────────────────
test('over-cap reopen: revise-synthesis admits exactly 2 invocations (activation.maxInvocations) and refuses the 3rd', async () => {
  const tempDir = mkTempDir();
  const runnerConfig = fakeRunnerConfig(tempDir);
  const ctx = { cwd: tempDir, repoRoot: tempDir, runnerConfig };
  const coordinationId = 'aap_over_cap_reopen';
  const writerId = 'aap-driver';

  const call1 = await run(ctx, coordinationId, writerId, [
    opStep('shapeSystem', 'shape-system-proposal', 'system-shaper-actor'),
    opStep('shapeAlt', 'shape-alternative-proposal', 'alternative-shaper-actor'),
    opStep('shapeConstraint', 'shape-constraint-proposal', 'constraint-advocate-actor'),
  ]);
  const call2 = await run(ctx, coordinationId, writerId, [
    authorizeStep('authCritique', 'critique-proposals', 'architecture-critic-actor', {
      authorizationId: 'auth_critique',
      invocationKey: 'ik_critique',
      reason: 'post-shaping-open is open.',
      grantedContextRefs: [assignmentIdFor(call1, 'shapeSystem')],
    }),
    opStep('critique', 'critique-proposals', 'architecture-critic-actor'),
    authorizeStep('authAssess', 'assess-constraints', 'constraint-advocate-actor', {
      authorizationId: 'auth_assess',
      invocationKey: 'ik_assess',
      reason: 'post-shaping-open is open.',
      grantedContextRefs: [assignmentIdFor(call1, 'shapeConstraint')],
    }),
    opStep('assess', 'assess-constraints', 'constraint-advocate-actor'),
  ]);
  const call3 = await run(ctx, coordinationId, writerId, [
    authorizeStep('authSynth', 'synthesize-recommendation', 'synthesizer-actor', {
      authorizationId: 'auth_synth',
      invocationKey: 'ik_synth',
      reason: 'post-critique-open is open.',
      grantedContextRefs: [assignmentIdFor(call2, 'critique'), assignmentIdFor(call2, 'assess')],
    }),
    opStep('synth', 'synthesize-recommendation', 'synthesizer-actor'),
  ]);
  const synthId = assignmentIdFor(call3, 'synth');

  // Two legitimate reopens -- both must succeed, admitted by the same
  // `activation.maxInvocations` mechanism P02.1's own N+1 probe confirmed
  // live against `test/runner/coordination-driver-authorization.test.mjs`.
  const call4 = await run(ctx, coordinationId, writerId, [
    authorizeStep('authRevise1', 'revise-synthesis', 'synthesizer-actor', {
      authorizationId: 'auth_revise_1',
      invocationKey: 'ik_revise_1',
      reason: 'First bounded reopen.',
      grantedContextRefs: [synthId],
    }),
    opStep('revise1', 'revise-synthesis', 'synthesizer-actor'),
  ]);
  assert.equal(call4.steps.find((s) => s.as === 'authRevise1').appended, true);
  const revise1Id = assignmentIdFor(call4, 'revise1');

  const call5 = await run(ctx, coordinationId, writerId, [
    authorizeStep('authRevise2', 'revise-synthesis', 'synthesizer-actor', {
      authorizationId: 'auth_revise_2',
      invocationKey: 'ik_revise_2',
      reason: 'Second bounded reopen.',
      grantedContextRefs: [revise1Id],
    }),
    opStep('revise2', 'revise-synthesis', 'synthesizer-actor'),
  ]);
  assert.equal(call5.steps.find((s) => s.as === 'authRevise2').appended, true);
  const revise2Id = assignmentIdFor(call5, 'revise2');

  const eventsBeforeThirdAttempt = countEventLines(tempDir, coordinationId);
  await assert.rejects(
    () =>
      run(ctx, coordinationId, writerId, [
        authorizeStep('authRevise3', 'revise-synthesis', 'synthesizer-actor', {
          authorizationId: 'auth_revise_3',
          invocationKey: 'ik_revise_3',
          reason: 'Third reopen attempt -- must be refused, the binding admits at most 2.',
          grantedContextRefs: [revise2Id],
        }),
      ]),
    (err) => err instanceof CoordinationError && /maxInvocations/.test(err.message),
    'activation.maxInvocations: 2 must refuse a third authorization at this exact binding',
  );
  assert.equal(countEventLines(tempDir, coordinationId), eventsBeforeThirdAttempt, 'the refused over-cap authorization must write zero new events');

  // Both real reopens, and the ORIGINAL synthesis, remain distinct and
  // readable -- a recheck never supersedes, rewrites, or deletes prior
  // evidence.
  const replayed = replaySession(coordinationId, { cwd: tempDir, repoRoot: tempDir });
  const synthesizerAssignmentIds = new Set(replayed.assignments.filter((a) => a.actorId === 'synthesizer-actor').map((a) => a.assignmentId));
  assert.deepEqual(synthesizerAssignmentIds, new Set([synthId, revise1Id, revise2Id]), 'wrong recheck revision: exactly three distinct Assignments, original preserved alongside both reopens');
});

// ── revise-explanation: the OTHER half of bounded dialogue reopen ──────────
// R2 (independent Review): `revise-explanation` had zero test coverage and
// was provably deletable with no test failure -- an ungated
// `driver-authorized` binding gates no quorum, appears in no visibility
// window, and is inert to every other derivation. Mirrors the
// `revise-synthesis` over-cap test above exactly, proving the SAME
// mechanism for the lead advisor's own reopen: a genuinely new Assignment
// each time, and `activation.maxInvocations: 2` refusing a 3rd.
test('over-cap reopen (explanation): revise-explanation admits exactly 2 invocations (activation.maxInvocations) and refuses the 3rd', async () => {
  const tempDir = mkTempDir();
  const runnerConfig = fakeRunnerConfig(tempDir);
  const ctx = { cwd: tempDir, repoRoot: tempDir, runnerConfig };
  const coordinationId = 'aap_over_cap_reopen_explanation';
  const writerId = 'aap-driver';

  const call1 = await run(ctx, coordinationId, writerId, [
    opStep('shapeSystem', 'shape-system-proposal', 'system-shaper-actor'),
    opStep('shapeAlt', 'shape-alternative-proposal', 'alternative-shaper-actor'),
    opStep('shapeConstraint', 'shape-constraint-proposal', 'constraint-advocate-actor'),
  ]);
  const call2 = await run(ctx, coordinationId, writerId, [
    authorizeStep('authCritique', 'critique-proposals', 'architecture-critic-actor', {
      authorizationId: 'auth_critique',
      invocationKey: 'ik_critique',
      reason: 'post-shaping-open is open.',
      grantedContextRefs: [assignmentIdFor(call1, 'shapeSystem')],
    }),
    opStep('critique', 'critique-proposals', 'architecture-critic-actor'),
    authorizeStep('authAssess', 'assess-constraints', 'constraint-advocate-actor', {
      authorizationId: 'auth_assess',
      invocationKey: 'ik_assess',
      reason: 'post-shaping-open is open.',
      grantedContextRefs: [assignmentIdFor(call1, 'shapeConstraint')],
    }),
    opStep('assess', 'assess-constraints', 'constraint-advocate-actor'),
  ]);
  const call3 = await run(ctx, coordinationId, writerId, [
    authorizeStep('authSynth', 'synthesize-recommendation', 'synthesizer-actor', {
      authorizationId: 'auth_synth',
      invocationKey: 'ik_synth',
      reason: 'post-critique-open is open.',
      grantedContextRefs: [assignmentIdFor(call2, 'critique'), assignmentIdFor(call2, 'assess')],
    }),
    opStep('synth', 'synthesize-recommendation', 'synthesizer-actor'),
  ]);
  const call4 = await run(ctx, coordinationId, writerId, [
    authorizeStep('authRedteam', 'red-team-packet', 'red-team-actor', {
      authorizationId: 'auth_redteam',
      invocationKey: 'ik_redteam',
      reason: 'post-synthesis-open is open.',
      grantedContextRefs: [assignmentIdFor(call3, 'synth')],
    }),
    opStep('redteam', 'red-team-packet', 'red-team-actor'),
  ]);
  const call5 = await run(ctx, coordinationId, writerId, [
    authorizeStep('authExplain', 'explain-recommendation', 'lead-advisor-actor', {
      authorizationId: 'auth_explain',
      invocationKey: 'ik_explain',
      reason: 'post-redteam-open is open.',
      grantedContextRefs: [assignmentIdFor(call3, 'synth'), assignmentIdFor(call4, 'redteam')],
    }),
    opStep('explain', 'explain-recommendation', 'lead-advisor-actor'),
  ]);
  const explainId = assignmentIdFor(call5, 'explain');

  // Two legitimate reopens of the EXPLANATION -- both must succeed, each
  // producing a genuinely new Assignment distinct from the original
  // explain-recommendation.
  const call6 = await run(ctx, coordinationId, writerId, [
    authorizeStep('authReviseExplain1', 'revise-explanation', 'lead-advisor-actor', {
      authorizationId: 'auth_revise_explain_1',
      invocationKey: 'ik_revise_explain_1',
      reason: 'First bounded reopen of the explanation.',
      grantedContextRefs: [explainId],
    }),
    opStep('reviseExplain1', 'revise-explanation', 'lead-advisor-actor'),
  ]);
  assert.equal(call6.steps.find((s) => s.as === 'authReviseExplain1').appended, true);
  const reviseExplain1Id = assignmentIdFor(call6, 'reviseExplain1');
  assert.notEqual(reviseExplain1Id, explainId, 'a recheck/reopen must be a genuinely NEW Assignment, never a retry of the original explain-recommendation');

  const call7 = await run(ctx, coordinationId, writerId, [
    authorizeStep('authReviseExplain2', 'revise-explanation', 'lead-advisor-actor', {
      authorizationId: 'auth_revise_explain_2',
      invocationKey: 'ik_revise_explain_2',
      reason: 'Second bounded reopen of the explanation.',
      grantedContextRefs: [reviseExplain1Id],
    }),
    opStep('reviseExplain2', 'revise-explanation', 'lead-advisor-actor'),
  ]);
  assert.equal(call7.steps.find((s) => s.as === 'authReviseExplain2').appended, true);
  const reviseExplain2Id = assignmentIdFor(call7, 'reviseExplain2');

  const eventsBeforeThirdAttempt = countEventLines(tempDir, coordinationId);
  await assert.rejects(
    () =>
      run(ctx, coordinationId, writerId, [
        authorizeStep('authReviseExplain3', 'revise-explanation', 'lead-advisor-actor', {
          authorizationId: 'auth_revise_explain_3',
          invocationKey: 'ik_revise_explain_3',
          reason: 'Third reopen attempt -- must be refused, the binding admits at most 2.',
          grantedContextRefs: [reviseExplain2Id],
        }),
      ]),
    (err) => err instanceof CoordinationError && /maxInvocations/.test(err.message),
    'activation.maxInvocations: 2 must refuse a third authorization of revise-explanation, the SAME mechanism proven above for revise-synthesis',
  );
  assert.equal(countEventLines(tempDir, coordinationId), eventsBeforeThirdAttempt, 'the refused over-cap authorization must write zero new events');

  // Both real reopens, and the ORIGINAL explanation, remain distinct and
  // readable -- proving this is not the phantom-shaped, deletable binding
  // R2 found: removing revise-explanation's own gating would make this
  // assertion (and the maxInvocations refusal above) fail.
  const replayed = replaySession(coordinationId, { cwd: tempDir, repoRoot: tempDir });
  const leadAdvisorReopenAssignmentIds = new Set(
    replayed.assignments.filter((a) => a.actorId === 'lead-advisor-actor' && [explainId, reviseExplain1Id, reviseExplain2Id].includes(a.assignmentId)).map((a) => a.assignmentId),
  );
  assert.deepEqual(leadAdvisorReopenAssignmentIds, new Set([explainId, reviseExplain1Id, reviseExplain2Id]), 'exactly three distinct Assignments for the lead advisor\'s explanation lineage: original preserved alongside both reopens');
});

// ── Terminal mutation is refused ────────────────────────────────────────────
test('terminal mutation: once the session is closed, nothing can be appended -- not even an authorization for an unrelated binding', async () => {
  const tempDir = mkTempDir();
  const runnerConfig = fakeRunnerConfig(tempDir);
  const ctx = { cwd: tempDir, repoRoot: tempDir, runnerConfig };
  const coordinationId = 'aap_terminal_mutation';
  const writerId = 'aap-driver';

  // Drive the ENTIRE chain to closure in one pass (all seven phases +
  // close-dialogue) to reach a genuinely terminal session cheaply.
  // `aggregateBounds.maxRounds` raised: 11 real Assignments, above the
  // default session-wide cap of 10.
  const call1 = await run(
    ctx,
    coordinationId,
    writerId,
    [
    opStep('interpret', 'interpret-request', 'lead-advisor-actor'),
    opStep('investigate', 'investigate-context', 'context-investigator-actor'),
    opStep('shapeSystem', 'shape-system-proposal', 'system-shaper-actor'),
    opStep('shapeAlt', 'shape-alternative-proposal', 'alternative-shaper-actor'),
    opStep('shapeConstraint', 'shape-constraint-proposal', 'constraint-advocate-actor'),
    authorizeStep('authCritique', 'critique-proposals', 'architecture-critic-actor', {
      authorizationId: 'auth_critique',
      invocationKey: 'ik_critique',
      reason: 'post-shaping-open is open.',
      grantedContextRefs: [],
    }),
    opStep('critique', 'critique-proposals', 'architecture-critic-actor'),
    authorizeStep('authAssess', 'assess-constraints', 'constraint-advocate-actor', {
      authorizationId: 'auth_assess',
      invocationKey: 'ik_assess',
      reason: 'post-shaping-open is open.',
      grantedContextRefs: [],
    }),
    opStep('assess', 'assess-constraints', 'constraint-advocate-actor'),
    authorizeStep('authSynth', 'synthesize-recommendation', 'synthesizer-actor', {
      authorizationId: 'auth_synth',
      invocationKey: 'ik_synth',
      reason: 'post-critique-open is open.',
      grantedContextRefs: [],
    }),
    opStep('synth', 'synthesize-recommendation', 'synthesizer-actor'),
    authorizeStep('authRedteam', 'red-team-packet', 'red-team-actor', {
      authorizationId: 'auth_redteam',
      invocationKey: 'ik_redteam',
      reason: 'post-synthesis-open is open.',
      grantedContextRefs: [],
    }),
    opStep('redteam', 'red-team-packet', 'red-team-actor'),
    authorizeStep('authExplain', 'explain-recommendation', 'lead-advisor-actor', {
      authorizationId: 'auth_explain',
      invocationKey: 'ik_explain',
      reason: 'post-redteam-open is open.',
      grantedContextRefs: [],
    }),
    opStep('explain', 'explain-recommendation', 'lead-advisor-actor'),
    authorizeStep('authClose', 'close-dialogue', 'lead-advisor-actor', {
      authorizationId: 'auth_close',
      invocationKey: 'ik_close',
      reason: 'No further reopen is needed.',
      grantedContextRefs: [],
    }),
    opStep('closeDialogue', 'close-dialogue', 'lead-advisor-actor'),
    ],
    { aggregateBounds: { maxRounds: 20 } },
  );
  assert.equal(call1.closed, true, 'sanity: the session really closed in this single call');

  const eventsAfterClose = countEventLines(tempDir, coordinationId);
  await assert.rejects(
    () =>
      run(ctx, coordinationId, writerId, [
        { type: 'disposition', as: 'lateDisposition', targetRef: 'some-late-target', disposition: 'accepted', rationale: 'Attempt to mutate a closed session.', evidenceRefs: [] },
      ]),
    (err) => err instanceof CoordinationError && /is not active \(status: "completed"\)/.test(err.message),
    'a genuinely later call against a closed session must be refused outright, never a silent mutation',
  );
  assert.equal(countEventLines(tempDir, coordinationId), eventsAfterClose, 'the refused post-terminal request must write zero new events');
});

// ── Work isolation ───────────────────────────────────────────────────────────
test('Work isolation: a request step carrying a Work-lifecycle-shaped field is refused at the SAME shared request boundary this protocol\'s own dispatch path uses', async () => {
  const tempDir = mkTempDir();
  const runnerConfig = fakeRunnerConfig(tempDir);
  const ctx = { cwd: tempDir, repoRoot: tempDir, runnerConfig };
  const coordinationId = 'aap_work_isolation';
  const writerId = 'aap-driver';

  await assert.rejects(
    () =>
      run(ctx, coordinationId, writerId, [
        { type: 'disposition', as: 'd', targetRef: 'some-target', disposition: 'accepted', rationale: 'Attempt to smuggle Work lifecycle authority.', evidenceRefs: [], approve: true },
      ]),
    (err) => err instanceof StoreError && /carries Work lifecycle authority/.test(err.message),
    'the shared request schema boundary refuses a Work-lifecycle-shaped key regardless of which protocol the session is bound to',
  );
});

// ── Human-authority impersonation is refused ────────────────────────────────
// Two parts. Part 1, through this protocol's OWN real dispatch path (the
// pack gate): a "human-turn" step can never be attributed to the driver --
// the request-schema boundary refuses `attributedTo.type !== "person"`
// unconditionally, so a driver-authored turn can never occupy the
// human-decision slot's own attribution field. Part 2, a direct store-layer
// call: `recordDriverDisposition` genuinely refuses a `human-turn:` ref that
// was never recorded via `recordHumanTurn` -- proving the underlying KERNEL
// guarantee holds for THIS protocol's own bound definition. Part 2 is
// necessarily a direct call, not a pack-gate one: a real, previously-
// undisclosed gap found while building this suite (see call 6 of the full-
// chain test's own comment) means `src/verbs/coordination/schema.mjs`'s
// `assertSafeRefOrId` refuses EVERY "human-turn:"/"contribution:"-prefixed
// disposition ref at the request-schema charset check, before it ever
// reaches the store door's real ownership logic -- so this specific
// guarantee is not yet reachable through `fgos coordination run`/the pack
// gate for ANY protocol, not just this one. Disclosed here and in this
// cell's own doer-report.md; not fixed, per phase-03's own "no speculative
// kernel work" instruction for this cell.
test('human-authority impersonation: a driver-attributed human-turn step is refused through the real pack gate, and a never-recorded human-turn ref is refused at the store door', async () => {
  const tempDir = mkTempDir();
  const runnerConfig = fakeRunnerConfig(tempDir);
  const ctx = { cwd: tempDir, repoRoot: tempDir, runnerConfig };
  const coordinationId = 'aap_human_authority';
  const writerId = 'aap-driver';

  fs.mkdirSync(path.join(tempDir, 'human'), { recursive: true });
  fs.writeFileSync(path.join(tempDir, 'human', '1-person.md'), 'Ship it.\n');

  await assert.rejects(
    () =>
      run(ctx, coordinationId, writerId, [
        opStep('interpret', 'interpret-request', 'lead-advisor-actor'),
        humanTurnStep({ attributedTo: { type: 'driver', id: writerId } }),
      ]),
    (err) => err instanceof StoreError && /attributedTo\.type must be "person"/.test(err.message),
    'a driver-authored artifact can never occupy the human-decision slot\'s own attribution field, through this protocol\'s real dispatch path',
  );

  await run(ctx, coordinationId, writerId, [opStep('interpret', 'interpret-request', 'lead-advisor-actor')]);
  const { recordDriverDisposition } = await import('../../src/runner/coordination/store.mjs');
  const opts = { cwd: tempDir, repoRoot: tempDir };
  assert.throws(
    () =>
      recordDriverDisposition(
        coordinationId,
        {
          targetRef: 'human-turn:turn_never_recorded',
          disposition: 'accepted',
          rationale: 'A driver-authored claim attempting to cite a human turn that was never recorded.',
          evidenceRefs: [],
          authorizedBy: { type: 'driver', id: writerId },
        },
        opts,
      ),
    (err) => err instanceof CoordinationError && /names human turn "turn_never_recorded", which coordination session ".*" never recorded/.test(err.message),
    'the kernel\'s own write door refuses a "human-turn:" ref that was never recorded via recordHumanTurn, for this protocol\'s own bound session',
  );
});

// ── CLI/headless parity ──────────────────────────────────────────────────────
test('CLI/headless parity: the pack gate and a direct runCoordinationUseCase call reach the identical shared door for this protocol', async () => {
  const tempDir = mkTempDir();
  const runnerConfig = fakeRunnerConfig(tempDir);
  const ctx = { cwd: tempDir, repoRoot: tempDir, runnerConfig };
  const writerId = 'aap-driver';

  const viaPack = await run(ctx, 'aap_parity_pack', writerId, [opStep('interpret', 'interpret-request', 'lead-advisor-actor')]);

  const viaDirect = await runCoordinationUseCase(ctx, {
    requestObject: {
      kind: 'declared-protocol',
      objective: 'Architecture Advisory Panel V1 conformance (direct runCoordinationUseCase call).',
      writerId,
      coordinationId: 'aap_parity_direct',
      protocolRef: { id: PANEL_ID },
      steps: [opStep('interpret', 'interpret-request', 'lead-advisor-actor')],
    },
  });

  assert.equal(viaPack.definitionRef.id, viaDirect.definitionRef.id);
  assert.equal(viaPack.definitionRef.version, viaDirect.definitionRef.version);
  assert.equal(viaPack.steps.find((s) => s.as === 'interpret').status, viaDirect.steps.find((s) => s.as === 'interpret').status);
  assert.equal(
    viaPack.steps.find((s) => s.as === 'interpret').status,
    'done',
    'the pack forwards byte-for-byte into runCoordinationUseCase -- the SAME door fgos coordination run/the headless adapter call',
  );
});

// ── Heterogeneous actor bindings, real tier-to-distinct-model provenance ────
test('heterogeneous actor bindings: two shaper roles resolve through genuinely different registered executors, and the synthesizer\'s own higher tier resolves a genuinely different model on the SAME executor', async () => {
  const tempDir = mkTempDir();
  const runnerConfig = fakeRunnerConfig(tempDir);
  const ctx = { cwd: tempDir, repoRoot: tempDir, runnerConfig };
  const coordinationId = 'aap_heterogeneous_actors';
  const writerId = 'aap-driver';

  const call1 = await run(
    ctx,
    coordinationId,
    writerId,
    [
      opStep('shapeSystem', 'shape-system-proposal', 'system-shaper-actor'),
      opStep('shapeAlt', 'shape-alternative-proposal', 'alternative-shaper-actor'),
      opStep('shapeConstraint', 'shape-constraint-proposal', 'constraint-advocate-actor'),
    ],
    {
      actors: [
        { id: 'system-shaper-actor', executor: 'exec-family-a' },
        { id: 'alternative-shaper-actor', executor: 'exec-family-b' },
      ],
    },
  );
  const shapeSystem = call1.steps.find((s) => s.as === 'shapeSystem');
  const shapeAlt = call1.steps.find((s) => s.as === 'shapeAlt');
  assert.equal(shapeSystem.executor, 'exec-family-a');
  assert.equal(shapeSystem.provider, 'family-a');
  assert.equal(shapeSystem.tier, 'analytical', 'system-shaper\'s own operation-declared minTier floor');
  assert.equal(shapeAlt.executor, 'exec-family-b');
  assert.equal(shapeAlt.provider, 'family-b');
  assert.notEqual(shapeSystem.executor, shapeAlt.executor, 'two genuinely different registered executors, not one global default');
  assert.notEqual(shapeSystem.provider, shapeAlt.provider);

  const call2 = await run(
    ctx,
    coordinationId,
    writerId,
    [
      authorizeStep('authCritique', 'critique-proposals', 'architecture-critic-actor', {
        authorizationId: 'auth_critique',
        invocationKey: 'ik_critique',
        reason: 'post-shaping-open is open.',
        grantedContextRefs: [],
      }),
      opStep('critique', 'critique-proposals', 'architecture-critic-actor'),
      authorizeStep('authAssess', 'assess-constraints', 'constraint-advocate-actor', {
        authorizationId: 'auth_assess',
        invocationKey: 'ik_assess',
        reason: 'post-shaping-open is open.',
        grantedContextRefs: [],
      }),
      opStep('assess', 'assess-constraints', 'constraint-advocate-actor'),
      authorizeStep('authSynth', 'synthesize-recommendation', 'synthesizer-actor', {
        authorizationId: 'auth_synth',
        invocationKey: 'ik_synth',
        reason: 'post-critique-open is open.',
        grantedContextRefs: [],
      }),
      opStep('synth', 'synthesize-recommendation', 'synthesizer-actor'),
    ],
    { actors: [{ id: 'synthesizer-actor', executor: 'exec-family-a' }] },
  );
  const synth = call2.steps.find((s) => s.as === 'synth');
  assert.equal(synth.executor, 'exec-family-a', 'the SAME executor as system-shaper, proving the model difference below is a tier effect, not an executor effect');
  assert.equal(synth.tier, 'critical', 'synthesizer\'s own operation-declared minTier floor');

  // Read the real RunResult files to compare the actually-resolved MODEL
  // string -- summarizeDispatch's own step-result shape does not surface
  // "model" -- proving family-a's modelPolicy maps "analytical" and
  // "critical" to genuinely DIFFERENT models (phase-03's own named
  // condition for a tier assertion to count).
  function resolvedModelFor(assignmentId) {
    const runsDir = path.join(tempDir, '.fgos', 'assignments', assignmentId, 'runs');
    const attempt = fs.readdirSync(runsDir)[0];
    const result = JSON.parse(fs.readFileSync(path.join(runsDir, attempt, 'result.json'), 'utf8'));
    return result.policy.provenance.model.value;
  }
  const systemShaperModel = resolvedModelFor(shapeSystem.assignmentId);
  const synthesizerModel = resolvedModelFor(synth.assignmentId);
  assert.equal(systemShaperModel, 'model-a-analytical');
  assert.equal(synthesizerModel, 'model-a-critical');
  assert.notEqual(systemShaperModel, synthesizerModel, 'same executor/provider family, different tier, genuinely different resolved model');
});
