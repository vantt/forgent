# Iron Law evidence: tsk-2iz

`classifyIronLaw` result against the real committed diff (`fgw/tsk-25r...fgw/tsk-2iz`,
this item's parent-root trunk):

```json
{"required":true,"matchedFlags":[],"matchedModules":["src/runner/merge.mjs"]}
```

## Test command

```
node --test test/runner/merge.test.mjs
```

## Failing-before (pre-fix `merge.mjs`, single-ref `nextFreeDecisionId` + unguarded resolve call)

Temporarily swapped `src/runner/merge.mjs` back to its content at commit
`f4cdb28d` (immediately before the implementation commit `a08c48f0`) and
reran the test file — including the two new cases this item added. Both
fail, each showing the real bug:

**Duplicate-id test** — the old `nextFreeDecisionId(repoRoot, 'HEAD')`
mints 0042 and lands the renamed branch file directly on top of the
branch's own already-clean 0042 file:
```
✖ tsk-2iz: mergeRunnerItem's decision-ID auto-resolve considers the BRANCH's own new ids too, not just HEAD -- never mints an id that collides with the branch's own already-clean file (73.259197ms)
  AssertionError [ERR_ASSERTION]: the bug: must NEVER land on 0042, which the branch's own file already claims
  true !== false
```

**Skipped-abort test** — the old unguarded call lets a real `git mv`
failure propagate as a genuinely UNCAUGHT exception straight out of
`mergeRunnerItem` (not a clean assertion failure — the test itself crashed
on the real error, exactly the "skips the abort" bug):
```
✖ tsk-2iz: a real failure INSIDE the decision-ID auto-resolve attempt (not the "doesn't match the shape" false case) still falls through to the same abort -- never leaves MERGE_HEAD or a half-renamed file behind (59.143289ms)
  Error: Command failed: git mv docs/decisions/0022-branch-decision.md docs/decisions/0023-branch-decision.md
  fatal: destination exists, source=docs/decisions/0022-branch-decision.md, destination=docs/decisions/0023-branch-decision.md
      at renumberDecisionFile (.../src/runner/merge.mjs:615:3)
      at autoResolveDecisionIndexCollision (.../src/runner/merge.mjs:702:21)
      at mergeRunnerItemLocked (.../src/runner/merge.mjs:1189:27)
      at mergeRunnerItem (.../src/runner/merge.mjs:948:20)
```

## Passing-after (post-fix `merge.mjs` restored)

```
ℹ tests 91
ℹ suites 0
ℹ pass 91
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

Full `merge.test.mjs` suite passes, including both new tsk-2iz tests and
every pre-existing decision-index-collision test (happy path, positional
collision, non-collision conflict, index-confined-check) unchanged.
