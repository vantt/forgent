---
type: explanation
title: 0025 — Thứ tự ưu tiên sản phẩm (chi tiết hoá 0023), nạp always-loaded qua AGENTS.md
tags: []
timestamp: 2026-07-30T00:00:00.000Z
source_capture_ids: []
date: 2026-07-30
status: accepted
supersedes: [0023]
superseded_by: 0030
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

## Làm rõ phạm vi "ai" ship faster (bổ sung 2026-08-05)

Bối cảnh gốc ở trên đã tự nêu câu hỏi ("chỉ code, hay cả luồng làm việc
người-agent") nhưng quyết định lúc đó chỉ chốt NGUYÊN VĂN 3 mục, không trả
lời câu hỏi "ship faster — CỦA AI". Một phiên làm việc thật (`tsk-66o`, D5
— mức miễn-kiểm cho `frozen-judge` khi item không khai footprint) hiểu sai
thành "ship faster = fgOS tự triển khai tính năng rẻ/nhanh hơn", khuyến
nghị theo hướng đó — SAI. User chốt lại tường minh:

> "ship faster nghĩa là các project sử dụng tool này để ship phải ship
> được faster (không loại trừ fgos) tuy nhiên nếu tập trung ship fgos
> nhanh hơn mà làm các sản phẩm dùng nó không faster được là không đúng."

**Nguyên văn 3 mục ở "Quyết định" KHÔNG đổi.** Làm rõ thêm, không diễn
giải lại chữ:

- "Ship Faster" đo tốc độ ship của **project ĐANG DÙNG fgOS** để ship sản
  phẩm của họ (agent + người vận hành fgOS trên một repo thật) — KHÔNG
  phải tốc độ tự thân team fgOS build/ship một tính năng của chính fgOS.
- fgOS không bị loại trừ — khi chính fgOS là "project đang ship" (dogfood,
  như repo này), tiêu chí vẫn áp y hệt cho NGƯỜI DÙNG fgOS-trên-fgOS.
- Khi một lựa chọn thiết kế làm fgOS rẻ/nhanh hơn để tự triển khai NHƯNG
  khiến agent/dev đang dùng fgOS trên project thật chậm hơn (noise đọc
  advisory, chờ gate, friction thao tác) — **chọn cái giúp project dùng
  fgOS nhanh hơn**, không phải cái làm fgOS rẻ hơn để build. Chi phí xây
  dựng của chính fgOS nằm ở bậc "Effort to port"/F-score khi cân nhắc
  triển khai, không phải ở tiêu chí Ship Faster này.

Placement test giữ nguyên như bản gốc (standing sheet, `AGENTS.md`, mọi
agent thấy trước khi chạm code) — làm rõ này áp dụng ngay khi đọc, không
cần đợi review threshold riêng.
