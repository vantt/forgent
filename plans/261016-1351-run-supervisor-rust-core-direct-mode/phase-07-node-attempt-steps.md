# Phase 07: bước Node `settle-attempt` và `finalize-home`

Wave 1. Nhánh `run-supervisor/p07-attempt-steps`, worktree `.claude/worktrees/rs-p07`. Phụ thuộc: P00. Chủ `confinement/authority.mjs` ở wave 1.

## Đọc trước

r6 §9.6 (bước 1, 2; đổi hợp đồng finalize), §9.7 dòng "Receipt có, run control `settled`, `result.json` chưa" và "Receipt có, chưa settle"; [`settlement.mjs:411-480`](../../src/runner/dispatch/settlement.mjs) `commitRunSettlement`, [`:506`](../../src/runner/dispatch/settlement.mjs) `settleRunOutcome`; [`authority.mjs:1784-1891`](../../src/runner/dispatch/confinement/authority.mjs) `finalizeConfinementResources` (hôm nay chỉ dọn `exited`/`spawn-failed`, còn lại `retained`); [`provider-credential-renewal.mjs:1140-1200`](../../src/runner/dispatch/provider-credential-renewal.mjs) (`credentialWriteBack`).

## Yêu cầu

1. `src/run-supervisor/attempt-step.mjs` (entry do route `attempt-step` exec; không qua `bin/fgos.mjs`): đọc `<stepId>`, `--run-dir`; đọc envelope v3 + side file; gọi một hàm theo `stepId`; mã thoát: 0 xong, 75 thử lại sau, khác = lỗi.
2. `settle-attempt`: dựng kết quả thô từ receipt (`outcome`, `gateExit`, đuôi capture, outbox) → `settleRunOutcome` hiện có (Run Result Evaluator, `exit.json`, `evidence.json`, `result.json`) với `controlEpoch/controlToken` của side file. `commitRunSettlement` đã có `alreadySettledByUs` ([`settlement.mjs:425`](../../src/runner/dispatch/settlement.mjs)) → chạy lại sau khi đã settle hoàn tất publish, không acquire epoch mới. Side file mất → chỉ acquire epoch mới khi holder ghi của run control đã `dead` theo `judge`; không thì mã 75. Outbox có kết quả → settle từ outbox bất kể `stoppedBy`.
3. `finalize-home`: hàm mới `finalizeAttemptHome({runDir, attemptId})` trong `authority.mjs`: được gọi chỉ từ bước (supervisor/adopt đang giữ lock attempt và miền đã rỗng) → trả credential (`credentialWriteBack`) rồi dọn home với **mọi** kiểu kết thúc; credential chưa trả được → giữ home, ghi `credential-home-kept`, mã 75. Marker home bản 2 phải có đúng `attemptId`; lệch → lỗi, không xoá.
4. Đường `finalizeConfinementResources` cũ (gọi từ `finally` của `executeAssignment`, [`assignment-runner.mjs:2786-2790`](../../src/runner/dispatch/assignment-runner.mjs)) vẫn còn cho tới P09 xoá caller; P07 không xoá nó (P09 xoá cùng caller).

## File sở hữu

| Hành động | File |
|---|---|
| tạo | `src/run-supervisor/attempt-step.mjs`, `src/run-supervisor/steps/{settle-attempt.mjs,finalize-home.mjs}` |
| sửa | `src/runner/dispatch/confinement/authority.mjs` (thêm `finalizeAttemptHome`) |
| tạo | `test/run-supervisor/attempt-steps.test.mjs` |

## Test

1. `settle-attempt` trên run dir fixture có receipt `exited` + outbox → `result.json` pass; chạy lần hai → mã 0, không ghi đè, không epoch mới.
2. Receipt `gate-lost` + outbox có kết quả → settle từ outbox.
3. Run control `settled` nhưng `result.json` chưa (crash giữa) → hoàn tất qua `alreadySettledByUs`.
4. `finalize-home` với receipt `timeout` → home dọn (hôm nay sẽ `retained`); credential write-back được gọi với đúng account; lỗi write-back → mã 75, home còn.
5. Marker home khác `attemptId` → lỗi, home còn.

Lệnh: `env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID node --test test/run-supervisor/attempt-steps.test.mjs test/runner/dispatch-confinement-authority.test.mjs test/runner/dispatch-confinement-credential-hygiene.test.mjs`.

## Tiêu chí nghiệm thu / rollback

Năm ca xanh; test confinement hiện có xanh. Rollback: revert (chưa caller).
