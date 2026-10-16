# Phase 09: cutover account provider và `state-lock` (họ `machine-ledgers`, thế hệ chặn)

Wave 3. Nhánh `holder-lock/p09-provider-ledgers`, worktree `.claude/worktrees/hl-p09`. Phụ thuộc: P03, P04. Luật chung: [phase 06](phase-06-cutover-gateway-sessions-runner.md#luật-chung-của-mọi-phase-cutover-p06p10).

## Yêu cầu

| Lock | Chỗ đổi | v3 |
|---|---|---|
| provider-state | `withFileLock` ([`provider-capacity.mjs:636`](../../src/runner/dispatch/provider-capacity.mjs)), đồng bộ, chờ 30 s | mutex máy `<lockRoot>/provider-state.lock`, `acquireSync({waitMs})` |
| provider-account | `tryAcquireAccountLock` ([`:703`](../../src/runner/dispatch/provider-capacity.mjs)), `acquireAccountLock` ([`:713`](../../src/runner/dispatch/provider-capacity.mjs), async, timer) | mutex máy `<lockRoot>/provider-account--<p>--<a>.lock`; `try` → `acquire` không chờ; async → `acquire` async. Handle giữ `{dir, release}` như hôm nay; thế hệ chặn lười cho account chưa có ledger (P04 điểm 6) |

**`recordChild` → mượn (Lead D8).** Hôm nay `lock.recordChild(child.pid)` ([`provider-credential-renewal.mjs:1078`](../../src/runner/dispatch/provider-credential-renewal.mjs)) giữ bất biến "holder chết mà con còn sống thì không giành". v3: probe credential được spawn bằng `runBorrowed(handle, spec, {async})` (con giữ description); `recordChild` chỉ còn ở đường v1. Hệ quả nói thẳng: CLI probe tự daemon hoá sẽ giữ lock tới khi nó chết — giống hôm nay (con sống thì held), nhưng giờ hiện ra ở doctor `lock-holders`.

Caller cần kiểm cả hai chế độ (grep 2026-10-16): [`provider-credential-renewal.mjs:762`](../../src/runner/dispatch/provider-credential-renewal.mjs) (`sweepInterruptedStagings`, `tryLock` tiêm vào), `:1023`, `:1040`, `:1078`, `:1164` (`settleHeldCredentialHome`), `:1196` (`writeBackRenewedCredential`); và mọi `withFileLock` trong `provider-capacity.mjs` (executor liệt kê đủ trong báo cáo).

Test và process trong sandbox: lock máy phụ thuộc `FGOS_STATE_ROOT` (P03 ghim cho con), nên worker trong `HOME` riêng vẫn cùng lock với host. Test đặt `FGOS_STATE_ROOT` tạm cho mỗi ca.

## File sở hữu

| Hành động | File |
|---|---|
| sửa | `src/runner/dispatch/provider-capacity.mjs` (khối lock `:380-760`), `src/runner/dispatch/provider-credential-renewal.mjs` (chỗ spawn probe + truyền handle) |
| sửa | `test/runner/provider-capacity.test.mjs`, `test/runner/provider-credential-renewal.test.mjs`, `test/runner/provider-per-cli-credential-sources.test.mjs`, `test/setup/credential-copies-retained-check.test.mjs` (nếu ca chạm lock) |

`checkProviderCapacityLockStale` ([`registrations.mjs:2242`](../../src/setup/registrations.mjs)) thuộc P11.

## Test

- Hai chế độ cho các file trên.
- v3: holder account bị SIGKILL khi con probe (process thật, ví dụ `node -e` ngủ 2 s) còn sống → người khác `held` tới khi con thoát → rồi `acquired` ngay. Holder SIGKILL không có con → trống ngay.
- Process trong `bwrap --unshare-pid` (nếu máy có) với `FGOS_STATE_ROOT` ghim tranh cùng account với host → loại trừ đúng.
- Lệnh: `env -u ... FGOS_HOST_BIN=<build> node --test test/runner/provider-capacity.test.mjs test/runner/provider-credential-renewal.test.mjs test/runner/provider-per-cli-credential-sources.test.mjs test/setup/credential-copies-retained-check.test.mjs`.

## Dòng CHANGELOG

- Changed: lock tài khoản provider và lock trạng thái capacity dùng kernel lock phạm vi máy sau khi bật `machine-ledgers`; thư mục thế hệ cũ không còn lớn dần. Release cũ thấy "held by pid 1" trên các lock này.

## Rollback

Revert commit; họ đã bật thì revert cutover trước (revert publish một thế hệ `releasedAt` cho thế hệ chặn, P04).
