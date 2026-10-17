# Rust callers P01: fgctl activation lock and main checkout probe on holder-lock

Status: DONE

## Result
- `ActivationLockGuard::acquire(workspace_root)` now takes a kernel lock on `<ws>/.fgos/locks/activation.lock` via `fgos_holder_lock::acquire(Ex, Try)`; `Drop` only closes the description. Removed `try_create`, `is_stale_content`, the `{pid, ts}` content and the TTL reclaim. `cleanup_stale_activation_tmp_files` kept.
- `InitError::ActivationLockHeld` kept its name but now carries the reason (`kernel-lock-held` / `predecessor-domain-not-empty`); new `InitError::LockDriverUnavailable { lock, note }` (`lock-driver-unavailable`).
- `check_main_checkout_lock`: `probe(main-checkout)` first (`MainCheckoutLockError::HeldV3`, "lock-held: main checkout is held (kernel lock)"), then a v1 branch: `.fgos/main-checkout.lock` is a directory (tombstone) -> `Ok`; file -> unchanged v1 read. Header comment states the v1 read lives only while Node writers still use the v1 file.
- 9 `ActivationLockGuard::acquire(` call sites (plan said 11: the other two were `PublishArgs::_lock` field uses), all pass `&workspace_root`; 7 `check_main_checkout_lock` sites untouched.

## Evidence
- `cargo test -p fgos-distribution -p fgctl -p fgos-holder-lock`: exit 0, all green (67 distribution unit, 5 new multiprocess, 8/15/2/6/10/1/2 others).
- New `tests/activation_lock_multiprocess.rs`: held -> `ActivationLockHeld`; SIGKILL holder -> next acquire < 50 ms; two guards exclude, drop releases; `/proc/<child>/fd` scan finds no lock description in a spawned child; main probe sees a kernel holder, then free, then passes over a tombstone.
- `node --test test/rust-host/fgctl-init*.test.mjs fgctl-upgrade.test.mjs` with `env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID`, `FGOS_HOST_BIN` = phase-private release build: 54 pass, 0 fail, 1 skipped, exit 0. Rewritten: orphan/held activation cases and the hostile-candidate tail case now use a real child holding the lock through the Node facade (`test/rust-host/fgctl-lock-holder.mjs`); added: Node holder of `main-checkout` refuses `fgctl init`, passes after SIGKILL (Node + Rust on one file); tombstone dir passes.
- `rg 'is_stale_content|try_create|DEFAULT_TTL_MS' init.rs`: empty.
- `cargo check -p fgos-distribution -p fgctl --target x86_64-pc-windows-msvc` and `aarch64-apple-darwin`: green.
- Integration tip was the phase base, so the merge tree equals the tested tree; no retest needed beyond the above.

## Decisions
- Kept `ActivationLockHeld` as a tuple variant carrying the reason (name kept per D6; no other crate matches on it).
- Order D3 (install released before activation) is structural in `init.rs` (stage_release returns before the guard); the hostile-candidate test shows a release staged while activation is held. No debug-log trace added (would be a test-only code path).
- Windows `Unavailable` branch: compile-checked only; behaviour measured in 4.4b.
- Worktree `target` symlink repointed to a worktree-local dir so Node tests (which hardcode `<repo>/target/release`) ran against this branch's binaries without touching main's shared target.

## Risks / notes
- GitNexus impact not run (index stale, b334695); callers cross-checked by grep: `ActivationLockGuard` and `ActivationLockHeld` appear only in `init.rs`; `check_main_checkout_lock` only in `init.rs`/`lock.rs`. Public change: `ActivationLockGuard::acquire` signature (`installation_dir` -> `workspace_root`), `ActivationLockHeld` payload, new `HeldV3`/`LockDriverUnavailable`. Treat as HIGH for fgctl callers; no external callers found.
- Old `fgctl` and new one do not see each other's activation lock (path moved to `locks/`); closed by tombstone + install-over at landing.
- No component-boundary change.

## Unresolved questions
None.
