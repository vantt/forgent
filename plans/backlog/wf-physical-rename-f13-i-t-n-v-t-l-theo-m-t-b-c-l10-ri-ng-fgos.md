---
id: wf-physical-rename
title: "F13: đổi tên vật lý theo một bước L10 riêng (`fgos-runner`, `src/runner/**`) sau khi lõi case đã lan"
status: proposed
priority: P2
area: workflow-case-ledger-and-admission
created: 2026-10-24
---

# Why

F13: đổi tên vật lý theo một bước L10 riêng (`fgos-runner`, `src/runner/**`) sau khi lõi case đã land; cùng đợt, theo D-ADR0073 (owner 2026-10-24): đổi id và thư mục cho một chữ một tầng — `wf-run-…`→`case-…`, `.fgos/workflow-runs/`→`.fgos/cases/`, `unit-run-…`→`unit-…`, chữ "attempt" trong Run Supervisor (`attempt.lock`, `settle-attempt`, `run-attempts-stuck`…)→"run"; **không đổi lệnh nào** (`fgos run`, `fgos workflow …` giữ nguyên); có migration cho sổ case và record của mọi project; phần loop/pattern đổi trong Phần A của `plans/261023-1619-collaboration-degree-spec/`

# Done when

Tên "runner" đứng một mình không còn chỉ ba thứ khác nhau; mọi caller chuyển trong một đợt

# Notes

Migrated from the legacy backlog table. Original status: proposed.
