# Phase 03: cửa main checkout, checkpoint nhận handle, mượn qua fd, hook

Wave 1. Nhánh `main-door/p03-main-door`, worktree `.claude/worktrees/md-p03`. Phụ thuộc: P00. Song song với P01, P09 (docs).

## Đọc trước

- r6 §6.4 (mượn: 6 điểm), §6.5 (cửa có handle, bảng hạng), §6.10; kongming M4.
- Source: [`main-checkout-lock.mjs`](../../src/runner/main-checkout-lock.mjs) (850 dòng; exports ở `:53-825`), [`main-checkout-activity.mjs`](../../src/runner/main-checkout-activity.mjs) (beacon, giữ), [`events-jsonl-truncation-guard.mjs:355-525`](../../src/state/events-jsonl-truncation-guard.mjs) (checkpoint, `mainCheckoutWriter`, commit `:514`, reset `:521`), [`.githooks/pre-commit:100-150`, `:447-548`](../../.githooks/pre-commit), [`merge.mjs:727-830`](../../src/runner/merge.mjs) (`withMergeTargetSlot`, heartbeat).
- Facade 4.2: `acquire`, `runBorrowed`, `probe`, `LockScope`, `--borrowed-check`.

## Yêu cầu

Module mới `src/runner/repo-locks.mjs` (Lead D1):

- `withMainCheckout(scope, purpose, fn, {waitMs})`: `acquire(scope, 'main-checkout', {}, {waitMs})` (hạng 50), gọi `fn(mainHandle)`, nhả trong `finally`. `purpose` chỉ để ghi lỗi/`lock-status`. Không TTL, không heartbeat, không self-recognition.
- `checkpointMainFgos(mainHandle, dir, repoRoot)`: **bắt buộc** handle (không có thì ném lập trình); gọi `runOpportunisticMainCheckoutChecks(dir, repoRoot, {commit: (args) => runBorrowed(mainHandle, {command:'git', args, cwd})})`. Không bao giờ tự acquire (r6 §6.5).
- `withMergeTargetSlot(scope, lockRoot, targetRef, fn)`: dời từ `merge.mjs:770`, thân = `acquire(scope, 'merge-slot', {ref})` (hạng 20), chờ theo `waitMs`; bỏ heartbeat/renew (`merge.mjs:727-760`, `:811-820`).
- `withWorktreeAdmin(scope, fn)`: `acquire(scope, 'worktree-admin')` (hạng 40).
- `addWorktree(scope, repoRoot, args)`: tiện ích một dòng = `withWorktreeAdmin(scope, () => git(repoRoot, ['worktree','add',...args]))`, để P05–P07 không lặp.

`events-jsonl-truncation-guard.mjs`: tham số `mainCheckoutWriter` (`(txn) => txn(commitEnv)`) thay bằng `commit(args)` do caller truyền (đã mượn); add → commit → reset-on-error giữ nguyên thứ tự, cả ba trong thời gian caller giữ main (`reset` cũng đi qua `runBorrowed` vì hook không chạy với reset, nhưng index của main vẫn cần loại trừ — "reset trong mutex", r6 §11/4.3). Không có `commit` thì không commit (như hôm nay).

**Hook** (Lead D6): bỏ `inspectMainCheckoutLock`, `fgosGrantPid`, `HOLDER_PID_ENV_VAR`, `UNSUPPORTED_PROTOCOL` (`pre-commit:29`, `:110-143`). Mới, chỉ khi `hookRunsAtHome`: (1) `FGOS_LOCK_FD` có → gọi `fgos internal lock-fd --protocol 1 --borrowed-check <v3Path>` với fd 3 của chính hook (kế thừa từ git) → `borrower` thì `exit 0` trước beacon; (2) không thì `probe(main-checkout)` → `held` → từ chối "fgOS is writing the main checkout"; (3) beacon W1' như cũ. Hook là Node; nó dùng facade 4.2 (`src/holder-lock/`), không exec trong vùng găng nào.

**Xoá** trong [`main-checkout-lock.mjs`](../../src/runner/main-checkout-lock.mjs): `acquireMainCheckoutLock`, `releaseMainCheckoutLock(IfOwn)`, `renewMainCheckoutLockIfOwn`, `inspectMainCheckoutLock`, `forceReclaimAmbiguousLock`, `heldMainCheckoutWriter`, `acquiringMainCheckoutWriter`, `HOLDER_PID_ENV_VAR`, `DEFAULT_TTL_MS`, `HOOK_TTL_MS` (nếu hook không còn dùng: beacon có `windowMs` riêng — grep), `LOCK_PROTOCOL_VERSION`, marker giao thức, `mergeSlotLockFile`, `ACQUIRED/HELD/AMBIGUOUS`, `lockRefusalDetail`. `formatLockDurationMs` dời sang `src/util/` nếu còn người dùng (beacon/lock-status), rồi xoá file. Caller chưa chuyển (claim-port, merge, bin) sẽ không build được trên nhánh riêng của phase này: phase chỉ chạy test của chính nó; P04/P05/P07 chuyển caller. Ghi trong báo cáo danh sách import gãy.

`adapters.mjs` `workerBaseEnv` đã bỏ `FGOS_MAIN_LOCK_HOLDER_PID` ở 4.2 P03 — kiểm, không sửa.

## File sở hữu

| Hành động | File |
|---|---|
| tạo | `src/runner/repo-locks.mjs` |
| xoá/sửa | `src/runner/main-checkout-lock.mjs` |
| sửa | `src/state/events-jsonl-truncation-guard.mjs`, `.githooks/pre-commit`, `src/runner/main-checkout-activity.mjs` (chỉ import nếu đổi) |
| tạo | `test/runner/repo-locks-multiprocess.test.mjs`, `test/e2e/main-checkout-borrow-hook.test.mjs` |
| xoá/viết lại | `test/runner/main-checkout-lock.test.mjs` (74 KB; giữ ý nghĩa ca hành vi, bỏ ca TTL/AMBIGUOUS/self-recognition), `test/e2e/main-checkout-lock-hook.test.mjs`, `test/e2e/main-checkout-lock-hook-worktree-commit.test.mjs`, `test/e2e/main-checkout-activity-beacon.test.mjs` (chỉ phần đọc lock), `test/state/events-jsonl-truncation-guard.test.mjs` (chỉ phần writer → commit) |

## Test (git thật, hook thật, repo tạm, process thật)

1. Hai `withMainCheckout` ở hai process → loại trừ; holder SIGKILL → người sau vào ngay.
2. `checkpointMainFgos(h)` commit `.fgos` qua `runBorrowed`: hook nhận borrower, commit thành công; ngay sau đó `probe == free` khi holder nhả (gc tắt).
3. Hai con cùng env `FGOS_LOCK_FD=main-checkout:3` nhưng con thứ hai tự mở file → hook của con hai từ chối (anh em bị từ chối, r6 §6.4).
4. Owner bị SIGKILL ngay sau khi spawn `git commit` mượn → contender bị chặn suốt lúc git chạy, git commit xong, rồi contender vào (r6 §12.1 ca 5, nay trên code thật).
5. Commit tay ở main khi fgOS giữ main → hook từ chối; khi không ai giữ → qua, beacon ghi như W1'.
6. Commit trong worktree khác (không phải home) → hook không chạm lock (giữ `tsk-sir`).
7. Checkpoint lỗi giữa add và commit → reset chạy trong lúc vẫn giữ main (quan sát `holders` lúc reset).
8. `checkpointMainFgos()` không handle → ném.

Lệnh: `env -u ... FGOS_HOST_BIN=<build> node --test test/runner/repo-locks-multiprocess.test.mjs test/runner/main-checkout-lock.test.mjs test/e2e/main-checkout-*.test.mjs test/state/events-jsonl-truncation-guard.test.mjs`.

## Tiêu chí nghiệm thu / rollback

Tám test xanh; `rg 'HOLDER_PID|FGOS_MAIN_LOCK_HOLDER_PID|inspectMainCheckoutLock' src .githooks` chỉ còn ở file của P04/P05/P07 chưa chuyển (danh sách trong báo cáo). Rollback: revert.
