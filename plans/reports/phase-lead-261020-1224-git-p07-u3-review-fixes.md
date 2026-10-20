Git phase 07 unit 3 addresses the unit-2 review. Changes remain uncommitted for the runner.

| Finding | Disposition / implementation | Proof |
| --- | --- | --- |
| H1 | Fixed in native ScopedCommit selection: omit tracked/untracked `.fgos` paths unless explicitly admitted by the existing legacy-event/cutover contracts. Preserve silent omission and Unit reporting. Removed the shared fixture exclude; only the unrelated rename-parser fixture excludes runtime lock artifacts. | Broad-scope untracked test retained; added tracked modified config test, including unchanged committed blob and preserved worktree bytes. Both pass. |
| M2 | Fixed: `LegacyEventLayout::validate` checks the real main-50 handle through holder-lock validation before either commit door selects/replays. Closed-layout validation remains shared with the hook, whose inherited-descriptor borrower check is retained. | Real hooks confirm main-checkout borrowing for additions, modifications, deletions and Checkpoint; existing owned-hook archive, traversal and linked-worktree tests pass. |
| M3 | Added the runner crash-state regression: native commit complete, runner operation still pending; resume must settle committed with the same SHA/files/HEAD. The existing adapter already translates completed native `kind: commit` correctly, so no translation change is needed. | Direct adapter receipt/recovery test passes without another commit/hook. New runner regression requires outer-session execution (see limitation). |
| M4 | Fixed: unknown recovery id returns `unknown-scoped-commit-operation`; only persisted pending intent can become abandoned-before-attempt. Initialize WAL before the recovery lock so first-ever recovery uses WAL-owned directory permissions. | New Rust regression checks unknown error/no invented record and durable pending-intent abandonment; passes. |
| M5 | Fixed: moved the single hook-failure helper into the Git driver; ScopedCommit and Sync both use it. Preserve original stderr bytes/text, owned-only Git replay and generic foreign-hook classification. Clarified spec §16 G-062. | New owned/foreign ScopedCommit adapter cases pass, including replay counts, exact stderr bytes and rollback. Existing Sync/provenance tests pass. |
| L6 | Fixed: native detail spreads before adapter status/reason/error. | Adapter regression suite passes; precedence visible in the return literal. |
| L7 | Fixed: removed every `E6 retargeted:` test-title prefix. | Repository search finds none. E6 kept: existing commit/sync assertions and foreign-hook `git-error` expectation. Retargeted: native fixture authority/activation, typed literal-path refusal and owned/foreign hook provenance; mapping lives here instead of test names. |
| L8 | Fixed: restored the unrelated pre-unit-2 Rust formatting. | Diff against `512e8cd2a` contains contract/test additions, without the old inspect/recovery/signature formatting-only hunks. |
| L10 | Added a real Sync lifecycle test with an observing wrapper that calls the original check: fresh run calls it zero times; busy custody refuses before inspection; resumed manual completion gets verified custody and settles merged. | Syntax checked; execution is blocked at real case admission in this sandbox. No bypass was added. |

Reused the existing ScopedCommit/WAL, holder-lock borrower validation, hook provenance and Unit recovery doors. Prior art: `82ca7102a` and `512e8cd2a`; impact-analysis: inactive (zero registered providers). No new mechanism, config default, environment switch or infrastructure dependency. Changelog updated.

Verification (source-owned host/addon channel; directories created before running):

```sh
mkdir -p /tmp/fgos-work/u3-state /tmp/fgos-work/u3-fixtures
chmod 700 /tmp/fgos-work/u3-state
export FGOS_STATE_ROOT=/tmp/fgos-work/u3-state
export FGOS_TEST_FIXTURE_ROOT=/tmp/fgos-work/u3-fixtures
export FGOS_HOST_BIN="$PWD/target/debug/fgos"
export FGOS_ACTIVE_MANIFEST_PATH="$PWD/.fgos/runtime/git-addon/native-addon.json"
node test/helpers/git-addon.mjs
node --test --test-skip-pattern='ScopedCommit probes config' test/git/scoped-commit.test.mjs test/git/sync.test.mjs test/git/inspect.test.mjs test/git/legacy-event-adapter.test.mjs test/git/repository-config.test.mjs test/git/cutover-grant.test.mjs test/git/commit-parent-death.test.mjs test/runner/execution/git-core-adapters.test.mjs test/runner/execution/commit-unit-work.test.mjs test/runner/execution/partial-writes.test.mjs test/architecture.test.mjs
node --test test/git/legacy-event-adapter.test.mjs
node --test --test-name-pattern='resolveGitRoots|sync aggregation|syncBase needs writes' test/runner/execution/run.test.mjs test/runner/execution/run-sync.test.mjs
cargo test --locked -p fgos-git --test scoped_commit_sync --test recovery_matrix --test repository_config --test contracts
cargo clippy --locked -p fgos-git -p fgos-node-addon --all-targets -- -D warnings
git diff --check
```

The focused Node suite passed 118 tests; three selected runner contract tests also passed; the subsequently added borrower suite passed both tests. Rust suites and clippy passed. No full npm test or E3 was run. Initial setup failures (missing state directory and wrong host pointer), a hook-fixture escape, and a compacted-receipt assertion were corrected before the passing runs.

Outer-session check still required:

```sh
node --test --test-name-pattern='resume settles a pending runner record|sync resumability is checked only on resume' test/runner/execution/run.test.mjs test/runner/execution/run-resume-order.test.mjs
```

Both new lifecycle tests hit `nested-write-from-confined-worker` before their test bodies can reach the target lifecycle behavior. The production guard and assertions are intact. The program-board update is outside this Unit's write scope and is requested from the coordinator. MDView preview failed because its database is read-only.

Status: DONE_WITH_CONCERNS
Summary: Fixed the native selection, authority, recovery and hook-classification findings, plus review cleanup; added regression coverage for both runner lifecycle findings.
Concerns/Blockers: The two new runner lifecycle regressions need the outer-session command above; this is not whole-phase acceptance.
Context refs:
- (none)
