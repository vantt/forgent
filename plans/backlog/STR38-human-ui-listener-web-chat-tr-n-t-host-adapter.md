---
id: STR38
title: "Human-UI listener (web/chat) trên đất Host Adapter (D b2d18cc7): translator nhận transport (HTTP/cha"
status: proposed
priority: P2
area: general
created: 2026-07-17
---

# Why

Human-UI listener (web/chat) trên đất Host Adapter (D b2d18cc7): translator nhận transport (HTTP/chat) → dịch sang verb → spawn `fgos <verb>` → đọc envelope + exit code; kèm identity gate "ai được nói verb nào" trước khi dịch xuống CTR001 (trust invariant dispatch.mjs: `verify` chạy như shell — intake nguồn chưa kiểm là injection vector); KHÔNG fgos-serve in-process khi CTR002 một-cửa-ghi còn per-process; chiều ra tạm poll list/catchup + so data_hash, CTR008 attention envelope chờ lực kéo thật. Đứng trên STR37. **Chốt qua thảo luận RUL42 (STANCE trí-tuệ-giao-việc — picker luôn cơ học, trí tuệ chỉ vào qua field ghi sẵn hoặc cửa pull take/return) (runner) (per bàn STR42, 2026-07-17):** STR38 bao gồm một verb chat cho người GỢI Ý priority/intent (phục vụ STR7/STR8) — verb này ghi một field GỢI Ý, KHÔNG PHẢI field cuối cùng; bộ não thông minh ở giai đoạn planning/scoring (clarify/decompose hôm nay, STR7/STR8 mai sau) đọc gợi ý này làm một tín hiệu đầu vào rồi TỰ quyết field cuối qua cửa ghi chuẩn — có thể theo đúng gợi ý hoặc đổi khác nếu thấy hợp lý hơn, nhưng gợi ý luôn được cân nhắc, không bao giờ bị bỏ qua và không bao giờ tự nó là giá trị cuối. Giữ đúng RUL42 (runner: STANCE trí-tuệ-giao-việc — đúng một actor ghi field cuối, picker vẫn cơ học)

# Done when

Một người dùng qua web/chat submit được vấn đề, trả lời ask, duyệt approve/reject, VÀ gợi ý priority/intent cho một item — tất cả qua verb CTR001, không đường ghi riêng; caller chưa xác danh không gọi được verb mutation; gợi ý priority/intent của người được planning-stage đọc và cân nhắc (không tự động trở thành field cuối)

# Notes

Migrated from the legacy backlog table. Original status: proposed.
