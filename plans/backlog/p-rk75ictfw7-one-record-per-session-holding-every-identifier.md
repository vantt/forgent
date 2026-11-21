---
id: p-rk75ictfw7
title: One record per session holding every identifier it has, findable by any one of them (identity, priority high; owner 2026-11-19)
status: done
priority: P1
area: identity
created: 2026-11-19
---

# Why

Today a session has six unconnected names: herdr tab label and pane id, Claude Code session name and socket (change on every restart), fgOS identity handle, lane/head role (`lead:X`, `head:secretary-miu`), mailbox address (e.g. `forgent-claude-36`), pid and head generation. Seen 2026-11-18: sends to stale sockets (ENOENT), Miu registered as `cli=worker` then `unregistered`, mailbox sender shown as `forgent-claude-36` instead of her role, ListAgents shows names without roles; Miu and leads guess addresses. **Done 2026-11-19:** Identity keeps one record per live session and `fgos identity resolve` answers it from any identifier; plan `plans/261118-0947-session-verb-for-agent-sessions/plan.md` phase 7e.

# Done when

Each live session has one record (Identity owns it) that stores all its identifiers and is updated on start, rotation and rename; `fgos identity` finds the record from any one identifier the caller has (pane, tab, session name, handle, role, mailbox address, pid) and returns the rest; mailbox and the head request path read it instead of guessing.

# Notes

Migrated from the legacy backlog table. Original status: done.
