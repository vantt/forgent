---
type: how-to
title: How to recover `fgos approve`/`fgos sync-root` from inside a worktree with `--trust-dir`
tags: []
timestamp: 2026-08-11T00:00:00.000Z
framework: diataxis
mode: how-to
---
# How to recover `fgos approve`/`fgos sync-root` from inside a worktree with `--trust-dir`

Use this when you need to run `fgos approve <id>` or `fgos sync-root <id>`
while your session's shell is still sitting inside the item's own linked
worktree (checked out on `fgw/<id>`) instead of the main checkout — for
example, right after a `verify-fail-post-merge` block, without leaving the
worktree session first.

## Before you start

By default, both verbs refuse outright when invoked from inside any linked
worktree — a registered `fgos session start` worktree, an ad-hoc `git
worktree add`, or the item's own `pick`'d worktree. This is deliberate: it
closes two real incidents this codebase already hit —

- **`P44`** — without the guard, a merge could silently land on the
  worktree's own detached HEAD (never main), or a goal-check could verify
  the worktree's own possibly-stale tree while `approve` still reported
  "verified on main."
- **`review-260718`** — the `--github` merge path once called into GitHub
  and moved the item to `done` *before* this same guard ever ran, reopening
  the exact same risk from a different code path. The guard is now
  positioned ahead of every source branch, including `--github`.

`--trust-dir` does not remove either guard — it changes what `repoRoot`
those guards check, from your shell's own `cwd` to the value `--dir`
resolves to.

## Steps

1. **Only use `--trust-dir` together with an explicit `--dir` pointed at
   the real main checkout.** Without `--dir`, `--trust-dir` is a no-op —
   `repoRoot` falls back to the same value `process.cwd()` already gives,
   so the guard still refuses exactly as it does today:

   ```
   fgos approve <id> --trust-dir --dir "$(git rev-parse --path-format=absolute --git-common-dir | xargs dirname)"
   fgos sync-root <id> --trust-dir --dir "$(git rev-parse --path-format=absolute --git-common-dir | xargs dirname)"
   ```

2. **Know what you're asserting.** Passing `--trust-dir` is you telling
   `fgos` that the `--dir` value really is the stable main checkout — the
   same trust every `fgos-coding-driving`-style caller already places in
   `--dir` elsewhere. If `--dir` is wrong (points at some other tree
   entirely), the guard cannot catch that for you; it now trusts `--dir`
   completely instead of checking your shell's own identity.

3. **Prefer leaving the worktree first when that's easy.** `--trust-dir`
   exists for the case where re-entering the main checkout is inconvenient
   or impossible in the moment (e.g. mid-session recovery). If you can
   simply run the command from the main checkout instead, that path needs
   no flag and carries no trust question at all.

## Outcome

`approve`/`sync-root` complete normally against the real main checkout,
exactly as if you had run them from there — the git operations underneath
(`withMergeEphemeralWorktree`, the merge/verify steps) already target
`repoRoot`, which now resolves correctly regardless of your shell's own
`cwd`.

## `promote-to-component`

`fgos promote-to-component` (batch-merging several flat member items into
one shared component) carries the exact same guard, one layer deeper —
`retargetMember`, the engine function it delegates each member's own
merge to, independently re-checks the same worktree identity. `--trust-dir`
still only needs passing once, at the `promote-to-component` call itself:

```
fgos promote-to-component --ids <a,b> --root-title "..." --trust-dir --dir "$(git rev-parse --path-format=absolute --git-common-dir | xargs dirname)"
```

`retargetMember`'s own guard never needs its own separate flag — it
receives the same `repoRoot` value `promote-to-component`'s own CLI
handler already resolved from `--dir`, so it correctly allows the batch
merge to proceed once the outer guard has. As with `approve`/`sync-root`
above, omitting `--dir` makes `--trust-dir` a no-op — every member merge
still refuses exactly as it does today.
