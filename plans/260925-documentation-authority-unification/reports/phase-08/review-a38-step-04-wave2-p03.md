# Review a38: Step 4 wave 2, part 03 (set step04-002)

Pin: dc24ce645 (authorInputCommit). Sources read whole through EOF via `git show`; targets and renders checked at the same pin. No scripts run, nothing written to the worktree.

Totals: 3 files, 31 slots reviewed (0 patch, 8 render-join parked/preserve duplicates counted below), 0 outcome defects. Stratum: mandatory re-review. Set step04-002, mandatory stratum: reviewed 3 of this part (part 04 covers the remaining 6), rework 0.

## domains/coding/skills/fgos-coding-planning/SKILL.md (verdict ok)
Slots reviewed: 6 (2 source preserve, 4 render-join).
- Source L15 (`docs/history/<feature>/CONTEXT.md`) and L16 (`docs/history/<feature>/plan.md`) are preserve under L12-10. Correct: external-project portable convention, literal, not converted to plans/.
- Render joins (.agents L16/L17 and plugins L16/L17, the +1 offset is the generated header at line 12) carry label render-join with sourceDisposition preserve, no target or anchor. Correct under L12-58(3) and L12-60(8). `.claude/skills/...` wrapper has no joins and no docs-path text; correct.
- No other docs/ references in the source. The `../_shared/` and `../../../core/skills/_shared/` pointers are not retiring-tree edges.
- stepFiveExcluded entries (history-007/008/021/022 etc.) are the same L12-10 convention cites; consistent.

## .../references/bootstrap-and-lane.md (verdict ok)
Slots reviewed: 12 (3 source preserve at L7, L18, L25; 9 render-joins across .agents, .claude, plugins at L8, L19, L26).
- All six `docs/history/<feature>/` hits (incl. the `--docs-ref` fenced example at L25) are preserve; the fenced example is also listed in stepFiveExcluded for the .agents/plugins renders (class4-l-000063/2065). Correct per L12-60(1).
- Render line numbers are source+1 and each render carries a header witness at line 1. Joins are label-only. Correct.
- No missed doc paths.

## .../references/verify-sync-and-gap.md (verdict ok)
Slots reviewed: 13 (preserve L64; parked L16 and L49-50; render-joins for plan.md L65 and how-to L17/L50-51 across .agents, .claude, plugins).
- Parked L16 `docs/how-to/write-verify-for-a-skill-prose-change.md` and wrapped L49-50 `docs/how-to/preserve-` / `shell-escapes-when-transcribing-a-verify-command.md`: both targets are absent at the pin (verified by `git cat-file`), so a dead-link park is correct. The wrapped span covers both lines (cols 48-69 on L49, cols 1-52 on L50) and the render-joins mirror it at L50/L51. Correct.
- Successor notes exist at the pin and are title-matched: `docs/knowledge/vi-t-verify-cho-m-t-item-thay-i-skill-prose/write-verify-for-a-skill-prose-change.md` (title "Viết verify cho một item thay đổi skill prose", how-to) and `docs/knowledge/how-to-preserve-shell-escapes-when-transcribing-a-verify-com/preserve-shell-escapes-when-transcribing-a-verify-command.md` (title "How to preserve shell escapes when transcribing a verify command"). Notes are non-executable (no patch). Correct.
- L64 `docs/history/<feature>/plan.md` preserve; L68 fenced footprint example is excluded to Step 5 (history-010/024). Correct.
- Render joins for the parked paths exist for all three renders (.agents, plugins via class4 ids; .claude via un-id'd joins). No render carries its own diff.

## Outcome defects
None.

## Record-text notes (not rework)
- bootstrap-and-lane L25/L26 fenced example: the .claude render join (skills-034/054) is a slot while the .agents/plugins renders of the same line are in stepFiveExcluded (class4-l-000063/2065). Both are non-editing; the mixed treatment is cosmetic, but a uniform treatment would read cleaner.
- Parked slots carry timing `none`; reason text states Phase 9 needs a passage-bound successor. Acceptable, no executable action implied.

## Lead-judgment questions
None.

Counts: set step04-002 / mandatory re-review: 3 files reviewed, 0 rework.

Status: DONE
