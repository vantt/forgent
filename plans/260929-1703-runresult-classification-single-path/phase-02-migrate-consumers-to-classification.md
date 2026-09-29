---
phase: 2
title: "Chuyển consumer sang classification"
status: done
priority: P1
effort: "2d"
dependencies: [1]
---

# Phase 2: Mọi consumer đọc `classification` qua một helper

## Overview
Mọi quyết định đọc kết quả run qua đúng một helper thuần do Run Result Evaluator sở hữu, dựng trên `interpretRunResult`. Mỗi consumer dùng ngữ nghĩa đã chốt trong **bảng ngữ nghĩa consumer** của `plan.md`, không để người implement tự chọn.

## Requirements
- Helper trong `src/runner/dispatch/run-result.mjs`:
  ```js
  export function runOutcome(resultOrPath, { evidenceFloor } = {})
  // → { category: 'ok'|'infra'|'verdict'|'policy'|'blocked'|'corrupt',
  //     executed: 'completed'|'failed'|'cancelled'|'unknown',
  //     verdict: 'pass'|'findings'|'blocked'|'inconclusive'|'not-applicable',
  //     refused: boolean, evidence: 'verified'|'reported'|'inferred'|'none'|'failed',
  //     satisfied: boolean,          // === (category === 'ok')
  //     infraFailure: boolean,       // === (category === 'infra' || category === 'corrupt')
  //     failure }
  ```
- **Fail-closed với record hỏng.** <!-- Red Team #3 -->
  - Khi `interpretRunResult` báo `corrupt`/`contractCorrupt`/`provenance === 'contract-corrupt'`, `runOutcome` trả `category: 'corrupt'`, `satisfied: false`, và bỏ qua mọi field đã lưu.
  - `interpretRunResult` thay `classification` bằng một shape corrupt cố định, không spread `rawObj.classification`.
- **Luật phân nhóm `deriveOutcome(classification)`** (thứ tự cố định, dùng chung cho record cũ, validator v3 và producer): <!-- Red Team #1; D2-A giữ nguyên, sửa thứ tự luật -->
  1. `execution.status ∈ {failed, cancelled, completion-unknown}` và `failure.family ∈ {provider, resource, unknown}` (hoặc không có `failure`) → `infra`;
  2. `policy.disposition === 'refuse'`, hoặc `failure.family ∈ {contract, policy}` → `policy`;
  3. `policy.disposition === 'needs-input'` → `infra` (provider/resource cần người);
  4. `verdict === 'findings'` → `verdict`;
  5. `verdict === 'blocked'` → `blocked`;
  6. `execution.status === 'completed'` và `verdict ∈ {pass, not-applicable}` → `ok`;
  7. còn lại (ví dụ `inconclusive`) → `verdict`.

  `confidence` **không** là input phân nhóm; nó chỉ là mức evidence. `deriveLegacyOutcome(record v1)` chỉ là bước chuyển `status` legacy thành classification (qua nhánh legacy-derived có sẵn), rồi gọi `deriveOutcome`. Luật được khoá bằng fixture chung `test/fixtures/run-outcome/legacy-derivation.json`, dựng từ các dạng thật ở phase 1.
- **Ngưỡng hạ cấp (downgrade floor)** chuyển từ `operation-choice.mjs:398-430` vào `runOutcome` (tham số `evidenceFloor`), để nó tác động lên classification. <!-- Red Team #2; anh chốt "category là cache được kiểm" -->
  - Suy lại classification từ evidence gắn hash (exit code, settle report, file thay đổi), rồi lấy outcome **thấp hơn** giữa bản đã lưu và bản suy ra. Không bao giờ nâng.
  - Bản suy lại này là ngoại lệ được phép trong source-scan (xem phase 3).
- Chuyển từng consumer sang `runOutcome` **theo đúng bảng ngữ nghĩa consumer** trong `plan.md`:
  - các gate legality/quorum dùng `satisfied`;
  - chỉ fan-in và báo cáo DAG mới tách `infra` khỏi `verdict`.
- `deriveDisclosures` (`session-engine.mjs:3689-3702`): disclosure id `confidence` lấy từ `classification.confidence.level`; disclosure id `status` được thay bằng `outcome` (giá trị là `category`). Cập nhật `requiredDisclosures` của protocol và `aggregation-evaluator` cùng commit. <!-- Red Team #7 -->
- `legality-facts.mjs:221`: **xoá nhánh `payload?.status`**. Schema `result-linked` chỉ nhận `{assignmentId, runId}` (`schema.mjs:351`), 0/936 event có `status`, tức nhánh này là code chết. Chỉ đọc RunResult trên đĩa. <!-- Red Team #9 -->
- Truy nguồn `failedAssignmentIds` (`legality-facts.mjs:1107-1110`) và ghi ngữ nghĩa của nó vào bảng.

## Related Code Files
- Modify:
  - `src/runner/dispatch/run-result.mjs` (`runOutcome`, `deriveOutcome`, `deriveLegacyOutcome`, corrupt shape)
  - `src/runner/coordination/session-engine.mjs` (3330-3332, 3689-3702, 4005)
  - `src/runner/coordination/legality-facts.mjs` (221, 226, 286, 300, 407-409)
  - `src/runner/dispatch/operation-choice.mjs` (398-430, 1701-1770, 1929, 2028, 2093-2102)
  - `src/runner/loop.mjs` (tìm `outcome.runResult?.status`, cả log ở ~1572)
  - `src/verbs/coordination/run.mjs` (359-360, 1020)
  - `src/verbs/coordination/show.mjs` (416-417)
  - `src/runner/team-cognition/aggregation-evaluator.mjs`
  - `src/runner/definitions/schema.mjs` (disclosure vocab)
- Create: test source-scan dạng **cấu trúc** (xem Implementation Steps bước 4)

## Implementation Steps
1. Viết `deriveOutcome`, `deriveLegacyOutcome`, `runOutcome` (cả nhánh corrupt và `evidenceFloor`), kèm unit test trên fixture phase 1. Fixture `legacy-derivation.json` là **fixture chung** mà source Observe cũng assert.
2. Rà lại bảng consumer bằng cách đọc theo symbol: mọi giá trị trả về từ `interpretRunResult`, `readLinkedRunResultFromDisk`, `readRunResultForAssignment`, `outcome.runResult`, kể cả đọc qua destructure và `??`. Đối chiếu với con số "53 chỗ" của plan Observe; chỗ nào lệch thì ghi lý do.
3. Chuyển từng consumer, mỗi consumer một commit. Chạy characterization test: ô `expected-change` được cập nhật có chủ đích, các ô khác phải giữ nguyên.
4. Test source-scan trên **toàn `src/`**: <!-- Red Team #8 -->
   - không được đọc `.status`/`.confidence` (kể cả qua destructure) trên giá trị lấy từ các reader ở bước 2, ngoại trừ bên trong `run-result.mjs`;
   - cách làm đề xuất: ở phase 3, `interpretRunResult` trả object đã `Object.freeze` và không có key `status`/`confidence`, kèm getter ném lỗi trong môi trường test.

## Success Criteria
- [x] Characterization test xanh, chỉ đổi các ô `expected-change`.
- [x] Case giả mạo (classification sửa tay thành pass nhưng evidence fail) vẫn dừng; case corrupt trả `category: 'corrupt'`.
- [x] Test cấp session "findings → revise → recheck" xanh.
- [x] Test source-scan xanh.
- [x] `npm test` xanh (chạy với `CLAUDE_CODE_SESSION_ID` bị unset, theo memory).

## Risk Assessment
- **Chọn sai ngữ nghĩa `findings` ở một consumer.** Đã giảm bằng bảng ngữ nghĩa chốt sẵn; gate luôn dùng `satisfied`. Dấu hiệu còn sót: session không revise sau khi reviewer bác, hoặc retry vô ích. Phase 6 đo lại.
- **Đổi disclosure id `status` → `outcome`** làm protocol cũ yêu cầu `status` bị no-consensus. Cách xử lý: cập nhật mọi protocol trong `core/` cùng commit, và grep `requiredDisclosures`.
