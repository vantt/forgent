# Iron Law evidence — tsk-x5r

## classifyIronLaw result

```json
{"required": true, "matchedFlags": [], "matchedModules": ["bin/fgos.mjs"]}
```

Genuine module match: `bin/fgos.mjs`'s `return` verb (`excludeFgosPaths`,
wired at both `footprintDiffHits` call sites).

Full changed-file set: `bin/fgos.mjs`, `test/cli/fgos.test.mjs`,
`test/runner/loop.test.mjs` — implementation commit `5186825`, parent
commit `f1bc886`.

## Part 1 — the BLOCKER fix (test/runner/loop.test.mjs)

Real evidence captured directly against the live main checkout, BEFORE
any fix in this item was written (this is what surfaced the blocker in
the first place, not a reconstruction):

```
$ node --test test/runner/loop.test.mjs   # on main, pre-fix
✖ runOnce logs the "<capacityId> — <provider> — <model>" announce line and appends a matching capacity.dispatch audit event
  AssertionError: Expected values to be strictly deep-equal:
  + actual - expected
    {
  +   baseCommit: 'fcd7e09fe3ab897c82a449e21028a103590e5e17',
      capacityId: 'fgos-coding-implement',
  +   headRef: 'fgw/item-announce',
      ...
    }
ℹ tests 52
ℹ pass 51
ℹ fail 1
```

After the fix (shape assertions instead of exact-value `deepEqual`):

```
$ node --test test/runner/loop.test.mjs
ℹ tests 52
ℹ pass 52
ℹ fail 0
```

Also ran the full suite once, unscoped, specifically because the root
cause of the blocker was a too-narrow verify scope on the prior item:

```
$ node --test 'test/**/*.test.mjs'
ℹ tests 2649
ℹ pass 2644
ℹ fail 0
ℹ skipped 5
```

## Part 2 — footprintDiffHits `.fgos/` exemption (bin/fgos.mjs)

Real execution: a temporary git worktree checked out at `f1bc886` (the
commit immediately before `5186825`), with only the NEW test content
(`git show 5186825:test/cli/fgos.test.mjs`) copied in against the OLD
`bin/fgos.mjs` (no `excludeFgosPaths` yet):

```
$ node --test --test-name-pattern="tsk-x5r self-exempt" test/cli/fgos.test.mjs
✖ return: a .fgos/* change bundled into the item's own commit ... is exempt from footprintDiffHits (tsk-x5r self-exempt)
ℹ tests 1
ℹ pass 0
ℹ fail 1
```

Same scratch worktree, `bin/fgos.mjs` replaced with the `5186825` version:

```
$ node --test --test-name-pattern="tsk-x5r self-exempt" test/cli/fgos.test.mjs
✔ return: a .fgos/* change bundled into the item's own commit ... is exempt from footprintDiffHits (tsk-x5r self-exempt)
ℹ tests 1
ℹ pass 1
ℹ fail 0
```

The scratch worktree used to capture Part 2 was created and removed for
this evidence run only (`git worktree add`/`remove --force` against the
already-committed `f1bc886`/`5186825` commits) — no working-tree state
was altered.
