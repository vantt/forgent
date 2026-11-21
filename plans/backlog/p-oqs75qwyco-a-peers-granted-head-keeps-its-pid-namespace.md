---
id: p-oqs75qwyco
title: A peers-granted head keeps its pid namespace (agent confinement, priority medium)
status: proposed
priority: P2
area: agent-confinement
created: 2026-11-18
---

# Why

Today the secretary head drops `--unshare-pid` so Claude Code's SendMessage/ListAgents can verify peers; measured by OPC 2026-11-18: it lists the whole host process table and can `kill(2)` any same-user process (the run supervisor included). Since 2026-11-19 (owner decision, option A) both peer-sessions mounts are read-write so the head's own Claude Code registers and listens beside its peers; the head can therefore also delete or rewrite other sessions' registrations, keys and sockets. Tighter design: keep the pid namespace and answer peer liveness (and, if needed, SendMessage delivery) through a head-request socket verb the supervisor answers outside the sandbox, and publish the head's own registration and socket from the supervisor so the head no longer writes the shared session registry and socket directory. Evidence: `docs/platform/agent-confinement/spec.md` §9.1 grant `peer-sessions`; `plans/261118-0947-session-verb-for-agent-sessions/reports/phase-07b.md`, `reports/phase-07d.md`. Residual (OPC review of the one-session-record change, 2026-11-19): with read-write peer-sessions the head writes its own `<pid>.json`, so the CLI session name and socket Identity records for it are self-declared.

# Done when

A peers-granted head runs with `--unshare-pid`, ListAgents shows peers alive and SendMessage arrives both ways; a test proves it cannot signal a host process nor write another session's registration, key or socket.

# Notes

Migrated from the legacy backlog table. Original status: proposed.
