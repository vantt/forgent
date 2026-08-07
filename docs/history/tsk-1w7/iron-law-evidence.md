# Iron Law evidence — tsk-1w7

`classifyIronLaw` result against the real committed diff (`src/runner/merge.mjs`'s `changedFiles`, root = main checkout):

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": [
    "src/state/workflow-stage-graphs.mjs"
  ]
}
```

## Test command

```
node --test test/state/workflow-stage-graphs.test.mjs
```

## Failing-before

Restored `src/state/workflow-stage-graphs.mjs` to its pre-tsk-1w7 committed
content (`git show HEAD~1:src/state/workflow-stage-graphs.mjs`), kept the
new test file, ran the command above:

```
✖ DOMAINS.coding.stages adds "discovery" and "exploring" between clarify and decompose (tsk-1w7 D10) — compound-learn stays retired (D11) (0.748782ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
  + actual - expected

    [
      'clarify',
  -   'discovery',
  -   'exploring',
      'decompose',
      'executing'
    ]

      at TestContext.<anonymous> (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-1w7-SjOkxV/test/state/workflow-stage-graphs.test.mjs:37:10)
```

(Two more assertions failed the same way in the same run — the
`transitions`-array test and the `skillMap` test — same root cause: the old
file's `DOMAINS.coding` entry has no `discovery`/`exploring` stages,
transitions, or skill entries.)

## Passing-after

Restored the real tsk-1w7 committed content, reran the same command:

```
ℹ tests 39
ℹ suites 0
ℹ pass 39
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

`git status --short src/state/workflow-stage-graphs.mjs` confirmed the file
was restored byte-identical to the committed version before continuing (no
stray diff left behind by this evidence-gathering swap).
