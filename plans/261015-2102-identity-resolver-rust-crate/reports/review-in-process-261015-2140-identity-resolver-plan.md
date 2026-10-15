# Phản biện trong phiên: plan identity resolver sang Rust

- Ngày: 2026-10-15. Reviewer: agent `code-reviewer` (in-process, sau `dispatch decide --for review --needs-soul --has-live-task-access` → `in-process`). Đọc plan ở commit `baf35ae7b`.
- Kết luận reviewer: hướng đúng; ba lỗ thật (exec trong lock qua lock lồng, cache phá "một process một id", D5 thành luật tìm binary thứ ba). DONE_WITH_CONCERNS.

## Cách Lead xử lý

| # | Mức | Phát hiện | Xử lý | Ở đâu trong plan |
|---|---|---|---|---|
| 1 | high | Lock lồng (`settleClaim`, `claimWork`): khoá cache của prime ngoài (dir thô) khác khoá của `withClaimsLock` (`getMainFgosDir`, realpath) → exec trong `events.lock`; test tmp không bắt được | **Nhận.** Khoá env theo realpath; hai chỗ lồng prime thêm main dir trước lock ngoài; bộ đếm lock cấp process, trượt cache trong lock → `identity-in-lock`; test chạy trên repo git thật có worktree qua symlink | §6 cache, §6.1, §7, §11 |
| 2 | high | Cache theo `(dir, env)` cho hai id nhánh pid trong một process (mất tty khi pane đóng) | **Nhận.** Cache hai tầng: kết quả `pid`/`unresolved` theo khoá env một mình | §6, D3 |
| 3 | high | D5 là luật tìm binary thứ ba; hỏng với worktree `/tmp/fgos-worktrees` | **Nhận.** Module lá `host-bin-path.mjs`, thứ tự `FGOS_HOST_BIN` → activation cạnh `fgosDir` → đi ngược từ cwd; `host-bin.mjs` dùng lại nó | §6, D5, phase 03 |
| 4 | high | Kênh tương thích (`node bin/fgos.mjs`, npm global) mất quyền ghi ngoài project đã activate, chưa ghi ở docs | **Nhận.** Ghi ở AGENTS.md, distribution spec, CHANGELOG. O5 giữ | §12, phase 04 |
| 5 | medium | `FGOS_HOST_BIN` bị host ghi đè và được kế thừa; runbook sai cho commit do verb sinh ra | **Nhận.** Runbook nói "`git commit` trần"; spec ghi kế thừa là nguồn lệch; `host-missing` nêu đường đã thử | §4.2, §6, §8 |
| 6 | medium | Worktree trước 5.1 ghi vào `.fgos` chính bằng resolver cũ sau activate | **Nhận.** Bước runbook catch-up | §14, phase 06 |
| 7 | medium | Drain chỉ claim số là thiếu: id chuỗi đổi khi có cả `CODEX_THREAD_ID` và `CLAUDE_CODE_SESSION_ID` | **Nhận.** Drain mọi claim (12 hôm nay); rò env ghi là giới hạn | §4.2, §14, phase 06 |
| 8 | medium | Doctor chỉ thử đường có `FGOS_HOST_BIN` | **Nhận.** Resolve hai lần, in cả hai binary | §12 |
| 9 | medium | Bảng lỗi thiếu `ENOBUFS`/`EAGAIN`/signal; verb ghi invocation record khi `FGOS_INVOCATION_RECORD_PATH` có mặt | **Nhận.** Map theo `err.code`; bỏ biến đó khỏi env con | §6, §6.1 |
| 10 | low | Thiếu vector sudo `use_pty`, multiplexer không `setsid`, `nohup`; CI runner tự host chung id | **Nhận.** Thêm vector và giới hạn | §4.2, §10 |
| 11 | low | Bản chép regex ở `execution-contract.mjs`; baseline decision-codes có tên file test | **Nhận.** Test đối chiếu contract; sinh lại baseline có kiểm diff | §11 |

Không bác điểm nào. Câu hỏi mở của reviewer:

- "npm global có kèm binary host không?" Không: `package.json` `files` không có binary. Hệ quả đã ghi ở #4.
- "Trượt cache trong lock nên ném hay chỉ ghi chẩn đoán?" Lead chọn **ném** (`identity-in-lock`): verb fail trước khi ghi, sạch; exec âm thầm trong lock chính là lỗi S6 cấm. Đây là quyết định Lead, mời Astra tấn công.
