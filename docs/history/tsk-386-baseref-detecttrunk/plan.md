# plan: tsk-386 — baseRef 'main' hardcodes default through detectTrunk

Mode: standard

Flag count/lane: 1 explicit flag (existing covered behavior — `worktree.test.mjs`/
`merge.test.mjs`/`loop.test.mjs`/`fgos-approve.test.mjs` all carry extensive
real suites for the touched call sites). No hard-gate flag — item's own
`tier`/`risk` (`standard`/`standard`, severity "low" per the report) confirm
standard lane. Distribution-story relevance (fgOS installed into other
repos) is the reason this is worth fixing despite being latent in THIS
repo, per `docs/distribution-vision.md` — not itself a hard-gate flag.

Direct-entry fallback: entered `planning` straight from a `clear` discovery
verdict — no `CONTEXT.md`/exploring round exists. `RESEARCH.md` round 1
stands in for it.

## Impact-analysis posture

Same as every sibling item this session: gitnexus `present` but 172 commits
behind HEAD — **degraded**. Not leaned on for this item: the scope question
(overlap with the done trunk-hardcode item) was resolved by reading that
item's own title directly, not blast-radius tooling; the fourth site
(`loop.mjs:780`) was found via a cross-referencing comment already in the
codebase, not a GitNexus query; the circular-import safety claim was
verified empirically (full test suite reruns without a module-load error).

## Approach

**Resolved the report's own flagged uncertainty first** (RESEARCH.md round
1): checked the done item `bo-hardcode-ten-trunk-main-trong-merge-e-5i0`'s
own title — scoped explicitly to `src/runner/merge`, confirming this item
is NOT a duplicate; `worktree.mjs`/`bin/fgos.mjs` were never in that item's
scope.

**Fixed FOUR sites, one more than the report's own citation** — the extra
one (`loop.mjs:780`) justified by direct textual evidence already in the
codebase (a comment in `worktree.mjs` explicitly names it as sharing "the
same" mechanism, and `loop.test.mjs`'s own comment independently documents
a test-harness workaround built around this exact hardcode):

1. `src/runner/worktree.mjs`: `createBranchRef`'s own default parameter
   changed from `opts.baseRef ?? 'main'` to `opts.baseRef ??
   detectTrunk(repoRoot)` — the ONE place this resolution now lives.
2. `src/runner/worktree.mjs`: `createDetachedMergeWorktree`'s own fallback
   call simplified from `createBranchRef(repoRoot, id, { baseRef: 'main'
   })` to `createBranchRef(repoRoot, id)` — inherits the now-correct
   default from (1), no second `detectTrunk` call needed in the same file.
3. `src/runner/loop.mjs:780`: same simplification —
   `createBranchRef(repoRoot, rootId, { baseRef: 'main' })` →
   `createBranchRef(repoRoot, rootId)`.
4. `bin/fgos.mjs`'s approve leaf-path fallback: same simplification —
   `createBranchRef(repoRoot, rootId, { baseRef: 'main' })` →
   `createBranchRef(repoRoot, rootId)`.

**Why simplify to omit `baseRef` rather than each site calling
`detectTrunk(repoRoot)` independently:** once `createBranchRef`'s own
default is correct, every internal caller that previously passed the
literal `'main'` purely to match that default can simply stop overriding
it — one `detectTrunk` call (inside `createBranchRef` itself) instead of
up to four independent ones, and no risk of two call sites drifting apart
if `detectTrunk`'s own resolution logic changes later.

**Why the `worktree.mjs` → `merge.mjs` import is safe despite being
circular** (RESEARCH.md round 1): `merge.mjs` already imports from
`worktree.mjs` (`branchNameFor`/`branchExists`/`reclaimOrphanedCheckout`);
`detectTrunk` is only ever invoked from inside a function body
(`createBranchRef`), never at either module's own top-level synchronous
evaluation — verified empirically, not merely asserted, by rerunning the
full existing test suite with no module-load error.

## Risk map

| Component | How risky | Proof point |
|---|---|---: |
| `createBranchRef`'s new default (`detectTrunk` instead of `'main'`) | Medium — the one place this resolution now lives; every other site's correctness depends on this default being right | Two new tests: a `master`-trunk repo (no branch named `main` at all) — `createBranchRef` with no `baseRef` resolves to `master`'s real tip directly, and via `withMergeEphemeralWorktree`'s own fallback (the literal Finding 8 failure scenario: "the first session-driven root merge hits `createDetachedMergeWorktree`'s fallback") |
| The circular `worktree.mjs` → `merge.mjs` import | Medium — a genuine new cross-module edge, even though verified function-scoped-only | Full existing suite across all four touched files (289 tests) reruns with zero module-load errors, confirming the import resolves correctly at every existing call path, not just the two new tests' own narrow scenario |
| The three simplified internal call sites (`createDetachedMergeWorktree`, `loop.mjs`, `bin/fgos.mjs`'s approve fallback) | Low — pure simplification, relies on (1)'s already-proven default | Full existing suite (`worktree.test.mjs`, `merge.test.mjs`, `loop.test.mjs`, `fgos-approve.test.mjs` — 289 tests) reruns unchanged, including `loop.test.mjs`'s own `initTempRepo()` pinned-to-"main" fixture (still passes: "main" remains one of `detectTrunk`'s own resolution candidates) |

## Shape

Single piece, no split — four small, symmetric default/call-site changes,
already implemented and verified.

Verify (already synced onto the item at discovery, real and runnable):
```
node --test test/runner/worktree.test.mjs test/runner/merge.test.mjs test/runner/loop.test.mjs test/cli/fgos-approve.test.mjs
```

## Outstanding questions

None
