# Re-review: Git phase 06 unit 5 (Land recovery review fixes), 0c26f17c9..5e8090cf7

**Verdict: Land is not merge-ready.** M1, M2, M3 and L1-L4 are fixed as claimed. The N-H1 fix does stop the staged-revert hazard, but it creates a new permanent block: after a post-CAS crash, one ordinary `git commit` on the destination blocks every future Land on that destination, for every writer. No recovery door remains. I reproduced this. The L4 fix also widened the main-checkout native-state check into prepare and publish. As a result, a merge or bisect in progress on an unrelated branch now refuses every Land, which is a Medium regression.

## Method

- I read the full diff, the previous review (`f388f49f6`), the fix report, and Git spec §9/§10 with the recovery table.
- The worktree stayed read-only. I exported both `5e8090cf7` and `0c26f17c9` with `git archive` into my scratchpad and added one probe test file (`tests/probe.rs`, reusing `tests/support/land.rs`).
- The probes drive the real `GitDriver` against real git repositories, with a separate Cargo target directory for each tree.
- Probe source: `/tmp/claude-1000/-home-vantt-projects-forgent/d8338954-a90f-40a4-86ed-2d68fe5381fb/scratchpad/wt/packages/git/rust/tests/probe.rs`.
- I did not rerun the developer's full test suite.

## Status of the previous findings

- **N-H1: fixed for the reported case.** A fresh Land is now refused while the destination tip equals X.next (`refs.rs:128-160`). After recovery, the Land proceeds. The error names X (`refs.rs:179`). A chain whose CAS failed with the ref still at expected stays exempt, as intended. But see the new High below.
- **M1: fixed.** The exact-old proof is now the canonical `ls-files --stage -z` digest, plus the index tree and per-path fingerprints (`land.rs:1091-1098`, `:1355-1363`). That output carries mode, oid, stage and path but no stat data, so a stat refresh (and `write-tree`'s cache-tree rewrite) no longer breaks the match. Real index changes (content, mode, added or removed entries, stage) still change the digest. Legacy proofs without the digest fail closed. That is acceptable because Land has not merged yet.
- **M2: fixed.** LandVerified records `{"storeCollision":true}` (`land.rs:742-743`). After ref read-back, recovery records an observed-only `pendingStoreCollision` without touching the checkout (`:1316-1318`). The CheckoutProof parser is never reached for that marker.
- **M3: fixed.** Any writer may record pre-attempt abandonment. Under slot 20, the chain is re-inspected and `attempted` is rechecked before the AbandonedBeforeAttempt append (`land.rs:1205-1216`). A live session holds slot 20, so no live chain can be closed. A chain with a TargetAttempt cannot be closed this way. See L-a for a narrow writer-check race.
- **L1: fixed.** The SIGKILL fixture now has a staged modification, a staged addition and an unstaged edit. Every boundary asserts their bytes and stage entries.
- **L2: fixed.** The removal Intent's `evidence_digest` binds `(repository identity, Land id, "consumer-acknowledged", acknowledgement, writer)`. The Intent also records the caller writer (`land.rs:1503-1510`), and it survives Land compaction. That is the right identity: it ties the specific Land id, the acknowledgement value and the deleting writer together. Retry reuses the same removal id, so a different acknowledgement cannot silently replace the recorded one.
- **L3: fixed.** For abandoned and Loss candidates, the discarded path (`worktree.rs:896-906`) requires all of the following before skipping the delivered-reachability proof:
  - the Land intent's worktree path and candidate tip match the handle;
  - the writer is the same;
  - the outcome is AbandonedBeforeAttempt or Loss;
  - the existing not-live, custody and clean checks pass.
- **L4: fixed**, but it overreaches into prepare and publish (M-1 below).

## Critical

None.

## High

**H-1. After a post-CAS crash, any later commit on the destination blocks it permanently. Recovery has no door for that state.** (`refs.rs:150-157` blocks a descendant of next; `land.rs:1222-1228` refuses any tip other than next)

- **Reproduced** (`probe_user_commit_after_post_cas_crash_blocks_forever`):
  1. Land X stops at `land-before-read-tree`, after its CAS.
  2. The user runs an ordinary `git commit --allow-empty` on trunk in the main checkout.
  3. `recover_land(x)` returns `land-target-effect-unknown`. `prepare_land(y)` returns `resource-recovery-required` naming `x`, for writer `fixture` and for writer `other`.
  4. Nothing can ever change that outcome: recovery accepts only `ref == next`, and admission refuses `next` and every descendant of it.
- **Compared with the pre-fix commit:** at `0c26f17c9`, Y prepared (the old N-H1 hazard). The fix turned a silent-revert hazard into a permanent destination block. The spec forbids that ("unresolved evidence does not become a permanent destination WAL block").
- **Why it is reachable:** the state is ordinary. Reconciled-but-unreceipted is also covered: a crash after read-tree but before Outcome, followed by normal user work. The new regression test (`land_crash_matrix.rs` `fresh_land_waits_for_observed_predecessor_and_stat_refresh_is_safe`) refuses the descendant, then rewinds trunk by hand with `update-ref` before recovering. That rewind is exactly the step a real user would never take.
- **Fix:** give recovery a terminal row for a destination tip that is a strict descendant of `intent.next`.
  - `next` is the candidate commit, a unique OID that only this chain's pins carry, so a descendant proves the effect was observed.
  - The row records `Outcome::Land { checkout: "pending", observed_only: true }` without touching the checkout or index. Add a variant if a distinct name is wanted. The receipt should report that the checkout may hold an unreconciled or reverted state.
  - Add the row to the §10 recovery table, and extend the regression test so it recovers X without the manual rewind and then lands Y.
  - Keep the admission block for `tip == next`, where the guarded finish is still possible.

## Medium

**M-1. The L4 change widened the main native-state gate from recovery into every prepare and publish.** (`land.rs:152`: the `if main {` guard was replaced by a bare block)

- `land_target_checkout` is shared by prepare (`:412`) and publish (`:728`). It now refuses with `foreign-main-checkout-state` whenever the main checkout has any of these, even when the destination is not checked out there:
  - `MERGE_HEAD`, `rebase-*`, `CHERRY_PICK_HEAD`, `REVERT_HEAD`, `BISECT_START` or `index.lock`;
  - unmerged index entries.
- **Reproduced** (`probe_native_state_off_destination_blocks_prepare`): with main on another branch holding `MERGE_HEAD` or `BISECT_START`, prepare is refused. At `0c26f17c9` the same prepare succeeds.
- **Effect:** a conflicted merge, a long bisect, or a transient IDE `index.lock` on an unrelated branch now blocks Lands that never touch the main checkout. This is an unrequested, undocumented and untested behavior change. Both the spec note and the fix report scope it to recovery.
- **Fix:** restore `if main` for prepare and publish. Run the unconditional native-state check only in `recover_land`, for example through a parameter or a separate small helper that the recovery path calls.

## Low

- **L-a. The writer check uses the pre-slot snapshot.** (`land.rs:1157-1166`) `pre_attempt` is computed from `initial`, which is read before slot 20 is acquired.
  - The race: writer A's live session appends TargetAttempt in that window and then dies. Writer B then acquires the slot, sees `attempted`, and performs post-attempt recovery even though the writers differ.
  - The finish is still guarded and content-safe, but it breaks the stated rule that post-attempt recovery requires writer equality.
  - Fix: recheck the writer against the re-inspected `chain` after the slot is acquired (around `:1203-1210`).
- **L-b. Compacted and terminal replay is now refused while unrelated native state exists.** The new native check (`land.rs:1188-1199`) runs before the compacted and terminal receipt returns (`:1200-1206`). A same-id replay of a finished Land then fails with `land-native-state-preserved` during an unrelated merge or bisect. Move the check after those returns, just before the abandonment append and the post-attempt path.

## Answers to the focused questions

- **Can the N-H1 admission block create a new permanent block?** Yes. See H-1: a descendant of next, reached by any later commit.
- **Can any-writer pre-attempt abandonment close a live or attempted chain?** No. Slot 20 excludes live sessions, and `attempted` is rechecked under the slot before the append. The only gap is the writer-check race in L-a.
- **Is the canonical index digest stable, and does it detect real changes?** Yes to both. Stat data is excluded. Content, mode, entries and stages are included, and the index tree and path fingerprints still back it up.
- **Does the cleanup authorization bind the right identity?** Yes. It binds repository, Land id, acknowledgement and writer, and the Intent's `writer_identity` is the caller.

## Merge readiness

Land is not merge-ready until H-1 is fixed. M-1 should be fixed in the same pass. The Low findings can follow.
