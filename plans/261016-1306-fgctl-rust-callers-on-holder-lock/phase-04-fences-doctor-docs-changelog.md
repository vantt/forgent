# Phase 04: biến `stateRoot` của registry, test hàng rào, docs, CHANGELOG

Wave 1. Nhánh `rust-callers/p04-fences-docs`, worktree `.claude/worktrees/rc-p04`. Docs bắt đầu ngay sau P00; test hàng rào chạy sau khi P01–P03 vào nhánh tích hợp (rebase). Chủ duy nhất của docs và `CHANGELOG.md` trong plan này.

## Cổng cài đặt (AGENTS.md)

- Config default mới: **không**. Env mới: **không**. Thư mục mới: `<fgosDir>/locks` và `<lockRoot>` đã do `fgos setup` của 4.2 tạo (4.2 P11). File cũ bỏ: ba đường v1 (thành tombstone).
- Check doctor mới: **không**. `lock-holders`, `lock-fences`, `lock-kernel-semantics` của 4.2 đi theo registry nên tự phủ ba dòng mới; phase này **test** điều đó, không thêm check.
- Người dùng thấy: có → CHANGELOG.

## Yêu cầu

1. `src/holder-lock/registry.mjs` (4.2 P03): giải biến `<stateRoot>` (= cha của `lockRoot`; lấy từ `state-root.mjs` của 4.2, không tự tính). Nếu P00 dùng lại biến có sẵn thì bỏ bước này.
2. `src/holder-lock/fences.mjs` (4.2 P04): không đổi logic; chỉ kiểm rằng `placeFences` đi qua dòng `install` phạm vi máy (đường dưới `stateRoot`, ngoài `fgosDir`). Nếu `placeFences` chỉ duyệt lock phạm vi repo thì thêm nhánh `scope: machine` → đặt dưới `stateRoot`, một lần cho máy (idempotent khi chạy ở workspace thứ hai).
3. Docs:
   - [`docs/specs/observe.md`](../../docs/specs/observe.md) dòng 16 và 39: store lock là kernel lock `<fgosDir>/locks/observe.lock` qua holder-lock, chờ 5 s, không TTL; snapshot ghi dưới lock.
   - [`docs/platform/packaging-distribution/contracts/repository-runtime-layout.md:71`](../../docs/platform/packaging-distribution/contracts/repository-runtime-layout.md) và [`docs/architect/packaging-distribution/runtime-identity-and-activation.md`](../../docs/architect/packaging-distribution/runtime-identity-and-activation.md) dòng 173, 468, 1030: `install.lock` nằm ở `<stateRoot>/locks/install.lock`, kernel lock, holder chết thì nhả.
   - `docs/specs/distribution.md`: đoạn activation (grep `activation`): activation lock là kernel lock dưới `.fgos/locks/`; `fgctl` hỏi main checkout bằng `probe`; Windows `lock-driver-unavailable` tới 4.4b.
   - `docs/platform/holder-lock/spec.md` (4.2 P11): bảng registry thêm ba dòng; mục "Lịch sử quyết định" thêm 4.4a (D1–D6 của plan này).
4. `CHANGELOG.md` `## [Unreleased]`:
   - Changed: `fgctl` activation lock, `install.lock` và observe store lock dùng kernel lock của holder-lock; holder bị kill thì lock nhả ngay (không còn chờ 3 phút / 30 giây, không còn `install.lock` kẹt phải xoá tay).
   - Changed: đường lock mới `.fgos/locks/activation.lock`, `.fgos/locks/observe.lock`, `<state>/locks/install.lock`; đường cũ thành thư mục tombstone, `fgctl` hoặc `fgos` bản trước gặp nó sẽ dừng với lỗi.
   - Changed: Windows: `fgctl init/upgrade/repair` báo `lock-driver-unavailable` cho tới driver Windows.

## File sở hữu

| Hành động | File |
|---|---|
| sửa | `src/holder-lock/registry.mjs`, `src/holder-lock/fences.mjs` (chỉ khi bước 1–2 cần) |
| tạo | `test/holder-lock/fences-rust-locks.test.mjs` |
| sửa | `docs/specs/observe.md`, `docs/specs/distribution.md`, `docs/platform/holder-lock/spec.md`, `docs/platform/packaging-distribution/contracts/repository-runtime-layout.md`, `docs/architect/packaging-distribution/runtime-identity-and-activation.md`, `CHANGELOG.md` |

## Test (`fences-rust-locks.test.mjs`, với binary build từ nhánh tích hợp)

1. `placeFences` trên workspace tạm + `FGOS_STATE_HOME` tạm: ba đường v1 thành thư mục có `TOMBSTONE`; chạy lần hai không lỗi.
2. File v1 đang có (ví dụ `.fgos/observe/.lock` có nội dung) → `v1-lock-present`, không đặt rào đường đó.
3. Sau hàng rào, binary **mới** (`fgctl init`, `fgos observe case …`) chạy bình thường.
4. `fgos doctor --json`: `lock-fences` liệt kê `activation`, `install`, `observe`; `lock-holders` thấy một process `flock` (util-linux) giữ `observe.lock` → warn kèm pid.

Code v1 của ba lock là Rust, đã biên dịch trong binary trước landing; test v1 thật nằm ở P05 (chạy binary trước landing trên workspace tạm), không mô phỏng trong Node.

Lệnh: `env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID FGOS_HOST_BIN=<build> node --test test/holder-lock/fences-rust-locks.test.mjs test/holder-lock/registry-contract.test.mjs`; `fgos convention check` trên doc đã sửa.

## Tiêu chí nghiệm thu / rollback

Bốn test xanh; docs khớp code (đường dẫn, chờ 5 s, mã lỗi). Rollback: revert.
