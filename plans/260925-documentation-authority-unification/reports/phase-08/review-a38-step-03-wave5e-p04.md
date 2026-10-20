# Review a38 step-03 wave5e part p04

Pin ae141550c; worktree 171937a68 (read-only). 6 files / 27 edges. Checker and probes not run; records read through the per-field extractor. Every source file read whole; every legacy-form reference re-scanned (docs/specs, docs/architect, specs/x.md, relative links resolved from both wrapper and original location) and compared with the record's edge list.

## Per-file results

| # | File | Set / stratum | Edges | Verdict |
|---|---|---|---:|---|
| 1 | docs/platform/agent-coordination/history/retired-engine/verification/implementation-alignment.md | batch-089 / unpatched | 11 | ok |
| 2 | docs/platform/agent-coordination/vocabulary/canonical-concepts.md | batch-089 / patched | 1 | ok |
| 3 | docs/platform/agent-coordination/vocabulary/deprecated-and-reserved.md | batch-089 / patched | 2 | ok |
| 4 | docs/platform/agent-protocol/spec.md | batch-090 / patched | 1 | ok |
| 5 | docs/platform/claude-plugin/spec.md | batch-091 / patched | 4 | ok |
| 6 | docs/platform/coexistence/spec.md | batch-092 / patched | 8 | ok (2 Lead questions) |

No retiresWithTree records in this part (none under docs/specs or docs/architect).

### 1. implementation-alignment.md (11 edges, no diff)
- 06482 (L9 Provenance, original path): preserve. Original path was renamed at 9134ff4e5 to history/retired-engine/files/verification/...; the target fact matches `git log`. Provenance rule L12-47 applies. ok.
- 06483 (L18 "Superseded by ... docs/specs/runner.md"): preserve with successor note to docs/platform/runner/spec.md (L12-35(3), history wrapper). ok.
- 06484-06492 (L53/54/63/67-72, `../../../architect/...` links inside the Literal Snapshot): preserve inside declared carriage; reasons carry no existence facts (L12-35(4)). ok.
- Coverage: no missed legacy reference. `../vision.md` and the host-invocation-routing and packaging-distribution links resolve to live docs/platform paths from the original location and to nothing from the wrapper location, so no edge is owed. Related paths (L16) and snapshot Related (L42-44) are live docs/platform paths.

### 2. canonical-concepts.md (1 edge)
- 06569 (L17 Related `docs/specs/runner.md`): patch to docs/platform/runner/spec.md, whole-file, Phase 9. Related entry whose target retires, patched to the live holder (L12-34(4), L12-37(1)); target exists at the pin; the holder is not the file itself and is not already listed. Diff replaces exactly that line. ok. Other docs/platform links (dispatch-control-plane, ADR-004, history snapshot) exist at the pin and are not legacy.

### 3. deprecated-and-reserved.md (2 edges)
- 06572 (L17 Related): same patch as above. ok.
- 06573 (L31 `docs/specs/platform-foundations.md:210-219`, Participant definition): parked, category GAP-02, with a per-hit-group witness (category citation-only, 1 live hit, alias lookups empty). I checked the pin: no candidate holder carries the Participant append/read/subscribe definition. The knowledge doc fgos-participant-contract only points at decision 0014 and the old spec lines; it does not hold the text. The park matches L12-30(2) and L12-41(1). ok.
- ADR-004 link (L38) and snapshot link (L23) are live and exist, so no edge is owed.

### 4. agent-protocol/spec.md (1 edge)
- 06574 (L18 Related `docs/specs/runner.md`): patch to docs/platform/runner/spec.md, whole-file, Phase 9. Diff correct. No other legacy references in the file (scanned all 145 lines, including the Related files table). ok.

### 5. claude-plugin/spec.md (4 edges)
- 06613 (L17 Provenance `docs/specs/fgos-plugin.md`): preserve (L12-47). ok.
- 06614 (L25 Related `docs/specs/fgos-plugin.md`): parked, description-rewrite. The holder of the Related entry is the consumer file itself, so a patch would create a self-pointer (L12-34(4) duplicate/self case, L12-40(2)). ok.
- 06615 (L41 `docs/specs/work-state.md`, "lifecycle rules ... owned by the Work-State area"): patch to docs/platform/work-state/spec.md, whole-file, Phase 9. Diff correct. The claim is area ownership across §7/§9/§11, so a null anchor is justified and the record says why. ok.
- 06616 (L191 pointer "lifecycle/FSM meaning ... business rules"): patch to docs/platform/work-state/spec.md#11-business-rules. The heading "## 11. Business Rules" exists at the pin and the slug is correct. The target holds the FSM rule (RUL4), awaiting-human (RUL14) and the other gates. ok.
- Adjacent description truth: "plugin spec covers only the convenience layer" and "business rules of every verb" stay true for the target. The "(no `check` skill)" gloss is unaffected. No missed reference (scan of the whole file finds only these four).

### 6. coexistence/spec.md (8 edges)
- 06617 (L9 Provenance `docs/coexistence.md`): preserve (retained root; L12-47). ok.
- 06618 (L17 Related `docs/coexistence.md`): preserve. The target is a retained root that survives Phase 9, so the Related entry preserves (L12-34(4), L12-38). ok.
- 06619 (L25) and 06623 (L139) (`docs/decisions/0009-chong-giao-thoa-luc-cai.md`): parked, GAP-02. The record says removed at 4722361ae with no successor file. I checked the pin: the only holders of decision 0009 are the retiring platform-foundations spec (D-ADR0009), the decision-record index row and a history baseline table. No `### 0009` heading exists in any candidate decisions file. The park matches L12-41(1); both edges share one disposition and one witness (3 live citation-only hits). ok.
- 06620 (L43 `docs/specs/runner.md`, review/approve/reject merge gate): patch to docs/platform/runner/subcomponents/h-6979005beaf7/spec.md#business-rules. "## Business Rules" exists and holds RUL2 (proposal only until human approval) and RUL20 (review/approve/reject as the single gate). The diff is correct and the adjacent description stays true. See Lead question 1.
- 06621 (L60 `docs/specs/runner.md`, "worker receives fgOS's own dispatch contract"): patch to docs/routing-handoff-contract.md. The target exists at the pin and its "Khung prompt 4 phần" is literally the worker dispatch contract. The diff is correct. See Lead question 2.
- 06622 (L112 `docs/history/install-coexistence/reports/canary-run.md`): preserve. The source says "hồ sơ xưởng, không thuộc repo sản phẩm này", which is an evidence citation that disclaims the product repo (L12-51 ruling 1). ok.
- 06624 (L145 `docs/backlog.md`): preserve, retained root. ok.
- Coverage: no missed reference. `.fgos/coexistence.json`, src and test paths are exempt, and Source Metadata (L148-157) holds none.

## Outcome defects
None. No wrong disposition, target, anchor or diff, no false adjacent description, no missed reference in the six files.

## Record-text notes (not rework)
- 06569, 06572, 06574 reason text ends with "separate from this file's historical snapshots and surviving contract detail", which is boilerplate carried from the vocabulary files. It is not accurate for agent-protocol/spec.md (06574), which has no snapshot. It has no effect on the diff or disposition.
- 06614 uses the park category description-rewrite where L12-34(4) words this case as "park as duplicate". The disposition is right either way.

## Lead-judgment questions
1. 06620 target versus the L12-51 ruling on batch-126 edge 01325 (docs/coexistence.md). That edge carries the same sentence, `review/approve/reject - spec: docs/specs/runner.md`, and the Lead ruled it to patch to the runner approval-gate section (docs/platform/runner/operations/h-51f5cd7279fd.md, "Cổng duyệt PR nội bộ"). Here the record anchors runner subcomponents h-6979005beaf7 #business-rules (RUL2/RUL20). Both are true holders of the gate and the resulting text is not false, so I did not call it rework. If the Lead wants L12-30(3) same-kind uniformity, 06620 should retarget to the operations holder's approval-gate section.
2. 06621 target versus the sibling 01326 in the root docs/coexistence.md. 01326 patches the same sentence ("contract dispatch của riêng fgOS (spec: docs/specs/runner.md)") to docs/platform/runner/spec.md. 06621 patches it to docs/routing-handoff-contract.md, which I judge the more accurate holder (the worker prompt contract). The two sibling records should agree. The Lead should pick one and align the other.

## Counts
- batch-089: patched stratum 2 files reviewed / 0 rework; unpatched stratum 1 file reviewed / 0 rework.
- batch-090: patched 1 / 0.
- batch-091: patched 1 / 0.
- batch-092: patched 1 / 0.
- Part total: 6 files, 27 edges, 0 rework (pending Lead's call on the two questions above, neither of which I counted as an outcome defect).
