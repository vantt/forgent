# Git phase 01 unit 6: containment fast exit

Linux bwrap spawn now preserves successful creation when namespace init has already been reaped. Its reported `child-pid`, under the existing `--unshare-pid --as-pid-1` contract, becomes a `linux-gate` tombstone with reserved start time `exited-before-identity`. Driver and record-only emptiness checks return empty; kill is a no-op, even after PID reuse. The waiting monitor remains untouched and returns the actual exit status. Missing info reports remain namespace-unavailable; unreadable process facts never prove emptiness.

Reused the existing Linux zombie-capable `tuple_of` reader and member scans (present since c1e79c6ad); a98895c8e introduced the current namespace-init launch/failed-spawn cleanup. No Linux platform fact change was necessary. macOS now shares its BSD info reader between ordinary observations and unreaped-child identity capture; ordinary zombie liveness remains dead. No supervisor or terminal-control files changed.

Added 1,000 `/bin/true` spawns for each Unix driver, a Linux zombie identity test, a tombstone/PID-reuse no-signal test, a fast-exited pgroup leader leaving a grandchild, and bwrap nonzero-status coverage. Existing bwrap coverage verifies reported host PID against NSpid and namespace PID 1. Fixed the two fd-leak-test clippy findings by reaping the helper grandchild in a thread and simplifying its descriptor predicate.

Validation uses `CARGO_TARGET_DIR=.fgos/runtime/phase-target`:

- `cargo test --locked -p fgos-process -p fgos-git -p fgos-holder-lock -p fgos-durable-file`
- `cargo clippy --locked -p fgos-git -p fgos-holder-lock -p fgos-durable-file --all-targets -- -D warnings`
- `cargo clippy --locked -p fgos-process --all-targets -- -D warnings` (stronger than requested lib-only check)
- `git diff --check`

Impact-analysis: inactive (zero registered providers). The real pgroup loop and grandchild cleanup pass. Namespace-dependent bwrap tests explicitly skip here; coordinator host verification remains necessary. macOS runtime/compilation needs a macOS host. MDView preview failed with a read-only database. A changelog entry requires `CHANGELOG.md`, outside the authorized write scope; it was not edited. No git add or commit was run.

Status: DONE_WITH_CONCERNS
Summary: Fixed containment fast-exit handling and added regression coverage; required local Rust checks pass.
Concerns/Blockers: Coordinator must exercise bwrap on the real host; macOS checks require macOS. Changelog entry is outside scope.
Context refs:
- (none)
