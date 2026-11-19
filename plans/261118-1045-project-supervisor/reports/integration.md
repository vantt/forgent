# Integration report: project supervisor plan

Written on the combined tree (phases 1-18 `done` on `main` at bb9f2a708). Phase 19 steps 0-4 only. Steps 5 (build, stage, activate, landing config, live run) and 6 (delete `land-branch.sh`) are not done here and are PENDING for the owner/supervisor window. Census: `node scripts/git-one-door-scan.mjs --root . --write-census` run twice, no diff, 0 undeclared sites.

## Criterion 1: `cargo test -p fgos-supervision`
Test files: `packages/supervision/rust/tests/{portfolio,queue,watcher,definitions,wake,land,discussion_source}.rs`. Landed with their phases. Full run on the combined tree: PENDING (full gate).

## Criterion 2: lane pool
`packages/run-supervisor/rust/tests/lanes.rs`. Full run: PENDING (full gate).

## Criterion 3: `slots --json` lanes; retired names
`rg -n "countWorkerSlots|hasWorkerSlotRoom" src bin test` empty on this tree (checked). `slots --json` shape: PENDING (needs a run of the activated host).

## Criterion 4: definitions
`cargo test -p fgos-supervision --test definitions` (`packages/supervision/rust/tests/definitions.rs`, fixtures under `tests/fixtures/definitions/`). Full run: PENDING.

## Criterion 5: doctor rows and timer unit
Rows `watcher-timer`, `supervisor-events-unhandled`, `supervision-pace`, `land-gates-configured` are registered with their phases; `cargo test -p fgos-distribution timer` renders the unit. Doctor on the activated release: PENDING.

## Criterion 6: verbs through the host
`apps/fgos/tests/supervision_verbs.rs`. Full run: PENDING.

## Criterion 7: request transport and personas
`test/session-host/head-request.test.mjs` (ticket, `request result`, confined socket route, `supervisor done` stops its caller) and `test/session-host/head-start.test.mjs` (`grantOf` personas). Full run: PENDING.

## Criterion 8: live run
PENDING (owner/supervisor window). Needs: build, stage and activate the combined tree; extend `land.gates` and set `land.regenerate`; `watcher.enabled`; throwaway `ready` plan; no typed command after `ready`. Pointers to add after the run.

## Criterion 9: land-branch
`rg -n "land-branch" core domains docs/platform src`: no hit expected, re-checked in the full gate. Deleting `.fgos/runtime/tmp/land-branch.sh` from the main checkout: PENDING (step 6, after a copy to `${TMPDIR:-/tmp}/fgos-work/`).

## Criterion 10: full gates
`npm test`, `cargo test --workspace`, `cargo clippy --workspace -- -D warnings`, msvc and `aarch64-apple-darwin` checks, `plan-contract-check --plan plans/261118-1045-project-supervisor`: PENDING.

## Delivered in this phase
- `CHANGELOG.md` Unreleased bullets; `docs/backlog.md`: `p-t55xjys4u5` done (main bdc9e4251, proof `test/githooks/census-drift.test.mjs`), `p-dkkodseo63` stays open with a note, new rows `p-nqftk5hypy` (confined landing gates), `p-rk25cfw4ct` (`landRunnerItem` onto the landing use case), `p-fllz2aajji` (fold `questions.rs` confined routing, PS-20).
- No row for the ops-metrics plan-status source reading the fetched trunk: no phase 11 finding records that it reads only local `main`.
- Supervision spec decision history and reading-map updated.

## Open questions
- `node scripts/check-backlog-reconciliation.mjs` already fails on this tree before this phase (186 problems on `HEAD`, 188 now: the three new proposed rows have no section in RECONCILIATION.md, and `p-t55xjys4u5` left the proposed set). Who reconciles?

## Open points (lead, 2026-11-19)
- `node scripts/check-backlog-reconciliation.mjs` was already failing on main before this phase (186 problems: proposed
  rows with no section in docs/history/backlog-execution-reconciliation/RECONCILIATION.md). This phase's three new
  rows (`p-nqftk5hypy`, `p-rk25cfw4ct`, `p-fllz2aajji`) add three of the same kind. Not in `npm test`; whether that
  reconciliation is still kept is an owner question, not this plan's.
- Backlog id `p-j2et24xb6o` was minted and not used.
- Step 6 (delete land-branch.sh) is pending until every running lead lands with `fgos land` (supervisor decision A).

## Full gate (2026-11-19, main f624664a6)
Every "Full run: PENDING (full gate)" above is answered here.
- `cargo test --workspace --no-fail-fast`: 3468 pass, 0 fail. `cargo clippy --workspace --all-targets -D warnings`,
  `cargo fmt --all --check`, `cargo check --workspace` for x86_64-pc-windows-msvc and aarch64-apple-darwin: pass.
- `node scripts/run-tests.mjs` (whole suite): 8474 tests; 52 failures in 12 files, all errno -122 (EDQUOT) or EIO on
  the shared `/tmp` tmpfs (per-user quota, `usrquota`). 10 files passed alone at once; the last two
  (`test/distribution/native-addon.test.mjs`, `test/scripts/mailbox-live-confined.test.mjs`) passed alone (25/0) after
  a 4.6 GB scratch copy in this session's own scratchpad was removed. No ERROR (leak/clone) lines.
- The first full run (184f9c8c1) found one real regression from phase 17: with the pool armed, seat deadlines grew by
  the whole lane wait (`test/runner/spawn-worker.test.mjs`). Fixed in main 2dbabb340 (the run supervisor gives back the
  unused wait on `softAt`); follow-up for the hard ceiling of a seat with no soft budget: backlog `p-sksopwqyto`.
- Still pending: step 5 (live run, acceptance 8) in the supervisor's window; step 6 (script removal).

## Live run, first window (2026-11-19 11:44-12:11, release sha256:c9e48aa5, main bcb6a2ad5)
Blocked; window closed. Pointers: board lines of 11:4x-12:1x; watcher journal `journalctl --user -u fgos-watcher-e9756c48`.
- Worked: `watcher.enabled` on + `doctor --fix` installed the timer; the full tick at 12:03 raised `plan-became-ready`
  and `plan-ready-waiting` for the throwaway plan `plans/261119-1142-supervisor-live-run` (landed fa41a7b86 with
  `fgos land --paths`, which also caught the main checkout up) and woke the supervisor: wake outcome `started`,
  `head:supervisor-forgent` live (executor agy).
- Blocker: a confined supervisor cannot read its queue or plans: `fgos supervisor queue|plans` inside the sandbox fail
  `event-store-io` (only `handled|done` went through the request socket). It admitted nothing and started no lead.
  Ended with `fgos session stop supervisor --name forgent`; `watcher.enabled` unset (timer removed).
  Fix: branch `sv/fix-supervisor-reads` (reads through the socket door and grant, audit of every read both skills do).
- Findings: (1) first wake `persona not found`: the main checkout was 88 commits behind (fixed by the first
  `fgos land --paths`); (2) 29 historical events raised by the lookback on first enable (marked handled by the lead);
  (3) `supervisor handled a b c` marked only the first id, and (4) handled head-gone events were re-raised with new ids
  (both fixed on the fix branch); (5) idle mode delays detection up to 15 min: backlog `p-xpeg4jshiu`; (6) the timer
  fired every ~120 s: no `AccuracySec`, systemd's 1 min default (fixed on the fix branch).
