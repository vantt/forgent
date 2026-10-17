# Phase 06: `worktree-admin` cho `git worktree add`

Wave 2. Nhánh `main-door/p06-worktree-admin`, worktree `.claude/worktrees/md-p06`. Phụ thuộc: P03 (`addWorktree`, `withWorktreeAdmin`).

## Đọc trước

- r6 §3 ("Mutex `worktree-admin` quanh `git worktree add`, ngoài main mutex", bản 2 §8.6), §6.5 (hạng 40). Lead D8: chỉ `add`.
- Chỗ gọi (bảng P00): [`worktree.mjs:748`, `:750`, `:752`](../../src/runner/worktree.mjs) (trong `createClaimWorktree`/hàm tạo worktree claim, `:1147`), [`:1294`](../../src/runner/worktree.mjs), [`session.mjs:423`](../../src/runner/session.mjs), [`workflow/integrate.mjs:54`, `:56`, `:118`](../../src/workflow/integrate.mjs). `merge.mjs:1807` thuộc P05; `bin/fgos.mjs:3362` thuộc P07.

## Yêu cầu

- Mỗi chỗ trên gọi `addWorktree(scope, repoRoot, args)`; hàm công khai chứa nó nhận `scope` (tạo `new LockScope()` tại điểm vào nếu caller không có).
- `createClaimWorktree(repoRoot, id, {scope, baseRef, startSha, worktreeDir})`: dùng `startSha` (HEAD đã prefetch ở claim, P04) thay vì đọc HEAD lại; bỏ `beforeProvision`. `provisionDependencies` (`npm ci`) chạy **ngoài** worktree-admin.
- Không bọc `worktree remove`/`prune` (D8).

## File sở hữu

| Hành động | File |
|---|---|
| sửa | `src/runner/worktree.mjs`, `src/runner/session.mjs` (chỉ khối `:415-430`), `src/workflow/integrate.mjs` |
| tạo | `test/runner/worktree-admin-multiprocess.test.mjs` |
| sửa | test hiện có của `createClaimWorktree`, `session` worktree, `integrate` (grep `createClaimWorktree\|integrate.mjs` trong `test/`) |

Lưu ý sở hữu: `session.mjs` cũng được 4.2 P06 sửa (sessions lock); phase này tạo nhánh từ main sau 4.2 nên không xung đột.

## Test

1. 8 process cùng `git worktree add` (worktree khác nhau) trên một repo tạm, 20 vòng → không lỗi `.git/worktrees` hỏng, `git worktree list` đủ.
2. Giữ main (process khác) không chặn `addWorktree`; giữ `worktree-admin` không chặn `withMainCheckout`.
3. Gọi `addWorktree` khi scope đang giữ main → `lock-order-violation` ngay (hạng 40 < 50).
4. Hồi quy test hiện có.

Lệnh: `env -u ... FGOS_HOST_BIN=<build> node --test test/runner/worktree-admin-multiprocess.test.mjs <test hiện có>`.

## Tiêu chí nghiệm thu / rollback

`rg "'worktree', 'add'" src bin` chỉ còn trong `repo-locks.mjs`. Rollback: revert.
