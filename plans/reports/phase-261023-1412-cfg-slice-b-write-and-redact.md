# Phase report: write transaction and redaction (Config Slice B, phases 10 and 11)

Branch `cfg/slice-b`, worktree `/home/vantt/projects/forgent-worktrees/cfg-slice-b`. Commits: write `898d0b81f`, redaction and matrix `0c1b5e143`. `origin/main` was merged at the start (clean). No push, no merge to main.

## Gates

`free -g` first (17 GB available). `cargo test -p fgos-config --jobs 4`: all green; `write_concurrency` run three more times in a row, green each time (0.24 s). clippy `--all-targets -D warnings` clean, `cargo fmt --check` clean. No `cargo test --workspace`, no `npm test`. Impact analysis inactive; callers checked with `rg`: `Src` and `.role` (only `snapshot.rs`, and now `write.rs`), `SnapshotError` (`snapshot.rs`, `cache.rs`, `golden_snapshot.rs`, the new runners), `Snapshot` has no `Debug` caller outside the new impl.

## Line counts (comments and blanks included)

| Module | Lines | Cap | Over |
|---|---|---|---|
| `write.rs` | **320** | 200 | **+120** |
| `redact.rs` | 62 | 80 | under by 18 |
| `snapshot.rs` | 371 | (no cap now) | +31 over the 340 before this work (error conversions, one doc comment, one `pub(crate)`) |
| crate `src` total | **2,310** | 2,200 | **+110** |

`find packages/config/rust/src packages/durable-file/rust/src/beneath.rs -name '*.rs' | xargs wc -l`: 2,583. Rust tests added: `write_golden.rs` 170, `write_concurrency.rs` 295, `golden_no_echo.rs` 113, `failure_matrix.rs` 87 (665 lines); fixtures `write.v1.json` (31 cases), `no-echo.v1.json` (19 cases), `failure-matrix.v1.json`.

## Cap decision needed

Both overruns are in `write.rs`, and nothing in it is spare. I stopped trimming at the point where the next cut would remove spec behaviour. Where the 320 lines go: types and docs 75 (request, observer steps, result), target placement and file read with the legacy-JSON refusal 55, directory identity 10, the transaction `commit_observed` (refusals before the lock, lock, two checks, replace) 105, the edit pass (redundancy, set/unset, doc and why blocks, new described ancestors) 60, validation of the effective value 15. Error plumbing was already moved out by reusing `SnapshotError` (see below) instead of a second error type; rustfmt expansion is the rest.

Options, in the decision-question shape:
- A (recommended): raise the `write.rs` cap to 320 and the crate ceiling to 2,320. Cost: 120 lines more than agreed, no behaviour lost; the write door is the one place where lock, file rules, comments and validation meet, so it is the least compressible module.
- B: keep 200 and drop behaviour: candidates are the accounts target (about 12 lines), the directory-identity re-check (about 15), the observer seam (about 12, but the concurrency proofs need it), the ancestor doc lines (about 8). Each is a spec or plan requirement, so this needs the owner.
- C: move the edit pass (60 lines) into its own module `edit.rs`; it separates cleanly (pure over a document and the schemas) but the lines still count.

## What landed

**Write (`src/write.rs`)**: `commit` and `commit_observed(ctx, request, writer, observe)`; `WriteRequest { roots, lock_root, target, expected, edits, reason, acknowledge_comment_loss, lock_wait_ms }`, `Edit::{Set, Unset}`, `Step`, `WriteResult { writer_id, new_revision, applied, notices }`.
- Order: confined (`config-write-confined`, no file, directory or lock touched) -> reason rules -> legacy JSON or both formats (`config-format-legacy-json`, `config-legacy-shadowed`) -> an edit with an empty path (`config-key-out-of-scope`) -> scope and placement of every `Set` through `judge` -> the target directory created beneath its root without a symlink (`config-path-symlink`) -> the lock (`project-config` or `global-config` through `LockScope::acquire`; held or timed out is `config-write-conflict`, keyword `lock-held`).
- Under the lock: first check (revision of the bytes read from one open descriptor against `expected`; `None` means the file must not exist), edits on one in-memory document, validation of the effective value the produced bytes would give (the real sources re-read, the target's replaced, run through `snapshot::build`, so scope, placement and the schemas apply to the merge), second check plus the directory identity re-check, then `replace_durably_with_mode` (existing mode kept) or `install_once_with_mode` (new project file 0644, global and accounts 0600, directories 0700; a racing creation is a conflict). Any refusal returns before bytes are produced, and the file stays byte-identical with no temporary file (tested).
- Edits: a `Set` equal to the standard on a missing key is the notice `redundant-noop` and writes nothing; on a present key it becomes an `Unset`. A new key gets `@fgos:doc` (description, values, bounds, and the standard value as `Default`, taken from the standard layer, never a `default` keyword) then `@fgos:why [actor] reason`; a changed key keeps doc and free notes and gets a new why; new described ancestors get a doc line only; undescribed keys get a why only; a new file starts with the header and a blank line (without it the first key's comment block would swallow the header). A `comment-would-be-lost` from YAML Document passes through (carried whole in `ConfigRefusal::yaml`).
- One door: locks through `fgos-holder-lock`, replace and no-follow directories through `fgos-durable-file`, edits through `fgos-yaml-doc`, comments through `grammar.rs`, scope through `judge`, validation through `build`, file reads through `files.rs`. `SourceKind` is the target type; `SessionClass` is imported from `snapshot.rs`.

**Redaction (`src/redact.rs`)**: `render_for_display(&Snapshot, &Schemas)` replaces every node whose resolved sensitivity is `secret-value` with `<redacted>` (arrays and indexes included); `secret-reference` and `command` values are shown as stored; `Debug` of `Snapshot` prints counts and source roles only. `Snapshot::value` carries a doc line saying it is the in-process value. The crate has no resolver and no `fgos-secrets` dependency (asserted on `Cargo.toml`).

**Tests**
- `write_golden.rs` over `write.v1.json` (31 cases): byte fidelity of one deep edit, comment blocks, redundancy both ways, unset with and without acknowledgement, flow collection pass-through, four reason refusals, scope and placement refused before any lock file, the empty path, confined writer, type and bound mismatch, undescribed key, hidden text, legacy JSON, shadowed, `null` where allowed, a three-edit patch, global and accounts files created 0600 in 0700 directories, existing mode kept, stale revision, expected-absent-but-present, symlinked `.fgos` (nothing created through it), actor outside the charset written `unknown` while `writer_id` keeps the real id.
- `write_concurrency.rs`: two threads from one revision (one commits, the other `revision-changed`, the file holds exactly the winner's bytes); a child process holding `project-config` gives `lock-held` after a bounded wait and writes nothing; the child killed, the next write reclaims the lock; an outside process rewriting the file before the first check and before the second check gives a conflict and the file keeps the outsider's bytes; an observer that aborts at `Edited`, `Validated` or `SecondCheck` leaves the file unchanged and no temporary file. The observer is a parameter of the public function (same pattern as `replace_durably_observed`); no env, cfg or flag.
- `golden_no_echo.rs` over `no-echo.v1.json` (19 cases, a random sentinel pair per case): syntax error beside an account entry, mismatch beside a global secret, enum violation, duplicate key, complex key, bidi character, project `gateway.token`, account pool in the project file, merge type mismatch, oversize input, oversize scalar, both formats, secret-value rendered, and six write paths (reason, mismatched value, hidden text, legacy JSON, conflict, out-of-scope secret). Display, Debug and pretty Debug of every refusal (with the YAML part) must contain neither sentinel nor its suffix; the display form must show `<redacted>` and keep a reference.
- `failure_matrix.rs`: every producible id is expected by some fixture case or is named in `failure-matrix.v1.json` with the Rust file that proves it (`config-accounts-unavailable-confined` in `golden_snapshot.rs`; `config-platform-unsupported` is unreachable on Unix, named in `src/files.rs`); no `not-produced-here` id appears in an expectation. Coverage only; no behaviour re-run.

## Deviations from the phase text, each with the reason

- Error type: `write` returns `SnapshotError` (`Refused(Vec<ConfigRefusal>) | Io`), not a new `WriteError`. Conversions from `ConfigRefusal`, a YAML refusal, `io::Error` and `FileError` sit next to the type in `snapshot.rs`. A YAML Document refusal is `config-parse` carrying the rule in `ConfigRefusal::yaml` (the existing precedent in `standard.rs`), so a door tells `comment-would-be-lost` by `refusal.yaml.rule`. Saves about 50 lines and one type; the cost is a code that says `config-parse` for an edit refusal.
- `Writer { identity, class }`: the class stays in `roots.class` (`SnapshotRequest` already has it, required, and `SessionClass` is that one type); the identity is a separate parameter. One field, not two.
- `lock_root` is a request field: the crate reads no environment, and the registry template needs `<lockRoot>`.
- The conflict reason (`lock-held`, `revision-changed`, `directory-changed`) is `detail.keyword` of the refusal; its doc comment in `error.rs` says so. `Step`s are announced before their stage, so an outside write at `FirstCheck` is a conflict at the first check; the observer returns `io::Result` so a test can abort (the `Replaced` result is ignored, the file is already replaced).
- `expected` is `Option<String>` (`None`: file must not exist), not a two-variant enum.
- No `describe()` in `redact.rs`: `grammar::doc_line` already prints only the description for a secret kind and nothing calls a second function.
- The write door is `#[cfg(unix)]` (no-follow directories are Unix only in Durable File); other platforms get no write API, not a stub.

## Concerns

1. Spec section 7 says a redundant no-op needs no reason; the transaction validates the reason first, as the phase's refusal order says, so a redundant `Set` with an empty reason is refused. Decide if doors should pass a placeholder or the order should change.
2. Validation covers the whole effective value, so a violation already present in another layer refuses a write to this file until it is fixed (fail closed, same as the snapshot).
3. `Unset` of the only key of a section leaves `section: {}` (YAML Document's `remove` behaviour).
4. The write door creates `.fgos` (0755) or `~/.fgos` and `private` (0700) before the lock because the lock file lives beside the file for the project; this is the only thing touched before the lock after all refusals.
5. Shared test helpers moved into `tests/common/mod.rs` (`temp`, `lay_out`, `writer`, `schemas_and_standard`, `write_request`, `fixture`); `golden_snapshot.rs` now uses them and lost its copies. `src/snapshot.rs` got `pub(crate) role` and the conversions; `src/lib.rs` exposes `redact` and, on Unix, `write`.
6. Plan phase files and the board were not edited (not in the ownership list).

Status: DONE_WITH_CONCERNS
