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

const ACTION_INPUT_RESERVED_FIELDS = new Set([
  'coordinationId', 'actionKey', 'kind', 'target', 'writerId', 'authorizedBy',
  'operationId', 'actorId', 'nodeId', 'assignmentId', 'targetRef',
]);

/**
 * Compose the authoritative action descriptor into the production run schema.
 * This is deliberately called only after executeUnderActionPrecondition has
 * reloaded and matched the descriptor while holding the session lock.
 */
export function composeCoordinationActionRequest({ manifest, action, precondition }) {
  const input = precondition.inputPayload ?? {};
  for (const field of ACTION_INPUT_RESERVED_FIELDS) {
    if (field in input) {
      throw new CoordinationError('validation', `coordination action: input field "${field}" cannot override an authoritative action binding`);
    }
  }
  const target = action.target ?? {};
  const base = {
    kind: 'declared-protocol',
    coordinationId: manifest.coordinationId,
    writerId: precondition.writerId,
    objective: manifest.objective,
    protocolRef: { id: manifest.definitionRef?.id },
    actors: [],
    close: false,
  };
  const common = { as: `action-${precondition.kind}` };
  let steps;
  switch (precondition.kind) {
    case 'dispatch-operation':
      steps = [{
        ...common,
        type: 'operation',
        operationId: target.operationId,
        targetActorId: target.actorId,
        objective: input.objective,
        expectedOutputs: input.expectedOutputs,
        contextRefs: input.contextRefs,
        constraints: input.constraints,
        capabilities: input.capabilities,
        fromAssignmentId: input.fromAssignmentId,
        intent: input.intent,
        round: input.round,
        taskKey: input.taskKey,
        mutation: input.mutation,
      }];
      break;
    case 'authorize-and-dispatch':
      steps = [
        {
          ...common,
          as: 'action-authorize',
          type: 'authorize',
          operationId: target.operationId,
          targetActorId: target.actorId,
          nodeId: target.nodeId,
          authorizationId: input.authorizationId,
          invocationKey: input.invocationKey,
          reason: input.reason,
          grantedContextRefs: input.grantedContextRefs,
          targetArtifactRef: input.targetArtifactRef,
        },
        {
          ...common,
          as: 'action-dispatch',
          type: 'operation',
          operationId: target.operationId,
          targetActorId: target.actorId,
          objective: input.objective,
          expectedOutputs: input.expectedOutputs,
          contextRefs: input.contextRefs ?? input.grantedContextRefs,
          constraints: input.constraints,
          capabilities: input.capabilities,
          taskKey: input.taskKey,
          mutation: input.mutation ?? 'read-only',
        },
      ];
      break;
    case 'record-disposition':
      steps = [{
        ...common,
        type: 'disposition',
        targetRef: target.targetRef,
        disposition: input.disposition,
        rationale: input.rationale,
        evidenceRefs: input.evidenceRefs,
      }];
      break;
    case 'record-human-turn':
      steps = [{ ...common, type: 'human-turn', ...input }];
      break;
    case 'link-contribution':
      steps = [{
        ...common,
        type: 'contribution',
        contributionId: input.contributionId,
        contributionType: input.contributionType,
        assignmentId: target.assignmentId,
        roundKey: input.roundKey,
        anchors: input.anchors,
        respondsTo: input.respondsTo,
      }];
      break;
    case 'fan-out':
      // The action descriptor binds the complete cohort. The precondition has
      // already rejected subsets, supersets, replacements, and duplicates;
      // sort the canonical request so an equivalent caller order has one
      // normalized step shape before production validation/execution.
      steps = [{
        ...common,
        type: 'fan-out',
        operationId: target.operationId,
        branches: normalizeFanOutPayload({ branches: input.branches, fromAssignmentId: input.fromAssignmentId }),
        fromAssignmentId: input.fromAssignmentId,
      }];
      break;
    default:
      throw new CoordinationError('validation', `unsupported action kind "${precondition.kind}"`);
  }
  return validateCoordinationRequest({ ...base, steps });
}

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
      kind: 'coordination-close',
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
