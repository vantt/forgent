# heavy-keywords-word-boundary-match — locked decisions

Item: tsk-2as. Stage: clarify.

## Feature boundary

`HEAVY_KEYWORDS` (`src/intake/risk-keywords.mjs`) is matched against
free text in exactly two places today, both via plain case-insensitive
substring scan (`text.includes(keyword)`):

- `classifyIronLaw` (`src/evolve/iron-law.mjs`) — flags a diff for the
  Iron Law failing-test-first gate.
- `classify()` (`src/intake/classify.mjs`, via its shared `countMatches`
  helper) — sets `tier`/`risk` at `fgos submit` time.

Both false-positive on a keyword appearing as a substring inside an
unrelated word (`auth` inside `authoring`) — confirmed directly: this
exact substring misclassified `tsk-69g` as `tier: heavy` at submit
(`classify()`) AND tripped the Iron Law gate at `approve`
(`classifyIronLaw`), from the same root cause hit twice.

This item changes the *matching semantics* (substring → word-boundary),
never the keyword lists themselves, and never `matchedModules`'
path-prefix/equals matching (`iron-law.mjs`'s other, unrelated
mechanism) — out of scope.

## Locked decisions

| D-ID | Decision |
|---|---|
| D1 | Word-boundary matching applies to **both** `classifyIronLaw` and `classify()` — not `classifyIronLaw` alone as originally scoped in this item's submit text. Both consumers run the identical substring pattern against the same shared `HEAVY_KEYWORDS` list (`classify.mjs:60`'s `countMatches` helper mirrors `iron-law.mjs`'s own inline check); `test/evolve/iron-law.test.mjs` already imports and tests `classify` and `classifyIronLaw` together, never separately; and the same substring hit both of them on `tsk-69g` from one root cause. Fixing only one would leave the other's false-positive exposure live. |

## Pinned terms

- **Word-boundary match** — a keyword match only counts when the keyword
  is not immediately preceded or followed by another word character
  (letter/digit/underscore) in the source text — "auth" matches standalone
  or as "auth," but not inside "authoring"/"author"/"authentic". The exact
  regex/Unicode-boundary implementation (plain ASCII `\b`, which does not
  reliably bound Vietnamese diacritic letters, vs. a Unicode-aware
  alternative) is an implementation choice for `fgos-coding-planning`/
  `fgos-coding-implement`, not locked here — several `HEAVY_KEYWORDS`/
  `LIGHT_KEYWORDS`/`KIND_KEYWORDS` entries are Vietnamese
  ("bảo mật", "thanh toán", "đổi tên"...).

## Scout evidence

- `src/intake/risk-keywords.mjs` lines 8–10 (read in full): the list's own
  header comment states "matching is a case-insensitive substring scan" —
  documents current behavior plainly, not framed as an intentional
  safety bias (contrast with `iron-law.mjs`'s `matchedModules` comment,
  which *does* explicitly call over-reporting "the safe direction (D13)"
  — no equivalent framing exists for the keyword-flag path).
- `src/intake/classify.mjs:60` (`countMatches`, read in full): confirmed
  `lowerText.includes(keyword.toLowerCase())` — the same substring
  pattern `classifyIronLaw` uses, not a different implementation that
  happened to look similar.
- `src/evolve/iron-law.mjs` (`classifyIronLaw`, read in full): confirmed
  the equivalent inline substring check against `HEAVY_KEYWORDS` only
  (`matchedFlags`) — `matchedModules` is a separate, path-based mechanism,
  untouched by this item.
- `test/evolve/iron-law.test.mjs` (read in full): imports and tests both
  `classify` and `classifyIronLaw` in the same file, against the same
  `HEAVY_KEYWORDS`/`ORIGINAL_21`/`NEW_13` fixtures — confirms D1's
  "tested as a pair, not separately" grounding.
- `countMatches` (`classify.mjs`) is the single shared helper behind
  `HEAVY_KEYWORDS`, `LIGHT_KEYWORDS`, and every `KIND_KEYWORDS` list —
  fixing it directly (rather than special-casing `HEAVY_KEYWORDS` inside
  it) uniformly removes the same substring false-positive from
  `LIGHT_KEYWORDS`/`KIND_KEYWORDS` matching too, as a natural side effect
  of D1, not a separate decision — noted here so it is not a surprise at
  planning/build time, never asked as its own question (a strict
  improvement, not a new risk).
- Impact-analysis capability gate, checked fresh this pass:
  `fgos tool query --capability impact-analysis --status present` →
  GitNexus registered, `status: present`. Posture: **full** — informational
  only; this item edits existing functions (`classifyIronLaw`,
  `countMatches`), so `fgos-coding-planning`/`fgos-coding-implement` may lean on this for
  a blast-radius proof point if the risk map calls for one.
- Prior `judgeDiscovery` verdicts for `tsk-2as`: none (fresh item).

## Deferred to fgos-coding-planning

- The exact word-boundary implementation (regex `\b`, Unicode property
  escapes, or a manual boundary check) — especially handling Vietnamese
  keyword entries correctly, which plain ASCII `\b` does not.
- How `test/evolve/iron-law.test.mjs`'s existing fixtures (`ORIGINAL_21`,
  `NEW_13`, the "covers all 34 HEAVY_KEYWORDS via description" test) get
  updated/extended to also cover the false-positive-avoided case (keyword
  as a substring inside another word, must NOT match) alongside the
  existing true-positive case (keyword standalone, must still match) —
  and whether `classify()`'s own existing tests need the same two new
  cases.
- The item's real `--verify` command — still a submit-time placeholder.

## Canonical references

- `src/evolve/iron-law.mjs`, `src/intake/classify.mjs`,
  `src/intake/risk-keywords.mjs`
- `test/evolve/iron-law.test.mjs`
- `docs/history/fgos-coding-shaping/CONTEXT.md` (where this false-positive
  was first observed, on `tsk-69g`)
