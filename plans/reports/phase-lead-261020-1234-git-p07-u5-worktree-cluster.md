Worktree-cluster Git spawn bodies are deleted, but this migration is **blocked**, not accepted or ready to land. No staging, commits, activation, full npm test or E3 run was performed.

Reused native Worktree/WAL/holder borrowing, Refs CAS, Remote grants, Inspect topology and SafeRestore snapshots. Prior art: `dd35a4b4e` (admin wrapper), `902c97d58` (staged resync), `dd522f682` (checkout exclusion), and the unit-2/3 reports. Impact-analysis: inactive (zero registered providers). No new configuration, environment bypass or infrastructure dependency.

| Census row | Disposition |
|---|---|
| worktree.mjs | Reads through Inspect; create/remove/relocate/owned prune through Worktree; branch writes through Refs; push through Remote without upstream-config mutation; reset/reapply through SafeRestore. |
| session.mjs | Detached creation and guarded removal use the same ports. Registry read/append remains atomic; expensive creation runs outside its registry hold. Refused cleanup retains the registry entry. |
| loop.mjs | Typed reads; orphan deletion uses the exact tip used for ahead-count classification; retry uses snapshot-backed SafeRestore. |
| claim-port.mjs | Its existing currentHead/branch/worktree delegates now reach typed ports, outside state. No direct spawn body required editing. |
| repo-locks.mjs | runWorktreeAdd deleted. Holder delegation retained; borrowed admin authority is validated/reused by Rust. Remaining argv-shaped exports are translations for the external Land importer, not Git writers. |

Re-running the census inventory for these files leaves only npm provisioning and the project-supplied setup shell command as executable spawn candidates. These remain Execution responsibilities outside Git locks. This is a scoped caller inventory, not the whole-phase static/runtime one-door gate.

Native extensions stay in existing ports: bounded branch/comparison/reflog/checkout/remote facts; SafeRestore binds the stale checkout baseline, checks clean/staged-only requirements under custody, retains the existing binary patch on conflict/interruption, strips only platform state, and snapshots retry cleanup. Producer-only backward retry pins its previous HEAD using the existing operation-pin door until acknowledgement. Administration uses a stable main handle even when the target checkout disappears. No per-spawn Reach::Everyone was introduced.

E6 preservation (original assert.* source lines; all remain, none retired or weakened):

| File under test/runner | Lines retained | Retargeting |
|---|---:|---|
| worktree.test.mjs | 195 | Native activation fixture; final destructive fixture teardown uses fixture Git after assertions. Binary-patch assertions remain unchanged. |
| session.test.mjs | 69 | Native activation fixture; force/unreachable assertion remains an explicit failing contract conflict. |
| loop.test.mjs | 552 | Native activation fixture; exact-tip CAS and snapshot reset production path. |
| claim-port.test.mjs | 111 | Native activation fixture; existing claim/checkpoint assertions retained. |
| worktree-admin-multiprocess.test.mjs | 21 | Real native admin borrowing; stress timeout unchanged. |
| repo-locks-multiprocess.test.mjs | 17 | Real native creation under the same holder. |
| worktree-callsite-wrapper.test.mjs | 24 | Native setup; kept-checkout publication assertion retained and currently failing. |

All 989 original assertion lines are present. New worktree-ports tests cover borrowed admin, actual stale-baseline delta, custody-time clean/staged-only refusal, snapshot bytes, and retry pin/acknowledgement. No E6 labels were added to test titles. G-029/033/038/040/041 retain their setup, cleanup, reattach, patch and wrapper assertions; G-047's kept-checkout publication remains blocked below.

Focused verification uses this existing source-owned channel:

```sh
mkdir -p /tmp/fgos-work/u5-state /tmp/fgos-work/u5-fixtures
chmod 700 /tmp/fgos-work/u5-state
export FGOS_STATE_ROOT=/tmp/fgos-work/u5-state
export FGOS_TEST_FIXTURE_ROOT=/tmp/fgos-work/u5-fixtures
export FGOS_HOST_BIN="$PWD/target/debug/fgos"
export FGOS_ACTIVE_MANIFEST_PATH="$PWD/.fgos/runtime/git-addon/native-addon.json"
cargo build --locked -p fgos
node test/helpers/git-addon.mjs
node --test --test-reporter=tap test/runner/worktree-ports.test.mjs
node --test --test-reporter=tap --test-skip-pattern='8 processes|diverged session without force' test/runner/session.test.mjs test/runner/worktree-admin-multiprocess.test.mjs test/runner/repo-locks-multiprocess.test.mjs
node --test --test-reporter=tap --test-name-pattern='prune|leftover|startupReap' test/runner/loop.test.mjs
node --test --test-reporter=tap test/runner/worktree.test.mjs test/runner/worktree-callsite-wrapper.test.mjs
cargo test --locked -p fgos-git --test inspect --test worktree --test safe_restore --test refs_remote --test recovery_matrix
cargo clippy --locked -p fgos-git -p fgos-node-addon --all-targets -- -D warnings
node --test test/architecture.test.mjs
git diff --check
```

The new port suite passes 3 tests; the final explicit lock/session subset passes 30; the selected loop suite passes 6. The full worktree/wrapper run passes 75 of 78, with exactly the two unowned-prune cases and kept-checkout publication failing. The added session regression verifies that a guarded removal refusal restores the shared-store symlink while retaining its checkout and registry. All five focused Rust suites and clippy pass. The two excluded cases are not certified. Full worktree/wrapper and architecture runs expose the blockers below. Earlier integration mistakes were corrected before these final checks; no failed broad run is represented as passing.

Blockers and required integration:

- Existing force-session deletion expects an unreachable detached commit to be discarded. Worktree requires reachable delivery proof. The original assertion remains intact; no force bypass or fabricated delivery was added.
- Two existing missing-directory tests expect global prune. Native prune requires an identified, attempted WorktreeRemove. Adapters now refuse without that evidence rather than inventing an operation id or deleting unknown registrations.
- The kept-checkout merge wrapper expects an external ref move. Refs correctly refuses branch-in-use. Its publication belongs to the parallel Land owner; the primary refusal is preserved even if cleanup also refuses the undelivered candidate.
- The unchanged 8-process/160-worktree stress test timed out at 240 seconds. Its timed-out process tree was stopped. Performance at this budget remains unproved; no timeout or assertion was relaxed.
- Architecture's import inventory/layer checks pass. Its Work-edge check falsely counts `../git/restore.mjs` as a second `store.mjs` import because it matches only a basename suffix. The coordinator must tighten the existing test to exact import identity without weakening the boundary.

Settled Worktree API for the next merge-verb/bin migration:

- `createWorktreeCheckoutSync(scope, repoRoot, {path, branch?, base?, operationId?}, {waitMs?})` returns the native handle; omit branch for detached creation. Provisioning runs after it returns.
- `removeWorktree(repoRoot, path, {deliveredTo: oid, custody?, scope?})` returns the existing undefined success shape and WorktreeError on refusal. It acquires Execution custody when none is supplied, uses stable main administration, and prunes only its own removal operation. Legacy force is not native authority.
- Direct native `createGitWorktree(options).remove({path, expectedTip, deliveredTo, evidenceDigest, operationId}, held)` is the receipt/proof-bearing door. `prune({operationId})` names the recorded removal, never a fresh id.
- `gitPortOptions` is exported by the existing Inspect facade. `gitWorktrees`/`checkoutPathForBranch` consume typed rows without a porcelain round trip. Remove the remaining addWorktree argv translations with their final external importer; do not restore a spawning helper.

Outer-session commands, after resolving the conflicts above, with the same host/addon exports:

```sh
node --test test/runner/worktree.test.mjs test/runner/worktree-callsite-wrapper.test.mjs test/runner/session.test.mjs test/runner/worktree-admin-multiprocess.test.mjs test/runner/repo-locks-multiprocess.test.mjs
node --test test/runner/claim-port.test.mjs test/runner/claim-capacity-race.test.mjs test/runner/concurrent-claim-eventlog-loss.test.mjs test/runner/loop.test.mjs test/runner/loop-rununit.test.mjs
node --test test/architecture.test.mjs
env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID npm test
```

needsWrites: `test/architecture.test.mjs` (exact-import guard fix), `CHANGELOG.md` (coordinator-owned behavior note), `plans/261017-1313-fgos-platform-program-board/plan.md` (record this lane blocked). Those files and the Land/bin/merge-verb files were not edited. MDView previews of this report and the Git spec were attempted; both failed because its database is read-only.

Status: BLOCKED
Summary: Migrated the five-file cluster's Git spawn paths into typed ports and retained all original assertion lines. Native safety contracts, kept-checkout Land integration, and the unchanged concurrency budget prevent acceptance.
Concerns/Blockers: Resolve the listed conflicts and shared guard, then run the outer-session commands; this is not phase-07 acceptance.
Context refs:
- (none)
