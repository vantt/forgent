# Phase 00: contract hot-lock, registry chi tiết, bảng call site

Wave 0, Lead. Nhánh `main-door/p00-contracts`, worktree `.claude/worktrees/md-p00`, từ main sau khi 4.2 land. Mục đích: chốt mọi thứ wave 1–2 cùng dựa vào.

## Đọc trước

- r6 §6.4, §6.5, §6.6, §6.7, §6.8, §6.10; [kiểm kê lock §2.1, §2.2, §6](../reports/research-261015-1731-lock-inventory-and-standardization.md).
- Registry 4.2 (`packages/holder-lock/contracts/lock-registry.v1.json`, dòng owner `4.3`).
- **Prior art** (đã chạy `git whatchanged -S … --no-patch`, ghi lại cho executor):
  - `HOLDER_PID_ENV_VAR` vào ở `c871cdcf1` (tsk-70l, root→main merge tự nhận nhau), mở rộng `00aafe0ce` (tsk-32v, checkpoint bị hook của chính holder từ chối). Bài học giữ: commit của chính fgOS phải qua hook mà không bị coi là người lạ — nay bằng description (r6 §6.4), không bằng pid.
  - `allowSelfRecognition` (`65aaa2d0b`, tsk-1wr) và đổi sang pid (`b5c235552`, tsk-18k): self-recognition theo identity là nguồn lỗi; kernel lock bỏ hẳn khái niệm này.
  - `forceReclaimAmbiguousLock` (`05cfcaef3`, tsk-2l8): tự dọn AMBIGUOUS trong claim; kernel lock không có AMBIGUOUS.
  - `withClaimsLock` (`7c4c4a132`, tsk-40m; `3d6c00444` TOCTOU settleClaim): lý do có hai lock nóng lồng nhau; gộp thành `state` (r6 §6.6).
  - `unlock` verb + skill (`8ef58808f`, tsk-3h4); `lock-status` (`435ddf3db`); `withLockRetry` (`d6c464be8` tsk-6c2, `204227333` tsk-2rf).
  - W1' (`e8176287f`, `e27182da4`): beacon `main-checkout-activity.json`, checkpoint nhận writer từ caller, marker giao thức `runtime/locks/main-checkout/protocol.json`. Giữ beacon; marker giao thức xoá (hàng rào tombstone thay nó, quyết định A1 của 4.2).
  - Không có hot-mutex kernel nào từng tồn tại rồi bị gỡ. Executor chạy lại `git whatchanged -S'syncBuiltinESMExports' -S'state.reclaim' --oneline --no-patch` và ghi kết quả.

## File sở hữu

| Hành động | File |
|---|---|
| sửa | `packages/holder-lock/contracts/lock-registry.v1.json` (dòng 4.3: bảng dưới) |
| tạo | `packages/holder-lock/contracts/hot-lock.v1.json` — record nóng `{v:1, pid, startTime, bootId, pidNs, writer?}`; tài nguyên `state`, `porting-events`; mã lỗi `exec-under-hot-lock`, `hot-lock-reentry`, `hot-lock-timeout`, `lock-record-unreadable`, `state-tx-revoked`; luật dọn: chỉ khi `judge == dead` và đang giữ kernel lock `<resource>.reclaim`, đọc lại so byte trước `unlink` |
| tạo | `packages/holder-lock/contracts/main-checkout-borrow.v1.json` — `FGOS_LOCK_FD=main-checkout:3`, ba điều kiện borrower của hook (r6 §6.4 điểm 2), API `runBorrowed` chèn `-c gc.auto=0 -c maintenance.auto=false` |
| sửa | `test/holder-lock/registry-contract.test.mjs` |
| tạo | `test/holder-lock/hot-lock-contract.test.mjs` (schema hot-lock + borrow) |

## Registry (dòng owner 4.3)

| name | kind | scope | rank | v3Path | v1Path → fence |
|---|---|---|---|---|---|
| merge-slot | mutex | repo | 20 | `<fgosDir>/locks/merge-slot--<enc(ref)>.lock` | `<fgosDir>/merge-slot--<ref>.lock` ([`main-checkout-lock.mjs:73`](../../src/runner/main-checkout-lock.mjs)) → tombstone cho mọi `refs/heads/*` lúc cutover (D4) |
| worktree-admin | mutex | repo | 40 | `<fgosDir>/locks/worktree-admin.lock` | (mới) |
| main-checkout | mutex | repo | 50 | `<fgosDir>/locks/main-checkout.lock` | `<fgosDir>/main-checkout.lock` → tombstone |
| state | hot-mutex | repo | 60 | `<fgosDir>/locks/state.hot` + kernel `<fgosDir>/locks/state.reclaim.lock` | `<fgosDir>/events.lock` ([`events.mjs:52`](../../src/state/events.mjs)), `<fgosDir>/runtime/claims.lock` ([`fgos-file-registry.mjs:44`](../../src/state/fgos-file-registry.mjs)) → tombstone cả hai |
| porting-events | hot-mutex | repo | 60 | `<fgosDir>/locks/porting-events.hot` + `porting-events.reclaim.lock` | `<fgosDir>/porting/events.lock` → tombstone |

`<fgosDir>` của `state` luôn là `.fgos` của **main checkout** (claims đã ở main qua `getMainFgosDir`, [`runtime-coordination.mjs:14`](../../src/state/runtime-coordination.mjs)). Bước 2 dưới kiểm rằng mọi caller của `withEventsLock` hôm nay truyền log dưới `.fgos` của main; caller nào truyền `.fgos` của worktree thì ghi vào báo cáo và P02 xử lý (prefetch `mainFgosDir`).

## Bảng call site (đầu vào cho P01–P07; executor grep lại, số khác thì ghi)

| Symbol | Chỗ gọi |
|---|---|
| `withEventsLock(` | [`events.mjs:214`, `:541`](../../src/state/events.mjs); [`store.mjs:248`](../../src/state/store.mjs); [`events-compaction.mjs:219`](../../src/state/events-compaction.mjs); [`porting-store.mjs:91`](../../src/state/porting-store.mjs); [`claim-port.mjs:305`](../../src/runner/claim-port.mjs); `scripts/backfill-status-category.mjs:190`, `scripts/migrate-actor-to-role.mjs:125`, `scripts/migrate-status-proposed-to-awaiting-approval.mjs:132` |
| `withEventsLockAndRefresh(` | `store.mjs:284, 449, 463, 532, 656, 1150, 1464, 1559, 1611, 1643, 1678, 1722, 1844, 1872, 2089` (15); `porting-store.mjs:134, 157` |
| `withClaimsLock(` | [`runtime-coordination.mjs:58`](../../src/state/runtime-coordination.mjs) (định nghĩa), `:206` (`acquireClaim`), `:284` (`releaseClaim`); [`store.mjs:1151`](../../src/state/store.mjs) (`settleClaim`, lồng trong events) |
| exec trong vùng găng nóng (đã biết) | `currentHead` [`claim-port.mjs:322`, `:339`](../../src/runner/claim-port.mjs) (trong/ngay sau `withEventsLock`); `getMainFgosDir` → `git rev-parse` ([`paths.mjs:74`](../../src/runner/paths.mjs)) trong `acquireClaim`/`releaseClaim`/`readClaims`; `assertPlanEvidence` [`store.mjs:601-622`](../../src/state/store.mjs), gọi dưới lock ở `:876` |
| `acquireMainCheckoutLock(` | [`claim-port.mjs:116`, `:130`](../../src/runner/claim-port.mjs); [`merge.mjs:790`, `:920`, `:1897`](../../src/runner/merge.mjs); `main-checkout-lock.mjs:592` (writer acquiring); `bin/fgos.mjs` verb `unlock` (`:4260-4294`) |
| `HOLDER_PID_ENV_VAR` | `main-checkout-lock.mjs:150, 576, 596`; [`merge.mjs:1593`](../../src/runner/merge.mjs); [`.githooks/pre-commit:116`](../../.githooks/pre-commit) |
| checkpoint `.fgos` | `runOpportunisticMainCheckoutChecks` ([`events-jsonl-truncation-guard.mjs:365`](../../src/state/events-jsonl-truncation-guard.mjs), commit ở `:509-521`); gọi ở `claim-port.mjs:165` (giữ main), `merge.mjs:807` (chỉ slot), `merge.mjs:936` (giữ main) |
| `git worktree add` | [`worktree.mjs:748`, `:750`, `:752`, `:1294`](../../src/runner/worktree.mjs); [`session.mjs:423`](../../src/runner/session.mjs); [`merge.mjs:1807`](../../src/runner/merge.mjs); [`workflow/integrate.mjs:54`, `:56`, `:118`](../../src/workflow/integrate.mjs); [`bin/fgos.mjs:3362`](../../bin/fgos.mjs) — 10 chỗ |
| `withLockRetry(` | `promote-engine.mjs:74`; `merge.mjs:1866`; `approve.mjs:149`; `sync-root.mjs:105`; `bin/fgos.mjs:3127`, `:3200` |

## Bước

1. Viết registry + hai contract + test.
2. Chạy `rg` cho bảng trên ở HEAD, cập nhật số dòng; kiểm `fgosDir` của mọi caller `withEventsLock` (đọc tham số `logPath`/`dir` tại chỗ gọi).
3. Merge vào `main-door/integration`.

## Tiêu chí nghiệm thu / rollback

Test contract xanh; bảng call site khớp HEAD. Rollback: revert (chưa ai đọc).
