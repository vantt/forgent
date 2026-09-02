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

function setup(coordinationId, fixtureOptions) {
  const tempDir = mkTempDir();
  writeFixture(tempDir, fixtureOptions);
  openDeclaredProtocolSession(
    {
      definitionId: DEFINITION_ID,
      coordinationId,
      objective: 'Prove driver-authorized optional operations gate on a real authorization.',
      writerId: 'coordinator-1',
    },
    { cwd: tempDir },
  );
  return { tempDir, runnerConfig: fakeExecutor(tempDir), opts: { cwd: tempDir, repoRoot: tempDir } };
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
