// Cold Resume and Equivalence Verification
//
// Invariants verified:
// 1. Identical request resumes the same immutable DAG declaration with stable fingerprint.
// 2. Stable DAG fingerprint and node identities across formatting/canonicalization.
// 3. Semantically changed request refuses before mutation or dispatch (zero event leaks).
// 4. Definition, driver identity, or input drift refuses pre-mutation.
// 5. Already settled nodes are never redispatched.
// 6. In-flight, unlinked, or retried predecessors do not falsely settle descendants.
// 7. Clean process cold resume preserves settled node evidence and advances frontier.
// 8. Cancellation preserves valid evidence and blocks inadmissible successors.
// 9. No later event appears after fail-closed integrity detection.

import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import {
  openSession,
  createSessionAssignment,
  readManifest,
  readSessionEvents,
  resolveSessionPaths,
  recordRunRetry,
  linkResult,
  transitionSessionStatus,
  appendEvent,
} from '../../src/runner/coordination/store.mjs';
import {
  normalizeDagDeclaration,
  getAuthoritativeSettledAssignmentIds,
} from '../../src/runner/coordination/dag-declaration.mjs';
import { replaySession } from '../../src/runner/coordination/replay.mjs';
import {
  CoordinationError,
  SCHEMA_VERSION_3,
} from '../../src/runner/coordination/schema.mjs';
import { EventLogError } from '../../src/state/events.mjs';
import { cancelSession, openDeclaredProtocolSession } from '../../src/runner/coordination/session-engine.mjs';
import { runCoordinationUseCase } from '../../src/verbs/coordination/run.mjs';
import { showCoordinationUseCase } from '../../src/verbs/coordination/show.mjs';
import { compileDagRequest } from '../../src/verbs/coordination/dag-request-compiler.mjs';
import { validateCoordinationRequest } from '../../src/verbs/coordination/schema.mjs';
import { StoreError } from '../../src/state/store.mjs';
import { normalizeRunResultV2 } from '../../src/runner/dispatch/run-result.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DEFINITION_ID = 'test.coordination-protocol.master-loop-driver-steps';
const WRITER_ID = 'master-coordinator-1';

const tempDirs = [];
function mkTempDir(prefix = 'fgos-dag-resume-') {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

after(() => {
  for (const dir of tempDirs) {
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch {}
  }
});

function writeSettledRunResult(tempDir, assignmentId, runId, status = 'done') {
  const prefix = `run_${assignmentId}_`;
  const attemptStr = runId.startsWith(prefix) ? runId.slice(prefix.length) : '01';
  const runDir = path.join(tempDir, '.fgos', 'assignments', assignmentId, 'runs', attemptStr);
  fs.mkdirSync(runDir, { recursive: true });
  const resultPayload = normalizeRunResultV2({
    runId,
    assignmentId,
    agentClaim: { status: status === 'done' ? 'done' : 'failed', summary: 'Settled run result.' },
    confidenceLevel: status === 'done' ? 'reported' : 'failed',
    runtime: { exitCode: status === 'done' ? 0 : 1 },
    evidence: { summary: 'Settled run result.' },
  });
  fs.writeFileSync(path.join(runDir, 'result.json'), `${JSON.stringify(resultPayload, null, 2)}\n`);
  fs.writeFileSync(path.join(runDir, 'run.json'), JSON.stringify({ runId, assignmentId, status, cwd: tempDir, exitCode: status === 'done' ? 0 : 1, createdAt: new Date().toISOString() }));
  fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ status, summary: 'Settled run result.' }));
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
    fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Report\\nExecuted.\\n');
    fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'Executed.' }));
    process.stdout.write('Executed.\\n');
    `,
  );
  return { executor: { allowCrossProvider: true, command: process.execPath, args: [executorScript, '{prompt}'] }, modelPolicies: { claude: { standard: 'test-model', nano: 'test-model', mini: 'test-model', advanced: 'test-model', flagship: 'test-model', frontier: 'test-model' } }, rigorToTier: { low: 'nano', standard: 'standard', high: 'flagship', critical: 'frontier' }, timeoutMs: 10000 };
}

function setupHarness() {
  const tempDir = mkTempDir();
  writeFixture(tempDir);
  return { tempDir, ctx: { cwd: tempDir, repoRoot: tempDir, runnerConfig: fakeExecutor(tempDir) } };
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
    contextRefs: ['$ref:produce'],
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
    objective: 'DAG cold resume test.',
    writerId: WRITER_ID,
    protocolRef: { id: DEFINITION_ID },
    actors: defaultActors(),
    steps: [produceStep(), reviewStep()],
    ...overrides,
  };
}

function eventsRaw(tempDir, coordinationId) {
  return fs.readFileSync(path.join(tempDir, '.fgos', 'coordination', 'sessions', coordinationId, 'events.jsonl'), 'utf8');
}

// --------------------------------------------------------------------------
// B1: Identical request resumes the same immutable DAG declaration
// --------------------------------------------------------------------------

// --------------------------------------------------------------------------
// B1: Identical request resumes the same immutable DAG declaration
// --------------------------------------------------------------------------

test('DAG cold resume: identical request resumes the same immutable DAG declaration with stable fingerprint and node identities', async () => {
  const { tempDir, ctx } = setupHarness();
  const coordinationId = 'identical-resume';

  const initialReq = makeRequest({ coordinationId });
  const firstResult = await runCoordinationUseCase(ctx, { requestObject: initialReq });
  assert.equal(firstResult.coordinationId, coordinationId);
  assert.equal(firstResult.steps.length, 2);
  assert.equal(firstResult.steps[0].schedulerOutcome, 'settled');
  assert.equal(firstResult.steps[1].schedulerOutcome, 'settled');

  const firstReplay = replaySession(coordinationId, { cwd: tempDir, repoRoot: tempDir });
  const initialFp = firstReplay.dag.declaration.requestFingerprint;
  assert.ok(initialFp.startsWith('sha256:'));
  assert.deepEqual(
    firstReplay.dag.declaration.nodes.map((n) => n.id),
    ['node-produce', 'node-review'],
  );

  // Resume with identical request
  const resumeReq = makeRequest({ coordinationId });
  const secondResult = await runCoordinationUseCase(ctx, { requestObject: resumeReq });
  assert.equal(secondResult.coordinationId, coordinationId);

  const secondReplay = replaySession(coordinationId, { cwd: tempDir, repoRoot: tempDir });
  assert.equal(secondReplay.dag.declaration.requestFingerprint, initialFp);
  assert.deepEqual(
    secondReplay.dag.declaration.nodes.map((n) => n.id),
    ['node-produce', 'node-review'],
  );

  // Both steps carried forward as settled and resumed
  assert.equal(secondResult.steps[0].resumed, true);
  assert.equal(secondResult.steps[0].authoritativeSettled, true);
  assert.equal(secondResult.steps[1].resumed, true);
  assert.equal(secondResult.steps[1].authoritativeSettled, true);
});

// --------------------------------------------------------------------------
// B2: Stable DAG fingerprint across semantic key ordering
// --------------------------------------------------------------------------

test('DAG cold resume: stable DAG fingerprint across semantic key ordering and property sorting', () => {
  const stepA = {
    type: 'operation',
    as: 'produce',
    operationId: 'produce-candidate',
    targetActorId: 'doer',
    objective: 'Produce candidate code.',
    expectedOutputs: ['agent-result.json (status, summary)'],
    parameters: { z: 1, a: 2, m: { nestedB: true, nestedA: false } },
  };

  const stepB = {
    expectedOutputs: ['agent-result.json (status, summary)'],
    targetActorId: 'doer',
    operationId: 'produce-candidate',
    as: 'produce',
    type: 'operation',
    objective: 'Produce candidate code.',
    parameters: { a: 2, z: 1, m: { nestedA: false, nestedB: true } },
  };

  const req1 = {
    dag: true,
    kind: 'declared-protocol',
    steps: [stepA],
  };

  const req2 = {
    dag: true,
    kind: 'declared-protocol',
    steps: [stepB],
  };

  const decl1 = compileDagRequest(req1);
  const decl2 = compileDagRequest(req2);
  assert.equal(decl1.requestFingerprint, decl2.requestFingerprint);
  assert.equal(decl1.nodes[0].id, 'node-produce');
  assert.equal(decl2.nodes[0].id, 'node-produce');
});

// --------------------------------------------------------------------------
// B3: Semantically changed request refuses before mutation or dispatch
// --------------------------------------------------------------------------

test('DAG cold resume: semantically changed requests refuse pre-mutation with zero event log leakage', async () => {
  const { tempDir, ctx } = setupHarness();
  const coordinationId = 'semantic-drift';

  const baseReq = makeRequest({ coordinationId });
  await runCoordinationUseCase(ctx, { requestObject: baseReq });

  const rawBefore = eventsRaw(tempDir, coordinationId);

  // 1. Objective drift
  await assert.rejects(
    runCoordinationUseCase(ctx, {
      requestObject: makeRequest({
        coordinationId,
        steps: [produceStep({ objective: 'Changed objective completely.' }), reviewStep()],
      }),
    }),
    (err) => err instanceof StoreError && /declaration differs/.test(err.message),
  );
  assert.equal(eventsRaw(tempDir, coordinationId), rawBefore, 'objective drift must not append events');

  // 2. Target actor drift
  await assert.rejects(
    runCoordinationUseCase(ctx, {
      requestObject: makeRequest({
        coordinationId,
        steps: [produceStep({ targetActorId: 'fixer' }), reviewStep()],
      }),
    }),
    (err) => err instanceof StoreError && /declaration differs/.test(err.message),
  );
  assert.equal(eventsRaw(tempDir, coordinationId), rawBefore, 'actor drift must not append events');

  // 3. Added step drift
  await assert.rejects(
    runCoordinationUseCase(ctx, {
      requestObject: makeRequest({
        coordinationId,
        steps: [
          produceStep(),
          reviewStep(),
          {
            type: 'operation',
            as: 'recheck',
            operationId: 'reviewer-recheck',
            targetActorId: 'reviewer',
            objective: 'Recheck',
            expectedOutputs: ['agent-result.json'],
          },
        ],
      }),
    }),
    (err) => err instanceof StoreError && /declaration differs/.test(err.message),
  );
  assert.equal(eventsRaw(tempDir, coordinationId), rawBefore, 'added step must not append events');

  // 4. Removed step drift
  await assert.rejects(
    runCoordinationUseCase(ctx, {
      requestObject: makeRequest({
        coordinationId,
        steps: [produceStep()],
      }),
    }),
    (err) => err instanceof StoreError && /declaration differs/.test(err.message),
  );
  assert.equal(eventsRaw(tempDir, coordinationId), rawBefore, 'removed step must not append events');

  // 5. Dependency drift
  await assert.rejects(
    runCoordinationUseCase(ctx, {
      requestObject: makeRequest({
        coordinationId,
        steps: [produceStep(), reviewStep({ contextRefs: [] })],
      }),
    }),
    (err) => err instanceof StoreError && /declaration differs/.test(err.message),
  );
  assert.equal(eventsRaw(tempDir, coordinationId), rawBefore, 'dependency drift must not append events');
});

// --------------------------------------------------------------------------
// B4: Driver identity drift and definition snapshot drift refuse pre-mutation
// --------------------------------------------------------------------------

test('DAG cold resume: driver identity drift and snapshot tampering refuse pre-mutation', async () => {
  const { tempDir, ctx } = setupHarness();
  const coordinationId = 'driver-drift';

  const baseReq = makeRequest({ coordinationId });
  await runCoordinationUseCase(ctx, { requestObject: baseReq });

  const rawBefore = eventsRaw(tempDir, coordinationId);

  // 1. Driver identity drift (alien writer attempting to resume)
  await assert.rejects(
    runCoordinationUseCase(ctx, {
      requestObject: makeRequest({ coordinationId, writerId: 'alien-impostor' }),
    }),
    (err) => err instanceof CoordinationError && /is not the driver identity/.test(err.message),
  );
  assert.equal(eventsRaw(tempDir, coordinationId), rawBefore, 'driver drift must not append events');

  // 2. Snapshot tampering
  const paths = resolveSessionPaths(coordinationId, { cwd: tempDir, repoRoot: tempDir });
  const snapshotPath = path.join(paths.sessionDir, 'snapshot.json');
  fs.writeFileSync(snapshotPath, JSON.stringify({ tampered: true }));

  await assert.rejects(
    runCoordinationUseCase(ctx, {
      requestObject: makeRequest({ coordinationId }),
    }),
    (err) => err instanceof CoordinationError && err.category === 'corrupt-log' && /snapshot digest mismatch/.test(err.message),
  );
  assert.equal(eventsRaw(tempDir, coordinationId), rawBefore, 'snapshot corruption must not append events');
});

// --------------------------------------------------------------------------
// B5: Already settled nodes are not redispatched
// --------------------------------------------------------------------------

test('DAG cold resume: already settled nodes are never redispatched on resume', async () => {
  const { tempDir, ctx } = setupHarness();
  const coordinationId = 'settled-no-redispatch';

  const req = makeRequest({ coordinationId });
  await runCoordinationUseCase(ctx, { requestObject: req });

  const eventsFirst = readSessionEvents(coordinationId, { cwd: tempDir, repoRoot: tempDir });
  const produceAssignmentsFirst = eventsFirst.filter((e) => e.type === 'assignment-created');
  assert.equal(produceAssignmentsFirst.length, 2, 'two assignments created during first run');

  // Resume the session
  const resumeResult = await runCoordinationUseCase(ctx, { requestObject: req });

  const eventsSecond = readSessionEvents(coordinationId, { cwd: tempDir, repoRoot: tempDir });
  const produceAssignmentsSecond = eventsSecond.filter((e) => e.type === 'assignment-created');
  assert.equal(produceAssignmentsSecond.length, 2, 'no new assignments must be created on resume');

  // Verify node results
  for (const step of resumeResult.steps) {
    assert.equal(step.resumed, true);
    assert.equal(step.authoritativeSettled, true);
    assert.equal(step.settled, true);
  }
});

// --------------------------------------------------------------------------
// B6: In-flight, unlinked, or retried predecessors do not falsely settle descendants
// --------------------------------------------------------------------------

test('DAG cold resume: in-flight or retried predecessors do not falsely settle descendants', async () => {
  const { tempDir, ctx } = setupHarness();
  const coordinationId = 'unsettled-predecessors';

  // Open declared protocol session with DAG declaration
  const decl = compileDagRequest(makeRequest());
  const manifest = openDeclaredProtocolSession(
    {
      coordinationId,
      objective: 'Unsettled predecessors test',
      writerId: WRITER_ID,
      definitionId: DEFINITION_ID,
      schemaVersion: SCHEMA_VERSION_3,
      dagDeclaration: decl,
      actors: defaultActors(),
    },
    { cwd: tempDir, repoRoot: tempDir },
  );

  // Create assignment for 'produce' (node-produce), but do NOT link result
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

  // Scenario 1: 'produce' is in-flight/unlinked
  const replayed1 = replaySession(coordinationId, { cwd: tempDir, repoRoot: tempDir });
  const settledIds1 = getAuthoritativeSettledAssignmentIds(replayed1.events);
  assert.equal(settledIds1.has(asgn1.assignmentId), false, 'unlinked assignment must not be settled');

  const shown1 = showCoordinationUseCase({ cwd: tempDir, repoRoot: tempDir }, { id: coordinationId });
  const produceNode1 = shown1.dag.nodes.find((n) => n.nodeId === 'node-produce');
  const reviewNode1 = shown1.dag.nodes.find((n) => n.nodeId === 'node-review');
  assert.equal(produceNode1.settled, false);
  assert.equal(reviewNode1.settled, false, 'review cannot settle while predecessor is unlinked');

  // Scenario 2: Link real result for produce, then record run retry
  const runId1 = `run_${asgn1.assignmentId}_001`;
  writeSettledRunResult(tempDir, asgn1.assignmentId, runId1);
  linkResult(coordinationId, { assignmentId: asgn1.assignmentId, runId: runId1 }, { cwd: tempDir, repoRoot: tempDir });
  const replayedAfterLink = replaySession(coordinationId, { cwd: tempDir, repoRoot: tempDir });
  const settledIdsAfterLink = getAuthoritativeSettledAssignmentIds(replayedAfterLink.events);
  assert.equal(settledIdsAfterLink.has(asgn1.assignmentId), true, 'linked assignment is initially settled');

  // Now record run retry on produce's assignment
  recordRunRetry(
    coordinationId,
    { assignmentId: asgn1.assignmentId, runId: runId1, retryAttempt: 1, reason: 'flaky failure' },
    { cwd: tempDir, repoRoot: tempDir },
  );

  const replayedAfterRetry = replaySession(coordinationId, { cwd: tempDir, repoRoot: tempDir });
  const settledIdsAfterRetry = getAuthoritativeSettledAssignmentIds(replayedAfterRetry.events);
  assert.equal(
    settledIdsAfterRetry.has(asgn1.assignmentId),
    false,
    'retried assignment must be removed from authoritative settled set',
  );

  const shownAfterRetry = showCoordinationUseCase({ cwd: tempDir, repoRoot: tempDir }, { id: coordinationId });
  const produceNode2 = shownAfterRetry.dag.nodes.find((n) => n.nodeId === 'node-produce');
  const reviewNode2 = shownAfterRetry.dag.nodes.find((n) => n.nodeId === 'node-review');
  assert.equal(produceNode2.settled, false, 'retried node is not settled');
  assert.equal(produceNode2.refused, false, 'retried node must not be refused');
  assert.equal(produceNode2.schedulerOutcome, 'materialized', 'retried node must remain materialized');
  assert.equal(produceNode2.refusedReason, null, 'retried node must not carry refusedReason');
  assert.equal(reviewNode2.settled, false, 'descendant review node must not be settled when predecessor was retried');
});

// --------------------------------------------------------------------------
// Clean process cold resume preserves settled node evidence and advances frontier
// --------------------------------------------------------------------------

test('DAG cold resume: clean process cold resume preserves settled node evidence and advances frontier', async () => {
  const { tempDir } = setupHarness();
  const coordinationId = 'cold-frontier-advance';
  const { spawn } = await import('node:child_process');

  const coldReq = makeRequest({ coordinationId, objective: 'DAG cold resume frontier test.' });
  const validReq = validateCoordinationRequest(coldReq);
  const decl = compileDagRequest(validReq);

  // Set up gate files for executor midway blocking
  const gateSignalPath = path.join(tempDir, 'executor-started.signal');
  const gateReleasePath = path.join(tempDir, 'executor-release.signal');

  // Gated executor: produce blocks on gateReleasePath until driver is terminated
  const executorScript = path.join(tempDir, 'gated-executor.mjs');
  fs.writeFileSync(
    executorScript,
    `
    import fs from 'node:fs';
    import path from 'node:path';
    const prompt = process.argv[2] ?? '';
    const assignmentId = prompt.match(/^Assignment: (.+)$/m)?.[1];
    if (!assignmentId) throw new Error('missing assignmentId');
    const runsDir = path.join(process.cwd(), '.fgos', 'assignments', assignmentId, 'runs');
    const run = fs.readdirSync(runsDir).sort().at(-1);
    const runDir = path.join(runsDir, run);

    if (prompt.includes('Produce candidate') && !fs.existsSync(${JSON.stringify(gateReleasePath)})) {
      fs.writeFileSync(${JSON.stringify(gateSignalPath)}, assignmentId);
      const start = Date.now();
      const sharedBuffer = new SharedArrayBuffer(4);
      const sharedInt = new Int32Array(sharedBuffer);
      while (!fs.existsSync(${JSON.stringify(gateReleasePath)})) {
        if (Date.now() - start > 10000) break;
        Atomics.wait(sharedInt, 0, 0, 20);
      }
    }

    fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Report\\nDone.\\n');
    fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'Done.' }));
    process.stdout.write('Executed.\\n');
    `,
  );

  const runnerConfig = { executor: { allowCrossProvider: true, command: process.execPath, args: [executorScript, '{prompt}'] }, modelPolicies: { claude: { standard: 'm', nano: 'm', mini: 'm', advanced: 'm', flagship: 'm', frontier: 'm' } }, rigorToTier: { low: 'nano', standard: 'standard', high: 'flagship', critical: 'frontier' }, timeoutMs: 10000 };

  // Driver script to be spawned and terminated midway
  const driverScript = path.join(tempDir, 'driver-runner.mjs');
  fs.writeFileSync(
    driverScript,
    `
    import { runCoordinationUseCase } from ${JSON.stringify(path.join(REPO_ROOT, 'src/verbs/coordination/run.mjs'))};
    const req = ${JSON.stringify(coldReq)};
    const ctx = {
      cwd: ${JSON.stringify(tempDir)},
      repoRoot: ${JSON.stringify(tempDir)},
      runnerConfig: ${JSON.stringify(runnerConfig)},
    };
    try {
      await runCoordinationUseCase(ctx, { requestObject: req });
    } catch (err) {
      process.stderr.write(err.stack);
      process.exit(1);
    }
    `,
  );

  // Spawn driver process
  const driverChild = spawn(process.execPath, [driverScript], { cwd: tempDir, stdio: ['ignore', 'pipe', 'pipe'] });

  // Wait for executor to reach gate (produce assignment is in-flight)
  const startWait = Date.now();
  while (!fs.existsSync(gateSignalPath)) {
    if (Date.now() - startWait > 10000) throw new Error('Timeout waiting for executor to reach gate');
    await new Promise((r) => setTimeout(r, 20));
  }

  // Verify session state mid-flight: assignment created, but result not yet linked
  const midEvents = readSessionEvents(coordinationId, { cwd: tempDir, repoRoot: tempDir });
  const midProduce = midEvents.filter((e) => e.type === 'assignment-created' && e.payload?.dagNodeId === 'node-produce');
  assert.equal(midProduce.length, 1, 'assignment for produce was created');
  const midLinked = midEvents.filter((e) => e.type === 'result-linked');
  assert.equal(midLinked.length, 0, 'result has not been linked yet');

  // Terminate driver process midway via SIGKILL
  driverChild.kill('SIGKILL');
  const exitSignal = await new Promise((resolve) => driverChild.on('close', (code, signal) => resolve(signal)));
  assert.equal(exitSignal, 'SIGKILL', 'driver process was terminated midway');

  // Release gate
  fs.writeFileSync(gateReleasePath, 'released');

  // Assert post-crash state: in-flight node is NOT considered settled
  const postCrashShown = showCoordinationUseCase({ cwd: tempDir, repoRoot: tempDir }, { id: coordinationId });
  const produceNodePost = postCrashShown.dag.nodes.find((n) => n.nodeId === 'node-produce');
  const reviewNodePost = postCrashShown.dag.nodes.find((n) => n.nodeId === 'node-review');
  assert.equal(produceNodePost.settled, false, 'in-flight node must NOT be considered settled after driver crash');
  assert.equal(reviewNodePost.settled, false, 'descendant must NOT be considered settled');

  // Link the completed run result for produce
  const inFlightAssignmentId = fs.readFileSync(gateSignalPath, 'utf8').trim();
  const runId = `run_${inFlightAssignmentId}_01`;
  writeSettledRunResult(tempDir, inFlightAssignmentId, runId);
  linkResult(coordinationId, { assignmentId: inFlightAssignmentId, runId }, { cwd: tempDir, repoRoot: tempDir });

  // Spawn an external clean Node subprocess simulating a cold resume that executes the DAG
  const probeScript = path.join(tempDir, 'cold-probe.mjs');
  fs.writeFileSync(
    probeScript,
    `
    import { runCoordinationUseCase } from ${JSON.stringify(path.join(REPO_ROOT, 'src/verbs/coordination/run.mjs'))};
    import { showCoordinationUseCase } from ${JSON.stringify(path.join(REPO_ROOT, 'src/verbs/coordination/show.mjs'))};
    const req = ${JSON.stringify(coldReq)};
    const ctx = {
      cwd: ${JSON.stringify(tempDir)},
      repoRoot: ${JSON.stringify(tempDir)},
      runnerConfig: ${JSON.stringify(runnerConfig)},
    };
    const resumed = await runCoordinationUseCase(ctx, { requestObject: req });
    const shown = showCoordinationUseCase({ cwd: ${JSON.stringify(tempDir)}, repoRoot: ${JSON.stringify(tempDir)} }, { id: ${JSON.stringify(coordinationId)} });
    process.stdout.write(JSON.stringify({ resumedSteps: resumed.steps, dag: shown.dag }));
    `,
  );

  const spawned = spawnSync(process.execPath, [probeScript], { encoding: 'utf8', timeout: 15000 });
  assert.equal(spawned.status, 0, `cold probe failed: ${spawned.stderr}`);
  const result = JSON.parse(spawned.stdout);

  assert.equal(result.dag.kind, 'dag');
  assert.equal(result.dag.declaration.requestFingerprint, decl.requestFingerprint);
  const coldProduce = result.dag.nodes.find((n) => n.nodeId === 'node-produce');
  const coldReview = result.dag.nodes.find((n) => n.nodeId === 'node-review');
  assert.equal(coldProduce.settled, true, 'produce is settled in final state');
  assert.equal(coldReview.settled, true, 'review is settled in final state');

  // Verify no duplicate assignments across entire session lifecycle
  const finalEvents = readSessionEvents(coordinationId, { cwd: tempDir, repoRoot: tempDir });
  const finalProduceAssignments = finalEvents.filter((e) => e.type === 'assignment-created' && e.payload?.dagNodeId === 'node-produce');
  const finalReviewAssignments = finalEvents.filter((e) => e.type === 'assignment-created' && e.payload?.dagNodeId === 'node-review');
  assert.equal(finalProduceAssignments.length, 1, 'no duplicate assignments for produce across cold resume');
  assert.equal(finalReviewAssignments.length, 1, 'exactly 1 assignment for review');

  // Produce step was recognized as resumed without double-dispatch; review was dispatched and settled
  const produceStepResult = result.resumedSteps.find((s) => s.as === 'produce');
  const reviewStepResult = result.resumedSteps.find((s) => s.as === 'review');
  assert.equal(produceStepResult.resumed, true, 'produce was recognized as resumed');
  assert.equal(reviewStepResult.schedulerOutcome, 'settled', 'review was dispatched and settled');
});

// --------------------------------------------------------------------------
// B8: Cancellation preserves valid evidence and blocks inadmissible successors
// --------------------------------------------------------------------------

test('DAG cold resume: cancellation preserves valid evidence and blocks inadmissible successors', async () => {
  const { tempDir, ctx } = setupHarness();
  const coordinationId = 'cancellation-preservation';

  const validReq = validateCoordinationRequest(makeRequest({ coordinationId }));
  const decl = compileDagRequest(validReq);
  openDeclaredProtocolSession(
    {
      coordinationId,
      objective: 'Cancellation test',
      writerId: WRITER_ID,
      definitionId: DEFINITION_ID,
      schemaVersion: SCHEMA_VERSION_3,
      dagDeclaration: decl,
    },
    { cwd: tempDir, repoRoot: tempDir },
  );

  // Settle produce with real RunResult on disk
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
  const runIdB8 = `run_${asgn1.assignmentId}_001`;
  writeSettledRunResult(tempDir, asgn1.assignmentId, runIdB8);
  linkResult(coordinationId, { assignmentId: asgn1.assignmentId, runId: runIdB8 }, { cwd: tempDir, repoRoot: tempDir });

  // Cancel the session
  cancelSession(coordinationId, { reason: 'operator intervention' }, { cwd: tempDir, repoRoot: tempDir });

  const manifest = readManifest(coordinationId, { cwd: tempDir, repoRoot: tempDir });
  assert.equal(manifest.status, 'cancelled');

  // Prior evidence is preserved
  const replayed = replaySession(coordinationId, { cwd: tempDir, repoRoot: tempDir });
  assert.equal(replayed.manifest.status, 'cancelled');
  const produceNode = replayed.dag.nodes.find((n) => n.nodeId === 'node-produce');
  assert.equal(produceNode.settled, true);
  const produceResult = replayed.results.find((r) => r.assignmentId === asgn1.assignmentId);
  assert.equal(produceResult.runId, runIdB8);

  // Attempting to resume runCoordinationUseCase on cancelled session:
  // Successor 'review' cannot be admitted because canAdmit checks status === 'active'
  const runRes = await runCoordinationUseCase(ctx, { requestObject: makeRequest({ coordinationId }) });
  const reviewResult = runRes.steps.find((s) => s.as === 'review');
  assert.equal(reviewResult.schedulerOutcome, 'blocked');
  assert.deepEqual(reviewResult.blockedBy, ['terminal-session']);

  // Ensure no assignment was created for review
  const finalEvents = readSessionEvents(coordinationId, { cwd: tempDir, repoRoot: tempDir });
  const reviewAssignments = finalEvents.filter((e) => e.type === 'assignment-created' && e.payload?.dagNodeId === 'node-review');
  assert.equal(reviewAssignments.length, 0, 'cancelled session must never dispatch successor assignments');
});

// --------------------------------------------------------------------------
// B9: Fail-closed integrity detection prevents subsequent events
// --------------------------------------------------------------------------

test('DAG cold resume: fail-closed integrity detection halts processing and appends zero events', async () => {
  const { tempDir, ctx } = setupHarness();
  const coordinationId = 'fail-closed-halts';

  const baseReq = makeRequest({ coordinationId });
  await runCoordinationUseCase(ctx, { requestObject: baseReq });

  const paths = resolveSessionPaths(coordinationId, { cwd: tempDir, repoRoot: tempDir });
  // Append a corrupted JSON line to events.jsonl
  fs.appendFileSync(paths.eventsPath, '{"type":"corrupt-line-without-closing-brace\n');

  const rawBeforeFail = eventsRaw(tempDir, coordinationId);

  await assert.rejects(
    runCoordinationUseCase(ctx, { requestObject: makeRequest({ coordinationId }) }),
    (err) => err instanceof EventLogError && err.category === 'corrupt-log',
  );

  assert.equal(eventsRaw(tempDir, coordinationId), rawBeforeFail, 'no new event must be appended after corrupt-log failure');
});
