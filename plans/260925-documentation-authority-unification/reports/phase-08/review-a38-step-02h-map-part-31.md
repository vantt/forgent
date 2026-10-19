# Review a38 step-02h map part 31

- Reviewer: reviewer:sonnet-session:a18f1e82b792ed408@2026-10-19
- Commits: worktree detached at b3d2c2ebd (verified); author 6c415d7ce, accounting b3d2c2ebd
- Part: 31 (preserve-pending-target), 34 entries; every entry deep-read (source line, block context, owner/target, siblings of the same reference)

## Totals

ok 31 / rework 3 / needs-Lead-judgment 0. Rework rate 3/34 = 8.8% (above 3%: the affected sets expand per A50).

## Rework by defect class
1. Wrapped-hyphen truncation (maps-h-05262, maps-h-05266): a citation hyphen-wrapped onto an indented continuation line of a list item is cut at the hyphen (normalizedReference ends in "-"). Census-wide there are 12 such tokens (maps-h-01336, 01634, 01877, 01878, 01898, 02169, 04735, 04739, 04993, 05262, 05266, 05319); the join rule must handle indented list/blockquote continuations. Both rows here are un-patched, so no byte risk, but the reference unit is incomplete.
2. Checker-scope statement routed as navigation (maps-h-05109): R1 of docs/specs/decision-citation-drift.md states the scan scope; it must be a behavioral Step 5 row like lines 37 and 70.

## Entries

| # | Entry | Consumer:line | Reference | Verdict | Note |
|---|---|---|---|---|---|
| 1 | maps-h-05054 | reading-map.md:157 | docs/specs/ | ok | whole legacy-tree mention, parked, no patch (L12-24) |
| 2 | maps-h-05055 | reading-map.md:157 | docs/specs/enduser-docs-authoring.md | ok | parked/no patch consistent with sibling mappings; no operative-read or single-destination rule violated |
| 3 | maps-h-05056 | reading-map.md:157 | docs/specs/enduser-docs-index.md | ok | parked/no patch consistent with sibling mappings; no operative-read or single-destination rule violated |
| 4 | maps-h-05077 | reading-map.md:172 | docs/specs/enduser-docs-index.md | ok | parked/no patch consistent with sibling mappings; no operative-read or single-destination rule violated |
| 5 | maps-h-05078 | reading-map.md:173 | docs/specs/enduser-docs-index.md | ok | parked/no patch consistent with sibling mappings; no operative-read or single-destination rule violated |
| 6 | maps-h-05087 | claude-named-executor.md:63 | docs/reference/coding-worker- contract-shape.md | ok | wrapped token correctly joined; retained end-user doc, parked (safe) |
| 7 | maps-h-05103 | decision-citation-drift.md:17 | docs/specs/*.md | ok | usage sentence naming docs/specs/*.md, not a checker-scope statement; parked no patch |
| 8 | maps-h-05109 | decision-citation-drift.md:63 | docs/specs/*.md | rework | checker-scope: R1 (docs/specs/decision-citation-drift.md:63) defines which files the check scans (docs/backlog.md + docs/specs/*.md); sibling scope statements at 37 (Scan scope) and 70 (R3) are behavioral Step 5 rows, this one routes to Step 3 navigation |
| 9 | maps-h-05144 | platform-foundations.md:352 | docs/specs/platform-foundations.md | ok | self-reference in consumer; no patch into consumer (L12-21) |
| 10 | maps-h-05145 | platform-foundations.md:353 | docs/decisions/ index.md | ok | wrapped token joined; generated docs/decisions/index.md retained, parked no patch |
| 11 | maps-h-05149 | platform-foundations.md:421 | docs/specs/platform-foundations.md | ok | self-reference |
| 12 | maps-h-05150 | platform-foundations.md:447 | docs/specs/platform-foundations.md | ok | self-reference |
| 13 | maps-h-05151 | platform-foundations.md:465 | docs/specs/platform-foundations.md | ok | self-reference |
| 14 | maps-h-05152 | platform-foundations.md:505 | docs/specs/platform-foundations.md | ok | self-reference |
| 15 | maps-h-05155 | reading-map.md:11 | docs/specs/platform-foundations.md | ok | parked/no patch consistent with sibling mappings; no operative-read or single-destination rule violated |
| 16 | maps-h-05162 | reading-map.md:17 | docs/specs/ | ok | whole legacy-tree bullet subject, parked |
| 17 | maps-h-05170 | reading-map.md:24 | docs/specs/enduser-docs-index.md | ok | parked/no patch consistent with sibling mappings; no operative-read or single-destination rule violated |
| 18 | maps-h-05186 | reading-map.md:37 | docs/specs/ | ok | whole legacy-tree mention, parked |
| 19 | maps-h-05187 | reading-map.md:37 | docs/specs/enduser-docs-authoring.md | ok | parked/no patch consistent with sibling mappings; no operative-read or single-destination rule violated |
| 20 | maps-h-05188 | reading-map.md:37 | docs/specs/enduser-docs-index.md | ok | parked/no patch consistent with sibling mappings; no operative-read or single-destination rule violated |
| 21 | maps-h-05209 | reading-map.md:52 | docs/specs/enduser-docs-index.md | ok | parked/no patch consistent with sibling mappings; no operative-read or single-destination rule violated |
| 22 | maps-h-05210 | reading-map.md:53 | docs/specs/enduser-docs-index.md | ok | parked/no patch consistent with sibling mappings; no operative-read or single-destination rule violated |
| 23 | maps-h-05247 | runner.md:1420 | docs/architect/agent-coordination/contracts/coordination-ses | ok | owner is verbatim carriage; no executable patch, matches 36 sibling edges |
| 24 | maps-h-05248 | runner.md:1421 | docs/architect/agent-coordination/decisions/ADR-008-coordina | ok | same |
| 25 | maps-h-05251 | runner.md:1588 | docs/architect/agent-coordination/contracts/coordination-ses | ok | same |
| 26 | maps-h-05253 | runner.md:1616 | docs/architect/agent-coordination/decisions/ADR-010-interact | ok | same |
| 27 | maps-h-05256 | runner.md:1721 | docs/distillery/ porting-log.md:101 | ok | line-range style locator ":101" kept, wrapped token joined, no bare-path patch; retained distillery file |
| 28 | maps-h-05262 | runner.md:2418 | docs/decisions/0026-vision-orchestrator-roottask-capacity-na | rework | wrapped-hyphen-truncation: reference unit cut at "native-vs-"; continuation "cli-spawn.md" on the next indented list line (runner.md 2418-2419) not joined; census holds 12 such truncated tokens |
| 29 | maps-h-05266 | runner.md:2682 | docs/how-to/allowlist-a-historical-mention-in-launcher-vocab | rework | wrapped-hyphen-truncation: reference cut at "launcher-vocabulary-"; continuation "guard.md" on next indented line (runner.md 2682-2683) not joined |
| 30 | maps-h-05288 | runner.md:3344 | docs/{platform,architect}/agent-coordination | ok | brace list expanded, narrative about historical docs; no patch |
| 31 | maps-h-05311 | work-state.md:1371 | [0012](0012-typed-edge-model-supersedes-deps-parent-separati | ok | relative link resolved against consumer; missing target listed in the 163 pre-existing broken links |
| 32 | maps-h-05334 | transitional-switchboard.md:34 | docs/specs/** | ok | glob of legacy tree in migration-state prose, parked; label navigation vs legacy-tree-semantic is wording only |
| 33 | maps-h-05397 | transitional-switchboard.md:108 | docs/specs | ok | whole root mention parked |
| 34 | maps-h-05398 | transitional-switchboard.md:108 | docs/architect | ok | whole root mention parked |
