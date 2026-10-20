# Step 3 wave 5e review, part p01

Pin ae141550c. Method: all 469 edges of the one file extracted with python3 (edgeId, spans, matchedExpression, disposition, targetFacts, reason). Spans were checked column by column against the pinned source. Target states were checked against `git ls-tree` of the pin. Source read whole (493 lines, 131 KB: header, Phase 7 section, the full table). I did not run the checker or probe scripts.

## File: docs/platform/agent-coordination/history/documentation-migration/source-inventory.md

- Set: batch-086. Stratum: mandatory-threshold (469 edges).
- Record: all 469 edges are `preserve`; diff is empty; no retiresWithTree; authorAddedEdgeIds is empty.
- Verdict: **rework** (coverage only; the empty diff stays correct, so no content change results).
- Edges reviewed: 469 of 469.

### What checked out

- All 469 spans equal the source text at the stated line and column. Edge ids are unique, and unitIds are consistent (`item-L<n>` / `row-L<n>`).
- `docs/architect/**` source cells: 258 edges, one per row, lines 49-300. `docs/specs/runner.md`, `docs/specs/confinement-authority.md` and `docs/specs/distribution.md` (05667-05669, lines 307-309) are the only docs/specs edges. All 261 have targetFacts `exists` at the pin, and all carry "tree retires at Phase 9".
- `docs/platform/**` target cells: 189 edges, lines 112-300. All exist and carry "current retained path stays literal".
- 18 `renamed` edges (lines 476-493, the implementation-alignment.md target) agree with the pin. The path is absent at the pin and the successor recorded is `history/retired-engine/files/verification/implementation-alignment.md`. 9134ff4e5 does add `verification/implementation-alignment.md`.
- No `docs/specs`, `docs/architect`, `specs/`, `architect/`, `docs/decisions`, `docs/history` or `docs/knowledge` occurrence is left uncovered.
- The retire-versus-retained wording matches the path prefix on every edge.
- Preserve is the right disposition throughout: the file is a dated Phase 0 ledger and carriage, headed "temporary migration aid", and the Phase 7 section is a completed-action history region.
- Edge 05219 (line 34, `../../verification/README.md`): the relative link resolves from the file's directory to `docs/platform/agent-coordination/verification/README.md`, which exists at the pin. Preserve is correct.
- Header Related paths (lines 16-17) are retained paths that exist and are not legacy-root. Lines 36-37 hold bare basenames, which are exempt under L12-38(5).
- Source rows 310-475 (plans/, src/, test/, docs/platform/host-invocation-routing, docs/platform/packaging-distribution) and the self-alias target `.../source-inventory.md` carry no edge. This is correct: none of them is a legacy-root path, so L12-38(5) and L12-40 exempt them and nothing is patched.
- Target-cell coverage is uneven: 189 existing docs/platform targets are edged, but 46 existing ones (for example lines 49, 50, 53-60, 301-309) are not. The 26 absent targets of rows 51-111 are likewise unedged. This does not change any outcome (preserve either way), and L12-38(5) exempts such paths in dated history.

### OUTCOME defects (missed reference), same rule, same correction

Rule: L12-38(5) says coverage inside carriage and dated history requires edges for Markdown link targets and explicit legacy-root paths, and "the exclusion reason must still be true". The same-directory link edges in batch-084 (documentation-standardization-plan.md, `[vision.md](vision.md)` and similar) are authored as preserve edges, which confirms the convention.

1. **Line 40, column 211 (`](documentation-governance.md)`) and column 284 (`](documentation-standardization-plan.md)`)** are Markdown link targets. They are excluded in `coverage.legacyScan.candidates` with the reason "non-link token outside explicit legacy-root forms". For these two spans that reason is false. Both are link targets, and both resolve to existing siblings at the pin (`history/documentation-migration/documentation-governance.md` and `documentation-standardization-plan.md`). The link-text spans at columns 182 and 245 are fine to exclude. Correction: add two preserve edges (target exists, history carriage, no change), or restate the exclusion truthfully.
2. **Line 44, column 26 (`[Phase 7 completion](phase-7-completion.md)`)** is a Markdown link target that appears in neither the edges nor the legacyScan candidates. It resolves to an existing sibling, `phase-7-completion.md`. Correction: add a preserve edge (target exists).

None of these three would change the file text, since the correct disposition is preserve. They are coverage omissions only.

### Record-text notes (not rework)

- Every one of the 469 reasons ends with "The verification-index navigation keeps its existing path." That sentence is true only for edge 05219 (line 34). On the other 468 edges it is a false adjacent description. Suggest limiting it to 05219.
- Edge 05219 has unitId `item-L32` while its span is on line 34 (the unit is the paragraph). Harmless.

## Lead-judgment questions

- Do same-directory link targets that resolve to existing siblings in dated carriage always need preserve edges (as in batch-084), or may they be excluded as supplemental? The checker passed without them, so it does not enforce this. Please settle it so p01 and batch-084 are consistent.
- The 46 existing and 26 absent docs/platform target cells in rows 49-111 and 301-309 are not edged, while 189 neighbouring ones are. Confirm that exempting them is intended (it is consistent with L12-38(5), but the line between edged and unedged cells is not principled).

## Per-set / stratum counts

- batch-086, mandatory-threshold stratum: 1 file reviewed, 1 rework (coverage-only, zero diff impact), 469 edges reviewed.
- No patched or unpatched-seeded files in this part.
- Note for the Lead: a 1-of-1 breach of the >3% rule would trigger set expansion for batch-086, but the set has a single file.

Status: DONE_WITH_CONCERNS
