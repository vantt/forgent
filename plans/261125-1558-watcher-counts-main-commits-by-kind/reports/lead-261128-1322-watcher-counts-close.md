# Close report: the watcher counts main's commits by kind

Lead: head:lead-forgent-261125-1558-watche-72614. Date: 2026-11-28.

## Outcome

Phases 1 to 4 are on main. The full gate on the integrated tree is green (ticket c-75110-1795850463555, tip 2dae89eddc: `npm test` exit 0, `cargo test --workspace` exit 0). Criterion 7 (the
live query on this repository's real main) is met: no error, no `unmeasured`, 6 commits matched.

## Landed

| phase | branch | main commit | notes |
|---|---|---|---|
| 3 | `watcher-counts-main-commits-by-kind/p03` | 3b70270ebf | reason placeholders and bucket instant |
| 2 | `.../p02` | 338642eeca | `main-commits` source; 370 ms on main over 2 h (debug build, 17 commits), under the 1 s bound |
| 1 | `.../p01b` | 034fac4be5 | `having` any group (re-applied from the reviewed patch of a run cut off by a provider limit) |
| 4 | `.../p04b` | 25ee06ba9c | definition, config keys, fixtures, docs, plus the review fixes below |
| 4 | `.../p04d` | 2dae89eddc | schema descriptions rendered to match the standard doc lines (full gate finding) |

## Acceptance criteria

| # | command | result |
|---|---|---|
| 1 | `cargo test -p fgos-observe --test query_engine_test` | met: 39 passed on p01, plus the snapped-window test added in phase 4; in the full gate |
| 2 | `cargo test -p fgos --bin fgos observe_sources` (the plan's `--lib` form is wrong: `fgos` is bin-only) | met: 22 passed; in the full gate |
| 3 | `cargo test -p fgos --bin fgos supervision::` (no test is named `rows_of`; the owning test is `a_definition_answer_maps_to_one_row_per_group_with_the_readme_precedence`) | met; in the full gate |
| 4 | `cargo test -p fgos-supervision --test definitions` | met: 12 passed; fixture pair and the rate-alone / config-unset test (plus a small all-notes hour) |
| 5 | `fgos release check --worktree <p05>` | met: green on tip 2dae89eddc (c-75110-1795850463555). Two earlier runs were red for reasons outside the code: c-57810 found the schema/standard doc-line mismatch (fixed in 2dae89eddc), c-68925 hung after ENOSPC during the disk-full incident, c-73499 hit the `Text file busy` flake (debt 5) |
| 6 | `config standard` lists `watcher.mainCommits.noteShareMax` 0.5, `.perHourMax` 12, `.minForShare` 6 | met: run with the built host binary against the p04b tree; README, supervision spec and the changelog fragment carry the event |
| 7 | `npm run fgos:dev -- metrics query --def core/watcher/definitions/main-notes-outrun-code.query.json --json` on real main | met: run unconfined by the supervisor from the p05 worktree at 2026-11-28T06:42Z ([criterion-7-metrics-query.json](criterion-7-metrics-query.json)): `ok`, no `unmeasured`, coverage matched 6 (the 6 first-parent commits of main in 05:00-06:00 UTC, matching `git log`), no rows (that hour did not breach) |

## Changes beyond the phase briefs (decided by the lead, inside the approved outcome)

- **The window is the last closed clock hour.** The plan's decision said hour H-1 is judged once
  after it closes, but `since -2h` also judged the leftover of hour H-2 and the open hour H, and
  a partial bucket can trip the share branch (a false breach under the fixed bucket id). Fix: a
  since/until bound may end in `@hour|@day|@week` and is floored with the existing
  `bucket_start` (`packages/observe/rust/src/query/exec.rs`); the definition reads
  `since -1h@hour`, `until @hour`. Placed in `exec.rs` (in the footprint) because the widen door
  to `query/time.rs` refused under confinement (`write-git-unavailable`).
- **Every record carries all six kind measures (0 or 1).** Without it, `sum:` over a kind absent
  from an hour is null and the reason kept `{sum:...}` literal.
- **`nextCommand` is an inline query** (`fgos metrics query --kind fgos.main.commit --since -1h@hour --until @hour --by fgos.main.commit.kind --agg count`): a test needs `fgos ` first, and the plan's repo-relative `--def` path does not exist in other projects.
- **`apps/fgos/observe-kinds.json` declares subject kind `branch`.** Phase 2's unit test called
  the source directly and missed that the registry refuses the undeclared subject kind.

## Review dispositions

- Phase 3: duplicated number rendering rejected (only hand-made JSON reaches it); `{count}` needs
  `count` in `agg` accepted (definition has it); extra placeholder tests deferred.
- Phase 2: deleted top-level paths deferred as debt (below); duplicated `open`/`inside` helpers
  deferred as debt; new-`plan.md` doc comment and ignored `truncated` deferred.
- Phase 1: missing `having any` round-trip case deferred (the shipped definition now uses it and
  the definition round-trip test reads every definition); the worker's "lazy aggregates" claim
  was wrong: aggregates were already per operand.
- Phase 4: the three findings above accepted and rechecked fixed by an independent reviewer.
  Recheck notes deferred as debt (below).

## Named debt (for the secretary to open as backlog rows)

1. `main-commits` misses a trunk commit that only touches top-level paths absent from the trunk
   tip (`walk_changes` refuses an all-paths walk, so the source passes the tip's top-level
   names). Fix: an "every path" option on `WalkChanges` in `packages/git`.
2. `open` and `inside` are duplicated between `observe_sources/main_commits.rs` and
   `plan_history.rs`; move both into `observe_sources/mod.rs`.
3. `until` is inclusive: six or more commits stamped exactly HH:00:00 with a high note share
   could raise the open hour early. An exclusive snapped `until` closes it.
4. The definition fixtures still carry the old sparse measures, so no definitions test reads
   the filled reason.
5. Outside this plan: `apps/fgos/tests/git_recover_confirm_dead.rs`
   `a_caller_under_an_agent_cli_cannot_confirm_a_writer_dead` failed once in the full gate with
   `ExecutableFileBusy` ("Text file busy", line 141), a write-then-exec race (gate ticket
   c-73499-1795849237133, tip 2dae89eddc). The test landed today (70138a9733); this plan does
   not touch it.

## Process notes

- gemini hit `provider-limit` on all three wave-1 units (deepseek fallback hit `output-limit`);
  every later unit ran on claude by soft preference.
- The runner never commits files dirty before a run (`excluded`, verdict `inconclusive`), and
  `--sync`, `--pattern` and `--verify` do not pass the request door; partial work was carried to
  a fresh worktree as a patch in the prompt.
- Worktrees left for the supervisor: `forgent-worktrees/261125-1558-watcher-counts-main-commits-by-kind-p01`
  (superseded; uncommitted copy of phase 1, delivered as p01b), `...-p04` (superseded; first
  phase 4 attempt, delivered in p04b), `...-p04b` (kept by the land: one uncommitted schema edit,
  delivered by p04d), `release-check-chk-c-57810-1795845125590` (the failed gate's checkout).
