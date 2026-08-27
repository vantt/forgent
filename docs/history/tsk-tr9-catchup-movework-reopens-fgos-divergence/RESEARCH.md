# Research: is tsk-tr9 already fixed on main?

## Round 1 — 2026-08-27

**Asked:** tsk-tr9 reports that `fgos catchup`'s own successful landing
(`moveWork` to `awaiting-approval`) appends a fresh event to the calling
session's own live `.fgos/events/<session-id>-*.jsonl` shard on the main
checkout, reopening the exact branch/main `.fgos` divergence ADR0020
requires be zero, right before `fgos approve` runs against that same
branch — reproduced 12+ times over ~2 hours on tsk-2tmk, every `fgos
approve` attempt after a successful `fgos catchup` failing with
`reason:'merge-conflict'` on exactly that session's own shard path. Is
this already fixed?

**What was checked:**

- `src/runner/merge.mjs:1711-1773` (`performCatchUp`) and
  `src/runner/merge.mjs` (`mergeRunnerItemLocked`, the `git commit`/abort
  branch around line 1315) — both call `resolveFgosOnlyConflict(path,
  keepRef)` (defined `src/runner/merge.mjs:~1173`) whenever `git merge
  --no-commit --no-ff` throws a real conflict. That function restores
  every conflicted path to `keepRef`'s (target's) own committed version,
  but ONLY when every conflicted path is under `.fgos/` and declared
  `merge=union` in `.gitattributes` (confirmed:
  `.fgos/events/*.jsonl merge=union` is present).
- `git log --oneline -S resolveFgosOnlyConflict` → commit `10e44585`
  ("fix(merge): resolve .fgos-only merge conflicts instead of aborting",
  2026-08-24 12:01:32 +0700). Its commit message and in-code comments
  (`// tsk-tr9: ...`) describe the EXACT mechanism this item reports: "the
  SAME session's own subsequent event-append grows that shard on the
  other side" reopening a false conflict, because a worker branch has no
  legitimate claim over `.fgos/` state (ADR0020) and neither side actually
  disputes content — `merge=union` just cannot auto-resolve a
  modify/delete shape (only modify/modify).
- `git merge-base --is-ancestor 10e44585 09a3a28d1...` (this item's own
  `branchHeadAtTake`) → true. The fix is on `main` and already inherited
  by this item's own branch.
- `test/runner/merge.test.mjs:1974-2000` — two tests explicitly titled
  `(tsk-tr9 regression)`:
  - `performCatchUp resolves a stale deleted-.fgos-shard branch cleanly
    instead of a false modify/delete conflict (tsk-tr9 regression)`
  - `mergeRunnerItem resolves a stale deleted-.fgos-shard branch cleanly
    instead of a false modify/delete conflict (tsk-tr9 regression)`
  Both reproduce the exact sequence tsk-tr9 describes via
  `seedStaleDeletedFgosBranch`: branch pulls main's shard, then has a
  manual `git rm -r --cached .fgos` recovery commit (the realistic trigger
  for the modify/delete shape), then "the calling session's own subsequent
  event-append grows the SAME shard on main". Ran live:
  `node --test --test-name-pattern="tsk-tr9 regression"
  test/runner/merge.test.mjs` → 2/2 pass.
- Full `test/runner/merge.test.mjs` suite: `node --test
  test/runner/merge.test.mjs` → 109/109 pass, 0 fail — including the
  pre-existing `(tsk-4gi regression)` test
  (`mergeRunnerItem merges cleanly when a merge=union .fgos/ file
  genuinely diverges between branch and main`), which already proves the
  ordinary "both sides append new lines" case merged cleanly via plain
  `merge=union` BEFORE this fix too — `resolveFgosOnlyConflict` only
  matters for the modify/delete edge (a stale branch that at some point
  recorded a *deletion* of the shard), not the everyday append/append
  case.
- Downstream confirmation: tsk-2tmk (the item whose stuck
  catchup→approve loop tsk-tr9's own description cites as the discovery
  site, `docs/history/tsk-2tmk-submit-deps-direction/`) is now at
  `status: retrospective` — fully delivered. `git log` shows its merge
  commit (`e616e8eb`, 2026-08-24 17:12:46 +0700) landed ~5h AFTER the fix
  commit (`10e44585`, 12:01:32 +0700) the same day — consistent with the
  fix being exactly what unstuck it.

**Found:** tsk-tr9's reported bug is already fixed on `main` (commit
`10e44585`, 2026-08-24), with two passing named regression tests
(`(tsk-tr9 regression)` in `test/runner/merge.test.mjs`), and the item
that originally surfaced the bug (tsk-2tmk) merged cleanly shortly after
the fix landed. No residual gap found: the fix's own doc comment
(`resolveFgosOnlyConflict`) explicitly restricts itself to conflicts
confined entirely to `.fgos/` paths declared `merge=union` — any
non-`.fgos/` or non-union conflicted path still falls through to a real,
reported conflict (covered by the pre-existing `(tsk-4gi: fix must not
weaken this)` test, still passing).

**What remains open:** none. This item's own `discovery`/`decisions`
history and `docsRef` are otherwise empty — the fix landed under a
different session's own work (citing "tsk-tr9" in-code as the motivating
bug), and this item itself was never previously routed through the fgOS
workflow to record that closure. The only remaining action is to close
this item via the workflow itself, evidenced by the findings above.
