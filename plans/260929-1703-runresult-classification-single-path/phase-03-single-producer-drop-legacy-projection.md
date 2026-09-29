---
phase: 3
title: "Một producer: bỏ phép chiếu legacy, gộp classifyRunEvidence"
status: pending
priority: P1
effort: "1.5d"
dependencies: [2]
---

# Phase 3: Một producer classification

## Overview
Chỉ còn một nơi tạo classification. RunResult mới không ghi `status`/`confidence` legacy nữa (**D1-A đã chốt**). <!-- Updated: Validation Session 2 - D1-A -->

Phase này ship qua **hai lần merge**: reader trước, writer sau. Nhờ vậy lùi được mà không làm kẹt run. <!-- Red Team #6 -->

## Requirements

### Đọc theo version (merge A: reader)
<!-- Red Team #5 -->
`interpretRunResult` rẽ nhánh tường minh theo version:
- **v1** (không có `contract`): nhánh legacy-derived hiện có. Chuyển `status` thành classification, rồi `deriveOutcome`.
- **v2**: `validateRunResultV2` **đóng băng**. Nó giữ một bản private, cũng đóng băng, của `projectLegacyStatus`/`projectLegacyConfidence`, chỉ dùng để kiểm "status đã lưu = phép chiếu" của record v2. Classification thật của v2 được giữ nguyên, không đưa qua nhánh legacy.
- **v3**: `validateRunResult` (v3). Bác record có `classification.outcome.category !== deriveOutcome(classification)`, tức category chỉ là **cache được kiểm**, không phải nguồn sự thật. <!-- Red Team #2; anh chốt -->
- Contract khác: corrupt, fail-closed (`category: 'corrupt'`).

Merge A ship reader v1/v2/v3. Writer lúc này **vẫn ghi v2**. Có test: reader của merge A đọc đúng fixture v3.

### Một producer (merge A)
- `classifyRunEvidence` (`settlement.mjs:222-294`) được viết lại thành bước tạo **classification** (execution, assessment, confidence, failure) và làm input cho normalizer. Caller: `assignment-runner`, `settlement`. Phần suy lại lúc đọc ở `operation-choice` đã chuyển thành `evidenceFloor` của `runOutcome` ở phase 2.
- **Xoá producer thứ ba đã chết** `classificationForSettlement` (`assignment-runner.mjs:147`, không có caller). <!-- Red Team #13 -->
- `settlement.mjs:724-742` (đường spawn-failure): <!-- Red Team #13 -->
  - bỏ tham số `status: 'failed'` thừa ở `:729`;
  - `agentClaim` do runner tự dựng từ stderr ở `:738` đổi thành `runnerNote` và **không** làm input cho assessment (luật M4: `agentClaim` chỉ có khi worker thật sự claim).
  - Chỉ `:767` là projection `run.json`, tức **trạng thái vòng đời của Run**, không phải kết quả. Giữ nguyên, và ghi rõ trong spec.

### Writer v3 (merge B)
- RunResult mới bỏ `status`/`confidence`; contract `assignment-run-result` lên **v3**.
- Producer ghi `classification.outcome = { category, reason }` **đúng một lần** bằng `deriveOutcome`, cùng luật phase 2 (D2-A). <!-- Updated: Validation Session 4 - D2-A; Red Team #1 -->
- **Field dispatch trong v3:** <!-- Red Team #12 -->
  - `adapter`: key của `EXECUTOR_ADAPTER_NAMES` (`cli-spawn` | `herdr-spawn` | `http`), truyền từ resolved command vào settlement.
  - `confinement`: `bwrap` | … | `null`, field riêng.
  - `role`: lấy từ assignment.
  - `durationMs`: số thật hoặc `null` khi không biết, **không bao giờ `0` giả**. Sửa `settlement.mjs:622` (`?? 0`), `:704`, và đường refused ở `assignment-runner.mjs:1949-1960`.
  - `executorId`: không mặc định là `'cli-spawn'` ở đường spawn-failure (`run-result.mjs:275`).
- Xoá `projectLegacyStatus*` khỏi **đường ghi** và mọi consumer. Bản đóng băng chỉ còn trong validator v2.
- **Cùng lần merge B:** sửa source `packages/run-result/rust` của Observe để đọc v3:
  - #4 dùng `classification.outcome.category`, không tự phân nhóm;
  - dùng `adapter`/`role`/`durationMs` khi có;
  - sửa phần `runs` của F4 để không "đếm `status`";
  - record v1/v2 đi qua bản Rust của `deriveLegacyOutcome`/`deriveOutcome`, assert trên fixture chung với Node.
- **Điều kiện tiên quyết:** F2 và F4 của Observe đã merge. Lúc red-team, `packages/run-result/rust/src/lib.rs` còn là stub và `scorecard.rs` chưa có.

### Triển khai và đường lùi
- Sau mỗi merge: restage release và kiểm digest (`fgctl status` / `fgos doctor` báo đúng host version), vì `fgos` chạy bản đã stage chứ không phải repo đang sống.
- Worker detached khởi chạy trước merge B vẫn ghi v2. Reader của merge A xử lý được session có cả v2 và v3 (có test).
- Trước merge B: đếm lại số session `active` (red-team thấy 512, plan cũ ghi 216). Đóng hoặc park các session cũ không còn dùng.
- **Rollback:** chỉ revert merge B. Reader của merge A vẫn đọc được mọi record v3 đã ghi. Không bao giờ revert merge A khi đã có record v3 trên đĩa.

## Related Code Files
- Modify:
  - Node: `src/runner/dispatch/run-result.mjs`, `src/runner/dispatch/settlement.mjs`, `src/runner/dispatch/assignment-runner.mjs`, `src/runner/dispatch.mjs` (export)
  - Rust (merge B): `packages/run-result/rust/src/lib.rs`, `packages/observe/rust/src/scorecard.rs` (phần `runs`)
  - Tài liệu: `docs/specs/runner.md` (contract v3, § Lịch sử quyết định), `CHANGELOG.md`
- Delete:
  - `classifyRunEvidence`, `classificationForSettlement`
  - các export `projectLegacyStatus*` (bản đóng băng private trong validator v2 được giữ) cùng test của chúng

## Implementation Steps
1. **Merge A:** reader v1/v2/v3 + gộp producer + xoá producer chết + sửa đường spawn-failure. Characterization test phải giữ nguyên. Thêm test: reader đọc fixture v3; session có cả v2 và v3.
2. Restage và kiểm digest.
3. **Merge B:** writer v3 + field dispatch + source Rust. Viết test:
   - record v3 không có `status`;
   - validator v3 bác record có category lệch với classification;
   - record v1/v2 vẫn đọc đúng.
4. Restage và kiểm digest. Chạy `fgos metrics harness`.

## Success Criteria
- [ ] `grep -rn "classifyRunEvidence\|classificationForSettlement" src` rỗng. `projectLegacyStatus` chỉ còn trong validator v2 đóng băng (private).
- [ ] Record v1 và v2 đọc đúng như trước (characterization); record mới đúng v3, có `adapter`/`confinement`/`role`/`durationMs` (hoặc `null`, không bao giờ `0` giả).
- [ ] Record v3 có category bị sửa tay thì bị validator bác và thành `corrupt`.
- [ ] Reader của merge A đọc được fixture v3 (đảm bảo lùi được).
- [ ] `fgos metrics harness --since <hôm qua>` chạy đúng ngay sau merge B, trên bản đã restage (không có khoảng hở).
- [ ] Node và Rust cùng xanh trên fixture `legacy-derivation.json`. Test quét source: chỉ `deriveOutcome`/`deriveLegacyOutcome` (Node + Rust) được phép phân nhóm; `runOutcome` dùng `deriveOutcome` cho `evidenceFloor` và validator v3 dùng nó để kiểm, đó là ngoại lệ tường minh.
- [ ] `detect_changes()` chỉ báo các symbol trong phạm vi dự kiến.

## Risk Assessment
- **Tool bên ngoài đọc `result.json` và dựa vào `status`** (source `run-result` của Observe, herdr dashboard). Cách xử lý: sửa source Observe trong merge B; grep `herdr-plugin/src` tìm `"status"` trên result trước merge B.
- **Binary cũ (bản đã stage, worktree khác) đọc v3.** Reader của merge A phải lên khắp nơi trước merge B. Dấu hiệu lỗi: có `result-corrupt` trong log resume, hoặc gate fail-closed hàng loạt. Cách xử lý: revert merge B, restage.
