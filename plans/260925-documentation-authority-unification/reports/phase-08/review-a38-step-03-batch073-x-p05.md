# Review a38 Step 3 batch-073 expansion, Part 05

Pin: ae141550c2e022310de7a0efea757580c0b2479f (source/targets read via git show). Worktree 63952951a, read-only. No checker or probes run. Reader: semantic reviewer, single file.

Method: read the full pinned source (71 lines, 2 paging-equivalent reads in one cat -n); extracted every per-edge field and the diff and the coverage/legacyScan block with python; verified the target path exists at the pin; checked owner-answers L12-10/line 88 and 221 on docs/history retention.

## File: docs/knowledge/how-to-write-a-task-spec/write-a-task-spec.md
Set batch-073, stratum full-set-expansion (no patched/unpatched/supplement overlap). Verdict: ok. Edges reviewed: 1 of 1.

- maps-j-04526, source L70 `docs/history/fgos-marketing-domain-foundation/plan.md`, preserve, unit item-L68, no target/anchor, timing none. The path exists at the pin (plan.md blob 3bc6b406). docs/history/** is a retained tree (owner-answers L12-10, line 88: history is not a legacy authority root; line 221: references are preserved). The reason quotes the complete source unit (L68-71), claims no moved authority or reader redirect, and the diff is empty, matching preserve. Correct.
- Missed-reference scan: no other docs/specs, docs/decisions, docs/how-to, docs/architect, docs/platform or decision-file references in the file. `src/state/workflow-stage-graphs.mjs`, `core/task-specs/`, `domains/<domain>/task-specs/` are code/source paths, not retiring doc roots. D7/D27/D5/D6/D9/D16 and tsk-2t9c are bare ids, not decision filenames or links. legacyScan candidates list is empty; consistent with my read. authorAddedEdgeIds empty, correct.
- Diff: empty, no consumer edit; correct for a preserve-only file.

Defects (outcome): none.
Record-text notes: none.
Lead-judgment questions: none.

## Counts
- batch-073 set (this part): reviewed 1 / rework 0.
- Stratum full-set-expansion: reviewed 1 / rework 0. Other strata (historical-patched, historical-unpatched, corrected-lead-supplement): 0 files in this part.

Dissent: none. No acceptance or phase close implied.

Status: DONE
Summary: The single file write-a-task-spec.md has one preserve edge for the retained docs/history path, which is correct; no missed references. Verdict ok, 0 rework.
