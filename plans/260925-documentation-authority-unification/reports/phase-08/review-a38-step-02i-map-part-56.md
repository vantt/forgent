# A38 review, step-02i mapping part 56

- Reviewer: reviewer:sonnet-session:a42cc4fcd145f7473@2026-10-19
- Commits: author `904d0fb5c`, accounting `74e3ecf1e` (worktree HEAD verified `74e3ecf1eb9a2bc1429f50a25bb7017e240ef798`, read-only)
- Part: 56 (behavioral-runtime-and-contract-triage), 60 entries, sourceTable `step-02i-census-maps-portals-prose.json`
- Basis: read every row field (role, rule, cutoverAction, desiredOwner, parkedReason, successorNote, patch), the source line and its surrounding block, and the code/generator/contract behaviour behind each row.

## Evidence summary

- 19 rows are `docs/decisions/index.md` generated rows (same generator `src/report/decision-index.mjs`, parked for Step 5, no executable text). Rows 1315/1316 cite `docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md` with section numbers in the surrounding text (3.3, 4, 8, 13); the mapped carrier `docs/platform/proposals/...` exists and preserves those headings (`### 3.3`, `## 13.`), so no section locator is lost; it is a non-canonical carrier, consistent with how the same ref is mapped census-wide (6 rows) and with L12-20.
- 41 rows are under `docs/distillery/**`. Read each source line. Report rows (`distill-bee-inventory-*`) describe bee/beegog skill behaviour (`bee backlog render --write`, `docs/specs/<area>.md#R7`, `docs/specs/doctrine-layer.md R17`, `docs/history/<feature>/plan.md`) in the upstream project, i.e. external-project citations and dated snapshots (L12-10, L12-21); preserve is right. `beehive.md` and `state.md` lines describe beehive's own docs layout; preserve is right. `deep-dives/parallel-decomposition-and-merge.md` (dated 2026-08-05) cites fgOS's `docs/specs/work-state.md` at a line (~1022): the reason string "upstream citation" is wrong for that one row, but the action is right because the document is a dated analysis snapshot with a point-in-time line locator (wording only, not rework). `repo/docs/backlog.md` (maps-i-01332) is a retained in-place file.
- No comment-as-data, no history treated as live, no retained path wrongly patched, no locator dropped.

## Verdicts

| Entry | Consumer:line | Verdict | Rationale |
|---|---|---|---|
| maps-i-01312 | docs/decisions/index.md:38 | ok | generated decision-index row; generator exists, parked Step 5, no hand patch; target/anchor check passes. |
| maps-i-01313 | docs/decisions/index.md:39 | ok | generated decision-index row; generator exists, parked Step 5, no hand patch; target/anchor check passes. |
| maps-i-01314 | docs/decisions/index.md:40 | ok | generated decision-index row; generator exists, parked Step 5, no hand patch; target/anchor check passes. |
| maps-i-01315 | docs/decisions/index.md:41 | ok | generated decision-index row; generator exists, parked Step 5, no hand patch; target/anchor check passes. |
| maps-i-01316 | docs/decisions/index.md:42 | ok | generated decision-index row; generator exists, parked Step 5, no hand patch; target/anchor check passes. |
| maps-i-01317 | docs/decisions/index.md:48 | ok | generated decision-index row; generator exists, parked Step 5, no hand patch; target/anchor check passes. |
| maps-i-01318 | docs/decisions/index.md:49 | ok | generated decision-index row; generator exists, parked Step 5, no hand patch; target/anchor check passes. |
| maps-i-01319 | docs/decisions/index.md:50 | ok | generated decision-index row; generator exists, parked Step 5, no hand patch; target/anchor check passes. |
| maps-i-01320 | docs/decisions/index.md:51 | ok | generated decision-index row; generator exists, parked Step 5, no hand patch; target/anchor check passes. |
| maps-i-01321 | docs/decisions/index.md:52 | ok | generated decision-index row; generator exists, parked Step 5, no hand patch; target/anchor check passes. |
| maps-i-01322 | docs/decisions/index.md:53 | ok | generated decision-index row; generator exists, parked Step 5, no hand patch; target/anchor check passes. |
| maps-i-01323 | docs/decisions/index.md:54 | ok | generated decision-index row; generator exists, parked Step 5, no hand patch; target/anchor check passes. |
| maps-i-01324 | docs/decisions/index.md:55 | ok | generated decision-index row; generator exists, parked Step 5, no hand patch; target/anchor check passes. |
| maps-i-01325 | docs/decisions/index.md:56 | ok | generated decision-index row; generator exists, parked Step 5, no hand patch; target/anchor check passes. |
| maps-i-01326 | docs/decisions/index.md:57 | ok | generated decision-index row; generator exists, parked Step 5, no hand patch; target/anchor check passes. |
| maps-i-01327 | docs/decisions/index.md:58 | ok | generated decision-index row; generator exists, parked Step 5, no hand patch; target/anchor check passes. |
| maps-i-01328 | docs/decisions/index.md:59 | ok | generated decision-index row; generator exists, parked Step 5, no hand patch; target/anchor check passes. |
| maps-i-01329 | docs/decisions/index.md:60 | ok | generated decision-index row; generator exists, parked Step 5, no hand patch; target/anchor check passes. |
| maps-i-01330 | docs/decisions/index.md:61 | ok | generated decision-index row; generator exists, parked Step 5, no hand patch; target/anchor check passes. |
| maps-i-01332 | docs/distillery/deep-dives/herdr-vs-tmux-observation.md:142 | ok | external bee/beehive citation in dated distillery text; no fgOS owner, preserve (L12-10, L12-21). |
| maps-i-01333 | docs/distillery/deep-dives/parallel-decomposition-and-merge.md:46 | ok | preserve correct (dated analysis snapshot with line locator); rule label external-project is imprecise (fgOS citation), wording only. |
| maps-i-01336 | docs/distillery/deep-dives/state.md:37 | ok | external bee/beehive citation in dated distillery text; no fgOS owner, preserve (L12-10, L12-21). |
| maps-i-01344 | docs/distillery/reports/distill-bee-inventory-2026-07-18.md:47 | ok | external bee/beehive citation in dated distillery text; no fgOS owner, preserve (L12-10, L12-21). |
| maps-i-01346 | docs/distillery/reports/distill-bee-inventory-2026-07-18.md:145 | ok | external bee/beehive citation in dated distillery text; no fgOS owner, preserve (L12-10, L12-21). |
| maps-i-01355 | docs/distillery/reports/distill-bee-inventory-2026-07-28-group-a.md:45 | ok | external bee/beehive citation in dated distillery text; no fgOS owner, preserve (L12-10, L12-21). |
| maps-i-01356 | docs/distillery/reports/distill-bee-inventory-2026-07-28-group-a.md:45 | ok | external bee/beehive citation in dated distillery text; no fgOS owner, preserve (L12-10, L12-21). |
| maps-i-01357 | docs/distillery/reports/distill-bee-inventory-2026-07-28-group-a.md:45 | ok | external bee/beehive citation in dated distillery text; no fgOS owner, preserve (L12-10, L12-21). |
| maps-i-01358 | docs/distillery/reports/distill-bee-inventory-2026-07-28-group-a.md:45 | ok | external bee/beehive citation in dated distillery text; no fgOS owner, preserve (L12-10, L12-21). |
| maps-i-01359 | docs/distillery/reports/distill-bee-inventory-2026-07-28-group-a.md:46 | ok | external bee/beehive citation in dated distillery text; no fgOS owner, preserve (L12-10, L12-21). |
| maps-i-01360 | docs/distillery/reports/distill-bee-inventory-2026-07-28-group-a.md:50 | ok | external bee/beehive citation in dated distillery text; no fgOS owner, preserve (L12-10, L12-21). |
| maps-i-01367 | docs/distillery/reports/distill-bee-inventory-2026-07-28-group-a.md:168 | ok | external bee/beehive citation in dated distillery text; no fgOS owner, preserve (L12-10, L12-21). |
| maps-i-01368 | docs/distillery/reports/distill-bee-inventory-2026-07-28-group-a.md:170 | ok | external bee/beehive citation in dated distillery text; no fgOS owner, preserve (L12-10, L12-21). |
| maps-i-01370 | docs/distillery/reports/distill-bee-inventory-2026-07-28-group-a.md:175 | ok | external bee/beehive citation in dated distillery text; no fgOS owner, preserve (L12-10, L12-21). |
| maps-i-01373 | docs/distillery/reports/distill-bee-inventory-2026-07-28-group-a.md:247 | ok | external bee/beehive citation in dated distillery text; no fgOS owner, preserve (L12-10, L12-21). |
| maps-i-01374 | docs/distillery/reports/distill-bee-inventory-2026-07-28-group-a.md:247 | ok | external bee/beehive citation in dated distillery text; no fgOS owner, preserve (L12-10, L12-21). |
| maps-i-01375 | docs/distillery/reports/distill-bee-inventory-2026-07-28-group-a.md:247 | ok | external bee/beehive citation in dated distillery text; no fgOS owner, preserve (L12-10, L12-21). |
| maps-i-01379 | docs/distillery/reports/distill-bee-inventory-2026-07-28-group-a.md:260 | ok | bee description of its own `docs/history/<feature>/plan.md` layout; docs/history retained, preserve (L12-22). |
| maps-i-01381 | docs/distillery/reports/distill-bee-inventory-2026-07-28-group-b.md:18 | ok | bee description of its own `docs/history/<feature>/plan.md` layout; docs/history retained, preserve (L12-22). |
| maps-i-01384 | docs/distillery/reports/distill-bee-inventory-2026-07-28-group-b.md:30 | ok | external bee/beehive citation in dated distillery text; no fgOS owner, preserve (L12-10, L12-21). |
| maps-i-01389 | docs/distillery/reports/distill-bee-inventory-2026-07-28-group-b.md:89 | ok | bee description of its own `docs/history/<feature>/plan.md` layout; docs/history retained, preserve (L12-22). |
| maps-i-01391 | docs/distillery/reports/distill-bee-inventory-2026-07-28-group-b.md:174 | ok | external bee/beehive citation in dated distillery text; no fgOS owner, preserve (L12-10, L12-21). |
| maps-i-01393 | docs/distillery/reports/distill-bee-inventory-2026-07-28-group-b.md:197 | ok | external bee/beehive citation in dated distillery text; no fgOS owner, preserve (L12-10, L12-21). |
| maps-i-01394 | docs/distillery/reports/distill-bee-inventory-2026-07-28-group-b.md:197 | ok | external bee/beehive citation in dated distillery text; no fgOS owner, preserve (L12-10, L12-21). |
| maps-i-01395 | docs/distillery/reports/distill-bee-inventory-2026-07-28-group-b.md:197 | ok | external bee/beehive citation in dated distillery text; no fgOS owner, preserve (L12-10, L12-21). |
| maps-i-01396 | docs/distillery/reports/distill-bee-inventory-2026-07-28-group-b.md:197 | ok | external bee/beehive citation in dated distillery text; no fgOS owner, preserve (L12-10, L12-21). |
| maps-i-01397 | docs/distillery/reports/distill-bee-inventory-2026-07-28-group-b.md:201 | ok | external bee/beehive citation in dated distillery text; no fgOS owner, preserve (L12-10, L12-21). |
| maps-i-01399 | docs/distillery/reports/distill-bee-inventory-2026-07-28-group-b.md:212 | ok | external bee/beehive citation in dated distillery text; no fgOS owner, preserve (L12-10, L12-21). |
| maps-i-01400 | docs/distillery/reports/distill-bee-inventory-2026-07-28-group-b.md:219 | ok | external bee/beehive citation in dated distillery text; no fgOS owner, preserve (L12-10, L12-21). |
| maps-i-01401 | docs/distillery/reports/distill-bee-inventory-2026-07-28-group-b.md:219 | ok | external bee/beehive citation in dated distillery text; no fgOS owner, preserve (L12-10, L12-21). |
| maps-i-01403 | docs/distillery/reports/distill-bee-inventory-2026-07-28-group-b.md:227 | ok | external bee/beehive citation in dated distillery text; no fgOS owner, preserve (L12-10, L12-21). |
| maps-i-01404 | docs/distillery/reports/distill-bee-inventory-2026-07-28-group-b.md:228 | ok | external bee/beehive citation in dated distillery text; no fgOS owner, preserve (L12-10, L12-21). |
| maps-i-01405 | docs/distillery/reports/distill-bee-inventory-2026-07-28-group-b.md:238 | ok | external bee/beehive citation in dated distillery text; no fgOS owner, preserve (L12-10, L12-21). |
| maps-i-01407 | docs/distillery/reports/distill-bee-inventory-2026-07-28-group-b.md:243 | ok | external bee/beehive citation in dated distillery text; no fgOS owner, preserve (L12-10, L12-21). |
| maps-i-01415 | docs/distillery/reports/distill-bee-inventory-2026-07-28-group-b.md:283 | ok | external bee/beehive citation in dated distillery text; no fgOS owner, preserve (L12-10, L12-21). |
| maps-i-01416 | docs/distillery/reports/distill-bee-inventory-2026-07-28-group-b.md:283 | ok | external bee/beehive citation in dated distillery text; no fgOS owner, preserve (L12-10, L12-21). |
| maps-i-01427 | docs/distillery/reports/distill-bee-inventory-2026-07-28-group-c.md:193 | ok | external bee/beehive citation in dated distillery text; no fgOS owner, preserve (L12-10, L12-21). |
| maps-i-01429 | docs/distillery/reports/distill-bee-inventory-2026-07-28-group-c.md:204 | ok | external bee/beehive citation in dated distillery text; no fgOS owner, preserve (L12-10, L12-21). |
| maps-i-01430 | docs/distillery/reports/distill-bee-inventory-2026-07-28-group-c.md:205 | ok | external bee/beehive citation in dated distillery text; no fgOS owner, preserve (L12-10, L12-21). |
| maps-i-01437 | docs/distillery/sources/beehive.md:130 | ok | external bee/beehive citation in dated distillery text; no fgOS owner, preserve (L12-10, L12-21). |
| maps-i-01438 | docs/distillery/sources/beehive.md:130 | ok | external bee/beehive citation in dated distillery text; no fgOS owner, preserve (L12-10, L12-21). |

## Totals

ok 60, rework 0, needs-Lead-judgment 0.

Rework defect classes: none.
