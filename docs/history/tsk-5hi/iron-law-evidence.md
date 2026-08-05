# tsk-5hi — Iron Law evidence

`classifyIronLaw` result against the item's real committed diff
(`253a983`, changed files: `bin/fgos.mjs`,
`docs/history/setup-runs-registered-fixes/CONTEXT.md`,
`docs/history/setup-runs-registered-fixes/plan.md`,
`docs/specs/distribution.md`, `test/cli/fgos.test.mjs`):

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": ["bin/fgos.mjs"]
}
```

## Verify command

```
npm test -- test/cli/fgos.test.mjs test/setup/registrations.test.mjs
```

## Failing-before / passing-after (real, not simulated)

Isolated to the one new test this item added
(`test/cli/fgos.test.mjs:527`, `setup runs every registered fix and
reports them under "fixed", never touching a real claude binary`),
proven by swapping `bin/fgos.mjs` back to its pre-implementation content
(`git show 584a27d:bin/fgos.mjs`) and rerunning, then restoring the real
implementation and rerunning again:

**Before** (`bin/fgos.mjs` at `584a27d`, no `runFixes()` call in `setup`):

```
test at test/cli/fgos.test.mjs:527:1
✖ setup runs every registered fix and reports them under "fixed", never touching a real claude binary (52.56423ms)
  AssertionError [ERR_ASSERTION]: setup result missing a "fixed" array
      at TestContext.<anonymous> (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-5hi-13RrGJ/test/cli/fgos.test.mjs:535:10)
...
ℹ tests 529
ℹ pass 528
ℹ fail 1
```

**After** (`bin/fgos.mjs` restored to the real implementation, `253a983`):

```
ℹ tests 529
ℹ pass 529
ℹ fail 0
```

`bin/fgos.mjs` was byte-identical to the committed version after restore
(`git status --short bin/fgos.mjs` — no output, clean).

Full verify command (`test/cli/fgos.test.mjs` + `test/setup/
registrations.test.mjs`, run as the whole repo's `npm test`, which runs
the entire suite regardless of the file args passed) also confirmed
green at 2569/2574 passing, 0 failing, 5 pre-existing skips, one more
test than the 2573/2568 pre-change baseline — exactly the one new test
this item added.
