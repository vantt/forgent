// Phase 10 (Step 09) cell P10.3: runtime proof for the new, real, committed,
// opt-in `group-thinking-nominal-group-lite.yaml` definition (never the
// Phase 08 proof fixture `deliberation-nominal-group-chain.yaml`, which this
// file does not import or reference). Follows
// `coordination-deliberation-method-chains.test.mjs`'s own established
// method-chain proof style: real dispatched subprocesses through the real
// `dispatchDeclaredOperation`/`authorizeDeclaredOperation` doors, real
// `linkSessionContribution`, and a chat-history-free reconstruction from
// `replaySession`'s own projection alone.
//
// This file also proves, live (not merely declared in the schema), the
// per-actor provider/tier requirement Phase 10's own user-driven addendum
// asks at least one of P10.2/P10.3/P10.4 to cover: the facilitator role and
// the participant role dispatch through two genuinely DIFFERENT registered
// executors, via `dispatchDeclaredOperation`'s `cliPolicy` parameter -- the
// one scope `assertNoPortableExecutorPin` (session-engine.mjs) legally
// allows to carry a literal `preferExecutor` pin. `spec.actors[].policy`
// itself declares the portable, legal half of per-actor policy
// (`minTier`, differing by role) -- see the fixture's own header comment
// for why a literal executor pin cannot legally live there.
//
// No formal tally/winner semantics are exercised or asserted anywhere in
// this file, matching the fixture's own out-of-scope declaration.

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
import { replaySession } from '../../src/runner/coordination/replay.mjs';
import { CoordinationError } from '../../src/runner/coordination/schema.mjs';

const NOMINAL_GROUP_LITE_ID = 'core.coordination-protocol.group-thinking-nominal-group-lite';

function mkTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-nominal-group-lite-test-'));
}

function driver() {
  return { type: 'driver', id: 'coordinator-1' };
}

function writeExecutorScript(tempDir, label) {
  const executorScript = path.join(tempDir, `fake-ngl-executor-${label}-${Math.random().toString(36).slice(2)}.mjs`);
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

/** Two REGISTERED executors -- `exec-facilitator` (provider family-facilitator)
 *  and `exec-participant` (provider family-participant) -- same registered-
 *  executor shape `coordination-visibility-window-fixture.test.mjs`'s own
 *  `fakeCohortRunnerConfig` uses, not invented for this file. The bare
 *  `executor` default is also wired so a call that supplies no `cliPolicy`
 *  (none in this file) still settles. */
function fakeRunnerConfig(tempDir) {
  const scriptFacilitator = writeExecutorScript(tempDir, 'exec-facilitator');
  const scriptParticipant = writeExecutorScript(tempDir, 'exec-participant');
  return {
    executor: { allowCrossProvider: true, command: process.execPath, args: [scriptFacilitator, '{prompt}'] },
    executors: {
      'exec-facilitator': {
        kind: 'agent',
        providerModel: 'family-facilitator',
        allowCrossProvider: true,
        invocations: [{ via: 'cli', adapter: 'cli-spawn', command: process.execPath, args: [scriptFacilitator, '{prompt}'] }],
      },
      'exec-participant': {
        kind: 'agent',
        providerModel: 'family-participant',
        allowCrossProvider: true,
        invocations: [{ via: 'cli', adapter: 'cli-spawn', command: process.execPath, args: [scriptParticipant, '{prompt}'] }],
      },
    },
    modelPolicies: {
      claude: { lightweight: 'test-model', standard: 'test-model' },
      'family-facilitator': { lightweight: 'test-model', standard: 'test-model' },
      'family-participant': { lightweight: 'test-model', standard: 'test-model' },
    },
    timeoutMs: 8000,
  };
}

function openSession(coordinationId) {
  const tempDir = mkTempDir();
  const opts = { cwd: tempDir, repoRoot: tempDir };
  openDeclaredProtocolSession(
    { definitionId: NOMINAL_GROUP_LITE_ID, coordinationId, objective: 'Run one Nominal-Group-Lite round.', writerId: 'coordinator-1' },
    opts,
  );
  return { tempDir, opts, runnerConfig: fakeRunnerConfig(tempDir) };
}

/** Same actor-scoped `taskKey`/read-back-off-independent-replay pattern
 *  `coordination-deliberation-method-chains.test.mjs`'s own `dispatch()`
 *  helper uses (three operations here bind to more than one actor, so the
 *  default `declared:<operationId>` taskKey would collide across them).
 *  `cliPolicy` is forwarded when supplied -- the one legal channel for a
 *  literal `preferExecutor` pin (see the fixture's own header comment). */
async function dispatch(coordinationId, ctx, operationId, targetActorId, { cliPolicy } = {}) {
  const dispatchResult = await dispatchDeclaredOperation(
    coordinationId,
    {
      operationId,
      targetActorId,
      taskKey: `declared:${operationId}:${targetActorId}`,
      objective: `${operationId} pass for ${targetActorId}.`,
      expectedOutputs: ['agent-result.json (status, summary)'],
      writerId: 'coordinator-1',
      ...(cliPolicy ? { cliPolicy } : {}),
    },
    { ...ctx.opts, runnerConfig: ctx.runnerConfig },
  );
  const replayed = replaySession(coordinationId, ctx.opts);
  const created = [...replayed.assignments].reverse().find((entry) => entry.actorId === targetActorId);
  assert.ok(created, `expected an assignment-created event for "${targetActorId}" performing "${operationId}"`);
  return { assignmentId: created.assignmentId, dispatchResult };
}

function link(coordinationId, ctx, params) {
  return linkSessionContribution(coordinationId, { linkedBy: driver(), roundKey: 'round-1', ...params }, ctx.opts);
}

let authCounter = 0;

/** Same required-field shape `coordination-deliberation-method-chains
 *  .test.mjs`'s own `clarifyAuthorization()` helper uses -- an
 *  auto-incrementing `authorizationId`/`invocationKey` pair so this file's
 *  three tests, and repeated calls within one test, never collide. */
function authorizeOp(operationId, targetActorId, overrides = {}) {
  authCounter += 1;
  return {
    operationId,
    targetActorId,
    authorizationId: `auth_${operationId}_${authCounter}`,
    invocationKey: `${operationId}:${authCounter}`,
    authorizedBy: driver(),
    reason: `Authorize ${operationId} for ${targetActorId}.`,
    grantedContextRefs: [],
    ...overrides,
  };
}

test('Nominal-Group-Lite chain: three private proposals, controlled share, clarification, three private ranks -- all through the real mediated doors, and chat-history-free replay', async () => {
  const coordinationId = 'ngl-e2e';
  const ctx = openSession(coordinationId);

  // Phase 1: three participants privately propose. private-open is
  // vacuously open from session start (opensAfter.operationRefs: []), so
  // each Run may settle immediately -- no authorization event needed
  // (the binding is `required`, not driver-authorized).
  const proposeA = await dispatch(coordinationId, ctx, 'private-propose', 'participant-a');
  const proposeB = await dispatch(coordinationId, ctx, 'private-propose', 'participant-b');
  const proposeC = await dispatch(coordinationId, ctx, 'private-propose', 'participant-c');

  const proposalIdA = 'contrib_proposal_a';
  const proposalIdB = 'contrib_proposal_b';
  const proposalIdC = 'contrib_proposal_c';
  link(coordinationId, ctx, {
    contributionId: proposalIdA,
    operationRef: 'private-propose',
    type: 'proposal',
    assignmentId: proposeA.assignmentId,
  });
  link(coordinationId, ctx, {
    contributionId: proposalIdB,
    operationRef: 'private-propose',
    type: 'proposal',
    assignmentId: proposeB.assignmentId,
  });
  link(coordinationId, ctx, {
    contributionId: proposalIdC,
    operationRef: 'private-propose',
    type: 'proposal',
    assignmentId: proposeC.assignmentId,
  });

  // The `share` binding is driver-authorized and gated by `shared`, which
  // opens only once ALL THREE private-propose bindings have settled.
  authorizeDeclaredOperation(coordinationId, authorizeOp('share', 'facilitator-actor', { grantedContextRefs: [proposeA.assignmentId, proposeB.assignmentId, proposeC.assignmentId] }), ctx.opts);
  const shareResult = await dispatch(coordinationId, ctx, 'share', 'facilitator-actor');

  // Phase 3: clarify, gated by `clarified` (opens once `share` settles --
  // a real, later, different operation, never the self-referential shape
  // P08.3's Design Notes name as structurally impossible on this engine).
  authorizeDeclaredOperation(coordinationId, authorizeOp('clarify', 'facilitator-actor', { grantedContextRefs: [shareResult.assignmentId] }), ctx.opts);
  const clarifyResult = await dispatch(coordinationId, ctx, 'clarify', 'facilitator-actor');
  const clarificationId = 'contrib_clarification_1';
  link(coordinationId, ctx, {
    contributionId: clarificationId,
    operationRef: 'clarify',
    type: 'clarification',
    assignmentId: clarifyResult.assignmentId,
    anchors: [proposalIdA, proposalIdB, proposalIdC],
  });

  // Phase 4: private ranks, gated by `ranking-open` (opens once `clarify`
  // settles).
  const rankA = await dispatch(coordinationId, ctx, 'private-rank', 'participant-a');
  const rankB = await dispatch(coordinationId, ctx, 'private-rank', 'participant-b');
  const rankC = await dispatch(coordinationId, ctx, 'private-rank', 'participant-c');
  link(coordinationId, ctx, { contributionId: 'contrib_rank_a', operationRef: 'private-rank', type: 'rank', assignmentId: rankA.assignmentId, anchors: [clarificationId] });
  link(coordinationId, ctx, { contributionId: 'contrib_rank_b', operationRef: 'private-rank', type: 'rank', assignmentId: rankB.assignmentId, anchors: [clarificationId] });
  link(coordinationId, ctx, { contributionId: 'contrib_rank_c', operationRef: 'private-rank', type: 'rank', assignmentId: rankC.assignmentId, anchors: [clarificationId] });

  // ── Chat-history-free replay reconstruction ────────────────────────────
  const replayed = replaySession(coordinationId, ctx.opts);
  const byId = Object.fromEntries(replayed.contributions.map((c) => [c.contributionId, c]));

  assert.equal(replayed.contributions.length, 7, 'three proposals, one clarification, three ranks');
  assert.equal(byId[proposalIdA].type, 'proposal');
  assert.equal(byId[proposalIdB].type, 'proposal');
  assert.equal(byId[proposalIdC].type, 'proposal');
  assert.equal(byId[clarificationId].type, 'clarification');
  assert.deepEqual([...byId[clarificationId].anchors].sort(), [proposalIdA, proposalIdB, proposalIdC].sort());
  assert.equal(byId['contrib_rank_a'].type, 'rank');
  assert.equal(byId['contrib_rank_b'].type, 'rank');
  assert.equal(byId['contrib_rank_c'].type, 'rank');
  for (const rankId of ['contrib_rank_a', 'contrib_rank_b', 'contrib_rank_c']) {
    assert.deepEqual(byId[rankId].anchors, [clarificationId]);
  }

  // No tally/winner artifact of any kind: the definition declares no
  // `completion.aggregation` (this file's own header explains why), so
  // replay's own projection carries zero aggregation-validated events, and
  // this test computes no reduction over the three ranks -- it only asserts
  // each is a distinct, durable, per-participant ledger entry.
  assert.deepEqual(replayed.aggregations, [], 'no aggregation-validated event exists -- this protocol declares no completion.aggregation and computes no tally/winner');
});

test('Nominal-Group-Lite privacy shape: the facilitator cannot be authorized to share until ALL THREE private proposals have settled -- proven against real dispatch, not merely against the schema', async () => {
  const coordinationId = 'ngl-privacy';
  const ctx = openSession(coordinationId);

  assert.throws(
    () => authorizeDeclaredOperation(coordinationId, authorizeOp('share', 'facilitator-actor'), ctx.opts),
    (err) => err instanceof CoordinationError && /visibility window "shared" to be open/.test(err.message),
    'no participant has proposed yet -- the shared window must still be shut',
  );
  assert.equal(replaySession(coordinationId, ctx.opts).authorizations.length, 0, 'the refused authorization must write nothing');

  const a = await dispatch(coordinationId, ctx, 'private-propose', 'participant-a');
  const b = await dispatch(coordinationId, ctx, 'private-propose', 'participant-b');

  assert.throws(
    () => authorizeDeclaredOperation(coordinationId, authorizeOp('share', 'facilitator-actor', { grantedContextRefs: [a.assignmentId, b.assignmentId] }), ctx.opts),
    (err) => err instanceof CoordinationError && /visibility window "shared" to be open/.test(err.message),
    'only two of three participants have proposed -- a PARTIAL cohort never opens the window (flow-definition.md Visibility Windows: "an operation bound to several actors... is satisfied only when every binding of it is")',
  );

  const c = await dispatch(coordinationId, ctx, 'private-propose', 'participant-c');

  // Now the full cohort has settled -- authorization succeeds.
  const granted = authorizeDeclaredOperation(coordinationId, authorizeOp('share', 'facilitator-actor', { grantedContextRefs: [a.assignmentId, b.assignmentId, c.assignmentId] }), ctx.opts);
  assert.equal(granted.appended, true);
  const shared = await dispatch(coordinationId, ctx, 'share', 'facilitator-actor');
  assert.ok(shared.assignmentId, 'share dispatches cleanly once the full cohort has proposed');
});

test('Nominal-Group-Lite per-actor provider/tier: the facilitator role and the participant role dispatch through two genuinely DIFFERENT registered executors, proven live via cliPolicy -- the definition itself declares only the legal, portable minTier half of per-actor policy', async () => {
  const coordinationId = 'ngl-per-actor-executor';
  const ctx = openSession(coordinationId);

  const propose = await dispatch(coordinationId, ctx, 'private-propose', 'participant-a', {
    cliPolicy: { preferExecutor: 'exec-participant' },
  });
  const b = await dispatch(coordinationId, ctx, 'private-propose', 'participant-b', { cliPolicy: { preferExecutor: 'exec-participant' } });
  const c = await dispatch(coordinationId, ctx, 'private-propose', 'participant-c', { cliPolicy: { preferExecutor: 'exec-participant' } });

  authorizeDeclaredOperation(
    coordinationId,
    authorizeOp('share', 'facilitator-actor', { grantedContextRefs: [propose.assignmentId, b.assignmentId, c.assignmentId] }),
    ctx.opts,
  );
  const share = await dispatch(coordinationId, ctx, 'share', 'facilitator-actor', { cliPolicy: { preferExecutor: 'exec-facilitator' } });

  const participantProvenance = propose.dispatchResult.runResult.policy.provenance;
  const facilitatorProvenance = share.dispatchResult.runResult.policy.provenance;

  assert.equal(participantProvenance.executor.value, 'exec-participant');
  assert.equal(participantProvenance.provider.value, 'family-participant');
  assert.equal(facilitatorProvenance.executor.value, 'exec-facilitator');
  assert.equal(facilitatorProvenance.provider.value, 'family-facilitator');
  assert.notEqual(
    participantProvenance.executor.value,
    facilitatorProvenance.executor.value,
    'the facilitator and participant roles must genuinely resolve to different executors, not both fall back to one global default',
  );
  assert.notEqual(participantProvenance.provider.value, facilitatorProvenance.provider.value);
  // The literal executor pin is sourced to the "cli" scope, never to
  // "actor" -- `spec.actors[].policy` (this fixture) legally carries only
  // `minTier`; the executor pin lives at the one scope allowed to carry one.
  assert.deepEqual(participantProvenance.executor.source, { scope: 'cli', id: 'cli' });
  assert.deepEqual(facilitatorProvenance.executor.source, { scope: 'cli', id: 'cli' });
  // The definition's OWN portable minTier declaration is genuinely read and
  // resolved (not merely present, unread, in the YAML) -- proven by the
  // ACTUAL resolved tier value differing by role, matching each role's own
  // `spec.actors[].policy.minTier` declaration. The provenance SOURCE
  // labels below are a real, pre-existing resolution-granularity limit of
  // `resolveAssignmentDispatchPolicy` (session-engine.mjs), found empirically
  // while building this proof, not introduced by this cell: a tier strictly
  // BELOW the hardcoded 'standard' default floor threads through the inline
  // Assignment contract and is labeled generically `{scope: 'opPolicy'}`
  // (never the finer FlowDefinition scope that actually declared it), and a
  // tier EQUAL to that same 'standard' floor is indistinguishable from never
  // having been declared at all (`{scope: 'default'}`) -- `resolveStrongerTier`'s
  // own `>` (never `>=`) comparison against the default floor. Only a tier
  // STRICTLY ABOVE 'standard' would attribute to the real declaring scope.
  assert.equal(participantProvenance.tier.value, 'lightweight');
  assert.equal(participantProvenance.tier.source.scope, 'opPolicy');
  assert.equal(facilitatorProvenance.tier.value, 'standard');
  assert.equal(facilitatorProvenance.tier.source.scope, 'default');
});
