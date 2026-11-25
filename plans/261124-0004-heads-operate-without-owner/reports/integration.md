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
   release that contains `e36f10cfa`, whose build and activation is the owner's by hand (the recipe is now in
   `.fgos/config.yaml`).
4. The `rg` of criterion 4 finds nothing (phase 1).

## Gaps between the permission table and real use (owner order, 2026-11-25)

1. `release run` is `allow` for the supervisor and the secretary, and the `release.*` recipe is now in
   `.fgos/config.yaml` (`apply` `fgctl upgrade`, `probe` `node test/live/head-grant-probe.live.mjs`, `rollback`
   `fgctl repair`, `reversible: true`; `checks` `npm test`, `cargo test --workspace`). On release `3beba73a` every fresh
   head answers `fgos: unknown verb "release"` (exit 4), so no supervisor can release yet. **Fixed in this plan:**
   `e36f10cfa` registers the `release` route so a head's call reaches its request socket (evidence: the five after tables in `head-grant-probe.md`). It takes effect on the first release that contains `e36f10cfa`, which must be built
   and activated by hand (owner question `q-l3rskjibl3`), because the release door itself is the broken path.
2. `session stop` is `allow` for the supervisor, but when the stopped head's request socket is already gone it ends
   `stop-not-ended` (`src/session-host/head-stop.mjs:58`, "did not end within ... of its stop request"), and the head
   ends only by SIGTERM from the unconfined session (owner report, 2026-11-25, the probe heads; the supervisor's
   requests are `supervisor.log` lines 110, 137 and 145 of `head-supervisor-forgent-706`). **Filed as backlog row
   `p-nyhaakrsvz`** (id minted; the supervisor writes the row, event below). `git recover` is `allow`, but only the
   writer that started a chain can settle it (`land-authority-mismatch`, "only its writer can recover"): **already
   filed as `p-o4juyw2ntg`**, whose 2026-11-25 update carries the evidence (9 dead-writer land candidates, 46 GB, disk
   full at about 14:08). Neither is in this plan's footprint: `session stop` is session-host's stop door and
   `git recover` is the git component's.

## Backlog rows

- `p-g5ktat4kej` (confined heads have no safe hand for routine privileged chores): closed by this plan once the
  re-probe on the fixed release is clean.
- `p-dw3h5wscns` (heads may write `plans/backlog.md`): closed: the table gives the supervisor and the secretary the
  writes `plans`, `plans/backlog.md`, `plans/backlog/*` (`packages/session-host/contracts/head-permissions.v1.json`).
- `p-v6xinnjoxh` (the supervisor looks after every head; someone owns shaper and planner sessions): the charter part
  is done (phase 1); the part left to plan `261122-0056-orchestration-skeleton`'s keeper is closing a shaper or planner
  when it finishes (hand its output on, stop the session, free its seat).
- `p-nyhaakrsvz` (new): `session stop` cannot end a head whose request socket is gone (gap 2 above).
- `p-o4juyw2ntg` (existing): `git recover` settles a chain only for its own writer (gap 2 above).
- `p-7vhbq46shs` (follow-up of phase 2: retire `session.verbs` in the engine, `can-i` outside a head) stays open.

The supervisor updates the backlog.

## Left for phase 7 to be done

State on 2026-11-25 20:30 (Asia/Saigon).

The seven `cargo test --workspace` failures this plan caused have fixes on main. They came from stale tests and
records; the owner widened the footprint (`q-xcuwpxa4kn`).

- `1737ae3e9` fixed six of them: `supervision_verbs` x2, `questions_head`, `registry_defaults`, `model_checks` and
  the distribution vector. A reviewer ran each of those tests on its own on the branch.
- `7ee37cd44` fixed `authoring_equivalence`: it records `release` in the `standard-only` list of
  `packages/config/contracts/fixtures/repo-differences.v1.json`. All 9 tests of that file pass.

Release `33f462be` is active and contains `e36f10cfa`. The lead's re-probe on it has no `failed` row (see
`head-grant-probe.md`).

Closed on 2026-11-25 22:07 (Asia/Saigon):

1. Unconfined suites, run by the supervisor on release `33f462be`. `npm test` on main `87abd4c89`: 6617 tests,
   19 failures, none in this plan's files. The failures are `terminal-cutover` x8, `terminal-crash-matrix`,
   `one-door` x2, `scoped-commit`, the `dev-host` symlink, `provider-per-cli-credential-sources` x2, `guide-schema` x2,
   `install-packaging` and `convention-conformance`, all owned by other plans (scoped out by `q-xcuwpxa4kn`).
   `cargo test --workspace` on main `482ffa59e`: 4470 pass, 2 fail, both `authority.rs`. They are component-boundary
   view drift from `60a8c30e7` (plan `261122-2108`, phase 9). This plan's seven earlier cargo failures stay fixed.
   Details: `plans/reports/supervisor-261125-1838-npm-test-24-failures-on-main.md`. Acceptance criterion 2 holds
   for this plan's files only: main is red from other owners' failures.
2. Re-probe on `33f462be`, no `failed` row in the lead, supervisor (gen 716) or secretary (gen 54); see
   `head-grant-probe.md`. Planner and shaper are left for their next real start (owner `q-uxrx52jm2q`).
3. `release run` from the supervisor (ticket `c-2778617-1795616029739`, 21:13 to 21:24): `checks-failed` on
   `npm test` (exit 1). The rule refused to apply a release over a red check, which is the expected outcome while
   main's `npm test` is red. A successful apply waits for main's suite to turn green.
