# D04 - Guard Reconciliation

**Status:** accepted design
**Operation:** `dispatch.runtime.reconcile`
**Effect:** write
**Owner:** Dispatch runtime
**Incident drivers:** INC-10, INC-15, INC-17, INC-19
**Decision drivers:** DOEA-07, DOEA-08, DOEA-10

## Boundary

Recovery decides a Run's semantic future. Guard reconciliation repairs local
guard/projection state to agree with truth already proven. Reconciliation never
creates a new execution decision and never substitutes for the existing
standalone or CoordinationSession recovery doors.

`dispatch.runtime.reconcile` is a Dispatch-owned write operation with a narrow
subject: proven-stale local guard/projection state.

## Two-Step Protocol

```text
inspect or reconcile plan
  -> snapshot digest + action key + expiry + proposed action
operator apply
  -> re-read under short local lock
  -> verify snapshot/control/resource authority
  -> applied | already-applied | plan-stale | blocked | needs-input | refused
```

No lock spans adapter, network, model, or other external I/O. Action keys are
single-use and idempotent. Dead proof never derives from elapsed TTL alone.

## Supported Actions

| Action | Mutates | Required proof |
|---|---|---|
| `collect-result` | Link or collect an already-written normalized result through the owning authority. | Result bytes validate; owner authority matches; no newer current Run supersedes it. |
| `clear-cwd-lock` | Remove a cwd dispatch lock. | Holder identity is parseable; holder resource incarnation is dead/absent-proven; no active Run remains bound to that holder. |
| `clear-assignment-claim` | Remove `dispatch.claim`. | No linked result is pending collection; no admitted unsettled Run or pending launch exists; claimed resource absence is proven. |
| `repair-projection` | Rewrite a stale local projection marker such as `running` where immutable RunResult proves settlement. | Terminal RunResult validates and projection source epoch still matches. |

Each supported action is profile-gated. If an adapter cannot supply the proof
needed for an action, the action is `unsupported`, not best-effort.

## Preconditions

- Subject identity resolves uniquely.
- Guard content is parseable and identifies its holder where required.
- PID/resource incarnation matches the recorded holder before liveness is
  trusted.
- No current Run, pending launch, or owner authority contradicts cleanup.
- Snapshot digest, control epoch, and expiry match at apply time.
- The owning recovery authority permits any result collection/link step.
- The target path resolves inside the expected Dispatch storage or guard root.

## Refusals

`dispatch.runtime.reconcile` must refuse:

- kill or signal a process;
- admit, retry, resume, reassign, or cancel a Run;
- writable workspace takeover;
- semantic recovery;
- live, ambiguous, corrupt, or unparseable guard cleanup;
- TTL-only cleanup;
- "not delivered" inference from missing acknowledgment;
- cleanup where owner identity is missing or conflicting.

## CAS Shape

```json
{
  "actionKey": "reconcile_20260914_001",
  "subject": {"kind": "cwd-lock", "id": "lock_123"},
  "action": {"kind": "clear-cwd-lock"},
  "snapshot": {
    "digest": "sha256:...",
    "controlEpoch": 3,
    "resourceIncarnation": "pid:1234:start:...",
    "expiresAt": "2026-09-14T00:10:00.000Z"
  },
  "preconditions": [
    "holder-dead-proven",
    "no-active-run-for-holder"
  ]
}
```

Apply re-reads current state under a short lock and compares the full CAS set.
If any value differs, the result is `plan-stale`. If the action key was already
applied with the same snapshot and action, return the recorded outcome without
repeating mutation.

## Outcomes

| Outcome | Meaning |
|---|---|
| `applied` | Mutation happened exactly once. |
| `already-applied` | Same action key was previously consumed; prior outcome returned. |
| `plan-stale` | Snapshot/control/resource facts changed; caller must re-inspect. |
| `blocked` | Facts are complete but a supported precondition is false. |
| `needs-input` | Correct owner/person must decide; no automatic repair is legal. |
| `refused` | Request asks for unsupported/unsafe behavior. |

## Interaction With Inspection

Inspection may report:

```json
{
  "reconciliation": {
    "state": "available",
    "reason": "cwd lock holder is dead-proven and no active Run is bound",
    "planCommand": "fgos dispatch reconcile plan --cwd <path>"
  }
}
```

Inspection does not apply the action. Reconcile planning may reuse inspection
evaluators, but apply is a separate write operation with its own CAS gate.

## Required Proof

- Concurrent applies have one winner.
- Dead-holder cleanup cannot delete a successor's guard.
- TTL expiry with a live holder refuses.
- Missing/corrupt identity parks or refuses.
- A result landing between plan and apply makes the plan stale.
- Replaying an applied action returns the recorded outcome without repeating
  mutation.
- Static dependency test proves reconcile does not import process kill, retry,
  admission, resume, or reassignment operations.
