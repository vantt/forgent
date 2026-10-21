# Step 0 rebind fix after the seat-binding merge (Doer brief)

Status: Lead brief for the next Doer turn (ledger/records; non-docs).

You are Doer for Phase 8 of plan 260925-documentation-authority-unification in the fgOS repo. The independent review review-a38-step-07-l12-101-rebinds.md (this directory) accepted 8 of the 31 rebinds in step-07-l12-101-merge-rebindings.json and sent back all 23 rows that target docs/specs/runner.md. Read it fully first, plus owner-answers.md L12-67 (position rebinds handled correctly) and L12-101.

Cause: main removed two unheaded blocks near the top of runner.md, so every later block moved down two indexes. The previous turn rehashed whatever block now sits at the old index instead of finding the bound passage.

Required:
- For each of the 23 rows, set targetAnchor to the index where the original passage now lives (the review found unheaded-block-(N-2) for all of them; verify each by content AND neighbours with the unchanged embedded extractors, never by index alone) and set targetUnitDigest back to the row's beforeDigest. Prove for every row that the after-block digest equals beforeDigest. Rows bound to a repeated sentence must be placed by neighbour match, as the review did.
- Fix step-07-l12-101-merge-rebindings.json (the rows, reboundBindings count, remainingTargetDigestDrift) so it states the truth: 8 content rebinds plus 23 anchor-only re-placements with unchanged digests.
- Lead ruling L12-102 (record it in owner-answers.md, Lead under A42): (1) accept the 8 rows; a whole-block `supersede` binding covers line-level removals and renames inside its block (architecture-manifest.json removals of assignment-policy, workflow-pool-independence and role-ledger; the install how-to's doctor-check rows replaced by seat-binding-config), because no claim depends on those lines; (2) the 23 runner rows are corrected as above; (3) add a dated correction under L12-101 (do not rewrite it): its "located by content" and "zero remaining target drift" claims were false for the runner rows.
- Rerun the Step 0 binding check and the reproduction reporter afterwards; both must show zero drift.

Writable: plans/260925-documentation-authority-unification/ledger/decisions/** and plans/260925-documentation-authority-unification/reports/phase-08/** only. Never a git write except read-only git show/log/diff, never the fgos CLI, never the .fgos directory or secrets; no code, docs, tests, gates, baselines or switchboard. python -B. Scratch /tmp/fgos-work/; commit only final result files.

Final message: first line a conventional commit subject (at most 100 characters, no plan ids, phase or finding labels), then a short Vietnamese summary (anh/em).
