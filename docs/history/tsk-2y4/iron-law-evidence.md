# Iron Law evidence — tsk-2y4

`classifyIronLaw` result against the real committed diff
(`5feb1d1c` on `fgw/tsk-2y4`, trunk...branch, per `merge.mjs`'s own
`changedFiles`):

```json
{
  "required": true,
  "matchedFlags": ["audit"],
  "matchedModules": []
}
```

`matchedFlags: ["audit"]` is the same mechanical false-positive already
named in this item's own gate-approval round (see `plan.md`'s validating
handoff): the item's description contains "...before the gateway-**audit**
session's own changes...", an unrelated prior session's name, not a real
audit/security concern in this change. The classifier is intentionally
monotone-only-toward-requiring-evidence, so it is honored here exactly as
computed, not overridden.

Verify command: `node --test test/runner/dispatch.test.mjs`

## Failing-before (pre-fix, at `7bb32314` / worktree HEAD before the fix
commit)

```
test at test/runner/dispatch.test.mjs:651:1
✖ the committed .fgos/config.json runner section declares the gather capacity (tsk-28o): for "gather", needs "prompt-completion", carries "repo-content" (D1, gather-capacity-purpose-binding CONTEXT.md), kind cli, allowCrossProvider true, well-formed {prompt}/{model} args (2.024473ms)
  AssertionError [ERR_ASSERTION]: capacities.gather must exist
      at TestContext.<anonymous> (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-2y4-gdely2/test/runner/dispatch.test.mjs:654:10)
      at Test.runInAsyncScope (node:async_hooks:227:14)
      at Test.run (node:internal/test_runner/test:1325:25)
      at Test.processPendingSubtests (node:internal/test_runner/test:911:18)
      at Test.postRun (node:internal/test_runner/test:1465:19)
      at Test.run (node:internal/test_runner/test:1390:12)
      at async Test.processPendingSubtests (node:internal/test_runner/test:911:7) {
    generatedMessage: false,
    code: 'ERR_ASSERTION',
    actual: undefined,
    expected: true,
    operator: '==',
    diff: 'simple'
  }
```

## Passing-after (post-fix, commit `5feb1d1c`)

```
✔ the committed .fgos/config.json runner section no longer declares a coding-classify-intake capacity (tsk-49u): ... (1.921858ms)
✔ the committed .fgos/config.json runner section no longer declares a gather capacity (tsk-5tm D6): removed as the only cross-provider path with no recorded architectural reason to keep it -- the real reason it existed (parallelization) is already covered by the native Task tool; tsk-5tm-2 removed it, tsk-5tm's remaining children do not reintroduce it
...
ℹ tests 179
ℹ suites 0
ℹ pass 179
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 3547.238162
```

Full suite: 179/179 pass, 0 fail.
