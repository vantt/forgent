# Review a38 step-03 wave5c expansion, part p07

Reviewer: independent read-only semantic reviewer. Pin `ae141550c`, worktree `0d1fb3bff`. Checker and probes were not run. Sources were read whole, records extracted per edge. Edges per file: all of them (preserve, parked, patch, author-added).

## Verdict summary

| Set | File | Edges | Verdict |
|---|---|---:|---|
| batch-098 | `docs/platform/documentation/history/id-systems-audit.md` | 25 | ok |
| batch-126 | `docs/architecture-manifest.json` | 1 | ok |
| batch-126 | `docs/backlog.md` | 58 | ok |
| batch-126 | `docs/coexistence.md` | 6 | **rework** (1 edge) |
| batch-126 | `docs/distribution-vision.md` | 13 | ok |

Per set and stratum (all L12-51 targeted re-review / expansion):
- batch-098: 1 file reviewed, 0 rework.
- batch-126: 4 files reviewed, 1 rework (`docs/coexistence.md`).
- Total: 5 files, 103 edges, 1 file rework, 1 outcome defect.

## Outcome defect

### `docs/coexistence.md`, edge `maps-j-01326` (source L48, `docs/specs/runner.md`)

- Record: patch, timing Phase 9, target `docs/platform/runner/spec.md`, anchor none (whole file).
- Source passage: "Khi một runner worker của fgOS được spawn, nó nhận đúng contract dispatch của riêng fgOS (spec: `docs/specs/runner.md`)".
- Rule: L12-53 alignment. "06621 and root twin 01326 use the same holder, the one that states the claim." L12-37(3) and L12-30(6) apply as well: the target must hold the stated claim, and the adjacent description must stay true.
- Finding: the candidate twin, `maps-j-06621` in batch-092 (`docs/platform/coexistence/spec.md` L60), patches the same sentence to `docs/routing-handoff-contract.md`. That is the file that states the worker's dispatch contract. It holds the fixed four-part prompt frame, `Khung prompt 4 phần`, built by `buildPrompt` for each dispatch, plus the handoff and trust boundary.
- The candidate `docs/platform/runner/spec.md` has no passage that states a "dispatch contract" given to the worker. The only grep hit is the effective-contract/outbox remark at L104.
- So the two twins diverge, which breaks the alignment ruling. The root twin should follow the holder that states the claim.
- Correction: retarget 01326 to `docs/routing-handoff-contract.md` (whole file, anchor none, a retained root file), and adjust the reason and `relativeResolution`/`anchors` entries. The reason cited "runner-owned worker dispatch contract", which does not match the holder.
- Dependency: L12-53's alignment for 06620 and 06621 in batch-092 is also not yet applied in the worktree records. 06620 still patches to the runner business-rules subcomponent, not the approval-gate holder used by 01325. If the Lead instead settles on `runner/spec.md` as the shared holder, then 06621 must move and 01326 stays. Either way the pair must match.

## Per-file notes

### `docs/architecture-manifest.json`, 1 edge, ok
- 01236 (L3, `"map": "docs/architecture-map.md"`): preserve.
- The root map exists at the pin and is retained in place. Phase 9 only touches its CTR010 lines.
- It is a machine-contract field. The contract manifest twin (batch-094, `maps-j-06664`) is treated the same way.
- Empty diff.

### `docs/platform/documentation/history/id-systems-audit.md`, 25 edges, ok
- The header says `Document type: History`, and the closing frontmatter says `status: FINAL`. It is history class (L12-51(2)), so every edge preserves.
- I independently grepped every legacy-root token (`docs/specs`, `docs/decisions`, `docs/history`, `docs/backlog`, `docs/architecture-map`, `docs/id-systems-audit`, `0000-index`, `0004-`, `specs/x.md`). All hits are covered by an edge, except 3 bare basenames (L60 `runner.md`, L158 `0000-index.md`, L175 `reading-map.md`). Those are exempt under L12-38(5) and listed as exclusions with accurate reasons.
- Provenance and Related (06703, 06704): preserve (L12-47, L12-26(8)). `docs/id-systems-audit.md` is a retained root.
- 0004 (06708 at L41, 06726 at L187): removed at `4722361ae`. The note names `docs/platform/work-state/decisions/retired-decision-history.md` and the title-matched heading "4. ADR 0004 Scope And Non-Goals". I verified it at L89 of that file.
- 0000-index (06711, 06725): removed at `4722361ae`. The record names `docs/decisions/index.md` as the generated projection. The git status shows `A docs/decisions/index.md` in the same commit.
- Illustrative `docs/history/<feature>/CONTEXT.md` and `docs/history/*/CONTEXT.md`: preserve, correct.
- `docs/specs/runner.md`, `docs/specs/reading-map.md`, `docs/architecture-map.md`: preserve in an audit evidence list. "Tree retires" wording is accurate.

### `docs/backlog.md`, 58 edges (51 inventory, 7 author-added), ok
- Empty diff. Live (proposed) rows were checked one by one.
- 01276/01277 (L17), 01281 (L39), 01309–01313, 01316–01318, 01320–01322: `docs/history/**` paths that never existed in git ancestry. I confirmed 0 commits each. They are evidence or provenance citations, so they preserve (L12-51(1)).
- 01278/01279, 01288, author L40C297/C513: retained roots (`docs/coexistence.md`, `docs/platform-foundations.md`), preserve.
- 01280 (L24 js-yaml): park, Phase 9 carry.
  - The only holder is `docs/platform/packaging-distribution/spec.md` L723.
  - L723 sits under `## Retained Distribution Source Detail` (L459) and `#### Lịch sử quyết định` (L714), which is carriage.
  - No other live holder exists. A grep of `docs/platform`, `docs/knowledge` and others for `js-yaml` finds only L723 and the manifests.
- 01282 (L39 `work-state.md:647-675`) and author L37C410 (`work-state.md:864`): description-rewrite parks. The cited lines at the pin are the verb-manifest section, not a decision/outcome precedent or data model, so the locators are stale.
- L40 author edges preserve (captured 2026-07-21 investigation). L37/L39 park and L40 preserves, matching the standing ruling in L12-51(3).
- The Done / Declined rows (L67 and later, plus L44) preserve as completed-row history. Retained `docs/distillery/**`, `docs/id-systems-audit.md`, `docs/backlog.md` (self) and `docs/reading-map.md` exist at the pin.
- 01299 (L109 `0000-index.md`) names the index successor.
- My own token scan of the whole source found no missed edge. The remaining hits were bare basenames of retained or non-legacy files (`architecture-map.md:350`, `routing-handoff-contract.md`, `documentation-management.md`, `work-item-lifecycle-vision.md` and others). The 4 excluded candidates are correct (`index.md` and `README.md` naming-convention context).

### `docs/coexistence.md`, 6 edges, rework on 01326 only
- 01324 (L13) and 01328 (L127), `docs/decisions/0009-chong-giao-thoa-luc-cai.md`: park GAP-02, correct.
  - The only title-matched narrative holder, "0009 — Chống giao thoa tiến trình lúc cài", is in the retiring `docs/specs/platform-foundations.md` L142.
  - The other hits are the distribution-baseline row and the index.
- 01325 (L31, `docs/specs/runner.md`): patch to `docs/platform/runner/operations/h-51f5cd7279fd.md#cổng-duyệt-pr-nội-bộ-approval-gate-reviewapprovereject`.
  - I confirmed the anchor with `scripts/list-doc-anchors.mjs` against the pin: heading at L234.
  - The section lists the review/approve/reject verbs and the awaiting-approval gate. The adjacent description "ghi vào trunk repo chỉ sau khi người duyệt" is true. This is correct per L12-51.
- 01327 (L100, `canary-run.md`): never existed, with the source itself saying "hồ sơ xưởng, không thuộc repo sản phẩm này". Preserve, correct (L12-51(1)).
- 01329 (L133, `docs/backlog.md`): retained root, preserve.
- 01326: see the defect above.

### `docs/distribution-vision.md`, 13 edges (6 inventory, 7 author-added), ok
- The header declares `Use this legacy file for: Historical wording, original rationale, and supersession trace` and `Do not use ... for canonical area navigation`. This is history class by L12-51(2), so all 13 preserve, including the live-looking "xem `docs/specs/distribution.md` Data Dictionary #4b/#7" (L184) and the Edge Cases Settled pointer (L129).
- My token scan found no missed edge. Bare `coexistence.md` at L72 is a retained-root basename, which is not an edge (L12-53). The `docs/platform/packaging-distribution/*` header lines are not legacy paths.
- The author-added edges are coherent with the rest of the file. Empty diff.

## Record-text notes (not rework)
- `docs/platform/documentation/history/id-systems-audit.md`, 0017 edges (06707, 06715–06718, 06721): the reasons say "removed with no successor file". A narrative holder does exist in `docs/platform/architecture-map.md` L770 ("##### 0017 — Đóng audit hệ id/tên gọi (STR47)"), and presumably in the retained root map. It is not a decisions-file heading, so L12-38(3) does not require a note. All 15 records naming 0017 are consistent in this. A note could be added if the Lead wants a title-matched holder recorded.
- `docs/coexistence.md` 01327 and 01329: the reasons share the sentence "Retained backlog navigation or explicitly external-harness canary evidence". Only part of it applies to each edge, but the facts stated are true.

## Lead-judgment questions
1. 01326 vs 06621/06620: does the Lead want the shared holder for 06621 and 01326 to be `docs/routing-handoff-contract.md` (my reading: it states the worker's dispatch contract)? Or `runner/spec.md`? Batch-092 06620 also still differs from 01325 (business-rules subcomponent vs the approval-gate section).
2. `docs/backlog.md` L116C997 (a Done row, `work-state.md:864` "hiện tại") preserves, while the same locator in L37 (proposed row) parks. This is consistent with row status (done is history, proposed is live), but the Lead may want to confirm it, since the claim wording is identical.

Status: DONE_WITH_CONCERNS
Summary: 5 files and 103 edges reviewed; 4 files ok, 1 rework (`docs/coexistence.md` edge `maps-j-01326`, whose target diverges from its batch-092 twin 06621).
Concerns: the alignment ruling for 06620/06621 (batch-092) also still looks unapplied in the worktree records.
