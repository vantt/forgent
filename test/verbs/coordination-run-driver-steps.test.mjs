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
import { createHash } from 'node:crypto';

import { validateCoordinationRequest } from '../../src/verbs/coordination/schema.mjs';
import { runCoordinationUseCase } from '../../src/verbs/coordination/run.mjs';
import { showCoordinationUseCase } from '../../src/verbs/coordination/show.mjs';
import { compileDagRequest } from '../../src/verbs/coordination/dag-request-compiler.mjs';
import { StoreError } from '../../src/state/store.mjs';
import { CoordinationError, SCHEMA_VERSION_3 } from '../../src/runner/coordination/schema.mjs';
import { FlowDefinitionError } from '../../src/runner/definitions/schema.mjs';
import { readSessionEvents, readManifest, resolveSessionPaths, appendEvent, transitionSessionStatus, createSessionAssignment } from '../../src/runner/coordination/store.mjs';
import { openDeclaredProtocolSession, cancelSession, dispatchDeclaredOperation, replaceSessionActor } from '../../src/runner/coordination/session-engine.mjs';

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

function fakeExecutor(tempDir, { delayObjective = null, delayMs = 0 } = {}) {
  const executorScript = path.join(tempDir, `fake-executor-${Math.random().toString(36).slice(2)}.mjs`);
  fs.writeFileSync(
    executorScript,
    `
    import fs from 'node:fs';
    import path from 'node:path';
    const prompt = process.argv[2] ?? '';
    const assignmentId = prompt.match(/^Assignment: (.+)$/m)?.[1];
    if (!assignmentId) throw new Error('fake executor needs its own Assignment prompt');
    const runsDir = path.join(process.cwd(), '.fgos', 'assignments', assignmentId, 'runs');
    const run = fs.readdirSync(runsDir).sort().at(-1);
    const runDir = path.join(runsDir, run);
    const finish = () => {
      fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Report\\nValidated.\\n');
      fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'Validated.' }));
      process.stdout.write('Validated.\\n');
    };
    if (${JSON.stringify(delayObjective)} && prompt.includes(${JSON.stringify(delayObjective)})) setTimeout(finish, ${delayMs});
    else finish();
    `,
  );
  return {
    executor: { allowCrossProvider: true, command: process.execPath, args: [executorScript, '{prompt}'] },
    models: { standard: 'test-model', nano: 'test-model', mini: 'test-model', advanced: 'test-model', flagship: 'test-model', frontier: 'test-model' },
    timeoutMs: 10000,
  };
}

// Same real subprocess door as fakeExecutor(), with independent delay windows
// so a DAG test can make two siblings settle only milliseconds apart without
// coordinating through scheduler internals.
function fakeExecutorWithObjectiveDelays(tempDir, delays) {
  const executorScript = path.join(tempDir, `fake-executor-delays-${Math.random().toString(36).slice(2)}.mjs`);
  fs.writeFileSync(
    executorScript,
    `
    import fs from 'node:fs';
    import path from 'node:path';
    const prompt = process.argv[2] ?? '';
    const assignmentId = prompt.match(/^Assignment: (.+)$/m)?.[1];
    if (!assignmentId) throw new Error('fake executor needs its own Assignment prompt');
    const runsDir = path.join(process.cwd(), '.fgos', 'assignments', assignmentId, 'runs');
    const run = fs.readdirSync(runsDir).sort().at(-1);
    const runDir = path.join(runsDir, run);
    const delays = ${JSON.stringify(delays)};
    const delay = Object.entries(delays).find(([needle]) => prompt.includes(needle))?.[1] ?? 0;
    setTimeout(() => {
      fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Report\\nValidated.\\n');
      fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'Validated.' }));
      process.stdout.write('Validated.\\n');
    }, delay);
    `,
  );
  return {
    executor: { allowCrossProvider: true, command: process.execPath, args: [executorScript, '{prompt}'] },
    models: { standard: 'test-model', nano: 'test-model', mini: 'test-model', advanced: 'test-model', flagship: 'test-model', frontier: 'test-model' },
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

function reviewStep(overrides = {}) {
  return {
    type: 'operation',
    as: 'review',
    operationId: 'review-candidate',
    targetActorId: 'reviewer',
    objective: 'Review the candidate.',
    expectedOutputs: ['agent-result.json (status, summary)'],
    contextRefs: ['$ref:produce'],
    ...overrides,
  };
}

function redTeamStep(overrides = {}) {
  return {
    type: 'operation',
    as: 'red-team',
    operationId: 'red-team-candidate',
    targetActorId: 'red-team',
    objective: 'Red-team the candidate.',
    expectedOutputs: ['agent-result.json (status, summary)'],
    contextRefs: ['$ref:produce'],
    ...overrides,
  };
}

test('legacy declared-protocol operation steps remain sequential: each later step is dispatched only after the preceding step has settled', async () => {
  const { tempDir, ctx } = setup();
  const result = await runCoordinationUseCase(ctx, {
    requestObject: request({
      coordinationId: 'coord_phase00_legacy_sequential',
      steps: [produceStep(), reviewStep()],
    }),
  });

  assert.deepEqual(result.steps.map((step) => step.as), ['produce', 'review']);
  const events = readSessionEvents(result.coordinationId, { cwd: tempDir, repoRoot: tempDir });
  assert.deepEqual(
    events.map((event) => event.type),
    ['session-opened', 'actor-bound', 'actor-bound', 'actor-bound', 'actor-bound', 'assignment-created', 'result-linked', 'assignment-created', 'result-linked'],
    'legacy non-DAG event order is the pre-DAG characterization and must remain byte-for-byte compatible in event shape',
  );
  const created = events.filter((event) => event.type === 'assignment-created');
  assert.equal(created.length, 2);
  assert.deepEqual(created.map((event) => event.payload.actorId), ['doer', 'reviewer']);
  const assignments = created.map((event) =>
    JSON.parse(fs.readFileSync(path.join(tempDir, '.fgos', 'assignments', event.payload.assignmentId, 'assignment.json'), 'utf8')),
  );
  assert.equal(
    assignments[1].contextRefs.includes(result.steps[0].assignmentId),
    true,
    'the second legacy step receives the first step\'s resolved Assignment ref, which can exist only after the first awaited dispatch completed',
  );
  assert.ok(result.steps.every((step) => step.schedulerOutcome === undefined && step.overlapGroup === undefined), 'legacy responses must not gain DAG scheduler fields');
  assert.equal(result.dag, undefined, 'legacy responses retain their pre-Phase-05 shape');
});

test('dependsOn is rejected on a non-DAG request instead of being silently inert', () => {
  assert.throws(
    () => validateCoordinationRequest(request({ steps: [{ ...produceStep(), dependsOn: ['review'] }] })),
    /available only when top-level "dag" is exactly true/,
  );
});

function request(overrides = {}) {
  return {
    kind: 'declared-protocol',
    objective: 'Prove the driver-authority request steps reach the real engine doors.',
    writerId: WRITER_ID,
    close: true, protocolRef: { id: DEFINITION_ID },
    steps: [produceStep(), reviewStep()],
    ...overrides,
  };
}

test('DAG request round-trips the real validator, compiler, and run door without undefined semantics', async () => {
  const { ctx } = setup();
  const raw = request({ dag: true, coordinationId: 'coord_dag_real_validator', steps: [produceStep(), reviewStep()] });
  const normalized = validateCoordinationRequest(raw);
  assert.ok(Object.values(normalized.steps[0]).some((value) => value === undefined), 'the real schema preserves omitted optional fields as undefined');
  const result = await runCoordinationUseCase(ctx, { requestObject: raw });
  assert.equal(result.coordinationId, 'coord_dag_real_validator');
});

test('DAG resume declaration fingerprint gate rejects a genuinely mutated second request with zero new events', async () => {
  const { tempDir, ctx } = setup();
  const coordinationId = 'coord_dag_resume_fingerprint';
  const original = request({ dag: true, coordinationId, steps: [produceStep(), reviewStep()] });
  await runCoordinationUseCase(ctx, { requestObject: original });
  const before = readSessionEvents(coordinationId, { cwd: tempDir, repoRoot: tempDir });
  const changed = request({
    dag: true,
    coordinationId,
    steps: [produceStep(), { ...reviewStep(), expectedOutputs: ['agent-result.json (status, summary)', 'changed-output'] }],
  });
  await assert.rejects(
    runCoordinationUseCase(ctx, { requestObject: changed }),
    (err) => err instanceof StoreError && /declaration differs/.test(err.message),
  );
  assert.deepEqual(readSessionEvents(coordinationId, { cwd: tempDir, repoRoot: tempDir }), before);
});

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

function authorizeReviseStep(overrides = {}) {
  return {
    type: 'authorize',
    as: 'authorize-revise',
    operationId: 'revise-candidate',
    targetActorId: 'fixer',
    authorizationId: 'auth_revise_1',
    invocationKey: 'revise:candidate@2',
    reason: 'The candidate needs a revision before recheck.',
    grantedContextRefs: ['$ref:produce'],
    ...overrides,
  };
}

function reviseStep(overrides = {}) {
  return {
    type: 'operation',
    as: 'revise',
    operationId: 'revise-candidate',
    targetActorId: 'fixer',
    objective: 'Revise the candidate.',
    expectedOutputs: ['agent-result.json (status, summary)'],
    contextRefs: ['$ref:produce'],
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

function redTeamRecheckStep(overrides = {}) {
  return {
    type: 'operation',
    as: 'red-team-recheck',
    operationId: 'red-team-recheck',
    targetActorId: 'red-team',
    objective: 'Red-team recheck the revised candidate.',
    expectedOutputs: ['agent-result.json (status, summary)'],
    contextRefs: ['$ref:revise'],
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

// P10.10 (Promotion And Closeout): the fifth step kind, reaching
// `linkSessionContribution`. This fixture's own operations declare no
// `contributions.allowedTypes`/`contextAccess.visibilityWindowRef`, so an
// end-to-end dispatch through THIS fixture is out of scope here (would only
// re-derive `linkSessionContribution`'s own already-proven engine-level
// checks) -- the real end-to-end proof, against a real
// contributions/window-declaring protocol, is
// test/verbs/coordination-group-thinking-rfc-review-lite-pack-conformance.test.mjs's
// own dedicated P10.10 test. What is proven HERE, matching this file's own
// established split (see this file's header comment), is that the request
// boundary shapes/rejects a "contribution" step correctly before it ever
// reaches the engine.
function contributionStep(overrides = {}) {
  return {
    type: 'contribution',
    as: 'link-review',
    contributionId: 'contrib_review_1',
    contributionType: 'proposal',
    assignmentId: '$ref:produce',
    roundKey: 'round-1',
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
  // `authorizationId`/`invocationKey` now also state WHY they are required
  // and what a retry needs: because `authorizationId` seeds the dispatch's
  // default taskKey, re-sending a previous attempt's ids re-presents the same
  // task instead of running a new one. A driver hitting the old bare
  // "must be a non-empty string" read it as malformed input rather than as
  // retry semantics. The patterns below still pin one dedicated,
  // field-naming refusal per missing field -- this test's actual subject --
  // and additionally pin that the retry guidance is present, so the wording
  // cannot silently regress to the bare form.
  for (const [field, pattern] of [
    ['authorizationId', /steps\[1\]\.authorizationId is required for an "authorize" step\..*FRESH authorizationId/s],
    ['invocationKey', /steps\[1\]\.invocationKey is required.*fresh one alongside a fresh authorizationId/s],
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

test('validateCoordinationRequest: the unknown-step-type message names all seven supported types', () => {
  assert.throws(
    () => validateCoordinationRequest(request({ steps: [{ type: 'authorise', as: 'typo' }] })),
    (err) =>
      err instanceof StoreError &&
      /steps\[0\]\.type must be "operation", "fan-out", "authorize", "disposition", "contribution", "human-turn", or "close"/.test(err.message),
  );
});

test('validateCoordinationRequest: a "contribution" step may not declare linkedBy -- driver provenance comes from the request\'s own writerId', () => {
  assert.throws(
    () => validateCoordinationRequest(request({ steps: [produceStep(), contributionStep({ linkedBy: { type: 'driver', id: 'someone-else' } })] })),
    (err) => err instanceof StoreError && /declares "linkedBy"/.test(err.message) && /driver provenance is pinned to the session's own top-level "writerId"/.test(err.message),
  );
});

test('validateCoordinationRequest: an unknown field on a "contribution" step is rejected', () => {
  assert.throws(
    () => validateCoordinationRequest(request({ steps: [produceStep(), contributionStep({ linkedByOverride: 'nope' }) ] })),
    (err) => err instanceof StoreError && /unknown field "linkedByOverride" in steps\[1\] \(type "contribution"\)/.test(err.message),
  );
});

test('validateCoordinationRequest: a "contribution" step missing contributionId/assignmentId/roundKey is rejected, one message each', () => {
  for (const [field, pattern] of [
    ['contributionId', /steps\[1\]\.contributionId must be a non-empty string/],
    ['assignmentId', /steps\[1\]\.assignmentId must be a non-empty string/],
    ['roundKey', /steps\[1\]\.roundKey is required/],
  ]) {
    const step = contributionStep();
    delete step[field];
    assert.throws(
      () => validateCoordinationRequest(request({ steps: [produceStep(), step] })),
      (err) => err instanceof StoreError && pattern.test(err.message),
      `expected a dedicated refusal for a missing ${field}`,
    );
  }
});

test('validateCoordinationRequest: a "contribution" step\'s contributionType must be one of the closed MVP8 contribution types', () => {
  assert.throws(
    () => validateCoordinationRequest(request({ steps: [produceStep(), contributionStep({ contributionType: 'comment' })] })),
    (err) => err instanceof StoreError && /contributionType must be one of the closed MVP8 contribution types/.test(err.message),
  );
  assert.throws(
    () => validateCoordinationRequest(request({ steps: [produceStep(), (() => { const s = contributionStep(); delete s.contributionType; return s; })()] })),
    (err) => err instanceof StoreError && /contributionType must be one of the closed MVP8 contribution types/.test(err.message),
  );
});

test('validateCoordinationRequest: a path-escaping contributionId is rejected', () => {
  assert.throws(
    () => validateCoordinationRequest(request({ steps: [produceStep(), contributionStep({ contributionId: '../../evil' })] })),
    (err) => err instanceof StoreError && /steps\[1\]\.contributionId .* path escape rejected/s.test(err.message),
  );
});

test('validateCoordinationRequest: a well-formed "contribution" step normalizes to exactly the engine-call fields, anchors/respondsTo included', () => {
  const normalized = validateCoordinationRequest(
    request({ steps: [produceStep(), contributionStep({ anchors: ['contrib_prior_1'], respondsTo: 'contrib_prior_1' })] }),
  );
  assert.deepEqual(normalized.steps[1], {
    type: 'contribution',
    as: 'link-review',
    contributionId: 'contrib_review_1',
    contributionType: 'proposal',
    assignmentId: '$ref:produce',
    roundKey: 'round-1',
    anchors: ['contrib_prior_1'],
    respondsTo: 'contrib_prior_1',
  });
});

test('validateCoordinationRequest: a "contribution" step\'s empty anchors array normalizes to undefined (P10.10 Fix Round 1, L1 -- so "anchors: []" and an omitted anchors key produce byte-identical downstream behavior, preserving the idempotent-repeat path)', () => {
  const normalized = validateCoordinationRequest(request({ steps: [produceStep(), contributionStep({ anchors: [] })] }));
  assert.strictEqual(normalized.steps[1].anchors, undefined);
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

test('a resume request runs every step before quorum close: revise completing the fixer does not close the session before later recheck steps in the same request', async () => {
  const { tempDir, ctx } = setup();
  const coordinationId = 'coord_run_no_mid_request_quorum_close';
  const opts = { cwd: tempDir, repoRoot: tempDir };

  const first = await runCoordinationUseCase(ctx, {
    requestObject: request({
      coordinationId,
      steps: [produceStep(), reviewStep(), redTeamStep()],
    }),
  });
  assert.equal(first.closed, false, 'before the fixer revision, the first-pass request must leave the session open');
  assert.equal(readManifest(coordinationId, opts).status, 'active');

  const produceId = first.steps.find((step) => step.as === 'produce').assignmentId;
  const second = await runCoordinationUseCase(ctx, {
    requestObject: request({
      coordinationId,
      steps: [
        authorizeReviseStep({
          grantedContextRefs: [produceId],
        }),
        reviseStep({
          contextRefs: [produceId],
        }),
        authorizeStep({
          grantedContextRefs: ['$ref:revise'],
        }),
        recheckStep({
          contextRefs: ['$ref:revise'],
        }),
        authorizeStep({
          as: 'authorize-red-team-recheck',
          operationId: 'red-team-recheck',
          targetActorId: 'red-team',
          authorizationId: 'auth_red_team_recheck_1',
          invocationKey: 'red-team-recheck:candidate@2',
          grantedContextRefs: ['$ref:revise'],
        }),
        redTeamRecheckStep(),
      ],
    }),
  });

  assert.equal(second.closed, true, 'the session should close only after all resume-request steps have run');
  assert.equal(readManifest(coordinationId, opts).status, 'completed');
  assert.deepEqual(
    second.steps.map((step) => step.as),
    ['authorize-revise', 'revise', 'authorize-recheck', 'recheck', 'authorize-red-team-recheck', 'red-team-recheck'],
  );
  assert.equal(second.steps.find((step) => step.as === 'revise').status, 'done');
  assert.equal(second.steps.find((step) => step.as === 'recheck').status, 'done');
  assert.equal(second.steps.find((step) => step.as === 'red-team-recheck').status, 'done');

  const events = readSessionEvents(coordinationId, opts);
  const terminalIndex = events.findIndex((event) => event.type === 'session-completed');
  assert.ok(terminalIndex > 0, 'quorum close must write a terminal event after the dispatch events');
  const redTeamRecheckId = second.steps.find((step) => step.as === 'red-team-recheck').assignmentId;
  const redTeamRecheckIndex = events.findIndex((event) => event.type === 'assignment-created' && event.payload.assignmentId === redTeamRecheckId);
  assert.ok(redTeamRecheckIndex >= 0 && redTeamRecheckIndex < terminalIndex, 'the final recheck assignment must be created before the terminal close event');
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

test('R5 (resume-specific, LOW): resuming against a coordinationId whose session directory exists but has no session.json (a crash between mkdirSync and writeManifestRaw, or a manifest deleted mid-flight) fails closed with the SAME not-found category preserved -- never silently misdiagnosed as "already exists"', async () => {
  const { tempDir, ctx } = setup();
  const coordinationId = 'coord_run_resume_dangling_dir_probe';
  const { sessionDir } = resolveSessionPaths(coordinationId, { cwd: tempDir, repoRoot: tempDir });
  fs.mkdirSync(sessionDir, { recursive: true });

  // Phase 04 op_038 fix: `findExistingSession` used to see `not-found`
  // (ENOENT on session.json) and swallow it to `undefined` ("no existing
  // session") -- falling through to `openStandaloneSession`/
  // `openDeclaredProtocolSession`, whose own `openSession` then hit its
  // OWN `mkdirSync` EEXIST guard on the already-present directory and threw
  // a misleading `CoordinationError('validation', '...already exists')`.
  // That misdiagnosed a missing/corrupted manifest as a naming collision.
  // Now `findExistingSession` itself notices the sessionDir is present
  // despite the not-found and re-throws with the SAME 'not-found' category
  // preserved, so the real integrity failure surfaces directly instead.
  // Still fails closed either way -- no session.json is ever written and no
  // Assignment is created.
  await assert.rejects(
    runCoordinationUseCase(ctx, { requestObject: request({ coordinationId, steps: [produceStep()] }) }),
    (err) => err instanceof CoordinationError && err.category === 'not-found' && !/already exists/.test(err.message),
  );

  assert.equal(fs.existsSync(path.join(sessionDir, 'session.json')), false);
  assert.equal(fs.existsSync(path.join(tempDir, '.fgos', 'assignments')), false);
});

test('op_038: a real, already-open session whose session.json is deleted mid-flight (a concurrent process or crash) refuses a resume attempt with not-found preserved, not a misleading "already exists" validation error', async () => {
  const { tempDir, ctx } = setup();
  const coordinationId = 'coord_run_resume_manifest_deleted_mid_flight';
  const opened = await runCoordinationUseCase(ctx, { requestObject: request({ coordinationId, steps: [produceStep()] }) });
  assert.equal(opened.coordinationId, coordinationId);

  const { sessionDir, manifestPath } = resolveSessionPaths(coordinationId, { cwd: tempDir, repoRoot: tempDir });
  assert.equal(fs.existsSync(manifestPath), true, 'sanity: the session really was opened with a manifest on disk');
  fs.unlinkSync(manifestPath);

  await assert.rejects(
    runCoordinationUseCase(ctx, { requestObject: request({ coordinationId, steps: [produceStep()] }) }),
    (err) => err instanceof CoordinationError && err.category === 'not-found' && !/already exists/.test(err.message),
  );

  assert.equal(fs.existsSync(sessionDir), true);
  assert.equal(fs.existsSync(manifestPath), false);
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

// ─── Phase 03.1: the "human-turn" request step (trusted external-input/
// human-decision provenance door, P02.1's BL4 row) ──────────────────────────

function humanTurnStep(overrides = {}) {
  return {
    type: 'human-turn',
    as: 'person-turn-1',
    turnId: 'turn_1',
    turnOrdinal: 1,
    channel: 'claude-code-chat',
    artifactRef: 'human/1-person.md',
    externalRef: 'claude-code-transcript:sess-1:uuid-1',
    attributedTo: { type: 'person', id: 'the-user' },
    ...overrides,
  };
}

test('validateCoordinationRequest: a "human-turn" step may not declare revision -- run.mjs computes it from real bytes', () => {
  assert.throws(
    () => validateCoordinationRequest(request({ steps: [produceStep(), humanTurnStep({ revision: 'sha256:deadbeef' })] })),
    (err) => err instanceof StoreError && /unknown field "revision" in steps\[1\] \(type "human-turn"\)/.test(err.message),
  );
});

test('validateCoordinationRequest: a "human-turn" step may not declare recordedBy -- driver provenance comes from the request\'s own writerId', () => {
  assert.throws(
    () => validateCoordinationRequest(request({ steps: [produceStep(), humanTurnStep({ recordedBy: { type: 'driver', id: 'someone-else' } })] })),
    (err) => err instanceof StoreError && /unknown field "recordedBy" in steps\[1\] \(type "human-turn"\)/.test(err.message),
  );
});

test('validateCoordinationRequest: a "human-turn" step missing turnId/turnOrdinal/channel/artifactRef/externalRef/attributedTo is rejected, one message each', () => {
  for (const [field, pattern] of [
    ['turnId', /steps\[1\]\.turnId must be a non-empty string/],
    ['turnOrdinal', /steps\[1\]\.turnOrdinal must be a positive integer/],
    ['channel', /steps\[1\]\.channel is required/],
    ['artifactRef', /steps\[1\]\.artifactRef is required/],
    ['externalRef', /steps\[1\]\.externalRef is required/],
    ['attributedTo', /steps\[1\]\.attributedTo is required/],
  ]) {
    const step = humanTurnStep();
    delete step[field];
    assert.throws(
      () => validateCoordinationRequest(request({ steps: [produceStep(), step] })),
      (err) => err instanceof StoreError && pattern.test(err.message),
      `expected a dedicated refusal for a missing ${field}`,
    );
  }
});

test('validateCoordinationRequest: a "human-turn" step\'s attributedTo.type must be "person"', () => {
  assert.throws(
    () => validateCoordinationRequest(request({ steps: [produceStep(), humanTurnStep({ attributedTo: { type: 'driver', id: 'x' } })] })),
    (err) => err instanceof StoreError && /attributedTo\.type must be "person"/.test(err.message),
  );
});

test('validateCoordinationRequest: a "human-turn" step\'s attributedTo may carry no field beyond {type, id}', () => {
  assert.throws(
    () =>
      validateCoordinationRequest(
        request({ steps: [produceStep(), humanTurnStep({ attributedTo: { type: 'person', id: 'x', kind: 'decision' } })] }),
      ),
    (err) => err instanceof StoreError && /unknown field "kind"/.test(err.message),
  );
});

test('validateCoordinationRequest: a path-escaping turnId is rejected', () => {
  assert.throws(
    () => validateCoordinationRequest(request({ steps: [produceStep(), humanTurnStep({ turnId: '../../evil' })] })),
    (err) => err instanceof StoreError && /steps\[1\]\.turnId .* path escape rejected/s.test(err.message),
  );
});

test('validateCoordinationRequest: a well-formed "human-turn" step normalizes to exactly the engine-call fields, no revision/recordedBy present', () => {
  const normalized = validateCoordinationRequest(
    request({ steps: [produceStep(), humanTurnStep({ respondsToRefs: ['turn_0'] })] }),
  );
  assert.deepEqual(normalized.steps[1], {
    type: 'human-turn',
    as: 'person-turn-1',
    turnId: 'turn_1',
    turnOrdinal: 1,
    channel: 'claude-code-chat',
    artifactRef: 'human/1-person.md',
    externalRef: 'claude-code-transcript:sess-1:uuid-1',
    attributedTo: { type: 'person', id: 'the-user' },
    respondsToRefs: ['turn_0'],
  });
});

test('validateCoordinationRequest: a "human-turn" step\'s respondsToRefs entries are bare turn ids -- a reserved-prefix/path-escaping value is rejected', () => {
  assert.throws(
    () => validateCoordinationRequest(request({ steps: [produceStep(), humanTurnStep({ respondsToRefs: ['human-turn:turn_0'] })] })),
    (err) => err instanceof StoreError && /steps\[1\]\.respondsToRefs\[0\] .* path escape rejected/s.test(err.message),
  );
});

test('a "human-turn" step reaches recordHumanTurn: revision is computed from the real file bytes, never accepted from the caller', async () => {
  const { tempDir, ctx } = setup();
  fs.mkdirSync(path.join(tempDir, 'human'), { recursive: true });
  const artifactPath = path.join(tempDir, 'human', '1-person.md');
  fs.writeFileSync(artifactPath, 'The person said: ship it.\n');
  const expectedRevision = `sha256:${createHash('sha256').update(fs.readFileSync(artifactPath)).digest('hex')}`;

  const data = await runCoordinationUseCase(ctx, {
    requestObject: request({ steps: [produceStep(), humanTurnStep()] }),
  });

  const result = data.steps.find((step) => step.as === 'person-turn-1');
  assert.equal(result.type, 'human-turn');
  assert.equal(result.appended, true);
  assert.equal(result.turnId, 'turn_1');
  assert.equal(result.revision, expectedRevision);
  assert.deepEqual(result.attributedTo, { type: 'person', id: 'the-user' });

  const recorded = eventsOfType(tempDir, data.coordinationId, 'human-turn-recorded');
  assert.equal(recorded.length, 1);
  assert.equal(recorded[0].payload.revision, expectedRevision);
  assert.deepEqual(recorded[0].payload.recordedBy, { type: 'driver', id: WRITER_ID });
});

test('a "human-turn" step fails loudly when artifactRef does not resolve to a real file, instead of recording an unverified provenance stamp', async () => {
  const { ctx } = setup();
  await assert.rejects(
    runCoordinationUseCase(ctx, {
      requestObject: request({ steps: [produceStep(), humanTurnStep({ artifactRef: 'human/does-not-exist.md' })] }),
    }),
    (err) => err instanceof StoreError && /does not resolve to a real file/.test(err.message),
  );
});

// Fix round 1 (Reviewer R-P03.1-05 / Red-Team Finding 3, LOW): `artifactRef`
// had no workspace containment check -- a `../` traversal or an absolute
// path resolved and hashed a file OUTSIDE the working directory the session
// was opened against, unlike `turnId`/`respondsToRefs` in the same step
// (both charset-restricted at the request boundary to reject a path
// escape). Both attack shapes confirmed live by Red-Team before this fix.
test('a "human-turn" step\'s artifactRef is refused when it escapes the working directory via "../" traversal', async () => {
  const { tempDir, ctx } = setup();
  const outsideDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-human-turn-outside-'));
  fs.writeFileSync(path.join(outsideDir, 'secret.md'), 'Not part of this workspace.\n');
  const relativeEscape = path.relative(tempDir, path.join(outsideDir, 'secret.md'));

  await assert.rejects(
    runCoordinationUseCase(ctx, {
      requestObject: request({ steps: [produceStep(), humanTurnStep({ artifactRef: relativeEscape })] }),
    }),
    (err) => err instanceof StoreError && /outside the working directory/.test(err.message),
  );
});

test('a "human-turn" step\'s artifactRef is refused when it is an absolute path', async () => {
  const { ctx } = setup();
  const outsideDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-human-turn-outside-'));
  const absolutePath = path.join(outsideDir, 'secret.md');
  fs.writeFileSync(absolutePath, 'Not part of this workspace.\n');

  await assert.rejects(
    runCoordinationUseCase(ctx, {
      requestObject: request({ steps: [produceStep(), humanTurnStep({ artifactRef: absolutePath })] }),
    }),
    (err) => err instanceof StoreError && /outside the working directory/.test(err.message),
  );
});

// Fix round 2 (Reviewer + Red-Team, independently): the containment check
// above was lexical (`path.resolve`/`path.relative` on the UNRESOLVED
// path), but `fs.readFileSync` follows symlinks -- an IN-WORKSPACE symlink
// pointing OUTSIDE the workspace passed the lexical check and had its
// outside target's bytes hashed as the `revision`. Red-Team's own live
// repro: a symlink at "human/1-person.md" pointing at "/etc/hostname" was
// accepted with the hostname file's own hash. `run.mjs` now resolves both
// the candidate path AND the workspace root with `fs.realpathSync` before
// comparing.
test('a "human-turn" step\'s artifactRef is refused when it is an in-workspace symlink pointing outside the workspace', async () => {
  const { tempDir, ctx } = setup();
  const outsideDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-human-turn-outside-'));
  const outsideFile = path.join(outsideDir, 'secret.md');
  fs.writeFileSync(outsideFile, 'Not part of this workspace.\n');
  fs.mkdirSync(path.join(tempDir, 'human'), { recursive: true });
  const symlinkPath = path.join(tempDir, 'human', '1-person.md');
  fs.symlinkSync(outsideFile, symlinkPath);

  await assert.rejects(
    runCoordinationUseCase(ctx, {
      requestObject: request({ steps: [produceStep(), humanTurnStep()] }),
    }),
    (err) => err instanceof StoreError && /outside the working directory/.test(err.message),
  );
});

// The containment fix must not regress a genuine, non-symlinked, nested
// in-workspace path -- Red-Team already confirmed this live before the fix
// landed; this test pins it so a future change to the containment logic
// cannot silently break the legitimate case.
test('a "human-turn" step\'s artifactRef still works for a genuine nested in-workspace file (no symlink involved)', async () => {
  const { tempDir, ctx } = setup();
  fs.mkdirSync(path.join(tempDir, 'human', 'nested'), { recursive: true });
  const nestedPath = path.join(tempDir, 'human', 'nested', '1-person.md');
  fs.writeFileSync(nestedPath, 'A real, nested, in-workspace turn.\n');
  const expectedRevision = `sha256:${createHash('sha256').update(fs.readFileSync(nestedPath)).digest('hex')}`;

  const data = await runCoordinationUseCase(ctx, {
    requestObject: request({ steps: [produceStep(), humanTurnStep({ artifactRef: 'human/nested/1-person.md' })] }),
  });

  const result = data.steps.find((step) => step.as === 'person-turn-1');
  assert.equal(result.appended, true);
  assert.equal(result.revision, expectedRevision);
});

test('a "human-turn" step attributing the turn to the request\'s own writerId is refused (self-attribution reaches the real engine door, not just the schema boundary)', async () => {
  const { tempDir, ctx } = setup();
  fs.mkdirSync(path.join(tempDir, 'human'), { recursive: true });
  fs.writeFileSync(path.join(tempDir, 'human', '1-person.md'), 'Ship it.\n');
  await assert.rejects(
    runCoordinationUseCase(ctx, {
      requestObject: request({ steps: [produceStep(), humanTurnStep({ attributedTo: { type: 'person', id: WRITER_ID } })] }),
    }),
    (err) => err instanceof CoordinationError && /cannot attribute a human turn to itself/.test(err.message),
  );
});

test('a "human-turn" step attributing the turn to a declared panel actor is refused by the real engine door', async () => {
  const { tempDir, ctx } = setup();
  fs.mkdirSync(path.join(tempDir, 'human'), { recursive: true });
  fs.writeFileSync(path.join(tempDir, 'human', '1-person.md'), 'Ship it.\n');
  await assert.rejects(
    runCoordinationUseCase(ctx, {
      requestObject: request({ steps: [produceStep(), humanTurnStep({ attributedTo: { type: 'person', id: 'doer' } })] }),
    }),
    (err) => err instanceof CoordinationError && /declared panel actor/.test(err.message),
  );
});

test('a "human-turn" step\'s respondsToRefs (bare turn ids) are prefixed with the reserved namespace before reaching the engine', async () => {
  const { tempDir, ctx } = setup();
  fs.mkdirSync(path.join(tempDir, 'human'), { recursive: true });
  fs.writeFileSync(path.join(tempDir, 'human', '1-person.md'), 'First turn.\n');
  fs.writeFileSync(path.join(tempDir, 'human', '2-person.md'), 'Second turn.\n');
  const data = await runCoordinationUseCase(ctx, {
    requestObject: request({
      steps: [
        produceStep(),
        humanTurnStep(),
        humanTurnStep({
          as: 'person-turn-2',
          turnId: 'turn_2',
          turnOrdinal: 2,
          artifactRef: 'human/2-person.md',
          externalRef: 'claude-code-transcript:sess-1:uuid-2',
          respondsToRefs: ['turn_1'],
        }),
      ],
    }),
  });
  const second = data.steps.find((step) => step.as === 'person-turn-2');
  assert.deepEqual(second.respondsToRefs, ['human-turn:turn_1']);

  const recorded = eventsOfType(tempDir, data.coordinationId, 'human-turn-recorded').find((e) => e.payload.turnId === 'turn_2');
  assert.deepEqual(recorded.payload.respondsToRefs, ['human-turn:turn_1']);
});

test('a "human-turn" step\'s respondsToRefs entry naming a turn this session never recorded is refused by the real engine door', async () => {
  const { tempDir, ctx } = setup();
  fs.mkdirSync(path.join(tempDir, 'human'), { recursive: true });
  fs.writeFileSync(path.join(tempDir, 'human', '1-person.md'), 'First turn.\n');
  await assert.rejects(
    runCoordinationUseCase(ctx, {
      requestObject: request({ steps: [produceStep(), humanTurnStep({ respondsToRefs: ['turn_nope'] })] }),
    }),
    (err) => err instanceof CoordinationError && err.category === 'dangling-ref' && /never recorded/.test(err.message),
  );
});

test('show renders humanTurns as its own labelled section, never merged into dispositions', async () => {
  const { tempDir, ctx } = setup();
  fs.mkdirSync(path.join(tempDir, 'human'), { recursive: true });
  fs.writeFileSync(path.join(tempDir, 'human', '1-person.md'), 'Go ahead.\n');
  const data = await runCoordinationUseCase(ctx, {
    requestObject: request({ steps: [produceStep(), humanTurnStep(), dispositionStep({ targetRef: '$ref:produce', evidenceRefs: [] })] }),
  });
  const shown = showCoordinationUseCase({ cwd: tempDir, repoRoot: tempDir }, { id: data.coordinationId });
  assert.equal(shown.humanTurns.length, 1);
  assert.equal(shown.humanTurns[0].turnId, 'turn_1');
  assert.deepEqual(shown.humanTurns[0].attributedTo, { type: 'person', id: 'the-user' });
  assert.deepEqual(shown.ignoredHumanTurns, []);
  assert.equal(shown.dispositions.length, 1);
  assert.ok(!('turnId' in shown.dispositions[0]), 'a human turn must never be merged into the dispositions list');
});

// Fix round 1 (Reviewer R-P03.1-01, HIGH): show.mjs's own `isRefOwnedBySession`
// was not updated to mirror the two rules `recordHumanTurn`'s write door
// added (the `human-turn:` prefix branch, and the bare-turnId near-miss
// refusal) -- reproducible both directions before the fix: a bare `turn_1`
// ref (which the write door refuses) rendered `owned: true`, and a valid
// `human-turn:<id>` ref (which the write door accepts) rendered `owned:
// false`. This test hand-crafts BOTH shapes onto one disposition (bypassing
// `recordDriverDisposition` entirely via the raw `appendEvent` primitive,
// the same technique the "show marks a disposition ref as NOT session-owned"
// test above uses) so it fails under the pre-fix code in both directions.
test('show marks a bare turnId disposition ref as NOT owned, and a human-turn:<id> ref as owned (isRefOwnedBySession mirrors the write door for the human-turn: namespace)', async () => {
  const { tempDir, ctx } = setup();
  const opts = { cwd: tempDir, repoRoot: tempDir };
  fs.mkdirSync(path.join(tempDir, 'human'), { recursive: true });
  fs.writeFileSync(path.join(tempDir, 'human', '1-person.md'), 'Go ahead.\n');
  const data = await runCoordinationUseCase(ctx, {
    requestObject: request({ steps: [produceStep(), humanTurnStep()] }),
  });

  const { eventsPath, sessionDir } = resolveSessionPaths(data.coordinationId, opts);
  appendEvent(
    eventsPath,
    {
      type: 'driver-disposition-recorded',
      payload: {
        targetRef: 'turn_1',
        disposition: 'accepted',
        rationale: 'Hand-crafted: targets the BARE turn id, never the reserved ref.',
        evidenceRefs: ['human-turn:turn_1'],
        authorizedBy: { type: 'driver', id: WRITER_ID },
      },
    },
    sessionDir,
  );

  const shown = showCoordinationUseCase(opts, { id: data.coordinationId });
  const found = shown.dispositions.find((d) => d.targetRef === 'turn_1');
  assert.ok(found, 'the hand-crafted disposition must still be rendered');
  assert.equal(found.targetRefOwnedBySession, false, 'a bare turn id must never render as an owned ref -- it targets nothing (the write door refuses it as a near-miss)');
  assert.deepEqual(found.evidenceRefsOwnedBySession, [true], 'a real "human-turn:" ref to a recorded turn must render as owned, the same way the write door accepts it');
});
// Phase 03: Public-door DAG projection tests (H-1, H-3, M-1, H-4)
// ---------------------------------------------------------------------

function fakeExecutorWithFailingReviewer(tempDir) {
  const executorScript = path.join(tempDir, `fake-executor-fail-review-${Math.random().toString(36).slice(2)}.mjs`);
  fs.writeFileSync(
    executorScript,
    `
    import fs from 'node:fs';
    import path from 'node:path';
    const assignmentsRoot = path.join(process.cwd(), '.fgos', 'assignments');
    if (fs.existsSync(assignmentsRoot)) {
      for (const asgn of fs.readdirSync(assignmentsRoot)) {
        const asgnJsonPath = path.join(assignmentsRoot, asgn, 'assignment.json');
        let isReviewer = false;
        if (fs.existsSync(asgnJsonPath)) {
          try {
            const asgnData = JSON.parse(fs.readFileSync(asgnJsonPath, 'utf8'));
            const text = JSON.stringify(asgnData);
            if (text.includes('review-candidate') || text.includes('reviewer')) {
              isReviewer = true;
            }
          } catch {}
        }
        const runsDir = path.join(assignmentsRoot, asgn, 'runs');
        if (!fs.existsSync(runsDir)) continue;
        for (const run of fs.readdirSync(runsDir)) {
          const runDir = path.join(runsDir, run);
          if (fs.existsSync(runDir) && !fs.existsSync(path.join(runDir, 'agent-result.json'))) {
            const status = isReviewer ? 'failed' : 'done';
            fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Report\\nDone.\\n');
            fs.writeFileSync(
              path.join(runDir, 'agent-result.json'),
              JSON.stringify(
                isReviewer
                  ? { status: 'failed', summary: 'Review failed.', error: 'Defects found' }
                  : { status: 'done', summary: 'Validated.' },
              ),
            );
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
    models: { standard: 'test-model', nano: 'test-model', mini: 'test-model', advanced: 'test-model', flagship: 'test-model', frontier: 'test-model' },
    timeoutMs: 10000,
  };
}

test('Phase 03 H-1: public door dag:true failed RunResult projects as schedulerOutcome:settled and runResultStatus:failed, not pending/blocked', async () => {
  const tempDir = mkTempDir();
  writeFixture(tempDir);
  const ctx = { cwd: tempDir, repoRoot: tempDir, runnerConfig: fakeExecutorWithFailingReviewer(tempDir) };

  const raw = request({
    dag: true,
    coordinationId: 'p03-h1-failed-review',
    steps: [produceStep(), reviewStep()],
  });

  const result = await runCoordinationUseCase(ctx, { requestObject: raw });
  assert.equal(result.coordinationId, 'p03-h1-failed-review');

  const shown = showCoordinationUseCase({ cwd: tempDir, repoRoot: tempDir }, { id: result.coordinationId });
  assert.equal(shown.schemaMode, 'dag');
  assert.equal(shown.sessionStatus, 'active');
  assert.equal(shown.dag.counts.settled, 2);
  assert.equal(shown.dag.counts.settledFailed, 1);
  assert.equal(shown.dag.counts.blocked, 0);
  assert.equal(shown.dag.counts.pending, 0);

  const produceNode = shown.dag.nodes.find((n) => n.nodeId === 'node-produce');
  assert.ok(produceNode);
  assert.equal(produceNode.schedulerOutcome, 'settled');
  // produce-candidate is a mutating operation; the fake executor above never
  // touches the real working tree, so the classifier correctly has no
  // external evidence of a real mutation and reports 'no-evidence' rather
  // than 'done' -- this is the real, documented classification rule
  // (assignment-runner.mjs: a mutating claim needs changedFiles/dirty-before
  // evidence to become 'done'/'verified'), not a defect in this fixture's
  // simplified setup. The node still settles correctly either way.
  assert.equal(produceNode.runResultStatus, 'no-evidence');
  assert.equal(produceNode.pending, false);
  assert.equal(produceNode.blocked, false);
  assert.equal(produceNode.materialized, true);
  assert.equal(produceNode.settled, true);
  assert.ok(produceNode.assignmentIds.length > 0);

  const reviewNode = shown.dag.nodes.find((n) => n.nodeId === 'node-review');
  assert.ok(reviewNode);
  assert.equal(reviewNode.schedulerOutcome, 'settled');
  assert.equal(reviewNode.runResultStatus, 'failed');
  assert.equal(reviewNode.pending, false);
  assert.equal(reviewNode.blocked, false);
  assert.equal(reviewNode.materialized, true);
  assert.equal(reviewNode.settled, true);
  assert.ok(reviewNode.assignmentIds.length > 0);
  assert.match(reviewNode.actionHint, /Settled with failure/);
});

test('Phase 03 H-3/M-1: shared-cwd across peer read-only assignments is auto-caveated on BOTH peers and reflected in schedulerOutcome as recheck-required', async () => {
  const { tempDir, ctx } = setup();

  const raw = request({
    dag: true,
    coordinationId: 'p03-h3-m1-shared-cwd',
    steps: [
      produceStep(),
      reviewStep(),
      redTeamStep({ dependsOn: ['produce'] }),
    ],
  });

  const result = await runCoordinationUseCase(ctx, { requestObject: raw });
  assert.equal(result.coordinationId, 'p03-h3-m1-shared-cwd');

  const shown = showCoordinationUseCase({ cwd: tempDir, repoRoot: tempDir }, { id: result.coordinationId });
  assert.equal(shown.schemaMode, 'dag');
  assert.equal(shown.sessionStatus, 'active');

  const produceNode = shown.dag.nodes.find((n) => n.nodeId === 'node-produce');
  assert.ok(produceNode);
  assert.equal(produceNode.schedulerOutcome, 'settled');
  assert.equal(produceNode.caveated, false);

  const reviewNode = shown.dag.nodes.find((n) => n.nodeId === 'node-review');
  const redTeamNode = shown.dag.nodes.find((n) => n.nodeId === 'node-red-team');
  assert.ok(reviewNode);
  assert.ok(redTeamNode);

  // Both review and red-team run concurrently in the same cwd, so BOTH must be auto-caveated
  assert.equal(reviewNode.caveated, true);
  assert.equal(reviewNode.schedulerOutcome, 'recheck-required');
  assert.ok(reviewNode.sharedCwdCaveat);
  assert.equal(reviewNode.sharedCwdCaveat.recheckRequired, true);
  assert.equal(reviewNode.sharedCwdCaveat.status, 'recheck-required');
  assert.equal(reviewNode.sharedCwdCaveat.verdict, 'non-attributable');
  assert.ok(reviewNode.sharedCwdCaveat.peerNodeIds.includes('node-red-team'));

  assert.equal(redTeamNode.caveated, true);
  assert.equal(redTeamNode.schedulerOutcome, 'recheck-required');
  assert.ok(redTeamNode.sharedCwdCaveat);
  assert.equal(redTeamNode.sharedCwdCaveat.recheckRequired, true);
  assert.equal(redTeamNode.sharedCwdCaveat.status, 'recheck-required');
  assert.equal(redTeamNode.sharedCwdCaveat.verdict, 'non-attributable');
  assert.ok(redTeamNode.sharedCwdCaveat.peerNodeIds.includes('node-review'));

  assert.match(shown.actionHint, /caveated node\(s\) \[.*\] require recheck before closure/);
});

test('Phase 03: uninterrupted DAG declaration reconstruction produces pending root and blocked dependent facts before assignments materialize', async () => {
  const { tempDir, ctx } = setup();

  // Create an open session with a DAG declaration directly (interrupted before any step runs)
  const session = openDeclaredProtocolSession(
    {
      coordinationId: 'p03-interrupted-dag',
      objective: 'Reconstruct DAG before assignments materialize.',
      writerId: WRITER_ID,
      definitionId: DEFINITION_ID,
      schemaVersion: SCHEMA_VERSION_3,
      dagDeclaration: {
        schemaVersion: SCHEMA_VERSION_3,
        requestFingerprint: 'sha256:testfingerprint000000000000000000000000000000000000000000000000',
        nodes: [
          { id: 'node-produce', displayLabel: 'produce', semantics: { type: 'operation', as: 'produce' }, dependsOn: [] },
          { id: 'node-review', displayLabel: 'review', semantics: { type: 'operation', as: 'review' }, dependsOn: ['node-produce'] },
        ],
      },
    },
    { cwd: tempDir, repoRoot: tempDir },
  );

  const shown = showCoordinationUseCase({ cwd: tempDir, repoRoot: tempDir }, { id: session.coordinationId });
  assert.equal(shown.schemaMode, 'dag');
  assert.equal(shown.sessionStatus, 'active');

  const produce = shown.dag.nodes.find((n) => n.nodeId === 'node-produce');
  assert.ok(produce);
  assert.equal(produce.materialized, false);
  assert.equal(produce.settled, false);
  assert.equal(produce.pending, true);
  assert.equal(produce.blocked, false);
  assert.equal(produce.schedulerOutcome, 'pending');

  const review = shown.dag.nodes.find((n) => n.nodeId === 'node-review');
  assert.ok(review);
  assert.equal(review.materialized, false);
  assert.equal(review.settled, false);
  assert.equal(review.pending, false);
  assert.equal(review.blocked, true);
  assert.deepEqual(review.blockedBy, ['node-produce']);
  assert.equal(review.schedulerOutcome, 'blocked');
});

// ─── Phase 04 (read-only admission and outcome taxonomy) ───────────────────
// H-1: the concurrency-cap admission refusal is the ONLY deferrable outcome
// (dag-request-scheduler.md §4) and must carry a stable `code:
// 'concurrency-cap'` distinct from every other budget refusal below.
// H-2: maxAssignments/maxRounds/wallTimeMs/maxTaskDepth refusals must stay
// ordinary, non-deferrable, distinctly-identifiable validation errors and
// must NEVER carry `code: 'concurrency-cap'`.
// H-3: a missing session (`show`) and an unresolvable protocol (`run`) are
// integrity failures that must throw with their ORIGINAL 'not-found'
// category preserved, never collapsed into a plain `StoreError('validation',
// ...)` indistinguishable from an ordinary refusal.
// H-4: 3+ concurrent read-only DAG peers sharing one cwd must ALL receive
// the sharedCwdCaveat (Phase 03 only proved the 2-peer case); a mutating or
// fan-out step buried (not first) in a `dag: true` request must still be
// rejected before any session/event is written.
// M-1: `compileDagRequest` alone (bypassing the schema door) must reject a
// mutating human-turn step -- defense in depth, matching Phase 02's L-1/H-2
// fix pattern.

test('Phase 04 H-1: concurrency-cap admission refusal carries code "concurrency-cap", distinguishing the ONE deferrable outcome from every other budget refusal', async () => {
  const { ctx } = setup();
  const coordinationId = 'p04-h1-concurrency-cap-code';
  // Open the session and settle 'produce' first so it is not itself
  // "in flight" by the time the two peer dispatches below race.
  await runCoordinationUseCase(ctx, {
    requestObject: request({ coordinationId, aggregateBounds: { maxConcurrency: 1 }, steps: [produceStep()] }),
  });

  const outcomes = await Promise.allSettled([
    runCoordinationUseCase(ctx, {
      requestObject: request({
        coordinationId,
        aggregateBounds: { maxConcurrency: 1 },
        steps: [produceStep(), { ...reviewStep(), as: 'peer-a', taskKey: 'p04-h1-racer-a' }],
      }),
    }),
    runCoordinationUseCase(ctx, {
      requestObject: request({
        coordinationId,
        aggregateBounds: { maxConcurrency: 1 },
        steps: [produceStep(), { ...reviewStep(), as: 'peer-b', taskKey: 'p04-h1-racer-b' }],
      }),
    }),
  ]);

  const fulfilled = outcomes.filter((o) => o.status === 'fulfilled');
  const rejected = outcomes.filter((o) => o.status === 'rejected');
  assert.equal(fulfilled.length, 1, `exactly one of two concurrent new dispatches should succeed under maxConcurrency: 1 -- got ${JSON.stringify(outcomes.map((o) => o.status))}`);
  assert.equal(rejected.length, 1);
  const err = rejected[0].reason;
  assert.ok(err instanceof CoordinationError, 'the concurrency-cap refusal is a CoordinationError');
  assert.equal(err.category, 'validation');
  assert.equal(err.code, 'concurrency-cap', 'the ONLY deferrable refusal must carry this exact machine code');
});

test('Phase 04 H-2: aggregateBounds.maxAssignments refusal via the real request door is refused-shaped and never carries code "concurrency-cap"', async () => {
  const { ctx } = setup();
  const raw = request({ coordinationId: 'p04-h2-maxassignments', aggregateBounds: { maxAssignments: 1 }, steps: [produceStep(), reviewStep()] });
  await assert.rejects(
    runCoordinationUseCase(ctx, { requestObject: raw }),
    (err) => err instanceof CoordinationError && err.category === 'validation' && err.code !== 'concurrency-cap' && /aggregateBounds\.maxAssignments cap of 1/.test(err.message),
  );
});

test('Phase 04 H-2: aggregateBounds.maxRounds refusal via the real request door is refused-shaped and never carries code "concurrency-cap"', async () => {
  const { ctx } = setup();
  const raw = request({ coordinationId: 'p04-h2-maxrounds', aggregateBounds: { maxRounds: 1, maxAssignments: 10 }, steps: [produceStep(), reviewStep()] });
  await assert.rejects(
    runCoordinationUseCase(ctx, { requestObject: raw }),
    (err) => err instanceof CoordinationError && err.category === 'validation' && err.code !== 'concurrency-cap' && /already used \d+ round\(s\) session-wide/.test(err.message),
  );
});

test('Phase 04 H-2: aggregateBounds.wallTimeMs refusal via the real request door (on resume) is refused-shaped and never carries code "concurrency-cap"', async () => {
  const { ctx } = setup();
  const coordinationId = 'p04-h2-walltime';
  await runCoordinationUseCase(ctx, { requestObject: request({ coordinationId, aggregateBounds: { wallTimeMs: 600 }, steps: [produceStep()] }) });
  await new Promise((resolve) => setTimeout(resolve, 700));
  await assert.rejects(
    runCoordinationUseCase(ctx, { requestObject: request({ coordinationId, aggregateBounds: { wallTimeMs: 600 }, steps: [produceStep(), reviewStep()] }) }),
    (err) => err instanceof CoordinationError && err.category === 'validation' && err.code !== 'concurrency-cap' && /wall-time budget/.test(err.message),
  );
});

test('Phase 04 H-3: coordination show on a missing session throws with the ORIGINAL "not-found" category preserved, never collapsed into an ordinary validation refusal', () => {
  const { tempDir } = setup();
  assert.throws(
    () => showCoordinationUseCase({ cwd: tempDir, repoRoot: tempDir }, { id: 'p04-h3-session-never-existed' }),
    (err) => err instanceof CoordinationError && !(err instanceof StoreError) && err.category === 'not-found' && /no session "p04-h3-session-never-existed" found/.test(err.message),
  );
});

test('Phase 04 H-3: coordination run against an unresolvable protocolRef throws with the ORIGINAL "not-found" category preserved, never collapsed into an ordinary validation refusal', async () => {
  const { ctx } = setup();
  const raw = request({
    coordinationId: 'p04-h3-missing-protocol',
    protocolRef: { id: 'test.coordination-protocol.p04-h3-this-protocol-does-not-exist' },
    steps: [produceStep()],
  });
  await assert.rejects(
    runCoordinationUseCase(ctx, { requestObject: raw }),
    (err) => err instanceof FlowDefinitionError && !(err instanceof StoreError) && err.category === 'not-found' && /no CoordinationProtocol definition found|could not be resolved/.test(err.message),
  );
});

const THREE_PEER_DEFINITION_ID = 'test.coordination-protocol.p04-h4-three-peer-shared-cwd';

function writeThreePeerFixture(tempDir) {
  const dir = path.join(tempDir, '.fgos', 'coordination-protocols');
  fs.mkdirSync(dir, { recursive: true });
  const advisory = { kind: 'advisory', evidenceRequired: 'reported' };
  const workProduct = { kind: 'work-product', evidenceRequired: 'reported' };
  const definition = {
    apiVersion: 'fgos.dev/v1alpha1',
    kind: 'FlowDefinition',
    metadata: { id: THREE_PEER_DEFINITION_ID, version: '1.0.0' },
    spec: {
      profile: { kind: 'CoordinationProtocol' },
      roles: ['doer', 'peer-a', 'peer-b', 'peer-c'],
      actors: [
        { id: 'doer', role: 'doer' },
        { id: 'peer-a', role: 'peer-a' },
        { id: 'peer-b', role: 'peer-b' },
        { id: 'peer-c', role: 'peer-c' },
      ],
      operations: [
        { id: 'produce-candidate', role: 'doer', result: workProduct },
        { id: 'peer-a-review', role: 'peer-a', result: advisory },
        { id: 'peer-b-review', role: 'peer-b', result: advisory },
        { id: 'peer-c-review', role: 'peer-c', result: advisory },
      ],
      graph: {
        entry: 'phase-produce',
        nodes: [
          { id: 'phase-produce', operations: [{ ref: 'produce-candidate', actor: 'doer' }], transitions: ['phase-peers'] },
          {
            id: 'phase-peers',
            operations: [
              { ref: 'peer-a-review', actor: 'peer-a' },
              { ref: 'peer-b-review', actor: 'peer-b' },
              { ref: 'peer-c-review', actor: 'peer-c' },
            ],
            transitions: [],
          },
        ],
      },
    },
  };
  fs.writeFileSync(path.join(dir, 'p04-h4-three-peer.json'), `${JSON.stringify(definition, null, 2)}\n`);
}

function setupThreePeer() {
  const tempDir = mkTempDir();
  writeThreePeerFixture(tempDir);
  return { tempDir, ctx: { cwd: tempDir, repoRoot: tempDir, runnerConfig: fakeExecutor(tempDir) } };
}

function threePeerRequest(overrides = {}) {
  return {
    kind: 'declared-protocol',
    objective: 'Prove 3+ concurrent read-only DAG peers sharing a cwd all get caveated.',
    writerId: WRITER_ID,
    protocolRef: { id: THREE_PEER_DEFINITION_ID },
    dag: true,
    steps: [
      { type: 'operation', as: 'produce', operationId: 'produce-candidate', targetActorId: 'doer', objective: 'Produce.', expectedOutputs: ['agent-result.json (status, summary)'] },
      { type: 'operation', as: 'peer-a', operationId: 'peer-a-review', targetActorId: 'peer-a', objective: 'Peer A reviews.', expectedOutputs: ['agent-result.json (status, summary)'], contextRefs: ['$ref:produce'] },
      { type: 'operation', as: 'peer-b', operationId: 'peer-b-review', targetActorId: 'peer-b', objective: 'Peer B reviews.', expectedOutputs: ['agent-result.json (status, summary)'], contextRefs: ['$ref:produce'] },
      { type: 'operation', as: 'peer-c', operationId: 'peer-c-review', targetActorId: 'peer-c', objective: 'Peer C reviews.', expectedOutputs: ['agent-result.json (status, summary)'], contextRefs: ['$ref:produce'] },
    ],
    ...overrides,
  };
}

test('Phase 04 H-4: 3+ concurrent read-only DAG peers sharing one cwd ALL receive the sharedCwdCaveat (Phase 03 only proved the 2-peer case)', async () => {
  const { tempDir, ctx } = setupThreePeer();
  const raw = threePeerRequest({ coordinationId: 'p04-h4-three-peer-caveat' });

  const result = await runCoordinationUseCase(ctx, { requestObject: raw });
  assert.equal(result.coordinationId, 'p04-h4-three-peer-caveat');

  const shown = showCoordinationUseCase({ cwd: tempDir, repoRoot: tempDir }, { id: result.coordinationId });
  assert.equal(shown.schemaMode, 'dag');

  const peerLabels = ['peer-a', 'peer-b', 'peer-c'];
  const peerNodes = peerLabels.map((label) => shown.dag.nodes.find((n) => n.nodeId === `node-${label}`));
  for (const node of peerNodes) assert.ok(node, 'every peer node must be present in the projection');

  for (const node of peerNodes) {
    assert.equal(node.caveated, true, `${node.nodeId} must be caveated -- it shares a cwd with 2 other concurrent read-only peers`);
    assert.equal(node.schedulerOutcome, 'recheck-required');
    assert.ok(node.sharedCwdCaveat);
    assert.equal(node.sharedCwdCaveat.status, 'recheck-required');
    assert.equal(node.sharedCwdCaveat.verdict, 'non-attributable');
    const otherPeerIds = peerNodes.filter((other) => other !== node).map((other) => other.nodeId);
    for (const otherId of otherPeerIds) {
      assert.ok(node.sharedCwdCaveat.peerNodeIds.includes(otherId), `${node.nodeId}'s caveat must name peer ${otherId}`);
    }
    assert.equal(node.sharedCwdCaveat.peerNodeIds.length, 2, `${node.nodeId} must be caveated against BOTH other peers, not just one`);
  }

  const produceNode = shown.dag.nodes.find((n) => n.nodeId === 'node-produce');
  assert.ok(produceNode);
  assert.equal(produceNode.caveated, false, 'produce has no concurrent read-only peer sharing its cwd at its own dependency level');

  // Phase 04 H-1: counts.deferred is a real computed count now, not a
  // hardcoded stub -- still 0 here since no live scheduler exists yet.
  assert.equal(shown.dag.counts.deferred, 0);
});

test('Phase 04 H-4: a mutating operation buried (not first) in a dag:true request is rejected before ANY session/event is written', async () => {
  const { ctx } = setup();
  const coordinationId = 'p04-h4-buried-mutation';
  const raw = request({
    dag: true,
    coordinationId,
    steps: [produceStep(), reviewStep(), { ...redTeamStep({ dependsOn: ['produce'] }), mutation: 'mutating' }],
  });
  await assert.rejects(
    runCoordinationUseCase(ctx, { requestObject: raw }),
    (err) => err instanceof StoreError && /read-only/.test(err.message),
  );
  assert.throws(
    () => readManifest(coordinationId, { cwd: ctx.cwd }),
    (err) => err instanceof CoordinationError && err.category === 'not-found',
    'a buried mutating step must be refused before openDeclaredProtocolSession ever runs -- zero session materialized',
  );
});

test('Phase 04 H-4: a fan-out step buried (not first) in a dag:true request is rejected before ANY session/event is written', async () => {
  const { ctx } = setup();
  const coordinationId = 'p04-h4-buried-fanout';
  const raw = request({
    dag: true,
    coordinationId,
    steps: [
      produceStep(),
      reviewStep(),
      { type: 'fan-out', as: 'research', operationId: 'produce-candidate', branches: [{ actorId: 'doer', objective: 'branch a', expectedOutputs: ['y'] }] },
    ],
  });
  await assert.rejects(
    runCoordinationUseCase(ctx, { requestObject: raw }),
    (err) => err instanceof StoreError && /fan-out/i.test(err.message),
  );
  assert.throws(
    () => readManifest(coordinationId, { cwd: ctx.cwd }),
    (err) => err instanceof CoordinationError && err.category === 'not-found',
    'a buried fan-out step must be refused before openDeclaredProtocolSession ever runs -- zero session materialized',
  );
});

test('Phase 04 M-1: compileDagRequest ALONE (bypassing the schema door) rejects a mutating human-turn step -- defense in depth', () => {
  const raw = {
    kind: 'declared-protocol',
    dag: true,
    objective: 'x',
    writerId: WRITER_ID,
    protocolRef: { id: DEFINITION_ID },
    steps: [
      produceStep(),
      {
        type: 'human-turn',
        as: 'decision',
        turnId: 'turn-1',
        turnOrdinal: 1,
        channel: 'chat',
        artifactRef: 'human/1-person.md',
        externalRef: 'ext-1',
        attributedTo: { type: 'person', id: 'reviewer-1' },
        mutation: 'mutating',
        dependsOn: ['produce'],
      },
    ],
  };
  assert.throws(
    () => compileDagRequest(raw, { durableLedgerIds: [] }),
    (err) => err instanceof StoreError && /read-only/.test(err.message),
  );
});

// ─── Phase 05: cold-resumable dynamic DAG scheduler ──────────────────────

test('Phase 05: peer frontier overlaps at the real dispatch door and reports its overlap group', async () => {
  const tempDir = mkTempDir();
  writeFixture(tempDir);
  // The executor delays only the Assignment whose own prompt carries this
  // objective.  It never scans unrelated pending Assignment directories.
  const ctx = { cwd: tempDir, repoRoot: tempDir, runnerConfig: fakeExecutor(tempDir, { delayObjective: 'DELAYED PEER', delayMs: 350 }) };
  // Calibrate against one identical public-door peer in this very process.
  // This makes the overlap proof relative to real executor startup cost,
  // which may dwarf a short artificial delay on a loaded worker.
  const singleStarted = Date.now();
  await runCoordinationUseCase(ctx, {
    requestObject: request({
      dag: true,
      coordinationId: 'p05-overlap-single-peer-baseline',
      steps: [produceStep(), { ...reviewStep(), objective: 'DELAYED PEER baseline.' }],
    }),
  });
  const singlePeerElapsed = Date.now() - singleStarted;
  const started = Date.now();
  const result = await runCoordinationUseCase(ctx, {
    requestObject: request({
      dag: true,
      coordinationId: 'p05-overlap',
      steps: [produceStep(), { ...reviewStep(), objective: 'DELAYED PEER review.' }, { ...redTeamStep({ dependsOn: ['produce'] }), objective: 'DELAYED PEER red team.' }],
    }),
  });
  const elapsed = Date.now() - started;
  // Process creation is environment-dependent.  The scheduler proof is
  // relative: this two-peer invocation must finish well below two measured
  // one-peer invocations (the serialized equivalent), with a generous 1.8x
  // one-peer ceiling that retains a substantial overlap margin.
  assert.ok(elapsed < singlePeerElapsed * 1.8, `two peers must overlap rather than serialize (two-peer ${elapsed}ms; one-peer baseline ${singlePeerElapsed}ms)`);
  const peers = result.steps.filter((step) => ['review', 'red-team'].includes(step.as));
  assert.equal(peers.length, 2);
  assert.equal(peers[0].overlapGroup.id, peers[1].overlapGroup.id);
  assert.deepEqual(peers[0].overlapGroup.nodeLabels.sort(), ['red-team', 'review']);
});

test('Phase 05: diamond fan-in admits join only after both near-simultaneous predecessor results are linked', async () => {
  const tempDir = mkTempDir();
  writeFixture(tempDir);
  const ctx = { cwd: tempDir, repoRoot: tempDir, runnerConfig: fakeExecutorWithObjectiveDelays(tempDir, { 'DIAMOND REVIEW': 150, 'DIAMOND RED': 153 }) };
  const coordinationId = 'p05-diamond-fanin';
  const result = await runCoordinationUseCase(ctx, {
    requestObject: request({
      dag: true,
      coordinationId,
      steps: [
        produceStep(),
        { ...reviewStep(), objective: 'DIAMOND REVIEW' },
        { ...redTeamStep({ dependsOn: ['produce'] }), objective: 'DIAMOND RED' },
        { ...reviewStep(), as: 'join', taskKey: 'p05-diamond-join', dependsOn: ['review', 'red-team'] },
      ],
    }),
  });
  assert.equal(result.steps.find((step) => step.as === 'join').schedulerOutcome, 'settled');
  const events = readSessionEvents(coordinationId, { cwd: tempDir, repoRoot: tempDir });
  const joinCreatedAt = events.findIndex((event) => event.type === 'assignment-created' && event.payload.dagNodeId === 'node-join');
  assert.ok(joinCreatedAt >= 0, 'the join is eventually materialized');
  for (const label of ['node-review', 'node-red-team']) {
    const created = events.find((event) => event.type === 'assignment-created' && event.payload.dagNodeId === label);
    const linkedAt = events.findIndex((event) => event.type === 'result-linked' && event.payload.assignmentId === created.payload.assignmentId);
    assert.ok(linkedAt >= 0 && linkedAt < joinCreatedAt, `${label} must have result-linked evidence before join admission`);
  }
});

test('Phase 05: external in-flight work defers a maxConcurrency:1 DAG immediately, reports it, and suppresses close', async () => {
  const { tempDir, ctx } = setup();
  const coordinationId = 'p05-outside-inflight';
  const raw = request({ dag: true, coordinationId, aggregateBounds: { maxConcurrency: 1 }, steps: [produceStep(), reviewStep()] });
  const normalized = validateCoordinationRequest(raw);
  const declaration = compileDagRequest(normalized, { durableLedgerIds: [] });
  openDeclaredProtocolSession(
    { coordinationId, objective: normalized.objective, writerId: WRITER_ID, definitionId: DEFINITION_ID, schemaVersion: SCHEMA_VERSION_3, aggregateBounds: normalized.aggregateBounds, dagDeclaration: declaration },
    { cwd: tempDir, repoRoot: tempDir },
  );
  const outside = createSessionAssignment(
    {
      coordinationId,
      taskKey: 'outside-invocation',
      actorId: 'doer',
      contract: { objective: 'Externally in-flight work.', contextRefs: [], constraints: [], expectedOutputs: ['agent-result.json'], mutation: 'read-only', evidence: { required: 'reported' }, role: 'doer', budget: { timeoutMs: 1000, maxRuns: 1 } },
      caller: { writerId: WRITER_ID },
    },
    { cwd: tempDir, repoRoot: tempDir },
  );
  const started = Date.now();
  const result = await runCoordinationUseCase(ctx, { requestObject: raw });
  assert.ok(Date.now() - started < 1800, 'an invocation blocked only by external in-flight work must return without polling or sleeping');
  assert.equal(result.closed, false);
  assert.equal(result.closeAttempted, false);
  assert.equal(result.steps.find((step) => step.as === 'produce').schedulerOutcome, 'deferred');
  assert.equal(result.steps.find((step) => step.as === 'review').schedulerOutcome, 'deferred', 'with no invocation-owned settlement possible, the dependent is deferred rather than falsely blocked by an external Assignment');
  assert.deepEqual(result.dag.inFlightOutsideInvocation, [outside.assignmentId]);
});

test('Phase 05: manifest loss after sibling settlement throws without erasing settled sibling evidence', async () => {
  const tempDir = mkTempDir();
  writeFixture(tempDir);
  const ctx = { cwd: tempDir, repoRoot: tempDir, runnerConfig: fakeExecutorWithObjectiveDelays(tempDir, { 'FAST SIBLING': 40, 'SLOW SIBLING': 240 }) };
  const coordinationId = 'p05-integrity-after-sibling';
  const raw = request({ dag: true, coordinationId, steps: [produceStep(), { ...reviewStep(), objective: 'FAST SIBLING' }, { ...redTeamStep({ dependsOn: ['produce'] }), objective: 'SLOW SIBLING' }] });
  const running = runCoordinationUseCase(ctx, { requestObject: raw });
  for (let attempt = 0; attempt < 800; attempt += 1) {
    if (readSessionEvents(coordinationId, { cwd: tempDir, repoRoot: tempDir }).filter((event) => event.type === 'result-linked').length >= 2) break;
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
  const before = readSessionEvents(coordinationId, { cwd: tempDir, repoRoot: tempDir });
  assert.ok(before.filter((event) => event.type === 'result-linked').length >= 2, 'produce and one sibling must already be durably settled');
  fs.unlinkSync(resolveSessionPaths(coordinationId, { cwd: tempDir, repoRoot: tempDir }).manifestPath);
  await assert.rejects(running, (err) => err instanceof CoordinationError && err.category === 'not-found');
  const after = readSessionEvents(coordinationId, { cwd: tempDir, repoRoot: tempDir });
  assert.deepEqual(after.slice(0, before.length), before, 'the integrity failure cannot erase evidence that settled before it');
});

test('Phase 05: actor replacement racing a ready dependent neither double-dispatches it nor loses its scheduler disposition', async () => {
  const { tempDir, ctx } = setup();
  const coordinationId = 'p05-replacement-ready-race';
  const raw = request({ dag: true, coordinationId, steps: [produceStep(), reviewStep()] });
  const normalized = validateCoordinationRequest(raw);
  const declaration = compileDagRequest(normalized, { durableLedgerIds: [] });
  openDeclaredProtocolSession(
    { coordinationId, objective: normalized.objective, writerId: WRITER_ID, definitionId: DEFINITION_ID, schemaVersion: SCHEMA_VERSION_3, dagDeclaration: declaration },
    { cwd: tempDir, repoRoot: tempDir },
  );
  await dispatchDeclaredOperation(
    coordinationId,
    { operationId: 'produce-candidate', targetActorId: 'doer', objective: produceStep().objective, expectedOutputs: produceStep().expectedOutputs, writerId: WRITER_ID, dagNodeId: 'node-produce' },
    ctx,
  );
  // runCoordinationUseCase yields at real dispatch boundaries.  Start it,
  // then replace the still-unassigned reviewer slot before its ready-node
  // dispatch can complete; this exercises the durable actor ledger rather
  // than a scheduler mock or a synthetic state transition.
  const running = runCoordinationUseCase(ctx, { requestObject: raw });
  replaceSessionActor(coordinationId, { oldActorId: 'reviewer', newActorId: 'reviewer-replacement', reason: 'replace while ready review is being considered' }, { cwd: tempDir, repoRoot: tempDir });
  const result = await running;
  const review = result.steps.find((step) => step.as === 'review');
  assert.ok(['settled', 'refused', 'deferred'].includes(review.schedulerOutcome), 'the raced node has one explicit disposition, never a lost pending state');
  const reviewCreates = readSessionEvents(coordinationId, { cwd: tempDir, repoRoot: tempDir }).filter((event) => event.type === 'assignment-created' && event.payload.dagNodeId === 'node-review');
  assert.ok(reviewCreates.length <= 1, 'replacement racing admission must never create duplicate dependent Assignments');
});

test('Phase 05: cancellation blocks an unadmitted join but preserves already in-flight peer evidence', async () => {
  const tempDir = mkTempDir();
  writeFixture(tempDir);
  const ctx = { cwd: tempDir, repoRoot: tempDir, runnerConfig: fakeExecutor(tempDir, { delayObjective: 'CANCEL PEER', delayMs: 300 }) };
  const coordinationId = 'p05-cancel-admission';
  const raw = request({
    dag: true,
    coordinationId,
    steps: [
      produceStep(),
      { ...reviewStep(), objective: 'CANCEL PEER review.' },
      { ...redTeamStep({ dependsOn: ['produce'] }), objective: 'CANCEL PEER red team.' },
      { ...reviewStep(), as: 'join', taskKey: 'p05-cancel-join', dependsOn: ['review', 'red-team'] },
    ],
  });
  const running = runCoordinationUseCase(ctx, { requestObject: raw });
  for (let attempt = 0; attempt < 80; attempt += 1) {
    if (readSessionEvents(coordinationId, { cwd: tempDir, repoRoot: tempDir }).filter((event) => event.type === 'assignment-created').length >= 3) break;
    // Wait only for the real peer assignments to be materialized; no polling
    // participates in scheduler admission.
    await new Promise((resolve) => setTimeout(resolve, 5));
  }
  cancelSession(coordinationId, { reason: 'operator cancelled during peer frontier' }, { cwd: tempDir, repoRoot: tempDir });
  const result = await running;
  const events = readSessionEvents(coordinationId, { cwd: tempDir, repoRoot: tempDir });
  assert.equal(events.filter((event) => event.type === 'assignment-created' && event.payload.dagNodeId === 'node-join').length, 0);
  assert.equal(events.filter((event) => event.type === 'driver-disposition-recorded' && event.payload.targetRef.includes('join')).length, 0);
  assert.equal(events.filter((event) => event.type === 'result-linked').length, 3);
  const join = result.steps.find((step) => step.as === 'join');
  assert.equal(join.schedulerOutcome, 'blocked');
  assert.ok(join.blockedBy.includes('terminal-session'));
  assert.equal(showCoordinationUseCase({ cwd: tempDir, repoRoot: tempDir }, { id: coordinationId }).sessionStatus, 'cancelled');
});

test('Phase 05: an independent peer survives a branch-local refusal, and the refusal names its invoked dispatch door', async () => {
  const { tempDir, ctx } = setup();
  const result = await runCoordinationUseCase(ctx, {
    requestObject: request({
      dag: true,
      coordinationId: 'p05-branch-refusal',
      aggregateBounds: { maxAssignments: 2 },
      steps: [produceStep(), reviewStep(), redTeamStep({ dependsOn: ['produce'] })],
    }),
  });
  const peers = result.steps.filter((step) => ['review', 'red-team'].includes(step.as));
  assert.equal(peers.filter((step) => step.schedulerOutcome === 'settled').length, 1);
  const refused = peers.find((step) => step.schedulerOutcome === 'refused');
  assert.ok(refused);
  assert.equal(refused.door, 'dispatchDeclaredOperation');
  assert.equal(result.closed, false);
  assert.equal(result.closeAttempted, false);
  assert.equal(refused.schedulerOutcome, 'refused', 'the live invocation response is authoritative while the active session has no persisted Assignment for a refused node');
});

test('Phase 05: an identical DAG resume uses result-linked evidence without creating a fresh Assignment', async () => {
  const { tempDir, ctx } = setup();
  const raw = request({ dag: true, coordinationId: 'p05-resume', steps: [produceStep(), reviewStep(), redTeamStep({ dependsOn: ['produce'] })] });
  const first = await runCoordinationUseCase(ctx, { requestObject: raw });
  const createdBefore = readSessionEvents(first.coordinationId, { cwd: tempDir, repoRoot: tempDir }).filter((event) => event.type === 'assignment-created').length;
  const second = await runCoordinationUseCase(ctx, { requestObject: raw });
  assert.ok(second.steps.every((step) => step.resumed === true));
  assert.ok(second.steps.every((step) => step.door === 'result-linked'));
  const createdAfter = readSessionEvents(first.coordinationId, { cwd: tempDir, repoRoot: tempDir }).filter((event) => event.type === 'assignment-created').length;
  assert.equal(createdAfter, createdBefore);
});
