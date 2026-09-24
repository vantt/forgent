// Phase 07 — schema migration matrix + adversarial recovery, executed
// against real old/new module trees and the public run/show doors.
//
// Reuses the P00 characterization (unknown schema is a named mismatch;
// extra manifest fields fail validation first; legacy steps stay sequential)
// rather than re-deriving those fixtures. The new proof is the compositional
// old-binary property P01 documented but could not execute in-process:
// a separately archived pre-schema-3 tree reading a schema-3 session.

import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';

import { openSession, createSessionAssignment, readManifest, readSessionEvents, resolveSessionPaths, recordRunRetry, linkResult, recordDriverDisposition } from '../../src/runner/coordination/store.mjs';
import { normalizeDagDeclaration } from '../../src/runner/coordination/dag-declaration.mjs';
import { replaySession } from '../../src/runner/coordination/replay.mjs';
import { CoordinationError, SCHEMA_VERSION_2, SCHEMA_VERSION_3 } from '../../src/runner/coordination/schema.mjs';
import { EventLogError, repairTruncatedLastLine } from '../../src/state/events.mjs';
import { cancelSession, openDeclaredProtocolSession } from '../../src/runner/coordination/session-engine.mjs';
import { validateCoordinationRequest } from '../../src/verbs/coordination/schema.mjs';
import { runCoordinationUseCase } from '../../src/verbs/coordination/run.mjs';
import { scheduleDagSteps } from '../../src/verbs/coordination/dag-scheduler.mjs';
import { showCoordinationUseCase } from '../../src/verbs/coordination/show.mjs';
import { closeCoordinationUseCase } from '../../src/verbs/coordination/close.mjs';
import { compileDagRequest } from '../../src/verbs/coordination/dag-request-compiler.mjs';
import { StoreError } from '../../src/state/store.mjs';
import { FlowDefinitionError } from '../../src/runner/definitions/schema.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const TRACK_BASE = 'b5d26f6c213733971f3ea17220fb8457c84dbfe5';
const DEFINITION_ID = 'test.coordination-protocol.master-loop-driver-steps';
const WRITER_ID = 'master-coordinator-1';

function mkTempDir(prefix = 'fgos-p07-') {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

let oldSrcDir;
function extractOldSrc() {
  if (oldSrcDir) return oldSrcDir;
  const dest = mkTempDir('fgos-p07-old-src-');
  const archived = spawnSync('git', ['archive', TRACK_BASE, 'src'], {
    cwd: REPO_ROOT,
    encoding: 'buffer',
    maxBuffer: 80 * 1024 * 1024,
  });
  assert.equal(archived.status, 0, `git archive ${TRACK_BASE} failed: ${archived.stderr}`);
  const extracted = spawnSync('tar', ['-xf', '-', '-C', dest], { input: archived.stdout, cwd: dest });
  assert.equal(extracted.status, 0, `tar extract of ${TRACK_BASE} src/ failed: ${extracted.stderr}`);
  oldSrcDir = dest;
  return dest;
}

after(() => {
  if (oldSrcDir) fs.rmSync(oldSrcDir, { recursive: true, force: true });
});

function runOldBinary(sessionCwd, coordinationId, action) {
  const oldSrc = extractOldSrc();
  const probe = path.join(os.tmpdir(), `fgos-p07-probe-${process.pid}-${createHash('sha1').update(`${coordinationId}:${action}:${Math.random()}`).digest('hex').slice(0, 12)}.mjs`);
  const replayUrl = pathToFileURL(path.join(oldSrc, 'src/runner/coordination/replay.mjs')).href;
  const storeUrl = pathToFileURL(path.join(oldSrc, 'src/runner/coordination/store.mjs')).href;
  fs.writeFileSync(
    probe,
    `import { replaySession } from ${JSON.stringify(replayUrl)};
import { createSessionAssignment, bindActor, linkResult, transitionSessionStatus } from ${JSON.stringify(storeUrl)};
const cwd = ${JSON.stringify(sessionCwd)};
const coordinationId = ${JSON.stringify(coordinationId)};
const action = ${JSON.stringify(action)};
const contract = {
  objective: 'Old-binary append probe.',
  contextRefs: [],
  constraints: [],
  expectedOutputs: ['agent-result.json (status, summary)'],
  mutation: 'read-only',
  evidence: { required: 'reported' },
  role: 'researcher',
  budget: { timeoutMs: 60000, maxRuns: 1 },
};
function report(err) {
  process.stdout.write(JSON.stringify({
    ok: false,
    name: err?.name ?? null,
    category: err?.category ?? null,
    message: err?.message ?? String(err),
  }));
}
try {
  if (action === 'replay') replaySession(coordinationId, { cwd });
  else if (action === 'createSessionAssignment') {
    createSessionAssignment({ coordinationId, taskKey: 'p07-old-append', contract, caller: { writerId: 'writer-1' } }, { cwd });
  } else if (action === 'bindActor') {
    bindActor(coordinationId, { id: 'specialist', role: 'reviewer' }, { cwd });
  } else if (action === 'linkResult') {
    linkResult(coordinationId, { assignmentId: 'asgn_never_created_001', runId: 'run_x' }, { cwd });
  } else if (action === 'transitionSessionStatus') {
    transitionSessionStatus(coordinationId, 'completed', {}, { cwd });
  } else {
    throw new Error('unknown old-binary action');
  }
  process.stdout.write(JSON.stringify({ ok: true }));
} catch (err) {
  report(err);
}
`,
  );
  try {
    const spawned = spawnSync(process.execPath, [probe], { encoding: 'utf8', timeout: 20000 });
    assert.equal(spawned.status, 0, `old-binary probe exited ${spawned.status}: ${spawned.stderr || spawned.stdout}`);
    return JSON.parse(spawned.stdout);
  } finally {
    fs.rmSync(probe, { force: true });
  }
}

function dagDeclaration() {
  return {
    nodes: [
      { id: 'produce-v1', displayLabel: 'Produce', semantics: { kind: 'operation' }, dependsOn: [] },
      { id: 'review-v1', displayLabel: 'Review', semantics: { kind: 'operation' }, dependsOn: ['produce-v1'] },
    ],
    continuationPolicy: { mode: 'explicit-contract-required' },
  };
}

function openDagSession(tempDir, coordinationId) {
  return openSession(
    {
      coordinationId,
      objective: 'Phase 07 DAG session.',
      provenanceRoot: { writerId: 'writer-1' },
      schemaVersion: SCHEMA_VERSION_3,
      dagDeclaration: dagDeclaration(),
    },
    { cwd: tempDir },
  );
}

function eventsRaw(tempDir, coordinationId) {
  return fs.readFileSync(path.join(tempDir, '.fgos', 'coordination', 'sessions', coordinationId, 'events.jsonl'), 'utf8');
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

function publicDoorSetup() {
  const tempDir = mkTempDir('fgos-p07-door-');
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

function request(overrides = {}) {
  return {
    kind: 'declared-protocol',
    objective: 'Phase 07 public-door matrix.',
    writerId: WRITER_ID,
    protocolRef: { id: DEFINITION_ID },
    steps: [produceStep(), reviewStep()],
    ...overrides,
  };
}

test('Phase 07: an OLD pre-schema-3 binary fails clearly on a NEW schema-3 session and never reinterprets it', () => {
  const tempDir = mkTempDir();
  const coordinationId = 'p07-old-reads-new';
  openDagSession(tempDir, coordinationId);
  const result = runOldBinary(tempDir, coordinationId, 'replay');
  assert.equal(result.ok, false);
  assert.equal(result.category, 'schema-version-mismatch');
  assert.match(result.message, /schemaVersion "3"/);
  assert.match(result.message, /1 \| 2/);
  assert.doesNotMatch(result.message, /dag-declared|Produce|review-v1/);
  const current = replaySession(coordinationId, { cwd: tempDir });
  assert.equal(current.dag.kind, 'dag');
  assert.equal(current.dag.nodes.length, 2);
});

test('Phase 07: an OLD binary refuses every mixed-version append into a schema-3 session and leaves the log byte-identical', () => {
  const tempDir = mkTempDir();
  const coordinationId = 'p07-old-append-new';
  openDagSession(tempDir, coordinationId);
  const before = eventsRaw(tempDir, coordinationId);
  for (const action of ['createSessionAssignment', 'bindActor', 'linkResult', 'transitionSessionStatus']) {
    const result = runOldBinary(tempDir, coordinationId, action);
    assert.equal(result.ok, false, action);
    assert.equal(result.category, 'schema-version-mismatch', action);
    assert.equal(eventsRaw(tempDir, coordinationId), before, `${action} must not append`);
  }
});

test('Phase 07: a NEW binary reading an OLD schema-1/2 session keeps legacy-non-dag sequential semantics', () => {
  const tempDir = mkTempDir();
  openSession({ coordinationId: 'p07-legacy-1', objective: 'Legacy 1.', provenanceRoot: { writerId: 'writer-1' } }, { cwd: tempDir });
  const replayed1 = replaySession('p07-legacy-1', { cwd: tempDir });
  assert.equal(replayed1.dag.kind, 'legacy-non-dag');
  assert.deepEqual(replayed1.dag.nodes, []);
  assert.equal(readManifest('p07-legacy-1', { cwd: tempDir }).schemaVersion, '1');

  openSession(
    { coordinationId: 'p07-legacy-2', objective: 'Legacy 2.', provenanceRoot: { writerId: 'writer-1' }, schemaVersion: SCHEMA_VERSION_2 },
    { cwd: tempDir },
  );
  const replayed2 = replaySession('p07-legacy-2', { cwd: tempDir });
  assert.equal(replayed2.dag.kind, 'legacy-non-dag');
  assert.deepEqual(replayed2.dag.nodes, []);
  assert.equal(readManifest('p07-legacy-2', { cwd: tempDir }).schemaVersion, '2');
});

test('Phase 07: a NEW binary refuses to convert a legacy session into DAG mode on resume, and refuses a hand-appended dag-declared event on a schema-1 log', async () => {
  const { tempDir, ctx } = publicDoorSetup();
  const coordinationId = 'p07-no-legacy-upgrade';
  await runCoordinationUseCase(ctx, { requestObject: request({ coordinationId }) });
  const before = eventsRaw(tempDir, coordinationId);
  await assert.rejects(
    runCoordinationUseCase(ctx, { requestObject: request({ dag: true, coordinationId }) }),
    (err) => err instanceof StoreError && /is legacy and cannot be converted to DAG mode on resume/.test(err.message),
  );
  assert.equal(eventsRaw(tempDir, coordinationId), before);

  const schema1Id = 'p07-schema1-tamper';
  openSession({ coordinationId: schema1Id, objective: 'Schema 1.', provenanceRoot: { writerId: 'writer-1' } }, { cwd: tempDir });
  const { eventsPath } = resolveSessionPaths(schema1Id, { cwd: tempDir });
  const smuggled = normalizeDagDeclaration({
    nodes: [{ id: 'x-v1', displayLabel: 'x', semantics: { kind: 'operation' }, dependsOn: [] }],
    continuationPolicy: { mode: 'explicit-contract-required' },
  });
  fs.appendFileSync(
    eventsPath,
    `${JSON.stringify({ seq: 99, ts: new Date().toISOString(), type: 'dag-declared', payload: { declaration: smuggled }, v: '1' })}\n`,
  );
  assert.throws(
    () => replaySession(schema1Id, { cwd: tempDir }),
    (err) => err instanceof CoordinationError && err.category === 'validation' && /DAG declaration appears outside schema-3/.test(err.message),
  );
});

test('Phase 07: declaration tampering (fingerprint/content mismatch) is rejected on replay, never silently accepted', () => {
  const tempDir = mkTempDir();
  const coordinationId = 'p07-tamper-fingerprint';
  openDagSession(tempDir, coordinationId);
  const { eventsPath } = resolveSessionPaths(coordinationId, { cwd: tempDir });
  const lines = fs.readFileSync(eventsPath, 'utf8').trimEnd().split('\n');
  const rewritten = lines.map((line) => {
    const event = JSON.parse(line);
    if (event.type !== 'dag-declared') return line;
    event.payload.declaration.requestFingerprint = 'sha256:0000000000000000000000000000000000000000000000000000000000000000';
    return JSON.stringify(event);
  });
  fs.writeFileSync(eventsPath, `${rewritten.join('\n')}\n`);
  assert.throws(
    () => replaySession(coordinationId, { cwd: tempDir }),
    (err) => err instanceof CoordinationError && err.category === 'validation' && /requestFingerprint does not match normalized request/.test(err.message),
  );

  const tempDir2 = mkTempDir();
  const id2 = 'p07-tamper-semantics';
  openDagSession(tempDir2, id2);
  const paths2 = resolveSessionPaths(id2, { cwd: tempDir2 });
  const lines2 = fs.readFileSync(paths2.eventsPath, 'utf8').trimEnd().split('\n');
  const rewritten2 = lines2.map((line) => {
    const event = JSON.parse(line);
    if (event.type !== 'dag-declared') return line;
    event.payload.declaration.nodes[0].semantics = { kind: 'operation', secretlyEdited: true };
    return JSON.stringify(event);
  });
  fs.writeFileSync(paths2.eventsPath, `${rewritten2.join('\n')}\n`);
  assert.throws(
    () => replaySession(id2, { cwd: tempDir2 }),
    (err) => err instanceof CoordinationError && err.category === 'validation' && /requestFingerprint does not match normalized request|is not normalized/.test(err.message),
  );
});

test('Phase 07: semantic resume drift (already-declared node objective changes) is rejected with zero new events', async () => {
  const { tempDir, ctx } = publicDoorSetup();
  const coordinationId = 'p07-resume-drift';
  await runCoordinationUseCase(ctx, { requestObject: request({ dag: true, coordinationId }) });
  const before = eventsRaw(tempDir, coordinationId);
  const drifted = request({
    dag: true,
    coordinationId,
    steps: [produceStep(), reviewStep({ objective: 'Review the candidate with drifted semantics.' })],
  });
  validateCoordinationRequest(drifted);
  await assert.rejects(
    runCoordinationUseCase(ctx, { requestObject: drifted }),
    (err) => err instanceof StoreError && /declaration differs/.test(err.message),
  );
  assert.equal(eventsRaw(tempDir, coordinationId), before);
});

test('Phase 07: missing session and missing protocol definition still throw original not-found, never a validation refusal', async () => {
  const { tempDir, ctx } = publicDoorSetup();
  assert.throws(
    () => showCoordinationUseCase({ cwd: tempDir, repoRoot: tempDir }, { id: 'p07-session-never-existed' }),
    (err) => err instanceof CoordinationError && !(err instanceof StoreError) && err.category === 'not-found',
  );
  await assert.rejects(
    runCoordinationUseCase(ctx, { requestObject: request({ protocolRef: { id: 'test.coordination-protocol.does-not-exist' } }) }),
    (err) => err instanceof FlowDefinitionError && !(err instanceof StoreError) && err.category === 'not-found',
  );
});

test('Phase 07: a truncated or malformed RunResult on a schema-3 session is corrupt-log, never projected as done', async () => {
  const { tempDir, ctx } = publicDoorSetup();
  const coordinationId = 'p07-corrupt-runresult';
  await runCoordinationUseCase(ctx, { requestObject: request({ dag: true, coordinationId }) });
  const shownBefore = showCoordinationUseCase({ cwd: tempDir, repoRoot: tempDir }, { id: coordinationId });
  assert.equal(shownBefore.schemaMode, 'dag');
  const replayed = replaySession(coordinationId, { cwd: tempDir, repoRoot: tempDir });
  assert.ok(replayed.results.length > 0, 'the DAG run must have linked at least one RunResult');
  const linked = replayed.results[0];
  const attemptStr = linked.runId.startsWith(`run_${linked.assignmentId}_`)
    ? linked.runId.slice(`run_${linked.assignmentId}_`.length)
    : '01';
  const runDir = path.join(tempDir, '.fgos', 'assignments', linked.assignmentId, 'runs', attemptStr);
  const resultPath = path.join(runDir, 'result.json');
  const agentResultPath = path.join(runDir, 'agent-result.json');
  const target = fs.existsSync(resultPath) ? resultPath : agentResultPath;
  assert.equal(fs.existsSync(target), true, `expected RunResult file at ${resultPath} or ${agentResultPath}`);
  fs.writeFileSync(target, '{truncated');
  assert.throws(
    () => showCoordinationUseCase({ cwd: tempDir, repoRoot: tempDir }, { id: coordinationId }),
    (err) => err instanceof CoordinationError && err.category === 'corrupt-log' && /not valid JSON|truncated or malformed/.test(err.message),
  );
});

test('Phase 07: cancellation of a schema-3 session still refuses later admission through both new and old binaries', () => {
  const tempDir = mkTempDir();
  const coordinationId = 'p07-cancel-schema3';
  openDagSession(tempDir, coordinationId);
  cancelSession(coordinationId, { reason: 'phase-07 matrix' }, { cwd: tempDir, repoRoot: tempDir });
  assert.equal(readManifest(coordinationId, { cwd: tempDir }).status, 'cancelled');
  const before = eventsRaw(tempDir, coordinationId);
  assert.throws(
    () =>
      createSessionAssignment(
        {
          coordinationId,
          taskKey: 'after-cancel',
          contract: {
            objective: 'Must not admit.',
            contextRefs: [],
            constraints: [],
            expectedOutputs: ['agent-result.json (status, summary)'],
            mutation: 'read-only',
            evidence: { required: 'reported' },
            role: 'researcher',
            budget: { timeoutMs: 60000, maxRuns: 1 },
          },
          caller: { writerId: 'writer-1' },
        },
        { cwd: tempDir },
      ),
    (err) => err instanceof CoordinationError,
  );
  const old = runOldBinary(tempDir, coordinationId, 'createSessionAssignment');
  assert.equal(old.ok, false);
  assert.equal(old.category, 'schema-version-mismatch');
  assert.equal(eventsRaw(tempDir, coordinationId), before);
});

test('Phase 07: a schema-3 event log that stops mid-write with no later event is EventLogError, and repairTruncatedLastLine restores the DAG declaration', () => {
  const tempDir = mkTempDir();
  const coordinationId = 'p07-truncated-last-line';
  openDagSession(tempDir, coordinationId);
  const { eventsPath } = resolveSessionPaths(coordinationId, { cwd: tempDir });
  fs.appendFileSync(eventsPath, '{"type":"assignment-created","payload":{"assignmentId":"asgn_partial"');
  assert.throws(
    () => replaySession(coordinationId, { cwd: tempDir }),
    (err) => err instanceof EventLogError && err.category === 'corrupt-log',
  );
  const repaired = repairTruncatedLastLine(eventsPath);
  assert.ok(repaired.backupPath);
  assert.ok(repaired.eventCount >= 2, 'repair must keep the complete schema-3 prefix, including dag-declared');
  const replayed = replaySession(coordinationId, { cwd: tempDir });
  assert.equal(replayed.dag.kind, 'dag');
  assert.equal(replayed.dag.nodes[0].pending, true);
  assert.equal(readSessionEvents(coordinationId, { cwd: tempDir }).some((event) => event.type === 'assignment-created'), false);
});

test('Phase 07: public-door legacy requests still run sequentially and never grow DAG scheduler fields', async () => {
  const { tempDir, ctx } = publicDoorSetup();
  const result = await runCoordinationUseCase(ctx, { requestObject: request({ coordinationId: 'p07-legacy-sequential-door' }) });
  assert.deepEqual(result.steps.map((step) => step.as), ['produce', 'review']);
  assert.ok(result.steps.every((step) => step.schedulerOutcome === undefined && step.overlapGroup === undefined));
  assert.equal(result.dag, undefined);
  const shown = showCoordinationUseCase({ cwd: tempDir, repoRoot: tempDir }, { id: result.coordinationId });
  assert.equal(shown.schemaMode, 'legacy-non-dag');
  assert.equal(shown.dag.kind, 'legacy-non-dag');
  assert.equal(readManifest(result.coordinationId, { cwd: tempDir, repoRoot: tempDir }).schemaVersion, SCHEMA_VERSION_3);
});

test('Phase 07: resuming a legacy declared-protocol schema-3 session does NOT write dagNodeId on new assignment-created events (REV-04)', async () => {
  const { tempDir, ctx } = publicDoorSetup();
  const initialReq = request({ coordinationId: 'p07-legacy-resume-no-dagnode' });
  initialReq.steps = [initialReq.steps[0]];
  const initialResult = await runCoordinationUseCase(ctx, { requestObject: initialReq });
  assert.equal(initialResult.closed, false);

  const resumeReq = request({ coordinationId: 'p07-legacy-resume-no-dagnode' });
  resumeReq.steps = [
    { as: 'produce', type: 'operation', operationId: 'produce-candidate', targetActorId: 'doer', objective: 'Candidate.', expectedOutputs: ['artifact.md'] },
    { as: 'review', type: 'operation', operationId: 'review-candidate', targetActorId: 'reviewer', objective: 'Review.', expectedOutputs: ['review.md'], contextRefs: ['$ref:produce'] },
  ];
  await runCoordinationUseCase(ctx, { requestObject: resumeReq });

  const events = readSessionEvents('p07-legacy-resume-no-dagnode', { cwd: tempDir, repoRoot: tempDir });
  const assignmentCreatedEvents = events.filter((e) => e.type === 'assignment-created');
  assert.equal(assignmentCreatedEvents.length, 2);
  for (const event of assignmentCreatedEvents) {
    assert.equal(event.payload.dagNodeId, undefined, 'legacy resumed session must never write dagNodeId');
  }

  const replayed = replaySession('p07-legacy-resume-no-dagnode', { cwd: tempDir, repoRoot: tempDir });
  assert.equal(replayed.dag.kind, 'legacy-non-dag');
});

test('Phase 07: DAG resume with retry-pending does not treat retried node as settled and blocks successor (REV-01)', async () => {
  const { tempDir, ctx } = publicDoorSetup();
  const coordinationId = 'p07-dag-retry-pending';
  openSession({
    coordinationId,
    objective: 'DAG retry pending',
    provenanceRoot: { writerId: WRITER_ID },
    schemaVersion: SCHEMA_VERSION_3,
    dagDeclaration: normalizeDagDeclaration({
      nodes: [
        { id: 'node-produce', displayLabel: 'produce', semantics: { kind: 'operation' }, dependsOn: [] },
        { id: 'node-review', displayLabel: 'review', semantics: { kind: 'operation' }, dependsOn: ['node-produce'] },
      ],
    }),
  }, { cwd: tempDir, repoRoot: tempDir });

  const asgn = createSessionAssignment({
    coordinationId,
    taskKey: 'task-produce',
    contract: {
      objective: 'Candidate.',
      contextRefs: [],
      constraints: [],
      expectedOutputs: ['artifact.md'],
      mutation: 'read-only',
      evidence: { required: 'reported' },
      role: 'doer',
      budget: { timeoutMs: 60000, maxRuns: 1 },
    },
    caller: { writerId: WRITER_ID },
    dagNodeId: 'node-produce',
  }, { cwd: tempDir, repoRoot: tempDir });

  linkResult(coordinationId, {
    assignmentId: asgn.assignmentId,
    runId: `run_${asgn.assignmentId}_01`,
  }, { cwd: tempDir, repoRoot: tempDir, allowSupersede: true });

  recordRunRetry(coordinationId, { assignmentId: asgn.assignmentId, reason: 'retrying failed run' }, { cwd: tempDir, repoRoot: tempDir });

  const replayed = replaySession(coordinationId, { cwd: tempDir, repoRoot: tempDir });
  const produceNode = replayed.dag.nodes.find((n) => n.nodeId === 'node-produce');
  const reviewNode = replayed.dag.nodes.find((n) => n.nodeId === 'node-review');
  assert.equal(produceNode.settled, false, 'produce must not be settled after retry recorded');
  assert.equal(reviewNode.blocked, true, 'review must be blocked when predecessor is not settled');

  const shown = showCoordinationUseCase({ cwd: tempDir, repoRoot: tempDir }, { id: coordinationId });
  const shownProduce = shown.dag.nodes.find((n) => n.nodeId === 'node-produce');
  const shownReview = shown.dag.nodes.find((n) => n.nodeId === 'node-review');
  assert.equal(shownProduce.settled, false);
  assert.equal(shownReview.dependenciesSettled, false);
});

test('Phase 07: DAG execution with concurrent read-only nodes sharing cwd emits sharedCwdVerdictCaveat and refuses auto-close (REV-05 / REV-09)', async () => {
  const { tempDir, ctx } = publicDoorSetup();
  const dagReq = request({ coordinationId: 'p07-dag-shared-cwd-caveat' });
  dagReq.dag = true;
  dagReq.actors = [
    { id: 'reviewer' },
    { id: 'red-team' },
  ];
  dagReq.steps = [
    { as: 'review-1', type: 'operation', operationId: 'review-candidate', targetActorId: 'reviewer', objective: 'Review 1.', expectedOutputs: ['review1.md'], dependsOn: [] },
    { as: 'review-2', type: 'operation', operationId: 'red-team-candidate', targetActorId: 'red-team', objective: 'Review 2.', expectedOutputs: ['review2.md'], dependsOn: [] },
  ];

  const result = await runCoordinationUseCase(ctx, { requestObject: dagReq });

  assert.equal(result.closed, false, 'auto-close must be refused when nodes carry shared-cwd caveats');
  assert.equal(result.closeAttempted, false);
  assert.equal(result.status, 'running', 'session status must reflect phase, not recheck-required (REV-09)');
  assert.equal(result.caveated, true);
  assert.match(result.closeRefusalReason, /recheck-required/);

  for (const step of result.steps) {
    assert.equal(step.caveated, true);
    assert.ok(step.sharedCwdVerdictCaveat);
    assert.equal(step.sharedCwdVerdictCaveat.status, 'recheck-required');
  }

  assert.ok(Array.isArray(result.dag.nodes));
  for (const node of result.dag.nodes) {
    assert.equal(node.caveated, true);
    assert.ok(node.sharedCwdVerdictCaveat);
  }

  // Explicit closeCoordinationUseCase must also be refused (REV-05)
  const closeRes = await closeCoordinationUseCase(ctx, {
    requestObject: {
      kind: 'close',
      coordinationId: 'p07-dag-shared-cwd-caveat',
      authorizedBy: { type: 'operator', id: WRITER_ID },
    },
  });
  assert.equal(closeRes.closed, false);
  assert.match(closeRes.closeRefusalReason, /recheck-required/);

  // recordDriverDisposition with cell-closed must throw validation error (REV-05)
  assert.throws(
    () => recordDriverDisposition('p07-dag-shared-cwd-caveat', {
      targetRef: 'step:review-1',
      disposition: 'cell-closed',
      rationale: 'attempt closing caveated session',
      evidenceRefs: [],
      authorizedBy: { type: 'driver', id: WRITER_ID },
    }, { cwd: tempDir }),
    (err) => err instanceof CoordinationError && /recheck-required/.test(err.message),
  );
});

test('Phase 07: DAG resume with retried predecessor does not dispatch successor (REV-01 Probe R2)', async () => {
  const { tempDir, ctx } = publicDoorSetup();
  const coordinationId = 'p07-dag-probe-r2';
  const dagReq = request({ coordinationId });
  dagReq.dag = true;
  dagReq.actors = [
    { id: 'doer' },
    { id: 'reviewer' },
  ];
  dagReq.steps = [
    { as: 'produce', type: 'operation', operationId: 'produce-candidate', targetActorId: 'doer', objective: 'Produce candidate.', expectedOutputs: ['produce.md'], dependsOn: [] },
    { as: 'review', type: 'operation', operationId: 'review-candidate', targetActorId: 'reviewer', objective: 'Review candidate.', expectedOutputs: ['review.md'], dependsOn: ['produce'] },
  ];

  // 1. Open session with the 2-node DAG declaration
  const validatedReq = validateCoordinationRequest(dagReq);
  const dagDeclaration = compileDagRequest(validatedReq);
  openSession({
    coordinationId,
    objective: validatedReq.objective,
    provenanceRoot: { writerId: WRITER_ID },
    schemaVersion: SCHEMA_VERSION_3,
    definitionRef: { id: DEFINITION_ID, version: '1.0.0' },
    dagDeclaration,
  }, { cwd: tempDir, repoRoot: tempDir });

  // 2. Produce ran and linked a result, review has never run
  const produceAsgn = createSessionAssignment({
    coordinationId,
    taskKey: 'declared:produce-candidate',
    actorId: 'doer',
    contract: {
      objective: 'Produce candidate.',
      contextRefs: [],
      constraints: [],
      expectedOutputs: ['produce.md'],
      mutation: 'read-only',
      evidence: { required: 'reported' },
      role: 'doer',
      budget: { timeoutMs: 60000, maxRuns: 1 },
    },
    caller: { writerId: WRITER_ID },
    dagNodeId: 'node-produce',
  }, { cwd: tempDir, repoRoot: tempDir });

  linkResult(coordinationId, {
    assignmentId: produceAsgn.assignmentId,
    runId: `run_${produceAsgn.assignmentId}_01`,
  }, { cwd: tempDir, repoRoot: tempDir, allowSupersede: true });

  // 3. Simulate retry recorded on produce (superseding prior result-linked)
  recordRunRetry(coordinationId, {
    assignmentId: produceAsgn.assignmentId,
    reason: 'retrying produce run',
  }, { cwd: tempDir, repoRoot: tempDir });

  // 4. Now resume DAG with full request (produce + review)
  const resumeResult = await runCoordinationUseCase(ctx, { requestObject: dagReq });

  const produceStep = resumeResult.steps.find((s) => s.as === 'produce');
  const reviewStep = resumeResult.steps.find((s) => s.as === 'review');

  assert.equal(produceStep.schedulerOutcome, 'deferred', 'produce must be deferred when retry is pending');
  assert.equal(reviewStep.schedulerOutcome, 'deferred', 'review must not be admitted when predecessor produce is not authoritative settled');
  assert.equal(resumeResult.closed, false);
});

test('Phase 07: deferred node that settles clears error evidence in scheduler (REV-07)', async () => {
  const declaration = {
    nodes: [
      { id: 'node-a', displayLabel: 'a', semantics: { kind: 'operation' }, dependsOn: [] },
      { id: 'node-b', displayLabel: 'b', semantics: { kind: 'operation' }, dependsOn: [] },
    ],
  };
  const steps = [
    { as: 'a', type: 'operation' },
    { as: 'b', type: 'operation' },
  ];

  let nodeAAttempts = 0;
  const execute = async (step) => {
    if (step.as === 'a') {
      nodeAAttempts += 1;
      if (nodeAAttempts === 1) {
        const err = new CoordinationError('validation', 'Session concurrency limit reached', 'concurrency-cap');
        throw err;
      }
      return { as: 'a', status: 'done' };
    }
    return { as: 'b', status: 'done' };
  };

  const scheduled = await scheduleDagSteps({ steps, declaration, execute });
  const aResult = scheduled.find((s) => s.as === 'a');
  assert.equal(aResult.outcome, 'settled');
  assert.equal(aResult.error, undefined, 'deferred node that subsequently settles must not retain error');
});
