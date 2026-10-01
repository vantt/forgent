// Deferred Findings & Architectural Debt Verification Probes
//
// Invariants verified / probed:
// 1. Unlinked in-flight or retried node on resume outcome taxonomy.
// 2. Driver disposition on caveated findings vs closure refusal.
// 3. Caveated session cannot close or discharge caveat and requires cancellation and recheck in new session.
// 4. Distinct node cwds allow cell-closed disposition without false positive shared-cwd caveats.
// 5. Node cwd attribution matrix (F02: shared cwd caveat, reverse order, multiple attempts, ownership validation, sibling isolation).
// 6. Scheduler outcome taxonomy matrix (F03: concurrency-cap deferral & retry, non-cap refusal, unlinked/materialized, cold resume).

import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  createSessionAssignment,
  resolveSessionPaths,
  linkResult,
  recordDriverDisposition,
  recordRunRetry,
  readManifestRaw,
} from '../../src/runner/coordination/store.mjs';
import { readEvents, appendEvent } from '../../src/state/events.mjs';
import {
  computeDagSharedCwdCaveats,
} from '../../src/runner/coordination/dag-declaration.mjs';
import {
  CoordinationError,
  SCHEMA_VERSION_3,
} from '../../src/runner/coordination/schema.mjs';
import { openDeclaredProtocolSession, cancelSession, resumeSession, closeSessionByQuorum } from '../../src/runner/coordination/session-engine.mjs';
import { runCoordinationUseCase } from '../../src/verbs/coordination/run.mjs';
import { showCoordinationUseCase } from '../../src/verbs/coordination/show.mjs';
import { closeCoordinationUseCase } from '../../src/verbs/coordination/close.mjs';
import { compileDagRequest } from '../../src/verbs/coordination/dag-request-compiler.mjs';
import { resolveNodeCwd, scheduleDagSteps } from '../../src/verbs/coordination/dag-scheduler.mjs';
import { validateCoordinationRequest } from '../../src/verbs/coordination/schema.mjs';
import { runCoordinationHeadless, showCoordinationHeadless } from '../../src/runner/coordination/headless-adapter.mjs';
import { executeUnderActionPrecondition } from '../../src/runner/coordination/action-precondition.mjs';

const DEFINITION_ID = 'test.coordination-protocol.master-loop-driver-steps';
const WRITER_ID = 'master-coordinator-1';

const tempDirs = [];
after(() => {
  for (const dir of tempDirs) {
    try {
      fs.rmSync(dir, { recursive: true, force: true });
    } catch {}
  }
});

function mkTempDir(prefix = 'fgos-dag-probes-') {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

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
    const prompt = process.argv[2] ?? '';
    const assignmentId = prompt.match(/^Assignment: (.+)$/m)?.[1];
    if (!assignmentId) throw new Error('fake executor needs its own Assignment prompt');
    const runsDir = path.join(process.cwd(), '.fgos', 'assignments', assignmentId, 'runs');
    const run = fs.readdirSync(runsDir).sort().at(-1);
    const runDir = path.join(runsDir, run);
    fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Report\\nValidated.\\n');
    fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'Validated.' }));
    process.stdout.write('Validated.\\n');
    `,
  );
  return { executor: { allowCrossProvider: true, command: process.execPath, args: [executorScript, '{prompt}'] }, modelPolicies: { claude: { standard: 'test-model', nano: 'test-model', mini: 'test-model', advanced: 'test-model', flagship: 'test-model', frontier: 'test-model' } }, rigorToTier: { low: 'nano', standard: 'standard', high: 'flagship', critical: 'frontier' }, timeoutMs: 10000 };
}

function produceStep(overrides = {}) {
  return {
    type: 'operation',
    as: 'produce',
    operationId: 'produce-candidate',
    targetActorId: 'doer',
    objective: 'Produce candidate code.',
    expectedOutputs: ['agent-result.json (status, summary)'],
    ...overrides,
  };
}

function reviewStep(overrides = {}) {
  return {
    type: 'operation',
    as: 'review',
    operationId: 'review-candidate',
    targetActorId: 'reviewer',
    objective: 'Review candidate code.',
    expectedOutputs: ['agent-result.json (status, summary)'],
    ...overrides,
  };
}

function defaultActors() {
  return [
    { id: 'doer' },
    { id: 'reviewer' },
    { id: 'red-team' },
    { id: 'fixer' },
  ];
}

function makeRequest(overrides = {}) {
  return {
    dag: true,
    kind: 'declared-protocol',
    objective: 'DAG probes test.',
    writerId: WRITER_ID,
    protocolRef: { id: DEFINITION_ID },
    actors: defaultActors(),
    steps: [produceStep(), reviewStep({ contextRefs: ['$ref:produce'] })],
    ...overrides,
  };
}

// --------------------------------------------------------------------------
// 1. Unlinked node on resume outcome taxonomy
// --------------------------------------------------------------------------

test('DAG probes: unlinked node on resume carries accurate non-deferred outcome taxonomy and projection parity', async () => {
  const tempDir = mkTempDir();
  writeFixture(tempDir);
  const ctx = { cwd: tempDir, repoRoot: tempDir, runnerConfig: fakeExecutor(tempDir) };
  const coordinationId = 'unlinked-node-taxonomy';

  const decl = compileDagRequest(validateCoordinationRequest(makeRequest({ coordinationId })));
  openDeclaredProtocolSession(
    {
      coordinationId,
      objective: 'Unlinked taxonomy test',
      writerId: WRITER_ID,
      definitionId: DEFINITION_ID,
      schemaVersion: SCHEMA_VERSION_3,
      dagDeclaration: decl,
    },
    { cwd: tempDir, repoRoot: tempDir },
  );

  // Materialize an assignment for 'produce', leaving it unlinked (in-flight outside invocation)
  createSessionAssignment(
    {
      coordinationId,
      taskKey: 'task-produce',
      contract: {
        objective: 'Produce',
        contextRefs: [],
        constraints: [],
        expectedOutputs: ['agent-result.json'],
        mutation: 'read-only',
        evidence: { required: 'reported' },
        role: 'doer',
        budget: { timeoutMs: 10000, maxRuns: 1 },
      },
      caller: { writerId: WRITER_ID },
      dagNodeId: 'node-produce',
    },
    { cwd: tempDir, repoRoot: tempDir },
  );

  // Projection under showCoordinationUseCase reports materialized
  const shown = showCoordinationUseCase({ cwd: tempDir, repoRoot: tempDir }, { id: coordinationId });
  const produceShown = shown.dag.nodes.find((n) => n.nodeId === 'node-produce');
  assert.equal(produceShown.schedulerOutcome, 'materialized');

  // In intended contract: unlinked node in-flight on resume should NOT be labeled 'deferred'
  // (deferred is conceptually reserved for capacity refusals / concurrency-cap).
  const runResult = await runCoordinationUseCase(ctx, { requestObject: makeRequest({ coordinationId }) });
  const produceRun = runResult.steps.find((s) => s.as === 'produce');

  assert.equal(produceRun.schedulerOutcome, 'materialized');
  assert.notEqual(produceRun.schedulerOutcome, 'deferred', 'unlinked in-flight node should not be labeled deferred');
  assert.equal(produceRun.authoritativeSettled, false);

  // Descendant step (review) depends on produce, which is not settled: review must NOT be admitted or deferred
  const reviewRun = runResult.steps.find((s) => s.as === 'review');
  assert.equal(reviewRun.schedulerOutcome, 'blocked');
  assert.deepEqual(reviewRun.blockedBy, ['node-produce']);
  assert.notEqual(reviewRun.schedulerOutcome, 'deferred');

  // Headless projection parity:
  const headlessShow = showCoordinationHeadless(coordinationId, { ctx: { cwd: tempDir, repoRoot: tempDir } });
  const produceHeadless = headlessShow.dag.nodes.find((n) => n.nodeId === 'node-produce');
  assert.equal(produceHeadless.schedulerOutcome, 'materialized');
});

// --------------------------------------------------------------------------
// 2. Driver disposition on caveated findings vs closure refusal
// --------------------------------------------------------------------------

test('DAG probes: driver disposition on caveated findings refuses accepted and cell-closed dispositions at store level', async () => {
  const tempDir = mkTempDir();
  writeFixture(tempDir);
  const ctx = { cwd: tempDir, repoRoot: tempDir, runnerConfig: fakeExecutor(tempDir) };
  const coordinationId = 'disposition-caveats';
  const { eventsPath } = resolveSessionPaths(coordinationId, { cwd: tempDir, repoRoot: tempDir });

  // Run a session with concurrent read-only peers sharing cwd (creating shared-cwd non-attributable caveats)
  const req = makeRequest({
    coordinationId,
    steps: [
      produceStep(),
      reviewStep({ as: 'review-1', dependsOn: ['produce'] }),
      { ...reviewStep({ as: 'review-2', targetActorId: 'red-team', operationId: 'red-team-candidate', dependsOn: ['produce'] }) },
    ],
  });

  const runResult = await runCoordinationUseCase(ctx, { requestObject: req });
  assert.equal(runResult.caveated, true);
  const review1 = runResult.steps.find((s) => s.as === 'review-1');
  assert.equal(review1.caveated, true);
  const asgnId = review1.assignmentId;

  const eventCountBefore = readEvents(eventsPath).length;

  // 1. All accept-meaning variants (casing, whitespace, synonyms) MUST be refused by the disposition allow-list gate
  const acceptVariants = [
    'accepted',
    'accept',
    'cell-closed',
    'Accepted',
    'ACCEPTED',
    ' accepted ',
    'approved',
    'partially-accepted',
    'closed',
    'resolved',
    'cell-close',
  ];

  for (const d of acceptVariants) {
    assert.throws(
      () =>
        recordDriverDisposition(
          coordinationId,
          {
            targetRef: asgnId,
            disposition: d,
            rationale: `driver accepting caveat finding variant: ${d}`,
            evidenceRefs: [],
            authorizedBy: { type: 'driver', id: WRITER_ID },
          },
          { cwd: tempDir, repoRoot: tempDir },
        ),
      (err) => err instanceof CoordinationError && err.category === 'validation' && /cannot record .* disposition on caveated evidence/.test(err.message),
      `store must refuse "${d}" disposition on unadjudicated caveated evidence`,
    );
  }

  // Verify that NO events were appended to the log when validation refused
  const eventCountAfterRefusals = readEvents(eventsPath).length;
  assert.equal(eventCountAfterRefusals, eventCountBefore, 'no event may be appended when disposition validation fails closed');

  // 2. Explicitly non-accepting dispositions (rejected, deferred) are permitted on caveated evidence
  const rejectedDisp = recordDriverDisposition(
    coordinationId,
    {
      targetRef: asgnId,
      disposition: 'rejected',
      rationale: 'driver rejecting caveat finding',
      evidenceRefs: [],
      authorizedBy: { type: 'driver', id: WRITER_ID },
    },
    { cwd: tempDir, repoRoot: tempDir },
  );
  assert.equal(rejectedDisp.appended, true, 'rejected disposition must be permitted on caveated evidence');
  assert.equal(readEvents(eventsPath).length, eventCountBefore + 1);

  // Stale action precondition protection:
  const dummyActionKey = 'sha256:' + '0'.repeat(64);
  assert.throws(
    () => executeUnderActionPrecondition(
      coordinationId,
      {
        actionKey: dummyActionKey,
        kind: 'close',
        authorizedBy: { type: 'driver', id: WRITER_ID },
        writerId: WRITER_ID,
      },
      () => {
        throw new Error('should not execute');
      },
      { cwd: tempDir, repoRoot: tempDir },
    ),
    (err) => err.category === 'stale-action-key',
    'stale action key must be refused before mutation',
  );
});

// --------------------------------------------------------------------------
// 3. Caveated session cannot close or discharge caveat and requires cancellation and recheck
// --------------------------------------------------------------------------

test('DAG probes: caveated session cannot close or discharge caveat and requires cancellation and recheck in new session', async () => {
  const tempDir = mkTempDir();
  writeFixture(tempDir);
  const ctx = { cwd: tempDir, repoRoot: tempDir, runnerConfig: fakeExecutor(tempDir) };
  const coordinationId = 'probe-lifecycle-policy';

  // Step 1: Run session with concurrent read-only peers sharing cwd
  const req = makeRequest({
    coordinationId,
    steps: [
      produceStep(),
      reviewStep({ as: 'review-1', dependsOn: ['produce'] }),
      { ...reviewStep({ as: 'review-2', targetActorId: 'red-team', operationId: 'red-team-candidate', dependsOn: ['produce'] }) },
    ],
  });

  const runResult = await runCoordinationUseCase(ctx, { requestObject: req });
  assert.equal(runResult.caveated, true);
  assert.equal(runResult.dag.counts.recheckRequired, 2);

  // Step 2: Show projection confirms recheck-required status and caveats
  const shown = showCoordinationUseCase({ cwd: tempDir, repoRoot: tempDir }, { id: coordinationId });
  const review1Node = shown.dag.nodes.find((n) => n.nodeId === 'node-review-1');
  const review2Node = shown.dag.nodes.find((n) => n.nodeId === 'node-review-2');
  assert.equal(review1Node.schedulerOutcome, 'recheck-required');
  assert.equal(review2Node.schedulerOutcome, 'recheck-required');
  assert.equal(review1Node.caveated, true);
  assert.equal(review2Node.caveated, true);

  // Step 3: Explicit close attempt is refused
  const closeRes = await closeCoordinationUseCase(ctx, {
    requestObject: {
      kind: 'close',
      coordinationId,
      authorizedBy: { type: 'driver', id: WRITER_ID },
      reason: 'Policy test closure attempt',
    },
  });
  assert.equal(closeRes.closed, false);
  assert.match(closeRes.closeRefusalReason, /recheck-required/);

  // Step 4: Policy rule: caveated session cannot discharge caveat. It must be cancelled.
  cancelSession(coordinationId, { reason: 'Cancelled due to non-attributable shared-cwd caveats' }, { cwd: tempDir, repoRoot: tempDir });
  const shownAfterCancel = showCoordinationUseCase({ cwd: tempDir, repoRoot: tempDir }, { id: coordinationId });
  assert.equal(shownAfterCancel.status, 'cancelled');

  // Verify that session status is cancelled and remains terminal
  const resubmitted = await runCoordinationUseCase(ctx, { requestObject: req });
  assert.equal(resubmitted.status, 'cancelled');

  // Step 5: Run the recheck cleanly in a separate, isolated session without concurrency caveats
  const cleanCoordinationId = 'probe-clean-recheck';
  const cleanReq = makeRequest({
    coordinationId: cleanCoordinationId,
    steps: [
      produceStep(),
      reviewStep({ dependsOn: ['produce'] }),
    ],
  });

  const cleanRunResult = await runCoordinationUseCase(ctx, { requestObject: cleanReq });
  assert.equal(cleanRunResult.caveated, undefined);
  assert.equal(cleanRunResult.dag.counts.recheckRequired, 0);

  const cleanShown = showCoordinationUseCase({ cwd: tempDir, repoRoot: tempDir }, { id: cleanCoordinationId });
  assert.equal(cleanShown.dag.nodes.every((n) => !n.caveated), true);
});

// --------------------------------------------------------------------------
// 4. Distinct node cwds allow cell-closed and accepted disposition without false positive caveats
// --------------------------------------------------------------------------

test('DAG probes: distinct node cwds allow cell-closed and accepted disposition without false positive shared-cwd caveats', () => {
  const tempDir = mkTempDir();
  writeFixture(tempDir);
  const fgosDir = path.join(tempDir, '.fgos');
  const coordinationId = 'probe-distinct-cwd-cell-closed';

  const cwdA = path.join(tempDir, 'worktree-A');
  const cwdB = path.join(tempDir, 'worktree-B');
  fs.mkdirSync(cwdA, { recursive: true });
  fs.mkdirSync(cwdB, { recursive: true });

  const decl = {
    nodes: [
      { id: 'node-A', displayLabel: 'produce', dependsOn: [], semantics: { mutation: 'read-only' } },
      { id: 'node-B', displayLabel: 'review', dependsOn: [], semantics: { mutation: 'read-only' } },
    ],
    requestFingerprint: 'fp-test',
  };

  openDeclaredProtocolSession(
    {
      coordinationId,
      objective: 'Distinct cwd isolation test',
      writerId: WRITER_ID,
      definitionId: DEFINITION_ID,
      schemaVersion: SCHEMA_VERSION_3,
      dagDeclaration: decl,
    },
    { cwd: tempDir, repoRoot: tempDir },
  );

  // Create assignment for node-A with run in cwdA
  const asgnA = createSessionAssignment(
    {
      coordinationId,
      taskKey: 'task-A',
      contract: { objective: 'A', contextRefs: [], constraints: [], expectedOutputs: ['agent-result.json'], mutation: 'read-only', evidence: { required: 'reported' }, role: 'doer', budget: { timeoutMs: 10000, maxRuns: 1 } },
      caller: { writerId: WRITER_ID },
      dagNodeId: 'node-A',
    },
    { cwd: tempDir, repoRoot: tempDir },
  );
  const runDirA = path.join(fgosDir, 'assignments', asgnA.assignmentId, 'runs', '01');
  fs.mkdirSync(runDirA, { recursive: true });
  fs.writeFileSync(path.join(runDirA, 'run.json'), JSON.stringify({ cwd: cwdA }));
  fs.writeFileSync(path.join(runDirA, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'A' }));
  linkResult(coordinationId, { assignmentId: asgnA.assignmentId, runId: `run_${asgnA.assignmentId}_01` }, { cwd: tempDir, repoRoot: tempDir });

  // Create assignment for node-B with run in cwdB (DISTINCT from cwdA)
  const asgnB = createSessionAssignment(
    {
      coordinationId,
      taskKey: 'task-B',
      contract: { objective: 'B', contextRefs: [], constraints: [], expectedOutputs: ['agent-result.json'], mutation: 'read-only', evidence: { required: 'reported' }, role: 'reviewer', budget: { timeoutMs: 10000, maxRuns: 1 } },
      caller: { writerId: WRITER_ID },
      dagNodeId: 'node-B',
    },
    { cwd: tempDir, repoRoot: tempDir },
  );
  const runDirB = path.join(fgosDir, 'assignments', asgnB.assignmentId, 'runs', '01');
  fs.mkdirSync(runDirB, { recursive: true });
  fs.writeFileSync(path.join(runDirB, 'run.json'), JSON.stringify({ cwd: cwdB }));
  fs.writeFileSync(path.join(runDirB, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'B' }));
  linkResult(coordinationId, { assignmentId: asgnB.assignmentId, runId: `run_${asgnB.assignmentId}_01` }, { cwd: tempDir, repoRoot: tempDir });

  // 1. cell-closed disposition for node-B
  const resB = recordDriverDisposition(
    coordinationId,
    {
      targetRef: asgnB.assignmentId,
      disposition: 'cell-closed',
      rationale: 'closing cell for isolated nodes',
      evidenceRefs: [],
      authorizedBy: { type: 'driver', id: WRITER_ID },
    },
    { cwd: tempDir, repoRoot: tempDir },
  );
  assert.equal(resB.appended, true, 'cell-closed disposition must succeed when nodes have distinct cwds');

  // Idempotent replay of cell-closed
  const replayB = recordDriverDisposition(
    coordinationId,
    {
      targetRef: asgnB.assignmentId,
      disposition: 'cell-closed',
      rationale: 'closing cell for isolated nodes',
      evidenceRefs: [],
      authorizedBy: { type: 'driver', id: WRITER_ID },
    },
    { cwd: tempDir, repoRoot: tempDir },
  );
  assert.equal(replayB.appended, false, 'idempotent replay of cell-closed must not append a duplicate event');

  // 2. accepted disposition for node-A
  const resA = recordDriverDisposition(
    coordinationId,
    {
      targetRef: asgnA.assignmentId,
      disposition: 'accepted',
      rationale: 'accepting isolated node A',
      evidenceRefs: [],
      authorizedBy: { type: 'driver', id: WRITER_ID },
    },
    { cwd: tempDir, repoRoot: tempDir },
  );
  assert.equal(resA.appended, true, 'accepted disposition must succeed when nodes have distinct cwds');

  // Idempotent replay of accepted
  const replayA = recordDriverDisposition(
    coordinationId,
    {
      targetRef: asgnA.assignmentId,
      disposition: 'accepted',
      rationale: 'accepting isolated node A',
      evidenceRefs: [],
      authorizedBy: { type: 'driver', id: WRITER_ID },
    },
    { cwd: tempDir, repoRoot: tempDir },
  );
  assert.equal(replayA.appended, false, 'idempotent replay of accepted must not append a duplicate event');

  // 3. Evidence changes after acceptance: node-B now shares cwdA
  const eventsPath = path.join(fgosDir, 'coordination', 'sessions', coordinationId, 'events.jsonl');
  const eventCountBeforeChange = readEvents(eventsPath).length;
  fs.writeFileSync(path.join(runDirB, 'run.json'), JSON.stringify({ cwd: cwdA }));
  assert.throws(
    () =>
      recordDriverDisposition(
        coordinationId,
        {
          targetRef: asgnA.assignmentId,
          disposition: 'accepted',
          rationale: 'replay after evidence changed to shared cwd',
          evidenceRefs: [],
          authorizedBy: { type: 'driver', id: WRITER_ID },
        },
        { cwd: tempDir, repoRoot: tempDir },
      ),
    (err) => err instanceof CoordinationError && err.category === 'validation' && /cannot record .* disposition on caveated evidence/.test(err.message),
    'accept/replay after evidence changed to shared cwd must fail closed',
  );
  assert.equal(readEvents(eventsPath).length, eventCountBeforeChange, 'no event appended when replay fails closed on altered evidence');
});

// --------------------------------------------------------------------------
// 5. F02: Node CWD attribution matrix
// --------------------------------------------------------------------------

test('DAG probes: F02 node cwd attribution matrix (shared cwd caveat, reverse order, multiple attempts, ownership validation, sibling isolation)', () => {
  const tempDir = mkTempDir();
  writeFixture(tempDir);
  const fgosDir = path.join(tempDir, '.fgos');
  const coordinationId = 'probe-f02-matrix';

  const cwdShared = path.join(tempDir, 'shared-worktree');
  const cwdA = path.join(tempDir, 'worktree-A');
  const cwdB = path.join(tempDir, 'worktree-B');
  fs.mkdirSync(cwdShared, { recursive: true });
  fs.mkdirSync(cwdA, { recursive: true });
  fs.mkdirSync(cwdB, { recursive: true });

  const decl = {
    nodes: [
      { id: 'node-A', displayLabel: 'produce', dependsOn: [], semantics: { mutation: 'read-only' } },
      { id: 'node-B', displayLabel: 'review', dependsOn: [], semantics: { mutation: 'read-only' } },
    ],
    requestFingerprint: 'fp-f02',
  };

  openDeclaredProtocolSession(
    {
      coordinationId,
      objective: 'F02 attribution matrix',
      writerId: WRITER_ID,
      definitionId: DEFINITION_ID,
      schemaVersion: SCHEMA_VERSION_3,
      dagDeclaration: decl,
    },
    { cwd: tempDir, repoRoot: tempDir },
  );

  // Subcase 1: Sibling node isolation & reversed assignment order in manifest:
  // Create assignment for node-B first, then node-A
  const asgnB = createSessionAssignment(
    {
      coordinationId,
      taskKey: 'task-B',
      contract: { objective: 'B', contextRefs: [], constraints: [], expectedOutputs: ['agent-result.json'], mutation: 'read-only', evidence: { required: 'reported' }, role: 'reviewer', budget: { timeoutMs: 10000, maxRuns: 1 } },
      caller: { writerId: WRITER_ID },
      dagNodeId: 'node-B',
    },
    { cwd: tempDir, repoRoot: tempDir },
  );
  const asgnA = createSessionAssignment(
    {
      coordinationId,
      taskKey: 'task-A',
      contract: { objective: 'A', contextRefs: [], constraints: [], expectedOutputs: ['agent-result.json'], mutation: 'read-only', evidence: { required: 'reported' }, role: 'doer', budget: { timeoutMs: 10000, maxRuns: 1 } },
      caller: { writerId: WRITER_ID },
      dagNodeId: 'node-A',
    },
    { cwd: tempDir, repoRoot: tempDir },
  );

  // Node A has multiple attempts: attempt 01 with cwdShared, attempt 02 with cwdA
  const runDirA1 = path.join(fgosDir, 'assignments', asgnA.assignmentId, 'runs', '01');
  const runDirA2 = path.join(fgosDir, 'assignments', asgnA.assignmentId, 'runs', '02');
  fs.mkdirSync(runDirA1, { recursive: true });
  fs.mkdirSync(runDirA2, { recursive: true });
  fs.writeFileSync(path.join(runDirA1, 'run.json'), JSON.stringify({ cwd: cwdShared }));
  fs.writeFileSync(path.join(runDirA1, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'A1' }));
  fs.writeFileSync(path.join(runDirA2, 'run.json'), JSON.stringify({ cwd: cwdA }));
  fs.writeFileSync(path.join(runDirA2, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'A2' }));
  linkResult(coordinationId, { assignmentId: asgnA.assignmentId, runId: `run_${asgnA.assignmentId}_02` }, { cwd: tempDir, repoRoot: tempDir });

  // Node B has a run in cwdB (distinct from cwdA)
  const runDirB = path.join(fgosDir, 'assignments', asgnB.assignmentId, 'runs', '01');
  fs.mkdirSync(runDirB, { recursive: true });
  fs.writeFileSync(path.join(runDirB, 'run.json'), JSON.stringify({ cwd: cwdB }));
  fs.writeFileSync(path.join(runDirB, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'B' }));
  linkResult(coordinationId, { assignmentId: asgnB.assignmentId, runId: `run_${asgnB.assignmentId}_01` }, { cwd: tempDir, repoRoot: tempDir });

  // With reversed manifest order (asgnB is first, asgnA is second) and multiple attempts (01 vs 02 for node-A),
  // node-A's latest cwd is cwdA and node-B's cwd is cwdB.
  // Neither node borrows the other's cwd, and attempt 02 takes precedence over attempt 01.
  const res = recordDriverDisposition(
    coordinationId,
    {
      targetRef: asgnB.assignmentId,
      disposition: 'cell-closed',
      rationale: 'F02 clean resolution',
      evidenceRefs: [],
      authorizedBy: { type: 'driver', id: WRITER_ID },
    },
    { cwd: tempDir, repoRoot: tempDir },
  );
  assert.equal(res.appended, true);

  // Subcase 2: Genuine shared cwd caveat triggers failure:
  // Overwrite node-B's run.json to use cwdA (so both genuinely share cwdA)
  fs.writeFileSync(path.join(runDirB, 'run.json'), JSON.stringify({ cwd: cwdA }));
  assert.throws(
    () => recordDriverDisposition(
      coordinationId,
      {
        targetRef: asgnB.assignmentId,
        disposition: 'accepted',
        rationale: 'F02 genuine shared cwd test',
        evidenceRefs: [],
        authorizedBy: { type: 'driver', id: WRITER_ID },
      },
      { cwd: tempDir, repoRoot: tempDir },
    ),
    (err) => err instanceof CoordinationError && /cannot record "accepted" disposition on caveated evidence/.test(err.message),
    'genuine shared cwd must fail closed with caveat refusal',
  );

  // Subcase 3: Missing node ownership fails closed:
  // Create an assignment in manifest without dagNodeId in assignment-created
  const { manifestPath, eventsPath } = resolveSessionPaths(coordinationId, { cwd: tempDir, repoRoot: tempDir });
  const manifest = readManifestRaw(manifestPath);
  manifest.assignmentRefs.push('asgn_missing_owner');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  appendEvent(eventsPath, { type: 'assignment-created', payload: { assignmentId: 'asgn_missing_owner' } });

  assert.throws(
    () => recordDriverDisposition(
      coordinationId,
      {
        targetRef: 'asgn_missing_owner',
        disposition: 'accepted',
        rationale: 'missing ownership test',
        evidenceRefs: [],
        authorizedBy: { type: 'driver', id: WRITER_ID },
      },
      { cwd: tempDir, repoRoot: tempDir },
    ),
    (err) => err instanceof CoordinationError && err.category === 'validation' && /missing dagNodeId ownership/.test(err.message),
    'missing node ownership must fail closed',
  );

  // Subcase 4: Conflicting node ownership fails closed:
  // Add a conflicting assignment-created event for asgn_conflict
  manifest.assignmentRefs.push('asgn_conflict');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  appendEvent(eventsPath, { type: 'assignment-created', payload: { assignmentId: 'asgn_conflict', dagNodeId: 'node-A' } });
  appendEvent(eventsPath, { type: 'assignment-created', payload: { assignmentId: 'asgn_conflict', dagNodeId: 'node-B' } });

  assert.throws(
    () => recordDriverDisposition(
      coordinationId,
      {
        targetRef: 'asgn_conflict',
        disposition: 'accepted',
        rationale: 'conflicting ownership test',
        evidenceRefs: [],
        authorizedBy: { type: 'driver', id: WRITER_ID },
      },
      { cwd: tempDir, repoRoot: tempDir },
    ),
    (err) => err instanceof CoordinationError && err.category === 'corrupt-log' && /conflicting dagNodeId declarations/.test(err.message),
    'conflicting node ownership must fail closed with corrupt-log',
  );

  // Subcase 5: Multi-attempt attribution (Case L, Case R, Case N) and store/close/show parity
  // Case L: linked attempt 01 in shared cwd, later unlinked attempt 02 dir in distinct cwd
  {
    const cidL = 'probe-f02-case-L';
    const tempL = mkTempDir('fgos-case-l-');
    writeFixture(tempL);
    openDeclaredProtocolSession(
      {
        coordinationId: cidL,
        objective: 'Case L parity',
        writerId: WRITER_ID,
        definitionId: DEFINITION_ID,
        schemaVersion: SCHEMA_VERSION_3,
        dagDeclaration: decl,
      },
      { cwd: tempL, repoRoot: tempL },
    );
    const sharedL = path.join(tempL, 'shared');
    const cxL = path.join(tempL, 'cx');
    fs.mkdirSync(sharedL, { recursive: true });
    fs.mkdirSync(cxL, { recursive: true });

    const xL = createSessionAssignment({ coordinationId: cidL, taskKey: 'tx', contract: { objective: 'x', contextRefs: [], constraints: [], expectedOutputs: ['agent-result.json'], mutation: 'read-only', evidence: { required: 'reported' }, role: 'doer', budget: { timeoutMs: 10000, maxRuns: 1 } }, caller: { writerId: WRITER_ID }, dagNodeId: 'node-A' }, { cwd: tempL, repoRoot: tempL }).assignmentId;
    const yL = createSessionAssignment({ coordinationId: cidL, taskKey: 'ty', contract: { objective: 'y', contextRefs: [], constraints: [], expectedOutputs: ['agent-result.json'], mutation: 'read-only', evidence: { required: 'reported' }, role: 'reviewer', budget: { timeoutMs: 10000, maxRuns: 1 } }, caller: { writerId: WRITER_ID }, dagNodeId: 'node-B' }, { cwd: tempL, repoRoot: tempL }).assignmentId;

    const dX1 = path.join(tempL, '.fgos', 'assignments', xL, 'runs', '01');
    fs.mkdirSync(dX1, { recursive: true });
    fs.writeFileSync(path.join(dX1, 'run.json'), JSON.stringify({ cwd: sharedL }));
    fs.writeFileSync(path.join(dX1, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'x1' }));
    linkResult(cidL, { assignmentId: xL, runId: `run_${xL}_01` }, { cwd: tempL, repoRoot: tempL });

    // unlinked run 02 in distinct dir cxL
    const dX2 = path.join(tempL, '.fgos', 'assignments', xL, 'runs', '02');
    fs.mkdirSync(dX2, { recursive: true });
    fs.writeFileSync(path.join(dX2, 'run.json'), JSON.stringify({ cwd: cxL }));
    fs.writeFileSync(path.join(dX2, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'x2' }));

    // yL in sharedL
    const dYL = path.join(tempL, '.fgos', 'assignments', yL, 'runs', '01');
    fs.mkdirSync(dYL, { recursive: true });
    fs.writeFileSync(path.join(dYL, 'run.json'), JSON.stringify({ cwd: sharedL }));
    fs.writeFileSync(path.join(dYL, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'y' }));
    linkResult(cidL, { assignmentId: yL, runId: `run_${yL}_01` }, { cwd: tempL, repoRoot: tempL });

    // Store: refuses accepted disposition because linked run 01 is in shared cwd
    assert.throws(
      () => recordDriverDisposition(cidL, { targetRef: yL, disposition: 'accepted', rationale: 'case L', evidenceRefs: [], authorizedBy: { type: 'driver', id: WRITER_ID } }, { cwd: tempL, repoRoot: tempL }),
      (err) => err instanceof CoordinationError && err.category === 'validation' && /cannot record .* disposition on caveated evidence/.test(err.message),
    );

    // Close door: refuses close with recheck-required caveat
    assert.throws(
      () => closeSessionByQuorum(cidL, {}, { cwd: tempL, repoRoot: tempL }),
      (err) => err instanceof CoordinationError && err.category === 'refusal' && /recheck-required/.test(err.message),
    );

    // Show projection: reports both nodes caveated
    const shL = showCoordinationUseCase({ cwd: tempL, repoRoot: tempL }, { id: cidL });
    assert.equal(shL.dag.nodes.every((n) => n.caveated === true), true);
  }

  // Case R: attempt 01 distinct, attempt 02 shared and linked -> store and close refuse
  {
    const cidR = 'probe-f02-case-R';
    const tempR = mkTempDir('fgos-case-r-');
    writeFixture(tempR);
    openDeclaredProtocolSession(
      {
        coordinationId: cidR,
        objective: 'Case R parity',
        writerId: WRITER_ID,
        definitionId: DEFINITION_ID,
        schemaVersion: SCHEMA_VERSION_3,
        dagDeclaration: decl,
      },
      { cwd: tempR, repoRoot: tempR },
    );
    const sharedR = path.join(tempR, 'shared');
    const cxR = path.join(tempR, 'cx');
    fs.mkdirSync(sharedR, { recursive: true });
    fs.mkdirSync(cxR, { recursive: true });

    const xR = createSessionAssignment({ coordinationId: cidR, taskKey: 'tx', contract: { objective: 'x', contextRefs: [], constraints: [], expectedOutputs: ['agent-result.json'], mutation: 'read-only', evidence: { required: 'reported' }, role: 'doer', budget: { timeoutMs: 10000, maxRuns: 1 } }, caller: { writerId: WRITER_ID }, dagNodeId: 'node-A' }, { cwd: tempR, repoRoot: tempR }).assignmentId;
    const yR = createSessionAssignment({ coordinationId: cidR, taskKey: 'ty', contract: { objective: 'y', contextRefs: [], constraints: [], expectedOutputs: ['agent-result.json'], mutation: 'read-only', evidence: { required: 'reported' }, role: 'reviewer', budget: { timeoutMs: 10000, maxRuns: 1 } }, caller: { writerId: WRITER_ID }, dagNodeId: 'node-B' }, { cwd: tempR, repoRoot: tempR }).assignmentId;

    const dX1 = path.join(tempR, '.fgos', 'assignments', xR, 'runs', '01');
    fs.mkdirSync(dX1, { recursive: true });
    fs.writeFileSync(path.join(dX1, 'run.json'), JSON.stringify({ cwd: cxR }));
    fs.writeFileSync(path.join(dX1, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'x1' }));

    const dX2 = path.join(tempR, '.fgos', 'assignments', xR, 'runs', '02');
    fs.mkdirSync(dX2, { recursive: true });
    fs.writeFileSync(path.join(dX2, 'run.json'), JSON.stringify({ cwd: sharedR }));
    fs.writeFileSync(path.join(dX2, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'x2' }));
    linkResult(cidR, { assignmentId: xR, runId: `run_${xR}_02` }, { cwd: tempR, repoRoot: tempR });

    const dYR = path.join(tempR, '.fgos', 'assignments', yR, 'runs', '01');
    fs.mkdirSync(dYR, { recursive: true });
    fs.writeFileSync(path.join(dYR, 'run.json'), JSON.stringify({ cwd: sharedR }));
    fs.writeFileSync(path.join(dYR, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'y' }));
    linkResult(cidR, { assignmentId: yR, runId: `run_${yR}_01` }, { cwd: tempR, repoRoot: tempR });

    assert.throws(
      () => recordDriverDisposition(cidR, { targetRef: yR, disposition: 'accepted', rationale: 'case R', evidenceRefs: [], authorizedBy: { type: 'driver', id: WRITER_ID } }, { cwd: tempR, repoRoot: tempR }),
      (err) => err instanceof CoordinationError && err.category === 'validation' && /cannot record .* disposition on caveated evidence/.test(err.message),
    );
    assert.throws(
      () => closeSessionByQuorum(cidR, {}, { cwd: tempR, repoRoot: tempR }),
      (err) => err instanceof CoordinationError && err.category === 'refusal',
    );
  }

  // Case N: unpadded attempt numbering beyond 9 ('9' vs '10') sorts numerically
  {
    const cidN = 'probe-f02-case-N';
    const tempN = mkTempDir('fgos-case-n-');
    writeFixture(tempN);
    openDeclaredProtocolSession(
      {
        coordinationId: cidN,
        objective: 'Case N parity',
        writerId: WRITER_ID,
        definitionId: DEFINITION_ID,
        schemaVersion: SCHEMA_VERSION_3,
        dagDeclaration: decl,
      },
      { cwd: tempN, repoRoot: tempN },
    );
    const sharedN = path.join(tempN, 'shared');
    const cxN = path.join(tempN, 'cx');
    fs.mkdirSync(sharedN, { recursive: true });
    fs.mkdirSync(cxN, { recursive: true });

    const xN = createSessionAssignment({ coordinationId: cidN, taskKey: 'tx', contract: { objective: 'x', contextRefs: [], constraints: [], expectedOutputs: ['agent-result.json'], mutation: 'read-only', evidence: { required: 'reported' }, role: 'doer', budget: { timeoutMs: 10000, maxRuns: 1 } }, caller: { writerId: WRITER_ID }, dagNodeId: 'node-A' }, { cwd: tempN, repoRoot: tempN }).assignmentId;
    const yN = createSessionAssignment({ coordinationId: cidN, taskKey: 'ty', contract: { objective: 'y', contextRefs: [], constraints: [], expectedOutputs: ['agent-result.json'], mutation: 'read-only', evidence: { required: 'reported' }, role: 'reviewer', budget: { timeoutMs: 10000, maxRuns: 1 } }, caller: { writerId: WRITER_ID }, dagNodeId: 'node-B' }, { cwd: tempN, repoRoot: tempN }).assignmentId;

    const dX9 = path.join(tempN, '.fgos', 'assignments', xN, 'runs', '9');
    fs.mkdirSync(dX9, { recursive: true });
    fs.writeFileSync(path.join(dX9, 'run.json'), JSON.stringify({ cwd: cxN }));
    fs.writeFileSync(path.join(dX9, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'x9' }));

    const dX10 = path.join(tempN, '.fgos', 'assignments', xN, 'runs', '10');
    fs.mkdirSync(dX10, { recursive: true });
    fs.writeFileSync(path.join(dX10, 'run.json'), JSON.stringify({ cwd: sharedN }));
    fs.writeFileSync(path.join(dX10, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'x10' }));
    linkResult(cidN, { assignmentId: xN, runId: `run_${xN}_10` }, { cwd: tempN, repoRoot: tempN });

    const dYN = path.join(tempN, '.fgos', 'assignments', yN, 'runs', '01');
    fs.mkdirSync(dYN, { recursive: true });
    fs.writeFileSync(path.join(dYN, 'run.json'), JSON.stringify({ cwd: sharedN }));
    fs.writeFileSync(path.join(dYN, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'y' }));
    linkResult(cidN, { assignmentId: yN, runId: `run_${yN}_01` }, { cwd: tempN, repoRoot: tempN });

    assert.throws(
      () => recordDriverDisposition(cidN, { targetRef: yN, disposition: 'accepted', rationale: 'case N', evidenceRefs: [], authorizedBy: { type: 'driver', id: WRITER_ID } }, { cwd: tempN, repoRoot: tempN }),
      (err) => err instanceof CoordinationError && err.category === 'validation' && /cannot record .* disposition on caveated evidence/.test(err.message),
    );
  }

  // Subcase 6: Target missing run evidence fails closed; sibling with valid run accepted cleanly
  {
    const cidM = 'probe-f02-target-missing-run';
    const tempM = mkTempDir('fgos-missing-run-');
    writeFixture(tempM);
    openDeclaredProtocolSession(
      {
        coordinationId: cidM,
        objective: 'Target missing run',
        writerId: WRITER_ID,
        definitionId: DEFINITION_ID,
        schemaVersion: SCHEMA_VERSION_3,
        dagDeclaration: decl,
      },
      { cwd: tempM, repoRoot: tempM },
    );
    const cyM = path.join(tempM, 'cy');
    fs.mkdirSync(cyM, { recursive: true });

    const xM = createSessionAssignment({ coordinationId: cidM, taskKey: 'tx', contract: { objective: 'x', contextRefs: [], constraints: [], expectedOutputs: ['agent-result.json'], mutation: 'read-only', evidence: { required: 'reported' }, role: 'doer', budget: { timeoutMs: 10000, maxRuns: 1 } }, caller: { writerId: WRITER_ID }, dagNodeId: 'node-A' }, { cwd: tempM, repoRoot: tempM }).assignmentId;
    const yM = createSessionAssignment({ coordinationId: cidM, taskKey: 'ty', contract: { objective: 'y', contextRefs: [], constraints: [], expectedOutputs: ['agent-result.json'], mutation: 'read-only', evidence: { required: 'reported' }, role: 'reviewer', budget: { timeoutMs: 10000, maxRuns: 1 } }, caller: { writerId: WRITER_ID }, dagNodeId: 'node-B' }, { cwd: tempM, repoRoot: tempM }).assignmentId;

    const dYM = path.join(tempM, '.fgos', 'assignments', yM, 'runs', '01');
    fs.mkdirSync(dYM, { recursive: true });
    fs.writeFileSync(path.join(dYM, 'run.json'), JSON.stringify({ cwd: cyM }));
    fs.writeFileSync(path.join(dYM, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'y' }));
    linkResult(cidM, { assignmentId: yM, runId: `run_${yM}_01` }, { cwd: tempM, repoRoot: tempM });

    // Target xM has NO run evidence -> accept must be refused
    assert.throws(
      () => recordDriverDisposition(cidM, { targetRef: xM, disposition: 'accepted', rationale: 'missing run', evidenceRefs: [], authorizedBy: { type: 'driver', id: WRITER_ID } }, { cwd: tempM, repoRoot: tempM }),
      (err) => err instanceof CoordinationError && err.category === 'validation' && /has no run evidence/.test(err.message),
    );

    // Sibling yM with valid run in cyM is accepted cleanly without false caveat from fallback
    const rY = recordDriverDisposition(cidM, { targetRef: yM, disposition: 'accepted', rationale: 'valid sibling', evidenceRefs: [], authorizedBy: { type: 'driver', id: WRITER_ID } }, { cwd: tempM, repoRoot: tempM });
    assert.equal(rY.appended, true);

    // Sibling running in repo root (= fallback cwd shared with unisolated peer node) fails closed with caveat refusal
    const cidMRoot = 'probe-f02-sibling-repo-root';
    const tempMRoot = mkTempDir('fgos-sibling-root-');
    writeFixture(tempMRoot);
    openDeclaredProtocolSession({ coordinationId: cidMRoot, objective: 'Sibling root', writerId: WRITER_ID, definitionId: DEFINITION_ID, schemaVersion: SCHEMA_VERSION_3, dagDeclaration: decl }, { cwd: tempMRoot, repoRoot: tempMRoot });
    const xMR = createSessionAssignment({ coordinationId: cidMRoot, taskKey: 'tx', contract: { objective: 'x', contextRefs: [], constraints: [], expectedOutputs: ['agent-result.json'], mutation: 'read-only', evidence: { required: 'reported' }, role: 'doer', budget: { timeoutMs: 10000, maxRuns: 1 } }, caller: { writerId: WRITER_ID }, dagNodeId: 'node-A' }, { cwd: tempMRoot, repoRoot: tempMRoot }).assignmentId;
    const yMR = createSessionAssignment({ coordinationId: cidMRoot, taskKey: 'ty', contract: { objective: 'y', contextRefs: [], constraints: [], expectedOutputs: ['agent-result.json'], mutation: 'read-only', evidence: { required: 'reported' }, role: 'reviewer', budget: { timeoutMs: 10000, maxRuns: 1 } }, caller: { writerId: WRITER_ID }, dagNodeId: 'node-B' }, { cwd: tempMRoot, repoRoot: tempMRoot }).assignmentId;
    const dYMR = path.join(tempMRoot, '.fgos', 'assignments', yMR, 'runs', '01');
    fs.mkdirSync(dYMR, { recursive: true });
    fs.writeFileSync(path.join(dYMR, 'run.json'), JSON.stringify({ cwd: tempMRoot }));
    fs.writeFileSync(path.join(dYMR, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'y' }));
    linkResult(cidMRoot, { assignmentId: yMR, runId: `run_${yMR}_01` }, { cwd: tempMRoot, repoRoot: tempMRoot });
    assert.throws(
      () => recordDriverDisposition(cidMRoot, { targetRef: yMR, disposition: 'accepted', rationale: 'sibling at root', evidenceRefs: [], authorizedBy: { type: 'driver', id: WRITER_ID } }, { cwd: tempMRoot, repoRoot: tempMRoot }),
      (err) => err instanceof CoordinationError && err.category === 'validation' && /cannot record .* disposition on caveated evidence/.test(err.message),
      'sibling running in shared fallback cwd with concurrent unisolated node must fail closed with caveat refusal',
    );
  }

  // Subcase 7: Corrupt sibling run.json fails closed with corrupt-log
  {
    const cidC = 'probe-f02-corrupt-sibling';
    const tempC = mkTempDir('fgos-corrupt-sibling-');
    writeFixture(tempC);
    openDeclaredProtocolSession(
      {
        coordinationId: cidC,
        objective: 'Corrupt sibling',
        writerId: WRITER_ID,
        definitionId: DEFINITION_ID,
        schemaVersion: SCHEMA_VERSION_3,
        dagDeclaration: decl,
      },
      { cwd: tempC, repoRoot: tempC },
    );
    const cxC = path.join(tempC, 'cx');
    fs.mkdirSync(cxC, { recursive: true });

    const xC = createSessionAssignment({ coordinationId: cidC, taskKey: 'tx', contract: { objective: 'x', contextRefs: [], constraints: [], expectedOutputs: ['agent-result.json'], mutation: 'read-only', evidence: { required: 'reported' }, role: 'doer', budget: { timeoutMs: 10000, maxRuns: 1 } }, caller: { writerId: WRITER_ID }, dagNodeId: 'node-A' }, { cwd: tempC, repoRoot: tempC }).assignmentId;
    const yC = createSessionAssignment({ coordinationId: cidC, taskKey: 'ty', contract: { objective: 'y', contextRefs: [], constraints: [], expectedOutputs: ['agent-result.json'], mutation: 'read-only', evidence: { required: 'reported' }, role: 'reviewer', budget: { timeoutMs: 10000, maxRuns: 1 } }, caller: { writerId: WRITER_ID }, dagNodeId: 'node-B' }, { cwd: tempC, repoRoot: tempC }).assignmentId;

    const dXC = path.join(tempC, '.fgos', 'assignments', xC, 'runs', '01');
    fs.mkdirSync(dXC, { recursive: true });
    fs.writeFileSync(path.join(dXC, 'run.json'), JSON.stringify({ cwd: cxC }));
    fs.writeFileSync(path.join(dXC, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'x' }));
    linkResult(cidC, { assignmentId: xC, runId: `run_${xC}_01` }, { cwd: tempC, repoRoot: tempC });

    const dYC = path.join(tempC, '.fgos', 'assignments', yC, 'runs', '01');
    fs.mkdirSync(dYC, { recursive: true });
    fs.writeFileSync(path.join(dYC, 'run.json'), '{CORRUPT');

    assert.throws(
      () => recordDriverDisposition(cidC, { targetRef: xC, disposition: 'accepted', rationale: 'corrupt sibling test', evidenceRefs: [], authorizedBy: { type: 'driver', id: WRITER_ID } }, { cwd: tempC, repoRoot: tempC }),
      (err) => err instanceof CoordinationError && err.category === 'corrupt-log',
      'store must throw corrupt-log when sibling run.json is corrupt',
    );

    assert.throws(
      () => showCoordinationUseCase({ cwd: tempC, repoRoot: tempC }, { id: cidC }),
      (err) => err instanceof CoordinationError && err.category === 'corrupt-log',
      'show must throw corrupt-log when sibling run.json is corrupt',
    );
  }

  // Subcase 8: Missing or invalid run.json for linked run fails closed with corrupt-log (I11R2-01)
  {
    const cidLinked = 'probe-f02-linked-missing-run-json';
    const tempLinked = mkTempDir('fgos-linked-missing-');
    writeFixture(tempLinked);
    openDeclaredProtocolSession(
      {
        coordinationId: cidLinked,
        objective: 'Linked run.json missing/invalid fails closed',
        writerId: WRITER_ID,
        definitionId: DEFINITION_ID,
        schemaVersion: SCHEMA_VERSION_3,
        dagDeclaration: decl,
      },
      { cwd: tempLinked, repoRoot: tempLinked },
    );
    const sharedDir = path.join(tempLinked, 'shared');
    fs.mkdirSync(sharedDir, { recursive: true });

    const xL = createSessionAssignment({ coordinationId: cidLinked, taskKey: 'tx', contract: { objective: 'x', contextRefs: [], constraints: [], expectedOutputs: ['agent-result.json'], mutation: 'read-only', evidence: { required: 'reported' }, role: 'doer', budget: { timeoutMs: 10000, maxRuns: 1 } }, caller: { writerId: WRITER_ID }, dagNodeId: 'node-A' }, { cwd: tempLinked, repoRoot: tempLinked }).assignmentId;
    const yL = createSessionAssignment({ coordinationId: cidLinked, taskKey: 'ty', contract: { objective: 'y', contextRefs: [], constraints: [], expectedOutputs: ['agent-result.json'], mutation: 'read-only', evidence: { required: 'reported' }, role: 'reviewer', budget: { timeoutMs: 10000, maxRuns: 1 } }, caller: { writerId: WRITER_ID }, dagNodeId: 'node-B' }, { cwd: tempLinked, repoRoot: tempLinked }).assignmentId;

    const dXL = path.join(tempLinked, '.fgos', 'assignments', xL, 'runs', '01');
    fs.mkdirSync(dXL, { recursive: true });
    fs.writeFileSync(path.join(dXL, 'run.json'), JSON.stringify({ cwd: sharedDir }));
    fs.writeFileSync(path.join(dXL, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'x' }));
    linkResult(cidLinked, { assignmentId: xL, runId: `run_${xL}_01` }, { cwd: tempLinked, repoRoot: tempLinked });

    const dYL = path.join(tempLinked, '.fgos', 'assignments', yL, 'runs', '01');
    fs.mkdirSync(dYL, { recursive: true });
    fs.writeFileSync(path.join(dYL, 'run.json'), JSON.stringify({ cwd: sharedDir }));
    fs.writeFileSync(path.join(dYL, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'y' }));
    linkResult(cidLinked, { assignmentId: yL, runId: `run_${yL}_01` }, { cwd: tempLinked, repoRoot: tempLinked });

    // Both runs share cwd -> store disposition accepted is refused with caveat
    assert.throws(
      () => recordDriverDisposition(cidLinked, { targetRef: yL, disposition: 'accepted', rationale: 'shared cwd', evidenceRefs: [], authorizedBy: { type: 'driver', id: WRITER_ID } }, { cwd: tempLinked, repoRoot: tempLinked }),
      (err) => err instanceof CoordinationError && err.category === 'validation' && /cannot record .* disposition on caveated evidence/.test(err.message),
    );

    // Delete linked run.json for xL -> must NOT silently fallback to defaultCwd, must throw corrupt-log across store, show, and close
    fs.unlinkSync(path.join(dXL, 'run.json'));

    assert.throws(
      () => recordDriverDisposition(cidLinked, { targetRef: yL, disposition: 'accepted', rationale: 'missing run.json test', evidenceRefs: [], authorizedBy: { type: 'driver', id: WRITER_ID } }, { cwd: tempLinked, repoRoot: tempLinked }),
      (err) => err instanceof CoordinationError && err.category === 'corrupt-log' && /missing run\.json for linked runId/.test(err.message),
      'store must throw corrupt-log when linked run.json is deleted',
    );

    assert.throws(
      () => showCoordinationUseCase({ cwd: tempLinked, repoRoot: tempLinked }, { id: cidLinked }),
      (err) => err instanceof CoordinationError && err.category === 'corrupt-log' && /missing run\.json for linked runId/.test(err.message),
      'show must throw corrupt-log when linked run.json is deleted',
    );

    assert.throws(
      () => closeSessionByQuorum(cidLinked, {}, { cwd: tempLinked, repoRoot: tempLinked }),
      (err) => err instanceof CoordinationError && err.category === 'corrupt-log' && /missing run\.json for linked runId/.test(err.message),
      'close must throw corrupt-log when linked run.json is deleted',
    );

    // Now write run.json back but without a valid string cwd (missing/empty cwd)
    fs.writeFileSync(path.join(dXL, 'run.json'), JSON.stringify({ status: 'running' }));

    assert.throws(
      () => recordDriverDisposition(cidLinked, { targetRef: yL, disposition: 'accepted', rationale: 'no cwd in run.json', evidenceRefs: [], authorizedBy: { type: 'driver', id: WRITER_ID } }, { cwd: tempLinked, repoRoot: tempLinked }),
      (err) => err instanceof CoordinationError && err.category === 'corrupt-log' && /missing or invalid cwd/.test(err.message),
      'store must throw corrupt-log when linked run.json lacks string cwd',
    );

    assert.throws(
      () => showCoordinationUseCase({ cwd: tempLinked, repoRoot: tempLinked }, { id: cidLinked }),
      (err) => err instanceof CoordinationError && err.category === 'corrupt-log' && /missing or invalid cwd/.test(err.message),
      'show must throw corrupt-log when linked run.json lacks string cwd',
    );

    assert.throws(
      () => closeSessionByQuorum(cidLinked, {}, { cwd: tempLinked, repoRoot: tempLinked }),
      (err) => err instanceof CoordinationError && err.category === 'corrupt-log' && /missing or invalid cwd/.test(err.message),
      'close must throw corrupt-log when linked run.json lacks string cwd',
    );
  }

  // Subcase 9: Unlinked attempt numeric sorting regression lock (M2d lock)
  {
    const cidM2d = 'probe-f02-unlinked-m2d-lock';
    const tempM2d = mkTempDir('fgos-m2d-lock-');
    writeFixture(tempM2d);
    openDeclaredProtocolSession(
      {
        coordinationId: cidM2d,
        objective: 'Unlinked attempt numeric sorting regression lock',
        writerId: WRITER_ID,
        definitionId: DEFINITION_ID,
        schemaVersion: SCHEMA_VERSION_3,
        dagDeclaration: decl,
      },
      { cwd: tempM2d, repoRoot: tempM2d },
    );
    const dir9 = path.join(tempM2d, 'dir9');
    const dir10 = path.join(tempM2d, 'dir10');
    fs.mkdirSync(dir9, { recursive: true });
    fs.mkdirSync(dir10, { recursive: true });

    const xM2d = createSessionAssignment({ coordinationId: cidM2d, taskKey: 'tx', contract: { objective: 'x', contextRefs: [], constraints: [], expectedOutputs: ['agent-result.json'], mutation: 'read-only', evidence: { required: 'reported' }, role: 'doer', budget: { timeoutMs: 10000, maxRuns: 1 } }, caller: { writerId: WRITER_ID }, dagNodeId: 'node-A' }, { cwd: tempM2d, repoRoot: tempM2d }).assignmentId;
    const yM2d = createSessionAssignment({ coordinationId: cidM2d, taskKey: 'ty', contract: { objective: 'y', contextRefs: [], constraints: [], expectedOutputs: ['agent-result.json'], mutation: 'read-only', evidence: { required: 'reported' }, role: 'reviewer', budget: { timeoutMs: 10000, maxRuns: 1 } }, caller: { writerId: WRITER_ID }, dagNodeId: 'node-B' }, { cwd: tempM2d, repoRoot: tempM2d }).assignmentId;

    // Assignment xM2d has unlinked attempts '9' and '10' (neither is linked!)
    const d9 = path.join(tempM2d, '.fgos', 'assignments', xM2d, 'runs', '9');
    fs.mkdirSync(d9, { recursive: true });
    fs.writeFileSync(path.join(d9, 'run.json'), JSON.stringify({ cwd: dir9 }));
    fs.writeFileSync(path.join(d9, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'attempt 9' }));

    const d10 = path.join(tempM2d, '.fgos', 'assignments', xM2d, 'runs', '10');
    fs.mkdirSync(d10, { recursive: true });
    fs.writeFileSync(path.join(d10, 'run.json'), JSON.stringify({ cwd: dir10 }));
    fs.writeFileSync(path.join(d10, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'attempt 10' }));

    // Direct resolver test: unlinked node-A with attempts 9 and 10 must resolve to attempt 10 (dir10), NOT attempt 9 (dir9)
    const { fgosDir: fgosDirM2d } = resolveSessionPaths(cidM2d, { cwd: tempM2d, repoRoot: tempM2d });
    const resolvedCwd = resolveNodeCwd(decl.nodes[0], [xM2d], fgosDirM2d, tempM2d);
    assert.strictEqual(
      resolvedCwd,
      path.resolve(dir10),
      'unlinked attempt resolution must sort numerically (10 > 9), not lexicographically ("10" < "9")',
    );

    // Assignment yM2d runs in dir10 as well
    const dY = path.join(tempM2d, '.fgos', 'assignments', yM2d, 'runs', '01');
    fs.mkdirSync(dY, { recursive: true });
    fs.writeFileSync(path.join(dY, 'run.json'), JSON.stringify({ cwd: dir10 }));
    fs.writeFileSync(path.join(dY, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'attempt 1' }));
    linkResult(cidM2d, { assignmentId: yM2d, runId: `run_${yM2d}_01` }, { cwd: tempM2d, repoRoot: tempM2d });

    // Under numeric sort, xM2d resolves to dir10 (sharing with yM2d in dir10) -> caveat refusal!
    // If lexicographic sort were used (M2d mutant), xM2d would resolve to dir9 (distinct from dir10) -> false clean accept!
    assert.throws(
      () => recordDriverDisposition(cidM2d, { targetRef: yM2d, disposition: 'accepted', rationale: 'attempt 10 shared test', evidenceRefs: [], authorizedBy: { type: 'driver', id: WRITER_ID } }, { cwd: tempM2d, repoRoot: tempM2d }),
      (err) => err instanceof CoordinationError && err.category === 'validation' && /cannot record .* disposition on caveated evidence/.test(err.message),
      'unlinked attempt 10 sharing cwd with peer must trigger caveat validation refusal under numeric sort',
    );
  }
});

// --------------------------------------------------------------------------
// 6. F03: Scheduler outcome taxonomy matrix
// --------------------------------------------------------------------------

test('DAG probes: F03 scheduler outcome matrix (concurrency-cap deferral & retry, non-cap refusal, corrupt evidence, cold resume)', async () => {
  // Subcase 1: Concurrency-cap deferral & retry-on-settlement
  const decl = {
    nodes: [
      { id: 'node-step-a', displayLabel: 'step-a', dependsOn: [] },
      { id: 'node-step-b', displayLabel: 'step-b', dependsOn: [] },
      { id: 'node-step-c', displayLabel: 'step-c', dependsOn: ['node-step-b'] },
    ],
  };
  const rawSteps = [
    { as: 'step-a' },
    { as: 'step-b' },
    { as: 'step-c' },
  ];

  let stepBAttempts = 0;
  let stepACompleted = false;

  const scheduledResults = await scheduleDagSteps({
    steps: rawSteps,
    declaration: decl,
    execute: async (step) => {
      if (step.as === 'step-a') {
        await new Promise((resolve) => setTimeout(resolve, 30));
        stepACompleted = true;
        return { authoritativeSettled: true, settled: true };
      }
      if (step.as === 'step-b') {
        stepBAttempts += 1;
        if (!stepACompleted) {
          throw new CoordinationError('validation', 'Worker slot full', 'concurrency-cap');
        }
        return { authoritativeSettled: true, settled: true };
      }
      if (step.as === 'step-c') {
        return { authoritativeSettled: true, settled: true };
      }
    },
  });

  assert.equal(stepBAttempts, 2, 'step-b deferred on concurrency-cap was retried upon step-a settlement');
  assert.equal(scheduledResults.find((s) => s.as === 'step-a').outcome, 'settled');
  assert.equal(scheduledResults.find((s) => s.as === 'step-b').outcome, 'settled');
  assert.equal(scheduledResults.find((s) => s.as === 'step-c').outcome, 'settled');

  // Subcase 2: Concurrency-cap deferral descendants taxonomy (I11R-04)
  // When step-b is deferred on concurrency-cap, step-c (depends on b) and step-d (depends on a and b)
  // must be marked "blocked" with blockedBy naming step-b, NOT "deferred".
  const capDecl = {
    nodes: [
      { id: 'node-step-a', displayLabel: 'step-a', dependsOn: [] },
      { id: 'node-step-b', displayLabel: 'step-b', dependsOn: [] },
      { id: 'node-step-c', displayLabel: 'step-c', dependsOn: ['node-step-b'] },
      { id: 'node-step-d', displayLabel: 'step-d', dependsOn: ['node-step-a', 'node-step-b'] },
    ],
  };
  const capSteps = [{ as: 'step-a' }, { as: 'step-b' }, { as: 'step-c' }, { as: 'step-d' }];
  const capResults = await scheduleDagSteps({
    steps: capSteps,
    declaration: capDecl,
    execute: async (step) => {
      if (step.as === 'step-a') return { authoritativeSettled: true, settled: true };
      if (step.as === 'step-b') throw new CoordinationError('validation', 'Worker slot full', 'concurrency-cap');
      return { authoritativeSettled: true, settled: true };
    },
  });

  const bCap = capResults.find((s) => s.as === 'step-b');
  assert.equal(bCap.outcome, 'deferred');
  assert.equal(bCap.error?.code, 'concurrency-cap');

  const cCap = capResults.find((s) => s.as === 'step-c');
  assert.equal(cCap.outcome, 'blocked');
  assert.deepEqual(cCap.blockedBy, ['step-b']);
  assert.notEqual(cCap.outcome, 'deferred');

  const dCap = capResults.find((s) => s.as === 'step-d');
  assert.equal(dCap.outcome, 'blocked');
  assert.deepEqual(dCap.blockedBy, ['step-b']);
  assert.notEqual(dCap.outcome, 'deferred');

  // Verify that NO step with outcome === 'deferred' carries a non-cap error code
  for (const s of capResults) {
    if (s.outcome === 'deferred') {
      assert.equal(s.error?.code, 'concurrency-cap');
    }
  }

  // Subcase 3: Missing / unlinked evidence produces materialized outcome without explicit schedulerOutcome (I11R-03 / M3a regression lock)
  // Calling scheduleDagSteps with an execute returning { authoritativeSettled: false } WITHOUT schedulerOutcome
  // MUST resolve outcome to 'materialized', NOT 'deferred' (kills mutation M3a).
  const unlinkedResults = await scheduleDagSteps({
    steps: rawSteps,
    declaration: decl,
    execute: async (step) => {
      if (step.as === 'step-a') {
        return { authoritativeSettled: false }; // Note: NO explicit schedulerOutcome provided!
      }
      if (step.as === 'step-b') {
        return { authoritativeSettled: true, settled: true };
      }
      if (step.as === 'step-c') {
        return { authoritativeSettled: true, settled: true };
      }
    },
  });
  const stepAUnlinked = unlinkedResults.find((s) => s.as === 'step-a');
  assert.equal(stepAUnlinked.outcome, 'materialized', 'unsettled step without explicit outcome must default to materialized');
  assert.notEqual(stepAUnlinked.outcome, 'deferred', 'mutation M3a regression lock: unsettled step must NOT default to deferred');

  const stepCUnlinked = unlinkedResults.find((s) => s.as === 'step-c');
  assert.equal(stepCUnlinked.outcome, 'settled');

  // Subcase 4: Non-concurrency-cap validation failure is refused, NOT deferred, and blocks descendants
  const refusalResults = await scheduleDagSteps({
    steps: rawSteps,
    declaration: decl,
    execute: async (step) => {
      if (step.as === 'step-a') {
        return { authoritativeSettled: true, settled: true };
      }
      if (step.as === 'step-b') {
        throw new CoordinationError('validation', 'Invalid input spec', 'invalid-spec');
      }
      if (step.as === 'step-c') {
        return { authoritativeSettled: true, settled: true };
      }
    },
  });

  const stepBRefused = refusalResults.find((s) => s.as === 'step-b');
  assert.equal(stepBRefused.outcome, 'refused', 'non-concurrency-cap error must result in refused, not deferred');
  assert.notEqual(stepBRefused.outcome, 'deferred');

  const stepCBlocked = refusalResults.find((s) => s.as === 'step-c');
  assert.equal(stepCBlocked.outcome, 'blocked', 'descendant of refused step must be blocked');

  // Subcase 5: Non-validation error throws immediately
  await assert.rejects(
    scheduleDagSteps({
      steps: rawSteps,
      declaration: decl,
      execute: async (step) => {
        if (step.as === 'step-b') throw new Error('catastrophic process failure');
        return { authoritativeSettled: true, settled: true };
      },
    }),
    (err) => err.message === 'catastrophic process failure',
  );

  // Subcase 6: Cold resume parity across show and run
  const tempDir = mkTempDir();
  writeFixture(tempDir);
  const ctx = { cwd: tempDir, repoRoot: tempDir, runnerConfig: fakeExecutor(tempDir) };
  const coordinationId = 'probe-cold-resume-parity';
  const compiledReq = compileDagRequest(validateCoordinationRequest(makeRequest({ coordinationId })));
  openDeclaredProtocolSession(
    {
      coordinationId,
      objective: 'Cold resume parity',
      writerId: WRITER_ID,
      definitionId: DEFINITION_ID,
      schemaVersion: SCHEMA_VERSION_3,
      dagDeclaration: compiledReq,
    },
    { cwd: tempDir, repoRoot: tempDir },
  );
  createSessionAssignment(
    {
      coordinationId,
      taskKey: 'task-produce',
      contract: { objective: 'Produce', contextRefs: [], constraints: [], expectedOutputs: ['agent-result.json'], mutation: 'read-only', evidence: { required: 'reported' }, role: 'doer', budget: { timeoutMs: 10000, maxRuns: 1 } },
      caller: { writerId: WRITER_ID },
      dagNodeId: 'node-produce',
    },
    { cwd: tempDir, repoRoot: tempDir },
  );

  const shown = showCoordinationUseCase({ cwd: tempDir, repoRoot: tempDir }, { id: coordinationId });
  const runResult = await runCoordinationUseCase(ctx, { requestObject: makeRequest({ coordinationId }) });
  const headlessShown = showCoordinationHeadless(coordinationId, { ctx: { cwd: tempDir, repoRoot: tempDir } });

  const shownOutcome = shown.dag.nodes.find((n) => n.nodeId === 'node-produce').schedulerOutcome;
  const runOutcome = runResult.steps.find((s) => s.as === 'produce').schedulerOutcome;
  const headlessOutcome = headlessShown.dag.nodes.find((n) => n.nodeId === 'node-produce').schedulerOutcome;

  assert.equal(shownOutcome, 'materialized');
  assert.equal(runOutcome, 'materialized');
  assert.equal(headlessOutcome, 'materialized');
  assert.notEqual(runOutcome, 'deferred');
});
