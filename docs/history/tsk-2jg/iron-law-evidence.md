# Iron Law Evidence — tsk-2jg

Matched modules: `src/state/store.mjs`
Matched flags: none

## Failing Test Output (Red)

Command: `node --test --test-name-pattern="tsk-2jg" test/state/store.test.mjs` (run with pre-fix `src/state/store.mjs`)

```
✖ tsk-2jg: assertPlanEvidence allows a risk:heavy item with NO fgw/<id> branch when plan.md exists on current tree (docs/history/<id>/plan.md shape) (495.635971ms)
✖ tsk-2jg: assertPlanEvidence allows a risk:heavy item with NO fgw/<id> branch when plan.md exists on current tree via docsRef (460.216782ms)
ℹ tests 2
ℹ suites 0
ℹ pass 0
ℹ fail 2
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 1274.800507

✖ failing tests:

test at test/state/store.test.mjs:1095:1
✖ tsk-2jg: assertPlanEvidence allows a risk:heavy item with NO fgw/<id> branch when plan.md exists on current tree (docs/history/<id>/plan.md shape) (495.635971ms)
  Error [StoreError]: work "nobranch-history" cannot move to "delivered" — risk:heavy but no plan.md found on branch "fgw/nobranch-history" (checked docs/history/nobranch-history/plan.md); write one before landing.
      at assertPlanEvidence (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-2jg-DyDAJ9/src/state/store.mjs:638:11)
      at file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-2jg-DyDAJ9/src/state/store.mjs:883:5
      at file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-2jg-DyDAJ9/src/state/store.mjs:213:20
      at withEventsLock (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-2jg-DyDAJ9/src/state/events.mjs:405:12)
      at withEventsLockAndRefresh (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-2jg-DyDAJ9/src/state/store.mjs:212:17)
      at moveWork (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-2jg-DyDAJ9/src/state/store.mjs:660:18)
      at TestContext.<anonymous> (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-2jg-DyDAJ9/test/state/store.test.mjs:1102:20)

test at test/state/store.test.mjs:1106:1
✖ tsk-2jg: assertPlanEvidence allows a risk:heavy item with NO fgw/<id> branch when plan.md exists on current tree via docsRef (460.216782ms)
  Error [StoreError]: work "nobranch-docsref" cannot move to "delivered" — risk:heavy but no plan.md found on branch "fgw/nobranch-docsref" (checked docs/history/custom-parent-plan/plan.md, docs/history/nobranch-docsref/plan.md); write one before landing.
      at assertPlanEvidence (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-2jg-DyDAJ9/src/state/store.mjs:638:11)
      at file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-2jg-DyDAJ9/src/state/store.mjs:883:5
      at file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-2jg-DyDAJ9/src/state/store.mjs:213:20
      at withEventsLock (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-2jg-DyDAJ9/src/state/events.mjs:405:12)
      at withEventsLockAndRefresh (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-2jg-DyDAJ9/src/state/store.mjs:212:17)
      at moveWork (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-2jg-DyDAJ9/src/state/store.mjs:660:18)
      at TestContext.<anonymous> (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-2jg-DyDAJ9/test/state/store.test.mjs:1113:20)
```

## Passing Test Output (Green)

Command: `node --test --test-name-pattern="tsk-2jg" test/state/store.test.mjs` (run with fixed `src/state/store.mjs`)

```
✔ tsk-2jg: assertPlanEvidence allows a risk:heavy item with NO fgw/<id> branch when plan.md exists on current tree (docs/history/<id>/plan.md shape) (732.360848ms)
✔ tsk-2jg: assertPlanEvidence allows a risk:heavy item with NO fgw/<id> branch when plan.md exists on current tree via docsRef (642.436936ms)
ℹ tests 2
ℹ suites 0
ℹ pass 2
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 1689.770458
```
