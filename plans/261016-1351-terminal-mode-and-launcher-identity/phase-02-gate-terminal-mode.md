# Phase 02: gate cách `terminal`

Wave 1. Nhánh `terminal-mode/p02-gate`, worktree `.claude/worktrees/tm-p02`. Phụ thuộc: P00; phần tty chốt sau báo cáo P01. Chủ `packages/run-supervisor/rust/src/gate.rs`.

## Đọc trước

r6 §9.3 điểm 2, 3, 9, 10, đoạn socket; §6.1.1 điểm 2; 6.2 P03 (gate `direct`); báo cáo P01.

## Yêu cầu

1. `--go-socket <path>`: `connect`; lỗi (`ECONNREFUSED`, không tồn tại) → thoát mã 3, không chạy agent. Kiểm peer bằng `SO_PEERCRED` **chỉ uid** (M3). `HELLO` → chờ `GO` (kèm `SCM_RIGHTS`, nhận bằng `MSG_CMSG_CLOEXEC`, rồi vẫn đặt `FD_CLOEXEC` lần nữa trước syscall khác); so `attemptId` + digest.
2. Tty: theo chuỗi đã chốt ở P01 (D6): đưa group của agent làm foreground (`tcsetpgrp`, bỏ qua `SIGTTOU` lúc gọi), trả lại foreground khi agent thoát.
3. Env: `env_clear`, đặt env từ envelope + side file + `identity` (D5); `FGOS_PIDNS_ANCHOR`.
4. Nhánh mồ côi: supervisor EOF **trước** `BRIEF_DELIVERED` → `kill_all` miền, `gate-exit.stoppedBy = orphan`, `cause = abandoned-before-brief`. EOF **sau** → theo dõi `outboxDir` (đường trong GO): thấy `result-N.json` → chờ `orphanSettleMs` (envelope; giá trị theo P01 câu 5) → gửi lệnh thoát? **Không**: gate không biết agent-protocol; gate kết thúc miền (SIGTERM → grace → SIGKILL), `cause = orphan-after-result`. Không có kết quả → tới trần cứng.
5. Cách `terminal` dùng chung phần còn lại của gate 6.2 (pid 1, reap, trần cứng, `gate-exit`).

## File sở hữu

| Hành động | File |
|---|---|
| sửa | `packages/run-supervisor/rust/src/{gate.rs,go_channel.rs}` |
| tạo | `packages/run-supervisor/rust/tests/{gate_terminal_socket.rs,gate_orphan.rs}` |

## Test (process thật, không herdr; herdr thật ở P09)

1. Socket không tồn tại / supervisor đã chết → mã 3, agent không chạy (12.3 ca 2).
2. Supervisor chết khi gate chờ `GO` → EOF, agent không chạy (12.3 ca 3).
3. GO + `SCM_RIGHTS`, supervisor SIGKILL → người lạ `LOCK_SH|LOCK_NB` thất bại khi gate còn chạy, trống sau khi gate thoát (12.3 ca 1).
4. EOF trước `BRIEF_DELIVERED` → miền bị kết thúc, `cause` đúng.
5. EOF sau, outbox xuất hiện → miền kết thúc sau `orphanSettleMs`.
6. Agent không thấy `CLAUDE_CODE_SESSION_ID` dù env cha có; thấy `FGOS_SESSION_ID=att-…`.
7. Rò description qua `SCM_RIGHTS`: agent/cháu không có inode lock.

Lệnh: `cargo test -p fgos-run-supervisor gate`.

## Tiêu chí nghiệm thu / rollback

Bảy ca xanh. Rollback: revert (chưa caller).
