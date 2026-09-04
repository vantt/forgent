---
authoritative_for: isUnchangedSinceBranchHeadAtTake (tsk-4s6, src/runner/merge.mjs) using blob-equality instead of a real diff check, so a .fgos/ path the branch never possessed at any point still fell through to fgos-write-rejected — confirmed live merging fgw/tsk-25b (the one remaining path after tsk-4s6's own fix)
---

# A blob-equality proof that couldn't handle "never existed at all"

`tsk-198` closed a gap in `tsk-4s6`'s own fix. `tsk-4s6` added
`isUnchangedSinceBranchHeadAtTake` (`src/runner/merge.mjs`, next to
`isMergeUnionPath`) as a second trust criterion for restoring a
`fgos-write-rejected` `.fgos/` path to main's HEAD — proving the branch
never intentionally edited that path since `branchHeadAtTake`. It did this
via blob-equality: `git rev-parse <branchHeadAtTake>:<path>` compared
against `git rev-parse <branch>:<path>`.

## The gap blob-equality couldn't cover

Blob-equality throws (caught, returns `false`) when the path never existed
on the branch at `branchHeadAtTake` at all. So a path the branch never
possessed at any point — not merely "unchanged since fork" — still fell
through to `fgos-write-rejected`, even though the branch contributed
literally nothing to it.

Confirmed live merging `fgw/tsk-25b`: `tsk-4s6`'s own fix had already
resolved 2 of its original 3 blocked paths (`config.json`, the legacy
`events.jsonl` baseline — both genuinely unchanged since
`branchHeadAtTake`). The one remaining path,
`.fgos/events.jsonl.backup-tsk-1lv-4-dedup-fix-20260817`, was present at
the merge-base and on main's current HEAD, but absent from BOTH the
branch's `branchHeadAtTake` commit and its current tip —
`git rev-parse branchHeadAtTake:<path>` threw "exists on disk, but not in
`<ref>`". The branch never introduced this path at all, yet still got
blocked as if it had a real conflicting edit.

## What shipped

`isUnchangedSinceBranchHeadAtTake`'s proof was widened from blob-equality
to a real no-diff check:

```diff
 function isUnchangedSinceBranchHeadAtTake(repoRoot, branch, relPath, branchHeadAtTake) {
   if (!branchHeadAtTake) return false;
   try {
-    const atTake = git(repoRoot, ['rev-parse', `${branchHeadAtTake}:${relPath}`]).trim();
-    const atBranchHead = git(repoRoot, ['rev-parse', `${branch}:${relPath}`]).trim();
-    return atTake === atBranchHead;
-  } catch {
+    git(repoRoot, ['diff', '--quiet', branchHeadAtTake, branch, '--', relPath]);
+    return true;
+  } catch (err) {
     return false;
   }
 }
```

`git diff --quiet` exits 0 when there's no diff between the two refs for
that path — which naturally covers both "blob identical on both sides"
(the original case `tsk-4s6` handled) and "path absent on both sides"
(this gap), with zero new risk: "no diff at all" is a strictly weaker,
safer claim than blob-equality was already making. A non-zero exit (real
diff, or any git error resolving the refs) still falls through to `false`,
preserving the existing safe fallback.

`test/runner/merge.test.mjs` gained a case mirroring `tsk-4s6`'s own test
pattern: a `.fgos/` path absent at `branchHeadAtTake`, absent on the
branch's current tip, and present+drifted on main.
