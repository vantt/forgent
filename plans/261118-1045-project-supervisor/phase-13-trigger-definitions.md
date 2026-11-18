# Phase 13 — Trigger and pace definitions

Detection is data: named query files the watcher runs (ops-metrics phase 7 grammar), no code per trigger. This phase
writes this plan's raised definitions, its pace definitions and one fixture per definition. `head-gone` and
`plan-no-progress` belong to ops-metrics phase 14 and `question-answered` to the owner-question store; they are listed
in `watcher.definitions` (phase 4), not written here.

## Inputs
- Waits: ops-metrics phase 5 (query grammar, incl. the k × aggregate form `watcher-overdue` needs), 7 (definition file
  shape `{name, requires, query, params, minSample, row}`, `--def <file|dir>`), 8 (`fgos.run.attempt`), 11
  (`fgos.head.state`, `fgos.plan.status`). Step 0 reads their landed kind declarations for the exact attr names.
- Style reference for definitions and their tests: ops-metrics phase 7 step 5 and
  `plans/261118-0936-ops-metrics/phase-05-query-engine.md` step 4 (`:38-40` sketch `watcher-overdue`,
  `supervisor-idle-burn`).
- Phase 3 `observe-kinds.json` (`fgos.watcher.tick` with measure `fgos.watcher.interval`, `fgos.supervisor.wake` with
  the door's outcome enum, `fgos.discussion.status` attrs `from`/`to`/`path`).
- Phase 4 config keys read through `params.configKey`: `watcher.wakeFailureLimit`, `watcher.stuckWakeLimit`,
  `watcher.overdueFactor`.
- Row shape the watcher consumes (phase 11): `{kind, reason, nextCommand, subject, ts}`. **`ts` is the state-change
  instant** (the status commit time, the first failure since the last `started`, the instant a state began), never the
  query time, so a re-run gives the same event id (PS-21, red team H3, validator M14).
- `docs/discussions/ops-metrics/DISCUSSION.md:308-310` (the two pace definitions belong to the supervisor side).

## Footprint
`core/watcher/**`, `packages/supervision/rust/tests/definitions.rs`,
`packages/supervision/rust/tests/fixtures/definitions/**`.

## Steps
0. Re-grep inputs; list the attr names each definition needs from the landed declarations. Read ops-metrics'
   `head-gone` definition: if its row `ts` is the query time rather than the gone-since instant, stop with
   `NEEDS_CONTEXT` naming that file (the fix is the ops-metrics plan's, not a copy here).
1. Raised definitions, `core/watcher/definitions/<name>.query.json`. `since` is never written in a file.
   - `plan-became-ready`: `fgos.plan.status` changes with the new status `ready`. Subject = plan dir; `ts` = the commit.
   - `plan-done`: the new status is `done`.
   - `plan-priority-changed`: attr `fgos.plan.change` = `priority`.
   - `plan-ready-waiting` (level, PS-21): the latest `fgos.plan.status` of a plan is `ready`; `ts` = that status
     commit, so it is raised once per status commit and catches anything an edge window missed.
   - `lane-freed`: `fgos.run.attempt` spans that ended in the window, one row per `origin.host`; `ts` = the end.
   - `lead-ended`: `fgos.head.state` `retired` where the role starts `head:lead-`; `ts` = the retire instant.
   - `discussion-settled`: `fgos.discussion.status` whose `to` is `settled`; `ts` = the commit.
   - `supervisor-wake-failed` (notify-only by the standard `actions`): `fgos.supervisor.wake` with outcome
     `start-failed` or `identity-unknown` since the last `started`, count above `params.limit <- watcher.wakeFailureLimit`;
     `ts` = the first such failure.
   - `supervisor-stuck` (notify-only): `fgos.supervisor.wake` with outcome `already-live` since the last `started`,
     count above `params.limit <- watcher.stuckWakeLimit` (the watcher calls wake every tick while events stay
     unhandled, phase 11 step 2.7); `ts` = the first such wake.
   Each carries `row: {kind, reason, nextCommand}`; `nextCommand` is the verb the supervisor (or the notified person)
   runs next, e.g. `fgos supervisor plans`, written once here.
2. Pace definitions, `core/watcher/pace/<name>.query.json`, never in `watcher.definitions` and never raised (PS-22):
   - `watcher-active`: a row while any plan's latest status is `running` or any `head:lead-*` is `live`; no row means
     idle (read by the tick, phase 11).
   - `watcher-overdue`: the newest `fgos.watcher.tick` is older than `params.k <- watcher.overdueFactor` ×
     `fgos.watcher.interval` while a plan is `running` (run by doctor row `supervision-pace`, phase 16).
   - `supervisor-idle-burn`: `fgos.supervisor.wake` `started` while no plan is `ready` or `running` (same doctor row).
3. `tests/definitions.rs`: for each definition, a fixture pair under `fixtures/definitions/<name>/`
   (`records.jsonl` over test-local sources, `expected.json`); the test runs the real Observe query over it.
   - each definition gives exactly one row on its matching fixture and none on its non-matching fixture;
   - running each matching fixture twice, with the second window overlapping the first, gives the same `ts` and
     subject (stable ids);
   - a definition whose required kind is undeclared answers `unmeasured`, not zero rows;
   - the config-backed limits are resolved from test-local config values.

## Verify
- `cargo test -p fgos-supervision --test definitions` passes (plan acceptance 4).
- `npm run fgos:dev -- metrics query --def core/watcher/definitions --def core/watcher/pace --since -1h --dir <fixture project>`
  prints no `unmeasured` row on a project whose kinds are declared.

## Rollback
Revert the phase commit. The watcher then finds an empty definition directory and raises nothing; pace reads no row
and every tick is idle.
