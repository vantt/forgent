// verbs/coordination/composers.mjs — pure deterministic coordination request composers (Unit 2A).
// Implements pure request composition for both start and action-backed semantic verbs.
// Zero filesystem I/O, zero mutation, zero sidecar, and strict caller/derived field segregation.

import crypto from 'node:crypto';
import { CoordinationError } from '../../runner/coordination/schema.mjs';
import { normalizeFanOutPayload } from '../../runner/coordination/fan-out-payload.mjs';
import {
  validateCoordinationRequest,
  validateCoordinationCloseRequest,
} from './schema.mjs';

export const ACTION_INPUT_RESERVED_FIELDS = Object.freeze(new Set([
  'coordinationId',
  'actionKey',
  'kind',
  'target',
  'writerId',
  'authorizedBy',
  'operationId',
  'actorId',
  'targetActorId',
  'nodeId',
  'assignmentId',
  'targetRef',
  'authorizationId',
  'invocationKey',
]));

function sha256(content) {
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * Deterministically derive an authorizationId from session identity and actionKey.
 * @param {string} coordinationId
 * @param {string} actionKey
 * @returns {string}
 */
export function deriveAuthorizationId(coordinationId, actionKey) {
  return 'auth_' + sha256(`auth:${coordinationId}:${actionKey}`).slice(0, 16);
}

/**
 * Deterministically derive an invocationKey from session identity and actionKey.
 * @param {string} coordinationId
 * @param {string} actionKey
 * @returns {string}
 */
export function deriveInvocationKey(coordinationId, actionKey) {
  return 'inv_' + sha256(`inv:${coordinationId}:${actionKey}`).slice(0, 16);
}

/**
 * Deterministically derive a taskKey from session identity, actionKey, and optional actorId.
 * @param {string} coordinationId
 * @param {string} actionKey
 * @param {string|null} [actorId]
 * @returns {string}
 */
export function deriveDeterministicTaskKey(coordinationId, actionKey, actorId = null) {
  const base = actorId ? `task:${coordinationId}:${actionKey}:${actorId}` : `task:${coordinationId}:${actionKey}`;
  return 'task_' + sha256(base).slice(0, 16);
}

/**
 * Deterministically derive a contributionId from session identity and actionKey.
 * @param {string} coordinationId
 * @param {string} actionKey
 * @returns {string}
 */
export function deriveContributionId(coordinationId, actionKey) {
  return 'contrib_' + sha256(`contrib:${coordinationId}:${actionKey}`).slice(0, 16);
}

/**
 * Ensure that inputPayload does not contain fields reserved for authoritative derivation.
 * @param {object} input
 * @param {Set<string>} [reservedSet]
 */
export function assertNoForbiddenOverrides(input = {}, reservedSet = ACTION_INPUT_RESERVED_FIELDS) {
  if (!input || typeof input !== 'object') return;
  for (const field of reservedSet) {
    if (field in input && input[field] !== undefined) {
      throw new CoordinationError(
        'validation',
        `coordination action: input field "${field}" cannot override an authoritative action binding`,
      );
    }
  }
}

/**
 * Normalize string array or comma-separated/JSON string into string array.
 * @param {unknown} val
 * @returns {string[]|undefined}
 */
export function normalizeStringArray(val) {
  if (val === undefined || val === null) return undefined;
  if (Array.isArray(val)) return val.map((v) => String(v).trim());
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) return parsed.map((v) => String(v).trim());
      } catch {}
    }
    return trimmed.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return [String(val)];
}

/**
 * Canonical JSON serialization with sorted object keys.
 * @param {unknown} val
 * @returns {string}
 */
export function canonicalJson(val) {
  if (val === null || typeof val !== 'object') {
    return JSON.stringify(val);
  }
  if (Array.isArray(val)) {
    return '[' + val.map((elem) => canonicalJson(elem)).join(',') + ']';
  }
  const keys = Object.keys(val).sort();
  return '{' + keys.map((k) => JSON.stringify(k) + ':' + canonicalJson(val[k])).join(',') + '}';
}

/**
 * Deterministically derive a coordinationId from initial session parameters when omitted.
 * @param {object} params
 * @returns {string}
 */
export function deriveDeterministicCoordinationId(params = {}) {
  const seed = {
    kind: params.kind ?? 'declared-protocol',
    protocolId: params.protocolId ?? params.protocolRef?.id ?? null,
    writerId: params.writerId ?? null,
    objective: params.objective ?? null,
    workRef: params.workRef ?? null,
    primaryRole: params.primaryRole ?? null,
    actors: params.actors ?? null,
    task: params.task ?? null,
    aggregateBounds: params.aggregateBounds ?? null,
    partialPolicy: params.partialPolicy ?? null,
  };
  const hash = crypto.createHash('sha256').update(canonicalJson(seed)).digest('hex').slice(0, 16);
  return `coord_${hash}`;
}

/**
 * Pure composer for a new coordination session request (`start`).
 * Validates through validateCoordinationRequest.
 *
 * @param {object} options
 * @returns {object} Validated production request object
 */
export function composeStartRequest(options = {}) {
  const {
    kind = 'declared-protocol',
    coordinationId,
    writerId,
    objective,
    protocolId,
    protocolRef,
    actors = [],
    primaryRole = 'researcher',
    task,
    steps,
    definition,
    aggregateBounds,
    partialPolicy,
    workRef,
    close,
  } = options;

  if (!writerId || typeof writerId !== 'string') {
    throw new CoordinationError('validation', 'coordination start: "writerId" is required');
  }
  if (!objective || typeof objective !== 'string') {
    throw new CoordinationError('validation', 'coordination start: "objective" is required');
  }
  if (close === true) {
    throw new CoordinationError('validation', 'coordination start: "close" cannot be true on start (sessions close explicitly or via quorum)');
  }

  const pId = protocolId ?? protocolRef?.id;
  if (kind === 'declared-protocol') {
    if (!pId || typeof pId !== 'string') {
      throw new CoordinationError('validation', 'coordination start: "protocolId" is required for declared-protocol sessions');
    }
  }

  const resolvedCoordinationId = coordinationId ?? deriveDeterministicCoordinationId({
    kind,
    protocolId: pId,
    writerId,
    objective,
    workRef,
    primaryRole,
    actors,
    task,
    aggregateBounds,
    partialPolicy,
  });

  if (!resolvedCoordinationId || typeof resolvedCoordinationId !== 'string') {
    throw new CoordinationError('validation', 'coordination start: "coordinationId" must be a non-empty string');
  }

  let request;
  if (kind === 'declared-protocol') {

    let resolvedSteps = Array.isArray(steps) && steps.length > 0 ? steps : null;
    if (!resolvedSteps && definition?.spec?.graph?.nodes) {
      const entryNodeId = definition.spec?.graph?.entry;
      const entryNode = definition.spec.graph.nodes.find((n) => n.id === entryNodeId);
      if (entryNode && Array.isArray(entryNode.operations)) {
        resolvedSteps = entryNode.operations
          .filter((op) => !op.activation || op.activation.mode !== 'driver-authorized')
          .map((op, idx) => ({
            as: op.ref || op.id || `step-${idx + 1}`,
            type: 'operation',
            operationId: op.ref || op.id,
            ...(op.actor ? { targetActorId: op.actor } : {}),
            objective,
            expectedOutputs: ['agent-result.json'],
          }));
      }
    }

    if (!resolvedSteps || resolvedSteps.length === 0) {
      throw new CoordinationError(
        'validation',
        'coordination start: "steps" is required and must be a non-empty array for declared-protocol start',
      );
    }

    request = {
      kind: 'declared-protocol',
      coordinationId: resolvedCoordinationId,
      writerId,
      objective,
      protocolRef: { id: pId },
      actors: Array.isArray(actors) ? actors : [],
      steps: resolvedSteps,
      close: false,
      ...(aggregateBounds ? { aggregateBounds } : {}),
      ...(partialPolicy ? { partialPolicy } : {}),
      ...(workRef ? { workRef } : {}),
    };
  } else if (kind === 'agent-led') {
    if (!task || typeof task !== 'object') {
      throw new CoordinationError('validation', 'coordination start: "task" object is required for agent-led sessions');
    }
    request = {
      kind: 'agent-led',
      coordinationId: resolvedCoordinationId,
      writerId,
      objective,
      primaryRole,
      actors: Array.isArray(actors) ? actors : [],
      task: {
        ...task,
        expectedOutputs: normalizeStringArray(task.expectedOutputs) ?? task.expectedOutputs,
      },
      close: false,
      ...(aggregateBounds ? { aggregateBounds } : {}),
      ...(partialPolicy ? { partialPolicy } : {}),
      ...(workRef ? { workRef } : {}),
    };
  } else {
    throw new CoordinationError('validation', `coordination start: unsupported kind "${kind}" (must be "declared-protocol" or "agent-led")`);
  }

  return validateCoordinationRequest(request);
}

/**
 * Pure composer for a coordination close request.
 * Validates through validateCoordinationCloseRequest.
 *
 * @param {object} options
 * @returns {object} Validated production close request object
 */
export function composeCloseRequest(options = {}) {
  const {
    coordinationId,
    actionKey,
    writerId,
    authorizedBy,
    dissentingActorIds,
    aggregationId,
  } = options;

  if (!coordinationId || typeof coordinationId !== 'string') {
    throw new CoordinationError('validation', 'coordination close: "coordinationId" is required');
  }

  const auth = authorizedBy ?? (writerId ? { type: 'driver', id: writerId } : null);
  if (!auth || !auth.id) {
    throw new CoordinationError('validation', 'coordination close: authorizedBy/writerId is required');
  }

  const closeRequest = {
    kind: 'close',
    coordinationId,
    ...(actionKey ? { actionKey } : {}),
    authorizedBy: auth,
    ...(dissentingActorIds ? { dissentingActorIds: normalizeStringArray(dissentingActorIds) } : {}),
    ...(aggregationId ? { aggregationId } : {}),
  };

  return validateCoordinationCloseRequest(closeRequest);
}

/**
 * Compose an authoritative action descriptor and caller precondition inputs into
 * a validated production coordination request object.
 *
 * @param {object} params
 * @param {object} params.manifest Session manifest
 * @param {object} params.action Authoritative action descriptor from projector
 * @param {object} params.precondition ActionPrecondition containing caller inputs
 * @returns {object} Validated production request object
 */
export function composeCoordinationActionRequest({ manifest, action, precondition }) {
  const input = precondition.inputPayload ?? {};
  assertNoForbiddenOverrides(input);

  const target = action.target ?? {};
  const coordinationId = manifest.coordinationId;
  const actionKey = precondition.actionKey;

  const base = {
    kind: 'declared-protocol',
    coordinationId,
    writerId: precondition.writerId,
    objective: manifest.objective,
    protocolRef: { id: manifest.definitionRef?.id },
    actors: [],
    close: false,
  };

  const common = { as: `action-${precondition.kind}` };
  let steps;

  switch (precondition.kind) {
    case 'dispatch-operation': {
      const expectedOutputs = normalizeStringArray(input.expectedOutputs);
      const contextRefs = normalizeStringArray(input.contextRefs);
      const constraints = normalizeStringArray(input.constraints);
      const capabilities = normalizeStringArray(input.capabilities);
      const taskKey = input.taskKey ?? deriveDeterministicTaskKey(coordinationId, actionKey, target.actorId);

      steps = [{
        ...common,
        type: 'operation',
        operationId: target.operationId,
        targetActorId: target.actorId,
        objective: input.objective,
        expectedOutputs,
        contextRefs,
        constraints,
        capabilities,
        fromAssignmentId: input.fromAssignmentId,
        intent: input.intent,
        round: input.round,
        taskKey,
        mutation: input.mutation,
      }];
      break;
    }

    case 'authorize-and-dispatch': {
      if (input.authorizationId !== undefined || input.invocationKey !== undefined) {
        throw new CoordinationError(
          'validation',
          'coordination authorize-and-dispatch: authorizationId and invocationKey cannot be provided by caller (they are derived by kernel)',
        );
      }
      const authId = deriveAuthorizationId(coordinationId, actionKey);
      const invKey = deriveInvocationKey(coordinationId, actionKey);
      const grantedContextRefs = normalizeStringArray(input.grantedContextRefs);
      const contextRefs = normalizeStringArray(input.contextRefs) ?? grantedContextRefs;
      const expectedOutputs = normalizeStringArray(input.expectedOutputs);
      const constraints = normalizeStringArray(input.constraints);
      const capabilities = normalizeStringArray(input.capabilities);
      const taskKey = input.taskKey ?? deriveDeterministicTaskKey(coordinationId, actionKey, target.actorId);

      steps = [
        {
          ...common,
          as: 'action-authorize',
          type: 'authorize',
          operationId: target.operationId,
          targetActorId: target.actorId,
          nodeId: target.nodeId,
          authorizationId: authId,
          invocationKey: invKey,
          reason: input.reason,
          grantedContextRefs,
          targetArtifactRef: input.targetArtifactRef,
        },
        {
          ...common,
          as: 'action-dispatch',
          type: 'operation',
          operationId: target.operationId,
          targetActorId: target.actorId,
          objective: input.objective,
          expectedOutputs,
          contextRefs,
          constraints,
          capabilities,
          taskKey,
          mutation: input.mutation ?? 'read-only',
        },
      ];
      break;
    }

    case 'record-disposition': {
      const evidenceRefs = normalizeStringArray(input.evidenceRefs);
      steps = [{
        ...common,
        type: 'disposition',
        targetRef: target.targetRef,
        disposition: input.disposition,
        rationale: input.rationale,
        evidenceRefs,
      }];
      break;
    }

    case 'record-human-turn': {
      const rawAttributed = input.attributedTo;
      let attributedTo;
      if (typeof rawAttributed === 'string') {
        attributedTo = { type: 'person', id: rawAttributed };
      } else if (rawAttributed && typeof rawAttributed === 'object') {
        attributedTo = rawAttributed;
      }
      const respondsToRefs = normalizeStringArray(input.respondsToRefs);

      steps = [{
        ...common,
        type: 'human-turn',
        turnId: input.turnId,
        turnOrdinal: typeof input.turnOrdinal === 'string' ? Number(input.turnOrdinal) : input.turnOrdinal,
        channel: input.channel,
        artifactRef: input.artifactRef,
        externalRef: input.externalRef,
        attributedTo,
        respondsToRefs,
      }];
      break;
    }

    case 'link-contribution': {
      steps = [{
        ...common,
        type: 'contribution',
        contributionId: input.contributionId ?? deriveContributionId(coordinationId, actionKey),
        contributionType: input.contributionType ?? input.type,
        assignmentId: target.assignmentId,
        roundKey: input.roundKey,
        anchors: normalizeStringArray(input.anchors),
        respondsTo: normalizeStringArray(input.respondsTo),
      }];
      break;
    }

    case 'fan-out': {
      steps = [{
        ...common,
        type: 'fan-out',
        operationId: target.operationId,
        branches: normalizeFanOutPayload({ branches: input.branches, fromAssignmentId: input.fromAssignmentId }),
        fromAssignmentId: input.fromAssignmentId,
      }];
      break;
    }

    case 'close': {
      return composeCloseRequest({
        coordinationId,
        actionKey,
        writerId: precondition.writerId,
        authorizedBy: input.authorizedBy,
        dissentingActorIds: input.dissentingActorIds,
        aggregationId: input.aggregationId,
      });
    }

    default:
      throw new CoordinationError('validation', `unsupported action kind "${precondition.kind}"`);
  }

  return validateCoordinationRequest({ ...base, steps });
}
