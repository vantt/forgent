# Phase 05: route `fgos internal terminal-control` + client Node

Wave 2. Nhánh `terminal-control/p05-route-client`, worktree `.claude/worktrees/tc-p05`. Phụ thuộc: P02, P03, P04 đã vào nhánh tích hợp.

## Đọc trước

r6 §7.6 (hàng promise theo `groupKey` trong process điều phối), §7.10, §9.10 (route nội bộ cùng release, `host-version-mismatch`); route `internal` của 4.2 P02 trong [`apps/fgos/src/main.rs`](../../apps/fgos/src/main.rs) (nhánh sớm nhất của `main()`); [S6](../reports/spike-s6-261015-1638-rust-identity-call-latency-pre-commit-hook.md) (gọi thẳng binary ~3,3 ms; resolve `FGOS_HOST_BIN` một lần mỗi process).

## Yêu cầu

- `main.rs`: `internal terminal-control <op> --protocol 1 --json` trong nhánh `internal`; đọc request từ stdin, gọi core, in một dòng JSON; không có trong help/`command-routes.json`.
- `src/terminal-control/client.mjs`: `createTerminalControl({hostBin = resolveActiveHostBin(), herdrBin, env})` → hàm cho mỗi op, gọi `spawnSync(hostBin, ['internal','terminal-control',op,'--protocol','1','--json'], {input})`; lỗi route → ném có tên; kết quả `unsupported`/`unknown` trả nguyên (không đoán). Hàng promise theo `groupKey` cho `allocate` và `release(close)` (r6 §7.6): bản async của hai op chờ lời gọi trước cùng nhóm xong.
- Không logic quyết định nào trong client (D3).
- Đo: p50/p95 của `read` qua route (route + herdr) 200 lần trên fake herdr và herdr thật; ghi báo cáo.

## File sở hữu

| Hành động | File |
|---|---|
| sửa | `apps/fgos/src/main.rs`, `apps/fgos/Cargo.toml` (dep `fgos-terminal-control`) |
| tạo | `packages/terminal-control/rust/src/route.rs` |
| tạo | `src/terminal-control/client.mjs`, `test/terminal-control/client-route.test.mjs`, `test/terminal-control/group-queue.test.mjs` |
| sửa | `test/rust-host/internal-routes.test.mjs` (4.2: thêm route mới, không có trong help) |

## Test

1. Mỗi op qua binary thật + fake herdr → kết quả đúng contract.
2. `--protocol 2` → exit 4 `host-version-mismatch`.
3. Hàng theo nhóm: 5 `allocate` + 2 `release(close)` đồng thời cùng nhóm → log fake herdr cho thấy tuần tự, không tách trên pane đang bị đóng.
4. `fgos help` không có `internal`.

Lệnh: `cargo test -p fgos`; `env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID FGOS_HOST_BIN=<build> node --test test/terminal-control/*.test.mjs test/rust-host/internal-routes.test.mjs test/rust-host/help-routes.test.mjs`.

## Tiêu chí nghiệm thu / rollback

Bốn test xanh; số đo latency trong báo cáo. Rollback: revert (chưa caller production).
