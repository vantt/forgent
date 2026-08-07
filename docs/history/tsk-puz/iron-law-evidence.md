# Iron Law evidence — tsk-puz

`classifyIronLaw` result against the real committed diff (`src/runner/merge.mjs`'s `changedFiles`, root = main checkout):

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": [
    "src/runner/dispatch.mjs",
    "src/runner/loop.mjs",
    "src/runner/prompt-templates.mjs",
    "src/runner/prompt-templates/worker-prompt-discovery.txt",
    "src/state/workflow-stage-graphs.mjs"
  ]
}
```

(The first four matched modules are tsk-5mj's own already-evidenced change,
inherited into this branch's diff since `fgw/tsk-puz` forked from
`fgw/tsk-5mj`'s worktree before it merged — see
`docs/history/tsk-5mj/iron-law-evidence.md`. This item's own real change is
`src/state/workflow-stage-graphs.mjs`, evidenced below.)

## Test command

```
node --test test/state/workflow-stage-graphs.test.mjs test/state/migrate-clarify-split.test.mjs
```

## Failing-before

Restored `src/state/workflow-stage-graphs.mjs` to its pre-tsk-puz committed
content (`git show HEAD~1:<path>`), kept the new/updated test files, ran the
command above — a real `FsmError` from the missing transition edge:

```
✖ an item parked awaiting-human migrates to exploring, even when it also carries a real decision (parked status wins — it is already past the discovery point) (5.870039ms)
  Error [FsmError]: transitionStage: no stage transition from "clarify" to "exploring" for work "parked".
      at transitionStage (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-puz-lmhZz1/src/state/stage-fsm.mjs:96:11)
      at file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-puz-lmhZz1/src/state/store.mjs:742:22
      at withEventsLock (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-puz-lmhZz1/src/state/events.mjs:334:12)
      at moveStage (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-puz-lmhZz1/src/state/store.mjs:735:17)
      at migrateClarifySplit (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-puz-lmhZz1/scripts/migrate-clarify-split.mjs:87:7)
```

(A second test, the idempotent-rerun one, failed the same way — same root
cause. A third, the `DOMAINS.coding.transitions` array assertion in
`workflow-stage-graphs.test.mjs`, failed on a plain array-length mismatch —
the old file has 6 edges, the test expects 7.) 3 failed, 46 passed.

## Passing-after

Restored the real tsk-puz committed content, reran the same command:

```
ℹ tests 49
ℹ suites 0
ℹ pass 49
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

`git status --short src/state/workflow-stage-graphs.mjs` confirmed the file
was restored byte-identical to the committed version before continuing (no
stray diff left behind by this evidence-gathering swap).
