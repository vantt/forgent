# Phase 07: File rules (open beneath, revision, modes, file selection)

Depends on 01. Runs in parallel with 03-06 and 08. Suggested executor: sonnet; opus only after a failed attempt; independent sonnet review before landing (security).

## Context

Spec section 9, "File rules": the project file resolves inside the worktree root it belongs to; the global file inside `~/.fgos`, the accounts and token files inside `~/.fgos/private`. Every path component is opened without following symlinks (`openat2` with `RESOLVE_BENEATH | RESOLVE_NO_SYMLINKS` where the kernel has it, per-component `O_NOFOLLOW` otherwise); the byte revision is computed from the same open file that is read; a symlinked `.fgos` directory, `~/.fgos` directory or config file is refused with `config-path-symlink`. Modes: global, accounts and token files 0600, `~/.fgos/private` 0700, a write keeps them. Section 3: exactly one source per scope (`config.yaml` vs legacy `config.json`; both present is `config-legacy-shadowed`); the migration tombstone text (`moved to .fgos/config.yaml; upgrade fgOS`) is not a source. Nothing in the repo does an open-beneath today (phase 00 fact), so this phase adds the primitive.

## Files it may touch

`src/files.rs`, `tests/files_open.rs`, `tests/files_select.rs`. No fixtures JSON: the behaviours are filesystem facts, proven on real temp directories (design principle 8: lowest layer that can observe it).

## Design

- `Root` (a directory the file must stay beneath: project worktree root, `~/.fgos`, `~/.fgos/private`) and `open_beneath(root, relative) -> Result<OpenFile, ConfigRefusal>`:
  - Linux: `openat2(root_fd, relative, RESOLVE_BENEATH | RESOLVE_NO_SYMLINKS | RESOLVE_NO_MAGICLINKS)` through `rustix::fs::openat2` in Durable File's `open_beneath` (D17); no `unsafe` in Durable File or in `fgos-config`, which stays `forbid(unsafe_code)` and only maps Durable File's refusals to `config-path-symlink`.
  - Kernel without `openat2` (`ENOSYS`) and macOS: Durable File walks components with `rustix::fs::openat(dirfd, component, O_NOFOLLOW | O_DIRECTORY)` for each directory and `O_NOFOLLOW` for the leaf; `ELOOP` maps to `config-path-symlink`.
  - A leaf that does not exist is `Ok(None)` (missing is not malformed); a missing directory component is also `Ok(None)`; a symlink anywhere, a component escaping the root (`..`), or a non-regular leaf is a refusal.
- `ensure_dir_beneath(root, relative, mode) -> Result<DirHandle, ConfigRefusal>`: `mkdirat` per missing component with the same no-follow walk (project `.fgos` and `~/.fgos` 0755 as `mkdirSync` creates them today, `~/.fgos/private` 0700); returns the directory descriptor phase 10 keeps for its identity re-check. Existing directories are never chmod-ed by a read or a write (fixing a loose mode is doctor's, Slice D).
- `OpenFile` offers `read_all()` (bounded by the profile's input bound plus one, so oversize is refused before parse), `revision()` (sha256 of exactly the bytes read from this descriptor; same string format as `Document::revision`, `packages/yaml-doc/rust/src/document.rs:181`), `metadata_mode()`, `dir_identity()` (dev, ino of the parent directory fd, used by phase 10's pre-replace re-check).
- `select_source(scope_dir_fd, names: [config.yaml, config.json]) -> Source` implements the file selection: only `.yaml` present is Yaml; only `.json` present is LegacyJson (unless its bytes equal the tombstone text exactly, then Absent); both present is `config-legacy-shadowed`; none is Absent.
- `check_modes(file_or_dir, expected) -> Result<(), Finding>` returns a finding (not a refusal): a read of a 0644 global file succeeds with a `mode` note; fixing it is Slice D. A write keeps the existing mode and creates new global-scope files with 0600 and `private` with 0700 (via `fgos_durable_file::install_once_with_mode`, `packages/durable-file/rust/src/lib.rs:146`).
- Non-Unix targets: every entry returns `config-platform-unsupported` (decision in plan risks; gate G4).

## Steps

1. Merge `origin/main`. Write `open_beneath` in Durable File first with its own tests, then the selection logic in `src/files.rs`.
2. Tests on real temp dirs (about 24): regular file read; missing leaf; missing directory; file symlink; directory symlink at `.fgos`; symlink at an intermediate component; `..` in the relative path; absolute relative path; root itself is a symlink (the caller-supplied root is resolved once and the refusal names it); non-regular leaf (FIFO, with `O_NONBLOCK` so the test cannot hang); oversize file; revision equals the sha256 of the bytes **read** when the file is replaced between `open` and `read` (open the descriptor, rename another file over the path, read: the revision is of the old bytes); selection matrix (yaml only, json only, both, tombstone only, tombstone plus yaml); mode of a created private dir is 0700 and global file 0600 under a 022 and a 077 umask; the `ENOSYS` fallback is exercised by calling the fallback walker directly (a plain function, not a switch).
3. Fallback walker and `openat2` path must give the same refusals on the same cases: one parametrized test table runs both implementations over the same temp tree.

## Owning proofs

| Behaviour | Proof |
|---|---|
| No symlink, no escape, one open for read and revision | `tests/files_open.rs` |
| One source per scope, tombstone | `tests/files_select.rs` |
| Modes on create and on write | `tests/files_open.rs` mode cases |

## Validation

`cargo test -p fgos-config --test files_open --test files_select --jobs 4`, clippy, fmt; on a machine whose kernel lacks `openat2` the fallback cases still run (they call it directly).

## Risk

| Risk | L x I | Mitigation |
|---|---|---|
| `rustix` API differs between kernels (no `openat2`) | L x M | fallback walk tested on the same machine by forcing the fallback path through a function parameter, not an env switch; reviewer checks every mapping of errno to refusal |
| `openat2` flags wrong, silently following a symlink | L x H | tests with a symlink at every position under both implementations; the table test compares them |
| Path-based Durable File replace afterwards (check-to-rename window) | L x H | `dir_identity()` re-check in phase 10; residual window named; idea I3 |
| Linked worktrees: each worktree's `.fgos` must be a real directory | L x M | test with a real `git worktree` layout (a directory named `.fgos` inside a second root); no symlinked `.fgos` support is added |
| Tombstone text compared loosely | L x M | exact byte comparison, one trailing newline policy fixed by a test (text with and without a trailing newline are both listed in the fixture and the decision is pinned) |

## Rollback

Revert: new file and tests only.

## Note added 2026-10-23 (coordinator)

D17 changed: the open-beneath primitive goes into Durable File (`open_beneath`, on `rustix` already present in `Cargo.lock`), with no `unsafe` in either crate; this phase calls it from `src/files.rs`. Its owning proofs (symlinked directory refused, symlinked file refused, path outside the root refused, revision from the same open file) live in Durable File; `fgos-config` keeps one wiring proof per rule it maps to `config-path-symlink`.
