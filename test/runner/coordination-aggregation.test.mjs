// Phase 07 (MVP7) cell P07.3: FlowDefinition + CoordinationSession
// integration for evidence-preserving aggregation.
//
// Three layers are proved here, in this order:
//   1. schema  -- `completion.aggregation` on a CoordinationProtocol, and
//                 `completion.mode`'s existing behavior proved UNCHANGED;
//   2. ledger  -- the `aggregation-validated` event, its store door, and what
//                 replay refuses to trust;
//   3. runtime -- a REAL `classifyAggregationOutcome` call over a REAL
//                 dispatched session, and the terminal-transition authority
//                 boundary around it.
//
// The runtime layer drives real Node subprocesses through the real
// `dispatchDeclaredOperation` path -- the same fake-executor pattern
// `coordination-visibility-window-fixture.test.mjs` and
// `coordination-research-fan-out.test.mjs` use, never a JS-level stub over
// `executeAssignment`. The protocol under test is written into a temp
// PROJECT tier (`<tempDir>/.fgos/coordination-protocols/`), so no committed
// fixture under `core/` is touched or altered.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  openDeclaredProtocolSession,
  dispatchDeclaredOperation,
  validateSessionAggregation,
  closeSessionByQuorum,
} from '../../src/runner/coordination/session-engine.mjs';
import {
  openSession,
  createSessionAssignment,
  linkResult,
  appendEvent,
  transitionSessionStatus,
  recordAggregationValidation,
  resolveSessionPaths,
} from '../../src/runner/coordination/store.mjs';
import { replaySession } from '../../src/runner/coordination/replay.mjs';
import { CoordinationError, validateEventPayload } from '../../src/runner/coordination/schema.mjs';
import { validateFlowDefinition, FlowDefinitionError } from '../../src/runner/definitions/schema.mjs';

const PROTOCOL_ID = 'project.coordination-protocol.aggregation-under-test';
const AGGREGATION_METHOD = 'evidence-preserving-synthesis';

function mkTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-aggregation-test-'));
}

// ─── Layer 1: FlowDefinition schema ────────────────────────────────────────

/**
 * A minimal, valid `CoordinationProtocol` document. `completion` is supplied
 * by each caller so the mode-regression tests can build one with NO
 * aggregation at all and compare it against the pre-aggregation shape.
 */
function protocolDoc(completion, overrides = {}) {
  return {
    apiVersion: 'fgos.dev/v1alpha1',
    kind: 'FlowDefinition',
    metadata: { id: PROTOCOL_ID, version: '1.0.0' },
    spec: {
      profile: { kind: 'CoordinationProtocol', ...(completion !== undefined ? { completion } : {}) },
      roles: ['coordinator', 'researcher'],
      actors: [
        { id: 'coordinator-actor', role: 'coordinator' },
        { id: 'researcher-a', role: 'researcher' },
        { id: 'researcher-b', role: 'researcher' },
      ],
      operations: [
        { id: 'research', role: 'researcher', result: { kind: 'advisory', evidenceRequired: 'reported' } },
        // A second, single-binding source operation. It exists so a test can
        // declare TWO source operations and leave exactly one of them
        // unsatisfied -- the only shape in which an aggregation still has
        // evidence to validate while also naming a missing contributor.
        { id: 'review', role: 'coordinator', result: { kind: 'advisory', evidenceRequired: 'reported' } },
        { id: 'synthesize', role: 'coordinator', result: { kind: 'advisory', evidenceRequired: 'reported' } },
      ],
      graph: {
        entry: 'phase-research',
        nodes: [
          {
            id: 'phase-research',
            operations: [
              { ref: 'research', actor: 'researcher-a' },
              { ref: 'research', actor: 'researcher-b' },
            ],
            transitions: ['phase-fan-in'],
          },
          {
            id: 'phase-fan-in',
            operations: [
              { ref: 'review', actor: 'coordinator-actor' },
              { ref: 'synthesize', actor: 'coordinator-actor' },
            ],
            transitions: [],
          },
        ],
      },
      ...overrides,
    },
  };
}

function aggregationDecl(overrides = {}) {
  return {
    method: AGGREGATION_METHOD,
    outputOperationRef: 'synthesize',
    sourceOperationRefs: ['research'],
    requiredDisclosures: ['confidence', 'dissent'],
    ...overrides,
  };
}

test('schema: completion.aggregation validates on a CoordinationProtocol and is carried through normalized', () => {
  const validated = validateFlowDefinition(protocolDoc({ mode: 'synthesize', aggregation: aggregationDecl() }));
  assert.deepEqual(validated.spec.profile.completion, {
    mode: 'synthesize',
    aggregation: {
      method: AGGREGATION_METHOD,
      outputOperationRef: 'synthesize',
      sourceOperationRefs: ['research'],
      requiredDisclosures: ['confidence', 'dissent'],
    },
  });
  assert.ok(Object.isFrozen(validated.spec.profile.completion.aggregation));
  assert.ok(Object.isFrozen(validated.spec.profile.completion.aggregation.sourceOperationRefs));
});

test('schema: an unknown aggregation method is rejected (one honest method only in MVP7)', () => {
  assert.throws(
    () => validateFlowDefinition(protocolDoc({ mode: 'synthesize', aggregation: aggregationDecl({ method: 'weighted-vote' }) })),
    (err) => err instanceof FlowDefinitionError && /aggregation\.method must be one of/.test(err.message),
  );
});

test('schema: an aggregation naming its own output operation as one of its sources is rejected (self-validated truth)', () => {
  assert.throws(
    () =>
      validateFlowDefinition(
        protocolDoc({ mode: 'synthesize', aggregation: aggregationDecl({ sourceOperationRefs: ['research', 'synthesize'] }) }),
      ),
    (err) => err instanceof FlowDefinitionError && /may not cite its own output operation as one of its own sources/.test(err.message),
  );
});

test('schema: an aggregation declaring zero source operations is rejected', () => {
  assert.throws(
    () => validateFlowDefinition(protocolDoc({ mode: 'synthesize', aggregation: aggregationDecl({ sourceOperationRefs: [] }) })),
    (err) => err instanceof FlowDefinitionError && /must name at least one source operation/.test(err.message),
  );
});

test('schema: a dangling aggregation operation ref is rejected in both fields', () => {
  assert.throws(
    () => validateFlowDefinition(protocolDoc({ mode: 'synthesize', aggregation: aggregationDecl({ sourceOperationRefs: ['nope'] }) })),
    (err) => err instanceof FlowDefinitionError && /sourceOperationRefs\[0\] "nope" does not reference a declared/.test(err.message),
  );
  assert.throws(
    () => validateFlowDefinition(protocolDoc({ mode: 'synthesize', aggregation: aggregationDecl({ outputOperationRef: 'nope' }) })),
    (err) => err instanceof FlowDefinitionError && /outputOperationRef "nope" does not reference a declared/.test(err.message),
  );
});

test('schema: an unknown field on the aggregation declaration is rejected (whitelist, like every other shape here)', () => {
  assert.throws(
    () => validateFlowDefinition(protocolDoc({ mode: 'synthesize', aggregation: aggregationDecl({ tieBreaker: 'majority' }) })),
    (err) => err instanceof FlowDefinitionError && /has unknown field "tieBreaker"/.test(err.message),
  );
});

test('schema: a Workflow profile cannot declare completion.aggregation (structurally, via completion itself)', () => {
  const doc = protocolDoc({ mode: 'synthesize', aggregation: aggregationDecl() });
  doc.spec.profile = { kind: 'Workflow', completion: { mode: 'synthesize', aggregation: aggregationDecl() } };
  assert.throws(
    () => validateFlowDefinition(doc),
    (err) => err instanceof FlowDefinitionError && /spec\.profile has unknown field "completion"/.test(err.message),
  );
});

// ─── Layer 1b: completion.mode REGRESSION -- byte-unchanged ────────────────

test('regression: completion.mode alone produces exactly the pre-aggregation shape, with no aggregation key at all', () => {
  for (const mode of ['synthesize', 'all-required', 'explicit-partial']) {
    const validated = validateFlowDefinition(protocolDoc({ mode }));
    // Deep-equal against the literal object this schema produced before
    // aggregation existed (`Object.freeze({ mode: profile.completion.mode })`).
    assert.deepEqual(validated.spec.profile.completion, { mode });
    assert.deepEqual(Object.keys(validated.spec.profile.completion), ['mode']);
    assert.equal('aggregation' in validated.spec.profile.completion, false);
    assert.ok(Object.isFrozen(validated.spec.profile.completion));
  }
});

test('regression: completion.mode validation rules are untouched by the aggregation field', () => {
  // Unknown mode still rejected, with the same message.
  assert.throws(
    () => validateFlowDefinition(protocolDoc({ mode: 'quorum' })),
    (err) => err instanceof FlowDefinitionError && /completion\.mode must be one of synthesize \| all-required \| explicit-partial/.test(err.message),
  );
  // `mode` is still required whenever `completion` is present -- declaring
  // ONLY aggregation does not make mode optional.
  assert.throws(
    () => validateFlowDefinition(protocolDoc({ aggregation: aggregationDecl() })),
    (err) => err instanceof FlowDefinitionError && /completion\.mode must be one of/.test(err.message),
  );
  // An unknown field on `completion` is still rejected.
  assert.throws(
    () => validateFlowDefinition(protocolDoc({ mode: 'synthesize', quorum: 2 })),
    (err) => err instanceof FlowDefinitionError && /spec\.profile\.completion has unknown field "quorum"/.test(err.message),
  );
});

test("regression: mode 'synthesize' still enforces its advisory-reachability rule, with and without an aggregation declared", () => {
  const noAdvisory = (completion) => {
    const doc = protocolDoc(completion);
    doc.spec.operations = doc.spec.operations.map((op) => ({ ...op, result: { kind: 'work-product', evidenceRequired: 'reported' } }));
    return doc;
  };
  for (const completion of [{ mode: 'synthesize' }, { mode: 'synthesize', aggregation: aggregationDecl() }]) {
    assert.throws(
      () => validateFlowDefinition(noAdvisory(completion)),
      (err) => err instanceof FlowDefinitionError && /requires at least one operation with result\.kind "advisory"/.test(err.message),
      `advisory-reachability must fire identically for ${JSON.stringify(completion)}`,
    );
  }
});

// ─── Layer 2: the aggregation-validated event ──────────────────────────────

function eventPayload(overrides = {}) {
  return {
    aggregationId: 'agg_1',
    method: AGGREGATION_METHOD,
    outcome: 'consensus',
    sourceResultRefs: ['asgn_a', 'asgn_b'],
    validatedBy: { type: 'driver', id: 'coordinator-1' },
    ...overrides,
  };
}

test('event: a well-formed aggregation-validated payload validates', () => {
  assert.doesNotThrow(() => validateEventPayload('aggregation-validated', eventPayload()));
  assert.doesNotThrow(() =>
    validateEventPayload(
      'aggregation-validated',
      eventPayload({
        outcome: 'qualified',
        assignmentId: 'asgn_out',
        runId: 'run_asgn_out_01',
        outputArtifactRef: 'reports/synthesis.md',
        dissentRefs: ['research'],
        unresolvedContributionRefs: ['asgn_c'],
        missingActors: ['researcher-b'],
        failedActors: ['researcher-c'],
        artifactRevisionRefs: ['reports/a.md@abc123'],
      }),
    ),
  );
});

test('event: outcome and method are closed enums', () => {
  for (const bad of ['majority', 'accepted', 'CONSENSUS']) {
    assert.throws(
      () => validateEventPayload('aggregation-validated', eventPayload({ outcome: bad })),
      (err) => err instanceof CoordinationError && /payload\.outcome must be one of/.test(err.message),
    );
  }
  assert.throws(
    () => validateEventPayload('aggregation-validated', eventPayload({ method: 'weighted-vote' })),
    (err) => err instanceof CoordinationError && /payload\.method must be one of/.test(err.message),
  );
});

test('event: validatedBy must be driver-shaped -- a worker-typed validator is refused at shape level', () => {
  assert.throws(
    () => validateEventPayload('aggregation-validated', eventPayload({ validatedBy: { type: 'worker', id: 'researcher-a' } })),
    (err) => err instanceof CoordinationError && /payload\.validatedBy\.type must be "driver"/.test(err.message),
  );
});

test('event: sourceResultRefs must be non-empty -- no evidence-free consensus', () => {
  assert.throws(
    () => validateEventPayload('aggregation-validated', eventPayload({ sourceResultRefs: [] })),
    (err) => err instanceof CoordinationError && /sourceResultRefs must be a non-empty array/.test(err.message),
  );
});

test('event: an aggregate naming its own output Assignment among its sources is refused (self-validated truth)', () => {
  assert.throws(
    () => validateEventPayload('aggregation-validated', eventPayload({ assignmentId: 'asgn_a' })),
    (err) => err instanceof CoordinationError && /may not be its own evidence/.test(err.message),
  );
});

test('event: an unknown field on the payload is rejected', () => {
  assert.throws(
    () => validateEventPayload('aggregation-validated', eventPayload({ voteTally: { a: 2 } })),
    (err) => err instanceof CoordinationError && /has unknown field "voteTally"/.test(err.message),
  );
});

// ─── Layer 2b: the store door and replay's refusals ────────────────────────

function inlineContract() {
  return {
    objective: 'Gather background facts.',
    contextRefs: [],
    constraints: [],
    expectedOutputs: ['agent-result.json (status, summary)'],
    mutation: 'read-only',
    evidence: { required: 'reported' },
    role: 'researcher',
    budget: { timeoutMs: 60000, maxRuns: 1 },
  };
}

/** A session with two settled, linked Assignments -- the minimum an
 *  aggregation can legally cite, built through the ordinary store doors. */
function twoLinkedResults(coordinationId) {
  const tempDir = mkTempDir();
  const opts = { cwd: tempDir };
  openSession({ coordinationId, objective: 'Aggregate.', provenanceRoot: { writerId: 'coordinator-1' } }, opts);
  const ids = ['a', 'b'].map((suffix) => {
    const created = createSessionAssignment(
      { coordinationId, taskKey: `research-${suffix}`, contract: inlineContract(), caller: { writerId: 'coordinator-1' } },
      opts,
    );
    linkResult(coordinationId, { assignmentId: created.assignmentId, runId: `run_${created.assignmentId}_01` }, opts);
    return created.assignmentId;
  });
  return { tempDir, opts, assignmentIds: ids };
}

function storePayload(assignmentIds, overrides = {}) {
  return { ...eventPayload({ sourceResultRefs: assignmentIds }), ...overrides };
}

test('store door: appends once, then is an idempotent no-op for a byte-identical payload', () => {
  const { opts, assignmentIds } = twoLinkedResults('coord_agg_store_ok');
  const first = recordAggregationValidation('coord_agg_store_ok', storePayload(assignmentIds), opts);
  assert.equal(first.appended, true);
  const again = recordAggregationValidation('coord_agg_store_ok', storePayload(assignmentIds), opts);
  assert.equal(again.appended, false);
  assert.equal(replaySession('coord_agg_store_ok', opts).aggregations.length, 1);
});

test('store door: reusing one aggregationId for a DIFFERENT verdict is refused -- a validated aggregation is never overwritten', () => {
  const { opts, assignmentIds } = twoLinkedResults('coord_agg_store_overwrite');
  recordAggregationValidation('coord_agg_store_overwrite', storePayload(assignmentIds, { outcome: 'no-consensus' }), opts);
  assert.throws(
    () => recordAggregationValidation('coord_agg_store_overwrite', storePayload(assignmentIds, { outcome: 'consensus' }), opts),
    (err) => err instanceof CoordinationError && err.category === 'duplicate-ref' && /never overwritten in place/.test(err.message),
  );
});

test('store door: a source result belonging to no Assignment of this session is refused', () => {
  const { opts, assignmentIds } = twoLinkedResults('coord_agg_store_foreign');
  assert.throws(
    () =>
      recordAggregationValidation(
        'coord_agg_store_foreign',
        storePayload([...assignmentIds, 'asgn_from_another_session_001']),
        opts,
      ),
    (err) => err instanceof CoordinationError && err.category === 'foreign-ref' && /is not an Assignment of session/.test(err.message),
  );
});

test("store door: validatedBy.id must be the session's own driver identity (shared assertDriverIdentity pin)", () => {
  const { opts, assignmentIds } = twoLinkedResults('coord_agg_store_identity');
  assert.throws(
    () =>
      recordAggregationValidation(
        'coord_agg_store_identity',
        storePayload(assignmentIds, { validatedBy: { type: 'driver', id: 'researcher-a' } }),
        opts,
      ),
    (err) => err instanceof CoordinationError && /is not the driver identity of session/.test(err.message),
  );
});

test('store door: refuses to validate an aggregation into a session that has already closed', () => {
  const { opts, assignmentIds } = twoLinkedResults('coord_agg_store_closed');
  transitionSessionStatus('coord_agg_store_closed', 'failed', { reason: 'abandoned' }, opts);
  assert.throws(
    () => recordAggregationValidation('coord_agg_store_closed', storePayload(assignmentIds), opts),
    (err) => err instanceof CoordinationError && /is not active/.test(err.message),
  );
});

test('replay: reconstructs a legitimately recorded aggregation into `aggregations`', () => {
  const { opts, assignmentIds } = twoLinkedResults('coord_agg_replay_ok');
  recordAggregationValidation('coord_agg_replay_ok', storePayload(assignmentIds, { outcome: 'qualified' }), opts);
  const [record] = replaySession('coord_agg_replay_ok', opts).aggregations;
  assert.equal(record.aggregationId, 'agg_1');
  assert.equal(record.outcome, 'qualified');
  assert.deepEqual([...record.sourceResultRefs], assignmentIds);
  assert.ok(Object.isFrozen(record));
});

// The headline: a forged aggregate written straight to the raw event log,
// never through `validateSessionAggregation`. Each case names the ONE
// invariant that catches it.

test('replay REJECTS a worker-shaped aggregate: validatedBy names an actor, not this session\'s driver', () => {
  const { tempDir, opts, assignmentIds } = twoLinkedResults('coord_agg_forged_worker');
  const { eventsPath } = resolveSessionPaths('coord_agg_forged_worker', opts);
  // Hand-appended, bypassing the store door entirely -- the shape a worker
  // (or anything else with log access) would have to produce to pass its own
  // output off as a validated aggregate.
  fs.appendFileSync(
    eventsPath,
    `${JSON.stringify({
      seq: 900,
      ts: new Date().toISOString(),
      v: '1',
      type: 'aggregation-validated',
      payload: storePayload(assignmentIds, { validatedBy: { type: 'driver', id: 'researcher-a' } }),
    })}\n`,
  );
  assert.ok(fs.existsSync(tempDir));
  assert.throws(
    () => replaySession('coord_agg_forged_worker', opts),
    (err) =>
      err instanceof CoordinationError &&
      err.category === 'foreign-ref' &&
      /is not this session's driver identity/.test(err.message),
  );
});

test('replay REJECTS an aggregate citing a source result this session never linked', () => {
  const { opts, assignmentIds } = twoLinkedResults('coord_agg_forged_unlinked');
  const { eventsPath } = resolveSessionPaths('coord_agg_forged_unlinked', opts);
  fs.appendFileSync(
    eventsPath,
    `${JSON.stringify({
      seq: 901,
      ts: new Date().toISOString(),
      v: '1',
      type: 'aggregation-validated',
      payload: storePayload([...assignmentIds, 'asgn_never_linked_001']),
    })}\n`,
  );
  assert.throws(
    () => replaySession('coord_agg_forged_unlinked', opts),
    (err) => err instanceof CoordinationError && err.category === 'out-of-order-ref' && /has no accepted "result-linked" event/.test(err.message),
  );
});

test('replay REJECTS a self-inconsistent forged consensus: outcome "consensus" alongside a named missing actor', () => {
  const { opts, assignmentIds } = twoLinkedResults('coord_agg_forged_inconsistent');
  const { eventsPath } = resolveSessionPaths('coord_agg_forged_inconsistent', opts);
  fs.appendFileSync(
    eventsPath,
    `${JSON.stringify({
      seq: 902,
      ts: new Date().toISOString(),
      v: '1',
      type: 'aggregation-validated',
      payload: storePayload(assignmentIds, { outcome: 'consensus', missingActors: ['researcher-b'] }),
    })}\n`,
  );
  assert.throws(
    () => replaySession('coord_agg_forged_inconsistent', opts),
    (err) => err instanceof CoordinationError && /cannot reach consensus with an unsatisfied or unpinned source binding/.test(err.message),
  );
});

test('replay NEUTRALIZES a post-terminal aggregation instead of trusting it (same posture as a post-terminal authorization)', () => {
  const { opts, assignmentIds } = twoLinkedResults('coord_agg_post_terminal');
  transitionSessionStatus('coord_agg_post_terminal', 'completed', {}, opts);
  const { eventsPath } = resolveSessionPaths('coord_agg_post_terminal', opts);
  fs.appendFileSync(
    eventsPath,
    `${JSON.stringify({
      seq: 903,
      ts: new Date().toISOString(),
      v: '1',
      type: 'aggregation-validated',
      payload: storePayload(assignmentIds),
    })}\n`,
  );
  const replayed = replaySession('coord_agg_post_terminal', opts);
  assert.deepEqual([...replayed.aggregations], []);
  assert.equal(replayed.ignoredAggregations.length, 1);
  assert.equal(replayed.ignoredAggregations[0].aggregationId, 'agg_1');
});

test('replay REJECTS a duplicate aggregationId', () => {
  const { opts, assignmentIds } = twoLinkedResults('coord_agg_dup_id');
  recordAggregationValidation('coord_agg_dup_id', storePayload(assignmentIds), opts);
  const { eventsPath } = resolveSessionPaths('coord_agg_dup_id', opts);
  fs.appendFileSync(
    eventsPath,
    `${JSON.stringify({ seq: 904, ts: new Date().toISOString(), v: '1', type: 'aggregation-validated', payload: storePayload(assignmentIds) })}\n`,
  );
  assert.throws(
    () => replaySession('coord_agg_dup_id', opts),
    (err) => err instanceof CoordinationError && err.category === 'duplicate-ref' && /duplicate "aggregation-validated"/.test(err.message),
  );
});

// ─── Layer 3: a REAL evaluator call over a REAL dispatched session ─────────

function fakeRunnerConfig(tempDir, { status = 'done', report = '# Research Report\nMeasured latency across three regions and recorded the observed percentiles.\n' } = {}) {
  const executorScript = path.join(tempDir, `fake-agg-executor-${Math.random().toString(36).slice(2)}.mjs`);
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
            fs.writeFileSync(path.join(runDir, 'agent-report.md'), ${JSON.stringify(report)});
            fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ status: ${JSON.stringify(status)}, summary: 'Settled by the test executor.' }));
          }
        }
      }
    }
    process.stdout.write('done\\n');
    `,
  );
  return {
    executor: { allowCrossProvider: true, command: process.execPath, args: [executorScript, '{prompt}'] },
    modelPolicies: { claude: { lightweight: 'test-model', standard: 'test-model' } },
    timeoutMs: 8000,
  };
}

/** Write the protocol under test into a temp PROJECT tier and open a session
 *  on it. No committed fixture under `core/` is touched. */
function openAggregationSession(coordinationId, aggOverrides = {}) {
  const tempDir = mkTempDir();
  const protocolsDir = path.join(tempDir, '.fgos', 'coordination-protocols');
  fs.mkdirSync(protocolsDir, { recursive: true });
  fs.writeFileSync(
    path.join(protocolsDir, 'aggregation-under-test.json'),
    JSON.stringify(protocolDoc({ mode: 'synthesize', aggregation: aggregationDecl(aggOverrides) }), null, 2),
  );
  const opts = { cwd: tempDir, repoRoot: tempDir };
  const { manifest } = openDeclaredProtocolSession(
    { definitionId: PROTOCOL_ID, coordinationId, objective: 'Aggregate two independent research passes.', writerId: 'coordinator-1' },
    opts,
  );
  return { tempDir, opts, manifest };
}

/**
 * One research binding, dispatched through the real declared-operation door.
 *
 * The explicit per-actor `taskKey` is required, not cosmetic: this operation
 * is bound to two actors at one node, and `dispatchDeclaredOperation`'s
 * default `declared:<operationId>` key carries no actor discriminator, so
 * both bindings would otherwise resume the SAME Assignment (the engine's own
 * error message for the adjacent authorized case says exactly this: "pass an
 * explicit, distinct taskKey (e.g. including the target actor)").
 *
 * Returns the ids read back from an independent replay rather than from the
 * dispatch return value, so every assertion downstream rests on the durable
 * event log.
 */
async function dispatchResearch(coordinationId, ctx, targetActorId, runnerConfig) {
  await dispatchDeclaredOperation(
    coordinationId,
    {
      operationId: 'research',
      targetActorId,
      taskKey: `declared:research:${targetActorId}`,
      objective: `Independent research pass for ${targetActorId}.`,
      expectedOutputs: ['agent-result.json (status, summary)'],
      writerId: 'coordinator-1',
    },
    { ...ctx.opts, runnerConfig: runnerConfig ?? ctx.runnerConfig },
  );
  const replayed = replaySession(coordinationId, ctx.opts);
  const created = replayed.assignments.find((entry) => entry.actorId === targetActorId);
  assert.ok(created, `expected an assignment-created event for "${targetActorId}"`);
  const linked = [...replayed.results].reverse().find((entry) => entry.assignmentId === created.assignmentId);
  assert.ok(linked, `expected a linked RunResult for "${targetActorId}"`);
  return { assignmentId: created.assignmentId, runId: linked.runId };
}

/**
 * The coordinator's own single-binding operation. Dispatching it also gives
 * `coordinator-actor` the Assignment quorum requires of every declared actor
 * -- without it, `closeSessionByQuorum` refuses on the pre-existing R1 rule
 * (nothing to do with aggregation) and the terminal-authority assertions
 * would be testing the wrong refusal.
 */
async function dispatchReview(coordinationId, ctx) {
  await dispatchDeclaredOperation(
    coordinationId,
    {
      operationId: 'review',
      targetActorId: 'coordinator-actor',
      taskKey: 'declared:review:coordinator-actor',
      objective: 'Review the collected research.',
      expectedOutputs: ['agent-result.json (status, summary)'],
      writerId: 'coordinator-1',
    },
    { ...ctx.opts, runnerConfig: ctx.runnerConfig },
  );
}

function definitionUnderTest(aggOverrides = {}) {
  return validateFlowDefinition(protocolDoc({ mode: 'synthesize', aggregation: aggregationDecl(aggOverrides) }));
}

function validatedBy() {
  return { type: 'driver', id: 'coordinator-1' };
}

test('runtime: a fully settled, revision-pinned cohort validates as consensus through the REAL evaluator, and only then may the session close', async () => {
  const coordinationId = 'coord_agg_rt_consensus';
  const ctx = openAggregationSession(coordinationId);
  ctx.runnerConfig = fakeRunnerConfig(ctx.tempDir);
  await dispatchResearch(coordinationId, ctx, 'researcher-a');
  await dispatchResearch(coordinationId, ctx, 'researcher-b');
  await dispatchReview(coordinationId, ctx);

  const result = validateSessionAggregation(
    coordinationId,
    { definition: definitionUnderTest(), aggregationId: 'agg_rt_1', validatedBy: validatedBy() },
    ctx.opts,
  );
  assert.equal(result.outcome, 'consensus');
  // The evidence is real and preserved: one revision-pinned source per branch.
  assert.equal(result.event.sourceResultRefs.length, 2);
  assert.equal(result.event.artifactRevisionRefs.length, 2);
  assert.equal(result.event.missingActors, undefined);

  // Terminal authority: session-engine performs the transition, gated on (not
  // replaced by) the validated outcome.
  const manifest = closeSessionByQuorum(coordinationId, { aggregationId: 'agg_rt_1' }, ctx.opts);
  assert.equal(manifest.status, 'completed');
});

test('runtime: an artifact edited after settle makes its source stale -- no-consensus, and the close is REFUSED', async () => {
  const coordinationId = 'coord_agg_rt_stale';
  const ctx = openAggregationSession(coordinationId);
  ctx.runnerConfig = fakeRunnerConfig(ctx.tempDir);
  const a = await dispatchResearch(coordinationId, ctx, 'researcher-a');
  await dispatchResearch(coordinationId, ctx, 'researcher-b');

  // Tamper with one branch's settled report AFTER it was classified. Its
  // recorded sha256 pin no longer matches the bytes on disk.
  const { fgosDir } = resolveSessionPaths(coordinationId, ctx.opts);
  const attempt = a.runId.slice(`run_${a.assignmentId}_`.length);
  const reportPath = path.join(fgosDir, 'assignments', a.assignmentId, 'runs', attempt, 'agent-report.md');
  const before = fs.readFileSync(reportPath, 'utf8');
  fs.writeFileSync(reportPath, `${before}\nQuietly appended after the run settled.\n`);
  assert.notEqual(crypto.createHash('sha256').update(fs.readFileSync(reportPath)).digest('hex'), null);

  const result = validateSessionAggregation(
    coordinationId,
    { definition: definitionUnderTest(), aggregationId: 'agg_rt_stale', validatedBy: validatedBy() },
    ctx.opts,
  );
  assert.equal(result.outcome, 'no-consensus');
  assert.equal(result.classification.revisionCurrency.ok, false);
  assert.equal(result.classification.revisionCurrency.staleSourceKeys.length, 1);

  assert.throws(
    () => closeSessionByQuorum(coordinationId, { aggregationId: 'agg_rt_stale' }, ctx.opts),
    (err) => err instanceof CoordinationError && /validated as "no-consensus", not "consensus" -- refusing to close/.test(err.message),
  );
});

test('runtime: a required disclosure the engine cannot derive fails coverage rather than being silently skipped', async () => {
  const coordinationId = 'coord_agg_rt_disclosure';
  const ctx = openAggregationSession(coordinationId, { requiredDisclosures: ['confidence', 'provenanceAttestation'] });
  ctx.runnerConfig = fakeRunnerConfig(ctx.tempDir);
  await dispatchResearch(coordinationId, ctx, 'researcher-a');
  await dispatchResearch(coordinationId, ctx, 'researcher-b');

  const result = validateSessionAggregation(
    coordinationId,
    {
      definition: definitionUnderTest({ requiredDisclosures: ['confidence', 'provenanceAttestation'] }),
      aggregationId: 'agg_rt_disc',
      validatedBy: validatedBy(),
    },
    ctx.opts,
  );
  assert.equal(result.outcome, 'no-consensus');
  assert.equal(result.classification.coverage.disclosureCoverage.ok, false);
});

test('runtime: a half-answered cohort never reaches consensus -- the missing branch is NAMED on the event, not omitted', async () => {
  const coordinationId = 'coord_agg_rt_partial';
  // Two declared source operations. `review` settles fully, so the
  // aggregation still has real evidence to validate; `research` is only half
  // answered, so it must contribute nothing at all.
  const sources = { sourceOperationRefs: ['research', 'review'] };
  const ctx = openAggregationSession(coordinationId, sources);
  ctx.runnerConfig = fakeRunnerConfig(ctx.tempDir);
  await dispatchResearch(coordinationId, ctx, 'researcher-a');
  await dispatchReview(coordinationId, ctx);
  // researcher-b never runs.

  const result = validateSessionAggregation(
    coordinationId,
    { definition: definitionUnderTest(sources), aggregationId: 'agg_rt_partial', validatedBy: validatedBy() },
    ctx.opts,
  );
  assert.equal(result.outcome, 'no-consensus');
  assert.deepEqual(result.event.missingActors, ['researcher-b']);
  // All-of: researcher-a's satisfied, pinned result contributes NO source
  // either, so `research` is genuinely uncovered rather than half-covered.
  assert.equal(result.classification.coverage.sourceCoverage.ok, false);
  assert.deepEqual([...result.classification.coverage.sourceCoverage.missingSourceOperationRefs], ['research']);
  // Only `review`'s single settled contribution survives as evidence.
  assert.equal(result.event.sourceResultRefs.length, 1);

  assert.throws(
    () => closeSessionByQuorum(coordinationId, { aggregationId: 'agg_rt_partial' }, ctx.opts),
    (err) => err instanceof CoordinationError && /refusing to close/.test(err.message),
  );
});

test('runtime: an aggregation with no usable evidence at all is refused outright rather than recorded as a verdict', async () => {
  const coordinationId = 'coord_agg_rt_no_evidence';
  const ctx = openAggregationSession(coordinationId);
  ctx.runnerConfig = fakeRunnerConfig(ctx.tempDir);
  // The single declared source operation is half answered, so after the
  // all-of rule nothing remains to validate. There is no honest
  // `aggregation-validated` event to write here -- `sourceResultRefs` may
  // never be empty -- so this fails closed instead.
  await dispatchResearch(coordinationId, ctx, 'researcher-a');

  assert.throws(
    () =>
      validateSessionAggregation(
        coordinationId,
        { definition: definitionUnderTest(), aggregationId: 'agg_rt_none', validatedBy: validatedBy() },
        ctx.opts,
      ),
    (err) => err instanceof CoordinationError && /refusing to validate an aggregation with no evidence behind it/.test(err.message),
  );
  // Nothing was recorded, so nothing can later be cited as a validated verdict.
  assert.deepEqual([...replaySession(coordinationId, ctx.opts).aggregations], []);
});

test('runtime: validateSessionAggregation never transitions the session -- the manifest is still active afterwards', async () => {
  const coordinationId = 'coord_agg_rt_no_transition';
  const ctx = openAggregationSession(coordinationId);
  ctx.runnerConfig = fakeRunnerConfig(ctx.tempDir);
  await dispatchResearch(coordinationId, ctx, 'researcher-a');
  await dispatchResearch(coordinationId, ctx, 'researcher-b');

  const result = validateSessionAggregation(
    coordinationId,
    { definition: definitionUnderTest(), aggregationId: 'agg_rt_nt', validatedBy: validatedBy() },
    ctx.opts,
  );
  assert.equal(result.outcome, 'consensus');
  const replayed = replaySession(coordinationId, ctx.opts);
  assert.equal(replayed.manifest.status, 'active');
  assert.equal(replayed.manifest.completedAt, null);
  // The event is recorded; the transition is a separate, later act.
  assert.equal(replayed.aggregations.length, 1);
});

test('runtime: closeSessionByQuorum refuses an aggregationId this session never validated', async () => {
  const coordinationId = 'coord_agg_rt_unknown_id';
  const ctx = openAggregationSession(coordinationId);
  ctx.runnerConfig = fakeRunnerConfig(ctx.tempDir);
  await dispatchResearch(coordinationId, ctx, 'researcher-a');
  await dispatchResearch(coordinationId, ctx, 'researcher-b');
  assert.throws(
    () => closeSessionByQuorum(coordinationId, { aggregationId: 'agg_never_validated' }, ctx.opts),
    (err) => err instanceof CoordinationError && err.category === 'dangling-ref' && /no valid "aggregation-validated" event/.test(err.message),
  );
});

test('regression: closeSessionByQuorum with no aggregationId behaves exactly as it did before aggregation existed', async () => {
  const coordinationId = 'coord_agg_rt_no_agg_arg';
  const ctx = openAggregationSession(coordinationId);
  ctx.runnerConfig = fakeRunnerConfig(ctx.tempDir);
  await dispatchResearch(coordinationId, ctx, 'researcher-a');
  await dispatchResearch(coordinationId, ctx, 'researcher-b');
  await dispatchReview(coordinationId, ctx);

  // A no-consensus aggregation is on the log, but an un-parameterized close
  // must not consult it -- omitting the argument leaves the old path intact.
  const { fgosDir } = resolveSessionPaths(coordinationId, ctx.opts);
  assert.ok(fs.existsSync(fgosDir));
  const partial = validateSessionAggregation(
    coordinationId,
    { definition: definitionUnderTest({ requiredDisclosures: ['nope'] }), aggregationId: 'agg_ignored', validatedBy: validatedBy() },
    ctx.opts,
  );
  assert.equal(partial.outcome, 'no-consensus');

  const manifest = closeSessionByQuorum(coordinationId, {}, ctx.opts);
  assert.equal(manifest.status, 'completed');
});

// ─── Authority boundary, statically ────────────────────────────────────────

test('authority: the aggregation evaluator itself contains no session-transition call -- only session-engine transitions', () => {
  const evaluatorPath = path.resolve(
    path.dirname(new URL(import.meta.url).pathname),
    '../../src/runner/team-cognition/aggregation-evaluator.mjs',
  );
  const source = fs.readFileSync(evaluatorPath, 'utf8');
  for (const forbidden of ['transitionSessionStatus', 'closeSessionByQuorum', 'appendEvent', 'recordAggregationValidation']) {
    assert.equal(source.includes(forbidden), false, `aggregation-evaluator.mjs must not reference "${forbidden}"`);
  }
});

test('authority: validateSessionAggregation writes only the aggregation event -- it calls no terminal-transition primitive', () => {
  const enginePath = path.resolve(
    path.dirname(new URL(import.meta.url).pathname),
    '../../src/runner/coordination/session-engine.mjs',
  );
  const source = fs.readFileSync(enginePath, 'utf8');
  const start = source.indexOf('export function validateSessionAggregation(');
  assert.ok(start > 0, 'validateSessionAggregation must exist');
  // Bounded by the next top-level export, which is the retry door below it.
  const end = source.indexOf('\nexport async function retrySessionTask(', start);
  assert.ok(end > start, 'expected retrySessionTask to follow validateSessionAggregation');
  const body = source.slice(start, end);
  for (const forbidden of ['transitionSessionStatus', 'transitionSessionStatusLocked']) {
    assert.equal(body.includes(forbidden), false, `validateSessionAggregation must not call "${forbidden}"`);
  }
  assert.ok(body.includes('classifyAggregationOutcome('), 'it must call the real evaluator');
});

// `appendEvent` is imported above only to keep this file's store-door surface
// explicit alongside the doors it exercises; the forged-event tests write raw
// lines deliberately, to bypass every door.
assert.equal(typeof appendEvent, 'function');
