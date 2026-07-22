---
type: explanation
title: 0004 — Phạm vi & non-goal
tags: []
timestamp: 2026-07-22T00:00:00.000Z
source_capture_ids: []
date: 2026-07-14
status: accepted
source_decisions: [9ac6ca50, 0790031c]
relates_specs: [work-state, system-overview]
---

# 0004 — Phạm vi & non-goal

## Bối cảnh

Trước khi xây lớp state, cần chốt hai biên: nó phục vụ *ai trước*, và nó *quan hệ
thế nào* với harness (bộ công cụ điều phối) đang được dùng để phát triển chính
forgent. Không chốt hai biên này thì phạm vi trôi và dễ xây thừa.

> Ghi chú viết lại: quyết định gốc phát biểu qua quan hệ với harness phát triển nội
> bộ của dự án. Ở đây viết thuần theo sản phẩm — "harness phát triển" — không phụ
> thuộc tên công cụ cụ thể nào.

## Quyết định

1. **Domain đầu tiên của lớp state là work-state của chính forgent** — việc của
   repo: item, trạng thái, quyết định. Các consumer khác (ví dụ vùng học từ nguồn
   tham chiếu) **đến sau**, không thiết kế cho chúng ở bước đầu.
2. **Non-goal — chạy song song, không thay thế, không interop:** forgent chạy **song
   song** với harness phát triển đang dùng, **không thay thế nó và không interop**.
   Việc thay thế harness chỉ được **mở lại khi forgent chạm ngưỡng-có-tên**: một agent
   lạ tự tìm được việc kế tiếp từ chính state của forgent.

## Hệ quả

- **Scope bước đầu nhỏ:** không phải cover ngay các cơ chế điều phối nặng; tập trung
  chứng minh work-state tự-quản trước.
- **Ngưỡng mở-lại rõ ràng, không trôi:** "thay harness" là một quyết định có điều
  kiện đặt tên trước, không phải thứ lén mở rộng dọc đường.

Đổi quyết định này = supersede bằng record mới, không sửa tại chỗ.
