# A38 review: Step 4 wave 2, part 14 (set step04-008, 15 headerless plugin skill files)

Pin: author input dc24ce645. Worktree detached at 05862286c, read-only. All 15 sources read whole through EOF; all 41 slots reviewed (preserve 39, parked 2, patch 0, render-join 0). Records carry no diffs, so there is no patch/anchor/relative-path surface in this part. The record's `sourceSpans` text matches its stated line in every one of the 41 slots (script comparison against the pinned blob, 0 mismatches).

## Per-file verdicts (all stratum: mandatory re-review, set step04-008)

| File | Slots | Verdict |
| --- | ---: | --- |
| plugins/fgOS/skills/approve/SKILL.md | 1 (skills-132) | ok |
| plugins/fgOS/skills/cleanup-loop/SKILL.md | 3 (skills-133, skills-134, class4-l-002026 parked) | ok |
| plugins/fgOS/skills/cleanup-next/SKILL.md | 3 | ok |
| plugins/fgOS/skills/coding-shape-distill/SKILL.md | 1 | ok |
| plugins/fgOS/skills/coding-shape/SKILL.md | 2 | ok |
| plugins/fgOS/skills/deliver/SKILL.md | 4 | ok (see Lead-judgment Q1) |
| plugins/fgOS/skills/discover-next/SKILL.md | 2 | ok |
| plugins/fgOS/skills/discover/SKILL.md | 6 | ok |
| plugins/fgOS/skills/merge-loop/SKILL.md | 1 | ok |
| plugins/fgOS/skills/merge-next/SKILL.md | 3 | ok |
| plugins/fgOS/skills/plan/SKILL.md | 4 | ok |
| plugins/fgOS/skills/retro-loop/SKILL.md | 3 (skills-184, skills-185, class4-l-002095 parked) | ok |
| plugins/fgOS/skills/retro-next/SKILL.md | 4 | ok |
| plugins/fgOS/skills/terminal-close/SKILL.md | 1 | ok |
| plugins/fgOS/skills/terminal/SKILL.md | 3 | ok |

## The two wave-1 defects: now correct

- cleanup-loop line 31 (`class4-l-002026`) and retro-loop line 36 (`class4-l-002095`) are first-class slots with the right spans. Both are `parked` with a `blockedReason` and a non-executable successor note.
- The successor `docs/knowledge/why-fgos-merge-loop-tsk-1sm-recurses-into-loop-not-ck-loop/why-merge-loop-recurses-into-loop-not-ck-loop.md` exists at the pin.
- `git log` shows the original `docs/explanation/why-merge-loop-recurses-into-loop-not-ck-loop.md` was deleted by the migration commit a9f3007a6 (docs(tsk-5mh): migrate ...), so the dead-link diagnosis and the successor are right.
- The target `docs/explanation/...` is absent at the pin.
- The passage text quoted in each reason matches the source line. Parking with a successor note (not a patch) is consistent with the wave-1 Q1 reasoning and the Step 3 precedent for the same kind of dead pointer.

## Population-join sweep check

I searched every census inventory for edges whose consumer is one of these 15 files, and compared against the slots' inventoryRefs.

- **class4-l-\*:** every `class4-l-*` edge for these files is joined to a slot. The only two not joined are `class4-l-002024` (approve:189) and `class4-l-002089` (merge-loop:98). Both are correctly listed in `stepFiveExcluded` as fenced command examples (confirmed fenced at approve:188-190 and merge-loop:97-99).
- **class5/6 and generator:** no class5, class6 or `step-02l` edge for these files is missing. The `generator-i-*`, `class4-k-*` and `consumer_*` ids are earlier-iteration or reconciliation ids superseded by the `skills-NNN` / `class4-l` ids.
- **Wrapped edges:** the wrapped class4 citations (cleanup-next 100-101, deliver 89-90, discover 32-33 and 153-154, discover-next 24-25, plan 31-32 and 104-105, merge-next 17-18) each have a slot with both physical lines.
- **Target existence:** all 13 named `docs/history/**` targets and `docs/operator-runbook-herdr-cockpit.md` exist at the pin. `docs/history/**` is retained (L12-10 and owner-answers L221), so preserve is right.
- **Other path-like tokens:** my own grep over all 15 files found no other path-like references. The `src/...`, `plugins/.../close.sh`, `../_shared/*.md` and `references/blocked-pick-decision-tree.md` tokens are not retiring-root documentation edges.

## OUTCOME defects

None. 0 of 15 files need rework.

## Record-text notes (not rework)

1. skills-134 (cleanup-loop:60, `docs/history/` wrapped to line 61 `fgos-cleanup-loop/CONTEXT.md D3`) has a span on the first physical line only. Its census alias `class4-l-002027` also has only the line-60 ref. The path exists and the disposition is preserve either way. The sweep's own `deadPathScan` records both physical lines with state `existing`.
2. skills-136 and skills-142 reasons say "External-project history convention". These are named fgOS-repo history files that exist and are retained, not external-project placeholders. The preserve outcome is right; the shared boilerplate is generic. The same applies to skills-132 and skills-179, which are runtime branch-relative placeholders.
3. skills-192 (terminal:20, `docs/operator-runbook-herdr-cockpit.md`): the reason says "Retained native path", which is accurate. Wave 1 p08 accepted this, citing Step 3 precedent `maps-j-08226` (retained path stays literal).
4. The `mandatory` field text ("source->render header/slot correspondence") is stale for these files, which have no render join. This is harmless.

## Lead-judgment questions

- **Q1 (deliver:82-83, census `wrapped-0106`):** `docs/journals/260803-1612-main-checkout-direct-branch-checkout-tsk-4hk.md` is a wrapped two-line citation. The file exists at the pin, and `docs/journals` is not a retiring root, so the outcome would be preserve. The Step 2d wrapped rescan carries it as `wrapped-0106` for this file, with preCutoverAction "preserve bytes". No Step 4 slot carries it. The sweep's deadPathScan marks it state `existing` (path exists, not covered by a slot), and `wrapped-0106` is not in any record. Wave 1 judged it needing no slot, and the L12-60 join rule covers class 4/5/6 edges, not Step 2d wrapped edges. I did not count it as a defect, since the disposition would be preserve and no Phase 9 action follows. If the Lead wants every census edge slotted, add one preserve slot (no patch).
- **Q2 (terminal:20, skills-192):** owner-answers L12-20 (line 184) says a live consumer of a legacy-current file with a move alias, "such as `docs/operator-runbook-herdr-cockpit.md`", and names `skills-192` itself, gets a cutover patch. It also says preserve is allowed only for historical citations. The record preserves, and the wave-1 p08 reviewer accepted that, citing the switchboard "legacy-current maintained-authority" status and the Step 3 preserve precedent. A mirror exists at `docs/platform/herdr-web-dashboard/operations/operator-runbook.md`. Under the verified-decisions rule I did not reverse that acceptance, but the L12-20 text names this row explicitly. The Lead should confirm that a later ruling (L12-60) supersedes it, or that the doc is retained.

## Counts

- Set step04-008 (mandatory re-review): 15 files reviewed, 15 mandatory, 0 sampled strata (patched 0/0, unpatched 0/0).
- Rework files: 0 of 15 (0%), at or under the 3% bar.
- Slots: 41 reviewed (39 preserve, 2 parked).
- Outcome defects: 0. Record-text notes: 4. Lead-judgment questions: 2.
