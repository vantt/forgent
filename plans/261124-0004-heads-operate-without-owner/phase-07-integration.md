# Phase 7: Integration, full suite and live probe

Capability: `code:test`.

## Inputs

- Every earlier phase's branch and its report.
- `test/live/head-grant-probe.live.mjs` as phase 2 left it.

## Footprint

`CHANGELOG.md`, `plans/261124-0004-heads-operate-without-owner/reports/head-grant-probe.md`,
`plans/261124-0004-heads-operate-without-owner/reports/integration.md`.

## Steps

1. On the integrated tree run `npm test` and `cargo test --workspace`; fix regressions in the owning phase's files
   through that phase's lead, never by weakening a test.
2. Add the user-visible lines under `## [Unreleased]` in `CHANGELOG.md`: the window and `can-i`, the permission table,
   the help channel and Miu's takeover, mail from leads and planners to the two hands, the release
   rule and `release.*` keys.
3. Before the owner activates the new release, run the live probe once in a confined supervisor and secretary on the
   old release and write it as the before table in `reports/head-grant-probe.md`.
4. After the plan lands, the owner builds and activates the release by hand the first time (PC-D9). Then run the live
   probe inside a confined supervisor, secretary, planner, shaper and lead, and add rows for: a planner and a shaper
   raising `coordination-help`; a lead mailing the supervisor (allowed) and another lead (refused); `can-i` for an
   allow, an ask and a deny argv. Write the after table beside the before table in `reports/head-grant-probe.md`.
5. Run `release run` once from the supervisor on a later landed change and record its report line.
6. In `reports/integration.md`, list the backlog rows this plan closes (`p-g5ktat4kej`, `p-dw3h5wscns`) and the
   part of `p-v6xinnjoxh` left to plan 0056's keeper; the supervisor updates the backlog.

## Verify

```bash
npm test
cargo test --workspace
node test/live/head-grant-probe.live.mjs
```

Pass: both suites green; the probe shows no `failed` row in any of the five personas, and every row changed by this
plan matches its expected outcome.

## Rollback

Revert the CHANGELOG lines; the reports stay as history.

## Owner answers

- `q-xcuwpxa4kn` (owner via the secretary, 2026-11-25 19:57): **widen the footprint by the 5 files.** Seven of the eight
  `cargo test --workspace` failures on release `33f462be` are this plan's stale tests and records
  (`plans/reports/supervisor-261125-1838-npm-test-24-failures-on-main.md`). The plan footprint gains exactly
  `apps/fgos/tests/supervision_verbs.rs`, `apps/fgos/tests/questions_head.rs`,
  `packages/config/contracts/fixtures/authoring-source.config.json`,
  `packages/component-authority/model/contracts.yaml` and `test/rust-host/vectors/envelope/version.json`. A planner
  makes that footprint edit, because the lead's `land --paths` may not change `footprint`. Then one fix unit in a
  phase-7 worktree changes those 5 files plus `core/config-standard/release.yaml`. The tests assert the fgos argv
  frame, the negative control uses a table deny, the vector is regenerated with `generate-vectors.mjs`, the fixture and
  the authority row are added, and the release doc line is rendered from its schema. The lead reviews and lands the
  unit, and the owner reruns both suites unconfined, one after the other. Out of scope: the other 17 npm failures and
  the load-sensitive holder-lock test, which belong to other owners.
