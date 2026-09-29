---
phase: 1
title: "Characterization tests cho từng consumer"
status: pending
priority: P1
effort: "1.5d"
dependencies: []
---

# Phase 1: Khoá hành vi hiện tại trước khi đổi

## Overview
Viết test mô tả chính xác mỗi consumer (bảng trong `plan.md`) quyết định gì với từng dạng RunResult. Test viết trước khi sửa, để thấy rõ thay đổi nào là có chủ đích.

## Requirements
- **Fixture lấy từ dạng record có thật**, không từ ma trận tự nghĩ. <!-- Red Team #14 -->
  - Quét `.fgos/assignments/**/result.json`, gom theo tuple `(contract.version, execution.status, assessment.verdict, policy.disposition, confidence.level, failure?.family, status, confidence)`. Lúc red-team có khoảng 15 dạng: 925 v1 không có contract, 101–106 v2.
  - Mỗi dạng một fixture đã lọc bớt. Phải có:
    - v1 (legacy `status` duy nhất), trong đó có `failed|failed`;
    - v2 `completed/findings/reported`;
    - `failed/needs-input`, `completed/inconclusive/no-evidence`, `completed/not-applicable/failed`, `completed/pass/refuse/failed`.
  - Bổ sung đủ `POLICY_DISPOSITIONS` (`allow`, `refuse`, `needs-input`, `not-applicable`; xem `run-result.mjs:19`) và trường hợp có hoặc không có `failure`.
  - Thêm các case hỏng: corrupt v2, contract không biết, runId lệch, và record sửa tay tự nhận `classification` là `completed/pass/verified` trong khi evidence thật là fail (chặn giả mạo).
- Với mỗi consumer, assert output hiện tại cho:
  - session-engine: gom lỗi (3330-3332), disclosure (3689-3702), bỏ qua run fail (4005);
  - legality-facts: `classifyOperationAssignment`, `hasAcceptedDispositionRemediation`, `branchSatisfiedAtSeq`;
  - operation-choice: `findLatestAssignmentRunResult` (downgrade), `interpretAssignmentRunResult` (1701-1770, 2094);
  - loop (dừng vòng lặp);
  - `run.mjs` (`step.status`, `settledFailed`);
  - `show.mjs:416-417`.
- **Test cấp session:** reviewer `findings` → revise → recheck sạch. Assert rằng revise được kích hoạt và quorum **không** chốt trên lần bác. <!-- Red Team #4 -->
- **Case theo text verdict** cho `review-item` / `validate-plan` (REJECT/APPROVE): khi `findings` không còn là `failed`, nhánh `review-item-rejected-route-fix` → `fix-verify-red` sẽ sống lại. Assert có cap số vòng review → fix. <!-- Red Team #14 -->
- Đánh dấu những ô mà quyết định 5 **muốn đổi** bằng `todo: expected-change` kèm lý do. Ô nào đổi phải khớp với bảng ngữ nghĩa consumer trong `plan.md`.

## Related Code Files
- Create:
  - `test/runner/run-result-consumers.characterization.test.mjs`
  - `test/fixtures/run-result/real-shapes/*.json`
- Read: các file trong bảng consumer của `plan.md`

## Implementation Steps
1. Chạy gitnexus `impact` cho `projectLegacyStatus`, `classifyRunEvidence`, `interpretRunResult`, `classificationForSettlement`; ghi lại blast radius.
2. Chạy script quét tuple trên `.fgos/assignments` và dán bảng đếm vào `plan.md`. Dựng fixture từ các dạng này. Fixture v2 dựng bằng `normalizeRunResultV2` nếu tái tạo được; nếu không thì copy record thật đã lọc bớt.
3. Viết assert cho từng consumer và test cấp session.

## Success Criteria
- [ ] Test xanh trên code hiện tại.
- [ ] Mọi dạng tuple có thật trên đĩa đều có fixture.
- [ ] Danh sách ô `expected-change` được viết ra và dán vào `plan.md`, khớp với bảng ngữ nghĩa consumer.

## Risk Assessment
- **Consumer khó gọi riêng lẻ** (hàm nội bộ trong `session-engine`). Test qua hàm export gần nhất; nếu buộc phải export thêm thì chỉ export hàm thuần.
