---
phase: 19
title: "Status accounts for every run: workflow status lists each finished seat's executor, family, model and account for presets and --units runs too, read from the result already on the ledger"
status: pending
depends_on: ["01-15 on main (T6 as closed 2026-11-08)"]
parallel: "final wave, with 16, 17, 18 and 20 step 1 (disjoint files)"
effort: ~0.5d
net_size: "Node 0 (range -2..+2) / Rust 0 / tests +12"
---

# Phase 19 — Status accounts for every run (owner decision 73 (d); closing report idea 5)

## Context

Owner decision 71 (3a): "`workflow status` shows each seat's account". Landed only for `--seats` runs: the closing report's smoke shows a `--seats` run lists one row per finished seat and a run without `--seats` prints no `seatProviders` block "by design of the verb". Owner decision 73 (d): `workflow status` shows each seat's account for every run, not only `--seats`.

### Where the gate is, and what the data already is (traced, no new state)

- The gate is one expression: `src/workflow/case-verbs.mjs:168`, `const served = state.seats ? { seatProviders: seatProviders(state) } : {};` (`state.seats` is the `--seats` list from `workflow.start`, `store.mjs` fold of `workflow.start`). Nothing about the rows depends on it.
- `seatProviders(state)` (`src/workflow/seat-providers.mjs:24-50`) is pure over `state.steps[*].units[*].results[*]`: per result it reads `binding` (`persona`, `executor`, `invocation`, `account` or the skipped reason, fallback), `runResult.policy.providerModel`, `outcome`, `role`, `round`.
- Every run's results already carry that `binding`: the Execution Core puts `binding: bound` on each seat result (`src/runner/execution/run.mjs:625,858`); the runner writes the results into `unit.complete` and drops only `runResult.evidence` (`src/workflow/runner.mjs:122-128,284`); the fold keeps them (`store.mjs:326-333`, `results: p.results || []`). Presets and `--units` runs go through the same path as `--seats` runs, so their ledgers already hold the account (or the reason the pin skipped it) per seat.
- Therefore **no new on-disk state, no read of the Unit run directory, no new field.** (If the lead finds a run whose results lack `binding`, for example a run recorded by an older release, that is a question to the coordinator, not a reason to open `unit.json` here.)

Callers of `seatProviders`: `case-verbs.mjs:168` only (`rg "seatProviders" src bin` shows the definition and that one call).

## Requirements

1. `statusWorkflow` returns `seatProviders` for every case: the rows `seatProviders(state)` gives, an empty array until a seat has finished and for a conductor case (no Playbook steps in its fold). The key is always present: one documented shape, one line of code fewer than a conditional.
2. A `--seats` run's rows are unchanged (same function, same row shape; `test/workflow/workflow-runner-seats.test.mjs:62-63` stays as it is).
3. Text that says "for a seated run" becomes "for a run": the doc comment at `case-verbs.mjs:155`, the comment at `:167`, the `status` description in `src/cli/command-registry.mjs:2469`, and the CHANGELOG line already under `## [Unreleased]` ("... and, for a seated run, each seat's account ..."; edit that line, add no second one).
4. No other behaviour moves: `advance`, `case`, `bindingsJudgment` and the Playbook fields of the status are untouched.

## Files

**Create:** none.

**Modify:** `src/workflow/case-verbs.mjs` (the one expression and two comments); `src/cli/command-registry.mjs` (description text only; hot file, one writer in this wave); `test/workflow/units-runner.test.mjs` (extend an existing completed-run test with a status assertion; no new spawn); `CHANGELOG.md` (edit the existing line); `plans/reports/guide-261108-1230-owner-machine-harden-t6-workflow.md` (new short section, append-only, rebase).

**Delete:** the `state.seats ?` condition. Nothing else.

**Tests to retire:** none. Owners: the pure rows have their owner in `test/workflow/seat-evidence.test.mjs:58` (account, skipped reason, null); the status wiring proof for `--seats` stays at `workflow-runner-seats.test.mjs:62-63`; this phase adds the one wiring proof for a run that has no `--seats`.

**Spec lines (written at wave close, Vietnamese):** RUL-WF-39 (`docs/platform/workflow/spec.md:347`) gains: `workflow status` hiện account của từng ghế đã xong cho mọi run (preset, `--units`, `--seats`), đọc từ `binding` trong kết quả đã ghi trên ledger; không có trạng thái mới trên đĩa.

**Do not touch:** `src/workflow/seat-providers.mjs` (unchanged, pure), `runner.mjs`, the Execution Core, any `unit.json` reader.

## Red test first

In `units-runner.test.mjs`, in "a units file runs through startWorkflow, and a unit's prefer and persona reach the Unit it runs" (`:139`, a completed `--units` run with no `--seats`): after the run, `statusWorkflow(id, opts(tmp))` must carry a `seatProviders` row for the finished seat whose `executor` is `test-node` and which has an `account` key (`null`: no account pinned). Today the key is absent: red. A second assertion in "workflow with two units on different providers pins account only on matching unit and both run" (`:344`) shows the `pool/account` string on the pinned unit's seat and the pin-skipped reason or `null` on the other. Reuse the existing run; do not add a spawn.

## Steps

1. Red assertion. 2. Drop the condition; fix the three texts and the CHANGELOG line. 3. Run the focused set; confirm `workflow-runner-seats` and `seat-evidence` unchanged.
4. On fg-server2 after landing: `fgos workflow status <id>` of a preset run lists the rows (the smoke the closing report could not do for non-`--seats` runs).

## Validation (focused, FR)

`test/workflow/units-runner.test.mjs test/workflow/seat-evidence.test.mjs test/workflow/workflow-runner-seats.test.mjs test/workflow/case-verbs.test.mjs test/workflow/workflow-runner-cli.test.mjs test/workflow/playbook-proposer.test.mjs test/cli/fgos-workflow.test.mjs test/cli/subcommand-flag-drift.test.mjs`. Also `rg -n "deepEqual\(.*(status|state)\b" test/workflow test/cli` for a whole-status equality that an added key would break (none seen at plan time).

## Risks

| Risk | L x I | Mitigation |
|---|---|---|
| A status consumer deep-equals the whole status object and breaks on the new key | L x L | The focused set above and the `rg`; the key is additive |
| A long run lists many rows (one per seat result per round) | L x L | Same cost as `--seats` today; rows are small; `status` already reads the whole ledger |
| A result without `binding` (a run recorded by an older release, or a refused unit) prints a row of nulls | L x L | `seatProviders` already tolerates it (`binding = result.binding ?? {}`); the seat-evidence test has the legacy row |

## Rollback

Revert the commit. No data, no format.

## Done when

Red then green; a preset or `--units` run's status lists each finished seat with its account or the reason the pin skipped it; `--seats` unchanged; texts and CHANGELOG line say "a run"; one smoke on fg-server2.

## Net size (honest)

Node about 0: the ternary becomes a plain expression, comment lines change length. Tests about +12: two assertions on an existing run and a short helper, no new test file and no new process. No claim of a size win: this is behaviour the owner's decision 71 (3a) already promised.

## Dependencies

None. Parallel with 16, 17, 18, 20. This phase owns `case-verbs.mjs` and the `status` text in `command-registry.mjs` for the wave. `units-runner.test.mjs` uses its own `setupRepo` (`:61`), so phase 16's fixture change does not reach it; a focused run after rebase is enough.
