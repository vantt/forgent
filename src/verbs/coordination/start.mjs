// verbs/coordination/start.mjs — public start use case (Unit 2B).
// Deterministically composes a start request, verifies idempotent resume/conflict rules,
// and invokes existing runCoordinationUseCase without direct store mutation.

import fs from 'node:fs';
import path from 'node:path';
import {
  CoordinationError,
  applyAggregateBoundDefaults,
} from '../../runner/coordination/schema.mjs';
import {
  readManifest,
  readSessionEvents,
} from '../../runner/coordination/store.mjs';
import { replaySession } from '../../runner/coordination/replay.mjs';
import { loadCoordinationProtocol } from '../../runner/definitions/protocol-loader.mjs';
import {
  composeStartRequest,
  canonicalJson,
} from './composers.mjs';
import { runCoordinationUseCase } from './run.mjs';
import { resolveRepoRoot, fgosDirFromRoot } from '../../runner/paths.mjs';

/**
 * Use case: Start a new coordination session or idempotently resume an existing one.
 *
 * @param {object} ctx `{ cwd, repoRoot, packageRoot?, runnerConfig? }`
 * @param {object} options Start parameters
 * @returns {Promise<object>} Standard fgos.v1 start outcome
 */
export async function startCoordinationUseCase(ctx, options = {}) {
  const engineOpts = {
    cwd: ctx.cwd,
    repoRoot: ctx.repoRoot,
    packageRoot: ctx.packageRoot,
  };

  const writerId = options.writerId ?? options['writer-id'];
  const objective = options.objective;
  const protocolId = options.protocolId ?? options.protocol ?? options.protocolRef?.id;
  const kind = options.kind ?? (protocolId ? 'declared-protocol' : 'agent-led');

  let definition = null;
  if (kind === 'declared-protocol' && protocolId && (!options.steps || options.steps.length === 0)) {
    try {
      definition = loadCoordinationProtocol(protocolId, { cwd: ctx.cwd, packageRoot: ctx.packageRoot });
    } catch (err) {
      throw new CoordinationError(
        'validation',
        `coordination start: protocol "${protocolId}" could not be resolved: ${err.message}`,
      );
    }
  }

  const requestObject = composeStartRequest({
    ...options,
    kind,
    coordinationId: options.coordinationId ?? options.id,
    writerId,
    objective,
    protocolId,
    definition,
  });

  const coordinationId = requestObject.coordinationId;

  // Check if session already exists for idempotent start and conflict detection
  let existingManifest = null;
  try {
    existingManifest = readManifest(coordinationId, engineOpts);
  } catch (err) {
    if (!(err instanceof CoordinationError && err.category === 'not-found')) {
      throw err;
    }
  }

  if (existingManifest) {
    // 1. Validate writer identity
    if (existingManifest.provenanceRoot?.writerId !== requestObject.writerId) {
      throw new CoordinationError(
        'unauthorized',
        `coordination start: writerId "${requestObject.writerId}" does not match driver identity "${existingManifest.provenanceRoot?.writerId}" of existing session "${coordinationId}"`,
      );
    }

    // 2. Validate kind
    const existingKind = existingManifest.definitionRef ? 'declared-protocol' : 'agent-led';
    if (requestObject.kind !== existingKind) {
      throw new CoordinationError(
        'payload-conflict',
        `coordination start: session "${coordinationId}" already exists as kind "${existingKind}", cannot start as "${requestObject.kind}"`,
      );
    }

    // 3. Validate protocol ID (for declared-protocol)
    if (existingKind === 'declared-protocol' && existingManifest.definitionRef?.id !== requestObject.protocolRef?.id) {
      throw new CoordinationError(
        'payload-conflict',
        `coordination start: session "${coordinationId}" already exists with protocol "${existingManifest.definitionRef?.id}", cannot start with "${requestObject.protocolRef?.id}"`,
      );
    }

    // 4. Validate objective
    if (existingManifest.objective !== requestObject.objective) {
      throw new CoordinationError(
        'payload-conflict',
        `coordination start: session "${coordinationId}" already exists with different objective ("${existingManifest.objective}" vs "${requestObject.objective}")`,
      );
    }

    // 5. Validate workRef
    const existingWorkRef = existingManifest.workRef ?? null;
    const newWorkRef = requestObject.workRef ?? null;
    if (existingWorkRef !== newWorkRef) {
      throw new CoordinationError(
        'payload-conflict',
        `coordination start: session "${coordinationId}" already exists with workRef "${existingWorkRef}", cannot start with "${newWorkRef}"`,
      );
    }

    // 6. Validate aggregateBounds
    const existingBounds = existingManifest.aggregateBounds;
    const newBounds = applyAggregateBoundDefaults(requestObject.aggregateBounds);
    if (canonicalJson(existingBounds) !== canonicalJson(newBounds)) {
      throw new CoordinationError(
        'payload-conflict',
        `coordination start: session "${coordinationId}" already exists with different aggregateBounds`,
      );
    }

    // 7. Validate partialPolicy
    const existingPartial = existingManifest.partialPolicy ?? null;
    const newPartial = requestObject.partialPolicy ?? null;
    if (canonicalJson(existingPartial) !== canonicalJson(newPartial)) {
      throw new CoordinationError(
        'payload-conflict',
        `coordination start: session "${coordinationId}" already exists with different partialPolicy`,
      );
    }

    // 8. Validate actors
    if (existingKind === 'declared-protocol' && requestObject.actors && requestObject.actors.length > 0) {
      const existingActors = (existingManifest.actors ?? []).map((a) => ({
        id: a.id,
        role: a.role,
        ...(a.persona !== undefined ? { persona: a.persona } : {}),
        ...(a.policy !== undefined ? { policy: a.policy } : {}),
      }));
      const newActors = requestObject.actors.map((a) => ({
        id: a.id,
        role: a.role,
        ...(a.persona !== undefined ? { persona: a.persona } : {}),
        ...(a.policy !== undefined ? { policy: a.policy } : {}),
      }));
      if (canonicalJson(existingActors) !== canonicalJson(newActors)) {
        throw new CoordinationError(
          'payload-conflict',
          `coordination start: session "${coordinationId}" already exists with different actors configuration`,
        );
      }
    }

    // 9. Validate initial steps / operations
    if (Array.isArray(requestObject.steps) && requestObject.steps.length > 0) {
      const replayed = replaySession(coordinationId, engineOpts);
      const root = engineOpts.repoRoot ?? resolveRepoRoot(engineOpts.cwd, { strict: true }) ?? engineOpts.cwd;
      const fgosDir = fgosDirFromRoot(root);
      const existingStepOps = (replayed.assignmentRefs ?? []).map((id) => {
        const asgnPath = path.join(fgosDir, 'assignments', id, 'assignment.json');
        if (fs.existsSync(asgnPath)) {
          const asgnData = JSON.parse(fs.readFileSync(asgnPath, 'utf8'));
          const constraints = asgnData?.provenance?.inline?.contract?.constraints ?? asgnData?.provenance?.contract?.constraints ?? [];
          const constraint = constraints.find((c) => typeof c === 'string' && c.startsWith('protocol-operation:'));
          if (constraint) {
            const hashIdx = constraint.lastIndexOf('#');
            if (hashIdx !== -1) return constraint.slice(hashIdx + 1);
          }
          const taskKey = asgnData?.provenance?.taskKey ?? '';
          if (taskKey.startsWith('declared:')) {
            const parts = taskKey.split(':');
            return parts[1];
          }
        }
        return null;
      }).filter(Boolean);

      if (existingStepOps.length > 0) {
        for (let idx = 0; idx < requestObject.steps.length; idx++) {
          const reqStep = requestObject.steps[idx];
          const existingOpId = existingStepOps[idx];
          if (existingOpId && reqStep.operationId && existingOpId !== reqStep.operationId) {
            throw new CoordinationError(
              'payload-conflict',
              `coordination start: session "${coordinationId}" already exists with different initial steps (${existingOpId} vs ${reqStep.operationId})`,
            );
          }
        }
      }
    }

    // 10. Validate task for agent-led
    if (existingKind === 'agent-led' && requestObject.task) {
      const replayed = replaySession(coordinationId, engineOpts);
      const root = engineOpts.repoRoot ?? resolveRepoRoot(engineOpts.cwd, { strict: true }) ?? engineOpts.cwd;
      const fgosDir = fgosDirFromRoot(root);
      const sessionDir = path.join(fgosDir, 'coordination', 'sessions', coordinationId);

      if (requestObject.task.taskKey) {
        const tasksDir = path.join(sessionDir, 'tasks');
        if (fs.existsSync(tasksDir)) {
          const taskFiles = fs.readdirSync(tasksDir).filter((f) => f.endsWith('.json'));
          const claimedKeys = taskFiles.map((f) => {
            try {
              return JSON.parse(fs.readFileSync(path.join(tasksDir, f), 'utf8')).taskKey;
            } catch {
              return null;
            }
          }).filter(Boolean);
          if (claimedKeys.length > 0 && !claimedKeys.includes(requestObject.task.taskKey)) {
            throw new CoordinationError(
              'payload-conflict',
              `coordination start: session "${coordinationId}" already exists with different taskKey ("${claimedKeys[0]}" vs "${requestObject.task.taskKey}")`,
            );
          }
        }
      }

      const primaryAsgnRef = replayed.assignmentRefs?.[0];
      if (primaryAsgnRef) {
        const asgnPath = path.join(fgosDir, 'assignments', primaryAsgnRef, 'assignment.json');
        if (fs.existsSync(asgnPath)) {
          const asgnData = JSON.parse(fs.readFileSync(asgnPath, 'utf8'));
          if (requestObject.task.expectedOutputs) {
            const existingOutputs = asgnData.expectedOutputs ?? asgnData.provenance?.inline?.contract?.expectedOutputs ?? [];
            if (canonicalJson(existingOutputs) !== canonicalJson(requestObject.task.expectedOutputs)) {
              throw new CoordinationError(
                'payload-conflict',
                `coordination start: session "${coordinationId}" already exists with different expectedOutputs`,
              );
            }
          }
        }
      }
    }

    // Identical payload resume: return existing session state without executing steps
    const replayed = replaySession(coordinationId, engineOpts);
    return {
      ok: true,
      idempotent: true,
      cached: true,
      coordinationId,
      kind: existingKind,
      status: replayed.status,
      phase: replayed.phase,
      steps: replayed.assignments?.map((a) => ({ as: a.role ?? a.actorId, ...a })) ?? [],
      protocolRef: existingManifest.definitionRef,
      boundDefinition: existingManifest.definitionRef ? { id: existingManifest.definitionRef.id } : null,
      statusDoor: `fgos coordination status ${coordinationId}`,
    };
  }

  const runResult = await runCoordinationUseCase(ctx, {
    requestObject,
    cliExecutor: options.cliExecutor ?? options.executor,
    cliModel: options.cliModel ?? options.model,
    cliTier: options.cliTier ?? options.tier,
  });

  return {
    ok: true,
    coordinationId: runResult.coordinationId,
    kind: runResult.kind,
    status: runResult.status,
    phase: runResult.phase,
    steps: runResult.steps ?? [],
    protocolRef: runResult.protocolRef ?? (protocolId ? { id: protocolId } : null),
    boundDefinition: runResult.boundDefinition ?? null,
    statusDoor: `fgos coordination status ${runResult.coordinationId}`,
  };
}
