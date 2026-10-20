# Step 5 seam 5 — batch 3: cutover-relevance triage (Doer brief)

Status: Lead brief for the next Doer turn (records only).

You are Doer for Phase 8 of plan 260925-documentation-authority-unification in the fgOS repo. Batch 2 (d7e8bb334) is excellent in quality but closes two judgment files per turn; 671 files remain. A Lead measurement at pin 5eb9dc609 shows only 53 of them contain docs/specs, docs/architect or a retired docs/decisions/00NN path, and 169 contain any docs/ string. All rules of the seam 5 briefs (R17–R19, L12-76) still apply, plus the new ruling below. Same write scope and prohibitions as before: records only under plans/260925-documentation-authority-unification/reports/phase-08/, never a git write, never the fgos CLI, never the .fgos directory or the secrets env file, python -B, scratch /tmp/fgos-work/, tests with env -u CLAUDE_CODE_SESSION_ID, progress.md early and at the end.

## Lead ruling R20 (record as L12-77, with your measured counts)

The Phase 9 cutover changes the target of a document path only when the path is in the cutover move set: (a) anything under docs/specs/** or docs/architect/** (deleted), (b) retired decision files (docs/decisions/00NN-*.md, 0000-index.md), (c) every old path in the Phase 6 alias/registry move table (old -> new; derive it from the committed alias table and document registry, and pin it as step-05-cutover-move-set.json with its source hashes). An item whose operand provably cannot resolve to any path in that set has the same Phase 9 action whatever its label (its target survives unchanged), so by the R10 logic it is closed mechanically as cutover-neutral with disposition preserve, verified by the checker and backed by the Phase 9 full-suite proof; it needs no per-item judgment and no window review. Proof obligation (checker rule + rejecting probes): the passage and full-file context contain no literal in the move set and no prefix/template that can expand into it (a constructed path whose fixed prefix is a retained root that contains moved files is NOT neutral; neither is any identifier traced to a move-set constant, nor an unresolved import of a path constant). Everything else is judgment work under the existing rules.

## Work

1. Build step-05-cutover-move-set.json and the R20 checker rule with probes (reject: a move-set literal in context; a retained-root template that can expand into a moved file; a traced constant; an unresolved path-constant import).
2. Apply R20 to all 671 remaining files: close every cutover-neutral file as whole-file mechanical records (keep the existing R19 rejects as they are; R20 adds preserve closures for document-touching items that cannot reach the move set). Report counts.
3. Author judgment records for the remaining move-set-relevant files in the existing priority order (real-file readers/writers, emitted-string assertions, fixtures that mirror documents), as many as fit with full closure.
4. Checker 0 failures, all probes reject; update step-05-seam5-continuation.json (judgment files left) and step-05-seam5-review-list.json (judgment files closed; mechanical/neutral closures listed separately with counts).

Final message: FIRST line a conventional commit subject (at most 100 chars, no plan ids, phase or finding labels), then a short Vietnamese summary (anh/em): move-set size, files closed as neutral/mechanical, judgment files closed, remaining judgment files, checker/probes.
