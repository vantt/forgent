---
contract: plan-v1
title: "The watcher counts the commits main takes by kind and raises an event when notes outrun code"
status: draft
priority: P1
blockedBy:
  - 261126-2318-plan-footprint-overlap-warns
footprint:
  - packages/observe/rust/src/query/model.rs
  - packages/observe/rust/src/query/exec.rs
  - packages/observe/rust/tests/query_engine_test.rs
  - apps/fgos/src/wiring/observe_sources/main_commits.rs
  - apps/fgos/src/wiring/observe_sources/mod.rs
  - apps/fgos/src/wiring/observe_sources/tests/mod.rs
  - apps/fgos/src/wiring/metrics_sources.rs
  - apps/fgos/observe-kinds.json
  - apps/fgos/src/wiring/supervision.rs
  - core/watcher/README.md
  - core/watcher/definitions/main-notes-outrun-code.query.json
  - core/config-standard/watcher.yaml
  - core/config-schema/watcher.schema.yaml
  - packages/supervision/rust/tests/definitions.rs
  - packages/supervision/rust/tests/fixtures/definitions/main-notes-outrun-code/
  - docs/platform/supervision/spec.md
  - CHANGELOG.md
  - plans/261125-1558-watcher-counts-main-commits-by-kind/
base: d7dcc2ed220a7ede21548b71cc4df4d49e472d12
source:
  - plans/discussions/ds-asrjk5u7hv-watcher-counts-main-commits-by-kind/DISCUSSION.md
  - p-huydgzc2wv
created: 2026-11-25
---

# The watcher counts the commits main takes by kind and raises an event when notes outrun code

## Outcome

Every watcher tick reads the commits the trunk branch (main) took in the current UTC hour
straight from git and sorts each one by what it touched: code or config, plan status change,
backlog row, discussion round, wake or progress report, or plan note. When notes, reports and
discussion rounds together pass a configured share of the hour's commits, or the hour's total
passes a configured rate, the watcher raises one `main-notes-outrun-code` event for that hour.
The event's reason names each kind and its count. The thresholds live in
`core/config-standard/watcher.yaml`. Nothing new is stored: the counts are a projection read
from git and worked out again on every tick (row p-huydgzc2wv, "Done when").

The event names kinds, not heads. A commit trailer that carries the head role is a later
improvement the row puts out of scope.

## Acceptance criteria

1. `cargo test -p fgos-observe --test query_engine_test`: a `having` entry may be
   `{"any": [[...], ...]}`, and a group passes when every entry of at least one branch holds.
   This uses the same shape `where` already accepts.
2. `cargo test -p fgos --lib observe_sources`: the `main-commits` source yields one
   `fgos.main.commit` record per first-parent commit of the trunk inside the window. Its
   `fgos.main.commit.kind` follows the order in phase 2, a merge commit is sorted by its
   first-parent diff, and a repository with no known trunk yields no records and no error.
3. `cargo test -p fgos --lib rows_of`: a row template's `reason` fills `{<agg>}` placeholders
   from the row's aggregate values, and a group with a `bucket` uses the bucket start as the
   event instant.
4. `cargo test -p fgos-supervision --test definitions main_notes_outrun_code`: the fixture
   raises one row for an hour over the share threshold (with at least the minimum commits)
   or over the rate. It raises none for a quiet hour or for a small hour that is all notes,
   and it answers `config-unset` when a threshold key is missing.
5. `npm test` and `cargo test --workspace` are green on the merged tree (phase 5).
6. `fgos config standard` lists `watcher.mainCommits.noteShareMax`, `.perHourMax` and
   `.minForShare` with their defaults. `core/watcher/README.md` and
   `docs/platform/supervision/spec.md` describe the event. `CHANGELOG.md` `## [Unreleased]`
   has one line for it.

## Non-goals

- Naming the head that wrote a commit (that needs a commit trailer with the head role, a later row).
- Reducing the number of note commits (p-rjzck3f7mg) or gating lands on it (p-427ymxp33q).
- A new store, cache or event kind registry. The event takes the watcher's default action
  (`wake-supervisor`), and no `watcher.actions` entry is added.
- Changing anything the keeper plan `261122-0056-orchestration-skeleton` builds. Its footprint is
  no longer disjoint from this plan's (see "Why `draft`" under Phases), but this plan edits only
  the lines named in its phases; the keeper can read this event as one "needs judgement" source.
- A sliding 60-minute window. The count is per UTC clock hour (see Decisions).

## Decisions taken in this plan

All of these are inside the approved mechanism. None reopens the discussion.

- **Hour bucket, not a sliding hour.** The event id is derived from `kind|subject|ts`. A
  sliding window moves `min:ts` or `max:ts` on every new commit, so it would raise again many
  times an hour. Grouping by `bucket: hour` makes the bucket start the instant, which gives one
  event per breached hour. The definition uses `"window": "own"` with `since` `-2h`, so the
  previous full hour is also judged once after it closes.
- **One event for "share or rate".** `having` is AND-only today, and two definitions would
  raise two events for one breach. This plan extends `having` with the `any` group that `where`
  already has (`Filter::Any`). That is add-through on the Observe query door, not a new
  mechanism (L10).
- **Counts in the reason.** The watcher's row template is fixed text today. Filling
  `{<agg>}` placeholders from the row's aggregates is the smallest change that lets "the event
  name the kinds and the counts" without a new event field.
- **Minimum commits for the share test (`minForShare`, default 6).** Without it, one note
  commit in a quiet hour is a 100% share and raises the event. This is a labeled assumption
  inside "a configured threshold". Defaults: `noteShareMax` 0.5, `perHourMax` 12. The
  2026-11-25 measurement (21 commits an hour, 88% notes) trips both.
- **Kind order (most durable first).** A commit that touched several kinds is counted once,
  under the first match:
  1. `code`: any path outside `plans/`.
  2. `plan-status`: a `plans/<dir>/plan.md` whose contract `status` changed. The source
     reuses `plan_text::plan_fields`.
  3. `backlog`: `plans/backlog.md` or `plans/backlog/`.
  4. `discussion`: `plans/discussions/`.
  5. `report`: `plans/reports/`, `plans/handoffs/` or `plans/<dir>/reports/`.
  6. `plan-note`: anything else under `plans/`.

  The notes share is (`plan-note` + `report` + `discussion`) / total, as the row says. Backlog
  rows are counted and named but are not in the share.
- **Trunk from the Git door.** The source resolves the trunk with `resolve_trunk`, the same
  call `land.rs` `target_branch` uses, and walks it with `walk_changes` (`first_parent: true`).
  It never hardcodes `main`.

## Prior art

`git log -S'fgos.main.commit'` and `-S'noteShare'` find nothing before the backlog row
(`611b48852`), so this plan reuses existing pieces and builds nothing that was already there:

- The `PlanHistorySource` pattern: it already walks git through `walk_changes` with no store,
  in `apps/fgos/src/wiring/observe_sources/plan_history.rs`.
- Config-filled `params` and `having`, as `core/watcher/pace/watcher-overdue.query.json` uses them.
- `Filter::Any` in `packages/observe/rust/src/query/model.rs`.
- The watcher row-to-event mapping in `apps/fgos/src/wiring/supervision.rs` `rows_from`.

Three things were missing: an OR across group filters, agg values in the reason, and a bucket
as the event instant.

## Authority map

| New thing | Model row | Note |
|---|---|---|
| `main-commits` Observe source and kind `fgos.main.commit` (git projection) | observe | a source in the host's `observe_sources`, beside `plan-history`; reads git only through the `git` component's doors (`resolve_trunk`, `walk_changes`, `read_paths_at_many`) |
| `any` group in a query `having` | observe | extends the query door; same shape as `Filter::Any` in `where` |
| Reason placeholders and bucket instant in the watcher's row-to-event mapping | supervision | extends `rows_from`; the row rules are documented in `core/watcher/README.md` |
| Definition `main-notes-outrun-code` | supervision | a file under `core/watcher/definitions/`; detection is these files |
| Keys `watcher.mainCommits.*` | config | registered only in `core/config-standard` + `core/config-schema` |

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [An any group in a query having](phase-01-having-any-group.md) | - | packages/observe/rust/src/query/model.rs, packages/observe/rust/src/query/exec.rs, packages/observe/rust/tests/query_engine_test.rs | 1 | ready |
| 2 | [A main-commits Observe source](phase-02-main-commits-source.md) | - | apps/fgos/src/wiring/observe_sources/main_commits.rs, apps/fgos/src/wiring/observe_sources/mod.rs, apps/fgos/src/wiring/observe_sources/tests/mod.rs, apps/fgos/src/wiring/metrics_sources.rs, apps/fgos/observe-kinds.json | 1 | ready |
| 3 | [Counts in the event reason and a bucket instant](phase-03-row-reason-and-bucket.md) | - | apps/fgos/src/wiring/supervision.rs | 1 | ready |
| 4 | [The definition, its thresholds and docs](phase-04-definition-config-docs.md) | 1, 2, 3 | core/watcher/definitions/main-notes-outrun-code.query.json, core/watcher/README.md, core/config-standard/watcher.yaml, core/config-schema/watcher.schema.yaml, packages/supervision/rust/tests/definitions.rs, packages/supervision/rust/tests/fixtures/definitions/main-notes-outrun-code/, docs/platform/supervision/spec.md, CHANGELOG.md | 2 | ready |
| 5 | [Integration and full gate](phase-05-integration.md) | 4 | plans/261125-1558-watcher-counts-main-commits-by-kind/reports/ | 3 | ready |

The three phases in wave 1 own disjoint files. Phase 4 owns every hot file (`CHANGELOG.md`,
`core/watcher/README.md`, config standard and schema) alone, in wave 2. Of the running or ready
plans, only the program board, git component, yaml slice C, harden gate door, doctor readiness,
rust verb migration, the 2108 deletion and the heads-operate plans list `CHANGELOG.md`. This plan
adds one line under `## [Unreleased]`. `node scripts/plan-contract-check.mjs` judges that
overlap.

Why `draft`: on 2026-11-26 `base` was reset to main and every fact above re-checked there (the
files and doors still exist; `rows_of`/`rows_from` moved to about lines 1405-1460 of
`supervision.rs`). The contract check refuses `ready` for footprint overlap with two running
plans: `261122-0056-orchestration-skeleton` holds `apps/fgos/src/wiring/supervision.rs`,
`core/config-standard/watcher.yaml`, `core/config-schema/watcher.schema.yaml`,
`packages/supervision/rust/tests/definitions.rs` and `docs/platform/supervision/spec.md`, and
`261125-2041-gather-fgos-rules-to-one-owner` holds `CHANGELOG.md`. The plan waits on
`261126-2318-plan-footprint-overlap-warns`, which turns that overlap into a warning. When 2318 is
`done` (or both running plans are), rerun `node scripts/plan-contract-check.mjs --plan
plans/261125-1558-watcher-counts-main-commits-by-kind` and land `plan.md` with `status: ready`;
no new decision is needed. If `changelog.d/` (plan `261126-2324`) is on main by then, phase 4's
changelog line becomes a `changelog.d` fragment and `CHANGELOG.md` leaves the footprint.

Execution: phases 1 to 3 run as parallel cases, each in its own worktree. Phase 4 continues
on their merged tree. Each phase uses capability `code:implement`; phase 5 uses `code:test`.

## Owner questions

None. The discussion has no open points, and every choice above is decided from evidence.

## Risks and rollback

- **The git walk costs time on each tick.** The walk is first-parent and covers two hours of
  the trunk only, a few dozen commits. `plan-history` walks all of history. Proof point:
  phase 2 times the source on this repo's main and records the time in its report. It must
  stay under 1 s.
- **Wake churn.** Each breached hour wakes the supervisor once, which is at most 24 a day by
  construction. If this proves noisy, set `watcher.actions.main-notes-outrun-code: notify` in
  project config, with no code change.
- **`having` grammar change.** A new variant of an untagged serde enum could misparse existing
  definitions. Phase 1 keeps every existing definition fixture green (`definition_test.rs`,
  `packages/supervision/rust/tests/definitions.rs`).
- **Rollback:** revert the plan's commits. Removing the definition file alone switches the
  event off, because detection is the files.
