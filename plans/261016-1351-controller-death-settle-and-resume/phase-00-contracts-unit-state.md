# Phase 00: contract trạng thái unit/attempt, mã thoát, khoá cấu hình

Wave 0, Lead. Nhánh `controller-death/p00-contracts`, worktree `.claude/worktrees/cd-p00`, từ main sau khi 6.3 land.

## File sở hữu

| Hành động | File |
|---|---|
| tạo | `packages/run-supervisor/contracts/unit-state.v1.json` — `unitState: running \| awaiting-resume \| completed \| failed`; `attemptState: running \| being-adopted \| closed \| legacy-run \| abandoned-not-started`; quy tắc: `awaiting-resume` ⇔ attempt cuối `closed` và `unit-summary.json` chưa có và không có controller sống (controller ghi `controller.json {tuple}` lúc bắt đầu; `judge` dead) |
| sửa | `packages/run-supervisor/contracts/cancel-requested.v1.json` (6.2) — kiểm đủ `{requestedAt, by: "signal:SIGINT"\|"signal:SIGTERM"\|"recover", requester tuple}`; chỉ bổ sung trường nếu thiếu |
| tạo | `packages/run-supervisor/contracts/recover-actions.v1.json` — hành động mới `adopt` cho recommendation (cạnh `resume-driver`) |
| tạo | `test/run-supervisor/contracts-unit-state.test.mjs` |

Khoá cấu hình `dispatch.cancelWaitMs` (mặc định `gateKillGraceMs + 5000`) ghi trong contract; P06 đăng ký setup/doctor.

## Tiêu chí nghiệm thu / rollback

Contract đủ cho P01–P05 độc lập; test xanh. Rollback: revert.
