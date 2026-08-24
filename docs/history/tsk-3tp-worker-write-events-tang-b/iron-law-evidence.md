# tsk-3tp — Iron Law failing-test-first evidence

`classifyIronLaw` result on the aggregate `main...fgw/tsk-3tp` diff:
`required: true`, `matchedModules: ["bin/fgos.mjs", "src/runner/merge.mjs"]`.

This item is a parent aggregating two already-evidenced children plus one
review-round fix, each with its own real failing-before/passing-after
proof already on this branch. Per the established `tsk-28o` precedent
(cite real evidence produced elsewhere on the same branch rather than
re-deriving it), this file points to that evidence rather than
duplicating it:

## Piece 1 — tsk-3tp-1 (sweep mechanism)

Full real transcript: `docs/history/tsk-3tp-1/iron-law-evidence.md`.
Summary: baseline run (branch after merging in tsk-3ve/"Tầng A", before
tsk-3tp-1's own fix) showed 10 real failures caused by the old eager
periodic-checkpoint-commit trigger firing mid-test and shifting recorded
git HEAD SHAs; after tsk-3tp-1's fix (retiring that trigger, adding the
merge-time sweep), the same suite passes.

## Piece 2 — Review round 1 fix (sweep pathspec root mismatch, commit `c784cb9e`)

Real transcript (from the fix agent's own run, reproduced here since no
separate file was written for it at the time):

- **Failing-before**: a new regression test in `test/runner/merge.test.mjs`,
  using two separate real git repos standing in for `repoRoot`/`lockRoot`
  (the exact shape of every leaf-into-root approve, including this very
  chain's own tsk-3tp-1/tsk-3tp-2 → fgw/tsk-3tp merges), run against the
  pre-fix parent commit: the dirty `.fgos/events/` shard at `lockRoot`
  showed as `?? .fgos/` (untracked, never staged) after the merge —
  confirming the sweep silently failed to reach it because the pathspec
  and git `cwd` were resolved off `repoRoot` instead of `lockRoot`.
- **Passing-after**: same test, same two-repo harness, run after commit
  `c784cb9e` (which resolves both the pathspec base and the git-command
  `cwd` off `lockRoot`, mirroring the existing `fgosDir`/
  `runOpportunisticMainCheckoutChecks` pattern already in `merge.mjs`):
  the shard is staged under `lockRoot` and rides the next real commit
  there — test passes.
- Full suite after the fix (bare `node --test`, this repo's own `npm test`
  script is known-broken on this Node version and must not be trusted):
  3882 tests, 3875 pass, 2 fail (both pre-existing/tracked: the unrelated
  `herdr-plugin` TS-resolution issue, and `test/runner/claim-port.test.mjs`'s
  read-count assertion, tracked as `tsk-3tb` and independently confirmed
  by review round 3 to be strictly *better* on this branch than on `main`,
  not a regression).

## Piece 3 — Review round 3 doc fix (commit `89352d50`)

Doc-only change (no code), verified doc-only in scope by `git show
89352d50 --stat` during round 4's confirmation pass. Does not trip Iron
Law on its own; included here for completeness of the aggregate diff.

## Overall verification chain

Four independent review rounds ran against this parent branch after both
children merged in: R1 (correctness/regression) found and this fix
addressed the one real bug above; R2 (behavioral/e2e, real disposable-repo
scenarios) came back CLEAN; R3 (spec/safety) found only the doc staleness
fixed in commit `89352d50`; R4 (confirmation) came back CLEAN. Reports:
`plans/reports/review-r1-260824-tsk-3tp-sweep-checkpoint-report.md`
through `review-r4-260824-tsk-3tp-confirmation-report.md`.
