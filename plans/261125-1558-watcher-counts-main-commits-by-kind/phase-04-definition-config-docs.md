# Phase 4: The definition, its thresholds and docs

Capability: `code:implement`. This phase runs on the merged result of phases 1 to 3.

## Inputs

- `core/watcher/pace/watcher-overdue.query.json`: the `params` with `configKey` and the
  `having` shape.
- `core/watcher/definitions/plan-ready-waiting.query.json`: the `"window": "own"` shape.
- `core/watcher/README.md`, `core/config-standard/watcher.yaml`,
  `core/config-schema/watcher.schema.yaml`.
- `packages/supervision/rust/tests/definitions.rs` and
  `packages/supervision/rust/tests/fixtures/definitions/watcher-overdue/`: how a definition
  fixture with config params is proven.
- `docs/platform/supervision/spec.md`: the section that lists watcher events and definitions.
- The plan's "Decisions taken in this plan" section.

## Files this phase may write

- `core/watcher/definitions/main-notes-outrun-code.query.json` (new)
- `core/watcher/README.md`
- `core/config-standard/watcher.yaml`
- `core/config-schema/watcher.schema.yaml`
- `packages/supervision/rust/tests/definitions.rs`
- `packages/supervision/rust/tests/fixtures/definitions/main-notes-outrun-code/` (new)
- `docs/platform/supervision/spec.md`
- `CHANGELOG.md`

## Steps

1. Config: add `watcher.mainCommits` with these keys, each with an `@fgos:doc` line and a schema
   entry (`x-fgos-scope: both`):
   - `noteShareMax`: a number from 0 to 1, default 0.5;
   - `perHourMax`: an integer of at least 1, default 12;
   - `minForShare`: an integer of at least 1, default 6.
2. Definition `main-notes-outrun-code`:
   - `requires: ["fgos.main.commit"]`, `"window": "own"`, `since: "-2h"`;
   - `kind: ["fgos.main.commit"]`, `by: ["subject.id"]`, `bucket: "hour"`;
   - `agg`: `count`, `sum:fgos.main.commit.note`, and `sum:` of each kind measure;
   - `params` `share`, `rate` and `min` from the three config keys;
   - `having`: one `any` with two branches,
     `[count >= min, sum:fgos.main.commit.note > share × count]` and `[count > rate]`;
   - `row`: kind `main-notes-outrun-code`, nextCommand `git log --first-parent --since=2.hours`,
     and a reason that names every count, for example
     `"main took {count} commits this hour: {sum:fgos.main.commit.note} notes ({sum:fgos.main.commit.plan-note} plan notes, {sum:fgos.main.commit.report} reports, {sum:fgos.main.commit.discussion} discussion rounds), {sum:fgos.main.commit.backlog} backlog rows, {sum:fgos.main.commit.plan-status} plan status changes, {sum:fgos.main.commit.code} code or config"`.

   Do not add a `watcher.actions` entry. It takes `defaultAction`.
3. Fixture and test: add `fixtures/definitions/main-notes-outrun-code/` (records and expected
   output), following `watcher-overdue`. Cover these hours:
   - one hour over the share with at least the minimum commits: one row;
   - one hour over the rate with low share: one row;
   - one quiet hour: no row;
   - one hour of 2 note commits: no row, because it is under the minimum.

   Add a case for an unset key, which answers `config-unset: watcher.mainCommits.noteShareMax`.
   This fixture is the owning proof of the detection rule.
4. Docs:
   - Add a paragraph to `core/watcher/README.md` on the new definition: the clock-hour bucket as
     its instant, so one event per breached hour; the kind order; and the share's numerator.
     Update the "Row to event" table for reason placeholders and the bucket instant.
   - Add one settled-fact line to `docs/platform/supervision/spec.md` where watcher events are
     listed.
   - Add one line under `## [Unreleased]` in `CHANGELOG.md`.
5. Live check: run the definition against this repository's real main and record the answer in
   the phase result.

## Verify

```bash
cargo test -p fgos-supervision --test definitions main_notes_outrun_code
npm run fgos:dev -- metrics query --def core/watcher/definitions/main-notes-outrun-code.query.json --json
npm run fgos:dev -- config standard | grep -A4 mainCommits
```

Pass: the test is green; the live query answers rows, or none, without an error; and the three
keys are listed with their defaults.

## Rollback

Revert the phase commit. Deleting the definition file alone stops the event.
