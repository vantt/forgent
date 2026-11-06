---
phase: 09
title: "Dispatch cut: executeAssignment becomes named steps over one attempt object, admitRunAttempt gets its own module, the refused-lease settlement moves to settlement.mjs; duplicates, no-op catches and plan labels go"
status: pending
depends_on: [06, 07]
parallel: "none (assignment-runner.mjs chain; feeds assignment.mjs to P10)"
effort: ~1d
net_size: "Node −300 / Rust 0 / tests −50 (estimate)"
---

# Phase 09 — Dispatch cut

## Context

Arbitration §2 Dispatch shape (approved): `executeAssignment` becomes `loadImmutableAssignment`, `leaseAccountForAttempt`, `settleRefusedLease` (in `settlement.mjs`), `buildLaunch`, `awaitBinding`, over one `attempt` object that the `finally` reads; `admitRunAttempt` to its own module; `assignment-runner.mjs` ≤ 1 500 with `executeAssignment` ≤ 300. Arbitration §3 Simpl. 1 (duplicates removed while cutting; no-op catches; plan/phase labels per the Stable Code Artifacts rule). Runs after the fixes that touch the same lines (P05, P08, P06), so it cuts live code (simplicity order "cuts start from live code").

Code read on `4b116c27e` (lines move with P05/P06/P08; the lead re-reads before cutting):
- `executeAssignment` `assignment-runner.mjs:1027-2144` (1 118 lines; 435 comment lines in the file).
- Load: `:1061-1125` (read or publish `assignment.json`, template resolution).
- Locals the `finally` reads: `:1289` `providerCapacitySelection`, `:1305-1324` (`attemptLocks`, `attemptSettled`, `handedOffResult`, `terminalPrep`, `controlEpoch`, `intentWritten`, …).
- Lease: quarantined-account probe and `acquireNamedAccountLease` `:1351-1460` (`:1404`).
- Refused lease settled by hand: `:1460-1545` (`normalizeRunResultV2` `:1496` → V3 after P08; own run control).
- Settled-or-refuse reads: `:1523`, `:1593`, `:1614` (all `readSettledResult`, landed `8af1a6b71`).
- Credential renewal `:1738-1760`; command resolution `:1800-1836` (no-op `catch (err) { throw err; }` `:1834-1836`); confinement prep `:1890-1911` (no-op catch `:1909-1911`); terminal prep `:1948-1970`; envelope `:1985-2040`; supervisor and binding wait `:2053-2115`; `finally` `:2119-2143`.
- `dispatchBatchKey` built twice (`:1894`, `:1969`); `unitRunIdOf` `:1297` and its re-derivations.
- `admitRunAttempt` `:604-932` (329 lines) with its stale-staging cleanup (`:891`, anchored by `4e4c6608a`).
- `settlement.mjs` (831 lines) already owns "commit a settlement".

## Requirements
- **Added by owner decision 68:** in `settlement.mjs` `isSubstantiveReportText`, OK, YES and NO stop counting as generic filler (placeholders such as TODO, TBD, N/A still refuse); the dispatch brief's `agent-report.md` line (`assignment.mjs:896`, asserted in `test/runner/assignment.test.mjs:213`, `dispatch-brief.test.mjs:105`) asks for one sentence stating what was answered or done. Proof: `test/runner/assignment-runresult.test.mjs` next to the placeholder case (`# Report\nok` with claim `done` → verdict pass, confidence reported).

- Cut along the shape above, each function in the file that owns its concept: `loadImmutableAssignment` (stays in `assignment-runner.mjs` or goes to `assignment.mjs` as the arbitration's simplicity source says; one place, lead decides by importers), `leaseAccountForAttempt`, `settleRefusedLease` → `settlement.mjs`, `buildLaunch` (command, confinement request, terminal prep, envelope; returns what `startSupervisor` needs), `awaitBinding`. One `attempt` object replaces the loose locals; the `finally` reads only it. Behaviour unchanged, including P06's order rule.
- `admitRunAttempt` moves to its own module under `src/runner/dispatch/` (name from `fgos convention name`), with its private helpers; its importers updated (L10, no re-export).
- Remove while cutting: the two no-op catches; the duplicated `dispatchBatchKey` and `unitRunIdOf` expressions; the repeated "from" object builders if present; comment lines that retell plan, phase, audit or finding labels (`rg -nE "Phase [0-9]|Pre-Phase|Cell [0-9]+\.[0-9]|ADR-[0-9]+ R[0-9]|I0[0-9]-REV|tsk-[a-z0-9]+ D[0-9]" src/runner/dispatch`: 97 hits in the layer on `4b116c27e`, 23 in this file) — keep the invariant each states, drop the label and history.
- Budgets: `executeAssignment` ≤ 300 lines; `assignment-runner.mjs` ≤ 1 500; no new function over 300 lines; Dispatch outside `confinement/` trending to ≤ 19 000 (P11 finishes it).
- No behaviour change: the existing tests are the proof; a test that reached into a removed local is re-pointed, not weakened.

## Files

**Create:** the `admitRunAttempt` module (convention name).

**Modify:** `src/runner/dispatch/assignment-runner.mjs`; `src/runner/dispatch/settlement.mjs`; `src/runner/dispatch/assignment.mjs` (only if `loadImmutableAssignment` goes there); importers of `admitRunAttempt` (`rg -n "admitRunAttempt" src test`); comment-label lines in other `src/runner/dispatch/*.mjs` files this phase does not otherwise touch are left to P11 (config.mjs) or untouched (no drive-by churn outside the cut files); `docs/architecture-manifest.json` (new module row); census.

**Delete:** the no-op catches; the duplicate expressions; label comments in the cut files.

**Tests to retire:** none expected. Tests that call `admitRunAttempt` through the old import path are re-pointed. If the enumerator allow-list (`test/runner/assignment-enumerator-guard.test.mjs`) names locals of `executeAssignment`, its keys follow the new function names (as `4e4c6608a` did for `runRole`).

## Net size

Node: duplicates and no-op catches −60, label and history comments −150, structure (one attempt object, fewer repeated guards) −90 → about −300. Tests: re-pointed imports, guard keys ±, a few cases that re-tested an internal removed duplicate −50.

## Steps

1. Re-read the function on the current tree; map each block to a target function; list the locals the `finally` reads.
2. Extract in order, one commit each, running the focused set after each: `admitRunAttempt` module, `loadImmutableAssignment`, `leaseAccountForAttempt`, `settleRefusedLease`, `buildLaunch`, `awaitBinding`, the `attempt` object.
3. Duplicates, no-op catches, labels.
4. Function-length scan (scratch script) and `wc -l`; census.

## Validation (focused)

- FR `test/runner/assignment-dispatch.test.mjs test/runner/assignment-runresult.test.mjs test/runner/assignment-enumerator-guard.test.mjs test/runner/run-lock-identity.test.mjs test/runner/provider-pool-lease.test.mjs test/run-supervisor/attempt-steps.test.mjs test/run-supervisor/direct-cutover.test.mjs test/run-supervisor/terminal-cutover.test.mjs test/runner/execution/run-provider-failover.test.mjs test/architecture.test.mjs`
- Function-length scan: `executeAssignment` ≤ 300, nothing in `assignment-runner.mjs` over 300.

## Risks

| Risk | L × I | Mitigation |
|---|---|---|
| The `finally` loses a release (lock, lease, run control, pane) after the locals become one object | M × H | List the five releases before cutting; the crash-matrix and failure-path tests (P06 row) run after each extraction. |
| A cut changes await order on the launch path | L × M | Pure moves; no reordering beyond P06's rule; diff reviewed block by block. |
| Comment trimming removes an invariant a reader needs | L × L | Keep the invariant sentence, drop only labels and history. |

## Rollback

Revert the merge; re-activate the previous release. No on-disk change.

## Done when

Budgets met; focused set and full gate green; landed with a direct and a pane smoke; guide section written.

## Lead brief essentials

Moves, not rewrites; one extraction per commit with tests between; no behaviour change. All plan.md lead rules apply.
