# Review a38 step-03 wave3 expansion, Part 04

Pin ae141550c; worktree 5a4ca0621; read-only. No checker or probe run. Sources read whole via `git show`, group A/B/C by every edge line and a full-file regex sweep for legacy-root paths and Markdown links; records loaded per edge with python.

## Per-file results

| File | Set | Stratum | Edges | Verdict |
|---|---|---|---:|---|
| docs/distillery/reports/distill-bee-inventory-2026-07-28-group-a.md | batch-061 | full-set-expansion | 31 | ok |
| docs/distillery/reports/distill-bee-inventory-2026-07-28-group-b.md | batch-061 | full-set-expansion | 44 | ok |
| docs/distillery/reports/distill-bee-inventory-2026-07-28-group-c.md | batch-061 | full-set-expansion | 9 | ok |
| docs/distillery/reports/distill-beegog-herding-design-2026-09-06.md | batch-061 | full-set-expansion | 0 | ok |
| docs/distillery/reports/distill-beegog-herding-rust-2026-09-06.md | batch-061 | full-set-expansion | 0 | ok |

All 84 edges are `preserve`, `timing: none`, no target/anchor, empty diff, and no parked, row-flip or added-patch edges exist. Verified for each edge that the cited path (`docs/history/...`, `docs/specs/...`, `docs/backlog.md`, `docs/decisions/index.md`) is an upstream bee SKILL.md coordinate inside a mechanical extraction of the upstream snapshot (`upstreams/bee/skills/`, bee v1.18.3), not an fgOS location claim. No adjacent fgOS-description is made, so preserve is correct under L12-10/L12-38 (dated distillery analysis history). Per-edge spot checks matched the source line and span text for every edge in groups A, B and C.

Coverage sweep: every `docs/specs/...`, `docs/decisions/...`, `docs/backlog.md`, `docs/history/...` occurrence in groups A/B/C has an edge. Uncovered tokens are exempt under L12-38(5): `docs/knowledge/...` (not a legacy root), bare `reading-map.md`/`system-overview.md`/`index.md`/`README.md` (each has a true scan exclusion in the record), and `plans/` fragments (not legacy roots). The two herding files have no legacy-root path or Markdown link (only upstream `report-N.md`/`role-dispatch.md` names); zero edges and an empty scan are correct.

## OUTCOME defects

None.

## Record-text notes (not rework)

- maps-j-01732 (group A L170), maps-j-01777 (group B L274), maps-j-01792 (group C L193): the distinct reason says "this individual Where entry", but the source lines are Lock-flow, Backlog done-flip and Flow-step-1 bullets, not Where entries. Disposition is right; wording is stale and could be aligned with the standard reason.

## Lead-judgment questions

- Group C L193 "related code/docs/specs" is a slash enumeration, not a `docs/specs` path; it has no edge and no scan candidate. I judge that correct (not an explicit legacy-root form), noted only so the Lead can confirm.

## Counts

- batch-061 / full-set-expansion: 5 files reviewed, 0 rework; 84 edges reviewed (31 + 44 + 9 + 0 + 0), 0 outcome defects.

Status: DONE
Summary: All 5 files and 84 edges in Part 04 are correct upstream-coordinate preserves with complete coverage; 0 rework. Only a stale "Where entry" wording note on three reasons.
