// coordination/store.mjs — CoordinationSession manifest + membership store
// (Phase 01 R1/R2/R3), rooted at `.fgos/coordination/sessions/<id>/` per
// docs/architect/agent-coordination/contracts/coordination-session.md.
//
// Reuses, never reinvents:
// - state/events.mjs's `withEventsLock`/`appendEventLocked`/`readEvents` for
//   every event-log read/write AND as the cross-process critical section
//   that makes the "atomic-ref rule" (event append + assignmentRefs append
//   as one atomic operation, Recovery Rule #2) actually atomic.
// - dispatch/assignment.mjs's `buildAssignment()`/`claimAssignmentId()` for
//   the Assignment itself -- this module never constructs or writes an
//   Assignment through any other path (ADR-008 Decision 2: no parallel
//   Assignment-creation path, no adoption API).
//
// Scope (Phase 01 R1-R4 only): store/schema/events/cutover. No session
// engine, no dynamic consult, no crash-restart idempotent resume beyond
// what replay.mjs can prove from disk (that is R5-R7, P01.2's).

import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { resolveMainCheckoutRoot, fgosDirFromRoot } from '../paths.mjs';
import { appendEvent, appendEventLocked, withEventsLock, readEvents } from '../../state/events.mjs';
import { buildAssignment, claimAssignmentId } from '../dispatch/assignment.mjs';
import {
  CoordinationError,
  SCHEMA_VERSION,
  STATUS_VALUES,
  validateManifest,
  validateEventPayload,
  applyAggregateBoundDefaults,
  assertSchemaVersionCurrent,
  CONTRIBUTION_REF_PREFIX,
} from './schema.mjs';
import { DeliberationError, validateAnchors, validateResponseLineage } from '../deliberation/schema.mjs';

// Same retry ceiling as mission-lite.mjs's own MAX_ASSIGNMENT_CLAIM_ATTEMPTS
// / assignment.mjs's MAX_ASSIGNMENT_ID_CLAIM_ATTEMPTS -- a local constant,
// not imported from either, for the same reason assignment.mjs's own
// comment gives: a retry-count tuning knob, not a shared invariant.
const MAX_SESSION_ID_CLAIM_ATTEMPTS = 8;

/**
 * Resolve `.fgos/coordination/sessions` for a given workspace, mirroring
 * mission-lite.mjs's own `resolveMissionsDir` shape exactly (same
 * `cwd`/`repoRoot` resolution order, same `fgosDirFromRoot(cwd)` call).
 */
function resolveCoordinationPaths(opts = {}) {
  const cwd = opts.cwd ?? process.cwd();
  let root = opts.repoRoot;
  if (!root) {
    root = resolveMainCheckoutRoot(cwd);
    if (!root) root = resolveMainCheckoutRoot(process.cwd());
  }
  if (!root) root = process.cwd();
  const fgosDir = fgosDirFromRoot(cwd);
  const sessionsDir = path.join(fgosDir, 'coordination', 'sessions');
  return { root, cwd, fgosDir, sessionsDir };
}

// R6 (Phase 06, cell P06.2): safe filesystem-path charset for a caller-
// supplied `coordinationId` -- alnum, underscore, hyphen only, matching the
// exact shape `openSession`'s own auto-generated id already produces
// (`coord_<base36-time>_<base36-random>`). No `.`/`/`/`\`/whitespace/any
// other character is legal, so a value outside this set can never smuggle a
// `..` traversal segment (or an absolute-path-shaped fragment `path.join`
// would still treat as relative but a traversal chain could still escape
// through) into `path.join(sessionsDir, coordinationId)` below. Confirmed
// empirically before this fix: an unvalidated `coordinationId` containing
// `../` sequences let `openSession`/`resolveSessionPaths` create a real
// session directory OUTSIDE `.fgos/coordination/sessions/` entirely (a real
// escape onto the host filesystem, not merely a theoretical one) -- this is
// the fix. Applied at the ONE choke point (`resolveSessionPaths`) every
// store.mjs door but `openSession`'s own explicit-id branch already funnels
// through, plus `openSession` itself (see below), so every coordinationId
// that ever reaches a real path is validated, not just some doors.
const SAFE_COORDINATION_ID_RE = /^[A-Za-z0-9_-]+$/;

// `label` defaults to describing a `coordinationId` (every pre-existing
// caller omits it, so behavior/message text is byte-identical to before this
// parameter existed). Exported (round 2, Bug #2) so any OTHER caller-supplied
// id that gets interpolated into a `path.join` -- e.g. `session-engine.mjs`'s
// `replaceSessionActor` `oldActorId`/`newActorId`, used to build
// `actor-replace-${oldActorId}--${newActorId}.claim` -- reuses this SAME
// safe-charset gate instead of inventing a second, independently-drifting
// one. Actor ids follow the identical charset rule as coordinationId: both
// are caller-supplied short tokens that only ever need to identify
// something, never carry structure, so there is no genuine reason for them
// to need a wider charset.
export function assertSafeCoordinationId(coordinationId, opts = {}) {
  const { label = 'coordinationId' } = opts;
  if (typeof coordinationId !== 'string' || !coordinationId.trim()) {
    throw new CoordinationError('validation', `${label} is required and must be a non-empty string`);
  }
  if (!SAFE_COORDINATION_ID_RE.test(coordinationId)) {
    throw new CoordinationError(
      'validation',
      `${label} "${coordinationId}" contains characters outside the safe filesystem charset (letters, digits, underscore, hyphen only) -- refusing to build a filesystem path from it`,
    );
  }
}

function resolveSessionPaths(coordinationId, opts = {}) {
  assertSafeCoordinationId(coordinationId);
  const { fgosDir, sessionsDir, ...rest } = resolveCoordinationPaths(opts);
  const sessionDir = path.join(sessionsDir, coordinationId);
  const eventsPath = path.join(sessionDir, 'events.jsonl');
  const manifestPath = path.join(sessionDir, 'session.json');
  return { ...rest, fgosDir, sessionsDir, sessionDir, eventsPath, manifestPath };
}

// Exported so replay.mjs reads the manifest through this SAME parse+
// validate path (never a second, independently-maintained copy) and only
// adds its own extra schemaVersion-mismatch check on top.
export function readManifestRaw(manifestPath) {
  let raw;
  try {
    raw = fs.readFileSync(manifestPath, 'utf8');
  } catch (err) {
    if (err.code === 'ENOENT') throw new CoordinationError('not-found', `no coordination session manifest at ${manifestPath}`);
    throw err;
  }
  let manifest;
  try {
    manifest = JSON.parse(raw);
  } catch (err) {
    throw new CoordinationError('corrupt-log', `session.json at ${manifestPath} is not valid JSON: ${err.message}`);
  }
  validateManifest(manifest);
  return manifest;
}

// Written via a same-directory temp file + `renameSync`, never a direct
// `writeFileSync` over the existing manifest: `writeFileSync` is
// O_TRUNC-then-write, a window in which an UNLOCKED reader (`readManifest`,
// the first statement of every dispatch; `replaySession`) can observe a
// truncated/partial file and throw `corrupt-log "not valid JSON"` against a
// perfectly healthy session, empirically reproduced end-to-end. Every
// manifest reader in this module already reads without the events lock, by
// design (Recovery Rule point 5's own split of advisory pre-lock reads from
// authoritative lock-held ones), so the write side has to be the one that
// closes this, not the readers. `rename` within one directory is atomic on
// POSIX -- a concurrent reader always observes either the complete OLD file
// or the complete NEW one, never a partial write.
let manifestTmpCounter = 0;
function writeManifestRaw(manifestPath, manifest) {
  const dir = path.dirname(manifestPath);
  manifestTmpCounter += 1;
  const tmpPath = path.join(dir, `.session.json.tmp-${process.pid}-${Date.now()}-${manifestTmpCounter}`);
  fs.writeFileSync(tmpPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  fs.renameSync(tmpPath, manifestPath);
}

/**
 * Open a new CoordinationSession: claims `coordinationId` atomically
 * (exclusive `mkdirSync`, the same wx-style claim `claimAssignmentId`
 * itself uses one layer down), writes `session.json`, and appends
 * `session-opened` (plus one `actor-bound` per declared actor, if any) --
 * all BEFORE this call returns, satisfying the Recovery Rule's requirement
 * that the manifest and intended actor/edge set exist before the first
 * Assignment.
 *
 * @param {object} params
 * @param {string} [params.coordinationId] Optional explicit id; auto-generated when omitted.
 * @param {string} params.objective
 * @param {{writerId: string, parentAssignmentId?: string}} params.provenanceRoot
 * @param {{id: string, version: string}|null} [params.definitionRef]
 * @param {string|null} [params.workRef]
 * @param {Array<{id: string, role: string, persona?: string, policy?: object}>} [params.actors]
 * @param {object} [params.aggregateBounds] Partial bounds; omitted fields default (schema.mjs).
 * @param {{minimumActors?: number, allowedOmissions?: string[]}|null} [params.partialPolicy]
 *   Declared BEFORE any Assignment is dispatched (Phase 06 R1: "An explicit
 *   partial policy names minimum actors/results and allowed omissions before
 *   execution"); immutable once the session opens. `null` (default) means no
 *   partial close is ever legal -- default completion requires every
 *   required SessionActor.
 * @param {object} [opts] Workspace options ({ cwd, repoRoot })
 * @returns {Readonly<object>} The stored manifest
 */
export function openSession(
  { coordinationId, objective, provenanceRoot, definitionRef = null, workRef = null, actors, aggregateBounds, partialPolicy = null },
  opts = {},
) {
  const { sessionsDir } = resolveCoordinationPaths(opts);
  fs.mkdirSync(sessionsDir, { recursive: true });

  let id = coordinationId;
  let sessionDir;
  if (id) {
    // R6 path-traversal guard (see assertSafeCoordinationId's own doc
    // comment, below `resolveSessionPaths`): this explicit-id branch builds
    // `sessionDir` directly, before any OTHER store.mjs door's own
    // `resolveSessionPaths` call would ever see this id -- validated here
    // too so a caller-supplied `coordinationId` can never escape
    // `sessionsDir` on the very FIRST write.
    assertSafeCoordinationId(id);
    sessionDir = path.join(sessionsDir, id);
    try {
      fs.mkdirSync(sessionDir);
    } catch (err) {
      if (err.code === 'EEXIST') throw new CoordinationError('validation', `coordination session "${id}" already exists`);
      throw err;
    }
  } else {
    // Auto-generated id: claim atomically with a bounded retry, the same
    // exclusive-create-and-retry-on-collision shape mission-lite's own
    // MAX_ASSIGNMENT_CLAIM_ATTEMPTS loop uses for assignmentId.
    let claimed = false;
    for (let attempt = 0; attempt < MAX_SESSION_ID_CLAIM_ATTEMPTS && !claimed; attempt += 1) {
      id = `coord_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
      sessionDir = path.join(sessionsDir, id);
      try {
        fs.mkdirSync(sessionDir);
        claimed = true;
      } catch (err) {
        if (err.code !== 'EEXIST') throw err;
      }
    }
    if (!claimed) {
      throw new CoordinationError('validation', `openSession could not claim a unique coordinationId after ${MAX_SESSION_ID_CLAIM_ATTEMPTS} attempts`);
    }
  }

  const resolvedActors = Array.isArray(actors)
    ? actors.map((actor) => ({
        id: actor.id,
        role: actor.role,
        ...(actor.persona !== undefined ? { persona: actor.persona } : {}),
        ...(actor.policy !== undefined ? { policy: actor.policy } : {}),
      }))
    : undefined;

  const manifest = {
    schemaVersion: SCHEMA_VERSION,
    coordinationId: id,
    objective,
    status: 'active',
    createdAt: new Date().toISOString(),
    provenanceRoot,
    definitionRef,
    workRef,
    ...(resolvedActors ? { actors: resolvedActors } : {}),
    aggregateBounds: applyAggregateBoundDefaults(aggregateBounds),
    assignmentRefs: [],
    completedAt: null,
    partialPolicy,
  };
  validateManifest(manifest);

  const manifestPath = path.join(sessionDir, 'session.json');
  writeManifestRaw(manifestPath, manifest);

  const eventsPath = path.join(sessionDir, 'events.jsonl');
  const openedPayload = { coordinationId: id, provenanceRoot };
  validateEventPayload('session-opened', openedPayload);
  withEventsLock(eventsPath, () => {
    appendEventLocked(eventsPath, { type: 'session-opened', payload: openedPayload }, sessionDir);
    if (resolvedActors) {
      for (const actor of resolvedActors) {
        const payload = {
          actorId: actor.id,
          role: actor.role,
          ...(actor.persona !== undefined ? { persona: actor.persona } : {}),
          ...(actor.policy !== undefined ? { policy: actor.policy } : {}),
        };
        validateEventPayload('actor-bound', payload);
        appendEventLocked(eventsPath, { type: 'actor-bound', payload }, sessionDir);
      }
    }
  });

  return Object.freeze(manifest);
}

/**
 * Bind one additional SessionActor to an already-open session, appending
 * `actor-bound` and updating `session.json`'s `actors` array as one atomic
 * operation under the events lock (same discipline as
 * `createSessionAssignment` below).
 *
 * `opts.primaryActorId`, when provided, enforces "at most one OTHER
 * (non-primary) actor ever bound to this session" as part of the SAME
 * locked critical section as the write below -- not just the caller's own
 * earlier, unlocked pre-check. This is what closes the cross-process TOCTOU
 * a caller's own read-then-decide (e.g. session-engine.mjs's
 * `validateConsultProposal`, which reads via an unlocked `replaySession()`)
 * cannot close by itself: two callers can both pass that earlier check
 * before either has bound anything, but only one of their `bindActor` calls
 * can win the lock first here. This flag is opt-in (undefined = no
 * invariant enforced) so callers that manage multiple non-primary actors by
 * a different rule, or existing store-level tests that bind an arbitrary
 * actor id with no "primary" concept at all, are unaffected.
 */
export function bindActor(coordinationId, actor, opts = {}) {
  const { sessionDir, eventsPath, manifestPath } = resolveSessionPaths(coordinationId, opts);
  const payload = {
    actorId: actor.id,
    role: actor.role,
    ...(actor.persona !== undefined ? { persona: actor.persona } : {}),
    ...(actor.policy !== undefined ? { policy: actor.policy } : {}),
  };
  validateEventPayload('actor-bound', payload);

  return withEventsLock(eventsPath, () => {
    const manifest = readManifestRaw(manifestPath);
    assertSchemaVersionCurrent(manifest, manifestPath);
    if (manifest.status !== 'active') {
      throw new CoordinationError('validation', `session "${coordinationId}" is not active (status: "${manifest.status}") -- cannot bind an actor`);
    }
    const existingActors = Array.isArray(manifest.actors) ? manifest.actors : [];
    if (existingActors.some((a) => a.id === actor.id)) {
      throw new CoordinationError('validation', `session "${coordinationId}" already has an actor bound with id "${actor.id}"`);
    }
    if (opts.primaryActorId !== undefined) {
      const conflictingNonPrimary = existingActors.find((a) => a.id !== opts.primaryActorId && a.id !== actor.id);
      if (conflictingNonPrimary) {
        throw new CoordinationError(
          'validation',
          `session "${coordinationId}" already has a non-primary actor bound ("${conflictingNonPrimary.id}") -- cannot bind a second, different non-primary actor "${actor.id}" (exactly one consult round is allowed per session)`,
        );
      }
    }
    appendEventLocked(eventsPath, { type: 'actor-bound', payload }, sessionDir);
    manifest.actors = [...existingActors, { id: actor.id, role: actor.role, ...(actor.persona !== undefined ? { persona: actor.persona } : {}), ...(actor.policy !== undefined ? { policy: actor.policy } : {}) }];
    validateManifest(manifest);
    writeManifestRaw(manifestPath, manifest);
    return Object.freeze(manifest);
  });
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== '';
}

function assertValidTaskKey(taskKey) {
  if (!isNonEmptyString(taskKey)) throw new CoordinationError('validation', 'taskKey is required and must be a non-empty string');
}

// Claim-file name is derived from a hash of the RAW taskKey, never a lossy
// lowercased/character-substituted form -- two textually-distinct taskKeys
// (e.g. "primary-round-1" vs "primary_round_1") must never collide onto the
// same claim file. The raw taskKey is also stored inside the claim file's
// own JSON content and re-checked on every lookup (see createSessionAssignment),
// so an actual hash collision fails loud rather than silently aliasing.
export function hashTaskKey(taskKey) {
  return createHash('sha256').update(taskKey).digest('hex').slice(0, 16);
}

function readAssignmentJson(assignmentsDir, assignmentId) {
  const assignmentPath = path.join(assignmentsDir, assignmentId, 'assignment.json');
  if (!fs.existsSync(assignmentPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(assignmentPath, 'utf8'));
  } catch (err) {
    throw new CoordinationError('corrupt-log', `assignment.json for "${assignmentId}" at ${assignmentPath} is not valid JSON: ${err.message}`);
  }
}

// The ONE place that knows how to complete an Assignment's session
// registration -- appending `assignment-created` and updating
// `manifest.assignmentRefs` as one unit, inside the caller's already-held
// `withEventsLock` critical section. Shared by createSessionAssignment's
// main (first-time) path and its self-heal fast path so there is exactly
// one implementation of this write, not two slightly-different copies.
//
// The event append itself is idempotent (checked against the log before
// appending): a crash INSIDE this function, between `appendEventLocked`
// and `writeManifestRaw`, leaves the event appended but `assignmentRefs`
// still missing the id -- the same shape the fast path already treats as
// "interrupted, needs completing." Without this check, a further retry
// re-entering this function would append a SECOND `assignment-created` for
// the same id, which replay.mjs's duplicate-ref check fails closed on.
function completeAssignmentRegistration({ manifest, manifestPath, eventsPath, sessionDir, assignmentId, actorId, authorizationProvenance }) {
  const alreadyAppended = readEvents(eventsPath).some(
    (event) => event.type === 'assignment-created' && event.payload?.assignmentId === assignmentId,
  );
  if (!alreadyAppended) {
    const eventPayload = { assignmentId, ...(actorId ? { actorId } : {}), ...(authorizationProvenance ?? {}) };
    validateEventPayload('assignment-created', eventPayload);
    appendEventLocked(eventsPath, { type: 'assignment-created', payload: eventPayload }, sessionDir);
  }

  manifest.assignmentRefs = [...manifest.assignmentRefs, assignmentId];
  validateManifest(manifest);
  writeManifestRaw(manifestPath, manifest);
}

// Driver-authorization provenance is VERIFIED against this session's own
// log before it is written, never merely recorded. Two invariants, both on
// one FRESH read taken while the events lock is already held -- never on the
// caller's own earlier unlocked `replaySession()` gate
// (session-engine.mjs's `dispatchDeclaredOperation`), which two concurrent
// callers could both pass before either had created anything:
//
//  1. The `authorizationId` must name a real `operation-authorized` event in
//     THIS session. Refusing here turns a fabricated provenance into a
//     write-time rejection instead of a session whose every subsequent
//     `replaySession` throws `dangling-ref` forever.
//  2. It may be spent by at most ONE Assignment.
//
// `ownAssignmentId`, when supplied, is the Assignment whose interrupted
// registration this call is completing: a consumer that IS that Assignment
// is a genuine idempotent resume of its own authorization, not a second
// consumption, so only a DIFFERENT consumer is a violation. Both of
// `createSessionAssignment`'s writing paths -- the self-heal branch and the
// genuinely-new-taskKey branch -- run this, so the invariant cannot be
// reached around by crashing into the self-heal shape first.
function assertAuthorizationSpendable({ eventsPath, coordinationId, authorizationProvenance, ownAssignmentId }) {
  const authorizationId = authorizationProvenance?.authorizationId;
  if (authorizationId === undefined) return;

  const events = readEvents(eventsPath);
  const issuedEvent = events.find(
    (event) => event.type === 'operation-authorized' && event.payload?.authorizationId === authorizationId,
  );
  if (!issuedEvent) {
    throw new CoordinationError(
      'validation',
      `createSessionAssignment: authorization "${authorizationId}" in session "${coordinationId}" names no "operation-authorized" event in this session -- refusing to record driver-authorization provenance no driver ever issued`,
    );
  }

  // The companion fields riding alongside a real `authorizationId` must
  // MATCH the event they claim to spend, not merely name one that exists.
  // Without this, a caller can present a real, unspent `authorizationId`
  // while lying about which operation/node/invocationKey/contextGrant it
  // authorizes -- defeating R5's key-reuse guard (by naming a key the
  // authorization never declared) and leaving R6's on-log `contextGrant`
  // unverified against the grant the driver actually issued. Every field
  // is optional here (older/partial provenance shapes are left alone) but
  // any field that IS present must agree with the issued event.
  const mismatchedFields = [];
  if (authorizationProvenance.operationId !== undefined && authorizationProvenance.operationId !== issuedEvent.payload.operationId) {
    mismatchedFields.push('operationId');
  }
  if (authorizationProvenance.nodeId !== undefined && authorizationProvenance.nodeId !== issuedEvent.payload.nodeId) {
    mismatchedFields.push('nodeId');
  }
  if (authorizationProvenance.invocationKey !== undefined && authorizationProvenance.invocationKey !== issuedEvent.payload.invocationKey) {
    mismatchedFields.push('invocationKey');
  }
  if (authorizationProvenance.contextGrant?.refs !== undefined) {
    const issuedRefs = issuedEvent.payload.grantedContextRefs ?? [];
    const claimedRefs = authorizationProvenance.contextGrant.refs;
    const sameRefs = claimedRefs.length === issuedRefs.length && claimedRefs.every((ref, index) => ref === issuedRefs[index]);
    if (!sameRefs) mismatchedFields.push('contextGrant.refs');
  }
  if (mismatchedFields.length > 0) {
    throw new CoordinationError(
      'validation',
      `createSessionAssignment: authorization "${authorizationId}" in session "${coordinationId}" -- provenance field(s) [${mismatchedFields.join(', ')}] do not match the "operation-authorized" event they claim to spend -- refusing to record provenance inconsistent with its own authorization`,
    );
  }

  const alreadyConsumedBy = events.find(
    (event) => event.type === 'assignment-created' && event.payload?.authorizationId === authorizationId,
  );
  if (alreadyConsumedBy && alreadyConsumedBy.payload.assignmentId !== ownAssignmentId) {
    throw new CoordinationError(
      'validation',
      `createSessionAssignment: authorization "${authorizationId}" in session "${coordinationId}" was already consumed by Assignment "${alreadyConsumedBy.payload.assignmentId}" -- one authorization materializes at most one Assignment`,
    );
  }

  // "Each `invocationKey` is consumed exactly once per logical optional-
  // operation invocation ... A second `operation-authorized` (or the
  // Assignment dispatch it would trigger) reusing an already-consumed
  // `invocationKey` is rejected." `authorizeOperation` refuses to ISSUE two
  // authorizations sharing one key; this is the dispatch half of the same
  // rule, on the same lock-held read, and it stays load-bearing even for a
  // provenance forged through a door that never went through
  // `authorizeOperation` at all. Scanned across the WHOLE session's events,
  // never per-binding: the contract scopes this key's uniqueness to the
  // CoordinationSession.
  const invocationKey = authorizationProvenance?.invocationKey;
  if (invocationKey !== undefined) {
    const alreadySpentBy = events.find(
      (event) => event.type === 'assignment-created' && event.payload?.invocationKey === invocationKey,
    );
    if (alreadySpentBy && alreadySpentBy.payload.assignmentId !== ownAssignmentId) {
      throw new CoordinationError(
        'validation',
        `createSessionAssignment: invocationKey "${invocationKey}" in session "${coordinationId}" was already consumed by Assignment "${alreadySpentBy.payload.assignmentId}" -- an invocationKey is consumed exactly once per logical invocation, session-wide`,
      );
    }
  }
}

// `activation.maxInvocations` (flow-definition.md's Activation table),
// enforced authoritatively on the SAME lock-held, from-disk footing every
// other cap in `createSessionAssignment` uses -- never a process-local
// counter, so a fresh process (or a second concurrent one) can never restart
// the count at zero.
//
// The count's source is the one the contract names: this session's on-disk
// `operation-authorized` events for that EXACT binding triple. Only those
// already SPENT by an `assignment-created` count as invocations that
// happened; this call's own authorization is excluded, because it is the
// invocation being decided rather than one already made. That makes a cap of
// N admit exactly N dispatches at the binding and refuse the N+1th.
function assertWithinBindingInvocationCap({ eventsPath, coordinationId, cap, authorizationProvenance }) {
  if (cap === undefined) return;
  const { maxInvocations, nodeId, operationId, targetActorId } = cap;
  const events = readEvents(eventsPath);
  const consumedAuthorizationIds = new Set(
    events
      .filter((event) => event.type === 'assignment-created' && event.payload?.authorizationId !== undefined)
      .map((event) => event.payload.authorizationId),
  );
  const ownAuthorizationId = authorizationProvenance?.authorizationId;
  const alreadyInvoked = events.filter(
    (event) =>
      event.type === 'operation-authorized' &&
      event.payload?.nodeId === nodeId &&
      event.payload?.operationId === operationId &&
      event.payload?.targetActorId === targetActorId &&
      event.payload.authorizationId !== ownAuthorizationId &&
      consumedAuthorizationIds.has(event.payload.authorizationId),
  ).length;
  if (alreadyInvoked >= maxInvocations) {
    throw new CoordinationError(
      'validation',
      `createSessionAssignment: binding (node "${nodeId}", operation "${operationId}", actor "${targetActorId}") in session "${coordinationId}" has already been invoked ${alreadyInvoked} time(s), at or above its declared activation.maxInvocations cap of ${maxInvocations} -- refusing to materialize another Assignment for this binding`,
    );
  }
}

/**
 * Atomically create one Assignment as a member of `coordinationId`
 * (Recovery Rule #2, the "atomic-ref rule"). `taskKey` is a caller-chosen
 * logical-task identifier: within this process's lifetime, two concurrent
 * calls for the SAME session + taskKey are serialized by the events lock
 * and resolve to exactly one created Assignment (the second sees the
 * first's already-written task-claim record and returns its Assignment
 * unchanged, never building a second one).
 *
 * The claim-file name is a hash of the RAW `taskKey` (see `hashTaskKey`),
 * never a lossy sanitized form -- this avoids two textually-distinct
 * taskKeys colliding onto the same claim file. The raw `taskKey` is also
 * stored inside the claim file's own content and re-checked byte-for-byte
 * on every lookup; a mismatch (an actual hash collision) throws a named
 * `CoordinationError` rather than silently returning the wrong task's
 * Assignment.
 *
 * Write order inside the held `withEventsLock` critical section is
 * deliberate, closing `coordination-session.md`'s Required Negative Test #3
 * ("does not duplicate the Assignment on retry"): the `tasks/<hash>.json`
 * claim record is written IMMEDIATELY after `claimAssignmentId` reserves
 * `assignmentId` -- before `assignment.json`, the `assignment-created`
 * event, or the `assignmentRefs` update. This means a crash anywhere from
 * that point onward always leaves a claim record a retry can resolve:
 * - Crash before `assignment.json` exists (claim record written, id
 *   directory still empty): a retry finds the claim record, finds no
 *   `assignment.json` for the claimed id, and throws `CoordinationError`
 *   category `corrupt-log` -- a loud, safe failure, never a silent
 *   duplicate and never a fabricated ref.
 * - Crash at or after `assignment.json` is written but before the
 *   `assignment-created` event/`assignmentRefs` update complete (the
 *   "interrupted assignment-created write" shape replay.mjs's dangling-ref
 *   check also surfaces): a retry finds the claim record and the real
 *   `assignment.json`, and -- because `manifest.assignmentRefs` does NOT
 *   yet contain this `assignmentId` -- completes the interrupted write
 *   itself (same `completeAssignmentRegistration` helper the main path
 *   uses) before returning the Assignment. This makes the retry the
 *   self-healing mechanism the Recovery Rule's atomic-write language
 *   implies: the Assignment is never left a permanent phantom that looks
 *   successful but was never actually registered as a session member.
 *   A crash INSIDE this self-heal step itself (between its own event
 *   append and its manifest write) leaves `assignment-created` appended
 *   but `assignmentRefs` still missing the id -- the identical detectable
 *   state, so a further retry re-enters this same branch and calls
 *   `completeAssignmentRegistration` again. That helper's event append is
 *   itself idempotent (it checks `events.jsonl` for an existing
 *   `assignment-created` for this id before appending a second one) --
 *   without that check, this inner retry would append a DUPLICATE event,
 *   which replay.mjs's own duplicate-ref check fails closed on; with it,
 *   the inner retry only completes the still-missing `assignmentRefs`
 *   write. So there is no crash point anywhere in this path -- including
 *   inside the self-heal step's own two writes -- that a further retry
 *   cannot resolve.
 * - Once `manifest.assignmentRefs` already contains this `assignmentId`,
 *   a retry is the TRUE idempotent case: the write was already fully
 *   completed, and the existing Assignment is returned unchanged with no
 *   second event/ref appended.
 * Cross-process-restart idempotent *resume* (reconciling a session's full
 * state after a crash by some means OTHER than a caller retrying this same
 * taskKey, not just this one retry-safe door) remains R7/P01.2's scope;
 * this function only guarantees `createSessionAssignment` itself never
 * mints a second Assignment, and never leaves an unregistered one, for one
 * taskKey once its claim record exists.
 *
 * @param {object} params
 * @param {string} params.coordinationId
 * @param {string} params.taskKey Logical task identity for idempotent claim.
 * @param {string} [params.actorId] SessionActor id this Assignment is issued to.
 * @param {object} params.contract Inline execution contract (ADR-006 §4 shape).
 * @param {{writerId: string, parentAssignmentId?: string}} params.caller
 * @param {object} [params.work] Optional Work to attach (read-only context; ADR-007 seam).
 * @param {string} [params.workId]
 * @param {string} [params.createdBy]
 * @param {object} [params.options] Passed through to buildAssignment (e.g. domain).
 * @param {object} [opts] Workspace options
 * @param {number} [opts.maxRoundsForActor] Opt-in extra invariant, mirroring
 *   `bindActor`'s `opts.primaryActorId` pattern exactly: when provided, this
 *   function additionally enforces "actor `actorId` has fewer than
 *   `opts.maxRoundsForActor` prior `assignment-created` events" as part of
 *   the SAME locked critical section as the write below, on a FRESH
 *   `readEvents(eventsPath)` taken while the lock is held -- not a caller's
 *   own earlier, unlocked read (e.g. session-engine.mjs's
 *   `dispatchDeclaredOperation`, which reads via an unlocked
 *   `replaySession()` for its own fast-fail check). This is what closes the
 *   cross-process TOCTOU a caller's own read-then-decide cannot close by
 *   itself: two callers can both pass an earlier, unlocked round-count check
 *   before either has created an Assignment, but only one of their
 *   `createSessionAssignment` calls can win this lock first. The check only
 *   ever runs on the "genuinely new taskKey" path below (AFTER the
 *   `taskClaimPath` existing-claim branch has already returned/self-healed) --
 *   a legitimate RESUME of an already-claimed taskKey is never double-counted
 *   against the cap, because the existing claim-file check above takes
 *   priority and returns before this new check is ever reached. Opt-in
 *   (undefined = no invariant enforced), so every pre-existing caller (the
 *   agent-led `proposeConsult`/`dispatchPrimaryTask` paths, and every
 *   existing test that calls this function with no round-cap concept at all)
 *   sees byte-identical behavior.
 * @param {number} [opts.maxAssignmentsForSession] Opt-in, SAME shape/placement
 *   as `opts.maxRoundsForActor` above (Phase 03 R5): rejects a genuinely new
 *   taskKey once `manifest.assignmentRefs.length` (the fresh manifest already
 *   read at the top of this critical section) is at or above the cap --
 *   `manifest.aggregateBounds.maxAssignments`, forwarded by the DECLARED
 *   path only (session-engine.mjs's `dispatchDeclaredOperation`/
 *   `recordConsultDisposition`). Session-wide (not per-actor); concurrency-
 *   sensitive for the identical reason `maxRoundsForActor` is (two concurrent
 *   NEW-taskKey callers could otherwise both read a stale, pre-write count),
 *   so it is checked here, lock-held, on the fresh in-lock manifest -- never
 *   as a caller's own earlier, unlocked read alone.
 * @param {number} [opts.maxRoundsForSession] Opt-in, session-wide round cap
 *   (`manifest.aggregateBounds.maxRounds`) -- distinct from the per-topology-
 *   edge `opts.maxRoundsForActor` above (that one bounds ONE actor's rounds
 *   against ONE declared edge; this one bounds the TOTAL round count across
 *   every actor in the session). This V1 slice has no first-class concept of
 *   a "round" other than "one Assignment materialized," so this check reads
 *   the identical `manifest.assignmentRefs.length` value `maxAssignmentsForSession`
 *   does, just against its own independently-configurable ceiling (the
 *   contract's `aggregateBounds.maxRounds`/`maxAssignments` are two
 *   separately-tunable fields with separate defaults, schema.mjs's
 *   `DEFAULT_AGGREGATE_BOUNDS`, even though this slice measures them off the
 *   same underlying count). Same concurrency-sensitivity and lock placement
 *   as `maxAssignmentsForSession`.
 * @param {number} [opts.maxConcurrencyForSession] Opt-in, session-wide cap on
 *   Assignments currently IN FLIGHT (an `assignment-created` event with no
 *   corresponding `result-linked` event yet) at the moment a genuinely new
 *   taskKey would create one more. Inherently concurrency-sensitive by
 *   definition (it measures simultaneity itself) -- computed from a FRESH,
 *   lock-held `readEvents(eventsPath)` (created-ids minus linked-ids), never
 *   a caller's own earlier unlocked snapshot, for the same TOCTOU reason
 *   `maxRoundsForActor` is lock-held.
 * @returns {Readonly<object>} The Assignment (freshly created, or the one already claimed for this taskKey)
 */
export function createSessionAssignment(
  { coordinationId, taskKey, actorId, contract, caller, work, workId, createdBy, options, authorizationProvenance },
  opts = {},
) {
  assertValidTaskKey(taskKey);
  const { fgosDir, sessionDir, eventsPath, manifestPath } = resolveSessionPaths(coordinationId, opts);
  const assignmentsDir = path.join(fgosDir, 'assignments');
  const tasksDir = path.join(sessionDir, 'tasks');
  const taskClaimPath = path.join(tasksDir, `${hashTaskKey(taskKey)}.json`);

  return withEventsLock(eventsPath, () => {
    const manifest = readManifestRaw(manifestPath);
    assertSchemaVersionCurrent(manifest, manifestPath);
    if (manifest.status !== 'active') {
      throw new CoordinationError('validation', `session "${coordinationId}" is not active (status: "${manifest.status}") -- cannot create an Assignment`);
    }

    if (fs.existsSync(taskClaimPath)) {
      const claim = JSON.parse(fs.readFileSync(taskClaimPath, 'utf8'));
      if (isNonEmptyString(claim.taskKey) && claim.taskKey !== taskKey) {
        throw new CoordinationError(
          'validation',
          `taskKey claim-file collision for session "${coordinationId}": "${taskKey}" and "${claim.taskKey}" hash to the same claim file -- refusing to return the wrong task's Assignment`,
        );
      }
      const existing = readAssignmentJson(assignmentsDir, claim.assignmentId);
      if (!existing) {
        throw new CoordinationError(
          'corrupt-log',
          `task "${taskKey}" claims assignment "${claim.assignmentId}" for session "${coordinationId}", but no such Assignment exists under ${assignmentsDir}`,
        );
      }
      if (!manifest.assignmentRefs.includes(claim.assignmentId)) {
        // Self-heal: a prior attempt reserved the id and wrote
        // assignment.json but crashed before the event/ref append
        // completed -- complete it now instead of returning a phantom
        // "successful" Assignment that was never a real session member.
        //
        // This branch APPENDS a consuming `assignment-created`, so it is
        // bound by the same authorization invariants the genuinely-new-
        // taskKey path below is. Exempting only this claim's OWN
        // assignmentId keeps a genuine idempotent resume passing while
        // refusing the crash-plus-race shape where a DIFFERENT taskKey
        // spent this authorization first.
        assertAuthorizationSpendable({
          eventsPath,
          coordinationId,
          authorizationProvenance,
          ownAssignmentId: claim.assignmentId,
        });
        // The binding cap must gate this branch too, not just the
        // genuinely-new-taskKey path below: this call carries the SAME
        // authorizationId the interrupted attempt already reserved
        // (the provenance-vs-authorization consistency check above ties it to that authorization),
        // and `assertWithinBindingInvocationCap` already excludes its OWN
        // `authorizationId` from the "already invoked" count -- so
        // completing an interrupted registration never double-counts
        // against the cap, while a cap already exhausted by OTHER
        // invocations still refuses here exactly as it would on the
        // new-taskKey path. Without this call, a crash into this self-heal
        // shape was the one door that let a binding materialize past its
        // declared `activation.maxInvocations`.
        assertWithinBindingInvocationCap({
          eventsPath,
          coordinationId,
          cap: opts.bindingInvocationCap,
          authorizationProvenance,
        });
        completeAssignmentRegistration({
          manifest,
          manifestPath,
          eventsPath,
          sessionDir,
          assignmentId: claim.assignmentId,
          actorId,
          authorizationProvenance,
        });
      }
      return Object.freeze(existing);
    }

    // A driver authorization must have been really issued, and is spent by
    // exactly ONE Assignment. On this genuinely-NEW-taskKey path there is no
    // own-Assignment exemption: this call has claimed nothing yet, so ANY
    // existing consumer is a second consumption.
    assertAuthorizationSpendable({ eventsPath, coordinationId, authorizationProvenance, ownAssignmentId: undefined });

    // Authoritative, session-wide aggregateBounds enforcement (opt-in, Phase
    // 03 R5): reached under the exact same "genuinely NEW taskKey only"
    // condition as opts.maxRoundsForActor below -- a resume of an
    // already-claimed taskKey already returned above and never reaches any
    // of these checks, so none of them ever double-count a resume.
    // `manifest` here is the fresh, lock-held read from the top of this
    // critical section -- not a caller's own earlier `replaySession()` read.
    if (opts.maxAssignmentsForSession !== undefined && manifest.assignmentRefs.length >= opts.maxAssignmentsForSession) {
      throw new CoordinationError(
        'validation',
        `createSessionAssignment: session "${coordinationId}" has already created ${manifest.assignmentRefs.length} Assignment(s), at or above the declared aggregateBounds.maxAssignments cap of ${opts.maxAssignmentsForSession} -- refusing to create a new Assignment`,
      );
    }
    if (opts.maxRoundsForSession !== undefined && manifest.assignmentRefs.length >= opts.maxRoundsForSession) {
      throw new CoordinationError(
        'validation',
        `createSessionAssignment: session "${coordinationId}" has already used ${manifest.assignmentRefs.length} round(s) session-wide, at or above the declared aggregateBounds.maxRounds cap of ${opts.maxRoundsForSession} -- refusing to create a new Assignment for a new round`,
      );
    }
    if (opts.maxConcurrencyForSession !== undefined) {
      // Fresh, lock-held read -- in-flight means "created but not yet
      // result-linked" (linkResult always runs strictly after the Assignment
      // that settled, so an id present in createdIds but absent from
      // linkedIds is still genuinely dispatched/pending).
      const freshEventsForConcurrency = readEvents(eventsPath);
      const createdIdsForConcurrency = new Set();
      const linkedIdsForConcurrency = new Set();
      for (const event of freshEventsForConcurrency) {
        if (event.type === 'assignment-created' && event.payload?.assignmentId) createdIdsForConcurrency.add(event.payload.assignmentId);
        if (event.type === 'result-linked' && event.payload?.assignmentId) linkedIdsForConcurrency.add(event.payload.assignmentId);
      }
      let inFlight = 0;
      for (const id of createdIdsForConcurrency) {
        if (!linkedIdsForConcurrency.has(id)) inFlight += 1;
      }
      if (inFlight >= opts.maxConcurrencyForSession) {
        throw new CoordinationError(
          'validation',
          `createSessionAssignment: session "${coordinationId}" already has ${inFlight} Assignment(s) in flight (created but not yet result-linked), at or above the declared aggregateBounds.maxConcurrency cap of ${opts.maxConcurrencyForSession} -- refusing to create a new Assignment`,
        );
      }
    }

    // Authoritative round-cap enforcement (opt-in): only reached once the
    // claim-file check above has already established this is a genuinely
    // NEW taskKey, never a resume -- so a resume is never double-counted.
    // Counts against a FRESH, lock-held `readEvents`, never the caller's
    // own earlier unlocked read, closing the cross-process TOCTOU window.
    if (opts.maxRoundsForActor !== undefined) {
      if (!isNonEmptyString(actorId)) {
        throw new CoordinationError(
          'validation',
          `createSessionAssignment: opts.maxRoundsForActor requires a non-empty actorId (session "${coordinationId}", taskKey "${taskKey}")`,
        );
      }
      const roundsAlreadyUsed = readEvents(eventsPath).filter(
        (event) => event.type === 'assignment-created' && event.payload?.actorId === actorId,
      ).length;
      if (roundsAlreadyUsed >= opts.maxRoundsForActor) {
        throw new CoordinationError(
          'validation',
          `createSessionAssignment: actor "${actorId}" in session "${coordinationId}" has already used ${roundsAlreadyUsed} round(s), at or above the declared cap of ${opts.maxRoundsForActor} -- refusing to create a new Assignment for a new round`,
        );
      }
    }

    // Deliberately LAST among the caps: a binding's `activation.maxInvocations`
    // only ever NARROWS usage at that one binding and can never widen an
    // aggregate bound, so every session-wide cap above is given the chance to
    // refuse first and the stricter one always wins.
    assertWithinBindingInvocationCap({
      eventsPath,
      coordinationId,
      cap: opts.bindingInvocationCap,
      authorizationProvenance,
    });

    const assignment = claimAssignmentId(
      () =>
        buildAssignment({
          ...(work ? { work } : {}),
          ...(work ? {} : { workId: workId ?? null }),
          ...(createdBy ? { createdBy } : {}),
          provenance: { kind: 'inline', contract, caller },
          options: { ...(options || {}), assignmentsDir },
        }),
      assignmentsDir,
    );

    // Written FIRST, right after the assignmentId is reserved -- see the
    // doc comment above for exactly which crash windows this closes.
    fs.mkdirSync(tasksDir, { recursive: true });
    fs.writeFileSync(
      taskClaimPath,
      `${JSON.stringify({ taskKey, assignmentId: assignment.assignmentId, claimedAt: new Date().toISOString() }, null, 2)}\n`,
    );

    const assignmentJsonPath = path.join(assignmentsDir, assignment.assignmentId, 'assignment.json');
    if (!fs.existsSync(assignmentJsonPath)) {
      fs.writeFileSync(assignmentJsonPath, `${JSON.stringify(assignment, null, 2)}\n`);
    }

    completeAssignmentRegistration({
      manifest,
      manifestPath,
      eventsPath,
      sessionDir,
      assignmentId: assignment.assignmentId,
      actorId,
      authorizationProvenance,
    });

    return assignment;
  });
}

// Driver authority: `authorizedBy.id` is pinned to this session's OWN driver
// identity -- `manifest.provenanceRoot.writerId`, the caller identity that
// opened the session, which is the only durable driver identity a
// CoordinationSession records. Shape validation alone
// (`schema.mjs`'s `validateAuthorizedBy`) would accept any non-empty string,
// so without this a driver-authored event could name an arbitrary driver that
// has nothing to do with this session. ONE implementation, shared by every
// door that writes a driver-authored event (`authorizeOperation`,
// `recordDriverDisposition`), so the two can never drift apart. Always called
// on a manifest read INSIDE the caller's held events lock.
function assertDriverIdentity(manifest, authorizedBy, { coordinationId, label, subject }) {
  if (authorizedBy?.id !== manifest.provenanceRoot.writerId) {
    throw new CoordinationError(
      'validation',
      `${label}: authorizedBy.id "${authorizedBy?.id}" is not the driver identity of session "${coordinationId}" (its provenanceRoot.writerId is "${manifest.provenanceRoot.writerId}") -- ${subject} may only be written under the session's own driver/provenance-root identity`,
    );
  }
}

/**
 * Append one `operation-authorized` event for a `driver-authorized` node-
 * operation binding.
 *
 * Recovery Rule point 5: "Checking whether a session is still `active` and
 * appending an `operation-authorized` event happen as part of the same
 * atomic/serialized write path already used for `assignment-created` --
 * never a plain check-then-act against a concurrent
 * `transitionSessionStatus` call." That is literal here, not a convention:
 * the manifest read, the status check, and the append all run inside ONE
 * `withEventsLock(eventsPath, ...)` critical section -- the SAME on-disk
 * `events.lock` (derived from `path.dirname(eventsPath)`, i.e. the session
 * directory) that `createSessionAssignment`'s own
 * `completeAssignmentRegistration` write and `transitionSessionStatus`'s own
 * terminal write both acquire. A concurrent transition therefore cannot
 * interleave between this status check and this append: whichever call wins
 * the lock runs to completion first, and the loser re-reads the manifest the
 * winner already wrote.
 *
 * Idempotent on `authorizationId` (crash-resume self-heal, mirroring
 * `recordActorReplacement`/`completeAssignmentRegistration`): a repeated
 * call for the same authorization appends nothing.
 *
 * `opts.maxInvocationsForBinding` is opt-in, same shape as
 * `createSessionAssignment`'s own cap opts: only a caller holding the
 * FlowDefinition can read a binding's `activation.maxInvocations`, so this
 * module never invents the number -- it just enforces it lock-held against a
 * fresh on-disk count for the exact binding triple.
 *
 * This door validates SHAPE, session status, and driver identity. Whether
 * `(nodeId, operationId, targetActorId)` names a real, `driver-authorized`
 * binding is a question only a caller holding the FlowDefinition can answer
 * -- `session-engine.mjs`'s `authorizeDeclaredOperation` is that caller, and
 * this module deliberately takes on no definition awareness of its own.
 */
export function authorizeOperation(
  coordinationId,
  { authorizationId, operationId, nodeId, targetActorId, invocationKey, authorizedBy, reason, grantedContextRefs, targetArtifactRef },
  opts = {},
) {
  const { sessionDir, eventsPath, manifestPath } = resolveSessionPaths(coordinationId, opts);
  const payload = {
    authorizationId,
    operationId,
    nodeId,
    targetActorId,
    invocationKey,
    authorizedBy,
    reason,
    grantedContextRefs,
    ...(targetArtifactRef !== undefined ? { targetArtifactRef } : {}),
  };
  validateEventPayload('operation-authorized', payload);

  return withEventsLock(eventsPath, () => {
    const manifest = readManifestRaw(manifestPath);
    assertSchemaVersionCurrent(manifest, manifestPath);
    if (manifest.status !== 'active') {
      throw new CoordinationError(
        'validation',
        `authorizeOperation: session "${coordinationId}" is not active (status: "${manifest.status}") -- cannot authorize a new operation once new materialization has stopped`,
      );
    }

    // Enforced HERE, in the one door every authorization goes through (the
    // definition-aware `authorizeDeclaredOperation` delegates to it), so
    // there is no lower-level door that skips it.
    assertDriverIdentity(manifest, authorizedBy, {
      coordinationId,
      label: 'authorizeOperation',
      subject: 'an authorization',
    });

    const events = readEvents(eventsPath);
    const alreadyAuthorized = events.some(
      (event) => event.type === 'operation-authorized' && event.payload?.authorizationId === authorizationId,
    );
    if (alreadyAuthorized) return Object.freeze({ ...payload, appended: false });

    // `invocationKey` uniqueness is SESSION-scoped, not per-binding: the
    // contract checks it "against that session's own `events.jsonl`", so two
    // DIFFERENT bindings reusing one key string is the same violation as one
    // binding reusing it twice. Checked after the `authorizationId`
    // idempotency return above, so re-issuing the identical authorization
    // stays a no-op rather than colliding with itself.
    const keyCollision = events.find(
      (event) => event.type === 'operation-authorized' && event.payload?.invocationKey === invocationKey,
    );
    if (keyCollision) {
      throw new CoordinationError(
        'validation',
        `authorizeOperation: invocationKey "${invocationKey}" in session "${coordinationId}" was already used by authorization "${keyCollision.payload.authorizationId}" (node "${keyCollision.payload.nodeId}", operation "${keyCollision.payload.operationId}", actor "${keyCollision.payload.targetActorId}") -- an invocationKey is consumed exactly once per session, across every binding`,
      );
    }

    // Opt-in binding cap, forwarded by the definition-aware door that can
    // actually read `activation.maxInvocations`. Counted fresh from the
    // on-disk `operation-authorized` events for this exact binding, inside
    // the held lock -- never from in-memory state.
    if (opts.maxInvocationsForBinding !== undefined) {
      const alreadyAuthorizedForBinding = events.filter(
        (event) =>
          event.type === 'operation-authorized' &&
          event.payload?.nodeId === nodeId &&
          event.payload?.operationId === operationId &&
          event.payload?.targetActorId === targetActorId,
      ).length;
      if (alreadyAuthorizedForBinding >= opts.maxInvocationsForBinding) {
        throw new CoordinationError(
          'validation',
          `authorizeOperation: binding (node "${nodeId}", operation "${operationId}", actor "${targetActorId}") in session "${coordinationId}" already has ${alreadyAuthorizedForBinding} "operation-authorized" event(s), at or above its declared activation.maxInvocations cap of ${opts.maxInvocationsForBinding} -- refusing to authorize another invocation`,
        );
      }
    }

    appendEventLocked(eventsPath, { type: 'operation-authorized', payload }, sessionDir);
    return Object.freeze({ ...payload, appended: true });
  });
}

// A disposition's `targetRef`/`evidenceRefs` may not name a different
// CoordinationSession or an Assignment that is not this session's own
// member -- the SAME rule `session-engine.mjs`'s `assertRefsOwnedBySession`
// already enforces for `grantedContextRefs`/`targetArtifactRef` (Context-Grant
// Enforcement), applied here to disposition's own refs (P00.1's
// Carried-Forward Gap #9: "no session-scope check on targetRef/evidenceRefs
// yet"). Inlined rather than imported: store.mjs sits BELOW session-engine.mjs
// in the import graph, so it cannot import that helper back. Checked by
// SEGMENT (not whole-string prefix) so a path-form ref into another
// session's directory is caught the same as a bare id; a segment that merely
// resembles an id but resolves to nothing on disk is left alone -- this
// codebase has no artifact registry to resolve it against, matching the
// established precedent exactly rather than inventing a stronger guarantee.
// Phase 08 (MVP8): `contributionIds` is the set of contribution ids THIS
// session's own log has linked, supplied by the caller that already holds the
// lock and has read the events. A ref in the reserved `contribution:`
// namespace must name one of them. Passing no set at all means the caller
// knows of no contributions, in which case every `contribution:` ref is
// refused -- fail-closed, never "unchecked because unknown".
function assertDispositionRefOwnedBySession(ref, { coordinationId, assignmentRefs, fgosDir, label, contributionIds = new Set() }) {
  if (typeof ref !== 'string') {
    throw new CoordinationError('validation', `${label}: ref must be a string, got ${typeof ref}`);
  }
  if (ref.startsWith(CONTRIBUTION_REF_PREFIX)) {
    const contributionId = ref.slice(CONTRIBUTION_REF_PREFIX.length);
    if (!contributionIds.has(contributionId)) {
      throw new CoordinationError(
        'dangling-ref',
        `${label}: ref "${ref}" names contribution "${contributionId}", which coordination session "${coordinationId}" never linked -- a disposition may only target a contribution of its own session`,
      );
    }
    return;
  }
  for (const segment of ref.split(/[\\/]/).filter(Boolean)) {
    if (segment !== coordinationId && fs.existsSync(path.join(fgosDir, 'coordination', 'sessions', segment, 'session.json'))) {
      throw new CoordinationError(
        'validation',
        `${label}: ref "${ref}" names a different coordination session -- cross-session disposition authority is out of scope`,
      );
    }
    if (/^asgn_/.test(segment)) {
      const exists = fs.existsSync(path.join(fgosDir, 'assignments', segment, 'assignment.json'));
      if (exists && !assignmentRefs.includes(segment)) {
        throw new CoordinationError(
          'validation',
          `${label}: ref "${ref}" resolves to an Assignment that is not a member of coordination session "${coordinationId}" -- a disposition may only target this session's own refs`,
        );
      }
    }
  }
}

/**
 * Append one `driver-disposition-recorded` event: the driver's own
 * accept/reject/close-a-round decision on a finding or artifact ref.
 *
 * Deliberately the SAME door shape as `authorizeOperation` above -- payload
 * shape validated first, then manifest read + active-status check + driver-
 * identity pin + append, all inside ONE `withEventsLock` critical section on
 * the session's own `events.lock`. That is what makes disposition ledger
 * state a driver writes rather than something a worker could author: there is
 * no RunResult field, no contract field, and no worker-reachable path that
 * produces this event, and `authorizedBy.id` must be the identity that opened
 * the session (`assertDriverIdentity`, shared with `authorizeOperation`).
 *
 * Idempotent on a byte-identical payload (crash-resume self-heal, mirroring
 * `authorizeOperation`'s `authorizationId` return and
 * `recordActorReplacement`'s pair check): a repeated call recording exactly
 * the same decision, on the same ref, with the same rationale and evidence
 * appends nothing. A genuinely different decision -- a later round's
 * `accepted` after an earlier `rejected`, a different rationale, different
 * evidence -- is a new record and always appends, so the full disposition
 * history stays readable in order.
 *
 * Session-status: refused once the session leaves `active`, on the same
 * footing as `authorizeOperation`/`recordRunRetry` -- a closed session's
 * ledger is not reopened.
 */
export function recordDriverDisposition(coordinationId, { targetRef, disposition, rationale, evidenceRefs, authorizedBy }, opts = {}) {
  const { fgosDir, sessionDir, eventsPath, manifestPath } = resolveSessionPaths(coordinationId, opts);
  const payload = { targetRef, disposition, rationale, evidenceRefs, authorizedBy };
  validateEventPayload('driver-disposition-recorded', payload);

  return withEventsLock(eventsPath, () => {
    const manifest = readManifestRaw(manifestPath);
    assertSchemaVersionCurrent(manifest, manifestPath);
    if (manifest.status !== 'active') {
      throw new CoordinationError(
        'validation',
        `recordDriverDisposition: session "${coordinationId}" is not active (status: "${manifest.status}") -- cannot record a disposition once the session has closed`,
      );
    }
    assertDriverIdentity(manifest, authorizedBy, {
      coordinationId,
      label: 'recordDriverDisposition',
      subject: 'a disposition',
    });

    // Read once, lock-held, so a `contribution:` ref is resolved against the
    // log as it actually is at the moment the disposition is written -- never
    // against a snapshot taken before the lock.
    const eventsForRefs = readEvents(eventsPath);
    const contributionIds = linkedContributionIds(eventsForRefs);
    assertDispositionRefOwnedBySession(targetRef, {
      coordinationId,
      assignmentRefs: manifest.assignmentRefs,
      fgosDir,
      label: 'recordDriverDisposition: targetRef',
      contributionIds,
    });
    evidenceRefs.forEach((ref, i) =>
      assertDispositionRefOwnedBySession(ref, {
        coordinationId,
        assignmentRefs: manifest.assignmentRefs,
        fgosDir,
        label: `recordDriverDisposition: evidenceRefs[${i}]`,
        contributionIds,
      }),
    );

    // Idempotency compares a CANONICAL shape, not the raw payload:
    // `JSON.stringify` is key-insertion-order sensitive, and `authorizedBy`
    // is a caller-supplied nested object stored verbatim -- two calls
    // describing the exact same decision with `authorizedBy`'s two fields
    // in a different order would otherwise compare unequal and silently
    // append twice -- empirically reproduced. Every other field is
    // a flat, caller-owned value already in fixed key order from the
    // destructure above, so only `authorizedBy` needs normalizing.
    const canonicalize = (value) =>
      JSON.stringify({ ...value, authorizedBy: { type: value.authorizedBy?.type, id: value.authorizedBy?.id } });
    const serialized = canonicalize(payload);
    const alreadyRecorded = eventsForRefs.some(
      (event) => event.type === 'driver-disposition-recorded' && canonicalize(event.payload) === serialized,
    );
    if (alreadyRecorded) return Object.freeze({ ...payload, appended: false });

    appendEventLocked(eventsPath, { type: 'driver-disposition-recorded', payload }, sessionDir);
    return Object.freeze({ ...payload, appended: true });
  });
}

/**
 * Every contribution id this session's log has LINKED, in log order. The one
 * place that answers "is this a contribution of mine" -- used by the
 * disposition door's `contribution:` ref check and by the contribution door's
 * own duplicate/lineage checks, so both read the same ledger the same way.
 */
function linkedContributionIds(events) {
  const ids = new Set();
  for (const event of events) {
    if (event.type === 'deliberation-contribution-linked') ids.add(event.payload.contributionId);
  }
  return ids;
}

/**
 * Map<contributionId, {sessionId, respondsTo?}> over the contributions this
 * session's log has linked -- the real-ledger `knownContributions` input
 * P08.1's `validateContributionLineage` was designed to receive from a caller
 * that HAS a session (`deliberation/schema.mjs` has no store access by
 * design). Every entry carries this session's own id, so a foreign-session
 * lineage ref is impossible by construction rather than by a second check.
 */
export function knownContributionsFromEvents(events, coordinationId) {
  const known = new Map();
  for (const event of events) {
    if (event.type !== 'deliberation-contribution-linked') continue;
    known.set(event.payload.contributionId, {
      sessionId: coordinationId,
      ...(event.payload.respondsTo !== undefined ? { respondsTo: event.payload.respondsTo } : {}),
    });
  }
  return known;
}

/**
 * Re-raise a `DeliberationError` from P08.1's validators as the
 * `CoordinationError` every caller of this module already handles. The
 * deliberation module is deliberately independent of this one and raises its
 * own error type; letting that type escape `recordContributionLink` or
 * `replaySession` would slip past every `err instanceof CoordinationError`
 * handler in the codebase. The original category is preserved in the message.
 */
export function asCoordinationError(err, context) {
  if (!(err instanceof DeliberationError)) throw err;
  const category = err.category.startsWith('dangling') ? 'dangling-ref' : 'validation';
  throw new CoordinationError(category, `${context}: ${err.message} (deliberation category "${err.category}")`);
}

/**
 * Append one `deliberation-contribution-linked` event: one typed contribution
 * linked into this session's deliberation ledger (MVP8).
 *
 * Same door shape as `recordDriverDisposition`/`recordAggregationValidation`
 * above -- payload shape validated first, then manifest read + active-status
 * check + driver-identity pin + append, all inside ONE `withEventsLock`
 * critical section.
 *
 * What this door can check, and does:
 * - **The artifact is pinned, never copied.** The payload carries
 *   `artifactRef` + `revision` and no artifact content; the shape whitelist in
 *   `schema.mjs` makes any content-bearing field unrepresentable.
 * - **The provenance is this session's own.** `assignmentId` must be a member
 *   of `manifest.assignmentRefs` (exact membership, as
 *   `recordAggregationValidation` requires of its sources), and `runId` must
 *   have the full `run_<assignmentId>_<digits>` shape of a Run of that
 *   Assignment -- never a prefix-only check (R6).
 * - **The lineage resolves inside this session.** `anchors[]`/`respondsTo` are
 *   checked with P08.1's OWN `validateAnchors`/`validateResponseLineage`
 *   against a `knownContributions` map built from this log, so a dangling or
 *   cyclic lineage ref is refused here and not only at replay.
 * - **A contribution id is claimed once.** A byte-identical repeat is an
 *   idempotent no-op (crash-resume self-heal); the same id carrying anything
 *   different is a hard `duplicate-ref`. This closes the duplicate-id gap
 *   P08.1's own trace named as a P08.2 ledger-layer obligation.
 *
 * What this door structurally CANNOT check, and does not pretend to: whether
 * the contribution's `type` is one this operation declares, and whether its
 * `visibilityWindowRef` names a window that is open. Both need the bound
 * FlowDefinition, which lives one layer up -- `session-engine.mjs`'s
 * `linkSessionContribution` is the mediated door that derives every one of
 * those values from the session itself and takes none of them from a caller.
 */
export function recordContributionLink(
  coordinationId,
  { contributionId, operationRef, type, assignmentId, runId, artifactRef, revision, roundKey, visibilityWindowRef, anchors, respondsTo, linkedBy },
  opts = {},
) {
  const { fgosDir, sessionDir, eventsPath, manifestPath } = resolveSessionPaths(coordinationId, opts);
  const payload = {
    contributionId,
    operationRef,
    type,
    assignmentId,
    runId,
    artifactRef,
    revision,
    roundKey,
    visibilityWindowRef,
    linkedBy,
    ...(anchors !== undefined ? { anchors } : {}),
    ...(respondsTo !== undefined ? { respondsTo } : {}),
  };
  validateEventPayload('deliberation-contribution-linked', payload);

  return withEventsLock(eventsPath, () => {
    const manifest = readManifestRaw(manifestPath);
    assertSchemaVersionCurrent(manifest, manifestPath);
    if (manifest.status !== 'active') {
      throw new CoordinationError(
        'validation',
        `recordContributionLink: session "${coordinationId}" is not active (status: "${manifest.status}") -- a contribution cannot be linked into a session that has already closed`,
      );
    }
    assertDriverIdentity(manifest, linkedBy, {
      coordinationId,
      label: 'recordContributionLink',
      subject: 'a linked contribution',
    });

    if (!manifest.assignmentRefs.includes(assignmentId)) {
      throw new CoordinationError(
        'foreign-ref',
        `recordContributionLink: assignmentId "${assignmentId}" is not an Assignment of session "${coordinationId}" -- a contribution may only be backed by this session's own work`,
      );
    }
    assertValidRunIdForAssignment(assignmentId, runId, 'recordContributionLink');
    assertDispositionRefOwnedBySession(artifactRef, {
      coordinationId,
      assignmentRefs: manifest.assignmentRefs,
      fgosDir,
      label: 'recordContributionLink: artifactRef',
    });

    const events = readEvents(eventsPath);
    const prior = events.find(
      (event) => event.type === 'deliberation-contribution-linked' && event.payload?.contributionId === contributionId,
    );
    if (prior) {
      const canonicalize = (value) =>
        JSON.stringify({ ...value, linkedBy: { type: value.linkedBy?.type, id: value.linkedBy?.id } });
      if (canonicalize(prior.payload) === canonicalize(payload)) return Object.freeze({ ...payload, appended: false });
      throw new CoordinationError(
        'duplicate-ref',
        `recordContributionLink: contributionId "${contributionId}" in session "${coordinationId}" was already linked with different content -- a contribution link is immutable; record a new contributionId instead`,
      );
    }

    // P08.1's own lineage validators, called (never forked) against the real
    // ledger. The candidate's own id is deliberately absent from this map --
    // it has not been appended yet -- so a self-anchor or a self-response is a
    // dangling ref here, and a lineage cycle cannot be built at all: every ref
    // must already exist, and an append-only log has no back edges.
    const known = knownContributionsFromEvents(events, coordinationId);
    try {
      validateAnchors(payload, known, coordinationId);
      validateResponseLineage(payload, known, coordinationId);
    } catch (err) {
      asCoordinationError(err, `recordContributionLink: session "${coordinationId}" contribution "${contributionId}"`);
    }

    appendEventLocked(eventsPath, { type: 'deliberation-contribution-linked', payload }, sessionDir);
    return Object.freeze({ ...payload, appended: true });
  });
}

/**
 * Append one `aggregation-validated` event: the driver's record that a
 * cognitive aggregation was validated against this session's own evidence.
 *
 * Same door shape as `authorizeOperation`/`recordDriverDisposition` above --
 * payload shape validated first, then manifest read + active-status check +
 * driver-identity pin + append, all inside ONE `withEventsLock` critical
 * section. Three properties follow from that shape rather than from anything
 * this function invents:
 *
 * - **Not worker-authorable.** `validatedBy.id` must be the identity that
 *   opened the session (`assertDriverIdentity`, shared verbatim with the two
 *   driver doors above). No RunResult field, no execution contract field, and
 *   no worker-reachable path produces this event.
 * - **Not a terminal transition.** This door never touches `manifest.status`.
 *   A validated outcome is INPUT that `session-engine.mjs` may consult;
 *   terminal authority stays with `transitionSessionStatus`.
 * - **Written while the session is still `active`,** so an aggregation can
 *   never be appended to justify a close that already happened.
 *
 * `sourceResultRefs` must every one be an Assignment this session actually
 * owns -- checked against `manifest.assignmentRefs` directly (exact
 * membership, not the looser segment scan `assertDispositionRefOwnedBySession`
 * needs for opaque artifact refs), so an aggregate cannot be validated
 * against another session's work or against an Assignment that does not
 * exist.
 *
 * Idempotent on a byte-identical payload, mirroring `recordDriverDisposition`.
 * Re-using one `aggregationId` for a DIFFERENT payload is a hard
 * `duplicate-ref`, never a silent second opinion: a validated verdict is not
 * overwritable in place.
 */
export function recordAggregationValidation(
  coordinationId,
  {
    aggregationId,
    method,
    outcome,
    sourceResultRefs,
    validatedBy,
    assignmentId,
    runId,
    outputArtifactRef,
    dissentRefs,
    unresolvedContributionRefs,
    missingActors,
    failedActors,
    artifactRevisionRefs,
    unboundSourceOperationRefs,
  },
  opts = {},
) {
  const { fgosDir, sessionDir, eventsPath, manifestPath } = resolveSessionPaths(coordinationId, opts);
  const payload = {
    aggregationId,
    method,
    outcome,
    sourceResultRefs,
    validatedBy,
    ...(assignmentId !== undefined ? { assignmentId } : {}),
    ...(runId !== undefined ? { runId } : {}),
    ...(outputArtifactRef !== undefined ? { outputArtifactRef } : {}),
    ...(dissentRefs !== undefined ? { dissentRefs } : {}),
    ...(unresolvedContributionRefs !== undefined ? { unresolvedContributionRefs } : {}),
    ...(missingActors !== undefined ? { missingActors } : {}),
    ...(failedActors !== undefined ? { failedActors } : {}),
    ...(unboundSourceOperationRefs !== undefined ? { unboundSourceOperationRefs } : {}),
    ...(artifactRevisionRefs !== undefined ? { artifactRevisionRefs } : {}),
  };
  validateEventPayload('aggregation-validated', payload);

  return withEventsLock(eventsPath, () => {
    const manifest = readManifestRaw(manifestPath);
    assertSchemaVersionCurrent(manifest, manifestPath);
    if (manifest.status !== 'active') {
      throw new CoordinationError(
        'validation',
        `recordAggregationValidation: session "${coordinationId}" is not active (status: "${manifest.status}") -- an aggregation cannot be validated into a session that has already closed`,
      );
    }
    assertDriverIdentity(manifest, validatedBy, {
      coordinationId,
      label: 'recordAggregationValidation',
      subject: 'a validated aggregation',
    });

    const owned = new Set(manifest.assignmentRefs);
    for (const [i, ref] of sourceResultRefs.entries()) {
      if (!owned.has(ref)) {
        throw new CoordinationError(
          'foreign-ref',
          `recordAggregationValidation: sourceResultRefs[${i}] "${ref}" is not an Assignment of session "${coordinationId}" -- an aggregation may only be validated against this session's own results`,
        );
      }
    }
    if (assignmentId !== undefined && !owned.has(assignmentId)) {
      throw new CoordinationError(
        'foreign-ref',
        `recordAggregationValidation: assignmentId "${assignmentId}" is not an Assignment of session "${coordinationId}"`,
      );
    }
    if (outputArtifactRef !== undefined) {
      assertDispositionRefOwnedBySession(outputArtifactRef, {
        coordinationId,
        assignmentRefs: manifest.assignmentRefs,
        fgosDir,
        label: 'recordAggregationValidation: outputArtifactRef',
      });
    }

    // Same canonicalization reasoning as `recordDriverDisposition`: the only
    // caller-supplied nested object is the driver-provenance one, so
    // normalizing its two keys is enough to make key-insertion order stop
    // mattering.
    const canonicalize = (value) =>
      JSON.stringify({ ...value, validatedBy: { type: value.validatedBy?.type, id: value.validatedBy?.id } });
    const serialized = canonicalize(payload);
    const priorForId = readEvents(eventsPath).find(
      (event) => event.type === 'aggregation-validated' && event.payload?.aggregationId === aggregationId,
    );
    if (priorForId) {
      if (canonicalize(priorForId.payload) === serialized) return Object.freeze({ ...payload, appended: false });
      throw new CoordinationError(
        'duplicate-ref',
        `recordAggregationValidation: aggregationId "${aggregationId}" in session "${coordinationId}" was already recorded with a different result (outcome "${priorForId.payload.outcome}", now "${outcome}") -- a validated aggregation is never overwritten in place; record a new aggregationId instead`,
      );
    }

    appendEventLocked(eventsPath, { type: 'aggregation-validated', payload }, sessionDir);
    return Object.freeze({ ...payload, appended: true });
  });
}

// R6 (Phase 06, cell P06.2, round 2): full-shape validation for a `runId`
// claimed to belong to `assignmentId`. The real convention every genuine
// dispatch in this codebase produces is exactly
// `run_<assignmentId>_<one-or-more-digits>` (`assignment-runner.mjs`'s own
// `runId = \`run_${effectiveAssignment.assignmentId}_${attemptStr}\`` --
// `attemptStr` is `String(attemptNum).padStart(2, '0')`, so ALWAYS at least
// 2 digits but not fixed-width beyond attempt 99, hence `\d+` here, not a
// fixed-width match). A PREFIX-only check
// (`runId.startsWith('run_' + assignmentId + '_')`) is not enough: it also
// accepts a same-prefix, malicious-SUFFIX runId such as
// `run_<assignmentId>_../../../../tmp/evil-marker` -- that string genuinely
// starts with the expected prefix, so a prefix check alone is silently
// bypassed by exactly the traversal shape `assertSafeCoordinationId` (above)
// exists to block elsewhere. `assignmentId` is escaped for regex use even
// though today's real assignment ids cannot contain regex-special
// characters -- defensive, matching this module's own "validate at the
// boundary, do not assume upstream shape" posture.
//
// Exported so `session-engine.mjs`'s `readLinkedRunResultFromDisk` (the
// READ-time counterpart, which turns the validated suffix into a real
// `path.join` segment) enforces the IDENTICAL pattern at read time too,
// instead of maintaining a second, independently-drifting copy -- defense in
// depth against a hand-crafted/corrupt event log carrying a malicious runId
// that never went through `linkResult` at all (R6's own "corrupt ledger"
// attack class).
function escapeRegExpLiteral(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function assertValidRunIdForAssignment(assignmentId, runId, context) {
  const pattern = new RegExp(`^run_${escapeRegExpLiteral(assignmentId)}_\\d+$`);
  if (typeof runId !== 'string' || !pattern.test(runId)) {
    throw new CoordinationError(
      'foreign-ref',
      `${context}: runId "${runId}" does not match the expected shape for assignment "${assignmentId}" (expected "run_${assignmentId}_<digits>") -- refusing to treat this as evidence that genuinely belongs to this Assignment`,
    );
  }
}

/**
 * Link a RunResult to a session Assignment (`result-linked` event). Purely
 * additive bookkeeping -- the canonical RunResult already lives under
 * `.fgos/assignments/<id>/runs/<NN>/result.json`; this never copies it.
 *
 * Defense in depth against `session-engine.mjs`'s `createAndExecuteSessionTask`
 * dispatch race (its own `dispatch.claim` file is the primary fix; this
 * guards the write site itself regardless of what called it): a second
 * `result-linked` event for an `assignmentId` that already has one is
 * rejected under this SAME locked critical section, via a fresh
 * `readEvents()` read taken while the lock is held. Re-linking the SAME
 * `runId` a second time is treated as an idempotent no-op -- mirrors
 * `createSessionAssignment`'s own "retry returns existing, unchanged"
 * philosophy, since re-confirming an already-linked run is not itself
 * harmful. Linking a genuinely DIFFERENT `runId` for an already-linked
 * `assignmentId` is a real conflict (two distinct real runs both trying to
 * be "the" result) and throws `duplicate-ref` -- the same category
 * `replay.mjs`'s own consistency check uses for the identical shape found
 * later, at replay time.
 *
 * `opts.allowSupersede` (Phase 06 R2 retry, opt-in): permits linking a
 * DIFFERENT runId over an already-linked assignment ONLY when a `run-retried`
 * event for this exact assignmentId already exists AFTER the currently-linked
 * event in the log -- i.e. only when a retry was properly DECLARED first
 * (`recordRunRetry`, below). This never deletes or rewrites the prior
 * `result-linked` event or its RunResult (both stay on disk, immutable,
 * exactly as `replay.mjs`'s own reconstruction expects); it only appends ONE
 * MORE `result-linked` event, which callers resolve by taking the LATEST
 * match for an assignmentId as the current authoritative view (mirrors
 * `session-engine.mjs`'s own `lastEventFor` helper). Every pre-existing
 * caller omits this flag, so behavior is byte-identical to before it
 * existed.
 */
export function linkResult(coordinationId, { assignmentId, runId }, opts = {}) {
  const { sessionDir, eventsPath, manifestPath } = resolveSessionPaths(coordinationId, opts);
  const payload = { assignmentId, runId };
  validateEventPayload('result-linked', payload);

  return withEventsLock(eventsPath, () => {
    const manifest = readManifestRaw(manifestPath);
    assertSchemaVersionCurrent(manifest, manifestPath);
    if (!manifest.assignmentRefs.includes(assignmentId)) {
      throw new CoordinationError('validation', `assignment "${assignmentId}" is not a member of session "${coordinationId}" -- cannot link a result to it`);
    }

    // R6 (Phase 06, cell P06.2): reject a `runId` that does not carry
    // `assignmentId`'s own naming convention (`run_<assignmentId>_<attempt>`,
    // the shape EVERY real dispatch in this codebase produces --
    // `assignment-runner.mjs`'s own `runId` construction, unchanged) AT
    // WRITE TIME, not just when the linked result is later read back
    // (`session-engine.mjs`'s `readLinkedRunResultFromDisk` already throws
    // `foreign-ref` for the identical mismatch, but only once something
    // actually tries to read it -- e.g. at quorum evaluation). Confirmed
    // empirically before this fix: `linkResult` accepted a REAL, genuine
    // sibling Assignment's own runId (foreign evidence) with no complaint at
    // write time, silently writing a permanently-unresolvable cross-linked
    // event into the log -- it never produced a false SUCCESS (the later
    // read still fails closed), but it violated this module's own
    // established validate-at-the-boundary discipline (schema.mjs) by
    // deferring a detectable, always-wrong write to a later, unrelated
    // caller. Every legitimate caller already supplies a runId in this exact
    // shape, so this is not a behavior change for any real dispatch path.
    // Checked here, INSIDE the lock and AFTER the schema-version/membership
    // checks above (same precedence every other check in this function
    // already follows -- schema-version mismatch and non-membership both
    // still win first, matching this function's own pre-existing tests).
    //
    // Round 2: uses the FULL-SHAPE `assertValidRunIdForAssignment` (above),
    // not a prefix-only check -- a prefix-only check accepts a same-prefix,
    // malicious-suffix runId (e.g. `run_<assignmentId>_../../../../tmp/evil`)
    // since that string genuinely starts with the expected prefix.
    assertValidRunIdForAssignment(assignmentId, runId, 'linkResult');

    const freshEvents = readEvents(eventsPath);
    const existingLinks = freshEvents.filter((event) => event.type === 'result-linked' && event.payload.assignmentId === assignmentId);
    const existingLink = existingLinks[existingLinks.length - 1];
    if (existingLink) {
      if (existingLink.payload.runId === runId) {
        return; // idempotent no-op: the SAME run is already linked
      }
      if (opts.allowSupersede) {
        const existingLinkIndex = freshEvents.indexOf(existingLink);
        const authorizedByRetry = freshEvents
          .slice(existingLinkIndex + 1)
          .some((event) => event.type === 'run-retried' && event.payload.assignmentId === assignmentId);
        if (!authorizedByRetry) {
          throw new CoordinationError(
            'validation',
            `linkResult: supersede requested for assignment "${assignmentId}" but no "run-retried" event authorizes replacing runId "${existingLink.payload.runId}" with "${runId}" -- retries must be declared via recordRunRetry before their result can supersede the prior link`,
          );
        }
        appendEventLocked(eventsPath, { type: 'result-linked', payload }, sessionDir);
        return;
      }
      throw new CoordinationError(
        'duplicate-ref',
        `assignment "${assignmentId}" in session "${coordinationId}" already has a result linked (runId "${existingLink.payload.runId}") -- refusing to link a second, DIFFERENT run ("${runId}")`,
      );
    }
    appendEventLocked(eventsPath, { type: 'result-linked', payload }, sessionDir);
  });
}

/**
 * Declare ONE retry for `assignmentId` (Phase 06 R2: "Retry creates a new
 * Run for the same Assignment when policy permits"). Appends `run-retried`
 * BEFORE any dispatch happens -- the caller (`session-engine.mjs`'s
 * `retrySessionTask`) always executes the new Run and calls
 * `linkResult({..., allowSupersede: true})` strictly AFTER this returns, so
 * a crash between this call and the actual dispatch always leaves a durable,
 * self-describing "declared but not yet fulfilled" trace instead of a lost
 * or ambiguous retry.
 *
 * Resume-safe / idempotent under the SAME rules `createSessionAssignment`
 * already established: if a PRIOR `run-retried` declaration for this
 * assignment has not yet been fulfilled by a matching `result-linked` (i.e.
 * `pendingRetries > 0` below), this call is a genuine RESUME of that same
 * declaration -- it appends NOTHING and returns the existing attempt number,
 * so a caller retrying after a crash never double-declares or double-spends
 * the retry budget. Only once every prior declaration is fulfilled does this
 * function check `maxRetries` and (if permitted) declare a genuinely NEW
 * retry, all inside the SAME lock-held critical section as the fresh
 * `readEvents()` it reasons from -- the same cross-process TOCTOU closure
 * `createSessionAssignment`'s own opt-in caps use.
 *
 * @param {object} params
 * @param {string} params.assignmentId
 * @param {string} params.reason Non-empty; retry must record why.
 * @param {string} [params.previousRunId] The runId being superseded, if any.
 * @param {number} [params.maxRetries] Declared retry policy ceiling; omitted = unbounded (caller's own responsibility -- `session-engine.mjs`'s `retrySessionTask` always passes one).
 * @returns {{attempt: number, resumedDeclaration: boolean}}
 */
export function recordRunRetry(coordinationId, { assignmentId, reason, previousRunId, maxRetries }, opts = {}) {
  const { sessionDir, eventsPath, manifestPath } = resolveSessionPaths(coordinationId, opts);

  return withEventsLock(eventsPath, () => {
    const manifest = readManifestRaw(manifestPath);
    assertSchemaVersionCurrent(manifest, manifestPath);
    if (manifest.status !== 'active') {
      throw new CoordinationError('validation', `recordRunRetry: session "${coordinationId}" is not active (status: "${manifest.status}") -- cannot retry, new materialization is stopped once a session leaves active`);
    }
    if (!manifest.assignmentRefs.includes(assignmentId)) {
      throw new CoordinationError('validation', `recordRunRetry: assignment "${assignmentId}" is not a member of session "${coordinationId}"`);
    }

    const freshEvents = readEvents(eventsPath);
    const priorRetries = freshEvents.filter((event) => event.type === 'run-retried' && event.payload.assignmentId === assignmentId).length;
    const linkedCount = freshEvents.filter((event) => event.type === 'result-linked' && event.payload.assignmentId === assignmentId).length;
    // Each `result-linked` beyond the very first fulfills exactly one prior
    // declared retry; `linkedCount === 0` (never even settled once) also
    // means zero retries have been FULFILLED yet, never a negative count.
    const fulfilledRetries = Math.max(linkedCount - 1, 0);
    const pendingRetries = priorRetries - fulfilledRetries;

    if (pendingRetries > 0) {
      // A retry was already declared but its dispatch never produced a
      // linked result yet -- resume that SAME declaration, never a second
      // one, and never double-count it against maxRetries.
      return { attempt: priorRetries, resumedDeclaration: true };
    }

    if (maxRetries !== undefined && priorRetries >= maxRetries) {
      throw new CoordinationError(
        'validation',
        `recordRunRetry: assignment "${assignmentId}" has already been retried ${priorRetries} time(s), at or above the declared maxRetries cap of ${maxRetries} -- refusing a further retry`,
      );
    }

    const payload = { assignmentId, reason, ...(previousRunId !== undefined ? { previousRunId } : {}) };
    validateEventPayload('run-retried', payload);
    appendEventLocked(eventsPath, { type: 'run-retried', payload }, sessionDir);
    return { attempt: priorRetries + 1, resumedDeclaration: false };
  });
}

/**
 * Record an actor replacement (Phase 06 R2: "Actor replacement occurs only
 * through declared retry policy, records old/new actor and allocation
 * provenance"). The new actor must already be bound (`bindActor`, called by
 * `session-engine.mjs`'s `replaceSessionActor` BEFORE this) -- this function
 * only appends the provenance record, and does so idempotently: a second
 * call for the SAME `(oldActorId, replacementActorId)` pair is a no-op
 * (crash-resume self-heal, mirroring `completeAssignmentRegistration`'s own
 * idempotent-append check), never a duplicate event.
 */
export function recordActorReplacement(coordinationId, { oldActorId, replacementActorId, reason, allocationProvenance }, opts = {}) {
  const { sessionDir, eventsPath, manifestPath } = resolveSessionPaths(coordinationId, opts);
  const payload = { oldActorId, replacementActorId, reason, ...(allocationProvenance !== undefined ? { allocationProvenance } : {}) };
  validateEventPayload('actor-replaced', payload);

  return withEventsLock(eventsPath, () => {
    const manifest = readManifestRaw(manifestPath);
    assertSchemaVersionCurrent(manifest, manifestPath);
    const alreadyRecorded = readEvents(eventsPath).some(
      (event) => event.type === 'actor-replaced' && event.payload.oldActorId === oldActorId && event.payload.replacementActorId === replacementActorId,
    );
    if (alreadyRecorded) return;
    appendEventLocked(eventsPath, { type: 'actor-replaced', payload }, sessionDir);
  });
}

const TERMINAL_EVENT_TYPE = { completed: 'session-completed', partial: 'session-partial', failed: 'session-failed', cancelled: 'session-cancelled' };

// Builds the exact payload shape each terminal event kind accepts (schema.mjs
// EVENT_SPECS), passing through only the optional fields the CALLER actually
// supplied -- never fabricating an empty array for a bucket the caller never
// populated. Kept as one small table-driven function so a new terminal
// status/field is added in exactly one place.
function buildTerminalPayload(status, extra) {
  const optional = (field) => (extra[field] !== undefined ? { [field]: extra[field] } : {});
  switch (status) {
    case 'completed':
      return { ...optional('replacedActors'), ...optional('dissentingActors') };
    case 'partial':
      return { missingActors: extra.missingActors, ...optional('failedActors'), ...optional('lateActors'), ...optional('replacedActors'), ...optional('dissentingActors') };
    case 'failed':
      return { reason: extra.reason };
    case 'cancelled':
      return { reason: extra.reason, ...optional('inFlightAssignmentIds') };
    default:
      return {};
  }
}

/**
 * The unlocked core of `transitionSessionStatus` -- appends the terminal
 * event and updates `session.json`'s `status`/`completedAt` as one atomic
 * operation, but assumes the caller ALREADY holds `coordinationId`'s
 * events.lock (via `withEventsLock` directly, or `withSessionLock` below).
 * Exported only so a caller that needs to combine its OWN fresh
 * classification read with this same terminal write as one atomic critical
 * section (`session-engine.mjs`'s `closeSessionByQuorum`/`cancelSession`)
 * can do so without re-acquiring the lock a second time (the lock is a
 * plain on-disk file mutex, not reentrant -- a nested acquisition attempt
 * from the SAME process would just retry against itself until timeout).
 * Every other caller uses the public, self-locking `transitionSessionStatus`
 * below instead.
 */
export function transitionSessionStatusLocked(coordinationId, status, extra, { sessionDir, eventsPath, manifestPath }) {
  const eventType = TERMINAL_EVENT_TYPE[status];
  if (!eventType) throw new CoordinationError('validation', `transitionSessionStatus: status must be one of ${Object.keys(TERMINAL_EVENT_TYPE).join(', ')}`);
  const payload = buildTerminalPayload(status, extra);
  validateEventPayload(eventType, payload);

  const manifest = readManifestRaw(manifestPath);
  assertSchemaVersionCurrent(manifest, manifestPath);
  if (manifest.status !== 'active') {
    throw new CoordinationError('validation', `session "${coordinationId}" is not active (status: "${manifest.status}") -- cannot transition to "${status}"`);
  }
  appendEventLocked(eventsPath, { type: eventType, payload }, sessionDir);
  manifest.status = status;
  manifest.completedAt = new Date().toISOString();
  validateManifest(manifest);
  writeManifestRaw(manifestPath, manifest);
  return Object.freeze(manifest);
}

/**
 * Transition a session to a terminal status (`completed`/`partial`/
 * `failed`/`cancelled`), appending the matching terminal event and updating
 * `session.json`'s `status`/`completedAt` as one atomic operation. Every
 * terminal status is absorbing: the `manifest.status !== 'active'` guard
 * below means no further transition is ever legal out of ANY terminal
 * status (Phase 06 R4: "bounded transitions" -- active -> exactly one of
 * completed/partial/failed/cancelled, never anywhere else).
 */
export function transitionSessionStatus(coordinationId, status, extra = {}, opts = {}) {
  const paths = resolveSessionPaths(coordinationId, opts);
  return withEventsLock(paths.eventsPath, () => transitionSessionStatusLocked(coordinationId, status, extra, paths));
}

/**
 * Acquire `coordinationId`'s events.lock and run `fn(paths)` inside it --
 * the SAME held lock `transitionSessionStatus`/every other store.mjs
 * mutator already uses. Exported so a caller that needs to (re-)read fresh
 * state and decide+write a terminal transition as ONE atomic critical
 * section can do so, instead of reading unlocked and handing a possibly-
 * stale decision to a separately-locked write later (the exact TOCTOU
 * `transitionSessionStatus`'s own `manifest.status !== 'active'` guard alone
 * cannot close -- that guard only re-checks status, never a caller's own
 * classification of WHICH actors/assignments are complete).
 */
export function withSessionLock(coordinationId, fn, opts = {}) {
  const paths = resolveSessionPaths(coordinationId, opts);
  return withEventsLock(paths.eventsPath, () => fn(paths));
}

/** Read the current manifest without replay reconstruction/consistency checks (see replay.mjs for that). */
export function readManifest(coordinationId, opts = {}) {
  const { manifestPath } = resolveSessionPaths(coordinationId, opts);
  return Object.freeze(readManifestRaw(manifestPath));
}

/** Read every event for a session, unvalidated beyond parse (see replay.mjs for consistency checks). */
export function readSessionEvents(coordinationId, opts = {}) {
  const { eventsPath } = resolveSessionPaths(coordinationId, opts);
  return readEvents(eventsPath);
}

export { resolveCoordinationPaths, resolveSessionPaths, STATUS_VALUES };
// appendEvent re-exported only for tests that want the plain (non-locked-
// batch) single-event append primitive against a session's own log.
export { appendEvent };
