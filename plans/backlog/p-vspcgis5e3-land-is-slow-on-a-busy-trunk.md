---
id: p-vspcgis5e3
title: "Land is slow on a busy trunk: every retry runs every gate again in a candidate that compiles the whole workspace (supervision, priority high; source: owner, 2026-11-27)"
status: done
priority: P1
area: supervision
created: 2026-11-27
---

# Why

On 2026-11-27 one land attempt took 2 to 5 minutes. A successful land often took 15 to 30, because every "remote
moved" retry ran regeneration and every gate again, in a fresh candidate that compiled 208 external and 61 workspace
crates each time. A malformed plan failed only at the last land gate.

# Done when

Plan `261127-1345-land-reuses-gates-across-retries` is done:
- a retry reuses gates the trunk did not move under;
- land commands share one Cargo target;
- the census is scanned once per land;
- a malformed plan is refused at commit and by the first land gate.

# Notes

Owner request, 2026-11-27 12:54: "lâu quá, land xong tìm cách nào để mỗi lần land nhanh hơn".
