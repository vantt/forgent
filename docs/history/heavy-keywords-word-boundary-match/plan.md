# heavy-keywords-word-boundary-match — plan

Item: tsk-2as. Stage: decompose. Assumes D1 (`CONTEXT.md`, same folder) —
cited by D-ID below, never reopened.

## Mode

Flags counted: auth (no — this changes a risk-classifier's string
matching, not real authentication/authorization code), authorization
(no), data model (no), audit/security (no — same reasoning as auth: the
*word* "auth" is data the classifier reads, not a security feature this
item builds), external systems (no), public contracts (no — `classify()`
and `classifyIronLaw`'s own return shapes are unchanged, only which
inputs match), cross-platform (no), **existing covered behavior (yes)** —
`test/evolve/iron-law.test.mjs` already asserts byte-identical
substring-match behavior for all 34 `HEAVY_KEYWORDS` across both
functions; this item must change that behavior for the substring case
while preserving it for the standalone case, weak proof around the area
(no — well-tested already), multi-domain (no).

**Flag count: 1.** Mode: **small** — a few files, the one gray area
(exact Unicode-safe boundary implementation) is explicitly left to this
plan's own Approach below, not a fresh unknown at build time.

Impact-analysis posture — **degraded**, corrected from `CONTEXT.md`'s
provisional "full" note: `fgos tool query` reports GitNexus `status:
present`, but running the real `mcp__gitnexus__impact` tool against both
target functions returned `impactedCount: 0` / `risk: LOW` for **both**
`classify` and `classifyIronLaw` — a suspicious zero given both are
called from live CLI paths. Cross-checked via `grep` (CLAUDE.md's own
gate: "a suspicious zero-result... is worth a quick grep/rg cross-check"):
GitNexus's index is stale for this query (matches the repeated
`GitNexus index is stale` notices seen throughout this session) and
missed real call sites entirely — see Approach's risk map for the actual
evidence used instead.

## Approach

Two files change (per D1), a third gets extended:

1. **`src/intake/classify.mjs`** — `countMatches` (the shared helper
   behind `HEAVY_KEYWORDS`, `LIGHT_KEYWORDS`, and every `KIND_KEYWORDS`
   list) changes from `lowerText.includes(keyword.toLowerCase())` to a
   word-boundary-aware match. Fixing this one shared helper is what makes
   `classify()`'s in-scope per D1 without a second, parallel
   implementation — and uniformly improves `LIGHT_KEYWORDS`/
   `KIND_KEYWORDS` matching too, as D1's own noted side effect.
2. **`src/evolve/iron-law.mjs`** — `classifyIronLaw`'s inline
   `lowerDescription.includes(keyword.toLowerCase())` loop changes to the
   same word-boundary-aware match. `matchedModules`' path-prefix/equals
   matching is untouched (out of scope, both per D1 and per the item's
   own description).
3. **`test/evolve/iron-law.test.mjs`** — extended, not replaced: the
   existing `ORIGINAL_21`/`NEW_13`/"covers all 34 HEAVY_KEYWORDS" cases
   must keep passing unchanged (true-positive, standalone keyword
   mentions still match) — this is a byte-identical-behavior regression
   requirement — plus new cases for both functions: a keyword appearing
   as a substring inside another word must NOT match (e.g. `'auth'`
   inside `'authoring'`), covering both an English case (`auth`/
   `authoring`) and at least one Vietnamese case, since several
   `HEAVY_KEYWORDS` entries carry diacritics (`bảo mật`, `mất dữ liệu`)
   that a naive ASCII `\b` implementation would not bound correctly.

**Alternative rejected:** a `HEAVY_KEYWORDS`-only special case inside
`countMatches` (leaving `LIGHT_KEYWORDS`/`KIND_KEYWORDS` on the old
substring behavior). Rejected — `countMatches` has no way to know which
list it was called with without a new parameter, so special-casing would
either require passing list identity through (needless complexity) or
duplicating the function; fixing the helper itself is smaller and DRY-er,
per D1's own noted side effect.

**Alternative rejected:** plain ASCII `\b` regex boundary
(`new RegExp('\\\\b' + keyword + '\\\\b', 'i')`). Rejected as the sole
implementation — ASCII `\b` treats Vietnamese diacritic letters (the
`ả`/`ậ`/`ữ`/`ệ` in `bảo mật`/`mất dữ liệu`) as non-word characters,
which would make `\b` land in the wrong place around those keywords.
The actual boundary check needs a Unicode-aware definition of "word
character" (e.g. a Unicode property escape `\p{L}`/`\p{N}` with the `u`
flag, or an explicit check of the character before/after the match
against a wider letter/digit/underscore class) — left as the concrete
implementation choice for `fgos-coding-implement`, constrained by the proof
below.

Risk map:

| Component | Risk | What proves it |
|---|---|---|
| `classify()` word-boundary change | medium | 2 real call sites confirmed via `grep` (GitNexus's own answer was stale/wrong here — see posture above): `bin/fgos.mjs:683` (`fgos submit`'s classification path) and `src/runner/loop.mjs:592` (runner's own auto-submission-of-blocks path). Both exercised by `test/evolve/iron-law.test.mjs`'s existing `classify` assertions — extending that file covers this. |
| `classifyIronLaw()` word-boundary change | medium | 2 real call sites confirmed via `grep`: `bin/fgos.mjs:2392` and `bin/fgos.mjs:2794` (the Iron Law gate inside `approve`/`merge next`). Same test file already exercises `classifyIronLaw` directly. |
| Vietnamese-diacritic keyword boundary correctness | medium | This is the item's own core risk (why D1's CONTEXT.md flagged it as a pinned-term caveat) — proof required at `fgos-coding-validating`: the extended test's Vietnamese true-positive case (a real, unmodified diacritic keyword mention still matches) must be evidenced with a real test run, not asserted. |

Order: `countMatches` in `classify.mjs` first (the shared primitive both
this file and, indirectly by import, `iron-law.mjs`'s own equivalent
logic are modeled on), then `classifyIronLaw`'s own inline check in
`iron-law.mjs` second (same fix shape, applied to its own local loop —
`iron-law.mjs` cannot import `countMatches` from `classify.mjs` without
an upward-import violation per that file's own kernel/domain layering
comment), then extend the test file last, against both finished
implementations.

`fgos graph --what-if tsk-2as --json`: `unblocksTransitive: 0`,
`newlyReady: []` — isolated item, nothing else in the backlog depends on
this landing first; no ordering constraint against other work.

## Shape

One direct task, no phases:

- Change `countMatches` in `classify.mjs` to word-boundary matching
  (Unicode-aware, per the rejected-alternative note above).
- Change `classifyIronLaw`'s inline keyword loop in `iron-law.mjs` the
  same way.
- Extend `test/evolve/iron-law.test.mjs`: keep all existing assertions
  green (byte-identical true-positive behavior), add the substring
  false-positive case for both functions (English `auth`/`authoring`
  at minimum), add at least one Vietnamese true-positive regression case
  proving the diacritic keywords still match standalone.
- Concrete cases worth proving at this mode's depth: a keyword at the
  very start/end of the description string (boundary-of-string edge, not
  just boundary-between-words); a keyword that is itself a substring of
  another *keyword* in the same list (none currently share this shape in
  `HEAVY_KEYWORDS`, but the test should not assume that stays true
  forever — a case worth at least a comment, not necessarily a full test
  given `small` mode's depth).

## Split decision

No split. One honestly-sized piece — confirmed by the mode-gate count
(1 flag) and `fgos graph --what-if`'s isolated-component result above.

## Assumptions

- The exact Unicode-boundary regex construction (which property escapes,
  whether to precompile per-keyword or build one alternation pattern) is
  `fgos-coding-implement`'s own call — this plan fixes the *behavior* contract
  (standalone keyword matches, substring-inside-another-word does not,
  Vietnamese diacritics handled correctly), not the literal regex.

## Proof (leave execution alone, step 6)

The item's own `verify` (already locked via this session's
`fgos-coding-exploring` pass, survived three rounds of an independent second-pass
judge — round 1 rejected a placeholder, round 2 rejected an inline-only
check that ignored the stale item description, round 3 rejected an
inline-only check that skipped the existing Vietnamese-inclusive test
suite):

```
node --test test/evolve/iron-law.test.mjs && node --input-type=module -e "
import assert from 'node:assert/strict';
import { classifyIronLaw } from './src/evolve/iron-law.mjs';
import { classify } from './src/intake/classify.mjs';
const fp = classifyIronLaw({ filesChanged: [], description: 'does NOT duplicate fgos-coding-exploring authoring logic' });
assert.equal(fp.matchedFlags.includes('auth'), false);
const fpClassify = classify('does NOT duplicate fgos-coding-exploring authoring logic');
assert.equal(fpClassify.tier, 'standard');
const tp = classifyIronLaw({ filesChanged: [], description: 'fix the auth flow' });
assert.equal(tp.matchedFlags.includes('auth'), true);
const tpClassify = classify('fix the auth flow');
assert.equal(tpClassify.tier, 'heavy');
console.log('OK');
"
```

This plan does not re-design it — it already proves both in-scope
functions (D1), runs the full existing suite (protects the Vietnamese/
34-keyword true-positive coverage), and proves the false-positive case
this whole item exists to fix.
