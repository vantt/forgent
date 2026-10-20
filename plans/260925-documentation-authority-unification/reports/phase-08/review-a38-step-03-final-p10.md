# Step 3 final review, part p10

Reviewer: independent read-only semantic reviewer. Pin ae141550c2e022310de7a0efea757580c0b2479f. Worktree detached at d75e10774, read-only. I did not run any checker or probe script. Every edge's source span, disposition, target, anchor, reason, diff hunk and exact target passage were read.

## Result

| Set / stratum | Files | Edges | OUTCOME rework | Result |
|---|---|---|---|---|
| batch-122, targeted (changed outcome) | 1 | 16 | 0 | ok |
| batch-122, expansion (patched, not previously reviewed) | 1 | 5 | 0 | ok |
| batch-126, targeted (changed outcome) | 1 | 6 | 0 | ok |
| **Part total** | **3** | **27** | **0** | **3 ok / 0 rework** |

## 1. docs/platform/work-state/contracts/cli-io-contract.md

Batch-122, targeted stratum. Verdict: **ok**. 16 of 16 edges reviewed (maps-j-07899 to maps-j-07914). The whole 449-line source was read, so no region was skipped.

| Edge | Source | Disposition | Verdict |
|---|---|---|---|
| 07899 | L14 Related `docs/specs/work-state.md` | parked, description-rewrite (duplicate) | ok. The live holder `docs/platform/work-state/spec.md` is already listed at L12, and the separate Provenance line (L17) exists. |
| 07900 | L15 Related `docs/io-contract.md` | preserve | ok. Retained root; present in the switchboard (L83) and at the pin. |
| 07901, 07902 | L17 Provenance, both paths | preserve | ok (L12-47). Provenance spelling stays literal. |
| 07903 | L30 `docs/decisions/0014-...md` (prose) | parked, GAP-02 | ok. The only title-matched 0014 narrative is in retiring specs/platform-foundations.md. The candidate knowledge docs and the gateway yaml are implementation accounts, not the decision holder. |
| 07904, 07905 | L35 `docs/specs/work-state.md` and `docs/specs/runner.md` ("không lặp lại chi tiết cài đặt đã có trong ...") | patch to `docs/platform/work-state/spec.md` and `docs/platform/runner/spec.md`, Phase 9 | ok. Both targets exist. This is the whole-area implementation-detail claim, so a whole-file target is justified. The diff replaces exactly the two spans. |
| 07906 | L225-226 `docs/history/tsk-483-...scoping/CONTEXT.md` (split across a wrapped line) | preserve | ok. The path exists and is a retained history path. |
| 07907 | L435 `docs/decisions/0014-...md` in References | parked, GAP-02 | ok (same basis as 07903). |
| 07908 | L436 `docs/decisions/0011-...md` | patch to `retired-decision-history.md#7-adr-0011-explicit-version-for-every-contract` | ok. Heading "7. ADR 0011 Explicit Version For Every Contract" exists at line 192, and the slug matches GitHub's. The same anchor is already used at L31 and L397. |
| 07909 | L437 `docs/specs/work-state.md` §envelope, §Sổ verb máy-đọc, §Danh tính người ghi | parked, description-rewrite | ok. The bundled sections are this consumer's own sections 2, 3 and 7, so a patch would create a self pointer. work-state/spec.md has no envelope or verb-registry section. |
| 07910 | L438 `docs/specs/runner.md` RUL61 (envelope stdout runner) | patch to `docs/platform/runner/subcomponents/h-6979005beaf7/spec.md#business-rules` | ok. RUL61 is at line 92 under `## Business Rules` (line 25), with no narrower heading in between. It is the runner `fgos.v1` one-line stdout envelope. The work-state RUL61 is the writer rule, so the wrong holder was correctly avoided. |
| 07911 | L439 `docs/architecture-map.md` | preserve | ok. Retained root (switchboard L52 and L76). |
| 07912 | L440 `docs/history/str46-io-contract/` | parked, dead-link | ok. This is a live References navigation entry to a path that never existed (L12-51(1), L12-53). It matches the 04114 treatment. |
| 07913 | L448 `[Legacy source: docs/specs/work-state.md](../../../specs/work-state.md)` | parked, description-rewrite (duplicate) | ok. Label and destination are one unit, and the live holder is listed at L446. |
| 07914 | L449 `[Legacy source: docs/io-contract.md](...)` | preserve | ok. Retained root. |

Coverage: I looked for legacy path forms, decision basenames and relative links across the whole source. Nothing is missing. The pathless "spec Runner RUL49/RUL61" and "spec Runner Khoá hoạt động cây chính" prose carries to the Phase 9 remnant search (L12-53), and the relative link `../../session-identity/spec.md` names no retiring path.

Record-text notes (not rework):
- The 07899 and 07913 `blockedReason` say "preserve the separate original Provenance line". That is true here, since L17 exists.

## 2. docs/platform/work-state/history/multi-role-harness-distill-record.md

Batch-122, expansion stratum. Verdict: **ok**. 5 of 5 edges reviewed (maps-j-07930 to maps-j-07934). The whole 92-line source was read.

| Edge | Source | Disposition | Verdict |
|---|---|---|---|
| 07930 | L12 header Related `docs/specs/work-state.md` | patch to `docs/platform/work-state/spec.md`, Phase 9 | ok. The target exists. L12-34(4) applies to history wrappers, so the header Related list is navigation. The diff touches only line 12, and the header list has no duplicate holder. |
| 07931 | L42 `docs/architecture-manifest.json` | preserve | ok. It is in dated past-tense plan narration (the "two traps"), and the file exists and is retained. |
| 07932 | L49 `docs/decisions/` | preserve | ok. The sentence is past-tense narration in the completed "Implementation Review ... After Distill" section ("thêm khi copy sang"). The directory still exists because `index.md` is retained. |
| 07933 | L51 `docs/history/fgos-marketing-domain-foundation/CONTEXT.md` | preserve | ok. The file exists. The bare `DISCUSSION.md` is not an edge. |
| 07934 | L92 `[Legacy source: docs/specs/work-state.md](../../../specs/work-state.md)` | parked, description-rewrite (duplicate) | ok. The live holder is the L12 header entry once 07930 is applied. The sibling files 07898 and 07913 follow the same park, and the earlier wave5g review accepted it. |

Coverage: nothing is missing. L16 and L18 are links to existing candidate files, and `src/state/handoff.mjs` and `test/architecture.test.mjs` do not name a retiring path.

Record-text note (not rework): the 07934 reason says "preserve the separate original Provenance line", but this file has no Provenance line. That is boilerplate. The point of the park still holds.

## 3. docs/coexistence.md

Batch-126, targeted stratum. Verdict: **ok**. 6 of 6 edges reviewed (maps-j-01324 to maps-j-01329). The whole 133-line source was read.

| Edge | Source | Disposition | Verdict |
|---|---|---|---|
| 01324 | L13 `docs/decisions/0009-chong-giao-thoa-luc-cai.md` | parked, GAP-02 | ok. Only the 0009 Chống giao thoa narrative at specs/platform-foundations.md:142 remains. The candidate docs only cite the path or the id: `platform/coexistence/spec.md` is a copy of this file, and `decisions-index/decision-record.md` has a table row. `retired-decision-history.md` has no 0009 holder. |
| 01325 | L31 `docs/specs/runner.md` ("fgos review/approve/reject") | patch to `docs/platform/runner/operations/h-51f5cd7279fd.md#cổng-duyệt-pr-nội-bộ-approval-gate-reviewapprovereject`, Phase 9 | ok. This is the L12-51 correction. The section "### Cổng duyệt PR nội bộ (approval gate) — review/approve/reject" (line 234) is the one gate covering all three verbs and the awaiting-approval proposals, and the claim about writing to trunk after human approval holds. The diff replaces only the span. |
| 01326 | L48 `docs/specs/runner.md` ("contract dispatch của riêng fgOS") | patch to `docs/routing-handoff-contract.md#khung-prompt-4-phần`, Phase 9 | ok. Section `## Khung prompt 4 phần` (line 10) exists and is the same holder as twin 06621. The four fixed worker-prompt parts (Goal, Worktree boundary, Expected proof, Constraints) are the dispatch contract a runner worker receives. |
| 01327 | L100 `docs/history/.../canary-run.md` | preserve | ok. The path never existed. It is an explicit evidence citation in a Known Gaps paragraph that says "hồ sơ xưởng, không thuộc repo sản phẩm này" (L12-51(1)). |
| 01328 | L127 Pointers `docs/decisions/0009-...md` | parked, GAP-02 | ok. It is a live pointer to a removed path whose holder is not yet carried (same basis as 01324). |
| 01329 | L133 `docs/backlog.md` | preserve | ok. Retained root that exists. |

Coverage: the frontmatter `relates_decisions: [ADR0009]` is a bare id, not an edge (L12-49). `src/install/coexist.mjs`, `bin/fgos.mjs`, `test/e2e/coexistence-canary.test.mjs` and `.fgos/coexistence.json` are not retiring paths.

Record-text notes (not rework):
- The `resolutionSearches` assessment strings for 01325 and 01326 still say "wrapper Related navigation ... no subject/section locator is asserted by this list entry". That is stale boilerplate from before the rework. The edge `reason` fields are correct.
- The 01325 anchor `...approval-gate-reviewapprovereject` is the repo extractor's slug (`scripts/list-doc-anchors.mjs`, which strips punctuation without a double hyphen). GitHub would render `approval-gate--review...`. The L12-32(2) rule binds the extractor, so the anchor is correct under the rule. Step 9 may want to confirm the rendered link.

## Lead-judgment questions

1. L12-54 ruling 1 says "Related Files rows labelled 'source ...' are provenance and preserve". The batch-122 rows `[Legacy source: docs/specs/work-state.md](...)` (07913, 07934, and 07898 in implementation-pointers) are parked as duplicate navigation, not preserved. The earlier wave5g review accepted that, because the live holder is listed in the same list or header. Please confirm that "Legacy source:" rows do not fall under ruling 1. If they do, 07913 and 07934 would flip to preserve with a successor note. I judged them ok as authored, on the L12-34(4) duplicate rule.

## Counts

Reviewed 3 files and 27 edges. OUTCOME rework: 0 files and 0 edges. Record-text notes: 3. Lead-judgment questions: 1.

Status: DONE
