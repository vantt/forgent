# Plan — tsk-198: widen isUnchangedSinceBranchHeadAtTake to a real no-diff check

Mode: tiny

No CONTEXT.md/exploring round — discovery verdict was `clear`. Direct
follow-up to tsk-4s6 (`src/runner/merge.mjs`, `isUnchangedSinceBranchHeadAtTake`,
next to `isMergeUnionPath`, ~line 1176), which used blob-equality
(`git rev-parse <ref>:<path>`) to prove a `.fgos/` path is safe to restore
to main's HEAD. Blob-equality throws (caught, returns `false`) when the
path doesn't exist at `branchHeadAtTake` at all — so a path the branch
never possessed at any point falls through to `fgos-write-rejected`, even
though the branch contributed nothing to it.

## Approach

Replace the two `git rev-parse <ref>:<path>` calls + string comparison
with one `git diff --quiet <branchHeadAtTake> <branch> -- <path>` (exit 0
= no diff, exit 1 = diff, exit >1 = real error). This is a strictly
*weaker* (safer) claim than blob-equality already made — "no diff"
already implies "blob equal" when both sides have the path, and
additionally covers "path absent on both sides" (today's residual gap)
without needing either blob to exist. No `try`/`catch` needed around the
git call itself for the absent-path case — `git diff` never throws for a
missing path on both sides, it just reports no difference.

```js
function isUnchangedSinceBranchHeadAtTake(repoRoot, branch, relPath, branchHeadAtTake) {
  if (!branchHeadAtTake) return false;
  try {
    execFileSync('git', ['diff', '--quiet', branchHeadAtTake, branch, '--', relPath], { cwd: repoRoot });
    return true;
  } catch (err) {
    if (err.status === 1) return false; // real diff -- branch did touch this path
    return false; // git itself errored (bad ref, etc.) -- fail closed, same as before
  }
}
```

(Exact plumbing helper — `git()` vs `execFileSync` directly — matches
whatever `merge.mjs` already uses at that call site; no new import
needed either way.)

**Alternatives rejected:** keep blob-equality and add a separate
"absent on both sides" branch — rejected as needless duplication; `git
diff --quiet` already expresses both cases in one primitive, and is the
same tool git itself uses to answer "did anything change here."

**Risk map:**

| Component | Risk | Proof point |
|---|---|---|
| Widened check function | low | existing `test/runner/merge.test.mjs:1638`-ish tsk-4s6 test (blob-equal case) must still pass unchanged; new test proves the absent-on-both-sides case |
| Restore-loop gate (unchanged, already widened by tsk-4s6) | low | no further changes needed there — same call site, same signature |

Impact-analysis posture: same as tsk-4s6 — GitNexus present, flagged
stale; cross-checked via direct `grep -rn "isUnchangedSinceBranchHeadAtTake"
src/ test/` (only the one definition + one call site + tsk-4s6's own
test file reference it — confirmed, no wider blast radius than tsk-4s6
itself already had).

## Shape

Single piece. Files touched:
1. `src/runner/merge.mjs` — replace the function body only; call site
   (the restore-loop gate) is untouched.
2. `test/runner/merge.test.mjs` — one new test: `.fgos/config.json`-shaped
   path absent at `branchHeadAtTake`, absent on the branch's current tip,
   present and drifted on main (mirrors the accepted tsk-4s6 test shape,
   swap "unchanged content" for "absent on both sides").

## Outstanding questions

None
