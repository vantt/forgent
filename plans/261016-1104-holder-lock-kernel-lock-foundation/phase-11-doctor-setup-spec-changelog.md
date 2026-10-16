# Phase 11: doctor, setup, spec, component boundary, reading-map, CHANGELOG

Wave 1–2. Nhánh `holder-lock/p11-doctor-docs`, worktree `.claude/worktrees/hl-p11`. Docs bắt đầu ngay sau P00; check gắn code sau P02, P03, P04. Chủ duy nhất của các file dùng chung bên dưới (cổng cài đặt trong AGENTS.md).

## Doctor (đăng ký trong `src/setup/registrations.mjs`, thân ở module mới)

| Check | Làm gì | Kết quả |
|---|---|---|
| `lock-kernel-semantics` | Với `<fgosDir>/locks` và `<lockRoot>`: `--guarantee` qua route + probe hai process thật trên chính mount đó | In `{driver, exclusion, borrow, holders}`. `kernel` → pass; macOS `kernel-unmeasured` → pass kèm ghi chú X2; Windows `unsupported` → **warn** "holder-lock chưa có driver Windows (4.4); gateway, sessions, runner, dispatch… không chạy được"; fs mạng `none` → fail có tên. Không fail chỉ vì nền |
| `lock-borrow-vectors` | `fgos internal lock-borrow-vectors` | Vector đỏ → **fail** (kongming M4). Windows → không áp dụng |
| `lock-holders` | Mỗi lock 4.2 trong registry: `holders()`; holder không phải process fgOS và không phải con của một `runBorrowed` → warn kèm pid/cmdline | `unlistable` → info |
| `lock-fences` | `fenceStatus` (P04): đường v1 nào của registry chưa có hàng rào | Thiếu → warn. **Fix** = `checkStopped` → `placeFences` → `checkStopped` (P04); có blocker thì không đặt gì và in danh sách process |
| `state-root` | `stateRoot`, `lockRoot`, nguồn; Node và host ra cùng giá trị | Lệch → fail |

Xoá check `provider-capacity-lock-stale` và `checkProviderCapacityLockStale` ([`registrations.mjs:2242-2268`](../../src/setup/registrations.mjs)): ledger không còn là mutex sau P09.

Setup: `fgos setup` tạo `<lockRoot>` (0700) và `<fgosDir>/locks`. Không thêm khoá cấu hình.

## Docs

- `docs/platform/holder-lock/spec.md` (Lead D1): cổng 6.0 + bảng driver/mức (Linux kernel, macOS kernel-unmeasured tới X2, Windows unsupported tới 4.4, fs mạng none); luật description 6.1.1 (vector bắt buộc, không chế độ tắt mượn); kind; registry (trỏ file contract); `LockScope` ném ngay khi sai thứ tự; cutover dừng-toàn-bộ + bảng hàng rào giữ lại; state root; route nội bộ; "Lịch sử quyết định": r1–r4, kongming M4/N6, quyết định A1–A3 của anh ngày 2026-10-16 (thay R-dual, sàn và lịch trace của r4), Lead D1–D7.
- `docs/platform/process/spec.md`: facts (bảng phán + vector), control phần 4.2, cổng trung lập OS, phần gate để 6.2.
- `docs/platform/component-boundary.md` §4: thêm "Process Facts & Control (L0)" và "Holder-lock (L1)" theo r4 §4.2.
- `docs/specs/reading-map.md`: hai spec, `src/holder-lock/`, `packages/holder-lock/`, `packages/process/`.
- `docs/specs/distribution.md` dòng 71: thêm 5 check, bỏ `provider-capacity-lock-stale`; phần activation: cổng vector + probe ngữ nghĩa của `fgctl`.
- `docs/specs/runner.md`: câu mô tả dispatch lock cwd (kernel lock); lệch TTL cũ để 4.5.
- `CHANGELOG.md` `## [Unreleased]`: dòng của P06–P10 (văn bản trong từng phase) và: Added 5 check doctor; Added `fgctl` chặn activate khi vector mượn hoặc probe ngữ nghĩa đỏ; Changed host đặt `FGOS_STATE_ROOT` cho payload, dispatch ghim cho process con; Changed sai thứ tự lock ném `lock-order-violation`; Removed `provider-capacity-lock-stale`.

## File sở hữu

| Hành động | File |
|---|---|
| tạo | `src/setup/holder-lock-checks.mjs`, `test/setup/holder-lock-checks.test.mjs` |
| sửa | `src/setup/registrations.mjs`, `test/setup/checks.test.mjs` |
| tạo | `docs/platform/holder-lock/spec.md`, `docs/platform/process/spec.md` |
| sửa | `docs/platform/component-boundary.md`, `docs/specs/reading-map.md`, `docs/specs/distribution.md`, `docs/specs/runner.md`, `CHANGELOG.md` |

## Test

`env -u ... FGOS_HOST_BIN=<build> node --test test/setup/holder-lock-checks.test.mjs test/setup/checks.test.mjs`. Check chạy thật trên thư mục tạm: semantics pass trên ext4/tmpfs; vectors pass; một process lạ giữ lock bằng `flock` của util-linux → `lock-holders` warn; `lock-fences` thấy thiếu rồi fix đặt đủ. `fgos convention check` trên doc mới.

## Tiêu chí nghiệm thu / rollback

Năm check có trong `fgos doctor --json` kèm mức; spec trả lời được sáu câu L5. Rollback: revert (check chỉ đọc, trừ fix của `lock-fences`).
