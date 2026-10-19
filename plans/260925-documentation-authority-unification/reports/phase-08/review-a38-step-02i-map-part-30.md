# A38 step-02i mapping review, part 30

Reviewer: reviewer:sonnet-session:aa15ca663645c53fb@2026-10-19
Commits: author 904d0fb5c, accounting 74e3ecf1e (worktree detached at 74e3ecf1eb9a2bc1429f50a25bb7017e240ef798, verified)
Part: 30 of 121, population preserve-pending-target, sourceTable step-02i-census-maps-portals-prose.json, 60 entries (idField edgeId)

Totals: ok 50, rework 6, needs-Lead-judgment 4; rework rate 10.0% (above the 3% threshold, so the set needs a full read; every entry here was already deep-read).

## Method

Every entry resolved from the part sourceTable by edgeId, source passage and context read, existence tested against `git ls-tree` at the input commit, successors searched in the committed tree, docs/doc-registry.json aliases and the Phase 6 draft-alias-merged-step10.json rows, line locators re-resolved against the old file headings and the new owner files, judged against L12-7, L12-10, L12-19..L12-25. Rationale wording alone is never marked rework. Every row here is action preserve-pending-target; byte-preservation holds for all rows, so no rework item risks content loss.

## Rework by defect class

- A: legacy path is retained in place outside the retiring roots (docs/specs/**, docs/architect/**), so the row should be preserve, not pending: 1 (maps-i-04731)
- D: reference inside an immutable decision-history or withdrawn-history body parked for a Step 3 patch instead of preserved: 5 (maps-i-04737, maps-i-04741, maps-i-04762, maps-i-04768, maps-i-04769)

## Needs-Lead-judgment: maps-i-04086, maps-i-04087, maps-i-04088, maps-i-04686

See rows; all four are evidence/line-locator notes inside candidate "Added in candidate" headers. Decide preserve-as-provenance vs keep parked.

## Entries

| edgeId | rule | consumer:line | reference | verdict | reason |
|---|---|---|---|---|---|
| maps-i-04056 | navigation | governance.md:96 | docs/specs/** | ok | Statement about legacy roots staying valid during migration; whole-tree glob; Step 3 semantic. |
| maps-i-04057 | navigation | governance.md:96 | docs/architect/** | ok | Same as 04056. |
| maps-i-04086 | navigation | spec.md:30 | docs/specs/platform-foundations.md:179-184 | needs-Lead-judgment | Evidence/line-locator note inside an "Added in candidate" metadata block that states its source references are "preserved as dated text". Either preserve as provenance (evidence of a past truth correction) or keep parked for Step 3 anchors; both preserve bytes. Here: evidence list of the truth correction (platform-foundations.md:179-184). |
| maps-i-04087 | line-locator-unresolved | spec.md:30 | docs/contracts/fgos-gateway-api-v1.yaml:82-599 | needs-Lead-judgment | Evidence/line-locator note inside an "Added in candidate" metadata block that states its source references are "preserved as dated text". Either preserve as provenance (evidence of a past truth correction) or keep parked for Step 3 anchors; both preserve bytes. Here: docs/contracts/fgos-gateway-api-v1.yaml:82-599 (the YAML is byte-identical at the moved owner, alias root-authorities-draft-0010, so same lines would resolve exactly; no heading exists in YAML). |
| maps-i-04088 | line-locator-unresolved | spec.md:30 | docs/contracts/fgos-gateway-api-v1.yaml:212-222 | needs-Lead-judgment | Evidence/line-locator note inside an "Added in candidate" metadata block that states its source references are "preserved as dated text". Either preserve as provenance (evidence of a past truth correction) or keep parked for Step 3 anchors; both preserve bytes. Here: yaml:212-222, same as 04087. |
| maps-i-04099 | navigation | spec.md:345 | docs/specs/platform-foundations.md#0014--kiến-trúc-giao-tiếp | ok | Anchor reference to decision 0014; 0014 exists only in docs/specs/platform-foundations.md:180, no successor; parked correctly. |
| maps-i-04107 | legacy-tree-semantic | README.md:119 | docs/architect/host-invocation-routing/ | ok | Directory link to legacy tree, "remain legacy/current sources" sentence; Step 3 semantic. |
| maps-i-04308 | legacy-tree-semantic | source-preservation-audit.md:52 | docs/architect/host-invocation-routing/ | ok | Same as 04107. |
| maps-i-04319 | navigation | intent-preservation-ledger.md:71 | docs/specs/platform-foundations.md | ok | Proof column pointing at the decision history that exists only in docs/specs/platform-foundations.md; no successor. |
| maps-i-04326 | navigation | migration-authoring-rules.md:33 | docs/specs/** | ok | Rule text naming legacy trees; Step 3 semantic. |
| maps-i-04327 | navigation | migration-authoring-rules.md:33 | docs/architect/** | ok | Same. |
| maps-i-04330 | legacy-tree-semantic | migration-authoring-rules.md:45 | docs/specs | ok | Whole legacy-tree mention; L12-24 parks it for Step 3, never path substitution. |
| maps-i-04331 | legacy-tree-semantic | migration-authoring-rules.md:45 | docs/architect | ok | Whole legacy-tree mention; L12-24 parks it for Step 3, never path substitution. |
| maps-i-04332 | legacy-tree-semantic | migration-authoring-rules.md:48 | docs/specs | ok | Whole legacy-tree mention; L12-24 parks it for Step 3, never path substitution. |
| maps-i-04333 | legacy-tree-semantic | migration-authoring-rules.md:49 | docs/architect | ok | Whole legacy-tree mention; L12-24 parks it for Step 3, never path substitution. |
| maps-i-04334 | legacy-tree-semantic | migration-authoring-rules.md:51 | docs/architect | ok | Whole legacy-tree mention; L12-24 parks it for Step 3, never path substitution. |
| maps-i-04335 | legacy-tree-semantic | migration-authoring-rules.md:55 | docs/specs | ok | Whole legacy-tree mention; L12-24 parks it for Step 3, never path substitution. |
| maps-i-04336 | legacy-tree-semantic | migration-authoring-rules.md:55 | docs/architect | ok | Whole legacy-tree mention; L12-24 parks it for Step 3, never path substitution. |
| maps-i-04337 | legacy-tree-semantic | migration-authoring-rules.md:57 | docs/architect | ok | Whole legacy-tree mention; L12-24 parks it for Step 3, never path substitution. |
| maps-i-04353 | legacy-tree-semantic | README.md:180 | docs/distribution-vision.md | ok | README sentence about the old path staying historical until redirected; owner settled in L12-25 as a Step 3 semantic sentence. |
| maps-i-04375 | navigation | code-panel-rollout-plan.md:339 | docs/architect/packaging-distribution/** | ok | Planning to-do ("Add status notes or redirects to docs/architect/packaging-distribution/**"); planning narrative per L12-24; glob parked. |
| maps-i-04547 | navigation | platform-foundations.md:17 | docs/specs/platform-foundations.md | ok | Related header list in a candidate doc; docs/specs/platform-foundations.md has no successor; consistent with the rest of the file. |
| maps-i-04551 | navigation | platform-foundations.md:42 | docs/specs/platform-foundations.md | ok | "remains the generated/curated spec projection" is a migration-state sentence; no successor. |
| maps-i-04563 | navigation | platform-foundations.md:58 | docs/specs/platform-foundations.md | ok | Law table cell; no successor for the spec projection. |
| maps-i-04565 | navigation | platform-foundations.md:81 | docs/specs/platform-foundations.md | ok | Related-docs table cell; no successor. |
| maps-i-04588 | legacy-tree-semantic | component-authority-boundary-map.md:336 | docs/specs/ | ok | Prose mention of docs/specs/ as the accepted state layer; Step 3 semantic. |
| maps-i-04621 | navigation | documentation-system-unification.md:38 | docs/specs/** | ok | Whole-tree glob with no unique target; parked, bytes preserved. |
| maps-i-04622 | navigation | documentation-system-unification.md:38 | docs/architect/** | ok | Whole-tree glob with no unique target; parked, bytes preserved. |
| maps-i-04623 | navigation | documentation-system-unification.md:56 | docs/specs/** | ok | Whole-tree glob with no unique target; parked, bytes preserved. |
| maps-i-04624 | navigation | documentation-system-unification.md:57 | docs/architect/** | ok | Whole-tree glob with no unique target; parked, bytes preserved. |
| maps-i-04625 | navigation | documentation-system-unification.md:100 | docs/specs/** | ok | Whole-tree glob with no unique target; parked, bytes preserved. |
| maps-i-04626 | navigation | documentation-system-unification.md:100 | docs/architect/** | ok | Whole-tree glob with no unique target; parked, bytes preserved. |
| maps-i-04629 | navigation | documentation-system-unification.md:179 | docs/specs/** | ok | Whole-tree glob with no unique target; parked, bytes preserved. |
| maps-i-04630 | navigation | documentation-system-unification.md:179 | docs/architect/** | ok | Whole-tree glob with no unique target; parked, bytes preserved. |
| maps-i-04631 | navigation | documentation-system-unification.md:230 | docs/specs/** | ok | Whole-tree glob with no unique target; parked, bytes preserved. |
| maps-i-04632 | navigation | documentation-system-unification.md:231 | docs/architect/** | ok | Whole-tree glob with no unique target; parked, bytes preserved. |
| maps-i-04637 | navigation | documentation-system-unification.md:870 | docs/specs/** | ok | Whole-tree glob with no unique target; parked, bytes preserved. |
| maps-i-04638 | navigation | documentation-system-unification.md:880 | docs/architect/** | ok | Whole-tree glob with no unique target; parked, bytes preserved. |
| maps-i-04639 | navigation | documentation-system-unification.md:919 | docs/specs/** | ok | Whole-tree glob with no unique target; parked, bytes preserved. |
| maps-i-04640 | navigation | documentation-system-unification.md:919 | docs/architect/** | ok | Whole-tree glob with no unique target; parked, bytes preserved. |
| maps-i-04641 | navigation | documentation-system-unification.md:970 | docs/specs/** | ok | Whole-tree glob with no unique target; parked, bytes preserved. |
| maps-i-04642 | navigation | documentation-system-unification.md:970 | docs/architect/** | ok | Whole-tree glob with no unique target; parked, bytes preserved. |
| maps-i-04643 | navigation | documentation-system-unification.md:1022 | docs/specs/** | ok | Whole-tree glob with no unique target; parked, bytes preserved. |
| maps-i-04644 | navigation | documentation-system-unification.md:1022 | docs/architect/** | ok | Whole-tree glob with no unique target; parked, bytes preserved. |
| maps-i-04646 | navigation | documentation-system-unification.md:1126 | docs/specs/** | ok | Whole-tree glob with no unique target; parked, bytes preserved. |
| maps-i-04647 | navigation | documentation-system-unification.md:1126 | docs/architect/** | ok | Whole-tree glob with no unique target; parked, bytes preserved. |
| maps-i-04658 | navigation | knowledge-registry-redesign.md:650 | docs/specs/enduser-docs-authoring.md | ok | Reference list in a proposal; docs/specs/enduser-docs-authoring.md exists, has no alias, retires with the tree; no successor. |
| maps-i-04659 | navigation | knowledge-registry-redesign.md:651 | docs/specs/enduser-docs-index.md | ok | Same as 04658 for enduser-docs-index.md. |
| maps-i-04672 | navigation | step-10-a0-coding-domain-boundary-facade-plan.md:306 | docs/architect/proposals/step-10-a0-baseline-and-inventory.m | ok | Planned artifact path that does not exist in the tree or aliases; planning list per L12-24; parked. |
| maps-i-04675 | operative-read | step-10-a0-coding-domain-boundary-facade-plan.md:318 | docs/specs/work.md | ok | docs/specs/work.md is "if present" and absent from the tree; nothing to map; parked. |
| maps-i-04676 | operative-read | step-10-a0-coding-domain-boundary-facade-plan.md:319 | docs/specs/distribution.md | ok | Operative read of docs/specs/distribution.md; only the area portal is mapped (alias step10-specs-0245) and the portal cannot replace a retained file; parked correctly. |
| maps-i-04686 | line-locator-unresolved | visibility-and-interactive-contact-herdr-spawn.md:22 | docs/specs/runner.md:1008 | needs-Lead-judgment | Evidence/line-locator note inside an "Added in candidate" metadata block that states its source references are "preserved as dated text". Either preserve as provenance (evidence of a past truth correction) or keep parked for Step 3 anchors; both preserve bytes. Here: runner.md:1008 is now RUL42 (RUL40 moved to runner/subcomponents/h-6979005beaf7/spec.md:72); stale by design. |
| maps-i-04709 | navigation | h-69197b459754.md:173 | docs/architect/agent-coordination/contracts/coordination-ses | ok | Pointer to the contract that moved into retired-engine carriage; no patch into carriage; Step 3 selects a passage in a live implementation-slice doc. |
| maps-i-04711 | navigation | h-69197b459754.md:202 | docs/architect/agent-coordination/decisions/ADR-010-interact | ok | Same as 04709 for ADR-010. |
| maps-i-04731 | navigation | h-36d872fbb0e5.md:112 | docs/distillery/porting-log.md:101 | rework | [A] docs/distillery/porting-log.md:101 resolves to a file that exists in place (distillery citations are preserved per L12-21) and the sentence is inside decision 0020 history ("Doi quyet dinh nay = supersede, khong sua tai cho"). Should be preserve, not pending. |
| maps-i-04737 | moved-target | h-36d872fbb0e5.md:809 | docs/decisions/0026-vision-orchestrator-roottask-capacity-na | rework | [D] Inside decision 0028 consequences (history). Its only successor is this same file (### 0026 at line 583) and L12-21 forbids a patch into the consumer file; the sentence is a past-tense statement of fact. Should be preserve with a note. |
| maps-i-04741 | navigation | h-36d872fbb0e5.md:1073 | docs/how-to/allowlist-a-historical-mention-in-launcher-vocab | rework | [D] Past-tense deletion list of decision 0031 (how-to removed then); history of an immutable decision record; should be preserve. |
| maps-i-04762 | navigation | h-36d872fbb0e5.md:1733 | docs/architect/agent-coordination | rework | [D] Brace-expanded docs/architect/agent-coordination reference inside decision 0062 text; decision records are superseded, never edited in place; should be preserve rather than a Step 3 "whole-unit list rewrite". |
| maps-i-04768 | navigation | h-aabefc85f0c9.md:58 | docs/architect/agent-coordination/contracts/coordination-ses | rework | [D] Body is the section titled "CoordinationSession (Lich su - da thu hoi per P4...)", a withdrawn history body; there is no operative passage to select (parked reason cannot be satisfied); should be preserve with a lookup-only carriage note. |
| maps-i-04769 | navigation | h-aabefc85f0c9.md:59 | docs/architect/agent-coordination/decisions/ADR-008-coordina | rework | [D] Same as 04768 (ADR-008 pointer inside the withdrawn CoordinationSession history body). |
