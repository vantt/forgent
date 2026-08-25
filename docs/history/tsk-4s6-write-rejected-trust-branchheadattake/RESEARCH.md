# Research: tsk-4s6 — extend fgos-write-rejected restore to trust a provably-untouched-since-fork `.fgos/` path

## Round 1 — 2026-08-24 (discovery stage)

**Asked:** confirm the exact current implementation of the fgos-write-rejected
restore step in `src/runner/merge.mjs` (`mergeRunnerItemLocked`, branch→main
direction, used by `sync-root`/`approve`), whether `performCatchUp`
(main→branch direction, used by `fgos catchup`) shares the same guard, the
existing test pattern to mirror, and whether `item.branchHeadAtTake` is
already in scope where a fix would go.

**Checked (real repo, `rg`/`Read`, file:line citations):**

1. `isMergeUnionPath(repoRoot, relPath)` — `src/runner/merge.mjs:1171-1174`.
   Single job: `git check-attr merge -- <path>` ends with `: union`. Gates
   two independent restore mechanisms, both already shipped:
   - `resolveFgosOnlyConflict` (`src/runner/merge.mjs:1202-…`, added tsk-tr9)
     — fires only when `git merge` itself throws a real conflict AND every
     conflicted path is `.fgos/`+union. Restores each to `keepRef`'s version.
     Used by both directions: `mergeRunnerItemLocked` passes `keepRef='HEAD'`
     (main), `performCatchUp` (`merge.mjs:1657`) passes `keepRef=target`
     (also main, since `target` is what a worker branch catches up to).
   - The **write-rejected restore-then-recheck loop**, `merge.mjs:1392-1412`,
     inside `mergeRunnerItemLocked` ONLY — fires after a **clean** `git
     merge` (no conflict thrown) that still leaves a staged `.fgos/` diff
     against `repoRoot`'s own HEAD. For each such staged path, if
     `isMergeUnionPath` is true, `git checkout HEAD -- <path>` (discard
     branch's side, keep main's, silently) then re-check; anything still
     staged after that sweep aborts the merge and returns
     `{ outcome: 'fgos-write-rejected', paths: fgosPaths }`.

2. **`performCatchUp` has NO equivalent of the write-rejected restore-then-
   recheck loop at all** (`merge.mjs:1624-1690`, read in full). Its only
   `.fgos/`-aware step is the same `resolveFgosOnlyConflict` call inside the
   `catch` block at a real conflict (`merge.mjs:1646-1658`) — if `git merge
   --no-commit --no-ff target` succeeds cleanly (staged, no throw), catchup
   goes straight to the goal-check and commits (`merge.mjs:1686`) whatever
   that clean merge produced, `.fgos/` included, no staged-diff gate at all.
   This asymmetry is consistent with ADR0020's own stated invariant (only
   `main`'s own `.fgos/` state is ever authoritative; a worker branch
   absorbing main's current `.fgos/` state via catchup is never a violation
   — the strict guard only needs to protect the OTHER direction, landing
   INTO main). Not a gap this item needs to touch; noted for completeness
   since `fgos catchup <id>` was considered as an alternative path and its
   status precondition (`blocked` only) is why it wasn't used live on
   tsk-25b (status was `awaiting-approval`, not `blocked` — sync-root's own
   blocked outcome doesn't flip the item's own `status` field).

3. **`item` (with `item.branchHeadAtTake`) is already an in-scope parameter**
   at the write-rejected restore loop — `mergeRunnerItemLocked(repoRoot,
   item, branch, opts)` (`merge.mjs:1232`), the restore loop is later in the
   same function body (`merge.mjs:1392-1412`), so `item.branchHeadAtTake` is
   reachable with **zero new parameter threading**.

4. **Existing test pattern**, `test/runner/merge.test.mjs`:
   - `makeItem(overrides = {})` (`test/runner/merge.test.mjs:64-66`) returns
     `{ id: 'demo-item', verify: 'true', ...overrides }` — **does NOT set
     `branchHeadAtTake` by default**. Every existing write-rejected test
     (lines 1493, 1648, 1710-ish) calls `makeItem()` bare, so
     `item.branchHeadAtTake` is `undefined` in all of them today.
   - The safety-preserving test to never break:
     `'mergeRunnerItem still refuses a non-union .fgos/ path that
     auto-merges cleanly on non-overlapping lines (tsk-4gi: fix must not
     weaken this)'` (`merge.test.mjs:1648-1675`) — worker branch edits line 1
     of `.fgos/config.json`, main edits line 3, clean auto-merge, must stay
     `fgos-write-rejected`. Since this test's `makeItem()` call carries no
     `branchHeadAtTake`, a fix gated on "restore only when
     `item.branchHeadAtTake` is set AND the branch's current blob at that
     path equals the blob at `branchHeadAtTake`" leaves this test's
     assertions unchanged with **zero test edits required** — undefined
     `branchHeadAtTake` must simply mean "cannot prove zero-edit, don't
     restore, same as today."
   - Pattern to mirror for the NEW passing case: seed main, branch off
     (capture that commit as the item's `branchHeadAtTake`), let ONLY main
     drift the non-union `.fgos/` path afterward (branch never touches it
     again), assert `outcome === 'merged'` and the final content equals
     main's own pre-merge content — same assertion shape as the tsk-4gi
     union regression test at lines 1589-1636, minus the `.gitattributes`
     seeding (this new criterion doesn't depend on the union attribute at
     all).

5. **Live evidence this gap is real, not theoretical** (this session, real
   git commands against `fgw/tsk-25b`, `branchHeadAtTake: f8316c0f...`):
   `git diff --stat f8316c0f HEAD -- .fgos/config.json .fgos/events.jsonl
   .fgos/events.jsonl.backup-tsk-1lv-4-dedup-fix-20260817` → **empty** (zero
   lines changed on the branch's own history for any of the three paths
   since its recorded fork point) vs `git diff --stat main HEAD` on the same
   three paths → thousands of lines different. `sync-root`
   reported `blocked/fgos-write-rejected` with exactly these three paths.
   Confirmed by direct attempt that neither direction can be fixed via a
   worker-branch commit (`stagedFgosChangesOnWorkerBranch`,
   `merge.mjs`-adjacent `.githooks/pre-commit` refuses any `.fgos/` change
   OR deletion staged on a `fgw/*` branch) nor by deleting the stale path on
   `main` directly (`stagedFgosDeletions` refuses ANY `.fgos/` deletion
   commit, unconditionally, on any branch — confirmed live, both refused).

**What remains open:** none for this discovery pass — the fix location,
exact existing-parameter availability, and the test pattern to extend are
all confirmed with real citations. The one product-judgment call (is
"branch's blob === blob at branchHeadAtTake" a strong enough proof of "zero
real branch-authored edit", or does it need widening to "== blob at ANY
commit still reachable from target's history", per the `formatFgosWriteRejectedDetail`
comment's stricter framing) belongs to planning, not discovery — the
evidence above is sufficient to proceed to `planning` with a `clear`
verdict; validating will re-derive the final code shape from real code, not
this doc's prose.
