# Review a38 step-03 wave5c x-p02

Reviewer: independent read-only semantic reviewer. Worktree forgentX-s8-review, pin ae141550c2e022310de7a0efea757580c0b2479f. No checker or probe was run.

## File

- Path: `docs/decisions/index.md`
- Set: batch-059
- Stratum: L12-51-changed-file-targeted-re-review
- Record digest: a0c9f0239f56019041a4a8e01327aee43740ea0e3643c0b291a706fd4b1a4b66
- Diff: empty string (no patches). Every edge is parked.
- Edges reviewed: 77 of 77. Source read whole (63 lines, 34 KB, generated index with 3 front-matter and 2 header lines).
- Verdict: **ok**

## Evidence

- The file declares itself `generated: true`, produced by `fgos decision-index`. At the pin, `src/report/decision-index.mjs` exports `computeDecisionIndex` and `generateDecisionIndex`, and `bin/fgos.mjs` L38 and L2046 call them. The shared blockedReason is therefore true. The file is a retained root render, so a Step 5 parity park (not a hand patch, not a row flip) is the right disposition for every edge. L12-38 also says the runtime decision-index stays with Step 5.
- All 77 edges are parked, with blockedCategory equal to dependencyCategory equal to `step5-parity`, timing none, and no target, anchor or diff.
- Edge coverage matches the source:
  - docs/architecture-map.md: 5 edges.
  - docs/specs/platform-foundations.md: 5 edges. The L20 cell is `RUL11 (docs/specs/platform-foundations.md)`.
  - docs/specs/runner.md: 14 edges.
  - docs/specs/system-overview.md: 2 edges.
  - docs/specs/work-state.md: 12 edges.
  - docs/architect/proposals/visibility-and-interactive-contact-herdr-spawn.md: 2 edges, at L41 and L42.
  - Removed `docs/decisions/00NN-*.md` basenames: 36 edges.
  - The elided `docs/decisions/0035` at L19 (01361) is paired with the full 0035 name (01362).
  - An independent regex sweep of the source found no uncovered retiring reference.
- Uncovered tokens are all non-retiring and correctly absent from the edges: `AGENTS.md`, `docs/rul11-anchor-phrase.test.mjs`, `docs/platform/event-store/spec.md`, `docs/platform/git/spec.md`, `docs/platform/host-invocation-routing/architecture/invocation-kernel.md` (all exist at the pin), `docs/knowledge/why-a-single-done-status...` (L62), and a bare `plan.md`.
- targetFacts, checked against git:
  - All 37 targetFacts entries with state "removed" were checked: each is a pure deletion at the stated commit, with no rename. That commit is 4722361ae for 0002 to 0033 and 4270c0c0d for 0034 and 0035. The commit listing confirms 32 D entries and no R entries at 4722361ae.
  - The "exists at pin" entries for docs/architecture-map.md, docs/specs/*.md and docs/architect/proposals/... all exist.
- L12-51 record-text rules:
  - "tree retires at Phase 9" appears only on docs/specs/** and docs/architect/** paths. The docs/architecture-map.md reasons correctly omit it.
  - The 0004 edge (01405) carries the title-matched file-level note. It names `docs/platform/work-state/decisions/retired-decision-history.md` and "4. ADR 0004 Scope And Non-Goals". That heading exists at L89 of the file at the pin. The Vietnamese and English titles correspond. The note is non-executable and does not name its own path.
  - The 0000 index note and the elided 0027 resolution do not apply to this file. Its 0027 reference is spelled in full.
  - Removed-decision parks say "removed at <commit> with no successor file", not "never existed".
- searchWitness: every hit group uses `citation-only`, with alias lookups empty for both the Phase 6 alias table and the doc-registry. That is true for a generated render that only cites these paths. The record has no authorAddedEdges (authorAddedEdgeIds is empty).

## Outcome defects

None.

## Record-text notes (not rework)

1. The L42 contextual exclusion for the bare `dispatch-control-plane-redesign.md` (row tsk-53j) says the "illustrative source artifact/basename is not an unrelated same-name file". Its only resolved reading is `docs/decisions/dispatch-control-plane-redesign.md`, which does not exist. The wording is awkward and does not mention the actual holders. At the pin the basename exists at docs/architect/dispatch-control-plane-redesign.md and docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md (retiring tree) and at docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md (candidate). A clearer reason would say it is a bare basename inside generated row text that Step 5 regenerates.

## Lead-judgment questions

1. **Bare basename at L42 (exclusion vs added edge).** The digest says missed legacy references, bare basenames included, become authorAddedEdges. Batch-015 excluded the same basename only inside candidate files in that directory. For a live generated row whose basename names a retiring-tree file, the Lead may prefer an authorAddedEdge parked step5-parity. The outcome would be the same park, so this is not rework. I left the exclusion as acceptable because the checker passed and the row itself also cites the proposal by full path (maps-j-01395, parked).
2. **Category for the platform-foundations rows (01354, 01356, 01358, 01360, 01363).** Their holder claim ("narrative di dời sang docs/specs/platform-foundations.md") is the area where L12-41 parks decisions as GAP-02. The record uses `step5-parity` only. The first and sufficient blocker is the generator re-projection, so I accept it. The Lead may want GAP-02 named in the dependency prose if the Step 5 rewrite of these rows depends on it.

## Counts

- Set batch-059, stratum L12-51-changed-file-targeted-re-review: 1 file reviewed, 0 rework, 77 of 77 edges reviewed.
- Overlap: none. This is the only file in the part.

Status: DONE
Summary: `docs/decisions/index.md` (batch-059, 77 parked step5-parity edges, empty diff) is ok. Removal commits, the 0004 note and the generator facts are verified, and there are no outcome defects. One record-text note and two Lead-judgment questions are listed.
