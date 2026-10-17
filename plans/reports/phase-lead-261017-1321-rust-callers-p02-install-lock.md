# Rust callers P02: install.lock on holder-lock

Status: DONE

## Result
- `InstallLockGuard::acquire(store_root)` takes a kernel lock (registry `install`, Ex, Try) on `<store_root>/locks/install.lock` via `fgos_holder_lock::acquire`. `Held`/`Timeout` -> `LockError::AlreadyInProgress`; `Unavailable` -> new `LockError::DriverUnavailable` (`lock-driver-unavailable`). `Drop` closes the description. `create_new`/`remove_file` and the `OpenOptions` import are gone. `stage_release` flow unchanged.
- New pub `install_lock_path(store_root)`.
- Tests: new `packages/distribution/rust/tests/install_lock_multiprocess.rs` (held holder refuses `stage_release` before the candidate is read; SIGKILL holder -> next acquire < 50 ms; two guards exclude, drop releases; `FGOS_STATE_HOME`/`XDG_STATE_HOME`/`HOME` put the lock at `<stateRoot>/locks/install.lock` and equal `lock_root()/install.lock`). `fgctl-stage.test.mjs`: "install.lock is gone" now `probe('install')` == free. `fgctl-init-activation.test.mjs` first case: blocked by a real child holding the kernel lock via the Node facade.

## Evidence
- `cargo test -p fgos-distribution -p fgos-holder-lock`: exit 0 (67 unit, 4 new multiprocess incl. child entry, 5 activation, rest green).
- `node --test test/rust-host/fgctl-stage.test.mjs test/rust-host/fgctl-init-activation.test.mjs`, session env vars unset, `FGOS_HOST_BIN` = phase-private release `fgos`: stage file 20 pass / 0 fail (includes the 8-way concurrent case: exactly one winner, others "stage already in progress"); init-activation file rerun after the cleanup edit: 7 pass / 0 fail.
- `rg create_new store.rs`: no match. `cargo check -p fgos-distribution` for x86_64-pc-windows-msvc and aarch64-apple-darwin: green.
- Integration tip was the phase base (fast-forwardable), merged `--no-ff`; merge tree equals the tested tree.
- Review (sonnet code-reviewer): no blocking issues; applied: stale test comments, holder kill moved to `finally`.

## Decisions
- Lock path is `store_root.join("locks")`, not `lock_root()` itself: honours the caller's argument (temp roots in unit tests) and equals `lock_root()` when `store_root` is the state root (asserted by the test).
- `Held` reason is dropped (name `AlreadyInProgress` kept); stderr text unchanged.
- Worktree build-output symlink repointed to a phase-local dir (Node tests hardcode `<repo>/<build dir>/release`).

## Risks / notes
- GitNexus not run (index stale); grep: `InstallLockGuard`/`LockError` used only in `store.rs` plus the new test. Public change: new `DriverUnavailable` variant, new `install_lock_path`; LOW for callers.
- Old `fgctl` (create-exclusive on `<stateRoot>/install.lock`) does not exclude the new one; closed by the tombstone + install-over at landing (same as activation).
- No component-boundary change.

## Unresolved questions
None.
