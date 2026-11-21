---
id: STR58
title: Script `next-doc-id` cho họ "next free integer thủ công"
status: done
priority: P2
area: general
created: 2026-11-21
---

# Why

(Story/Rule/ADR — chốt tại `docs/platform/documentation/history/id-systems-audit.md`, mục gen-id; KHÔNG chặn STR53-STR57, làm sau hoặc song song): tránh trùng khi 2 phiên cùng tự tay chọn số kế tiếp. Đặt trong `repo/scripts/` (fgOS tự sở hữu, không đặt trong bee — theo khung "fgOS tự vận hành" trong `docs/platform/documentation/history/id-systems-audit.md` §Bối cảnh, decision ADR0004 (phạm vi & non-goal — domain đầu là work-state của chính forgent) + STR50), 1 script tham số hoá đọc 1 file + pattern, trả số free kế tiếp; KHÔNG áp dụng cho CTR001-CTR009 (chỉ 9 slot cố định, không cần)

# Done when

...

# Notes

Migrated from the done/declined section of the legacy backlog. Original status: done.
