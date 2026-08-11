# Iron Law evidence — tsk-24t

`classifyIronLaw` result against the real committed diff (`trunk...fgw/tsk-24t`):

```json
{"required":true,"matchedFlags":[],"matchedModules":["bin/fgos.mjs"]}
```

Matched via the `bin/fgos.mjs` exact-path rule (`src/evolve/iron-law.mjs`).

## Verify command

```
node --test test/cli/fgos.test.mjs test/runner/main-checkout-lock.test.mjs && npm test
```

## RED — pre-fix (`bin/fgos.mjs` at commit `3ac10008`, the commit
immediately before this item's implementation landed)

```
$ node --test --test-name-pattern="string-identity" test/cli/fgos.test.mjs
✖ unlock: string-identity lock within TTL -- still refuses (D5 fail-closed, unchanged), but never claims "live session" (tsk-24t)
  AssertionError: The input was expected to not match /live session/. Input:
  'fgos: unlock: main checkout lock is held by a live session (some-writer-session-id, held 0s, expires in 2m59s) -- refusing to clear it.\n'
ℹ tests 1
ℹ pass 0
ℹ fail 1
```

## GREEN — post-fix (working tree restored to the real committed state,
`git diff --stat` against the commit confirmed empty before this run)

```
$ node --test test/cli/fgos.test.mjs --test-name-pattern="unlock"
ℹ tests 6
ℹ pass 6
ℹ fail 0

$ node --test test/runner/main-checkout-lock.test.mjs
ℹ tests 45
ℹ pass 45
ℹ fail 0
```

Full `npm test` was also run clean against the final committed state
before `fgos return`.
