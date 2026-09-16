# I05 - dispatch.runtime.reconcile

**Capability:** `code:implement`, `code:test`, `docs:update`
**Status:** planned

## Goal

Expose `dispatch.runtime.reconcile` as a narrow CAS-guarded guard/projection
repair operation. It must not become semantic recovery.

## File Lease

Primary lease:

- `src/runner/dispatch/run-lock.mjs`
- `src/runner/dispatch/claim-liveness.mjs`
- `src/runner/dispatch/recovery-planner.mjs`
- `src/verbs/dispatch/recover.mjs`
- `src/cli/command-registry.mjs`
- `test/runner/dispatch-recovery.test.mjs`

Expected new files:

- `src/runner/dispatch/reconciliation-planner.mjs`
- `src/verbs/dispatch/reconcile.mjs`
- `test/runner/dispatch-reconciliation.test.mjs`
- `test/cli/dispatch-reconcile.test.mjs`

Docs:

- `docs/specs/runner.md`
- `CHANGELOG.md`

## Work

1. Implement a two-step reconcile protocol:
   - plan/read returns action key, snapshot digest, control epoch/resource
     incarnation where applicable, expiry, and proposed action;
   - apply re-reads under a short local lock, compares CAS values, then
     returns `applied`, `already-applied`, `plan-stale`, `blocked`,
     `needs-input`, or `refused`.
2. Support only:
   - collect/link already-written normalized result through owning authority;
   - clear cwd lock with dead/absent holder proof;
   - clear assignment claim with no unsettled admitted run or pending launch;
   - repair stale projection marker when immutable RunResult proves settlement.
3. Gate each action by adapter/profile proof. Unsupported proof means
   `unsupported` or `refused`, never best effort.
4. Maintain idempotency by action key.
5. Keep existing `dispatch recover` and `coordination recover` semantic
   recovery doors separate and unchanged in authority.

## Acceptance

- Dead-holder cleanup cannot delete a successor's guard.
- TTL expiry alone cannot clear anything.
- Live, ambiguous, corrupt, or unparseable holder state refuses or needs input.
- Concurrent applies have one winner.
- A result or control epoch change between plan and apply returns `plan-stale`.
- Replaying the same action key returns the recorded prior outcome.
- Reconcile never imports or calls process kill/signal, retry/relaunch,
  assignment admission, resume/reattach, reassignment, cancellation, or
  workspace takeover.

## Required Tests

- `node --test test/runner/dispatch-reconciliation.test.mjs`
- `node --test test/cli/dispatch-reconcile.test.mjs`
- `node --test test/runner/dispatch-recovery.test.mjs`

Add production-route refusal tests for forbidden action requests through both
CLI projection and operation-catalog path.
