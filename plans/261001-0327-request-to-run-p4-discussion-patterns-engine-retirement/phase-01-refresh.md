---
phase: 1
title: "Làm tươi + mức bảo đảm visibility"
status: pending
priority: P1
effort: "1d"
dependencies: []
---

# Phase 1: Làm tươi + mức bảo đảm visibility

## Overview

Khớp plan với `main` sau P1 + P3; trả lời câu hỏi đã treo từ synthesis: **engine ép visibility ở mức hệ thống file hay chỉ ở mức prompt?** — quyết mức bảo đảm mô hình gọn phải đạt. Lập kịch bản so sánh hai đường cho ca 2, 3.

## Requirements

- Functional:
  - Đọc `src/runner/coordination/session-engine.mjs` (visibility windows, reveal), `legality-facts.mjs`, `actions-projector.mjs`, confinement của assignment engine → kết luận: worker có đọc được artefact pha khác trên đĩa không. Thử thực tế bằng một session architecture panel nhỏ (read-only) nếu cần.
  - Kết luận → yêu cầu cho phase 3, 5 (chỉ `inputs` + context sạch, hay thêm confinement đọc).
  - Kịch bản đo ca 2, 3: cùng câu hỏi, chạy engine và mô hình gọn; chỉ số §0.
  - Liệt kê caller của engine còn lại sau P1–P3 (skill, verb, test, Observe, Rust `coordination-state`).
- Non-functional: chỉ sửa plan.

## Related Code Files

- Modify: `phase-*.md` của plan này.

## Implementation Steps

1. Cổng: P1, P3 merge `main`.
2. Nhánh `plan/261001-request-to-run-p4` + worktree; symlink; GitNexus analyze.
3. Phân tích visibility; ghi kết luận + bằng chứng `file:line` vào `plan.md`.
4. Đếm caller engine; lập danh sách xoá cho phase 6.
5. Viết đề xuất cho 2 câu hỏi mở; gửi owner một lượt.
6. Commit plan.

## Success Criteria

- [ ] Kết luận visibility có bằng chứng; yêu cầu phase 3, 5 cập nhật.
- [ ] Danh sách caller engine đầy đủ; 2 câu hỏi mở có đề xuất.

## Risk Assessment

- Kết luận "engine ép ở mức file" → phase 3/5 thêm confinement đọc; effort tăng, không đổi hướng.
