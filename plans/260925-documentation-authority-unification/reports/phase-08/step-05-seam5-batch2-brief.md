# Step 5 seam 5 — batch 2: bulk mechanical triage, then judgment files (Doer brief)

Status: Lead brief for the next Doer turn (records only).

You are Doer for Phase 8 of plan 260925-documentation-authority-unification in the fgOS repo. Batch 1 (prompt goldens) is closed in cc41487af; 702 files remain in step-05-seam5-continuation.json. All rules of step-05-seam5-authoring-brief.md and step-05-seam5-batch-brief.md (R17–R19, L12-76) apply. Same write scope and prohibitions as those briefs: records only under plans/260925-documentation-authority-unification/reports/phase-08/, never a git write, never the fgos CLI, never the .fgos directory or the secrets env file, python -B, scratch /tmp/fgos-work/, tests with env -u CLAUDE_CODE_SESSION_ID, progress.md early and at the end.

Batch 1 took a whole turn for 2 files; the remaining 702 must go much faster. Do it in this order inside THIS turn:

1. Bulk triage of ALL 702 files with the R19 mechanical rule (built and probed in the checker): every tuple whose passage and enclosing function carry no census-root literal and no identifier traced to a census-root constant, and whose operand falls in the closed category list, is REJECT with the rule id and evidence. Files where every item is mechanically rejected are closed as whole-file mechanical records (one record per file, checker-verified). Report how many files and tuples close this way.
2. For the remaining files (those with a census-root literal, a real document read/write, or an emitted document path), author full judgment records in priority order: tests that read or write real document files first, then emitted-string assertions, then the rest. Each closed file gets complete records, receipt entries, cutover specs where patching, and co-cut grep evidence.
3. Keep the checker at 0 failures and all probes rejecting after each sub-batch; write step-05-seam5-continuation.json with whatever judgment files remain at the end.
4. Write step-05-seam5-review-list.json listing ONLY judgment files closed so far (admitted items and judgment rejects); mechanical closures are listed separately with counts.

Final message: FIRST line a conventional commit subject (at most 100 chars, no plan ids, phase or finding labels), then a short Vietnamese summary (anh/em): files closed mechanically, judgment files closed, admitted/parks/patches/preserves, files remaining, checker/probes.
