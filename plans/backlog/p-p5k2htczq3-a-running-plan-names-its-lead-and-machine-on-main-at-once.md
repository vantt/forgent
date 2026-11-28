---
id: p-p5k2htczq3
title: "A running plan names its lead and machine on main at once: admission is never stranded locally (supervision, priority high; source: owner, 2026-11-27)"
status: done
priority: P1
area: supervision
created: 2026-11-27
---

# Why

On 2026-11-27 the keeper on fg-server admitted plan `261127-1220-confined-rust-offline`: it set `status: running`,
`lead` and `base` in `plan.md` and committed that on local main, but the push never happened. The commit sat on local
main for about 10 minutes, invisible to fg-server2, and refused every land on fg-server (`land-target-ahead`). A plan's
record names its lead but never the machine that runs it.

Owner, 2026-11-27: "khi một plan được đưa vào running, nó phải ngay lập tức được ghi nhận đang làm bởi ai, máy nào …
khi nó chuyển trạng thái thì sẽ lập tức được đẩy lên main".

# Done when

The discussion `ds-izibwo45vm-plan-claim-who-and-where` is settled, and its plan is done.

# Notes

Discussion: `plans/discussions/ds-izibwo45vm-plan-claim-who-and-where/DISCUSSION.md`.
