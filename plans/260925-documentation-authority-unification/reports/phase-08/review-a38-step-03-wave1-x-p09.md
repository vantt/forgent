# Step 3 wave 1 expansion review, p09

Pin ae141550c (read-only worktree forgentX-s8-review). For each file I read the whole source at the pin and every edge of its record (disposition, unit, target, timing, reason, category, targetFacts, witness group), plus the diff. I re-scanned each source for retiring-tree basenames and tree-relative paths. I did not run any checker or probe, and I did not read .fgos.

## Per-file verdicts

| File | Set | Verdict | Edges reviewed |
|---|---|---|---|
| docs/platform/proposals/component-authority-boundary-map.md | batch-026 | ok (Lead question 1) | 26 |
| docs/platform/runner/README.md | batch-027 | ok | 4 |
| docs/platform/system-architecture/architecture/roadmap.md | batch-028 | ok | 21 |
| docs/platform/system-architecture/architecture/workspace-topology-roadmap.md | batch-028 | ok | 3 |
| docs/platform/ui-spec/README.md | batch-029 | ok | 3 |
| docs/platform/work-state/README.md | batch-030 | ok | 14 |

Per-set counts: batch-026 1 reviewed / 0 rework; batch-027 1 / 0; batch-028 2 / 0; batch-029 1 / 0; batch-030 1 / 0. Total: 6 files, 71 edges, 0 rework, 0 outcome defects.

## Earlier defects confirmed fixed

- work-state/README.md. Wave-1 review u02 reported two defects: maps-j-07881 (L21, Provenance line) and maps-j-07891 (L75, "retained source for the platform vision candidate" row). Both are now `preserve`, with a non-executable successor note (spec.md and docs/platform/vision.md). The twin maps-j-07888 (L62) is also preserve. The legacy-owner rows L73 and L74 are row-flips, and L34, L40 and L60 are row-flips. The units are consistent.
- roadmap.md and workspace-topology-roadmap.md. u02 flagged the "Canonical for: Nothing until promotion; current source remains X" line (07766, 07780). Both are now `phase9-row-flip` with unit `canonical-L11`.
- roadmap.md. u02 flagged tree-relative misses at L52-58 and runtime-identity-and-activation.md. All are now covered by added edges (L52, 53, 55, 56, 57 and 58 tree-relative paths, plus L151 and L237), all preserve inside the whole-source carriage.
- component-authority-boundary-map.md. u01 rated it ok. It is unchanged except that the Related-header duplicate (07449) is now parked, which matches L12-34(4).

## Per-file notes

### component-authority-boundary-map.md (26 edges: 24 preserve, 1 parked, 1 plain preserve of Provenance; diff empty)
- 07448 (L9, Provenance) preserve is correct.
- 07449 (L17, wrapper Related entry for the file's own legacy source) is parked phase9-carry as a duplicate. The live holder is the consumer itself, which is the L12-34(4) duplicate case. The park category and reason agree.
- 07450 (L24, source relationship), L32 Related (07451-07458), L216, L525, L631, L667 and L669-L685 are all in the literal source carriage framed by the header ("Implementation: Source snapshot retained", "Canonical: No", "Canonical for: Nothing; non-canonical candidate conservation carrier", and the L22 framing sentence). Preserve is correct, and carriage-only holders are not patch targets.
- 07460 (L336, `docs/specs/` inside a prose example) preserve is correct. The L430 link `../agent-coordination/vocabulary/concept-relationships.md` resolves to a live candidate file, so it is correctly not an edge.
- Successor notes check out at the pin. 07456 (repo-layout-vision) has no note, and no candidate holder exists under docs/platform.
- No false adjacent description. Nothing is patched.

### runner/README.md (4 edges; 1 patch, 3 preserve)
- 07586 (L10, Provenance) preserve is correct.
- 07587 (L18, Related header, retiring target) is patched to docs/platform/runner/spec.md, which exists at the pin. The holder is not the README itself and is not already listed, so the patch rather than a duplicate park is right. The diff hunk (@@ -15,7 +15,7) applies to the pinned bytes, and the replaced line is only the Related entry. No adjacent description is affected.
- The two edges for the `runner.md:<line>` locator syntax (L23, L61) preserve. Both are explicit "known-stale carried" cautions that quote the old locator form and are not reads.
- No other legacy path tokens in the file. The L48 plans/ paths are not legacy.

### roadmap.md (21 edges: 1 row-flip, 1 park, 19 preserve; diff empty)
- 07765 (L9 Provenance) preserve is correct. 07766 (L11) is a whole-line row-flip, which matches L12-34(3). 07767 (L16 Related, self) is parked as a duplicate, which matches L12-34(4).
- 07768-07772 and the added edges at L52-58, L151 and L237 sit in the whole-source architecture carriage ("Purpose: Preserve the complete...", "Original source metadata, dates... are provenance"). Preserve is correct.
- Patterns such as `docs/specs/*` (L155, L277) preserve correctly.
- The bare `workspace-topology.md`, `-roadmap.md` and `-audit.md` references at L54 and L146 resolve natively to live sibling candidates in the same directory. I confirmed all three exist at the pin. Under L12-34(5) native candidate-relative links take precedence, so excluding them is right.

### workspace-topology-roadmap.md (3 edges)
- 07779 (L9) preserve. 07780 (L11) row-flip. 07781 (L16) duplicate park. All three are correct.
- The L26, L31, L32 and L131 `workspace-topology*.md` references resolve to live native siblings, so they are correctly not edges.

### ui-spec/README.md (3 edges; diff empty)
- docs/ui-spec/00-overview.md and docs/ui-spec/ are retained roots outside the retiring trees. The Provenance (L9), Related (L17) and tool-root-obligation (L48) edges all preserve, which is correct.
- The L48 prose (compiler root stays at docs/ui-spec/, generated outputs in place) is a candidate-added obligation statement and is true to the root.

### work-state/README.md (14 edges: 4 preserve, 1 park, 9 row-flip; diff empty)
- 07878 (L16 Related, retiring docs/specs/work-state.md) is parked as a duplicate. The holder docs/platform/work-state/spec.md is already listed at L11, so L12-34(4) applies.
- 07879 and 07880 (L17, L18 Related, retained roots io-contract.md and work-item-lifecycle-vision.md) preserve, which is correct.
- 07881 (L21 Provenance) preserve, fixed from the u02 finding.
- L34 sentence (07882, 07883), L40 row (07884, 07885), L60 line (07886, 07887) and L73/L74 legacy-owner rows (07889, 07890) are migration-state units. Each is a row-flip with one disposition per unit, and the retained-root dependency on io-contract.md is named in 07886/07887.
- 07888 (L62) and 07891 (L75) preserve lineage-only "retained source" statements, which is correct. L62 `vision.md` is correctly excluded because the label sits inside a complete link to ../vision.md.

## Record-text notes (do not count as rework)
- roadmap.md 07769 and 07772: the reason says the source path is "absent at author pin", while the matched pattern is `docs/specs/*` and docs/specs exists. The successor note "docs/specs" names the edge's own path, which L12-34(8) says a successor note must not do. The disposition is correct. Suggest the wording "pattern/glob; docs/specs tree retires at Phase 9" with no successor note.
- component-authority-boundary-map.md 07460: the reason omits "tree retires at Phase 9" for `docs/specs/`. The disposition is correct.
- component-authority-boundary-map.md 07456, L670 (intent-preservation-ledger.md) and L679 (system-context.md) carry no successor note, though candidate holders may exist. Suggestion only.
- roadmap.md and workspace-topology-roadmap.md: the Purpose line (L6) names the source basename (`roadmap.md`, `workspace-topology-roadmap.md`) with no edge. It is a self-name reference inside the wrapper, so I consider it harmless.

## Lead-judgment questions
1. component-authority-boundary-map.md, tree-relative coverage under L12-34(5). Two groups of preserve-only references have no edge, while same-kind siblings do:
   - L668 `README.md` in the proposed-overlay tree. It is the existing docs/architect/agent-coordination/README.md, while its siblings `vision.md` (L669) and `intent-preservation-ledger.md` (L670) got added edges. L673 `README.md` is under the non-existent `boundaries/`, so it needs no edge.
   - L705-710, the "Draft component-to-doc reading map" cells such as `architecture/{system-context,protocol-model,runtime-model}.md`, `contracts/coordination-session.md`, `contracts/flow-definition.md`, `contracts/assignment-run-runresult.md` and `vocabulary/concept-relationships.md`. Their leaves resolve to existing docs/architect/agent-coordination files, but not from the consumer directory docs/platform/proposals, so the mechanical L12-34(5) rule does not require them. They are still the same tree whose leaves at L679-685 do have edges.
   
   All would be `preserve` in verbatim carriage, with no effect on any patch or Phase 9 outcome. I treated this as a completeness question rather than rework, matching u01's suggestion. If the Lead rules that these references must have edges, the file becomes a minor rework (add preserve edges only).
2. Whether a self-name in a wrapper Purpose line (roadmap.md L6, workspace-topology-roadmap.md L6) should ever be an edge. I recommend no.

Status: DONE
