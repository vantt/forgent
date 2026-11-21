---
id: STR40
title: Chế độ vận hành qua herdr (D d3dbe7f5, supersedes ef6ed305 — chốt 2026-07-18, user xác nhận đổi tmux
status: done
priority: P2
area: general
created: 2026-07-18
---

# Why

Chế độ vận hành qua herdr (D d3dbe7f5, supersedes ef6ed305 — chốt 2026-07-18, user xác nhận đổi tmux→herdr vì operator thật đã dùng sẵn herdr): phiên herdr chuẩn 4 pane — (1) runner loop `while … fgos-runner --once … sleep` (đứng trên runner.lock + idempotent, không cần flag mới), (2) `tail -F` log live per-item (đứng trên STR39), (3) cửa người submit/answer/review/approve/reject, (4) dashboard poll `fgos list` + chuông chờ-người gộp một pane (`herdr notification show` native, đúng một lần mỗi lượt việc mới vào `awaiting-human`). **LUẬT CỨNG:** herdr chỉ làm chrome — không bao giờ gọi `agent start`/đọc `agent_status` làm tín hiệu quyết định. Đa pane chung checkout đòi STR35 đóng (đã đóng)

# Done when

...

# Notes

Migrated from the done/declined section of the legacy backlog. Original status: done.
