import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import {
  assertActionPrecondition,
  executeUnderActionPrecondition,
} from '../../src/runner/coordination/action-precondition.mjs';
import {
  computeActionKey,
  computeSnapshotDigest,
  ACTIONS_CONTRACT_VERSION,
  projectCoordinationActions,
} from '../../src/runner/coordination/actions-projector.mjs';
import { appendEvent, appendEventLocked } from '../../src/state/events.mjs';
import { closeCoordinationUseCase } from '../../src/verbs/coordination/close.mjs';
import {
  recordDriverDisposition,
  recordHumanTurn,
  recordHumanTurnLocked,
} from '../../src/runner/coordination/store.mjs';
import {
  linkSessionContribution,
  dispatchResearchFanOut,
} from '../../src/runner/coordination/session-engine.mjs';
import {
  executeCoordinationActionUseCase,
  showCoordinationActionsUseCase,
} from '../../src/verbs/coordination/actions.mjs';
import { protocolOperationStamp } from '../../src/runner/coordination/legality-facts.mjs';

function setupSessionFixture(coordinationId, { schemaVersion = '3', eventCount = 0, withDefinition = true, completed = false } = {}) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-stale-proof-'));
  const sessionDir = path.join(tempDir, '.fgos/coordination/sessions', coordinationId);
  fs.mkdirSync(sessionDir, { recursive: true });

  let def = null;
  let defDigest = null;
  if (withDefinition) {
    def = {
      apiVersion: 'fgos.dev/v1alpha1',
      kind: 'FlowDefinition',
      metadata: { id: 'test-protocol', version: '1.0.0' },
      spec: {
        profile: { kind: 'CoordinationProtocol' },
        roles: ['worker-1'],
        actors: [{ id: 'worker-1', role: 'worker-1' }],
        operations: [
          { id: 'op-1', role: 'worker-1', task: { contractTemplate: 't' } },
        ],
        graph: {
          entry: 'step-1',
          nodes: [
            {
              id: 'step-1',
              operations: [{ ref: 'op-1', actor: 'worker-1' }],
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
      role: 'worker-1',
      provenance: {
        kind: 'inline',
        contract: {
          objective: 'stub',
          constraints: def ? [protocolOperationStamp(def, 'op-1')] : [],
        },
      },
    }),
  );

  const manifest = {
    schemaVersion,
    coordinationId,
    status: 'active',
    objective: 'Test stale action binding',
    createdAt: new Date().toISOString(),
    provenanceRoot: { writerId: 'driver-1' },
    actors: [{ id: 'worker-1', role: 'worker-1' }],
    aggregateBounds: { wallTimeMs: 10000, maxAssignments: 10, maxConcurrency: 2, maxRounds: 5, maxTaskDepth: 2 },
    assignmentRefs: completed ? ['asgn-1'] : [],
    completedAt: null,
    ...(withDefinition ? {
      definitionRef: { id: 'test-protocol', version: '1.0.0' },
      ...(schemaVersion === '3' ? { snapshotRef: { digest: defDigest.replace('sha256:', '') } } : {}),
    } : {}),
  };
  fs.writeFileSync(path.join(sessionDir, 'session.json'), JSON.stringify(manifest));

  const eventsPath = path.join(sessionDir, 'events.jsonl');
  let eventsContent = '';
  if (completed) {
    eventsContent += JSON.stringify({
      type: 'assignment-created',
      payload: { assignmentId: 'asgn-1', actorId: 'worker-1' },
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
      })
    );
  }
  for (let i = 0; i < eventCount; i++) {
    eventsContent += JSON.stringify({
      type: 'actor-bound',
      payload: { actorId: `worker-${i}`, role: 'worker-1' },
    }) + '\n';
  }
  fs.writeFileSync(eventsPath, eventsContent);

  return { tempDir, sessionDir, eventsPath, manifest, def, defDigest };
}

function makeCohortRunnerConfig(tempDir, { summary = 'Research findings collected.' } = {}) {
  const executorScript = path.join(tempDir, `fake-cohort-executor-${Math.random().toString(36).slice(2)}.mjs`);
  fs.writeFileSync(
    executorScript,
    `
    import fs from 'node:fs';
    import path from 'node:path';
    function settle() {
      const cwd = process.cwd();
      const assignmentsRoot = path.join(cwd, '.fgos', 'assignments');
      if (fs.existsSync(assignmentsRoot)) {
        for (const asgn of fs.readdirSync(assignmentsRoot)) {
          const runsDir = path.join(assignmentsRoot, asgn, 'runs');
          if (!fs.existsSync(runsDir)) continue;
          for (const run of fs.readdirSync(runsDir)) {
            const runDir = path.join(runsDir, run);
            if (fs.existsSync(runDir) && !fs.existsSync(path.join(runDir, 'agent-result.json'))) {
              fs.writeFileSync(path.join(runDir, 'agent-report.md'), '# Report\\n${summary}\\n');
              fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ status: 'done', summary: '${summary}' }));
            }
          }
        }
      }
      process.stdout.write('${summary}\\n');
      process.exit(0);
    }
    settle();
    `,
  );

  return {
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
    modelPolicies: {
      claude: { nano: 'test-model', standard: 'test-model' },
      'family-a': { nano: 'test-model', standard: 'test-model' },
      'family-b': { nano: 'test-model', standard: 'test-model' },
    },
    timeoutMs: 5000,
  };
}


test('stable-key repeat: identical state yields identical actionKey repeatedly', () => {
  const params = {
    contractVersion: ACTIONS_CONTRACT_VERSION,
    coordinationId: 'coord_repeat',
    schemaVersion: '3',
    eventSeq: 2,
    definitionDigest: 'sha256:1111',
    kind: 'dispatch-operation',
    target: { nodeId: 'step-1', operationId: 'op-1', actorId: 'worker-1' },
    requiredInputs: ['objective'],
    optionalInputs: ['contextRefs'],
  };

  const key1 = computeActionKey(params);
  const key2 = computeActionKey(params);
  assert.equal(key1, key2);
  assert.ok(key1.startsWith('sha256:'));
});

test('appended-event stale key: appending an event makes previous actionKey stale and refuses execution', () => {
  const coordinationId = 'coord_appended_stale';
  const { tempDir, eventsPath, manifest, def } = setupSessionFixture(coordinationId, { eventCount: 0 });

  try {
    const proj = projectCoordinationActions({ manifest, events: [], definition: def });
    const action = proj.actions.find((a) => a.kind === 'dispatch-operation');
    assert.ok(action, 'dispatch-operation must be projected');

    const precondition = {
      actionKey: action.actionKey,
      kind: action.kind,
      target: action.target,
      requiredInputs: action.requiredInputs,
      writerId: 'driver-1',
      inputPayload: { objective: 'Run task', expectedOutputs: ['out.json'] },
    };

    // Before append: execution succeeds
    let executedBefore = false;
    executeUnderActionPrecondition(
      coordinationId,
      precondition,
      () => {
        executedBefore = true;
      },
      { cwd: tempDir, repoRoot: tempDir },
    );
    assert.equal(executedBefore, true);

    // Append an event to advance eventSeq
    appendEvent(eventsPath, { type: 'actor-bound', payload: { actorId: 'worker-new', role: 'worker-1' } });

    // After append: same precondition must fail with stale-action-key
    let executedAfter = false;
    assert.throws(
      () => {
        executeUnderActionPrecondition(
          coordinationId,
          precondition,
          () => {
            executedAfter = true;
          },
          { cwd: tempDir, repoRoot: tempDir },
        );
      },
      (err) => err.category === 'stale-action-key',
    );
    assert.equal(executedAfter, false, 'mutation callback must not execute when precondition is stale');
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('concurrent two-writer race: exactly one writer succeeds, second is refused as stale under lock', () => {
  const coordinationId = 'coord_concurrent_writers';
  const { tempDir, manifest, def } = setupSessionFixture(coordinationId, { eventCount: 0 });

  try {
    const proj = projectCoordinationActions({ manifest, events: [], definition: def });
    const action = proj.actions.find((a) => a.kind === 'dispatch-operation');

    const precondition = {
      actionKey: action.actionKey,
      kind: action.kind,
      target: action.target,
      requiredInputs: action.requiredInputs,
      writerId: 'driver-1',
      inputPayload: { objective: 'Run task', expectedOutputs: ['out.json'] },
    };

    // Writer 1 executes and mutates session log inside the lock
    let writer1Executed = false;
    executeUnderActionPrecondition(
      coordinationId,
      precondition,
      (paths) => {
        writer1Executed = true;
        appendEventLocked(paths.eventsPath, { type: 'actor-bound', payload: { actorId: 'worker-w1', role: 'worker-1' } });
      },
      { cwd: tempDir, repoRoot: tempDir },
    );
    assert.equal(writer1Executed, true, 'Writer 1 must succeed');

    // Writer 2 attempts execution with the same pre-race actionKey
    let writer2Executed = false;
    assert.throws(
      () => {
        executeUnderActionPrecondition(
          coordinationId,
          precondition,
          () => {
            writer2Executed = true;
          },
          { cwd: tempDir, repoRoot: tempDir },
        );
      },
      (err) => err.category === 'stale-action-key',
      'Writer 2 must be rejected under lock with stale-action-key',
    );
    assert.equal(writer2Executed, false, 'Writer 2 mutation must never run');
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});


test('wrong target or action kind is refused', () => {
  const coordinationId = 'coord_mismatched_target';
  const { tempDir, manifest, def } = setupSessionFixture(coordinationId, { eventCount: 0 });

  try {
    const proj = projectCoordinationActions({ manifest, events: [], definition: def });
    const action = proj.actions.find((a) => a.kind === 'dispatch-operation');
    assert.ok(action, 'dispatch-operation must be projected');

    const wrongTarget = { nodeId: 'step-1', operationId: 'op-DIFFERENT' };

    // Target mismatch
    assert.throws(
      () => {
        executeUnderActionPrecondition(
          coordinationId,
          { ...action, target: wrongTarget, writerId: 'driver-1', inputPayload: { objective: 'Test' } },
          () => {},
          { cwd: tempDir, repoRoot: tempDir },
        );
      },
      (err) => err.category === 'stale-action-key',
    );

    // Kind mismatch
    assert.throws(
      () => {
        executeUnderActionPrecondition(
          coordinationId,
          { ...action, kind: 'close', authorizedBy: { type: 'driver', id: 'driver-1' }, inputPayload: { objective: 'Test' } },
          () => {},
          { cwd: tempDir, repoRoot: tempDir },
        );
      },
      (err) => err.category === 'stale-action-key',
    );
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('changed definition snapshot or digest refuses action', () => {
  const coordinationId = 'coord_def_digest';
  const { tempDir, sessionDir, manifest, def } = setupSessionFixture(coordinationId, { eventCount: 0 });

  try {
    const proj = projectCoordinationActions({ manifest, events: [], definition: def });
    const action = proj.actions.find((a) => a.kind === 'dispatch-operation');
    assert.ok(action, 'dispatch-operation must be projected');

    // Mutate definition in snapshot and session.json with valid additional role/actor to update digest
    const updatedDef = {
      ...def,
      spec: {
        ...def.spec,
        roles: ['worker-1', 'worker-2'],
        actors: [{ id: 'worker-1', role: 'worker-1' }, { id: 'worker-2', role: 'worker-2' }],
      },
    };
    const updatedContent = JSON.stringify(updatedDef);
    const updatedDigestHex = crypto.createHash('sha256').update(updatedContent).digest('hex');
    fs.writeFileSync(path.join(sessionDir, 'snapshot.json'), updatedContent);
    const updatedManifest = {
      ...manifest,
      snapshotRef: { digest: updatedDigestHex },
    };
    fs.writeFileSync(path.join(sessionDir, 'session.json'), JSON.stringify(updatedManifest));

    // The old actionKey was bound to the original definition digest. With the updated digest, the recomputed actionKey differs.
    assert.throws(
      () => {
        executeUnderActionPrecondition(
          coordinationId,
          { ...action, writerId: 'driver-1', inputPayload: { objective: 'Test' } },
          () => {},
          { cwd: tempDir, repoRoot: tempDir },
        );
      },
      (err) => err.category === 'stale-action-key',
    );
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('no mutation before stale refusal and lock ordering proof', () => {
  const coordinationId = 'coord_lock_order_proof';
  const { tempDir, eventsPath } = setupSessionFixture(coordinationId, { eventCount: 0 });

  try {
    let sideEffectOccurred = false;
    const initialEventsLength = fs.readFileSync(eventsPath, 'utf8').length;

    // Provide an intentionally stale actionKey
    assert.throws(
      () => {
        executeUnderActionPrecondition(
          coordinationId,
          { actionKey: 'sha256:intentionally_stale_key', kind: 'dispatch-operation', target: {}, writerId: 'driver-1', inputPayload: { objective: 'Test' } },
          (paths) => {
            sideEffectOccurred = true;
            appendEventLocked(paths.eventsPath, { type: 'corrupting-event' });
          },
          { cwd: tempDir, repoRoot: tempDir },
        );
      },
      (err) => err.category === 'stale-action-key',
    );

    assert.equal(sideEffectOccurred, false);
    assert.equal(fs.readFileSync(eventsPath, 'utf8').length, initialEventsLength, 'file size must remain unchanged');
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('same key/same normalized input idempotency vs different input conflict', () => {
  const coordinationId = 'coord_idempotency_test';
  const { tempDir, manifest, def } = setupSessionFixture(coordinationId, { eventCount: 0 });

  try {
    const proj = projectCoordinationActions({ manifest, events: [], definition: def });
    const action = proj.actions.find((a) => a.kind === 'dispatch-operation');
    assert.ok(action, 'dispatch-operation must be projected');

    let mutationRunCount = 0;
    const mutationFn = (paths) => {
      mutationRunCount++;
      appendEventLocked(paths.eventsPath, {
        type: 'assignment-created',
        payload: { assignmentId: 'asgn-1', actorId: 'worker-1' },
      });
      const asgnDir = path.join(paths.fgosDir, 'assignments/asgn-1');
      fs.mkdirSync(asgnDir, { recursive: true });
      fs.writeFileSync(
        path.join(asgnDir, 'assignment.json'),
        JSON.stringify({
          assignmentId: 'asgn-1',
          role: 'worker-1',
          provenance: {
            kind: 'inline',
            contract: {
              objective: 'Execute task 1',
              expectedOutputs: ['res.json'],
              constraints: [protocolOperationStamp(def, 'op-1')],
            },
          },
        }),
      );
      const manifest = JSON.parse(fs.readFileSync(paths.manifestPath, 'utf8'));
      manifest.assignmentRefs = [...(manifest.assignmentRefs ?? []), 'asgn-1'];
      fs.writeFileSync(paths.manifestPath, JSON.stringify(manifest, null, 2));

      return { status: 'dispatched', runId: 'run-1' };
    };

    // 1. Missing required input throws validation error before execution
    assert.throws(
      () => {
        executeUnderActionPrecondition(
          coordinationId,
          { ...action, writerId: 'driver-1', inputPayload: {} },
          mutationFn,
          { cwd: tempDir, repoRoot: tempDir },
        );
      },
      (err) => err.category === 'validation' && err.message.includes('missing required input'),
    );

    // 2. First execution succeeds
    const res1 = executeUnderActionPrecondition(
      coordinationId,
      { ...action, writerId: 'driver-1', inputPayload: { objective: 'Execute task 1', expectedOutputs: ['res.json'] } },
      mutationFn,
      { cwd: tempDir, repoRoot: tempDir },
    );
    assert.equal(mutationRunCount, 1);
    assert.equal(res1.status, 'dispatched');

    // 3. Repeated execution with identical normalized input payload returns cached result without re-executing callback
    const res2 = executeUnderActionPrecondition(
      coordinationId,
      { ...action, writerId: 'driver-1', inputPayload: { objective: 'Execute task 1', expectedOutputs: ['res.json'] } },
      mutationFn,
      { cwd: tempDir, repoRoot: tempDir },
    );
    assert.equal(mutationRunCount, 1, 'mutation callback must NOT run a second time for identical payload');
    assert.equal(res2.idempotent, true);
    assert.equal(res2.cached, true);
    assert.equal(res2.status, 'dispatched');

    // 4. Execution with same actionKey but DIFFERENT payload throws payload-conflict
    assert.throws(
      () => {
        executeUnderActionPrecondition(
          coordinationId,
          { ...action, writerId: 'driver-1', inputPayload: { objective: 'Different payload text', expectedOutputs: ['res.json'] } },
          mutationFn,
          { cwd: tempDir, repoRoot: tempDir },
        );
      },
      (err) => err.category === 'payload-conflict',
    );
    assert.equal(mutationRunCount, 1, 'mutation callback must NOT run on payload conflict');
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('schema compatibility: atomic precondition check operates identically on schemas 1, 2, and 3', () => {
  for (const schemaVersion of ['1', '2', '3']) {
    const coordinationId = `coord_schema_${schemaVersion}_precond`;
    const { tempDir, manifest, def } = setupSessionFixture(coordinationId, {
      schemaVersion,
      eventCount: 0,
      withDefinition: false,
      completed: true,
    });

    try {
      const events = [
        { type: 'assignment-created', payload: { assignmentId: 'asgn-1', actorId: 'worker-1' } },
        { type: 'result-linked', payload: { assignmentId: 'asgn-1', runId: 'run_asgn-1_01' } },
      ];
      const proj = projectCoordinationActions({ manifest, events, definition: def });
      const closeAction = proj.actions.find((a) => a.kind === 'close');
      assert.ok(closeAction, `Schema ${schemaVersion} must project a close action when readyToClose`);

      let executed = false;
      const res = executeUnderActionPrecondition(
        coordinationId,
        {
          ...closeAction,
          inputPayload: { authorizedBy: { type: 'driver', id: 'driver-1' } },
        },
        () => {
          executed = true;
          return { closed: true };
        },
        { cwd: tempDir, repoRoot: tempDir },
      );
      assert.equal(executed, true, `Schema ${schemaVersion} must execute mutation callback`);
      assert.equal(res.closed, true);
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  }
});

test('concurrent two-OS-process race: exactly one process succeeds and second is refused with stale-action-key', async () => {
  const coordinationId = 'coord_multiprocess_race';
  const { tempDir, manifest, def } = setupSessionFixture(coordinationId, { schemaVersion: '3', eventCount: 0 });

  try {
    const proj = projectCoordinationActions({ manifest, events: [], definition: def });
    const action1 = proj.actions.find((a) => a.kind === 'record-human-turn');
    const action2 = proj.actions.find((a) => a.kind === 'dispatch-operation');
    assert.ok(action1, 'record-human-turn must be projected');
    assert.ok(action2, 'dispatch-operation must be projected');

    const makeWorkerScript = (scriptPath, act, payload) => {
      fs.writeFileSync(
        scriptPath,
        `
        import { executeCoordinationActionUseCase } from '${path.resolve('src/verbs/coordination/actions.mjs')}';

        const coordinationId = '${coordinationId}';
        const tempDir = '${tempDir}';
        const action = ${JSON.stringify({
          ...act,
          coordinationId,
          writerId: 'driver-1',
          inputPayload: payload,
        })};

        try {
          await executeCoordinationActionUseCase(
            { cwd: tempDir, repoRoot: tempDir },
            action,
          );
          process.stdout.write('OUTCOME:SUCCESS\\n');
        } catch (err) {
          process.stdout.write('OUTCOME:REFUSED:' + err.category + '\\n');
        }
        `,
        'utf8',
      );
    };

    const artifactFile = path.join(tempDir, 'human-turn-artifact.md');
    fs.writeFileSync(artifactFile, 'Human feedback content');

    const workerScript1 = path.join(tempDir, 'race-worker-1.mjs');
    const workerScript2 = path.join(tempDir, 'race-worker-2.mjs');
    makeWorkerScript(workerScript1, action1, {
      turnId: 'turn-race-1',
      turnOrdinal: 1,
      channel: 'cli',
      artifactRef: artifactFile,
      externalRef: 'ext-race-1',
      attributedTo: { type: 'person', id: 'human-driver' },
    });
    makeWorkerScript(workerScript2, action2, {
      objective: 'Test multiprocess race',
      expectedOutputs: ['res.json'],
    });

    const { spawn } = await import('node:child_process');
    const runWorker = (script) =>
      new Promise((resolve) => {
        const p = spawn(process.execPath, [script]);
        let out = '';
        p.stdout.on('data', (d) => (out += d.toString()));
        p.on('close', () => resolve(out.trim()));
      });

    const [out1, out2] = await Promise.all([runWorker(workerScript1), runWorker(workerScript2)]);
    const outcomes = [out1, out2].sort();

    assert.equal(outcomes[1], 'OUTCOME:SUCCESS', 'One worker must succeed');
    assert.equal(outcomes[0], 'OUTCOME:REFUSED:stale-action-key', 'Other worker must be refused with stale-action-key');
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('concurrent two-OS-process same-key race: identical payload yields idempotent success for second worker, while conflicting payload yields payload-conflict', async () => {
  const coordinationId = 'coord_multiprocess_samekey_race';
  const { tempDir, manifest, def } = setupSessionFixture(coordinationId, { schemaVersion: '3', eventCount: 0 });

  try {
    const proj = projectCoordinationActions({ manifest, events: [], definition: def });
    const action = proj.actions.find((a) => a.kind === 'record-human-turn');
    assert.ok(action, 'record-human-turn must be projected');

    const artifactFile = path.join(tempDir, 'human-feedback.md');
    fs.writeFileSync(artifactFile, 'Human feedback content');

    const makeWorkerScript = (scriptPath, cId, dir, act, payload) => {
      fs.writeFileSync(
        scriptPath,
        `
        import { executeCoordinationActionUseCase } from '${path.resolve('src/verbs/coordination/actions.mjs')}';

        const coordinationId = '${cId}';
        const tempDir = '${dir}';
        const action = ${JSON.stringify({
          ...act,
          coordinationId: cId,
          writerId: 'driver-1',
          inputPayload: payload,
        })};

        try {
          const res = await executeCoordinationActionUseCase(
            { cwd: tempDir, repoRoot: tempDir },
            action,
          );
          if (res.idempotent) {
            process.stdout.write('OUTCOME:SUCCESS:IDEMPOTENT\\n');
          } else {
            process.stdout.write('OUTCOME:SUCCESS:INITIAL\\n');
          }
        } catch (err) {
          process.stdout.write('OUTCOME:REFUSED:' + err.category + '\\n');
        }
        `,
        'utf8',
      );
    };

    const { spawn } = await import('node:child_process');
    const runWorker = (script) =>
      new Promise((resolve) => {
        const p = spawn(process.execPath, [script]);
        let out = '';
        p.stdout.on('data', (d) => (out += d.toString()));
        p.on('close', () => resolve(out.trim()));
      });

    // 1. Same key, identical payload race: exactly one process performs initial mutation,
    // and the concurrent sibling recovers the cached result idempotently. Both succeed!
    const workerScript1 = path.join(tempDir, 'samekey-worker-1.mjs');
    const workerScript2 = path.join(tempDir, 'samekey-worker-2.mjs');
    const identicalPayload = {
      turnId: 'turn-same-1',
      turnOrdinal: 1,
      channel: 'cli',
      artifactRef: artifactFile,
      externalRef: 'ext-same-1',
      attributedTo: { type: 'person', id: 'human-driver' },
    };
    makeWorkerScript(workerScript1, coordinationId, tempDir, action, identicalPayload);
    makeWorkerScript(workerScript2, coordinationId, tempDir, action, identicalPayload);

    const [out1, out2] = await Promise.all([runWorker(workerScript1), runWorker(workerScript2)]);
    const outcomesIdentical = [out1, out2].sort();

    assert.deepEqual(
      outcomesIdentical,
      ['OUTCOME:SUCCESS:IDEMPOTENT', 'OUTCOME:SUCCESS:INITIAL'],
      'Same-key race with identical payload must yield one initial success and one idempotent cached success',
    );

    // 2. Same key, conflicting payload race on fresh session:
    // One process succeeds with initial mutation; the concurrent sibling with conflicting payload is refused with payload-conflict.
    const conflictCoordinationId = 'coord_multiprocess_conflict_race';
    const fixture2 = setupSessionFixture(conflictCoordinationId, { schemaVersion: '3', eventCount: 0 });
    try {
      const proj2 = projectCoordinationActions({ manifest: fixture2.manifest, events: [], definition: fixture2.def });
      const actionConflict = proj2.actions.find((a) => a.kind === 'record-human-turn');

      const artifactFile2 = path.join(fixture2.tempDir, 'human-feedback-2.md');
      fs.writeFileSync(artifactFile2, 'Human feedback content 2');

      const conflictScript1 = path.join(fixture2.tempDir, 'conflict-worker-1.mjs');
      const conflictScript2 = path.join(fixture2.tempDir, 'conflict-worker-2.mjs');
      makeWorkerScript(conflictScript1, conflictCoordinationId, fixture2.tempDir, actionConflict, {
        turnId: 'turn-conflict-alpha',
        turnOrdinal: 1,
        channel: 'cli',
        artifactRef: artifactFile2,
        externalRef: 'ext-conflict-1',
        attributedTo: { type: 'person', id: 'human-driver' },
      });
      makeWorkerScript(conflictScript2, conflictCoordinationId, fixture2.tempDir, actionConflict, {
        turnId: 'turn-conflict-BETA',
        turnOrdinal: 1,
        channel: 'cli',
        artifactRef: artifactFile2,
        externalRef: 'ext-conflict-1',
        attributedTo: { type: 'person', id: 'human-driver' },
      });

      const [cOut1, cOut2] = await Promise.all([runWorker(conflictScript1), runWorker(conflictScript2)]);
      const outcomesConflict = [cOut1, cOut2].sort();

      assert.deepEqual(
        outcomesConflict,
        ['OUTCOME:REFUSED:payload-conflict', 'OUTCOME:SUCCESS:INITIAL'],
        'Same-key race with conflicting payload must yield one initial success and one payload-conflict refusal',
      );
    } finally {
      fs.rmSync(fixture2.tempDir, { recursive: true, force: true });
    }
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('production write door integration: closeCoordinationUseCase executes via action precondition seam', async () => {
  const coordinationId = 'coord_close_use_case_precond';
  const { tempDir, manifest } = setupSessionFixture(coordinationId, { schemaVersion: '1', eventCount: 0, withDefinition: false, completed: true });

  try {
    const events = [
      { type: 'assignment-created', payload: { assignmentId: 'asgn-1', actorId: 'worker-1' } },
      { type: 'result-linked', payload: { assignmentId: 'asgn-1', runId: 'run_asgn-1_01' } },
    ];
    const proj = projectCoordinationActions({ manifest, events });
    const closeAction = proj.actions.find((a) => a.kind === 'close');
    assert.ok(closeAction, 'close action must be projected when readyToClose');

    const ctx = { cwd: tempDir, repoRoot: tempDir };

    // 1. Calling closeCoordinationUseCase with valid actionKey closes the session
    const closeResult = await closeCoordinationUseCase(ctx, {
      requestObject: {
        kind: 'close',
        coordinationId,
        actionKey: closeAction.actionKey,
        authorizedBy: { type: 'driver', id: 'driver-1' },
      },
    });

    assert.equal(closeResult.closed, true);
    assert.equal(closeResult.coordinationId, coordinationId);

    // 2. Calling again with the same actionKey and identical payload is idempotent
    const retryResult = await closeCoordinationUseCase(ctx, {
      requestObject: {
        kind: 'close',
        coordinationId,
        actionKey: closeAction.actionKey,
        authorizedBy: { type: 'driver', id: 'driver-1' },
      },
    });
    assert.equal(retryResult.idempotent, true);
    assert.equal(retryResult.cached, true);
    assert.equal(retryResult.closed, true);

    // 3. Calling with the same actionKey but conflicting payload is refused with payload-conflict
    await assert.rejects(
      async () => {
        await closeCoordinationUseCase(ctx, {
          requestObject: {
            kind: 'close',
            coordinationId,
            actionKey: closeAction.actionKey,
            authorizedBy: { type: 'driver', id: 'driver-1' },
            dissentingActorIds: ['extra-dissenting-actor'],
          },
        });
      },
      (err) => err.category === 'payload-conflict',
      'subsequent close invocation with conflicting payload must be refused with payload-conflict',
    );

    // 4. Calling with unauthorized driver is refused with unauthorized
    await assert.rejects(
      async () => {
        await closeCoordinationUseCase(ctx, {
          requestObject: {
            kind: 'close',
            coordinationId,
            actionKey: closeAction.actionKey,
            authorizedBy: { type: 'driver', id: 'driver-2' },
          },
        });
      },
      (err) => err.category === 'unauthorized',
      'close invocation with unauthorized driver must be rejected with unauthorized',
    );

    // 5. Calling with arbitrary/forged actionKey is refused
    await assert.rejects(
      async () => {
        await closeCoordinationUseCase(ctx, {
          requestObject: {
            kind: 'close',
            coordinationId,
            actionKey: 'sha256:forged_action_key_1234567890',
            authorizedBy: { type: 'driver', id: 'driver-1' },
          },
        });
      },
      (err) => err.category === 'stale-action-key',
    );
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('failure injection: mutationFn throwing releases lock and does not record action as successful', async () => {
  const coordinationId = 'coord_failure_injection';
  const { tempDir, manifest, def, eventsPath } = setupSessionFixture(coordinationId, { schemaVersion: '3', eventCount: 0 });

  try {
    const proj = projectCoordinationActions({ manifest, events: [], definition: def });
    const action = proj.actions.find((a) => a.kind === 'dispatch-operation');
    assert.ok(action, 'dispatch-operation must be projected');

    const initialEventsLength = fs.readFileSync(eventsPath, 'utf8').length;

    // 1. Mutation throws an unexpected error
    assert.throws(
      () => {
        executeUnderActionPrecondition(
          coordinationId,
          { ...action, writerId: 'driver-1', inputPayload: { objective: 'Will fail', expectedOutputs: ['out.json'] } },
          () => {
            throw new Error('injected mutation failure');
          },
          { cwd: tempDir, repoRoot: tempDir },
        );
      },
      /injected mutation failure/,
    );

    // 2. Action sidecar file .action-keys.json must never exist
    const actionRecordPath = path.join(tempDir, '.fgos/coordination/sessions', coordinationId, '.action-keys.json');
    assert.equal(fs.existsSync(actionRecordPath), false, '.action-keys.json sidecar must never exist');
    assert.equal(fs.readFileSync(eventsPath, 'utf8').length, initialEventsLength, 'events file must remain unmutated after failure');

    // 3. Lock was released cleanly, allowing a subsequent caller to execute
    let retrySucceeded = false;
    executeUnderActionPrecondition(
      coordinationId,
      { ...action, writerId: 'driver-1', inputPayload: { objective: 'Will fail', expectedOutputs: ['out.json'] } },
      () => {
        retrySucceeded = true;
      },
      { cwd: tempDir, repoRoot: tempDir },
    );
    assert.equal(retrySucceeded, true, 'subsequent execution must acquire lock and succeed');
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('pure authoritative log idempotency: close and operation idempotency succeeds with zero .action-keys.json sidecar file', async () => {
  const coordinationId = 'coord_pure_authoritative_idempotency';
  const { tempDir, manifest } = setupSessionFixture(coordinationId, { schemaVersion: '1', eventCount: 0, withDefinition: false, completed: true });
  const ctx = { cwd: tempDir, repoRoot: tempDir };

  try {
    const events = [
      { type: 'assignment-created', payload: { assignmentId: 'asgn-1', actorId: 'worker-1' } },
      { type: 'result-linked', payload: { assignmentId: 'asgn-1', runId: 'run_asgn-1_01' } },
    ];
    const proj = projectCoordinationActions({ manifest, events });
    const closeAction = proj.actions.find((a) => a.kind === 'close');
    assert.ok(closeAction, 'close action must be projected for initial session');

    // 1. First call: closeCoordinationUseCase executes mutation
    const first = await closeCoordinationUseCase(ctx, {
      requestObject: {
        kind: 'close',
        coordinationId,
        actionKey: closeAction.actionKey,
        authorizedBy: { type: 'driver', id: 'driver-1' },
      },
    });
    assert.equal(first.closed, true);

    // 2. Verify zero .action-keys.json sidecar file was created
    const actionRecordPath = path.join(tempDir, '.fgos/coordination/sessions', coordinationId, '.action-keys.json');
    assert.equal(fs.existsSync(actionRecordPath), false, '.action-keys.json sidecar must never be created');

    // 3. Second call: same key and payload retried.
    // Authoritative log recovery detects the session closed at terminal event and matches close actionKey.
    const second = await closeCoordinationUseCase(ctx, {
      requestObject: {
        kind: 'close',
        coordinationId,
        actionKey: closeAction.actionKey,
        authorizedBy: { type: 'driver', id: 'driver-1' },
      },
    });
    assert.equal(second.idempotent, true);
    assert.equal(second.cached, true);
    assert.equal(second.closed, true);

    // 4. Still no sidecar exists
    assert.equal(fs.existsSync(actionRecordPath), false);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('driver authority: missing or mismatched driver identity is rejected with unauthorized', () => {
  const coordinationId = 'coord_driver_auth_rejection';
  const { tempDir, manifest, def } = setupSessionFixture(coordinationId, { eventCount: 0 });

  try {
    const proj = projectCoordinationActions({ manifest, events: [], definition: def });
    const action = proj.actions.find((a) => a.kind === 'dispatch-operation');
    assert.ok(action, 'dispatch-operation must be projected');

    // 1. Missing driver identity throws unauthorized
    assert.throws(
      () => {
        executeUnderActionPrecondition(
          coordinationId,
          { ...action, inputPayload: { objective: 'Test', expectedOutputs: ['out.json'] } },
          () => {},
          { cwd: tempDir, repoRoot: tempDir },
        );
      },
      (err) => err.category === 'unauthorized',
    );

    // 2. Mismatched driver identity throws unauthorized
    assert.throws(
      () => {
        executeUnderActionPrecondition(
          coordinationId,
          { ...action, writerId: 'rogue-driver', inputPayload: { objective: 'Test', expectedOutputs: ['out.json'] } },
          () => {},
          { cwd: tempDir, repoRoot: tempDir },
        );
      },
      (err) => err.category === 'unauthorized',
    );

    // 3. Negative test (R2-06): supplying authorizedBy on non-close action throws validation
    assert.throws(
      () => {
        executeUnderActionPrecondition(
          coordinationId,
          {
            ...action,
            writerId: 'driver-1',
            inputPayload: { objective: 'Test', expectedOutputs: ['out.json'], authorizedBy: 'driver-1' },
          },
          () => {},
          { cwd: tempDir, repoRoot: tempDir },
        );
      },
      (err) => err.category === 'validation' && err.message.includes('not permitted on non-close actions'),
    );

    // 4. Valid driver identity succeeds
    let executed = false;
    executeUnderActionPrecondition(
      coordinationId,
      { ...action, writerId: 'driver-1', inputPayload: { objective: 'Test', expectedOutputs: ['out.json'] } },
      () => {
        executed = true;
      },
      { cwd: tempDir, repoRoot: tempDir },
    );
    assert.equal(executed, true);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('production mutator integration: dispatch-operation executes under seam via executeCoordinationActionUseCase', async () => {
  const coordinationId = 'coord_prod_dispatch_op';
  const { tempDir, manifest, def } = setupSessionFixture(coordinationId, { schemaVersion: '3', eventCount: 0 });

  try {
    const proj = projectCoordinationActions({ manifest, events: [], definition: def });
    const projectedAction = proj.actions.find((a) => a.kind === 'dispatch-operation');
    assert.ok(projectedAction, 'dispatch-operation must be projected for fresh session');

    const action = {
      ...projectedAction,
      coordinationId,
      writerId: 'driver-1',
      inputPayload: {
        objective: 'Execute op-1',
        expectedOutputs: ['res.json'],
        contextRefs: [],
        constraints: ['caller-constraint'],
        capabilities: ['capability-1'],
        fromAssignmentId: 'root-assignment',
        intent: 'caller-intent',
        round: 1,
        taskKey: 'action-task',
        mutation: 'read-only',
      },
    };

    const ctx = { cwd: tempDir, repoRoot: tempDir };

    // 1. Initial call executes mutation under seam and creates an assignment
    const res1 = await executeCoordinationActionUseCase(ctx, action);

    assert.equal(res1.status, 'dispatched');
    assert.ok(res1.assignmentId);

    // 2. Repeat call with same actionKey and identical payload returns idempotent result
    const res2 = await executeCoordinationActionUseCase(ctx, action);
    assert.equal(res2.idempotent, true);
    assert.equal(res2.cached, true);
    assert.equal(res2.assignmentId, res1.assignmentId);

    // 3. Every normalized request field is bound by the retry record. Both a
    // changed value and an omitted previously-present optional value conflict
    // before the production mutation door can run again.
    const optionalFields = [
      ['contextRefs', ['different-context'], false],
      ['constraints', ['different-constraint'], true],
      ['capabilities', ['different-capability'], true],
      ['fromAssignmentId', 'different-parent', true],
      ['intent', 'different-intent', true],
      ['round', 2, true],
      ['taskKey', 'different-task', true],
      ['mutation', 'mutating', true],
    ];
    for (const [field, changedValue, omissionConflicts] of optionalFields) {
      await assert.rejects(
        () => executeCoordinationActionUseCase(ctx, {
          ...action,
          inputPayload: { ...action.inputPayload, [field]: changedValue },
        }),
        (err) => err.category === 'payload-conflict',
        `changed ${field} must conflict`,
      );
      const omitted = { ...action.inputPayload };
      delete omitted[field];
      if (omissionConflicts) {
        await assert.rejects(
          () => executeCoordinationActionUseCase(ctx, { ...action, inputPayload: omitted }),
          (err) => err.category === 'payload-conflict',
          `omitted ${field} must conflict`,
        );
      } else {
        const omittedResult = await executeCoordinationActionUseCase(ctx, { ...action, inputPayload: omitted });
        assert.equal(omittedResult.idempotent, true, `omitted ${field} is equivalent after production normalization`);
      }
    }
    await assert.rejects(
      () => executeCoordinationActionUseCase(ctx, {
        ...action,
        inputPayload: { ...action.inputPayload, objective: 'Different conflicting objective' },
      }),
      (err) => err.category === 'payload-conflict',
    );

    // 4. Verify no .action-keys.json sidecar was ever created
    const sidecarPath = path.join(tempDir, '.fgos/coordination/sessions', coordinationId, '.action-keys.json');
    assert.equal(fs.existsSync(sidecarPath), false);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('production mutator integration: recordHumanTurn executes under seam via executeCoordinationActionUseCase', async () => {
  const coordinationId = 'coord_prod_human_turn';
  const { tempDir, manifest, def } = setupSessionFixture(coordinationId, { schemaVersion: '3', eventCount: 0 });

  try {
    const artifactFile = path.join(tempDir, 'human-note.md');
    fs.writeFileSync(artifactFile, 'Human feedback content');

    const proj = projectCoordinationActions({ manifest, events: [], definition: def });
    const projectedAction = proj.actions.find((a) => a.kind === 'record-human-turn');
    assert.ok(projectedAction, 'record-human-turn must be projected for active session');

    const action = {
      ...projectedAction,
      coordinationId,
      writerId: 'driver-1',
      inputPayload: {
        turnId: 'turn-1',
        turnOrdinal: 1,
        channel: 'review',
        artifactRef: artifactFile,
        externalRef: 'ext-1',
        attributedTo: { type: 'person', id: 'human-operator' },
      },
    };

    const ctx = { cwd: tempDir, repoRoot: tempDir };

    // 1. Initial call executes recordHumanTurnLocked under seam
    const res1 = await executeCoordinationActionUseCase(ctx, action);

    assert.equal(res1.turnId, 'turn-1');
    assert.equal(res1.turnOrdinal, 1);

    // 2. Repeat call with same actionKey is idempotent
    const res2 = await executeCoordinationActionUseCase(ctx, action);
    assert.equal(res2.idempotent, true);
    assert.equal(res2.cached, true);
    assert.equal(res2.turnId, 'turn-1');

    // 3. Same key with conflicting payload throws payload-conflict
    await assert.rejects(
      () =>
        executeCoordinationActionUseCase(ctx, {
          ...action,
          inputPayload: {
            ...action.inputPayload,
            attributedTo: { type: 'person', id: 'different-person' },
          },
        }),
      (err) => err.category === 'payload-conflict',
    );
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('production mutator integration: record-disposition executes under seam via executeCoordinationActionUseCase', async () => {
  const coordinationId = 'coord_prod_disposition';
  const { tempDir, manifest, def } = setupSessionFixture(coordinationId, { schemaVersion: '3', eventCount: 0, completed: true });

  try {
    // Write assignment.json with proper contract serving op-1
    const asgnDir = path.join(tempDir, '.fgos', 'assignments', 'asgn-1');
    fs.mkdirSync(asgnDir, { recursive: true });
    fs.writeFileSync(
      path.join(asgnDir, 'assignment.json'),
      JSON.stringify({
        assignmentId: 'asgn-1',
        provenance: {
          kind: 'inline',
          contract: {
            objective: 'Execute op-1',
            constraints: [protocolOperationStamp(def, 'op-1')],
          },
        },
      }),
    );

    // Write run result as failed so that quorum.failed detects it
    const runResultPath = path.join(asgnDir, 'runs', '01', 'result.json');
    fs.mkdirSync(path.dirname(runResultPath), { recursive: true });
    fs.writeFileSync(runResultPath, JSON.stringify({ assignmentId: 'asgn-1', runId: 'run_asgn-1_01', status: 'failed' }));

    const events = [
      { type: 'assignment-created', payload: { assignmentId: 'asgn-1', actorId: 'worker-1' } },
      { type: 'result-linked', payload: { assignmentId: 'asgn-1', runId: 'run_asgn-1_01' } },
    ];
    fs.writeFileSync(path.join(tempDir, '.fgos/coordination/sessions', coordinationId, 'events.jsonl'), events.map((e) => JSON.stringify(e)).join('\n') + '\n');

    const ctx = { cwd: tempDir, repoRoot: tempDir };
    const proj = showCoordinationActionsUseCase(ctx, { id: coordinationId });
    const projectedAction = proj.actions.find((a) => a.kind === 'record-disposition');
    assert.ok(projectedAction, 'record-disposition must be projected for completed assignment with failed status');

    const action = {
      ...projectedAction,
      coordinationId,
      writerId: 'driver-1',
      inputPayload: {
        disposition: 'accept',
        rationale: 'Result looks good',
      },
    };

    // 1. Initial call executes recordDriverDispositionLocked under seam
    const res1 = await executeCoordinationActionUseCase(ctx, action);
    assert.equal(res1.kind, 'record-disposition');
    assert.equal(res1.status, 'recorded');
    assert.equal(res1.disposition, 'accept');

    // 2. Repeat call with same actionKey is idempotent
    const res2 = await executeCoordinationActionUseCase(ctx, action);
    assert.equal(res2.idempotent, true);
    assert.equal(res2.cached, true);
    assert.equal(res2.disposition, 'accept');

    // 3. Conflicting payload throws payload-conflict
    await assert.rejects(
      () =>
        executeCoordinationActionUseCase(ctx, {
          ...action,
          inputPayload: {
            disposition: 'reject',
            rationale: 'Actually rejected',
          },
        }),
      (err) => err.category === 'payload-conflict',
    );
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('production mutator integration: authorize-and-dispatch executes under seam via executeCoordinationActionUseCase', async () => {
  const coordinationId = 'coord_prod_auth_dispatch';
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-stale-proof-auth-'));
  const sessionDir = path.join(tempDir, '.fgos/coordination/sessions', coordinationId);
  fs.mkdirSync(sessionDir, { recursive: true });

  const def = {
    apiVersion: 'fgos.dev/v1alpha1',
    kind: 'FlowDefinition',
    metadata: { id: 'auth-protocol', version: '1.0.0' },
    spec: {
      profile: { kind: 'CoordinationProtocol' },
      roles: ['worker-1'],
      actors: [{ id: 'worker-1', role: 'worker-1' }],
      operations: [
        { id: 'op-auth', role: 'worker-1', task: { contractTemplate: 't' } },
      ],
      graph: {
        entry: 'step-1',
        nodes: [
          {
            id: 'step-1',
            operations: [{ ref: 'op-auth', actor: 'worker-1', activation: { mode: 'driver-authorized' } }],
          },
        ],
      },
    },
  };
  const defContent = JSON.stringify(def);
  const hexDigest = crypto.createHash('sha256').update(defContent).digest('hex');
  fs.writeFileSync(path.join(sessionDir, 'snapshot.json'), defContent);

  const manifest = {
    schemaVersion: '3',
    coordinationId,
    status: 'active',
    objective: 'Test authorize-and-dispatch',
    createdAt: new Date().toISOString(),
    provenanceRoot: { writerId: 'driver-1' },
    actors: [{ id: 'worker-1', role: 'worker-1' }],
    aggregateBounds: { wallTimeMs: 10000, maxAssignments: 10, maxConcurrency: 2, maxRounds: 5, maxTaskDepth: 2 },
    assignmentRefs: [],
    completedAt: null,
    definitionRef: { id: 'auth-protocol', version: '1.0.0' },
    snapshotRef: { digest: hexDigest },
  };
  fs.writeFileSync(path.join(sessionDir, 'session.json'), JSON.stringify(manifest));
  fs.writeFileSync(path.join(sessionDir, 'events.jsonl'), '');

  try {
    const proj = projectCoordinationActions({ manifest, events: [], definition: def });
    const projectedAction = proj.actions.find((a) => a.kind === 'authorize-and-dispatch');
    assert.ok(projectedAction, 'authorize-and-dispatch must be projected');

    const action = {
      ...projectedAction,
      coordinationId,
      writerId: 'driver-1',
      inputPayload: {
        reason: 'Authorized for testing',
        objective: 'Execute authorized operation',
        expectedOutputs: ['auth-result.json'],
        grantedContextRefs: [],
        contextRefs: [],
        constraints: ['auth-constraint'],
        capabilities: ['auth-capability'],
        mutation: 'read-only',
      },
    };

    const ctx = { cwd: tempDir, repoRoot: tempDir };

    // 1. Initial call executes authorizeOperationLocked and createSessionAssignmentLocked under seam
    const res1 = await executeCoordinationActionUseCase(ctx, action);
    assert.equal(res1.kind, 'authorize-and-dispatch');
    assert.equal(res1.status, 'dispatched');
    assert.ok(res1.authorizationId.startsWith('auth_'));
    assert.ok(res1.assignmentId);

    // 2. Repeat call is idempotent
    const res2 = await executeCoordinationActionUseCase(ctx, action);
    assert.equal(res2.idempotent, true);
    assert.equal(res2.cached, true);
    assert.equal(res2.authorizationId, res1.authorizationId);
    assert.equal(res2.assignmentId, res1.assignmentId);

    const eventsAfterDispatch = fs.readFileSync(path.join(sessionDir, 'events.jsonl'), 'utf8');
    const assignmentsDir = path.join(tempDir, '.fgos/assignments');
    const assignmentsAfterDispatch = JSON.stringify(fs.readdirSync(assignmentsDir, { recursive: true }).sort());

    // P2-F01 invariant: caller cannot override authorizationId or invocationKey
    await assert.rejects(
      () => executeCoordinationActionUseCase(ctx, {
        ...action,
        inputPayload: { ...action.inputPayload, authorizationId: 'auth_override' },
      }),
      (err) => err.category === 'validation' && err.message.includes('authorizationId'),
    );
    await assert.rejects(
      () => executeCoordinationActionUseCase(ctx, {
        ...action,
        inputPayload: { ...action.inputPayload, invocationKey: 'inv_override' },
      }),
      (err) => err.category === 'validation' && err.message.includes('invocationKey'),
    );

    const changedFields = [
      ['reason', 'Different authorization reason'],
      ['objective', 'Conflicting objective text'],
      ['expectedOutputs', ['different-result.json']],
      ['grantedContextRefs', ['assignment_foreign']],
      ['contextRefs', ['assignment_foreign']],
      ['constraints', ['different-constraint']],
      ['capabilities', ['different-capability']],
      ['mutation', 'mutating'],
    ];
    for (const [field, value] of changedFields) {
      await assert.rejects(
        () => executeCoordinationActionUseCase(ctx, {
          ...action,
          inputPayload: { ...action.inputPayload, [field]: value },
        }),
        (err) => err.category === 'payload-conflict',
        `changed authorize-and-dispatch field ${field} must conflict`,
      );
      assert.equal(fs.readFileSync(path.join(sessionDir, 'events.jsonl'), 'utf8'), eventsAfterDispatch);
      assert.equal(JSON.stringify(fs.readdirSync(assignmentsDir, { recursive: true }).sort()), assignmentsAfterDispatch);
    }

    const omittedFields = ['constraints', 'capabilities'];
    for (const field of omittedFields) {
      const omitted = { ...action.inputPayload };
      delete omitted[field];
      await assert.rejects(
        () => executeCoordinationActionUseCase(ctx, { ...action, inputPayload: omitted }),
        (err) => err.category === 'payload-conflict',
        `omitted authorize-and-dispatch field ${field} must conflict`,
      );
      assert.equal(fs.readFileSync(path.join(sessionDir, 'events.jsonl'), 'utf8'), eventsAfterDispatch);
      assert.equal(JSON.stringify(fs.readdirSync(assignmentsDir, { recursive: true }).sort()), assignmentsAfterDispatch);
    }
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('production mutator integration: link-contribution executes under seam via executeCoordinationActionUseCase', async () => {
  const coordinationId = 'coord_prod_link_contrib';
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-stale-proof-contrib-'));
  const sessionDir = path.join(tempDir, '.fgos/coordination/sessions', coordinationId);
  fs.mkdirSync(sessionDir, { recursive: true });

  const artifactFile = path.join(tempDir, 'review-artifact.md');
  fs.writeFileSync(artifactFile, 'Review notes');

  const def = {
    apiVersion: 'fgos.dev/v1alpha1',
    kind: 'FlowDefinition',
    metadata: { id: 'contrib-protocol', version: '1.0.0' },
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
      roles: ['worker-1'],
      actors: [{ id: 'worker-1', role: 'worker-1' }],
      operations: [
        {
          id: 'op-contrib',
          role: 'worker-1',
          task: { contractTemplate: 't' },
          contributions: { allowedTypes: ['proposal'] },
        },
      ],
      graph: {
        entry: 'step-1',
        nodes: [
          {
            id: 'step-1',
            operations: [{ ref: 'op-contrib', actor: 'worker-1', contextAccess: { visibilityWindowRef: 'win-1' } }],
          },
        ],
      },
    },
  };
  const defContent = JSON.stringify(def);
  const hexDigest = crypto.createHash('sha256').update(defContent).digest('hex');
  fs.writeFileSync(path.join(sessionDir, 'snapshot.json'), defContent);

  const manifest = {
    schemaVersion: '3',
    coordinationId,
    status: 'active',
    objective: 'Test link-contribution',
    createdAt: new Date().toISOString(),
    provenanceRoot: { writerId: 'driver-1' },
    actors: [{ id: 'worker-1', role: 'worker-1' }],
    aggregateBounds: { wallTimeMs: 10000, maxAssignments: 10, maxConcurrency: 2, maxRounds: 5, maxTaskDepth: 2 },
    assignmentRefs: ['asgn-1'],
    completedAt: null,
    definitionRef: { id: 'contrib-protocol', version: '1.0.0' },
    snapshotRef: { digest: hexDigest },
  };
  fs.writeFileSync(path.join(sessionDir, 'session.json'), JSON.stringify(manifest));

  const asgnDir = path.join(tempDir, '.fgos', 'assignments', 'asgn-1');
  fs.mkdirSync(asgnDir, { recursive: true });
  fs.writeFileSync(
    path.join(asgnDir, 'assignment.json'),
    JSON.stringify({
      assignmentId: 'asgn-1',
      role: 'worker-1',
      provenance: {
        kind: 'inline',
        contract: {
          objective: 'stub',
          constraints: [protocolOperationStamp(def, 'op-contrib')],
        },
      },
    }),
  );

  const runDir = path.join(asgnDir, 'runs', '01');
  fs.mkdirSync(runDir, { recursive: true });
  const reportPath = path.join(runDir, 'agent-report.md');
  fs.writeFileSync(reportPath, 'Review notes');
  const reportSha = crypto.createHash('sha256').update('Review notes').digest('hex');
  fs.writeFileSync(
    path.join(runDir, 'result.json'),
    JSON.stringify({
      assignmentId: 'asgn-1',
      runId: 'run_asgn-1_01',
      status: 'done',
      confidence: 'reported',
      outputRefs: [reportPath],
      settleReports: [{ path: reportPath, sha256: reportSha }],
    }),
  );

  const events = [
    { type: 'assignment-created', seq: 1, payload: { assignmentId: 'asgn-1', actorId: 'worker-1' } },
    { type: 'result-linked', seq: 2, payload: { assignmentId: 'asgn-1', runId: 'run_asgn-1_01' } },
  ];
  fs.writeFileSync(path.join(sessionDir, 'events.jsonl'), events.map((e) => JSON.stringify(e)).join('\n') + '\n');

  try {
    const getAssignment = (id) => {
      try {
        return JSON.parse(fs.readFileSync(path.join(asgnDir, 'assignment.json'), 'utf8'));
      } catch { return null; }
    };
    const proj = projectCoordinationActions({ manifest, events, definition: def, getAssignment });
    const projectedAction = proj.actions.find((a) => a.kind === 'link-contribution');
    assert.ok(projectedAction, 'link-contribution must be projected');

    const action = {
      ...projectedAction,
      coordinationId,
      writerId: 'driver-1',
      inputPayload: {
        contributionId: 'contrib-link-1',
        contributionType: 'proposal',
        roundKey: 'round-1',
        artifactRef: reportPath,
        runId: 'run_asgn-1_01',
      },
    };

    const ctx = { cwd: tempDir, repoRoot: tempDir };

    // 1. Initial call executes recordContributionLinkLocked under seam
    const res1 = await executeCoordinationActionUseCase(ctx, action);
    assert.equal(res1.kind, 'link-contribution');
    assert.equal(res1.status, 'linked');
    assert.equal(res1.contributionId, 'contrib-link-1');

    // 2. Repeat call is idempotent
    const res2 = await executeCoordinationActionUseCase(ctx, action);
    assert.equal(res2.idempotent, true);
    assert.equal(res2.cached, true);
    assert.equal(res2.contributionId, 'contrib-link-1');

    // 3. Conflicting artifactRef throws payload-conflict
    await assert.rejects(
      () =>
        executeCoordinationActionUseCase(ctx, {
          ...action,
          inputPayload: {
            ...action.inputPayload,
            artifactRef: '/different/artifact/path.md',
          },
        }),
      (err) => err.category === 'payload-conflict',
    );
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('production mutator integration: fan-out executes under seam via executeCoordinationActionUseCase', async () => {
  const coordinationId = 'coord_prod_fan_out';
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-stale-proof-fanout-'));
  const sessionDir = path.join(tempDir, '.fgos/coordination/sessions', coordinationId);
  fs.mkdirSync(sessionDir, { recursive: true });

  const def = {
    apiVersion: 'fgos.dev/v1alpha1',
    kind: 'FlowDefinition',
    metadata: { id: 'fanout-protocol', version: '1.0.0' },
    spec: {
      profile: {
        kind: 'CoordinationProtocol',
        cohort: { independence: 'isolated-until-fan-in' },
      },
      roles: ['researcher'],
      actors: [
        { id: 'worker-1', role: 'researcher' },
        { id: 'worker-2', role: 'researcher' },
      ],
      operations: [
        { id: 'op-fan', role: 'researcher', task: { contractTemplate: 't' } },
      ],
      graph: {
        entry: 'step-1',
        nodes: [
          {
            id: 'step-1',
            operations: [
              { ref: 'op-fan', actor: 'worker-1' },
              { ref: 'op-fan', actor: 'worker-2' },
            ],
          },
        ],
      },
    },
  };
  const defContent = JSON.stringify(def);
  const hexDigest = crypto.createHash('sha256').update(defContent).digest('hex');
  fs.writeFileSync(path.join(sessionDir, 'snapshot.json'), defContent);

  const manifest = {
    schemaVersion: '3',
    coordinationId,
    status: 'active',
    objective: 'Test fan-out',
    createdAt: new Date().toISOString(),
    provenanceRoot: { writerId: 'driver-1' },
    actors: [
      { id: 'worker-1', role: 'researcher' },
      { id: 'worker-2', role: 'researcher' },
    ],
    aggregateBounds: { wallTimeMs: 10000, maxAssignments: 10, maxConcurrency: 2, maxRounds: 5, maxTaskDepth: 2 },
    assignmentRefs: [],
    completedAt: null,
    definitionRef: { id: 'fanout-protocol', version: '1.0.0' },
    snapshotRef: { digest: hexDigest },
  };
  fs.writeFileSync(path.join(sessionDir, 'session.json'), JSON.stringify(manifest));
  fs.writeFileSync(path.join(sessionDir, 'events.jsonl'), '');

  try {
    const runnerConfig = makeCohortRunnerConfig(tempDir);
    const proj = projectCoordinationActions({ manifest, events: [], definition: def });
    const projectedAction = proj.actions.find((a) => a.kind === 'fan-out');
    assert.ok(projectedAction, 'fan-out must be projected for unassigned isolated cohort');

    const action = {
      ...projectedAction,
      coordinationId,
      writerId: 'driver-1',
      inputPayload: {
        branches: [
          { actorId: 'worker-1', objective: 'Branch 1', expectedOutputs: ['out-1.json'] },
          { actorId: 'worker-2', objective: 'Branch 2', expectedOutputs: ['out-2.json'] },
        ],
      },
    };

    const ctx = { cwd: tempDir, repoRoot: tempDir, runnerConfig };

    const cohortBranches = {
      worker1: { actorId: 'worker-1', objective: 'Branch 1', expectedOutputs: ['out-1.json'] },
      worker2: { actorId: 'worker-2', objective: 'Branch 2', expectedOutputs: ['out-2.json'] },
    };
    const rejectedCohorts = [
      [cohortBranches.worker1],
      [cohortBranches.worker1, cohortBranches.worker2, { actorId: 'worker-3', objective: 'Foreign' }],
      [{ ...cohortBranches.worker1, actorId: 'worker-3' }, cohortBranches.worker2],
      [cohortBranches.worker1, { ...cohortBranches.worker1 }],
    ];
    for (const branches of rejectedCohorts) {
      await assert.rejects(
        () => executeCoordinationActionUseCase(ctx, { ...action, inputPayload: { branches } }),
        (err) => err.category === 'validation',
        `fan-out cohort must reject ${branches.map((branch) => branch.actorId).join(',')}`,
      );
      assert.equal(fs.readFileSync(path.join(sessionDir, 'events.jsonl'), 'utf8'), '', 'cohort refusal must append no event');
      const assignmentsDir = path.join(tempDir, '.fgos/assignments');
      assert.deepEqual(fs.existsSync(assignmentsDir) ? fs.readdirSync(assignmentsDir) : [], [], 'cohort refusal must create no assignment');
    }

    // Cohort equality is order-insensitive; the composer canonicalizes it
    // before production validation and the shared step executor.
    action.inputPayload = { branches: [cohortBranches.worker2, cohortBranches.worker1] };

    // 1. Initial call executes dispatchResearchFanOutLocked under seam
    const res1 = await executeCoordinationActionUseCase(ctx, action);
    assert.equal(res1.kind, 'fan-out');
    assert.equal(res1.status, 'dispatched');
    assert.equal(res1.branches.length, 2);
    assert.ok(res1.branches[0].assignmentId);
    assert.ok(res1.branches[1].assignmentId);

    const eventsAfterDispatch = fs.readFileSync(path.join(sessionDir, 'events.jsonl'), 'utf8');
    const assignmentsAfterDispatch = fs.readdirSync(path.join(tempDir, '.fgos/assignments')).sort();
    const retryConflictPayloads = [
      [{ ...cohortBranches.worker1 }],
      [cohortBranches.worker1, cohortBranches.worker2, { actorId: 'worker-3', objective: 'Foreign', expectedOutputs: ['foreign'] }],
      [{ ...cohortBranches.worker1, actorId: 'worker-3' }, cohortBranches.worker2],
      [cohortBranches.worker1, { ...cohortBranches.worker1 }],
      [{ ...cohortBranches.worker1, expectedOutputs: ['changed-output'] }, cohortBranches.worker2],
      [{ ...cohortBranches.worker1, constraints: ['changed-constraint'] }, cohortBranches.worker2],
      [{ ...cohortBranches.worker1, capabilities: ['changed-capability'] }, cohortBranches.worker2],
      [{ ...cohortBranches.worker1, fromAssignmentId: 'asgn_foreign' }, cohortBranches.worker2],
      [{ ...cohortBranches.worker1, intent: 'changed-intent' }, cohortBranches.worker2],
      [{ ...cohortBranches.worker1, taskKey: 'changed-task-key' }, cohortBranches.worker2],
    ];
    for (const branches of retryConflictPayloads) {
      await assert.rejects(
        () => executeCoordinationActionUseCase(ctx, { ...action, inputPayload: { branches } }),
        (err) => err.category === 'payload-conflict',
        `fan-out retry must conflict for ${branches.map((branch) => branch.actorId).join(',')}`,
      );
      assert.equal(fs.readFileSync(path.join(sessionDir, 'events.jsonl'), 'utf8'), eventsAfterDispatch, 'retry conflict must append no event');
      assert.deepEqual(fs.readdirSync(path.join(tempDir, '.fgos/assignments')).sort(), assignmentsAfterDispatch, 'retry conflict must create no assignment');
    }

    const reorderedRetry = await executeCoordinationActionUseCase(ctx, {
      ...action,
      inputPayload: { branches: [cohortBranches.worker1, cohortBranches.worker2] },
    });
    assert.equal(reorderedRetry.idempotent, true, 'same normalized fan-out payload in another branch order must be idempotent');
    assert.equal(reorderedRetry.cached, true);

    // 2. Repeat call is idempotent
    const res2 = await executeCoordinationActionUseCase(ctx, action);
    assert.equal(res2.idempotent, true);
    assert.equal(res2.cached, true);
    assert.equal(res2.branches.length, 2);
    assert.equal(res2.branches[0].assignmentId, res1.branches[0].assignmentId);
    assert.equal(res2.branches[1].assignmentId, res1.branches[1].assignmentId);

    // 3. Conflicting payload throws payload-conflict
    await assert.rejects(
      () =>
        executeCoordinationActionUseCase(ctx, {
          ...action,
          inputPayload: {
            branches: [
              { actorId: 'worker-1', objective: 'Conflicting objective', expectedOutputs: ['out-1.json'] },
              { actorId: 'worker-2', objective: 'Branch 2', expectedOutputs: ['out-2.json'] },
            ],
          },
        }),
      (err) => err.category === 'payload-conflict',
    );

    // 4. Adversarial historical reconstruction: duplicate actor A plus actor
    // B from a different action invocation is not a completed cohort for this
    // action key. It must refuse before any additional mutation.
    const originalEventLines = eventsAfterDispatch.trimEnd().split('\n').filter(Boolean);
    const worker1AssignmentEvent = originalEventLines.find((line) => {
      const parsed = JSON.parse(line);
      return parsed.type === 'assignment-created' && parsed.payload?.actorId === 'worker-1';
    });
    const worker2AssignmentEvent = originalEventLines.find((line) => {
      const parsed = JSON.parse(line);
      return parsed.type === 'assignment-created' && parsed.payload?.actorId === 'worker-2';
    });
    assert.ok(worker1AssignmentEvent && worker2AssignmentEvent);
    const worker2AssignmentId = JSON.parse(worker2AssignmentEvent).payload.assignmentId;
    const worker2AssignmentPath = path.join(tempDir, '.fgos/assignments', worker2AssignmentId, 'assignment.json');
    const foreignAssignment = JSON.parse(fs.readFileSync(worker2AssignmentPath, 'utf8'));
    foreignAssignment.provenance.inline.caller.coordination.actionInvocation.actionKey = 'sha256:foreign-invocation';
    fs.writeFileSync(worker2AssignmentPath, JSON.stringify(foreignAssignment));
    const duplicateAssignmentId = 'asgn_foreign_duplicate';
    const worker1AssignmentId = JSON.parse(worker1AssignmentEvent).payload.assignmentId;
    const duplicateAssignment = JSON.parse(fs.readFileSync(path.join(tempDir, '.fgos/assignments', worker1AssignmentId, 'assignment.json'), 'utf8'));
    duplicateAssignment.assignmentId = duplicateAssignmentId;
    fs.mkdirSync(path.join(tempDir, '.fgos/assignments', duplicateAssignmentId), { recursive: true });
    fs.writeFileSync(path.join(tempDir, '.fgos/assignments', duplicateAssignmentId, 'assignment.json'), JSON.stringify(duplicateAssignment));
    const adversarialManifest = JSON.parse(fs.readFileSync(path.join(sessionDir, 'session.json'), 'utf8'));
    adversarialManifest.assignmentRefs = [...(adversarialManifest.assignmentRefs ?? []), duplicateAssignmentId];
    fs.writeFileSync(path.join(sessionDir, 'session.json'), JSON.stringify(adversarialManifest));
    const duplicateEvent = JSON.parse(worker1AssignmentEvent);
    duplicateEvent.payload.assignmentId = duplicateAssignmentId;
    fs.writeFileSync(
      path.join(sessionDir, 'events.jsonl'),
      `${originalEventLines.join('\n')}\n${JSON.stringify(duplicateEvent)}\n`,
    );
    const adversarialEvents = fs.readFileSync(path.join(sessionDir, 'events.jsonl'), 'utf8');
    await assert.rejects(
      () => executeCoordinationActionUseCase(ctx, action),
      (err) => err.category === 'stale-action-key',
      'duplicate/foreign-invocation history must not reconstruct a completed fan-out',
    );
    assert.equal(fs.readFileSync(path.join(sessionDir, 'events.jsonl'), 'utf8'), adversarialEvents);

    // 5. Verify no .action-keys.json sidecar was created
    const sidecarPath = path.join(sessionDir, '.action-keys.json');
    assert.equal(fs.existsSync(sidecarPath), false);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('fail-loud: corrupt event log throws corrupt-log loudly instead of degrading silently (R2-07)', async () => {
  const coordinationId = 'coord_corrupt_log_fail_loud';
  const { tempDir, manifest, def, eventsPath } = setupSessionFixture(coordinationId, { schemaVersion: '3', eventCount: 0 });

  try {
    // Append corrupt non-JSON text to events log
    fs.appendFileSync(eventsPath, 'THIS IS NOT VALID JSON AND REPRESENTS A CORRUPTED LOG ENTRY\n');

    const ctx = { cwd: tempDir, repoRoot: tempDir };

    // 1. showCoordinationActionsUseCase must throw loudly with corrupt-log
    assert.throws(
      () => showCoordinationActionsUseCase(ctx, { id: coordinationId }),
      (err) => err.category === 'corrupt-log' || err.name === 'EventLogError',
      'showCoordinationActionsUseCase must not swallow corrupt-log',
    );

    // 2. executeCoordinationActionUseCase must also throw loudly with corrupt-log
    await assert.rejects(
      () =>
        executeCoordinationActionUseCase(ctx, {
          coordinationId,
          actionKey: 'sha256:dummy_key_for_corrupt_test',
          kind: 'dispatch-operation',
          writerId: 'driver-1',
          inputPayload: { objective: 'Test', expectedOutputs: ['out.json'] },
        }),
      (err) => err.category === 'corrupt-log' || err.name === 'EventLogError',
      'executeCoordinationActionUseCase must not swallow corrupt-log',
    );
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('durable retry after commit: production door recovers idempotently from authoritative log without sidecar across all action families', async () => {
  const coordinationId = 'coord_durable_retry_recovery';
  const { tempDir, manifest, def, sessionDir } = setupSessionFixture(coordinationId, { schemaVersion: '3', eventCount: 0 });

  try {
    const ctx = { cwd: tempDir, repoRoot: tempDir };

    // 1. Dispatch an operation and verify crash-after-commit idempotent retry
    const proj1 = projectCoordinationActions({ manifest, events: [], definition: def });
    const actionDispatch = proj1.actions.find((a) => a.kind === 'dispatch-operation');
    const dispatchPayload = { objective: 'Op 1', expectedOutputs: ['out.json'] };
    const resDispatch1 = await executeCoordinationActionUseCase(ctx, {
      ...actionDispatch,
      coordinationId,
      writerId: 'driver-1',
      inputPayload: dispatchPayload,
    });
    assert.equal(resDispatch1.status, 'dispatched');

    const eventsAfterDispatch = fs.readFileSync(path.join(sessionDir, 'events.jsonl'), 'utf8').trim().split('\n').filter(Boolean);
    const eventCount1 = eventsAfterDispatch.length;

    // Simulate crash after commit: client re-issues identical request
    const resDispatch2 = await executeCoordinationActionUseCase(ctx, {
      ...actionDispatch,
      coordinationId,
      writerId: 'driver-1',
      inputPayload: dispatchPayload,
    });
    assert.equal(resDispatch2.idempotent, true);
    assert.equal(resDispatch2.cached, true);
    assert.equal(resDispatch2.assignmentId, resDispatch1.assignmentId);

    // Assert zero duplicate events were appended
    const eventsAfterRetry1 = fs.readFileSync(path.join(sessionDir, 'events.jsonl'), 'utf8').trim().split('\n').filter(Boolean);
    assert.equal(eventsAfterRetry1.length, eventCount1, 'Event log length must not increase on retry');

    // 2. Record human turn and verify crash-after-commit idempotent retry
    const artifactFile = path.join(tempDir, 'human-note.md');
    fs.writeFileSync(artifactFile, 'Human feedback notes');
    const proj2 = projectCoordinationActions({ manifest, events: eventsAfterRetry1.map((l) => JSON.parse(l)), definition: def });
    const actionHuman = proj2.actions.find((a) => a.kind === 'record-human-turn');
    const humanPayload = {
      turnId: 'turn-durable-1',
      turnOrdinal: 1,
      channel: 'cli',
      artifactRef: artifactFile,
      externalRef: 'ext-durable-1',
      attributedTo: { type: 'person', id: 'human-driver' },
    };
    const resHuman1 = await executeCoordinationActionUseCase(ctx, {
      ...actionHuman,
      coordinationId,
      writerId: 'driver-1',
      inputPayload: humanPayload,
    });
    assert.equal(resHuman1.turnId, 'turn-durable-1');

    const eventsAfterHuman = fs.readFileSync(path.join(sessionDir, 'events.jsonl'), 'utf8').trim().split('\n').filter(Boolean);
    const eventCount2 = eventsAfterHuman.length;

    // Simulate crash after commit: client re-issues identical request
    const resHuman2 = await executeCoordinationActionUseCase(ctx, {
      ...actionHuman,
      coordinationId,
      writerId: 'driver-1',
      inputPayload: humanPayload,
    });
    assert.equal(resHuman2.idempotent, true);
    assert.equal(resHuman2.cached, true);
    assert.equal(resHuman2.turnId, 'turn-durable-1');

    const eventsAfterRetry2 = fs.readFileSync(path.join(sessionDir, 'events.jsonl'), 'utf8').trim().split('\n').filter(Boolean);
    assert.equal(eventsAfterRetry2.length, eventCount2, 'Event log length must not increase on retry');

    // 3. Confirm sidecar file was never created across any retry
    const sidecarPath = path.join(sessionDir, '.action-keys.json');
    assert.equal(fs.existsSync(sidecarPath), false, 'Authoritative recovery must never use .action-keys.json sidecar');
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});
