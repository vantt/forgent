# S4/P05S - Coordination Session Recovery Door

**Status:** DESIGN APPROVED  
**Owner:** existing `CoordinationSession` write door  
**Depends on:** P01, P04 and P05 contracts

## Goal

Expose recovery of a session-owned Run without routing standalone Run mutation
through CoordinationSession and without giving the dispatch door session
authority.

## Public Contract

```text
fgos coordination recover <coordinationId>
  -> SessionRecoveryRecommendation {
       coordinationId, snapshotDigest, expectedEventSeq,
       expectedRunControlEpoch, actionKey, action, expiresAt, reason
     }

fgos coordination recover <coordinationId>
  --action <observe|collect|settle|close|park>
  --expected-snapshot <digest>
  --expected-event-seq <seq>
  --expected-run-control-epoch <epoch>
  --expected-expires-at <ISO-8601>
  --action-key <key>
  -> applied | already-applied | plan-stale | needs-input | refuse
```

The read call uses the shared pure evaluators. Apply enters the existing
CoordinationSession write door, verifies current driver authorization, snapshot,
event sequence, current Run control epoch, expiry and single-use action key,
then appends exactly one legal command event carrying the action key; replay
enforces single use. The door never reads mutable
configuration during replay.

Schema-2 adds one event family:

```text
recovery-command-recorded {
  invocationKey: actionKey,
  coordinationId,
  runId,
  action,
  snapshotDigest,
  expectedEventSeq,
  expectedRunControlEpoch,
  expiresAt,
  commandId
}
```

The store validates driver, expectations and unused `invocationKey` before
append. Replay validates shape/order and first-use uniqueness without reading
configuration. Adapter outcome is reconciled by `commandId`; a later outcome
event cannot change the declared action or target Run.

## Authority And Scope

- `dispatch recover` owns standalone Run recovery and appends no session event.
- `coordination recover` owns session recovery and cannot admit a standalone
  Run.
- Existing driver may observe, collect, settle an eligible exact Run, close
  when normal completion rules allow, or park.
- Missing/replaced driver returns `needs-input`; P07's separately authorized
  `driver-replaced` door is required before mutation by a new identity.
- Terminal-parent continuation remains refused. This door cannot bypass that
  policy or invoke close-after-steps implicitly.

## Crash And Concurrency

| Case | Result |
|---|---|
| snapshot changes before apply | `plan-stale`, no append |
| Run control epoch changes | `plan-stale`, no append |
| two applies use same action key | one append; other `already-applied` |
| result exists but is not linked | normalize and link only exact eligible Run |
| coordinator dies after command record | replay/reconcile command; no duplicate effect |
| current driver absent | `needs-input`, other safe observations continue |

## Acceptance

Prove read/apply parity with write-door legal-next rules, C-f result collection,
single-use apply, stale snapshot/event/Run refusal, current-driver enforcement,
no unconditional close, and schema-1 behavior unchanged. X11 must keep
premature-close hazard visible rather than converting it into successful
recovery.

## Non-goals

No driver replacement, parent-to-child transfer, writable workspace takeover,
automatic retry after unknown delivery, or new session event store.
