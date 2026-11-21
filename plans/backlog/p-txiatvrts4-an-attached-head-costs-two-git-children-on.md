---
id: p-txiatvrts4
title: An attached HEAD costs two git children on every Event Store read, although the read already lists the tips
status: done
priority: P2
area: general
created: 2026-11-21
---

# Why

After HARDEN T2, `resolve_head` brackets HEAD with `symbolic-ref` then one `rev-parse` (2 children; one `rev-parse` alone reads `.git/HEAD` several times and can pair one branch's commit with another branch's name). The store's tip read already runs one `for-each-ref`; if the Git port's tip read also returned which listed ref HEAD names (`%(HEAD)` in that same listing), the commit would be that ref's own listed value, so the name/commit pair cannot mix branches, and an attached HEAD would cost 0 extra children. Detached and unborn HEAD keep today's path. Needs OPC's judgement that `%(HEAD)` plus the listed value is an exact snapshot, a spec sentence, and an owning proof next to `tests/head_switch.rs`. Raised by WORK (loop.test seal/read cost, `plans/reports/debug-261023-1515-work-cutover-loop-test-time-attribution.md` on work/es-cutover).

# Done when

An Event Store read with an attached HEAD runs one git child for tips and HEAD together; a HEAD switch during the read never yields a mixed pair; detached and unborn answers unchanged.

# Notes

Migrated from the legacy backlog table. Original status: done.
