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
