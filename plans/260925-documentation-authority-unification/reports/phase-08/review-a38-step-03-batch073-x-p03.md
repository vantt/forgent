# Review a38 step-03 batch-073 expansion, Part 03

Pin read: author pin ae141550c2e022310de7a0efea757580c0b2479f via git show. Records: step-03-records/batch-073.jsonl, in a worktree detached at 63952951a. Method: for each file, the record fields were extracted with python3 (per edge: edgeId, sourceSpans, matchedExpression, disposition, unitId, target, anchor, timing, reason, blocked/dependency categories, targetFacts, searchWitness summary), and the diff and coverage scan were printed separately. Each consumer was read whole at the pin. Targets and anchors were checked at the pin. Anchors were checked with scripts/list-doc-anchors.mjs on stdin, which writes nothing. No checker or probe was run, and step-03-resolve.py was not run.

## Verdicts

| # | File (docs/knowledge/...) | Set / stratum | Edges | Verdict |
|---|---|---|---:|---|
| 1 | how-to-run-a-state-writing-fgos-verb-from-inside-a-picked-wo/run-a-state-verb-from-inside-a-worktree.md | batch-073 / full-set-expansion | 11 | rework (04472) |
| 2 | how-to-safely-git-reset-hard-the-main-checkout/safely-reset-the-main-checkout.md | batch-073 / full-set-expansion + historical-patched-selected | 3 | ok |
| 3 | how-to-see-done-items-in-fgos-list-fgos-triage/see-done-items-in-list-and-triage.md | batch-073 / full-set-expansion | 7 | ok |
| 4 | how-to-self-resolve-a-merge-block-reported-as-verify-timeout/self-resolve-verify-timeout-integration-drift-and-unclassified-merge-failures.md | batch-073 / full-set-expansion | 3 | rework (04485) |
| 5 | how-to-smoke-test-fgos-coding-implement-with-a-trivial-verif/smoke-test-fgos-code-implement-with-a-trivial-item.md | batch-073 / full-set-expansion | 3 | ok |
| 6 | how-to-sweep-the-clarify-decompose-backlog-with-fgos-discove/sweep-the-clarify-decompose-backlog-with-discover-loop.md | batch-073 / full-set-expansion | 0 | ok |

All 27 edges were reviewed (11+3+7+3+3+0). Edges are 9 patch, 14 preserve and 4 parked. The 4 parked edges are 04466 and 04472 in file 1, plus 04481 and 04482, which are preserves rather than parks (see below). I count the true parks as 04466 and 04472 only. There are no added edges. File 6 has zero edges; I read it whole and found no legacy path, decision or spec reference.

## Outcome defects (rework)

### D1. File 1, edge maps-j-04472 (source L264, Related list item) is parked wrongly and should be a patch

- **Source.** "`docs/how-to/compute-a-parallel-dispatch-wave-schedule.md` — the `fgos schedule` instance of the `STORE_MISSING_WARNING_VERBS` gap that the fourth case above generalizes from."
- **Record.** disposition parked, category description-rewrite. The reason says "The guide documents scheduling and cycle detection, not that warning-verb fix."
- **What the target holds.** The registry holder is docs/knowledge/how-to-compute-a-parallel-dispatch-wave-schedule/compute-a-parallel-dispatch-wave-schedule.md.
  - Its section "## Real-world proof (`tsk-1sj`): computed waves actually run concurrently, not just on paper" has the paragraph at L117-127: "The same review also found `fgos schedule` itself missing from `bin/fgos.mjs`'s `STORE_MISSING_WARNING_VERBS` set … Fixed by adding `schedule` to that set".
  - The gloss is therefore true for the target as written.
  - The record's own extraLocatorSearches hit this exact line (L117, unheaded-block-16) and the author discarded it.
- **Rules.** L12-30(1), because a live target exists outside carriage, and L12-30(6).
- **Correction.** Patch, Phase 9, to the target file with anchor real-world-proof-tsk-1sj-computed-waves-actually-run-concurrently-not-just-on-paper. I confirmed that anchor with listAnchors. The corrected reason should say the guide does document the `schedule` fix at L117-127.
- **Why 04466 stays parked.** It is the sibling edge (L156) and it is correctly parked. Its visible label names the guide's "Update (tsk-3u2)" section, and that section is about parent/mergeAfter cycle detection. That is the L12-35(9) stale-label case. Its reason is accurate. It only omits that the content exists in the Real-world proof section.

### D2. File 4, edge maps-j-04485 (source L55): the anchor and the justification are false

- **Source.** The sentence in the `integration-drift` playbook reads "(the same "root without all its children never lands partially" invariant D1 in `docs/explanation/why-merge-was-a-single-lane-funnel-under-a-16-lane-dispatch-pipeline.md`'s own source item locks)".
- **Record.** patch to the registry holder docs/knowledge/why-fgos-merge-throughput-bottlenecked-despite-parallel-disp/why-merge-was-a-single-lane-funnel-under-a-16-lane-dispatch-pipeline.md, with anchor the-trap-fixing-topology-before-the-ancestry-contract. The descriptionTruth assessment says "The target trap section states the root must gather its child DAG before root landing, including non-partial root closeout."
- **What the target holds.** At the pin, that section (L58-67) discusses nested leaf→root→main topology and the single-sha ancestry contract. It says nothing about roots gathering children or about partial landing.
  - A grep of the target for partial, gather, child, children, D1, D2 and D3 returns no hits.
  - The invariant D1 lives in the "source item" itself, docs/history/merge-conductor-throughput-and-human-release/CONTEXT.md L27: "Không cho root chưa gom đủ con land từng phần vào `main`".
- **Result.** The patch diff points at a heading that does not support the adjacent claim, and the recorded truth assessment is false. This breaks L12-30(6) and L12-26 (adjacent description true for the target). The file-level redirect to the explanation doc is defensible, because its source_capture_ids include tsk-51m and the sentence says "own source item", so only the section anchor and the reason are wrong.
- **Correction.** Choose one:
  - patch without an anchor, with a truthful reason such as "doc whose source item tsk-51m locks D1 (history CONTEXT L27)"; or
  - preserve or park if the Lead judges the sentence's "D1 in <doc>" wording requires the claim in the doc itself.
  Either way, the false assessment text (in descriptionTruth for 04485 and in the reason) must change.

## Edges verified ok (evidence)

**File 1.**
- 04463 (L21) and 04467 (L251) patch to docs/platform/runner/decisions/h-36d872fbb0e5.md.
  - The heading `### 0020 — Chặn .fgos/ khỏi worktree worker …` is at L102.
  - The anchor 0020-chặn-fgos-khỏi-worktree-worker-không-khóa-không-cô-lập is produced by listAnchors, which also yields a double-hyphen variant.
  - The adjacent gloss is true.
- 04464 (L31) preserve: fenced captured error output, with a successor note to the same holder. Correct under L12-40.
- 04465 (L148), 04468 and 04471 preserve: the history CONTEXT files exist at the pin.
- 04469 patch to clear-a-stuck-main-checkout-lock.md. The file exists and the gloss is true.
- 04470 patch to add-a-read-only-fgos-verb-and-plugin-skill.md#2-register-it-in-command_registry.
  - The heading "## 2. Register it in `COMMAND_REGISTRY`" is at L35.
  - The docs-index guidance at L55-59 makes "so it now flags the case" true.
- 04473 patch to safely-reset-the-main-checkout.md with the anchor update-tsk-5iv-… The heading is at L91 and the gloss is true.
- The scan lists all 11 source references. `docs/enduser-docs-index.json` is a retained file and not an edge.

**File 2.**
- 04474 preserve: the history CONTEXT exists.
- 04475 patch to runner decisions 0021. The heading "### 0021 — Wire main-checkout lock hook qua fgos doctor/setup, không epoch-fence" is at L211.
  - It is the full-name match for the deleted 0021-wire-main-checkout-hook-qua-doctor-setup.md, per L12-41(4).
  - The gloss, a different-purpose lock rather than the reset guard, is true.
- 04476 patch to clear-a-stuck-main-checkout-lock.md.
- The bare "ADR0020" at L119 is not a path and not an edge.

**File 3.**
- 04477 and 04478 are blockquoted captured decision quotes with their source link. 04479 and 04480 are Related items for retained history files. All four preserve, which is correct.
- 04481-04483 sit in "## Document history (compound-learn capture linkage)", an explicit history region, and name the consumer's own legacy path. They are self-alias and captured JSON, so they preserve under L12-39(6) and L12-40.
  - No self-pointing successor note is added, which is correct.

**File 4.**
- 04484 preserve: the retained directory docs/history/merge-conductor-throughput-and-human-release/ exists.
- 04486 patch to the merge-conflict playbook under docs/knowledge/merge-loop-and-merge-next-self-run-fgos-catchup-on-a-merge-c/…. The target exists and the gloss is accurate.

**File 5.** All three edges preserve, in the Document history region and its captured JSON.
- The source path docs/how-to/smoke-test-fgos-coding-implement-with-a-trivial-item.md never existed. git log shows only the "code" spelling, added at 8eba4a400, which is the registry alias.
- The never-existed fact is true. A preserve inside captured evidence is correct, and no alias patch applies because the spelling differs.

## Record-text notes (not rework)

- 04466 and 04472 reasons and witnesses: the L117-127 paragraph in the schedule guide is not mentioned. 04466's park stands, but its note could say where the fix actually lives (Real-world proof section). 04472 is covered by D1.
- 04485 and its extraLocatorSearches/descriptionTruth comparison notes repeat the same unsupported sentence in every comparison key. They must be corrected together with D2.

## Lead-judgment question

- Q1 (D2): is the correction a file-level patch to the explanation doc (without the trap anchor), or a park or preserve because "D1 in <doc>" is not stated in that doc? My reading favours the file-level patch with a truthful reason.

## Counts

- Set batch-073, this part: reviewed 6 files / 27 edges, rework 2 files (04472, 04485), numerator 2 of 6.
- Stratum full-set-expansion: 6 reviewed, 2 rework.
- Stratum historical-patched-selected (overlaps full-set-expansion; file 2 only): 1 reviewed, 0 rework.
- Strata historical-unpatched-selected and corrected-lead-supplement are not in this part.

Status: DONE_WITH_CONCERNS
Summary: 6 files / 27 edges reviewed; 4 files ok and 2 need rework. 04472 should be a patch to the schedule guide's Real-world proof section, because the guide documents the schedule warning fix. 04485's trap anchor and its stated justification are not supported by the target text.
