# P06 CLI Fixture Init Pilot

Date: 2026-09-16

Branch: `test-suite-feedback-cost--p06`

Base: `a04c15df031581b3b98d2caa377743eb70f2ba88`

Verdict: `expand`

## Scope

P06 was run before P05 by operator prioritization to reduce feedback cost
sooner. The pilot stayed bounded to three CLI hotspot files from the P02 profile:

| File | P02 profile total |
|---|---:|
| `test/cli/fgos-merge.test.mjs` | 137.45s |
| `test/cli/fgos-return.test.mjs` | 101.44s |
| `test/cli/fgos-merge-2.test.mjs` | 75.99s |

The shared default `tmpCwd()` was not changed. The pilot added explicit
fast-fixture helpers and opted in only these three files.

## Compared Strategies

1. CLI fixture initialization: `tmpCwd()` shells out to `fgos init`.
2. In-process initialization: `tmpCwdFast()` calls `initStore()` and writes the
   coexistence manifest through the same production helper used by CLI init.
3. Process-local template copy: `tmpCwdFromTemplate()` copies an already-empty
   `.fgos/` template into each fresh cwd.

The committed pilot uses the in-process strategy. Template copy is retained only
as an equivalence/adversarial guard because it is safe for empty no-marker roots
but is easier to misuse when a test needs root-specific harness detection.

## Preconditions

Preserved:

- Fresh directory per case.
- Fresh `.fgos/events.jsonl` and derived state view per case.
- Coexistence manifest shape for no-marker fixtures.
- Writer isolation: spawned CLI children still go through `run()` and keep the
  pinned test-only `FGOS_SESSION_ID`.
- CLI bootstrap is retained for raw pre-init refusal tests and the three subdir
  fixtures that genuinely need `fgos init` to run at the subdirectory cwd.

Not claimed:

- No suite-wide default rollout.
- No replacement for tests that prove `fgos init`, idempotent init output,
  headless-git notices, or process-boundary behavior.

## Timing

Command shape:

```sh
/usr/bin/time -f 'TIME real=%e user=%U sys=%S' node --test <file>
```

Environment: Node `v24.18.0`, Linux `6.8.0-138-generic`, 16 CPUs.

| File | Before real | After real | Direct delta |
|---|---:|---:|---:|
| `test/cli/fgos-merge.test.mjs` | 39.35s | 28.25s | -11.10s |
| `test/cli/fgos-return.test.mjs` | 35.11s | 24.88s | -10.23s |
| `test/cli/fgos-merge-2.test.mjs` | 19.90s | 14.44s | -5.46s |
| Sequential focused total | 94.36s | 67.57s | -26.79s |

Harness-scoped `fgos init` subprocess sites in these three files:

| File | Before | After |
|---|---:|---:|
| `test/cli/fgos-merge.test.mjs` | 55 | 0 |
| `test/cli/fgos-return.test.mjs` | 54 | 3 |
| `test/cli/fgos-merge-2.test.mjs` | 27 | 0 |
| Total | 136 | 3 |

## Proof

Passed:

```sh
node --test test/cli/fgos-merge.test.mjs test/cli/fgos-return.test.mjs test/cli/fgos-merge-2.test.mjs
node --test test/cli/fgos-merge.test.mjs
node --test test/cli/fgos-return.test.mjs
node --test test/cli/fgos-merge-2.test.mjs
cargo build --release --workspace
npm ci
node --test test/runner/flow-definition-standalone-master-coordination-loop.test.mjs test/runner/flow-definition-protocol-loader.test.mjs test/verbs/coordination-run-live-proof.test.mjs
npm test
git diff --check
```

Focused combined result: 150 pass, 0 fail, duration 31,148.480344ms.
Recovery focused result after dependency install: 27 pass, 0 fail, duration
6,022.760449ms.
Full-suite final result after `npm ci`: 6,802 pass, 0 fail, 9 skipped, duration
400,989.006512ms.

The first focused combined run failed three subdir-return tests after an
over-broad removal of `fgos init`. Those call sites genuinely require CLI init
at the subdirectory cwd; the pilot restored exactly those three subprocesses and
the focused suite then passed.

The first full `npm test` attempt before `npm ci` hit a worktree dependency
setup failure (`Cannot find module 'yaml'`) in the coordination protocol tests
and was interrupted to avoid wasting the full-suite window. After `npm ci`
installed the missing dependency, the focused recovery tests and the final full
suite both passed.

GitNexus impact/detect degraded:

```text
Cannot find module '/home/vantt/projects/test-suite-feedback-cost-p06/.gitnexus/run.cjs'
```

Manual fallback audit: the scoped diff touches only the shared CLI test helper,
the three pilot CLI test files, this report, and the plan status. Runtime product
code is unchanged.

## Handoff

Expand only as another measured follow-up. The safe next step is not changing
`tmpCwd()` globally; it is auditing the remaining CLI harness responsibility
clusters in P07 and selecting additional opt-in groups whose tests do not prove
the `fgos init` process boundary.
