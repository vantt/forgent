# Iron Law evidence — `tsk-4fg`

Per `docs/history/tsk-5t3-iron-law-evidence-contract/CONTEXT.md` D2/D3:
`classifyIronLaw` (`src/evolve/iron-law.mjs`) against the item's final diff
(`changedFiles`, `src/runner/merge.mjs`) returned:

```json
{"required":true,"matchedFlags":[],"matchedModules":["bin/fgos.mjs"]}
```

`bin/fgos.mjs` is a self-modifying module, matched by module list alone (no
risk-keyword flags matched).

## Test command

```
node --test --test-name-pattern="child-view gate|childProgress|top-level row|awaiting-human child" test/cli/fgos.test.mjs
```

(the new tests this item added to `test/cli/fgos.test.mjs`, isolated by
name pattern from the full item verify command `node --test
test/cli/fgos.test.mjs && npm test`, which also passed in full — see
`docs/history/execution-fanout/CONTEXT-tsk-4fg.md`/`plan-tsk-4fg.md` for
the full item record.)

## Before (red) — pre-implementation `bin/fgos.mjs` (commit `d731c58`)

`bin/fgos.mjs` was temporarily swapped to its pre-implementation content
(`git show d731c58:bin/fgos.mjs`), leaving the already-committed test file
(with this item's new tests) unchanged, then the command above was run:

```
ℹ tests 4
ℹ pass 2
ℹ fail 2
```

The 2 failures were the two tests that actually exercise the new behavior
(the filter-drops-a-visible-child's-children-and-badges-the-parent case,
and the awaiting-human-child-is-never-hidden case) — both failed exactly
as expected against code that does not yet filter or badge anything:

```
✖ list by default drops a child whose parent is visible, and badges the parent with childProgress
  AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
  + actual - expected
  +   { ... status: 'doing', ... title: 'Child B', ... }
  - undefined
  (assert.equal(work['child-b'], undefined) failed -- child-b was still visible)

✖ list by default never hides an awaiting-human child, even when its parent is visible
  AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
  + actual - expected
  + undefined
  - { done: 0, total: 1 }
  (assert.deepEqual(work['root-item'].childProgress, {done:0,total:1}) failed --
  no childProgress field existed yet)
```

The other 2 (orphan-fallback, `--all` untouched) are regression guards
whose expected behavior already held before this item's change — they are
not meant to be red-before, only to stay green after (confirmed below).

## After (green) — post-implementation `bin/fgos.mjs` (commit `da036a2`)

`bin/fgos.mjs` restored to the implementation commit (`git status` showed
no diff against HEAD after restoring), then the same command re-run:

```
ℹ tests 4
ℹ pass 4
ℹ fail 0
```

All four pass, including the two that were red above. The item's full
verify command (`node --test test/cli/fgos.test.mjs && npm test`) also
passed in full separately (2731 pass / 5 skipped / 0 fail).
