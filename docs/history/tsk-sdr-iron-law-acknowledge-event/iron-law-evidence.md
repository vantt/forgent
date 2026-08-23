# Iron Law evidence — tsk-sdr

`classifyIronLaw` against the real committed diff (`git diff cf1d47b2...1625e523`,
run against the item's own current commit, matching the exact classifier the
real gate uses at merge time):

```json
{
  "filesChanged": [
    "docs/history/tsk-sdr-iron-law-acknowledge-event/RESEARCH.md",
    "docs/history/tsk-sdr-iron-law-acknowledge-event/plan.md",
    "src/verbs/merge/approve.mjs",
    "src/verbs/merge/iron-law-level.mjs",
    "src/verbs/merge/sync-root.mjs",
    "test/cli/fgos-iron-law-gate.test.mjs"
  ],
  "result": {
    "required": true,
    "matchedFlags": ["audit"],
    "matchedModules": []
  }
}
```

`required: true` — matched `HEAVY_KEYWORDS` flag `audit` (the item's own
description contains "Audit sau này không phân biệt được..."). No
`matchedModules` hit: `src/verbs/merge/*` is not on `iron-law.mjs`'s own
illustrative self-modifying module list (`MODULE_RULES`), so this diff trips
the gate on keyword content, not on touching the gate's own classifier code.

## Failing-test-first proof

Command run (the item's own real `verify`, isolated to the two new cases):

```
node --test --test-name-pattern="tsk-sdr" test/cli/fgos-iron-law-gate.test.mjs
```

**Before** (production code reverted to the pre-fix commit `cf1d47b2`'s
`src/verbs/merge/{approve,sync-root,iron-law-level}.mjs`, new tests already
in place from the real commit `1625e523`):

```
✖ approve with --acknowledge-iron-law on a gated ROOT proceeds AND writes exactly one "acknowledged" decision record with kind engine, never "skipped" (tsk-sdr) (583.270547ms)
✖ sync-root with --acknowledge-iron-law on a gated root (no parent) proceeds AND writes exactly one "acknowledged" decision record with kind engine, never "skipped" (tsk-sdr) (422.082732ms)
ℹ tests 2
ℹ pass 0
ℹ fail 2

✖ failing tests:

test at test/cli/fgos-iron-law-gate.test.mjs:263:1
✖ approve with --acknowledge-iron-law on a gated ROOT proceeds AND writes exactly one "acknowledged" decision record with kind engine, never "skipped" (tsk-sdr) (583.270547ms)
  AssertionError [ERR_ASSERTION]: expected exactly one Iron Law record, got 0
  0 !== 1

test at test/cli/fgos-iron-law-gate.test.mjs:279:1
✖ sync-root with --acknowledge-iron-law on a gated root (no parent) proceeds AND writes exactly one "acknowledged" decision record with kind engine, never "skipped" (tsk-sdr) (422.082732ms)
  AssertionError [ERR_ASSERTION]: expected exactly one Iron Law record, got 0
  0 !== 1
```

This is the real gap the item describes: the acknowledge path wrote zero
decision records.

**After** (production files restored to the real committed fix, `git diff`
against `HEAD` clean before this run):

```
✔ approve with --acknowledge-iron-law on a gated ROOT proceeds AND writes exactly one "acknowledged" decision record with kind engine, never "skipped" (tsk-sdr) (597.353513ms)
✔ sync-root with --acknowledge-iron-law on a gated root (no parent) proceeds AND writes exactly one "acknowledged" decision record with kind engine, never "skipped" (tsk-sdr) (424.563528ms)
ℹ tests 2
ℹ pass 2
ℹ fail 0
```

Full suite (`npm test`, item's own real verify command) also run clean after
the fix: `tests 3464, pass 3459, fail 0, skipped 5` — the pre-existing 10
D1/D3/D7/D8 tests in the same file are unchanged and still pass, proving the
restructure did not alter the existing refuse/warn-skip branches.
