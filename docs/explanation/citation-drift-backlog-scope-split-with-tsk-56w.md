---
authoritative_for: tsk-2sp citation-drift backlog scope narrowing, split with tsk-56w, why skill-file citation cleanup got a stricter rule
---

# Splitting the remaining citation-drift backlog: two disjoint scopes, two different fix rules

`tsk-2sp` continued `tsk-2yu`'s citation-format baseline cleanup (see
`docs/explanation/citation-baseline-cleanup-calibration-slice.md`) —
originally scoped to all 1664 findings remaining after `tsk-2yu-1`'s
calibration slice, across 73 files.

## Why the scope was narrowed mid-flight

While planning, a live coordination surfaced with `tsk-56w`
(`docs/history/skill-prose-cleanup/DISCUSSION.md` D1), which had locked a
**stricter** rule for `.agents/skills/**/SKILL.md` and `plugins/fgOS/
skills/**/SKILL.md`: remove every governance id (`ADR<n>`/`RUL<n>`/D-local)
outright — never gloss, never footnote. The reason those 61 skill files
(660 findings) need a different rule than every other doc: `plugins/fgOS/
skills` ships standalone via the marketplace with **no `docs/` alongside
it** — a glossed citation pointing at a decision record that doesn't exist
in the shipped package is dead on arrival for that reader. The original
`tsk-2yu`-inherited fix contract (add a one-line gloss) is exactly wrong
for that scope.

`tsk-2sp`'s own two originally-planned children touching those files
(children 3 and 4, "fix citation-format findings in `.agents/skills`
canonical sources" / "...in plugin-only skills") were **retired
`wontfix`, not reworked** — their gloss-based fix approach directly
contradicted `tsk-56w`'s stricter removal rule, and reworking them here
would collide with `tsk-56w`'s own in-flight edits on the same lines. The
correct fix for that scope moved entirely to `tsk-56w`.

## The resulting split

`tsk-2sp` narrowed to exactly the 12 non-skill baseline files (1019
findings): `docs/specs/*.md` + `docs/backlog.md`, split three ways by file
group:

- `tsk-2sp-1` — `docs/specs/work-state.md` (301 `d-local-outside-home`
  findings — `work-state.md`'s own `bare-citation` findings were already
  fixed by `tsk-2yu-1`)
- `tsk-2sp-2` — `docs/specs/runner.md` (412 findings)
- `tsk-2sp-5` — the remaining `docs/*.md` files (306 findings)

301 + 412 + 306 = 1019, matching the narrowed scope exactly — no further
re-split needed. No dependency was required between `tsk-2sp` and
`tsk-56w` after this split: both scopes are now fully disjoint file sets
and could run in parallel.

## The lesson

When two in-flight items independently touch overlapping files with
different fix rules, the resolution is a scope split along the rule
boundary (not a merge, not a priority fight) — each rule gets its own
disjoint file set and its own item. Retiring the wrong-rule children as
`wontfix` (rather than silently reworking them to match the other item's
rule) keeps the historical plan.md honest about what was actually
evaluated and decided, even though the final live scope moved.
