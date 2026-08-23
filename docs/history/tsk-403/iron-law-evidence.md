# Iron Law evidence: tsk-403

`classifyIronLaw` against the real committed diff (`trunk...branch`, 732
files) returned `required: true`, matched modules:

```
bin/fgos.mjs
src/runner/claim-port.mjs
src/runner/dispatch.mjs
src/runner/loop.mjs
src/runner/worktree.mjs
src/state/status-fsm.mjs
src/state/store.mjs
src/state/workflow-stage-graphs.mjs
```

## Test command

```
npm test
```
(`node --test 'test/**/*.test.mjs'`)

## Failing-before / passing-after

The rename (stage `decompose`→`planning`, `stepMap.Divide` repointed from
`decompose` to `planning`) broke every test that hardcoded the pre-rename
stage/skill literals — proof the engine's own runtime behavior actually
changed, not just prose. Real transcript excerpt, captured mid-session
before the test suite was updated to match (`/tmp/npmtest_full3.log`):

```
test at test/state/workflow-stage-graphs.test.mjs:282:1
✖ stageForStep resolves each of coding's three steps to its stage name (0.163226ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  + actual - expected

  + 'planning'
  - 'decompose'

      at TestContext.<anonymous> (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-403-4yhCYX/test/state/workflow-stage-graphs.test.mjs:284:10)
    generatedMessage: true,
    code: 'ERR_ASSERTION',
    actual: 'planning',
    expected: 'decompose',
    operator: 'strictEqual',
    diff: 'simple'
```

Full suite at that same point in the session: **2798 tests, 2733 pass, 60
fail** (`/tmp/npmtest_full3.log`).

After updating the test suite's own expectations to match the renamed
stage/skill names (the tests were asserting the *old* names on purpose —
this is the expected, intended failure the rename causes, not a bug in the
new code), the same test — and the full suite — passes for real:

```
✔ stageForStep resolves each of coding's three steps to its stage name (0.056607ms)
✔ stageForStep returns undefined for a step the domain never declares (Init and Compound-learn stay outside the stage dimension) (0.035347ms)
```

Full suite at the final, returned state: **2953 tests, 2948 pass, 0 fail,
5 skipped** (`return`'s own re-verify, `aheadCount: 6`).

## Two real bugs the failing-before evidence surfaced

Beyond the expected test-expectation updates, the same failing-first
discipline caught two genuine defects before they shipped, both fixed in
the committed diff:

1. `resolvePlan`'s (formerly `resolveDecompose`) own re-entrancy guard and
   CAS `expectedStage` re-derived the canonical stage via `stageForStep`,
   which after the rename resolves to `planning` — silently no-op'ing (or
   refusing) on an item still parked at the legacy `decompose` stage
   instead of processing it. Fixed by comparing against the item's
   actually-observed `currentStage` instead of a re-derived canonical name
   (`src/intake/plan.mjs`).
2. The identical class of bug in `src/runner/loop.mjs`'s mechanical PLAN
   SWEEP and `src/state/discover-pool.mjs`'s `pickNextDiscoverItem` — both
   hardcoded the literal `'decompose'` stage as the only candidate,
   which would have gone permanently blind to every new item landing on
   `planning` post-rename.
