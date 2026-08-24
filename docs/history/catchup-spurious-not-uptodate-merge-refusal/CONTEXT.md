# CONTEXT — tsk-5et

## Feature boundary

`fgos catchup`'s `performCatchUp` (`src/runner/merge.mjs:1634-1699`,
catchup direction: `main` merged into a worker branch inside an ephemeral
worktree) and `fgos approve`'s `mergeRunnerItemLocked` /
`abortMergeIfPossible` (`src/runner/merge.mjs:1074-1098`, `:1242-1330`,
approve direction: worker branch merged into `main`) both attempt a `git
merge --abort` after ANY non-conflict merge failure, including a
pre-merge `not uptodate` refusal that never started a merge and therefore
has no `MERGE_HEAD` to abort. This item makes both functions handle that
failure shape as a graceful, typed outcome instead of an opaque/secondary
thrown error. It does not require pinning down the underlying
git-internals reason `git merge` itself refuses in the first place — see
D2.

## Locked decisions

| D-ID | Quyết định |
|---|---|
| D1 | fix scope covers both performCatchUp (catchup direction, src/runner/merge.mjs:1634-1699) and mergeRunnerItemLocked's abortMergeIfPossible (approve direction, src/runner/merge.mjs:1074-1098/1196-1299) -- same defect shape, both in scope |
| D2 | fixed means both functions handle any non-conflict merge failure (incl. an unexplained not-uptodate refusal) as a graceful typed outcome, not blocked on confirming the underlying git-internals root trigger |

## Pinned terms

- **"not uptodate" refusal** — git's `error: Entry '<path>' not uptodate.
  Cannot merge.` message: a **pre-merge refusal**. Git refuses before
  staging anything for the merge, so no `MERGE_HEAD` is ever created and
  nothing appears in `git diff --name-only --diff-filter=U`. Distinct from
  a genuine merge **conflict** (which does stage content and does create
  `MERGE_HEAD`).
- **graceful typed outcome** — a defined return value shape (matching the
  existing outcome vocabulary each function already uses, e.g.
  `performCatchUp`'s `'conflict'`/`'verify-fail'`/`'merged'`/
  `'already-caught-up'`), not a thrown/propagated exception.

## Scout evidence

- `.gitattributes` (repo root): only six `.fgos/*.jsonl` paths are
  declared `merge=union`. tsk-5et's own reproduced failing path
  (`.agents/skills/fgos-fanout/references/wave-dispatch-mechanics.md`) is
  not one of them.
- `git log --oneline --follow --diff-filter=R` on that path, on `main`:
  zero renames. Zero commits touching it on either `main` or
  `fgw/tsk-25b` since their merge-base
  (`30455c2d2e1c1387779ad810e2df9a63c0805bf8`) — the item's own working
  theory (rename-detection interacting with accumulated `.fgos`
  merge=union checkpoint commits) does not fit this specific path. Full
  detail: `RESEARCH.md` Round 1, Q1.
- `test/runner/merge.test.mjs:37-62` already has reusable throwaway-repo
  fixtures (`initRepo`/`git`/`headOf`/`makeBranchWithCommit`) and already
  imports `withMergeEphemeralWorktree`/`performCatchUp` directly. Full
  detail: `RESEARCH.md` Round 1, Q2.
- `performCatchUp` (`src/runner/merge.mjs:1634-1699`) still matches the
  item's own description at current HEAD: the `fs.rmSync`-based `.fgos/`
  strip (`worktree.mjs:606`,`:909`), the `git merge --no-commit --no-ff`
  call (`merge.mjs:1658`), and the `merge-base --is-ancestor` pre-check
  (`merge.mjs:1639`) are all present and unchanged. Full detail:
  `RESEARCH.md` Round 1, Q3.
- **New finding, this item's own defect**: `performCatchUp`'s catch block
  (`merge.mjs:1656-1668`) calls `resolveFgosOnlyConflict`
  (`merge.mjs:1212-1240`), which only ever finds something to do when
  `git diff --name-only --diff-filter=U` is non-empty (a real conflict).
  On a `not uptodate` pre-merge refusal that list is always empty, so
  `resolveFgosOnlyConflict` returns `false`, `conflicted` is set `true`,
  and the code falls into `git merge --abort` (`merge.mjs:1679`) with no
  merge in progress.
- **Sibling defect in the approve direction**: `docs/history/
  events-jsonl-merge-abort-truncation-gap/RESEARCH.md` (tsk-1ji, status
  `retrospective`) already empirically reproduced the *identical* error
  text — `error: Entry 'events.jsonl' not uptodate. Cannot merge. /
  fatal: Could not reset index file to revision 'HEAD'.`, exit `128` — for
  `mergeRunnerItemLocked`'s `abortMergeIfPossible`
  (`merge.mjs:1074-1098`), triggered when a `.fgos/` path staged by the
  merge's own `merge=union` driver is then concurrently appended to
  before the abort runs (its Round 5, fixture 2). tsk-1ji's own
  conclusion for ITS original symptom (silent data loss) was that this
  interleaving does NOT lose data but DOES leave the main checkout in a
  broken, half-aborted state requiring manual recovery — tsk-1ji left
  "the real mechanism behind the data-loss incidents" open, but the
  broken-abort-state shape itself is exactly what tsk-5et also hit
  (recovery cost ~3 hours, manual git-mechanics workaround). tsk-1ji does
  NOT cover `performCatchUp` at all (different function, different merge
  direction) — this item's own D1 extends the same fix shape to that
  sibling site rather than assuming tsk-1ji already closes it.
- **Impact-analysis capability posture**: `degraded` — GitNexus is
  registered and `present`, but its own index is flagged stale (last
  indexed `7bb3231`, per this session's own tool-hook notice). Blast
  radius for touching `src/runner/merge.mjs` was cross-checked directly
  via `rg`/`git log` above rather than trusted to a stale index.

## Canonical references

- `docs/history/catchup-spurious-not-uptodate-merge-refusal/RESEARCH.md`
  — this item's own research rounds, full citations.
- `docs/history/events-jsonl-merge-abort-truncation-gap/RESEARCH.md`
  (tsk-1ji) — the sibling investigation and its proven 3-fixture
  empirical-reproduction methodology (real git binary, real throwaway
  repos), directly reusable as a pattern for this item's own repro.
- `src/runner/merge.mjs` — `performCatchUp` (1634-1699),
  `mergeRunnerItemLocked` (1242-1341), `abortMergeIfPossible`
  (1074-1098), `resolveFgosOnlyConflict` (1212-1240).
- `test/runner/merge.test.mjs` — existing throwaway-repo fixture helpers
  (37-62) to extend.

## Outstanding questions

None
