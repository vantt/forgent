# Git phase 05, unit 5 — re-review fixes

- H-1: Checkout WAL resources now include the custody directory identity (dev/inode/birthtimeNs); legacy foreign chains are closed/compacted without replay or blocking the recreated checkout, preserving terminal causes. Real rejected-Sync/remove/add/fresh-commit/fresh-Sync and legacy interruption regressions pass.
- M-a: Shared immutable-commit observation accepts exact parents/tree or newest-chain parents/verbatim message, marks changed trees as violations, and searches the branch reflog before unknown settlement; ScopedCommit and Sync cover formatter changes, later commits and ABA. Replay preserves the cause and unknown effects retain `recovery-required`.
- M-b: Native mint refuses active async drains and carries live sibling roots through the opaque loan into Rust's existing drain; the real overlapping async/native test proves neither sibling is killed, plus successful fresh commit afterward.
- M-c: Recorded receipts survive deferred compaction with a warning; recovery retains its recorded outcome. A real post-commit orphan temporary proves receipt/replay preservation and compaction at the next admission after evidence cleanup.
- M-d: E3 adds `nodeLoanScopedCommitAgedFloor`, keeping acquisition alive across 1,500 short processes before measuring the same Node-loan path; syntax checked, deliberately not executed here.
- L-a: Clean snapshots retain permission metadata, skip skip-worktree entries, and attempt every independent restore before `commit-worktree-restore-required`; SyncState optionally retains pre-merge clean-file modes. Permission/sparse and independent-restore-failure regressions pass.
- L-b: Drain contention uses retryable `borrow-drain-in-progress`; holder-lock §8 now states bounded waiting/fail-closed sibling behavior, including native loans.
- L-c: Pre-attempt recovery requires baseline HEAD and the exact staged set before unstage; unknown recovery resets only its own paths. Foreign-staging regressions pass.
- L-d: Compacted and retained Sync replay return recorded terminal causes/states; conflict-aborted replay is asserted.
- L-f: Git §12's main-checkout cutover runbook documents proven-quiescent manual quarantine of an abandoned native `index.lock`, preserving evidence and never removing holder-lock files.

Reused custody_lock_path, checkout admission, Publication's ledger/Authority, WAL phases, immutable Git objects/reflog, snapshot inventory and the existing protected-root drain. Legacy chains and empty-mode SyncState records remain readable. Prior art: `git log -G 'admit_checkout|registerNativeHandover|compact_checkout'` (d2192042a, 9c8308897), the unit-4 report and the requested specs/design principles. Impact-analysis: inactive (zero registered providers). No agents dispatched, production switches, staging, commits or out-of-scope source edits; the program board remains the coordinator's lane.

Validation (all pass; exact commands):

```sh
cargo build -p fgos -p fgos-node-addon
cargo test -p fgos-git -p fgos-holder-lock --lib
cargo test -p fgos-git --lib --test scoped_commit_sync
cargo test -p fgos-git --test scoped_commit_sync unknown_replay_keeps_cause_and_recovery_preserves_foreign_staging
cargo test -p fgos-holder-lock --test borrow_io --test borrow_git
cargo clippy -p fgos-git -p fgos-holder-lock -p fgos-node-addon --all-targets -- -D warnings
FGOS_HOST_BIN="$PWD/target/debug/fgos" node --test test/git/scoped-commit.test.mjs test/git/sync.test.mjs test/git/lock-handover.test.mjs test/git/commit-parent-death.test.mjs test/git/cutover-grant.test.mjs test/holder-lock/run-borrowed-git.test.mjs test/runner/execution/commit-unit-work.test.mjs
FGOS_HOST_BIN="$PWD/target/debug/fgos" node --test --test-name-pattern='restore failure' test/git/scoped-commit.test.mjs
FGOS_HOST_BIN="$PWD/target/debug/fgos" node --test test/holder-lock/registry-contract.test.mjs test/architecture.test.mjs
FGOS_HOST_BIN="$PWD/target/debug/fgos" node --test --test-name-pattern='unknown rejection' test/git/commit-parent-death.test.mjs
node --check scripts/git/e3-bench.mjs
git diff --check
```

Evidence: 48 Rust library tests, 16 Git integration tests, 29 borrow integration tests, 71 focused Node tests plus the added restore-failure regression, and 52 architecture/registry tests; Clippy is clean. Final unknown-effect classification has its targeted Rust/Node checks. Logs: `/tmp/fgos-p05-u5-{lib,final-rust,replay,borrow,node,restore,contract,final-node,clippy,build}.log`. Initial fixture failures (baseline-dirty follow-up file; orphan name outside WAL's durable-temp format) were corrected and rerun. MDView preview refused its read-only database.

## Follow-ups

- L-e (capacity, unchanged): the id-binding ledger grows one entry/inode per commit indefinitely. Track retention/capacity design after phase 07; do not delete bindings in this fix.
- Coordinator host acceptance: `node scripts/git/e3-bench.mjs run --out /tmp/fgos-p05-u5-e3.json`; check both Node-loan rows against p95 ≤150 ms / p99 ≤250 ms. Full npm suite, installed-release main cutover, and macOS/Windows remain host/coordinator checks. No full npm test or E3 ran in this sandbox.

Status: DONE_WITH_CONCERNS
Summary: All requested re-review findings are fixed with focused Linux evidence and updated contracts/specs. No Git attempt is replayed.
Concerns/Blockers: Host E3 budgets, full suite and cross-platform/installed-release acceptance remain outstanding; MDView cannot write its preview database here.
Context refs:
- (none)
