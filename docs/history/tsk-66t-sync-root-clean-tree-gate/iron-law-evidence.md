# Iron Law evidence: tsk-66t (sync-root clean-tree gate)

`classifyIronLaw({ filesChanged: changedFiles(repoRoot, item), description: item.description })`
against the real committed diff (`fgw/tsk-66t` vs `main`) returned:

```json
{
  "required": true,
  "matchedFlags": [],
  "matchedModules": ["bin/fgos.mjs"]
}
```

`bin/fgos.mjs` is a self-modifying file this repo's Iron Law tracks —
required regardless of matched keyword flags.

## Test command

```
node --test --test-name-pattern="tsk-66t" test/cli/fgos.test.mjs
```

(the item's own broader `verify`, `node --test test/cli/fgos.test.mjs &&
npm test`, ran green in full separately — see the item's returned state.)

## Failing-before transcript (bin/fgos.mjs reverted to the pre-fix commit,
new tests kept)

```
✖ sync-root on a no-parent root refuses when the shared main checkout
  carries an uncommitted change on a path the root itself touches, exit 4,
  no merge lands (tsk-66t) (348.122859ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  1 !== 4
      at test/cli/fgos.test.mjs:6263:10

✖ merge next on a blockedOnSync root whose sync-root attempt hits a dirty
  main checkout: picked is the root id (never null), blocked: dirty-tree,
  main untouched (tsk-66t) (516.58938ms)
  AssertionError [ERR_ASSERTION]: merge next itself must not exit non-zero
  on a blocked sync: fgos: no runner config found — detected "claude" on
  PATH; wrote a default (executor: claude) at
  /tmp/fgos-cli-NBivWQ/.fgos/config.json#runner; edit .fgos/config.json by
  hand to change.
  fgos: Cannot read properties of undefined (reading 'output')

  1 !== 0
      at test/cli/fgos.test.mjs:8612:10

ℹ tests 2
ℹ pass 0
ℹ fail 2
```

The second failure is the exact live-reproduced crash
(`Cannot read properties of undefined (reading 'output')`) already logged
as a decision on this item from `tsk-3v2`'s own sync-root landing —
reproduced here mechanically from a clean fixture, confirming the root
cause end to end: with no clean-tree gate, `mergeRunnerItem` returns
`{outcome:'merge-failed-unclassified'}` (no `.check` field) and
`runAndReport`'s success path unconditionally reads `result.check.output`.

## Passing-after transcript (fix restored)

```
✔ sync-root on a no-parent root refuses when the shared main checkout
  carries an uncommitted change on a path the root itself touches, exit 4,
  no merge lands (tsk-66t) (423.551156ms)
✔ merge next on a blockedOnSync root whose sync-root attempt hits a dirty
  main checkout: picked is the root id (never null), blocked: dirty-tree,
  main untouched (tsk-66t) (487.313287ms)

ℹ tests 2
ℹ pass 2
ℹ fail 0
```
