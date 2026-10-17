# Rust callers P03: observe store lock on holder-lock

Status: DONE_WITH_CONCERNS

## Result
- `acquire_store_lock(root)` = kernel lock (registry `observe`, Ex, Wait 5000 ms) on `<root>/.fgos/locks/observe.lock` via `fgos_holder_lock::acquire`. Timeout/Held -> `ObserveLockError::Timeout(path)` (`observe-lock-timeout`); Unavailable -> new `DriverUnavailable` (`lock-driver-unavailable`). New pub `acquire_store_lock_within(root, Duration)` (timeout parameter for tests, no env) and `observe_lock_path(root)`.
- `StoreLockGuard` wraps `Handle`; `release`/`Drop` close the description.
- Removed: `LockContent`, `is_process_dead`, `is_lock_expired`, `get_process_start_time`, `LOCK_TTL_SECS`, `POLL_INTERVAL`, `extern kill`, `ObserveLockError::Json` (only served `LockContent`). Kept `format_iso_now`, `ACQUIRE_TIMEOUT`.
- `snapshot.rs`: shard append runs under `acquire_store_lock`.

## Evidence
- `cargo test -p fgos-observe -p fgos-holder-lock` on integration after merge: exit 0, 100 pass / 0 fail. Includes new `store_lock_multiprocess.rs` (6): wait-then-take (~1 s), 5 s timeout, SIGKILL frees at once, 35 s holder not stolen past old 30 s expiry, 4 procs x 200 snapshots on one shard = 800 valid JSON lines.
- `cargo test -p fgos` (phase-private target): exit 0, 54 pass.
- `test/rust-host/observe-store-lock.test.mjs` (new): Node facade holder -> Rust `metrics case open` waits then `observe-lock-timeout`; killed Node holder -> Rust takes it < 3 s. 2 pass / 0 fail, `FGOS_HOST_BIN` = phase-private release `fgos`.
- `cargo check -p fgos-observe` for x86_64-pc-windows-msvc, aarch64-apple-darwin: green.
- `rg` for expiry/pid helpers in observe src: empty.

## Decisions
- `boundary_test.rs` dependency list now includes `fgos-holder-lock` (foundation crate below observe, like session-identity).
- Remaining `create_new` at `eval_journal.rs:219` is the non-unix eval shard open, not a lock; left.
- `Held` (predecessor domain) maps to `Timeout` for callers; D6 names kept.
- Old-lock test assertions ("`.lock` gone") became `probe(observe) == Free`.

## Concerns
- Full `test/rust-host/*.test.mjs` not completed here: `fgctl-init-fixture.mjs` runs `<repo>/target/release/fgctl`, and this worktree's `target` is main's shared target (old fgctl), so two fgctl-init-activation tests failed for that reason (confirmed by big lead). Big lead runs those with a branch-built fgctl.
- GitNexus not run (index stale); grep: 6 callers (`eval_journal`, `case_journal` x2, `friction` x2, `snapshot`) keep the signature. Public change: new `DriverUnavailable` variant, removed `Json` variant, two new pub fns. LOW.
- No component-boundary change. Docs (`docs/specs/observe.md` lines 16, 39) left to P04 per plan.

## Unresolved questions
None.
