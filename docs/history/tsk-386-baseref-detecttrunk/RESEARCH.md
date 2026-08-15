# Research: tsk-386 — baseRef 'main' hardcodes survive outside merge.mjs

## Round 1 — 2026-08-14 (discovery stage)

**Asked:** Does the current code still match Finding 8's description
(literal `'main'` hardcodes at `worktree.mjs:376`/`:980` and
`bin/fgos.mjs:3546`, despite `detectTrunk` already existing in `merge.mjs`)?
Per the report's own flagged uncertainty ("Finding 8's overlap with the
already-done trunk-hardcode item wasn't fully resolved"), is this a
duplicate of `bo-hardcode-ten-trunk-main-trong-merge-e-5i0`, or a genuinely
separate scope?

**Checked:**
- `fgos show bo-hardcode-ten-trunk-main-trong-merge-e-5i0` — the done item's
  own title (truncated by the CLI but legible): "Bỏ hardcode tên trunk
  'main' trong merge engine (src/runner/merge...)" — confirms its own scope
  is explicitly `src/runner/merge` only, exactly as the report's own
  citation says. **Resolved: not a duplicate.** `worktree.mjs`/`bin/
  fgos.mjs` were never in that item's scope.
- `src/runner/worktree.mjs` (line numbers shifted since the report was
  written, due to this session's own earlier fixes on this branch's parent —
  tsk-1mn's `beforeProvision` addition, tsk-4yv's cleanup wrap — content
  re-verified by direct read, not assumed from stale line numbers):
  `createBranchRef`'s own default (`opts.baseRef ?? 'main'`) and
  `createDetachedMergeWorktree`'s explicit fallback
  (`createBranchRef(repoRoot, id, { baseRef: 'main' })`) — both confirmed
  exactly as described.
- `bin/fgos.mjs`'s approve leaf-path fallback (line shifted to ~3595 after
  this session's own tsk-ikd fix added a worktree guard earlier in the same
  function) — confirmed exactly as described:
  `createBranchRef(repoRoot, rootId, { baseRef: 'main' })`.
- `src/runner/merge.mjs:132` (`detectTrunk`) — read directly: checks
  `origin/HEAD`'s target first, falls back to a local `main`/`master`
  branch existence check, defaults to `'main'` only if neither resolves.
  Already exported and used by several other real callers
  (`promote-engine.mjs`, `drift-status.mjs`, `bin/fgos.mjs` itself
  elsewhere, `merge.mjs`'s own `reviewDiff`/`changedFiles`/`postLandTarget`).
- **A FOURTH site, not in the report's own citation list:** `src/runner/
  loop.mjs:780` — `createBranchRef(repoRoot, rootId, { baseRef: 'main' })`,
  the runner's own leaf-dispatch early-creation call. Found not by
  independent search but from DIRECT textual evidence already in the
  codebase: `worktree.mjs`'s own pre-fix comment at `createDetachedMergeWorktree`
  explicitly named this call site as sharing "the same `baseRef: 'main'`
  `loop.mjs` already uses for this exact early-creation step" — the
  codebase itself documents these two call sites as the same mechanism.
  `test/runner/loop.test.mjs`'s own comment (lines 24-30) independently
  confirms this is a real, live gap: its `initTempRepo()` pins the test
  repo's branch name to literally `"main"` specifically so this exact
  hardcode doesn't fail the test suite on a machine whose
  `init.defaultBranch` differs — a workaround built INTO the test harness
  around the very bug this item closes.

**Decided:** in scope, not a duplicate (confirmed against the done item's
own title). Fix all FOUR sites (the report's three, plus `loop.mjs:780`,
justified by the codebase's own cross-referencing comment, not an
independent scope decision on this session's part). Default `baseRef`
through `detectTrunk(repoRoot)` in exactly one place —
`createBranchRef`'s own default parameter — and simplify every INTERNAL
call site (`createDetachedMergeWorktree`, `loop.mjs`, `bin/fgos.mjs`'s
approve fallback) to omit `baseRef` entirely rather than each independently
calling `detectTrunk(repoRoot)` a second time. `worktree.mjs` importing
`detectTrunk` from `merge.mjs` creates a circular import (`merge.mjs`
already imports `branchNameFor`/`branchExists`/`reclaimOrphanedCheckout`
FROM `worktree.mjs`) — verified safe empirically (full existing suite
reruns without any module-load error) since every use is function-scoped,
never at either module's own top-level synchronous evaluation.

**Remaining open:** none.

**Verify (real, runnable):**
```
node --test test/runner/worktree.test.mjs test/runner/merge.test.mjs test/runner/loop.test.mjs test/cli/fgos-approve.test.mjs
```
(existing suites covering every touched call site; two new cases added in
`worktree.test.mjs` proving Finding 8's exact failure scenario is closed —
a `master`-trunk repo with no branch named `main` at all, both for
`createBranchRef` directly and for `withMergeEphemeralWorktree`'s own
fallback.)
