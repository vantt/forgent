# Phase 01: đo trên herdr thật trước khi chốt gate trong pane

Wave 1. Nhánh `terminal-mode/p01-measure`, worktree `.claude/worktrees/tm-p01`. Phụ thuộc: P00. Chỉ tạo probe + báo cáo; không sửa production.

## Đọc trước

Kongming vòng 3 câu mở 1, 2, 3; r6 §9.3 điểm 2, 3, 9, 10, §12.3, §15; [S7](../reports/spike-s7-261015-1859-human-opened-pane-identity-observation.md) (codex daemon); [`herdr-round.mjs:98-116`](../../src/runner/dispatch/herdr-round.mjs) (launcher `exec -a`).

## Câu hỏi và cách đo (tab herdr riêng tự tạo, đóng khi xong)

1. **Cha của bwrap:** launcher `exec bwrap … -- sleep` trong pane; đọc `/proc/<bwrap>/stat` ppid, sid, tty. Đóng pane → sandbox chết (`--die-with-parent`)? herdr server restart → chết?
2. **Foreground tty trong namespace:** gate (probe Rust nhỏ dựng trên `fgos-process`) là pid 1 trong `bwrap --unshare-pid --as-pid-1`, spawn `cat` trong group mới, gọi `tcsetpgrp(0, pgid)` (bỏ qua `SIGTTOU`); gõ phím vào pane qua `herdr pane send-text` → `cat` nhận? Thử ba biến thể: không `setsid`; `setsid` + `TIOCSCTTY` (dự kiến thất bại vì tty là ctty của session shell); launcher `exec setsid -c bwrap …` (bwrap làm session leader mới, shell mất tty).
3. **`SCM_RIGHTS` qua thư mục bind:** gate trong sandbox `connect` socket ở `$XDG_RUNTIME_DIR/fgos/<hash>`, nhận fd lock; supervisor SIGKILL → lock vẫn giữ tới khi gate thoát; `SO_PEERCRED` ở gate thấy `pid=0`, `uid` đúng (M3).
4. **Env codex:** pane chạy codex với `FGOS_SESSION_ID=att-x` trong env của gate; lệnh `env` do codex chạy (qua daemon `codex app-server`) có `FGOS_SESSION_ID`? Có `CODEX_THREAD_ID`? Lặp với claude, agy, pi, omp (`!env` hoặc lối shell của CLI, như S7).
5. **Ghi outbox:** mỗi CLI tạo `outbox/result-N.json` bằng một lần ghi hay rename? (`inotifywait -m` trên outbox khi chạy brief nhỏ.)
6. **Lệnh thoát:** mỗi CLI thoát êm bằng lệnh gì (`/exit`, `/quit`, Ctrl-D) và mất bao lâu.

## File sở hữu

| Hành động | File |
|---|---|
| tạo | `tools/terminal-gate-probe/{Cargo.toml,src/main.rs}` (workspace Cargo riêng, như `tools/platform-probe`), báo cáo `plans/reports/<tên từ fgos convention path --json </dev/null>` |

## Tiêu chí nghiệm thu

Sáu câu có số đo hoặc bằng chứng log; báo cáo chọn chuỗi `exec` cho D6 và trả lời câu hỏi mở 1 của plan.md. Dọn: không còn tab/pane/process probe.

## Rủi ro / rollback

Chỉ probe. Nếu câu 2 thất bại cả ba biến thể → dừng P02 phần tty, báo Lead để hỏi anh (câu hỏi mở 1).
