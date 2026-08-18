# derivetitle-filename-dot-boundary — plan

Item: `tsk-2z3`. Locked decisions: `CONTEXT.md` (D1-D3).

## Mode

Flags counted against the mode-gate checklist: auth (no), authorization
(no), data model (no), audit/security (no), external systems (no), public
contracts (no — `deriveTitle` is an internal helper of `classify.mjs`,
not a CLI-surfaced contract itself), cross-platform (no), existing
covered behavior (**yes** — 5 existing `deriveTitle` tests must stay
green), weak proof around the area (no), multi-domain (no).

**1 flag → mode: tiny.** One file changes production code
(`src/intake/classify.mjs:24`), one file gains tests
(`test/intake/classify.test.mjs`). No split candidates — this is one
honest, direct task.

## Approach

Replace the boundary regex at `classify.mjs:24` per D1:

```js
const boundary = safeText.match(/[.!?](?:\s|$)|\n/);
```

No alternative regex was considered — D1 already fixed the exact pattern
from the locked decision; this skill only carries it into an executable
change.

Risk map:

| component | risk | proof point |
|---|---|---|
| `deriveTitle` boundary regex | low — single-line, deterministic, no external state | the 3 new tests (D3) plus the 5 existing tests, all via `npm test -- classify.test.mjs` |

No medium/high-risk entries — nothing here needs a `fgos-coding-validating` proof
point beyond confirming the test file runs green, since the fix is a pure
regex swap with no behavioral surface outside `deriveTitle`'s return
value.

Files touched, in order:
1. `src/intake/classify.mjs` — regex change (line 24).
2. `test/intake/classify.test.mjs` — add tests per D3 (dotted-filename
   openers must not cut early); confirm existing 5 `deriveTitle` tests
   and the rest of the file's suite still pass.

## Cases to prove

- `deriveTitle` on text opening with `CONTEXT.md` followed by more prose
  → title keeps the full leading clause, not just `CONTEXT`.
- `deriveTitle` on text opening with `index.js` followed by more prose →
  same, not just `index`.
- `deriveTitle` on text containing `v.v` mid-sentence → does not treat
  that dot as a boundary.
- Existing real-sentence-boundary test (`.` followed by space) — unchanged
  result.
- Existing bare-newline-boundary test — unchanged result.
- Existing no-boundary passthrough and blank/non-string fallback tests —
  unchanged result.

## Split

None. Single tiny item, proceeds as itself — no child items.

## Verify

`npm test -- classify.test.mjs` (already recorded as the item's `verify`
field via `fgos discover`'s judgment).
