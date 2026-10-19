# Wave 3 review, Part 10 (batch-067 / batch-068), pin ae141550c

Method: each file read whole at the pin; every edge field extracted per edge (no full-record dumps); targets, anchors and adjacent descriptions checked at the pin; registry/alias lookups made. No checker or probe script run; nothing written to the worktree.

## Per-file verdicts

| # | Set | Path | Stratum | Edges | Verdict |
|---|---|---|---|---:|---|
| 1 | batch-067 | docs/explanation/root-resolution-two-call-split-propagation.md | unpatched-seeded | 2 | ok |
| 2 | batch-067 | docs/explanation/tsk-397-post-merge-review-remediation.md | unpatched-seeded | 2 | ok |
| 3 | batch-067 | docs/explanation/worktree-manual-merge-fgos-blob-safety-net.md | patched-seeded | 2 | ok |
| 4 | batch-068 | docs/how-to/author-a-plan-loop-track.md | unpatched-seeded | 3 | ok |
| 5 | batch-068 | docs/how-to/coordination-examples/architecture-advisory-panel-v1-alternative-and-composite-reopen.md | patched-seeded | 2 | ok |
| 6 | batch-068 | docs/how-to/coordination-examples/architecture-advisory-panel-v1-heterogeneous-and-homogeneous-roster.md | patched-seeded | 1 | ok |

No outcome defects found in any file.

## Edge findings

1. root-resolution
   - 03932 (L11, `docs/specs/runner.md` inside the "Removed door (2026-10-14)" banner): preserve is right. The passage carries an explicit dated past-action marker. It is consistent with the 17 other files carrying the same banner (batches 036/037/064-068).
   - 03933 (L19-20, link to the how-to): preserve is right. The target exists at the pin and the registry `currentPath` is unchanged. No other legacy reference in the file (the `.agents/skills/...` and `loop-mechanics.md` mentions are not legacy roots).
2. tsk-397
   - 03965 (L9-10, sibling `core-foundation-domain-boundary.md`): preserve is right. The file exists and the registry shows it active at the same path.
   - 03966 (L53, `docs/specs/reading-map.md`): preserve is right. It sits in a past-tense "pointed at ... Fixed" finding, which is history.
3. worktree-manual-merge
   - 03976 (L80-81, `docs/how-to/fix-fgos-write-rejected-merge-block.md`): patch is right. The path is absent at the pin, and the registry alias maps it to the docs/knowledge holder. Anchor `#steps` is the specific heading enclosing the recipe. The adjacent text ("full recovery recipe", restore the path to the branch's prior content) matches the holder's Steps 3-4. Phase 9 timing. The diff replaces exactly the source span.
   - 03977 (L82, `docs/how-to/resolve-an-events-jsonl-merge-conflict.md`): parked, description-rewrite. This is right. The alias holder opens with a "Superseded" note: the seq-contiguity scripts were deleted and the procedure is historical. The source still presents it as the events-specific "seq-contiguity angle", so a path-only patch would be false. The reason states the rename correctly and the original spelling is conserved. The 03976 patch and 03977 park differ on the same sentence, but the lines are separate computed units and the reasons differ per target.
4. author-a-plan-loop-track
   - 03982 (L151), 03983 (L195), 03984 (L249): all three are `docs/architect/agent-coordination/verification/<track>/<cell>.md`, parked as step5-parity. The three share a disposition and are not in one unit but are the same template. The path is a template placeholder, so there is no file to patch to. The park is reasonable (see Lead question 1).
   - Missed-reference check: `coding-cell-policy.md` (L152) is a bare basename. It resolves to `.agents/skills/_shared/coding-cell-policy.md`, a skill render, not a legacy root. `domains/coding/instructions/verification-discipline.md` (L290) is a live path. Neither needs an edge.
5. alternative-and-composite-reopen
   - 03991 (L33): patch to `docs/platform/agent-coordination/verification/architecture-advisory-panel/proofs/P01.2/proposals` is right. I checked the pinned tree OIDs for the architect and platform directories: both are `f0234f77e51976f06f16cf371020e3b0a2599c38`. The relative diff `../../platform/...` resolves correctly from docs/how-to/coordination-examples/. The adjacent text ("real, full text of all three") is unchanged and true for the mirror.
   - 03992 (L138): preserve is right. The sibling example file exists at the pin.
6. heterogeneous-and-homogeneous-roster
   - 04011 (L65, "decision 0062 in `docs/specs/runner.md`"): patch is right. The citation is undated and present-tense, so it is navigation under L12-37(3). The target `docs/platform/runner/decisions/h-36d872fbb0e5.md` has the heading "### 0062 — Xoá cửa thô; dispatch là tầng thấp; fanout về tầng Work ...". The anchor is identical to the one accepted for 06509, and the adjacent text ("a door since removed") matches the decision. The diff is correct and affects only that span.
   - The only other `.md` mentions are `SKILL.md` (not an edge).

## Record-text notes (not rework)
- 03932: the dated-banner preserve carries no record-only successor note naming the runner decisions holder. L12-37 says dated history wrappers stay literal with a record-only successor note. This is a notes gap at most; the successor is the same `h-36d872fbb0e5.md` decision 0062 used in 04011.
- 03982-03984: the reason string repeats "Illustrative convention/pattern ... no literal placeholder file is asserted" after the Step 5 text. Harmless.
- 03976: the patched line wraps mid-path inside a code span, as in the source. No effect.

## Lead-judgment questions
1. 03982-03984 are parked on Step 5 parity because the convention is a placeholder path. Concrete cell-trace file citations elsewhere (for example 15 edges in batch-068 coordination-examples, 7 in use-fgos-architecture-panel.md) patch to `docs/platform/agent-coordination/verification/...`, and that platform directory already exists at the pin, with a README and the same tracks. A Phase 9 patch to the directory prefix (`docs/platform/agent-coordination/verification/<track>/<cell>.md`) would therefore be possible. The park is acceptable, since no actual trace writer references the path in src/bin/scripts/core/domains at the pin, and it matches the "placeholders never expanded" ruling. Say if you want these patched instead; I did not count it as rework.

## Counts
- batch-067: 3 files reviewed (2 unpatched-seeded, 1 patched-seeded), 6 edges, 0 rework.
- batch-068: 3 files reviewed (1 unpatched-seeded, 2 patched-seeded), 6 edges, 0 rework.
- Part 10 total: 6 files, 12 edges, 0 rework. Unpatched-seeded stratum: 3 files reviewed, 0 rework. Patched-seeded stratum: 3 files reviewed, 0 rework.
