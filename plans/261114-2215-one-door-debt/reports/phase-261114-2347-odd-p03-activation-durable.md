# Phase 03 report: activation record through Durable File

## Result

- `publish_activation_file` (`packages/distribution/rust/src/init.rs`) now calls `fgos_durable_file::replace_durably_with_mode(dir, name, bytes, 0o666)`.
  Mode proof: `creation_modes.rs` shows the door applies the umask to the caller mode; the new init test compares the
  installed mode with a plain `File::create` in the same umask. Result mapping lives in `settle_activation_install`:
  `installed.is_some()` (only the directory fsync failed) prints one warning and returns Ok, so init goes on to write the pin;
  any earlier failure is the error as before.
- Sweep moved: `fgos_durable_file::sweep_stale_temps(dir) -> io::Result<usize>` (exact `.durable-file-<digits>-<digits>.tmp`,
  missing dir is 0, directory sync when something was removed). Event-store `sweep_temps_under_append_lock` calls it and keeps
  only its own `store.<id>.tmp` loop. `cleanup_stale_activation_tmp_files` still removes `activation.json.tmp.*` (older releases)
  and calls the crate sweep.
- `doors` row `fsync a file or directory from Rust` added, no debt. `allowed` as the check found it: durable-file `lib.rs`;
  git `restore`, `native_lock`, `sequence`, `repository_config`; event-store `rotate`, `identity`, `fsio`; holder-lock `tombstone`;
  observe `shard.rs` (appends lines to an existing shard; not write-then-rename, no scope widening needed);
  run-supervisor `gate.rs` (`write_in_place` rewrites an existing file; same). `init.rs` no longer matches.
  Git `publication.rs` only matches `sync_all_objects` (not the patterns).
- `docs/platform/component-boundary.md` Durable file row names the accepted Rust exceptions.

## Tests

- New: durable-file `sweep_removes_only_this_crates_temporaries_and_tolerates_a_missing_directory` (owner of the sweep cases);
  init `publish_activation_file_installs_the_record_with_the_default_mode_and_no_temp` (unix);
  init `an_installed_but_unsynced_activation_record_is_a_warning_not_an_error`.
- Retired from event-store `append_sweeps_old_and_shared_identity_temps_under_the_lock`: the "unrelated name kept" case moved to the
  durable-file test above; the shared-temp line stays as the one wiring proof.
- No fault seam exists on `replace_durably_with_mode`, so the installed-but-unsynced path is proven on the mapping function with a
  constructed `InstallError`.

## Gates (logs /dev/shm/odd-p03-*.log)

- fmt, clippy -D warnings, cargo test for fgos-distribution, fgctl, fgos-durable-file, fgos-event-store: green.
- cargo check x86_64-pc-windows-msvc and aarch64-apple-darwin: green (one pre-existing `unused_mut` at `fetch.rs:316` on msvc, not touched).
- architecture, doc-health, git-mutation-census tests: 65 pass. Decision-citation drift and git-one-door scan: 0 undeclared.
- Node readers (after a release build of fgos, fgctl and the addon): `test/rust-host/fgctl-init*.test.mjs`, `fgctl-upgrade`, `pin-drift-check`, `bin-discovery`: 63 pass, 0 fail.

## CHANGELOG

None: the written bytes and mode are unchanged.

## Lessons

- A door row's `allowed` list is found by running the check, not by the plan's guess; two named files (`shard.rs`, `gate.rs`) turned out
  to be append and in-place rewrites, which are different jobs from "write new bytes".
- `InstallError.installed` is the contract for "record in place, durability late": map it, never treat every error alike.
- A sweep owned by the crate that creates the temps removes the need for each caller to copy the name grammar. Another copy of the
  grammar remains in `packages/git/rust/src/wal.rs:2767` (`is_durable_temporary`, looser: prefix and suffix only); worth an item.

## Authority

- Temp names created by Durable File are swept by `fgos_durable_file::sweep_stale_temps`; the `doors` row names who else may fsync.
