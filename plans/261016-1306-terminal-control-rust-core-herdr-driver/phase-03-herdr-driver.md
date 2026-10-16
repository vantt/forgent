# Phase 03: driver herdr

Wave 1. Nhánh `terminal-control/p03-herdr-driver`, worktree `.claude/worktrees/tc-p03`. Phụ thuộc: P00; phần incarnation chốt sau báo cáo P01.

## Đọc trước

r6 §7.2 (incarnation, `SO_PEERCRED`), §7.5 (bảng khả năng; lỗi driver → `unknown`, không bao giờ quy thành "đã đóng"); [`herdr-agent.mjs:91-430`](../../src/runner/dispatch/herdr-agent.mjs) (lệnh herdr đang dùng, timeout 15 s ở `agentRead`, xử lý body JSON/không JSON, mã `herdr_unavailable`, `herdr_call_timeout`); [`herdr-dashboard/src/layout.rs:183-190`, `:351-378`](../../herdr-dashboard/src/layout.rs) (gọi CLI, parse `pane layout`); fixture P01.

## Yêu cầu

- `driver/herdr.rs` cài `TerminalDriver` bằng `std::process::Command` gọi binary herdr: đường binary từ request (Node truyền `resolveHerdrBin()` = `FGOS_HERDR_BIN` hoặc `herdr`, [`transport.mjs:88`](../../src/runner/dispatch/transport.mjs)), env `HERDR_SESSION` khi có (round confined dùng session riêng, [`herdr-round.mjs:1752`](../../src/runner/dispatch/herdr-round.mjs)). Mỗi lệnh có timeout; ENOENT → `unsupported` (herdr vắng); timeout/không parse → `unknown`.
- `capabilities()`: probe một lần (`herdr --version` + có lệnh `pane layout`); thiếu herdr → rỗng. Windows (`cfg(windows)`) và máy không có herdr: rỗng → core trả `unsupported` cho mọi op.
- `layout.geometry`: parse `result.layout.area` + `panes[].rect` (cùng shape herdr-dashboard đã đọc).
- `server.incarnation` theo kết quả P01: Linux `SO_PEERCRED` trên socket herdr → pid → `start_time`/`boot_id`/`pid_ns` qua `fgos-process`; macOS `LOCAL_PEERCRED` (+ `boot_id` của 4.2); không lấy được → `unknown`.
- `pane.close` kiểm incarnation ngay trước và ngay sau (D1); lệch sau khi đã gọi → trả `unknown` và ghi vào record.
- Thao tác agent (`agent start/prompt/read/get/explain/send-keys`, `pane report-agent*`) là phần của khả năng `activity.state`/`send`/`read`/`label` (bảng P01 câu 5).
- Không giữ fd/socket nào sau khi lệnh xong; mọi `Command` mở với fd ≥ 3 đóng (luật 6.1.1 không áp vì không có lock, nhưng không để rò fd của caller).

## File sở hữu

| Hành động | File |
|---|---|
| tạo | `packages/terminal-control/rust/src/driver/{mod.rs,herdr.rs}`, `tests/{herdr_driver_fake.rs,herdr_driver_fixtures.rs}` |

## Test

1. Parse mọi fixture P01 (layout, list, process-info, split) → kiểu đúng.
2. Với fake herdr (`FGOS_HERDR_BIN` = fake): mỗi khả năng gọi đúng argv (log của fake); herdr vắng → `unsupported`; fake treo → `unknown` sau timeout.
3. Incarnation: socket Unix giả lập **thật** (test mở listener, driver connect, `SO_PEERCRED` trả pid của test) → tuple đúng; pid listener đổi giữa hai lần kiểm → `close` trả `unknown`.
4. `cargo check --target x86_64-pc-windows-msvc --target aarch64-apple-darwin`.
5. Trên herdr thật (chạy tay ở P09, `cargo test -- --ignored herdr_live`): tạo tab, tách, geometry, đóng; tab đo tự dọn.

## Tiêu chí nghiệm thu / rollback

Test 1–4 xanh trong `cargo test`; test 5 có trong báo cáo P09. Rollback: revert.
