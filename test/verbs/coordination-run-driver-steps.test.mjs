// Driver-authority steps on the `fgos coordination run` request surface:
// the two request-file step types that reach `authorizeDeclaredOperation`
// and `recordDriverDisposition`, plus the negative battery for that door
// specifically.
//
// Two layers, matching test/cli/coordination.test.mjs's own split:
// - unit-level checks straight against `validateCoordinationRequest`
//   (src/verbs/coordination/schema.mjs) for every reject category the two
//   new step types add;
// - real end-to-end runs through `runCoordinationUseCase` (the ONE door
//   both the interactive CLI and the headless adapter call), against a
//   project-tier CoordinationProtocol fixture loaded through the real
//   `protocol-loader.mjs` project tier and a real Node-subprocess fake
//   executor -- never a JS-level stub over the engine.
//
// The engine-level guarantees these steps reach (the gate itself, the
// invocationKey ledger, grant scope, recheck taskKey derivation, the
// driver-identity pin) are already proven in
// test/runner/coordination-driver-authorization.test.mjs and
// test/runner/coordination-recheck-disposition.test.mjs. What is proven
// HERE, and only here, is that a request file genuinely reaches them and
// that the request boundary refuses what it must before they are called.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { validateCoordinationRequest } from '../../src/verbs/coordination/schema.mjs';
import { runCoordinationUseCase } from '../../src/verbs/coordination/run.mjs';
import { showCoordinationUseCase } from '../../src/verbs/coordination/show.mjs';
import { StoreError } from '../../src/state/store.mjs';
import { CoordinationError } from '../../src/runner/coordination/schema.mjs';
import { readSessionEvents, readManifest, resolveSessionPaths, appendEvent, transitionSessionStatus } from '../../src/runner/coordination/store.mjs';
import { openDeclaredProtocolSession } from '../../src/runner/coordination/session-engine.mjs';

const DEFINITION_ID = 'test.coordination-protocol.master-loop-driver-steps';

function mkTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-coord-run-driver-'));
}

// The same graph shape as core/coordination-protocols/
// standalone-master-coordination-loop.yaml -- produce -> required
// review+red-team first pass -> revision -> recheck -- with the revision
// and recheck bindings marked `driver-authorized`, which is the only shape
// in which `authorizeDeclaredOperation` has anything to authorize. Written
// as JSON so it parses whether or not the optional `yaml` dependency is
// installed.
function writeFixture(tempDir) {
  const dir = path.join(tempDir, '.fgos', 'coordination-protocols');
  fs.mkdirSync(dir, { recursive: true });
  const advisory = { kind: 'advisory', evidenceRequired: 'reported' };
  const workProduct = { kind: 'work-product', evidenceRequired: 'reported' };
  const definition = {
    apiVersion: 'fgos.dev/v1alpha1',
    kind: 'FlowDefinition',
    metadata: { id: DEFINITION_ID, version: '1.0.0' },
    spec: {
      profile: { kind: 'CoordinationProtocol' },
      roles: ['doer', 'reviewer', 'red-team', 'fixer'],
      actors: [
        { id: 'doer', role: 'doer' },
        { id: 'reviewer', role: 'reviewer' },
        { id: 'red-team', role: 'red-team' },
        { id: 'fixer', role: 'fixer' },
      ],
      operations: [
        { id: 'produce-candidate', role: 'doer', result: workProduct },
        { id: 'review-candidate', role: 'reviewer', result: advisory },
        { id: 'red-team-candidate', role: 'red-team', result: advisory },
        { id: 'revise-candidate', role: 'fixer', result: workProduct },
        { id: 'reviewer-recheck', role: 'reviewer', result: advisory },
        { id: 'red-team-recheck', role: 'red-team', result: advisory },
      ],
      graph: {
        entry: 'phase-produce',
        nodes: [
          { id: 'phase-produce', operations: [{ ref: 'produce-candidate', actor: 'doer' }], transitions: ['phase-first-pass'] },
          {
            id: 'phase-first-pass',
            operations: [
              { ref: 'review-candidate', actor: 'reviewer' },
              { ref: 'red-team-candidate', actor: 'red-team' },
            ],
            transitions: ['phase-revision'],
          },
          {
            id: 'phase-revision',
            operations: [{ ref: 'revise-candidate', actor: 'fixer', activation: { mode: 'driver-authorized' } }],
            transitions: ['phase-recheck'],
          },
          {
            id: 'phase-recheck',
            operations: [
              { ref: 'reviewer-recheck', actor: 'reviewer', activation: { mode: 'driver-authorized' } },
              { ref: 'red-team-recheck', actor: 'red-team', activation: { mode: 'driver-authorized' } },
            ],
            transitions: [],
          },
        ],
      },
    },
  };
  fs.writeFileSync(path.join(dir, 'master-loop-driver-steps.json'), `${JSON.stringify(definition, null, 2)}\n`);
}

function fakeExecutor(tempDir) {
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
            fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Report\\nValidated.\\n');
            fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'Validated.' }));
          }
        }
      }
    }
    process.stdout.write('Validated.\\n');
    process.exit(0);
    `,
  );
  return {
    executor: { allowCrossProvider: true, command: process.execPath, args: [executorScript, '{prompt}'] },
    models: { standard: 'test-model', lightweight: 'test-model', creative: 'test-model', analytical: 'test-model', critical: 'test-model' },
    timeoutMs: 10000,
  };
}

function setup() {
  const tempDir = mkTempDir();
  writeFixture(tempDir);
  return { tempDir, ctx: { cwd: tempDir, repoRoot: tempDir, runnerConfig: fakeExecutor(tempDir) } };
}

const WRITER_ID = 'master-coordinator-1';

function produceStep() {
  return {
    type: 'operation',
    as: 'produce',
    operationId: 'produce-candidate',
    targetActorId: 'doer',
    objective: 'Produce the first candidate.',
    expectedOutputs: ['agent-result.json (status, summary)'],
  };
}

function reviewStep() {
  return {
    type: 'operation',
    as: 'review',
    operationId: 'review-candidate',
    targetActorId: 'reviewer',
    objective: 'Review the candidate.',
    expectedOutputs: ['agent-result.json (status, summary)'],
    contextRefs: ['$ref:produce'],
  };
}

function request(overrides = {}) {
  return {
    kind: 'declared-protocol',
    objective: 'Prove the driver-authority request steps reach the real engine doors.',
    writerId: WRITER_ID,
    protocolRef: { id: DEFINITION_ID },
    steps: [produceStep(), reviewStep()],
    ...overrides,
  };
}

function authorizeStep(overrides = {}) {
  return {
    type: 'authorize',
    as: 'authorize-recheck',
    operationId: 'reviewer-recheck',
    targetActorId: 'reviewer',
    authorizationId: 'auth_recheck_1',
    invocationKey: 'recheck:candidate@2',
    reason: 'The candidate was revised; recheck the revision.',
    grantedContextRefs: ['$ref:produce'],
    ...overrides,
  };
}

function recheckStep(overrides = {}) {
  return {
    type: 'operation',
    as: 'recheck',
    operationId: 'reviewer-recheck',
    targetActorId: 'reviewer',
    objective: 'Recheck the revised candidate.',
    expectedOutputs: ['agent-result.json (status, summary)'],
    contextRefs: ['$ref:produce'],
    ...overrides,
  };
}

function dispositionStep(overrides = {}) {
  return {
    type: 'disposition',
    as: 'close-round',
    targetRef: '$ref:produce',
    disposition: 'accepted',
    rationale: 'The recheck confirmed the revision closed the finding.',
    evidenceRefs: ['$ref:review'],
    ...overrides,
  };
}

function eventsOfType(tempDir, coordinationId, type) {
  return readSessionEvents(coordinationId, { cwd: tempDir, repoRoot: tempDir }).filter((event) => event.type === type);
}

// ─── Request boundary: what the two new step types reject ─────────────────

test('validateCoordinationRequest: an "authorize" step may not declare authorizedBy -- driver provenance comes from the request\'s own writerId', () => {
  assert.throws(
    () => validateCoordinationRequest(request({ steps: [produceStep(), authorizeStep({ authorizedBy: { type: 'driver', id: 'someone-else' } })] })),
    (err) => err instanceof StoreError && /driver provenance is pinned to the session's own top-level "writerId"/.test(err.message),
  );
});

test('validateCoordinationRequest: a "disposition" step may not declare authorizedBy either', () => {
  assert.throws(
    () => validateCoordinationRequest(request({ steps: [produceStep(), dispositionStep({ authorizedBy: { type: 'driver', id: 'someone-else' } })] })),
    (err) => err instanceof StoreError && /driver provenance is pinned to the session's own top-level "writerId"/.test(err.message),
  );
});

test('validateCoordinationRequest: an unknown field on an "authorize" step is rejected', () => {
  assert.throws(
    () => validateCoordinationRequest(request({ steps: [produceStep(), authorizeStep({ maxInvocations: 5 })] })),
    (err) => err instanceof StoreError && /unknown field "maxInvocations" in steps\[1\] \(type "authorize"\)/.test(err.message),
  );
});

test('validateCoordinationRequest: an "authorize" step missing authorizationId/invocationKey/reason is rejected, one message each', () => {
  for (const [field, pattern] of [
    ['authorizationId', /steps\[1\]\.authorizationId must be a non-empty string/],
    ['invocationKey', /steps\[1\]\.invocationKey is required/],
    ['reason', /steps\[1\]\.reason is required/],
  ]) {
    const step = authorizeStep();
    delete step[field];
    assert.throws(
      () => validateCoordinationRequest(request({ steps: [produceStep(), step] })),
      (err) => err instanceof StoreError && pattern.test(err.message),
      `expected a dedicated refusal for a missing ${field}`,
    );
  }
});

test('validateCoordinationRequest: a path-escaping authorizationId is rejected -- it is concatenated into a driver-authorized dispatch\'s derived taskKey', () => {
  assert.throws(
    () => validateCoordinationRequest(request({ steps: [produceStep(), authorizeStep({ authorizationId: '../../evil' })] })),
    (err) => err instanceof StoreError && /steps\[1\]\.authorizationId .* path escape rejected/s.test(err.message),
  );
});

test('validateCoordinationRequest: a "disposition" step missing targetRef/disposition/rationale is rejected, one message each', () => {
  for (const [field, pattern] of [
    ['targetRef', /steps\[1\]\.targetRef must be a non-empty string/],
    ['disposition', /steps\[1\]\.disposition is required/],
    ['rationale', /steps\[1\]\.rationale is required/],
  ]) {
    const step = dispositionStep();
    delete step[field];
    assert.throws(
      () => validateCoordinationRequest(request({ steps: [produceStep(), step] })),
      (err) => err instanceof StoreError && pattern.test(err.message),
      `expected a dedicated refusal for a missing ${field}`,
    );
  }
});

test('validateCoordinationRequest: the unknown-step-type message names all four supported types', () => {
  assert.throws(
    () => validateCoordinationRequest(request({ steps: [{ type: 'authorise', as: 'typo' }] })),
    (err) => err instanceof StoreError && /steps\[0\]\.type must be "operation", "fan-out", "authorize", or "disposition"/.test(err.message),
  );
});

test('validateCoordinationRequest: the Work-lifecycle deep scan still catches a smuggled key inside an authorize step', () => {
  assert.throws(
    () => validateCoordinationRequest(request({ steps: [produceStep(), { ...authorizeStep(), approve: true }] })),
    (err) => err instanceof StoreError && /carries Work lifecycle authority/.test(err.message),
  );
});

test('validateCoordinationRequest: a well-formed authorize + disposition pair normalizes to exactly the engine-call fields', () => {
  const normalized = validateCoordinationRequest(request({ steps: [produceStep(), authorizeStep(), recheckStep(), dispositionStep()] }));
  assert.deepEqual(normalized.steps[1], {
    type: 'authorize',
    as: 'authorize-recheck',
    operationId: 'reviewer-recheck',
    targetActorId: 'reviewer',
    nodeId: undefined,
    authorizationId: 'auth_recheck_1',
    invocationKey: 'recheck:candidate@2',
    reason: 'The candidate was revised; recheck the revision.',
    grantedContextRefs: ['$ref:produce'],
    targetArtifactRef: undefined,
  });
  assert.deepEqual(normalized.steps[3], {
    type: 'disposition',
    as: 'close-round',
    targetRef: '$ref:produce',
    disposition: 'accepted',
    rationale: 'The recheck confirmed the revision closed the finding.',
    evidenceRefs: ['$ref:review'],
  });
});

// ─── The request door genuinely reaches the engine doors ──────────────────

test('an "authorize" step reaches authorizeDeclaredOperation: the operation-authorized event lands under the request\'s own writerId, and the recheck it authorizes dispatches', async () => {
  const { tempDir, ctx } = setup();
  const data = await runCoordinationUseCase(ctx, {
    requestObject: request({ steps: [produceStep(), reviewStep(), authorizeStep(), recheckStep()] }),
  });

  const authorizeResult = data.steps.find((step) => step.as === 'authorize-recheck');
  assert.equal(authorizeResult.type, 'authorize');
  assert.equal(authorizeResult.appended, true);
  assert.equal(authorizeResult.nodeId, 'phase-recheck');
  assert.equal(authorizeResult.actorId, 'reviewer');

  const authorized = eventsOfType(tempDir, data.coordinationId, 'operation-authorized');
  assert.equal(authorized.length, 1);
  // Driver identity is DERIVED from the request's writerId, never named by
  // the request: the engine pins it to provenanceRoot.writerId.
  assert.deepEqual(authorized[0].payload.authorizedBy, { type: 'driver', id: WRITER_ID });
  assert.equal(authorized[0].payload.invocationKey, 'recheck:candidate@2');

  const recheck = data.steps.find((step) => step.as === 'recheck');
  assert.equal(recheck.status, 'done');
  // The recheck genuinely consumed the authorization: its assignment-created
  // event carries the authorization provenance, not just a coincidental id.
  const created = eventsOfType(tempDir, data.coordinationId, 'assignment-created');
  const recheckCreated = created.find((event) => event.payload.assignmentId === recheck.assignmentId);
  assert.equal(recheckCreated.payload.authorizationId, 'auth_recheck_1');
  assert.deepEqual(recheckCreated.payload.contextGrant.refs, [data.steps.find((s) => s.as === 'produce').assignmentId]);
});

test('an unauthorized optional operation is refused at the request door: the recheck step with no preceding authorize step creates no Assignment', async () => {
  const { tempDir, ctx } = setup();
  await assert.rejects(
    runCoordinationUseCase(ctx, { requestObject: request({ steps: [produceStep(), reviewStep(), recheckStep({ contextRefs: [] })] }) }),
    (err) => err instanceof CoordinationError && /no unconsumed "operation-authorized" event/.test(err.message),
  );

  const sessions = fs.readdirSync(path.join(tempDir, '.fgos', 'coordination', 'sessions'));
  assert.equal(sessions.length, 1);
  const manifest = readManifest(sessions[0], { cwd: tempDir, repoRoot: tempDir });
  // produce + review only -- the refused recheck materialized nothing.
  assert.equal(manifest.assignmentRefs.length, 2);
  assert.equal(eventsOfType(tempDir, sessions[0], 'operation-authorized').length, 0);
});

test('hidden context is refused at the request door: a recheck naming a sibling ref the authorize step never granted creates no Assignment', async () => {
  const { tempDir, ctx } = setup();
  await assert.rejects(
    runCoordinationUseCase(ctx, {
      requestObject: request({
        steps: [
          produceStep(),
          reviewStep(),
          // Grants only the produce Assignment...
          authorizeStep({ grantedContextRefs: ['$ref:produce'] }),
          // ...but the recheck tries to read the review Assignment too.
          recheckStep({ contextRefs: ['$ref:produce', '$ref:review'] }),
        ],
      }),
    }),
    (err) => err instanceof CoordinationError && /is not granted by authorization "auth_recheck_1"/.test(err.message),
  );

  const sessions = fs.readdirSync(path.join(tempDir, '.fgos', 'coordination', 'sessions'));
  const manifest = readManifest(sessions[0], { cwd: tempDir, repoRoot: tempDir });
  assert.equal(manifest.assignmentRefs.length, 2);
  // The authorization was written and stays unconsumed -- refused at the
  // gate, not silently spent.
  const authorized = eventsOfType(tempDir, sessions[0], 'operation-authorized');
  assert.equal(authorized.length, 1);
  const created = eventsOfType(tempDir, sessions[0], 'assignment-created');
  assert.ok(created.every((event) => event.payload.authorizationId === undefined));
});

test('authorizing a "required" binding through the request door is refused -- a request cannot manufacture an optional operation', async () => {
  const { tempDir, ctx } = setup();
  await assert.rejects(
    runCoordinationUseCase(ctx, {
      requestObject: request({
        steps: [produceStep(), authorizeStep({ operationId: 'review-candidate', targetActorId: 'reviewer' })],
      }),
    }),
    (err) => err instanceof CoordinationError && /only a "driver-authorized" binding can be authorized/.test(err.message),
  );
  const sessions = fs.readdirSync(path.join(tempDir, '.fgos', 'coordination', 'sessions'));
  assert.equal(eventsOfType(tempDir, sessions[0], 'operation-authorized').length, 0);
});

// R8's "unknown target" and "stale/nonexistent artifact ref" negative-
// semantics cases, at the CLI/request door specifically (engine-level
// coverage already exists: coordination-driver-authorization.test.mjs's
// "R2: authorizeDeclaredOperation rejects an unknown operation..." and
// coordination-recheck-disposition.test.mjs's "R1: a targetArtifactRef
// naming another session is refused..." -- these are the door-level
// companions the phase's own Tests First list implies matter separately).

test('an "authorize" step naming a completely undeclared operation is refused at the request door: R8 "unknown target" fails closed', async () => {
  const { tempDir, ctx } = setup();
  await assert.rejects(
    runCoordinationUseCase(ctx, {
      requestObject: request({ steps: [produceStep(), reviewStep(), authorizeStep({ operationId: 'no-such-operation' })] }),
    }),
    (err) => err instanceof CoordinationError && /is not declared in this protocol's spec\.operations/.test(err.message),
  );
  const sessions = fs.readdirSync(path.join(tempDir, '.fgos', 'coordination', 'sessions'));
  assert.equal(eventsOfType(tempDir, sessions[0], 'operation-authorized').length, 0);
});

test('an "authorize" step\'s targetArtifactRef naming another coordination session is refused at the request door: R8 "stale/nonexistent artifact ref" fails closed', async () => {
  const { tempDir, ctx } = setup();
  // A literal (non-"$ref:") id must be a bare safe-charset string at the
  // request boundary (assertSafeRefOrId) -- a path-form foreign ref would be
  // refused earlier, by the schema layer's own path-escape check, before
  // ever reaching the engine's cross-session check this test targets. Using
  // the foreign session's own id as the ref exercises the SAME
  // assertRefsOwnedBySession segment check the engine-level test forges a
  // path-form ref to reach.
  const foreignCoordinationId = 'coord_driver_steps_foreign_other';
  openDeclaredProtocolSession(
    { definitionId: DEFINITION_ID, coordinationId: foreignCoordinationId, objective: 'A different session entirely.', writerId: WRITER_ID },
    { cwd: tempDir, repoRoot: tempDir },
  );

  await assert.rejects(
    runCoordinationUseCase(ctx, {
      requestObject: request({ steps: [produceStep(), reviewStep(), authorizeStep({ targetArtifactRef: foreignCoordinationId })] }),
    }),
    (err) => err instanceof CoordinationError && /names a different coordination session/.test(err.message),
  );
  const sessions = fs.readdirSync(path.join(tempDir, '.fgos', 'coordination', 'sessions')).filter((id) => id !== foreignCoordinationId);
  assert.equal(sessions.length, 1);
  assert.equal(eventsOfType(tempDir, sessions[0], 'operation-authorized').length, 0);
});

test('a "disposition" step reaches recordDriverDisposition, with its refs resolved from this run\'s own dispatched Assignment ids', async () => {
  const { tempDir, ctx } = setup();
  const data = await runCoordinationUseCase(ctx, {
    requestObject: request({ steps: [produceStep(), reviewStep(), dispositionStep()] }),
  });

  const produceId = data.steps.find((step) => step.as === 'produce').assignmentId;
  const reviewId = data.steps.find((step) => step.as === 'review').assignmentId;
  const result = data.steps.find((step) => step.as === 'close-round');
  assert.equal(result.type, 'disposition');
  assert.equal(result.appended, true);
  assert.equal(result.targetRef, produceId);
  assert.deepEqual(result.evidenceRefs, [reviewId]);

  const recorded = eventsOfType(tempDir, data.coordinationId, 'driver-disposition-recorded');
  assert.equal(recorded.length, 1);
  assert.equal(recorded[0].payload.targetRef, produceId);
  assert.deepEqual(recorded[0].payload.authorizedBy, { type: 'driver', id: WRITER_ID });
});

test('a $ref on a driver step pointing at a label that dispatches no Assignment is refused, not silently resolved', async () => {
  const { ctx } = setup();
  await assert.rejects(
    runCoordinationUseCase(ctx, {
      requestObject: request({
        steps: [produceStep(), authorizeStep(), dispositionStep({ targetRef: '$ref:authorize-recheck', evidenceRefs: [] })],
      }),
    }),
    (err) => err instanceof StoreError && /references unknown step label "authorize-recheck"/.test(err.message),
  );
});

test('a $ref naming a prototype-chain property (__proto__, toString, constructor) is refused as an unknown label, not resolved off Object.prototype', async () => {
  // `resolveRef`'s label lookup used a plain `{}` and the `in` operator,
  // which walks the prototype chain -- a step label that happens to match a
  // JS object built-in (e.g. "toString") would otherwise resolve to that
  // built-in instead of being refused as unknown. `labels` is now created
  // with `Object.create(null)`, so no prototype chain exists to walk.
  const { ctx } = setup();
  for (const protoLabel of ['__proto__', 'toString', 'constructor', 'hasOwnProperty', 'valueOf']) {
    await assert.rejects(
      runCoordinationUseCase(ctx, {
        requestObject: request({
          steps: [produceStep(), dispositionStep({ targetRef: `$ref:${protoLabel}`, evidenceRefs: [] })],
        }),
      }),
      (err) => err instanceof StoreError && new RegExp(`references unknown step label "${protoLabel}"`).test(err.message),
      `"${protoLabel}" must be refused as an unknown label, not resolved off Object.prototype`,
    );
  }
});

test('a repeated authorize step for one authorizationId is an idempotent no-op through the door; a second invocationKey reuse is refused', async () => {
  const { tempDir, ctx } = setup();
  const data = await runCoordinationUseCase(ctx, {
    requestObject: request({
      steps: [produceStep(), authorizeStep(), authorizeStep({ as: 'authorize-again' }), recheckStep()],
    }),
  });
  assert.equal(data.steps.find((s) => s.as === 'authorize-recheck').appended, true);
  assert.equal(data.steps.find((s) => s.as === 'authorize-again').appended, false);
  assert.equal(eventsOfType(tempDir, data.coordinationId, 'operation-authorized').length, 1);

  const second = setup();
  await assert.rejects(
    runCoordinationUseCase(second.ctx, {
      requestObject: request({
        steps: [
          produceStep(),
          authorizeStep(),
          // A different authorization instance reusing the SAME invocationKey.
          authorizeStep({ as: 'authorize-red-team', operationId: 'red-team-recheck', targetActorId: 'red-team', authorizationId: 'auth_recheck_2' }),
        ],
      }),
    }),
    (err) => err instanceof CoordinationError && /an invocationKey is consumed exactly once per session/.test(err.message),
  );
});

test('a repeated authorize step reports the PERSISTED authorization, not the second call\'s own payload, on the idempotent path', async () => {
  // authorizeOperation (store.mjs) returns the CALLER's own payload on its
  // appended:false path, not the already-persisted event -- so a repeat
  // authorize step naming an existing authorizationId with a DIFFERENT
  // grant/key/reason must not have those different fields echoed back as
  // if they were now in force. The persisted event never changed.
  const { tempDir, ctx } = setup();
  const data = await runCoordinationUseCase(ctx, {
    requestObject: request({
      steps: [
        produceStep(),
        authorizeStep({ grantedContextRefs: ['$ref:produce'] }),
        // Same authorizationId, but a DIFFERENT grant and invocationKey.
        authorizeStep({ as: 'authorize-again', grantedContextRefs: [], invocationKey: 'recheck:candidate@99' }),
        recheckStep(),
      ],
    }),
  });

  const first = data.steps.find((s) => s.as === 'authorize-recheck');
  const repeat = data.steps.find((s) => s.as === 'authorize-again');
  assert.equal(first.appended, true);
  assert.equal(repeat.appended, false);
  // The repeat's REPORTED grant/key must match the PERSISTED (first) event,
  // never the second call's own (different) request fields.
  assert.deepEqual(repeat.grantedContextRefs, first.grantedContextRefs);
  assert.equal(repeat.invocationKey, first.invocationKey);

  const authorized = eventsOfType(tempDir, data.coordinationId, 'operation-authorized');
  assert.equal(authorized.length, 1, 'the second, different-payload call must not have appended a second event');
  assert.deepEqual(authorized[0].payload.grantedContextRefs, first.grantedContextRefs);
});

test('R4: a SECOND request naming an EXISTING coordinationId resumes it instead of refusing at open -- reaches the SAME dispatch/authorize/disposition doors, no duplicated Assignment, no reconsumed invocationKey, disposition preserved', async () => {
  const { tempDir, ctx } = setup();
  const coordinationId = 'coord_run_resume_probe';

  // Call 1: produce, review, authorize a recheck. Stops short of the recheck
  // itself and the disposition -- a genuine mid-flight interruption point
  // (at least one Assignment AND one authorization already landed, per R4's
  // own acceptance wording).
  const first = await runCoordinationUseCase(ctx, {
    requestObject: request({ coordinationId, steps: [produceStep(), reviewStep(), authorizeStep()] }),
  });
  assert.equal(first.coordinationId, coordinationId);
  const produceId = first.steps.find((s) => s.as === 'produce').assignmentId;
  const reviewId = first.steps.find((s) => s.as === 'review').assignmentId;
  assert.match(produceId, /^asgn_/);

  const assignmentsAfterFirst = fs.readdirSync(path.join(tempDir, '.fgos', 'assignments')).sort();
  assert.equal(assignmentsAfterFirst.length, 2);

  // Call 2, same coordinationId: no `$ref:` label survives across separate
  // requests (each call starts its own `labels` map), so this call names
  // Call 1's own Assignment ids LITERALLY -- resolveRef's own documented
  // "already safe-charset-checked id, an advanced/resume use case" path.
  const second = await runCoordinationUseCase(ctx, {
    requestObject: request({
      coordinationId,
      steps: [
        recheckStep({ contextRefs: [produceId] }),
        dispositionStep({ targetRef: produceId, evidenceRefs: [reviewId] }),
      ],
    }),
  });
  assert.equal(second.coordinationId, coordinationId);
  const recheckStepResult = second.steps.find((s) => s.as === 'recheck');
  assert.equal(recheckStepResult.status, 'done');
  const dispositionStepResult = second.steps.find((s) => s.as === 'close-round');
  assert.equal(dispositionStepResult.appended, true);
  assert.equal(dispositionStepResult.disposition, 'accepted');

  // No duplicate Assignment: exactly 3 total across BOTH calls (produce,
  // review, recheck) -- the recheck did not re-materialize produce/review.
  const assignmentsAfterSecond = fs.readdirSync(path.join(tempDir, '.fgos', 'assignments')).sort();
  assert.equal(assignmentsAfterSecond.length, 3);
  assert.deepEqual(assignmentsAfterSecond.slice(0, 2), assignmentsAfterFirst);

  // No reconsumed invocationKey: exactly the ONE `operation-authorized` Call
  // 1 wrote; Call 2 issued no new authorization.
  const authEvents = eventsOfType(tempDir, coordinationId, 'operation-authorized');
  assert.equal(authEvents.length, 1);
  assert.equal(authEvents[0].payload.authorizationId, 'auth_recheck_1');

  // No lost disposition: exactly the ONE Call 2 recorded, still readable.
  const dispositionEvents = eventsOfType(tempDir, coordinationId, 'driver-disposition-recorded');
  assert.equal(dispositionEvents.length, 1);
  assert.equal(dispositionEvents[0].payload.disposition, 'accepted');

  // No hidden-context leakage: the recheck's own recorded contextRefs are
  // exactly the authorization's grantedContextRefs -- nothing wider reached
  // the executor across the resume boundary.
  const manifest = readManifest(coordinationId, { cwd: tempDir, repoRoot: tempDir });
  const recheckAssignmentPath = path.join(tempDir, '.fgos', 'assignments', recheckStepResult.assignmentId, 'assignment.json');
  const recheckAssignment = JSON.parse(fs.readFileSync(recheckAssignmentPath, 'utf8'));
  assert.deepEqual(recheckAssignment.contextRefs, [produceId]);
  assert.equal(manifest.assignmentRefs.length, 3);
});

test('R5 (resume-specific): a SECOND request cannot reconsume an invocationKey the FIRST request already consumed', async () => {
  const { tempDir, ctx } = setup();
  const coordinationId = 'coord_run_resume_invocation_key_probe';
  const first = await runCoordinationUseCase(ctx, {
    requestObject: request({ coordinationId, steps: [produceStep(), reviewStep(), authorizeStep()] }),
  });
  const produceId = first.steps.find((s) => s.as === 'produce').assignmentId;

  await assert.rejects(
    runCoordinationUseCase(ctx, {
      requestObject: request({
        coordinationId,
        // A different authorizationId, but the SAME invocationKey authorizeStep()
        // already consumed in Call 1 -- reused across the resume boundary.
        steps: [authorizeStep({ authorizationId: 'auth_recheck_2', grantedContextRefs: [produceId] })],
      }),
    }),
    (err) => err instanceof CoordinationError && /invocationKey ".*" in session ".*" was already used by authorization/.test(err.message),
  );
  assert.equal(eventsOfType(tempDir, coordinationId, 'operation-authorized').length, 1);
});

test('R5 (resume-specific): a session-wide cap declared at open time still governs across the resume boundary -- a SECOND request cannot exceed the ORIGINAL aggregateBounds.maxAssignments, and cannot loosen it by declaring a different one', async () => {
  const { tempDir, ctx } = setup();
  const coordinationId = 'coord_run_resume_over_cap_probe';
  const first = await runCoordinationUseCase(ctx, {
    requestObject: request({ coordinationId, aggregateBounds: { maxAssignments: 2 }, steps: [produceStep(), reviewStep()] }),
  });
  assert.equal(first.coordinationId, coordinationId);
  assert.equal(first.steps.length, 2);

  // Call 2 declares a WIDER cap (10) -- inert on resume, since `aggregateBounds`
  // is only ever consulted at `openSession` time, which this call never
  // reaches again. The session's ORIGINAL cap (2, already met by produce +
  // review) is what actually governs, so a 3rd Assignment is still refused.
  await assert.rejects(
    runCoordinationUseCase(ctx, {
      requestObject: request({
        coordinationId,
        aggregateBounds: { maxAssignments: 10 },
        steps: [{ type: 'operation', as: 'red-team', operationId: 'red-team-candidate', targetActorId: 'red-team', objective: 'Red-team the candidate.', expectedOutputs: ['agent-result.json (status, summary)'], contextRefs: [] }],
      }),
    }),
    (err) => err instanceof CoordinationError && /at or above the declared aggregateBounds\.maxAssignments cap of 2/.test(err.message),
  );

  const manifest = readManifest(coordinationId, { cwd: tempDir, repoRoot: tempDir });
  assert.equal(manifest.aggregateBounds.maxAssignments, 2, 'the ORIGINAL cap must still be on record -- a resumed request cannot rewrite it');
  assert.equal(manifest.assignmentRefs.length, 2);
});

test('R5 (resume-specific, HIGH): a SECOND request naming an EXISTING coordinationId with a DIFFERENT writerId is refused before any step dispatches -- cannot spend the original driver\'s authorization or inject work under a foreign identity', async () => {
  const { tempDir, ctx } = setup();
  const coordinationId = 'coord_run_resume_foreign_writer_probe';

  // Call 1, real driver: produce, review, and authorize a driver-authorized
  // recheck -- leaves one still-unconsumed `operation-authorized` grant on
  // the session, exactly the shape the live-reproduced attack spent.
  const first = await runCoordinationUseCase(ctx, {
    requestObject: request({ coordinationId, steps: [produceStep(), reviewStep(), authorizeStep()] }),
  });
  const produceId = first.steps.find((s) => s.as === 'produce').assignmentId;

  const manifestBefore = readManifest(coordinationId, { cwd: tempDir, repoRoot: tempDir });
  assert.equal(manifestBefore.assignmentRefs.length, 2);
  assert.equal(manifestBefore.provenanceRoot.writerId, WRITER_ID);
  const authEventsBefore = eventsOfType(tempDir, coordinationId, 'operation-authorized');
  assert.equal(authEventsBefore.length, 1);

  // Call 2, a SECOND, independent request naming the SAME coordinationId but
  // a writerId of the caller's own choosing -- never issued its own
  // authorization, and knows nothing but the coordinationId and the
  // protocol's own public operation/actor names. This is the exact shape
  // Red-Team live-reproduced: an ordinary "operation" step (the driver-
  // authorized recheck) resolving and consuming the ORIGINAL driver's
  // still-unconsumed grant under a foreign identity.
  await assert.rejects(
    runCoordinationUseCase(ctx, {
      requestObject: request({
        coordinationId,
        writerId: 'attacker-writer-id-not-the-original-driver',
        steps: [recheckStep({ contextRefs: [produceId] })],
      }),
    }),
    (err) =>
      err instanceof CoordinationError &&
      err.category === 'validation' &&
      /is not the driver identity of session "coord_run_resume_foreign_writer_probe"/.test(err.message) &&
      /attacker-writer-id-not-the-original-driver/.test(err.message) &&
      new RegExp(`provenanceRoot\\.writerId is "${WRITER_ID}"`).test(err.message),
  );

  // No side effect from the rejected attempt: no new Assignment materialized
  // (dispatchDeclaredOperation was never reached), and the ONE authorization
  // Call 1 wrote is still unconsumed-by-a-second-authorization-event (still
  // exactly 1 operation-authorized event -- the grant itself is spendable by
  // a real recheck, but the rejected attempt above must not have spent it or
  // recorded anything under the foreign identity).
  const manifestAfter = readManifest(coordinationId, { cwd: tempDir, repoRoot: tempDir });
  assert.equal(manifestAfter.assignmentRefs.length, 2, 'the rejected foreign-writerId request must not have dispatched any Assignment');
  assert.equal(fs.readdirSync(path.join(tempDir, '.fgos', 'assignments')).length, 2);
  const authEventsAfter = eventsOfType(tempDir, coordinationId, 'operation-authorized');
  assert.equal(authEventsAfter.length, 1, 'the rejected foreign-writerId request must not have consumed or re-issued an authorization');

  // Confirms the request door refuses BEFORE dispatch, not that dispatch
  // itself later rejects the attacker: a legitimate resume under the SAME
  // (real) writerId still reaches the recheck and spends the grant normally.
  const legit = await runCoordinationUseCase(ctx, {
    requestObject: request({ coordinationId, steps: [recheckStep({ contextRefs: [produceId] })] }),
  });
  assert.equal(legit.steps.find((s) => s.as === 'recheck').status, 'done');
});

test('R5 (resume-specific, LOW): resuming against a session with a malformed session.json fails closed with a corrupt-log error, never silently falls through to a fresh open', async () => {
  const { tempDir, ctx } = setup();
  const coordinationId = 'coord_run_resume_malformed_manifest_probe';
  const { sessionDir, manifestPath } = resolveSessionPaths(coordinationId, { cwd: tempDir, repoRoot: tempDir });
  fs.mkdirSync(sessionDir, { recursive: true });
  fs.writeFileSync(manifestPath, '{not valid json');

  await assert.rejects(
    runCoordinationUseCase(ctx, { requestObject: request({ coordinationId, steps: [produceStep()] }) }),
    (err) => err instanceof CoordinationError && err.category === 'corrupt-log' && /is not valid JSON/.test(err.message),
  );

  // Fails closed, not silently treated as "new": no fresh openSession attempt
  // ever ran (the broken session.json is untouched, no Assignment created).
  assert.equal(fs.readFileSync(manifestPath, 'utf8'), '{not valid json');
  assert.equal(fs.existsSync(path.join(tempDir, '.fgos', 'assignments')), false);
});

test('R5 (resume-specific, LOW): resuming against a coordinationId whose session directory exists but has no session.json (a crash between mkdirSync and writeManifestRaw) fails closed, never silently opens fresh over it', async () => {
  const { tempDir, ctx } = setup();
  const coordinationId = 'coord_run_resume_dangling_dir_probe';
  const { sessionDir } = resolveSessionPaths(coordinationId, { cwd: tempDir, repoRoot: tempDir });
  fs.mkdirSync(sessionDir, { recursive: true });

  // `findExistingManifest` sees `not-found` (ENOENT on session.json) and
  // correctly treats this as "no existing session" -- falls through to
  // `openStandaloneSession`/`openDeclaredProtocolSession`, whose own
  // `openSession` then hits its OWN `mkdirSync` EEXIST guard on the
  // already-present directory. Still fails closed -- no session.json is ever
  // written and no Assignment is created -- just at the pre-existing "already
  // exists" door rather than the resume identity gate (this shape has no
  // provenanceRoot.writerId to compare against yet).
  await assert.rejects(
    runCoordinationUseCase(ctx, { requestObject: request({ coordinationId, steps: [produceStep()] }) }),
    (err) => err instanceof CoordinationError && err.category === 'validation' && /already exists/.test(err.message),
  );

  assert.equal(fs.existsSync(path.join(sessionDir, 'session.json')), false);
  assert.equal(fs.existsSync(path.join(tempDir, '.fgos', 'assignments')), false);
});

test('two runs under one writer identity stay two disjoint membership records -- one writer never merges two sessions', async () => {
  const { tempDir, ctx } = setup();
  const [a, b] = await Promise.all([
    runCoordinationUseCase(ctx, { requestObject: request({ steps: [produceStep()] }) }),
    runCoordinationUseCase(ctx, { requestObject: request({ steps: [produceStep()] }) }),
  ]);
  assert.notEqual(a.coordinationId, b.coordinationId);

  const opts = { cwd: tempDir, repoRoot: tempDir };
  const manifestA = readManifest(a.coordinationId, opts);
  const manifestB = readManifest(b.coordinationId, opts);
  assert.equal(manifestA.provenanceRoot.writerId, manifestB.provenanceRoot.writerId);
  assert.equal(manifestA.assignmentRefs.length, 1);
  assert.equal(manifestB.assignmentRefs.length, 1);
  assert.equal(manifestA.assignmentRefs.filter((ref) => manifestB.assignmentRefs.includes(ref)).length, 0);
});

test('show stays read-only over a session carrying authorization and disposition events', async () => {
  const { tempDir, ctx } = setup();
  const data = await runCoordinationUseCase(ctx, {
    requestObject: request({ steps: [produceStep(), reviewStep(), authorizeStep(), recheckStep(), dispositionStep()] }),
  });

  const sessionDir = path.join(tempDir, '.fgos', 'coordination', 'sessions', data.coordinationId);
  const eventsBefore = fs.readFileSync(path.join(sessionDir, 'events.jsonl'));
  const manifestBefore = fs.readFileSync(path.join(sessionDir, 'session.json'));
  const dirBefore = fs.readdirSync(sessionDir).sort();

  const shown = showCoordinationUseCase({ cwd: tempDir, repoRoot: tempDir }, { id: data.coordinationId });
  assert.equal(shown.coordinationId, data.coordinationId);
  assert.ok(shown.eventCount > 0);

  assert.deepEqual(fs.readFileSync(path.join(sessionDir, 'events.jsonl')), eventsBefore);
  assert.deepEqual(fs.readFileSync(path.join(sessionDir, 'session.json')), manifestBefore);
  assert.deepEqual(fs.readdirSync(sessionDir).sort(), dirBefore);
});

// ─── R5 (Step 09 Phase 02): show renders disposition/recheck state a user
// actually needs, sourced from replaySession's own reconstruction ────────

test('show renders authorizations issued (consumed), dispositions recorded, and which declared operations are still awaiting driver authorization', async () => {
  const { tempDir, ctx } = setup();
  const data = await runCoordinationUseCase(ctx, {
    requestObject: request({ steps: [produceStep(), reviewStep(), authorizeStep(), recheckStep(), dispositionStep()] }),
  });
  const opts = { cwd: tempDir, repoRoot: tempDir };

  const shown = showCoordinationUseCase(opts, { id: data.coordinationId });

  // Authorizations issued: the one real `authorizeStep()` above, consumed
  // by the recheck Assignment it authorized.
  assert.equal(shown.authorizations.length, 1);
  assert.deepEqual(shown.authorizations[0], {
    authorizationId: 'auth_recheck_1',
    operationId: 'reviewer-recheck',
    nodeId: 'phase-recheck',
    targetActorId: 'reviewer',
    consumed: true,
  });
  assert.deepEqual(shown.ignoredAuthorizations, []);

  // Dispositions recorded: the one real `dispositionStep()` above, with its
  // $ref:produce/$ref:review placeholders already resolved to real,
  // session-owned Assignment ids by run.mjs -- both marked owned, and NOT
  // post-terminal (the session never closed in this test).
  assert.equal(shown.dispositions.length, 1);
  const disposition = shown.dispositions[0];
  assert.equal(disposition.disposition, 'accepted');
  assert.equal(disposition.rationale, 'The recheck confirmed the revision closed the finding.');
  assert.equal(disposition.postTerminal, false);
  assert.equal(disposition.targetRefOwnedBySession, true);
  assert.deepEqual(disposition.evidenceRefsOwnedBySession, [true]);
  const manifest = readManifest(data.coordinationId, opts);
  assert.ok(manifest.assignmentRefs.includes(disposition.targetRef), 'targetRef should have resolved to a real session Assignment id');

  // Declared driver-authorized operations still awaiting authorization:
  // revise-candidate and red-team-recheck (reviewer-recheck was just
  // authorized above, so it must NOT appear here).
  assert.deepEqual(
    shown.pendingDriverAuthorizations.map((b) => b.operationId).sort(),
    ['red-team-recheck', 'revise-candidate'],
  );
  assert.ok(!shown.pendingDriverAuthorizations.some((b) => b.operationId === 'reviewer-recheck'));
});

test('show marks a disposition recorded after a terminal event as postTerminal, without hiding it (a hand-crafted/racing write recordDriverDisposition itself would refuse today)', async () => {
  const { tempDir, ctx } = setup();
  const data = await runCoordinationUseCase(ctx, {
    requestObject: request({ steps: [produceStep(), reviewStep(), authorizeStep(), recheckStep()] }),
  });
  const opts = { cwd: tempDir, repoRoot: tempDir };
  const manifest = readManifest(data.coordinationId, opts);
  assert.equal(manifest.status, 'active', 'this fixture never dispatches red-team/fixer, so quorum close must not have happened yet');

  transitionSessionStatus(data.coordinationId, 'cancelled', { reason: 'stopped for the test' }, opts);
  const { eventsPath, sessionDir } = resolveSessionPaths(data.coordinationId, opts);
  appendEvent(
    eventsPath,
    {
      type: 'driver-disposition-recorded',
      payload: {
        targetRef: manifest.assignmentRefs[0],
        disposition: 'accepted',
        rationale: 'Written after the session already closed.',
        evidenceRefs: [],
        authorizedBy: { type: 'driver', id: WRITER_ID },
      },
    },
    sessionDir,
  );

  const shown = showCoordinationUseCase(opts, { id: data.coordinationId });
  assert.equal(shown.dispositions.length, 1);
  assert.equal(shown.dispositions[0].postTerminal, true);
  assert.equal(shown.dispositions[0].targetRefOwnedBySession, true);
});

test('show marks a disposition ref as NOT session-owned when it names a real Assignment belonging to a different coordination session (defense-in-depth mirror of store.mjs\'s own assertDispositionRefOwnedBySession, against a write path that bypassed recordDriverDisposition entirely)', async () => {
  const { tempDir, ctx } = setup();
  const opts = { cwd: tempDir, repoRoot: tempDir };

  const other = await runCoordinationUseCase(ctx, { requestObject: request({ coordinationId: 'coord_show_foreign_owner', steps: [produceStep()] }) });
  const foreignAssignmentId = readManifest(other.coordinationId, opts).assignmentRefs[0];

  const data = await runCoordinationUseCase(ctx, {
    requestObject: request({ coordinationId: 'coord_show_foreign_ref', steps: [produceStep(), reviewStep(), authorizeStep(), recheckStep()] }),
  });
  const manifest = readManifest(data.coordinationId, opts);
  const { eventsPath, sessionDir } = resolveSessionPaths(data.coordinationId, opts);
  appendEvent(
    eventsPath,
    {
      type: 'driver-disposition-recorded',
      payload: {
        targetRef: manifest.assignmentRefs[0],
        disposition: 'accepted',
        rationale: 'Hand-crafted: cites another session\'s own Assignment as evidence.',
        evidenceRefs: [foreignAssignmentId],
        authorizedBy: { type: 'driver', id: WRITER_ID },
      },
    },
    sessionDir,
  );

  const shown = showCoordinationUseCase(opts, { id: data.coordinationId });
  assert.equal(shown.dispositions.length, 1);
  assert.equal(shown.dispositions[0].targetRefOwnedBySession, true);
  assert.deepEqual(shown.dispositions[0].evidenceRefsOwnedBySession, [false]);
});

test('show: an agent-led session (no definitionRef) reports pendingDriverAuthorizations as null, not an invented empty list', async () => {
  const { tempDir, ctx } = setup();
  const opts = { cwd: tempDir, repoRoot: tempDir };
  const data = await runCoordinationUseCase(ctx, {
    requestObject: {
      kind: 'agent-led',
      objective: 'Agent-led, no FlowDefinition bound.',
      writerId: WRITER_ID,
      primaryRole: 'researcher',
      task: { expectedOutputs: ['agent-result.json (status, summary)'], evidenceRequired: 'reported' },
    },
  });
  const shown = showCoordinationUseCase(opts, { id: data.coordinationId });
  assert.equal(shown.definitionRef, null);
  assert.equal(shown.pendingDriverAuthorizations, null);
  assert.deepEqual(shown.authorizations, []);
  assert.deepEqual(shown.dispositions, []);
});
