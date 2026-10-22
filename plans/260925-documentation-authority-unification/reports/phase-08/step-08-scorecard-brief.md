# Step 8 — Phase 8 scorecard and closure package (Doer brief, records turn)

Status: Lead brief. Steps 0–7 are closed (Step 6b L12-115, Step 7 closed by the integration review r3 at 9395aa111/9f49695c7). The Lead runs `npm test` in an isolated clone in parallel and will hand you nothing from it; leave a clearly marked slot for the suite result that the Lead fills after the run.

You are Doer for Phase 8 of plan 260925-documentation-authority-unification in the fgOS repo. Read phase-08 (whole file, esp. Requirements, Success Criteria, Step 8, "Review volume, budget and scorecard map"), the Phase 7 scorecard format (find it under reports/phase-07/), owner-answers.md L12-1..L12-121, progress.md, and the Step 5/6/6b/7 closure reports and reviews in this directory.

Write `step-08-phase-08-scorecard.md` mirroring the Phase 7 scorecard:
1. Every phase-08 requirement and success criterion → evidence (exact file/commit/review) → verdict (met / met-with-carry / not-met), with applied vs prepared behaviour explicit (Phase 8 applied no consumer byte except where a record says so; the lease code and its docs exist on the plan branch only).
2. Suite slot: "Lead suite run — pending" table with columns command / tree / exit / failures / main-vs-branch attribution (the Lead fills it).
3. Owner and Lead decisions L12-1..L12-121 indexed (one line each, grouped).
4. Exact carry-forward lists for Phase 9: the 214 parks by owner (counts + pointer to the readiness file), the 226 patch specs, lease landing with Phase 9 + Git-owner consent for git spec §7 + holder-lock notice, Plan C draft status (not a cutover dependency per plan.md), P7-DOC-GAP-05 (allowed red) and -06, the 3 Low notes of the Step 7 r3 review, repository bloat to prune (list the large intermediate files committed on this branch with sizes; do not delete anything), retired worktrees to clean at track end.
5. A "next concrete action" line in progress.md.
Record L12-122 (Step 8 package delivered, pending the Lead's suite run and the independent closure review). No new authority claim from file placement.

Writable (exact): plans/260925-documentation-authority-unification/reports/phase-08/**. No docs/** or code edits, never a git write, never the fgos CLI, never .fgos/ or secrets, never scripts/run-tests.mjs or npm test.

Final message: first line a conventional commit subject (at most 100 characters, no plan ids, phase or finding labels), then a short Vietnamese summary (anh/em).
