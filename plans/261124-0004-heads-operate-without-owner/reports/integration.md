# Integration report: heads operate without the owner

Phase 7 of `plans/261124-0004-heads-operate-without-owner/plan.md`. State on 2026-11-25 17:50 (Asia/Saigon).

## What is on main

| phase | landed as |
|---|---|
| 1 role charter | `719331230` |
| 2 argv window and permission table | `58c0c5e94` |
| 3 help channel and mail to the two hands | `933a7ac75` |
| 6 release rule | `47b337121` |
| 7 probe rollback-form call | `01d011a18` |
| 7 window fixes found by the live probe, and the CHANGELOG lines | `e36f10cfa` (branch `heads-operate-without-owner/p07-fix`, reviewed; `land.gates` plus `test/rust-host/command-routes.test.mjs`, `test/cli/unknown-flag-rejection.test.mjs`, `test/session-host/head-request.test.mjs` green; `cargo test -p fgos --bin fgos routing` 31 passed and `cargo test -p fgos-session-host --test forwarder` 23 passed, run by the lead) |

The fix closes three gaps the probe found on release `sha256:3beba73a...` (details in `head-grant-probe.md`):
`fgos release run` had no command route and fell to the Node payload; the `--dir` the installed shell function appends
made the window refuse every verb a head typed in its shell; and a refused forwarded verb lost its domain code
(`host-failed`).

## Acceptance criteria

1. Phase verify commands: phases 1, 2, 3 and 6 passed theirs at their lands.
2. `npm test` and `cargo test --workspace` on the integrated tree: not run yet. The lead's sandbox cannot run the
   full suites (its cargo target outside the scratchpad is read-only); they wait for an unconfined run.
3. Live probe: before tables (supervisor, secretary) and after tables (supervisor, secretary, lead, planner, shaper)
   on `3beba73a` are in `head-grant-probe.md`. On that release `release run` fails in all five personas and
   `friction record` / `watcher tune` show `host-failed`; both are fixed by `e36f10cfa`. They are proven only on a
   release that contains `e36f10cfa`, whose build and activation is the owner's by hand (the recipe is not yet in
   `.fgos/config.yaml`, so `release run` answers `no-recipe`).
4. The `rg` of criterion 4 finds nothing (phase 1).

## Backlog rows

- `p-g5ktat4kej` (confined heads have no safe hand for routine privileged chores): closed by this plan once the
  re-probe on the fixed release is clean.
- `p-dw3h5wscns` (heads may write `plans/backlog.md`): closed: the table gives the supervisor and the secretary the
  writes `plans`, `plans/backlog.md`, `plans/backlog/*` (`packages/session-host/contracts/head-permissions.v1.json`).
- `p-v6xinnjoxh` (the supervisor looks after every head; someone owns shaper and planner sessions): the charter part
  is done (phase 1); the part left to plan `261122-0056-orchestration-skeleton`'s keeper is closing a shaper or planner
  when it finishes (hand its output on, stop the session, free its seat).
- `p-7vhbq46shs` (follow-up of phase 2: retire `session.verbs` in the engine, `can-i` outside a head) stays open.

The supervisor updates the backlog.

## Left for phase 7 to be done

Asked as owner question `q-l3rskjibl3` (recommended: the owner builds, activates and runs the suites).

1. The owner builds and activates a release containing `e36f10cfa`.
2. An unconfined run of `npm test` and `cargo test --workspace` on main at or after `e36f10cfa`.
3. On the new release: the five-persona probe again (the supervisor starts the probe heads; the lead runs its own),
   expecting no `failed` row; then `release run` once from the supervisor (after the owner writes the recipe) and its
   report line recorded here.
