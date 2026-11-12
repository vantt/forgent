---
phase: 07
title: "Execution applies the scope rule and the verify round before it settles, then writes the unit-run-result fields (final outcome, infrastructure, outOfScope, evaluations, report read) with a fixture per outcome"
status: completed
depends_on: ["05 landed (verify door; unit-handoff.mjs and run.mjs writer order)", "20 landed (one outcome module: its predicates compute infrastructure)", "21 landed (run.mjs writer order)", "COOK's unit-run-result contract text (branch cook/unit-run-result, tip 444dd1b1b)", "owner approval of COOK's four-step split (decision 81)"]
parallel: "T5 (Execution layer), last T5 phase; beside P22 if P22 is still open (file-disjoint); touches no bin/fgos.mjs range"
effort: ~1.5d
net_size: "Node: Execution about +90 (scope rule +40, fields and evaluations +40, report read +10), Workflow about -65 (foldUnitOutcome and outOfScopeWrites -45, report re-hash -20): about +25; Rust 0; tests about +40 fixtures, moved tests not grown (estimate)"
---

# Phase 07 - Scope rule into Execution, then the result fields (COOK steps 1 and 3; authority audit AU-09, AU-10 High, AU-11, AU-14)

**Approved** (owner decision 85, and the owner approved the whole `unit-run-result` contract on 2026-11-12). The field names, their meanings and the per-outcome table come from COOK's text (`docs/platform/runner/contracts/unit-run-result.md`, §3-§5); this phase cites it and invents nothing. If the text and the code disagree, step 1 stops and reports.

**Authority moved:** "writing outside the scope is not a pass" and the final outcome move from Workflow (`foldUnitOutcome`) into Execution, before it settles; Execution becomes the one writer of `infrastructure`, `outOfScope[]`, `evaluations[]` and the report digest read. Workflow reads them (P09).

## Context

**AU-10 (High).** Execution commits only paths inside the scope and reports the rest in `commit.outOfScope` (`src/runner/execution/run.mjs:628,701-712`); it keeps the outcome `pass` and settles the case reservation with it (`settleAdmission`, `run.mjs:198`, called from the run's `finally`, `:188`). Afterwards the Playbook runner (`src/workflow/runner.mjs:277`) calls `foldUnitOutcome` (`src/workflow/unit-handoff.mjs:344`), which re-reads Execution's private `unit.json` for the write scope, diffs the branch through Git (`outOfScopeWrites`, `:280`), and rewrites `pass` to `findings` (path outside the scope) or `execution-failure` (check cannot run). So for a Playbook case the case ledger says `pass` while the workflow ledger says `findings` for the same Unit run, and `fgos run --case` never applies the rule at all. `infrastructure` ("no path written outside the declared scope", COOK §3) cannot be computed where Execution settles until this moves.

**AU-09.** Workflow decides which results are verdicts (`receiptsFromResults`, `src/workflow/case-projection.mjs:290-303`); the case admission port's `settle(reservationId, result)` takes an untyped object (`src/runner/execution/case-admission-port.mjs:34-38`). **AU-11.** Retryable and rerunnable are classified twice (`run.mjs` `seatStateOf`, `src/workflow/store.mjs:262-264`); P20 puts both predicates in the outcome module, this phase writes the Unit-level `infrastructure` with them. **AU-14.** Workflow re-hashes Execution's reports (`src/workflow/ref-digests.mjs` `digestUnitRunReports`) and infers their path from the run layout.

Where the outcome and result are produced (re-read by `rg` at step 1): `run.mjs`, `unit-run-start.mjs` (resume check `:51-58`, the home of the branch-level check), `unit-run-history.mjs`, `unit-sync.mjs`, `loops/*`, `src/runner/fanout-batch.mjs`, the read model `unit-summary.mjs` (`{ id: 'unit-summary', version: 2 }`), `handoff-refs.mjs` (settled report digest, `report-changed-after-settle`).

## Requirements

1. **Scope rule into Execution (AU-10).** `outOfScopeWrites` and the rewrite move into Execution and run **before** `settleAdmission`, so the case settle and `data.outcome` carry the same final outcome. The branch-level check (`outOfScopeOnBranch[]`, paths the branch carries since its base) sits beside the resume check in `unit-run-start.mjs`; the base Unit's `outOfScopeOnBranch` is an input Execution receives (COOK §3), so the Playbook runner reads nothing from `unit.json`. `foldUnitOutcome` and `outOfScopeWrites` are deleted from `unit-handoff.mjs`; `runner.mjs` reads the final outcome. `fgos run --case` now applies the rule (bug fix; CHANGELOG line). The owning test moves from `test/workflow/*` to `test/runner/execution/*`; Workflow keeps one wiring proof.
2. **Fields at the settle site** (COOK §3, §4): `outcome` final; `infrastructure` (Unit-level and per attempt) from the outcome module's predicate (P20); `outOfScope[]`, `outOfScopeOnBranch[]`; `evaluations[]` (`{ kind: 'verify' | 'verdict', seat, round, passed }`, built where `receiptsFromResults` builds its input today); `started`, `settled`, `warnings[]` as the text names them. Computed once, at the settle, never re-derived by a reader.
3. **Port settle shape (AU-09).** The case admission port's `settle` carries the versioned Unit shape (COOK §2 item 3) instead of raw `results`; `contract: { id, version }` on it.
4. **Report read (AU-14).** One Execution read `reportDigest(unitRunId, seat)` (name from the text, or the existing `handoff-refs.mjs` resolver extended) returns the report's path and current digest; `digestUnitRunReports` in `ref-digests.mjs` calls it and stops walking the run layout. The sha256-of-bytes helper is the T0 one (`rg -n "createHash\('sha256'\)" src packages/canonical-json packages/durable-file` at step 1; reuse the existing export; Workflow's third copy goes). `digestSubject` and `digestContextRefs` are Workflow's own facts and stay.
5. **A fixture per outcome** under `packages/run-result/contracts/fixtures/` (COOK §5), one per outcome of the table including `not-started` (as `started: { value: false }`), the undetermined and a crash-recovered settle, each asserting every new field; read by the Node tests (and the Rust ones if the text says so). P09 and P11 read them.
6. **Version (decision 83 i).** RunResult stays version 3 with optional fields; if any change of meaning appears, the next number is 5, never 4. No migration (additive). Old records are P09's legacy reader.

## Files

**Create:** the fixture files under `packages/run-result/contracts/fixtures/` (names from the text).

**Modify:** `src/runner/execution/run.mjs` (settle site, scope rule), `src/runner/execution/unit-run-start.mjs` (branch-level check), `src/runner/execution/case-admission-port.mjs` (settle shape), `src/runner/execution/handoff-refs.mjs` (report read), `unit-run-history.mjs` / `loops/*` only where step 1 finds the settle writer, `src/workflow/unit-handoff.mjs` (delete `foldUnitOutcome`, `outOfScopeWrites`), `src/workflow/runner.mjs` (reads the final outcome), `src/workflow/ref-digests.mjs` (report part only), `test/runner/execution/*` (owners of the settle path; receives the moved scope-rule cases), `test/workflow/*` (one wiring proof left), `CHANGELOG.md` (one line: `fgos run --case` refuses a pass that wrote outside its scope, as the Playbook runner does). The area spec section stating the result shape is P16's (DOC told).

**Delete:** `foldUnitOutcome`, `outOfScopeWrites` and their Workflow-side `unit.json` read; the third sha256 helper in `ref-digests.mjs`.

**Tests to retire:** the `test/workflow/*` scope-rule cases move to `test/runner/execution/*` with their assertions (moved, not copied); if an existing test asserts the exact key set of a settled result, it is widened to the new keys and named.

## Red tests first

- `fgos run --case` with a Unit whose branch carries a path outside its scope settles `findings` in both ledgers (fails today: the case ledger says `pass`).
- The fixture table, run against today's code, fails on the new fields for every outcome.

## Steps

1. Re-read COOK's §3-§5 and the fixtures; locate the single settle site per outcome class with `rg` and `file:line`; confirm no second writer of a settled result (one door; P23 removes Workflow's dead-reservation settle). Stop on a mismatch.
2. Red tests; move the scope rule; delete `foldUnitOutcome`; both ledgers agree.
3. Fields, settle shape, report read; fixtures green.
4. `rg` every reader that asserts a result's exact keys; widen.

## Validation (focused)

FR the fixture table, `test/runner/execution/*` settle and unit-run-start tests, `test/runner/execution/unit-summary*.test.mjs`, the Workflow runner wiring case, `test/workflow/*ref-digest*`; land gate. COOK reviews against the text.

## Risks

| Risk | L x I | Mitigation |
|---|---|---|
| A field is computed from state not available at settle time | M x M | fixtures include a crash-recovered run (the settled record written by recovery) |
| A strict reader rejects unknown keys | L x M | step 4 scan; the summary reader is checked first |
| The Playbook runner loses the inherited out-of-scope part of the step it builds on | M x H | Execution takes the base Unit's `outOfScopeOnBranch` as an input; a red case with a producer commit inherited from the base |

## Rollback

Revert the merge commit; the fields vanish and `foldUnitOutcome` returns; P09 must not have landed (it depends on this phase).

## Done when

Red then green on every fixture; `rg -n "foldUnitOutcome|outOfScopeWrites" src` nothing; one sha256 helper; COOK confirms the fields against the text.
