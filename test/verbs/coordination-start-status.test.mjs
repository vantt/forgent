import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { startCoordinationUseCase } from '../../src/verbs/coordination/start.mjs';
import { showCoordinationStatusUseCase } from '../../src/verbs/coordination/status.mjs';
import { CoordinationError } from '../../src/runner/coordination/schema.mjs';
import { StoreError } from '../../src/state/store.mjs';

function makeTempCtx() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-start-status-test-'));
  const fgosDir = path.join(tmpDir, '.fgos');
  fs.mkdirSync(fgosDir, { recursive: true });

  const fakeExec = path.join(tmpDir, 'fake-exec.mjs');
  fs.writeFileSync(fakeExec, `
    import fs from 'node:fs';
    import path from 'node:path';
    const assignmentsRoot = path.join(process.cwd(), '.fgos', 'assignments');
    if (fs.existsSync(assignmentsRoot)) {
      for (const asgn of fs.readdirSync(assignmentsRoot)) {
        const runDir = path.join(assignmentsRoot, asgn, 'runs', '01');
        if (fs.existsSync(runDir) && !fs.existsSync(path.join(runDir, 'agent-result.json'))) {
          fs.writeFileSync(path.join(runDir, 'agent-result.json'), JSON.stringify({ status: 'done', summary: 'Done.' }));
        }
      }
    }
    process.exit(0);
  `);

  const configFile = path.join(fgosDir, 'config.json');
  fs.writeFileSync(configFile, JSON.stringify({
    runner: {
      executor: { allowCrossProvider: true, command: process.execPath, args: [fakeExec, '{prompt}'] },
      models: { standard: 'test-model', nano: 'test-model' },
      timeoutMs: 20000,
    },
  }, null, 2));

  return {
    cwd: tmpDir,
    repoRoot: tmpDir,
    packageRoot: process.cwd(),
    cleanup: () => {
      try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
    },
  };
}

test('Unit 2B: startCoordinationUseCase starts declared-protocol and returns statusDoor', async () => {
  const ctx = makeTempCtx();
  try {
    const result = await startCoordinationUseCase(ctx, {
      kind: 'declared-protocol',
      coordinationId: 'coord_start_test1',
      writerId: 'driver-alice',
      objective: 'Review RFC proposal',
      protocolId: 'core.coordination-protocol.group-thinking-rfc-review-lite',
      steps: [
        {
          as: 'propose',
          type: 'operation',
          operationId: 'propose',
          objective: 'Author proposal',
          expectedOutputs: ['proposal.md'],
        },
      ],
    });

    assert.equal(result.coordinationId, 'coord_start_test1');
    assert.equal(result.kind, 'declared-protocol');
    assert.equal(result.status, 'running');
    assert.equal(result.steps.length, 1);
    assert.equal(result.statusDoor, 'fgos coordination status coord_start_test1');

    // Verify session remains active (does not auto-close)
    const status = showCoordinationStatusUseCase(ctx, { id: 'coord_start_test1' });
    assert.equal(status.session.status, 'active');
    assert.equal(status.contractVersion, 'coordination-actions.v1');
    assert.ok(Array.isArray(status.actions));
  } finally {
    ctx.cleanup();
  }
});

test('Unit 2B: startCoordinationUseCase enforces idempotent resume and payload-conflict rejection', async () => {
  const ctx = makeTempCtx();
  try {
    const startParams = {
      kind: 'declared-protocol',
      coordinationId: 'coord_start_idemp',
      writerId: 'driver-alice',
      objective: 'Consistent objective',
      protocolId: 'core.coordination-protocol.group-thinking-rfc-review-lite',
      steps: [
        {
          as: 'propose',
          type: 'operation',
          operationId: 'propose',
          objective: 'Author proposal',
          expectedOutputs: ['proposal.md'],
        },
      ],
    };

    // 1. Initial start
    const first = await startCoordinationUseCase(ctx, startParams);
    assert.equal(first.coordinationId, 'coord_start_idemp');

    // 2. Same id and same payload resumes cleanly
    const resumed = await startCoordinationUseCase(ctx, {
      ...startParams,
      // steps can be empty on resume
      steps: [
        {
          as: 'propose',
          type: 'operation',
          operationId: 'propose',
          objective: 'Author proposal',
          expectedOutputs: ['proposal.md'],
        },
      ],
    });
    assert.equal(resumed.coordinationId, 'coord_start_idemp');
    assert.equal(resumed.idempotent, true);

    const eventsPath = path.join(ctx.cwd, '.fgos/coordination/sessions/coord_start_idemp/events.jsonl');
    const getEventCount = () => fs.readFileSync(eventsPath, 'utf8').trim().split('\n').filter(Boolean).length;
    const assignmentsDir = path.join(ctx.cwd, '.fgos/assignments');
    const getAssignmentCount = () => fs.existsSync(assignmentsDir) ? fs.readdirSync(assignmentsDir).length : 0;

    const baseEventCount = getEventCount();
    const baseAssignmentCount = getAssignmentCount();

    // 3. Same id with different objective conflicts
    await assert.rejects(
      () => startCoordinationUseCase(ctx, {
        ...startParams,
        objective: 'Completely different objective',
      }),
      (err) => err instanceof CoordinationError && err.category === 'payload-conflict' && err.message.includes('different objective'),
    );
    assert.equal(getEventCount(), baseEventCount);
    assert.equal(getAssignmentCount(), baseAssignmentCount);

    // 4. Same id with different protocol conflicts
    await assert.rejects(
      () => startCoordinationUseCase(ctx, {
        ...startParams,
        protocolId: 'core.coordination-protocol.group-thinking-delphi-feedback-lite',
      }),
      (err) => err instanceof CoordinationError && err.category === 'payload-conflict' && err.message.includes('cannot start with'),
    );
    assert.equal(getEventCount(), baseEventCount);
    assert.equal(getAssignmentCount(), baseAssignmentCount);

    // 5. Same id with unauthorized foreign writerId
    await assert.rejects(
      () => startCoordinationUseCase(ctx, {
        ...startParams,
        writerId: 'foreign-driver',
      }),
      (err) => err instanceof CoordinationError && err.category === 'unauthorized' && err.message.includes('does not match driver identity'),
    );
    assert.equal(getEventCount(), baseEventCount);
    assert.equal(getAssignmentCount(), baseAssignmentCount);

    // 6. Same id with different workRef conflicts
    await assert.rejects(
      () => startCoordinationUseCase(ctx, {
        ...startParams,
        workRef: 'work-other',
      }),
      (err) => err instanceof CoordinationError && err.category === 'payload-conflict' && err.message.includes('workRef'),
    );
    assert.equal(getEventCount(), baseEventCount);
    assert.equal(getAssignmentCount(), baseAssignmentCount);

    // 7. Same id with different aggregateBounds conflicts
    await assert.rejects(
      () => startCoordinationUseCase(ctx, {
        ...startParams,
        aggregateBounds: { maxAssignments: 10 },
      }),
      (err) => err instanceof CoordinationError && err.category === 'payload-conflict' && err.message.includes('aggregateBounds'),
    );
    assert.equal(getEventCount(), baseEventCount);
    assert.equal(getAssignmentCount(), baseAssignmentCount);

    // 8. Same id with different partialPolicy conflicts
    await assert.rejects(
      () => startCoordinationUseCase(ctx, {
        ...startParams,
        partialPolicy: { allowedOmissions: ['specialist'] },
      }),
      (err) => err instanceof CoordinationError && err.category === 'payload-conflict' && err.message.includes('partialPolicy'),
    );
    assert.equal(getEventCount(), baseEventCount);
    assert.equal(getAssignmentCount(), baseAssignmentCount);

    // 9. Same id with different actors conflicts
    await assert.rejects(
      () => startCoordinationUseCase(ctx, {
        ...startParams,
        actors: [{ id: 'proposer', persona: 'custom-persona' }],
      }),
      (err) => err instanceof CoordinationError && err.category === 'payload-conflict' && err.message.includes('actors'),
    );
    assert.equal(getEventCount(), baseEventCount);
    assert.equal(getAssignmentCount(), baseAssignmentCount);

    // 10. Same id with different initial steps conflicts
    await assert.rejects(
      () => startCoordinationUseCase(ctx, {
        ...startParams,
        steps: [
          {
            as: 'different-step',
            type: 'operation',
            operationId: 'conflicting-operation',
            objective: 'Conflicting',
            expectedOutputs: ['out.md'],
          },
        ],
      }),
      (err) => err instanceof CoordinationError && err.category === 'payload-conflict' && err.message.includes('initial steps'),
    );
    assert.equal(getEventCount(), baseEventCount);
    assert.equal(getAssignmentCount(), baseAssignmentCount);
  } finally {
    ctx.cleanup();
  }
});

test('Unit 2B: public start example runs without explicit ID and derives deterministic ID', async () => {
  const ctx = makeTempCtx();
  try {
    // Exactly matches the public registry example:
    // fgos coordination start --protocol core.coordination-protocol.group-thinking-rfc-review-lite --objective "Plan feature" --writer-id driver-1
    const res = await startCoordinationUseCase(ctx, {
      protocol: 'core.coordination-protocol.group-thinking-rfc-review-lite',
      objective: 'Plan feature',
      writerId: 'driver-1',
    });

    assert.ok(res.coordinationId, 'coordinationId must be derived');
    assert.ok(res.coordinationId.startsWith('coord_'), 'coordinationId must have coord_ prefix');
    assert.equal(res.kind, 'declared-protocol');
    assert.equal(res.status, 'running');

    // Retrying the exact same start call without explicit ID resumes idempotently
    const retryRes = await startCoordinationUseCase(ctx, {
      protocol: 'core.coordination-protocol.group-thinking-rfc-review-lite',
      objective: 'Plan feature',
      writerId: 'driver-1',
    });

    assert.equal(retryRes.coordinationId, res.coordinationId);
    assert.equal(retryRes.idempotent, true);
    assert.equal(retryRes.cached, true);
  } finally {
    ctx.cleanup();
  }
});

test('Unit 2B: showCoordinationStatusUseCase provides compact default and detail/replay views', async () => {
  const ctx = makeTempCtx();
  try {
    await startCoordinationUseCase(ctx, {
      kind: 'declared-protocol',
      coordinationId: 'coord_status_test',
      writerId: 'driver-bob',
      objective: 'Review proposal',
      protocolId: 'core.coordination-protocol.group-thinking-rfc-review-lite',
      steps: [
        {
          as: 'propose',
          type: 'operation',
          operationId: 'propose',
          objective: 'Author proposal',
          expectedOutputs: ['proposal.md'],
        },
      ],
    });

    // 1. Compact default view
    const compact = showCoordinationStatusUseCase(ctx, { id: 'coord_status_test' });
    assert.equal(compact.contractVersion, 'coordination-actions.v1');
    assert.equal(compact.coordinationId, 'coord_status_test');
    assert.equal(compact.session.status, 'active');
    assert.ok(Array.isArray(compact.blockers));
    assert.ok(Array.isArray(compact.actions));
    assert.equal(compact.snapshot, undefined, 'compact default must not include snapshot');
    assert.equal(compact.facts, undefined, 'compact default must not include facts');
    assert.equal(compact.replay, undefined, 'compact default must not include replay');

    // 2. Detail view
    const detailed = showCoordinationStatusUseCase(ctx, { id: 'coord_status_test', detail: true });
    assert.ok(detailed.snapshot, 'detail view must include snapshot');
    assert.ok(detailed.facts, 'detail view must include facts');
    assert.equal(detailed.replay, undefined);

    // 3. Replay view
    const withReplay = showCoordinationStatusUseCase(ctx, { id: 'coord_status_test', replay: true });
    assert.ok(withReplay.replay, 'replay view must include replay');

    // 4. Non-existent session
    assert.throws(
      () => showCoordinationStatusUseCase(ctx, { id: 'non_existent_session' }),
      (err) => err instanceof StoreError && err.category === 'validation' && err.message.includes('no session'),
    );
  } finally {
    ctx.cleanup();
  }
});

test('Unit 2B: startCoordinationUseCase enforces agent-led task idempotency and conflict rejection', async () => {
  const ctx = makeTempCtx();
  try {
    const alParams = {
      kind: 'agent-led',
      coordinationId: 'coord_start_al_conf',
      writerId: 'driver-alice',
      objective: 'Run agent-led research',
      primaryRole: 'researcher',
      task: {
        taskKey: 'task-primary-1',
        expectedOutputs: ['out.md'],
        evidenceRequired: 'reported',
      },
    };

    const first = await startCoordinationUseCase(ctx, alParams);
    assert.equal(first.coordinationId, 'coord_start_al_conf');

    // Idempotent resume
    const resumed = await startCoordinationUseCase(ctx, alParams);
    assert.equal(resumed.coordinationId, 'coord_start_al_conf');
    assert.equal(resumed.idempotent, true);

    // Conflicting taskKey
    await assert.rejects(
      () => startCoordinationUseCase(ctx, {
        ...alParams,
        task: {
          taskKey: 'task-different-key',
          expectedOutputs: ['out.md'],
          evidenceRequired: 'reported',
        },
      }),
      (err) => err instanceof CoordinationError && err.category === 'payload-conflict' && err.message.includes('taskKey'),
    );

    // Conflicting expectedOutputs
    await assert.rejects(
      () => startCoordinationUseCase(ctx, {
        ...alParams,
        task: {
          taskKey: 'task-primary-1',
          expectedOutputs: ['conflicting.md'],
          evidenceRequired: 'reported',
        },
      }),
      (err) => err instanceof CoordinationError && err.category === 'payload-conflict' && err.message.includes('expectedOutputs'),
    );
  } finally {
    ctx.cleanup();
  }
});
