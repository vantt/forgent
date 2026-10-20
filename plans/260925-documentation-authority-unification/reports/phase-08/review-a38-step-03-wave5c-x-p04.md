# Wave 5c expansion review, part p04

Reviewer: independent read-only semantic reviewer. Pin ae141550c; worktree detached at 0d1fb3bff. No checker or probe was run. Every edge, the full diff and the whole pinned source were read for each of the five files.

## Summary

| Set | Files reviewed | Edges reviewed | Rework files |
|---|---:|---:|---:|
| batch-073 | 1 | 16 | 0 |
| batch-074 | 1 | 3 | 0 |
| batch-077 | 2 | 10 | 0 |
| batch-081 | 1 | 9 | 1 |
| Total (stratum "L12-51-changed-file-targeted-re-review") | 5 | 38 | 1 |

All five files fall in the single stratum L12-51-changed-file-targeted-re-review. There is no overlap with any other stratum in this part.

## Per file

### 1. batch-073: docs/knowledge/how-to-resolve-an-fgos-approve-merge-conflict-caused-by-two/resolve-a-decision-id-collision-merge-conflict-on-approve.md
- Digest 7f647ad2b7018ed4f490179321407228cb13dd2a9176d2241e9218593d4c569a (equals the inventory digest).
- Diff: two hunks. The first is the 04447 link to the auto-resolver explanation with anchor `#the-shape-being-auto-resolved`. The second is the 04449 Related link.
- Verdict: **ok**. 16 edges reviewed (04435 to 04450).
- Parks:
  - 04435 is a description-rewrite park. The live entry condition names the manual 0000-index.
  - 04439 and 04440 are step5-parity parks on the operative scratch-merge recipe.
  - 04450 is a description-rewrite park on the STR72 convention.
  - All four state the removal at 4722361ae and name the generated `docs/decisions/index.md` as a record-only successor. I confirmed the commit deleted `0000-index.md` and added `index.md`.
- Preserves:
  - 04436 and 04441 are illustrative patterns.
  - 04437 and 04438 are retained-directory and regex-prefix preserves. Both are true: `docs/decisions/index.md` exists at the pin.
  - 04443 and 04446 are completed-example evidence with successor notes.
  - 04444 and 04445 resolve the elided 0032 names uniquely. Both full names exist at the parent of 4722361ae. The notes go to the runner `h-36d872fbb0e5.md` heading 0032 "Cổng Iron Law" and to retired-decision-history "13. ADR 0032 Multi-Role Team Harness". Both headings exist.
  - 04448 is the retained directory.
- Patches:
  - 04447: the target `#the-shape-being-auto-resolved` heading exists. Its text says the only conflicted path must be the index file, which matches the source gloss.
  - 04449: sibling gloss agreed with L12-42. The target's Related section documents `blocked -> proposed`.
- Legacy scan has 0 candidates and there are no missed references.
- Record-text notes only: 04441 names the product-priority 0023 successor on the tsk-66l draft edge, and the reason hedges this itself. 04443 says "no successor file" and then names `docs/decisions/index.md` as a successor note. Neither affects the diff, disposition or target.

### 2. batch-074: docs/knowledge/state-machine-module-file-names/state-machine-module-file-names.md
- Digest aaefbb62c81df89b309cfd0230506948945bfe75a9d01043ba7ec9784fbb87c7. The diff is empty.
- Verdict: **ok**. 3 edges (04555, 04556, 04557).
- All three preserve `docs/architecture-manifest.json` and `docs/architecture-map.md`. Both exist at the pin and neither is aliased in the alias table or the registry. The alias table is empty and the registry has no entry. They are retained roots with live status, so the preserves are correct.
- The L23 and L38 passages are past-tense rename narration or a retained-root navigation pointer.
- No missed references.

### 3. batch-077: docs/knowledge/why-every-agent-task-tool-dispatch-is-enforced-through-a-pre/why-dispatch-decide-is-a-hard-hook-enforced-gate-not-a-convention.md
- Digest 56135aa57f25197aaad2b7ed475d9dce4133398b638c57967c95e0fade029974.
- Verdict: **ok**. 7 edges (04701 to 04706, plus the author-added 0000-index.md at L448 col 42).
- 04701 and 04703 are Phase 9 patches to the runner decisions file.
  - The anchors 0062 and 0033 match existing `###` headings (L1716 and L1211).
  - The diff replaces the full code span and keeps the parenthesis and the surrounding text intact.
- Preserves:
  - 04702, 04704 and 04706 name `docs/history/**` files. Both targets exist at the pin.
  - 04705 is an illustrative glob.
  - The author-added edge is the completed rename-history passage, and it carries the generated-projection note.
- All `docs/` hits in the source are covered. `_shared/capacity-dispatch-fallback.md` is not a legacy-root path.
- Lead-judgment question (not rework): see Q1 below.

### 4. batch-077: docs/knowledge/why-fgos-checks-repo-invariants-at-return-and-merge-instead/why-fgos-checks-repo-invariants-at-return-and-merge-instead-of-the-full-test-suite.md
- Digest 45f94e96f9c10ce7394e99c65594d661b638692359bd09e174ddac002320381b.
- Verdict: **ok**. 3 edges (04730 to 04732).
- 04730 preserves the retained root manifest in a past incident narrative.
- 04731 preserves the `docs/history` evidence path, which exists at the pin.
- 04732 is a patch to the registry-alias holder of the verify-fail-post-merge diagnosis guide, consistent with the sibling patches under L12-42. The "manual playbook this item's fix partially automates" gloss is acceptable for the whole-file target.

### 5. batch-081: docs/knowledge/why-status-splits-into-status-statuscategory-only-for-the-fr/multi-domain-status-category-schema.md
- Digest 7cf21351c63b388bb6d6fdba95f7351fc3fbd3c632de2b97f81aa7dd60878048.
- Verdict: **rework**. 9 edges reviewed (04966 to 04974): 8 ok, 1 outcome defect.

#### OUTCOME defect: maps-j-04967 (source L165, `docs/decisions/0027`'s own "Audit" section)
- The record parks it as a phase9-carry. The reason and the searchWitness assessment both say the title-matched 0027 decision and its Audit reader list "survive only in retiring docs/specs/work-state.md; the current candidate work-state/spec.md does not carry that audit".
- That is false at the pin.
  - `docs/platform/work-state/decisions/retired-decision-history.md` is a candidate decisions file and is not under the retiring trees.
  - It holds `## 12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary`, with subsections Context, Decision, Consequences.
  - It also holds `### 0027 Consumer Audit` (L645) with `#### 0027 Audit 1` through `Audit 6` (L658 to L728).
  - The audit enumerates the readers of STATUSES, TRANSITIONS and RESOLVED_STATUSES across src/state, src/runner, bin/fgos.mjs and the external Rust consumer. That matches the source's description, apart from the old path name noted in Q2.
- The record's own extraLocatorSearches captured this heading as a live, non-carriage hit (anchor `0027-consumer-audit`). The assessment ignores that hit.
- The title matches by number and slug (Vietnamese "Domain sở hữu status đoạn trước delivered, supersede base-workflow-model D1-D3" against English "Domain Owns The Pre-Delivered Status Vocabulary"). The L12-51 ruling for 0004 already accepts this English/Vietnamese correspondence in the same file.
- Rules: L12-30(1) (a live hit outside carriage is the target; park only when nothing live is found); L12-30(2) (a park reason must name the true smallest blocker); L12-32(5).
- Correction: patch at Phase 9 to `docs/platform/work-state/decisions/retired-decision-history.md` with anchor `0027-consumer-audit`.
  - The diff would replace the `docs/decisions/0027` span at L165.
  - Description truth: the audit text names `packages/herdr-fgos-common/rust/src/fgos.rs` and the source says `herdr-plugin/src/fgos.rs`. This is the same file under a renamed path. The author should record the comparison, or park with a corrected reason that names the actual blocker.
  - The current phase9-carry park cannot stand with its false premise.

#### Other edges in this file (all ok)
- 04966: preserves the elided `0027-...md`. It resolves to `0027-domain-so-huu-status-doan-truoc-delivered-supersede-base-workflow-model-d1-d3.md`, which exists at the parent of 4722361ae.
- 04968, 04971, 04972, 04973 and 04974 are past-event or Source provenance preserves, correct under L12-47 and L12-51(3).
- 04969: patch to the registry holder `docs/knowledge/vi-t-verify-cho-m-t-item-thay-i-skill-prose/write-verify-for-a-skill-prose-change.md`. The target exists.
  - Its "Năm cái bẫy đã gặp thật" section catalogs false-green greps, wrong branch resolution and the correct test surface. That matches the analogy gloss.
  - The wrapped code span is kept, as accepted in L12-45(3).
- 04970: preserve with a `historyRegion`.
  - The heading line 315, "The stale triage-table doc gap (`tsk-38t-8`)...", is correct.
  - The marker "so it shipped as its own" is on L322 inside the section.
  - The section narrates the completed child task in the past tense.
  - The path `docs/reference/triage-table-columns.md` does not exist at the pin. The record states the rename at 126a8ae to `docs/knowledge/fgos-triage-table-columns/triage-table-columns.md`, and that target exists.
- Missed references: none. The legacy scan has 0 candidates; the bare `DISCUSSION.md` on L384 is a sibling of a retained `docs/history` path.

#### Record-text notes for this file (not rework)
- Edges 04966, 04968, 04971, 04972 and 04974 preserve the removed 0027 decision but carry no successor note.
  - A title-matched holder exists: `retired-decision-history.md#12-adr-0027-domain-owns-the-pre-delivered-status-vocabulary`.
  - The 0032 notes in batch-073 (04445) and batch-077 name the same file's sections. The L12-51 record-text fix for 0004 does the same.
  - Add the same non-executable note here.
  - The checker probably misses it because the heading form is `## 12. ADR 0027 ...` rather than `### 0027 <title>`.
  - The same gap plausibly exists for 04221 (batch-070) and 01421 (batch-059). That is outside this part.

## Lead-judgment questions
- Q1 (batch-077 dispatch gate file, 04701 and 04703): The banner reads "Removed door (2026-10-14) ... were removed (decision 0062 in docs/specs/runner.md) ... The account below is kept as history." A dated banner plus "kept as history" could instead make the whole body history class under L12-51(2). The record treats the 04701 banner as live corrective navigation and patches both edges. Patching is not wrong, because the holder is accurate and 04703 is present-tense ("records this as an extension"). If the Lead reads the body as history, both edges would preserve with a successor note instead. I count no rework here, and wave4g review already accepted both.
- Q2 (batch-081, 04967): if the Lead prefers not to patch, the park must still be re-reasoned. The audit-reader holder exists in retired-decision-history, so a phase9-carry park on "survives only in retiring work-state.md" is false. A description-rewrite park for the renamed Rust path (`herdr-plugin/src/fgos.rs` against `packages/herdr-fgos-common/rust/src/fgos.rs`) would be the only honest park reason.

## Counts
- Reviewed 5 files / 38 edges. Rework 1 file, 1 outcome-defect edge (maps-j-04967).
- Per set: batch-073 0/1; batch-074 0/1; batch-077 0/2; batch-081 1/1.
- Stratum L12-51-changed-file-targeted-re-review: 1/5 files rework.

Status: DONE_WITH_CONCERNS
Summary: Reviewed all five files and 38 edges. Four files are ok; the batch-081 status-category file needs rework because 04967 is parked on a false claim that the 0027 audit has no candidate holder (`retired-decision-history.md#0027-consumer-audit` exists at the pin).
