# Phase 04: Machine files in the crate (private directory, token file, accounts-only read, mode findings)

Depends on 03. Suggested executor: sonnet. Cap: `machine.rs` 190 lines.

## Context

Spec sections 3, 8, 9: `~/.fgos/private/` (0700) holds `accounts.yaml` and `gateway-token` (0600); the token is one line, not YAML, no comment grammar, created by Durable File's create-only install with mode 0600 at creation, only when missing; a snapshot taken by a confined session has no accounts layer. Slice B already reads the accounts file as a layer of `snapshot` (`snapshot.rs:read_sources`, `Unconfined` only) and can write it (`SourceKind::Accounts`, `write.rs:place`); it has no token handling, no ensure for the directory as a use case, and no read of the accounts layer without a valid project file.

## Files it may touch

`packages/config/rust/src/machine.rs`, `tests/machine_files.rs`, `contracts/fixtures/machine-files.v1.json`, `contracts/failure-codes.v1.json` (append `config-token-invalid`), `contracts/fixtures/no-echo.v1.json` (one case appended: a token-invalid error contains no token bytes) and the matching table row in `tests/failure_matrix.rs` fixtures.

## Design (reuse first)

- `ensure_private_dir(global_dir) -> Result<DirIdentity, SnapshotError>`: `fgos_durable_file::ensure_dir_beneath(parent, <dir>/private, 0o700)` (already used by `write.rs:dir_identity`); refuses a symlinked `~/.fgos` or `private` with `config-path-symlink` (existing id).
- `token::read(global_dir) -> Result<Secret, ConfigRefusal>`: open `private/gateway-token` beneath (`read_beneath`, `files.rs:66`, which already refuses symlinks and returns mode and revision), refuse when not regular, mode wider than 0600, or not exactly one non-empty line of printable ASCII (<= 512 characters after one optional final newline): `config-token-invalid` with a `reason` keyword (`mode`, `shape`, `symlink`), never a byte of the value (D6). `Secret` wraps the string, has no `Debug`/`Display` of the value, and is the only way the token leaves the crate (spec: `secret-value` is carried in-process to the consumer that needs it).
- `token::ensure(global_dir, random: impl FnOnce() -> [u8; 32]) -> Result<Ensured, ...>`: `ensure_private_dir`, then `install_once_with_mode(dir, "gateway-token", hex(random) + "\n", 0o600)`; `AlreadyExists` is success (never rotated, as `fixGatewayTokenConfigured` today). The production caller passes `os_random` (reads `/dev/urandom` on Unix; Windows returns `config-platform-unsupported`, gate G4). Holds the `global-config` lock (`locks::GLOBAL_CONFIG`, `scope_params`) so a setup and a gateway start cannot both create.
- `accounts::read(ctx, roots, class) -> Result<AccountsView, SnapshotError>`: `build` (`snapshot.rs`) over the accounts source **alone** (no project, no global): it is judged as `SourceKind::Accounts`, merged over the standard layer and validated, so the schema nodes apply; the result is the plain-data subtree `{runner: {llmAccounts, providers: {<p>: {accounts}}}}` (what the account readers consume) plus `present: bool` and the revision. `Confined` returns `present: false, state: unavailable-confined` without opening the file (reuses `AccountsState`, `snapshot.rs:64`). A missing file is `present: false`, not an error; a broken file is an error with file, line, column and no value.
- `modes(global_dir) -> Vec<ModeFinding>`: the four paths of spec section 9 (global config file, `private/`, `accounts.yaml`, `gateway-token`) through the existing `files::check_mode` (`files.rs:50`); `fix_modes` applies chmod through the opened descriptor (never by path), only to those four.

## Steps

1. Merge `origin/main`. Write fixtures first (`machine-files.v1.json`, about 20 cases), then `machine.rs`.
2. Cases: directory created 0700; existing 0755 directory reported by `modes`; symlinked `private` refused; token created 0600 with one line and a newline; second `ensure` keeps the bytes; token with group read refused; token with two lines refused; token with a trailing space refused; token as a symlink refused; error text contains no token byte; accounts-only read succeeds while a broken `config.json` sits beside it; confined read returns unavailable without touching the file; accounts file with a key that has no schema node is kept and reported by doctor later (not here); an accounts value of the wrong type is a schema error naming path and keyword; `ensure` while the lock is held by a child process returns `config-write-conflict` after the bound.
3. `cargo test -p fgos-config --test machine_files --test golden_no_echo --test failure_matrix --jobs 4`; clippy; fmt. Source total in the commit message.

## Owning proofs

| Behaviour | Proof |
|---|---|
| Modes, symlink, one line, create-only, no echo, accounts-only, confined | `tests/machine_files.rs` over `machine-files.v1.json` (real fs temp dirs) |
| Failure id coverage | Slice B's `failure_matrix.rs` (the new id is added to its fixture) |

## Risk

| Risk | L x I | Mitigation |
|---|---|---|
| Randomness source on a machine without `/dev/urandom` | L x M | `ensure` returns a named error; doctor reports; no fallback to a weak source |
| Two creators race | L x M | global-config lock plus create-only install; the loser sees `AlreadyExists` and succeeds |
| Token read refuses a 0644 file and the gateway will not start | M x M | message names the fix; doctor `config-global-permissions` offers chmod (phase 08); D6 recorded |
| Accounts-only read bypasses a rule the full snapshot applies | L x M | same `build` and judge path, one test compares the accounts subtree to a full snapshot's on a clean fixture |

## Rollback

Revert: new files plus one failure id and one fixture case; nothing links them yet.
