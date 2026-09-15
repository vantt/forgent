# P02 - Green Baseline And Profile

**Capability:** `code:test`

**Depends on:** P01

## Purpose

Create the first trustworthy performance baseline for the repaired test door,
per TFC-D05.

## Read First

`decision-lock.md`, P00/P01 traces, `scripts/measure-verify-cost.mjs`,
`scripts/measure-p08-performance.mjs`, and the prior profile artifacts.

## File Lease

- May add: `scripts/test-timing.mjs`, its focused test, and this plan's
  `reports/baseline-*` artifacts
- May edit: `package.json`, `CHANGELOG.md`
- Must not edit: production code or existing test behavior

## Requirements

R1. Benchmark a detached isolated snapshot with clean status before and after.
R2. Run three complete green full-suite samples under comparable low-load
   conditions; report median and min/max, never summed testcase duration as wall.
R3. Run one separate green profile and retain machine-readable per-test/file data.
R4. Record SHA, Node, OS, CPU count, concurrency, load, command, exit, wall,
   user/system CPU, failures, skips, and measurement-tool semantics.
R5. Repeat the relevant hermeticity proof from ordinary-shell and agent-session
   environments. At least one full sample must run from each environment; any
   unexplained difference invalidates the baseline.
R6. Produce top files/tests and directory totals without enforcing a timing
   threshold.

## Adversarial Checks

- Profiling overhead mixed into baseline samples.
- Failed or interrupted runs included in median.
- Concurrent benchmarks competing for CPU.
- `/usr/bin/time` portability or child-CPU semantics overstated.
- Test mutation leaving the benchmark snapshot dirty.

## Verification

```sh
node --test test/scripts/test-timing.test.mjs
npm test
git diff --check
```

## Acceptance

Three valid green samples and one separate green profile are retained; the
report labels historical/estimated/current numbers distinctly; every later
pilot can reproduce the command and environment.

## Risks And Rollback

Risk is publishing noisy or incomplete timing as a baseline. Discard invalid
samples and the report projection, retain raw diagnostic artifacts, and do not
open P03 until R1-R5 hold.

## Handoff

Publish `reports/green-baseline.md` plus raw artifacts. Before each later pilot
mutates files, its cell trace registers a minimum effect threshold greater than
the baseline noise.
