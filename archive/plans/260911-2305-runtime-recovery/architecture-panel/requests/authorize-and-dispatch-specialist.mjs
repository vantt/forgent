// One-off coordinator script: authorize the specialist slot for the third
// named alternative ("long-horizon writable/continuation"), then dispatch
// answer-specialist-question through the normal request door. Not part of
// the shipped repo — lives under the panel's own evidence directory.
import { authorizeSpecialistSlot } from '../../../../src/runner/coordination/session-engine.mjs';
import { runGroupThinkingRequest } from '../../../../src/verbs/coordination/group-thinking-pack.mjs';

const coordinationId = 'architecture-advisory-panel--runtime-recovery';
const ctx = { cwd: process.cwd(), repoRoot: process.cwd() };

const auth = authorizeSpecialistSlot(
  coordinationId,
  {
    slotId: 'specialist-answer-slot',
    specialistActorId: 'long-horizon-specialist-actor',
    role: 'specialist',
    capabilities: [],
    authorizedBy: { type: 'driver', id: 'runtime-recovery-panel-coordinator' },
    reason: 'Third named alternative category (long-horizon writable/continuation) has no dedicated shaper role in this protocol; using the specialist mechanism per its intended bounded-question shape rather than distorting an existing shaper into two jobs.',
    triggerEvidenceRefs: [],
    allowedContextRefs: [],
    maxAssignments: 1,
    expiresAfterRound: 15,
    specialistAuthorizationId: 'spec-auth-long-horizon-1',
  },
  ctx,
);
console.log('AUTHORIZED', JSON.stringify(auth));

const result = await runGroupThinkingRequest(ctx, {
  protocolId: 'core.coordination-protocol.architecture-advisory-panel-v1',
  cliExecutor: 'codex-bwrap',
  cliTier: 'analytical',
  requestObject: {
    kind: 'declared-protocol',
    objective: 'Specialist answer: the third named alternative (long-horizon writable/continuation) the two-shaper roster cannot produce directly.',
    writerId: 'runtime-recovery-panel-coordinator',
    coordinationId,
    protocolRef: { id: 'core.coordination-protocol.architecture-advisory-panel-v1' },
    actors: [
      { id: 'lead-advisor-actor', executor: 'claude-bwrap' },
      { id: 'context-investigator-actor', executor: 'claude-bwrap', tier: 'standard' },
      { id: 'system-shaper-actor', executor: 'claude-bwrap', tier: 'analytical' },
      { id: 'alternative-shaper-actor', executor: 'agy-bwrap', tier: 'analytical' },
      { id: 'constraint-advocate-actor', executor: 'codex-bwrap', tier: 'analytical' },
      { id: 'architecture-critic-actor', executor: 'agy-bwrap', tier: 'critical' },
      { id: 'synthesizer-actor', executor: 'claude-bwrap', tier: 'critical' },
      { id: 'red-team-actor', executor: 'codex-bwrap', tier: 'critical' },
    ],
    steps: [
      {
        type: 'authorize',
        as: 'authorizeSpecialistOp',
        operationId: 'answer-specialist-question',
        targetActorId: 'long-horizon-specialist-actor',
        nodeId: 'phase-critique',
        authorizationId: 'auth-specialist-long-horizon-1',
        invocationKey: 'invoke-specialist-long-horizon-1',
        reason: 'Driver authorizes the bounded specialist question for the third named alternative (long-horizon writable/continuation), per the specialist-answer-slot binding already authorized into the identity slot.',
      },
      {
        type: 'operation',
        as: 'specialistAnswer',
        operationId: 'answer-specialist-question',
        targetActorId: 'long-horizon-specialist-actor',
        taskKey: 'specialist-long-horizon-1',
        objective: "Read /home/vantt/projects/forgentX/plans/260911-2305-runtime-recovery/architecture-panel/prompts/specialist-long-horizon.md and follow it exactly: answer the bounded question about the long-horizon writable/continuation alternative's structural implications for S1-S4, sized against the same scout evidence.",
        expectedOutputs: ['agent-report.md: bounded answer naming structural decisions needed now vs. reopened later, one adjacent risk, whether it changes the other two candidates'],
      },
    ],
  },
});
console.log('SPECIALIST_DISPATCH_DONE');
console.log(JSON.stringify({ coordinationId: result.coordinationId, status: result.status, steps: result.steps?.map((s) => ({ as: s.as, status: s.status })) }, null, 2));
