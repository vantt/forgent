# S4/P04-P05 - Read Evaluators And Recovery Planner

**Status:** DESIGN APPROVED  
**Owner:** coordination read model plus the existing dispatch CLI family  
**Depends on:** S1 Run identity

## Goal

Make recovery recommendations pure, deterministic and stale-safe while keeping
existing write doors as the only mutation boundary.

## Evaluator API

```text
legalNext(snapshot, facts) -> action | blocked(reason)
authorize(action, facts) -> allowed | needs-input(reason)
visibility(snapshot, caller) -> projection
completion(snapshot, evidence) -> complete | incomplete | unknown
```

Each evaluator consumes immutable facts and returns a typed value. Existing
write doors call the same functions; extraction must preserve schema-1 parity.

## Planner Contract

```text
plan(snapshot, evidence, requestedIntent)
 -> RecoveryRecommendation {snapshotHash, expectedControlEpoch, actionKey,
                             evidenceIds, action, expiresAt, reason}
```

`dispatch show-run` remains the read-only observation door. A future
`dispatch recover <runId>` without an action returns an ephemeral recommendation
with snapshot hash, expected control epoch, action key and expiry. Applying it
requires `--action`, `--expected-snapshot`, `--expected-control-epoch`,
`--expected-expires-at` and `--action-key`. The write door re-reads current state under a short CAS mutex,
compares expectations and consumes the action key once before recording exactly
one command. A changed snapshot is `plan-stale`; no token store is needed. No
lock spans external I/O. It never invokes unconditional close-after-steps. A
fresh driver without replacement authority gets `needs-input`.

## Staleness Rules

- changed event log hash -> `plan-stale`;
- changed Run control epoch -> `plan-stale`;
- expired recommendation -> `plan-expired`;
- repeated apply with consumed action key returns the prior outcome or
  `already-applied`, never repeats the effect;
- unknown external evidence -> `park`, not a guessed action.

## Acceptance

Prove planner determinism, missing-expectation refusal, stale-plan refusal,
expired-plan refusal, concurrent apply single-winner, action-key idempotency,
replay parity, schema-1 behavior and no implicit close. Read and write paths
must return identical authorization and legal-next facts.
