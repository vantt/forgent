# Deferred shared durable-file and canonical-JSON moves

Supervisor publication and terminal records, markers and group-hint replacement now use `fgos-durable-file`. Removed their private write/fsync/link/rename implementations. The leaf retains one write implementation; two mode-selecting entry points preserve terminal files’ historical `0666 & ~umask`, while existing leaf/supervisor callers retain `0600 & ~umask`.

Caller adapters preserve `Created`/`AlreadyPublished` and boolean results, propagate original pre-install `io::Error` values, and retain success after installation even when cleanup or parent sync fails. Supervisor errors still attempt temp cleanup; terminal pre-install errors retain the diagnostic temporary. Parent sync is now attempted for terminal writes without changing their success mapping.

Envelope serialization now delegates to `fgos-canonical-json`, retaining the safe-integer pre-walk, original error type/text and UTF-16 first-error ordering. Deleted the private serializer and string escaper. All five existing golden vectors retain their exact canonical bytes and SHA-256 digests. Added coverage for nested unsafe numbers, float/integer-looking float rejection, all control escapes, non-BMP key ordering and safe-range endpoints.

The requested standalone package gate exposed a pre-existing canonical leaf decimal-parsing failure (`333333333.33333329` became `333333333.33333325`). Enabled serde_json’s production `float_roundtrip` feature in the canonical crate; its existing decimal vectors now pass without altering fixtures or envelope formats.

Proof (private shell-only `CARGO_TARGET_DIR=/tmp/fgos-shared-moves-target`):

- `cargo test --locked --no-fail-fast -p fgos-run-supervisor -p fgos-terminal-control -p fgos-durable-file -p fgos-canonical-json`: exit 0; 217 passed, 0 failed, 1 existing live-herdr test ignored.
- `cargo clippy --locked -p fgos-run-supervisor -p fgos-terminal-control -p fgos-durable-file -p fgos-canonical-json --all-targets -- -D warnings`: exit 0.
- Added real-filesystem failure-boundary tests for both caller mappings, including already-existing targets, and a mode/umask regression test for install and replacement. Existing installer concurrency, EFBIG, symlink and replacement tests pass.
- `git diff --check`: clean. Impact-analysis: inactive (zero registered providers). No commit or lifecycle verbs used. MDView preview was attempted but its database is read-only in this worker.

Prior art: Event Store phase 01’s “Deferred one-door moves”, Git u5 M6, existing durable-file implementation and history, original supervisor serializer/publication and terminal temp helper. These existing shared primitives were extended rather than duplicated.

Coordinator follow-up: update `plans/261017-1313-fgos-platform-program-board/plan.md` to close the deferred moves after merge. It is outside this assignment’s write scope and remains untouched. No user-visible format, config default, environment variable or infrastructure dependency was added.

Status: DONE_WITH_CONCERNS
Summary: Completed the deferred shared-primitive migrations; envelope golden bytes/digests and caller result mappings remain intact, and both required Rust gates pass.
Concerns/Blockers: Program-board update requires coordinator write scope; live-herdr test remains explicitly ignored by the existing suite.
Context refs:
- (none)
