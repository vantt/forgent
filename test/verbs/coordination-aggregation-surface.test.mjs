// Step 09 Phase 07 (MVP7), cell P07.4: the SURFACE over evidence-preserving
// aggregation, and the regression proof around it.
//
// P07.3 built the whole aggregation machine -- the `completion.aggregation`
// declaration, the `aggregation-validated` event, its store door, its replay
// reconstruction and refusals, and `closeSessionByQuorum`'s optional
// `aggregationId` terminal-input gate -- and closed with one named gap: that
// gate had ZERO production callers. `src/verbs/coordination/run.mjs` passed
// `{}`, so a protocol could declare `completion.aggregation` and close on
// quorum alone with nothing noticing. This file proves that gap closed, from
// the request surface a real caller actually uses.
//
// Four things are proved here, and only here:
//   1. a declared aggregation is ENFORCED at the close a request reaches --
//      refused with no validated aggregation, refused on a non-consensus
//      verdict, allowed on consensus;
//   2. a definition declaring NOTHING is byte-unchanged (opt-in stays opt-in
//      at the schema level);
//   3. `fgos coordination show` renders the whole validated record -- method,
//      outcome, sources, dissent, unresolved items, failures/omissions,
//      artifact revisions -- including a neutralized post-terminal one;
//   4. aggregation never upgrades a RunResult: a `consensus` verdict leaves
//      every settled Assignment's own recorded status/confidence identical.
//
// Plus CLI/headless parity over a full aggregation scenario: the SAME
// three-phase sequence (refused close -> validate -> resumed close) driven
// once through a genuinely spawned `fgos coordination run --file` subprocess
// and once through `runCoordinationHeadless`, deep-compared.
//
// Every run drives real Node subprocesses through the real dispatch path
// against a project-tier protocol written into a temp dir -- no JS-level stub
// over the engine, and no committed fixture under `core/` read or altered.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { runCoordinationUseCase } from '../../src/verbs/coordination/run.mjs';
import { showCoordinationUseCase } from '../../src/verbs/coordination/show.mjs';
import { runCoordinationHeadless } from '../../src/runner/coordination/headless-adapter.mjs';
import { validateSessionAggregation } from '../../src/runner/coordination/session-engine.mjs';
import { readManifest, resolveSessionPaths } from '../../src/runner/coordination/store.mjs';
import { replaySession } from '../../src/runner/coordination/replay.mjs';
import { StoreError } from '../../src/state/store.mjs';

const FGOS_CLI = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../bin/fgos.mjs');
const PROTOCOL_ID = 'test.coordination-protocol.aggregation-surface';
const AGGREGATION_METHOD = 'evidence-preserving-synthesis';
const WRITER_ID = 'coordinator-1';
const OUTPUTS = ['agent-result.json (status, summary)'];

function mkTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-agg-surface-'));
}

// The same graph P07.3's own runtime layer proved the evaluator over: two
// research bindings feeding one declared aggregation, plus a coordinator
// operation so every declared actor has the Assignment quorum requires of it
// (without `review`, `closeSessionByQuorum` refuses on the pre-existing R1
// rule and every assertion below would be watching the wrong refusal).
function protocolDoc({ withAggregation }) {
  const advisory = { kind: 'advisory', evidenceRequired: 'reported' };
  return {
    apiVersion: 'fgos.dev/v1alpha1',
    kind: 'FlowDefinition',
    metadata: { id: PROTOCOL_ID, version: '1.0.0' },
    spec: {
      profile: {
        kind: 'CoordinationProtocol',
        completion: {
          mode: 'synthesize',
          ...(withAggregation
            ? {
                aggregation: {
                  method: AGGREGATION_METHOD,
                  outputOperationRef: 'synthesize',
                  sourceOperationRefs: ['research'],
                  requiredDisclosures: ['confidence', 'dissent'],
                },
              }
            : {}),
        },
      },
      roles: ['coordinator', 'researcher'],
      actors: [
        { id: 'coordinator-actor', role: 'coordinator' },
        { id: 'researcher-a', role: 'researcher' },
        { id: 'researcher-b', role: 'researcher' },
      ],
      operations: [
        { id: 'research', role: 'researcher', result: advisory },
        { id: 'review', role: 'coordinator', result: advisory },
        { id: 'synthesize', role: 'coordinator', result: advisory },
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
    },
  };
}

function writeProtocol(tempDir, { withAggregation = true } = {}) {
  const dir = path.join(tempDir, '.fgos', 'coordination-protocols');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'aggregation-surface.json'), `${JSON.stringify(protocolDoc({ withAggregation }), null, 2)}\n`);
}

// A real Node subprocess that settles whatever run it is handed. Written into
// the workspace AND registered in `.fgos/config.json`, so the spawned CLI
// (which resolves its runner config from that file) and an in-process caller
// (which is handed the same object as `ctx.runnerConfig`) drive byte-identical
// executor behavior -- the only honest basis for a parity comparison.
function fakeRunnerConfig(tempDir) {
  const executorScript = path.join(tempDir, 'fake-executor.mjs');
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
            fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Research Report\\nMeasured latency across three regions and recorded the observed percentiles.\\n');
            fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'Settled by the test executor.' }));
          }
        }
      }
    }
    process.stdout.write('done\\n');
    process.exit(0);
    `,
  );
  const runnerConfig = {
    executor: { allowCrossProvider: true, command: process.execPath, args: [executorScript, '{prompt}'] },
    models: { standard: 'test-model', lightweight: 'test-model', creative: 'test-model', analytical: 'test-model', critical: 'test-model' },
    timeoutMs: 20000,
  };
  const configPath = path.join(tempDir, '.fgos', 'config.json');
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  const existing = fs.existsSync(configPath) ? JSON.parse(fs.readFileSync(configPath, 'utf8')) : {};
  fs.writeFileSync(configPath, `${JSON.stringify({ ...existing, runner: { ...(existing.runner ?? {}), ...runnerConfig } }, null, 2)}\n`);
  return runnerConfig;
}

function setup({ withAggregation = true } = {}) {
  const tempDir = mkTempDir();
  writeProtocol(tempDir, { withAggregation });
  const runnerConfig = fakeRunnerConfig(tempDir);
  return { tempDir, opts: { cwd: tempDir, repoRoot: tempDir }, ctx: { cwd: tempDir, repoRoot: tempDir, runnerConfig } };
}

// The dispatching request: both research bindings and the coordinator's own
// operation. The explicit per-actor `taskKey` is required, not cosmetic --
// `research` is bound to two actors at one node and the default
// `declared:<operationId>` key carries no actor discriminator, so both
// bindings would otherwise resume the SAME Assignment.
function dispatchRequest(coordinationId) {
  return {
    kind: 'declared-protocol',
    objective: 'Aggregate two independent research passes.',
    writerId: WRITER_ID,
    coordinationId,
    protocolRef: { id: PROTOCOL_ID },
    steps: [
      { type: 'operation', as: 'research-a', operationId: 'research', targetActorId: 'researcher-a', taskKey: 'declared-research-researcher-a', objective: 'Independent research pass A.', expectedOutputs: OUTPUTS },
      { type: 'operation', as: 'research-b', operationId: 'research', targetActorId: 'researcher-b', taskKey: 'declared-research-researcher-b', objective: 'Independent research pass B.', expectedOutputs: OUTPUTS },
      { type: 'operation', as: 'review', operationId: 'review', targetActorId: 'coordinator-actor', taskKey: 'declared-review-coordinator-actor', objective: 'Review the collected research.', expectedOutputs: OUTPUTS },
    ],
  };
}

// P10-KERNEL-FIX (session-engine.mjs's `actorGatingOperationIds`): when
// `completion.aggregation` is declared, `synthesize` -- its own
// `outputOperationRef` -- is deliberately excluded from coordinator-actor's
// gating set, because its completion is represented by the validated
// `aggregation-validated` event (`validateSessionAggregation`'s own
// `assignmentId`/`runId`/`outputArtifactRef` params are all optional, and
// every test in this file validates without supplying any of them), never
// by a dispatched Assignment. WITHOUT a declared aggregation there is no
// such substitute mechanism, so `synthesize` is a perfectly ordinary
// `required` binding like any other -- it now genuinely needs its own
// settled Assignment before coordinator-actor counts complete, exactly like
// `review`. Used ONLY by the two `withAggregation: false` tests below
// (`dispatchRequest`, above, stays untouched -- every `withAggregation: true`
// test in this file already passes unmodified, thanks to the exclusion).
function dispatchRequestNoAggregation(coordinationId) {
  const request = dispatchRequest(coordinationId);
  request.steps.push({
    type: 'operation',
    as: 'synthesize',
    operationId: 'synthesize',
    targetActorId: 'coordinator-actor',
    taskKey: 'declared-synthesize-coordinator-actor',
    objective: 'Synthesize the collected research (no aggregation declared -- an ordinary required operation).',
    expectedOutputs: OUTPUTS,
  });
  return request;
}

// P10-KERNEL-FIX Fix Round 1 (MEDIUM-5, redteam-report.md), revised by Fix
// Round 2 (N4/NEW-MEDIUM-C, redteam-recheck-report.md): a variant of the
// SAME declared-aggregation protocol above, with a SECOND actor,
// analyst-actor, ALSO bound to `synthesize` -- the aggregation's own
// `outputOperationRef` -- at the same graph node, for a reason unrelated to
// the aggregation entirely (an authoring coincidence of operation-id reuse,
// not a second aggregation output). With 2 DISTINCT actors bound to it, the
// exclusion applies to NEITHER (Fix Round 2 replaced Fix Round 1's
// "designate whichever binding comes first in graph order" heuristic, which
// was ambiguous and authoring-order-dependent) -- both actors' own
// `synthesize` bindings stay ordinary required operations.
//
// P10-KERNEL-FIX Fix Round 2 (NEW-HIGH-B, redteam-recheck-report.md):
// analyst-actor also gets a SECOND, ordinary, unrelated declared operation
// (`analyst-review`), so the regression test below is genuinely falsifiable
// against a reverted actor-aware exclusion. Without it, if the exclusion
// wrongly applied to analyst-actor's own `synthesize` binding too (the
// pre-Fix-Round-1 bug: keyed on operation id alone), analyst-actor would
// have an EMPTY gating set and fall through to the pre-existing fallback
// ("first assignment-created event for this actor, anywhere") -- which,
// with no Assignment dispatched for it yet, would ALSO read "missing",
// passing the assertion for the wrong reason entirely. With `analyst-review`
// declared and settled before the "missing" assertions below, a wrongly
// -applied exclusion instead leaves analyst-actor's gating set non-empty but
// ALREADY SATISFIED (that one binding alone), so it would incorrectly read
// "completed" -- discriminating the fix from the bug.
function protocolDocCrossActorSynthesize() {
  const advisory = { kind: 'advisory', evidenceRequired: 'reported' };
  const doc = protocolDoc({ withAggregation: true });
  // "synthesize" declares role "coordinator" (protocolDoc's own operations
  // list) -- analyst-actor must share that role for the binding to be
  // schema-legal at all, exactly like coordinator-actor's own binding to it.
  doc.spec.actors.push({ id: 'analyst-actor', role: 'coordinator' });
  doc.spec.graph.nodes[1].operations.push({ ref: 'synthesize', actor: 'analyst-actor' });
  doc.spec.operations.push({ id: 'analyst-review', role: 'coordinator', result: advisory });
  doc.spec.graph.nodes[1].operations.push({ ref: 'analyst-review', actor: 'analyst-actor' });
  return doc;
}

function writeCrossActorProtocol(tempDir) {
  const dir = path.join(tempDir, '.fgos', 'coordination-protocols');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'aggregation-surface.json'), `${JSON.stringify(protocolDocCrossActorSynthesize(), null, 2)}\n`);
}

// The same dispatch `dispatchRequest` performs, plus analyst-actor's own
// unrelated `analyst-review` step -- settled early so the cross-actor test
// below is genuinely falsifiable (NEW-HIGH-B, see the comment above
// `protocolDocCrossActorSynthesize`).
function dispatchRequestCrossActor(coordinationId) {
  const request = dispatchRequest(coordinationId);
  request.steps.push({
    type: 'operation',
    as: 'analyst-review',
    operationId: 'analyst-review',
    targetActorId: 'analyst-actor',
    taskKey: 'declared-analyst-review-analyst-actor',
    objective: 'Unrelated ordinary analyst review pass -- settles before either actor\'s "synthesize" to make the exclusion\'s actor-awareness falsifiable.',
    expectedOutputs: OUTPUTS,
  });
  return request;
}

// A resume request that dispatches nothing: one driver disposition over an
// Assignment the session already owns. Its only job is to reach the same
// close the first request reached, now that an aggregation has been
// validated. `targetRef` is a literal id rather than a `$ref:` label because
// the label lives in the earlier invocation, not this one.
function resumeRequest(coordinationId, targetAssignmentId) {
  return {
    kind: 'declared-protocol',
    objective: 'Aggregate two independent research passes.',
    writerId: WRITER_ID,
    coordinationId,
    protocolRef: { id: PROTOCOL_ID },
    steps: [
      {
        type: 'disposition',
        as: 'note-aggregate',
        targetRef: targetAssignmentId,
        disposition: 'accepted',
        rationale: 'The validated aggregation covers this contribution.',
        evidenceRefs: [],
      },
    ],
  };
}

function anAssignmentOf(coordinationId, opts) {
  return readManifest(coordinationId, opts).assignmentRefs[0];
}

/** Every settled RunResult of this session, read straight off disk. */
function runResultsOnDisk(coordinationId, opts) {
  const { fgosDir } = resolveSessionPaths(coordinationId, opts);
  const snapshot = {};
  for (const assignmentId of readManifest(coordinationId, opts).assignmentRefs) {
    const runsDir = path.join(fgosDir, 'assignments', assignmentId, 'runs');
    if (!fs.existsSync(runsDir)) continue;
    for (const attempt of fs.readdirSync(runsDir).sort()) {
      const resultPath = path.join(runsDir, attempt, 'result.json');
      if (!fs.existsSync(resultPath)) continue;
      const result = JSON.parse(fs.readFileSync(resultPath, 'utf8'));
      snapshot[`${assignmentId}/${attempt}`] = { status: result.status, confidence: result.confidence };
    }
  }
  return snapshot;
}

function validatedBy() {
  return { type: 'driver', id: WRITER_ID };
}

// ─── 1. The declared aggregation is ENFORCED at the close a request reaches ─

test('a protocol declaring completion.aggregation REFUSES to close on quorum alone -- the gate P07.3 left with zero production callers now has one', async () => {
  const coordinationId = 'coord_agg_surface_refuse';
  const { ctx, opts } = setup();

  const data = await runCoordinationUseCase(ctx, { requestObject: dispatchRequest(coordinationId) });

  assert.equal(data.closed, false);
  assert.equal(data.closeAttempted, true);
  assert.match(data.closeRefusalReason, /declares completion\.aggregation, but session "coord_agg_surface_refuse" has validated no aggregation/);
  // Refused, not merely reported: the session is genuinely still open.
  assert.equal(readManifest(coordinationId, opts).status, 'active');
  assert.equal(replaySession(coordinationId, opts).aggregations.length, 0);
});

test('with a validated consensus aggregation on the log, the same close PROCEEDS -- and the engine, not the request, is what performed the transition', async () => {
  const coordinationId = 'coord_agg_surface_consensus';
  const { ctx, opts } = setup();

  const first = await runCoordinationUseCase(ctx, { requestObject: dispatchRequest(coordinationId) });
  assert.equal(first.closed, false);

  const validated = validateSessionAggregation(coordinationId, { aggregationId: 'agg_surface_1', validatedBy: validatedBy() }, opts);
  assert.equal(validated.outcome, 'consensus');

  const second = await runCoordinationUseCase(ctx, {
    requestObject: resumeRequest(coordinationId, anAssignmentOf(coordinationId, opts)),
  });

  assert.equal(second.closed, true);
  assert.equal(second.closeRefusalReason, undefined);
  assert.equal(readManifest(coordinationId, opts).status, 'completed');
});

test('a validated NO-CONSENSUS aggregation still refuses the close, with the engine\'s own refusal -- the request surface forwards the id, it never judges the verdict', async () => {
  const coordinationId = 'coord_agg_surface_no_consensus';
  const { ctx, opts, tempDir } = setup();

  await runCoordinationUseCase(ctx, { requestObject: dispatchRequest(coordinationId) });

  // Edit one settled report after the fact: its revision pin no longer
  // matches, so the evaluator's own currency check forces `no-consensus`.
  const { fgosDir } = resolveSessionPaths(coordinationId, opts);
  const researchAssignment = replaySession(coordinationId, opts).assignments.find((entry) => entry.actorId === 'researcher-a');
  const runsDir = path.join(fgosDir, 'assignments', researchAssignment.assignmentId, 'runs');
  const attempt = fs.readdirSync(runsDir).sort()[0];
  fs.writeFileSync(path.join(runsDir, attempt, 'agent-report.md'), '# Tampered\nEdited after settle.\n');
  assert.ok(tempDir);

  const validated = validateSessionAggregation(coordinationId, { aggregationId: 'agg_surface_stale', validatedBy: validatedBy() }, opts);
  assert.equal(validated.outcome, 'no-consensus');

  const second = await runCoordinationUseCase(ctx, {
    requestObject: resumeRequest(coordinationId, anAssignmentOf(coordinationId, opts)),
  });

  assert.equal(second.closed, false);
  assert.match(second.closeRefusalReason, /validated as "no-consensus", not "consensus" -- refusing to close/);
  assert.equal(readManifest(coordinationId, opts).status, 'active');
});

test('P10-KERNEL-FIX Fix Round 2 N4/NEW-MEDIUM-C (a): the single-actor case still excuses correctly -- no regression from the exactly-one-actor rule', async () => {
  const coordinationId = 'coord_agg_surface_single_actor_excused';
  const { ctx, opts } = setup();

  const first = await runCoordinationUseCase(ctx, { requestObject: dispatchRequest(coordinationId) });
  assert.equal(first.closed, false);
  assert.deepEqual(
    first.quorum.missing.map((x) => x.actorId),
    [],
    'coordinator-actor is the ONLY actor bound to "synthesize" (the aggregation\'s own outputOperationRef) -- the exactly-one-actor rule still excludes it exactly as before Fix Round 2, and it needs no Assignment for it',
  );

  const validated = validateSessionAggregation(coordinationId, { aggregationId: 'agg_surface_single_actor', validatedBy: validatedBy() }, opts);
  assert.equal(validated.outcome, 'consensus');

  const second = await runCoordinationUseCase(ctx, { requestObject: resumeRequest(coordinationId, anAssignmentOf(coordinationId, opts)) });
  assert.equal(second.closed, true, 'closes cleanly -- coordinator-actor\'s "synthesize" binding stays excused, never dispatched');
  assert.equal(readManifest(coordinationId, opts).status, 'completed');
});

test('P10-KERNEL-FIX Fix Round 2 N4/NEW-MEDIUM-C (b) + NEW-HIGH-B: when 2 DISTINCT actors bind the aggregation\'s own outputOperationRef, NEITHER is silently excused, and neither is permanently deadlocked', async () => {
  const coordinationId = 'coord_agg_surface_cross_actor';
  const tempDir = mkTempDir();
  writeCrossActorProtocol(tempDir);
  const runnerConfig = fakeRunnerConfig(tempDir);
  const opts = { cwd: tempDir, repoRoot: tempDir };
  const ctx = { cwd: tempDir, repoRoot: tempDir, runnerConfig };

  // Dispatch every declared step except EITHER actor's own "synthesize"
  // binding -- including analyst-actor's unrelated "analyst-review", which
  // settles here (see the falsifiability comment above
  // `protocolDocCrossActorSynthesize`).
  const first = await runCoordinationUseCase(ctx, { requestObject: dispatchRequestCrossActor(coordinationId) });
  assert.equal(first.closed, false);
  assert.deepEqual(
    first.quorum.missing.map((x) => x.actorId).sort(),
    ['analyst-actor', 'coordinator-actor'],
    'coordinator-actor and analyst-actor both bind "synthesize" -- with 2 distinct actors bound, the exclusion applies to NEITHER (N4/NEW-MEDIUM-C), so both still owe their own real settled Assignment for it, even though analyst-actor\'s unrelated "analyst-review" binding has already settled',
  );
  assert.match(first.closeRefusalReason, /declares completion\.aggregation, but session "coord_agg_surface_cross_actor" has validated no aggregation/);

  // Validate the aggregation FIRST, isolating the actor-completion refusal
  // below from the separate "no validated aggregation" gate above. Its own
  // `sourceOperationRefs: ['research']` only ever consults researcher-a/b
  // (already settled) -- neither actor's "synthesize" binding has any
  // bearing on the aggregation's own consensus verdict.
  const validated = validateSessionAggregation(coordinationId, { aggregationId: 'agg_surface_cross_actor', validatedBy: validatedBy() }, opts);
  assert.equal(validated.outcome, 'consensus');

  const second = await runCoordinationUseCase(ctx, { requestObject: resumeRequest(coordinationId, anAssignmentOf(coordinationId, opts)) });
  assert.equal(second.closed, false, 'the aggregation gate is satisfied now -- the refusal below is the quorum engine\'s own, not aggregationCloseParams\'s');
  assert.deepEqual(second.quorum.missing.map((x) => x.actorId).sort(), ['analyst-actor', 'coordinator-actor']);
  assert.match(
    second.closeRefusalReason,
    /missing required actor\(s\)/,
    'closeSessionByQuorum itself refuses -- neither actor\'s binding to "synthesize" is excused when 2 distinct actors bind it',
  );

  // Settle BOTH actors' own "synthesize" -- proving neither is permanently
  // deadlocked by an arbitrary "designated actor" choice (N4/NEW-MEDIUM-C).
  const thirdRequest = {
    kind: 'declared-protocol',
    objective: 'Aggregate two independent research passes.',
    writerId: WRITER_ID,
    coordinationId,
    protocolRef: { id: PROTOCOL_ID },
    steps: [
      {
        type: 'operation',
        as: 'synthesize-coordinator',
        operationId: 'synthesize',
        targetActorId: 'coordinator-actor',
        taskKey: 'declared-synthesize-coordinator-actor',
        objective: 'Coordinator\'s own synthesize -- no longer excused once 2 actors bind it.',
        expectedOutputs: OUTPUTS,
      },
      {
        type: 'operation',
        as: 'synthesize-analyst',
        operationId: 'synthesize',
        targetActorId: 'analyst-actor',
        taskKey: 'declared-synthesize-analyst-actor',
        objective: 'Unrelated analyst synthesis pass -- no aggregation relationship at all.',
        expectedOutputs: OUTPUTS,
      },
    ],
  };
  const third = await runCoordinationUseCase(ctx, { requestObject: thirdRequest });
  assert.equal(third.closed, true, 'every actor, including both coordinator-actor and analyst-actor, is now complete, and the earlier validated consensus aggregation still stands');
  assert.equal(readManifest(coordinationId, opts).status, 'completed');
});

// ─── 1b. The gate reads the SESSION's definition, never the request's ──────

// A structurally identical protocol under a DIFFERENT id that declares no
// aggregation -- the cheapest bypass an ordinary caller has: resume the
// session naming this one instead.
const AGGREGATION_FREE_PROTOCOL_ID = 'test.coordination-protocol.aggregation-surface-free';

function writeAggregationFreeProtocol(tempDir) {
  const doc = protocolDoc({ withAggregation: false });
  doc.metadata = { id: AGGREGATION_FREE_PROTOCOL_ID, version: '1.0.0' };
  const dir = path.join(tempDir, '.fgos', 'coordination-protocols');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'aggregation-surface-free.json'), `${JSON.stringify(doc, null, 2)}\n`);
}

/** Rewrite the BOUND protocol document in place, under its own id. */
function rewriteBoundProtocol(tempDir, { withAggregation, version }) {
  const doc = protocolDoc({ withAggregation });
  doc.metadata = { id: PROTOCOL_ID, version };
  fs.writeFileSync(
    path.join(tempDir, '.fgos', 'coordination-protocols', 'aggregation-surface.json'),
    `${JSON.stringify(doc, null, 2)}\n`,
  );
}

test('a resume naming a DIFFERENT, aggregation-free protocolRef does NOT bypass the gate -- the close reads manifest.definitionRef, not the request', async () => {
  const coordinationId = 'coord_agg_surface_swap';
  const { ctx, opts, tempDir } = setup();
  writeAggregationFreeProtocol(tempDir);

  const first = await runCoordinationUseCase(ctx, { requestObject: dispatchRequest(coordinationId) });
  assert.equal(first.closed, false);
  assert.equal(readManifest(coordinationId, opts).definitionRef.id, PROTOCOL_ID);

  // The bypass, verbatim: same session, same driver, one disposition step
  // (which reaches no dispatch door), under an aggregation-free protocolRef.
  const swapped = resumeRequest(coordinationId, anAssignmentOf(coordinationId, opts));
  swapped.protocolRef = { id: AGGREGATION_FREE_PROTOCOL_ID };
  const second = await runCoordinationUseCase(ctx, { requestObject: swapped });

  assert.equal(second.closed, false);
  assert.match(second.closeRefusalReason, /declares completion\.aggregation, but session "coord_agg_surface_swap" has validated no aggregation/);
  assert.equal(readManifest(coordinationId, opts).status, 'active');
  assert.equal(replaySession(coordinationId, opts).aggregations.length, 0);
});

test('editing the bound protocol in place to drop completion.aggregation does NOT bypass the gate -- the close refuses the drifted definition', async () => {
  const coordinationId = 'coord_agg_surface_edited';
  const { ctx, opts, tempDir } = setup();

  const first = await runCoordinationUseCase(ctx, { requestObject: dispatchRequest(coordinationId) });
  assert.equal(first.closed, false);

  // Same protocol id, declaration dropped, version bumped -- the version pin
  // is what catches this, and it is checked BEFORE the (now absent)
  // declaration is read.
  rewriteBoundProtocol(tempDir, { withAggregation: false, version: '9.9.9' });

  const second = await runCoordinationUseCase(ctx, {
    requestObject: resumeRequest(coordinationId, anAssignmentOf(coordinationId, opts)),
  });

  assert.equal(second.closed, false);
  assert.match(second.closeRefusalReason, /was opened against definition "test\.coordination-protocol\.aggregation-surface@1\.0\.0", but the resolved definition is now version "9\.9\.9" -- refusing to close against a drifted definition/);
  assert.equal(readManifest(coordinationId, opts).status, 'active');
  assert.equal(replaySession(coordinationId, opts).aggregations.length, 0);
});

// ─── 2. Opt-in stays opt-in ────────────────────────────────────────────────

test('regression: a protocol that declares NO aggregation closes exactly as it did before the gate existed', async () => {
  const coordinationId = 'coord_agg_surface_optin';
  const { ctx, opts } = setup({ withAggregation: false });

  const data = await runCoordinationUseCase(ctx, { requestObject: dispatchRequestNoAggregation(coordinationId) });

  assert.equal(data.closed, true);
  assert.equal(data.closeRefusalReason, undefined);
  assert.equal(readManifest(coordinationId, opts).status, 'completed');
});

// P10.10 (Promotion And Closeout): TWO separate, previously-unguarded
// `loadCoordinationProtocol` calls in `run.mjs`, both fixed together
// because they are the SAME failure class at two different points of the
// SAME function:
//
// 1. The request-boundary actor-membership check (`else` branch, resolves
//    `request.protocolRef.id`) -- runs FIRST, unconditionally, on EVERY
//    declared-protocol request (open or resume), before the steps loop
//    even starts. NOT previously named by P10-KERNEL-FIX.md's own §5 Gap
//    text (which named only #2 below) -- found while investigating that
//    Gap, and fixed the same way, because it is reached earlier and more
//    often: any resolution failure here crashes before either fix below
//    ever runs, which is why it is proven FIRST.
// 2. `aggregationCloseParams` (P10-KERNEL-FIX.md §5's own N3/R2-MEDIUM-C
//    Gap, `run.mjs:236`-at-the-time) -- reads `manifest.definitionRef.id`
//    UNCONDITIONALLY, seven lines before its own check for whether an
//    aggregation is even declared, so a resolution failure used to throw a
//    raw, uncaught `FlowDefinitionError` for EVERY declared-protocol
//    session, not only ones declaring `completion.aggregation`.
//
// Both are pre-existing, fail safe (a session never wrongly closes), but
// never previously reached the SAME honest, correctly-attributed
// `CoordinationError`/`StoreError` refusal `classifySessionQuorum`
// (session-engine.mjs) already gives its own resolution-failure case.
// Fixed by wrapping each load in a try/catch, mirroring that pattern.
//
// Because fix #1 runs first and resolves `request.protocolRef.id` (not
// necessarily the SAME value as the session's own bound
// `manifest.definitionRef.id` -- this base `runCoordinationUseCase` door,
// unlike the pack gate, does not cross-check the two), a genuinely broken
// PROJECT-TIER REGISTRY DIRECTORY always fails BOTH resolutions together
// (`discoverCoordinationProtocols` scans the whole directory before
// filtering by id, so one malformed sibling file breaks every id in that
// tier, including whichever protocol fix #1 is asked to resolve) -- so the
// second test below isolates fix #2 specifically by making the session's
// own bound protocol NOT-FOUND (its file removed, not a corrupted sibling)
// while a genuinely different, still-resolvable protocol satisfies fix #1.
test('P10.10: a resolution failure at the request-boundary actor-membership check no longer crashes runCoordinationUseCase with a raw FlowDefinitionError', async () => {
  const coordinationId = 'coord_agg_surface_resolution_failure_request';
  const { ctx, tempDir } = setup({ withAggregation: false });

  // Break the registry BEFORE the very first call -- this check runs before
  // any session even opens.
  const registryDir = path.join(tempDir, '.fgos', 'coordination-protocols');
  fs.writeFileSync(path.join(registryDir, 'zz-broken-sibling.json'), '{ this is not valid json');

  await assert.rejects(
    () =>
      runCoordinationUseCase(ctx, {
        requestObject: {
          kind: 'declared-protocol',
          objective: 'Open under a broken protocol registry.',
          writerId: WRITER_ID,
          coordinationId,
          protocolRef: { id: PROTOCOL_ID },
          steps: [{ type: 'disposition', as: 'd', targetRef: coordinationId, disposition: 'noted', rationale: 'P10.10 resolution-failure regression probe.' }],
        },
      }),
    (err) =>
      err instanceof StoreError &&
      err.category === 'validation' &&
      /protocol "test\.coordination-protocol\.aggregation-surface" could not be resolved/.test(err.message) &&
      err.cause instanceof Error &&
      /zz-broken-sibling\.json/.test(err.message),
    'runCoordinationUseCase must refuse the request with an honest, attributable StoreError (naming the REAL broken registry file, not just the healthy requested protocol id) -- never a raw, uncaught FlowDefinitionError, and never silently discard the original cause',
  );
});

test('P10.10: a resolution failure at aggregationCloseParams specifically no longer crashes runCoordinationUseCase with a raw FlowDefinitionError -- it refuses explicitly, exactly like a version-drifted definition already does', async () => {
  const coordinationId = 'coord_agg_surface_resolution_failure_close';
  const { ctx, opts, tempDir } = setup({ withAggregation: false });

  // A second, genuinely resolvable protocol in the SAME project-tier
  // registry directory -- stays intact throughout. Its only job is to let
  // call 2's own request-boundary check (fix #1, above) succeed while the
  // SESSION's real bound protocol (below) is separately made unresolvable,
  // isolating fix #2's own catch specifically.
  const decoyId = 'test.coordination-protocol.aggregation-surface-decoy';
  fs.writeFileSync(
    path.join(tempDir, '.fgos', 'coordination-protocols', 'decoy.json'),
    `${JSON.stringify(
      {
        apiVersion: 'fgos.dev/v1alpha1',
        kind: 'FlowDefinition',
        metadata: { id: decoyId, version: '1.0.0' },
        spec: {
          profile: { kind: 'CoordinationProtocol' },
          roles: ['coordinator'],
          actors: [{ id: 'coordinator-actor', role: 'coordinator' }],
          operations: [{ id: 'noop', role: 'coordinator', result: { kind: 'advisory', evidenceRequired: 'reported' } }],
          graph: { entry: 'phase-noop', nodes: [{ id: 'phase-noop', operations: [{ ref: 'noop', actor: 'coordinator-actor' }], transitions: [] }] },
        },
      },
      null,
      2,
    )}\n`,
  );

  // Leave coordinator-actor's own required "review"/"synthesize" operations
  // undispatched -- the session stays genuinely "active" after call 1, so
  // call 2 (below) reaches the request door's own steps loop, not an
  // already-closed-session refusal.
  const call1 = await runCoordinationUseCase(ctx, {
    requestObject: {
      kind: 'declared-protocol',
      objective: 'Only the two independent research passes -- leave the coordinator phase for call 2.',
      writerId: WRITER_ID,
      coordinationId,
      protocolRef: { id: PROTOCOL_ID },
      steps: [
        { type: 'operation', as: 'research-a', operationId: 'research', targetActorId: 'researcher-a', taskKey: 'declared-research-researcher-a', objective: 'Independent research pass A.', expectedOutputs: OUTPUTS },
        { type: 'operation', as: 'research-b', operationId: 'research', targetActorId: 'researcher-b', taskKey: 'declared-research-researcher-b', objective: 'Independent research pass B.', expectedOutputs: OUTPUTS },
      ],
    },
  });
  assert.equal(call1.closed, false, 'sanity: coordinator-actor still owes review/synthesize -- the session must genuinely still be active');
  assert.equal(readManifest(coordinationId, opts).status, 'active');

  // Remove the SESSION's own bound protocol file entirely (not a corrupted
  // sibling -- that would also break the decoy's own resolution, since
  // `discoverCoordinationProtocols` scans the whole directory before
  // filtering by id). The decoy file is untouched and stays resolvable.
  fs.rmSync(path.join(tempDir, '.fgos', 'coordination-protocols', 'aggregation-surface.json'));

  // Call 2 claims the DECOY protocol (satisfies fix #1's own check -- it
  // resolves fine) with an empty actors[] (so the decoy's own, unrelated
  // actor set is never checked) and a "disposition"-only step (the one
  // step kind that never resolves any protocol at all -- run.mjs's own
  // header comment: `recordDriverDisposition` "resolves no binding,
  // materializes nothing, and has no FlowDefinition-aware counterpart...
  // to delegate to"). The session's REAL bound protocol
  // (`manifest.definitionRef.id`, still `PROTOCOL_ID`) is untouched by any
  // of this -- resume never lets a request's claimed `protocolRef.id`
  // override it. This isolates the failure to `aggregationCloseParams`'s
  // own call, run unconditionally after the steps loop.
  //
  // Coupling note: this isolation technique works ONLY because
  // `runCoordinationUseCase`'s base door does not cross-check a resumed
  // session's CLAIMED `protocolRef.id` (here, the decoy) against its REAL
  // bound `manifest.definitionRef.id` -- only the group-thinking pack gate
  // has that cross-check. If a future change hardens `run.mjs` with the
  // pack gate's own cross-check, this test's own call 2 will be refused
  // before it ever reaches `aggregationCloseParams`, and this specific
  // isolation will need to be redesigned, not just re-asserted.
  const call2 = await runCoordinationUseCase(ctx, {
    requestObject: {
      kind: 'declared-protocol',
      objective: 'Attempt to close a session whose own bound protocol has been removed.',
      writerId: WRITER_ID,
      coordinationId,
      protocolRef: { id: decoyId },
      actors: [],
      steps: [{ type: 'disposition', as: 'd', targetRef: coordinationId, disposition: 'noted', rationale: 'P10.10 resolution-failure regression probe.' }],
    },
  });

  assert.equal(call2.closed, false, 'a resolution failure must refuse the close, never silently succeed');
  assert.match(
    call2.closeRefusalReason ?? '',
    /could not be resolved -- refusing to close against an unresolvable definition/,
    'runCoordinationUseCase must surface the SAME honest, correctly-attributed refusal classifySessionQuorum already gives its own resolution-failure case -- never a raw, uncaught FlowDefinitionError',
  );
  assert.equal(readManifest(coordinationId, opts).status, 'active', 'a refused close must never leave the session anywhere but its pre-close status');
});

// ─── 3. `show` renders the whole validated record ──────────────────────────

const AGGREGATION_RENDER_FIELDS = [
  'aggregationId',
  'method',
  'outcome',
  'sourceResultRefs',
  'artifactRevisionRefs',
  'dissentRefs',
  'unresolvedContributionRefs',
  'missingActors',
  'failedActors',
  'unboundSourceOperationRefs',
  'assignmentId',
  'runId',
  'outputArtifactRef',
  'validatedBy',
  'ts',
];

test('show renders a validated aggregation whole: method, outcome, sources, dissent, unresolved items, failures/omissions, artifact revisions', async () => {
  const coordinationId = 'coord_agg_surface_show';
  const { ctx, opts } = setup();

  await runCoordinationUseCase(ctx, { requestObject: dispatchRequest(coordinationId) });
  validateSessionAggregation(coordinationId, { aggregationId: 'agg_surface_shown', validatedBy: validatedBy() }, opts);

  const shown = showCoordinationUseCase(opts, { id: coordinationId });

  assert.equal(shown.aggregations.length, 1);
  assert.deepEqual([...shown.ignoredAggregations], []);
  const record = shown.aggregations[0];
  // Every field is PRESENT, always -- an absent optional list renders as an
  // empty array, never dropped, so "named no dissent" can never read as
  // "dissent not surfaced".
  assert.deepEqual(Object.keys(record).sort(), [...AGGREGATION_RENDER_FIELDS].sort());
  assert.equal(record.aggregationId, 'agg_surface_shown');
  assert.equal(record.method, AGGREGATION_METHOD);
  assert.equal(record.outcome, 'consensus');
  assert.equal(record.sourceResultRefs.length, 2);
  assert.equal(record.artifactRevisionRefs.length, 2);
  assert.deepEqual(record.dissentRefs, []);
  assert.deepEqual(record.unresolvedContributionRefs, []);
  assert.deepEqual(record.missingActors, []);
  assert.deepEqual(record.failedActors, []);
  assert.deepEqual(record.unboundSourceOperationRefs, []);
  assert.deepEqual(record.validatedBy, validatedBy());
  assert.ok(typeof record.ts === 'string' && record.ts.length > 0);
});

test('show names the gaps a no-consensus record found -- a missing contributor is rendered, not swallowed', async () => {
  const coordinationId = 'coord_agg_surface_show_gaps';
  const { ctx, opts } = setup();

  // Only ONE of the two research bindings is dispatched, so the cohort is
  // half-answered: the operation contributes nothing and the record names the
  // contributor it never heard from.
  const request = dispatchRequest(coordinationId);
  request.steps = request.steps.filter((step) => step.as !== 'research-b');
  await runCoordinationUseCase(ctx, { requestObject: request });

  validateSessionAggregation(coordinationId, { aggregationId: 'agg_surface_gap', validatedBy: validatedBy() }, opts);
  const record = showCoordinationUseCase(opts, { id: coordinationId }).aggregations[0];

  assert.equal(record.outcome, 'no-consensus');
  assert.deepEqual(record.missingActors, ['researcher-b']);
});

test('show reports a post-terminal aggregation as NEUTRALIZED rather than hiding it -- same posture as a post-terminal authorization', async () => {
  const coordinationId = 'coord_agg_surface_post_terminal';
  const { ctx, opts } = setup({ withAggregation: false });

  await runCoordinationUseCase(ctx, { requestObject: dispatchRequestNoAggregation(coordinationId) });
  assert.equal(readManifest(coordinationId, opts).status, 'completed');

  // The store door refuses to validate into a closed session, so a
  // post-terminal record can only arrive by a raw append -- exactly the shape
  // replay neutralizes. One artifact revision pin per cited source, matching
  // what a real validation emits: this test is about post-terminal
  // neutralization, so the record must clear replay's own consensus
  // consistency checks rather than fail one of them for an unrelated reason.
  const { eventsPath } = resolveSessionPaths(coordinationId, opts);
  const sourceRefs = replaySession(coordinationId, opts).results.map((entry) => entry.assignmentId);
  fs.appendFileSync(
    eventsPath,
    `${JSON.stringify({
      seq: 9001,
      ts: new Date().toISOString(),
      v: '1',
      type: 'aggregation-validated',
      payload: {
        aggregationId: 'agg_surface_late',
        method: AGGREGATION_METHOD,
        outcome: 'consensus',
        sourceResultRefs: sourceRefs,
        artifactRevisionRefs: sourceRefs.map((ref, i) => `artifact://${ref}@rev-${i}`),
        validatedBy: validatedBy(),
      },
    })}\n`,
  );

  const shown = showCoordinationUseCase(opts, { id: coordinationId });
  assert.deepEqual([...shown.aggregations], []);
  assert.equal(shown.ignoredAggregations.length, 1);
  assert.equal(shown.ignoredAggregations[0].aggregationId, 'agg_surface_late');
  assert.deepEqual(Object.keys(shown.ignoredAggregations[0]).sort(), [...AGGREGATION_RENDER_FIELDS].sort());
});

test('show on a session with no aggregation at all reports empty lists, not a missing field', async () => {
  const coordinationId = 'coord_agg_surface_show_none';
  const { ctx, opts } = setup({ withAggregation: false });

  await runCoordinationUseCase(ctx, { requestObject: dispatchRequest(coordinationId) });
  const shown = showCoordinationUseCase(opts, { id: coordinationId });

  assert.deepEqual([...shown.aggregations], []);
  assert.deepEqual([...shown.ignoredAggregations], []);
});

// ─── 4. Aggregation never upgrades a RunResult ─────────────────────────────

test('a consensus aggregation NEVER upgrades RunResult confidence: every settled Assignment keeps its own recorded status/confidence, before and after the close', async () => {
  const coordinationId = 'coord_agg_surface_confidence';
  const { ctx, opts } = setup();

  const first = await runCoordinationUseCase(ctx, { requestObject: dispatchRequest(coordinationId) });
  const beforeDisk = runResultsOnDisk(coordinationId, opts);
  const beforeReported = first.steps.map((step) => ({ as: step.as, status: step.status, confidence: step.confidence }));
  assert.equal(Object.keys(beforeDisk).length, 3);

  const validated = validateSessionAggregation(coordinationId, { aggregationId: 'agg_surface_conf', validatedBy: validatedBy() }, opts);
  assert.equal(validated.outcome, 'consensus');
  // The verdict is recorded and nothing beneath it moved.
  assert.deepEqual(runResultsOnDisk(coordinationId, opts), beforeDisk);

  const second = await runCoordinationUseCase(ctx, {
    requestObject: resumeRequest(coordinationId, anAssignmentOf(coordinationId, opts)),
  });
  assert.equal(second.closed, true);

  // Still identical after the terminal transition the consensus permitted:
  // a cognitive outcome is terminal INPUT, never a rewrite of the evidence it
  // was derived from.
  assert.deepEqual(runResultsOnDisk(coordinationId, opts), beforeDisk);
  // The confidences the request surface reported are the same ones still on
  // disk -- the aggregation added a verdict beside the evidence, not over it.
  for (const entry of beforeReported) {
    assert.ok(entry.confidence !== undefined, `step "${entry.as}" reported no confidence`);
  }
  assert.deepEqual(
    [...new Set(Object.values(beforeDisk).map((r) => r.confidence))].sort(),
    [...new Set(beforeReported.map((r) => r.confidence))].sort(),
  );
});

// ─── CLI/headless parity over one full aggregation scenario ────────────────

// Ids and timestamps are the only legitimate difference between two runs of
// the same scenario in two workspaces. Every `asgn_...` token is mapped to a
// stable placeholder in first-appearance order and every ISO timestamp is
// collapsed, so a genuine behavioral divergence -- a different refusal, a
// different quorum, a dropped field -- still fails the comparison.
function normalize(value, ids = new Map()) {
  if (typeof value === 'string') {
    return value
      .replace(/asgn_[A-Za-z0-9]+/g, (match) => {
        if (!ids.has(match)) ids.set(match, `<asgn-${ids.size}>`);
        return ids.get(match);
      })
      .replace(/\d{4}-\d{2}-\d{2}T[\d:.]+Z/g, '<ts>');
  }
  if (Array.isArray(value)) return value.map((entry) => normalize(entry, ids));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [key, normalize(entry, ids)]));
  }
  return value;
}

function cliRun(tempDir, requestObject, name) {
  const requestPath = path.join(tempDir, `${name}.json`);
  fs.writeFileSync(requestPath, `${JSON.stringify(requestObject, null, 2)}\n`);
  const spawned = spawnSync(process.execPath, [FGOS_CLI, 'coordination', 'run', '--file', requestPath], { cwd: tempDir, encoding: 'utf8' });
  assert.equal(spawned.status, 0, `fgos coordination run failed: ${spawned.stderr}`);
  return JSON.parse(spawned.stdout).data;
}

function cliShow(tempDir, coordinationId) {
  const spawned = spawnSync(process.execPath, [FGOS_CLI, 'coordination', 'show', coordinationId, '--json'], { cwd: tempDir, encoding: 'utf8' });
  assert.equal(spawned.status, 0, `fgos coordination show failed: ${spawned.stderr}`);
  return JSON.parse(spawned.stdout).data;
}

function initWorkspace() {
  const tempDir = mkTempDir();
  const spawned = spawnSync(process.execPath, [FGOS_CLI, 'init'], { cwd: tempDir, encoding: 'utf8' });
  assert.equal(spawned.status, 0, `fgos init failed: ${spawned.stderr}`);
  writeProtocol(tempDir, { withAggregation: true });
  const runnerConfig = fakeRunnerConfig(tempDir);
  return { tempDir, opts: { cwd: tempDir, repoRoot: tempDir }, runnerConfig };
}

test('CLI/headless parity over a full aggregation scenario: refused close, validation, resumed close, and the rendered record all match across both doors', async () => {
  const coordinationId = 'coord_agg_surface_parity';

  // Door 1: a genuinely spawned `fgos coordination run --file` subprocess.
  const cli = initWorkspace();
  const cliFirst = cliRun(cli.tempDir, dispatchRequest(coordinationId), 'dispatch');
  validateSessionAggregation(coordinationId, { aggregationId: 'agg_parity', validatedBy: validatedBy() }, cli.opts);
  const cliSecond = cliRun(cli.tempDir, resumeRequest(coordinationId, anAssignmentOf(coordinationId, cli.opts)), 'resume');
  const cliShown = cliShow(cli.tempDir, coordinationId);

  // Door 2: the headless adapter, in-process, same request objects.
  const headless = initWorkspace();
  const headlessCtx = { cwd: headless.tempDir, repoRoot: headless.tempDir, runnerConfig: headless.runnerConfig };
  const headlessFirst = await runCoordinationHeadless(dispatchRequest(coordinationId), { ctx: headlessCtx });
  validateSessionAggregation(coordinationId, { aggregationId: 'agg_parity', validatedBy: validatedBy() }, headless.opts);
  const headlessSecond = await runCoordinationHeadless(resumeRequest(coordinationId, anAssignmentOf(coordinationId, headless.opts)), { ctx: headlessCtx });
  const headlessShown = showCoordinationUseCase(headless.opts, { id: coordinationId });

  // The refusal both doors produced is the aggregation gate's, verbatim.
  assert.equal(cliFirst.closed, false);
  assert.equal(headlessFirst.closed, false);
  assert.match(cliFirst.closeRefusalReason, /declares completion\.aggregation, but session ".*" has validated no aggregation/);

  // The two `run` comparisons are the genuine two-door ones: a spawned
  // subprocess against an in-process adapter, two separate workspaces.
  assert.deepEqual(normalize(headlessFirst), normalize(cliFirst));
  assert.deepEqual(normalize(headlessSecond), normalize(cliSecond));
  // The `show` comparison is deliberately weaker, and is not claimed as a
  // two-door proof: `runCoordinationHeadless` exposes no `show` surface of its
  // own, and the CLI's `show` is a thin wrapper over the same
  // `showCoordinationUseCase` this line calls directly. What it does prove is
  // that the two workspaces reached identical rendered state and that the
  // CLI's `--json` envelope round-trip drops nothing -- worth asserting,
  // but it is not a second implementation of `show`.
  assert.deepEqual(normalize(headlessShown), normalize(cliShown));

  // And the scenario genuinely reached the far end on both doors.
  assert.equal(cliSecond.closed, true);
  assert.equal(headlessSecond.closed, true);
  assert.equal(cliShown.aggregations[0].outcome, 'consensus');
  assert.equal(headlessShown.aggregations[0].outcome, 'consensus');
});
