# Research: tsk-jg4 — resyncWorktree crash-window orphaned patch

## Round 1 (discovery, 2026-08-13)

**Asked:** does this codebase have precedent for a crash-recovery/marker
pattern; where do orphaned resync patches land and does anything read that
directory back; is there an existing decision settling option A (detect +
refuse loudly on a pre-existing orphaned patch) vs option B (a full
before/after marker distinguishing "reset done, reapply pending" from
clean) for this specific gap.

**Checked / found:**

1. `resyncWorktree` (`src/runner/worktree.mjs:711-788`, current — line
   numbers shifted slightly after tsk-jgs's unrelated fix to the CLI call
   site). The crash window: step 2 `git reset --hard branchTip` (line
   761), then — only when `patch` is non-empty — step 4's `git apply
   --index patchPath` (line 779). A kill between those two leaves the
   worktree at `branchTip` (a real reflog entry, so `lastSyncedCommit` on
   the NEXT run reads `already-in-sync` and does nothing) with the staged
   patch still sitting, unremoved, at `patchPath`.

2. Patch file location: `path.join(gitCommonDir, 'fgos-resync-patches')`
   (`worktree.mjs:757`), filename
   `${branch.replace(/\//g,'-')}-${Date.now()}.patch` (`worktree.mjs:759`).
   Grepped the whole repo (`fgos-resync-patches`) — the only other hit is
   `test/runner/worktree.test.mjs:870`, itself testing the "real conflict
   preserves the patch" path. **Nothing today ever reads this directory
   back** — the only place a leftover patch path is even mentioned again is
   the real-conflict error message at `worktree.mjs:782` (referring to the
   file it JUST wrote, in the same call), never a check for a
   pre-existing one from an EARLIER call. Confirms the item's own claim:
   the signal is silently discarded.

3. Existing crash-recovery precedent: `src/runner/main-checkout-lock.mjs`
   implements a real "wx-atomic-create + stale-pid-reclaim lock lineage"
   (its own file-header comment, `main-checkout-lock.mjs:8`) — the
   established pattern in this codebase for "a marker survives a crash;
   detect and treat it as reclaimable/actionable on the next run" rather
   than silently ignoring it. No CONTEXT.md/decision record settles A vs B
   for THIS specific gap (tsk-jg4 has no `docsRef`, never went through
   `exploring`) — but the lock-lineage precedent, plus the fact that the
   real-conflict path (`worktree.mjs:780-784`) ALREADY treats "a patch
   file sitting on disk, unresolved" as the correct trigger for a loud
   refusal (not a marker file — the patch file itself IS the signal),
   shows option A is not a new invented mechanism: it is the SAME
   already-established response (refuse, name the file, tell the user to
   inspect it) the codebase already gives for the sibling "real conflict"
   case, just checked proactively at the TOP of a run instead of only
   encountered reactively mid-run.

4. Behavioral consequence of A, checked directly: `patchPath` is only
   `fs.rmSync`'d on a SUCCESS path (line 770, line 787) — the real-conflict
   throw at line 780-784 leaves the file in place. So even today, a
   worktree that hit a real conflict and was manually fixed by the user
   still has a stale patch file sitting in `fgos-resync-patches/` after
   the fact; option A's "any pre-existing patch for this branch → refuse"
   would also catch that residual case on the NEXT resync attempt, forcing
   an explicit clean-up rather than leaving an ever-growing pile of
   unread patch files — a second, real (if minor) latent bug this option
   incidentally also closes.

**Verdict: clear**, scope locked to **option A** (the item's own "at
minimum" floor): at the top of `resyncWorktree`, before doing anything
else, glob `fgos-resync-patches/` for `${branch.replace(/\//g,'-')}-*.patch`
and refuse loudly (same `WorktreeError` shape the real-conflict path
already uses) if any match, naming the file(s) and instructing the caller
to inspect/clean them up before resyncing. Option B (a distinct
before/after state marker) is a genuine further design question — new
marker semantics, when to write/clear it, how it interacts with the
already-existing patch-file-as-signal mechanism — not something evidence
alone settles, and the item's own phrasing ("a full fix MIGHT...") frames
it as optional beyond the described hazard's floor, not required to close
it. Locking B out of this item's scope is a normal planning-stage
scope-narrowing (same authority `fgos-coding-planning`'s own "smaller
path" step already has), not a reopened product decision — nothing about
A vs B was ever locked in a `CONTEXT.md` this item has (it has none).
Verify: `npm test`.
