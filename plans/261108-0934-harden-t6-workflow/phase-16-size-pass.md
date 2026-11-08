---
phase: 16
title: "Size pass, no behaviour change: projectCase cut to one small fold per event kind (at most 120 lines), one workflow test repository fixture instead of two"
status: pending
depends_on: ["01-15 on main (T6 as closed 2026-11-08)"]
parallel: "final wave, with 17, 18, 19 and 20 step 1 (disjoint files)"
effort: ~1d
net_size: "Node +25 (range +15..+40) / Rust 0 / tests -40 (range -30..-50)"
---

# Phase 16 — Size pass (owner decision 73 (a): a1 and a3; a2 moved to phase 18)

## Context

Owner decision 73 (a): "a size pass with no behaviour change: split `projectCase` (181 -> <= 120), the prune keep reasons as one table, one workflow test repository fixture; ledger and admission growth waits for the coding cutover." Closing report ideas 2 and 9.

**a2 is not here.** The prune keep reasons live in `case-close.mjs`, the file phase 18 rewrites for "prune deletes a case's Unit runs only when the whole case goes". One writer per hot file: a2 is merged into [phase 18](phase-18-prune-whole-case.md) (its steps 1-2).

Prior art: `projectWorkflowState` (195 -> 45) was cut with a `FOLD` table of one function per event type (`src/workflow/store.mjs:283`, `:388`); copy that shape, do not invent another. Fixture side: `test/helpers/workflow-fixture-repo.mjs:28` (`setupWorkflowFixtureRepo`) and `test/helpers/workflow-runner-fixture.mjs:29` (`setupTestRepo`) build the same repository twice.

### a1: what `projectCase` is today (`src/workflow/case-projection.mjs:88-272`, 181 lines)

One closure-heavy function: `achieve` / `achieveIfUnreached` / `activityOf` (`:101-123`), a `switch` over eight event types (`case.opened`, `step.complete`, `gate.answer`, `reservation`, `settle`, `route`, `binding`, `case.closed`, `:132-181`), then four derivations over the folded maps: parked-gate blocking and stale digests (`:184-197`), frame use and remaining (`:199-217`), eligible activities and route points (`:219-231`), closable reasons (`:233-238`), then the 30-line return object.

Callers (all take the returned object, none the internals; 7 call sites in 5 files): `case-runtime.mjs:84`, `case-admission-port.mjs:313`, `case-frame.mjs:32`, `case-projection.mjs:301`, `case-bindings.mjs:215,220,258`. Owner proof: `test/workflow/case-projection.test.mjs` (14 tests; read in full before cutting) plus `test/workflow/stale-approval-reapproval.test.mjs`, `test/workflow/playbook-proposer.test.mjs` and the helper `test/helpers/workflow-case-fixture.mjs` (`projectionOf`).

### a3: what differs between the two fixtures (read both before merging)

| | `setupTestRepo` (runner fixture) | `setupWorkflowFixtureRepo` |
|---|---|---|
| repo | `initFixtureRepo` with `.gitignore` of `.fgos/` and `echo-worker.mjs`, a seed commit, then a README commit | plain `git init`, README commit, no `.gitignore` (the worker script is an untracked file) |
| capabilities | `docs:write`, `code:implement` | caller's list |
| model tiers | `standard` only | `standard`, `flagship`, `frontier` |
| `reviewed` loop | `maxRounds: 2` | `maxRounds: 1` |
| provider families | none (`useDistinctFamilies` adds them when a test needs them) | `withProviderFamilies` clones four executors |
| worker body | writes `report-1.md` and `result-1.json` | `workerBody` argument |

`setupTestRepo` callers: 6 test files, 42 call sites (`workflow-runner-flow` 13, `workflow-runner-lock-status` 8, `workflow-runner-resume` 6, `workflow-runner-worktrees` 6, `workflow-runner-cli` 5, `workflow-runner-seats` 4). `setupWorkflowFixtureRepo` callers: 9 test files (`playbook-proposer`, `case-verbs`, `conductor-case`, `workflow-store-ledger`, `confined-nested-write`, `stale-approval-reapproval`, `fgos-workflow-propose`, `e2e-consumer-noncoding` (2 calls), `worker-env-case-context`) plus the helper `test/helpers/playbook-observable-order.mjs:58`. The three other local `setupTestRepo` functions (`test/cli/run-verb.test.mjs:20`, `test/cli/execution-outcome-exit-codes.test.mjs:18`, `test/runner/attestation-guard.test.mjs:17`) are not workflow fixtures and stay.

## Requirements

1. **No behaviour change.** Same return shape, same result for every input of `projectCase`; same repository, config and worker for every fixture caller.
2. **a1.** `projectCase` at most 120 lines, every helper at most 80. One fold function per event type in a table read by a short loop, over one explicit fold context (`milestones`, `reservations`, `bindings`, `routes`, `blindUnitRuns`, `refusedAchievements`, `closed`, `frameExhausted`, plus the guide and the legacy state the folds read). The four derivations after the loop become named helpers over that context (for example the frame use and remaining, the route points, the closable reasons). `achieve` stays one function with its receipt-merge comment. Exported names and signatures of `case-projection.mjs` do not change.
3. **a3.** One door: `setupWorkflowFixtureRepo` (it already is the one the 10 newer sites use). It gains only the options the table above shows are real differences (`ignore` text for a `.gitignore`, `families: false`, the worker body, tiers, `reviewed`). `setupTestRepo` stays as a short named preset over it, with the body of the report-writing worker, so the 42 call sites do not change (rewriting them touches six files for a handful of lines). Delete the second repository builder, its duplicated git commands and its duplicated config literal. If applying the families to the preset changes no result of the six files, drop the `families` option and apply them always; the lead reports which.
4. Net size is stated honestly in the report: a1 adds lines (function and table signatures), it buys the function budget, not a smaller file; a3 is where the lines come back.

## Files

**Create:** none.

**Modify:** `src/workflow/case-projection.mjs`; `test/helpers/workflow-fixture-repo.mjs`; `test/helpers/workflow-runner-fixture.mjs` (builder body replaced by the preset; the other exports `memberSeats`, `useDistinctFamilies`, `waitForLedgerEvent`, `advanceParams`, `holdAdvance*` untouched).

**Delete:** the second repository builder body inside `setupTestRepo` (about 50 lines). Nothing else.

**Tests to retire:** none. `case-projection.test.mjs` is the owner of every fold and is the guard, edited by phase 17 only (append); this phase does not edit it.

**Do not touch:** `case-runtime.mjs` (phase 17), `case-close.mjs` (phase 18), `case-verbs.mjs` (phase 19), the six runner test files and the ten fixture callers (call sites unchanged).

## Steps

1. Record the red scans first: the function-length scan (`projectCase` 181) and `rg -c "execFileSync\('git', \['init'" test/helpers` (two builders). Run `case-projection.test.mjs` and the six runner files once for a green baseline with timings.
2. a1: add the fold table and context; move each `case` body whole, in the same order; keep the derivations' order (a blocked milestone is decided before the stale check). Function-length scan again.
3. a3: extend `setupWorkflowFixtureRepo`; make `setupTestRepo` the preset; delete the duplicate. Run all consumers (the six runner files and the ten fixture callers).
4. Report: Δ lines per language next to the estimate, scan before/after, the consumer files' test time before/after.

## Validation (focused, FR)

- `test/workflow/case-projection.test.mjs test/workflow/case-runtime.test.mjs test/workflow/case-admission-port.test.mjs test/workflow/case-bindings.test.mjs test/workflow/stale-approval-reapproval.test.mjs test/workflow/playbook-proposer.test.mjs test/workflow/case-verbs.test.mjs`
- the six `setupTestRepo` files, all under `test/workflow/`: `workflow-runner-flow`, `workflow-runner-lock-status`, `workflow-runner-resume`, `workflow-runner-worktrees`, `workflow-runner-cli`, `workflow-runner-seats` (`.test.mjs`)
- the `setupWorkflowFixtureRepo` callers not already above: `test/workflow/workflow-store-ledger.test.mjs`, `test/workflow/conductor-case.test.mjs`, `test/workflow/confined-nested-write.test.mjs`, `test/cli/fgos-workflow-propose.test.mjs`, `test/git/e2e-consumer-noncoding.test.mjs`, `test/runner/dispatch/worker-env-case-context.test.mjs`, and `test/workflow/playbook-observable-order.test.mjs` (through its helper)
- Function-length scan: `projectCase` at most 120, no helper over 80, nothing else in `src/workflow` crosses 120.

## Risks

| Risk | L x I | Mitigation |
|---|---|---|
| A fold moved out of its order changes a milestone (the receipt merge in `achieve` depends on prior state; `gate.answer` reads `legacy`) | M x H | Same order, same context object; `case-projection.test.mjs` has the either-order receipt case (`:185`); run the seven focused files, not only one |
| Applying the families or the `.gitignore` to the other fixture changes routing or dirtiness in tests (an untracked `echo-worker.mjs` vs an ignored one; four executors vs one) | M x M | Options keep each preset's current shape; the lead drops an option only after the consumer files are green without it |
| Fixture change slows or flakes a test file | L x M | Timings before/after in the report; no new spawn |

## Rollback

Revert the commit. No data, no on-disk format.

## Done when

`projectCase` at most 120 lines by the scan; one repository builder in `test/helpers`; the 16 fixture consumer files and the projection files green; report with honest sizes.

## Net size (honest)

Node about +25: the fold table, the context object and four helpers add signatures and comments to bodies that move unchanged; the cut buys the function budget (181 -> at most 120), not a smaller file. Tests about -40: the builder body (about 50 lines) becomes a preset (about 10); the closing report's "about 90" (idea 9: touches six test files) presumes the 42 call sites change too; the lines that call sites would save are few, so this phase keeps the preset name. Phase total is **not** a reduction in Node.

## Dependencies

None (T6 as closed). Parallel with 17, 18, 19, 20. Land in any order; whichever of 16 and 17 lands second reruns `case-projection.test.mjs` and `case-runtime.test.mjs` because 17 depends on the fold letting a later settle stand.
