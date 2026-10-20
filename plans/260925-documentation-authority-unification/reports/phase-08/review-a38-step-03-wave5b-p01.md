# Review a38 step-03 wave5b part p01

Pin ae141550c; worktree detached 18824b36a (read-only). No checker/probe run. 5 files / 10 edges, all read in full pinned-source context (all files under 60 KB, read whole or every edge region plus a full legacy-path grep).

## Per file

### 1. docs/platform/agent-confinement/spec.md (batch-083, patched-seeded) - verdict ok
Record digest 36c3552767fd...38b9. 4 edges reviewed. Full scan of the 603-line file found only these legacy-path occurrences (L15, L23, L581, L603); no missed reference.
- maps-j-05125 (L15 Provenance, preserve): correct. Lineage line, kept literal; stays separate from Related.
- maps-j-05126 (L23 Related -> docs/specs/confinement-authority.md, parked description-rewrite): correct. The area spec is the consumer itself, so a patch would create a self pointer. The Related item can only be removed or consolidated. Category fields agree.
- maps-j-05127 (L581, patch, Phase 9): correct. Target docs/platform/runner/subcomponents/h-6979005beaf7/spec.md#business-rules. RUL75 exists at pin at target L162 under `## Business Rules` (L25); no deeper heading intervenes, so the anchor is the nearest enclosing heading. The source gloss ("renewed once at the source, in a copy fgOS holds, renewed login in a private home written back") matches the RUL75 title. Diff replaces the path in place, and the original label and RUL75 parenthetical are kept. The "three-part gloss / local elaboration" claim holds: the rest of 13.2 is elaboration, not attributed to RUL75.
- maps-j-05128 (L603, preserve docs/routing-handoff-contract.md): correct. Retained root authority that exists at pin; no status change.

### 2. docs/platform/agent-coordination/architecture/evidence-and-results.md (batch-084, patched-seeded) - verdict ok
Digest 916fe71f...a346. 1 edge.
- maps-j-05139 (L17 Related -> docs/specs/runner.md, patch Phase 9 to docs/platform/runner/spec.md, whole file): correct under L12-34(4). The retiring Related target patches to its live holder; docs/platform/runner/spec.md exists at pin; it is not a duplicate of the other Related item (area README). The entry asserts no section or count, so a null anchor with a whole-file justification is true. Diff is one line and correct. The relative links (../history/..., ../../runner/spec.md) are native candidate links and need no edge.

### 3. docs/platform/agent-coordination/architecture/protocol-model.md (batch-084, patched-seeded) - verdict ok
Digest 726b5d36...0967. 2 edges.
- maps-j-05142 (L17 Related patch): same as item 2, correct.
- maps-j-05143 (L122 link ../contracts/workflow-stage-operation.md, preserve): correct. The link resolves to docs/platform/agent-coordination/contracts/workflow-stage-operation.md, which exists at pin. A same-basename retiring copy exists under docs/architect/agent-coordination/contracts/, but the candidate-native relative link takes precedence, so it is not a legacy reference. Label and form are kept.

### 4. docs/platform/agent-coordination/decisions/ADR-005-herdr-visibility-only.md (batch-084, unpatched-seeded) - verdict ok
Digest 27fd53c7...a37. 1 edge, empty diff.
- maps-j-05158 (L9 Provenance "Retained from docs/architect/.../ADR-005-herdr-visibility-only.md at fcfe78cb..", preserve): correct. L12-47 provenance is literal. The record says the path exists at pin and the tree retires at Phase 9. Related is "None", so there is no live navigation claim. The file's other links are native (../../runner/spec.md, ../history/...), and the prose "runner spec's historical CoordinationSession section" names no path. No missed reference.

### 5. docs/platform/agent-coordination/decisions/ADR-006-assignment-provenance-and-contract-snapshot.md (batch-084, patched-seeded) - verdict ok
Digest 36a638a0...bbd. 2 edges.
- maps-j-05159 (L17 Related patch): same as item 2, correct.
- maps-j-05160 (L67 `docs/specs/runner.md:3058`, parked description-rewrite): correct. This is a stale line-locator citation, which L12-38 parks. I verified the claim "holder exists in docs/platform/runner/decisions/h-36d872fbb0e5.md". Heading 0047 (item 5, "Cổng ghi file kiểm chứng được (supersede ADR-006 §6)", pin L1526) states exactly the admission conditions the sentence cites (linked worktree realpath, bind() recomputed from unit.json). A bare path swap would leave a wrong line locator, so the park is right. Category enums agree. The witness category `citation-only` for a parked hit is acceptable under L12-32(5).

## Outcome defects
None.

## Record-text notes (not rework)
- maps-j-05125 reason (batch-083) embeds a long quoted "Source passage" that is the whole metadata fence up to `Related:`; it is verbose but not false.
- maps-j-05158 reason has a doubled period ("separate from Related/current reading..").
- maps-j-05160 search-witness group is categorized `citation-only` while the edge parks as description-rewrite; harmless under the enum.

## Lead-judgment questions
None. (The duplicate/self Related park uses the `description-rewrite` category because no `duplicate` enum exists; that is consistent with L12-34(4) and L12-40(2) as applied here.)

## Counts (this part only; part p02 contributes the rest of batch-084/085)
- batch-083 patched stratum: 1 reviewed / 0 rework. Unpatched: 0 / 0.
- batch-084 patched stratum: 3 reviewed (evidence-and-results, protocol-model, ADR-006) / 0 rework in p01. Unpatched stratum: 1 reviewed (ADR-005) / 0 rework. The mandatory-threshold file is in p02.
- Part total: 5 files reviewed, 0 rework, 10/10 edges ok. No overlaps.

Status: DONE
