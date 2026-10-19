# Review a38 step-03 wave4d Part 02

Pin read: ae141550c2e022310de7a0efea757580c0b2479f (author pin). Worktree detached at bb4b304e9, read-only. No checker or probe run. Both consumers were read whole at the pin (4,183 B and about 8 KB). Every record field was extracted per edge and each full diff was read. Target passages were read at the pin.

## Summary table

| Set | File | Stratum | Edges | Verdict |
|---|---|---|---:|---|
| batch-074 | docs/knowledge/the-9-findings-from-the-2026-08-14-haiku-scan-fable-code-rev/gateway-subsystem-audit-260814-findings.md | patched (seeded) | 5 | ok |
| batch-073 | docs/knowledge/how-to-resolve-an-fgos-approve-merge-conflict-caused-by-two/resolve-a-decision-id-collision-merge-conflict-on-approve.md | patched (open-lead-ruling supplement, outside the seeded union) | 16 | rework (1 outcome defect) |

Per-set and per-stratum counts. Patched means a nonempty diff. No unpatched file is in this part.

| Set / stratum | Reviewed | Rework |
|---|---:|---:|
| batch-074 / patched | 1 | 0 |
| batch-074 / unpatched | 0 | 0 |
| batch-073 / patched (supplement file) | 1 | 1 |
| batch-073 / unpatched | 0 | 0 |

The batch-073 file is the open-lead-ruling inclusion, not a seeded sample. Its rework is therefore outside the A51 sampled denominator unless the Lead chooses to count it. Overlaps: none; each file is in exactly one set and one stratum. 21 edges reviewed in total (5 + 16).

## File 1: gateway-subsystem-audit-260814-findings.md (batch-074), ok

Source lines 14-17 hold the 5 edges. All five are correct.

- maps-j-04566 (L14, `docs/contracts/fgos-gateway-api-v1.yaml`): preserve. The file exists at the pin. The L12-26(3) retained contract path is kept. Its runtime-read class is Step 5, so preserve is correct.
- maps-j-04567 (L15, `docs/history/fgos-gateway-mcp-surface/`): preserve. The directory exists at the pin with 3 files. No alias retires it.
- maps-j-04568 (L15, `docs/history/fgos-interface-daemon/`): preserve. The directory exists at the pin with 3 files. No alias retires it.
- maps-j-04569 (L16, `docs/explanation/why-the-fgos-interface-daemon-is-one-process...md`): patch, Phase 9, to `docs/knowledge/why-the-fgos-interface-daemon-combines-gateway-and-orchestra/why-the-fgos-interface-daemon-is-one-process-that-only-ever-shells-out-to-the-cli.md`.
  - The registry alias and the target both exist at the pin.
  - The adjacent text is "the base design this audit reviewed". The target is the whole interface-daemon design explanation, so the description matches.
  - No anchor, which is correct for a whole-design reference.
- maps-j-04570 (L17, `docs/reference/fgos-gateway-api-ctr010.md`): patch, Phase 9, to the knowledge CTR010 file.
  - The registry alias (`aliases: docs/reference/fgos-gateway-api-ctr010.md`) and the target exist at the pin.
  - The target states the contract location and CTR010 scope. This matches the claim.

The diff is one hunk, `@@ -13,8 +13,8 @@`. Only L16 and L17 change, and the labels follow their destinations. It is well-formed.

No missed references. The other paths in the file (`plans/reports/...`, `herdr-plugin/src/gateway.rs`, `AGENTS.md`) are not legacy-tree paths.

## File 2: resolve-a-decision-id-collision-merge-conflict-on-approve.md (batch-073), rework

All 16 edges reviewed, covering L14, 40, 41, 58, 60, 98, 100, 106, 124, 125, 130, 134, 152, 157 and 163.

### Outcome defect (1)

**maps-j-04449, L157, `docs/how-to/diagnose-a-verify-fail-post-merge-block-on-approve.md`.** The disposition is a `description-rewrite` park. It should be a patch (Phase 9, whole-file) to the registry holder.

- Rules: L12-37(1), L12-30(1) (target resolution before any park) and L12-32(3) (park only on a real adjacent-description mismatch).
- The registry holder exists at the pin: `docs/knowledge/how-to-diagnose-an-fgos-approve-blocked-by-verify-fail-post/diagnose-a-verify-fail-post-merge-block-on-approve.md`. The rename is recorded at d178d241f.
- The adjacent gloss reads "including the same `blocked -> proposed` recovery edge used in step 5 here". The target does contain that edge. Its step 5 (target L64-72) says "The FSM's recovery door here is `blocked -> proposed`" and runs `fgos move <id> --to proposed`. L81-87 then note that the status is named `awaiting-approval` today.
- The source's own step 5 (L79-81) also says "--to proposed, or --to awaiting-approval, whichever". So the gloss matches the target and the source's own step 5. No path-only redirect makes it false.
- The record's premise, "the live recovery edge is awaiting-approval", is a vocabulary-currency concern about the source text. The target documents it explicitly. It is not a mismatch between this citation and its target.
- Consistency: 5 other edges in batches 072-074 patch to this same target (04329, 04404, 04405, 04407, 04408, 04538). Only this edge parks, on a different premise.
- Correction: disposition `patch`, target as above, anchor null (whole-file guide), timing Phase 9. The diff would change L157 and keep L158-160 unchanged.
- This is a judgment-grade call. See the Lead question below.

### Edges judged correct

- maps-j-04435 (L14, `docs/decisions/0000-index.md`): `description-rewrite` park. The file was removed at 4722361ae with no successor; the retained `docs/decisions/index.md` is generated (`generated: true`, "generated by `fgos decision-index`"). The entry condition needs a rewrite rather than a redirect. Correct. The category is right: it is a reader condition, not a writer recipe.
- maps-j-04436 (L14, `docs/decisions/NNNN-*.md`): preserve. This is a glob and illustrative pattern, resolved to the retained directory. Correct under L12-26.
- maps-j-04437 (L40, `docs/decisions/`) and 04438 (L41, `docs/decisions/00` as a regex prefix): preserve. The directory exists at the pin and holds only `index.md`. See Lead question 2 about the dead recipe.
- maps-j-04439 (L58) and 04440 (L60): `step5-parity` parks. These are the operative scratch-merge writer lines (hand-fix markers and `git add` on the removed manual index). This matches the authoring digest ("two operative index writer lines park on Step 5 parity"). The category is correct and the two edges are consistent with each other.
- maps-j-04441 (L98, `0023-*.md`) and 04442 (L100, `0023-uu-tien-san-pham-*.md`): preserve. This is the dated tsk-66l example, so the history disposition is right. The runner anchor `0023 Thứ tự ưu tiên sản phẩm...` exists at `docs/platform/runner/decisions/h-36d872fbb0e5.md` L469 and the title matches 04442. See record-text note 1 about 04441's note.
- maps-j-04443 (L106, `0000-index.md`): preserve as completed-conflict history. The successor note `docs/decisions/index.md` exists at the pin and matches how other records note this path (033/061/073).
- maps-j-04444 (L124): ruled per the assignment. L12-41(4) resolves it to preserve with a successor note to `docs/platform/runner/decisions/h-36d872fbb0e5.md`, heading "0032 Cổng Iron Law". I verified the heading exists (L1095). The deleted file `0032-cong-iron-law-chi-hoi-o-ranh-gioi-trunk-them-muc-warn.md` is removed at 4722361ae and is the only deleted 0032-iron-law-ish file. No defect.
- maps-j-04445 (L125, `0032-multi-role-team-harness-...md`): preserve with a note to `docs/platform/work-state/decisions/retired-decision-history.md#13-adr-0032-multi-role-team-harness`. The heading "## 13. ADR 0032 Multi-Role Team Harness" exists (L767). The deleted full name matches. The title match is correct and kept separate from Iron Law. The record uses the real deleted filename, as the request said.
- maps-j-04446 (L130, `docs/specs/distribution.md`): preserve. It is in the completed 2026-08-16 audit conflict-file list, so it is history evidence. The note `docs/platform/packaging-distribution/spec.md` is a plausible holder.
- maps-j-04447 (L134): patch, Phase 9, to the knowledge `merge-auto-resolves-decision-id-collision.md` with anchor `#the-shape-being-auto-resolved`.
  - The registry alias exists.
  - The adjacent claim is "its own precondition requires the only conflicted path to be the index file". Target L19-32 states exactly that ("the ONLY conflicted path is the index file"). The anchor is the most specific enclosing heading.
  - The diff hunk applies cleanly at L131-137 with correct context.
- maps-j-04448 (L152, `docs/decisions/`): preserve, directory retained. See Lead question 2.
- maps-j-04450 (L163, `0000-index.md's own STR72 supersession convention`): `description-rewrite` park. The convention is attributed to the removed manual index and the generated index is not that artifact. No path-only redirect keeps the description true. Correct.

Diff check: the only hunk is `@@ -131,7 +131,7 @@`, for 04447. The label and anchor are consistent with the destination. All other edges have no diff, as expected for preserves and parks.

No missed references. Every legacy path token is an edge: L14 x2, L40, L41, L58, L60, L98, L100, L106, L124, L125, L130, L134, L152, L157 and L163. The other `docs/...` tokens in the file are none. The `CHANGELOG.md`, `bin/fgos.mjs`, `src/setup/registrations.mjs`, `test/setup/checks.test.mjs` and `scripts/next-doc-id.mjs` tokens are not legacy-tree paths.

## Record-text notes (not rework)

1. maps-j-04441 (L98, `docs/decisions/0023-*.md`) is the tsk-66l draft. That draft was renumbered to 0024 (retired-decision-history `## 11. ADR 0024 Rename Proposed Status To Awaiting-Approval`). Its successor note names the 0023 product-priority narrative instead, with a disclaimer that the note "applies only to the explicitly contrasted main-branch priority record". A note on this edge that points at a different decision, plus a disclaimer, is awkward. The note number-matches the elided glob per L12-41(4), so the checker is satisfied. A cleaner note would name the 0024 holder for the draft, or omit the note on 04441 and keep it on 04442.
2. maps-j-04437 and 04438 (same fence) use different reason styles. 04437 quotes the whole fence as its unit and 04438 is a one-line regex-prefix reason. The dispositions agree, so this is wording only.
3. The unit ids are inconsistent inside one fence. L58 and L60 are separate `line-L58` and `line-L60` units. L40 and L41 are `line-L40` and `row-L41`. This does not change any outcome.

## Lead-judgment questions

1. **maps-j-04449 park or patch.** I classed the park as an over-park because the target literally documents the same `blocked -> proposed` edge and flags the status rename itself. If the Lead holds that the gloss must be rewritten to say `awaiting-approval` (a vocabulary-currency rewrite of the source), the park stands. In that case the reason should say the park is for source-status vocabulary, not for a target mismatch, and the category should still be `description-rewrite`.
2. **Stale recipes at L40-41 and L152.** The step-2 recipe greps `docs/decisions/00[0-9]+-` files, and the L152 lesson tells readers to sweep `docs/decisions/` for duplicate numbers. At the pin the directory holds only `index.md` (decision records retired at 4722361ae), so both recipes return nothing. The path-edge rule (L12-26(3), directory retained) supports preserve, which is what the author did. The recipe obsolescence is not a path-migration outcome and is not counted as a defect. Decide whether it needs a parked note. The same applies to the step-3 renumbering instructions, which have no inventory edge.

Status: DONE
Summary: File 1 (batch-074, 5 edges) is ok. File 2 (batch-073, 16 edges) is rework: one outcome defect, maps-j-04449, over-parked and should patch to the registry holder. Two record-text notes and two Lead questions are recorded; 04444 is treated as ruled.
