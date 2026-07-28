# Worktree Reclaim: Silent Data Loss Risk, Fixed But Exposed fgOS State Machine Gap

**Date**: 2026-07-28 22:11  
**Severity**: Critical (data loss)  
**Component**: Runner worktree crash-recovery, `src/runner/worktree.mjs`  
**Status**: Resolved (code merged), Process Issue Escalated  

## What Happened

`reclaimOrphanedCheckout` in `src/runner/worktree.mjs` force-removed ANY existing git worktree of a branch being reused with zero check for uncommitted work. Real dogfood incident (tsk-1wd, 2026-07-28): `fgos approve` on a leaf creates an ephemeral worktree on the root's `fgw/<rootId>` branch to merge; if that branch already had a live checkout (e.g., an ad-hoc `git worktree add` — invisible to fgOS's session registry, which only tracks detached-HEAD checkouts), it got silently force-removed. All work in that checkout was lost.

In the actual incident, nothing was destroyed (work was already committed), but uncommitted code would have been permanent data loss with zero warning.

## The Brutal Truth

This is an unacceptable gap. A crash-recovery helper that destroys user work silently is worse than no recovery at all — it creates a false sense of safety. The moment we shipped `fgos approve`, we were one stray worktree away from losing a developer's uncommitted work and having no forensic trail it even happened. And it took a real dogfood use to surface it.

The fix itself is tight and correct. But what's infuriating is that this isn't a rare edge case — it's the exact use case that makes `reclaimOrphanedCheckout` necessary in the first place: a developer stops a session, the worktree stays orphaned, later `approve` tries to reuse the branch. We got lucky with tsk-1wd.

## Technical Details

**The vulnerability:** `reclaimOrphanedCheckout(repoRoot, branchName)` called `execSync('git worktree remove --force <path>')` immediately when finding an existing checkout, no safeguards.

**The fix:**
- Added `isCheckoutDirty(repoRoot, worktreePath)`: runs `git -C <path> status --porcelain -- ':!.fgos'` to detect uncommitted changes. Excludes `.fgos/` because `createWorktree` always deletes the checked-out `.fgos/` copy immediately after checkout (ADR0020), which would otherwise make every checkout look dirty. Fails closed (dirty=true) on unreadable status.
- `reclaimOrphanedCheckout` now refuses and throws `WorktreeError` instead of force-removing if the checkout is dirty.
- A genuine crash-orphan is always clean (the worker's commit lands before the process dies per the module's own CRASH RECLAIM doc), so this closes the data-loss gap without breaking the crash-recovery path itself.
- Found and fixed related bug: `createWorktree` leaked its freshly-`mkdtemp`'d directory whenever the new dirty-check refused, because `reclaimOrphanedCheckout` ran outside the function's existing cleanup try-catch. Moved it inside.

**Verification:** Empirical proof-first (fgOS's "Iron Law" gate): new tests fail against pre-fix code, pass against the fix. Full `npm test`: 1533 tests, 1528 pass, 5 pre-existing skips, 0 fail.

## Root Cause Analysis

The reclaim function was written defensively for one thing only: the process died after commit, worktree is orphaned, we need to clean it up. Nobody explicitly reasoned through "what if someone had a LIVE checkout here with uncommitted work?" — the assumption was that a live checkout would never exist at the branch the recovery was trying to reuse. That assumption is false.

The crash-reclaim doc said "the checkout is clean" but never validated it. Cheap to add; expensive to miss.

## Lessons Learned

1. **Destructive recovery helpers must defend against the happy path.** A function that can destroy user work under ANY precondition that looks like "it's an orphan" is not defensive enough. The safest assumption: if the code I'm about to delete has ANY uncommitted work, refuse and tell the operator why, even if crash-recovery would be cleaner.

2. **Scope decision was correct:** Protect only against real uncommitted-work loss. A clean-but-actively-used checkout can still be reclaimed (no data lost, just disruptive) — matches what the incident actually was. Don't add complexity trying to detect and preserve live active checkouts; that's what session registries are for. This version is honest about its boundary.

3. **Test the assumptions in crash-recovery code explicitly.** "The checkout is clean after the worker commits" is not an implementation detail — it's a precondition. Write a test that proves it, then a test that proves what happens if it's violated.

## Next Steps

- [ ] **Add to ADR or platform-foundations:** Destructive operations in fgOS (especially crash-recovery paths) MUST validate state before acting. The "fail closed" pattern (when in doubt, refuse and report) is non-negotiable for data-loss boundaries.
- [ ] **Escalate fgOS process issue** (p-b91d487a / stage-mismatch repro): tsk-1os's `stage` never advanced during the lightweight verb-closure path (pick → commit → return → approve), leaving it at `proposed` with no clean FSM edge to `done`. The merge landed (commit `f1ef85f`), but the final verb step failed the state flip. This is now a second triggering condition for the merge-lands-but-state-misses bug class already in backlog. **Decision deferred**: whether to retry the approve verb or force-flip the stage manually is a fgOS workflow question, not a code-quality question. Left `tsk-1os` at `proposed` per user's explicit choice.
- [ ] **Test state:** Code merged, all tests passing. Not yet pushed to remote; awaiting this journal + any process-level decisions on the fgOS issue.

---

**For the next developer touching crash-recovery or worktree management:**  
Crash-recovery MUST NEVER destroy data without validation. If you modify `reclaimOrphanedCheckout` or add new destructive recovery logic, the test suite MUST include a test where the target is dirty, and that test MUST verify the operation refused. If you find yourself thinking "well, in practice the checkout should never be dirty here" — you've found the exact reason it's dirty in the next incident. Test it explicitly.
