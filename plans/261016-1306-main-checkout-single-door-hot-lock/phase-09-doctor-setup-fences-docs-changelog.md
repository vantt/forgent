# Phase 09: doctor, setup, hàng rào, spec, component boundary, CHANGELOG

Wave 1–3. Nhánh `main-door/p09-doctor-docs`, worktree `.claude/worktrees/md-p09`. Docs bắt đầu sau P00; check gắn code sau P01–P03; merge lần hai sau P04. Chủ duy nhất của file dùng chung bên dưới.

## Cổng cài đặt (AGENTS.md)

- Config default mới: **không** (hạn chờ nóng giữ 5 s như hôm nay; không thêm khoá). Env mới: **không**; env bỏ: `FGOS_MAIN_LOCK_HOLDER_PID`; `FGOS_EVENTS_LOCK_TIMEOUT_MS` bỏ nếu P01 xác nhận không ai đọc. Thư mục: `<fgosDir>/locks` (đã có từ 4.2).
- Check doctor mới: `lock-record-unreadable`. Check đổi theo registry (không code mới): `lock-holders`, `lock-fences` phủ `main-checkout`, `merge-slot`, `state`, `porting-events`, `worktree-admin`.
- Người dùng thấy: có → CHANGELOG.

## Doctor (đăng ký trong `src/setup/registrations.mjs`)

| Check | Làm gì | Kết quả |
|---|---|---|
| `lock-record-unreadable` | Với `state` và `porting-events`: record nóng tồn tại mà không parse được, hoặc parse được nhưng `judge == unknown` quá 5 phút | warn kèm đường dẫn + gợi ý `fgos lock fence state`. Không có fix tự động (r6 §6.6: người xác nhận) |
| `lock-holders` (4.2) | Thêm: holder của main là con của một `runBorrowed` (git/hook) → thành viên, không phải lạ | — |
| `main-checkout-hook-wired` ([`registrations.mjs:1537`](../../src/setup/registrations.mjs)) | Đổi chữ mô tả (`:1322`, `:1538`): hook kiểm main bằng kernel lock + mượn qua fd | — |

Danh sách skill có `fgos-unlock` ([`registrations.mjs:832`](../../src/setup/registrations.mjs)) → `fgos-lock-fence`.

**Hàng rào** (mở rộng [`fences.mjs`](../../src/holder-lock/fences.mjs) của 4.2): `merge-slot` liệt kê `git for-each-ref refs/heads --format=%(refname:short)` → `mergeSlotLockFile` v1 (công thức sao từ `main-checkout-lock.mjs:73` trước khi P03 xoá, ghi vào registry dạng mẫu để không phụ thuộc code đã xoá); `state` đặt tombstone cả `events.lock` lẫn `runtime/claims.lock`; `porting-events` cho `.fgos/porting/events.lock`. Tombstone `main-checkout.lock` cũng chặn `fgctl` cũ → đó là lý do điều kiện 4.4a.

Test hàng rào với **code v1 thật** lấy từ commit gốc (`git show <base>:<path>` vào thư mục tạm, như 4.2 P04): `acquireMainCheckoutLock`, `inspectMainCheckoutLock` (hook cũ), `withEventsLock`, `withClaimsLock`, `withMergeTargetSlot` cũ → mọi lời gọi thất bại (EISDIR hoặc timeout có tên); ghi cách thất bại vào báo cáo và CHANGELOG.

## Docs

- `docs/platform/holder-lock/spec.md`: mục main checkout (một cửa, handle, mượn qua fd, hook), hot-mutex (`state`, `porting-events`, fast path, `reclaim`, `stateTx`, gác exec và re-entry **ném ngay**), `worktree-admin`, `lock fence`; "Lịch sử quyết định": 4.3 Lead D1–D8, quyết định của anh 2026-10-16 "ném ngay" thay M5.
- [`docs/specs/runner.md:1268`](../../docs/specs/runner.md) (đoạn `main-checkout-lock.mjs` STR65): viết lại thành `repo-locks.mjs`; xoá mô tả TTL/self-recognition/marker.
- `docs/specs/state.md` hoặc spec state hiện có (grep `events.lock` trong `docs/specs/`): `state` hot-mutex thay `events.lock` + `claims.lock`.
- [`docs/platform/component-boundary.md`](../../docs/platform/component-boundary.md) §4: holder-lock sở hữu main checkout/slot/worktree-admin; state store sở hữu hot-mutex `state` (cơ chế tạm tới khi store sang Rust).
- `docs/specs/reading-map.md`: `src/runner/repo-locks.mjs`, `src/state/hot-lock.mjs`.
- `docs/io-contract.md` nếu nhắc `FGOS_MAIN_LOCK_HOLDER_PID` (grep).

## CHANGELOG `## [Unreleased]`

- Changed: main checkout, merge slot và `state` (thay `events.lock` + `claims.lock`) dùng kernel lock; holder chết nhả ngay; không còn TTL 3 phút hay "ambiguous".
- Changed: claim chỉ giữ main checkout quanh commit checkpoint; kiểm trần worker nằm cùng vùng găng với claim.
- Changed: commit của chính fgOS qua hook bằng mượn description (`FGOS_LOCK_FD`), bỏ `FGOS_MAIN_LOCK_HOLDER_PID`.
- Added: `fgos lock fence <name>`; check doctor `lock-record-unreadable`. Removed: `fgos unlock` và skill `fgos-unlock` (thay bằng `fgos lock fence`, skill `fgos-lock-fence`).
- Changed: chạy subprocess bên trong vùng găng state, hoặc lấy lại state khi đang giữ, ném `exec-under-hot-lock` / `hot-lock-reentry` ngay.
- Changed: release cũ gặp thư mục `TOMBSTONE` ở `.fgos/main-checkout.lock`, `.fgos/events.lock`, `.fgos/runtime/claims.lock`, `merge-slot--*.lock`, `.fgos/porting/events.lock` và dừng với lỗi; hook ở nhánh cũ từ chối commit tại main.

## File sở hữu

| Hành động | File |
|---|---|
| tạo | `src/setup/lock-record-checks.mjs`, `test/setup/lock-record-checks.test.mjs`, `test/holder-lock/fences-main-door.test.mjs` |
| sửa | `src/setup/registrations.mjs`, `test/setup/checks.test.mjs`, `src/holder-lock/fences.mjs`, `src/holder-lock/registry.mjs` (chỉ nếu cần biến `ref`) |
| sửa | `docs/platform/holder-lock/spec.md`, `docs/specs/runner.md`, spec state, `docs/platform/component-boundary.md`, `docs/specs/reading-map.md`, `docs/io-contract.md` (nếu cần), `CHANGELOG.md` |

## Test

`env -u ... FGOS_HOST_BIN=<build> node --test test/setup/lock-record-checks.test.mjs test/setup/checks.test.mjs test/holder-lock/fences-*.test.mjs`; `fgos convention check` trên doc đã sửa. Check chạy trên thư mục tạm thật: record rác → warn; record hợp lệ của process sống → pass.

## Tiêu chí nghiệm thu / rollback

Check có trong `fgos doctor --json`; hàng rào với code v1 thật thất bại to tiếng; spec trả lời sáu câu L5. Rollback: revert.
