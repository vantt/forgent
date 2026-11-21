---
id: wf-coding-cutover
title: "Coding cutover của Workflow case (spec workflow.md R2/N12): Work Unit gọi tên case + activity, khung"
status: proposed
priority: P2
area: workflow-case-ledger-and-admission
created: 2026-11-21
---

# Why

Coding cutover của Workflow case (spec workflow.md R2/N12): Work Unit gọi tên case + activity, khung tại `validateApprove`, rồi xoá trong cùng thay đổi Work step FSM, phần lifecycle của `domains/coding/workflows/feature.yaml` và `fgos workflow operations --step` (L10)

# Done when

Coding chạy trên ledger của case; không còn hai nguồn sự thật cho tiến độ item; `workflow operations` và doctor `work-step-vocabulary` biến mất cùng FSM

# Notes

Migrated from the legacy backlog table. Original status: proposed.
