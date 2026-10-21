# Review a38 step-05 seam 5 batch 6, part p05

Pin 5eb9dc609 (records), worktree 1b9fce325. Five files, 22 items reviewed (14 + 1 + 1 + 4 + 2). No diffs in any file (all preserve/park), so no diff/rollback checks apply.

## Verdicts

| File | Verdict | Items |
|---|---|---|
| test/report/helpers/docs-index-state-fixture.mjs | ok (2 Lead questions) | 14 |
| test/runner/dispatch-confinement-p04.test.mjs | ok | 1 |
| test/runner/dispatch-confinement-p05.test.mjs | ok | 1 |
| test/runner/dispatch-executor-profile.test.mjs | rework | 4 |
| test/runner/dispatch-worker-home.test.mjs | rework | 2 |

Total 22 items; 2 outcome defects, same defect class.

## OUTCOME defects

D1. test/runner/dispatch-executor-profile.test.mjs reference-004378, source L19-20 (comment "Evidence: docs/architect/.../visibility-herdr/proofs/2026-09-06-isolation/permission-posture-findings.md"). Currently admit/preserve with treeRetires. Rule: R8 / L12-72 "a comment pointer with a live holder => patch"; "a live holder with the same passage means a patch, not a park". Evidence: git ls-tree at 1b9fce325 shows the byte-identical holder docs/platform/agent-coordination/verification/visibility-herdr/proofs/2026-09-06-isolation/permission-posture-findings.md. That file carries no "Canonical: No" header, unlike the proposal carriers. The sibling reference-004380 (test/runner/dispatch-worker-session.test.mjs L15, batch 4, L12-80 P04) already patches the pointer into this same proof directory because the docs/platform copy is identical. Correction: make it a source-only comment patch to the docs/platform path, with forward/inverse diff, as 004380 did. If the Lead instead rules that "Evidence:" citations are dated provenance, then 004380 must flip to preserve. Either way the two must agree.

D2. test/runner/dispatch-worker-home.test.mjs reference-004379, source L18-19 (same directory, agent-in-session-findings.md plus the bare filename permission-posture-findings.md). Same evidence and rule, same correction. Both holders exist byte-identical under docs/platform. The patch must cover both filenames, since the L19 line names both.

D1 and D2 are one outcome and should be fixed together with 004380 consistency.

## Checks that passed

- docs-index-state-fixture.mjs:
  - 004353 and dynamic-021577 (L35 REAL_DEMO_DOC_PATH) are admit/park with the same blockedReason. They share a passage, one admission and one disposition.
  - The blocker is concrete: the symlinked real docs tree, the test reference-004330/dynamic-021552 co-cut, and generator dynamic-009788/009791 membership.
  - The path does move: docs/how-to/check-rollup-progress.md is in the cutover move set and goes to docs/knowledge/how-to-check-a-root-item-s-progress-with-fgos-rollup/check-rollup-progress.md.
  - dynamic-021580 and dynamic-021581 admit/preserve with pathOperand path.join(REPO_ROOT,'docs'). That is a real docs-root symlink. Both items sit on one expression and agree.
  - Rejects: dynamic-021574/5/6 (__dirname/REPO_ROOT, R5 root plumbing), 021579 (mkdtemp tmpdir), 021582/3 (.fgos fixture state). All are true non-document uses.
- dispatch-confinement-p04 004376 and p05 004377 (L3 "Spec: docs/specs/confinement-authority.md"): preserve with treeRetires true is correct. The only holders, docs/platform/agent-confinement/spec.md and contracts/confinement-authority-v1.md, are "Canonical: No" candidate carriers. L12-80 P03 says those are not live patch targets, and the move set maps the spec to the platform README. R8 dated provenance with tree-retires witness is satisfied. Nothing else in either file mentions docs.
- dispatch-executor-profile dynamic-024673/4 (mkdtemp tmpdir) and 024677 (test label) are true rejects. A grep finds no other doc path in the file. The "design.md §3.x" mentions are bare basenames, outside the census (L12-60).
- dispatch-worker-home dynamic-025406: REPO_ROOT='/home/someone/projects/repo' is a synthetic scalar and a true reject.

## Record-text notes (no outcome change)

- Reasons for 004352 (fixture L14), 004376 and 004377 still say "preserved pending source-grounded S2 holder check". That is an unfinished placeholder, not a resolved reason. Replace with the actual determination: for 004376/7, "candidate-only (Canonical: No) holders, tree retires"; for 004352, see Q1.
- dynamic-021584 (docPath: REAL_DEMO_DOC_PATH at L50) is rejected scalar-pass-through. The nonDocumentUse label is arguable (see Q2). Its operand text is not a document construction.
- dynamic-021585 (L3-11 comment) is rejected comment-or-type, while dynamic-021578 (L37-43 comment about the same docs symlink) is admit/comment-provenance. Both preserve and neither changes the Phase 9 action (R10), but the admission differs for two comments of the same kind. Align the labels.

## Lead-judgment questions

Q1. fixture reference-004352 (L14 comment naming docs/how-to/check-rollup-progress.md): the path is in the move set and a live holder exists under docs/knowledge. A dead-pointer patch is possible. But the same fixture's L35 constant that seeds the capture is parked until the generator alias membership settles, and the comment describes that capture. Preserve is coherent with the park. Confirm that preserve-coupled-to-park is intended, or patch the comment together with the park.

Q2. fixture dynamic-021584 (L50 addOutcome docPath: REAL_DEMO_DOC_PATH): the constant is the parked passage. Confirm that the use at L50 is covered by the 004353/021577 park co-cut and needs no separate admission. The record says so only implicitly, via the "Co-cut the capture path" text.

## Counts

Files 5; items 22 (the first line of this report said 21 by mistake; 22 is correct per the table); outcome defects 2 (D1, D2, one class); record-text notes 3; Lead questions 2.

Status: DONE_WITH_CONCERNS
Summary: Three of five files are ok. dispatch-executor-profile and dispatch-worker-home preserve docs/architect proof-directory comment pointers that have a byte-identical docs/platform holder, contradicting the batch-4 patch of the same directory in dispatch-worker-session (004380).
