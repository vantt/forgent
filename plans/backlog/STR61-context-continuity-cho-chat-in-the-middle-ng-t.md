---
id: STR61
title: Context continuity cho chat-in-the-middle & ngắt quãng dài khi item bị chia async
status: done
priority: P2
area: general
created: 2026-07-19
---

# Why

(nêu ra 2026-07-19, kèm 2 câu hỏi mở của người dùng khi cung cấp thêm input cho STR38/STR46): (1) work item bị chia nhỏ thành task con độc lập (async) — bối cảnh trao đổi người-hệ thống có bị giới hạn theo từng task con, không gộp được bối cảnh parent/sibling khi cần hỏi-đáp người; (2) trao đổi ngắt quãng dài (người trả lời rồi vắng nhiều giờ mới quay lại) — giữ session/bối cảnh trọn vẹn thế nào để chất lượng trao đổi không giảm. Người dùng tự nhận KHÔNG vướng ở cổng giao tiếp/transport (STR46/STR38 — cho là không phức tạp), CHỈ vướng ở lớp NỘI DUNG bối cảnh chảy QUA cổng đó — STR61 tách riêng đúng ranh giới này. Liên quan STR19 (async-human-gate: item đậu `awaiting-human`, câu hỏi/trả lời là một cặp ghi log, không timeout, không có khái niệm session/transcript) và STR48 (attention channel sống ở daemon-consumer, core vẫn passive). Chưa có khái niệm "sibling" trong data model hiện tại (`work-state.md:864` chỉ có `parent`/`deps`/`blocks`) — cần chốt qua exploring. **Chốt qua bee-exploring 2026-07-19 (`docs/history/str61-chat-context-continuity/CONTEXT.md`):** bối cảnh dựng lại từ state/log mỗi lần đọc, không lưu transcript; tự động kèm đúng 1 cấp cha (không sibling); chỉ báo "đã đổi" khi thay đổi ảnh hưởng câu hỏi/trả lời gốc, im lặng nếu không

# Done when

...

# Notes

Migrated from the done/declined section of the legacy backlog. Original status: done.
