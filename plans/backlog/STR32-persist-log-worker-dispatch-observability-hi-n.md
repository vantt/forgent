---
id: STR32
title: "Persist log worker dispatch (observability): hiện output worker chỉ console-tail per luật security-p"
status: done
priority: P2
area: general
created: 2026-11-21
---

# Why

Persist log worker dispatch (observability): hiện output worker chỉ console-tail per luật security-panel (loop.mjs output-discipline — KHÔNG persist vào path committed); muốn log file .fgos/logs cần SUPERSEDE quyết định đó tường minh + gitignore + một cửa ghi (single-door .fgos) + đính stdout vào DispatchError cho timeout/spawn-fail (plan-checker STR31 B1/W1/W2 đã map đủ ràng buộc)

# Done when

...

# Notes

Migrated from the done/declined section of the legacy backlog. Original status: done.
