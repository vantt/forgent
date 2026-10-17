# Phase 05: internal route + Node client (terminal-control)

Status: DONE. Branch `terminal-control/p05-route` merged `--no-ff` into `terminal-control/integration`.

## What landed
- `packages/terminal-control/rust/src/route.rs`: `fgos internal terminal-control <op> --protocol 1 --json`; stdin envelope `{v, driver, herdrBin, env, config, request}`, one JSON line out. 10 ops. Refusals (`unsupported`/`unknown`) exit 0 untouched. Wired as the `terminal-control` branch of `internal` in `apps/fgos/src/main.rs`; absent from help and `command-routes.json`.
- `src/terminal-control/client.mjs`: `createTerminalControl({hostBin, herdrBin, env, config, timeoutMs})`, sync fn per op, `allocateAsync`/`releaseAsync` with a promise queue per `groupKey` (failed call does not stall successors; close of an unknown group is refused). Named errors: `terminal-control-no-host-binary`, `-route-usage`, `-route-timeout`, `-route-bad-output`, `host-version-mismatch`, `-unknown-group`. No decision logic.
- `docs/architecture-manifest.json`: client row (infra). Contract: optional `config` documented.

## Evidence (integration worktree, host built with private CARGO_TARGET_DIR)
- `node --test test/terminal-control/*.test.mjs test/rust-host/internal-routes.test.mjs test/rust-host/help-routes.test.mjs test/architecture.test.mjs`: 54 pass, 0 fail (contracts 7, client-route 6, group-queue 5, internal-routes, help-routes, architecture 27).
- `cargo test -p fgos-terminal-control -p fgos`: 125 pass, 0 fail (incl. 3 new route unit tests). clippy clean for route.rs/main.rs. `cargo check -p fgos-terminal-control` ok for x86_64-pc-windows-msvc and aarch64-apple-darwin.
- Latency of `read` through route, 200 calls: fake herdr p50 11.7 ms / p95 12.9 ms; real herdr p50 16.3 ms / p95 18.1 ms (max 116.7). Real run: two allocates of one group shared one tab, both closed, no tab left.
- Review (Sonnet): 8 findings, all fixed (async UTF-8 chunk corruption, close outside the queue for sync-allocated keys, `groupOfKey` leak, `read.source` validation, unknown-flag vs mismatch order, EPIPE panic, output cap, sync throw in `releaseAsync`).
- GitNexus: only new files plus one `internal` branch in `main.rs`; no existing symbol edited, index stale, no HIGH/CRITICAL.

## Decisions
- `--protocol` mismatch exits 3 (contract + sibling routes), not 4 as the phase text says.
- Optional `config` in the envelope carries `minCols/minRows/maxPanesPerTab/policy/allocationGraceMs/launchIdentifyTimeoutMs` for the config phase; defaults 80x20, 8 panes, measured-split, 60000, 5000 (P01 proposal).
- The route stays 1 process per op; read poll cost ~12-16 ms, no need to merge read+inspect.
- Launch success path through the route is not covered with the fake herdr (static fixture reports a non-existent pid); the core's own tests cover it, route test asserts `not-started` and no second launch.

## Unresolved
- A timed-out `allocate` rejects and lets queued calls proceed; the record may exist; retry with the same key is idempotent.
