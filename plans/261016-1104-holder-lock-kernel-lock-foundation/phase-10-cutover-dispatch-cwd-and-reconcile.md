# Phase 10: cutover dispatch cwd (phạm vi `fgosDir`), `reconcile.lock`, guard resume

Wave 2. Nhánh `holder-lock/p10-dispatch-cwd`, worktree `.claude/worktrees/hl-p10`. Phụ thuộc: P03. Luật chung: [phase 06](phase-06-cutover-gateway-sessions-runner.md#luật-chung-của-mọi-phase-cutover-p06p10). `reconcile.lock` ở đây vì cùng file với phần cwd.

## Yêu cầu

**Dispatch cwd** (phạm vi `fgosDir` giữ nguyên; phạm vi máy ra khỏi track, r4 §6.8 bước 5):

| Chỗ | Hôm nay | v3 |
|---|---|---|
| [`dispatch/cli.mjs:725-774`](../../src/runner/dispatch/cli.mjs) | `acquireMainCheckoutLock({identity:"pid:ts:rand", ttlMs, lockFile: dispatchLockFile(cwd)})` + heartbeat | lease `<fgosDir>/locks/dispatch-cwd--<dev>-<ino>.lock` (`dev:ino` sau `realpath`, r4 §6.9); không TTL, không heartbeat; `sharedCwd` vẫn không lấy lock |
| [`assignment-runner.mjs:2216-2253`, `:2785-2786`](../../src/runner/dispatch/assignment-runner.mjs) | như trên | như trên; thứ tự acquire giữ như hôm nay (đổi sang attempt→cwd là việc 6.2) |
| Guard resume [`execution/run.mjs:342-362`](../../src/runner/execution/run.mjs) | đọc record, `catch` → coi như không có holder (fail-open trên tombstone) | `probe(dispatch-cwd)`; `held` → từ chối resume |
| Reconcile [`reconciliation-planner.mjs:126,197,225-240`](../../src/runner/dispatch/reconciliation-planner.mjs) | luật composite riêng, chép tên file | `probe`; không phán sống/chết |
| `withLocalLock` ([`reconciliation-planner.mjs:379`](../../src/runner/dispatch/reconciliation-planner.mjs)) | `open('wx')` + `{pid,startTime}` | mutex `<fgosDir>/locks/reconcile.lock` |

Mã lỗi giữ (`DispatchError('dispatch-in-flight', ...)`); holder trong thông báo lấy từ `holders()`.

**Xoá cùng commit:** heartbeat `renewMainCheckoutLockIfOwn` cho cwd ở hai chỗ; `cwdLockHolder`, `lockFile`, `holder` của reconcile (regex composite chép); nhánh đọc record của guard resume; trong [`main-checkout-lock.mjs`](../../src/runner/main-checkout-lock.mjs) **chỉ** phần riêng của dispatch: `dispatchLockFile` (`:81`), `COMPOSITE_PID_IDENTITY_RE`/`parseCompositePidIdentity` (`:176-195`) và nhánh composite (`:270`, `:288`). Phần main checkout không đụng (4.3); ghi vào báo cáo để 4.3 rebase.

## File sở hữu

| Hành động | File |
|---|---|
| sửa | `src/runner/dispatch/cli.mjs` (khối `:720-790`), `src/runner/dispatch/assignment-runner.mjs` (khối `:2145-2260`, `:2780-2790`), `src/runner/execution/run.mjs` (khối `:335-365`), `src/runner/dispatch/reconciliation-planner.mjs`, `src/runner/main-checkout-lock.mjs` (chỉ phần dispatch) |
| sửa | `test/runner/dispatch-reconciliation.test.mjs`, `test/runner/dispatch-reconciliation-concurrency.test.mjs`, `test/runner/dispatch-reconcile-operation.test.mjs`, `test/cli/dispatch-reconcile.test.mjs`, `test/runner/execution/run.test.mjs`, `test/runner/main-checkout-lock.test.mjs` (ca composite), test có ca `dispatch-in-flight` (grep trong `test/`) |

## Test

Hai dispatch ghi cùng cwd → một `dispatch-in-flight`; holder SIGKILL → dispatch kế vào ngay; cùng cwd qua symlink → vẫn loại trừ; `sharedCwd` không bị chặn. Guard resume: holder sống → từ chối. Import-graph reconcile (`test/runner/dispatch-reconciliation-import-graph.test.mjs`) xanh. Hẹp: `env -u ... FGOS_HOST_BIN=<build> node --test <các file trên> test/runner/dispatch-reconciliation-import-graph.test.mjs`; rồi full `npm test`.

## Dòng CHANGELOG

- Changed: lock dispatch theo cwd là kernel lock (vẫn theo `fgosDir`); holder chết nhả ngay, không còn file `dispatch--*.lock` mồ côi chặn resume. Fixed: guard resume không còn coi lock đọc lỗi là trống.

## Rủi ro / rollback

- Luật import-graph của reconcile cấm process-control; facade gọi route bằng `spawnSync`. Nếu vi phạm: tiêm `probe` từ ngoài closure (như `tryLock` đã tiêm ở `sweepInterruptedStagings`), ghi lý do.
- `main-checkout-lock.mjs` cũng là file của 4.3: nếu 4.3 đang chạy song song, phần xoá ở file này chuyển cho 4.3.
- Rollback: revert commit.
