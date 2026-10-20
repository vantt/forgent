# Phase 08: lease/receipt protocol, no exec under the lock, one walker

Owner: Sonnet lead in a worktree from the track. Size L (1.5d). After 07.

## Context

- Spec §3.3 [G6, R1]: decision, acquisition and replay are one authority; `bindingInput` + `leaseReceipt` per attempt; `lease-conflict` → rebind; replay reads the snapshot.
- Today: `acquireProviderAccountLease` `src/runner/dispatch/provider-capacity.mjs:605`, ranking + `ranked[0]` inside `withProviderStateLock` :623-636 (lock wrapper :423, does not note the lock for Session Identity); `rankProviderAccounts` :595; account pin `src/runner/execution/account-pin.mjs`; walk in `run.mjs:1160-1190` (`retrySameCandidate`, `nextCandidate`); second walker `attemptProviderCapacityFallback` `src/runner/dispatch/assignment-runner.mjs:1026` (call :1711) using `dispatch/recovery.mjs:93` `resolveFallback`; `executeAssignment` `assignment-runner.mjs:1270` called from `run.mjs:856` and `dispatch/cli.mjs:1037`.

## Requirements

- **accountView outside the lock**: the facade reads provider state (accounts, leases, quarantine, sticky assignment, lazy-probe status) without the lock, passes it to the crate; the crate names the account.
- **Acquire exactly the named account**: new `acquireNamedAccountLease({provider, accountId, …})` under the existing lock: re-check that account is still usable, write the lease, return `leaseReceipt {provider, accountId, runId, acquiredAt, accountViewDigest}`; otherwise `lease-conflict` (no ranking inside the lock). `rankProviderAccounts` and the ranking half of `acquireProviderAccountLease` are deleted (L10); every caller moves (phase 00 list of 22 importers, the ones that lease).
- **No exec under the lock**: `withProviderStateLock` calls `noteLockHeld`/`noteLockReleased` (`src/util/session-identity.mjs:50,56`), so the 04 client refuses `seat-binding-in-lock` and identity minting refuses too. Phase 00 confirmed whether any current path execs under this lock; each such path moves its exec before the lock.
- **lease-conflict** → runner rebinds with a fresh `accountView` under the same cached policy (counts toward the exec budget, not toward walk steps or launch ceilings).
- **Persisted per attempt** in `unit.json`: versioned `bindingInput` (seat, role, posture, effective rigor, `independentOf`/`preferIndependentOf` peers at decision time, walk state, config digest, tier source and ceiling, accountView digest, persona qualified id + digest) and `leaseReceipt`.
- **Replay**: write gate (`commit-unit-work.mjs`) and doctor recompute through the crate from the persisted `bindingInput` and verify the receipt; they never read today's quarantine clock. `explain`/doctor current-health answers are labelled provisional.
- **One walker**: delete `attemptProviderCapacityFallback` and `recovery.mjs` `resolveFallback` (no other caller, phase 00). `executeAssignment` receives the binding from Seat Binding and never recomputes tier/model/executor (`resolveAssignmentDispatchPolicy` call sites inside it go). Provider failure inside `executeAssignment` returns to the runner's walk.
- Preserved: hard pins, RUL92 (no retry over a writing seat's partial writes), quarantine and lazy probe, launch ceilings, run-wide pin skipping seats it cannot apply to.

## Files

- Modify: `src/runner/dispatch/provider-capacity.mjs`, `src/runner/execution/{account-pin,account-rotation,run,commit-unit-work,unit-state,explain}.mjs`, `src/runner/execution/bind.mjs` (accountView), `src/runner/dispatch/{assignment-runner,recovery,cli}.mjs`, `src/util/session-identity.mjs` (no API change; called from the lock wrapper), `src/verbs/dispatch/{inspect,reconcile}.mjs` if they read ranking.
- Tests: `test/runner/provider-pool-lease.test.mjs`, `test/runner/credential-store.test.mjs`, `test/runner/execution/{run-provider-failover,account-rotation,account-pin,commit-unit-work}.test.mjs`, new `test/seat-binding/exec-budget.test.mjs`.

## Steps

1. Lock noting + find/move any exec under the lock.
2. Named-account acquire + receipt; delete in-lock ranking.
3. `bindingInput`/`leaseReceipt` persistence; replay in gate and doctor.
4. Rebind on `lease-conflict`.
5. Delete the second walker; `executeAssignment` consumes the binding.
6. Exec budget test: a counting host shim (`FGOS_HOST_BIN` pointing at a wrapper that logs each call and whether the lock file is held) on a three-seat panel with one walk step.

## Tests (proofs owned)

- Lease race rebinds under the same policy (two processes race for the last account; loser gets `lease-conflict`, rebinds to the next account with identical tier/prefer).
- Gate replay survives a later quarantine (quarantine the account after the attempt; gate still verifies).
- Host exec count = `1 + walkSteps + leaseConflicts` per seat per round; zero execs while the provider lock is held.
- RUL92 partial-writes test unchanged and green.

## Risks / rollback

- M×H: two releases during landing lease the same account with different rules. Covered by stop-everything landing (12) and drain (09).
- M×M: `executeAssignment` legacy callers (`dispatch/cli.mjs:1037`) relied on its own policy. Phase 00 lists them; each receives a Seat Binding answer.
- Rollback: revert the merge on the track.
