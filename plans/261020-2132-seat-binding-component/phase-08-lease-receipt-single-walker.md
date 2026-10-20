# Phase 08: lease/receipt protocol, no exec under the lock, replay, one walker

Owner: Sonnet lead in a worktree from the track. Size L→XL (2d; grew with [RT-5], [RT-9], [RT-14], [RT-16h]). After 07.

## Context

- Spec `docs/specs/seat-binding.md` §4.1 [G6, R1] [RT-16b].
- Today: `acquireProviderAccountLease` `provider-capacity.mjs:605`, ranking inside `withProviderStateLock` :623-636 (wrapper :423, no `noteLockHeld`); `rankProviderAccounts` :595; per-CLI filter `inventoryServingCli`; account pin `account-pin.mjs`; walk `run.mjs:1160-1190`; second walker `attemptProviderCapacityFallback` `assignment-runner.mjs:1026` (:1711) via `recovery.mjs:93` `resolveFallback`; `executeAssignment` `assignment-runner.mjs:1270` called from `run.mjs:856` and `dispatch/cli.mjs:1037`; parallel launch `assignment-runner.mjs:1622-1645`, `reviewed.mjs:354`, `panel.mjs:77` (`Promise.allSettled`) [RT-14]; write-gate recompute `assignment-runner.mjs:466-500` [RT-5]; doctor replay `mutating-assignment-binding-snapshot` `registrations.mjs:627-680` (registered :1455) [RT-5]; gate rule `account-rotation.mjs:67-71` [RT-9].

## Requirements

- **accountView outside the lock**: the client side reads provider state without the lock (accounts, leases, quarantine, sticky, lazy probe) and [RT-16h] each account's login-store **CLI names** (never homes); the crate names the account.
- **Acquire exactly the named account**: `acquireNamedAccountLease({provider, accountId, cli, …})` under the existing lock re-checks usability **including the per-CLI login-store filter** [RT-16h], writes the lease, returns `leaseReceipt {provider, accountId, runId, acquiredAt, accountViewDigest}`; otherwise `lease-conflict`. `rankProviderAccounts` and the ranking half of `acquireProviderAccountLease` are deleted; every leasing caller moves (phase 00 list).
- **No exec under the lock**: `withProviderStateLock` calls `noteLockHeld`/`noteLockReleased`; any path phase 00 found exec'ing under it moves its exec before the lock.
- [RT-14] **Rebind inside parallel launch**: a `lease-conflict` rebind goes through the per-unit serialized queue from 02 (ledger-read → bind → publish); when a rebind changes family, hard rules are re-checked for already-bound seats that depend on it (judge vs sides, checkers vs producer, pairwise at high/critical); a newly violated hard rule refuses the rebinding seat by name. Rebinds count toward the exec budget, not walk steps or launch ceilings.
- **Persisted per attempt** in `unit.json`: `bindingInput` and `leaseReceipt`. [RT-9] `bindingInput` is an **allowlisted, non-secret** subset (seat, role, posture, effective rigor, peers at decision time, walk state, config digest, tier source and ceiling, accountView digest, persona qualified id + digest, host version [RT-10]); no `env`, no credential homes, no config copy. It **extends** `configSnapshot` by reference (carries its digest); `configSnapshot` stays the run-level record.
- **Replay** [RT-5, RT-9]: the write gate at `assignment-runner.mjs:466-500` recomputes stage 1 against the **committed config whose digest equals the run's config digest**, refuses `binding-replay-config-mismatch` on a mismatch, never trusts a persisted config copy, and runs stage 2 from the persisted allowlisted inputs. The lease receipt is checked against the provider-capacity record (audit), not against `unit.json`. Today's rule at `account-rotation.mjs:67-71` is kept. `explain`/doctor current-health answers are labelled provisional.
- [RT-5] Doctor `mutating-assignment-binding-snapshot`: replays **post-fence** records only (with `seatSchema`), skips pre-fence ones with a count; the report states the exec count on forgentX's 2,275 historical results (pre-fence: zero execs). If the post-fence replay cost is too high for doctor, the row is retired in favour of the gate replay (lead decides with numbers; one path).
- **One walker**: delete `attemptProviderCapacityFallback` and `recovery.mjs` `resolveFallback`. `executeAssignment` receives the binding and never recomputes tier/model/executor; provider failure returns to the runner's walk. `dispatch probe-account` keeps its pinned path (06).
- Preserved: hard pins, RUL92, quarantine and lazy probe, launch ceilings, run-wide pin skipping seats it cannot apply to.

## Files

- Modify: `src/runner/dispatch/provider-capacity.mjs`, `src/runner/execution/{account-pin,account-rotation,run,unit-state,explain,bind}.mjs`, `src/runner/execution/patterns/{panel,reviewed}.mjs` (queue use), `src/runner/dispatch/{assignment-runner,recovery,cli}.mjs`, `src/setup/registrations.mjs` (replay row), `src/verbs/dispatch/{inspect,reconcile}.mjs` if they read ranking.
- Tests: `test/runner/provider-pool-lease.test.mjs`, `test/runner/credential-store.test.mjs`, `test/runner/execution/{run-provider-failover,account-rotation,account-pin}.test.mjs`, gate replay test, new `test/seat-binding/exec-budget.test.mjs`.

## Steps

1. Lock noting; move any exec out of the lock.
2. Named-account acquire with CLI filter + receipt; delete in-lock ranking.
3. Allowlisted `bindingInput` + receipt; replay in the gate and the doctor row.
4. Serialized rebind with hard-rule re-check.
5. Delete the second walker; `executeAssignment` consumes the binding.
6. Exec-budget test with a counting host shim (logs each call and whether the lock is held), three-seat panel, one walk step.

## Tests (proofs owned)

- Lease race rebinds under the same policy; **two checkers hit `lease-conflict` at once** and rebind serially with hard rules re-checked [RT-14].
- Gate replay survives a later quarantine; a tampered `bindingInput` config copy is ignored; a config digest mismatch refuses [RT-9].
- An account without a login store for the chosen CLI is never leased [RT-16h].
- Host exec count = `1 + walkSteps + leaseConflicts` per seat per round; zero execs while the provider lock is held.
- RUL92 partial-writes test green.

## Risks / rollback

- M×H two releases lease one account with different rules → stop-everything landing + drain. M×M legacy `executeAssignment` callers → phase 00 list. Rollback: revert on the track.
