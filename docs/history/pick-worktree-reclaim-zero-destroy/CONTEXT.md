# pick worktree-reclaim zero-destroy fix (tsk-3lx) — CONTEXT

## Feature boundary

`createWorktree` (`src/runner/worktree.mjs`) is the single place that
turns a work item's `fgw/<id>` branch into a checked-out worktree, used
by both `claimWork`'s `pick`/`take` path (`claim-port.mjs`) and `approve`'s
ephemeral leaf-merge path (`bin/fgos.mjs:1721`). When `fgw/<id>` already
exists (the "reused" branch case), `createWorktree` calls
`reclaimOrphanedCheckout()` first — which force-removes any existing
checkout of that branch — and only afterward attempts
`git worktree add <newPath> <branch>`. If that `add` call fails for ANY
reason (including a transient `spawnSync git ENOENT`), the just-removed
checkout is gone and nothing recreates it: a live session sitting in that
checkout loses its cwd with no automatic recovery.

This item's boundary: eliminate the destructive-before-confirmed ordering
itself in `createWorktree`'s reuse path, so the existing checkout is
never removed until a replacement checkout is confirmed to exist. It does
not touch `claim-port.mjs`'s claim-status revert (already fixed, `tsk-4m0`,
unrelated axis: that fix makes a FAILED claim retryable; this item makes
the underlying worktree operation itself non-destructive on failure). It
does not change `reclaimOrphanedCheckout`'s existing dirty-checkout guard
(`isCheckoutDirty`, already refuses to touch a checkout with real
uncommitted changes) — that guard stays as-is; this item's scope is the
CLEAN-checkout reclaim path only, which is where the incident happens.

## The incident (tsk-3lx)

Reproduced twice in one session (2026-08-02): first during a mid-flow
re-pick after `decompose` moved the item to `executing` (claim
auto-released), second during a re-pick after a blocked return. Both
times: `git worktree add failed for branch ... spawnSync git ENOENT`,
and the pre-existing worktree directory was already silently deleted
before the `add` attempt — branch commits survived (confirmed via
`git log` on the branch), but the working directory and any session
state tied to it was gone. Both times a bare retry of `fgos pick <id>`
from the main checkout succeeded and created a NEW worktree path with a
different random suffix, reusing the branch.

This is the SAME root gap as two earlier, already-documented incidents on
the identical code path:

- `tsk-f31` (pre-`tsk-4m0`): identical `spawnSync git ENOENT` from inside
  `createWorktree`'s `git worktree add` call, identical directory-deletion
  side effect.
- `tsk-4m0` itself, live while implementing its own fix: identical
  failure, again deleting the session's own worktree.

Both are documented in
`docs/how-to/recover-a-stuck-doing-claim-after-worktree-creation-failure.md`,
written as the manual-recovery complement to `tsk-4m0`'s fix.

## Locked decisions

| D-ID | Decision |
|------|----------|
| D1 | This item explicitly **reverses** `tsk-4m0`'s own D2 ("ship a how-to doc, accept the directory-loss gap as a known residual, no automatic recreation"). Rationale for reversal: recurrence. The identical gap has now fired 4 times across 3 items (`tsk-f31`, `tsk-4m0` itself, and twice in `tsk-3lx`) — new evidence `tsk-4m0`'s original scoping did not have, per this repo's "verified decisions get reversed only with new evidence" convention. |
| D2 | Fix level is **zero-destroy** (chosen over a lighter best-effort retry-only fix): the existing checkout at `orphanPath` must never be removed until a replacement checkout is confirmed to exist. Even if `git worktree add` fails for any reason (transient `ENOENT` included), a session sitting in the pre-existing checkout keeps its cwd intact — no manual recovery step needed. This is a stronger bar than "retry the transient error and hope" — it removes the destructive-before-confirmed window structurally, not probabilistically. |
| D3 | Because `reclaimOrphanedCheckout` is shared by both `createWorktree` call sites (`claimWork`'s pick/take path AND `approve`'s ephemeral leaf-merge path, `bin/fgos.mjs:1721`), a structural fix in `worktree.mjs` benefits both automatically — this item does not need a second, separate fix for `approve`'s path. No new scope decision needed there. |
| D4 | `reclaimOrphanedCheckout`'s existing dirty-checkout guard (`isCheckoutDirty`, `tsk-1os`) is out of scope — it already correctly refuses to touch a checkout with real uncommitted changes. This item only changes the ordering/mechanics of reclaiming a CLEAN (confirmed crash-orphan) checkout, which is the path the incident actually occurred on. |

## Pinned terms

- **"Destructive-before-confirmed window"** — the gap between
  `reclaimOrphanedCheckout` removing the old checkout and `git worktree
  add` successfully creating the new one, during which the branch is
  checked out nowhere and a failure in `add` leaves it that way
  permanently (until a manual or later-automatic recreation).
- **"Zero-destroy"** (D2) — the old checkout is never removed until the
  new checkout's existence is confirmed; the destructive-before-confirmed
  window above is eliminated structurally, not just made less likely.

## Scout evidence

- `src/runner/worktree.mjs:238-260` (`createWorktree`) — the reuse path:
  `reclaimOrphanedCheckout(repoRoot, branch)` runs first (removes
  `orphanPath` if clean), then `git(repoRoot, ['worktree', 'add',
  worktreePath, branch])` runs separately; the `catch` around the `add`
  call only cleans up the just-`mkdtemp`'d empty `worktreePath`, never
  recreates `orphanPath`.
- `src/runner/worktree.mjs:178-229` (`reclaimOrphanedCheckout`) —
  confirms the dirty-checkout guard (`isCheckoutDirty`, `tsk-1os`) already
  refuses to touch a checkout with real uncommitted changes; the force
  `git worktree remove --force` only fires on a confirmed-clean checkout.
- `docs/how-to/recover-a-stuck-doing-claim-after-worktree-creation-failure.md`
  — documents the identical failure twice already (`tsk-f31`, `tsk-4m0`),
  including the exact error string (`spawnSync git ENOENT`) and the
  manual recovery steps (`git worktree add <path> fgw/<id>` + `rm -rf
  <path>/.fgos`) this item's fix is meant to make unnecessary in the
  common case.
- `docs/history/pick-worktree-claim-race/CONTEXT.md` /
  `docs/history/pick-worktree-claim-race/plan.md` (`tsk-4m0`, status
  `done`) — the prior item's own D1 (claim-status auto-revert, already
  shipped, orthogonal to this item) and D2 (the "accept + document" scope
  this item now reverses per D1 above).
- `bin/fgos.mjs:1721` — `approve`'s leaf-merge path calls
  `createWorktree(repoRoot, rootId, {})` directly, confirming it shares
  the exact same reclaim-then-add code path (D3).
- Impact-analysis posture: **full** — GitNexus present
  (`fgos tool query --capability impact-analysis --status present`
  returned one `present` provider, `gitnexus`). Blast-radius evidence for
  `createWorktree`/`reclaimOrphanedCheckout` can lean on GitNexus at
  planning/validating time.

## Deferred to planning

- Exact mechanism for "confirm replacement exists before removing the
  old checkout" — git refuses to check out the same branch at two paths
  simultaneously, so a literal "add new, then remove old" reordering
  cannot check out `branch` at both paths at once. Candidate shapes (not
  decided here, implementation is fgos-coding-planning's job): a detached-HEAD
  bridge checkout at the branch's current tip SHA before removing the
  named-branch checkout, or an in-place directory move/rename of the
  existing checkout to the new mkdtemp path (avoiding remove+add
  entirely when the existing checkout is confirmed clean).
  Whether/how to retry the transient `ENOENT` class specifically, and
  whether that retry is still worth keeping as defense-in-depth
  alongside the structural zero-destroy fix.
- How to test this without relying on reproducing the exact
  `spawnSync git ENOENT` trigger (likely: inject a `git worktree add`
  failure directly in a unit test — mirrors `tsk-4m0`'s own testing
  approach for its analogous failure-injection tests).
- Whether `approve`'s ephemeral leaf-merge worktree (D3) needs its own
  test coverage for this path, or whether `createWorktree`'s own test
  suite covers both callers by construction (shared function, no
  caller-specific logic).

## Outstanding questions

None — D1-D4 above are the full set of product decisions needed before
shaping.
