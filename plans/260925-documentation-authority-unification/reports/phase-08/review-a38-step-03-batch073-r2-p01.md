# Review a38 — Step 3 batch 073 r2 p01 (pin ae141550c)

Set: batch 073 (2 files, 14 edges). Stratum: targeted L12-45 re-review. Method: per-field extractor, diffs, full relevant source/target regions read at the pin. No checker/probes run.

## File 1 — docs/knowledge/how-to-run-a-state-writing-fgos-verb-from-inside-a-picked-wo/run-a-state-verb-from-inside-a-worktree.md
Verdict: **ok**. 11 edges reviewed (04463-04473).

- 04472 (patch, schedule guide, anchor real-world-proof-tsk-1sj-...): CONFIRMED. The target's Real-world proof section (heading at L84; STORE_MISSING_WARNING_VERBS passage at L116-126) states that `fgos schedule` was missing from the set and returned a silent empty false-clear `{waves: [], cycles: []}` from a worktree. It was fixed by adding `schedule` to the set, and the `--dir <mainRoot>` fix applies. The anchor slug matches the heading exactly. The complete Related gloss ("the `fgos schedule` instance of the STORE_MISSING_WARNING_VERBS gap that the fourth case generalizes from") is true against that section. Diff changes only the path and anchor.
- 04466 (parked, line 156, description-rewrite): CONFIRMED correct to stay parked. The source claims the fix is in the schedule guide's "Update (tsk-3u2)" section. That target section (L70-82) covers parent/mergeAfter cycle detection only, with no warning-set fix. The text lives in the Real-world proof section instead. The source claim is a different, line-156 prose attribution, so it needs a rewrite and not a redirect. Sibling disposition split from 04472 is coherent.
- 04463 / 04467 (patch to runner decisions holder h-36d872fbb0e5.md#0020-...): the heading "### 0020 — Chặn `.fgos/` khỏi worktree worker (không khóa, không cô lập)" exists at L102 and the slug matches. Ok.
- 04464: preserve of the path inside a fenced captured-output block, with a successor note. Ok under L12-40.
- 04465, 04468, 04471: preserve of existing docs/history paths. Ok.
- 04469 (target clear-a-stuck-main-checkout-lock holder exists, no anchor), 04470 (anchor 2-register-it-in-command_registry matches "## 2. Register it in `COMMAND_REGISTRY`"), 04473 (anchor matches the "Update (`tsk-5iv`)..." heading): ok.
- Diff: the 4 neighbouring edges' changes are path/anchor rebinding only. No unrelated text was changed. The hunk headers are consistent with the edits (hunk metadata only).

OUTCOME defects: none.

## File 2 — docs/knowledge/how-to-self-resolve-a-merge-block-reported-as-verify-timeout/self-resolve-verify-timeout-integration-drift-and-unclassified-merge-failures.md
Verdict: **ok**. 3 edges reviewed (04484, 04485, 04486).

- 04485 (parked, line 55, description-rewrite): CONFIRMED. The source sentence says invariant D1 ("a root without all its children never lands partially") is locked by "the explanation's own source item". The trap section in the explanation (L58-67) is about topology versus the ancestry contract and does not state D1. The explanation has no D1 anywhere. D1 is in docs/history/merge-conductor-throughput-and-human-release/CONTEXT.md L27 ("Không cho root chưa gom đủ con land từng phần vào `main`"). The park is correct: the attribution and gloss must be reconciled before any redirect.
- 04484: preserve of the existing docs/history directory path (provenance line). Ok.
- 04486: patch to the merge-conflict playbook holder, which exists at the pin with a matching title and tsk-60h capture. The gloss ("already tried first") fits. unitId item-L76 versus span line 78 is just the list-item start. Ok.
- Diff touches only the 04486 path. Ok.

OUTCOME defects: none.

## Counts
- Set 073-r2: 2 files reviewed, 0 rework; 14 edges reviewed, 0 defects.
- Both outcome corrections (04472 patch, 04485 park) independently confirmed.

## Notes
- Record-text note only: 04485's reason says "the source attributes it to the explanation source item"; the source actually says "own source item" (tsk-51m, via the explanation's source_capture_ids). This is not an outcome issue.
- Lead-judgment questions: none.
