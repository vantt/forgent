---
type: explanation
title: 0025 — Thứ tự ưu tiên sản phẩm (chi tiết hoá 0023), nạp always-loaded qua AGENTS.md
tags: []
timestamp: 2026-07-30T00:00:00.000Z
source_capture_ids: []
date: 2026-07-30
status: accepted
supersedes: [0023]
relates_specs: [runner]
---

# 0025 — Thứ tự ưu tiên sản phẩm (chi tiết hoá 0023), nạp always-loaded qua AGENTS.md

## Bối cảnh

`0023` đặt 3 bậc ưu tiên nhưng bậc 1 ("ship faster") không nói rõ tốc độ gì
— chỉ code, hay cả luồng làm việc người-agent. User chốt lại nguyên văn 3
mục (2026-07-30) — ghi đúng, không diễn giải lại:

1. **Ship Faster**: giao nhanh hơn, không đoán mò, giảm friction/better-dev-ux,
   ít chờ đợi.
2. **DoD**: reproducibly verifiable result + evidence-linked documentation.
3. **Polish Sau DoD**: hoàn thiện sau ngưỡng, không mở scope.

User hỏi thêm: đưa quyết định này lên đầu, luôn nạp cho mọi agent. Áp
placement test của `0008`'s họ hàng luật L8 (`docs/platform-foundations.md`):
"rule này có cần hold khi không workflow nào đang chạy không?" — có (thứ tự
ưu tiên áp dụng MỌI lúc, không riêng 1 workflow) → phải nằm standing sheet
(`AGENTS.md`, nạp mọi turn qua `CLAUDE.md`'s `@AGENTS.md`), không phải nằm
riêng `docs/decisions/` (nạp theo nhu cầu, dễ bị bỏ qua).

## Quyết định

Nguyên văn 3 mục trên là quyết định — không đổi từ ngữ. Thứ tự CỐ ĐỊNH,
bậc dưới không được ghi đè bậc trên.

Đặt pointer ngắn (3 dòng) vào `AGENTS.md` ngay đầu file, trước "Before
touching code" — always-loaded, mọi agent thấy trước khi chạm code bất kỳ
việc gì. Toàn văn bối cảnh/hệ quả vẫn ở record này (`docs/decisions/0025`);
`AGENTS.md` chỉ giữ 3 dòng + link, không lặp lại lý lẽ.

## Hệ quả

- `0023` không sửa tại chỗ, chỉ nhận `superseded_by: 0025`.
- `AGENTS.md` có thêm section priority-order — mọi agent mở repo đọc được
  ngay, không cần biết tới `docs/decisions/` mới thấy.
- L8's rule 3 (anchor-suite: mỗi doctrine rule cần cụm từ assert tự động)
  CHƯA làm ở record này — chưa có check tự động xác nhận `AGENTS.md` còn
  giữ đúng 3 mục theo thời gian. Treo lại, không phải phạm vi yêu cầu hiện
  tại.
