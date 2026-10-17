# Phase 02 (6.5 terminal-control): core allocation and rules

Status: DONE_WITH_CONCERNS. Phase commits `0411b9e0e`, `ce3ed37e0` on `terminal-control/p02-core`, merged `--no-ff` into `terminal-control/integration`.

## Delivered
`packages/terminal-control/rust`: `store.rs` (publish-once record/markers via temp+fsync+link, hint rename, 0700 dirs, key validation), `record.rs`, `identity.rs` (root-process match, identity via `fgos-process`), `port.rs` request/result types, `core.rs` (allocate, attach, launch, send, read, inspect, label, release, capabilities, reconcile_scan). Deps: `fgos-process`, `fgos-holder-lock` (`state_root`). Core has no `cfg(target_os)`.

## Tests (`cargo test -p fgos-terminal-control`, in-memory driver)
core_rules 12, core_failures 14, store_publish 6, policy_fixtures 6: 38 pass, 0 fail (re-run on the integration worktree after merge). `cargo check` for x86_64-pc-windows-msvc green. `test/architecture.test.mjs` exit 0. Not run: full `npm test`, fake-herdr-binary variant (needs P03 driver; rerun after P03 merges).

## Delta vs main since plan
Hot-lock 4.3-S throws `exec-under-hot-lock` on subprocess under the lock: dated amendment added to phase-05 (client must call outside the hot lock). Other landings (holder-lock, Rust callers, repo locks, Windows driver) do not change P02 steps.

## GitNexus
Only P00 stubs and the tail of `port.rs` edited; no callers outside the crate; no HIGH/CRITICAL. Index stale.

## Decisions (lead)
- Group hint written but not read: group panes come from records of the group filtered by liveness (correct, O(records)). Reading the hint is an optimization for a later phase.
- Failed `release(close)` (driver Unknown/incarnation mismatch): `kept-unknown`, no marker, retry allowed. Close after retain: `kept-unknown` (closes when retain expires via scan).
- `inspect` of a record from an older incarnation: pane `unknown` (never `gone`).
- Launch types `cd <cwd> && exec [env K=V] cmd args`; env shows on screen. P06 should pass a launcher script as `command` if env must stay hidden. `exec` keeps the shell pid, so root match does not exclude the shell pid.
- Launch refused into attached or released slots. If cleanup close of an undersized pane fails, the pane is kept as the slot (no orphan).
- Allocation with an empty group: new tab, slot is its first pane; anchor died between check and split: new tab same label.

## Review (Sonnet code-reviewer)
Fixed: exec-replaced shell not identified, launch into attached/released slot, close-after-retain silent, orphan pane on failed cleanup, attach EEXIST. Left: concurrent allocate in one group is not serialized in core (Node client queues per `groupKey`, plan D3); a command that exits before identification stays `launch-requested` and the scan reports it (intended: keep).

## Unresolved
- Whether to read the group hint (perf) once record counts matter.
