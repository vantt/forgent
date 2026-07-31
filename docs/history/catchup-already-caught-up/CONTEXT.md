# CONTEXT — `fgos catchup` on an already-caught-up branch

Item: `tsk-k7i` (kind `bug`). Refs: `tsk-rrw` (the duplicate filing whose
clarify scout found this), `tsk-3yl` (the same failure family, already fixed
on the other verb).

## Feature boundary

One call site: the `git commit` inside `case 'catchup'` in `bin/fgos.mjs`
(around line 2330), and the guard that must precede it.

In scope: what `fgos catchup <id>` does when the item's own branch already
contains the target ref's tip, so `git merge --no-commit --no-ff <target>`
stages nothing.

Out of scope: `mergeRunnerItem`'s own already-merged path (already fixed by
`tsk-3yl`, commit `4dc4f8f`); conflict resolution of any shape; the
`catchup` precondition set; the anti-loop accounting of the `blocked →
awaiting-approval` edge.

## The failure being fixed

`catchup` merges the target ref **into** the item's own branch inside an
ephemeral worktree, then runs `git commit` unconditionally
(`bin/fgos.mjs`, `case 'catchup'` at line 2229; the commit at ~2330):

1. `git merge --no-commit --no-ff <target>` reports "Already up to date"
   and stages nothing.
2. `runGoalCheck` runs on the unchanged tree and can pass normally.
3. `execFileSync('git', ['commit', ...])` throws "nothing to commit". The
   throw is uncaught on this path, so the verb exits 1 as an unexpected
   error.
4. The item stays `blocked` forever. Retrying cannot help — the condition
   (branch already contains the target) does not change by retrying.

Documented as a known gap with a manual workaround at
`docs/how-to/recover-a-blocked-merge-conflict-when-catchup-cannot-reconcile-it.md`
line 43.

## Locked decisions

| ID | Decision | Why |
|---|---|---|
| D1 | Guard with `git merge-base --is-ancestor <target> <own-branch>` **before** the merge. When true: skip merge and commit entirely, still run a real `runGoalCheck` on the existing tree; green → `moveWork(blocked → awaiting-approval)`, the same D18 edge the clean path already takes; red → keep the item `blocked` and report `verify-fail`, the same as the clean path's red branch. | Mirrors `tsk-3yl`'s proven shape at `src/runner/merge.mjs:683`-`706`. Checked up front rather than inferred from the commit failure, because the commit-failure wording is locale/git-version dependent while `is-ancestor` is not. Verify is never skipped: the status move must rest on a freshly-executed check, not on the mere fact that the branch is caught up — "caught up" says nothing about whether the item deserves to leave `blocked`. |
| D2 | That path returns `outcome: 'already-caught-up'`, a new value — not a reused `'merged'`. | No merge commit is created, so `'merged'` would misreport what happened. `catchup`'s result object is emitted as JSON directly, and `catchup` has no plugin wrapper (`docs/specs/fgos-plugin.md:149`, R4 not implemented), so the only consumers are tests and operators reading output — a new value breaks nothing and lets an operator tell "catchup only verified" apart from "catchup really pulled the target in". |

D2 knowingly diverges from `tsk-3yl`, which reused `'merged'` for its
own already-merged case. That reuse was true there: the work really was
merged into main. Here it would not be.

## Pinned terms

- **already-caught-up** — the item's own branch already contains the target
  ref's tip, i.e. `git merge-base --is-ancestor <target> <own-branch>` is
  true. Distinct from `tsk-3yl`'s **already-merged**, which is the opposite
  direction: the item's branch is an ancestor of `HEAD`/main.
- **target** — `branchNameFor(resolveRoot(view, id))` for a leaf item,
  `'main'` for a root or standalone item. The existing D3/D11 split
  `catchup` already computes.

## Scout evidence

- `bin/fgos.mjs:2229` — `case 'catchup'`: preconditions (`status ===
  'blocked'`, `reason ∈ {merge-conflict, verify-fail-post-merge,
  integration-drift}`, `branchExists`), target resolution, ephemeral
  worktree.
- `bin/fgos.mjs:2282` — the merge; `~2330` — the unconditional `git commit`
  that fails.
- `src/runner/merge.mjs:683` — `isAlreadyMerged`, the guard shape to mirror,
  including its `err.status === 1` handling (exit 1 is a boolean `false`,
  not an error).
- `src/runner/merge.mjs:695`-`706` — the already-merged branch that still
  runs the real goal check before declaring an outcome.
- `test/runner/merge.test.mjs:628`, `:643` — the two tests covering
  `tsk-3yl`'s equivalent path (idempotent merge; verify still re-run and
  red still reported).
- `docs/specs/runner.md:1021` — the locked `catchup` contract. It describes
  conflict / clean-then-verify / commit-then-move, and has no
  already-caught-up case; it must be updated for D1 and D2.
- `docs/specs/fgos-plugin.md:149` — `catchup` has no plugin wrapper (R4).
- `test/cli/fgos.test.mjs:5250`+ — the existing `catchup` CLI tests
  (clean / real-conflict / inapplicable-reason), where a new
  already-caught-up case belongs.

## Deferred to planning

- Whether the guard lives inline in `case 'catchup'` or is lifted into a
  shared helper alongside `isAlreadyMerged` — `catchup` deliberately does
  not call `mergeRunnerItem` (opposite merge direction, `runner.md:1021`),
  so sharing is not automatic.
- The item's own `verify` field is still the intake placeholder
  (`chưa xác định — P15 bổ sung`) and needs a real command before `return`.
