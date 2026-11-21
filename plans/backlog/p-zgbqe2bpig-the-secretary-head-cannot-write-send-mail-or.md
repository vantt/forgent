---
id: p-zgbqe2bpig
title: The secretary head cannot write, send mail or reach peers from its sandbox (agent confinement, priority high)
status: done
priority: P1
area: agent-confinement
created: 2026-11-18
---

# Why

Miu's bwrap launcher mounts the project and state dirs read-only and hides `/run/user/1000` and `/tmp`: a backlog edit fails with EROFS, the mailbox lock returns `lock-unavailable`, SendMessage to peer sockets fails, and Identity reports her as `cli=worker`, liveness unknown (2026-11-18, gen 4). The owner and other sessions had to relay by hand. Evidence: `plans/reports/debugger-261118-2130-miu-early-hard-rotation.md` (cause strongly suspected, the cli=worker part not traced). **Done 2026-11-19:** the secretary head gets its grants (writes, mailbox, peers, `fgos session write` for `docs/backlog.md`) and Identity resolves it as its `head:` role; plan `plans/261118-0947-session-verb-for-agent-sessions/plan.md` phases 7, 7b, 7c, 7d.

# Done when

A head persona gets the grants its role needs (at least mailbox send and its peers' sockets, write to the paths its skill edits) and Identity reports it as a head; or the role is documented as read-only and its skill routes every write through a door that works confined.

# Notes

Migrated from the legacy backlog table. Original status: done.
