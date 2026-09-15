# Checkpoint 1 - Full Suite After P00+P01 Merge

**When:** 2026-09-15, track branch `test-suite-feedback-cost` @ `8814c248`
(P00 + P01 both merged; main unchanged at `bc989a66` since last sync).

## Result

`npm test` on the integrated track branch: 6538 tests, 6476 pass, 53 fail.

- 51 failures: `test/rust-host/{fgctl-init,fgctl-stage,fgctl-upgrade,release-tree}.test.mjs`
  — pre-existing environment gap (no compiled `target/release/{fgos,fgctl}`
  binary in this dev environment; `cargo build --release --workspace` was
  never run here). Recorded identically in the P00 and P01 cell handoffs;
  orthogonal to this track.
- 2 failures: `test/runner/coordination-research-fan-out.test.mjs` ("R5
  concurrency... genuinely launches only 1") and `test/runner/dispatch.test.mjs`
  ("fanoutBatchExecutorCli fires candidates in batch concurrently with
  overlapping execution windows") — both are wall-clock timing-window
  assertions (`elapsed 1280ms`, overlapping-window comparison). Ambient
  system load during this run was 1-min loadavg ~25-28 on a 16-core
  machine (many unrelated concurrent agent/codex sessions sharing this
  dev box, independently confirmed via `ps` — not started by this track).
  Re-ran both in isolation immediately after checkpoint-1 finished (load
  had dropped to ~4-22): both pass. Verified flake from ambient contention,
  not a regression — this track's P00/P01 diff touches only
  `test/cli/helpers/fgos-cli-harness.mjs`, `scripts/run-tests.mjs`,
  `package.json`, `.github/workflows/ci.yml` (comment), `CHANGELOG.md`;
  none of it is reachable from the fan-out/dispatch code these two tests
  exercise.

## Verdict

Zero regressions attributable to P00 or P01. Checkpoint 1 passed. P02 may
proceed to establish the isolated green baseline (per plan.md's Track
Invariant #2 and this track's full-test-policy checkpoint list).
