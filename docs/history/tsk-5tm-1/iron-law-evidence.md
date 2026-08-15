# Iron Law evidence — tsk-5tm-1

`classifyIronLaw` result against the real committed diff (`trunk...fgw/tsk-5tm-1`):

```json
{"required":true,"matchedFlags":[],"matchedModules":["src/runner/dispatch.mjs"]}
```

## Test command

```bash
node --test test/runner/dispatch.test.mjs
```

## Shape of this change

Unlike a bug-fix item (new test proves old code was wrong, passes on the
fix), this item retires dead code (D1: the `needs` presence gate inside
`resolveExecutorConfig` never ran for 2/3 real capacities, and added no
real signal for the third beyond the OS's own ENOENT). The 2 tests that
exercised that gate's own behavior were removed along with it — they
would only pass "for the wrong reason" (trivial `doesNotThrow` with no
gate left underneath). The real before/after contrast below instead swaps
the **test file** back to its pre-fix committed content and runs it
against the real, already-fixed tree (`dispatch.mjs` + `.fgos/config.json`
on main, both already committed) — the old test's own assertion
(`capacity.needs === 'prompt-completion'`) genuinely fails against reality
once the field is gone, proving the change is real and detected.

## Failing-before transcript

`test/runner/dispatch.test.mjs` swapped to its pre-tsk-5tm-1 committed
content (`git show b318a7b6:test/runner/dispatch.test.mjs`), full suite
run against the real (already-fixed) `src/runner/dispatch.mjs` and main's
committed `.fgos/config.json`:

```
✖ the committed .fgos/config.json runner section declares the gather capacity (tsk-28o): for "gather", needs "prompt-completion", carries "repo-content" (D1, gather-capacity-purpose-binding CONTEXT.md), kind cli, allowCrossProvider true, well-formed {prompt}/{model} args (2.854023ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  + actual - expected

  + undefined
  - 'prompt-completion'

      at TestContext.<anonymous> (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-5tm-1-C1C62T/test/runner/dispatch.test.mjs:657:10)
      ...

ℹ tests 179
ℹ pass 178
ℹ fail 1
```

(The other 178 — including the 2 tests this item's real commit removes,
`...declaring needs+for through capability match...` and
`...needs-declaring capacity when a second provider...` — passed even
against the pre-fix test file, confirming they'd become vacuous
`doesNotThrow` checks with no gate left to exercise: safe to remove, not
silently broken.)

## Passing-after transcript

`test/runner/dispatch.test.mjs` restored to its committed (post-fix)
content (`git checkout -- test/runner/dispatch.test.mjs`), full suite:

```
ℹ tests 177
ℹ suites 0
ℹ pass 177
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

`git status --short`/`git diff --stat HEAD` showed only the expected
`.fgos/*` deletions (ADR0020 worktree artifact, never real) before this
passing run — confirming it ran against the real committed tree, not a
leftover working-tree edit.
