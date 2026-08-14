# tsk-2xj — Iron Law evidence

`classifyIronLaw` result (against the real committed diff, `bin/fgos.mjs`
6beffe90):

```json
{"required":true,"matchedFlags":[],"matchedModules":["bin/fgos.mjs"]}
```

`bin/fgos.mjs` is a self-modifying module (the tool editing its own CLI
entry point) — the gate requires failing-test-first proof before this diff
can land.

## Test command

```
node --test test/setup/dir-resolution.test.mjs
```

## Failing-before (old `bin/fgos.mjs`, commit `b1e8e111`, new test file already in place)

Restored `bin/fgos.mjs` to its pre-fix content (`git show b1e8e111:bin/fgos.mjs`),
ran the new test file against it, then restored the real fix. Real output:

```
✖ tsk-2xj: fgos doctor run bare from a linked worktree reports the same checks as running directly at the main checkout (427.558528ms)
✖ tsk-2xj: fgos doctor --fix run bare from a linked worktree never materializes .fgos/ inside the worktree (190.24357ms)
✖ tsk-2xj: fgos setup run bare from a linked worktree writes to the main checkout, never the worktree (140.718477ms)
✖ tsk-2xj: fgos uninstall --yes run bare from a linked worktree unwires the main checkout's git hooks, not the worktree's (145.080948ms)
ℹ tests 4
ℹ pass 0
ℹ fail 4
```

Representative failure detail (setup — the unconditional-write case, the
most serious of the four per RESEARCH.md round 1):

```
AssertionError [ERR_ASSERTION]: setup run bare from a worktree must never materialize .fgos/ INSIDE that worktree (ADR0020) -- setup writes unconditionally, so this is the live violation RESEARCH.md round 1 confirmed
    actual: false
    expected: true
```

And uninstall — proving `repoRoot` really did resolve to the worktree, not
the main checkout:

```
AssertionError [ERR_ASSERTION]: precondition: setup wired the main checkout's hooksPath
  + actual - expected
  + '/tmp/dir-resolution-uninstall-wt-lQNKNG/.githooks'
  - '/tmp/dir-resolution-uninstall-main-oUthH7/.githooks'
```

All 4 of the 4 new tests fail against the old code — every one of them
genuinely exercises the fix, none is a false proof.

## Passing-after (real fix restored)

```
ℹ tests 116
ℹ pass 116
ℹ fail 0
```

(Full scoped verify — `node --test test/setup/dir-resolution.test.mjs
test/setup/checks.test.mjs test/cli/fgos-setup.test.mjs
test/setup/uninstall-wiring.test.mjs`, the item's own `verify` command —
confirmed clean before `fgos return`.)
