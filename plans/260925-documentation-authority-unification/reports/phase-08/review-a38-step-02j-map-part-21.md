# Review step-02j mapping part 21 (seeded-semantic-edge-sample)

- Reviewer: reviewer:sonnet-session:a82be21fa344382c0@2026-10-19
- Author commit 9650bdee6, accounting commit 6235d0151 (worktree /home/vantt/projects/forgentX-s8-review verified detached at 6235d0151)
- Part: 21, population seeded-semantic-edge-sample, report review-a38-step-02j-map-part-21.md, entries 60
- Governing rules: owner-answers L12-7, L12-10, L12-19..L12-27 (L12-26 classes 1-10)
- Method: every row read with all fields, the committed consumer passage (git show HEAD:<consumer>), enclosing heading/decision-record region, and target existence/anchors in the committed tree.

## Totals

- ok 48, rework 11, needs-Lead-judgment 1 of 60; rework 18.3% (with judgment 20.0%); limit 3%: BREACH

## Rows

| Entry | Verdict | Rationale |
|---|---|---|
| maps-j-08043 | ok | Retained docs/explanation file exists; preserved reader reference. |
| maps-j-08050 | ok | Retained docs/reference file exists; preserved. |
| maps-j-08056 | rework | Class 1 not fully fixed: "docs/specs/runner.md (ADR-0005 Runner & cô lập worker, D3/D4)" is a decision citation (decision 0005 exists at runner/decisions/h-36d872fbb0e5.md line 30, "### 0005 — Runner & cô lập worker"). Lexer saw no locator ("ADR-0005" form), so it patched to runner/README.md instead of h-36d872fbb0e5.md#0005-... Consumer is live root authority, so patch (not preserve) is the right action; only target/anchor is wrong. |
| maps-j-08063 | ok | Checker default-flag sentence; parked as Step 5 behavioral (class 9), explicit blocked status, no patch text. |
| maps-j-08073 | rework | Class 5/9 not fully fixed: sentence recounts the retired "docs/decisions/NNNN-*.md + 0000-index.md" format ("retired for good", tsk-1lv-4) = historical retirement narrative; token is a glob that resolves to retained docs/decisions/ (desiredOwner says so). Should be preserve; instead parked pending-target "no unique exact mapping". |
| maps-j-08084 | ok | repo/ kept; docs/architecture-manifest.json is a retained root file; preserved. |
| maps-j-08085 | rework | NEW class: illustrative example path "(vd docs/how-to/x.md)" is a placeholder, not a reference. Parked pending-target with a Step 3 successor lookup that can never resolve. Should be preserve (cf. L12-21 template-placeholder rule; docs/how-to/ is retained). |
| maps-j-08089 | ok | repo/ label kept; retained docs/how-to/ directory; preserved. |
| maps-j-08090 | ok | Retained docs/explanation/ directory; preserved. |
| maps-j-08091 | ok | Retained docs/decisions/ (index.md) directory; live description of alternative location; preserved. |
| maps-j-08113 | ok | Root authority docs/platform-foundations.md retained (class 3), §L7 locator needs no patch; preserved. |
| maps-j-08121 | ok | Retained docs/history file exists; historical decision citation; preserved. |
| maps-j-08123 | rework | Class 5 not fully fixed: edge sits in decision record "### 0035" "#### Quyết định" of docs/specs/platform-foundations.md (line 310); decision-record bodies are preserved, never patched. Secondary class 1: "D-ADR0030" is a decision locator (decision 0030, h-36d872fbb0e5.md line 921), not an area-README reference. |
| maps-j-08130 | ok | Retained docs/history file exists; preserved. |
| maps-j-08142 | rework | Class 6 not fully fixed: sentence "Khi mục này mâu thuẫn với docs/specs/distribution.md, đọc portal ...; docs/specs/distribution.md hiện là legacy/generated-curated source trong lúc migration" is migration-state text (and a conflict-precedence rule). Patching the legacy name to the portal README makes it self-referential (the same bullet is the portal). Needs Phase 9 row-flip/park, not a path patch. |
| maps-j-08145 | ok | Whole legacy-tree mention (class 6); parked for Step 3, blocked status, no patch. |
| maps-j-08148 | ok | Retained root authority docs/coexistence.md; preserved. |
| maps-j-08150 | ok | Locator §Dev checkout shell helpers resolves only to spec.md line 578, inside "Retained Distribution Source Detail" (carriage, starts line 459); parked with non-executable successor note is correct. |
| maps-j-08154 | ok | enduser-docs-index has no Phase 6 destination; parked per P8-DOC-GAP-02, blocked. |
| maps-j-08155 | ok | Retained docs/decisions/index.md; preserved. |
| maps-j-08161 | ok | Plain "spec: docs/specs/runner.md" with no locator -> runner/README.md (split area); cutover-patch-only, proposed-only. |
| maps-j-08162 | ok | Same as 08161 (second occurrence on line 28, different column); README default correct. |
| maps-j-08166 | rework | Class 1 not fully fixed: "spec: docs/specs/work-state.md §sổ verb" maps to the registry section ("Sổ verb máy-đọc (manifest)"), which exists as work-state/contracts/cli-io-contract.md "## 7. Machine-Readable Verb Registry" (non-carriage; L12-26 names this file for envelope/verb-registry locators). Parked "no unique live passage" is wrong; should be a patch to cli-io-contract.md#7-machine-readable-verb-registry. |
| maps-j-08170 | ok | Plain spec pointer -> docs/platform/herdr-web-dashboard/spec.md (consistent with L12-22 herdr mapping); patch-only. |
| maps-j-08171 | ok | docs/reference file moved to docs/knowledge/...; verified missing at HEAD and successor exists; non-executable successor note, blocked. |
| maps-j-08180 | ok | enduser-docs-index gap; parked per P8-DOC-GAP-02. |
| maps-j-08196 | ok | Plain spec pointer -> runner/README.md; patch-only. |
| maps-j-08204 | ok | enduser-docs-index gap; parked per P8-DOC-GAP-02. |
| maps-j-08214 | ok | Retained docs/how-to file exists; preserved. |
| maps-j-08218 | ok | Deleted docs/history spike evidence citation (historical); preserved with non-executable note. |
| maps-j-08221 | ok | Retained docs/history file exists; citation inside rule text "per 0032"; preserved. |
| maps-j-08222 | ok | docs/history/<id>/ is the shipped external-project writer convention (L12-10); preserved. |
| maps-j-08236 | ok | Deleted history witness cited as evidence; preserved with note. |
| maps-j-08244 | ok | Deleted history benchmark witness; preserved with note. |
| maps-j-08246 | ok | Retained docs/decisions/index.md; preserved. |
| maps-j-08251 | ok | Section "CoordinationSession (Lịch sử - đã thu hồi)"; sole holder of coordination-session.md is retired-engine carriage -> parked (class 9), no patch. |
| maps-j-08260 | needs-Lead-judgment | Same retired-history section (line 1387 heading "Lịch sử - đã thu hồi per P4", framing note "Mục dưới đây giữ bối cảnh thiết kế lịch sử của Step 08") yet this one is patched to platform/agent-coordination/architecture/work-integration.md (exists, non-carriage) while siblings 08251/08261 are parked. Lead to decide whether the framing sentence makes the whole section historical (class 5: then preserve) or live navigation (then patch is right). |
| maps-j-08261 | ok | ADR-010 exists only in retired-engine carriage in the candidate tree; parked, no patch. |
| maps-j-08262 | ok | Heading text of a retired-decisions section; retained docs/decisions/; preserved. |
| maps-j-08264 | ok | Retained docs/history file exists; preserved. |
| maps-j-08267 | ok | Retained docs/architecture-manifest.json; preserved. |
| maps-j-08268 | rework | Class 1/2 not fully fixed: retired ADR file path "docs/decisions/0021-...md" (file absent at HEAD) names decision 0021, present at runner/decisions/h-36d872fbb0e5.md line 211. Successor note says "unresolved" / successor null although the real successor is findable. |
| maps-j-08270 | ok | Retained docs/decisions/ directory in decision-body prose; preserved. |
| maps-j-08271 | rework | Class 1/2 not fully fixed: "docs/decisions/0025" names decision 0025 (h-36d872fbb0e5.md line 511); successor null / "unresolved" is wrong. |
| maps-j-08285 | ok | Root authority docs/platform-foundations.md; preserved. |
| maps-j-08293 | rework | Class 1/2 not fully fixed: "0028 - docs/decisions/0028-...md" in a decision Tham chieu list; decision 0028 is at h-36d872fbb0e5.md line 757; successor null / "unresolved" is wrong (siblings 0026 line 583, 0029 line 819 likewise). |
| maps-j-08297 | ok | Retained docs/history file exists; preserved. |
| maps-j-08299 | ok | Moved to docs/knowledge/... (name drift); verified missing at old path, successor exists; non-executable successor note. |
| maps-j-08301 | ok | docs/history/<id>/ placeholder convention; preserved. |
| maps-j-08306 | ok | Retained docs/history directory exists; preserved. |
| maps-j-08307 | ok | Placeholder convention path; preserved. |
| maps-j-08334 | ok | Distillery is single-destination (README + one spec.md) -> docs/platform/distillery/spec.md; plain pointer patch-only. |
| maps-j-08341 | ok | Example docsRef value in data dictionary; preserved. |
| maps-j-08344 | ok | Retained docs/distillery deep-dive exists; preserved. |
| maps-j-08347 | ok | Retained docs/history file exists; preserved. |
| maps-j-08348 | ok | Retained root authority docs/coexistence.md; preserved. |
| maps-j-08351 | ok | Past action ("Da dong") citing deleted history dir; preserved with note. |
| maps-j-08362 | rework | Class 5 not fully fixed: line 1841 is inside decision record "### 0024" "#### Boi canh" (decision-record body) and must be preserved. Also class 1: wrapped locator "Data\nDictionary #4" missed (loc=[]), so it maps to work-state README instead of spec.md#3-work-item-data-dictionary. |
| maps-j-08364 | rework | Class 5 not fully fixed: line 1887 is inside decision record "### 0027" "#### Boi canh" and cites "dong 61 / dong 1070" of the legacy file (line-range citation in historical text; line 61 is no longer Data Dictionary #21). Must be preserve, not a patch. |
| maps-j-08366 | ok | Root authority docs/platform-foundations.md; preserved. |

## Rework by defect class (all L12-26 classes not fully fixed; none NEW except one)

- Class 1 (locators): 08056 (ADR-0005 form), 08166 (§sổ verb to cli-io-contract §7), 08362 (line-wrapped "Data Dictionary #4"), 08123 (D-ADR0030, secondary).
- Class 1/2 (retired ADR file paths docs/decisions/00NN-*.md carry a findable successor, the 00NN heading in runner/decisions/h-36d872fbb0e5.md): 08268, 08271, 08293.
- Class 5 (decision-record bodies patched, or retirement narrative not preserved): 08123, 08362, 08364, 08073. Judgment 08260 (retired-history section framing).
- Class 6 (migration-state sentence patched): 08142.
- Class 9 (glob resolved to directory but action not preserve): 08073.
- NEW: 08085 (illustrative placeholder example path parked as pending target).
