# Review a38 step 05 seam 5-7 part p05 (src generators/setup/registry + enduser-index test)

Payload: s4-src-p05.json, 6 files. Pins checked against worktree 5c0f11eee. Standard: L12-72 R1-R9, L12-85 R27/R28.

## Per file

### src/cli/command-registry.mjs  -- ok
- Items reviewed: 1 changed item (reference-003657, comment pointer to docs/architecture-manifest.json), plus the 12 parks, 9 author-added slots and the diff.
- reference-003657 ADMIT/preserve is correct under R28: a comment pointer joins the unit and is preserved until the move is confirmed. The architecture-manifest unit exists in step-05-proposed-move-read-units.json.
- Diff is on a source file and changes two admitted passages: the doc-sources example, and the doctor description's `docs/specs/distribution.md` pointer.
  - The holder docs/knowledge/how-to-check-a-root-item-s-progress-with-fgos-rollup/check-rollup-progress.md exists.
  - docs/platform/packaging-distribution/spec.md exists and carries RUL9 and RUL11 (L644, L659).
  - The co-cut set (CHANGELOG, enduser-index test, fixture helper) fits the passages.
- Author-added slots: docs/<quadrant>/ and docs/enduser-docs-index.json park on the alias/index units. docs/ast.md, worktree and README.md are preserved synthetic or retained examples. L861 manifest slot parks on the enduser-index unit (empty proposedTarget, visible). All consistent.

### src/report/decision-index.mjs  -- ok
- Items reviewed: 5 (reference-003693/3694/3695 comment preserve; dynamic-009759/9760 parked).
- 009759/009760 sit on the same line (L135 `path.relative(repoRoot, indexPath)` as the `path:` result field of the return object), so they share one outcome. The path comes from a fixed doc path, so R6 admits it and R28 joins the decisions/index.md unit.
- Both are listed as readers of that unit, together with 009758 (L128 message), 009761 (L18) and 009767. No gap.
- The L42/L77/L81 rejects are true (caller-data and label join).

### src/report/enduser-index-generate.mjs  -- ok
- Items reviewed: 2 (dynamic-009772/9773).
- Both are L156 `path: path.relative(repoRoot, manifestPath)...join('/')`: same passage, both ADMIT/parked, pathOperand real. They are readers of the docs/enduser-docs-index.json unit, which has an empty proposed target and stays visible.
- L124 events.jsonl (state-event-store) and L137 stay rejects, correctly.

### src/setup/instruction-registry.mjs  -- ok
- Items reviewed: 4 (reference-003799/3800 comment preserve; dynamic-013986/13987 parked).
- 013986 is L480, a parse-failure message printing `manifestPath`. 013987 is L481, `filePath: manifestPath` in the same throw. The path is fixed or default, so R28 applies.
- Both join the architecture-manifest unit, which lists 013983-013987 plus test/architecture.test.mjs. Consistent with the L458 default parks.
- L432 `filePath: fullPath` is a scan-directory value, so it rejects correctly (R5/R6).

### src/setup/registrations.mjs  -- ok
- Items reviewed: 13.
  - Comment preserves: 003814, 003815, 003818, 003826.
  - dynamic-014318/14329/14330 park on the enduser-docs-index unit.
  - dynamic-014334 to 014337 and 014343/14344 park on the decisions/index.md unit.
- I checked each pinned line: 3644, 3681, 3683, 3730, 3735, 3739, 3743, 3777, 3779 print a fixed doc path via `manifestPathFor`/`indexPathFor`/`result.path`. All are R6/R28 emitted messages.
- Every id is a listed reader in the proposed-move units.
- Diff changes only doc-path text in messages and comments, on a source file. Holders exist. The payload truncates the diff body, so I did not re-check later hunks.

### test/report/enduser-index.test.mjs  -- rework (1 outcome defect)
- Items reviewed: 115 (77 reject, 27 park, 9 preserve, 2 patch) plus 16 author-added.
- Patch pair reference-004312 (L385 title) and dynamic-021552 (L386 read) is correct.
  - It is a direct real-file read, with no generator output involved.
  - The holder frontmatter has type: how-to and source_capture_ids [doc-fgos-rollup-howto].
  - The title key and the read change atomically.
  - No test-title baseline file keys this title; only archived logs do.
  - Co-cut includes the fixture helper, which stays parked (demo-find/demo-equality) consistently.
  - A replay receipt exists in step-05-seam5-batch5-parity-receipts.json.
- Alias/decisions/explanation parks (004305/4307/4308/4311/4319/4320/4321/4331/4332/4343-4351, dynamic-021542/21543/21545/21547-21549) all name the generator reader parks and carry specific reasons. L316 titles (004321/004346) agree.
- Rejects: tmp-fixture joins and in-memory docPath fixtures are true non-document uses (R21).
  - 021544/021550/021551 are caller-data diagnostics: reject is correct per R28.
  - docs/tutorials rename-aside (021516-9) preserve is justified: zero move-set entries.

#### OUTCOME defect
- **author-s5-b5-enduser-index-154-35**, L154 (test title `fgos docs-index writes repo/docs/enduser-docs-index.json with the real how-to demo entry`).
  - Rule: R28 title keys follow their owning reader; R5 requires a true nonDocumentUse.
  - Problem: it is REJECT/preserve with nonDocumentUse config-or-metadata and reason "pure in-memory fixture". That is untrue. This test runs the real generator and reads the real MANIFEST_PATH (dynamic-021514/21515, parked), and the title names the real manifest path.
  - The record itself lists r26CoCutUnits ["docs/enduser-docs-index.json"], contradicting the reject. The sibling titles at L316 (004321/004346) are ADMIT/parked.
  - Correction: ADMIT, with the same disposition as the L316 titles. Park on the docs/enduser-docs-index.json retention-or-move unit with a specific reason: the title key changes only with the manifest unit.
  - The fix is a record-only change to disposition/admission; nothing for the checker's hash logic.

## Record-text notes
- instruction-registry 003799/003800 reason says "retained architecture manifest" but the same record then says the pointer is preserved pending the move decision, and the L458 reader parks on retention-or-move. Drop the word "retained".
- registrations 014334-014337 are R28 emitted messages but cite "L12-83/R26" and use role emitted-document-message, while the sibling 014343/14344 cite R28. Harmonise the label.
- Many test parks use short dependency labels (alias-total, alias-membership, demo-find) instead of the "Phase 9 retention-or-move decision for ..." wording. Meaning is still specific; label only.
- test L447 reject carries a stray "baseline title co-cuts" note although the passage is fixture-only. Harmless.

## Lead-judgment questions
- None blocking. Optional: the docs/distribution-vision.md comment (registrations 003815) preserves under R28, but its R26 unit has no readers. Confirm that a comment-only unit is acceptable as a co-change slot.

## Counts
6 files. Verdicts: 5 ok, 1 rework.
Items reviewed: 140 (1 + 5 + 2 + 4 + 13 + 115) plus 36 parks and 36 author-added slots spot-checked.
OUTCOME defects: 1. Record-text notes: 4.

Status: DONE
