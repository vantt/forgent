# P02 — Fast-Fixture Expansion

**Status:** stop, no candidate accepted. Working tree is byte-identical to before this phase (one file was mutated, measured, and reverted; only this report is new).

## Pre-edit reality audit (reused from P00A)

P00A's `scripts/test-proof-inventory.mjs` already ran the required per-site classification over all nine named files (see `proof-duplication-inventory.md`, Finding 1/2). Result, reconfirmed here rather than re-derived:

| File | `fgos init` sites | Classification |
|---|---:|---|
| `test/cli/fgos-claim.test.mjs` | 0 | — |
| `test/cli/fgos-claim-2.test.mjs` | 0 | — |
| `test/cli/fgos-read-5.test.mjs` | 0 | — |
| `test/cli/fgos-return-2.test.mjs` | 3 | `cwd/subdir` — **retain** (P06 precedent: over-broad replacement previously broke subdir cases) |
| `test/cli/fgos-iron-law-gate.test.mjs` | 0 | — |
| `test/cli/fgos-move.test.mjs` | 0 | — |
| `test/cli/fgos-approve-5.test.mjs` | 4 | `fixture-only` — **eligible** |
| `test/cli/fgos-return-3.test.mjs` | 0 | — |
| `test/cli/fgos-return-4.test.mjs` | 0 | — |

Only `fgos-approve-5.test.mjs`'s 4 sites are eligible; no other file in the lease has any static `fgos init` call site left to touch. `test/cli/helpers/fgos-cli-harness.mjs` (the shared helper) was not modified — no new helper was proven necessary.

## Substitution attempted (then reverted)

All 4 eligible sites were `run(cwdVar, ['init']);` with the result discarded, `cwdVar` built via `initSessionSafeCwd()` (×2) or the already-fast `initGitCwdMainFast()` (×2) — the same "second real init after the fixture cwd already exists" duplication shape P01 traced. Replaced each with the existing, already-exported `initFgosFixtureInProcess(cwdVar)` helper (no new helper code; same substitution class as `tmpCwdFast`). `initGitCwd`, `initGitCwdMainFast`, `initSessionSafeCwd`, `initHeadlessGitCwdFast` were left untouched — no global `tmpCwd()` behavior changed, per ITR-D04.

## Measurement (reverted)

Per the plan's exact required command, measured against the **full nine-file batch** (only `fgos-approve-5.test.mjs` actually changes; the other 8 files have zero eligible sites and are included because the plan's registered focused command is the whole named set):

| | Sample 1 | Sample 2 | Sample 3 | Median |
|---|---:|---:|---:|---:|
| Before wall (s) | 21.08 | 21.20 | 20.69 | 21.08 |
| After wall (s) | 21.09 | 20.81 | 20.86 | 20.86 |

- Threshold: max(10% × 21.08 = 2.108, 2 × range(0.51) = 1.02) = **2.108s**
- Measured delta: 21.08 − 20.86 = **0.22s (≈1.0%)** — deep in the noise floor, not even close to the threshold, and the before/after sample ranges overlap (unlike P01's candidate, which had a real, non-overlapping effect that was merely under-threshold; this one shows no clear effect at all).
- All 154 tests passed, both before and after; count unchanged.
- `git checkout -- test/cli/fgos-approve-5.test.mjs` confirmed byte-identical revert; re-ran the file alone afterward (10/10 green) to confirm no residual state.

**Why the effect vanished:** P00A's re-scan already found the eligible surface had shrunk from the inherited audit's ~128 sites to 7 real sites in this whole nine-file lease, only 4 of which are eligible (the other 3 are cwd/subdir and correctly retained). Removing 4 subprocess-init calls inside a 154-test/9-file batch is an even smaller absolute change than P01's already-sub-threshold 25-site/55-test/4-file experiment (which measured 8.76%, itself rejected). The current tree has already organically migrated most of this cost category away since the prior track's snapshot; there is no material fast-fixture win left in this specific nine-file lease.

## Acceptance (per plan's own criteria, evaluated honestly)

- [x] Every replacement was classified `fixture-only` (P00A's mechanical classifier, not guessed).
- [x] Named focused suite remained green and test count did not drop (154/154, both before and after).
- [ ] Median focused wall/CPU improved beyond noise (target ≥10%) — **failed**, ≈1.0%, within sample-to-sample noise.
- Full-suite run was not needed: the candidate was rejected on focused evidence alone, matching P01's practice of not spending a full-suite cycle on a below-threshold candidate.

## Disposition

**stop.** No mutation kept. This nine-file lease's real fast-fixture opportunity is exhausted at the current tree state — P00A's re-scan already signaled this (finding shrunk from ~128 to 7 sites); this phase's measurement confirms the remaining 4-site opportunity is not material.

## Handoff

- P01 and P02 both independently found the same underlying "double real fgos-init subprocess" pattern (once via `initGitCwdMain()`, once via `initSessionSafeCwd()`), and both times the fix was real, safe, and verified-non-breaking, but too small to matter at the batch scope each phase's own registered command requires. A future phase could revisit this as ONE combined candidate across every `initGitCwdMain()`/`initSessionSafeCwd()` caller repo-wide (P01 found 14 files calling `initGitCwdMain()` alone) rather than two separately-scoped sub-threshold attempts — flagged, not opened here (out of both phases' registered scope).
- P03 (canary-first runner) and P04 (related selector) do not depend on P01/P02 accepting a candidate; both proceed independently.
