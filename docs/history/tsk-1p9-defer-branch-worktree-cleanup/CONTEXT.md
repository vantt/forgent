# tsk-1p9 — Defer branch/worktree teardown from merge time to the `cleanup` verb

Restore-to-decision, not a design change:
`work-item-status-delivered-retrospective-cleanup`'s D7 says
`removeWorktree`/`removeDispatchWorktree` "no longer run synchronously at
merge/return time; they run only after TTL elapses AND the cleanup->done
harness (D8) passes." The pinned term for `cleanup` in that same feature's
own `CONTEXT.md`: "a TTL-bounded park state for worktree reclamation,
deliberately delayed (not synchronous with merge) so a post-merge incident
can still reuse the worktree." Reality today: `cleanupMergedBranch`
(`src/runner/merge.mjs:928`) runs synchronously inside `approve`, deleting
both the branch and any live checkout of it, the moment a merge lands.

## Scout evidence

- **Live, first-hand proof, captured during this same session**: approving
  the sibling item `tsk-4jf` (a leaf of the same root, `tsk-1q1`) a few
  minutes before this CONTEXT.md was written destroyed BOTH its git branch
  (`fgw/tsk-4jf` — confirmed gone via `git branch --list`) AND its own
  `fgos pick`-created session worktree at
  `.claude/worktrees/tsk-4jf-Ypnajw` (confirmed gone from disk) —
  immediately, synchronously, at `approve` time. This is exactly the
  behavior this item describes, reproduced live rather than inferred.
- `src/runner/merge.mjs:928-941` (`cleanupMergedBranch`): calls
  `reclaimOrphanedCheckout(repoRoot, branch)` (destroy-only,
  `src/runner/worktree.mjs:201`) then `git branch -d branch`. Never
  throws — failures become warnings.
- `src/runner/worktree.mjs:201-219` (`reclaimOrphanedCheckout`): lists
  ALL worktrees of the repo and destroys any checkout of `branch` it
  finds — including a live `fgos pick` session worktree still checked out
  on that branch, refusing only if that checkout has real uncommitted
  changes (the "DATA-LOSS GUARD", tsk-1os) or resolves to the repo root
  itself (tsk-k8u D1). A clean, already-returned session worktree (the
  normal state after `fgos return`) is NOT protected by either guard —
  confirmed by the live reproduction above.
- **Three call sites of `cleanupMergedBranch` in `bin/fgos.mjs`**, only
  one of which is already correct:
  - `bin/fgos.mjs:1092` (the `cleanup` verb, fixed by the sibling item
    `tsk-4jf` this same session) — the CORRECT, TTL-gated call site. Not
    touched by this item.
  - `bin/fgos.mjs:2632` — leaf-into-root merge path (inside
    `withMergeEphemeralWorktree`, `repoRoot = ephemeral.path`, `branch =`
    the LEAF's own `fgw/<id>`). Fires on the `'merged'` outcome only —
    the `'conflict'`/`'verify-fail'` outcomes above it (lines 2560-2568)
    already leave the ephemeral checkout clean via `git merge --abort`
    and never call `cleanupMergedBranch` (confirmed by reading the
    surrounding branches directly, not inferred from the item's own
    "not yet read directly" note). This is the call site that destroyed
    `tsk-4jf`'s worktree above.
  - `bin/fgos.mjs:2743` — root-into-main merge path (`repoRoot` = the
    real main checkout, `branch =` the ROOT's own `fgw/<id>`). Symmetric
    with the leaf path; same fix applies.
  - **Root vs. leaf resolved**: both remaining call sites (2632, 2743)
    are single, unconditional calls on the identical `'merged'` success
    branch — no asymmetric root/leaf handling exists to preserve or
    special-case. Removing both is a symmetric, mechanical change, not
    two different fixes.
- **`tsk-480`'s "cleanup runs either way" comment (lines 2626, 2740) does
  NOT block this item** (already surfaced once for a different item,
  `docs/history/reclaim-refuse-live-session-worktree/CONTEXT.md`'s own D1
  scope note, cited here rather than re-litigated): that decision is
  about not SKIPPING cleanup when a LATER step (the metadata write) fails
  after a real git merge already landed — it is about *whether* cleanup
  runs on a partial failure, not *when* (synchronous-at-merge vs.
  deferred-to-`cleanup`-verb) it runs. Once both call sites here are
  removed, the `cleanup` verb becomes the one and only place teardown
  happens, and it will still run "either way" relative to `approve`'s own
  finer-grained outcomes — `tsk-480`'s principle transfers cleanly to the
  new call site rather than being reopened.
- **`loop.mjs`'s own `finally` (`src/runner/loop.mjs:18-29`) is a
  DIFFERENT, unrelated worktree lifecycle** — read directly, resolving
  the item's own "not yet confirmed" note: `removeWorktree` there runs
  around every per-item path of the ASYNC RUNNER's dispatch loop, at
  PROPOSE time (well before merge/approve/cleanup), and explicitly never
  deletes the branch ("The branch (`fgw/<id>`) always survives
  teardown"). This is the runner's OWN worktree, a separate checkout from
  a `fgos pick` session worktree (`source: 'branch', role: 'session'` —
  the shape both `tsk-4jf` and this item itself were claimed under). No
  overlap, nothing to change there.
- **Mid-planning discovery (material, surfaced back from `fgos-coding-planning`,
  user confirmed expanding scope rather than filing separately): the
  EXISTING `cleanup` verb's own `cleanupMergedBranch(repoRoot, branch)`
  call (`bin/fgos.mjs:1092`, already shipped by the sibling item
  `tsk-4jf`) is git-context-WRONG for a LEAF item.** `repoRoot` is always
  the main checkout, HEAD always `main`. A leaf's branch is merged into
  its ROOT's branch (`fgw/<rootId>`), not into `main` — the root itself
  may still be sitting unmerged for days. Empirically verified in a
  disposable repo (this session, not inferred): `git merge-base
  --is-ancestor <leaf-sha> HEAD` and `git branch -d <leaf-branch>` BOTH
  fail from a checkout on `main` even though the leaf is genuinely, fully
  merged into its still-open root branch — `checkMergeStillResolves`
  would falsely report the merge as "no longer reachable" (indistinguishable
  from an actual force-push loss) and park `cleanup -> blocked` forever,
  and even if that check were skipped, `git branch -d` would silently
  fail (swallowed as a harmless-looking warning) and leak the leaf branch
  forever — the exact failure this item exists to fix, just relocated to
  a different call site. Two more empirical confirmations (same session):
  `git merge-base --is-ancestor <sha> <ref-name>` succeeds against a
  named ref with NO checkout required (so the fix needs no ephemeral
  worktree gymnastics), and `git branch -D` (force) succeeds unconditionally
  regardless of current HEAD, given the branch exists.
- **Disk-cost tradeoff is already a locked, accepted decision from the
  parent feature, not reopened here**: after this fix, a merged item's
  worktree (and branch) will persist on disk through the whole `cleanup`
  park window (TTL 7d) instead of vanishing at merge time — this is
  precisely the point D7 exists for ("so a post-merge incident can still
  reuse the worktree"), already weighed and accepted at the cost D8's own
  CONTEXT.md already quantifies (~160 items parked at any time under
  today's 7d TTL × ~23 delivered/day). Not a new question this item
  introduces.
- `fgos tool query --capability impact-analysis --status present`:
  GitNexus registered and `present`, but its index (`lastCommit:
  251d0b5`) is still behind this branch's HEAD → **impact-analysis:
  degraded** (unchanged from the sibling item). `impact` will be run on
  `cleanupMergedBranch` before either call site is removed, cross-checked
  with `rg` the same way the sibling item did, per the repo's capability
  gate.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | Remove the `cleanupMergedBranch` call from `bin/fgos.mjs:2632` (leaf-into-root merge, `'merged'` outcome) and from `bin/fgos.mjs:2743` (root-into-main merge, `'merged'` outcome). `approve`'s success paths no longer touch the branch or its checkout at all. |
| D2 | The `cleanup` verb (`bin/fgos.mjs:1056`, already fixed by the sibling item `tsk-4jf`) becomes the ONLY call site for `cleanupMergedBranch` — teardown happens once the D7 TTL has elapsed AND the D8 harness passes, never at merge time. |
| D3 | `cleanupMergedBranch`'s own shape (best-effort, never-throws, `{warnings}` return) is unchanged — only its call sites move, per the item's own explicit instruction. |
| D4 | `tsk-480`'s "cleanup runs either way" decision is not reopened — its principle (don't skip cleanup because a later step failed) transfers to the `cleanup` verb becoming the sole call site, per the scout evidence above. |
| D5 | `loop.mjs`'s propose-time `removeWorktree` (async runner dispatch) is out of scope — confirmed a separate lifecycle with no branch-deletion behavior and no overlap with this item's two call sites. |
| D6 | The worktree/branch disk-cost tradeoff of the TTL park window is accepted as-is, per the parent feature's own D7 — not reopened, not a new scope point for this item to mitigate. |
| D7 | `checkMergeStillResolves` (`src/state/cleanup-harness.mjs`) gains root-aware ref resolution: given `view`/`id`, resolve `rootId = resolveRoot(view, id)` (`src/runner/root-affinity.mjs`, already exported, pure). When `rootId !== id` (a leaf), check ancestry against the ref name `` `fgw/${rootId}` `` instead of literal `HEAD` — no checkout needed. When `rootId === id` (root/standalone), behavior is UNCHANGED (checks against `HEAD`, i.e. `repoRoot`'s current branch — correct once the root itself is merged into main). |
| D8 | `cleanupMergedBranch`'s (`src/runner/merge.mjs`) branch-delete step changes from `git branch -d` to `git branch -D` (force): by the time the `cleanup` verb reaches this step, D8's own (now root-aware, D7) `checkMergeStillResolves` has already independently verified the branch's commit is a real ancestor of the correct target — `-d`'s local safety net is now both redundant and, for a leaf, actively wrong (it checks the current checkout's HEAD, never the root branch). Scope for this item now includes `src/state/cleanup-harness.mjs` and `src/runner/merge.mjs`, in addition to the two `approve`-path removals. |

## Pinned terms

- **merge time**: the two `'merged'`-outcome branches inside `bin/fgos.mjs`'s
  `case 'approve'` (leaf-into-root at line ~2632, root-into-main at line
  ~2743) — never `approve`'s other outcomes (`conflict`, `verify-fail`,
  `fgos-write-rejected`), which already never called `cleanupMergedBranch`.
- **root-aware ref**: the ref a leaf item's branch is checked for
  ancestry/deleted against — `fgw/<rootId>` (D7), never `main`/`HEAD`,
  since a leaf's root may still be unmerged when the leaf's own `cleanup`
  runs.

## Test plan (already specified in the item, restated for traceability, plus D7/D8's own coverage)

- An e2e test taking one item through `delivered -> retrospective ->
  cleanup -> done`, asserting the branch AND worktree checkout both still
  exist at the moment `status` reads `cleanup`, and only disappear once
  `status` reaches `done`.
- A unit test for `checkMergeStillResolves` covering the leaf case
  specifically: a commit merged into a root branch that is NOT itself
  merged into `HEAD` must resolve `ok: true` when checked against the
  correct root ref (D7), where checking against literal `HEAD` would
  incorrectly resolve `ok: false`.
- A test proving `cleanup` actually deletes a leaf's branch end-to-end
  (root branch present but unmerged into main) — the concrete regression
  this item exists to close.
- `test/runner/merge.test.mjs`, `test/runner/worktree.test.mjs`, and
  `test/state/cleanup-harness.test.mjs` stay green throughout.

## Outstanding / deferred

- None — every gray area the item itself flagged as unresolved (the
  loop.mjs propose-time question, the root-vs-leaf question), plus the
  mid-planning git-context discovery (D7/D8), is resolved
  above with direct evidence, not deferred.
