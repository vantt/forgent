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
    // Unit I21 (Phase 5 item 2): lets composeStartRequest bind every node's
    // default executor from its own operation's policy.capability, never
    // just the entry node -- optional, absent ctx.runnerConfig keeps this a
    // byte-for-byte no-op (composeStartRequest's own rollback contract).
    runnerConfig: ctx.runnerConfig,
    // Fix H2 (red-team round 1): a top-priority `--executor` flag must
    // suppress computed capability bindings, not be silently outranked by
    // them -- see composers.mjs's `withComputedActorBindings` doc comment.
    cliExecutor: options.cliExecutor ?? options.executor,
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

    // 8. Validate actors -- compare only the CALLER-DECLARED roster
    // (`options.actors`, the raw pre-merge array, never `requestObject.actors`)
    // against what the session durably owns.
    //
    // Fix (round 3): `requestObject.actors` is `composeStartRequest`'s fully
    // MERGED roster -- for a declared-protocol session it always includes
    // `withComputedActorBindings`'s own capability-computed additions/fields
    // (Unit I21) on top of anything the caller declared. Comparing THAT
    // against `existingManifest.actors` broke idempotent retry for every
    // session with even one capability-resolvable actor, because the two
    // sides can never carry comparable data in the first place:
    //   - `role` is schema-forbidden on EVERY entry a request's `actors[]`
    //     can ever carry (schema.mjs's `ACTOR_ALLOWED_KEYS`/"actor-role
    //     rewrite rejected", R2) -- it is not merely absent on computed
    //     additions, it can never be present on a caller-declared entry
    //     either. `existingManifest.actors[i].role`, by contrast, always
    //     carries a real, non-empty string (`openDeclaredProtocolSession`
    //     copies it straight from the protocol's own `spec.actors[]`). This
    //     pair can never match, so the OLD comparison threw on ANY populated
    //     `actors[]` regardless of whether the request had changed at all --
    //     a pre-existing defect (present since the commit that introduced
    //     this block, 232ef31e1, well before I21) that simply never fired
    //     before because callers rarely passed non-empty `actors[]` on a
    //     `start` retry until I21 made that the default.
    //   - `executor`/`model`/`tier`/`invocation`/`fallbackExecutors` are
    //     per-request dispatch policy applied only at `dispatchDeclaredOperation`
    //     time (`actorPolicyFields`, run.mjs) -- they are NEVER written into
    //     `manifest.actors` for a declared-protocol session (confirmed by
    //     tracing every write site: `openDeclaredProtocolSession`,
    //     `openStandaloneSession`, `bindActor`). run.mjs's own dispatch
    //     warning says this outright: "The roster is per-request, not
    //     per-session: a resumed session must repeat actors[] to keep its
    //     bindings." Comparing them against the manifest can therefore never
    //     validly detect "did the caller ask for something different than
    //     last time" -- there is nothing durable to diff against, and a
    //     caller is free to change these per retry by design.
    // The only two properties the manifest genuinely, durably owns for a
    // declared-protocol actor are its IDENTITY (is this id even bound to
    // this session) and its `persona` (copied verbatim from the protocol's
    // own `spec.actors[]`, never overwritten by a request) -- those are the
    // only two a conflict can honestly be judged against.
    if (existingKind === 'declared-protocol') {
      const callerActors = Array.isArray(options.actors) ? options.actors : [];
      const boundActorById = new Map((existingManifest.actors ?? []).map((a) => [a.id, a]));
      for (const actor of callerActors) {
        const bound = boundActorById.get(actor.id);
        if (!bound) {
          throw new CoordinationError(
            'payload-conflict',
            `coordination start: session "${coordinationId}" already exists with different actors configuration -- "${actor.id}" is not one of its bound actors (${[...boundActorById.keys()].join(', ')})`,
          );
        }
        if (actor.persona !== undefined && actor.persona !== bound.persona) {
          throw new CoordinationError(
            'payload-conflict',
            `coordination start: session "${coordinationId}" already exists with different actors configuration -- "${actor.id}" is bound with persona "${bound.persona ?? '(none)'}", cannot start with "${actor.persona}"`,
          );
        }
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
