# Iron Law evidence — tsk-2k1

`classifyIronLaw` (`src/evolve/iron-law.mjs`) on this item's own changed
file set (`changedFiles`, `src/runner/merge.mjs`, computed against the
committed branch diff):

```json
{"required":true,"matchedFlags":["auth"],"matchedModules":["src/runner/dispatch.mjs","test/runner/dispatch.test.mjs"]}
```

`matchedModules` — real: both files sit under `src/runner/` (`MODULE_RULES`
prefix rule, `src/evolve/iron-law.mjs:21`). `matchedFlags: ["auth"]` — a
known false-positive shape of the keyword heuristic (word-boundary match,
no negation awareness): the item's own description contains the phrase
"không chạm auth/data/contract công khai" (*does NOT touch auth/data/public
contract*), and `matchesKeyword` has no way to see the "không chạm"
(does-not-touch) in front of it. Documented here per
`review-audit-self-decision.md`'s "document non-issues briefly" — this
finding is not itself a reason to add auth-specific proof; `matchedModules`
alone already makes `required: true` correct on its own.

Verify command: `node --test test/runner/dispatch.test.mjs`.

## Failing before (dispatch.mjs reverted to HEAD, test file as committed here)

133/137 passing, 4 failing — the four tests this item added to prove
`resolveCapacityCli`'s new `model`/`tier` override plumbing (D10):

```
test at test/runner/dispatch.test.mjs:1913:1
✖ resolveCapacityCli honors a caller-supplied model override over both the capacity's own model and modelForTier (tsk-2k1, D10) (6.492268ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
  + actual - expected

    {
      args: [
  +     'flash-3.5:classify this'
  -     'opus:classify this'
      ],
      command: 'agy',
  +   model: 'flash-3.5',
  -   model: 'opus',
      provider: 'agy'
    }
    actual: { command: 'agy', args: [ 'flash-3.5:classify this' ], provider: 'agy', model: 'flash-3.5' },
    expected: { command: 'agy', args: [ 'opus:classify this' ], provider: 'agy', model: 'opus' },

test at test/runner/dispatch.test.mjs:1929:1
✖ resolveCapacityCli honors a caller-supplied tier override, feeding it into modelForTier when no model is also supplied (tsk-2k1, D10) (5.5429ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly deep-equal:
    actual: { command: '/global/executor', args: [ 'sonnet:x' ], provider: '/global/executor', model: 'sonnet' },
    expected: { command: '/global/executor', args: [ 'flash-3.5:x' ], provider: '/global/executor', model: 'flash-3.5' },

test at test/runner/dispatch.test.mjs:1971:1
✖ the "resolve" CLI entry point honors --model, overriding the computed default (tsk-2k1, D10) (41.425871ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  + 'sonnet'
  - 'a-specific-override-model'

test at test/runner/dispatch.test.mjs:1983:1
✖ the "resolve" CLI entry point honors --tier, changing which configured model resolves (tsk-2k1, D10) (43.307479ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
  'sonnet' !== 'haiku'

ℹ tests 137
ℹ pass 133
ℹ fail 4
```

(The tier-override unit test deliberately uses `tier: 'light'`, not
`'standard'` — `'standard'` is also `DEFAULTS.tier`'s own fallback value,
`src/state/work.mjs:207`, so it would pass even with zero override
plumbing and prove nothing.)

## Passing after (dispatch.mjs restored to this item's real change)

```
ℹ tests 137
ℹ pass 137
ℹ fail 0
```

All four tests above now pass; the full suite (pre-existing 133 tests +
these 4) stays green.
