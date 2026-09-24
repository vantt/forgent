// test/runner/coordination-phase2-concurrency.test.mjs -- Unit 2E:
// Concurrency, two-OS-process races, crash/retry idempotency, schema 1/2/3
// compatibility, and replay equivalence for Phase 2 semantic coordination use cases.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const ACTIONS_MODULE_URL = pathToFileURL(path.resolve('src/verbs/coordination/actions.mjs')).href;
const DISPATCH_MODULE_URL = pathToFileURL(path.resolve('src/runner/dispatch.mjs')).href;
import {
  executeOperationUseCase,
  executeAuthorizeAndDispatchUseCase,
  executeFanOutUseCase,
  executeContributionUseCase,
  executeHumanTurnUseCase,
  executeDispositionUseCase,
  executeCloseUseCase,
  showCoordinationActionsUseCase,
} from '../../src/verbs/coordination/actions.mjs';
import { showCoordinationStatusUseCase } from '../../src/verbs/coordination/status.mjs';
import { startCoordinationUseCase } from '../../src/verbs/coordination/start.mjs';
import { replaySession } from '../../src/runner/coordination/replay.mjs';
import { protocolOperationStamp } from '../../src/runner/coordination/legality-facts.mjs';

const PROTOCOL_ID = 'core.coordination-protocol.declared-consult';

function setupSessionFixture(coordinationId, { schemaVersion = '3', eventCount = 0, withDefinition = true, completed = false } = {}) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-phase2-concurrency-'));
  const sessionDir = path.join(tempDir, '.fgos/coordination/sessions', coordinationId);
  fs.mkdirSync(sessionDir, { recursive: true });

  let def = null;
  let defDigest = null;
  if (withDefinition) {
    def = {
      apiVersion: 'fgos.dev/v1alpha1',
      kind: 'FlowDefinition',
      metadata: { id: PROTOCOL_ID, version: '1.0.0' },
      spec: {
        profile: { kind: 'CoordinationProtocol' },
        roles: ['requester', 'consultant'],
        actors: [{ id: 'requester-actor', role: 'requester' }, { id: 'consultant-actor', role: 'consultant' }],
        operations: [
          { id: 'request-consult', role: 'requester', task: { contractTemplate: 'consult-request' } },
          { id: 'provide-consult', role: 'consultant', task: { contractTemplate: 'consult-response' } },
        ],
        graph: {
          entry: 'phase-request',
          nodes: [
            {
              id: 'phase-request',
              operations: [{ ref: 'request-consult', actor: 'requester-actor' }],
              transitions: ['phase-consult'],
            },
            {
              id: 'phase-consult',
              operations: [{ ref: 'provide-consult', actor: 'consultant-actor' }],
              transitions: [],
            },
          ],
        },
      },
    };
    const defContent = JSON.stringify(def);
    const hexDigest = crypto.createHash('sha256').update(defContent).digest('hex');
    defDigest = 'sha256:' + hexDigest;
    if (schemaVersion === '3') {
      fs.writeFileSync(path.join(sessionDir, 'snapshot.json'), defContent);
    }
  }

  const asgnDir = path.join(tempDir, '.fgos/assignments/asgn-1');
  fs.mkdirSync(asgnDir, { recursive: true });
  fs.writeFileSync(
    path.join(asgnDir, 'assignment.json'),
    JSON.stringify({
      assignmentId: 'asgn-1',
      role: withDefinition ? 'requester' : 'worker-1',
      provenance: {
        kind: 'inline',
        contract: {
          objective: 'stub',
          constraints: def ? [protocolOperationStamp(def, 'request-consult')] : [],
        },
      },
    }),
  );

  const manifest = {
    schemaVersion,
    coordinationId,
    status: 'active',
    objective: 'Test Phase 2 concurrency and replay',
    createdAt: new Date().toISOString(),
    provenanceRoot: { writerId: 'driver-1' },
    actors: withDefinition
      ? [{ id: 'requester-actor', role: 'requester' }]
      : [{ id: 'worker-1', role: 'worker-1' }],
    aggregateBounds: { wallTimeMs: 10000, maxAssignments: 10, maxConcurrency: 2, maxRounds: 5, maxTaskDepth: 2 },
    assignmentRefs: completed ? ['asgn-1'] : [],
    completedAt: null,
    ...(withDefinition ? {
      definitionRef: { id: PROTOCOL_ID, version: '1.0.0' },
      ...(schemaVersion === '3' ? { snapshotRef: { digest: defDigest.replace('sha256:', '') } } : {}),
    } : {}),
  };
  fs.writeFileSync(path.join(sessionDir, 'session.json'), JSON.stringify(manifest, null, 2));

  const eventsPath = path.join(sessionDir, 'events.jsonl');
  let eventsContent = '';
  if (completed) {
    eventsContent += JSON.stringify({
      type: 'assignment-created',
      payload: { assignmentId: 'asgn-1', actorId: withDefinition ? 'requester-actor' : 'worker-1' },
    }) + '\n';
    eventsContent += JSON.stringify({
      type: 'result-linked',
      payload: { assignmentId: 'asgn-1', runId: 'run_asgn-1_01' },
    }) + '\n';

    const runDir = path.join(tempDir, '.fgos', 'assignments', 'asgn-1', 'runs', '01');
    fs.mkdirSync(runDir, { recursive: true });
    fs.writeFileSync(
      path.join(runDir, 'result.json'),
      JSON.stringify({
        assignmentId: 'asgn-1',
        runId: 'run_asgn-1_01',
        status: 'done',
        confidence: 'reported',
      }),
    );
  }
  for (let i = 0; i < eventCount; i++) {
    eventsContent += JSON.stringify({
      type: 'actor-bound',
      payload: { actorId: `worker-${i}`, role: 'requester' },
    }) + '\n';
  }
  fs.writeFileSync(eventsPath, eventsContent);

  return { tempDir, sessionDir, eventsPath, manifest, def, defDigest };
}

const runWorkerSubprocess = (script) =>
  new Promise((resolve) => {
    const p = spawn(process.execPath, [script]);
    let out = '';
    let err = '';
    p.stdout.on('data', (d) => (out += d.toString()));
    p.stderr.on('data', (d) => (err += d.toString()));
    p.on('close', (code) => {
      if (code !== 0 && !out.trim()) {
        out = `PROCESS_EXIT_${code}:${err.trim()}`;
      }
      resolve({ code, out: out.trim(), err: err.trim() });
    });
  });

// ─── 1. Real two-OS-process concurrency race: identical retry succeeds idempotently ───

test('Unit 2E: concurrent two-OS-process semantic human-turn race with identical payload yields idempotent success', async () => {
  const coordinationId = 'coord_p2_concurrency_race_1';
  const { tempDir } = setupSessionFixture(coordinationId, { schemaVersion: '3' });

  try {
    const ctx = { cwd: tempDir, repoRoot: tempDir };
    const actionsRes = showCoordinationActionsUseCase(ctx, { id: coordinationId });
    const action = actionsRes.actions.find((a) => a.kind === 'record-human-turn');
    assert.ok(action, 'record-human-turn must be projected');

    const artifactPath = path.join(tempDir, 'human-turn-artifact.md');
    fs.writeFileSync(artifactPath, '# User Note\nApproved for next phase.\n');

    const payload = {
      turnId: 'turn-c1',
      turnOrdinal: 1,
      channel: 'cli',
      artifactRef: artifactPath,
      externalRef: 'ext-c1',
      attributedTo: { type: 'person', id: 'reviewer-human' },
    };

    const makeWorker = (workerPath) => {
      fs.writeFileSync(
        workerPath,
        `
        import { executeHumanTurnUseCase } from '${ACTIONS_MODULE_URL}';
        try {
          const res = await executeHumanTurnUseCase(
            { cwd: ${JSON.stringify(tempDir)}, repoRoot: ${JSON.stringify(tempDir)} },
            {
              id: '${coordinationId}',
              actionKey: '${action.actionKey}',
              writerId: 'driver-1',
              turnId: '${payload.turnId}',
              turnOrdinal: ${payload.turnOrdinal},
              channel: '${payload.channel}',
              artifactRef: ${JSON.stringify(payload.artifactRef)},
              externalRef: '${payload.externalRef}',
              attributedTo: ${JSON.stringify(payload.attributedTo)},
            }
          );
          if (res.idempotent) {
            process.stdout.write('OUTCOME:IDEMPOTENT\\n');
          } else {
            process.stdout.write('OUTCOME:INITIAL\\n');
          }
        } catch (err) {
          process.stdout.write('OUTCOME:REFUSED:' + (err.category || err.message) + '\\n');
        }
        `,
      );
    };

    const worker1 = path.join(tempDir, 'worker1.mjs');
    const worker2 = path.join(tempDir, 'worker2.mjs');
    makeWorker(worker1);
    makeWorker(worker2);

    const [res1, res2] = await Promise.all([runWorkerSubprocess(worker1), runWorkerSubprocess(worker2)]);
    const outcomes = [res1.out, res2.out].sort();

    assert.equal(outcomes[0], 'OUTCOME:IDEMPOTENT', 'Concurrent sibling must safely recover cached idempotent result');
    assert.equal(outcomes[1], 'OUTCOME:INITIAL', 'One process must win the initial execution');
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

// ─── 2. Real two-OS-process concurrency race: conflicting payload fails cleanly ───

test('Unit 2E: concurrent two-OS-process semantic human-turn race with conflicting payload rejects sibling', async () => {
  const coordinationId = 'coord_p2_concurrency_race_2';
  const { tempDir } = setupSessionFixture(coordinationId, { schemaVersion: '3' });

  try {
    const ctx = { cwd: tempDir, repoRoot: tempDir };
    const actionsRes = showCoordinationActionsUseCase(ctx, { id: coordinationId });
    const action = actionsRes.actions.find((a) => a.kind === 'record-human-turn');
    assert.ok(action, 'record-human-turn must be projected');

    const artifactPath1 = path.join(tempDir, 'human-turn-artifact-1.md');
    fs.writeFileSync(artifactPath1, '# Note 1\nContent A\n');
    const artifactPath2 = path.join(tempDir, 'human-turn-artifact-2.md');
    fs.writeFileSync(artifactPath2, '# Note 2\nConflicting Content B\n');

    const makeWorker = (workerPath, turnId, extRef, artifact) => {
      fs.writeFileSync(
        workerPath,
        `
        import { executeHumanTurnUseCase } from '${ACTIONS_MODULE_URL}';
        try {
          const res = await executeHumanTurnUseCase(
            { cwd: ${JSON.stringify(tempDir)}, repoRoot: ${JSON.stringify(tempDir)} },
            {
              id: '${coordinationId}',
              actionKey: '${action.actionKey}',
              writerId: 'driver-1',
              turnId: '${turnId}',
              turnOrdinal: 1,
              channel: 'cli',
              artifactRef: ${JSON.stringify(artifact)},
              externalRef: '${extRef}',
              attributedTo: { type: 'person', id: 'reviewer-human' },
            }
          );
          if (res.idempotent) {
            process.stdout.write('OUTCOME:IDEMPOTENT\\n');
          } else {
            process.stdout.write('OUTCOME:INITIAL\\n');
          }
        } catch (err) {
          process.stdout.write('OUTCOME:REFUSED:' + (err.category || err.message) + '\\n');
        }
        `,
      );
    };

    const worker1 = path.join(tempDir, 'worker1_conf.mjs');
    const worker2 = path.join(tempDir, 'worker2_conf.mjs');
    makeWorker(worker1, 'turn-c2-a', 'ext-c2-a', artifactPath1);
    makeWorker(worker2, 'turn-c2-b', 'ext-c2-b', artifactPath2);

    const [res1, res2] = await Promise.all([runWorkerSubprocess(worker1), runWorkerSubprocess(worker2)]);
    const outcomes = [res1.out, res2.out].sort();

    assert.equal(outcomes[0], 'OUTCOME:INITIAL', 'One process must win the initial execution');
    assert.match(
      outcomes[1],
      /OUTCOME:REFUSED/,
      'Conflicting sibling must be refused with payload conflict or stale key',
    );
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

// ─── 3. Stale action key rejection across process boundaries ───

test('Unit 2E: stale action key is refused across process boundaries once session advances', async () => {
  const coordinationId = 'coord_p2_stale_across_procs';
  const { tempDir } = setupSessionFixture(coordinationId, { schemaVersion: '3' });

  try {
    const ctx = { cwd: tempDir, repoRoot: tempDir };
    const actionsRes = showCoordinationActionsUseCase(ctx, { id: coordinationId });
    const initialAction = actionsRes.actions.find((a) => a.kind === 'record-human-turn');
    assert.ok(initialAction, 'record-human-turn must be projected');

    const artifactPath = path.join(tempDir, 'human-advance.md');
    fs.writeFileSync(artifactPath, '# Advance\nInitial advance.\n');

    // Mutate session in process 1
    const res1 = await executeHumanTurnUseCase(ctx, {
      id: coordinationId,
      actionKey: initialAction.actionKey,
      writerId: 'driver-1',
      turnId: 'turn-stale-1',
      turnOrdinal: 1,
      channel: 'cli',
      artifactRef: artifactPath,
      externalRef: 'ext-stale-1',
      attributedTo: { type: 'person', id: 'reviewer-human' },
    });
    assert.equal(res1.status, 'recorded');

    // Process 2 attempts to use initialKey with a second turn
    const artifactPath2 = path.join(tempDir, 'human-advance-2.md');
    fs.writeFileSync(artifactPath2, '# Advance 2\nSecond advance attempt.\n');

    await assert.rejects(
      async () => {
        await executeHumanTurnUseCase(ctx, {
          id: coordinationId,
          actionKey: initialAction.actionKey,
          writerId: 'driver-1',
          turnId: 'turn-stale-2',
          turnOrdinal: 2,
          channel: 'cli',
          artifactRef: artifactPath2,
          externalRef: 'ext-stale-2',
          attributedTo: { type: 'person', id: 'reviewer-human' },
        });
      },
      /stale|precondition|does not match authoritative projection/i,
    );
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

// ─── 4. Schema 1, 2, and 3 compatibility for semantic actions ───

test('Unit 2E: semantic use cases work correctly across schemaVersion 1, 2, and 3 sessions', async () => {
  for (const schemaVersion of ['1', '2', '3']) {
    const coordinationId = `coord_p2_schema_${schemaVersion}`;
    const { tempDir } = setupSessionFixture(coordinationId, {
      schemaVersion,
      withDefinition: true,
      completed: false,
    });

    try {
      const ctx = { cwd: tempDir, repoRoot: tempDir };
      const actionsRes = showCoordinationActionsUseCase(ctx, { id: coordinationId });
      const action = actionsRes.actions.find((a) => a.kind === 'record-human-turn');
      assert.ok(action, `record-human-turn must be projected for schema ${schemaVersion}`);

      const artifactPath = path.join(tempDir, `note-${schemaVersion}.md`);
      fs.writeFileSync(artifactPath, `# Note for schema ${schemaVersion}\n`);

      const res = await executeHumanTurnUseCase(ctx, {
        id: coordinationId,
        actionKey: action.actionKey,
        writerId: 'driver-1',
        turnId: `turn-${schemaVersion}`,
        turnOrdinal: 1,
        channel: 'cli',
        artifactRef: artifactPath,
        externalRef: `ext-${schemaVersion}`,
        attributedTo: { type: 'person', id: 'reviewer-human' },
      });

      assert.equal(res.status, 'recorded');
      assert.equal(res.coordinationId, coordinationId);

      // Verify status projection reflects the advance
      const statusRes = showCoordinationStatusUseCase(ctx, { id: coordinationId });
      assert.equal(statusRes.session.schemaVersion, schemaVersion);
      assert.equal(statusRes.readyToClose, false);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }
});

// ─── 5. Replay equivalence before and after semantic actions ───

test('Unit 2E: replay produces byte-identical sequential event projection through semantic use cases', async () => {
  const coordinationId = 'coord_p2_replay_equiv';
  const { tempDir } = setupSessionFixture(coordinationId, { schemaVersion: '3' });

  try {
    const ctx = { cwd: tempDir, repoRoot: tempDir };

    // Initial replay
    const initialStatus = showCoordinationStatusUseCase(ctx, { id: coordinationId, replay: true });
    assert.ok(initialStatus.replay);
    assert.equal(initialStatus.replay.events.length, 0);

    // Apply human-turn action
    const action = initialStatus.actions.find((a) => a.kind === 'record-human-turn');
    const artifactPath = path.join(tempDir, 'replay-note.md');
    fs.writeFileSync(artifactPath, '# Replay Note\nTesting replay integrity.\n');

    await executeHumanTurnUseCase(ctx, {
      id: coordinationId,
      actionKey: action.actionKey,
      writerId: 'driver-1',
      turnId: 'turn-replay-1',
      turnOrdinal: 1,
      channel: 'cli',
      artifactRef: artifactPath,
      externalRef: 'ext-replay-1',
      attributedTo: { type: 'person', id: 'reviewer-human' },
    });

    // Replay after action
    const statusAfter = showCoordinationStatusUseCase(ctx, { id: coordinationId, replay: true });
    assert.ok(statusAfter.replay);
    assert.equal(statusAfter.replay.events.length, 1);
    assert.equal(statusAfter.replay.events[0].type, 'human-turn-recorded');

    // Direct replaySession engine call equivalence
    const engineReplay = replaySession(coordinationId, { cwd: tempDir, repoRoot: tempDir });
    assert.deepEqual(statusAfter.replay.events, engineReplay.events);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

// ─── 6. Two-OS-process race on executeCloseUseCase ───

test('Unit 2E: concurrent two-OS-process executeCloseUseCase race', async () => {
  const coordinationId = 'coord_p2_close_race';
  const { tempDir } = setupSessionFixture(coordinationId, {
    schemaVersion: '3',
    withDefinition: false,
    completed: true,
  });

  try {
    const ctx = { cwd: tempDir, repoRoot: tempDir };
    const actionsRes = showCoordinationActionsUseCase(ctx, { id: coordinationId });
    const closeAction = actionsRes.actions.find((a) => a.kind === 'close');
    assert.ok(closeAction, 'close action must be projected when session is completed');

    const makeWorker = (workerPath) => {
      fs.writeFileSync(
        workerPath,
        `
        import { executeCloseUseCase } from '${ACTIONS_MODULE_URL}';
        try {
          const res = await executeCloseUseCase(
            { cwd: ${JSON.stringify(tempDir)}, repoRoot: ${JSON.stringify(tempDir)} },
            {
              id: '${coordinationId}',
              actionKey: '${closeAction.actionKey}',
              writerId: 'driver-1',
              reason: 'Close concurrency race test',
            }
          );
          if (res.closed) {
            process.stdout.write('OUTCOME:CLOSED\\n');
          } else {
            process.stdout.write('OUTCOME:NOT_CLOSED\\n');
          }
        } catch (err) {
          process.stdout.write('OUTCOME:REFUSED:' + (err.category || err.message) + '\\n');
        }
        `,
      );
    };

    const worker1 = path.join(tempDir, 'worker1_close.mjs');
    const worker2 = path.join(tempDir, 'worker2_close.mjs');
    makeWorker(worker1);
    makeWorker(worker2);

    const [res1, res2] = await Promise.all([runWorkerSubprocess(worker1), runWorkerSubprocess(worker2)]);
    const outcomes = [res1.out, res2.out].sort();

    // The first closes the session. The second either recovers idempotently as closed or is refused as already closed/stale.
    assert.equal(outcomes[1], 'OUTCOME:CLOSED', 'At least one process must successfully close');
    assert.ok(
      outcomes[0] === 'OUTCOME:CLOSED' || outcomes[0].startsWith('OUTCOME:REFUSED'),
      `Second process must be idempotent close or refused: ${outcomes[0]}`,
    );
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

// ─── Helpers for multi-family concurrency proof matrix ────────────────────────

function writeFakeExecutor(tempDir) {
  const executorScript = path.join(tempDir, 'fake-executor.mjs');
  fs.writeFileSync(
    executorScript,
    `
    import fs from 'node:fs';
    import path from 'node:path';
    const assignmentsRoot = ${JSON.stringify(path.join(tempDir, '.fgos', 'assignments'))};
    if (fs.existsSync(assignmentsRoot)) {
      for (const asgn of fs.readdirSync(assignmentsRoot)) {
        const runsDir = path.join(assignmentsRoot, asgn, 'runs');
        if (!fs.existsSync(runsDir)) continue;
        for (const run of fs.readdirSync(runsDir)) {
          const runDir = path.join(runsDir, run);
          if (fs.existsSync(runDir) && !fs.existsSync(path.join(runDir, 'agent-result.json'))) {
            fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Report\\nDone.\\n');
            fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'Done.' }));
          }
        }
      }
    }
    const invocationsLog = ${JSON.stringify(path.join(tempDir, 'executor-invocations.txt'))};
    fs.appendFileSync(invocationsLog, 'INVOCATION\\n');
    process.stdout.write('Done.\\n');
    process.exit(0);
    `,
  );
  const configPath = path.join(tempDir, '.fgos', 'config.json');
  const existing = fs.existsSync(configPath) ? JSON.parse(fs.readFileSync(configPath, 'utf8')) : {};
  const config = {
    ...existing,
    runner: {
      ...(existing.runner ?? {}),
      executor: { allowCrossProvider: true, command: process.execPath, args: [executorScript, '{prompt}'] },
      executors: {
        'exec-family-a': {
          kind: 'agent',
          providerModel: 'family-a',
          allowCrossProvider: true,
          invocations: [{ via: 'cli', adapter: 'cli-spawn', command: process.execPath, args: [executorScript, '{prompt}'] }],
        },
        'exec-family-b': {
          kind: 'agent',
          providerModel: 'family-b',
          allowCrossProvider: true,
          invocations: [{ via: 'cli', adapter: 'cli-spawn', command: process.execPath, args: [executorScript, '{prompt}'] }],
        },
      },
      models: { standard: 'test-model', nano: 'test-model' },
      modelPolicies: {
        claude: { nano: 'test-model', standard: 'test-model' },
        'family-a': { nano: 'test-model', standard: 'test-model' },
        'family-b': { nano: 'test-model', standard: 'test-model' },
      },
      timeoutMs: 20000,
    },
  };
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

function setupOperationEnv(coordinationId) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-op-concurrency-'));
  writeFakeExecutor(tempDir);
  const def = {
    apiVersion: 'fgos.dev/v1alpha1',
    kind: 'FlowDefinition',
    metadata: { id: 'test.operation-protocol', version: '1.0.0' },
    spec: {
      profile: { kind: 'CoordinationProtocol' },
      roles: ['worker'],
      actors: [{ id: 'worker-1', role: 'worker' }],
      operations: [
        { id: 'do-work', role: 'worker' },
      ],
      graph: {
        entry: 'phase-1',
        nodes: [
          {
            id: 'phase-1',
            operations: [{ ref: 'do-work', actor: 'worker-1' }],
            transitions: [],
          },
        ],
      },
    },
  };
  const defContent = JSON.stringify(def, null, 2);
  const sessionDir = path.join(tempDir, '.fgos/coordination/sessions', coordinationId);
  fs.mkdirSync(sessionDir, { recursive: true });
  fs.writeFileSync(path.join(sessionDir, 'snapshot.json'), defContent);
  const defDigest = 'sha256:' + crypto.createHash('sha256').update(defContent).digest('hex');

  const manifest = {
    schemaVersion: '3',
    coordinationId,
    status: 'active',
    objective: 'Test operation concurrency',
    createdAt: new Date().toISOString(),
    provenanceRoot: { writerId: 'driver-1' },
    actors: [{ id: 'worker-1', role: 'worker' }],
    aggregateBounds: { wallTimeMs: 10000, maxAssignments: 10, maxConcurrency: 2, maxRounds: 5, maxTaskDepth: 2 },
    assignmentRefs: [],
    completedAt: null,
    definitionRef: { id: 'test.operation-protocol', version: '1.0.0' },
    snapshotRef: { digest: defDigest.replace('sha256:', '') },
  };
  fs.writeFileSync(path.join(sessionDir, 'session.json'), JSON.stringify(manifest, null, 2));
  fs.writeFileSync(path.join(sessionDir, 'events.jsonl'), '');
  return { tempDir, sessionDir };
}

function setupAuthorizeEnv(coordinationId) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-auth-concurrency-'));
  writeFakeExecutor(tempDir);
  const def = {
    apiVersion: 'fgos.dev/v1alpha1',
    kind: 'FlowDefinition',
    metadata: { id: 'test.auth-protocol', version: '1.0.0' },
    spec: {
      profile: { kind: 'CoordinationProtocol' },
      roles: ['specialist'],
      actors: [{ id: 'specialist-1', role: 'specialist' }],
      operations: [
        { id: 'opt-consult', role: 'specialist' },
      ],
      graph: {
        entry: 'phase-1',
        nodes: [
          {
            id: 'phase-1',
            operations: [{ ref: 'opt-consult', actor: 'specialist-1', activation: { mode: 'driver-authorized' } }],
            transitions: [],
          },
        ],
      },
    },
  };
  const defContent = JSON.stringify(def, null, 2);
  const sessionDir = path.join(tempDir, '.fgos/coordination/sessions', coordinationId);
  fs.mkdirSync(sessionDir, { recursive: true });
  fs.writeFileSync(path.join(sessionDir, 'snapshot.json'), defContent);
  const defDigest = 'sha256:' + crypto.createHash('sha256').update(defContent).digest('hex');

  const manifest = {
    schemaVersion: '3',
    coordinationId,
    status: 'active',
    objective: 'Test authorize concurrency',
    createdAt: new Date().toISOString(),
    provenanceRoot: { writerId: 'driver-1' },
    actors: [{ id: 'specialist-1', role: 'specialist' }],
    aggregateBounds: { wallTimeMs: 10000, maxAssignments: 10, maxConcurrency: 2, maxRounds: 5, maxTaskDepth: 2 },
    assignmentRefs: [],
    completedAt: null,
    definitionRef: { id: 'test.auth-protocol', version: '1.0.0' },
    snapshotRef: { digest: defDigest.replace('sha256:', '') },
  };
  fs.writeFileSync(path.join(sessionDir, 'session.json'), JSON.stringify(manifest, null, 2));
  fs.writeFileSync(path.join(sessionDir, 'events.jsonl'), '');
  return { tempDir, sessionDir };
}

function setupFanOutEnv(coordinationId) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-fanout-concurrency-'));
  writeFakeExecutor(tempDir);
  const def = {
    apiVersion: 'fgos.dev/v1alpha1',
    kind: 'FlowDefinition',
    metadata: { id: 'test.fanout-protocol', version: '1.0.0' },
    spec: {
      profile: {
        kind: 'CoordinationProtocol',
        cohort: { independence: 'isolated-until-fan-in' },
      },
      roles: ['researcher'],
      actors: [
        { id: 'researcher-1', role: 'researcher' },
        { id: 'researcher-2', role: 'researcher' },
      ],
      operations: [
        { id: 'op-research', role: 'researcher' },
      ],
      graph: {
        entry: 'phase-1',
        nodes: [
          {
            id: 'phase-1',
            operations: [
              { ref: 'op-research', actor: 'researcher-1' },
              { ref: 'op-research', actor: 'researcher-2' },
            ],
            transitions: [],
          },
        ],
      },
    },
  };
  const defContent = JSON.stringify(def, null, 2);
  const sessionDir = path.join(tempDir, '.fgos/coordination/sessions', coordinationId);
  fs.mkdirSync(sessionDir, { recursive: true });
  fs.writeFileSync(path.join(sessionDir, 'snapshot.json'), defContent);
  const defDigest = 'sha256:' + crypto.createHash('sha256').update(defContent).digest('hex');

  const manifest = {
    schemaVersion: '3',
    coordinationId,
    status: 'active',
    objective: 'Test fanout concurrency',
    createdAt: new Date().toISOString(),
    provenanceRoot: { writerId: 'driver-1' },
    actors: [
      { id: 'researcher-1', role: 'researcher' },
      { id: 'researcher-2', role: 'researcher' },
    ],
    aggregateBounds: { wallTimeMs: 10000, maxAssignments: 10, maxConcurrency: 2, maxRounds: 5, maxTaskDepth: 2 },
    assignmentRefs: [],
    completedAt: null,
    definitionRef: { id: 'test.fanout-protocol', version: '1.0.0' },
    snapshotRef: { digest: defDigest.replace('sha256:', '') },
  };
  fs.writeFileSync(path.join(sessionDir, 'session.json'), JSON.stringify(manifest, null, 2));
  fs.writeFileSync(path.join(sessionDir, 'events.jsonl'), '');
  return { tempDir, sessionDir };
}

function setupContributionEnv(coordinationId) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-contrib-concurrency-'));
  const def = {
    apiVersion: 'fgos.dev/v1alpha1',
    kind: 'FlowDefinition',
    metadata: { id: 'test.contrib-protocol', version: '1.0.0' },
    spec: {
      profile: {
        kind: 'CoordinationProtocol',
        topology: {
          visibilityWindows: [
            {
              id: 'win-1',
              opensAfter: { milestone: 'listed-results-linked', operationRefs: [] },
              permits: { sourceOperationRefs: [], delivery: 'artifact-refs' },
            },
          ],
        },
      },
      roles: ['critic'],
      actors: [{ id: 'critic-1', role: 'critic' }],
      operations: [
        {
          id: 'op-critique',
          role: 'critic',
          contributions: { allowedTypes: ['proposal', 'objection'] },
        },
      ],
      graph: {
        entry: 'phase-1',
        nodes: [
          {
            id: 'phase-1',
            operations: [{ ref: 'op-critique', actor: 'critic-1', contextAccess: { visibilityWindowRef: 'win-1' } }],
            transitions: [],
          },
        ],
      },
    },
  };
  const defContent = JSON.stringify(def, null, 2);
  const sessionDir = path.join(tempDir, '.fgos/coordination/sessions', coordinationId);
  fs.mkdirSync(sessionDir, { recursive: true });
  fs.writeFileSync(path.join(sessionDir, 'snapshot.json'), defContent);
  const defDigest = 'sha256:' + crypto.createHash('sha256').update(defContent).digest('hex');

  // Pre-seed settled assignment asgn-critic-1
  const asgnDir = path.join(tempDir, '.fgos/assignments/asgn-critic-1');
  fs.mkdirSync(asgnDir, { recursive: true });
  fs.writeFileSync(
    path.join(asgnDir, 'assignment.json'),
    JSON.stringify({
      assignmentId: 'asgn-critic-1',
      role: 'critic',
      actorId: 'critic-1',
      operationId: 'op-critique',
      provenance: {
        kind: 'inline',
        contract: {
          objective: 'Critique',
          constraints: [protocolOperationStamp(def, 'op-critique')],
        },
      },
    }),
  );
  const runDir = path.join(asgnDir, 'runs', '01');
  fs.mkdirSync(runDir, { recursive: true });
  const reportPath = path.join(runDir, 'agent-report.md');
  const reportContent = '# Critique Report\nApproved with remarks.\n';
  fs.writeFileSync(reportPath, reportContent);
  const reportSha = crypto.createHash('sha256').update(reportContent).digest('hex');
  fs.writeFileSync(
    path.join(runDir, 'result.json'),
    JSON.stringify({
      assignmentId: 'asgn-critic-1',
      runId: 'run_asgn-critic-1_01',
      status: 'done',
      confidence: 'reported',
      outputRefs: [reportPath],
      settleReports: [{ path: reportPath, sha256: reportSha }],
    }),
  );

  const manifest = {
    schemaVersion: '3',
    coordinationId,
    status: 'active',
    objective: 'Test contribution concurrency',
    createdAt: new Date().toISOString(),
    provenanceRoot: { writerId: 'driver-1' },
    actors: [{ id: 'critic-1', role: 'critic' }],
    aggregateBounds: { wallTimeMs: 10000, maxAssignments: 10, maxConcurrency: 2, maxRounds: 5, maxTaskDepth: 2 },
    assignmentRefs: ['asgn-critic-1'],
    completedAt: null,
    definitionRef: { id: 'test.contrib-protocol', version: '1.0.0' },
    snapshotRef: { digest: defDigest.replace('sha256:', '') },
  };
  fs.writeFileSync(path.join(sessionDir, 'session.json'), JSON.stringify(manifest, null, 2));

  let eventsContent = '';
  eventsContent += JSON.stringify({
    type: 'assignment-created',
    payload: { assignmentId: 'asgn-critic-1', actorId: 'critic-1' },
  }) + '\n';
  eventsContent += JSON.stringify({
    type: 'result-linked',
    payload: { assignmentId: 'asgn-critic-1', runId: 'run_asgn-critic-1_01' },
  }) + '\n';
  fs.writeFileSync(path.join(sessionDir, 'events.jsonl'), eventsContent);

  return { tempDir, sessionDir, initialEventCount: 2 };
}

function setupDispositionEnv(coordinationId) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-disp-concurrency-'));
  const def = {
    apiVersion: 'fgos.dev/v1alpha1',
    kind: 'FlowDefinition',
    metadata: { id: 'test.disp-protocol', version: '1.0.0' },
    spec: {
      profile: { kind: 'CoordinationProtocol' },
      roles: ['auditor'],
      actors: [{ id: 'auditor-1', role: 'auditor' }],
      operations: [
        { id: 'op-audit', role: 'auditor' },
      ],
      graph: {
        entry: 'phase-1',
        nodes: [
          {
            id: 'phase-1',
            operations: [{ ref: 'op-audit', actor: 'auditor-1' }],
            transitions: [],
          },
        ],
      },
    },
  };
  const defContent = JSON.stringify(def, null, 2);
  const sessionDir = path.join(tempDir, '.fgos/coordination/sessions', coordinationId);
  fs.mkdirSync(sessionDir, { recursive: true });
  fs.writeFileSync(path.join(sessionDir, 'snapshot.json'), defContent);
  const defDigest = 'sha256:' + crypto.createHash('sha256').update(defContent).digest('hex');

  // Pre-seed FAILED assignment asgn-fail-1
  const asgnDir = path.join(tempDir, '.fgos/assignments/asgn-fail-1');
  fs.mkdirSync(asgnDir, { recursive: true });
  fs.writeFileSync(
    path.join(asgnDir, 'assignment.json'),
    JSON.stringify({
      assignmentId: 'asgn-fail-1',
      role: 'auditor',
      actorId: 'auditor-1',
      operationId: 'op-audit',
      provenance: {
        kind: 'inline',
        contract: {
          objective: 'Audit',
          constraints: [protocolOperationStamp(def, 'op-audit')],
        },
      },
    }),
  );
  const runDir = path.join(asgnDir, 'runs', '01');
  fs.mkdirSync(runDir, { recursive: true });
  fs.writeFileSync(
    path.join(runDir, 'result.json'),
    JSON.stringify({ assignmentId: 'asgn-fail-1', status: 'failed', confidence: 'reported' }),
  );

  const manifest = {
    schemaVersion: '3',
    coordinationId,
    status: 'active',
    objective: 'Test disposition concurrency',
    createdAt: new Date().toISOString(),
    provenanceRoot: { writerId: 'driver-1' },
    actors: [{ id: 'auditor-1', role: 'auditor' }],
    aggregateBounds: { wallTimeMs: 10000, maxAssignments: 10, maxConcurrency: 2, maxRounds: 5, maxTaskDepth: 2 },
    assignmentRefs: ['asgn-fail-1'],
    completedAt: null,
    definitionRef: { id: 'test.disp-protocol', version: '1.0.0' },
    snapshotRef: { digest: defDigest.replace('sha256:', '') },
  };
  fs.writeFileSync(path.join(sessionDir, 'session.json'), JSON.stringify(manifest, null, 2));

  let dispEventsContent = '';
  dispEventsContent += JSON.stringify({
    type: 'assignment-created',
    payload: { assignmentId: 'asgn-fail-1', actorId: 'auditor-1' },
  }) + '\n';
  dispEventsContent += JSON.stringify({
    type: 'result-linked',
    payload: { assignmentId: 'asgn-fail-1', runId: 'run_asgn-fail-1_01' },
  }) + '\n';
  fs.writeFileSync(path.join(sessionDir, 'events.jsonl'), dispEventsContent);

  return { tempDir, sessionDir, initialEventCount: 2 };
}

// ─── 7. Two-OS-process race on executeOperationUseCase (Family: operation) ────

test('Unit 2E: concurrent two-OS-process operation race with identical payload yields idempotent cached result and exactly one external dispatch', async () => {
  const coordinationId = 'coord_p2_op_race_1';
  const { tempDir, sessionDir } = setupOperationEnv(coordinationId);

  try {
    const ctx = { cwd: tempDir, repoRoot: tempDir };
    const actionsRes = showCoordinationActionsUseCase(ctx, { id: coordinationId });
    const opAction = actionsRes.actions.find((a) => a.kind === 'dispatch-operation');
    assert.ok(opAction, 'dispatch-operation must be projected');

    const makeWorker = (workerPath) => {
      fs.writeFileSync(
        workerPath,
        `
        import { executeOperationUseCase } from '${ACTIONS_MODULE_URL}';
        import { ensureRunnerConfigForDir } from '${DISPATCH_MODULE_URL}';
        try {
          const runnerConfig = ensureRunnerConfigForDir(${JSON.stringify(tempDir)});
          const res = await executeOperationUseCase(
            { cwd: ${JSON.stringify(tempDir)}, repoRoot: ${JSON.stringify(tempDir)}, runnerConfig },
            {
              id: '${coordinationId}',
              actionKey: '${opAction.actionKey}',
              writerId: 'driver-1',
              objective: 'Do the assigned work',
              expectedOutputs: ['agent-result.json'],
            }
          );
          if (res.idempotent) {
            process.stdout.write('OUTCOME:IDEMPOTENT\\n');
          } else {
            process.stdout.write('OUTCOME:INITIAL\\n');
          }
        } catch (err) {
          process.stdout.write('OUTCOME:REFUSED:' + (err.category || err.message) + '\\n');
        }
        `,
      );
    };

    const worker1 = path.join(tempDir, 'worker1_op.mjs');
    const worker2 = path.join(tempDir, 'worker2_op.mjs');
    makeWorker(worker1);
    makeWorker(worker2);

    const [res1, res2] = await Promise.all([runWorkerSubprocess(worker1), runWorkerSubprocess(worker2)]);
    const outcomes = [res1.out, res2.out].sort();

    assert.equal(outcomes[0], 'OUTCOME:IDEMPOTENT', 'Sibling process must receive cached idempotent result');
    assert.equal(outcomes[1], 'OUTCOME:INITIAL', 'One process must win the initial execution');

    // External dispatch must have occurred exactly once
    const invocationsLog = path.join(tempDir, 'executor-invocations.txt');
    assert.ok(fs.existsSync(invocationsLog), 'executor-invocations.txt must exist');
    const invocations = fs.readFileSync(invocationsLog, 'utf8').trim().split('\n').filter(Boolean);
    assert.equal(invocations.length, 1, 'External executor must be invoked exactly once');

    // Persisted events must contain exactly one assignment lifecycle pair
    const events = fs.readFileSync(path.join(sessionDir, 'events.jsonl'), 'utf8').trim().split('\n').map(JSON.parse);
    const asgnEvents = events.filter((e) => e.type === 'assignment-created');
    assert.equal(asgnEvents.length, 1, 'Exactly one assignment must be created in events.jsonl');
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('Unit 2E: concurrent two-OS-process operation race with conflicting payload rejects sibling', async () => {
  const coordinationId = 'coord_p2_op_race_conflict';
  const { tempDir } = setupOperationEnv(coordinationId);

  try {
    const ctx = { cwd: tempDir, repoRoot: tempDir };
    const actionsRes = showCoordinationActionsUseCase(ctx, { id: coordinationId });
    const opAction = actionsRes.actions.find((a) => a.kind === 'dispatch-operation');
    assert.ok(opAction, 'dispatch-operation must be projected');

    const makeWorker = (workerPath, objective) => {
      fs.writeFileSync(
        workerPath,
        `
        import { executeOperationUseCase } from '${ACTIONS_MODULE_URL}';
        import { ensureRunnerConfigForDir } from '${DISPATCH_MODULE_URL}';
        try {
          const runnerConfig = ensureRunnerConfigForDir(${JSON.stringify(tempDir)});
          const res = await executeOperationUseCase(
            { cwd: ${JSON.stringify(tempDir)}, repoRoot: ${JSON.stringify(tempDir)}, runnerConfig },
            {
              id: '${coordinationId}',
              actionKey: '${opAction.actionKey}',
              writerId: 'driver-1',
              objective: ${JSON.stringify(objective)},
              expectedOutputs: ['agent-result.json'],
            }
          );
          if (res.idempotent) {
            process.stdout.write('OUTCOME:IDEMPOTENT\\n');
          } else {
            process.stdout.write('OUTCOME:INITIAL\\n');
          }
        } catch (err) {
          process.stdout.write('OUTCOME:REFUSED:' + (err.category || err.message) + '\\n');
        }
        `,
      );
    };

    const worker1 = path.join(tempDir, 'worker1_op_conf.mjs');
    const worker2 = path.join(tempDir, 'worker2_op_conf.mjs');
    makeWorker(worker1, 'Objective Alpha');
    makeWorker(worker2, 'Conflicting Objective Beta');

    const [res1, res2] = await Promise.all([runWorkerSubprocess(worker1), runWorkerSubprocess(worker2)]);
    const outcomes = [res1.out, res2.out].sort();

    assert.equal(outcomes[0], 'OUTCOME:INITIAL', 'One process must win the initial execution');
    assert.match(outcomes[1], /OUTCOME:REFUSED/, 'Conflicting process must be refused');
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

// ─── 8. Two-OS-process race on executeAuthorizeAndDispatchUseCase (Family: authorize) ─

test('Unit 2E: concurrent two-OS-process authorize-and-dispatch race with identical payload yields deterministic identity and single dispatch', async () => {
  const coordinationId = 'coord_p2_auth_race_1';
  const { tempDir, sessionDir } = setupAuthorizeEnv(coordinationId);

  try {
    const ctx = { cwd: tempDir, repoRoot: tempDir };
    const actionsRes = showCoordinationActionsUseCase(ctx, { id: coordinationId });
    const authAction = actionsRes.actions.find((a) => a.kind === 'authorize-and-dispatch');
    assert.ok(authAction, 'authorize-and-dispatch must be projected');

    const makeWorker = (workerPath) => {
      fs.writeFileSync(
        workerPath,
        `
        import { executeAuthorizeAndDispatchUseCase } from '${ACTIONS_MODULE_URL}';
        import { ensureRunnerConfigForDir } from '${DISPATCH_MODULE_URL}';
        try {
          const runnerConfig = ensureRunnerConfigForDir(${JSON.stringify(tempDir)});
          const res = await executeAuthorizeAndDispatchUseCase(
            { cwd: ${JSON.stringify(tempDir)}, repoRoot: ${JSON.stringify(tempDir)}, runnerConfig },
            {
              id: '${coordinationId}',
              actionKey: '${authAction.actionKey}',
              writerId: 'driver-1',
              objective: 'Perform specialist consultation',
              reason: 'Need expert security advice',
              expectedOutputs: ['agent-result.json'],
            }
          );
          const prefix = res.idempotent ? 'OUTCOME:IDEMPOTENT' : 'OUTCOME:INITIAL';
          process.stdout.write(prefix + ':' + res.authorizationId + '\\n');
        } catch (err) {
          process.stdout.write('OUTCOME:REFUSED:' + (err.category || err.message) + '\\n');
        }
        `,
      );
    };

    const worker1 = path.join(tempDir, 'worker1_auth.mjs');
    const worker2 = path.join(tempDir, 'worker2_auth.mjs');
    makeWorker(worker1);
    makeWorker(worker2);

    const [res1, res2] = await Promise.all([runWorkerSubprocess(worker1), runWorkerSubprocess(worker2)]);
    const outcomes = [res1.out, res2.out].sort();

    assert.ok(outcomes[0].startsWith('OUTCOME:IDEMPOTENT:auth_'), 'Sibling must get cached idempotent outcome');
    assert.ok(outcomes[1].startsWith('OUTCOME:INITIAL:auth_'), 'One process must win initial execution');

    const authId1 = outcomes[0].split(':')[2];
    const authId2 = outcomes[1].split(':')[2];
    assert.equal(authId1, authId2, 'Both processes must agree on exact deterministic authorizationId');

    const invocationsLog = path.join(tempDir, 'executor-invocations.txt');
    const invocations = fs.readFileSync(invocationsLog, 'utf8').trim().split('\n').filter(Boolean);
    assert.equal(invocations.length, 1, 'External executor must be invoked exactly once');

    const events = fs.readFileSync(path.join(sessionDir, 'events.jsonl'), 'utf8').trim().split('\n').map(JSON.parse);
    const authEvents = events.filter((e) => e.type === 'operation-authorized');
    assert.equal(authEvents.length, 1, 'Exactly one operation-authorized event must be recorded');
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('Unit 2E: concurrent two-OS-process authorize-and-dispatch race with conflicting payload rejects sibling', async () => {
  const coordinationId = 'coord_p2_auth_race_conflict';
  const { tempDir } = setupAuthorizeEnv(coordinationId);

  try {
    const ctx = { cwd: tempDir, repoRoot: tempDir };
    const actionsRes = showCoordinationActionsUseCase(ctx, { id: coordinationId });
    const authAction = actionsRes.actions.find((a) => a.kind === 'authorize-and-dispatch');
    assert.ok(authAction, 'authorize-and-dispatch must be projected');

    const makeWorker = (workerPath, reason) => {
      fs.writeFileSync(
        workerPath,
        `
        import { executeAuthorizeAndDispatchUseCase } from '${ACTIONS_MODULE_URL}';
        import { ensureRunnerConfigForDir } from '${DISPATCH_MODULE_URL}';
        try {
          const runnerConfig = ensureRunnerConfigForDir(${JSON.stringify(tempDir)});
          const res = await executeAuthorizeAndDispatchUseCase(
            { cwd: ${JSON.stringify(tempDir)}, repoRoot: ${JSON.stringify(tempDir)}, runnerConfig },
            {
              id: '${coordinationId}',
              actionKey: '${authAction.actionKey}',
              writerId: 'driver-1',
              objective: 'Perform specialist consultation',
              reason: ${JSON.stringify(reason)},
              expectedOutputs: ['agent-result.json'],
            }
          );
          if (res.idempotent) {
            process.stdout.write('OUTCOME:IDEMPOTENT\\n');
          } else {
            process.stdout.write('OUTCOME:INITIAL\\n');
          }
        } catch (err) {
          process.stdout.write('OUTCOME:REFUSED:' + (err.category || err.message) + '\\n');
        }
        `,
      );
    };

    const worker1 = path.join(tempDir, 'worker1_auth_conf.mjs');
    const worker2 = path.join(tempDir, 'worker2_auth_conf.mjs');
    makeWorker(worker1, 'Reason Alpha');
    makeWorker(worker2, 'Conflicting Reason Beta');

    const [res1, res2] = await Promise.all([runWorkerSubprocess(worker1), runWorkerSubprocess(worker2)]);
    const outcomes = [res1.out, res2.out].sort();

    assert.equal(outcomes[0], 'OUTCOME:INITIAL', 'One process must win initial execution');
    assert.match(outcomes[1], /OUTCOME:REFUSED/, 'Conflicting process must be refused');
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

// ─── 9. Two-OS-process race on executeFanOutUseCase (Family: fan-out) ──────────

test('Unit 2E: concurrent two-OS-process fan-out race with identical payload yields idempotent result and single cohort dispatch', async () => {
  const coordinationId = 'coord_p2_fanout_race_1';
  const { tempDir, sessionDir } = setupFanOutEnv(coordinationId);

  try {
    const ctx = { cwd: tempDir, repoRoot: tempDir };
    const actionsRes = showCoordinationActionsUseCase(ctx, { id: coordinationId });
    const fanAction = actionsRes.actions.find((a) => a.kind === 'fan-out');
    assert.ok(fanAction, 'fan-out must be projected');

    const branches = [
      { actorId: 'researcher-1', objective: 'Investigate branch 1', expectedOutputs: ['agent-result.json'] },
      { actorId: 'researcher-2', objective: 'Investigate branch 2', expectedOutputs: ['agent-result.json'] },
    ];

    const makeWorker = (workerPath) => {
      fs.writeFileSync(
        workerPath,
        `
        import { executeFanOutUseCase } from '${ACTIONS_MODULE_URL}';
        import { ensureRunnerConfigForDir } from '${DISPATCH_MODULE_URL}';
        try {
          const runnerConfig = ensureRunnerConfigForDir(${JSON.stringify(tempDir)});
          const res = await executeFanOutUseCase(
            { cwd: ${JSON.stringify(tempDir)}, repoRoot: ${JSON.stringify(tempDir)}, runnerConfig },
            {
              id: '${coordinationId}',
              actionKey: '${fanAction.actionKey}',
              writerId: 'driver-1',
              branches: ${JSON.stringify(branches)},
            }
          );
          if (res.idempotent) {
            process.stdout.write('OUTCOME:IDEMPOTENT\\n');
          } else {
            process.stdout.write('OUTCOME:INITIAL\\n');
          }
        } catch (err) {
          process.stdout.write('OUTCOME:REFUSED:' + (err.category || err.message) + '\\n');
        }
        `,
      );
    };

    const worker1 = path.join(tempDir, 'worker1_fan.mjs');
    const worker2 = path.join(tempDir, 'worker2_fan.mjs');
    makeWorker(worker1);
    makeWorker(worker2);

    const [res1, res2] = await Promise.all([runWorkerSubprocess(worker1), runWorkerSubprocess(worker2)]);
    const outcomes = [res1.out, res2.out].sort();

    assert.equal(outcomes[0], 'OUTCOME:IDEMPOTENT', 'Sibling must receive idempotent outcome');
    assert.equal(outcomes[1], 'OUTCOME:INITIAL', 'One process must win initial execution');

    // Exactly 2 assignments created for the 2 branch actors (no duplicate dispatches)
    const asgnsDir = path.join(tempDir, '.fgos', 'assignments');
    const asgns = fs.existsSync(asgnsDir) ? fs.readdirSync(asgnsDir) : [];
    assert.equal(asgns.length, 2, 'Exactly 2 assignments must be created for fan-out cohort');
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('Unit 2E: concurrent two-OS-process fan-out race with conflicting payload rejects sibling', async () => {
  const coordinationId = 'coord_p2_fanout_race_conflict';
  const { tempDir } = setupFanOutEnv(coordinationId);

  try {
    const ctx = { cwd: tempDir, repoRoot: tempDir };
    const actionsRes = showCoordinationActionsUseCase(ctx, { id: coordinationId });
    const fanAction = actionsRes.actions.find((a) => a.kind === 'fan-out');
    assert.ok(fanAction, 'fan-out must be projected');

    const branches1 = [
      { actorId: 'researcher-1', objective: 'Branch A', expectedOutputs: ['agent-result.json'] },
      { actorId: 'researcher-2', objective: 'Branch B', expectedOutputs: ['agent-result.json'] },
    ];
    const branches2 = [
      { actorId: 'researcher-1', objective: 'Conflicting Branch A2', expectedOutputs: ['agent-result.json'] },
      { actorId: 'researcher-2', objective: 'Conflicting Branch B2', expectedOutputs: ['agent-result.json'] },
    ];

    const makeWorker = (workerPath, branchList) => {
      fs.writeFileSync(
        workerPath,
        `
        import { executeFanOutUseCase } from '${ACTIONS_MODULE_URL}';
        import { ensureRunnerConfigForDir } from '${DISPATCH_MODULE_URL}';
        try {
          const runnerConfig = ensureRunnerConfigForDir(${JSON.stringify(tempDir)});
          const res = await executeFanOutUseCase(
            { cwd: ${JSON.stringify(tempDir)}, repoRoot: ${JSON.stringify(tempDir)}, runnerConfig },
            {
              id: '${coordinationId}',
              actionKey: '${fanAction.actionKey}',
              writerId: 'driver-1',
              branches: ${JSON.stringify(branchList)},
            }
          );
          if (res.idempotent) {
            process.stdout.write('OUTCOME:IDEMPOTENT\\n');
          } else {
            process.stdout.write('OUTCOME:INITIAL\\n');
          }
        } catch (err) {
          process.stdout.write('OUTCOME:REFUSED:' + (err.category || err.message) + '\\n');
        }
        `,
      );
    };

    const worker1 = path.join(tempDir, 'worker1_fan_conf.mjs');
    const worker2 = path.join(tempDir, 'worker2_fan_conf.mjs');
    makeWorker(worker1, branches1);
    makeWorker(worker2, branches2);

    const [res1, res2] = await Promise.all([runWorkerSubprocess(worker1), runWorkerSubprocess(worker2)]);
    const outcomes = [res1.out, res2.out].sort();

    assert.equal(outcomes[0], 'OUTCOME:INITIAL', 'One process must win initial execution');
    assert.match(outcomes[1], /OUTCOME:REFUSED/, 'Conflicting process must be refused');
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

// ─── 10. Two-OS-process race on executeContributionUseCase (Family: contribution) ──

test('Unit 2E: concurrent two-OS-process contribution race with identical payload yields idempotent cached result and single event', async () => {
  const coordinationId = 'coord_p2_contrib_race_1';
  const { tempDir, sessionDir, initialEventCount } = setupContributionEnv(coordinationId);

  try {
    const ctx = { cwd: tempDir, repoRoot: tempDir };
    const actionsRes = showCoordinationActionsUseCase(ctx, { id: coordinationId });
    const contribAction = actionsRes.actions.find((a) => a.kind === 'link-contribution');
    assert.ok(contribAction, 'link-contribution must be projected');

    const makeWorker = (workerPath) => {
      fs.writeFileSync(
        workerPath,
        `
        import { executeContributionUseCase } from '${ACTIONS_MODULE_URL}';
        try {
          const res = await executeContributionUseCase(
            { cwd: ${JSON.stringify(tempDir)}, repoRoot: ${JSON.stringify(tempDir)} },
            {
              id: '${coordinationId}',
              actionKey: '${contribAction.actionKey}',
              writerId: 'driver-1',
              contributionType: 'proposal',
              roundKey: 'round-1',
            }
          );
          if (res.idempotent) {
            process.stdout.write('OUTCOME:IDEMPOTENT\\n');
          } else {
            process.stdout.write('OUTCOME:INITIAL\\n');
          }
        } catch (err) {
          process.stdout.write('OUTCOME:REFUSED:' + (err.category || err.message) + '\\n');
        }
        `,
      );
    };

    const worker1 = path.join(tempDir, 'worker1_contrib.mjs');
    const worker2 = path.join(tempDir, 'worker2_contrib.mjs');
    makeWorker(worker1);
    makeWorker(worker2);

    const [res1, res2] = await Promise.all([runWorkerSubprocess(worker1), runWorkerSubprocess(worker2)]);
    const outcomes = [res1.out, res2.out].sort();

    assert.equal(outcomes[0], 'OUTCOME:IDEMPOTENT', 'Sibling process must get idempotent outcome');
    assert.equal(outcomes[1], 'OUTCOME:INITIAL', 'One process must win initial execution');

    const events = fs.readFileSync(path.join(sessionDir, 'events.jsonl'), 'utf8').trim().split('\n').map(JSON.parse);
    assert.equal(events.length, initialEventCount + 1, 'Exactly one contribution-linked event must be appended');
    assert.equal(events[events.length - 1].type, 'deliberation-contribution-linked');
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('Unit 2E: concurrent two-OS-process contribution race with conflicting payload rejects sibling', async () => {
  const coordinationId = 'coord_p2_contrib_race_conflict';
  const { tempDir } = setupContributionEnv(coordinationId);

  try {
    const ctx = { cwd: tempDir, repoRoot: tempDir };
    const actionsRes = showCoordinationActionsUseCase(ctx, { id: coordinationId });
    const contribAction = actionsRes.actions.find((a) => a.kind === 'link-contribution');
    assert.ok(contribAction, 'link-contribution must be projected');

    const makeWorker = (workerPath, roundKey) => {
      fs.writeFileSync(
        workerPath,
        `
        import { executeContributionUseCase } from '${ACTIONS_MODULE_URL}';
        try {
          const res = await executeContributionUseCase(
            { cwd: ${JSON.stringify(tempDir)}, repoRoot: ${JSON.stringify(tempDir)} },
            {
              id: '${coordinationId}',
              actionKey: '${contribAction.actionKey}',
              writerId: 'driver-1',
              contributionType: 'proposal',
              roundKey: ${JSON.stringify(roundKey)},
            }
          );
          if (res.idempotent) {
            process.stdout.write('OUTCOME:IDEMPOTENT\\n');
          } else {
            process.stdout.write('OUTCOME:INITIAL\\n');
          }
        } catch (err) {
          process.stdout.write('OUTCOME:REFUSED:' + (err.category || err.message) + '\\n');
        }
        `,
      );
    };

    const worker1 = path.join(tempDir, 'worker1_contrib_conf.mjs');
    const worker2 = path.join(tempDir, 'worker2_contrib_conf.mjs');
    makeWorker(worker1, 'round-1');
    makeWorker(worker2, 'conflicting-round-2');

    const [res1, res2] = await Promise.all([runWorkerSubprocess(worker1), runWorkerSubprocess(worker2)]);
    const outcomes = [res1.out, res2.out].sort();

    assert.equal(outcomes[0], 'OUTCOME:INITIAL', 'One process must win initial execution');
    assert.match(outcomes[1], /OUTCOME:REFUSED/, 'Conflicting process must be refused');
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

// ─── 11. Two-OS-process race on executeDispositionUseCase (Family: disposition) ──

test('Unit 2E: concurrent two-OS-process disposition race with identical payload yields idempotent cached result and single event', async () => {
  const coordinationId = 'coord_p2_disp_race_1';
  const { tempDir, sessionDir, initialEventCount } = setupDispositionEnv(coordinationId);

  try {
    const ctx = { cwd: tempDir, repoRoot: tempDir };
    const actionsRes = showCoordinationActionsUseCase(ctx, { id: coordinationId });
    const dispAction = actionsRes.actions.find((a) => a.kind === 'record-disposition');
    assert.ok(dispAction, 'record-disposition must be projected');

    const makeWorker = (workerPath) => {
      fs.writeFileSync(
        workerPath,
        `
        import { executeDispositionUseCase } from '${ACTIONS_MODULE_URL}';
        try {
          const res = await executeDispositionUseCase(
            { cwd: ${JSON.stringify(tempDir)}, repoRoot: ${JSON.stringify(tempDir)} },
            {
              id: '${coordinationId}',
              actionKey: '${dispAction.actionKey}',
              writerId: 'driver-1',
              disposition: 'accepted',
              rationale: 'Accept failed audit run with known risks',
            }
          );
          if (res.idempotent) {
            process.stdout.write('OUTCOME:IDEMPOTENT\\n');
          } else {
            process.stdout.write('OUTCOME:INITIAL\\n');
          }
        } catch (err) {
          process.stdout.write('OUTCOME:REFUSED:' + (err.category || err.message) + '\\n');
        }
        `,
      );
    };

    const worker1 = path.join(tempDir, 'worker1_disp.mjs');
    const worker2 = path.join(tempDir, 'worker2_disp.mjs');
    makeWorker(worker1);
    makeWorker(worker2);

    const [res1, res2] = await Promise.all([runWorkerSubprocess(worker1), runWorkerSubprocess(worker2)]);
    const outcomes = [res1.out, res2.out].sort();

    assert.equal(outcomes[0], 'OUTCOME:IDEMPOTENT', 'Sibling process must get idempotent outcome');
    assert.equal(outcomes[1], 'OUTCOME:INITIAL', 'One process must win initial execution');

    const events = fs.readFileSync(path.join(sessionDir, 'events.jsonl'), 'utf8').trim().split('\n').map(JSON.parse);
    assert.equal(events.length, initialEventCount + 1, 'Exactly one disposition-recorded event must be appended');
    assert.equal(events[events.length - 1].type, 'driver-disposition-recorded');
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('Unit 2E: concurrent two-OS-process disposition race with conflicting payload rejects sibling', async () => {
  const coordinationId = 'coord_p2_disp_race_conflict';
  const { tempDir } = setupDispositionEnv(coordinationId);

  try {
    const ctx = { cwd: tempDir, repoRoot: tempDir };
    const actionsRes = showCoordinationActionsUseCase(ctx, { id: coordinationId });
    const dispAction = actionsRes.actions.find((a) => a.kind === 'record-disposition');
    assert.ok(dispAction, 'record-disposition must be projected');

    const makeWorker = (workerPath, disposition) => {
      fs.writeFileSync(
        workerPath,
        `
        import { executeDispositionUseCase } from '${ACTIONS_MODULE_URL}';
        try {
          const res = await executeDispositionUseCase(
            { cwd: ${JSON.stringify(tempDir)}, repoRoot: ${JSON.stringify(tempDir)} },
            {
              id: '${coordinationId}',
              actionKey: '${dispAction.actionKey}',
              writerId: 'driver-1',
              disposition: '${disposition}',
              rationale: 'Rationale for disposition',
            }
          );
          if (res.idempotent) {
            process.stdout.write('OUTCOME:IDEMPOTENT\\n');
          } else {
            process.stdout.write('OUTCOME:INITIAL\\n');
          }
        } catch (err) {
          process.stdout.write('OUTCOME:REFUSED:' + (err.category || err.message) + '\\n');
        }
        `,
      );
    };

    const worker1 = path.join(tempDir, 'worker1_disp_conf.mjs');
    const worker2 = path.join(tempDir, 'worker2_disp_conf.mjs');
    makeWorker(worker1, 'accepted');
    makeWorker(worker2, 'rejected');

    const [res1, res2] = await Promise.all([runWorkerSubprocess(worker1), runWorkerSubprocess(worker2)]);
    const outcomes = [res1.out, res2.out].sort();

    assert.equal(outcomes[0], 'OUTCOME:INITIAL', 'One process must win initial execution');
    assert.match(outcomes[1], /OUTCOME:REFUSED/, 'Conflicting process must be refused');
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});
