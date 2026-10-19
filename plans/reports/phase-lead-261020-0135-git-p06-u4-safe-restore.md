# Git phase 06 unit 4: SafeRestore

Implemented dormant Rust `preview_restore`/`apply_restore`/`recover_restore`, addon `GitSafeRestore`, and Node `createGitSafeRestore`. Production callers remain for phase 07. The existing checkout scope/config-stamp door supplies main 50 or verified producer custody without another producer lock; custody-keyed WAL resources also exclude lifecycle operations.

Reused and extended ScopedCommit's `SavedPath` capture (durable serialization, bounded no-follow reads, full modes), rather than adding another capture mechanism. Durable digest-addressed snapshots precede TargetAttempt/reset and retain raw index, binary staged/unstaged patches, untracked/incoming ignored collisions, symlinks and modes. Reapplication preserves index/tree separation. Recovery never repeats an attempted effect, preserves uncertain current bytes/native residue, and permits a fresh explicit operation after closing the prior observation. WAL/schema/port metadata, architecture manifest, spec and changelog agree.

Prior art: `902c97d58` introduced resync reset/reapply; `589777f5d` added orphan-patch refusal. ScopedCommit snapshot/recovery improvements in `d2192042a` and `869e789d7` provide the reused door. No legacy writer was replaced in this unit. Impact-analysis: inactive (capability query returned zero providers).

Validation (real temporary repositories):

- `cargo test -p fgos-git --test safe_restore -- --test-threads=1 --nocapture`: 4 passed, 1 child entry ignored; 78 actual SIGKILL checkpoints across snapshot/WAL/reset/deltas/modes/receipt, recovery, and fresh operation success. Includes native residue, later edits and corrupted evidence refusal.
- `cargo clippy -p fgos-git -p fgos-node-addon --all-targets -- -D warnings`: passed.
- `cargo test -p fgos-git --test contracts -- --nocapture`: 3 passed.
- `cargo test -p fgos-git --test scoped_commit_sync --test land --test publication --lib`: 101 passed, 1 child entry ignored.
- `node --test test/git/safe-restore.test.mjs test/git/scoped-commit.test.mjs test/git/land.test.mjs test/architecture.test.mjs`: 78 passed. Final `node --test test/git/safe-restore.test.mjs test/architecture.test.mjs`: 33 passed, including the added ignored-collision case.
- `git diff --check` and JSON parsing: passed. No full npm test, E3, staging or repository commit.

Limits: capture refuses above 32 MiB aggregate file/index bytes or 128 MiB serialized bytes. Snapshot/WAL retention is deliberate; compaction refuses to discard a Restore snapshot binding. Unsupported index flags, submodules, special files, symlink parents and tracked `.fgos` fail closed. Native-lock repair and the general Recovery port are later units. MDView preview failed with its read-only database. The required program-board lane update was not written because that path is outside the assignment scope.

Status: DONE_WITH_CONCERNS
Summary: SafeRestore is implemented and verified through Rust, addon and Node, with durable snapshots and observe-only recovery. Production migration remains dormant.
Concerns/Blockers: Documented capacity/retention limits; program-board update needs write scope for `plans/261017-1313-fgos-platform-program-board/plan.md`.
Context refs:
- (none)
