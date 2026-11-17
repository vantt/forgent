# Phase 3 — Fold the app copies

Wave 1, no dependencies. Own worktree from base `e8621a54826408a539af371ffc6a81b3ac16d76a`.

## Inputs

- `docs/history/windows-plain-path-fold/DISCUSSION.md` §6 table, D1-D3.
- `packages/process/rust/src/path.rs:7` `plain_path`; re-export `fgos_git::plain_path` at `packages/git/rust/src/driver.rs:1816`.
- Sites (at base): `apps/fgos/src/legacy_exec.rs:302-310`, `apps/fgos/src/wiring/doctor/bridge.rs:183-189`, `apps/fgos/src/invocation_doors.rs:563-569` (`fn plain` in `mod tests`, used at :904 and :1104), `apps/fgctl/tests/uninstall_surface.rs:86` (`cfg(windows)` closure). fgos depends on fgos-process (`apps/fgos/Cargo.toml:35`); fgctl has fgos-git as dev-dependency (`apps/fgctl/Cargo.toml` `[dev-dependencies]`).

## Footprint

- `apps/fgos/src/legacy_exec.rs`
- `apps/fgos/src/wiring/doctor/bridge.rs`
- `apps/fgos/src/invocation_doors.rs`
- `apps/fgctl/tests/uninstall_surface.rs`

## Steps

1. legacy_exec.rs: `Ok(path) => fgos_process::path::plain_path(&path),`.
2. bridge.rs: replace the `module` re-binding block with `let module = fgos_process::path::plain_path(&module);`.
3. invocation_doors.rs: delete `fn plain` and its doc comment; callers at :904 and :1104 call `fgos_process::path::plain_path(&...)` (keep the reason in a short comment at the first call site only if the context needs it).
4. uninstall_surface.rs:86: `let plain = |path: &Path| fgos_git::plain_path(path).display().to_string();`. No Cargo.toml change.
5. `cargo fmt -p fgos -p fgctl`.

No new test.

## Verify

```bash
export CARGO_TARGET_DIR=/home/vantt/projects/forgent-worktrees/trial-pathfold-target
cargo test -p fgos -p fgctl
cargo check --target x86_64-pc-windows-msvc -p fgos -p fgctl --tests
cargo check --target aarch64-apple-darwin -p fgos -p fgctl --tests
cargo clippy -p fgos -p fgctl --all-targets -- -D warnings
rg -n -F 'r"\\?\' apps   # no hits
```

Pass: all green, grep empty.

## Rollback

`git revert` the phase commit; phase 4 then lists these files as `debt` entries.
