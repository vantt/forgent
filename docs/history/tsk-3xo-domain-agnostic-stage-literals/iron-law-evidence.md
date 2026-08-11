# tsk-3xo — Iron Law evidence

`classifyIronLaw` on this item's real diff (commit `8b6741f`, computed via
`changedFiles`/`classifyIronLaw` per `fgos-coding-implement`'s own step 4):

```json
{
  "filesChanged": [
    "bin/fgos.mjs",
    "docs/history/tsk-3xo-domain-agnostic-stage-literals/CONTEXT.md",
    "docs/history/tsk-3xo-domain-agnostic-stage-literals/plan.md",
    "src/intake/plan.mjs",
    "src/intake/discovery.mjs",
    "src/state/workflow-stage-graphs.mjs",
    "test/e2e/domain-aware-stage-literals.test.mjs",
    "test/state/workflow-stage-graphs.test.mjs"
  ],
  "required": true,
  "matchedFlags": [],
  "matchedModules": [
    "bin/fgos.mjs",
    "src/state/workflow-stage-graphs.mjs"
  ]
}
```

## Test command

```
node --test test/e2e/domain-aware-stage-literals.test.mjs
```

## Failing-before transcript

Real run against the pre-fix source (`git checkout 6a2ec31 -- bin/fgos.mjs
src/intake/plan.mjs src/intake/discovery.mjs
src/state/workflow-stage-graphs.mjs test/state/workflow-stage-graphs.test.mjs`,
new test file kept as-is, then restored to the fixed `HEAD` version
afterward — never a hand-edited/fabricated transcript):

```
✖ sync CLI: fgos discover / fgos plan cross a "triage" fixture-domain item through its own Clarify/Divide-mapped stages (not coding's literal names), no throw (177.019127ms)
✖ runner sweep: a "triage" fixture-domain item at its own Clarify-mapped stage no longer halts the whole tick — an unrelated coding item in the same sweep still dispatches (160.624223ms)
ℹ tests 2
ℹ suites 0
ℹ pass 0
ℹ fail 2
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 395.863911

✖ failing tests:

test at test/e2e/domain-aware-stage-literals.test.mjs:168:1
✖ sync CLI: fgos discover / fgos plan cross a "triage" fixture-domain item through its own Clarify/Divide-mapped stages (not coding's literal names), no throw (177.019127ms)
  AssertionError [ERR_ASSERTION]: fgos submit failed: fgos: work.domain must be one of ["coding","synthetic"] when present, got: "triage"

  4 !== 0

test at test/e2e/domain-aware-stage-literals.test.mjs:209:1
✖ runner sweep: a "triage" fixture-domain item at its own Clarify-mapped stage no longer halts the whole tick — an unrelated coding item in the same sweep still dispatches (160.624223ms)
  AssertionError [ERR_ASSERTION]: fgos submit failed: fgos: work.domain must be one of ["coding","synthetic"] when present, got: "triage"

  4 !== 0
```

The pre-fix failure is "domain doesn't exist" rather than the deeper
`FsmError('precondition')` the source report's own Finding 1 describes,
because the `triage` fixture domain itself is part of this same commit
(bundled per plan.md's "one honest piece" split decision) — without it,
`work.mjs`'s `validateWork` rejects the item before it can ever reach the
hardcoded-literal code path. This is still real, non-fabricated evidence
that the whole feature (fixture domain + literal fix, one bundled change)
does not work pre-fix.

## Passing-after transcript

Real run against the fixed source (`HEAD`, commit `8b6741f`):

```
✔ sync CLI: fgos discover / fgos plan cross a "triage" fixture-domain item through its own Clarify/Divide-mapped stages (not coding's literal names), no throw (315.038267ms)
✔ runner sweep: a "triage" fixture-domain item at its own Clarify-mapped stage no longer halts the whole tick — an unrelated coding item in the same sweep still dispatches (569.053536ms)
ℹ tests 2
ℹ suites 0
ℹ pass 2
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 938.850899
```

## Broader regression proof

Full relevant suite (discovery/decompose/synthetic-domain/workflow-stage-graphs/
new e2e, 206 tests) and the full `npm test` suite (2464 tests, 2459 pass, 5
pre-existing environment-conditional skips unrelated to this change —
`coexistence-canary.test.mjs`'s `BEE_SKIP` ×4 and
`self-uninstall-spike.test.mjs`'s Windows-only skip ×1) both ran green
against the fixed source, confirming the "zero-behavior-change for coding"
claim (CONTEXT.md's pinned "the proven pattern" evidence).
