# Iron Law evidence — tsk-1ug

`fgos rollup` reports a goalTier item's `targets`, not just its `children`.

## Classification

`classifyIronLaw` against the real committed diff (`changedFiles`,
`src/runner/merge.mjs`, `trunk...fgw/tsk-1ug`):

```json
{"required":true,"matchedFlags":[],"matchedModules":["bin/fgos.mjs"]}
```

Triggered by the touched module, not by a description flag.

## Test command

The item's own recorded `verify`, run exactly as recorded:

```
node --test test/cli/fgos.test.mjs && npm test
```

Result: `tests 571 / pass 571 / fail 0` for the CLI suite, and
`tests 2631 / pass 2626 / fail 0 / skipped 5` for `npm test`.

## Failing-test-first proof

The four new assertions were run against the **pre-change** implementation
by restoring `bin/fgos.mjs` from `HEAD~1` while keeping the new tests, then
restoring the implementation. Both transcripts are the real command output.

### Before (pre-change `bin/fgos.mjs`, new tests present)

```
$ node --test --test-name-pattern="rollup" test/cli/fgos.test.mjs
✔ rollup on a root with n children, k done, prints k/n and lists every child with its own status, exit 0 (186.456609ms)
✔ rollup on an item with no children returns 0/0 and an empty children list, exit 0, no throw (174.410678ms)
✔ rollup on a nonexistent id is rejected as validation (not-found), exit 4 (171.470105ms)
✔ rollup with no id at all is rejected as validation, exit 4 (119.672893ms)
✔ rollup never mutates state: no event is appended and no children of an unrelated item are counted (242.189727ms)
✖ rollup on a milestone counts its targets in targetDoneCount/targetTotalCount and leaves the children counts at 0 (182.679567ms)
✖ rollup on an item with no targets reports an empty targets array and 0/0, leaving the children counts untouched (175.613705ms)
✖ rollup reports a target id that matches no work item as a null-title/null-status row, counted as not done, exit 0 (183.022001ms)
✖ rollup on an item carrying both children and targets keeps the two count pairs independent (178.600012ms)
✔ rollup reading targets never mutates state: no event is appended (180.948655ms)
ℹ tests 10
ℹ pass 6
ℹ fail 4
✖ failing tests:
✖ rollup on a milestone counts its targets in targetDoneCount/targetTotalCount and leaves the children counts at 0 (182.679567ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
    actual: undefined,
    expected: 2,
✖ rollup on an item with no targets reports an empty targets array and 0/0, leaving the children counts untouched (175.613705ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
    actual: undefined,
    expected: 0,
✖ rollup reports a target id that matches no work item as a null-title/null-status row, counted as not done, exit 0 (183.022001ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
    actual: undefined,
    expected: [ { id: 'target-a', title: 'Target A', status: 'done' }, { id: 'no-such-target', title: null, status: null } ],
✖ rollup on an item carrying both children and targets keeps the two count pairs independent (178.600012ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
    actual: undefined,
    expected: 1,
```

`actual: undefined` on every failure is the point: the pre-change
`collectRollupData` emitted no `targets`/`targetDoneCount`/`targetTotalCount`
at all.

The fifth new test — "rollup reading targets never mutates state" — passes
in both transcripts by design. It asserts the read-only contract, which was
never broken; it exists to prove the new code path did not introduce a
write.

### After (implementation restored)

```
$ node --test --test-name-pattern="rollup" test/cli/fgos.test.mjs
✔ rollup on a root with n children, k done, prints k/n and lists every child with its own status, exit 0 (198.727438ms)
✔ rollup on an item with no children returns 0/0 and an empty children list, exit 0, no throw (180.562181ms)
✔ rollup on a nonexistent id is rejected as validation (not-found), exit 4 (174.759733ms)
✔ rollup with no id at all is rejected as validation, exit 4 (117.352637ms)
✔ rollup never mutates state: no event is appended and no children of an unrelated item are counted (244.900053ms)
✔ rollup on a milestone counts its targets in targetDoneCount/targetTotalCount and leaves the children counts at 0 (183.510202ms)
✔ rollup on an item with no targets reports an empty targets array and 0/0, leaving the children counts untouched (183.233081ms)
✔ rollup reports a target id that matches no work item as a null-title/null-status row, counted as not done, exit 0 (174.645625ms)
✔ rollup on an item carrying both children and targets keeps the two count pairs independent (177.836017ms)
✔ rollup reading targets never mutates state: no event is appended (180.957905ms)
ℹ tests 10
ℹ pass 10
ℹ fail 0
```

The five pre-existing rollup tests (the first five rows) pass **unmodified**
in both transcripts — that is the no-regression proof for `doneCount`/
`totalCount`/`children`, which this change deliberately leaves untouched.
