# Iron Law evidence: tsk-577

Per `tsk-5t3`'s contract (D2/D3): `classifyIronLaw` on this item's final
diff (post-implementation-commit, `4c31014`) returned `required: true` —
`matchedModules: ["src/runner/loop.mjs"]` (the runner loop is
self-modifying: this item edits `startupReap`'s own branch-prune step),
`matchedFlags: []`.

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": ["src/runner/loop.mjs"]
}
```

## Failing-test-first proof

Test command: `node --test test/state/cleanup-harness.test.mjs test/runner/loop.test.mjs`
(the item's own locked `verify`).

Both files were reverted to their pre-implementation content (`git show
HEAD~1:<path>`, i.e. immediately before this item's implementation commit)
while the new test fixtures stayed in place, to prove each new fixture
actually exercises the bug this item closes.

### `src/state/cleanup-harness.mjs` reverted, new fixtures in place

Real transcript (`node --test test/state/cleanup-harness.test.mjs`):

```
✖ checkMergeStillResolves: a leaf resolves ok:true via HEAD fallback when its root branch was already pruned (tsk-577) (53.733258ms)
  AssertionError [ERR_ASSERTION]: expected false to be true
    ...

✖ checkMergeStillResolves: still ok:false when the root branch is missing AND the content genuinely never reached HEAD (tsk-577 regression guard) (31.825956ms)
  AssertionError [ERR_ASSERTION]: The input did not match the regular expression /not an ancestor of HEAD either/. Input:

  'commit e957ec255b638f2bd640448b824e940b1ca62cf1 is no longer reachable from fgw/root-z — the merge may have been force-pushed away or history rewritten'

ℹ tests 23
ℹ pass 21
ℹ fail 2
```

### `src/runner/loop.mjs` reverted, new fixtures in place

Real transcript (`node --test test/runner/loop.test.mjs`):

```
✖ startup reap: a zero-ahead root branch with an open (non-done/wontfix) leaf descendant is kept, not pruned (tsk-577) (38.549561ms)
  AssertionError ...
      at TestContext.<anonymous> (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-577-imcY4g/test/runner/loop.test.mjs:1111:10)

ℹ tests 52
ℹ pass 51
ℹ fail 1
```

(the sibling regression-guard fixture — an already-`done` descendant still
gets pruned normally — passed against the OLD code too, as expected: it
proves the fix does not change the pre-existing correct behavior, not the
new one.)

## Passing-after proof

Both files restored to their fixed content (the actual committed diff).
Real transcript (`node --test test/state/cleanup-harness.test.mjs
test/runner/loop.test.mjs`, the item's own full locked `verify`):

```
ℹ tests 75
ℹ suites 0
ℹ pass 75
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```
