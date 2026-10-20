# Git phase 06 unit 7 — Land re-review fixes

H-1: strict descendants of the unique candidate now close attempted recovery with observed-only Land and checkout pending, preserving checkout/index bytes. The receipt means the checkout may remain unreconciled or reverted. Exact-next admission stays blocked for guarded recovery. Real-Git regressions commit ordinary user work after both pre-read-tree and post-read-tree crashes, recover X without ref rewind, then land Y; foreign writers remain refused. The separate exact-old/stat-refresh regression remains.

M-1: prepare/publish check native main state only when the destination is checked out there. Unresolved recovery retains unconditional native-state and target-topology checks. L-a: writer equality is rechecked against the chain inspected under slot 20. L-b: terminal/compacted replay returns before native-state checks. Regression covers unrelated MERGE_HEAD/BISECT_START through prepare, publish, terminal and compacted recovery; existing unresolved recovery tests still preserve native state.

Reused the ancestry port, existing pending observed-only Outcome/receipt and native-state gate; prior art: d66220926, ab852c202, 5e8090cf7. Updated Git spec §9/§10 and changelog. impact-analysis: inactive (zero providers); callers cross-checked with rg. Convention lookup confirmed this report path. Re-review file retained unchanged. No full npm test, E3, lifecycle verbs, git add or git commit.

Exact verification commands (final checks passed):

```sh
cargo test --locked -p fgos-git --lib --test land --test land_crash_matrix --test refs_remote --test scoped_commit_sync
cargo clippy --locked -p fgos-git -p fgos-node-addon --all-targets -- -D warnings
node --test test/git/land.test.mjs test/git/land-recovery.test.mjs test/git/refs.test.mjs test/git/scoped-commit.test.mjs test/git/sync.test.mjs test/architecture.test.mjs
rustfmt --edition 2021 --check packages/git/rust/src/land.rs packages/git/rust/tests/land_crash_matrix.rs
git diff --check
```

Proof: 39 library, 13 Land, 15 crash-matrix, 16 Refs/remote and 20 ScopedCommit/Sync tests passed; two matrix subprocess helpers intentionally ignored at top level. Includes 57 publication and 34 cleanup SIGKILL points plus four native read-tree syscall boundaries. All 91 Node/architecture tests passed. An initial test compile caught two assertion mistakes; corrected. An overlapping rebuild replaced the running matrix executable and caused child-spawn ENOENT; the final complete Rust run without rebuilding during execution passed.

Status: DONE_WITH_CONCERNS
Summary: H-1, M-1, L-a and L-b are fixed with focused real-Git regression coverage.
Concerns/Blockers: MDView preview failed because its database is read-only. Shared program-board lane update is outside write scope and left for the coordinator.
Context refs:
- (none)
