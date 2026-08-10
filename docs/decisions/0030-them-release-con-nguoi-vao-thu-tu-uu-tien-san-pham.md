---
type: explanation
title: "0030 — Thêm bậc ưu tiên #2 \"Release con người\" vào thứ tự ưu tiên sản phẩm"
tags: []
timestamp: 2026-08-10T00:00:00.000Z
source_capture_ids: []
date: 2026-08-10
status: accepted
supersedes: [0025]
relates_specs: [runner]
---

# 0030 — Thêm bậc ưu tiên #2 "Release con người" vào thứ tự ưu tiên sản phẩm

## Bối cảnh

`0025` chốt 3 bậc ưu tiên sản phẩm (Ship Faster > DoD > Polish Sau DoD),
nạp always-loaded qua `AGENTS.md`. Trong lúc điều tra `tsk-4b2` (2 stage
`discovery`/`exploring` không thể tới được về mặt cấu trúc), phiên làm
việc liên tục đề xuất gộp các bước nhỏ lại cho gọn (vd gộp bước phân loại
`tier`/`kind`/`risk` vào stage `discovery`) — user chặn lại, chỉ ra một
bậc ưu tiên đã phát biểu nhiều lần từ những phiên làm việc đầu tiên
("từ những ngày đầu", đặc biệt xuyên suốt 3 ngày cuối tuần thảo luận
khái niệm launcher/dispatch/capacity dẫn tới `0026`/`0028`/
`0029`) nhưng chưa từng được ghi thành quyết định sản phẩm đứng riêng —
khiến câu hỏi "có nên gộp không" cứ lặp lại ở nhiều phiên khác nhau.

User chốt lại nguyên văn (2026-08-10):

> "số 1 của chúng ta là Ship Faster, cần phải thêm số 2 là `Release con
> người`. Giải phóng con người khỏi việc ngồi canh và chờ trả lời. Hệ
> thống tự phán đoán tự vận hành ở mức cao nhất có thể và khi thật sự cần
> người sẽ hỏi người, và vì thế nó sẽ thiết kế để collect thành bộ để hỏi
> nhằm mỗi lần con người quay lại là có thể trả lời nhiều nhất những câu
> hỏi và đi, sau đó sẽ quay lại chứ không cần ngồi canh. Vì thế mà hệ
> thống cần có cách hoạt động và tích lũy câu hỏi: chuyện gì làm được thì
> làm, không rõ thì bỏ qua làm mảnh việc khác, tích lũy đủ nhiều câu hỏi
> đợi con người quay lại — chứ không phải câu đó stuck và có những việc
> khác của cùng item có thể giải quyết được trước thì lại không giải
> quyết mà ngồi chờ câu trả lời. Vì vậy cần chia nhỏ tiến trình,
> process/stages/skills thật nhỏ và mịn."
> — real conversation, phiên `tsk-4b2`, 2026-08-10

## Quyết định

Thứ tự ưu tiên sản phẩm, mở rộng từ 3 lên **4 bậc cố định** — bậc dưới
không được ghi đè bậc trên:

1. **Ship Faster** — giao nhanh hơn, không đoán mò, giảm
   friction/better-dev-ux, ít chờ đợi. (nguyên văn `0025`, không đổi)
2. **Release con người** — giải phóng con người khỏi việc ngồi canh chờ
   trả lời. Hệ thống tự phán đoán, tự vận hành ở mức cao nhất có thể; chỉ
   hỏi người khi thật sự cần, và khi hỏi thì **collect thành bộ** — để mỗi
   lần con người quay lại có thể trả lời nhiều nhất số câu hỏi đang treo
   rồi đi tiếp, không phải ngồi canh từng câu một. Hệ quả kỹ thuật bắt
   buộc: một câu hỏi treo **không được** làm nghẽn toàn bộ item khi còn
   phần việc khác của CÙNG item có thể tiến tới mà không cần câu trả lời
   đó — process/stage/skill vì vậy phải chia **nhỏ và mịn**, mỗi mảnh tiến
   hoặc park độc lập, thay vì gộp thành đơn vị to, thô.
3. **DoD** — reproducibly verifiable result + evidence-linked
   documentation. (nguyên văn `0025`, không đổi, lùi từ bậc 2 xuống bậc 3)
4. **Polish Sau DoD** — hoàn thiện sau ngưỡng, không mở scope. (nguyên văn
   `0025`, không đổi, lùi từ bậc 3 xuống bậc 4)

Placement test giữ nguyên như `0025` đã áp (họ hàng luật L8,
`docs/platform-foundations.md`): thứ tự ưu tiên áp dụng MỌI lúc, không
riêng 1 workflow → phải nằm standing sheet (`AGENTS.md`, always-loaded),
không phải chỉ nằm `docs/decisions/`.

## Hệ quả

- `0025` không sửa tại chỗ, chỉ nhận `superseded_by: 0030` (đúng khuôn
  STR72 trỏ-ngược-bắt-buộc, cùng cách `0023` → `0025` đã làm).
- `AGENTS.md`'s pointer 4 dòng cập nhật theo thứ tự mới, trỏ `docs/decisions/0030`.
- Bậc 2 mới này là căn cứ trực tiếp để `tsk-4b2` (wiring `discovery`/
  `exploring`) thiết kế theo hướng stage/skill chia nhỏ, mỗi mảnh
  park/tiến độc lập — không gộp bước phân loại `tier`/`kind`/`risk` vào
  `discovery` dù gộp có vẻ gọn hơn (YAGNI/DRY thuần code không áp được ở
  đây — bậc 2 này ghi đè trực tiếp bản năng "gộp cho gọn" khi thiết kế
  stage/skill của fgOS).
- Chưa làm ở record này (treo lại, không phải phạm vi hiện tại): một check
  tự động xác nhận `AGENTS.md` còn giữ đúng 4 mục theo thời gian (L8 rule
  3, cùng khoảng trống `0025` đã treo cho bậc cũ).
