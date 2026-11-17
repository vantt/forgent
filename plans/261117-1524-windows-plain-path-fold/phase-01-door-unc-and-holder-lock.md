# Phase 1 — Door UNC spelling and holder-lock fold

Wave 1, no dependencies. Runs in its own worktree from base `e8621a54826408a539af371ffc6a81b3ac16d76a`.

## Inputs

- `docs/history/windows-plain-path-fold/DISCUSSION.md` §6 and D6.
- `packages/process/rust/src/path.rs` (whole file, ~45 lines).
- `packages/holder-lock/rust/src/driver/windows.rs:200-240` (`description_path`; comment at :232, strip at :233-238). Consumers of its output: `volume_is_remote` (`GetVolumePathNameW`) and `packages/holder-lock/rust/src/port.rs:1680` `predecessor::record_path` — their spelling must not change.

## Footprint

- `packages/process/rust/src/path.rs`
- `packages/holder-lock/rust/src/driver/windows.rs`

## Steps

1. In path.rs add:
   ```rust
   /// The path as Win32 volume and share APIs spell it: a verbatim UNC path (`\\?\UNC\host\share\x`) becomes
   /// `\\host\share\x`; any other path is written as `plain_path` writes it.
   pub fn plain_path_unc_share(path: &Path) -> PathBuf
   ```
   Body: `path.to_str().and_then(|t| t.strip_prefix(r"\\?\UNC\")).map_or_else(|| plain_path(path), |rest| PathBuf::from(format!(r"\\{rest}")))`. Keep `plain_path` and `plain_drive_path` unchanged. Update the module doc to say the module owns both spellings.
2. Add one test fn in path.rs `mod tests` named for the behaviour (e.g. `a_verbatim_unc_path_is_written_as_a_share_for_win32_volume_apis`): `\\?\UNC\h\s\x` -> `\\h\s\x`, `\\?\D:\x` -> `D:\x`, `/tmp/x` unchanged. No plan id in the name.
3. In holder-lock `driver/windows.rs` `description_path`: replace the `strip_prefix` match (233-238) with `Ok(fgos_process::path::plain_path_unc_share(Path::new(&path)))` (adapt to the local types; `path` is an `OsString`). Remove the now-unused `text` binding; move or drop the spelling comment (the function's doc now owns it).
4. `cargo fmt -p fgos-process -p fgos-holder-lock`.

## Verify

```bash
export CARGO_TARGET_DIR=/home/vantt/projects/forgent-worktrees/trial-pathfold-target
cargo test -p fgos-process -p fgos-holder-lock
cargo check --target x86_64-pc-windows-msvc -p fgos-process -p fgos-holder-lock --tests
cargo check --target aarch64-apple-darwin -p fgos-process -p fgos-holder-lock --tests
cargo clippy -p fgos-process -p fgos-holder-lock --all-targets -- -D warnings
rg -n -F 'r"\\?\' packages/holder-lock   # only comments, if any
```

Pass: all green; holder-lock has no `strip_prefix` of the prefix.

## Rollback

`git revert` the phase commit. No other phase depends on it except phase 4's door row (which then needs a `debt` entry for `driver/windows.rs`).
