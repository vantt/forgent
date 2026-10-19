# Step 3 wave 1 review, part p02

Author pin `ae141550c2e022310de7a0efea757580c0b2479f`, read at the detached worktree `8ab390227`. Elapsed review time is about 25 minutes (estimate). I did not run the checker or any probe. I applied each record diff to a scratch copy with `patch`, and all three apply cleanly.

| File | Record | file digest | diff sha256 |
|---|---|---|---|
| `docs/architect/component-boundary/README.md` | `batch-005.jsonl:1` | 710ede7a... | 733826cd... |
| `docs/architect/domainization/README.md` | `batch-006.jsonl:1` | bf4126c6... | 7fcdbf59... |
| `docs/architect/proposals/component-authority-boundary-map.md` | `batch-008.jsonl:2` | f3d6d5de... | 9256e109... |

I read each source whole at the pin. I read the record's edges, `checks`, anchors, `descriptionTruth` and `resolutionSearches`. At the pin I read the targets `docs/platform/component-boundary.md` (whole outline plus §1-§6 and the carriage headings), `host-invocation-routing/spec.md`, `architecture/node-to-rust-migration.md`, `packaging-distribution/README.md`, `agent-coordination/{README,vision}.md`, the four `architecture/*.md` files, `system-overview/spec.md` and `domainization/architecture/domainization.md`. I also ran `git grep` for `DispatchResolverPort`, `domainization` and `component-boundary-advisory` over docs/platform, knowledge, reference and tutorials.

## Verdicts

| File | Set | Edges | Verdict |
|---|---|---:|---|
| component-boundary/README.md | batch-005 | 28 (24+4) | **rework** |
| domainization/README.md | batch-006 | 6 | **ok** (one Lead-judgment question, none blocking) |
| proposals/component-authority-boundary-map.md | batch-008 | 25 (15+10) | **needs-Lead-ruling**. It becomes rework if the Lead rules the missed leaf references in scope. |

Per-set A51 counts:
- batch-005: 1 reviewed, 1 rework.
- batch-006: 1 reviewed, 0 rework.
- batch-008: 1 reviewed, rework 0, or 1 if ruling R-2 below comes out "in scope".

batch-005 has one file in the set, so a breach adds no file.

## 1. `docs/architect/component-boundary/README.md` (rework)

I reviewed all 28 edges: 24 inventory plus 4 added (L157, L158, L159, L160). Dispositions are 17 patch, 7 park and 4 preserve.

### Outcome defects

**D1. The advisory edges 725 (L24), 730 (L85) and added L157 patch to a target whose live part does not hold the cited claim.**
- Edges: `maps-j-00725`, `maps-j-00730`, `author-wave1-docs-architect-component-boundary-README-L157C2`.
- Rules: L12-31(1) anchor precision, the digest rule on carriage versus live holders, and "never H1 when a narrower holder exists".
- What the source says:
  - L24 and L85 point at "Component Boundary Advisory".
  - L85-102 says it is "the vision document for component responsibility, bounded context, and authority boundary".
  - It adds "asks whether fgOS is split at the right conceptual boundaries ..." and "Use this document when deciding: Coding Domain owning enough ...".
  - L157 says it "defines the conceptual map".
- What the target holds, in `docs/platform/component-boundary.md` at the pin:
  - The advisory's content exists only under the heading `## Added in candidate: component-boundary-advisory source carriage` (line 117, through line 1184).
  - The live parts say the opposite of a replacement. §2 (lines 38-48) says "The current detailed source remains" the advisory file. §4 (line 64) says "compact navigation surface, not a full replacement for the advisory docs".
- Record problems:
  - Edge 725's whole-file justification says "no carriage subsection supplies the redirected claim". That is false for this target.
  - Edge 730 and edge L157 anchor on the H1 `component-boundary`. That section runs from line 1 to line 1641 and swallows the carriage.
  - 725 uses no anchor, and 730 and L157 use the H1. The three edges cite the same claim holder but are not consistent.
- Internal inconsistency:
  - The same file's edges 726, 732 and L158 (`repo-layout-vision.md`) are parked as carriage-only. That is correct, and its carriage heading is at line 1420 of the same target.
  - The advisory is in exactly the same position (carriage heading at line 117), yet it is patched.
- Required correction (the direction needs a Lead ruling, see R-1):
  - (a) Park 725, 730 and L157 as phase9-carry, like 726, 732 and L158. The reason is that the advisory's vision, bounded-context and authority claims are present only in carriage.
  - (b) Or, if the Lead accepts the compact live map as the holder, anchor all three edges on the `## 4. Current High-Level Components` heading (slug `4-current-high-level-components`, as edge 892 in domainization does). In that case the descriptive text at L89-102 must also be parked or rewritten, because it describes the full advisory.
  - Do not keep a whole-file or H1 patch with the "no carriage subsection" justification.

**D2. L162 `packaging-distribution/README.md` is a legacy reference with no edge, inside a paragraph the diff rewrites.**
- Source lines: `component-boundary-advisory.md` ... `packaging-distribution/README.md` (L157-164, one paragraph).
- Rule: L12-32(4) and the digest line "every missed reference as authorAddedEdge, bare basenames included".
- Details:
  - L162 names the retiring `docs/architect/packaging-distribution/README.md`. That file is a "historical redirect" to `docs/platform/packaging-distribution/README.md`.
  - The same paragraph's L157, L159 and L160 are patched to `../../platform/...` paths.
  - After the diff, L162 stays a basename-form path and the paragraph is mixed. I confirmed this on the patched output.
- Why the scanner missed it: the checker's partial-root scan matches `specs/<name>.md` and `architect/<name>.md`, and `packaging-distribution/README.md` fits neither form.
- Required correction: add an `authorAddedEdge` for L162, patched to `docs/platform/packaging-distribution/README.md` (the same target as 729), or parked with the paragraph.

**D3. The L157-L164 paragraph needs one disposition, and the patch shape needs a decision.**
- The paragraph is a single list-of-sentences unit.
  - L157, L159 and L160 are patched. L158 is parked. L162 has no edge.
  - The diff turns code-span basenames into code-span relative paths, for example `` `../../platform/component-boundary.md#component-boundary` defines the conceptual map. ``
  - Focus item: a "basename label" in a code span becomes a long path by isolated replacement, next to an untouched `repo-layout-vision.md`.
- Required correction: after D1 and D2, give the paragraph one consistent outcome. Either replace all of the paragraph's leaves with one chosen form, or park the whole paragraph as description-rewrite. A code-span path with a `#component-boundary` fragment should not be authored.

### Record-text and Lead-judgment notes (not outcome defects)
- Hit groups for 725, 730 and L157 are marked `citation-only` (carriage 2, live 3). The carriage section containing the advisory body is not counted separately. This matters for D1.
- 727, 733 and L159 patch to `host-invocation-routing/spec.md` as a whole-file claim.
  - Its live §3-§4 hold the entry paths and the InvocationService, Router and provider chain.
  - The label "Operation Provider Router" appears only in the retained-source section of that spec.
  - I judge this acceptable. It is weaker than the `provider-routing.md` slice for the router-selection claim.
- 728, 734 and L160 patch to `node-to-rust-migration.md`.
  - The source says to use it to decide "which fgos verb clusters are ready to become native Rust providers".
  - The target §3 sends those lists to `../history/host-invocation-baseline.md` and says they need a fresh scan.
  - I judge this a minor partial holder. I am not asking for a change.
- 741 (agent-coordination portal) is patched whole-file.
  - The source gloss is "reading entry for the Agent Coordination architecture set". The target README now says "Current-owner navigation; former coordination engine retired".
  - I accept it as a portal pointer. The Lead may want the gloss kept under description-rewrite, like the 743 park.
- 742 (Foundation Vision) is patched to `#authority-and-reading-rule` (lines 25-50). See defect D4.
- 744-747 are anchored on their enclosing heading (H1 or section), and the anchors are acceptable.
  - Edge 744's claim spans three peer sections (Execution Chain, Invariants, Failure Domains), so the H1 is the correct common parent.
  - Edge 745 anchors `## Responsibility`, which holds the provider/model/tier/mechanism/policy-check statement.
  - Edge 746 anchors `## Confidence Boundaries`, and edge 747 anchors `## Core Invariant`. Both are accepted.

**D4. Edge 742: the anchor is too narrow for the combined claim.**
- Edge `maps-j-00742`, L219.
- Source claim: "foundation/domain split, runtime contracts, and small-core constraints".
- Target facts: `## Authority And Reading Rule` (lines 25-50) covers the foundation-versus-domain boundary only. Runtime contracts are V-004 (line 159) under `## Accepted Vision Decisions`. Small core is V-011 (line 235) in the same section. Foundation and domain responsibilities are at lines 255 and 270.
- Rule: combined claims across peer sections use the nearest common parent. Here that is the whole file or the H1 `agent-coordination-foundation-vision`, with a recorded whole-file justification.
- Required correction: retarget the anchor, or drop the anchor, for 742.

### Edges verified ok
- Preserves 735 (architecture-map), 737 (platform-foundations), 738 (work-item-lifecycle-vision) and 739 (distribution-vision). All four exist at the pin, are outside the retiring trees, and have no alias. The alias table has no entries and the doc-registry has none for these names.
- Parks 724, 731 and 740 (domainization): the candidate is a source snapshot (`Source snapshot retained`), and `git grep` finds no live holder.
- Park 743 (System Context): the file exists only under `history/retired-engine/` at the pin.
- Patches 727, 728, 729, 733, 734, 736 and 741 (Lead question R-3 below) and 744-747 are correct, and the relative paths resolve.
- The diff applies cleanly and each hunk matches its edge.

## 2. `docs/architect/domainization/README.md` (ok)

I reviewed all 6 edges: 1 patch (892), 5 preserve (888-891 and 893).

- 892, patch (L26 to `docs/platform/component-boundary.md#4-current-high-level-components`).
  - The source claim is "system-level component and authority map".
  - Live §4 is that map. It is explicitly a compact surface, and it covers the domain row.
  - The anchor is correct.
  - It depends on how the Lead rules D1. If the Lead decides that "Component Boundary Advisory" pointers should park, this one stays correct because its claim is the system-level map, not the vision document.
- 888-891 (Related header on L8): preserved as Related-header lineage with successor notes. This follows L12-32(6) and the wave-wide practice (the same disposition appears on 17 other files in the wave). See question R-4.
  - Successor notes check out. `system-overview.md` maps to `docs/platform/system-overview/spec.md`, and `work-state.md` maps to `docs/platform/work-state/spec.md`.
  - 890 (work-item-lifecycle-vision) is a root file that stays.
- 893 `docs/history/<feature>/`: a pattern in a table cell, preserved as an illustrative pattern. `docs/history` exists at the pin. The contextual exclusion of `specs/*.md` at L55 is correct, since it is `domains/<name>/specs/*.md`.
- I scanned for further legacy path tokens and found none. `docs/task-specs/coding/` at L264 is not in a retiring tree.

## 3. `docs/architect/proposals/component-authority-boundary-map.md` (needs-Lead-ruling)

I reviewed all 25 edges: 15 inventory plus 10 added. Dispositions are 1 patch, 15 park and 9 preserve.

### Verified ok
- Patch 1078 (L192 Dispatch Control Plane link) to `dispatch-control-plane.md#dispatch-control-plane` (the H1).
  - The row claims "exactly two routing identities (capability, executor-id)" and the eight owned authorities.
  - Those are in two peer sections: `## Routing Identities` at line 75 and `## Component-Internal Ownership` at line 266. The H1 is the nearest common parent, so the anchor is justified.
  - I counted eight authorities in the target (items 1-8), and "job is not a routing identity ... ADR-004 reserves" is at line 105.
- Preserves 1069-1077 (Related header on L8): lineage preserves, consistent with the wave pattern.
  - 1075 (repo-layout-vision) correctly has no successor note.
- Parks 1080 and 1081 (L497 row): `DispatchResolverPort` and the Hexagonal §9 correspondence are only in carriage (`component-boundary.md:539` and L476). A live section would have to promote them first. Both edges in the row share the disposition.
- Park 1079 (L312): "`spec` ... risks confusion with `docs/specs/` accepted state layer" is a naming-risk statement that needs rewriting for the distributed layout.
- Parks 1083 and added L640-L642 and L651-L657: they are tree leaves under a proposed `docs/architect/agent-coordination/` overlay.
  - Replacing a leaf with a full path would corrupt the tree, so "description needs rewrite" is correct.
  - The exclusion of L645 `boundaries/README.md` (a proposed new file) is correct.
- Diff hunk: only line 192 changes, and the relative path `../../platform/...` is correct for `docs/architect/proposals/`.

### Defects and notes
**D5 (record-text). Edge 1082 (L603) has the wrong category.**
- Source: "The current `docs/architect/agent-coordination/` tree is organized mostly by document authority: vision/ vocabulary/ ... history/".
- This describes the shape of a retiring tree. It is a description-rewrite item, as with 1083 in the same section. Marking it phase9-carry and "no full live holder" is boilerplate.
- Required correction: set 1082's blocker category to description-rewrite, with the smallest blocker stated (rewrite the tree-shape description against the distributed layout). No outcome change.

**D6 (coverage, subject to ruling R-2). The "Current docs" column of the L677-L682 table holds existing retiring-file references that have no edge.**
- Source lines:
  - L677: `architecture/{system-context,protocol-model,runtime-model}.md`, `contracts/coordination-session.md`, `contracts/flow-definition.md`.
  - L678: `architecture/dispatch-control-plane.md`, `contracts/assignment-run-runresult.md`.
  - L679: `architecture/evidence-and-results.md`.
  - L680: `architecture/work-integration.md`.
  - L681: `architecture/visibility-and-herdr.md`.
  - L682: `vocabulary/concept-relationships.md`.
- These are tree-relative leaf paths, rooted in the same `docs/architect/agent-coordination/` tree that the author already treats as live references at L651-L657 (those are parked). Both groups name existing files.
- The checker's partial-root scan does not match this form (it needs `specs/` or `architect/` as a prefix), so the checker passed. The brace list at L677 would also need expansion.
- Required correction, if in scope: add `authorAddedEdge` records for each reference, parked as description-rewrite like L651-L657. There is no diff effect.

### Verdict reasoning
The only open point is whether D6 is in scope (R-2). Everything else in the file is correct. I count the file as rework if R-2 is "in scope".

## Lead-judgment questions

- **R-1 (D1 direction).** Should the "Component Boundary Advisory" pointers (725, 730, L157) park as carriage (consistent with the repo-layout-vision parks), or patch to the compact live map `#4-current-high-level-components` with the L85-102 description rewritten? In both cases the record's whole-file justification must change. The live anchor itself says it is not a replacement for the advisory (target lines 38-48 and 64).
- **R-2 (D6 scope).** Do tree-relative leaf forms such as `architecture/<leaf>.md` fall under L12-32(4)'s scan scope? The rule text lists only `specs/<name>.md` and `architect/<name>.md`. The author already added edges for the bare leaves at L651-L657. D2 above is the same class and sits inside a patched paragraph, so I treat D2 as required regardless.
- **R-3.** `maps-j-00741` gloss ("reading entry for the architecture set") is slightly stale for a README that now routes current owners and retired history. Keep as authored, or park as description-rewrite like 743?
- **R-4 (wave-wide).** The authoring digest says "Related lists outside snapshots are live navigation, but self/duplicate-sibling destinations preserve as lineage". L12-32(6) accepts Related-header lineage preserves. This wave preserves every Related-header link (here 888-891 and 1069-1077). The candidate carriage copy of the domainization file already rebases the same header to live paths. I followed L12-32(6) and did not call it a defect, but the two rules read differently.
- **R-5.** `[Architecture Map](../../architecture-map.md)` (735) is preserved as a retained root. The root file's own header says "Legacy status: Promoted source ... Do not use this legacy file for: The target documentation entry path". A45 says the root keeps the CTR010 lines at cutover, so it stays. Preserve is rule-correct, but a live-navigation pointer at a file marked "do not use for entry path" may deserve a later retarget decision.

## Suggestions (not required)
- 1072 carries a successor note to `agent-coordination/README.md`. The actual retired ledger is at `docs/platform/agent-coordination/history/retired-engine/files/intent-preservation-ledger.md`. This is a non-executable note only.
- 1076 names `architecture/provider-routing.md` as successor, while the README edges 727 and 733 for the same source target `spec.md`. The notes are non-executable but disagree.

Status: DONE_WITH_CONCERNS
Summary: Reviewed all 59 edges across 3 files. component-boundary/README.md needs rework: advisory edges patched against a carriage-only holder, a missed `packaging-distribution/README.md` reference, and an over-narrow 742 anchor. domainization/README.md is ok. The proposals file needs a Lead ruling on 9 table leaf references and has one record-text category fix.
Concerns/Blockers: R-1 and R-2 need Lead rulings before the corrected records are re-reviewed.
