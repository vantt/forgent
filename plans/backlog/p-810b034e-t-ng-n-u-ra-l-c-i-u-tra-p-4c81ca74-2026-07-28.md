---
id: p-810b034e
title: "Ý tưởng nêu ra lúc điều tra `p-4c81ca74` (2026-07-28, dogfood `tsk-1wd`): `bin/fgos.mjs` là cửa CLI"
status: proposed
priority: P2
area: general
created: 2026-07-28
---

# Why

Ý tưởng nêu ra lúc điều tra `p-4c81ca74` (2026-07-28, dogfood `tsk-1wd`): `bin/fgos.mjs` là cửa CLI duy nhất cho mọi verb, nhưng KHÔNG có tầng kiểm cú pháp/đầu vào chung nào ghi lại NƠI GỌI SAI khi một lời gọi verb bị sai (thiếu flag bắt buộc, id không hợp lệ, cwd sai khiến verb đọc nhầm store — như `p-af05e742`/`p-4c81ca74` từng gặp) — lỗi hiện chỉ trồi lên như StoreError/exit-code tại điểm gọi, KHÔNG có provenance (session nào, skill nào, lệnh gốc nào) được ghi lại để soi lại sau. Khác root cause với `p-af05e742` (đó là thiếu ngữ cảnh TRONG prompt gửi model, không phải cú pháp gọi binary sai) — tách riêng theo đúng ranh giới root cause. Chưa rõ hình dạng cụ thể (guard wrapper quanh spawn? log riêng caller-id vào `.fgos/`? convention đặt tên session/skill để tự khai báo?) — cần `fgos-coding-exploring` thật cho item này trước khi thi công, không tự quyết kiến trúc ở đây.

# Done when

Một quyết định rõ hình dạng cơ chế kiểm-đầu-vào (nếu làm) + bằng chứng dogfood: một lời gọi verb sai cú pháp/cwd được ghi lại kèm nơi gọi (session/skill/lệnh gốc), không chỉ lỗi exit-code trần tại điểm gọi

# Notes

Migrated from the legacy backlog table. Original status: proposed.
