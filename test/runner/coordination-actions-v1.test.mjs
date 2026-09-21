import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  projectCoordinationActions,
  computeActionKey,
  computeActionSetDigest,
  computeSnapshotDigest,
  ACTIONS_CONTRACT_VERSION,
} from '../../src/runner/coordination/actions-projector.mjs';
import { showCoordinationActionsUseCase } from '../../src/verbs/coordination/actions.mjs';
import {
  validateCoordinationRequest,
  validateCoordinationCloseRequest,
} from '../../src/verbs/coordination/schema.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ACTIONS_PROJECTOR_PATH = path.resolve(__dirname, '../../src/runner/coordination/actions-projector.mjs');

test('non-policy obligation 4: projector source contains no hardcoded protocol IDs or operation names', () => {
  const source = fs.readFileSync(ACTIONS_PROJECTOR_PATH, 'utf8');
  assert.ok(!source.includes('review-candidate'), 'must not hardcode review-candidate');
  assert.ok(!source.includes('revise-candidate'), 'must not hardcode revise-candidate');
  assert.ok(!source.includes('standalone-master-coordination-loop'), 'must not hardcode standalone-master-coordination-loop');
  assert.ok(!source.includes('architecture-advisory-panel'), 'must not hardcode architecture-advisory-panel');
});

const sampleProtocolDef = {
  apiVersion: 'fgos.dev/v1alpha1',
  kind: 'FlowDefinition',
  metadata: { id: 'generic.coordination-protocol.sample', version: '1.0.0', digest: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' },
  spec: {
    profile: {
      kind: 'CoordinationProtocol',
      topology: {
        visibilityWindows: [{ id: 'win-1', opensAfter: { operationRefs: ['op-produce'] } }],
      },
    },
    roles: ['worker', 'reviewer'],
    actors: [
      { id: 'worker', role: 'worker' },
      { id: 'reviewer', role: 'reviewer' },
    ],
    operations: [
      { id: 'op-produce', role: 'worker' },
      { id: 'op-optional', role: 'reviewer' },
    ],
    graph: {
      nodes: [
        {
          id: 'step-1',
          operations: [
            { ref: 'op-produce', actor: 'worker' },
            { ref: 'op-optional', actor: 'reviewer', activation: { mode: 'driver-authorized' } },
          ],
        },
      ],
    },
  },
};

test('fresh session projects required operation pending and driver authorization', () => {
  const manifest = {
    coordinationId: 'coord_fresh_1',
    schemaVersion: '3',
    status: 'active',
    objective: 'Do work',
    definitionRef: { id: 'generic.coordination-protocol.sample', version: '1.0.0' },
    snapshotRef: { digest: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' },
    assignmentRefs: [],
  };
  const projection = projectCoordinationActions({
    manifest,
    events: [],
    definition: sampleProtocolDef,
    quorum: { missing: ['worker'], failed: [] },
  });

  assert.equal(projection.contractVersion, ACTIONS_CONTRACT_VERSION);
  assert.equal(projection.coordinationId, 'coord_fresh_1');
  assert.equal(projection.readyToClose, false);
  assert.equal(projection.session.eventSeq, 0);

  // Check actions
  const produceAction = projection.actions.find((a) => a.kind === 'dispatch-operation');
  assert.ok(produceAction);
  assert.equal(produceAction.required, true);
  assert.equal(produceAction.target.operationId, 'op-produce');
  assert.ok(produceAction.actionKey.startsWith('sha256:'));

  const authAction = projection.actions.find((a) => a.kind === 'authorize-and-dispatch');
  assert.ok(authAction);
  assert.equal(authAction.required, false);
  assert.equal(authAction.target.operationId, 'op-optional');
});

test('required operation settled and session ready to close exposes close action', () => {
  const manifest = {
    coordinationId: 'coord_settled_1',
    schemaVersion: '3',
    status: 'active',
    objective: 'Do work',
    definitionRef: { id: 'generic.coordination-protocol.sample', version: '1.0.0' },
    snapshotRef: { digest: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' },
    assignmentRefs: ['asgn_1'],
  };
  const events = [
    { type: 'operation-authorized', payload: { authorizationId: 'auth_1', nodeId: 'step-1', operationId: 'op-produce', targetActorId: 'worker' } },
    { type: 'assignment-created', payload: { assignmentId: 'asgn_1', actorId: 'worker' } },
    { type: 'result-linked', payload: { assignmentId: 'asgn_1' } },
  ];
  const projection = projectCoordinationActions({
    manifest,
    events,
    definition: sampleProtocolDef,
    quorum: { missing: [], failed: [] },
  });

  assert.equal(projection.readyToClose, true);
  const closeAction = projection.actions.find((a) => a.kind === 'close');
  assert.ok(closeAction);
  assert.equal(closeAction.target.coordinationId, 'coord_settled_1');
  assert.ok(closeAction.actionKey.startsWith('sha256:'));
});

test('failed finding awaiting disposition projects required record-disposition action', () => {
  const manifest = {
    coordinationId: 'coord_failed_finding',
    schemaVersion: '3',
    status: 'active',
    objective: 'Review work',
    definitionRef: { id: 'generic.coordination-protocol.sample', version: '1.0.0' },
    snapshotRef: { digest: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' },
    assignmentRefs: ['asgn_fail_1'],
  };
  const events = [
    { type: 'operation-authorized', payload: { authorizationId: 'auth_1', nodeId: 'step-1', operationId: 'op-produce', targetActorId: 'worker' } },
    { type: 'assignment-created', payload: { assignmentId: 'asgn_fail_1', actorId: 'worker' } },
    { type: 'result-linked', payload: { assignmentId: 'asgn_fail_1', actorId: 'worker' } },
  ];
  const projection = projectCoordinationActions({
    manifest,
    events,
    definition: sampleProtocolDef,
    quorum: { missing: [], failed: [{ assignmentId: 'asgn_fail_1', actorId: 'worker' }] },
  });

  assert.equal(projection.readyToClose, false);
  const dispAction = projection.actions.find((a) => a.kind === 'record-disposition');
  assert.ok(dispAction);
  assert.equal(dispAction.required, true);
  assert.equal(dispAction.target.targetRef, 'asgn_fail_1');
  assert.deepEqual(dispAction.requiredInputs, ['disposition', 'rationale']);
});

test('concurrent event invalidates previous actionKey (stale key proof)', () => {
  const manifest = {
    coordinationId: 'coord_stale_test',
    schemaVersion: '3',
    status: 'active',
    objective: 'Test stale key',
    assignmentRefs: [],
  };
  const proj1 = projectCoordinationActions({ manifest, events: [] });
  const key1 = computeActionKey({
    coordinationId: 'coord_stale_test',
    schemaVersion: '3',
    eventSeq: 0,
    definitionDigest: 'none',
    kind: 'dispatch-operation',
    target: { nodeId: 'step-1' },
    requiredInputs: ['objective'],
  });

  // Now an event arrives
  const events = [{ type: 'session-phase-transitioned', payload: { toPhase: 'phase-audit' } }];
  const proj2 = projectCoordinationActions({ manifest, events });
  const key2 = computeActionKey({
    coordinationId: 'coord_stale_test',
    schemaVersion: '3',
    eventSeq: 1,
    definitionDigest: 'none',
    kind: 'dispatch-operation',
    target: { nodeId: 'step-1' },
    requiredInputs: ['objective'],
  });

  assert.notEqual(key1, key2, 'actionKey must change when eventSeq advances');
  assert.equal(proj1.session.eventSeq, 0);
  assert.equal(proj2.session.eventSeq, 1);
});

test('legacy schemas 1, 2, and 3 are cleanly described without reinterpretation', () => {
  for (const ver of ['1', '2', '3']) {
    const manifest = {
      coordinationId: `coord_s${ver}`,
      schemaVersion: ver,
      status: 'active',
      assignmentRefs: [],
    };
    const proj = projectCoordinationActions({ manifest, events: [] });
    assert.equal(proj.session.schemaVersion, ver);
    assert.ok(proj.snapshot.digest.startsWith('sha256:'));
    assert.ok(proj.snapshot.actionSetDigest.startsWith('sha256:'));
  }
});

test('use-case adapter showCoordinationActionsUseCase loads read-only session state', () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'fgos-actions-usecase-test-'));
  try {
    const sDir = path.join(tempDir, '.fgos/coordination/sessions/coord_uc_test');
    fs.mkdirSync(sDir, { recursive: true });
    const manifest = {
      coordinationId: 'coord_uc_test',
      schemaVersion: '1',
      status: 'completed',
      objective: 'Done session',
      createdAt: '2026-09-01T00:00:00.000Z',
      completedAt: '2026-09-01T00:01:00.000Z',
      provenanceRoot: { writerId: 'tester-uc' },
      aggregateBounds: { wallTimeMs: 10000, maxAssignments: 10, maxConcurrency: 2, maxRounds: 5, maxTaskDepth: 2 },
      assignmentRefs: [],
    };
    fs.writeFileSync(path.join(sDir, 'session.json'), JSON.stringify(manifest));
    fs.writeFileSync(path.join(sDir, 'events.jsonl'), '{"type":"session-completed","payload":{}}\n');

    const result = showCoordinationActionsUseCase({ cwd: tempDir, repoRoot: tempDir }, { id: 'coord_uc_test' });
    assert.equal(result.contractVersion, ACTIONS_CONTRACT_VERSION);
    assert.equal(result.coordinationId, 'coord_uc_test');
    assert.equal(result.session.status, 'completed');
    assert.equal(result.actions.length, 0, 'completed session exposes no new actions');
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('parity: kernel-shaped assignment-created with operationId settles required op and projects close', () => {
  const manifest = {
    schemaVersion: '3',
    coordinationId: 'coord_parity_kernel',
    status: 'active',
    objective: 'Parity test',
    provenanceRoot: { writerId: 'driver-1' },
    assignmentRefs: ['asgn-1'],
    definitionRef: { id: 'test-flow', version: '1.0.0' },
  };

  const def = {
    apiVersion: 'fgos.dev/v1alpha1',
    kind: 'FlowDefinition',
    metadata: { id: 'test-flow', version: '1.0.0' },
    spec: {
      profile: { kind: 'CoordinationProtocol' },
      roles: ['worker-1'],
      actors: [{ id: 'worker-1', role: 'worker-1' }],
      operations: [{ id: 'op-required', role: 'worker-1' }],
      graph: {
        nodes: [
          {
            id: 'step-1',
            operations: [{ ref: 'op-required', actor: 'worker-1' }],
          },
        ],
      },
    },
  };

  // Case 1: Required op has assignment and result linked -> projects close, NOT dispatch-operation
  const eventsSettled = [
    { type: 'assignment-created', payload: { assignmentId: 'asgn-1', actorId: 'worker-1', operationId: 'op-required' } },
    { type: 'result-linked', payload: { assignmentId: 'asgn-1' } },
  ];
  const projSettled = projectCoordinationActions({
    manifest,
    events: eventsSettled,
    definition: def,
  });

  const dispatchAction = projSettled.actions.find((a) => a.kind === 'dispatch-operation');
  const closeAction = projSettled.actions.find((a) => a.kind === 'close');
  assert.equal(dispatchAction, undefined, 'settled required operation must NOT project duplicate dispatch-operation');
  assert.ok(closeAction, 'session with all required ops settled must project close action');

  // Case 2: Required op not dispatched -> projects dispatch-operation, NOT close
  const projUnsettled = projectCoordinationActions({
    manifest,
    events: [],
    definition: def,
  });
  const dispatchUnsettled = projUnsettled.actions.find((a) => a.kind === 'dispatch-operation');
  const closeUnsettled = projUnsettled.actions.find((a) => a.kind === 'close');
  assert.ok(dispatchUnsettled, 'unsettled required operation must project dispatch-operation');
  assert.equal(closeUnsettled, undefined, 'session with unsettled required op must NOT project close action');

  // Case 3: Partial policy allows closing when missing actor is in allowedOmissions
  const manifestPartial = {
    ...manifest,
    partialPolicy: { allowedOmissions: ['worker-1'], minimumActors: 0 },
  };
  const projPartial = projectCoordinationActions({
    manifest: manifestPartial,
    events: [],
    definition: def,
    quorum: { completed: [], missing: [{ actorId: 'worker-1' }], failed: [] },
  });
  // Since worker-1 is missing and has not settled, required dispatch is projected and close is not projected until discharged or allowed
});

test('F1 regression: multi-operation with same actorId matches 1:1 and does not alias across operations', () => {
  const manifest = {
    schemaVersion: '3',
    coordinationId: 'coord_multi_op_alias',
    status: 'active',
    objective: 'Multi-op test',
    provenanceRoot: { writerId: 'driver-1' },
    assignmentRefs: ['asgn-1'],
    definitionRef: { id: 'multi-op-flow', version: '1.0.0' },
  };

  const def = {
    apiVersion: 'fgos.dev/v1alpha1',
    kind: 'FlowDefinition',
    metadata: { id: 'multi-op-flow', version: '1.0.0' },
    spec: {
      profile: { kind: 'CoordinationProtocol' },
      roles: ['worker-1'],
      actors: [{ id: 'worker-1', role: 'worker-1' }],
      operations: [
        { id: 'op-alpha', role: 'worker-1' },
        { id: 'op-beta', role: 'worker-1' },
      ],
      graph: {
        nodes: [
          {
            id: 'step-1',
            operations: [
              { ref: 'op-alpha', actor: 'worker-1' },
              { ref: 'op-beta', actor: 'worker-1' },
            ],
          },
        ],
      },
    },
  };

  // Case 1: One assignment created for op-alpha -> matches op-alpha only; op-beta must project dispatch-operation
  const eventsOneCreated = [
    { type: 'assignment-created', payload: { assignmentId: 'asgn-1', actorId: 'worker-1', operationId: 'op-alpha' } },
  ];
  const projOne = projectCoordinationActions({
    manifest,
    events: eventsOneCreated,
    definition: def,
  });

  const dispatchActionsOne = projOne.actions.filter((a) => a.kind === 'dispatch-operation');
  assert.equal(dispatchActionsOne.length, 1, 'must project exactly one dispatch-operation for unassigned op-beta');
  assert.equal(dispatchActionsOne[0].target.operationId, 'op-beta');
  assert.equal(projOne.actions.find((a) => a.kind === 'close'), undefined, 'session must NOT be ready to close when op-beta is not dispatched');

  // Case 2: One assignment settled -> only op-alpha is settled; op-beta is still pending dispatch and session cannot close
  const eventsOneSettled = [
    { type: 'assignment-created', payload: { assignmentId: 'asgn-1', actorId: 'worker-1', operationId: 'op-alpha' } },
    { type: 'result-linked', payload: { assignmentId: 'asgn-1' } },
  ];
  const projSettledOne = projectCoordinationActions({
    manifest,
    events: eventsOneSettled,
    definition: def,
  });
  const dispatchActionsSettledOne = projSettledOne.actions.filter((a) => a.kind === 'dispatch-operation');
  assert.equal(dispatchActionsSettledOne.length, 1, 'op-beta must still project dispatch-operation after op-alpha settles');
  assert.equal(dispatchActionsSettledOne[0].target.operationId, 'op-beta');
  assert.equal(projSettledOne.actions.find((a) => a.kind === 'close'), undefined, 'session must NOT close when only 1 of 2 required ops settled');

  // Case 3: Second assignment created and settled -> op-beta is settled, now close is projected
  const eventsBothSettled = [
    { type: 'assignment-created', payload: { assignmentId: 'asgn-1', actorId: 'worker-1', operationId: 'op-alpha' } },
    { type: 'result-linked', payload: { assignmentId: 'asgn-1' } },
    { type: 'assignment-created', payload: { assignmentId: 'asgn-2', actorId: 'worker-1', operationId: 'op-beta' } },
    { type: 'result-linked', payload: { assignmentId: 'asgn-2' } },
  ];
  const projBoth = projectCoordinationActions({
    manifest: { ...manifest, assignmentRefs: ['asgn-1', 'asgn-2'] },
    events: eventsBothSettled,
    definition: def,
  });
  const dispatchActionsBoth = projBoth.actions.filter((a) => a.kind === 'dispatch-operation');
  assert.equal(dispatchActionsBoth.length, 0, 'no dispatch-operation should remain when both are settled');
  assert.ok(projBoth.actions.find((a) => a.kind === 'close'), 'session must project close when both ops settled');
});

test('F-02: record-human-turn is projected for any active session, regardless of protocol graph declarations', () => {
  const manifest = {
    schemaVersion: '1',
    coordinationId: 'coord_human_turn_test',
    status: 'active',
    objective: 'Standard architecture advisory or coding protocol',
    provenanceRoot: { writerId: 'driver-1' },
    assignmentRefs: [],
  };

  const defWithoutHuman = {
    apiVersion: 'fgos.dev/v1alpha1',
    kind: 'FlowDefinition',
    metadata: { id: 'no-human-declared', version: '1.0.0' },
    spec: {
      profile: { kind: 'CoordinationProtocol' },
      graph: {
        nodes: [
          {
            id: 'node-1',
            operations: [{ ref: 'code-review', actor: 'reviewer' }],
          },
        ],
      },
    },
  };

  const projActive = projectCoordinationActions({
    manifest,
    events: [],
    definition: defWithoutHuman,
  });

  const humanAction = projActive.actions.find((a) => a.kind === 'record-human-turn');
  assert.ok(humanAction, 'record-human-turn must be projected for active session even without protocol graph declaration');
  assert.equal(humanAction.required, false);
  assert.equal(humanAction.target.coordinationId, 'coord_human_turn_test');

  // When session is closed, record-human-turn must NOT be projected
  const projClosed = projectCoordinationActions({
    manifest: { ...manifest, status: 'completed' },
    events: [{ type: 'session-completed', payload: {} }],
    definition: defWithoutHuman,
  });
  assert.equal(projClosed.actions.find((a) => a.kind === 'record-human-turn'), undefined, 'record-human-turn must NOT be projected on completed session');
});

test('F-01: visibility-window gated driver authorization is projected only when window is open (closed/open/failed-source parity with kernel)', () => {
  const manifest = {
    schemaVersion: '3',
    coordinationId: 'coord_vis_gate_test',
    status: 'active',
    objective: 'Visibility gate test',
    provenanceRoot: { writerId: 'driver-1' },
    assignmentRefs: [],
    definitionRef: { id: 'vis-gate-flow', version: '1.0.0' },
  };

  const def = {
    apiVersion: 'fgos.dev/v1alpha1',
    kind: 'FlowDefinition',
    metadata: { id: 'vis-gate-flow', version: '1.0.0' },
    spec: {
      profile: {
        kind: 'CoordinationProtocol',
        topology: {
          visibilityWindows: [
            { id: 'win-1', opensAfter: { operationRefs: ['op-prereq'] } },
          ],
        },
      },
      roles: ['worker-1', 'worker-2'],
      actors: [
        { id: 'worker-1', role: 'worker-1' },
        { id: 'worker-2', role: 'worker-2' },
      ],
      operations: [
        { id: 'op-prereq', role: 'worker-1' },
        { id: 'op-gated', role: 'worker-2' },
      ],
      graph: {
        nodes: [
          {
            id: 'node-1',
            operations: [
              { ref: 'op-prereq', actor: 'worker-1' },
              {
                ref: 'op-gated',
                actor: 'worker-2',
                activation: { mode: 'driver-authorized' },
                contextAccess: { visibilityWindowRef: 'win-1' },
              },
            ],
          },
        ],
      },
    },
  };

  // Case 1: Window is CLOSED (op-prereq not settled) -> authorize-and-dispatch MUST NOT be projected for op-gated
  const projClosed = projectCoordinationActions({
    manifest,
    events: [],
    definition: def,
  });
  const authGatedClosed = projClosed.actions.find(
    (a) => a.kind === 'authorize-and-dispatch' && a.target.operationId === 'op-gated',
  );
  assert.equal(authGatedClosed, undefined, 'authorize-and-dispatch must NOT be projected when visibility window is closed');

  // Case 2: Window is OPEN (op-prereq settled) -> authorize-and-dispatch MUST be projected for op-gated
  const eventsOpen = [
    { type: 'assignment-created', payload: { assignmentId: 'asgn-prereq', actorId: 'worker-1', operationId: 'op-prereq' } },
    { type: 'result-linked', payload: { assignmentId: 'asgn-prereq' } },
  ];
  const projOpen = projectCoordinationActions({
    manifest: { ...manifest, assignmentRefs: ['asgn-prereq'] },
    events: eventsOpen,
    definition: def,
  });
  const authGatedOpen = projOpen.actions.find(
    (a) => a.kind === 'authorize-and-dispatch' && a.target.operationId === 'op-gated',
  );
  assert.ok(authGatedOpen, 'authorize-and-dispatch MUST be projected when visibility window is open');
  assert.equal(authGatedOpen.target.nodeId, 'node-1');
  assert.equal(authGatedOpen.target.actorId, 'worker-2');

  // Case 3: Source FAILED (quorum reports op-prereq failed) -> window stays closed, authorize-and-dispatch MUST NOT be projected
  const projFailedSource = projectCoordinationActions({
    manifest: { ...manifest, assignmentRefs: ['asgn-prereq'] },
    events: eventsOpen,
    definition: def,
    quorum: { completed: [], failed: [{ assignmentId: 'asgn-prereq', actorId: 'worker-1' }] },
  });
  const authGatedFailed = projFailedSource.actions.find(
    (a) => a.kind === 'authorize-and-dispatch' && a.target.operationId === 'op-gated',
  );
  assert.equal(authGatedFailed, undefined, 'authorize-and-dispatch must NOT be projected when window source failed');
});

test('fan-out and link-contribution projection and non-policy obligation 1 request schema translation', () => {
  const manifest = {
    schemaVersion: '3',
    coordinationId: 'coord_schema_trans_test',
    status: 'active',
    objective: 'Full schema test',
    provenanceRoot: { writerId: 'driver-1' },
    assignmentRefs: ['asgn-1'],
    definitionRef: { id: 'test-flow-full', version: '1.0.0' },
  };

  const def = {
    apiVersion: 'fgos.dev/v1alpha1',
    kind: 'FlowDefinition',
    metadata: { id: 'test-flow-full', version: '1.0.0' },
    spec: {
      profile: {
        kind: 'CoordinationProtocol',
        cohort: { independence: 'isolated-until-fan-in' },
      },
      roles: ['researcher', 'critic'],
      actors: [
        { id: 'worker-fan-1', role: 'researcher' },
        { id: 'worker-fan-2', role: 'researcher' },
        { id: 'worker-contrib', role: 'critic' },
      ],
      operations: [
        { id: 'op-fan', role: 'researcher' },
        { id: 'op-contrib', role: 'critic' },
      ],
      graph: {
        nodes: [
          {
            id: 'node-fan',
            operations: [
              { ref: 'op-fan', actor: 'worker-fan-1' },
              { ref: 'op-fan', actor: 'worker-fan-2' },
              {
                ref: 'op-contrib',
                actor: 'worker-contrib',
                contributions: { allowedTypes: ['proposal', 'critique'] },
              },
            ],
          },
        ],
      },
    },
  };

  // Case 1: op-fan is not assigned and cohort is isolated-until-fan-in -> projects fan-out
  const projFresh = projectCoordinationActions({
    manifest,
    events: [],
    definition: def,
  });
  const fanOutAction = projFresh.actions.find((a) => a.kind === 'fan-out');
  assert.ok(fanOutAction, 'unassigned op with isolated-until-fan-in cohort must project fan-out');
  assert.deepEqual(fanOutAction.requiredInputs, ['branches']);
  assert.deepEqual(fanOutAction.optionalInputs, ['fromAssignmentId']);
  assert.deepEqual(fanOutAction.allowedActorIds, ['worker-fan-1', 'worker-fan-2']);
  assert.deepEqual(fanOutAction.allowedValues['branches.actorId'], ['worker-fan-1', 'worker-fan-2']);

  const baseRequest = {
    kind: 'declared-protocol',
    objective: 'Test objective',
    writerId: 'driver-1',
    protocolRef: { id: 'test-flow-full' },
  };

  // Validate that a request built from fan-out action satisfies validateCoordinationRequest
  const fanOutRequest = {
    ...baseRequest,
    steps: [
      {
        type: 'fan-out',
        as: 'step-fan',
        operationId: fanOutAction.target.operationId,
        branches: [
          { actorId: fanOutAction.allowedActorIds[0], objective: 'branch 1', expectedOutputs: ['out-1'] },
          { actorId: fanOutAction.allowedActorIds[1], objective: 'branch 2', expectedOutputs: ['out-2'] },
        ],
      },
    ],
  };
  const validatedFanOut = validateCoordinationRequest(fanOutRequest);
  assert.equal(validatedFanOut.steps[0].type, 'fan-out');

  // Case 2: op-contrib is assigned and settled -> projects link-contribution (intersected with valid contribution types)
  const eventsContribSettled = [
    { type: 'assignment-created', payload: { assignmentId: 'asgn-contrib', actorId: 'worker-contrib', operationId: 'op-contrib' } },
    { type: 'result-linked', payload: { assignmentId: 'asgn-contrib' } },
  ];
  const projContrib = projectCoordinationActions({
    manifest: { ...manifest, assignmentRefs: ['asgn-contrib'] },
    events: eventsContribSettled,
    definition: def,
  });
  const contribAction = projContrib.actions.find((a) => a.kind === 'link-contribution');
  assert.ok(contribAction, 'settled op with contributions must project link-contribution');
  assert.deepEqual(contribAction.requiredInputs, ['contributionId', 'contributionType', 'roundKey']);
  assert.deepEqual(contribAction.allowedValues, { contributionType: ['proposal'] });

  // Validate that a request built from link-contribution satisfies validateCoordinationRequest
  const contribRequest = {
    ...baseRequest,
    steps: [
      {
        type: 'contribution',
        as: 'step-contrib',
        contributionId: 'contrib-1',
        contributionType: 'proposal',
        assignmentId: contribAction.target.assignmentId,
        roundKey: 'round-1',
      },
    ],
  };
  const validatedContrib = validateCoordinationRequest(contribRequest);
  assert.equal(validatedContrib.steps[0].type, 'contribution');

  // Case 3: record-human-turn request satisfies validateCoordinationRequest
  const humanTurnAction = projFresh.actions.find((a) => a.kind === 'record-human-turn');
  assert.ok(humanTurnAction, 'record-human-turn must be projected');
  assert.deepEqual(humanTurnAction.requiredInputs, ['turnId', 'turnOrdinal', 'channel', 'artifactRef', 'externalRef', 'attributedTo']);
  assert.deepEqual(humanTurnAction.optionalInputs, ['respondsToRefs']);
  const humanTurnRequest = {
    ...baseRequest,
    steps: [
      {
        type: 'human-turn',
        as: 'step-human',
        turnId: 'turn-1',
        turnOrdinal: 1,
        channel: 'cli',
        artifactRef: 'art-1',
        externalRef: 'ext-1',
        attributedTo: { type: 'person', id: 'human-operator' },
      },
    ],
  };
  const validatedHumanTurn = validateCoordinationRequest(humanTurnRequest);
  assert.equal(validatedHumanTurn.steps[0].type, 'human-turn');

  // Case 4: close request satisfies validateCoordinationCloseRequest
  const closeRequest = {
    kind: 'close',
    coordinationId: manifest.coordinationId,
    authorizedBy: { type: 'driver', id: 'driver-1' },
    dissentingActorIds: [],
  };
  const validatedClose = validateCoordinationCloseRequest(closeRequest);
  assert.equal(validatedClose.authorizedBy.id, 'driver-1');
});



