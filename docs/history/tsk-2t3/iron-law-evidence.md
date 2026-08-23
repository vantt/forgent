# Iron Law evidence: tsk-2t3

Per `tsk-5t3`'s contract (D2/D3): `classifyIronLaw` run against this item's
real committed diff (`changedFiles` on the committed `trunk...branch`
range, not a prediction) returned `required: true` —
`matchedModules: ["src/report/entropy.mjs"]` (on `MODULE_RULES`'
self-modifying-capable list via its own `equals` rule),
`matchedFlags: []` (no description-text keyword hit). The item's two other
changed files — `CHANGELOG.md` and `test/report/entropy.test.mjs` — are NOT
on `MODULE_RULES`; that is the real classifier's own output over the full
three-file list, not a guess.

```json
{
  "filesChanged": [
    "CHANGELOG.md",
    "src/report/entropy.mjs",
    "test/report/entropy.test.mjs"
  ],
  "result": {
    "required": true,
    "matchedFlags": [],
    "matchedModules": [
      "src/report/entropy.mjs"
    ]
  }
}
```

## Failing-test-first proof

Test command: `node --test test/report/entropy.test.mjs` (part of the
item's own recorded `verify`, `npm test`).

**Before the fix** — the extended/updated tests were written first and run
against the untouched `src/report/entropy.mjs`, which still filtered on the
retired literal `w.stage === 'clarify'` and still labelled the row
`stage-clarify`. 12 tests failed. Real transcript excerpts:

```text
✖ computeEntropy weighs an item still sitting at its domain's entry stage at ×3 (0.572754ms)
✖ computeEntropy does not flag a coding item still carrying the retired stage "clarify" (0.156466ms)
✖ computeEntropy flags an item at its own domain's entry stage even when that literal differs per domain (0.202384ms)
✖ computeEntropy does not flag an item sitting at ANOTHER domain's entry stage name (0.108197ms)
✖ computeEntropy does not flag a "done" item still carrying the entry stage -- resolved items are no longer waiting anywhere (D3) (0.097727ms)
✖ computeEntropy does not flag a "wontfix" item still carrying the entry stage -- resolved items are no longer waiting anywhere (D3) (0.059921ms)
✖ computeEntropy still flags a "todo" item at the entry stage (D3 does not over-broaden past done/wontfix) (0.06481ms)
✖ computeEntropy still flags a "doing" item at the entry stage (D3 does not over-broaden past done/wontfix) (0.044468ms)
✖ computeEntropy still flags a "blocked" item at the entry stage (D3 does not over-broaden past done/wontfix) (0.049631ms)
✖ computeEntropy still flags a "awaiting-human" item at the entry stage (D3 does not over-broaden past done/wontfix) (0.061015ms)
✖ computeEntropy does not flag an entry-stage item with a DIFFERENT domain's canceled-equivalent label + statusCategory 'canceled' (proves category-based recognition, not a literal 'wontfix' match) (0.074467ms)
✖ computeEntropy sums multiple contributing signals across different items into one score (0.153454ms)
```

The two failure shapes both point at the same defect — the row for this
signal did not exist under its honest label, and an item at the domain's
real entry stage scored nothing:

```text
test at .claude/worktrees/tsk-2t3-jBXgsH/test/report/entropy.test.mjs:122:3
✖ computeEntropy still flags a "awaiting-human" item at the entry stage (D3 does not over-broaden past done/wontfix) (0.096757ms)
  TypeError: Cannot read properties of undefined (reading 'count')
      at TestContext.<anonymous> (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-2t3-jBXgsH/test/report/entropy.test.mjs:125:62)
```

```text
test at .claude/worktrees/tsk-2t3-jBXgsH/test/report/entropy.test.mjs:179:1
✖ computeEntropy sums multiple contributing signals across different items into one score (0.134235ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:

  7 !== 10

      at TestContext.<anonymous> (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-2t3-jBXgsH/test/report/entropy.test.mjs:187:10)
    actual: 7,
    expected: 10,
```

`7 !== 10` is the defect in one number: the three-signal view scored only
`stale-doing` (5) + `awaiting-human` (2), because the item parked at the
domain's entry stage contributed 0 instead of its weight of 3.

**After the fix** — `countStageEntry` resolves `stages[0]` from each item's
own domain and the row is labelled `stage-entry`. Same command, real
transcript:

```text
ℹ tests 30
ℹ suites 0
ℹ pass 30
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 54.113046
```

**Full suite** (the item's own recorded `verify`, `npm test`, run from this
item's worktree):

```text
ℹ tests 2968
ℹ suites 0
ℹ pass 2963
ℹ fail 0
ℹ cancelled 0
ℹ skipped 5
ℹ todo 0
ℹ duration_ms 54728.612059
```

## Live-store cross-check

Read-only `computeEntropy` over the real `.fgos` store confirms the signal
now sees the backlog it was blind to — the `stage-entry` row reports 68
open items parked at the coding domain's entry stage, where the old
`stage-clarify` row reported 0:

```json
{
 "label": "stage-entry",
 "count": 68,
 "weight": 3,
 "points": 204
}
```
