# Plan: migrate gate-bypass's hard-gate check to matchesKeyword

Item: `tsk-1gj`. Mode: **tiny** — one file, two identical call-site swaps,
mirrors an already-twice-established pattern. No design question, no split.

## Approach

1. `src/state/gate-bypass.mjs`: import `matchesKeyword` alongside
   `HEAVY_KEYWORDS`. In both `canAutoApprove` and `canAutoApproveValidate`,
   replace `HEAVY_KEYWORDS.some((keyword) => haystack.includes(keyword.toLowerCase()))`
   with `HEAVY_KEYWORDS.some((keyword) => matchesKeyword(haystack, keyword))`,
   dropping the now-redundant `.toLowerCase()` on `haystack`'s construction.
2. Tests (`test/state/gate-bypass.test.mjs`): add the two false-positive
   regression cases the scan report's own live backlog scan found
   (`plans/reports/project-instability-scan-260809-1608-ship-faster-
   stability-report.md` finding 11) — "authoring" (contains "auth" as a
   substring, must NOT hard-gate) and "audited" (contains "audit" as a
   substring, must NOT hard-gate) — proving the fix directly against the
   real evidence that motivated it, not just a synthetic case.

## Risk map

| Component | Risk | Proof |
|---|---|---|
| Two call-site swaps | low — mechanical, mirrors two already-migrated consumers byte-for-byte in spirit | `grep -n matchesKeyword src/intake/classify.mjs src/evolve/iron-law.mjs` — same import, same `.some(k => matchesKeyword(text, k))` shape |
| No existing test breaks | low | `test/state/gate-bypass.test.mjs:201-213`'s two D4-floor tests read in full: "auth"/"payment" are genuine standalone-word matches, unaffected |
| New false-positive tests actually exercise the real bug | low | will be proven failing-test-first (Iron Law evidence) against the pre-fix file |

Impact-analysis posture: `degraded` — GitNexus `present` (checked via
`fgos tool query --capability impact-analysis --status present`), index
stale. Cross-checked instead: `grep -rn "canAutoApprove\b\|canAutoApproveValidate\b"
src` finds only the two functions' own definitions in `gate-bypass.mjs` --
no other `src/` module imports or calls them directly. Every real caller is
a `node -e` inline snippet inside skill prose (`.claude/skills/fgos-
planning/SKILL.md`, `fgos-coding-validating/SKILL.md`, already read and used
directly this session), which only ever consumes the boolean return value
-- none depend on the substring-vs-word-boundary matching internals, so
tightening the match is a pure bugfix with no call-site-shape change
needed anywhere.

## Outstanding questions

None
