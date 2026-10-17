# Phase 08: `fgctl` — xoá đường đọc v1 `main-checkout.lock`

Wave 2. Nhánh `main-door/p08-fgctl-v1`, worktree `.claude/worktrees/md-p08`, tạo từ main **sau khi 4.4a đã land** (rebase nhánh tích hợp lên đó trước). Phụ thuộc: 4.4a P01 (đường `probe` v3 + nhánh tombstone đã có).

## Đọc trước

- Plan 4.4a [phase 01](../261016-1306-fgctl-rust-callers-on-holder-lock/phase-01-fgctl-activation-and-main-probe.md) (Lead D2 của 4.4a: đường v1 chỉ sống tới cutover họ main).
- [`lock.rs`](../../packages/distribution/rust/src/lock.rs): luật v1 (`:1-257`: `LockRecord`, `parse_lock_content`, `is_pid_alive` ba bản theo OS, `protocol_marker_is_supported`, `is_unsupported_schema`, TTL), test trong file.

## Yêu cầu

- `check_main_checkout_lock` chỉ còn `probe(main-checkout)` v3. Xoá mọi phần v1 ở trên, nhánh tombstone của 4.4a, các biến thể lỗi `Ambiguous`, `Unsupported`, `HeldNumeric`, `HeldString`. Nếu `lock.rs` chỉ còn một hàm thì gộp vào `init.rs` hoặc giữ file nhỏ (executor chọn, ghi lý do).
- `lib.rs:19` `pub use lock::*;`: kiểm không còn caller ngoài crate dùng symbol đã xoá (grep `apps/ packages/`).

## File sở hữu

| Hành động | File |
|---|---|
| sửa | `packages/distribution/rust/src/lock.rs`, `packages/distribution/rust/src/lib.rs` (nếu cần) |
| sửa | `test/rust-host/fgctl-init.test.mjs` (ca v1 `:170-275` xoá; ca v3 giữ) |

## Test

`cargo test -p fgos-distribution -p fgctl`; `node --test test/rust-host/fgctl-init*.test.mjs`: Node giữ main v3 → `fgctl init` từ chối; tombstone ở đường v1 → không ảnh hưởng.

## Tiêu chí nghiệm thu / rollback

`rg 'read_to_string|DEFAULT_TTL_MS|protocol_marker' packages/distribution/rust/src/lock.rs` rỗng. Rollback: revert (đường v1 của 4.4a quay lại).
