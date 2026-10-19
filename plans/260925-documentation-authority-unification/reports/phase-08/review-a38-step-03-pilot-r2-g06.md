# Step 3 pilot round 2, group g06 (batch-040, 6 files, 19 edges)

Read at pin ae141550c: all six records (files, edges, diffs, checks); source passages at every edge line (confinement 1353/1360/1369/1401; distillery 118-138; authoring 35/103/124; index 47/236-237; plugin 19/149/169; observe 71); targets runner h-6979005beaf7/spec.md (header, headings, RUL65b/75 lines), system-overview/spec.md (header, lines 50-51, 90), work-state/spec.md (header, ask/answer/return/ready verbs). Re-applied the three non-empty diffs (confinement, distillery, fgos-plugin) with git apply --check on pinned copies in my scratch dir: all apply. Existence checked for every preserved retained path and the docs/knowledge successor note. No git writes; checker and probes not run.

## Per file

### docs/specs/confinement-authority.md (batch-040): ok
- Round-1 defects: none existed. Diffs, dispositions and patch hunks unchanged; only the checks field gained receipts (resolutionSearches, locatorScope-free).
- 08058 (l.1360) and 08059 (l.1369): patch to runner h-6979005beaf7/spec.md#business-rules, Phase 9. The target holds RUL65b (l.97) and RUL75 (l.162) under the single `## Business Rules`. The header says "Carriage only / Canonical: No", which is candidate status, not "Source snapshot retained", so it is a live target. RUL locators and parenthetical descriptions stay true. The sibling bare "runner.md RUL80/RUL105/RUL78" mentions are not inventory edges (no docs/specs/ path), so no action.
- 08057 preserve (past-tense "đã được đăng ký chính thức (P07)", settled-fact record) and 08060 preserve (retained root file docs/routing-handoff-contract.md): correct. Note 08057's reason cites class 5/8 and does not state target state; the target docs/architecture-map.md is not in my verified set, but the claim is the passage role, which is correct. Not a defect.
- No defects.

### docs/specs/distillery.md: ok
- Round-1 defect 08074: FIXED. Now patch to docs/platform/system-overview/spec.md (anchor null, Phase 9). The source line is a live present-tense Open Gaps claim, "already lists a `distillery` area entry ... (and a separate `distill-skill` entry still marked spec-pending)". The target lines 50-51 hold exactly both entries (distillery with spec pointer, distill-skill "spec: chưa có"), so the description stays true. The header of the target does say "Canonical for: Nothing until promotion", which fits cutover-patch-only. The search witness (alias tables empty, 19 hits of which 17 live) is sufficient since the selected target is the area spec per ruling 7/1.
- 08075 and 08076 preserve: retained paths docs/distillery/porting-log.md and docs/distillery/state/porting/ exist at the pin; reasons state the true state. Ok.

### docs/specs/enduser-docs-authoring.md: ok
- Round-1 defect 08085: FIXED. Now preserve as an illustrative placeholder (l.35 "vd `docs/how-to/x.md`" in the Data Dictionary value column), reason names L12-30(4,5) and L12-26(9,10) and the true state "target never existed in Git ancestry of author pin". Verified: `git log ae141550c -- docs/how-to/x.md` is empty. No invented blocker or dependency.
- 08086 (l.103 docs/how-to/, exists) and 08087 (l.124 repo/docs/how-to/check-rollup-progress.md, exists; non-executable successor note points to an existing docs/knowledge path) preserve: correct, factual.
- File-level P8-DOC-GAP-02 carry obligation recorded in checks.coverage.carryObligation; no destination invented. Diff empty, appropriate.

### docs/specs/enduser-docs-index.md: ok
- Round-1 defect 08088: FIXED (placeholder `docs/how-to/x.md` in the docPath row, l.47; preserve with the same factual reason).
- 08089/08090/08091 (l.236-237 repo/docs/how-to/, repo/docs/explanation/, repo/docs/decisions/): all three directories exist at the pin; preserve with original spelling. Correct, these are runtime scan directories.
- File-level P8-DOC-GAP-02 carry obligation present. Diff empty.

### docs/specs/fgos-plugin.md: ok
- No round-1 defects. 08092 (l.19) and 08094 (l.169) patch docs/specs/work-state.md to docs/platform/work-state/spec.md (anchor null, Phase 9). The target is a live candidate area spec owning ask/answer/return/ready verbs and the stage/status model, so both descriptions ("lifecycle rules owned by Work-State area", "lifecycle/FSM meaning behind move/return/ask/answer") remain true. 08093 docs/backlog.md preserve (retained hand-maintained file). Diffs apply and match the original accepted diffs; only checks field changed.

### docs/specs/observe.md: ok
- No changes (no field changes, as stated). 08111/08112 (l.71) preserve: both ../reference/discussion-quality-rubric.md and ../how-to/compare-discussion-setups-with-metrics-eval.md exist at the pin. Full link form retained. Reason uses L12-26(3) only; it states the path is a committed retained path, which is factually correct.

## Locator flags
None of the 13 flags is in my group (my files have no entries in the flag list). I found no locator mismatch in my edges.

## Lead-judgment questions
1. 08085/08088 preserve reasons say "target never existed in Git ancestry of author pin". A `git log --all` run right at the start of my check once printed one line for docs/how-to/x.md, then nothing on rerun and nothing when restricted to the pin. I believe this was transient (concurrent refs), but Lead may want the checker to confirm the claim against the pin only, which is what the reason says.
2. 08057's reason cites L12-26(5,8) without naming the target state (ruling 5 wants a factual target state for preserve). Passage role (completed past registration) is right, so I do not count it as rework. Lead may ask for one phrase if ruling 5 is read strictly for all preserves.

## Denominator and numerator (batch-040, my share, not pooled)
- Files reviewed: 6 of 6. Rework: 0. Ok: 6.
- Edges reviewed: 19 (patch 4: 08058, 08059, 08074, 08092/08094 counted as 5 patch edges in total; preserve 14; park 0). Correct tally: patch 5 (08058, 08059, 08074, 08092, 08094), preserve 14, park 0, row-flip 0. Matches the author counts 2/0/0/2, 1/0/0/2, 0/0/0/3, 0/0/0/4, 2/0/0/1, 0/0/0/2.
- New defects: none.

Status: DONE
Summary: All six g06 files are ok at round 2. The three round-1 defects (08074, 08085, 08088) are fixed correctly, the patch diffs apply cleanly, and every preserve reason checks out against the pin.
