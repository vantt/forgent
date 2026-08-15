# plan.md — tsk-3xog

Mode: standard (risk:heavy per the item's own classification — the change
touches the decompose citation-check contract between `src/intake/plan.mjs`
and `fgos-coding-exploring/SKILL.md`, and a wrong fix there fails open
silently, the same failure class the item itself exists to close). No
`CONTEXT.md` — the item's own description already carried a locked scope
(its "CẬP NHẬT 2026-08-15" section explicitly superseded the earlier
three-option framing with real measurements), so this item went directly
from claim to implementation without a separate discovery/exploring pass.
This `plan.md` is written retroactively, documenting the approach actually
taken, because `assertPlanEvidence` requires one on `fgw/tsk-3xog` before a
`risk:heavy` item can land regardless of whether a live planning
conversation preceded it.

## Approach

The item's own locked scope named three tasks. Before touching anything,
verified the real measurement myself rather than trusting the item's
original "31 files" count at face value — that count used a naive
heuristic (a D-ID token appearing anywhere in a `CONTEXT.md`), which the
item's own text already warned could false-positive on a file that only
*cites* another feature's D-ID without owning a decisions table of its own.

1. **Pin the literal heading.** Added a paragraph to step 3 of
   `.agents/skills/fgos-coding-exploring/SKILL.md` (canonical source)
   requiring the exact heading `## Locked decisions`, explaining why
   (`src/intake/plan.mjs`'s literal-English regex). Regenerated
   `.claude/skills/` via `npm run build:skills` (no diff — it's a thin
   redirect, not a copy) and hand-synced `plugins/fgOS/skills/` (the
   third, hand-maintained leg `test/skills/fgos-mirror.test.mjs` asserts
   byte-identical to canonical).
2. **Guard test.** Wrote `scripts/check-locked-decisions-heading-drift.mjs`
   + `test/scripts/check-locked-decisions-heading-drift.test.mjs`, same
   family as `scripts/check-decision-citation-drift.mjs`
   (no new mechanism). Design deliberately narrower than "a D-ID anywhere
   in the file": it only flags a *heading* that reads as a decisions table
   (English "decision" or Vietnamese "quyết định", case-insensitive, any
   heading level, hierarchical body so a nested `### D1` row still counts
   as its parent's content) whose own body has a real D-ID and isn't the
   exact canonical text. Proven against a real corpus false positive found
   during measurement: `tsk-3yh-take-deps-resolved-status/CONTEXT.md`
   already uses the exact canonical heading with a genuinely empty
   decisions section, but its *intro paragraph* (outside any decisions
   heading) mentions another feature's "D1/D2" in passing — a naive
   "D-ID anywhere" check would flag this file forever with no way to fix
   it by renaming a heading, since there is no wrong heading to rename.
3. **Retrofix real corpus.** Ran the same heading-aware detector against
   every `docs/history/*/CONTEXT.md`: 30 files genuinely own a decisions
   table under a non-canonical heading (matches the item's own "~30"
   estimate) — confirmed individually before any edit, not blind `sed`.
   Renamed each via one exact, pre-verified single-line string
   replacement (never a regex sweep). One file
   (`pick-cook-worktree-bypass-reminder/CONTEXT.md`) used `#`
   (heading level 1) for every section including its real decisions
   table — fixed to `##` for that one line only, left its sibling
   headings alone (out of scope to renormalize the whole file's heading
   levels).

| Site | Risk | Proof point |
|---|---|---|
| `.agents/skills/fgos-coding-exploring/SKILL.md` + `plugins/fgOS/skills/` mirror | low | `test/skills/fgos-mirror.test.mjs` (byte-identical mirror assertion) |
| `scripts/check-locked-decisions-heading-drift.mjs` | low | its own unit tests (translated heading, numbered variant, wrong level, canonical-not-flagged, cross-reference-not-flagged, no-table-not-flagged) + CLI fixture tests + a real-corpus test that runs the script against the actual repo and asserts exit 0 |
| 30 `CONTEXT.md` heading renames | low | each rename individually verified (exact string match count == 1 before write); post-rename, the guard test's real-corpus assertion is the proof no file was missed or wrongly renamed |

`impact-analysis: degraded` — same posture the parent `tsk-1y6` docs
recorded (GitNexus `present` but index stale at `7bb3231`); this item
touches skill prose, one new script pair, and Markdown headings only, none
of which GitNexus's stale index would meaningfully cover regardless.

## Shape

One piece, no split — three sequential sub-tasks on the same small file
set, not independent enough to parallelize (task 2's test needed task 3's
corpus fix to pass its own real-corpus assertion).

Files touched:
- `.agents/skills/fgos-coding-exploring/SKILL.md`,
  `plugins/fgOS/skills/fgos-coding-exploring/SKILL.md` — heading pin
- `scripts/check-locked-decisions-heading-drift.mjs` (new),
  `test/scripts/check-locked-decisions-heading-drift.test.mjs` (new) —
  guard
- 30 `docs/history/*/CONTEXT.md` files — heading rename only, no other
  content change

## Outstanding questions

None
