# Review: Step 0 rebinds for L12-101 (merge 2cf668766)

Input: `reports/phase-08/step-07-l12-101-merge-rebindings.json` at c833eeb4e (31 rows). Before = first parent d274f1fc8, after = c833eeb4e. Target bytes at c833eeb4e are identical to main b4e25c442 for runner.md. Units come from the unchanged `scripts/generate-doc-inventory.mjs#extractMarkdownConservationUnits`, the same call the embedded `step10-sync287-lib.mjs` `unitsOf` makes. Non-.md files use a whole-file `file-block`. Every ledger `targetUnitDigest` at c833eeb4e~1 equals the d274 unit digest, and every value at c833eeb4e equals the after unit at the **same index**. So the Doer re-hashed whatever block sits at the old index. It did not locate the passages by content.

## Key finding

Main rewrote the runner.md "Hợp đồng rigor và tier" section near the top (blocks 10-13), and the file has two fewer unheaded blocks (519 to 517 units). Every runner.md block from there on moved down two indexes. For each of the 20 runner rows, the passage the claim was bound to sits **byte-identical** at `unheaded-block-(N-2)`, and the previous and next blocks match on both sides. The block now at `unheaded-block-N` is a different passage. One example: in the after file, row 22's `-319` now holds the P2 Runnable Plans decision, which is row 23's own passage. The owner-answers claim that "both extractors locate all 31 affected target anchors by content" is false for these 20 rows. Earlier merges (L12-67: "24 direct rebindings (3 content / 21 position)") handled this kind of shift correctly.

## Table

| # | claim | shard | target#anchor | verdict | evidence |
|---|---|---|---|---|---|
| 1 | 83c03365 | s3-host-invocation-boundary-gaps | architecture-manifest.json#file-block | accept | Same single file-block, so the supersede still holds. Main added 13 modules and dropped 3 entries that were also in the witness: `assignment-policy`, `workflow-pool-independence` (renamed to `workflow-definition-files`) and `role-ledger` (replaced by `seat-ledger`). Note 1. |
| 2 | af89c4e6 | s3-host-invocation-boundary-gaps | component-boundary.md#unheaded-block-11 | accept | Same "Current High-Level Components" table at lines 66-95. Main added Seat Binding, Durable file and Canonical JSON rows and revised the Execution Core and Process Facts rows. No witness line was lost. |
| 3 | 0f4d968b | s3-host-invocation-boundary-gaps | distribution.md#unheaded-block-5 | accept | Same Data Dictionary table at lines 61-87. Only rows 7 and 7b (Doctor check/fix lists) were edited. No witness line was lost. |
| 4 | 97479b13 | s3-host-invocation-boundary-gaps | runner.md#unheaded-block-154 | rework-anchor | Bound to "Đổi quyết định này = supersede…" (line 1699). It is now `unheaded-block-152` at line 1695, with neighbors identical. `-154` now holds "Chọn kiểu routing theo audience…". |
| 5 | 50dca488 | s3-host-invocation-boundary-gaps | runner.md#unheaded-block-159 | rework-anchor | Same sentence, now at `unheaded-block-157` (line 1723), neighbors identical. `-159` now holds "Trước khi chọn trục…". |
| 6 | 07ae72c4 | s3-host-invocation-boundary-gaps | runner.md#unheaded-block-171 | rework-anchor | Now at `unheaded-block-169` (line 1832). `-171` now holds the "Trước khi chọn hướng sửa…" paragraph. |
| 7 | 211f0b98 | s3-host-invocation-boundary-gaps | runner.md#unheaded-block-180 | rework-anchor | Now at `unheaded-block-178` (line 1916). `-180` now holds the "Cả hai đều delegate… claimWork" paragraph. |
| 8 | 1d8baa1d | s3-host-invocation-boundary-gaps | runner.md#unheaded-block-245 | rework-anchor | Now at `unheaded-block-243` (line 2440). `-245` now holds the "`0026` viết: rootTask…" paragraph. |
| 9 | 012bfa26 | s3-host-invocation-boundary-gaps | runner.md#unheaded-block-254 | rework-anchor | Now at `unheaded-block-252` (line 2529). `-254` now holds the "`0025` chốt 3 bậc ưu tiên…" paragraph. |
| 10 | 99806d8b | s3-host-invocation-boundary-gaps | runner.md#unheaded-block-278 | rework-anchor | Now at `unheaded-block-276` (line 2710). `-278` now holds the "Cổng Iron Law…" paragraph. |
| 11 | a6f43d98 | s3-host-invocation-boundary-gaps | runner.md#unheaded-block-290 | rework-anchor | Now at `unheaded-block-288` (line 2822). `-290` now holds the "capacity kind:agent cli-spawn-shaped…" paragraph. |
| 12 | b91c8678 | s3-host-invocation-boundary-gaps | runner.md#unheaded-block-82 | rework-anchor | Bound to "`execute --for <purpose>`…". Now at `unheaded-block-80`. `-82` now holds the RUL69 modelTier bullet. |
| 13 | 26f62a1a | s4-packaging-main-recarry | distribution.md#unheaded-block-5 | accept | Same as row 3. |
| 14 | f2f1dadd | s5-root-authorities-boundary-gaps | distribution.md#unheaded-block-5 | accept | Same as row 3. |
| 15 | b741539a | s5-root-boundary-sync | install-fgos…doctor.md#unheaded-block-37 | accept | Same §4.2 Project config table, same ancestry, lines 230-259. Main removed the `runner-rigor-config`, `model-policy-tier-coverage` and `capability-rigor-ceiling` rows and added `seat-binding-config` (3133ed474, bd8d64fdd). Two of the removed rows are in the source witness (67a276b0d). Note 1. |
| 16 | b7876fcb | s5-root-boundary-sync | runner.md#unheaded-block-103 | rework-anchor | Bound to the "`bin/fgos-runner.mjs` — CLI…" module list. Now at `unheaded-block-101` (line 1244). `-103` now holds the "Thuật ngữ hiện hành" glossary table. |
| 17 | f9c135d8 | s5-root-main-recarry | architecture-manifest.json#file-block | accept | Same as row 1. |
| 18 | b19630ef | s5-root-main-recarry | architecture-manifest.json#file-block | accept | Same as row 1. |
| 19 | a63132a3 | s9-runner-01 | runner.md#unheaded-block-103 | rework-anchor | Same as row 16, so the correct anchor is `unheaded-block-101`. |
| 20 | f64fa4a3 | s9-runner-01 | runner.md#unheaded-block-127 | rework-anchor | Bound to "Architecture advisory — current boundary". Now at `unheaded-block-125`. `-127` now holds "`--dir` chỉ quyết định nơi lưu state…". |
| 21 | f4058f06 | s9-runner-01 | runner.md#unheaded-block-136 | rework-anchor | Bound to "Vai mù thật sự (`blind`)…". Now at `unheaded-block-134`. `-136` now holds "Mỗi vai một nhiệm vụ.". |
| 22 | 77a827ba | s9-runner-01 | runner.md#unheaded-block-319 | rework-anchor | Bound to the decision "Settled (Request-to-Run P1 Execution Core…)". Now at `unheaded-block-317`. `-319` now holds the P2 decision, which is row 23's passage. |
| 23 | 3dcf1baa | s9-runner-01 | runner.md#unheaded-block-321 | rework-anchor | Bound to the decision "Settled (Request-to-Run P2 Runnable Plans…)". Now at `unheaded-block-319`. `-321` now holds the P3b decision. |
| 24 | 93d5f2d3 | s9-runner-01 | runner.md#unheaded-block-327 | rework-anchor | Bound to the decision "Settled (2026-10-05) Có hai đường truyền kết quả…". Now at `unheaded-block-325`. `-327` now holds the 2026-10-11 lens decision. |
| 25 | 8f8191c1 | s9-runner-01 | runner.md#unheaded-block-324 | rework-anchor | Bound to the decision "Settled cho ca 1, 2, 3, 4, 6; ca 5 NOT RUN". Now at `unheaded-block-322`. `-324` now holds "Settled (2026-10-04). Thay thế mục 2 của 0051". |
| 26 | 74a47937 | s9-runner-01 | runner.md#unheaded-block-72 | rework-anchor | Bound to the "Fault classifier chỉ đọc…" paragraph (partial-carry, quarantine clause). Now at `unheaded-block-70`. `-72` now holds the gitnexus "3 gate" paragraph. |
| 27 | 072766aa | s9-runner-01 | runner.md#unheaded-block-91 | rework-anchor | Bound to the RUL73 bullet. Now at `unheaded-block-89`. `-91` now holds the RUL75 bullet. |
| 28 | 4d5b7f73 | s9-runner-01 | runner.md#unheaded-block-94 | rework-anchor | Bound to the RUL76 bullet. Now at `unheaded-block-92`. `-94` now holds the "Worker cli-spawn chạy trong sandbox…" list. |
| 29 | d5ba1eda | s9-runner-01 | runner.md#unheaded-block-94 | rework-anchor | Same as row 28, so the correct anchor is `unheaded-block-92`. |
| 30 | 41571c8f | s9-runner-01 | runner.md#unheaded-block-53 | rework-anchor | Bound to the "Runs when: mọi lần git commit chạm cây chính…" list. Now at `unheaded-block-51`. `-53` now holds the "Từ str89-fgos-domain-skills…" paragraph. |
| 31 | a64fabc0 | s9-runner-01 | runner.md#unheaded-block-103 | rework-anchor | Same as row 16, so the correct anchor is `unheaded-block-101`. |

## Counts

- accept: 8 (rows 1, 2, 3, 13, 14, 15, 17, 18)
- rework-anchor: 23 (every runner.md row: 4-12, 16 and 19-31, covering 20 distinct anchors)
- claim-changed: 0
- needs-Lead-judgment: 0. Note 1 is a disposition question for the Lead.

Arithmetic check: 3 manifest rows, 1 component-boundary row, 3 distribution rows, 1 how-to row and 23 runner.md rows make 31.

## Rework detail

For each runner.md row, set `targetAnchor` to `unheaded-block-(N-2)` and set `targetUnitDigest` back to the row's **beforeDigest**. The passage content did not change, so the digest bound before the merge is correct at the new index.

| rows | before anchor | after anchor | digest to restore |
|---|---|---|---|
| 30 | 53 | 51 | 97ebe38b… |
| 26 | 72 | 70 | 93eab619… |
| 12 | 82 | 80 | 661c9e16… |
| 27 | 91 | 89 | 8b0b585d… |
| 28, 29 | 94 | 92 | 9029936d… |
| 16, 19, 31 | 103 | 101 | 443f8e74… |
| 20 | 127 | 125 | 97b0e92a… |
| 21 | 136 | 134 | 20b88b97… |
| 4 | 154 | 152 | 95a357e2… |
| 5 | 159 | 157 | 95a357e2… |
| 6 | 171 | 169 | 95a357e2… |
| 7 | 180 | 178 | 95a357e2… |
| 8 | 245 | 243 | 95a357e2… |
| 9 | 254 | 252 | 95a357e2… |
| 10 | 278 | 276 | 95a357e2… |
| 11 | 290 | 288 | 95a357e2… |
| 22 | 319 | 317 | 7518a36e… |
| 23 | 321 | 319 | 715faf81… |
| 25 | 324 | 322 | 187780a9… |
| 24 | 327 | 325 | 6adc7286… |

The full digests are the `beforeDigest` values in the input JSON. Rows 4-11 all bind the same repeated sentence. Each one was placed by position with matching previous and next blocks, not by text alone.

Two more fixes are needed:
- The `targetAncestry` of the reworked rows should be re-derived at the new index. Heading ancestry is unchanged unless a heading lies between, and the neighbor check suggests none does.
- The L12-101 owner-answers line ("locate all 31 affected target anchors by content … zero remaining target drifts") and `remainingTargetDigestDrift: 0` must be corrected after the rework. Those values were computed against the wrongly placed blocks.

## Note 1 (accepted rows, for the Lead)

In rows 1, 17 and 18 (manifest) and row 15 (doctor how-to), main **removed** content that the historical source witness carries:
- Manifest: `src/runner/dispatch/assignment-policy.mjs`, `src/setup/workflow-pool-independence.mjs` and `src/runner/execution/role-ledger.mjs`.
- How-to: the `runner-rigor-config` and `model-policy-tier-coverage` doctor-check rows. Seat binding retired `rigorToTier`, and the new `seat-binding-config` check replaces them.

The anchors are correct. The `supersede` text ("successor replaces or accounts for the source") still reads true, because each removed line has a renamed or replacing successor. No claim depends on the removed lines specifically. The rows are therefore accepted, with this note: the removed rows are now retired under a unit-level supersede, and the merge brought no new decision text.

Status: DONE_WITH_CONCERNS
Summary: 8/31 rebinds accepted. All 23 runner.md rows (20 distinct anchors) must be reworked: main dropped two blocks early in runner.md, and the Doer re-hashed whatever passage sits at the old index. The original passages are byte-identical at `unheaded-block-(N-2)` with their original digests.
