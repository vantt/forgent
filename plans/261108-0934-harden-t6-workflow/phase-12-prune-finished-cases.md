---
phase: 12
title: "Prune finished cases: fgos workflow prune --older-than <N>d (dry run by default, --apply deletes) and pruning when a case closes, never removing what an open case, a binding, a lock, a resumable run or a standing approval still needs, never following a link"
status: pending
depends_on: [04, 05, "11 landed before the wiring step"]
parallel: "wave 3, with 10 and 11 (code); wiring step after 11"
effort: ~1.5d
net_size: "Node +130 / Rust 0 / tests +90 (estimate; counted apart from the Case ledger budget)"
---

# Phase 12 — Prune finished cases (Q5 b = A1 = `p-tslryr3buq` = D2)

## Context

Owner decision 71 (5b): "addition A1 approved: `fgos workflow prune --older-than <N>d` (dry run by default, `--apply` deletes) plus automatic pruning at case close for cases ended more than N days ago, with the safety rules of A1". A1 (arbitration §4): "remove only a terminal case's ledger and its Unit runs older than N days; never a Unit run an open case names (`unit.started`, `unit.complete`, `reservation`, `settle`, a `unit-run:` ref), one whose custody, attempt or `advance` lock is held, one that is resumable (unsettled `unit.json`), or a report an approval digest still stands behind; a ledger only with or after its Unit runs". Q5 scope: "one verb in the `workflow` branch and code in `src/workflow`, one CHANGELOG line; no change to `~/.fgos/config.json` schema (N is a flag)". Option text: default 14 days. Nothing else is added (RT-23: no time budget, no `partial` result, no new field on the close result).

Prior art: none (plan fact 12). Measured at arbitration on fg-server2: `.fgos/assignments` 1 405 MB in 529 dirs (31 MB per unit run, mostly worker outbox); `.fgos/workflow-runs` 435 MB in 54 runs; 1 312 MB and 356 MB older than 7 days.

Reused doors: the one reader and the path leaf (P03); `assignmentDir` (`src/runner/dispatch/assignment-layout.mjs:48`: refuses absolute and `..` ids, checks containment); `tryAcquireAdvanceLock` (`case-lock.mjs:58`); custody holder (`dispatchCwdHolder`, `src/run-supervisor/cwd-lock.mjs`); attempt liveness as `sweepAttempts` reads it (`src/runner/execution/run.mjs:268`, lead names the reader); unit record settledness (`src/runner/execution/unit-state.mjs`, lead names the function); `listBindingRecords` (`case-bindings.mjs:169`); `closeCaseUnderHold` (`case-close.mjs:29`), through which both the close verb and the Playbook proposer close a case (`runner.mjs:145`).

## Requirements

1. **Home.** `case-close.mjs` (closing and retiring a case; no new file): `pruneFinishedCases({ mainRoot, olderThanMs, apply })` returns `{ cases, unitRuns, kept: [{ id, reason }], bytes }`.
2. **Terminal.** A case is prunable when its ledger folds cleanly and has `case.closed`, or, for a ledger with no case events at all, its run folded `completed`; and its end time (that closing event's time) is older than N days. A failed run without `case.closed` is kept (Q4 may reopen it). Everything else is kept with a reason.
3. **Protection set (RT-3, RT-14, RT-19)**, computed from every ledger not being pruned plus live state, before any delete: every Unit run, report and case named by such a ledger (`unit.started`, `unit.complete`, `reservation`, `settle`, `unit-run:` refs, inherit sources on `case.opened`, approval digests); every case named by a binding record (`listBindingRecords`; reason `binding-held`); every Unit run whose custody or attempt lock is held; every Unit run with an unsettled `unit.json`.
4. **What a Unit run id may delete (RT-14).** Every id read from a ledger resolves through `assignmentDir`; an entry that is a symbolic link, or whose `lstat`/`realpath` differs from its lexical path, is kept (`link`); a Unit run directory is deleted only when its own `unit.json` names this case; deletion never follows a link.
5. **Per case, under its hold (RT-1, RT-20).** For each prunable case: `tryAcquireAdvanceLock` (held → keep, `advance-held`); re-check requirement 3 for that case and its Unit runs under the hold; delete its Unit runs, then its ledger directory last; release the hold tolerating a missing directory. A failure mid-way leaves the ledger (a retry finds the rest). Never inside another case's hold.
6. **Verb.** `fgos workflow prune [--older-than <N>d] [--apply] [--json]`: default 14 days; the dry run lists what would go and why the rest is kept; `--apply` deletes. Unit runs that no case names (plain `fgos run`) are not touched (A1 "remove only"; lead question Q-3).
7. **When a case closes.** After the closing hold is released, the verb that closed the case runs `pruneFinishedCases({ olderThanMs: 14 days, apply: true })`, best effort: an error or a held lock never fails or changes the close. The close paths are the `close` verb and a foreground advance whose run the Playbook proposer closed (the detached child is itself `resume --foreground`); both are in `case-verbs.mjs`.
8. **Cost.** Measured on a copy of fg-server2's trees; reported in the phase report and the guide. If a post-close prune is slower than about 1 s with today's 54 runs, the lead reports it to the big lead (a decision question, not a code change here).

## Files

**Create:** `test/workflow/case-close.test.mjs` (owning proof of prune; `case-close.mjs` has no test file).

**Modify:** `src/workflow/case-close.mjs`; wiring step (after P11 lands): `src/workflow/case-verbs.mjs` (post-close call), `bin/fgos.mjs` workflow arm (`prune` subcommand), `src/cli/command-registry.mjs` (the `invoke` string `:2385` gains `prune`; a `subcommands.prune` entry with examples), `test/cli/fgos-workflow.test.mjs` (one wiring case), `test/cli/subcommand-flag-drift.test.mjs` if it lists subcommands, `CHANGELOG.md`, census; spec lines written in P15.

**Delete:** nothing (new approved mechanism).

**Tests to retire:** none.

**Cross-lane one-liners:** none.

## Red tests first (each A1 rule and each red-team case)

In `case-close.test.mjs`, over real fixture directories (no mocks): a closed case older than N with its two Unit runs goes, Unit runs first; a closed case newer than N stays; an open case stays; a failed run without `case.closed` stays; a closed case whose Unit run an open case names keeps that Unit run; a closed case an open case inherits from stays; a closed case named by a binding record stays (`binding-held`); a Unit run with an unsettled `unit.json` stays; a Unit run whose custody is held stays; a case whose `advance` is held stays (`advance-held`); a symlinked Unit run directory stays and its target is untouched; a ledger naming a Unit run whose `unit.json` names another case does not delete it; a ledger whose `case.closed` time is old but which does not fold cleanly stays; dry run deletes nothing; two concurrent prunes delete each directory once and both finish; a failure after Unit runs leaves the ledger.

## Net size

Node about +130 (prune ≈ 105, verb wiring ≈ 12, post-close call ≈ 8, registry ≈ 5). Tests about +90.

## Steps

1. Red tests. 2. `pruneFinishedCases` with the protection set and per-case re-check. 3. Measure on a scratch copy under `/home/vantt/projects/forgent-worktrees/` (never `/tmp`); record the share of plain-`fgos run` Unit runs for Q-3. 4. After P11 lands: wiring step (verb, post-close call, registry). 5. CHANGELOG.

## Validation (focused)

- FR `test/workflow/case-close.test.mjs test/workflow/case-verbs.test.mjs test/cli/fgos-workflow.test.mjs test/cli/subcommand-flag-drift.test.mjs test/workflow/conductor-case.test.mjs test/workflow/case-bindings.test.mjs`
- On fg-server2 after landing: `fgos workflow prune --json` (dry run) reviewed by the big lead before the first `--apply`; bytes before/after in the guide.

## Risks

| Risk | L × I | Mitigation |
|---|---|---|
| Deleting something still needed (RT-3, RT-14, RT-19) | M × H | Protection set, per-case re-check under the hold, `unit.json` must name the case, no link followed; dry run default; red test per rule; first `--apply` after a reviewed dry run |
| Nested `advance` at close (RT-1) | M × H | After the closing hold is released; `tryAcquire` only |
| Concurrent prunes or an inherit racing a delete (RT-20) | M × M | Per-case hold; Unit runs first, ledger last; a vanished inherit source fails closed through the one reader |
| Other machines' first post-close prune removes much at once | M × L | Guide: run `fgos workflow prune --json` first and read it |

## Rollback

Revert; deleted directories are not restored (they were terminal and unreferenced); the guide says so before the first `--apply`.

## Done when

Red then green; measured; wiring landed after P11; on fg-server2 a reviewed dry run then `--apply` frees the old trees; guide section (Vietnamese) explains the dry run and `--apply`.

## Lead brief essentials

Only what A1 allows; dry run by default; never inside a held `advance`; never follow a link. All plan.md lead rules apply.
