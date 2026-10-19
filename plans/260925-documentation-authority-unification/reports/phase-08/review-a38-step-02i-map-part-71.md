# A38 review, step-02i mapping part 71 (behavioral-runtime-and-contract-triage, 12 entries)

- Reviewer: reviewer:sonnet-session:aaab41cb19f3eb8f0@2026-10-19
- Worktree: /home/vantt/projects/forgentX-s8-review at 74e3ecf1e (verified); author 904d0fb5c, accounting 74e3ecf1e
- Source table: step-02i-census-maps-portals-prose.json (entries); all fields of every row read; source passage and behaviour behind it read.
- Totals: 12 entries, ok 2, rework 10, needs-Lead-judgment 0.

## Evidence summary
- `.claude/skills/ui-spec/tools/build.mjs` writes only surface-registry.yaml, navigation-graph.yaml, action-registry.csv and coverage-report.md. It never touches wireframe-v2.html and never mentions herdr-web-dashboard.
- `docs/ui-spec/generated/wireframe-v2.html` is written by `.claude/skills/ui-spec/tools/interpret-wireframe.mjs` (header: "Output: generated/wireframe-v2.html"). It embeds each surface's prose via `extractProse(readFileSync(<md source>))`. So each reference in the HTML is a copy of text in a docs/ui-spec source md, and those md sources already have their own rows (maps-i-05403, 05409, 05411, 05412, 05424..05428, 05430, 05433, all cutover-patch-only).
- Stale snapshot: the System events block in the HTML (line 1363) still carries "(`docs/specs/herdr-web-dashboard.md` R1)". Its source `docs/ui-spec/15-system-events.md` no longer contains that sentence; commit 1839de60b realigned it to cite `docs/contracts/fgos-gateway-api-v1.yaml`. Regeneration drops that reference with no remap. All other prose blocks in the HTML match their md sources, apart from ASCII-box normalisation.
- Target `docs/platform/herdr-web-dashboard/spec.md` exists and has the headings the sources cite ("Answer a parked question", "Add a work item", "Edit a work item", "Business Rules").

## Rows

| Entry | Consumer:line | Verdict | Rationale |
|---|---|---|---|
| maps-i-05415 | wireframe-v2.html:807 (S03 prose) | rework | Wrong generator attribution (class A). |
| maps-i-05416 | wireframe-v2.html:898 (S04) | rework | Class A. |
| maps-i-05417 | wireframe-v2.html:968 (M01) | rework | Class A. |
| maps-i-05418 | wireframe-v2.html:1030 (M02) | rework | Class A. |
| maps-i-05419 | wireframe-v2.html:1099 (M03) | rework | Class A. |
| maps-i-05420 | wireframe-v2.html:1145 col 379 (C01) | rework | Class A. |
| maps-i-05421 | wireframe-v2.html:1145 col 1193 (C01) | rework | Class A. |
| maps-i-05422 | wireframe-v2.html:1347 (Domain rules) | rework | Class A. |
| maps-i-05423 | wireframe-v2.html:1363 (System events) | rework | Class A plus class B (stale snapshot treated as live). |
| maps-i-05424 | modals/M01-answer-question.md:21 | ok | Navigation citation with an exact retained target. The patch replaces only the complete path unit, so the "§Answer a parked question" locator stays. The target heading exists. |
| maps-i-05426 | modals/M03-add-edit-item.md:18 | ok | Same as 05424. The "§Add a work item, §Edit a work item" locators stay and both headings exist in the target. |
| maps-i-05434 | spec.config.yaml:3 | rework | Misclassified as contract-data, class C. |

## Rework by defect class
- **A. Wrong generator named, 9 rows (maps-i-05415..05423).** `sourcePath`, `role: generator` and `dispositionReason: "Step 5 generator source owns all generated rows"` point at `build.mjs`. The real producer is `interpret-wireframe.mjs` (`npm run interpret:wf`), and the retargeting path is: patch the md sources (rows listed above), then regenerate the HTML. The action `preserve-pending-behavioral-proof` is correct (do not hand-edit the generated file). Fix the generator identity and tie each row to its source-md row(s), so Step 5 traces the right tool and sources. The same attribution defect most likely affects the sibling rows 05413 and 05414 in part 70 (not reviewed here).
- **B. Stale snapshot treated as live, 1 row (maps-i-05423).** The referenced text is already gone from the source md, so there is no live reference to remap. Record it as "stale generated text, dropped by regeneration, no patch" instead of a desiredOwner mapping. Class A applies to this row as well.
- **C. Comment text over-parked as behavioral, 1 row (maps-i-05434).** Line 3 is a YAML comment ("Product source of truth: docs/specs/herdr-web-dashboard.md (tsk-54j)"). `config.mjs` reads `contract_tag`, `surface_dirs`, `cross_cutting` and `schema_path` through `yaml.load`, which discards comments. A `git grep` for "Product source" and for `spec.config.yaml` finds no reader of that text. The reason "Step 5 actual data reader must be traced" is already answered: there is none. It should be navigation / cutover-patch-only, like its sibling `docs/ui-spec/00-overview.md:13` (maps-i-05403), with the same patch unit.

## Flags checked
- Carriage/snapshot treated as live: yes, 05423 (class B).
- Migration-state sentences needing a row flip: none in this part.
- Section/rule/decision locators dropped when patched to a README: none. These rows patch to `spec.md`, and the locators sit outside the replaced unit.
