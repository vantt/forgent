// coordination/replay.mjs — reconstructs a CoordinationSession's state by
// replaying `events.jsonl` against `session.json`, and fails closed on any
// of the corruption shapes docs/architect/agent-coordination/contracts/
// coordination-session.md's "Recovery Rule" and "Required Negative Tests"
// name: a schemaVersion mismatch, a corrupt/truncated log line (bubbled
// unchanged from state/events.mjs's own EventLogError('corrupt-log')), a
// duplicate `assignment-created` for one id, a dangling ref in EITHER
// direction (an `assignmentRefs` entry with no matching event, or an event
// with no matching `assignmentRefs` entry -- the exact "interrupted write"
// shape the atomic-ref rule in store.mjs guards against but a real crash
// can still produce), a foreign ref (an id that does not exist under
// `.fgos/assignments/`, or whose on-disk Assignment carries a forbidden
// session/coordination field), and an out-of-order ref (`result-linked`
// for an id that was never `assignment-created`).
//
// Pure read path: no writes, ever. A caller that wants to "fix" a detected
// inconsistency does so through store.mjs's own doors, never by having
// replay silently patch the manifest or the log.

import fs from 'node:fs';
import path from 'node:path';
import { readEvents } from '../../state/events.mjs';
import { resolveSessionPaths, readManifestRaw } from './store.mjs';
import { CoordinationError, validateEventPayload, assertAssignmentIsSessionBlind, assertSchemaVersionCurrent } from './schema.mjs';

// Same parse+validate path store.mjs's own read/write operations use (never
// a second, independently-maintained copy); this only adds the extra
// schemaVersion-mismatch check (schema.mjs's assertSchemaVersionCurrent,
// shared with every store.mjs mutator) replay's "is this an old manifest on
// disk" context calls for.
// The four absorbing terminal event kinds (`transitionSessionStatus`'s own
// TERMINAL_EVENT_TYPE table, store.mjs) -- once one appears in the log, no
// later `operation-authorized` event is valid.
const TERMINAL_EVENT_TYPES = new Set(['session-completed', 'session-partial', 'session-failed', 'session-cancelled']);

function readManifestForReplay(manifestPath) {
  const manifest = readManifestRaw(manifestPath);
  assertSchemaVersionCurrent(manifest, manifestPath);
  return manifest;
}

/**
 * Reconstruct and validate one CoordinationSession's state from disk.
 * Throws `CoordinationError` (see module doc comment for every category)
 * on any inconsistency instead of returning a partially-trustworthy view.
 *
 * @param {string} coordinationId
 * @param {object} [opts] Workspace options ({ cwd, repoRoot })
 * @returns {Readonly<{manifest: object, assignmentRefs: string[], events: object[]}>}
 */
export function replaySession(coordinationId, opts = {}) {
  const { fgosDir, sessionDir, eventsPath, manifestPath } = resolveSessionPaths(coordinationId, opts);
  const manifest = readManifestForReplay(manifestPath);

  // readEvents() itself throws EventLogError('corrupt-log') the moment any
  // line fails to parse -- that fail-closed guarantee is inherited
  // unchanged, not re-implemented here.
  const events = readEvents(eventsPath);

  const createdIds = new Map(); // assignmentId -> event
  // Phase 06 R2: a second (or later) `result-linked` event for the SAME
  // assignmentId is legal ONLY when a `run-retried` event for that
  // assignmentId appears strictly between the previous link and this one --
  // i.e. the supersession was properly DECLARED first (store.mjs's
  // `linkResult({allowSupersede: true})` already enforces this at write
  // time; this is the read-time mirror of that same rule, so a hand-crafted
  // or corrupted log cannot fake a supersession replay would otherwise
  // silently accept). `linkedCountByAssignment`/`retriedCountByAssignment`
  // are running counters as the log is walked in order; `retriedCountAtLastLink`
  // snapshots the retry counter at the moment of each accepted link, so the
  // NEXT link is only accepted once that counter has strictly increased.
  const linkedCountByAssignment = new Map();
  const retriedCountByAssignment = new Map();
  const retriedCountAtLastLink = new Map();

  // Recovery Rule point 5, read side: "Regardless of write-time ordering,
  // replay must treat any `operation-authorized` event appearing after a
  // terminal event in `events.jsonl` as invalid/ignored." Ignored here means
  // neutralized -- excluded from `authorizations` (so the dispatch gate,
  // which only ever consults that list, can never be satisfied by one) and
  // reported separately in `ignoredAuthorizations` rather than silently
  // dropped. Deliberately NOT a throw: a post-terminal authorization is the
  // exact race the write path's own lock exists to prevent, and the contract
  // anticipates it reaching disk anyway -- making the whole session
  // permanently unreadable over an authorization that can no longer
  // authorize anything would be a strictly worse failure mode than
  // neutralizing it, and the safety property ("it can never authorize a
  // dispatch") holds identically either way.
  const authorizations = [];
  const ignoredAuthorizations = [];
  const authorizationIds = new Set();
  const invocationKeys = new Map(); // invocationKey -> the authorizationId that first claimed it
  let terminalSeen = false;

  for (const event of events) {
    validateEventPayload(event.type, event.payload);

    if (TERMINAL_EVENT_TYPES.has(event.type)) {
      terminalSeen = true;
    } else if (event.type === 'operation-authorized') {
      const { authorizationId } = event.payload;
      if (authorizationIds.has(authorizationId)) {
        throw new CoordinationError(
          'duplicate-ref',
          `session "${coordinationId}": duplicate "operation-authorized" event for authorization "${authorizationId}"`,
        );
      }
      authorizationIds.add(authorizationId);
      // Read-time mirror of `authorizeOperation`'s session-scoped
      // `invocationKey` uniqueness rule, at exact parity with the
      // duplicate-`authorizationId` check just above it: a log carrying two
      // authorizations for one key could only come from a write path that
      // never went through that door, and accepting it would let one logical
      // invocation be issued twice.
      const { invocationKey } = event.payload;
      if (invocationKeys.has(invocationKey)) {
        throw new CoordinationError(
          'duplicate-ref',
          `session "${coordinationId}": invocationKey "${invocationKey}" is claimed by more than one "operation-authorized" event ("${invocationKeys.get(invocationKey)}" and "${authorizationId}") -- an invocationKey is consumed exactly once per session`,
        );
      }
      invocationKeys.set(invocationKey, authorizationId);
      const record = {
        authorizationId,
        operationId: event.payload.operationId,
        nodeId: event.payload.nodeId,
        targetActorId: event.payload.targetActorId,
        invocationKey: event.payload.invocationKey,
        authorizedBy: event.payload.authorizedBy,
        grantedContextRefs: Object.freeze([...event.payload.grantedContextRefs]),
        ...(event.payload.targetArtifactRef !== undefined ? { targetArtifactRef: event.payload.targetArtifactRef } : {}),
        consumedByAssignmentId: null,
      };
      (terminalSeen ? ignoredAuthorizations : authorizations).push(record);
    }

    if (event.type === 'assignment-created') {
      const id = event.payload.assignmentId;
      if (createdIds.has(id)) {
        throw new CoordinationError('duplicate-ref', `session "${coordinationId}": duplicate "assignment-created" event for assignment "${id}"`);
      }
      createdIds.set(id, event);
    } else if (event.type === 'run-retried') {
      const id = event.payload.assignmentId;
      if (!createdIds.has(id)) {
        throw new CoordinationError(
          'out-of-order-ref',
          `session "${coordinationId}": "run-retried" event for assignment "${id}" that was never "assignment-created"`,
        );
      }
      retriedCountByAssignment.set(id, (retriedCountByAssignment.get(id) ?? 0) + 1);
    } else if (event.type === 'result-linked') {
      const id = event.payload.assignmentId;
      if (!createdIds.has(id)) {
        throw new CoordinationError(
          'out-of-order-ref',
          `session "${coordinationId}": "result-linked" event for assignment "${id}" that was never "assignment-created"`,
        );
      }
      const priorLinks = linkedCountByAssignment.get(id) ?? 0;
      if (priorLinks > 0) {
        const retriedSoFar = retriedCountByAssignment.get(id) ?? 0;
        const retriedAtLastLink = retriedCountAtLastLink.get(id) ?? 0;
        if (retriedSoFar <= retriedAtLastLink) {
          throw new CoordinationError(
            'duplicate-ref',
            `session "${coordinationId}": duplicate "result-linked" event for assignment "${id}" with no intervening "run-retried" authorization`,
          );
        }
      }
      linkedCountByAssignment.set(id, priorLinks + 1);
      retriedCountAtLastLink.set(id, retriedCountByAssignment.get(id) ?? 0);
    } else if (event.type === 'actor-replaced') {
      // No ordering invariant beyond the generic shape check
      // (validateEventPayload above) -- replaceSessionActor's own
      // idempotent-append guard (recordActorReplacement) is what prevents a
      // duplicate at write time; replay has no additional cross-event rule
      // to enforce here.
    }
  }

  // An authorization is CONSUMED by the one `assignment-created` event that
  // carries its `authorizationId` (store.mjs enforces at most one, lock-held,
  // at write time; this is the read-time reconstruction of that fact). An
  // `assignment-created` naming an authorization the log never declared is a
  // fabricated provenance claim -- fail closed, the same posture every other
  // cross-event reference check in this function takes. Checked here, before
  // the assignmentRefs cross-checks below, so the reported reason names the
  // authorization rather than a downstream symptom.
  const authorizationById = new Map(authorizations.map((record) => [record.authorizationId, record]));
  for (const [id, event] of createdIds) {
    const authorizationId = event.payload.authorizationId;
    if (authorizationId === undefined) continue;
    const record = authorizationById.get(authorizationId);
    if (!record) {
      throw new CoordinationError(
        'dangling-ref',
        `session "${coordinationId}": "assignment-created" event for "${id}" claims authorization "${authorizationId}", which no valid "operation-authorized" event in this session ever declared`,
      );
    }
    if (record.consumedByAssignmentId !== null) {
      throw new CoordinationError(
        'duplicate-ref',
        `session "${coordinationId}": authorization "${authorizationId}" is claimed by more than one "assignment-created" event ("${record.consumedByAssignmentId}" and "${id}") -- one authorization materializes at most one Assignment`,
      );
    }
    record.consumedByAssignmentId = id;
  }

  const refsSet = new Set(manifest.assignmentRefs);

  // Dangling, direction 1: an assignment-created event with no matching
  // assignmentRefs entry -- the exact "interrupted write" (crash between
  // the event append and the assignmentRefs append) the contract's
  // Required Negative Tests names. Never fabricated into the reconstructed
  // membership; always reported.
  for (const id of createdIds.keys()) {
    if (!refsSet.has(id)) {
      throw new CoordinationError(
        'dangling-ref',
        `session "${coordinationId}": "assignment-created" event for "${id}" has no corresponding assignmentRefs entry (interrupted write, or a corrupted manifest)`,
      );
    }
  }

  // Dangling, direction 2: an assignmentRefs entry with no matching event
  // -- the manifest claims membership the event log does not corroborate.
  for (const id of refsSet) {
    if (!createdIds.has(id)) {
      throw new CoordinationError(
        'dangling-ref',
        `session "${coordinationId}": assignmentRefs entry "${id}" has no corresponding "assignment-created" event`,
      );
    }
  }

  // Foreign ref: every referenced Assignment must actually exist on disk,
  // and must stay session-blind (ADR-008 Decision 2).
  const assignmentsDir = path.join(fgosDir, 'assignments');
  for (const id of manifest.assignmentRefs) {
    const assignmentPath = path.join(assignmentsDir, id, 'assignment.json');
    if (!fs.existsSync(assignmentPath)) {
      throw new CoordinationError('foreign-ref', `session "${coordinationId}": assignmentRefs entry "${id}" does not exist under ${assignmentsDir}`);
    }
    let assignmentObj;
    try {
      assignmentObj = JSON.parse(fs.readFileSync(assignmentPath, 'utf8'));
    } catch (err) {
      throw new CoordinationError('corrupt-log', `session "${coordinationId}": assignment.json for "${id}" at ${assignmentPath} is not valid JSON: ${err.message}`);
    }
    assertAssignmentIsSessionBlind(assignmentObj, id);
  }

  return Object.freeze({
    manifest: Object.freeze(manifest),
    assignmentRefs: Object.freeze([...manifest.assignmentRefs]),
    events: Object.freeze(events),
    authorizations: Object.freeze(authorizations.map((record) => Object.freeze(record))),
    ignoredAuthorizations: Object.freeze(ignoredAuthorizations.map((record) => Object.freeze(record))),
    sessionDir,
  });
}
