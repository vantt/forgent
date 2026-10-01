// Concurrency and Scheduler Determinism Verification
//
// Invariants verified:
// 1. Independent read-only nodes overlap concurrently and share overlapGroup.
// 2. Dependency edges strictly prevent early dispatch before predecessors settle.
// 3. Diamond fan-in waits for every authoritative predecessor to settle.
// 4. Concurrency cap is the ONLY deferrable admission refusal (transient deferral -> retry on settlement).
// 5. Max assignments, rounds, depth, wall time and mutation/fan-out are not mislabeled as concurrency deferral.
// 6. Identical concurrent writers serialize and idempotently reuse evidence.
// 7. Conflicting writers fail before duplicate mutation or external dispatch.
// 8. Actor replacement/retry cannot double-dispatch or lose scheduler state.
// 9. External in-flight work produces bounded concurrency behavior.

import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import {
  createSessionAssignment,
  readManifest,
  readSessionEvents,
  recordRunRetry,
  linkResult,
  resolveSessionPaths,
} from '../../src/runner/coordination/store.mjs';
import {
  getAuthoritativeSettledAssignmentIds,
} from '../../src/runner/coordination/dag-declaration.mjs';
import { replaySession } from '../../src/runner/coordination/replay.mjs';
import {
  CoordinationError,
  SCHEMA_VERSION_3,
} from '../../src/runner/coordination/schema.mjs';
import { openDeclaredProtocolSession, replaceSessionActor } from '../../src/runner/coordination/session-engine.mjs';
import { runCoordinationUseCase } from '../../src/verbs/coordination/run.mjs';
import { showCoordinationUseCase } from '../../src/verbs/coordination/show.mjs';
import { scheduleDagSteps } from '../../src/verbs/coordination/dag-scheduler.mjs';
import { compileDagRequest } from '../../src/verbs/coordination/dag-request-compiler.mjs';
import { validateCoordinationRequest } from '../../src/verbs/coordination/schema.mjs';
import { StoreError } from '../../src/state/store.mjs';
import { normalizeRunResultV2 } from '../../src/runner/dispatch/run-result.mjs';

const REPO_ROOT = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
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

function mkTempDir(prefix = 'fgos-dag-concurrency-') {
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
        { id: 'join-candidate', role: 'reviewer', result: advisory },
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
            transitions: ['phase-join'],
          },
          {
            id: 'phase-join',
            operations: [{ ref: 'join-candidate', actor: 'reviewer' }],
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

function barrierExecutor(tempDir, barrierDir) {
  const executorScript = path.join(tempDir, `barrier-executor-${Math.random().toString(36).slice(2)}.mjs`);
  fs.mkdirSync(barrierDir, { recursive: true });
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

    if (prompt.includes('BARRIER PEER')) {
      const myMarker = path.join(${JSON.stringify(barrierDir)}, assignmentId);
      fs.writeFileSync(myMarker, 'ready');
      const start = Date.now();
      const sharedBuffer = new SharedArrayBuffer(4);
      const sharedInt = new Int32Array(sharedBuffer);
      while (fs.readdirSync(${JSON.stringify(barrierDir)}).length < 2) {
        if (Date.now() - start > 4000) throw new Error('Barrier timeout: peers did not run concurrently');
        Atomics.wait(sharedInt, 0, 0, 10);
      }
    }

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

function redTeamStep(overrides = {}) {
  return {
    type: 'operation',
    as: 'red-team',
    operationId: 'red-team-candidate',
    targetActorId: 'red-team',
    objective: 'Red team candidate code.',
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
    objective: 'DAG concurrency test.',
    writerId: WRITER_ID,
    protocolRef: { id: DEFINITION_ID },
    actors: defaultActors(),
    steps: [produceStep(), reviewStep({ contextRefs: ['$ref:produce'] })],
    ...overrides,
  };
}

// --------------------------------------------------------------------------
// 1. Independent read-only peer nodes overlap concurrently
// --------------------------------------------------------------------------

test('DAG concurrency: independent read-only peer nodes overlap concurrently and share overlapGroup', async () => {
  const tempDir = mkTempDir();
  writeFixture(tempDir);
  const barrierDir = path.join(tempDir, 'c1-barrier');
  const ctx = { cwd: tempDir, repoRoot: tempDir, runnerConfig: barrierExecutor(tempDir, barrierDir) };
  const coordinationId = 'c1-overlap';

  // 1 produce step -> 2 concurrent peer steps (review and red-team)
  const req = makeRequest({
    coordinationId,
    steps: [
      produceStep(),
      reviewStep({ objective: 'BARRIER PEER 1 review.', dependsOn: ['produce'] }),
      redTeamStep({ objective: 'BARRIER PEER 2 red team.', dependsOn: ['produce'] }),
    ],
  });

  const result = await runCoordinationUseCase(ctx, { requestObject: req });
  assert.equal(result.steps.length, 3);
  for (const step of result.steps) {
    assert.equal(step.schedulerOutcome, 'settled');
  }

  // The barrier proved both were in-flight simultaneously.
  // Now verify overlapGroup metadata in result:
  const reviewStepResult = result.steps.find((s) => s.as === 'review');
  const redTeamStepResult = result.steps.find((s) => s.as === 'red-team');
  assert.ok(reviewStepResult.overlapGroup, 'review step must carry overlapGroup');
  assert.ok(redTeamStepResult.overlapGroup, 'red-team step must carry overlapGroup');
  assert.equal(reviewStepResult.overlapGroup.id, redTeamStepResult.overlapGroup.id);
  assert.deepEqual(reviewStepResult.overlapGroup.nodeLabels.sort(), ['red-team', 'review']);
});

// --------------------------------------------------------------------------
// 2. Dependency edges prevent early dispatch
// --------------------------------------------------------------------------

test('DAG concurrency: dependency edges prevent early dispatch before predecessor settles', async () => {
  const tempDir = mkTempDir();
  writeFixture(tempDir);
  const ctx = { cwd: tempDir, repoRoot: tempDir, runnerConfig: fakeExecutor(tempDir) };
  const coordinationId = 'c2-dependency-prevention';

  const req = makeRequest({
    coordinationId,
    steps: [
      produceStep(),
      reviewStep({ dependsOn: ['produce'] }),
    ],
  });

  await runCoordinationUseCase(ctx, { requestObject: req });

  // Read event log and verify strictly ordered sequence
  const events = readSessionEvents(coordinationId, { cwd: tempDir, repoRoot: tempDir });
  const produceCreatedIdx = events.findIndex((e) => e.type === 'assignment-created' && e.payload?.dagNodeId === 'node-produce');
  const produceLinkedIdx = events.findIndex((e) => e.type === 'result-linked' && e.payload?.assignmentId === events[produceCreatedIdx].payload.assignmentId);
  const reviewCreatedIdx = events.findIndex((e) => e.type === 'assignment-created' && e.payload?.dagNodeId === 'node-review');

  assert.ok(produceCreatedIdx >= 0, 'produce assignment created');
  assert.ok(produceLinkedIdx >= 0, 'produce result linked');
  assert.ok(reviewCreatedIdx >= 0, 'review assignment created');

  assert.ok(
    produceLinkedIdx < reviewCreatedIdx,
    `produce result-linked (index ${produceLinkedIdx}) must occur strictly before review assignment-created (index ${reviewCreatedIdx})`,
  );
});

// --------------------------------------------------------------------------
// 3. Diamond fan-in waits for every authoritative predecessor
// --------------------------------------------------------------------------

test('DAG concurrency: diamond fan-in waits for every predecessor before admitting join', async () => {
  const tempDir = mkTempDir();
  writeFixture(tempDir);
  const ctx = { cwd: tempDir, repoRoot: tempDir, runnerConfig: fakeExecutor(tempDir) };
  const coordinationId = 'c3-diamond-fanin';

  // Diamond shape:
  //      produce
  //      /     \
  //   review  red-team
  //      \     /
  //       join (join-candidate)
  const req = makeRequest({
    coordinationId,
    steps: [
      produceStep(),
      reviewStep({ as: 'review', dependsOn: ['produce'] }),
      redTeamStep({ as: 'red-team', dependsOn: ['produce'] }),
      {
        type: 'operation',
        as: 'join',
        operationId: 'join-candidate',
        targetActorId: 'reviewer',
        objective: 'Join diamond.',
        expectedOutputs: ['agent-result.json'],
        dependsOn: ['review', 'red-team'],
      },
    ],
  });

  const result = await runCoordinationUseCase(ctx, { requestObject: req });
  assert.equal(result.steps.length, 4);
  assert.equal(result.steps.find((s) => s.as === 'join').schedulerOutcome, 'settled');

  const events = readSessionEvents(coordinationId, { cwd: tempDir, repoRoot: tempDir });
  const reviewLinked = events.find((e) => e.type === 'result-linked' && e.payload?.assignmentId?.includes('reviewer'));
  const redTeamLinked = events.find((e) => e.type === 'result-linked' && e.payload?.assignmentId?.includes('red_team'));
  const joinCreated = events.find((e) => e.type === 'assignment-created' && e.payload?.dagNodeId === 'node-join');

  const reviewLinkedIdx = events.indexOf(reviewLinked);
  const redTeamLinkedIdx = events.indexOf(redTeamLinked);
  const joinCreatedIdx = events.indexOf(joinCreated);

  assert.ok(joinCreatedIdx > reviewLinkedIdx, 'join must be created after review is linked');
  assert.ok(joinCreatedIdx > redTeamLinkedIdx, 'join must be created after red-team is linked');
});

// --------------------------------------------------------------------------
// 4. Concurrency cap is the only deferrable admission refusal
// --------------------------------------------------------------------------

test('DAG concurrency: concurrency cap is the only deferrable admission refusal and retries upon settlement', async () => {
  // Part A: Direct scheduler test verifying concurrency-cap deferral and dynamic retry on settlement
  const rawSteps = [
    { type: 'operation', as: 'peer-a', operationId: 'review-candidate', targetActorId: 'reviewer', objective: 'A', expectedOutputs: ['agent-result.json'] },
    { type: 'operation', as: 'peer-b', operationId: 'red-team-candidate', targetActorId: 'red-team', objective: 'B', expectedOutputs: ['agent-result.json'] },
  ];
  const reqDecl = compileDagRequest({
    kind: 'declared-protocol',
    dag: true,
    steps: rawSteps,
  });

  let peerBAttempt = 0;
  let peerACompleted = false;

  const scheduledResults = await scheduleDagSteps({
    steps: rawSteps,
    declaration: reqDecl,
    execute: async (step) => {
      if (step.as === 'peer-a') {
        // peer-a runs for 30ms then settles
        await new Promise((resolve) => setTimeout(resolve, 30));
        peerACompleted = true;
        return { authoritativeSettled: true, settled: true };
      }
      if (step.as === 'peer-b') {
        peerBAttempt += 1;
        if (!peerACompleted) {
          // Throws concurrency-cap before peer-a settles
          throw new CoordinationError('validation', 'Capacity full: 1 running', 'concurrency-cap');
        }
        return { authoritativeSettled: true, settled: true };
      }
    },
  });

  // peer-b was deferred on attempt 1, reset to pending when peer-a settled, then admitted on attempt 2
  assert.equal(peerBAttempt, 2, 'peer-b was retried dynamically upon peer-a settlement');
  assert.equal(scheduledResults.find((s) => s.as === 'peer-a').outcome, 'settled');
  assert.equal(scheduledResults.find((s) => s.as === 'peer-b').outcome, 'settled');

  // Part B: Direct scheduler test verifying persistent deferral when capacity is never freed
  const unyieldingResults = await scheduleDagSteps({
    steps: rawSteps,
    declaration: reqDecl,
    execute: async (step) => {
      if (step.as === 'peer-a') {
        return { authoritativeSettled: true, settled: true };
      }
      if (step.as === 'peer-b') {
        throw new CoordinationError('validation', 'Permanent capacity block', 'concurrency-cap');
      }
    },
  });

  const unyieldingB = unyieldingResults.find((s) => s.as === 'peer-b');
  assert.equal(unyieldingB.outcome, 'deferred');
  assert.equal(unyieldingB.error.code, 'concurrency-cap');
  assert.equal(unyieldingB.error.category, 'validation');

  // Part C: End-to-end runCoordinationUseCase with aggregateBounds.maxConcurrency = 1
  const tempDir = mkTempDir();
  writeFixture(tempDir);
  const ctx = { cwd: tempDir, repoRoot: tempDir, runnerConfig: fakeExecutor(tempDir) };
  const coordinationId = 'c4-concurrency-cap';

  const req = makeRequest({
    coordinationId,
    aggregateBounds: { maxConcurrency: 1, maxAssignments: 10, maxRounds: 10, maxTaskDepth: 10, wallTimeMs: 60000 },
    steps: [
      produceStep(),
      reviewStep({ as: 'review', dependsOn: ['produce'] }),
      redTeamStep({ as: 'red-team', dependsOn: ['produce'] }),
    ],
  });

  const result = await runCoordinationUseCase(ctx, { requestObject: req });
  assert.equal(result.steps.length, 3);
  for (const step of result.steps) {
    assert.equal(step.schedulerOutcome, 'settled');
  }

  // Verify that the assignments ran sequentially due to maxConcurrency: 1
  const events = readSessionEvents(coordinationId, { cwd: tempDir, repoRoot: tempDir });
  const reviewCreated = events.findIndex((e) => e.type === 'assignment-created' && e.payload?.dagNodeId === 'node-review');
  const reviewLinked = events.findIndex((e) => e.type === 'result-linked' && e.payload?.assignmentId === events[reviewCreated].payload.assignmentId);
  const redTeamCreated = events.findIndex((e) => e.type === 'assignment-created' && e.payload?.dagNodeId === 'node-red-team');
  const redTeamLinked = events.findIndex((e) => e.type === 'result-linked' && e.payload?.assignmentId === events[redTeamCreated].payload.assignmentId);

  const ranReviewFirst = reviewLinked < redTeamCreated;
  const ranRedTeamFirst = redTeamLinked < reviewCreated;
  assert.ok(ranReviewFirst || ranRedTeamFirst, 'maxConcurrency 1 serialized the peers without failure');
});

// --------------------------------------------------------------------------
// 5. Non-concurrency bounds refusals are refused, never deferred
// --------------------------------------------------------------------------

test('DAG concurrency: non-concurrency bounds refusals (assignments, rounds, depth, wall time) are refused, never deferred', async () => {
  const tempDir = mkTempDir();
  writeFixture(tempDir);
  const ctx = { cwd: tempDir, repoRoot: tempDir, runnerConfig: fakeExecutor(tempDir) };

  // 1. maxAssignments refusal produces refused, NOT deferred
  const id1 = 'c5-max-assignments';
  const req1 = makeRequest({
    coordinationId: id1,
    aggregateBounds: { maxAssignments: 1, maxConcurrency: 5, maxRounds: 5, maxTaskDepth: 5, wallTimeMs: 60000 },
    steps: [
      produceStep(),
      reviewStep({ dependsOn: ['produce'] }),
    ],
  });
  const res1 = await runCoordinationUseCase(ctx, { requestObject: req1 });
  const reviewResult1 = res1.steps.find((s) => s.as === 'review');
  assert.equal(reviewResult1.schedulerOutcome, 'refused', 'maxAssignments refusal must have outcome refused');
  assert.notEqual(reviewResult1.schedulerOutcome, 'deferred', 'maxAssignments must never be marked deferred');
  assert.ok(reviewResult1.error, 'maxAssignments refusal must carry error evidence');
  assert.match(reviewResult1.error.message, /aggregateBounds\.maxAssignments/);

  // 2. maxRounds refusal produces refused, NOT deferred
  const id2 = 'c5-max-rounds';
  const req2 = makeRequest({
    coordinationId: id2,
    aggregateBounds: { maxAssignments: 10, maxConcurrency: 5, maxRounds: 1, maxTaskDepth: 5, wallTimeMs: 60000 },
    steps: [
      produceStep(),
      reviewStep({ dependsOn: ['produce'] }),
    ],
  });
  const res2 = await runCoordinationUseCase(ctx, { requestObject: req2 });
  const reviewResult2 = res2.steps.find((s) => s.as === 'review');
  assert.equal(reviewResult2.schedulerOutcome, 'refused', 'maxRounds refusal must have outcome refused');
  assert.notEqual(reviewResult2.schedulerOutcome, 'deferred', 'maxRounds must never be marked deferred');
  assert.ok(reviewResult2.error, 'maxRounds refusal must carry error evidence');
  assert.match(reviewResult2.error.message, /aggregateBounds\.maxRounds/);

  // 3. wallTimeMs refusal produces refused, NOT deferred
  const id3 = 'c5-walltime';
  // Open session first, then set createdAt 10 seconds in the past with wallTimeMs: 1
  const decl3 = compileDagRequest(validateCoordinationRequest(makeRequest({ coordinationId: id3 })));
  openDeclaredProtocolSession(
    {
      coordinationId: id3,
      objective: 'Wall time test',
      writerId: WRITER_ID,
      definitionId: DEFINITION_ID,
      schemaVersion: SCHEMA_VERSION_3,
      dagDeclaration: decl3,
      aggregateBounds: { wallTimeMs: 1, maxAssignments: 10, maxConcurrency: 5, maxRounds: 5, maxTaskDepth: 5 },
    },
    { cwd: tempDir, repoRoot: tempDir },
  );
  // Rewind createdAt in manifest to guarantee elapsed time exceeds wallTimeMs
  const { manifestPath } = resolveSessionPaths(id3, { cwd: tempDir, repoRoot: tempDir });
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  manifest.createdAt = new Date(Date.now() - 5000).toISOString();
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  const res3 = await runCoordinationUseCase(ctx, {
    requestObject: makeRequest({
      coordinationId: id3,
      aggregateBounds: { wallTimeMs: 1, maxAssignments: 10, maxConcurrency: 5, maxRounds: 5, maxTaskDepth: 5 },
    }),
  });
  assert.equal(res3.steps[0].schedulerOutcome, 'refused', 'wallTimeMs refusal must have outcome refused');
  assert.notEqual(res3.steps[0].schedulerOutcome, 'deferred', 'wallTimeMs must never be marked deferred');
  assert.ok(res3.steps[0].error, 'wallTimeMs refusal must carry error evidence');
  assert.match(res3.steps[0].error.message, /aggregateBounds\.wallTimeMs/);

  // 4. maxTaskDepth refusal produces refused, NOT deferred
  const id4 = 'c5-task-depth';
  const depthDefId = 'test.coordination-protocol.depth-check';
  const depthDef = {
    apiVersion: 'fgos.dev/v1alpha1',
    kind: 'FlowDefinition',
    metadata: { id: depthDefId, version: '1.0.0' },
    spec: {
      profile: {
        kind: 'CoordinationProtocol',
        topology: {
          edges: [
            { from: 'doer', to: 'reviewer', intents: ['review'] },
          ],
        },
      },
      roles: ['doer', 'reviewer'],
      actors: [
        { id: 'doer', role: 'doer' },
        { id: 'reviewer', role: 'reviewer' },
      ],
      operations: [
        { id: 'produce-candidate', role: 'doer', result: { kind: 'work-product', evidenceRequired: 'reported' } },
        { id: 'review-candidate', role: 'reviewer', result: { kind: 'advisory', evidenceRequired: 'reported' } },
      ],
      graph: {
        entry: 'phase-produce',
        nodes: [
          { id: 'phase-produce', operations: [{ ref: 'produce-candidate', actor: 'doer' }], transitions: ['phase-review'] },
          { id: 'phase-review', operations: [{ ref: 'review-candidate', actor: 'reviewer' }], transitions: [] },
        ],
      },
    },
  };
  fs.writeFileSync(
    path.join(tempDir, '.fgos', 'coordination-protocols', 'depth-protocol.json'),
    JSON.stringify(depthDef, null, 2),
  );

  const req4 = makeRequest({
    coordinationId: id4,
    protocolRef: { id: depthDefId },
    actors: [{ id: 'doer' }, { id: 'reviewer' }],
    aggregateBounds: { maxAssignments: 10, maxConcurrency: 5, maxRounds: 5, maxTaskDepth: 1, wallTimeMs: 60000 },
    steps: [
      produceStep(),
      reviewStep({ dependsOn: ['produce'], fromAssignmentId: '$ref:produce', intent: 'review' }),
    ],
  });
  const res4 = await runCoordinationUseCase(ctx, { requestObject: req4 });
  const reviewResult4 = res4.steps.find((s) => s.as === 'review');
  assert.equal(reviewResult4.schedulerOutcome, 'refused', 'maxTaskDepth refusal must have outcome refused');
  assert.notEqual(reviewResult4.schedulerOutcome, 'deferred', 'maxTaskDepth must never be marked deferred');
  assert.ok(reviewResult4.error, 'maxTaskDepth refusal must carry error evidence');
  assert.match(reviewResult4.error.message, /aggregateBounds\.maxTaskDepth/);

  // 5. mutation !== 'read-only' rejects pre-mutation
  const id5 = 'c5-mutation-refusal';
  await assert.rejects(
    runCoordinationUseCase(ctx, {
      requestObject: makeRequest({
        coordinationId: id5,
        steps: [produceStep({ mutation: 'mutating' })],
      }),
    }),
    (err) => err instanceof StoreError && /read-only/.test(err.message),
  );

  // 6. fan-out step rejects pre-mutation
  const id6 = 'c5-fanout-refusal';
  await assert.rejects(
    runCoordinationUseCase(ctx, {
      requestObject: makeRequest({
        coordinationId: id6,
        steps: [
          produceStep(),
          {
            type: 'fan-out',
            as: 'fan',
            operationId: 'review-candidate',
            branches: [{ actorId: 'reviewer', objective: 'branch 1', expectedOutputs: ['agent-result.json'] }],
          },
        ],
      }),
    }),
    (err) => err instanceof StoreError && /fan-out is not admitted in DAG mode/.test(err.message),
  );
});

// --------------------------------------------------------------------------
// 6. Identical concurrent writers serialize and idempotently reuse evidence
// --------------------------------------------------------------------------

test('DAG concurrency: identical concurrent writers serialize and idempotently reuse evidence without duplicate assignments', async () => {
  const tempDir = mkTempDir();
  writeFixture(tempDir);
  const ctx = { cwd: tempDir, repoRoot: tempDir, runnerConfig: fakeExecutor(tempDir) };
  const coordinationId = 'c6-concurrent-writers';

  const req = makeRequest({ coordinationId });

  // 1. In-process concurrent execution via Promise.all
  const [res1, res2] = await Promise.all([
    runCoordinationUseCase(ctx, { requestObject: req }),
    runCoordinationUseCase(ctx, { requestObject: req }),
  ]);

  assert.equal(res1.coordinationId, coordinationId);
  assert.equal(res2.coordinationId, coordinationId);

  // Assert events.jsonl has exactly 1 assignment per step
  const events = readSessionEvents(coordinationId, { cwd: tempDir, repoRoot: tempDir });
  const produceAssignments = events.filter((e) => e.type === 'assignment-created' && e.payload?.dagNodeId === 'node-produce');
  const reviewAssignments = events.filter((e) => e.type === 'assignment-created' && e.payload?.dagNodeId === 'node-review');

  assert.equal(produceAssignments.length, 1, 'exactly 1 produce assignment created');
  assert.equal(reviewAssignments.length, 1, 'exactly 1 review assignment created');

  const replayed = replaySession(coordinationId, { cwd: tempDir, repoRoot: tempDir });
  assert.equal(replayed.dag.nodes[0].settled, true);
  assert.equal(replayed.dag.nodes[1].settled, true);

  // 2. Cross-process concurrent writers on opened session
  const crossCoordId = 'c6-cross-process-concurrent';
  const crossReq = makeRequest({ coordinationId: crossCoordId });
  const validCrossReq = validateCoordinationRequest(crossReq);
  const declCross = compileDagRequest(validCrossReq);
  openDeclaredProtocolSession(
    {
      coordinationId: crossCoordId,
      objective: validCrossReq.objective,
      writerId: WRITER_ID,
      definitionId: DEFINITION_ID,
      schemaVersion: SCHEMA_VERSION_3,
      dagDeclaration: declCross,
    },
    { cwd: tempDir, repoRoot: tempDir },
  );

  const runnerScript = path.join(tempDir, 'concurrent-worker.mjs');
  fs.writeFileSync(
    runnerScript,
    `
    import { runCoordinationUseCase } from ${JSON.stringify(path.join(REPO_ROOT, 'src/verbs/coordination/run.mjs'))};
    const req = ${JSON.stringify(crossReq)};
    const ctx = {
      cwd: ${JSON.stringify(tempDir)},
      repoRoot: ${JSON.stringify(tempDir)},
      runnerConfig: ${JSON.stringify(fakeExecutor(tempDir))},
    };
    await runCoordinationUseCase(ctx, { requestObject: req });
    process.exit(0);
    `,
  );

  const { spawn } = await import('node:child_process');
  function runChild() {
    return new Promise((resolve) => {
      const child = spawn(process.execPath, [runnerScript]);
      let stdout = '';
      let stderr = '';
      child.stdout.on('data', (d) => { stdout += d; });
      child.stderr.on('data', (d) => { stderr += d; });
      child.on('close', (code) => resolve({ status: code, stdout, stderr }));
    });
  }

  const [p1, p2] = await Promise.all([runChild(), runChild()]);
  assert.equal(p1.status, 0, `process 1 failed: ${p1.stderr}`);
  assert.equal(p2.status, 0, `process 2 failed: ${p2.stderr}`);

  const crossEvents = readSessionEvents(crossCoordId, { cwd: tempDir, repoRoot: tempDir });
  const crossProduce = crossEvents.filter((e) => e.type === 'assignment-created' && e.payload?.dagNodeId === 'node-produce');
  const crossReview = crossEvents.filter((e) => e.type === 'assignment-created' && e.payload?.dagNodeId === 'node-review');
  assert.equal(crossProduce.length, 1, 'cross-process: exactly 1 produce assignment');
  assert.equal(crossReview.length, 1, 'cross-process: exactly 1 review assignment');
});

// --------------------------------------------------------------------------
// 7. Conflicting writers fail before duplicate mutation or external dispatch
// --------------------------------------------------------------------------

test('DAG concurrency: conflicting writers fail before duplicate mutation or external dispatch', async () => {
  const tempDir = mkTempDir();
  writeFixture(tempDir);
  const ctx = { cwd: tempDir, repoRoot: tempDir, runnerConfig: fakeExecutor(tempDir) };
  const coordinationId = 'c7-conflicting-writers';

  // Open declared protocol session for legitimate writer A
  const reqA = makeRequest({ coordinationId, objective: 'Active writer concurrency test.' });
  const validReq = validateCoordinationRequest(reqA);
  const decl = compileDagRequest(validReq);
  openDeclaredProtocolSession(
    {
      coordinationId,
      objective: reqA.objective,
      writerId: WRITER_ID,
      definitionId: DEFINITION_ID,
      schemaVersion: SCHEMA_VERSION_3,
      dagDeclaration: decl,
    },
    { cwd: tempDir, repoRoot: tempDir },
  );

  // Executor for Writer A that briefly pauses (150ms) to ensure Writer B attempts to mutate while Writer A is actively dispatching
  const activeExecutorScript = path.join(tempDir, 'active-executor.mjs');
  fs.writeFileSync(
    activeExecutorScript,
    `
    import fs from 'node:fs';
    import path from 'node:path';
    const prompt = process.argv[2] ?? '';
    const assignmentId = prompt.match(/^Assignment: (.+)$/m)?.[1];
    if (!assignmentId) throw new Error('missing assignmentId');
    const runsDir = path.join(process.cwd(), '.fgos', 'assignments', assignmentId, 'runs');
    const run = fs.readdirSync(runsDir).sort().at(-1);
    const runDir = path.join(runsDir, run);
    const sharedBuffer = new SharedArrayBuffer(4);
    const sharedInt = new Int32Array(sharedBuffer);
    Atomics.wait(sharedInt, 0, 0, 150);
    fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Report\\nDone.\\n');
    fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'Done.' }));
    process.stdout.write('Executed.\\n');
    `,
  );
  const activeRunnerConfig = { executor: { allowCrossProvider: true, command: process.execPath, args: [activeExecutorScript, '{prompt}'] }, modelPolicies: { claude: { standard: 'm', nano: 'm', mini: 'm', advanced: 'm', flagship: 'm', frontier: 'm' } }, rigorToTier: { low: 'nano', standard: 'standard', high: 'flagship', critical: 'frontier' }, timeoutMs: 10000 };

  // Spawn concurrent processes: legitimate actively-dispatching writer vs conflicting writer
  const runnerScriptA = path.join(tempDir, 'concurrent-worker-a.mjs');
  fs.writeFileSync(
    runnerScriptA,
    `
    import { runCoordinationUseCase } from ${JSON.stringify(path.join(REPO_ROOT, 'src/verbs/coordination/run.mjs'))};
    const req = ${JSON.stringify(reqA)};
    const ctx = {
      cwd: ${JSON.stringify(tempDir)},
      repoRoot: ${JSON.stringify(tempDir)},
      runnerConfig: ${JSON.stringify(activeRunnerConfig)},
    };
    await runCoordinationUseCase(ctx, { requestObject: req });
    process.exit(0);
    `,
  );
  const runnerScriptB = path.join(tempDir, 'concurrent-worker-b.mjs');
  fs.writeFileSync(
    runnerScriptB,
    `
    import { runCoordinationUseCase } from ${JSON.stringify(path.join(REPO_ROOT, 'src/verbs/coordination/run.mjs'))};
    const req = ${JSON.stringify(makeRequest({ coordinationId, writerId: 'alien-conflicting-writer' }))};
    const ctx = {
      cwd: ${JSON.stringify(tempDir)},
      repoRoot: ${JSON.stringify(tempDir)},
      runnerConfig: ${JSON.stringify(fakeExecutor(tempDir))},
    };
    try {
      await runCoordinationUseCase(ctx, { requestObject: req });
      process.exit(0);
    } catch (err) {
      process.stderr.write(err.message);
      process.exit(42);
    }
    `,
  );

  const { spawn } = await import('node:child_process');
  function runProc(script) {
    return new Promise((resolve) => {
      const child = spawn(process.execPath, [script]);
      let stdout = '';
      let stderr = '';
      child.stdout.on('data', (d) => { stdout += d; });
      child.stderr.on('data', (d) => { stderr += d; });
      child.on('close', (code) => resolve({ status: code, stdout, stderr }));
    });
  }

  const [procA, procB] = await Promise.all([runProc(runnerScriptA), runProc(runnerScriptB)]);
  assert.equal(procA.status, 0, `proc A failed: ${procA.stderr}`);
  assert.equal(procB.status, 42, 'conflicting writer must fail with exit code 42');
  assert.match(procB.stderr, /is not the driver identity/);

  const eventsAfter = readSessionEvents(coordinationId, { cwd: tempDir, repoRoot: tempDir });
  const conflictingEvents = eventsAfter.filter((e) => e.actorId === 'alien-conflicting-writer' || e.payload?.writerId === 'alien-conflicting-writer');
  assert.equal(conflictingEvents.length, 0, 'zero conflicting events must leak into events.jsonl');

  const produceAssignments = eventsAfter.filter((e) => e.type === 'assignment-created' && e.payload?.dagNodeId === 'node-produce');
  const reviewAssignments = eventsAfter.filter((e) => e.type === 'assignment-created' && e.payload?.dagNodeId === 'node-review');
  assert.equal(produceAssignments.length, 1, 'writer A executed produce cleanly');
  assert.equal(reviewAssignments.length, 1, 'writer A executed review cleanly');
});

// --------------------------------------------------------------------------
// 8. Actor replacement/retry cannot double-dispatch or lose scheduler state
// --------------------------------------------------------------------------

test('DAG concurrency: actor replacement and retry preserve scheduler integrity without double-dispatch', async () => {
  const tempDir = mkTempDir();
  writeFixture(tempDir);
  const ctx = { cwd: tempDir, repoRoot: tempDir, runnerConfig: fakeExecutor(tempDir) };
  const coordinationId = 'c8-actor-replacement';

  const decl = compileDagRequest(validateCoordinationRequest(makeRequest({ coordinationId })));
  openDeclaredProtocolSession(
    {
      coordinationId,
      objective: 'Actor replacement test',
      writerId: WRITER_ID,
      definitionId: DEFINITION_ID,
      schemaVersion: SCHEMA_VERSION_3,
      dagDeclaration: decl,
    },
    { cwd: tempDir, repoRoot: tempDir },
  );

  // Replace actor 'reviewer' with specialist
  replaceSessionActor(
    coordinationId,
    { oldActorId: 'reviewer', newActorId: 'senior-reviewer', persona: 'senior-critic', reason: 'escalation' },
    { cwd: tempDir, repoRoot: tempDir },
  );

  // Resume through runCoordinationUseCase
  const runResult = await runCoordinationUseCase(ctx, { requestObject: makeRequest({ coordinationId }) });
  assert.equal(runResult.steps.length, 2);
  assert.equal(runResult.steps[0].schedulerOutcome, 'settled');
  assert.equal(runResult.steps[1].schedulerOutcome, 'settled');

  // Verify manifest has replacement actor
  const manifest = readManifest(coordinationId, { cwd: tempDir, repoRoot: tempDir });
  const reviewerActor = manifest.actors.find((a) => a.id === 'senior-reviewer');
  assert.ok(reviewerActor, 'replacement actor senior-reviewer must be bound');
  assert.equal(reviewerActor.persona, 'senior-critic');
  assert.equal(reviewerActor.role, 'reviewer');

  // Verify retry: recordRunRetry un-settles assignment without corrupting DAG state
  const asgnProduce = runResult.steps[0].assignmentId;
  const runIdProduce = `run_${asgnProduce}_001`;
  recordRunRetry(
    coordinationId,
    { assignmentId: asgnProduce, runId: runIdProduce, retryAttempt: 1, reason: 'flaky failure' },
    { cwd: tempDir, repoRoot: tempDir },
  );

  const replayed = replaySession(coordinationId, { cwd: tempDir, repoRoot: tempDir });
  const settledIds = getAuthoritativeSettledAssignmentIds(replayed.events);
  assert.equal(settledIds.has(asgnProduce), false, 'retried assignment must not be settled');
  const produceNode = replayed.dag.nodes.find((n) => n.nodeId === 'node-produce');
  assert.equal(produceNode.settled, false, 'retried node is not settled');
});

// --------------------------------------------------------------------------
// 9. External in-flight work produces bounded concurrency behavior
// --------------------------------------------------------------------------

test('DAG concurrency: external in-flight work is tracked and bounds concurrency', async () => {
  const tempDir = mkTempDir();
  writeFixture(tempDir);
  const ctx = { cwd: tempDir, repoRoot: tempDir, runnerConfig: fakeExecutor(tempDir) };
  const coordinationId = 'c9-external-inflight';

  const req = makeRequest({
    coordinationId,
    aggregateBounds: { maxConcurrency: 1, maxAssignments: 10, maxRounds: 10, maxTaskDepth: 10, wallTimeMs: 60000 },
  });
  const decl = compileDagRequest(validateCoordinationRequest(req));
  openDeclaredProtocolSession(
    {
      coordinationId,
      objective: 'Inflight tracking test',
      writerId: WRITER_ID,
      definitionId: DEFINITION_ID,
      schemaVersion: SCHEMA_VERSION_3,
      dagDeclaration: decl,
      aggregateBounds: { maxConcurrency: 1, maxAssignments: 10, maxRounds: 10, maxTaskDepth: 10, wallTimeMs: 60000 },
    },
    { cwd: tempDir, repoRoot: tempDir },
  );

  // Create an external assignment that remains in-flight (unlinked) and occupies concurrency capacity
  const extAsgn = createSessionAssignment(
    {
      coordinationId,
      taskKey: 'task-external-holder',
      contract: {
        objective: 'External in-flight task',
        contextRefs: [],
        constraints: [],
        expectedOutputs: ['agent-result.json'],
        mutation: 'read-only',
        evidence: { required: 'reported' },
        role: 'doer',
        budget: { timeoutMs: 10000, maxRuns: 1 },
      },
      caller: { writerId: WRITER_ID },
    },
    { cwd: tempDir, repoRoot: tempDir },
  );

  const shown = showCoordinationUseCase({ cwd: tempDir, repoRoot: tempDir }, { id: coordinationId });
  const produceNode = shown.dag.nodes.find((n) => n.nodeId === 'node-produce');
  assert.equal(produceNode.materialized, false);
  assert.equal(produceNode.settled, false);

  // Attempting to run DAG execution when external work occupies capacity (inFlight = 1 >= maxConcurrency = 1):
  // Produce step cannot be admitted, deferral reason is concurrency-cap
  const runResult = await runCoordinationUseCase(ctx, { requestObject: req });
  const produceStepResult = runResult.steps.find((s) => s.as === 'produce');
  assert.equal(produceStepResult.schedulerOutcome, 'deferred');
  assert.equal(produceStepResult.error.code, 'concurrency-cap');

  // Now settle the external in-flight task with real RunResult on disk
  const runId = `run_${extAsgn.assignmentId}_001`;
  writeSettledRunResult(tempDir, extAsgn.assignmentId, runId);
  linkResult(coordinationId, { assignmentId: extAsgn.assignmentId, runId }, { cwd: tempDir, repoRoot: tempDir });

  // Resume again: now 0 tasks in-flight, produce can be admitted and settled, followed by review
  const resumedResult = await runCoordinationUseCase(ctx, { requestObject: req });
  const resumedProduce = resumedResult.steps.find((s) => s.as === 'produce');
  const resumedReview = resumedResult.steps.find((s) => s.as === 'review');
  assert.equal(resumedProduce.schedulerOutcome, 'settled');
  assert.equal(resumedReview.schedulerOutcome, 'settled');
});
