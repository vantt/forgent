# Phase 04: hàng rào cho binary cũ + kiểm dừng-toàn-bộ

Wave 1. Nhánh `holder-lock/p04-fences`, worktree `.claude/worktrees/hl-p04`. Phụ thuộc: P00 (registry); nghiệm thu sau P02 (route `quiesce-scan`).

Thay engine R-dual hai pha của r4 §6.8 theo quyết định A1 của anh: không marker, không sàn, không revert tự động. Chỉ còn hai việc: kiểm máy đã dừng, rồi đặt hàng rào một lần.

## Yêu cầu

Mô-đun `src/holder-lock/fences.mjs`, export:

- `checkStopped({workspaces})`: gọi `fgos internal quiesce-scan` cho từng workspace; mọi process fgOS ngoài chính process đang chạy (và cha shell của nó) → danh sách `blockers`. Mục `unreadable` cũng là blocker. Nền không quét được (`Unsupported`) → trả `needs-attest`.
- `placeFences({fgosDir, lockRoot, workspaceRoot})`, theo registry, chỉ những lock có `fence != none`:
  - `tombstone`: liệt kê mọi `v1Path` (đường cố định; mọi run dir có sẵn cho advance/recovery; mọi worktree từ `git worktree list --porcelain` và mọi claim cho dispatch cwd, cả `path.resolve` lẫn `realpath`). Mỗi đường: `mkdir` độc quyền rồi ghi `TOMBSTONE` (`{lock, at, by:"fgos 4.2"}`). `EEXIST` vì file v1 đang có → dừng, trả lỗi `v1-lock-present` kèm đường dẫn (không xoá file của ai). Đã là tombstone → bỏ qua (idempotent).
  - `blocking-generation`: với mỗi thư mục ledger (`state-lock`, mọi `account-locks/<p>/<a>/lock`): publish bằng `link` thế hệ kế với `{holder:{pid:1}, fence:"fgos 4.2"}` — không `processStartTime`, không `bootId` (Argon R4-3). `EEXIST` → đọc lại, quyết lại. Thế hệ hiện tại đang có holder sống → `v1-lock-present`.
- `fenceStatus(...)`: mỗi đường đã có hàng rào chưa (dùng cho check `lock-fences`).
- Thứ tự trong fix của check `lock-fences` (P11 đăng ký): `checkStopped` → `placeFences` → `checkStopped` lần nữa (bắt process khởi động trong lúc đặt rào; lúc này nó đã gặp rào nên thất bại to tiếng, nhưng vẫn báo để người dừng nó). Có blocker ở lần đầu → không đặt gì.

Đây là thân check; đăng ký và fix nằm ở P11. Không verb mới, không sửa `bin/fgos.mjs`.

## File sở hữu

| Hành động | File |
|---|---|
| tạo | `src/holder-lock/fences.mjs` |
| tạo | `test/holder-lock/{fences-v1-tombstone.test.mjs,fences-v1-ledger.test.mjs,fences-stop-check.test.mjs}`, `test/holder-lock/fixtures/extract-v1.mjs` (lấy file v1 từ commit gốc bằng `git show <base>:<path>` vào thư mục tạm) |

## Test

1. **Tombstone với code v1 thật** (lấy từ commit gốc của track, vì P06–P10 xoá nó): sau `placeFences`, `acquireGatewayLock`, `acquireSessionsLock`, `acquireRunnerLock`, `withAdvanceLock`, `withRunLock` (recover), `withLocalLock` (reconcile), `acquireMainCheckoutLock({lockFile: dispatchLockFile(cwd)})` đều thất bại; ghi cách thất bại (EISDIR, timeout, vòng lặp) trong báo cáo, cái nào treo phải có timeout trong test và vào CHANGELOG.
2. **Thế hệ chặn với code v1 thật:** `tryAcquireAccountLock` trước rào → handle, sau → `null`; `withFileLock(state-lock)` sau rào → `ProviderCapacityLockError`. Chạy thêm trong `bwrap --unshare-pid` nếu máy có.
3. File v1 đang có lúc đặt rào → `v1-lock-present`, không đặt rào cho đường đó, file còn nguyên.
4. Kiểm dừng: một process `node` chạy payload fgOS với cwd trong worktree → blocker; không có → sạch. Process khởi động sau lần quét đầu, trước lần thứ hai → lần thứ hai thấy nó (thay ca `r3-cutover` của Astra).
5. Idempotent: chạy `placeFences` hai lần không lỗi.

Lệnh: `env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID FGOS_HOST_BIN=<build> node --test test/holder-lock/fences-*.test.mjs`.

## Tiêu chí nghiệm thu / rollback

Năm nhóm test xanh trên code v1 thật và process thật. Rollback code: revert. Gỡ hàng rào bằng tay (chỉ khi quay về release trước 4.2): `rm -r` các thư mục có `TOMBSTONE` của đúng các đường trong registry; thế hệ chặn để nguyên và publish thêm một thế hệ có `releasedAt` (lệnh ghi trong runbook P12).
