# Phase 08: lease/receipt protocol, no exec under the lock, replay, one walker

Owner: Sonnet lead in a worktree from the track. Size L→XL (2d; grew with [RT-5], [RT-9], [RT-14], [RT-16h]). After 07.

## Context

- Spec `docs/specs/seat-binding.md` §4.1 [G6, R1] [RT-16b].
- Today: `acquireProviderAccountLease` `provider-capacity.mjs:605`, ranking inside `withProviderStateLock` :623-636 (wrapper :423, no `noteLockHeld`); `rankProviderAccounts` :595; per-CLI filter `inventoryServingCli`; account pin `account-pin.mjs`; walk `run.mjs:1160-1190`; second walker `attemptProviderCapacityFallback` `assignment-runner.mjs:1026` (:1711) via `recovery.mjs:93` `resolveFallback`; `executeAssignment` `assignment-runner.mjs:1270` called from `run.mjs:856` and `dispatch/cli.mjs:1037`; parallel launch `assignment-runner.mjs:1622-1645`, `reviewed.mjs:354`, `panel.mjs:77` (`Promise.allSettled`) [RT-14]; write-gate recompute `assignment-runner.mjs:466-500` [RT-5]; doctor replay `mutating-assignment-binding-snapshot` `registrations.mjs:627-680` (registered :1455) [RT-5]; gate rule `account-rotation.mjs:67-71` [RT-9].

## Requirements

- **accountView outside the lock**: the client side reads provider state without the lock (accounts, leases, quarantine, sticky, lazy probe) and [RT-16h] each account's login-store **CLI names** (never homes); the crate names the account.
- **Acquire exactly the named account**: `acquireNamedAccountLease({provider, accountId, cli, …})` under the existing lock re-checks usability **including the per-CLI login-store filter** [RT-16h], writes the lease, returns `leaseReceipt {provider, accountId, runId, acquiredAt, accountViewDigest}`; otherwise `lease-conflict`. `rankProviderAccounts` and the ranking half of `acquireProviderAccountLease` are deleted; every leasing caller moves (phase 00 list).
- **Seat Binding adds no exec under the lock** [P00-C5, D-d]: `withProviderStateLock` calls `noteLockHeld`/`noteLockReleased`, so the seat-binding client refuses inside it, and `acquireNamedAccountLease` does no ranking there. Pre-existing and outside this wave: the lock itself is a host route bracketing the section (`holder-lock/index.mjs:245-254`, `driver.mjs:136`), and `reclaimDeadLeases` (`provider-capacity.mjs:575-586`) runs `adoptRun(…, {probeOnly: true})`, a host exec, per dead-pid lease with an `envelope.json` (`assignment-runner.mjs:629-637,1294-1300`). This wave does not move it; the report records it. Because `noteLockHeld` now brackets that section, the lead confirms the probe path does not go through a refusing facade (it calls the run-supervisor route directly); if it does, the probe keeps its current behaviour by calling outside the counter, and the report says how.
- [RT-14] **Rebind inside parallel launch**: a `lease-conflict` rebind goes through the per-unit serialized queue from 02 (ledger-read → bind → publish); when a rebind changes family, hard rules are re-checked for already-bound seats that depend on it (judge vs sides, checkers vs producer, pairwise at high/critical); a newly violated hard rule refuses the rebinding seat by name. Rebinds count toward the exec budget, not walk steps or launch ceilings.
- **Persisted per attempt** in `unit.json`: `bindingInput` and `leaseReceipt`. [RT-9] `bindingInput` is an **allowlisted, non-secret** subset (seat, role, posture, effective rigor, peers at decision time, walk state, semantic config digest, tier source and ceiling, accountView digest, persona qualified id + digest, host version [RT-10]); no `env`, no credential homes, no config copy. [P00-C10, D-e] It is **not built on `configSnapshot`**: it carries its own semantic config digest (the hash of 06), computed from the committed config, not a reference into `configSnapshot`.
- [P00-C10, D-e] **Narrow `configSnapshot`**: today `unit.json.configSnapshot.runner` stores the whole merged runner config (26.6 KB), including `llmAccounts` and `providers` with credential-store paths (`run.mjs:161-172`). New snapshots (post-fence) stop persisting `llmAccounts` and `providers`; replay does not need them (stage 1 reads policy keys only; stage 2 replays from the allowlisted `accountView` digest and the receipt, checked against the provider-capacity record). Old records are left as they are. The write gate's fallback to the **live** config when a snapshot is absent (`assignment-runner.mjs:473`) is removed: a post-fence record without its snapshot is refused `binding-replay-snapshot-missing`; pre-fence records are refused earlier by `record-predates-seat-binding`.
- **Replay** [RT-5, RT-9]: the write gate at `assignment-runner.mjs:466-500` recomputes stage 1 against the **committed config whose digest equals the run's config digest**, refuses `binding-replay-config-mismatch` on a mismatch, never trusts a persisted config copy, and runs stage 2 from the persisted allowlisted inputs. The lease receipt is checked against the provider-capacity record (audit), not against `unit.json`. Today's rule at `account-rotation.mjs:67-71` is kept. `explain`/doctor current-health answers are labelled provisional.
- [RT-5, P00-C1, D-c] **Retire doctor `mutating-assignment-binding-snapshot`** (`registrations.mjs:627-691`, registered :1455) and its test. Phase 00 showed it replays nothing today: its guard `resultData.binding && resultData.role` never matches, since RunResult never writes `binding` (0 of 2,278 forgentX results; 0 in mdview and mcp-skill-hub). The replay that protects writes is the write gate's (above); the row contributes no execs to the budget.
- **One walker**: delete `attemptProviderCapacityFallback` and `recovery.mjs` `resolveFallback`. `executeAssignment` receives the binding and never recomputes tier/model/executor; provider failure returns to the runner's walk. `dispatch probe-account` keeps its pinned path (06).
- Preserved: hard pins, RUL92, quarantine and lazy probe, launch ceilings, run-wide pin skipping seats it cannot apply to.

## Files

- Modify: `src/runner/execution/run.mjs` (`snapshotRunnerConfig` narrowing [P00-C10]), `src/runner/dispatch/provider-capacity.mjs`, `src/runner/execution/{account-pin,account-rotation,run,unit-state,explain,bind}.mjs`, `src/runner/execution/patterns/{panel,reviewed}.mjs` (queue use), `src/runner/dispatch/{assignment-runner,recovery,cli}.mjs`, `src/setup/registrations.mjs` (replay row), `src/verbs/dispatch/{inspect,reconcile}.mjs` if they read ranking.
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
- Host exec count = `1 + walkSteps + leaseConflicts` per seat per round; **zero seat-binding route execs** while the provider lock is held (the counting shim distinguishes the pre-existing `reclaimDeadLeases` probe, recorded, not asserted) [P00-C5, D-d].
- A new `configSnapshot` carries no `llmAccounts`/`providers`; gate replay of a post-fence record succeeds without them; a missing snapshot refuses instead of falling back to live config [P00-C10, D-e].
- RUL92 partial-writes test green.

## Risks / rollback

- M×H two releases lease one account with different rules → stop-everything landing + drain. M×M legacy `executeAssignment` callers → phase 00 list. Rollback: revert on the track.
