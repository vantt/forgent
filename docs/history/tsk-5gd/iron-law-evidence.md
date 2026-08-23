# tsk-5gd — Iron Law evidence

`classifyIronLaw` result on this item's committed diff (`changedFiles`,
`src/runner/merge.mjs`):

```json
{"required":true,"matchedFlags":[],"matchedModules":["src/runner/dispatch/cli.mjs"]}
```

`src/runner/dispatch/cli.mjs` is a self-modifying-capable module per
`src/evolve/iron-law.mjs`'s `MODULE_RULES` — required: true. Same module
`tsk-4oq` (`docs/history/tsk-4oq/iron-law-evidence.md`) previously
touched, adding the `hasSignal`/`outcome:'unsignaled'` mechanism this
item narrows.

## Test command

`node --test test/runner/dispatch.test.mjs && npm test`

## Failing-test-first proof

The new regression test
(`test/runner/dispatch.test.mjs:3346-3378`, "executeExecutorCli returns
outcome:\"unsignaled\" when [DONE] or [BLOCKED] appears only inside
backtick-quoted text") was run in isolation
(`node --test --test-name-pattern="executeExecutorCli returns
outcome:\"unsignaled\" when \[DONE\] or \[BLOCKED\] appears only inside
backtick-quoted text" test/runner/dispatch.test.mjs`) against the
pre-fix version of `src/runner/dispatch/cli.mjs` (`git show
98002bdb:src/runner/dispatch/cli.mjs`, the commit immediately before
this item's implementation commit `065b0807`, temporarily swapped in
with the new test file left at its current post-fix content), to
confirm it genuinely fails without the fix — then restored to the real
committed fix and re-run to confirm it passes.

### Before the fix — fails as expected

```
✖ executeExecutorCli returns outcome:"unsignaled" when [DONE] or [BLOCKED] appears only inside backtick-quoted text (181.458506ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  + actual - expected

  + undefined
  - 'unsignaled'

      at TestContext.<anonymous> (test/runner/dispatch.test.mjs:3371:10)
      ...
    generatedMessage: true,
    code: 'ERR_ASSERTION',
    actual: undefined,
    expected: 'unsignaled',
    operator: 'strictEqual',
    diff: 'simple'
  }

ℹ tests 1
ℹ pass 0
ℹ fail 1
```

The pre-fix `hasSignal = stdoutStr.includes('[DONE]') ||
stdoutStr.includes('[BLOCKED]')` treats the backtick-quoted mention as a
real signal, so `outcome` is never set to `'unsignaled'` — the exact gap
`docs/history/tsk-5gd/RESEARCH.md` Round 1 identified from tsk-5gd's own
real agy/gemini-3.6-flash-medium transcript.

### After the fix — passes

```
✔ executeExecutorCli returns outcome:"unsignaled" when [DONE] or [BLOCKED] appears only inside backtick-quoted text (384.68528ms)

ℹ tests 1
ℹ pass 1
ℹ fail 0
```

The test covers both halves in one run: stdout with the token only
inside backtick spans now correctly reports `outcome:'unsignaled'`, and
stdout with the token both inside a backtick span AND as a genuine
standalone line still correctly omits `outcome` (stays signaled) — the
fix does not over-tighten past the two pre-existing GREEN tests.

## Broader regression check

Full repo test suite (`npm test`): 3766 tests. 3761 pass / 0 fail / 5
skipped, exit 0 — includes the two pre-existing `hasSignal`/`outcome`
tests (`test/runner/dispatch.test.mjs:3300,3317`) staying green
unmodified, confirming the backtick-stripping fix does not regress the
`pi`/`claude` GREEN coverage already recorded in
`coding-worker-contract.md`.
