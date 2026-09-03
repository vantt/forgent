---
framework: diataxis
mode: explanation
---
# Why `mergeRunnerItem` now checks ancestry before attempting a merge

`mergeRunnerItem`/`mergeRunnerItemLocked` (`src/runner/merge.mjs`) turns an
approved proposal into a real merge commit: `git merge --no-commit --no-ff
<branch>`, a `.fgos/`-write rejection check, the item's own verify, then
`git commit --no-edit`. Every early exit (`conflict`, `fgos-write-rejected`,
`verify-fail`) leaves the tree cleanly aborted. Until this fix, there was no
path for "this branch is already merged" — and that gap turned an
already-successful merge into a stuck retry.

## The failure this caused

If an earlier `approve` run already landed the merge commit successfully,
but then failed at a *later* step — the status-move to `done`, or any other
post-commit failure — the branch is now an ancestor of `HEAD`. A retry's
`git merge --no-commit --no-ff` becomes a no-op: nothing to stage. The
item's verify still runs and still passes (the code is already there), but
`git commit --no-edit` dies with "nothing to commit". `mergeRunnerItemLocked`
had no outcome for this — it threw an opaque `MergeError`
("verify passed for ... but git commit failed") instead of recognizing the
merge had already happened.

This was not hypothetical. It was caught in a real dogfood run
(decision `0018`, item `tsk-1wd-1`, 2026-07-28): the first `approve` attempt
merged successfully (`c90c5bb` onto `fgw/tsk-1wd`, confirmed via `git log`)
but died at the status-move to `done` because the item was missing its
`compound-learn` stage — an unrelated, independent gap. Running
`fgos compound tsk-1wd-1` and then retrying `approve` hit exactly this
failure. There was no clean retry path: unsticking the item required a
manual `fgos move` straight to `done`. The general lesson: *any* failure
landing after the merge-commit but before the status-move completes leaves
the item stuck on retry — not just the specific compound-learn gap that
first surfaced it. This is tracked as backlog row `p-b91d487a`
(`docs/backlog.md`).

## The fix

`mergeRunnerItemLocked` now checks `git merge-base --is-ancestor <branch>
HEAD` *before* attempting the merge — not inferred after the fact from an
empty staged diff, since a commit-failure error message is locale/git-version
dependent and not something to pattern-match reliably. If the branch is
already an ancestor:

- the real goal-check still runs against current `HEAD` (nothing is
  skipped or faked) — if it fails, the outcome is `verify-fail`, exactly
  like the normal path;
- if it passes, the outcome is `merged` — the exact same shape a
  first-time successful merge returns, with no new commit attempted.

Both existing `approve` call sites in `bin/fgos.mjs` (leaf→parent merge into
`fgw/<rootId>`, and root→main merge) already fall through generically on any
outcome other than `conflict`/`fgos-write-rejected`/`verify-fail` — reusing
`outcome: 'merged'` for the idempotent case needed **no caller-side
changes at all**.

Why still run the real goal-check instead of skipping it for speed: every
`'merged'` outcome, before and after this fix, carries a freshly-executed
verify result that both callers read directly
(`result.check.output`/`.status`). A synthesized or skipped check would
introduce a shape neither caller has ever had to handle, and would let a
regression that landed on `HEAD` since the original merge slip through
silently as "done" without ever actually being checked again.

## A second bug this fix caught: a broken verify command

Before this item reached `executing`, the engine's own `discover` step had
recorded its `verify` field as:

```
npm test -- --testNamePattern="mergeRunnerItem" && npm test -- --testNamePattern="merge.*idempotent"
```

Running it for real during validation showed it silently executes the
*entire* 1276-test suite, unfiltered — `--testNamePattern` is not a flag
Node's test runner recognizes (the real flag is `--test-name-pattern`), and
even that flag has no effect when appended to `npm test`'s own globbed
script command (`node --test 'test/**/*.test.mjs'`). It only filters when
passed directly to `node --test` targeting an explicit file:

```
node --test --test-name-pattern="mergeRunnerItem|merge.*idempotent" test/runner/merge.test.mjs
```

confirmed against the file's existing tests (8 matched) before the fix, and
against all 10 (8 existing + 2 new) after. The lesson: a recorded `verify`
command is only real evidence once it has actually been *run*, not read and
assumed correct — the whole reason `fgos-coding-validating` exists as a distinct
step before `executing` begins.

## The tests that pin this down

`test/runner/merge.test.mjs` now includes two idempotent-path cases,
alongside the existing `mergeRunnerItem` outcome suite:

- a branch already merged into `HEAD` (simulated by fast-forwarding the
  merge in directly, bypassing `mergeRunnerItem` — standing in for "a prior
  successful run already committed it") returns `outcome: 'merged'` with no
  new commit created;
- the same already-merged scenario, but with an unrelated regression landed
  on `HEAD` afterward, returns `outcome: 'verify-fail'` instead of a forced
  `'merged'` — proving the short-circuit does not skip the real check.

Both exist specifically so a future change to this idempotent path can't
silently reintroduce the stuck-retry regression, or the "always trust
`'merged'` without re-checking" shortcut, without a test noticing first.
