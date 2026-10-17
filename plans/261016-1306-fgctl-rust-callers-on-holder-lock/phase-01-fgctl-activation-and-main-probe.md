# Phase 01: `fgctl` — activation lock và phép kiểm main checkout qua crate

Wave 1. Nhánh `rust-callers/p01-fgctl`, worktree `.claude/worktrees/rc-p01`. Phụ thuộc: P00. Song song với P02, P03, P04.

## Đọc trước

- r6 §6.0 (`acquire`/`probe`), §6.1.1 điểm 1, 6, 8 (CLOEXEC, kiểm inode, close-only), §6.8 dòng `fgctl`.
- Plan 4.2 [phase 02](../261016-1104-holder-lock-kernel-lock-foundation/phase-02-holder-lock-crate-and-internal-routes.md) (API crate) và [phase 05](../261016-1104-holder-lock-kernel-lock-foundation/phase-05-fgctl-activate-gate.md) (cổng activate đã nằm trong `init.rs` trước `publish_activation_file`; phase này không đụng cổng đó).
- Source: [`init.rs:140-287`](../../packages/distribution/rust/src/init.rs) (`InitError`, `ActivationLockGuard`), [`lock.rs`](../../packages/distribution/rust/src/lock.rs) (toàn file, 432 dòng).

## Yêu cầu

**Activation lock.** `ActivationLockGuard::acquire(installation_dir)` đổi chữ ký thành nhận `workspace_root` (đường v3 là `<fgosDir>/locks/activation.lock`, không còn dưới `installation/`), thân = `fgos_holder_lock::acquire(registry "activation", Ex, Try)`:
- `Acquired(handle)` → guard giữ `handle`; `Drop` đóng description (không `LOCK_UN`, D6).
- `Held{..}` (gồm `predecessor-domain-not-empty`) → `InitError::ActivationLockHeld` (giữ tên); thông điệp kèm `reason`.
- `Unavailable` → biến thể mới `InitError::LockDriverUnavailable { lock, note }` (`lock-driver-unavailable`, D5).
- Xoá: `try_create`, `is_stale_content`, nội dung `{pid, ts}`, nhánh reclaim theo TTL ([`init.rs:186-232`, `:234-281`](../../packages/distribution/rust/src/init.rs)). `cleanup_stale_activation_tmp_files` giữ nguyên (dọn file tạm của publish, không phải lock).
- Cập nhật đủ 11 chỗ gọi (grep `ActivationLockGuard::acquire(`): [`init.rs:806`, `:848`, `:887`, `:947`, `:1313`, `:1380`, `:1548`, `:1591`, `:1676`](../../packages/distribution/rust/src/init.rs) cộng `PublishArgs::_lock` (`:1008`, `:1024`). Executor grep lại; số khác thì ghi lại.

**Phép kiểm main checkout** (`check_main_checkout_lock`, Lead D2). Thân mới theo thứ tự:
1. `fgos_holder_lock::probe(registry "main-checkout")` trên `<fgosDir>/locks/main-checkout.lock`: `Held` → `MainCheckoutLockError::HeldV3` (biến thể mới, `lock-held: main checkout is held (kernel lock)`); `Free` → tiếp.
2. Đường v1, chỉ đọc như hôm nay, thêm **một** nhánh trước `protocol_marker_is_supported`: `.fgos/main-checkout.lock` là thư mục → `Ok(())` (họ main đã sang v3, bước 1 đã trả lời). File → luật cũ không đổi ([`lock.rs:209-257`](../../packages/distribution/rust/src/lock.rs)).
- Không xoá luật v1 ở phase này (4.3 P08 xoá cùng cutover họ main). Ghi comment đầu file: đường v1 tồn tại tới khi họ main checkout sang v3, kèm tên plan 4.3 không có mã phase (luật Stable Code Artifacts: comment nói bất biến, không nói mã plan) → viết: "the v1 read stays only while Node writers of the main checkout still use the v1 file".
- 7 chỗ gọi giữ nguyên (`init.rs:805`, `:847`, `:886`, `:941`, `:1312`, `:1366`, `:1577`).

**Thứ tự (D3).** Không lồng `install` trong `activation`: thêm `debug_assert`/test trace rằng `stage_release` trả về (nhả `install`) trước mọi `ActivationLockGuard::acquire`.

## File sở hữu

| Hành động | File |
|---|---|
| sửa | `packages/distribution/rust/src/init.rs`, `packages/distribution/rust/src/lock.rs` |
| sửa | `packages/distribution/rust/Cargo.toml` (dep `fgos-holder-lock`, nếu 4.2 P02 chưa thêm cho crate này) |
| sửa | `test/rust-host/fgctl-init-activation.test.mjs` (ca `activation.lock` mồ côi ở [`:227-290`](../../test/rust-host/fgctl-init-activation.test.mjs) viết lại theo kernel lock), `test/rust-host/fgctl-init-preflight-tail.test.mjs` ([`:137`](../../test/rust-host/fgctl-init-preflight-tail.test.mjs) ghi file JSON giả làm holder → thay bằng process con giữ kernel lock thật), `test/rust-host/fgctl-init.test.mjs` (ca main-checkout v1 [`:170-275`](../../test/rust-host/fgctl-init.test.mjs) giữ; thêm ca v3 + tombstone) |
| tạo | `packages/distribution/rust/tests/activation_lock_multiprocess.rs` |

## Test

Cargo, process thật (test binary tự re-exec làm con):
1. Con giữ activation (EX) → cha `ActivationLockGuard::acquire` → `ActivationLockHeld`; con SIGKILL → cha giữ được ngay (đo thời gian, < 50 ms; không có cửa sổ 180 s).
2. Con giữ activation, cha gọi `fgctl init` thật qua binary → exit khác 0, `activation-lock-held`, không file nào trong `installation/` đổi.
3. Rò: trong khi giữ activation, `run_tail` spawn một con; quét `/proc/<con>/fd` không có inode lock (r6 §6.1.1 điểm 4).
4. Main checkout v3: process Node giữ `main-checkout` qua facade 4.2 (`acquireSync`) → `fgctl init` từ chối `lock-held` (một writer Node + một writer Rust cùng file, r6 §11/4.4); Node nhả → qua.
5. Tombstone: `.fgos/main-checkout.lock` là thư mục có `TOMBSTONE`, không ai giữ v3 → `fgctl init` qua. File v1 sống (pid sống, trong TTL) → vẫn từ chối như hôm nay.
6. Windows: `cargo check --target x86_64-pc-windows-msvc`; nhánh `Unavailable` có unit test trên `cfg(windows)` hoặc qua driver trả `Unavailable` của crate (không giả lập trên Linux nếu crate không cho chọn driver — khi đó ghi "đo ở 4.4b").
7. Trace thứ tự D3: test `init --from` ghi thứ tự acquire/release (log debug của crate) → `install` nhả trước `activation`.

Lệnh: `cargo test -p fgos-distribution -p fgctl`; `env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID FGOS_HOST_BIN=<build> node --test test/rust-host/fgctl-init*.test.mjs test/rust-host/fgctl-upgrade.test.mjs`.

## Tiêu chí nghiệm thu

- 7 nhóm test xanh; `rg 'is_stale_content|try_create|DEFAULT_TTL_MS' packages/distribution/rust/src/init.rs` rỗng.
- `rg 'ActivationLockGuard::acquire\(' packages/distribution/rust/src` = đúng số chỗ đã liệt kê, mọi chỗ truyền `workspace_root`.

## Rủi ro / rollback

- Đường dẫn activation lock đổi (`installation/` → `locks/`): một `fgctl` cũ và một `fgctl` mới chạy cùng lúc sẽ không thấy nhau. Chặn bằng tombstone ở đường cũ (P05) + cài đè `fgctl` (dừng-toàn-bộ).
- Rollback: revert phase.
