# Iron Law evidence: tsk-1p9

Per `tsk-5t3`'s contract (D2/D3): `classifyIronLaw` on this item's final
diff (post-commit, `cb917d3`) returned `required: true` —
`matchedModules: ["bin/fgos.mjs", "src/runner/merge.mjs"]` (both are
self-modifying: this item edits `approve`'s own merge dispatch and the
merge engine's own branch/worktree teardown), `matchedFlags: []`.

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": ["bin/fgos.mjs", "src/runner/merge.mjs"]
}
```

## Failing-test-first proof

Test command: `node --test --test-name-pattern="cleanup of a LEAF item" test/cli/fgos.test.mjs`
— the new test proving this item's core claim (D7/D8): a leaf item's own
branch must actually be deleted by the `cleanup` verb, even while its root
branch is still unmerged into main.

**Before the fix** (source files reverted to `d568ae0`, the commit
immediately before this item's implementation — `bin/fgos.mjs`,
`src/runner/merge.mjs`, `src/state/cleanup-harness.mjs`): the test first
asserts the leaf's branch still exists right after `approve` — under the
OLD code, `approve`'s leaf-into-root merge path still called
`cleanupMergedBranch` synchronously, deleting the leaf's branch
immediately, before the test even reaches its `cleanup`-verb assertions.
Real transcript:

```
✖ cleanup of a LEAF item deletes its own branch even though the ROOT branch is still unmerged into main (tsk-1p9 D7/D8) (392.898179ms)
  AssertionError [ERR_ASSERTION]: the leaf branch must still exist right after approve
      at TestContext.<anonymous> (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-1p9-rF2BQk/test/cli/fgos.test.mjs:8562:10)
      at Test.runInAsyncScope (node:async_hooks:227:14)
      at Test.run (node:internal/test_runner/test:1325:25)
      at Test.start (node:internal/test_runner/test:1191:17)
      at startSubtestAfterBootstrap (node:internal/test_runner/harness:385:17) {
    generatedMessage: false,
    code: 'ERR_ASSERTION',
    actual: 'fgw/leaf-cleanup-root\n',
    expected: /fgw\/leaf-cleanup-child\b/,
    operator: 'match',
    diff: 'simple'
  }
ℹ tests 1
ℹ pass 0
ℹ fail 1
```

**After the fix** — `approve`'s two `'merged'`-outcome branches no longer
call `cleanupMergedBranch` (D1); `checkMergeStillResolves`
(`src/state/cleanup-harness.mjs`) gains root-aware ref resolution via
`resolveRoot` (D7) so it checks a leaf's ancestry against its root's
branch instead of literal `HEAD`; `cleanupMergedBranch`'s own branch
delete switches from `git branch -d` to `git branch -D` (D8), since D7's
fixed check has already independently verified the correct ancestry.
Same test, real transcript:

```
✔ cleanup of a LEAF item deletes its own branch even though the ROOT branch is still unmerged into main (tsk-1p9 D7/D8) (555.79817ms)
ℹ tests 1
ℹ pass 1
ℹ fail 0
```

Full suite after the fix (the item's own recorded `verify` command run in
full — `node --test test/state/cleanup-harness.test.mjs
test/runner/merge.test.mjs test/runner/worktree.test.mjs
test/cli/fgos.test.mjs`): **642 tests, 642 pass, 0 fail, 0 cancelled, 0
skipped**. Full repo `npm test` (state + cli + runner + e2e): **2552
tests, 2547 pass, 0 fail, 5 skipped (pre-existing, unrelated)** — this run
also caught and fixed 5 pre-existing e2e/CLI tests
(`test/cli/fgos.test.mjs` x2, `test/e2e/pr-gate.test.mjs` x2,
`test/e2e/self-improve-loop.test.mjs` x1) whose assertions assumed the
OLD synchronous-cleanup-at-merge behavior; all 5 now exercise the real
`cleanup` verb instead of a bare `move --to done`, matching this item's
own restored design.
