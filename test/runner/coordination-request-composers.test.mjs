import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  deriveAuthorizationId,
  deriveInvocationKey,
  deriveDeterministicTaskKey,
  deriveContributionId,
  assertNoForbiddenOverrides,
  composeStartRequest,
  composeCloseRequest,
  composeCoordinationActionRequest,
} from '../../src/verbs/coordination/composers.mjs';
import { CoordinationError } from '../../src/runner/coordination/schema.mjs';

test('Unit 2A: deterministic identifier derivation is pure and reproducible', () => {
  const coordId = 'coord_test123';
  const actionKey = 'sha256:abcd1234ef5678';

  const auth1 = deriveAuthorizationId(coordId, actionKey);
  const auth2 = deriveAuthorizationId(coordId, actionKey);
  assert.equal(auth1, auth2);
  assert.ok(auth1.startsWith('auth_'));
  assert.equal(auth1.length, 5 + 16);

  const inv1 = deriveInvocationKey(coordId, actionKey);
  const inv2 = deriveInvocationKey(coordId, actionKey);
  assert.equal(inv1, inv2);
  assert.ok(inv1.startsWith('inv_'));

  const task1 = deriveDeterministicTaskKey(coordId, actionKey, 'worker-1');
  const task2 = deriveDeterministicTaskKey(coordId, actionKey, 'worker-1');
  const taskOther = deriveDeterministicTaskKey(coordId, actionKey, 'worker-2');
  assert.equal(task1, task2);
  assert.notEqual(task1, taskOther);
  assert.ok(task1.startsWith('task_'));

  const contrib1 = deriveContributionId(coordId, actionKey);
  const contrib2 = deriveContributionId(coordId, actionKey);
  assert.equal(contrib1, contrib2);
  assert.ok(contrib1.startsWith('contrib_'));
});

test('Unit 2A: assertNoForbiddenOverrides rejects reserved target/provenance fields in caller input', () => {
  assert.doesNotThrow(() => assertNoForbiddenOverrides({ objective: 'clean input', expectedOutputs: ['out'] }));

  const reserved = [
    'coordinationId', 'actionKey', 'kind', 'target', 'writerId',
    'authorizedBy', 'operationId', 'actorId', 'nodeId', 'assignmentId', 'targetRef',
    'authorizationId', 'invocationKey',
  ];

  for (const field of reserved) {
    assert.throws(
      () => assertNoForbiddenOverrides({ [field]: 'attempted-override' }),
      (err) => err instanceof CoordinationError && err.category === 'validation' && err.message.includes(`field "${field}" cannot override`),
      `Expected override of "${field}" to throw validation error`,
    );
  }
});

test('Unit 2A: composeStartRequest creates valid declared-protocol and agent-led requests', () => {
  const declared = composeStartRequest({
    kind: 'declared-protocol',
    coordinationId: 'coord_start_dp',
    writerId: 'driver-1',
    objective: 'Run declared protocol',
    protocolId: 'group-thinking.rfc-review-lite',
    steps: [{
      as: 'propose',
      type: 'operation',
      operationId: 'propose',
      objective: 'Submit initial RFC proposal',
      expectedOutputs: ['rfc-proposal.md'],
    }],
  });
  assert.equal(declared.kind, 'declared-protocol');
  assert.equal(declared.coordinationId, 'coord_start_dp');
  assert.equal(declared.protocolRef.id, 'group-thinking.rfc-review-lite');
  assert.equal(declared.close, false);
  assert.equal(declared.steps.length, 1);

  const agentLed = composeStartRequest({
    kind: 'agent-led',
    coordinationId: 'coord_start_al',
    writerId: 'driver-1',
    objective: 'Run agent-led session',
    task: {
      expectedOutputs: ['findings.md'],
      evidenceRequired: 'reported',
    },
  });
  assert.equal(agentLed.kind, 'agent-led');
  assert.equal(agentLed.coordinationId, 'coord_start_al');
  assert.deepEqual(agentLed.task.expectedOutputs, ['findings.md']);

  // Missing required fields
  assert.throws(() => composeStartRequest({ coordinationId: 'c1', objective: 'obj' }), /writerId/);
  assert.throws(() => composeStartRequest({ coordinationId: 'c1', writerId: 'd1' }), /objective/);
  assert.throws(() => composeStartRequest({ kind: 'declared-protocol', coordinationId: 'c1', writerId: 'd1', objective: 'obj' }), /protocolId/);
  assert.throws(() => composeStartRequest({ kind: 'agent-led', coordinationId: 'c1', writerId: 'd1', objective: 'obj' }), /task/);

  // When coordinationId is omitted, it is deterministically derived
  const derived = composeStartRequest({
    kind: 'declared-protocol',
    writerId: 'd1',
    objective: 'obj',
    protocolId: 'proto1',
    steps: [{ as: 's1', type: 'operation', operationId: 'op1', objective: 'Step objective', expectedOutputs: ['out.md'] }],
  });
  assert.ok(derived.coordinationId.startsWith('coord_'));
  assert.throws(() => composeStartRequest({ coordinationId: '', writerId: 'd1', objective: 'obj', protocolId: 'proto1' }), /coordinationId/);

  // Forbids close: true on start
  assert.throws(
    () => composeStartRequest({
      kind: 'declared-protocol',
      coordinationId: 'c1',
      writerId: 'd1',
      objective: 'obj',
      protocolId: 'test-protocol',
      close: true,
    }),
    /close.*cannot be true on start/,
  );
});

test('Unit 2A: composeCloseRequest creates valid close requests and enforces driver identity', () => {
  const closeReq = composeCloseRequest({
    coordinationId: 'coord_close_1',
    actionKey: 'sha256:closekey123',
    writerId: 'driver-1',
    dissentingActorIds: ['actor-2'],
  });
  assert.equal(closeReq.kind, 'close');
  assert.equal(closeReq.coordinationId, 'coord_close_1');
  assert.deepEqual(closeReq.authorizedBy, { type: 'driver', id: 'driver-1' });
  assert.deepEqual(closeReq.dissentingActorIds, ['actor-2']);

  assert.throws(() => composeCloseRequest({ writerId: 'd1' }), /coordinationId/);
  assert.throws(() => composeCloseRequest({ coordinationId: 'c1' }), /authorizedBy\/writerId/);
});

test('Unit 2A: composeCoordinationActionRequest handles all action kinds with deterministic derivation', () => {
  const manifest = {
    coordinationId: 'coord_action_test',
    objective: 'Parent objective',
    definitionRef: { id: 'group-thinking.rfc-review-lite', version: '1.0.0' },
  };

  // 1. dispatch-operation
  const opReq = composeCoordinationActionRequest({
    manifest,
    action: {
      kind: 'dispatch-operation',
      target: { nodeId: 'review', operationId: 'review-op', actorId: 'reviewer' },
    },
    precondition: {
      actionKey: 'sha256:opkey123',
      kind: 'dispatch-operation',
      writerId: 'driver-1',
      inputPayload: {
        objective: 'Execute review',
        expectedOutputs: ['review.md'],
      },
    },
  });
  assert.equal(opReq.kind, 'declared-protocol');
  assert.equal(opReq.steps.length, 1);
  assert.equal(opReq.steps[0].type, 'operation');
  assert.equal(opReq.steps[0].operationId, 'review-op');
  assert.equal(opReq.steps[0].targetActorId, 'reviewer');
  assert.ok(opReq.steps[0].taskKey.startsWith('task_'));

  // 2. authorize-and-dispatch
  const authReq = composeCoordinationActionRequest({
    manifest,
    action: {
      kind: 'authorize-and-dispatch',
      target: { nodeId: 'revise', operationId: 'revise-op', actorId: 'author' },
    },
    precondition: {
      actionKey: 'sha256:authkey123',
      kind: 'authorize-and-dispatch',
      writerId: 'driver-1',
      inputPayload: {
        reason: 'Objection sustained, revision authorized',
        objective: 'Revise proposal',
        expectedOutputs: ['proposal-v2.md'],
      },
    },
  });
  assert.equal(authReq.steps.length, 2);
  assert.equal(authReq.steps[0].type, 'authorize');
  assert.ok(authReq.steps[0].authorizationId.startsWith('auth_'));
  assert.ok(authReq.steps[0].invocationKey.startsWith('inv_'));
  assert.equal(authReq.steps[1].type, 'operation');

  // 3. record-disposition
  const dispReq = composeCoordinationActionRequest({
    manifest,
    action: {
      kind: 'record-disposition',
      target: { targetRef: 'asgn_finding_1', actorId: 'reviewer' },
    },
    precondition: {
      actionKey: 'sha256:dispkey123',
      kind: 'record-disposition',
      writerId: 'driver-1',
      inputPayload: {
        disposition: 'accepted',
        rationale: 'Review finding verified by team',
      },
    },
  });
  assert.equal(dispReq.steps.length, 1);
  assert.equal(dispReq.steps[0].type, 'disposition');
  assert.equal(dispReq.steps[0].targetRef, 'asgn_finding_1');
  assert.equal(dispReq.steps[0].disposition, 'accepted');

  // 4. record-human-turn
  const humanReq = composeCoordinationActionRequest({
    manifest,
    action: {
      kind: 'record-human-turn',
      target: { coordinationId: manifest.coordinationId },
    },
    precondition: {
      actionKey: 'sha256:humankey123',
      kind: 'record-human-turn',
      writerId: 'driver-1',
      inputPayload: {
        turnId: 'turn-1',
        turnOrdinal: 1,
        channel: 'cli',
        artifactRef: 'docs/human-feedback.md',
        externalRef: 'issue#42',
        attributedTo: 'human-reviewer-1',
      },
    },
  });
  assert.equal(humanReq.steps.length, 1);
  assert.equal(humanReq.steps[0].type, 'human-turn');
  assert.deepEqual(humanReq.steps[0].attributedTo, { type: 'person', id: 'human-reviewer-1' });

  // 5. link-contribution
  const contribReq = composeCoordinationActionRequest({
    manifest,
    action: {
      kind: 'link-contribution',
      target: { assignmentId: 'asgn_contrib_1', operationId: 'propose-op', nodeId: 'propose', actorId: 'proposer' },
    },
    precondition: {
      actionKey: 'sha256:contribkey123',
      kind: 'link-contribution',
      writerId: 'driver-1',
      inputPayload: {
        type: 'proposal',
        roundKey: 'round-1',
      },
    },
  });
  assert.equal(contribReq.steps.length, 1);
  assert.equal(contribReq.steps[0].type, 'contribution');
  assert.equal(contribReq.steps[0].assignmentId, 'asgn_contrib_1');
  assert.equal(contribReq.steps[0].contributionType, 'proposal');
  assert.ok(contribReq.steps[0].contributionId.startsWith('contrib_'));

  // 6. fan-out
  const fanOutReq = composeCoordinationActionRequest({
    manifest,
    action: {
      kind: 'fan-out',
      target: { nodeId: 'research', operationId: 'research-op', allowedActorIds: ['researcher-a', 'researcher-b'] },
    },
    precondition: {
      actionKey: 'sha256:fanoutkey123',
      kind: 'fan-out',
      writerId: 'driver-1',
      inputPayload: {
        branches: [
          { actorId: 'researcher-a', objective: 'Investigate angle A', expectedOutputs: ['a.md'] },
          { actorId: 'researcher-b', objective: 'Investigate angle B', expectedOutputs: ['b.md'] },
        ],
      },
    },
  });
  assert.equal(fanOutReq.steps.length, 1);
  assert.equal(fanOutReq.steps[0].type, 'fan-out');
  assert.equal(fanOutReq.steps[0].branches.length, 2);

  // 7. close
  const closeReq = composeCoordinationActionRequest({
    manifest,
    action: {
      kind: 'close',
      target: { coordinationId: manifest.coordinationId },
    },
    precondition: {
      actionKey: 'sha256:closekey123',
      kind: 'close',
      writerId: 'driver-1',
      inputPayload: {
        dissentingActorIds: ['critic'],
      },
    },
  });
  assert.equal(closeReq.kind, 'close');
  assert.equal(closeReq.coordinationId, manifest.coordinationId);
  assert.deepEqual(closeReq.authorizedBy, { type: 'driver', id: 'driver-1' });
});
