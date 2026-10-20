# Review: Git phase 05 (4b11868af..44ea50358)

I reviewed the diff read-only against the phase-05 plan, the three lead reports, git spec §3/§7/§8 and holder-lock spec §5. I ran no builds or tests, because Cargo and npm would write into the workspace. All line numbers below are at 44ea50358.

**Verdict:** I found no Critical issues and one High issue. The High issue: ScopedCommit and Sync have no way to resolve an interrupted or rejected attempt, and the admission rule turns any such chain into a permanent block on that worktree, which includes main and therefore the Event Store cutover. Fix it before merge. The other issues are Medium or Low and can follow as items.

## What holds up

- **WAL barrier.** ScopedCommit writes Intent, then Prepared, re-checks HEAD and `write-tree`, then writes TargetAttempt, and only then runs `git commit` (scoped_commit.rs:569-607). The outcome is appended after `sync_refs` (:644-652). Sync writes a durable `SyncCommitAttempt{tree}` before its commit (sync.rs:421). A replay rebuilds the receipt from the immutable commit (`diff baseline.head observed`) and never runs a ref-moving attempt twice (scoped_commit.rs:370-410; sync.rs:292-329).
- **Rollback exactness.** For an observed rejection with HEAD unchanged, the code runs `reset -q HEAD` (the index was proven empty at :415) and restores the snapshot. The snapshot covers declared clean, dirty, ignored and absent paths, symlinks and modes. Paths the hook created are restored to absent, and a parent that turned into a symlink is refused. A move keeps old-absent/new-present, as the coordinator decided and as spec §3 now says.
- **Cutover grant.** git_grant.rs sets CLOEXEC on slot 3 first. grant.rs then checks, in order: holder-lock `borrowed_check` against the trusted main lock, a main worktree, record-0 `authority_binding` equal to the slot-3 dev:ino, last phase TargetAttempt with no outcome (so a grant is single-use), a temporary index that is a regular non-symlink file inside the gitdir, the staged `.fgos` deletions equal to the sorted `exactPaths` byte for byte, the current `refs/fgos/legacy`, and the seal.json SHA-256. The hook ignores env and PID, and a missing host refuses. The fence is staged on every validated cutover (scoped_commit.rs:450-454).
- **Reach floor.** The floor is a real Rust `creation_mark` taken at the `--guarantee` call, before any open. The cached value can only be older, which widens the scan rather than skipping copies. It travels opaquely through the handle and loan. A missing or future floor refuses, and it is never set at handover time (port.rs:309-336). There is a regression test for a copy created before the loan.
- **Descriptor rule.** A process counts as a borrowed copy only when it holds a FLOCK on the same dev:ino and its fdinfo `flags` lack O_CLOEXEC. If the flags can't be read, the process stays protected (flock.rs:318-331). Settle and drain share one predicate.
- **Capability.** A single producer, `gitCapabilitiesForHost`, feeds both `manifest.capabilities` and `nativeAddon.capabilities`. The activation gate `require_git_addon` sits in `admit`, so it covers init, upgrade and rollback.
- **Layering and tests.** `fgos-write-scope` has no dependencies. Git depends on holder-lock and write-scope, and only the host route links Git into distribution. Production code has no env switches or test-only branches; `FGOS_TEST_ADOPTED_HOLDER` is a role flag that exists only inside a test binary.

## Critical
None.

## High

**H1. An interrupted or rejected ScopedCommit or Sync blocks its worktree permanently.**

`refs::admission` (refs.rs:83-93) refuses any new operation on `worktree:<path>` while another chain on that path has no outcome. ScopedCommit and Sync have no recover, resolve or close verb, and `Wal::recover` returns RecoveryRequired for every kind except PublicationCas. These paths leave a chain open for good:

- `commit-prepared-state-changed` (scoped_commit.rs:577) leaves Prepared open, even though no ref effect is possible yet.
- `commit-effect-unknown` (:621), a driver `Err` after TargetAttempt (for example a timeout), or a crash at any phase.
- A Sync crash after Intent or Prepared: `continue` reports "not-started" (sync.rs:338-345) but never closes the chain.
- A Sync hook rejection, which is just as observable as a ScopedCommit one (HEAD unchanged, non-zero exit). It returns at sync.rs:438-443 and leaves `SyncCommitAttempt` open. After that, `continue` refuses (:327-329), and `abort` refuses too because it calls `continue` first (:497).

On main, this blocks every Checkpoint and the cutover itself.

Fix:
1. Close pre-attempt chains with `AbandonedBeforeAttempt`, both inline and at admission, the same way Publication's `admit_pending` does.
2. Give ScopedCommit an observe-only recovery. If `HEAD^ == baseline.head` and `HEAD^{tree} == intent.tree`, record `Commit` from the immutable commit. If HEAD equals `baseline.head` with no `index.lock` and custody held, record a terminal unknown/rejected outcome through an explicit verb. Never replay.
3. For Sync, append `CommitRejected{hook-rejected}` on an observed rejection, and let `abort` handle an open merge whose outcome is `CommitRejected`. Today that case returns `sync-rejected-merge-recovery-required` with no way out.
4. Add tests for each of these cases, including one that runs a fresh-id ScopedCommit after each.

## Medium

**M1. The descriptor rule now kills a concurrent sibling borrow instead of refusing.** Node `runBorrowed` allows several async borrows of one fd-transport handle at once (`entry.borrows` is a counter; index.mjs:566 and the async path). Child B of a sibling borrow is a direct child of the owner and holds a non-CLOEXEC tagged slot 3. When A drains (the `lock-fd --drain-child` helper, flock.rs:503 and :519), B is now classed as an escapee and killed. Before this change B was waited on and A failed closed. Fix: refuse a second in-flight borrow on the fd transport, or pass the live sibling borrow roots to the drain as protected. Add a regression test with two concurrent async borrows.

**M2. ScopedCommit and Sync chains are never compacted.** Neither module calls compaction. `admission` inspects every retained chain on every call, and `retained()` fails at 100,000 entries. After the phase-07 switch every runner commit adds a chain, so latency grows linearly and then hits a hard failure. Fix: compact terminal chains once their outcome is recorded (and the Sync pin is released), as Publication's `release_pin_and_compact` does.

**M3. Sync abort leaves the target's merged bytes in the producer worktree.** sync.rs:546-548 resets only index entries, then runs `merge --quit`. Paths that merged cleanly keep the target's content as unstaged dirt. A later ScopedCommit whose writes cover those paths would commit the target's changes as producer work, with no merge parent. Fix: on abort, restore the staged non-conflict paths to HEAD in both index and worktree, and keep only resolver edits on conflict paths. Git refuses a merge that would overwrite local changes, so those paths held no producer bytes. If "abort preserves bytes" really means keeping the target's bytes too, the coordinator should decide that explicitly.

**M4. The snapshot reads every declared tracked file into memory.** scoped_commit.rs:499-536 does this on each commit. With `writes: ['**']`, the documented whole-worktree form, that is the whole repository per commit. Clean tracked files equal HEAD, so they can be restored from HEAD after a rejection. Only dirty, untracked and ignored declared paths need their bytes captured.

**M5. The E3 latency budget is unproven on the Node loan path.** The floor is the guarantee observation, cached for the life of the process, with `last_pid: None` (port.rs:322). So the first drain of every native call filters start times across the whole process table. The E3 bench stopped at bwrap in unit 2 and was not run in unit 3. Run E3 (changing CAS p95 ≤150 ms, p99 ≤250 ms) through the addon path before merge.

## Low

- **L1.** The rollback comment says only an observed rejection restores (scoped_commit.rs:790-791), but restore runs on any error with HEAD unchanged (:664-698). That includes `commit-effect-unknown` and a driver timeout after TargetAttempt. The result is harmless (pre-commit bytes, HEAD unchanged), but the comment and code disagree. Narrow the condition or fix the comment.
- **L2.** commit-unit-work.mjs:431 labels any exit-1 commit failure `hook-refused` and drops the old message prefix. It is a production caller change made during a dormant phase. The plan allows dropping the replay, but the label is a guess.
- **L3.** The baseline dirty-content digests are captured but never used. An in-scope baseline-dirty file the producer changed is left out silently, with no `preExistingInScope` report (G-053) (scoped_commit.rs:424).
- **L4.** Declared paths containing control characters or a literal `*` pass staging, then fail WAL intent validation (`fgos_scope_literal`, wal.rs:366). The result is a misleading "corrupt" refusal followed by rollback. Refuse them up front with a named cause.
- **L5.** grant.rs:21-35 claims to seal slot 3, but git_grant.rs does that. `let _ = file.as_fd();` does nothing. Fix the comment.
- **L6.** Spec §7's P-CUTOVER paragraph (spec.md:273) still lists two conditions. Add the TargetAttempt/no-outcome check, the seal digest and the fence, to match the code and contract.
- **L7.** If `.fgos/events` is already tracked and unchanged, it is selected but not staged, which gives `staged-set-mismatch` (fails closed). `canonicalize(index.parent())` compared with a non-canonical `repo.git_dir` can refuse falsely. Both fail closed.

## Open questions

- Is a permanent per-worktree block after an uncertain attempt intended until phase 07? If it is, the main-checkout cutover runbook needs a documented manual way out.
- M3: should Sync abort keep the target's merged bytes?
