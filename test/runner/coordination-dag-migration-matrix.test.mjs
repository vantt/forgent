// Comprehensive Migration and Version Matrix
//
// Covers:
// - old binary / old legacy session (Schema 1 and Schema 2);
// - new binary / old schema 1 session;
// - new binary / old schema 2 session;
// - new binary / current non-DAG schema 3 session;
// - new binary / new DAG session;
// - old binary reading a new DAG session;
// - old binary attempting to append to a new DAG session;
// - new binary appending sequentially to legacy schema-1/2 sessions;
// - unsupported/newer schema;
// - missing session, definition or snapshot;
// - corrupt manifest/event log/declaration/fingerprint.
//
// Invariants verified:
// - Legacy schema 1/2 sessions retain sequential behavior.
// - New reader reads supported legacy sessions without rewriting history.
// - Old binary fails closed against schema 3 and cannot append unknown schema.
// - Unsupported or corrupt state fails loudly.
// - No migration rewrites historical manifests, events, snapshots or proof.

import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

import {
  openSession,
  createSessionAssignment,
  readManifest,
  readSessionEvents,
  resolveSessionPaths,
  recordRunRetry,
  linkResult,
  recordDriverDisposition,
  bindActor,
  transitionSessionStatus,
} from '../../src/runner/coordination/store.mjs';
import { normalizeDagDeclaration } from '../../src/runner/coordination/dag-declaration.mjs';
import { replaySession } from '../../src/runner/coordination/replay.mjs';
import {
  CoordinationError,
  SCHEMA_VERSION,
  SCHEMA_VERSION_2,
  SCHEMA_VERSION_3,
} from '../../src/runner/coordination/schema.mjs';
import { EventLogError, repairTruncatedLastLine } from '../../src/state/events.mjs';
import { cancelSession, openDeclaredProtocolSession, loadDefinitionForSession } from '../../src/runner/coordination/session-engine.mjs';
import { validateCoordinationRequest } from '../../src/verbs/coordination/schema.mjs';
import { runCoordinationUseCase } from '../../src/verbs/coordination/run.mjs';
import { showCoordinationUseCase } from '../../src/verbs/coordination/show.mjs';
import { closeCoordinationUseCase } from '../../src/verbs/coordination/close.mjs';
import { compileDagRequest } from '../../src/verbs/coordination/dag-request-compiler.mjs';
import { StoreError } from '../../src/state/store.mjs';
import { FlowDefinitionError } from '../../src/runner/definitions/schema.mjs';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
// Committed git commit prior to DAG and schema-3 changes:
const TRACK_BASE = 'b5d26f6c213733971f3ea17220fb8457c84dbfe5';
const DEFINITION_ID = 'test.coordination-protocol.master-loop-driver-steps';
const WRITER_ID = 'master-coordinator-1';

const tempDirs = [];
function mkTempDir(prefix = 'fgos-dag-migration-') {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

let oldSrcDir;
function extractOldSrc() {
  if (oldSrcDir) return oldSrcDir;
  const dest = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-old-src-'));
  tempDirs.push(dest);
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
  for (const dir of tempDirs) {
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch {}
  }
});

function runOldBinary(sessionCwd, coordinationId, action, extraArgs = {}) {
  const oldSrc = extractOldSrc();
  const probe = path.join(
    os.tmpdir(),
    `fgos-dag-probe-${process.pid}-${createHash('sha1').update(`${coordinationId}:${action}:${Math.random()}`).digest('hex').slice(0, 12)}.mjs`,
  );
  const replayUrl = path.join(oldSrc, 'src/runner/coordination/replay.mjs');
  const storeUrl = path.join(oldSrc, 'src/runner/coordination/store.mjs');
  fs.writeFileSync(
    probe,
    `import { replaySession } from ${JSON.stringify(replayUrl)};
import { openSession, createSessionAssignment, bindActor, linkResult, transitionSessionStatus, recordDriverDisposition } from ${JSON.stringify(storeUrl)};
const cwd = ${JSON.stringify(sessionCwd)};
const coordinationId = ${JSON.stringify(coordinationId)};
const action = ${JSON.stringify(action)};
const extra = ${JSON.stringify(extraArgs)};
const contract = {
  objective: 'Old-binary probe assignment.',
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
    code: err?.code ?? null,
    message: err?.message ?? String(err),
  }));
}
try {
  if (action === 'openSession') {
    openSession({ coordinationId, objective: 'Old open.', provenanceRoot: { writerId: 'writer-1' }, schemaVersion: extra.schemaVersion || '1', ...(extra.definitionRef ? { definitionRef: extra.definitionRef } : {}) }, { cwd });
  } else if (action === 'replay') {
    const replayed = replaySession(coordinationId, { cwd });
    process.stdout.write(JSON.stringify({ ok: true, manifest: replayed.manifest, eventCount: replayed.events.length, assignments: replayed.assignments, isDag: Boolean(replayed.dag) }));
    process.exit(0);
  } else if (action === 'createSessionAssignment') {
    const asgn = createSessionAssignment({ coordinationId, taskKey: extra.taskKey || 'old-append', contract, caller: { writerId: 'writer-1' } }, { cwd });
    process.stdout.write(JSON.stringify({ ok: true, assignmentId: asgn.assignmentId }));
    process.exit(0);
  } else if (action === 'bindActor') {
    bindActor(coordinationId, { id: 'specialist', role: 'reviewer' }, { cwd });
  } else if (action === 'linkResult') {
    linkResult(coordinationId, { assignmentId: extra.assignmentId || 'asgn_never_001', runId: extra.runId || 'run_x' }, { cwd });
  } else if (action === 'transitionSessionStatus') {
    transitionSessionStatus(coordinationId, extra.status || 'completed', {}, { cwd });
  } else if (action === 'recordDriverDisposition') {
    recordDriverDisposition(coordinationId, { targetRef: 'asgn_1', disposition: 'accepted', rationale: 'ok', evidenceRefs: [], authorizedBy: { type: 'driver', id: 'writer-1' } }, { cwd });
  } else {
    throw new Error('unknown old-binary action: ' + action);
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

function publicDoorSetup() {
  const tempDir = mkTempDir('fgos-dag-door-');
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
    objective: 'Schema-3 DAG matrix request.',
    writerId: WRITER_ID,
    protocolRef: { id: DEFINITION_ID },
    steps: [produceStep(), reviewStep()],
    ...overrides,
  };
}

function eventsRaw(tempDir, coordinationId) {
  return fs.readFileSync(path.join(tempDir, '.fgos', 'coordination', 'sessions', coordinationId, 'events.jsonl'), 'utf8');
}

// --------------------------------------------------------------------------
// Matrix Row 1: Old binary / old legacy session (Schema 1 and Schema 2)
// --------------------------------------------------------------------------

test('DAG migration matrix: old binary operates on old schema-1 and schema-2 sessions with sequential behavior', () => {
  const tempDir = mkTempDir();

  // Schema 1 under old binary
  const openRes1 = runOldBinary(tempDir, 'old-s1-session', 'openSession', { schemaVersion: '1' });
  assert.equal(openRes1.ok, true);
  const replayRes1 = runOldBinary(tempDir, 'old-s1-session', 'replay');
  assert.equal(replayRes1.ok, true);
  assert.equal(replayRes1.manifest.schemaVersion, '1');
  assert.equal(replayRes1.isDag, false);

  const asgnRes1 = runOldBinary(tempDir, 'old-s1-session', 'createSessionAssignment', { taskKey: 's1-task' });
  assert.equal(asgnRes1.ok, true);
  assert.ok(asgnRes1.assignmentId.startsWith('asgn_'));

  // Schema 2 under old binary
  const openRes2 = runOldBinary(tempDir, 'old-s2-session', 'openSession', { schemaVersion: '2' });
  assert.equal(openRes2.ok, true);
  const replayRes2 = runOldBinary(tempDir, 'old-s2-session', 'replay');
  assert.equal(replayRes2.ok, true);
  assert.equal(replayRes2.manifest.schemaVersion, '2');
  assert.equal(replayRes2.isDag, false);
});

// --------------------------------------------------------------------------
// Matrix Row 2: New binary / old schema 1 session
// --------------------------------------------------------------------------

test('DAG migration matrix: new binary reads schema-1 session, preserves legacy-non-dag mode, and refuses DAG upgrade', async () => {
  const tempDir = mkTempDir();
  const coordinationId = 'legacy-s1';

  // Created by old binary
  runOldBinary(tempDir, coordinationId, 'openSession', { schemaVersion: '1', definitionRef: { id: DEFINITION_ID, version: '1.0.0' } });
  runOldBinary(tempDir, coordinationId, 'createSessionAssignment', { taskKey: 's1-initial-task' });

  const beforeEvents = eventsRaw(tempDir, coordinationId);

  // Read by new binary
  const replayed = replaySession(coordinationId, { cwd: tempDir });
  assert.equal(replayed.manifest.schemaVersion, '1');
  assert.equal(replayed.dag.kind, 'legacy-non-dag');
  assert.deepEqual(replayed.dag.nodes, []);

  // History was not rewritten
  assert.equal(eventsRaw(tempDir, coordinationId), beforeEvents);

  // Resume attempt with dag: true must refuse pre-mutation
  writeFixture(tempDir);
  const ctx = { cwd: tempDir, repoRoot: tempDir, runnerConfig: fakeExecutor(tempDir) };
  await assert.rejects(
    runCoordinationUseCase(ctx, { requestObject: request({ dag: true, coordinationId, writerId: 'writer-1' }) }),
    (err) => err instanceof StoreError && /is legacy and cannot be converted to DAG mode on resume/.test(err.message),
  );
  assert.equal(eventsRaw(tempDir, coordinationId), beforeEvents);
});

// --------------------------------------------------------------------------
// Matrix Row 3: New binary / old schema 2 session
// --------------------------------------------------------------------------

test('DAG migration matrix: new binary reads schema-2 session, preserves legacy-non-dag mode, and refuses DAG upgrade', async () => {
  const tempDir = mkTempDir();
  const coordinationId = 'legacy-s2';

  runOldBinary(tempDir, coordinationId, 'openSession', { schemaVersion: '2', definitionRef: { id: DEFINITION_ID, version: '1.0.0' } });
  runOldBinary(tempDir, coordinationId, 'bindActor');

  const beforeEvents = eventsRaw(tempDir, coordinationId);

  const replayed = replaySession(coordinationId, { cwd: tempDir });
  assert.equal(replayed.manifest.schemaVersion, '2');
  assert.equal(replayed.dag.kind, 'legacy-non-dag');
  assert.deepEqual(replayed.dag.nodes, []);
  assert.equal(eventsRaw(tempDir, coordinationId), beforeEvents);

  writeFixture(tempDir);
  const ctx = { cwd: tempDir, repoRoot: tempDir, runnerConfig: fakeExecutor(tempDir) };
  await assert.rejects(
    runCoordinationUseCase(ctx, { requestObject: request({ dag: true, coordinationId, writerId: 'writer-1' }) }),
    (err) => err instanceof StoreError && /is legacy and cannot be converted to DAG mode on resume/.test(err.message),
  );
  assert.equal(eventsRaw(tempDir, coordinationId), beforeEvents);
});

// --------------------------------------------------------------------------
// Matrix Row 4: New binary / current non-DAG schema 3 session
// --------------------------------------------------------------------------

test('DAG migration matrix: new binary handles non-DAG schema-3 session, maintains legacy-non-dag projection, refuses DAG resume', async () => {
  const { tempDir, ctx } = publicDoorSetup();
  const coordinationId = 'non-dag-s3';

  // Run a standard sequential declared-protocol session (non-DAG)
  const result = await runCoordinationUseCase(ctx, { requestObject: request({ coordinationId }) });
  assert.equal(result.dag, undefined);
  assert.equal(result.steps.length, 2);

  const manifest = readManifest(coordinationId, { cwd: tempDir, repoRoot: tempDir });
  assert.equal(manifest.schemaVersion, SCHEMA_VERSION_3);
  assert.equal(manifest.dagDeclaration, undefined);

  const replayed = replaySession(coordinationId, { cwd: tempDir, repoRoot: tempDir });
  assert.equal(replayed.dag.kind, 'legacy-non-dag');

  const shown = showCoordinationUseCase({ cwd: tempDir, repoRoot: tempDir }, { id: coordinationId });
  assert.equal(shown.schemaMode, 'legacy-non-dag');
  assert.equal(shown.dag.kind, 'legacy-non-dag');

  const beforeEvents = eventsRaw(tempDir, coordinationId);

  // Resuming with dag: true must refuse
  await assert.rejects(
    runCoordinationUseCase(ctx, { requestObject: request({ dag: true, coordinationId }) }),
    (err) => err instanceof StoreError && /is legacy and cannot be converted to DAG mode on resume/.test(err.message),
  );
  assert.equal(eventsRaw(tempDir, coordinationId), beforeEvents);
});

// --------------------------------------------------------------------------
// Matrix Row 5: New binary / new DAG session
// --------------------------------------------------------------------------

test('DAG migration matrix: new binary executes DAG session with immutable declaration and fingerprint', async () => {
  const { tempDir, ctx } = publicDoorSetup();
  const coordinationId = 'new-dag-session';

  const result = await runCoordinationUseCase(ctx, { requestObject: request({ dag: true, coordinationId }) });
  assert.ok(result.dag);
  assert.ok(Array.isArray(result.dag.nodes));
  assert.equal(result.dag.nodes.length, 2);

  const manifest = readManifest(coordinationId, { cwd: tempDir, repoRoot: tempDir });
  assert.equal(manifest.schemaVersion, SCHEMA_VERSION_3);

  const replayed = replaySession(coordinationId, { cwd: tempDir, repoRoot: tempDir });
  assert.equal(replayed.dag.kind, 'dag');
  assert.ok(replayed.dag.declaration);
  assert.ok(replayed.dag.declaration.requestFingerprint.startsWith('sha256:'));

  const events = readSessionEvents(coordinationId, { cwd: tempDir, repoRoot: tempDir });
  const dagEvent = events.find((e) => e.type === 'dag-declared');
  assert.ok(dagEvent, 'dag-declared event must exist in events.jsonl');
  assert.equal(dagEvent.payload.declaration.requestFingerprint, replayed.dag.declaration.requestFingerprint);

  const shown = showCoordinationUseCase({ cwd: tempDir, repoRoot: tempDir }, { id: coordinationId });
  assert.equal(shown.schemaMode, 'dag');
  assert.equal(shown.dag.kind, 'dag');
});

// --------------------------------------------------------------------------
// Matrix Row 6 & 7: Old binary reading and attempting to append to new DAG session
// --------------------------------------------------------------------------

test('DAG migration matrix: old binary fails closed on schema-3 DAG session and leaves log unmodified', () => {
  const tempDir = mkTempDir();
  const coordinationId = 'old-vs-dag';

  openSession({
    coordinationId,
    objective: 'DAG test.',
    provenanceRoot: { writerId: 'writer-1' },
    schemaVersion: SCHEMA_VERSION_3,
    dagDeclaration: normalizeDagDeclaration({
      nodes: [
        { id: 'node-produce', displayLabel: 'produce', semantics: { kind: 'operation' }, dependsOn: [] },
      ],
    }),
  }, { cwd: tempDir });

  const beforeEvents = eventsRaw(tempDir, coordinationId);

  // Replay read fails with schema-version-mismatch
  const replayRes = runOldBinary(tempDir, coordinationId, 'replay');
  assert.equal(replayRes.ok, false);
  assert.equal(replayRes.category, 'schema-version-mismatch');

  // Append attempts fail and leave log unmodified
  for (const action of ['createSessionAssignment', 'bindActor', 'linkResult', 'transitionSessionStatus', 'recordDriverDisposition']) {
    const res = runOldBinary(tempDir, coordinationId, action);
    assert.equal(res.ok, false, `old binary ${action} must fail`);
    assert.equal(res.category, 'schema-version-mismatch', `old binary ${action} must report schema-version-mismatch`);
    assert.equal(eventsRaw(tempDir, coordinationId), beforeEvents, `${action} must not append events`);
  }
});

// --------------------------------------------------------------------------
// Matrix Row 8: New binary appending sequentially to legacy schema-1/2 sessions
// --------------------------------------------------------------------------

test('DAG migration matrix: new binary appends sequential operations to legacy schema-1/2 sessions without schema upgrade or DAG conversion', () => {
  const tempDir = mkTempDir();
  const coordinationId = 'legacy-seq-interop';

  // 1. Open legacy session under schema 1
  openSession({
    coordinationId,
    objective: 'Legacy sequential interop test.',
    provenanceRoot: { writerId: 'writer-1' },
    schemaVersion: SCHEMA_VERSION,
  }, { cwd: tempDir });

  // 2. New binary appends an assignment sequentially to legacy session
  const asgn1 = createSessionAssignment({
    coordinationId,
    taskKey: 'legacy-task-1',
    contract: {
      objective: 'Step 1.',
      contextRefs: [],
      constraints: [],
      expectedOutputs: ['agent-result.json'],
      mutation: 'read-only',
      evidence: { required: 'reported' },
      role: 'doer',
      budget: { timeoutMs: 10000, maxRuns: 1 },
    },
    caller: { writerId: 'writer-1' },
  }, { cwd: tempDir });

  // Verify manifest retains schemaVersion '1' (no silent upgrade)
  const manifestAfterAppend = readManifest(coordinationId, { cwd: tempDir });
  assert.equal(manifestAfterAppend.schemaVersion, SCHEMA_VERSION);
  assert.ok(manifestAfterAppend.assignmentRefs.includes(asgn1.assignmentId));

  // Verify replay reports legacy-non-dag
  const replayAfterAppend = replaySession(coordinationId, { cwd: tempDir });
  assert.equal(replayAfterAppend.dag.kind, 'legacy-non-dag');

  // 3. Old binary can read this updated legacy session
  const oldReplay = runOldBinary(tempDir, coordinationId, 'replay');
  assert.equal(oldReplay.ok, true, 'old binary must successfully read updated legacy session');
  assert.equal(oldReplay.assignments.length, 1);

  // 4. Old binary can append sequentially to this legacy session
  const oldAppend = runOldBinary(tempDir, coordinationId, 'createSessionAssignment', { taskKey: 'legacy-task-2' });
  assert.equal(oldAppend.ok, true, 'old binary must successfully append to legacy session');

  // 5. New binary can read session after old binary append
  const finalReplay = replaySession(coordinationId, { cwd: tempDir });
  assert.equal(finalReplay.manifest.schemaVersion, SCHEMA_VERSION);
  assert.equal(finalReplay.assignments.length, 2);
  assert.equal(finalReplay.dag.kind, 'legacy-non-dag');

  // --------------------------------------------------------------------------
  // Part B: Schema 2
  // --------------------------------------------------------------------------
  const coordinationId2 = 'legacy-seq-interop-schema2';
  openSession({
    coordinationId: coordinationId2,
    objective: 'Legacy schema 2 sequential interop test.',
    provenanceRoot: { writerId: 'writer-1' },
    schemaVersion: SCHEMA_VERSION_2,
  }, { cwd: tempDir });

  const asgn2 = createSessionAssignment({
    coordinationId: coordinationId2,
    taskKey: 'legacy-task-s2-1',
    contract: {
      objective: 'Step 1 in schema 2.',
      contextRefs: [],
      constraints: [],
      expectedOutputs: ['agent-result.json'],
      mutation: 'read-only',
      evidence: { required: 'reported' },
      role: 'doer',
      budget: { timeoutMs: 10000, maxRuns: 1 },
    },
    caller: { writerId: 'writer-1' },
  }, { cwd: tempDir });

  const manifestAfterAppend2 = readManifest(coordinationId2, { cwd: tempDir });
  assert.equal(manifestAfterAppend2.schemaVersion, SCHEMA_VERSION_2);
  assert.ok(manifestAfterAppend2.assignmentRefs.includes(asgn2.assignmentId));

  const replayAfterAppend2 = replaySession(coordinationId2, { cwd: tempDir });
  assert.equal(replayAfterAppend2.dag.kind, 'legacy-non-dag');

  const oldReplay2 = runOldBinary(tempDir, coordinationId2, 'replay');
  assert.equal(oldReplay2.ok, true, 'old binary must successfully read updated schema-2 legacy session');
  assert.equal(oldReplay2.assignments.length, 1);

  const oldAppend2 = runOldBinary(tempDir, coordinationId2, 'createSessionAssignment', { taskKey: 'legacy-task-s2-2' });
  assert.equal(oldAppend2.ok, true, 'old binary must successfully append to schema-2 legacy session');

  const finalReplay2 = replaySession(coordinationId2, { cwd: tempDir });
  assert.equal(finalReplay2.manifest.schemaVersion, SCHEMA_VERSION_2);
  assert.equal(finalReplay2.assignments.length, 2);
  assert.equal(finalReplay2.dag.kind, 'legacy-non-dag');
});

// --------------------------------------------------------------------------
// Matrix Row 9: Unsupported / newer schema fails loudly
// --------------------------------------------------------------------------

test('DAG migration matrix: unsupported or newer schema fails loudly with unsupported-newer-schema', () => {
  const tempDir = mkTempDir();
  const coordinationId = 'schema-future';

  // Craft a manifest with schemaVersion "4"
  const paths = resolveSessionPaths(coordinationId, { cwd: tempDir });
  fs.mkdirSync(paths.sessionDir, { recursive: true });
  fs.writeFileSync(paths.manifestPath, JSON.stringify({
    schemaVersion: '4',
    coordinationId,
    objective: 'Future session.',
    status: 'active',
    createdAt: new Date().toISOString(),
    provenanceRoot: { writerId: 'future-writer' },
    aggregateBounds: { maxAssignments: 10, maxConcurrency: 2, maxRounds: 5, maxTaskDepth: 3, wallTimeMs: 60000 },
    assignmentRefs: [],
  }, null, 2));
  fs.writeFileSync(paths.eventsPath, '');

  assert.throws(
    () => replaySession(coordinationId, { cwd: tempDir }),
    (err) => err instanceof CoordinationError && err.code === 'unsupported-newer-schema',
  );

  assert.throws(
    () => showCoordinationUseCase({ cwd: tempDir, repoRoot: tempDir }, { id: coordinationId }),
    (err) => err instanceof CoordinationError && err.code === 'unsupported-newer-schema',
  );
});

// --------------------------------------------------------------------------
// Matrix Row 10: Missing session, definition or snapshot
// --------------------------------------------------------------------------

test('DAG migration matrix: missing session, definition, or snapshot fail closed with distinct error types', async () => {
  const { tempDir, ctx } = publicDoorSetup();

  // Missing session -> CoordinationError('not-found')
  assert.throws(
    () => showCoordinationUseCase({ cwd: tempDir, repoRoot: tempDir }, { id: 'session-does-not-exist' }),
    (err) => err instanceof CoordinationError && err.category === 'not-found',
  );

  // Missing definition -> FlowDefinitionError('not-found')
  await assert.rejects(
    runCoordinationUseCase(ctx, { requestObject: request({ protocolRef: { id: 'test.coordination-protocol.non-existent' } }) }),
    (err) => err instanceof FlowDefinitionError && err.category === 'not-found',
  );

  // Schema 3 session missing snapshot file -> CoordinationError('corrupt-log')
  const coordinationId = 'missing-snapshot';
  const manifest = openSession({
    coordinationId,
    objective: 'Missing snapshot test',
    provenanceRoot: { writerId: 'writer-1' },
    schemaVersion: SCHEMA_VERSION_3,
    definitionRef: { id: DEFINITION_ID, version: '1.0.0' },
    snapshotRef: { digest: 'deadbeef' },
  }, { cwd: tempDir, repoRoot: tempDir });

  // Delete snapshot.json if created
  const paths = resolveSessionPaths(coordinationId, { cwd: tempDir, repoRoot: tempDir });
  const snapshotPath = path.join(paths.sessionDir, 'snapshot.json');
  if (fs.existsSync(snapshotPath)) fs.rmSync(snapshotPath);

  assert.throws(
    () => loadDefinitionForSession(manifest, { cwd: tempDir, repoRoot: tempDir }),
    (err) => err instanceof CoordinationError && err.category === 'corrupt-log' && /missing its snapshot file/.test(err.message),
  );
});

// --------------------------------------------------------------------------
// Matrix Row 11: Corrupt manifest / event log / declaration / fingerprint
// --------------------------------------------------------------------------

test('DAG migration matrix: corrupt manifest, truncated event log, and tampered declaration fail closed', () => {
  const tempDir = mkTempDir();

  // 1. Corrupt manifest JSON syntax
  const id1 = 'corrupt-manifest';
  const paths1 = resolveSessionPaths(id1, { cwd: tempDir });
  fs.mkdirSync(paths1.sessionDir, { recursive: true });
  fs.writeFileSync(paths1.manifestPath, '{invalid-json:');
  fs.writeFileSync(paths1.eventsPath, '');

  assert.throws(
    () => readManifest(id1, { cwd: tempDir }),
    (err) => err instanceof CoordinationError && err.category === 'corrupt-log',
  );

  // 2. Truncated event log line
  const id2 = 'truncated-log';
  openSession({
    coordinationId: id2,
    objective: 'Truncated log test',
    provenanceRoot: { writerId: 'writer-1' },
    schemaVersion: SCHEMA_VERSION_3,
    dagDeclaration: normalizeDagDeclaration({
      nodes: [{ id: 'node-n1', displayLabel: 'n1', semantics: { kind: 'operation' }, dependsOn: [] }],
    }),
  }, { cwd: tempDir });

  const paths2 = resolveSessionPaths(id2, { cwd: tempDir });
  fs.appendFileSync(paths2.eventsPath, '{"type":"assignment-created","payload":');

  assert.throws(
    () => replaySession(id2, { cwd: tempDir }),
    (err) => err instanceof EventLogError && err.category === 'corrupt-log',
  );

  // repairTruncatedLastLine restores valid prefix
  const repairResult = repairTruncatedLastLine(paths2.eventsPath);
  assert.ok(repairResult.backupPath);
  const replayedAfterRepair = replaySession(id2, { cwd: tempDir });
  assert.equal(replayedAfterRepair.dag.kind, 'dag');
  assert.equal(replayedAfterRepair.dag.nodes[0].pending, true);

  // 3. Tampered declaration fingerprint in events.jsonl
  const id3 = 'tampered-fp';
  openSession({
    coordinationId: id3,
    objective: 'Tampered fp test',
    provenanceRoot: { writerId: 'writer-1' },
    schemaVersion: SCHEMA_VERSION_3,
    dagDeclaration: normalizeDagDeclaration({
      nodes: [{ id: 'node-n1', displayLabel: 'n1', semantics: { kind: 'operation' }, dependsOn: [] }],
    }),
  }, { cwd: tempDir });

  const paths3 = resolveSessionPaths(id3, { cwd: tempDir });
  const rawEvents = fs.readFileSync(paths3.eventsPath, 'utf8').trim().split('\n');
  const tampered = rawEvents.map((line) => {
    const ev = JSON.parse(line);
    if (ev.type === 'dag-declared') {
      ev.payload.declaration.requestFingerprint = 'sha256:ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
      return JSON.stringify(ev);
    }
    return line;
  }).join('\n') + '\n';
  fs.writeFileSync(paths3.eventsPath, tampered);

  assert.throws(
    () => replaySession(id3, { cwd: tempDir }),
    (err) => err instanceof CoordinationError && err.category === 'validation' && /requestFingerprint does not match normalized request/.test(err.message),
  );
});
