# Seat Binding lease and receipt, one walker: phase lead report

Branch `seat-p07`, on top of the ranking cutover. Nothing pushed, merged or activated.

## 1. Behaviour changes

- **The lease takes the account the bind names.** `bind()` builds an `accountView` per pool (declared accounts, the CLIs each holds a login for, and, read without the lock, the lease state: the account this assignment already holds, until when an account is quarantined, a dead login a real call may lift offered only when no account of the pool is healthy) and the crate names `leaseAccount`. `acquireNamedAccountLease` re-checks under the existing lock that the named account exists, is enabled, holds a store for the launch's CLI and is not quarantined, writes the lease and returns a `leaseReceipt`; otherwise it refuses `provider-capacity.lease-conflict`. Ranking is gone from the lease.
- **Lease conflict is a rebind, not a walk step.** `run.mjs` marks the attempt `leaseConflict`, binds again in the per-unit queue from a fresh view with `failedAccounts` (same policy; the pool is skipped when nothing is left in it), and carries on. A conflicting attempt is not a launch (`seatLaunchesUsed`) and not a step of the walk (`triedBindingsOf`). A pinned account refuses the seat instead. Independence is symmetric through the seat ledger (`noteDependence`, `dependentExecutors`): a seat that binds again is held to the seats bound earlier that must differ from it, so a rebind that changes family cannot violate their rule.
- **One walker.** `attemptProviderCapacityFallback`, `resolveFallback` (and its status vocabulary), the fallback adoption/rehydration in `executeAssignment`, `fallbackEvidence` in settlement and the supervisor settle step, and the `effectiveCwd` that only a substituted fallback could change are deleted. A refused lease settles as `provider-capacity-refused`; the runner's walk answers it. A launch that names no account (no binding) is refused `provider-capacity.no-named-account`; `dispatch probe-account` names the account it probes.
- **Replay at the write gate** recomputes against the committed config (the caller's live config, else the project's on disk), refuses `binding-replay-config-mismatch` when its seat digest differs from the one the bind recorded, refuses `binding-replay-snapshot-missing` when the attempt carries no `bindingInput`, never reads the config copy in `unit.json`, and runs stage 2 without lease state, so a later quarantine does not fail it. `unit.json` attempts carry `bindingInput` (allowlisted: ask, peers, walk, config and account-view digests, host version) and `leaseReceipt`.
- **No account inventory in a record.** `snapshotRunnerConfig` drops `llmAccounts` and `providers`; `run.mjs` reads them live (`accountInventoryConfigOf`) for the account view, the lease and pin checks. Callers that bound from the snapshot (`case-start`, workflow preflight, `operation-choice`) read the live config.
- **No exec under a state lock.** `withProviderStateLock` notes the lock through a new leaf `src/util/state-lock-held.mjs` (the counter moved out of `session-identity.mjs`, which spawns; its three consumers moved with it). Seat Binding adds no exec under the provider lock; the existing `reclaimDeadLeases` liveness probe still runs `adopt --probe-only` through `spawnSync` inside the lock (it checks neither the identity facade nor the seat-binding client, so the new note does not refuse it); the report records it, no test asserts it.
- Doctor row `mutating-assignment-binding-snapshot` is retired (code, registration, its tests and its three documentation mentions); the replay that protects writes is the gate's.

## 2. Deleted

`provider-capacity.mjs`: `rankProviderAccounts`, `acquireProviderAccountLease`, `inventoryServingCli`. `assignment-runner.mjs`: `attemptProviderCapacityFallback`, the resume rehydration of a fallback, `fallbackSubstituted`/`declaredPrimaryExecutorId`/`fallbackEvidence`, `effectiveCwd`, the live-config fallback of the gate. `recovery.mjs`: `resolveFallback`, `FALLBACK_STATUSES` (and `assess` no longer accepts a `resolveFallback` result). `registrations.mjs`: `checkMutatingAssignmentBindingSnapshot` and its registration. `session-identity.mjs`: the lock counter. Test file `dispatch-recovery.test.mjs`.

New: `acquireNamedAccountLease`, `readAccountStates`, `accountInventoryConfigOf`, `LEASE_CONFLICT_REASON` (provider-capacity); `failedAccountsOf` (account-rotation); `noteDependence`/`dependentExecutors` (seat ledger); `src/util/state-lock-held.mjs`; test helper `test/helpers/failover-fixture.mjs` (the failover harness, moved out of its test file so the exec-budget proof shares it).

## 3. Tests retired or moved (new owning proof)

- Account ranking tests in `provider-capacity.test` (declared order, quarantined or disabled skipped, sticky): the ranking is the crate's; owned by the crate golden vectors (sticky, quarantine, probe) and `bind.test` (disabled, CLI store, state: quarantine, sticky, offered dead login, probe failed, lease-conflict rebind).
- `rankProviderAccounts` quarantine-expiry tests: rewritten onto `acquireNamedAccountLease` and `readAccountStates` (same cases).
- Phase B fallback tests in `assignment-dispatch.test` (declared fallback dispatched, bounded to one attempt, governance-refused candidates, confinement of a fallback, resume rehydration), `dispatch-recovery.test` (`resolveFallback`), the `resolveFallback` case of `dispatch-effect-guarantee.test`: the second walker is removed. Provider failure walking is owned by `run-provider-failover.test` and `tier-fallback.test`.
- "N1 / M13" effective-cwd test: no path makes the effective cwd differ from cwd any more (only the fallback substitution did); git evidence in the launch cwd stays owned by the read-only checkout test above it.
- Doctor `mutating-assignment-binding-snapshot` tests (three): the gate replay tests in `run.test` own the behaviour.
- Mutating-gate tests in `run.test` now commit their two-candidate config and record `bindingInput`; two assertions changed from "binding mismatch" to the named replay refusals.
- Renewal tests in `assignment-dispatch.test`: reach the second provider by naming its executor and account instead of the walker; same assertions.
- New proofs: lease conflict rebind with no walk step and no launch, two checkers conflicting at once rebinding serially with pairwise independence kept, receipt on a taken lease, no receipt on a refused one, gate config mismatch and missing input, a config copy in `bindingInput` ignored, replay after a quarantine, snapshot without inventory, exec budget (one exec per seat, per walk step and per conflict, none while a state lock is held, counted by a spy on `spawnSync`), the provider lock refusing the client.

## 4. Delta lines

| Against | Node src | Rust | Tests |
|---|---|---|---|
| ranking commit (this phase) | -347 net (+432 / -779) | 0 | -396 net (+644 / -1040) |
| base of the track (`b858a9c5b`), both phases | -594 net (+892 / -1486) | +140 | -529 net (+902 / -1431) |

Net Node src and net test lines both shrink across 07 and 08, so the growth checkpoint holds.

## 5. Verification

- Every test file under `test/runner`, `setup`, `workflow`, `cli`, `seat-binding`, `util`, `convention`, `e2e`, `direct`, `intake`, `parity`, `run-supervisor`, `state`, `verbs`, `holder-lock`, `session-identity`, `config`, `scripts` and `architecture` was run alone: 509 files, each run alone, all pass after the fixes below except the four named next; the files the fixes touched were run again and pass.
- Fixes the wide run found: the hot-lock exec-site and multiprocess tests read the lock counter from its old module (they now take it from `state-lock-held.mjs`); the terminal test harness named an invocation in `prefer`, which is a hard pin and never swapped for herdr, so its capability now names the bare executor (the pane transport is left to the bind).
- Red on the ranking commit too, unrelated: `registrations.test` "Data Dictionary #7" (`runner-coordination-orgPolicy-shape`), `active-release-drift-check.test` (needs a release workspace build), `confined-nested-write.test` (the nested `fgos` in the worker has no git addon in this environment), and `holder-lock/fences-rust-locks.test` (needs a release `fgctl` build; passes only after `cargo build --release`).
- No `cargo` change this phase. Full `npm test` not run. GitNexus not used (stale index).

## 6. Concerns

- A lease conflict is recognised by its reason text in the settled RunResult's failure message (the code stays `provider-capacity-refused`, so history and summaries read it unchanged).
- The lease receipt is persisted and written next to the selection, but it is not audited against the provider-capacity record at the gate: the gate runs before the attempt's own lease exists, so there is nothing to compare at that point.
- `explain` and the doctor rows rank from the config-only account view; they show no current health, so nothing is labelled provisional.
- Operation `policy.fallbackExecutors` (domain workflow operations) still validates and still builds `executorPreference`, but nothing executes a fallback any more; the key is dead and should be removed with its validation in a follow-up item.
- A resumed seat whose recorded binding names an account that went bad since costs one extra bind (a conflict attempt that started nothing).
- CHANGELOG and spec status lines wait for the docs phase.
