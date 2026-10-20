# Second re-review: Git phase 05 fixes (c696892b9..0da5b7844)

I reviewed the fix diff read-only. I checked it against the previous re-review (`plans/reports/review-261019-1759-git-p05-rereview.md`), the fix report (`plans/reports/phase-lead-261019-1759-git-p05-u5-rereview-fixes.md`), Git spec §8/§12, holder-lock spec §5/§8, the design principles and RUL104/L10. I ran no builds or tests, because Cargo and npm would write into the workspace. Line numbers are at 0da5b7844.

**Verdict: not merge-ready yet.** One High regression came in with the H-1 fix: the new checkout resource key no longer collides with the worktree lifecycle key, so WAL mutual exclusion between checkout operations and worktree create, remove and move on the same path is gone. There is also one Medium: the reflog search can attribute an older, reset-away commit to this attempt. Both fixes are small. Every other previous finding is fixed, apart from M-d, which still needs a host run. What remains after those two is Low.

## Previous findings

| Finding | Status |
|---|---|
| H-1 recreated worktree blocked | Fixed for checkout chains. `checkout_resources` (scoped_commit.rs:141-151) keys on the custody lock path (dev/ino/birth). `admit_checkout` classifies foreign chains (:183-221). A legacy chain on a live checkout keeps its binding, because custody lock files are never unlinked, so it is not foreign. Its open attempted chains still return `resource-recovery-required` (:252-254). Every ScopedCommit and Sync reader and writer uses `checkout_resources` or accepts the legacy form (scoped_commit.rs:361, :463, :830; sync.rs:103, :406; wal.rs:667-670). Worktree lifecycle operations do not; see the High finding below. |
| M-a recovery | Fixed for hook-modified trees, later commits and ABA. Same-id replay keeps the recorded cause, and unknown causes map to recovery (scoped_commit.rs:817-821, :881-887). The new attribution has the flaw described under Medium. |
| M-b native loans | Fixed. The mint refuses while `sweeps > 0` (index.mjs:699) and passes `borrowRoots` into the loan (index.mjs:708; port.rs:306-336; flock.rs:230-231). The snapshot is complete: the native call is synchronous, and async sweeps start only from a JS `exit` handler, which cannot run during the call. A stale root cannot protect an escapee. An exited sibling stays an unreaped zombie while the event loop is blocked, so its pid and pgid cannot be reused. Our git child leads its own group, and its escapees reparent to init, not to a sibling. The loan stays opaque and one-shot (External, consumed inside the guard), and only the trusted facade passes roots. |
| M-c compaction hides receipt | Fixed. Receipts carry `warnings` (scoped_commit.rs:1179-1182, :1256-1259; sync.rs finish/abort/recover). The next admission retries and still fails closed until the evidence is cleaned. |
| M-d E3 aged floor | Only the row has been added; it has not been run. This stays a host-acceptance gate, not a code defect. |
| L-a restore exactness | Fixed. Skip-worktree paths are excluded, and permission metadata is reapplied after `git restore` (scoped_commit.rs:992-1003, :1212-1243). Sync `clean_modes` are restricted to clean staged paths and validated in the WAL and the schema (wal.rs:713; schema max 65535 = 0o177777). Every independent restore is attempted before `commit-worktree-restore-required`. |
| L-b drain code | Fixed: retryable `borrow-drain-in-progress` at all three entry points, and holder-lock §8 is reworded honestly. |
| L-c recover guards | Fixed. The pre-attempt unstage is guarded (HEAD == baseline and staged == paths), and the unknown branch unstages only its own paths (scoped_commit.rs:474-481, :513-517). |
| L-d compacted Sync replay | Fixed. Replay returns the recorded cause or state (sync.rs compacted and retained branches), and `abort` accepts `conflict-aborted`. |
| L-f index.lock runbook | Fixed: Git spec §12 (spec.md:423). It preserves evidence and never touches holder-lock files. |

## Critical
None.

## High

**H-A. Checkout chains and worktree lifecycle chains no longer exclude each other in the WAL** (scoped_commit.rs:141-151; wal.rs:310-322; refs.rs:74-95; worktree.rs:379-380).
`refs::admission` refuses only on an exact string match between resource sets. Before this fix, ScopedCommit, Sync, WorktreeCreate, WorktreeRemove and WorktreeMove all used `worktree:<path>`, so an open chain of either family blocked the other on the same path. Checkout chains now use `worktree:<path>:custody:<lock>`, while lifecycle chains still use `worktree:<path>`. The two never intersect.

This allows two concrete failures:
- A ScopedCommit dies after its commit landed, at TargetAttempt, or a Sync dies at SyncCommitAttempt after the merge commit landed. The worktree is then clean, with no MERGE_HEAD and no index.lock, so `worktree_remove_safe` (worktree.rs:255-286) passes. `WorktreeRemove` or `Move` of that path is now admitted. The checkout chain is stranded for good. Its path or directory identity is gone, so admission treats it as foreign. `validate_transition` allows `foreign-checkout-abandoned` only from Intent/Prepared, so the closure fails silently. Same-id `recover` fails the binding check. A landed commit is never recorded, and nothing can close the chain.
- An interrupted WorktreeCreate or WorktreeMove on P no longer blocks a ScopedCommit or Sync on P. Checkout work can therefore run in a half-created or half-moved directory while its lifecycle recovery is still pending.

No test covers either case, so the change went in unnoticed.

Fix, keeping H-1 solved:
1. WorktreeRemove, and WorktreeMove for its source, add the existing directory's checkout resource. That is `worktree:<path>:custody:<custody_lock_path(path)>`, which the code already computes in `worktree_custody`. It goes into the lifecycle resource set; extend `worktree_resources` and the WAL validation and schema to match. Live checkout chains then block them, and dead ones do not.
2. Checkout admission (`admit_checkout`, and the direct `refs::admission` calls in sync.rs:104 and scoped_commit.rs:956/1060) also refuses active lifecycle chains (Create, Remove, Move) whose resources contain `worktree:<path>`. Filter by kind, so legacy checkout chains still go through foreign classification.
3. Add regression tests for both directions.

## Medium

**M-A. A reflog-only candidate can attribute an older, reset-away commit to this attempt** (scoped_commit.rs:308-422, used at :490-512 and sync.rs:481-492).
The reflog scan is not bounded to entries after this attempt. An exact parent-and-tree match is accepted with no `newest` check. `newest` only looks at *retained* peers, and compacted ones are invisible.

Scenario: commit C1 is made, by fgOS or by a human, on baseline B, and is then reset away (HEAD back to B). A retry of the same work, with the same tree or the same message, then crashes after TargetAttempt but before `git commit` ran. Recovery finds C1 in the reflog and records `Commit{observed: C1}`. The caller receives a "committed" receipt while HEAD is still B and the staged work was never committed. Before this fix, the same state recorded an honest `commit-effect-unknown`.

Fix: a candidate found only in the reflog (not reachable from the current ref, i.e. the ABA case) should not be adopted automatically. Either keep the chain recovery-required and name the candidate oid as evidence for the operator, or accept only reflog entries newer than the attempt's own barrier record, for example by comparing the reflog entry time with the TargetAttempt record time. Also do one exact parent-plus-tree pass over all candidates before any message-only match, so an exact match later in the reflog beats a message match at HEAD.

## Low

- **L-A. Foreign chains in attempted phases are never closed, and the spec says otherwise** (scoped_commit.rs:194-221; wal.rs:682-684; spec.md:289). The closure is allowed only from Intent/Prepared, and its error is discarded (`let _ =`). Foreign TargetAttempt, SyncState and SyncCommitAttempt chains therefore stay retained forever, and their Sync pins are never released. Leaving them open is honest, because the effect may have landed on a shared branch. But spec §8 claims that admission "closes foreign unfinished chains" and "releases their pins". Add a terminal for attempted phases, such as `foreign-checkout-effect-unknown`, which already maps to recovery on replay. Then the chains compact and the pins are released. Or reword the spec and surface these chains in doctor.
- **L-B. The reflog scan is unbounded and costs one subprocess per entry under custody** (scoped_commit.rs:381-421). A long-lived branch means thousands of `cat-file` borrows. Use a single `git log -g --format=%H%x00%P%x00%T -n <N>` call, or stop at the attempt barrier. The same change makes M-A cheaper to fix.
- **L-C. Sync recovery searches the current HEAD branch, not a recorded one** (sync.rs:481; scoped_commit.rs:339-346). SyncIntent has no reference field. A branch switch or detached HEAD after the crash searches the wrong reflog or errors out. The error fails closed. Record the branch in SyncIntent, or refuse when HEAD's symbolic ref differs from the one in effect at the barrier.
- **L-D. Deferred-compaction `warnings` are dropped by the Node consumers.** `src/runner/execution/commit-unit-work.mjs` and `unit-sync.mjs` never read the field. The receipt is preserved, which was the point of M-c. The warning should still reach the run result or doctor, not only the next admission's failure.
- **L-E (carried over).** The ledger grows by one inode per commit. Track this as a capacity item.

## Direct answers
- **Same key everywhere?** Yes within ScopedCommit and Sync (writers, readers, replay, the compacted match with the legacy fallback, and WAL validation). No across worktree lifecycle operations (H-A).
- **Can a legacy chain on a LIVE checkout be misclassified as foreign?** Only if the custody lock file's inode changed, and holder-lock never unlinks lock files. If that did happen, a legacy attempted chain would be ignored rather than blocking. That is accepted residual risk for the upgrade window only.
- **Can newest-chain message recognition adopt a non-fgOS commit?** At HEAD, yes: a human commit on the baseline with the identical verbatim message is adopted as `contract_violation:true`. The content did land, so this is tolerable. Through the reflog it can also adopt a reset-away commit and claim an effect that is not present (M-A).
- **Is the reflog search bounded and on the correct branch?** It is not bounded (L-B). ScopedCommit uses the recorded branch; Sync uses the current one (L-C).
- **Can stale sibling roots protect an escapee? Is the loan still opaque and one-shot?** No to the first and yes to the second; see the M-b row.
- **Deferred compaction warning and permission metadata restore?** Both are correct. The warning is not surfaced to callers (L-D).

## Unresolved questions
- Should a reflog-only (ABA) match be recorded as Commit at all, or always stay recovery-required for the operator? I recommend recovery-required, with the candidate oid kept as evidence.

Status: DONE_WITH_CONCERNS
Summary: All previous findings except the unrun E3 gate are fixed, but the custody-keyed checkout resource dropped WAL mutual exclusion with worktree create/remove/move (High), and reflog-only recovery can attribute an older reset-away commit (Medium). Not merge-ready until those two small fixes land; the rest is Low.
