# Research log — discover-pool.mjs deps-ready filter (tsk-2v3)

## Round 1 (2026-08-11)

**Asked:** does the goal (make `discover-pool.mjs`'s `isCandidate()` filter
by dependency-readiness, per `CONTEXT.md`'s D1) depend on anything needing
research beyond what's already in this repo?

**Named things the goal depends on**, routed mechanically (repo search
first, external only if not found):

- `isCandidate()` — found: `src/state/discover-pool.mjs:22-24`. Internal,
  no external concept.
- `isDepsAndLineageReady` — found: `src/state/frontier.mjs:162-169`
  (definition), `bin/fgos.mjs` (only other caller today, inside `take`'s
  handler). Internal, already the exact function this item's fix reuses.
- `pickNextDiscoverItem` — found: `src/state/discover-pool.mjs:70-93`; all
  callers enumerated (`/fgOS:discover-next`, `/fgOS:discover-loop`,
  `test/state/discover-pool.test.mjs`). Internal.
- `frontier()`'s existing `depsReady` convention — found:
  `src/state/frontier.mjs:90-112`. Internal, the pattern to match (silent
  exclusion, no new return shape).

No named thing here resolves to an external library, framework, or
concept — this is a pure internal-repo code-reading question, and it was
already fully answered during this item's own `clarify`/`exploring` pass
(see `CONTEXT.md`'s Scout evidence section, same citations). No repo
search or external lookup produced anything new this round beyond what
`CONTEXT.md` already recorded.

**Verify.** `test/state/discover-pool.test.mjs` already exists and is
runnable today (`node --test 'test/**/*.test.mjs'`, `package.json`'s own
`test` script). A real, currently-runnable regression-guard command:

```
node --test test/state/discover-pool.test.mjs
```

**Still open:** nothing. `fgos-coding-planning` will define the exact new test
case(s) asserting the deps-not-ready exclusion; this command is the
existing suite's real entry point to extend, not a placeholder.

**Verdict:** clear.
