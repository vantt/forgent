# Phase 03: `inspect`/`show-run` hiện `awaiting-resume`; `recover` qua adopt

Wave 1. Nhánh `controller-death/p03-inspect-recover`, worktree `.claude/worktrees/cd-p03`. Phụ thuộc: P00.

## Đọc trước

r6 §9.6 câu cuối, §9.7 điểm 7; T8 §4.4 (inspect `running/bound` mãi; recover park); plan.md D4; [`recovery-planner.mjs:36`, `:83-160`](../../src/runner/dispatch/recovery-planner.mjs); [`src/verbs/dispatch/recover.mjs`](../../src/verbs/dispatch/recover.mjs) (`recoverObserveUseCase`, `recoverApplyUseCase`, CAS `snapshotHash` + `controlEpoch`); [`runtime-inspection.mjs:261`](../../src/runner/dispatch/runtime-inspection.mjs); [`show-run.mjs:102`, `:151`](../../src/verbs/dispatch/show-run.mjs).

## Yêu cầu

1. `inspectDispatchRuntime`/`readRunSnapshot`: thêm `attemptState` (client 6.2 `adoptRun(runDir, {probeOnly: true})`, không ghi gì) và `unitState` theo contract P00. Attempt `closed` không còn hiện `running/bound`.
2. `recovery-planner.mjs`: outbox (`outbox/result-N.json`) và các file của hợp đồng v3 (receipt, `gate-exit`, receipt bước) là evidence có tên (`worker-result`, mới `attempt-receipt`), không còn `unknown`. Recommendation mới `adopt` khi run v3 chưa `closed` và lock trống; `running` khi lock giữ (không đề xuất gì). `resume-driver` chỉ còn cho `legacy-run`.
3. `recoverApplyUseCase` hành động `adopt`: giữ nguyên kiểm CAS (`snapshotHash`, `controlEpoch`, hết hạn) rồi gọi `adoptRun`; ghi `recovery-commands.jsonl` như hiện có. Thêm hành động `abandon-legacy` (cho P04): run `legacy-run` mà mọi tuple đã `dead` → settle `abandoned-legacy` qua cùng kiểm CAS; P04 gọi hành động này.
4. Thông điệp người đọc: `inspect` của unit `awaiting-resume` in lệnh `fgos run --resume <unitRunId>`.

## File sở hữu

| Hành động | File |
|---|---|
| sửa | `src/runner/dispatch/recovery-planner.mjs`, `src/runner/dispatch/runtime-inspection.mjs`, `src/verbs/dispatch/{recover.mjs,inspect.mjs,show-run.mjs}` |
| tạo | `test/run-supervisor/inspect-recover-adopt.test.mjs` |
| sửa | `test/runner/dispatch-recovery*.test.mjs`, `test/verbs/dispatch-*.test.mjs` (kỳ vọng park vì `result-1.json` đổi thành `adopt`) |

## Test

1. Run herdr fixture có `outbox/result-1.json`, lock trống → recommendation `adopt` (không park); apply → `closed`, settle.
2. Run lock giữ → không recommendation hành động; `attemptState: running`.
3. CAS: snapshot đổi giữa observe và apply → `plan-stale` như hôm nay.
4. `inspect` unit có attempt `closed`, không `unit-summary.json`, controller dead → `awaiting-resume` + lệnh.
5. Run cũ → `legacy-run`, recommendation như hôm nay.

Lệnh: `env -u … FGOS_HOST_BIN=<build> node --test test/run-supervisor/inspect-recover-adopt.test.mjs test/runner/dispatch-recovery*.test.mjs test/verbs/dispatch-*.test.mjs`.

## Tiêu chí nghiệm thu / rollback

Năm ca xanh. Rollback: revert.
