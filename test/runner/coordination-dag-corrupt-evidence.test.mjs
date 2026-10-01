// Corrupt / Missing Evidence Verification
//
// Invariants verified:
// 1. Corrupt RunResult cannot settle a node.
// 2. Missing or malformed result links cannot unblock descendants.
// 3. Superseded/retried result evidence is not authoritative.
// 4. Corrupt declaration/fingerprint/definition fails closed.
// 5. Scheduler error does not silently become "no work" through runCoordinationUseCase door.
// 6. Corrupt or caveated evidence cannot satisfy quorum, explicit close, or cell-closed disposition.
// 7. Session status, session phase, scheduler outcome, and RunResult status remain distinct across run and show projections.
// 8. Corrupt or missing RunResult on disk fails closed and cannot settle node or dispatch descendant.

import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  createSessionAssignment,
  readSessionEvents,
  resolveSessionPaths,
  recordRunRetry,
  linkResult,
  recordDriverDisposition,
} from '../../src/runner/coordination/store.mjs';
import {
  getAuthoritativeSettledAssignmentIds,
} from '../../src/runner/coordination/dag-declaration.mjs';
import { replaySession } from '../../src/runner/coordination/replay.mjs';
import {
  CoordinationError,
  SCHEMA_VERSION_3,
} from '../../src/runner/coordination/schema.mjs';
import { EventLogError } from '../../src/state/events.mjs';
import {
  openDeclaredProtocolSession,
  evaluateSessionQuorum,
  loadDefinitionForSession,
} from '../../src/runner/coordination/session-engine.mjs';
import { runCoordinationUseCase } from '../../src/verbs/coordination/run.mjs';
import { showCoordinationUseCase } from '../../src/verbs/coordination/show.mjs';
import { closeCoordinationUseCase } from '../../src/verbs/coordination/close.mjs';
import { compileDagRequest } from '../../src/verbs/coordination/dag-request-compiler.mjs';
import { scheduleDagSteps } from '../../src/verbs/coordination/dag-scheduler.mjs';
import { validateCoordinationRequest } from '../../src/verbs/coordination/schema.mjs';
import { normalizeRunResultV2 } from '../../src/runner/dispatch/run-result.mjs';

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

function mkTempDir(prefix = 'fgos-dag-evidence-') {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

function writeSettledRunResult(tempDir, assignmentId, runId) {
  const prefix = `run_${assignmentId}_`;
  const attemptStr = runId.startsWith(prefix) ? runId.slice(prefix.length) : '01';
  const runDir = path.join(tempDir, '.fgos', 'assignments', assignmentId, 'runs', attemptStr);
  fs.mkdirSync(runDir, { recursive: true });
  const resultPayload = normalizeRunResultV2({
    runId,
    assignmentId,
    agentClaim: { status: 'done', summary: 'Settled.' },
    confidenceLevel: 'reported',
    runtime: { exitCode: 0 },
    evidence: { summary: 'Settled run result.' },
  });
  fs.writeFileSync(path.join(runDir, 'result.json'), `${JSON.stringify(resultPayload, null, 2)}\n`);
  fs.writeFileSync(path.join(runDir, 'run.json'), JSON.stringify({ runId, assignmentId, status: 'done', cwd: tempDir, exitCode: 0, createdAt: new Date().toISOString() }));
  fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'Settled.' }));
  fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Report\nSettled.\n');
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

function fakeExecutor(tempDir, statusToEmit = 'done') {
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
    const status = ${JSON.stringify(statusToEmit)};
    fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Report\\nResult: ' + status + '\\n');
    fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ status, summary: 'Executed with ' + status }));
    process.stdout.write('Executed with ' + status + '\\n');
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
    objective: 'DAG corrupt evidence test.',
    writerId: WRITER_ID,
    protocolRef: { id: DEFINITION_ID },
    actors: defaultActors(),
    steps: [produceStep(), reviewStep({ contextRefs: ['$ref:produce'] })],
    ...overrides,
  };
}

// --------------------------------------------------------------------------
// 1. Corrupt RunResult cannot settle a node
// --------------------------------------------------------------------------

test('DAG evidence: corrupt or truncated RunResult fails closed and cannot settle a node', () => {
  const tempDir = mkTempDir();
  writeFixture(tempDir);
  const coordinationId = 'd1-corrupt-runresult';

  const decl = compileDagRequest(validateCoordinationRequest(makeRequest({ coordinationId })));
  openDeclaredProtocolSession(
    {
      coordinationId,
      objective: 'Corrupt run result test',
      writerId: WRITER_ID,
      definitionId: DEFINITION_ID,
      schemaVersion: SCHEMA_VERSION_3,
      dagDeclaration: decl,
    },
    { cwd: tempDir, repoRoot: tempDir },
  );

  const asgn1 = createSessionAssignment(
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

  const runId = `run_${asgn1.assignmentId}_001`;
  const runDir = path.join(tempDir, '.fgos', 'assignments', asgn1.assignmentId, 'runs', '001');
  fs.mkdirSync(runDir, { recursive: true });
  // Write truncated/corrupt JSON into result.json
  fs.writeFileSync(path.join(runDir, 'result.json'), '{ "status": "done", "summary": ');

  linkResult(coordinationId, { assignmentId: asgn1.assignmentId, runId }, { cwd: tempDir, repoRoot: tempDir });

  // showCoordinationUseCase must fail closed with corrupt-log
  assert.throws(
    () => showCoordinationUseCase({ cwd: tempDir, repoRoot: tempDir }, { id: coordinationId }),
    (err) => err instanceof CoordinationError && err.category === 'corrupt-log' && /truncated or malformed/.test(err.message),
  );
});

// --------------------------------------------------------------------------
// 2. Missing or malformed result links cannot unblock descendants
// --------------------------------------------------------------------------

test('DAG evidence: missing or malformed result links fail closed and cannot unblock descendants', () => {
  const tempDir = mkTempDir();
  writeFixture(tempDir);
  const coordinationId = 'd2-malformed-links';

  const decl = compileDagRequest(validateCoordinationRequest(makeRequest({ coordinationId })));
  openDeclaredProtocolSession(
    {
      coordinationId,
      objective: 'Malformed links test',
      writerId: WRITER_ID,
      definitionId: DEFINITION_ID,
      schemaVersion: SCHEMA_VERSION_3,
      dagDeclaration: decl,
    },
    { cwd: tempDir, repoRoot: tempDir },
  );

  const asgn1 = createSessionAssignment(
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

  // 1. Path traversal or malformed runId rejected with foreign-ref
  assert.throws(
    () => linkResult(coordinationId, { assignmentId: asgn1.assignmentId, runId: `run_${asgn1.assignmentId}_../../evil` }, { cwd: tempDir, repoRoot: tempDir }),
    (err) => err instanceof CoordinationError && err.category === 'foreign-ref',
  );

  // 2. Foreign assignment id rejected with foreign-ref
  assert.throws(
    () => linkResult(coordinationId, { assignmentId: asgn1.assignmentId, runId: 'run_foreign_asgn_001' }, { cwd: tempDir, repoRoot: tempDir }),
    (err) => err instanceof CoordinationError && err.category === 'foreign-ref',
  );

  // 3. Since no valid result was linked, descendant 'review' remains blocked
  const replayed = replaySession(coordinationId, { cwd: tempDir, repoRoot: tempDir });
  const settledIds = getAuthoritativeSettledAssignmentIds(replayed.events);
  assert.equal(settledIds.has(asgn1.assignmentId), false);

  const produceNode = replayed.dag.nodes.find((n) => n.nodeId === 'node-produce');
  const reviewNode = replayed.dag.nodes.find((n) => n.nodeId === 'node-review');
  assert.equal(produceNode.settled, false);
  assert.equal(reviewNode.settled, false);
  assert.equal(reviewNode.blocked, true, 'descendant must remain blocked when predecessor result is unlinked');
});

// --------------------------------------------------------------------------
// 3. Superseded/retried result evidence is not authoritative
// --------------------------------------------------------------------------

test('DAG evidence: superseded and retried result evidence is not authoritative', () => {
  const tempDir = mkTempDir();
  writeFixture(tempDir);
  const coordinationId = 'd3-superseded-evidence';

  const decl = compileDagRequest(validateCoordinationRequest(makeRequest({ coordinationId })));
  openDeclaredProtocolSession(
    {
      coordinationId,
      objective: 'Superseded evidence test',
      writerId: WRITER_ID,
      definitionId: DEFINITION_ID,
      schemaVersion: SCHEMA_VERSION_3,
      dagDeclaration: decl,
    },
    { cwd: tempDir, repoRoot: tempDir },
  );

  const asgn1 = createSessionAssignment(
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
        budget: { timeoutMs: 10000, maxRuns: 2 },
      },
      caller: { writerId: WRITER_ID },
      dagNodeId: 'node-produce',
    },
    { cwd: tempDir, repoRoot: tempDir },
  );

  const run1 = `run_${asgn1.assignmentId}_001`;
  writeSettledRunResult(tempDir, asgn1.assignmentId, run1);
  linkResult(coordinationId, { assignmentId: asgn1.assignmentId, runId: run1 }, { cwd: tempDir, repoRoot: tempDir });

  // Authoritative settlement before retry
  let replayed = replaySession(coordinationId, { cwd: tempDir, repoRoot: tempDir });
  assert.equal(getAuthoritativeSettledAssignmentIds(replayed.events).has(asgn1.assignmentId), true);
  assert.equal(replayed.dag.nodes.find((n) => n.nodeId === 'node-produce').settled, true);

  // Record retry
  recordRunRetry(
    coordinationId,
    { assignmentId: asgn1.assignmentId, runId: run1, retryAttempt: 1, reason: 'retrying run' },
    { cwd: tempDir, repoRoot: tempDir },
  );

  // Authoritative settlement invalidated by run-retried
  replayed = replaySession(coordinationId, { cwd: tempDir, repoRoot: tempDir });
  assert.equal(getAuthoritativeSettledAssignmentIds(replayed.events).has(asgn1.assignmentId), false);
  assert.equal(replayed.dag.nodes.find((n) => n.nodeId === 'node-produce').settled, false);
  assert.equal(replayed.dag.nodes.find((n) => n.nodeId === 'node-review').blocked, true);

  // showCoordinationUseCase must report materialized, NOT refused or corrupt-evidence
  const shownAfterRetry = showCoordinationUseCase({ cwd: tempDir, repoRoot: tempDir }, { id: coordinationId });
  const produceNodeAfterRetry = shownAfterRetry.dag.nodes.find((n) => n.nodeId === 'node-produce');
  assert.equal(produceNodeAfterRetry.settled, false, 'retried node is not settled');
  assert.equal(produceNodeAfterRetry.refused, false, 'retried node must not be refused');
  assert.equal(produceNodeAfterRetry.schedulerOutcome, 'materialized', 'retried node must remain materialized');
  assert.equal(produceNodeAfterRetry.refusedReason, null, 'retried node must not carry refusedReason');

  // Linking a new run with real RunResult on disk restores authoritative settlement
  const run2 = `run_${asgn1.assignmentId}_002`;
  writeSettledRunResult(tempDir, asgn1.assignmentId, run2);
  linkResult(coordinationId, { assignmentId: asgn1.assignmentId, runId: run2 }, { cwd: tempDir, repoRoot: tempDir, allowSupersede: true });

  replayed = replaySession(coordinationId, { cwd: tempDir, repoRoot: tempDir });
  assert.equal(getAuthoritativeSettledAssignmentIds(replayed.events).has(asgn1.assignmentId), true);
  assert.equal(replayed.dag.nodes.find((n) => n.nodeId === 'node-produce').settled, true);
});

// --------------------------------------------------------------------------
// 4. Corrupt declaration, fingerprint, or definition fails closed
// --------------------------------------------------------------------------

test('DAG evidence: corrupt declaration, fingerprint, or definition snapshot fails closed', () => {
  const tempDir = mkTempDir();
  writeFixture(tempDir);
  const coordinationId = 'd4-tampered-fp';

  const decl = compileDagRequest(validateCoordinationRequest(makeRequest({ coordinationId })));
  const manifest = openDeclaredProtocolSession(
    {
      coordinationId,
      objective: 'Tampered fp test',
      writerId: WRITER_ID,
      definitionId: DEFINITION_ID,
      schemaVersion: SCHEMA_VERSION_3,
      dagDeclaration: decl,
    },
    { cwd: tempDir, repoRoot: tempDir },
  );

  // 1. Tamper definition snapshot
  const paths = resolveSessionPaths(coordinationId, { cwd: tempDir, repoRoot: tempDir });
  const snapshotPath = path.join(paths.sessionDir, 'snapshot.json');
  fs.writeFileSync(snapshotPath, '{"broken":');

  assert.throws(
    () => loadDefinitionForSession(manifest, { cwd: tempDir, repoRoot: tempDir }),
    (err) => err instanceof CoordinationError && err.category === 'corrupt-log',
  );

  // Restore snapshot and tamper event log declaration fingerprint
  const cleanDef = JSON.parse(fs.readFileSync(path.join(tempDir, '.fgos', 'coordination-protocols', 'master-loop-driver-steps.json'), 'utf8'));
  fs.writeFileSync(snapshotPath, JSON.stringify(cleanDef));

  // Tamper dag-declared event in events.jsonl
  const rawEvents = fs.readFileSync(paths.eventsPath, 'utf8').trim().split('\n');
  const tamperedLines = rawEvents.map((line) => {
    const ev = JSON.parse(line);
    if (ev.type === 'dag-declared') {
      ev.payload.declaration.requestFingerprint = 'sha256:0000000000000000000000000000000000000000000000000000000000000000';
      return JSON.stringify(ev);
    }
    return line;
  }).join('\n') + '\n';
  fs.writeFileSync(paths.eventsPath, tamperedLines);

  assert.throws(
    () => replaySession(coordinationId, { cwd: tempDir, repoRoot: tempDir }),
    (err) => err instanceof CoordinationError && err.category === 'validation' && /requestFingerprint does not match normalized request/.test(err.message),
  );
});

// --------------------------------------------------------------------------
// 5. Scheduler error does not silently become 'no work'
// --------------------------------------------------------------------------

test('DAG evidence: scheduler error re-throws integrityError and fails closed through runCoordinationUseCase door', async () => {
  // Part A: Kernel scheduleDagSteps re-throws integrityError
  const req = makeRequest();
  const decl = compileDagRequest(validateCoordinationRequest(req));

  await assert.rejects(
    scheduleDagSteps({
      steps: req.steps,
      declaration: decl,
      execute: async () => {
        throw new CoordinationError('corrupt-log', 'unrecoverable storage corruption');
      },
    }),
    (err) => err instanceof CoordinationError && err.category === 'corrupt-log' && /unrecoverable storage corruption/.test(err.message),
  );

  // Part B: End-to-end runCoordinationUseCase with corrupt session state throws rather than returning no work
  const tempDir = mkTempDir();
  writeFixture(tempDir);
  const ctx = { cwd: tempDir, repoRoot: tempDir, runnerConfig: fakeExecutor(tempDir) };
  const coordinationId = 'd5-e2e-integrity-error';

  const e2eReq = makeRequest({ coordinationId });
  await runCoordinationUseCase(ctx, { requestObject: e2eReq });

  // Corrupt the events.jsonl with a truncated line
  const paths = resolveSessionPaths(coordinationId, { cwd: tempDir, repoRoot: tempDir });
  fs.appendFileSync(paths.eventsPath, '{"broken":true\n');

  // Next runCoordinationUseCase MUST rethrow EventLogError / fail closed rather than returning "no work"
  await assert.rejects(
    runCoordinationUseCase(ctx, { requestObject: e2eReq }),
    (err) => err instanceof EventLogError && err.category === 'corrupt-log',
  );
});

// --------------------------------------------------------------------------
// 6. Corrupt evidence cannot satisfy quorum, explicit close, or cell-closed disposition
// --------------------------------------------------------------------------

test('DAG evidence: corrupt or caveated evidence cannot satisfy quorum, explicit close, or cell-closed disposition', async () => {
  const tempDir = mkTempDir();
  writeFixture(tempDir);
  const ctx = { cwd: tempDir, repoRoot: tempDir, runnerConfig: fakeExecutor(tempDir) };
  const coordinationId = 'd6-close-refusal';

  // Run a session with 2 concurrent read-only peers sharing cwd (which attaches shared-cwd caveats)
  const req = makeRequest({
    coordinationId,
    steps: [
      produceStep(),
      reviewStep({ as: 'review', dependsOn: ['produce'] }),
      { ...produceStep({ as: 'produce-peer', targetActorId: 'fixer', operationId: 'revise-candidate', dependsOn: ['produce'] }) },
    ],
  });

  const runResult = await runCoordinationUseCase(ctx, { requestObject: req });

  // 1. Quorum evaluation on the session: quorum is evaluated directly via evaluateSessionQuorum
  const quorum = evaluateSessionQuorum(coordinationId, { cwd: tempDir, repoRoot: tempDir });
  assert.ok(Array.isArray(quorum.completed), 'quorum evaluation returns completed actor list');

  // 2. Attempt explicit close via closeCoordinationUseCase
  // Must refuse close because concurrent read-only nodes sharing cwd carry non-attributable-verdict caveats
  const closeResult = await closeCoordinationUseCase(ctx, {
    requestObject: { kind: 'close', coordinationId, authorizedBy: { type: 'driver', id: WRITER_ID }, reason: 'attempt close' },
  });
  assert.equal(closeResult.closed, false, 'caveated session must not close');
  assert.ok(/recheck-required/.test(closeResult.closeRefusalReason));

  // 3. Attempt to record cell-closed disposition throws
  assert.throws(
    () => recordDriverDisposition(
      coordinationId,
      {
        targetRef: runResult.steps[0].assignmentId,
        disposition: 'cell-closed',
        rationale: 'attempt cell closed',
        evidenceRefs: [],
        authorizedBy: { type: 'driver', id: WRITER_ID },
      },
      { cwd: tempDir, repoRoot: tempDir },
    ),
    (err) => err instanceof CoordinationError && /cannot record "cell-closed" disposition/.test(err.message),
  );
});

// --------------------------------------------------------------------------
// 7. Status separation across run and show projections
// --------------------------------------------------------------------------

test('DAG evidence: session status, session phase, scheduler outcome, and RunResult status remain distinct across run and show projections', async () => {
  const tempDir = mkTempDir();
  writeFixture(tempDir);
  // Executor emits status: 'failed' in agent-result.json
  const ctx = { cwd: tempDir, repoRoot: tempDir, runnerConfig: fakeExecutor(tempDir, 'failed') };
  const coordinationId = 'd7-status-separation';

  const req = makeRequest({
    coordinationId,
    steps: [produceStep()],
  });

  const result = await runCoordinationUseCase(ctx, { requestObject: req });
  assert.equal(result.status, 'running');
  assert.equal(result.steps.length, 1);

  // Platform Invariant: dependency settled does NOT mean dependency succeeded!
  // In DAG scheduler, the node settled (it reached a definitive RunResult).
  // But the agent result is failed.
  assert.equal(result.steps[0].schedulerOutcome, 'settled');

  const shown = showCoordinationUseCase({ cwd: tempDir, repoRoot: tempDir }, { id: coordinationId });
  const node = shown.dag.nodes.find((n) => n.nodeId === 'node-produce');
  assert.equal(node.sessionStatus, 'active', 'sessionStatus is distinct');
  assert.equal(node.sessionPhase, 'running', 'sessionPhase is distinct');
  assert.equal(node.schedulerOutcome, 'settled', 'schedulerOutcome is distinct');
  assert.equal(node.runResultStatus, 'failed', 'runResultStatus is distinct');

  // Verify that counts distinguish settled from settledFailed
  assert.equal(shown.dag.counts.settled, 1);
  assert.equal(shown.dag.counts.settledFailed, 1);
});

// --------------------------------------------------------------------------
// 8. Corrupt or missing RunResult on disk fails closed
// --------------------------------------------------------------------------

test(
  'DAG evidence: corrupt or missing RunResult on disk fails closed and cannot settle node or dispatch descendant',
  async () => {
    const tempDir = mkTempDir();
    writeFixture(tempDir);
    const coordinationId = 'missing-runresult-fails-closed';

    const decl = compileDagRequest(validateCoordinationRequest(makeRequest({ coordinationId })));
    openDeclaredProtocolSession(
      {
        coordinationId,
        objective: 'Missing run result probe',
        writerId: WRITER_ID,
        definitionId: DEFINITION_ID,
        schemaVersion: SCHEMA_VERSION_3,
        dagDeclaration: decl,
      },
      { cwd: tempDir, repoRoot: tempDir },
    );

    const asgn1 = createSessionAssignment(
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

    const ghostRunId = `run_${asgn1.assignmentId}_999`;
    // Deliberately do NOT write any result.json, run.json, or agent-result.json on disk.
    // Link the ghost runId directly in events.jsonl:
    linkResult(coordinationId, { assignmentId: asgn1.assignmentId, runId: ghostRunId }, { cwd: tempDir, repoRoot: tempDir });

    // In intended contract: showCoordinationUseCase must NOT project produce as settled when run artifacts are absent on disk.
    const shown = showCoordinationUseCase({ cwd: tempDir, repoRoot: tempDir }, { id: coordinationId });
    const produceNode = shown.dag.nodes.find((n) => n.nodeId === 'node-produce');
    assert.equal(produceNode.settled, false, 'node must not be settled when RunResult is absent on disk');
    assert.equal(produceNode.refused, true, 'node must be refused when RunResult is absent on disk');
    assert.equal(produceNode.schedulerOutcome, 'refused', 'schedulerOutcome must be refused when evidence is corrupt');
    assert.equal(produceNode.refusedReason, 'corrupt-evidence', 'refusedReason must be corrupt-evidence');

    // In intended contract: runCoordinationUseCase must fail closed and refuse to dispatch descendant
    const ctx = { cwd: tempDir, repoRoot: tempDir, runnerConfig: fakeExecutor(tempDir) };
    const runResult = await runCoordinationUseCase(ctx, { requestObject: makeRequest({ coordinationId }) });
    const reviewStepResult = runResult.steps.find((s) => s.as === 'review');
    assert.equal(reviewStepResult.schedulerOutcome, 'blocked', 'descendant must be blocked when predecessor lacks on-disk evidence');
  },
);

// --------------------------------------------------------------------------
// 9. Non-DAG quorum / fan-in evaluation with non-object result.json
// --------------------------------------------------------------------------

test('DAG evidence: non-DAG session with non-object result.json evaluates quorum without throwing and classifies branch as failed', async () => {
  const tempDir = mkTempDir();
  const coordinationId = 'non-dag-array-result-quorum';
  const { openStandaloneSession, dispatchPrimaryTask, closeSessionByQuorum, readLinkedRunResultFromDisk } = await import('../../src/runner/coordination/session-engine.mjs');
  openStandaloneSession({ coordinationId, objective: 'Non-DAG quorum test.', writerId: 'coordinator-1', primaryRole: 'researcher' }, { cwd: tempDir });
  const { assignment } = await dispatchPrimaryTask(
    coordinationId,
    {
      objective: 'Test objective for non-DAG quorum evaluation.',
      expectedOutputs: ['agent-result.json (status, summary)'],
      evidenceRequired: 'reported',
      writerId: 'coordinator-1',
    },
    { cwd: tempDir, repoRoot: tempDir, runnerConfig: fakeExecutor(tempDir) },
  );

  const resultPath = path.join(tempDir, '.fgos', 'assignments', assignment.assignmentId, 'runs', '01', 'result.json');
  // Write array JSON [] as result.json
  fs.writeFileSync(resultPath, '[]');

  // readLinkedRunResultFromDisk handles non-object gracefully via interpretRunResult without throwing
  const { events } = replaySession(coordinationId, { cwd: tempDir });
  const linkedEvent = events.find((e) => e.type === 'result-linked');
  const runId = linkedEvent.payload.runId;
  const runResult = readLinkedRunResultFromDisk(path.join(tempDir, '.fgos'), assignment.assignmentId, runId);
  assert.equal(runResult.status, 'no-evidence');
  assert.equal(runResult.confidence, 'failed');
  assert.equal(runResult.contractCorrupt, true);

  // evaluateSessionQuorum must not throw and must classify the branch as failed
  const quorum = evaluateSessionQuorum(coordinationId, { cwd: tempDir, repoRoot: tempDir });
  assert.equal(quorum.completed.length, 0);
  assert.equal(quorum.failed.length, 1);
  assert.equal(quorum.failed[0].actorId, 'primary');
  assert.equal(quorum.failed[0].assignmentId, assignment.assignmentId);

  // closeSessionByQuorum refuses close due to failed required actor
  assert.throws(
    () => closeSessionByQuorum(coordinationId, {}, { cwd: tempDir, repoRoot: tempDir }),
    (err) => err instanceof CoordinationError && /missing required actor\(s\)/.test(err.message),
  );
});
