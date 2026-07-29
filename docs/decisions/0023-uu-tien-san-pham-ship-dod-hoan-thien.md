---
type: explanation
title: 0023 — Thứ tự ưu tiên sản phẩm: ship faster > DoD (result + docs) > hoàn thiện sau ngưỡng
tags: []
timestamp: 2026-07-28T00:00:00.000Z
source_capture_ids: []
date: 2026-07-28
status: accepted
extends: []
relates_specs: []
---

# 0023 — Thứ tự ưu tiên sản phẩm: ship faster > DoD (result + docs) > hoàn thiện sau ngưỡng

## Bối cảnh

User nêu định hướng ưu tiên cho dự án (session `b0010842-aafa-4cf1-9a8a-
6c7f0022d4c7`, 2026-07-28), bản gốc:

1. Ship faster — phải nhanh trước hết.
2. Better docs — thời AI, làm nhanh mà không có docs thì người khó tham gia
   vào tiến trình đảm bảo better result.
3. Better/stable result.

Phản biện: docs không nên đứng thành 1 bậc ưu tiên riêng tách khỏi result —
"on-eyes" (người đọc-hiểu để tham gia được) cần 2 trụ đồng thời, không phải
xếp tầng: **legibility** (docs) và **verifiability** (kiểm được đúng-sai
thật, không dựa lời khai — result đã verify cho được, docs không cho được).
Tách
riêng khiến "ship nhanh + docs tốt nhưng result chưa verify" đọc như đã đạt
bậc 2, dù chưa đủ tin. Gộp lại thành 1 mệnh đề CoS bắt buộc — **DoD** — đúng
kiểu STR73 đã đòi hỏi cho mọi mệnh đề CoS khác (evidence-link bắt buộc, không
chỉ cho feature-closed). Hạ tầng đối chiếu doc↔source đã có sẵn một phần:
`fgos doc-sources <docPath>` (`bin/fgos.mjs:1149`).

## Quyết định

Thứ tự ưu tiên sản phẩm, 3 bậc:

1. **Ship faster** — tốc độ đi trước.
2. **DoD** — result đã verify VÀ docs evidence-linked, cùng một gate (không
   phải 2 bậc riêng: docs không đứng trước hay sau result, mà là điều kiện
   kèm result để tính "xong").
3. **Hoàn thiện sau ngưỡng** (post-threshold polish) — làm result tốt hơn
   mức tối thiểu DoD đã đủ tin, KHÔNG phải mở rộng tính năng/phạm vi.

## Hệ quả

- Việc chỉ được coi "xong" (đủ điều kiện đóng) khi qua bậc 2 — result verify
  + docs evidence-linked cùng lúc; thiếu 1 trong 2 không tính là DoD.
- Bậc 3 (polish) chỉ bắt đầu SAU khi bậc 2 đã qua cho đúng lát cắt đó — không
  trộn lẫn polish vào trong khi DoD còn treo, và polish không được mở rộng
  scope/tính năng mới (khác biệt với feature work thật).
