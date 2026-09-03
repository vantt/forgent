---
authoritative_for: mergedTreeAlreadyVerified fast-path, approve skip-verify near-zero hit rate on busy trunk, disjoint-path tolerance, isAlreadyMerged strict-ancestor limitation
---

# The approve skip-verify fast path was correct but almost never fired on a busy trunk

`tsk-2lq` closed a real, subtle problem: `merge.mjs`'s
`mergedTreeAlreadyVerified` skip-fast-path — meant to avoid a redundant
full 5-6 minute test-suite re-run at `fgos approve` time when the item's
already-verified tree provably hasn't changed — was working exactly as
designed, but its design assumption (a quiet trunk between an item's
`return` and its own `approve`) was regularly violated by real concurrent
multi-session usage, driving its real-world hit rate toward zero.

## Confirmed live

On `tsk-4oq` (2026-08-20): `fgos return` recorded `branchHeadAtReturn`;
no further commits landed on the item's own branch before `fgos approve
--acknowledge-iron-law` ran minutes later — the branch-tip-unchanged half
of the two-condition check held. Yet `approve`'s postLand output showed
no "verify skipped" message, a full fresh run instead (3750 tests,
~188 seconds). Root cause: the *other* required condition —
`HEAD` must still be an ancestor of the branch, i.e. `main` has not
advanced past the fork point at all — failed, because this `approve`
call itself had waited ~65 seconds on the main-checkout lock while
several other concurrent sessions landed their own items on `main` (10
other item ids in the same postLand's own "examined" list). **On a busy
shared trunk with many concurrent approvers, main almost always advances
between an item's own return and its own approve** — not a bug in the
check, a design assumption concurrent usage regularly breaks.

## What shipped

`mergedTreeAlreadyVerified` relaxed from strict ancestor-only to
**tolerate main having advanced, as long as none of the paths it
advanced on overlap the item's own branch footprint.** Standard 3-way
merge semantics guarantee that paths touched by only one side of a merge
carry through unmodified — so if `main`'s new commits and the item's own
branch never touched the same files since their common fork point, the
merged tree at the branch's own paths is still byte-identical to the
already-verified `branchHeadAtReturn` tree there, even though `main` is
no longer an ancestor. The new path computes the merge-base, diffs both
sides' changed paths from it (`git diff --name-status`), and returns
`false` (falling back to the full check) only if the two path sets
actually intersect.

**A rename-detection bug caught and fixed during planning**: the first
pass used `git diff --name-only`, which under a rename can report only
the new path and silently miss the old one — the final version uses
`--name-status` instead, correctly capturing both sides of a rename so
the disjoint-path check can't be fooled by one.

## Related, not addressed here

Named as related but out of this item's own scope: `tsk-2qp` (main-
checkout lock scope/behavior during approve) and `tsk-64o` (concurrent-
session state anomalies on the main checkout) — this item's fix narrows
the *symptom* (near-zero skip-fast-path hit rate), not the underlying
lock-contention dynamics those two items separately address.
