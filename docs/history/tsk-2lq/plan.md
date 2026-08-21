# tsk-2lq — plan.md

Mode: small

1 flag applied (per `fgos-routing`'s Mode gate): **existing covered
behavior** — this change modifies a tested function
(`mergedTreeAlreadyVerified`, `src/runner/merge.mjs:988`) and must change
one existing test's expected outcome. Every other flag (auth, authorization,
data model, audit/security, external systems, public contracts,
cross-platform, weak proof, multi-domain) does not apply: this is internal
runner logic, single-file blast radius (see Approach), well-covered by
existing tests, no product/UX surface.

## Approach

**Chosen path.** Extend `mergedTreeAlreadyVerified`'s second condition
(`isAlreadyMerged(repoRoot, 'HEAD', branch)`, currently requiring `HEAD` to
still be an ancestor of `branch`) with a fallback that also tolerates `HEAD`
having advanced, PROVIDED the paths main advanced since the fork are
disjoint from the paths `branch` itself introduced:

- `mergeBase = git merge-base branch HEAD`
- `introducedPaths = git diff --name-only <mergeBase>..<branchHeadAtReturn>`
  (what `branch` changed)
- `mainAdvancedPaths = git diff --name-only <mergeBase>..HEAD` (what main
  changed since the fork)
- if the two path sets are disjoint, the skip still applies: a standard
  git 3-way merge carries each side's changes unmodified for any path only
  that side touched, so the staged merge tree at `introducedPaths` is
  guaranteed bytewise-identical to `branchHeadAtReturn`'s tree there,
  independent of how far main has advanced elsewhere.

This is the direction the item's own description named as "not locked" and
`docs/history/tsk-2lq/RESEARCH.md` Round 1 (discovery stage) confirmed
buildable — grounded in standard 3-way-merge semantics and the same
`git diff --name-only` path-set pattern the same file already uses in
`branchContentMismatch` (`src/runner/merge.mjs:1023`, tsk-15k) for a related
but distinct already-merged-branch problem.

**Alternatives rejected.**

- Reusing `branchContentMismatch` as-is — rejected: it assumes an
  already-merged branch and locates the fork point by walking merge-commit
  history (`branch..ref` ancestry), a harder problem than this item's
  case, where the fork point is directly `git merge-base branch HEAD`
  (no merge has landed yet, exactly one relevant base).
- Full content-hash diff of the staged merge tree against `branch`'s own
  tree on every path — rejected: more expensive than a path-set overlap
  check and gives the same answer for the common (no-overlap) case; only
  matters if git's 3-way-merge semantics are ever in doubt, which they are
  not for a disjoint path set.
- Leaving the fast path strict-ancestor-only and only tuning the periodic
  checkpoint interval — rejected as this item's own scope: that trade-off
  (safety-window vs churn) belongs to `tsk-1vc` (Nhóm A), a different item;
  this item is squarely the "fix lõi" identified in
  `plans/reports/investigation-260821-1050-eventlog-loss-merge-speed-root-cause-report.md`
  Nhóm B #1.

**Impact-analysis posture: degraded.** `fgos tool query --capability
impact-analysis --status present` returns GitNexus as `present`
(`mcp:gitnexus`, scanTarget `.gitnexus`), but `mcp__gitnexus__list_repos`
shows this main checkout's own index (`/home/vantt/projects/forgentX`) is
1145 commits behind HEAD — stale, per `CLAUDE.md`'s capability gate,
"present but flagged stale → Degraded". Cross-checked directly instead
(the gate's own required fallback for a suspicious/untrusted
impact-analysis answer): `grep -n "mergedTreeAlreadyVerified"
src/runner/merge.mjs` shows exactly one call site
(`mergeRunnerItemLocked`, `:1255`) besides the function's own definition
(`:988`) — confirms a narrow, single-function, single-call-site blast
radius directly, without relying on the stale GitNexus index.

**Risk map:**

| component | how risky | proof point |
|---|---|---|
| `mergedTreeAlreadyVerified`'s relaxed skip condition | medium — a false-positive skip would land an unverified tree on main (the function's own docblock already states this is the failure mode to avoid) | new test: skip fires when main advances only on a path disjoint from `branch`'s own footprint. New test: skip does NOT fire when main's advance touches a path `branch` also touched (overlap → fail-closed, run checks) |
| existing D5 test `test/runner/merge.test.mjs:1632` ("main advancing past the fork forces the checks to run again") | low — this test's fixture (`moved-on.txt`, a path disjoint from `produced.txt`) currently asserts NO skip for a case the fix is meant to now skip; its assertion direction must flip for a disjoint path, so the fixture needs retargeting to an overlapping path to keep proving the still-real fail-closed-on-overlap direction | retarget this test to touch the SAME path (`produced.txt`) main and branch both changed, so it still proves fail-closed-on-overlap; add a NEW, separate test using a disjoint path (e.g. `moved-on.txt`) to prove the new tolerant-skip direction |
| rename ambiguity (a path renamed on one side only, missed by a bare path-name comparison) | low — RESEARCH.md Round 1 "still open" note | fail-closed by construction: a rename shows up as an added+removed path pair in `git diff --name-only`, which a plain path-set-overlap check already treats conservatively (the "removed" name plus the "added" name both count toward that side's changed-path set, so a name overlap on either name still triggers the strict-ancestor path) — pinned as an assumption below, not asked as a question, since getting this wrong only ever means running the full checks (today's existing, safe behavior), never an unsafe skip |

**Files touched, in order:**

1. `src/runner/merge.mjs` — extend `mergedTreeAlreadyVerified`'s second
   condition with the path-set-overlap fallback described above.
2. `test/runner/merge.test.mjs` — retarget the existing "main advancing
   past the fork" test (`:1632`) to an overlapping path; add a new test
   for the disjoint-path tolerant-skip direction; add a new test for the
   rename-ambiguity fail-closed case.

## Assumptions

- A rename on either side is treated conservatively (counted as touching
  both its old and new path names), falling back to the strict-ancestor
  path rather than a bespoke rename-aware comparison — not material to
  this item's scope (the bug being fixed is the common no-advance/
  disjoint-advance case on a busy trunk; a rename racing the same window
  is rare and the fallback is never less safe than today's existing
  behavior).
- `branchHeadAtReturn` (already required by the existing sufficient
  condition) is still the correct tree to diff against for
  `introducedPaths` — unchanged from the function's existing first
  condition, not reopened here.

## Verify

`npm test -- test/runner/merge.test.mjs` — already synced onto the item's
own `verify` field at discovery (real, not a placeholder); no further sync
needed here.

## Outstanding questions

None
