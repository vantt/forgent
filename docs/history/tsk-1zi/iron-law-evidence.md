# tsk-1zi — Iron Law failing-test-first evidence

`classifyIronLaw` result: `required: true`, `matchedModules: ["bin/fgos.mjs", "src/state/workflow-stage-graphs.mjs"]`, `matchedFlags: []`.

## Test command

`npm test`, plus scoped: `node --test test/state/stage.test.mjs test/state/workflow-stage-graphs.test.mjs test/state/compound-learn-done-gate.test.mjs test/e2e/compound-learn-lifecycle.test.mjs`

## Failing-before (real transcript excerpt, before removing the `compound-learn` stage/verb)

```
✖ compound accepts a proposed coding item and moves its stage to compound-learn, exit 0
✖ compound called twice on the same item rejects the second, illegal stage move as precondition, exit 2, no second event written
✖ compound --doc-type tutorial/how-to/reference/explanation stores the tag...
✖ approve of a legacy item with a passing verify closes it to done...
✖ approve twice: the second approve on an already-done item is rejected as precondition...
✖ merge list: a proposed item whose dep is already done is ready
✖ merge next merges the single ready item by recursing into approve, item reaches done
...
ℹ tests 447
ℹ pass 428
ℹ fail 19
```

(measured against `test/cli/fgos.test.mjs` right after removing `case 'compound'` from `bin/fgos.mjs` and the stage from `workflow-stage-graphs.mjs`, before the callers were updated)

Plus `test/state/workflow-stage-graphs.test.mjs` (7/49 failing on the stage removal itself) and `test/e2e/pr-gate.test.mjs` / `test/e2e/self-improve-loop.test.mjs` (each still calling the retired `compound` verb).

## Passing-after (real transcript excerpt)

```
ℹ tests 447
ℹ pass 447
ℹ fail 0
```

(`test/cli/fgos.test.mjs`, after all callers updated.)

Full `npm test` after: `tests 2112 / pass 2107 / fail 0` (5 skipped, none failing).

## What changed

`workflow-stage-graphs.mjs`'s `coding` domain drops `compound-learn` from `stages`/`stepMap`/`transitions`/`skillMap` (supersedes RUL49/RUL50/RUL51 — the synthesis layer it gated is now the status `retrospective`, `tsk-5e9`, not a stage). `bin/fgos.mjs` removes `case 'compound'` entirely, its `command-registry.mjs` manifest entry, and the now-dead `moveStage`/`assertValidDocType` imports. Every caller that advanced an item through the retired stage/verb (CLI, e2e, and the `workflow-stage-graphs`/`store`/`work` unit tests) is rewritten to either skip that step or use `addOutcome` directly for `docType`/`docPath` capture.
