# Phase 03: supervisor cách `terminal` + bước `release-slot`

Wave 1. Nhánh `terminal-mode/p03-supervise`, worktree `.claude/worktrees/tm-p03`. Phụ thuộc: P00; nghiệm thu cần P02, P04. Chủ `supervise.rs`, `steps.rs`.

## Đọc trước

r6 §9.2 cột `terminal`, §9.6 bước 3, §7.3, §7.7 (dòng "herdr server khởi động lại", "Người đóng/di chuyển pane"); plan.md D1, D2, D3, D7; 6.5 P02 (`launch` trả identity gốc process trong pane, marker `launch-requested`/`launched`).

## Yêu cầu

1. Socket attempt: tạo dưới `resolveRuntimeSocketDir` (6.2 P08; phía Rust đọc cùng quy tắc), tên = băm attempt id (`sun_path` ≤ 100 byte), quyền 0600; xoá khi supervisor thoát.
2. Launch: dựng `launchSpec` = launcher script (prefix bwrap của envelope có `--die-with-parent` + `--bind` socket dir, chuỗi `exec` theo P01) → `terminal_control::launch(key, spec)` in-process. Kết quả `not-started`/`unknown` → receipt `abandoned-not-started` (không agent nào chạy vì gate chưa nhận GO). Chỉ gửi `GO` sau khi marker `launched` bền (r6 §7.2).
3. Nhận `HELLO` → kiểm uid → `declare_domain` (gate host tuple: 6.5 `launch` trả identity của gate là gốc process trong pane; nếu gốc là bwrap thì lấy `--info-fd` qua gate gửi trong `HELLO`) → `GO` + `SCM_RIGHTS`.
4. Agent-protocol `terminal` (P04): `AgentIo` nối `terminal_control::{send, read, inspect}` theo key; chờ `ready` → giao brief → `confirm` → `BRIEF_DELIVERED` tới gate. `blocked(...)`/`needs-human` → receipt có tên, dừng attempt (giữ pane bằng `retain`).
5. Canh: deadline mềm, idle (activity của herdr qua `inspect().activity` nếu driver có, không thì màn hình đổi), `inspect` mỗi vòng: `gone` hoặc incarnation lệch → `carrier-lost` (agent mất theo pty), không đóng gì.
6. `completed` → gửi `exitCommand` của adapter → chờ `gate-exit` (hạn ngắn) → không thoát → `stop-requested{cause: completed-no-exit}` + SIGTERM gate.
7. Step runner: bước `builtin: release-slot` gọi `terminal_control::release(key, close|retain(until))` theo kết quả (`retainFailedPaneMs` của 6.5); `kept-unknown` → không publish receipt bước (adopt thử lại).
8. Adopt (6.2 P06) dùng cùng `release-slot` built-in cho attempt `terminal`.

## File sở hữu

| Hành động | File |
|---|---|
| sửa | `packages/run-supervisor/rust/src/{supervise.rs,steps.rs}`, `packages/run-supervisor/rust/Cargo.toml` (dep `fgos-terminal-control`) |
| tạo | `packages/run-supervisor/rust/tests/{supervise_terminal_fake_herdr.rs,release_slot_step.rs}` |

## Test (fake herdr `test/helpers/fake-herdr-pane.mjs` qua `FGOS_HERDR_BIN`, như 6.5)

1. Vòng đời đủ: allocate (fixture) → launch → GO → brief → `completed` → exit → receipt → bước → `release(close)`; log fake herdr có đúng một `pane close` cho key, không `tab close`.
2. Thất bại → `release(retain)`, pane không đóng.
3. Fake herdr báo pane `gone` giữa chừng → `carrier-lost`.
4. `launch` trả `unknown` → không gửi GO; gate (nếu chạy muộn) gặp socket đã đóng → không chạy agent.
5. Supervisor SIGKILL sau `BRIEF_DELIVERED` → gate tiếp tục; adopt sau khi gate thoát chạy `release-slot`.

Lệnh: `cargo test -p fgos-run-supervisor supervise_terminal release_slot`.

## Tiêu chí nghiệm thu / rollback

Năm ca xanh. Rollback: revert.
