# Review a38 — step-03 wave5c expansion, part p05 (batch-081, 3 files / 19 edges)

Reviewer: a38bffac1a97299b8. Pin ae141550c; worktree read-only. No checker or probe run. Every edge read with the pinned source (read whole, all files under 5 KB) and each patch target at the pin. The 19 edges are the 4 + 8 + 7 expected, counting the author-added line-63 edge in file 3.

Record/diff hashes: I did not recompute them. The assignment pointed to the frozen index but gave no hash fields to compare against, and the checker already passed.

## File 1 — docs/knowledge/why-the-decision-id-collision-auto-resolver-only-trusts-a-sh/merge-auto-resolves-decision-id-collision.md
Set batch-081, stratum L12-51-changed-file-targeted-re-review. Verdict: **ok**. 8 edges reviewed; 4 patch hunks match the diff exactly.

- 04978 (patch, Phase 9): target is the tsk-66l by-hand collision how-to. The target exists at the pin and the whole-file justification is true. ok.
- 04979 and 04981 (parked, step5-parity): `docs/decisions/0000-index.md` is described as the current classifier/auto-resolver operating surface. A path-only rewrite would lose the collision semantics, so the park is right. Both edges carry the L12-51 note that `docs/decisions/index.md` is a record-only successor (generated projection). ok.
- 04980 (preserve): wrapped path at L46-47 for `docs/history/tsk-3mv-merge-loop-self-resolve/plan.md`. It exists at the pin, and the spans cover both lines. ok.
- 04982 (patch, anchor `business-rules`): target is `docs/platform/runner/subcomponents/h-6979005beaf7/spec.md`. This is the L12-51(2) re-check. Source L81 "RUL34/RUL37 ... CONTEXT.md D2" is a present-tense citation despite the frontmatter date, so it patches to the live holder. The target exists. RUL34 (Iron Law is an OR of the module test and the risk-keyword test) and RUL37 (Iron Law asks at the trunk boundary) are both in the target, at L63 and L67. The heading `## Business Rules` gives the anchor. The reason does not overclaim. ok.
- 04983 (patch): Related-list entry for the same how-to as 04978. It names the tsk-66l occurrence, and the target is the same file, so it is consistent. ok.
- 04984 (preserve): `docs/history/tsk-3mv-.../CONTEXT.md` exists. ok.
- 04985 (patch): target is `docs/knowledge/why-mergerunneritem-now-checks-ancestry-.../merge-idempotent-on-already-merged-branch.md`. It exists, and its content (isAlreadyMerged, ancestry check) matches the "prior fix to this same file" gloss. ok.

No missed references: the scan has 0 candidates, and `id 0021` and `src/runner/merge.mjs` are not legacy paths.

Record-text notes: none.

## File 2 — docs/knowledge/why-the-gateway-s-patch-work-id-edit-route-uses-patch-semant/why-the-gateway-edit-route-reuses-editable-fields-and-passes-through-fgos-edits-refusal.md
Set batch-081, stratum L12-51-changed-file-targeted-re-review. Verdict: **ok**. 4 edges reviewed.

- 04992 (preserve): `docs/ui-spec/modals/M03-add-edit-item.md` is a retained path and exists. ok.
- 04993 (preserve): `docs/contracts/fgos-gateway-api-v1.yaml` exists. It is a footprint citation. ok.
- 04994 (patch): this is the D7 anchor re-check. The anchor is now `d7-gateway-is-the-one-internal-chokepoint-that-ever-spawns-a-verb`, as L12-51 required. The target file exists, and its line 57 heading `## D7: gateway is the one internal chokepoint that ever spawns a verb` produces that anchor. Source "Chokepoint principle cited from tsk-7l9 D7 ... gateway never touches the repo directly, every write goes through a real fgos verb" matches D7 (reads and writes go through the gateway, which is the single spawner). The diff replaces the path plus the `#d7-...` fragment. The earlier D10/D9 mismatch is gone. ok.
- 04995 (preserve): `docs/history/herdr-web-dashboard-plan-realignment/` is a directory that exists at the pin. It is a `Source:`-section provenance citation. ok.

Record-text note (not rework): the 04994 reason says the D7 section "forbids direct state imports". The D7 text I read says only that reads and writes go through the gateway and the orchestrator never spawns a verb itself. The claim is slightly stronger than the section. The anchor and target are still correct.

## File 3 — docs/knowledge/why-the-launcher-vocabulary-word-guard-was-retired-right-aft/why-the-launcher-vocabulary-word-guard-was-retired-right-after-tsk-1s5-fixed-it.md
Set batch-081, stratum L12-51-changed-file-targeted-re-review. Verdict: **ok**. 7 edges reviewed: 6 inventory edges plus the added L63 edge.

- 05014 (preserve): `docs/history/fgos-coding-driving-item-display/CONTEXT.md` exists. It is a past-event leak location. ok.
- 05015 (preserve): the removed how-to, with the source itself saying "have since been removed". Its history identity is preserved and the reason states there is no successor. ok.
- 05016 (patch, anchor `0031-bỏ-guard-...-đã-gán-nghĩa-mới`): live pointer to `docs/specs/runner.md`, patched to the runner decisions holder `docs/platform/runner/decisions/h-36d872fbb0e5.md`. The pinned target heading at L993 is `### 0031 — Bỏ guard cấm từ orchestrator sau khi 0029 đã gán nghĩa mới`. It matches the adjacent description (the full reasoning for the retirement, including why a narrower fix was not viable). The visible label stays correct because the title is unchanged. ok.
- 05017, 05019 (preserve in the Pointer maintenance history region): both are declared with `historyRegion` heading, line 60 and marker "No other content". The source narrates past tsk-4ah work in the past tense, which fits L12-46.
- 05018 (preserve): the wrapped path `docs/history/orchestrator-worker-slots/DISCUSSION.md` exists. The spans on L67-68 are correct. ok.
- **author-wave5f-launcher-vocabulary-guard-L63C2** (new preserve, L63): this is the new launcher line-63 deleted 0031 edge. The deleted basename `0031-bo-guard-cam-tu-orchestrator-sau-khi-0029-gan-nghia-moi.md` is covered as the pre-rename deleted-decision identity. It has `historyRegion` and `targetFacts` (state removed at 4722361ae, normalized to `docs/decisions/0031-...md`) and carries a title-matched non-executable successor note. This follows L12-51 and L12-39(7). The `legacyScan` shows 1 candidate, mapped to this edge. ok.

Record-text notes (not rework):
1. The L63 reason has two "Non-executable successor note" fragments. The first anchor is `...0029-gán-nghĩa-mới`, which lacks "đã" and matches no real heading. The second, `...0029-đã-gán-nghĩa-mới`, is correct. The first looks like a stray slug and could be dropped.
2. 05017 and 05019 preserve the retiring identities `docs/specs/runner.md` and `docs/specs/reading-map.md` in the history region. Their reasons carry no successor note. L12-46 asks for title-matched successor notes. For 05017 an obvious holder exists: `h-36d872fbb0e5.md` section 0031, which the same file's L55 patches to. For 05019 there is no reading-map holder named. The checker passed, so I treat this as a note, not an outcome defect.

## Lead-judgment questions
1. Should the L12-46 successor-note requirement be applied to 05017 and 05019 (see note 2 in file 3)? The L12-51 text and the L12-46 text read differently on it.
2. Was the first fragment of the L63 successor note an intentional alternate spelling or a leftover? It has no effect on the outcome.

## Counts
- Per set: batch-081 reviewed 3 files / 19 edges, rework 0 files / 0 edges. Record-text notes: 3 (file 2 reason overclaim, file 3 notes 1 and 2).
- Per stratum: L12-51-changed-file-targeted-re-review reviewed 3, rework 0. There are no overlaps with other strata; every file in this part carries only that inclusion.
- OUTCOME defects: none. All three files are ok.

Status: DONE
Summary: All 19 edges across the 3 batch-081 files check out against the pinned sources and targets (04994 D7 anchor, 04982 RUL34/RUL37 present-tense patch, and the new L63 deleted-0031 preserve all correct). I found no outcome defects. I found only record-text notes: a slightly overstated 04994 reason, a malformed duplicate successor-note anchor on the L63 edge, and missing successor notes on 05017/05019.
