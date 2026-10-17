# Phase 02: gộp claims vào `state`, mọi caller sang `withStateTx`, exec ra khỏi vùng găng

Wave 2. Nhánh `main-door/p02-state-cutover`, worktree `.claude/worktrees/md-p02`. Phụ thuộc: P00, P01 (đã vào nhánh tích hợp). Song song với P05–P08.

## Đọc trước

- r6 §6.6 (gộp `claims.lock` vào `events.lock`; bất biến 1–5, nhất là điểm 5: lấy trước lock), [kiểm kê §2.2](../reports/research-261015-1731-lock-inventory-and-standardization.md) dòng `claims.lock` (cướp holder sống sau 30 s, unlink không đọc lại).
- Source: [`runtime-coordination.mjs:14-118`](../../src/state/runtime-coordination.mjs) (`getMainFgosDir`, `withClaimsLock`), `:159` `readClaims`, `:186-284` `acquireClaim`/`releaseClaim`; [`store.mjs:1081-1315`](../../src/state/store.mjs) (`settleClaim`: `withEventsLockAndRefresh` → `withClaimsLock` lồng → `releaseClaim` lần hai); [`store.mjs:601-622`, `:876`](../../src/state/store.mjs) (`assertPlanEvidence` dưới lock); bảng call site P00.

## Yêu cầu

1. **Xoá `withClaimsLock`** ([`runtime-coordination.mjs:58-118`](../../src/state/runtime-coordination.mjs)) cùng `isPidAlive` (`:36`), nhánh "pid chết hoặc > 30 s" (`:93-97`). Các hàm claim có bản `*Tx(tx, …)` chạy trong `state` (ghi claim file qua `tx.writeJson`/`tx.unlink`); bản công khai (`acquireClaim`, `releaseClaim`, `readClaim`, `readClaims`) tự mở `withStateTx` (Lead D3). Không còn lock nóng thứ hai, không lồng.
2. **`getMainFgosDir`** không exec trong vùng găng: phân giải một lần mỗi process (cache theo `dir`) **trước** lock, truyền qua `prefetched.mainFgosDir`; trong `*Tx` chỉ đọc `tx.mainFgosDir`. Gỡ `try/catch` rộng (`:16-21`) để lỗi gác không bị nuốt (r6 §6.6 điểm 2).
3. **`settleClaim`** ([`store.mjs:1146-1315`](../../src/state/store.mjs)): một `withStateTx` duy nhất; kiểm lại claim, append, `releaseClaimTx` cùng trong đó; bỏ cụm chú thích "claims.lock không reentrant".
4. **`moveWork` + `assertPlanEvidence`** (Astra R3-8, gemini R3-2): ngoài lock chụp snapshot `{branch, sha của refs/heads/<branch>, ứng viên có mặt}` (`git rev-parse`, `git cat-file -e` như hôm nay); trong lock chỉ so revision item và SHA với snapshot; lệch → nhả lock, chụp lại, thử lại (tối đa 3 lần, rồi `conflict`). Không exec trong `tx`.
5. **Đổi tên** `withEventsLock` → `withStateTx` ở mọi chỗ gọi trong bảng P00 (store 16 chỗ qua `withEventsLockAndRefresh`, `events-compaction.mjs:219`, `porting-store.mjs:91,134,157` với `resource:'porting-events'`, ba script `scripts/*.mjs`); mọi ghi trong callback đi qua `tx`. Xoá export tạm `withEventsLock` của P01.
6. `resolveWriterIdentity` vẫn gọi trước lock (bất biến hiện có; [`store.mjs:1149`](../../src/state/store.mjs)), nay nằm trong `prefetched.writer`.
7. Thêm kiểm tĩnh (test) cho bất biến 1: mọi callback truyền vào `withStateTx` trong `src/ scripts/` không phải `async` (đọc AST bằng `node:module`? — dùng regex trên nguồn đủ: `withStateTx\([^,]+,\s*async`), và không có `await` trong thân callback.

## File sở hữu

| Hành động | File |
|---|---|
| sửa | `src/state/runtime-coordination.mjs`, `src/state/store.mjs`, `src/state/events-compaction.mjs`, `src/state/porting-store.mjs`, `src/state/fgos-file-registry.mjs` (bỏ `CLAIMS_LOCK`), `src/state/events.mjs` (chỉ xoá export tạm) |
| sửa | `scripts/backfill-status-category.mjs`, `scripts/migrate-actor-to-role.mjs`, `scripts/migrate-status-proposed-to-awaiting-approval.mjs` |
| sửa | `test/state/runtime-coordination.test.mjs`, `test/state/store.test.mjs`, `test/state/porting-store.test.mjs`, `test/state/events-jsonl-truncation-guard.test.mjs` (chỉ phần lock), `test/scripts/backfill-status-category.test.mjs`, `test/scripts/migrate-actor-to-role.test.mjs` |
| tạo | `test/state/state-tx-static.test.mjs` |

`claim-port.mjs` **không** thuộc phase này (P04). Sau P02, `claimWork` vẫn gọi `withEventsLock` → không còn export: P02 đổi đúng một dòng import/gọi ở [`claim-port.mjs:305`](../../src/runner/claim-port.mjs) sang `withStateTx` để nhánh tích hợp build được; thân claim do P04 viết lại. Ghi rõ trong báo cáo để P04 rebase.

## Test

1. `settleClaim` song song với `releaseClaim` của người khác (TOCTOU tsk-40m): đúng một thắng, không claim nào mất (process thật).
2. Claim file holder sống > 30 s không bị ai cướp (lỗi hôm nay).
3. `moveWork` heavy với bằng chứng plan: branch đổi SHA giữa snapshot và lock → thử lại, kết quả đúng; không exec trong vùng găng (gác P01 không ném).
4. `withStateTx` lồng giữa `state` và `porting-events`: grep cho thấy không chỗ nào lồng; test khẳng định lồng → `lock-order-violation` hoặc `hot-lock-reentry` (cùng hạng 60 bị cấm, 4.2 `LockScope`).
5. Test tĩnh (yêu cầu 7) xanh.
6. Toàn bộ `test/state/*.test.mjs` xanh.

Lệnh: `env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID FGOS_HOST_BIN=<build> node --test test/state/*.test.mjs test/scripts/*.test.mjs`.

## Tiêu chí nghiệm thu / rollback

`rg 'withClaimsLock|withEventsLock|claims\.lock|CLAIMS_LOCK' src scripts` rỗng; test trên xanh. Rollback: revert (cùng P01, vì P01 để tên tạm).
