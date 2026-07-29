# tsk-3yl: mergeRunnerItem idempotent on already-merged branch

## Feature boundary

`mergeRunnerItem`/`mergeRunnerItemLocked` (`src/runner/merge.mjs:348-453`)
has no check for "this branch is already merged into HEAD" before it runs
`git merge --no-commit --no-ff <branch>` then `git commit --no-edit`. If a
prior `approve` run already landed the merge commit (verify passed, commit
succeeded) but then failed at a *later* step — status-move to `done`, or
any other post-commit failure — the branch is now an ancestor of HEAD. A
retry's `git merge --no-commit --no-ff` becomes a no-op (nothing staged),
the subsequent goal-check still runs and passes (the code is already
there), but `git commit --no-edit` dies with "nothing to commit" — surfaced
as an opaque `MergeError` ("verify passed but git commit failed") instead
of recognizing the merge already happened and proceeding through the
status move. There is no clean retry path today; unsticking requires a
manual `fgos move` to `done`.

This item adds an ancestry short-circuit inside `mergeRunnerItemLocked`,
before the `git merge --no-commit --no-ff` attempt: if `<branch>` is
already an ancestor of `HEAD` (`git merge-base --is-ancestor <branch>
HEAD`), skip straight to the existing `'merged'` outcome shape instead of
attempting (and failing) a redundant commit.

## Scout findings (grounding for the decisions below)

- `mergeRunnerItemLocked` (`src/runner/merge.mjs:401-453`) today always
  runs, in order: `git merge --no-commit --no-ff branch` → staged-`.fgos/`
  rejection check → `runGoalCheck` → `git commit --no-edit`. Every early
  return (`conflict`, `fgos-write-rejected`, `verify-fail`) aborts the
  merge cleanly first; only the final `git commit` failure path throws
  `MergeError` instead of returning a defined outcome.
- Both production call sites (`bin/fgos.mjs`'s `approve` command) branch
  explicitly on `conflict` / `fgos-write-rejected` / `verify-fail`, then
  **fall through** to the same "merged" handling for anything else (lines
  1848-1867 for the leaf→parent ephemeral-worktree path, 1939-1948 for the
  root→main path). Neither call site special-cases `outcome === 'merged'`
  — reusing that exact outcome shape for the idempotent case needs **no
  caller-side changes at all**.
- Both call sites read `result.check.output` / implicitly `result.check`
  unconditionally on the merged path (`bin/fgos.mjs:1865`, `:1948`) — the
  returned `check` object must always be present and shaped like a real
  goal-check result, whichever path produced the `'merged'` outcome.
- Both call sites unconditionally call `cleanupMergedBranch` on the merged
  path (deletes the now-fully-merged local branch) — this already-generic
  cleanup applies identically to the idempotent short-circuit, no new
  logic needed there.
- This exact gap is already tracked as backlog row `p-b91d487a`
  (`docs/backlog.md:43`), written from the same real dogfood incident this
  item's own description cites (`tsk-1wd-1`, decision `0018`,
  2026-07-28): first `approve` attempt merged successfully (`c90c5bb` onto
  `fgw/tsk-1wd`, confirmed via `git log`) but died at the status-move to
  `done` for an unrelated reason (missing `compound-learn` stage); the
  *second* `approve` attempt is what hit today's "nothing to commit"
  failure. The backlog row's own proposed fix already names the exact
  mechanism this item locks: `git merge-base --is-ancestor <branch> HEAD`,
  short-circuit to `outcome: 'merged'`, idempotent, no retried commit.
- The merge target (`HEAD` at `repoRoot`) is already resolved
  target-agnostically by the existing code (per its own doc-comment,
  lines 324-334) — a root→main merge runs `repoRoot` checked out on
  `main`; a leaf→parent merge runs an ephemeral worktree checked out on
  `fgw/<rootId>`. `git merge-base --is-ancestor <branch> HEAD` is
  correct for both without needing to know which ref HEAD resolves to.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | On the ancestry short-circuit, still run the real `runGoalCheck` against current HEAD before declaring `outcome: 'merged'` — do not skip verify or synthesize a placeholder `check` result. If goal-check fails, return `outcome: 'verify-fail'` (same as the normal path) rather than forcing `'merged'` regardless. Rationale (person's choice): every `'merged'` outcome today carries a real, freshly-executed verify result that both call sites surface as-is (`result.check.output`); a synthesized/skipped `check` would introduce a `check.output` shape neither call site has ever had to handle, and conflicts with this repo's standing rule against fake data or shortcuts substituting for a real check (`~/.claude/rules/development-rules.md`: "Implement real behavior. Do not add fake data, mocks, or temporary shortcuts just to satisfy a check."). |

## Pinned terms

- **"already-merged branch"** = `<branch>` (the item's `fgw/<id>`) is an
  ancestor of the current `HEAD` at `repoRoot` — i.e. `git merge-base
  --is-ancestor <branch> HEAD` exits 0 — checked *before* attempting `git
  merge --no-commit --no-ff`, not inferred after the fact from an empty
  staged diff.
- **"idempotent merge"** = a second (or later) `mergeRunnerItemLocked`
  call against a branch already merged by an earlier, partially-failed
  attempt returns the same `outcome: 'merged'` shape a first-time
  successful merge would have returned, requiring zero special-casing
  from either caller.

## Deferred to planning (implementer's concern, not asked here)

- Exact placement of the `git merge-base --is-ancestor` check relative to
  the main-checkout lock acquisition in `mergeRunnerItem` (before vs.
  after `acquireMainCheckoutLock`) — a concurrency/perf implementation
  choice, not a product decision.
- Whether the ancestry check is a new small exported helper in
  `merge.mjs` or inlined directly in `mergeRunnerItemLocked` — module
  shape, not scope.
- Exact test coverage shape (unit test simulating a pre-merged branch
  retry) — the item's own `verify` field is still "chưa xác định — P15
  bổ sung" (not yet determined); planning writes the concrete verify
  command.

## Canonical references

- `src/runner/merge.mjs:293-453` — `changedFiles`, `mergeRunnerItem`,
  `mergeRunnerItemLocked` (the functions this item changes).
- `bin/fgos.mjs:1793-1878` — leaf→parent `approve` call site (ephemeral
  worktree on `fgw/<rootId>`), merged-outcome fallthrough at 1848-1867.
- `bin/fgos.mjs:1888-1950` — root→main `approve` call site, merged-outcome
  fallthrough at 1939-1948.
- `docs/backlog.md:43` (`p-b91d487a`) — the tracked backlog row this item
  implements; same incident, same proposed fix.
- `docs/decisions/0018-moc-mvp2-fgos.md` — the MVP2 decision record whose
  dogfood run (`tsk-1wd-1`) surfaced this gap.

## Outstanding questions

None — the one material question (verify-on-short-circuit) was locked
with the person this session.
