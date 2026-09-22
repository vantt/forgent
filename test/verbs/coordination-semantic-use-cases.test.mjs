// test/verbs/coordination-semantic-use-cases.test.mjs — tests for Unit 2C semantic use cases.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  startCoordinationUseCase,
} from '../../src/verbs/coordination/start.mjs';
import {
  showCoordinationStatusUseCase,
} from '../../src/verbs/coordination/status.mjs';
import { cleanCoordinationUseCase } from '../../src/verbs/coordination/clean.mjs';
import { inspectCoordinationUseCase } from '../../src/verbs/coordination/inspect.mjs';
import {
  showCoordinationActionsUseCase,
  executeOperationUseCase,
  executeAuthorizeAndDispatchUseCase,
  executeFanOutUseCase,
  executeContributionUseCase,
  executeHumanTurnUseCase,
  executeDispositionUseCase,
  executeCloseUseCase,
} from '../../src/verbs/coordination/actions.mjs';
import { CoordinationError } from '../../src/runner/coordination/schema.mjs';
import { StoreError } from '../../src/state/store.mjs';

const PROTOCOL_ID = 'test.coordination-protocol.semantic-use-cases';

function mkTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-semantic-test-'));
}

function writeFixture(tempDir) {
  const dir = path.join(tempDir, '.fgos', 'coordination-protocols');
  fs.mkdirSync(dir, { recursive: true });
  const advisory = { kind: 'advisory', evidenceRequired: 'reported' };
  const workProduct = { kind: 'work-product', evidenceRequired: 'reported' };
  const definition = {
    apiVersion: 'fgos.dev/v1alpha1',
    kind: 'FlowDefinition',
    metadata: { id: PROTOCOL_ID, version: '1.0.0' },
    spec: {
      profile: { kind: 'CoordinationProtocol' },
      roles: ['doer', 'reviewer', 'specialist'],
      actors: [
        { id: 'primary-doer', role: 'doer' },
        { id: 'peer-reviewer', role: 'reviewer' },
        { id: 'domain-specialist', role: 'specialist' },
      ],
      operations: [
        { id: 'draft-plan', role: 'doer', result: workProduct },
        { id: 'review-plan', role: 'reviewer', result: advisory },
        { id: 'consult-specialist', role: 'specialist', result: advisory },
      ],
      graph: {
        entry: 'phase-draft',
        nodes: [
          {
            id: 'phase-draft',
            operations: [{ ref: 'draft-plan', actor: 'primary-doer' }],
            transitions: ['phase-review'],
          },
          {
            id: 'phase-review',
            operations: [
              { ref: 'review-plan', actor: 'peer-reviewer' },
              { ref: 'consult-specialist', actor: 'domain-specialist', activation: { mode: 'driver-authorized' } },
            ],
            transitions: [],
          },
        ],
      },
    },
  };
  fs.writeFileSync(path.join(dir, 'semantic-fixture.json'), `${JSON.stringify(definition, null, 2)}\n`);
}

function fakeExecutor(tempDir) {
  const executorScript = path.join(tempDir, 'fake-executor.mjs');
  fs.writeFileSync(
    executorScript,
    `
    import fs from 'node:fs';
    import path from 'node:path';
    const assignmentsRoot = path.join(process.cwd(), '.fgos', 'assignments');
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
    process.stdout.write('Done.\\n');
    process.exit(0);
    `,
  );
  return {
    executor: { allowCrossProvider: true, command: process.execPath, args: [executorScript, '{prompt}'] },
    models: { standard: 'test-model', nano: 'test-model', mini: 'test-model', advanced: 'test-model', flagship: 'test-model', frontier: 'test-model' },
    timeoutMs: 10000,
  };
}

test('Unit 2C: executeOperationUseCase executes projected operation and enforces input boundaries', async () => {
  const tempDir = mkTempDir();
  writeFixture(tempDir);
  const runnerConfig = fakeExecutor(tempDir);
  const ctx = { cwd: tempDir, repoRoot: tempDir, runnerConfig };

  const startResult = await startCoordinationUseCase(ctx, {
    kind: 'declared-protocol',
    protocolId: PROTOCOL_ID,
    coordinationId: 'coord_sem_op_1',
    writerId: 'driver_alice',
    objective: 'Test semantic operation execution',
  });
  assert.equal(startResult.status, 'running');

  // Load projected actions — draft-plan ran at entry node during start, so review-plan is projected
  const actionsRes = showCoordinationActionsUseCase(ctx, { id: 'coord_sem_op_1' });
  const opAction = actionsRes.actions.find((a) => a.kind === 'dispatch-operation' && a.target.operationId === 'review-plan');
  assert.ok(opAction, 'must project dispatch-operation for review-plan');

  // 1. Validation: caller forbidden override (actorId)
  await assert.rejects(
    async () => {
      await executeOperationUseCase(ctx, {
        id: 'coord_sem_op_1',
        actionKey: opAction.actionKey,
        writerId: 'driver_alice',
        objective: 'Execute draft',
        expectedOutputs: ['agent-result.json'],
        actorId: 'rogue-actor',
      });
    },
    (err) => err instanceof CoordinationError && err.message.includes('actorId') && err.message.includes('cannot be provided by caller'),
  );

  // 2. Validation: missing required expectedOutputs
  await assert.rejects(
    async () => {
      await executeOperationUseCase(ctx, {
        id: 'coord_sem_op_1',
        actionKey: opAction.actionKey,
        writerId: 'driver_alice',
        objective: 'Execute draft',
      });
    },
    (err) => err instanceof CoordinationError && err.message.includes('expectedOutputs'),
  );

  // 3. Validation: writerId mismatch (not session driver)
  await assert.rejects(
    async () => {
      await executeOperationUseCase(ctx, {
        id: 'coord_sem_op_1',
        actionKey: opAction.actionKey,
        writerId: 'driver_bob',
        objective: 'Execute draft',
        expectedOutputs: ['agent-result.json'],
      });
    },
    (err) => err instanceof CoordinationError && err.category === 'unauthorized',
  );

  // 4. Positive execution
  const execResult = await executeOperationUseCase(ctx, {
    id: 'coord_sem_op_1',
    actionKey: opAction.actionKey,
    writerId: 'driver_alice',
    objective: 'Draft the initial plan',
    expectedOutputs: ['agent-result.json'],
  });
  assert.equal(execResult.coordinationId, 'coord_sem_op_1');
  assert.equal(execResult.status, 'dispatched');

  // 5. Idempotent retry with identical payload returns existing result
  const retryResult = await executeOperationUseCase(ctx, {
    id: 'coord_sem_op_1',
    actionKey: opAction.actionKey,
    writerId: 'driver_alice',
    objective: 'Draft the initial plan',
    expectedOutputs: ['agent-result.json'],
  });
  assert.equal(retryResult.coordinationId, 'coord_sem_op_1');
  assert.equal(retryResult.status, 'dispatched');

  // 6. Same actionKey with different payload fails with payload-conflict
  await assert.rejects(
    async () => {
      await executeOperationUseCase(ctx, {
        id: 'coord_sem_op_1',
        actionKey: opAction.actionKey,
        writerId: 'driver_alice',
        objective: 'Different objective on same action key',
        expectedOutputs: ['agent-result.json'],
      });
    },
    (err) => err instanceof CoordinationError && err.category === 'payload-conflict',
  );
});

test('Unit 2C: executeAuthorizeAndDispatchUseCase executes driver-authorized operation', async () => {
  const tempDir = mkTempDir();
  writeFixture(tempDir);
  const runnerConfig = fakeExecutor(tempDir);
  const ctx = { cwd: tempDir, repoRoot: tempDir, runnerConfig };

  await startCoordinationUseCase(ctx, {
    kind: 'declared-protocol',
    protocolId: PROTOCOL_ID,
    coordinationId: 'coord_sem_auth_1',
    writerId: 'driver_alice',
    objective: 'Test authorize and dispatch',
  });

  // Execute required draft-plan first so we advance to phase-review
  const actions1 = showCoordinationActionsUseCase(ctx, { id: 'coord_sem_auth_1' });
  const draftOp = actions1.actions.find((a) => a.kind === 'dispatch-operation');
  await executeOperationUseCase(ctx, {
    id: 'coord_sem_auth_1',
    actionKey: draftOp.actionKey,
    writerId: 'driver_alice',
    objective: 'Execute draft',
    expectedOutputs: ['agent-result.json'],
  });

  // Now in phase-review, consult-specialist should be projected as authorize-and-dispatch
  const actions2 = showCoordinationActionsUseCase(ctx, { id: 'coord_sem_auth_1' });
  const authAction = actions2.actions.find((a) => a.kind === 'authorize-and-dispatch' && a.target.operationId === 'consult-specialist');
  assert.ok(authAction, 'must project authorize-and-dispatch for consult-specialist');

  // Validation: forbidden override (nodeId)
  await assert.rejects(
    async () => {
      await executeAuthorizeAndDispatchUseCase(ctx, {
        id: 'coord_sem_auth_1',
        actionKey: authAction.actionKey,
        writerId: 'driver_alice',
        objective: 'Consult specialist',
        reason: 'Specialist advice needed',
        nodeId: 'override-node',
      });
    },
    (err) => err instanceof CoordinationError && err.message.includes('nodeId'),
  );

  // Positive execution
  const authResult = await executeAuthorizeAndDispatchUseCase(ctx, {
    id: 'coord_sem_auth_1',
    actionKey: authAction.actionKey,
    writerId: 'driver_alice',
    objective: 'Consult domain specialist on security',
    reason: 'Validate cryptographic choices',
    expectedOutputs: ['agent-result.json'],
  });
  assert.equal(authResult.coordinationId, 'coord_sem_auth_1');
  assert.equal(authResult.status, 'dispatched');
  assert.ok(authResult.authorizationId, 'returns authorizationId');
});

test('Unit 2C: executeHumanTurnUseCase records verified person-attributed turn', async () => {
  const tempDir = mkTempDir();
  writeFixture(tempDir);
  const runnerConfig = fakeExecutor(tempDir);
  const ctx = { cwd: tempDir, repoRoot: tempDir, runnerConfig };

  await startCoordinationUseCase(ctx, {
    kind: 'declared-protocol',
    protocolId: PROTOCOL_ID,
    coordinationId: 'coord_sem_ht_1',
    writerId: 'driver_alice',
    objective: 'Test human turn execution',
  });

  const actions = showCoordinationActionsUseCase(ctx, { id: 'coord_sem_ht_1' });
  const htAction = actions.actions.find((a) => a.kind === 'record-human-turn');
  assert.ok(htAction, 'must project record-human-turn');

  // Create a real artifact file inside the workspace
  const artifactRelative = 'human-input.md';
  fs.writeFileSync(path.join(tempDir, artifactRelative), '# Human Input\nLGTM with minor comments.\n');

  // 1. Validation: out-of-workspace artifactRef rejected
  await assert.rejects(
    async () => {
      await executeHumanTurnUseCase(ctx, {
        id: 'coord_sem_ht_1',
        actionKey: htAction.actionKey,
        writerId: 'driver_alice',
        turnId: 'turn_001',
        turnOrdinal: 1,
        channel: 'cli',
        artifactRef: '../../../../etc/passwd',
        externalRef: 'ext_ref_1',
        attributedTo: 'human-operator',
      });
    },
    (err) => err instanceof StoreError && err.category === 'validation',
  );

  // 2. Positive execution
  const htResult = await executeHumanTurnUseCase(ctx, {
    id: 'coord_sem_ht_1',
    actionKey: htAction.actionKey,
    writerId: 'driver_alice',
    turnId: 'turn_001',
    turnOrdinal: 1,
    channel: 'cli',
    artifactRef: artifactRelative,
    externalRef: 'ext_ref_1',
    attributedTo: 'human-operator',
  });
  assert.equal(htResult.coordinationId, 'coord_sem_ht_1');
  assert.equal(htResult.status, 'recorded');
  assert.equal(htResult.turnId, 'turn_001');
  assert.ok(htResult.revision?.startsWith('sha256:'));
});

test('Unit 2C: executeCloseUseCase enforces validation and quorum gate', async () => {
  const tempDir = mkTempDir();
  writeFixture(tempDir);
  const runnerConfig = fakeExecutor(tempDir);
  const ctx = { cwd: tempDir, repoRoot: tempDir, runnerConfig };

  await startCoordinationUseCase(ctx, {
    kind: 'declared-protocol',
    protocolId: PROTOCOL_ID,
    coordinationId: 'coord_sem_close_1',
    writerId: 'driver_alice',
    objective: 'Test close use case',
  });

  // Validation: forbidden override (status)
  await assert.rejects(
    async () => {
      await executeCloseUseCase(ctx, {
        id: 'coord_sem_close_1',
        actionKey: 'sha256:' + 'a'.repeat(64),
        writerId: 'driver_alice',
        status: 'forced-closed',
      });
    },
    (err) => err instanceof CoordinationError && err.message.includes('status'),
  );

  // Validation: missing actionKey
  await assert.rejects(
    async () => {
      await executeCloseUseCase(ctx, {
        id: 'coord_sem_close_1',
        writerId: 'driver_alice',
      });
    },
    (err) => err instanceof CoordinationError && err.message.includes('actionKey'),
  );

  // Validation: missing writerId / authorizedBy
  await assert.rejects(
    async () => {
      await executeCloseUseCase(ctx, {
        id: 'coord_sem_close_1',
        actionKey: 'sha256:' + 'a'.repeat(64),
      });
    },
    (err) => err instanceof CoordinationError && err.message.includes('writerId'),
  );
});

test('Unit 2C: input validation catches forbidden overrides on all semantic use cases', async () => {
  const ctx = { cwd: '/tmp', repoRoot: '/tmp' };

  // executeFanOutUseCase requires branches
  await assert.rejects(
    async () => {
      await executeFanOutUseCase(ctx, {
        id: 'coord_1',
        actionKey: 'sha256:' + 'a'.repeat(64),
        writerId: 'driver_alice',
        branches: [],
      });
    },
    (err) => err instanceof CoordinationError && err.message.includes('branches'),
  );

  // executeContributionUseCase requires contributionType and roundKey
  await assert.rejects(
    async () => {
      await executeContributionUseCase(ctx, {
        id: 'coord_1',
        actionKey: 'sha256:' + 'a'.repeat(64),
        writerId: 'driver_alice',
      });
    },
    (err) => err instanceof CoordinationError && err.message.includes('contributionType'),
  );

  // executeDispositionUseCase requires disposition and rationale
  await assert.rejects(
    async () => {
      await executeDispositionUseCase(ctx, {
        id: 'coord_1',
        actionKey: 'sha256:' + 'a'.repeat(64),
        writerId: 'driver_alice',
      });
    },
    (err) => err instanceof CoordinationError && err.message.includes('disposition'),
  );
});

test('Unit 2D: cleanCoordinationUseCase and inspectCoordinationUseCase semantics', async () => {
  const tempDir = mkTempDir();
  writeFixture(tempDir);
  const ctx = { cwd: tempDir, repoRoot: tempDir };

  // 1. inspect requires id
  assert.throws(
    () => inspectCoordinationUseCase(ctx, {}),
    (err) => err instanceof StoreError && err.message.includes('id'),
  );

  // 2. clean on empty store
  const cleanEmpty = cleanCoordinationUseCase(ctx);
  assert.equal(cleanEmpty.ok, true);
  assert.equal(cleanEmpty.cleaned, true);
  assert.equal(cleanEmpty.scannedSessions, 0);

  // 3. clean on non-existent session throws StoreError
  assert.throws(
    () => cleanCoordinationUseCase(ctx, { id: 'coord_nonexistent' }),
    (err) => err instanceof StoreError && err.message.includes('not found'),
  );

  // 4. start a session
  const startResult = await startCoordinationUseCase(ctx, {
    kind: 'declared-protocol',
    protocolId: PROTOCOL_ID,
    coordinationId: 'coord_clean_inspect_1',
    writerId: 'driver_alice',
    objective: 'Test clean and inspect semantics',
  });
  assert.equal(startResult.coordinationId, 'coord_clean_inspect_1');

  // 5. inspect active session
  const inspectResult = inspectCoordinationUseCase(ctx, { id: 'coord_clean_inspect_1' });
  assert.equal(inspectResult.ok, true);
  assert.equal(inspectResult.operationId, 'coordination.inspect');
  assert.equal(inspectResult.effect, 'read');
  assert.equal(inspectResult.coordinationId, 'coord_clean_inspect_1');
  assert.equal(inspectResult.status, 'active');
  assert.equal(inspectResult.session.status, 'active');
  assert.ok(inspectResult.snapshot?.digest);
  assert.ok(Array.isArray(inspectResult.actions));

  // 6. clean active session without force: safe no-op
  const cleanActive = cleanCoordinationUseCase(ctx, { id: 'coord_clean_inspect_1' });
  assert.equal(cleanActive.ok, true);
  assert.equal(cleanActive.coordinationId, 'coord_clean_inspect_1');
  assert.equal(cleanActive.cleaned, false);
  assert.match(cleanActive.message, /safe no-op/);

  // 7. clean active session with force
  const cleanForce = cleanCoordinationUseCase(ctx, { id: 'coord_clean_inspect_1', force: true });
  assert.equal(cleanForce.ok, true);
  assert.equal(cleanForce.coordinationId, 'coord_clean_inspect_1');
  assert.equal(cleanForce.cleaned, true);
});
