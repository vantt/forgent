# Phase 00: ba dòng registry cho activation, install, observe

Wave 0, Lead hoặc một executor. Nhánh `rust-callers/p00-registry`, worktree `.claude/worktrees/rc-p00`, từ main sau khi 4.2 land. Mục đích: chốt đường dẫn v3/v1 và hàng rào của ba lock để P01–P04 code song song không sửa chung file.

## Đọc trước

- r6 §6.2 (kind/hạng), §6.8 (bảng hình dạng), §6.9 (state root).
- [Phase 00 của 4.2](../261016-1104-holder-lock-kernel-lock-foundation/phase-00-contracts-and-registry.md): schema registry, trường `name/kind/scope/rank/v3Path/v1Shape/v1Path/fence/owner`, dòng gộp "activation, install, observe … theo 4.4".
- Prior art đã kiểm (`git whatchanged -S`): `ActivationLockGuard` vào ở `fbecde3a5` (P12 review: activation lock, lock TTL), sửa reclaim `3ac50db7d`; `InstallLockGuard` từ `1bb4feac5` (phase-11 fgctl, `create_new` không có dọn: SIGKILL kẹt mãi, [kiểm kê §2.3](../reports/research-261015-1731-lock-inventory-and-standardization.md)); `acquire_store_lock` từ `120af6b3d` (observe sang Rust, TTL mtime 30 s). Không bản nào từng dùng kernel lock rồi bị gỡ. Executor chạy lại `git whatchanged -S'flock' --oneline --no-patch -- packages/distribution packages/observe` và ghi kết quả vào báo cáo phase.

## File sở hữu

| Hành động | File |
|---|---|
| sửa | `packages/holder-lock/contracts/lock-registry.v1.json`: thay dòng gộp bằng 3 dòng (bảng dưới) |
| sửa | `test/holder-lock/registry-contract.test.mjs` (test của 4.2 P00): thêm khẳng định cho 3 dòng |

## Ba dòng

| name | kind | scope | rank | v3Path | v1Shape | v1Path (nguồn) | fence | owner |
|---|---|---|---|---|---|---|---|---|
| activation | mutex | repo | 80 | `<fgosDir>/locks/activation.lock` | `file-link` | `<fgosDir>/installation/activation.lock` ([`init.rs:176`](../../packages/distribution/rust/src/init.rs)) | tombstone | 4.4 |
| install | mutex | machine | 80 | `<lockRoot>/install.lock` | `file-wx` | `<stateRoot>/install.lock` ([`store.rs:31`](../../packages/distribution/rust/src/store.rs)) | tombstone | 4.4 |
| observe | mutex | repo | 80 | `<fgosDir>/locks/observe.lock` | `file-wx` | `<fgosDir>/observe/.lock` ([`store_lock.rs:145`](../../packages/observe/rust/src/store_lock.rs)) | tombstone | 4.4 |

Biến mẫu `<stateRoot>` mới cho `v1Path` của `install` (`lockRoot = stateRoot/locks`, r6 §6.9). Facade Node (`src/holder-lock/registry.mjs`, 4.2 P03) giải biến này ở P04; crate Rust giải ở P02. Nếu registry 4.2 đã có biến tương đương thì dùng lại, ghi tên vào báo cáo.

Hàng rào tombstone với code v1 thật (đã đọc source):
- activation: `hard_link` lên thư mục → `AlreadyExists`; `read_to_string(thư mục)` → `Err` → `InitError::Io` ([`init.rs:197-210`](../../packages/distribution/rust/src/init.rs)). Fail to tiếng.
- install: `create_new` lên thư mục → `AlreadyExists` → `AlreadyInProgress` ([`store.rs:36-48`](../../packages/distribution/rust/src/store.rs)). Fail to tiếng.
- observe: `create_new` → `AlreadyExists`; `read_to_string` lỗi → lặp tới 5 s → `observe-lock-timeout` ([`store_lock.rs:177-196`](../../packages/observe/rust/src/store_lock.rs)). Fail sau 5 s, có tên.

## Bước

1. Sửa registry + test; `node --test test/holder-lock/registry-contract.test.mjs`.
2. Lead merge vào `rust-callers/integration`, mở wave 1.

## Tiêu chí nghiệm thu / rollback

Test registry xanh: tên duy nhất, `rank` 80 cho cả ba, `fence` có mặt, `scope` khớp bảng. Rollback: revert (chưa caller nào đọc dòng mới).
