# Review: Git phase 06 units 9-11 (e7d9ccbef..5e512a829)

**Verdict: merge-ready for the dormant landing, with concerns.** I found nothing at Critical or High. There are five Medium findings. Fix M1 and M2 before phase 07 wires any Recovery caller. They do not change live behaviour today, and every touched test suite is green. Production attribution of native index.lock ownership was out of scope and is not flagged. I found no path that lets a repair adopt a lock without ownership evidence: `record_owned_index_lock` is now `#[cfg(test)] pub(crate)`. Quarantine still requires `NativeLockOwned` (or the ConfigChange staging capture the writer created with `create_new`). The post-rename inode recheck refuses a substituted inode and restores it without overwriting.

## What I checked and ran

I read the full diff, the three lead reports, the unit-8 review, phase-06 requirements 7-10, and the Git spec §5/§11 changes. I also traced the callers of every port that now takes the recovery leaf. All builds went to a scratch `CARGO_TARGET_DIR` outside the worktree. `git status` stayed clean.

- `cargo test -p fgos-git -- --test-threads=1`: everything passed. That covers lib 47, land 13, land_crash_matrix 15, publication 29, recovery_matrix 1 (24 real SIGKILL cases), refs_remote 16, repository_config 6, safe_restore 17, scoped_commit_sync 20 and worktree 7.
- `cargo test -p fgos-event-store -- --test-threads=1`: all passed. I ran it because of M1: Event Store is a live caller of the changed `PublicationPort::recover`.
- `cargo clippy -p fgos-git -p fgos-node-addon --all-targets -- -D warnings`: clean.
- `node --test test/git/github-adapter-contract.test.mjs test/architecture.test.mjs`: 30 passed.
- I did not run `test/git/recovery.test.mjs`. Its helper builds the addon into `<worktree>/.fgos/runtime/git-addon`, which is a workspace write and not allowed in this read-only review. The lead reports say it passes.

## Focus answers

- **Recovery door is a pure dispatcher.** Yes. `packages/git/rust/src/recovery.rs:79-130` routes each kind to its owning port's existing recovery: `recover_land`, `recover_scoped_commit`, `inspect_sync`, `recover_restore`, `repair_worktree_registration`, `PublicationPort::recover`, and the change_config recovery. Refs and non-event transfers had no recovery before; they only refused with `operation-recovery-required`. Their new observe-only entries live in their own modules (`refs.rs:1011`, `remote.rs:628`), so there is no second path. One small DRY issue is listed under Low.
- **Lock order.** Each port takes its own scope and then `recovery::leaf` last: refs/transfer at 40, then 80; Land at 20→40→50, then 80; checkout scopes, then 80; worktree-admin, then 80. Recovery (80) sits above state (60), and no Git recovery settles state. The ConfigChange exception is sound. `recover_config_change` runs through `change_config`, which takes `repo-config` 80 with a 5 s wait. Under that lock it quarantines and settles every active ConfigChange, then answers for the requested id by request digest. So two ConfigChange recoverers serialize, and so do a recoverer and a writer. A ConfigChange recoverer can run beside a recoverer of another kind, but they touch disjoint resources (config versus refs/index), so they cannot interleave harmfully.
- **Compaction keeps the request digest and terminal receipt.** Yes. `inspect_operation` on a compacted id returns `requestDigest` and `outcome`, and `reconcile_operation` returns the retained outcome without any effect. The matrix asserts both for all twelve kinds.
- **The matrix is real.** Each case runs the real operation port under ptrace and SIGKILLs at the first fsync after the Intent record exists. That gives 12 kinds × 2 orders (Recovery first, owning port first), each on fresh repositories, with real custody and seal handles. Compaction uses each kind's own door (Restore acknowledge, Land acknowledge, Publication release+compact) or the WAL compactor while the owning lock is actually held. The limits are stated honestly: it covers only the pre-attempt row (see M5), and the assertion at `recovery_matrix.rs:577` compares owning-port output only when it differs from the retained outcome.
- **Hooks scope rules.** Correct. The slot counts as empty only when no `file:` scope supplies a value (`hooks_value` takes the last fact in precedence order). Ownership, the exact-old guard and removal use only the common local config. Removal is `--fixed-value --unset-all` on a draft of the local file.
- **configSequence provenance.** Correct. The sequence is assigned under repo-config, after active chains are settled and before `begin`. `Some(0)` is rejected and the schema has minimum 1. Ties at the top refuse in both hooks provenance and fetch-mapping provenance. Historical chains without the field keep their digests.
- **Quarantine inode recheck after rename.** Correct. A late-swap regression test covers it.
- **GitHub contract test realism.** Weak; see M3.
- **E3 rows.** Mostly like for like. Both sides use fresh paired fixtures with the same bytes and topology. Legacy Land skips verify through its own identical-tree rule, and its candidate is kept on the fixture disk through TMPDIR. The legacy number still includes disposable-worktree setup, which is the real legacy cost, so that is fine. The rows are unmeasured; see Low.
- **Layering and one door.** No new layer. `src/git/recovery.mjs` is registered as infra in the architecture manifest. The Node addon special-cases PublicationCas by building a `GitPublication`, which acquires event-seal 58 itself. That is transport only, and it refuses caller loans.

## Critical
None.

## High
None.

## Medium

**M1. The recovery leaf is now taken on live Event Store paths, with zero wait and a non-retryable code.** `packages/git/rust/src/publication.rs:872-873` acquires `recovery` with `Wait::Ms(0)` inside `PublicationPort::recover`. That function is called by `recover_publications`, which Event Store's seal, sync, promote and legacy import call (`packages/event-store/rust/src/seal.rs:161`, `sync.rs:346,375`, `promote.rs:155`). It is also reached from `compare_and_swap` on `Begin::Existing` (`publication.rs:1401`).

Once phase 07 wires any Git Recovery caller, a seal that meets a pending publication chain while an unrelated Land or Restore recovery holds the repo's leaf will fail with `Refused`. `refs::failure` sets `retryable: false`. The units are described as dormant, yet this live-path change is not mentioned in the reports or the changelog.

Fix: take the leaf only on the Recovery-door path. One way is to have `reconcile_operation` acquire it around the `PublicationCas` arm, or to add a `recover_with_leaf` entry, and leave the plain `recover` unchanged. Otherwise, use a bounded wait and map contention to a retryable busy code.

**M2. The remote transfer lock contract changed without a spec update.** `packages/git/rust/src/remote.rs:197` now acquires `worktree-admin` 40 for every non-event fetch or push. Before, it used `remote_scope`, which took no lock and accepted held ranks below 60. That `remote_scope` is now used only by line 141.

Spec §5 still says "Remote fetch/push of non-event refs | none | anything below 60". A caller holding `main-checkout` 50 now gets `lock-order-violation`.

Fix: update the §5 row to say worktree-admin 40, permitted below 40, and give the reason (exclusion with its recovery). Alternatively, keep transfers lock-free and take 40 only in `recover_transfer`. Then check the remaining `remote_scope` user for consistency.

**M3. The GitHub adapter contract test asserts the test's own sequence, not production behaviour.** In `test/git/github-adapter-contract.test.mjs:21-27`, the test itself calls `viewGitHubPRStatus` after the timeout. Production `mergeGitHubPR` (`src/runner/github-adapter.mjs:189-203`) checks status first, but it sends `gh pr merge` again even when the state is already `MERGED`. A re-approve after an uncertain timeout therefore sends a second merge, which breaks "queried before any new request". The adapter also classifies the timeout as `blocked`/`unreachable`. The regex guard `/execFileSync\(['"]git['"]/` is narrow and misses `spawn`, `execFile` and helper wrappers.

Fix: call `mergeGitHubPR` twice in the test and assert exactly one merge request. Then either add the MERGED short-circuit to the adapter (a one-line behavioural guard, not the phase 07 code move) or record the gap explicitly in spec §3 and the board. Widen the guard to any `'git'` child invocation.

**M4. SafeRestore extraction refuses whenever any registered worktree directory is missing.** `packages/git/rust/src/restore.rs:735` calls `registered.canonicalize().map_err(failure)?` for every row. A prunable registration whose directory was deleted makes every `extractPath` fail with an opaque IO error. Evidence extraction is exactly what an operator reaches for when the repository is messy.

Fix: on `NotFound`, skip the row. A missing directory cannot contain the existing canonical destination. Then add a test with a prunable worktree.

**M5. The new post-attempt branches of `recover_ref_operation` and `recover_transfer` are untested, and ref recovery never releases its pin.** The matrix covers only the pre-attempt row. `refs.rs:1027-1045` (checkout custody, dirty status, native lock present, `observed == next`) and `remote.rs:637-640` (Transfer unknown) have no test.

`recover_ref_operation` appends `Success` or `AbandonedBeforeAttempt` but never calls `release_pin`. The pin is installed before `Prepared` (`refs.rs:724`). So after a crash between pin install and Prepared, or after a post-attempt Success, `refs/fgos/git-operations/<id>/candidate` stays. `compact_inner` (`wal.rs:2143`) then refuses with `RecoveryRequired`. The operation is terminal, absent from `listPending`, cannot be compacted, and keeps the candidate reachable until someone re-calls `change_ref` with the same id.

Fix: call `release_pin(self, repo, admin, &wal, &terminal)` after the outcome, as the `Begin::Existing` path does. Add ptrace rows at the after-pin, after-TargetAttempt and after-CAS boundaries for refs and transfers; the `land_crash_matrix` technique already exists.

## Low

- **L1.** `recover_config_change` (`repository_config.rs:778-790`) duplicates the body of `recover_hooks_config` (`:792-813`). Make `recover_hooks_config` call `recover_config_change` and then inspect.
- **L2.** On the ConfigChange path, `reconcile_operation` silently drops caller loans (`recovery.rs:107-114`). Refuse non-empty `held` there, as the Node PublicationCas path already does, so a caller holding repo-config fails fast instead of timing out after 5 s on its own lock.
- **L3.** In the matrix, ConfigChange's "owning recovery" is a successor `ensure_hooks("successor")` (`recovery_matrix.rs:447-455`), not `recover_hooks_config(ID)`. Use the per-id recover so the comparison is like for like.
- **L4.** `local_hooks_value` (`repository_config.rs:612-614`) decides local scope by origin-path equality. The neighbouring code says "scope, rather than origin spelling, determines trust" and uses `--show-scope`. A mismatch fails safe (it refuses), but `--show-scope local` would be more robust with symlinked or relative origins.
- **L5.** The tracked-alias check (`restore.rs:231-243`) stats every tracked entry for every collision path. That is O(collisions × tracked). Stat `p` once and compare only against case-folded-equal tracked names.
- **L6.** Compacted `inspect_operation` omits `kind` (`recovery.rs:52-55`), although compaction retains the intent digest. Add it when it can be recovered from the receipt.
- **L7.** The spec's "Dormant Recovery" subsection still says "The full interrupted-operation matrix remains required acceptance evidence", which unit 11 superseded. Its heading also says "unit 9" while it describes unit 10 behaviour.
- **L8.** The E3 typed rows were never executed, so the 1.5 and 1.2 p95 budgets are unproven. Each sample also runs legacy before port in a fixed order; alternate the order to cancel warm-cache bias.
- **L9.** In the quarantine substitution branch (`native_lock.rs:316-332`), a foreign `index.lock` may be created between the rename and the hard-link restore. The code reports this honestly (it is retained in quarantine). Only `renameat2(RENAME_EXCHANGE)` closes the window. Document it in the §11 runbook.

## Unresolved questions

- Is the Git `recovery` registry entry (owner 4.2, `scope: run`, v1 source `src/verbs/dispatch/recover.mjs`) intended to be reused with `runDir = <common>/fgos/git`? The phase file prescribes "recovery 80", but the registry note still names only the dispatch use.
- `recovery.test.mjs` was not run here (see above).

Status: DONE_WITH_CONCERNS
Summary: Units 9-11 are merge-ready as a dormant landing, with no Critical or High findings and all touched Rust suites, event-store, clippy and the runnable Node tests green. Five Medium items remain; fix M1 (leaf on live Event Store recover with zero wait) and M2 (transfer lock row drift) before phase 07 wiring.
