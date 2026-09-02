// run.mjs — the use-case behind `fgos coordination run --file <request>`
// (R1) AND the headless adapter's one entry point (R4). This is the ONLY
// place a coordination request is turned into engine calls; both the
// interactive CLI (bin/fgos.mjs) and the headless adapter
// (src/runner/coordination/headless-adapter.mjs) call this exact function
// -- neither ever forks or reimplements schema/planning/protocol/dispatch/
// evidence/recovery/quorum/budget logic. Every engine call here goes
// THROUGH src/runner/coordination/session-engine.mjs's existing, hardened
// public exports (P00-P06) -- this module never imports store.mjs/
// replay.mjs/schema.mjs directly for anything but the protocol-membership
// check below, which reuses the SAME loadCoordinationProtocol the engine
// itself calls, never a second copy of protocol-loading logic.
//
// "run is synchronous in V1" (R1): every step in a request's `steps` array
// (or the single `task` for an agent-led request) is awaited in order
// before this function returns; a `fan-out` step dispatches its own
// branches concurrently (via dispatchResearchFanOut, itself part of the
// hardened engine), but steps themselves never overlap.
import fs from 'node:fs';
import path from 'node:path';
import { StoreError } from '../../state/store.mjs';
import { CoordinationError } from '../../runner/coordination/schema.mjs';
import {
  openStandaloneSession,
  openDeclaredProtocolSession,
  dispatchPrimaryTask,
  dispatchDeclaredOperation,
  dispatchResearchFanOut,
  evaluateSessionQuorum,
  closeSessionByQuorum,
  deriveSessionPhase,
} from '../../runner/coordination/session-engine.mjs';
import { loadCoordinationProtocol } from '../../runner/definitions/protocol-loader.mjs';
import { validateCoordinationRequest } from './schema.mjs';

function readRequestFile(requestPath) {
  let raw;
  try {
    raw = fs.readFileSync(requestPath, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new StoreError('validation', `coordination run: request file not found at "${requestPath}"`);
    }
    throw err;
  }
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new StoreError('validation', `coordination run: request file "${requestPath}" is not valid JSON: ${err.message}`);
  }
}

// Resolves an "actors[]" trusted policy entry into the {preferExecutor,
// minTier, preferPersona} shape session-engine.mjs's `cliPolicy`/
// `cliOverride` parameters accept (assignment-policy.mjs's ALLOWED_POLICY_KEYS
// shape, mirrored). `model` is intentionally NOT included here -- see
// buildCliOverrideForActor's own doc comment below for why the declared-
// protocol dispatch path has no engine channel for it.
function actorPolicyFields(actorEntry, { globalExecutor, globalTier } = {}) {
  const preferExecutor = actorEntry?.executor ?? globalExecutor;
  const minTier = actorEntry?.tier ?? globalTier;
  const preferPersona = actorEntry?.persona;
  return {
    ...(preferExecutor !== undefined ? { preferExecutor } : {}),
    ...(minTier !== undefined ? { minTier } : {}),
    ...(preferPersona !== undefined ? { preferPersona } : {}),
  };
}

function findActor(actors, id) {
  return actors.find((a) => a.id === id);
}

// dispatchDeclaredOperation (session-engine.mjs) builds its OWN
// `opts.cliOverride` internally from a resolved PolicyPatch stack that only
// ever carries {minTier, preferPersona, preferExecutor, fallbackExecutors,
// visibility} -- confirmed by reading its body: nothing in that function
// ever copies a `model` field from `cliPolicy` into the `cliOverride` it
// forwards. dispatchPrimaryTask, by contrast, forwards `opts` (including
// any `opts.cliOverride.model`) straight through unmodified to
// executeAssignment's own policy resolver (assignment-policy.mjs reads
// `cliOverride.model` directly). This is a genuine, confirmed engine
// asymmetry, not an oversight of this cell -- see the report for the full
// reasoning. Consequence: `--model`/`actors[].model` is honored for
// kind:"agent-led" (single-actor) requests, but is refused up front for
// kind:"declared-protocol" requests rather than silently dropped.
function assertModelSupportedForKind(kind, { globalModel, actors }) {
  if (kind === 'agent-led') return;
  const anyActorModel = actors.some((a) => a.model !== undefined);
  if (globalModel !== undefined || anyActorModel) {
    throw new StoreError(
      'validation',
      'coordination run: --model / actors[].model is not supported for kind:"declared-protocol" requests -- dispatchDeclaredOperation\'s PolicyPatch scope stack (session-engine.mjs) has no model-override channel today (only minTier/preferPersona/preferExecutor/fallbackExecutors/visibility flow through it); pass --executor/--tier instead, or use a kind:"agent-led" request for a single-actor session',
    );
  }
}

// Resolves a "$ref:<label>" / "$ref:<label>.<actorId>" placeholder against
// this run's own already-dispatched assignment ids, or returns the value
// unchanged when it is not a $ref (a literal, already safe-charset-checked
// id -- an advanced/resume use case).
function resolveRef(value, labels, fieldLabel) {
  if (value === undefined || !value.startsWith('$ref:')) return value;
  const body = value.slice('$ref:'.length);
  const [refLabel, refActor] = body.split('.');
  if (!(refLabel in labels)) {
    throw new StoreError('validation', `coordination run: ${fieldLabel} references unknown step label "${refLabel}"`);
  }
  const resolved = labels[refLabel];
  if (refActor !== undefined) {
    if (typeof resolved !== 'object' || resolved === null || !(refActor in resolved)) {
      throw new StoreError('validation', `coordination run: ${fieldLabel} references unknown fan-out branch actor "${refActor}" under step label "${refLabel}"`);
    }
    return resolved[refActor];
  }
  if (typeof resolved !== 'string') {
    throw new StoreError('validation', `coordination run: ${fieldLabel} references step label "${refLabel}", which is a fan-out step -- a single-assignment reference needs "$ref:${refLabel}.<actorId>"`);
  }
  return resolved;
}

function resolveRefArray(values, labels, fieldLabel) {
  return values.map((v, i) => resolveRef(v, labels, `${fieldLabel}[${i}]`));
}

function summarizeDispatch({ assignment, runResult }) {
  return {
    assignmentId: assignment.assignmentId,
    status: runResult.status,
    confidence: runResult.confidence,
    executor: runResult.policy?.provenance?.executor?.value ?? null,
    provider: runResult.policy?.provenance?.provider?.value ?? null,
    tier: runResult.policy?.provenance?.tier?.value ?? null,
  };
}

/**
 * Run one coordination request end to end, synchronously (R1). This is the
 * ONE shared entry point the interactive CLI and the headless adapter both
 * call -- see this module's header comment.
 *
 * @param {object} ctx Workspace/engine options: `{cwd, repoRoot, runnerConfig?, timeoutMs?, packageRoot?}`.
 * @param {object} options
 * @param {string} [options.requestPath] Path to a request JSON file (interactive CLI's own `--file`).
 * @param {object} [options.requestObject] An already-parsed request object (headless adapter's own in-memory door). Exactly one of `requestPath`/`requestObject` must be given.
 * @param {string} [options.cliExecutor] Global trusted `--executor` (R1).
 * @param {string} [options.cliModel] Global trusted `--model` (R1, agent-led only -- see assertModelSupportedForKind).
 * @param {string} [options.cliTier] Global trusted `--tier` (R1).
 * @returns {Promise<object>} The `fgos.v1` data payload.
 */
export async function runCoordinationUseCase(ctx, options = {}) {
  const { requestPath, requestObject, cliExecutor, cliModel, cliTier } = options;
  if ((requestPath === undefined) === (requestObject === undefined)) {
    throw new StoreError('validation', 'coordination run: exactly one of requestPath or requestObject must be given');
  }
  const raw = requestObject !== undefined ? requestObject : readRequestFile(requestPath);
  const request = validateCoordinationRequest(raw, { executor: cliExecutor, model: cliModel, tier: cliTier });
  assertModelSupportedForKind(request.kind, { globalModel: cliModel, actors: request.actors });

  const engineOpts = { cwd: ctx.cwd, repoRoot: ctx.repoRoot, packageRoot: ctx.packageRoot, runnerConfig: ctx.runnerConfig, timeoutMs: ctx.timeoutMs };
  const openParams = {
    coordinationId: request.coordinationId,
    objective: request.objective,
    writerId: request.writerId,
    workRef: request.workRef,
    aggregateBounds: request.aggregateBounds,
    partialPolicy: request.partialPolicy,
  };

  const stepResults = [];
  let manifest;
  let fanOutFailure = null;

  if (request.kind === 'agent-led') {
    manifest = openStandaloneSession({ ...openParams, primaryRole: request.primaryRole }, engineOpts);
    const primaryActor = findActor(request.actors, 'primary');
    const cliOverride = {
      ...actorPolicyFields(primaryActor, { globalExecutor: cliExecutor, globalTier: cliTier }),
      ...(primaryActor?.model !== undefined ? { model: primaryActor.model } : cliModel !== undefined ? { model: cliModel } : {}),
    };
    const labels = {};
    const contextRefs = resolveRefArray(request.task.contextRefs, labels, 'task.contextRefs');
    const dispatch = await dispatchPrimaryTask(
      manifest.coordinationId,
      {
        taskKey: request.task.taskKey,
        objective: request.objective,
        contextRefs,
        constraints: request.task.constraints,
        expectedOutputs: request.task.expectedOutputs,
        evidenceRequired: request.task.evidenceRequired,
        capabilities: request.task.capabilities,
        writerId: request.writerId,
      },
      { ...engineOpts, ...(Object.keys(cliOverride).length > 0 ? { cliOverride } : {}) },
    );
    stepResults.push({ as: 'primary', type: 'operation', actorId: 'primary', ...summarizeDispatch(dispatch) });
  } else {
    const definition = loadCoordinationProtocol(request.protocolRef.id, { cwd: ctx.cwd, packageRoot: ctx.packageRoot });
    const declaredActorIds = new Set((definition.spec.actors ?? []).map((a) => a.id));
    for (const actorEntry of request.actors) {
      if (!declaredActorIds.has(actorEntry.id)) {
        throw new StoreError(
          'validation',
          `coordination request: actors[].id "${actorEntry.id}" is not declared by protocol "${request.protocolRef.id}" (declared actors: ${[...declaredActorIds].join(', ')}) -- unregistered actor override rejected`,
        );
      }
    }
    // dispatchResearchFanOut (session-engine.mjs) accepts NO caller-supplied
    // per-branch policy at all -- it always builds its own
    // `cliPolicy: {preferExecutor: allocation.executorId, minTier:
    // allocation.tier}` from planCohort's own allocation, with no parameter
    // path for this function to override it. An `actors[]` policy entry for
    // an actor that only ever appears in a fan-out step's branches would
    // therefore have NO real effect if silently accepted -- refused up
    // front instead (never "silently accepting" a no-op override, per this
    // cell's own bug taxonomy).
    const fanOutActorIds = new Set(request.steps.filter((s) => s.type === 'fan-out').flatMap((s) => s.branches.map((b) => b.actorId)));
    for (const actorEntry of request.actors) {
      if (fanOutActorIds.has(actorEntry.id) && (actorEntry.persona !== undefined || actorEntry.executor !== undefined || actorEntry.model !== undefined || actorEntry.tier !== undefined)) {
        throw new StoreError(
          'validation',
          `coordination request: actors[].id "${actorEntry.id}" declares policy (persona/executor/model/tier), but this actor only ever appears as a fan-out branch -- dispatchResearchFanOut has no per-branch policy-override channel (cohort planner governs fan-out actor allocation exclusively), so this override would silently have no effect`,
        );
      }
    }
    manifest = openDeclaredProtocolSession({ ...openParams, definitionId: request.protocolRef.id }, engineOpts);

    const labels = {};
    for (const step of request.steps) {
      if (step.type === 'operation') {
        const actorEntry = step.targetActorId ? findActor(request.actors, step.targetActorId) : undefined;
        const cliPolicy = actorPolicyFields(actorEntry, { globalExecutor: cliExecutor, globalTier: cliTier });
        const contextRefs = resolveRefArray(step.contextRefs, labels, `steps[${step.as}].contextRefs`);
        const fromAssignmentId = resolveRef(step.fromAssignmentId, labels, `steps[${step.as}].fromAssignmentId`);
        // eslint-disable-next-line no-await-in-loop -- R1: steps run sequentially, by design.
        const dispatch = await dispatchDeclaredOperation(
          manifest.coordinationId,
          {
            operationId: step.operationId,
            targetActorId: step.targetActorId,
            objective: step.objective,
            expectedOutputs: step.expectedOutputs,
            contextRefs,
            constraints: step.constraints,
            capabilities: step.capabilities,
            writerId: request.writerId,
            fromAssignmentId,
            intent: step.intent,
            round: step.round,
            taskKey: step.taskKey,
            ...(Object.keys(cliPolicy).length > 0 ? { cliPolicy } : {}),
          },
          engineOpts,
        );
        labels[step.as] = dispatch.assignment.assignmentId;
        // `targetActorId` is reported as given; when the caller omits it
        // (a single-actor-per-operation template), the engine's own
        // resolveDeclaredOperationActor resolves it internally and does not
        // return it on `dispatch` -- reported `null` rather than guessed.
        stepResults.push({ as: step.as, type: 'operation', actorId: step.targetActorId ?? null, ...summarizeDispatch(dispatch) });
      } else {
        const fromAssignmentId = resolveRef(step.fromAssignmentId, labels, `steps[${step.as}].fromAssignmentId`);
        const branches = step.branches.map((branch) => ({
          actorId: branch.actorId,
          objective: branch.objective,
          expectedOutputs: branch.expectedOutputs,
          constraints: branch.constraints,
          capabilities: branch.capabilities,
          fromAssignmentId: resolveRef(branch.fromAssignmentId, labels, `steps[${step.as}].branches[${branch.actorId}].fromAssignmentId`) ?? fromAssignmentId,
          intent: branch.intent,
          taskKey: branch.taskKey,
        }));
        // eslint-disable-next-line no-await-in-loop -- R1: steps run sequentially; branches within a fan-out step dispatch concurrently inside the engine.
        const fanOut = await dispatchResearchFanOut(
          manifest.coordinationId,
          { operationId: step.operationId, branches, writerId: request.writerId, fromAssignmentId },
          engineOpts,
        );
        if (fanOut.status !== 'dispatched') {
          fanOutFailure = { as: step.as, status: fanOut.status, reason: fanOut.reason ?? null };
          stepResults.push({ as: step.as, type: 'fan-out', status: fanOut.status, reason: fanOut.reason ?? null, branches: [] });
          break;
        }
        const branchAssignmentIds = {};
        const branchSummaries = fanOut.branches.map((b) => {
          if (b.status === 'fulfilled') branchAssignmentIds[b.actorId] = b.result.assignment.assignmentId;
          return {
            actorId: b.actorId,
            status: b.status,
            ...(b.status === 'fulfilled' ? summarizeDispatch(b.result) : { error: b.error }),
          };
        });
        labels[step.as] = branchAssignmentIds;
        stepResults.push({ as: step.as, type: 'fan-out', status: 'dispatched', branches: branchSummaries });
      }
    }
  }

  const quorumBeforeClose = evaluateSessionQuorum(manifest.coordinationId, engineOpts);
  let closed = false;
  let closeRefusalReason = null;
  try {
    closeSessionByQuorum(manifest.coordinationId, {}, engineOpts);
    closed = true;
  } catch (err) {
    if (err instanceof CoordinationError) {
      closeRefusalReason = err.message;
    } else {
      throw err;
    }
  }
  const finalQuorum = closed ? evaluateSessionQuorum(manifest.coordinationId, engineOpts) : quorumBeforeClose;
  const phase = deriveSessionPhase(manifest.coordinationId, engineOpts);

  return {
    coordinationId: manifest.coordinationId,
    kind: request.kind,
    definitionRef: manifest.definitionRef,
    objective: manifest.objective,
    status: phase,
    closed,
    closeAttempted: true,
    ...(closeRefusalReason !== null ? { closeRefusalReason } : {}),
    ...(fanOutFailure !== null ? { fanOutFailure } : {}),
    quorum: finalQuorum,
    steps: stepResults,
  };
}
