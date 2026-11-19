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
