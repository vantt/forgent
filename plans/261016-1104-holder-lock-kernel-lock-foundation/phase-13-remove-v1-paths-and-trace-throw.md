# Phase 13: xoá đường v1, bật ném lỗi thứ tự

Wave 5, **có cổng**. Nhánh `holder-lock/p13-remove-v1`, worktree `.claude/worktrees/hl-p13`. Một executor (nhiều file chung, không song song).

## Cổng bắt đầu (cả ba)

1. Mọi họ 4.2 `active` ở forgentX, mdview, mcp-skill-hub (doctor `lock-cutover`).
2. Driver Windows của 4.4 đã có và cutover chạy được trên Windows, **hoặc** anh quyết bỏ hỗ trợ v1 trên Windows (câu hỏi 1 của plan.md). Thiếu cả hai → không chạy phase này (Lead D6).
3. Trace thứ tự: `<lockRoot>/trace/lock-order.jsonl` không có cảnh báo mới trong ≥ 7 ngày dùng thật (câu hỏi 3); có cảnh báo → sửa thứ tự hoặc bảng hạng trước.

## Xoá (One Door, mỗi lock một commit)

| Lock | Xoá |
|---|---|
| gateway, sessions, runner | nhánh v1, `tryAcquireLockOnce`/`tryAcquireOnce`, bản chép `isPidAlive` chỉ dùng cho lock ([`gateway-control.mjs:59`](../../src/runner/gateway-control.mjs) nếu P06 đã thay phần ngoài lock, [`session.mjs:69`](../../src/runner/session.mjs), [`loop.mjs:210`](../../src/runner/loop.mjs)) |
| advance, recovery | nhánh `open('wx')`, ân hạn mtime, `readLockHolderPid` |
| full-suite | nhánh `open('wx')`, `isPidAlive` export ([`full-suite-queue.mjs:23`](../../scripts/lib/full-suite-queue.mjs)) |
| provider ledgers | `acquireGenerationLock`, `tryAcquireGenerationLock`, `recordGenerationChild`, `releaseGenerationLock`, chú thích "GC trade-off" ([`provider-capacity.mjs:380-650`](../../src/runner/dispatch/provider-capacity.mjs)); `isPidAlive` export (`:760`) nếu không còn ai dùng; check `provider-capacity-lock-stale`. Thư mục ledger cũ để nguyên trên đĩa (thế hệ chặn còn đó; dữ liệu cũ không cần đọc) |
| dispatch cwd, reconcile | `cwdLockHolder`, `lockFile` chép ở reconcile (regex composite), nhánh đọc record ở guard resume; trong `main-checkout-lock.mjs` **chỉ** `dispatchLockFile`, `parseCompositePidIdentity` và nhánh composite (`:81`, `:176-195`, `:270`, `:288`) nếu 4.3 chưa viết lại file đó — nếu 4.3 đang chạy trên file này, phần này chuyển sang 4.3 |
| facade | `familyActive` vẫn giữ (marker là trạng thái), nhưng đường "marker vắng" của các lock trên thành lỗi `lock-cutover-pending` |

Bật ném lỗi: `LOCK_ORDER_ENFORCE = 'throw'` trong `src/holder-lock/lock-scope.mjs`. `LOCK_PROTOCOL` giữ 3 (wire không đổi).

## Test

Full `npm test` như phase 12 bước A4; test hai chế độ của P06–P10 rút về một chế độ (v3); test v1-thật-gặp-hàng-rào của P04 giữ (import từ commit cũ qua `git show` vào thư mục tạm, không giữ code v1 trong `src/`).

## Dòng CHANGELOG

- Removed: giao thức lock v1 (file pid) của gateway, sessions, runner, advance, recovery, reconcile, full-suite, dispatch cwd, provider; check `provider-capacity-lock-stale`. Changed: sai thứ tự lock trong một scope giờ ném lỗi.

## Rollback

Revert từng commit; release trước (R-dual) đọc được marker và chạy v3 nên rollback về nó an toàn.
