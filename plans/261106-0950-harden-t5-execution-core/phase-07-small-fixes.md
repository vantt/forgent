---
phase: 07
title: "Small fixes: the provider state drops an assignment once its outcome is recorded, one worker-session server per session, recover stops offering driver actions that do nothing, the stderr text judge goes where vectors cover it, the herdr deadline module folds into its one reader"
status: pending
depends_on: [02]
parallel: "wave 2, with 03, 04, 05"
effort: ~1.5d
net_size: "Node −310 / Rust 0 / tests −50 (estimate)"
---

# Phase 07 — Small fixes (B-7, B-8, B-13, H-T4d, D-T2-7)

## Context

Arbitration §3 rows B-7 (held back from batch A), B-8, B-13, Simpl. 8 = H-T4d (text judge, vector-gated), §2 received D-T2-7. Batch A's B-7 (`74392b7fe`, not on main) used a 1-hour age rule; it was dropped because the entry is also the sticky account of a re-dispatched assignment. Plan fact 1 gives the real closed signal.

Code read on `4b116c27e`:
- **B-7:** write `provider-capacity.mjs:661`; sticky read `:589-610` (`readAccountStates`, `stickyId` `:592`); audit `:688-698` (`auditLeaseReceipt`), called at `run.mjs:1393` (pass only); the attempt's outcome is persisted at `run.mjs:1424` (`persistUnitRecord()` after `attempts[attemptNo]` is filled `:1418-1423`). Ids: `run.mjs:1195,1328`; later binds use `attemptNo + 1` (`:1438,1505,1521`); resume reuses a recorded binding without a bind (`:1206-1212`). `reclaimDeadLeases` `:557`, called under the provider lock `:647`. Live file on fg-server2: 636 entries, 94 KB (correctness seat).
- **B-8:** `worker-session-boot.mjs:118-172` (`ensureWorkerSession`: `existsSync(socketPath)` `:146,158`, detached `spawnFn(herdrBin, ['--session', name, 'server'])` `:167`, wait loop `:172`); called per attempt from `herdr-round.mjs:186`; panel seats launch together in one process.
- **B-13:** `recovery-planner.mjs:54-60` (`DRIVER_FRESH_MS`), `:160-202` (`resume-driver`, `reassign-driver` recommendations), `:229-256` (re-check), `:375-377` (freshness from `visibility.json` `lastSeenAt`); `src/verbs/dispatch/recover.mjs:219-252` (unlinks `dispatch.claim`, which no `src` code writes), `:285`, `:320`; `visibility-session.mjs:65` (`DRIVER_FRESH_MS`), `:209` (`findRunningRuns`, read by `src/verbs/state/read.mjs:47`); `runtime-inspection.mjs:210-215` (a hard-coded `60000` window gives `live-proven`); `src/cli/command-registry.mjs:1445` (example uses `resume-driver`); `packages/run-supervisor/contracts/recover-actions.v1.json:12-13`. Tests naming the actions: `test/verbs/dispatch-recovery.test.mjs`, `test/run-supervisor/inspect-recover-adopt.test.mjs`, `test/run-supervisor/contracts-unit-state.test.mjs`, `test/cli/dispatch-reconcile.test.mjs`, `test/runner/dispatch-operability-production-door.test.mjs`, `test/runner/assignment-layout.test.mjs`, `test/runner/dispatch-reconcile-operation.test.mjs`.
- **H-T4d:** `provider-capacity.mjs:950-961` (`AUTH_ANCHOR_PATTERNS`), `:968-1022` (`classifyProviderCapacityFault`; text decides when `stopCause` is absent `:982-984`; openai branch reads the stderr tail `:998-1020`); one production caller `settlement.mjs:642`. Vectors: `packages/agent-protocol/contracts/fixtures/{direct,terminal}/{agy,claude,codex,omp,pi}/`.
- **D-T2-7:** `herdr-deadlines.mjs` (7 lines, `READY_TIMEOUT_MS`), one reader `src/setup/terminal-control-checks.mjs:14`, one test reader `test/setup/terminal-control-checks.test.mjs:23`.

## Requirements

- **B-7, closed signal.** Right after the controller persists an attempt's outcome (`run.mjs:1424`), it drops `state.assignments[provider:assignmentId]` for that attempt under the provider-state lock (one exported function in `provider-capacity.mjs`, next to `releaseProviderAccountLease`). No age rule. A controller that dies before that line leaves the entry (the sticky account a rebind of the same id may need). Proofs (owning file `test/runner/provider-capacity.test.mjs`): P01 row "an attempt whose outcome is recorded leaves no assignment record"; and "a resumed seat keeps its account" stays green in its current owner (lead names it, `test/runner/execution/run.test.mjs` or `account-rotation` tests). Entries written before this release are not reached (hand-off H-T5f, guide note).
- **B-8.** `ensureWorkerSession` keeps one pending boot per session name in the module (memoised promise, cleared on settle) so seats of one process share it; the cross-process case runs the existence check and spawn under the existing holder-lock door (a short scope keyed by the session name; `createLockScope` as `run.mjs` uses it), re-checking the socket inside the lock. No new lock mechanism. P01 row green with the injected `spawnFn` (`:121`).
- **B-13.** Delete the `resume-driver` and `reassign-driver` recommendations and re-checks, the `dispatch.claim` unlink, `DRIVER_FRESH_MS` in both files and the `60000` window in `runtime-inspection.mjs`. `findRunningRuns` and `live-proven` answer from the attempt lock (the supervisor holds it while the attempt lives: the same fact adopt and `run-attempts-stuck` use, read through the run-supervisor client), never from a heartbeat age; `findRunningRuns`'s signature stays so `src/verbs/state/read.mjs` (Work) is unchanged. Contract `recover-actions.v1.json` loses the two actions; `command-registry.mjs:1445` example uses an action that exists. CHANGELOG line (visible `recover` intents go). Spec line in P13.
- **H-T4d, vector-gated.** For each executor family (claude, codex, pi, omp, agy) check that the protocol vectors name `login` and `usage-limit` for its direct exits and terminal stops (the receipt then gives `stopCause` for every supervised exit). If all are covered: delete `AUTH_ANCHOR_PATTERNS`, the openai text branch and the text fallback when `stopCause` is absent; `quotaQuarantineUntil` keeps reading the text for the reset time only. If any is not covered: delete only what the covered families make dead and record the gap (family, missing vector) in the report and the backlog; do not add vectors without captured output.
- **D-T2-7.** `READY_TIMEOUT_MS` moves into `terminal-control-checks.mjs` as that check's own rule (or `src/terminal-control/config.mjs` next to `allocationGraceMs` if the lead finds a second reader); delete `herdr-deadlines.mjs`, its manifest row, and re-point the test import.

## Files

**Create:** none.

**Modify:**
- `src/runner/dispatch/provider-capacity.mjs` (`:589-700` new drop function; `:950-1022`)
- `src/runner/execution/run.mjs` (one call after `:1424`)
- `src/runner/dispatch/worker-session-boot.mjs` (`:118-172`)
- `src/runner/dispatch/recovery-planner.mjs`, `src/verbs/dispatch/recover.mjs`, `src/runner/dispatch/visibility-session.mjs`, `src/runner/dispatch/runtime-inspection.mjs`, `src/cli/command-registry.mjs`, `packages/run-supervisor/contracts/recover-actions.v1.json`
- `src/setup/terminal-control-checks.mjs`
- Tests: `test/runner/provider-capacity.test.mjs`, `test/runner/dispatch-worker-session-boot.test.mjs`, the seven B-13 test files above, `test/setup/terminal-control-checks.test.mjs`, the classifier cases in `test/runner/provider-capacity.test.mjs` / `test/runner/assignment-runresult.test.mjs`
- `docs/architecture-manifest.json`, `CHANGELOG.md`, census

**Delete:** `src/runner/dispatch/herdr-deadlines.mjs`; the two driver actions, their re-checks and `clearDispatchClaimForRecoveredDriver`; `DRIVER_FRESH_MS` ×2 and the inline `60000`; `AUTH_ANCHOR_PATTERNS` and the text branches (vector-gated).

**Tests to retire:**
- B-13: every case that recommends, re-checks or applies `resume-driver`/`reassign-driver` or asserts the claim unlink (seven files above; the lead lists titles): behaviour removed; recovery of a dead controller's attempt is owned by the adopt cases in `test/run-supervisor/inspect-recover-adopt.test.mjs` and Rust `adopt_matrix.rs`. Freshness cases of `findRunningRuns`/`live-proven` are rewritten to the lock fact (same files), not retired.
- H-T4d: classifier cases that feed openai stderr text and expect `auth-token`/`quota-limit` without `stopCause`: behaviour removed for covered families; owner: the protocol vectors (`terminal_vectors.rs`, `direct_vectors.rs`) plus the `stopCause` cases of the classifier (same test file).

## Net size

Node: B-7 +12, B-8 +12, B-13 about −290, H-T4d about −45, D-T2-7 −5 → about −310. Tests: B-7 +15, B-8 +20, B-13 about −70, H-T4d −15 → about −50.

## Steps

1. P01 rows for B-7, B-8, B-13; confirm red.
2. B-7 drop; resume-keeps-account proof green.
3. B-8 memo and lock.
4. B-13 deletions and the lock-based liveness; every listed test file.
5. H-T4d vector check per family; delete what is covered; record gaps.
6. D-T2-7; manifest; CHANGELOG; census.

## Validation (focused)

- FR `test/runner/provider-capacity.test.mjs test/runner/dispatch-worker-session-boot.test.mjs test/verbs/dispatch-recovery.test.mjs test/run-supervisor/inspect-recover-adopt.test.mjs test/run-supervisor/contracts-unit-state.test.mjs test/cli/dispatch-reconcile.test.mjs test/runner/dispatch-operability-production-door.test.mjs test/runner/assignment-layout.test.mjs test/runner/dispatch-reconcile-operation.test.mjs test/setup/terminal-control-checks.test.mjs test/runner/assignment-runresult.test.mjs test/runner/execution/run-provider-failover.test.mjs`
- `cargo test -p fgos-agent-protocol --test terminal_vectors --test direct_vectors` (read-only check of coverage).
- `rg -n "resume-driver|reassign-driver|dispatch\.claim|DRIVER_FRESH_MS|AUTH_ANCHOR_PATTERNS|herdr-deadlines" src packages/run-supervisor/contracts` → nothing (`AUTH_ANCHOR_PATTERNS` only if a gap is recorded).

## Risks

| Risk | L × I | Mitigation |
|---|---|---|
| Dropping the entry loses a sticky account a resume needed | L × H | Drop only after the outcome is persisted; every later bind uses a new id (fact 1); the resume-keeps-account proof runs in this phase. |
| Removing the text judge stops failover for a family whose stops the protocol does not name | M × H | Vector check per family first; only covered families lose the text path; gaps recorded. |
| Lock-based liveness changes what `fgos state read` shows as running | M × M | Signature unchanged; a run counts as running exactly while its attempt lock is held (the supervisor era fact); CHANGELOG line if output changes. |
| `fgos dispatch recover` users relied on the two actions | L × L | They never acted (no claim writer); CHANGELOG line. |

## Rollback

Revert the merge; re-activate the previous release. On disk: fewer `state.assignments` entries (old release treats a missing one as no sticky and no audit); old release may offer the two actions again.

## Done when

P01 rows green; vector check recorded per family; deletions done; landed with a panel smoke (two seats, one worker session server); guide section written.

## Lead brief essentials

No age rule for B-7. Holder-lock door for B-8, no new lock. Vector coverage decides H-T4d. All plan.md lead rules apply.
