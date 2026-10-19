# Event Store phase 08: migration and rollback

Implemented dormant HEAD inventory/read, deterministic legacy import through real Git Publication, migration parity and the documented Git 05 ScopedCommit adapter, legacy write admission, legacy-layout doctor, and rollback coverage. Reused the frozen Rust legacy order, verified reader, production Work/porting reducers, setup fixes, holder-lock quiesce scan and Publication/WAL ports. No new configuration, dependencies, CLI registrations, repository staging or commits. No unrelated edits.

Inventory discovers arbitrary tracked porting paths and their sibling views; more than one refuses. Import validates input before publication, preserves bytes under the prescribed names, creates a parentless deterministic commit and reuses an equal ref. The seal authenticates the data tree without seal.json. Check-only writes no objects/ref/commit (the existing setup fixes can repair local state/config). Migration compares entity and serialized Work views, revision, matching-anchor cache and optional baseline, then repeats parity through the actual published reader before deletion. Reparse authenticated legacy raw lines in the Node facade to preserve JavaScript property insertion order: entity equality alone missed a real revision/serialization difference on this repository's history. Historical porting preserves physical log order, including clock rollback; rollback folds nested historical logs plus new root records.

Q5(a) is approved in the plan: code first, migration second. No sourceCommit runbook route is needed. The absent Git 05 handoff was read with `git show git/p05-commit-sync:plans/reports/phase-lead-261019-1629-git-p05-scoped-commit-sync.md`. The adapter calls createGitScopedCommit → preflight → commit with writes/message/exact deletion grant, after releasing event-seal. Ordinary failures restore tracked bytes only with unchanged HEAD; uncertain/committed outcomes remain Git-owned. Interrupted dirty inputs name `event-store-cutover-<fromCommit>` for Git record inspection.

**Git integration concern:** Git 05 at `4a7f429a5c64574edc740e364d1972ff252e46da` (`git/p05-commit-sync`), `packages/git/rust/src/scoped_commit.rs:441-451`, selects the fence only if a shard directory is deleted. Baseline-only repositories such as mdview therefore need that Git-owned fix. Their check/import/parity work; non-check migration explicitly refuses before effects until the selection is fixed. Remove the corresponding migration restriction with that fix and prove the baseline-only real-hook case. This file is outside scope, listed in needsWrites. The program-board lane update also belongs to the coordinator outside scope.

Validation (impact-analysis: inactive, zero present providers; history/caller checks via git log and rg):

```sh
cargo test --locked -p fgos-event-store legacy_import
cargo test --locked -p fgos-event-store -p fgos-node-addon
cargo clippy --locked -p fgos-event-store -p fgos-node-addon --all-targets -- -D warnings
node --test test/event-store/migrate.test.mjs test/event-store/migrate-cutover-grant.test.mjs test/event-store/rollback-export.test.mjs test/git/cutover-grant.test.mjs
node --test test/event-store/*.test.mjs test/setup/event-store-*.test.mjs test/architecture.test.mjs
node --input-type=module -e "import {ensureHostBin} from './scripts/run-tests.mjs'; console.log(ensureHostBin({...process.env,FGOS_HOST_BIN:''}));"
env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID FGOS_HOST_BIN="$PWD/target/debug/fgos" npm test
mkdir -p /tmp/fgos-work/es-p08-suite
chmod 700 /tmp/fgos-work/es-p08-suite
env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID FGOS_STATE_ROOT=/tmp/fgos-work/es-p08-suite FGOS_HOST_BIN="$PWD/target/debug/fgos" npm test
git diff --check
```

Rust final: 142 passed, zero failed, one existing ignored qualification test. Clippy clean. Focused final Node: 7 passed, one deferred Git 05 test; the successful command-level check is unavailable because the real quiesce scanner refuses this PID namespace, and that refusal is tested. The real-history fixture copies 91 tracked Work event files into a temporary repository: 33,717 unique records, imported reader and pre-cutover fold agree byte for byte. Tests cover dirty/untracked input, ambiguous porting, changed HEAD/ref, repeated import, invalid-event no-effect refusal, sealed-tree tampering, baseline/cache parity, migration-required/missing-pin write refusal, nested-porting rollback after v4 writes, and old-writer ENOTDIR.

Final scoped Node regression: 87 passed, zero failed, one Git 05 integration skip (including both real strace gate windows). The exact requested Node command was rerun after the raw-line correction: 7 passed, zero failed, one skip; The Git 05 grant file is absent, so that command supplies no grant-suite evidence. Default npm stopped at EROFS opening `/home/vantt/.local/state/fgos/locks/full-suite.lock`; the retry uses the already supported state-root setting, with no bypass. The final serial full-suite retry completed with 8,309 tests: 7,254 pass, 856 fail, 134 skipped, 65 todo. New migration/rollback cases passed in it. Failures include read-only `/var/tmp` fixtures and unavailable terminal/supervisor behavior; they were not all individually triaged, and this is not a green full suite. The earlier overlapping attempt (7,225 pass/885 fail) had addon digest mismatches and runtime-artifact drift caused by my concurrent rebuild; the serial final run had neither. Logs: `/tmp/fgos-work/es-p08/es-p08-{rust-final,clippy-final,node-focused-final,requested-final,node-regression,npm,npm-writable,npm-final}.log`.

**One deferred integration gate after Git 05 merges and is activated:** real-hook migration (including baseline-only fence), wrong/extra/replayed grants, TargetAttempt crash/recovery and second-run no-op; run the Git 05 grant suite too (`test/git/cutover-grant.test.mjs` is absent here). The pending Event Store test contains a real migrate invocation, automatically enabled when the Git export exists; no mock Git 05 or alternate writer. Fixture-only fence commits test rollback, not grant acceptance. Successful main-root command quiescence/setup and the crash case also require the writable host. Coordinator owns Opus review and merge. MDView preview was attempted and failed on its read-only database. The report retains the assigned 17:00 path; convention lookup returned the current-clock 17:05 alternative.

Status: DONE_WITH_CONCERNS
Summary: Implemented phase 08's dormant import, reader/parity, admission, doctor and rollback behavior with real repository evidence; Git 05 integration remains gated.
Concerns/Blockers: Baseline-only fence selection needs the out-of-scope Git fix; real-hook/crash proof, host quiescence and a green full suite remain required before cutover.
Context refs:
- (none)
