---
framework: diataxis
mode: explanation
---
# Why the main-checkout-lock hook used to block worktree commits it had no reason to touch

`.githooks/pre-commit` enforces the STR65 main-checkout activity lock —
it fires for any `git commit` against this repo, so two sessions never
commit to the shared `.fgos/events.jsonl` state at the same time. It used
to fire unconditionally for that purpose, including for a commit made
entirely inside an unrelated linked worktree (a `fgos pick` `fgw/<id>`
branch) — one that writes to its own separate `.git/index` and branch,
and never touches the main checkout's own lock hazard at all.

## Why the same physical file runs for both

`core.hooksPath` is a repo-wide git config setting (`.git/config`),
shared by every linked worktree, not a per-worktree setting. Confirmed
directly: `git config --get core.hooksPath` run from the main checkout
and from a linked worktree returns the exact same absolute path back to
the main checkout's `.githooks/pre-commit`. There is only one physical
copy of this file, and its `__dirname`/`repoRoot` always resolve to the
main checkout — regardless of which worktree's `git commit` actually
triggered it.

## The original lock hazard never involved worktrees at all

The lock exists because of a real, earlier incident (`tsk-3w8`,
`docs/decisions/0021-wire-main-checkout-hook-qua-doctor-setup.md`): one
session ran `git commit` by hand directly on `main` at the same moment
`approve`'s `mergeRunnerItem` also ran `git commit --no-edit` on `main` —
two writers racing on the same `.git/index`. Decision 0021 discusses that
race on main's index specifically; it never mentions worktrees.

Mechanically, that race cannot happen from a linked worktree: each linked
worktree has its own separate `.git/index` (`.git/worktrees/<name>/index`)
that never touches the main checkout's index. A worktree commit racing
against a main-checkout commit isn't the same hazard the lock was built
to close — there's no shared index for the two to clobber.

## The asymmetry that gave it away

The same file already has a second guard,
`currentFgwBranchIfMainCheckout`, that correctly tells a worktree apart
from the main checkout by comparing `git rev-parse --git-dir` against
`--git-common-dir` (equal only at the main checkout; a linked worktree's
git-dir nests under `<main>/.git/worktrees/<name>`, so they differ) — and
that guard already skips worktrees on purpose. The lock-acquisition guard
sitting right above it in the same file, by the same author, had no
equivalent check at all, running unconditionally. An asymmetry like that
inside one file is a real signal of an omission, not a considered
decision — confirmed further by `tsk-45y` (the one prior item that
discussed "isolate `.fgos` per worktree," closed wontfix/resolved-by-
context): its own scout evidence (`rg -- "main-checkout-lock" src bin
test docs`) never grepped `.githooks/` — the one place this lock actually
reaches into worktree commits — so that closure has a real blind spot in
its own evidence rather than having considered and rejected this case.

## The fix: tell "away from home" apart from "at home"

Rather than pushing a worktree-vs-main check into `acquireMainCheckoutLock`
itself — a primitive shared by other call sites (`claim-port.mjs`,
`merge.mjs`) that have no reason to change behavior for this one caller —
the fix adds a guard local to the hook, `hookRunsAtHome`:

```js
function hookRunsAtHome(repoRoot) {
  const actualToplevel = execFileSync('git', ['rev-parse',
    '--path-format=absolute', '--show-toplevel'], { encoding: 'utf8' }).trim();
  return actualToplevel === repoRoot;
}
```

`--show-toplevel` runs with no explicit `cwd`, so it resolves relative to
wherever the actual `git commit` invoked it from — the real worktree,
when that's what's committing. `repoRoot` is derived from `__dirname`,
which is always the main checkout's own script location, regardless of
who invoked it. When the two differ, the hook is running "away from
home": for a checkout other than the one whose `.fgos`/lock/branch state
it would otherwise act on, and none of its guards have anything real to
protect there — `main()` exits `0` immediately in that case, before
`acquireMainCheckoutLock` is ever called.

## What stays true either way

The lock itself is not a bug: two sessions committing at the same time to
the same main checkout is still a real hazard, and the lock still exists
specifically to serialize that. The fix only narrows *where* the check
applies — the main checkout's own commits still go through
`acquireMainCheckoutLock` exactly as before; a linked worktree's commits
now skip it entirely, on the mechanical grounds that they were never the
hazard the lock was built to prevent.
