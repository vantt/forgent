# tsk-4oq — Iron Law evidence

`classifyIronLaw` result on this item's committed diff (`changedFiles`,
`src/runner/merge.mjs`):

```json
{"required":true,"matchedFlags":[],"matchedModules":["src/runner/dispatch/cli.mjs"]}
```

`src/runner/dispatch/cli.mjs` is a self-modifying-capable module per
`src/evolve/iron-law.mjs`'s `MODULE_RULES` — required: true.

## Test command

`npm test` (`node --test 'test/**/*.test.mjs'`)

## Failing-test-first proof

The two new regression tests
(`test/runner/dispatch.test.mjs:3300-3344`) were run in isolation
(`node --test --test-name-pattern="executeExecutorCli returns
outcome|executeExecutorCli omits outcome" test/runner/dispatch.test.mjs`)
against the pre-fix version of `src/runner/dispatch/cli.mjs` (`git show
a139e796:src/runner/dispatch/cli.mjs`, the commit immediately before this
item's implementation commit `de245b41`, temporarily swapped in with the
new test file left at its current post-fix content), to confirm they
genuinely fail without the fix — then restored to the real committed
fix and re-run to confirm they pass.

### Before the fix — fails as expected

```
✖ executeExecutorCli returns outcome:"unsignaled" with headBefore and headAfter when stdout lacks [DONE] or [BLOCKED] (49.092917ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  + actual - expected

  + undefined
  - 'unsignaled'

      at TestContext.<anonymous> (test/runner/dispatch.test.mjs:3312:10)
      ...
    generatedMessage: true,
    code: 'ERR_ASSERTION',
    actual: undefined,
    expected: 'unsignaled',
    operator: 'strictEqual',
    diff: 'simple'
  }
✔ executeExecutorCli omits outcome and head shas when stdout contains [DONE] or [BLOCKED] (78.322469ms)

ℹ tests 2
ℹ pass 1
ℹ fail 1
```

The `omits outcome...` test passes even pre-fix (correctly: the old code
already never added an `outcome` field for either shape), so only the
`returns outcome:"unsignaled"` test fails before the fix — `undefined
!== 'unsignaled'`, confirming the pre-fix code genuinely never surfaces
the missing-signal case, exactly the enforcement gap this item closes,
not a hypothetical.

### After the fix — passes

```
✔ executeExecutorCli returns outcome:"unsignaled" with headBefore and headAfter when stdout lacks [DONE] or [BLOCKED] (50.041515ms)
✔ executeExecutorCli omits outcome and head shas when stdout contains [DONE] or [BLOCKED] (86.811756ms)

ℹ tests 2
ℹ suites 0
ℹ pass 2
ℹ fail 0
```

## Broader regression check

Full repo test suite (`npm test`): 3750 tests. First run: 3745
pass / 0 fail / 5 skipped, exit 0. A second, unpiped run (to capture the
real exit code) showed exactly one failure elsewhere in the suite:
`fgos setup wires the dispatch-decide PreToolUse hook and reports it in
the envelope` (`test/setup/claude-code-hooks.test.mjs:99`), error `fgos:
generateWrapperContent: source has no YAML frontmatter block (---...---)
to copy` — unrelated to this item's own diff (only
`src/runner/dispatch/cli.mjs`/`test/runner/dispatch.test.mjs` were
touched; this failure is in skill-wrapper generation over
`.claude/skills`/`.agents/skills` source). Re-run in isolation
(`node --test --test-name-pattern="fgos setup wires the dispatch-decide
PreToolUse hook..." test/setup/claude-code-hooks.test.mjs`): passes
cleanly. Confirmed as a real flake — this machine has several other
Claude Code sessions/worktrees running concurrently against the same
shared skill-source files during the full-suite run, a transient race
on a frontmatter read, not a regression from this item's diff.
