# Iron Law evidence: tsk-2rf

`classifyIronLaw` result on this item's committed diff (`bin/fgos.mjs`,
`src/runner/lock-wait.mjs`, plus their tests and the two `docs/history/`
files):

```json
{"required":true,"matchedFlags":[],"matchedModules":["bin/fgos.mjs","src/runner/lock-wait.mjs"]}
```

Test command: `node --test test/runner/lock-wait.test.mjs test/cli/fgos.test.mjs`
(both files are part of the full `npm test` run, which passed 2376/2381,
5 skipped, 0 failed, after this item's changes).

## Failing-before / passing-after proof

For each matched module, the two source files were temporarily reverted to
their pre-implementation state (`git checkout d15bb20~1 -- src/runner/
lock-wait.mjs bin/fgos.mjs`, the commit immediately before this item's own
`feat(tsk-2rf)` commit) and the new tests re-run against that reverted
code, then the fix was restored (`git checkout HEAD -- ...`) and the same
tests re-run to confirm green.

### `bin/fgos.mjs` — `parseWaitFlags` cap (D3)

**Before** (reverted to pre-fix `bin/fgos.mjs`):

```
✖ take --wait rejects a value above the 900000ms (15 min) cap -- tsk-2rf D3 (287.712598ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  0 !== 4
      at TestContext.<anonymous> (file:///.../test/cli/fgos.test.mjs:7962:10)
```

**After** (restored fix):

```
✔ take --wait rejects a value above the 900000ms (15 min) cap -- tsk-2rf D3 (287.21244ms)
```

### `src/runner/lock-wait.mjs` — explicit `--wait` as true ceiling (D2)

**Before** (reverted to pre-fix `lock-wait.mjs`):

```
✖ withLockRetry: explicit waitMs past remainingTtlMs still gives up once its own (larger) budget is spent (552.216423ms)
  AssertionError [ERR_ASSERTION]: must have waited out the full explicit waitMs, past the remainingTtlMs snapshot (took 551ms)
      at TestContext.<anonymous> (file:///.../test/runner/lock-wait.test.mjs:124:10)
```

(The old, capped budget formula `Math.min(remainingTtlMs=300,
waitMs=900)` gives up at ~550ms — the `remainingTtlMs` snapshot plus
`BOUNDARY_GRACE_MS` — instead of honoring the full explicit 900ms.)

**After** (restored fix):

```
✔ withLockRetry: explicit waitMs past remainingTtlMs still gives up once its own (larger) budget is spent (1150.912147ms)
```

(Now correctly waits out the full explicit 900ms + grace, past the
300ms `remainingTtlMs` snapshot.)
