# Phase 10 — D8: driver operation qua runUnit + input generic

Mốc M2, bước G (song song phần chính của 09; cần 09a đã merge) · Lane L10 (`feat/rununit-driver`) · Ước lượng 3.5d · Rủi ro: cao · Red-team bắt buộc · Nằm trên đường găng

## Điều kiện bắt đầu (Lead sửa plan #4)

**Chưa được viết code** cho tới khi báo cáo spike [phase-08](phase-08-work-cut-design-spike.md) đã trả lời câu 2 (gốc của `pinInputs`), câu 3 (mọi nguồn rigor), câu 8 (Work tìm lại kết quả validate-plan thế nào), và Lead đã ghi "duyệt". API dưới đây là mặc định của spike; báo cáo spike thắng nếu hai bên khác nhau.

## Context

- Quyết định Lead #5; reviewer F1; red-team RT-R4-1, R-C1, R-H1, R-H2.
- Hiện trạng:
  - `executeDriverOperationChoice` (`src/runner/operation-choice.mjs:2161`) dựng `buildAssignment(...)` (`:2205`) rồi gọi thẳng `executeAssignment` (`:2217`).
  - Kết quả cũ được tìm qua `findLatestAssignmentRunResult` (`:104-140`). Hàm này chỉ duyệt layout phẳng và lọc theo `workId`/`stage`/`resultKind` (R-C1).
  - Plan cũ bị chặn bằng cách so `planContentHash` (`:360`, `:783-810`), lấy theo `resolveContentRoot`.
  - `onAdvance` đọc `plan.md` ở tầng Work (`:2232-2250`).
  - Driver được gọi từ `loop.mjs:978,1614` và từ `fgos plan <id> --validate` → `planUseCase` (`src/verbs/state/step.mjs:73`, `bin/fgos.mjs:1163-1190`). Không có verb `fgos step` (V-M9).

## Requirements

1. **`runUnit` thêm hai tuỳ chọn** (không phải field của Unit), cả hai lưu trong `unit.json`:
   - `declared: {workId, domain, workflow, stage, operation, operations}`. `dispatchBound` stamp assignment qua `assignment-normalizer.mjs`, ra `mutation`, `evidence.required`, `resultKind`, `onAdvance`. Dispatch kiểm `operation ∈ operations` và render prompt theo operation.
   - `pinInputs: string[]` gồm các **đường dẫn tuyệt đối** do Work phân giải bằng `resolveContentRoot`. Gốc được phép là `mainRoot` cộng các worktree mà git liệt kê; ngoài các gốc đó thì digest là `null`. Settlement ghi `inputDigests: {<abs>: <sha256|null>}` lúc launch.
2. **Rigor.** Work tính rigor từ mọi nguồn spike câu 3 đã liệt kê: `opPolicy.rigor`, `work.rigor`, `risk: heavy` → high, các nguồn khác. Kết quả đặt vào `unit.rigor`. `dispatchBound` ghi `assignment.rigor`. Policy không bao giờ hạ dưới giá trị này.
3. **Driver.** `executeDriverOperationChoice` (nhánh `assignment`) làm các bước sau:
   - dựng `unitData` bằng `workUnitFor(work, { operation, ... })` (09a);
   - gọi `runUnit` với `declared` và `pinInputs`, cộng worktree item nếu operation mutating;
   - đưa `runResult` của producer cuối vào `interpretAssignmentRunResult`;
   - ghi `unitRunId` vào event hoặc state của item theo spike câu 8.
4. **Tìm lại kết quả (R-C1).** `findLatestAssignmentRunResult`, cùng mọi walker spike đã liệt kê, đọc kết quả qua `unitRunId` đã ghi, hoặc dùng walker hiểu layout lồng và lọc theo `declared`, theo phương án spike chốt. Kết quả cũ ở layout phẳng vẫn phải đọc được (một đường đọc).
5. **Chặn plan cũ.**
   - So `sha256(<abs plan.md>)` với `runResult.inputDigests[<abs>] ?? runResult.planContentHash`.
   - Test `:4710` ("recorded without a plan content hash is not consumed") phải giữ nguyên ý.
   - Settlement thôi tính hash từ `opts.work.docsRef`; nhánh đó bị xoá hẳn ở 11.
6. `onAdvance` vẫn ở tầng Work. Phương án B của 00 vẫn giữ.
7. **Test call-site:** sửa `expectedFiles` của test `test/architecture.test.mjs:337` và nhánh `operation-choice` của `checkExecuteAssignmentCallSitePostures` (`:300-332`). Gỡ `operation-choice.mjs` khỏi `R3_PENDING_WORK_CALLERS`. Việc này làm sau khi 09 merge (V-M3).

## Files

Sở hữu: `src/runner/operation-choice.mjs`, `src/verbs/state/step.mjs` (nếu cần), `src/runner/execution/run.mjs`, `src/runner/dispatch/assignment-runner.mjs`, `settlement.mjs`, `run-result.mjs`, cùng các test `operation-choice.test.mjs`, `run.test.mjs`, test của settlement, test `:337`.

Chỉ đọc: `work-dispatch.mjs` (dùng helper), `assignment.mjs`, `assignment-policy.mjs`, `plan.mjs` (11 sửa), `loop.mjs`.

## Bước

1. Chạy impact cho `executeDriverOperationChoice`, `findLatestAssignmentRunResult`, `runUnit`, `settleRunOutcome` (CRITICAL), `normalizeRunResultV3`.
2. Test đỏ. Giữ nguyên các test hiện có, đặc biệt `:3140, 3193, 4622, 4686, 4710, 4807` (V-L3); thêm:
   - **Chu trình đầy đủ (Lead #4):** Work → driver chạy validate-plan qua runUnit → lượt `chooseStageOperation` kế tiếp **tự tìm thấy** verdict, không dùng fixture trao sẵn `lastRunResult` → tiến cạnh.
   - **Stale-plan qua chu trình:** sửa `plan.md` sau khi validate thì verdict không được tiêu thụ.
   - **`plan.md` chỉ có trong worktree item, validate-plan chạy từ stateRoot:** digest khớp, verdict được tiêu thụ (R-H1).
   - **Rigor, mỗi nguồn một test:** `work.rigor: high`; `risk: heavy` không khai rigor; `opPolicy.rigor`. Assignment phải có rigor đúng, không bị hạ (R-H2).
   - Kết quả cũ chỉ có `planContentHash` vẫn đọc đúng; kết quả layout phẳng cũ vẫn được tìm thấy.
   - Operation nằm ngoài `operations` bị từ chối trước khi spawn.
   - Operation mutating chạy trong worktree item, và chỉ runner commit.
   - Read-only có cảnh báo correlated: Work không tiến (00).
   - `fgos plan <id> --validate` đi đường mới.
3. Code cho xanh, rồi `npm test`.
4. Báo cáo có Spec delta và CHANGELOG delta. Các test phải đổi kỳ vọng thì ghi lý do từng test.

## Đòn red-team (sàn)

1. Worker sửa `plan.md` rồi đặt lại mtime: digest do runner lấy lúc launch.
2. `pinInputs` ngoài các gốc được phép, hoặc là symlink trỏ ra ngoài: digest `null`, không đọc file.
3. Resume giữa chừng: `declared` và `pinInputs` đọc từ `unit.json`.
4. Hai operation của cùng một item chạy song song: id không đụng nhau; walker không lấy nhầm kết quả của operation kia.
5. `human-only`, `direct-stage-skill`, `stop` vẫn không spawn.
6. Prefer mềm bị lọc; reviewer `independentOf` vẫn khác họ.
7. Walker cũ còn đọc layout phẳng ở chỗ khác mà spike bỏ sót: grep `.fgos/assignments` trong `src/`.

## Rủi ro + rollback

- Đổi đường chạy của mọi bước driver. Test hiện có là chuẩn; không nới test nào.
- Rollback: revert commit của lane. Kết quả cũ trên đĩa đọc qua đường lùi.

## Xong khi

- Ca ở bước 2 xanh.
- `rg -n "executeAssignment\(" src/runner/operation-choice.mjs` ra 0.
- `npm test` exit 0.
- Red-team sạch.
