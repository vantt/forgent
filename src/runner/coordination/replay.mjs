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
  const linkedIds = new Set();
  for (const event of events) {
    validateEventPayload(event.type, event.payload);

    if (event.type === 'assignment-created') {
      const id = event.payload.assignmentId;
      if (createdIds.has(id)) {
        throw new CoordinationError('duplicate-ref', `session "${coordinationId}": duplicate "assignment-created" event for assignment "${id}"`);
      }
      createdIds.set(id, event);
    } else if (event.type === 'result-linked') {
      const id = event.payload.assignmentId;
      if (!createdIds.has(id)) {
        throw new CoordinationError(
          'out-of-order-ref',
          `session "${coordinationId}": "result-linked" event for assignment "${id}" that was never "assignment-created"`,
        );
      }
      if (linkedIds.has(id)) {
        throw new CoordinationError('duplicate-ref', `session "${coordinationId}": duplicate "result-linked" event for assignment "${id}"`);
      }
      linkedIds.add(id);
    }
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
    sessionDir,
  });
}
