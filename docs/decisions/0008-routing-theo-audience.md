---
type: explanation
title: 0008 — Routing theo audience của từng interface
tags: []
timestamp: 2026-07-22T00:00:00.000Z
source_capture_ids: []
date: 2026-07-13
status: accepted
source_decisions: [14ebeea9]
relates_specs: [runner, system-overview]
---

# 0008 — Routing theo audience của từng interface

## Bối cảnh

forgent có nhiều interface (giữa các bước trong một chuỗi agent, và giữa hệ thống
với các consumer bên ngoài). Cám dỗ là chọn **một** kiểu giao tiếp (một khuôn:
hoặc tất cả bằng văn xuôi, hoặc tất cả bằng dữ liệu cấu trúc) rồi áp toàn cục. Mỗi
khuôn đúng cho một loại người-đọc và sai cho loại kia.

## Quyết định

Chọn kiểu routing **theo audience của TỪNG interface**, không toàn cục:

- **prose-handoff** (bàn giao bằng văn xuôi) cho **agent ↔ agent trong một chuỗi**:
  người đọc là một agent hiểu ngôn ngữ, cần bối cảnh và ý định.
- **data / exit-code / decision-table** (dữ liệu, mã thoát, bảng quyết định) cho
  **consumer không-chắc-là-agent**: người đọc có thể là script/máy, cần hợp đồng
  chặt và phân giải được không mơ hồ.

## Hệ quả

- **Mỗi interface mang đúng hợp đồng cho người đọc nó** — không ép một agent phải
  parse bảng cứng, cũng không ép một script phải hiểu văn xuôi.
- **Quy tắc quyết định rõ:** hỏi "ai đọc đầu kia?" trước khi chọn định dạng, thay
  vì áp một khuôn quen tay lên mọi biên.

Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
