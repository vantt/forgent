# Git phase 05, unit 6 — second re-review fixes

- H-A: Completed WIP lifecycle/checkout exclusion: Remove/Move-source carry directory custody resources; checkout admission rejects active Create/Remove/Move path resources by kind; WAL/schema accept the binding. Both-direction real Git regressions pass (including clean landed effects with no receipt).
- M-A: Reflog-only matches remain recovery-required with candidate OID evidence and retained WAL/index; exact parent/tree matching precedes message matching. Reset-away-before-attempt, ABA and overtaken-effect regressions pass.
- L-A: Foreign Intent/Prepared chains close as foreign-checkout-abandoned; attempted chains close as foreign-checkout-effect-unknown, with recovery replay classification, pin release and propagated closure errors. Git §8 now states these boundaries precisely.
- L-B: One bounded log -g call supplies all candidate headers/messages; candidate processing stops at the baseline barrier after a candidate entry (no per-entry cat-file processes).
- L-C: SyncIntent records its symbolic branch; recovery refuses changed branches and unrecorded legacy branches. Added branch-switch regression; schema remains backward readable.
- L-D: Existing sync/run commit result aggregation preserves warnings from earlier sync state and merge/commit results, including sync-only results and failures; focused aggregation regression passes.

Reused the WIP implementation (dd522f682), custody_lock_path, refs admission, WAL transitions/ledger, and existing result fields. Prior art: git log -G 'observe_checkout_commit|worktree_resources' (dd522f682, 869e789d7, 0568323ee); requested reviews, Git §8/§10/§12 and design principles read. Impact-analysis: inactive (zero registered providers). No new test file; test/helpers/process-tmp-root.mjs is absent on this branch. Convention queried; owner-specified report path retained. No staging, commit, full npm suite or E3.

Validation (exact commands):

```sh
cargo test -p fgos-git --lib --test scoped_commit_sync
cargo test -p fgos-git --test scoped_commit_sync
cargo test -p fgos-git --test scoped_commit_sync preexisting_reset_away
cargo clippy -p fgos-git --all-targets -- -D warnings
FGOS_TEST_FIXTURE_ROOT=/tmp FGOS_HOST_BIN="$PWD/target/debug/fgos" node --test test/runner/execution/commit-unit-work.test.mjs
FGOS_TEST_FIXTURE_ROOT=/tmp FGOS_HOST_BIN="$PWD/target/debug/fgos" node --test --test-name-pattern='sync aggregation preserves' test/runner/execution/run-sync.test.mjs
node --check src/runner/execution/unit-sync.mjs
git diff --check
```

Evidence: 37 Rust library tests; final integration suite 19 tests; 30 Node commit tests and one warning aggregation test; Clippy clean. Logs: /tmp/fgos-u6-{final-rust,final-integration,old-candidate,clippy,commit-node,warning-node}.log. Initial WIP test compilation/private-method and unstaged Sync fixture errors were corrected. The broader Node run-sync suite cannot pass here: /var/tmp is read-only, and using its existing fixture-root setting then reaches confinement-probe-failed (executor-credentials unverified); no bypass added. MDView refused its read-only database.

## Follow-ups

- Per coordinator decision, migrate Node callers to native ScopedCommit/Sync receipts in phase 07; native ports remain dormant. Current callers generate no native compaction receipt, but existing aggregation now retains warnings supplied to it.
- Host: broader confined Node sync suite, E3 aged-floor budgets, full npm suite and installed-release/cross-platform acceptance remain coordinator gates. Capacity/ledger inode growth remains the existing follow-up.

Status: DONE_WITH_CONCERNS
Summary: Completed all six second re-review fixes on top of the WIP, with focused Rust and Node evidence and updated Git contracts/documentation.
Concerns/Blockers: Broader confined Node sync tests and host acceptance remain outstanding; MDView preview is unavailable.
