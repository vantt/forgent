# tsk-652 — Iron Law evidence

`classifyIronLaw` result (against the real committed diff, `bin/fgos.mjs`
ceff25a6):

```json
{"required":true,"matchedFlags":[],"matchedModules":["bin/fgos.mjs"]}
```

## Test command

```
node --test test/setup/uninstall-wiring.test.mjs test/setup/self-uninstall-spike.test.mjs
```

## Failing-before (old `bin/fgos.mjs`, commit `b1e8e111`, new test already in place)

```
✖ tsk-652: fgos uninstall --yes --remove-package reports "skipped", never a false "removed", when this copy is not visible under npm's own global node_modules
  AssertionError [ERR_ASSERTION]: must never claim it attempted removal when npm never had this package
  true !== false
ℹ tests 2
ℹ pass 1
ℹ fail 1
```

The one new false-success regression test fails against the old code; the
pre-existing real-npm-install spike test still passes (proving the new
test isolates exactly the false-success gap, not something else).

## Passing-after (real fix restored)

```
ℹ tests 8
ℹ pass 8
ℹ fail 0
```

(Full scoped verify — `node --test test/setup/uninstall-wiring.test.mjs
test/setup/self-uninstall-spike.test.mjs`, the item's own `verify`
command — confirmed clean before `fgos return`.)
