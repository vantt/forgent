# CONTEXT: gate-bypass's hard-gate check is the last substring-matching consumer

Item: `tsk-1gj`. Written retroactively (same structural gap as this scan's
other items).

## Locked decisions

- **D0.** Root cause confirmed by reading `src/state/gate-bypass.mjs:132`
  and `:152` (`canAutoApprove`/`canAutoApproveValidate`, identical
  `hardGateHit` blocks): both use
  `HEAVY_KEYWORDS.some((keyword) => haystack.includes(keyword.toLowerCase()))`
  — raw substring matching. `src/intake/risk-keywords.mjs`'s own
  `matchesKeyword` exists specifically to prevent this (tsk-2as D1, its own
  doc comment: "never merely as a substring inside a longer word ('auth'
  must not match inside 'authoring'/'author'/'authentic')"), already
  case-insensitive and Unicode-boundary-aware internally. The other two
  `HEAVY_KEYWORDS` consumers already migrated
  (`src/intake/classify.mjs:63`, `src/evolve/iron-law.mjs:87`) —
  `gate-bypass.mjs` is the sole holdout, and doesn't even import
  `matchesKeyword`.
- **D1.** Fix: swap both `hardGateHit` computations to
  `HEAVY_KEYWORDS.some((keyword) => matchesKeyword(haystack, keyword))`,
  importing `matchesKeyword` alongside the existing `HEAVY_KEYWORDS`
  import. Drop the `.toLowerCase()` call building `haystack` -- redundant
  once `matchesKeyword` handles case-insensitivity itself (its own `iu`
  regex flags), and keeping it would double-normalize without changing
  behavior, just noise.
- **D2.** Checked existing tests (`test/state/gate-bypass.test.mjs:201-213`)
  for a fixture that only passes BECAUSE of the substring bug: none found
  — the two D4-floor tests use "auth" and "payment" as genuine
  standalone-word matches ("Add auth bypass...", "...payment
  processing..."), both still real matches under `matchesKeyword`. No
  existing test needs to change.

## Outstanding questions

None
