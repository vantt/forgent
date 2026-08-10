# Plan: drift-status routes to trunk once the parent root resolves

Item: `tsk-2ec`. Mode: **tiny** — one function, one existing predicate
reused, one new test mirroring the existing test file's own real-git-repo
technique. No design question, no split.

## Approach

1. `src/state/drift-status.mjs:65`: change the `targetBranch` computation
   to also check `isResolvedStatus(work[rootItem.parent])` — when the
   parent exists AND is resolved, target `trunk`; otherwise keep the
   existing `fgw/<parentId>` behavior unchanged.
2. Test (`test/state/drift-status.test.mjs`): a new test reproducing
   `tsk-4n7`'s exact shape — a root whose `parent` is itself a DONE item,
   with the parent's own branch far ahead of `main` (simulating the
   frozen-since-merge state) — asserts the child root's own `target`
   resolves to `main`, not the parent's dead branch, and that its
   `aheadOfTarget`/`behindTarget` are computed against `main` (matching
   the real drift numbers a sync would actually need).

## Risk map

| Component | Risk | Proof |
|---|---|---|
| Target-computation change | low — reuses an already-imported, already-proven-correct predicate (`isResolvedStatus`, already used one line below for the same "is this item done" question) | `test/state/drift-status.test.mjs` read in full (178 lines, 9 tests) — the one existing nested-root test uses an unresolved parent, confirmed unaffected by hand (`CONTEXT.md` D2) |
| New test proves the real bug | medium — the whole point of this item | Will be proven failing-test-first (Iron Law evidence) against the pre-fix file, using the same real-git-repo technique every other test in this file already uses |

Impact-analysis posture: `degraded` — GitNexus `present` (checked via
`fgos tool query --capability impact-analysis --status present`), index
stale. `src/state/drift-status.mjs` is a real state-layer module with a
dedicated test file exercising real git behavior, so failing-test-first
evidence against real git repos is the proof surface, not a skip.

## Outstanding questions

None
