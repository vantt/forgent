# Step 3 pilot round 3 - review g03 (docs/specs/runner.md)

Worktree detached at bade80e52; author pin ae141550c; record `step-03-records/batch-041.jsonl` (file `docs/specs/runner.md`, 3452 lines, 635616 bytes).

## Verdict

`docs/specs/runner.md` (batch-041): **rework** (one definite defect D1, one smaller anchor defect D2). 130 dispositions = 113 inventory + 17 authorAddedEdge. Inventory 113 all dispositioned (10 patch / 10 park / 93 preserve). Added 17: 14 parked (vocabulary line coordinates) + 3 preserved (L3356). `authorAddedEdgeIds` equals the 17 added edges. The record matches the request's 94 changed and 17 added.

## Regions read

- Heading outline of the pinned source.
- Every non-preserve edge with its physical passage and neighbours: L422, L1001-1006, L1033, L1044, L1100, L1281-1288, L1292, L1298-1321 (the whole vocabulary table and notes), L1394-1421, L1498, L1525, L1533, L1586-1620.
- The Pointers section and both coordination regions (L1236-1636).
- Preserve passages at L980, L993, L1001, L1028, L1229-1230, L1642-1644 (framing sentence), L1729, L3184, L3228, L3263, L3356, L3403, L3415.
- Checks run:
  - Existence at the pin for every "exists" preserve.
  - `git log --diff-filter=D` for every "removed at <sha>" claim: 13 of 13 match. `docs/decisions/0025` and `0030` are short ids of the filenames deleted at 4722361ae, so the claim is true.
  - "Never existed" for 08219/08235/08236: git log empty.
  - Every successor path exists at the pin. Anchors verified with `scripts/list-doc-anchors.mjs`: 08255 `92-hostread-blind-...`, and the 0025 and 0030 anchors in `h-36d872fbb0e5.md`.
  - Own full-file scans of the source for uncovered legacy tokens (see D1).
- Resolver replay for 08230, 08257 and 08261: hit counts match the record (26/21, 43/39, 81/23).
- Did not run the checker or the probes.

## Round-2 defects: all confirmed fixed

- **N1 (08271, 08287).** Reason now says "short id of decision record removed at 4722361ae with no successor file", plus a non-executable successor note to the D-ADR0025 and D-ADR0030 headings in `docs/platform/runner/decisions/h-36d872fbb0e5.md`. Both anchors resolve.
- **N2 (08249-08252, 08325, 08265, 08295, 08302, 08303, 08322, 08324).** Reason now reads "exists at author pin; tree retires at Phase 9; preserved as retired history / lineage / self-reference". A programmatic check found no preserve into `docs/specs/**` or `docs/architect/**` without that wording. 08250 names the live `work-integration.md`. 08251 and 08252 correctly state that no live non-carriage successor exists (the only copies are under `history/retired-engine/files`).
- **Region framing quoted (L12-31(5)).** 08249-08252 quote the L1391 sentence "Mục dưới đây giữ bối cảnh thiết kế lịch sử của Step 08."; every L1642+ history preserve quotes the L1644 sentence (matches the source).
- **Never-existing present-tense navigation (L12-31(3)).**
  - 08218 and 08244 are now parked as dead links, consistent with 08241. Git log is empty for all three.
  - 08219, 08235 and 08236 stay preserved, with a quoted "forgent workshop" external-provenance marker. The path belongs to another project, which is consistent with L12-21.
- **Round-1 defects.** All 12 stay fixed: 08223, 08224, 08231, 08227, 08248, 08256, 08255, 08260, 08243, 08232, and the parks 08228, 08230, 08257, 08261. Their targets still exist and are not carriage, and glosses and claims were re-read against the targets.
- **L12-31(8) in this file.** No edge here. The workflow-carry parks 08254, 08329 and 08330 stay consistent with L12-30(9).

## New defects

### D1 (rework): a legacy self-reference the inventory missed is not in the record
- **Source:** L1729 col 2, `specs/runner.md:26`, a line-coordinate citation of `docs/specs/runner.md`. It sits in the 0020 decision body: "trích tại `session.mjs:1-6` và `specs/runner.md:26`".
- **Rule:** L12-31(6). Any legacy reference outside the inventory spans is added as an `authorAddedEdge` with a disposition and counted by the coverage check.
- **What the record does:** `checks.coverage.legacyScan` lists no candidate for this span. My full-file scan, covering `docs/specs/`, `docs/architect/`, `specs/`, `architect/`, `../architect` and every retiring-tree basename (627 files), found it as the only uncovered path-token reference. The nearest inventory edge, 08266, covers only `docs/distillery/ porting-log.md:101` on L1729-1730.
- **Required correction:** add `author-r3-docs-specs-runner-L1729C2` as preserve.
  - Reason: history self-reference with a stale line coordinate, inside the L1644 retired-decision region. Quote that framing sentence, say that `docs/specs/runner.md` exists at the pin and retires at Phase 9, and add a non-executable successor note to `docs/platform/runner/spec.md` / `h-36d872fbb0e5.md`.
  - Also extend `authorAddedEdgeIds`, the scanner (a partial-path form `specs/<name>.md:<line>` evidently slips past `scan_candidates`), and the added count (17 becomes 18).

### D2 (anchor proof): maps-j-08232, L1100 col 590
- **Source:** the passage says `docs/specs/confinement-authority.md` "already said a direct executor call must carry a capability anchor and never infer the minimum from `executor.for`".
- **Patch:** it targets `confinement-authority-v1.md` whole-file, with `enclosingHeadingProof` kind `whole-file` and the generic reason "locator-free file/area pointer; no heading citation asserted".
- **Contradiction:** the record's own `locatorScopeReason` says the claim is held at `confinement-authority-v1.md:148-149`. The target's actual headings put those lines under `### 6.2 Nơi đặt policy` (L131-296, anchor `62-nơi-đặt-policy`). So a narrower holder exists and the cited claim is specific, not a bare file pointer.
- **Rule:** L12-31(1), anchor on the most specific enclosing heading, never effectively the H1, when a narrower holder exists.
- **Required correction:** anchor `#62-nơi-đặt-policy`, or add a proof that justifies the whole-file link. The generic reason does not do that.

## Edges checked and accepted

**Added vocabulary parks (14 edges, L1298-1315).**
- The cited coordinates are stale in the source itself. For example, pinned line 1958 is text from decision 0022 but is labelled "(ADR 0029)". Line 2434 is the tail of 0028 but is labelled ADR 0034. `dispatch-control-plane-redesign.md` is a 13-line pointer stub, so lines 125, 175 and 210 are out of file.
- Each reason names the pinned line text, so the park is right under L12-30(6): repointing the path while keeping `:NNNN` would leave a false description. The record gives non-executable successor notes to `h-36d872fbb0e5.md` and `dispatch-control-plane.md`.
- The `0029` live hits include the candidate decision holder. The reason acknowledges it as a successor, not as a replacement for the line coordinate.

**The three added L3356 preserves** (`docs/how-to`, `docs/reference`, `docs/explanation`).
- Directories exist at the pin, and `docs/explanation` has 137 files. The framing sentence is quoted. The passage is an aftermath note in decision 0062's history, not navigation.

**Parked edges.**
- Remaining parks: 08228, 08230, 08241, 08254, 08257, 08261, 08329, 08330 (plus 08218 and 08244, above).
- Each carries a searchWitness; alias lookups are empty for all and hit counts replay.
- The blockers are real:
  - 08228: header "Source snapshot retained" on the proposal.
  - 08230: the §13.1 credential-provisioning recipe is held only in `history/rollout-and-settled-facts.md`. The doctor check name appears live, but the recipe does not.
  - 08257 and 08261: copies exist only under `history/retired-engine/files`. The live decisions README lists ADR-010 as a retired literal snapshot.

**Patches.**
- 08223, 08224, 08231, 08227, 08243, 08248, 08255, 08256 and 08260 have existing, non-carriage targets.
- Anchored 08255 is correct.
- Adjacent glosses stay true. 08248 "8 thẩm quyền + forbidden dependencies" is held in the target's Component-Internal Ownership section.
- The 08250 (preserve, historical region) versus 08260 (patch, live section) split is accepted under L12-31(5).

## Lead-judgment questions

1. **Per-file witness assessments.**
   - Every hit file in every `hitGroups[].liveAssessment` carries the identical sentence "locator occurrence does not satisfy the source-row ... dependency", including the actual decision-holder file (`runner/decisions/h-36d872fbb0e5.md`, 18 hits for `0029`) and proof logs alike.
   - Counts, line numbers and excerpts are real, so this is better than round 2. But it is still a mechanical receipt, not a per-hit-group verdict (L12-31(7)). I judge it cosmetic, not rework; Lead decides whether to demand differentiated text for the holder-bearing groups.
2. **Vocabulary rows, patch instead of park.** Could the 14 vocabulary parks instead be patched by rewriting the description to the "(ADR nnnn)" decision locator? That would give an anchor in `h-36d872fbb0e5.md`, for example `#0029-...`. The author parked on L12-30(6). I accept the park. The patch alternative is cleaner at Phase 9 but needs a description edit that the author did not make.
3. **Out-of-inventory dead path at L1286.** The source names `docs/how-to-parallel-lanes.md` (hook refusal message, Pointers list). It never existed in git history and is not in the inventory. It is a dead present-tense pointer of the kind parked at 08241. The legacy scan did not target it; Lead decides whether to add it.
4. **Wording nits (not rework).**
   - 08258 `docs/how-to/coordination-examples/*.json` is labelled "illustrative pattern ... placeholder", but the source says "Ví dụ thật" (real examples) and the directory has 19 files. A truer reason would be "retained directory exists".
   - 08235 says "dated completed-action evidence" while 08236 says "external provenance"; both quote the same marker "forgent workshop".
   - 08262/08263 etc. say `docs/decisions/` "retained path exists"; the directory holds only the generated `index.md`.
5. **Named-spec prose references.** About 39 occurrences of "spec Work-State ..." (and similar named-spec references) carry no path token and are not inventoried. I treated them as out of the path-edge scope. Confirm they are carried by the area-level carry plan and not expected as added edges.

## Denominator and numerator

| Set | Files reviewed (g03) | Rework |
|---|---|---|
| batch-041 (runner.md) | 1 | 1 (D1 definite, D2 anchor proof) |

Edge counts: 130 = 10 patch + 24 park (10 inventory, 14 added) + 96 preserve (93 inventory, 3 added). Edge-level defects: 2 (D1 one missing edge; D2 one edge `maps-j-08232`).

Status: DONE_WITH_CONCERNS
Summary: runner.md still needs rework: one legacy self-reference (L1729 `specs/runner.md:26`) is missing from the record, and 08232's whole-file anchor contradicts its own claim holder at §6.2. Round-2 defects N1/N2 and the 12 round-1 defects are fixed. The other 17 added edges and all remaining parks and preserves check out.
