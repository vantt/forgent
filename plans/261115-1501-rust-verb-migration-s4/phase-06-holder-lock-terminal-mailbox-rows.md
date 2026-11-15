---
phase: 6
title: "Holder-lock, Terminal-control and Mailbox doctor rows in Rust"
status: pending
effort: 2d
wave: B
blockedBy: [2, 3]
q3: "(a)"
---

# Phase 06: Holder-lock, Terminal-control and Mailbox rows

Rows whose Node judges spawn the host today (holder-lock `spawnSync` at `src/setup/holder-lock-checks.mjs:150`, the
host's `mailbox status --json` at `registrations.mjs:1756`) become in-process calls; the two timer rows use `timer.rs`
from 02.

Phase-lead rules: [plan.md](plan.md). Branch `rust-verb-migration-program/s4-p06`. Report slug `s4-p06-lock-terminal-mailbox-rows`.

## Rows and fixes (confirm against 00 F2)

- Holder-lock: `lock-kernel-semantics` (1608), `lock-borrow-vectors` (1613), `lock-holders` (1618, pointer naming
  `fgos lock-status`, never fails); fix `lock-dirs` (1623). Rust owner `packages/holder-lock/rust` (`status.rs`,
  `port.rs`, the borrow vectors).
- Terminal-control: `terminal-control`, `terminal-allocations` (pointer) (`registrations.mjs:2317, 2322`; judge
  `src/setup/terminal-control-checks.mjs`). Moves only if 00 F2 finds no Node-only fact: the judge imports
  `resolveHerdrBin` from `src/runner/dispatch/transport.mjs` (S6a) at line 13; if that fact has no Rust owner, both
  rows stay `bridge:S6a` and this phase says so.
- Mailbox: `mailbox-hook` (1793, pointer, the measured 0.6-0.9 s exception, fails when the record is unreadable or
  untrusted), `mailbox-sync-timer` (1805) and `account-probe-timer` (1816) with fixes (1811, 1822) over `timer.rs`.
  `mailbox-claude-accept` (1799) is an agent-config report and moves in 07.

## Requirements

1. Adapters call the crates; `mailbox-hook` calls the mailbox status function the host's `mailbox status` verb uses
   (`apps/fgos/src/wiring/mailbox_*.rs`), no process.
2. Timer rows and fixes use `timer.rs`; the timer names the project shim or the activated release's host (02).
3. Delete: `src/setup/holder-lock-checks.mjs`, `terminal-control-checks.mjs` (if moved), the mailbox row bodies;
   `managed-timer.mjs` stays for `uninstall` until 09.
4. Registry owners; debt entries out; the "managed timer" row's debt keeps `managed-timer.mjs` until 09.
5. Parity: lock rows on Linux; `lock-holders` with a held lock; mailbox rows with the mailbox off, on with a timer
   missing, on with a timer present; terminal rows with and without herdr.

## Test owners after the move

| Behaviour | Old proof | Owner now |
|---|---|---|
| holder-lock rows | `test/setup/holder-lock-checks.test.mjs`, `test/holder-lock/windows-doctor.test.mjs` | `wiring/doctor/holder_lock.rs` tests; the Windows answer as a `cfg(windows)` unit case, which runs only where a workflow runs `cargo test -p fgos` on Windows: 00 confirms `holder-lock-cross-platform.yml` does, else that workflow gains the step here |
| terminal rows | `test/setup/terminal-control-checks.test.mjs` | `wiring/doctor/terminal.rs` tests (or unchanged if bridged) |
| mailbox rows and timer fixes | `test/setup/managed-timer.test.mjs` (row half), mailbox doctor cases | `wiring/doctor/mailbox.rs` tests; `timer.rs` tests own the unit bytes |

## Files

- Create: `apps/fgos/src/wiring/doctor/{holder_lock.rs,terminal.rs,mailbox.rs}`.
- Modify: `wiring/doctor/mod.rs`, the registry contract, `registrations.mjs`, `.github/workflows/holder-lock-cross-platform.yml`
  (path filters at 16, 18 name `holder-lock-checks*`), tests, baseline, manifest, census.
- Delete: as requirement 3.

## Gates

- fmt; clippy `-D warnings` on `fgos`, `fgos-holder-lock`, `fgos-terminal-control`, `fgos-mailbox`; `cargo test` on them; msvc and darwin.
- `node scripts/run-tests.mjs test/rust-host/verb-parity.test.mjs test/setup/registrations.test.mjs test/architecture.test.mjs test/setup/git-mutation-census.test.mjs`.

## Risk and rollback

- The mailbox pointer's cost or verdict changes (M x M): same function as the verb; parity on a trusted and an
  untrusted record. Rollback: revert; rows return to the bridge.
