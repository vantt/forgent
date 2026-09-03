// Phase 02 R1-R4 tests for the driver-authorization primitive: the
// `activation` binding field's runtime effect, the `operation-authorized`
// session event (append + replay), extended `assignment-created`
// provenance, and `dispatchDeclaredOperation`'s authorization gate.
//
// Exercised against a project-tier CoordinationProtocol fixture written
// into the test's own temp `.fgos/coordination-protocols/` directory
// (`protocol-loader.mjs`'s real project tier -- never a faked/inlined
// definition, and never an edit to a shipped core fixture). The fixture
// deliberately mirrors `standalone-master-coordination-loop.yaml`'s hardest
// shape: ONE actor (`reviewer`) bound to TWO DIFFERENT operations at TWO
// DIFFERENT graph nodes, so an authorization matched by actor alone -- or by
// operation id alone -- is provably wrong.
//
// Same fake-executor pattern as coordination-declared-consult.test.mjs: a
// real Node subprocess, never a JS-level stub over executeAssignment.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { Worker } from 'node:worker_threads';
import { execFileSync } from 'node:child_process';
import {
  openDeclaredProtocolSession,
  dispatchDeclaredOperation,
  authorizeDeclaredOperation,
} from '../../src/runner/coordination/session-engine.mjs';
import {
  authorizeOperation,
  readSessionEvents,
  readManifest,
  transitionSessionStatus,
  appendEvent,
  resolveSessionPaths,
} from '../../src/runner/coordination/store.mjs';
import { replaySession } from '../../src/runner/coordination/replay.mjs';
import { CoordinationError } from '../../src/runner/coordination/schema.mjs';

const DEFINITION_ID = 'test.coordination-protocol.driver-authorized-recheck';

function mkTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-driver-auth-test-'));
}

// A project-tier definition (`<cwd>/.fgos/coordination-protocols/`), loaded
// through the REAL protocol-loader/validateFlowDefinition path. Written as
// JSON so it parses regardless of whether the optional `yaml` dependency is
// installed.
function writeFixture(tempDir, { recheckActivation = { mode: 'driver-authorized' } } = {}) {
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
            operations: [{ ref: 'reviewer-recheck', actor: 'reviewer', ...(recheckActivation ? { activation: recheckActivation } : {}) }],
            transitions: [],
          },
        ],
      },
    },
  };
  fs.writeFileSync(path.join(dir, 'driver-authorized-recheck.json'), `${JSON.stringify(definition, null, 2)}\n`);
}

function fakeExecutor(tempDir, { status = 'done', summary = 'Validated.' } = {}) {
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
            fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ status: '${status}', summary: '${summary}' }));
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

function setup(coordinationId, fixtureOptions, sessionOptions = {}) {
  const tempDir = mkTempDir();
  writeFixture(tempDir, fixtureOptions);
  openDeclaredProtocolSession(
    {
      definitionId: DEFINITION_ID,
      coordinationId,
      objective: 'Prove driver-authorized optional operations gate on a real authorization.',
      writerId: 'coordinator-1',
      ...sessionOptions,
    },
    { cwd: tempDir },
  );
  return { tempDir, runnerConfig: fakeExecutor(tempDir), opts: { cwd: tempDir, repoRoot: tempDir } };
}

// A second session in the SAME workspace, so a ref belonging to it is a
// genuinely foreign-but-on-disk ref rather than a made-up string.
function openSecondSession(tempDir, coordinationId) {
  openDeclaredProtocolSession(
    { definitionId: DEFINITION_ID, coordinationId, objective: 'A different session entirely.', writerId: 'coordinator-1' },
    { cwd: tempDir },
  );
}

function dispatchProduce(coordinationId, ctx, overrides = {}) {
  return dispatchDeclaredOperation(
    coordinationId,
    {
      operationId: 'produce-candidate',
      targetActorId: 'doer',
      objective: 'Produce the first candidate.',
      expectedOutputs: ['agent-result.json (status, summary)'],
      writerId: 'coordinator-1',
      ...overrides,
    },
    { ...ctx.opts, runnerConfig: ctx.runnerConfig },
  );
}

// The raw store door: no FlowDefinition awareness, so no binding cap and no
// grant-scope check of its own. Used below to prove the gates that matter are
// enforced where a forged record still has to pass them.
function rawAuthorize(coordinationId, ctx, overrides = {}) {
  return authorizeOperation(
    coordinationId,
    {
      authorizationId: 'auth_raw',
      operationId: 'reviewer-recheck',
      nodeId: 'phase-recheck',
      targetActorId: 'reviewer',
      invocationKey: 'recheck:raw',
      authorizedBy: { type: 'driver', id: 'coordinator-1' },
      reason: 'Written straight through the raw store door.',
      grantedContextRefs: [],
      ...overrides,
    },
    ctx.opts,
  );
}

function authorization(overrides = {}) {
  return {
    operationId: 'reviewer-recheck',
    targetActorId: 'reviewer',
    authorizationId: 'auth_recheck_1',
    invocationKey: 'recheck:candidate@2',
    authorizedBy: { type: 'driver', id: 'coordinator-1' },
    reason: 'Candidate was revised; recheck the revision.',
    grantedContextRefs: [],
    ...overrides,
  };
}

function dispatch(coordinationId, ctx, overrides = {}) {
  return dispatchDeclaredOperation(
    coordinationId,
    {
      operationId: 'reviewer-recheck',
      targetActorId: 'reviewer',
      objective: 'Recheck the revised candidate.',
      expectedOutputs: ['agent-result.json (status, summary)'],
      writerId: 'coordinator-1',
      ...overrides,
    },
    { ...ctx.opts, runnerConfig: ctx.runnerConfig },
  );
}

// ─── R4: the gate ──────────────────────────────────────────────────────────

test('R4: a driver-authorized binding refuses to materialize an Assignment with no preceding operation-authorized event', async () => {
  const ctx = setup('coord_da_no_auth');

  await assert.rejects(
    dispatch('coord_da_no_auth', ctx),
    (err) => err instanceof CoordinationError && /driver-authorized/.test(err.message) && /no unconsumed "operation-authorized"/.test(err.message),
  );

  const assignmentsDir = path.join(ctx.tempDir, '.fgos', 'assignments');
  assert.ok(
    !fs.existsSync(assignmentsDir) || fs.readdirSync(assignmentsDir).length === 0,
    'an unauthorized driver-authorized dispatch must create zero Assignments',
  );
  assert.deepEqual(readManifest('coord_da_no_auth', ctx.opts).assignmentRefs, []);
});

test('R3/R4: an authorized driver-authorized binding dispatches, and its assignment-created event carries operationId/nodeId/authorizationId/invocationKey/contextGrant', async () => {
  const ctx = setup('coord_da_happy');
  authorizeDeclaredOperation('coord_da_happy', authorization({ grantedContextRefs: ['artifact:candidate@2'] }), ctx.opts);

  const { assignment, runResult, resumed } = await dispatch('coord_da_happy', ctx);
  assert.equal(resumed, false);
  assert.equal(runResult.status, 'done');
  assert.equal(assignment.role, 'reviewer');

  const events = readSessionEvents('coord_da_happy', ctx.opts);
  const created = events.find((e) => e.type === 'assignment-created' && e.payload.assignmentId === assignment.assignmentId);
  assert.ok(created, 'assignment-created event must exist');
  assert.equal(created.payload.actorId, 'reviewer');
  assert.equal(created.payload.operationId, 'reviewer-recheck');
  assert.equal(created.payload.nodeId, 'phase-recheck');
  assert.equal(created.payload.authorizationId, 'auth_recheck_1');
  assert.equal(created.payload.invocationKey, 'recheck:candidate@2');
  assert.deepEqual(created.payload.contextGrant, { refs: ['artifact:candidate@2'] });

  // The authorization event itself is on the log, before the assignment.
  const authIndex = events.findIndex((e) => e.type === 'operation-authorized');
  const createdIndex = events.indexOf(created);
  assert.ok(authIndex >= 0 && authIndex < createdIndex, 'operation-authorized must precede the assignment-created it authorizes');
});

test('R4 (regression guard): a binding with NO activation is still "required" and dispatches with no authorization at all', async () => {
  const ctx = setup('coord_da_required_unchanged');

  const produced = await dispatchDeclaredOperation(
    'coord_da_required_unchanged',
    {
      operationId: 'produce-candidate',
      targetActorId: 'doer',
      objective: 'Produce the first candidate.',
      expectedOutputs: ['agent-result.json (status, summary)'],
      writerId: 'coordinator-1',
    },
    { ...ctx.opts, runnerConfig: ctx.runnerConfig },
  );
  const reviewed = await dispatchDeclaredOperation(
    'coord_da_required_unchanged',
    {
      operationId: 'review-candidate',
      targetActorId: 'reviewer',
      objective: 'Review the first candidate.',
      expectedOutputs: ['agent-result.json (status, summary)'],
      writerId: 'coordinator-1',
    },
    { ...ctx.opts, runnerConfig: ctx.runnerConfig },
  );

  assert.equal(produced.resumed, false);
  assert.equal(reviewed.resumed, false);
  const events = readSessionEvents('coord_da_required_unchanged', ctx.opts);
  assert.equal(events.filter((e) => e.type === 'operation-authorized').length, 0);
  for (const created of events.filter((e) => e.type === 'assignment-created')) {
    assert.equal(created.payload.authorizationId, undefined, 'a required binding must carry no authorization provenance');
    assert.equal(created.payload.contextGrant, undefined);
  }
});

test('R4 (regression guard): an explicit activation.mode "required" binding dispatches with no authorization', async () => {
  const ctx = setup('coord_da_explicit_required', { recheckActivation: { mode: 'required', maxInvocations: 2 } });
  const result = await dispatch('coord_da_explicit_required', ctx);
  assert.equal(result.resumed, false);
});

// ─── R4: (nodeId, operationId, targetActorId) disambiguation ───────────────

test('R4: an authorization for (phase-recheck, reviewer-recheck, reviewer) does NOT authorize the SAME actor at a DIFFERENT binding', async () => {
  // The actor `reviewer` is bound to `review-candidate` at `phase-first-pass`
  // AND to `reviewer-recheck` at `phase-recheck`. Matching an authorization by
  // actorId alone would let a recheck authorization silently authorize the
  // first-pass review binding. Here `review-candidate` is made
  // driver-authorized too, so only correct (nodeId, operationId,
  // targetActorId) triple matching can tell the two bindings apart.
  const tempDir = mkTempDir();
  const dir = path.join(tempDir, '.fgos', 'coordination-protocols');
  fs.mkdirSync(dir, { recursive: true });
  const definition = {
    apiVersion: 'fgos.dev/v1alpha1',
    kind: 'FlowDefinition',
    metadata: { id: DEFINITION_ID, version: '1.0.0' },
    spec: {
      profile: { kind: 'CoordinationProtocol' },
      roles: ['reviewer'],
      actors: [{ id: 'reviewer', role: 'reviewer' }],
      operations: [
        { id: 'review-candidate', role: 'reviewer', result: { kind: 'advisory', evidenceRequired: 'reported' } },
        { id: 'reviewer-recheck', role: 'reviewer', result: { kind: 'advisory', evidenceRequired: 'reported' } },
      ],
      graph: {
        entry: 'phase-first-pass',
        nodes: [
          {
            id: 'phase-first-pass',
            operations: [{ ref: 'review-candidate', actor: 'reviewer', activation: { mode: 'driver-authorized' } }],
            transitions: ['phase-recheck'],
          },
          {
            id: 'phase-recheck',
            operations: [{ ref: 'reviewer-recheck', actor: 'reviewer', activation: { mode: 'driver-authorized' } }],
            transitions: [],
          },
        ],
      },
    },
  };
  fs.writeFileSync(path.join(dir, 'two-bindings-one-actor.json'), `${JSON.stringify(definition, null, 2)}\n`);

  const opts = { cwd: tempDir, repoRoot: tempDir };
  const runnerConfig = fakeExecutor(tempDir);
  openDeclaredProtocolSession(
    { definitionId: DEFINITION_ID, coordinationId: 'coord_da_disambig', objective: 'Two bindings, one actor.', writerId: 'coordinator-1' },
    opts,
  );

  // Authorize ONLY the recheck binding.
  authorizeDeclaredOperation('coord_da_disambig', authorization(), opts);

  // The first-pass review binding (same actor, DIFFERENT node + operation)
  // must still be refused.
  await assert.rejects(
    dispatchDeclaredOperation(
      'coord_da_disambig',
      {
        operationId: 'review-candidate',
        targetActorId: 'reviewer',
        objective: 'Review the first candidate.',
        expectedOutputs: ['agent-result.json (status, summary)'],
        writerId: 'coordinator-1',
      },
      { ...opts, runnerConfig },
    ),
    (err) => err instanceof CoordinationError && /no unconsumed "operation-authorized"/.test(err.message),
  );
  assert.deepEqual(readManifest('coord_da_disambig', opts).assignmentRefs, []);

  // The binding the authorization actually names still dispatches.
  const recheck = await dispatchDeclaredOperation(
    'coord_da_disambig',
    {
      operationId: 'reviewer-recheck',
      targetActorId: 'reviewer',
      objective: 'Recheck the revised candidate.',
      expectedOutputs: ['agent-result.json (status, summary)'],
      writerId: 'coordinator-1',
    },
    { ...opts, runnerConfig },
  );
  assert.equal(recheck.resumed, false);
});

// Writes an arbitrary project-tier definition under the same real
// `<cwd>/.fgos/coordination-protocols/` loader path the shared `writeFixture`
// uses, for the shapes below that need their own graph rather than the
// module-level fixture's.
function writeDefinition(tempDir, fileName, spec) {
  const dir = path.join(tempDir, '.fgos', 'coordination-protocols');
  fs.mkdirSync(dir, { recursive: true });
  const definition = {
    apiVersion: 'fgos.dev/v1alpha1',
    kind: 'FlowDefinition',
    metadata: { id: DEFINITION_ID, version: '1.0.0' },
    spec: { profile: { kind: 'CoordinationProtocol' }, ...spec },
  };
  fs.writeFileSync(path.join(dir, fileName), `${JSON.stringify(definition, null, 2)}\n`);
}

test('R4: two driver-authorized operations at ONE node for the SAME actor -- an authorization for one does not authorize the other', async () => {
  // Both bindings share the SAME nodeId AND the SAME targetActorId, so the
  // only component of the (nodeId, operationId, targetActorId) triple that can
  // tell them apart is `operationId`. Matching on anything less would let the
  // recheck authorization silently materialize the first-pass review.
  const tempDir = mkTempDir();
  writeDefinition(tempDir, 'two-operations-one-node.json', {
    roles: ['reviewer'],
    actors: [{ id: 'reviewer', role: 'reviewer' }],
    operations: [
      { id: 'review-candidate', role: 'reviewer', result: { kind: 'advisory', evidenceRequired: 'reported' } },
      { id: 'reviewer-recheck', role: 'reviewer', result: { kind: 'advisory', evidenceRequired: 'reported' } },
    ],
    graph: {
      entry: 'phase-review',
      nodes: [
        {
          id: 'phase-review',
          operations: [
            { ref: 'review-candidate', actor: 'reviewer', activation: { mode: 'driver-authorized' } },
            { ref: 'reviewer-recheck', actor: 'reviewer', activation: { mode: 'driver-authorized' } },
          ],
          transitions: [],
        },
      ],
    },
  });

  const opts = { cwd: tempDir, repoRoot: tempDir };
  const runnerConfig = fakeExecutor(tempDir);
  openDeclaredProtocolSession(
    { definitionId: DEFINITION_ID, coordinationId: 'coord_da_same_node_same_actor', objective: 'Two operations, one node, one actor.', writerId: 'coordinator-1' },
    opts,
  );

  // Authorize ONLY `reviewer-recheck` at that node.
  authorizeDeclaredOperation('coord_da_same_node_same_actor', authorization(), opts);

  await assert.rejects(
    dispatchDeclaredOperation(
      'coord_da_same_node_same_actor',
      {
        operationId: 'review-candidate',
        targetActorId: 'reviewer',
        objective: 'Review the first candidate.',
        expectedOutputs: ['agent-result.json (status, summary)'],
        writerId: 'coordinator-1',
      },
      { ...opts, runnerConfig },
    ),
    (err) => err instanceof CoordinationError && /no unconsumed "operation-authorized"/.test(err.message),
    'an authorization for a DIFFERENT operation at the same node, for the same actor, must not authorize this binding',
  );
  assert.deepEqual(readManifest('coord_da_same_node_same_actor', opts).assignmentRefs, []);

  const recheck = await dispatchDeclaredOperation(
    'coord_da_same_node_same_actor',
    {
      operationId: 'reviewer-recheck',
      targetActorId: 'reviewer',
      objective: 'Recheck the revised candidate.',
      expectedOutputs: ['agent-result.json (status, summary)'],
      writerId: 'coordinator-1',
    },
    { ...opts, runnerConfig },
  );
  assert.equal(recheck.resumed, false);
});

test('R4: one operation template bound to TWO actors at ONE node -- an authorization for one actor does not authorize the other', async () => {
  // The `independent-research-fan-out-fan-in` cohort shape: ONE operation
  // template wired once per researcher inside the SAME graph node. Both
  // bindings share the SAME nodeId AND the SAME operationId, so
  // `targetActorId` is the only component of the triple that can separate
  // them.
  const tempDir = mkTempDir();
  writeDefinition(tempDir, 'one-operation-two-actors.json', {
    roles: ['researcher'],
    actors: [
      { id: 'researcher-a', role: 'researcher' },
      { id: 'researcher-b', role: 'researcher' },
    ],
    operations: [{ id: 'independent-research', role: 'researcher', result: { kind: 'work-product', evidenceRequired: 'reported' } }],
    graph: {
      entry: 'phase-fan-out',
      nodes: [
        {
          id: 'phase-fan-out',
          operations: [
            { ref: 'independent-research', actor: 'researcher-a', activation: { mode: 'driver-authorized' } },
            { ref: 'independent-research', actor: 'researcher-b', activation: { mode: 'driver-authorized' } },
          ],
          transitions: [],
        },
      ],
    },
  });

  const opts = { cwd: tempDir, repoRoot: tempDir };
  const runnerConfig = fakeExecutor(tempDir);
  openDeclaredProtocolSession(
    { definitionId: DEFINITION_ID, coordinationId: 'coord_da_one_op_two_actors', objective: 'One template, two actors, one node.', writerId: 'coordinator-1' },
    opts,
  );

  // Authorize ONLY researcher-a's branch of the cohort.
  authorizeDeclaredOperation(
    'coord_da_one_op_two_actors',
    authorization({ operationId: 'independent-research', targetActorId: 'researcher-a', invocationKey: 'research:branch-a' }),
    opts,
  );

  await assert.rejects(
    dispatchDeclaredOperation(
      'coord_da_one_op_two_actors',
      {
        operationId: 'independent-research',
        targetActorId: 'researcher-b',
        taskKey: 'research-branch-b',
        objective: 'Research branch B.',
        expectedOutputs: ['agent-result.json (status, summary)'],
        writerId: 'coordinator-1',
      },
      { ...opts, runnerConfig },
    ),
    (err) => err instanceof CoordinationError && /no unconsumed "operation-authorized"/.test(err.message),
    "an authorization for a DIFFERENT actor's binding of the same template at the same node must not authorize this one",
  );
  assert.deepEqual(readManifest('coord_da_one_op_two_actors', opts).assignmentRefs, []);

  const branchA = await dispatchDeclaredOperation(
    'coord_da_one_op_two_actors',
    {
      operationId: 'independent-research',
      targetActorId: 'researcher-a',
      taskKey: 'research-branch-a',
      objective: 'Research branch A.',
      expectedOutputs: ['agent-result.json (status, summary)'],
      writerId: 'coordinator-1',
    },
    { ...opts, runnerConfig },
  );
  assert.equal(branchA.resumed, false);
  assert.deepEqual(readManifest('coord_da_one_op_two_actors', opts).assignmentRefs, [branchA.assignment.assignmentId]);
});

test('the silent-discard guard also refuses a FAN-OUT taskKey collision -- one operation, two actors, one shared taskKey', async () => {
  // Same fixture shape as the test above, with BOTH dispatches passing the
  // IDENTICAL taskKey -- a DIFFERENT binding (targetActorId) colliding on
  // one claim, rather than the guard's original same-binding shape:
  // `resolveBindingAuthorization` never matches researcher-b's OWN,
  // still-unconsumed authorization to researcher-a's already-registered
  // Assignment, so a guard keyed only on `consumedByAssignmentId ===
  // resumedAssignmentId` would never fire and researcher-b's caller would be
  // handed researcher-a's Assignment and RunResult as its own.
  //
  // A caller-supplied taskKey is the way this collision is still reachable:
  // the default derivation now carries each invocation's own
  // `authorizationId` (see the companion test immediately below), so two
  // bindings can no longer collide on it by omission.
  const tempDir = mkTempDir();
  writeDefinition(tempDir, 'one-operation-two-actors-shared-taskkey.json', {
    roles: ['researcher'],
    actors: [
      { id: 'researcher-a', role: 'researcher' },
      { id: 'researcher-b', role: 'researcher' },
    ],
    operations: [{ id: 'independent-research', role: 'researcher', result: { kind: 'work-product', evidenceRequired: 'reported' } }],
    graph: {
      entry: 'phase-fan-out',
      nodes: [
        {
          id: 'phase-fan-out',
          operations: [
            { ref: 'independent-research', actor: 'researcher-a', activation: { mode: 'driver-authorized' } },
            { ref: 'independent-research', actor: 'researcher-b', activation: { mode: 'driver-authorized' } },
          ],
          transitions: [],
        },
      ],
    },
  });

  const opts = { cwd: tempDir, repoRoot: tempDir };
  const runnerConfig = fakeExecutor(tempDir);
  openDeclaredProtocolSession(
    { definitionId: DEFINITION_ID, coordinationId: 'coord_da_fanout_shared_taskkey', objective: 'Fan-out, one shared taskKey.', writerId: 'coordinator-1' },
    opts,
  );

  authorizeDeclaredOperation(
    'coord_da_fanout_shared_taskkey',
    authorization({ operationId: 'independent-research', targetActorId: 'researcher-a', authorizationId: 'auth_1', invocationKey: 'research:branch-a' }),
    opts,
  );
  authorizeDeclaredOperation(
    'coord_da_fanout_shared_taskkey',
    authorization({ operationId: 'independent-research', targetActorId: 'researcher-b', authorizationId: 'auth_2', invocationKey: 'research:branch-b' }),
    opts,
  );

  const dispatchSharedTaskKey = (targetActorId) =>
    dispatchDeclaredOperation(
      'coord_da_fanout_shared_taskkey',
      {
        operationId: 'independent-research',
        targetActorId,
        taskKey: 'research-shared',
        objective: `Research, actor ${targetActorId}.`,
        expectedOutputs: ['agent-result.json (status, summary)'],
        writerId: 'coordinator-1',
      },
      { ...opts, runnerConfig },
    );

  const branchA = await dispatchSharedTaskKey('researcher-a');
  assert.equal(branchA.resumed, false);

  await assert.rejects(
    dispatchSharedTaskKey('researcher-b'),
    (err) =>
      err instanceof CoordinationError &&
      /not the one that Assignment consumed/.test(err.message) &&
      new RegExp(`Assignment "${branchA.assignment.assignmentId}"`).test(err.message),
    "researcher-b's own authorization must not be silently discarded in favor of researcher-a's already-registered Assignment",
  );

  // researcher-b's authorization is untouched -- still unconsumed, still
  // available to a caller that supplies a distinct taskKey.
  assert.deepEqual(readManifest('coord_da_fanout_shared_taskkey', opts).assignmentRefs, [branchA.assignment.assignmentId]);
  const events = readSessionEvents('coord_da_fanout_shared_taskkey', opts);
  assert.equal(events.filter((e) => e.type === 'assignment-created').length, 1);
});

test('a FAN-OUT dispatch with no explicit taskKey no longer collides at all -- each branch claims its own authorization-derived key', async () => {
  // The companion to the test above: with the taskKey left to the default
  // derivation, each actor's invocation carries its OWN authorizationId, so
  // the two bindings claim two different keys and both branches really run.
  const tempDir = mkTempDir();
  writeDefinition(tempDir, 'one-operation-two-actors-default-taskkey.json', {
    roles: ['researcher'],
    actors: [
      { id: 'researcher-a', role: 'researcher' },
      { id: 'researcher-b', role: 'researcher' },
    ],
    operations: [{ id: 'independent-research', role: 'researcher', result: { kind: 'work-product', evidenceRequired: 'reported' } }],
    graph: {
      entry: 'phase-fan-out',
      nodes: [
        {
          id: 'phase-fan-out',
          operations: [
            { ref: 'independent-research', actor: 'researcher-a', activation: { mode: 'driver-authorized' } },
            { ref: 'independent-research', actor: 'researcher-b', activation: { mode: 'driver-authorized' } },
          ],
          transitions: [],
        },
      ],
    },
  });

  const opts = { cwd: tempDir, repoRoot: tempDir };
  const runnerConfig = fakeExecutor(tempDir);
  openDeclaredProtocolSession(
    { definitionId: DEFINITION_ID, coordinationId: 'coord_da_fanout_default_taskkey', objective: 'Fan-out, default taskKey.', writerId: 'coordinator-1' },
    opts,
  );

  for (const [actor, suffix] of [['researcher-a', 'a'], ['researcher-b', 'b']]) {
    authorizeDeclaredOperation(
      'coord_da_fanout_default_taskkey',
      authorization({ operationId: 'independent-research', targetActorId: actor, authorizationId: `auth_${suffix}`, invocationKey: `research:branch-${suffix}` }),
      opts,
    );
  }

  const dispatchNoTaskKey = (targetActorId) =>
    dispatchDeclaredOperation(
      'coord_da_fanout_default_taskkey',
      {
        operationId: 'independent-research',
        targetActorId,
        objective: `Research, actor ${targetActorId}.`,
        expectedOutputs: ['agent-result.json (status, summary)'],
        writerId: 'coordinator-1',
      },
      { ...opts, runnerConfig },
    );

  const branchA = await dispatchNoTaskKey('researcher-a');
  const branchB = await dispatchNoTaskKey('researcher-b');
  assert.equal(branchA.resumed, false);
  assert.equal(branchB.resumed, false);
  assert.notEqual(branchB.assignment.assignmentId, branchA.assignment.assignmentId);

  const events = readSessionEvents('coord_da_fanout_default_taskkey', opts);
  const created = events.filter((e) => e.type === 'assignment-created');
  assert.equal(created.length, 2);
  assert.deepEqual(created.map((e) => e.payload.actorId), ['researcher-a', 'researcher-b']);
  assert.deepEqual(created.map((e) => e.payload.authorizationId), ['auth_a', 'auth_b']);
});

test('the silent-discard guard does not block a genuine crash-recovery resume of its OWN unregistered claim', async () => {
  // The guard's outer condition requires `resumedAssignmentId` to already be
  // REGISTERED (`manifest.assignmentRefs.includes(resumedAssignmentId)`) --
  // load-bearing specifically against a genuine crash between the claim
  // write and the event/ref append completing (self-heal's own target
  // state), where the id is NOT yet registered. Simulated here by rolling
  // back exactly the two artifacts that crash window leaves missing, after
  // a real dispatch produced them: the `assignment-created` event and the
  // `assignmentRefs` entry. The claim file and assignment.json (never rolled
  // back) are what a real crash also leaves behind.
  const ctx = setup('coord_da_crash_resume_guard');
  authorizeDeclaredOperation('coord_da_crash_resume_guard', authorization(), ctx.opts);
  const first = await dispatch('coord_da_crash_resume_guard', ctx);
  assert.equal(first.resumed, false);
  const assignmentId = first.assignment.assignmentId;

  // Roll back EVERY event this assignment produced -- a real crash between
  // the claim/assignment.json write and `completeAssignmentRegistration`
  // happens before the dispatch/execution even starts, so no
  // `assignment-created`, `result-linked`, or run event exists yet either.
  const { eventsPath, manifestPath } = resolveSessionPaths('coord_da_crash_resume_guard', ctx.opts);
  const remainingLines = fs
    .readFileSync(eventsPath, 'utf8')
    .split('\n')
    .filter((line) => line.trim().length > 0)
    .filter((line) => JSON.parse(line).payload?.assignmentId !== assignmentId);
  fs.writeFileSync(eventsPath, `${remainingLines.join('\n')}\n`);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  manifest.assignmentRefs = manifest.assignmentRefs.filter((id) => id !== assignmentId);
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  assert.equal(readSessionEvents('coord_da_crash_resume_guard', ctx.opts).filter((e) => e.payload?.assignmentId === assignmentId).length, 0);
  assert.deepEqual(readManifest('coord_da_crash_resume_guard', ctx.opts).assignmentRefs, []);
  assert.doesNotThrow(() => replaySession('coord_da_crash_resume_guard', ctx.opts), 'the simulated crash state must itself be a clean/replayable shape');

  const resumed = await dispatch('coord_da_crash_resume_guard', ctx);
  assert.equal(resumed.assignment.assignmentId, assignmentId, 'crash-recovery self-heal must resume the SAME Assignment, not be refused by the new guard');
  assert.equal(readSessionEvents('coord_da_crash_resume_guard', ctx.opts).filter((e) => e.type === 'assignment-created').length, 1);
  assert.deepEqual(readManifest('coord_da_crash_resume_guard', ctx.opts).assignmentRefs, [assignmentId]);
});

// ─── R4: authorization consumption ─────────────────────────────────────────

test('R4: one authorization cannot silently authorize a SECOND, different dispatch', async () => {
  const ctx = setup('coord_da_consume_once');
  authorizeDeclaredOperation('coord_da_consume_once', authorization(), ctx.opts);

  const first = await dispatch('coord_da_consume_once', ctx, { taskKey: 'recheck-round-1' });
  assert.equal(first.resumed, false);

  await assert.rejects(
    dispatch('coord_da_consume_once', ctx, { taskKey: 'recheck-round-2' }),
    (err) => err instanceof CoordinationError && /no unconsumed "operation-authorized"/.test(err.message),
  );
  assert.equal(readManifest('coord_da_consume_once', ctx.opts).assignmentRefs.length, 1);
});

test('R4: a resume of the SAME taskKey reuses its own already-consumed authorization instead of demanding a new one', async () => {
  const ctx = setup('coord_da_resume');
  authorizeDeclaredOperation('coord_da_resume', authorization(), ctx.opts);

  const first = await dispatch('coord_da_resume', ctx, { taskKey: 'recheck-round-1' });
  const second = await dispatch('coord_da_resume', ctx, { taskKey: 'recheck-round-1' });

  assert.equal(second.resumed, true);
  assert.equal(second.assignment.assignmentId, first.assignment.assignmentId);
  assert.equal(readManifest('coord_da_resume', ctx.opts).assignmentRefs.length, 1);
});

test('R4: a second authorization lets a genuinely new dispatch through', async () => {
  const ctx = setup('coord_da_second_auth');
  authorizeDeclaredOperation('coord_da_second_auth', authorization(), ctx.opts);
  await dispatch('coord_da_second_auth', ctx, { taskKey: 'recheck-round-1' });

  authorizeDeclaredOperation(
    'coord_da_second_auth',
    authorization({ authorizationId: 'auth_recheck_2', invocationKey: 'recheck:candidate@3' }),
    ctx.opts,
  );
  const second = await dispatch('coord_da_second_auth', ctx, { taskKey: 'recheck-round-2' });
  assert.equal(second.resumed, false);
  assert.equal(readManifest('coord_da_second_auth', ctx.opts).assignmentRefs.length, 2);
});

test('a fresh unconsumed authorization is refused rather than silently discarded by a same-taskKey resume', async () => {
  // A caller-supplied taskKey reused across two invocations of ONE binding:
  // the second, genuinely authorized invocation would otherwise be silently
  // ignored by a taskKey-collision resume that hands back the first
  // invocation's Assignment and discards the real authorization. (Left to
  // the default derivation this can no longer happen -- each invocation's
  // key carries its own authorizationId; a caller-supplied key is what still
  // reaches this shape.)
  const ctx = setup('coord_da_silent_resume_guard');
  authorizeDeclaredOperation('coord_da_silent_resume_guard', authorization(), ctx.opts);
  const first = await dispatch('coord_da_silent_resume_guard', ctx, { taskKey: 'recheck-shared' });
  assert.equal(first.resumed, false);

  authorizeDeclaredOperation(
    'coord_da_silent_resume_guard',
    authorization({ authorizationId: 'auth_recheck_2', invocationKey: 'recheck:candidate@3' }),
    ctx.opts,
  );

  await assert.rejects(
    dispatch('coord_da_silent_resume_guard', ctx, { taskKey: 'recheck-shared' }),
    (err) => err instanceof CoordinationError && /fresher unconsumed authorization "auth_recheck_2"/.test(err.message),
  );

  // Nothing new materialized, and the fresh authorization is still
  // genuinely unconsumed -- available to a caller that supplies a distinct
  // taskKey (proven by "R4: a second authorization lets a genuinely new
  // dispatch through", immediately above).
  assert.equal(readManifest('coord_da_silent_resume_guard', ctx.opts).assignmentRefs.length, 1);
});

test('a genuine idempotent resume with no fresh authorization pending is unaffected by the silent-discard guard', async () => {
  const ctx = setup('coord_da_silent_resume_ok');
  authorizeDeclaredOperation('coord_da_silent_resume_ok', authorization(), ctx.opts);
  const first = await dispatch('coord_da_silent_resume_ok', ctx);
  const second = await dispatch('coord_da_silent_resume_ok', ctx);
  assert.equal(second.resumed, true);
  assert.equal(second.assignment.assignmentId, first.assignment.assignmentId);
});

// ─── R2: authorization validity against the declared graph ─────────────────

test('R2: authorizeDeclaredOperation rejects an unknown operation, an unknown actor pairing, and a mismatched nodeId', () => {
  const ctx = setup('coord_da_unknown_refs');

  assert.throws(
    () => authorizeDeclaredOperation('coord_da_unknown_refs', authorization({ operationId: 'no-such-operation' }), ctx.opts),
    (err) => err instanceof CoordinationError && /is not declared in this protocol's spec\.operations/.test(err.message),
  );
  assert.throws(
    () => authorizeDeclaredOperation('coord_da_unknown_refs', authorization({ targetActorId: 'no-such-actor' }), ctx.opts),
    (err) => err instanceof CoordinationError && /is not wired into this protocol's graph/.test(err.message),
  );
  assert.throws(
    () => authorizeDeclaredOperation('coord_da_unknown_refs', authorization({ nodeId: 'phase-first-pass' }), ctx.opts),
    (err) => err instanceof CoordinationError && /nodeId "phase-first-pass"/.test(err.message),
  );

  assert.equal(readSessionEvents('coord_da_unknown_refs', ctx.opts).filter((e) => e.type === 'operation-authorized').length, 0);
});

test('R2: authorizeDeclaredOperation refuses to authorize a binding that is not driver-authorized', () => {
  const ctx = setup('coord_da_required_binding');
  assert.throws(
    () => authorizeDeclaredOperation('coord_da_required_binding', authorization({ operationId: 'review-candidate' }), ctx.opts),
    (err) => err instanceof CoordinationError && /activation\.mode "required"/.test(err.message),
  );
});

test('R2: authorizeDeclaredOperation is idempotent on authorizationId -- a repeated call appends no second event', () => {
  const ctx = setup('coord_da_idempotent');
  authorizeDeclaredOperation('coord_da_idempotent', authorization(), ctx.opts);
  authorizeDeclaredOperation('coord_da_idempotent', authorization(), ctx.opts);
  assert.equal(readSessionEvents('coord_da_idempotent', ctx.opts).filter((e) => e.type === 'operation-authorized').length, 1);
});

// ─── Recovery Rule point 5: terminal-session refusal ───────────────────────

test('Recovery Rule 5: an operation-authorized append is refused once the session has left active', () => {
  const ctx = setup('coord_da_terminal');
  transitionSessionStatus('coord_da_terminal', 'cancelled', { reason: 'operator stopped the loop' }, ctx.opts);

  assert.throws(
    () => authorizeDeclaredOperation('coord_da_terminal', authorization(), ctx.opts),
    (err) => err instanceof CoordinationError && /is not active/.test(err.message),
  );
  assert.equal(readSessionEvents('coord_da_terminal', ctx.opts).filter((e) => e.type === 'operation-authorized').length, 0);
});

test('Recovery Rule 5: the active-status check and the operation-authorized append share ONE held events-lock critical section', async () => {
  // A check-then-act implementation (read the manifest, THEN acquire the
  // lock and append) passes a naive "cancelled session is refused" test but
  // fails this one: here the session is still `active` at the moment
  // `authorizeOperation` is called, and only becomes terminal while a
  // CONCURRENT holder of the very same events lock is mid-transition. Only
  // an implementation whose status read happens INSIDE the same held lock
  // can observe the transition and refuse.
  const ctx = setup('coord_da_atomic');
  const { eventsPath } = resolveSessionPaths('coord_da_atomic', ctx.opts);
  const storeUrl = new URL('../../src/runner/coordination/store.mjs', import.meta.url).href;

  const workerFile = path.join(ctx.tempDir, 'terminal-transition-worker.mjs');
  fs.writeFileSync(
    workerFile,
    `
import { parentPort, workerData } from 'node:worker_threads';
import { withSessionLock, transitionSessionStatusLocked } from ${JSON.stringify(storeUrl)};

const { cwd, coordinationId, holdMs } = workerData;
function sleepSync(ms) { Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms); }

try {
  withSessionLock(
    coordinationId,
    (paths) => {
      parentPort.postMessage({ locked: true });
      sleepSync(holdMs);
      transitionSessionStatusLocked(coordinationId, 'cancelled', { reason: 'concurrent operator stop' }, paths);
    },
    { cwd },
  );
  parentPort.postMessage({ ok: true });
} catch (err) {
  parentPort.postMessage({ ok: false, error: err.message });
}
`,
  );

  const worker = new Worker(workerFile, { workerData: { cwd: ctx.tempDir, coordinationId: 'coord_da_atomic', holdMs: 400 } });
  let signalLocked;
  const locked = new Promise((resolve) => {
    signalLocked = resolve;
  });
  const finished = new Promise((resolve, reject) => {
    worker.on('message', (msg) => {
      if (msg.locked) signalLocked();
      else resolve(msg);
    });
    worker.once('error', reject);
  });
  await locked;

  // The session is STILL `active` right now -- a pre-lock read would see it.
  assert.equal(readManifest('coord_da_atomic', ctx.opts).status, 'active');

  assert.throws(
    () =>
      authorizeOperation(
        'coord_da_atomic',
        {
          authorizationId: 'auth_racing',
          operationId: 'reviewer-recheck',
          nodeId: 'phase-recheck',
          targetActorId: 'reviewer',
          invocationKey: 'recheck:racing',
          authorizedBy: { type: 'driver', id: 'coordinator-1' },
          reason: 'Racing the terminal transition.',
          grantedContextRefs: [],
        },
        ctx.opts,
      ),
    (err) => err instanceof CoordinationError && /is not active/.test(err.message),
  );

  const outcome = await finished;
  assert.ok(outcome.ok, `transition worker failed: ${outcome.error}`);
  await worker.terminate();

  assert.equal(fs.readFileSync(eventsPath, 'utf8').includes('operation-authorized'), false);
});

test('Recovery Rule 5: replay ignores an operation-authorized event that appears AFTER a terminal event, regardless of write-time ordering', () => {
  const ctx = setup('coord_da_post_terminal_replay');
  authorizeDeclaredOperation('coord_da_post_terminal_replay', authorization(), ctx.opts);
  transitionSessionStatus('coord_da_post_terminal_replay', 'cancelled', { reason: 'stopped' }, ctx.opts);

  // Simulate a write that landed after the terminal event anyway (a
  // hand-crafted log, or a write-time race a future implementation change
  // could reintroduce): replay must neutralize it from disk, not trust it.
  const { eventsPath, sessionDir } = resolveSessionPaths('coord_da_post_terminal_replay', ctx.opts);
  appendEvent(
    eventsPath,
    {
      type: 'operation-authorized',
      payload: {
        authorizationId: 'auth_after_terminal',
        operationId: 'reviewer-recheck',
        nodeId: 'phase-recheck',
        targetActorId: 'reviewer',
        invocationKey: 'recheck:after-terminal',
        authorizedBy: { type: 'driver', id: 'coordinator-1' },
        reason: 'Written after the session closed.',
        grantedContextRefs: [],
      },
    },
    sessionDir,
  );

  const replayed = replaySession('coord_da_post_terminal_replay', ctx.opts);
  assert.deepEqual(replayed.authorizations.map((a) => a.authorizationId), ['auth_recheck_1']);
  assert.deepEqual(replayed.ignoredAuthorizations.map((a) => a.authorizationId), ['auth_after_terminal']);
});

test('replay marks an authorization consumed by the assignment-created event that carries its authorizationId', async () => {
  const ctx = setup('coord_da_replay_consumed');
  authorizeDeclaredOperation('coord_da_replay_consumed', authorization(), ctx.opts);

  const before = replaySession('coord_da_replay_consumed', ctx.opts);
  assert.equal(before.authorizations.length, 1);
  assert.equal(before.authorizations[0].consumedByAssignmentId, null);

  const { assignment } = await dispatch('coord_da_replay_consumed', ctx);
  const after = replaySession('coord_da_replay_consumed', ctx.opts);
  assert.equal(after.authorizations[0].consumedByAssignmentId, assignment.assignmentId);
});

test('replay fails closed on two assignment-created events claiming ONE authorizationId', () => {
  const ctx = setup('coord_da_replay_double_consume');
  authorizeDeclaredOperation('coord_da_replay_double_consume', authorization(), ctx.opts);
  const { eventsPath, sessionDir } = resolveSessionPaths('coord_da_replay_double_consume', ctx.opts);

  for (const assignmentId of ['asgn_double_001', 'asgn_double_002']) {
    appendEvent(
      eventsPath,
      { type: 'assignment-created', payload: { assignmentId, actorId: 'reviewer', authorizationId: 'auth_recheck_1' } },
      sessionDir,
    );
  }

  assert.throws(
    () => replaySession('coord_da_replay_double_consume', ctx.opts),
    (err) =>
      err instanceof CoordinationError &&
      err.category === 'duplicate-ref' &&
      /auth_recheck_1/.test(err.message) &&
      /asgn_double_001/.test(err.message) &&
      /asgn_double_002/.test(err.message),
  );
});

test('the gate\'s refusal names an authorization replay neutralized as post-terminal', async () => {
  const ctx = setup('coord_da_refusal_names_ignored');
  transitionSessionStatus('coord_da_refusal_names_ignored', 'cancelled', { reason: 'stopped' }, ctx.opts);

  // A post-terminal authorization for the very binding about to be dispatched:
  // replay neutralizes it, so the gate still refuses -- but the operator must
  // be able to tell this apart from "no authorization was ever issued".
  const { eventsPath, sessionDir } = resolveSessionPaths('coord_da_refusal_names_ignored', ctx.opts);
  appendEvent(
    eventsPath,
    {
      type: 'operation-authorized',
      payload: {
        authorizationId: 'auth_after_terminal',
        operationId: 'reviewer-recheck',
        nodeId: 'phase-recheck',
        targetActorId: 'reviewer',
        invocationKey: 'recheck:after-terminal',
        authorizedBy: { type: 'driver', id: 'coordinator-1' },
        reason: 'Written after the session closed.',
        grantedContextRefs: [],
      },
    },
    sessionDir,
  );

  await assert.rejects(
    dispatch('coord_da_refusal_names_ignored', ctx),
    (err) =>
      err instanceof CoordinationError &&
      /no unconsumed "operation-authorized"/.test(err.message) &&
      /ignored as post-terminal/.test(err.message) &&
      /auth_after_terminal/.test(err.message),
  );
  assert.deepEqual(readManifest('coord_da_refusal_names_ignored', ctx.opts).assignmentRefs, []);
});

test('replay fails closed on an assignment-created that claims an authorizationId no operation-authorized event ever declared', () => {
  const ctx = setup('coord_da_replay_dangling');
  const { eventsPath, sessionDir } = resolveSessionPaths('coord_da_replay_dangling', ctx.opts);
  appendEvent(
    eventsPath,
    { type: 'assignment-created', payload: { assignmentId: 'asgn_ghost_001', actorId: 'reviewer', authorizationId: 'auth_never_issued' } },
    sessionDir,
  );

  assert.throws(
    () => replaySession('coord_da_replay_dangling', ctx.opts),
    (err) => err instanceof CoordinationError && /auth_never_issued/.test(err.message),
  );
});

// ─── R5: invocationKey is consumed exactly once, SESSION-scoped ─────────────

test('R5: the SAME binding cannot be authorized twice under one invocationKey', () => {
  const ctx = setup('coord_da_key_same_binding');
  authorizeDeclaredOperation('coord_da_key_same_binding', authorization(), ctx.opts);

  assert.throws(
    () =>
      authorizeDeclaredOperation(
        'coord_da_key_same_binding',
        // A genuinely different authorization instance, reusing the key.
        authorization({ authorizationId: 'auth_recheck_2' }),
        ctx.opts,
      ),
    (err) =>
      err instanceof CoordinationError &&
      /invocationKey "recheck:candidate@2"/.test(err.message) &&
      /auth_recheck_1/.test(err.message),
  );

  assert.equal(readSessionEvents('coord_da_key_same_binding', ctx.opts).filter((e) => e.type === 'operation-authorized').length, 1);
});

test('R5: TWO DIFFERENT bindings in one session cannot reuse one invocationKey -- uniqueness is session-scoped, not per-binding', () => {
  // The exact loophole a per-binding check would leave open: each binding
  // sees its own first use of the key, so a per-binding implementation would
  // let both through. The contract scopes uniqueness to the session's own
  // events.jsonl, across every binding.
  const tempDir = mkTempDir();
  writeDefinition(tempDir, 'two-bindings-key-scope.json', {
    roles: ['reviewer'],
    actors: [{ id: 'reviewer', role: 'reviewer' }],
    operations: [
      { id: 'review-candidate', role: 'reviewer', result: { kind: 'advisory', evidenceRequired: 'reported' } },
      { id: 'reviewer-recheck', role: 'reviewer', result: { kind: 'advisory', evidenceRequired: 'reported' } },
    ],
    graph: {
      entry: 'phase-first-pass',
      nodes: [
        { id: 'phase-first-pass', operations: [{ ref: 'review-candidate', actor: 'reviewer', activation: { mode: 'driver-authorized' } }], transitions: ['phase-recheck'] },
        { id: 'phase-recheck', operations: [{ ref: 'reviewer-recheck', actor: 'reviewer', activation: { mode: 'driver-authorized' } }], transitions: [] },
      ],
    },
  });
  const opts = { cwd: tempDir, repoRoot: tempDir };
  openDeclaredProtocolSession(
    { definitionId: DEFINITION_ID, coordinationId: 'coord_da_key_scope', objective: 'Key scope.', writerId: 'coordinator-1' },
    opts,
  );

  authorizeDeclaredOperation('coord_da_key_scope', authorization({ invocationKey: 'shared-key' }), opts);

  assert.throws(
    () =>
      authorizeDeclaredOperation(
        'coord_da_key_scope',
        authorization({
          operationId: 'review-candidate',
          authorizationId: 'auth_first_pass_1',
          invocationKey: 'shared-key',
        }),
        opts,
      ),
    (err) =>
      err instanceof CoordinationError &&
      /invocationKey "shared-key"/.test(err.message) &&
      /across every binding/.test(err.message),
    'a DIFFERENT binding reusing the same invocationKey string must be refused session-wide',
  );

  const authorized = readSessionEvents('coord_da_key_scope', opts).filter((e) => e.type === 'operation-authorized');
  assert.equal(authorized.length, 1);
  assert.equal(authorized[0].payload.operationId, 'reviewer-recheck');
});

test('R5: crash between authorization and Assignment creation -- the resume treats the invocationKey as already issued and dispatches exactly once', async () => {
  const ctx = setup('coord_da_key_crash_resume');

  // The authorization landed; the process died before any Assignment existed.
  authorizeDeclaredOperation('coord_da_key_crash_resume', authorization(), ctx.opts);
  assert.deepEqual(readManifest('coord_da_key_crash_resume', ctx.opts).assignmentRefs, []);

  // On resume the driver re-issues the SAME logical invocation. It is refused
  // as already issued rather than silently minting a second authorization
  // that would later materialize a second Assignment for one invocation.
  assert.throws(
    () => authorizeDeclaredOperation('coord_da_key_crash_resume', authorization({ authorizationId: 'auth_recheck_resumed' }), ctx.opts),
    (err) => err instanceof CoordinationError && /invocationKey "recheck:candidate@2"/.test(err.message),
  );

  // The resume then spends the authorization the crashed attempt already got.
  const resumed = await dispatch('coord_da_key_crash_resume', ctx);
  assert.equal(resumed.resumed, false);
  const events = readSessionEvents('coord_da_key_crash_resume', ctx.opts);
  assert.equal(events.filter((e) => e.type === 'operation-authorized').length, 1);
  assert.equal(events.filter((e) => e.type === 'assignment-created' && e.payload.invocationKey === 'recheck:candidate@2').length, 1);
  assert.deepEqual(readManifest('coord_da_key_crash_resume', ctx.opts).assignmentRefs, [resumed.assignment.assignmentId]);

  // Re-issuing the key after it has actually been CONSUMED is refused too.
  assert.throws(
    () => authorizeDeclaredOperation('coord_da_key_crash_resume', authorization({ authorizationId: 'auth_recheck_after' }), ctx.opts),
    (err) => err instanceof CoordinationError && /invocationKey "recheck:candidate@2"/.test(err.message),
  );
});

test('R5: replay fails closed on two operation-authorized events claiming ONE invocationKey', () => {
  const ctx = setup('coord_da_key_replay');
  authorizeDeclaredOperation('coord_da_key_replay', authorization(), ctx.opts);
  const { eventsPath, sessionDir } = resolveSessionPaths('coord_da_key_replay', ctx.opts);

  // A log that could only come from a write path that skipped the door above.
  appendEvent(
    eventsPath,
    {
      type: 'operation-authorized',
      payload: {
        authorizationId: 'auth_recheck_forged',
        operationId: 'reviewer-recheck',
        nodeId: 'phase-recheck',
        targetActorId: 'reviewer',
        invocationKey: 'recheck:candidate@2',
        authorizedBy: { type: 'driver', id: 'coordinator-1' },
        reason: 'Forged onto the log.',
        grantedContextRefs: [],
      },
    },
    sessionDir,
  );

  assert.throws(
    () => replaySession('coord_da_key_replay', ctx.opts),
    (err) =>
      err instanceof CoordinationError &&
      err.category === 'duplicate-ref' &&
      /recheck:candidate@2/.test(err.message) &&
      /auth_recheck_1/.test(err.message) &&
      /auth_recheck_forged/.test(err.message),
  );
});

// ─── R6: context-grant enforcement at dispatch ─────────────────────────────

test('R6: a sibling Assignment\'s output not named in grantedContextRefs is rejected at dispatch', async () => {
  const ctx = setup('coord_da_grant_sibling');

  // A real sibling: the doer's own Assignment in this same session.
  const sibling = await dispatchProduce('coord_da_grant_sibling', ctx);

  // The driver grants nothing at all.
  authorizeDeclaredOperation('coord_da_grant_sibling', authorization({ grantedContextRefs: [] }), ctx.opts);

  await assert.rejects(
    dispatch('coord_da_grant_sibling', ctx, { contextRefs: [sibling.assignment.assignmentId] }),
    (err) =>
      err instanceof CoordinationError &&
      /is not granted by authorization "auth_recheck_1"/.test(err.message) &&
      new RegExp(sibling.assignment.assignmentId).test(err.message),
  );

  // Refused before anything materialized: the doer's Assignment is still the
  // only member, and the authorization is still unspent.
  assert.deepEqual(readManifest('coord_da_grant_sibling', ctx.opts).assignmentRefs, [sibling.assignment.assignmentId]);
  const replayed = replaySession('coord_da_grant_sibling', ctx.opts);
  assert.equal(replayed.authorizations[0].consumedByAssignmentId, null);
});

test('R6: the SAME sibling ref dispatches once the driver actually grants it, and the contract carries exactly the granted refs', async () => {
  const ctx = setup('coord_da_grant_allowed');
  const sibling = await dispatchProduce('coord_da_grant_allowed', ctx);

  authorizeDeclaredOperation(
    'coord_da_grant_allowed',
    authorization({ grantedContextRefs: [sibling.assignment.assignmentId] }),
    ctx.opts,
  );

  const recheck = await dispatch('coord_da_grant_allowed', ctx, { contextRefs: [sibling.assignment.assignmentId] });
  assert.equal(recheck.resumed, false);

  const contract = recheck.assignment.provenance.inline.contract;
  assert.deepEqual(contract.contextRefs, [sibling.assignment.assignmentId]);
  const created = readSessionEvents('coord_da_grant_allowed', ctx.opts).find(
    (e) => e.type === 'assignment-created' && e.payload.assignmentId === recheck.assignment.assignmentId,
  );
  assert.deepEqual(created.payload.contextGrant, { refs: [sibling.assignment.assignmentId] });
});

test('R6: a grantedContextRefs entry naming a DIFFERENT coordinationId is rejected before the authorization is written', () => {
  const ctx = setup('coord_da_grant_cross_session');
  openSecondSession(ctx.tempDir, 'coord_da_grant_other');

  assert.throws(
    () =>
      authorizeDeclaredOperation(
        'coord_da_grant_cross_session',
        authorization({ grantedContextRefs: ['coord_da_grant_other'] }),
        ctx.opts,
      ),
    (err) => err instanceof CoordinationError && /names a different coordination session/.test(err.message),
  );
  assert.equal(readSessionEvents('coord_da_grant_cross_session', ctx.opts).filter((e) => e.type === 'operation-authorized').length, 0);
});

test('a PATH-FORM grantedContextRefs entry into a different session is rejected the same as a bare id', () => {
  const ctx = setup('coord_da_grant_cross_session_path');
  openSecondSession(ctx.tempDir, 'coord_da_grant_other_path');

  // A whole-string `/^coord_/` prefix test never fires on this shape --
  // the string does not itself start with "coord_" -- but the foreign
  // session id is still present as its own path SEGMENT.
  assert.throws(
    () =>
      authorizeDeclaredOperation(
        'coord_da_grant_cross_session_path',
        authorization({ grantedContextRefs: ['.fgos/coordination/sessions/coord_da_grant_other_path/events.jsonl'] }),
        ctx.opts,
      ),
    (err) => err instanceof CoordinationError && /names a different coordination session/.test(err.message),
  );
  assert.equal(readSessionEvents('coord_da_grant_cross_session_path', ctx.opts).filter((e) => e.type === 'operation-authorized').length, 0);
});

test('a real foreign session is rejected by DISK EXISTENCE even when its id carries no "coord_" prefix', () => {
  // Session ids carry no required prefix (`assertSafeCoordinationId` only
  // requires alnum/underscore/hyphen) -- a `coord_`-prefix test on the ref
  // string would miss a real, on-disk foreign session named plainly.
  const ctx = setup('coord_da_grant_unprefixed_foreign');
  openSecondSession(ctx.tempDir, 'privatebox');

  assert.throws(
    () =>
      authorizeDeclaredOperation(
        'coord_da_grant_unprefixed_foreign',
        authorization({ grantedContextRefs: ['.fgos/coordination/sessions/privatebox/events.jsonl'] }),
        ctx.opts,
      ),
    (err) => err instanceof CoordinationError && /names a different coordination session/.test(err.message),
  );
  assert.equal(readSessionEvents('coord_da_grant_unprefixed_foreign', ctx.opts).filter((e) => e.type === 'operation-authorized').length, 0);

  // Control: a session id that merely LOOKS foreign but was never opened
  // (nothing on disk) is left alone -- this check polices real leaks, not
  // naming conventions, same as the `asgn_` half.
  assert.doesNotThrow(() =>
    authorizeDeclaredOperation(
      'coord_da_grant_unprefixed_foreign',
      authorization({ authorizationId: 'auth_control', invocationKey: 'recheck:control', grantedContextRefs: ['never-opened-session-id'] }),
      ctx.opts,
    ),
  );
});

test('a non-string grantedContextRefs entry is refused with a clean CoordinationError, not a raw TypeError', () => {
  const ctx = setup('coord_da_grant_non_string');
  assert.throws(
    () => authorizeDeclaredOperation('coord_da_grant_non_string', authorization({ grantedContextRefs: [123] }), ctx.opts),
    (err) => err instanceof CoordinationError && /ref must be a string/.test(err.message),
  );
});

test('R6: a grantedContextRefs entry naming a real Assignment owned by ANOTHER session is rejected', async () => {
  const ctx = setup('coord_da_grant_foreign_asgn');
  openSecondSession(ctx.tempDir, 'coord_da_grant_foreign_owner');

  // A real, on-disk Assignment that belongs to the other session.
  const foreign = await dispatchProduce('coord_da_grant_foreign_owner', ctx);

  assert.throws(
    () =>
      authorizeDeclaredOperation(
        'coord_da_grant_foreign_asgn',
        authorization({ grantedContextRefs: [foreign.assignment.assignmentId] }),
        ctx.opts,
      ),
    (err) =>
      err instanceof CoordinationError &&
      /is not a member of coordination session "coord_da_grant_foreign_asgn"/.test(err.message),
  );
  assert.equal(readSessionEvents('coord_da_grant_foreign_asgn', ctx.opts).filter((e) => e.type === 'operation-authorized').length, 0);
});

test('R6: the enforcement is a dispatch-path GATE -- a cross-session grant forged through the raw store door is still refused', async () => {
  const ctx = setup('coord_da_grant_raw_door');
  openSecondSession(ctx.tempDir, 'coord_da_grant_raw_other');

  // The raw door has no session-membership awareness, so this record reaches
  // the log. The gate inside dispatchDeclaredOperation is what has to stop it.
  const written = rawAuthorize('coord_da_grant_raw_door', ctx, {
    authorizationId: 'auth_recheck_1',
    invocationKey: 'recheck:candidate@2',
    grantedContextRefs: ['coord_da_grant_raw_other'],
  });
  assert.equal(written.appended, true);

  await assert.rejects(
    dispatch('coord_da_grant_raw_door', ctx),
    (err) => err instanceof CoordinationError && /names a different coordination session/.test(err.message),
  );
  assert.deepEqual(readManifest('coord_da_grant_raw_door', ctx.opts).assignmentRefs, []);
});

// ─── R7: binding maxInvocations, counted fresh from disk ───────────────────

const CAPPED = { recheckActivation: { mode: 'driver-authorized', maxInvocations: 2 } };

async function useBindingInvocation(coordinationId, ctx, n) {
  authorizeDeclaredOperation(
    coordinationId,
    authorization({ authorizationId: `auth_recheck_${n}`, invocationKey: `recheck:candidate@${n}` }),
    ctx.opts,
  );
  return dispatch(coordinationId, ctx, { taskKey: `recheck-round-${n}` });
}

test('R7: activation.maxInvocations admits exactly N invocations at that binding and refuses the N+1th', async () => {
  const ctx = setup('coord_da_cap', CAPPED);

  await useBindingInvocation('coord_da_cap', ctx, 1);
  await useBindingInvocation('coord_da_cap', ctx, 2);
  assert.equal(readManifest('coord_da_cap', ctx.opts).assignmentRefs.length, 2);

  // The N+1th authorization never gets issued in the first place.
  assert.throws(
    () =>
      authorizeDeclaredOperation(
        'coord_da_cap',
        authorization({ authorizationId: 'auth_recheck_3', invocationKey: 'recheck:candidate@3' }),
        ctx.opts,
      ),
    (err) => err instanceof CoordinationError && /activation\.maxInvocations cap of 2/.test(err.message),
  );

  // ...and even when an authorization is forged past that door, the N+1th
  // DISPATCH is refused by the lock-held count inside createSessionAssignment.
  assert.equal(
    rawAuthorize('coord_da_cap', ctx, { authorizationId: 'auth_recheck_3', invocationKey: 'recheck:candidate@3' }).appended,
    true,
  );
  await assert.rejects(
    dispatch('coord_da_cap', ctx, { taskKey: 'recheck-round-3' }),
    (err) =>
      err instanceof CoordinationError &&
      /has already been invoked 2 time\(s\)/.test(err.message) &&
      /activation\.maxInvocations cap of 2/.test(err.message),
  );
  assert.equal(readManifest('coord_da_cap', ctx.opts).assignmentRefs.length, 2);
});

test('R7: the invocation count is recomputed from disk in a genuinely separate OS process, never from process-local state', async () => {
  // A process-local counter would start this child at zero and let both the
  // authorization AND the dispatch through. The child shares nothing with
  // this process but the session directory on disk.
  const ctx = setup('coord_da_cap_fresh_process', CAPPED);
  await useBindingInvocation('coord_da_cap_fresh_process', ctx, 1);
  await useBindingInvocation('coord_da_cap_fresh_process', ctx, 2);

  const engineUrl = new URL('../../src/runner/coordination/session-engine.mjs', import.meta.url).href;
  const storeUrl = new URL('../../src/runner/coordination/store.mjs', import.meta.url).href;
  const probeFile = path.join(ctx.tempDir, 'cold-process-cap-probe.mjs');
  fs.writeFileSync(
    probeFile,
    `
import { authorizeDeclaredOperation, dispatchDeclaredOperation } from ${JSON.stringify(engineUrl)};
import { authorizeOperation } from ${JSON.stringify(storeUrl)};

const opts = { cwd: ${JSON.stringify(ctx.tempDir)}, repoRoot: ${JSON.stringify(ctx.tempDir)} };
const id = 'coord_da_cap_fresh_process';
const out = {};

try {
  authorizeDeclaredOperation(id, {
    operationId: 'reviewer-recheck', targetActorId: 'reviewer',
    authorizationId: 'auth_cold_1', invocationKey: 'recheck:cold-1',
    authorizedBy: { type: 'driver', id: 'coordinator-1' },
    reason: 'Cold process, third invocation.', grantedContextRefs: [],
  }, opts);
  out.authorize = 'ACCEPTED';
} catch (err) {
  out.authorize = err.message;
}

// Forge one past the definition-aware door, then try to actually dispatch it.
authorizeOperation(id, {
  authorizationId: 'auth_cold_2', operationId: 'reviewer-recheck', nodeId: 'phase-recheck',
  targetActorId: 'reviewer', invocationKey: 'recheck:cold-2',
  authorizedBy: { type: 'driver', id: 'coordinator-1' },
  reason: 'Forged in a cold process.', grantedContextRefs: [],
}, opts);

try {
  await dispatchDeclaredOperation(id, {
    operationId: 'reviewer-recheck', targetActorId: 'reviewer', taskKey: 'recheck-cold',
    objective: 'Recheck from a cold process.',
    expectedOutputs: ['agent-result.json (status, summary)'], writerId: 'coordinator-1',
  }, opts);
  out.dispatch = 'ACCEPTED';
} catch (err) {
  out.dispatch = err.message;
}

process.stdout.write(JSON.stringify(out));
`,
  );

  const raw = execFileSync(process.execPath, [probeFile], { encoding: 'utf8' });
  const probe = JSON.parse(raw);
  assert.match(probe.authorize, /activation\.maxInvocations cap of 2/, 'a cold process must still see the 2 invocations already on disk');
  assert.match(probe.dispatch, /has already been invoked 2 time\(s\)/, 'the dispatch-side count must be recomputed from disk too');
  assert.equal(readManifest('coord_da_cap_fresh_process', ctx.opts).assignmentRefs.length, 2);
});

test('R7: an aggregate bound still rejects even when the binding cap would allow more -- binding caps narrow, never widen', async () => {
  const ctx = setup(
    'coord_da_cap_vs_aggregate',
    { recheckActivation: { mode: 'driver-authorized', maxInvocations: 5 } },
    { aggregateBounds: { maxAssignments: 1 } },
  );

  await useBindingInvocation('coord_da_cap_vs_aggregate', ctx, 1);

  // The binding's own cap (5) has room for four more; the session-wide cap
  // does not, and it is the one that refuses.
  await assert.rejects(
    useBindingInvocation('coord_da_cap_vs_aggregate', ctx, 2),
    (err) =>
      err instanceof CoordinationError &&
      /aggregateBounds\.maxAssignments cap of 1/.test(err.message) &&
      !/activation\.maxInvocations/.test(err.message),
  );
  assert.equal(readManifest('coord_da_cap_vs_aggregate', ctx.opts).assignmentRefs.length, 1);
});

// ─── R8: driver authority is pinned to the session's provenance root ───────

test('R8: an authorizedBy.id that is not the session\'s provenanceRoot.writerId is rejected at both doors', () => {
  const ctx = setup('coord_da_authority', undefined, { writerId: 'the-real-driver' });
  assert.equal(readManifest('coord_da_authority', ctx.opts).provenanceRoot.writerId, 'the-real-driver');

  // The definition-aware door.
  assert.throws(
    () => authorizeDeclaredOperation('coord_da_authority', authorization(), ctx.opts),
    (err) =>
      err instanceof CoordinationError &&
      /authorizedBy\.id "coordinator-1" is not the driver identity/.test(err.message) &&
      /provenanceRoot\.writerId is "the-real-driver"/.test(err.message),
  );

  // ...and the raw store door, which is the one a caller could otherwise use
  // to name an arbitrary driver with no definition in sight.
  assert.throws(
    () => rawAuthorize('coord_da_authority', ctx),
    (err) => err instanceof CoordinationError && /is not the driver identity/.test(err.message),
  );

  assert.equal(readSessionEvents('coord_da_authority', ctx.opts).filter((e) => e.type === 'operation-authorized').length, 0);
});

test('R8: the session\'s own driver identity authorizes and dispatches normally', async () => {
  const ctx = setup('coord_da_authority_ok', undefined, { writerId: 'the-real-driver' });
  authorizeDeclaredOperation(
    'coord_da_authority_ok',
    authorization({ authorizedBy: { type: 'driver', id: 'the-real-driver' } }),
    ctx.opts,
  );

  const result = await dispatch('coord_da_authority_ok', ctx);
  assert.equal(result.resumed, false);
  const authorized = readSessionEvents('coord_da_authority_ok', ctx.opts).find((e) => e.type === 'operation-authorized');
  assert.deepEqual(authorized.payload.authorizedBy, { type: 'driver', id: 'the-real-driver' });
});
