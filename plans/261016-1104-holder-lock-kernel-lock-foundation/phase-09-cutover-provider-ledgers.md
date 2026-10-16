# Phase 09: cutover account provider và `state-lock`

Wave 2. Nhánh `holder-lock/p09-provider-ledgers`, worktree `.claude/worktrees/hl-p09`. Phụ thuộc: P03. Luật chung: [phase 06](phase-06-cutover-gateway-sessions-runner.md#luật-chung-của-mọi-phase-cutover-p06p10).

## Yêu cầu

| Lock | Chỗ đổi | v3 |
|---|---|---|
| provider-state | `withFileLock` ([`provider-capacity.mjs:636`](../../src/runner/dispatch/provider-capacity.mjs)), đồng bộ, chờ 30 s | mutex máy `<lockRoot>/provider-state.lock`, `acquireSync({waitMs})` |
| provider-account | `tryAcquireAccountLock` ([`:703`](../../src/runner/dispatch/provider-capacity.mjs)), `acquireAccountLock` ([`:713`](../../src/runner/dispatch/provider-capacity.mjs), async) | mutex máy `<lockRoot>/provider-account--<p>--<a>.lock`; handle vẫn `{dir, release}` |

**`recordChild` → mượn (Lead D6).** Probe credential ([`provider-credential-renewal.mjs:1078`](../../src/runner/dispatch/provider-credential-renewal.mjs)) spawn bằng `runBorrowed(handle, spec, {async})`, con giữ description; holder chết mà con còn sống thì lock vẫn giữ, như hôm nay. CLI probe tự daemon hoá sẽ giữ lock tới khi nó chết (giống hôm nay) và hiện ở doctor `lock-holders`.

**Xoá cùng commit:** `GENERATION_FILE_RE`, `currentGeneration`, `acquireGenerationLock`, `tryAcquireGenerationLock`, `recordGenerationChild`, `releaseGenerationLock` và chú thích "GC trade-off" (khối `:380-650`); `recordChild` của handle; `isPidAlive` export (`:760`) nếu không còn ai dùng (grep toàn repo); `lockDir` trong `providerCapacityStatePaths` (`:48`). Thư mục ledger cũ trên đĩa để nguyên (thế hệ chặn của P04 nằm trong đó; không ai đọc nữa). Check `provider-capacity-lock-stale` xoá ở P11.

Caller kiểm lại (grep 2026-10-16): [`provider-credential-renewal.mjs:762`](../../src/runner/dispatch/provider-credential-renewal.mjs) (`tryLock` tiêm vào), `:1023`, `:1040`, `:1078`, `:1164`, `:1196`; mọi `withFileLock` trong `provider-capacity.mjs` (executor liệt kê đủ trong báo cáo).

Process trong sandbox: lock máy dựa vào `FGOS_STATE_ROOT` (P03 ghim cho con), nên worker có `HOME` riêng vẫn cùng lock với host. Test đặt `FGOS_STATE_ROOT` tạm cho mỗi ca.

## File sở hữu

| Hành động | File |
|---|---|
| sửa | `src/runner/dispatch/provider-capacity.mjs`, `src/runner/dispatch/provider-credential-renewal.mjs` (chỗ spawn probe + handle) |
| sửa | `test/runner/provider-capacity.test.mjs`, `test/runner/provider-credential-renewal.test.mjs`, `test/runner/provider-per-cli-credential-sources.test.mjs`, `test/setup/credential-copies-retained-check.test.mjs` (nếu ca chạm lock) |

## Test

Holder account SIGKILL khi con probe (process `node` thật ngủ 2 s) còn sống → người khác `held` tới khi con thoát, rồi `acquired` ngay; holder SIGKILL không có con → trống ngay. Process trong `bwrap --unshare-pid` (nếu máy có) với `FGOS_STATE_ROOT` ghim tranh cùng account với host → loại trừ đúng. Hẹp: `env -u ... FGOS_HOST_BIN=<build> node --test <các file trên>`; rồi full `npm test`.

## Dòng CHANGELOG

- Changed: lock tài khoản provider và lock trạng thái capacity là kernel lock phạm vi máy; thư mục thế hệ không còn lớn dần. Release cũ thấy "held by pid 1" trên các lock này.

## Rollback

Revert commit.
