# Phase 07: cutover advance, recovery (họ `repo-files`, phạm vi run)

Wave 3. Nhánh `holder-lock/p07-advance-recovery`, worktree `.claude/worktrees/hl-p07`. Phụ thuộc: P03, P04. Luật chung: [phase 06](phase-06-cutover-gateway-sessions-runner.md#luật-chung-của-mọi-phase-cutover-p06p10).

## Yêu cầu

| Lock | Chỗ đổi | Hôm nay | v3 |
|---|---|---|---|
| advance | `acquireAdvanceLock` / `withAdvanceLock` ([`workflow/runner.mjs:783,833,904`](../../src/workflow/runner.mjs)) | `open('wx')` rồi ghi pid, ân hạn mtime 2 s, dọn không đọc lại | mutex run-scope tại `<runDir>/locks/advance.lock`; đặt tombstone lười ở `advance.lock` cũ của run; bỏ ân hạn mtime (r4: không dùng mtime) chỉ trên đường v3 |
| recovery | `withRunLock` ([`recover.mjs:152-153`](../../src/verbs/dispatch/recover.mjs)) | `open('wx')` + pid, file rỗng sau crash kẹt mãi | mutex run-scope `<runDir>/locks/recovery.lock`; tombstone lười |

Lock run-scope nằm trong thư mục run: xoá run thì xoá lock (kiểm inode sau acquire, luật 6.1.1 điểm 6).

## File sở hữu

| Hành động | File |
|---|---|
| sửa | `src/workflow/runner.mjs` (khối advance lock `:783-920`), `src/verbs/dispatch/recover.mjs` (khối `withRunLock`) |
| sửa | `test/workflow/workflow-runner.test.mjs`, `test/verbs/dispatch-recovery.test.mjs` |

## Test

- Hai chế độ cho hai file test trên.
- v3: holder advance bị SIGKILL ngay sau acquire (trước khi ghi gì) → advance kế vào ngay; đây là ca file rỗng kẹt mãi của v1 (kiểm kê §2.2), phải hết ở v3.
- Run dir bị xoá khi một process còn giữ fd → acquire mới tạo file mới, kiểm inode không lẫn.
- Lệnh: `env -u ... FGOS_HOST_BIN=<build> node --test test/workflow/workflow-runner.test.mjs test/verbs/dispatch-recovery.test.mjs`.

## Dòng CHANGELOG

- Fixed: sau khi bật `repo-files`, advance và recovery lock không còn kẹt mãi khi holder chết giữa lúc tạo file.

## Rollback

Revert từng commit; họ đã bật thì revert cutover trước.
