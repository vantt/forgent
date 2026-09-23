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
// THREE deliberate exceptions to that import rule, all from store.mjs:
// `recordDriverDisposition`, `recordHumanTurn`, and `readSessionEvents`. A
// disposition is driver ledger state about a ref -- it resolves no binding,
// materializes nothing, and has no FlowDefinition-aware counterpart in
// session-engine.mjs to delegate to, so store.mjs's door IS the door (it
// does its own shape validation, active-session check, driver-identity pin,
// and lock-held append). `recordHumanTurn` (Phase 03.1) is the same shape --
// a trusted-input/human-decision provenance record is definition-blind
// ledger state, never a binding dispatch. `readSessionEvents` reads back the
// real persisted `operation-authorized` event on an "authorize" step's
// idempotent (appended: false) path, so the reported step result never
// echoes a repeat call's own (possibly different) payload as if it were now
// in force -- session-engine.mjs has no equivalent read either. Importing
// all three here reaches the real doors rather than reimplementing any part
// of them.
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
import { createHash } from 'node:crypto';
import { StoreError } from '../../state/store.mjs';
import { CoordinationError, HUMAN_TURN_REF_PREFIX, SCHEMA_VERSION_3 } from '../../runner/coordination/schema.mjs';
import {
  openStandaloneSession,
  openDeclaredProtocolSession,
  resumeSession,
  dispatchPrimaryTask,
  dispatchDeclaredOperation,
  dispatchDeclaredOperationLocked,
  dispatchResearchFanOut,
  dispatchResearchFanOutLocked,
  authorizeDeclaredOperation,
  authorizeDeclaredOperationLocked,
  linkSessionContribution,
  linkSessionContributionLocked,
  evaluateSessionQuorum,
  deriveSessionPhase,
  closeSessionByQuorum,
} from '../../runner/coordination/session-engine.mjs';
import {
  recordDriverDisposition,
  recordDriverDispositionLocked,
  recordHumanTurn,
  recordHumanTurnLocked,
  readSessionEvents,
  resolveSessionPaths,
} from '../../runner/coordination/store.mjs';
import { executeUnderActionPrecondition } from '../../runner/coordination/action-precondition.mjs';
import { canonicalizeNormalizedSteps } from '../../runner/coordination/fan-out-payload.mjs';
import { loadCoordinationProtocol } from '../../runner/definitions/protocol-loader.mjs';
import { loadDefinitionForSession } from '../../runner/coordination/session-engine.mjs';
import { validateCoordinationRequest, computeHumanTurnArtifactRevision } from './schema.mjs';
import { recordCoordinationSchemaFault } from './schema-fault-log.mjs';
import { FlowDefinitionError } from '../../runner/definitions/schema.mjs';
import { compileDagRequest } from './dag-request-compiler.mjs';
import { scheduleDagSteps } from './dag-scheduler.mjs';
import {
  getAuthoritativeSettledAssignmentIds,
  computeDagSharedCwdCaveats,
  resolveNodeCwd,
} from '../../runner/coordination/dag-declaration.mjs';

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
  // `preferInvocation` (executor-id-consolidation Step 2): only ever comes
  // from the actor entry itself (schema.mjs's `invocation` field, checked
  // there to require `executor` alongside it) -- there is no global/CLI
  // equivalent to `globalExecutor`/`globalTier` for it.
  const preferInvocation = actorEntry?.invocation;
  // `fallbackExecutors` (model-tier-vocabulary-and-coordination-fallback,
  // 2026-09-17): same "only ever comes from the actor entry itself" shape
  // as `preferInvocation` above -- no global/CLI equivalent. Reaching
  // `cliOverride.fallbackExecutors` here is the ONLY missing step for a
  // declared-protocol actor to opt into the real Provider Capacity Rotator
  // fallback (`resolveAssignmentDispatchPolicy` already reads
  // `cliOverride.fallbackExecutors ?? opPolicy.fallbackExecutors`,
  // assignment-policy.mjs) -- this does not build a new fallback mechanism.
  const fallbackExecutors = actorEntry?.fallbackExecutors;
  return {
    ...(preferExecutor !== undefined ? { preferExecutor } : {}),
    ...(preferInvocation !== undefined ? { preferInvocation } : {}),
    ...(minTier !== undefined ? { minTier } : {}),
    ...(preferPersona !== undefined ? { preferPersona } : {}),
    ...(fallbackExecutors !== undefined ? { fallbackExecutors } : {}),
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
function findExistingSession(coordinationId, writerId, engineOpts) {
  if (coordinationId === undefined) return undefined;
  let resumed;
  try {
    resumed = resumeSession(coordinationId, engineOpts);
  } catch (err) {
    if (err instanceof CoordinationError && err.category === 'not-found') {
      const { sessionDir } = resolveSessionPaths(coordinationId, engineOpts);
      if (fs.existsSync(sessionDir)) {
        throw new CoordinationError(
          'not-found',
          `coordination run: session "${coordinationId}" has a sessionDir but no readable manifest (${err.message}) -- it may have been deleted or corrupted mid-flight; not resumable and not safe to silently treat as brand-new`,
        );
      }
      return undefined;
    }
    throw err;
  }
  const { manifest } = resumed;
  if (manifest.provenanceRoot.writerId !== writerId) {
    throw new CoordinationError(
      'validation',
      `coordination run: writerId "${writerId}" is not the driver identity of session "${coordinationId}" (its provenanceRoot.writerId is "${manifest.provenanceRoot.writerId}") -- a resumed request may only dispatch under the session's own driver/provenance-root identity`,
    );
  }
  return resumed;
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
  if (value === undefined) return value;
  if (!value.startsWith('$ref:')) {
    if (!(value in labels)) return value;
    const resolved = labels[value];
    if (typeof resolved !== 'string') {
      throw new StoreError('validation', `coordination run: ${fieldLabel} references fan-out step label "${value}" without a branch actor`);
    }
    return resolved;
  }
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
  if (!Array.isArray(values)) return [];
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
  // P10.10 (Promotion And Closeout): this load used to run unguarded, so ANY
  // resolution failure (an unrelated malformed sibling protocol file, a
  // removed protocol, a missing optional `yaml` module) threw a raw,
  // uncaught `FlowDefinitionError` straight out of `runCoordinationUseCase`
  // -- P10-KERNEL-FIX.md §5's own N3/R2-MEDIUM-C Gap, pre-existing, fails
  // safe (manifest.status never left "active"), but never previously turned
  // into the same honest, correctly-attributed `CoordinationError` refusal
  // `classifySessionQuorum` (session-engine.mjs) already gives its own
  // resolution-failure case. Mirrors that exact pattern -- one caught
  // resolve, one explicit refusal -- so a resolution failure now reaches
  // this function's own caller (the `catch (err) { if (err instanceof
  // CoordinationError) ... }` block, below) exactly the way a drifted
  // version already does two lines down, instead of crashing.
  let definition;
  try {
    definition = loadDefinitionForSession(manifest, { cwd: engineOpts.cwd, packageRoot: engineOpts.packageRoot });
  } catch (err) {
    const wrapped = new CoordinationError(
      'refusal',
      `coordination run: session "${coordinationId}" was opened against definition "${manifest.definitionRef.id}@${manifest.definitionRef.version}", but the definition could not be resolved -- refusing to close against an unresolvable definition: ${err.message}`,
    );
    wrapped.cause = err;
    throw wrapped;
  }
  if (manifest.schemaVersion === '1' && definition.metadata.version !== manifest.definitionRef.version) {
    throw new CoordinationError(
      'refusal',
      `coordination run: session "${coordinationId}" was opened against definition "${manifest.definitionRef.id}@${manifest.definitionRef.version}", but the resolved definition is now version "${definition.metadata.version}" -- refusing to close against a drifted definition`,
    );
  }
  if (definition?.spec?.profile?.completion?.aggregation === undefined) return {};
  if (aggregations.length === 0) {
    throw new CoordinationError(
      'refusal',
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
  let request;
  try {
    request = validateCoordinationRequest(raw, { executor: cliExecutor, model: cliModel, tier: cliTier });
    assertModelSupportedForKind(request.kind, { globalModel: cliModel, actors: request.actors });
  } catch (err) {
    if (err.category === 'validation') {
      recordCoordinationSchemaFault(ctx.cwd, err, raw);
    }
    throw err;
  }

  return executeCoordinationRunKernel(ctx, request, options);
}

/** Execute exactly one already-normalized declared-protocol step. */
export async function executeValidatedCoordinationStep({ ctx, request, step, manifest, labels, engineOpts, lockContext, dagDeclaration }) {
  const paths = lockContext?.paths;
  const releaseLock = lockContext?.releaseLock;
  const locked = Boolean(lockContext);
  const driverIdentity = { type: 'driver', id: request.writerId };
  const actorEntry = step.targetActorId ? findActor(request.actors, step.targetActorId) : undefined;
  const cliPolicy = actorPolicyFields(actorEntry, { globalExecutor: engineOpts.cliExecutor, globalTier: engineOpts.cliTier });
  const call = (publicFn, lockedFn, ...args) => locked ? lockedFn(...args, paths, engineOpts) : publicFn(...args, engineOpts);
  if (step.type === 'operation') {
    const contextRefs = resolveRefArray(step.contextRefs, labels, `steps[${step.as}].contextRefs`);
    const fromAssignmentId = resolveRef(step.fromAssignmentId, labels, `steps[${step.as}].fromAssignmentId`);
    const dagNodeId = Boolean(dagDeclaration || request?.dag)
      ? `node-${step.as}`
      : undefined;
    const dispatch = await (locked
      ? dispatchDeclaredOperationLocked(manifest.coordinationId, {
          operationId: step.operationId, targetActorId: step.targetActorId, objective: step.objective,
          expectedOutputs: step.expectedOutputs, contextRefs, constraints: step.constraints,
          capabilities: step.capabilities, writerId: request.writerId, fromAssignmentId,
          intent: step.intent, round: step.round, taskKey: step.taskKey, dagNodeId,
          ...(lockContext?.actionInvocation ? { actionInvocation: lockContext.actionInvocation } : {}),
          ...(Object.keys(cliPolicy).length ? { cliPolicy } : {}),
          ...(step.mutation !== undefined ? { mutation: step.mutation } : {}),
        }, paths, { ...engineOpts, releaseLock })
      : dispatchDeclaredOperation(manifest.coordinationId, {
          operationId: step.operationId, targetActorId: step.targetActorId, objective: step.objective,
          expectedOutputs: step.expectedOutputs, contextRefs, constraints: step.constraints,
          capabilities: step.capabilities, writerId: request.writerId, fromAssignmentId,
          intent: step.intent, round: step.round, taskKey: step.taskKey, dagNodeId,
          ...(Object.keys(cliPolicy).length ? { cliPolicy } : {}),
          ...(step.mutation !== undefined ? { mutation: step.mutation } : {}),
        }, engineOpts));
    if (step.targetActorId && actorEntry === undefined) {
      const landedOn = dispatch?.runResult?.policy?.provenance?.executor?.value;
      process.stderr.write(
        `fgos: coordination step "${step.as}" targets actor "${step.targetActorId}" but this request declares no actors[] entry for it — no per-actor executor/tier/persona was applied` +
          `${landedOn ? `, so it dispatched on "${landedOn}"` : ''}. The roster is per-request, not per-session: a resumed session must repeat actors[] to keep its bindings.\n`,
      );
    }
    labels[step.as] = dispatch.assignment.assignmentId;
    return { as: step.as, type: 'operation', actorId: step.targetActorId ?? null, door: 'dispatchDeclaredOperation', ...summarizeDispatch(dispatch), resumed: dispatch.resumed === true };
  }
  if (step.type === 'authorize') {
    const grantedContextRefs = resolveRefArray(step.grantedContextRefs, labels, `steps[${step.as}].grantedContextRefs`);
    const targetArtifactRef = resolveRef(step.targetArtifactRef, labels, `steps[${step.as}].targetArtifactRef`);
    const params = {
      operationId: step.operationId, targetActorId: step.targetActorId, nodeId: step.nodeId,
      authorizationId: step.authorizationId, invocationKey: step.invocationKey, authorizedBy: driverIdentity,
      reason: step.reason, grantedContextRefs, targetArtifactRef,
    };
    const authorization = locked
      ? authorizeDeclaredOperationLocked(manifest.coordinationId, params, paths, engineOpts)
      : authorizeDeclaredOperation(manifest.coordinationId, params, engineOpts);
    const persisted = authorization.appended ? authorization : readSessionEvents(manifest.coordinationId, engineOpts)
      .find((event) => event.type === 'operation-authorized' && event.payload.authorizationId === authorization.authorizationId)?.payload;
    if (!persisted) throw new CoordinationError('corrupt-log', `authorization ${authorization.authorizationId} was not found after an idempotent authorize`);
    return { as: step.as, type: 'authorize', door: 'authorizeDeclaredOperation', operationId: persisted.operationId, nodeId: persisted.nodeId, actorId: persisted.targetActorId,
      authorizationId: persisted.authorizationId, invocationKey: persisted.invocationKey, grantedContextRefs: persisted.grantedContextRefs,
      targetArtifactRef: persisted.targetArtifactRef ?? null, appended: authorization.appended };
  }
  if (step.type === 'disposition') {
    const params = { targetRef: resolveRef(step.targetRef, labels, `steps[${step.as}].targetRef`), disposition: step.disposition,
      rationale: step.rationale, evidenceRefs: resolveRefArray(step.evidenceRefs, labels, `steps[${step.as}].evidenceRefs`), authorizedBy: driverIdentity };
    const disposition = locked
      ? recordDriverDispositionLocked(manifest.coordinationId, params, paths, engineOpts)
      : recordDriverDisposition(manifest.coordinationId, params, engineOpts);
    return { as: step.as, type: 'disposition', door: 'recordDriverDisposition', targetRef: disposition.targetRef, disposition: disposition.disposition,
      evidenceRefs: disposition.evidenceRefs, appended: disposition.appended };
  }
  if (step.type === 'human-turn') {
    const { revision } = computeHumanTurnArtifactRevision(ctx.cwd, step.artifactRef, step.as);
    const respondsToRefs = step.respondsToRefs?.map((id) => `${HUMAN_TURN_REF_PREFIX}${id}`);
    const params = { turnId: step.turnId, turnOrdinal: step.turnOrdinal, channel: step.channel, artifactRef: step.artifactRef,
      revision, externalRef: step.externalRef, attributedTo: step.attributedTo, recordedBy: driverIdentity,
      ...(respondsToRefs !== undefined ? { respondsToRefs } : {}) };
    const humanTurn = locked
      ? recordHumanTurnLocked(manifest.coordinationId, params, paths, engineOpts)
      : recordHumanTurn(manifest.coordinationId, params, engineOpts);
    return { as: step.as, type: 'human-turn', door: 'recordHumanTurn', turnId: humanTurn.turnId, turnOrdinal: humanTurn.turnOrdinal, channel: humanTurn.channel,
      artifactRef: humanTurn.artifactRef, revision: humanTurn.revision, externalRef: humanTurn.externalRef,
      attributedTo: humanTurn.attributedTo, respondsToRefs: humanTurn.respondsToRefs ?? [], appended: humanTurn.appended };
  }
  if (step.type === 'contribution') {
    const params = { contributionId: step.contributionId, type: step.contributionType,
      assignmentId: resolveRef(step.assignmentId, labels, `steps[${step.as}].assignmentId`), roundKey: step.roundKey,
      linkedBy: driverIdentity, anchors: step.anchors, respondsTo: step.respondsTo };
    const contribution = locked
      ? linkSessionContributionLocked(manifest.coordinationId, params, paths, engineOpts)
      : linkSessionContribution(manifest.coordinationId, params, engineOpts);
    return { as: step.as, type: 'contribution', door: 'linkSessionContribution', contributionId: contribution.contributionId, contributionType: contribution.type,
      assignmentId: contribution.assignmentId, roundKey: contribution.roundKey, anchors: contribution.anchors ?? [],
      respondsTo: contribution.respondsTo ?? null, appended: contribution.appended };
  }
  if (step.type === 'fan-out') {
    const fromAssignmentId = resolveRef(step.fromAssignmentId, labels, `steps[${step.as}].fromAssignmentId`);
    const branches = step.branches.map((branch) => ({ ...branch,
      fromAssignmentId: resolveRef(branch.fromAssignmentId, labels, `steps[${step.as}].branches[${branch.actorId}].fromAssignmentId`) ?? fromAssignmentId }));
    const fanOut = await (locked
      ? dispatchResearchFanOutLocked(manifest.coordinationId, { operationId: step.operationId, branches, writerId: request.writerId, fromAssignmentId, actionInvocation: lockContext?.actionInvocation }, paths, { ...engineOpts, releaseLock })
      : dispatchResearchFanOut(manifest.coordinationId, { operationId: step.operationId, branches, writerId: request.writerId, fromAssignmentId }, engineOpts));
    if (fanOut.status !== 'dispatched') return { as: step.as, type: 'fan-out', status: fanOut.status, reason: fanOut.reason ?? null, branches: [], fanOutFailure: { as: step.as, status: fanOut.status, reason: fanOut.reason ?? null } };
    const branchAssignmentIds = {};
    const branchSummaries = fanOut.branches.map((b) => {
      if (b.status === 'fulfilled') branchAssignmentIds[b.actorId] = b.result.assignment.assignmentId;
      return { actorId: b.actorId, status: b.status, ...(b.status === 'fulfilled' ? summarizeDispatch(b.result) : { error: b.error }) };
    });
    labels[step.as] = branchAssignmentIds;
    return { as: step.as, type: 'fan-out', status: 'dispatched', branches: branchSummaries };
  }
  if (step.type === 'close') return { as: step.as, type: 'close', status: 'fulfilled' };
  throw new CoordinationError('validation', `unsupported step type "${step.type}"`);
}

export async function executeCoordinationRunKernel(ctx, request, options = {}) {
  const { cliExecutor, cliModel, cliTier } = options;
  const actionPrecondition = options.actionPrecondition;

  const engineOpts = {
    cwd: ctx.cwd, repoRoot: ctx.repoRoot, packageRoot: ctx.packageRoot, runnerConfig: ctx.runnerConfig, timeoutMs: ctx.timeoutMs,
    cliExecutor, cliModel, cliTier,
    dispatchBatchKey: request.coordinationId,
  };

  if (actionPrecondition) {
    return executeUnderActionPrecondition(
      request.coordinationId,
      actionPrecondition,
      async (paths, sessionBundle, releaseLock) => {
        const { manifest, action: matchedAction } = sessionBundle;
        if (typeof options.composeActionRequest !== 'function') {
          throw new CoordinationError('validation', 'coordination action: canonical request composer is unavailable');
        }
        const composed = options.composeActionRequest({ manifest, action: matchedAction, precondition: actionPrecondition });
        const canonicalNormalizedSteps = canonicalizeNormalizedSteps(composed.steps);
        const labels = Object.create(null);
        const results = [];
        for (const step of composed.steps) {
          results.push(await executeValidatedCoordinationStep({
            ctx,
            request: composed,
            step,
            manifest,
            labels,
            engineOpts,
            lockContext: {
              paths,
              releaseLock,
              actionInvocation: {
                actionKey: actionPrecondition.actionKey,
                kind: actionPrecondition.kind,
                normalizedSteps: canonicalNormalizedSteps,
              },
            },
          }));
        }
        const last = results.at(-1) ?? {};
        const actionResult = {
          coordinationId: manifest.coordinationId,
          kind: actionPrecondition.kind,
          ...(last.type === 'human-turn' ? {
            turnId: last.turnId, turnOrdinal: last.turnOrdinal, channel: last.channel, artifactRef: last.artifactRef,
            revision: last.revision, externalRef: last.externalRef, attributedTo: last.attributedTo, respondsToRefs: last.respondsToRefs,
          } : {}),
          ...(last.type === 'disposition' ? { targetRef: last.targetRef, disposition: last.disposition, evidenceRefs: last.evidenceRefs, appended: last.appended } : {}),
          ...(last.type === 'contribution' ? {
            contributionId: last.contributionId, contributionType: last.contributionType, assignmentId: last.assignmentId,
            roundKey: last.roundKey, anchors: last.anchors, respondsTo: last.respondsTo, appended: last.appended,
          } : {}),
          status: actionPrecondition.kind === 'dispatch-operation' || actionPrecondition.kind === 'authorize-and-dispatch' || actionPrecondition.kind === 'fan-out'
            ? 'dispatched'
            : actionPrecondition.kind === 'link-contribution' ? 'linked' : 'recorded',
          actionKey: actionPrecondition.actionKey,
          steps: results,
          ...(last.assignmentId ? { assignmentId: last.assignmentId } : {}),
          ...(last.turnId ? { turnId: last.turnId } : {}),
          ...(last.disposition ? { disposition: last.disposition } : {}),
          ...(last.contributionId ? { contributionId: last.contributionId } : {}),
          ...(last.branches ? { branches: last.branches } : {}),
          ...(actionPrecondition.kind === 'authorize-and-dispatch' ? { authorizationId: composed.steps[0].authorizationId } : {}),
        };
        return actionResult;
      },
      { ...engineOpts, composeActionRequest: options.composeActionRequest },
    );
  }
  const existingSession = findExistingSession(request.coordinationId, request.writerId, engineOpts);
  const durableLedgerIds = existingSession
    ? [
        ...existingSession.assignmentRefs,
        ...existingSession.contributions.map((record) => record.contributionId),
        ...existingSession.humanTurns.map((record) => record.turnId),
      ]
    : [];
  const dagDeclaration = compileDagRequest(request, { durableLedgerIds });

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
  let dagCaveats = new Map();

  if (request.kind === 'agent-led') {
    manifest =
      existingSession?.manifest ??
      openStandaloneSession({ ...openParams, schemaVersion: SCHEMA_VERSION_3, primaryRole: request.primaryRole }, engineOpts);
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
    manifest = existingSession?.manifest;
    let definition;
    if (manifest) {
      // Resume path: use the snapshot loader to avoid live YAML drift
      try {
        definition = loadDefinitionForSession(manifest, engineOpts);
      } catch (err) {
        if (err.category === 'corrupt-log') throw err; // High 10: preserve corrupt-log
        const wrapped = new StoreError('validation', `coordination request: protocol "${request.protocolRef.id}" could not be resolved from session snapshot -- refusing the request: ${err.message}`);
        wrapped.cause = err;
        throw wrapped;
      }
    } else {
      // Open path: use live YAML
      try {
        definition = loadCoordinationProtocol(request.protocolRef.id, { cwd: ctx.cwd, packageRoot: ctx.packageRoot });
      } catch (err) {
        if (err instanceof FlowDefinitionError && err.category === 'not-found') {
          throw err;
        }
        const wrapped = new StoreError(
          'validation',
          `coordination request: protocol "${request.protocolRef.id}" could not be resolved -- refusing the request rather than crashing with an unresolvable-definition error: ${err.message}`,
        );
        wrapped.cause = err;
        throw wrapped;
      }
    }
    const declaredActorIds = new Set((definition.spec.actors ?? []).map((a) => a.id));
    for (const actorEntry of request.actors) {
      if (!declaredActorIds.has(actorEntry.id)) {
        throw new StoreError(
          'validation',
          `coordination request: actors[].id "${actorEntry.id}" is not declared by protocol "${request.protocolRef.id}" (declared actors: ${[...declaredActorIds].join(', ')}) -- unregistered actor override rejected`,
        );
      }
    }
    const fanOutActorIds = new Set(request.steps.filter((s) => s.type === 'fan-out').flatMap((s) => s.branches.map((b) => b.actorId)));
    for (const actorEntry of request.actors) {
      if (fanOutActorIds.has(actorEntry.id) && (actorEntry.persona !== undefined || actorEntry.executor !== undefined || actorEntry.model !== undefined || actorEntry.tier !== undefined)) {
        throw new StoreError(
          'validation',
          `coordination request: actors[].id "${actorEntry.id}" declares policy (persona/executor/model/tier), but this actor only ever appears as a fan-out branch -- dispatchResearchFanOut has no per-branch policy-override channel (cohort planner governs fan-out actor allocation exclusively), so this override would silently have no effect`,
        );
      }
    }
    if (!manifest) {
      manifest = openDeclaredProtocolSession({ ...openParams, schemaVersion: SCHEMA_VERSION_3, ...(dagDeclaration ? { dagDeclaration } : {}), definitionId: request.protocolRef.id }, engineOpts);
    }

    if (request.coordinationId !== undefined) {
      const resumed = resumeSession(request.coordinationId, engineOpts);
      if (resumed.dag?.kind === 'dag') {
        if (!dagDeclaration) {
          throw new StoreError('validation', `coordination DAG request: session "${request.coordinationId}" is DAG-declared and requires an explicit equivalent DAG request`);
        }
        if (resumed.dag?.declaration?.requestFingerprint !== dagDeclaration.requestFingerprint) {
          throw new StoreError('validation', `coordination DAG request: session "${request.coordinationId}" declaration differs (labels, ordering, semantics, task keys, edges, additions, and removals require an explicit continuation contract)`);
        }
      } else if (dagDeclaration) {
        throw new StoreError('validation', `coordination DAG request: session "${request.coordinationId}" is legacy and cannot be converted to DAG mode on resume`);
      }
    }

    // The driver whose authority an "authorize"/"disposition" step writes
    // under. There is exactly one legal value: the engine pins both events
    // to `manifest.provenanceRoot.writerId`, which openParams just set from
    // `request.writerId`. Derived rather than accepted from the request --
    // see schema.mjs's assertNoAuthorizedBy.
    const driverIdentity = { type: 'driver', id: request.writerId };

    const labels = Object.create(null);
    const resumedDagStates = new Map();
    dagCaveats = new Map();
    if (dagDeclaration) {
      const replayed = resumeSession(manifest.coordinationId, engineOpts);
      const settledAssignmentIds = getAuthoritativeSettledAssignmentIds(replayed.events);
      const { fgosDir } = resolveSessionPaths(manifest.coordinationId, engineOpts);
      const nodeCwds = new Map();
      for (const node of dagDeclaration.nodes) {
        const nodeAssignments = replayed.assignments.filter((entry) => entry.dagNodeId === node.id);
        nodeCwds.set(node.id, resolveNodeCwd(node, nodeAssignments, fgosDir, ctx.cwd ?? engineOpts.cwd));
      }
      dagCaveats = computeDagSharedCwdCaveats({
        declaredNodes: dagDeclaration.nodes,
        getNodeCwd: (id) => nodeCwds.get(id),
      });

      for (const node of dagDeclaration.nodes) {
        const assignment = replayed.assignments.find((entry) => entry.dagNodeId === node.id);
        if (!assignment) continue;
        labels[node.displayLabel] = assignment.assignmentId;
        if (settledAssignmentIds.has(assignment.assignmentId)) {
          resumedDagStates.set(node.displayLabel, {
            outcome: 'settled',
            resumed: true,
            result: {
              as: node.displayLabel,
              type: request.steps.find((step) => step.as === node.displayLabel).type,
              assignmentId: assignment.assignmentId,
              resumed: true,
              door: 'result-linked',
            },
          });
        }
      }
    }

    if (dagDeclaration) {
      const scheduled = await scheduleDagSteps({
        steps: request.steps,
        declaration: dagDeclaration,
        initialStates: resumedDagStates,
        canAdmit: () => resumeSession(manifest.coordinationId, engineOpts).manifest.status === 'active',
        execute: async (step) => {
          const stepResult = await executeValidatedCoordinationStep({
            ctx,
            request,
            step,
            manifest,
            labels,
            engineOpts,
            dagDeclaration,
          });
          stepResults.push(stepResult);
          return stepResult;
        },
      });
      const resultsByLabel = new Map(stepResults.map((result) => [result.as, result]));
      for (const state of scheduled) {
        const result = resultsByLabel.get(state.as) ?? state.result ?? { as: state.as, type: request.steps[state.index].type };
        if (state.error && result.door === undefined && request.steps[state.index].type === 'operation') {
          result.door = 'dispatchDeclaredOperation';
        }
        result.schedulerOutcome = state.outcome;
        result.resumed = state.resumed === true || result.resumed === true;
        if (state.error) result.error = state.error;
        if (state.blockedBy) result.blockedBy = [state.blockedBy === 'terminal-session' ? state.blockedBy : `node-${state.blockedBy}`];
        if (state.overlapGroup) result.overlapGroup = state.overlapGroup;

        const node = dagDeclaration.nodes.find((n) => n.displayLabel === state.as);
        const caveat = (node && dagCaveats.get(node.id)) ?? null;
        if (caveat) {
          result.caveated = true;
          result.sharedCwdCaveat = caveat;
          result.sharedCwdVerdictCaveat = caveat;
        }

        resultsByLabel.set(state.as, result);
      }
      stepResults.splice(0, stepResults.length, ...request.steps.map((step) => resultsByLabel.get(step.as)));
    } else {
      for (const step of request.steps) {
        const stepResult = await executeValidatedCoordinationStep({
          ctx,
          request,
          step,
          manifest,
          labels,
          engineOpts,
          dagDeclaration: null,
        });
        stepResults.push(stepResult);
        if (stepResult.fanOutFailure) {
          fanOutFailure = stepResult.fanOutFailure;
          break;
        }
      }
    }
  }

  const hasDagCaveat = Boolean(dagDeclaration && dagCaveats?.size > 0);
  const hasPartialDagOutcome = dagDeclaration && stepResults.some((step) => ['deferred', 'refused', 'blocked'].includes(step.schedulerOutcome));
  const quorumBeforeClose = evaluateSessionQuorum(manifest.coordinationId, engineOpts);
  let closed = false;
  let closeRefusalReason = null;
  const shouldAttemptClose = dagDeclaration
    ? (!hasPartialDagOutcome && !hasDagCaveat)
    : (request.close === true || (request.steps ?? []).some((s) => s.type === 'close'));

  if (dagDeclaration && hasDagCaveat) {
    closeRefusalReason = 'recheck-required: concurrent read-only nodes sharing cwd carry non-attributable-verdict caveats';
  }

  if (shouldAttemptClose) {
    try {
      const closeParams = aggregationCloseParams(manifest.coordinationId, engineOpts);
      closeParams.authorizedBy = request.writerId ? { type: 'operator', id: request.writerId } : undefined;
      closeSessionByQuorum(manifest.coordinationId, closeParams, engineOpts);
      closed = true;
    } catch (err) {
      if (err instanceof CoordinationError) {
        closeRefusalReason = err.message;
      } else {
        throw err;
      }
    }
  }

  const finalQuorum = closed ? evaluateSessionQuorum(manifest.coordinationId, engineOpts) : quorumBeforeClose;
  const phase = deriveSessionPhase(manifest.coordinationId, engineOpts);
  const status = (dagDeclaration && hasDagCaveat) ? 'recheck-required' : phase;

  const finalReplay = dagDeclaration ? resumeSession(manifest.coordinationId, engineOpts) : null;
  const finalSettledIds = finalReplay ? getAuthoritativeSettledAssignmentIds(finalReplay.events) : new Set();
  const inFlightOutsideInvocation = finalReplay
    ? finalReplay.assignments
        .filter((assignment) => !stepResults.some((step) => step.assignmentId === assignment.assignmentId))
        .filter((assignment) => !finalSettledIds.has(assignment.assignmentId))
        .map((assignment) => assignment.assignmentId)
    : [];

  const dagNodes = dagDeclaration
    ? dagDeclaration.nodes.map((node) => {
        const step = stepResults.find((s) => s.as === node.displayLabel);
        const caveat = dagCaveats.get(node.id) ?? null;
        return {
          nodeId: node.id,
          displayLabel: node.displayLabel,
          schedulerOutcome: step?.schedulerOutcome ?? 'pending',
          caveated: caveat !== null,
          sharedCwdCaveat: caveat,
          sharedCwdVerdictCaveat: caveat,
        };
      })
    : [];

  return {
    coordinationId: manifest.coordinationId,
    kind: request.kind,
    definitionRef: manifest.definitionRef,
    objective: manifest.objective,
    status,
    closed,
    closeAttempted: dagDeclaration ? (!hasPartialDagOutcome && !hasDagCaveat) : Boolean(request.close),
    ...(closeRefusalReason !== null ? { closeRefusalReason } : {}),
    ...(fanOutFailure !== null ? { fanOutFailure } : {}),
    quorum: finalQuorum,
    steps: stepResults,
    ...(dagDeclaration
      ? {
          dag: {
            counts: {
              settled: stepResults.filter((step) => step.schedulerOutcome === 'settled').length,
              settledFailed: stepResults.filter((step) => step.schedulerOutcome === 'settled' && step.status === 'failed').length,
              refused: stepResults.filter((step) => step.schedulerOutcome === 'refused').length,
              blocked: stepResults.filter((step) => step.schedulerOutcome === 'blocked').length,
              deferred: stepResults.filter((step) => step.schedulerOutcome === 'deferred').length,
              recheckRequired: stepResults.filter((step) => step.schedulerOutcome === 'recheck-required' || step.caveated).length,
            },
            inFlightOutsideInvocation,
            nodes: dagNodes,
          },
        }
      : {}),
  };
}
