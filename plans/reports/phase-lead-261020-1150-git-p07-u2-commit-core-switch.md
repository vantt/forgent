Unit commit/sync now run through native ScopedCommit, Sync and Inspect; their Node Git-spawning bodies are deleted. All four Unit-1 blockers are resolved on `git/p07-switch`; nothing is staged, committed or landed by this worker.

- Reused literal NUL staging and the existing WAL: selected star/tab/newline filenames commit and replay losslessly as JSON strings. The WAL schema documents that encoding; invalid byte paths still fail with lossless diagnostics.
- Added typed, main-50-only `legacyEvents.exactPaths` to ScopedCommit/Checkpoint and the temporary Work adapter. The existing hook grant check admits only declared event deletions; the real-hook archive test passes. WORK owns deletion of the adapter, declaration and temporary grant branch. Work/Land callers remain their respective lanes' work; Land has no implicit sweep.
- Reused RepositoryConfig provenance for owned-only `git hook run pre-commit` diagnostics. Foreign hooks run once, receive generic failure classification, and retain original stderr text/bytes. Fixed provenance lookup over compacted non-config operations.
- Persisted native producer baselines, original writer identity, Sync ids and pending ScopedCommit requests. Native custody-backed recovery handles commit-only retry, interrupted retry preparation/pins, manual completion/abort and resolver details. The Unit adapter calls existing Sync abort before returning a rejected clean-start merge. No baseline is fabricated on legacy resume.
- E6: all 87 original commit-test and 135 original sync-test assertion lines remain verbatim. Retargeted fixture authority/activation and test labels; changed only the owner-authorized native literal-refusal and foreign-hook classification expectations. E3's legacy control is now an immutable history fixture (`512e8cd2a68300848bf13859d46872f7fbe94951`), preserving its old assertions without retaining a production writer.

Prior art: `0074f94ae`, `d2192042a` and `75bae4346`; reused native staging, WAL, custody, hook provenance, pin and abort doors. `impact-analysis: inactive` (zero providers). No new config default, environment switch or infrastructure dependency.

Focused verification: 114 Node tests passed, plus 3 root/contract checks; the 8 direct adapter tests passed again after final translation changes. Six selected Rust suites passed; focused clippy and syntax/whitespace checks passed. Node commands used this existing development-manifest channel and writable fixture roots:

```sh
export FGOS_STATE_ROOT=/tmp/fgos-work/u2-state
export FGOS_TEST_FIXTURE_ROOT=/tmp/fgos-work/u2-fixtures
export FGOS_HOST_BIN="$PWD/target/debug/fgos"
export FGOS_ACTIVE_MANIFEST_PATH="$PWD/.fgos/runtime/git-addon/native-addon.json"
cargo build --locked -p fgos
node test/helpers/git-addon.mjs
node --test --test-skip-pattern='ScopedCommit probes config' test/git/scoped-commit.test.mjs test/git/sync.test.mjs test/git/inspect.test.mjs test/git/legacy-event-adapter.test.mjs test/git/repository-config.test.mjs test/git/cutover-grant.test.mjs test/git/commit-parent-death.test.mjs test/runner/execution/git-core-adapters.test.mjs test/runner/execution/commit-unit-work.test.mjs test/runner/execution/partial-writes.test.mjs test/architecture.test.mjs
node --test --test-name-pattern='resolveGitRoots|sync aggregation|syncBase needs writes' test/runner/execution/run.test.mjs test/runner/execution/run-sync.test.mjs
node --test test/runner/execution/git-core-adapters.test.mjs
cargo test --locked -p fgos-git --test scoped_commit_sync --test recovery_matrix --test repository_config --test inspect --test refs_remote --test contracts
cargo clippy --locked -p fgos-git -p fgos-node-addon --all-targets -- -D warnings
git diff --check
```

Limits: full mutating `run-sync` dispatch tests are refused by this worker sandbox's `nested-write-from-confined-worker` guard; run them in an outer session with the source-owned manifest above. The phase-07 gate lane must bind its full-suite launcher to that source-owned host/addon channel. An initial broad focused invocation inadvertently entered the existing scoped-census test and failed before measurement; final verification explicitly excludes it. No E3 verdict or full npm-test result is claimed. MDView preview failed because its database is read-only. The platform board update is outside this Unit's write scope and is requested in `needsWrites`.

Status: DONE_WITH_CONCERNS
Summary: Switched the Unit commit/sync core to native ports and resolved the four Unit-1 blockers. Remaining caller families, shared matcher migration and phase-08 release gates stay open.
Concerns/Blockers: Outer-session dispatch verification and board update remain; this is not whole-phase acceptance or permission to land.
Context refs:
- (none)
