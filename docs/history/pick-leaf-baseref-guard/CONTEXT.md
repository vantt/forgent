# pick-leaf-baseref-guard — locked decisions

Item: `tsk-3t4`. Source text (raw, untrusted per RUL45): claims `pick`
forks every leaf worktree from `main`/current HEAD, never from its root's
`fgw/<rootId>` branch, unlike `approve`/`review` which already split
leaf-vs-root — cites a dogfood incident (`tsk-1wd-3`, 2026-07-28) where a
leaf forked from `main` was missing sibling files not yet merged into the
root branch.

## Feature boundary

Scouting during this clarify pass found the item's premise partly stale:
the leaf-vs-root base-ref fix it asks for already landed on `main` the
same day the dogfood incident happened, in a *different* item's commits
(`d924b2d` "feat(tsk-3oa): add claim-port.mjs", refined by `268b172`
"fix(claim-port): categorize ClaimError, guard leaf baseRef, fix stray
cite"). `claimWork` (`src/runner/claim-port.mjs:110-114`) now computes
`resolveRoot`/`isLeaf`/`rootBranch` and passes `baseRef` into
`createWorktree`, which honors it (`src/runner/worktree.mjs:271-272`) —
exactly the pattern `approve`/`review` already used. Both `take` and
`pick` in `bin/fgos.mjs` route through this same `claimWork`.

What remains real, confirmed by further scouting:

1. **No positive-path regression test.** `test/cli/fgos.test.mjs:3069`
   only covers the fallback (root branch doesn't exist yet → forks from
   HEAD). No test proves a leaf actually forks from an *existing*
   `fgw/<rootId>` tip instead of main.
2. **Sibling-merge-ordering gap in session `pick`.** The runner's own
   autonomous loop (`src/runner/loop.mjs`) never hits this — it dispatches
   one item at a time, FIFO, gated by `frontier.mjs`'s `depsReady` (deps
   must be `status: 'done'`). But session `pick --id` deliberately bypasses
   frontier/stage membership for an explicit id (claim-lock §3a, tested at
   `test/cli/fgos.test.mjs:2993`) — nothing stops picking a leaf whose dep
   isn't `done` yet, which is exactly the `tsk-1wd-3` dogfood scenario
   (picked before its sibling dep was approved+merged into `fgw/tsk-1wd`).

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | Item scope covers both: (a) add the missing positive-path regression test for the already-implemented leaf base-ref fork (`claim-port.mjs`), and (b) fix the sibling-merge-ordering gap in session `pick` — not just close the item as a stale duplicate. |
| D2 | The sibling-merge-ordering fix is a hard guard: `pick` refuses the claim outright (no worktree created, no state mutated) when a leaf's dep isn't yet `done`. Not a warn-and-allow, not docs-only. |

## Pinned technical note (implementer-level, deferred to `fgos-coding-planning`)

- `approve`'s only path to `status: 'done'` for a leaf item is through a
  successful merge into `fgw/<rootId>` (`bin/fgos.mjs:1856`, inside the
  `rootId !== id` branch — merge conflict/verify-fail routes to `blocked`
  instead, never `done`). So a leaf dep reading `status: 'done'` already
  guarantees its content is merged into the root branch — D2's guard can
  reuse the existing `deps.every((dep) => work[dep]?.status === 'done')`
  predicate (`src/state/frontier.mjs:89`) rather than writing a new
  git-ancestor walk. Confirming this is `fgos-coding-planning`'s call, not
  re-decided here.

## Scout evidence cited

- `src/runner/claim-port.mjs:100-114` — `rootId`/`isLeaf`/`rootBranch`/
  `baseRef` computation, already leaf-vs-root aware.
- `src/runner/worktree.mjs:200-272` — `createWorktree` forks `-b branch
  worktreePath baseRef` when `opts.baseRef` is set.
- `bin/fgos.mjs:1286,1346` — both `take` and `pick` delegate to the same
  `claimWork`.
- `git log` — `d924b2d` (2026-07-28 17:34) introduced `resolveRoot`/
  `isLeaf` in `claim-port.mjs`; `268b172` (2026-07-28 20:38) added the
  `rootBranchExists` fallback guard. Both confirmed ancestors of `main`
  (`git merge-base --is-ancestor 268b172 main`).
- `test/cli/fgos.test.mjs:3069-3088` — only the fallback (no root branch)
  path is tested; no positive-path (root branch exists, leaf forks from
  its tip) test exists.
- `test/cli/fgos.test.mjs:2993-3009` — `pick --id` explicitly bypasses the
  frontier/stage guard for a specific id (claim-lock §3a).
- `src/state/frontier.mjs:89` — `depsReady = item.deps.every((dep) =>
  work[dep]?.status === 'done')`, the existing predicate D2's guard can
  reuse.
- `src/runner/loop.mjs:1-29` — runner's own FIFO one-item-at-a-time
  dispatch, unaffected by this gap (deps already gate the frontier there).
- `bin/fgos.mjs:1788-1867` — leaf `approve` merge-into-root path; `to:
  'done'` (line 1856) only reached after a successful merge.

## Deferred to planning

- Exact refusal error message/category for D2's guard (e.g. new
  `ClaimError` code vs reusing an existing category).
- Where the guard lives: inside `claimWork` (`src/runner/claim-port.mjs`,
  covering both `take` and `pick`) vs `pick`'s own case in `bin/fgos.mjs`
  only — `take` never creates a worktree so may not need the same check,
  but its `branchHeadAtTake` could still source from an unmerged sibling.
- Whether the guard checks only the leaf's *direct* `deps`, or needs any
  transitive walk (a dep's own deps) — `depsReady`'s existing predicate is
  non-transitive per-item today; whether that's already sufficient given
  each dep's own claim would have applied the same guard is a planning
  question.
- Shape/location of the new regression test(s) — extending
  `test/cli/fgos.test.mjs` near the existing baseRef test (line 3069) is
  the obvious default but not locked here.

## Outstanding questions

None — D1/D2 locked. Implementation shape is `fgos-coding-planning`'s job.
