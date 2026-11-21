---
id: STR72
title: Decision-supersession phải đồng bộ NGƯỢC về artifact nguồn (ticket/backlog/spec/CONTEXT), không chỉ ghi decision-log — nếu không, framing đã-bị-supersede tái xuất và tái sinh kết luận sai
status: done
priority: P2
area: general
created: 2026-07-21
---

# Why

(đào tận gốc 2026-07-21 từ hiện tượng "mọi phiên đọc STR64 là bee-tooling dù đã chốt fgOS"). **Root cause:** khi một quyết định đổi chiều (supersede), thay đổi rơi vào decision-log NHƯNG không lan về artifact nguồn đã gieo quyết định gốc — dòng STR64 trong `backlog.md` vẫn viết như bee-tooling, nên mọi phiên vào bằng entry-point tự nhiên (ticket ở mặt chữ) tái-suy kết luận cũ; bản sửa (`df90b761`) nằm ở artifact RIÊNG (log) họ không đối chiếu, và ban đầu còn chỉ "narrated in prose", chưa gọi CLI verb → chuỗi decision máy-đọc còn không thấy supersession một thời gian (phải tới `27052dd7` mới formal). Source cũ là attractor mạnh hơn một correction chôn trong log. **Áp cho fgOS y hệt:** một work-item đổi framing mà ticket/`docs/specs` không cập nhật → phiên fgOS tái-suy kết luận cũ; đây là năng lực compound-engineering fgOS phải có, không chỉ vá bee. **Đề xuất (cần bee-exploring shape chi tiết):** (1) supersede kèm bước bắt buộc "reconcile source artifacts" — cập nhật/đánh dấu ticket/backlog/spec/CONTEXT mà decision-bị-supersede đã trích; (2) hoặc backlog-row/spec mang con trỏ tới decision cai-quản, để người đọc thấy inline "framing dòng này đã bị supersede bởi X"; (3) consistency-check (grooming) phát hiện row/spec mâu thuẫn với một active decision đã supersede framing gốc; (4) supersede LUÔN qua CLI verb máy-đọc, không chỉ prose.

# Done when

...

# Notes

Migrated from the done/declined section of the legacy backlog. Original status: done.
