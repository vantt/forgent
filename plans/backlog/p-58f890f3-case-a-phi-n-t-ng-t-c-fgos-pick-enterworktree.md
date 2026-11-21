---
id: p-58f890f3
title: Case A (phiên tương tác, `/fgOS:pick` + `EnterWorktree`) không có hướng dẫn cho trường hợp root deco
status: proposed
priority: P2
area: general
created: 2026-07-28
---

# Why

Case A (phiên tương tác, `/fgOS:pick` + `EnterWorktree`) không có hướng dẫn cho trường hợp root decompose ra children, mỗi con cần worktree/nhánh RIÊNG (`fgw/<child-id>`), NGAY TRONG CÙNG một phiên đang đứng sẵn trong worktree của root. Phát hiện dogfood thật (decision 0018, item `tsk-1wd`→`tsk-1wd-1`, 2026-07-28): phiên đã `EnterWorktree` vào `fgw/tsk-1wd` (root, lần 1, OK); `pick tsk-1wd-1` tạo tree con `fgw/tsk-1wd-1` thành công (fgOS-side, không lỗi), nhưng `EnterWorktree` LẦN 2 vào tree đó bị harness từ chối — "`/home/vantt/projects/forgentX/.claude/worktrees` does not exist, so `<path>` cannot be a worktree managed by Claude Code" (khác thông báo STR83 "refuses to chain" đã biết cho root-pick, đây là root cause riêng: fgOS tạo worktree ở `/tmp/fgos-worktrees/`, không phải dưới `.claude/worktrees/` mà harness đòi cho một lần switch THỨ HAI trở đi). Scenario doc + `pick`/`fgos-routing` skill chỉ cảnh báo về giới hạn 1-lớp (root không được nested sẵn trong tree khác) — KHÔNG hề nhắc gì tới việc chính root TỰ decompose ra children cần tree riêng trong lúc phiên đang sống. Case B (headless `fgos-runner --once`) không dính lỗi này — mỗi item dispatch ở tiến trình riêng, không có khái niệm phiên-đang-đứng-trong-tree-nào. Workaround dùng tạm: thao tác trực tiếp qua Bash/absolute-path vào tree con thay vì `EnterWorktree`, không dùng cơ chế switch của harness.

# Done when

Case A's skill doc (pick/fgos-routing/hoặc scenario doc riêng) nói rõ: khi root decompose ra children, phiên hiện tại làm gì tiếp — mở phiên mới mỗi con (đúng chuẩn), hay có đường chính thức nào khác (di chuyển bằng path trực tiếp, hay `.claude/worktrees`-hoá worktree của fgOS); dogfood xác nhận một item multi-child chạy hết Case A mà không cần workaround thủ công

# Notes

Migrated from the legacy backlog table. Original status: proposed.
