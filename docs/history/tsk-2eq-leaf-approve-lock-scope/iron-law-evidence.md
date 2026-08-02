# tsk-2eq — Iron Law evidence

`classifyIronLaw({ filesChanged, description })` on this item's real diff
(`changedFiles(repoRoot, item)` against trunk) returned:

```json
{"required":true,"matchedFlags":[],"matchedModules":["bin/fgos.mjs","src/runner/merge.mjs"]}
```

Matched modules: `bin/fgos.mjs`, `src/runner/merge.mjs` — both gated,
matching no risk keyword flag.

## Test command

```
node --test --test-name-pattern="lockRoot" test/runner/merge.test.mjs
```

(the item's own full verify is `npm test`; this is the narrower command
that isolates the two new proof-point cases for the failing-before/
passing-after pair below.)

## Failing before (pre-fix `merge.mjs`/`bin/fgos.mjs`, same test file)

```
✖ mergeRunnerItem resolves the main-checkout lock against lockRoot, not repoRoot (46.275896ms)
✖ mergeRunnerItem refuses when lockRoot (not repoRoot) already holds the main-checkout lock — proves a leaf-approve-shaped call now actually contends (41.629339ms)
ℹ tests 2
ℹ pass 0
ℹ fail 2

✖ failing tests:

test at test/runner/merge.test.mjs:597:1
✖ mergeRunnerItem resolves the main-checkout lock against lockRoot, not repoRoot (46.275896ms)
  AssertionError [ERR_ASSERTION]: the lock directory must be created under lockRoot

  false !== true

      at TestContext.<anonymous> (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-2eq-yD9lcZ/test/runner/merge.test.mjs:605:10)
    generatedMessage: false,
    code: 'ERR_ASSERTION',
    actual: false,
    expected: true,
    operator: 'strictEqual',

test at test/runner/merge.test.mjs:609:1
✖ mergeRunnerItem refuses when lockRoot (not repoRoot) already holds the main-checkout lock — proves a leaf-approve-shaped call now actually contends (41.629339ms)
  AssertionError [ERR_ASSERTION]: Missing expected rejection.
      at process.processTicksAndRejections (node:internal/process/task_queues:104:5)
    generatedMessage: false,
    code: 'ERR_ASSERTION',
    actual: undefined,
    operator: 'rejects',
```

The second failure ("Missing expected rejection") is the bug itself,
reproduced directly: the pre-fix lock never contended against `lockRoot`,
so the leaf-approve-shaped call sailed through instead of refusing.

## Passing after (post-fix `merge.mjs`/`bin/fgos.mjs`, same test file, same command)

```
✔ mergeRunnerItem resolves the main-checkout lock against lockRoot, not repoRoot (58.448839ms)
✔ mergeRunnerItem refuses when lockRoot (not repoRoot) already holds the main-checkout lock — proves a leaf-approve-shaped call now actually contends (34.975644ms)
ℹ tests 2
ℹ pass 2
ℹ fail 0
```

## Full suite

`npm test`: 2153 tests, 2146 pass, 2 fail. Both failures are pre-existing
and unrelated to this change (confirmed via `git stash` of this item's own
diff and re-running the full suite on the unmodified baseline — same 2
tests fail identically with or without this fix):

- `test/skills/fgos-mirror.test.mjs` — `fgos-submit-assist/SKILL.md`
  differs between `.claude/skills` and `.agents/skills`.
- an architecture/manifest file-list consistency test (`đủ sổ: file .mjs
  trên đĩa ↔ row trong manifest`).

Neither touches `bin/fgos.mjs`, `src/runner/merge.mjs`, or
`test/runner/merge.test.mjs`.
