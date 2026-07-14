---
date: 2026-07-14
feature: phase-1-review-fixes
categories: [review-loop, verification]
severity: P3
tags: [remediation, exit-codes, review-to-fix]
---

# Learnings: phase-1-review-fixes

Entry mỏng có chủ đích: lô remediation 2 cell đóng 4 P2 của review Phase 1; chất liệu phân tích đã nằm trọn trong review session (5 reviewer + probe) và learnings 20260714-phase-1-state-layer — không dựng lại vòng 3-analyst cho một batch mà mọi finding đã được phân tích đối kháng sẵn (ghi rõ deviation này thay vì im lặng).

## What Happened

2 cell, 2 commit (`0126c0b`, `a05d71a`), suite 71→82 test, judge intact, không lệch scope, không bug sản phẩm mới lộ ra từ 5 test lấp lỗ.

## Root Cause / Observation

Vòng review→fix rẻ bất thường vì mọi finding mang sẵn file:line + probe tái hiện: validating chỉ cần xác nhận trên source (0 spike), worker không phải chẩn đoán gì. Chi phí thật của review nằm ở lần đầu; remediation gần như cơ học.

## Recommendation

- Khi lên kế hoạch remediation từ review findings đã probe: discovery L0, không spike — bằng chứng của reviewer là accepted evidence, đừng trả tiền hai lần.
- Checker câu "test hiện hành nào đang khóa hành vi buggy?" đáng thành thói quen ở mọi fix đổi phân loại lỗi — lần này trả lời "không có" là thứ khiến fix an toàn tuyệt đối.
