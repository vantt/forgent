# Phase 07: cutover advance, recovery (phạm vi run)

Wave 2. Nhánh `holder-lock/p07-advance-recovery`, worktree `.claude/worktrees/hl-p07`. Phụ thuộc: P03. Luật chung: [phase 06](phase-06-cutover-gateway-sessions-runner.md#luật-chung-của-mọi-phase-cutover-p06p10).

## Yêu cầu

| Lock | Chỗ đổi | Hôm nay | v3 | Xoá |
|---|---|---|---|---|
| advance | `acquireAdvanceLock` / `withAdvanceLock` ([`workflow/runner.mjs:783,833,904`](../../src/workflow/runner.mjs)) | `open('wx')` rồi ghi pid, ân hạn mtime 2 s, dọn không đọc lại | mutex `<runDir>/locks/advance.lock` | `ADVANCE_LOCK_FILE`, nhánh `wx`, ân hạn mtime, dọn holder |
| recovery | `withRunLock` ([`recover.mjs:152-153`](../../src/verbs/dispatch/recover.mjs)) | `open('wx')` + pid; file rỗng sau crash kẹt mãi | mutex `<runDir>/locks/recovery.lock` | `readLockHolderPid` (`:141`), nhánh `wx` |

Lock nằm trong thư mục run: xoá run thì xoá lock; kiểm inode sau acquire lo trường hợp run bị xoá khi còn người giữ (luật 6.1.1 điểm 6).

## File sở hữu

| Hành động | File |
|---|---|
| sửa | `src/workflow/runner.mjs` (khối advance lock `:783-920`), `src/verbs/dispatch/recover.mjs` (khối `withRunLock`) |
| sửa | `test/workflow/workflow-runner.test.mjs`, `test/verbs/dispatch-recovery.test.mjs` |

## Test

Holder advance bị SIGKILL ngay sau acquire → advance kế vào ngay (ca file rỗng kẹt mãi của v1, kiểm kê §2.2, phải hết). Run dir bị xoá khi một process còn giữ → acquire mới không lẫn inode. Hẹp: `env -u ... FGOS_HOST_BIN=<build> node --test test/workflow/workflow-runner.test.mjs test/verbs/dispatch-recovery.test.mjs`; rồi full `npm test`.

## Dòng CHANGELOG

- Fixed: advance và recovery lock không còn kẹt mãi khi holder chết giữa lúc tạo file.

## Rollback

Revert từng commit.
