// verbs/coordination/actions.mjs — thin use-case adapter for coordination-actions.v1 (Unit 1A).
// Read-only door: loads session state once, then delegates to pure projectCoordinationActions.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { StoreError } from '../../state/store.mjs';
import { CoordinationError } from '../../runner/coordination/schema.mjs';
import { readManifest, readSessionEvents, resolveSessionPaths } from '../../runner/coordination/store.mjs';
import { replaySession } from '../../runner/coordination/replay.mjs';
import {
  evaluateSessionQuorum,
  deriveSessionPhase,
  loadDefinitionForSession,
  deriveVisibilityWindowState,
} from '../../runner/coordination/session-engine.mjs';
import { projectCoordinationActions } from '../../runner/coordination/actions-projector.mjs';
import {
  validateCoordinationRequest,
  validateCoordinationCloseRequest,
} from './schema.mjs';
import { executeCoordinationRunKernel } from './run.mjs';
import { executeCoordinationCloseKernel } from './close.mjs';
import { normalizeFanOutPayload } from '../../runner/coordination/fan-out-payload.mjs';

const __filename = fileURLToPath(import.meta.url);

import {
  ACTION_INPUT_RESERVED_FIELDS,
  composeCoordinationActionRequest,
  normalizeStringArray,
  assertNoForbiddenOverrides,
  deriveAuthorizationId,
  deriveInvocationKey,
  deriveContributionId,
} from './composers.mjs';

export {
  ACTION_INPUT_RESERVED_FIELDS,
  composeCoordinationActionRequest,
  normalizeStringArray,
  assertNoForbiddenOverrides,
  deriveAuthorizationId,
  deriveInvocationKey,
  deriveContributionId,
} from './composers.mjs';


/**
 * Use case: Read-only projection of session status and legal actions (coordination-actions.v1).
 *
 * @param {object} ctx `{ cwd, repoRoot, packageRoot? }`
 * @param {object} options `{ id }`
 * @returns {object} Target coordination-actions.v1 payload
 */
export function showCoordinationActionsUseCase(ctx, { id }) {
  if (!id || typeof id !== 'string') {
    throw new StoreError('validation', 'coordination actions: "id" is required and must be a string');
  }

  const engineOpts = { cwd: ctx.cwd, repoRoot: ctx.repoRoot };

  let manifest;
  try {
    manifest = readManifest(id, engineOpts);
  } catch (err) {
    if (err instanceof CoordinationError && err.category === 'not-found') {
      throw new StoreError('validation', `coordination actions: no session "${id}" found under .fgos/coordination/sessions/ (${err.message})`);
    }
    throw err;
  }

  const events = readSessionEvents(id, engineOpts);
  const replayed = replaySession(id, engineOpts);
  const quorum = evaluateSessionQuorum(id, engineOpts);
  const phase = deriveSessionPhase(id, engineOpts);

  let definition = null;
  if (manifest.definitionRef) {
    try {
      definition = loadDefinitionForSession(manifest, { cwd: ctx.cwd, packageRoot: ctx.packageRoot });
    } catch (err) {
      if (err instanceof CoordinationError || err.category === 'corrupt-log') throw err;
      throw new CoordinationError(
        'refusal',
        `coordination actions: session "${id}" was opened against definition "${manifest.definitionRef.id}@${manifest.definitionRef.version}", but the definition could not be resolved: ${err.message}`,
      );
    }
  }

  let visibilityWindows = null;
  const { fgosDir } = resolveSessionPaths(id, engineOpts);
  const declaredWindows = definition?.spec?.profile?.topology?.visibilityWindows ?? [];
  if (declaredWindows.length > 0 && replayed) {
    visibilityWindows = declaredWindows.map((w) => {
      const derived = deriveVisibilityWindowState(definition, w.id, replayed, fgosDir);
      return {
        windowId: w.id,
        open: Boolean(derived?.open),
        requiredOperations: (w.opensAfter?.operationRefs ?? []).slice(),
      };
    });
  }

  const getAssignment = (asgnId) => {
    try {
      const p = path.join(fgosDir, 'assignments', asgnId, 'assignment.json');
      if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
    } catch {}
    return null;
  };

  return projectCoordinationActions({
    manifest,
    events,
    replayed,
    definition,
    quorum,
    phase,
    visibilityWindows,
    getAssignment,
  });
}

/**
 * Use case: Execute a single semantic coordination action as a request composer (coordination-actions.v1).
 *
 * Validates action input and composes a canonical request object, then delegates directly to
 * executeCoordinationCloseKernel or executeCoordinationRunKernel under actionPrecondition.
 * Contains ZERO low-level *Locked mutators and zero duplicate orchestration.
 *
 * @param {object} ctx `{ cwd, repoRoot, packageRoot? }`
 * @param {object} options `{ coordinationId, actionKey, kind, target, inputPayload, writerId, authorizedBy }` or `{ requestObject }`
 * @returns {Promise<object>} Result of executing the action
 */
export async function executeCoordinationActionUseCase(ctx, options = {}) {
  const req = options.requestObject ?? options;
  if (!req || typeof req !== 'object') {
    throw new StoreError('validation', 'coordination execute action: request is required');
  }
  const {
    coordinationId,
    actionKey,
    kind,
    target,
    inputPayload = {},
    writerId,
    authorizedBy,
    requiredInputs,
    optionalInputs,
    allowedValues,
  } = req;
  if (!coordinationId || typeof coordinationId !== 'string') {
    throw new StoreError('validation', 'coordination execute action: "coordinationId" is required');
  }
  if (!actionKey || typeof actionKey !== 'string') {
    throw new StoreError('validation', 'coordination execute action: "actionKey" is required');
  }
  if (!kind || typeof kind !== 'string') {
    throw new StoreError('validation', 'coordination execute action: "kind" is required');
  }

  if (kind === 'close') {
    const auth = authorizedBy ?? inputPayload.authorizedBy;
    if (!auth || !auth.id) {
      throw new CoordinationError('validation', 'coordination close: authorizedBy is required and must have an id');
    }
    const closeRequest = {
      kind: 'close',
      coordinationId,
      actionKey,
      authorizedBy: auth,
      ...(inputPayload.dissentingActorIds ? { dissentingActorIds: inputPayload.dissentingActorIds } : {}),
      ...(inputPayload.aggregationId ? { aggregationId: inputPayload.aggregationId } : {}),
    };
    validateCoordinationCloseRequest(closeRequest);
    return executeCoordinationCloseKernel(ctx, closeRequest, options);
  }

  return executeCoordinationRunKernel(
    ctx,
    { coordinationId, writerId },
    {
      ...options,
      actionPrecondition: {
        actionKey,
        kind,
        target,
        inputPayload,
        writerId,
        authorizedBy,
        requiredInputs,
        optionalInputs,
        allowedValues,
      },
      composeActionRequest: composeCoordinationActionRequest,
    },
  );
}

/**
 * Use case: Execute one currently projected required or authorized operation.
 *
 * @param {object} ctx `{ cwd, repoRoot, packageRoot? }`
 * @param {object} options `{ id/coordinationId, actionKey, writerId, objective, expectedOutputs, ... }`
 * @returns {Promise<object>} Action result
 */
export async function executeOperationUseCase(ctx, options = {}) {
  const coordinationId = options.id ?? options.coordinationId;
  if (!coordinationId || typeof coordinationId !== 'string') {
    throw new CoordinationError('validation', 'coordination operation: "id" or "coordinationId" is required');
  }
  if (!options.actionKey || typeof options.actionKey !== 'string') {
    throw new CoordinationError('validation', 'coordination operation: "actionKey" is required');
  }
  if (!options.writerId || typeof options.writerId !== 'string') {
    throw new CoordinationError('validation', 'coordination operation: "writerId" is required');
  }
  if (!options.objective || typeof options.objective !== 'string') {
    throw new CoordinationError('validation', 'coordination operation: "objective" is required');
  }
  if (options.expectedOutputs === undefined) {
    throw new CoordinationError('validation', 'coordination operation: "expectedOutputs" is required');
  }
  const expectedOutputs = normalizeStringArray(options.expectedOutputs);
  if (!expectedOutputs || expectedOutputs.length === 0) {
    throw new CoordinationError('validation', 'coordination operation: "expectedOutputs" must be a non-empty array of strings');
  }

  // Reject caller forbidden overrides
  for (const field of ['actorId', 'targetActorId', 'operationId', 'nodeId', 'assignmentId', 'targetRef', 'target', 'authorizedBy']) {
    if (options[field] !== undefined) {
      throw new CoordinationError('validation', `coordination operation: field "${field}" is descriptor-derived/kernel-owned and cannot be provided by caller`);
    }
  }

  const inputPayload = {
    objective: options.objective,
    expectedOutputs,
    ...(options.contextRefs !== undefined ? { contextRefs: normalizeStringArray(options.contextRefs) } : {}),
    ...(options.constraints !== undefined ? { constraints: normalizeStringArray(options.constraints) } : {}),
    ...(options.capabilities !== undefined ? { capabilities: normalizeStringArray(options.capabilities) } : {}),
    ...(options.fromAssignmentId !== undefined ? { fromAssignmentId: options.fromAssignmentId } : {}),
    ...(options.intent !== undefined ? { intent: options.intent } : {}),
    ...(options.round !== undefined ? { round: options.round } : {}),
    ...(options.taskKey !== undefined ? { taskKey: options.taskKey } : {}),
    ...(options.mutation !== undefined ? { mutation: options.mutation } : {}),
  };

  return executeCoordinationActionUseCase(ctx, {
    coordinationId,
    actionKey: options.actionKey,
    kind: 'dispatch-operation',
    writerId: options.writerId,
    inputPayload,
    cliExecutor: options.cliExecutor,
    cliModel: options.cliModel,
    cliTier: options.cliTier,
  });
}

/**
 * Use case: Driver elects to authorize and dispatch an optional operation.
 *
 * @param {object} ctx `{ cwd, repoRoot, packageRoot? }`
 * @param {object} options `{ id/coordinationId, actionKey, writerId, objective, reason, ... }`
 * @returns {Promise<object>} Action result
 */
export async function executeAuthorizeAndDispatchUseCase(ctx, options = {}) {
  const coordinationId = options.id ?? options.coordinationId;
  if (!coordinationId || typeof coordinationId !== 'string') {
    throw new CoordinationError('validation', 'coordination authorize-and-dispatch: "id" or "coordinationId" is required');
  }
  if (!options.actionKey || typeof options.actionKey !== 'string') {
    throw new CoordinationError('validation', 'coordination authorize-and-dispatch: "actionKey" is required');
  }
  if (!options.writerId || typeof options.writerId !== 'string') {
    throw new CoordinationError('validation', 'coordination authorize-and-dispatch: "writerId" is required');
  }
  if (!options.objective || typeof options.objective !== 'string') {
    throw new CoordinationError('validation', 'coordination authorize-and-dispatch: "objective" is required');
  }
  if (!options.reason || typeof options.reason !== 'string') {
    throw new CoordinationError('validation', 'coordination authorize-and-dispatch: "reason" is required');
  }

  for (const field of ['actorId', 'targetActorId', 'operationId', 'nodeId', 'assignmentId', 'targetRef', 'target', 'authorizedBy', 'authorizationId', 'invocationKey']) {
    if (options[field] !== undefined) {
      throw new CoordinationError('validation', `coordination authorize-and-dispatch: field "${field}" is descriptor-derived/kernel-owned and cannot be provided by caller`);
    }
  }

  const expectedOutputs = normalizeStringArray(options.expectedOutputs) ?? ['agent-result.json'];

  const inputPayload = {
    objective: options.objective,
    reason: options.reason,
    expectedOutputs,
    ...(options.grantedContextRefs !== undefined ? { grantedContextRefs: normalizeStringArray(options.grantedContextRefs) } : {}),
    ...(options.contextRefs !== undefined ? { contextRefs: normalizeStringArray(options.contextRefs) } : {}),
    ...(options.constraints !== undefined ? { constraints: normalizeStringArray(options.constraints) } : {}),
    ...(options.capabilities !== undefined ? { capabilities: normalizeStringArray(options.capabilities) } : {}),
    ...(options.targetArtifactRef !== undefined ? { targetArtifactRef: options.targetArtifactRef } : {}),
    ...(options.taskKey !== undefined ? { taskKey: options.taskKey } : {}),
    ...(options.mutation !== undefined ? { mutation: options.mutation } : {}),
  };

  return executeCoordinationActionUseCase(ctx, {
    coordinationId,
    actionKey: options.actionKey,
    kind: 'authorize-and-dispatch',
    writerId: options.writerId,
    inputPayload,
    cliExecutor: options.cliExecutor,
    cliModel: options.cliModel,
    cliTier: options.cliTier,
  });
}

/**
 * Use case: Dispatch a kernel-supported fan-out whose branch set is legal now.
 *
 * @param {object} ctx `{ cwd, repoRoot, packageRoot? }`
 * @param {object} options `{ id/coordinationId, actionKey, writerId, branches, ... }`
 * @returns {Promise<object>} Action result
 */
export async function executeFanOutUseCase(ctx, options = {}) {
  const coordinationId = options.id ?? options.coordinationId;
  if (!coordinationId || typeof coordinationId !== 'string') {
    throw new CoordinationError('validation', 'coordination fan-out: "id" or "coordinationId" is required');
  }
  if (!options.actionKey || typeof options.actionKey !== 'string') {
    throw new CoordinationError('validation', 'coordination fan-out: "actionKey" is required');
  }
  if (!options.writerId || typeof options.writerId !== 'string') {
    throw new CoordinationError('validation', 'coordination fan-out: "writerId" is required');
  }
  if (!Array.isArray(options.branches) || options.branches.length === 0) {
    throw new CoordinationError('validation', 'coordination fan-out: "branches" is required and must be a non-empty array');
  }

  for (const field of ['operationId', 'nodeId', 'assignmentId', 'targetRef', 'target', 'authorizedBy']) {
    if (options[field] !== undefined) {
      throw new CoordinationError('validation', `coordination fan-out: field "${field}" is descriptor-derived/kernel-owned and cannot be provided by caller`);
    }
  }

  const inputPayload = {
    branches: options.branches,
    ...(options.fromAssignmentId !== undefined ? { fromAssignmentId: options.fromAssignmentId } : {}),
  };

  return executeCoordinationActionUseCase(ctx, {
    coordinationId,
    actionKey: options.actionKey,
    kind: 'fan-out',
    writerId: options.writerId,
    inputPayload,
    cliExecutor: options.cliExecutor,
    cliModel: options.cliModel,
    cliTier: options.cliTier,
  });
}

/**
 * Use case: Link one typed contribution backed by an already-settled Assignment.
 *
 * @param {object} ctx `{ cwd, repoRoot, packageRoot? }`
 * @param {object} options `{ id/coordinationId, actionKey, writerId, contributionType/type, roundKey, ... }`
 * @returns {Promise<object>} Action result
 */
export async function executeContributionUseCase(ctx, options = {}) {
  const coordinationId = options.id ?? options.coordinationId;
  if (!coordinationId || typeof coordinationId !== 'string') {
    throw new CoordinationError('validation', 'coordination contribution: "id" or "coordinationId" is required');
  }
  if (!options.actionKey || typeof options.actionKey !== 'string') {
    throw new CoordinationError('validation', 'coordination contribution: "actionKey" is required');
  }
  if (!options.writerId || typeof options.writerId !== 'string') {
    throw new CoordinationError('validation', 'coordination contribution: "writerId" is required');
  }
  const contributionType = options.contributionType ?? options.type;
  if (!contributionType || typeof contributionType !== 'string') {
    throw new CoordinationError('validation', 'coordination contribution: "contributionType" (or "type") is required');
  }
  if (!options.roundKey || typeof options.roundKey !== 'string') {
    throw new CoordinationError('validation', 'coordination contribution: "roundKey" is required');
  }

  for (const field of ['assignmentId', 'operationId', 'nodeId', 'targetRef', 'target', 'authorizedBy']) {
    if (options[field] !== undefined) {
      throw new CoordinationError('validation', `coordination contribution: field "${field}" is descriptor-derived/kernel-owned and cannot be provided by caller`);
    }
  }

  const contributionId = options.contributionId ?? deriveContributionId(coordinationId, options.actionKey);

  const inputPayload = {
    contributionId,
    contributionType,
    roundKey: options.roundKey,
    ...(options.anchors !== undefined ? { anchors: normalizeStringArray(options.anchors) } : {}),
    ...(options.respondsTo !== undefined ? { respondsTo: normalizeStringArray(options.respondsTo) } : {}),
  };

  return executeCoordinationActionUseCase(ctx, {
    coordinationId,
    actionKey: options.actionKey,
    kind: 'link-contribution',
    writerId: options.writerId,
    inputPayload,
  });
}

/**
 * Use case: Record one real person-attributed external turn.
 *
 * @param {object} ctx `{ cwd, repoRoot, packageRoot? }`
 * @param {object} options `{ id/coordinationId, actionKey, writerId, turnId, turnOrdinal/ordinal, channel, artifactRef, externalRef, attributedTo, ... }`
 * @returns {Promise<object>} Action result
 */
export async function executeHumanTurnUseCase(ctx, options = {}) {
  const coordinationId = options.id ?? options.coordinationId;
  if (!coordinationId || typeof coordinationId !== 'string') {
    throw new CoordinationError('validation', 'coordination human-turn: "id" or "coordinationId" is required');
  }
  if (!options.actionKey || typeof options.actionKey !== 'string') {
    throw new CoordinationError('validation', 'coordination human-turn: "actionKey" is required');
  }
  if (!options.writerId || typeof options.writerId !== 'string') {
    throw new CoordinationError('validation', 'coordination human-turn: "writerId" is required');
  }
  if (!options.turnId || typeof options.turnId !== 'string') {
    throw new CoordinationError('validation', 'coordination human-turn: "turnId" is required');
  }
  const ordinal = options.turnOrdinal ?? options.ordinal;
  if (ordinal === undefined || ordinal === null) {
    throw new CoordinationError('validation', 'coordination human-turn: "turnOrdinal" is required');
  }
  const turnOrdinal = typeof ordinal === 'string' ? Number(ordinal) : ordinal;
  if (!Number.isInteger(turnOrdinal) || turnOrdinal < 0) {
    throw new CoordinationError('validation', 'coordination human-turn: "turnOrdinal" must be a non-negative integer');
  }
  if (!options.channel || typeof options.channel !== 'string') {
    throw new CoordinationError('validation', 'coordination human-turn: "channel" is required');
  }
  if (!options.artifactRef || typeof options.artifactRef !== 'string') {
    throw new CoordinationError('validation', 'coordination human-turn: "artifactRef" is required');
  }
  if (!options.externalRef || typeof options.externalRef !== 'string') {
    throw new CoordinationError('validation', 'coordination human-turn: "externalRef" is required');
  }
  if (!options.attributedTo) {
    throw new CoordinationError('validation', 'coordination human-turn: "attributedTo" is required');
  }

  for (const field of ['revision', 'targetRef', 'target', 'authorizedBy']) {
    if (options[field] !== undefined) {
      throw new CoordinationError('validation', `coordination human-turn: field "${field}" is descriptor-derived/kernel-owned and cannot be provided by caller`);
    }
  }

  let attributedTo;
  if (typeof options.attributedTo === 'string') {
    attributedTo = { type: 'person', id: options.attributedTo };
  } else if (typeof options.attributedTo === 'object' && options.attributedTo !== null) {
    attributedTo = options.attributedTo;
  } else {
    throw new CoordinationError('validation', 'coordination human-turn: "attributedTo" must be a string or object');
  }

  const inputPayload = {
    turnId: options.turnId,
    turnOrdinal,
    channel: options.channel,
    artifactRef: options.artifactRef,
    externalRef: options.externalRef,
    attributedTo,
    ...(options.respondsToRefs !== undefined ? { respondsToRefs: normalizeStringArray(options.respondsToRefs) } : {}),
  };

  return executeCoordinationActionUseCase(ctx, {
    coordinationId,
    actionKey: options.actionKey,
    kind: 'record-human-turn',
    writerId: options.writerId,
    inputPayload,
  });
}

/**
 * Use case: Record driver explicit disposition on an owned target.
 *
 * @param {object} ctx `{ cwd, repoRoot, packageRoot? }`
 * @param {object} options `{ id/coordinationId, actionKey, writerId, disposition, rationale, evidenceRefs? }`
 * @returns {Promise<object>} Action result
 */
export async function executeDispositionUseCase(ctx, options = {}) {
  const coordinationId = options.id ?? options.coordinationId;
  if (!coordinationId || typeof coordinationId !== 'string') {
    throw new CoordinationError('validation', 'coordination disposition: "id" or "coordinationId" is required');
  }
  if (!options.actionKey || typeof options.actionKey !== 'string') {
    throw new CoordinationError('validation', 'coordination disposition: "actionKey" is required');
  }
  if (!options.writerId || typeof options.writerId !== 'string') {
    throw new CoordinationError('validation', 'coordination disposition: "writerId" is required');
  }
  if (!options.disposition || typeof options.disposition !== 'string') {
    throw new CoordinationError('validation', 'coordination disposition: "disposition" is required');
  }
  if (!options.rationale || typeof options.rationale !== 'string') {
    throw new CoordinationError('validation', 'coordination disposition: "rationale" is required');
  }

  for (const field of ['targetRef', 'target', 'actorId', 'authorizedBy']) {
    if (options[field] !== undefined) {
      throw new CoordinationError('validation', `coordination disposition: field "${field}" is descriptor-derived/kernel-owned and cannot be provided by caller`);
    }
  }

  const inputPayload = {
    disposition: options.disposition,
    rationale: options.rationale,
    ...(options.evidenceRefs !== undefined ? { evidenceRefs: normalizeStringArray(options.evidenceRefs) } : {}),
  };

  return executeCoordinationActionUseCase(ctx, {
    coordinationId,
    actionKey: options.actionKey,
    kind: 'record-disposition',
    writerId: options.writerId,
    inputPayload,
  });
}

/**
 * Use case: Driver explicitly attempts terminal close.
 *
 * @param {object} ctx `{ cwd, repoRoot, packageRoot? }`
 * @param {object} options `{ id/coordinationId, actionKey, writerId, authorizedBy?, dissentingActorIds?, aggregationId? }`
 * @returns {Promise<object>} Action result
 */
export async function executeCloseUseCase(ctx, options = {}) {
  const coordinationId = options.id ?? options.coordinationId;
  if (!coordinationId || typeof coordinationId !== 'string') {
    throw new CoordinationError('validation', 'coordination close: "id" or "coordinationId" is required');
  }
  if (!options.actionKey || typeof options.actionKey !== 'string') {
    throw new CoordinationError('validation', 'coordination close: "actionKey" is required');
  }
  const writerId = options.writerId;
  const rawAuth = options.authorizedBy;
  let authorizedBy = null;
  if (typeof rawAuth === 'string') {
    authorizedBy = { type: 'driver', id: rawAuth };
  } else if (rawAuth && typeof rawAuth === 'object') {
    authorizedBy = rawAuth;
  } else if (writerId && typeof writerId === 'string') {
    authorizedBy = { type: 'driver', id: writerId };
  }
  if (!authorizedBy || !authorizedBy.id) {
    throw new CoordinationError('validation', 'coordination close: "writerId" or "authorizedBy" is required');
  }

  for (const field of ['ready', 'status', 'terminalStatus', 'quorum']) {
    if (options[field] !== undefined) {
      throw new CoordinationError('validation', `coordination close: field "${field}" is descriptor-derived/kernel-owned and cannot be provided by caller`);
    }
  }

  const dissenting = options.dissentingActorIds ?? options.dissent;
  const inputPayload = {
    authorizedBy,
    ...(dissenting !== undefined ? { dissentingActorIds: normalizeStringArray(dissenting) } : {}),
    ...(options.aggregationId !== undefined ? { aggregationId: options.aggregationId } : {}),
  };

  return executeCoordinationActionUseCase(ctx, {
    coordinationId,
    actionKey: options.actionKey,
    kind: 'close',
    writerId: writerId ?? authorizedBy.id,
    authorizedBy,
    inputPayload,
  });
}

// Direct CLI invocation helper
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  const args = process.argv.slice(2);
  const id = args.find((a) => !a.startsWith('--'));
  if (!id) {
    process.stderr.write('Usage: node src/verbs/coordination/actions.mjs <coordinationId> [--json]\n');
    process.exit(4);
  }
  try {
    const result = showCoordinationActionsUseCase({ cwd: process.cwd(), repoRoot: process.cwd() }, { id });
    process.stdout.write(JSON.stringify(result, null, 2) + '\n');
  } catch (err) {
    process.stderr.write(`error: ${err.message}\n`);
    process.exit(1);
  }
}
