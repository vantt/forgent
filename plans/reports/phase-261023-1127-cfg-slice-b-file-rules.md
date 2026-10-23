# Phase report: CFG Slice B file rules (open beneath, revision, modes, file selection)

Branch `cfg/slice-b-files`, worktree `/home/vantt/projects/forgent-worktrees/cfg-slice-b-files`. Not pushed, not merged.

## Durable File (`packages/durable-file/rust`)

- `src/beneath.rs` (273 lines, unix only, no `unsafe`): `open_beneath(root, relative) -> Result<Option<OpenedFile>, BeneathError>`, `open_beneath_with(Strategy, ..)`, `ensure_dir_beneath(root, relative, mode) -> Dir`. `Strategy::Openat2` (Linux/Android: `RESOLVE_BENEATH | NO_SYMLINKS | NO_MAGICLINKS` for the directory chain) and `Strategy::Walk` (`O_NOFOLLOW | O_DIRECTORY` per component). `open_beneath` tries openat2 and falls back to the walk on `ENOSYS` or `EPERM` (sandbox seccomp filters that do not know the syscall); macOS has only the walk. The strategy is a plain argument, so tests run both on this machine with no switch.
- The root is opened once no-follow (symlinked root refused). The leaf is opened `O_NOFOLLOW | O_NONBLOCK` relative to the verified directory fd, then `fstat` must say regular file. `OpenedFile::read(max)` reads from that same descriptor, refuses over `max` (`TooLarge`), returns bytes plus sha256 lowercase hex of exactly those bytes; `mode()`, `parent_identity()` (dev, ino of the parent dir fd).
- Refusals: `Symlink`, `Escape` (absolute, empty, `..`, `EXDEV`), `NotRegular` (FIFO, directory leaf, non-directory component), `TooLarge`. Missing root/dir/leaf is `Ok(None)`. `ENOTDIR` is classified by `statat(NOFOLLOW)` so both strategies name a symlink component the same.
- `Cargo.toml`: `rustix =1.1.4` (`std`, `fs`; unix) and `sha2` (workspace) as direct deps with why-comments; dev-dep adds `process` for `umask` in one test. Both already in `Cargo.lock`; the lock diff is only two dependency lines on `fgos-durable-file`. `cargo deny --config .github/cargo-deny.toml check advisories bans sources`: advisories ok, bans ok, sources ok.
- Owning proofs `tests/beneath.rs` (6 tests): a 14-case table run over both strategies (regular, `./`, missing leaf, missing dir, missing root, file symlink, same-dir symlink, dir symlink, intermediate symlink, symlinked root, `..`, absolute, FIFO, file-as-directory); revision of old bytes after a rename over the path between open and read (both strategies); bound; mode and parent identity; `ensure_dir_beneath` mode 0700 under umask 022 and 077, existing directory mode kept, symlink component refused without creating outside.
- Callers of what changed: nothing existing changed (additions only; the new `pub use` is cfg(unix)). Existing users of `fgos_durable_file` (terminal-control, event-store, git, config) rg-checked; `cargo check -p fgos-terminal-control -p fgos-event-store -p fgos-git` builds. They now compile `rustix`/`sha2` through the dependency.

## fgos-config (`src/files.rs`, 124 lines; `pub mod files`)

- `read_beneath(root, relative, max) -> Result<Option<LoadedFile>, FileError>` (bytes, revision, mode, parent identity). Mapping: Symlink / Escape / NotRegular -> `config-path-symlink` (spec lists "symlink or resolves outside its root"; non-regular has no id of its own, so it shares it, which is a choice for the reviewer); TooLarge -> `config-parse` with yaml rule `input-too-large`; other io errors stay `FileError::Io` (no id). Non-unix: `config-platform-unsupported`. `FileError::Refused` is boxed (clippy `result_large_err`).
- `select_source(root, dir, max) -> Source` (Absent | Yaml | LegacyJson); both present = `config-legacy-shadowed`; `config.json` equal to the tombstone is no source. Pinned decision: the exact text, or the text plus exactly one `\n`, is the tombstone; extra newlines, leading space or any other text is a source. A symlinked `config.json` is refused even beside a yaml (not ignored).
- Modes: constants `PRIVATE_FILE_MODE` 0600, `PRIVATE_DIR_MODE` 0700, `check_mode` returns a `ModeFinding` (a 0644 file reads fine). Creating files/dirs with those modes: dir via `ensure_dir_beneath` (proven in Durable File), files via the existing `install_once_with_mode` (owned by `creation_modes.rs`); no second copy of those cases here. Phase 10 wires them.
- Wiring proofs: `tests/files_open.rs` (4), `tests/files_select.rs` (2).

## Checks

`cargo test -p fgos-durable-file -p fgos-config --jobs 4`: all pass (durable-file 6+1+9, config 4+2+2+3). Clippy `--all-targets -D warnings` and `cargo fmt --check` clean. `free -g` first (21 GB available). Impact analysis inactive (rg used).

## Lines added (Rust source)

- fgos-durable-file: 273 (`beneath.rs`) + 8 (`lib.rs`) = 281 source; tests 189 (`beneath.rs`).
- fgos-config: 124 in `files.rs`; tests 129 across `files_open.rs` and `files_select.rs`.

## Deviations / notes

- Phase text listed `OpenFile` with `dir_identity()` and `select_source(scope_dir_fd, names)`; implemented as `parent_identity()` and path-based `select_source(root, dir, max)`; no descriptor leaves Durable File except `Dir` from `ensure_dir_beneath` (identity only).
- Residual window: the later path-based replace (phase 10) still has a check-to-rename window; `identity()` re-check narrows it.
- Merge of `origin/main` was not done in this branch (branched from `cfg/slice-b` minutes earlier); do it at land.
