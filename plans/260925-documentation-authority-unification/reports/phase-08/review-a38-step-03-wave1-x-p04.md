# Review a38 step-03 wave1 expansion, part p04

Pin `ae141550c`, worktree `836cc0fe1`. Set: batch-015 (all six files). 6 files / 45 edges reviewed (every edge, whole source of every file, every contextual exclusion). No checker or probe run. Earlier-review defects for these files (u03 files 3 and 4): none outstanding; the Related-header preserves they accepted were replaced by L12-34(4) patches and I checked those.

Per-set count: batch-015, 6 reviewed, 4 rework (3 of the 4 rest on one class-level defect, D1, which the Lead may rule differently).

## Class-level defect D1: wrapper "Superseded by" / current-owner navigation preserved while the same header's Related line is patched

All four retired-engine wrappers carry, in their own (non-snapshot) header, `Superseded by: Current execution ... in docs/specs/runner.md`. The `Related:` line two lines above, naming the same target, is patched to `docs/platform/runner/spec.md` (L12-34(4)); the `Superseded by` line is preserved with the "framed by `# Historical File: ...`" reason. This breaks L12-30(3) and L12-34(6).

- `Superseded by` is successor navigation, not lineage. L12-34(4) preserves only Provenance/Source/imported-from lines.
- The header is the wrapper, not literal snapshot bytes. The snapshot starts at `## Literal Snapshot` / `~~~~text`.
- The title line is not a framing sentence.
- After Phase 9 the adjacent patched line says `docs/platform/runner/spec.md` and the line below still names a deleted `docs/specs/runner.md`.

Correction: patch to `docs/platform/runner/spec.md`, whole-file, Phase 9. It is the same exact holder as the Related patch, and the anchor can be null with the same whole-subject justification.

Affected edges:
- 05744: retired-engine/README.md L18.
- 05767: files/README.md L19.
- 05772: files/architecture/README.md L19.
- 05863: files/contracts/README.md L19.

If the Lead rules that `Superseded by` is lineage, these four become record-text notes only. The other defects below are unaffected.

## Per file

### 1. docs/platform/agent-coordination/history/README.md, batch-015 set, **ok**, 2 edges
- 05164, L9: Provenance line, preserve. Correct.
- 05165, L30: "This target directory preserves historical material from `docs/architect/.../history/`...". This is a past-tense provenance description inside a file whose own text says "retained for context and evidence, never as current ... authority". Preserve is correct. The successor note `docs/platform/agent-coordination/history` is the file's own directory but differs from the edge path, so it is valid.
- Scan: no other legacy form in the file. The Contents list uses local relative dirs only.

Record-text note: both reasons say "framed by 'Document type: Collection index'". That is a header value, not a framing sentence. The real framing is L31-32 and `Design status: Superseded` (L22).

### 2. docs/platform/agent-coordination/history/implementation-records/orchestration-vocabulary-map-2026-08-27.md, batch-015 set, **ok**, 6 edges
- 05689, L9: Provenance, preserve. Correct.
- 05690, L248: `contextRefs` value in a JSON example, preserve. The rename fact is true (R099 at `ba7b62ace`, `agent-coordination/dispatch-control-plane-redesign.md` to `.../proposals/...`). The successor note path exists.
- Added L274 `team-communication-protocol-v1.md`: preserve. It exists at `docs/architect/agent-coordination/proposals/`, and the live successor exists.
- Added L1040 `dispatch-control-plane-redesign.md`, L1043 `doing-coordination-redesign.md`, L1044 `knowledge-registry-redesign.md`: preserve, same disposition. All three exist at docs/architect/. The two carriage copies under docs/platform/proposals are carriage-only, so they cannot be patch targets.
- Missed-reference scan: L949 and L1042 `step-00-team-dispatch-v1-overview.md`, and L1041 `agent-team-dispatch-and-herdr-stability.md`, name files deleted/renamed at `ba7b62ace` under other basenames. They match no retiring file, so there are no edges. This is correct.
- The file is the retained source copy of a History/Superseded record (header L3-25: "Preserve source material", `Design status: Superseded`). Preserving its present-tense body navigation is acceptable.

Record-text notes (no outcome effect):
- The L1040 reason quotes “Original source metadata and text follow” / “Full source text follows”. Neither string exists in this file. They come from the carriage targets. Replace with a quote from this file, or the header/Provenance framing.
- 05690 does not say "illustrative example" (L12-30(4)). The rename fact is still true.

Lead-judgment question Q1: L274 ("For the current role-to-role rules, see ...") and §9 L1040-1044 are present-tense pointers in a body that is a source copy. I accept preserve under whole-file History/Superseded framing. If the Lead wants L12-34(6) applied inside retained source copies, L274 would patch to `docs/platform/agent-coordination/proposals/team-communication-protocol-v1.md`.

### 3. docs/platform/agent-coordination/history/retired-engine/README.md, batch-015 set, **rework**, 19 edges (18 inventory + 1 added)
Reviewed:
- 05744 (L18), 05745, 05746, 05747, 05748, 05749, 05750, 05751, 05752, 05753-05757, 05758, 05759, 05760, 05761.
- Added: L337 `vision.md`.

Outcome defects:
- D1, 05744 L18: `Superseded by: Current execution owners in docs/specs/runner.md` is preserved. It should be patch to `docs/platform/runner/spec.md` (see D1 above).
- D2, missed reference: L147 `| documentation governance | [../../doc-governance.md](../../doc-governance.md) |`.
  - The link is inside the literal snapshot. From the snapshot's area root (`docs/platform/agent-coordination/`) it resolves to `docs/doc-governance.md`, the retiring legacy root that 05746 (L42) already treats as an edge.
  - The sibling links on L54, L105, L126 and L152 (`../../architect/...`, `../../specs/runner.md`) were added as edges, so the same relative form is covered inconsistently.
  - L12-34(5) requires coverage.
  - The scan only matched `specs/<n>.md` and `architect/<n>.md` partials, so the bare `../../doc-governance.md` slipped through.
  - Correction: add an authorAddedEdge for the label and destination as one unit (L147), preserve as literal snapshot carriage, successor note `docs/platform/governance.md`. No diff effect.
- All other edges are correct preserves. They are inside the literal snapshot or in dated notes (L356 is a dated 2026-10-14 note).

Record-text notes:
- 05747, 05748, 05749, 05750 say "target never existed ... docs/platform/agent-coordination/architect/...". That uses consumer-native coordinates. The snapshot's Provenance (L9) binds area coordinates, where `../../architect/agent-coordination/` is the existing retiring `docs/architect/agent-coordination/`. L12-34(5) wants provenance coordinates for source carriage. The preserve is still correct.
- The exclusions for `vision.md` at L100, 125, 175, 192, 238 and 318 say the link binds to `history/retired-engine/vision.md`, "a candidate/retained path". That path does not exist at the pin (`vision.md` is only at `retired-engine/files/` and the area root). The exclusion outcome is right, because the basename resolves to the live non-retiring `docs/platform/agent-coordination/vision.md`.
- The added L337 `vision.md` edge is the same non-retiring basename. Its reason ("tree retires at Phase 9") is false, and it is treated inconsistently with L100 etc. Either exclude it or fix the text. The outcome (preserve) is unchanged.
- The `intent-preservation-ledger.md` exclusions are fine. Natively they resolve to the existing `retired-engine/intent-preservation-ledger.md`.

### 4. docs/platform/agent-coordination/history/retired-engine/files/README.md, batch-015 set, **rework**, 5 edges
- 05766, L17 Related: patch to `docs/platform/runner/spec.md`, Phase 9, whole-file. Correct per L12-34(4). The diff applies: the hunk context matches L14-20 exactly.
- 05767, L19 `Superseded by`: preserve. D1 defect.
- 05768, L23: see Q2 below.
- 05769, L43: Related inside the literal snapshot. Preserve is correct.
- 05770, L57: `../../specs/runner.md` inside the snapshot. Preserve is correct. The fact is true: it resolves natively to a path that never existed, and it is framed as carriage.
- Scan: no other legacy form.

### 5. docs/platform/agent-coordination/history/retired-engine/files/architecture/README.md, batch-015 set, **rework**, 8 edges
- 05771: patch at L17, correct. The diff applies.
- 05772, L19: D1 defect.
- 05773, L23: Q2.
- 05774, L36 Provenance inside the snapshot: preserve. Correct.
- 05775, L43 Related inside the snapshot: preserve. The rename claim is true (R056 at `9134ff4e5`, to `retired-engine/files/verification/implementation-alignment.md`).
- 05776, L59: preserve. Correct.
- 05777, L111 and 05778, L147: links inside the snapshot. Preserve is correct.
- Exclusions (13 sibling basenames) are valid. All exist under `files/architecture/`.

### 6. docs/platform/agent-coordination/history/retired-engine/files/contracts/README.md, batch-015 set, **rework**, 5 edges
- 05862: patch at L17, correct. The diff applies.
- 05863, L19: D1 defect.
- 05864, L23: Q2.
- 05865, L36 Provenance in the snapshot: preserve. Correct.
- 05866, L63: preserve. Correct.
- Exclusions (4 basenames) are valid.

## Lead-judgment questions

- **Q2 (L23 wrapper sentence, edges 05768, 05773, 05864).** The sentence reads "...; see `docs/specs/runner.md` **CoordinationSession (Lịch sử — đã thu hồi per P4 ...)**".
  - It sits in the wrapper (before `## Literal Snapshot`) and is a present-tense "see" pointer.
  - The cited heading exists only as the carriage heading "Added in candidate: Runner CoordinationSession (...)" in `docs/platform/runner/decisions/h-aabefc85f0c9.md`, which is itself source carriage ("Carriage only").
  - Under L12-34(6) a carriage-only holder is not a patch target, so the edge should park (phase9-carry, with the smallest blocker named: no live non-carriage holder of that heading) rather than preserve.
  - The current reason is "framed by '# Historical File: ...'" (the title), which is not a framing sentence.
  - I did not count this as an outcome defect because the same-class decision (Q2 vs preserve as a dated past statement "The coordination engine was retired in <sha>") is a judgment call.
  - The same applies to the same-pattern files outside p04.
- **Q1** (vocabulary-map present-tense bare basenames) is above.
- **Q3 (class scope).** The D1 pattern also appears in the other wrappers of batch-015, for example files/decisions, proposals, roadmap, subcomponents, verification, vocabulary and inbound/legacy. The `descriptionTruth` adjacent passages show the same `Superseded by: ... docs/specs/runner.md` line. A ruling on D1 should be applied to all of them in one pass.

## Counts

| Set | Reviewed | Rework |
|---|---:|---:|
| batch-015 (p04 files) | 6 | 4 (retired-engine/README.md, files/README.md, files/architecture/README.md, files/contracts/README.md) |

Outcome defects: D1 x4 (05744, 05767, 05772, 05863), D2 x1 (missed L147 in retired-engine/README.md). Files 1 and 2 are ok.

Status: DONE_WITH_CONCERNS
Summary: Reviewed all 6 files and 45 edges; files 1 and 2 are ok and files 3-6 need rework. Files 4-6 rework only on class D1 (wrapper `Superseded by` line preserved while the same header's Related line is patched). File 3 also has missed reference D2 (L147 `../../doc-governance.md`).
