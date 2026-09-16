# P07 CLI Harness Responsibility Audit

Date: 2026-09-16

Branch: `test-suite-feedback-cost--p07`

Audited SHA: `da5684afac155d7605ec6c254c037cca0ace9c6c`

Verdict: select exactly two bounded follow-up candidates; do not mutate harness
behavior in this cell.

## Inputs

- Inventory artifact: `reports/cli-harness-run-inventory.json`
- Candidate artifact: `reports/cli-harness-candidates.json`
- Timing orientation: P02 JUnit profile, P03/P04/P06 reports.
- Source contracts checked: `docs/specs/runner.md` RUL37, `bin/fgos.mjs`,
  `src/verbs/merge/*`, `src/intake/*`, `src/state/*`, `test/cli/*`,
  `test/intake/*`, `test/state/*`, and `test/verbs/*`.

The inventory is a static call-site audit, not runtime tracing. Parameterized
rows and helper loops can execute one static line many times. P02 JUnit seconds
are file-duration orientation only; P06 already changed three files after that
profile and measured its own before/after separately.

## Inventory Totals

`test/cli/**/*.mjs` currently has 1,722 static `run()` call sites across 62
files. The shared harness itself has 25 helper-internal `run()` call sites.

| Primary responsibility | Static call sites | Boundary meaning |
|---|---:|---|
| `fixture-construction` | 633 | CLI subprocesses used only to create state or fixture branches before the assertion under test. |
| `business/use-case-behavior` | 496 | The assertion is about a guard/use-case result, not about process spawning itself. |
| `git/process-integration` | 405 | Real Git transport, rollback, worktree identity, conflict, branch, lock, or persistence boundary. |
| `process-contract` | 188 | Arg parsing, env/config resolution, cwd/dir routing, envelope/stdout/stderr, exit category, lock/PID, or daemon/process surface. |
| `unknown` | 0 | None after manual verb reconciliation. |

Top P02 CLI files by JUnit duration, with static responsibility mix:

| File | P02 seconds | Static calls | Dominant responsibilities |
|---|---:|---:|---|
| `test/cli/fgos-merge.test.mjs` | 137.447 | 86 | Git/process 58, fixture 27 |
| `test/cli/fgos-return.test.mjs` | 101.442 | 123 | Git/process 66, fixture 57 |
| `test/cli/fgos-merge-2.test.mjs` | 75.992 | 48 | Git/process 27, fixture 21 |
| `test/cli/fgos-edit.test.mjs` | 50.003 | 49 | Business 23, fixture 26 |
| `test/cli/fgos-claim.test.mjs` | 49.046 | 64 | Fixture 29, Git/process 28 |
| `test/cli/fgos-edit-3.test.mjs` | 45.121 | 50 | Business 27, fixture 23 |
| `test/cli/fgos-claim-2.test.mjs` | 45.083 | 62 | Process 30, fixture 19 |
| `test/cli/fgos-read-5.test.mjs` | 44.648 | 59 | Fixture 37, business 20 |

P06 already removed 133 `fgos init` subprocess call sites from the three biggest
merge/return files and measured a 26.79s focused sequential reduction there.
The remaining non-P06 files still contain 215 static `fgos init` call sites; the
top nine files named in Candidate 1 account for 128 of those.

## Responsibility Rules

`process-contract` stays subprocess-backed when the thing being proved is argv
shape, JSON envelope, stderr wording, exit category, inherited/overridden env,
cwd versus `--dir`, setup/init output, lock/PID behavior, or a real daemon/tool
process.

`git/process-integration` stays subprocess-backed when the test proves actual
Git commands, conflict abort, rollback, linked-worktree refusal, branch cleanup,
ephemeral worktree behavior, GitHub fake command transport, durable event writes
after merge, or lock contention. Distinct CLI doors remain distinct:
`approve`, `merge next`, `sync-root`, `review --github`, `return`, `catchup`,
and rollback paths do not collapse into one representative.

`business/use-case-behavior` can move down only when the same guard is reached
through a real production symbol. Confirmed surfaces already exist for large
parts of `discover`/`plan` (`src/intake/discovery.mjs`,
`src/intake/plan.mjs`), state writes (`src/state/store.mjs`), graph/stale
read-side logic (`src/state/graph-metrics.mjs`,
`src/state/runtime-coordination.test.mjs`), and merge verbs
(`src/verbs/merge/*`). Similar CLI messages alone are not enough.

## Candidate 1: Expand P06 Fast Fixture Init

Files:

`test/cli/fgos-claim.test.mjs`, `test/cli/fgos-claim-2.test.mjs`,
`test/cli/fgos-read-5.test.mjs`, `test/cli/fgos-return-2.test.mjs`,
`test/cli/fgos-iron-law-gate.test.mjs`, `test/cli/fgos-move.test.mjs`,
`test/cli/fgos-approve-5.test.mjs`, `test/cli/fgos-return-3.test.mjs`,
`test/cli/fgos-return-4.test.mjs`.

Symbols:

`tmpCwdFast`, `initGitCwdFast`, `initGitCwdMainFast`,
`initHeadlessGitCwdFast`; add a fast subdir helper only if a test does not prove
subdir init/cwd resolution.

Why selected:

This has the strongest measured precedent and lowest product risk. P06 proved
the same helper strategy on the three hottest CLI files, retained CLI bootstrap
where it mattered, and passed full suite. The next bounded batch removes only
fixture construction, not CLI behavior assertions. Static scope: 128 residual
`fgos init` sites in named files. Estimated savings should be labelled an
extrapolation until measured; P06's own focused rate was about 0.20s per removed
static init site in its pilot files.

Minimum CLI doors retained:

`fgos init` raw process tests, setup/init idempotence/coexistence output, pre-init
refusal tests, subdir cwd-resolution tests, and every Git transport door
(`take`, `pick`, `return`, `approve`, `merge next`, `sync-root`, GitHub,
rollback).

Verification:

Run the named files as a focused set, run `npm test` once on the stable
candidate, then `git diff --check`.

Rollback:

Revert only the opt-in helper substitutions in the named files. Keep P06 helpers
until P08 decides whether they become a broader pattern.

## Candidate 2: Extract Bin-Local State Verb Use Cases

Files:

`test/cli/fgos-stage*.mjs`, `test/cli/fgos-edit*.mjs`, and
`test/cli/fgos-read*.mjs`.

Symbols and source:

- `bin/fgos.mjs` cases `discover`, `plan`, `edit`, `move`, `graph`, `stale`,
  `workflow`, and `gate-check`.
- Existing production cores: `resolveDiscovery`, `resolvePlan`, `editWork`,
  `moveWork`, `graphMetrics`, `staleDoingAdvisory`.
- Existing direct tests: `test/intake/discovery.test.mjs`,
  `test/intake/plan.test.mjs`, `test/state/store.test.mjs`,
  `test/state/graph-metrics.test.mjs`, `test/state/runtime-coordination.test.mjs`.

Why selected:

This is the biggest remaining business-behavior cluster: 259 static business
call sites in the named stage/edit/read files, with P02 file-duration
orientation around 394s across those files. Much of the real logic already has
direct tests, but CLI adapter glue still holds material behavior in
`bin/fgos.mjs`, so this is not a simple test rewrite.

Callable-core decision:

Do not introduce a broad `runCli(argv, ctx)`. The committed release posture says
`bin/fgos.mjs` is the legacy-node payload entry under
`components.legacyNode.root/entry`; Rust host and npm compatibility execute that
file as the CLI entry. A global callable CLI core would cross packaging
boundaries and is outside this track. The bounded implementation-ready version
is to extract narrow use-case modules for the named bin-local verbs, matching
the existing `src/verbs/merge/*` pattern, then leave one or two CLI smoke tests
per verb for parser/envelope/error mapping.

Minimum CLI doors retained:

One parser/envelope smoke per verb, cwd/`--dir` checks, env/config resolution for
`discover`/`plan`, malformed flag JSON/error category checks, and any case that
proves process output rather than the use-case result.

Verification:

Run direct tests for `intake`, `state/store`, graph/stale, then the named CLI
files, then one full `npm test` on the stable candidate.

Rollback:

Revert the extracted use-case modules and restore the affected `bin/fgos.mjs`
cases. Keep any direct tests only if they still exercise exported production
symbols.

## Deferred

Merge/return/approve consolidation is deliberately deferred. `src/verbs/merge/*`
already provides use-case seams for several merge verbs, but the remaining CLI
tests prove different process and Git boundaries: local merge, GitHub transport,
root-vs-leaf target, dirty-tree refusal, conflict abort, rollback, lock wait,
attestation, verify failure, durable write diagnostics, and cleanup. Collapsing
those would be a correctness project, not a cost-only follow-up.

## Verification

Passed:

```sh
npm ci
git diff --check
cargo build --release --workspace
node --test test/rust-host/*.test.mjs
npm test
```

Report preview: `http://design-lap:7701/s/37a29b0647db`.

The first full `npm test` attempt in the fresh worktree failed because the Rust
release binaries were not built:

```text
fgctl binary must exist at /home/vantt/projects/test-suite-feedback-cost-p07/target/release/fgctl
Compiled Rust binary not found at /home/vantt/projects/test-suite-feedback-cost-p07/target/release/fgos. Run "cargo build --release --workspace" first.
```

After `cargo build --release --workspace`, focused rust-host recovery passed
102/102 tests, duration 178,097.208601ms. The final full suite passed: 6,802
pass, 0 fail, 9 skipped, duration 378,638.12983ms.

GitNexus will be run if `.gitnexus/run.cjs` is available; otherwise this report
and the JSON inventory are the manual fallback audit.

GitNexus detect-changes degraded:

```text
MISSING .gitnexus/run.cjs
```
