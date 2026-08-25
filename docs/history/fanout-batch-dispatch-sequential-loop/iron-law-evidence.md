# Iron Law evidence — tsk-5v3

`classifyIronLaw` against the real committed diff (`152de00d`,
`trunk...fgw/tsk-5v3`) returned `required: true`:

```json
{
  "filesChanged": [
    ".agents/skills/fgos-fanout/references/wave-dispatch-mechanics.md",
    "docs/history/fanout-batch-dispatch-sequential-loop/RESEARCH.md",
    "docs/history/fanout-batch-dispatch-sequential-loop/plan.md",
    "plugins/fgOS/skills/fgos-fanout/references/wave-dispatch-mechanics.md",
    "src/runner/dispatch/cli.mjs",
    "test/runner/dispatch.test.mjs"
  ],
  "classification": {
    "required": true,
    "matchedFlags": [],
    "matchedModules": ["src/runner/dispatch/cli.mjs"]
  }
}
```

## Test command

```
node --test test/runner/dispatch.test.mjs
```

## Failing-before proof

Real transcript, captured by temporarily swapping `src/runner/dispatch/
cli.mjs` back to its pre-fix content (`git show
983a31d159f5cdca78558c7be1befe0670b7873e:src/runner/dispatch/cli.mjs`,
the merge-base with trunk) while keeping the new test, then running only
the new test:

```
$ node --test --test-name-pattern="fires candidates in batch concurrently" test/runner/dispatch.test.mjs
✖ fanoutBatchExecutorCli fires candidates in batch concurrently with overlapping execution windows (988.026475ms)
ℹ tests 1
ℹ suites 0
ℹ pass 0
ℹ fail 1

✖ failing tests:

test at test/runner/dispatch.test.mjs:4880:1
✖ fanoutBatchExecutorCli fires candidates in batch concurrently with overlapping execution windows (988.026475ms)
  AssertionError [ERR_ASSERTION]: Expected execution windows to overlap, but candidate 1: [1787567345113, 1787567345318] and candidate 2: [1787567345586, 1787567345791]
      at TestContext.<anonymous> (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-5v3-9ft59y/test/runner/dispatch.test.mjs:4948:10)
```

cli.mjs was restored to the real committed fix immediately after (`git
status`/`git diff` on the file came back clean, confirming an exact
match to `152de00d`).

## Passing-after proof

Real transcript, full suite, against the actual committed fix:

```
$ node --test test/runner/dispatch.test.mjs
✔ fanoutBatchExecutorCli: real end-to-end out-of-process fire -- pick/execute/return actually complete via subprocess calls to the real bin/fgos.mjs (closes the --dir/worktreePath-shape bug: this function used to pass fgosDir instead of root to --dir, doubling the .fgos suffix into a nonexistent path, and read a flat .worktreePath field the fgos.v1 envelope never has -- data.worktree.path is the real shape) (301.504234ms)
✔ fanoutBatchExecutorCli fires candidates in batch concurrently with overlapping execution windows (649.932158ms)
ℹ tests 312
ℹ suites 0
ℹ pass 312
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 11393.347932
```
