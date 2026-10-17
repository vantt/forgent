# Phase 02: `install.lock` phạm vi máy qua crate

Wave 1. Nhánh `rust-callers/p02-install`, worktree `.claude/worktrees/rc-p02`. Phụ thuộc: P00. Song song với P01, P03, P04.

## Đọc trước

- r6 §6.2 (`install` = `mutex` máy, hạng 80), §6.9 (`lockRoot = stateRoot/locks`; `resolve_machine_release_store_root` gọi `state_root()` của crate từ 4.2 P02).
- Source: [`store.rs:16-57`](../../packages/distribution/rust/src/store.rs) (`LockError`, `InstallLockGuard`), [`store.rs:153`](../../packages/distribution/rust/src/store.rs) (`stage_release` acquire), test trong file [`store.rs:335-350`](../../packages/distribution/rust/src/store.rs).
- Lỗi đang có ([kiểm kê §2.3](../reports/research-261015-1731-lock-inventory-and-standardization.md)): file rỗng, không dọn; SIGKILL giữa stage → kẹt mãi, phải xoá tay.

## Yêu cầu

- `InstallLockGuard::acquire(store_root)` → `fgos_holder_lock::acquire(registry "install", Ex, Try)` trên `<lockRoot>/install.lock`. `store_root` của caller chính là `stateRoot` (cùng công thức, 4.2 P02), nên `lockRoot` lấy từ crate, không ghép tay.
- `Held` → `LockError::AlreadyInProgress` (giữ tên, D6). `Unavailable` → biến thể mới `LockError::DriverUnavailable` (`lock-driver-unavailable`, D5).
- `Drop` đóng description. Xoá `create_new` + `remove_file`.
- `stage_release` không đổi luồng.

## File sở hữu

| Hành động | File |
|---|---|
| sửa | `packages/distribution/rust/src/store.rs` (chỉ `LockError`, `InstallLockGuard`, test trong file) |
| sửa | `test/rust-host/fgctl-stage.test.mjs` ([`:194-198`](../../test/rust-host/fgctl-stage.test.mjs): "install.lock is gone afterward" → khẳng định lock trống bằng `probe` qua route `fgos internal lock-fd --shared-try` của 4.2, không bằng sự vắng mặt của file), `test/rust-host/fgctl-init-activation.test.mjs` **chỉ** ca [`:12-40`](../../test/rust-host/fgctl-init-activation.test.mjs) (chặn `install.lock` bằng process giữ kernel lock thật thay cho file) |
| tạo | `packages/distribution/rust/tests/install_lock_multiprocess.rs` |

Ghi chú sở hữu: `fgctl-init-activation.test.mjs` được P01 sửa ở ca `:227-290`; P02 chỉ sửa ca `:12-40`. Hai hunk rời nhau; nếu git báo xung đột khi merge thì Lead giải bằng tay (cả hai phase đều là chủ một hunk), không phải vi phạm sở hữu.

## Test

1. Con giữ `install` → cha `stage_release` → `AlreadyInProgress`; con SIGKILL → cha stage được ngay (ca kẹt-mãi hôm nay biến mất).
2. Hai `fgctl stage` thật song song trên cùng `FGOS_STATE_HOME` tạm → đúng một stage, một `AlreadyInProgress`, `releases/` có đúng một bản.
3. `FGOS_STATE_HOME`, `XDG_STATE_HOME`, `HOME` (vector state root 4.2) → lock nằm đúng `<stateRoot>/locks/install.lock`.

Lệnh: `cargo test -p fgos-distribution`; `env -u ... FGOS_HOST_BIN=<build> node --test test/rust-host/fgctl-stage.test.mjs test/rust-host/fgctl-init-activation.test.mjs`.

## Tiêu chí nghiệm thu / rollback

Ba test xanh; `rg 'create_new' packages/distribution/rust/src/store.rs` không còn chỗ dùng cho lock. Rollback: revert.
