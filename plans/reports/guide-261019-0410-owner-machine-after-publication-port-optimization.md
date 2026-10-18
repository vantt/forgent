# Owner machine: the Publication port optimization and holder-lock release settle are on main

Written 2026-10-19 04:15 (Asia/Saigon) by the big lead of the GIT and ES lanes (session `ac420727`, second machine). Follows [the 23:05 guide](guide-261018-2305-owner-machine-after-event-store-sync.md).

## What is on main now (`4ebca1739`)

- **Publication port (fgos-git) faster, guarantees unchanged.** Changing CAS runs 8-10 Git children (was 18) and 20 fsyncs (was 47); no-op CAS one child. Each publication compacts its ref's finished operations, keeping the four most recent whole; the compaction ledger (v2) stores expected/next so `recover` of a compacted id still returns the full receipt. Floor-probe verdict cached in `git-floor-verdict.json` in the driver state root (optional cache; missing or stale means probe again). Borrowed children start through `posix_spawn`. Reports: [optimization E3](experiment-261019-0018-git-e3-after-port-optimization.md), [review](review-261019-0020-git-publication-port-optimization.md), [final E3](experiment-261019-0247-git-e3-after-release-settle.md).
- **Holder-lock cleanup rule (behavior change, holder-lock spec §5/§20 dated 2026-10-19).** A borrow return and admission drain only processes created after the lock was taken (fork-inherited copies). The lock-freeing decision is made once, at release: a kernel lock record stamped with this process proves a leftover holder (full scan, kill); otherwise a non-creating shared probe confirms the lock is free; any doubt falls back to the full scan of holders stamped with this process. `release()` now returns `Release` (`Released { leftoversKilled }` or `lock-release-stuck`). [Counsel](counsel-261019-0204-holder-lock-release-settle.md).
- **Rollback (C5) WAL scan** tolerates concurrent compaction and ignores ledger temporaries (no more spurious `git-wal-unreadable`).
- `fgos-canonical-json` / durable-file grouped install effects (internal).

Gate on the second machine: Rust 781 pass, 1 known failure (`containment_terminal_gate_dies_with_a_killed_supervisor`), bwrap pidns vectors executed; clippy clean; Windows `cargo check` passes; `npm test` 8,119 pass, 4 known failures (fences-v1-tombstone yaml, crash-matrix direct no-binding resume, holder-lock-checks membership, skill-wrappers).

## Nothing to activate yet

Plain `fgos` keeps running the activated release. These reach runtime with the Git phase 01 landing, which waits for the owner's E3 budget decision ([brief](brief-261019-0410-overnight-git-and-event-store-decisions.md)).

## For sessions on the owner machine

1. Merge main before editing `packages/holder-lock/rust/src/{port,route}.rs`, `driver/flock.rs`, `packages/process/rust/src/platform/linux.rs` or any caller of holder-lock `release()` (it now returns a value).
2. Not on main: Git phase 04 (custody lease) stays on branch `git/p04-custody` until the owner approves its stop-everything landing, so a release built from main does not carry it by accident.
3. COOK P2: see the board line of 01:05 about running verify through `runBorrowed`.
