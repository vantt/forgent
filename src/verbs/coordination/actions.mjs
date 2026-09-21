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
  closeSessionByQuorumLocked,
} from '../../runner/coordination/session-engine.mjs';
import {
  recordDriverDispositionLocked,
  recordHumanTurnLocked,
  recordContributionLinkLocked,
  authorizeOperationLocked,
  createSessionAssignmentLocked,
} from '../../runner/coordination/store.mjs';
import { projectCoordinationActions } from '../../runner/coordination/actions-projector.mjs';
import { executeUnderActionPrecondition } from '../../runner/coordination/action-precondition.mjs';
import { protocolOperationStamp } from '../../runner/coordination/legality-facts.mjs';

const __filename = fileURLToPath(import.meta.url);

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
 * Use case: Execute a single semantic coordination action under action precondition seam (coordination-actions.v1).
 *
 * Atomically validates precondition and driver identity, acquires the session lock,
 * and executes the corresponding *Locked engine mutator.
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

  const engineOpts = {
    cwd: ctx.cwd,
    repoRoot: ctx.repoRoot,
    packageRoot: ctx.packageRoot,
  };

  return executeUnderActionPrecondition(
    coordinationId,
    {
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
    async (paths, sessionBundle) => {
      const { manifest, definition } = sessionBundle;
      const effectiveWriterId = writerId ?? manifest.provenanceRoot?.writerId;

      switch (kind) {
        case 'close': {
          const auth = authorizedBy ?? { type: 'human', id: effectiveWriterId };
          const closeParams = {
            authorizedBy: auth,
            ...(inputPayload.dissentingActorIds ? { dissentingActorIds: inputPayload.dissentingActorIds } : {}),
            ...(inputPayload.aggregationId ? { aggregationId: inputPayload.aggregationId } : {}),
          };
          closeSessionByQuorumLocked(coordinationId, closeParams, paths, engineOpts);
          const finalQuorum = evaluateSessionQuorum(coordinationId, engineOpts);
          const phase = deriveSessionPhase(coordinationId, engineOpts);
          return {
            coordinationId,
            kind: 'close',
            status: phase,
            closed: true,
            closeAttempted: true,
            actionKey,
            quorum: finalQuorum,
          };
        }

        case 'record-disposition': {
          const targetRef = target?.targetRef ?? inputPayload.targetRef;
          const dispositionParams = {
            targetRef,
            disposition: inputPayload.disposition,
            rationale: inputPayload.rationale,
            evidenceRefs: inputPayload.evidenceRefs ?? [],
            authorizedBy: { type: 'driver', id: effectiveWriterId },
          };
          const recorded = recordDriverDispositionLocked(coordinationId, dispositionParams, paths, engineOpts);
          return {
            coordinationId,
            kind: 'record-disposition',
            status: 'recorded',
            actionKey,
            ...recorded,
          };
        }

        case 'record-human-turn': {
          const turnParams = {
            turnId: inputPayload.turnId,
            turnOrdinal: inputPayload.turnOrdinal,
            channel: inputPayload.channel,
            artifactRef: inputPayload.artifactRef,
            revision: inputPayload.revision ?? 'sha256:0000000000000000000000000000000000000000000000000000000000000000',
            externalRef: inputPayload.externalRef,
            attributedTo: inputPayload.attributedTo,
            recordedBy: { type: 'driver', id: effectiveWriterId },
            ...(inputPayload.respondsToRefs !== undefined ? { respondsToRefs: inputPayload.respondsToRefs } : {}),
          };
          const recorded = recordHumanTurnLocked(coordinationId, turnParams, paths, engineOpts);
          return {
            coordinationId,
            kind: 'record-human-turn',
            status: 'recorded',
            actionKey,
            ...recorded,
          };
        }

        case 'link-contribution': {
          const linkParams = {
            contributionId: inputPayload.contributionId,
            operationRef: target?.operationId ?? inputPayload.operationRef,
            type: inputPayload.contributionType ?? inputPayload.type,
            assignmentId: inputPayload.assignmentId ?? target?.assignmentId,
            runId: inputPayload.runId,
            artifactRef: inputPayload.artifactRef,
            revision: inputPayload.revision ?? '1',
            roundKey: inputPayload.roundKey,
            visibilityWindowRef: inputPayload.visibilityWindowRef ?? 'window-main',
            anchors: inputPayload.anchors,
            respondsTo: inputPayload.respondsTo,
            linkedBy: { type: 'driver', id: effectiveWriterId },
          };
          const linked = recordContributionLinkLocked(coordinationId, linkParams, paths, engineOpts);
          return {
            coordinationId,
            kind: 'link-contribution',
            status: 'linked',
            actionKey,
            ...linked,
          };
        }

        case 'authorize-and-dispatch': {
          const operationId = target?.operationId;
          const targetActorId = target?.actorId;
          const nodeId = target?.nodeId;
          const authParams = {
            authorizationId: inputPayload.authorizationId,
            operationId,
            nodeId,
            targetActorId,
            invocationKey: inputPayload.invocationKey,
            authorizedBy: { type: 'driver', id: effectiveWriterId },
            reason: inputPayload.reason,
            grantedContextRefs: inputPayload.grantedContextRefs ?? [],
            targetArtifactRef: inputPayload.targetArtifactRef,
          };
          authorizeOperationLocked(coordinationId, authParams, paths, engineOpts);

          const contract = {
            objective: inputPayload.objective,
            expectedOutputs: inputPayload.expectedOutputs,
            contextRefs: inputPayload.contextRefs ?? (inputPayload.grantedContextRefs ?? []),
            constraints: [
              ...(inputPayload.constraints ?? []),
              ...(definition && operationId ? [protocolOperationStamp(definition, operationId)] : []),
            ],
            capabilities: inputPayload.capabilities,
            mutation: inputPayload.mutation ?? 'read-only',
            evidence: inputPayload.evidence ?? { required: 'reported' },
            role: inputPayload.role ?? targetActorId,
            budget: inputPayload.budget ?? { timeoutMs: 60000, maxRuns: 1 },
          };
          const assignment = createSessionAssignmentLocked(
            {
              coordinationId,
              taskKey: inputPayload.taskKey ?? `declared:${operationId}:auth:${inputPayload.authorizationId}`,
              actorId: targetActorId,
              contract,
              caller: { writerId: effectiveWriterId },
              authorizationProvenance: {
                operationId,
                nodeId,
                authorizationId: inputPayload.authorizationId,
                invocationKey: inputPayload.invocationKey,
                contextGrant: { refs: [...(inputPayload.grantedContextRefs ?? [])] },
              },
            },
            paths,
            engineOpts,
          );
          return {
            coordinationId,
            kind: 'authorize-and-dispatch',
            status: 'dispatched',
            actionKey,
            authorizationId: inputPayload.authorizationId,
            assignmentId: assignment.assignmentId,
            assignment,
          };
        }

        case 'dispatch-operation': {
          const operationId = target?.operationId;
          const targetActorId = target?.actorId;
          const contract = {
            objective: inputPayload.objective,
            expectedOutputs: inputPayload.expectedOutputs,
            contextRefs: inputPayload.contextRefs ?? [],
            constraints: [
              ...(inputPayload.constraints ?? []),
              ...(definition && operationId ? [protocolOperationStamp(definition, operationId)] : []),
            ],
            capabilities: inputPayload.capabilities,
            mutation: inputPayload.mutation ?? 'read-only',
            evidence: inputPayload.evidence ?? { required: 'reported' },
            role: inputPayload.role ?? targetActorId,
            budget: inputPayload.budget ?? { timeoutMs: 60000, maxRuns: 1 },
          };
          const assignment = createSessionAssignmentLocked(
            {
              coordinationId,
              taskKey: inputPayload.taskKey ?? `declared:${operationId}:${targetActorId}`,
              actorId: targetActorId,
              contract,
              caller: { writerId: effectiveWriterId },
              ...(target?.authorizationId ? {
                authorizationProvenance: {
                  operationId,
                  nodeId: target.nodeId,
                  authorizationId: target.authorizationId,
                  contextGrant: { refs: inputPayload.contextRefs ?? [] },
                },
              } : {}),
            },
            paths,
            engineOpts,
          );
          return {
            coordinationId,
            kind: 'dispatch-operation',
            status: 'dispatched',
            actionKey,
            assignmentId: assignment.assignmentId,
            assignment,
          };
        }

        case 'fan-out': {
          const operationId = target?.operationId;
          const branches = inputPayload.branches ?? [];
          const dispatchedBranches = [];
          for (const branch of branches) {
            const contract = {
              objective: branch.objective ?? inputPayload.objective ?? `Fan-out branch for ${branch.actorId}`,
              expectedOutputs: branch.expectedOutputs ?? inputPayload.expectedOutputs ?? ['result.json'],
              contextRefs: branch.contextRefs ?? [],
              constraints: branch.constraints ?? [],
              mutation: 'read-only',
              evidence: branch.evidence ?? { required: 'reported' },
              role: branch.role ?? branch.actorId,
              budget: branch.budget ?? inputPayload.budget ?? { timeoutMs: 60000, maxRuns: 1 },
            };
            const assignment = createSessionAssignmentLocked(
              {
                coordinationId,
                taskKey: branch.taskKey ?? `research-branch:${branch.actorId}`,
                actorId: branch.actorId,
                contract,
                caller: { writerId: effectiveWriterId },
              },
              paths,
              engineOpts,
            );
            dispatchedBranches.push({
              actorId: branch.actorId,
              assignmentId: assignment.assignmentId,
              status: 'dispatched',
              objective: contract.objective,
              expectedOutputs: contract.expectedOutputs,
            });
          }
          return {
            coordinationId,
            kind: 'fan-out',
            status: 'dispatched',
            actionKey,
            branches: dispatchedBranches,
          };
        }

        default:
          throw new CoordinationError('validation', `executeCoordinationActionUseCase: unsupported action kind "${kind}"`);
      }
    },
    engineOpts,
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
