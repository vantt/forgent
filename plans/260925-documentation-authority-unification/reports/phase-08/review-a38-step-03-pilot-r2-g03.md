# Step 3 pilot round 2 — review g03 (docs/specs/runner.md)

Transcribed by Lead verbatim in substance from the reviewer's final message; the reviewer did not write its report file. Worktree detached at d7c4a0cba, author pin ae141550c.

## Verdict

docs/specs/runner.md (batch-041): **rework**. 113 edges: 10 patch / 8 parked / 0 row-flip / 95 preserve, matching the record. All 12 round-1 defects confirmed fixed; L12-30 override of round-1 defect 6 (08228) applied.

## Regions read

Heading outline (3452 lines); full physical passage plus neighbours for every non-preserve edge; head, headings and claim region of every patch target; the Pointers section and coordination history region (L1236–1636); every preserve edge's matched expression, reason and target state against the pin tree, doc-registry.json and git ancestry (`git log --diff-filter=D`); inventory-completeness grep (11 legacy-token lines outside the 113 edges already point at docs/platform/**). Ran step-03-resolve.py for 08223, 08224, 08227, 08228, 08230, 08255. Did not run checker or probes.

## Round-1 defects confirmed fixed

- 08232 → agent-confinement/contracts/confinement-authority-v1.md (claim at 148–149 under §6.2, not a snapshot region); locator-flag explanation accepted.
- 08223 / 08224 / 08231 → registry currentPath successors; knowledge files exist, not carriage.
- 08227 → docs/platform/agent-coordination/decisions/ADR-011-…; header "Restored", live contract; gloss stays true.
- 08248 / 08256 → dispatch-control-plane.md; "8 thẩm quyền + forbidden dependencies" gloss holds.
- 08255 → agent-confinement/spec.md#92-hostread-blind-worker-mù-trước-run-state-của-peer (checked with scripts/list-doc-anchors.mjs).
- 08260 → work-integration.md (header "Restored").
- 08258 glob preserve (directory exists); 08259 retained how-to preserve (file exists, no alias).
- 08243 bare area pointer → packaging-distribution/spec.md (L12-30(7)).
- 08228 parked correctly (proposal header "Source snapshot retained / Canonical: No"; no live holder of §3.3/§4/§14 H1).
- 08230 parked correctly (§13.1 and confined-pane-accounts only in history/rollout-and-settled-facts.md).
- 08257 / 08261 parked correctly (holders only under history/retired-engine/files/**).
- 08254 / 08329 / 08330 parked consistently on workflow carry (L12-30(9)).
- 08241 parked as a dead live pointer (git log empty for path and parents).
- Never-existed preserves 08218, 08219, 08235, 08236, 08244: git log empty — "never existed" true.
- Removed-at preserves (0000-index, 0021, 0026, 0028, 0029, 0030, the allowlist how-to, three docs/explanation files): removal commits match.
- Diff changes only path tokens; label forms conserved; anchors/relativeResolution agree; relative ../platform/... in 08248 is a source-coordinate Phase 9 spec.
- Locator flags 08224, 08231, 08232, 08256 confirmed.

## New defects

- **N1 (rework) — maps-j-08271 (L2155, docs/decisions/0025) and maps-j-08287 (L2599, docs/decisions/0030):** reason says "target never existed in Git ancestry"; false — `docs/decisions/0025-mo-rong-uu-tien-san-pham-them-ux-van-hanh-vao-ship-faster.md` and `docs/decisions/0030-them-release-con-nguoi-vao-thu-tu-uu-tien-san-pham.md` existed and were deleted in 4722361ae (tsk-1lv-4); sibling 08310 states 0030 correctly. Rule L12-30(5). Correction: keep preserve; reword to "short id of a decision record removed at 4722361ae with no successor file"; optional non-executable successor note to the D-ADR0025 / D-ADR0030 narrative.
- **N2 (wording) — 08249, 08250, 08251, 08252, 08325 and self-reference preserves 08265, 08295, 08302, 08303, 08322, 08324:** reason says "retained path exists at author pin" for paths under docs/architect/** and docs/specs/**, which Phase 9 step 6 deletes. Correction: "exists at author pin; the tree is deleted at Phase 9; preserved as retired history / lineage self-reference"; 08250 names live successor docs/platform/agent-coordination/architecture/work-integration.md. Dispositions stand.

## Questions for Lead

1. 08244 (L1288, f4-benchmark.md) and 08218 (L422, validation-s1-gate.md) preserved as "dated completed-action evidence" without the "forgent workshop" marker of 08219/08235/08236; 08244 sits in the live Pointers list next to parked 08241; 08218 is a present-tense "xem". Reviewer leans to parking 08244 (same kind as 08241).
2. 08250 (L1419) preserve vs 08260 (L1611) patch cite the same live work-integration.md; author's section-based split accepted, Lead to confirm; 08249–08252 rest on region framing alone.
3. searchWitness.hitGroups liveAssessment is one boilerplate sentence per edge; counts and assessments accurate; cosmetic.

## Tally

| Set | Files reviewed | Rework |
|---|---|---|
| batch-041 (g03: runner.md) | 1 | 1 |

Status: DONE_WITH_CONCERNS
