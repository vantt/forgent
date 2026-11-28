# Phase 4: The definition, its thresholds and docs

Capability: `code:implement`. This phase runs on the merged result of phases 1 to 3.

## Inputs

- `core/watcher/pace/watcher-overdue.query.json`: the `params` with `configKey` and the
  `having` shape, including a `{agg, k}` operand whose `k` is `{"param": ...}`.
- `core/watcher/definitions/plan-ready-waiting.query.json`: the `"window": "own"` shape.
- `core/watcher/README.md` (the "Row to event" table and the per-definition paragraphs),
  `core/config-standard/watcher.yaml`, `core/config-schema/watcher.schema.yaml`.
  `watcher.definitions` already lists the directory `core/watcher/definitions`, so a new file
  there is picked up with no list change.
- `packages/supervision/rust/tests/definitions.rs`: the data-driven proof. Every name in
  `RAISED` needs a fixture pair; `each_definition_gives_exactly_one_row_on_its_matching_fixture_and_none_on_the_other`
  wants one row on `records.jsonl` and none on `nomatch.jsonl`, with an aggregate instant
  (`min:ts`, `max:end` or `max:ts`) and a subject on the row;
  `a_matching_fixture_run_again_over_an_overlapping_window_gives_the_same_subject_and_instant`
  needs `ts` and a `later` block in `expected.json` for an own-window definition. Upstream
  kinds are copied from `apps/fgos/observe-kinds.json`, so `fgos.main.commit` (phase 2) is
  declared in the test project with no change here.
- `packages/supervision/rust/tests/fixtures/definitions/watcher-overdue/` and
  `.../plan-ready-waiting/`: fixture pairs with `config` and with an own window.
- `docs/platform/supervision/spec.md`: section 1.2 and the watcher lines that list events.
- `changelog.d/README.md`: the fragment scheme.
- The plan's "Decisions taken in this plan" section.

## Files this phase may write

- `core/watcher/definitions/main-notes-outrun-code.query.json` (new)
- `core/watcher/README.md`
- `core/config-standard/watcher.yaml`
- `core/config-schema/watcher.schema.yaml`
- `packages/supervision/rust/tests/definitions.rs`
- `packages/supervision/rust/tests/fixtures/definitions/main-notes-outrun-code/` (new)
- `docs/platform/supervision/spec.md`
- `changelog.d/261128-1139-watcher-counts-main-commits-by-kind.md` (new)

## Steps

1. Config: add `watcher.mainCommits` with these keys, each with an `@fgos:doc` line and a schema
   entry (`x-fgos-scope: both`):
   - `noteShareMax`: a number from 0 to 1, default 0.5;
   - `perHourMax`: an integer of at least 1, default 12;
   - `minForShare`: an integer of at least 1, default 6.
2. Definition `main-notes-outrun-code`:
   - `requires: ["fgos.main.commit"]`, `"window": "own"`, `since: "-2h"`;
   - `kind: ["fgos.main.commit"]`, `by: ["subject.id"]`, `bucket: "hour"`;
   - `agg`: `count`, `min:ts` (the aggregate instant the definitions test requires; the watcher
     takes the bucket start first, phase 3), `sum:fgos.main.commit.note`, and `sum:` of each
     kind measure;
   - `params` `share`, `rate` and `min` from the three config keys;
   - `having`: one `any` with two branches,
     `[count >= min, sum:fgos.main.commit.note > share × count]` and `[count > rate]`;
   - `row`: kind `main-notes-outrun-code`, nextCommand `git log --first-parent --since=2.hours`,
     and a reason that names every count, for example
     `"main took {count} commits this hour: {sum:fgos.main.commit.note} notes ({sum:fgos.main.commit.plan-note} plan notes, {sum:fgos.main.commit.report} reports, {sum:fgos.main.commit.discussion} discussion rounds), {sum:fgos.main.commit.backlog} backlog rows, {sum:fgos.main.commit.plan-status} plan status changes, {sum:fgos.main.commit.code} code or config"`.

   Do not add a `watcher.actions` entry. It takes `defaultAction`.
3. Fixture pair and test:
   - Add `main-notes-outrun-code` to `RAISED`.
   - `fixtures/definitions/main-notes-outrun-code/records.jsonl`: one clock hour with at
     least `minForShare` commits and a note share over `noteShareMax` (one row).
   - `nomatch.jsonl`: a quiet hour (code commits under the rate) and a small hour of 2 note
     commits (under the minimum), both inside the window (no row).
   - `expected.json`: `now`, `since`, `config` with the three keys, `group`
     `{"subject.id": "branch:main"}`, `ts` (the hour's first record) and a `later` block whose
     window still holds that first record.
   - One new test, "a main-commits hour over the rate alone raises one row, and an unset
     threshold key is unmeasured": a records set over `perHourMax` with a low note share gives
     one row; the same set with one key unset answers
     `config-unset: watcher.mainCommits.<key>`. No existing test proves it:
     `the_failure_limits_come_from_config_and_a_count_at_the_limit_raises_nothing` covers one
     limit key per definition, not an OR of two thresholds.
4. Docs:
   - `core/watcher/README.md`: a paragraph on the new definition (the clock-hour bucket start
     as its instant, so one event per breached hour; the kind order; the share's numerator;
     the minimum). Update the "Row to event" table for reason placeholders and the bucket
     instant (phase 3).
   - `docs/platform/supervision/spec.md`: one settled-fact line where watcher events are
     listed.
   - `changelog.d/261128-1139-watcher-counts-main-commits-by-kind.md`: one `- Added:` bullet.
5. Live check: in this worktree, run the definition against this repository's real main and
   put the answer in the phase result summary.

## Verify

```bash
cargo test -p fgos-supervision --test definitions
npm run fgos:dev -- metrics query --def core/watcher/definitions/main-notes-outrun-code.query.json --json
npm run fgos:dev -- config standard | grep -A4 mainCommits
```

Pass: the tests are green; the live query answers rows, or none, without an error or
`unmeasured`; and the three keys are listed with their defaults.

## Rollback

Revert the phase commit. Deleting the definition file alone stops the event.
