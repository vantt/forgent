# P03 - Docs Index State-Fixture Pilot

**Verdict: expand.** This exact technique (real docs/ tree via symlink, small real Work-state fixture seeded through the real store writer) is directly reusable for other large-state-fold outliers found in P07's audit.

## Threshold

Registered before mutation: a real win must exceed P02's observed cross-sample noise (wall range 335.22-384.76s across 3 samples, ~49.5s spread) — informal (no single pre-written number), but the bar was explicit before this pilot ran. The measured result (below) exceeds it by ~4x, leaving no ambiguity.

## Before (R1, retained raw data)

From P02's already-retained profile (`reports/artifacts/260915-npm-test-baseline-p02/profile/junit.xml`, not re-measured — same commit lineage, no mutation yet at capture time):

| Test | Before (s) |
|---|---|
| "fgos docs-index writes ... real how-to demo entry" | 89.11 |
| "fgos docs-index is idempotent — re-running yields the same entries" | 48.04 |
| "fgos docs-index tolerates a missing quadrant dir" | 32.87 |
| "fgos docs-index reads BOTH the docs/decisions/ alias..." | 24.89 |
| **File total** | **195.46** (99.7% of this file's 195.9s) |

## Mutation

Added `test/report/helpers/docs-index-state-fixture.mjs`: builds a fresh temp
root per test-file run, symlinks `docs/` to this repo's own real `docs/`
tree (R2 — no copy, same on-disk files the production generator reads),
and seeds exactly ONE real `work.outcome` event (`doc-fgos-rollup-howto` →
`docs/how-to/check-rollup-progress.md`) via the real store writer
(`initStore`/`addOutcome`, `src/state/store.mjs`) — not a hand-rolled JSON
write (R3). `test/report/enduser-index.test.mjs`'s `runDocsIndex()` now
spawns against this fixture root instead of `REPO_ROOT`; the four
expensive tests are otherwise unchanged. Removed `hasRealCompoundHistory`'s
worktree-conditional skip (tsk-63j's original workaround) — the fixture
guarantees the real capture always exists, so the `sourceCaptureId`
assertion is now unconditional (R4), and also asserts `docPath` for good
measure.

## After (R5, retained raw data)

| Test | After (s) | Speedup |
|---|---|---|
| "fgos docs-index writes ... real how-to demo entry" | 0.552 | 161x |
| "fgos docs-index is idempotent — re-running yields the same entries" | 1.173 | 41x |
| "fgos docs-index tolerates a missing quadrant dir" | 0.657 | 50x |
| "fgos docs-index reads BOTH the docs/decisions/ alias..." | 0.601 | 41x |
| **File total (all 21 tests)** | **5.27** | **37x** |

Absolute savings: ~192.5s off the file, on a suite whose P02 wall median
was 342.70s — roughly **56% of the full suite's median wall time**
attributable to this one file's four tests, now eliminated.

## Requirements disposition

- R1 (measure before mutation, retained): done — cited P02's own retained profile, no need to re-measure since no mutation had happened yet.
- R2 (keep scanning the real docs tree, change only the Work-state input): done — `docs/` is a symlink to the real tree, never a copy; the "missing quadrant dir" and "reads BOTH aliases" tests (which independently cross-check real on-disk file counts against `REPO_ROOT`, unaffected by the fixture) both still pass unchanged.
- R3 (minimal fixture, real persisted shape): done — `addOutcome`'s own real writer; `work.outcome`'s fold (`replay.mjs`) merges purely by `id`, no dependency on a matching `work.add`, confirmed by reading the fold logic before seeding.
- R4 (unconditional `sourceCaptureId` assertion, all prior assertions preserved): done.
- R5 (measure identical commands after mutation, report against threshold): done, see above table.

## Adversarial checks

- **Fabricated object bypassing the real store reader:** not applicable — `addOutcome` IS the real writer; the resulting event is read back by the real `listWork`/replay fold, same as production.
- **`--dir` accidentally moving docs discovery away from the real tree:** verified via the "reads BOTH aliases" test's own independent `fs.readdirSync(REPO_ROOT, ...)` count cross-check, which passed unchanged.
- **Conditional assertions / missing fixture capture yielding a vacuous pass:** the `sourceCaptureId` assertion is now unconditional; a missing seed would fail it loudly (verified by temporarily breaking the fixture during development — reverted before commit).
- **Tests racing while renaming a real docs quadrant or restoring the manifest:** node:test runs one file's tests sequentially by default; the existing before/after manifest-snapshot hook (unmodified) still protects the real tracked manifest file regardless of which cwd spawned the CLI.

## Verification run

```
node --test test/report/enduser-index.test.mjs   # 21/21 pass, 5.27s (was ~195.9s)
npm test                                          # 6577 tests, 6567 pass, 1 fail, 9 skipped
```

The 1 failure (`test/runner/coordination-research-fan-out.test.mjs`'s "R5
concurrency" timing-window assertion) is the SAME ambient-load flake
recorded during checkpoint-1 and P00's full-suite runs — re-ran in
isolation, passes. Filed as `tsk-4rn` in the fgOS backlog (3rd occurrence
this session) rather than silently re-observed. Zero regressions from this
pilot's own change.

## Files touched

- `test/report/helpers/docs-index-state-fixture.mjs` (new)
- `test/report/enduser-index.test.mjs` (edited: `runDocsIndex()` + the demo
  test's assertion; no other test in the file changed)

No production docs-index behavior touched (`src/report/enduser-index*.mjs`
untouched), per file lease.
