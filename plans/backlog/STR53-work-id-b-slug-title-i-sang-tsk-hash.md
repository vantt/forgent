---
id: STR53
title: "`work.id` bỏ slug-title, đổi sang `TSK<hash>`"
status: done
priority: P2
area: general
created: 2026-07-18
---

# Why

(chốt tại `docs/platform/documentation/history/id-systems-audit.md#1-bảng-inventory-13-hệ-6-của-fgos-7-của-bee` §1/§2, thảo luận 2026-07-18, làm ĐẦU TIÊN trong nhóm STR53-STR58 — độc lập kỹ thuật, không phụ thuộc STR54-STR58): `generateId()` (`classify.mjs:124`) hiện sinh `slugify(title,≤40 ký tự)+hash` — dài, gần như chép nguyên title (ví dụ thật 44 ký tự trong `.fgos/events.jsonl`). Đổi thành hash-only ngắn (base36 6-8 ký tự), giữ nguyên cơ chế chống trùng đã có. Con (sinh qua `decompose.mjs:245`) dùng `<parentId>-<n>` (n = thứ tự trong lứa con, đệ quy theo `parent` — an toàn tuyệt đối vì `parent` KHÔNG nằm trong `EDITABLE_FIELDS`, `store.mjs:184,232`, không bao giờ đổi sau khi tạo). `TSK` dùng CHUNG cho mọi `kind` — KHÔNG mã hoá kind vào tiền tố, vì `kind` CÓ trong `EDITABLE_FIELDS` (sửa được qua `fgos edit`), mã hoá vào id bất biến sẽ khiến id nói dối sau khi edit; cũng khớp decision ADR0002 (flat work-item model — one item kind, one FSM, loại việc là field, không phải shape id riêng). id CŨ trong log giữ nguyên, không backfill (bất biến). Muốn hiển thị dễ hiểu (đọc nhanh là việc gì) thì ghép slug(title) lúc RENDER (CLI list/trích dẫn), không lưu vào id.

# Done when

...

# Notes

Migrated from the done/declined section of the legacy backlog. Original status: done.
