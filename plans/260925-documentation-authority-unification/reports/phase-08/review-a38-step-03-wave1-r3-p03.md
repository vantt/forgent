# Step 3 wave 1 round 3 review, part p03

Worktree detached at 471966e9e, author pin ae141550c. I read every source whole with `git show <pin>:<path>`. I extracted records by field with python3 (per-edge fields, scan candidates and exclusions, diff, descriptionTruth for the one patch). I ran no checker or probe. Target-existence checks used `git cat-file -e` and `git ls-tree` at the pin. Elapsed: about one working session.

Record digests (sha256 of canonical JSON, first 12 hex): edges / diff
- batch-015:18 legacy/README 27f22a4c5721 / 16894759a861
- batch-016:1 architecture-map 5ff4bdd67d44 / e81184967fd3
- batch-026:2 component-authority-boundary-map 04e5f50a8ba6 / 12ae32cb1ec0 (empty diff)
- batch-013:1 platform/README bfaf635443ad / 12ae32cb1ec0 (empty diff)
- batch-015:5 ovm-map 66dd948cf9b7 / 12ae32cb1ec0 (empty diff)

| File | Set / record | Edges | Verdict |
|---|---|---:|---|
| `docs/platform/agent-coordination/history/retired-engine/legacy/README.md` | batch-015:18 | 52 | rework (2 missed references) |
| `docs/platform/architecture-map.md` | batch-016:1 | 39 | ok |
| `docs/platform/proposals/component-authority-boundary-map.md` | batch-026:2 | 28 | needs-Lead-ruling (tree-relative cells L705-710; carried over from x-p09 Q1) |
| `docs/platform/README.md` | batch-013:1 | 23 | ok |
| `docs/platform/agent-coordination/history/implementation-records/orchestration-vocabulary-map-2026-08-27.md` | batch-015:5 | 7 | ok |

Per-set counts: batch-013 1 reviewed / 0 rework. batch-015 2 reviewed / 1 rework. batch-016 1 reviewed / 0 rework. batch-026 1 reviewed / 0 rework (1 awaiting Lead ruling). Total 5 reviewed, 1 rework, 1 needs-Lead-ruling. All 149 edges read.

## 1. legacy/README.md (batch-015:18, 52 edges) rework

Reviewed all 52 edges (6 inventory, 46 added) and the diff. The diff changes only Related L17 `docs/specs/runner.md` to `docs/platform/runner/spec.md`. That is correct under L12-34(4): wrapper Related, live whole-file holder, not self, not already listed. Dispositions are correct for 06415 and 06419 (Provenance and Source lines, preserved), 06416 (patch), 06417 (Superseded-by, preserved with successor note, per L12-35(3), x-p04 D1 overruled), 06418 and 06420 (dated retirement framing, preserved with a real successor; `runner/decisions/h-aabefc85f0c9.md` exists and holds the CoordinationSession heading). All 46 added snapshot-link edges in the first snapshot (L46-L208) and L256 are preserve inside carriage, which is right. The earlier x-p06 misses (L147 relative links, L163, L186) are covered.

Outcome defects (missed references, L12-35(6)):
- **Missing edge, source L246** `[Agent Coordination Foundation Vision](vision.md)` inside the second literal snapshot (4-backtick fence under "## Upstream Source ... This dated successor preserves the complete changed unit"). The scan excluded it with "Native candidate area root binds this basename to docs/platform/agent-coordination/vision.md". L12-35(6) forbids hiding a carriage link behind a contextual exclusion when the declared original-source reading (docs/architect/agent-coordination/README.md, so `docs/architect/agent-coordination/vision.md`, which exists at the pin and retires) reaches a retiring file. The identical links at L46, L63, L109 and L189 in the first snapshot have preserve edges.
- **Missing edge, source L249** `[Intent Preservation Ledger](intent-preservation-ledger.md)`, same second snapshot. It was excluded as "Contextual local candidate/retained filename ... legacy/intent-preservation-ledger.md". The original-source reading is `docs/architect/agent-coordination/intent-preservation-ledger.md`, which exists and retires. The same link at L49, L64 and L110 has preserve edges.
- Correction: add two authorAddedEdges, both `preserve` inside literal carriage (L12-35(4,6)), L246 with the vision.md successor note `docs/platform/agent-coordination/vision.md` and L249 with the ledger successor note `docs/platform/agent-coordination/intent-preservation-ledger.md` (check the holder exists). The legacyScan exclusions for both lines must be dropped. No diff or Phase 9 outcome changes. This is one file, two edges, outcome-level under the L12-35(6) rule (same class as the earlier L147 miss).

Record-text notes (not rework):
- 06419 (L222), 06420 (L240) and README-L256C6 sit in the second snapshot, yet their reasons carry existence facts ("exists at author pin; tree retires at Phase 9"). README-L256C6 also quotes a framing "Original source metadata and text follow / Full source text follows", which is not in this file. The true framing is the L222-223 "Source: ... upstream current-source conservation snapshot. This dated successor preserves the complete changed unit". If the Lead treats the second snapshot as declared carriage, L12-35(4) says to drop the existence facts and quote the real declaration.
- 06420 (L240, "decision 0062") successor note is `runner/spec.md`. The exact holder is `docs/platform/runner/decisions/h-36d872fbb0e5.md` `### 0062` (x-p06 note 5, still open, harmless).
- Scan exclusion text for L46/L63/L109/L189 names a `legacy/vision.md` that does not exist at the pin (x-p06 note 4, still open). Moot once the L12-35(6) edges exist for those lines.

## 2. architecture-map.md (batch-016:1, 39 edges) ok

All 39 edges read (36 inventory, 3 added), plus the diff and the descriptionTruth for 06585.
- Prior defect 06585 (CTR011 row L456) is fixed. It patches to `docs/platform/agent-confinement/spec.md`, timing Phase 9, anchor null. The diff changes only that token. Whole-file is justified: the cell says "spec" for the area spec. Description truth: the target spec L32/L34 hold `executeThroughConfinement` and "bwrap v1 ... fail-closed cho required với 8 falsification probes"; L51 and L564 hold the attestation; L59 and L193 hold policy resolve and compile plan. The versioned ids `confinement-policy.v1`/`confinement-plan.v1` do not appear literally, but the row text is the registry's own wording and whole-file linking does not assert them. Not a defect. The target header "Carriage only / Canonical: No" does not make it carriage (L12-26 ruling in L12-35(5)).
- L29 and L78 (source-status sentences: "legacy full map remains at docs/architecture-map.md during migration"; "5. Legacy Source ... still the full legacy map") are `phase9-row-flip`, which matches L12-35(2).
- L14 Related and L16 Provenance preserve (retained root, lineage).
- All other edges sit inside the literal carriage declared at L80 "Added in candidate: architecture-map source carriage" and say only that, plus successor notes, with no existence claims. 06594 carries the narrative-holder note for the elided decision id 0017.
- Scan completeness: I listed every path-like token after L82. Remaining bare names (L124 `backlog.md`; L725/735/748/820 `architecture-map.md`; L766/792/825 `id-systems-audit.md`; L777/801 `0004-...md`) are not retiring-tree basenames, and the full-path forms are already edges. No missed reference. The `work-state/decisions/retired-decision-history.md` links are candidate-native with no retiring reading (checked against the doc location).
- Same-unit consistency holds (L803 two edges both preserve; L821/L818-819 siblings).

## 3. component-authority-boundary-map.md (batch-026:2, 28 edges) needs-Lead-ruling

All 28 edges read (17 inventory, 11 added), empty diff. Everything the x-p09 review accepted is unchanged and correct: 07448 Provenance preserve, 07449 (L17) parked as duplicate Related (category phase9-carry, holder is the consumer itself), L24, L32 Related links, L216, L336, L525, L631, L667 and the tree leaves preserve inside the carriage declared by L22. The L668 `README.md` leaf and L430 link now have added edges (the L430 original-source reading reaches `docs/architect/agent-coordination/vocabulary/...`, a retiring file, which is the right outcome). L673 `README.md` under the proposed `boundaries/` is excluded explicitly as the task requires. Successor notes I checked all exist at the pin.

Unresolved (same as x-p09 Q1, not addressed by the round-3 records):
- L705-L710, the "Draft component-to-doc reading map" "Current docs" column, names backticked paths relative to the L631 stated parent `docs/architect/agent-coordination/`: `architecture/{system-context,protocol-model,runtime-model}.md`, `contracts/coordination-session.md`, `contracts/flow-definition.md`, `architecture/dispatch-control-plane.md`, `contracts/assignment-run-runresult.md` (L706 and L707), `architecture/evidence-and-results.md`, `architecture/work-integration.md`, `architecture/visibility-and-herdr.md`, `vocabulary/concept-relationships.md`. All resolve to existing retiring files from the stated parent. They have neither an edge nor a contextual exclusion, while the sibling tree leaves at L679-L685 (same parent) have edges. Likewise the directory leaves in the L633-L645 and L687-L695 trees (`architecture/`, `contracts/`, `vocabulary/` ...) have no edges.
- Lead question: do L12-35(6) ("row's stated parent", "proposed-layout leaves use their actual stated parent") and L12-34(5) cover these table cells and unbacked tree directory leaves? If yes, this file is rework: about 12 file-path preserve edges inside carriage (plus directory leaves if directory forms count in fences). All would be preserve with no diff effect. If no, the file is ok.

Record-text notes: 07460 (L336) reason lacks "tree retires"; 07456, L670 and L679 have no successor note; neither is rework.

## 4. platform/README.md (batch-013:1, 23 edges) ok

All 23 edges read, empty diff. Prior defects 05112 and 05113 (Decision Surface Where cells, L70-71) are fixed: preserve of retained root `docs/doc-governance.md`, reason states a settled non-migration row. The migration table rows L32-L37 and the Area Registry rows L45-L50 and L63 ("Current source during migration") are `phase9-row-flip`, per L12-35(2), even where cells name retained roots (L32 `../platform-foundations.md`, L37 `../contracts/` twice, L35 `../architecture-map.md`). L16 and L18 Related preserve (retained roots, survive Phase 9, correct). L103 `../reading-map.md` preserve (Related-files navigation to a retained root). Units are consistent per row. Scan: the 17 excluded candidates are same-directory candidate filenames (vision.md, intent-preservation-ledger.md, platform-foundations.md) correctly bound to docs/platform/. L17 `docs/transitional-switchboard.md` has no edge and is not a retiring-tree path.

## 5. orchestration-vocabulary-map-2026-08-27.md (batch-015:5, 7 edges) ok

All 7 edges read (2 inventory, 5 added), empty diff. 05689 (L9 Provenance) preserve. 05690 (L248), L274, L1040, L1043, L1044 are preserve inside literal carriage with the real header declaration quoted ("Purpose: Preserve source material for Orchestration Vocabulary Map") and no existence claims. Both snapshot readings of `../../vocabulary/` (L25) were checked: the original-source reading reaches `docs/architect/agent-coordination/vocabulary/`, so the preserve edge is needed and present. The L713 svg link resolves natively to an existing candidate file and has no retiring original-source reading, so no edge. Bare L949 `step-00-team-dispatch-v1-overview.md` and L1041 `agent-team-dispatch-and-herdr-stability.md` exist in neither tree and are correctly not edges. Record-text note: successor notes are given on 05690 and L274 only, not L1040/1043/1044 (optional).

## Lead-judgment questions

1. component-authority-boundary-map.md L705-L710 and directory leaves: in scope of L12-35(6) or not (section 3).
2. legacy/README.md: confirm the second snapshot (L225-L257) is literal carriage for the L12-35(4) existence-fact rule; this fixes the reason text of 06419, 06420 and README-L256C6.

Status: DONE_WITH_CONCERNS
Summary: 4 of 5 files are ok or pending a ruling; legacy/README.md is rework for two missed second-snapshot link edges (L246 vision.md, L249 intent-preservation-ledger.md) under L12-35(6). component-authority-boundary-map.md needs a Lead ruling on the L705-L710 tree-relative cells.
