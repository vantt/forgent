# Merge Execution & Bottleneck Map

Scope: how `fgos merge next` / `fgos approve` / `fgos sync-root` / `fgos catchup` actually
execute today. All citations `file:line`. GitNexus note: the forgentX index is 713 commits
behind HEAD (list_repos) — flagged stale per the repo's own capability gate — so blast-radius
numbers below come from direct `grep` cross-checks of the current tree, not gitnexus `impact`.

## 1. Execution trace

### `fgos merge next` (bin/fgos.mjs:2038-2119)
1. `listWork(dir)` — full state-file read/rebuild (`bin/fgos.mjs:2028`).
2. `driftStatus(process.cwd(), mergeView)` — shells real git per known root (`bin/fgos.mjs:2029`); populates `mergeReadiness`'s `blockedOnSync`.
3. `mergeReadiness(mergeView, {drift})` (`src/state/graph-harness.mjs:109`) — pure, in-memory: dep/mergeAfter-clear gate, `resolveRoot` per candidate, `footprintOverlapAmong`, `rankImpact`.
4. If `ready` empty and `blockedOnSync` non-empty: recurse into `sync-root` on `blockedOnSync[0]`'s root (`bin/fgos.mjs:2068`), then re-run steps 1-3 fresh and recurse into `approve` on the newly-ready top pick (`bin/fgos.mjs:2072-2079`).
5. Else recurse into `approve` on `ready[0]` (`bin/fgos.mjs:2110-2113`).

`merge next` never merges directly — it is a picker that calls `approve` (and optionally `sync-root` first) via the in-process `runVerb` dispatcher, one item per invocation, never parallel (comment at `bin/fgos.mjs:2041-2043`, D6).

### `fgos approve <id>` — runner-sourced leaf→root path (the common case)
1. `listWork` (`bin/fgos.mjs:2805`), item lookup, status check.
2. Multi-session/worktree-identity guards: `listSessions` + realpath compare (`bin/fgos.mjs:2851-2860`), `isMainWorktree(repoRoot)` (`bin/fgos.mjs:2873`, impl `src/runner/merge.mjs:263` — 2 `git rev-parse` calls).
3. Milestone drift guard (`bin/fgos.mjs:2892-2913`): `driftStatus` again if `item.targets` non-empty (second full drift shell-out, only for milestones).
4. Resolved-root guard: `resolveRoot` walk, no git (`bin/fgos.mjs:2930-2942`).
5. Iron Law gate: `changedFiles` (`src/runner/merge.mjs:362`, one `git diff --name-only`) + `classifyIronLaw` (`bin/fgos.mjs:2966-2993`).
6. `--github` branch short-circuits to `mergeGitHubPR` (server-side); skipped below.
7. Local-merge branch (`bin/fgos.mjs:3049`): `buildOwnFileSet` + `isMainTreeClean` — one more `git status --porcelain` (`src/runner/merge.mjs:224`), then `assertAcceptanceEvidence` (no git).
8. `resolveRoot` again to pick leaf-vs-root path (`bin/fgos.mjs:3070`).
9. **Leaf→root**: `withMergeEphemeralWorktree(repoRoot, rootId, fn)` (`src/runner/worktree.mjs:776`):
   - `createDetachedMergeWorktree` (`src/runner/worktree.mjs:746`): `git rev-parse <branch>`, `mkdtemp`, `git worktree add --detach`, `finishWorktreeSetup` (rm `.fgos/`, `provisionDependencies` → `npm ci`/`npm install` if the branch's `package.json` has deps not already installed there — this is per-merge, not cached).
   - `fn` = `mergeRunnerItem(ephemeral.path, item, {timeoutMs, lockRoot: repoRoot})` (`src/runner/merge.mjs:679`) — see §3 for the lock; internally `mergeRunnerItemLocked` (`src/runner/merge.mjs:920`): `isAlreadyMerged` (merge-base --is-ancestor), on the real-merge path `git merge --no-commit --no-ff branch`, staged-`.fgos` scan, `runGoalCheck` (the item's own verify command, full user-defined test/build), `runInvariantChecks` (repo-invariant commands from config), `git commit --no-edit`.
   - On success: `git rev-parse HEAD` inside the ephemeral worktree, CAS check against the branch's live tip, `git branch -f branch endCommit` (`src/runner/worktree.mjs:787-810`).
   - `finally`: `removeWorktree` — `git worktree remove --force` + `git worktree prune` (`src/runner/worktree.mjs:812-813`).
10. `moveDeliveredOrRecordFault` — one `.fgos/` event-log write.

**Root→main** path (`bin/fgos.mjs:3248`) is the same `mergeRunnerItem` call but directly against `repoRoot` (no ephemeral worktree, no detach/re-attach dance) — cheaper by exactly one worktree add/remove cycle.

**pull/legacy** path (`bin/fgos.mjs:3377`): no merge at all — just `runGoalCheck(item, repoRoot, timeoutMs)` against whatever is already on main, then `moveDeliveredOrRecordFault`.

### `fgos sync-root <root-id>` (`bin/fgos.mjs:3423-3567`)
Same shape as approve's leaf→root branch (Iron Law gate → `mergeRunnerItem` via `withMergeEphemeralWorktree` when the root itself has a parent, or directly on `repoRoot` with a clean-tree gate when it doesn't) but never moves the item's status — only appends a decision record (`bin/fgos.mjs:3543`). This is the primitive `merge next` step 4 calls when a root needs its own drift closed before a leaf can be picked.

### `fgos catchup <id>` (`bin/fgos.mjs:3747-3930`)
Does **not** call `mergeRunnerItem` — merges the opposite direction (target INTO the item's branch) so it hand-rolls the same `git merge --no-commit --no-ff` → verify → commit-or-abort sequence inline inside `withMergeEphemeralWorktree(repoRoot, id, fn)` (`bin/fgos.mjs:3823`). Extra up-front `git merge-base --is-ancestor target HEAD` check to detect "already caught up" and skip the merge attempt (`bin/fgos.mjs:3835`).

## 2. Cost profile

Ranked by wall-clock weight, per single `approve`/`sync-root` call on a leaf:

1. **`runGoalCheck`** (the item's own verify command) — unbounded, whatever the item's `verify` field runs (test suite, build, etc.); this is the dominant cost in nearly every case and is **run twice** when a root has children and later re-merges into main (once at leaf→root, once again — via `runInvariantChecks`/goal-check — at root→main), and a third time if the flow goes through `merge next`'s sync-root+approve chain.
2. **`provisionDependencies`** (`src/runner/worktree.mjs:97-105`, called from `finishWorktreeSetup` on every ephemeral worktree) — `npm ci`/`npm install`, real network+disk cost, run **per merge attempt**, not cached across the leaf's own dispatch-time worktree (which already installed once). Only skipped when the branch's `package.json` declares zero deps.
3. **`runInvariantChecks`** (`src/runner/merge.mjs:953,1071`) — repo-invariant commands from config, run on the staged tree after every real merge (unless `mergedTreeAlreadyVerified` skips it, `src/runner/merge.mjs:803`).
4. **`git worktree add --detach` / `remove --force`** — filesystem-bound but real I/O per merge; every leaf/root/sync-root/catchup call pays one add+remove cycle even when the merge itself is instant.
5. **`driftStatus`** — shelled once per `merge next` call, and again after any sync-root happens inside the same call (`bin/fgos.mjs:2029,2071`) — 2x for the sync-then-approve branch.

**Run-more-than-once-per-merge / could-be-per-batch candidates:**
- `driftStatus` in `merge next`: recomputed fresh after a sync-root instead of patching just the synced root's entry (`bin/fgos.mjs:2071`).
- `provisionDependencies`: re-installs on every ephemeral merge worktree; a leaf's own dispatch worktree already installed the identical deps minutes earlier — no cache/reuse between them.
- `mergedTreeAlreadyVerified` (`src/runner/merge.mjs:803`) already exists specifically to skip a redundant verify+invariant run when the merged tree is provably identical to what `return` already checked — this is the one place the codebase already optimized this; it only fires when `HEAD` is an ancestor of the branch AND the branch tip hasn't moved (tight condition, real-world hit rate not measured here).
- Every `approve`/`sync-root`/`catchup` call independently re-derives `resolveRoot`, `changedFiles`/Iron Law, and (for approve) `driftStatus` — none of this is shared across a `merge-loop` run of N sequential items; each iteration pays the full read-and-recompute cost fresh (by design — D6 forbids a shared/parallel merge path, but nothing caches the parts that are provably safe to reuse within one drain-run, e.g. an unaffected root's drift entry).

## 3. Serialization points

- **`.fgos/main-checkout.lock`** (`acquireMainCheckoutLock`, `src/runner/merge.mjs:711-756`): acquired once at the top of every `mergeRunnerItem` call (leaf, root, and sync-root's root-merge path all go through this same function), held across the **entire** `mergeRunnerItemLocked` call — including the full `runGoalCheck` + `runInvariantChecks` run. Measured in comments as "up to ~185s in practice" (`src/runner/merge.mjs:668-676`). A heartbeat timer renews it every `DEFAULT_TTL_MS/3` so a long verify doesn't let a contender treat it as stale (`src/runner/merge.mjs:677,745-748`). This is a **global single-writer lock across the whole repo** — a leaf→root merge into `fgw/rootA` and an unrelated root→main merge both contend on the exact same lock, even though they touch disjoint branches.
- `catchup` (`bin/fgos.mjs:3747`) does **not** acquire `acquireMainCheckoutLock` at all — it runs its inline `git merge`/verify/commit sequence directly, with no lock held. It does operate inside `withMergeEphemeralWorktree`, whose own CAS guard (`src/runner/worktree.mjs:788-810`) only protects the final ref-move, not the merge/verify window — a real, if narrow, unprotected race distinct from mergeRunnerItem's fully-locked window.
- `isMainWorktree`/session-worktree guards (`bin/fgos.mjs:2851-2878`) serialize by refusing outright rather than waiting — cheap, not a real bottleneck.
- `withLockRetry` (`bin/fgos.mjs`, wraps `mergeFn` unless `--no-wait`) — polls/waits on `lock-held` up to `waitMs`, so a caller queued behind the held lock burns wall-clock waiting rather than failing fast, by default.

## 4. Readiness-check false verdicts

`mergeReadiness` (`src/state/graph-harness.mjs:109`) is pure/in-memory — its "wrongness" is entirely about staleness of its inputs, not logic bugs:
- **False-ready via stale `blockedOnSync`**: `drift` is a snapshot passed in by the caller (`bin/fgos.mjs:2029`); nothing re-checks it mid-batch. In a `merge-loop` run, a root that becomes drifted (a sibling leaf lands) between the loop's own successive `merge next` calls IS re-derived fresh each call (`driftStatus` runs every `merge next`), so this specific staleness window is actually closed for the loop's own top-level flow — but `mergeReadiness` itself would happily report stale-ready if a caller reused an old `drift` object.
- **False-ready via `strandedByResolvedRoot`/`supersededOut` ordering**: both are computed from the same `view` snapshot as `ready`; a status change landing between `listWork` and the actual merge attempt (a second concurrent process) is not re-checked by `mergeReadiness` — `approve`'s own resolved-root guard (`bin/fgos.mjs:2930-2942`) is the real enforcement point, re-derived independently at merge time, so `mergeReadiness`'s bucket is advisory/ordering-only, not authoritative.
- **False-blocked via footprint conflicts**: `footprintOverlapAmong` runs over `syncClear` candidates only (`src/state/graph-harness.mjs:146`) — an item whose conflict partner is itself blocked-on-sync or stranded never shows as `conflicts` for the surviving item, so a real future conflict (once the blocked item resolves) is invisible until the next call. Not wrong today, just not forward-looking.
- **`checkMergeStillResolves`** (`src/state/cleanup-harness.mjs:133`, used by `cleanup`, not by approve/merge directly) has two named, documented false-OK gaps:
  - **Revert-blind** (`src/state/cleanup-harness.mjs:26-36`): checks ancestry only — a `git revert` after merge leaves the original commit a provable ancestor of HEAD even though its content is gone. Reports `ok:true` for content that no longer exists on main.
  - **Divergent-reset-blind** (`src/state/cleanup-harness.mjs:104-112`): when the ref exists but the sha isn't an ancestor, a genuine force-push loss is indistinguishable from a branch manually reset to unrelated history — same `ok:false`, no way to tell which.
- **`branchContentMismatch`** (`src/runner/merge.mjs:838`, used inside `mergeRunnerItemLocked`'s already-merged path) exists specifically because bare `isAlreadyMerged` ancestry alone can be a **false-ready-to-declare-done** signal: a manually-resolved `git merge -s ours` keeps the branch as a parent while discarding 100% of its content, and ancestry alone would call that "merged" (comment `src/runner/merge.mjs:815-828`, reproduced against `docs/history/merge-verify-only-false-done/plan.md`). This is a real, previously-hit false-positive that is now actively guarded.
- **`mergedTreeAlreadyVerified`** (`src/runner/merge.mjs:803`) is a deliberately sufficient-not-necessary check — its false-negative direction (running checks again when unneeded) only costs time; it cannot false-positive (skip a check on genuinely-different content) because both required conditions (`HEAD` ancestor of branch, branch tip unchanged since `return`) are checked live at merge time.

## 5. Topology

```
leaf (fgw/<leafId>)  --approve-->  fgw/<rootId>        (leaf-into-root, ephemeral detached worktree)
fgw/<rootId>          --approve-->  main                (root-into-main, direct on repoRoot)
fgw/<rootId>          --sync-root-> fgw/<parentRootId> or main   (drift closer, status untouched)
nested root (item.parent set)  -->  resolves via item.parent, same fgw/<parentId> target
```

- `resolveRoot(view, id)` (`src/runner/root-affinity.mjs:66`) walks `item.parent` upward to the top — used identically by `mergeReadiness`, `approve`, `sync-root`, `catchup`, `cleanup-harness` to decide "which branch does this merge into." A leaf's target is never `main` directly; only a parentless item's target is.
- `sync-root` (`bin/fgos.mjs:3423`) is the only verb that moves a root's branch tip forward **without** changing the item's own status/stage — it exists specifically to close drift (a root's branch behind its own target because a sibling leaf already merged in) ahead of an `approve` that would otherwise trip the drift guard (`bin/fgos.mjs:2880-2913`) or the resolved-root guard.
- **What breaks when a root's history is restructured**: `checkMergeStillResolves`'s `namedRef` fallback (`src/state/cleanup-harness.mjs:94-102`) assumes a `fgw/<rootId>` branch is only ever force-deleted in two guarded places (loop.mjs's zero-ahead prune, `cleanupMergedBranch`) — any OTHER deletion or history rewrite of a root branch (a person manually deleting/rebasing it) breaks that assumption silently, since the fallback then re-checks against `HEAD` and may report a false pass. `withMergeEphemeralWorktree`'s CAS guard (`src/runner/worktree.mjs:788-810`) also assumes the branch is only ever moved via this module's own `git branch -f` — an external `git push --force`/manual reset on a root branch mid-merge is exactly the race that guard exists to catch, and it fails loudly (throws) rather than silently overwriting, but the caller then has no automated recovery path (D2 in that comment: "fail loudly here, never retry automatically").
- `promote-to-component` (`bin/fgos.mjs:3578`, engine in `src/runner/promote-engine.mjs`) is a distinct topology mutation — takes N flat (parentless) siblings and merges each into a newly-resolved or newly-created shared root via the SAME `mergeRunnerItem`/`withMergeEphemeralWorktree` primitives (`promote-engine.mjs:72-74`), setting `parent` only after a real git success per member (`bin/fgos.mjs:3690-3695`). This is the one place topology is restructured live rather than assumed fixed at dispatch time.

## 6. Change-safety note

GitNexus's forgentX index is 713 commits behind HEAD (`list_repos`) — flagged **stale** per this repo's own capability gate (`CLAUDE.md`'s Impact-analysis capability gate: "present but flagged stale" → degraded, blast radius may be stale). `impact()` calls against it were not trusted; blast radius below is from direct `grep` cross-checks of the current tree instead (all 3 targets have small, easily-verified fan-in).

- **`mergeRunnerItem`** (`src/runner/merge.mjs:679`) — 4 call sites, all inside `bin/fgos.mjs` (`approve` leaf-branch:3114, `approve` root-branch:3248, `sync-root`:3479) plus `src/runner/promote-engine.mjs:73`. Every caller already handles the full outcome enum (`conflict`/`verify-fail`/`fgos-write-rejected`/`merge-blocked-other-item`/`merge-failed-unclassified`/`merged`) explicitly — changing this function's outcome shape or its lock-acquire behavior touches all 4 call sites' error-handling blocks. Risk: **medium** — small fan-in, but each call site has substantial bespoke friction/status-move logic keyed to the exact outcome strings, so a change here is a real multi-site edit, not just a signature change.
- **`withMergeEphemeralWorktree`** (`src/runner/worktree.mjs:776`) — 4 call sites: `promote-engine.mjs:72`, `bin/fgos.mjs` approve leaf:3109, sync-root:3552, catchup:3823. Two of these (`catchup`) don't even call `mergeRunnerItem` inside it — they hand-roll their own merge sequence in the callback, so this function's contract (detached checkout, CAS-guarded `branch -f` landing, force-remove on exit) is relied on by two structurally different merge implementations. Risk: **medium-high** — the CAS guard and the "only this module force-moves the branch" assumption (§5) make this function's exit-path guarantees load-bearing beyond its direct callers, into `checkMergeStillResolves`'s and `resyncClaimWorktree`'s own assumptions about how branch tips move.
- **`runGoalCheck`** (`src/runner/goal-check.mjs`, called from `src/runner/merge.mjs` x2, `src/runner/loop.mjs`, `bin/fgos.mjs` x2 for pull/legacy-approve and catchup's already-caught-up path) — this is the dominant cost item (§2) and the natural target for any "don't re-run verify redundantly" fix. Risk: **high** — it is the sole gate between a staged merge and a real commit landing on main/a root branch across every merge path in this file; any change to its pass/fail/timeout semantics propagates into every `blocked`-reason string bin/fgos.mjs constructs (`verify-fail-post-merge`, `verify-timeout-post-merge`, etc.), which `catchup`'s own `CATCHUP_REASONS` allowlist (`bin/fgos.mjs:3778`) and downstream tooling key off of literally.

## Unresolved / not covered here
- Actual wall-clock measurements (verify duration, `npm ci` duration) were not run — costs above are structural/comment-sourced, not profiled.
- `driftStatus`'s own internal git-call count per root was not traced line-by-line (out of the named files).
- `merge-loop`'s own stop-rule interaction with the lock/heartbeat (does a queued `withLockRetry` wait count against merge-loop's own iteration cap?) was not traced.
