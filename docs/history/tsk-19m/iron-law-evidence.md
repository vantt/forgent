# Iron Law evidence — tsk-19m

## Classification

Result: `{"required":true,"matchedFlags":[],"matchedModules":["bin/fgos.mjs","src/runner/loop.mjs"]}`

Computed after the implementation commit landed, via `changedFiles` +
`classifyIronLaw` against the real `main...fgw/tsk-19m` diff.

Both matched modules are genuinely touched by this item:

- `bin/fgos.mjs` — `parseDiscoverCallerVerdict` gains the three optional
  classification flags, and the `discover` case validates them up front and
  applies the resulting patch after `resolveDiscovery` returns.
- `src/runner/loop.mjs` — `classificationPatchFromVerdict` moved down into
  `src/intake/discovery.mjs` (the engine module both discovery paths already
  import) and is re-exported here, so the two paths share one guard instead
  of the CLI growing a second copy of the rule.

The same diff also shows `docs/specs/work-state.md`, `src/state/replay.mjs`,
and `test/state/replay.test.mjs`. Those are not this item's changes: they
come from sibling `tsk-31lz`, this item's declared dependency, whose branch
was merged into this one before work started. `main` has not absorbed it
yet, so a `main...branch` diff still lists them.

## Failing-test-first proof

Test command (the item's own `verify` is `npm test`; this is the narrow
slice run first):

```
node --test --test-name-pattern="classification|--tier|--kind|--risk|out-of-vocabulary" test/cli/fgos-stage.test.mjs
```

### Before the fix — red

```
✖ discover --verdict clear with --tier/--kind/--risk applies the classification to the item (253.112068ms)
✖ discover applies only the classification fields actually passed, leaving the rest untouched (311.377814ms)
✔ discover --verdict unclear never applies classification — the same guard the headless path uses (301.473446ms)
✖ discover with an out-of-vocabulary --kind is rejected as validation (exit 4) before the item moves at all (196.751207ms)
✖ discover with an out-of-vocabulary --tier is rejected as validation (exit 4) before the item moves at all (204.765577ms)
✖ discover with a bare --risk (no value) is rejected as validation, exit 4 (195.362667ms)
```

Representative assertion from that run — the CLI exited `0` and ignored the
flag, where the test demands a clean `validation` refusal:

```
test at test/cli/fgos-stage.test.mjs:364:1
✖ discover with an out-of-vocabulary --tier is rejected as validation (exit 4) before the item moves at all (201.689793ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:

  0 !== 4

      at TestContext.<anonymous> (file:///home/vantt/projects/forgentX/.claude/worktrees/tsk-19m-Q5YB2b/test/cli/fgos-stage.test.mjs:369:10)
    actual: 0,
    expected: 4,
```

One of the six was green before the fix on purpose: `discover --verdict
unclear never applies classification` passes trivially today, because the
flags were ignored entirely. It is a regression guard for the guard's own
semantics (classification must never ride an unclear verdict), not a test of
new behavior, and it stays green after the fix for a different reason —
`classificationPatchFromVerdict` refuses the patch.

### After the fix — green

```
✔ discover --verdict clear with --tier/--kind/--risk applies the classification to the item (285.14575ms)
✔ discover applies only the classification fields actually passed, leaving the rest untouched (321.294213ms)
✔ discover --verdict unclear never applies classification — the same guard the headless path uses (323.655275ms)
✔ discover with an out-of-vocabulary --kind is rejected as validation (exit 4) before the item moves at all (268.351591ms)
✔ discover with an out-of-vocabulary --tier is rejected as validation (exit 4) before the item moves at all (271.010985ms)
✔ discover with a bare --risk (no value) is rejected as validation, exit 4 (252.990637ms)
```

The one-door claim gets its own test in `test/intake/discovery.test.mjs`,
which asserts `src/runner/loop.mjs`'s export IS `src/intake/discovery.mjs`'s
function rather than a copy of it:

```
✔ the headless sweep and the interactive verb read the SAME classification guard, not a copy of it (6.536647ms)
✔ assertCallerClassification refuses an out-of-vocabulary value and passes a valid one, without writing anything (0.303957ms)
✔ assertCallerClassification is a no-op on an unclear verdict, even one carrying a bad classification (0.073236ms)
```

## Item's own verify command

```
npm test
```

```
ℹ tests 2979
ℹ suites 0
ℹ pass 2974
ℹ fail 0
ℹ cancelled 0
ℹ skipped 5
ℹ todo 0
ℹ duration_ms 54626.41375
```

## Impact-analysis capability

`fgos tool query --capability impact-analysis --status present` reports
GitNexus `present`, so the Full rule applied — but the tool answered
`Target 'classificationPatchFromVerdict' not found` and
`Target 'parseDiscoverCallerVerdict' not found` for both edited symbols, and
a post-commit hook confirmed the index is stale (last indexed `4ce7a96`).
Per the capability gate's own suspicious-zero rule, the blast radius was
cross-checked by grep instead: `classificationPatchFromVerdict` has exactly
two call sites (`src/runner/loop.mjs`, and now `bin/fgos.mjs`) plus
`test/runner/loop.test.mjs` importing it from `loop.mjs` — which the
re-export keeps working, proven by that file staying green —, and
`parseDiscoverCallerVerdict` has one caller inside `bin/fgos.mjs`. Blast
radius is therefore small but **not** confirmed by the code graph.
