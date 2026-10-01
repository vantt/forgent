import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  readManifest,
  readSessionEvents,
  createSessionAssignment,
} from '../../src/runner/coordination/store.mjs';
import { replaySession } from '../../src/runner/coordination/replay.mjs';
import { openDeclaredProtocolSession } from '../../src/runner/coordination/session-engine.mjs';
import { runCoordinationUseCase } from '../../src/verbs/coordination/run.mjs';
import { closeCoordinationUseCase } from '../../src/verbs/coordination/close.mjs';
import { compileDagRequest } from '../../src/verbs/coordination/dag-request-compiler.mjs';
import { validateCoordinationRequest } from '../../src/verbs/coordination/schema.mjs';
import { SCHEMA_VERSION_3 } from '../../src/runner/coordination/schema.mjs';

const DEFINITION_ID = 'test.coordination-protocol.master-loop-driver-steps';
const CAVEAT_DEFINITION_ID = 'test.coordination-protocol.dag-caveat-fixture';
const WRITER_ID = 'master-coordinator-1';

const tempDirs = [];
function mkTempDir(prefix = 'fgos-dag-close-') {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

after(() => {
  for (const dir of tempDirs) {
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch {}
  }
});

function writeFixture(tempDir) {
  const dir = path.join(tempDir, '.fgos', 'coordination-protocols');
  fs.mkdirSync(dir, { recursive: true });
  const advisory = { kind: 'advisory', evidenceRequired: 'reported' };
  const workProduct = { kind: 'work-product', evidenceRequired: 'reported' };

  // Standard 2-actor protocol: produce -> review
  const definition = {
    apiVersion: 'fgos.dev/v1alpha1',
    kind: 'FlowDefinition',
    metadata: {
      id: DEFINITION_ID,
      version: '1.0.0',
    },
    spec: {
      profile: { kind: 'CoordinationProtocol' },
      roles: ['doer', 'reviewer'],
      actors: [
        { id: 'doer', role: 'doer' },
        { id: 'reviewer', role: 'reviewer' },
      ],
      operations: [
        { id: 'produce-candidate', role: 'doer', result: workProduct },
        { id: 'review-candidate', role: 'reviewer', result: advisory },
      ],
      graph: {
        entry: 'phase-produce',
        nodes: [
          { id: 'phase-produce', operations: [{ ref: 'produce-candidate', actor: 'doer' }], transitions: ['phase-review'] },
          {
            id: 'phase-review',
            operations: [
              { ref: 'review-candidate', actor: 'reviewer' },
            ],
            transitions: [],
          },
        ],
      },
    },
  };
  fs.writeFileSync(path.join(dir, 'master-loop-driver-steps.json'), `${JSON.stringify(definition, null, 2)}\n`);

  // Caveat test protocol: two concurrent read-only operations sharing phase and cwd
  const caveatDefinition = {
    apiVersion: 'fgos.dev/v1alpha1',
    kind: 'FlowDefinition',
    metadata: {
      id: CAVEAT_DEFINITION_ID,
      version: '1.0.0',
    },
    spec: {
      profile: { kind: 'CoordinationProtocol' },
      roles: ['reviewer-1', 'reviewer-2'],
      actors: [
        { id: 'reviewer-1', role: 'reviewer-1' },
        { id: 'reviewer-2', role: 'reviewer-2' },
      ],
      operations: [
        { id: 'caveat-op-1', role: 'reviewer-1', result: advisory },
        { id: 'caveat-op-2', role: 'reviewer-2', result: advisory },
      ],
      graph: {
        entry: 'phase-caveat',
        nodes: [
          {
            id: 'phase-caveat',
            operations: [
              { ref: 'caveat-op-1', actor: 'reviewer-1' },
              { ref: 'caveat-op-2', actor: 'reviewer-2' },
            ],
            transitions: [],
          },
        ],
      },
    },
  };
  fs.writeFileSync(path.join(dir, 'dag-caveat-fixture.json'), `${JSON.stringify(caveatDefinition, null, 2)}\n`);
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

function publicDoorSetup() {
  const tempDir = mkTempDir('fgos-dag-explicit-close-');
  writeFixture(tempDir);
  return { tempDir, ctx: { cwd: tempDir, repoRoot: tempDir, runnerConfig: fakeExecutor(tempDir) } };
}

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

function dagRequest(overrides = {}) {
  return {
    kind: 'declared-protocol',
    dag: true,
    objective: 'DAG explicit close test request.',
    writerId: WRITER_ID,
    protocolRef: { id: DEFINITION_ID },
    actors: [{ id: 'doer' }, { id: 'reviewer' }],
    steps: [produceStep(), reviewStep()],
    ...overrides,
  };
}

test('DAG session with no explicit close does not auto-close upon full completion', async () => {
  const { tempDir, ctx } = publicDoorSetup();
  const coordinationId = 'dag-no-auto-close';

  const result = await runCoordinationUseCase(ctx, {
    requestObject: dagRequest({ coordinationId }),
  });

  // Critical I14 assertions:
  // Must NOT auto-close merely because all DAG work is settled cleanly
  assert.equal(result.closed, false, 'DAG request without close: true must not auto-close');
  assert.equal(result.closeAttempted, false, 'closeAttempted must be false when close was not requested');
  assert.equal(result.status, 'running', 'session status must reflect active phase running, not completed');

  // Verify manifest and event log
  const manifest = readManifest(coordinationId, { cwd: tempDir, repoRoot: tempDir });
  assert.equal(manifest.status, 'active', 'session manifest must remain active');

  const events = readSessionEvents(coordinationId, { cwd: tempDir, repoRoot: tempDir });
  assert.equal(events.some((e) => e.type === 'session-closed'), false, 'no session-closed event may be appended');

  // All DAG nodes must still be settled cleanly
  assert.equal(result.steps.length, 2);
  assert.ok(result.steps.every((s) => s.schedulerOutcome === 'settled'));
  assert.equal(result.dag.counts.settled, 2);
});

test('DAG session with explicit request.close: true closes cleanly when all nodes settle', async () => {
  const { tempDir, ctx } = publicDoorSetup();
  const coordinationId = 'dag-explicit-close-flag';

  const result = await runCoordinationUseCase(ctx, {
    requestObject: dagRequest({ coordinationId, close: true }),
  });

  assert.equal(result.closed, true, 'DAG request with close: true must close cleanly');
  assert.equal(result.closeAttempted, true, 'closeAttempted must be true');
  assert.equal(result.status, 'completed', 'session status must be completed');

  const manifest = readManifest(coordinationId, { cwd: tempDir, repoRoot: tempDir });
  assert.equal(manifest.status, 'completed', 'manifest status must be completed');

  const events = readSessionEvents(coordinationId, { cwd: tempDir, repoRoot: tempDir });
  assert.ok(events.some((e) => e.type === 'session-completed'), 'session-completed event must exist');
});

test('DAG session left open can be subsequently closed explicitly via closeCoordinationUseCase', async () => {
  const { tempDir, ctx } = publicDoorSetup();
  const coordinationId = 'dag-separate-close-door';

  // Step 1: Run DAG work without closing
  const runResult = await runCoordinationUseCase(ctx, {
    requestObject: dagRequest({ coordinationId }),
  });
  assert.equal(runResult.closed, false);
  assert.equal(readManifest(coordinationId, { cwd: tempDir, repoRoot: tempDir }).status, 'active');

  // Step 2: Explicit close door invoked separately
  const closeResult = await closeCoordinationUseCase(ctx, {
    requestObject: {
      kind: 'close',
      coordinationId,
      authorizedBy: { type: 'operator', id: WRITER_ID },
      reason: 'explicit close after DAG completion',
    },
  });

  assert.equal(closeResult.closed, true, 'subsequent explicit close must succeed');
  assert.equal(readManifest(coordinationId, { cwd: tempDir, repoRoot: tempDir }).status, 'completed');
});

test('DAG session with caveats reports caveat closeRefusalReason and does NOT close, with or without close: true', async () => {
  const { tempDir, ctx } = publicDoorSetup();

  // Test 1: Caveated DAG without close: true
  const cid1 = 'dag-caveat-no-close';
  const req1 = {
    kind: 'declared-protocol',
    dag: true,
    objective: 'Caveat test without close.',
    writerId: WRITER_ID,
    protocolRef: { id: CAVEAT_DEFINITION_ID },
    coordinationId: cid1,
    actors: [{ id: 'reviewer-1' }, { id: 'reviewer-2' }],
    steps: [
      { as: 'rev-1', type: 'operation', operationId: 'caveat-op-1', targetActorId: 'reviewer-1', objective: 'Review 1.', expectedOutputs: ['r1.md'], dependsOn: [] },
      { as: 'rev-2', type: 'operation', operationId: 'caveat-op-2', targetActorId: 'reviewer-2', objective: 'Review 2.', expectedOutputs: ['r2.md'], dependsOn: [] },
    ],
  };
  const res1 = await runCoordinationUseCase(ctx, { requestObject: req1 });
  assert.equal(res1.closed, false);
  assert.equal(res1.closeAttempted, false);
  assert.equal(res1.caveated, true);
  assert.match(res1.closeRefusalReason, /recheck-required/);

  // Test 2: Caveated DAG with explicit close: true
  const cid2 = 'dag-caveat-with-close';
  const req2 = {
    ...req1,
    coordinationId: cid2,
    close: true,
  };
  const res2 = await runCoordinationUseCase(ctx, { requestObject: req2 });
  assert.equal(res2.closed, false, 'caveated session must not close even with close: true');
  assert.equal(res2.closeAttempted, false, 'closeAttempted must be false when caveats prevent close attempt');
  assert.equal(res2.caveated, true);
  assert.match(res2.closeRefusalReason, /recheck-required/);
});

test('DAG session with partial outcome (deferred) does not close even with close: true', async () => {
  const { tempDir, ctx } = publicDoorSetup();
  const coordinationId = 'dag-partial-outcome-no-close';

  const raw = dagRequest({
    coordinationId,
    close: true,
    aggregateBounds: { maxConcurrency: 1 },
    steps: [produceStep(), reviewStep()],
  });
  const normalized = validateCoordinationRequest(raw);
  const declaration = compileDagRequest(normalized, { durableLedgerIds: [] });
  openDeclaredProtocolSession(
    { coordinationId, objective: normalized.objective, writerId: WRITER_ID, definitionId: DEFINITION_ID, schemaVersion: SCHEMA_VERSION_3, aggregateBounds: normalized.aggregateBounds, dagDeclaration: declaration },
    { cwd: tempDir, repoRoot: tempDir },
  );
  createSessionAssignment(
    {
      coordinationId,
      taskKey: 'outside-blocker',
      actorId: 'doer',
      contract: { objective: 'Outside.', contextRefs: [], constraints: [], expectedOutputs: ['out.json'], mutation: 'read-only', evidence: { required: 'reported' }, role: 'doer', budget: { timeoutMs: 1000, maxRuns: 1 } },
      caller: { writerId: WRITER_ID },
    },
    { cwd: tempDir, repoRoot: tempDir },
  );

  const result = await runCoordinationUseCase(ctx, { requestObject: raw });
  assert.equal(result.closed, false);
  assert.equal(result.closeAttempted, false);
  assert.equal(result.steps.find((s) => s.as === 'produce').schedulerOutcome, 'deferred');
});

test('Non-DAG requests maintain unchanged explicit-close semantics', async () => {
  const { tempDir, ctx } = publicDoorSetup();

  // Non-DAG without close: true -> does not close
  const cid1 = 'non-dag-no-close';
  const res1 = await runCoordinationUseCase(ctx, {
    requestObject: {
      kind: 'declared-protocol',
      objective: 'Non-DAG request.',
      writerId: WRITER_ID,
      protocolRef: { id: DEFINITION_ID },
      actors: [{ id: 'doer' }, { id: 'reviewer' }],
      steps: [produceStep(), reviewStep()],
      coordinationId: cid1,
    },
  });
  assert.equal(res1.closed, false);
  assert.equal(res1.closeAttempted, false);
  assert.equal(res1.status, 'running');

  // Non-DAG with close: true -> closes cleanly
  const cid2 = 'non-dag-with-close';
  const res2 = await runCoordinationUseCase(ctx, {
    requestObject: {
      kind: 'declared-protocol',
      objective: 'Non-DAG request with close: true.',
      writerId: WRITER_ID,
      protocolRef: { id: DEFINITION_ID },
      actors: [{ id: 'doer' }, { id: 'reviewer' }],
      steps: [produceStep(), reviewStep()],
      coordinationId: cid2,
      close: true,
    },
  });
  assert.equal(res2.closed, true);
  assert.equal(res2.closeAttempted, true);
  assert.equal(res2.status, 'completed');

  // Non-DAG with close step -> closes cleanly
  const cid3 = 'non-dag-with-close-step';
  const res3 = await runCoordinationUseCase(ctx, {
    requestObject: {
      kind: 'declared-protocol',
      objective: 'Non-DAG request with close step.',
      writerId: WRITER_ID,
      protocolRef: { id: DEFINITION_ID },
      actors: [{ id: 'doer' }, { id: 'reviewer' }],
      steps: [
        produceStep(),
        reviewStep(),
        { type: 'close', as: 'closeSession' },
      ],
      coordinationId: cid3,
    },
  });
  assert.equal(res3.closed, true);
  assert.equal(res3.status, 'completed');
});

test('Replay of unclosed DAG session stays active with no terminal event', async () => {
  const { tempDir, ctx } = publicDoorSetup();
  const coordinationId = 'dag-replay-test';

  await runCoordinationUseCase(ctx, {
    requestObject: dagRequest({ coordinationId }),
  });

  const replayed = replaySession(coordinationId, { cwd: tempDir, repoRoot: tempDir });
  assert.equal(replayed.manifest.schemaVersion, SCHEMA_VERSION_3);
  assert.equal(replayed.dag.kind, 'dag');
  assert.equal(replayed.manifest.status, 'active');
  assert.equal(replayed.events.some((e) => e.type === 'session-closed'), false);
});
