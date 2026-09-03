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
// TWO deliberate exceptions to that import rule, both from store.mjs:
// `recordDriverDisposition` and `readSessionEvents`. A disposition is
// driver ledger state about a ref -- it resolves no binding, materializes
// nothing, and has no FlowDefinition-aware counterpart in session-engine.mjs
// to delegate to, so store.mjs's door IS the door (it does its own shape
// validation, active-session check, driver-identity pin, and lock-held
// append). `readSessionEvents` reads back the real persisted
// `operation-authorized` event on an "authorize" step's idempotent
// (appended: false) path, so the reported step result never echoes a
// repeat call's own (possibly different) payload as if it were now in
// force -- session-engine.mjs has no equivalent read either. Importing both
// here reaches the real doors rather than reimplementing any part of them.
//
// "run is synchronous in V1" (R1): every step in a request's `steps` array
// (or the single `task` for an agent-led request) is awaited in order
// before this function returns; a `fan-out` step dispatches its own
// branches concurrently (via dispatchResearchFanOut, itself part of the
// hardened engine), but steps themselves never overlap.
//
// Resume: a request naming an EXISTING `coordinationId` continues that
// session instead of refusing at `openSession`'s "already exists" guard
// (`findExistingManifest`, below). This reaches the SAME
// dispatchDeclaredOperation/authorizeDeclaredOperation/recordDriverDisposition
// doors every other request already uses -- never a parallel dispatch path
// -- because those doors re-read `readManifest(coordinationId, opts)` fresh
// from disk on every call; they do not care whether the session was opened
// in this process or a prior one. `findExistingManifest` refuses the whole
// request up front when a resumed request's `writerId` does not match the
// session's own `provenanceRoot.writerId` -- resume's own identity gate,
// since ordinary dispatch has no per-call identity check of its own.
import fs from 'node:fs';
import path from 'node:path';
import { StoreError } from '../../state/store.mjs';
import { CoordinationError } from '../../runner/coordination/schema.mjs';
import {
  openStandaloneSession,
  openDeclaredProtocolSession,
  resumeSession,
  dispatchPrimaryTask,
  dispatchDeclaredOperation,
  dispatchResearchFanOut,
  authorizeDeclaredOperation,
  evaluateSessionQuorum,
  closeSessionByQuorum,
  deriveSessionPhase,
} from '../../runner/coordination/session-engine.mjs';
import { recordDriverDisposition, readSessionEvents } from '../../runner/coordination/store.mjs';
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

// R4 (resume): a request naming an EXISTING `coordinationId` continues that
// session's own dispatch/authorize/disposition doors instead of refusing at
// `openSession`'s "already exists" guard. `resumeSession` (session-engine.mjs)
// is the one blessed resume door -- literally `replaySession`, re-exported
// under that name for exactly this purpose per its own doc comment ("so
// callers have one obvious 'resume' door on this module rather than reaching
// into replay.mjs directly") -- never reached into replay.mjs itself here.
// Returns the session's manifest (byte-identical in shape to what
// `openStandaloneSession`/`openDeclaredProtocolSession` themselves return,
// since both read the same `session.json` via `readManifestRaw`) when the id
// already names an open session on disk, or `undefined` when the id is unset
// or genuinely new -- the caller opens one in that case, unchanged. No
// caller-supplied id is ever ambiguous with "auto-generate": resume is only
// ever attempted for an EXPLICIT `coordinationId`.
//
// Identity gate: `dispatchDeclaredOperation`/`dispatchPrimaryTask`/
// `dispatchResearchFanOut` never compare their caller's `writerId` against
// `manifest.provenanceRoot.writerId` -- only `authorize`/`disposition` steps
// carry that check (`assertDriverIdentity`, store.mjs). Before resume
// existed this was unreachable: a single request always supplied the SAME
// `writerId` for both `openParams` and every dispatch call by construction.
// Resume removes that natural gate -- a second, independent request can name
// an EXISTING `coordinationId` with a writerId of its own choosing and reach
// ordinary dispatch under someone else's already-open session, spending the
// original driver's still-unconsumed authorizations. Asserted here, once, at
// the resume boundary, for every step kind -- mirroring
// `assertDriverIdentity`'s own check -- so a resumed request can never
// dispatch a single step under a foreign identity.
function findExistingManifest(coordinationId, writerId, engineOpts) {
  if (coordinationId === undefined) return undefined;
  let manifest;
  try {
    manifest = resumeSession(coordinationId, engineOpts).manifest;
  } catch (err) {
    if (err instanceof CoordinationError && err.category === 'not-found') return undefined;
    throw err;
  }
  if (manifest.provenanceRoot.writerId !== writerId) {
    throw new CoordinationError(
      'validation',
      `coordination run: writerId "${writerId}" is not the driver identity of session "${coordinationId}" (its provenanceRoot.writerId is "${manifest.provenanceRoot.writerId}") -- a resumed request may only dispatch under the session's own driver/provenance-root identity`,
    );
  }
  return manifest;
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

// Phase 07 (MVP7): the close-time aggregation gate.
//
// `closeSessionByQuorum` consults an aggregation only when its caller passes
// `aggregationId` -- it holds no FlowDefinition of its own at close time and
// therefore cannot notice that the bound protocol declared
// `completion.aggregation`. Until this function existed the gate had zero
// production callers (P07.3's own named gap): a protocol could declare an
// aggregation and close on quorum alone, and nothing noticed. This is the one
// place a request reaches that close, so this is where the declaration is
// turned into an enforced property.
//
// Opt-in stays opt-in at the SCHEMA level: a definition that declares no
// aggregation (every shipped protocol under `core/` today) returns `{}` and
// leaves the close byte-identical to what it was before aggregation existed.
//
// The definition is the SESSION's, never the request's. It is resolved here
// from `manifest.definitionRef` and refused on version drift -- the same four
// lines `validateSessionAggregation` and `dispatchDeclaredOperation`
// (session-engine.mjs) already use, for the same reason. A request naming a
// different `protocolRef.id` on resume, or an in-place edit of the bound
// protocol document, therefore cannot decide whether this session's close is
// gated: `findExistingManifest` resumes on `coordinationId` + `writerId`
// alone, so the requested protocol is a caller value and nothing more. The
// drift refusal deliberately runs BEFORE the declaration is read -- reading it
// first would let an edit that DROPS the declaration (bumped version and all)
// walk past the gate it just removed.
//
// The verdict is never judged here. This function only selects WHICH
// validated aggregation speaks for the session; whether that outcome permits
// a close is decided by the engine, inside its own close lock, from the event
// log.
function aggregationCloseParams(coordinationId, engineOpts) {
  const { manifest, aggregations } = resumeSession(coordinationId, engineOpts);
  // An agent-led session has no FlowDefinition bound at all -- nothing can
  // declare an aggregation over it.
  if (!manifest.definitionRef) return {};
  const definition = loadCoordinationProtocol(manifest.definitionRef.id, { cwd: engineOpts.cwd, packageRoot: engineOpts.packageRoot });
  if (definition.metadata.version !== manifest.definitionRef.version) {
    throw new CoordinationError(
      'validation',
      `coordination run: session "${coordinationId}" was opened against definition "${manifest.definitionRef.id}@${manifest.definitionRef.version}", but the resolved definition is now version "${definition.metadata.version}" -- refusing to close against a drifted definition`,
    );
  }
  if (definition?.spec?.profile?.completion?.aggregation === undefined) return {};
  if (aggregations.length === 0) {
    throw new CoordinationError(
      'validation',
      `coordination run: protocol "${definition.metadata.id}" declares completion.aggregation, but session "${coordinationId}" has validated no aggregation -- refusing to close a declared-aggregation protocol on quorum alone (validate one through validateSessionAggregation, then resume this session to close it)`,
    );
  }
  // The most recently validated aggregation is the one that speaks: an earlier
  // verdict is superseded by a later validation, which is exactly the remedy
  // `closeSessionByQuorum`'s own refusal message prescribes ("resolve the
  // aggregation and validate a new one"). `aggregations` never contains a
  // post-terminal record -- replay neutralizes those into
  // `ignoredAggregations`, which is deliberately not read here.
  //
  // Known, narrow race, stated rather than overstated: this selection happens
  // outside the engine's close lock, and the engine re-checks only the id it
  // is handed. A `no-consensus` validated between this read and that re-check
  // does not supersede the `consensus` already selected, so "a later
  // validation supersedes an earlier verdict" holds for every ordinary
  // sequential use but is not enforced atomically. Both writes need the SAME
  // driver identity and an active session, so this is a same-driver race, not
  // a cross-actor exposure.
  return { aggregationId: aggregations[aggregations.length - 1].aggregationId };
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
    manifest =
      findExistingManifest(request.coordinationId, request.writerId, engineOpts) ??
      openStandaloneSession({ ...openParams, primaryRole: request.primaryRole }, engineOpts);
    const primaryActor = findActor(request.actors, 'primary');
    const cliOverride = {
      ...actorPolicyFields(primaryActor, { globalExecutor: cliExecutor, globalTier: cliTier }),
      ...(primaryActor?.model !== undefined ? { model: primaryActor.model } : cliModel !== undefined ? { model: cliModel } : {}),
    };
    const labels = Object.create(null);
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
    manifest =
      findExistingManifest(request.coordinationId, request.writerId, engineOpts) ??
      openDeclaredProtocolSession({ ...openParams, definitionId: request.protocolRef.id }, engineOpts);

    // The driver whose authority an "authorize"/"disposition" step writes
    // under. There is exactly one legal value: the engine pins both events
    // to `manifest.provenanceRoot.writerId`, which openParams just set from
    // `request.writerId`. Derived rather than accepted from the request --
    // see schema.mjs's assertNoAuthorizedBy.
    const driverIdentity = { type: 'driver', id: request.writerId };

    const labels = Object.create(null);
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
      } else if (step.type === 'authorize') {
        const grantedContextRefs = resolveRefArray(step.grantedContextRefs, labels, `steps[${step.as}].grantedContextRefs`);
        const targetArtifactRef = resolveRef(step.targetArtifactRef, labels, `steps[${step.as}].targetArtifactRef`);
        const authorization = authorizeDeclaredOperation(
          manifest.coordinationId,
          {
            operationId: step.operationId,
            targetActorId: step.targetActorId,
            nodeId: step.nodeId,
            authorizationId: step.authorizationId,
            invocationKey: step.invocationKey,
            authorizedBy: driverIdentity,
            reason: step.reason,
            grantedContextRefs,
            targetArtifactRef,
          },
          engineOpts,
        );
        // On the idempotent (appended: false) path, `authorizeOperation`
        // (store.mjs) returns THIS CALL's own payload, not the
        // already-persisted event -- a repeat `authorize` step naming an
        // `authorizationId` that already exists, with DIFFERENT fields
        // (a different grant, key, or reason), would otherwise report
        // those different fields back as if they were now in force, when
        // the persisted event -- the one `dispatchDeclaredOperation`'s gate
        // actually reads -- never changed. Read the real event back on this
        // path so the step result is always truthful, never echoed intent.
        const persistedAuthorization = authorization.appended
          ? authorization
          : readSessionEvents(manifest.coordinationId, engineOpts).find(
              (event) => event.type === 'operation-authorized' && event.payload.authorizationId === authorization.authorizationId,
            ).payload;
        // No `labels[step.as]` entry: this step materializes no Assignment,
        // so a later `$ref:<label>` pointing at it has nothing to resolve to
        // and is refused by resolveRef's own unknown-label check.
        stepResults.push({
          as: step.as,
          type: 'authorize',
          operationId: persistedAuthorization.operationId,
          nodeId: persistedAuthorization.nodeId,
          actorId: persistedAuthorization.targetActorId,
          authorizationId: persistedAuthorization.authorizationId,
          invocationKey: persistedAuthorization.invocationKey,
          grantedContextRefs: persistedAuthorization.grantedContextRefs,
          targetArtifactRef: persistedAuthorization.targetArtifactRef ?? null,
          appended: authorization.appended,
        });
      } else if (step.type === 'disposition') {
        const targetRef = resolveRef(step.targetRef, labels, `steps[${step.as}].targetRef`);
        const evidenceRefs = resolveRefArray(step.evidenceRefs, labels, `steps[${step.as}].evidenceRefs`);
        const disposition = recordDriverDisposition(
          manifest.coordinationId,
          {
            targetRef,
            disposition: step.disposition,
            rationale: step.rationale,
            evidenceRefs,
            authorizedBy: driverIdentity,
          },
          engineOpts,
        );
        stepResults.push({
          as: step.as,
          type: 'disposition',
          targetRef: disposition.targetRef,
          disposition: disposition.disposition,
          evidenceRefs: disposition.evidenceRefs,
          appended: disposition.appended,
        });
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
    closeSessionByQuorum(manifest.coordinationId, aggregationCloseParams(manifest.coordinationId, engineOpts), engineOpts);
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
