# Phase 01: Ctrl-C của controller gửi `cancel` cho supervisor

Wave 1. Nhánh `controller-death/p01-cancel-signal`, worktree `.claude/worktrees/cd-p01`. Phụ thuộc: P00. Chủ `assignment-runner.mjs` trong plan này.

## Đọc trước

r6 §16; plan.md D1; T8 §3 (controller không bắt signal); 6.2 P04 điểm 5 (supervisor đọc `cancel-requested.json` mỗi vòng).

## Yêu cầu

1. `src/run-supervisor/cancel-registry.mjs`: sổ attempt đang giao trong process (`register(runDir)`, `unregister`); `installCancelOnSignal({cancelWaitMs})`: lần đầu SIGINT/SIGTERM → ghi `cancel-requested.json` (link một lần) cho mọi run trong sổ → chờ receipt từng run (poll file, ≤ `cancelWaitMs`) → in một dòng `unit <id> chờ resume: fgos run --resume <id>` (stderr) → `process.exit(130|143)`; lần hai → `process.exit` ngay.
2. `assignment-runner.mjs`: đăng ký run vào sổ ngay khi thấy `supervisor-binding.json` (6.2 bước chờ binding), gỡ khi đọc xong `result.json`. Trước binding, Ctrl-C: controller đang giữ lock attempt nên chết là đủ (adopt `abandoned-not-started`), không ghi cancel.
3. Không đổi hành vi khi controller chết bất thường (SIGKILL): attempt chạy tiếp (r6 §16).
4. Nối `installCancelOnSignal` vào `runUnit` là việc của P02 (chủ `run.mjs`).

## File sở hữu

| Hành động | File |
|---|---|
| tạo | `src/run-supervisor/cancel-registry.mjs`, `test/run-supervisor/cancel-registry.test.mjs` |
| sửa | `src/runner/dispatch/assignment-runner.mjs` (đăng ký/gỡ quanh đoạn chờ binding/kết quả) |

## Test

1. Process con dùng registry + supervisor thật (fixture `noisy-agent.mjs`): SIGINT → `cancel-requested.json` có, receipt `cancelled`, exit 130 trong hạn.
2. SIGINT hai lần trong 100 ms → exit ngay; attempt vẫn kết thúc `cancelled` (supervisor đã thấy file).
3. SIGTERM → 143.
4. SIGINT trước binding → không file cancel; adopt sau đó `abandoned-not-started`.

Lệnh: `env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID FGOS_HOST_BIN=<build> node --test test/run-supervisor/cancel-registry.test.mjs`.

## Tiêu chí nghiệm thu / rollback

Bốn ca xanh. Rollback: revert (P02 bỏ dòng nối).
