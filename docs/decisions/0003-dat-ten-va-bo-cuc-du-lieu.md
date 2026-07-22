---
type: explanation
title: 0003 — Đặt tên & bố cục dữ liệu
tags: []
timestamp: 2026-07-22T00:00:00.000Z
source_capture_ids: []
date: 2026-07-14
status: accepted
source_decisions: [55ad2f9f]
relates_specs: [work-state]
---

# 0003 — Đặt tên & bố cục dữ liệu

## Bối cảnh

Cần chốt danh xưng và bố cục dữ liệu trên đĩa cho lớp work-state trước khi viết
code, để mọi area sau này nhất quán và để ranh giới truth/view hiện ra ngay trong
layout.

## Quyết định

- **CLI = `fgos`** (cửa lệnh của sản phẩm).
- **Entity đơn vị việc = `work`.**
- **Data dir = `.fgos/`**, trong đó:
  - `events.jsonl` — **committed vào git = sự thật** (per 0001).
  - `state.json` — **bản chiếu, gitignored** (dựng lại được từ replay, không phải
    sự thật).

## Hệ quả

- **Brand nhất quán** giữa CLI, tài liệu và data dir.
- **Ranh giới truth/view hiện ngay trong layout:** một file được commit (log), một
  file bị ignore (view) — đọc `.gitignore` là thấy đâu là sự thật.
- Vị trí cụ thể của `.fgos/` (đường dẫn, tổ chức con) là quyền quyết định khi thực
  thi, miễn giữ đúng cặp truth-committed / view-ignored ở trên.

Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
