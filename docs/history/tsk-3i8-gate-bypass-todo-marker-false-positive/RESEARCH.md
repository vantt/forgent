# tsk-3i8 — RESEARCH.md

## Round 1 (2026-08-13)

**Asked:** Exact current implementation of the TODO/FIXME scan; does
`test/state/gate-bypass.test.mjs`'s existing fixture still get correctly
flagged by a colon/paren-requiring regex (must not regress); is
"colon/paren required" alone sufficient to resolve the reported false
positives, or is inline-code-span exclusion also needed?

**Checked:**
- `src/state/gate-bypass.mjs:121-131` (`hasOpenItems`), exact current
  line 123: `if (/\b(TODO|FIXME)\b/i.test(text)) return true;` — a bare
  word-boundary match anywhere in the artifact text, before the function
  ever reads the `## Outstanding questions` section (lines 125-130).
  Confirmed exactly as the item describes.
- `test/state/gate-bypass.test.mjs:50-57` — the existing `OPEN_ARTIFACT_TODO`
  fixture: `"Still need to check this. TODO: confirm with someone."` — a
  real marker, written with a colon immediately after `TODO`. Test at
  line 162-164 (`'hasOpenItems: TODO marker anywhere flags open, even
  with a clean Outstanding section'`) asserts `hasOpenItems(...) ===
  true` against it. A colon/paren-requiring regex still matches this
  fixture (verified directly, see below) — no regression.
- `grep -rhoE "(TODO|FIXME)[^a-zA-Z]{0,3}" src bin test docs .claude .agents plugins`
  → this repo's own real usage of the words is overwhelmingly META
  (discussing the marker/convention itself — "TODO/FIXME", "`TODO`",
  "TODO-only placeholder") rather than actual in-code TODO comments.
  Only one real colon-marker hit found (`test/state/gate-bypass.test.mjs:52`,
  the fixture above, itself deliberately constructed to test this
  mechanism) — consistent with this repo's own stated discipline against
  stub/placeholder code (AGENTS.md/CLAUDE.md: "Implement real behavior.
  No stubs, TODO-only placeholders").
- Directly tested the candidate regex `/\b(TODO|FIXME)\s*[:(]/i` against
  8 cases: the existing fixture (true, correct), a `FIXME(alice):`
  parenthesized form (true, correct), and 6 real reproduced false-positive
  shapes — "leaves the item at todo", the session's own live trip today
  ("still open, `` `todo` ``)," from `docs/history/tsk-2k0-.../plan.md`),
  "WorkTab::Todo enum variant and TODO tab label", "TODO-only
  placeholder", "TODO/FIXME markers" — every one now correctly resolves
  to `false` (not flagged open). All 8/8 matched expectation.
  **"Colon or paren required" alone is sufficient** — no case needed
  inline-code-span exclusion to resolve; the backtick in the session's own
  live trip already breaks the match on its own (a backtick is neither
  whitespace nor `:`/`(`, so `\s*[:(]` fails right there), meaning
  code-span exclusion would be redundant complexity, not a gap.

**Found:** Fix: change `src/state/gate-bypass.mjs:123` from
`/\b(TODO|FIXME)\b/i` to `/\b(TODO|FIXME)\s*[:(]/i`. No other line in
`hasOpenItems` needs to change. No test regression: the one existing test
exercising this path (`gate-bypass.test.mjs:162-164`) still passes
against the new regex (verified directly above).

**Still open:** Nothing — this closes the item's only open question.

## Verdict

`clear` — `verify: "node --test test/state/gate-bypass.test.mjs && npm test"`
