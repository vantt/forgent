# Wave 5f review, part p04

Pin ae141550c, worktree detached at 0d1fb3bff. I read each file whole, every edge and the full diff. I ran no checker or probe. Per-edge fields came from the Python extractor and the sources from `git show`.

## Per file

### 1. docs/platform/platform-foundations.md
- Set batch-111, stratum unpatched-seeded, 30 edges.
- Record digest 6e331bb22467235caa2d1793c621682c4d491d86ff41610dadbf1c55dbc4e753. The diff is empty (sha256 e3b0c442...).
- Verdict: **rework**, for 07431 and 07432 only. Judgment call for the Lead, see the question below.
- 07408-07412 (lines 11, 16, 17, 19): preserve, preserve, park GAP-02, preserve, preserve. These are correct: Source type, Related and Provenance roles stay separate, and the retained root stays literal. The park on 07411 is the real GAP-02 obligation for the specs projection.
- 07413-07427 (lines 30, 41, 42, 48-58): all phase9-row-flip. These match the digest: migration-state sentences and Law Summary source cells flip as whole rows, and the retained root path stays intact.
- 07428 (L80): preserve. 07429 (L81): park GAP-02. 07430, 07433, 07434, 07435, 07436 (retained `docs/distillery/...` paths and the illustrative glob): preserve. 07437 (L261): preserve, evidence citation of a dated F4 benchmark whose path never existed (L12-51(1)).
- I found no missed references. A full-file scan shows only `event-store/spec.md` (a candidate-native link, which exists) and `docs/platform/component-boundary.md` beyond the edges.

**OUTCOME defect: 07431 (L104 `docs/decisions/index.md`) and 07432 (L105 `docs/specs/<area>.md`).**
- The record parks both as "live paragraph ... description needs rewrite".
- Lines 101-107 are one paragraph, inside the verbatim carried law body under the `## Luật nền platform forgent` heading (line 84) and the "Legacy status: Full source retained" box.
- The same paragraph's other edges are preserved as "preserved original full-source region identity" (07430, 07433, 07434, 07435).
- Rules: L12-35(4), L12-40 and L12-26 ("Retain law root paths without changing locked law text"). The digest also says verbatim carriage is excluded from the executable link check.
- Rewriting the locked-law paragraph at cutover would alter carried law wording, and the park invents a blocker.
- Correction: preserve both, with the same carriage framing as 07430/07433-35. `docs/decisions/index.md` exists at the pin, so say "exists" and not "never existed".

### 2. docs/platform/process/spec.md
- Set batch-112, stratum patched-seeded, 3 edges.
- Record digest 11b2aafffa0aa412c1489957fad0d42df0d3105aa037378fbc609947f28185b1. Diff sha256 262bd8df...
- Verdict: **ok**.
- 07438 patches Related L19 to `docs/platform/runner/spec.md`, Phase 9. 07440 patches the section 9 table row L116 to `../runner/spec.md`. 07439 preserves `component-boundary.md`.
- Both patched targets exist at the pin, and the relative path from docs/platform/process/ resolves.
- The gloss "Node leaf and its callers" stays equally true. Neither the legacy runner spec nor the candidate mentions `process-identity`; the original link named the runner area as a whole, as the patch does.
- The diff hunks match the sources, and no other legacy path appears in the file.

### 3. docs/platform/proposals/coordination-capability-envelope.md
- Set batch-113, stratum unpatched-seeded, 8 edges.
- Record digest cb550ddf91b56b91cabac628285a1d8c224a3a93ac91c08dbbbe089bbaf7df13. The diff is empty.
- Verdict: **ok**.
- 07465 (Provenance L9): preserve.
- 07466 (Related L17, self source): park, correct per L12-52(2) and L12-34(4), a wrapper Related entry pointing at its own source.
- 07467 (L24 "Source relationship" link): preserve. It is Source/Provenance, kept separate from Related.
- 07468 (L39 `../../specs/reading-map.md`): preserve. It sits in the carried proposal body.
- Author-added edges L40, L51, L52 and L415 are preserves of candidate-native links. All four targets exist.
- Missed references: none. The `src/runner/coordination/*.mjs` links are code, not doc edges.

### 4. docs/platform/proposals/documentation-system-unification.md
- Set batch-113, stratum unpatched-seeded, 34 edges. I read the whole 1131-line source.
- Record digest 2ed9005ac755ea48408d791a0783c23ed61b3678358152e7164ea9c22b98d88f. The diff is empty.
- Verdict: **ok**, with one Lead-judgment question on 07495/07496.
- 07489, 07490 (Related, retained root files): preserve.
- 07491, 07492 (Related to the retiring architect docs): park. Their only candidate holders are non-canonical conservation carriers: `docs/platform/documentation/architecture/documentation-system-design.md` and `docs/platform/proposals/knowledge-registry-redesign.md`. This is consistent with L12-30(3), where carriage is not a patch target.
- 07493, 07494 (L38 horizon row, which carries "Active priority" status): row-flip. Correct.
- 07497-07498, 07501-07504, 07509-07516, 07518-07519: parks. These are present-tense or requirement statements about the retiring trees. They are consistent with each other and with the L12-38 present-tense rule.
- 07499, 07500, 07505, 07508, 07517: preserve. The retained roots are `docs/doc-governance.md`, `docs/reading-map.md` and `docs/history/`.
- 07506, 07507 (L402 and L405, `docs/specs/runner.md`): preserve. They sit in an illustrative YAML example (`aliases:` and `sourcePaths:`), so placeholder rules apply.
- Author-added L190-L192 (README.md, doc-governance.md, reading-map.md in the proposed topology tree): preserve.
- I checked every `docs/`, `specs`, `architect` and `.md` hit in the source and found no missed edge.

## Record-text notes (not rework)
- 07408-07412 and 07430-07437 claim existence facts ("Source path exists at author pin") for edges inside the carried law body. L12-35(4) asks for "inside literal carriage" wording instead. The record has no explicit carriage declaration for this file, so the checker may not treat it as carriage. See the Lead question.
- 07467-07468 and the four author-added edges in coordination-capability-envelope.md say "inside literal carriage". That is false for 07467 (L24), which is wrapper text above the source body. The preserve outcome is right as provenance.
- 07466 uses category description-rewrite. Other self-Related duplicates use phase9-carry, for example 01904 in docs/doc-governance.md: "duplicate Related entry ... consumer itself". L12-52(2) names the duplicate class. Suggest category phase9-carry. The park outcome is unchanged.
- 07491 says "reconcile ... with the actual live full-horizon proposal", but this consumer is that proposal. The wording is confusing.
- 07440 changes the link label from `runner.md` to `spec.md`, which is ambiguous. Harmless, and it matches the target filename.
- 07412 carries `unitId` item-L17 for the L19 Provenance line, a continuation of the list item. That is cosmetic.

## Lead-judgment questions
1. **platform-foundations.md 07431/07432.** Is the body from line 84 down treated as literal carriage? I recommend yes (preserve, no rewrite of locked-law wording). The body is a stale copy of retained root `docs/platform-foundations.md`; the pin's root text says `.bee/decisions.jsonl` instead. If the Lead keeps the park, the "live paragraph" rationale should also explain why 07430 and 07433-35, in the same paragraph, are carriage.
2. **documentation-system-unification.md 07495/07496 (lines 56-57).** These are row-flipped, with a replacement that rewrites the "hot problem" starting-state statement into "after atomic cutover, each platform claim has one owner". They are not a migration-status row. They are a problem statement, like the sibling passages at L100, L179 and L230, which were parked as description-rewrite. I did not call it a defect, because both dispositions defer to Phase 9. Please decide between flip and park, or preserve as a historical problem statement. I lean park, for consistency.

## Counts
Edges reviewed: 75 of 75 (30 + 3 + 8 + 34).

| Set | Stratum | Reviewed | Rework |
|---|---|---|---|
| batch-111 | unpatched-seeded | 1 | 1 (platform-foundations.md; 2 edges) |
| batch-112 | patched-seeded | 1 | 0 |
| batch-113 | unpatched-seeded | 2 | 0 |

- batch-113 overlaps with p05 (visibility-and-interactive-contact-herdr-spawn.md, not reviewed here).
- Part total: 4 files, 1 rework, 2 outcome-defect edges (both Lead-judgment).
- batch-111 has a single unpatched-seeded file, so one rework gives 100% in that stratum and breaches the 3% threshold. The expansion decision on that set belongs to the Lead.

Status: DONE_WITH_CONCERNS
Summary: 3 of 4 files are ok; platform-foundations.md needs rework on 07431/07432, which are parked inside carried law text while their paragraph neighbours are preserved. Two Lead-judgment questions are logged, including the 07495/07496 flip-versus-park consistency question.
