# tsk-1tm — Iron Law evidence

`classifyIronLaw` result: `required: true`, `matchedFlags: []`,
`matchedModules: ["src/runner/worktree.mjs"]`.

## Verify command

```
rg -n 'live session|isLiveSessionWorktree' -i src/runner/worktree.mjs && node --test test/runner/worktree.test.mjs
```

## Failing before (pre-fix, `HEAD~1`'s `src/runner/worktree.mjs`)

Ran only the two new exact-behavior tests (`--test-name-pattern="tsk-1tm"`)
against the pre-fix source (no `LIVE SESSION GUARD`, no `callerCwd` param):

```
ℹ pass 0
ℹ fail 2
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 137.123849

✖ failing tests:

test at test/runner/worktree.test.mjs:278:1
✖ reclaimOrphanedCheckout refuses (throws, does not remove) a checkout that is the calling session's own live cwd (tsk-1tm, exact-match) (39.502459ms)
  AssertionError [ERR_ASSERTION]: Missing expected exception (WorktreeError).
      at TestContext.<anonymous> (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-1tm-Td0FJv/test/runner/worktree.test.mjs:288:10)
      ...
    generatedMessage: false,
    code: 'ERR_ASSERTION',
    actual: undefined,
    operator: 'throws',
    diff: 'simple'
  }

test at test/runner/worktree.test.mjs:294:1
✖ reclaimOrphanedCheckout refuses (throws, does not remove) a checkout whose live session cwd is nested under it (tsk-1tm, defense-in-depth) (49.786827ms)
  AssertionError [ERR_ASSERTION]: Missing expected exception (WorktreeError).
      at TestContext.<anonymous> (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-1tm-Td0FJv/test/runner/worktree.test.mjs:302:10)
      ...
    generatedMessage: false,
    code: 'ERR_ASSERTION',
    actual: undefined,
    operator: 'throws',
    diff: 'simple'
  }
```

Confirms both new tests genuinely exercise the previously-missing guard —
without it, `reclaimOrphanedCheckout` proceeds to force-remove the
checkout instead of throwing.

## Passing after (post-fix, committed `1fe42d2`)

Full verify command, full suite:

```
✔ reclaimOrphanedCheckout refuses (throws, does not remove) a checkout that is the calling session's own live cwd (tsk-1tm, exact-match) (31.541385ms)
✔ reclaimOrphanedCheckout refuses (throws, does not remove) a checkout whose live session cwd is nested under it (tsk-1tm, defense-in-depth) (40.175955ms)
✔ reclaimOrphanedCheckout still reclaims normally when callerCwd is unrelated to the checkout (regression) (34.793625ms)
...
ℹ tests 37
ℹ suites 0
ℹ pass 37
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 1979.919181
```

`rg -n 'live session|isLiveSessionWorktree' -i src/runner/worktree.mjs`
matched (the `LIVE SESSION GUARD` comment and error message).
