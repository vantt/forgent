# Phase 04: claim — kiểm trần trong `state` và thu hẹp main, **một commit**

Wave 3. Nhánh `main-door/p04-claim`, worktree `.claude/worktrees/md-p04`. Phụ thuộc: P01, P02, P03 đã vào nhánh tích hợp. Chủ duy nhất của `src/runner/claim-port.mjs`.

## Đọc trước

- r6 §3 (kiểm trần ngay trước `acquireClaim` trong cùng vùng găng nóng; bản 2 §9.1), §6.6 điểm 5 (HEAD lấy trước, truyền SHA cho cả worktree lẫn record claim), §11/4.3 ("trần và thu hẹp trong một commit").
- [`claim-port.mjs:111-379`](../../src/runner/claim-port.mjs): main lock cả vùng (`:116-152`), checkpoint (`:165`), kiểm trần **ngoài** events lock (`:204-215`), `currentHead` trong/ngoài lock (`:235`, `:322`, `:339`, `:354`), `withEventsLock` (`:305`), worktree (`:360`), nhả main (`:377`); [`worker-slots.mjs:150`](../../src/state/worker-slots.mjs) `hasWorkerSlotRoom`.

## Vì sao một commit

Hôm nay kiểm trần đúng chỉ nhờ main mutex tuần tự hoá mọi claim. Thu hẹp main mà để kiểm trần ngoài `state` → hai claim cùng thấy còn chỗ → vượt trần. Đưa kiểm trần vào `state` mà chưa thu hẹp thì vô hại nhưng dư. Vì vậy hai thay đổi là một commit, một test.

## Yêu cầu

`claimWork(dir, opts)` mới, theo thứ tự:
1. **Ngoài mọi lock:** `prefetched = {writer, mainFgosDir, head: currentHead(repoRoot), branchHeads}` (`rev-parse` của branch/rootBranch khi cần — mọi exec của claim ở đây); `scope = new LockScope()`.
2. `withMainCheckout(scope, 'checkpoint', (h) => checkpointMainFgos(h, dir, repoRoot))` — main chỉ giữ quanh checkpoint (thu hẹp).
3. Các kiểm chỉ-đọc hiện có (not-found, deps, stale-claim-reclaim) giữ nguyên; reclaim stale dùng `releaseClaim`/`moveWork` công khai (tự mở `state`).
4. `withStateTx(mainFgosDir, (tx) => { fresh view + claims từ tx; kiểm `expectedStatus`; **kiểm trần** `hasWorkerSlotRoom(view, …)` → `worker-slot-ceiling` (giữ mã lỗi và trường `occupied/ceiling`); `acquireClaimTx(tx, {…, headAtTake: prefetched.head, branchHeadAtTake})` }, {prefetched})`.
5. `addOutcome` như hôm nay (tự mở `state`).
6. `isolate`: `createClaimWorktree(repoRoot, id, {scope, baseRef, startSha})` qua `addWorktree` của P03 (worktree-admin hạng 40, **ngoài** `state` và main); lỗi → `releaseClaim`. Bỏ `beforeProvision: lockResult.release()` (không còn giữ main).
7. Xoá: `forceReclaimAmbiguousLock`, nhánh `AMBIGUOUS`/`HELD` của main (`:116-152`), `heldMainCheckoutWriter`, hàm `currentHead` cục bộ (`:33`) nếu trùng `worktree.mjs:230`.

`worktree.mjs` không thuộc phase này: `createClaimWorktree` nhận `scope` và gọi `addWorktree` — thay đổi chữ ký làm ở P06; P04 chỉ truyền `scope`.

## File sở hữu

| Hành động | File |
|---|---|
| sửa | `src/runner/claim-port.mjs` |
| sửa | `test/runner/claim-port.test.mjs`, `test/cli/fgos-claim-2.test.mjs` |
| tạo | `test/runner/claim-capacity-race.test.mjs` |

## Test

1. **Hai item tranh slot cuối** (trần = n, n−1 đang chạy): hai `fgos take` song song ở hai process thật, 30 lần → mỗi lần đúng một claim, một `worker-slot-ceiling`.
2. Claim không còn giữ main lúc tạo worktree và lúc ghi `state`: trong khi claim chạy `git worktree add` (chặn bằng hook `post-checkout` thật của repo tạm ngủ 1 s), một `withMainCheckout` khác vào được ngay.
3. `headAtTake` trong record claim = SHA worktree được tạo từ (commit mới lên main giữa lúc prefetch và lúc worktree add không đổi kết quả).
4. Gác P01 không ném trong mọi đường claim (`take`, `pick`, reclaim stale, `--isolate`).
5. Hồi quy toàn bộ `claim-port.test.mjs`.

Lệnh: `env -u ... FGOS_HOST_BIN=<build> node --test test/runner/claim-port.test.mjs test/runner/claim-capacity-race.test.mjs test/cli/fgos-claim-*.test.mjs`; rồi full `npm test` (từ phase này nhánh tích hợp phải xanh).

## Tiêu chí nghiệm thu / rollback

Năm test xanh; phase là đúng một commit (`git show --stat` trong báo cáo). Rollback: revert commit đó (trả lại cả trần lẫn vùng main cùng lúc).
