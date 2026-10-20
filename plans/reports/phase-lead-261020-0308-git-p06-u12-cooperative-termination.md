# Git phase 06 unit 12: Cooperative termination

Option A implemented. Holder-lock sends SIGTERM to the borrowed child group, waits the internal `terminate_grace_ms` (3000 ms beside `kill_wait_ms`), then forces termination if needed and uses the unchanged unreaped-root drain/reach rule. Deadline errors carry `terminated` or `killed-after-grace`. Direct Git containment uses the same grace. Audit: the only `LocalMutation` caller is fetch's update-ref CAS; checkout/index children borrow custody. Cleanup adds no Git execution.

Land, SafeRestore, ScopedCommit and Sync share `native-index-lock-unowned`, pointing to inspection and Git spec §11. Other foreign Land state keeps its own honest diagnostic. Unknown lock inspection adds visible inode holders (pid/exe/start time), size/mtime/age, bounded no-follow pid-sidecar text and the counsel's verbatim runbook. Process supplies generic read-only file-user facts; no ownership is inferred. Existing shared quarantine and its test-only index recorder remain. Specs/contracts and CHANGELOG agree; option B is deferred until observed killed-after-grace plus native residue. No spawn-time ownership, new config or environment switch.

Passing focused verification:

- `cargo test -p fgos-process -p fgos-holder-lock`
- `cargo test -p fgos-holder-lock --test borrow_io deadline -- --nocapture` — cooperative O_EXCL cleanup, ignored TERM/residue, real read-tree deadline; namespace case explicitly unverified below.
- `cargo test -p fgos-git --lib native_lock -- --nocapture` — 8 passed.
- `cargo test -p fgos-git --test scoped_commit_sync --test safe_restore -- --test-threads=1` — 20 + 17 passed; ignored crash-child entry is invoked by its parent matrix.
- `cargo test -p fgos-git --test scoped_commit_sync native_index_lock -- --nocapture` — 2 passed, including newly explicit Sync/commit refusal assertions.
- `node --test test/git/native-lock-repair.test.mjs test/git/land-recovery.test.mjs test/architecture.test.mjs` — 37 passed; final focused Node rerun after the inspection adjustment: 8 passed.
- `cargo clippy -p fgos-process -p fgos-holder-lock -p fgos-git --all-targets -- -D warnings`; `git diff --check` — green.

Initial SafeRestore checks exposed two old-message assertions (updated) and an executable-rebuild race caused by overlapping test invocations; the isolated serial matrix passed. No full npm test, E3, git add or commit. Impact-analysis: inactive (zero registered providers). Reused Process proc enumeration/inode matching, holder-lock's borrow/drain and Git's bounded no-follow artifact reader and quarantine door.

Status: DONE_WITH_CONCERNS
Summary: Option A is implemented and focused checks pass; unknown native locks remain inspection-only.
Concerns/Blockers: This sandbox rejects bwrap PID namespace creation, so the included real Git-as-pid-1 test reports UNVERIFIED and must run on an eligible host. MDView preview failed because its database is read-only. Required program-board lane update is outside the write scope and is left for the coordinator (`plans/261017-1313-fgos-platform-program-board/plan.md`).
Context refs:
- (none)
