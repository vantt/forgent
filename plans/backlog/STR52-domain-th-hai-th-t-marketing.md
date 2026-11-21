---
id: STR52
title: "Domain thứ hai THẬT: marketing"
status: proposed
priority: P2
area: general
created: 2026-07-18
---

# Why

(nêu ra 2026-07-18 trong lúc bàn STR50) — invalidate tiền đề trước đó ("hiện chỉ có 1 domain thực"): người dùng có sẵn workflow marketing ở MỘT PROJECT KHÁC và muốn điều phối marketing qua fgOS. Hạ tầng kernel đã chứng minh đa-domain chạy được về nguyên tắc (domain `synthetic` sống song song `coding` hôm nay, STR18 base-workflow+domain-extension đã done), nhưng marketing THẬT còn thiếu: (a) registry entry riêng trong `domains.mjs` (stages/stepMap/transitions cho chu trình marketing, khác `clarify/decompose/executing`), (b) retrofit `discovery.mjs`/`decompose.mjs` — hai module này đang hardcode literal stage-name của coding, domain khác vào `clarify`/`decompose` sẽ bị ghi đè sai (cảnh báo đã có sẵn trong comment `domains.mjs:29-34`), (c) bộ skill nội dung riêng cho domain-extension "marketing" (song song bộ STR50 đang trích cho coding, KHÔNG phải `fgos-routing` — module đó domain-agnostic, không cần đổi), (d) STR51 mở rộng thêm field `domain` vào output classify (chỗ nối tự nhiên — cùng cơ chế, chỉ thêm 1 field). **CÂU HỎI SCOPE CHƯA TRẢ LỜI (quan trọng, quyết định đây là 1 feature hay 2):** project marketing kia dùng CHUNG một store/event-log với fgOS hiện tại (khác domain field trên cùng một hệ), hay là một CÀI ĐẶT fgOS RIÊNG cho project đó? Khuyến nghị: không gộp vào STR50 đang chạy (đã khoá scope hẹp cho coding, mode standard, đang thực thi) — mở feature riêng qua bee-hive/bee-exploring khi câu hỏi scope trên có câu trả lời.

# Done when

Một decision record trả lời rõ câu hỏi scope (chung store hay cài đặt riêng); nếu chung store: registry entry `marketing` thật + retrofit discovery/decompose + bộ skill marketing chạy được một case study thật, domain `coding` không bị ảnh hưởng

# Notes

Migrated from the legacy backlog table. Original status: proposed.
