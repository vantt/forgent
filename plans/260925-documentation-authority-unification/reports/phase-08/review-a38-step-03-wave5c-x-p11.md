# Review a38 step-03 wave5c expansion, part p11

Pin ae141550c; worktree 0d1fb3bff, read-only. No checker or probe run.

## docs/transitional-switchboard.md

- Set: batch-130. Stratum: L12-51-changed-file-targeted-re-review.
- Source: 119 lines, sha256 b0580291...2b752. This equals the record digest and the index sourceDigest.
- Record: 69 edges. Diff empty (e3b0c442 hash, matches the index). No author-added edges. legacyScan has 0 candidates.
- Read: the whole source and all 69 edges. I checked every row-flip replacement. I read all 6 `switchboardStatusRowFlips` units.
- **Verdict: rework.** The edge dispositions, the exact-owner replacement paths and the source scan are correct. The defects are in the pathless status units and their coverage.

### Edges that are correct
- 08389, 08390, 08456 and 08457 preserve the retained roots `docs/reading-map.md` and `docs/doc-governance.md`. Two are Related header entries and two are Related Files links. Both targets survive Phase 9.
- 08391 to 08455 are all phase9-row-flip with timing Phase 9.
  - Computed units share one disposition. These are rows L50 to L69, root rows L75 to L88, and items L30, L99 and L108.
  - Retained-root paths stay literal in the replacements.
- L12-51 exact owners confirmed. Every replacement target exists at the pin.
  - 08403 goes to `docs/platform/system-overview/spec.md`.
  - 08433 goes to `docs/platform/domainization/architecture/domainization.md`.
  - 08399 to 08402 go to `docs/platform/component-boundary.md`, a file and not a tree.
  - All other replacement paths also exist: work-state, runner, packaging-distribution, host-invocation-routing, agent-coordination, confinement, claude-plugin, herdr-web-dashboard, decision-citation-drift, distillery, observe, vision, platform-foundations.
- No false "tree retires" suffix appears in any reason (grepped).
- I traced every path occurrence in the source against the edge columns, for example 4 on L50 and 2 on L58. I found no missed path reference.

### OUTCOME defects

1. **Status unit lines 104-108 has an incoherent replacement.**
   - It overlaps edge unit item-L108 (08454, 08455), which covers lines 104-108.
   - Source text: step 6 "For authors during migration" (consult the authoring rules, update only the single declared owner, never dual-author, legacy-root edits need a reviewed exception).
   - Status-unit replacement: "Resolve all candidate and legacy-current migration statuses to their accepted post-cutover owner before publishing this route table."
   - That sentence is not a replacement for author guidance. It conflicts with the 08454/08455 replacement for the same lines, and Step 4 cannot apply both.
   - Rule: L12-51(4) says complete pathless status prose flips as a unit. L12-35(1) says one computed unit has one specification.
   - Correction: drop this status unit and let 08454/08455 own lines 104-108. Alternatively, make the replacement the same text as 08454/08455.

2. **Status units lines 98-103 and 30-34 duplicate edge units with different replacement text.**
   - Lines 30-34 overlap item-L30 (08391). 08391 says "Replace Operating Invariant 2 as a whole: docs/platform/** is the promoted platform topology...". The status unit says "All accepted platform owners in this route table are promoted...".
   - Lines 98-103 overlap item-L99 (08453). 08453 says "Replace reader resolution steps 3-5 together...". The status unit says "Use the promoted owner in the surface row...".
   - Two competing replacements for the same source lines are ambiguous at Step 4.
   - Correction: keep one specification per span. Either fold the status text into the edge unit's replacement, or drop the duplicate status unit. Unit 98-103 is not strictly redundant: lines 101-103 are step 5, and 08453's text already says "steps 3-5".

3. **Pathless migration-status prose in the header is not covered (possible miss).**
   - Lines 11-13 say "Platform documentation authority routing during transition", "which document owns a platform claim during migration", and "post-cutover canonical topology". Lines 7-8 say "Accepted (Phase 01)" and "Implemented (Phase 01)".
   - The title on line 1 says "Transitional".
   - L12-35(2) and L12-51(4) say "during migration" sentences flip. The six status units cover only lines 23-25, 30-34, 38-40, 41-44, 98-103 and 104-108.
   - Correction: add a status flip unit for the header lines 7-8 and 11-13 (and the title if intended), or record why the header is retained status.
   - I rate this lower confidence than defects 1 and 2, because the flipped passage is a code-fence header.

### Record-text notes (not rework)
- The status-unit `reason` field is identical boilerplate for all 6 units. It does not name which lines or edge unit each unit overlaps.
- 08429 matches the brace expression `docs/doc-registry.{md,json}`. It is fine as one unit with the row, and noted only for Step 4 span handling.

### Lead-judgment questions
- Is the switchboard status layer (`switchboardStatusRowFlips`) meant to give Step 4 a replacement distinct from the edge-unit replacement when spans overlap? If yes, one source of truth is needed. If no, defects 1 and 2 are simply duplicates to remove.
- Header lines 3-14 are inside a code fence. Does the pathless-status rule reach them?

## docs/work-item-lifecycle-vision.md

- Set: batch-130. Stratum: L12-51-every-remaining-batch126-or130-file.
- Source: 114 lines, sha256 d4267552...cf08. This equals the record digest and the index sourceDigest.
- Record: 0 edges, empty diff, empty legacyScan candidates, empty anchors, relativeResolution and labelForm.
- Read: the whole source.
- **Verdict: ok.**
  - The only pathful lines are 5 and 6, which name candidate `docs/platform/vision.md`, `docs/platform/work-state/` and `docs/platform/work-lifecycle/`. None is a retiring tree.
  - Line 12 has the bare "platform-foundations", a retained root basename. L12-53 says that is not an edge.
  - Nothing in the file names `docs/specs/**` or `docs/architect/**`.
- Note for the Phase 9 remnant search, not a defect: line 4 "Vision source retained during migration" is pathless migration-status prose in a retained root file.

## Counts

| Scope | Files reviewed | Rework | Edges reviewed |
|---|---|---|---|
| batch-130, stratum L12-51-changed-file-targeted-re-review | 1 | 1 (transitional-switchboard) | 69 |
| batch-130, stratum L12-51-every-remaining-batch126-or130-file | 1 | 0 | 0 |
| Part p11 total | 2 | 1 | 69 |

Edge-level outcome defects: 0 of 69 edges (the dispositions and targets are correct). The 3 defects are in the `switchboardStatusRowFlips` records, which are not edges.

Dissent: if the Lead rules that status units may carry their own replacement alongside overlapping edge units, defects 1 and 2 reduce to record-text notes. Defect 1's replacement text would still be incoherent for author guidance.
