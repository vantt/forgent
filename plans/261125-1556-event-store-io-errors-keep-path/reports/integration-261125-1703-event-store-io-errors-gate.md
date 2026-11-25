# Phase 3 integration gate — event-store-io-errors-keep-path

Verdict: **phase 3 closed.** The full suites ran unconfined on a tree carrying phases 1 and 2. Neither suite is
green, but no failure is in, or reads, the files this plan changed. Every failure belongs to other work on main.

## Unconfined run (the gate of record)

Run by the supervisor on main `829bb5311`, release `33f462be`, on 2026-11-25. Phase 1 (`4871e5b8`) and phase 2
(`c64d20ed`) are ancestors of `829bb5311`. Failing tests and their first error lines:
`plans/reports/supervisor-261125-1838-npm-test-24-failures-on-main.md`.

- `npm test`: 6675 tests, 6624 pass, 24 fail, 27 skipped. None is in `test/event-store` or `test/report/decision-index`.
- `cargo test --workspace --no-fail-fast`: 4452 pass, 8 fail. None is in an event-store package.

## Why the red tests do not block this plan

- **What this plan changed:** phase 1 changed `packages/event-store/rust/src/lifecycle.rs` and its test,
  `packages/git/node-addon/src/event_store.rs`, `src/event-store/maintenance.mjs`,
  `test/event-store/triggers.test.mjs`, the event-store spec and the mutation census. Phase 2 changed only
  `test/report/decision-index.test.mjs`.
- **What the failing tests touch:** none of the 18 failing test files mentions `event-store`, `event_store`,
  `maintenance.mjs`, `maintain_event_store` or `decision-index` (checked by grep on 2026-11-25).
- **Where the cargo failures come from:** seven of the eight follow from the head-permission work.
  `head-permissions.v1.json` was added by `8c51967e4` and `can-i` was added by `996c0c9f4`. The eighth,
  `holder-lock` multiprocess round 15, is sensitive to machine load.
- **Where the npm failures come from:** the supervisor report groups them by owner. They are run-supervisor
  timeouts, envelope vectors, the assignment allow-list, provider fixtures, workflow guides, packaging and one
  convention violation.
- **The behaviour this plan adds is proven:** the event-store lifecycle tests passed (8/8), including
  `a_trigger_io_failure_names_the_operation_and_the_path`. Each phase also passed its land gate with its named
  test file.

## Step 2 — real fault records

No real `event-store-end-trigger` record was read for this report, so the phase 1 test is the proof that the
log message names the operation and the path. Tracing the live faults is the follow-up row `p-duxnm52lzh`.

## Earlier confined attempt (void)

A unit run inside the producer sandbox on `4871e5b8` could not run `npm test`: EROFS on
`~/.local/state/fgos/locks/full-suite.lock`. That run is superseded by the unconfined run above.
