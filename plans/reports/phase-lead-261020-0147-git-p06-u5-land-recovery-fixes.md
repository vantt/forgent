# Git phase 06 unit 5 — Land recovery review fixes

- N-H1: destination admission names and blocks an attempted Land whose next equals or precedes the current tip; regression refuses Y at X.next and a descendant, recovers X, then lands Y with reconciled `a`. No Land supersession added.
- M1: exact-old recovery compares canonical `ls-files --stage -z` digest, index tree and path fingerprints; regression rewrites an unrelated file with identical bytes and refreshes index stat data through real `git status`.
- M2: LandVerified records ignored-store reconciliation skips; post-CAS recovery records observed-only `pendingStoreCollision` and preserves checkout/index bytes. Covered in the crash-matrix suite.
- M3: named pre-attempt abandonment accepts any writer under destination 20/40/50/80; post-attempt recovery and cleanup retain writer equality. Actual SIGKILL matrix proves successor refusal, named recovery and subsequent landing after pre-attempt deaths; a separate A/B regression also checks owner-only cleanup.
- L1: publication SIGKILL fixture includes staged modification/addition and unrelated unstaged edit; every boundary checks bytes, staged contents and stage entries. Native read-tree kills use that fixture too.
- L2: existing WorktreeRemove Intent retains caller writer and the canonical authorization digest of repository/id/acknowledgement identity/writer, surviving Land compaction; regression verifies those WAL fields. Retry binds the same acknowledgement identity.
- L3: abandoned/lost terminal candidates use the existing journaled removal, custody/not-live/clean checks and exact-old pin cleanup, without external delivered reachability. Regressions cover both outcomes, foreign-writer refusal and dirty abandoned-candidate preservation.
- L4: every recovery path checks native main state before recording/replaying an outcome, including pre-attempt and off-destination checkout paths; regression preserves `index.lock` and `MERGE_HEAD` evidence.

Reused admission, ancestry, WAL proof strings, Worktree removal journal and compact ledger; prior art: `d66220926`, `ab852c202`, `159c165a8`. Updated Git spec and changelog. `impact-analysis: inactive` (zero providers); callers cross-checked in source. No full npm suite, E3, lifecycle operations, sub-agents, git add or git commit.

Verification commands:

```sh
cargo test --locked -p fgos-git --lib --test land --test land_crash_matrix --test refs_remote --test scoped_commit_sync
cargo test --locked -p fgos-git --test land_crash_matrix sigkill_at_every_acknowledged_wal_pin_cas_checkout_and_receipt_boundary
cargo test --locked -p fgos-git --test land_crash_matrix -- --skip sigkill_at_every --skip native_read_tree_syscall_crashes
cargo clippy --locked -p fgos-git -p fgos-node-addon --all-targets -- -D warnings
node --test test/git/land.test.mjs test/git/land-recovery.test.mjs test/git/refs.test.mjs test/git/scoped-commit.test.mjs test/git/sync.test.mjs test/architecture.test.mjs
rustfmt --edition 2021 --check packages/git/rust/src/land.rs packages/git/rust/src/refs.rs packages/git/rust/src/worktree.rs packages/git/rust/tests/land.rs packages/git/rust/tests/land_crash_matrix.rs packages/git/rust/tests/support/land.rs
git diff --check
```

Verification: 39 Rust library, 13 Land, 13 crash-matrix, 16 Refs/remote and 20 ScopedCommit/Sync tests passed (two matrix child/controller helpers intentionally ignored at top level); 57 publication and 34 cleanup SIGKILL points plus four native read-tree syscall boundaries passed. The final 57-point cross-writer rerun and ten targeted recovery regressions passed. All 91 focused Node/architecture tests passed; final clippy, rustfmt and diff checks passed. Initial matrix failures exposed fixture expectations after adding tolerated dirt; cleanup fixtures stay clean and native/publication expectations admit the documented Pending receipt. Convention lookup returned the assigned path. MDView preview fails because its database is read-only. The shared program-board lane update is outside this assignment's write scope and remains for the coordinator.

Status: DONE_WITH_CONCERNS
Summary: All eight Land recovery findings are addressed with focused real-Git regression coverage.
Concerns/Blockers: Shared program-board update is outside write scope; MDView preview is unavailable.
Context refs:
- (none)
