# Review a38 step-05 s5 b5 p06

Reviewer: independent read-only semantic review. Part: p06. Payload: s4-src-p06.json (2 files, 128 items).
Sources checked at pin 5eb9dc609 through git objects only. No checks, probes or CLI were run.

## test/runner/merge.test.mjs

Verdict: rework. 94 items reviewed (12 admit/preserve, 82 reject/preserve). No diff, no parks.

### OUTCOME defects

D1. reference-004421 (line 1263) and reference-004460 (line 1265). Admitted and preserved, but the correct outcome is patch.
- Passage: the test `formatFgosWriteRejectedDetail includes playbook recovery doc path`. It compares the real emitted detail string, which contains `See docs/how-to/fix-fgos-write-rejected-merge-block.md ...`, byte for byte (assert.equal at 1263) and by includes() (1265).
- Source: `src/runner/merge.mjs:996`, reference-003749 in step-05-records/cli-help-messages.jsonl. That record is ADMIT/patch, timing phase9, with target `docs/knowledge/how-to-fix-a-fgos-write-rejected-merge-block-on-a-fgos-chang/fix-fgos-write-rejected-merge-block.md`. Phase 9 changes the emitted pointer.
- At the pin, docs/how-to/fix-fgos-write-rejected-merge-block.md does not exist. The live holder is the docs/knowledge path above.
- Rules: runtime-emitted strings are user-visible output, a test asserting a document's wording is a consumer, and a live holder means patch. The record says "preserve diagnostic spelling and the whole assertion", which contradicts the Phase 9 source patch. After Phase 9 this test goes red.
- Correction: both items become ADMIT/patch, target the same docs/knowledge path as 003749, timing phase9. They need a source-file diff of this test changing the literal at 1263 (and the assertion at 1265) to the new path, with the inverse rollbackDiff. They need co-cut evidence tying the test to merge.mjs:996, and current/candidate replay per the rule that patch files carry a replay.
- coCutPaths is currently empty and must name src/runner/merge.mjs.
- Same passage: 004449 (line 1497, a dated comment citing the same how-to path, "step 3-4") stays preserve. That is a comment about the ADR0020 recovery steps, not an asserted output.

### Other items (ok)
- The 82 rejects are fixtures inside test-created temp repos (initRepo, tmp). Operands: docs/decisions/*.md and 0000-index.md fixture writes/reads/existsSync, `.fgos/config.json` in the temp repo, `repoRoot = initRepo()`, and string joins. Each nonDocumentUse is true under R5/R21. The product code under test (merge.mjs decision-id self-resolve) only has a preserve record (003771), so no Phase 9 change reaches these fixtures. Passage-level consistency holds: for example, comment 004452 (line 581) is admit/preserve with successorNote docs/decisions/index.md, while the fixture writes at 587/594 are rejects. These are different operations, not one passage.
- The other admitted comment pointers (docs/history/**, docs/backlog.md, how-to/explanation references at 443, 579, 1080, 1162, 1197, 1464, 1544, 1957) preserve as dated provenance. docs/history and docs/backlog.md are retained, and these are not module-header pointers.

### Record-text notes
- 004421/004460: the reason and the witness `scope` ("test-owned synthetic input/output") are wrong. The string is real product output, not synthetic.
- The R5 reason on rejects carries the sentence about "numbered/index spelling ... synthetic data" even for items that do not name 0000-index. This is harmless.

## test/docs/decisions-corpus-retired.test.mjs

Verdict: rework. 34 items reviewed (22 references, 12 dynamic tuples). Diff is on a source test file, patches 3 admitted passages, with forward and rollback diffs. Diff content matches the admitted patch items. It changes only the lines named by 004033, 004037 and 004046/018741, and the inverse restores the originals.

### Verified ok
- Patch targets exist at the pin:
  - docs/platform/runner/decisions/h-36d872fbb0e5.md carries the exact single level-two retired-section marker (count 1), and every heading original runner.md contributed (0005 to 0035), including `### 0032 — Cổng Iron Law`.
  - docs/platform/system-overview/spec.md carries the marker once plus 0016 and 0018.
  - The patch therefore keeps assertions at 71, 80 and 87 true for these two members.
- Parks are specific and their evidence is true:
  - 004034 and 004047 (work-state): the live holder retired-decision-history.md has no marker. It has `## 13. ADR 0032 Multi-Role Team Harness`, not `### 0032 — Multi-role Team Harness`. It also has a different section layout.
  - 004040 (foundations): searching docs/platform and docs/knowledge finds no `### 0001`, and docs/platform/platform-foundations.md has no decision-section inventory.
  - 004035 (architecture-map): the original root file supplies `### 0010`, `### 0015` and `### 0017`, and the proposed platform file lacks them.
  - 004048, 018738, 018742 and 018743 follow the same blockers.
- Dated-provenance and retained-docs/decisions preserves (004029, 004030, 004036, 004039, 004041, 004043) and the negative regex assertion 004042 are consistent with the L12-80 rulings.
- Test-name label rejects (004028, 004031, 004032, 004038, 004044, 004045, 004049) are correct. 004038 carries a successorNote.

### OUTCOME defects

D2. dynamic-018740 (line 74) and dynamic-018744 (line 88). REJECT as text-label-join, but both are admitted-class operations that must be admitted. They print fixed document paths in assertion diagnostics:
- 018740: `${NARRATIVE_TARGETS.join(', ')}` prints all five fixed document literals.
- 018744: `${rel}` takes its value from NARRATIVE_TARGETS.
- R6: user-visible messages whose printed path comes from a fixed document literal are admitted, because the output changes if the path moves.
- The patch records themselves say (004033 and 004037) "assertion diagnostics at lines 74/88 may print the rebound target on failure", and the patch diff changes what those diagnostics print. A record that acknowledges the output delta while rejecting the tuple is inconsistent.
- Correction: ADMIT both. The disposition follows the NARRATIVE_TARGETS members. For example, 018740 can use the same patch output delta (runner and system-overview rebound) plus the same parks (work-state, foundations, architecture-map). Name the output delta in the reason, and state in the rollback that the delta is the printed path text only. If Lead decides these diagnostics are not user-visible output, then this defect and the 004033/004037 acknowledgement should instead be removed from the reasons. The two must agree.

### Lead-judgment questions
Q1. After the patch lands, NARRATIVE_TARGETS has three parked members (work-state, foundations, architecture-map retained root). The Phase 9 test stays red until Step 7 resolves them. Confirm that parks-leave-test-red at the cutover is acceptable here, rather than patching all five members to one coherent holder set. The park reasons themselves are correct.

### Record-text notes
- 004034 blockedReason says the live holder "uses ### 0032 Foundation Architecture". That heading exists, but the substantive gap is the missing marker and heading layout. The text is fine but could name the 0032 Multi-Role Team Harness gap, as 004047 does.
- dynamic-018737 (line 68) rejects the `.join('\n')` while dynamic-018738 admits the read on the same line. This is acceptable as two independent operations under the L12-72 actual-operation rule.

## Counts
- Files: 2. Both rework.
- Items reviewed: 128 (94 + 34).
- OUTCOME defects: 3 items across 2 groups. D1 is 2 items (004421, 004460). D2 is 2 items (018740, 018744), as written above. Total 4 items.
- Record-text notes: 3.
- Lead questions: 1.

Status: DONE_WITH_CONCERNS
Summary: Two outcome defects. In merge.test.mjs the assertion on the emitted how-to path (004421/004460) is preserved though the source emit line is patched in Phase 9; it must be a patch with a co-cut diff. In decisions-corpus-retired.test.mjs the diagnostics that print fixed document paths (018740/018744) are rejected but should be admitted. The patches and parks in that file are otherwise sound.
