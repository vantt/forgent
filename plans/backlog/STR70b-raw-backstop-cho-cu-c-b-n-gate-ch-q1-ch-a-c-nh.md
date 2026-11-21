---
id: STR70b
title: Raw backstop cho cuộc bàn ở gate — CHỜ Q1 (chưa có nhà hợp lệ)
status: proposed
priority: P2
area: general
created: 2026-07-21
---

# Why

— nửa bị-chặn của STR70. Giữ lượt thô để khi người phủ định distillate thì đưa lại nguyên văn, drop khi chốt. Đào 2026-07-21 (`CONTEXT.md` Q1) LOẠI O1 (raw thành event core): log fgOS append-only bất khả xâm phạm (L3 `platform-foundations.md:73-74`; RUL11 (tiến hóa schema) `work-state.md`; KHÔNG cơ chế redact/prune/TTL nào trong `repo/src`) → "drop khi chốt" bất khả thi. Còn lại: O2 (kho phụ trong core, không phải log) vướng L1 (`platform-foundations.md:17-20` — mọi dữ liệu bền phải là log HOẶC state; raw không thuộc ô nào) ⇒ phải mở L1; O3 (daemon-consumer) đúng nhà theo decision `0014` nhưng lớp đó CHƯA TỒN TẠI (không file daemon/consumer trong `repo/src`|`repo/bin`; STR46/STR48 còn proposed). HOÃN có chủ đích: quyết bằng số đo thật (người phủ định distillate bao nhiêu lần) chứ không suy luận; luồng phủ định không gãy khi thiếu raw vì distillate vốn không-authoritative.

# Done when

Q1 chốt được nhà cho raw (O2 mở L1 / O3 chờ consumer) dựa trên tần suất phủ định thực tế; tới lúc đó STR70b nằm chờ, không chặn STR70a

# Notes

Migrated from the legacy backlog table. Original status: proposed.
