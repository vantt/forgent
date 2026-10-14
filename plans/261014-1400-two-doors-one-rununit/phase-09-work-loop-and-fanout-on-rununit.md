# Phase 09 — D7 + fanout: tầng Work chạy worker qua runUnit

Mốc M2: bước F làm 09a (helper), bước G làm phần còn lại (song song 10) · Lane L9 (`feat/rununit-loop`) · Ước lượng 0.25d + 2d · Rủi ro: cao (`loop.mjs` CRITICAL) · Red-team bắt buộc

## Context

- Quyết định Lead #5. Lead sửa plan #1 (fanout gộp vào 09). Validate V-M4 (một helper dựng `unitData`). Red-team R-M7, R-M8.
- Spike [phase-08](phase-08-work-cut-design-spike.md) câu 6, 9, 10 phải được Lead duyệt trước khi bắt đầu.
- Hiện trạng:
  - `loop.mjs:1077` và `:1505` gọi `spawnWorker` (`work-dispatch.mjs:96`), hàm này gọi thẳng `executeThroughConfinement` (`:257`).
  - Loop tự commit trong `commitWorkerChanges` (`loop.mjs:373-387`), tự ghi `executor.dispatch` (`:~1102-1130`), tee log qua `onChunk`, và đọc `worker.stdout`.
  - `fanout-batch.mjs` gọi `executeExecutorCli` (`:106`) và `commitUnitWork` (`:119`). Lối vào `node` của nó do 06 thêm.
  - `loop.mjs:1902` re-export `fanoutBatchExecutorCli`.

## Requirements

### 09a — helper (bước F, merge trước 10)

1. `workUnitFor(item, { feedback?, operation?, capabilityHint?, rigor? })` đặt trong `src/runner/work-dispatch.mjs`, trả `unitData`:
   - `id`: ascii, ổn định;
   - `objective`: `buildPrompt` cộng feedback;
   - `capability` theo hint;
   - `writes: ['**']` khi mutating, `[]` khi chỉ đọc;
   - `rigor` theo spike câu 3;
   - `prefer: [executorIdForWork(item)]`;
   - `inputs` theo spike câu 4.

   Đây là chỗ duy nhất dựng `unitData` từ Work item. Giữ ổn định export `workDispatchContext`.

### 09 — D7 + fanout (bước G)

2. `spawnWorker` giữ tên. Hàm gọi `runUnit({ unitData: workUnitFor(...), worktree, repoRoot, session: {headless: true} })` và trả về đúng các trường loop đang đọc: `status`, `executorId`, `provider`, `model`, `tier`, `stdout`, `command`, attestation. Thêm `unitRunId` và `commit`. Bảng ánh xạ trường ghi trong báo cáo. Nếu transport là herdr và không có `stdout.log` thì làm theo spike câu 9.
3. Xoá `commitWorkerChanges`. Suy `runner | self | none` từ `commit.status`. Commit `failed` thì báo `worktree-fail`.
4. Event `executor.dispatch` vẫn do loop tự ghi, thêm field `unitRunId`. Nếu runUnit không có kênh stream thì `.fgos/logs/<id>.log` ghi đường dẫn tới log hoặc pane của run (ghi vào CHANGELOG delta).
5. **Fanout:** phần ruột của `fanout-batch.mjs` chạy `runUnit({unitData: workUnitFor(...), worktree: wtPath})`.
   - Bỏ lời gọi trực tiếp `executeExecutorCli` và `commitUnitWork`.
   - `outcome` là pass thì `fgos return`, không truyền `--worker-verified-sha`.
   - Các khác pass thì item blocked, như nhánh lỗi đang có.
   - Mỗi phần tử `fired`: `{id, unitRunId, outcome, commit}`.
   - Gỡ re-export ở `loop.mjs:1902` nếu không còn ai dùng.
6. Gỡ `loop.mjs`, `fanout-batch.mjs` và `work-dispatch.mjs` khỏi `R3_PENDING_WORK_CALLERS`. 09 rebase sau khi 06 merge.

## Files

Sở hữu: `src/runner/work-dispatch.mjs`, `src/runner/loop.mjs`, `src/runner/fanout-batch.mjs` (sau khi 06 merge), các test `test/runner/loop.test.mjs`, `anti-loop.test.mjs`, `fanout-batch-runner-commit.test.mjs`, và allowlist trong `test/architecture.test.mjs`.

Chỉ đọc: `run.mjs`, `assignment-runner.mjs`, `work-compat.mjs`.

## Bước

1. 09a: test đỏ cho helper:
   - item mutating ra `writes: ['**']`;
   - item `risk: heavy` ra rigor đúng theo spike;
   - có feedback thì objective chứa feedback.

   Sửa cho xanh, merge.
2. Chạy impact cho `spawnWorker`, `commitWorkerChanges`, `fanoutBatchExecutorCli` và vòng loop.
3. Test đỏ:
   - Loop chạy 1 item với worker giả: có `unit.json`, runner commit, event có `unitRunId`.
   - Worker tự `git add`: `worktree-fail` (bị preflight chặn trước spawn, như 02).
   - Worker không đổi gì: `none` rồi `verify-miss`.
   - Hết hạn mức: đi nhánh phục hồi `provider-limit`.
   - Feedback gate nằm trong objective.
   - Fanout với fixture: có `fired[0].unitRunId`, item về đúng trạng thái.
4. Code cho xanh. Toàn bộ test loop cũ phải xanh mà không nới test nào.
5. `npm test`. Báo cáo có Spec delta và CHANGELOG delta.

## Đòn red-team (sàn)

1. Crash giữa lượt rồi resume: loop có tìm lại `unitRunId` không? Nếu không, ghi residual và cách gỡ.
2. Hai item chạy song song: khoá per-cwd, worker slot.
3. **`reapOrphanedConfinementResources`** chạy ở mỗi runUnit (`run.mjs:158`) có dọn nhầm home riêng của worker khác đang chạy không? (R-M7)
4. **Transport herdr không có `stdout.log`.** `lastWorkerOutput` lấy từ đâu? (R-M7)
5. **SIGKILL runner.** Khoá cwd của worktree item treo tới TTL. Lượt sau bị từ chối "already in flight"; cách gỡ có được ghi không? (R-M7)
6. Executor của item bị governance chặn: prefer mềm rơi sang capability, event ghi đúng executor thật.
7. Worker ghi ra main checkout: warning của lane D vẫn tới loop log.
8. `verifiedSha` so với commit của runner (0052).
9. Fanout: ứng viên in-process, slot đầy, `pick` lỗi, runUnit throw. Item không được kẹt ở `doing`.

## Rủi ro + rollback

- Đổi đường chạy của mọi Work item tự động. Nếu có item an toàn thì chạy thử một item thật trên `WTP`. Nếu không thì ghi UNPROVEN.
- Rollback: revert commit của lane.

## Xong khi

- Ca bước 3 xanh; test cũ xanh.
- `rg -n "executeThroughConfinement|commitUnitWork|executeExecutorCli" src/runner/loop.mjs src/runner/work-dispatch.mjs src/runner/fanout-batch.mjs` ra 0.
- `npm test` exit 0.
- Red-team sạch.
