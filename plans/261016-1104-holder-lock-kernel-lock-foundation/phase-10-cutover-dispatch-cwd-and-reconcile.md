# Phase 10: cutover dispatch cwd (phạm vi `fgosDir`), `reconcile.lock`, guard resume

Wave 3. Nhánh `holder-lock/p10-dispatch-cwd`, worktree `.claude/worktrees/hl-p10`. Phụ thuộc: P03, P04. Luật chung: [phase 06](phase-06-cutover-gateway-sessions-runner.md#luật-chung-của-mọi-phase-cutover-p06p10). `reconcile.lock` (họ `repo-files`) nằm ở đây vì cùng file `reconciliation-planner.mjs` với phần cwd.

## Yêu cầu

**Dispatch cwd** (họ `dispatch-cwd`, r4 §6.8 bước 5: phạm vi `fgosDir` giữ nguyên, phạm vi máy ra khỏi track):

| Chỗ | Hôm nay | v3 |
|---|---|---|
| [`dispatch/cli.mjs:725-774`](../../src/runner/dispatch/cli.mjs) | `acquireMainCheckoutLock({identity:"pid:ts:rand", ttlMs, lockFile: dispatchLockFile(cwd)})` + heartbeat `renewMainCheckoutLockIfOwn` | lease `<fgosDir>/locks/dispatch-cwd--<dev>-<ino>.lock` (khoá theo `dev:ino` sau `realpath`, r4 §6.9 dòng cuối); không TTL, không heartbeat; `sharedCwd` vẫn không lấy lock; tombstone lười ở **cả** `dispatchLockFile(path.resolve(cwd))` và `dispatchLockFile(realpath(cwd))` |
| [`assignment-runner.mjs:2216-2253`, `:2785-2786`](../../src/runner/dispatch/assignment-runner.mjs) | như trên | như trên; thứ tự acquire giữ như hôm nay (đổi thứ tự attempt→cwd là việc của 6.2) |
| Guard resume [`execution/run.mjs:342-362`](../../src/runner/execution/run.mjs) | đọc record, `catch` → coi như không holder (fail-open trên tombstone) | **trong cùng commit với cutover cwd** (r4 §6.8 bước 7): marker có → `probe(dispatch-cwd)`; `held` → từ chối resume. Marker vắng → giữ đường đọc record nhưng gặp thư mục (tombstone) → `lock-cutover-pending`, không fail-open |
| Reconcile [`reconciliation-planner.mjs:126,197,225-240`](../../src/runner/dispatch/reconciliation-planner.mjs) | luật composite riêng (`cwdLockHolder`, so `ts` với btime), chép tên file | marker có → `probe`; `held` = có holder, `free` = không; không phán sống/chết |

Mã lỗi giữ nguyên (`DispatchError('dispatch-in-flight', ...)`); thông báo holder dùng `holders()` (Linux liệt kê pid; nền khác `held`).

**Reconcile lock** (`withLocalLock`, [`reconciliation-planner.mjs:379`](../../src/runner/dispatch/reconciliation-planner.mjs)): mutex repo `<fgosDir>/locks/reconcile.lock`, họ `repo-files`.

**Cutover cwd (P04 làm):** pha 1 tombstone mọi worktree + claim (cả hai dạng tên); bật chỉ khi đủ điều kiện Lead D9. Phase này chỉ cài đường v3 + guard.

## File sở hữu

| Hành động | File |
|---|---|
| sửa | `src/runner/dispatch/cli.mjs` (khối `:720-790`), `src/runner/dispatch/assignment-runner.mjs` (khối `:2145-2260`, `:2780-2790`), `src/runner/execution/run.mjs` (khối `:335-365`), `src/runner/dispatch/reconciliation-planner.mjs` |
| sửa | `test/runner/dispatch-reconciliation.test.mjs`, `test/runner/dispatch-reconciliation-concurrency.test.mjs`, `test/runner/dispatch-reconcile-operation.test.mjs`, `test/cli/dispatch-reconcile.test.mjs`, `test/runner/execution/run.test.mjs`, test của `executeExecutorCli`/`executeAssignment` có ca `dispatch-in-flight` (grep `dispatch-in-flight` trong `test/`) |

`main-checkout-lock.mjs` (gồm `dispatchLockFile`, `parseCompositePidIdentity`) **không** sửa ở 4.2: đường v1 còn dùng; xoá ở phase 13 phần thuộc dispatch.

## Test

- Hai chế độ cho mọi file trên.
- v3: hai dispatch ghi cùng cwd → một `dispatch-in-flight`; holder SIGKILL → dispatch kế vào ngay (không chờ TTL); cùng cwd qua symlink (`path.resolve` khác, `realpath` giống) → vẫn loại trừ; dispatch chỉ đọc (`sharedCwd`) không bị chặn.
- Guard resume: holder v3 sống → từ chối; tombstone + marker vắng → `lock-cutover-pending` (không fail-open, ca Astra/gemini R3-4a).
- Import-graph reconcile (`test/runner/dispatch-reconciliation-import-graph.test.mjs`) vẫn xanh: reconcile chỉ thêm import facade (không `child_process` trực tiếp; nếu luật cấm, đưa `probe` qua module được phép và ghi lý do).
- Lệnh: `env -u ... FGOS_HOST_BIN=<build> node --test <các file trên> test/runner/dispatch-reconciliation-import-graph.test.mjs`.

## Dòng CHANGELOG

- Changed: lock dispatch theo cwd dùng kernel lock (vẫn theo `fgosDir`) sau khi bật `dispatch-cwd`; holder chết nhả ngay, không còn file `dispatch--*.lock` mồ côi chặn resume.

## Rủi ro / rollback

- Import-graph của reconcile cấm process-control: facade gọi route bằng `spawnSync` → có thể vi phạm luật cấm `child_process` trong closure reconcile. Executor kiểm sớm; nếu vi phạm, `probe` cho reconcile đi qua một module ngoài closure do planner tiêm vào (như `tryLock` đã tiêm ở `sweepInterruptedStagings`), ghi lý do.
- Rollback: revert commit; họ đã bật thì revert cutover trước.
