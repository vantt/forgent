---
phase: 07
title: "Post-SEAT carry list: assignment-runner, run.mjs, unit-summary.mjs, main.rs"
status: pending
depends_on: [05]
parallel: "gated on SEAT landing on main; after that it may run beside phase 06 (disjoint files except registrations.mjs, where phase 06 deletes a range this phase does not touch) and before phase 08 when SEAT has landed; otherwise it stays open and is recorded in the close report"
effort: ~0.5d
net_size: "Node −6 / Rust 0 / tests 0 (estimate)"
---

# Phase 07 — Post-SEAT carry list

## Context

Parent plan [phase 01, "SEAT carry list"](../261021-1118-harden-low-layers-bottom-up/phase-01-t0-process-facts-and-leaf-crates.md) and the hand-off rule: these items are finished in the first change after SEAT lands, before parent phase 02 closes. SEAT branch `origin/seat-binding-wave` touches `src/runner/dispatch/assignment-runner.mjs`, `src/runner/execution/run.mjs`, `src/runner/execution/unit-summary.mjs`, `src/setup/registrations.mjs`, `apps/fgos/src/main.rs` (diff list in [plan.md](plan.md) Facts). Nothing here changes behaviour; it removes the compatibility re-exports phases 2–5 left for these files and moves their three sites onto the door.

## Requirements

- Start only when `git merge-base --is-ancestor origin/seat-binding-wave main` (or the SEAT landing commit named on the board) holds; re-verify every line below on the landed main before editing (SEAT moves them).
- `src/runner/dispatch/assignment-runner.mjs` (today `:75, :82, :823` import `isProcessAlive`/`resolveHolderLiveness` from `run-lock.mjs`; `:116-117` import `canonicalJson` from `proof-helpers.mjs`; `:920-926` the staging judge): import `resolveHolderLiveness` from `process-identity.mjs`; the staging judge becomes `resolveHolderLiveness({ pid: stagedPid }) === 'dead'` (P1: unknown keeps the staging directory; `rmSync` at `:932, :942` only on `dead`); `canonicalJson` keeps coming from `proof-helpers.mjs` (a re-export of the door since phase 5), so that import is unchanged.
- `src/runner/dispatch/run-lock.mjs`: delete the `resolveHolderLiveness` re-export (`:45-47` after phase 3) and the `isProcessAlive` name if phase 3 kept it for the carry list.
- `src/runner/execution/run.mjs:51-61` `writeJsonAtomic` and `src/runner/execution/unit-summary.mjs:196`: no-fsync class, stays Node (arbitration Part A `durable-file`), but the temp name comes from `uniqueTmpTag()` (speed S15). No other change.
- `src/setup/registrations.mjs` SEAT parts: nothing of T0 remains there after phases 3 and 6; verify with `rg -n "process\.kill|/proc/" src/setup/registrations.mjs` → nothing.
- `apps/fgos/src/main.rs`: no T0 edit is expected (the `process-observe` arm lives in `packages/holder-lock/rust/src/route.rs`, deleted in phase 6; `main.rs:183` only dispatches to `fgos_holder_lock::route::main`). Record "no edit needed" or the one edit SEAT's landing made necessary.
- Close criterion of the parent phase 01: no exported Node liveness, signal or canonical function outside the client file; `rg -n "export function (isProcessAlive|resolveHolderLiveness|pidExists|canonicalJson)" src` → only `process-identity.mjs` (`resolveHolderLiveness`) and the door re-exports (`proof-helpers.mjs`, `effective-execution-contract.mjs` if moved).

## Files

**Modify**: `src/runner/dispatch/assignment-runner.mjs`, `src/runner/dispatch/run-lock.mjs`, `src/runner/execution/run.mjs`, `src/runner/execution/unit-summary.mjs`, `packages/git/contracts/mutation-census.v1.json`. **Create**: none. **Delete**: the two re-exports in `run-lock.mjs`. **Tests to retire**: none (`test/runner/assignment-*.test.mjs` own the staging behaviour; the owning case for "unknown keeps the staging directory" is added there if `rg -n "staging" test/runner/assignment-layout.test.mjs test/runner/assignment-dispatch.test.mjs` finds none).

## Steps

1. Confirm SEAT landed; rebase the track branch (or start from main if T0 already landed).
2. The three edits; the one wiring case if missing; census; focused tests; `npm test` once.
3. Update the parent plan's phase 01 "Constraints" (carry list done) and the board row.

## Verification (exact)

- `node scripts/run-tests.mjs test/runner/assignment-layout.test.mjs test/runner/assignment-dispatch.test.mjs test/runner/assignment-runresult.test.mjs test/runner/execution/run.test.mjs test/runner/execution/unit-summary.test.mjs test/runner/run-lock-identity.test.mjs`
- `rg -n "isProcessAlive|resolveHolderLivenessByIdentity" src` → nothing.
- `rg -n "\.\$\{process\.pid\}\.\$\{.*\}\.tmp|\.tmp\.\$\{Date" src/runner/execution` → nothing.

## Net size

Node −6 (two re-exports, two temp-name lines net 0). Rust 0. Tests 0 (+8 if the staging wiring case is missing).

## Risks

| Risk | L × I | Mitigation |
|---|---|---|
| SEAT renamed or moved the sites | H × L | Re-grep on the landed main before editing; the brief gives symbols, not only lines. |
| T0 closes (phase 8) before SEAT lands and this phase is forgotten | M × M | The close report and the board row list it as open with its owner; the parent phase 02 cannot close until it is done. |

## Rollback

Revert the phase's commits; the re-exports return.

## Done when

The parent phase 01 close criterion holds on main, the carry list is marked done in the parent plan and on the board.

## Lead brief essentials

Delete list: the two `run-lock.mjs` re-exports. Find the owning test before writing a new one. Δ-lines per language. Report only what you saw yourself. Touch nothing outside the four files. Report name from `fgos convention name --json`.
