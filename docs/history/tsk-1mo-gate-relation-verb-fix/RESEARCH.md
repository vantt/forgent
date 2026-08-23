# RESEARCH.md — tsk-1mo

## 2026-08-18 — discovery round 1

**Asked:** Does `fgos-coding-validating`'s Gate step 2 boilerplate still
literally contain `--relation supersedes:tsk-224` at both mirrored file
locations? Is `touches:<id>` a valid `--relation` value? What text field
does the store's supersession-prose guard actually check, and would
switching to `touches:tsk-224` while keeping the "as superseded by
tsk-224" rationale wording trip that guard?

**Checked:**
- `plugins/fgOS/skills/fgos-coding-validating/SKILL.md:364` (grep).
- `.agents/skills/fgos-coding-validating/SKILL.md:364` (grep — the item's
  description cites line 363 for this mirror; the live file has both
  copies at line 364 today, a minor line-number drift from the report,
  not a change in substance).
- `src/state/store.mjs:1176-1217` (`parseDecisionRelation`,
  `decisionTextLooksLikeSupersession`, `SUPERSESSION_PROSE_PATTERN`).
- `bin/fgos.mjs:1932-1962` (the `decision` CLI case that calls both).

**Found:**
- Both file locations literally contain
  `--relation supersedes:tsk-224` in the exact boilerplate block
  described (`plugins/fgOS/skills/fgos-coding-validating/SKILL.md:355-367`,
  mirrored byte-identical at `.agents/skills/fgos-coding-validating/SKILL.md`).
  The bug is still live.
- `src/state/store.mjs:1196-1217` (`parseDecisionRelation`): valid
  `--relation` values are exactly `none`, `supersedes:<id>`, or
  `touches:<id>` — `touches:tsk-224` is valid input, confirms the
  item's proposed fix targets a real accepted value, not a typo.
- `bin/fgos.mjs:1955`: the supersession-prose guard
  (`decisionTextLooksLikeSupersession`) checks the `--text` argument
  only, never `--rationale`. The boilerplate's `--text` value is
  `"auto-approved validateApprove gate for <item-id> at level <level>"`
  — this contains none of `SUPERSESSION_PROSE_PATTERN`'s words
  (supersede(s)/superseded/replaces/overrides/no longer applies/instead
  of the previous), so the guard never fires on either the current
  `supersedes:tsk-224` or the proposed `touches:tsk-224` relation.
  Changing `--relation` to `touches:tsk-224` is safe against this guard
  regardless of whether the `--rationale` wording is also corrected in
  the same edit.

**Open:** none — every point the item description asserted is now
independently confirmed against the live repo state.
