# Iron Law evidence — tsk-483

`classifyIronLaw` result against the real committed diff (`trunk...fgw/tsk-483`):

```json
{"required":true,"matchedFlags":[],"matchedModules":["bin/fgos.mjs"]}
```

Matched via the `bin/fgos.mjs` exact-path rule (`src/evolve/iron-law.mjs`).

## Verify command

```
node --test test/cli/fgos.test.mjs test/cli/fgos-manifest.test.mjs && npm test
```

## RED — pre-fix (`bin/fgos.mjs` at commit `b374596c`, the commit
immediately before this item's implementation landed)

```
$ node --test --test-name-pattern="tsk-483" test/cli/fgos.test.mjs
✖ list --all --limit combined: scopes side-logs to the paged ids too (tsk-483 D2)
  actual: ['list-all-page-a', 'list-all-page-b'] !== expected: ['list-all-page-a']
✖ list default (no flags at all) scopes side-logs to only the open (non-done) ids
  actual: ['list-default-open', 'list-default-done'] !== expected: ['list-default-open']
ℹ tests 4
ℹ pass 2
ℹ fail 2
```

(The two other tsk-483 tests already passed pre-fix by coincidence:
`--limit` alone happened to leave only the paged item's own decision in
the fixture; the protected `--all --json` case is asserting the OLD,
unscoped behavior, which was already true. The 2 RED failures above are
the real, load-bearing proof.)

## GREEN — post-fix (working tree restored to the real committed state,
`git diff --stat` against the commit confirmed empty before this run)

```
$ node --test --test-name-pattern="^list" test/cli/fgos.test.mjs
ℹ tests 25
ℹ pass 25
ℹ fail 0
```

## Real measured improvement (against this repo's own live backlog)

```
$ node bin/fgos.mjs list --json --dir <repo> | wc -c
377194
$ node bin/fgos.mjs list --json --limit 5 --dir <repo> | wc -c
14979
```

25x reduction with `--limit 5`, vs. the pre-fix ~6% `--limit` savings the
item's own description measured.

Full `npm test` was also run clean against the final committed state
before `fgos return`.
