---
phase: 1
title: "Characterization tests cho từng consumer"
status: done
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
0. **Chuẩn bị worktree** (idempotent; chạy từ main checkout `/home/vantt/projects/forgentX`):
   1. Nếu `git worktree list` đã có `~/projects/forgentX-runresult-classification` thì chỉ kiểm tra: branch đúng là `plan/260929-runresult-classification`, symlink `node_modules`/`target` còn, rồi sang bước 3.
   2. Nếu chưa có:
      - commit thư mục plan này lên `main` nếu còn thay đổi chưa commit. Chỉ `git add -- plans/260929-1703-runresult-classification-single-path`, không kéo theo file khác đang sửa dở;
      - `git worktree add -b plan/260929-runresult-classification ~/projects/forgentX-runresult-classification main`. Không checkout branch trong main checkout;
      - `ln -s /home/vantt/projects/forgentX/node_modules` và `ln -s /home/vantt/projects/forgentX/target` vào worktree.
   3. `cd` vào worktree, kiểm `pwd` và `git branch --show-current`. Chạy nhanh một test (`CLAUDE_CODE_SESSION_ID= node --test test/runner/<một file nhỏ>`) để chắc môi trường chạy được.
   4. Từ đây, mọi thao tác của plan (sửa code, test, commit) đều làm **trong worktree**, không làm ở main checkout.
1. Chạy gitnexus `impact` cho `projectLegacyStatus`, `classifyRunEvidence`, `interpretRunResult`, `classificationForSettlement`; ghi lại blast radius.
2. Chạy script quét tuple trên `/home/vantt/projects/forgentX/.fgos/assignments` (dữ liệu thật nằm ở main checkout, worktree không có bản riêng) và dán bảng đếm vào `plan.md`. Dựng fixture từ các dạng này. Fixture v2 dựng bằng `normalizeRunResultV2` nếu tái tạo được; nếu không thì copy record thật đã lọc bớt.
3. Viết assert cho từng consumer và test cấp session.

## Success Criteria
- [x] Worktree `~/projects/forgentX-runresult-classification` tồn tại, trên branch `plan/260929-runresult-classification`, có symlink `node_modules`/`target`.
- [x] Test xanh trên code hiện tại.
- [x] Mọi dạng tuple có thật trên đĩa đều có fixture.
- [x] Danh sách ô `expected-change` được viết ra và dán vào `plan.md`, khớp với bảng ngữ nghĩa consumer.

## Risk Assessment
- **Consumer khó gọi riêng lẻ** (hàm nội bộ trong `session-engine`). Test qua hàm export gần nhất; nếu buộc phải export thêm thì chỉ export hàm thuần.
