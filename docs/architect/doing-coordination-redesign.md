# Doing Coordination Redesign

Status: design target
Date: 2026-08-25
Scope: fgOS work-item claim, coordination, durable event history, effective status views

## 1. Problem Statement

fgOS currently uses durable work-item status transitions as both workflow truth and live coordination. A worker claim writes a durable `work.move` event to `doing`; later return, reject, verify-fail, or release paths expect the item to still be durable `doing`.

That coupling creates the core failure mode:

- active ownership is short-lived runtime state, but it is written into the committed event stream;
- claim/release churn dirties the main checkout even when no durable work outcome exists yet;
- concurrent sessions must merge operational claim noise;
- readers cannot distinguish "durable workflow state" from "currently being worked";
- release-to-`todo` erases the difference between a never-started item and a previously attempted item unless they inspect incidental transition history.

The redesign separates those meanings without deleting `doing` as a domain concept.

## 2. Goals

1. Keep `doing` visible and queryable for humans, workers, dashboards, and scheduling.
2. Stop writing durable current-status `doing` at claim-time.
3. Preserve durable history of every real execution attempt.
4. Distinguish:
   - never-started claimable work;
   - previously attempted but claimable work;
   - currently active work;
   - parked/final workflow states.
5. Prevent double-claim and double-settle without relying on `expectedStatus: "doing"`.
6. Reduce main-checkout churn by keeping live coordination out of committed event logs.
7. Keep the implementation file-based and process-local friendly. No daemon is required.
8. Make scheduling, listing, blocking, stale reclaim, and anti-loop read the correct state layer.

## 3. Non-Goals

1. Do not add a daemon or long-running coordinator process.
2. Do not keep backward-compat branches that preserve durable claim-time `doing`.
3. Do not add `started` as a durable current status.
4. Do not make `state.json` a source of truth.
5. Do not solve every eventlog merge concern by hiding durable events. Durable outcome history remains committed.

## 4. Core Decision

`doing` is split into two meanings:

1. `doing-current`
   - Represents an active claim right now.
   - Lives in runtime coordination.
   - Appears in the effective read model.
   - Is queryable via list/status APIs.
   - Is not written as durable current status at claim-time.

2. `doing-history`
   - Represents that an item had a real attempt/run.
   - Lives in durable event history.
   - Feeds audit, retry, anti-loop, and "has this ever been started?" decisions.
   - Is append-only and committed when the attempt settles, releases, fails, or is reclaimed.

The durable current status answers: "what stable workflow state is this item in?"

Runtime coordination answers: "who is actively holding this item right now?"

The effective view answers: "what should a user or scheduler see right now?"

## 5. State Layers

### 5.1 Durable Event Log

The durable event log remains the committed truth for workflow outcomes and attempt history.

It should contain:

- work creation and edits;
- durable workflow moves such as `todo -> awaiting-approval`, `todo -> blocked`, `awaiting-approval -> delivered`;
- attempt/run settlement records;
- reclaim/release/abandon records when they have durable meaning.

It should not contain:

- claim-time `work.move -> doing`;
- heartbeat updates;
- last-activity observations;
- transient lock acquisition/release noise.

### 5.2 Derived Durable View

`state.json` is a rebuildable cache. It must remain ignored and must never become an authority for coordination.

It may include derived attempt fields such as:

- `attemptCount`;
- `lastAttempt`;
- `hasStarted`;
- per-item durable revision/hash used for CAS.

It should not be used alone by any code path that needs to know whether an item is actively claimed.

### 5.3 Runtime Coordination Store

Runtime coordination stores active claims. It is local/runtime state and should be gitignored.

It is the authority for:

- active claim ownership;
- active `doing-current`;
- claim liveness;
- claim release;
- claim reclaim eligibility;
- preventing another process from picking the same item.

It is not the authority for:

- delivered/blocked/awaiting workflow state;
- audit history;
- attempt counts;
- anti-loop history.

### 5.4 Effective View

The effective view overlays runtime claims onto durable state:

```txt
effectiveStatus(item) =
  activeClaim(item.id) exists and is valid
    ? "doing"
    : durableStatus(item)
```

This is the view consumed by:

- `list --status doing`;
- dashboards;
- `pick`;
- `take`;
- frontier calculation;
- worker-slot visibility;
- open descendant checks;
- stale claim presentation;
- any user-facing status query.

The effective view must preserve durable attempt metadata. A previously attempted but released item still shows as claimable, but carries `attemptCount > 0` or `hasStarted = true`.

## 6. Status Semantics

### 6.1 Durable Current Status

Durable current status is only for stable workflow state.

Allowed durable status categories should represent states such as:

- `todo` - claimable work that is not parked or final;
- `awaiting-approval` - work submitted for review;
- `blocked` - cannot proceed without a condition being resolved;
- `awaiting-human` - parked on human input;
- `delivered` or equivalent final success state;
- `wontfix` or equivalent terminal non-delivery state.

`doing` should not be produced by claim acquire as durable current status.

If the implementation keeps a `doing` enum value for effective statuses or historical run segments, it must be clearly separated from durable current-status transitions.

### 6.2 Effective Status

Effective status is what the system presents at runtime.

An item may have:

```json
{
  "status": "todo",
  "effectiveStatus": "doing",
  "claim": {
    "claimId": "c1",
    "actor": "runner-1"
  },
  "attemptCount": 0
}
```

This means the durable workflow has not settled yet, but the item is actively owned.

### 6.3 Started Is Not A Durable Status

Do not add `started` as a durable current status.

`started` mixes two different facts:

- whether an item has ever had an attempt;
- whether an item is currently claimable or active.

Use durable attempt metadata instead:

```json
{
  "status": "todo",
  "attemptCount": 1,
  "hasStarted": true,
  "lastAttempt": {
    "result": "released",
    "endedAt": "2026-08-25T03:30:00.000Z"
  }
}
```

This remains claimable while preserving that it is not fresh work.

## 7. Data Model

### 7.1 Runtime Claim

Runtime claim records should include enough data to validate settlement without using durable `doing`.

```json
{
  "claimId": "claim-01K3...",
  "id": "tsk-123",
  "actor": "runner-1",
  "role": "agent",
  "phase": "execute",
  "preClaimStatus": "todo",
  "preClaimRevision": "item-rev-before-claim",
  "branch": "fgw/tsk-123",
  "headAtTake": "main-head-sha-or-null",
  "branchHeadAtTake": "branch-head-sha-or-null",
  "claimTrigger": "pick",
  "acquiredAt": "2026-08-25T03:00:00.000Z",
  "lastObservedActivityAt": "2026-08-25T03:10:00.000Z",
  "hardExpiresAt": "2026-08-26T03:00:00.000Z"
}
```

Required properties:

- `claimId` uniquely identifies this ownership lease.
- `id` identifies the work item.
- `actor` identifies the owner allowed to settle or release.
- `preClaimStatus` is the durable status at acquire time.
- `preClaimRevision` is the durable per-item revision/hash at acquire time.
- `acquiredAt` supports audit and diagnostics.
- `lastObservedActivityAt` supports liveness-based reclaim.

`hardExpiresAt` is only a safety backstop. It must not replace real liveness checks.

### 7.2 Durable Attempt Event

When an attempt settles, releases, fails, or is reclaimed, write a durable event describing the attempt.

```json
{
  "op": "work.attempt",
  "id": "tsk-123",
  "claimId": "claim-01K3...",
  "phase": "execute",
  "from": "todo",
  "to": "awaiting-approval",
  "result": "submitted",
  "reason": "verify-pass",
  "actor": "runner-1",
  "branch": "fgw/tsk-123",
  "headAtTake": "main-head-sha-or-null",
  "branchHeadAtTake": "branch-head-before-work",
  "branchHeadAtReturn": "branch-head-after-work",
  "startedAt": "2026-08-25T03:00:00.000Z",
  "endedAt": "2026-08-25T03:40:00.000Z"
}
```

Recommended `result` values:

- `submitted` - worker completed and submitted for approval;
- `released` - owner intentionally gave the item back;
- `failed` - attempt ended unsuccessfully;
- `verify-failed` - verification failed and item moved to a parked or retryable state;
- `reclaimed` - system took ownership back from an inactive claim;
- `abandoned` - claim became invalid without a normal owner release.

The exact enum may differ, but it must cover the business meanings above.

### 7.3 Durable Workflow Move

If an attempt changes stable workflow status, write the durable workflow move as part of the same settlement operation.

Example settlement:

```txt
runtime before:
  active claim exists for tsk-123

durable before:
  status = todo
  revision = rev-10

settle:
  validate claimId, owner, preClaimStatus, preClaimRevision
  append work.attempt result=submitted from=todo to=awaiting-approval
  append work.move to=awaiting-approval expectedRevision=rev-10
  remove runtime claim

effective after:
  status = awaiting-approval
```

No durable intermediate `work.move to=doing` is required.

## 8. Module Boundaries

### 8.1 Coordination Module

Owns runtime active claims.

Responsibilities:

- acquire claim;
- read active claims;
- validate claim ownership;
- update liveness observation;
- release claim;
- reclaim eligible stale claims.

It may share field names with durable attempt events, but it must not write durable workflow history directly except through the store facade.

### 8.2 Durable Store Module

Owns append-only durable event writes and derived durable view refresh.

Responsibilities:

- validate durable workflow transitions;
- append durable events;
- rebuild durable state;
- expose durable item revision/hash;
- record attempt history.

It must not use runtime claim files as durable truth.

### 8.3 Effective View Module

Owns overlay composition.

Responsibilities:

- combine durable view with active claims;
- compute `effectiveStatus`;
- expose claim metadata safe for display;
- preserve durable attempt metadata;
- provide read helpers for status queries and scheduling.

This module is the read boundary for scheduling and UI surfaces. Code that asks "what is doing now?" must go through this module or an equivalent explicit overlay helper.

### 8.4 Claim Port

The claim port remains the choke point for user and runner claim flows.

Responsibilities:

- select eligible item using effective view;
- acquire runtime claim atomically;
- create/attach worktree or branch context;
- return claim information to caller;
- avoid durable `work.move -> doing`.

No caller should implement its own claim eligibility or active-claim write path.

## 9. Required Flows

### 9.1 First Claim

```txt
input:
  item status = todo
  attemptCount = 0
  no active claim

steps:
  read durable view
  read runtime claims
  verify effective status is todo
  capture preClaimStatus and preClaimRevision
  write runtime claim
  prepare worktree/branch

durable event writes:
  none for claim-time doing

result:
  durable status = todo
  effective status = doing
  attemptCount = 0 until attempt settles
```

If the implementation wants open attempts to appear in attempt projections before settle, that must be a derived projection from runtime claim, not a committed durable attempt completion.

### 9.2 Successful Return For Approval

```txt
input:
  active claim exists
  durable item still matches preClaimRevision or accepted reconcile rule

steps:
  validate claim owner and claimId
  validate durable revision
  append durable attempt result=submitted
  append durable workflow move to awaiting-approval
  remove runtime claim
  rebuild durable view

result:
  durable status = awaiting-approval
  effective status = awaiting-approval
  attemptCount increments
```

### 9.3 Verify Fail Park

```txt
input:
  active claim exists
  verification failed

steps:
  validate claim
  append durable attempt result=verify-failed
  append durable workflow move to blocked or awaiting-human according to existing policy
  remove runtime claim

result:
  item is no longer active doing
  durable status records the stable parked state
  attempt history records the failed execution
```

### 9.4 Intentional Release

```txt
input:
  active claim exists
  owner chooses to stop without parking/finalizing

steps:
  validate claim
  append durable attempt result=released from=preClaimStatus to=preClaimStatus
  remove runtime claim

result:
  durable status remains todo or the original claimable state
  effective status becomes todo
  attemptCount increments
  hasStarted becomes true
```

This is how a released item differs from a never-started item.

### 9.5 Stale Reclaim

```txt
input:
  active claim exists
  owner appears inactive

steps:
  compute real liveness using worktree/git activity
  use role-specific thresholds
  if reclaim eligible, append durable attempt result=reclaimed
  remove runtime claim

result:
  durable status remains claimable unless policy parks it
  effective status becomes todo or parked
  attempt history records reclaim
```

The primary reclaim decision must use real liveness from worktree activity. A hard expiry is only a backstop for broken clocks, missing worktrees, or pathological stale records.

### 9.6 Planning To Executing

Current claim-lock behavior releases durable `doing` when an item moves from planning to executing so the driving loop can re-claim it.

In the new model:

- there is no durable `doing` to release;
- the runtime claim may remain active across clarify, planning, and executing if the same owner/session is still valid;
- `releaseClaimOnExecuting` should be retired or made an internal no-op as part of the hard cut;
- an actual pause/release must be represented as an intentional release flow, not as a hidden durable status bounce.

## 10. File Ownership And Git Policy

### 10.1 Committed Durable Files

Commit durable event logs and configuration that represent project truth.

Expected committed `.fgos` classes:

- `.fgos/events.jsonl` baseline if still retained;
- `.fgos/events/*.jsonl` durable event shards;
- `.fgos/config.json`;
- `.fgos/coexistence.json`;
- `.fgos/gate-bypass.json`.

Durable event writes should happen at meaningful workflow settlement points, not at every live claim heartbeat.

### 10.2 Ignored Derived Or Runtime Files

Ignore files that are derived, diagnostic, or live coordination.

Expected ignored `.fgos` classes:

- `.fgos/cache/state.json`;
- `.fgos/runtime/**`;
- `.fgos/logs/**`;
- `.fgos/sessions.json`;
- `.fgos/*.lock`;
- active claim files or claim indexes;
- diagnostic logs such as approval faults, guard warnings, changelog nag history, entropy history, invocation faults.

These files may help local operation and debugging, but they must not be merge surfaces on `main`.

## 11. CAS And Concurrency Rules

### 11.1 Claim Acquire

Claim acquire must be atomic over the runtime coordination store.

Acquire succeeds only if:

- the durable item exists;
- the effective item status is claimable;
- no active claim exists for the same item;
- dependencies/frontier rules allow the item for the requested flow;
- the runtime claim write wins the per-item coordination lock.

Acquire captures the durable base:

- `preClaimStatus`;
- `preClaimRevision`;
- branch/head metadata needed by merge/return policy.

### 11.2 Settle

Settle succeeds only if:

- the runtime claim exists;
- `claimId` matches;
- actor/owner is authorized;
- durable item revision still matches `preClaimRevision`, or an explicit reconcile path accepts the change;
- requested final status is valid from `preClaimStatus` according to the durable FSM;
- branch/worktree safety checks pass.

Settle must not require durable current status `doing`.

### 11.3 Reclaim

Reclaim must not be driven by a fixed TTL alone.

Primary reclaim basis:

- current worktree existence;
- git status activity;
- observed file/index changes;
- `lastActivityAt`;
- role-specific thresholds such as shorter agent threshold and longer human threshold.

`hardExpiresAt` may force review or reclaim only as a safety backstop.

## 12. Scheduling And Query Rules

### 12.1 Frontier

Frontier must operate on effective status.

If an item is durable `todo` but has an active claim, frontier must treat it as `doing`, open, and unavailable for another claim.

Dependency resolution should still use durable finality:

- final/delivered statuses satisfy dependencies;
- parked statuses do not satisfy dependencies unless existing policy explicitly says otherwise;
- effective `doing` is open and unresolved;
- claimable `todo` is open and available only when no active claim exists.

### 12.2 Worker Slots

Worker-slot calculation must count active runtime claims, not durable `doing` events.

Slots should reflect:

- currently active claims;
- reclaim eligibility;
- role/agent ownership;
- phase/stage where applicable.

### 12.3 List And Query

All user-facing status filters must be explicit about view choice:

- default status queries should use effective status;
- durable-only queries should be named as such for debugging/audit;
- `list --status doing` must return items with active runtime claims;
- `list --status todo` must not include active-claimed items unless the command explicitly asks for durable-only status.

## 13. Anti-Loop Rules

Anti-loop must count durable attempt history, not active runtime claim files.

Old behavior:

```txt
count work.move events where to == "doing" and stage == Execute
```

New behavior:

```txt
count work.attempt events where phase == "execute"
```

The counter must not count clarify/planning/decompose claims unless those represent true execution attempts by product policy.

Human reset events should continue to reset the counted window if that is current policy.

## 14. Migration Strategy

This is a hard-cut migration. Downtime is acceptable.

Recommended steps:

1. Stop runners and user claim flows.
2. Ensure durable event logs are committed or otherwise safely backed up.
3. Introduce runtime coordination storage and ignore rules.
4. Introduce attempt events and replay projection.
5. Introduce effective view.
6. Change claim acquire to runtime-only.
7. Change settle/release/reject/verify-fail to validate runtime claim plus durable pre-claim revision.
8. Change frontier, list, query, worker-slot, stale reclaim, and dashboards to effective view.
9. Change anti-loop to attempt history.
10. Retire `releaseClaimOnExecuting`.
11. Run migration over existing durable `doing` events:
    - convert active durable `doing` items either into runtime claims if there is a live valid owner, or into durable attempt records with `released`, `reclaimed`, or `abandoned`;
    - leave no item stranded in durable current status `doing`;
    - recompute `attemptCount`, `lastAttempt`, and item revisions.
12. Run full verification before allowing new claims.

After migration, durable current `doing` should not remain as a normal live state.

## 15. Acceptance Criteria

The redesign is acceptable only if all conditions hold:

1. Claim acquire does not append `work.move -> doing`.
2. `list --status doing` still returns actively claimed items.
3. `list --status todo` excludes actively claimed items in the default effective view.
4. A released item is distinguishable from a never-started item.
5. Return/reject/verify-fail do not use `expectedStatus: "doing"` as their CAS base.
6. Double-claim attempts for the same item cannot both succeed.
7. Stale reclaim uses real liveness as the primary signal.
8. Anti-loop counts durable execution attempts.
9. Frontier cannot pick an active-claimed durable-`todo` item.
10. Runtime coordination files and diagnostic logs are ignored by git.
11. Durable event logs still capture meaningful attempt and workflow outcomes.
12. No normal flow leaves an item durable-current `doing` after the hard cut.

## 16. Required Tests

### 16.1 Claim Acquire

- Claiming a `todo` item creates an active runtime claim.
- Claiming does not append durable `doing`.
- A second claim for the same item fails while the first active claim exists.
- If worktree/branch preparation fails, the runtime claim is cleaned up or marked failed without durable `doing` residue.

### 16.2 Effective View

- Durable `todo` plus active claim renders as effective `doing`.
- Durable `todo` without active claim renders as effective `todo`.
- Released item renders as effective `todo` with `attemptCount > 0`.
- Durable-only debug view can still show raw durable status.

### 16.3 Settle

- Successful return validates `claimId`, owner, `preClaimStatus`, and `preClaimRevision`.
- Successful return writes attempt history and final workflow move.
- Settlement with missing/wrong claim fails.
- Settlement after durable revision drift fails or goes through explicit reconcile.
- Verify-fail parks according to policy and records attempt history.

### 16.4 Reclaim

- Active worktree activity prevents reclaim before role-specific liveness threshold.
- Inactive claim becomes reclaim-eligible after real inactivity.
- `hardExpiresAt` works only as a backstop.
- Reclaim writes durable attempt history and removes runtime active ownership.

### 16.5 Frontier And Worker Slots

- Active-claimed durable `todo` item is not returned by frontier.
- Open descendant calculation treats effective `doing` as open.
- Worker slots count active runtime claims.
- Reclaimed/released items become eligible again according to dependencies and policy.

### 16.6 Anti-Loop

- Execute attempt events increment visit count.
- Clarify/planning claims do not increment execute visit count unless explicitly modeled as execute attempts.
- Human reset events still reset the relevant anti-loop window.

### 16.7 Migration

- Existing durable current `doing` items are converted or parked.
- Existing event history produces correct `attemptCount`.
- No migrated item loses final workflow status.
- No runtime/derived/diagnostic file becomes tracked.

## 17. Review Checklist

Before merge, reviewers should search for:

```txt
to: "doing"
to:'doing'
expectedStatus: "doing"
expectedStatus:'doing'
status === "doing"
statusCategory === "doing"
releaseClaimOnExecuting
```

Each remaining occurrence must be classified as one of:

- effective status presentation;
- durable attempt history;
- migration code;
- test fixture for old-to-new migration;
- bug.

No unclassified occurrence should merge.

Reviewers should also verify every reader that schedules or displays current work reads the effective view, not the durable-only view.

## 18. Anti-Patterns

Do not implement:

- `started` as a current workflow status;
- durable `todo -> doing` at claim acquire;
- durable `doing -> todo` at release;
- settle CAS based on durable `doing`;
- anti-loop based on runtime claim files;
- frontier over durable-only state;
- fixed TTL as the primary reclaim mechanism;
- a second independent claim path outside the claim port;
- tracking runtime claim files in git;
- using `state.json` as coordination truth.

## 19. Open Design Choices

These choices must be made during implementation, but they must not violate the invariants above.

1. Runtime claim file shape:
   - one file per item;
   - one index file with atomic replace;
   - or sharded files by writer/session.

2. Per-item revision identity:
   - monotonically derived item version from replay;
   - last durable event hash touching the item;
   - or a stable fold hash.

3. Attempt event naming:
   - `work.attempt`;
   - `work.run`;
   - or another name if replay and tests make the semantics explicit.

4. Whether open attempts are projected from runtime claims:
   - acceptable as effective-view metadata;
   - not acceptable as durable completed attempt history until settlement/release/reclaim.

## 20. Summary

The redesign does not remove `doing`. It removes claim-time durable `doing`.

Durable state carries workflow truth and attempt history. Runtime coordination carries active ownership. Effective view composes both so users and schedulers can still query `doing`.

This is the only model that preserves all required meanings:

- "not started yet";
- "started before but claimable again";
- "actively being worked";
- "submitted/blocked/final";
- "safe to settle without racing main-checkout claim churn".
