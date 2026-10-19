# Git phase 05, unit 4 — review fixes

- H1: Intent/Prepared chains close inline and at checkout admission; explicit ScopedCommit `recover` observes immutable parent/tree proof or closes an unchanged-HEAD unknown outcome under quiescent custody without replay; Sync records hook rejection, observes interrupted commit outcomes and permits abort. Durable-state and real SIGKILL tests each permit a fresh-id commit afterward.
- M1: The existing Rust drain receives live sibling borrow roots and the acquisition reach floor; concurrent async borrows are waited on/fail closed, never killed. A new borrow refuses only during a drain snapshot. Production async callers remain in provider-capacity and goal-check; concurrent borrows were not removed. The two-live-borrow regression passes.
- M2: ScopedCommit and Sync compact terminal chains immediately through Publication's existing WAL ledger, after Sync pin release; exact-request replay reconstructs files from immutable commits. Tests assert empty retained history, released pins and replay after compaction.
- M3: Abort restores clean merged paths in index/worktree to HEAD, including target-only additions; recorded conflict paths retain resolver bytes. Without a recorded conflict state, merge paths return to HEAD. Spec and mixed clean/conflict regression agree; a fresh scoped commit succeeds afterward.
- M4: Clean tracked snapshot entries retain only a HEAD marker; only dirty/untracked/ignored/absent paths capture state. Rollback still restores modes, binary bytes, symlinks and producer moves. Snapshot inventory reuses its dirty/tracked lists.
- M5: Existing E3 Publication rows own Rust handles, so the same benchmark now adds `nodeLoanScopedCommit`, acquiring Node custody and lending it through the addon for every call; it builds/accepts an explicit matching host. Syntax checked; benchmark deliberately not run here.
- L1: Rollback comment now states that any inline failure with unchanged HEAD restores producer bytes.
- L2: Exit status 1 alone retains the prior generic `git-error` label and original message; no hook replay or guessed hook-refused classification. Single-invocation hook regression passes.
- L3: Baseline content digests now identify changed excluded paths and expose them as `preExistingInScope`; regression verifies exclusion and preserved producer bytes.
- L4: Unsupported literal control/star paths refuse as `unscopable-commit-path` before staging or Intent; three literal-path regressions verify unchanged index/bytes and absent operation records.
- L5: Grant comment credits the host route for sealing slot 3; removed the inert `as_fd()` call/import.
- L6: Spec §7 now describes TargetAttempt/no-outcome, seal SHA-256 and the consumer-created fence; §8/§10 document recovery and abort semantics.
- L7: An unchanged tracked fence is retained without staging it; index-parent/gitdir comparison canonicalizes both sides. Rust cutover tests cover new and already-tracked fences; compacted grants retain a named spent refusal.

Reused LockScope, WAL transitions, Publication compaction, WalReader, literal staging, immutable commit reads and the existing description drain. Prior art checked with `git log -G` (0074f94ae, 4a7f429a5, c9c378839, 54cc2f788); impact-analysis: inactive (zero registered providers). No agents dispatched, out-of-scope edits, staging or commits. Program-board changes remain the coordinator's lane.

Validation from this worktree (no Cargo target override):

```sh
cargo build -p fgos -p fgos-node-addon
cargo test -p fgos-git -p fgos-holder-lock --lib
cargo test -p fgos-git --test scoped_commit_sync
cargo test -p fgos-holder-lock --test borrow_io --test borrow_git
cargo clippy -p fgos-git -p fgos-holder-lock -p fgos-node-addon --all-targets -- -D warnings
FGOS_HOST_BIN="$PWD/target/debug/fgos" node --test test/git/scoped-commit.test.mjs test/git/sync.test.mjs test/git/commit-parent-death.test.mjs test/git/cutover-grant.test.mjs test/git/lock-handover.test.mjs test/holder-lock/run-borrowed-git.test.mjs test/runner/execution/commit-unit-work.test.mjs
FGOS_HOST_BIN="$PWD/target/debug/fgos" node --test test/git/scoped-commit.test.mjs test/git/sync.test.mjs test/git/commit-parent-death.test.mjs test/git/cutover-grant.test.mjs test/git/lock-handover.test.mjs test/holder-lock/registry-contract.test.mjs test/architecture.test.mjs
FGOS_HOST_BIN="$PWD/target/debug/fgos" node --test test/git/commit-parent-death.test.mjs test/git/sync.test.mjs
FGOS_HOST_BIN="$PWD/target/debug/fgos" node --test test/git/scoped-commit.test.mjs
node --check scripts/git/e3-bench.mjs
git diff --check
```

Results: 48 Rust library tests, 11 Git integration tests, 29 borrow integration tests, 66 focused Node tests, architecture/registry assertions, and Clippy pass. The final snapshot-inventory cleanup passes the 11 Rust / 16 Node targeted reruns; recovery also verifies quiescent custody before terminal observation, with a final 9-test Node recovery/Sync rerun. Earlier test failures exposed a stale pin-release chain and a fresh-commit fixture writing baseline dirt; both were corrected and rerun. Logs: `/tmp/fgos-p05-u4-node.log`, `/tmp/fgos-p05-u4-scoped.log`, `/tmp/fgos-p05-u4-recovery.log`. MDView preview refused its read-only database.

No full npm test or E3 run in this sandbox. Coordinator host command: `node scripts/git/e3-bench.mjs run --out /tmp/fgos-p05-u4-e3.json` (not executed here); changing-CAS p95/p99 budgets and the additional Node-loan measurements remain host acceptance evidence.

Status: DONE_WITH_CONCERNS
Summary: H1, M1–M5 and L1–L7 are addressed with focused Linux evidence and updated contracts/specs. No ref-moving attempt is replayed.
Concerns/Blockers: E3 budgets, full suite, installed-release main cutover and macOS/Windows acceptance remain coordinator checks.
Context refs:
- (none)
