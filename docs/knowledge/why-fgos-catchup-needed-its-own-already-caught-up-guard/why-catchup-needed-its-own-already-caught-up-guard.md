---
framework: diataxis
mode: explanation
---
# Why `fgos catchup` needed its own already-caught-up guard

`tsk-k7i` fixed a failure mode in `fgos catchup <id>` (`bin/fgos.mjs`,
`case 'catchup'`): when an item's own branch already contained the target
ref's tip, `catchup` failed permanently instead of recognizing there was
nothing left to do. The item's own description names the origin clearly:

> `fgos catchup` has the same no-op-merge failure mode that `tsk-3yl` fixed
> in `mergeRunnerItem`, but on its own verb and in the opposite merge
> direction: `catchup` merges the target ref INTO the item's own branch
> inside an ephemeral worktree via `git merge --no-commit --no-ff
> <target>`, then runs `git commit` unconditionally. When the item's
> branch already contains `<target>`'s tip (already caught up), that
> merge reports "Already up to date" and stages nothing, so `git commit`
> dies with "nothing to commit" and `catchup` fails permanently for that
> item — retrying can never succeed, since the underlying condition does
> not change.

## The bug had no recovery path

From `docs/history/catchup-already-caught-up/CONTEXT.md`:

> 1. `git merge --no-commit --no-ff <target>` reports "Already up to date"
>    and stages nothing.
> 2. `runGoalCheck` runs on the unchanged tree and can pass normally.
> 3. `execFileSync('git', ['commit', ...])` throws "nothing to commit".
>    The throw is uncaught on this path, so the verb exits 1 as an
>    unexpected error.
> 4. The item stays `blocked` forever. Retrying cannot help — the
>    condition (branch already contains the target) does not change by
>    retrying.

This was a known, already-documented gap with only a manual workaround
(`docs/how-to/recover-a-blocked-merge-conflict-when-catchup-cannot-reconcile-it.md`
line 43) before this item closed it structurally.

## Why the fix mirrors `tsk-3yl`'s guard instead of catching the commit failure

The design copies a proven shape rather than inventing a new one. Locked
decision D1:

> Guard with `git merge-base --is-ancestor <target> <own-branch>`
> **before** the merge. When true: skip merge and commit entirely, still
> run a real `runGoalCheck` on the existing tree; green →
> `moveWork(blocked → awaiting-approval)`, the same D18 edge the clean
> path already takes; red → keep the item `blocked` and report
> `verify-fail`, the same as the clean path's red branch.
>
> Mirrors `tsk-3yl`'s proven shape at `src/runner/merge.mjs:683`-`706`.
> Checked up front rather than inferred from the commit failure, because
> the commit-failure wording is locale/git-version dependent while
> `is-ancestor` is not. Verify is never skipped: the status move must rest
> on a freshly-executed check, not on the mere fact that the branch is
> caught up — "caught up" says nothing about whether the item deserves to
> leave `blocked`.

The plan (`docs/history/catchup-already-caught-up/plan.md`) explicitly
rejected the alternative of catching the `git commit` error after the
fact, for the same reason `tsk-3yl` rejected it: locale- and
git-version-dependent error text is not a safe branch condition, while
`is-ancestor`'s exit code is.

## Why the new outcome is a distinct value, not a reuse of `'merged'`

D2:

> That path returns `outcome: 'already-caught-up'`, a new value — not a
> reused `'merged'`... No merge commit is created, so `'merged'` would
> misreport what happened.

This knowingly diverges from `tsk-3yl`, which *did* reuse `'merged'` for
its own already-merged case — correctly, since a real merge into main had
happened there. `catchup` merges the opposite direction and, on this
path, creates no commit at all, so reusing the same word would describe
something that didn't occur.

## Proof this wasn't presumed safe

Because this diff touches `bin/fgos.mjs` — one of the modules the Iron
Law's capability test treats as able to weaken the system's own gate/verify
discipline — landing it required failing-test-first proof, not just a
green suite. Independently reproduced before merge: the two new tests in
`test/cli/fgos.test.mjs` (`already-caught-up` green and red cases) both
**fail** against pre-fix `bin/fgos.mjs`, with the red-verify case
reproducing the exact reported failure (`fatal: There is no merge to
abort (MERGE_HEAD missing)`), and both **pass** against the fixed branch.
