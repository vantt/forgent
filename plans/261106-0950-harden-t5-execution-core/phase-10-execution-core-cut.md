---
phase: 10
title: "Execution core cut: runUnitBody splits along its seams, the provider-limit answer becomes a pure function, the run and the dry bind share one ask builder, the first unit record goes through the durable door"
status: pending
depends_on: [07, 09]
parallel: "none in practice (run.mjs chain; assignment.mjs after P09); may overlap P11 (disjoint files)"
effort: ~1d
net_size: "Node −250 / Rust 0 / tests −50 (estimate)"
---

# Phase 10 — Execution core cut

## Context

Arbitration §2 Execution Core shape (approved): `runUnitBody` splits into `loadResumedUnit`, `admitFreshUnit`, `runRole` (`bindSeat`, `finishPendingCommit`, `runAttempt`) and a pure `answerProviderLimit(result, bound, attempts, rotation, baseline) → stop | rebind | walk`; builders go to the files that own the concept (`assignment.mjs`, `commit-unit-work.mjs`); one `askFor(seat, ledger)` serves the run and the dry bind (Simpl. 5 dry-bind ask: adds symmetric independence to the dry bind). Budgets: `src/runner/execution` ≤ 7 000 (7 682), `run.mjs` ≤ 1 150 (1 640), no function over 300; `bind.mjs` ≤ 520 (564). Also: the first `unit.json` write still bypasses the durable door (batch C covered the later writes only); `legacyPersonaProjection` (`p-3e6b1a52`) held until its readers are checked (arbitration §4).

Code read on `4b116c27e`:
- `runUnitBody` `run.mjs:606-1641` (1 036 lines). Resume load `:647-700+` (reads `unit.json` with a plain `JSON.parse` `:656,668`); fresh admission through the first record `:700-950` (first write `fs.writeFileSync(… 'unit.json' …)` `:935`, later writes `publishMutableProjection` `:967,971,1023`); `dispatchBound` `:1026-1160`; `runRoleBody` `:1164-1550` with `askOf` `:1181-1194`, `bindCtxFor` `:1197`, `commitWork` `:1245`, `writeGate` `:1273`, pending-commit finish `:1280-1307`, attempt `:1321-1424`, provider-limit answer `:1425-1545` (`isLeaseConflict` `:1429`, rotation `:1502-1505`, walk `:1519-1521`); `runRole` wrapper with once-only `arrive` `:1551-1556` (landed `4e4c6608a`).
- Dry bind: `src/runner/execution/dry-bind.mjs:30-62` builds its own ask (no `seatLedger.dependentExecutors(...)`, no `noteDependence`); `batch?.arrive()` at `:65` outside a `finally` (batch C note).
- `src/runner/execution/bind.mjs` 564 lines (`explainSeat` `:546`).
- `src/runner/dispatch/assignment.mjs:639` (`legacyPersonaProjection`), callers `:701,703`; `legacy-seat-read.mjs` keeps old records readable (SEAT-TRIM owner decision 10-21 18:30).

## Requirements

- Cut `runUnitBody` into the named functions; each ≤ 300 lines; closures over `unitRecord`, `scope`, `rebindKeys`, `seatLedger` become one run context object passed explicitly.
- `answerProviderLimit` is pure (no bind, no persist, no I/O): given the attempt result, the bound seat, the attempts so far, the rotation view and the baseline, it returns `{ stop } | { rebind } | { walk: { from, rotation?, failedAccounts? } }`; `runRole` performs the returned action (bind, persist, dispatch). The lease-conflict rebind, account rotation and executor walk keep today's order and limits. This is the seam P12 tests in-process.
- `askFor(seat, ledger, unitContext)` builds the bind ask once (posture, persona, bind context, read-only, `independentOf` with `dependentExecutors`, `preferIndependentOf`, overrides, blind); `run.mjs` and `dry-bind.mjs` both call it. The dry bind therefore applies symmetric independence (CHANGELOG line: `seat-binding-dry-bind` and the pre-run account-pin check now agree with the run). `dry-bind.mjs` calls `arrive` from a `finally`.
- Builders go to their owners: the assignment built for `dispatchBound` → `assignment.mjs`; `commitWork`/`writeGate` → `commit-unit-work.mjs`.
- The first `unit.json` write uses `publishMutableProjection` (or `publishImmutableProof` if the lead shows the file is created once and replaced after); the resume reads that fail to parse throw a named error (`unit-record-unreadable`, path), not a bare `SyntaxError`.
- `legacyPersonaProjection`: list its inputs' sources (`rg -n "pinned" src/runner/dispatch/assignment.mjs`, `legacy-seat-read.mjs` readers). If no record shape `legacy-seat-read.mjs` keeps can reach it, delete it and close `p-3e6b1a52` (P13); else keep it and record the reader in the report.
- Remove duplicates while cutting (repeated `unit.writes.length > 0 || unitRecord.sync`, the `--force-shared-cwd` error built twice, `assignmentId` computed at `:1195` and `:1328`), and label comments in `src/runner/execution/*.mjs` files this phase cuts.

## Files

**Create:** none (functions live in existing files; a new file only if `run.mjs` cannot reach ≤ 1 150 otherwise, named by convention and justified in the report).

**Modify:** `src/runner/execution/run.mjs`; `src/runner/execution/dry-bind.mjs`; `src/runner/execution/bind.mjs` (only to reach ≤ 520 if `askFor`'s move frees lines; no behaviour change); `src/runner/dispatch/assignment.mjs`; `src/runner/execution/commit-unit-work.mjs`; tests that reach into moved closures (`test/runner/assignment-enumerator-guard.test.mjs` keys, `test/runner/execution/run.test.mjs` only if a helper name changed); `CHANGELOG.md`; census.

**Delete:** duplicate expressions; `legacyPersonaProjection` if unreachable; label comments in cut files.

**Tests to retire:** none here (P12 retires the launch-bound failover cases once `answerProviderLimit` is tested in-process). The dry bind gains one case in `test/setup/seat-binding-dry-bind.test.mjs`: "the dry bind refuses a seat that only the reverse independence forbids", the case the run already enforces.

## Net size

Node: duplicates −60, comment labels/history −90, structure −80, `askFor` shared −25, `legacyPersonaProjection` −20 (if unreachable), named unreadable-record error +5 → about −250 (simplicity −130 before moves plus comments). Tests: dry-bind case +15, re-pointed guards ±, removed cases that pinned internal closures −65 → about −50.

## Steps

1. Re-read on the current tree; map blocks; list every closure variable.
2. Extract `loadResumedUnit`, `admitFreshUnit` (and the first-write door) — commit, focused set.
3. Extract builders to `assignment.mjs`, `commit-unit-work.mjs` — commit.
4. Extract `answerProviderLimit` (pure) and `bindSeat`, `finishPendingCommit`, `runAttempt` — commit, failover file green.
5. `askFor` shared with `dry-bind.mjs`; dry-bind case; `arrive` in `finally`.
6. `legacyPersonaProjection` check; duplicates; labels; scan; census.

## Validation (focused)

- FR `test/runner/execution/run.test.mjs test/runner/execution/run-provider-failover.test.mjs test/runner/execution/run-case-admission.test.mjs test/runner/execution/run-sync.test.mjs test/runner/execution/run-resume-order.test.mjs test/runner/execution/account-rotation.test.mjs test/runner/execution/commit-unit-work.test.mjs test/runner/execution/seat-ledger.test.mjs test/setup/seat-binding-dry-bind.test.mjs test/runner/driver-rununit.test.mjs test/runner/assignment-enumerator-guard.test.mjs test/workflow/core-workflow-seats.test.mjs`
- Function-length scan: nothing in `src/runner/execution` over 300; `wc -l run.mjs` ≤ 1 150.

## Risks

| Risk | L × I | Mitigation |
|---|---|---|
| The failover state machine changes order (rotation before walk, ceilings) | M × H | `answerProviderLimit` is extracted verbatim first, then made pure; the failover file (real launches, 30 cases) runs after each step. |
| The dry bind now refuses configurations that bound before (symmetric independence) | M × M | That is the run's behaviour; the dry bind was wrong. CHANGELOG line; doctor message unchanged. |
| A resume record written by the old release reads differently through the new loader | L × M | Loader is a move; `run-resume-order` and resume cases run. |

## Rollback

Revert the merge; re-activate the previous release. No on-disk change (the first `unit.json` write produces the same bytes, fsynced).

## Done when

Budgets met; `answerProviderLimit` pure and exported for P12; dry bind shares the ask; landed with a panel smoke (two seats, independence); guide section written.

## Lead brief essentials

Extract verbatim, then simplify; failover file after each step; no behaviour change except the dry bind's symmetric independence. All plan.md lead rules apply.
