# Iron Law evidence — tsk-198

`classifyIronLaw` result against the real committed diff (`trunk...fgw/tsk-198`):

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": ["src/runner/merge.mjs"]
}
```

Verify command: `node --test test/runner/merge.test.mjs`

## Failing-test-first proof

The new test — `'mergeRunnerItem merges cleanly when a .fgos/ path is
absent at branchHeadAtTake, absent on branch, and present on main
(tsk-198)'` — run against `src/runner/merge.mjs` at its state immediately
before this item's fix (tsk-4s6's own committed version):

```
=== PRE-FIX (should FAIL) ===
✖ mergeRunnerItem merges cleanly when a .fgos/ path is absent at branchHeadAtTake, absent on branch, and present on main (tsk-198) (89.392421ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  + actual - expected

  + 'fgos-write-rejected'
  - 'merged'

      at TestContext.<anonymous> (file:///.../test/runner/merge.test.mjs:1773:10)
```

Same test, `src/runner/merge.mjs` restored to the real fix
(`isUnchangedSinceBranchHeadAtTake` widened to `git diff --quiet`):

```
=== POST-FIX (should PASS) ===
✔ mergeRunnerItem merges cleanly when a .fgos/ path is absent at branchHeadAtTake, absent on branch, and present on main (tsk-198) (103.926963ms)
ℹ tests 1
ℹ pass 1
ℹ fail 0
```

Full suite, post-fix (`node --test test/runner/merge.test.mjs`):

```
ℹ tests 104
ℹ suites 0
ℹ pass 104
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
```

## Two rejected test shapes, kept as evidence of why the accepted shape is the real bug

1. **A path main creates for the first time after the branch's own fork**
   (never existing at the merge-base at all). Passed identically with and
   without the fix — git's merge never stages a diff for a path only one
   side ever knew about, so it exercised nothing.
2. **The path exists at the merge-base, the branch deletes it, AND main
   also modifies its own content after the fork.** A genuine
   modify(main)/delete(branch) `CONFLICT` — git always throws for this
   shape, confirmed empirically (both in this synthetic test and by
   directly reproducing the real merge against the live repo's
   `fgw/tsk-25b`). This fix's restore loop only runs after a *clean*
   merge, so it never reaches this case at all — failed even with the fix
   applied, for the wrong reason.

The accepted shape — path exists at merge-base, branch deletes it before
`branchHeadAtTake`, main leaves it *completely untouched* afterward — is
a one-sided deletion git auto-resolves cleanly with no conflict, but
still stages as a diff against `HEAD`. Confirmed by directly reproducing
the real merge against the live repo (`git merge --no-commit --no-ff
fgw/tsk-25b` from `main`, aborted immediately after inspection): the real
`.fgos/events.jsonl.backup-tsk-1lv-4-dedup-fix-20260817` path showed
exactly this signature — staged as a clean `D` (deleted), never appearing
in the conflicted-paths list — while 6 other `.fgos/` paths in that same
merge attempt (all genuinely modified on both sides) DID throw real
modify/delete conflicts, resolved separately by `resolveFgosOnlyConflict`
(their own `merge=union` coverage), unrelated to this item's fix.
