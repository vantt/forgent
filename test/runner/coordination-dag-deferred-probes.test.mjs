// Deferred Findings & Architectural Debt Verification Probes
//
// Invariants verified / probed:
// 1. Unlinked in-flight or retried node on resume outcome taxonomy.
// 2. Driver disposition on caveated findings vs closure refusal.
// 3. Caveated session cannot close or discharge caveat and requires cancellation and recheck in new session.
// 4. Distinct node cwds allow cell-closed disposition without false positive shared-cwd caveats.

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
} from '../../src/runner/coordination/store.mjs';
import {
  computeDagSharedCwdCaveats,
} from '../../src/runner/coordination/dag-declaration.mjs';
import {
  CoordinationError,
  SCHEMA_VERSION_3,
} from '../../src/runner/coordination/schema.mjs';
import { openDeclaredProtocolSession, cancelSession } from '../../src/runner/coordination/session-engine.mjs';
import { runCoordinationUseCase } from '../../src/verbs/coordination/run.mjs';
import { showCoordinationUseCase } from '../../src/verbs/coordination/show.mjs';
import { closeCoordinationUseCase } from '../../src/verbs/coordination/close.mjs';
import { compileDagRequest } from '../../src/verbs/coordination/dag-request-compiler.mjs';
import { resolveNodeCwd } from '../../src/verbs/coordination/dag-scheduler.mjs';
import { validateCoordinationRequest } from '../../src/verbs/coordination/schema.mjs';

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
  return {
    executor: { allowCrossProvider: true, command: process.execPath, args: [executorScript, '{prompt}'] },
    models: { standard: 'test-model', nano: 'test-model', mini: 'test-model', advanced: 'test-model', flagship: 'test-model', frontier: 'test-model' },
    timeoutMs: 10000,
  };
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

test(
  'DAG probes: unlinked node on resume carries accurate non-deferred outcome taxonomy',
  { todo: 'Unlinked in-flight or retried node on resume should have accurate outcome taxonomy rather than deferred without concurrency-cap' },
  async () => {
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

    assert.notEqual(produceRun.schedulerOutcome, 'deferred', 'unlinked in-flight node should not be labeled deferred');
    assert.equal(produceRun.authoritativeSettled, false);
  },
);

// --------------------------------------------------------------------------
// 2. Driver disposition on caveated findings vs closure refusal
// --------------------------------------------------------------------------

test(
  'DAG probes: driver disposition on caveated findings refuses accepted disposition at store level',
  { todo: 'Driver disposition accepted on caveated findings should fail closed at store level' },
  async () => {
    const tempDir = mkTempDir();
    writeFixture(tempDir);
    const ctx = { cwd: tempDir, repoRoot: tempDir, runnerConfig: fakeExecutor(tempDir) };
    const coordinationId = 'disposition-caveats';

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

    // 1. cell-closed: store explicitly checks caveats and refuses
    assert.throws(
      () => recordDriverDisposition(
        coordinationId,
        {
          targetRef: asgnId,
          disposition: 'cell-closed',
          rationale: 'attempt closing cell',
          evidenceRefs: [],
          authorizedBy: { type: 'driver', id: WRITER_ID },
        },
        { cwd: tempDir, repoRoot: tempDir },
      ),
      (err) => err instanceof CoordinationError && /cannot record "cell-closed" disposition/.test(err.message),
    );

    // 2. In intended contract: store should ALSO refuse 'accepted' disposition on caveated findings
    assert.throws(
      () => recordDriverDisposition(
        coordinationId,
        {
          targetRef: asgnId,
          disposition: 'accepted',
          rationale: 'driver accepting caveat finding',
          evidenceRefs: [],
          authorizedBy: { type: 'driver', id: WRITER_ID },
        },
        { cwd: tempDir, repoRoot: tempDir },
      ),
      (err) => err instanceof CoordinationError && /cannot record "accepted" disposition on caveated/.test(err.message),
      'store must refuse accepted disposition on unadjudicated caveated evidence',
    );
  },
);

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
// 4. Distinct node cwds allow cell-closed disposition without false positive caveats
// --------------------------------------------------------------------------

test(
  'DAG probes: distinct node cwds allow cell-closed disposition without false positive shared-cwd caveats',
  { todo: 'Manifest assignmentRef scan without dagNodeId filtering causes cross-node cwd attribution and false positive caveats' },
  () => {
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

    // Call production door: recordDriverDisposition('cell-closed') for node-B
    // In intended contract: because node-A and node-B are in distinct directories, there are NO shared-cwd caveats.
    // Therefore, cell-closed disposition must succeed!
    // In baseline: manifest.assignmentRefs scan without dagNodeId check attributes cwdA to node-B,
    // triggering false positive shared-cwd caveats and throwing CoordinationError ('validation').
    const res = recordDriverDisposition(
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
    assert.equal(res.appended, true, 'cell-closed disposition must succeed when nodes have distinct cwds');
  },
);
