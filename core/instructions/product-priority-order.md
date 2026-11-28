---
id: product-priority-order
kind: law
owner: core
scope: repo
mode: append
specificity: 10
title: Product priority order
description: The fixed product priority order - ship faster, release people from waiting, definition of done, polish after done - and when to ask a person (D-ADR0030)
lifecycle: live
valid_from: 2026-11-26
related:
  - "[[owner-communication]]"
  - "[[mission-boundary]]"
---

# Product priority order

Source: D-ADR0030, docs/platform/runner/decisions/h-36d872fbb0e5.md#d-adr0030-thêm-bậc-ưu-tiên-2-release-con-người-vào-thứ-tự-ưu-tiên-sản-phẩm.

1. **Ship Faster** — giao nhanh hơn, không đoán mò, giảm friction/better-dev-ux, ít chờ đợi.
2. **Release con người** — giải phóng con người khỏi việc ngồi canh chờ trả lời. Hệ thống tự phán đoán, tự vận hành ở mức cao nhất có thể; chỉ hỏi người khi thật sự cần, và khi hỏi thì gom thành bộ để mỗi lần người quay lại trả lời được nhiều nhất rồi đi tiếp; mỗi câu theo mẫu câu hỏi quyết định (`core/skills/_shared/owner-communication.md#decision-question`). Tự quyết trong khung đã duyệt (phạm vi + ngân sách ghi lúc duyệt); sắp vượt khung thì dừng và hỏi theo mẫu. Một câu hỏi treo không được nghẽn phần việc khác của cùng item còn tiến được — stage/skill vì vậy phải chia nhỏ, mịn, mỗi mảnh park/tiến độc lập.
   Khi phân tích của chính agent đã chọn rõ một phương án, hãy quyết và báo cáo, không hỏi lại. Chỉ hỏi khi các phương án thật sự ngang nhau hoặc phụ thuộc vào ý định của người dùng.
3. **DoD** — reproducibly verifiable result + evidence-linked documentation.
4. **Polish Sau DoD** — hoàn thiện sau ngưỡng, không mở scope.

Tốc độ ở mục 1 là tốc độ ship của **project đang DÙNG fgOS** (fgOS không loại trừ khi tự dogfood) — không phải tốc độ tự thân team fgOS build một tính năng của chính fgOS. Đừng chọn phương án rẻ để fgOS tự triển khai nếu nó làm project dùng fgOS chậm hơn.

Thứ tự cố định — bậc dưới không ghi đè bậc trên. Chi tiết: docs/platform/runner/decisions/h-36d872fbb0e5.md#d-adr0030-thêm-bậc-ưu-tiên-2-release-con-người-vào-thứ-tự-ưu-tiên-sản-phẩm's "Lịch sử quyết định" § D-ADR0030 (mở rộng D-ADR0025; narrative đầy đủ, docs/decisions/*.md corpus đã retired tsk-1lv-4).
