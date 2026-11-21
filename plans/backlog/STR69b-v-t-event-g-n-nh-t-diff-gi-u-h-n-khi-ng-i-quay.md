---
id: STR69b
title: Vệt event gần nhất + diff giàu hơn khi người quay lại gate (cần chốt lại STR61's own "material" decision trước)
status: proposed
priority: P2
area: general
created: 2026-11-21
---

# Why

— nửa còn lại của STR69. Khác STR69a ở chỗ có thiết kế thật cần chốt: nới `MATERIAL_FIELDS` (`repo/src/state/awaiting-context.mjs:15`, hiện chỉ `title`/`status`) và chọn bao nhiêu event chạm TRỰC TIẾP vào STR61's own "material" decision ("chỉ báo khi thay đổi ảnh hưởng câu hỏi/trả lời gốc, im lặng nếu không") — nới bộ trường = nới định nghĩa "material" mà quyết định đó cố tình giữ hẹp. Cũng là lớp validity-check cho STR70a (changed-since làm lộ leaning stale). Vẫn thuần read-projection, không lật STR46's own foundational decision; scope đợt đầu KHÔNG gồm sibling (trần parent-only).

# Done when

Người mở lại item awaiting-human phiên mới thấy vệt event gần nhất + diff parent giàu hơn; quyết định nới/không-nới `MATERIAL_FIELDS` ghi lại có lý do đối chiếu STR61's own "material" decision

# Notes

Migrated from the legacy backlog table. Original status: proposed.
