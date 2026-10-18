# Git phase 01, unit 1 checkpoint

Implemented phase-01 step 1 and the authorized creation-only portion of step 2. This is a dormant foundation checkpoint, not a Publication implementation or an Event Store handover.

- Step 1: added workspace members `fgos-git` and `fgos-durable-file`, with locked dependencies. Git exposes preliminary typed Publication, Inspect and RepositoryConfig interfaces, receipt/result types, SHA-1/SHA-256 OID validation and full-ref syntax validation. RepoHandle has no public constructor. Contracts contain the port inventory, receipt schema, result codes (including D-ADR0058 supersession), and immutable WAL envelope schema. WAL payload data and operation-specific transition validators remain unfinished; these interfaces are not frozen.
- Step 2: added dependency-free-in-fgOS durable installation using checked `write_all`, file fsync, no-overwrite hard-link/unlink on Unix and MoveFileExW without replacement on Windows, followed by explicit parent-directory fsync. Errors distinguish pre-install failure from an installed name with unconfirmed durability. Partial writes retain their temporary file and never install a record. Callers own trusted-directory validation and ancestor creation/fsync.
- Steps 3–4: driver, env contexts, containment, hardened invocation, NUL parsers and repository resolution remain for the next unit. Only the Oid/RefName validation portion was implemented early. No production Git subprocess or mutation exists in this crate.

Evidence, all using `CARGO_TARGET_DIR="$PWD/.fgos/runtime/phase-target"`:

- `cargo test -p fgos-git -p fgos-durable-file`, then final `cargo test --locked -p fgos-git -p fgos-durable-file`: 9 integration tests passed (6 durable-file, 3 Git); the EFBIG test also passed in its isolated child process. Tests exercise a 16-writer race, existing symlink preservation, a real RLIMIT_FSIZE partial write/EFBIG, and ref syntax against Git in an OS-temp bare repository.
- `cargo clippy -p fgos-git -p fgos-durable-file --all-targets -- -D warnings`: passed. The first run found a large error variant; boxing its optional receipt fixed it.
- `rustfmt --edition 2021 --check` on all four new Rust files: passed. Python Draft202012Validator checked both schemas and positive/negative TargetAttempt vectors. `git diff --check`: passed.

Prior art: reused the existing hard-link installation mechanism, introduced in supervisor commit `a98895c8e` and terminal-control commit `0411b9e0e`, while fixing ignored/missing directory-sync errors in the new leaf. Both caller moves are explicitly deferred: `packages/run-supervisor/rust/src/publish.rs` and `packages/terminal-control/rust/src/store.rs` were untouched because lane 6.3 owns them now. The next authorized lane must replace those duplicate paths once that collision clears.

Open limits: Linux evidence only; Windows/macOS behavior and stable-media durability are unproved. No fault-injected post-install directory-fsync test yet. Git floor/config trust, WAL implementation, authority borrowing, Publication recovery and the remaining phase-01 proof gates are pending. `impact-analysis: inactive` (zero registered providers). No npm suite was run for this dormant Rust-only checkpoint. The program-board row needs a coordinator update; its file is outside this unit's write scope. No add/commit was run.

MDView preview was attempted but failed because its database is read-only; the Markdown report remains readable on disk.
