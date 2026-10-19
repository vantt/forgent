# Review step-02j mapping part 22 (seeded-semantic-edge-sample)

- Reviewer: reviewer:sonnet-session:a82be21fa344382c0@2026-10-19
- Author commit 9650bdee6, accounting commit 6235d0151 (worktree /home/vantt/projects/forgentX-s8-review verified detached at 6235d0151)
- Part: 22, population seeded-semantic-edge-sample, report review-a38-step-02j-map-part-22.md, entries 15
- Governing rules: owner-answers L12-7, L12-10, L12-19..L12-27 (L12-26 classes 1-10)
- Method: every row read with all fields, the committed consumer passage (git show HEAD:<consumer>), enclosing heading/decision-record region, and target existence/anchors in the committed tree.

## Totals

- ok 12, rework 3, needs-Lead-judgment 0 of 15; rework 20.0% (with judgment 20.0%); limit 3%: BREACH

## Rows

| Entry | Verdict | Rationale |
|---|---|---|
| maps-j-08375 | rework | Class 1 not fully fixed: "supersede mot phan 0048 §2 va 0049 §4 cua [runner.md]" cites decisions 0048/0049, both present in runner/decisions/h-36d872fbb0e5.md (lines 1530/1541). Parked "locator lacks unique live passage" is wrong; target file holds the content (one link covers two decisions, so file-level or a note is needed, not a README). Lead may prefer park-with-note because one link cannot carry two anchors. |
| maps-j-08380 | ok | Consumer-relative link ../platform-foundations.md resolves to retained root authority; preserved. |
| maps-j-08381 | ok | Template placeholder link; retained docs/templates; preserved. |
| maps-j-08383 | ok | Template placeholder; preserved. |
| maps-j-08415 | ok | Switchboard retained-source cell; row flip pending (status only for retained root path); correct class 6 handling. |
| maps-j-08417 | ok | Switchboard row flip; glob token in authority cells; correct. |
| maps-j-08424 | ok | Switchboard owner cell -> flip to docs/platform/herdr-web-dashboard/spec.md at Phase 9; row flip, no path patch. |
| maps-j-08434 | ok | docs/ui-spec path stays valid; status-only flip. |
| maps-j-08438 | ok | docs/reading-map.md root retained; status-only flip. |
| maps-j-08449 | ok | Row flip; note: p9 text is the generic string, platform-foundations should be status-only; non-actionable. |
| maps-j-08455 | rework | Class 6/9 not fully fixed: sentence "Edits under legacy roots (docs/specs, docs/architect) require a reviewed exception in check-legacy-docs-ratchet..." is migration-state / checker-scope text about the retiring roots. Token docs/architect is a retiring root, yet rule says "committed retained file". Sibling 08454 (docs/specs) same. Should be park/row-flip (Step 3/5), not preserved retained-reference. |
| maps-j-08473 | ok | Generated wireframe-v2.html; parked Step 5 generator (class 4); no patch. |
| maps-j-08486 | rework | Class 1 not fully fixed: locator "§View a task's detail" was truncated at the apostrophe ("§View a task"), so it was parked. docs/platform/herdr-web-dashboard/spec.md has "### View a task's detail" (line 128, non-carriage); should be a patch to spec.md#view-a-tasks-detail. |
| maps-j-08487 | ok | Example docsRef in a wireframe mock; deleted history target; preserved. |
| maps-j-08495 | ok | Retained docs/reference/ directory in a mapping table; preserved. |

## Rework by defect class

- Class 1 (locators): 08375 (decisions 0048/0049 present in runner h-36d872fbb0e5.md; parked wrongly), 08486 (locator truncated at apostrophe; spec.md has the heading).
- Class 6/9 (legacy-root tokens in a migration/checker-scope sentence classified as retained files): 08455 (and sibling 08454).
- No NEW class.
