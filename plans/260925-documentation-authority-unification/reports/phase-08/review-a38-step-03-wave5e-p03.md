# Step 3 wave 5e, part p03: independent semantic review

Pin `ae141550c2e022310de7a0efea757580c0b2479f`. Worktree `/home/vantt/projects/forgentX-s8-review` (read-only, no checker or probe run). Every file was read whole at the pin. Every edge was read: fields (span, matchedExpression, disposition, unitId, target/anchor/timing, reason, successor note, unitDispositionReason, author-added discovery) plus the legacyScan exclusions. I ran my own independent pass over each source for Markdown link targets, `docs/...` paths, relative `../` paths and bare `.md` names, and compared the hit lines with the edge lines.

Overall: 6 files, 141 edges reviewed, 0 outcome defects, 0 rework.

## Per-file results

### 1. batch-088, patched stratum (patched-seeded): `docs/platform/agent-coordination/history/retired-engine/files/proposals/dispatch-control-plane-redesign.md`
- Verdict: **ok**. 32 edges reviewed: 31 inventory edges and 1 author-added edge. The file has 1005 lines.
- Diff (1 hunk): L17 `docs/specs/runner.md` becomes `docs/platform/runner/spec.md`. L17 is exactly that Related entry at the pin, and the target exists at the pin.
- 06086 (L17, patch, Phase 9): a Related entry in a History wrapper whose retiring target has a live holder (L12-34(4)). The runner spec is an area-level holder with no anchor, and it is not a self or duplicate entry. Correct.
- 06087 (L19 Superseded-by) and 06088 (L23 framing prose): both preserve, with successor notes. 06087 names `runner/spec.md`. 06088 names `runner/decisions/h-aabefc85f0c9.md`, which exists and has the heading "CoordinationSession (Lịch sử ...)" (L12-37(5), L12-35(3)). The unit exception for 06087 against 06086 states a distinct claim, which is true.
- 06089 (L36 Provenance, `docs/architect/...`) and 06090, 06091, 06093, 06112 (the `docs/specs/runner.md` citations at L64, L179, L913, L981): all inside `## Literal Snapshot` (carriage, L27-1005). They preserve, and the reason is only the carriage declaration, with no existence claims (L12-35(4)).
- 06092 (L427, a `docs/history` JSON example) and 06094-06110 (L914-971, `docs/history/...` plan paths): preserved carriage rows and lists.
- 06111, 06113-06116 (`docs/architecture-manifest.json` rows, L978-988): preserved carriage rows.
- Author-added `...-L1004C31` (`[Vocabulary Map](../vocabulary/README.md)`): preserve in carriage. It is a Markdown link read from both coordinates (wrapper and original source), which is correct under L12-35(6). The legacyScan excludes only L52 (`../architecture/dispatch-control-plane.md`). That is a backticked non-link token inside carriage, exempt under L12-38(5), and the exclusion reason is true.
- Independent pass: the only Markdown link in the carriage is L1004. Every `docs/specs`, `docs/architect` and `docs/history` occurrence has an edge. No missed reference.

### 2. batch-088, patched stratum (patched-seeded): `docs/platform/agent-coordination/history/retired-engine/files/proposals/semantic-cli-surface.md`
- Verdict: **ok**. 5 edges reviewed. The file has 93 lines.
- Diff: the same L17 Related patch.
- 06117 patches. 06118 (L19) and 06119 (L23) preserve with the same successor notes as above. 06120 (L44) and 06121 (L47) are carriage Related and Superseded-by lines, preserved with the carriage declaration only.
- Independent pass: the link `../history/retired-engine/proposals/semantic-cli-surface.md#literal-snapshot` (L53, L55, L59, L69, L71, L92) resolves from the declared original source to the candidate path `.../history/retired-engine/proposals/semantic-cli-surface.md`, which exists and is not a legacy path. The L9 Provenance path is under `docs/platform`, not a legacy root. No edge is missing.

### 3. batch-088, patched stratum (patched-seeded and mandatory-threshold): `docs/platform/agent-coordination/history/retired-engine/files/proposals/step-08-standalone-coordination-protocols.md`
- Verdict: **ok**. 31 edges reviewed (17 inventory, 14 author-added). The file has 1793 lines and 77 KB. I read it by a full scan plus every edge region, and read the lines around each edge.
- Diff: the same L17 Related patch. The edges for L17, L19 and L23 follow the same pattern and are correct.
- Inventory edges:
  - L36 (Provenance), L55, L1278, L1297, L1299, L1302, L1690, L1702, L1706: all `docs/architect/...` paths, preserved as carriage.
  - L83, L84, L242, L294, L1513: links `../contracts/...`, preserved as carriage.
- Author-added edges (L65, L82, L99, L241, L293, L459, L461, L980, L982-985, L1512, L1534) are relative links to the ADR, vocabulary, ledger and vision files. Each one reads, from the declared original source (`docs/architect/agent-coordination/proposals/`), as a retiring path, so each needs a preserve edge. All are preserved with the carriage declaration only.
- The legacyScan exclusions L645 and L657 (`synthesis.md`) are bare names inside carriage, exempt under L12-38(5).
- Independent pass: the unedged hits are the L43-45 candidate Related paths under `docs/platform/...`, L52 `plan.md`, and bare names (L1281, L1687, L1709). The L1281, L1687 and L1709 hits are `plans/reports/...` paths, not legacy roots, and bare names inside carriage need no edge. No missed reference.

### 4. batch-088, patched stratum (patched-seeded): `docs/platform/agent-coordination/history/retired-engine/files/spec.md`
- Verdict: **ok**. 13 edges reviewed. The file has 134 lines.
- Diff: the same L17 Related patch.
- 06224 patches. 06225 (L19) and 06226 (L23) preserve with correct successor notes. 06227 (L44) and 06228 (L47) preserve in carriage.
- 06229-06236 are carriage links to `../../specs/runner.md` (L51, L64, L68, L100, L104, L124, L131) and to `../../specs/confinement-authority.md` (L114). Each reads from the declared original source as `docs/specs/...`, a legacy path, and each is preserved with the carriage declaration only. Every `docs/specs` link in the carriage has an edge.
- The other carriage links are not legacy: `history/retired-engine/spec.md`, `history/retired-engine/verification/implementation-alignment.md`, `../host-invocation-routing/README.md` and `../packaging-distribution/README.md`. These resolve from the original source to existing candidate paths. The `src/` links are code.

### 5. batch-088, patched stratum (patched-seeded): `docs/platform/agent-coordination/history/retired-engine/files/vocabulary/canonical-concepts.md`
- Verdict: **ok**. 24 edges reviewed (7 inventory, 17 author-added). The file has 355 lines.
- Diff: the same L17 Related patch.
- Inventory edges: 06284 patches. 06285 and 06286 preserve with successor notes. 06287 (L36 Provenance, `docs/architect/...`), 06288 (L96) and 06289 (L195) are carriage and preserved.
- 06290 (L212, `docs/specs/platform-foundations.md` D0014): this is a decision citation inside the Literal Snapshot, in captured historical text, so it preserves. It is not live-class text, so the GAP-02 rule for live text does not apply here. Correct, with a carriage-declaration reason only.
- Author-added edges: the `../decisions/ADR-008/009/010...` links (L77, L95, L180, L194, L216, L226, L240), `../architecture/dispatch-control-plane.md` (L299), `deprecated-and-reserved.md#participant` (L213) and the in-page `#anchors` (L85, L160-169, L200). The anchor links are over-inclusive but harmless; the decision, architecture and deprecated-terms links are real relative links needing edges under the original-source reading. All preserve in carriage.
- Independent pass: no unedged hit except the L43-45 candidate Related paths. No missed reference.

### 6. batch-089, unpatched stratum (unpatched-seeded): `docs/platform/agent-coordination/history/retired-engine/history/documentation-migration/claim-preservation.md`
- Verdict: **ok**. 36 edges reviewed (33 inventory, 3 author-added). The diff is empty and all 36 edges preserve. The file has 83 lines.
- 06300 (L18, `Superseded by: Current execution owners in docs/specs/runner.md`): a Superseded-by status header in a History wrapper. It preserves with a successor note to `runner/spec.md` (L12-35(3)).
- 06301-06332 are the table rows L52-L70 and L76 of the Source column. Each is a link `../../../../architect/agent-coordination/...` to a legacy architect file, preserved in carriage. I checked the 32 edges against the 32 architect links in rows 52-70 and 76 (e.g. 06317 `ADR-011` on L59). No link is missing, and no extra edge exists.
- The three author-added edges (L52C252 `[README](../../README.md)`, L77C250 and L78C225 `README.md#cross-area-boundaries`) are carriage links read from both coordinates. They preserve with the carriage declaration.
- Independent pass: all other links in the table are `src/` or `plans/` paths (L69, L70, L73-L76). The `plans/` paths at L73-L76 are not legacy roots; the L76 "historical path absent at the batch pin" parenthetical is source wording, not a record claim. The L77 and L78 external-authority links (`../../../host-invocation-routing/README.md`, `../../../packaging-distribution/README.md`) resolve to existing candidate files. No missed reference.
- This file is not the batch-089 open lead-ruling (maps-j-06547). That edge is not in this part.

## Counts

| Set / stratum | Reviewed files | Rework | Edges reviewed |
|---|---:|---:|---:|
| batch-088, patched stratum (4 patched-seeded + 1 mandatory-threshold; the mandatory file is also patched) | 5 | 0 | 105 |
| batch-089, unpatched stratum (1 unpatched-seeded) | 1 | 0 | 36 |

Part total: 6 files, 141 edges, 0 rework. Edge counts match the request table exactly (32, 5, 31, 13, 24, 36). The 5 batch-088 files carry the same L17 Related patch; the rest of each file is carriage. For those 5 files: a Related patch to the runner area spec, history-wrapper preserves, and carriage preserves for links and legacy paths. No set breaches 3% from this part. No set closure is claimed.

## Record-text notes (not rework)
1. The `unitId` labels on some carriage and wrapper edges are advisory and do not line up with the physical line, for example 06121 (L47) labelled `item-L45`, and 06118 (L19) labelled `item-L17`. The unit is computed by the checker from the source, so this has no effect.
2. In `canonical-concepts.md` the author-added in-page `#anchor` edges (L85, L160, L161, L163, L169, L200) are over-inclusive, since they are same-file anchors. They are harmless and are preserves in carriage.
3. The preserve notes on L19 point to `runner/spec.md`, a whole-file holder, while the L23 notes point to the runner decisions file. Both match the L12-35(3)/L12-37(5) pattern.

## Lead-judgment questions
None. No rework, no edge needing a new rule.

Status: DONE
Summary: Reviewed the 6 assigned files and all 141 edges at the pin. All 6 are ok with no outcome defects, and no rework in batch-088 (patched, 5 files) or batch-089 (unpatched, 1 file).
