# D04 - Guard Reconciliation

**Status:** design draft
**Operation:** `dispatch.runtime.reconcile`
**Effect:** write
**Owner:** Dispatch runtime

## Boundary

Recovery decides a Run's semantic future. Guard reconciliation repairs local
guard/projection state to agree with truth already proven. Reconciliation never
creates a new execution decision.

## Supported Actions

1. Collect an existing normalized result that was durably written but not yet
   linked through its owning authority.
2. Clear a cwd dispatch lock whose exact holder incarnation is dead-proven and
   for which no active Run/resource remains.
3. Clear an Assignment `dispatch.claim` only when no linked result is pending,
   no admitted unsettled Run or pending launch exists, and resource absence is
   proven.
4. Repair a stale projection, such as a `running` marker where the immutable
   RunResult already proves settlement.

Each action follows:

```text
inspect/plan -> snapshot + action key + expiry
operator apply -> re-read under short lock -> CAS/authority checks
               -> applied | plan-stale | blocked | needs-input | refused
```

No lock spans adapter, network or other external I/O. Action keys are
single-use/idempotent. Dead proof never derives from elapsed TTL alone.

## Required Preconditions

- Subject identity resolves uniquely.
- Guard content is parseable and identifies its holder where required.
- PID/resource incarnation matches the recorded holder before a liveness
  conclusion is accepted.
- No current Run or pending launch contradicts cleanup.
- Snapshot, control epoch and expiry still match at apply time.
- The owning recovery authority permits any result collection/link step.

## Explicit Refusals

- kill or signal a process;
- admit, retry, resume or reassign a Run;
- writable takeover;
- clear a live, ambiguous or unparseable guard;
- infer not-delivered from missing acknowledgment;
- settle merely because a PID lookup missed;
- call a semantic recovery door automatically.

## Required Proof

- Concurrent applies have one winner.
- Dead-holder cleanup cannot delete a successor's guard.
- TTL expiry with a live holder refuses.
- Missing/corrupt identity parks or refuses.
- A result landing between plan and apply makes the plan stale.
- Replaying an applied action returns the recorded outcome without repeating
  mutation.
