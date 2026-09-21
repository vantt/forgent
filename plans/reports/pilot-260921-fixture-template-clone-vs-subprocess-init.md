# Pilot: fixture snapshot clone (`tmpCwdFromTemplate`) vs subprocess `fgos init` (`tmpCwd`)

**Date:** 2026-09-21
**Scope:** 3.11 (Fixture DAG / immutable snapshots) from `plans/reports/test-suite-cost-brainstorm-260920.md` — narrow, measured pilot on one file, not a suite-wide rollout.

## Finding

`test/cli/helpers/fgos-cli-harness.mjs` already has the core mechanism 3.11
describes: `tmpCwdFromTemplate()` builds one `.fgos/` store once per process
(`fgosTemplateSourceDir()`, in-process `initFgosFixtureInProcess`, memoized)
and clones it into each test's own `cwd` via `fs.cpSync(..., { recursive:
true })`, instead of every test bootstrapping its own store through a real
`fgos init` subprocess (`tmpCwd()`). It was built for one caller
(`test/cli/fgos-merge.test.mjs`, 2 call sites) and never adopted elsewhere.

## Pilot

Swapped `test/cli/fgos-read-4.test.mjs` (20 `tmpCwd()` call sites, none
testing `init` itself — the one call site needing pre-init behavior already
used `rawTmpCwd()` directly and was left untouched) from `tmpCwd` to
`tmpCwdFromTemplate`. Ran `node --test test/cli/fgos-read-4.test.mjs`
3 times before and after, identical machine state, no other load change.

| | wall (3 samples) | median | user (3 samples) | median |
|---|---|---|---|---|
| Before (`tmpCwd`) | 9.76s / 10.15s / 9.68s | 9.76s | 10.04s / 10.44s / 9.99s | 10.04s |
| After (`tmpCwdFromTemplate`) | 7.57s / 7.91s / 7.63s | 7.63s | — / 8.00s / 7.88s | 7.94s |

Wall-clock reduction: ~21.8%. Well above this track's established minimum
accepted effect (`max(10% focused median, 2× run-to-run range)`; baseline
range 0.47s, 2× = 0.94s ≈ 9.6% of median — 21.8% clears both). All 21 tests
in the file pass unchanged before and after.

## Disposition

**Kept** — single-file change, real measured win, no behavior change (same
assertions pass). Not extended to the other ~15-19 CLI test files with
similar `tmpCwd()`-heavy call patterns (`fgos-read-2/3.test.mjs`,
`fgos-edit*.test.mjs`, `coordination.test.mjs`, `fgos-stage*.test.mjs`,
`fgos-intake*.test.mjs`, `fgos-post-merge-2.test.mjs`, ...) — that is a
broader, higher-blast-radius rollout decision (touches many files at once)
left for explicit follow-up, not bundled into this narrow pilot.

## Remaining risk / explicit deferred work

- Suite-wide rollout to the other candidate files (listed above) — not
  attempted here.
- Many CLI test files define their own **local, duplicate** `tmpCwd()`
  instead of importing the shared harness's (a distinct, separate
  duplication concern — related to the brainstorm doc's proof-duplication
  theme, out of this pilot's scope).
- `fgosTemplateDir` is a module-level memo scoped to one test-runner
  process; `node --test` runs each file in its own process, so the memo
  never crosses file boundaries — the saving measured here is purely from
  the 20 in-file clones reusing 1 in-file template build, not any
  cross-file cache.
