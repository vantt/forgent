# tsk-4hj — Iron Law evidence

`classifyIronLaw` result on this item's real committed diff
(`changedFiles(repoRoot, item)` against trunk):

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": ["bin/fgos.mjs", "src/runner/merge.mjs"]
}
```

## Failing-test-first proof

All five of this item's new regression tests, run against the pre-fix
version of `src/runner/merge.mjs` and `bin/fgos.mjs` (`git show
HEAD~2:<path>` — HEAD~2 relative to the final implementation state,
before both the fix commit and its own follow-up test correction —
swapped in temporarily, then restored; working tree confirmed clean
against `HEAD` afterward):

```
✔ catchup accepts a blocked reason of merge-blocked-other-item as a valid precondition (tsk-4hj D2, mirrors tsk-18a's own precedent for merge-failed-unclassified) (442.642375ms)
✖ approve of a runner item is blocked (reason merge-blocked-other-item), not misclassified as a conflict, when the main checkout already has an unrelated item's pre-existing MERGE_HEAD -- and that other item's merge state is left untouched (485.610783ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  + actual - expected
  + 'merge-conflict'
  - 'merge-blocked-other-item'

✖ approve of a root item, whose merge into main hits a pre-existing MERGE_HEAD from an unrelated item, parks with reason merge-blocked-other-item (root→main call site, tsk-4hj D2) (460.21493ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  + actual - expected
  + 'merge-conflict'
  - 'merge-blocked-other-item'

✖ sync-root never reports outcome "synced" when mergeRunnerItem returns an outcome it does not explicitly handle -- proves the defensive guard closes the false-success gap D4 found (350.072966ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  + actual - expected
  + 'merge-conflict'
  - 'merge-blocked-other-item'

✖ mergeRunnerItem reports "merge-blocked-other-item" (not "conflict") and never touches a pre-existing MERGE_HEAD from a different branch (55.182529ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  + actual - expected
  + 'conflict'
  - 'merge-blocked-other-item'
```

(The `catchup accepts ...` case initially passed pre-fix too — its first
version asserted the wrong exit code (`2` instead of the real `4`
validation refusal) and proved nothing. Corrected in a same-item
follow-up commit; the corrected version fails pre-fix as expected:)

```
✖ catchup accepts a blocked reason of merge-blocked-other-item as a valid precondition (tsk-4hj D2, mirrors tsk-18a's own precedent for merge-failed-unclassified) (490.199953ms)
  AssertionError [ERR_ASSERTION]: fgos: catchup: work "catchup-blocked-other-item" is blocked for reason "merge-blocked-other-item" — catchup only resolves a merge-related park (merge-conflict/verify-fail-post-merge/verify-timeout-post-merge/integration-drift/merge-failed-unclassified); use take/return for a manual rework instead.
      actual: 4,
      expected: 4,
      operator: 'notStrictEqual',
```

Same five tests, same repo, post-fix (`src/runner/merge.mjs`/
`bin/fgos.mjs` at `HEAD`):

```
✔ approve of a runner item is blocked (reason merge-blocked-other-item), not misclassified as a conflict, when the main checkout already has an unrelated item's pre-existing MERGE_HEAD -- and that other item's merge state is left untouched
✔ approve of a root item, whose merge into main hits a pre-existing MERGE_HEAD from an unrelated item, parks with reason merge-blocked-other-item (root→main call site, tsk-4hj D2)
✔ catchup accepts a blocked reason of merge-blocked-other-item as a valid precondition (tsk-4hj D2, mirrors tsk-18a's own precedent for merge-failed-unclassified)
✔ sync-root never reports outcome "synced" when mergeRunnerItem returns an outcome it does not explicitly handle -- proves the defensive guard closes the false-success gap D4 found
✔ mergeRunnerItem reports "merge-blocked-other-item" (not "conflict") and never touches a pre-existing MERGE_HEAD from a different branch
ℹ tests 5
ℹ pass 5
ℹ fail 0
```

## Full item verify command (step 3, already run)

```
node --test test/runner/merge.test.mjs test/cli/fgos.test.mjs
```

Result: 648 tests, 0 fail.
