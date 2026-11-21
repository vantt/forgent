---
id: STR88
title: Bộ plugin `/fgOS:*` mới bọc 2/31 verb (`submit`, `pick`) — thêm vài verb wrapper mới cho tiện thao tác/theo dõi/kiểm tra, không cần phủ hết
status: done
priority: P2
area: general
created: 2026-07-23
---

# Why

(đề xuất người dùng 2026-07-23) — quét `node repo/bin/fgos.mjs --help` ra đủ 31 verb CLI, nhóm theo chức năng: **thao tác/mutation (20):** `init, add, submit✓, discover, move, compound, edit, ask, answer, decision, rebuild, repair, take, pick✓, return, review, approve, reject, catchup, evolve, session`; **theo dõi/read (5):** `list, ready, stale, rollup, triage`; **kiểm tra/read (6):** `check, graph, conflicts, docs-index, doc-sources`. Chỉ `submit` và `pick` có wrapper `/fgOS:*` hiện nay (`repo/plugins/fgOS/skills/{submit,pick}/SKILL.md`) — mọi verb khác người dùng phải tự gõ `node repo/bin/fgos.mjs <verb>` trần, không qua plugin. **Yêu cầu người dùng:** thêm verb wrapper mới, giới hạn ở 3 nhóm chức năng thao tác/theo dõi/kiểm tra — KHÔNG cần bao phủ đầy đủ 31 verb. **Danh sách verb cần làm (đã chốt với người dùng 2026-07-23, 10 verb):** thao tác — `move, return, ask, answer`; theo dõi — `ready, stale, rollup`; kiểm tra — `check, graph, conflicts`.

# Done when

...

# Notes

Migrated from the done/declined section of the legacy backlog. Original status: done.
