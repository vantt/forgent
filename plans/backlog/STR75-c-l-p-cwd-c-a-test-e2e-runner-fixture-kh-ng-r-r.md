---
id: STR75
title: "Cô lập cwd của test e2e/runner để fixture không rò rỉ vào working tree repo thật (FIX GỐC của STR65 \"worker: output.txt\")"
status: dropped
priority: P2
area: general
created: 2026-07-21
---

# Why

(truy ra 2026-07-21 khi test `fgos session`). **Root cause đã xác định:** các test dựng "worker giả" ghi `output.txt`="produced by worker" rồi runner commit nó — `test/e2e/{runner-loop,pr-gate,self-improve-loop,synthetic-domain}.test.mjs` + `test/runner/{loop,worktree}.test.mjs` (`writeCommittingExecutor`/`commitOnWorktree`, đường dẫn tương đối theo cwd). Khi cwd không cô lập chặt, artifact rơi vào `repo/` thật; lịch sử `git log -- output.txt` chứng minh tái diễn: `30a9277 worker: output.txt` → `87c8a39 chore: remove ... accidental e2e-fixture artifact` → `595db87 worker: output.txt` (thêm lại). Đây là nguồn "worker: output.txt" auto-commit mà STR65 từng ghi "source chưa xác định". **Đề xuất (bee-exploring/small shape):** mọi test tạo artifact/commit trong temp/throwaway checkout riêng (mkdtemp) và tự dọn; hoặc runner-trong-test bị chặn commit ra ngoài worktree được cấp.

# Done when

...

# Notes

Migrated from the done/declined section of the legacy backlog. Original status: declined.
