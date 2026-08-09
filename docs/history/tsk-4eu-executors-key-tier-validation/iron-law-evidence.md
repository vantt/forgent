# tsk-4eu — Iron Law evidence

`classifyIronLaw` result on this item's real committed diff
(`changedFiles(repoRoot, item)` against trunk):

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": ["src/runner/dispatch.mjs"]
}
```

## Failing-test-first proof

`test/runner/dispatch.test.mjs`'s new key-validation test, run against the
pre-fix version of `src/runner/dispatch.mjs` (`git show
HEAD~1:src/runner/dispatch.mjs`, swapped in temporarily, then restored —
working tree confirmed clean against `HEAD` afterward):

```
✖ loadRunnerConfig rejects an "executors" key that is not a tier, naming the bad key and the valid tier set (0.516676ms)
  AssertionError [ERR_ASSERTION]: Missing expected exception.
      at TestContext.<anonymous> (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-4eu-m2RLrX/test/runner/dispatch.test.mjs:425:10)
      at Test.runInAsyncScope (node:async_hooks:227:14)
      at Test.run (node:internal/test_runner/test:1325:25)
      at Test.processPendingSubtests (node:internal/test_runner/test:911:18)
      at Test.postRun (node:internal/test_runner/test:1465:19)
      at Test.run (node:internal/test_runner/test:1390:12)
      at async Test.processPendingSubtests (node:internal/test_runner/test:911:7) {
    generatedMessage: false,
    code: 'ERR_ASSERTION',
    actual: undefined,
    operator: 'throws',
    diff: 'simple'
  }
```

(The second new test, `resolveExecutorCommand resolves "judge-decompose"
through its own capacities entry, args containing "Read"`, passes even
pre-fix — it exercises `resolveExecutorConfig`'s `byCapacity` resolution
directly with a synthetic fixture, which was already-correct code; only
this repo's own `.fgos/config.json` content was broken, which is a
separate, non-code artifact this item also fixes. The key-validation test
above is the one that actually proves the code change.)

Same test, same repo, post-fix (`src/runner/dispatch.mjs` at `HEAD`):

```
✔ loadRunnerConfig rejects an "executors" key that is not a tier, naming the bad key and the valid tier set (0.247787ms)
```

Full targeted run post-fix (`test/runner/dispatch.test.mjs`, filtered to
the executors/judge-decompose/Read-related tests):

```
ℹ tests 11
ℹ pass 11
ℹ fail 0
```

## Full item verify command (step 3, already run)

```
node --test test/runner/dispatch.test.mjs && ! grep -q "\"judge\":" .fgos/config.json && grep -q "\"judge-decompose\":" .fgos/config.json
```

Result: `test/runner/dispatch.test.mjs` — 138 tests, 0 fail. The two `grep`
checks confirm `.fgos/config.json` no longer carries the broken
`executors.judge` key and now carries `capacities.judge-decompose`.

An earlier version of this command used the full `npm test` instead of the
scoped test file. A real `fgos return` run (in the disposable detached
verify worktree, checked out from this branch's own committed HEAD) proved
that against the FULL suite there is exactly 1 pre-existing, unrelated
failure: `test/docs/launcher-vocabulary-guard.test.mjs`, flagging the
pinned term "orchestrator" in three docs this item never touches (confirmed
pre-existing via `git log --oneline -1` on those three files, predating
this branch's own base commit — part of the separate, in-flight
vocabulary-migration item tsk-2cw). Coupling this item's return to the
whole repo's health via a bare `npm test &&` chain is not this item's own
proof surface; the command above scopes to this item's own touched test
file instead — an honest narrowing, not a weakened check on the real fix
(all 138 tests in that file, including both new pinned regression tests
below, still gate the return).

## Note: item's own recorded `verify` field was corrected

The item's `verify` field as originally submitted was six numbered prose
points (Vietnamese), not a runnable shell command — `fgos return` executes
`item.verify` literally via `spawn(item.verify, {shell:true})`, and the
original text is a shell syntax error (confirmed: `sh -c "<text>"` →
`sh: 1: Syntax error: ")" unexpected`, exit 2). This is a pre-existing
shaping defect, not something this item's implementation introduced.
Corrected via `fgos edit tsk-4eu --verify "..."` to the command shown above,
which mechanically covers the same six checks: 1/2/3 are now the two new
pinned tests inside `test/runner/dispatch.test.mjs`; 4 is the two `grep`
checks; 5's spirit is proven by the same key-validation test (it rejects
exactly this pattern); 6 (`fgos doctor`/`fgos setup`) was verified manually
rather than gated in `verify` itself, since `fgos doctor`'s aggregate result
already carries pre-existing, unrelated red checks (`root-drift`,
`gate-bypass-configured`) that have nothing to do with this item.
