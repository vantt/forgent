# Phase 05: merge, land, promote, sync-root, approve dưới slot; `lock-wait`

Wave 2. Nhánh `main-door/p05-merge`, worktree `.claude/worktrees/md-p05`. Phụ thuộc: P03. Chủ duy nhất của `src/runner/merge.mjs`.

## Đọc trước

- r6 §6.5 (caller giữ slot gọi `withMainCheckout` trước checkpoint), §6.10; [kiểm kê §5 điểm 3, §6.2](../reports/research-261015-1731-lock-inventory-and-standardization.md) (`promote-engine` và sync-root không-slot giữ main suốt merge + verify trong worktree tạm; nên dùng slot như `ffc64b1aa`).
- Source: [`merge.mjs:770-830`](../../src/runner/merge.mjs) (slot), `:829-1000` (`mergeRunnerItem`, nhánh không-slot giữ main `:920-960`), `:1584-1593` (commit merge với `HOLDER_PID_ENV_VAR`), `:1767-1866` (`mergeRootIntoMainCas`, worktree tạm `:1807`), `:1875-1935` (`landCasMergeUnderLock`: `update-ref` `:1914`, `read-tree` `:1925`); [`promote-engine.mjs:72-77`](../../src/runner/promote-engine.mjs); [`sync-root.mjs:105-108`, `:212`](../../src/verbs/merge/sync-root.mjs); [`approve.mjs:149`, `:465`, `:543`, `:728`](../../src/verbs/merge/approve.mjs); [`lock-wait.mjs`](../../src/runner/lock-wait.mjs).

## Yêu cầu

1. **Mọi merge vào target đi dưới slot bên ngoài** (`withMergeTargetSlot` của P03, hạng 20): `promote-engine.mjs:75` và nhánh không-slot của `sync-root.mjs:108` bọc `withMergeTargetSlot(scope, repoRoot, target, …)` **ngoài** worktree tạm; `mergeRunnerItem` chỉ còn một đường (luôn được gọi khi đã giữ slot): xoá tham số `targetSlot`, nhánh giữ main `:920-960`, heartbeat `:939-960`.
2. **Checkpoint dưới slot** (`:807`, `:936`): `withMainCheckout(scope, 'checkpoint', (h) => checkpointMainFgos(h, …))`.
3. **Commit merge** (`:1593`): nếu `repoRoot` là main checkout thì commit trong `withMainCheckout(scope, 'merge-commit', (h) => runBorrowed(h, git commit --no-edit))`; nếu là worktree tạm (đường thường) thì commit thẳng, không env lock (hook không chạm lock ngoài home). Xoá `HOLDER_PID_ENV_VAR`.
4. **Land CAS** (`landCasMergeUnderLock`): `withMainCheckout(scope, 'land', …)` bọc `update-ref` + `read-tree`, chờ tối đa `lockWaitMs` (giữ `CAS_LAND_LOCK_WAIT_MS` 60 s) bằng chờ của facade; bỏ `releaseMainCheckoutLockIfOwn`, `inspectMainCheckoutLock` (`:1772`).
5. **Thứ tự hạng:** slot (20) → worktree-admin (40, `:1807` qua `addWorktree`, nhả ngay) → main (50). Không lấy worktree-admin khi đang giữ main.
6. **`lock-wait.mjs`** (Lead D5): `withLockRetry(fn, {waitMs})` = gọi `fn` với `waitMs` đặt vào context để `acquire` chờ; bỏ phần đoán ETA/TTL; thông điệp chờ nêu tên lock + holder từ `holders()`.
7. `approve.mjs`: đổi import sang `repo-locks.mjs`; giữ thứ tự hiện có (slot ngoài, rồi worktree tạm).

## File sở hữu

| Hành động | File |
|---|---|
| sửa | `src/runner/merge.mjs`, `src/runner/promote-engine.mjs`, `src/verbs/merge/sync-root.mjs`, `src/verbs/merge/approve.mjs`, `src/runner/lock-wait.mjs` |
| sửa | `test/runner/merge.test.mjs`, `test/runner/merge-target-slot-multiprocess.test.mjs`, `test/runner/lock-wait.test.mjs`, `test/cli/fgos-approve-6.test.mjs`, `test/direct/merge-gate.test.mjs` |
| tạo | `test/runner/land-vs-manual-commit.test.mjs` |

## Test (git thật)

1. Hai land cùng target → loại trừ (slot), land thứ hai CAS lại đúng.
2. Checkpoint dưới slot vs land của item khác → không xen trong index main.
3. **Commit tay ↔ land ở khe `update-ref`/`read-tree`**, có và không có hook: commit tay bị hook từ chối khi land giữ main; không hook (`git -c core.hooksPath=/dev/null`) → ghi nhận đây là ngoài bảo đảm (r6 §3: raw git ngoài fgOS), test khẳng định land phát hiện drift qua CAS và báo, không mất commit.
4. **Staged-but-uncommitted** khi land `read-tree` (r6 §6.10): file staged trong main trước land → land từ chối hoặc giữ nguyên staged (khớp hành vi hôm nay, `isWorkingTreeClean`), không xoá thay đổi của người.
5. `promote-engine` không còn giữ main trong lúc verify: trong khi verify chạy (lệnh verify ngủ 2 s), `withMainCheckout` khác vào được.
6. `--wait`/`--no-wait` của approve/sync-root: slot bị giữ → `--no-wait` thất bại ngay có tên; `--wait 3000` chờ rồi vào khi holder nhả.

Lệnh: `env -u ... FGOS_HOST_BIN=<build> node --test <các file trên> test/runner/land-vs-manual-commit.test.mjs`.

## Tiêu chí nghiệm thu / rollback

Sáu test xanh; `rg 'targetSlot|heartbeatIntervalMs|HOLDER_PID|acquireMainCheckoutLock' src/runner src/verbs` rỗng. Rollback: revert.
