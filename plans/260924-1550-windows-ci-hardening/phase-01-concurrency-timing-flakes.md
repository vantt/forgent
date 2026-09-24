# Phase 01 — Concurrency/timing flake review

## Context

`plan.md` § Where things stand; `phase-00-evidence-snapshot.md`'s buckets:
`One process must win initial execution` (4), `Sibling process must get
idempotent outcome` (2), plus several unlabeled "strictly equal" failures
from the same test file.

All of these trace to `test/runner/coordination-phase2-concurrency.test.mjs`,
the `Unit 2E: concurrent two-OS-process ... race` family — real subprocess
races (spawns two actual OS processes and asserts exactly one wins /
produces an idempotent result). On CI run `35975484603`, the SAME test
family (`Unit 2E: ... authorize-and-dispatch race with identical payload
yields deterministic identity and single dispatch`) also failed on
**macos-latest**, a platform this repo's CI has run green for a long time —
strong evidence this is a load-sensitivity flake in the test's own timing
assumptions, not a Windows-specific product bug, and not something the
Windows-build change introduced.

This branch already has one documented precedent for exactly this pattern:
`fgos-merge.test.mjs`'s `merge next --no-wait fails immediately on a
live-held lock` test, which uses a hardcoded ~2000ms threshold and flakes
under CI/local load (confirmed via repeated isolated reruns in an earlier
commit on this branch). `Unit 2E` looks like the same shape of problem:
either a hardcoded wall-clock assumption, or a real two-process race whose
window is narrower on a loaded/slower runner (Windows CI runners are
measurably slower than Linux for process-spawn-heavy code).

## Requirements

1. Read `test/runner/coordination-phase2-concurrency.test.mjs` in full and
   identify every hardcoded timing assumption (sleep/timeout/poll interval)
   the `Unit 2E` tests depend on.
2. Reproduce locally: rerun the failing subtests in isolation, several times,
   under artificial load (e.g. `stress-ng` or parallel `npm test` runs) to
   see if the failure reproduces on Linux under load — same method already
   used to confirm the `fgos-merge.test.mjs` flake on this branch.
3. If it's a hardcoded-threshold flake: widen the threshold or make the
   assertion load-adaptive (matching whatever fix pattern, if any, the
   `fgos-merge.test.mjs` flake used — check if that one was ever actually
   fixed or just documented).
4. If it's a REAL two-process race (not just a threshold): that's a product
   bug regardless of OS and belongs in the actual concurrency-control code
   this test exercises, not in this Windows-hardening plan — escalate it as
   its own finding rather than folding a real correctness bug into "flake
   review."

## Files

- Likely: `test/runner/coordination-phase2-concurrency.test.mjs` (thresholds).
- Read for context: whatever production module implements the "single live
  worker" / dispatch-once guarantee `Unit 2E` is proving (find via the
  test's own imports).

## Validation

- The `Unit 2E` family passes on 3 consecutive real Windows CI runs, not
  just local Linux.
- macos-latest's `Unit 2E` failure (from `35975484603`) also passes on a
  rerun — if it doesn't reproduce there either, that's further confirmation
  this is timing-sensitive rather than Windows-specific.

## Risks

If this turns out to be a genuine race condition rather than a flaky
threshold, fixing it could touch production concurrency-control code with
its own blast radius — run `impact()` before editing anything outside the
test file itself, per this repo's GitNexus discipline.
