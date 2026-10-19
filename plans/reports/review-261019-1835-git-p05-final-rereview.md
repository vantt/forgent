# Final focused re-review: Git phase 05 fixes (0da5b7844..159c165a8)

I reviewed the fix diff read-only against the second re-review (`plans/reports/review-261019-1822-git-p05-rereview2.md`), the fix report (`plans/reports/phase-lead-261019-1822-git-p05-u6-lifecycle-exclusion.md`) and Git spec §8/§10/§12. I ran no builds or tests, because Cargo and npm write into the workspace. I relied on the fix report's test evidence and on reading the new tests. Line numbers are at 159c165a8.

**Verdict:** H-A, M-A and L-A..L-D are fixed, and I found no new Critical or High defect. One Medium remains. The L-A change turned foreign-chain cleanup failures into hard admission errors. That brings back a permanent block for a recreated worktree, which H-1 had removed. The fix is about five lines. **The phase is merge-ready subject to the host gate (full suite + E3) once M-1 is fixed.** The Low items can follow later.

## Previous findings

| Finding | Status |
|---|---|
| H-A lifecycle/checkout exclusion | **Fixed, both directions.** Remove and Move-source add `worktree:<path>:custody:<lock>` (worktree.rs:379-390), so a live checkout chain on the same directory identity matches exactly and refuses. The `checkout_attempts_exclude_remove_and_move` test covers ScopedCommit and Sync with a clean, landed, unreceipted effect. `refs::admission` (refs.rs:84-98) refuses a checkout resource that extends an active Create/Remove/Move `worktree:<path>` with `:custody:`. That covers Move destinations as well. `lifecycle_attempts_exclude_commit_and_sync` covers all three kinds. `admit_checkout` still skips non-checkout kinds (scoped_commit.rs:178-182), so lifecycle chains are never sent to foreign closure. WAL validation (wal.rs:418-447) accepts at most one custody entry, only for the Remove path or Move source, and keeps legacy path-only records readable. **No new deadlock:** checkout recovery and `repair_worktree` do not go through admission. Remove and Move reach `begin_worktree` only after canonicalize and custody of an existing directory (worktree.rs:798-803), and same-id replay comes earlier, so a missing directory adds no block. |
| M-A reflog-only adoption | **Fixed.** Every adopted candidate must be an ancestor of current HEAD (scoped_commit.rs:452-461). A reflog-only match returns recovery-required, names the OID, and leaves the WAL and index untouched. Exact parent+tree matches are exhausted before message-only matches (:446). Tests cover a pre-existing reset-away commit and a Sync reset (moved==2). |
| L-A foreign attempted chains | **Fixed in substance.** Attempted phases now close as `foreign-checkout-effect-unknown` (scoped_commit.rs:199-209; transition at wal.rs:714-720). Replay of that cause stays recovery-required (sync.rs:361-363, :432-434), pins are released, and the chain compacts. Tested for phase 0 and phase 2. Making errors propagate introduced M-1. |
| L-B bounded reflog | **Fixed.** A single `git log -g -n 1024 --format=%H%x00%P%x00%T%x00%B%x00` call replaces one `cat-file` per entry, and the scan stops at the baseline after a candidate. `%B` is the raw message, so the verbatim comparison still holds. |
| L-C SyncIntent branch | **Fixed for recovery.** `reference` is recorded (sync.rs:112), validated as a RefName (wal.rs:392-394), optional in the schema, and checked before observation (scoped_commit.rs:341-344, :391-393; sync.rs:427-431). The branch-switch test (moved==3) passes. Two Low side effects are listed below. |
| L-D warnings in Node | **Fixed.** Warnings are carried through `runPendingSync`, the failure result, `syncOnlyPass` and `commitRoundWithSync`. Today the native ports produce none, as the fix report notes. |

## Critical
None.

## High
None.

## Medium

**M-1. Closing a foreign chain now propagates pin-release and compaction errors, so a recreated worktree can be refused permanently** (scoped_commit.rs:195-228; spec.md:289).
Before this fix the closure's error was discarded (`let _`). Now `})()?` returns any error from `release_pin` or `wal.compact`, even after the foreign outcome is already durable. `wal.compact` refuses (RecoveryRequired) whenever the operation directory holds anything that is not a record (wal.rs:1897-1905). That includes a `.durable-file-*.tmp` left behind when a process is killed during a WAL append, which `inspect` and `scan` ignore without complaint (wal.rs:1195). On a recreated directory at the same path, every ScopedCommit and Sync admission then fails in `admit_checkout`. fgOS has no verb that removes that residue, and the old directory is gone. This is the permanent block H-1 removed. The spec sentence promising that a foreign chain "cannot block the current checkout even if its compaction is deferred" was reworded to cover only "successfully closed" chains.
Fix: propagate only the error from the outcome `append`. Once the outcome is durable, `active()` (wal.rs:2015-2021) excludes the chain, so `refs::admission` is no longer blocked by it. Treat pin-release and compaction failures of a closed foreign chain as deferred: keep the evidence, report a `checkout-compaction-deferred` warning, and retry on the next admission, as compact warnings already do. Then restore the spec's "even if its compaction is deferred" guarantee. Add a regression test that leaves a stray `.durable-file-*.tmp` in a dead chain and asserts that a commit in the recreated checkout succeeds.

## Low

- **L-1. The Sync branch check also runs on terminal receipts** (sync.rs:427-431). It runs before the terminal `Commit`, `CommitRejected` and `AbandonedBeforeAttempt` returns. Reading a retained `done` or `conflict-aborted` receipt after a branch switch therefore returns `checkout-reference-changed`, and on a detached HEAD it returns a generic `checkout-command-failed`. Nothing is blocked, because admission compacts terminal chains independently. Fix: run the check only in the unresolved `SyncCommitAttempt` branch (around :488), where the reflog search needs it.
- **L-2. Sync now depends on the live symbolic ref at admission and compacted replay** (sync.rs:58-70, :112). (a) The compacted same-id replay rebuilds the request digest with `reference = current HEAD`. After a branch switch, or for a receipt compacted before this change, it returns `operation-id-reused` instead of the recorded result. Native Sync is still dormant, so no such receipts exist yet. (b) A new Sync on a detached HEAD now fails with an unnamed `checkout-command-failed`. Fix: on compacted replay, also match the digest with `reference: None` or the recorded value, and refuse a detached HEAD by name (for example `sync-detached-head-refused`).
- **L-3. A reflog-only chain stays open with no documented way out.** Since H-A, Remove and Move of that worktree also refuse while the chain is open. The worktree is wedged until an operator steps in, and only raw Git can do that. Leaving the chain open is the accepted honest behaviour. Fix (docs only): add a §12 runbook entry next to the index.lock one. It should say: inspect the named candidate OID. If it is not this attempt's effect, delete that reflog entry under custody and rerun observe-only recovery, which then records `commit-effect-unknown`. Otherwise record the effect manually.

## Direct answers

- **Mutual exclusion in both directions?** Yes, and it is covered by tests.
- **New permanent block?** Not from lifecycle exclusion. The foreign-closure error path can cause one (M-1).
- **Is a reflog-only candidate ever adopted?** No. Every adopted candidate must be reachable from HEAD.
- **Are foreign attempted chains closed honestly and their pins released?** Yes, with replay staying recovery-required. A failed cleanup now blocks admission (M-1).
- **Is the reflog read bounded?** Yes: one call, at most 1024 entries.
- **SyncIntent branch?** It is recorded, validated, and enforced during recovery. Side effects are in L-1 and L-2.

## Unresolved questions
None.

Status: DONE_WITH_CONCERNS
Summary: H-A, M-A and L-A..L-D are fixed, with no new Critical or High. One Medium (foreign-closure cleanup errors now permanently block a recreated worktree) should get its roughly five-line fix before merge. After that the phase is merge-ready subject to the host gate.
