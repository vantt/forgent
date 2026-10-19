# ES 08 host gate (es/p08-migrate)

Date: 2026-10-19, Asia/Saigon. Host fg-server2. Branch tip aa237c062: ES 08 merged with origin/main 99cbe7c5c (Git 05 on main) in ee152e4ea, plus two fix commits. Private `CARGO_TARGET_DIR`, `FGOS_HOST_BIN` from that build, `FGOS_STATE_ROOT` and session ids unset. No release was activated and no real migration ran on this repository.

## Verdict

**Superseded by the update at the end: green after the coordinator's decision, pushed.** First pass: one failure in the full suite was caused by ES 08: `test/event-store/migrate-cutover-grant.test.mjs` fails all 5 tests under `npm test`, but passes 5/5 with zero skips when run alone. Fixing it needs an owner decision (see below). Every other failure is either pre-existing on main or caused by the gate environment.

| Check | Result |
|---|---|
| Merge origin/main | Conflict in CHANGELOG.md only; both sides kept. `driver.rs` auto-merged, so Git 05's driver changes and ES 08's read-only `hash_object` both remain. |
| `cargo test -p fgos-event-store -p fgos-git -p fgos-node-addon` | 261 pass / 0 fail / 2 ignored (40 binaries) |
| `cargo clippy` on the same three crates, `--all-targets -D warnings` | clean |
| Focused Node tests (`test/event-store/*`, `test/setup/event-store-*`, `test/git/*`, `test/architecture`), one process per file | 27 files, 200 tests: 199 pass, 0 fail, 1 skip. The skip is the Windows-only native-load case in `test/git/native-load.test.mjs`. |
| Real-hook proof alone on this host | `migrate-cutover-grant.test.mjs`: 5/5 pass, **0 skipped**, no quiesce diagnostics, in both standalone runs (focused run and failure rerun). `migrate.test.mjs`: 9/9 pass, 0 skipped. |
| `npm test` | 8452 tests: 8270 pass, 85 fail, 32 skipped, 65 todo. Classification below. |

## Changes made in this gate

- `0df1996ca` and `aa237c062`: the three test files this branch added now import `test/helpers/process-tmp-root.mjs` first. `phase08-fixture.mjs` is a helper, not a test file, and is unchanged.
- `aa237c062`, which re-checks the outcome decoding against Git 05 as merged:
  - `cutover_operation_id` now matches `fgos_git::wal::Outcome` directly. This is re-review Low-2; the type is `pub` in `pub mod wal`, and event-store already depends on fgos-git, so there is no dependency cycle. **There was also a real gap.** The old tag check freed the attempt id for every `commitRejected`. Git 05 records `CommitRejected { cause: "commit-effect-unknown" }` from `recover_scoped_commit` and `"foreign-checkout-effect-unknown"` from foreign-checkout closure, and its replay turns both into `recovery-required`. A new id would have bypassed that recovery refusal. Now only `AbandonedBeforeAttempt` and a `CommitRejected` whose cause does not end in `effect-unknown` free the id.
  - The `cutoverFailure` restore set no longer includes `untrusted-worktree`. Git's `checkout_call` re-resolves topology before every child, including the `commit` and the `rev-parse HEAD` after `TargetAttempt`. So this refusal can follow an attempt that Git neither restored nor closed. Every other code in the set is raised before WAL `begin`, in `scope()`, in `commit_scoped`'s preamble, or in the staging block that Git's own restore covers. `commit-rejected` is returned only after Git's reset-and-restore succeeds; if that restore fails, the result is `commit-worktree-restore-required`, which is recovery-class. Tests now cover `foreign-checkout-effect-unknown`, `commit-effect-unknown: reflog-only-candidate:*`, refused `untrusted-worktree` and refused `foreign-checkout-abandoned` (none of them restore).
  - `checkout-compaction-deferred` appears only in `warnings` on a returned receipt. ES 08 accepts only `status === 'committed'` and never restores after a commit, so this warning cannot trigger a restore.

## npm test failures, classified

Each failing file was rerun alone. The rerun used a release workspace compiled in the private cargo dir and linked at `target/release`.

| File (failures) | Alone | Class | Evidence |
|---|---|---|---|
| `test/event-store/migrate-cutover-grant.test.mjs` (5) | 5/5 pass, 0 skip | **introduced by ES 08** | Real `checkStopped` reports `blocked`. Every blocker is a sibling process of the same `npm test` run: `…/es-p08/bin/fgos.mjs setup|list|take|move|…` with cwd under `/tmp/fgos-test-run-CNSmhF/` or `/var/tmp/fgos-test-fixtures-bI2wDA/`, plus `environ` hits from unit-run producers. Host quiesce (`names_payload` in `packages/holder-lock/rust/src/route.rs`) treats any `bin/fgos.mjs` / `fgos` process on the host as a blocker, and the test turns a blocked scan into `assert.fail`. Before Git 05 landed, these cases were skipped. |
| `test/rust-host/fgctl-*` (7 files, 64), `release-targets` (1), `release-tree` (3), `setup/active-release-drift-check` (1), `holder-lock/fences-rust-locks` (4) | all pass | environment | The worktree's `target/` held no release artifacts (`Compiled native addon not found …/release/libfgos_node_addon.so`, missing fgctl). With the release workspace linked, all pass. |
| `test/setup/run-supervisor-checks.test.mjs` (4) | 24/24 | environment | Socket path length under the nested suite temp root, as in the Git 05 gate |
| `test/holder-lock/fences-v1-tombstone.test.mjs` (1) | fails | pre-existing on main | `Cannot find package 'yaml'` from the temp-root copy (Git 05 gate) |
| `test/runner/execution/run.test.mjs`, `test/run-supervisor/cancel-registry.test.mjs` (file-level) | fail | pre-existing on main | Same SIGINT file-exit pattern as the Git 05 gate |
| `test/setup/skill-wrappers.test.mjs` (1) | fails | environment (fresh worktree) | Git-ignored generated `.claude/skills` render is absent |

`test/runner/execution/run-sync.test.mjs`, which failed in the Git 05 gate, passes here (fixed on main by 75bae4346).

## Decision needed: real-quiesce tests inside the parallel suite

- **What happens:** with Git 05 present, the five cutover tests run the real host quiesce. Inside `npm test`, sibling test files always run fgOS processes, so the quiesce reports `blocked` and the tests fail. The same thing happens on any shared machine where another session runs `fgos`.
- **Cause:** the production quiesce is host-wide by design. The test chose a hard failure so that the host gate cannot pass on a skip.
- **Options and cost:**
  1. In the test only, skip when every blocker belongs to the current test run (cwd or argv under this run's `fgos-test-run-*` / `fgos-test-fixtures-*` roots). The skip names the reason. A standalone run never triggers it, because its own processes are excluded by `ownPidChain`, so the zero-skip host proof still comes from running the file alone. The cost: the full suite no longer proves the real hook, and processes from other sessions still fail it.
  2. Add a serial lane to `scripts/run-tests.mjs` for files that need a quiet host, run after the parallel batch. The suite keeps the proof. The cost: a new runner mechanism, and other sessions can still block it.
  3. Keep the hard failure and run the file only in host gates. The cost: `npm test` stays red on every machine.
- **Recommendation:** option 1 plus a host-gate step that runs the file alone. It is test-only, small, and keeps the proof where it is meaningful.
- **What the answer covers:** only these real-quiesce Event Store tests, not production quiesce semantics.

## Update: coordinator decision applied

The coordinator chose none of the three options. Production quiesce stays machine-wide, because Event Store spec §18 step 1 says migration is a one-time stop-everything cutover. Following the precedent of 6d9d05968 (`test/setup/holder-lock-checks.test.mjs`), b48c0d464 gives the migrate fixture a shim host as `ctx.hostBin`. The shim forwards to the real host and appends the host's existing `--workspace-only` flag to `internal quiesce-scan`. The real scan still runs, but only processes working inside the fixture workspace count. The PID-namespace refusal is unchanged, because the host checks it before scoping.

The former payload-classification case is now "a process working inside the fixture workspace blocks migrate before any Git or ref effect". A real `bin/fgos.mjs events migrate` payload waits with its cwd in the fixture. The scan reports it as the blocker, and `migrateUseCase` refuses with `event-store-writers-active` naming its pid. HEAD, `refs/fgos/legacy` and the legacy files stay unchanged.

Results after merging origin/main again (3b698b9cc, which brings in 7c56c4501, the temp-root signal fix):

| Check | Result |
|---|---|
| Focused Node tests, one process per file | 27 files, 200 tests: 199 pass, 0 fail, 1 skip (the Windows-only native-load case) |
| `migrate-cutover-grant` / `migrate` / `rollback-export` alone | 5/5, 9/9, 1/1, **0 skipped** |
| `npm test` (release workspace linked at `target/release`) | 8461 tests: 8358 pass, 6 fail, 32 skipped, 65 todo. All 5 cutover cases and the typed-outcome case pass inside the suite with **0 skipped**. |
| Remaining failures | `fences-v1-tombstone` (1, pre-existing `yaml`), `run-supervisor-checks` (4, socket path length under the suite root, environment), `skill-wrappers` (1, git-ignored render absent in a fresh worktree). `run.test.mjs` and `cancel-registry` now pass because of the main fix. |
