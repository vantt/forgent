---
phase: 18
title: "Prune a whole case or none of its Unit runs: the keep reasons become one table the judge reads, and a case that must stay keeps every Unit run its ledger names"
status: pending
depends_on: ["01-15 on main (T6 as closed 2026-11-08)"]
parallel: "final wave, with 16, 17, 19 and 20 step 1 (disjoint files); carries a2 of the size pass"
effort: ~0.75d
net_size: "Node 0 (range -8..+8) / Rust 0 / tests +25"
---

# Phase 18 — Prune the whole case (owner decision 73 (c), and (a)'s keep-reason table; closing report ideas 1 and 4)

## Context

Owner decision 73 (c): "prune deletes a case's Unit runs only when the whole case goes, so a kept ledger never names a deleted run." Decision 73 (a): "the prune keep reasons as one table". Both are in `src/workflow/case-close.mjs`, so **a2 of the size pass is merged here** (phase 16 keeps a1 and a3): one writer for the file, and the table is where the rule is cleanest.

Today (`case-close.mjs`, re-read on `09beb6434`): `pruneFinishedCases` (`:236-292`) judges the Unit runs of a prunable case (`judgeCase`, `:210-225`), then **deletes every `doomed` run first** (`:266-269`) and only afterwards looks at `blocked` (`:276`): a case with one Unit run that must stay (unsettled, controller held, custody held, link, unsafe path, record missing) keeps its ledger (`unit-run-kept`) but has already lost its other runs, so the kept ledger names directories that are gone. The T6 smoke saw it on a real half-finished run (closing report, "Prune").

`judgeUnitRun` (`:186-208`) holds the eight keep reasons as a chain of `if` statements, each returning `{ keep, blocks }`: `link`, `unsafe-path`, `unit-record-missing`, `names-other-case` (`blocks: false`), `named-by-other-case` (`blocks: false`), `controller-held`, `custody-held`, `unsettled`. `blocks` says the case's ledger must stay too.

### What "whole case" means precisely

A **blocking** keep (`blocks: true`) pins the ledger, so after this phase it also pins every Unit run of that ledger. A **non-blocking** keep (`names-other-case`, `named-by-other-case`) leaves that one Unit run on disk while the ledger goes: nothing kept then names it (it is another case's, or another case names it), so no kept ledger dangles. Case-level keeps (`unreadable`, `not-finished`, `too-recent`, `binding-held`, `named-by-other-case` of a case, `advance-held`, `no-longer-prunable`) happen before any Unit run is judged and already delete nothing.

**One residual, stated, not closed:** a removal that fails midway (`delete-failed`, `:269`: a permission or I/O error after the first run is gone) still leaves the ledger naming the runs already removed. Deleting the ledger first would orphan runs instead (nothing would name them, and plain-run retention has no rule yet). The retry finds them `gone` (`judgeUnitRun`, `:195`) and finishes. The spec says so in one sentence. Existing trees pruned by the old rule keep their dangling names; no repair, no migration.

## Requirements

1. **Judge first, delete second.** `pruneFinishedCases` computes `doomed` and `blocked` for a case (as now) and, when `blocked`, deletes **no** Unit run of it. Each run that would have gone is listed in `kept` with the reason `case-kept` so a dry run and an `--apply` explain themselves and agree; `result.unitRuns` and `result.bytes` count only what really goes (or would go). A dry run reports the same.
2. **a2: one table.** The eight keep reasons are rows of one ordered table (`reason`, `blocks`, and the predicate that fires it) which the judge reads: first matching row keeps. Order is today's order and is behaviour (a run both unsettled and controlled reports `controller-held`). The path-level rows (`link`, `unsafe-path`) and the `gone` answer come first because they decide whether the directory may be read at all; the lead chooses whether they are rows or a resolver in front of the table, but the eight reasons are written once, in one place, with their `blocks` flag. Case-level keeps stay where they are (sets, not a per-run judge; a table would add a layer).
3. The per-case re-check under the hold, the stub cleanup, `treeBytes`, the link guard and the `unit.json`-must-name-this-case rule are unchanged.
4. The text of the rule is updated: spec RUL-WF-40 (Unit run goes only with a whole case; blocked case keeps all; the one residual), and the stale cross-reference at `docs/platform/workflow/spec.md:191` (it cites RUL-WF-39, the pin rule; the prune rule is RUL-WF-40). CHANGELOG: one line. Guide: a section in `plans/reports/guide-261108-1230-owner-machine-harden-t6-workflow.md` (Vietnamese) saying what changed against the P12 section (a half-finished case now keeps all its Unit runs; space frees later).
5. No new option, field or verb. The only new word in the output is the `kept` reason `case-kept`.

## Files

**Create:** none.

**Modify:** `src/workflow/case-close.mjs` (`judgeUnitRun`, `judgeCase`, the deletion loop of `pruneFinishedCases`); `test/workflow/case-close.test.mjs` (owner of prune); `CHANGELOG.md`; `plans/reports/guide-261108-1230-owner-machine-harden-t6-workflow.md` (new section, append-only; other final-wave phases append their own; rebase, never serialize).

**Delete:** the `blocked ||` tail of the post-deletion check and the per-run deletion of a blocked case; nothing else.

**Tests to retire:** none. `case-close.test.mjs:233` ("a Unit run that cannot be removed leaves the ledger to name what is still there") keeps every assertion (it is the residual's proof); it gains a retry that finishes the prune.

**Spec lines (written at wave close, Vietnamese):** RUL-WF-40 (`docs/platform/workflow/spec.md:349`): replace "theo thứ tự Unit run trước, ledger sau" with "Unit run chỉ bị xoá khi cả case đi; một Unit run phải giữ (chưa settle, controller hoặc custody đang giữ, link, đường dẫn không an toàn, thiếu bản ghi) thì không Unit run nào của case bị xoá và ledger ở lại nguyên; ngoại lệ duy nhất là lỗi xoá giữa chừng, lần dọn sau làm nốt"; `:191`: `RUL-WF-39` becomes `RUL-WF-40`.

**Do not touch:** `case-verbs.mjs` (the post-close call and the verb are unchanged), `bin/fgos.mjs`, `command-registry.mjs`, `case-projection.mjs` (phase 16), `case-runtime.mjs` (phase 17).

## Red tests first

In `case-close.test.mjs`, over real directories (no mocks), extending the existing owners:

- Extend "a Unit run that is unsettled, controlled or in custody stays and keeps its ledger" (`:136`): the `unsettled` case also names a settled sibling run; assert the sibling's directory still exists, `result.unitRuns` is empty, the sibling is in `kept` as `case-kept`, and the case as `unit-run-kept`. Today the sibling is deleted: red.
- Same test: make one run both unsettled and controlled and assert `controller-held` (order of the table).
- A dry run of the same tree reports the same `kept` and an empty `unitRuns` (today it lists the sibling as going).
- The invariant, once: after every `prune` call the helper in the test file checks that no ledger left on disk names a Unit run directory that is missing, except in the failed-removal test, which asserts the residual instead and then finishes the prune on a retry. The helper reads each remaining ledger with `readWorkflowEvents` and the ids named by `settle` events (the fixture's shape).
- Table guard: a `names-other-case` run in a whole-case prune is left on disk while the ledger and the case's other runs go (non-blocking row), unchanged behaviour.

## Steps

1. Red tests committed failing (the sibling and dry-run cases; the invariant helper fails on the old order).
2. Move the `blocked` decision before the deletion loop; add `case-kept`.
3. Put the eight reasons in one table; the judge reads it; the red scan: `rg -n "keep: '" src/workflow/case-close.mjs` shows the reasons once, in the table.
4. Spec lines, CHANGELOG, guide section (the last two in the landing commit; spec at wave close).

## Validation (focused, FR)

`test/workflow/case-close.test.mjs test/cli/fgos-workflow.test.mjs test/workflow/case-verbs.test.mjs test/workflow/conductor-case.test.mjs test/workflow/case-bindings.test.mjs test/cli/subcommand-flag-drift.test.mjs`. On fg-server2 after landing: `fgos workflow prune --json` (dry run) on the main checkout; the lead reads that no case in `cases` has a Unit run in `kept` with `unit-run-kept` for the same case; `--apply` only on the coordinator's go.

## Risks

| Risk | L x I | Mitigation |
|---|---|---|
| Reordering the check deletes more, or less, than intended (a blocked case still loses runs, or an unblocked one keeps them) | M x H | Red sibling case, dry-run equality, the invariant helper on every prune call; the existing fifteen cases (`:47-275`) stay green |
| Table order differs from the chain's order and a reason changes | M x M | Same order; the controlled-and-unsettled case asserts it; the existing three-reason test asserts each |
| Space is freed later than before (a half-finished case's settled runs now wait for the whole case) | H x L | The owner chose it (decision 73 (c)); the guide says so; a case that finishes later is pruned whole by the next close or `prune` |
| The `names-other-case` / `named-by-other-case` non-blocking rows read as "case stays" | L x M | Requirement 1 and the table's `blocks` column; one test |

## Rollback

Revert the commit. Nothing deleted by prune is restored (as before); the first `--apply` after landing follows a reviewed dry run.

## Done when

Red then green; the keep reasons appear once; a blocked case keeps every Unit run in dry run and in `--apply`; RUL-WF-40 and the `:191` reference corrected at wave close; guide section and CHANGELOG line landed.

## Net size (honest)

Node about 0 (range -8..+8): the table is about as long as the chain it replaces (eight rows plus a three-line reader against 24 lines of `if`s); moving the `blocked` test before the loop removes the `blocked || failed` tail and adds the `case-kept` listing. The closing report's idea 4 expected a smaller judge: it will be smaller, the file will not. Tests about +25 (sibling, order, dry-run equality, the invariant helper at about 10 lines, the retry in the residual test). No claim of a cut in `case-close.mjs` is made; it stays near 290 lines.

## Dependencies

None. Parallel with 16, 17, 19, 20. This phase owns `case-close.mjs` and `case-close.test.mjs` for the wave; no other final-wave phase edits them.
