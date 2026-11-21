---
id: STR27
title: "Orchestrator service tầng fleet: registry worker + heartbeat + push assignment + lease/liveness + ca"
status: proposed
priority: P2
area: general
created: 2026-11-21
---

# Why

Orchestrator service tầng fleet: registry worker + heartbeat + push assignment + lease/liveness + capacity + giao thức/auth cho worker từ xa — đắp TRÊN cùng event log (per stage-decompose: pull là móng, không đập lại)

# Done when

Chỉ mở khi có nhu cầu fleet thật (worker từ xa/luôn-bật); thiết kế đứng trên log + claim sẵn có

# Notes

Migrated from the legacy backlog table. Original status: proposed.
