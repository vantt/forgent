---
id: STR73
title: Done-flip của PBI phải KIỂM từng mệnh đề CoS thực-giao, không chỉ "feature tham chiếu đã đóng" — nếu không, PBI có CoS rộng hơn scope feature bị mark `done` NON (premature)
status: proposed
priority: P2
area: general
created: 2026-07-21
---

# Why

(đào tận gốc 2026-07-21 từ ca STR64). **Bằng chứng cơ chế:** luật done-flip của bee trigger theo FEATURE-đóng + khớp-row, KHÔNG theo CoS-thỏa: `bee-scribing/SKILL.md:94` — *"when this scribing run closes a feature that matches a backlog row, flip that row to `done`"*; `bee-compounding/SKILL.md:81` — *"backlog done-flip specifically remains prose-ruled"*. Cột `CoS` (định nghĩa `scribing-reference.md:297` = "the one-line acceptance signal") **tồn tại nhưng KHÔNG bao giờ được đối chiếu** với artifact thực-giao trước khi flip. **Hệ quả cụ thể:** STR64 CoS đòi 3 mệnh đề (taxonomy + tag capture-time + *"≥1 tài liệu end-user tích luỹ qua ĐÚNG skill export"*); feature `compound-learn-enduser-docs` chỉ giao acceptance HẸP của CONTEXT ("≥1 doc tại capture-time") — một SUBSET; done-flip đánh đồng "feature tham chiếu PBI đã xong" = "PBI thỏa CoS" và mark `done` khi bước 3 (export skill) + bước 4 (backfill) chưa có. **Anh em STR72:** cùng lỗi gốc — tin tín hiệu cục bộ (feature-close) mà không reconcile ngược về nguồn thẩm quyền (PBI-CoS). **Áp fgOS y hệt:** cổng `done` fgOS (FSM compound-learn) ép item qua stage nhưng KHÔNG kiểm acceptance/CoS của chính item; một parent có thể `done` khi mới thỏa một phần con/CoS → cùng bug premature-done. **Đề xuất (bee-exploring shape chi tiết):** (1) done-flip đối chiếu TỪNG mệnh đề CoS với artifact thực-giao (evidence-linked), chỉ flip `done` khi mọi mệnh đề thỏa; thỏa một phần → giữ `in-flight` + liệt kê mệnh đề còn thiếu; (2) khi feature-acceptance (CONTEXT) HẸP hơn PBI-CoS, buộc khai rõ "feature này giao slice X của PBI", cấm auto-equate feature-done = PBI-done; (3) trong fgOS: cổng `done` của item kiểm acceptance/CoS của chính item, không chỉ FSM-stage.

# Done when

Một PBI chỉ được flip `done` khi mọi mệnh đề CoS có evidence thực-giao; CoS thỏa một phần giữ `in-flight` và liệt kê phần thiếu; feature giao subset của PBI phải khai rõ slice, không đóng cả PBI. Dogfood: STR64 không tự flip `done` khi bước 3/4 chưa có

# Notes

Migrated from the legacy backlog table. Original status: in-flight.
