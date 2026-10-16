# Phase 05: nửa launcher của identity (5.2)

Wave 1. Nhánh `terminal-mode/p05-identity-launcher`, worktree `.claude/worktrees/tm-p05`. Phụ thuộc: P00.

## Đọc trước

r6 §9.11; [S1](../reports/spike-s1-261015-1818-writer-id-consumer-inventory.md) mục 1, bảng 2.1 (#2 `transport.mjs`, #3 `authority.mjs`, #4 `workerBaseEnv`, #5 pane), E11 (chuỗi rỗng không xoá được id cha); plan 5.1 (O2 thứ tự env); [`adapters.mjs:99`](../../src/runner/dispatch/adapters.mjs) `workerBaseEnv`; [`authority.mjs:1408-1415`](../../src/runner/dispatch/confinement/authority.mjs); [`transport.mjs:553`](../../src/runner/dispatch/transport.mjs).

## Yêu cầu

1. Crate `fgos-session-identity`: `pub fn mint_attempt_writer_id(attempt_id: &str) -> String` theo vector P00; route `fgos internal identity mint-attempt --attempt <id> --protocol 1` (cho Node tính trước id con khi publish delegation, bản 2 §9.2).
2. Supervisor (cả hai cách): đặt `identity.writerId` vào env agent (`FGOS_SESSION_ID`, khác rỗng), `FGOS_PARENT_WRITER_ID` = writer id của controller (lấy từ envelope, Node resolve một lần trước lock), xoá `CLAUDE_CODE_SESSION_ID`, `CODEX_THREAD_ID`. Gate áp bằng `env_clear` (D5). Phần supervisor/gate sửa bởi P02/P03; P05 cung cấp hàm `apply_identity(env, identity)` trong crate run-supervisor? **Không** (P02/P03 chủ file đó): P05 cung cấp `fgos_session_identity::launcher::scrub_and_set(env, writer_id, parent)`; P02 gọi.
3. Node: `workerBaseEnv` bỏ `FGOS_SESSION_ID`, `CLAUDE_CODE_SESSION_ID`, `CODEX_THREAD_ID` (S1 #4); `authority.mjs:1415` và `transport.mjs:553` không còn đặt `FGOS_SESSION_ID` = id dispatcher — envelope mang `identity` do Node tính bằng route mint (cùng hàm, `envDigest` ổn định qua resume).
4. Delegation claim: điều phối tính trước id con bằng route mint và publish delegation trước khi giao attempt (chỗ publish delegation hiện có: executor grep `delegation` trong `src/state` và `src/runner`; nếu chưa có writer nào thì ghi rõ "không có caller", không tạo mới).

## File sở hữu

| Hành động | File |
|---|---|
| sửa | `packages/session-identity/rust/src/{lib.rs,launcher.rs (mới)}`, `packages/session-identity/rust/tests/attempt_writer_id.rs` (mới) |
| sửa | `apps/fgos/src/main.rs` (route `internal identity mint-attempt`) — **lưu ý chủ file:** 6.2 P04 là chủ `main.rs` trong plan 6.2 đã land; trong plan này P05 là chủ duy nhất của `main.rs` |
| sửa | `src/runner/dispatch/adapters.mjs` (`workerBaseEnv`), `src/session-identity/` facade Node của 5.1 (thêm `mintAttemptWriterId`) |
| tạo | `test/session-identity/attempt-writer-id.test.mjs` |

`authority.mjs` và `transport.mjs` (bỏ đặt `FGOS_SESSION_ID`) thuộc P06/P07: P05 ghi chính xác dòng cần xoá trong báo cáo, P06 (`transport.mjs`) và P07 (`authority.mjs`) xoá.

## Test

1. Vector mint Rust = Node.
2. `workerBaseEnv` với env cha có ba biến → kết quả không có biến nào.
3. `scrub_and_set`: `FGOS_SESSION_ID=""` ở cha không lọt (E11); id đặt khác rỗng.
4. Resume cùng attempt → cùng writer id, cùng `envDigest`.

Lệnh: `cargo test -p fgos-session-identity`; `FGOS_HOST_BIN=<build> node --test test/session-identity/*.test.mjs test/runner/adapters*.test.mjs`.

## Tiêu chí nghiệm thu / rollback

Bốn ca xanh. Rollback: revert.
