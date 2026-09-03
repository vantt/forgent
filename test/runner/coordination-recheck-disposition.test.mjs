// Phase 03 R1-R4: artifact refs through the existing RunResult/evidence
// path, recheck as a genuinely NEW Assignment (never a retry of the
// original), the `driver-disposition-recorded` driver event, and replay
// reconstruction of all of it from `events.jsonl`/`session.json` alone.
//
// Same harness shape as coordination-driver-authorization.test.mjs: a
// project-tier CoordinationProtocol fixture loaded through the REAL
// protocol-loader, and a real Node subprocess as the executor -- never a
// JS-level stub over executeAssignment, and never an edit to a shipped core
// fixture.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  openDeclaredProtocolSession,
  dispatchDeclaredOperation,
  authorizeDeclaredOperation,
} from '../../src/runner/coordination/session-engine.mjs';
import {
  authorizeOperation,
  recordDriverDisposition,
  readSessionEvents,
  readManifest,
  transitionSessionStatus,
  resolveSessionPaths,
} from '../../src/runner/coordination/store.mjs';
import { replaySession } from '../../src/runner/coordination/replay.mjs';
import { CoordinationError, validateEventPayload } from '../../src/runner/coordination/schema.mjs';

const DEFINITION_ID = 'test.coordination-protocol.recheck-disposition';

function mkTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-recheck-disposition-test-'));
}

// `produce-candidate` and `review-candidate` are ordinary `required`
// bindings (the original first pass); `reviewer-recheck` is the
// driver-authorized recheck of the SAME actor at a DIFFERENT node -- the
// exact shape the contract's "Recheck Is Not Retry" clause governs.
function writeFixture(tempDir) {
  const dir = path.join(tempDir, '.fgos', 'coordination-protocols');
  fs.mkdirSync(dir, { recursive: true });
  const definition = {
    apiVersion: 'fgos.dev/v1alpha1',
    kind: 'FlowDefinition',
    metadata: { id: DEFINITION_ID, version: '1.0.0' },
    spec: {
      profile: { kind: 'CoordinationProtocol' },
      roles: ['doer', 'reviewer'],
      actors: [
        { id: 'doer', role: 'doer' },
        { id: 'reviewer', role: 'reviewer' },
      ],
      operations: [
        { id: 'produce-candidate', role: 'doer', result: { kind: 'work-product', evidenceRequired: 'reported' } },
        { id: 'review-candidate', role: 'reviewer', result: { kind: 'advisory', evidenceRequired: 'reported' } },
        { id: 'reviewer-recheck', role: 'reviewer', result: { kind: 'advisory', evidenceRequired: 'reported' } },
      ],
      graph: {
        entry: 'phase-produce',
        nodes: [
          { id: 'phase-produce', operations: [{ ref: 'produce-candidate', actor: 'doer' }], transitions: ['phase-first-pass'] },
          { id: 'phase-first-pass', operations: [{ ref: 'review-candidate', actor: 'reviewer' }], transitions: ['phase-recheck'] },
          {
            id: 'phase-recheck',
            operations: [{ ref: 'reviewer-recheck', actor: 'reviewer', activation: { mode: 'driver-authorized' } }],
            transitions: [],
          },
        ],
      },
    },
  };
  fs.writeFileSync(path.join(dir, 'recheck-disposition.json'), `${JSON.stringify(definition, null, 2)}\n`);
}

function fakeExecutor(tempDir, { summary = 'Validated.' } = {}) {
  const executorScript = path.join(tempDir, `fake-executor-${Math.random().toString(36).slice(2)}.mjs`);
  fs.writeFileSync(
    executorScript,
    `
    import fs from 'node:fs';
    import path from 'node:path';
    const cwd = process.cwd();
    const assignmentsRoot = path.join(cwd, '.fgos', 'assignments');
    if (fs.existsSync(assignmentsRoot)) {
      for (const asgn of fs.readdirSync(assignmentsRoot)) {
        const runsDir = path.join(assignmentsRoot, asgn, 'runs');
        if (!fs.existsSync(runsDir)) continue;
        for (const run of fs.readdirSync(runsDir)) {
          const runDir = path.join(runsDir, run);
          if (fs.existsSync(runDir) && !fs.existsSync(path.join(runDir, 'agent-result.json'))) {
            fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Report\\n${summary}\\n');
            fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ status: 'done', summary: '${summary}' }));
          }
        }
      }
    }
    process.stdout.write('${summary}\\n');
    process.exit(0);
    `,
  );
  return {
    executor: { allowCrossProvider: true, command: process.execPath, args: [executorScript, '{prompt}'] },
    models: { standard: 'test-model', lightweight: 'test-model', creative: 'test-model', analytical: 'test-model', critical: 'test-model' },
    timeoutMs: 5000,
  };
}

function setup(coordinationId) {
  const tempDir = mkTempDir();
  writeFixture(tempDir);
  openDeclaredProtocolSession(
    {
      definitionId: DEFINITION_ID,
      coordinationId,
      objective: 'Prove recheck creates a new Assignment and disposition is a driver event.',
      writerId: 'coordinator-1',
    },
    { cwd: tempDir },
  );
  return { tempDir, runnerConfig: fakeExecutor(tempDir), opts: { cwd: tempDir, repoRoot: tempDir } };
}

function dispatchOperation(coordinationId, ctx, operationId, targetActorId, overrides = {}) {
  return dispatchDeclaredOperation(
    coordinationId,
    {
      operationId,
      targetActorId,
      objective: `Run ${operationId}.`,
      expectedOutputs: ['agent-result.json (status, summary)'],
      writerId: 'coordinator-1',
      ...overrides,
    },
    { ...ctx.opts, runnerConfig: ctx.runnerConfig },
  );
}

const produce = (id, ctx, overrides) => dispatchOperation(id, ctx, 'produce-candidate', 'doer', overrides);
const review = (id, ctx, overrides) => dispatchOperation(id, ctx, 'review-candidate', 'reviewer', overrides);
const recheck = (id, ctx, overrides) => dispatchOperation(id, ctx, 'reviewer-recheck', 'reviewer', overrides);

function authorization(overrides = {}) {
  return {
    operationId: 'reviewer-recheck',
    targetActorId: 'reviewer',
    authorizationId: 'auth_recheck_1',
    invocationKey: 'recheck:candidate@2',
    authorizedBy: { type: 'driver', id: 'coordinator-1' },
    reason: 'The candidate was revised; recheck the new revision.',
    grantedContextRefs: [],
    ...overrides,
  };
}

function disposition(overrides = {}) {
  return {
    targetRef: 'artifact:candidate@2',
    disposition: 'accepted',
    rationale: 'Recheck confirmed the revision addresses every finding.',
    evidenceRefs: [],
    authorizedBy: { type: 'driver', id: 'coordinator-1' },
    ...overrides,
  };
}

function claimedTaskKeys(coordinationId, ctx) {
  const { sessionDir } = resolveSessionPaths(coordinationId, ctx.opts);
  const tasksDir = path.join(sessionDir, 'tasks');
  if (!fs.existsSync(tasksDir)) return [];
  return fs
    .readdirSync(tasksDir)
    .map((file) => JSON.parse(fs.readFileSync(path.join(tasksDir, file), 'utf8')))
    .map((claim) => claim.taskKey);
}

// ─── R1: artifact refs ride the EXISTING RunResult/evidence path ───────────

test('R1: produced artifact refs live on the RunResult, and the session links them without storing a second copy', async () => {
  const ctx = setup('coord_rd_artifacts');
  const produced = await produce('coord_rd_artifacts', ctx);

  // The artifact refs are the runner's own `evidence.artifacts`, already
  // rooted under `.fgos/assignments/<id>/runs/<NN>/` -- the existing path,
  // not a coordination-owned one.
  const artifactRefs = produced.runResult.evidence.artifacts;
  assert.ok(artifactRefs.length > 0, 'the produce Assignment must have produced at least one worker artifact');
  for (const ref of artifactRefs) {
    assert.ok(ref.startsWith(path.join('.fgos', 'assignments', produced.assignment.assignmentId)), `artifact ref "${ref}" must resolve under the producing Assignment's own run directory`);
    assert.ok(fs.existsSync(path.join(ctx.tempDir, ref)), `artifact ref "${ref}" must resolve to a real file`);
  }

  // CoordinationSession is not a second artifact authority: its directory
  // holds only the manifest, the event log, and the task-claim records.
  const { sessionDir } = resolveSessionPaths('coord_rd_artifacts', ctx.opts);
  assert.deepEqual(fs.readdirSync(sessionDir).sort(), ['events.jsonl', 'session.json', 'tasks']);

  // The session LINKS the refs: the authorization names the artifact
  // revision being rechecked and grants exactly those refs, and the recheck
  // reads them through the same grant ceiling R6 already enforces.
  authorizeDeclaredOperation(
    'coord_rd_artifacts',
    authorization({ grantedContextRefs: artifactRefs, targetArtifactRef: artifactRefs[0] }),
    ctx.opts,
  );
  const rechecked = await recheck('coord_rd_artifacts', ctx, { contextRefs: artifactRefs });
  assert.deepEqual(rechecked.assignment.provenance.inline.contract.contextRefs, artifactRefs);

  const events = readSessionEvents('coord_rd_artifacts', ctx.opts);
  const created = events.find((e) => e.type === 'assignment-created' && e.payload.assignmentId === rechecked.assignment.assignmentId);
  assert.deepEqual(created.payload.contextGrant, { refs: artifactRefs });
  const authorized = events.find((e) => e.type === 'operation-authorized');
  assert.equal(authorized.payload.targetArtifactRef, artifactRefs[0]);

  // No artifact bytes were copied anywhere under the session directory.
  assert.deepEqual(fs.readdirSync(sessionDir).sort(), ['events.jsonl', 'session.json', 'tasks']);
});

test('R1: an artifact ref the driver never granted is still refused for a recheck', async () => {
  const ctx = setup('coord_rd_artifacts_ungranted');
  const produced = await produce('coord_rd_artifacts_ungranted', ctx);
  const artifactRefs = produced.runResult.evidence.artifacts;

  authorizeDeclaredOperation('coord_rd_artifacts_ungranted', authorization({ grantedContextRefs: [] }), ctx.opts);

  await assert.rejects(
    recheck('coord_rd_artifacts_ungranted', ctx, { contextRefs: artifactRefs }),
    (err) => err instanceof CoordinationError && /is not granted by authorization/.test(err.message),
  );
  assert.equal(readManifest('coord_rd_artifacts_ungranted', ctx.opts).assignmentRefs.length, 1);
});

test('R1: a targetArtifactRef naming another session is refused at both the definition-aware door and the dispatch gate', async () => {
  const ctx = setup('coord_rd_artifact_foreign');
  openDeclaredProtocolSession(
    { definitionId: DEFINITION_ID, coordinationId: 'coord_rd_artifact_other', objective: 'A different session entirely.', writerId: 'coordinator-1' },
    ctx.opts,
  );

  const foreignRef = path.join('.fgos', 'coordination', 'sessions', 'coord_rd_artifact_other', 'events.jsonl');
  assert.throws(
    () => authorizeDeclaredOperation('coord_rd_artifact_foreign', authorization({ targetArtifactRef: foreignRef }), ctx.opts),
    (err) => err instanceof CoordinationError && /names a different coordination session/.test(err.message),
  );
  assert.equal(readSessionEvents('coord_rd_artifact_foreign', ctx.opts).filter((e) => e.type === 'operation-authorized').length, 0);

  // Forged past that door through the raw store door (no session awareness
  // of its own), the dispatch gate still refuses.
  authorizeOperation(
    'coord_rd_artifact_foreign',
    {
      ...authorization({ targetArtifactRef: foreignRef }),
      nodeId: 'phase-recheck',
    },
    ctx.opts,
  );
  await assert.rejects(
    recheck('coord_rd_artifact_foreign', ctx),
    (err) => err instanceof CoordinationError && /names a different coordination session/.test(err.message),
  );
  assert.deepEqual(readManifest('coord_rd_artifact_foreign', ctx.opts).assignmentRefs, []);
});

// ─── R2: recheck is a NEW Assignment, never a retry of the original ────────

test('R2: a recheck materializes a new Assignment and leaves the original review Assignment and its RunResult untouched', async () => {
  const ctx = setup('coord_rd_recheck_new');
  const produced = await produce('coord_rd_recheck_new', ctx);
  const reviewed = await review('coord_rd_recheck_new', ctx);

  const reviewResultPath = path.join(
    ctx.tempDir,
    '.fgos',
    'assignments',
    reviewed.assignment.assignmentId,
    'runs',
    reviewed.runResult.runId.slice(`run_${reviewed.assignment.assignmentId}_`.length),
    'result.json',
  );
  const reviewResultBefore = fs.readFileSync(reviewResultPath, 'utf8');

  authorizeDeclaredOperation(
    'coord_rd_recheck_new',
    authorization({ targetArtifactRef: produced.runResult.evidence.artifacts[0] }),
    ctx.opts,
  );
  const rechecked = await recheck('coord_rd_recheck_new', ctx);

  assert.equal(rechecked.resumed, false);
  assert.notEqual(rechecked.assignment.assignmentId, reviewed.assignment.assignmentId);

  // The original's RunResult and verdict are neither superseded, rewritten,
  // nor deleted: its result.json is byte-identical, its `result-linked`
  // event is still the only one for it, and no `run-retried` supersession
  // was ever declared.
  assert.equal(fs.readFileSync(reviewResultPath, 'utf8'), reviewResultBefore);
  const events = readSessionEvents('coord_rd_recheck_new', ctx.opts);
  assert.equal(events.filter((e) => e.type === 'run-retried').length, 0);
  assert.equal(events.filter((e) => e.type === 'result-linked' && e.payload.assignmentId === reviewed.assignment.assignmentId).length, 1);
  assert.equal(events.filter((e) => e.type === 'result-linked' && e.payload.assignmentId === rechecked.assignment.assignmentId).length, 1);

  // Both verdicts remain readable side by side.
  assert.equal(JSON.parse(reviewResultBefore).status, 'done');
  assert.equal(rechecked.runResult.status, 'done');
  assert.deepEqual(readManifest('coord_rd_recheck_new', ctx.opts).assignmentRefs, [
    produced.assignment.assignmentId,
    reviewed.assignment.assignmentId,
    rechecked.assignment.assignmentId,
  ]);
});

test("R2: a recheck's default taskKey carries its authorizationId, so two invocations at ONE binding reach two different Assignments", async () => {
  const ctx = setup('coord_rd_recheck_taskkey');

  authorizeDeclaredOperation('coord_rd_recheck_taskkey', authorization(), ctx.opts);
  const first = await recheck('coord_rd_recheck_taskkey', ctx);

  authorizeDeclaredOperation(
    'coord_rd_recheck_taskkey',
    authorization({ authorizationId: 'auth_recheck_2', invocationKey: 'recheck:candidate@3' }),
    ctx.opts,
  );
  const second = await recheck('coord_rd_recheck_taskkey', ctx);

  assert.equal(second.resumed, false);
  assert.notEqual(second.assignment.assignmentId, first.assignment.assignmentId);
  assert.equal(readManifest('coord_rd_recheck_taskkey', ctx.opts).assignmentRefs.length, 2);

  // The keys themselves prove the discriminator is the authorization, not a
  // coincidence of ordering: neither can ever be claim-equal to the other,
  // nor to a key derived from nodeId+operationId+actorId alone.
  const keys = claimedTaskKeys('coord_rd_recheck_taskkey', ctx).sort();
  assert.deepEqual(keys, ['declared:reviewer-recheck:auth:auth_recheck_1', 'declared:reviewer-recheck:auth:auth_recheck_2']);
});

test('R2: a recheck whose taskKey is derived the same way as the original binding is refused, not silently resumed', async () => {
  // The exact shape "Recheck Is Not Retry" names as forbidden: deriving the
  // recheck's claim key from nodeId+operationId+actorId alone -- here, the
  // ORIGINAL first-pass review binding's own default key -- so it is
  // claim-equal to the Assignment the original review already claimed.
  const ctx = setup('coord_rd_recheck_collide');
  await produce('coord_rd_recheck_collide', ctx);
  const reviewed = await review('coord_rd_recheck_collide', ctx);
  assert.deepEqual(claimedTaskKeys('coord_rd_recheck_collide', ctx).sort(), ['declared:produce-candidate', 'declared:review-candidate']);

  authorizeDeclaredOperation('coord_rd_recheck_collide', authorization(), ctx.opts);

  await assert.rejects(
    recheck('coord_rd_recheck_collide', ctx, { taskKey: 'declared:review-candidate' }),
    (err) =>
      err instanceof CoordinationError &&
      /is not the one that Assignment consumed/.test(err.message) &&
      new RegExp(`Assignment "${reviewed.assignment.assignmentId}"`).test(err.message),
    "a recheck claim-equal to the original reviewing Assignment must be refused, never resumed as if it were that Assignment",
  );

  // The original review Assignment is untouched and the authorization is
  // still unconsumed -- nothing was silently substituted.
  assert.equal(readManifest('coord_rd_recheck_collide', ctx.opts).assignmentRefs.length, 2);
  const { authorizations } = replaySession('coord_rd_recheck_collide', ctx.opts);
  assert.equal(authorizations.length, 1);
  assert.equal(authorizations[0].consumedByAssignmentId, null);
});

test('R2: a crash-recovery resume of a recheck still lands on its own authorization-derived taskKey', async () => {
  const ctx = setup('coord_rd_recheck_resume');
  authorizeDeclaredOperation('coord_rd_recheck_resume', authorization(), ctx.opts);
  const first = await recheck('coord_rd_recheck_resume', ctx);

  // No further authorization was issued, so a repeat call resolves to the
  // SAME already-consumed authorization and therefore the SAME taskKey --
  // an idempotent resume, not a second invocation.
  const second = await recheck('coord_rd_recheck_resume', ctx);
  assert.equal(second.resumed, true);
  assert.equal(second.assignment.assignmentId, first.assignment.assignmentId);
  assert.equal(readManifest('coord_rd_recheck_resume', ctx.opts).assignmentRefs.length, 1);
  assert.deepEqual(claimedTaskKeys('coord_rd_recheck_resume', ctx), ['declared:reviewer-recheck:auth:auth_recheck_1']);
});

// ─── R3: disposition is a driver ledger event, never a worker result ───────

test('R3: recordDriverDisposition appends driver-disposition-recorded, and no worker result carries the disposition', async () => {
  const ctx = setup('coord_rd_disposition');
  const produced = await produce('coord_rd_disposition', ctx);

  const result = recordDriverDisposition(
    'coord_rd_disposition',
    disposition({ targetRef: produced.assignment.assignmentId, evidenceRefs: produced.runResult.evidence.artifacts }),
    ctx.opts,
  );
  assert.equal(result.appended, true);

  const events = readSessionEvents('coord_rd_disposition', ctx.opts);
  const recorded = events.filter((e) => e.type === 'driver-disposition-recorded');
  assert.equal(recorded.length, 1);
  assert.equal(recorded[0].payload.targetRef, produced.assignment.assignmentId);
  assert.equal(recorded[0].payload.disposition, 'accepted');
  assert.deepEqual(recorded[0].payload.authorizedBy, { type: 'driver', id: 'coordinator-1' });
  assert.ok(recorded[0].ts, 'the event log stamps ts on every event');

  // The disposition is ledger state only: nothing about it reaches the
  // worker's own RunResult, and no worker-authored field could carry it --
  // `result-linked` accepts exactly {assignmentId, runId}.
  const runResultPath = path.join(
    ctx.tempDir,
    '.fgos',
    'assignments',
    produced.assignment.assignmentId,
    'runs',
    produced.runResult.runId.slice(`run_${produced.assignment.assignmentId}_`.length),
    'result.json',
  );
  assert.ok(!fs.readFileSync(runResultPath, 'utf8').includes('disposition'));
  assert.throws(
    () => validateEventPayload('result-linked', { assignmentId: produced.assignment.assignmentId, runId: produced.runResult.runId, disposition: 'accepted' }),
    (err) => err instanceof CoordinationError && /unknown field "disposition"/.test(err.message),
  );
});

test("R3: idempotency compares a CANONICAL shape, not raw JSON -- a repeated disposition with authorizedBy's fields in a different key order is still a no-op", async () => {
  const ctx = setup('coord_rd_disposition_key_order');

  assert.equal(
    recordDriverDisposition('coord_rd_disposition_key_order', disposition({ authorizedBy: { type: 'driver', id: 'coordinator-1' } }), ctx.opts).appended,
    true,
  );
  assert.equal(
    recordDriverDisposition('coord_rd_disposition_key_order', disposition({ authorizedBy: { id: 'coordinator-1', type: 'driver' } }), ctx.opts).appended,
    false,
    'the SAME decision with authorizedBy fields in a different key order must still be recognized as a repeat',
  );

  const recorded = readSessionEvents('coord_rd_disposition_key_order', ctx.opts).filter((e) => e.type === 'driver-disposition-recorded');
  assert.equal(recorded.length, 1);
});

test('R3: a repeated, identical disposition is an idempotent no-op; a genuinely different one appends', async () => {
  const ctx = setup('coord_rd_disposition_idempotent');

  assert.equal(recordDriverDisposition('coord_rd_disposition_idempotent', disposition(), ctx.opts).appended, true);
  assert.equal(recordDriverDisposition('coord_rd_disposition_idempotent', disposition(), ctx.opts).appended, false);
  assert.equal(
    recordDriverDisposition('coord_rd_disposition_idempotent', disposition({ disposition: 'rejected', rationale: 'The recheck found the finding unaddressed.' }), ctx.opts).appended,
    true,
  );

  const recorded = readSessionEvents('coord_rd_disposition_idempotent', ctx.opts).filter((e) => e.type === 'driver-disposition-recorded');
  assert.deepEqual(recorded.map((e) => e.payload.disposition), ['accepted', 'rejected']);
});

test("R3: a disposition whose authorizedBy.id is not the session's own driver identity is refused, with nothing appended", () => {
  const ctx = setup('coord_rd_disposition_identity');

  assert.throws(
    () => recordDriverDisposition('coord_rd_disposition_identity', disposition({ authorizedBy: { type: 'driver', id: 'someone-else' } }), ctx.opts),
    (err) =>
      err instanceof CoordinationError &&
      /is not the driver identity of session/.test(err.message) &&
      /coordinator-1/.test(err.message),
  );
  assert.equal(readSessionEvents('coord_rd_disposition_identity', ctx.opts).filter((e) => e.type === 'driver-disposition-recorded').length, 0);
});

test('R3: a disposition authored by a worker identity type is refused at validation', () => {
  const ctx = setup('coord_rd_disposition_worker');

  assert.throws(
    () => recordDriverDisposition('coord_rd_disposition_worker', disposition({ authorizedBy: { type: 'worker', id: 'reviewer' } }), ctx.opts),
    (err) => err instanceof CoordinationError && /authorizedBy\.type must be "driver"/.test(err.message),
  );
  for (const field of ['targetRef', 'disposition', 'rationale', 'evidenceRefs']) {
    const payload = disposition();
    delete payload[field];
    assert.throws(
      () => recordDriverDisposition('coord_rd_disposition_worker', payload, ctx.opts),
      (err) => err instanceof CoordinationError && new RegExp(`payload\\.${field}`).test(err.message),
      `a disposition missing "${field}" must be refused at validation`,
    );
  }
  assert.equal(readSessionEvents('coord_rd_disposition_worker', ctx.opts).filter((e) => e.type === 'driver-disposition-recorded').length, 0);
});

test('R3: a disposition is refused once the session has left active', () => {
  const ctx = setup('coord_rd_disposition_terminal');
  transitionSessionStatus('coord_rd_disposition_terminal', 'completed', {}, ctx.opts);

  assert.throws(
    () => recordDriverDisposition('coord_rd_disposition_terminal', disposition(), ctx.opts),
    (err) => err instanceof CoordinationError && /is not active/.test(err.message),
  );
  assert.equal(readSessionEvents('coord_rd_disposition_terminal', ctx.opts).filter((e) => e.type === 'driver-disposition-recorded').length, 0);
});

// ─── R4: replay reconstructs the whole loop from disk alone ────────────────

test('R4: replay reconstructs authorization, dispatch provenance, result links, recheck lineage, and disposition', async () => {
  const ctx = setup('coord_rd_replay');
  const produced = await produce('coord_rd_replay', ctx);
  const reviewed = await review('coord_rd_replay', ctx);
  const artifactRef = produced.runResult.evidence.artifacts[0];

  authorizeDeclaredOperation(
    'coord_rd_replay',
    authorization({ grantedContextRefs: [artifactRef], targetArtifactRef: artifactRef }),
    ctx.opts,
  );
  const rechecked = await recheck('coord_rd_replay', ctx, { contextRefs: [artifactRef] });
  recordDriverDisposition(
    'coord_rd_replay',
    disposition({ targetRef: artifactRef, evidenceRefs: [rechecked.assignment.assignmentId] }),
    ctx.opts,
  );

  const replayed = replaySession('coord_rd_replay', ctx.opts);

  // 1. What was authorized.
  assert.equal(replayed.authorizations.length, 1);
  assert.equal(replayed.authorizations[0].authorizationId, 'auth_recheck_1');
  assert.equal(replayed.authorizations[0].targetArtifactRef, artifactRef);
  assert.equal(replayed.authorizations[0].consumedByAssignmentId, rechecked.assignment.assignmentId);

  // 2. What was dispatched.
  assert.deepEqual(
    replayed.assignments.map((record) => record.assignmentId),
    [produced.assignment.assignmentId, reviewed.assignment.assignmentId, rechecked.assignment.assignmentId],
  );
  const recheckRecord = replayed.assignments.find((record) => record.assignmentId === rechecked.assignment.assignmentId);
  assert.equal(recheckRecord.actorId, 'reviewer');
  assert.equal(recheckRecord.operationId, 'reviewer-recheck');
  assert.equal(recheckRecord.nodeId, 'phase-recheck');
  assert.equal(recheckRecord.authorizationId, 'auth_recheck_1');
  assert.deepEqual(recheckRecord.contextGrant, { refs: [artifactRef] });

  // 3. What results linked.
  assert.deepEqual(replayed.results.map((record) => record.assignmentId), [
    produced.assignment.assignmentId,
    reviewed.assignment.assignmentId,
    rechecked.assignment.assignmentId,
  ]);
  assert.equal(replayed.results.find((r) => r.assignmentId === reviewed.assignment.assignmentId).runId, reviewed.runResult.runId);

  // 4. Which recheck followed which original, and against which artifact
  //    revision each ran -- joined through the authorization the recheck's
  //    own dispatch record names.
  const originalRecord = replayed.assignments.find((record) => record.assignmentId === reviewed.assignment.assignmentId);
  assert.equal(originalRecord.authorizationId, undefined, 'the original first-pass review needed no authorization');
  assert.equal(originalRecord.actorId, recheckRecord.actorId, 'the recheck is the same actor rechecking a new revision');
  const recheckAuthorization = replayed.authorizations.find((a) => a.authorizationId === recheckRecord.authorizationId);
  assert.equal(recheckAuthorization.targetArtifactRef, artifactRef);

  // 5. What disposition was recorded.
  assert.equal(replayed.dispositions.length, 1);
  assert.equal(replayed.dispositions[0].targetRef, artifactRef);
  assert.equal(replayed.dispositions[0].disposition, 'accepted');
  assert.deepEqual(replayed.dispositions[0].evidenceRefs, [rechecked.assignment.assignmentId]);
  assert.ok(replayed.dispositions[0].ts);

  // ...and every one of those answers comes from `events.jsonl` +
  // `session.json` alone: re-derived here straight from the two files.
  const rawEvents = readSessionEvents('coord_rd_replay', ctx.opts);
  const rawManifest = readManifest('coord_rd_replay', ctx.opts);
  assert.deepEqual(
    rawEvents.filter((e) => e.type === 'operation-authorized').map((e) => e.payload.authorizationId),
    replayed.authorizations.map((a) => a.authorizationId),
  );
  assert.deepEqual(
    rawEvents.filter((e) => e.type === 'assignment-created').map((e) => e.payload.assignmentId),
    rawManifest.assignmentRefs,
  );
  assert.deepEqual(
    rawEvents.filter((e) => e.type === 'result-linked').map((e) => e.payload.runId),
    replayed.results.map((r) => r.runId),
  );
  assert.deepEqual(
    rawEvents.filter((e) => e.type === 'driver-disposition-recorded').map((e) => e.payload.disposition),
    replayed.dispositions.map((d) => d.disposition),
  );
});

// ─── R2: the authorization-suffix fix applies on the topology-edge branch too, not only the no-edge default ───

// A driver-authorized binding reached via a declared topology edge --
// `dispatchDeclaredOperation`'s OTHER taskKey branch
// (`declared:${operationId}:round-${round}${authorizationKeySuffix}`), never
// exercised by any other test in this repo (`grep -l activation
// test/**/*.test.mjs` combined with a `topology.edges` declaration returns
// none) before this one.
function writeEdgeFixture(tempDir) {
  const dir = path.join(tempDir, '.fgos', 'coordination-protocols');
  fs.mkdirSync(dir, { recursive: true });
  const definition = {
    apiVersion: 'fgos.dev/v1alpha1',
    kind: 'FlowDefinition',
    metadata: { id: `${DEFINITION_ID}-edge`, version: '1.0.0' },
    spec: {
      profile: {
        kind: 'CoordinationProtocol',
        topology: {
          contextVisibility: 'mediated',
          edges: [{ from: 'primary', to: 'specialist', intents: ['consult'], maxRounds: 5 }],
        },
      },
      roles: ['primary', 'specialist'],
      actors: [
        { id: 'primary', role: 'primary' },
        { id: 'specialist', role: 'specialist' },
      ],
      operations: [
        { id: 'lead', role: 'primary', result: { kind: 'work-product', evidenceRequired: 'reported' } },
        { id: 'consult', role: 'specialist', result: { kind: 'advisory', evidenceRequired: 'reported' } },
      ],
      graph: {
        entry: 'phase-lead',
        nodes: [
          { id: 'phase-lead', operations: [{ ref: 'lead', actor: 'primary' }], transitions: ['phase-consult'] },
          { id: 'phase-consult', operations: [{ ref: 'consult', actor: 'specialist', activation: { mode: 'driver-authorized' } }], transitions: [] },
        ],
      },
    },
  };
  fs.writeFileSync(path.join(dir, 'recheck-disposition-edge.json'), `${JSON.stringify(definition, null, 2)}\n`);
}

test("R2 (topology-edge branch): a driver-authorized binding reached via a declared edge also gets an authorization-derived taskKey, so two invocations reach two different Assignments", async () => {
  const tempDir = mkTempDir();
  writeEdgeFixture(tempDir);
  const coordinationId = 'coord_rd_edge_taskkey';
  openDeclaredProtocolSession(
    { definitionId: `${DEFINITION_ID}-edge`, coordinationId, objective: 'Prove the round-scoped taskKey branch also gets the authorization suffix.', writerId: 'coordinator-1' },
    { cwd: tempDir },
  );
  const opts = { cwd: tempDir, repoRoot: tempDir };
  const runnerConfig = fakeExecutor(tempDir);

  const lead = await dispatchDeclaredOperation(
    coordinationId,
    { operationId: 'lead', targetActorId: 'primary', objective: 'Lead.', expectedOutputs: ['agent-result.json (status, summary)'], writerId: 'coordinator-1' },
    { ...opts, runnerConfig },
  );

  const consultOnce = () =>
    dispatchDeclaredOperation(
      coordinationId,
      {
        operationId: 'consult',
        targetActorId: 'specialist',
        fromAssignmentId: lead.assignment.assignmentId,
        objective: 'Consult.',
        expectedOutputs: ['agent-result.json (status, summary)'],
        writerId: 'coordinator-1',
      },
      { ...opts, runnerConfig },
    );

  authorizeDeclaredOperation(coordinationId, { operationId: 'consult', targetActorId: 'specialist', authorizationId: 'auth_edge_1', invocationKey: 'edge:round-a', authorizedBy: { type: 'driver', id: 'coordinator-1' }, reason: 'First consult round.', grantedContextRefs: [] }, opts);
  const first = await consultOnce();
  assert.equal(first.resumed, false);

  authorizeDeclaredOperation(coordinationId, { operationId: 'consult', targetActorId: 'specialist', authorizationId: 'auth_edge_2', invocationKey: 'edge:round-b', authorizedBy: { type: 'driver', id: 'coordinator-1' }, reason: 'Second consult round, same edge.', grantedContextRefs: [] }, opts);
  const second = await consultOnce();

  assert.equal(second.resumed, false);
  assert.notEqual(second.assignment.assignmentId, first.assignment.assignmentId);
  assert.deepEqual(readManifest(coordinationId, opts).assignmentRefs, [lead.assignment.assignmentId, first.assignment.assignmentId, second.assignment.assignmentId]);

  const keys = claimedTaskKeys(coordinationId, { opts }).filter((k) => k.startsWith('declared:consult'));
  assert.deepEqual(keys.sort(), ['declared:consult:round-1:auth:auth_edge_1', 'declared:consult:round-1:auth:auth_edge_2']);

  // Each authorized round genuinely counts against `maxRounds`, since each
  // now derives its OWN key (`isResumeOfThisRound` is false for both) --
  // before this fix, both would have collided into round 1 of 5.
  const roundEvents = readSessionEvents(coordinationId, opts).filter((e) => e.type === 'assignment-created' && e.payload.actorId === 'specialist');
  assert.equal(roundEvents.length, 2);
});

// ─── An ambiguous keyless repeat is refused, never guessed ─────────────────

test('a keyless dispatch with TWO already-consumed authorizations and none pending is refused, not silently resolved to the most recent', async () => {
  // `resolveTaskKeyAuthorization`'s fallback must not guess: once more than
  // one invocation has been consumed at a binding and none is fresh, a
  // caller omitting taskKey cannot mean any specific one of them. Guessing
  // "most recent" would silently substitute a DIFFERENT invocation's
  // Assignment/RunResult for the caller's own. The single-consumed case
  // (genuine idempotent resume) is covered separately by "R2: a
  // crash-recovery resume of a recheck...".
  const ctx = setup('coord_rd_ambiguous_repeat');
  authorizeDeclaredOperation('coord_rd_ambiguous_repeat', authorization(), ctx.opts);
  const first = await recheck('coord_rd_ambiguous_repeat', ctx);

  authorizeDeclaredOperation(
    'coord_rd_ambiguous_repeat',
    authorization({ authorizationId: 'auth_recheck_2', invocationKey: 'recheck:candidate@3' }),
    ctx.opts,
  );
  const second = await recheck('coord_rd_ambiguous_repeat', ctx);
  assert.notEqual(second.assignment.assignmentId, first.assignment.assignmentId);

  // No fresh authorization pending now (both consumed) -- a THIRD keyless
  // call must be refused, never silently resolved to `second`'s Assignment.
  await assert.rejects(
    recheck('coord_rd_ambiguous_repeat', ctx),
    (err) => err instanceof CoordinationError && /no unconsumed "operation-authorized"/.test(err.message),
    'an ambiguous keyless repeat (>1 consumed authorization, none pending) must refuse rather than guess',
  );
  assert.equal(readManifest('coord_rd_ambiguous_repeat', ctx.opts).assignmentRefs.length, 2);
});

test('R4: replay preserves both dispositions of a reject-then-recheck-then-accept round, in order', async () => {
  const ctx = setup('coord_rd_replay_dispositions');
  const produced = await produce('coord_rd_replay_dispositions', ctx);
  const artifactRef = produced.runResult.evidence.artifacts[0];

  recordDriverDisposition(
    'coord_rd_replay_dispositions',
    disposition({ targetRef: artifactRef, disposition: 'rejected', rationale: 'First pass found an unaddressed finding.' }),
    ctx.opts,
  );
  authorizeDeclaredOperation(
    'coord_rd_replay_dispositions',
    authorization({ grantedContextRefs: [artifactRef], targetArtifactRef: artifactRef }),
    ctx.opts,
  );
  const rechecked = await recheck('coord_rd_replay_dispositions', ctx, { contextRefs: [artifactRef] });
  recordDriverDisposition(
    'coord_rd_replay_dispositions',
    disposition({ targetRef: artifactRef, disposition: 'accepted', rationale: 'The recheck cleared it.', evidenceRefs: [rechecked.assignment.assignmentId] }),
    ctx.opts,
  );

  const { dispositions } = replaySession('coord_rd_replay_dispositions', ctx.opts);
  assert.deepEqual(dispositions.map((d) => d.disposition), ['rejected', 'accepted']);
  assert.deepEqual(dispositions.map((d) => d.targetRef), [artifactRef, artifactRef]);
  assert.deepEqual(dispositions[1].evidenceRefs, [rechecked.assignment.assignmentId]);
});
