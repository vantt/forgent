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

Khớp plan với `main` sau P1 + P3; xác nhận mức bảo đảm visibility (red-team mục 14: engine chỉ ép ở mức prompt/context) và lập ledger bất biến an toàn của engine. Lập kịch bản so sánh hai đường cho ca 2, 3.

## Requirements

- Functional:
  - Xác nhận lại kết luận red-team mục 14 (visibility engine chỉ ở mức prompt/context: `drivers/bwrap.mjs:181-189`, `policies.mjs:28,50`) → mức bảo đảm = ngang engine, trừ khi owner chọn khác (câu hỏi mở 3).
  - **Ledger bất biến an toàn** (red-team mục 15/Sec8): liệt kê mọi gate engine đang giữ (`assertMutatingDispatchAllowed` `session-engine.mjs:2135`, `assertNoPortableExecutorPin` `:933`, `READ_ONLY_ROLES`, visibility `:1477,1888-1898`, protocol stamp…) → chủ mới (P1 posture/`bind()`/cổng, Workflow runner) hoặc "retire có owner duyệt"; ghi vào `plan.md`. Phase 6 chỉ xoá khi ledger đóng.
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
5. Viết đề xuất cho 3 câu hỏi mở; gửi owner một lượt.
6. Commit plan.

## Success Criteria

- [ ] Kết luận visibility xác nhận; ledger bất biến an toàn đầy đủ.
- [ ] Danh sách caller engine đầy đủ; 3 câu hỏi mở có đề xuất.

## Risk Assessment

- Owner chọn visibility mức file (câu hỏi mở 3) → thêm phase driver `hostRead: deny`; effort tăng, không đổi hướng.
