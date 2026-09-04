// Phase 10 (Step 09) cell P10.2: proof for the REAL, committed, opt-in core
// fixture `core/coordination-protocols/group-thinking-rfc-review-lite.yaml`
// (never a synthesized always-allow-everything context).
//
// Chain proved: convene -> propose -> two INDEPENDENT objections (objector-a,
// objector-b) -> controlled reveal (the "reveal" visibility window, opening
// only once BOTH objectors have settled) -> a driver-authorized response
// anchoring both objections -> a driver disposition on the response through
// the existing `contribution:` ref namespace (P08.2) -- artifact-backed
// lineage, no new disposition mechanism.
//
// Same fake-executor / dispatch / link pattern
// test/runner/coordination-deliberation-method-chains.test.mjs established
// for this track's own three method-shaped fixtures -- duplicated here
// rather than imported, matching this track's own precedent that a
// test-local fixture builder is duplicated per file, not shared
// (P08.2.md/P08.3.md's Design Notes say so explicitly).

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

const RFC_REVIEW_LITE_ID = 'core.coordination-protocol.group-thinking-rfc-review-lite';

function mkTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-rfc-review-lite-test-'));
}

function driver() {
  return { type: 'driver', id: 'coordinator-1' };
}

/** Same fake-executor shape as coordination-deliberation-method-chains.test.mjs's
 *  own `fakeRunnerConfig`: a real Node subprocess, never a JS-level stub,
 *  that settles every not-yet-settled Run under `.fgos/assignments/` with a
 *  fixed report and a "done" result. */
function fakeRunnerConfig(tempDir) {
  const executorScript = path.join(tempDir, `fake-rfc-review-lite-executor-${Math.random().toString(36).slice(2)}.mjs`);
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
    modelPolicies: { claude: { lightweight: 'test-model', standard: 'test-model', critical: 'test-model' } },
    timeoutMs: 8000,
  };
}

function openProtocolSession(coordinationId, objective) {
  const tempDir = mkTempDir();
  const opts = { cwd: tempDir, repoRoot: tempDir };
  openDeclaredProtocolSession({ definitionId: RFC_REVIEW_LITE_ID, coordinationId, objective, writerId: 'coordinator-1' }, opts);
  return { tempDir, opts, runnerConfig: fakeRunnerConfig(tempDir) };
}

/** Dispatch one binding and return its Assignment id, read back off an
 *  INDEPENDENT replay (never the dispatch return value) -- matching this
 *  track's own established pattern. A distinct, actor-scoped `taskKey` is
 *  always passed: "object" binds to two different actors at one node. */
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

function respondAuthorization(overrides = {}) {
  return {
    operationId: 'respond',
    targetActorId: 'proposer-actor',
    authorizationId: 'auth_respond_1',
    invocationKey: 'respond:1',
    authorizedBy: driver(),
    reason: 'Reveal both independent objections for a driver-authorized response.',
    grantedContextRefs: [],
    ...overrides,
  };
}

test('RFC-Review-Lite: two independent objections, controlled reveal, a driver-authorized response anchoring both, and a driver disposition -- all reconstructed from replay alone', async () => {
  const coordinationId = 'rfc-review-lite-e2e';
  const ctx = openProtocolSession(coordinationId, 'Run one RFC-Review-Lite round.');

  const conveneId = await dispatch(coordinationId, ctx, 'convene', 'coordinator-actor');
  const proposeId = await dispatch(coordinationId, ctx, 'propose', 'proposer-actor');
  const proposal = link(coordinationId, ctx, { contributionId: 'rrl_proposal', type: 'proposal', assignmentId: proposeId, roundKey: 'round-1' });
  assert.equal(proposal.appended, true);

  // Two independent objectors, each recording their own objection.
  const objectAId = await dispatch(coordinationId, ctx, 'object', 'objector-a-actor');
  const objectBId = await dispatch(coordinationId, ctx, 'object', 'objector-b-actor');
  const objectionA = link(coordinationId, ctx, { contributionId: 'rrl_objection_a', type: 'objection', assignmentId: objectAId, roundKey: 'round-1', anchors: ['rrl_proposal'] });
  const objectionB = link(coordinationId, ctx, { contributionId: 'rrl_objection_b', type: 'objection', assignmentId: objectBId, roundKey: 'round-1', anchors: ['rrl_proposal'] });
  assert.equal(objectionA.appended, true);
  assert.equal(objectionB.appended, true);

  // "reveal" is now open (both objectors settled) -- the driver may authorize
  // the proposer to read both objections and respond.
  const granted = authorizeDeclaredOperation(coordinationId, respondAuthorization({ grantedContextRefs: [objectAId, objectBId] }), ctx.opts);
  assert.equal(granted.appended, true);

  const respondId = await dispatch(coordinationId, ctx, 'respond', 'proposer-actor');
  const response = link(coordinationId, ctx, {
    contributionId: 'rrl_response',
    type: 'response',
    assignmentId: respondId,
    roundKey: 'round-1',
    respondsTo: 'rrl_objection_a',
    anchors: ['rrl_objection_a', 'rrl_objection_b'],
  });
  assert.equal(response.appended, true);

  // Driver disposition on the response, through the EXISTING
  // driver-disposition-recorded door and the `contribution:` ref namespace
  // P08.2 added -- no new disposition mechanism introduced here.
  const disposition = recordDriverDisposition(
    coordinationId,
    {
      targetRef: `${CONTRIBUTION_REF_PREFIX}rrl_response`,
      disposition: 'accepted',
      rationale: 'The response satisfactorily addresses both independent objections.',
      evidenceRefs: [],
      authorizedBy: driver(),
    },
    ctx.opts,
  );
  assert.equal(disposition.appended, true);

  // ── Chat-history-free replay: reconstruct the full lineage from
  //    replaySession's projection alone.
  const replayed = replaySession(coordinationId, ctx.opts);
  const reconstructedProposal = replayed.contributions.find((c) => c.type === 'proposal');
  const reconstructedObjections = replayed.contributions.filter((c) => c.type === 'objection');
  const reconstructedResponse = replayed.contributions.find((c) => c.type === 'response');
  assert.ok(reconstructedProposal, 'the proposal must be reconstructable from replay');
  assert.equal(reconstructedObjections.length, 2, 'both independent objections must be reconstructable from replay');
  assert.ok(reconstructedResponse, 'the response must be reconstructable from replay');

  for (const objection of reconstructedObjections) {
    assert.deepEqual(objection.anchors, [reconstructedProposal.contributionId], 'replay alone must show each objection anchors the proposal it targets');
  }
  assert.deepEqual(
    [...reconstructedResponse.anchors].sort(),
    reconstructedObjections.map((o) => o.contributionId).sort(),
    'replay alone must show the response anchors BOTH independent objections, not just the one it respondsTo',
  );
  assert.equal(reconstructedResponse.respondsTo, 'rrl_objection_a');

  const resolvingDisposition = replayed.dispositions.find((d) => d.targetRef === `${CONTRIBUTION_REF_PREFIX}${reconstructedResponse.contributionId}`);
  assert.ok(resolvingDisposition, 'replay alone must show WHAT the driver disposed');
  assert.equal(resolvingDisposition.disposition, 'accepted');
  assert.deepEqual(replayed.resolvedContributionIds, [reconstructedResponse.contributionId]);
  assert.deepEqual(
    new Set(replayed.openContributionIds),
    new Set([reconstructedProposal.contributionId, ...reconstructedObjections.map((o) => o.contributionId)]),
  );

  // "convene" backs no contribution and produced none here.
  assert.equal(replayed.contributions.some((c) => c.assignmentId === conveneId), false);

  // Three distinct window provenances, one per gate -- proving the SAME
  // MVP6 mechanism was reused three times for three different purposes.
  assert.equal(reconstructedProposal.visibilityWindowRef, 'rfc-open');
  assert.deepEqual(new Set(reconstructedObjections.map((c) => c.visibilityWindowRef)), new Set(['objection-open']));
  assert.equal(reconstructedResponse.visibilityWindowRef, 'reveal');
});

test('RFC-Review-Lite: independent objections before controlled reveal -- the proposer cannot be GRANTED (and so cannot be dispatched) to read either objection until BOTH have settled', async () => {
  const coordinationId = 'rfc-review-lite-privacy';
  const ctx = openProtocolSession(coordinationId, 'Probe the controlled-reveal gate.');

  await dispatch(coordinationId, ctx, 'convene', 'coordinator-actor');
  const proposeId = await dispatch(coordinationId, ctx, 'propose', 'proposer-actor');
  link(coordinationId, ctx, { contributionId: 'rrl_proposal', type: 'proposal', assignmentId: proposeId, roundKey: 'round-1' });

  // Only objector-a has settled -- the cohort is partial, so "reveal"
  // (opensAfter EVERY binding of "object") is still closed. The proposer
  // cannot be authorized to read objector-a's objection yet, even alone.
  const objectAId = await dispatch(coordinationId, ctx, 'object', 'objector-a-actor');
  link(coordinationId, ctx, { contributionId: 'rrl_objection_a', type: 'objection', assignmentId: objectAId, roundKey: 'round-1', anchors: ['rrl_proposal'] });

  assert.throws(
    () => authorizeDeclaredOperation(coordinationId, respondAuthorization({ grantedContextRefs: [objectAId] }), ctx.opts),
    (err) => err instanceof CoordinationError && /visibility window "reveal" to be open/.test(err.message),
    'the proposer may not be granted read access to a single objection before the whole objector cohort has independently objected',
  );
  assert.equal(replaySession(coordinationId, ctx.opts).authorizations.length, 0, 'the refused authorization must write nothing');

  // The second, independent objector settles and links -- now "reveal"
  // opens, and the SAME grant that was just refused succeeds.
  const objectBId = await dispatch(coordinationId, ctx, 'object', 'objector-b-actor');
  link(coordinationId, ctx, { contributionId: 'rrl_objection_b', type: 'objection', assignmentId: objectBId, roundKey: 'round-1', anchors: ['rrl_proposal'] });
  const granted = authorizeDeclaredOperation(coordinationId, respondAuthorization({ grantedContextRefs: [objectAId, objectBId] }), ctx.opts);
  assert.equal(granted.appended, true);
});

test('RFC-Review-Lite -- vacuous-gate regression: "object" declares only "objection", so a "response" contribution through it is genuinely rejected by the real mediated door', async () => {
  const coordinationId = 'rfc-review-lite-vacuous-gate';
  const ctx = openProtocolSession(coordinationId, 'Probe the real per-operation narrowing.');
  await dispatch(coordinationId, ctx, 'convene', 'coordinator-actor');
  const proposeId = await dispatch(coordinationId, ctx, 'propose', 'proposer-actor');
  link(coordinationId, ctx, { contributionId: 'rrl_proposal', type: 'proposal', assignmentId: proposeId, roundKey: 'round-1' });
  const objectAId = await dispatch(coordinationId, ctx, 'object', 'objector-a-actor');

  assert.throws(
    () => link(coordinationId, ctx, { contributionId: 'rrl_bad', type: 'response', assignmentId: objectAId, roundKey: 'round-1', respondsTo: 'rrl_proposal' }),
    (err) => err instanceof CoordinationError && /does not declare "response" in its contributions\.allowedTypes\[\]/.test(err.message),
    '"object" declares contributions.allowedTypes: [objection] only -- a "response" must be refused, never silently legalized',
  );
  assert.equal(replaySession(coordinationId, ctx.opts).contributions.length, 1, 'only the earlier, legitimate proposal link may have written anything');
});

test('RFC-Review-Lite: the objector role\'s real, worked actor-scope PolicyPatch (policy.minTier: critical) resolves and is attributed to the ACTOR scope in the persisted RunResult', async () => {
  const coordinationId = 'rfc-review-lite-actor-policy';
  const ctx = openProtocolSession(coordinationId, 'Probe the objector role\'s real per-actor minTier requirement.');

  const dispatched = await dispatchDeclaredOperation(
    coordinationId,
    {
      operationId: 'object',
      targetActorId: 'objector-a-actor',
      taskKey: 'declared:object:objector-a-actor',
      objective: 'Independently object to the proposal.',
      expectedOutputs: ['agent-result.json (status, summary)'],
      writerId: 'coordinator-1',
    },
    { ...ctx.opts, runnerConfig: ctx.runnerConfig },
  );

  const provenance = dispatched.runResult.policy.provenance;
  assert.equal(provenance.tier.value, 'critical', 'objector-a-actor\'s own spec.actors[].policy.minTier must genuinely raise the resolved tier');
  assert.deepEqual(provenance.tier.source, { scope: 'actor', id: 'objector-a-actor' }, 'the resolved tier must be attributed to the REAL declaring scope, not a synthetic default');
});
