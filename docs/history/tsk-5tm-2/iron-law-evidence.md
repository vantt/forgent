# Iron Law evidence — tsk-5tm-2

`classifyIronLaw` result against the real committed diff (`trunk...fgw/tsk-5tm-2`):

```json
{"required":true,"matchedFlags":[],"matchedModules":["src/runner/dispatch.mjs"]}
```

## Test command

```bash
npm test
```

(Full suite: 3243/3248 pass, 5 pre-existing skips unrelated to this item.
Narrower repro below scopes to `test/runner/dispatch.test.mjs`, 177/177.)

## Shape of this change

Same shape as `tsk-5tm-1` (D1): a retirement, not a bug fix. The real
before/after contrast swaps the **test file** back to its pre-fix
committed content and runs it against the real, already-fixed tree
(`dispatch.mjs` + `.fgos/config.json` on main, both already committed) —
the old test's own assertions (pinned to the `gather` capacity existing,
and to `for: 'gather'` being a valid enum value) genuinely fail against
reality once `gather` is retired.

## Failing-before transcript

`test/runner/dispatch.test.mjs` swapped to its pre-tsk-5tm-2 committed
content (`git show 7129ba1f:test/runner/dispatch.test.mjs`, the tsk-5tm-1
merge commit), full suite run against the real (already-fixed)
`src/runner/dispatch.mjs` and main's committed `.fgos/config.json`:

```
✖ the committed .fgos/config.json runner section declares the gather capacity (tsk-28o): ...
  AssertionError [ERR_ASSERTION]: capacities.gather must exist

✖ loadRunnerConfig accepts a "capacities.<id>" entry with a valid carries value
  Actual message: "runner config (.../carries-ok.json capacities.gather) "for" must be
  one of judge, got: "gather"."

✖ decideCapacityCli resolves purpose-based (--for) to the same result a positional
  capacityId would, plus the resolved capacityId
  Error [RunnerConfigError]: runner config (.../.fgos/config.json#runner
  capacities.gather) "for" must be one of judge, got: "gather".
      at validateCapacityShape (src/runner/dispatch.mjs:493:11)

✖ resolveCapacityCli resolves purpose-based (--for) to the same command a positional
  capacityId would, plus the resolved capacityId; carries repo-content clears the gate
  Error [RunnerConfigError]: runner config (.../.fgos/config.json#runner
  capacities.gather) "for" must be one of judge, got: "gather".
      at validateCapacityShape (src/runner/dispatch.mjs:493:11)

ℹ tests 177
ℹ pass 173
ℹ fail 4
```

All 4 failures trace to the exact 2 real effects of this item: the
committed config no longer has a `gather` capacity, and `CAPACITY_PURPOSES`
no longer accepts `'gather'` as a valid `for` value — `validateCapacityShape`
(dispatch.mjs:493) is the real code enforcing the second one. The other 173
tests (including the purpose-resolution mechanism tests, still fixtured
with `for: 'gather'` in this OLD test file) pass unaffected — confirming
`resolveCapacityIdForPurpose` itself is untouched by this item, only the
capacity/enum data it operates over changed.

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

`git status --short` showed only the expected `.fgos/*` deletions (ADR0020
worktree artifact, never real) before this passing run — confirming it ran
against the real committed tree, not a leftover working-tree edit. Full
`npm test` (3243/3248, 5 pre-existing unrelated skips) also green on the
same committed tree.
