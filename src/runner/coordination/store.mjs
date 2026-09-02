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
} from './schema.mjs';

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

function resolveSessionPaths(coordinationId, opts = {}) {
  if (typeof coordinationId !== 'string' || !coordinationId.trim()) {
    throw new CoordinationError('validation', 'coordinationId is required and must be a non-empty string');
  }
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

function writeManifestRaw(manifestPath, manifest) {
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
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
function completeAssignmentRegistration({ manifest, manifestPath, eventsPath, sessionDir, assignmentId, actorId }) {
  const alreadyAppended = readEvents(eventsPath).some(
    (event) => event.type === 'assignment-created' && event.payload?.assignmentId === assignmentId,
  );
  if (!alreadyAppended) {
    const eventPayload = { assignmentId, ...(actorId ? { actorId } : {}) };
    validateEventPayload('assignment-created', eventPayload);
    appendEventLocked(eventsPath, { type: 'assignment-created', payload: eventPayload }, sessionDir);
  }

  manifest.assignmentRefs = [...manifest.assignmentRefs, assignmentId];
  validateManifest(manifest);
  writeManifestRaw(manifestPath, manifest);
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
  { coordinationId, taskKey, actorId, contract, caller, work, workId, createdBy, options },
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
        completeAssignmentRegistration({
          manifest,
          manifestPath,
          eventsPath,
          sessionDir,
          assignmentId: claim.assignmentId,
          actorId,
        });
      }
      return Object.freeze(existing);
    }

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
    });

    return assignment;
  });
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
