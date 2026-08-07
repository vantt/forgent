# tsk-621 — Iron Law evidence

`classifyIronLaw` result (`bin/fgos.mjs approve`'s own gate check, re-run
from the worktree with all commits in):

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": ["bin/fgos.mjs"]
}
```

`bin/fgos.mjs` is a self-modifying module (the tool editing its own CLI
entry point) — the gate requires failing-test-first proof before this
diff can land.

## Test command

```
node --test test/cli/fgos.test.mjs
```

## Failing-before (old `bin/fgos.mjs`, commit `ec0e627`, new tests already in place)

Restored `bin/fgos.mjs` to its pre-fix content (`git show ec0e627:bin/fgos.mjs`),
ran the already-written new/changed tests against it, then restored the
real fix. Real output:

```
ℹ tests 558
ℹ pass 551
ℹ fail 7

✖ add --domain synthetic persists work.domain and stamps stage "assembling" (no --stage flag needed), exit 0 (208.527305ms)
✖ add --stage decompose explicitly persists that stage, exit 0 (139.544105ms)
✖ add --stage executing explicitly persists that stage and IS frontier-ready (opts back into pre-fix behavior), exit 0 (144.508373ms)
✖ add stamps stage "clarify" by default (D1/D2, add-stage-default-gap) — parity with submit, no longer the old implicit "executing" (191.273919ms)
✖ add with a bare --stage (no value) is rejected as validation, exit 4, no event written (133.976654ms)
✖ add with a --stage outside the domain's own stage enum is rejected as validation, exit 4, no event written (126.759994ms)
✖ add without --stage or --domain now defaults to stage "clarify" (was implicit "executing"), and is NOT frontier-ready, exit 0 (155.940881ms)
```

Exactly the 7 tests written/changed for this item's own `--stage` flag
and default-stage behavior — every other test in the file (551) stayed
green against the old code, confirming these 7 genuinely exercise the
fix and nothing else.

## Passing-after (real fix restored)

```
ℹ tests 745
ℹ pass 745
ℹ fail 0
```

(Full 5-file scoped verify — `node --test test/cli/fgos.test.mjs
test/state/stage.test.mjs test/state/work.test.mjs
test/state/workflow-stage-graphs.test.mjs test/skills/fgos-mirror.test.mjs`
— and the full `npm test` suite, 2705/2705 pass, both confirmed clean
before `fgos return`.)
