---
phase: 3
title: "Một producer: bỏ phép chiếu legacy, gộp classifyRunEvidence (Node)"
status: completed
priority: P1
effort: "1.5d"
dependencies: [2]
---

# Phase 3: Một producer classification (phần Node)

## Overview
Chỉ còn một nơi tạo classification. RunResult mới không ghi `status`/`confidence` legacy nữa (**D1-A đã chốt**). <!-- Updated: Validation Session 2 - D1-A -->

Phase này **chỉ đụng Node**, không phụ thuộc plan Observe. Phần Rust (source Observe đọc v3) nằm ở phase 5.

Phase này ra **hai commit, theo thứ tự cố định**: <!-- Red Team #6; Validation Session 5: gộp hai lần merge thành một, giữ commit writer riêng -->
- **C1**: reader + producer;
- **C2**: writer v3, là **commit riêng**, không trộn thay đổi khác.

Cả branch merge một lần. Đường lùi là `git revert <C2>`: reader của C1 vẫn đọc được mọi record v3 đã ghi.

## Requirements

### C1: đọc theo version
<!-- Red Team #5 -->
`interpretRunResult` rẽ nhánh tường minh theo version:
- **v1** (không có `contract`): nhánh legacy-derived hiện có. Chuyển `status` thành classification, rồi `deriveOutcome`.
- **v2**: `validateRunResultV2` **đóng băng**. Nó giữ một bản private, cũng đóng băng, của `projectLegacyStatus`/`projectLegacyConfidence`, chỉ dùng để kiểm "status đã lưu = phép chiếu" của record v2. Classification thật của v2 được giữ nguyên, không đưa qua nhánh legacy.
- **v3**: `validateRunResult` (v3). Bác record có `classification.outcome.category !== deriveOutcome(classification)`, tức category chỉ là **cache được kiểm**. <!-- Red Team #2; anh chốt -->
- Contract khác: corrupt, fail-closed (`category: 'corrupt'`).

Có test: reader của C1 đọc đúng fixture v3; session có cả v2 và v3.

### C1: một producer
- `classifyRunEvidence` (`settlement.mjs:222-294`) được viết lại thành bước tạo **classification** (execution, assessment, confidence, failure) và làm input cho normalizer. Caller: `assignment-runner`, `settlement`. Phần suy lại lúc đọc ở `operation-choice` đã chuyển thành `evidenceFloor` của `runOutcome` ở phase 2.
- **Xoá producer thứ ba đã chết** `classificationForSettlement` (`assignment-runner.mjs:147`, không có caller). <!-- Red Team #13 -->
- `settlement.mjs:724-742` (đường spawn-failure): <!-- Red Team #13 -->
  - bỏ tham số `status: 'failed'` thừa ở `:729`;
  - `agentClaim` do runner tự dựng từ stderr ở `:738` đổi thành `runnerNote` và **không** làm input cho assessment (luật M4: `agentClaim` chỉ có khi worker thật sự claim).
  - Chỉ `:767` là projection `run.json`, tức **trạng thái vòng đời của Run**, không phải kết quả. Giữ nguyên, và ghi rõ trong spec.
- Producer có sẵn một input tuỳ chọn `usage` (mặc định `null`), để phase 4 nối vào mà không phải sửa lại hàm.

### C2: writer v3 (commit riêng, cuối phase)
- RunResult mới bỏ `status`/`confidence`; contract `assignment-run-result` lên **v3**.
- Producer ghi `classification.outcome = { category, reason }` **đúng một lần** bằng `deriveOutcome` (D2-A). <!-- Updated: Validation Session 4 - D2-A; Red Team #1 -->
- **Field dispatch trong v3:** <!-- Red Team #12 -->
  - `adapter`: key của `EXECUTOR_ADAPTER_NAMES` (`cli-spawn` | `herdr-spawn` | `http`), truyền từ resolved command vào settlement.
  - `confinement`: `bwrap` | … | `null`, field riêng.
  - `role`: lấy từ assignment.
  - `durationMs`: số thật hoặc `null` khi không biết, **không bao giờ `0` giả**. Sửa `settlement.mjs:622` (`?? 0`), `:704`, và đường refused ở `assignment-runner.mjs:1949-1960`.
  - `executorId`: không mặc định là `'cli-spawn'` ở đường spawn-failure (`run-result.mjs:275`).
- Xoá `projectLegacyStatus*` khỏi **đường ghi** và mọi consumer. Bản đóng băng chỉ còn trong validator v2.
- Cập nhật `docs/specs/runner.md` (contract v3, § Lịch sử quyết định) và `CHANGELOG.md`.

## Related Code Files
- Modify:
  - Node: `src/runner/dispatch/run-result.mjs`, `src/runner/dispatch/settlement.mjs`, `src/runner/dispatch/assignment-runner.mjs`, `src/runner/dispatch.mjs` (export)
  - Tài liệu: `docs/specs/runner.md`, `CHANGELOG.md`
- Delete:
  - `classifyRunEvidence`, `classificationForSettlement`
  - các export `projectLegacyStatus*` (bản đóng băng private trong validator v2 được giữ) cùng test của chúng

## Implementation Steps
1. **C1:** reader v1/v2/v3, gộp producer, xoá producer chết, sửa đường spawn-failure, thêm input `usage`. Characterization test phải giữ nguyên. Commit.
2. Nối parser usage (phase 4, bước 3) vào input `usage` của producer. Commit.
3. **C2:** writer v3 và field dispatch. Viết test:
   - record v3 không có `status`;
   - validator v3 bác record có category lệch với classification;
   - record v1/v2 vẫn đọc đúng.

   Commit riêng.

## Success Criteria
- [ ] `grep -rn "classifyRunEvidence\|classificationForSettlement" src` rỗng. `projectLegacyStatus` chỉ còn trong validator v2 đóng băng (private).
- [ ] Record v1 và v2 đọc đúng như trước (characterization); record mới đúng v3, có `adapter`/`confinement`/`role`/`durationMs` (hoặc `null`, không bao giờ `0` giả).
- [ ] Record v3 có category bị sửa tay thì bị validator bác và thành `corrupt`.
- [ ] Code ở C1 (khi chưa có C2) đọc được fixture v3, tức `git revert C2` an toàn.
- [ ] C2 là một commit riêng, chỉ chứa phần writer v3.
- [ ] Test quét source: chỉ `deriveOutcome`/`deriveLegacyOutcome` được phép phân nhóm. `runOutcome` (qua `evidenceFloor`) và validator v3 gọi `deriveOutcome` để kiểm, là ngoại lệ tường minh.
- [ ] `detect_changes()` chỉ báo các symbol trong phạm vi dự kiến.

## Risk Assessment
- **Tool bên ngoài đọc `result.json` và dựa vào `status`** (source `run-result` của Observe, herdr dashboard). Cách xử lý: phase 5 sửa source Observe **trước khi merge**; grep `herdr-plugin/src` tìm `"status"` trên result trước merge.
- **Binary cũ (bản đã stage, worktree khác) đọc v3.** Sau merge phải restage ngay. Dấu hiệu lỗi: có `result-corrupt` trong log resume, hoặc gate fail-closed hàng loạt. Cách xử lý: `git revert <C2>`, restage.
