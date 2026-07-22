---
type: explanation
title: 0007 — Tiến hoá schema & event
tags: []
timestamp: 2026-07-22T00:00:00.000Z
source_capture_ids: []
date: 2026-07-14
status: accepted
source_decisions: [feed7428]
relates_specs: [work-state, runner]
---

# 0007 — Tiến hoá schema & event

## Bối cảnh

Trạng thái `proposed` (0006) và trường `tier` (0005) **đổi shape dữ liệu** ghi trên
một nhật ký đã committed vào git (0001). Log cũ (viết dưới code cũ) phải tiếp tục
đọc được dưới code mới, nếu không nguyên lý "log là sự thật dựng-lại-được" sụp.

## Quyết định

Ba luật cho mọi tiến hoá schema/event từ đây về sau:

1. **Log đã commit là bất khả xâm phạm.** Không bao giờ chạy migration ghi đè event
   cũ. Sự thật chỉ được thêm, không viết lại.
2. **Replay backward-compatible, CÓ TEST.** Item/event thiếu trường mới nhận
   **default khai báo tường minh**. Cụ thể: log của phiên bản trước phải replay được
   dưới code phiên bản sau — và điều này được một test bảo vệ, không phải giả định.
3. **Mỗi event mang trường schema version** (từ khi luật này có hiệu lực), để code
   đọc biết mình đang replay shape nào.

## Hệ quả

- **Log là hợp đồng tiến-tới:** thêm trường an toàn; đổi ngữ nghĩa thì thêm event
  mới, không sửa event cũ.
- **Test replay là phòng tuyến:** hồi quy tương thích ngược bị bắt bằng test, không
  bằng may rủi.
- **Chi phí:** phải khai default tường minh cho trường mới và duy trì test replay
  xuyên phiên bản — đổi lại là log không bao giờ "mục".

Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
