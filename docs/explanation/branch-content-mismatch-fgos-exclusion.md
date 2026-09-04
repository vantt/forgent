---
authoritative_for: mergeRunnerItem's post-merge integrity check (branchContentMismatch, src/runner/merge.mjs) false-positiving on the legitimate ADR0020 .fgos/ exclusion, blocking approve indefinitely with "verify-fail-post-merge" even though the real feature diff landed correctly on main — the false positive this retro-loop session's own tsk-2ewi and tsk-gb3 syntheses both bypassed via standing user authorization before this real fix landed
---

# The check the previous two syntheses had to work around, finally fixed

`tsk-52p` fixed the exact false-positive integrity check `tsk-2ewi` and
`tsk-gb3` (synthesized earlier this same retro-loop) both had to bypass
via manual `fgos move` and standing user authorization. `mergeRunnerItem`'s
post-merge integrity check (`branchContentMismatch`,
`src/runner/merge.mjs`) compares a branch's own introduced paths
(`base..branch` diff) against what its merge commit actually changed, to
catch a `git merge -s ours` content-discard — but it had no exemption for
`.fgos/` paths, even though ADR0020 requires every worker branch to
exclude `.fgos/` diffs entirely.

## Confirmed false positive, live, on `tsk-gb3`

After manually resolving a merge-conflict park by merging main into
`fgw/tsk-gb3` and restoring `.fgos/` paths to the branch's own frozen
pre-merge versions (the documented, sanctioned recovery in
`docs/how-to/fix-fgos-write-rejected-merge-block.md`, `tsk-3v2`
precedent), `fgos approve tsk-gb3 --acknowledge-iron-law` returned
`{to: "blocked", reason: "verify-fail-post-merge"}` — flagging
`.fgos/approve-post-success-faults.jsonl`, `.fgos/changelog-nag-history.jsonl`,
`.fgos/entropy-history.jsonl`, 5 `.fgos/events/*.jsonl` files, and
`.fgos/main-checkout-guard-warnings.jsonl` as "not reflected" on HEAD.

Verified not a real content discard: `tsk-gb3`'s real feature diff
(`resolveExecutorEnv` export, env-field validation) was fully and
correctly present on main at the merge commit. Only `.fgos/` paths were
flagged, and those are legitimately absent by ADR0020 design — never
discarded content.

## The cost while unfixed

The work item's own status metadata got stuck reporting `blocked`
indefinitely — retrying hit the same deterministic check every time, even
though the real code had landed correctly and safely on main. A
cosmetic/tracking-only symptom, but one that blocked the normal
`awaiting-approval → delivered` transition and misled anyone reading
`fgos check`/`fgos list`.

## What shipped

`branchContentMismatch`'s `introducedPaths` comparison now excludes any
`.fgos/` path outright — unconditionally, not gated by
`isMergeUnionPath` the way `resolveFgosOnlyConflict`'s own nearby exemption
is:

```diff
   const introducedPaths = git(repoRoot, ['diff', '--name-only', `${base}..${branch}`])
     .split('\n')
-    .filter((p) => p !== '');
+    .filter((p) => p !== '' && p !== '.fgos' && !p.startsWith('.fgos/'));
```

The unconditional exclusion (vs. the union-gated exemption elsewhere in the
same file) is deliberate: ADR0020 guarantees a worker branch can NEVER
legitimately reflect main's live `.fgos/` content, `merge=union`-declared
or not — so a branch-side `.fgos/` diff is never real discarded content,
just an expected, permanent divergence from HEAD.

## Why this matters to earlier syntheses in this same session

Both `tsk-2ewi` and `tsk-gb3` (synthesized earlier in this retro-loop run)
hit this exact false positive while landing their own merges, before this
fix existed, and were each individually bypassed via a direct `fgos move`
under explicit standing user authorization. Neither of those items caused
this bug — they're symptoms of the same class this item finally closes at
the root.
