# Step 5 seam 5 — batch 6: review closure and 100-file throughput (Doer brief)

Status: Lead brief for the next Doer turn (records only).

You are Doer for Phase 8 of plan 260925-documentation-authority-unification in the fgOS repo. Batch 5 (37a646694) closed 40 judgment files; 364 remain. Six window reviews of batch 5 are in review-a38-step-05-s5-b5-p0{1..6}.md. All rules of the seam 5 briefs (R17–R24, L12-76..L12-80) apply. Same write scope and prohibitions as before: records only under plans/260925-documentation-authority-unification/reports/phase-08/, never a git write, never the fgos CLI, never the .fgos directory or the secrets env file, python -B, scratch /tmp/fgos-work/, tests with env -u CLAUDE_CODE_SESSION_ID, progress.md early and at the end.

## Part A — review closure (record as L12-81; verify each against the pinned source first)

- R24 (Lead, -> next L12): seam 5 window review scope = admitted items + judgment rejects whose passage/operand mentions docs; mechanical (R19), neutral (R20/R21) and docs-free judgment rejects are checker-verified.
- b5-p05 ok. Q1 merge.mjs L536 nextFreeDecisionId docs/decisions scan has no record (only 003771 renumberDecisionFile) -> seam 8 must own it (add to seam 8 brief: merge.mjs L536/638/640 docs/decisions reads, carried since pilot rr). Q2 loop.test.mjs L786-787 split-line docs/architect pointer -> author-added slot, preserve with tree-retires witness.
- b5-p03: plan.test.mjs reference-004241 comment -> dead docs/how-to/avoid-vacuous-pass-...md with unique live docs/knowledge holder -> PATCH (comment-only, L12-62 live holder rule). Sweep: every comment pointer whose target is dead at the pin and has a unique live holder -> patch. authoritative-match caller-data quadrant args: keep as recorded (preserve either way, R10).
- b5-p02 ok. b5-p04 (all preserve): admission flips R10 (004363, 004391, 004382 with fixture witness not "retained", 004392 reason fix). Qs: contextRefs stored but never rendered -> still ADMIT (L12-72); ADR0026 successorNote should point to the live heading docs/platform/runner/decisions/h-36d872fbb0e5.md#... not docs/decisions/index.md (more specific holder wins); bare writes:['docs'] scope token -> reject (scope label, not a document path).
- b5-p06: merge.test.mjs 004421/004460 (L1263/1265 byte-compare of formatFgosWriteRejectedDetail output) -> PATCH joined to source record 003749 (pilot already named test/runner/merge.test.mjs:1260-1265 as its co-cut); add the matching test diff/inverse, coCutPaths src/runner/merge.mjs. Sweep: every seam-5 test assertion that compares output of a patched source passage joins that patch (cross-check all pilot/seam-4 co-cut test lists against seam 5 records). decisions-corpus-retired 018740/018744 diagnostics printing fixed doc paths -> admit, same unit as 004033/004037 patch. Q: test stays red until its parks settle -> correct; parks are Step 7/Phase 9 blockers by design (record in L12-81).
- b5-p01: enduser-index.test.mjs D1 021547/021548/021549 docs/decisions read (only index.md, which the move set sends to docs/knowledge/decisions-index/...; test asserts files.length>0) -> PARK like 021542/004331; same-passage title/messages 004308/004343/021550/021551 follow. D2 004332 -> park (R7 with 004345). Titles naming a moving path: preserve as baseline-key labels, but each must list the co-cut it moves with when its test is patched/parked (004312/004321/004346; 004372 with 004373 explicit). fgos-merge.test.mjs 003965 dead docs/how-to pointer with live docs/knowledge holder -> PATCH (live-holder sweep rule).

Sweeps (fix every hit across ALL Step 5 records, report counts):
- S1 Co-cut cross-check: every test assertion that compares output of a source passage that has a Phase 9 patch (pilot, seam 2–4 and seam 5 records) must join that patch as a co-cut (test diff + inverse, coCutPaths both ways). Use every pilot/seam co-cut test list as the starting set.
- S2 Live-holder comment pointers: every comment pointer whose target does not exist at the pin and has a unique live holder becomes a comment-only patch.
- S3 Titles naming a moving path stay preserve but list the co-cut they move with.

## Part B — continue authoring

Close at least 100 judgment files this turn (more if they fit) in the existing priority order, applying R21 neutrality first. Per file: full records, receipts, passage-specific park dependencies, patch specs with co-cut grep evidence; replay only for patch files (R22).

## Close

Checker 0 failures, all probes reject; update continuation and the review list (addedThisTurn, and changedThisTurn split into dispositionChanged vs labelOnly so the Lead reviews only disposition changes, diffs and new slots).

Final message: FIRST line a conventional commit subject (at most 100 chars, no plan ids, phase or finding labels), then a short Vietnamese summary (anh/em): review items closed, sweep hits S1/S2/S3, judgment files closed, neutral files closed, remaining, checker/probes.
