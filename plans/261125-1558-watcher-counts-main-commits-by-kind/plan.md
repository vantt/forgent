---
contract: plan-v1
title: "The watcher counts the commits main takes by kind and raises an event when notes outrun code"
status: draft
priority: P1
blockedBy: []
footprint:
  - packages/observe/rust/src/query/model.rs
  - packages/observe/rust/src/query/exec.rs
  - packages/observe/rust/src/metrics_cli/query.rs
  - packages/observe/rust/tests/query_engine_test.rs
  - docs/platform/observe/spec.md
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
  - changelog.d/261128-1139-watcher-counts-main-commits-by-kind.md
  - plans/261125-1558-watcher-counts-main-commits-by-kind/
base: 23ce1f27da7f96b095c311500a7a0f8631e5aaa5
source:
  - plans/discussions/ds-asrjk5u7hv-watcher-counts-main-commits-by-kind/DISCUSSION.md
  - p-huydgzc2wv
created: 2026-11-25
---

# The watcher counts the commits main takes by kind and raises an event when notes outrun code

## Outcome

Every watcher tick reads the commits the trunk branch (main) took in the last two hours
straight from git and sorts each one by what it touched: code or config, plan status change,
backlog row, discussion round, wake or progress report, or plan note. When notes, reports and
discussion rounds together pass a configured share of one UTC clock hour's commits, or that
hour's total passes a configured rate, the watcher raises one `main-notes-outrun-code` event
for that hour. The event's reason names each kind and its count. The thresholds live in
`core/config-standard/watcher.yaml`. Nothing new is stored: the counts are a projection read
from git and worked out again on every tick (row p-huydgzc2wv, "Done when").

The event names kinds, not heads. A commit trailer that carries the head role is a later
improvement the row puts out of scope.

## Acceptance criteria

1. [core] `cargo test -p fgos-observe --test query_engine_test`: a `having` entry may be
   `{"any": [[...], ...]}`, and a group passes when every entry of at least one branch holds.
   This uses the same shape `where` already accepts. `docs/platform/observe/spec.md` states it.
2. [core] `cargo test -p fgos --lib observe_sources`: the `main-commits` source yields one
   `fgos.main.commit` record per first-parent commit of the trunk inside the window. Its
   `fgos.main.commit.kind` follows the kind order below, a merge commit is sorted by its
   first-parent diff, and a repository with no known trunk yields no records and no error.
3. [core] `cargo test -p fgos --lib rows_of`: a row template's `reason` fills `{<agg>}`
   placeholders from the row's aggregate values, and a row with a `bucket` uses the bucket
   start as the event instant.
4. [core] `cargo test -p fgos-supervision --test definitions`: `main-notes-outrun-code` has a
   fixture pair (one row for an hour over the share threshold with at least the minimum
   commits; none for a quiet hour or a small hour that is all notes), and one test proves the
   rate branch alone raises and an unset threshold key answers `config-unset`.
5. [core] `fgos release check --worktree <integrated worktree>` is green (phase 5).
6. [core] `npm run fgos:dev -- config standard` lists `watcher.mainCommits.noteShareMax`,
   `.perHourMax` and `.minForShare` with their defaults. `core/watcher/README.md` and
   `docs/platform/supervision/spec.md` describe the event, and
   `changelog.d/261128-1139-watcher-counts-main-commits-by-kind.md` carries one `- Added:` line.
7. [core] `npm run fgos:dev -- metrics query --def core/watcher/definitions/main-notes-outrun-code.query.json --json`,
   run in the integrated worktree against this repository's real main, answers rows or none
   without an error or `unmeasured`; the phase 4 result records the answer.

## Non-goals

- Naming the head that wrote a commit (that needs a commit trailer with the head role, a later row).
- Reducing the number of note commits (p-rjzck3f7mg) or gating lands on it (p-427ymxp33q).
- A new store, cache or event kind registry. The event takes the watcher's default action
  (`wake-supervisor`), and no `watcher.actions` entry is added. The definition file lands in
  `core/watcher/definitions/`, which `watcher.definitions` already lists as a directory, so
  that list is not edited.
- Changing what the keeper (plan `261122-0056-orchestration-skeleton`, done) built. The keeper
  can read this event as one "needs judgement" source without a change here.
- A sliding 60-minute window. The count is per UTC clock hour (see Decisions).

## Decisions taken in this plan

All of these are inside the approved mechanism (discussion ds-asrjk5u7hv, "Outcome: ... The
owner approved the mechanism"). None reopens the discussion.

- **Hour bucket, with the bucket start as the instant.** The event id is derived from
  `kind|subject|ts`. The definition uses `"window": "own"` with `since` `-2h`, so at any moment
  of hour H the hour H-1 is wholly inside the window and is judged once after it closes. Hour
  H-2 is only partly inside: its `min:ts` moves as the window slides, so an instant read from
  the aggregates could raise one breach twice under two ids. The bucket start does not move,
  so it gives one event per breached hour. The definition also keeps `min:ts` in its `agg`,
  because the definitions test requires every raised row to carry an aggregate instant.
- **One event for "share or rate".** `having` is AND-only today, and two definitions would
  raise two events for one breach. This plan extends `having` with the `any` group that `where`
  already has (`Filter::Any`, `packages/observe/rust/src/query/model.rs` about line 222). That
  is add-through on the Observe query door, not a new mechanism (L10).
- **Counts in the reason.** The watcher's row template is fixed text today
  (`apps/fgos/src/wiring/supervision.rs` `rows_from`). Filling `{<agg>}` placeholders from the
  row's aggregates is the smallest change that lets "the event name the kinds and the counts"
  without a new event field. No shipped reason contains `{` (checked by grep over
  `core/watcher`, `core/attention`, `core/questions`), so every existing event keeps its text.
- **Minimum commits for the share test (`minForShare`, default 6).** Without it, one note
  commit in a quiet hour is a 100% share and raises the event. This is a labeled assumption
  inside "a configured threshold". Defaults: `noteShareMax` 0.5, `perHourMax` 12. The
  2026-11-25 measurement (21 commits an hour, 88% notes) trips both.
- **Kind order (most durable first).** A commit that touched several kinds is counted once,
  under the first match:
  1. `code`: any path outside `plans/`.
  2. `plan-status`: a `plans/<dir>/plan.md` whose frontmatter `status` changed. The source
     reuses `plan_text::plan_fields`.
  3. `backlog`: `plans/backlog.md` or `plans/backlog/`.
  4. `discussion`: `plans/discussions/`.
  5. `report`: `plans/reports/`, `plans/handoffs/` or `plans/<dir>/reports/`.
  6. `plan-note`: anything else under `plans/`.

  The notes share is (`plan-note` + `report` + `discussion`) / total, as the row says. Backlog
  rows are counted and named but are not in the share.
- **Trunk from the Git door.** The source resolves the trunk with `resolve_trunk`
  (`packages/git/rust/src/inspect.rs`), the same call `land.rs` `target_branch` uses, and walks
  it with `walk_changes` (`first_parent: true`). It never hardcodes `main`.
- **Changelog as a fragment.** `changelog.d/` exists on main (plan
  `261126-2324-changelog-fragments-and-skill-surface-regeneration`, done), so the entry is one
  fragment and `CHANGELOG.md` is not edited.

## Prior art

`git log -S'fgos.main.commit'` and `-S'noteShare'` find nothing before the backlog row
(`611b48852`), so this plan reuses existing pieces and builds nothing that was already there:

- The `PlanHistorySource` pattern: it already walks git through `walk_changes` and
  `read_paths_at_many` with no store, in `apps/fgos/src/wiring/observe_sources/plan_history.rs`.
- Config-filled `params` and `having`, as `core/watcher/pace/watcher-overdue.query.json` uses them.
- `Filter::Any` in `packages/observe/rust/src/query/model.rs`.
- The watcher row-to-event mapping in `apps/fgos/src/wiring/supervision.rs` `rows_from`.
- The data-driven definition proof in `packages/supervision/rust/tests/definitions.rs`
  (fixture pair per shipped definition, `RAISED` list, config from `expected.json`).

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
| 1 | [An any group in a query having](phase-01-having-any-group.md) | - | packages/observe/rust/src/query/model.rs, packages/observe/rust/src/query/exec.rs, packages/observe/rust/src/metrics_cli/query.rs, packages/observe/rust/tests/query_engine_test.rs, docs/platform/observe/spec.md | 1 | ready |
| 2 | [A main-commits Observe source](phase-02-main-commits-source.md) | - | apps/fgos/src/wiring/observe_sources/main_commits.rs, apps/fgos/src/wiring/observe_sources/mod.rs, apps/fgos/src/wiring/observe_sources/tests/mod.rs, apps/fgos/src/wiring/metrics_sources.rs, apps/fgos/observe-kinds.json | 1 | ready |
| 3 | [Counts in the event reason and a bucket instant](phase-03-row-reason-and-bucket.md) | - | apps/fgos/src/wiring/supervision.rs | 1 | ready |
| 4 | [The definition, its thresholds and docs](phase-04-definition-config-docs.md) | 1, 2, 3 | core/watcher/definitions/main-notes-outrun-code.query.json, core/watcher/README.md, core/config-standard/watcher.yaml, core/config-schema/watcher.schema.yaml, packages/supervision/rust/tests/definitions.rs, packages/supervision/rust/tests/fixtures/definitions/main-notes-outrun-code/, docs/platform/supervision/spec.md, changelog.d/261128-1139-watcher-counts-main-commits-by-kind.md | 2 | ready |
| 5 | [Integration and full gate](phase-05-integration.md) | 4 | plans/261125-1558-watcher-counts-main-commits-by-kind/reports/ | 3 | ready |

The three phases in wave 1 own disjoint files. Phase 4 owns every hot file
(`core/watcher/README.md`, config standard and schema, the definitions test) alone, in wave 2.
`node scripts/plan-contract-check.mjs` judges overlap with other ready or running plans; the
contract treats it as a warning met at land.

Facts re-checked on main at `base` (2026-11-28): the blocker `261126-2318` and the formerly
overlapping plans `261122-0056` and `261125-2041` are `done`; `rows_of`/`rows_from` sit at about
lines 1541-1595 of `supervision.rs` with their unit test near line 4063; an Observe answer row
carries its bucket start as a row-level `bucket` field (`exec.rs` about line 599); the only
readers of `Query.having` outside `query/` are `metrics_cli/query.rs` (the `--having` flag and
its test), so phase 1 owns that file; `docs/platform/observe/spec.md` documents the `having`
grammar, so phase 1 owns it too. GitNexus is not present on this machine
(`fgos dispatch decide --for impact-analysis`: `tool.missing`), so the blast radius above is a
grep cross-check, not a graph answer.

Execution: phases 1 to 3 run as parallel cases, each in its own worktree. Phase 4 continues
on their merged tree. Each phase uses capability `code:implement`; phase 5 uses `code:test`.

## Unattended run

### Host steps

| step | argv | executor |
|---|---|---|
| full gate on the integrated tree | fgos release check --worktree <integrated worktree> | lead |

### Cleanup

Standing rule.

### Beyond the rule

None.

### Split

Smallest parallel pieces by file boundary (three independent wave-1 phases, then the
definition that needs all three); one release, no staged compatibility steps, because every
change is additive and the definition file alone switches the event on or off.

## Owner questions

None. The discussion has no open points, and every choice above is decided from evidence.

## Risks and rollback

- **The git walk costs time on each tick.** The walk is first-parent and covers two hours of
  the trunk only, a few dozen commits; `core/watcher/README.md` notes that a plan-history walk
  over all history takes 30-80 s, which this bounded walk avoids. Proof point: phase 2 times
  the source on this repository's main and records the time in its result. It must stay
  under 1 s.
- **Wake churn.** Each breached hour wakes the supervisor once, which is at most 24 a day by
  construction. If this proves noisy, set `watcher.actions.main-notes-outrun-code: notify` in
  project config, with no code change.
- **`having` grammar change.** A new variant of a hand-deserialized enum could misparse
  existing definitions. Phase 1 keeps every existing definition fixture green
  (`definition_test.rs`, `packages/supervision/rust/tests/definitions.rs`) and the
  `--having` flag test in `metrics_cli/query.rs`.
- **Reason placeholders touch every event.** Text with no `{` is unchanged and no shipped
  reason has one; phase 3's test covers a missing aggregate left as written.
- **Rollback:** revert the plan's commits. Removing the definition file alone switches the
  event off, because detection is the files.
