# S1/P01 - Run Admission And Fencing

**Status:** DESIGN APPROVED  
**Owner:** `executeAssignment` Assignment/Run write door (session-ledger and
standalone Team-Dispatch-V1 callers)  
**Depends on:** S0 baseline

## Goal

Give every Assignment attempt one durable Run identity and ensure that only
the current fenced Run can settle an outcome or own the control lock.

## Domain Contract

```text
admit(assignmentId, retryId, predecessorRunId?, destination,
      payloadDigest, dispatchPlanDigest, expectedAssignmentVersion)
  -> {run, eventId} | version-conflict | duplicate-retry | invalid-predecessor

acquireControl(runId, holder, purpose, expectedControlEpoch?)
  -> {controlEpoch, controlToken} | held | stale

settle(runId, attempt, controlEpoch, controlToken,
       resourceIncarnation, payloadDigest, resultDigest)
  -> settled event | stale-run-result | run-not-admissible
```

`retryId` is caller idempotency; `runId` is generated once by the write door.
The destination and payload digest are part of the idempotency tuple. A retry
with the same tuple returns the committed Run; a changed tuple refuses.

## Ownership And Ports

The Assignment/Run write door is the only mutator. Both callers must funnel
through `executeAssignment`; fencing only in `session-engine.mjs` is
insufficient. P01 owns one append-only generation/release-marker primitive used
by schema-2 session retry, Assignment admission and Run control. It follows
`runtime-recovery-design.md` section 6 and never unlinks a generation record.
The current unlink-based `withEventsLock` remains only on unchanged legacy
paths; it is not the recovery fence. `Clock` and `ProcessEvidence` are read
facts; Herdr is not called by this phase.

## Commit Algorithm

There are three explicit paths:

1. **Initial admission:** under Assignment serialization, validate the existing
   Assignment/authorization reference and atomically publish Run attempt 1.
2. **Session retry:** acquire the session lock and then Assignment lock; validate
   current Run and bounds; append schema-2 `run-retried` containing `retryId`,
   `previousRunId`, `nextRunId`, `nextAttempt`, `admissionPayloadDigest` and
   `authorityRef`; release the session lock; publish exactly that declared Run
   under the Assignment lock. A crash after declaration resumes this identity.
   A pending declaration cannot be leapfrogged or inferred fulfilled from result
   link count. It may only be explicitly aborted through the same store door.
3. **Standalone retry:** under the Assignment lock, validate predecessor and
   atomically publish the new Run record containing the equivalent supersession
   declaration. No unrelated session event is invented.

All paths check `(assignmentId, retryId, destination, payloadDigest)` before
allocation. The same tuple returns the committed/declaration-bound Run; a
changed tuple refuses. Adapter I/O starts only after publication and lock
release.

Guard selection is by session schema, never by verb. Every schema-2 mutator—
authorize, retry, cancel, disposition, result link, close, recovery command and
later transfer—uses the same append-only session generation guard around
`appendEventLocked`. Schema-1 sessions retain their current guard and cannot use
exact-retry recovery. Session projection remains replay-derived; standalone
execution state remains the Run-file authority.

The guard replaces standalone `readdirSync` + max-attempt allocation. Admission
builds a complete fsynced same-filesystem staging directory, then atomically
renames it to the final attempt directory and fsyncs the parent. Final attempt
directories are never created empty. Destination conflict rereads the committed
Run; abandoned staging is not admission and is removed only after matching its
retry id and digest. `run.json` uses
`assignment-run.v2`; legacy v1 records are read-only for recovery and fail
closed when new fields are absent.

## Crash Matrix

| Crash point | Replay fact | Expected action |
|---|---|---|
| before staging rename | no committed Run | validate/remove matching staging and retry |
| after staging rename | complete committed Run | return same Run idempotently |
| after append before projection | event is truth | rebuild projection, same Run |
| after projection before response | committed Run | idempotent read returns Run |
| during concurrent admission | one version wins | loser gets version-conflict |
| retry declared before Run publication | pending declaration | publish same `nextRunId`; never allocate another |
| retry declaration aborted | terminal declaration | refuse identity reuse |
| result from superseded attempt | retained evidence | refuse settlement/current projection change |
| result with stale control token | stale controller | refuse and append no settlement |

## Lock Protocol

The Assignment admission guard protects allocation/publication only.
Separately, each Run publishes immutable, monotonically numbered control
generation records and token-specific release markers with exclusive hard
links. Contenders for the same next generation race on one path; one wins and
losers reread. Nothing unlinks a generation, so delayed stale cleanup cannot
delete a successor. A rebuildable `control.json` projection is not authority.
Every command carries epoch and token; no async adapter call runs inside the
publication critical section.

A `finally` marker is evidence, not death proof. Missing marker never proves
death. Reclaim requires PID-dead proof; heartbeat expiry only permits a
contender to attempt acquisition. With current effect semantics, a live PID
remains HELD.

## Acceptance

- concurrent identical admission produces one Run and one event;
- concurrent different retry tuple has one winner and typed loser;
- stale result cannot alter projection;
- crash before/after append replays deterministically;
- crash after staging creation but before rename leaves no admitted Run;
- session retry declaration survives crash before Run publication and resumes
  the exact `nextRunId`;
- schema-2 retry event rejects missing exact-destination fields while schema-1
  replay remains unchanged;
- concurrent schema-2 retry vs cancel has one event order: cancellation first
  forbids admission; retry first leaves an explicit pending/cancelled Run;
- concurrent retry vs result-link/close cannot infer retry fulfillment from
  link count or close over a pending declaration;
- two controller acquisitions of the same Run receive different epochs/tokens;
- an async adapter call cannot outlive its logical control token unnoticed;
- SIGKILL without marker can reclaim after PID-dead proof;
- SIGSTOP with expired heartbeat remains HELD;
- successor generation is not deleted by stale release.

## Non-goals

No Herdr lookup, fallback policy, workspace takeover or continuation event is
implemented here. Schema-1 callers remain behavior-compatible.
