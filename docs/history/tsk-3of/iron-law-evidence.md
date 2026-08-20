Iron Law classification (`classifyIronLaw`, `src/evolve/iron-law.mjs`) against
commit `ddab9e4b` (`tsk-3of: reclaim wontfix worktrees and branches during
startup reap`):

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": ["src/runner/loop.mjs"]
}
```

Test command (the item's own `verify`): `node --test test/runner/loop.test.mjs`

## Failing-test-first proof

The two new tests added in `ddab9e4b`
(`test/runner/loop.test.mjs:1363-1406`) run against the PRE-fix
`src/runner/loop.mjs` (`git show HEAD~1:src/runner/loop.mjs`, temporarily
swapped in, then restored — `git status` confirmed clean/byte-identical to
`HEAD` afterward):

```
$ node --test --test-name-pattern "wontfix branch" test/runner/loop.test.mjs
✖ startup reap: a wontfix branch with real commits ahead and no open descendants is force-deleted (176.951248ms)
✔ startup reap: a wontfix branch with an open descendant is kept, not pruned (189.760202ms)
ℹ tests 2
ℹ pass 1
ℹ fail 1

✖ failing tests:

test at test/runner/loop.test.mjs:1363:1
✖ startup reap: a wontfix branch with real commits ahead and no open descendants is force-deleted (176.951248ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
  + actual - expected

  + []
  - [
  -   'fgw/wontfix-a'
  - ]

      at TestContext.<anonymous> (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-3of-n6epbQ/test/runner/loop.test.mjs:1380:10)
    generatedMessage: true,
    code: 'ERR_ASSERTION',
    actual: [],
    expected: [ 'fgw/wontfix-a' ],
    operator: 'deepStrictEqual',
```

The force-delete test genuinely red-lines against the old code (the wontfix
branch is never pruned pre-fix, matching the item's own confirmed bug). The
second test ("kept, not pruned") already passes pre-fix too — expected, not
a bug in the proof: pre-fix code already keeps any branch with commits
ahead regardless of status, so that assertion isn't a red/green
discriminator, it's a non-regression guard for the new conditional's
"else" path.

## Passing-after proof

Same two tests, against the real `HEAD` (post-fix) `loop.mjs`:

```
$ node --test --test-name-pattern "wontfix branch" test/runner/loop.test.mjs
✔ startup reap: a wontfix branch with real commits ahead and no open descendants is force-deleted (235.646748ms)
✔ startup reap: a wontfix branch with an open descendant is kept, not pruned (189.061293ms)
ℹ tests 2
ℹ pass 2
ℹ fail 0
```

Full item verify command, independently re-run:

```
$ node --test test/runner/loop.test.mjs
ℹ tests 69
ℹ pass 69
ℹ fail 0
```
