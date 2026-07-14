---
title: Trạng thái `proposed` & vòng đề-xuất → duyệt → merge
date: 2026-07-14
status: accepted
source_decisions: [feed7428]
supersedes: "Tập trạng thái FSM của Phase 1 (spec work-state cập nhật khi đóng feature)"
relates_specs: [work-state, runner]
---

# 0006 — Trạng thái `proposed`

## Bối cảnh

Runner (0005) cho worker sinh kết quả trên **nhánh chưa merge**. Điều đó mở ba lỗ:

1. Một việc B phụ thuộc A có thể chạy trên nền **thiếu code của A** (A mới chỉ đề
   xuất, chưa nhận vào cây chính).
2. Khi kết quả bị **từ chối**, không có lối ra rõ ràng cho item.
3. Trạng thái **chờ-duyệt** không nhìn thấy được trong FSM.

## Quyết định

Thêm trạng thái **`proposed`** vào FSM, với các cạnh:

- `doing → proposed` — goal-check pass, runner ghi `proposed`.
- `proposed → done` — được duyệt/merge.
- `proposed → todo` — **từ chối:** event mang lý do, item quay lại frontier;
  anti-loop max-visits chặn lặp vô hạn.
- `blocked` giữ nguyên hai chiều với `todo`/`doing` (muốn "park" thì dùng
  `todo → blocked` sẵn có).

Ngữ nghĩa:

- **`done` vẫn là trạng thái terminal**, và từ nay nghĩa là **"đã nhận vào cây
  chính"** (không chỉ "worker báo xong").
- **Frontier chỉ mở việc phụ thuộc khi dep thật sự `done`** — nên B không bao giờ
  chạy trên nền thiếu code A.

## Hệ quả

- **Ghép nối qua nhánh an toàn:** phụ thuộc chỉ mở khi dep đã vào cây chính.
- **Chờ-duyệt hiện rõ:** `proposed` là trạng thái nhìn thấy được, không phải giai
  đoạn ẩn.
- **Từ chối có lối ra sạch:** item về `todo` kèm lý do, được anti-loop bảo vệ.
- Record này **supersede** tập trạng thái FSM của Phase 1; spec work-state phản ánh
  tập trạng thái mới.

Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
