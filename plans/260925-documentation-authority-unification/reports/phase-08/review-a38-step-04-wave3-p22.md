# Review a38 — Step 4 wave 3, part 22 (set step04-025, second part)

Pin dc24ce645, src/runner/worktree.mjs (category A) read in full via the payload plus a docs-path grep of the pinned blob. 12 slot rows reviewed (9 preserve rows across 8 edges incl. duplicate l-000338, 2 patch, 0 parked), 1 Step 5 exclusion, 1 context edit.

Verdict: ok.

## Patches (comment-only, no behavior change)
- l-000328 (line 756): `docs/distribution-vision.md`'s "installed into other repos" story becomes `docs/platform/git/spec.md#7-hardened-git-backend-parsers-and-hook-contract`'s "No hardcoded trunk" contract. Target exists. The heading `## 7. Hardened Git backend, parsers and hook contract` slugs to the given anchor, and line 315 under it holds "No hardcoded trunk: explicit consumer target, remote default, then validated main attached branch". Appendix A rows G-018 (trunk from origin/HEAD, main/master, then literal) and G-044 (`createBranchRef` idempotent, from granted base or detected trunk) cover the adjacent createBranchRef/detectTrunk description, so the context edit is true. Context edit columns 36-70 on line 756 match the quoted text exactly. Hunk context lines 753-759 match the pinned bytes. The comment sits in a JSDoc block; `*` continuation preserved, backtick form kept, path is repo-root-relative like the original.
- l-000332 (line 1051): dead `docs/how-to/safely-reset-the-main-checkout.md` (absent at the pin) becomes the same-basename moved-verbatim knowledge holder `docs/knowledge/how-to-safely-git-reset-hard-the-main-checkout/safely-reset-the-main-checkout.md#before-you-start` (ruling 1). The file exists and `## Before you start` (line 17) requires the full `git status` before reset, which matches "the same discipline". Hunk context lines 1048-1054 match. Comment only.
- Diff touches only two ` * ` comment lines. No code or string changed.

## Preserve slots
- All seven docs/history targets exist in the pinned tree with history (pick-worktree-reclaim-zero-destroy/plan.md, root-worktree-drift-after-child-merge/{plan,CONTEXT}.md, stale-worktree-index-guard/CONTEXT.md, merge-worktree-reclaim-clobbers-kept-checkout/CONTEXT.md, tsk-6ch-merge-worktree-branch-fallback/CONTEXT.md, merge-ephemeral-branch-force-race/CONTEXT.md). They are named history/provenance. The wrapped ones (991-992, 1121-1122, 1392-1393, 1404-1405, 1479-1480) are covered by complete slots.
- l-000329 (line 926, `docs/decisions/0022 candidate #3`): a design-origin id citation that never existed as a path (witness: never-existed with the removed-decision exception). It preserves, and the successor note `docs/platform/runner/decisions/h-36d872fbb0e5.md#0022-khảo-sát-choke-point-fgos-quyết-định-lặplệch-xuyên-clirunnerskill` matches heading line 295 `### 0022 — Khảo sát choke-point fgOS ...`. OK.
- No parked slots in this file, so no live-holder witness is required.
- Step 5 exclusion l-000333 (line 1088): the `docs/how-to/tell-a-stale-worktree-index-...md` hint is inside a thrown WorktreeError template literal, so it is a runtime string and correctly excluded. The extra supplemental tuple lists the same span at the pin.
- No missed references: the blob grep shows every docs path is accounted for. 1051 and 756 are patched, 1088 is excluded, and the rest are preserve slots.

## Outcome defects
None.

## Record-text notes (not rework)
- Slot l-000327's inventoryRef originalLine (554) differs from its sourceSpan line (693) because it is pinned at the older census commit (consistent across all slots).

## Lead-judgment questions
None. `docs/distribution-vision.md` remains a retained source (L12-60), but L12-62 expressly names this passage for the git spec patch.

## Counts
Set step04-025 part 22: files reviewed 1 (A), outcome rework 0, slots 12 reviewed / 0 rework.

Status: DONE
