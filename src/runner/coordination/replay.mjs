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
import { resolveSessionPaths, readManifestRaw, asCoordinationError } from './store.mjs';
import {
  CoordinationError,
  validateEventPayload,
  assertAssignmentIsSessionBlind,
  assertSchemaVersionCurrent,
  CONTRIBUTION_REF_PREFIX,
} from './schema.mjs';
import { validateAnchors, validateResponseLineage } from '../deliberation/schema.mjs';

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
  // The reconstructed answers to "what was dispatched", "what results
  // linked", and "what disposition was recorded" -- built from the event log
  // alone, so a caller can read the whole loop (authorization -> dispatch
  // provenance -> result -> recheck lineage -> disposition) without chat
  // history and without opening a single Assignment or RunResult file.
  // Recheck lineage is the join `assignments[].authorizationId` ->
  // `authorizations[].targetArtifactRef`: which artifact revision each
  // Assignment ran against, and which authorization made it legal.
  const assignments = [];
  const results = [];
  const dispositions = [];
  // Phase 07 (MVP7): validated cognitive aggregations, reconstructed the same
  // way authorizations are -- valid ones in `aggregations`, post-terminal ones
  // neutralized into `ignoredAggregations` rather than silently dropped.
  const aggregations = [];
  const ignoredAggregations = [];
  const aggregationIds = new Set();
  // Phase 08 (MVP8): linked deliberation contributions, reconstructed exactly
  // the way aggregations are. `resolvedContributionIds` is the derivation that
  // replaces a mutable status field: a contribution is RESOLVED iff some later
  // `driver-disposition-recorded` event's `targetRef` names it, and OPEN
  // otherwise. Nothing about that state is ever stored on the contribution
  // itself, so it cannot drift from the events it is derived from. The
  // resolving edge carries the same two read-time guards the contribution's
  // own branch does -- this session's driver identity, and the target already
  // walked -- so a hand-written log cannot resolve what the write door would
  // have refused.
  const contributions = [];
  const ignoredContributions = [];
  const contributionIds = new Set();
  const resolvedContributionIds = new Set();
  // The `knownContributions` input P08.1's lineage validators take, grown as
  // the log is walked so each contribution is only ever checked against the
  // ones that genuinely preceded it.
  const knownContributionsSoFar = new Map();

  const authorizations = [];
  const ignoredAuthorizations = [];
  const authorizationIds = new Set();
  const invocationKeys = new Map(); // invocationKey -> the authorizationId that first claimed it
  // Phase 09 (MVP9): specialist-slot authorizations, reconstructed the same
  // way `authorizations` is -- valid ones (pre-terminal) in
  // `specialistAuthorizations`, post-terminal ones neutralized into
  // `ignoredSpecialistAuthorizations` rather than silently dropped. "Live
  // now" (which specialist currently occupies a given slot) is a further
  // derivation on top of this raw list -- session-engine.mjs's
  // `resolveLiveSpecialistBindings`, not computed here, because "live" also
  // depends on the caller's own current round, which replay has no notion
  // of.
  const specialistAuthorizations = [];
  const ignoredSpecialistAuthorizations = [];
  const specialistAuthorizationIds = new Set();
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
    } else if (event.type === 'specialist-authorized') {
      // Same driver-identity and duplicate-id questions the aggregation/
      // contribution branches below ask, for the same reason: authorizing a
      // specialist into a slot is driver-authored session state, and an id
      // is claimed exactly once.
      const { specialistAuthorizationId, authorizedBy } = event.payload;
      if (authorizedBy.id !== manifest.provenanceRoot.writerId) {
        throw new CoordinationError(
          'foreign-ref',
          `session "${coordinationId}": "specialist-authorized" event "${specialistAuthorizationId}" was authorized by "${authorizedBy.id}", which is not this session's driver identity ("${manifest.provenanceRoot.writerId}") -- authorizing a specialist is driver-authored session state, never a participant's own claim`,
        );
      }
      if (specialistAuthorizationIds.has(specialistAuthorizationId)) {
        throw new CoordinationError(
          'duplicate-ref',
          `session "${coordinationId}": duplicate "specialist-authorized" event for authorization "${specialistAuthorizationId}"`,
        );
      }
      specialistAuthorizationIds.add(specialistAuthorizationId);
      const record = {
        specialistAuthorizationId,
        slotId: event.payload.slotId,
        specialistActorId: event.payload.specialistActorId,
        role: event.payload.role,
        capabilities: Object.freeze([...event.payload.capabilities]),
        authorizedBy: event.payload.authorizedBy,
        reason: event.payload.reason,
        triggerEvidenceRefs: Object.freeze([...event.payload.triggerEvidenceRefs]),
        allowedContextRefs: Object.freeze([...event.payload.allowedContextRefs]),
        maxAssignments: event.payload.maxAssignments,
        expiresAfterRound: event.payload.expiresAfterRound,
        ts: event.ts,
      };
      // Post-terminal: neutralized exactly like a post-terminal
      // authorization/aggregation -- excluded from `specialistAuthorizations`
      // (the only list `resolveLiveSpecialistBindings` reads), reported
      // separately, never silently dropped.
      (terminalSeen ? ignoredSpecialistAuthorizations : specialistAuthorizations).push(record);
    } else if (event.type === 'aggregation-validated') {
      // Read-time rejection of worker-shaped aggregate truth. `validateEventPayload`
      // (above) has already refused a `validatedBy.type` other than `"driver"`
      // and an aggregate naming its own output Assignment among its sources;
      // what THIS check adds is the session-scoped identity question the pure
      // shape validator cannot answer without a manifest: the driver named
      // must be THIS session's own driver. A worker actor id, or any other
      // session's driver, is refused -- so a hand-appended aggregation cannot
      // stand as validated truth merely by being well-formed.
      //
      // Boundary, stated plainly: this proves the event was written under the
      // session's own driver identity, NOT that a driver in the real world
      // authored it. A log editor who both writes to `events.jsonl` directly
      // and copies `provenanceRoot.writerId` out of the adjacent manifest
      // still produces an accepted event. That is the same unmediated-store-
      // door trust boundary Phase 06's visibility-window residuals already
      // name; nothing here narrows it.
      const { aggregationId, validatedBy } = event.payload;
      if (validatedBy.id !== manifest.provenanceRoot.writerId) {
        throw new CoordinationError(
          'foreign-ref',
          `session "${coordinationId}": "aggregation-validated" event "${aggregationId}" was validated by "${validatedBy.id}", which is not this session's driver identity ("${manifest.provenanceRoot.writerId}") -- a validated aggregation is driver-authored session state, never a participant's own claim about its work`,
        );
      }
      if (aggregationIds.has(aggregationId)) {
        throw new CoordinationError(
          'duplicate-ref',
          `session "${coordinationId}": duplicate "aggregation-validated" event for aggregation "${aggregationId}"`,
        );
      }
      aggregationIds.add(aggregationId);
      // Every cited source result must ALREADY have an accepted `result-linked`
      // earlier in this same log. An aggregate citing a result that this
      // session never linked -- or that only settles later -- is claiming
      // evidence it did not have when it was validated.
      for (const ref of event.payload.sourceResultRefs) {
        if ((linkedCountByAssignment.get(ref) ?? 0) === 0) {
          throw new CoordinationError(
            'out-of-order-ref',
            `session "${coordinationId}": "aggregation-validated" event "${aggregationId}" cites source result "${ref}", which has no accepted "result-linked" event before it in this session's log`,
          );
        }
      }
      // Internal-consistency check on a claimed `consensus`. A real
      // `classifyAggregationOutcome` run reached through
      // `validateSessionAggregation` can NEVER produce `consensus` alongside a
      // named missing/failed actor or an unresolved contribution: an
      // unsatisfied or unpinned binding makes its whole source operation
      // contribute nothing, which fails the evaluator's own coverage check and
      // forces `no-consensus`. So an event asserting all of it at once did not
      // come from a real validation call, whatever wrote it.
      //
      // Honest scope: this catches an INCONSISTENT forgery, not a careful one.
      // A forger who omits these fields still produces an accepted event --
      // see this cell's trace for the full boundary.
      if (event.payload.outcome === 'consensus') {
        for (const field of ['missingActors', 'failedActors', 'unresolvedContributionRefs', 'unboundSourceOperationRefs']) {
          if ((event.payload[field] ?? []).length > 0) {
            throw new CoordinationError(
              'validation',
              `session "${coordinationId}": "aggregation-validated" event "${aggregationId}" claims outcome "consensus" while naming ${field} [${event.payload[field].join(', ')}] -- a real evidence-preserving validation cannot reach consensus with an unsatisfied or unpinned source binding`,
            );
          }
        }
        // Same class of check, one more field: a real validation pins exactly
        // one `artifactRef@revision` per surviving source, and a `consensus`
        // requires every source to survive -- so the two lists are the same
        // length, and a consensus over zero pinned artifacts is not a shape a
        // real validation can emit. Needs no definition, so it belongs here
        // rather than at a definition-aware door.
        const artifactRevisionRefs = event.payload.artifactRevisionRefs ?? [];
        if (artifactRevisionRefs.length === 0) {
          throw new CoordinationError(
            'validation',
            `session "${coordinationId}": "aggregation-validated" event "${aggregationId}" claims outcome "consensus" with no artifactRevisionRefs -- a real evidence-preserving validation pins one artifact revision per surviving source, so a consensus over zero pinned artifacts preserved no evidence`,
          );
        }
        if (artifactRevisionRefs.length !== event.payload.sourceResultRefs.length) {
          throw new CoordinationError(
            'validation',
            `session "${coordinationId}": "aggregation-validated" event "${aggregationId}" claims outcome "consensus" with ${artifactRevisionRefs.length} artifactRevisionRefs against ${event.payload.sourceResultRefs.length} sourceResultRefs -- a real evidence-preserving validation pins exactly one artifact revision per cited source result`,
          );
        }
      }
      const record = {
        aggregationId,
        method: event.payload.method,
        outcome: event.payload.outcome,
        sourceResultRefs: Object.freeze([...event.payload.sourceResultRefs]),
        validatedBy: event.payload.validatedBy,
        ...(event.payload.assignmentId !== undefined ? { assignmentId: event.payload.assignmentId } : {}),
        ...(event.payload.runId !== undefined ? { runId: event.payload.runId } : {}),
        ...(event.payload.outputArtifactRef !== undefined ? { outputArtifactRef: event.payload.outputArtifactRef } : {}),
        ...(event.payload.dissentRefs !== undefined ? { dissentRefs: Object.freeze([...event.payload.dissentRefs]) } : {}),
        ...(event.payload.unresolvedContributionRefs !== undefined
          ? { unresolvedContributionRefs: Object.freeze([...event.payload.unresolvedContributionRefs]) }
          : {}),
        ...(event.payload.missingActors !== undefined ? { missingActors: Object.freeze([...event.payload.missingActors]) } : {}),
        ...(event.payload.failedActors !== undefined ? { failedActors: Object.freeze([...event.payload.failedActors]) } : {}),
        ...(event.payload.unboundSourceOperationRefs !== undefined
          ? { unboundSourceOperationRefs: Object.freeze([...event.payload.unboundSourceOperationRefs]) }
          : {}),
        ...(event.payload.artifactRevisionRefs !== undefined
          ? { artifactRevisionRefs: Object.freeze([...event.payload.artifactRevisionRefs]) }
          : {}),
        ts: event.ts,
      };
      // Post-terminal: neutralized exactly like a post-terminal authorization
      // -- excluded from `aggregations` (the only list a terminal-input
      // consumer reads), reported separately, never silently dropped, and
      // never a throw that would make the whole session unreadable.
      (terminalSeen ? ignoredAggregations : aggregations).push(record);
    } else if (event.type === 'deliberation-contribution-linked') {
      // Same three read-time questions the aggregation branch above asks, for
      // the same reasons: the driver identity is this session's own, the id is
      // claimed once, and the evidence really settled before it was cited.
      const { contributionId, linkedBy, assignmentId } = event.payload;
      if (linkedBy.id !== manifest.provenanceRoot.writerId) {
        throw new CoordinationError(
          'foreign-ref',
          `session "${coordinationId}": "deliberation-contribution-linked" event "${contributionId}" was linked by "${linkedBy.id}", which is not this session's driver identity ("${manifest.provenanceRoot.writerId}") -- linking a contribution is driver-authored session state, never a participant's own claim about its work`,
        );
      }
      if (contributionIds.has(contributionId)) {
        throw new CoordinationError(
          'duplicate-ref',
          `session "${coordinationId}": duplicate "deliberation-contribution-linked" event for contribution "${contributionId}"`,
        );
      }
      if ((linkedCountByAssignment.get(assignmentId) ?? 0) === 0) {
        throw new CoordinationError(
          'out-of-order-ref',
          `session "${coordinationId}": "deliberation-contribution-linked" event "${contributionId}" is backed by assignment "${assignmentId}", which has no accepted "result-linked" event before it in this session's log -- a contribution is backed by a settled Run, never by one that only settles later`,
        );
      }
      // Lineage, checked with P08.1's own validators against the contributions
      // accepted SO FAR in this walk. That ordering is what makes a cycle
      // unrepresentable rather than merely detected: every anchor/respondsTo
      // must already have been linked earlier in the same log, and an
      // append-only log admits no back edge.
      try {
        validateAnchors(event.payload, knownContributionsSoFar, coordinationId);
        validateResponseLineage(event.payload, knownContributionsSoFar, coordinationId);
      } catch (err) {
        asCoordinationError(err, `session "${coordinationId}": contribution "${contributionId}"`);
      }
      contributionIds.add(contributionId);
      knownContributionsSoFar.set(contributionId, {
        sessionId: coordinationId,
        ...(event.payload.respondsTo !== undefined ? { respondsTo: event.payload.respondsTo } : {}),
      });
      const record = {
        contributionId,
        operationRef: event.payload.operationRef,
        type: event.payload.type,
        assignmentId,
        runId: event.payload.runId,
        artifactRef: event.payload.artifactRef,
        revision: event.payload.revision,
        roundKey: event.payload.roundKey,
        visibilityWindowRef: event.payload.visibilityWindowRef,
        linkedBy: event.payload.linkedBy,
        ...(event.payload.anchors !== undefined ? { anchors: Object.freeze([...event.payload.anchors]) } : {}),
        ...(event.payload.respondsTo !== undefined ? { respondsTo: event.payload.respondsTo } : {}),
        ts: event.ts,
      };
      (terminalSeen ? ignoredContributions : contributions).push(record);
    } else if (event.type === 'driver-disposition-recorded') {
      // A disposition naming a contribution is what RESOLVES it. Collected
      // only while the session is pre-terminal, on the same footing as every
      // other post-terminal neutralization here: a disposition that reached
      // disk after the session closed cannot change what the closed session
      // had settled.
      if (!terminalSeen && event.payload.targetRef.startsWith(CONTRIBUTION_REF_PREFIX)) {
        // Same driver-identity question the contribution branch above asks,
        // asked here for the same reason: resolving a contribution is derived
        // session state, so the event that flips it must carry this session's
        // own driver identity. `validateEventPayload` is shape-only by design
        // and answers `authorizedBy.type === 'driver'`, never WHICH driver.
        if (event.payload.authorizedBy.id !== manifest.provenanceRoot.writerId) {
          throw new CoordinationError(
            'foreign-ref',
            `session "${coordinationId}": "driver-disposition-recorded" event targeting "${event.payload.targetRef}" was authorized by "${event.payload.authorizedBy.id}", which is not this session's driver identity ("${manifest.provenanceRoot.writerId}") -- resolving a contribution is driver-authored session state`,
          );
        }
        // A disposition can only resolve a contribution the walk has ALREADY
        // seen. The write door refuses a `contribution:` ref for an unlinked
        // id, so this is the same ordering discipline the contribution branch
        // above applies to its own backing assignment, applied to the
        // disposition -> contribution edge.
        const targetContributionId = event.payload.targetRef.slice(CONTRIBUTION_REF_PREFIX.length);
        if (contributionIds.has(targetContributionId)) {
          resolvedContributionIds.add(targetContributionId);
        }
      }
      dispositions.push({
        targetRef: event.payload.targetRef,
        disposition: event.payload.disposition,
        rationale: event.payload.rationale,
        evidenceRefs: Object.freeze([...event.payload.evidenceRefs]),
        authorizedBy: event.payload.authorizedBy,
        ts: event.ts,
      });
    }

    if (event.type === 'assignment-created') {
      const id = event.payload.assignmentId;
      if (createdIds.has(id)) {
        throw new CoordinationError('duplicate-ref', `session "${coordinationId}": duplicate "assignment-created" event for assignment "${id}"`);
      }
      createdIds.set(id, event);
      assignments.push({
        assignmentId: id,
        actorId: event.payload.actorId,
        operationId: event.payload.operationId,
        nodeId: event.payload.nodeId,
        authorizationId: event.payload.authorizationId,
        invocationKey: event.payload.invocationKey,
        ...(event.payload.contextGrant !== undefined
          ? { contextGrant: Object.freeze({ refs: Object.freeze([...event.payload.contextGrant.refs]) }) }
          : { contextGrant: undefined }),
        ts: event.ts,
      });
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
      // Every accepted link, in log order -- a caller takes the LAST entry
      // for an assignmentId as the current authoritative view (the same rule
      // the retry-supersession clause above states), with the earlier links
      // still present as the historical record they are.
      results.push({ assignmentId: id, runId: event.payload.runId, ts: event.ts });
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
    specialistAuthorizations: Object.freeze(specialistAuthorizations.map((record) => Object.freeze(record))),
    ignoredSpecialistAuthorizations: Object.freeze(ignoredSpecialistAuthorizations.map((record) => Object.freeze(record))),
    assignments: Object.freeze(assignments.map((record) => Object.freeze(record))),
    results: Object.freeze(results.map((record) => Object.freeze(record))),
    dispositions: Object.freeze(dispositions.map((record) => Object.freeze(record))),
    aggregations: Object.freeze(aggregations.map((record) => Object.freeze(record))),
    ignoredAggregations: Object.freeze(ignoredAggregations.map((record) => Object.freeze(record))),
    contributions: Object.freeze(contributions.map((record) => Object.freeze(record))),
    ignoredContributions: Object.freeze(ignoredContributions.map((record) => Object.freeze(record))),
    // Open/resolved, derived here and nowhere else. A disposition naming a
    // contribution this session never linked resolves nothing (the write door
    // refuses one, and this intersection refuses it again on a hand-written
    // log), so the two lists always partition the linked set exactly.
    resolvedContributionIds: Object.freeze(contributions.filter((c) => resolvedContributionIds.has(c.contributionId)).map((c) => c.contributionId)),
    openContributionIds: Object.freeze(contributions.filter((c) => !resolvedContributionIds.has(c.contributionId)).map((c) => c.contributionId)),
    sessionDir,
  });
}
