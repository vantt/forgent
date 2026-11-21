---
id: STR50
title: Extract/induct bộ skill-workflow kiểu bee vào fgOS — bee gốc GIỮ NGUYÊN, không modify
status: done
priority: P2
area: general
created: 2026-07-18
---

# Why

(thảo luận 2026-07-18; là STR5 mở lại đúng hẹn — per bee-fgos-decision: "mở lại khi STR35 đóng", STR35 đã đóng): fgOS có xương sống cơ học mạnh (event-sourced, single-door, CAS, goal-check không-tin-lời, anti-loop, session worktree) nhưng trí tuệ workflow mỏng (3 điểm biên headless one-shot); bee có workflow trí-tuệ-giàu (exploring/planning/validating/reviewing nhiều vòng, gate) trên nền JSON + kỷ luật. Việc: **trích/chưng cất bộ skill workflow vào fgOS như một layer sản phẩm** (induct vào repo fgOS, KHÔNG sửa bee đang chạy ở xưởng), bản inducted đi qua cửa chính danh: phiên skill-based `take`/`return` (STR26 — RUL42 (STANCE trí-tuệ-giao-việc — picker cơ học vĩnh viễn) (runner) ghi rõ cửa pull là ngoại lệ chính danh cho trí tuệ vào hệ) làm bề mặt nhận-trả việc; gate-người map vào `awaiting-human` + ask/answer (STR19); cell ≈ work-item con mang `parent` (STR16); goal-check vẫn tự verify. **Một cửa ghi duy nhất:** bản inducted KHÔNG mang sổ state song song kiểu `.bee/` — work-item state chỉ qua verb CTR001/CTR002. **Kèm vòng học liên tục:** đăng ký bee làm **reference source của distillery** (delta scan theo cursor) — theo dõi bee tiến hóa ở xưởng để bản inducted học tiếp từ nó, không phải chép-một-lần-rồi-lệch

# Done when

...

# Notes

Migrated from the done/declined section of the legacy backlog. Original status: done.
