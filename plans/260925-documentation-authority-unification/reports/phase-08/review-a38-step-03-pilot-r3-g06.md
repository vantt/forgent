# Step 3 pilot round 3, group g06 (batch-040, 6 files)

Read at pin ae141550c (worktree bade80e52): all six records (edges, diffs, checks.anchors, coverage.legacyScan, searchWitness), complete pinned source of all six files, the actual targets (runner h-6979005beaf7 spec: header, headings, RUL65b/75/78/80 lines; system-overview spec: headings and Area Map lines 40-51; work-state spec existence), the live and legacy P04.md files, and the round-2 g06 review. A51, L12-26, L12-30 and L12-31 read. Re-applied the confinement diff with git apply --check on a pinned copy: applies, 3 hunk lines, edits exactly the four patched spans. Ran step-03-resolve.py once (08074). Own whole-file scans of every source file for retiring-tree basenames and docs/specs / docs/architect paths: only the recorded edges turn up (the other basename hits are runtime data names such as events.jsonl, run.json). Checker and probes not run.

## Per file

### docs/specs/confinement-authority.md (batch-040): ok
- Round-2 note on 08057 (no target state in reason): fixed; reason now says "retained path exists at author pin: docs/architecture-map.md" (exists at pin, outside the retiring trees). Correct.
- 08058 (l.1360 RUL65b), 08059 (l.1369 RUL75): patch to runner/subcomponents/h-6979005beaf7/spec.md#business-rules. Both RUL bullets (l.97, l.162) sit under the single `## Business Rules` H2 (the only H2 in the file); a candidate header ("Carriage only / Canonical: No") is not carriage; correct holder and anchor. Descriptions stay true.
- Added L1360C1158 (RUL80, runner.md bare label) and L1361C297 (RUL78): patch to the same holder and anchor. RUL80 (l.175) and RUL78 (l.173) exist verbatim and their glosses match the source parentheticals. Relative form `../platform/...` from docs/specs resolves; diff replaces only the basename span. ok.
- Added L582C69 (code comment) and L1359C157: park on RUL105 carry. Verified at pin: `git grep RUL105` hits only docs/specs/runner.md (1136, the legacy rule), docs/specs/confinement-authority.md and docs/explanation/glm-openrouter-executor.md (a retained mention, not a holder); zero hits in docs/platform, docs/knowledge, docs/reference, docs/tutorials; `credentialStore` in the candidate roots only matches an unrelated llmAccounts line and an unrelated packaging row. Alias table is empty and doc-registry has no match. The blocker (the rule text is not in the candidate) is real and smallest; per-query hit groups (RUL105: 0/0; docs/specs/runner.md: 277 carriage / 196 live, assessed per group) are genuinely unusable as a RUL105 holder. ok.
- Added L13C53 and L1255C211 (`P04.md R4`, bare basename of docs/architect/agent-coordination/verification/confinement-authority-implementation/P04.md): preserve as completed-track evidence lineage; reasons quote the source markers ("chỉ di trú sang backend reference ở dạng fixture", "Đã hoàn thành một phần (P04)") and name existence at pin, Phase 9 retirement, and the live successor under docs/platform. A live copy with an R4 row exists, so a patch was conceivable, but the verification tree is dated physical evidence (L12-29 surface rule recorded in the record; agent-coordination README "evidence payload bytes and paths remain unchanged"), so preserve plus successor note is consistent. Lead-judgment question 1 below.
- The scan found no other legacy mention in the file (AGENTS.md, plans/reports/*, report-1.md are not retiring paths). 6 added edges equal the actual added dispositions.
- Defects: none.

### docs/specs/distillery.md: rework (minor, anchor)
- Round-1 defect 08074 remains fixed (patch to docs/platform/system-overview/spec.md; target lines 50-51 hold both the distillery and distill-skill "spec: chưa có" entries, so the description stays true). 08075/08076 preserve (retained docs/distillery paths exist): ok.
- New defect, edge maps-j-08074, source line 124, L12-31(1) / "patch target is the actual claim holder with the right anchor": the record gives anchor null with proof kind whole-file "locator-free file/area pointer". The passage is not a bare pointer; it asserts that system-overview "already lists a `distillery` area entry ... and a separate `distill-skill` entry still marked spec-pending". The entire claim lives in the target's `## Area Map` (H2 at line 40; entries at 50-51), a narrower holder than the file. Required correction: anchor `area-map` (verify slug via listAnchors; update enclosingHeadingProof to the heading coordinates) and re-emit the diff target spelling accordingly. The diff text itself does not change if anchors are not printed for this label form; only record anchor/proof change.

### docs/specs/enduser-docs-authoring.md: ok
- Round-1 defect 08085 (illustrative `docs/how-to/x.md`, never existed in the pin ancestry): fixed and still correct. 08086 (`docs/how-to/` exists) and 08087 (`repo/docs/how-to/check-rollup-progress.md` exists at pin, successor note to the docs/knowledge copy) are factual; the doc-registry lists the old path as an alias but the alias table is empty and both paths exist, so retained-path preserve with a successor note is right (Lead question 2). Whole-file scan: no other legacy reference; legacyScan candidates empty. P8-DOC-GAP-02 carryObligation present. Diff empty.

### docs/specs/enduser-docs-index.md: ok
- Round-1 defect 08088 fixed. 08089/08090/08091 (`repo/docs/how-to/`, `repo/docs/explanation/`, `repo/docs/decisions/`) exist at pin, runtime scan directories, preserved with exact spelling. `repo/docs/enduser-docs-index.json` (l.235) is not a retiring path. Carry obligation present. Diff empty. No defects.

### docs/specs/fgos-plugin.md: ok
- 08092 (l.19) and 08094 (l.169): patch to docs/platform/work-state/spec.md, anchor null. Both are whole-spec ownership pointers ("lifecycle rules ... owned by the Work-State area", "lifecycle/FSM meaning ... every other verb's business rules"); no narrower common holder exists, so whole-file is correct and descriptions stay true (ruling 7 candidate area spec). 08093 docs/backlog.md retained: ok. Diff applies (verified), whole-file scan found no missed reference. No defects.

### docs/specs/observe.md: ok
- 08111/08112 (l.71): `../reference/discussion-quality-rubric.md` and `../how-to/compare-discussion-setups-with-metrics-eval.md` exist at pin and are not doc-registry aliases; preserve is correct. Lines 39/80 cite docs/platform/holder-lock/spec.md (already live). Scan found nothing else (assignment.json, result.json etc. are runtime names). Diff empty. No defects.

## Lead-judgment questions
1. confinement L13C53 / L1255C211: preserve of `P04.md R4` as dated-evidence lineage vs patch to the live docs/platform/.../P04.md (which has an R4 row under "Requirements proof"). I accepted preserve because the verification tree is the dated-evidence surface, but the surrounding sentences are current-state claims ("IMPLEMENTED", S4 status "partially completed"), so Lead may rule patch. If so, anchor is the `## Requirements proof (phase-04-...)` H2 of the live file.
2. enduser-docs-authoring 08087: doc-registry names docs/how-to/check-rollup-progress.md as an alias of the docs/knowledge document. Retained-path preserve plus successor note follows L12-26(3) with an empty Phase 6 alias table; confirm no approved alias is expected to retire it.
3. distillery 08074: if Lead holds that a claim-bearing pointer to a file whose content is wholly in one section may stay whole-file, the file is ok and the numerator drops to 0.

## Denominator and numerator (batch-040, my share, not pooled)
- Files reviewed 6 of 6; rework 1 (distillery, anchor); ok 5.
- Edges reviewed 25 (19 original, 6 added): patch 7 (08058, 08059, L1360C1158, L1361C297, 08074, 08092, 08094), preserve 16, park 2 (L582C69, L1359C157), row-flip 0. Added edges 6: patch 2, preserve 2, park 2.
- Round-2 defects confirmed fixed: 08074, 08085, 08088 (and the 08057 target-state note).

Status: DONE
Summary: Five of six g06 files are ok; the confinement patches, RUL105 parks and P04.md preserves hold up against the pin. distillery 08074 needs its anchor narrowed to the Area Map heading (minor, Lead may overrule).
