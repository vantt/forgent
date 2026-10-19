# Re-review: Git phase 05 review fixes (44ea50358..c696892b9)

I re-reviewed the fix diff read-only against the first review, the fix report, Git spec §3/§7/§8/§10, holder-lock spec §5/§9, the design principles and RUL104/L10. I ran no builds or tests, because Cargo and npm would write into the workspace. Line numbers are at c696892b9.

**Verdict:** No Critical. One High: the new admission sweep validates the authority of every retained chain on the worktree path, terminal ones included. A worktree recreated at the same path can therefore be blocked for good, which is the H1 symptom coming back by another route. I also found four Medium issues. The original H1, M2, M3, M4 and L1-L7 are fixed as described. M1 is fixed only on the `lock-fd --drain-child` path; native Git loans are still unprotected. M5 has a benchmark but no measurement yet.

## Original findings: status

| Finding | Status |
|---|---|
| H1 permanent block | Mostly fixed. Pre-attempt chains close inline (scoped_commit.rs:871-874, :1010-1016; sync.rs preparation closure) and at admission (scoped_commit.rs:141-193). `recover` observes without replaying. Sync records `hook-rejected`, and abort accepts `rejected-open`. The gaps are listed under High and Medium (M-a) below. |
| M1 sibling kill | Fixed on the Node `--drain-child` path (protected roots, flock.rs:497-518; refusal during a sweep, index.mjs:545). Not fixed for native loans; see M-b. |
| M2 compaction | Fixed. Terminal chains go through Publication's ledger. `known_id`/`compacted` keep the id binding, and replay rebuilds files from immutable commits. |
| M3 Sync abort | Fixed. Clean merged paths go back to HEAD in both index and worktree, target-only additions are removed, and conflict paths keep their resolver bytes (sync.rs abort). Exactness caveats are in L-a. |
| M4 snapshot memory | Fixed. Clean tracked paths become `SavedPath::Head`, and Git's up-to-date check skips untouched files on restore. |
| M5 E3 | Not proven. The `nodeLoanScopedCommit` row exists but has not been run, and it cannot show the cost that matters (M-d). |
| L1-L7 | Fixed as described. The cutover grant refuses compacted ids (grant.rs:35-39). Nothing else reads the `cutoverGrant` payload: I grepped packages, src and apps, and the only consumers are grant.rs, scoped_commit.rs and git_grant.rs. So compaction loses nothing that the grant or replay needs. |

## Critical
None.

## High

**H-1. A recreated worktree at a reused path is blocked by the dead checkout's chains (scoped_commit.rs:156-174).**
`admit_checkout` runs `validate_publication_borrow` on every retained ScopedCommit or Sync chain whose resource is `worktree:<path>`, and it does so before checking whether the chain is terminal or pre-attempt. A mismatch makes the whole operation fail. The binding is the custody lock's dev:ino. The dispatch-cwd lock path is keyed by the worktree directory's dev, ino and birth time (refs.rs:880-894), while the WAL resource is keyed by path string.

So if a linked worktree is removed and recreated at the same path, every surviving chain from the old checkout carries a binding the new custody can never produce. Every ScopedCommit and Sync there then refuses. That holds for terminal chains awaiting compaction, which the old `refs::admission` ignored, so this part is new, and for pre-attempt chains. `recover` and `abort` also require the old binding, so nothing can clear it.

A realistic trigger: a Sync hook rejection leaves `CommitRejected{hook-rejected}` uncompacted while the merge is open, by design. The runner then discards the worktree and re-adds it at the same path (deterministic worktree paths). The same happens after a crash at Intent/Prepared, or after any compaction failure. This breaks the coordinator decision "no permanent per-worktree block".

Fix: give checkout chains the worktree's identity, not only its path. For example, include the custody lock path or dev:ino:birth in the resource string, so chains from a dead checkout never match a new one. Alternatively, have `admit_checkout` skip chains whose binding names a custody lock that differs from `custody_lock_path` of the current directory, since the old checkout no longer exists and cannot carry a pending effect. Add a test: a Sync hook rejection, then `worktree remove` plus `worktree add` at the same path, then a fresh ScopedCommit and a fresh Sync both succeed.

## Medium

**M-a. `recover` cannot close some landed commits, and it misreports ABA (scoped_commit.rs:283-327, :622; sync.rs SyncCommitAttempt branch).**
- *Hook-modified tree.* The inline path accepts a landed commit whose tree differs from the intent and records it as `Commit{contract_violation:true}` (scoped_commit.rs:925-947). This is the formatter/lint-staged case. `recover` instead requires `tree == payload.tree` and returns `commit-effect-unknown` (recovery-required), so the chain stays open and the worktree stays blocked. Sync has the same tree check. A landed commit is never recorded as unknown here, which is good, but it is also never closed.
- *HEAD moved past the commit.* If anything committed on top after the crash, the parent check fails and the chain also stays open with no exit.
- *ABA.* If the commit landed and HEAD was then reset to the baseline, `recover` records `CommitRejected{commit-effect-unknown}`. Same-id replay of any compacted `CommitRejected` returns a bare `commit-rejected` (scoped_commit.rs:622), which drops the recorded cause. That replay answer says the attempt was refused, which the spec forbids claiming.

Fix:
1. When HEAD's only parent is `baseline.head`, its message equals `request.message` (cleanup=verbatim), and the attempt is the newest chain on the worktree, record `Commit{contract_violation: tree != intent.tree}`.
2. Before recording unknown, look in the branch reflog after the baseline for a commit with that parent and tree (or message). If one is found, record Commit, or keep the chain recovery-required.
3. On replay, return the recorded cause, e.g. `commit-effect-unknown`, and never `commit-rejected`.

**M-b. Native Git loans bypass the M1 protection (index.mjs:690-717; flock.rs:231).**
`registerNativeHandover` neither checks `entry.sweeps` nor passes `borrowRoots`, and Rust `end_listed_holders` drains with `protected_roots = &[]`. Two hazards follow, both on Linux:
1. A native Git call made while an async Node borrow is live kills that borrow. Its drain classes the borrow child as an escapee: parent == owner (the Node pid) and a non-CLOEXEC tagged copy.
2. An async `--drain-child` helper still running while the event loop makes a native ScopedCommit call can SIGKILL the native `git commit` child mid-attempt, by the same rule. That leaves an open TargetAttempt whose effect is unknown.

Both are "concurrent sibling borrows are never killed" violations. Fix: apply the same refusal while `sweeps > 0` in the native mint, and carry the live async borrow roots into the loan so the Rust drain protects them. Alternatively, refuse a native loan while async borrows are live. Add a test with an async borrow plus a native ScopedCommit on one handle.

**M-c. A failed post-commit compaction turns a landed commit into an error (scoped_commit.rs:1017-1022; sync.rs finish and abort `compact_checkout(...)?`).**
After `prepared` is `Ok(Committed)`, a compaction error is returned in its place. Causes include an orphan temporary file in the operation directory, which makes compaction return RecoveryRequired, a pin-release failure, or an I/O error. Spec §2 requires results to report the actual effect. Same-id replay does recover the receipt, but a caller that does not replay sees a failure for a commit that landed. Fix: when the outcome is recorded, return the receipt and leave compaction to the next `admit_checkout`, which already compacts terminal chains. Report the compaction problem as a warning field or a doctor item.

**M-d. E3 still does not prove the budget for the Node loan path (scripts/git/e3-bench.mjs:222-248; driver.mjs:207-223).**
The reach floor is the first `--guarantee` of the process, cached for its whole life. The new row runs in a fresh process, so the floor is seconds old and the `created_since` set is tiny. In a long-lived runner or gateway, the floor ages until each drain reads nearly every live process, which is effectively the old `Reach::Everyone`. Fix: run E3 on the owner host as planned, and add an aged-floor variant (spawn about 1-2k processes after acquisition, then measure) before calling the p95 ≤150 ms / p99 ≤250 ms budget met.

## Low

- **L-a. The clean-path HEAD restore is exact only for state Git can represent** (scoped_commit.rs:991-1000; Sync abort). It does restore the executable bit, regular files and symlinks exactly, and Git skips untouched files. It does not restore permission bits Git doesn't track (a hook-touched 0600 file comes back with umask defaults), and it can be inexact under `core.fileMode=false`, `core.symlinks=false` or with submodules (no `--recurse-submodules`). A sparse or skip-worktree tracked path is classed as clean, so `git restore` can error on it.
  The restore uses `?`, so a failure aborts rollback midway: captured dirty paths are not restored, the original hook-rejection error is masked, and compaction is skipped. Fix: exclude skip-worktree entries from `tracked`, map a restore failure to `commit-worktree-restore-required` only after attempting the remaining restores, and record the mode of clean paths (metadata only) to reapply it.
- **L-b. The drain-snapshot refusal has a misleading error code** (index.mjs:545). It throws `borrow-leftover-not-killed`, which goal-check treats as an authority failure. There is no deadlock, because the window is bounded by killWaitMs plus slack. But with a live sibling, every drain lasts the full killWaitMs, because the protected sibling is waited until timeout, so the window is about 2 s per sibling exit. Use a distinct, retryable `borrow-drain-in-progress` code. Holder-lock spec §8's "Concurrent async fd borrows remain supported" overstates what happens: every non-last sibling fails closed after killWaitMs, as the new test asserts. Reword it.
- **L-c. `recover` unstages without the admission guard** (scoped_commit.rs:279-282). Its Intent/Prepared branch unstages `payload.paths` unconditionally, while `admit_checkout` does so only when HEAD == baseline and staged == paths (:176-181). Use the same guard. Separately, the unknown-attempt branch runs a whole-index `reset -q HEAD` (:291), which drops human staging in the main checkout. Limit it to `payload.paths`.
- **L-d. Compacted Sync replay reports `not-started`** for conflict-aborted, hook-rejected or unknown outcomes (sync.rs compacted branch of `continue_sync_scoped`). Report the recorded terminal state instead.
- **L-e. The ledger grows one entry per commit forever.** The Backlog doc in wal.rs says retained id bindings are linear, and doctor only warns. After phase 07, every runner commit adds a permanent ledger inode. Track it as a capacity item.
- **L-f. An `index.lock` left by a SIGKILLed git refuses `recover` permanently** with `commit-index-lock-present` / `sync-index-lock-present`. Refusing is correct, but the main-checkout cutover runbook should document the manual way out.

## Direct answers to the brief's questions

- **Can `recover` close a chain whose commit landed?** It never records unknown when HEAD is the exact baseline child with the intended tree; it records Commit from the immutable commit and syncs refs. When the hook changed the tree, or HEAD moved past the commit, it does not close the chain at all. Under ABA it records unknown, and replay then says `commit-rejected` (M-a).
- **Is quiescent custody proven?** Yes. Every terminal observation runs after `validate_quiescent` (wait_unborrowed plus revalidation, port.rs:768-778) under an exclusive hold. Git children borrow the handle (`checkout_call` passes `Some(h)`), and an absent `index.lock` is required. The one hole is a concurrent native or async sibling on the same Node handle (M-b).
- **Can sibling-root protection let a real escapee survive?** Not silently. The domain is ancestry or process group. A detached sibling leads its own session, so an escapee of A cannot join B's group. The residual case is pid reuse inside the snapshot: a protected escapee is waited on, A fails closed, and release-time settle (which has no protected roots) kills it.
- **Does compaction lose anything replay or the cutover grant needs?** No. The request digest now binds baseline, request and writer, and the receipt binding covers repository, resources, authority and tips. The grant refuses spent (compacted) ids.
- **Does refusing a new borrow during a drain snapshot add a liveness hazard?** Only a bounded, transient refusal with a misleading code (L-b). The real gap is that native loans skip this rule (M-b).
- **Is the clean-path HEAD restore exact for modes and symlinks?** Yes for the executable bit and symlinks. Not for permission bits Git doesn't track, `fileMode=false`/`symlinks=false`, submodules or sparse paths (L-a).

## Unresolved questions
- Should a recreated worktree at the same path inherit the dead checkout's WAL chains at all (H-1)? My recommendation is no: bind checkout resources to the worktree's identity.
- Do any production flows run a native Git call while an async borrow on the same custody handle is live? This decides whether M-b blocks the phase 07 switch or only this merge.

Status: DONE_WITH_CONCERNS
Summary: The fixes close the original H1 and M2-M4 as described, but the new admission sweep can permanently block a worktree recreated at a reused path (High). Recovery cannot close hook-modified or overtaken landed commits, native loans bypass the sibling-borrow protection, and a compaction failure can hide a landed commit (Medium).
