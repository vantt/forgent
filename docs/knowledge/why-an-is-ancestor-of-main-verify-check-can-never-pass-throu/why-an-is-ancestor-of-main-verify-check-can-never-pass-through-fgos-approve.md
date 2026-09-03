---
framework: diataxis
mode: explanation
---
# Why an `is-ancestor-of-main` verify check can never pass through `fgos approve`

An item's `verify` command runs at two points: `fgos return` (on the
item's own branch) and `fgos approve`'s goal-check (`mergeRunnerItemLocked`,
`src/runner/merge.mjs`). It's tempting to write a verify command that
directly proves the fix landed on `main`, e.g.:

```
git merge-base --is-ancestor <sha> main && npm test
```

This can never pass through the mechanical `approve` pipeline, no matter
how correct the fix is.

## Why

`mergeRunnerItemLocked` stages the merge with `git merge --no-commit
--no-ff branch`, then runs the item's `verify` (`runGoalCheck`) against
that staged tree — and only *after* the goal-check passes does it run
`git commit` to actually advance the `main` ref. At the exact moment
`verify` runs, `main` still points at its pre-merge SHA. `git merge-base
--is-ancestor <sha> main` asks "is `<sha>` reachable from `main`'s
*current* ref" — and `main` hasn't moved yet. The check can only ever
report NOT ANCESTOR at that point, structurally, regardless of whether
the staged content is correct.

## How this was caught (tsk-13z)

`tsk-13z`'s own item `verify` was originally exactly this shape:
`git merge-base --is-ancestor 7add82b8 main && npm test`. It was
confirmed *runnable* during `fgos-researching` (round 1), but turned out
unsatisfiable through the gate pipeline — found empirically during
`fgos-coding-implement`, *after* the real merge had already landed on the
item's own working branch: running the exact command in that worktree
still reported NOT ANCESTOR, since `main` is a ref shared across every
worktree and genuinely hadn't moved yet from `approve`'s perspective at
verify-time.

## The fix: a content-based check instead

Replaced with a check that asserts the *fixed content itself* is
present, evaluable at both `fgos return` (on the item's own branch) and
`fgos approve`'s staged-pre-commit point — since the content is already
there on the staged tree, it doesn't need `main`'s ref to have moved:

```
npm test && POSITIVE && NEGATIVE
```

— asserting the fixed row is present, and no line still pairs the wrong
values, following `docs/how-to/write-verify-for-a-skill-prose-change.md`'s
own POSITIVE/NEGATIVE shape for a skill-prose deliverable. Empirically
confirmed to FAIL against the pre-fix content and PASS against the
merged content — a real discriminating check, unlike the ancestor test.
Because this changes the item's acceptance criteria, it was confirmed
with the user via `AskUserQuestion` before editing the item's `verify`
field, rather than silently swapped.

## The rule

**Never write a `verify` command that checks a SHA's ancestry against
`main`, or otherwise depends on `main`'s ref having already advanced.**
`approve`'s goal-check always runs before the commit that moves `main` —
write a content-based check (grep/test assertions against the staged
tree) instead, the same way any other verify command proves a
deliverable landed.
